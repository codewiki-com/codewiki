---
title: "Drizzle ORM: Lightweight TypeScript ORM"
description: Explore Drizzle ORM's TypeScript-first design and high-performance features
track: backend
section: databases
difficulty: intermediate
tags:
  - Drizzle
  - ORM
  - TypeScript
  - Database
status: imported
origin: old/src/content/docs/backend/drizzle.en.md
divergence: 0.248
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 22
  lastUpdated: 2026-01-07
---

## What is Drizzle ORM

Drizzle ORM is a modern, lightweight, and type-safe TypeScript ORM designed for SQL databases. Unlike traditional ORMs that abstract away SQL, Drizzle embraces SQL while providing full type safety and an excellent developer experience. It supports PostgreSQL, MySQL, SQLite, and other SQL databases.

### Key Features

- **TypeScript-First**: Complete type inference from schema to queries
- **Lightweight**: ~7.4KB minified+gzipped with zero dependencies
- **SQL-Like Syntax**: Familiar SQL patterns with type safety
- **Serverless Ready**: Designed for edge computing and serverless environments
- **No Code Generation**: Types are inferred directly from your schema
- **Multiple Databases**: PostgreSQL, MySQL, SQLite, and more

### Why Choose Drizzle

```
1. Full type safety without code generation
2. Minimal runtime overhead and bundle size
3. SQL-like query API that feels natural
4. Excellent for serverless and edge deployments
5. Easy migration from raw SQL
6. Built-in migration tooling with Drizzle Kit
```

## Schema Definition

### Basic Table Structure

Drizzle uses a declarative approach to define database schemas:

```typescript
import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// Define a users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define a posts table
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id),
  published: boolean('published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Column Types by Database

```typescript
// PostgreSQL specific types
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  json,
  jsonb,
  uuid,
  decimal,
  doublePrecision,
  real,
} from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// MySQL specific types
import {
  mysqlTable,
  serial,
  varchar,
  int,
  boolean,
  timestamp,
  json,
  text,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';

export const orders = mysqlTable('orders', {
  id: serial('id').primaryKey(),
  status: mysqlEnum('status', ['pending', 'processing', 'shipped', 'delivered']),
  total: int('total').notNull(),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// SQLite specific types
import {
  sqliteTable,
  integer,
  text,
  real,
  blob,
} from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  priority: real('priority'),
  attachment: blob('attachment'),
});
```

### Indexes and Constraints

```typescript
import { pgTable, serial, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  categoryId: integer('category_id').notNull(),
  authorId: integer('author_id').notNull(),
}, (table) => [
  // Single column index
  index('slug_idx').on(table.slug),
  // Unique index
  uniqueIndex('unique_slug_idx').on(table.slug),
  // Composite index
  index('category_author_idx').on(table.categoryId, table.authorId),
]);

// Composite primary key
export const userRoles = pgTable('user_roles', {
  userId: integer('user_id').notNull().references(() => users.id),
  roleId: integer('role_id').notNull().references(() => roles.id),
  assignedAt: timestamp('assigned_at').defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.roleId] }),
]);
```

## Query Operations

### Database Connection

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// With connection URL shorthand
import { drizzle } from 'drizzle-orm/node-postgres';
const db = drizzle(process.env.DATABASE_URL);
```

### CRUD Operations

