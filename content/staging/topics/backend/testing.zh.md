---
title: 后端测试完全指南
description: 掌握后端测试策略和工具，保障代码质量
track: backend
section: testing
difficulty: intermediate
tags:
  - 测试
  - 单元测试
  - 集成测试
  - TDD
status: imported
origin: old/src/content/docs/backend/testing.zh.md
divergence: 0.277
issues: []
legacy:
  category: Backend
  subcategory: Testing
  order: 27
  lastUpdated: 2026-01-07
---

后端测试是保障服务端代码质量、确保业务逻辑正确性和系统稳定性的关键环节。本文将全面介绍后端测试的各个层面，从测试策略到具体工具，从单元测试到集成测试，帮助你构建完整的后端测试体系。

## 测试金字塔与测试策略

### 什么是测试金字塔

测试金字塔是由 Mike Cohn 提出的测试策略模型，它将测试分为三个层次：

```
          /\
         /  \
        / E2E \          <- 少量，验证端到端流程
       /--------\
      /  集成测试  \       <- 适量，验证模块协作
     /--------------\
    /    单元测试     \    <- 大量，验证独立单元
   /------------------\
```

**测试金字塔的核心原则：**

1. **底层测试数量最多**：单元测试应该占据测试套件的大部分
2. **越往上越少**：E2E 测试数量最少，但覆盖最关键的业务流程
3. **成本递增**：从下到上，测试的编写和维护成本递增
4. **速度递减**：从下到上，测试执行速度递减

### 后端测试策略制定

一个合理的后端测试策略应该考虑以下因素：

```javascript
// 测试分层策略示例
const backendTestingStrategy = {
  unit: {
    coverage: '80-90%',
    tools: ['Jest', 'Mocha', 'Vitest', 'pytest'],
    focus: ['业务逻辑', '工具函数', '数据转换', '验证规则']
  },
  integration: {
    coverage: '60-70%',
    tools: ['Supertest', 'pytest-django', 'TestContainers'],
    focus: ['API 端点', '数据库操作', '服务间通信', '中间件']
  },
  e2e: {
    coverage: '关键路径100%',
    tools: ['Postman', 'Newman', 'k6'],
    focus: ['用户注册登录', '核心业务流程', '支付流程']
  }
};
```

### 测试类型对比

| 测试类型 | 速度 | 成本 | 信心指数 | 适用场景 |
|---------|------|------|----------|----------|
| 单元测试 | 快 | 低 | 中 | 业务逻辑、工具函数 |
| 集成测试 | 中 | 中 | 高 | API、数据库操作 |
| E2E测试 | 慢 | 高 | 很高 | 关键业务流程 |
| 契约测试 | 快 | 低 | 中高 | 微服务间接口 |

## 单元测试基础

### 单元测试的核心原则

单元测试遵循 FIRST 原则：

- **Fast（快速）**：单元测试应该快速执行
- **Independent（独立）**：测试之间不应相互依赖
- **Repeatable（可重复）**：在任何环境下都能得到相同结果
- **Self-validating（自验证）**：测试应该自动判断通过或失败
- **Timely（及时）**：测试应该在生产代码之前或同时编写

### Node.js 单元测试配置

使用 Jest 作为测试框架：

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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### 业务逻辑单元测试

