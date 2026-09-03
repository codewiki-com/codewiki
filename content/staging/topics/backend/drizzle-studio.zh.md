---
title: Drizzle Studio 数据库管理
description: Drizzle ORM 和 Drizzle Studio 完全指南 - 现代化 TypeScript ORM 与可视化数据库管理工具
track: backend
section: databases
difficulty: intermediate
tags:
  - Drizzle
  - ORM
  - TypeScript
  - Database
  - SQL
  - Drizzle Studio
status: imported
origin: old/src/content/docs/backend/drizzle-studio.zh.md
divergence: 0.211
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 34
  lastUpdated: 2026-01-20
---

Drizzle Studio 是一个强大的可视化数据库管理工具，与 Drizzle ORM 无缝集成，为开发者提供直观的界面来探索、管理和操作数据库数据。结合 Drizzle ORM 的类型安全、类 SQL API，它为现代数据库开发工作流程创建了完整的解决方案。

## 理解 Drizzle 生态系统

### 什么是 Drizzle ORM

Drizzle ORM 是一个现代、轻量级的 TypeScript ORM，它拥抱 SQL 而不是将其抽象化。与传统 ORM 将 SQL 复杂性隐藏在自定义查询语言之后不同，Drizzle 提供了一个镜像 SQL 语法的类型安全 API，使熟悉 SQL 的开发者感到熟悉。

**核心理念：**

- **类 SQL 语法**：查询 API 与实际 SQL 语句非常相似
- **零抽象**：没有隐藏的查询或魔法 - 你能看到确切运行的内容
- **TypeScript 优先**：无需代码生成的完整类型推断
- **轻量级**：压缩后约 7.4KB，零依赖
- **Serverless 就绪**：为边缘计算和 serverless 环境优化

### 什么是 Drizzle Studio

Drizzle Studio 是一个可视化数据库浏览器和管理工具，它读取你的 Drizzle 配置和 schema 来提供基于 Web 的界面，用于：

- 浏览和搜索数据库表
- 添加、编辑和删除记录
- 探索表关系
- 运行即席查询
- 在开发过程中管理数据

```bash
# 启动 Drizzle Studio
npx drizzle-kit studio
```

运行此命令时，Drizzle Studio 会启动本地服务器（默认：`127.0.0.1:4983`）并在 `local.drizzle.studio` 打开浏览器界面。

### 与其他 ORM 的比较

| 特性 | Drizzle | Prisma | TypeORM |
|------|---------|--------|---------|
| 查询语法 | 类 SQL | 自定义 DSL | 基于装饰器 |
| 包大小 | ~7.4KB | ~2MB+ | ~500KB+ |
| 类型安全 | 完全推断 | 需要代码生成 | 部分 |
| 学习曲线 | 低（需要 SQL 知识） | 中等 | 较高 |
| 可视化工具 | Drizzle Studio | Prisma Studio | 无内置 |
| 代码生成 | 不需要 | 必需 | 可选 |
| Serverless | 优化 | 需要适配器 | 不太理想 |
| 原生 SQL | 原生支持 | 逃生舱口 | 支持 |

### 何时选择 Drizzle

Drizzle 适用于以下情况：

1. **偏好 SQL 语义** - 你希望查询看起来和感觉像 SQL
2. **需要最小包大小** - 对 serverless/边缘部署至关重要
3. **想要无代码生成的类型安全** - 无需为类型生成构建步骤
4. **使用现有数据库** - 易于内省和采用现有 schema
5. **需要细粒度控制** - 完全控制生成的查询

## 核心原理

### 类 SQL 类型安全 API

Drizzle 的查询构建器镜像 SQL 语法，同时提供完整的 TypeScript 类型推断：

```typescript
// Drizzle 查询 - 看起来像 SQL
const users = await db
  .select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
  })
  .from(usersTable)
  .where(eq(usersTable.isActive, true))
  .orderBy(desc(usersTable.createdAt))
  .limit(10);

// 等效 SQL：
// SELECT id, name, email FROM users
// WHERE is_active = true
// ORDER BY created_at DESC
// LIMIT 10
```

### 零抽象理念

