---
title: Backend Testing Complete Guide
description: Master backend testing strategies for code quality
track: backend
section: testing
difficulty: intermediate
tags:
  - Testing
  - Unit Testing
  - Integration Testing
  - TDD
status: imported
origin: old/src/content/docs/backend/testing.en.md
divergence: 0.277
issues: []
legacy:
  category: Backend
  subcategory: Testing
  order: 27
  lastUpdated: 2026-01-07
---

Backend testing is a critical practice for ensuring code quality, reliability, and maintainability in server-side applications. This comprehensive guide covers essential testing strategies, frameworks, and best practices that every backend developer should master.

## Testing Fundamentals

### Why Testing Matters

Testing provides several key benefits for backend development:

- **Early Bug Detection**: Catch issues before they reach production
- **Documentation**: Tests serve as living documentation of expected behavior
- **Refactoring Confidence**: Make changes without fear of breaking existing functionality
- **Design Improvement**: Writing testable code naturally leads to better architecture
- **Reduced Debugging Time**: Quickly identify the source of problems

### The Testing Pyramid

The testing pyramid is a strategic model that guides how to balance different types of tests:

```
           /\
          /  \
         / E2E \           <- Few, validate critical paths
        /--------\
       / Integration \      <- Moderate, verify module collaboration
      /----------------\
     /   Unit Tests     \   <- Many, verify individual units
    /--------------------\
```

**Key Principles:**

1. **Unit tests form the base**: They should comprise the majority of your test suite
2. **Integration tests in the middle**: Verify that modules work together correctly
3. **E2E tests at the top**: Cover critical business workflows end-to-end
4. **Cost increases upward**: Higher-level tests are more expensive to write and maintain
5. **Speed decreases upward**: Unit tests run fastest, E2E tests run slowest

### Testing Strategy by Layer

```javascript
// Testing strategy for a typical backend application
const testingStrategy = {
  unit: {
    coverage: '70-80%',
    tools: ['Jest', 'Mocha', 'pytest', 'Go testing'],
    focus: ['Pure functions', 'Business logic', 'Utility classes', 'Data transformations']
  },
  integration: {
    coverage: '50-60%',
    tools: ['Supertest', 'pytest', 'testcontainers'],
    focus: ['API endpoints', 'Database operations', 'External service integration']
  },
  e2e: {
    coverage: 'Critical paths 100%',
    tools: ['Postman/Newman', 'k6', 'Artillery'],
    focus: ['User registration flow', 'Authentication', 'Core business processes']
  }
};
```

## Unit Testing

### Setting Up Jest for Node.js

Jest is a popular testing framework for JavaScript and TypeScript backends:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### Testing Pure Functions

Pure functions are the easiest to test because they have no side effects:

```typescript
// utils/validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  return { valid: errors.length === 0, errors };
}

export function hashUserId(userId: string, salt: string): string {
  return Buffer.from(`${userId}:${salt}`).toString('base64');
}

// utils/validation.test.ts
import { validateEmail, validatePassword, hashUserId } from './validation';

describe('validateEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.org')).toBe(true);
    expect(validateEmail('user+tag@example.co.uk')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user @domain.com')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should validate a strong password', () => {
    const result = validatePassword('SecurePass123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject passwords that are too short', () => {
    const result = validatePassword('Short1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject passwords without uppercase letters', () => {
    const result = validatePassword('lowercase123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain an uppercase letter');
  });

  it('should reject passwords without lowercase letters', () => {
    const result = validatePassword('UPPERCASE123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a lowercase letter');
  });

  it('should reject passwords without numbers', () => {
    const result = validatePassword('NoNumbers');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a number');
  });

  it('should return multiple errors for weak passwords', () => {
    const result = validatePassword('weak');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('hashUserId', () => {
  it('should produce consistent hashes for same inputs', () => {
    const hash1 = hashUserId('user123', 'salt456');
    const hash2 = hashUserId('user123', 'salt456');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = hashUserId('user123', 'salt456');
    const hash2 = hashUserId('user456', 'salt456');
    expect(hash1).not.toBe(hash2);
  });
});
```

