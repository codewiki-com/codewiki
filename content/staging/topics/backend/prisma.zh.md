---
title: Prisma ORM 完全指南
description: 掌握Prisma现代数据库工具，简化数据库操作与类型安全
track: backend
section: databases
difficulty: intermediate
tags:
  - Prisma
  - ORM
  - 数据库
  - TypeScript
status: imported
origin: old/src/content/docs/backend/prisma.zh.md
divergence: 0.195
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 20
  lastUpdated: 2026-01-07
---

## 概念解释：Prisma 是什么

Prisma 是下一代 Node.js 和 TypeScript ORM（对象关系映射），它通过声明式的数据模型、自动生成的类型安全查询构建器和强大的数据库迁移系统，彻底改变了开发者与数据库交互的方式。

### Prisma 的核心组件

Prisma 由三个主要工具组成：

1. **Prisma Client**：自动生成的类型安全数据库客户端
2. **Prisma Migrate**：声明式数据库迁移系统
3. **Prisma Studio**：可视化数据库管理界面

```
┌─────────────────────────────────────────────────────────────┐
│                     Prisma 生态系统                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Prisma Schema  │  │  Prisma Client  │  │   Prisma    │ │
│  │   数据模型定义   │→│  类型安全查询    │  │   Studio    │ │
│  │   关系配置      │  │  自动补全       │  │  可视化管理  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           ↓                   ↓                   ↓        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Prisma Migrate 数据库迁移               │   │
│  └─────────────────────────────────────────────────────────┘   │
│           ↓                   ↓                   ↓        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │     PostgreSQL │ MySQL │ SQLite │ MongoDB │ ...     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Prisma vs 传统 ORM

### 传统 ORM 的问题

传统 ORM（如 Sequelize、TypeORM）通常面临以下挑战：

| 问题 | 传统 ORM | Prisma |
|------|---------|--------|
| 类型安全 | 运行时检查，类型定义可能过时 | 编译时类型检查，自动生成类型 |
| 查询构建 | 字符串或方法链，易出错 | 类型安全的查询 API |
| 关系处理 | 复杂的 JOIN 语法 | 直观的嵌套查询 |
| 迁移管理 | 手动编写 SQL 或不可靠的自动迁移 | 声明式迁移，版本控制友好 |
| 学习曲线 | 需要理解 ORM 模式和 SQL | 直观的 API，降低心智负担 |
| N+1 问题 | 需要手动优化 | 自动批处理和优化 |

### 代码对比

```typescript
// ============ TypeORM 方式 ============
// 需要手动定义实体类和装饰器
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}

// 查询时类型可能不准确
const users = await userRepository.find({
  relations: ['posts'],
  where: { email: Like('%@prisma.io') }
});

// ============ Prisma 方式 ============
// Schema 定义（schema.prisma）
// model User {
//   id    Int     @id @default(autoincrement())
//   email String  @unique
//   posts Post[]
// }

// 完全类型安全的查询
const users = await prisma.user.findMany({
  where: { email: { endsWith: '@prisma.io' } },
  include: { posts: true }
});
// 返回类型自动推断，包含 posts 属性
```

### Prisma 的优势

1. **声明式数据建模**：使用 Prisma Schema Language (PSL) 定义模型
2. **类型安全的自动补全**：IDE 中获得完整的类型提示
3. **直观的关系查询**：无需手动编写 JOIN
4. **自动化迁移**：基于 Schema 变更自动生成迁移
5. **跨数据库支持**：PostgreSQL、MySQL、SQLite、MongoDB、SQL Server

## Schema 定义与数据建模

### 基础配置

Prisma Schema 文件（`schema.prisma`）是整个 Prisma 配置的核心：

```prisma
// schema.prisma

// 数据源配置
datasource db {
  provider = "postgresql"  // 数据库类型
  url      = env("DATABASE_URL")  // 从环境变量读取连接字符串
}

// 生成器配置
generator client {
  provider = "prisma-client-js"  // 生成 JavaScript/TypeScript 客户端
  output   = "./generated/prisma"  // 可选：自定义输出路径
}

// 数据模型定义
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])  // 创建索引
  @@map("users")    // 映射到数据库表名
}

// 枚举类型
enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### 字段类型与属性

