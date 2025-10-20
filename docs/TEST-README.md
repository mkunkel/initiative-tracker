# Initiative Tracker - Command Line Test Suite

A comprehensive command-line test suite for the RPG Initiative Tracker, similar to RSpec for Ruby. Provides clean CLI output, continuous testing, and detailed reporting.

## 🚀 Quick Start

### 1. Setup
```bash
npm install
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run with watch mode (continuous testing)
npm run test:watch

# Run specific test categories
npm run test:unit
npm run test:theme
```

## 📋 Available Commands

### NPM Scripts
```bash
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:unit           # Run unit tests only
npm run test:integration    # Run integration tests only
npm run test:theme          # Run theme tests only
npm run test:ui             # Run UI tests only
npm run test:data           # Run data tests only
npm run test:coverage       # Run with coverage report
npm run test:verbose        # Run with detailed output
```

### Direct Mocha Commands
```bash
npx mocha test/**/*.js --reporter spec --require test/setup.js
npx mocha test/**/*.js --reporter spec --watch --require test/setup.js
npx mocha test/unit-tests.js --reporter spec --require test/setup.js
npx mocha test/theme-tests.js --reporter spec --require test/setup.js
```

## 🎯 Test Categories

### Unit Tests (`npm run test:unit`)
- Character Management (Add, Delete, Complete)
- Enemy Management (Add, Auto-naming)
- HP Management (Increment/Decrement)
- Initiative Ordering (Move Up/Down)
- Round Management (Complete, Next Round)
- Data Validation
- Edge Cases

### Theme Tests (`npm run test:theme`)
- Theme Discovery
- Theme Switching
- Theme Persistence
- Theme Error Handling
- Theme Integration
- Theme Performance

### Integration Tests (`npm run test:integration`)
- Character Creation Workflow
- Initiative Management Workflow
- HP Management Integration
- Round Management Integration
- Error Handling Integration
- Data Consistency Integration

### UI Tests (`npm run test:ui`)
- Character Card Rendering
- Event Handling
- Modal Management
- Input Validation
- Responsive Behavior
- Accessibility

### Data Tests (`npm run test:data`)
- Theme Persistence
- Data Integrity
- State Management
- Error Recovery
- Memory Management
- Cross-Session Persistence

## 📊 Sample Output

### Successful Test Run
```
🧪 Initiative Tracker Test Suite
──────────────────────────────────────────────────

✅ Test Results
──────────────────────────────────────────────────
15 passed | 0 failed | 0 skipped | 15 total
Duration: 245ms
Pass Rate: 100%

🎉 All tests passed!
```

### Failed Test Run
```
🧪 Initiative Tracker Test Suite
──────────────────────────────────────────────────

F.F..F

❌ Test Results
──────────────────────────────────────────────────
12 passed | 3 failed | 0 skipped | 15 total
Duration: 312ms
Pass Rate: 80%

💥 3 test(s) failed
```

### Verbose Output (`--verbose`)
```
🧪 Initiative Tracker Test Suite
──────────────────────────────────────────────────

📁 InitiativeTracker - Unit Tests
  ✅ should add a character with correct properties
  ✅ should add an enemy with correct properties
  ✅ should increment enemy counter correctly
  ❌ should complete a character
     Error: Expected true to be false
  ✅ should return character to deck

📁 InitiativeTracker - Theme Tests
  ✅ should discover available theme files
  ✅ should extract theme names from CSS comments
  ✅ should populate theme selector with discovered themes
```

## 🔄 Watch Mode

Watch mode provides continuous testing similar to RSpec's `--watch` flag:

```bash
npm run test:watch
# or
./test-runner.js --watch
```

Features:
- Automatically re-runs tests when files change
- Shows only changed test results
- Maintains test history
- Press Ctrl+C to stop

## 🐛 Debugging Tests

### Running Specific Tests
```bash
# Run only theme tests
./test-runner.js --filter=theme

# Run with verbose output for debugging
./test-runner.js --filter=theme --verbose
```

### Test Output Symbols
- `.` - Test passed
- `F` - Test failed
- `S` - Test skipped
- `⏳` - Test running (verbose mode)

### Common Issues
1. **Theme Discovery Failing** - Check if theme files are accessible
2. **Mock Issues** - Verify mock setup in test files
3. **Async Test Failures** - Ensure proper async/await usage

## 🏗️ Red-Green-Refactor Workflow

### Red Phase 🔴
1. Write a failing test
2. Run tests to confirm failure
3. Identify what needs to be implemented

```bash
./test-runner.js --filter=theme --verbose
# Should show failing test
```

### Green Phase 🟢
1. Write minimal code to make test pass
2. Run tests to confirm success
3. Ensure all existing tests still pass

```bash
./test-runner.js
# Should show all tests passing
```

### Refactor Phase 🔵
1. Improve code quality without changing functionality
2. Run tests to ensure nothing breaks
3. Repeat cycle

## 📁 File Structure

```
initiative-tracker/
├── package.json            # NPM configuration with test scripts
└── test/
    ├── setup.js            # Test environment setup
    ├── unit-tests.js       # Unit tests
    ├── theme-tests.js      # Theme tests
    ├── integration-tests.js # Integration tests
    ├── ui-tests.js         # UI tests
    └── data-tests.js       # Data tests
```

## 🔧 Configuration

### Mocha Options
- `--watch` - Continuous testing mode
- `--reporter spec` - Detailed test output
- `--require test/setup.js` - Load test environment
- `--grep <pattern>` - Run tests matching pattern
- `--timeout 5000` - Set test timeout

### Environment Variables
- `NODE_ENV=test` - Set test environment
- `TEST_TIMEOUT=5000` - Set test timeout (ms)

## 🚀 Continuous Integration

For CI/CD integration:

```bash
# In your CI pipeline
npm install
npm test

# Or with coverage
npm run test:coverage
```

## 📈 Performance Testing

The test suite includes performance tests for:
- Large character lists (100+ characters)
- Memory usage monitoring
- Rapid operation handling
- Theme switching performance

## 🤝 Contributing

### Adding New Tests
1. Identify the test category (unit, integration, theme, ui, data)
2. Write test following existing patterns
3. Use descriptive test names
4. Include arrange-act-assert structure
5. Test both success and failure cases

### Test Naming Convention
```javascript
describe('Feature Name', function() {
    it('should do something specific', function() {
        // Test implementation
    });
});
```

## 📚 Dependencies

- **Mocha** - Test framework
- **Chai** - Assertion library
- **JSDOM** - DOM environment for Node.js
- **Sinon** - Mocking and stubbing

## 🎯 Coverage Goals

- Core Functionality: 100%
- User Interactions: 95%
- Theme System: 90%
- Error Handling: 85%
- Edge Cases: 80%
- Performance: 70%

---

**Happy Testing!** 🧪✨