### Testing Async Functions

Backend code often involves asynchronous operations:

```typescript
// services/userService.ts
import { User, UserRepository } from './types';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findById(id: string): Promise<User | null> {
    if (!id || id.trim() === '') {
      throw new Error('User ID is required');
    }
    return this.userRepository.findById(id);
  }

  async createUser(data: { email: string; name: string }): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    return this.userRepository.create({
      ...data,
      createdAt: new Date()
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return this.userRepository.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }
}

// services/userService.test.ts
import { UserService } from './userService';
import { UserRepository, User } from './types';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    userService = new UserService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date()
      };
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.findById('123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for empty ID', async () => {
      await expect(userService.findById('')).rejects.toThrow('User ID is required');
      await expect(userService.findById('  ')).rejects.toThrow('User ID is required');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = { email: 'new@example.com', name: 'New User' };
      const createdUser: User = {
        id: '456',
        ...userData,
        createdAt: expect.any(Date)
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        createdAt: expect.any(Date)
      });
    });

    it('should throw error if email already exists', async () => {
      const existingUser: User = {
        id: '123',
        email: 'existing@example.com',
        name: 'Existing User',
        createdAt: new Date()
      };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        userService.createUser({ email: 'existing@example.com', name: 'New User' })
      ).rejects.toThrow('Email already registered');

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date()
      };
      const updatedUser: User = {
        ...existingUser,
        name: 'Updated Name',
        updatedAt: expect.any(Date)
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(mockUserRepository.update).toHaveBeenCalledWith('123', {
        name: 'Updated Name',
        updatedAt: expect.any(Date)
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        userService.updateUser('nonexistent', { name: 'New Name' })
      ).rejects.toThrow('User not found');
    });
  });
});
```

### Testing Error Handling

Proper error handling tests ensure your application fails gracefully:

```typescript
// services/paymentService.ts
export class PaymentService {
  constructor(
    private paymentGateway: PaymentGateway,
    private logger: Logger
  ) {}

  async processPayment(orderId: string, amount: number): Promise<PaymentResult> {
    if (amount <= 0) {
      throw new ValidationError('Amount must be positive');
    }

    try {
      const result = await this.paymentGateway.charge(orderId, amount);
      this.logger.info('Payment processed: ' + orderId);
      return result;
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        this.logger.warn('Insufficient funds for order: ' + orderId);
        throw new PaymentFailedError('Insufficient funds', 'INSUFFICIENT_FUNDS');
      }
      if (error instanceof NetworkError) {
        this.logger.error('Payment gateway unreachable: ' + error.message);
        throw new PaymentFailedError('Payment service unavailable', 'SERVICE_UNAVAILABLE');
      }
      this.logger.error('Unexpected payment error: ' + error);
      throw new PaymentFailedError('Payment processing failed', 'UNKNOWN_ERROR');
    }
  }
}

// services/paymentService.test.ts
describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPaymentGateway: jest.Mocked<PaymentGateway>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockPaymentGateway = {
      charge: jest.fn()
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    paymentService = new PaymentService(mockPaymentGateway, mockLogger);
  });

  describe('error handling', () => {
    it('should throw ValidationError for non-positive amounts', async () => {
      await expect(paymentService.processPayment('order1', 0))
        .rejects.toThrow(ValidationError);
      await expect(paymentService.processPayment('order1', -100))
        .rejects.toThrow('Amount must be positive');
    });

    it('should handle insufficient funds error', async () => {
      mockPaymentGateway.charge.mockRejectedValue(new InsufficientFundsError());

      await expect(paymentService.processPayment('order1', 100))
        .rejects.toMatchObject({
          message: 'Insufficient funds',
          code: 'INSUFFICIENT_FUNDS'
        });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient funds')
      );
    });

    it('should handle network errors', async () => {
      mockPaymentGateway.charge.mockRejectedValue(new NetworkError('Connection timeout'));

      await expect(paymentService.processPayment('order1', 100))
        .rejects.toMatchObject({
          message: 'Payment service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        });

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      mockPaymentGateway.charge.mockRejectedValue(new Error('Unknown error'));

      await expect(paymentService.processPayment('order1', 100))
        .rejects.toMatchObject({
          code: 'UNKNOWN_ERROR'
        });
    });
  });
});
```

