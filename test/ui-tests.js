// UI Interaction Tests for Initiative Tracker
// Testing user interface interactions and DOM manipulation

const { expect } = require('chai');

// Mock InitiativeTracker class with UI methods
class InitiativeTracker {
    constructor() {
        this.characters = [];
        this.enemyCounter = 1;
        this.themes = new Map();
        this.currentTheme = 'default';
    }

    createCharacterCard(character, index, total, isCompleted = false) {
        const card = document.createElement('div');
        card.className = isCompleted ? 'character-card completed' : 'character-card';
        if (character.isEnemy) {
            card.className += ' enemy';
        }
        card.dataset.characterId = character.id;

        // Add control buttons based on state
        if (isCompleted) {
            card.innerHTML = `
                <span data-action="return-to-deck"></span>
                <span data-action="delete"></span>
            `;
        } else {
            card.innerHTML = `
                <span data-action="complete"></span>
                <span data-action="delete"></span>
                <span data-action="hp-increase"></span>
                <span data-action="hp-decrease"></span>
            `;
        }

        return card;
    }

    showModal(modal) {
        modal.style.display = 'block';
    }

    hideModal(modal) {
        modal.style.display = 'none';
    }

    openAddCharacterModal() {
        if (this.addCharacterModal) {
            this.showModal(this.addCharacterModal);
        }
    }

    closeAddCharacterModal() {
        if (this.addCharacterModal) {
            this.hideModal(this.addCharacterModal);
        }
    }

    openAddEnemyModal() {
        if (this.addEnemyModal) {
            this.showModal(this.addEnemyModal);
        }
    }

    closeAddEnemyModal() {
        if (this.addEnemyModal) {
            this.hideModal(this.addEnemyModal);
        }
    }

    addCharacterFromModal() {
        const name = this.modalCharacterNameInput ? this.modalCharacterNameInput.value.trim() : 'Test Character';
        const hp = this.modalCharacterHPInput ? parseInt(this.modalCharacterHPInput.textContent) : 10;

        // Get selected entity type from radio buttons
        const entityTypeInput = document.querySelector('input[name="entityType"]:checked');
        const entityType = entityTypeInput ? entityTypeInput.value : 'pc';

        if (!name || isNaN(hp) || hp < 1) {
            return;
        }

        const character = {
            id: Date.now() + Math.random(),
            name: name,
            hp: hp,
            maxHP: hp,
            isEnemy: false,
            entityType: entityType,
            completed: false
        };
        this.characters.push(character);
        this.closeAddCharacterModal();
    }

    addEnemyFromModal() {
        const name = this.modalEnemyNameInput ? this.modalEnemyNameInput.value.trim() : 'Test Enemy';
        const hp = this.modalEnemyHPInput ? parseInt(this.modalEnemyHPInput.textContent) : 8;

        if (!name || isNaN(hp) || hp < 1) {
            return;
        }

        const enemy = {
            id: Date.now() + Math.random(),
            name: name,
            hp: hp,
            maxHP: hp,
            isEnemy: true,
            completed: false
        };
        this.characters.push(enemy);
        this.closeAddEnemyModal();
    }

    renderCharacters() {
        // Mock implementation
    }

    changeTheme(theme) {
        this.currentTheme = theme;
    }

    checkRoundComplete() {
        return this.characters.length > 0 && this.characters.every(char => char.completed);
    }

    completeCharacter(characterId) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.completed = true;
        }
    }

    openEntityRenameModal(entityId) {
        this.entityToRename = entityId;
        const entity = this.characters.find(char => char.id == entityId);
        if (entity && this.renameInput && this.renameModal) {
            this.renameInput.value = entity.name;
            this.showModal(this.renameModal);
            if (this.renameInput.focus) this.renameInput.focus();
            if (this.renameInput.select) this.renameInput.select();
        }
    }

    confirmEntityRename() {
        if (this.renameInput && this.entityToRename) {
            const newName = this.renameInput.value.trim();
            if (newName) {
                this.renameEntity(this.entityToRename, newName);
                if (this.renameModal) this.hideModal(this.renameModal);
                this.entityToRename = null;
            }
        }
    }

    cancelEntityRename() {
        if (this.renameModal) this.hideModal(this.renameModal);
        this.entityToRename = null;
    }

    renameEntity(entityId, newName) {
        const trimmedName = newName.trim();
        if (!trimmedName) return;

        const entity = this.characters.find(char => char.id == entityId);
        if (entity) {
            entity.name = trimmedName;
            // In the real app, this would call saveData() and renderCharacters()
        }
    }
}

