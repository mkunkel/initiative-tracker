// Game Configuration Manager Tests

// Import dependencies
const { expect } = require('chai');

// Import GameConfigManager (will be created)
let GameConfigManager;
try {
    GameConfigManager = require('../js/game-config.js');
} catch (e) {
    // Module doesn't exist yet - this is expected in RED phase
}

describe('GameConfigManager', function() {
    let configManager;

    beforeEach(function() {
        if (GameConfigManager) {
            configManager = new GameConfigManager();
        }
    });

    describe('Initialization', function() {
        it('should create GameConfigManager instance', function() {
            expect(GameConfigManager).to.exist;
            expect(configManager).to.be.an.instanceof(GameConfigManager);
        });

        it('should initialize with empty config cache', function() {
            expect(configManager).to.exist;
            expect(configManager.configs).to.exist;
            expect(configManager.configs).to.be.an('object');
            expect(Object.keys(configManager.configs)).to.have.lengthOf(0);
        });
    });

    describe('Configuration Loading', function() {
        it('should have loadConfig method', function() {
            expect(configManager.loadConfig).to.be.a('function');
        });

        it('should load valid configuration file', async function() {
            // This will fail until we create a test config file
            const config = await configManager.loadConfig('test-game');
            expect(config).to.exist;
            expect(config).to.be.an('object');
        });

        it('should return null for non-existent configuration', async function() {
            const config = await configManager.loadConfig('non-existent-game');
            expect(config).to.be.null;
        });

        it('should parse JSON configuration correctly', async function() {
            const config = await configManager.loadConfig('test-game');
            expect(config).to.have.property('id');
            expect(config).to.have.property('name');
            expect(config).to.have.property('resources');
        });
    });

    describe('Configuration Validation', function() {
        it('should validate required fields exist', function() {
            expect(configManager.validateConfig).to.be.a('function');

            const validConfig = {
                id: 'test',
                name: 'Test Game',
                themeFile: 'themes/test.css',
                resources: {
                    primary: {
                        name: 'hp',
                        displayName: 'Hit Points',
                        min: 0,
                        max: null,
                        default: 10,
                        causesDeathAtMin: true
                    }
                }
            };

            expect(configManager.validateConfig(validConfig)).to.be.true;
        });

        it('should reject config missing id field', function() {
            const invalidConfig = {
                name: 'Test Game',
                resources: { primary: {} }
            };
            expect(configManager.validateConfig(invalidConfig)).to.be.false;
        });

        it('should reject config missing name field', function() {
            const invalidConfig = {
                id: 'test',
                resources: { primary: {} }
            };
            expect(configManager.validateConfig(invalidConfig)).to.be.false;
        });

        it('should reject config missing resources.primary', function() {
            const invalidConfig = {
                id: 'test',
                name: 'Test Game',
                resources: {}
            };
            expect(configManager.validateConfig(invalidConfig)).to.be.false;
        });

        it('should reject config with invalid primary resource', function() {
            const invalidConfig = {
                id: 'test',
                name: 'Test Game',
                resources: {
                    primary: {
                        // missing required fields
                    }
                }
            };
            expect(configManager.validateConfig(invalidConfig)).to.be.false;
        });
    });

    describe('Configuration Caching', function() {
        it('should cache loaded configurations', async function() {
            const config1 = await configManager.loadConfig('test-game');
            const config2 = await configManager.loadConfig('test-game');

            // Should return same cached object
            expect(config1).to.equal(config2);
            expect(configManager.configs['test-game']).to.exist;
        });

        it('should not make duplicate network requests for cached configs', async function() {
            // Load once
            await configManager.loadConfig('test-game');

            // Load again - should use cache
            const config = await configManager.loadConfig('test-game');
            expect(config).to.exist;
        });
    });

    describe('Configuration Retrieval', function() {
        it('should have getConfig method', function() {
            expect(configManager.getConfig).to.be.a('function');
        });

        it('should retrieve loaded config by id', async function() {
            await configManager.loadConfig('test-game');
            const config = configManager.getConfig('test-game');

            expect(config).to.exist;
            expect(config.id).to.equal('test-game');
        });

        it('should return null for config that was not loaded', function() {
            const config = configManager.getConfig('non-existent');
            expect(config).to.be.null;
        });
    });

    describe('Get All Games', function() {
        it('should have getAllGames method', function() {
            expect(configManager.getAllGames).to.be.a('function');
        });

        it('should return array of loaded game configs', async function() {
            await configManager.loadConfig('test-game');
            const games = configManager.getAllGames();

            expect(games).to.be.an('array');
            expect(games).to.have.lengthOf.at.least(1);
        });

        it('should return empty array when no configs loaded', function() {
            const games = configManager.getAllGames();
            expect(games).to.be.an('array');
            expect(games).to.have.lengthOf(0);
        });
    });

    describe('Error Handling', function() {
        it('should handle malformed JSON gracefully', async function() {
            const config = await configManager.loadConfig('malformed-json');
            expect(config).to.be.null;
        });

        it('should handle network errors gracefully', async function() {
            const config = await configManager.loadConfig('network-error');
            expect(config).to.be.null;
        });

        it('should not cache invalid configurations', async function() {
            await configManager.loadConfig('invalid-config');
            const cached = configManager.configs['invalid-config'];
            expect(cached).to.not.exist;
        });
    });
});