```prisma
model Product {
  // 主键
  id          Int       @id @default(autoincrement())  // 自增主键
  uuid        String    @id @default(uuid())           // UUID 主键
  cuid        String    @id @default(cuid())           // CUID 主键

  // 基础类型
  name        String    // 字符串
  price       Float     // 浮点数
  quantity    Int       // 整数
  isActive    Boolean   @default(true)  // 布尔值
  description String?   // 可选字段（可为 null）

  // 特殊类型
  data        Json      // JSON 数据
  tags        String[]  // 数组（仅 PostgreSQL）

  // 日期时间
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?

  // 数据库特定类型
  content     String    @db.Text         // PostgreSQL TEXT
  amount      Decimal   @db.Decimal(10, 2)  // 精确小数

  @@unique([name, category])  // 复合唯一约束
  @@index([price, isActive])  // 复合索引
}
```

### 数据验证注解

Prisma 本身不提供运行时验证，但可以配合验证库使用：

```typescript
// 结合 Zod 进行验证
import { z } from 'zod';

const UserCreateSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  name: z.string().min(2, '名称至少2个字符').max(50),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
});

// 在创建用户前验证
async function createUser(data: unknown) {
  const validated = UserCreateSchema.parse(data);
  return prisma.user.create({ data: validated });
}
```

## 关系处理

Prisma 支持三种核心关系类型：一对一、一对多和多对多。

### 一对一关系 (1:1)

```prisma
model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  profile Profile?  // 可选的一对一关系
}

model Profile {
  id       Int    @id @default(autoincrement())
  bio      String
  avatar   String?
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId   Int    @unique  // 外键必须唯一
}
```

```typescript
// 创建用户和资料
const user = await prisma.user.create({
  data: {
    email: 'alice@prisma.io',
    profile: {
      create: {
        bio: '全栈开发者',
        avatar: 'https://example.com/avatar.jpg'
      }
    }
  },
  include: { profile: true }
});

// 查询用户及其资料
const userWithProfile = await prisma.user.findUnique({
  where: { email: 'alice@prisma.io' },
  include: { profile: true }
});
```

### 一对多关系 (1:N)

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]  // 一个用户有多篇文章
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int      // 外键

  @@index([authorId])  // 为外键创建索引提升查询性能
}
```

```typescript
// 创建用户并同时创建多篇文章
const userWithPosts = await prisma.user.create({
  data: {
    email: 'bob@prisma.io',
    posts: {
      create: [
        { title: 'Prisma 入门教程', content: '...' },
        { title: 'TypeScript 最佳实践', content: '...' }
      ]
    }
  },
  include: { posts: true }
});

// 查询用户的所有已发布文章
const publishedPosts = await prisma.user.findUnique({
  where: { email: 'bob@prisma.io' },
  select: {
    name: true,
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  }
});

// 为现有用户添加文章
const newPost = await prisma.post.create({
  data: {
    title: '新文章',
    author: {
      connect: { email: 'bob@prisma.io' }
    }
  }
});
```

### 多对多关系 (M:N)

Prisma 支持两种多对多关系：隐式（自动创建关联表）和显式（手动定义关联表）。

#### 隐式多对多

```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[]  // 隐式多对多
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]  // 隐式多对多
}
```

```typescript
// 创建文章并关联分类
const post = await prisma.post.create({
  data: {
    title: 'Prisma 多对多关系详解',
    categories: {
      create: [
        { name: '数据库' },
        { name: 'TypeScript' }
      ],
      connect: [
        { name: '教程' }  // 关联已存在的分类
      ]
    }
  },
  include: { categories: true }
});

// 更新文章分类
await prisma.post.update({
  where: { id: 1 },
  data: {
    categories: {
      set: [{ id: 1 }, { id: 2 }],  // 替换所有关联
      disconnect: [{ id: 3 }],       // 移除特定关联
      connect: [{ id: 4 }]           // 添加新关联
    }
  }
});
```

#### 显式多对多（带额外字段）

```prisma
model User {
  id          Int          @id @default(autoincrement())
  email       String       @unique
  enrollments Enrollment[]
}

model Course {
  id          Int          @id @default(autoincrement())
  title       String
  enrollments Enrollment[]
}

// 显式关联表，可以存储额外信息
model Enrollment {
  id         Int      @id @default(autoincrement())
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  course     Course   @relation(fields: [courseId], references: [id])
  courseId   Int
  enrolledAt DateTime @default(now())
  progress   Float    @default(0)
  grade      String?

  @@unique([userId, courseId])  // 防止重复报名
}
```

```typescript
// 用户报名课程
const enrollment = await prisma.enrollment.create({
  data: {
    user: { connect: { id: 1 } },
    course: { connect: { id: 1 } },
    progress: 0
  }
});