与生成不可预测查询的 ORM 不同，Drizzle 给你完全的可见性：

```typescript
// 你写的内容
const result = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))
  .where(gt(posts.views, 1000));

// 运行的内容 - 正是你期望的
// SELECT * FROM users
// LEFT JOIN posts ON users.id = posts.author_id
// WHERE posts.views > 1000
```

### 迁移系统架构

Drizzle Kit 提供了两种方式的健壮迁移系统：

**1. 生成和迁移（生产环境）**
```bash
# 从 schema 变更生成 SQL 迁移文件
npx drizzle-kit generate

# 将迁移应用到数据库
npx drizzle-kit migrate
```

**2. 推送（开发环境）**
```bash
# 直接将 schema 变更推送到数据库
npx drizzle-kit push
```

生成方式创建版本化的 SQL 文件，可以在各个环境中审查、版本控制和一致应用。

## 核心要点

### Schema 定义

Drizzle schema 在 TypeScript 中定义，提供即时类型推断：

```typescript
// schema.ts
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  decimal,
  jsonb,
  uuid
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'user', 'guest'] }).default('user'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// 带外键的文章表
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content'),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  published: boolean('published').default(false),
  views: integer('views').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 评论表
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// 类型推断 - 无需代码生成！
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

### 定义关系

Drizzle 中的关系与表 schema 分开定义，启用关系查询 API：

```typescript
// relations.ts
import { relations } from 'drizzle-orm';
import { users, posts, comments } from './schema';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));
```

### 查询构建

Drizzle 提供两种查询 API：类 SQL 和关系型。

**类 SQL API：**
```typescript
import { eq, and, or, gt, lt, like, inArray, isNull, desc, asc } from 'drizzle-orm';

// 复杂 WHERE 条件
const results = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.isActive, true),
      or(
        like(users.email, '%@company.com'),
        gt(users.createdAt, new Date('2024-01-01'))
      )
    )
  )
  .orderBy(desc(users.createdAt), asc(users.name))
  .limit(20)
  .offset(0);
```

**关系查询 API：**
```typescript
// 获取带嵌套关系的用户
const usersWithPosts = await db.query.users.findMany({
  where: eq(users.isActive, true),
  columns: {
    id: true,
    name: true,
    email: true,
  },
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: [desc(posts.createdAt)],
      limit: 5,
      with: {
        comments: {
          limit: 3,
        },
      },
    },
  },
});
```

### Drizzle Studio 功能

Drizzle Studio 提供全面的可视化界面：

**数据浏览：**
- 查看 schema 中的所有表
- 带分页浏览记录
- 搜索和过滤数据
- 查看表之间的关系

**数据操作：**
- 添加带表单验证的新记录
- 内联编辑现有记录
- 带确认的删除记录
- 正确处理 NULL 与空字符串值

**支持的数据类型：**
- 字符串、数字、布尔值
- JSON 对象和数组
- 日期和时间戳
- UUID 和大整数
- 数组（PostgreSQL）

**配置：**
```bash
# 使用默认设置启动
npx drizzle-kit studio

# 自定义端口
npx drizzle-kit studio --port 3000

# 自定义主机（用于 Docker/远程访问）
npx drizzle-kit studio --host 0.0.0.0

# 详细日志
npx drizzle-kit studio --verbose
```

## 代码示例

### 项目设置

**1. 安装：**
```bash
# 核心包
npm install drizzle-orm
npm install -D drizzle-kit

# 数据库驱动（选择一个）
npm install pg                    # PostgreSQL
npm install mysql2                # MySQL
npm install @libsql/client        # SQLite/Turso
npm install @neondatabase/serverless  # Neon
```

**2. 配置（drizzle.config.ts）：**
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

**3. 数据库连接：**
```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
```

### 完整 CRUD 操作

```typescript
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { db } from './db';
import { users, posts, comments } from './db/schema';

// ============ 创建 ============

// 插入单条记录
async function createUser(data: NewUser) {
  const [user] = await db
    .insert(users)
    .values(data)
    .returning();
  return user;
}