```typescript
// services/order.service.ts
interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  discount: number;
  tax: number;
}

export class OrderService {
  calculateSubtotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  calculateDiscount(subtotal: number, discountRate: number): number {
    if (discountRate < 0 || discountRate > 1) {
      throw new Error('折扣率必须在 0 到 1 之间');
    }
    return subtotal * discountRate;
  }

  calculateTax(subtotal: number, discount: number, taxRate: number): number {
    const taxableAmount = subtotal - discount;
    return taxableAmount * taxRate;
  }

  calculateTotal(order: Order): number {
    const subtotal = this.calculateSubtotal(order.items);
    const discountAmount = this.calculateDiscount(subtotal, order.discount);
    const tax = this.calculateTax(subtotal, discountAmount, order.tax);
    return subtotal - discountAmount + tax;
  }

  validateOrder(order: Order): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!order.items || order.items.length === 0) {
      errors.push('订单必须包含至少一个商品');
    }

    order.items?.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`商品 ${index + 1} 数量必须大于 0`);
      }
      if (item.unitPrice < 0) {
        errors.push(`商品 ${index + 1} 单价不能为负数`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
}

// services/order.service.test.ts
import { OrderService } from './order.service';

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
  });

  describe('calculateSubtotal', () => {
    it('应该正确计算小计', () => {
      const items = [
        { productId: '1', quantity: 2, unitPrice: 100 },
        { productId: '2', quantity: 3, unitPrice: 50 }
      ];

      const result = orderService.calculateSubtotal(items);

      expect(result).toBe(350); // 2*100 + 3*50
    });

    it('应该处理空数组', () => {
      const result = orderService.calculateSubtotal([]);

      expect(result).toBe(0);
    });

    it('应该处理单个商品', () => {
      const items = [{ productId: '1', quantity: 5, unitPrice: 20 }];

      const result = orderService.calculateSubtotal(items);

      expect(result).toBe(100);
    });
  });

  describe('calculateDiscount', () => {
    it('应该正确计算折扣金额', () => {
      const result = orderService.calculateDiscount(1000, 0.1);

      expect(result).toBe(100);
    });

    it('应该处理零折扣', () => {
      const result = orderService.calculateDiscount(1000, 0);

      expect(result).toBe(0);
    });

    it('应该处理满折扣', () => {
      const result = orderService.calculateDiscount(1000, 1);

      expect(result).toBe(1000);
    });

    it('应该拒绝无效的折扣率', () => {
      expect(() => orderService.calculateDiscount(1000, -0.1)).toThrow('折扣率必须在 0 到 1 之间');
      expect(() => orderService.calculateDiscount(1000, 1.5)).toThrow('折扣率必须在 0 到 1 之间');
    });
  });

  describe('calculateTotal', () => {
    it('应该正确计算订单总额', () => {
      const order = {
        id: 'order-1',
        items: [
          { productId: '1', quantity: 2, unitPrice: 100 },
          { productId: '2', quantity: 1, unitPrice: 200 }
        ],
        discount: 0.1,
        tax: 0.08
      };

      const result = orderService.calculateTotal(order);

      // 小计: 2*100 + 1*200 = 400
      // 折扣: 400 * 0.1 = 40
      // 税: (400 - 40) * 0.08 = 28.8
      // 总计: 400 - 40 + 28.8 = 388.8
      expect(result).toBeCloseTo(388.8, 2);
    });
  });

  describe('validateOrder', () => {
    it('应该验证有效订单', () => {
      const order = {
        id: 'order-1',
        items: [{ productId: '1', quantity: 1, unitPrice: 100 }],
        discount: 0,
        tax: 0.08
      };

      const result = orderService.validateOrder(order);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测空订单', () => {
      const order = {
        id: 'order-1',
        items: [],
        discount: 0,
        tax: 0
      };

      const result = orderService.validateOrder(order);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('订单必须包含至少一个商品');
    });

    it('应该检测无效数量', () => {
      const order = {
        id: 'order-1',
        items: [{ productId: '1', quantity: 0, unitPrice: 100 }],
        discount: 0,
        tax: 0
      };

      const result = orderService.validateOrder(order);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('商品 1 数量必须大于 0');
    });

    it('应该检测负数单价', () => {
      const order = {
        id: 'order-1',
        items: [{ productId: '1', quantity: 1, unitPrice: -50 }],
        discount: 0,
        tax: 0
      };

      const result = orderService.validateOrder(order);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('商品 1 单价不能为负数');
    });
  });
});
```

### Python 单元测试示例

```python
# services/user_service.py
from dataclasses import dataclass
from typing import Optional
import re
import hashlib

@dataclass
class User:
    id: str
    email: str
    username: str
    password_hash: str
    is_active: bool = True

class UserService:
    EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    def validate_email(self, email: str) -> bool:
        """验证邮箱格式"""
        if not email:
            return False
        return bool(re.match(self.EMAIL_PATTERN, email))

    def validate_password(self, password: str) -> dict:
        """验证密码强度"""
        errors = []

        if len(password) < 8:
            errors.append("密码长度至少为8位")
        if not re.search(r'[A-Z]', password):
            errors.append("密码必须包含至少一个大写字母")
        if not re.search(r'[a-z]', password):
            errors.append("密码必须包含至少一个小写字母")
        if not re.search(r'\d', password):
            errors.append("密码必须包含至少一个数字")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("密码必须包含至少一个特殊字符")

        return {"valid": len(errors) == 0, "errors": errors}

    def hash_password(self, password: str) -> str:
        """对密码进行哈希处理"""
        return hashlib.sha256(password.encode()).hexdigest()

    def verify_password(self, password: str, password_hash: str) -> bool:
        """验证密码"""
        return self.hash_password(password) == password_hash

    def generate_username(self, email: str) -> str:
        """从邮箱生成用户名"""
        if not email or '@' not in email:
            raise ValueError("无效的邮箱地址")
        return email.split('@')[0]


# tests/test_user_service.py
import pytest
from services.user_service import UserService

class TestUserService:
    @pytest.fixture
    def user_service(self):
        return UserService()

    class TestValidateEmail:
        def test_valid_email(self, user_service):
            """测试有效的邮箱地址"""
            assert user_service.validate_email("test@example.com") is True
            assert user_service.validate_email("user.name@domain.org") is True
            assert user_service.validate_email("user+tag@example.co.uk") is True

        def test_invalid_email(self, user_service):
            """测试无效的邮箱地址"""
            assert user_service.validate_email("") is False
            assert user_service.validate_email("invalid") is False
            assert user_service.validate_email("@example.com") is False
            assert user_service.validate_email("user@") is False
            assert user_service.validate_email("user@.com") is False

        def test_none_email(self, user_service):
            """测试空值"""
            assert user_service.validate_email(None) is False

    class TestValidatePassword:
        def test_valid_password(self, user_service):
            """测试有效密码"""
            result = user_service.validate_password("SecureP@ss123")
            assert result["valid"] is True
            assert len(result["errors"]) == 0

        def test_short_password(self, user_service):
            """测试过短的密码"""
            result = user_service.validate_password("Abc1!")
            assert result["valid"] is False
            assert "密码长度至少为8位" in result["errors"]

        def test_missing_uppercase(self, user_service):
            """测试缺少大写字母"""
            result = user_service.validate_password("password123!")
            assert result["valid"] is False
            assert "密码必须包含至少一个大写字母" in result["errors"]

        def test_missing_lowercase(self, user_service):
            """测试缺少小写字母"""
            result = user_service.validate_password("PASSWORD123!")
            assert result["valid"] is False
            assert "密码必须包含至少一个小写字母" in result["errors"]

        def test_missing_number(self, user_service):
            """测试缺少数字"""
            result = user_service.validate_password("SecurePass!")
            assert result["valid"] is False
            assert "密码必须包含至少一个数字" in result["errors"]

        def test_missing_special_char(self, user_service):
            """测试缺少特殊字符"""
            result = user_service.validate_password("SecurePass123")
            assert result["valid"] is False
            assert "密码必须包含至少一个特殊字符" in result["errors"]

        def test_multiple_errors(self, user_service):
            """测试多个错误"""
            result = user_service.validate_password("abc")
            assert result["valid"] is False
            assert len(result["errors"]) >= 4

    class TestHashPassword:
        def test_consistent_hash(self, user_service):
            """测试哈希一致性"""
            password = "TestPassword123"
            hash1 = user_service.hash_password(password)
            hash2 = user_service.hash_password(password)
            assert hash1 == hash2

        def test_different_passwords_different_hash(self, user_service):
            """测试不同密码产生不同哈希"""
            hash1 = user_service.hash_password("Password1")
            hash2 = user_service.hash_password("Password2")
            assert hash1 != hash2

    class TestVerifyPassword:
        def test_correct_password(self, user_service):
            """测试正确密码验证"""
            password = "MySecurePassword"
            password_hash = user_service.hash_password(password)
            assert user_service.verify_password(password, password_hash) is True

        def test_incorrect_password(self, user_service):
            """测试错误密码验证"""
            password_hash = user_service.hash_password("CorrectPassword")
            assert user_service.verify_password("WrongPassword", password_hash) is False

    class TestGenerateUsername:
        def test_generate_from_email(self, user_service):
            """测试从邮箱生成用户名"""
            assert user_service.generate_username("john@example.com") == "john"
            assert user_service.generate_username("jane.doe@company.org") == "jane.doe"

        def test_invalid_email(self, user_service):
            """测试无效邮箱"""
            with pytest.raises(ValueError, match="无效的邮箱地址"):
                user_service.generate_username("invalid-email")

        def test_empty_email(self, user_service):
            """测试空邮箱"""
            with pytest.raises(ValueError, match="无效的邮箱地址"):
                user_service.generate_username("")
```

