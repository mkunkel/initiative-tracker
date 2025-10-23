// Custom Tracker System Tests
const { expect } = require('chai');

describe('Custom Tracker System', function() {
    let tracker;
    let GameConfigManager;
    let configManager;

    before(function() {
        GameConfigManager = require('../js/game-config.js');
    });

    beforeEach(async function() {
        localStorage.clear();

        document.body.innerHTML = `
            <div id="onDeckList"></div>
            <div id="completedList"></div>
            <div id="stunnedList"></div>
            <div id="deadList"></div>
        `;

        configManager = new GameConfigManager();

        // Create mock tracker with tracker support
        tracker = {
            characters: [],
            gameConfig: null,
            configManager: configManager,

            async loadGameConfig(gameId) {
                this.gameConfig = await this.configManager.loadConfig(gameId);
                return this.gameConfig;
            },

            addCharacter(name, resource) {
                const char = {
                    id: Date.now() + Math.random(),
                    name: name,
                    primaryResource: {
                        value: resource,
                        max: resource,
                        name: this.gameConfig?.resources.primary.name || 'hp'
                    },
                    trackers: this.initializeTrackers(),
                    isEnemy: false,
                    entityType: 'pc',
                    completed: false
                };
                this.characters.push(char);
                return char;
            },

            initializeTrackers() {
                if (!this.gameConfig?.customTrackers) {
                    return {};
                }

                const trackers = {};
                for (const tracker of this.gameConfig.customTrackers) {
                    if (tracker.type === 'checkbox') {
                        // Initialize array of false values
                        trackers[tracker.id] = new Array(tracker.count).fill(false);
                    }
                }
                return trackers;
            },

            updateTracker(characterId, trackerId, index, value) {
                const char = this.characters.find(c => c.id === characterId);
                if (!char || !char.trackers || !char.trackers[trackerId]) {
                    return false;
                }

                if (index < 0 || index >= char.trackers[trackerId].length) {
                    return false;
                }

                char.trackers[trackerId][index] = value;
                return true;
            },

            getTrackerValue(characterId, trackerId, index) {
                const char = this.characters.find(c => c.id === characterId);
                if (!char || !char.trackers || !char.trackers[trackerId]) {
                    return null;
                }

                return char.trackers[trackerId][index];
            },

            getApplicableTrackers(entityType) {
                if (!this.gameConfig?.customTrackers) {
                    return [];
                }

                return this.gameConfig.customTrackers.filter(tracker => {
                    if (entityType === 'pc') return tracker.appliesToPC;
                    if (entityType === 'npc') return tracker.appliesToNPC;
                    if (entityType === 'enemy') return tracker.appliesToEnemy;
                    return false;
                });
            }
        };
    });

    describe('Tracker Initialization', function() {
        it('should initialize empty trackers for games without custom trackers', async function() {
            await tracker.loadGameConfig('default');
            const char = tracker.addCharacter('Test', 10);

            expect(char.trackers).to.exist;
            expect(Object.keys(char.trackers)).to.have.lengthOf(0);
        });

        it('should initialize injury trackers for Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            expect(char.trackers).to.exist;
            expect(char.trackers['injuries-1-2']).to.exist;
            expect(char.trackers['injuries-2-3']).to.exist;
            expect(char.trackers['injuries-3-4']).to.exist;
        });

        it('should initialize checkbox trackers with correct count', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            expect(char.trackers['injuries-1-2']).to.have.lengthOf(2);
            expect(char.trackers['injuries-2-3']).to.have.lengthOf(2);
            expect(char.trackers['injuries-3-4']).to.have.lengthOf(2);
        });

        it('should initialize all checkboxes as unchecked', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            expect(char.trackers['injuries-1-2']).to.deep.equal([false, false]);
            expect(char.trackers['injuries-2-3']).to.deep.equal([false, false]);
            expect(char.trackers['injuries-3-4']).to.deep.equal([false, false]);
        });
    });

    describe('Tracker Updates', function() {
        it('should update checkbox value', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            const result = tracker.updateTracker(char.id, 'injuries-1-2', 0, true);
            expect(result).to.be.true;
            expect(char.trackers['injuries-1-2'][0]).to.be.true;
            expect(char.trackers['injuries-1-2'][1]).to.be.false;
        });

        it('should update multiple checkboxes independently', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            tracker.updateTracker(char.id, 'injuries-1-2', 0, true);
            tracker.updateTracker(char.id, 'injuries-1-2', 1, true);
            tracker.updateTracker(char.id, 'injuries-2-3', 0, true);

            expect(char.trackers['injuries-1-2']).to.deep.equal([true, true]);
            expect(char.trackers['injuries-2-3']).to.deep.equal([true, false]);
            expect(char.trackers['injuries-3-4']).to.deep.equal([false, false]);
        });

        it('should toggle checkbox value', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            tracker.updateTracker(char.id, 'injuries-1-2', 0, true);
            expect(char.trackers['injuries-1-2'][0]).to.be.true;

            tracker.updateTracker(char.id, 'injuries-1-2', 0, false);
            expect(char.trackers['injuries-1-2'][0]).to.be.false;
        });

        it('should return false for invalid character', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const result = tracker.updateTracker(999, 'injuries-1-2', 0, true);
            expect(result).to.be.false;
        });

        it('should return false for invalid tracker', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            const result = tracker.updateTracker(char.id, 'invalid-tracker', 0, true);
            expect(result).to.be.false;
        });

        it('should return false for invalid index', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            const result = tracker.updateTracker(char.id, 'injuries-1-2', 5, true);
            expect(result).to.be.false;
        });
    });

    describe('Tracker Retrieval', function() {
        it('should get checkbox value', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            tracker.updateTracker(char.id, 'injuries-1-2', 0, true);
            const value = tracker.getTrackerValue(char.id, 'injuries-1-2', 0);

            expect(value).to.be.true;
        });

        it('should return null for invalid character', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const value = tracker.getTrackerValue(999, 'injuries-1-2', 0);
            expect(value).to.be.null;
        });

        it('should return null for invalid tracker', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            const value = tracker.getTrackerValue(char.id, 'invalid-tracker', 0);
            expect(value).to.be.null;
        });
    });

    describe('Entity Type Filtering', function() {
        it('should return trackers applicable to PCs', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const applicableTrackers = tracker.getApplicableTrackers('pc');
            expect(applicableTrackers).to.have.lengthOf(3);
            expect(applicableTrackers[0].id).to.equal('injuries-1-2');
        });

        it('should return empty array for NPCs in Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const applicableTrackers = tracker.getApplicableTrackers('npc');
            expect(applicableTrackers).to.have.lengthOf(0);
        });

        it('should return empty array for enemies in Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const applicableTrackers = tracker.getApplicableTrackers('enemy');
            expect(applicableTrackers).to.have.lengthOf(0);
        });

        it('should return empty array for games without trackers', async function() {
            await tracker.loadGameConfig('default');

            const applicableTrackers = tracker.getApplicableTrackers('pc');
            expect(applicableTrackers).to.have.lengthOf(0);
        });
    });

    describe('Tracker Configuration', function() {
        it('should read tracker labels from config', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const trackers = tracker.gameConfig.customTrackers;
            expect(trackers[0].label).to.equal('1-2');
            expect(trackers[1].label).to.equal('2-3');
            expect(trackers[2].label).to.equal('3-4');
        });

        it('should read tracker group labels from config', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const trackers = tracker.gameConfig.customTrackers;
            expect(trackers[0].groupLabel).to.equal('Injuries');
            expect(trackers[1].groupLabel).to.equal('Injuries');
            expect(trackers[2].groupLabel).to.equal('Injuries');
        });

        it('should read tracker types from config', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const trackers = tracker.gameConfig.customTrackers;
            expect(trackers[0].type).to.equal('checkbox');
            expect(trackers[1].type).to.equal('checkbox');
            expect(trackers[2].type).to.equal('checkbox');
        });
    });
});

