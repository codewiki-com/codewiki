---
title: Drizzle Studio Database Management
description: A comprehensive guide to Drizzle ORM and Drizzle Studio - the modern TypeScript ORM with visual database management
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
origin: old/src/content/docs/backend/drizzle-studio.en.md
divergence: 0.211
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 34
  lastUpdated: 2026-01-20
---

Drizzle Studio is a powerful visual database management tool that seamlessly integrates with Drizzle ORM, providing developers with an intuitive interface to explore, manage, and manipulate database data. Combined with Drizzle ORM's type-safe, SQL-like API, it creates a complete solution for modern database development workflows.

## Understanding Drizzle Ecosystem

### What is Drizzle ORM

Drizzle ORM is a modern, lightweight TypeScript ORM that embraces SQL rather than abstracting it away. Unlike traditional ORMs that hide SQL complexity behind custom query languages, Drizzle provides a type-safe API that mirrors SQL syntax, making it familiar to developers who already know SQL.

**Core Philosophy:**

- **SQL-Like Syntax**: Query API closely resembles actual SQL statements
- **Zero Abstraction**: No hidden queries or magic - you see exactly what runs
- **TypeScript-First**: Full type inference without code generation
- **Lightweight**: ~7.4KB minified+gzipped with zero dependencies
- **Serverless Ready**: Optimized for edge computing and serverless environments

### What is Drizzle Studio

Drizzle Studio is a visual database browser and management tool that reads your Drizzle configuration and schema to provide a web-based interface for:

- Browsing and searching database tables
- Adding, editing, and deleting records
- Exploring table relationships
- Running ad-hoc queries
- Managing data during development

```bash
# Launch Drizzle Studio
npx drizzle-kit studio
```

When you run this command, Drizzle Studio starts a local server (default: `127.0.0.1:4983`) and opens a browser interface at `local.drizzle.studio`.

### Comparison with Other ORMs

| Feature | Drizzle | Prisma | TypeORM |
|---------|---------|--------|---------|
| Query Syntax | SQL-like | Custom DSL | Decorator-based |
| Bundle Size | ~7.4KB | ~2MB+ | ~500KB+ |
| Type Safety | Full inference | Codegen required | Partial |
| Learning Curve | Low (SQL knowledge) | Medium | High |
| Visual Studio | Drizzle Studio | Prisma Studio | None built-in |
| Code Generation | None required | Required | Optional |
| Serverless | Optimized | Adapter needed | Not ideal |
| Raw SQL | Native support | Escape hatch | Supported |

### When to Choose Drizzle

Drizzle is ideal when you:

1. **Prefer SQL semantics** - You want queries that look and feel like SQL
2. **Need minimal bundle size** - Critical for serverless/edge deployments
3. **Want type safety without codegen** - No build step for type generation
4. **Work with existing databases** - Easy to introspect and adopt existing schemas
5. **Need fine-grained control** - Full control over generated queries

## Core Principles

### SQL-Like Type-Safe API

Drizzle's query builder mirrors SQL syntax while providing full TypeScript type inference:

```typescript
// Drizzle query - looks like SQL
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

// Equivalent SQL:
// SELECT id, name, email FROM users
// WHERE is_active = true
// ORDER BY created_at DESC
// LIMIT 10
```

### Zero Abstraction Philosophy

Unlike ORMs that generate unpredictable queries, Drizzle gives you complete visibility:

```typescript
// What you write
const result = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))
  .where(gt(posts.views, 1000));

// What runs - exactly what you expect
// SELECT * FROM users
// LEFT JOIN posts ON users.id = posts.author_id
// WHERE posts.views > 1000
```

### Migration System Architecture

Drizzle Kit provides a robust migration system with two approaches:

**1. Generate and Migrate (Production)**
```bash
# Generate SQL migration files from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate
```

**2. Push (Development)**
```bash
# Push schema changes directly to database
npx drizzle-kit push
```

The generate approach creates versioned SQL files that can be reviewed, version-controlled, and applied consistently across environments.