```typescript
import { eq, and, or, gt, lt, like, inArray, isNull } from 'drizzle-orm';
import { db } from './db';
import { users, posts } from './schema';

// INSERT - Single record
const newUser = await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
}).returning();

// INSERT - Multiple records
await db.insert(users).values([
  { name: 'Alice', email: 'alice@example.com', age: 25 },
  { name: 'Bob', email: 'bob@example.com', age: 35 },
]);

// INSERT with ON CONFLICT (upsert)
await db.insert(users)
  .values({ name: 'John', email: 'john@example.com', age: 31 })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: 'John Updated', age: 31 },
  });

// SELECT - Basic query
const allUsers = await db.select().from(users);

// SELECT - Specific columns
const userNames = await db.select({
  id: users.id,
  name: users.name,
}).from(users);

// SELECT - With conditions
const activeAdults = await db.select()
  .from(users)
  .where(
    and(
      eq(users.isActive, true),
      gt(users.age, 18)
    )
  );

// SELECT - With OR conditions
const results = await db.select()
  .from(users)
  .where(
    or(
      eq(users.name, 'John'),
      eq(users.name, 'Jane')
    )
  );

// SELECT - Pattern matching
const matchingUsers = await db.select()
  .from(users)
  .where(like(users.email, '%@gmail.com'));

// SELECT - IN clause
const specificUsers = await db.select()
  .from(users)
  .where(inArray(users.id, [1, 2, 3]));

// SELECT - NULL check
const usersWithoutAge = await db.select()
  .from(users)
  .where(isNull(users.age));

// UPDATE
await db.update(users)
  .set({
    name: 'John Smith',
    updatedAt: new Date(),
  })
  .where(eq(users.id, 1));

// DELETE
await db.delete(users)
  .where(eq(users.email, 'john@example.com'));
```

### Sorting and Pagination

```typescript
import { asc, desc, sql } from 'drizzle-orm';

// ORDER BY
const sortedUsers = await db.select()
  .from(users)
  .orderBy(asc(users.name));

// Multiple sort columns
const sorted = await db.select()
  .from(users)
  .orderBy(desc(users.createdAt), asc(users.name));

// LIMIT and OFFSET
const paginatedUsers = await db.select()
  .from(users)
  .limit(10)
  .offset(20);

// Complete pagination example
async function getUsers(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` })
      .from(users),
  ]);

  return {
    data,
    total: countResult[0].count,
    page,
    pageSize,
    totalPages: Math.ceil(countResult[0].count / pageSize),
  };
}
```

### Aggregations and Grouping

```typescript
import { sql, count, sum, avg, min, max } from 'drizzle-orm';

// COUNT
const userCount = await db.select({
  count: count(),
}).from(users);

// COUNT with condition
const activeCount = await db.select({
  count: count(),
}).from(users)
  .where(eq(users.isActive, true));

// Multiple aggregations
const stats = await db.select({
  total: count(),
  avgAge: avg(users.age),
  minAge: min(users.age),
  maxAge: max(users.age),
}).from(users);

// GROUP BY
const postsByAuthor = await db.select({
  authorId: posts.authorId,
  postCount: count(),
}).from(posts)
  .groupBy(posts.authorId);

// GROUP BY with HAVING
const prolificAuthors = await db.select({
  authorId: posts.authorId,
  postCount: count(),
}).from(posts)
  .groupBy(posts.authorId)
  .having(sql`count(*) > 5`);
```

## Relations

### Defining Relations

```typescript
import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

// Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id),
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  postId: integer('post_id').references(() => posts.id),
  authorId: integer('author_id').references(() => users.id),
});

// Relations
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

### Many-to-Many Relations

```typescript
import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, primaryKey } from 'drizzle-orm/pg-core';

// Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

// Junction table
export const usersToGroups = pgTable('users_to_groups', {
  userId: integer('user_id').notNull().references(() => users.id),
  groupId: integer('group_id').notNull().references(() => groups.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.groupId] }),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  usersToGroups: many(usersToGroups),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  usersToGroups: many(usersToGroups),
}));

export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
  user: one(users, {
    fields: [usersToGroups.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [usersToGroups.groupId],
    references: [groups.id],
  }),
}));
```

### Querying with Relations

```typescript
// Query with nested relations
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,
  },
});

// Deep nested relations
const usersWithPostsAndComments = await db.query.users.findMany({
  with: {
    posts: {
      with: {
        comments: {
          with: {
            author: true,
          },
        },
      },
    },
  },
});

// Selective columns with relations
const result = await db.query.users.findMany({
  columns: {
    id: true,
    name: true,
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

// Filtering related data
const activeUsersWithPublishedPosts = await db.query.users.findMany({
  where: eq(users.isActive, true),
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: desc(posts.createdAt),
      limit: 5,
    },
  },
});

// Find single record
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: true,
  },
});
```

## Joins

### SQL-Style Joins

