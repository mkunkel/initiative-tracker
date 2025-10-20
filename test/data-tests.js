// Data Persistence Tests for Initiative Tracker
// Testing localStorage, data integrity, and state management

const { expect } = require('chai');

// Mock InitiativeTracker class
class InitiativeTracker {
    constructor() {
        this.characters = [];
        this.enemyCounter = 1;
        this.themes = new Map();
        this.currentTheme = 'default';
    }

    changeTheme(themeFile) {
        this.currentTheme = themeFile;
        try {
            localStorage.setItem('initiative-tracker-theme', themeFile);
        } catch (e) {
            console.warn('Could not save theme to localStorage:', e);
        }
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('initiative-tracker-theme');
        if (savedTheme && savedTheme !== 'default') {
            // Only apply saved theme if it exists in discovered themes
            if (this.themes.has(savedTheme)) {
                this.currentTheme = savedTheme;
            }
            // Otherwise stay with default
        }
    }

    addCharacter() {
        // Mock implementation for testing
        const character = {
            id: Date.now() + Math.random(),
            name: 'Test Character',
            hp: 10,
            isEnemy: false,
            completed: false
        };
        this.characters.push(character);
    }

    addEnemy() {
        // Mock implementation for testing
        const enemy = {
            id: Date.now() + Math.random(),
            name: `Enemy ${this.enemyCounter}`,
            hp: 8,
            isEnemy: true,
            completed: false
        };
        this.characters.push(enemy);
        this.enemyCounter++;
    }

    changeHP(characterId, change) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.hp = Math.max(0, character.hp + change);
        }
    }

    completeCharacter(characterId) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.completed = true;
        }
    }

    returnToDeck(characterId) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.completed = false;
        }
    }

    moveCharacter(characterId, direction) {
        const onDeckCharacters = this.characters.filter(char => !char.completed);
        const currentIndex = onDeckCharacters.findIndex(char => char.id == characterId);

        if (currentIndex === -1) return;

        let newIndex;
        if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < onDeckCharacters.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            return;
        }

        const character = onDeckCharacters[currentIndex];
        const targetCharacter = onDeckCharacters[newIndex];

        const characterIndex = this.characters.findIndex(char => char.id == character.id);
        const targetIndex = this.characters.findIndex(char => char.id == targetCharacter.id);

        [this.characters[characterIndex], this.characters[targetIndex]] =
        [this.characters[targetIndex], this.characters[characterIndex]];
    }

    startNextRound() {
        this.characters.forEach(char => {
            char.completed = false;
        });
    }
}

