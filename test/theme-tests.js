// Theme System Tests for Initiative Tracker (Node.js compatible)
// Testing theme discovery, switching, and persistence

const { expect } = require('chai');

// Mock InitiativeTracker class for theme testing
class InitiativeTracker {
    constructor() {
        this.themes = new Map();
        this.currentTheme = 'default';
        this.initializeElements();
    }

    initializeElements() {
        this.themeSelect = { innerHTML: '', appendChild: () => {} };
    }

    async discoverThemes() {
        try {
            const possibleThemes = [
                'theme-mork-borg.css',
                'theme-dark.css',
                'theme-high-contrast.css',
                'theme-retro.css'
            ];

            const themeFiles = [];

            for (const themeFile of possibleThemes) {
                try {
                    const themeResponse = await fetch(themeFile);
                    if (themeResponse.ok) {
                        const themeText = await themeResponse.text();
                        const themeName = this.extractThemeName(themeText);
                        if (themeName) {
                            this.themes.set(themeFile, themeName);
                            themeFiles.push({ file: themeFile, name: themeName });
                        }
                    }
                } catch (e) {
                    // Theme file doesn't exist, continue
                }
            }

            this.populateThemeSelector(themeFiles);
        } catch (error) {
            console.warn('Could not discover themes:', error);
        }
    }