// 插入多条记录
async function createUsers(data: NewUser[]) {
  return db.insert(users).values(data).returning();
}

// Upsert（冲突时插入或更新）
async function upsertUser(data: NewUser) {
  const [user] = await db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: data.name,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

// ============ 读取 ============

// 按 ID 查找
async function getUserById(id: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));
  return user;
}

// 带条件查找
async function getActiveUsers() {
  return db
    .select()
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(desc(users.createdAt));
}

// 带分页查找
async function getUsersPaginated(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(users),
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total: totalResult[0].count,
      totalPages: Math.ceil(totalResult[0].count / pageSize),
    },
  };
}

// 带关系查找
async function getUserWithPosts(userId: number) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      posts: {
        where: eq(posts.published, true),
        orderBy: [desc(posts.createdAt)],
        with: {
          comments: true,
        },
      },
    },
  });
}

// ============ 更新 ============

// 按 ID 更新
async function updateUser(id: number, data: Partial<NewUser>) {
  const [user] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
  return user;
}

// 更新多条记录
async function deactivateInactiveUsers(daysSinceLogin: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLogin);

  return db
    .update(users)
    .set({ isActive: false })
    .where(
      and(
        eq(users.isActive, true),
        sql`${users.updatedAt} < ${cutoffDate}`
      )
    )
    .returning();
}

// ============ 删除 ============

// 按 ID 删除
async function deleteUser(id: number) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  return deleted;
}

// 软删除模式
async function softDeleteUser(id: number) {
  return db
    .update(users)
    .set({
      isActive: false,
      deletedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
}
```

### 复杂查询

```typescript
import { eq, and, or, gt, lt, like, sql, desc, asc, count, sum, avg } from 'drizzle-orm';

// 聚合
async function getPostStats() {
  return db
    .select({
      totalPosts: count(),
      totalViews: sum(posts.views),
      avgViews: avg(posts.views),
      publishedCount: count(sql`CASE WHEN ${posts.published} THEN 1 END`),
    })
    .from(posts);
}

// 带 having 的分组
async function getTopAuthors(minPosts: number) {
  return db
    .select({
      authorId: posts.authorId,
      authorName: users.name,
      postCount: count(),
      totalViews: sum(posts.views),
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .groupBy(posts.authorId, users.name)
    .having(sql`count(*) >= ${minPosts}`)
    .orderBy(desc(sql`count(*)`));
}

// 子查询
async function getUsersAboveAverageActivity() {
  const avgPostsSubquery = db
    .select({
      avg: sql<number>`avg(post_count)`.as('avg'),
    })
    .from(
      db
        .select({
          authorId: posts.authorId,
          postCount: count().as('post_count'),
        })
        .from(posts)
        .groupBy(posts.authorId)
        .as('author_posts')
    )
    .as('avg_subquery');

  return db
    .select({
      userId: users.id,
      name: users.name,
      postCount: count(posts.id),
    })
    .from(users)
    .leftJoin(posts, eq(users.id, posts.authorId))
    .groupBy(users.id, users.name)
    .having(sql`count(${posts.id}) > (SELECT avg FROM ${avgPostsSubquery})`);
}

// 全文搜索（PostgreSQL）
async function searchPosts(query: string) {
  return db
    .select()
    .from(posts)
    .where(
      sql`to_tsvector('english', ${posts.title} || ' ' || ${posts.content})
          @@ plainto_tsquery('english', ${query})`
    )
    .orderBy(
      sql`ts_rank(
        to_tsvector('english', ${posts.title} || ' ' || ${posts.content}),
        plainto_tsquery('english', ${query})
      ) DESC`
    );
}

// JSON 操作（PostgreSQL）
async function getUsersByPreference(theme: string) {
  return db
    .select()
    .from(users)
    .where(sql`${users.metadata}->>'theme' = ${theme}`);
}
```

### 事务

```typescript
// 基本事务
async function createPostWithTags(
  postData: NewPost,
  tagIds: number[]
) {
  return db.transaction(async (tx) => {
    // 创建文章
    const [post] = await tx
      .insert(posts)
      .values(postData)
      .returning();

    // 创建文章-标签关联
    if (tagIds.length > 0) {
      await tx.insert(postTags).values(
        tagIds.map((tagId) => ({
          postId: post.id,
          tagId,
        }))
      );
    }

    return post;
  });
}

// 带错误回滚的事务
async function transferCredits(
  fromUserId: number,
  toUserId: number,
  amount: number
) {
  return db.transaction(async (tx) => {
    // 检查发送者余额
    const [sender] = await tx
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, fromUserId));

    if (!sender || sender.credits < amount) {
      throw new Error('余额不足');
    }

    // 从发送者扣除
    await tx
      .update(users)
      .set({ credits: sql`${users.credits} - ${amount}` })
      .where(eq(users.id, fromUserId));

    // 添加到接收者
    await tx
      .update(users)
      .set({ credits: sql`${users.credits} + ${amount}` })
      .where(eq(users.id, toUserId));

    // 记录交易
    await tx.insert(creditTransactions).values({
      fromUserId,
      toUserId,
      amount,
      createdAt: new Date(),
    });

    return { success: true };
  });
}

// 带保存点的嵌套事务
async function complexOperation() {
  return db.transaction(async (tx) => {
    await tx.insert(users).values({ name: '用户1', email: 'user1@test.com' });

    try {
      // 嵌套事务 - 创建保存点
      await tx.transaction(async (tx2) => {
        await tx2.insert(users).values({ name: '用户2', email: 'user2@test.com' });
        throw new Error('模拟失败');
      });
    } catch (error) {
      // 内部事务回滚到保存点
      // 外部事务继续
      console.log('内部操作失败，继续...');
    }

    await tx.insert(users).values({ name: '用户3', email: 'user3@test.com' });
    // 用户1 和用户3 将被提交，用户2 不会
  });
}
```

### 框架集成

**Next.js App Router：**
```typescript
// app/api/users/route.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const allUsers = await db.select().from(users);
  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const body = await request.json();

  const [newUser] = await db
    .insert(users)
    .values(body)
    .returning();

  return NextResponse.json(newUser, { status: 201 });
}

// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(params.id)));

  if (!user) {
    return NextResponse.json({ error: '未找到' }, { status: 404 });
  }

  return NextResponse.json(user);
}
```

**Express.js：**
```typescript
import express from 'express';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const app = express();
app.use(express.json());

