# Testing Guide

This document explains how to run and write tests for the Coupon Dispenser application.

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/lib/auth/permissions.test.ts
```

## Test Structure

Tests are organized by feature:

```
__tests__/
├── lib/
│   ├── auth/
│   │   └── permissions.test.ts
│   ├── validators/
│   │   ├── vendor.test.ts
│   │   ├── coupon.test.ts
│   │   └── user.test.ts
│   └── utils/
│       ├── format.test.ts
│       └── csv.test.ts
├── components/
│   └── dashboard/
│       └── StatsCard.test.tsx
└── api/
    ├── vendors.test.ts
    ├── coupons.test.ts
    └── analytics.test.ts
```

## Test Coverage Goals

We aim for at least 90% coverage across:
- Branches
- Functions
- Lines
- Statements

Current coverage:
```bash
npm run test:coverage
```

## Writing Tests

### Unit Tests

Example for utility functions:

```typescript
import { formatDate } from '@/lib/utils/format'

describe('formatDate', () => {
  it('should format a date string', () => {
    const date = '2024-01-15T10:30:00Z'
    const formatted = formatDate(date)
    expect(formatted).toMatch(/Jan 15, 2024/)
  })
})
```

### Component Tests

Example for React components:

```typescript
import { render, screen } from '@testing-library/react'
import StatsCard from '@/components/dashboard/StatsCard'
import { Store } from 'lucide-react'

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(<StatsCard title="Total Vendors" value={10} icon={Store} />)
    
    expect(screen.getByText('Total Vendors')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
```

### API Tests

Example for API routes (requires mocking):

```typescript
import { POST } from '@/app/api/vendors/route'

describe('POST /api/vendors', () => {
  it('should create vendor for super_admin', async () => {
    // Mock session
    const mockSession = {
      user: { id: '1', role: 'super_admin' }
    }
    
    // Mock request
    const request = new Request('http://localhost:3000/api/vendors', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Vendor' })
    })
    
    // Call handler
    const response = await POST(request)
    const data = await response.json()
    
    expect(data.success).toBe(true)
  })
})
```

## Mocking

### Supabase

Mock Supabase client:

```typescript
jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  },
}))
```

### NextAuth

Mock session:

```typescript
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '1', email: 'test@example.com', role: 'super_admin' }
  })
}))
```

## Test Database

For integration tests, use a separate test database:

1. Create a test Supabase project
2. Run schema on test database
3. Set test environment variables:

```bash
# .env.test
NEXT_PUBLIC_SUPABASE_URL=test_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_key
SUPABASE_SERVICE_ROLE_KEY=test_service_key
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Before deployment

GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Best Practices

1. **One Test Per Behavior**: Each test should verify one specific behavior
2. **Descriptive Names**: Use clear, descriptive test names
3. **Arrange-Act-Assert**: Structure tests in three parts
4. **Avoid Test Interdependence**: Tests should be independent
5. **Mock External Dependencies**: Don't rely on external services
6. **Test Edge Cases**: Include error scenarios
7. **Keep Tests Fast**: Unit tests should run in milliseconds

## Common Issues

### Tests Timing Out

Increase timeout for slow tests:
```typescript
it('slow test', async () => {
  // test code
}, 10000) // 10 second timeout
```

### Module Resolution Errors

Check `jest.config.js` has correct path mappings:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Environment Variables

Ensure `jest.setup.js` sets required variables:
```javascript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Next.js](https://nextjs.org/docs/testing)