## Integration Testing

Integration tests verify that different parts of your system work together correctly.

### API Integration Testing with Supertest

```typescript
// app.ts
import express from 'express';
import { userRouter } from './routes/user';
import { errorHandler } from './middleware/errorHandler';

export const app = express();
app.use(express.json());
app.use('/api/users', userRouter);
app.use(errorHandler);

// routes/user.ts
import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const controller = new UserController();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export { router as userRouter };

// __tests__/integration/user.test.ts
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

describe('User API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.user.deleteMany();
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all users', async () => {
      // Seed test data
      await prisma.user.createMany({
        data: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' }
        ]
      });

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('email', 'user1@example.com');
    });

    it('should support pagination', async () => {
      // Create 15 users
      const users = Array.from({ length: 15 }, (_, i) => ({
        email: 'user' + i + '@example.com',
        name: 'User ' + i
      }));
      await prisma.user.createMany({ data: users });

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: 'Test User' }
      });

      const response = await request(app)
        .get('/api/users/' + user.id)
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'SecurePass123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        email: userData.email,
        name: userData.name
      });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('id');

      // Verify user was actually created in database
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(dbUser).not.toBeNull();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'invalid-email', name: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should return 409 for duplicate email', async () => {
      await prisma.user.create({
        data: { email: 'existing@example.com', name: 'Existing' }
      });

      const response = await request(app)
        .post('/api/users')
        .send({ email: 'existing@example.com', name: 'New User' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already registered');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: 'Original Name' }
      });

      const response = await request(app)
        .put('/api/users/' + user.id)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .put('/api/users/nonexistent-id')
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const user = await prisma.user.create({
        data: { email: 'delete@example.com', name: 'To Delete' }
      });

      await request(app)
        .delete('/api/users/' + user.id)
        .expect(204);

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(deletedUser).toBeNull();
    });
  });
});
```

### Database Integration Testing with Testcontainers

Testcontainers allows you to run real databases in Docker containers for testing:

```typescript
// __tests__/integration/database.test.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';

describe('Database Integration Tests', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer()
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    // Set database URL for Prisma
    const databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    // Run migrations using your preferred method
    // For example: await runMigrations(databaseUrl);

    // Initialize Prisma client
    prisma = new PrismaClient();
    await prisma.$connect();
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    // Clean all tables before each test
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('User-Order relationship', () => {
    it('should create user with orders', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'customer@example.com',
          name: 'Customer',
          orders: {
            create: [
              { total: 100, status: 'PENDING' },
              { total: 200, status: 'COMPLETED' }
            ]
          }
        },
        include: { orders: true }
      });

      expect(user.orders).toHaveLength(2);
      expect(user.orders[0]).toHaveProperty('userId', user.id);
    });

    it('should cascade delete orders when user is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'customer@example.com',
          name: 'Customer',
          orders: {
            create: { total: 100, status: 'PENDING' }
          }
        },
        include: { orders: true }
      });

      await prisma.user.delete({ where: { id: user.id } });

      const orders = await prisma.order.findMany({
        where: { userId: user.id }
      });
      expect(orders).toHaveLength(0);
    });
  });

  describe('Transaction handling', () => {
    it('should rollback on error', async () => {
      const initialCount = await prisma.user.count();

      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: { email: 'user1@example.com', name: 'User 1' }
          });
          // This should fail due to duplicate email
          await tx.user.create({
            data: { email: 'user1@example.com', name: 'User 2' }
          });
        });
      } catch (error) {
        // Expected to fail
      }

      const finalCount = await prisma.user.count();
      expect(finalCount).toBe(initialCount);
    });

    it('should commit all changes on success', async () => {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: { email: 'user1@example.com', name: 'User 1' }
        });
        await tx.user.create({
          data: { email: 'user2@example.com', name: 'User 2' }
        });
      });

      const users = await prisma.user.findMany();
      expect(users).toHaveLength(2);
    });
  });
});
```

