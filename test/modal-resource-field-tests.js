const { expect } = require('chai');
const { JSDOM } = require('jsdom');

// Helper to create a minimal DOM
function createMockDOM() {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
            <div id="characterHPField" class="form-field" style="display: flex;">
                <label id="characterResourceLabel">Hit Points</label>
                <div id="modalCharacterHP">5</div>
            </div>
            <div id="enemyHPField" class="form-field" style="display: flex;">
                <label id="enemyResourceLabel">Hit Points</label>
                <div id="modalEnemyHP">5</div>
            </div>
            <input type="text" id="modalCharacterNameInput" value="" />
            <input type="text" id="modalEnemyNameInput" value="" />
            <div class="entity-type-selector">
                <input type="radio" name="entityType" value="pc" checked />
                <input type="radio" name="entityType" value="npc" />
            </div>
            <div class="enemy-subtype-selector"></div>
            <div id="addCharacterModal" class="modal"></div>
            <div id="addEnemyModal" class="modal"></div>
            <div id="onDeckList"></div>
            <div id="completedList"></div>
            <div id="stunnedList"></div>
            <div id="deadList"></div>
            <div id="completedObjectivesList"></div>
            <div id="totalAttackIndicator"></div>
        </body>
        </html>
    `);
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; },
        removeItem(key) { delete this.data[key]; },
        clear() { this.data = {}; }
    };
    return dom;
}

describe('Modal Resource Field Visibility', function() {
    let tracker;
    let GameConfigManager;
    let configManager;

    before(function() {
        // Load GameConfigManager
        GameConfigManager = require('../js/game-config.js');
    });

    beforeEach(async function() {
        createMockDOM();

        // Initialize config manager
        configManager = new GameConfigManager();

        // Create mock tracker with modal methods
        tracker = {
            characters: [],
            gameConfig: null,
            configManager: configManager,

            async loadGameConfig(gameId) {
                this.gameConfig = await this.configManager.loadConfig(gameId);
                return this.gameConfig;
            },

            openAddCharacterModal() {
                // Check if resource field should be shown in modal
                const showResourceInModal = this.gameConfig?.resources?.primary?.showInModal !== false;
                const characterHPField = document.getElementById('characterHPField');

                if (characterHPField) {
                    characterHPField.style.display = showResourceInModal ? 'flex' : 'none';
                }

                if (showResourceInModal) {
                    // Update resource label
                    const resourceLabel = document.getElementById('characterResourceLabel');
                    if (resourceLabel) {
                        resourceLabel.textContent = this.gameConfig?.resources?.primary?.displayName || 'Hit Points';
                    }
                }
            },

            openAddEnemyModal() {
                // Check if resource field should be shown in modal
                const showResourceInModal = this.gameConfig?.resources?.primary?.showInModal !== false;
                const enemyHPField = document.getElementById('enemyHPField');

                if (enemyHPField) {
                    enemyHPField.style.display = showResourceInModal ? 'flex' : 'none';
                }

                if (showResourceInModal) {
                    // Update resource label
                    const resourceLabel = document.getElementById('enemyResourceLabel');
                    if (resourceLabel) {
                        resourceLabel.textContent = this.gameConfig?.resources?.primary?.displayName || 'Hit Points';
                    }
                }
            },

            addCharacterFromModal() {
                const name = document.getElementById('modalCharacterNameInput').value.trim();

                if (!name) {
                    global.alert('Please enter a valid name');
                    return;
                }

                const showResourceInModal = this.gameConfig?.resources?.primary?.showInModal !== false;
                let resourceValue;

                if (showResourceInModal) {
                    resourceValue = parseInt(document.getElementById('modalCharacterHP').textContent);
                    const minValue = this.gameConfig?.resources?.primary?.min ?? 1;

                    if (isNaN(resourceValue) || resourceValue < minValue) {
                        global.alert('Invalid resource value');
                        return;
                    }
                } else {
                    resourceValue = this.gameConfig?.resources?.primary?.default ?? 5;
                }

                const character = {
                    id: Date.now() + Math.random(),
                    name: name,
                    primaryResource: {
                        value: resourceValue,
                        max: resourceValue,
                        name: this.gameConfig?.resources.primary.name || 'hp'
                    },
                    isEnemy: false,
                    entityType: 'pc',
                    completed: false
                };

                this.characters.push(character);
            },

            addEnemyFromModal() {
                const name = document.getElementById('modalEnemyNameInput').value.trim();

                if (!name) {
                    global.alert('Please enter a valid name');
                    return;
                }

                const showResourceInModal = this.gameConfig?.resources?.primary?.showInModal !== false;
                let resourceValue;

                if (showResourceInModal) {
                    resourceValue = parseInt(document.getElementById('modalEnemyHP').textContent);
                    const minValue = this.gameConfig?.resources?.primary?.min ?? 1;

                    if (isNaN(resourceValue) || resourceValue < minValue) {
                        global.alert('Invalid resource value');
                        return;
                    }
                } else {
                    resourceValue = this.gameConfig?.resources?.primary?.default ?? 5;
                }

                const enemy = {
                    id: Date.now() + Math.random(),
                    name: name,
                    primaryResource: {
                        value: resourceValue,
                        max: resourceValue,
                        name: this.gameConfig?.resources.primary.name || 'hp'
                    },
                    isEnemy: true,
                    entityType: 'enemy',
                    completed: false
                };

                const subtypeInput = document.querySelector('input[name="enemySubtype"]:checked');
                if (subtypeInput) {
                    enemy.enemySubtype = subtypeInput.value;
                }

                this.characters.push(enemy);
            }
        };

        // Load default config
        await tracker.loadGameConfig('default');
    });

    afterEach(function() {
        if (global.localStorage) {
            global.localStorage.clear();
        }
    });

    describe('Character Modal HP Field', function() {
        it('should show HP field by default (showInModal not set)', async function() {
            await tracker.loadGameConfig('default');
            tracker.openAddCharacterModal();

            const hpField = document.getElementById('characterHPField');
            expect(hpField).to.exist;
            expect(hpField.style.display).to.not.equal('none');
        });

        it('should show HP field for Mörk Borg', async function() {
            await tracker.loadGameConfig('mork-borg');
            tracker.openAddCharacterModal();

            const hpField = document.getElementById('characterHPField');
            expect(hpField).to.exist;
            expect(hpField.style.display).to.not.equal('none');
        });

        it('should hide Blood field for Eat the Reich (showInModal: false)', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            tracker.openAddCharacterModal();

            const hpField = document.getElementById('characterHPField');
            expect(hpField).to.exist;
            expect(hpField.style.display).to.equal('none');
        });

        it('should update resource label when field is shown', async function() {
            await tracker.loadGameConfig('mork-borg');
            tracker.openAddCharacterModal();

            const label = document.getElementById('characterResourceLabel');
            expect(label.textContent).to.equal('Hit Points');
        });

        it('should hide field for Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            tracker.openAddCharacterModal();

            const hpField = document.getElementById('characterHPField');
            expect(hpField.style.display).to.equal('none');
        });
    });

    describe('Enemy Modal HP Field', function() {
        it('should show HP field by default', async function() {
            await tracker.loadGameConfig('default');
            tracker.openAddEnemyModal();

            const hpField = document.getElementById('enemyHPField');
            expect(hpField).to.exist;
            expect(hpField.style.display).to.not.equal('none');
        });

        it('should hide Blood field for Eat the Reich', async function() {
            await tracker.loadGameConfig('eat-the-reich');
            tracker.openAddEnemyModal();

            const hpField = document.getElementById('enemyHPField');
            expect(hpField).to.exist;
            expect(hpField.style.display).to.equal('none');
        });

        it('should update resource label when field is shown', async function() {
            await tracker.loadGameConfig('mork-borg');
            tracker.openAddEnemyModal();

            const label = document.getElementById('enemyResourceLabel');
            expect(label.textContent).to.equal('Hit Points');
        });
    });

    describe('Character Creation with Hidden Resource Field', function() {
        it('should create character with default Blood value when field is hidden', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const nameInput = document.getElementById('modalCharacterNameInput');
            nameInput.value = 'Test Character';

            tracker.addCharacterFromModal();

            expect(tracker.characters.length).to.equal(1);
            const char = tracker.characters[0];
            expect(char.name).to.equal('Test Character');
            expect(char.primaryResource.value).to.equal(0); // Eat the Reich starts at 0
            expect(char.primaryResource.name).to.equal('blood');
        });

        it('should validate name when resource field is hidden', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const nameInput = document.getElementById('modalCharacterNameInput');
            nameInput.value = ''; // Empty name

            // Spy on alert
            let alertCalled = false;
            global.alert = () => { alertCalled = true; };

            tracker.addCharacterFromModal();

            expect(alertCalled).to.be.true;
            expect(tracker.characters.length).to.equal(0);
        });

        it('should create character with specified HP when field is shown', async function() {
            await tracker.loadGameConfig('mork-borg');

            const nameInput = document.getElementById('modalCharacterNameInput');
            const hpInput = document.getElementById('modalCharacterHP');
            nameInput.value = 'Test Character';
            hpInput.textContent = '8';

            tracker.addCharacterFromModal();

            expect(tracker.characters.length).to.equal(1);
            const char = tracker.characters[0];
            expect(char.primaryResource.value).to.equal(8);
        });

        it('should validate HP value when field is shown', async function() {
            await tracker.loadGameConfig('mork-borg');

            const nameInput = document.getElementById('modalCharacterNameInput');
            const hpInput = document.getElementById('modalCharacterHP');
            nameInput.value = 'Test Character';
            hpInput.textContent = '-5'; // Invalid HP

            let alertCalled = false;
            global.alert = () => { alertCalled = true; };

            tracker.addCharacterFromModal();

            expect(alertCalled).to.be.true;
            expect(tracker.characters.length).to.equal(0);
        });
    });

    describe('Enemy Creation with Hidden Resource Field', function() {
        it('should create enemy with default value when field is hidden', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const nameInput = document.getElementById('modalEnemyNameInput');
            nameInput.value = 'Test Threat';

            // Add threat radio button
            const subtypeSelector = document.querySelector('.enemy-subtype-selector');
            subtypeSelector.innerHTML = '<input type="radio" name="enemySubtype" value="threat" checked />';

            tracker.addEnemyFromModal();

            expect(tracker.characters.length).to.equal(1);
            const enemy = tracker.characters[0];
            expect(enemy.name).to.equal('Test Threat');
            expect(enemy.primaryResource.value).to.equal(0);
            expect(enemy.enemySubtype).to.equal('threat');
        });

        it('should validate name when resource field is hidden', async function() {
            await tracker.loadGameConfig('eat-the-reich');

            const nameInput = document.getElementById('modalEnemyNameInput');
            nameInput.value = ''; // Empty name

            let alertCalled = false;
            global.alert = () => { alertCalled = true; };

            tracker.addEnemyFromModal();

            expect(alertCalled).to.be.true;
            expect(tracker.characters.length).to.equal(0);
        });

        it('should create enemy with specified HP when field is shown', async function() {
            await tracker.loadGameConfig('mork-borg');

            const nameInput = document.getElementById('modalEnemyNameInput');
            const hpInput = document.getElementById('modalEnemyHP');
            nameInput.value = 'Test Enemy';
            hpInput.textContent = '12';

            tracker.addEnemyFromModal();

            expect(tracker.characters.length).to.equal(1);
            const enemy = tracker.characters[0];
            expect(enemy.primaryResource.value).to.equal(12);
        });
    });

    describe('Game Switching', function() {
        it('should toggle HP field visibility when switching games', async function() {
            const hpField = document.getElementById('characterHPField');

            // Start with default game
            await tracker.loadGameConfig('default');
            tracker.openAddCharacterModal();
            expect(hpField.style.display).to.not.equal('none');

            // Switch to Eat the Reich
            await tracker.loadGameConfig('eat-the-reich');
            tracker.openAddCharacterModal();
            expect(hpField.style.display).to.equal('none');

            // Switch back to default
            await tracker.loadGameConfig('default');
            tracker.openAddCharacterModal();
            expect(hpField.style.display).to.not.equal('none');
        });

        it('should use correct default values after switching games', async function() {
            // Create character in Eat the Reich
            await tracker.loadGameConfig('eat-the-reich');
            const nameInput = document.getElementById('modalCharacterNameInput');
            nameInput.value = 'Blood Character';
            tracker.addCharacterFromModal();

            expect(tracker.characters[0].primaryResource.value).to.equal(0);

            // Switch to Mörk Borg and create character
            await tracker.loadGameConfig('mork-borg');
            nameInput.value = 'HP Character';
            const hpInput = document.getElementById('modalCharacterHP');
            hpInput.textContent = '5';
            tracker.addCharacterFromModal();

            expect(tracker.characters[1].primaryResource.value).to.equal(5);
        });
    });

    describe('Config Flag Behavior', function() {
        it('should respect showInModal: true explicitly set', async function() {
            // Create a mock config with explicit showInModal: true
            tracker.gameConfig = {
                id: 'test-game',
                resources: {
                    primary: {
                        name: 'hp',
                        displayName: 'Hit Points',
                        default: 10,
                        min: 0,
                        showInModal: true
                    }
                }
            };

            tracker.openAddCharacterModal();

            const hpField = document.getElementById('characterHPField');
            expect(hpField.style.display).to.not.equal('none');
        });

        it('should respect showInModal: false', async function() {
            tracker.gameConfig = {
                id: 'test-game',
                resources: {
                    primary: {
                        name: 'blood',
                        displayName: 'Blood',
                        default: 0,
                        min: 0,
                        showInModal: false
                    }
                }
            };

            tracker.openAddCharacterModal();

            const hpField = document.getElementById('characterHPField');
            expect(hpField.style.display).to.equal('none');
        });

        it('should default to showing field when showInModal is undefined', async function() {
            tracker.gameConfig = {
                id: 'test-game',
                resources: {
                    primary: {
                        name: 'hp',
                        displayName: 'Hit Points',
                        default: 10,
                        min: 0
                        // showInModal not set
                    }
                }
            };

            tracker.openAddCharacterModal();

            const hpField = document.getElementById('characterHPField');
            expect(hpField.style.display).to.not.equal('none');
        });
    });
});