## Mock 技术详解

### 什么是 Mock

Mock 是测试中用于模拟依赖项行为的技术。通过 Mock，我们可以：

- 隔离被测代码，消除外部依赖
- 控制依赖项的行为和返回值
- 验证与依赖项的交互是否正确
- 模拟难以重现的场景（如网络错误）

### Mock 的类型

```typescript
/**
 * Mock 类型说明：
 *
 * 1. Dummy（哑对象）：占位对象，不会被实际使用
 * 2. Stub（存根）：返回预设值的对象
 * 3. Spy（间谍）：记录调用信息的对象
 * 4. Mock（模拟）：有预期行为并验证调用的对象
 * 5. Fake（伪造）：简化实现的对象
 */

// Dummy 示例
const dummyLogger = {} as Logger;

// Stub 示例
const stubUserRepository = {
  findById: () => ({ id: '1', name: 'Test User' })
};

// Spy 示例
const spyLogger = jest.spyOn(console, 'log');

// Mock 示例
const mockEmailService = jest.fn().mockResolvedValue({ sent: true });

// Fake 示例
class FakeUserRepository {
  private users = new Map();

  save(user: User) {
    this.users.set(user.id, user);
  }

  findById(id: string) {
    return this.users.get(id);
  }
}
```

### Jest Mock 实战