app.get('/users', async (req, res) => {
  const allUsers = await db.select().from(users);
  res.json(allUsers);
});

app.post('/users', async (req, res) => {
  try {
    const [newUser] = await db
      .insert(users)
      .values(req.body)
      .returning();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: '无效数据' });
  }
});

app.get('/users/:id', async (req, res) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(req.params.id)));

  if (!user) {
    return res.status(404).json({ error: '未找到' });
  }

  res.json(user);
});
```

## 最佳实践

### Schema 设计

```typescript
// 1. 使用有意义的表和列名
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  // 数据库列使用 snake_case，TypeScript 中使用 camelCase
});

// 2. 添加适当的索引
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull(),
  authorId: integer('author_id').notNull(),
  categoryId: integer('category_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  // 单列索引
  index('posts_slug_idx').on(table.slug),
  index('posts_author_idx').on(table.authorId),
  // 常见查询的复合索引
  index('posts_category_created_idx').on(table.categoryId, table.createdAt),
  // 唯一约束
  uniqueIndex('posts_slug_unique').on(table.slug),
]);

// 3. 使用适当的列类型
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // 金额使用 decimal，而非 float
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  // 无界字符串使用 text
  description: text('description'),
  // 结构化数据使用 jsonb（PostgreSQL）
  attributes: jsonb('attributes').$type<ProductAttributes>(),
  // 适当时使用数组类型（PostgreSQL）
  tags: text('tags').array(),
});

// 4. 按领域组织 schema
// db/schema/users.ts
// db/schema/posts.ts
// db/schema/products.ts
// db/schema/index.ts - 导出所有
```

### 类型安全模式

```typescript
// 1. 从 schema 推断类型
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<NewUser>;

// 2. 为 ID 创建品牌类型
type UserId = number & { __brand: 'UserId' };
type PostId = string & { __brand: 'PostId' }; // UUID

