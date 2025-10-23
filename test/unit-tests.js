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
            entityType: 'pc',  // Default to PC type
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
            entityType: 'enemy',  // Always enemy type
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

    moveToTop(characterId) {
        const onDeckCharacters = this.characters.filter(char => !char.completed);
        const currentIndex = onDeckCharacters.findIndex(char => char.id == characterId);

        if (currentIndex === -1 || currentIndex === 0) return;

        const character = onDeckCharacters[currentIndex];
        const characterIndex = this.characters.findIndex(char => char.id == character.id);

        const [movedChar] = this.characters.splice(characterIndex, 1);

        const firstOnDeckIndex = this.characters.findIndex(char => !char.completed);
        this.characters.splice(firstOnDeckIndex, 0, movedChar);
    }

    moveToBottom(characterId) {
        const onDeckCharacters = this.characters.filter(char => !char.completed);
        const currentIndex = onDeckCharacters.findIndex(char => char.id == characterId);

        if (currentIndex === -1 || currentIndex === onDeckCharacters.length - 1) return;

        const character = onDeckCharacters[currentIndex];
        const characterIndex = this.characters.findIndex(char => char.id == character.id);

        const [movedChar] = this.characters.splice(characterIndex, 1);

        const firstCompletedIndex = this.characters.findIndex(char => char.completed);
        if (firstCompletedIndex === -1) {
            this.characters.push(movedChar);
        } else {
            this.characters.splice(firstCompletedIndex, 0, movedChar);
        }
    }

    confirmDelete() {
        if (this.characterToDelete) {
            this.characters = this.characters.filter(char => char.id != this.characterToDelete);
            this.characterToDelete = null;
        }
    }

    renameEntity(entityId, newName) {
        const trimmedName = newName.trim();
        if (!trimmedName) return;

        const entity = this.characters.find(char => char.id == entityId);
        if (entity) {
            entity.name = trimmedName;
        }
    }

    convertEntityType(entityId) {
        const entity = this.characters.find(char => char.id == entityId);
        if (!entity || entity.entityType === 'enemy') {
            return false; // Can't convert enemies
        }

        // Toggle between PC and NPC
        entity.entityType = entity.entityType === 'pc' ? 'npc' : 'pc';
        return true;
    }

    getEntityTypeIcon(entityType) {
        const icons = {
            'pc': '👤',
            'npc': '🤝',
            'enemy': '💀'
        };
        return icons[entityType] || '';
    }

    migrateCharacterData(character) {
        if (!character.entityType) {
            // Determine type from existing isEnemy flag
            character.entityType = character.isEnemy ? 'enemy' : 'pc';
        }
        return character;
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

        it('should rename an entity', function() {
            // Arrange
            tracker.characterNameInput.value = 'Original Name';
            tracker.characterHPInput.value = '10';
            tracker.addCharacter();
            const entityId = tracker.characters[0].id;

            // Act
            tracker.renameEntity(entityId, 'New Name');

            // Assert
            expect(tracker.characters[0].name).to.equal('New Name');
            expect(tracker.characters[0].hp).to.equal(10); // HP unchanged
        });

        it('should not rename with empty name', function() {
            // Arrange
            tracker.addCharacter();
            const entityId = tracker.characters[0].id;
            const originalName = tracker.characters[0].name;

            // Act
            tracker.renameEntity(entityId, '');

            // Assert
            expect(tracker.characters[0].name).to.equal(originalName);
        });

        it('should not rename with whitespace-only name', function() {
            // Arrange
            tracker.addCharacter();
            const entityId = tracker.characters[0].id;
            const originalName = tracker.characters[0].name;

            // Act
            tracker.renameEntity(entityId, '   ');

            // Assert
            expect(tracker.characters[0].name).to.equal(originalName);
        });

        it('should trim whitespace when renaming', function() {
            // Arrange
            tracker.addCharacter();
            const entityId = tracker.characters[0].id;

            // Act
            tracker.renameEntity(entityId, '  Trimmed Name  ');

            // Assert
            expect(tracker.characters[0].name).to.equal('Trimmed Name');
        });

        it('should not rename non-existent entity', function() {
            // Arrange
            tracker.addCharacter();
            const originalName = tracker.characters[0].name;

            // Act - try to rename with invalid ID
            tracker.renameEntity(99999, 'New Name');

            // Assert - original entity unchanged
            expect(tracker.characters[0].name).to.equal(originalName);
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
            tracker.characterNameInput.value = 'Character 1';
            tracker.characterHPInput.value = '10';
            tracker.addCharacter();

            tracker.characterNameInput.value = 'Character 2';
            tracker.characterHPInput.value = '10';
            tracker.addCharacter();

            tracker.enemyNameInput.value = 'Enemy 1';
            tracker.enemyHPInput.value = '8';
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

        it('should move character to top of initiative order', function() {
            // Arrange
            const characterId = tracker.characters[2].id; // Last character
            const originalFirst = tracker.characters[0].id;

            // Act
            tracker.moveToTop(characterId);

            // Assert
            expect(tracker.characters[0].id).to.equal(characterId);
            expect(tracker.characters[1].id).to.equal(originalFirst);
            expect(tracker.characters).to.have.length(3);
        });

        it('should move character to bottom of initiative order', function() {
            // Arrange
            const characterId = tracker.characters[0].id; // First character
            const originalLast = tracker.characters[2].id;

            // Act
            tracker.moveToBottom(characterId);

            // Assert
            expect(tracker.characters[2].id).to.equal(characterId);
            expect(tracker.characters[1].id).to.equal(originalLast);
            expect(tracker.characters).to.have.length(3);
        });

        it('should not change order when moving top character to top', function() {
            // Arrange
            const characterId = tracker.characters[0].id;
            const originalOrder = tracker.characters.map(c => c.id);

            // Act
            tracker.moveToTop(characterId);

            // Assert
            expect(tracker.characters.map(c => c.id)).to.deep.equal(originalOrder);
        });

        it('should not change order when moving bottom character to bottom', function() {
            // Arrange
            const characterId = tracker.characters[2].id;
            const originalOrder = tracker.characters.map(c => c.id);

            // Act
            tracker.moveToBottom(characterId);

            // Assert
            expect(tracker.characters.map(c => c.id)).to.deep.equal(originalOrder);
        });

        it('should handle moveToTop with single character', function() {
            // Arrange
            tracker.characters = [{ id: 1, name: 'Solo', hp: 10 }];
            const originalOrder = tracker.characters.map(c => c.id);

            // Act
            tracker.moveToTop(1);

            // Assert
            expect(tracker.characters.map(c => c.id)).to.deep.equal(originalOrder);
        });

        it('should handle moveToBottom with single character', function() {
            // Arrange
            tracker.characters = [{ id: 1, name: 'Solo', hp: 10 }];
            const originalOrder = tracker.characters.map(c => c.id);

            // Act
            tracker.moveToBottom(1);

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

    describe('Entity Type System', function() {
        beforeEach(function() {
            tracker = new InitiativeTracker();
        });

        describe('Entity Type Initialization', function() {
            it('should default new characters to PC type', function() {
                // Arrange
                tracker.characterNameInput.value = 'Test Character';
                tracker.characterHPInput.value = '10';

                // Act
                tracker.addCharacter();

                // Assert
                expect(tracker.characters).to.have.length(1);
                expect(tracker.characters[0].entityType).to.equal('pc');
                expect(tracker.characters[0].isEnemy).to.be.false;
            });

            it('should set enemies to enemy type', function() {
                // Arrange
                tracker.enemyNameInput.value = 'Test Enemy';
                tracker.enemyHPInput.value = '8';

                // Act
                tracker.addEnemy();

                // Assert
                expect(tracker.characters).to.have.length(1);
                expect(tracker.characters[0].entityType).to.equal('enemy');
                expect(tracker.characters[0].isEnemy).to.be.true;
            });
        });

        describe('Entity Type Conversion', function() {
            it('should convert PC to NPC', function() {
                // Arrange
                tracker.characterNameInput.value = 'Test PC';
                tracker.characterHPInput.value = '10';
                tracker.addCharacter();
                const entityId = tracker.characters[0].id;

                // Act
                const result = tracker.convertEntityType(entityId);

                // Assert
                expect(result).to.be.true;
                expect(tracker.characters[0].entityType).to.equal('npc');
            });

            it('should convert NPC to PC', function() {
                // Arrange
                tracker.characterNameInput.value = 'Test NPC';
                tracker.characterHPInput.value = '10';
                tracker.addCharacter();
                tracker.characters[0].entityType = 'npc'; // Set to NPC first
                const entityId = tracker.characters[0].id;

                // Act
                const result = tracker.convertEntityType(entityId);

                // Assert
                expect(result).to.be.true;
                expect(tracker.characters[0].entityType).to.equal('pc');
            });

            it('should not convert enemies', function() {
                // Arrange
                tracker.enemyNameInput.value = 'Test Enemy';
                tracker.enemyHPInput.value = '8';
                tracker.addEnemy();
                const entityId = tracker.characters[0].id;

                // Act
                const result = tracker.convertEntityType(entityId);

                // Assert
                expect(result).to.be.false;
                expect(tracker.characters[0].entityType).to.equal('enemy');
            });

            it('should return false for non-existent entity', function() {
                // Act
                const result = tracker.convertEntityType('non-existent-id');

                // Assert
                expect(result).to.be.false;
            });

            it('should preserve all entity data during conversion', function() {
                // Arrange
                tracker.characterNameInput.value = 'Test PC';
                tracker.characterHPInput.value = '10';
                tracker.addCharacter();
                const entity = tracker.characters[0];
                entity.completed = true;
                entity.hp = 5;
                const entityId = entity.id;

                // Act
                tracker.convertEntityType(entityId);

                // Assert
                expect(tracker.characters[0].name).to.equal('Test PC');
                expect(tracker.characters[0].hp).to.equal(5);
                expect(tracker.characters[0].maxHP).to.equal(10);
                expect(tracker.characters[0].completed).to.be.true;
                expect(tracker.characters[0].entityType).to.equal('npc');
            });
        });

        describe('Entity Type Icons', function() {
            it('should return correct icon for PC', function() {
                expect(tracker.getEntityTypeIcon('pc')).to.equal('👤');
            });

            it('should return correct icon for NPC', function() {
                expect(tracker.getEntityTypeIcon('npc')).to.equal('🤝');
            });

            it('should return correct icon for Enemy', function() {
                expect(tracker.getEntityTypeIcon('enemy')).to.equal('💀');
            });

            it('should return empty string for unknown type', function() {
                expect(tracker.getEntityTypeIcon('unknown')).to.equal('');
            });
        });

        describe('Data Migration', function() {
            it('should migrate character without entityType to PC', function() {
                // Arrange
                const oldCharacter = {
                    id: 1,
                    name: 'Old Character',
                    hp: 10,
                    maxHP: 10,
                    isEnemy: false,
                    completed: false
                };

                // Act
                const migrated = tracker.migrateCharacterData(oldCharacter);

                // Assert
                expect(migrated.entityType).to.equal('pc');
            });

            it('should migrate enemy without entityType to enemy', function() {
                // Arrange
                const oldEnemy = {
                    id: 2,
                    name: 'Old Enemy',
                    hp: 8,
                    maxHP: 8,
                    isEnemy: true,
                    completed: false
                };

                // Act
                const migrated = tracker.migrateCharacterData(oldEnemy);

                // Assert
                expect(migrated.entityType).to.equal('enemy');
            });

            it('should not modify character that already has entityType', function() {
                // Arrange
                const newCharacter = {
                    id: 3,
                    name: 'New Character',
                    hp: 10,
                    maxHP: 10,
                    isEnemy: false,
                    entityType: 'npc',
                    completed: false
                };

                // Act
                const migrated = tracker.migrateCharacterData(newCharacter);

                // Assert
                expect(migrated.entityType).to.equal('npc');
            });
        });
    });
});
