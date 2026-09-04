---
title: TypeScript 品牌类型（Branded Types）与名义类型
description: 深入掌握 TypeScript 品牌类型：通过类型品牌实现名义类型系统、增强类型安全性、避免原始类型混淆的完整指南
track: typescript
section: type-system
difficulty: advanced
tags:
  - TypeScript
  - 品牌类型
  - 名义类型
  - 类型安全
  - 结构类型
  - 类型品牌
status: imported
origin: old/src/content/docs/typescript/branded-types.zh.md
divergence: 0.346
issues:
  - order-mismatch
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 25
  lastUpdated: 2026-01-07
---

品牌类型（Branded Types），也称为名义类型（Nominal Types），是 TypeScript 中一种高级类型技术，用于在结构类型系统中模拟名义类型的行为。通过为类型添加"品牌"标记，我们可以创建在语义上不同但结构相同的类型，提高代码的类型安全性和自文档化程度。本文将深入探讨品牌类型的原理、应用场景和最佳实践。

## 概念解释

### 什么是品牌类型？

品牌类型是通过在类型中嵌入唯一标识符（"品牌"）来区分在结构上相同但语义不同的类型。TypeScript 的类型系统基于结构类型（Structural Typing），这意味着只要两个类型的结构相同，它们就被认为是兼容的。品牌类型通过添加虚拟属性来打破这种兼容性。

```typescript
// 结构类型系统：这两个类型被认为是兼容的
type UserId = number;
type ProductId = number;

const userId: UserId = 1;
const productId: ProductId = userId;  // OK，但这可能导致 bug

// 品牌类型：添加虚拟属性来区分
type UserId = number & { readonly __brand: "UserId" };
type ProductId = number & { readonly __brand: "ProductId" };

const userId: UserId = 1 as UserId;
const productId: ProductId = userId;  // Error: 类型不兼容
```

### 与名义类型的关系

许多编程语言（如 Java、C++）使用名义类型系统，其中两个类型只有在明确声明相同时才视为相同。TypeScript 则使用结构类型系统，这提供了更灵活的类型推断，但有时会导致不同含义的值被混淆。品牌类型是在 TypeScript 的结构类型系统中实现名义类型语义的桥梁。

### 历史背景与演变

品牌类型技术在 TypeScript 社区中的使用逐渐增加，尤其是在大型项目中。它是一种编码模式，而不是 TypeScript 语言特性，因此兼容所有版本的 TypeScript。这使得它成为实现更强类型安全的实用工具。

### 解决的问题

1. **防止相同原始类型的混淆**：区分 `UserId` 和 `ProductId` 虽然都是数字
2. **增强编译时安全**：在编译阶段捕获类型错误
3. **自文档化代码**：类型本身表达了值的语义含义
4. **减少运行时错误**：通过编译时检查避免数据混淆

## 核心原理

### 结构类型 vs 名义类型

**结构类型系统（Structural Typing）**：TypeScript 默认使用。两个类型如果具有相同的结构，则被视为兼容。

```typescript
interface Point {
  x: number;
  y: number;
}

interface Coordinate {
  x: number;
  y: number;
}

const point: Point = { x: 1, y: 2 };
const coord: Coordinate = point;  // OK，结构相同
```

**名义类型系统（Nominal Typing）**：类型必须显式声明为相同才被视为兼容。品牌类型通过虚拟属性模拟这一行为。

```typescript
// 通过交叉类型和唯一标识符实现名义类型
type Point = { x: number; y: number } & { __brand: "Point" };
type Coordinate = { x: number; y: number } & { __brand: "Coordinate" };

const point: Point = { x: 1, y: 2 } as Point;
const coord: Coordinate = point;  // Error: 品牌不匹配
```

### 品牌类型的实现机制

品牌类型的核心是利用交叉类型（Intersection Types）：

```typescript
// 基本模式
type Branded<T, B> = T & { readonly __brand: B };

// 创建品牌化的类型
type UserId = Branded<number, "UserId">;
type Email = Branded<string, "Email">;
```

### 类型守卫与验证

品牌类型需要手动创建值（通过 `as` 断言），因此需要配套的类型守卫来验证数据。

