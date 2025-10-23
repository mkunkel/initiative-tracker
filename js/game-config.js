// Game Configuration Manager
// Handles loading, validation, and caching of game configuration files

class GameConfigManager {
    constructor() {
        this.configs = {}; // Cache for loaded configurations
        this.basePath = 'data/games/';
        this.overridePath = 'data/games/overrides/';

        // Detect environment (Node.js vs Browser)
        this.isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

        // Load fs module if in Node.js environment
        if (this.isNode) {
            this.fs = require('fs');
            this.path = require('path');
        }
    }

    /**
     * Load a game configuration file
     * @param {string} gameId - The ID of the game to load
     * @returns {Promise<Object|null>} The game configuration or null if loading fails
     */
    async loadConfig(gameId) {
        // Check cache first
        if (this.configs[gameId]) {
            return this.configs[gameId];
        }

        try {
            let config;

            if (this.isNode) {
                // Node.js environment (tests)
                const filePath = this.path.join(this.basePath, `${gameId}.json`);

                if (!this.fs.existsSync(filePath)) {
                    return null;
                }

                const fileContent = this.fs.readFileSync(filePath, 'utf8');
                config = JSON.parse(fileContent);
            } else {
                // Browser environment
                const response = await fetch(`${this.basePath}${gameId}.json`);

                if (!response.ok) {
                    console.error(`Failed to load config for ${gameId}: ${response.status}`);
                    return null;
                }

                config = await response.json();
            }

            // Load and merge override if it exists
            const override = await this.loadOverride(gameId);
            if (override) {
                config = this.deepMerge(config, override);
                console.log(`Applied override config for ${gameId}`);
            }

            // Validate the configuration
            if (!this.validateConfig(config)) {
                console.error(`Invalid configuration for ${gameId}`);
                return null;
            }

            // Cache the validated configuration
            this.configs[gameId] = config;

            return config;

        } catch (error) {
            console.error(`Error loading config for ${gameId}:`, error);
            return null;
        }
    }

    /**
     * Load an override configuration file
     * @param {string} gameId - The ID of the game
     * @returns {Promise<Object|null>} The override configuration or null if none exists
     */
    async loadOverride(gameId) {
        try {
            let override;

            if (this.isNode) {
                // Node.js environment (tests)
                const filePath = this.path.join(this.overridePath, `${gameId}.json`);

                if (!this.fs.existsSync(filePath)) {
                    return null;
                }

                const fileContent = this.fs.readFileSync(filePath, 'utf8');
                override = JSON.parse(fileContent);
            } else {
                // Browser environment
                const response = await fetch(`${this.overridePath}${gameId}.json`);

                if (!response.ok) {
                    // No override file is fine
                    return null;
                }

                override = await response.json();
            }

            return override;

        } catch (error) {
            // Silently fail - overrides are optional
            return null;
        }
    }

    /**
     * Deep merge two objects
     * @param {Object} target - The base object
     * @param {Object} source - The object to merge in
     * @returns {Object} The merged object
     */
    deepMerge(target, source) {
        // Clone target to avoid mutation
        const result = JSON.parse(JSON.stringify(target));

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] instanceof Object && !Array.isArray(source[key]) && result[key] instanceof Object && !Array.isArray(result[key])) {
                    // Recursively merge objects
                    result[key] = this.deepMerge(result[key], source[key]);
                } else {
                    // Override value (including arrays)
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    /**
     * Validate a game configuration object
     * @param {Object} config - The configuration to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validateConfig(config) {
        return this._validateTopLevel(config) &&
               this._validateResources(config) &&
               this._validatePrimaryResource(config.resources.primary);
    }

    /**
     * Validate top-level configuration fields
     * @private
     */
    _validateTopLevel(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        if (!config.id || typeof config.id !== 'string') {
            return false;
        }

        if (!config.name || typeof config.name !== 'string') {
            return false;
        }

        return true;
    }

    /**
     * Validate resources section
     * @private
     */
    _validateResources(config) {
        if (!config.resources || typeof config.resources !== 'object') {
            return false;
        }

        if (!config.resources.primary || typeof config.resources.primary !== 'object') {
            return false;
        }

        return true;
    }

    /**
     * Validate primary resource configuration
     * @private
     */
    _validatePrimaryResource(primary) {
        const requiredFields = {
            'name': 'string',
            'displayName': 'string',
            'min': 'number',
            'default': 'number',
            'causesDeathAtMin': 'boolean'
        };

        for (const [field, expectedType] of Object.entries(requiredFields)) {
            if (!(field in primary) || typeof primary[field] !== expectedType) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get a loaded configuration by ID
     * @param {string} gameId - The game ID
     * @returns {Object|null} The configuration or null if not loaded
     */
    getConfig(gameId) {
        return this.configs[gameId] || null;
    }

    /**
     * Get all loaded game configurations
     * @returns {Array<Object>} Array of all loaded configurations
     */
    getAllGames() {
        return Object.values(this.configs);
    }

    /**
     * Clear the configuration cache
     */
    clearCache() {
        this.configs = {};
    }
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfigManager;
}

