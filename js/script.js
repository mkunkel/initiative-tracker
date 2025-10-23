// Initiative Tracker JavaScript
class InitiativeTracker {
    constructor() {
        this.characters = []; // Single array for all characters and enemies
        this.enemyCounter = 1;
        this.threatCounter = 1;
        this.objectiveCounter = 1;
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

        // Initialize managers
        this.sessionManager = new SessionManager();
        this.configManager = new GameConfigManager();
        this.gameConfig = null; // Current game configuration
        this.currentGameId = 'default'; // Default game

        this.initializeElements();
        this.bindEvents();
        this.setupThemes();
        this.populateGameSelector(); // Populate game selector
        this.checkForExpiredSessions(); // Check for cleanup before loading
        this.loadGameConfig(this.currentGameId); // Load default game config (theme will be set from config)
        this.loadCharacterNames();
        this.loadSavedData();
        this.populateSessionSelector();
    }

    async loadGameConfig(gameId) {
        this.gameConfig = await this.configManager.loadConfig(gameId);
        this.currentGameId = gameId;

        // Auto-switch theme based on game config
        if (this.gameConfig?.themeFile) {
            const themePath = this.gameConfig.themeFile;
            if (this.themes.has(themePath)) {
                this.changeTheme(themePath);
            }
        } else {
            // Default theme if no theme specified
            this.changeTheme('default');
        }

        return this.gameConfig;
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

        // Entity rename modal elements
        this.renameModal = document.getElementById('renameModal');
        this.renameInput = document.getElementById('renameInput');
        this.confirmEntityRenameBtn = document.getElementById('confirmRename');
        this.cancelEntityRenameBtn = document.getElementById('cancelRename');

        // Entity notes modal elements
        this.notesModal = document.getElementById('notesModal');
        this.notesTextarea = document.getElementById('notesTextarea');
        this.notesEntityName = document.getElementById('notesEntityName');
        this.saveNotesBtn = document.getElementById('saveNotes');
        this.cancelNotesBtn = document.getElementById('cancelNotes');
        this.currentNotesEntityId = null;

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

        // Game selector (theme selector removed - theme is determined by game)
        this.gameSelect = document.getElementById('gameSelect');

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
        this.confirmRenameSessionBtn = document.getElementById('confirmRenameBtn');
        this.cancelRenameSessionBtn = document.getElementById('cancelRenameBtn');

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
        this.confirmEntityRenameBtn.addEventListener('click', () => this.confirmEntityRename());
        this.cancelEntityRenameBtn.addEventListener('click', () => this.cancelEntityRename());

        // Rename input enter key
        this.renameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmEntityRename();
            }
        });

        // Notes modal event listeners
        this.saveNotesBtn.addEventListener('click', () => this.saveEntityNotes());
        this.cancelNotesBtn.addEventListener('click', () => this.cancelEntityNotes());

        // Game selector event (theme changes automatically with game)
        this.gameSelect.addEventListener('change', (e) => this.changeGame(e.target.value));

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
        this.confirmRenameSessionBtn.addEventListener('click', () => this.confirmRename());
        this.cancelRenameSessionBtn.addEventListener('click', () => this.hideModal(this.renameSessionModal));
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

        this.renameModal.addEventListener('click', (e) => {
            if (e.target === this.renameModal) {
                this.cancelEntityRename();
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
                    // Get resource constraints from game config
                    const min = this.gameConfig?.resources?.primary?.min ?? 0;
                    const max = this.gameConfig?.resources?.primary?.max ?? null;

                    const currentValue = parseInt(hpDisplay.textContent) || min;
                    let newValue = currentValue;

                    if (action === 'increase') {
                        newValue = currentValue + 1;
                        // Apply max constraint if it exists
                        if (max !== null) {
                            newValue = Math.min(newValue, max);
                        }
                    } else if (action === 'decrease') {
                        newValue = Math.max(min, currentValue - 1);
                    }

                    hpDisplay.textContent = newValue;
                }
            }
        });

        // Event delegation for entity name clicks (rename)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('clickable-name')) {
                const entityId = e.target.dataset.entityId;
                if (entityId) {
                    this.openEntityRenameModal(entityId);
                }
                e.stopPropagation();
            }
        });

        // Event delegation for character controls
        document.addEventListener('click', (e) => {
            // Use closest to handle clicks on child elements (e.g., spans inside buttons)
            const actionElement = e.target.closest('[data-action]');
            if (!actionElement) return;

            const action = actionElement.dataset.action;
            const characterId = actionElement.dataset.characterId;

            if (!action || !characterId) return;

            e.stopPropagation();

            switch (action) {
                case 'move-to-top':
                    this.moveToTop(characterId);
                    break;
                case 'move-up':
                    this.moveCharacter(characterId, 'up');
                    break;
                case 'move-down':
                    this.moveCharacter(characterId, 'down');
                    break;
                case 'move-to-bottom':
                    this.moveToBottom(characterId);
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
                case 'convert-type':
                    this.convertEntityType(characterId);
                    break;
                case 'toggle-tracker':
                    const trackerId = actionElement.dataset.trackerId;
                    const index = parseInt(actionElement.dataset.index);
                    if (trackerId && index >= 0) {
                        this.updateTracker(characterId, trackerId, index, actionElement.checked);
                    }
                    break;
                case 'attribute-increase':
                    const attrIdInc = actionElement.dataset.attributeId;
                    if (attrIdInc) {
                        this.changeAttribute(characterId, attrIdInc, 1);
                    }
                    break;
                case 'attribute-decrease':
                    const attrIdDec = actionElement.dataset.attributeId;
                    if (attrIdDec) {
                        this.changeAttribute(characterId, attrIdDec, -1);
                    }
                    break;
                case 'toggle-primary':
                    this.togglePrimaryObjective(characterId);
                    break;
                case 'notes':
                    this.openNotesModal(characterId);
                    break;
            }
        });
    }

    // Modal management methods
    openAddCharacterModal() {
        this.generateRandomCharacterName();

        // Check if resource field should be shown in modal
        const showResourceInModal = this.gameConfig?.resources?.primary?.showInModal !== false;
        const characterHPField = document.getElementById('characterHPField');

        // Debug logging
        console.log('Opening Character Modal:', {
            gameId: this.currentGameId,
            showInModal: this.gameConfig?.resources?.primary?.showInModal,
            showResourceInModal: showResourceInModal
        });

        if (characterHPField) {
            characterHPField.style.display = showResourceInModal ? 'flex' : 'none';
        }

        if (showResourceInModal) {
            // Set default resource value
            const defaultValue = this.gameConfig?.resources?.primary?.default ?? 5;
            this.modalCharacterHPInput.textContent = defaultValue;

            // Update resource label
            const resourceLabel = document.getElementById('characterResourceLabel');
            if (resourceLabel) {
                resourceLabel.textContent = this.gameConfig?.resources?.primary?.displayName || 'Hit Points';
            }
        }

        // Render entity type selector based on game config
        this.renderEntityTypeSelector();

        this.showModal(this.addCharacterModal);
        // Focus on name input after modal opens
        setTimeout(() => this.modalCharacterNameInput.focus(), 100);
    }

    renderEntityTypeSelector() {
        const selector = document.querySelector('.entity-type-selector');
        if (!selector) return;

        // Get enabled non-enemy types
        const enabledTypes = this.getEnabledEntityTypes().filter(t => t !== 'enemy');

        if (enabledTypes.length === 0) {
            selector.innerHTML = '<p>No character types available</p>';
            return;
        }

        let html = '';
        for (let i = 0; i < enabledTypes.length; i++) {
            const type = enabledTypes[i];
            const config = this.gameConfig?.entityTypes?.[type];
            const icon = config?.icon || (type === 'pc' ? '👤' : '🤝');
            const label = config?.label || type.toUpperCase();
            const title = type === 'pc' ? 'Player Character' : 'Non-Player Character';
            const checked = i === 0 ? 'checked' : '';

            html += `
                <label class="radio-label" title="${title}">
                    <input type="radio" name="entityType" value="${type}" id="entityType${type.toUpperCase()}" ${checked}>
                    <div class="entity-type-option">
                        <span class="entity-type-icon">${icon}</span> ${label}
                    </div>
                </label>
            `;
        }

        selector.innerHTML = html;
    }

    closeAddCharacterModal() {
        this.hideModal(this.addCharacterModal);
    }

    openAddEnemyModal() {
        // Render enemy subtype selector first (if game has subtypes)
        this.renderEnemySubtypeSelector();

        // Get the default selected subtype (if any)
        const subtypeInput = document.querySelector('input[name="enemySubtype"]:checked');
        const defaultSubtype = subtypeInput ? subtypeInput.value : null;

        // Set enemy name based on config strategy and subtype
        this.modalEnemyNameInput.value = this.generateEnemyName(defaultSubtype);

        // Check if resource field should be shown in modal
        const showResourceInModal = this.gameConfig?.resources?.primary?.showInModal !== false;
        const enemyHPField = document.getElementById('enemyHPField');

        // Debug logging
        console.log('Opening Enemy Modal:', {
            gameId: this.currentGameId,
            showInModal: this.gameConfig?.resources?.primary?.showInModal,
            showResourceInModal: showResourceInModal
        });

        if (enemyHPField) {
            enemyHPField.style.display = showResourceInModal ? 'flex' : 'none';
        }

        if (showResourceInModal) {
            // Set default resource value
            const defaultValue = this.gameConfig?.resources?.primary?.default ?? 5;
            this.modalEnemyHPInput.textContent = defaultValue;

            // Update resource label
            const resourceLabel = document.getElementById('enemyResourceLabel');
            if (resourceLabel) {
                resourceLabel.textContent = this.gameConfig?.resources?.primary?.displayName || 'Hit Points';
            }
        }

        this.showModal(this.addEnemyModal);
        // Focus on name input after modal opens
        setTimeout(() => this.modalEnemyNameInput.focus(), 100);
    }

    renderEnemySubtypeSelector() {
        const field = document.getElementById('enemySubtypeField');
        const selector = document.querySelector('.enemy-subtype-selector');

        if (!field || !selector) return;

        // Check if game has enemy subtypes
        if (!this.gameConfig?.enemySubtypes) {
            field.style.display = 'none';
            return;
        }

        // Show field and populate selector
        field.style.display = 'block';

        let html = '';
        let firstSubtype = true;
        for (const [subtypeId, config] of Object.entries(this.gameConfig.enemySubtypes)) {
            const checked = firstSubtype ? 'checked' : '';
            const icon = config.icon || '❓';
            const label = config.label || subtypeId;

            html += `
                <label class="radio-label">
                    <input type="radio" name="enemySubtype" value="${subtypeId}" ${checked}>
                    <div class="enemy-subtype-option">
                        <span>${icon}</span> ${label}
                    </div>
                </label>
            `;
            firstSubtype = false;
        }

        selector.innerHTML = html;

        // Add event listener to update enemy name when subtype changes
        selector.querySelectorAll('input[name="enemySubtype"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.modalEnemyNameInput.value = this.generateEnemyName(e.target.value);
            });
        });
    }

    closeAddEnemyModal() {
        this.hideModal(this.addEnemyModal);
    }

    addCharacterFromModal() {
        const name = this.modalCharacterNameInput.value.trim();

        // Get selected entity type from radio buttons
        const entityTypeInput = document.querySelector('input[name="entityType"]:checked');
        const entityType = entityTypeInput ? entityTypeInput.value : 'pc';

        if (!name) {
            alert('Please enter a valid name');
            return;
        }

        // Check if resource field is shown in modal
        const showResourceInModal = this.gameConfig?.resources?.primary?.showInModal !== false;
        let resourceValue;

        if (showResourceInModal) {
            resourceValue = parseInt(this.modalCharacterHPInput.textContent);
            const minValue = this.gameConfig?.resources?.primary?.min ?? 1;

            if (isNaN(resourceValue) || resourceValue < minValue) {
                const resourceName = this.gameConfig?.resources.primary.displayName || 'Hit Points';
                alert(`Please enter a valid ${resourceName} (minimum ${minValue})`);
                return;
            }
        } else {
            // Use default value from config when field is hidden
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
            trackers: this.initializeTrackers(entityType),
            completed: false,
            stunned: false,
            dead: false,
            isEnemy: false,
            entityType: entityType  // Use selected type (pc or npc)
        };

        this.characters.push(character);
        this.saveData();
        this.renderCharacters();
        this.closeAddCharacterModal();
    }

    addEnemyFromModal() {
        const name = this.modalEnemyNameInput.value.trim();

        if (!name) {
            alert('Please enter a valid name');
            return;
        }

        // Check if resource field is shown in modal
        const showResourceInModal = this.gameConfig?.resources?.primary?.showInModal !== false;
        let resourceValue;

        if (showResourceInModal) {
            resourceValue = parseInt(this.modalEnemyHPInput.textContent);
            const minValue = this.gameConfig?.resources?.primary?.min ?? 1;

            if (isNaN(resourceValue) || resourceValue < minValue) {
                const resourceName = this.gameConfig?.resources.primary.displayName || 'Hit Points';
                alert(`Please enter a valid ${resourceName} (minimum ${minValue})`);
                return;
            }
        } else {
            // Use default value from config when field is hidden
            resourceValue = this.gameConfig?.resources?.primary?.default ?? 5;
        }

        // Get selected enemy subtype if available
        const subtypeInput = document.querySelector('input[name="enemySubtype"]:checked');
        const enemySubtype = subtypeInput ? subtypeInput.value : null;

        // Check if this enemy subtype should start completed
        const subtypeConfig = enemySubtype ? this.getEnemySubtypeConfig(enemySubtype) : null;
        const startsCompleted = subtypeConfig?.startsCompleted || false;

        const enemy = {
            id: Date.now() + Math.random(),
            name: name,
            primaryResource: {
                value: resourceValue,
                max: resourceValue,
                name: this.gameConfig?.resources.primary.name || 'hp'
            },
            trackers: this.initializeTrackers('enemy'),
            completed: startsCompleted,
            stunned: false,
            dead: false,
            isEnemy: true,
            entityType: 'enemy'  // Always enemy type
        };

        // Add subtype and attributes if game supports them
        if (enemySubtype) {
            enemy.enemySubtype = enemySubtype;
            enemy.attributes = this.initializeEnemyAttributes(enemySubtype);
            enemy.isPrimary = false; // Objectives can be marked primary
            enemy.objectiveCompleted = false; // Objectives can be completed
        }

        this.characters.push(enemy);
        this.saveData();
        this.renderCharacters();

        // Increment the appropriate counter
        if (enemySubtype === 'threat') {
            this.threatCounter++;
        } else if (enemySubtype === 'objective') {
            this.objectiveCounter++;
        } else {
            this.enemyCounter++;
        }

        this.closeAddEnemyModal();
    }

    updateEnemyNameDefault() {
        // This method is no longer needed since clearEnemyInputs handles the increment
    }

    renderCharacters() {
        this.renderOnDeck();
        this.renderCompleted();
        this.renderCompletedObjectives();
        this.renderStunned();
        this.renderDead();
        this.updateTotalAttackIndicator();
        this.checkRoundComplete();
    }

    updateTotalAttackIndicator() {
        const indicator = document.getElementById('totalAttackIndicator');
        if (!indicator) return;

        // Only show for games with threat system
        if (!this.gameConfig?.enemySubtypes?.threat) {
            indicator.style.display = 'none';
            return;
        }

        // Show and update value
        const totalAttack = this.calculateTotalAttack();
        const valueElement = indicator.querySelector('.total-attack-value');
        if (valueElement) {
            valueElement.textContent = totalAttack;
        }
        indicator.style.display = 'flex';
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

        let completedCharacters = this.characters.filter(char =>
            char.completed && !char.stunned && !char.dead && !char.objectiveCompleted
        );

        // Apply custom sorting if game config specifies it
        if (this.gameConfig?.sections) {
            completedCharacters = this.applySectionSorting(completedCharacters, 'completed');
        }

        if (completedCharacters.length === 0) {
            this.completedList.innerHTML = '<div class="empty-state">No completed characters</div>';
            return;
        }

        completedCharacters.forEach((character, index) => {
            const characterCard = this.createCharacterCard(character, index, completedCharacters.length, true);
            this.completedList.appendChild(characterCard);
        });
    }

    renderCompletedObjectives() {
        const section = document.getElementById('completedObjectivesSection');
        const list = document.getElementById('completedObjectivesList');

        if (!section || !list) return;

        // Only show for games with objectives
        if (!this.gameConfig?.enemySubtypes?.objective) {
            section.style.display = 'none';
            return;
        }

        const completedObjectives = this.getCompletedObjectives();

        if (completedObjectives.length === 0) {
            section.style.display = 'none';
            return;
        }

        // Show section and render objectives
        section.style.display = 'block';
        list.innerHTML = '';

        // Sort objectives (primary first)
        const sorted = this.sortObjectives(completedObjectives);

        sorted.forEach((objective, index) => {
            const card = this.createCharacterCard(objective, index, sorted.length, true);
            list.appendChild(card);
        });
    }

    applySectionSorting(characters, sectionId) {
        // sections is an object with keys, not an array
        const sectionConfig = this.gameConfig.sections?.[sectionId];
        if (!sectionConfig || !sectionConfig.sortOrder) {
            return characters;
        }

        // Custom sorting logic for Eat the Reich
        if (this.gameConfig.id === 'eat-the-reich' && sectionId === 'completed') {
            // Separate by type
            const objectives = characters.filter(c => c.enemySubtype === 'objective');
            const threats = characters.filter(c => c.enemySubtype === 'threat');
            const others = characters.filter(c => !c.enemySubtype);

            // Sort each group
            const sortedObjectives = this.sortObjectives(objectives);
            const sortedThreats = this.sortThreats(threats);

            // Combine: Objectives first, then Threats, then others
            return [...sortedObjectives, ...sortedThreats, ...others];
        }

        return characters;
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

        // Add entity type class
        if (character.entityType) {
            cardClasses += ` ${character.entityType}`;
        }

        if (character.isEnemy) cardClasses += ' enemy';
        if (isCompleted) cardClasses += ' completed';
        if (statusType === 'stunned') cardClasses += ' stunned';
        if (statusType === 'dead') cardClasses += ' dead';

        card.className = cardClasses;
        card.dataset.characterId = character.id;

        // Add enemy subtype data attribute if applicable
        if (character.enemySubtype) {
            card.dataset.enemySubtype = character.enemySubtype;
            if (character.objectiveCompleted) {
                card.classList.add('objective-completed');
            }
        }

        // Entity type icon and conversion button
        const entityIcon = this.getEntityTypeIcon(character.entityType || 'pc');
        const convertBtn = (character.entityType !== 'enemy' && this.canConvertEntityType(character.entityType)) ?
            `<button class="control-btn convert-btn" data-action="convert-type" data-character-id="${character.id}" title="${character.entityType === 'pc' ? 'Convert to NPC' : 'Convert to PC'}">🎭</button>` : '';

        // Render enemy attributes if applicable
        const attributesHTML = character.entityType === 'enemy' ? this.renderEnemyAttributes(character) : '';
        const trackersHTML = this.renderTrackers(character);

        // Check if resource (HP/Blood) should be shown for this entity
        const showResource = this.shouldShowResource(character);

        // Show appropriate movement buttons based on position
        const moveToTopBtn = index === totalLength - 1 && totalLength > 1 ? `<button class="control-btn move-btn" data-action="move-to-top" data-character-id="${character.id}" title="Move to top">⏫</button>` : '';
        const moveUpBtn = index > 0 ? `<button class="control-btn move-btn" data-action="move-up" data-character-id="${character.id}" title="Move up">⬆️</button>` : '';
        const moveDownBtn = index < totalLength - 1 ? `<button class="control-btn move-btn" data-action="move-down" data-character-id="${character.id}" title="Move down">⬇️</button>` : '';
        const moveToBottomBtn = index === 0 && totalLength > 1 ? `<button class="control-btn move-btn" data-action="move-to-bottom" data-character-id="${character.id}" title="Move to bottom">⏬</button>` : '';

        // Notes button with badge if notes exist
        const hasNotes = character.notes && character.notes.trim().length > 0;
        const notesBadge = hasNotes ? '<span class="notes-badge"></span>' : '';
        const notesBtn = `<button class="control-btn notes-btn" data-action="notes" data-character-id="${character.id}" title="Add/Edit Notes">📝${notesBadge}</button>`;

        // HP/Resource section (conditionally shown)
        const hpSectionCompleted = showResource ? `
            <div class="hp-section hp-section-completed">
                <button class="hp-btn" data-action="hp-decrease" data-character-id="${character.id}">-</button>
                <div class="hp-display">${character.primaryResource?.value ?? character.hp ?? 0}</div>
                <button class="hp-btn" data-action="hp-increase" data-character-id="${character.id}">+</button>
            </div>` : '';

        const hpSectionOnDeck = showResource ? `
            <div class="hp-section">
                <button class="hp-btn" data-action="hp-decrease" data-character-id="${character.id}">-</button>
                <div class="hp-display">${character.primaryResource?.value ?? character.hp ?? 0}</div>
                <button class="hp-btn" data-action="hp-increase" data-character-id="${character.id}">+</button>
            </div>` : '';

        // Stunned character layout
        if (statusType === 'stunned') {
            const stunRounds = character.stunRounds > 0 ? `<span class="stun-rounds">${character.stunRounds} rounds</span>` : '';
            card.innerHTML = `
                <div class="character-header">
                    <div class="character-name clickable-name" data-entity-id="${character.id}" title="Click to rename"><span class="entity-type-icon">${entityIcon}</span>${character.name} ${stunRounds}</div>
                    <div class="character-controls">
                        ${convertBtn}
                        ${moveToTopBtn}
                        ${moveUpBtn}
                        ${moveDownBtn}
                        ${moveToBottomBtn}
                        ${notesBtn}
                        <button class="control-btn delete-btn" data-action="delete" data-character-id="${character.id}">✖</button>
                    </div>
                </div>
                ${attributesHTML}
                ${trackersHTML}
                ${hpSectionCompleted}
                <button class="return-btn-large" data-action="return-from-stunned" data-character-id="${character.id}">←</button>
            `;
        }
        // Dead character layout
        else if (statusType === 'dead') {
            card.innerHTML = `
                <div class="character-header">
                    <div class="character-name clickable-name" data-entity-id="${character.id}" title="Click to rename"><span class="entity-type-icon">${entityIcon}</span>${character.name}</div>
                    <div class="character-controls">
                        ${convertBtn}
                        ${moveToTopBtn}
                        ${moveUpBtn}
                        ${moveDownBtn}
                        ${moveToBottomBtn}
                        ${notesBtn}
                        <button class="control-btn delete-btn" data-action="delete" data-character-id="${character.id}">✖</button>
                    </div>
                </div>
                ${attributesHTML}
                ${trackersHTML}
                ${hpSectionCompleted}
                <button class="return-btn-large" data-action="return-from-dead" data-character-id="${character.id}">←</button>
            `;
        }
        // Completed character layout
        else if (isCompleted) {
            // Check if this is a threat/objective that shouldn't have a return arrow
            const hasSubtype = character.enemySubtype && (character.enemySubtype === 'threat' || character.enemySubtype === 'objective');
            const returnBtn = hasSubtype ? '' : `<button class="return-btn-large" data-action="return-to-deck" data-character-id="${character.id}">←</button>`;

            card.innerHTML = `
                <div class="character-header">
                    <div class="character-name clickable-name" data-entity-id="${character.id}" title="Click to rename"><span class="entity-type-icon">${entityIcon}</span>${character.name}</div>
                    <div class="character-controls">
                        ${convertBtn}
                        ${moveToTopBtn}
                        ${moveUpBtn}
                        ${moveDownBtn}
                        ${moveToBottomBtn}
                        <button class="control-btn stun-btn" data-action="stun" data-character-id="${character.id}">😵‍💫</button>
                        <button class="control-btn dead-btn" data-action="kill" data-character-id="${character.id}">💀</button>
                        ${notesBtn}
                        <button class="control-btn delete-btn" data-action="delete" data-character-id="${character.id}">✖</button>
                    </div>
                </div>
                ${attributesHTML}
                ${trackersHTML}
                ${hpSectionCompleted}
                ${returnBtn}
            `;
        }
        // On deck character layout
        else {
            card.innerHTML = `
                <div class="character-header">
                    <div class="character-name clickable-name" data-entity-id="${character.id}" title="Click to rename"><span class="entity-type-icon">${entityIcon}</span>${character.name}</div>
                    <div class="character-controls">
                        ${convertBtn}
                        ${moveToTopBtn}
                        ${moveUpBtn}
                        ${moveDownBtn}
                        ${moveToBottomBtn}
                        <button class="control-btn stun-btn" data-action="stun" data-character-id="${character.id}">😵‍💫</button>
                        <button class="control-btn dead-btn" data-action="kill" data-character-id="${character.id}">💀</button>
                        ${notesBtn}
                        <button class="control-btn delete-btn" data-action="delete" data-character-id="${character.id}">✖</button>
                    </div>
                </div>
                ${attributesHTML}
                ${trackersHTML}
                ${hpSectionOnDeck}
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

    /**
     * Move character to the top of the initiative order
     */
    moveToTop(characterId) {
        const onDeckCharacters = this.characters.filter(char => !char.completed);
        const currentIndex = onDeckCharacters.findIndex(char => char.id == characterId);

        if (currentIndex === -1 || currentIndex === 0) return;

        const character = onDeckCharacters[currentIndex];
        const characterIndex = this.characters.findIndex(char => char.id == character.id);

        // Remove character from current position
        const [movedChar] = this.characters.splice(characterIndex, 1);

        // Insert at the beginning (top of on-deck list)
        const firstOnDeckIndex = this.characters.findIndex(char => !char.completed);
        this.characters.splice(firstOnDeckIndex, 0, movedChar);

        this.saveData();
        this.renderCharacters();
    }

    /**
     * Move character to the bottom of the initiative order
     */
    moveToBottom(characterId) {
        const onDeckCharacters = this.characters.filter(char => !char.completed);
        const currentIndex = onDeckCharacters.findIndex(char => char.id == characterId);

        if (currentIndex === -1 || currentIndex === onDeckCharacters.length - 1) return;

        const character = onDeckCharacters[currentIndex];
        const characterIndex = this.characters.findIndex(char => char.id == character.id);

        // Remove character from current position
        const [movedChar] = this.characters.splice(characterIndex, 1);

        // Insert at the end of on-deck list (before completed characters)
        const firstCompletedIndex = this.characters.findIndex(char => char.completed);
        if (firstCompletedIndex === -1) {
            // No completed characters, add to end
            this.characters.push(movedChar);
        } else {
            // Insert before first completed character
            this.characters.splice(firstCompletedIndex, 0, movedChar);
        }

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
        let character = this.characters.find(char => char.id == characterId);
        if (!character) return;

        // Migrate old HP format if needed
        this.migrateCharacterData(character);

        const primary = this.gameConfig?.resources?.primary;
        const min = primary?.min !== undefined ? primary.min : 0;

        // Handle max constraint
        let newValue;
        if (change > 0) {
            // Increasing
            if (primary && primary.max === null) {
                // No max limit
                newValue = character.primaryResource.value + change;
            } else {
                const max = primary?.max !== undefined ? primary.max : character.primaryResource.max;
                newValue = Math.min(character.primaryResource.value + change, max);
            }
        } else {
            // Decreasing
            newValue = Math.max(min, character.primaryResource.value + change);
        }

        character.primaryResource.value = newValue;

        // Automatically move to dead if resource reaches min AND config says it causes death
        if (primary?.causesDeathAtMin && character.primaryResource.value === min && !character.dead) {
            character.dead = true;
            character.completed = false;
            character.stunned = false;
            character.stunnedThisRound = false;
            character.stunRounds = 0;
        }

        this.saveData();
        this.renderCharacters();
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

    openEntityRenameModal(entityId) {
        this.entityToRename = entityId;
        const entity = this.characters.find(char => char.id == entityId);
        if (entity) {
            this.renameInput.value = entity.name;
            this.showModal(this.renameModal);
            this.renameInput.focus();
            this.renameInput.select();
        }
    }

    confirmEntityRename() {
        const newName = this.renameInput.value.trim();
        if (newName && this.entityToRename) {
            this.renameEntity(this.entityToRename, newName);
            this.hideModal(this.renameModal);
            this.entityToRename = null;
        }
    }

    cancelEntityRename() {
        this.hideModal(this.renameModal);
        this.entityToRename = null;
    }

    renameEntity(entityId, newName) {
        const trimmedName = newName.trim();
        if (!trimmedName) return;

        const entity = this.characters.find(char => char.id == entityId);
        if (entity) {
            entity.name = trimmedName;
            this.saveData();
            this.renderCharacters();
        }
    }

    // Notes modal methods
    openNotesModal(entityId) {
        const entity = this.characters.find(char => char.id == entityId);
        if (!entity) return;

        this.currentNotesEntityId = entityId;
        this.notesEntityName.textContent = entity.name;
        this.notesTextarea.value = entity.notes || '';
        this.showModal(this.notesModal);
        setTimeout(() => this.notesTextarea.focus(), 100);
    }

    saveEntityNotes() {
        if (!this.currentNotesEntityId) return;

        const entity = this.characters.find(char => char.id == this.currentNotesEntityId);
        if (entity) {
            entity.notes = this.notesTextarea.value.trim();
            this.saveData();
        }

        this.hideModal(this.notesModal);
        this.currentNotesEntityId = null;
    }

    cancelEntityNotes() {
        this.hideModal(this.notesModal);
        this.currentNotesEntityId = null;
    }

    convertEntityType(entityId) {
        const entity = this.characters.find(char => char.id == entityId);
        if (!entity || entity.entityType === 'enemy') {
            return false; // Can't convert enemies
        }

        // Check if conversion is allowed by game config
        if (!this.canConvertEntityType(entity.entityType)) {
            return false;
        }

        // Toggle between PC and NPC
        entity.entityType = entity.entityType === 'pc' ? 'npc' : 'pc';

        this.saveData();
        this.renderCharacters();
        return true;
    }

    getEnabledEntityTypes() {
        if (!this.gameConfig?.entityTypes) {
            return ['pc', 'npc', 'enemy'];
        }

        const enabled = [];
        for (const [type, config] of Object.entries(this.gameConfig.entityTypes)) {
            if (config.enabled !== false) {
                enabled.push(type);
            }
        }
        return enabled;
    }

    isEntityTypeEnabled(type) {
        if (!this.gameConfig?.entityTypes || !this.gameConfig.entityTypes[type]) {
            return true; // Default to enabled
        }
        return this.gameConfig.entityTypes[type].enabled !== false;
    }

    canConvertEntityType(entityType) {
        if (entityType === 'enemy') return false;

        // Check if both PC and NPC are enabled
        return this.isEntityTypeEnabled('pc') && this.isEntityTypeEnabled('npc');
    }

    getEntityTypeIcon(entityType) {
        // Use icon from game config if available
        if (this.gameConfig?.entityTypes?.[entityType]?.icon) {
            return this.gameConfig.entityTypes[entityType].icon;
        }

        // Fallback to default icons
        const icons = {
            'pc': '👤',
            'npc': '🤝',
            'enemy': '💀'
        };
        return icons[entityType] || '';
    }

    // Enemy Subtype System Methods

    getEnemySubtypeConfig(subtype) {
        if (!this.gameConfig?.enemySubtypes) return null;
        return this.gameConfig.enemySubtypes[subtype];
    }

    initializeEnemyAttributes(subtype) {
        const config = this.getEnemySubtypeConfig(subtype);
        if (!config || !config.attributes) return {};

        const attributes = {};
        for (const attr of config.attributes) {
            attributes[attr.id] = attr.default;
        }
        return attributes;
    }

    changeAttribute(enemyId, attributeId, change) {
        const enemy = this.characters.find(c => c.id == enemyId);
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

        this.saveData();
        this.renderCharacters();
        return true;
    }

    setPrimaryObjective(objectiveId) {
        // Clear all primary flags
        this.characters.forEach(c => {
            if (c.enemySubtype === 'objective') {
                c.isPrimary = false;
            }
        });

        // Set new primary
        const objective = this.characters.find(c => c.id == objectiveId);
        if (objective && objective.enemySubtype === 'objective') {
            objective.isPrimary = true;
            this.saveData();
            this.renderCharacters();
            return true;
        }
        return false;
    }

    togglePrimaryObjective(objectiveId) {
        const objective = this.characters.find(c => c.id == objectiveId);
        if (!objective || objective.enemySubtype !== 'objective') return false;

        if (objective.isPrimary) {
            // Toggle off
            objective.isPrimary = false;
        } else {
            // Toggle on (clear others first)
            this.setPrimaryObjective(objectiveId);
        }

        this.saveData();
        this.renderCharacters();
        return true;
    }

    getThreats() {
        return this.characters.filter(c => c.enemySubtype === 'threat' && !c.dead);
    }

    getObjectives() {
        return this.characters.filter(c => c.enemySubtype === 'objective' && !c.dead);
    }

    getCompletedObjectives() {
        return this.characters.filter(c => c.enemySubtype === 'objective' && c.objectiveCompleted && !c.dead);
    }

    calculateTotalAttack() {
        const threats = this.getThreats();
        if (threats.length === 0) return 0;

        const attacks = threats.map(t => t.attributes?.attack || 0);
        const highestAttack = Math.max(...attacks);
        const otherThreatsCount = threats.length - 1;

        return highestAttack + otherThreatsCount;
    }

    sortThreats(threats) {
        return [...threats].sort((a, b) => {
            const attackA = a.attributes?.attack || 0;
            const attackB = b.attributes?.attack || 0;
            return attackB - attackA; // Descending
        });
    }

    sortObjectives(objectives) {
        return [...objectives].sort((a, b) => {
            // Primary objectives first
            if (a.isPrimary && !b.isPrimary) return -1;
            if (!a.isPrimary && b.isPrimary) return 1;
            return 0; // Otherwise keep order
        });
    }

    migrateCharacterData(character) {
        // Migrate entity type
        if (!character.entityType) {
            // Determine type from existing isEnemy flag
            character.entityType = character.isEnemy ? 'enemy' : 'pc';
        }

        // Migrate HP to primaryResource format
        if ('hp' in character && !character.primaryResource) {
            character.primaryResource = {
                value: character.hp,
                max: character.maxHP || character.hp,
                name: 'hp'
            };
            delete character.hp;
            delete character.maxHP;
        }

        // Initialize trackers if missing
        if (!character.trackers) {
            character.trackers = this.initializeTrackers(character.entityType);
        }

        return character;
    }

    initializeTrackers(entityType) {
        if (!this.gameConfig?.customTrackers) {
            return {};
        }

        const trackers = {};
        for (const tracker of this.gameConfig.customTrackers) {
            // Check if this tracker applies to this entity type
            const applies =
                (entityType === 'pc' && tracker.appliesToPC) ||
                (entityType === 'npc' && tracker.appliesToNPC) ||
                (entityType === 'enemy' && tracker.appliesToEnemy);

            if (applies) {
                if (tracker.type === 'checkbox') {
                    // Initialize array of false values
                    trackers[tracker.id] = new Array(tracker.count).fill(false);
                }
            }
        }
        return trackers;
    }

    updateTracker(characterId, trackerId, index, value) {
        const char = this.characters.find(c => c.id == characterId);
        if (!char || !char.trackers || !char.trackers[trackerId]) {
            return false;
        }

        if (index < 0 || index >= char.trackers[trackerId].length) {
            return false;
        }

        char.trackers[trackerId][index] = value;
        this.saveData();
        this.renderCharacters();
        return true;
    }

    getTrackerValue(characterId, trackerId, index) {
        const char = this.characters.find(c => c.id == characterId);
        if (!char || !char.trackers || !char.trackers[trackerId]) {
            return null;
        }

        return char.trackers[trackerId][index];
    }

    getApplicableTrackers(entityType) {
        if (!this.gameConfig?.customTrackers) {
            return [];
        }

        return this.gameConfig.customTrackers.filter(tracker => {
            if (entityType === 'pc') return tracker.appliesToPC;
            if (entityType === 'npc') return tracker.appliesToNPC;
            if (entityType === 'enemy') return tracker.appliesToEnemy;
            return false;
        });
    }

    renderTrackers(character) {
        const applicableTrackers = this.getApplicableTrackers(character.entityType);

        if (applicableTrackers.length === 0 || !character.trackers) {
            return '';
        }

        // Group trackers by groupLabel
        const groups = {};
        for (const trackerConfig of applicableTrackers) {
            const groupLabel = trackerConfig.groupLabel || 'Trackers';
            if (!groups[groupLabel]) {
                groups[groupLabel] = [];
            }
            groups[groupLabel].push(trackerConfig);
        }

        // Render each group
        let html = '<div class="tracker-groups">';
        for (const [groupLabel, trackerConfigs] of Object.entries(groups)) {
            html += `<div class="tracker-group">`;
            html += `<div class="tracker-group-label">${groupLabel}</div>`;
            html += `<div class="tracker-items">`;

            for (const trackerConfig of trackerConfigs) {
                const trackerState = character.trackers[trackerConfig.id] || [];
                html += `<div class="tracker-item">`;
                html += `<div class="tracker-label">${trackerConfig.label}</div>`;
                html += `<div class="tracker-checkboxes">`;

                for (let i = 0; i < trackerConfig.count; i++) {
                    const checked = trackerState[i] ? 'checked' : '';
                    html += `<input type="checkbox" ${checked}
                             data-action="toggle-tracker"
                             data-character-id="${character.id}"
                             data-tracker-id="${trackerConfig.id}"
                             data-index="${i}">`;
                }

                html += `</div>`;
                html += `</div>`;
            }

            html += `</div>`;
            html += `</div>`;
        }
        html += '</div>';

        return html;
    }

    shouldShowResource(character) {
        // Check config to see if resource applies to this entity type
        const resourceConfig = this.gameConfig?.resources?.primary;

        if (!resourceConfig) return true; // Default: show resource

        // If config specifies applicability, check it
        if (character.entityType === 'pc' && resourceConfig.appliesToPC === false) return false;
        if (character.entityType === 'npc' && resourceConfig.appliesToNPC === false) return false;
        if (character.entityType === 'enemy' && resourceConfig.appliesToEnemy === false) return false;

        return true; // Default: show resource
    }

    renderEnemyAttributes(enemy) {
        if (!enemy.enemySubtype || !enemy.attributes) {
            return '';
        }

        const subtypeConfig = this.getEnemySubtypeConfig(enemy.enemySubtype);
        if (!subtypeConfig || !subtypeConfig.attributes) {
            return '';
        }

        let html = '<div class="enemy-attributes">';

        // Render each attribute with +/- controls
        for (const attrConfig of subtypeConfig.attributes) {
            if (attrConfig.type === 'counter') {
                const value = enemy.attributes[attrConfig.id] || 0;
                html += `
                    <div class="attribute-control">
                        <div class="attribute-label">${attrConfig.label}</div>
                        <div class="attribute-value-controls">
                            <button class="attribute-btn" data-action="attribute-decrease"
                                    data-character-id="${enemy.id}"
                                    data-attribute-id="${attrConfig.id}">−</button>
                            <div class="attribute-value">${value}</div>
                            <button class="attribute-btn" data-action="attribute-increase"
                                    data-character-id="${enemy.id}"
                                    data-attribute-id="${attrConfig.id}">+</button>
                        </div>
                    </div>
                `;
            }
        }

        // Add primary toggle for objectives
        if (enemy.enemySubtype === 'objective') {
            const isPrimaryClass = enemy.isPrimary ? 'is-primary' : '';
            const icon = enemy.isPrimary ? '⭐' : '☆';
            html += `
                <button class="primary-toggle-btn ${isPrimaryClass}"
                        data-action="toggle-primary"
                        data-character-id="${enemy.id}">
                    <span class="primary-icon">${icon}</span>
                    <span>Primary</span>
                </button>
            `;
        }

        html += '</div>';
        return html;
    }

    cancelDelete() {
        this.hideModal(this.deleteModal);
        this.characterToDelete = null;
    }

    checkRoundComplete() {
        if (!this.gameConfig?.entityTypes) {
            // Fallback: all active characters must complete
            const activeCharacters = this.characters.filter(char => !char.dead && !char.stunned);
            const completedCharacters = activeCharacters.filter(char => char.completed);

            if (activeCharacters.length > 0 && completedCharacters.length === activeCharacters.length) {
                this.showModal(this.roundCompleteModal);
            }
            return;
        }

        // Get entities that take turns (excluding dead/stunned)
        const turnTakers = this.getEntitiesThatTakeTurns();

        // Round is complete when all turn-takers are complete
        if (turnTakers.length > 0 && turnTakers.every(c => c.completed)) {
            this.showModal(this.roundCompleteModal);
        }
    }

    getEntitiesThatTakeTurns() {
        if (!this.gameConfig?.entityTypes) {
            return this.characters.filter(c => !c.dead && !c.stunned);
        }

        return this.characters.filter(c => {
            if (c.dead || c.stunned) return false;

            const entityConfig = this.gameConfig.entityTypes[c.entityType];
            return entityConfig && entityConfig.takeTurns;
        });
    }

    startNextRound() {
        // Increment round counter
        this.currentRound++;

        // Reset characters based on game config
        this.characters.forEach(char => {
            // Determine if this entity should be reset
            let shouldReset = false;

            if (!this.gameConfig?.entityTypes) {
                // Fallback: reset all characters
                shouldReset = true;
            } else {
                // Only reset entities that take turns
                const entityConfig = this.gameConfig.entityTypes[char.entityType];
                shouldReset = entityConfig && entityConfig.takeTurns;
            }

            if (shouldReset) {
                char.completed = false;
            }

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
        this.threatCounter = 1;
        this.objectiveCounter = 1;
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

        // Theme selector removed - themes are now determined by game config
        console.log('Themes loaded:', availableThemes);
    }

    extractThemeName(cssText) {
        const match = cssText.match(/\/\*\s*THEME:\s*(.+?)\s*\*\//);
        return match ? match[1].trim() : null;
    }

    // populateThemeSelector() method removed - theme is determined by game config

    populateGameSelector() {
        // List of available games
        const games = [
            { id: 'default', name: 'Default' },
            { id: 'mork-borg', name: 'Mörk Borg' },
            { id: 'cy-borg', name: 'CY_BORG' },
            { id: 'pirate-borg', name: 'Pirate Borg' },
            { id: 'corp-borg', name: 'Corp Borg' },
            { id: 'eat-the-reich', name: 'Eat the Reich' }
        ];

        this.gameSelect.innerHTML = '';
        games.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id;
            option.textContent = game.name;
            this.gameSelect.appendChild(option);
        });

        // Set initial selection
        this.gameSelect.value = this.currentGameId || 'default';
    }

    async changeGame(gameId) {
        if (!gameId || gameId === this.currentGameId) return;

        // Load the new game config
        await this.loadGameConfig(gameId);

        // Update current session with new gameId
        if (this.sessionManager.currentSessionId) {
            this.sessionManager.updateSession(this.sessionManager.currentSessionId, {
                gameId: gameId
            });
        }

        // Re-render everything to apply new config
        this.renderCharacters();
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

    // Theme is now determined by game config, not saved separately
    // loadSavedTheme() method removed

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
    generateEnemyName(enemySubtype = null) {
        const namingConfig = this.gameConfig?.enemyNaming;

        // For threats and objectives, always use subtype-specific naming
        if (enemySubtype === 'threat') {
            return `Threat ${this.threatCounter}`;
        } else if (enemySubtype === 'objective') {
            return `Objective ${this.objectiveCounter}`;
        }

        // For regular enemies, use config strategy
        if (!namingConfig || namingConfig.strategy === 'incremental') {
            // Incremental naming (Enemy 1, Enemy 2, etc.)
            const template = namingConfig?.template || 'Enemy {counter}';
            return template.replace('{counter}', this.enemyCounter);
        } else if (namingConfig.strategy === 'generated') {
            // Use name generation system (like character names)
            return this.generateRandomCharacterName();
        }

        // Fallback to incremental
        return `Enemy ${this.enemyCounter}`;
    }

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

    async loadSessionData(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) return;

        // Load game config for this session
        const gameId = session.gameId || 'default';
        await this.loadGameConfig(gameId);

        // Update game selector to match
        if (this.gameSelect) {
            this.gameSelect.value = gameId;
        }

        // Load characters and round (with migration)
        this.characters = (session.characters || []).map(char => this.migrateCharacterData(char));
        this.currentRound = session.currentRound || 1;
        this.enemyCounter = session.enemyCounter || 1;
        this.threatCounter = session.threatCounter || 1;
        this.objectiveCounter = session.objectiveCounter || 1;

        // Don't change theme when loading session - user's theme preference takes priority
        // Sessions will save in whatever theme the user currently has active

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
            threatCounter: this.threatCounter,
            objectiveCounter: this.objectiveCounter,
            theme: this.currentTheme,
            gameId: this.currentGameId
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

        const sessionId = this.sessionManager.createSession(name, 'campaign', this.currentTheme, this.currentGameId);
        this.sessionManager.setCurrentSessionId(sessionId);

        this.hideModal(this.newCampaignModal);
        this.hideModal(this.manageSessionsModal);
        this.populateSessionSelector();

        // Clear current data for new campaign
        this.characters = [];
        this.currentRound = 1;
        this.enemyCounter = 1;
        this.threatCounter = 1;
        this.objectiveCounter = 1;
        this.renderCharacters();
    }

    createQuickGame() {
        const sessionId = this.sessionManager.createSession('Quick Game', 'quick', this.currentTheme, this.currentGameId);
        this.sessionManager.setCurrentSessionId(sessionId);

        this.hideModal(this.manageSessionsModal);
        this.populateSessionSelector();

        // Clear current data for new game
        this.characters = [];
        this.currentRound = 1;
        this.enemyCounter = 1;
        this.threatCounter = 1;
        this.objectiveCounter = 1;
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

// Export for Node.js (CommonJS) if available
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = InitiativeTracker;
}

// Initialize the tracker when the page loads
let tracker;
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        tracker = new InitiativeTracker();
    });
}
