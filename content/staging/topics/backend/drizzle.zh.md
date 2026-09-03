---
title: Drizzle ORM 轻量级 TypeScript ORM
description: 探索 Drizzle ORM 的 TypeScript-first 设计和高性能特性
track: backend
section: databases
difficulty: intermediate
tags:
  - Drizzle
  - ORM
  - TypeScript
  - 数据库
status: imported
origin: old/src/content/docs/backend/drizzle.zh.md
divergence: 0.248
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 22
  lastUpdated: 2026-01-07
---

## 什么是 Drizzle ORM

Drizzle ORM 是一个轻量级、无头（headless）的 TypeScript ORM，专为 Node.js、Bun、Deno 和边缘计算环境设计。它采用 SQL-first 的设计理念，让开发者能够以 TypeScript 的方式编写类型安全的 SQL 查询，同时保持对生成 SQL 的完全控制。

### 核心特性

```
+-------------------------------------------------------------+
|                    Drizzle ORM 架构                          |
+-------------------------------------------------------------+
|  +---------------+  +---------------+  +-------------+      |
|  |  Schema 定义  |  | Query Builder |  |  Drizzle    |      |
|  |  TypeScript   |->| 类型安全查询  |  |    Kit      |      |
|  |  代码即模型   |  |  SQL-like API |  |  迁移工具   |      |
|  +---------------+  +---------------+  +-------------+      |
|           |                 |                 |             |
|  +-----------------------------------------------------+   |
|  |              零依赖，~7.4kb (min+gzip)               |   |
|  +-----------------------------------------------------+   |
|           |                 |                 |             |
|  +-----------------------------------------------------+   |
|  |   PostgreSQL | MySQL | SQLite | Neon | PlanetScale  |   |
|  |   Turso | Supabase | Cloudflare D1 | SingleStore    |   |
|  +-----------------------------------------------------+   |
+-------------------------------------------------------------+
```

**主要优势：**

- **轻量级**：压缩后仅约 7.4kb，无外部依赖
- **类型安全**：完整的 TypeScript 类型推断
- **SQL-first**：查询 API 贴近 SQL 语法
- **Serverless 友好**：支持边缘计算和无服务器环境
- **零代码生成**：Schema 变更即时生效
- **多数据库支持**：PostgreSQL、MySQL、SQLite、SingleStore 等

## 安装与配置

### 基础安装

```bash
# 安装核心包
npm install drizzle-orm

# 根据数据库选择驱动
# PostgreSQL
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg

# MySQL
npm install drizzle-orm mysql2
npm install -D drizzle-kit

# SQLite
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3

# Serverless 数据库
npm install drizzle-orm @neondatabase/serverless  # Neon
npm install drizzle-orm @planetscale/database     # PlanetScale
npm install drizzle-orm @libsql/client            # Turso
```

### 配置文件

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Schema 文件路径
  schema: './src/db/schema.ts',

  // 迁移文件输出目录
  out: './drizzle',

  // 数据库类型
  dialect: 'postgresql',

  // 数据库连接配置
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // 可选配置
  verbose: true,  // 详细日志
  strict: true,   // 严格模式
});
```

### 数据库连接

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// 创建连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 创建 Drizzle 实例
export const db = drizzle(pool, { schema });

// ============ 不同数据库的连接方式 ============

// Neon Serverless
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// PlanetScale
import { Client } from '@planetscale/database';
import { drizzle } from 'drizzle-orm/planetscale-serverless';

const client = new Client({
  url: process.env.DATABASE_URL,
});
export const db = drizzle(client);

// Turso / LibSQL
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
export const db = drizzle(client);
```

## Schema 定义

### PostgreSQL Schema

