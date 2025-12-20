# E2E Testing with Playwright

This document provides instructions for running and maintaining the E2E test suite.

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests with browser visible
npm run test:e2e:headed
```

## Test Coverage

### Contractor Flows ✅
- Login with valid credentials
- Login error handling
- Portal page display
- Payment success messages
- Payment error messages

### Owner Flows ⏭️
- Owner authentication tests are skipped by default
- Requires Supabase Auth account setup
- To enable: Set `TEST_OWNER_EMAIL` and `TEST_OWNER_PASSWORD` environment variables

## Adding New Tests

1. Create test files in the `tests/` directory
2. Use the existing test files as templates
3. Follow Playwright best practices for selectors and assertions

## CI Integration

E2E tests require a live database connection and are currently designed for local execution only. Future CI integration will require:
- Test database setup
- Environment variable configuration
- Playwright browser installation in CI environment

## Troubleshooting

If tests fail:
1. Ensure the development server is running (`npm run dev`)
2. Check that test data exists in the database (田中次郎 with phone 1234)
3. Review test output and screenshots in `test-results/` directory
4. Use `npm run test:e2e:ui` for interactive debugging