## Mocking Strategies

### Understanding Test Doubles

Test doubles replace real dependencies during testing:

```typescript
// types.ts
export interface EmailService {
  send(to: string, subject: string, body: string): Promise<boolean>;
}

export interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// Different types of test doubles

// 1. Dummy - placeholder that is never used
const dummyLogger: Logger = {
  info: () => {},
  error: () => {}
};

// 2. Stub - returns predefined values
const stubEmailService: EmailService = {
  send: async () => true
};

// 3. Spy - records information about calls
function createSpyLogger(): Logger & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    info: (message: string) => calls.push('INFO: ' + message),
    error: (message: string) => calls.push('ERROR: ' + message)
  };
}

// 4. Mock - has expectations about how it should be called
const mockEmailService = {
  send: jest.fn().mockResolvedValue(true)
};

// 5. Fake - simplified working implementation
class FakeCacheService implements CacheService {
  private store = new Map<string, { value: any; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl * 1000 : 0
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
```

### Mocking External Services

```typescript
// services/orderService.ts
export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private paymentService: PaymentService,
    private emailService: EmailService,
    private inventoryService: InventoryService
  ) {}

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    // Check inventory
    for (const item of items) {
      const available = await this.inventoryService.checkStock(item.productId);
      if (available < item.quantity) {
        throw new InsufficientStockError(item.productId);
      }
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const order = await this.orderRepository.create({
      userId,
      items,
      total,
      status: 'PENDING'
    });

    // Process payment
    try {
      await this.paymentService.charge(userId, total);
      order.status = 'PAID';
      await this.orderRepository.update(order.id, { status: 'PAID' });
    } catch (error) {
      order.status = 'PAYMENT_FAILED';
      await this.orderRepository.update(order.id, { status: 'PAYMENT_FAILED' });
      throw error;
    }

    // Reserve inventory
    for (const item of items) {
      await this.inventoryService.reserve(item.productId, item.quantity);
    }

    // Send confirmation email
    await this.emailService.send(
      userId,
      'Order Confirmation',
      'Your order ' + order.id + ' has been confirmed.'
    );

    return order;
  }
}

// services/orderService.test.ts
describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockInventoryService: jest.Mocked<InventoryService>;

  beforeEach(() => {
    mockOrderRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn()
    };
    mockPaymentService = {
      charge: jest.fn()
    };
    mockEmailService = {
      send: jest.fn()
    };
    mockInventoryService = {
      checkStock: jest.fn(),
      reserve: jest.fn()
    };

    orderService = new OrderService(
      mockOrderRepository,
      mockPaymentService,
      mockEmailService,
      mockInventoryService
    );
  });

  describe('createOrder', () => {
    const userId = 'user123';
    const items: OrderItem[] = [
      { productId: 'prod1', quantity: 2, price: 50 },
      { productId: 'prod2', quantity: 1, price: 100 }
    ];

    beforeEach(() => {
      // Default successful scenario
      mockInventoryService.checkStock.mockResolvedValue(100);
      mockOrderRepository.create.mockResolvedValue({
        id: 'order123',
        userId,
        items,
        total: 200,
        status: 'PENDING'
      });
      mockOrderRepository.update.mockResolvedValue({
        id: 'order123',
        userId,
        items,
        total: 200,
        status: 'PAID'
      });
      mockPaymentService.charge.mockResolvedValue({ success: true });
      mockEmailService.send.mockResolvedValue(true);
      mockInventoryService.reserve.mockResolvedValue(undefined);
    });

    it('should create order successfully', async () => {
      const order = await orderService.createOrder(userId, items);

      expect(order.id).toBe('order123');
      expect(order.status).toBe('PAID');
      expect(mockPaymentService.charge).toHaveBeenCalledWith(userId, 200);
      expect(mockEmailService.send).toHaveBeenCalled();
    });

    it('should check inventory for all items', async () => {
      await orderService.createOrder(userId, items);

      expect(mockInventoryService.checkStock).toHaveBeenCalledTimes(2);
      expect(mockInventoryService.checkStock).toHaveBeenCalledWith('prod1');
      expect(mockInventoryService.checkStock).toHaveBeenCalledWith('prod2');
    });

    it('should throw error when stock is insufficient', async () => {
      mockInventoryService.checkStock
        .mockResolvedValueOnce(100) // prod1 OK
        .mockResolvedValueOnce(0);  // prod2 insufficient

      await expect(orderService.createOrder(userId, items))
        .rejects.toThrow(InsufficientStockError);

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should handle payment failure', async () => {
      mockPaymentService.charge.mockRejectedValue(new PaymentFailedError());

      await expect(orderService.createOrder(userId, items))
        .rejects.toThrow(PaymentFailedError);

      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        'order123',
        { status: 'PAYMENT_FAILED' }
      );
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('should reserve inventory after successful payment', async () => {
      await orderService.createOrder(userId, items);

      expect(mockInventoryService.reserve).toHaveBeenCalledWith('prod1', 2);
      expect(mockInventoryService.reserve).toHaveBeenCalledWith('prod2', 1);
    });
  });
});
```

