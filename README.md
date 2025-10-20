# RPG Initiative Tracker

A modern, minimalistic initiative tracker for tabletop RPGs with **persistent data** and **randomized character names**. Works as a **static HTML file** - no server required!

## ✨ Features

- ✅ **Track Characters & Enemies** - Add player characters and enemies with HP tracking
- ✅ **Initiative Order** - Reorder combatants with simple up/down arrows
- ✅ **HP Management** - Quick HP adjustment buttons (+/- HP)
- ✅ **Round Management** - Move combatants to "Completed" when their turn is done
- ✅ **Round Completion** - Automatic detection when all combatants have acted
- ✅ **Return to Deck** - Move completed combatants back for the next round
- ✅ **Auto Enemy Naming** - Enemies automatically numbered (Enemy 1, Enemy 2, etc.)
- ✅ **Randomized Character Names** - Theme-specific character name suggestions
- ✅ **Data Persistence** - All characters/enemies saved to localStorage
- ✅ **Clear All** - Quick reset button for new encounters
- ✅ **Theme Support** - Five unique visual themes with localStorage persistence
- ✅ **Fully Static** - No server needed, works offline!

## 🚀 Quick Start

### Option 1: Direct File (Recommended)
1. Download all files to a folder
2. Open `index.html` in any modern browser
3. Start tracking initiative!

### Option 2: Local Server (for theme development)
```bash
python3 serve.py
# Open http://localhost:8000
```

## 🎨 Themes

The app includes **five unique themes** inspired by tabletop RPGs:

- **Default** - Clean, minimalistic design with fantasy names
- **Mörk Borg** - Dark apocalyptic doom with yellow/black contrast and grim names
- **Pirate Borg** - Aged parchment with vintage nautical map and pirate nicknames
- **Corp Borg** - Yellow office hell: bright yellow background with black/red and corporate titles
- **CY_BORG** - Hot pink neon cyberpunk dystopia with hacker handles
- **Eat the Reich** - Vibrant comic book style with hot pink/cyan and historical names

### Using Themes
1. Click the theme dropdown in the top right corner
2. Select your preferred theme
3. Your choice is automatically saved to localStorage
4. The page title and character names update to match the theme

### Adding New Themes
See [docs/THEMES.md](docs/THEMES.md) for detailed instructions on creating custom themes.

## 🎲 How to Use

### Adding Combatants
1. **Characters**: Enter name (or use the random suggestion) and HP, click "Add Character"
2. **Enemies**: Enter name and HP (auto-numbered), click "Add Enemy"
3. **Quick Entry**: Click the character name field to auto-select and type a custom name

### During Combat
- **Adjust HP**: Use +/- buttons on each combatant card
- **Reorder**: Use ↑/↓ arrows to change initiative order
- **Complete Turn**: Click the → button when a combatant's turn is done
- **Return to Deck**: Click the ← button on completed combatants
- **Delete**: Click the 🗑️ button (with confirmation)

### Data Persistence
- All characters and enemies are **automatically saved** to localStorage
- Your tracker state persists through page refreshes
- Enemy counter continues from where you left off
- Use "Clear All" (top right) to reset everything for a new encounter

### Round Management
- When all combatants are completed, you'll see a modal
- Click "Start Next Round" to reset everyone to "On Deck"
- Initiative order is preserved between rounds

## 🧪 Testing

Comprehensive test suite with 97 tests covering all functionality:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test categories
npm run test:unit        # Core functionality
npm run test:theme       # Theme system
npm run test:integration # User workflows
npm run test:data        # Data persistence
npm run test:ui          # UI interactions

# Watch mode (continuous testing)
npm run test:watch

# Coverage report
npm run test:coverage
```

See [docs/TEST-README.md](docs/TEST-README.md) for detailed testing documentation.

## 📁 File Structure

```
initiative-tracker/
├── index.html              # Main application
├── README.md               # This file
├── serve.py                # Local development server (no-cache)
├── package.json            # NPM configuration
├── package-lock.json       # NPM lock file
├── css/
│   └── styles.css          # Default theme styles
├── themes/
│   ├── theme-mork-borg.css
│   ├── theme-pirate-borg.css
│   ├── theme-cy-borg.css
│   ├── theme-corp-borg.css
│   └── theme-eat-the-reich.css
├── js/
│   └── script.js           # Application logic
├── data/
│   ├── names-default.json
│   ├── names-mork-borg.json
│   ├── names-pirate-borg.json
│   ├── names-cy-borg.json
│   ├── names-corp-borg.json
│   └── names-eat-the-reich.json
├── docs/
│   ├── THEMES.md           # Theme creation guide
│   ├── THEME-GUIDE.md      # Visual theme comparison
│   ├── TEST-README.md      # Testing documentation
│   ├── test-theme-debug.html  # Theme debugging tool
│   └── prompt.txt          # Original project prompt
└── test/                   # Test suite
    ├── setup.js            # Test environment setup
    ├── unit-tests.js       # Unit tests
    ├── theme-tests.js      # Theme tests
    ├── integration-tests.js # Integration tests
    ├── ui-tests.js         # UI tests
    └── data-tests.js       # Data persistence tests
```

## 🎯 Design Philosophy

- **Static & Portable**: No build process, no server, no runtime dependencies
- **Modern UI**: Clean, minimalistic design with glass-morphism effects
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Keyboard navigation and auto-select for quick entry
- **Tested**: Comprehensive test suite ensures reliability
- **Themeable**: Easy to customize appearance with JSON-based name lists

## 🛠️ Technical Details

- **Pure JavaScript** - No frameworks, no dependencies (runtime)
- **CSS Custom Properties** - Easy theming with CSS variables
- **LocalStorage** - Theme preferences and game state persist across sessions
- **Event Delegation** - Efficient handling of dynamic elements
- **JSON Data Files** - Easily extensible character name lists
- **Async Data Loading** - Names loaded from JSON on startup
- **Red-Green-Refactor** - Test-driven development approach with Mocha/Chai

## 🎭 Character Name System

Character names are stored in JSON files in the `data/` directory. Each theme has its own name list:

- Names are randomly selected based on the current theme
- Names never repeat consecutively
- Auto-select on focus for quick customization
- Easily extensible - just edit the JSON files!

### Adding More Names
Edit any `data/names-*.json` file:
```json
{
  "names": [
    "Name 1",
    "Name 2",
    "Name 3"
  ]
}
```

## 📝 License

MIT License - feel free to use, modify, and distribute!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## 💡 Tips

- **Clear All button** in the top right for quick encounter resets
- **Character names** are auto-selected when you click the field - just type!
- **Theme selector** in the top right corner
- **HP buttons** support rapid clicking for quick adjustments
- **Keyboard shortcuts** - Tab through controls, Enter to add characters
- **Mobile friendly** - Works great on tablets at the gaming table!
- **Offline ready** - Once loaded, works without internet connection

---

**Happy Gaming!** 🎲⚔️