// 3. 类型安全的仓库模式
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  update(id: UserId, data: UpdateUser): Promise<User | null>;
  delete(id: UserId): Promise<boolean>;
}

// 4. 类型安全的查询构建器
function buildUserQuery(filters: {
  isActive?: boolean;
  role?: User['role'];
  search?: string;
}) {
  const conditions = [];

  if (filters.isActive !== undefined) {
    conditions.push(eq(users.isActive, filters.isActive));
  }

  if (filters.role) {
    conditions.push(eq(users.role, filters.role));
  }

  if (filters.search) {
    conditions.push(
      or(
        like(users.name, `%${filters.search}%`),
        like(users.email, `%${filters.search}%`)
      )
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
```

### 性能优化

```typescript
// 1. 只选择需要的列
const userNames = await db
  .select({
    id: users.id,
    name: users.name,
  })
  .from(users);
// 而非：db.select().from(users)

// 2. 对重复查询使用预处理语句
const getUserByEmail = db
  .select()
  .from(users)
  .where(eq(users.email, sql.placeholder('email')))
  .prepare('get_user_by_email');

// 高效多次执行
const user1 = await getUserByEmail.execute({ email: 'user1@test.com' });
const user2 = await getUserByEmail.execute({ email: 'user2@test.com' });

// 3. 批量插入
await db.insert(users).values([
  { name: '用户1', email: 'user1@test.com' },
  { name: '用户2', email: 'user2@test.com' },
  { name: '用户3', email: 'user3@test.com' },
  // ... 更多
]);

// 4. 对多个操作使用事务
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: '用户', email: 'user@test.com' });
  await tx.insert(profiles).values({ userId: 1, bio: '你好' });
});

// 5. 正确配置连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // 最大连接数
  idleTimeoutMillis: 30000,   // 30 秒后关闭空闲连接
  connectionTimeoutMillis: 2000, // 新连接超时
});
```

## 常见陷阱

### 迁移冲突

```typescript
// 问题：重命名列生成 DROP + ADD，丢失数据
// 之前：name: text('name')
// 之后：fullName: text('full_name')

// 解决方案：使用自定义迁移
// 1. 生成迁移
// npx drizzle-kit generate

// 2. 编辑生成的 SQL 文件
// 更改：
//   ALTER TABLE users DROP COLUMN name;
//   ALTER TABLE users ADD COLUMN full_name TEXT;
// 为：
//   ALTER TABLE users RENAME COLUMN name TO full_name;

// 预防：开发使用 drizzle-kit push，生产使用 generate
```

### 关系定义错误

```typescript
// 问题：缺少关系定义
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id').references(() => users.id),
});

// 这适用于 SQL 连接，但不适用于关系查询
const result = await db.query.posts.findMany({
  with: { author: true }, // 错误：未定义 author 关系
});

// 解决方案：始终为关系查询定义关系
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### 类型推断问题

```typescript
// 问题：原生 SQL 的类型推断不正确
const result = await db
  .select({
    count: sql`count(*)`, // 类型：unknown
  })
  .from(users);

// 解决方案：显式指定 SQL 表达式的类型
const result = await db
  .select({
    count: sql<number>`count(*)::int`,
    name: sql<string>`upper(${users.name})`,
  })
  .from(users);

// 问题：动态查询丢失类型
function getUsers(columns: string[]) {
  return db.select(/* 什么列？ */).from(users);
}

// 解决方案：使用类型安全的列选择
function getUsers<T extends (keyof User)[]>(columns: T) {
  const selection = columns.reduce((acc, col) => {
    acc[col] = users[col];
    return acc;
  }, {} as Record<T[number], any>);

  return db.select(selection).from(users);
}
```

### N+1 查询问题