## Essential Concepts

### Schema Definition

Drizzle schemas are defined in TypeScript, providing immediate type inference:

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

// Users table
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

// Posts table with foreign key
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

// Comments table
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

// Type inference - no codegen needed!
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

### Defining Relations

Relations in Drizzle are defined separately from table schemas, enabling the relational query API:

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

### Query Building

Drizzle offers two query APIs: SQL-like and Relational.

**SQL-Like API:**
```typescript
import { eq, and, or, gt, lt, like, inArray, isNull, desc, asc } from 'drizzle-orm';

// Complex WHERE conditions
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

**Relational Query API:**
```typescript
// Fetch users with nested relations
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

### Drizzle Studio Features

Drizzle Studio provides a comprehensive visual interface:

**Data Browsing:**
- View all tables from your schema
- Browse records with pagination
- Search and filter data
- View relationships between tables

**Data Manipulation:**
- Add new records with form validation
- Edit existing records inline
- Delete records with confirmation
- Handle NULL vs empty string values correctly

**Supported Data Types:**
- Strings, numbers, booleans
- JSON objects and arrays
- Dates and timestamps
- UUIDs and big integers
- Arrays (PostgreSQL)

**Configuration:**
```bash
# Start with default settings
npx drizzle-kit studio

# Custom port
npx drizzle-kit studio --port 3000

# Custom host (for Docker/remote access)
npx drizzle-kit studio --host 0.0.0.0

# Verbose logging
npx drizzle-kit studio --verbose
```

## Code Examples

### Project Setup

**1. Installation:**
```bash
# Core packages
npm install drizzle-orm
npm install -D drizzle-kit

# Database drivers (choose one)
npm install pg                    # PostgreSQL
npm install mysql2                # MySQL
npm install @libsql/client        # SQLite/Turso
npm install @neondatabase/serverless  # Neon
```

**2. Configuration (drizzle.config.ts):**
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

**3. Database Connection:**
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

### Complete CRUD Operations

```typescript
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { db } from './db';
import { users, posts, comments } from './db/schema';

// ============ CREATE ============

// Insert single record
async function createUser(data: NewUser) {
  const [user] = await db
    .insert(users)
    .values(data)
    .returning();
  return user;
}

// Insert multiple records
async function createUsers(data: NewUser[]) {
  return db.insert(users).values(data).returning();
}

// Upsert (insert or update on conflict)
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

// ============ READ ============

// Find by ID
async function getUserById(id: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));
  return user;
}

// Find with conditions
async function getActiveUsers() {
  return db
    .select()
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(desc(users.createdAt));
}

// Find with pagination
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

// Find with relations
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

// ============ UPDATE ============

// Update by ID
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

// Update multiple records
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

// ============ DELETE ============

// Delete by ID
async function deleteUser(id: number) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  return deleted;
}

// Soft delete pattern
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

### Complex Queries

```typescript
import { eq, and, or, gt, lt, like, sql, desc, asc, count, sum, avg } from 'drizzle-orm';

// Aggregations
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

// Group by with having
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

// Subqueries
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

// Full-text search (PostgreSQL)
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