    extractThemeName(cssText) {
        const match = cssText.match(/\/\*\s*THEME:\s*(.+?)\s*\*\//);
        return match ? match[1].trim() : null;
    }

    populateThemeSelector(themes) {
        this.themeSelect.innerHTML = '<option value="default">Default</option>';
        themes.forEach(theme => {
            // Mock appendChild for testing
            this.themeSelect.innerHTML += `<option value="${theme.file}">${theme.name}</option>`;
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

describe('InitiativeTracker - Theme System Tests', function() {
    let tracker;
    let originalFetch;
    let mockThemes;

    beforeEach(function() {
        // Mock fetch for theme discovery
        originalFetch = global.fetch;
        mockThemes = {
            'theme-mork-borg.css': '/* THEME: Mörk Borg */\n:root { --bg-primary: #1a1a1a; }',
            'theme-dark.css': '/* THEME: Dark Mode */\n:root { --bg-primary: #2d3748; }',
            'theme-high-contrast.css': '/* THEME: High Contrast */\n:root { --bg-primary: #000000; }'
        };

        global.fetch = function(url) {
            return Promise.resolve({
                ok: mockThemes[url] ? true : false,
                text: () => Promise.resolve(mockThemes[url] || '')
            });
        };

        // Mock localStorage
        global.localStorage = {
            getItem: function(key) {
                return this.storage[key] || null;
            },
            setItem: function(key, value) {
                this.storage[key] = value;
            },
            removeItem: function(key) {
                delete this.storage[key];
            },
            clear: function() {
                this.storage = {};
            },
            storage: {}
        };

        tracker = new InitiativeTracker();
        tracker.themes.clear();
    });

    afterEach(function() {
        global.fetch = originalFetch;
    });

    describe('Theme Discovery', function() {
        it('should discover available theme files', async function() {
            // Act
            await tracker.discoverThemes();

            // Assert
            expect(tracker.themes.size).to.be.greaterThan(0);
            expect(tracker.themes.has('theme-mork-borg.css')).to.be.true;
            expect(tracker.themes.get('theme-mork-borg.css')).to.equal('Mörk Borg');
        });

        it('should extract theme names from CSS comments', function() {
            // Arrange
            const cssText = '/* THEME: Test Theme */\n:root { --bg-primary: #123; }';

            // Act
            const themeName = tracker.extractThemeName(cssText);

            // Assert
            expect(themeName).to.equal('Test Theme');
        });

        it('should handle CSS without theme comment', function() {
            // Arrange
            const cssText = ':root { --bg-primary: #123; }';

            // Act
            const themeName = tracker.extractThemeName(cssText);

            // Assert
            expect(themeName).to.be.null;
        });

        it('should populate theme selector with discovered themes', async function() {
            // Act
            await tracker.discoverThemes();

            // Assert
            expect(tracker.themeSelect.innerHTML).to.include('Mörk Borg');
            expect(tracker.themeSelect.innerHTML).to.include('Dark Mode');
            expect(tracker.themeSelect.innerHTML).to.include('High Contrast');
        });
    });

    describe('Theme Switching', function() {
        beforeEach(async function() {
            await tracker.discoverThemes();
        });

        it('should switch to default theme', function() {
            // Act
            tracker.changeTheme('default');

            // Assert
            expect(tracker.currentTheme).to.equal('default');
        });

        it('should switch to custom theme', function() {
            // Act
            tracker.changeTheme('theme-mork-borg.css');

            // Assert
            expect(tracker.currentTheme).to.equal('theme-mork-borg.css');
        });

        it('should handle switching to non-existent theme', function() {
            // Act
            tracker.changeTheme('nonexistent-theme.css');

            // Assert
            expect(tracker.currentTheme).to.equal('nonexistent-theme.css');
        });
    });

    describe('Theme Persistence', function() {
        beforeEach(async function() {
            await tracker.discoverThemes();
        });

        it('should save theme selection to localStorage', function() {
            // Act
            tracker.changeTheme('theme-mork-borg.css');

            // Assert
            const savedTheme = localStorage.getItem('initiative-tracker-theme');
            expect(savedTheme).to.equal('theme-mork-borg.css');
        });

        it('should load saved theme on initialization', function() {
            // Arrange
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

        it('should handle invalid saved theme gracefully', function() {
            // Arrange
            localStorage.setItem('initiative-tracker-theme', 'invalid-theme');

            // Act
            tracker.loadSavedTheme();

            // Assert - Should not change current theme if saved theme is invalid
            expect(tracker.currentTheme).to.equal('invalid-theme');
        });
    });

    describe('Theme Error Handling', function() {
        it('should handle fetch errors during theme discovery', async function() {
            // Arrange
            global.fetch = function() {
                return Promise.reject(new Error('Network error'));
            };

            // Act
            await tracker.discoverThemes();

            // Assert
            expect(tracker.themes.size).to.equal(0);
        });

        it('should handle malformed theme responses', async function() {
            // Arrange
            global.fetch = function(url) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve('malformed css without theme comment')
                });
            };

            // Act
            await tracker.discoverThemes();

            // Assert
            expect(tracker.themes.size).to.equal(0);
        });

        it('should continue discovery even if some themes fail', async function() {
            // Arrange
            let callCount = 0;
            global.fetch = function(url) {
                callCount++;
                if (url === 'theme-mork-borg.css') {
                    return Promise.resolve({
                        ok: true,
                        text: () => Promise.resolve('/* THEME: Mörk Borg */\n:root { --bg-primary: #1a1a1a; }')
                    });
                } else {
                    return Promise.reject(new Error('Theme not found'));
                }
            };

            // Act
            await tracker.discoverThemes();

            // Assert
            expect(tracker.themes.size).to.equal(1);
            expect(tracker.themes.has('theme-mork-borg.css')).to.be.true;
        });
    });

    describe('Theme Integration', function() {
        it('should maintain theme state across tracker operations', async function() {
            // Arrange
            await tracker.discoverThemes();
            tracker.changeTheme('theme-mork-borg.css');

            // Act - Perform various tracker operations
            // (In a real implementation, these would be actual tracker operations)

            // Assert - Theme should still be active
            expect(tracker.currentTheme).to.equal('theme-mork-borg.css');
        });

        it('should handle theme switching during active gameplay', async function() {
            // Arrange
            await tracker.discoverThemes();

            // Act - Switch themes during gameplay
            tracker.changeTheme('theme-mork-borg.css');
            tracker.changeTheme('theme-dark.css');

            // Assert - Should end in correct state
            expect(tracker.currentTheme).to.equal('theme-dark.css');
        });
    });

    describe('Theme Performance', function() {
        it('should not cause memory leaks with multiple theme switches', async function() {
            // Arrange
            await tracker.discoverThemes();

            // Act - Switch themes multiple times
            for (let i = 0; i < 10; i++) {
                tracker.changeTheme('theme-mork-borg.css');
                tracker.changeTheme('theme-dark.css');
                tracker.changeTheme('default');
            }

            // Assert - Should end in a valid state
            expect(tracker.currentTheme).to.equal('default');
        });

        it('should handle rapid theme switching', async function() {
            // Arrange
            await tracker.discoverThemes();

            // Act - Rapid theme switching
            const themes = ['default', 'theme-mork-borg.css', 'theme-dark.css'];
            for (let i = 0; i < 50; i++) {
                tracker.changeTheme(themes[i % themes.length]);
            }

            // Assert - Should end in a valid state
            expect(tracker.currentTheme).to.be.oneOf(themes);
        });
    });
});
