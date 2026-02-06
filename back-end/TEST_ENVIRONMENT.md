# Test Environment Configuration

## Overview

This document describes the complete test environment configuration for the backend integration tests. The test suite uses a separate PostgreSQL database and isolated environment variables to ensure tests don't interfere with development or production data.

## Environment Variables

### Required Test Environment Variables

The following environment variables are automatically configured for tests in `tests/setup/jest.setup.ts`:

```bash
# Test Environment
NODE_ENV=test

# Test Server Configuration
REST_PORT=3001                    # Different port to avoid conflicts with dev server

# Test Database Configuration
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5435/postgres
DATABASE_CONNECTION_STRING=postgresql://test_user:test_password@localhost:5435/postgres

# Test Security Configuration
JWT_SECRET=test-jwt-secret-key-for-integration-tests
HASH_SALT=10

# Test Stripe Configuration (Mock)
STRIPE_SECRET_KEY=sk_test_fake_key_for_integration_tests
```

### Environment Variable Details

| Variable | Purpose | Test Value | Notes |
|----------|---------|------------|-------|
| `NODE_ENV` | Environment identifier | `test` | Ensures test-specific behavior |
| `REST_PORT` | Test server port | `3001` | Avoids conflicts with dev server (3000) |
| `TEST_DATABASE_URL` | Test database connection | `postgresql://test_user:test_password@localhost:5435/postgres` | Uses port 5435 to avoid conflicts |
| `JWT_SECRET` | JWT token signing | `test-jwt-secret-key-for-integration-tests` | Test-specific secret |
| `HASH_SALT` | Password hashing rounds | `10` | Lower value for faster tests |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_test_fake_key_for_integration_tests` | Mocked in tests |

## Database Configuration

### Test Database Setup

The test environment uses a completely separate PostgreSQL database:

- **Host**: `localhost`
- **Port**: `5435` (different from default 5432)
- **Database**: `test_db` (created dynamically)
- **User**: `test_user`
- **Password**: `test_password`

### Database Lifecycle

1. **Global Setup** (`tests/setup/global-setup.ts`):
   - Connects to PostgreSQL admin database
   - Drops existing `test_db` if it exists
   - Creates fresh `test_db` database
   - Runs all migrations to set up schema

2. **Test Execution**:
   - Each test file connects to `test_db`
   - Data is cleaned between tests using `TRUNCATE`
   - Schema remains intact throughout test run

3. **Global Teardown** (`tests/setup/global-teardown.ts`):
   - Closes all database connections
   - Drops the `test_db` database
   - Cleans up resources

### Docker Test Database

The test database runs in Docker using `docker-compose.test.yml`:

```yaml
services:
  postgres-test:
    image: postgres:16-alpine
    container_name: postgres-test
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: postgres
    ports:
      - "5435:5432"  # Maps to port 5435 on host
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user -d postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

## Test Configuration Files

### Jest Configuration (`jest.config.js`)

Key test-specific configurations:

```javascript
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
    globalSetup: '<rootDir>/tests/setup/global-setup.ts',
    globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
    testTimeout: 30000,           // 30 second timeout for integration tests
    maxWorkers: 1,                // Sequential execution for database tests
    forceExit: true,              // Force exit after tests complete
    clearMocks: true,             // Clear mocks between tests
    restoreMocks: true,           // Restore mocks after tests
    resetMocks: true              // Reset mocks between tests
};
```

### Test Setup File (`tests/setup/jest.setup.ts`)

Automatically configures environment variables before each test file:

- Sets `NODE_ENV=test`
- Configures test database connection
- Sets test-specific JWT secret
- Configures mock Stripe key
- Sets Jest timeout to 30 seconds

## Running Tests

### Prerequisites

1. **Docker & Docker Compose**: Required for test database
2. **Node.js & npm**: For running the test suite

### Test Commands

```bash
# Start test database
npm run test:db:up

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Stop test database
npm run test:db:down

# Full integration test (start DB → run tests → stop DB)
npm run test:integration

# View test database logs
npm run test:db:logs
```

### Test Execution Flow

