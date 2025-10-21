// Test setup file - configures environment for all tests
const { JSDOM } = require('jsdom');

// Setup DOM environment for tests
const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Environment</title>
    </head>
    <body>
        <div id="characterName"></div>
        <div id="characterHP"></div>
        <div id="enemyName"></div>
        <div id="enemyHP"></div>
        <div id="onDeckList"></div>
        <div id="completedList"></div>
        <div id="themeSelect"></div>
        <div id="roundCompleteModal"></div>
        <div id="deleteModal"></div>
    </body>
    </html>
`, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

// Make DOM available globally
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

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

// Mock fetch for theme discovery
global.fetch = async (url) => {
    const mockThemes = {
        'theme-mork-borg.css': '/* THEME: Mörk Borg */\n:root { --bg-primary: #1a1a1a; }',
        'theme-dark.css': '/* THEME: Dark Mode */\n:root { --bg-primary: #2d3748; }',
        'theme-high-contrast.css': '/* THEME: High Contrast */\n:root { --bg-primary: #000000; }'
    };

    return {
        ok: mockThemes[url] ? true : false,
        text: () => Promise.resolve(mockThemes[url] || '')
    };
};

// Mock performance for performance tests
global.performance = {
    now: () => Date.now(),
    memory: {
        usedJSHeapSize: 1000000
    }
};

// Suppress console.error and console.warn during tests to reduce noise from expected error handling
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const suppressedMessages = [
    'Could not save theme to localStorage',
    'Error loading sessions',
    'Error importing sessions',
    'Error importing session',
    'Session not found'
];

console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (!suppressedMessages.some(msg => message.includes(msg))) {
        originalConsoleError.apply(console, args);
    }
};

console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (!suppressedMessages.some(msg => message.includes(msg))) {
        originalConsoleWarn.apply(console, args);
    }
};

console.log('🧪 Test environment configured');