// JSON operations (PostgreSQL)
async function getUsersByPreference(theme: string) {
  return db
    .select()
    .from(users)
    .where(sql`${users.metadata}->>'theme' = ${theme}`);
}
```

### Transactions

```typescript
// Basic transaction
async function createPostWithTags(
  postData: NewPost,
  tagIds: number[]
) {
  return db.transaction(async (tx) => {
    // Create post
    const [post] = await tx
      .insert(posts)
      .values(postData)
      .returning();

    // Create post-tag associations
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

// Transaction with rollback on error
async function transferCredits(
  fromUserId: number,
  toUserId: number,
  amount: number
) {
  return db.transaction(async (tx) => {
    // Check sender balance
    const [sender] = await tx
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, fromUserId));

    if (!sender || sender.credits < amount) {
      throw new Error('Insufficient credits');
    }

    // Deduct from sender
    await tx
      .update(users)
      .set({ credits: sql`${users.credits} - ${amount}` })
      .where(eq(users.id, fromUserId));

    // Add to receiver
    await tx
      .update(users)
      .set({ credits: sql`${users.credits} + ${amount}` })
      .where(eq(users.id, toUserId));

    // Log transaction
    await tx.insert(creditTransactions).values({
      fromUserId,
      toUserId,
      amount,
      createdAt: new Date(),
    });

    return { success: true };
  });
}

// Nested transactions with savepoints
async function complexOperation() {
  return db.transaction(async (tx) => {
    await tx.insert(users).values({ name: 'User 1', email: 'user1@test.com' });

    try {
      // Nested transaction - creates savepoint
      await tx.transaction(async (tx2) => {
        await tx2.insert(users).values({ name: 'User 2', email: 'user2@test.com' });
        throw new Error('Simulated failure');
      });
    } catch (error) {
      // Inner transaction rolled back to savepoint
      // Outer transaction continues
      console.log('Inner operation failed, continuing...');
    }

    await tx.insert(users).values({ name: 'User 3', email: 'user3@test.com' });
    // User 1 and User 3 will be committed, User 2 won't
  });
}
```

### Framework Integration

**Next.js App Router:**
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
```

**Express.js:**
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
    res.status(400).json({ error: 'Invalid data' });
  }
});

app.get('/users/:id', async (req, res) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(req.params.id)));

  if (!user) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(user);
});
```

## Best Practices

### Schema Design

```typescript
// 1. Use meaningful table and column names
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  // Use snake_case for database columns, camelCase in TypeScript
});

// 2. Add proper indexes
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull(),
  authorId: integer('author_id').notNull(),
  categoryId: integer('category_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  // Single column indexes
  index('posts_slug_idx').on(table.slug),
  index('posts_author_idx').on(table.authorId),
  // Composite index for common queries
  index('posts_category_created_idx').on(table.categoryId, table.createdAt),
  // Unique constraint
  uniqueIndex('posts_slug_unique').on(table.slug),
]);

// 3. Use appropriate column types
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // Use decimal for money, not float
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  // Use text for unbounded strings
  description: text('description'),
  // Use jsonb for structured data (PostgreSQL)
  attributes: jsonb('attributes').$type<ProductAttributes>(),
  // Use array types when appropriate (PostgreSQL)
  tags: text('tags').array(),
});

// 4. Organize schemas by domain
// db/schema/users.ts
// db/schema/posts.ts
// db/schema/products.ts
// db/schema/index.ts - exports all
```

### Type Safety Patterns

```typescript
// 1. Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<NewUser>;

// 2. Create branded types for IDs
type UserId = number & { __brand: 'UserId' };
type PostId = string & { __brand: 'PostId' }; // UUID

// 3. Type-safe repository pattern
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  update(id: UserId, data: UpdateUser): Promise<User | null>;
  delete(id: UserId): Promise<boolean>;
}

// 4. Type-safe query builders
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

### Performance Optimization

```typescript
// 1. Select only needed columns
const userNames = await db
  .select({
    id: users.id,
    name: users.name,
  })
  .from(users);
// NOT: db.select().from(users)

// 2. Use prepared statements for repeated queries
const getUserByEmail = db
  .select()
  .from(users)
  .where(eq(users.email, sql.placeholder('email')))
  .prepare('get_user_by_email');

// Execute multiple times efficiently
const user1 = await getUserByEmail.execute({ email: 'user1@test.com' });
const user2 = await getUserByEmail.execute({ email: 'user2@test.com' });

// 3. Batch inserts
await db.insert(users).values([
  { name: 'User 1', email: 'user1@test.com' },
  { name: 'User 2', email: 'user2@test.com' },
  { name: 'User 3', email: 'user3@test.com' },
  // ... hundreds more
]);

// 4. Use transactions for multiple operations
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'User', email: 'user@test.com' });
  await tx.insert(profiles).values({ userId: 1, bio: 'Hello' });
});

// 5. Configure connection pooling properly
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout for new connections
});
```

