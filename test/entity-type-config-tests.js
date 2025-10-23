// Entity Type Configuration Tests
const { expect } = require('chai');

describe('Entity Type Configuration', function() {
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
            <div id="addCharacterModal">
                <div id="entityTypeSelector"></div>
            </div>
        `;

        configManager = new GameConfigManager();

        // Create mock tracker
        tracker = {
            characters: [],
            gameConfig: null,
            configManager: configManager,

            async loadGameConfig(gameId) {
                this.gameConfig = await this.configManager.loadConfig(gameId);
                return this.gameConfig;
            },

            getEnabledEntityTypes() {
                if (!this.gameConfig?.entityTypes) {
                    return ['pc', 'npc', 'enemy'];
                }

                const enabled = [];
                for (const [type, config] of Object.entries(this.gameConfig.entityTypes)) {
                    if (config.enabled) {
                        enabled.push(type);
                    }
                }
                return enabled;
            },

            isEntityTypeEnabled(type) {
                if (!this.gameConfig?.entityTypes || !this.gameConfig.entityTypes[type]) {
                    return true; // Default to enabled
                }
                return this.gameConfig.entityTypes[type].enabled !== false;
            },

            canConvertEntityType(entityType) {
                if (entityType === 'enemy') return false;

                // Check if both PC and NPC are enabled
                return this.isEntityTypeEnabled('pc') && this.isEntityTypeEnabled('npc');
            },

            renderEntityTypeSelector() {
                const enabledTypes = this.getEnabledEntityTypes().filter(t => t !== 'enemy');
                return enabledTypes;
            }
        };
    });

    describe('Entity Type Reading from Config', function() {
        it('should read enabled entity types for default game', async function() {
            await tracker.loadGameConfig('default');

            expect(tracker.isEntityTypeEnabled('pc')).to.be.true;
            expect(tracker.isEntityTypeEnabled('npc')).to.be.true;
            expect(tracker.isEntityTypeEnabled('enemy')).to.be.true;
        });

        it('should detect that NPCs are disabled in Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            expect(tracker.isEntityTypeEnabled('pc')).to.be.true;
            expect(tracker.isEntityTypeEnabled('npc')).to.be.false;
            expect(tracker.isEntityTypeEnabled('enemy')).to.be.true;
        });

        it('should get list of all enabled entity types', async function() {
            await tracker.loadGameConfig('default');

            const enabled = tracker.getEnabledEntityTypes();
            expect(enabled).to.include('pc');
            expect(enabled).to.include('npc');
            expect(enabled).to.include('enemy');
        });

        it('should exclude disabled types from enabled list', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const enabled = tracker.getEnabledEntityTypes();
            expect(enabled).to.include('pc');
            expect(enabled).to.not.include('npc');
            expect(enabled).to.include('enemy');
        });
    });

    describe('Entity Type Conversion Rules', function() {
        it('should allow PC/NPC conversion when both are enabled', async function() {
            await tracker.loadGameConfig('default');

            expect(tracker.canConvertEntityType('pc')).to.be.true;
            expect(tracker.canConvertEntityType('npc')).to.be.true;
        });

        it('should not allow PC/NPC conversion when NPC is disabled', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            expect(tracker.canConvertEntityType('pc')).to.be.false;
            expect(tracker.canConvertEntityType('npc')).to.be.false;
        });

        it('should never allow enemy conversion', async function() {
            await tracker.loadGameConfig('default');

            expect(tracker.canConvertEntityType('enemy')).to.be.false;
        });

        it('should never allow enemy conversion even if config missing', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            expect(tracker.canConvertEntityType('enemy')).to.be.false;
        });
    });

    describe('Entity Type Selector UI', function() {
        it('should show PC and NPC options for default game', async function() {
            await tracker.loadGameConfig('default');

            const types = tracker.renderEntityTypeSelector();
            expect(types).to.include('pc');
            expect(types).to.include('npc');
            expect(types).to.not.include('enemy');
        });

        it('should show only PC option for Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const types = tracker.renderEntityTypeSelector();
            expect(types).to.include('pc');
            expect(types).to.not.include('npc');
            expect(types).to.not.include('enemy');
        });

        it('should never show enemy in character creation selector', async function() {
            await tracker.loadGameConfig('default');

            const types = tracker.renderEntityTypeSelector();
            expect(types).to.not.include('enemy');
        });
    });

    describe('Entity Type Labels and Icons', function() {
        it('should read PC label from config', async function() {
            await tracker.loadGameConfig('default');

            expect(tracker.gameConfig.entityTypes.pc.label).to.equal('PC');
        });

        it('should read PC icon from config', async function() {
            await tracker.loadGameConfig('default');

            expect(tracker.gameConfig.entityTypes.pc.icon).to.equal('👤');
        });

        it('should use custom vampire icon for Eat the Reich PCs', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            expect(tracker.gameConfig.entityTypes.pc.icon).to.equal('🧛');
        });

        it('should read entity type labels from all games', async function() {
            const games = ['default', 'mork-borg', 'pirate-borg', 'cy-borg', 'corp-borg', 'eat-the-reich'];

            for (const game of games) {
                await tracker.loadGameConfig(game);

                if (tracker.gameConfig.entityTypes.pc.enabled) {
                    expect(tracker.gameConfig.entityTypes.pc.label).to.exist;
                    expect(tracker.gameConfig.entityTypes.pc.icon).to.exist;
                }
            }
        });
    });

    describe('Take Turns Configuration', function() {
        it('should read takeTurns flag for all entity types', async function() {
            await tracker.loadGameConfig('default');

            expect(tracker.gameConfig.entityTypes.pc.takeTurns).to.be.true;
            expect(tracker.gameConfig.entityTypes.npc.takeTurns).to.be.true;
            expect(tracker.gameConfig.entityTypes.enemy.takeTurns).to.be.true;
        });

        it('should detect that enemies do not take turns in Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            expect(tracker.gameConfig.entityTypes.pc.takeTurns).to.be.true;
            expect(tracker.gameConfig.entityTypes.enemy.takeTurns).to.be.false;
        });
    });

    describe('Backwards Compatibility', function() {
        it('should default to all types enabled if config missing', async function() {
            // Mock missing config
            tracker.gameConfig = null;

            expect(tracker.isEntityTypeEnabled('pc')).to.be.true;
            expect(tracker.isEntityTypeEnabled('npc')).to.be.true;
            expect(tracker.isEntityTypeEnabled('enemy')).to.be.true;
        });

        it('should handle missing entityTypes section', async function() {
            tracker.gameConfig = { resources: {} };

            const enabled = tracker.getEnabledEntityTypes();
            expect(enabled).to.include('pc');
            expect(enabled).to.include('npc');
            expect(enabled).to.include('enemy');
        });
    });
});