// 查询用户的所有课程及学习进度
const userCourses = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    enrollments: {
      include: { course: true },
      orderBy: { enrolledAt: 'desc' }
    }
  }
});

// 更新学习进度
await prisma.enrollment.update({
  where: {
    userId_courseId: { userId: 1, courseId: 1 }
  },
  data: { progress: 0.75, grade: 'A' }
});
```

### 自引用关系

```prisma
model Employee {
  id         Int        @id @default(autoincrement())
  name       String
  manager    Employee?  @relation("ManagerSubordinates", fields: [managerId], references: [id])
  managerId  Int?
  subordinates Employee[] @relation("ManagerSubordinates")
}
```

## Prisma Client CRUD 操作

### 初始化客户端

```typescript
import { PrismaClient } from '@prisma/client';

// 单例模式（推荐用于生产环境）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 优雅关闭连接
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### 创建 (Create)

```typescript
// 创建单条记录
const user = await prisma.user.create({
  data: {
    email: 'alice@prisma.io',
    name: 'Alice',
    role: 'ADMIN'
  }
});

// 创建并返回特定字段
const userEmail = await prisma.user.create({
  data: { email: 'bob@prisma.io', name: 'Bob' },
  select: { id: true, email: true }
});

// 批量创建
const { count } = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' }
  ],
  skipDuplicates: true  // 跳过重复记录
});

// 嵌套创建
const userWithPosts = await prisma.user.create({
  data: {
    email: 'writer@prisma.io',
    name: 'Writer',
    posts: {
      create: [
        { title: '第一篇文章', published: true },
        { title: '第二篇文章', published: false }
      ]
    },
    profile: {
      create: { bio: '技术写作者' }
    }
  },
  include: {
    posts: true,
    profile: true
  }
});
```

### 查询 (Read)

```typescript
// 查询单条记录
const user = await prisma.user.findUnique({
  where: { email: 'alice@prisma.io' }
});

// 查询第一条匹配记录
const firstAdmin = await prisma.user.findFirst({
  where: { role: 'ADMIN' },
  orderBy: { createdAt: 'asc' }
});

// 查询所有记录
const allUsers = await prisma.user.findMany();

// 条件查询
const filteredUsers = await prisma.user.findMany({
  where: {
    AND: [
      { email: { contains: '@prisma.io' } },
      { role: { in: ['ADMIN', 'MODERATOR'] } }
    ],
    OR: [
      { name: { startsWith: 'A' } },
      { name: { startsWith: 'B' } }
    ],
    NOT: { email: { endsWith: '@test.com' } }
  }
});

// 分页查询
const paginatedUsers = await prisma.user.findMany({
  skip: 0,    // 跳过记录数
  take: 10,   // 返回记录数
  orderBy: { createdAt: 'desc' },
  cursor: { id: 100 }  // 游标分页
});

// 聚合查询
const stats = await prisma.user.aggregate({
  _count: { _all: true },
  _avg: { age: true },
  _max: { createdAt: true },
  _min: { createdAt: true }
});

// 分组查询
const usersByRole = await prisma.user.groupBy({
  by: ['role'],
  _count: { _all: true },
  having: {
    role: { _count: { gt: 5 } }
  }
});

// 关系过滤
const usersWithPublishedPosts = await prisma.user.findMany({
  where: {
    posts: {
      some: { published: true }  // 至少有一篇已发布文章
    }
  },
  include: {
    posts: {
      where: { published: true }
    }
  }
});
```

### 更新 (Update)

```typescript
// 更新单条记录
const updatedUser = await prisma.user.update({
  where: { email: 'alice@prisma.io' },
  data: {
    name: 'Alice Updated',
    role: 'MODERATOR'
  }
});

// 批量更新
const { count } = await prisma.user.updateMany({
  where: { role: 'USER' },
  data: { verified: true }
});

// 更新或创建（Upsert）
const user = await prisma.user.upsert({
  where: { email: 'test@prisma.io' },
  update: { name: 'Updated Name' },
  create: { email: 'test@prisma.io', name: 'New User' }
});

// 数字字段操作
const incrementedPost = await prisma.post.update({
  where: { id: 1 },
  data: {
    viewCount: { increment: 1 },
    likes: { multiply: 2 },
    dislikes: { decrement: 1 }
  }
});

// 嵌套更新
const userWithUpdatedPosts = await prisma.user.update({
  where: { id: 1 },
  data: {
    posts: {
      updateMany: {
        where: { published: false },
        data: { published: true }
      },
      create: { title: '新文章' },
      delete: { id: 5 }
    }
  }
});
```