```typescript
// src/db/schema.ts
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  numeric,
  date,
  json,
  uuid,
  pgEnum
} from 'drizzle-orm/pg-core';

// 定义枚举类型
export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);

// 用户表
export const users = pgTable('users', {
  // 自增主键
  id: serial('id').primaryKey(),

  // 使用 generatedAlwaysAsIdentity（PostgreSQL 10+）
  // id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

  // 文本字段
  name: text('name').notNull(),
  email: text('email').notNull().unique(),

  // 可变长度字符串
  username: varchar('username', { length: 50 }).notNull(),

  // 整数
  age: integer('age'),

  // 布尔值
  isActive: boolean('is_active').default(true),

  // 枚举
  role: userRoleEnum('role').default('user'),

  // 时间戳
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),

  // JSON 数据
  metadata: json('metadata').$type<{ role: string; permissions: string[] }>(),

  // UUID
  publicId: uuid('public_id').defaultRandom(),
});

// 文章表
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  published: boolean('published').default(false),

  // 外键引用
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});
```

### MySQL Schema

```typescript
// MySQL 特定的类型
import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  datetime,
  json,
  mysqlEnum
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),

  // MySQL 枚举
  role: mysqlEnum('role', ['admin', 'user', 'guest']).default('user'),

  // datetime vs timestamp
  createdAt: datetime('created_at').notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});
```

### SQLite Schema

```typescript
// SQLite 特定的类型
import {
  sqliteTable,
  text,
  integer,
  real,
  blob
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  // SQLite 自增主键
  id: integer('id').primaryKey({ autoIncrement: true }),

  name: text('name').notNull(),
  email: text('email').notNull().unique(),

  // SQLite 没有布尔类型，用整数模拟
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  // 时间戳存储为整数
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

### 类型推断

```typescript
// 从 Schema 推断类型
import { users, posts } from './schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// 方式一：使用 $inferSelect 和 $inferInsert
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// 方式二：使用 InferSelectModel 和 InferInsertModel
export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;

// 插入类型（不包含自动生成的字段）
export type InsertUser = typeof users.$inferInsert;
// { name: string; email: string; age?: number | null; ... }

// 查询类型（包含所有字段）
export type SelectUser = typeof users.$inferSelect;
// { id: number; name: string; email: string; age: number | null; ... }

// 使用示例
async function createUser(userData: InsertUser) {
  return await db.insert(users).values(userData).returning();
}
```

## 关系定义

### 一对多关系

```typescript
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 表定义
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').notNull(),
});