```typescript
// 类型守卫函数
function isUserId(value: unknown): value is UserId {
  return typeof value === "number" && value > 0;
}

// 创建品牌化值的辅助函数
function createUserId(value: number): UserId | null {
  if (value > 0) {
    return value as UserId;
  }
  return null;
}
```

## 核心要点

### 基础品牌类型模式

最简单的品牌类型实现方式：

```typescript
// 为原始类型添加品牌
type UserId = number & { readonly __brand: "UserId" };
type ProductId = number & { readonly __brand: "ProductId" };
type Email = string & { readonly __brand: "Email" };

// 为对象类型添加品牌
interface User {
  id: number;
  name: string;
}

type ValidatedUser = User & { readonly __brand: "ValidatedUser" };

// 使用品牌化类型
const userId = 123 as UserId;
const productId = 456 as ProductId;

// 这会导致类型错误
// const wrongId: UserId = productId;  // Error

// 这是允许的
function getUserWithId(id: UserId): User {
  return { id, name: "John" };
}

getUserWithId(userId);      // OK
// getUserWithId(productId);  // Error: ProductId 不能分配给 UserId
```

### 可重用的品牌类型辅助

创建通用的品牌类型工具：

```typescript
// 通用品牌类型工具
type Brand<T, B extends string> = T & { readonly __brand: B };

// 使用通用工具创建品牌类型
type UserId = Brand<number, "UserId">;
type PostId = Brand<number, "PostId">;
type Url = Brand<string, "Url">;
type Timestamp = Brand<number, "Timestamp">;

// 品牌类型的构造函数辅助
function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}

// 使用
const userId = brand<number, "UserId">(123);
const postId = brand<number, "PostId">(456);
const url = brand<string, "Url">("https://example.com");
```

### 验证函数与安全创建

确保品牌化值的有效性：

```typescript
// 带验证的品牌类型工厂
type UserId = Brand<number, "UserId">;
type Email = Brand<string, "Email">;

// 验证函数模式
const UserIdBrand = {
  validate: (value: number): UserId | null => {
    return value > 0 && value <= 999999999 ? (value as UserId) : null;
  },
  is: (value: unknown): value is UserId => {
    return typeof value === "number" && value > 0 && value <= 999999999;
  }
};

const EmailBrand = {
  validate: (value: string): Email | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? (value as Email) : null;
  },
  is: (value: unknown): value is Email => {
    return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
};

// 使用验证
const maybeUserId = UserIdBrand.validate(123);
if (maybeUserId !== null) {
  // maybeUserId 现在被类型系统识别为 UserId
  console.log("Valid user ID:", maybeUserId);
}

// 类型守卫
function processEmail(value: unknown) {
  if (EmailBrand.is(value)) {
    // value 现在的类型是 Email
    console.log("Valid email:", value);
  }
}
```

### 高级品牌类型：多层验证

创建更复杂的品牌类型系统：

```typescript
// 多层验证的品牌类型
type PositiveNumber = Brand<number, "PositiveNumber">;
type SmallPositiveNumber = Brand<PositiveNumber, "SmallPositiveNumber">;

// 构造工厂模式
const createPositiveNumber = (value: number): PositiveNumber | null => {
  return value > 0 ? (value as PositiveNumber) : null;
};

const createSmallPositiveNumber = (value: PositiveNumber): SmallPositiveNumber | null => {
  return value < 100 ? (value as SmallPositiveNumber) : null;
};

// 组合使用
const pos = createPositiveNumber(50);
if (pos !== null) {
  const small = createSmallPositiveNumber(pos);
  if (small !== null) {
    console.log("Small positive number:", small);
  }
}

// 实际应用：权限级别
type AdminLevel = Brand<number, "AdminLevel">;
type SuperAdminLevel = Brand<AdminLevel, "SuperAdminLevel">;

const createAdminLevel = (level: number): AdminLevel | null => {
  return level >= 1 && level <= 10 ? (level as AdminLevel) : null;
};

const createSuperAdminLevel = (adminLevel: AdminLevel): SuperAdminLevel | null => {
  return adminLevel >= 8 ? (adminLevel as SuperAdminLevel) : null;
};
```

