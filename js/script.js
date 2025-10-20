// Initiative Tracker JavaScript
class InitiativeTracker {
    constructor() {
        this.characters = []; // Single array for all characters and enemies
        this.enemyCounter = 1;
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

        this.initializeElements();
        this.bindEvents();
        this.setupThemes();
        this.loadSavedTheme();
        this.loadCharacterNames();
        this.loadSavedData();
    }

    initializeElements() {
        // Input elements
        this.characterNameInput = document.getElementById('characterName');
        this.characterHPInput = document.getElementById('characterHP');
        this.addCharacterBtn = document.getElementById('addCharacter');
        this.refreshNameBtn = document.getElementById('refreshName');

        this.enemyNameInput = document.getElementById('enemyName');
        this.enemyHPInput = document.getElementById('enemyHP');
        this.addEnemyBtn = document.getElementById('addEnemy');

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

        // Theme selector
        this.themeSelect = document.getElementById('themeSelect');

        // Clear button
        this.clearAllBtn = document.getElementById('clearAll');
    }

    bindEvents() {
        // Character input events
        this.addCharacterBtn.addEventListener('click', () => this.addCharacter());
        this.characterNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCharacter();
        });
        this.characterHPInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCharacter();
        });

        // Auto-select character name on focus
        this.characterNameInput.addEventListener('focus', () => {
            this.characterNameInput.select();
        });

        // Refresh name button
        this.refreshNameBtn.addEventListener('click', () => {
            this.generateRandomCharacterName();
        });

        // Enemy input events
        this.addEnemyBtn.addEventListener('click', () => this.addEnemy());
        this.enemyNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addEnemy();
        });
        this.enemyHPInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addEnemy();
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

    addCharacter() {
        const name = this.characterNameInput.value.trim();
        const hp = parseInt(this.characterHPInput.value);

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
        this.clearCharacterInputs();
    }

    addEnemy() {
        const name = this.enemyNameInput.value.trim();
        const hp = parseInt(this.enemyHPInput.value);

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
        this.clearEnemyInputs();
    }

    clearCharacterInputs() {
        this.generateRandomCharacterName();
        this.characterHPInput.value = '5';
    }

    clearEnemyInputs() {
        this.enemyCounter++;
        this.enemyNameInput.value = `Enemy ${this.enemyCounter}`;
        this.enemyHPInput.value = '5';
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
        // Clear all characters and enemies
        this.characters = [];

        // Reset enemy counter to 1
        this.enemyCounter = 1;

        // Reset enemy name input to "Enemy 1"
        this.enemyNameInput.value = 'Enemy 1';

        // Clear character inputs
        this.characterNameInput.value = '';
        this.characterHPInput.value = '5';

        // Reset enemy HP input
        this.enemyHPInput.value = '5';

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
        const data = {
            characters: this.characters,
            enemyCounter: this.enemyCounter
        };
        localStorage.setItem('initiative-tracker-data', JSON.stringify(data));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('initiative-tracker-data');

        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.characters = data.characters || [];
                this.enemyCounter = data.enemyCounter || 1;

                // Update enemy name input to reflect current counter
                this.enemyNameInput.value = `Enemy ${this.enemyCounter}`;

                // Render the loaded characters
                this.renderCharacters();
            } catch (error) {
                console.error('Error loading saved data:', error);
                // If there's an error, start fresh
                this.characters = [];
                this.enemyCounter = 1;
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
            this.characterNameInput.value = 'Character';
            return;
        }

        const currentName = this.characterNameInput.value;
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

        this.characterNameInput.value = randomName;
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
}

// Initialize the tracker when the page loads
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new InitiativeTracker();
});