### 删除 (Delete)

```typescript
// 删除单条记录
const deletedUser = await prisma.user.delete({
  where: { email: 'alice@prisma.io' }
});

// 批量删除
const { count } = await prisma.user.deleteMany({
  where: {
    createdAt: { lt: new Date('2023-01-01') },
    posts: { none: {} }  // 没有任何文章的用户
  }
});

// 级联删除（需要在 Schema 中配置 onDelete: Cascade）
// 或使用事务手动处理
await prisma.$transaction([
  prisma.post.deleteMany({ where: { authorId: 1 } }),
  prisma.profile.delete({ where: { userId: 1 } }),
  prisma.user.delete({ where: { id: 1 } })
]);
```

## 事务处理

Prisma 提供多种事务处理方式，确保数据一致性。

### 嵌套写入（隐式事务）

```typescript
// 嵌套写入自动包装在事务中
const result = await prisma.user.create({
  data: {
    email: 'alice@prisma.io',
    posts: {
      create: [
        { title: '文章一' },
        { title: '文章二' }
      ]
    }
  }
});
// 如果任何操作失败，所有更改都会回滚
```

### 批量事务（$transaction 数组）

```typescript
// 顺序执行多个操作
const [user, post, profile] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'bob@prisma.io', name: 'Bob' } }),
  prisma.post.create({ data: { title: '新文章', authorId: 1 } }),
  prisma.profile.create({ data: { bio: '开发者', userId: 1 } })
]);

// 所有操作成功或全部回滚
```

### 交互式事务

```typescript
// 交互式事务支持条件逻辑
const transfer = await prisma.$transaction(async (tx) => {
  // 1. 检查发送方余额
  const sender = await tx.account.findUnique({
    where: { id: senderId }
  });

  if (!sender || sender.balance < amount) {
    throw new Error('余额不足');
  }

  // 2. 扣减发送方余额
  const updatedSender = await tx.account.update({
    where: { id: senderId },
    data: { balance: { decrement: amount } }
  });

  // 3. 增加接收方余额
  const updatedReceiver = await tx.account.update({
    where: { id: receiverId },
    data: { balance: { increment: amount } }
  });

  // 4. 记录交易
  const transaction = await tx.transaction.create({
    data: {
      fromId: senderId,
      toId: receiverId,
      amount,
      type: 'TRANSFER'
    }
  });

  return { sender: updatedSender, receiver: updatedReceiver, transaction };
}, {
  maxWait: 5000,    // 等待事务开始的最大时间
  timeout: 10000,   // 事务执行的最大时间
  isolationLevel: 'Serializable'  // 隔离级别
});
```

### 事务隔离级别

```typescript
await prisma.$transaction(
  async (tx) => {
    // 事务操作
  },
  {
    isolationLevel: 'ReadCommitted'  // 可选值：
    // ReadUncommitted - 读未提交
    // ReadCommitted   - 读已提交（默认）
    // RepeatableRead  - 可重复读
    // Serializable    - 串行化
  }
);
```

## 数据库迁移

### 开发环境迁移

```bash
# 创建并应用迁移
npx prisma migrate dev --name init

# 创建迁移但不应用
npx prisma migrate dev --create-only

# 重置数据库（危险操作）
npx prisma migrate reset

# 查看迁移状态
npx prisma migrate status
```

### 生产环境迁移

```bash
# 应用所有待处理的迁移
npx prisma migrate deploy

# 在 CI/CD 中使用
DATABASE_URL=$PRODUCTION_DB_URL npx prisma migrate deploy
```

### 迁移最佳实践

```
migrations/
├── 20240101000000_init/
│   └── migration.sql
├── 20240115000000_add_user_role/
│   └── migration.sql
└── 20240120000000_create_posts_table/
    └── migration.sql
```

```typescript
// package.json 脚本配置
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

### 数据库种子

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清理现有数据
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // 创建测试用户
  const alice = await prisma.user.create({
    data: {
      email: 'alice@prisma.io',
      name: 'Alice',
      role: 'ADMIN',
      posts: {
        create: [
          { title: 'Prisma 入门', published: true },
          { title: '高级 Prisma 技巧', published: false }
        ]
      }
    }
  });

  console.log({ alice });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

## 查询优化

### 选择性查询（Select）

```typescript
// 只返回需要的字段，减少数据传输
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    _count: {
      select: { posts: true }
    }
  }
});
```

### 避免 N+1 问题

```typescript
// 错误做法：N+1 查询
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id }
  });
  // 每个用户都会执行一次查询
}