### 与泛型结合

在泛型中使用品牌类型：

```typescript
// 泛型品牌类型
type DatabaseRecord<T, ID extends Brand<any, string>> = T & {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type UserId = Brand<number, "UserId">;
type PostId = Brand<number, "PostId">;

interface UserData {
  name: string;
  email: Email;
}

interface PostData {
  title: string;
  content: string;
}

type User = DatabaseRecord<UserData, UserId>;
type Post = DatabaseRecord<PostData, PostId>;

// 使用
const user: User = {
  id: 1 as UserId,
  name: "Alice",
  email: "alice@example.com" as Email,
  createdAt: Date.now() as Timestamp,
  updatedAt: Date.now() as Timestamp
};

const post: Post = {
  id: 1 as PostId,
  title: "My Post",
  content: "Content",
  createdAt: Date.now() as Timestamp,
  updatedAt: Date.now() as Timestamp
};

// 防止混淆
// const wrongUser: User = { ...post };  // Error: PostId 不能分配给 UserId
```

## 最佳实践

### 统一的品牌类型定义

在项目中建立一致的品牌类型定义模式：

```typescript
// types/brand.ts - 集中定义所有品牌类型
type Brand<T, B extends string> = T & { readonly __brand: B };

// Domain Types
export type UserId = Brand<number, "UserId">;
export type ProductId = Brand<number, "ProductId">;
export type OrderId = Brand<number, "OrderId">;
export type Email = Brand<string, "Email">;
export type Url = Brand<string, "Url">;
export type Timestamp = Brand<number, "Timestamp">;

// Factory Functions
export const UserId = {
  create: (value: number): UserId | Error => {
    if (!Number.isInteger(value) || value <= 0) {
      return new Error("UserId must be a positive integer");
    }
    return value as UserId;
  },
  from: (value: number): UserId => value as UserId, // 无验证版本
  is: (value: unknown): value is UserId => {
    return typeof value === "number" && value > 0 && Number.isInteger(value);
  }
};

export const Email = {
  create: (value: string): Email | Error => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return new Error("Invalid email format");
    }
    return value as Email;
  },
  from: (value: string): Email => value as Email,
  is: (value: unknown): value is Email => {
    return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
};
```

### 与 Result 类型组合

结合 Result 或 Either 类型处理验证错误：

```typescript
// types/result.ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const Result = {
  ok: <T, E>(value: T): Result<T, E> => ({ ok: true, value }),
  err: <T, E>(error: E): Result<T, E> => ({ ok: false, error }),
  map: <T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    return result.ok ? Result.ok(fn(result.value)) : result;
  }
};

// 在品牌类型工厂中使用
const createUserIdResult = (value: number): Result<UserId, string> => {
  if (!Number.isInteger(value) || value <= 0) {
    return Result.err("UserId must be a positive integer");
  }
  return Result.ok(value as UserId);
};

// 使用模式
const userId = createUserIdResult(123);
if (userId.ok) {
  console.log("User ID:", userId.value);
} else {
  console.error("Error:", userId.error);
}
```

### 数据库操作中的应用

在数据库操作中使用品牌类型确保类型安全：

```typescript
// 数据库查询示例
type UserId = Brand<number, "UserId">;
type PostId = Brand<number, "PostId">;

interface DatabaseConnection {
  query<T>(sql: string, params: any[]): Promise<T[]>;
}

// 类型安全的查询构建
class UserRepository {
  constructor(private db: DatabaseConnection) {}

  async getUserById(id: UserId): Promise<User | null> {
    const results = await this.db.query<{ id: number; name: string }>(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    return results.length > 0
      ? { id: results[0].id as UserId, name: results[0].name }
      : null;
  }

  async getUserPosts(userId: UserId): Promise<Post[]> {
    const results = await this.db.query<{ id: number; title: string }>(
      "SELECT * FROM posts WHERE user_id = ?",
      [userId]
    );
    return results.map(r => ({
      id: r.id as PostId,
      title: r.title
    }));
  }
}

// 防止 ID 混淆
class PostRepository {
  constructor(private db: DatabaseConnection) {}

  async getPostById(id: PostId): Promise<Post | null> {
    // 如果误传 UserId，编译时就会报错
    // const post = await this.getPostById(userId);  // Error
  }
}
```