```typescript
// services/notification.service.ts
interface EmailService {
  send(to: string, subject: string, body: string): Promise<boolean>;
}

interface SmsService {
  send(phone: string, message: string): Promise<boolean>;
}

interface User {
  id: string;
  email: string;
  phone: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}

export class NotificationService {
  constructor(
    private emailService: EmailService,
    private smsService: SmsService
  ) {}

  async notifyUser(user: User, message: string): Promise<{ email: boolean; sms: boolean }> {
    const results = { email: false, sms: false };

    if (user.preferences.emailNotifications) {
      results.email = await this.emailService.send(
        user.email,
        '新通知',
        message
      );
    }

    if (user.preferences.smsNotifications) {
      results.sms = await this.smsService.send(user.phone, message);
    }

    return results;
  }

  async sendBulkNotification(users: User[], message: string): Promise<number> {
    let successCount = 0;

    for (const user of users) {
      const result = await this.notifyUser(user, message);
      if (result.email || result.sms) {
        successCount++;
      }
    }

    return successCount;
  }
}

// services/notification.service.test.ts
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockSmsService: jest.Mocked<SmsService>;

  beforeEach(() => {
    // 创建 Mock 对象
    mockEmailService = {
      send: jest.fn()
    };
    mockSmsService = {
      send: jest.fn()
    };

    notificationService = new NotificationService(mockEmailService, mockSmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyUser', () => {
    const createUser = (overrides = {}): User => ({
      id: '1',
      email: 'test@example.com',
      phone: '13800138000',
      preferences: {
        emailNotifications: true,
        smsNotifications: true
      },
      ...overrides
    });

    it('应该发送邮件和短信通知', async () => {
      const user = createUser();
      mockEmailService.send.mockResolvedValue(true);
      mockSmsService.send.mockResolvedValue(true);

      const result = await notificationService.notifyUser(user, '测试消息');

      expect(result).toEqual({ email: true, sms: true });
      expect(mockEmailService.send).toHaveBeenCalledWith(
        'test@example.com',
        '新通知',
        '测试消息'
      );
      expect(mockSmsService.send).toHaveBeenCalledWith('13800138000', '测试消息');
    });

    it('应该只发送邮件通知当短信被禁用时', async () => {
      const user = createUser({
        preferences: { emailNotifications: true, smsNotifications: false }
      });
      mockEmailService.send.mockResolvedValue(true);

      const result = await notificationService.notifyUser(user, '测试消息');

      expect(result).toEqual({ email: true, sms: false });
      expect(mockEmailService.send).toHaveBeenCalledTimes(1);
      expect(mockSmsService.send).not.toHaveBeenCalled();
    });

    it('应该只发送短信通知当邮件被禁用时', async () => {
      const user = createUser({
        preferences: { emailNotifications: false, smsNotifications: true }
      });
      mockSmsService.send.mockResolvedValue(true);

      const result = await notificationService.notifyUser(user, '测试消息');

      expect(result).toEqual({ email: false, sms: true });
      expect(mockEmailService.send).not.toHaveBeenCalled();
      expect(mockSmsService.send).toHaveBeenCalledTimes(1);
    });

    it('应该处理邮件发送失败', async () => {
      const user = createUser();
      mockEmailService.send.mockResolvedValue(false);
      mockSmsService.send.mockResolvedValue(true);

      const result = await notificationService.notifyUser(user, '测试消息');

      expect(result).toEqual({ email: false, sms: true });
    });

    it('应该处理邮件服务异常', async () => {
      const user = createUser();
      mockEmailService.send.mockRejectedValue(new Error('SMTP 错误'));
      mockSmsService.send.mockResolvedValue(true);

      await expect(notificationService.notifyUser(user, '测试消息')).rejects.toThrow('SMTP 错误');
    });
  });

  describe('sendBulkNotification', () => {
    it('应该返回成功通知的用户数量', async () => {
      const users = [
        {
          id: '1',
          email: 'user1@example.com',
          phone: '13800138001',
          preferences: { emailNotifications: true, smsNotifications: false }
        },
        {
          id: '2',
          email: 'user2@example.com',
          phone: '13800138002',
          preferences: { emailNotifications: true, smsNotifications: true }
        },
        {
          id: '3',
          email: 'user3@example.com',
          phone: '13800138003',
          preferences: { emailNotifications: false, smsNotifications: false }
        }
      ];

      mockEmailService.send.mockResolvedValue(true);
      mockSmsService.send.mockResolvedValue(true);

      const result = await notificationService.sendBulkNotification(users, '批量消息');

      expect(result).toBe(2); // 只有 2 个用户成功接收到通知
    });
  });
});
```

### 模拟模块和外部依赖

```typescript
// 模拟整个模块
jest.mock('axios');
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API 客户端测试', () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
  });

  it('应该获取用户数据', async () => {
    const mockUser = { id: '1', name: '张三' };
    mockedAxios.get.mockResolvedValue({ data: mockUser });

    const result = await axios.get('/api/users/1');

    expect(result.data).toEqual(mockUser);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/1');
  });

  it('应该处理网络错误', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    await expect(axios.get('/api/users/1')).rejects.toThrow('Network Error');
  });
});

// 部分模拟
jest.mock('./utils', () => {
  const originalModule = jest.requireActual('./utils');
  return {
    ...originalModule,
    formatDate: jest.fn(() => '2024-01-01'),
    generateId: jest.fn(() => 'mock-id-123')
  };
});

// 模拟定时器
describe('定时器测试', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('应该在延迟后执行回调', () => {
    const callback = jest.fn();

    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('应该处理 setInterval', () => {
    const callback = jest.fn();

    setInterval(callback, 100);

    jest.advanceTimersByTime(350);

    expect(callback).toHaveBeenCalledTimes(3);
  });
});

// 模拟日期
describe('日期测试', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('应该返回模拟的当前日期', () => {
    expect(new Date().toISOString()).toBe('2024-01-15T00:00:00.000Z');
  });
});
```

## 集成测试

### 什么是集成测试

集成测试验证多个组件或模块协同工作时的行为，包括：

- API 端点测试
- 数据库操作测试
- 服务间通信测试
- 中间件测试

### API 集成测试

使用 Supertest 测试 Express API：