// 关系定义
export const usersRelations = relations(users, ({ many }) => ({
  // 一个用户有多篇文章
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  // 一篇文章属于一个作者
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### 一对一关系

```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  bio: text('bio'),
  avatar: text('avatar'),
  userId: integer('user_id').notNull().unique(),
});

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));
```

### 多对多关系

```typescript
import { defineRelations } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

// 用户表
export const users = p.pgTable('users', {
  id: p.integer('id').primaryKey(),
  name: p.text('name'),
});

// 群组表
export const groups = p.pgTable('groups', {
  id: p.integer('id').primaryKey(),
  name: p.text('name'),
});

// 关联表（中间表）
export const usersToGroups = p.pgTable(
  'users_to_groups',
  {
    userId: p.integer('user_id')
      .notNull()
      .references(() => users.id),
    groupId: p.integer('group_id')
      .notNull()
      .references(() => groups.id),
  },
  (t) => [
    // 复合主键
    p.primaryKey({ columns: [t.userId, t.groupId] }),
    // 优化索引
    p.index('users_to_groups_user_id_idx').on(t.userId),
    p.index('users_to_groups_group_id_idx').on(t.groupId),
  ]
);

// 定义多对多关系
export const relations = defineRelations(
  { users, groups, usersToGroups },
  (r) => ({
    users: {
      groups: r.many.groups({
        from: r.users.id.through(r.usersToGroups.userId),
        to: r.groups.id.through(r.usersToGroups.groupId),
      }),
    },
    groups: {
      members: r.many.users({
        from: r.groups.id.through(r.usersToGroups.groupId),
        to: r.users.id.through(r.usersToGroups.userId),
      }),
    },
  })
);
```

### 自引用关系

```typescript
// 评论表：支持嵌套回复
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  postId: integer('post_id').notNull(),
  parentId: integer('parent_id'), // 父评论ID
  authorId: integer('author_id').notNull(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  // 自引用：父评论
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'commentReplies',
  }),
  // 自引用：子评论
  replies: many(comments, {
    relationName: 'commentReplies',
  }),
}));
```

## 查询操作

### 基础 SELECT 查询

```typescript
import { eq, ne, gt, gte, lt, lte, like, ilike, and, or, not, inArray } from 'drizzle-orm';
import { db } from './db';
import { users, posts } from './schema';

// 查询所有记录
const allUsers = await db.select().from(users);

// 选择特定字段
const userNames = await db.select({
  id: users.id,
  name: users.name,
}).from(users);

// WHERE 条件
const activeUsers = await db.select()
  .from(users)
  .where(eq(users.isActive, true));

// 多条件查询
const filteredUsers = await db.select()
  .from(users)
  .where(
    and(
      eq(users.isActive, true),
      gte(users.age, 18),
      like(users.email, '%@gmail.com')
    )
  );

// OR 条件
const specialUsers = await db.select()
  .from(users)
  .where(
    or(
      eq(users.role, 'admin'),
      eq(users.role, 'moderator')
    )
  );

// IN 查询
const selectedUsers = await db.select()
  .from(users)
  .where(inArray(users.id, [1, 2, 3, 4, 5]));

// LIKE 模糊查询（大小写敏感）
const searchResults = await db.select()
  .from(users)
  .where(like(users.name, '%John%'));

// ILIKE 模糊查询（大小写不敏感，PostgreSQL）
const caseInsensitiveSearch = await db.select()
  .from(users)
  .where(ilike(users.name, '%john%'));
```

### 排序与分页

```typescript
import { asc, desc, count } from 'drizzle-orm';

// 排序
const sortedUsers = await db.select()
  .from(users)
  .orderBy(asc(users.name));

// 多字段排序
const multiSorted = await db.select()
  .from(users)
  .orderBy(desc(users.createdAt), asc(users.name));

// 分页
const page = 1;
const pageSize = 10;

const paginatedUsers = await db.select()
  .from(users)
  .orderBy(desc(users.createdAt))
  .limit(pageSize)
  .offset((page - 1) * pageSize);

// 获取总数用于分页
const [{ total }] = await db.select({
  total: count()
}).from(users);
```

### INSERT 操作

```typescript
// 插入单条记录
const newUser = await db.insert(users)
  .values({
    name: 'John Doe',
    email: 'john@example.com',
    age: 25,
  })
  .returning(); // 返回插入的记录

// 插入多条记录
const newUsers = await db.insert(users)
  .values([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
  ])
  .returning();

// 插入并返回特定字段
const [{ id, email }] = await db.insert(users)
  .values({ name: 'Jane', email: 'jane@example.com' })
  .returning({ id: users.id, email: users.email });

// 冲突处理（Upsert）
import { sql } from 'drizzle-orm';

await db.insert(users)
  .values({ name: 'John', email: 'john@example.com' })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: sql`excluded.name` },
  });

// 冲突时不做任何操作
await db.insert(users)
  .values({ name: 'John', email: 'john@example.com' })
  .onConflictDoNothing();
```

### UPDATE 操作

```typescript
// 更新记录
await db.update(users)
  .set({ name: 'John Smith' })
  .where(eq(users.id, 1));

// 更新并返回
const [updatedUser] = await db.update(users)
  .set({
    name: 'John Smith',
    updatedAt: new Date(),
  })
  .where(eq(users.id, 1))
  .returning();

// 基于当前值更新
await db.update(users)
  .set({
    loginCount: sql`${users.loginCount} + 1`,
  })
  .where(eq(users.id, 1));

// 批量更新
await db.update(users)
  .set({ isActive: false })
  .where(lt(users.lastLoginAt, new Date('2024-01-01')));
```

### DELETE 操作

```typescript
// 删除记录
await db.delete(users)
  .where(eq(users.id, 1));

// 删除并返回
const [deletedUser] = await db.delete(users)
  .where(eq(users.id, 1))
  .returning();

// 批量删除
await db.delete(users)
  .where(eq(users.isActive, false));
```

### JOIN 查询

```typescript
// LEFT JOIN
const postsWithAuthors = await db.select({
  post: posts,
  author: users,
})
.from(posts)
.leftJoin(users, eq(posts.authorId, users.id));

// INNER JOIN
const publishedPostsWithAuthors = await db.select()
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .where(eq(posts.published, true));

// 多表 JOIN
const commentsWithDetails = await db.select({
  comment: comments,
  post: posts,
  author: users,
})
.from(comments)
.leftJoin(posts, eq(comments.postId, posts.id))
.leftJoin(users, eq(comments.authorId, users.id));

// 自定义返回字段
const result = await db.select({
  postTitle: posts.title,
  authorName: users.name,
  commentCount: count(comments.id),
})
.from(posts)
.leftJoin(users, eq(posts.authorId, users.id))
.leftJoin(comments, eq(posts.id, comments.postId))
.groupBy(posts.id, users.id);
```

### 关系查询 (Relational Queries)

```typescript
// 使用关系 API 查询
// 需要在创建 db 实例时传入 schema

// 查询用户及其所有文章
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,
  },
});

// 查询单个用户及其文章
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: desc(posts.createdAt),
      limit: 5,
    },
  },
});

// 嵌套关系查询
const postsWithDetails = await db.query.posts.findMany({
  with: {
    author: {
      with: {
        profile: true,
      },
    },
    comments: {
      with: {
        author: true,
      },
      orderBy: desc(comments.createdAt),
    },
  },
});

// 选择特定字段
const userSummary = await db.query.users.findMany({
  columns: {
    id: true,
    name: true,
    email: true,
  },
  with: {
    posts: {
      columns: {
        id: true,
        title: true,
      },
    },
  },
});
```

### 聚合查询

```typescript
import { count, sum, avg, min, max, sql } from 'drizzle-orm';

// 计数
const [{ userCount }] = await db.select({
  userCount: count(),
}).from(users);

// 带条件的计数
const [{ activeCount }] = await db.select({
  activeCount: count(),
}).from(users)
.where(eq(users.isActive, true));

// 求和
const [{ totalAge }] = await db.select({
  totalAge: sum(users.age),
}).from(users);

// 平均值
const [{ avgAge }] = await db.select({
  avgAge: avg(users.age),
}).from(users);

// 最大值/最小值
const [{ maxAge, minAge }] = await db.select({
  maxAge: max(users.age),
  minAge: min(users.age),
}).from(users);

// GROUP BY
const postCountByAuthor = await db.select({
  authorId: posts.authorId,
  postCount: count(),
})
.from(posts)
.groupBy(posts.authorId);

// HAVING
const prolificAuthors = await db.select({
  authorId: posts.authorId,
  postCount: count(),
})
.from(posts)
.groupBy(posts.authorId)
.having(sql`count(*) > 5`);
```

### 原始 SQL 查询

```typescript
import { sql } from 'drizzle-orm';

// 执行原始 SQL
const result = await db.execute(
  sql`SELECT * FROM ${users} WHERE ${users.id} = ${1}`
);

// 在查询中使用 SQL 片段
const usersWithFullName = await db.select({
  id: users.id,
  fullName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
}).from(users);

// 复杂的原始查询
const recentActiveUsers = await db.execute(sql`
  SELECT u.*, COUNT(p.id) as post_count
  FROM ${users} u
  LEFT JOIN ${posts} p ON u.id = p.author_id
  WHERE u.created_at > NOW() - INTERVAL '30 days'
  GROUP BY u.id
  HAVING COUNT(p.id) > 0
  ORDER BY post_count DESC
  LIMIT 10
`);

// SQL 模板标签的安全参数化
const searchTerm = 'John';
const minAge = 18;

const searchResults = await db.execute(sql`
  SELECT * FROM ${users}
  WHERE name ILIKE ${`%${searchTerm}%`}
  AND age >= ${minAge}
`);
```

## 数据库迁移

### Drizzle Kit 命令

```bash
# 生成迁移文件
npx drizzle-kit generate

# 应用迁移
npx drizzle-kit migrate

# 快速同步（开发环境，不生成迁移文件）
npx drizzle-kit push

# 从数据库生成 Schema（内省）
npx drizzle-kit pull

# 启动 Drizzle Studio（可视化管理）
npx drizzle-kit studio

# 检查 Schema 变更
npx drizzle-kit check

# 删除迁移文件
npx drizzle-kit drop
```

### 迁移工作流

```
+------------------+     +------------------+     +------------------+
|   修改 Schema    | --> |  drizzle-kit     | --> |   审查迁移       |
|   TypeScript     |     |  generate        |     |   SQL 文件       |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|   生产部署       | <-- |  drizzle-kit     | <-- |   版本控制       |
|   数据库同步     |     |  migrate         |     |   提交代码       |
+------------------+     +------------------+     +------------------+
```

```typescript
// 1. 定义或修改 Schema
// src/db/schema.ts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  // 新增字段
  phoneNumber: text('phone_number'),
});

// 2. 生成迁移文件
// 运行: npx drizzle-kit generate
// 生成文件: ./drizzle/0001_add_phone_number.sql

// 3. 查看生成的 SQL
// -- ./drizzle/0001_add_phone_number.sql
// ALTER TABLE "users" ADD COLUMN "phone_number" text;

// 4. 应用迁移
// 运行: npx drizzle-kit migrate
```

### Push vs Migrate

| 特性 | drizzle-kit push | drizzle-kit migrate |
|------|------------------|---------------------|
| 适用场景 | 本地开发、快速原型 | 生产环境、团队协作 |
| 迁移文件 | 不生成 | 生成 SQL 文件 |
| 版本控制 | 无历史记录 | 完整迁移历史 |
| 工作流程 | 直接同步数据库 | 生成 -> 审查 -> 应用 |
| 回滚支持 | 不支持 | 支持 |

### 程序化迁移

```typescript
// 在代码中运行迁移
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';

async function runMigrations() {
  console.log('Running migrations...');

  await migrate(db, {
    migrationsFolder: './drizzle',
  });

  console.log('Migrations completed!');
}

runMigrations().catch(console.error);

// 在应用启动时自动迁移
async function main() {
  // 先运行迁移
  await migrate(db, { migrationsFolder: './drizzle' });

  // 再启动应用
  startServer();
}
```

## 与 Prisma 对比

### 设计理念差异

| 特性 | Drizzle ORM | Prisma ORM |
|------|-------------|------------|
| 设计理念 | SQL-first，代码即模型 | Schema-first，DSL 定义 |
| Schema 定义 | TypeScript 代码 | .prisma 文件 |
| 代码生成 | 无需生成 | 需要 `prisma generate` |
| 包体积 | ~7.4kb | ~2MB+ |
| 查询风格 | SQL-like | 抽象化 API |
| 学习曲线 | 需要 SQL 基础 | 对 SQL 新手友好 |
| MongoDB 支持 | 不支持 | 支持 |

### 查询语法对比

```typescript
// ============ Drizzle 查询 ============
import { eq, and, desc } from 'drizzle-orm';

// 基础查询
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'test@example.com'));

// 复杂查询
const posts = await db.select()
  .from(posts)
  .where(
    and(
      eq(posts.published, true),
      eq(posts.authorId, 1)
    )
  )
  .orderBy(desc(posts.createdAt))
  .limit(10);

// ============ Prisma 查询 ============
// 基础查询
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
});

// 复杂查询
const posts = await prisma.post.findMany({
  where: {
    published: true,
    authorId: 1
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

### 工作流对比

```typescript
// ============ Prisma 工作流 ============
// 1. 修改 schema.prisma 文件
// model User {
//   id    Int     @id @default(autoincrement())
//   email String  @unique
//   name  String?
// }

// 2. 运行代码生成
// npx prisma generate

// 3. 使用生成的客户端
// const user = await prisma.user.findUnique({
//   where: { email: 'test@example.com' }
// });

// ============ Drizzle 工作流 ============
// 1. 在 TypeScript 中定义 Schema（立即生效）
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
});

// 2. 直接使用，无需生成步骤
const user = await db.select().from(users)
  .where(eq(users.email, 'test@example.com'));
```

### 选择建议

**选择 Drizzle 的场景：**
- 需要精确控制生成的 SQL
- Serverless/边缘计算环境（体积敏感）
- 熟悉 SQL，偏好 SQL-like API
- 追求最小化运行时开销
- 频繁修改 Schema，需要即时反馈

**选择 Prisma 的场景：**
- 团队 SQL 基础较弱
- 需要完整的工具生态（Studio、Accelerate）
- 大型项目需要更快的类型检查
- 需要 MongoDB 支持
- 偏好声明式抽象 API

## 性能优化

### Prepared Statements

```typescript
// 创建预编译查询
const getUserById = db.select()
  .from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare('get_user_by_id');

// 复用预编译查询（避免重复解析 SQL）
const user1 = await getUserById.execute({ id: 1 });
const user2 = await getUserById.execute({ id: 2 });
const user3 = await getUserById.execute({ id: 3 });

// 带多个参数的预编译查询
import { sql } from 'drizzle-orm';

const searchUsers = db
  .select()
  .from(users)
  .where(
    and(
      eq(users.isActive, sql.placeholder('isActive')),
      gte(users.age, sql.placeholder('minAge'))
    )
  )
  .prepare('search_users');

const results = await searchUsers.execute({
  isActive: true,
  minAge: 18
});
```

### 批量操作

```typescript
// 批量插入
await db.insert(users)
  .values([
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' },
    { name: 'User 3', email: 'user3@example.com' },
    // ... 更多数据
  ]);

// Batch API（LibSQL/Neon/D1）
const batchResponse = await db.batch([
  db.insert(users).values({ id: 1, name: 'John' }).returning({ id: users.id }),
  db.update(users).set({ name: 'Dan' }).where(eq(users.id, 1)),
  db.query.users.findMany({}),
  db.select().from(users).where(eq(users.id, 1)),
]);
```

### 事务处理

```typescript
import { db } from './db';
import { users, posts, profiles } from './schema';

// 基础事务
async function createUserWithProfile(
  userData: NewUser,
  profileData: NewProfile
) {
  return await db.transaction(async (tx) => {
    // 创建用户
    const [user] = await tx.insert(users)
      .values(userData)
      .returning();

    // 创建用户资料
    const [profile] = await tx.insert(profiles)
      .values({
        ...profileData,
        userId: user.id,
      })
      .returning();

    return { user, profile };
  });
}

// 条件回滚
await db.transaction(async (tx) => {
  const [account] = await tx.select({ balance: accounts.balance })
    .from(accounts)
    .where(eq(accounts.name, 'Dan'));

  if (account.balance < 100) {
    // 抛出异常回滚事务
    tx.rollback();
  }

  await tx.update(accounts)
    .set({ balance: sql`${accounts.balance} - 100.00` })
    .where(eq(accounts.name, 'Dan'));

  await tx.update(accounts)
    .set({ balance: sql`${accounts.balance} + 100.00` })
    .where(eq(accounts.name, 'Andrew'));
});

// 嵌套事务（保存点）
await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100` });

  // 嵌套事务
  await tx.transaction(async (tx2) => {
    await tx2.update(users).set({ name: 'Mr. Dan' });
    // 如果这里失败，只回滚内部事务
  });
});
```

### 索引策略

```typescript
import { pgTable, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  status: text('status').notNull(),
  authorId: integer('author_id').notNull(),
  publishedAt: timestamp('published_at'),
}, (table) => [
  // 单列索引
  index('posts_author_idx').on(table.authorId),

  // 复合索引（查询顺序很重要）
  index('posts_status_date_idx').on(table.status, table.publishedAt),

  // 唯一索引
  uniqueIndex('posts_slug_unique').on(table.slug),

  // 部分索引（PostgreSQL）
  index('posts_published_idx')
    .on(table.publishedAt)
    .where(sql`status = 'published'`),
]);
```

### 连接池配置

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // 连接池配置
  max: 20,                      // 最大连接数
  idleTimeoutMillis: 30000,     // 空闲连接超时
  connectionTimeoutMillis: 2000, // 连接超时
});