### API 响应处理

在 API 交互中应用品牌类型：

```typescript
// API types with brand safety
type UserId = Brand<number, "UserId">;
type ApiToken = Brand<string, "ApiToken">;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: Timestamp;
}

interface LoginRequest {
  email: Email;
  password: string;
}

interface LoginResponse {
  userId: UserId;
  token: ApiToken;
  expiresIn: number;
}

// 类型安全的 API 客户端
class ApiClient {
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify(request)
    });

    const data = await response.json();
    return {
      success: true,
      data: {
        userId: data.userId as UserId,
        token: data.token as ApiToken,
        expiresIn: data.expiresIn
      },
      timestamp: Date.now() as Timestamp
    };
  }

  // 后续 API 调用可以安全地使用 userId
  async getUser(userId: UserId): Promise<User> {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  }
}
```

### 缺少类型检查的库的包装

为不提供类型检查的库添加品牌类型包装：

```typescript
// 为第三方库的 ID 添加品牌
import { MongoClient, ObjectId } from "mongodb";

type MongoUserId = Brand<ObjectId, "MongoUserId">;
type MongoPostId = Brand<ObjectId, "MongoPostId">;

// 安全的包装层
const MongoUserIdBrand = {
  from: (oid: ObjectId): MongoUserId => oid as MongoUserId,
  to: (id: MongoUserId): ObjectId => id
};

class MongoUserRepository {
  constructor(private collection: any) {}

  async findById(userId: MongoUserId): Promise<User | null> {
    const result = await this.collection.findOne({
      _id: MongoUserIdBrand.to(userId)
    });
    return result ? this.mapToUser(result) : null;
  }

  private mapToUser(doc: any): User {
    return {
      id: MongoUserIdBrand.from(doc._id),
      name: doc.name
    };
  }
}
```

## 常见陷阱

### 过度使用品牌类型

**问题**：为每个稍微不同的值都添加品牌类型，导致代码复杂性增加。

```typescript
// 不好：过度使用
type FirstName = Brand<string, "FirstName">;
type LastName = Brand<string, "LastName">;
type MiddleName = Brand<string, "MiddleName">;
type NickName = Brand<string, "NickName">;

// 更好：在需要时才使用
type UserId = Brand<number, "UserId">;
type PostId = Brand<number, "PostId">;
type Name = string;  // 简单字符串不需要品牌
```

**解决方案**：只在需要区分相同基础类型的不同含义时使用品牌类型。

### 忘记创建验证函数

**问题**：创建品牌化值时不验证输入数据。

```typescript
// 不好：直接使用 as，无验证
const userId: UserId = userInput as UserId;  // 可能无效！

// 更好：带验证
const result = UserIdBrand.create(userInput);
if (result instanceof Error) {
  console.error("Invalid user ID:", result.message);
} else {
  // 现在可以安全使用
}
```

**解决方案**：为每个品牌类型创建对应的验证或工厂函数。

### 品牌与运行时检查不同步

**问题**：编译时认为类型安全，但运行时数据实际上无效。

```typescript
// 不好：编译时安全，运行时不安全
const userId = someUntrustedValue as UserId;
process(userId);  // 编译器认为安全，但可能有问题

// 更好：同步验证
const userId = UserIdBrand.create(someUntrustedValue);
if (userId instanceof Error) {
  // 处理错误
} else {
  process(userId);  // 真正安全
}
```

**解决方案**：始终在获取外部数据时进行验证，建立信任边界。

### 品牌信息在序列化时丢失

**问题**：JSON 序列化时，品牌信息丢失，反序列化后无法恢复类型信息。

```typescript
// 问题场景
const userId: UserId = 123 as UserId;
const json = JSON.stringify(userId);  // "123"
const restored = JSON.parse(json);     // 纯数字，失去 UserId 身份

// 解决方案：使用 reviver
const jsonWithBrand = JSON.stringify({ userId, __type: "UserId" });
const restored = JSON.parse(jsonWithBrand, (key, value) => {
  if (key === "userId" && value != null) {
    return value as UserId;  // 恢复品牌
  }
  return value;
});
```