### Mocking Time and Timers

```typescript
// services/tokenService.ts
export class TokenService {
  private readonly TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

  generateToken(userId: string): Token {
    return {
      value: 'token_' + userId + '_' + Date.now(),
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY)
    };
  }

  isExpired(token: Token): boolean {
    return new Date() > token.expiresAt;
  }
}

// services/tokenService.test.ts
describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateToken', () => {
    it('should create token with correct expiry', () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const token = tokenService.generateToken('user123');

      expect(token.expiresAt).toEqual(new Date('2024-01-15T11:00:00Z'));
    });
  });

  describe('isExpired', () => {
    it('should return false for valid token', () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const token = tokenService.generateToken('user123');

      // Advance 30 minutes
      jest.advanceTimersByTime(30 * 60 * 1000);

      expect(tokenService.isExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const token = tokenService.generateToken('user123');

      // Advance 2 hours
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);

      expect(tokenService.isExpired(token)).toBe(true);
    });
  });
});
```

## Test Coverage

### Configuring Coverage Collection

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.spec.{ts,js}',
    '!src/test/**',
    '!src/types/**',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    }
  }
};
```

### Understanding Coverage Metrics

```
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------|---------|----------|---------|---------|-------------------
All files              |   85.45 |    72.30 |   88.50 |   85.45 |
 controllers/          |   80.00 |    65.00 |   85.00 |   80.00 |
  userController.ts    |   82.35 |    70.00 |   90.00 |   82.35 | 45-52,78-80
  orderController.ts   |   77.78 |    60.00 |   80.00 |   77.78 | 34-40,92-98
 services/             |   92.00 |    85.00 |   95.00 |   92.00 |
  userService.ts       |   100.0 |   100.00 |   100.0 |   100.0 |
  orderService.ts      |   88.24 |    75.00 |   90.00 |   88.24 | 67-72
  paymentService.ts    |   87.50 |    80.00 |   95.00 |   87.50 | 123-128
 utils/                |   78.00 |    60.00 |   80.00 |   78.00 |
  validation.ts        |   90.00 |    75.00 |   100.0 |   90.00 | 45-48
  formatting.ts        |   66.67 |    45.00 |   60.00 |   66.67 | 12-24,38-50