// 正确做法：使用 include
const usersWithPosts = await prisma.user.findMany({
  include: { posts: true }
});

// 或使用批量查询
const users = await prisma.user.findMany();
const userIds = users.map(u => u.id);
const posts = await prisma.post.findMany({
  where: { authorId: { in: userIds } }
});
```

### 索引优化

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  createdAt DateTime @default(now())

  author    User     @relation(fields: [authorId], references: [id])

  // 为常用查询字段创建索引
  @@index([authorId])
  @@index([published, createdAt])
  @@index([title])  // 如果经常按标题搜索
}
```

### 查询日志与分析

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' }
  ]
});

// 监听查询事件
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

// 使用 $queryRaw 执行原生 SQL（需要时）
const result = await prisma.$queryRaw`
  SELECT * FROM "User"
  WHERE email LIKE ${`%@prisma.io`}
`;
```

### 连接池配置

```
# 环境变量配置连接池
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?connection_limit=10&pool_timeout=20"
```

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
```

## 与框架集成

### Next.js 集成

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : []
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

```typescript
// app/api/users/route.ts (App Router)
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const data = await request.json();
  const user = await prisma.user.create({ data });
  return NextResponse.json(user, { status: 201 });
}
```

```typescript
// app/users/page.tsx (Server Component)
import { prisma } from '@/lib/prisma';

export default async function UsersPage() {
  const users = await prisma.user.findMany();

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### NestJS 集成

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // 全局模块，无需在每个模块中导入
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
```

```typescript
// user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({ where, data });
  }

  async delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({ where });
  }
}
```

```typescript
// user/user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.userService.findMany({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(parseInt(id));
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update({
      where: { id: parseInt(id) },
      data: updateUserDto
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete({ id: parseInt(id) });
  }
}
```

## 测试策略

### 单元测试（Mock Prisma Client）

```typescript
// __mocks__/prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

export default prismaMock;
```

```typescript
// user.service.spec.ts
import { Test } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock } from '../__mocks__/prisma';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock }
      ]
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const expectedUser = {
        id: 1,
        email: 'test@prisma.io',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.findOne(1);

      expect(result).toEqual(expectedUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return null if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = { email: 'new@prisma.io', name: 'New User' };
      const expectedUser = { id: 1, ...userData, role: 'USER', createdAt: new Date(), updatedAt: new Date() };

      prismaMock.user.create.mockResolvedValue(expectedUser);

      const result = await service.create(userData);

      expect(result).toEqual(expectedUser);
    });
  });
});
```

### 集成测试（使用测试数据库）

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // 使用测试数据库
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

  // 重置数据库并应用迁移（通过 npm script 执行）
  // npm run db:migrate:reset --force
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // 清理所有表数据
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }
});

export { prisma };
```

```typescript
// user.integration.spec.ts
import { prisma } from './setup';

describe('User Integration Tests', () => {
  it('should create and retrieve a user with posts', async () => {
    // 创建用户和文章
    const user = await prisma.user.create({
      data: {
        email: 'integration@test.com',
        name: 'Integration Test',
        posts: {
          create: [
            { title: 'Test Post 1', published: true },
            { title: 'Test Post 2', published: false }
          ]
        }
      },
      include: { posts: true }
    });

    expect(user.posts).toHaveLength(2);
    expect(user.email).toBe('integration@test.com');

    // 验证查询
    const foundUser = await prisma.user.findUnique({
      where: { email: 'integration@test.com' },
      include: { posts: { where: { published: true } } }
    });

    expect(foundUser?.posts).toHaveLength(1);
  });
});
```

### E2E 测试

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /users', () => {
    it('should create a user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'e2e@test.com', name: 'E2E Test' })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe('e2e@test.com');
          expect(res.body.id).toBeDefined();
        });
    });
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      await prisma.user.createMany({
        data: [
          { email: 'user1@test.com', name: 'User 1' },
          { email: 'user2@test.com', name: 'User 2' }
        ]
      });

      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
        });
    });
  });
});
```

## 面试要点

### 常见面试问题

#### Prisma 与传统 ORM 的核心区别是什么？

**答案要点**：
- Prisma 使用声明式 Schema 而非代码优先的实体类
- 自动生成类型安全的客户端，提供编译时类型检查
- 查询 API 设计更直观，降低学习曲线
- 内置数据库迁移工具，与版本控制友好集成
- 虚拟关系字段简化了关联数据的查询

