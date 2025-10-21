// Initiative Tracker JavaScript
class InitiativeTracker {
    constructor() {
        this.characters = []; // Single array for all characters and enemies
        this.enemyCounter = 1;
        this.currentRound = 1;
        this.characterToDelete = null;
        this.characterToStun = null;
        this.stunRoundsValue = 1;
        this.themes = new Map();
        this.currentTheme = 'default';

        // Character name lists by theme (loaded from JSON files)
        this.characterNames = {};
        this.nameFilesMap = {
            'default': 'data/names-default.json',
            'themes/theme-mork-borg.css': 'data/names-mork-borg.json',
            'themes/theme-pirate-borg.css': 'data/names-pirate-borg.json',
            'themes/theme-cy-borg.css': 'data/names-cy-borg.json',
            'themes/theme-corp-borg.css': 'data/names-corp-borg.json',
            'themes/theme-eat-the-reich.css': 'data/names-eat-the-reich.json'
        };

        // Session management variables
        this.sessionToRename = null;
        this.sessionToDelete = null;

        // Initialize SessionManager
        this.sessionManager = new SessionManager();

        this.initializeElements();
        this.bindEvents();
        this.setupThemes();
        this.checkForExpiredSessions(); // Check for cleanup before loading
        this.loadSavedTheme();
        this.loadCharacterNames();
        this.loadSavedData();
        this.populateSessionSelector();
    }

    initializeElements() {
        // List containers
        this.onDeckList = document.getElementById('onDeckList');
        this.completedList = document.getElementById('completedList');
        this.stunnedList = document.getElementById('stunnedList');
        this.deadList = document.getElementById('deadList');

        // Modals
        this.roundCompleteModal = document.getElementById('roundCompleteModal');
        this.deleteModal = document.getElementById('deleteModal');
        this.stunModal = document.getElementById('stunModal');
        this.startNextRoundBtn = document.getElementById('startNextRound');
        this.confirmDeleteBtn = document.getElementById('confirmDelete');
        this.cancelDeleteBtn = document.getElementById('cancelDelete');
        this.confirmStunBtn = document.getElementById('confirmStun');
        this.cancelStunBtn = document.getElementById('cancelStun');
        this.stunIncreaseBtn = document.getElementById('stunIncrease');
        this.stunDecreaseBtn = document.getElementById('stunDecrease');
        this.stunRoundsDisplay = document.getElementById('stunRoundsDisplay');

        // Add modals
        this.addCharacterModal = document.getElementById('addCharacterModal');
        this.addEnemyModal = document.getElementById('addEnemyModal');
        this.openCharacterModalBtn = document.getElementById('openCharacterModal');
        this.openEnemyModalBtn = document.getElementById('openEnemyModal');
        this.modalCharacterNameInput = document.getElementById('modalCharacterName');
        this.modalCharacterHPInput = document.getElementById('modalCharacterHP');
        this.modalAddCharacterBtn = document.getElementById('modalAddCharacter');
        this.cancelCharacterModalBtn = document.getElementById('cancelCharacterModal');
        this.modalRefreshNameBtn = document.getElementById('modalRefreshName');
        this.modalEnemyNameInput = document.getElementById('modalEnemyName');
        this.modalEnemyHPInput = document.getElementById('modalEnemyHP');
        this.modalAddEnemyBtn = document.getElementById('modalAddEnemy');
        this.cancelEnemyModalBtn = document.getElementById('cancelEnemyModal');

        // Theme selector
        this.themeSelect = document.getElementById('themeSelect');

        // Session selector
        this.sessionSelect = document.getElementById('sessionSelect');
        this.manageSessionsBtn = document.getElementById('manageSessionsBtn');

        // Session modals and elements
        this.sessionWarningBanner = document.getElementById('sessionWarningBanner');
        this.warningText = document.getElementById('warningText');
        this.saveWarningSessionBtn = document.getElementById('saveWarningSession');
        this.dismissWarningBtn = document.getElementById('dismissWarning');

        this.sessionCleanupModal = document.getElementById('sessionCleanupModal');
        this.cleanupContent = document.getElementById('cleanupContent');

        this.manageSessionsModal = document.getElementById('manageSessionsModal');
        this.newCampaignBtn = document.getElementById('newCampaignBtn');
        this.newQuickGameBtn = document.getElementById('newQuickGameBtn');
        this.importSessionsBtn = document.getElementById('importSessionsBtn');
        this.exportAllSessionsBtn = document.getElementById('exportAllSessionsBtn');
        this.importFileInput = document.getElementById('importFileInput');
        this.campaignsList = document.getElementById('campaignsList');
        this.quickGamesList = document.getElementById('quickGamesList');
        this.closeManageSessionsBtn = document.getElementById('closeManageSessionsBtn');

        this.newCampaignModal = document.getElementById('newCampaignModal');
        this.campaignNameInput = document.getElementById('campaignNameInput');
        this.createCampaignBtn = document.getElementById('createCampaignBtn');
        this.cancelNewCampaignBtn = document.getElementById('cancelNewCampaignBtn');

        this.renameSessionModal = document.getElementById('renameSessionModal');
        this.renameSessionInput = document.getElementById('renameSessionInput');
        this.confirmRenameBtn = document.getElementById('confirmRenameBtn');
        this.cancelRenameBtn = document.getElementById('cancelRenameBtn');

        // Clear button
        this.clearAllBtn = document.getElementById('clearAll');
    }