// 监控连接池
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('New client connected');
});

export const db = drizzle(pool, { schema });
```

### 查询优化技巧

```typescript
// 1. 只选择需要的字段
const userNames = await db.select({
  id: users.id,
  name: users.name,
}).from(users);

// 2. 避免 N+1 问题：使用关系查询
// 不好的做法（N+1）
const allPosts = await db.select().from(posts);
for (const post of allPosts) {
  const author = await db.select().from(users)
    .where(eq(users.id, post.authorId));
}

// 好的做法（1 次查询）
const postsWithAuthors = await db.query.posts.findMany({
  with: { author: true },
});

// 3. 使用事务减少数据库往返
await db.transaction(async (tx) => {
  // 多个相关操作在同一事务中执行
});
```

## 最佳实践

### Repository 模式

```typescript
// repositories/base.repository.ts
import { eq, SQL } from 'drizzle-orm';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { db } from '../db';

export abstract class BaseRepository<
  T extends PgTableWithColumns<any>,
  Select = T['$inferSelect'],
  Insert = T['$inferInsert']
> {
  constructor(protected table: T) {}

  async findAll(where?: SQL): Promise<Select[]> {
    const query = db.select().from(this.table);
    if (where) {
      return query.where(where) as Promise<Select[]>;
    }
    return query as Promise<Select[]>;
  }

  async findById(id: number): Promise<Select | undefined> {
    const [result] = await db.select()
      .from(this.table)
      .where(eq((this.table as any).id, id));
    return result as Select | undefined;
  }

  async create(data: Insert): Promise<Select> {
    const [result] = await db.insert(this.table)
      .values(data as any)
      .returning();
    return result as Select;
  }

  async update(id: number, data: Partial<Insert>): Promise<Select | undefined> {
    const [result] = await db.update(this.table)
      .set(data as any)
      .where(eq((this.table as any).id, id))
      .returning();
    return result as Select | undefined;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(this.table)
      .where(eq((this.table as any).id, id));
    return (result as any).rowCount > 0;
  }
}