## Common Pitfalls

### Migration Conflicts

```typescript
// PROBLEM: Renaming a column generates DROP + ADD, losing data
// Before: name: text('name')
// After:  fullName: text('full_name')

// SOLUTION: Use custom migration
// 1. Generate migration
// npx drizzle-kit generate

// 2. Edit the generated SQL file
// Change:
//   ALTER TABLE users DROP COLUMN name;
//   ALTER TABLE users ADD COLUMN full_name TEXT;
// To:
//   ALTER TABLE users RENAME COLUMN name TO full_name;

// PREVENTION: Use drizzle-kit push for development, generate for production
```

### Relation Definition Errors

```typescript
// PROBLEM: Missing relation definition
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id').references(() => users.id),
});

// This works for SQL joins but NOT for relational queries
const result = await db.query.posts.findMany({
  with: { author: true }, // ERROR: author relation not defined
});

// SOLUTION: Always define relations for relational queries
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### Type Inference Issues

```typescript
// PROBLEM: Incorrect type inference with raw SQL
const result = await db
  .select({
    count: sql`count(*)`, // Type: unknown
  })
  .from(users);

// SOLUTION: Explicitly type SQL expressions
const result = await db
  .select({
    count: sql<number>`count(*)::int`,
    name: sql<string>`upper(${users.name})`,
  })
  .from(users);

// PROBLEM: Losing types with dynamic queries
function getUsers(columns: string[]) {
  return db.select(/* what columns? */).from(users);
}

// SOLUTION: Use type-safe column selection
function getUsers<T extends (keyof User)[]>(columns: T) {
  const selection = columns.reduce((acc, col) => {
    acc[col] = users[col];
    return acc;
  }, {} as Record<T[number], any>);

  return db.select(selection).from(users);
}
```

### N+1 Query Problems

```typescript
// PROBLEM: N+1 queries
const allUsers = await db.select().from(users);
for (const user of allUsers) {
  // Separate query for each user!
  const userPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, user.id));
}

// SOLUTION 1: Use relational queries
const usersWithPosts = await db.query.users.findMany({
  with: { posts: true },
});

// SOLUTION 2: Use JOINs
const usersWithPosts = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));

// SOLUTION 3: Batch fetch
const allUsers = await db.select().from(users);
const userIds = allUsers.map(u => u.id);
const allPosts = await db
  .select()
  .from(posts)
  .where(inArray(posts.authorId, userIds));

// Group posts by author client-side
const postsByAuthor = allPosts.reduce((acc, post) => {
  (acc[post.authorId] ??= []).push(post);
  return acc;
}, {} as Record<number, Post[]>);
```

## Performance Considerations

### Query Optimization

```typescript
// 1. Use EXPLAIN to analyze queries
const explained = await db.execute(
  sql`EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@test.com'`
);

// 2. Index frequently queried columns
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

// 3. Use covering indexes for common queries
// index('users_status_created_idx')
//   .on(table.status, table.createdAt)
//   .include(table.name, table.email);

// 4. Avoid SELECT * in production
// Bad
await db.select().from(users);

// Good
await db.select({
  id: users.id,
  name: users.name,
  email: users.email,
}).from(users);
```

### Connection Pooling

```typescript
// PostgreSQL with node-postgres
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Production settings
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500, // Close connection after N uses
});

// Monitor pool health
pool.on('error', (err) => {
  console.error('Unexpected pool error', err);
});

pool.on('connect', () => {
  console.log('New client connected');
});

export const db = drizzle(pool, { schema });

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
```

### Batch Operations

```typescript
// Efficient bulk insert
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

// Batch API for supported databases (LibSQL, Neon, D1)
const batchResults = await db.batch([
  db.insert(users).values({ name: 'User 1', email: 'user1@test.com' }),
  db.insert(users).values({ name: 'User 2', email: 'user2@test.com' }),
  db.select().from(users),
  db.update(users).set({ isActive: true }).where(eq(users.id, 1)),
]);
```

## Real-World Scenarios

### Next.js Integration

```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// app/users/page.tsx (Server Component)
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