    bindEvents() {
        // Modal open buttons
        this.openCharacterModalBtn.addEventListener('click', () => this.openAddCharacterModal());
        this.openEnemyModalBtn.addEventListener('click', () => this.openAddEnemyModal());

        // Character modal events
        this.modalAddCharacterBtn.addEventListener('click', () => this.addCharacterFromModal());
        this.cancelCharacterModalBtn.addEventListener('click', () => this.closeAddCharacterModal());
        this.modalCharacterNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCharacterFromModal();
        });
        this.modalCharacterNameInput.addEventListener('focus', () => {
            this.modalCharacterNameInput.select();
        });
        this.modalRefreshNameBtn.addEventListener('click', () => {
            this.generateRandomCharacterName();
        });

        // Enemy modal events
        this.modalAddEnemyBtn.addEventListener('click', () => this.addEnemyFromModal());
        this.cancelEnemyModalBtn.addEventListener('click', () => this.closeAddEnemyModal());
        this.modalEnemyNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addEnemyFromModal();
        });

        // Modal events
        this.startNextRoundBtn.addEventListener('click', () => this.startNextRound());
        this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        this.cancelDeleteBtn.addEventListener('click', () => this.cancelDelete());
        this.confirmStunBtn.addEventListener('click', () => this.confirmStun());
        this.cancelStunBtn.addEventListener('click', () => this.cancelStun());
        this.stunIncreaseBtn.addEventListener('click', () => this.changeStunRounds(1));
        this.stunDecreaseBtn.addEventListener('click', () => this.changeStunRounds(-1));

        // Theme selector event
        this.themeSelect.addEventListener('change', (e) => this.changeTheme(e.target.value));

        // Clear all button event
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Session selector event
        this.sessionSelect.addEventListener('change', (e) => this.switchSession(e.target.value));

        // Session management button
        this.manageSessionsBtn.addEventListener('click', () => this.openManageSessionsModal());

        // Session warning banner events
        this.saveWarningSessionBtn.addEventListener('click', () => this.saveWarningSessionAsCampaign());
        this.dismissWarningBtn.addEventListener('click', () => this.dismissWarning());

        // Manage sessions modal events
        this.newCampaignBtn.addEventListener('click', () => this.openNewCampaignModal());
        this.newQuickGameBtn.addEventListener('click', () => this.createQuickGame());
        this.importSessionsBtn.addEventListener('click', () => this.importFileInput.click());
        this.exportAllSessionsBtn.addEventListener('click', () => this.exportAllSessions());
        this.importFileInput.addEventListener('change', (e) => this.handleImportFile(e));
        this.closeManageSessionsBtn.addEventListener('click', () => this.hideModal(this.manageSessionsModal));

        // New campaign modal events
        this.createCampaignBtn.addEventListener('click', () => this.createCampaign());
        this.cancelNewCampaignBtn.addEventListener('click', () => this.hideModal(this.newCampaignModal));
        this.campaignNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createCampaign();
        });

        // Rename session modal events
        this.confirmRenameBtn.addEventListener('click', () => this.confirmRename());
        this.cancelRenameBtn.addEventListener('click', () => this.hideModal(this.renameSessionModal));
        this.renameSessionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmRename();
        });

        // Close modals when clicking outside
        this.roundCompleteModal.addEventListener('click', (e) => {
            if (e.target === this.roundCompleteModal) {
                this.hideModal(this.roundCompleteModal);
            }
        });

        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.hideModal(this.deleteModal);
            }
        });

        this.stunModal.addEventListener('click', (e) => {
            if (e.target === this.stunModal) {
                this.cancelStun();
            }
        });

        this.addCharacterModal.addEventListener('click', (e) => {
            if (e.target === this.addCharacterModal) {
                this.closeAddCharacterModal();
            }
        });

        this.addEnemyModal.addEventListener('click', (e) => {
            if (e.target === this.addEnemyModal) {
                this.closeAddEnemyModal();
            }
        });

        // HP button controls in modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-hp-btn')) {
                const modalType = e.target.dataset.modal;
                const action = e.target.dataset.action;
                const hpDisplay = document.getElementById(modalType === 'character' ? 'modalCharacterHP' : 'modalEnemyHP');

                if (hpDisplay) {
                    const currentValue = parseInt(hpDisplay.textContent) || 1;
                    if (action === 'increase') {
                        hpDisplay.textContent = currentValue + 1;
                    } else if (action === 'decrease') {
                        hpDisplay.textContent = Math.max(1, currentValue - 1);
                    }
                }
            }
        });

        // Event delegation for character controls
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const characterId = e.target.dataset.characterId;

            if (!action || !characterId) return;

            e.stopPropagation();

            switch (action) {
                case 'move-up':
                    this.moveCharacter(characterId, 'up');
                    break;
                case 'move-down':
                    this.moveCharacter(characterId, 'down');
                    break;
                case 'complete':
                    this.completeCharacter(characterId);
                    break;
                case 'return-to-deck':
                    this.returnToDeck(characterId);
                    break;
                case 'delete':
                    this.deleteCharacter(characterId);
                    break;
                case 'hp-increase':
                    this.changeHP(characterId, 1);
                    break;
                case 'hp-decrease':
                    this.changeHP(characterId, -1);
                    break;
                case 'stun':
                    this.stunCharacter(characterId);
                    break;
                case 'kill':
                    this.killCharacter(characterId);
                    break;
                case 'return-from-stunned':
                    this.returnFromStunned(characterId);
                    break;
                case 'return-from-dead':
                    this.returnFromDead(characterId);
                    break;
            }
        });
    }

    // Modal management methods
    openAddCharacterModal() {
        this.generateRandomCharacterName();
        this.modalCharacterHPInput.textContent = '5';
        this.showModal(this.addCharacterModal);
        // Focus on name input after modal opens
        setTimeout(() => this.modalCharacterNameInput.focus(), 100);
    }

    closeAddCharacterModal() {
        this.hideModal(this.addCharacterModal);
    }

    openAddEnemyModal() {
        this.modalEnemyNameInput.value = `Enemy ${this.enemyCounter}`;
        this.modalEnemyHPInput.textContent = '5';
        this.showModal(this.addEnemyModal);
        // Focus on name input after modal opens
        setTimeout(() => this.modalEnemyNameInput.focus(), 100);
    }

    closeAddEnemyModal() {
        this.hideModal(this.addEnemyModal);
    }

    addCharacterFromModal() {
        const name = this.modalCharacterNameInput.value.trim();
        const hp = parseInt(this.modalCharacterHPInput.textContent);

        if (!name || isNaN(hp) || hp < 1) {
            alert('Please enter a valid name and hit points (minimum 1)');
            return;
        }

        const character = {
            id: Date.now() + Math.random(),
            name: name,
            hp: hp,
            maxHP: hp,
            isEnemy: false
        };

        this.characters.push(character);
        this.saveData();
        this.renderCharacters();
        this.closeAddCharacterModal();
    }

    addEnemyFromModal() {
        const name = this.modalEnemyNameInput.value.trim();
        const hp = parseInt(this.modalEnemyHPInput.textContent);

        if (!name || isNaN(hp) || hp < 1) {
            alert('Please enter a valid name and hit points (minimum 1)');
            return;
        }

        const enemy = {
            id: Date.now() + Math.random(),
            name: name,
            hp: hp,
            maxHP: hp,
            isEnemy: true
        };

        this.characters.push(enemy);
        this.saveData();
        this.renderCharacters();
        this.enemyCounter++;
        this.closeAddEnemyModal();
    }

    updateEnemyNameDefault() {
        // This method is no longer needed since clearEnemyInputs handles the increment
    }

    renderCharacters() {
        this.renderOnDeck();
        this.renderCompleted();
        this.renderStunned();
        this.renderDead();
        this.checkRoundComplete();
    }

    renderOnDeck() {
        this.onDeckList.innerHTML = '';

        const onDeckCharacters = this.characters.filter(char => !char.completed && !char.stunned && !char.dead);

        if (onDeckCharacters.length === 0) {
            this.onDeckList.innerHTML = '<div class="empty-state">No characters on deck</div>';
            return;
        }

        onDeckCharacters.forEach((character, index) => {
            const characterCard = this.createCharacterCard(character, index, onDeckCharacters.length);
            this.onDeckList.appendChild(characterCard);
        });
    }

    renderCompleted() {
        this.completedList.innerHTML = '';

        const completedCharacters = this.characters.filter(char => char.completed && !char.stunned && !char.dead);

        if (completedCharacters.length === 0) {
            this.completedList.innerHTML = '<div class="empty-state">No completed characters</div>';
            return;
        }

        completedCharacters.forEach((character, index) => {
            const characterCard = this.createCharacterCard(character, index, completedCharacters.length, true);
            this.completedList.appendChild(characterCard);
        });
    }

    renderStunned() {
        this.stunnedList.innerHTML = '';

        const stunnedCharacters = this.characters.filter(char => char.stunned);

        if (stunnedCharacters.length === 0) {
            this.stunnedList.innerHTML = '<div class="empty-state">No stunned characters</div>';
            return;
        }

        stunnedCharacters.forEach((character, index) => {
            const characterCard = this.createCharacterCard(character, index, stunnedCharacters.length, false, 'stunned');
            this.stunnedList.appendChild(characterCard);
        });
    }

    renderDead() {
        this.deadList.innerHTML = '';

        const deadCharacters = this.characters.filter(char => char.dead);

        if (deadCharacters.length === 0) {
            this.deadList.innerHTML = '<div class="empty-state">No dead characters</div>';
            return;
        }

        deadCharacters.forEach((character, index) => {
            const characterCard = this.createCharacterCard(character, index, deadCharacters.length, false, 'dead');
            this.deadList.appendChild(characterCard);
        });
    }

    createCharacterCard(character, index, totalLength, isCompleted = false, statusType = null) {
        const card = document.createElement('div');
        let cardClasses = 'character-card';

        if (character.isEnemy) cardClasses += ' enemy';
        if (isCompleted) cardClasses += ' completed';
        if (statusType === 'stunned') cardClasses += ' stunned';
        if (statusType === 'dead') cardClasses += ' dead';

        card.className = cardClasses;
        card.dataset.characterId = character.id;

        const moveUpBtn = index > 0 ? `<button class="control-btn move-btn" data-action="move-up" data-character-id="${character.id}">↑</button>` : '';
        const moveDownBtn = index < totalLength - 1 ? `<button class="control-btn move-btn" data-action="move-down" data-character-id="${character.id}">↓</button>` : '';

        // Stunned character layout
        if (statusType === 'stunned') {
            const stunRounds = character.stunRounds > 0 ? `<span class="stun-rounds">${character.stunRounds} rounds</span>` : '';
            card.innerHTML = `
                <div class="character-header">
                    <div class="character-name">${character.name} ${stunRounds}</div>
                    <div class="character-controls">
                        ${moveUpBtn}
                        ${moveDownBtn}
                        <button class="control-btn delete-btn" data-action="delete" data-character-id="${character.id}">✖</button>
                    </div>
                </div>
                <div class="hp-section hp-section-completed">
                    <button class="hp-btn" data-action="hp-decrease" data-character-id="${character.id}">-</button>
                    <div class="hp-display">${character.hp}</div>
                    <button class="hp-btn" data-action="hp-increase" data-character-id="${character.id}">+</button>
                </div>
                <button class="return-btn-large" data-action="return-from-stunned" data-character-id="${character.id}">←</button>
            `;
        }
        // Dead character layout
        else if (statusType === 'dead') {
            card.innerHTML = `
                <div class="character-header">
                    <div class="character-name">${character.name}</div>
                    <div class="character-controls">
                        ${moveUpBtn}
                        ${moveDownBtn}
                        <button class="control-btn delete-btn" data-action="delete" data-character-id="${character.id}">✖</button>
                    </div>
                </div>
                <div class="hp-section hp-section-completed">
                    <button class="hp-btn" data-action="hp-decrease" data-character-id="${character.id}">-</button>
                    <div class="hp-display">${character.hp}</div>
                    <button class="hp-btn" data-action="hp-increase" data-character-id="${character.id}">+</button>
                </div>
                <button class="return-btn-large" data-action="return-from-dead" data-character-id="${character.id}">←</button>
            `;
        }
        // Completed character layout
        else if (isCompleted) {
            card.innerHTML = `
                <div class="character-header">
                    <div class="character-name">${character.name}</div>
                    <div class="character-controls">
                        ${moveUpBtn}
                        ${moveDownBtn}
                        <button class="control-btn stun-btn" data-action="stun" data-character-id="${character.id}">😵‍💫</button>
                        <button class="control-btn dead-btn" data-action="kill" data-character-id="${character.id}">💀</button>
                        <button class="control-btn delete-btn" data-action="delete" data-character-id="${character.id}">✖</button>
                    </div>
                </div>
                <div class="hp-section hp-section-completed">
                    <button class="hp-btn" data-action="hp-decrease" data-character-id="${character.id}">-</button>
                    <div class="hp-display">${character.hp}</div>
                    <button class="hp-btn" data-action="hp-increase" data-character-id="${character.id}">+</button>
                </div>
                <button class="return-btn-large" data-action="return-to-deck" data-character-id="${character.id}">←</button>
            `;
        }
        // On deck character layout
        else {
            card.innerHTML = `
                <div class="character-header">
                    <div class="character-name">${character.name}</div>
                    <div class="character-controls">
                        ${moveUpBtn}
                        ${moveDownBtn}
                        <button class="control-btn stun-btn" data-action="stun" data-character-id="${character.id}">😵‍💫</button>
                        <button class="control-btn dead-btn" data-action="kill" data-character-id="${character.id}">💀</button>
                        <button class="control-btn delete-btn" data-action="delete" data-character-id="${character.id}">✖</button>
                    </div>
                </div>
                <div class="hp-section">
                    <button class="hp-btn" data-action="hp-decrease" data-character-id="${character.id}">-</button>
                    <div class="hp-display">${character.hp}</div>
                    <button class="hp-btn" data-action="hp-increase" data-character-id="${character.id}">+</button>
                </div>
                <button class="complete-btn-large" data-action="complete" data-character-id="${character.id}">→</button>
            `;
        }

        return card;
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

        // Find the actual indices in the main characters array
        const character = onDeckCharacters[currentIndex];
        const targetCharacter = onDeckCharacters[newIndex];

        const characterIndex = this.characters.findIndex(char => char.id == character.id);
        const targetIndex = this.characters.findIndex(char => char.id == targetCharacter.id);

        // Simple swap in the main array
        [this.characters[characterIndex], this.characters[targetIndex]] =
        [this.characters[targetIndex], this.characters[characterIndex]];

        this.saveData();
        this.renderCharacters();
    }

    completeCharacter(characterId) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.completed = true;
            this.saveData();
            this.renderCharacters();
        }
    }

    returnToDeck(characterId) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.completed = false;
            this.saveData();
            this.renderCharacters();
        }
    }

    stunCharacter(characterId) {
        this.characterToStun = characterId;
        this.stunRoundsValue = 1;
        this.stunRoundsDisplay.textContent = this.stunRoundsValue;
        this.updateStunButtons();
        this.showModal(this.stunModal);
    }

    changeStunRounds(delta) {
        this.stunRoundsValue = Math.max(1, this.stunRoundsValue + delta);
        this.stunRoundsDisplay.textContent = this.stunRoundsValue;
        this.updateStunButtons();
    }

    updateStunButtons() {
        // Disable decrease button when at minimum (1)
        this.stunDecreaseBtn.disabled = this.stunRoundsValue <= 1;
    }

    confirmStun() {
        if (this.characterToStun) {
            const character = this.characters.find(char => char.id == this.characterToStun);
            if (character) {
                character.stunned = true;
                character.stunRounds = this.stunRoundsValue;
                character.stunnedThisRound = true; // Mark as stunned this round
                character.stunRoundsInitial = this.stunRoundsValue; // Store initial value for reference
                character.completed = false; // Remove from completed if they were there

                this.saveData();
                this.renderCharacters();
            }

            this.hideModal(this.stunModal);
            this.characterToStun = null;
            this.stunRoundsValue = 1;
        }
    }

    cancelStun() {
        this.hideModal(this.stunModal);
        this.characterToStun = null;
        this.stunRoundsValue = 1;
    }

    killCharacter(characterId) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.dead = true;
            character.completed = false; // Remove from completed if they were there
            character.stunned = false; // Remove stunned status if they had it
            character.stunnedThisRound = false; // Clear stun flag
            character.stunRounds = 0;

            this.saveData();
            this.renderCharacters();
        }
    }

    returnFromStunned(characterId) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.stunned = false;
            character.stunRounds = 0;
            character.stunnedThisRound = false;
            character.completed = false;

            this.saveData();
            this.renderCharacters();
        }
    }

    returnFromDead(characterId) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.dead = false;
            character.completed = false;

            this.saveData();
            this.renderCharacters();
        }
    }

    changeHP(characterId, change) {
        const character = this.characters.find(char => char.id == characterId);
        if (character) {
            character.hp = Math.max(0, character.hp + change);

            // Automatically move to dead if HP reaches 0
            if (character.hp === 0 && !character.dead) {
                character.dead = true;
                character.completed = false;
                character.stunned = false;
                character.stunnedThisRound = false;
                character.stunRounds = 0;
            }

            this.saveData();
            this.renderCharacters();
        }
    }

    deleteCharacter(characterId) {
        this.characterToDelete = characterId;
        this.showModal(this.deleteModal);
    }

    confirmDelete() {
        if (this.characterToDelete) {
            this.characters = this.characters.filter(char => char.id != this.characterToDelete);
            this.saveData();
            this.renderCharacters();
            this.hideModal(this.deleteModal);
            this.characterToDelete = null;
        }
    }

    cancelDelete() {
        this.hideModal(this.deleteModal);
        this.characterToDelete = null;
    }

    checkRoundComplete() {
        // Only check active characters (not dead or stunned)
        const activeCharacters = this.characters.filter(char => !char.dead && !char.stunned);
        const completedCharacters = activeCharacters.filter(char => char.completed);

        if (activeCharacters.length > 0 && completedCharacters.length === activeCharacters.length) {
            this.showModal(this.roundCompleteModal);
        }
    }

    startNextRound() {
        // Increment round counter
        this.currentRound++;

        // Reset all characters to not completed
        this.characters.forEach(char => {
            char.completed = false;

            // Countdown stun rounds for stunned characters
            if (char.stunned && char.stunRounds > 0) {
                // Skip countdown if they were just stunned this round
                if (char.stunnedThisRound) {
                    char.stunnedThisRound = false; // Clear the flag for next round
                } else {
                    char.stunRounds--;

                    // If stun duration is over, return character to deck
                    if (char.stunRounds <= 0) {
                        char.stunned = false;
                        char.stunRounds = 0;
                    }
                }
            }
        });

        this.saveData();
        this.hideModal(this.roundCompleteModal);
        this.renderCharacters();
    }

    showModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    clearAll() {
        if (!confirm('Are you sure you want to clear all characters and enemies? This cannot be undone.')) {
            return;
        }

        // Clear all characters and enemies
        this.characters = [];

        // Reset counters
        this.enemyCounter = 1;
        this.currentRound = 1;

        // Save cleared state
        this.saveData();

        // Re-render (which will show empty lists)
        this.renderCharacters();
    }

    // Theme Management Methods
    setupThemes() {
        // Hardcoded theme list for static file usage (no server required)
        const availableThemes = [
            { file: 'themes/theme-mork-borg.css', name: 'Mörk Borg' },
            { file: 'themes/theme-pirate-borg.css', name: 'Pirate Borg' },
            { file: 'themes/theme-corp-borg.css', name: 'Corp Borg' },
            { file: 'themes/theme-cy-borg.css', name: 'CY_BORG' },
            { file: 'themes/theme-eat-the-reich.css', name: 'Eat the Reich' }
            // Add more themes here as you create them:
            // { file: 'themes/theme-dark.css', name: 'Dark Mode' }
        ];

        // Store themes in map
        availableThemes.forEach(theme => {
            this.themes.set(theme.file, theme.name);
        });

        // Populate theme selector
        this.populateThemeSelector(availableThemes);
        console.log('Themes loaded:', availableThemes);
    }

    extractThemeName(cssText) {
        const match = cssText.match(/\/\*\s*THEME:\s*(.+?)\s*\*\//);
        return match ? match[1].trim() : null;
    }

    populateThemeSelector(themes) {
        // Clear existing options except default
        this.themeSelect.innerHTML = '<option value="default">Default</option>';

        // Add discovered themes
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.file;
            option.textContent = theme.name;
            this.themeSelect.appendChild(option);
        });
    }

    changeTheme(themeFile) {
        // Remove existing theme links
        const existingThemeLinks = document.querySelectorAll('link[data-theme]');
        existingThemeLinks.forEach(link => link.remove());

        if (themeFile === 'default') {
            this.currentTheme = 'default';
            localStorage.setItem('initiative-tracker-theme', 'default');
            this.updateTitle('default');
            this.generateRandomCharacterName();
            return;
        }

        // Add new theme link
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = themeFile;
        link.setAttribute('data-theme', themeFile);
        document.head.appendChild(link);

        this.currentTheme = themeFile;
        localStorage.setItem('initiative-tracker-theme', themeFile);

        // Update page title based on theme
        const themeName = this.themes.get(themeFile);
        this.updateTitle(themeName);

        // Generate new random name for the new theme
        this.generateRandomCharacterName();
    }

    updateTitle(themeName) {
        const h1 = document.querySelector('h1');

        if (themeName === 'default') {
            h1.textContent = 'RPG Initiative Tracker';
        } else {
            h1.textContent = `${themeName} Initiative Tracker`;
        }
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('initiative-tracker-theme');

        if (savedTheme && savedTheme !== 'default' && this.themes.has(savedTheme)) {
            this.themeSelect.value = savedTheme;
            this.changeTheme(savedTheme);
        }
    }

    // Data Persistence Methods
    saveData() {
        // Save to current session via SessionManager
        this.saveCurrentSession();
    }

    loadSavedData() {
        // Load from current session via SessionManager
        const currentSession = this.sessionManager.getCurrentSession();

        if (currentSession) {
            this.loadSessionData(currentSession.id);
        } else {
            // No session exists, create a quick game
            const sessions = this.sessionManager.getAllSessions();
            if (sessions.length === 0) {
                this.createQuickGame();
            }
        }
    }

    // Load character names from JSON files
    async loadCharacterNames() {
        // Load all name files
        for (const [theme, filename] of Object.entries(this.nameFilesMap)) {
            try {
                const response = await fetch(filename);
                const data = await response.json();
                // Store the entire data object (not just data.names)
                this.characterNames[theme] = data;
            } catch (error) {
                console.error(`Error loading names for ${theme}:`, error);
                // Fallback to empty array if file can't be loaded
                this.characterNames[theme] = [];
            }
        }

        // Generate initial name after names are loaded
        this.generateRandomCharacterName();
    }

    // Random Name Generation
    generateRandomCharacterName() {
        const nameData = this.characterNames[this.currentTheme] || this.characterNames['default'];

        // If no names loaded yet, use a placeholder
        if (!nameData) {
            this.modalCharacterNameInput.value = 'Character';
            return;
        }

        const currentName = this.modalCharacterNameInput.value;
        let randomName;
        let attempts = 0;
        const maxAttempts = 10;

        // Keep generating until we get a different name (with safety limit)
        do {
            randomName = this.generateNameFromData(nameData);
            attempts++;
            // If we can't find a different name after max attempts, just use what we got
            if (attempts >= maxAttempts) {
                break;
            }
        } while (randomName === currentName);

        this.modalCharacterNameInput.value = randomName;
    }

    generateNameFromData(nameData) {
        // Support both old format (simple array) and new format (object with format/lists)
        if (Array.isArray(nameData)) {
            // Old format: simple array of names
            if (nameData.length === 0) {
                return 'Character';
            }
            return nameData[Math.floor(Math.random() * nameData.length)];
        }

        // New format: object with format string and component lists
        if (nameData.format) {
            return this.generateFromTemplate(nameData.format, nameData);
        }

        // Fallback if neither format works
        return 'Character';
    }

    generateFromTemplate(template, data) {
        const result = this.parseTemplate(template, data);

        // Clean up multiple spaces and trim
        return result.replace(/\s+/g, ' ').trim();
    }

    parseTemplate(template, data) {
        let result = '';
        let i = 0;

        while (i < template.length) {
            const char = template[i];

            if (char === '[') {
                // Optional section - find matching ]
                const optionalEnd = this.findMatchingBracket(template, i, '[', ']');
                if (optionalEnd === -1) {
                    result += char;
                    i++;
                    continue;
                }

                // 50% chance to include optional content
                if (Math.random() < 0.5) {
                    const optionalContent = template.substring(i + 1, optionalEnd);
                    result += this.parseTemplate(optionalContent, data);
                }

                i = optionalEnd + 1;
            } else if (char === '{') {
                // Placeholder - find matching }
                const placeholderEnd = this.findMatchingBracket(template, i, '{', '}');
                if (placeholderEnd === -1) {
                    result += char;
                    i++;
                    continue;
                }

                const content = template.substring(i + 1, placeholderEnd);
                result += this.resolvePlaceholder(content, data);

                i = placeholderEnd + 1;
            } else {
                result += char;
                i++;
            }
        }

        return result;
    }

    findMatchingBracket(str, startPos, openChar, closeChar) {
        let depth = 1;
        let i = startPos + 1;

        while (i < str.length && depth > 0) {
            if (str[i] === openChar) {
                depth++;
            } else if (str[i] === closeChar) {
                depth--;
            }

            if (depth === 0) {
                return i;
            }
            i++;
        }

        return -1; // No matching bracket found
    }

    resolvePlaceholder(content, data) {
        // Handle OR operator: key1|key2|key3
        if (content.includes('|')) {
            const options = this.splitTopLevel(content, '|');

            // Pick a random option
            const selectedOption = options[Math.floor(Math.random() * options.length)].trim();

            // If the selected option has template syntax, parse it
            // Otherwise, resolve it as a direct key
            if (selectedOption.includes('{') || selectedOption.includes('[')) {
                return this.parseTemplate(selectedOption, data);
            } else {
                // Resolve as a simple key
                return this.resolvePlaceholder(selectedOption, data);
            }
        }

        // Simple key lookup
        const list = data[content];

        if (!list || !Array.isArray(list) || list.length === 0) {
            return `{${content}}`;
        }

        // Pick a random value from the list
        return list[Math.floor(Math.random() * list.length)];
    }

    splitTopLevel(str, delimiter) {
        // Split by delimiter but only at the top level (not inside brackets)
        const parts = [];
        let current = '';
        let depth = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === '{' || char === '[') {
                depth++;
                current += char;
            } else if (char === '}' || char === ']') {
                depth--;
                current += char;
            } else if (char === delimiter && depth === 0) {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        if (current.length > 0) {
            parts.push(current);
        }

        return parts;
    }

    // Session Management Methods

    checkForExpiredSessions() {
        const expired = this.sessionManager.getExpiredQuickGames();
        const warning = this.sessionManager.getWarningQuickGames();

        if (expired.length > 0) {
            this.showCleanupModal(expired);
        } else if (warning.length > 0) {
            this.showWarningBanner(warning[0]);
        }
    }

    showCleanupModal(expiredSessions) {
        let content = '<p>The following quick game(s) haven\'t been played in over 30 days:</p><ul>';

        expiredSessions.forEach(session => {
            const extendedText = session.extendedCount > 0
                ? ` (extended ${session.extendedCount} time${session.extendedCount > 1 ? 's' : ''})`
                : '';
            content += `<li><strong>${session.name}</strong>${extendedText}</li>`;
        });

        content += '</ul><p>What would you like to do?</p>';
        content += '<div class="modal-buttons">';
        content += `<button class="primary-btn" onclick="tracker.deleteExpiredSessions()">Delete</button>`;
        content += `<button class="secondary-btn" onclick="tracker.saveToCampaignPrompt('${expiredSessions[0].id}')">💾 Save as Campaign</button>`;
        content += `<button class="secondary-btn" onclick="tracker.extendExpiredSession('${expiredSessions[0].id}')">Keep 30 More Days</button>`;
        content += '</div>';

        this.cleanupContent.innerHTML = content;
        this.showModal(this.sessionCleanupModal);
    }

    showWarningBanner(session) {
        const daysLeft = this.sessionManager.getDaysUntilExpiration(session);
        const extendedText = session.extendedCount > 0
            ? ` This game has been extended ${session.extendedCount} time${session.extendedCount > 1 ? 's' : ''}.`
            : '';

        this.warningText.textContent = `Quick Game "${session.name}" will expire in ${daysLeft} days.${extendedText}`;
        this.sessionWarningBanner.style.display = 'block';

        // Store session ID for later use
        this.sessionWarningBanner.dataset.sessionId = session.id;
    }

    dismissWarning() {
        this.sessionWarningBanner.style.display = 'none';
    }

    saveWarningSessionAsCampaign() {
        const sessionId = this.sessionWarningBanner.dataset.sessionId;
        this.saveToCampaignPrompt(sessionId);
    }

    deleteExpiredSessions() {
        const expired = this.sessionManager.getExpiredQuickGames();
        expired.forEach(session => {
            this.sessionManager.deleteSession(session.id);
        });

        this.hideModal(this.sessionCleanupModal);
        this.populateSessionSelector();

        // If we deleted the current session, clear the tracker
        if (!this.sessionManager.getCurrentSession()) {
            this.characters = [];
            this.currentRound = 1;
            this.renderCharacters();
        }
    }

    extendExpiredSession(sessionId) {
        this.sessionManager.extendSession(sessionId);
        this.hideModal(this.sessionCleanupModal);
        this.dismissWarning();
    }

    saveToCampaignPrompt(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        const campaignName = prompt(`Enter a name for this campaign:`, session.name.replace('Quick Game', 'Campaign'));

        if (campaignName) {
            this.sessionManager.promoteToCarnapaign(sessionId, campaignName);
            this.hideModal(this.sessionCleanupModal);
            this.dismissWarning();
            this.populateSessionSelector();
        }
    }

    populateSessionSelector() {
        const sessions = this.sessionManager.getAllSessions();
        const currentSessionId = this.sessionManager.currentSessionId;

        // Clear existing options except the placeholder
        this.sessionSelect.innerHTML = '<option value="">Select a session...</option>';

        // Group by type
        const campaigns = sessions.filter(s => s.type === 'campaign');
        const quickGames = sessions.filter(s => s.type === 'quick');

        // Add campaigns
        if (campaigns.length > 0) {
            const campaignGroup = document.createElement('optgroup');
            campaignGroup.label = 'Campaigns';
            campaigns.forEach(session => {
                const option = document.createElement('option');
                option.value = session.id;
                option.textContent = session.name;
                if (session.id === currentSessionId) {
                    option.selected = true;
                }
                campaignGroup.appendChild(option);
            });
            this.sessionSelect.appendChild(campaignGroup);
        }

        // Add quick games
        if (quickGames.length > 0) {
            const quickGroup = document.createElement('optgroup');
            quickGroup.label = 'Quick Games';
            quickGames.forEach(session => {
                const option = document.createElement('option');
                option.value = session.id;
                const daysLeft = this.sessionManager.getDaysUntilExpiration(session);
                option.textContent = `${session.name} (${daysLeft} days left)`;
                if (session.id === currentSessionId) {
                    option.selected = true;
                }
                quickGroup.appendChild(option);
            });
            this.sessionSelect.appendChild(quickGroup);
        }

        // If no current session and we have sessions, create a new quick game
        if (!currentSessionId && sessions.length === 0) {
            this.createQuickGame();
        }
    }

    switchSession(sessionId) {
        if (!sessionId) return;

        // Save current session before switching
        this.saveCurrentSession();

        // Switch to new session
        this.sessionManager.switchSession(sessionId);

        // Load new session data
        this.loadSessionData(sessionId);
    }

    loadSessionData(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) return;

        // Load characters and round
        this.characters = session.characters || [];
        this.currentRound = session.currentRound || 1;
        this.enemyCounter = session.enemyCounter || 1;

        // Load theme
        if (session.theme && session.theme !== this.currentTheme) {
            this.themeSelect.value = session.theme;
            this.changeTheme(session.theme);
        }

        // Render
        this.renderCharacters();
    }

    saveCurrentSession() {
        const currentSession = this.sessionManager.getCurrentSession();
        if (!currentSession) return;

        this.sessionManager.updateSession(currentSession.id, {
            characters: this.characters,
            currentRound: this.currentRound,
            enemyCounter: this.enemyCounter,
            theme: this.currentTheme
        });
    }

    openManageSessionsModal() {
        this.renderSessionLists();
        this.showModal(this.manageSessionsModal);
    }

    renderSessionLists() {
        const campaigns = this.sessionManager.getSessionsByType('campaign');
        const quickGames = this.sessionManager.getSessionsByType('quick');

        // Render campaigns
        this.campaignsList.innerHTML = '';
        if (campaigns.length === 0) {
            this.campaignsList.innerHTML = '<p class="empty-message">No campaigns yet. Create one to get started!</p>';
        } else {
            campaigns.forEach(session => {
                this.campaignsList.appendChild(this.createSessionListItem(session));
            });
        }

        // Render quick games
        this.quickGamesList.innerHTML = '';
        if (quickGames.length === 0) {
            this.quickGamesList.innerHTML = '<p class="empty-message">No quick games.</p>';
        } else {
            quickGames.forEach(session => {
                this.quickGamesList.appendChild(this.createSessionListItem(session));
            });
        }
    }

    createSessionListItem(session) {
        const div = document.createElement('div');
        div.className = 'session-item';

        const info = document.createElement('div');
        info.className = 'session-info';

        const name = document.createElement('strong');
        name.textContent = session.name;
        info.appendChild(name);

        const meta = document.createElement('div');
        meta.className = 'session-meta';

        const lastPlayed = new Date(session.lastPlayed);
        const daysSince = this.sessionManager.daysSinceLastPlayed(session);
        meta.textContent = `Last played ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`;

        if (session.type === 'quick') {
            const daysLeft = this.sessionManager.getDaysUntilExpiration(session);
            meta.textContent += ` • Expires in ${daysLeft} days`;

            if (session.extendedCount > 0) {
                meta.textContent += ` • Extended ${session.extendedCount}x`;
            }
        }

        info.appendChild(meta);
        div.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'session-actions';

        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Load';
        loadBtn.className = 'session-btn load-btn';
        loadBtn.onclick = () => {
            this.switchSession(session.id);
            this.hideModal(this.manageSessionsModal);
        };
        actions.appendChild(loadBtn);

        const renameBtn = document.createElement('button');
        renameBtn.textContent = '✏️';
        renameBtn.className = 'session-btn rename-btn';
        renameBtn.title = 'Rename';
        renameBtn.onclick = () => this.openRenameModal(session.id);
        actions.appendChild(renameBtn);

        const exportBtn = document.createElement('button');
        exportBtn.textContent = '📤';
        exportBtn.className = 'session-btn export-btn-small';
        exportBtn.title = 'Export Session';
        exportBtn.onclick = () => this.exportSession(session.id);
        actions.appendChild(exportBtn);

        // Add promote button for quick games
        if (session.type === 'quick') {
            const promoteBtn = document.createElement('button');
            promoteBtn.textContent = '💾';
            promoteBtn.className = 'session-btn promote-btn';
            promoteBtn.title = 'Promote to Campaign';
            promoteBtn.onclick = () => this.promoteQuickGameModal(session.id);
            actions.appendChild(promoteBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✖';
        deleteBtn.className = 'session-btn delete-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => this.deleteSessionConfirm(session.id);
        actions.appendChild(deleteBtn);

        div.appendChild(actions);

        return div;
    }

    openNewCampaignModal() {
        this.campaignNameInput.value = '';
        this.showModal(this.newCampaignModal);
        this.campaignNameInput.focus();
    }

    createCampaign() {
        const name = this.campaignNameInput.value.trim();
        if (!name) {
            alert('Please enter a campaign name');
            return;
        }

        const sessionId = this.sessionManager.createSession(name, 'campaign', this.currentTheme);
        this.sessionManager.setCurrentSessionId(sessionId);

        this.hideModal(this.newCampaignModal);
        this.hideModal(this.manageSessionsModal);
        this.populateSessionSelector();

        // Clear current data for new campaign
        this.characters = [];
        this.currentRound = 1;
        this.enemyCounter = 1;
        this.renderCharacters();
    }

    createQuickGame() {
        const sessionId = this.sessionManager.createSession('Quick Game', 'quick', this.currentTheme);
        this.sessionManager.setCurrentSessionId(sessionId);

        this.hideModal(this.manageSessionsModal);
        this.populateSessionSelector();

        // Clear current data for new game
        this.characters = [];
        this.currentRound = 1;
        this.enemyCounter = 1;
        this.renderCharacters();
    }

    openRenameModal(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        this.sessionToRename = sessionId;
        this.renameSessionInput.value = session.name;
        this.showModal(this.renameSessionModal);
        this.renameSessionInput.focus();
        this.renameSessionInput.select();
    }

    confirmRename() {
        const newName = this.renameSessionInput.value.trim();
        if (!newName) {
            alert('Please enter a session name');
            return;
        }

        this.sessionManager.renameSession(this.sessionToRename, newName);
        this.sessionToRename = null;

        this.hideModal(this.renameSessionModal);
        this.renderSessionLists();
        this.populateSessionSelector();
    }

    deleteSessionConfirm(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (confirm(`Are you sure you want to delete "${session.name}"? This cannot be undone.`)) {
            this.sessionManager.deleteSession(sessionId);
            this.renderSessionLists();
            this.populateSessionSelector();

            // If we deleted the current session, clear the tracker
            if (sessionId === this.sessionManager.currentSessionId) {
                this.characters = [];
                this.currentRound = 1;
                this.renderCharacters();
            }
        }
    }

    promoteQuickGameModal(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        const campaignName = prompt(
            `Promote "${session.name}" to a permanent campaign.\n\nEnter a name for this campaign:`,
            session.name.replace('Quick Game', 'Campaign')
        );

        if (campaignName) {
            this.sessionManager.promoteToCarnapaign(sessionId, campaignName);
            this.renderSessionLists();
            this.populateSessionSelector();

            // Show success message
            alert(`"${campaignName}" has been promoted to a campaign! It will no longer expire.`);
        }
    }

    /**
     * Export a single session to a JSON file
     */
    exportSession(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            alert('Session not found');
            return;
        }

        const jsonData = this.sessionManager.exportSession(sessionId);
        const safeFilename = session.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const filename = `${safeFilename}-${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(jsonData, filename, 'application/json');
    }

    /**
     * Export all sessions to a JSON file
     */
    exportAllSessions() {
        const jsonData = this.sessionManager.exportAllSessions();
        const filename = `initiative-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(jsonData, filename, 'application/json');
    }

    /**
     * Handle file import from file input
     */
    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonData = e.target.result;
            const result = this.sessionManager.importSessions(jsonData);

            if (result.success) {
                alert(`Successfully imported ${result.imported} session(s)!${result.skipped > 0 ? `\n${result.skipped} session(s) were skipped due to invalid data.` : ''}`);
                this.renderSessionLists();
                this.populateSessionSelector();
            } else {
                alert(`Import failed: ${result.error}`);
            }

            // Reset file input
            event.target.value = '';
        };

        reader.onerror = () => {
            alert('Error reading file. Please try again.');
            event.target.value = '';
        };

        reader.readAsText(file);
    }

    /**
     * Download data as a file
     */
    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize the tracker when the page loads
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new InitiativeTracker();
});