// repositories/user.repository.ts
import { users } from '../schema';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findByEmail(email: string) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async findActiveUsers() {
    return db.select()
      .from(users)
      .where(eq(users.isActive, true));
  }
}

// 使用
const userRepo = new UserRepository();
const user = await userRepo.findByEmail('test@example.com');
```

### 软删除实现

```typescript
// Schema 定义
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  deletedAt: timestamp('deleted_at'), // 软删除标记
});

// 软删除
async function softDelete(id: number) {
  await db.update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, id));
}

// 查询未删除的记录
async function findActive() {
  return db.select()
    .from(users)
    .where(isNull(users.deletedAt));
}

// 恢复删除
async function restore(id: number) {
  await db.update(users)
    .set({ deletedAt: null })
    .where(eq(users.id, id));
}
```

### 日期处理

```typescript
import { sql, gte, lte, between } from 'drizzle-orm';

// 查询特定日期范围
const recentPosts = await db.select()
  .from(posts)
  .where(
    gte(posts.createdAt, new Date('2024-01-01'))
  );

// 日期范围查询
const postsInRange = await db.select()
  .from(posts)
  .where(
    between(
      posts.createdAt,
      new Date('2024-01-01'),
      new Date('2024-12-31')
    )
  );

// 使用 SQL 函数
const postsToday = await db.select()
  .from(posts)
  .where(
    sql`DATE(${posts.createdAt}) = CURRENT_DATE`
  );