### Edge Database Support

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

// Turso (LibSQL)
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

### Multi-Database Support

```typescript
// Support multiple database dialects
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

// Factory pattern for database connection
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

## Interview Questions

### Conceptual Questions

**Q: What makes Drizzle different from Prisma and TypeORM?**

A: Drizzle embraces SQL with a type-safe API that mirrors SQL syntax, requiring no code generation. Prisma uses its own query DSL and requires a build step for type generation. TypeORM uses decorators and Active Record/Data Mapper patterns. Drizzle is significantly lighter (~7.4KB vs ~2MB for Prisma) and optimized for serverless environments.

**Q: How does Drizzle achieve type safety without code generation?**

A: Drizzle uses TypeScript's advanced type inference capabilities. When you define a schema using `pgTable`, TypeScript infers the types from the column definitions. The `$inferSelect` and `$inferInsert` utilities extract these types for use throughout your application. This approach leverages TypeScript's structural typing system rather than generating separate type files.

**Q: What's the difference between Drizzle relations and foreign keys?**

A: Foreign keys are database-level constraints that enforce referential integrity. Drizzle relations are application-level metadata that enable the relational query API (`db.query.users.findMany({ with: { posts: true } })`). You need foreign keys for data integrity and relations for convenient nested data fetching. They serve different purposes and both should be defined.

### Practical Questions

**Q: How would you handle database migrations in a CI/CD pipeline?**

A: Use `drizzle-kit generate` to create SQL migration files during development, commit these to version control, and run `drizzle-kit migrate` or programmatic migrations during deployment. For production:

```typescript
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle' });
}

// Run before starting the application
await runMigrations();
```

**Q: How do you prevent N+1 queries with Drizzle?**

A: Three approaches: (1) Use relational queries with `with` to eagerly load relations, (2) Use SQL JOINs in the query builder, or (3) Batch fetch related data using `inArray` and group client-side. The relational query approach is usually most convenient.

**Q: How would you implement optimistic locking with Drizzle?**

A:
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
    throw new Error('Concurrent modification detected');
  }

  return updated;
}
```

## Further Reading

### Official Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/) - Comprehensive official docs
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview) - Migration and tooling guide
- [Drizzle Studio Documentation](https://orm.drizzle.team/drizzle-studio/overview) - Visual database browser
- [Drizzle GitHub Repository](https://github.com/drizzle-team/drizzle-orm) - Source code and examples

### Community Resources

- [Drizzle Discord](https://discord.gg/drizzle) - Official community
- [Drizzle Twitter](https://twitter.com/DrizzleORM) - Updates and announcements
- [Example Projects](https://github.com/drizzle-team/drizzle-orm/tree/main/examples) - Official examples

### Related Technologies

- **Database Platforms**: Neon, PlanetScale, Turso, Supabase, Vercel Postgres
- **Frameworks**: Next.js, Remix, SvelteKit, Astro, Hono
- **Serverless**: Cloudflare Workers, Vercel Edge Functions, AWS Lambda

### Tutorials and Guides

- [Drizzle with Next.js App Router](https://orm.drizzle.team/tutorials/drizzle-with-nextjs) - Full-stack tutorial
- [Migrating from Prisma to Drizzle](https://orm.drizzle.team/tutorials/migrate-from-prisma) - Migration guide
- [Drizzle with Serverless](https://orm.drizzle.team/tutorials/drizzle-with-vercel) - Edge deployment guide

---

Drizzle ORM and Drizzle Studio together provide a powerful, type-safe database toolkit for modern TypeScript applications. The SQL-like API reduces the learning curve for developers familiar with SQL while providing full type safety and excellent developer experience. Drizzle Studio complements this by offering visual database management without leaving your development workflow. Start with the basics, leverage TypeScript's type inference, and progressively adopt more advanced patterns as your application grows.
