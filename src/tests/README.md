# Testing Guide

This project uses **Vitest** for unit and integration tests, and **Playwright** for end-to-end tests.

## Unit Tests (Vitest)

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Unit Tests

Tests should be placed alongside the code they test, or in a `__tests__` directory.

Example test structure:

```
src/
  components/
    Button.tsx
    Button.test.tsx  # Test next to component
  __tests__/
    utils.test.ts   # Tests for utilities
```

### Test Utilities

Use the custom render function from `src/tests/test-utils.tsx` for components that need providers:

```tsx
import { render, screen } from "@/tests/test-utils";

test("renders with providers", () => {
  render(<MyComponent />);
  // Test assertions
});
```

## E2E Tests (Playwright)

### Setup

First, install Playwright browsers:

```bash
npm run playwright:install
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug
```

### Page Object Model

E2E tests use the Page Object Model pattern for maintainable tests. Page objects are located in `e2e/page-objects/`.

Example usage:

```ts
import { HomePage } from "./page-objects";

test("home page test", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.navigateToHome();
  // Test interactions
});
```

## Best Practices

### Vitest

- Use `vi.fn()` for mocks and spies
- Prefer spies over mocks when possible
- Use inline snapshots for complex assertions
- Structure tests with Arrange-Act-Assert pattern
- Group related tests with `describe` blocks

### Playwright

- Use browser contexts for test isolation
- Leverage locators for resilient element selection
- Implement visual comparison testing
- Use the Page Object Model for maintainability
- Leverage parallel execution for faster test runs

## Configuration

- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `src/tests/setup.ts` - Global test setup for Vitest