-----------------------|---------|----------|---------|---------|-------------------
```

**Coverage Types Explained:**

- **Statements**: Percentage of statements executed
- **Branches**: Percentage of conditional branches covered (if/else, switch, ternary)
- **Functions**: Percentage of functions called
- **Lines**: Percentage of code lines executed

### Writing Tests for Better Coverage

```typescript
// Focus on branch coverage
function calculateDiscount(
  total: number,
  customerType: 'regular' | 'premium' | 'vip',
  hasCoupon: boolean
): number {
  let discount = 0;

  // Branch 1: Customer type
  if (customerType === 'vip') {
    discount = 20;
  } else if (customerType === 'premium') {
    discount = 10;
  } else {
    discount = 0;
  }

  // Branch 2: Coupon
  if (hasCoupon) {
    discount += 5;
  }

  // Branch 3: Large order bonus
  if (total > 1000) {
    discount += 5;
  }

  return Math.min(discount, 30); // Cap at 30%
}

// Tests for complete branch coverage
describe('calculateDiscount', () => {
  // Customer type branches
  it('should give 20% discount for VIP customers', () => {
    expect(calculateDiscount(100, 'vip', false)).toBe(20);
  });

  it('should give 10% discount for premium customers', () => {
    expect(calculateDiscount(100, 'premium', false)).toBe(10);
  });

  it('should give 0% discount for regular customers', () => {
    expect(calculateDiscount(100, 'regular', false)).toBe(0);
  });

  // Coupon branch
  it('should add 5% for coupon', () => {
    expect(calculateDiscount(100, 'regular', true)).toBe(5);
  });

  it('should not add extra without coupon', () => {
    expect(calculateDiscount(100, 'regular', false)).toBe(0);
  });

  // Large order branch
  it('should add 5% for orders over 1000', () => {
    expect(calculateDiscount(1001, 'regular', false)).toBe(5);
  });

  it('should not add bonus for orders under 1000', () => {
    expect(calculateDiscount(999, 'regular', false)).toBe(0);
  });

  // Discount cap
  it('should cap discount at 30%', () => {
    expect(calculateDiscount(2000, 'vip', true)).toBe(30); // 20 + 5 + 5 = 30
  });

  // Edge cases
  it('should handle exactly 1000', () => {
    expect(calculateDiscount(1000, 'regular', false)).toBe(0);
  });

  it('should handle zero total', () => {
    expect(calculateDiscount(0, 'vip', true)).toBe(25);
  });
});
```

## Test-Driven Development (TDD)

### The TDD Cycle

TDD follows a Red-Green-Refactor cycle:

```
      +---------------------+
      |                     |
      |   1. RED            |
      |   Write failing     |
      |   test              |
      |                     |
      +----------+----------+
                 |
                 v
      +---------------------+
      |                     |
      |   2. GREEN          |
      |   Write minimum     |
      |   code to pass      |
      |                     |
      +----------+----------+
                 |
                 v
      +---------------------+
      |                     |
      |   3. REFACTOR       |
      |   Improve code      |
      |   quality           |
      |                     |
      +----------+----------+
                 |
                 +---------------+
                                 |
                                 v
                          (Repeat)
```

### TDD in Practice

Let's build a shopping cart using TDD:

```typescript
// Step 1: RED - Write failing test
// cart.test.ts
describe('ShoppingCart', () => {
  it('should start with empty cart', () => {
    const cart = new ShoppingCart();
    expect(cart.items).toEqual([]);
    expect(cart.total).toBe(0);
  });
});

// Step 2: GREEN - Write minimum code to pass
// cart.ts
export class ShoppingCart {
  items: CartItem[] = [];
  total: number = 0;
}

// Step 3: RED - Add next test
describe('ShoppingCart', () => {
  // ... previous test

  it('should add item to cart', () => {
    const cart = new ShoppingCart();
    cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].name).toBe('Widget');
  });
});

// Step 4: GREEN - Implement addItem
export class ShoppingCart {
  items: CartItem[] = [];

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addItem(item: CartItem): void {
    this.items.push(item);
  }
}

// Step 5: RED - Add test for updating quantity
describe('ShoppingCart', () => {
  // ... previous tests

  it('should update quantity when adding same product', () => {
    const cart = new ShoppingCart();
    cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });
    cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 2 });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
  });
});