```typescript
import { eq, and } from 'drizzle-orm';

// INNER JOIN
const postsWithAuthors = await db.select({
  postId: posts.id,
  postTitle: posts.title,
  authorName: users.name,
}).from(posts)
  .innerJoin(users, eq(posts.authorId, users.id));

// LEFT JOIN
const allPostsWithAuthors = await db.select({
  postId: posts.id,
  postTitle: posts.title,
  authorName: users.name,
}).from(posts)
  .leftJoin(users, eq(posts.authorId, users.id));

// RIGHT JOIN
const allAuthorsWithPosts = await db.select()
  .from(posts)
  .rightJoin(users, eq(posts.authorId, users.id));

// FULL JOIN
const fullJoinResult = await db.select()
  .from(posts)
  .fullJoin(users, eq(posts.authorId, users.id));

// Multiple JOINs
const postsWithAuthorsAndComments = await db.select({
  postTitle: posts.title,
  authorName: users.name,
  commentText: comments.text,
}).from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .leftJoin(comments, eq(posts.id, comments.postId));

// JOIN with additional conditions
const recentPostsByActiveAuthors = await db.select()
  .from(posts)
  .innerJoin(users, and(
    eq(posts.authorId, users.id),
    eq(users.isActive, true)
  ))
  .where(gt(posts.createdAt, sql`NOW() - INTERVAL '7 days'`));
```

## Migrations with Drizzle Kit

### Configuration

Create a `drizzle.config.ts` file:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### Migration Commands

```bash
# Generate migration files from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Push schema changes directly (development)
npx drizzle-kit push

# Pull existing database schema
npx drizzle-kit pull

# Open Drizzle Studio (visual database browser)
npx drizzle-kit studio
```

### Migration Workflow

```bash
# Make changes to your schema files

# Generate migration
npx drizzle-kit generate --name add_user_profile

# Review generated SQL in ./drizzle folder

# Apply migration
npx drizzle-kit migrate
```

### Programmatic Migrations

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function runMigrations() {
  console.log('Running migrations...');

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('Migrations completed!');
  await pool.end();
}

runMigrations().catch(console.error);
```

## Comparison with Prisma

### Schema Definition

```typescript
// Drizzle - TypeScript schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
});

// Prisma - Schema DSL (schema.prisma)
// model User {
//   id    Int     @id @default(autoincrement())
//   name  String
//   email String  @unique
// }
```

### Query Syntax

```typescript
// Drizzle - SQL-like syntax
const users = await db.select()
  .from(users)
  .where(eq(users.isActive, true))
  .orderBy(desc(users.createdAt))
  .limit(10);

// Prisma - Method chaining
// const users = await prisma.user.findMany({
//   where: { isActive: true },
//   orderBy: { createdAt: 'desc' },
//   take: 10,
// });
```

### Feature Comparison

| Feature | Drizzle | Prisma |
|---------|---------|--------|
| Type Safety | Full inference | Full with codegen |
| Bundle Size | ~7.4KB | ~2MB+ |
| Learning Curve | Low (SQL knowledge) | Medium (Prisma DSL) |
| Raw SQL | Native support | Escape hatch |
| Serverless | Optimized | Requires adapter |
| Schema Definition | TypeScript | Prisma Schema |
| Code Generation | None required | Required |
| Relations | SQL joins + ORM-style | ORM-style |
| Migration Tools | Drizzle Kit | Prisma Migrate |

### When to Choose Drizzle

- Need minimal bundle size for serverless/edge
- Prefer SQL-like query syntax
- Want to avoid code generation step
- Working with existing database schema
- Need fine-grained control over queries

### When to Choose Prisma

- Prefer higher-level abstractions
- Need built-in data validation
- Want GUI-based database management
- Team less familiar with SQL
- Using Prisma ecosystem tools

## Performance Optimization

### Query Optimization

```typescript
// Select only needed columns
const userNames = await db.select({
  id: users.id,
  name: users.name,
}).from(users);

// Use indexes effectively
// Ensure columns in WHERE clauses are indexed
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'john@example.com')); // email should be indexed