**解决方案**：在序列化/反序列化时保存和恢复品牌信息。

### 品牌碰撞与命名冲突

**问题**：多个无关的值可能有相同的品牌标签。

```typescript
// 不好：品牌名称过于通用
type Id = Brand<number, "Id">;
// 无法区分什么类型的 Id

// 更好：使用明确的品牌名称
type UserId = Brand<number, "UserId">;
type PostId = Brand<number, "PostId">;
type CommentId = Brand<number, "CommentId">;
```

**解决方案**：使用明确、唯一的品牌标签。

## 性能考量

### 编译时性能

品牌类型对编译时性能的影响非常小，因为品牌标签只是交叉类型的一部分，不会增加复杂的类型计算。

```typescript
// 高效的品牌类型定义
type UserId = Brand<number, "UserId">;
type ProductId = Brand<number, "ProductId">;

// 即使有数百个品牌类型，编译速度也不会显著降低
```

### 运行时性能

品牌类型对运行时性能完全没有影响，因为品牌标签只存在于类型系统中，在编译后的 JavaScript 中被完全移除。

```typescript
// TypeScript
const userId: UserId = 123 as UserId;

// 编译为
const userId = 123;  // 运行时没有开销
```

### 内存使用

品牌类型不增加内存使用，因为它们不会产生运行时对象。

```typescript
// 所有这些都在运行时编译为同一个数字
const userId: UserId = 123 as UserId;
const productId: ProductId = 456 as ProductId;
const simpleNumber: number = 789;

console.log(typeof userId);      // "number"
console.log(typeof productId);   // "number"
console.log(typeof simpleNumber); // "number"
```

### 验证函数的性能优化

实现高效的验证函数：

```typescript
// 使用缓存的正则表达式
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailBrand = {
  is: (value: unknown): value is Email => {
    if (typeof value !== "string") return false;
    // 先检查长度，避免不必要的正则匹配
    if (value.length < 5 || value.length > 254) return false;
    return EMAIL_REGEX.test(value);
  }
};

// 缓存验证结果（如果频繁验证相同值）
const validationCache = new WeakMap<object, boolean>();

const expensiveValidate = (value: any): value is ExpensiveType => {
  if (validationCache.has(value)) {
    return validationCache.get(value) ?? false;
  }
  const result = complexValidation(value);
  validationCache.set(value, result);
  return result;
};
```

## 实战场景

### 用户认证系统

```typescript
// 用户认证中的品牌类型应用
type UserId = Brand<number, "UserId">;
type SessionToken = Brand<string, "SessionToken">;
type PasswordHash = Brand<string, "PasswordHash">;

interface AuthContext {
  userId: UserId;
  token: SessionToken;
  expiresAt: Date;
}

class AuthService {
  private sessions = new Map<SessionToken, AuthContext>();

  async login(email: Email, password: string): Promise<SessionToken | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    const token = this.generateSessionToken();
    this.sessions.set(token, {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    return token;
  }

  getAuthContext(token: SessionToken): AuthContext | null {
    return this.sessions.get(token) ?? null;
  }

  private generateSessionToken(): SessionToken {
    return Math.random().toString(36).substring(2) as SessionToken;
  }
}
```

### 电商订单系统

```typescript
// 电商系统中的品牌类型
type UserId = Brand<number, "UserId">;
type ProductId = Brand<number, "ProductId">;
type OrderId = Brand<number, "OrderId">;
type Money = Brand<number, "Money">;  // 以分为单位

interface OrderItem {
  productId: ProductId;
  quantity: number;
  price: Money;
}

interface Order {
  orderId: OrderId;
  userId: UserId;
  items: OrderItem[];
  totalPrice: Money;
  createdAt: Date;
}

class OrderService {
  async createOrder(userId: UserId, items: OrderItem[]): Promise<Order> {
    const orderId = this.generateOrderId();
    const totalPrice = this.calculateTotal(items);

    const order: Order = {
      orderId,
      userId,
      items,
      totalPrice,
      createdAt: new Date()
    };

    await this.saveOrder(order);
    return order;
  }

  async getOrder(orderId: OrderId): Promise<Order | null> {
    // 防止错误的 ID 类型被传入
    return this.fetchFromDatabase(orderId);
  }

  private calculateTotal(items: OrderItem[]): Money {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return total as Money;
  }
}
```