// Step 6: GREEN - Update addItem
export class ShoppingCart {
  items: CartItem[] = [];

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addItem(item: CartItem): void {
    const existing = this.items.find(i => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
  }
}

// Continue TDD cycle for more features...

// Complete test suite after TDD
describe('ShoppingCart', () => {
  let cart: ShoppingCart;

  beforeEach(() => {
    cart = new ShoppingCart();
  });

  describe('initialization', () => {
    it('should start with empty cart', () => {
      expect(cart.items).toEqual([]);
      expect(cart.total).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add item to cart', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toMatchObject({
        productId: 'p1',
        name: 'Widget',
        price: 25,
        quantity: 1
      });
    });

    it('should update quantity when adding same product', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 2 });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
    });

    it('should calculate correct total', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 2 });
      cart.addItem({ productId: 'p2', name: 'Gadget', price: 50, quantity: 1 });

      expect(cart.total).toBe(100); // 25*2 + 50*1
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });
      cart.removeItem('p1');

      expect(cart.items).toHaveLength(0);
    });

    it('should do nothing when removing non-existent item', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });
      cart.removeItem('p2');

      expect(cart.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });
      cart.updateQuantity('p1', 5);

      expect(cart.items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });
      cart.updateQuantity('p1', 0);

      expect(cart.items).toHaveLength(0);
    });

    it('should throw error for negative quantity', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });

      expect(() => cart.updateQuantity('p1', -1)).toThrow('Quantity cannot be negative');
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      cart.addItem({ productId: 'p1', name: 'Widget', price: 25, quantity: 1 });
      cart.addItem({ productId: 'p2', name: 'Gadget', price: 50, quantity: 2 });
      cart.clear();

      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });
  });
});
```

### Benefits of TDD

```typescript
// TDD naturally leads to:

// 1. Better Design - Code is naturally modular and testable
class OrderProcessor {
  constructor(
    private paymentGateway: PaymentGateway,  // Injected dependency
    private inventoryService: InventoryService,
    private notificationService: NotificationService
  ) {}

  // Single responsibility - easy to test
  async process(order: Order): Promise<ProcessedOrder> {
    await this.validateOrder(order);
    await this.reserveInventory(order);
    await this.processPayment(order);
    await this.sendConfirmation(order);
    return { ...order, status: 'PROCESSED' };
  }
}

// 2. Complete Test Coverage - Tests written before code
// Every feature has tests from the start

// 3. Living Documentation - Tests describe expected behavior
describe('OrderProcessor', () => {
  it('should reject orders with empty items', () => {});
  it('should check inventory before processing', () => {});
  it('should rollback inventory if payment fails', () => {});
  it('should send confirmation email on success', () => {});
});

// 4. Confidence in Refactoring
// Tests ensure behavior is preserved during changes
```

## CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/
          retention-days: 7
```

### Pre-commit Hooks

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between unit tests and integration tests?**

```
Unit Tests:
- Test smallest units of code (functions, methods)
- Isolate code under test, mock all dependencies
- Fast execution, large quantity
- Precise error localization

Integration Tests:
- Test collaboration between multiple modules
- May include real dependencies (database, APIs)
- Slower execution
- Verify interfaces and data flow between components
```

**Q2: What are test doubles and when do you use each type?**

```typescript
// Dummy - Never actually used, just fills parameter requirements
const dummyLogger = {} as Logger;
userService.setLogger(dummyLogger); // Logger never called in this test

// Stub - Provides predetermined responses
const stubRepo = { findById: () => ({ id: '1', name: 'User' }) };

// Spy - Records call information while maintaining real behavior
const spy = jest.spyOn(emailService, 'send');
// Later: expect(spy).toHaveBeenCalledWith(...)

// Mock - Has programmed expectations and responses
const mockPayment = jest.fn().mockResolvedValue({ success: true });

// Fake - Simplified but working implementation
class FakeDatabase {
  private data = new Map();
  async save(item) { this.data.set(item.id, item); }
  async find(id) { return this.data.get(id); }
}
```

**Q3: How do you handle testing asynchronous code?**