// Batch inserts
await db.insert(users).values([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  // ... more records
]);

// Use transactions for multiple operations
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users)
    .values({ name: 'John', email: 'john@example.com' })
    .returning();

  await tx.insert(posts)
    .values({ title: 'First Post', authorId: user.id });
});
```

### Prepared Statements

```typescript
import { sql } from 'drizzle-orm';

// Prepared statement for repeated queries
const getUserByEmail = db.select()
  .from(users)
  .where(eq(users.email, sql.placeholder('email')))
  .prepare('get_user_by_email');

// Execute prepared statement
const user = await getUserByEmail.execute({ email: 'john@example.com' });

// Prepared statement with multiple parameters
const getPostsByAuthor = db.select()
  .from(posts)
  .where(
    and(
      eq(posts.authorId, sql.placeholder('authorId')),
      eq(posts.published, sql.placeholder('published'))
    )
  )
  .limit(sql.placeholder('limit'))
  .prepare('get_posts_by_author');

const authorPosts = await getPostsByAuthor.execute({
  authorId: 1,
  published: true,
  limit: 10,
});
```

### Connection Pooling

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Configure connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);

// For serverless environments
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);
```

### Avoiding N+1 Queries

```typescript
// BAD: N+1 problem
const users = await db.select().from(users);
for (const user of users) {
  // Each iteration makes a separate query
  const userPosts = await db.select()
    .from(posts)
    .where(eq(posts.authorId, user.id));
}

// GOOD: Use relations query
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,
  },
});

// GOOD: Use JOIN
const usersWithPosts = await db.select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));

// GOOD: Batch fetch with IN clause
const allUsers = await db.select().from(users);
const userIds = allUsers.map(u => u.id);
const allPosts = await db.select()
  .from(posts)
  .where(inArray(posts.authorId, userIds));
```

## Best Practices

### Project Structure

```
src/
  db/
    index.ts          # Database connection
    schema/
      index.ts        # Export all schemas
      users.ts        # User table and relations
      posts.ts        # Post table and relations
      comments.ts     # Comment table and relations
    migrations/       # Migration files
  repositories/
    userRepository.ts
    postRepository.ts
  services/
    userService.ts
```

### Type Inference

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './schema';

// Infer types from schema
type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

// Use in functions
async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users)
    .values(data)
    .returning();
  return user;
}

async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, id));
  return user;
}
```

### Repository Pattern

```typescript
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { users, posts } from '../db/schema';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

export const userRepository = {
  async findById(id: number): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  },

  async findAll(options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }): Promise<User[]> {
    let query = db.select().from(users);

    if (options?.isActive !== undefined) {
      query = query.where(eq(users.isActive, options.isActive));
    }

    return query
      .orderBy(desc(users.createdAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);
  },

  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users)
      .values(data)
      .returning();
    return user;
  },

  async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id));
    return result.rowCount > 0;
  },

  async findWithPosts(id: number) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        posts: {
          orderBy: desc(posts.createdAt),
        },
      },
    });
  },
};
```

### Error Handling

```typescript
import { DrizzleError } from 'drizzle-orm';

async function createUser(data: NewUser) {
  try {
    const [user] = await db.insert(users)
      .values(data)
      .returning();
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof Error) {
      // Handle unique constraint violation
      if (error.message.includes('unique constraint')) {
        return {
          success: false,
          error: 'Email already exists'
        };
      }
      // Handle foreign key violation
      if (error.message.includes('foreign key')) {
        return {
          success: false,
          error: 'Referenced record not found'
        };
      }
    }
    throw error;
  }
}

