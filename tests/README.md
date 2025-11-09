# Physics Audit Tool - Test Suite

## Setup

Install dependencies:
```bash
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Files

- `search.test.js` - Tests for search functionality and XSS protection
- `data-validation.test.js` - Tests for import data validation and security

## Coverage

Coverage reports are generated in the `coverage/` directory after running `npm run test:coverage`.

## Adding New Tests

1. Create a new test file in the `tests/` directory
2. Import the module you want to test
3. Write test cases using `describe`, `it`, and `expect`
4. Run `npm test` to verify

## Example Test Structure

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { myModule } from '../js/path/to/module.js';

describe('Module Name', () => {
    let mockContext;

    beforeEach(() => {
        // Setup mock context
        mockContext = {
            // ... mock data
        };
    });

    it('should do something', () => {
        const result = myModule.someFunction.call(mockContext);
        expect(result).toBe(expectedValue);
    });
});
```

## Notes

- Tests use Vitest with jsdom environment for DOM testing
- All test files should end with `.test.js`
- Mock contexts are used to simulate Alpine.js component state
