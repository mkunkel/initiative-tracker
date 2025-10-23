// Dynamic Resource System Tests
const { expect } = require('chai');

describe('Dynamic Resource System', function() {
    let tracker;
    let GameConfigManager;
    let configManager;

    before(function() {
        // Load GameConfigManager
        GameConfigManager = require('../js/game-config.js');
    });

    beforeEach(async function() {
        // Clear localStorage
        localStorage.clear();

        // Create basic DOM structure
        document.body.innerHTML = `
            <div id="onDeckList"></div>
            <div id="completedList"></div>
            <div id="stunnedList"></div>
            <div id="deadList"></div>
        `;

        // Initialize config manager
        configManager = new GameConfigManager();

        // Create mock tracker with resource support
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
                    isEnemy: false,
                    entityType: 'pc',
                    completed: false
                };
                this.characters.push(char);
                return char;
            },

            increaseResource(characterId, amount = 1) {
                const char = this.characters.find(c => c.id === characterId);
                if (!char) return false;

                const primary = this.gameConfig?.resources.primary;

                // If max is null in config, there's no limit
                if (primary && primary.max === null) {
                    char.primaryResource.value += amount;
                } else {
                    const max = primary?.max !== undefined ? primary.max : char.primaryResource.max;
                    char.primaryResource.value = Math.min(
                        char.primaryResource.value + amount,
                        max
                    );
                }

                return true;
            },

            decreaseResource(characterId, amount = 1) {
                const char = this.characters.find(c => c.id === characterId);
                if (!char) return false;

                const primary = this.gameConfig?.resources.primary;
                const min = primary?.min !== undefined ? primary.min : 0;

                char.primaryResource.value = Math.max(
                    char.primaryResource.value - amount,
                    min
                );

                // Check for death
                if (primary?.causesDeathAtMin && char.primaryResource.value === min) {
                    char.isDead = true;
                }

                return true;
            },

            migrateCharacterData(character) {
                // Migrate old HP format to new resource format
                if ('hp' in character && !character.primaryResource) {
                    character.primaryResource = {
                        value: character.hp,
                        max: character.maxHP || character.hp,
                        name: 'hp'
                    };
                    delete character.hp;
                    delete character.maxHP;
                }
                return character;
            }
        };
    });

    describe('Resource Initialization', function() {
        it('should use HP as default resource name', async function() {
            await tracker.loadGameConfig('default');
            expect(tracker.gameConfig.resources.primary.name).to.equal('hp');
        });

        it('should use Blood for Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            expect(tracker.gameConfig.resources.primary.name).to.equal('blood');
        });

        it('should store resource with custom name in character', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            expect(char.primaryResource).to.exist;
            expect(char.primaryResource.name).to.equal('blood');
            expect(char.primaryResource.value).to.equal(10);
        });

        it('should use default value from config', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            expect(tracker.gameConfig.resources.primary.default).to.equal(0);
        });
    });

    describe('Resource Min/Max Constraints', function() {
        it('should enforce minimum value of 0 for HP games', async function() {
            await tracker.loadGameConfig('mork-borg');
            const char = tracker.addCharacter('Test', 5);

            tracker.decreaseResource(char.id, 10);
            expect(char.primaryResource.value).to.equal(0);
        });

        it('should enforce maximum value of 10 for Blood', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 5);

            tracker.increaseResource(char.id, 10);
            expect(char.primaryResource.value).to.equal(10);
        });

        it('should allow unlimited max when config max is null', async function() {
            await tracker.loadGameConfig('default');
            const char = tracker.addCharacter('Test', 10);

            tracker.increaseResource(char.id, 100);
            expect(char.primaryResource.value).to.equal(110);
        });
    });

    describe('Death Condition', function() {
        it('should cause death at min for HP-based games', async function() {
            await tracker.loadGameConfig('mork-borg');
            const char = tracker.addCharacter('Test', 5);

            tracker.decreaseResource(char.id, 5);
            expect(char.isDead).to.be.true;
        });

        it('should NOT cause death at 0 Blood in Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 10);

            tracker.decreaseResource(char.id, 10);
            expect(char.primaryResource.value).to.equal(0);
            expect(char.isDead).to.not.be.true;
        });
    });

    describe('Resource Increment/Decrement', function() {
        it('should increment resource by configured amount', async function() {
            await tracker.loadGameConfig('default');
            const char = tracker.addCharacter('Test', 10);

            tracker.increaseResource(char.id, 1);
            expect(char.primaryResource.value).to.equal(11);
        });

        it('should decrement resource by configured amount', async function() {
            await tracker.loadGameConfig('default');
            const char = tracker.addCharacter('Test', 10);

            tracker.decreaseResource(char.id, 3);
            expect(char.primaryResource.value).to.equal(7);
        });

        it('should respect resource constraints on increment', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            const char = tracker.addCharacter('Test', 9);

            tracker.increaseResource(char.id, 5);
            expect(char.primaryResource.value).to.equal(10);
        });
    });

    describe('Data Migration', function() {
        it('should migrate old HP format to primaryResource', function() {
            const oldChar = {
                id: 1,
                name: 'Old Character',
                hp: 15,
                maxHP: 20,
                isEnemy: false
            };

            const migrated = tracker.migrateCharacterData(oldChar);

            expect(migrated.primaryResource).to.exist;
            expect(migrated.primaryResource.value).to.equal(15);
            expect(migrated.primaryResource.max).to.equal(20);
            expect(migrated.primaryResource.name).to.equal('hp');
            expect(migrated.hp).to.be.undefined;
            expect(migrated.maxHP).to.be.undefined;
        });

        it('should not modify already-migrated characters', function() {
            const newChar = {
                id: 1,
                name: 'New Character',
                primaryResource: {
                    value: 10,
                    max: 10,
                    name: 'blood'
                },
                isEnemy: false
            };

            const migrated = tracker.migrateCharacterData(newChar);

            expect(migrated.primaryResource.value).to.equal(10);
            expect(migrated.primaryResource.name).to.equal('blood');
        });

        it('should handle character with only HP value', function() {
            const oldChar = {
                id: 1,
                name: 'Old Character',
                hp: 8,
                isEnemy: false
            };

            const migrated = tracker.migrateCharacterData(oldChar);

            expect(migrated.primaryResource).to.exist;
            expect(migrated.primaryResource.value).to.equal(8);
            expect(migrated.primaryResource.max).to.equal(8);
        });
    });

    describe('Config-Specific Behavior', function() {
        it('should load correct config for each game', async function() {
            const games = ['default', 'mork-borg', 'pirate-borg', 'cy-borg', 'corp-borg', 'eat-the-reich'];

            for (const game of games) {
                await tracker.loadGameConfig(game);
                expect(tracker.gameConfig).to.exist;
                expect(tracker.gameConfig.id).to.equal(game);
                expect(tracker.gameConfig.resources.primary).to.exist;
            }
        });

        it('should use different default values per game', async function() {
            await tracker.loadGameConfig('default');
            expect(tracker.gameConfig.resources.primary.default).to.equal(10);

            await tracker.loadGameConfig('mork-borg');
            expect(tracker.gameConfig.resources.primary.default).to.equal(5);

            await tracker.loadGameConfig('eat-the-reich');
            expect(tracker.gameConfig.resources.primary.default).to.equal(0);
        });
    });
});

