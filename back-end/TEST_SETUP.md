# Test Setup

## Quick Start

1. **Start test database:**
   ```bash
   npm run test:db:up
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Stop test database:**
   ```bash
   npm run test:db:down
   ```

## One-liner for full test run:
```bash
npm run test:integration
```

## How it works

- **Global Setup**: Creates a single `test_db` database before all tests
- **Global Teardown**: Drops the database after all tests complete
- **Between Tests**: Data is cleaned (TRUNCATE) but schema remains
- **No unique database names**: Single database, sequential test execution

## Using in your tests

```typescript
import { getTestDb, cleanTestData } from '../setup/test-db'

describe('My Integration Test', () => {
    beforeEach(async () => {
        // Clean data before each test
        await cleanTestData()
    })

    it('should work with database', async () => {
        const db = getTestDb()
        
        // Your test code here
        await db('users').insert({ ... })
        const users = await db('users').select('*')
        
        expect(users).toHaveLength(1)
    })
})
```

## Requirements

- Docker and Docker Compose installed
- That's it! 🎉

## Troubleshooting

- **Port conflict?** Change port in `docker-compose.test.yml`
- **Check database logs:** `npm run test:db:logs`
- **Reset everything:** `npm run test:db:down && npm run test:db:up`