```

### 处理 NULL 值

```typescript
import { isNull, isNotNull } from 'drizzle-orm';

// 查询 NULL 值
const usersWithoutAge = await db.select()
  .from(users)
  .where(isNull(users.age));

// 查询非 NULL 值
const usersWithAge = await db.select()
  .from(users)
  .where(isNotNull(users.age));
```

## 实战示例：博客系统

### 完整 Schema

```typescript
// src/db/schema.ts
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 枚举定义
export const userRoleEnum = pgEnum('user_role', ['admin', 'author', 'reader']);
export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived']);

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('reader').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('users_email_idx').on(table.email),
]);

// 分类表
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  parentId: integer('parent_id'),
});

// 标签表
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
});

// 文章表
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  coverImage: text('cover_image'),
  status: postStatusEnum('status').default('draft').notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  authorId: integer('author_id').notNull().references(() => users.id),
  categoryId: integer('category_id').references(() => categories.id),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('posts_author_idx').on(table.authorId),
  index('posts_status_idx').on(table.status),
]);

// 文章-标签关联表
export const postsToTags = pgTable('posts_to_tags', {
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  uniqueIndex('posts_tags_unique').on(table.postId, table.tagId),
]);

// 评论表
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id),
  parentId: integer('parent_id'),
  isApproved: boolean('is_approved').default(false).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 关系定义
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
  postsToTags: many(postsToTags),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'commentReplies',
  }),
  replies: many(comments, { relationName: 'commentReplies' }),
}));
```

### 服务层实现

```typescript
// src/services/post.service.ts
import { eq, desc, and, sql, ilike } from 'drizzle-orm';
import { db } from '../db';
import { posts, postsToTags, comments } from '../db/schema';