#### 如何处理 Prisma 中的 N+1 查询问题？

**答案要点**：
```typescript
// 使用 include 预加载关联数据
const users = await prisma.user.findMany({
  include: { posts: true }
});

// 或使用 select 精确控制返回字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    posts: { select: { title: true } }
  }
});
```

#### Prisma 支持哪些事务类型？各自的适用场景是什么？

**答案要点**：
- **嵌套写入**：适用于创建/更新关联数据的简单场景
- **批量事务 ($transaction 数组)**：适用于多个独立操作需要原子执行
- **交互式事务**：适用于需要条件逻辑、错误处理的复杂业务场景

#### 如何在生产环境优化 Prisma 性能？

**答案要点**：
- 使用 `select` 只查询必要字段
- 合理配置数据库连接池
- 为频繁查询的字段创建索引
- 使用 `findMany` 配合分页代替一次性加载
- 启用查询日志分析慢查询
- 考虑使用 Prisma Accelerate 进行连接池管理和边缘缓存

#### Prisma Migrate 在开发和生产环境的使用有何不同？

**答案要点**：
- **开发环境**：使用 `prisma migrate dev`，可以重置数据库，交互式创建迁移
- **生产环境**：使用 `prisma migrate deploy`，只应用待处理的迁移，不会重置数据
- 迁移文件应该提交到版本控制
- 生产环境迁移应在 CI/CD 流程中自动执行

#### 如何测试使用 Prisma 的代码？

**答案要点**：
- **单元测试**：使用 jest-mock-extended 模拟 Prisma Client
- **集成测试**：使用独立的测试数据库，每次测试前重置数据
- **E2E 测试**：完整启动应用，测试 API 端点
- 使用 `beforeEach` 钩子清理测试数据，确保测试隔离

### 实战代码题

**题目**：设计一个博客系统的数据模型，包含用户、文章、评论和标签，并实现以下功能：

1. 获取某用户的所有已发布文章及其评论数
2. 创建文章时自动关联已有标签或创建新标签
3. 实现文章软删除功能

```prisma
// schema.prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime  @default(now())
}

model Post {
  id          Int       @id @default(autoincrement())
  title       String
  content     String?
  published   Boolean   @default(false)
  deletedAt   DateTime? // 软删除标记
  author      User      @relation(fields: [authorId], references: [id])
  authorId    Int
  comments    Comment[]
  tags        Tag[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
  @@index([published, deletedAt])
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    Int
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())

  @@index([postId])
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

```typescript
// 实现功能
class BlogService {
  constructor(private prisma: PrismaClient) {}

  // 1. 获取用户已发布文章及评论数
  async getUserPublishedPosts(userId: number) {
    return this.prisma.post.findMany({
      where: {
        authorId: userId,
        published: true,
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { comments: true } },
        tags: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 2. 创建文章并处理标签
  async createPost(data: {
    title: string;
    content: string;
    authorId: number;
    tags: string[];
  }) {
    return this.prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        author: { connect: { id: data.authorId } },
        tags: {
          connectOrCreate: data.tags.map(tag => ({
            where: { name: tag },
            create: { name: tag }
          }))
        }
      },
      include: { tags: true }
    });
  }

  // 3. 软删除文章
  async softDeletePost(postId: number) {
    return this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() }
    });
  }

  // 恢复已删除文章
  async restorePost(postId: number) {
    return this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: null }
    });
  }
}
```

## 总结

Prisma 作为现代 ORM 解决方案，通过声明式数据建模、类型安全的查询 API 和强大的迁移系统，极大地提升了数据库开发体验。掌握 Prisma 的核心概念和最佳实践，将帮助你构建更可靠、更易维护的数据库应用。

核心要点回顾：

1. **Schema 优先**：所有数据模型定义在 `schema.prisma` 文件中
2. **类型安全**：自动生成的客户端提供完整的类型支持
3. **关系简化**：使用 `include` 和 `select` 轻松处理关联数据
4. **事务支持**：嵌套写入、批量事务和交互式事务满足不同场景
5. **迁移管理**：`prisma migrate` 命令管理数据库 Schema 变更
6. **框架友好**：与 Next.js、NestJS 等框架无缝集成

持续关注 Prisma 的更新，如 Prisma Accelerate（全球边缘缓存）和 Prisma Pulse（实时数据同步），将帮助你构建更高性能的现代应用。