```typescript
// app.ts
import express from 'express';
import { userRouter } from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(express.json());
app.use('/api/users', userRouter);
app.use(errorHandler);

export default app;

// routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

export { router as userRouter };

// tests/integration/user.api.test.ts
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

describe('User API 集成测试', () => {
  // 测试前清理数据库
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  // 测试后断开连接
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/users', () => {
    it('应该返回空数组当没有用户时', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('应该返回所有用户', async () => {
      // 准备测试数据
      await prisma.user.createMany({
        data: [
          { email: 'user1@example.com', name: '用户1' },
          { email: 'user2@example.com', name: '用户2' }
        ]
      });

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('email', 'user1@example.com');
    });

    it('应该支持分页', async () => {
      // 创建 15 个用户
      await prisma.user.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          email: `user${i + 1}@example.com`,
          name: `用户${i + 1}`
        }))
      });

      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.meta.total).toBe(15);
      expect(response.body.meta.totalPages).toBe(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('应该返回指定用户', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: '测试用户' }
      });

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        email: 'test@example.com',
        name: '测试用户'
      });
    });

    it('应该返回 404 当用户不存在时', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', '用户不存在');
    });
  });

  describe('POST /api/users', () => {
    it('应该创建新用户', async () => {
      const userData = {
        email: 'new@example.com',
        name: '新用户',
        password: 'SecureP@ss123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        email: 'new@example.com',
        name: '新用户'
      });
      expect(response.body).not.toHaveProperty('password');

      // 验证数据库中的记录
      const dbUser = await prisma.user.findUnique({
        where: { email: 'new@example.com' }
      });
      expect(dbUser).not.toBeNull();
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({})
        .expect(400);

      expect(response.body.errors).toContain('邮箱是必填项');
      expect(response.body.errors).toContain('姓名是必填项');
    });

    it('应该验证邮箱格式', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'invalid-email', name: '用户', password: 'SecureP@ss123' })
        .expect(400);

      expect(response.body.errors).toContain('邮箱格式无效');
    });

    it('应该拒绝重复邮箱', async () => {
      await prisma.user.create({
        data: { email: 'existing@example.com', name: '已存在用户' }
      });

      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'existing@example.com',
          name: '新用户',
          password: 'SecureP@ss123'
        })
        .expect(409);

      expect(response.body.error).toBe('邮箱已被注册');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('应该更新用户信息', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: '原名称' }
      });

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .send({ name: '新名称' })
        .expect(200);

      expect(response.body.name).toBe('新名称');
    });

    it('应该返回 404 当用户不存在时', async () => {
      await request(app)
        .put('/api/users/nonexistent-id')
        .send({ name: '新名称' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('应该删除用户', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: '测试用户' }
      });

      await request(app)
        .delete(`/api/users/${user.id}`)
        .expect(204);

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(dbUser).toBeNull();
    });
  });
});
```

### 数据库集成测试

使用 TestContainers 进行数据库测试：

```typescript
// tests/integration/database.test.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';

describe('数据库集成测试', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // 启动 PostgreSQL 容器
    container = await new PostgreSqlContainer()
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    // 设置数据库 URL
    process.env.DATABASE_URL = container.getConnectionUri();

    // 运行数据库迁移（使用 Prisma CLI）
    // 注意：在实际项目中，请使用安全的命令执行方式
    // 这里仅作为示例说明流程

    // 创建 Prisma 客户端
    prisma = new PrismaClient();
  }, 60000); // 增加超时时间

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    // 清理所有表
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('用户操作', () => {
    it('应该创建用户', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: '测试用户'
        }
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('应该查询用户及其订单', async () => {
      // 创建用户和产品
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: '测试用户' }
      });

      const product = await prisma.product.create({
        data: { name: '测试产品', price: 100 }
      });

      // 创建订单
      await prisma.order.create({
        data: {
          userId: user.id,
          total: 200,
          items: {
            create: [
              { productId: product.id, quantity: 2, unitPrice: 100 }
            ]
          }
        }
      });

      // 查询用户及其订单
      const userWithOrders = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          orders: {
            include: { items: true }
          }
        }
      });

      expect(userWithOrders?.orders).toHaveLength(1);
      expect(userWithOrders?.orders[0].items).toHaveLength(1);
    });
  });

  describe('事务操作', () => {
    it('应该在事务中创建订单', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: '测试用户' }
      });

      const product = await prisma.product.create({
        data: { name: '测试产品', price: 100, stock: 10 }
      });

      // 使用事务创建订单并扣减库存
      const order = await prisma.$transaction(async (tx) => {
        // 检查库存
        const currentProduct = await tx.product.findUnique({
          where: { id: product.id }
        });

        if (!currentProduct || currentProduct.stock < 2) {
          throw new Error('库存不足');
        }

        // 扣减库存
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: 2 } }
        });

        // 创建订单
        return tx.order.create({
          data: {
            userId: user.id,
            total: 200,
            items: {
              create: [
                { productId: product.id, quantity: 2, unitPrice: 100 }
              ]
            }
          }
        });
      });

      expect(order).toBeDefined();

      // 验证库存已扣减
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });
      expect(updatedProduct?.stock).toBe(8);
    });

    it('应该在库存不足时回滚事务', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: '测试用户' }
      });

      const product = await prisma.product.create({
        data: { name: '测试产品', price: 100, stock: 1 }
      });

      await expect(
        prisma.$transaction(async (tx) => {
          const currentProduct = await tx.product.findUnique({
            where: { id: product.id }
          });

          if (!currentProduct || currentProduct.stock < 2) {
            throw new Error('库存不足');
          }

          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: 2 } }
          });

          return tx.order.create({
            data: {
              userId: user.id,
              total: 200,
              items: {
                create: [
                  { productId: product.id, quantity: 2, unitPrice: 100 }
                ]
              }
            }
          });
        })
      ).rejects.toThrow('库存不足');

      // 验证库存未变化
      const unchangedProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });
      expect(unchangedProduct?.stock).toBe(1);
    });
  });
});
```