// Transaction with error handling
async function transferFunds(fromId: number, toId: number, amount: number) {
  try {
    await db.transaction(async (tx) => {
      // Deduct from sender
      await tx.update(accounts)
        .set({ balance: sql`balance - ${amount}` })
        .where(and(
          eq(accounts.id, fromId),
          sql`balance >= ${amount}`
        ));

      // Add to receiver
      await tx.update(accounts)
        .set({ balance: sql`balance + ${amount}` })
        .where(eq(accounts.id, toId));
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Transfer failed' };
  }
}
```

### Testing

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';

// Test database setup
async function setupTestDatabase() {
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  // Run migrations
  await migrate(db, { migrationsFolder: './drizzle' });

  return { db, pool };
}

// Clean up between tests
async function cleanupTables(db: ReturnType<typeof drizzle>) {
  await db.delete(schema.comments);
  await db.delete(schema.posts);
  await db.delete(schema.users);
}

// Example test
describe('UserRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let pool: Pool;

  beforeAll(async () => {
    const setup = await setupTestDatabase();
    db = setup.db;
    pool = setup.pool;
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await cleanupTables(db);
  });

  test('should create a user', async () => {
    const [user] = await db.insert(schema.users)
      .values({
        name: 'Test User',
        email: 'test@example.com',
      })
      .returning();

    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();
  });
});
```

## Advanced Features

### Transactions

```typescript
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users)
    .values({ name: 'John', email: 'john@example.com' })
    .returning();

  await tx.insert(posts)
    .values({ title: 'First Post', authorId: user.id });

  // If any query fails, all changes are rolled back
});

// Nested transactions with savepoints
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'Jane', email: 'jane@example.com' });

  try {
    await tx.transaction(async (tx2) => {
      await tx2.insert(posts).values({ title: 'Post', authorId: 999 }); // May fail
    });
  } catch (e) {
    // Inner transaction rolled back, outer continues
    console.log('Inner transaction failed');
  }
});
```

### Raw SQL

```typescript
import { sql } from 'drizzle-orm';

// Execute raw SQL
const result = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);

// Use SQL in queries
const filteredUsers = await db.select()
  .from(users)
  .where(sql`${users.age} > ${18}`);

// SQL expressions in select
const usersWithFullName = await db.select({
  id: users.id,
  fullName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
}).from(users);
```

### Subqueries

```typescript
// Subquery in WHERE
const avgAge = db.select({ avg: sql<number>`avg(${users.age})` }).from(users);

const aboveAverageUsers = await db.select()
  .from(users)
  .where(gt(users.age, avgAge));

// Subquery in FROM
const postsPerUser = db
  .select({
    authorId: posts.authorId,
    postCount: sql<number>`count(*)`.as('post_count'),
  })
  .from(posts)
  .groupBy(posts.authorId)
  .as('posts_per_user');

const usersWithPostCount = await db
  .select({
    name: users.name,
    postCount: postsPerUser.postCount,
  })
  .from(users)
  .leftJoin(postsPerUser, eq(users.id, postsPerUser.authorId));
```

## Serverless Deployment

Drizzle excels in serverless environments due to its lightweight nature.

### Vercel Postgres

```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

### Cloudflare D1

```typescript
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env) {
    const db = drizzle(env.DB, { schema });

    const users = await db.select().from(schema.users);
    return Response.json(users);
  },
};
```

### Neon Serverless

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

## Further Reading

### Official Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle GitHub Repository](https://github.com/drizzle-team/drizzle-orm)

### Advanced Topics

- **Custom SQL Expressions**: Using `sql` template literal for complex queries
- **Database Views**: Creating and querying database views
- **Stored Procedures**: Calling stored procedures from Drizzle
- **Database Introspection**: Generating schema from existing databases

### Related Technologies

- **PostgreSQL**: Most popular database for Drizzle
- **MySQL/MariaDB**: Fully supported with specific optimizations
- **SQLite**: Excellent for embedded and serverless use
- **PlanetScale**: Serverless MySQL with Drizzle support
- **Neon**: Serverless PostgreSQL optimized for Drizzle

### Community Resources

- [Drizzle Discord](https://discord.gg/drizzle)
- [Drizzle Twitter](https://twitter.com/DrizzleORM)
- [Example Projects](https://github.com/drizzle-team/drizzle-orm/tree/main/examples)

---

> Drizzle ORM provides a perfect balance between type safety and SQL familiarity. Its lightweight design makes it ideal for modern serverless architectures while maintaining the full power of SQL. Start with the basics, leverage TypeScript's type inference, and progressively adopt more advanced patterns as your application grows.
