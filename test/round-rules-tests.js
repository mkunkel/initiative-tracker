// Round Rules System Tests
const { expect } = require('chai');

describe('Round Rules System', function() {
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
            <div id="roundCompleteModal"></div>
        `;

        configManager = new GameConfigManager();

        // Create mock tracker
        tracker = {
            characters: [],
            gameConfig: null,
            configManager: configManager,
            currentRound: 1,

            async loadGameConfig(gameId) {
                this.gameConfig = await this.configManager.loadConfig(gameId);
                return this.gameConfig;
            },

            addCharacter(name, entityType = 'pc') {
                const character = {
                    id: Date.now() + Math.random(),
                    name,
                    entityType,
                    completed: false,
                    status: 'ondeck'
                };
                this.characters.push(character);
                return character;
            },

            checkRoundComplete() {
                if (!this.gameConfig?.entityTypes) {
                    // Fallback: all non-dead entities must complete
                    return this.characters
                        .filter(c => c.status !== 'dead')
                        .every(c => c.completed);
                }

                // Get entities that take turns
                const turnTakers = this.characters.filter(c => {
                    if (c.status === 'dead') return false;

                    const entityConfig = this.gameConfig.entityTypes[c.entityType];
                    return entityConfig && entityConfig.takeTurns;
                });

                // Round is complete when all turn-takers are complete
                return turnTakers.length > 0 && turnTakers.every(c => c.completed);
            },

            getEntitiesThatTakeTurns() {
                if (!this.gameConfig?.entityTypes) {
                    return this.characters.filter(c => c.status !== 'dead');
                }

                return this.characters.filter(c => {
                    if (c.status === 'dead') return false;

                    const entityConfig = this.gameConfig.entityTypes[c.entityType];
                    return entityConfig && entityConfig.takeTurns;
                });
            },

            startNextRound() {
                if (!this.gameConfig?.entityTypes) {
                    // Fallback: reset all non-dead characters
                    this.characters.forEach(c => {
                        if (c.status !== 'dead') {
                            c.completed = false;
                        }
                    });
                } else {
                    // Reset only entities that take turns
                    this.characters.forEach(c => {
                        const entityConfig = this.gameConfig.entityTypes[c.entityType];
                        if (entityConfig && entityConfig.takeTurns && c.status !== 'dead') {
                            c.completed = false;
                        }
                    });
                }

                this.currentRound++;
            }
        };
    });

    describe('Round Completion Detection - Default Game', function() {
        it('should detect round as incomplete when no characters completed', async function() {
            await tracker.loadGameConfig('default');

            tracker.addCharacter('Hero 1', 'pc');
            tracker.addCharacter('Hero 2', 'pc');

            expect(tracker.checkRoundComplete()).to.be.false;
        });

        it('should detect round as incomplete when some characters completed', async function() {
            await tracker.loadGameConfig('default');

            const char1 = tracker.addCharacter('Hero 1', 'pc');
            tracker.addCharacter('Hero 2', 'pc');

            char1.completed = true;

            expect(tracker.checkRoundComplete()).to.be.false;
        });

        it('should detect round as complete when all characters completed', async function() {
            await tracker.loadGameConfig('default');

            const char1 = tracker.addCharacter('Hero 1', 'pc');
            const char2 = tracker.addCharacter('Hero 2', 'pc');

            char1.completed = true;
            char2.completed = true;

            expect(tracker.checkRoundComplete()).to.be.true;
        });

        it('should consider both PCs and NPCs for round completion', async function() {
            await tracker.loadGameConfig('default');

            const pc = tracker.addCharacter('Hero', 'pc');
            const npc = tracker.addCharacter('NPC', 'npc');

            pc.completed = true;

            expect(tracker.checkRoundComplete()).to.be.false;

            npc.completed = true;

            expect(tracker.checkRoundComplete()).to.be.true;
        });

        it('should consider enemies for round completion', async function() {
            await tracker.loadGameConfig('default');

            const pc = tracker.addCharacter('Hero', 'pc');
            const enemy = tracker.addCharacter('Enemy', 'enemy');

            pc.completed = true;

            expect(tracker.checkRoundComplete()).to.be.false;

            enemy.completed = true;

            expect(tracker.checkRoundComplete()).to.be.true;
        });

        it('should ignore dead characters in round completion', async function() {
            await tracker.loadGameConfig('default');

            const char1 = tracker.addCharacter('Hero 1', 'pc');
            const char2 = tracker.addCharacter('Hero 2', 'pc');

            char1.completed = true;
            char2.status = 'dead';

            expect(tracker.checkRoundComplete()).to.be.true;
        });
    });

    describe('Round Completion Detection - Eat the Reich', function() {
        it('should detect round as complete when all PCs completed', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const char1 = tracker.addCharacter('Vampire 1', 'pc');
            const char2 = tracker.addCharacter('Vampire 2', 'pc');

            char1.completed = true;
            char2.completed = true;

            expect(tracker.checkRoundComplete()).to.be.true;
        });

        it('should not wait for enemies to complete round', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const pc = tracker.addCharacter('Vampire', 'pc');
            const enemy = tracker.addCharacter('Nazi', 'enemy');

            pc.completed = true;
            enemy.completed = false;

            expect(tracker.checkRoundComplete()).to.be.true;
        });

        it('should detect round as incomplete if any PC not completed', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const char1 = tracker.addCharacter('Vampire 1', 'pc');
            const char2 = tracker.addCharacter('Vampire 2', 'pc');
            tracker.addCharacter('Nazi', 'enemy');

            char1.completed = true;
            char2.completed = false;

            expect(tracker.checkRoundComplete()).to.be.false;
        });

        it('should not consider NPCs in Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const pc = tracker.addCharacter('Vampire', 'pc');
            // This shouldn't be possible in real usage, but test it
            const npc = tracker.addCharacter('NPC', 'npc');

            pc.completed = true;
            npc.completed = false;

            // NPC doesn't take turns in Eat the Reich, so round is complete
            expect(tracker.checkRoundComplete()).to.be.true;
        });

        it('should ignore dead PCs in round completion', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const char1 = tracker.addCharacter('Vampire 1', 'pc');
            const char2 = tracker.addCharacter('Vampire 2', 'pc');

            char1.completed = true;
            char2.status = 'dead';

            expect(tracker.checkRoundComplete()).to.be.true;
        });
    });

    describe('Turn-Taking Entities', function() {
        it('should identify all entities as turn-takers in default game', async function() {
            await tracker.loadGameConfig('default');

            tracker.addCharacter('Hero', 'pc');
            tracker.addCharacter('NPC', 'npc');
            tracker.addCharacter('Enemy', 'enemy');

            const turnTakers = tracker.getEntitiesThatTakeTurns();
            expect(turnTakers).to.have.length(3);
        });

        it('should identify only PCs as turn-takers in Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            tracker.addCharacter('Vampire', 'pc');
            tracker.addCharacter('Nazi 1', 'enemy');
            tracker.addCharacter('Nazi 2', 'enemy');

            const turnTakers = tracker.getEntitiesThatTakeTurns();
            expect(turnTakers).to.have.length(1);
            expect(turnTakers[0].name).to.equal('Vampire');
        });

        it('should exclude dead entities from turn-takers', async function() {
            await tracker.loadGameConfig('default');

            const char1 = tracker.addCharacter('Hero 1', 'pc');
            tracker.addCharacter('Hero 2', 'pc');

            char1.status = 'dead';

            const turnTakers = tracker.getEntitiesThatTakeTurns();
            expect(turnTakers).to.have.length(1);
        });
    });

    describe('Next Round Behavior', function() {
        it('should reset all turn-takers in default game', async function() {
            await tracker.loadGameConfig('default');

            const char1 = tracker.addCharacter('Hero', 'pc');
            const char2 = tracker.addCharacter('Enemy', 'enemy');

            char1.completed = true;
            char2.completed = true;

            tracker.startNextRound();

            expect(char1.completed).to.be.false;
            expect(char2.completed).to.be.false;
            expect(tracker.currentRound).to.equal(2);
        });

        it('should only reset PCs in Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const pc = tracker.addCharacter('Vampire', 'pc');
            const enemy = tracker.addCharacter('Nazi', 'enemy');

            pc.completed = true;
            enemy.completed = true;

            tracker.startNextRound();

            expect(pc.completed).to.be.false;
            expect(enemy.completed).to.be.true; // Should stay true
            expect(tracker.currentRound).to.equal(2);
        });

        it('should not reset dead characters', async function() {
            await tracker.loadGameConfig('default');

            const char1 = tracker.addCharacter('Hero', 'pc');
            const char2 = tracker.addCharacter('Dead Hero', 'pc');

            char1.completed = true;
            char2.completed = true;
            char2.status = 'dead';

            tracker.startNextRound();

            expect(char1.completed).to.be.false;
            expect(char2.completed).to.be.true; // Dead, should not reset
        });

        it('should increment round number', async function() {
            await tracker.loadGameConfig('default');

            tracker.addCharacter('Hero', 'pc');

            expect(tracker.currentRound).to.equal(1);

            tracker.startNextRound();
            expect(tracker.currentRound).to.equal(2);

            tracker.startNextRound();
            expect(tracker.currentRound).to.equal(3);
        });
    });

    describe('Backwards Compatibility', function() {
        it('should work without game config', async function() {
            tracker.gameConfig = null;

            const char1 = tracker.addCharacter('Hero 1', 'pc');
            const char2 = tracker.addCharacter('Hero 2', 'pc');

            char1.completed = true;

            expect(tracker.checkRoundComplete()).to.be.false;

            char2.completed = true;

            expect(tracker.checkRoundComplete()).to.be.true;
        });

        it('should reset all characters without game config', async function() {
            tracker.gameConfig = null;

            const char1 = tracker.addCharacter('Hero', 'pc');
            const char2 = tracker.addCharacter('Enemy', 'enemy');

            char1.completed = true;
            char2.completed = true;

            tracker.startNextRound();

            expect(char1.completed).to.be.false;
            expect(char2.completed).to.be.false;
        });
    });

    describe('Edge Cases', function() {
        it('should handle no characters', async function() {
            await tracker.loadGameConfig('default');

            expect(tracker.checkRoundComplete()).to.be.false;
        });

        it('should handle all characters dead', async function() {
            await tracker.loadGameConfig('default');

            const char1 = tracker.addCharacter('Hero 1', 'pc');
            const char2 = tracker.addCharacter('Hero 2', 'pc');

            char1.status = 'dead';
            char2.status = 'dead';

            expect(tracker.checkRoundComplete()).to.be.false;
        });

        it('should handle mixed entity types with different turn rules', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const pc1 = tracker.addCharacter('Vampire 1', 'pc');
            const pc2 = tracker.addCharacter('Vampire 2', 'pc');
            const enemy1 = tracker.addCharacter('Nazi 1', 'enemy');
            const enemy2 = tracker.addCharacter('Nazi 2', 'enemy');

            pc1.completed = true;
            enemy1.completed = true;
            enemy2.completed = true;

            // Only one PC completed, should be incomplete
            expect(tracker.checkRoundComplete()).to.be.false;

            pc2.completed = true;

            // All PCs completed, should be complete (regardless of enemies)
            expect(tracker.checkRoundComplete()).to.be.true;
        });
    });
});