```typescript
// 问题：N+1 查询
const allUsers = await db.select().from(users);
for (const user of allUsers) {
  // 每个用户单独查询！
  const userPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, user.id));
}

// 解决方案 1：使用关系查询
const usersWithPosts = await db.query.users.findMany({
  with: { posts: true },
});

// 解决方案 2：使用 JOIN
const usersWithPosts = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));

// 解决方案 3：批量获取
const allUsers = await db.select().from(users);
const userIds = allUsers.map(u => u.id);
const allPosts = await db
  .select()
  .from(posts)
  .where(inArray(posts.authorId, userIds));

// 客户端按作者分组文章
const postsByAuthor = allPosts.reduce((acc, post) => {
  (acc[post.authorId] ??= []).push(post);
  return acc;
}, {} as Record<number, Post[]>);
```

## 性能考量

### 查询优化

```typescript
// 1. 使用 EXPLAIN 分析查询
const explained = await db.execute(
  sql`EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@test.com'`
);

// 2. 索引频繁查询的列
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  status: text('status'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_status_idx').on(table.status),
  index('users_created_at_idx').on(table.createdAt),
]);

// 3. 对常见查询使用覆盖索引
// index('users_status_created_idx')
//   .on(table.status, table.createdAt)
//   .include(table.name, table.email);

// 4. 生产环境避免 SELECT *
// 差
await db.select().from(users);

// 好
await db.select({
  id: users.id,
  name: users.name,
  email: users.email,
}).from(users);
```

### 连接池

```typescript
// 使用 node-postgres 的 PostgreSQL
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 生产设置
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500, // N 次使用后关闭连接
});

// 监控连接池健康
pool.on('error', (err) => {
  console.error('意外的连接池错误', err);
});

pool.on('connect', () => {
  console.log('新客户端已连接');
});

export const db = drizzle(pool, { schema });

// 优雅关闭
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
```

### 批量操作

```typescript
// 高效批量插入
async function bulkInsertUsers(userData: NewUser[]) {
  const BATCH_SIZE = 1000;
  const results = [];

  for (let i = 0; i < userData.length; i += BATCH_SIZE) {
    const batch = userData.slice(i, i + BATCH_SIZE);
    const inserted = await db
      .insert(users)
      .values(batch)
      .returning();
    results.push(...inserted);
  }

  return results;
}

// 支持的数据库的批处理 API（LibSQL、Neon、D1）
const batchResults = await db.batch([
  db.insert(users).values({ name: '用户1', email: 'user1@test.com' }),
  db.insert(users).values({ name: '用户2', email: 'user2@test.com' }),
  db.select().from(users),
  db.update(users).set({ isActive: true }).where(eq(users.id, 1)),
]);
```

## 实战场景

### Next.js 集成

```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// app/users/page.tsx（服务器组件）
import { db } from '@/lib/db';
import { users } from '@/lib/schema';

export default async function UsersPage() {
  const allUsers = await db.select().from(users);

  return (
    <ul>
      {allUsers.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Server Actions
'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  await db.insert(users).values({ name, email });
  revalidatePath('/users');
}
```

### 边缘数据库支持

```typescript
// Cloudflare D1
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = drizzle(env.DB, { schema });

    const users = await db.select().from(schema.users);
    return Response.json(users);
  },
};

// Turso（LibSQL）
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client);

// Vercel Postgres
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';

export const db = drizzle(sql);
```

### 多数据库支持

```typescript
// 支持多种数据库方言
// schema/postgres.ts
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

// schema/mysql.ts
import { mysqlTable, serial, varchar } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

// schema/sqlite.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

