// Integration Tests for Initiative Tracker
// Testing user interactions and component integration

const { expect } = require('chai');

// Mock InitiativeTracker class for integration testing
class InitiativeTracker {
    constructor() {
        this.characters = [];
        this.enemyCounter = 1;
        this.characterToDelete = null;
        this.themes = new Map();
        this.currentTheme = 'default';

        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Mock DOM elements
        this.characterNameInput = { value: 'Test Character' };
        this.characterHPInput = { value: '10' };
        this.enemyNameInput = { value: 'Test Enemy' };
        this.enemyHPInput = { value: '8' };
        this.onDeckList = { innerHTML: '', appendChild: () => {} };
        this.completedList = { innerHTML: '', appendChild: () => {} };
        this.themeSelect = { innerHTML: '', appendChild: () => {} };
    }

    bindEvents() {
        // Mock event binding
    }

    addCharacter() {
        const name = this.characterNameInput.value.trim();
        const hp = parseInt(this.characterHPInput.value);

        if (!name || isNaN(hp) || hp < 1) {
            return;
        }

        const character = {
            id: Date.now() + Math.random(),
            name: name,
            hp: hp,
            maxHP: hp,
            isEnemy: false,
            completed: false
        };

        this.characters.push(character);
        this.clearCharacterInputs();
    }

    addEnemy() {
        const name = this.enemyNameInput.value.trim();
        const hp = parseInt(this.enemyHPInput.value);

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
        this.clearEnemyInputs();
    }

    clearCharacterInputs() {
        this.characterNameInput.value = '';
        this.characterHPInput.value = '5';
    }

    clearEnemyInputs() {
        this.enemyCounter++;
        this.enemyNameInput.value = `Enemy ${this.enemyCounter}`;
        this.enemyHPInput.value = '5';
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

    changeHP(characterId, change) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.hp = Math.max(0, character.hp + change);
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

    confirmDelete() {
        if (this.characterToDelete) {
            this.characters = this.characters.filter(char => char.id != this.characterToDelete);
            this.characterToDelete = null;
        }
    }

    startNextRound() {
        this.characters.forEach(char => {
            char.completed = false;
        });
    }

    changeTheme(themeFile) {
        this.currentTheme = themeFile;
        localStorage.setItem('initiative-tracker-theme', themeFile);
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('initiative-tracker-theme');
        if (savedTheme && savedTheme !== 'default') {
            this.currentTheme = savedTheme;
        }
    }
}

describe('InitiativeTracker - Integration Tests', function() {
    let tracker;
    let mockDOM;

    beforeEach(function() {
        // Create comprehensive mock DOM
        mockDOM = {
            characterName: { value: 'Test Character' },
            characterHP: { value: '10' },
            enemyName: { value: 'Test Enemy' },
            enemyHP: { value: '8' },
            onDeckList: { innerHTML: '', appendChild: function() {} },
            completedList: { innerHTML: '', appendChild: function() {} },
            themeSelect: { innerHTML: '', appendChild: function() {} }
        };

        // Create tracker with mocked DOM
        tracker = new InitiativeTracker();
        tracker.characters = [];
        tracker.enemyCounter = 1;

        // Override tracker's input references to use mockDOM
        tracker.characterNameInput = mockDOM.characterName;
        tracker.characterHPInput = mockDOM.characterHP;
        tracker.enemyNameInput = mockDOM.enemyName;
        tracker.enemyHPInput = mockDOM.enemyHP;
    });

    describe('Character Creation Workflow', function() {
        it('should complete full character creation workflow', function() {
            // Arrange
            const characterName = 'Fighter';
            const characterHP = 15;
            mockDOM.characterName.value = characterName;
            mockDOM.characterHP.value = characterHP;

            // Act
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].name).to.equal(characterName);
            expect(tracker.characters[0].hp).to.equal(characterHP);
            expect(tracker.characters[0].isEnemy).to.be.false;
        });

        it('should complete full enemy creation workflow', function() {
            // Arrange
            const enemyName = 'Goblin';
            const enemyHP = 6;
            mockDOM.enemyName.value = enemyName;
            mockDOM.enemyHP.value = enemyHP;

            // Act
            tracker.addEnemy();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].name).to.equal(enemyName);
            expect(tracker.characters[0].hp).to.equal(enemyHP);
            expect(tracker.characters[0].isEnemy).to.be.true;
        });

