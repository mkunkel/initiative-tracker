/**
 * SessionManager - Handles multiple game sessions with auto-cleanup
 * Manages both named campaigns (permanent) and quick games (temporary with 30-day lifecycle)
 */
class SessionManager {
    constructor() {
        this.STORAGE_KEY = 'it_sessions';
        this.CURRENT_SESSION_KEY = 'it_currentSession';
        this.EXPIRATION_DAYS = 30;
        this.WARNING_DAYS = 25;

        this.sessions = this.loadSessions();
        this.currentSessionId = this.loadCurrentSessionId();

        // Migrate old single-state data if it exists
        this.migrateOldData();
    }

    /**
     * Load all sessions from localStorage
     */
    loadSessions() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading sessions:', e);
            return {};
        }
    }

    /**
     * Save all sessions to localStorage
     */
    saveSessions() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessions));
        } catch (e) {
            console.error('Error saving sessions:', e);
        }
    }

    /**
     * Load current session ID
     */
    loadCurrentSessionId() {
        return localStorage.getItem(this.CURRENT_SESSION_KEY) || null;
    }

    /**
     * Set current session ID
     */
    setCurrentSessionId(sessionId) {
        this.currentSessionId = sessionId;
        localStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);
    }

    /**
     * Migrate old localStorage data to session system
     */
    migrateOldData() {
        const oldCharacters = localStorage.getItem('characters');
        const oldCurrentRound = localStorage.getItem('currentRound');
        const oldTheme = localStorage.getItem('selectedTheme');

        // If old data exists and no sessions exist yet, migrate it
        if (oldCharacters && Object.keys(this.sessions).length === 0) {
            const migrationId = this.generateSessionId('quick');
            this.sessions[migrationId] = {
                id: migrationId,
                name: 'Quick Game',
                type: 'quick',
                theme: oldTheme || 'default',
                gameId: 'default', // Assign default game to migrated data
                created: new Date().toISOString(),
                lastPlayed: new Date().toISOString(),
                characters: JSON.parse(oldCharacters),
                currentRound: parseInt(oldCurrentRound) || 1,
                extendedCount: 0
            };

            this.saveSessions();
            this.setCurrentSessionId(migrationId);

            // Clean up old keys
            localStorage.removeItem('characters');
            localStorage.removeItem('currentRound');

            console.log('Migrated old data to session:', migrationId);
        }

        // Migrate sessions that don't have gameId field
        let needsSave = false;
        for (const sessionId in this.sessions) {
            if (!this.sessions[sessionId].gameId) {
                this.sessions[sessionId].gameId = 'default';
                needsSave = true;
            }
        }

        if (needsSave) {
            this.saveSessions();
            console.log('Migrated sessions to include gameId');
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId(type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${type}-${timestamp}-${random}`;
    }

    /**
     * Create a new session
     */
    createSession(name, type = 'campaign', theme = 'default', gameId = 'default') {
        const sessionId = this.generateSessionId(type);

        this.sessions[sessionId] = {
            id: sessionId,
            name: name,
            type: type,
            theme: theme,
            gameId: gameId,
            created: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            characters: [],
            currentRound: 1,
            extendedCount: 0
        };

        this.saveSessions();
        return sessionId;
    }

    /**
     * Create a new campaign session (convenience method)
     */
    createCampaign(name, theme = 'default', gameId = 'default') {
        return this.createSession(name, 'campaign', theme, gameId);
    }

    /**
     * Create a new quick game session (convenience method)
     */
    createQuickGame(name = null, theme = 'default', gameId = 'default') {
        const gameName = name || `Quick Game ${new Date().toLocaleDateString()}`;
        return this.createSession(gameName, 'quick', theme, gameId);
    }

    /**
     * Get a session by ID
     */
    getSession(sessionId) {
        return this.sessions[sessionId] || null;
    }

    /**
     * Get current session
     */
    getCurrentSession() {
        if (!this.currentSessionId) {
            return null;
        }
        return this.getSession(this.currentSessionId);
    }

    /**
     * Update session data
     */
    updateSession(sessionId, data) {
        if (!this.sessions[sessionId]) {
            console.error('Session not found:', sessionId);
            return false;
        }

        this.sessions[sessionId] = {
            ...this.sessions[sessionId],
            ...data,
            lastPlayed: new Date().toISOString()
        };

        this.saveSessions();
        return true;
    }

    /**
     * Delete a session
     */
    deleteSession(sessionId) {
        if (!this.sessions[sessionId]) {
            return false;
        }

        delete this.sessions[sessionId];
        this.saveSessions();

        // If deleted session was current, clear current session
        if (this.currentSessionId === sessionId) {
            this.currentSessionId = null;
            localStorage.removeItem(this.CURRENT_SESSION_KEY);
        }

        return true;
    }

    /**
     * Rename a session
     */
    renameSession(sessionId, newName) {
        if (!this.sessions[sessionId]) {
            return false;
        }

        this.sessions[sessionId].name = newName;
        this.saveSessions();
        return true;
    }

    /**
     * Convert quick game to campaign
     */
    promoteToCarnapaign(sessionId, newName) {
        if (!this.sessions[sessionId] || this.sessions[sessionId].type !== 'quick') {
            return false;
        }

        this.sessions[sessionId].type = 'campaign';
        this.sessions[sessionId].name = newName;
        delete this.sessions[sessionId].extendedCount;
        this.saveSessions();
        return true;
    }

    /**
     * Extend quick game expiration by 30 days
     */
    extendSession(sessionId) {
        if (!this.sessions[sessionId] || this.sessions[sessionId].type !== 'quick') {
            return false;
        }

        this.sessions[sessionId].lastPlayed = new Date().toISOString();
        this.sessions[sessionId].extendedCount = (this.sessions[sessionId].extendedCount || 0) + 1;
        this.saveSessions();
        return true;
    }

    /**
     * Get all sessions sorted by last played
     */
    getAllSessions() {
        return Object.values(this.sessions).sort((a, b) => {
            return new Date(b.lastPlayed) - new Date(a.lastPlayed);
        });
    }

    /**
     * Get sessions by type
     */
    getSessionsByType(type) {
        return this.getAllSessions().filter(s => s.type === type);
    }

    /**
     * Calculate days since last played
     */
    daysSinceLastPlayed(session) {
        const lastPlayed = new Date(session.lastPlayed);
        const now = new Date();
        const diffTime = Math.abs(now - lastPlayed);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Check for expired quick games
     */
    getExpiredQuickGames() {
        return this.getSessionsByType('quick').filter(session => {
            return this.daysSinceLastPlayed(session) >= this.EXPIRATION_DAYS;
        });
    }

    /**
     * Check for quick games nearing expiration (warning period)
     */
    getWarningQuickGames() {
        return this.getSessionsByType('quick').filter(session => {
            const days = this.daysSinceLastPlayed(session);
            return days >= this.WARNING_DAYS && days < this.EXPIRATION_DAYS;
        });
    }

    /**
     * Get days until expiration for a quick game
     */
    getDaysUntilExpiration(session) {
        if (session.type !== 'quick') {
            return null;
        }

        const daysSince = this.daysSinceLastPlayed(session);
        return Math.max(0, this.EXPIRATION_DAYS - daysSince);
    }

    /**
     * Switch to a different session
     */
    switchSession(sessionId) {
        if (!this.sessions[sessionId]) {
            console.error('Session not found:', sessionId);
            return false;
        }

        // Update last played time
        this.sessions[sessionId].lastPlayed = new Date().toISOString();
        this.saveSessions();

        // Set as current
        this.setCurrentSessionId(sessionId);
        return true;
    }

    /**
     * Duplicate a session
     */
    duplicateSession(sessionId, newName) {
        const original = this.getSession(sessionId);
        if (!original) {
            return null;
        }

        const newSessionId = this.generateSessionId(original.type);

        this.sessions[newSessionId] = {
            ...original,
            id: newSessionId,
            name: newName,
            created: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            extendedCount: 0
        };

        this.saveSessions();
        return newSessionId;
    }

    /**
     * Export a single session in portable format
     */
    exportSession(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return null;
        }

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            sessions: [session]
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Export all sessions in portable format
     */
    exportAllSessions() {
        const allSessions = this.getAllSessions();

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            sessions: allSessions
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import sessions from portable format
     * Returns: { success: boolean, imported: number, skipped: number, error?: string }
     */
    importSessions(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // Validate required fields
            if (!data.version || !data.sessions || !Array.isArray(data.sessions)) {
                return {
                    success: false,
                    imported: 0,
                    skipped: 0,
                    error: 'Invalid import format: missing required fields'
                };
            }

            let imported = 0;
            let skipped = 0;

            for (const session of data.sessions) {
                // Validate session has required fields
                if (!session.id || !session.name || !session.type) {
                    skipped++;
                    continue;
                }

                // Check if session ID already exists
                let sessionId = session.id;
                if (this.sessions[sessionId]) {
                    // Rename the imported session to avoid conflicts
                    session.name = session.name + ' (imported)';
                    sessionId = this.generateSessionId(session.type);
                    session.id = sessionId;
                }

                // Ensure proper structure
                const importedSession = {
                    id: sessionId,
                    name: session.name,
                    type: session.type,
                    characters: session.characters || [],
                    currentRound: session.currentRound || 1,
                    theme: session.theme || 'default',
                    createdAt: session.createdAt || new Date().toISOString(),
                    lastPlayed: session.lastPlayed || new Date().toISOString(),
                    extendedCount: session.extendedCount || 0
                };

                this.sessions[sessionId] = importedSession;
                imported++;
            }

            if (imported > 0) {
                this.saveSessions();
            }

            return {
                success: true,
                imported,
                skipped
            };
        } catch (e) {
            console.error('Error importing sessions:', e);
            return {
                success: false,
                imported: 0,
                skipped: 0,
                error: e.message
            };
        }
    }

    /**
     * Legacy export session as JSON (for backward compatibility)
     */
    exportSessionLegacy(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return null;
        }

        return JSON.stringify(session, null, 2);
    }

    /**
     * Legacy import session from JSON (for backward compatibility)
     */
    importSessionLegacy(jsonData) {
        try {
            const session = JSON.parse(jsonData);

            // Generate new ID to avoid conflicts
            const newSessionId = this.generateSessionId(session.type || 'campaign');
            session.id = newSessionId;
            session.created = new Date().toISOString();
            session.lastPlayed = new Date().toISOString();

            this.sessions[newSessionId] = session;
            this.saveSessions();

            return newSessionId;
        } catch (e) {
            console.error('Error importing session:', e);
            return null;
        }
    }
}

// Export for Node.js (CommonJS) if available
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = SessionManager;
}