1. **Start**: `npm run test:db:up` starts PostgreSQL container
2. **Setup**: Global setup creates `test_db` and runs migrations
3. **Tests**: Each test file runs with clean data
4. **Cleanup**: Global teardown drops `test_db`
5. **Stop**: `npm run test:db:down` stops PostgreSQL container

## Test Data Management

### Data Isolation Strategy

- **Database Level**: Separate `test_db` database
- **Test Level**: `TRUNCATE` all tables between tests
- **Process Level**: Sequential test execution (no parallelism)

### Test Data Utilities

```typescript
import { getTestDb, cleanTestData } from '../setup/test-db'

// Get test database connection
const db = getTestDb()

// Clean all test data (run in beforeEach)
await cleanTestData()
```

### Test Data Factory Pattern

Tests use a consistent pattern for creating test data:

```typescript
// Create test user through API
const userData = {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    password: 'testPassword123',
    age: 30
}
const user = await testClient.auth.signup.mutate(userData)

// Create test product directly in database
const productData = {
    name: 'Test Product',
    description: 'Test description',
    priceInCents: 2999,
    currency: 'USD',
    type: 'subscription',
    externalProductId: 'prod_test123',
    externalPriceId: 'price_test123',
    active: true
}
const product = await createTestProduct(productData)
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   - Test database uses port 5435
   - Test server uses port 3001
   - Change ports in `docker-compose.test.yml` if needed

2. **Database Connection Issues**:
   ```bash
   # Check if test database is running
   docker ps | grep postgres-test
   
   # View database logs
   npm run test:db:logs
   
   # Restart database
   npm run test:db:down && npm run test:db:up
   ```

3. **Test Timeouts**:
   - Default timeout is 30 seconds
   - Increase in `jest.config.js` if needed
   - Check for hanging database connections

4. **Migration Issues**:
   - Ensure migrations exist in `src/db/migrations/`
   - Check migration file extensions (`.ts`)
   - Verify migration directory path in config

### Environment Validation

To verify test environment is correctly configured:

```bash
# Run the test database integration test
npm test -- tests/setup/test-database.test.ts

# Check environment variables in test
, payment methodsconsole.log('NODE_ENV:', process.env.NODE_ENV)
console.log('TEST_DATABASE_URL:', process.env.TEST_DATABASE_URL)
console.log('JWT_SECRET:', process.env.JWT_SECRET)
```

## Security Considerations

### Test Environment Isolation

- **Separate Database**: Test database is completely isolated
- **Test Secrets**: All secrets are test-specific and non-production
- **Mock Services**: External services (Stripe) are mocked
- **No Production Data**: Tests never touch production systems

### Test Data Security

- **Synthetic Data**: All test data is artificially generated
- **No PII**: No real personal information in tests
- **Cleanup**: All test data is automatically cleaned up
- **Isolation**: Tests cannot access each other's data

## Performance Optimization

### Test Execution Speed

- **Sequential Execution**: `maxWorkers: 1` prevents database conflicts
- **Schema Reuse**: Database schema created once, data cleaned between tests
- **Connection Pooling**: Single database connection per test file
- **Fast Cleanup**: `TRUNCATE` is faster than `DELETE`

### Resource Management

- **Memory**: Tests automatically clean up connections
- **CPU**: Sequential execution reduces CPU contention
- **Disk**: Docker volumes persist between test runs for speed
- **Network**: Local database eliminates network latency

## Monitoring and Debugging

### Test Execution Monitoring

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/integration/auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should successfully"

# Generate coverage report
npm run test:coverage
```

### Debug Configuration

For debugging tests in VS Code, add to `.vscode/launch.json`:

```json
{
    "type": "node",
    "request": "launch",
    "name": "Debug Jest Tests",
    "program": "${workspaceFolder}/node_modules/.bin/jest",
    "args": ["--runInBand", "--no-cache"],
    "console": "integratedTerminal",
    "internalConsoleOptions": "neverOpen",
    "env": {
        "NODE_ENV": "test"
    }
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: postgres
        ports:
          - 5435:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run integration tests
        run: npm test
        env:
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5435/postgres
```

This configuration ensures the test environment is properly set up in CI/CD pipelines with the same database configuration as local development.