## 测试覆盖率

### 配置测试覆盖率

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.spec.{ts,js}',
    '!src/test/**',
    '!src/migrations/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // 对特定目录设置更高的阈值
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### 覆盖率报告解读

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.32 |    72.15 |   88.24 |   85.32 |
 services/          |   92.45 |    85.71 |   95.00 |   92.45 |
  order.service.ts  |   100.0 |   100.00 |   100.0 |   100.0 |
  user.service.ts   |   88.89 |    75.00 |   90.00 |   88.89 | 45-48
 controllers/       |   78.26 |    60.00 |   80.00 |   78.26 |
  user.controller.ts|   78.26 |    60.00 |   80.00 |   78.26 | 23-35,42-50
 utils/             |   85.00 |    70.00 |   90.00 |   85.00 |
  validation.ts     |   85.00 |    70.00 |   90.00 |   85.00 | 12-18
--------------------|---------|----------|---------|---------|-------------------
```

**覆盖率指标说明：**

| 指标 | 说明 | 重要性 |
|------|------|--------|
| Statements | 已执行语句的百分比 | 基础指标 |
| Branches | 已执行条件分支的百分比 | 逻辑覆盖 |
| Functions | 已调用函数的百分比 | 功能覆盖 |
| Lines | 已执行代码行的百分比 | 整体覆盖 |

### 提高测试覆盖率的策略

```typescript
// 1. 测试边界条件
describe('边界条件测试', () => {
  it('应该处理空数组', () => {
    expect(calculateAverage([])).toBe(0);
  });

  it('应该处理单元素数组', () => {
    expect(calculateAverage([5])).toBe(5);
  });

  it('应该处理负数', () => {
    expect(calculateAverage([-1, -2, -3])).toBe(-2);
  });

  it('应该处理很大的数字', () => {
    expect(calculateAverage([Number.MAX_SAFE_INTEGER, 1])).toBeCloseTo(
      (Number.MAX_SAFE_INTEGER + 1) / 2
    );
  });
});

// 2. 测试错误路径
describe('错误处理测试', () => {
  it('应该处理无效输入', () => {
    expect(() => parseConfig(null)).toThrow('配置不能为空');
  });

  it('应该处理网络超时', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Timeout'));

    await expect(fetchData()).rejects.toThrow('Timeout');
  });

  it('应该处理认证失败', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401);

    expect(response.body.error).toBe('未授权');
  });
});

// 3. 测试异步流程
describe('异步流程测试', () => {
  it('应该等待所有操作完成', async () => {
    const results = await Promise.all([
      processItem(1),
      processItem(2),
      processItem(3)
    ]);

    expect(results).toHaveLength(3);
  });

  it('应该处理并发限制', async () => {
    const startTime = Date.now();

    await processWithConcurrencyLimit(items, 2);

    const duration = Date.now() - startTime;
    expect(duration).toBeGreaterThan(500); // 确保有并发限制
  });
});
```

## TDD（测试驱动开发）

### TDD 的核心流程

TDD 遵循"红-绿-重构"循环：

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   1. 红色 (Red)     →    2. 绿色 (Green)   →   3. 重构     │
│   编写失败的测试         编写最少代码          改进代码     │
│                          使测试通过            保持测试通过 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### TDD 实战示例

让我们通过 TDD 实现一个购物车功能：

```typescript
// 第一步：红色 - 编写失败的测试
// tests/cart.service.test.ts

describe('CartService', () => {
  describe('addItem', () => {
    it('应该添加商品到空购物车', () => {
      const cart = new CartService();

      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 1 });

      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].productId).toBe('1');
    });
  });
});

// 运行测试 - 会失败，因为 CartService 还不存在
// npm test -- --watch

// 第二步：绿色 - 编写最少代码使测试通过
// services/cart.service.ts

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export class CartService {
  private items: CartItem[] = [];

  addItem(item: CartItem): void {
    this.items.push(item);
  }

  getItems(): CartItem[] {
    return this.items;
  }
}

// 测试通过！继续添加更多测试