### 文件处理系统

```typescript
// 文件处理中的品牌类型
type FileId = Brand<string, "FileId">;
type FileHash = Brand<string, "FileHash">;
type FilePath = Brand<string, "FilePath">;

interface FileMetadata {
  fileId: FileId;
  originalName: string;
  hash: FileHash;
  size: number;
  uploadedAt: Date;
}

class FileService {
  private fileIndex = new Map<FileId, FileMetadata>();

  async uploadFile(file: File): Promise<FileMetadata> {
    const hash = await this.calculateFileHash(file);
    const fileId = this.generateFileId();

    const metadata: FileMetadata = {
      fileId,
      originalName: file.name,
      hash: hash as FileHash,
      size: file.size,
      uploadedAt: new Date()
    };

    this.fileIndex.set(fileId, metadata);
    await this.storeFile(fileId, file);

    return metadata;
  }

  async getFile(fileId: FileId): Promise<Blob | null> {
    const metadata = this.fileIndex.get(fileId);
    if (!metadata) return null;
    return this.retrieveFile(fileId);
  }

  async getFileByHash(hash: FileHash): Promise<FileMetadata | null> {
    for (const metadata of this.fileIndex.values()) {
      if (metadata.hash === hash) {
        return metadata;
      }
    }
    return null;
  }
}
```

### 货币和单位转换

```typescript
// 处理不同单位和货币
type USDCents = Brand<number, "USDCents">;
type EUROCents = Brand<number, "EUROCents">;
type Kilograms = Brand<number, "Kilograms">;
type Pounds = Brand<number, "Pounds">;

class CurrencyConverter {
  private exchangeRates = new Map<string, number>();

  convertUSDtoEURO(amount: USDCents): EUROCents {
    const rate = this.exchangeRates.get("USD_EUR") ?? 0.92;
    return Math.round(amount * rate) as EUROCents;
  }

  convertEUROtoUSD(amount: EUROCents): USDCents {
    const rate = this.exchangeRates.get("EUR_USD") ?? 1.09;
    return Math.round(amount * rate) as USDCents;
  }
}

class UnitConverter {
  convertKgToLbs(kg: Kilograms): Pounds {
    return (kg * 2.20462) as Pounds;
  }

  convertLbsToKg(lbs: Pounds): Kilograms {
    return (lbs / 2.20462) as Kilograms;
  }
}

// 防止混淆不同的数值类型
const price: USDCents = 1999;
const weight: Kilograms = 75;

// const mixed = price + weight;  // Error: 类型不兼容
```

## 面试要点

### 品牌类型 vs TypeScript 其他高级特性

**问题**：品牌类型与 `interface`、`type` 别名、泛型有什么区别？

**回答**：
- `interface` 和 `type` 别名定义的结构相同时会被视为兼容（结构类型）
- 品牌类型通过交叉类型添加虚拟属性来强制类型不兼容性
- 泛型用于参数化类型，品牌类型用于区分相同结构的不同语义

```typescript
// interface 和 type - 结构兼容
interface UserId { value: number; }
type ProductId = { value: number; };
const userId: UserId = { value: 1 };
const productId: ProductId = userId;  // OK

// 品牌类型 - 结构兼容但语义不同
type UserId = Brand<number, "UserId">;
type ProductId = Brand<number, "ProductId">;
const userId: UserId = 1 as UserId;
const productId: ProductId = userId;  // Error
```

### 品牌类型的运行时表现

**问题**：品牌类型在运行时有什么开销吗？

**回答**：没有。品牌类型完全存在于编译时，运行时不产生任何开销。编译后的 JavaScript 代码中不会包含任何品牌相关信息。

```typescript
// TypeScript
const id: UserId = 123 as UserId;

// 编译后的 JavaScript
const id = 123;
```