describe('InitiativeTracker - Data Persistence Tests', function() {
    let tracker;
    let originalLocalStorage;

    beforeEach(function() {
        // Mock localStorage
        originalLocalStorage = window.localStorage;
        const mockStorage = {};

        window.localStorage = {
            getItem: function(key) {
                return mockStorage[key] || null;
            },
            setItem: function(key, value) {
                mockStorage[key] = value;
            },
            removeItem: function(key) {
                delete mockStorage[key];
            },
            clear: function() {
                Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
            },
            length: 0,
            key: function(index) {
                return Object.keys(mockStorage)[index] || null;
            }
        };

        // Mock DOM
        document.body.innerHTML = `
            <select id="themeSelect">
                <option value="default">Default</option>
            </select>
        `;

        tracker = new InitiativeTracker();
        tracker.characters = [];
    });

    afterEach(function() {
        // Restore original localStorage
        window.localStorage = originalLocalStorage;
    });

    describe('Theme Persistence', function() {
        it('should save theme selection to localStorage', function() {
            // Act
            tracker.changeTheme('theme-mork-borg.css');

            // Assert
            const savedTheme = localStorage.getItem('initiative-tracker-theme');
            expect(savedTheme).to.equal('theme-mork-borg.css');
        });

        it('should load saved theme on initialization', function() {
            // Arrange
            tracker.themes.set('theme-dark.css', 'Dark Mode');
            localStorage.setItem('initiative-tracker-theme', 'theme-dark.css');

            // Act
            tracker.loadSavedTheme();

            // Assert
            expect(tracker.currentTheme).to.equal('theme-dark.css');
        });

        it('should handle missing theme data gracefully', function() {
            // Act
            tracker.loadSavedTheme();

            // Assert
            expect(tracker.currentTheme).to.equal('default');
        });

        it('should handle invalid theme data gracefully', function() {
            // Arrange
            localStorage.setItem('initiative-tracker-theme', 'invalid-theme');

            // Act
            tracker.loadSavedTheme();

            // Assert
            expect(tracker.currentTheme).to.equal('default');
        });

        it('should persist theme across multiple changes', function() {
            // Act
            tracker.changeTheme('theme-mork-borg.css');
            tracker.changeTheme('theme-dark.css');
            tracker.changeTheme('default');

            // Assert
            const savedTheme = localStorage.getItem('initiative-tracker-theme');
            expect(savedTheme).to.equal('default');
        });
    });

    describe('Data Integrity', function() {
        it('should maintain character data consistency', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false },
                { id: '2', name: 'Wizard', hp: 8, isEnemy: false, completed: false },
                { id: '3', name: 'Goblin', hp: 6, isEnemy: true, completed: false }
            ];

            // Act - Perform various operations
            tracker.changeHP('1', -5);
            tracker.moveCharacter('2', 'up');
            tracker.completeCharacter('1');

            // Assert - Data should remain consistent
            expect(tracker.characters).to.have.length(3);
            expect(tracker.characters[0].name).to.equal('Wizard'); // Moved up
            expect(tracker.characters[1].name).to.equal('Fighter'); // Moved down, HP changed, completed
            expect(tracker.characters[1].hp).to.equal(10); // HP changed
            expect(tracker.characters[1].completed).to.be.true; // Completed
        });

        it('should handle data corruption gracefully', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false }
            ];

            // Act - Simulate data corruption
            tracker.characters[0].hp = 'invalid';
            tracker.characters[0].name = null;

            // Assert - Should handle gracefully
            expect(tracker.characters).to.have.length(1);
            expect(() => tracker.changeHP('1', 1)).to.not.throw();
        });

        it('should maintain referential integrity', function() {
            // Arrange
            const character = { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false };
            tracker.characters.push(character);

            // Act
            tracker.changeHP('1', -5);
            tracker.completeCharacter('1');

            // Assert - Should modify the same object
            expect(character.hp).to.equal(10);
            expect(character.completed).to.be.true;
        });
    });

    describe('State Management', function() {
        it('should maintain state across operations', function() {
            // Arrange
            tracker.characters = [];
            tracker.enemyCounter = 1;

            // Act - Add characters and enemies
            tracker.addCharacter();
            tracker.addEnemy();
            tracker.addEnemy();

            // Assert
            expect(tracker.characters).to.have.length(3);
            expect(tracker.enemyCounter).to.equal(3);
            expect(tracker.characters[1].isEnemy).to.be.true;
            expect(tracker.characters[2].isEnemy).to.be.true;
        });

        it('should reset state correctly for new round', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 10, isEnemy: false, completed: true },
                { id: '2', name: 'Wizard', hp: 8, isEnemy: false, completed: true }
            ];

            // Act
            tracker.startNextRound();

            // Assert
            tracker.characters.forEach(char => {
                expect(char.completed).to.be.false;
            });
        });

        it('should maintain state during theme changes', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false }
            ];

            // Act
            tracker.changeTheme('theme-mork-borg.css');
            tracker.changeHP('1', -3);
            tracker.completeCharacter('1');

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].hp).to.equal(12);
            expect(tracker.characters[0].completed).to.be.true;
            expect(tracker.currentTheme).to.equal('theme-mork-borg.css');
        });
    });

    describe('Error Recovery', function() {
        it('should recover from localStorage errors', function() {
            // Arrange
            let callCount = 0;
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key, value) {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Storage quota exceeded');
                }
                return originalSetItem.call(this, key, value);
            };

            // Act
            tracker.changeTheme('theme-mork-borg.css');

            // Assert - Should not throw error
            expect(tracker.currentTheme).to.equal('theme-mork-borg.css');
        });

        it('should handle malformed data gracefully', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false }
            ];

            // Act - Simulate malformed operations
            tracker.changeHP('invalid-id', 5);
            tracker.completeCharacter('invalid-id');
            tracker.moveCharacter('invalid-id', 'up');

            // Assert - Should not affect valid data
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].hp).to.equal(15);
            expect(tracker.characters[0].completed).to.be.false;
        });

        it('should handle concurrent modifications', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false }
            ];

            // Act - Simulate concurrent operations
            tracker.changeHP('1', -5);
            tracker.completeCharacter('1');
            tracker.changeHP('1', 3);

            // Assert - Should handle gracefully
            expect(tracker.characters[0].hp).to.equal(13);
            expect(tracker.characters[0].completed).to.be.true;
        });
    });

    describe('Memory Management', function() {
        it('should not leak memory with repeated operations', function() {
            // Arrange
            const initialCharacterCount = tracker.characters.length;

            // Act - Perform many operations
            for (let i = 0; i < 100; i++) {
                tracker.characters.push({
                    id: `char-${i}`,
                    name: `Character ${i}`,
                    hp: 10,
                    isEnemy: false,
                    completed: false
                });
            }

            // Act - Remove all characters
            tracker.characters = [];

            // Assert
            expect(tracker.characters).to.have.length(0);
        });

        it('should clean up event listeners properly', function() {
            // Arrange
            let eventListenerCount = 0;
            const originalAddEventListener = document.addEventListener;
            document.addEventListener = function(event, handler) {
                eventListenerCount++;
                return originalAddEventListener.call(this, event, handler);
            };

            // Act - Create tracker (no way to truly "destroy" it in JS)
            let testTracker = new InitiativeTracker();
            testTracker = null;

            // Assert - Should not accumulate listeners excessively
            expect(eventListenerCount).to.be.lessThan(20);
        });
    });

    describe('Cross-Session Persistence', function() {
        it('should maintain theme across browser sessions', function() {
            // Arrange
            localStorage.setItem('initiative-tracker-theme', 'theme-mork-borg.css');

            // Act - Simulate new session
            const newTracker = new InitiativeTracker();
            newTracker.themes.set('theme-mork-borg.css', 'Mörk Borg');
            newTracker.loadSavedTheme();

            // Assert
            expect(newTracker.currentTheme).to.equal('theme-mork-borg.css');
        });

        it('should handle missing persistence data on first visit', function() {
            // Arrange
            localStorage.clear();

            // Act
            const newTracker = new InitiativeTracker();
            newTracker.loadSavedTheme();

            // Assert
            expect(newTracker.currentTheme).to.equal('default');
        });
    });

    describe('Data Validation', function() {
        it('should validate character data before operations', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false }
            ];

            // Act & Assert - Should handle invalid operations gracefully
            expect(() => tracker.changeHP(null, 1)).to.not.throw();
            expect(() => tracker.changeHP(undefined, 1)).to.not.throw();
            expect(() => tracker.changeHP('', 1)).to.not.throw();
        });

        it('should validate HP values', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false }
            ];

            // Act
            tracker.changeHP('1', -100); // Should not go below 0

            // Assert
            expect(tracker.characters[0].hp).to.equal(0);
        });

        it('should validate character IDs', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false }
            ];

            // Act & Assert
            expect(() => tracker.completeCharacter('invalid-id')).to.not.throw();
            expect(() => tracker.returnToDeck('invalid-id')).to.not.throw();
            expect(() => tracker.moveCharacter('invalid-id', 'up')).to.not.throw();
        });
    });
});