```typescript
// Using async/await
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// Testing Promise rejection
it('should handle errors', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});

// Using done callback (legacy)
it('should call callback', (done) => {
  asyncFunction((result) => {
    expect(result).toBe('expected');
    done();
  });
});

// Testing with fake timers
it('should timeout after delay', async () => {
  jest.useFakeTimers();
  const promise = timeoutFunction();
  jest.advanceTimersByTime(5000);
  await expect(promise).rejects.toThrow('Timeout');
  jest.useRealTimers();
});
```

**Q4: What does 100% code coverage mean? Is it sufficient?**

```
100% coverage does NOT mean:
- Code is bug-free
- All edge cases are tested
- Business logic is correct
- Application works in production

100% coverage only means:
- Every line of code was executed at least once
- Does not guarantee test quality or effectiveness

More important factors:
- Quality of assertions
- Coverage of edge cases
- Testing error scenarios
- Meaningful test descriptions
- Testing business requirements, not just code paths
```

**Q5: Explain TDD and its benefits**

```
TDD (Test-Driven Development):
1. RED: Write a failing test first
2. GREEN: Write minimum code to make it pass
3. REFACTOR: Improve code while keeping tests green

Benefits:
- Forces thinking about requirements first
- Naturally leads to modular, testable code
- Provides comprehensive test coverage
- Tests serve as documentation
- Enables confident refactoring
- Catches bugs early in development

Challenges:
- Steeper learning curve
- May feel slower initially
- Requires discipline
- Some scenarios are harder to test first
```

### Best Practices Summary

1. **Follow the AAA Pattern**: Arrange, Act, Assert

```typescript
it('should calculate discount correctly', () => {
  // Arrange
  const cart = new ShoppingCart();
  cart.addItem({ price: 100, quantity: 2 });

  // Act
  const discount = cart.applyDiscount(0.1);

  // Assert
  expect(discount).toBe(20);
  expect(cart.total).toBe(180);
});
```

2. **Test Behavior, Not Implementation**: Focus on what the code does, not how

3. **Keep Tests Independent**: Each test should not depend on other tests

4. **Use Descriptive Test Names**: Clearly describe the behavior being tested

5. **Avoid Testing Implementation Details**: Do not test private methods or internal state

6. **Maintain Tests**: Test code needs refactoring and maintenance too

7. **Choose the Right Testing Level**: Not everything needs E2E tests

## Summary

Backend testing is a fundamental practice for building reliable, maintainable applications. This guide has covered the essential aspects of testing strategy:

**Key Takeaways:**

- **Testing Pyramid**: Balance unit, integration, and E2E tests appropriately
- **Unit Testing**: Test pure functions and business logic in isolation
- **Integration Testing**: Verify modules work together correctly
- **Mocking**: Use appropriate test doubles to isolate dependencies
- **Coverage**: Aim for meaningful coverage, not just high percentages
- **TDD**: Consider test-first development for better design
- **CI/CD**: Automate testing in your deployment pipeline

With these testing techniques, you can build more robust backend applications with confidence in your code quality and the ability to refactor and extend your codebase safely.

## Further Reading

### Official Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Mocha Documentation](https://mochajs.org/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testcontainers](https://testcontainers.com/)

### Books and Resources

- "Test-Driven Development: By Example" by Kent Beck
- "Growing Object-Oriented Software, Guided by Tests" by Steve Freeman
- "The Art of Unit Testing" by Roy Osherove
- "Working Effectively with Legacy Code" by Michael Feathers

### Related Topics

- **Continuous Integration**: Automate test execution on every commit
- **Property-Based Testing**: Generate test inputs automatically
- **Mutation Testing**: Verify test quality by introducing code changes
- **Contract Testing**: Verify API contracts between services
- **Performance Testing**: Measure and validate system performance

---

> We've provided a comprehensive foundation for backend testing. Remember that effective testing is not just about achieving high coverage numbers, but about building confidence in your code through well-designed, maintainable tests that verify the behavior your users depend on.
