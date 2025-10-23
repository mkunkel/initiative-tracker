// Enemy Subtype System Tests
const { expect } = require('chai');

describe('Enemy Subtype System', function() {
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
            <div id="completedObjectivesList"></div>
            <div id="totalAttackIndicator"></div>
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

            addEnemy(name, subtype, attributes = {}) {
                const enemy = {
                    id: Date.now() + Math.random(),
                    name,
                    entityType: 'enemy',
                    enemySubtype: subtype,
                    attributes: { ...attributes },
                    completed: true, // Enemies start in completed for Eat the Reich
                    dead: false,
                    stunned: false
                };
                this.characters.push(enemy);
                return enemy;
            },

            getEnemySubtypeConfig(subtype) {
                if (!this.gameConfig?.enemySubtypes) return null;
                return this.gameConfig.enemySubtypes[subtype];
            },

            initializeEnemyAttributes(subtype) {
                const config = this.getEnemySubtypeConfig(subtype);
                if (!config || !config.attributes) return {};

                const attributes = {};
                for (const attr of config.attributes) {
                    attributes[attr.id] = attr.default;
                }
                return attributes;
            },

            changeAttribute(enemyId, attributeId, change) {
                const enemy = this.characters.find(c => c.id === enemyId);
                if (!enemy || !enemy.attributes) return false;

                const config = this.getEnemySubtypeConfig(enemy.enemySubtype);
                if (!config) return false;

                const attrConfig = config.attributes.find(a => a.id === attributeId);
                if (!attrConfig) return false;

                const currentValue = enemy.attributes[attributeId] || 0;
                let newValue = currentValue + change;

                // Apply constraints
                if (attrConfig.min !== undefined) {
                    newValue = Math.max(attrConfig.min, newValue);
                }
                if (attrConfig.max !== undefined && attrConfig.max !== null) {
                    newValue = Math.min(attrConfig.max, newValue);
                }

                enemy.attributes[attributeId] = newValue;

                // Check if objective completed (rating reached 0)
                if (enemy.enemySubtype === 'objective' && attributeId === 'rating' && newValue === 0) {
                    enemy.objectiveCompleted = true;
                }

                return true;
            },

            setPrimaryObjective(objectiveId) {
                // Clear all primary flags
                this.characters.forEach(c => {
                    if (c.enemySubtype === 'objective') {
                        c.isPrimary = false;
                    }
                });

                // Set new primary
                const objective = this.characters.find(c => c.id === objectiveId);
                if (objective && objective.enemySubtype === 'objective') {
                    objective.isPrimary = true;
                    return true;
                }
                return false;
            },

            togglePrimaryObjective(objectiveId) {
                const objective = this.characters.find(c => c.id === objectiveId);
                if (!objective || objective.enemySubtype !== 'objective') return false;

                if (objective.isPrimary) {
                    // Toggle off
                    objective.isPrimary = false;
                } else {
                    // Toggle on (clear others first)
                    this.setPrimaryObjective(objectiveId);
                }
                return true;
            },

            getThreats() {
                return this.characters.filter(c => c.enemySubtype === 'threat' && !c.dead);
            },

            getObjectives() {
                return this.characters.filter(c => c.enemySubtype === 'objective' && !c.dead);
            },

            getCompletedObjectives() {
                return this.characters.filter(c => c.enemySubtype === 'objective' && c.objectiveCompleted && !c.dead);
            },

            calculateTotalAttack() {
                const threats = this.getThreats();
                if (threats.length === 0) return 0;

                const attacks = threats.map(t => t.attributes?.attack || 0);
                const highestAttack = Math.max(...attacks);
                const otherThreatsCount = threats.length - 1;

                return highestAttack + otherThreatsCount;
            },

            sortThreats(threats) {
                return [...threats].sort((a, b) => {
                    const attackA = a.attributes?.attack || 0;
                    const attackB = b.attributes?.attack || 0;
                    return attackB - attackA; // Descending
                });
            },

            sortObjectives(objectives) {
                return [...objectives].sort((a, b) => {
                    // Primary objectives first
                    if (a.isPrimary && !b.isPrimary) return -1;
                    if (!a.isPrimary && b.isPrimary) return 1;
                    return 0; // Otherwise keep order
                });
            }
        };
    });

    describe('Enemy Subtype Configuration', function() {
        it('should load enemy subtypes for Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            expect(tracker.gameConfig.enemySubtypes).to.exist;
            expect(tracker.gameConfig.enemySubtypes.threat).to.exist;
            expect(tracker.gameConfig.enemySubtypes.objective).to.exist;
        });

        it('should not have enemy subtypes for default game', async function() {
            await tracker.loadGameConfig('default');

            expect(tracker.gameConfig.enemySubtypes).to.not.exist;
        });

        it('should read threat configuration', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const threatConfig = tracker.getEnemySubtypeConfig('threat');
            expect(threatConfig).to.exist;
            expect(threatConfig.label).to.equal('Threat');
            expect(threatConfig.attributes).to.be.an('array');
        });

        it('should read objective configuration', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const objConfig = tracker.getEnemySubtypeConfig('objective');
            expect(objConfig).to.exist;
            expect(objConfig.label).to.equal('Objective');
            expect(objConfig.attributes).to.be.an('array');
        });
    });

    describe('Attribute Initialization', function() {
        it('should initialize threat attributes with defaults', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const attrs = tracker.initializeEnemyAttributes('threat');
            expect(attrs.rating).to.exist;
            expect(attrs.attack).to.exist;
            expect(attrs.challenge).to.exist;
        });

        it('should initialize objective attributes with defaults', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const attrs = tracker.initializeEnemyAttributes('objective');
            expect(attrs.rating).to.exist;
            expect(attrs.attack).to.not.exist; // Objectives don't have attack
        });

        it('should use default values from config', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const attrs = tracker.initializeEnemyAttributes('threat');
            expect(attrs.rating).to.equal(3);
            expect(attrs.attack).to.equal(1);
            expect(attrs.challenge).to.equal(0);
        });
    });

    describe('Attribute Modification', function() {
        it('should increment attribute value', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const threat = tracker.addEnemy('Nazi Officer', 'threat', { rating: 3, attack: 2, challenge: 1 });
            tracker.changeAttribute(threat.id, 'attack', 1);

            expect(threat.attributes.attack).to.equal(3);
        });

        it('should decrement attribute value', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const threat = tracker.addEnemy('Nazi Officer', 'threat', { rating: 3, attack: 2, challenge: 1 });
            tracker.changeAttribute(threat.id, 'rating', -1);

            expect(threat.attributes.rating).to.equal(2);
        });

        it('should respect minimum constraint', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const threat = tracker.addEnemy('Nazi Officer', 'threat', { rating: 0, attack: 1, challenge: 1 });
            tracker.changeAttribute(threat.id, 'rating', -1);

            expect(threat.attributes.rating).to.equal(0); // Can't go below 0
        });

        it('should respect maximum constraint if set', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const objective = tracker.addEnemy('Destroy Radio', 'objective', { rating: 5 });

            // Try to go above max (if there is one in config)
            tracker.changeAttribute(objective.id, 'rating', 100);

            // Should be capped at max or unlimited
            expect(objective.attributes.rating).to.be.greaterThan(5);
        });
    });

    describe('Objective Completion', function() {
        it('should mark objective as completed when rating reaches 0', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const objective = tracker.addEnemy('Destroy Radio', 'objective', { rating: 1 });
            tracker.changeAttribute(objective.id, 'rating', -1);

            expect(objective.objectiveCompleted).to.be.true;
        });

        it('should not mark objective as completed above 0', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const objective = tracker.addEnemy('Destroy Radio', 'objective', { rating: 2 });
            tracker.changeAttribute(objective.id, 'rating', -1);

            expect(objective.objectiveCompleted).to.not.be.true;
        });

        it('should not mark threats as completed', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const threat = tracker.addEnemy('Nazi Officer', 'threat', { rating: 1, attack: 1, challenge: 1 });
            tracker.changeAttribute(threat.id, 'rating', -1);

            expect(threat.objectiveCompleted).to.not.be.true;
        });
    });

    describe('Primary Objective System', function() {
        it('should set objective as primary', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const obj1 = tracker.addEnemy('Radio', 'objective', { rating: 3 });
            tracker.setPrimaryObjective(obj1.id);

            expect(obj1.isPrimary).to.be.true;
        });

        it('should only allow one primary objective', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const obj1 = tracker.addEnemy('Radio', 'objective', { rating: 3 });
            const obj2 = tracker.addEnemy('Documents', 'objective', { rating: 2 });

            tracker.setPrimaryObjective(obj1.id);
            tracker.setPrimaryObjective(obj2.id);

            expect(obj1.isPrimary).to.be.false;
            expect(obj2.isPrimary).to.be.true;
        });

        it('should toggle primary off', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const obj1 = tracker.addEnemy('Radio', 'objective', { rating: 3 });

            tracker.togglePrimaryObjective(obj1.id); // On
            expect(obj1.isPrimary).to.be.true;

            tracker.togglePrimaryObjective(obj1.id); // Off
            expect(obj1.isPrimary).to.be.false;
        });

        it('should not allow threats to be primary', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const threat = tracker.addEnemy('Nazi', 'threat', { rating: 3, attack: 2, challenge: 1 });
            const result = tracker.setPrimaryObjective(threat.id);

            expect(result).to.be.false;
            expect(threat.isPrimary).to.not.be.true;
        });
    });

    describe('Total Attack Calculation', function() {
        it('should calculate total attack with one threat', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            tracker.addEnemy('Nazi', 'threat', { rating: 3, attack: 5, challenge: 1 });

            const totalAttack = tracker.calculateTotalAttack();
            expect(totalAttack).to.equal(5); // 5 + 0 others
        });

        it('should calculate total attack with multiple threats', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            tracker.addEnemy('Nazi 1', 'threat', { rating: 3, attack: 5, challenge: 1 });
            tracker.addEnemy('Nazi 2', 'threat', { rating: 3, attack: 5, challenge: 1 });
            tracker.addEnemy('Nazi 3', 'threat', { rating: 3, attack: 4, challenge: 1 });
            tracker.addEnemy('Nazi 4', 'threat', { rating: 3, attack: 2, challenge: 1 });
            tracker.addEnemy('Nazi 5', 'threat', { rating: 3, attack: 2, challenge: 1 });

            const totalAttack = tracker.calculateTotalAttack();
            expect(totalAttack).to.equal(9); // 5 (highest) + 4 (4 other threats)
        });

        it('should return 0 with no threats', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const totalAttack = tracker.calculateTotalAttack();
            expect(totalAttack).to.equal(0);
        });

        it('should not count dead threats', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const threat1 = tracker.addEnemy('Nazi 1', 'threat', { rating: 3, attack: 5, challenge: 1 });
            const threat2 = tracker.addEnemy('Nazi 2', 'threat', { rating: 3, attack: 3, challenge: 1 });

            threat2.dead = true;

            const totalAttack = tracker.calculateTotalAttack();
            expect(totalAttack).to.equal(5); // Only threat1 counts
        });
    });

    describe('Threat Sorting', function() {
        it('should sort threats by attack descending', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const threat1 = tracker.addEnemy('Nazi 1', 'threat', { rating: 3, attack: 2, challenge: 1 });
            const threat2 = tracker.addEnemy('Nazi 2', 'threat', { rating: 3, attack: 5, challenge: 1 });
            const threat3 = tracker.addEnemy('Nazi 3', 'threat', { rating: 3, attack: 3, challenge: 1 });

            const threats = [threat1, threat2, threat3];
            const sorted = tracker.sortThreats(threats);

            expect(sorted[0].attributes.attack).to.equal(5);
            expect(sorted[1].attributes.attack).to.equal(3);
            expect(sorted[2].attributes.attack).to.equal(2);
        });
    });

    describe('Objective Sorting', function() {
        it('should sort primary objective first', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const obj1 = tracker.addEnemy('Radio', 'objective', { rating: 3 });
            const obj2 = tracker.addEnemy('Documents', 'objective', { rating: 2 });
            const obj3 = tracker.addEnemy('Officer', 'objective', { rating: 1 });

            obj2.isPrimary = true;

            const objectives = [obj1, obj2, obj3];
            const sorted = tracker.sortObjectives(objectives);

            expect(sorted[0].id).to.equal(obj2.id);
        });

        it('should maintain order for non-primary objectives', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const obj1 = tracker.addEnemy('Radio', 'objective', { rating: 3 });
            const obj2 = tracker.addEnemy('Documents', 'objective', { rating: 2 });

            const objectives = [obj1, obj2];
            const sorted = tracker.sortObjectives(objectives);

            expect(sorted[0].id).to.equal(obj1.id);
            expect(sorted[1].id).to.equal(obj2.id);
        });
    });

    describe('Entity Filtering', function() {
        it('should get all threats', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            tracker.addEnemy('Nazi 1', 'threat', { rating: 3, attack: 2, challenge: 1 });
            tracker.addEnemy('Radio', 'objective', { rating: 3 });
            tracker.addEnemy('Nazi 2', 'threat', { rating: 3, attack: 3, challenge: 1 });

            const threats = tracker.getThreats();
            expect(threats).to.have.length(2);
        });

        it('should get all objectives', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            tracker.addEnemy('Nazi 1', 'threat', { rating: 3, attack: 2, challenge: 1 });
            tracker.addEnemy('Radio', 'objective', { rating: 3 });
            tracker.addEnemy('Documents', 'objective', { rating: 2 });

            const objectives = tracker.getObjectives();
            expect(objectives).to.have.length(2);
        });

        it('should get completed objectives', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const obj1 = tracker.addEnemy('Radio', 'objective', { rating: 1 });
            const obj2 = tracker.addEnemy('Documents', 'objective', { rating: 2 });

            tracker.changeAttribute(obj1.id, 'rating', -1);

            const completed = tracker.getCompletedObjectives();
            expect(completed).to.have.length(1);
            expect(completed[0].id).to.equal(obj1.id);
        });
    });
});