// 数据库连接的工厂模式
function createDb(dialect: 'pg' | 'mysql' | 'sqlite', connectionString: string) {
  switch (dialect) {
    case 'pg':
      return drizzle(new Pool({ connectionString }));
    case 'mysql':
      return drizzle(mysql.createPool(connectionString));
    case 'sqlite':
      return drizzle(createClient({ url: connectionString }));
  }
}
```

## 面试要点

### 概念性问题

**问：Drizzle 与 Prisma 和 TypeORM 有什么不同？**

答：Drizzle 拥抱 SQL，使用镜像 SQL 语法的类型安全 API，不需要代码生成。Prisma 使用自己的查询 DSL，需要构建步骤进行类型生成。TypeORM 使用装饰器和 Active Record/Data Mapper 模式。Drizzle 明显更轻量（~7.4KB vs Prisma 的 ~2MB），并为 serverless 环境优化。

**问：Drizzle 如何在没有代码生成的情况下实现类型安全？**

答：Drizzle 使用 TypeScript 的高级类型推断能力。当你使用 `pgTable` 定义 schema 时，TypeScript 从列定义中推断类型。`$inferSelect` 和 `$inferInsert` 工具提取这些类型供整个应用使用。这种方法利用 TypeScript 的结构化类型系统，而不是生成单独的类型文件。

**问：Drizzle 关系和外键有什么区别？**

答：外键是数据库级别的约束，用于强制引用完整性。Drizzle 关系是应用级别的元数据，用于启用关系查询 API（`db.query.users.findMany({ with: { posts: true } })`）。你需要外键来保证数据完整性，需要关系来方便地获取嵌套数据。它们服务于不同的目的，两者都应该定义。

### 实践性问题

**问：你会如何在 CI/CD 流水线中处理数据库迁移？**

答：在开发过程中使用 `drizzle-kit generate` 创建 SQL 迁移文件，将其提交到版本控制，并在部署期间运行 `drizzle-kit migrate` 或编程式迁移。对于生产环境：

```typescript
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle' });
}

// 在启动应用程序之前运行
await runMigrations();
```

**问：你如何用 Drizzle 防止 N+1 查询？**

答：三种方法：（1）使用带 `with` 的关系查询来急切加载关系，（2）在查询构建器中使用 SQL JOIN，或（3）使用 `inArray` 批量获取相关数据并在客户端分组。关系查询方法通常最方便。

**问：你会如何用 Drizzle 实现乐观锁？**

答：
```typescript
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title'),
  version: integer('version').default(1),
});

async function updatePost(id: number, data: Partial<Post>, expectedVersion: number) {
  const [updated] = await db
    .update(posts)
    .set({
      ...data,
      version: sql`${posts.version} + 1`
    })
    .where(
      and(
        eq(posts.id, id),
        eq(posts.version, expectedVersion)
      )
    )
    .returning();

  if (!updated) {
    throw new Error('检测到并发修改');
  }

  return updated;
}
```

## 延伸阅读

### 官方资源

- [Drizzle ORM 文档](https://orm.drizzle.team/) - 全面的官方文档
- [Drizzle Kit 文档](https://orm.drizzle.team/kit-docs/overview) - 迁移和工具指南
- [Drizzle Studio 文档](https://orm.drizzle.team/drizzle-studio/overview) - 可视化数据库浏览器
- [Drizzle GitHub 仓库](https://github.com/drizzle-team/drizzle-orm) - 源代码和示例

### 社区资源

- [Drizzle Discord](https://discord.gg/drizzle) - 官方社区
- [Drizzle Twitter](https://twitter.com/DrizzleORM) - 更新和公告
- [示例项目](https://github.com/drizzle-team/drizzle-orm/tree/main/examples) - 官方示例

### 相关技术

- **数据库平台**：Neon、PlanetScale、Turso、Supabase、Vercel Postgres
- **框架**：Next.js、Remix、SvelteKit、Astro、Hono
- **Serverless**：Cloudflare Workers、Vercel Edge Functions、AWS Lambda

### 教程和指南

- [Drizzle 与 Next.js App Router](https://orm.drizzle.team/tutorials/drizzle-with-nextjs) - 全栈教程
- [从 Prisma 迁移到 Drizzle](https://orm.drizzle.team/tutorials/migrate-from-prisma) - 迁移指南
- [Drizzle 与 Serverless](https://orm.drizzle.team/tutorials/drizzle-with-vercel) - 边缘部署指南

---

Drizzle ORM 和 Drizzle Studio 共同为现代 TypeScript 应用程序提供了强大的、类型安全的数据库工具包。类 SQL API 降低了熟悉 SQL 的开发者的学习曲线，同时提供完整的类型安全和出色的开发者体验。Drizzle Studio 通过在不离开开发工作流程的情况下提供可视化数据库管理来补充这一点。从基础开始，利用 TypeScript 的类型推断，随着应用程序的增长逐步采用更高级的模式。
