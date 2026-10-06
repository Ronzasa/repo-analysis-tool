# Testing Guide

This document provides comprehensive information about the testing setup for the Repository Analysis Tool.

## Testing Frameworks

### Backend (Node.js)
- **Framework**: Jest
- **HTTP Testing**: Supertest
- **TypeScript Support**: ts-jest
- **Configuration**: `backend/jest.config.js`

### Git Service (Python)
- **Framework**: pytest
- **Async Support**: pytest-asyncio
- **Coverage**: pytest-cov
- **Configuration**: `git-service/pytest.ini`

### Frontend (React)
- **Framework**: Vitest
- **DOM Environment**: jsdom
- **Component Testing**: React Testing Library
- **Configuration**: `frontend/vitest.config.ts`

## Running Tests

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Git Service Tests
```bash
cd git-service

# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_metrics.py

# Run with verbose output
pytest -v
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Backend Tests
```
backend/tests/
├── helpers/
│   ├── database.ts      # Test database setup
│   ├── app.ts           # Test app builder
│   └── index.ts         # Test utilities
├── database.test.ts     # Database tests
├── routes/              # API route tests (to be added)
└── services/            # Service tests (to be added)
```

### Git Service Tests
```
git-service/tests/
├── fixtures/
│   └── git_fixtures.py  # Git repository fixtures
├── conftest.py          # pytest configuration
├── test_metrics.py      # Metric calculation tests
└── test_git_ops.py      # Git operation tests (to be added)
```

### Frontend Tests
```
frontend/src/__tests__/
├── setup.ts             # Test setup
├── App.test.tsx         # App component tests
├── pages/               # Page component tests (to be added)
└── components/          # Component tests (to be added)
```

## Test Database

The backend tests use a separate SQLite database (`test_rat.db`) that is:
- Created fresh before each test suite
- Cleared between tests
- Deleted after tests complete

This ensures tests don't interfere with development data.

## Test Fixtures

### Backend
- `setup()` / `teardown()` - Database lifecycle
- `clearData()` - Clear all tables
- `getTestDb()` - Get test database instance

### Git Service
- `temp_dir` - Temporary directory (auto-cleaned)
- `test_repo_path` - Test repository path
- `sample_git_repo` - Pre-initialized git repo with commits

### Frontend
- `render()` - Render React components
- `screen` - Query rendered elements
- `fireEvent` - Simulate user interactions

## Writing Tests

### Backend Test Example
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'jest';
import { setup, teardown } from './helpers';

describe('MyFeature', () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  it('should do something', () => {
    // Test code
  });
});
```

### Git Service Test Example
```python
import pytest

def test_my_feature(sample_git_repo):
    """Test description"""
    assert sample_git_repo.exists()
    # Test code
```

### Frontend Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Coverage Reports

### Backend
Coverage reports are generated in `backend/coverage/`

### Git Service
```bash
pytest --cov=app --cov-report=html
# Open htmlcov/index.html
```

### Frontend
Coverage reports are generated in `frontend/coverage/`

## Continuous Integration

Tests should be run automatically on:
- Push to main branch
- Pull request creation
- Before deployment

Example GitHub Actions workflow:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run backend tests
        run: |
          cd backend
          npm install
          npm test
      - name: Run git service tests
        run: |
          cd git-service
          pip install -r requirements-test.txt
          pytest
      - name: Run frontend tests
        run: |
          cd frontend
          npm install
          npm test
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Test Data**: Use fixtures, not real data
3. **Assertions**: Test behavior, not implementation
4. **Naming**: Use descriptive test names
5. **Coverage**: Aim for 80%+ coverage
6. **Speed**: Keep tests fast (< 1s per test)
7. **Cleanup**: Always clean up resources

## Troubleshooting

### Backend: better-sqlite3 build errors
```bash
# Install build tools
sudo apt-get install build-essential python3

# Or use Docker
docker-compose run backend npm test
```

### Git Service: pygit2 build errors
```bash
# Install libgit2
sudo apt-get install libgit2-dev

# Or use Docker
docker-compose run git-service pytest
```

### Frontend: jsdom errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Test Commands Summary

```bash
# Run all tests across all services
cd backend && npm test
cd ../git-service && pytest
cd ../frontend && npm test

# Or use the convenience script (to be created)
./run-tests.sh
```
