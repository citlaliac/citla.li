# Testing Guide

This document explains how to run tests for the citla.li portfolio website.

## Quick Start

Run all tests:
```bash
npm test
```

Run tests in CI mode (no watch, exits after completion):
```bash
npm run test:ci
```

Run tests with coverage report:
```bash
npm run test:coverage
```

## Test Structure

Tests are organized to match the source code structure:

- `src/__tests__/` - App-level and integration tests
- `src/pages/__tests__/` - Page component tests
- `src/pages/photos/__tests__/` - Photo album page tests
- `src/components/__tests__/` - Component tests

## What's Tested

### Critical Functionality (Must Pass Before Deploy)

1. **Photo Pages** (`src/pages/photos/__tests__/`)
   - All photo album pages render correctly
   - Image paths are correctly formatted (`/assets/photos/{album}/{photo}`)
   - Images have proper alt text
   - Photo grid containers exist

2. **Routing** (`src/__tests__/App.test.js`)
   - All routes render without crashing
   - Photo collection routes work
   - Tech section routes work
   - Mobile routing for `/read` works

3. **See Page** (`src/pages/__tests__/SeePage.test.js`)
   - All collection links render
   - Links have correct paths
   - Collection images use correct paths

4. **Image Path Validation** (`src/__tests__/ImagePathValidation.test.js`)
   - Static analysis of image paths in source files
   - Ensures no broken path patterns

### Additional Tests

- **Header Component** - Navigation links work
- **Contact Page** - Form renders and can be filled

## Running Tests Before Deployment

**Always run tests before deploying to production!**

```bash
# From projects/javascript directory
cd projects/javascript
npm run test:ci
```

If all tests pass, you're good to deploy. If any fail, fix them before deploying.

## Adding New Tests

When adding new features:

1. Create a test file: `ComponentName.test.js` in the same directory or `__tests__/` subdirectory
2. Follow the existing test patterns
3. Test critical functionality:
   - Component renders
   - User interactions work
   - Image paths are correct (if applicable)
   - Routes work (if applicable)

## Test Commands

- `npm test` - Run tests in watch mode (interactive)
- `npm run test:ci` - Run tests once (for CI/pre-deploy)
- `npm run test:watch` - Run tests in watch mode (same as `npm test`)
- `npm run test:coverage` - Generate coverage report

## Troubleshooting

**Tests fail with "Cannot find module"**
- Make sure you're running from `projects/javascript/` directory
- Run `npm install` to ensure dependencies are installed

**Image path tests fail**
- Check that image paths use absolute paths starting with `/assets/`
- Verify no `process.env.PUBLIC_URL` issues (should use `|| ''` fallback)

**Routing tests fail**
- Ensure all routes are defined in `App.js`
- Check that components are properly exported