// 第三步：添加更多测试用例
describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    cart = new CartService();
  });

  describe('addItem', () => {
    it('应该添加商品到空购物车', () => {
      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 1 });

      expect(cart.getItems()).toHaveLength(1);
    });

    it('应该合并相同商品', () => {
      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 1 });
      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 2 });

      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].quantity).toBe(3);
    });

    it('应该拒绝数量为零或负数的商品', () => {
      expect(() => {
        cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 0 });
      }).toThrow('数量必须大于零');
    });
  });

  describe('removeItem', () => {
    it('应该移除商品', () => {
      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 1 });

      cart.removeItem('1');

      expect(cart.getItems()).toHaveLength(0);
    });

    it('应该在商品不存在时抛出错误', () => {
      expect(() => {
        cart.removeItem('nonexistent');
      }).toThrow('商品不存在');
    });
  });

  describe('updateQuantity', () => {
    it('应该更新商品数量', () => {
      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 1 });

      cart.updateQuantity('1', 5);

      expect(cart.getItems()[0].quantity).toBe(5);
    });

    it('应该在数量为零时移除商品', () => {
      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 1 });

      cart.updateQuantity('1', 0);

      expect(cart.getItems()).toHaveLength(0);
    });
  });

  describe('getTotal', () => {
    it('应该计算购物车总价', () => {
      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 2 });
      cart.addItem({ productId: '2', name: '商品B', price: 50, quantity: 3 });

      expect(cart.getTotal()).toBe(350); // 100*2 + 50*3
    });

    it('空购物车总价应为零', () => {
      expect(cart.getTotal()).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('应该应用折扣', () => {
      cart.addItem({ productId: '1', name: '商品A', price: 100, quantity: 1 });

      cart.applyDiscount(0.1); // 10% 折扣

      expect(cart.getTotal()).toBe(90);
    });

    it('应该拒绝无效折扣率', () => {
      expect(() => cart.applyDiscount(-0.1)).toThrow('折扣率必须在 0 到 1 之间');
      expect(() => cart.applyDiscount(1.5)).toThrow('折扣率必须在 0 到 1 之间');
    });
  });
});

// 第四步：实现完整的 CartService
// services/cart.service.ts

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export class CartService {
  private items: Map<string, CartItem> = new Map();
  private discountRate: number = 0;

  addItem(item: CartItem): void {
    if (item.quantity <= 0) {
      throw new Error('数量必须大于零');
    }

    const existingItem = this.items.get(item.productId);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.set(item.productId, { ...item });
    }
  }

  removeItem(productId: string): void {
    if (!this.items.has(productId)) {
      throw new Error('商品不存在');
    }
    this.items.delete(productId);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.items.delete(productId);
      return;
    }

    const item = this.items.get(productId);
    if (!item) {
      throw new Error('商品不存在');
    }
    item.quantity = quantity;
  }

  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }

  getTotal(): number {
    const subtotal = this.getItems().reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return subtotal * (1 - this.discountRate);
  }

  applyDiscount(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('折扣率必须在 0 到 1 之间');
    }
    this.discountRate = rate;
  }

  clear(): void {
    this.items.clear();
    this.discountRate = 0;
  }
}

// 第五步：重构 - 提取常量，改进代码结构
// services/cart.service.ts (重构后)

const ERRORS = {
  INVALID_QUANTITY: '数量必须大于零',
  ITEM_NOT_FOUND: '商品不存在',
  INVALID_DISCOUNT: '折扣率必须在 0 到 1 之间'
} as const;

export class CartService {
  private items: Map<string, CartItem> = new Map();
  private discountRate: number = 0;

  addItem(item: CartItem): void {
    this.validateQuantity(item.quantity);
    this.mergeOrAddItem(item);
  }