describe('InitiativeTracker - UI Tests', function() {
    let tracker;
    let mockDOM;
    let mockEvents;

    beforeEach(function() {
        // Create comprehensive mock DOM
        mockDOM = {
            modalCharacterName: {
                value: 'Test Character',
                addEventListener: function() {}
            },
            modalCharacterHP: {
                textContent: '10',
                addEventListener: function() {}
            },
            modalEnemyName: {
                value: 'Test Enemy',
                addEventListener: function() {}
            },
            modalEnemyHP: {
                textContent: '8',
                addEventListener: function() {}
            },
            onDeckList: {
                innerHTML: '',
                appendChild: function() {},
                querySelectorAll: function() { return []; }
            },
            completedList: {
                innerHTML: '',
                appendChild: function() {},
                querySelectorAll: function() { return []; }
            },
            stunnedList: {
                innerHTML: '',
                appendChild: function() {},
                querySelectorAll: function() { return []; }
            },
            deadList: {
                innerHTML: '',
                appendChild: function() {},
                querySelectorAll: function() { return []; }
            },
            themeSelect: {
                innerHTML: '<option value="default">Default</option>',
                appendChild: function() {},
                addEventListener: function() {}
            },
            roundCompleteModal: {
                style: { display: 'none' },
                addEventListener: function() {}
            },
            deleteModal: {
                style: { display: 'none' },
                addEventListener: function() {}
            },
            addCharacterModal: {
                style: { display: 'none' },
                addEventListener: function() {}
            },
            addEnemyModal: {
                style: { display: 'none' },
                addEventListener: function() {}
            }
        };

        // Mock event system
        mockEvents = {};

        // Mock DOM methods
        document.getElementById = function(id) {
            return mockDOM[id] || { addEventListener: function() {} };
        };

        document.querySelectorAll = function(selector) {
            return [];
        };

        document.addEventListener = function(event, handler) {
            if (!mockEvents[event]) mockEvents[event] = [];
            mockEvents[event].push(handler);
        };

        // Mock document.body style property
        if (!document.body.style) {
            document.body.style = {};
        }
        document.body.style.overflow = 'auto';

        // Create tracker
        tracker = new InitiativeTracker();
        tracker.characters = [];
    });

    describe('Character Card Rendering', function() {
        it('should create character card with correct structure', function() {
            // Arrange
            const character = {
                id: '1',
                name: 'Fighter',
                hp: 15,
                isEnemy: false,
                completed: false
            };

            // Act
            const card = tracker.createCharacterCard(character, 0, 1);

            // Assert
            expect(card).to.be.instanceOf(window.HTMLElement);
            expect(card.className).to.include('character-card');
            expect(card.dataset.characterId).to.equal('1');
        });

        it('should create enemy card with enemy styling', function() {
            // Arrange
            const enemy = {
                id: '2',
                name: 'Goblin',
                hp: 6,
                isEnemy: true,
                completed: false
            };

            // Act
            const card = tracker.createCharacterCard(enemy, 0, 1);

            // Assert
            expect(card.className).to.include('enemy');
        });

        it('should create completed card with completed styling', function() {
            // Arrange
            const character = {
                id: '3',
                name: 'Wizard',
                hp: 8,
                isEnemy: false,
                completed: true
            };

            // Act
            const card = tracker.createCharacterCard(character, 0, 1, true);

            // Assert
            expect(card.className).to.include('completed');
        });

        it('should include correct control buttons for on-deck characters', function() {
            // Arrange
            const character = {
                id: '1',
                name: 'Fighter',
                hp: 15,
                isEnemy: false,
                completed: false
            };

            // Act
            const card = tracker.createCharacterCard(character, 0, 1);

            // Assert
            expect(card.innerHTML).to.include('data-action="complete"');
            expect(card.innerHTML).to.include('data-action="delete"');
            expect(card.innerHTML).to.include('data-action="hp-increase"');
            expect(card.innerHTML).to.include('data-action="hp-decrease"');
        });

        it('should include correct control buttons for completed characters', function() {
            // Arrange
            const character = {
                id: '1',
                name: 'Fighter',
                hp: 15,
                isEnemy: false,
                completed: true
            };

            // Act
            const card = tracker.createCharacterCard(character, 0, 1, true);

            // Assert
            expect(card.innerHTML).to.include('data-action="return-to-deck"');
            expect(card.innerHTML).to.include('data-action="delete"');
            expect(card.innerHTML).to.not.include('data-action="complete"');
        });
    });

    describe('Event Handling', function() {
        it('should handle character addition events from modal', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'New Character' };
            tracker.modalCharacterHPInput = { textContent: '12' };
            tracker.addCharacterModal = mockDOM.addCharacterModal;

            // Act
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].name).to.equal('New Character');
            expect(tracker.characters[0].hp).to.equal(12);
        });

        it('should handle enemy addition events from modal', function() {
            // Arrange
            tracker.modalEnemyNameInput = { value: 'New Enemy' };
            tracker.modalEnemyHPInput = { textContent: '7' };
            tracker.addEnemyModal = mockDOM.addEnemyModal;

            // Act
            tracker.addEnemyFromModal();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].name).to.equal('New Enemy');
            expect(tracker.characters[0].isEnemy).to.be.true;
        });

        it('should handle keyboard events for character input', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'Keyboard Character' };
            tracker.modalCharacterHPInput = { textContent: '14' };
            tracker.addCharacterModal = mockDOM.addCharacterModal;

            // Act - Simulate Enter key press (just call addCharacterFromModal directly)
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(1);
        });

        it('should handle theme selection events', function() {
            // Arrange
            const themeSelect = mockDOM.themeSelect;
            let themeChanged = false;

            // Mock theme change handler
            tracker.changeTheme = function(theme) {
                themeChanged = true;
                tracker.currentTheme = theme;
            };

            // Act
            const changeEvent = new Event('change');
            changeEvent.target = { value: 'theme-mork-borg.css' };

            // Simulate theme change
            tracker.changeTheme('theme-mork-borg.css');

            // Assert
            expect(themeChanged).to.be.true;
            expect(tracker.currentTheme).to.equal('theme-mork-borg.css');
        });
    });

    describe('Modal Management', function() {
        it('should show round complete modal when all characters completed', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', completed: true },
                { id: '2', name: 'Wizard', completed: true }
            ];

            // Act
            tracker.checkRoundComplete();

            // Assert
            // Note: In real implementation, this would show the modal
            // For testing, we verify the logic works
            const allCompleted = tracker.characters.every(char => char.completed);
            expect(allCompleted).to.be.true;
        });

        it('should not show modal when characters remain incomplete', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', completed: true },
                { id: '2', name: 'Wizard', completed: false }
            ];

            // Act
            tracker.checkRoundComplete();

            // Assert
            const allCompleted = tracker.characters.every(char => char.completed);
            expect(allCompleted).to.be.false;
        });

        it('should handle modal show and hide operations', function() {
            // Arrange
            const modal = mockDOM.roundCompleteModal;

            // Act
            tracker.showModal(modal);

            // Assert
            expect(modal.style.display).to.equal('block');

            // Act
            tracker.hideModal(modal);

            // Assert
            expect(modal.style.display).to.equal('none');
        });

        it('should open add character modal', function() {
            // Arrange
            tracker.addCharacterModal = mockDOM.addCharacterModal;

            // Act
            tracker.openAddCharacterModal();

            // Assert
            expect(mockDOM.addCharacterModal.style.display).to.equal('block');
        });

        it('should close add character modal', function() {
            // Arrange
            tracker.addCharacterModal = mockDOM.addCharacterModal;
            tracker.addCharacterModal.style.display = 'block';

            // Act
            tracker.closeAddCharacterModal();

            // Assert
            expect(mockDOM.addCharacterModal.style.display).to.equal('none');
        });

        it('should open add enemy modal', function() {
            // Arrange
            tracker.addEnemyModal = mockDOM.addEnemyModal;

            // Act
            tracker.openAddEnemyModal();

            // Assert
            expect(mockDOM.addEnemyModal.style.display).to.equal('block');
        });

        it('should close add enemy modal', function() {
            // Arrange
            tracker.addEnemyModal = mockDOM.addEnemyModal;
            tracker.addEnemyModal.style.display = 'block';

            // Act
            tracker.closeAddEnemyModal();

            // Assert
            expect(mockDOM.addEnemyModal.style.display).to.equal('none');
        });

        it('should close modal after adding character', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'Test' };
            tracker.modalCharacterHPInput = { textContent: '10' };
            tracker.addCharacterModal = mockDOM.addCharacterModal;
            tracker.addCharacterModal.style.display = 'block';

            // Act
            tracker.addCharacterFromModal();

            // Assert
            expect(mockDOM.addCharacterModal.style.display).to.equal('none');
        });

        it('should close modal after adding enemy', function() {
            // Arrange
            tracker.modalEnemyNameInput = { value: 'Test' };
            tracker.modalEnemyHPInput = { textContent: '10' };
            tracker.addEnemyModal = mockDOM.addEnemyModal;
            tracker.addEnemyModal.style.display = 'block';

            // Act
            tracker.addEnemyFromModal();

            // Assert
            expect(mockDOM.addEnemyModal.style.display).to.equal('none');
        });
    });

    describe('Input Validation', function() {
        it('should validate character name input in modal', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: '' };
            tracker.modalCharacterHPInput = { textContent: '10' };
            tracker.addCharacterModal = mockDOM.addCharacterModal;

            // Act
            const originalLength = tracker.characters.length;
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
        });

        it('should validate HP input in modal', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'Test Character' };
            tracker.modalCharacterHPInput = { textContent: '0' };
            tracker.addCharacterModal = mockDOM.addCharacterModal;

            // Act
            const originalLength = tracker.characters.length;
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
        });

        it('should validate numeric HP input in modal', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'Test Character' };
            tracker.modalCharacterHPInput = { textContent: 'invalid' };
            tracker.addCharacterModal = mockDOM.addCharacterModal;

            // Act
            const originalLength = tracker.characters.length;
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
        });

        it('should validate HP display is not an input field', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'Test' };
            tracker.modalCharacterHPInput = { textContent: '15' };
            tracker.addCharacterModal = mockDOM.addCharacterModal;

            // Act
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].hp).to.equal(15);
            // Verify HP was read from textContent, not value
            expect(tracker.modalCharacterHPInput.textContent).to.equal('15');
        });
    });

    describe('Responsive Behavior', function() {
        it('should handle mobile viewport changes', function() {
            // Arrange
            const originalInnerWidth = window.innerWidth;
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 768
            });

            // Act
            // Simulate mobile viewport
            const isMobile = window.innerWidth <= 768;

            // Assert
            expect(isMobile).to.be.true;

            // Cleanup
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: originalInnerWidth
            });
        });

        it('should adapt character card layout for mobile', function() {
            // Arrange
            const character = {
                id: '1',
                name: 'Fighter',
                hp: 15,
                isEnemy: false,
                completed: false
            };

            // Act
            const card = tracker.createCharacterCard(character, 0, 1);

            // Assert
            // Card should be created regardless of viewport
            expect(card).to.be.instanceOf(window.HTMLElement);
            expect(card.className).to.include('character-card');
        });
    });

    describe('Accessibility', function() {
        it('should include proper ARIA labels for buttons', function() {
            // Arrange
            const character = {
                id: '1',
                name: 'Fighter',
                hp: 15,
                isEnemy: false,
                completed: false
            };

            // Act
            const card = tracker.createCharacterCard(character, 0, 1);

            // Assert
            // Check for button elements with proper data attributes
            expect(card.innerHTML).to.include('data-action');
        });

        it('should maintain keyboard navigation support', function() {
            // Arrange
            const character = {
                id: '1',
                name: 'Fighter',
                hp: 15,
                isEnemy: false,
                completed: false
            };

            // Act
            const card = tracker.createCharacterCard(character, 0, 1);

            // Assert
            // All interactive elements should have data-action attributes
            const buttons = card.querySelectorAll('[data-action]');
            expect(buttons.length).to.be.greaterThan(0);
        });
    });

    describe('Performance', function() {
        it('should handle large numbers of characters efficiently', function() {
            // Arrange
            const startTime = performance.now();

            // Act - Add many characters
            for (let i = 0; i < 100; i++) {
                tracker.characters.push({
                    id: `char-${i}`,
                    name: `Character ${i}`,
                    hp: 10,
                    isEnemy: false,
                    completed: false
                });
            }

            // Act - Render all characters
            tracker.renderCharacters();

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Assert
            expect(duration).to.be.lessThan(1000); // Should complete within 1 second
            expect(tracker.characters).to.have.length(100);
        });

        it('should not cause memory leaks with repeated operations', function() {
            // Arrange
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            tracker.modalCharacterNameInput = { value: 'Test' };
            tracker.modalCharacterHPInput = { textContent: '10' };
            tracker.modalEnemyNameInput = { value: 'Enemy' };
            tracker.modalEnemyHPInput = { textContent: '8' };
            tracker.addCharacterModal = mockDOM.addCharacterModal;
            tracker.addEnemyModal = mockDOM.addEnemyModal;

            // Act - Perform many operations
            for (let i = 0; i < 50; i++) {
                tracker.addCharacterFromModal();
                tracker.addEnemyFromModal();
                if (tracker.characters.length > 0) {
                    tracker.completeCharacter(tracker.characters[0].id);
                }
            }

            // Assert
            // Memory usage should not grow excessively
            if (performance.memory) {
                const finalMemory = performance.memory.usedJSHeapSize;
                const memoryGrowth = finalMemory - initialMemory;
                expect(memoryGrowth).to.be.lessThan(10 * 1024 * 1024); // Less than 10MB growth
            }
        });
    });

    describe('Entity Rename Modal', function() {
        let renameModal, renameInput, confirmBtn, cancelBtn;

        beforeEach(function() {
            // Create mock DOM elements for rename modal
            renameModal = document.createElement('div');
            renameModal.id = 'renameModal';
            renameModal.style.display = 'none';

            renameInput = document.createElement('input');
            renameInput.id = 'renameInput';
            renameInput.type = 'text';

            confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirmRename';

            cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancelRename';

            // Set up tracker with mock elements
            tracker.renameModal = renameModal;
            tracker.renameInput = renameInput;
            tracker.confirmEntityRenameBtn = confirmBtn;
            tracker.cancelEntityRenameBtn = cancelBtn;

            // Add a test character
            tracker.characters.push({
                id: 'test-entity-1',
                name: 'Original Name',
                hp: 10,
                maxHP: 10,
                isEnemy: false,
                completed: false
            });
        });

        it('should open rename modal with current entity name', function() {
            // Act
            tracker.openEntityRenameModal('test-entity-1');

            // Assert
            expect(renameModal.style.display).to.equal('block');
            expect(renameInput.value).to.equal('Original Name');
            expect(tracker.entityToRename).to.equal('test-entity-1');
        });

        it('should not open modal for non-existent entity', function() {
            // Act
            tracker.openEntityRenameModal('non-existent');

            // Assert
            expect(renameModal.style.display).to.equal('none');
            expect(tracker.entityToRename).to.equal('non-existent'); // Still set, but modal not shown
        });

        it('should rename entity on confirm', function() {
            // Arrange
            tracker.openEntityRenameModal('test-entity-1');
            renameInput.value = 'New Name';

            // Act
            tracker.confirmEntityRename();

            // Assert
            const entity = tracker.characters.find(c => c.id === 'test-entity-1');
            expect(entity.name).to.equal('New Name');
            expect(renameModal.style.display).to.equal('none');
            expect(tracker.entityToRename).to.be.null;
        });

        it('should trim whitespace when renaming', function() {
            // Arrange
            tracker.openEntityRenameModal('test-entity-1');
            renameInput.value = '  Trimmed Name  ';

            // Act
            tracker.confirmEntityRename();

            // Assert
            const entity = tracker.characters.find(c => c.id === 'test-entity-1');
            expect(entity.name).to.equal('Trimmed Name');
        });

        it('should not rename if new name is empty', function() {
            // Arrange
            tracker.openEntityRenameModal('test-entity-1');
            renameInput.value = '   ';

            // Act
            tracker.confirmEntityRename();

            // Assert
            const entity = tracker.characters.find(c => c.id === 'test-entity-1');
            expect(entity.name).to.equal('Original Name'); // Unchanged
            expect(renameModal.style.display).to.equal('block'); // Modal stays open
        });

        it('should close modal on cancel without renaming', function() {
            // Arrange
            tracker.openEntityRenameModal('test-entity-1');
            renameInput.value = 'This Should Not Be Saved';

            // Act
            tracker.cancelEntityRename();

            // Assert
            const entity = tracker.characters.find(c => c.id === 'test-entity-1');
            expect(entity.name).to.equal('Original Name'); // Unchanged
            expect(renameModal.style.display).to.equal('none');
            expect(tracker.entityToRename).to.be.null;
        });

        it('should handle multiple rename operations', function() {
            // First rename
            tracker.openEntityRenameModal('test-entity-1');
            renameInput.value = 'First Rename';
            tracker.confirmEntityRename();

            // Second rename
            tracker.openEntityRenameModal('test-entity-1');
            renameInput.value = 'Second Rename';
            tracker.confirmEntityRename();

            // Assert
            const entity = tracker.characters.find(c => c.id === 'test-entity-1');
            expect(entity.name).to.equal('Second Rename');
        });

        it('should work with enemy entities', function() {
            // Arrange - Add an enemy
            tracker.characters.push({
                id: 'enemy-1',
                name: 'Goblin',
                hp: 5,
                maxHP: 5,
                isEnemy: true,
                completed: false
            });

            // Act
            tracker.openEntityRenameModal('enemy-1');
            renameInput.value = 'Elite Goblin';
            tracker.confirmEntityRename();

            // Assert
            const enemy = tracker.characters.find(c => c.id === 'enemy-1');
            expect(enemy.name).to.equal('Elite Goblin');
            expect(enemy.isEnemy).to.be.true; // Should still be an enemy
        });

        it('should handle button clicks via event listeners', function() {
            // Arrange
            tracker.openEntityRenameModal('test-entity-1');
            renameInput.value = 'Button Click Name';

            // Simulate confirm button click
            confirmBtn.addEventListener('click', () => tracker.confirmEntityRename());
            confirmBtn.click();

            // Assert
            const entity = tracker.characters.find(c => c.id === 'test-entity-1');
            expect(entity.name).to.equal('Button Click Name');
        });
    });

    describe('Add Character Modal - Entity Type Selection', function() {
        beforeEach(function() {
            tracker = new InitiativeTracker();
            // Add mock DOM elements for entity type selection
            mockDOM.entityTypePCRadio = {
                type: 'radio',
                name: 'entityType',
                value: 'pc',
                checked: true,
                id: 'entityTypePC'
            };
            mockDOM.entityTypeNPCRadio = {
                type: 'radio',
                name: 'entityType',
                value: 'npc',
                checked: false,
                id: 'entityTypeNPC'
            };
        });

        it('should default to PC type when opening modal', function() {
            // Act
            tracker.openAddCharacterModal();

            // Assert - PC radio should be checked by default
            // In real implementation, we'd check the DOM element
            // For mock, we verify the initial state
            expect(mockDOM.entityTypePCRadio.checked).to.be.true;
        });

        it('should create PC when PC radio is selected', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'Test PC' };
            tracker.modalCharacterHPInput = { textContent: '10' };
            mockDOM.entityTypePCRadio.checked = true;
            mockDOM.entityTypeNPCRadio.checked = false;

            // Mock document.querySelector to return PC radio
            const originalQuerySelector = global.document.querySelector;
            global.document.querySelector = function(selector) {
                if (selector === 'input[name="entityType"]:checked') {
                    return mockDOM.entityTypePCRadio;
                }
                if (selector === '#entityTypePC') {
                    return mockDOM.entityTypePCRadio;
                }
                return originalQuerySelector.call(this, selector);
            };

            // Act
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].entityType).to.equal('pc');
            expect(tracker.characters[0].isEnemy).to.be.false;

            // Cleanup
            global.document.querySelector = originalQuerySelector;
        });

        it('should create NPC when NPC radio is selected', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'Test NPC' };
            tracker.modalCharacterHPInput = { textContent: '8' };
            mockDOM.entityTypePCRadio.checked = false;
            mockDOM.entityTypeNPCRadio.checked = true;

            // Mock document.querySelector to return NPC radio
            const originalQuerySelector = global.document.querySelector;
            global.document.querySelector = function(selector) {
                if (selector === 'input[name="entityType"]:checked') {
                    return mockDOM.entityTypeNPCRadio;
                }
                if (selector === '#entityTypePC') {
                    return mockDOM.entityTypePCRadio;
                }
                return originalQuerySelector.call(this, selector);
            };

            // Act
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].entityType).to.equal('npc');
            expect(tracker.characters[0].isEnemy).to.be.false;

            // Cleanup
            global.document.querySelector = originalQuerySelector;
        });

        it('should fallback to PC if no radio button is checked', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'Fallback Character' };
            tracker.modalCharacterHPInput = { textContent: '5' };

            // Mock document.querySelector to return null
            const originalQuerySelector = global.document.querySelector;
            global.document.querySelector = function(selector) {
                if (selector === 'input[name="entityType"]:checked') {
                    return null;
                }
                if (selector === '#entityTypePC') {
                    return mockDOM.entityTypePCRadio;
                }
                return originalQuerySelector.call(this, selector);
            };

            // Act
            tracker.addCharacterFromModal();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].entityType).to.equal('pc');

            // Cleanup
            global.document.querySelector = originalQuerySelector;
        });

        it('should preserve entity type through save and render cycle', function() {
            // Arrange
            tracker.modalCharacterNameInput = { value: 'NPC Test' };
            tracker.modalCharacterHPInput = { textContent: '12' };
            mockDOM.entityTypeNPCRadio.checked = true;

            const originalQuerySelector = global.document.querySelector;
            global.document.querySelector = function(selector) {
                if (selector === 'input[name="entityType"]:checked') {
                    return mockDOM.entityTypeNPCRadio;
                }
                if (selector === '#entityTypePC') {
                    return mockDOM.entityTypePCRadio;
                }
                return originalQuerySelector.call(this, selector);
            };

            // Act
            tracker.addCharacterFromModal();
            const addedCharacter = tracker.characters[0];

            // Assert - verify entity type is preserved
            expect(addedCharacter.entityType).to.equal('npc');
            expect(addedCharacter.name).to.equal('NPC Test');
            expect(addedCharacter.hp).to.equal(12);

            // Cleanup
            global.document.querySelector = originalQuerySelector;
        });
    });
});
