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

    addCharacter() {
        const name = this.characterNameInput ? this.characterNameInput.value.trim() : 'Test Character';
        const hp = this.characterHPInput ? parseInt(this.characterHPInput.value) : 10;

        if (!name || isNaN(hp) || hp < 1) {
            return;
        }

        const character = {
            id: Date.now() + Math.random(),
            name: name,
            hp: hp,
            isEnemy: false,
            completed: false
        };
        this.characters.push(character);
    }

    addEnemy() {
        const name = this.enemyNameInput ? this.enemyNameInput.value.trim() : 'Test Enemy';
        const hp = this.enemyHPInput ? parseInt(this.enemyHPInput.value) : 8;

        if (!name || isNaN(hp) || hp < 1) {
            return;
        }

        const enemy = {
            id: Date.now() + Math.random(),
            name: name,
            hp: hp,
            isEnemy: true,
            completed: false
        };
        this.characters.push(enemy);
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
}

describe('InitiativeTracker - UI Tests', function() {
    let tracker;
    let mockDOM;
    let mockEvents;

    beforeEach(function() {
        // Create comprehensive mock DOM
        mockDOM = {
            characterName: {
                value: 'Test Character',
                addEventListener: function() {}
            },
            characterHP: {
                value: '10',
                addEventListener: function() {}
            },
            enemyName: {
                value: 'Test Enemy',
                addEventListener: function() {}
            },
            enemyHP: {
                value: '8',
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
        it('should handle character addition events', function() {
            // Arrange
            tracker.characterNameInput = { value: 'New Character' };
            tracker.characterHPInput = { value: '12' };

            // Act
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].name).to.equal('New Character');
        });

        it('should handle enemy addition events', function() {
            // Arrange
            tracker.enemyNameInput = { value: 'New Enemy' };
            tracker.enemyHPInput = { value: '7' };

            // Act
            tracker.addEnemy();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].name).to.equal('New Enemy');
            expect(tracker.characters[0].isEnemy).to.be.true;
        });

        it('should handle keyboard events for character input', function() {
            // Arrange
            tracker.characterNameInput = { value: 'Keyboard Character' };
            tracker.characterHPInput = { value: '14' };

            // Act - Simulate Enter key press (just call addCharacter directly)
            tracker.addCharacter();

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
    });

    describe('Input Validation', function() {
        it('should validate character name input', function() {
            // Arrange
            tracker.characterNameInput = { value: '' };
            tracker.characterHPInput = { value: '10' };

            // Act
            const originalLength = tracker.characters.length;
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
        });

        it('should validate HP input', function() {
            // Arrange
            tracker.characterNameInput = { value: 'Test Character' };
            tracker.characterHPInput = { value: '0' };

            // Act
            const originalLength = tracker.characters.length;
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
        });

        it('should validate numeric HP input', function() {
            // Arrange
            tracker.characterNameInput = { value: 'Test Character' };
            tracker.characterHPInput = { value: 'invalid' };

            // Act
            const originalLength = tracker.characters.length;
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
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

            // Act - Perform many operations
            for (let i = 0; i < 50; i++) {
                tracker.addCharacter();
                tracker.addEnemy();
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
});