  private validateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error(ERRORS.INVALID_QUANTITY);
    }
  }

  private mergeOrAddItem(item: CartItem): void {
    const existingItem = this.items.get(item.productId);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.set(item.productId, { ...item });
    }
  }

  // ... 其余方法保持不变
}
```

### BDD（行为驱动开发）

BDD 使用自然语言描述行为，更接近业务需求：

```typescript
// 使用 Jest 的 BDD 风格
describe('Feature: 用户登录', () => {
  describe('Scenario: 使用有效凭证登录', () => {
    let authService: AuthService;
    let result: AuthResult;

    beforeAll(async () => {
      authService = new AuthService();
    });

    it('Given 用户已注册', async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'SecureP@ss123'
      });

      const user = await authService.findByEmail('test@example.com');
      expect(user).not.toBeNull();
    });

    it('When 用户使用正确的凭证登录', async () => {
      result = await authService.login({
        email: 'test@example.com',
        password: 'SecureP@ss123'
      });
    });

    it('Then 登录应该成功', () => {
      expect(result.success).toBe(true);
    });

    it('And 应该返回访问令牌', () => {
      expect(result.accessToken).toBeDefined();
    });

    it('And 应该返回刷新令牌', () => {
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('Scenario: 使用无效密码登录', () => {
    it('应该返回认证失败错误', async () => {
      const authService = new AuthService();

      await authService.register({
        email: 'test2@example.com',
        password: 'SecureP@ss123'
      });

      const result = await authService.login({
        email: 'test2@example.com',
        password: 'WrongPassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('邮箱或密码错误');
    });
  });
});
```

## CI/CD 中的测试集成

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Backend Tests

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

      - name: Setup Node.js ${{ matrix.node-version }}
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
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
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
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: integration-test-report
          path: test-results/
          retention-days: 7

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload E2E test artifacts
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-test-report
          path: e2e-results/
          retention-days: 7
```

### Pre-commit Hook 配置

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
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

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

## 面试要点

### 常见面试问题

**Q1: 单元测试和集成测试的区别是什么？**

```
单元测试：
- 测试最小的代码单元（函数、方法、类）
- 隔离被测代码，模拟所有依赖
- 执行速度快，数量多
- 发现问题精准定位

集成测试：
- 测试多个模块的协作
- 可能包含真实依赖（如数据库、Redis）
- 执行速度相对较慢
- 验证模块间的接口和数据流
- 更接近真实运行环境
```

**Q2: 如何设计可测试的代码？**

```typescript
// 不好的写法：难以测试
class UserService {
  async createUser(data: UserData) {
    // 直接依赖全局配置
    const apiUrl = process.env.API_URL;
    // 直接使用 fetch
    const response = await fetch(`${apiUrl}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // 直接依赖数据库
    await database.save(await response.json());
  }
}

// 好的写法：依赖注入，便于测试
class UserService {
  constructor(
    private httpClient: HttpClient,
    private userRepository: UserRepository,
    private config: Config
  ) {}

  async createUser(data: UserData) {
    const response = await this.httpClient.post(
      `${this.config.apiUrl}/users`,
      data
    );
    await this.userRepository.save(response.data);
    return response.data;
  }
}

// 测试时可以注入 mock
const mockHttpClient = { post: jest.fn() };
const mockUserRepository = { save: jest.fn() };
const mockConfig = { apiUrl: 'http://test.com' };

const service = new UserService(mockHttpClient, mockUserRepository, mockConfig);
```

**Q3: 什么时候使用 Mock，什么时候不使用？**

```typescript
// 应该使用 Mock 的场景：
// 1. 外部服务（API、第三方库）
// 2. 不可控的依赖（时间、随机数）
// 3. 缓慢的操作（数据库、网络）
// 4. 有副作用的操作（发送邮件、支付）

// 不应该过度使用 Mock 的场景：
// 1. 测试对象自身的逻辑
// 2. 简单的工具函数
// 3. 值对象和实体

// 反模式：过度 Mock
it('过度 Mock 示例', () => {
  const mockAdd = jest.fn().mockReturnValue(5);
  const mockMultiply = jest.fn().mockReturnValue(10);

  // 这种测试没有意义，只是在验证 mock 的设置
  expect(mockAdd(2, 3)).toBe(5);
});

// 正确做法：只 Mock 必要的依赖
it('正确的 Mock 使用', async () => {
  const mockEmailService = { send: jest.fn().mockResolvedValue(true) };
  const userService = new UserService(mockEmailService);

  await userService.register({ email: 'test@example.com', password: 'test' });

  expect(mockEmailService.send).toHaveBeenCalledWith(
    'test@example.com',
    expect.stringContaining('欢迎')
  );
});
```

**Q4: 测试覆盖率 100% 意味着什么？**

```
100% 覆盖率不意味着：
- 代码没有 bug
- 所有边界条件都已测试
- 业务逻辑都正确
- 并发问题已处理

100% 覆盖率只表示：
- 所有代码行都至少执行了一次
- 但不保证测试的质量和有效性

更重要的是：
- 测试的质量而非数量
- 关键路径的覆盖
- 边界条件的测试
- 有意义的断言
- 错误场景的覆盖
```

**Q5: 如何测试异步代码？**

```typescript
// 使用 async/await
it('应该异步获取数据', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// 测试 Promise 拒绝
it('应该处理错误', async () => {
  await expect(fetchData()).rejects.toThrow('Network error');
});

// 测试定时器
it('应该在延迟后执行', async () => {
  jest.useFakeTimers();

  const callback = jest.fn();
  scheduleTask(callback, 1000);

  jest.advanceTimersByTime(1000);

  expect(callback).toHaveBeenCalled();

  jest.useRealTimers();
});

// 等待条件满足
it('应该等待状态更新', async () => {
  const service = new AsyncService();
  service.startProcessing();

  await waitFor(() => {
    expect(service.isComplete()).toBe(true);
  });
});
```

### 最佳实践总结

1. **遵循 AAA 模式**：Arrange（准备）、Act（执行）、Assert（断言）

2. **测试行为而非实现**：关注代码做什么，而非怎么做

3. **保持测试独立**：每个测试不应依赖其他测试的状态

4. **使用有意义的测试描述**：测试名称应清晰描述被测试的行为

5. **避免测试实现细节**：不要测试私有方法或内部状态

6. **及时维护测试**：测试代码同样需要重构和维护

7. **选择合适的测试级别**：不是所有东西都需要 E2E 测试

8. **使用工厂函数创建测试数据**：避免重复的数据准备代码

9. **设置合理的超时时间**：避免测试因超时而失败

10. **定期运行完整测试套件**：确保没有回归问题

## 总结

后端测试是保障代码质量的关键环节。从单元测试的精准验证，到集成测试的模块协作验证，再到 E2E 测试的全流程覆盖，每个层面都有其独特的价值和适用场景。

关键要点：

- **测试金字塔**：合理分配不同类型测试的比例
- **Mock 策略**：适当使用 Mock 隔离依赖，但不要过度 Mock
- **覆盖率**：追求有意义的覆盖率，而非单纯的数字
- **TDD**：通过测试驱动开发提高代码质量
- **CI 集成**：将测试融入持续集成流程

掌握这些测试技能，将帮助你构建更可靠、更易维护的后端应用。

---

> 本文涵盖了后端测试的核心概念和实践要点。深入理解单元测试、集成测试和 Mock 技术是掌握后端测试的关键。建议读者结合实际项目练习，加深对这些概念的理解。