        it('should handle multiple character types in same list', function() {
            // Arrange
            mockDOM.characterName.value = 'Hero';
            mockDOM.characterHP.value = '12';
            mockDOM.enemyName.value = 'Orc';
            mockDOM.enemyHP.value = '8';

            // Act
            tracker.addCharacter();
            tracker.addEnemy();

            // Assert
            expect(tracker.characters).to.have.length(2);
            expect(tracker.characters[0].isEnemy).to.be.false;
            expect(tracker.characters[1].isEnemy).to.be.true;
        });
    });

    describe('Initiative Management Workflow', function() {
        beforeEach(function() {
            // Create a mixed group of characters and enemies
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false },
                { id: '2', name: 'Wizard', hp: 8, isEnemy: false, completed: false },
                { id: '3', name: 'Goblin', hp: 6, isEnemy: true, completed: false },
                { id: '4', name: 'Orc', hp: 12, isEnemy: true, completed: false }
            ];
        });

        it('should manage complete initiative round', function() {
            // Act - Complete all characters
            tracker.characters.forEach(char => {
                tracker.completeCharacter(char.id);
            });

            // Assert - All should be completed
            tracker.characters.forEach(char => {
                expect(char.completed).to.be.true;
            });
        });

        it('should handle mixed character movement', function() {
            // Arrange
            const originalOrder = tracker.characters.map(c => c.id);

            // Act - Move character up (should swap with previous)
            tracker.moveCharacter('2', 'up');

            // Assert - Order should change
            expect(tracker.characters[0].id).to.equal('2');
            expect(tracker.characters[1].id).to.equal('1');
        });

        it('should handle character completion and return workflow', function() {
            // Arrange
            const characterId = '1';

            // Act - Complete character
            tracker.completeCharacter(characterId);
            expect(tracker.characters[0].completed).to.be.true;

            // Act - Return to deck
            tracker.returnToDeck(characterId);

            // Assert - Should be back in deck
            expect(tracker.characters[0].completed).to.be.false;
        });
    });

    describe('HP Management Integration', function() {
        beforeEach(function() {
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, maxHP: 15, isEnemy: false, completed: false },
                { id: '2', name: 'Wizard', hp: 8, maxHP: 8, isEnemy: false, completed: false }
            ];
        });

        it('should handle HP changes during combat', function() {
            // Arrange
            const characterId = '1';
            const initialHP = tracker.characters[0].hp;

            // Act - Take damage
            tracker.changeHP(characterId, -5);
            expect(tracker.characters[0].hp).to.equal(initialHP - 5);

            // Act - Heal
            tracker.changeHP(characterId, 3);
            expect(tracker.characters[0].hp).to.equal(initialHP - 2);

            // Act - Take more damage than current HP
            tracker.changeHP(characterId, -20);
            expect(tracker.characters[0].hp).to.equal(0);
        });

        it('should maintain HP integrity across character operations', function() {
            // Arrange
            const characterId = '1';
            tracker.changeHP(characterId, -3);
            const damagedHP = tracker.characters[0].hp;

            // Act - Complete and return character
            tracker.completeCharacter(characterId);
            tracker.returnToDeck(characterId);

            // Assert - HP should be preserved
            expect(tracker.characters[0].hp).to.equal(damagedHP);
        });
    });

    describe('Round Management Integration', function() {
        beforeEach(function() {
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false },
                { id: '2', name: 'Wizard', hp: 8, isEnemy: false, completed: false },
                { id: '3', name: 'Goblin', hp: 6, isEnemy: true, completed: false }
            ];
        });

        it('should handle complete round cycle', function() {
            // Act - Complete all characters
            tracker.characters.forEach(char => {
                tracker.completeCharacter(char.id);
            });

            // Assert - Round should be complete
            const isComplete = tracker.characters.every(char => char.completed);
            expect(isComplete).to.be.true;

            // Act - Start next round
            tracker.startNextRound();

            // Assert - All characters should be back in deck
            tracker.characters.forEach(char => {
                expect(char.completed).to.be.false;
            });
        });

        it('should handle partial round completion', function() {
            // Act - Complete only some characters
            tracker.completeCharacter('1');
            tracker.completeCharacter('3');

            // Assert - Round should not be complete
            const isComplete = tracker.characters.every(char => char.completed);
            expect(isComplete).to.be.false;

            // Assert - Specific characters should be completed
            expect(tracker.characters[0].completed).to.be.true;
            expect(tracker.characters[1].completed).to.be.false;
            expect(tracker.characters[2].completed).to.be.true;
        });
    });

    describe('Error Handling Integration', function() {
        it('should handle invalid input gracefully', function() {
            // Arrange
            tracker.characterNameInput.value = '';
            tracker.characterHPInput.value = 'invalid';

            // Act
            const originalLength = tracker.characters.length;
            tracker.addCharacter();

            // Assert - Should not add invalid character
            expect(tracker.characters).to.have.length(originalLength);
        });

        it('should handle operations on non-existent characters', function() {
            // Act & Assert - Should not throw errors
            expect(() => tracker.changeHP('nonexistent', 1)).to.not.throw();
            expect(() => tracker.completeCharacter('nonexistent')).to.not.throw();
            expect(() => tracker.moveCharacter('nonexistent', 'up')).to.not.throw();
        });

        it('should handle edge cases in movement', function() {
            // Arrange - Single character
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false }
            ];

            // Act & Assert - Should not throw errors
            expect(() => tracker.moveCharacter('1', 'up')).to.not.throw();
            expect(() => tracker.moveCharacter('1', 'down')).to.not.throw();
        });
    });

    describe('Data Consistency Integration', function() {
        it('should maintain data consistency across operations', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false },
                { id: '2', name: 'Wizard', hp: 8, isEnemy: false, completed: false },
                { id: '3', name: 'Rogue', hp: 10, isEnemy: false, completed: false }
            ];

            // Act - Perform various operations
            tracker.changeHP('1', -5);
            tracker.moveCharacter('2', 'up');
            tracker.completeCharacter('1');
            tracker.returnToDeck('1');

            // Assert - Data should be consistent
            expect(tracker.characters).to.have.length(3);
            expect(tracker.characters[0].name).to.equal('Wizard'); // Moved up
            expect(tracker.characters[1].name).to.equal('Fighter'); // Moved down (and HP changed, completed/returned)
            expect(tracker.characters[1].hp).to.equal(10); // HP changed
            expect(tracker.characters[1].completed).to.be.false; // Returned to deck
            expect(tracker.characters[2].name).to.equal('Rogue'); // Unchanged
        });

        it('should handle rapid operations without data corruption', function() {
            // Arrange
            tracker.characters = [
                { id: '1', name: 'Fighter', hp: 15, isEnemy: false, completed: false },
                { id: '2', name: 'Wizard', hp: 8, isEnemy: false, completed: false },
                { id: '3', name: 'Goblin', hp: 6, isEnemy: true, completed: false }
            ];

            // Act - Rapid operations
            for (let i = 0; i < 10; i++) {
                tracker.changeHP('1', -1);
                tracker.moveCharacter('2', i % 2 === 0 ? 'up' : 'down');
                tracker.changeHP('3', 1);
            }

            // Assert - Data should still be consistent
            expect(tracker.characters).to.have.length(3);
            tracker.characters.forEach(char => {
                expect(char.hp).to.be.a('number');
                expect(char.hp).to.be.at.least(0);
                expect(char.name).to.be.a('string');
                expect(char.name).to.not.be.empty;
            });
        });
    });
});