interface CreatePostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryId?: number;
  tagIds?: number[];
  authorId: number;
}

export class PostService {
  // 创建文章
  async create(input: CreatePostInput) {
    return await db.transaction(async (tx) => {
      const [post] = await tx.insert(posts)
        .values({
          title: input.title,
          slug: input.slug,
          content: input.content,
          excerpt: input.excerpt,
          categoryId: input.categoryId,
          authorId: input.authorId,
        })
        .returning();

      // 添加标签关联
      if (input.tagIds?.length) {
        await tx.insert(postsToTags)
          .values(input.tagIds.map(tagId => ({
            postId: post.id,
            tagId,
          })));
      }

      return post;
    });
  }

  // 获取文章详情
  async findBySlug(slug: string) {
    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
      with: {
        author: {
          columns: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        category: true,
        postsToTags: {
          with: { tag: true },
        },
        comments: {
          where: eq(comments.isApproved, true),
          with: {
            author: {
              columns: { id: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: desc(comments.createdAt),
        },
      },
    });

    if (!post) return null;

    // 增加浏览量
    await db.update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, post.id));

    return {
      ...post,
      tags: post.postsToTags.map(pt => pt.tag),
    };
  }

  // 发布文章
  async publish(id: number) {
    const [post] = await db.update(posts)
      .set({
        status: 'published',
        publishedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    return post;
  }

  // 获取热门文章
  async getPopular(limit = 5) {
    return db.query.posts.findMany({
      where: eq(posts.status, 'published'),
      with: {
        author: {
          columns: { displayName: true, avatarUrl: true },
        },
      },
      orderBy: desc(posts.viewCount),
      limit,
    });
  }
}
```

## 总结

Drizzle ORM 是一个现代化的 TypeScript ORM，特别适合以下场景：

1. **追求性能**：轻量级、无依赖、最小运行时开销
2. **SQL 控制**：SQL-first 设计，精确控制生成的查询
3. **Serverless 部署**：完美支持边缘计算和无服务器环境
4. **类型安全**：完整的 TypeScript 类型推断

### 最佳实践总结

- 使用 `drizzle-kit push` 进行本地开发，`generate + migrate` 用于生产环境
- 利用关系查询避免 N+1 问题
- 合理设计索引，优化查询性能
- 使用事务保证数据一致性
- 充分利用 TypeScript 类型推断，减少运行时错误
- 使用 prepared statements 提升重复查询性能

### 学习资源

- [Drizzle ORM 官方文档](https://orm.drizzle.team/)
- [Drizzle Kit 迁移工具](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [GitHub 仓库](https://github.com/drizzle-team/drizzle-orm)