### 何时应该使用品牌类型

**问题**：什么情况下应该使用品牌类型而不是单独的类型？

**回答**：
- 需要区分相同基础类型（如多个数字 ID）
- 需要编译时类型检查来防止混淆
- 不想创建包装类（这会增加运行时开销）
- 需要简洁的类型定义

```typescript
// 适合使用品牌类型
type UserId = Brand<number, "UserId">;
type ProductId = Brand<number, "ProductId">;

// 不适合（过度使用）
type Position = Brand<number, "Position">;
type Count = Brand<number, "Count">;
const x: Position = 100;
const count: Count = 5;
// const newX = x + count;  // 类型不兼容，但这可能不是我们想要的
```

### 品牌类型与枚举的对比

**问题**：使用品牌类型还是枚举来表示固定的值集合？

**回答**：
- 枚举：当值集合是固定的、预定义的时使用
- 品牌类型：当需要区分相同类型的不同含义时使用

```typescript
// 使用枚举：角色只能是这几个值
enum UserRole {
  Admin = "admin",
  User = "user",
  Guest = "guest"
}

// 使用品牌类型：ID 可以是任何数字，但需要区分类型
type UserId = Brand<number, "UserId">;
type RoleId = Brand<number, "RoleId">;
```

### 品牌类型的通用模式

**问题**：如何实现可复用的品牌类型系统？

**回答**：创建一个统一的品牌类型工具库。

```typescript
// 通用品牌类型工具库
type Brand<T, B extends string> = T & { readonly __brand: B };

// 验证函数的通用接口
interface BrandFactory<T, B extends string> {
  create: (value: T) => Brand<T, B> | Error;
  is: (value: unknown) => value is Brand<T, B>;
  from: (value: T) => Brand<T, B>;
}

// 工厂模式实现
function createBrandFactory<T, B extends string>(
  brandName: B,
  validate: (value: T) => boolean
): BrandFactory<T, B> {
  return {
    create: (value: T) => {
      return validate(value) ? (value as Brand<T, B>) : new Error(`Invalid ${brandName}`);
    },
    is: (value: unknown): value is Brand<T, B> => {
      return value instanceof Object && validate(value);
    },
    from: (value: T) => value as Brand<T, B>
  };
}
```

## 延伸阅读

### 相关概念

1. **结构类型 vs 名义类型**：理解 TypeScript 默认采用结构类型的原因和品牌类型的补充作用
2. **类型守卫（Type Guards）**：配合品牌类型使用的重要技术
3. **交叉类型（Intersection Types）**：品牌类型的实现基础
4. **条件类型（Conditional Types）**：结合品牌类型进行高级类型操作

### 相关库和工具

1. **io-ts**：Runtime type checking，可与品牌类型结合
2. **zod**：Schema validation with TypeScript，支持品牌化类型
3. **effect**：提供了品牌类型的原生支持
4. **fp-ts**：函数式编程库，提供品牌类型工具

### 进阶话题

1. 品牌类型与 OOP 的对比
2. 分布式系统中使用品牌类型确保 ID 安全性
3. 与运行时验证库的集成
4. 品牌类型在微服务架构中的应用

### 参考资源

- TypeScript 官方手册关于类型兼容性的章节
- Egghead 课程："Typed up with TypeScript"
- TypeScript 社区讨论：Branded Types 或 Opaque Types
- GitHub：awesome-typescript 中关于品牌类型的最佳实践

## 总结

品牌类型是 TypeScript 中一个强大而优雅的模式，它在保留结构类型系统灵活性的同时，提供了名义类型的类型安全保证。通过为相同基础类型添加虚拟品牌标签，我们可以在编译时防止容易混淆的值被错误使用，从而显著提高大型应用的代码质量和可维护性。

关键要点：
- 品牌类型利用交叉类型实现名义类型语义
- 需要配套的验证函数来确保运行时安全
- 对编译时和运行时性能都没有负面影响
- 在需要区分相同类型的不同含义时非常有价值
- 应该建立统一的品牌类型定义和工厂函数模式

适当使用品牌类型可以让 TypeScript 代码更加类型安全、自文档化且易于维护。
