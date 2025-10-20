// Unit Tests for Initiative Tracker (Node.js compatible)
// Testing core functionality in isolation

const { expect } = require('chai');

// Mock InitiativeTracker class for testing
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

describe('InitiativeTracker - Unit Tests', function() {
    let tracker;

    beforeEach(function() {
        tracker = new InitiativeTracker();
        tracker.characters = [];
        tracker.enemyCounter = 1;
    });

    describe('Character Management', function() {
        it('should add a character with correct properties', function() {
            // Arrange
            tracker.characterNameInput.value = 'Test Character';
            tracker.characterHPInput.value = '10';

            // Act
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0]).to.have.property('name', 'Test Character');
            expect(tracker.characters[0]).to.have.property('hp', 10);
            expect(tracker.characters[0]).to.have.property('isEnemy', false);
            expect(tracker.characters[0]).to.have.property('completed', false);
        });

        it('should add an enemy with correct properties', function() {
            // Arrange
            tracker.enemyNameInput.value = 'Test Enemy';
            tracker.enemyHPInput.value = '8';

            // Act
            tracker.addEnemy();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0]).to.have.property('name', 'Test Enemy');
            expect(tracker.characters[0]).to.have.property('hp', 8);
            expect(tracker.characters[0]).to.have.property('isEnemy', true);
            expect(tracker.characters[0]).to.have.property('completed', false);
        });

        it('should increment enemy counter correctly', function() {
            // Arrange & Act
            tracker.addEnemy();
            tracker.addEnemy();
            tracker.addEnemy();

            // Assert
            expect(tracker.enemyCounter).to.equal(4);
        });

        it('should complete a character', function() {
            // Arrange
            tracker.addCharacter();
            const characterId = tracker.characters[0].id;

            // Act
            tracker.completeCharacter(characterId);

            // Assert
            expect(tracker.characters[0].completed).to.be.true;
        });

        it('should return character to deck', function() {
            // Arrange
            tracker.addCharacter();
            tracker.characters[0].completed = true;
            const characterId = tracker.characters[0].id;

            // Act
            tracker.returnToDeck(characterId);

            // Assert
            expect(tracker.characters[0].completed).to.be.false;
        });

        it('should delete a character', function() {
            // Arrange
            tracker.addCharacter();
            tracker.addEnemy();
            const characterId = tracker.characters[0].id;
            tracker.characterToDelete = characterId;

            // Act
            tracker.confirmDelete();

            // Assert
            expect(tracker.characters).to.have.length(1);
            expect(tracker.characters[0].isEnemy).to.be.true;
        });
    });

    describe('HP Management', function() {
        beforeEach(function() {
            tracker.addCharacter();
        });

        it('should increase HP', function() {
            // Arrange
            const characterId = tracker.characters[0].id;
            const initialHP = tracker.characters[0].hp;

            // Act
            tracker.changeHP(characterId, 5);

            // Assert
            expect(tracker.characters[0].hp).to.equal(initialHP + 5);
        });

        it('should decrease HP', function() {
            // Arrange
            const characterId = tracker.characters[0].id;
            const initialHP = tracker.characters[0].hp;

            // Act
            tracker.changeHP(characterId, -3);

            // Assert
            expect(tracker.characters[0].hp).to.equal(initialHP - 3);
        });

        it('should not allow HP below zero', function() {
            // Arrange
            const characterId = tracker.characters[0].id;

            // Act
            tracker.changeHP(characterId, -100);

            // Assert
            expect(tracker.characters[0].hp).to.equal(0);
        });
    });

    describe('Initiative Ordering', function() {
        beforeEach(function() {
            // Add multiple characters for ordering tests
            tracker.addCharacter();
            tracker.addCharacter();
            tracker.addEnemy();
        });

        it('should move character up in initiative order', function() {
            // Arrange
            const characterId = tracker.characters[1].id;
            const originalOrder = tracker.characters.map(c => c.id);

            // Act
            tracker.moveCharacter(characterId, 'up');

            // Assert
            expect(tracker.characters[0].id).to.equal(characterId);
            expect(tracker.characters[1].id).to.equal(originalOrder[0]);
        });

        it('should move character down in initiative order', function() {
            // Arrange
            const characterId = tracker.characters[0].id;
            const originalOrder = tracker.characters.map(c => c.id);

            // Act
            tracker.moveCharacter(characterId, 'down');

            // Assert
            expect(tracker.characters[1].id).to.equal(characterId);
            expect(tracker.characters[0].id).to.equal(originalOrder[1]);
        });

        it('should not move character up when at top', function() {
            // Arrange
            const characterId = tracker.characters[0].id;
            const originalOrder = tracker.characters.map(c => c.id);

            // Act
            tracker.moveCharacter(characterId, 'up');

            // Assert
            expect(tracker.characters.map(c => c.id)).to.deep.equal(originalOrder);
        });

        it('should not move character down when at bottom', function() {
            // Arrange
            const characterId = tracker.characters[tracker.characters.length - 1].id;
            const originalOrder = tracker.characters.map(c => c.id);

            // Act
            tracker.moveCharacter(characterId, 'down');

            // Assert
            expect(tracker.characters.map(c => c.id)).to.deep.equal(originalOrder);
        });
    });

    describe('Round Management', function() {
        beforeEach(function() {
            tracker.addCharacter();
            tracker.addEnemy();
        });

        it('should detect when round is complete', function() {
            // Arrange
            tracker.characters.forEach(char => char.completed = true);

            // Act
            const isComplete = tracker.characters.length > 0 &&
                             tracker.characters.every(char => char.completed);

            // Assert
            expect(isComplete).to.be.true;
        });

        it('should not detect round complete when characters remain', function() {
            // Arrange
            tracker.characters[0].completed = true;
            tracker.characters[1].completed = false;

            // Act
            const isComplete = tracker.characters.length > 0 &&
                             tracker.characters.every(char => char.completed);

            // Assert
            expect(isComplete).to.be.false;
        });

        it('should start next round by resetting all characters', function() {
            // Arrange
            tracker.characters.forEach(char => char.completed = true);

            // Act
            tracker.startNextRound();

            // Assert
            tracker.characters.forEach(char => {
                expect(char.completed).to.be.false;
            });
        });
    });

    describe('Data Validation', function() {
        it('should validate character name is not empty', function() {
            // Arrange
            tracker.characterNameInput.value = '';
            const originalLength = tracker.characters.length;

            // Act
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
        });

        it('should validate HP is positive number', function() {
            // Arrange
            tracker.characterHPInput.value = '0';
            const originalLength = tracker.characters.length;

            // Act
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
        });

        it('should validate HP is not zero', function() {
            // Arrange
            tracker.characterHPInput.value = '0';
            const originalLength = tracker.characters.length;

            // Act
            tracker.addCharacter();

            // Assert
            expect(tracker.characters).to.have.length(originalLength);
        });
    });

    describe('Edge Cases', function() {
        it('should handle empty character list', function() {
            // Act & Assert
            expect(tracker.characters).to.have.length(0);
            expect(() => tracker.moveCharacter('nonexistent', 'up')).to.not.throw();
            expect(() => tracker.completeCharacter('nonexistent')).to.not.throw();
        });

        it('should handle single character in list', function() {
            // Arrange
            tracker.addCharacter();

            // Act & Assert
            expect(() => tracker.moveCharacter(tracker.characters[0].id, 'up')).to.not.throw();
            expect(() => tracker.moveCharacter(tracker.characters[0].id, 'down')).to.not.throw();
        });

        it('should handle invalid character ID operations', function() {
            // Act & Assert
            expect(() => tracker.changeHP('invalid-id', 1)).to.not.throw();
            expect(() => tracker.completeCharacter('invalid-id')).to.not.throw();
            expect(() => tracker.returnToDeck('invalid-id')).to.not.throw();
        });
    });
});
