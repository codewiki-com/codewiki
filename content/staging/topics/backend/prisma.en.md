---
title: Prisma ORM Complete Guide
description: Master Prisma for type-safe database operations
track: backend
section: databases
difficulty: intermediate
tags:
  - Prisma
  - ORM
  - Database
  - TypeScript
status: imported
origin: old/src/content/docs/backend/prisma.en.md
divergence: 0.195
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 20
  lastUpdated: 2026-01-07
---

## What is Prisma?

Prisma is a next-generation ORM (Object-Relational Mapping) for Node.js and TypeScript that fundamentally transforms how developers interact with databases. Through its declarative data modeling, auto-generated type-safe query builder, and powerful database migration system, Prisma delivers an unparalleled developer experience for database operations.

### Core Components of Prisma

Prisma consists of three main tools that work together seamlessly:

1. **Prisma Client**: An auto-generated, type-safe database client
2. **Prisma Migrate**: A declarative database migration system
3. **Prisma Studio**: A visual database management interface

```
+-------------------------------------------------------------+
|                     Prisma Ecosystem                         |
+-------------------------------------------------------------+
|  +-----------------+  +-----------------+  +---------------+ |
|  |  Prisma Schema  |  |  Prisma Client  |  |    Prisma     | |
|  |  Data modeling  |->|  Type-safe      |  |    Studio     | |
|  |  Relations      |  |  Auto-complete  |  |  Visual GUI   | |
|  +-----------------+  +-----------------+  +---------------+ |
|           |                   |                   |          |
|  +-------------------------------------------------------+   |
|  |              Prisma Migrate (Database Migrations)     |   |
|  +-------------------------------------------------------+   |
|           |                   |                   |          |
|  +-------------------------------------------------------+   |
|  |     PostgreSQL | MySQL | SQLite | MongoDB | SQL Server |  |
|  +-------------------------------------------------------+   |
+-------------------------------------------------------------+
```

## Prisma vs Traditional ORMs

### Challenges with Traditional ORMs

Traditional ORMs like Sequelize and TypeORM often face several challenges that Prisma addresses directly:

| Issue | Traditional ORM | Prisma |
|-------|-----------------|--------|
| Type Safety | Runtime checks, types may become outdated | Compile-time type checking, auto-generated types |
| Query Building | String-based or method chaining, error-prone | Type-safe query API with auto-completion |
| Relation Handling | Complex JOIN syntax | Intuitive nested queries |
| Migration Management | Manual SQL or unreliable auto-migrations | Declarative migrations, version control friendly |
| Learning Curve | Need to understand ORM patterns and SQL | Intuitive API, reduced cognitive load |
| N+1 Problem | Requires manual optimization | Automatic batching and optimization |

### Code Comparison

```typescript
// ============ TypeORM Approach ============
// Requires manual entity class and decorator definitions
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}

// Query types may be inaccurate
const users = await userRepository.find({
  relations: ['posts'],
  where: { email: Like('%@prisma.io') }
});

// ============ Prisma Approach ============
// Schema definition (schema.prisma)
// model User {
//   id    Int     @id @default(autoincrement())
//   email String  @unique
//   posts Post[]
// }

// Fully type-safe query
const users = await prisma.user.findMany({
  where: { email: { endsWith: '@prisma.io' } },
  include: { posts: true }
});
// Return type is automatically inferred, includes posts property
```

### Key Advantages of Prisma

1. **Declarative Data Modeling**: Define models using Prisma Schema Language (PSL)
2. **Type-Safe Auto-Completion**: Full type hints in your IDE
3. **Intuitive Relation Queries**: No need to manually write JOINs
4. **Automated Migrations**: Automatically generate migrations based on schema changes
5. **Cross-Database Support**: PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, and CockroachDB

## Schema Definition and Data Modeling

### Basic Configuration

The Prisma Schema file (`schema.prisma`) is the core of your entire Prisma configuration:

```prisma
// schema.prisma

// Data source configuration
datasource db {
  provider = "postgresql"  // Database type
  url      = env("DATABASE_URL")  // Read connection string from environment variable
}

// Generator configuration
generator client {
  provider = "prisma-client-js"  // Generate JavaScript/TypeScript client
  output   = "./generated/prisma"  // Optional: custom output path
}

// Data model definition
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])  // Create index
  @@map("users")    // Map to database table name
}

// Enum type
enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Field Types and Attributes

Prisma provides a rich set of field types and attributes for defining your data models:

```prisma
model Product {
  // Primary keys
  id          Int       @id @default(autoincrement())  // Auto-increment primary key
  uuid        String    @id @default(uuid())           // UUID primary key
  cuid        String    @id @default(cuid())           // CUID primary key

  // Basic types
  name        String    // String
  price       Float     // Floating point number
  quantity    Int       // Integer
  isActive    Boolean   @default(true)  // Boolean
  description String?   // Optional field (nullable)

  // Special types
  data        Json      // JSON data
  tags        String[]  // Array (PostgreSQL only)

  // Date and time
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?

  // Database-specific types
  content     String    @db.Text         // PostgreSQL TEXT
  amount      Decimal   @db.Decimal(10, 2)  // Precise decimal

  @@unique([name, category])  // Composite unique constraint
  @@index([price, isActive])  // Composite index
}
```

### Common Field Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `@id` | Defines primary key | `id Int @id` |
| `@default()` | Sets default value | `@default(now())` |
| `@unique` | Unique constraint | `email String @unique` |
| `@relation()` | Defines relations | `@relation(fields: [authorId], references: [id])` |
| `@map()` | Maps to column name | `@map("user_name")` |
| `@db.*` | Database-specific type | `@db.VarChar(255)` |
| `@updatedAt` | Auto-update timestamp | `updatedAt DateTime @updatedAt` |
| `@@index()` | Creates index | `@@index([email])` |
| `@@unique()` | Composite unique | `@@unique([firstName, lastName])` |
| `@@map()` | Maps to table name | `@@map("users")` |

### Data Validation with Zod

While Prisma itself does not provide runtime validation, you can combine it with validation libraries like Zod:

```typescript
import { z } from 'zod';
import { prisma } from './lib/prisma';

// Define validation schema
const UserCreateSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
});

// Validate before creating user
async function createUser(data: unknown) {
  const validated = UserCreateSchema.parse(data);
  return prisma.user.create({ data: validated });
}

// Usage with error handling
async function handleUserCreation(rawData: unknown) {
  try {
    const user = await createUser(rawData);
    return { success: true, user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}
```

## Relations in Prisma

Prisma supports three core relation types: one-to-one, one-to-many, and many-to-many. Understanding these relations is crucial for effective data modeling.

### One-to-One Relations (1:1)

A one-to-one relation means that one record in a table is associated with exactly one record in another table:

```prisma
model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  profile Profile?  // Optional one-to-one relation
}

model Profile {
  id       Int    @id @default(autoincrement())
  bio      String
  avatar   String?
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId   Int    @unique  // Foreign key must be unique for 1:1
}
```

```typescript
// Create user with profile
const user = await prisma.user.create({
  data: {
    email: 'alice@prisma.io',
    profile: {
      create: {
        bio: 'Full-stack developer',
        avatar: 'https://example.com/avatar.jpg'
      }
    }
  },
  include: { profile: true }
});

// Query user with profile
const userWithProfile = await prisma.user.findUnique({
  where: { email: 'alice@prisma.io' },
  include: { profile: true }
});

// Update profile
const updatedProfile = await prisma.profile.update({
  where: { userId: user.id },
  data: { bio: 'Senior full-stack developer' }
});
```

### One-to-Many Relations (1:N)

A one-to-many relation means that one record can be associated with multiple records in another table:

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]  // One user has many posts
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int      // Foreign key

  @@index([authorId])  // Index on foreign key for query performance
}
```

```typescript
// Create user with multiple posts at once
const userWithPosts = await prisma.user.create({
  data: {
    email: 'bob@prisma.io',
    posts: {
      create: [
        { title: 'Getting Started with Prisma', content: '...' },
        { title: 'TypeScript Best Practices', content: '...' }
      ]
    }
  },
  include: { posts: true }
});

// Query user's published posts with filtering and ordering
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

// Add a post to an existing user
const newPost = await prisma.post.create({
  data: {
    title: 'New Article',
    author: {
      connect: { email: 'bob@prisma.io' }
    }
  }
});

// Update multiple posts at once
await prisma.post.updateMany({
  where: { authorId: 1, published: false },
  data: { published: true }
});
```

### Many-to-Many Relations (M:N)

Prisma supports two types of many-to-many relations: implicit (auto-created join table) and explicit (manually defined join table).

#### Implicit Many-to-Many

For simple many-to-many relations without extra fields on the relation:

```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[]  // Implicit many-to-many
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]  // Implicit many-to-many
}
```

```typescript
// Create post with categories
const post = await prisma.post.create({
  data: {
    title: 'Understanding Prisma Many-to-Many Relations',
    categories: {
      create: [
        { name: 'Database' },
        { name: 'TypeScript' }
      ],
      connect: [
        { name: 'Tutorial' }  // Connect to existing category
      ]
    }
  },
  include: { categories: true }
});

// Update post categories
await prisma.post.update({
  where: { id: 1 },
  data: {
    categories: {
      set: [{ id: 1 }, { id: 2 }],  // Replace all associations
      disconnect: [{ id: 3 }],       // Remove specific association
      connect: [{ id: 4 }]           // Add new association
    }
  }
});

// Find posts with specific categories
const databasePosts = await prisma.post.findMany({
  where: {
    categories: {
      some: { name: 'Database' }
    }
  },
  include: { categories: true }
});
```

#### Explicit Many-to-Many (with Extra Fields)

When you need to store additional information about the relation:

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

// Explicit join table with additional fields
model Enrollment {
  id         Int      @id @default(autoincrement())
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  course     Course   @relation(fields: [courseId], references: [id])
  courseId   Int
  enrolledAt DateTime @default(now())
  progress   Float    @default(0)
  grade      String?
  completed  Boolean  @default(false)

  @@unique([userId, courseId])  // Prevent duplicate enrollments
  @@index([userId])
  @@index([courseId])
}
```

```typescript
// Enroll user in a course
const enrollment = await prisma.enrollment.create({
  data: {
    user: { connect: { id: 1 } },
    course: { connect: { id: 1 } },
    progress: 0
  }
});

// Query user's courses with progress
const userCourses = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    enrollments: {
      include: { course: true },
      orderBy: { enrolledAt: 'desc' }
    }
  }
});

// Update learning progress
await prisma.enrollment.update({
  where: {
    userId_courseId: { userId: 1, courseId: 1 }
  },
  data: {
    progress: 0.75,
    grade: 'A',
    completed: true
  }
});

// Find all users enrolled in a specific course
const courseEnrollments = await prisma.enrollment.findMany({
  where: { courseId: 1 },
  include: { user: true },
  orderBy: { enrolledAt: 'asc' }
});
```

### Self-Relations

Self-relations allow a model to relate to itself, useful for hierarchical data:

```prisma
model Employee {
  id           Int        @id @default(autoincrement())
  name         String
  title        String
  manager      Employee?  @relation("ManagerSubordinates", fields: [managerId], references: [id])
  managerId    Int?
  subordinates Employee[] @relation("ManagerSubordinates")
}

model Category {
  id       Int        @id @default(autoincrement())
  name     String
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  parentId Int?
  children Category[] @relation("CategoryHierarchy")
}
```

```typescript
// Create employee with manager
const employee = await prisma.employee.create({
  data: {
    name: 'John Doe',
    title: 'Software Engineer',
    manager: { connect: { id: 1 } }  // Connect to existing manager
  }
});

// Get manager with all subordinates
const managerWithTeam = await prisma.employee.findUnique({
  where: { id: 1 },
  include: {
    subordinates: true,
    manager: true
  }
});

// Recursive category tree (using raw query for deep nesting)
const categoryTree = await prisma.category.findMany({
  where: { parentId: null },  // Top-level categories
  include: {
    children: {
      include: {
        children: true  // Two levels deep
      }
    }
  }
});
```

## Prisma Client CRUD Operations

### Initializing the Client

Setting up Prisma Client properly is essential for production applications:

```typescript
import { PrismaClient } from '@prisma/client';

// Singleton pattern (recommended for production)
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

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### Create Operations

```typescript
// Create a single record
const user = await prisma.user.create({
  data: {
    email: 'alice@prisma.io',
    name: 'Alice',
    role: 'ADMIN'
  }
});

// Create and return specific fields only
const userEmail = await prisma.user.create({
  data: { email: 'bob@prisma.io', name: 'Bob' },
  select: { id: true, email: true }
});

// Bulk create (createMany)
const { count } = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' }
  ],
  skipDuplicates: true  // Skip records that violate unique constraints
});

// Nested create with relations
const userWithPosts = await prisma.user.create({
  data: {
    email: 'writer@prisma.io',
    name: 'Writer',
    posts: {
      create: [
        { title: 'First Post', published: true },
        { title: 'Second Post', published: false }
      ]
    },
    profile: {
      create: { bio: 'Technical writer' }
    }
  },
  include: {
    posts: true,
    profile: true
  }
});

// Create with connectOrCreate
const post = await prisma.post.create({
  data: {
    title: 'New Post',
    author: {
      connectOrCreate: {
        where: { email: 'author@prisma.io' },
        create: { email: 'author@prisma.io', name: 'Author' }
      }
    }
  }
});
```

### Read Operations

```typescript
// Find unique record
const user = await prisma.user.findUnique({
  where: { email: 'alice@prisma.io' }
});

// Find unique or throw error if not found
const userOrThrow = await prisma.user.findUniqueOrThrow({
  where: { id: 1 }
});

// Find first matching record
const firstAdmin = await prisma.user.findFirst({
  where: { role: 'ADMIN' },
  orderBy: { createdAt: 'asc' }
});

// Find all records
const allUsers = await prisma.user.findMany();

// Complex filtering with AND, OR, NOT
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

// Pagination with skip and take
const paginatedUsers = await prisma.user.findMany({
  skip: 0,    // Number of records to skip
  take: 10,   // Number of records to return
  orderBy: { createdAt: 'desc' }
});

// Cursor-based pagination (more efficient for large datasets)
const cursorPagination = await prisma.user.findMany({
  take: 10,
  skip: 1,  // Skip the cursor
  cursor: { id: 100 },
  orderBy: { id: 'asc' }
});

// Aggregation queries
const stats = await prisma.user.aggregate({
  _count: { _all: true },
  _avg: { age: true },
  _max: { createdAt: true },
  _min: { createdAt: true }
});

// Group by queries
const usersByRole = await prisma.user.groupBy({
  by: ['role'],
  _count: { _all: true },
  having: {
    role: { _count: { gt: 5 } }
  }
});

// Relation filtering
const usersWithPublishedPosts = await prisma.user.findMany({
  where: {
    posts: {
      some: { published: true }  // At least one published post
    }
  },
  include: {
    posts: {
      where: { published: true }
    }
  }
});

// Count records
const userCount = await prisma.user.count({
  where: { role: 'USER' }
});
```

### Update Operations

```typescript
// Update a single record
const updatedUser = await prisma.user.update({
  where: { email: 'alice@prisma.io' },
  data: {
    name: 'Alice Updated',
    role: 'MODERATOR'
  }
});

// Bulk update
const { count } = await prisma.user.updateMany({
  where: { role: 'USER' },
  data: { verified: true }
});

// Upsert (update or create)
const user = await prisma.user.upsert({
  where: { email: 'test@prisma.io' },
  update: { name: 'Updated Name' },
  create: { email: 'test@prisma.io', name: 'New User' }
});

// Numeric field operations
const incrementedPost = await prisma.post.update({
  where: { id: 1 },
  data: {
    viewCount: { increment: 1 },
    likes: { multiply: 2 },
    dislikes: { decrement: 1 }
  }
});

// Nested updates
const userWithUpdatedPosts = await prisma.user.update({
  where: { id: 1 },
  data: {
    posts: {
      updateMany: {
        where: { published: false },
        data: { published: true }
      },
      create: { title: 'New Article' },
      delete: { id: 5 }
    }
  }
});

// Update relation connections
await prisma.post.update({
  where: { id: 1 },
  data: {
    categories: {
      set: [],  // Disconnect all
      connect: [{ id: 1 }, { id: 2 }]  // Connect new ones
    }
  }
});
```

### Delete Operations

```typescript
// Delete a single record
const deletedUser = await prisma.user.delete({
  where: { email: 'alice@prisma.io' }
});

// Bulk delete
const { count } = await prisma.user.deleteMany({
  where: {
    createdAt: { lt: new Date('2023-01-01') },
    posts: { none: {} }  // Users with no posts
  }
});

// Delete with cascade (configured in schema with onDelete: Cascade)
// Or handle manually with transaction
await prisma.$transaction([
  prisma.post.deleteMany({ where: { authorId: 1 } }),
  prisma.profile.delete({ where: { userId: 1 } }),
  prisma.user.delete({ where: { id: 1 } })
]);

// Soft delete pattern (recommended for production)
await prisma.user.update({
  where: { id: 1 },
  data: { deletedAt: new Date() }
});

// Query excluding soft-deleted records
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});
```

## Transaction Handling

Prisma provides multiple ways to handle transactions, ensuring data consistency across multiple operations.

### Nested Writes (Implicit Transactions)

Nested writes are automatically wrapped in a transaction:

```typescript
// All operations succeed or all fail together
const result = await prisma.user.create({
  data: {
    email: 'alice@prisma.io',
    posts: {
      create: [
        { title: 'Article One' },
        { title: 'Article Two' }
      ]
    }
  }
});
// If any operation fails, all changes are rolled back
```

### Batch Transactions ($transaction Array)

Execute multiple independent operations as a single transaction:

```typescript
// Sequential execution of multiple operations
const [user, post, profile] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'bob@prisma.io', name: 'Bob' } }),
  prisma.post.create({ data: { title: 'New Article', authorId: 1 } }),
  prisma.profile.create({ data: { bio: 'Developer', userId: 1 } })
]);

// All operations succeed or all are rolled back
```

### Interactive Transactions

For complex business logic requiring conditional operations:

```typescript
// Bank transfer example
const transfer = await prisma.$transaction(async (tx) => {
  // 1. Check sender balance
  const sender = await tx.account.findUnique({
    where: { id: senderId }
  });

  if (!sender || sender.balance < amount) {
    throw new Error('Insufficient balance');
  }

  // 2. Deduct from sender
  const updatedSender = await tx.account.update({
    where: { id: senderId },
    data: { balance: { decrement: amount } }
  });

  // 3. Add to receiver
  const updatedReceiver = await tx.account.update({
    where: { id: receiverId },
    data: { balance: { increment: amount } }
  });

  // 4. Create transaction record
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
  maxWait: 5000,    // Maximum time to wait for transaction to start
  timeout: 10000,   // Maximum time for transaction execution
  isolationLevel: 'Serializable'  // Isolation level
});
```

### Transaction Isolation Levels

```typescript
await prisma.$transaction(
  async (tx) => {
    // Transaction operations
  },
  {
    isolationLevel: 'ReadCommitted'  // Available options:
    // ReadUncommitted - Can read uncommitted changes from other transactions
    // ReadCommitted   - Only reads committed data (default)
    // RepeatableRead  - Consistent reads within transaction
    // Serializable    - Highest isolation, prevents all anomalies
  }
);
```

### Practical Transaction Patterns

```typescript
// Order creation with inventory check
async function createOrder(userId: number, items: OrderItem[]) {
  return prisma.$transaction(async (tx) => {
    // Check inventory for all items
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: { items: true }
    });

    // Update inventory
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    return order;
  });
}
```

## Database Migrations

Prisma Migrate provides a declarative approach to database schema management, making it easy to version control your database schema alongside your application code.

### Development Workflow

```bash
# Create and apply migration
npx prisma migrate dev --name init

# Create migration without applying
npx prisma migrate dev --create-only

# Reset database (dangerous in production!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate Prisma Client without migration
npx prisma generate

# Push schema to database without migration (prototyping)
npx prisma db push
```

### Production Deployment

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Use in CI/CD pipeline
DATABASE_URL=$PRODUCTION_DB_URL npx prisma migrate deploy
```

### Migration File Structure

```
prisma/
├── schema.prisma
└── migrations/
    ├── 20240101000000_init/
    │   └── migration.sql
    ├── 20240115000000_add_user_role/
    │   └── migration.sql
    └── 20240120000000_create_posts_table/
        └── migration.sql
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

### Database Seeding

Create a seed file to populate your database with initial data:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@prisma.io',
      name: 'Alice',
      role: 'ADMIN',
      posts: {
        create: [
          { title: 'Getting Started with Prisma', published: true },
          { title: 'Advanced Prisma Techniques', published: false }
        ]
      }
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@prisma.io',
      name: 'Bob',
      role: 'USER',
      posts: {
        create: [
          { title: 'My First Blog Post', published: true }
        ]
      }
    }
  });

  console.log({ alice, bob });
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

Configure seeding in package.json:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run the seed:

```bash
npx prisma db seed
```

### Handling Schema Changes

```prisma
// Adding a new field with default value
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  verified  Boolean  @default(false)  // New field with default
  createdAt DateTime @default(now())
}

// Adding a new relation
model User {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  comments Comment[]  // New relation
}

model Comment {
  id       Int    @id @default(autoincrement())
  content  String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
```

## Query Optimization

### Selective Queries with Select

Return only the fields you need to reduce data transfer:

```typescript
// Only return required fields
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

// Nested selection
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    name: true,
    posts: {
      select: {
        title: true,
        published: true
      },
      where: { published: true }
    }
  }
});
```

### Avoiding N+1 Problems

```typescript
// BAD: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  // Each iteration executes a separate query
  const posts = await prisma.post.findMany({
    where: { authorId: user.id }
  });
}

// GOOD: Use include for eager loading
const usersWithPosts = await prisma.user.findMany({
  include: { posts: true }
});

// GOOD: Batch queries when relations aren't needed inline
const users = await prisma.user.findMany();
const userIds = users.map(u => u.id);
const posts = await prisma.post.findMany({
  where: { authorId: { in: userIds } }
});
```

### Index Optimization

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  createdAt DateTime @default(now())

  author    User     @relation(fields: [authorId], references: [id])

  // Create indexes for frequently queried fields
  @@index([authorId])
  @@index([published, createdAt])
  @@index([title])  // If often searching by title
}
```

### Query Logging and Analysis

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' }
  ]
});

// Listen to query events
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

// Use $queryRaw for raw SQL when needed
const result = await prisma.$queryRaw`
  SELECT * FROM "User"
  WHERE email LIKE ${`%@prisma.io`}
`;

// Parameterized raw queries
const email = '%@prisma.io';
const users = await prisma.$queryRaw`
  SELECT id, email, name
  FROM "User"
  WHERE email LIKE ${email}
`;
```

### Connection Pool Configuration

```
# Environment variable for connection pool
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

## Framework Integration

### Next.js Integration

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

### NestJS Integration

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

@Global()  // Global module, no need to import in every module
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

### Express.js Integration

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

```typescript
// routes/users.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const user = await prisma.user.create({
      data: req.body
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
```

## Testing Strategies

### Unit Testing (Mocking Prisma Client)

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
      const expectedUser = {
        id: 1,
        ...userData,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.user.create.mockResolvedValue(expectedUser);

      const result = await service.create(userData);

      expect(result).toEqual(expectedUser);
    });
  });
});
```

### Integration Testing (Using Test Database)

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Use test database
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean all table data
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
      );
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
    // Create user and posts
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

    // Verify query
    const foundUser = await prisma.user.findUnique({
      where: { email: 'integration@test.com' },
      include: { posts: { where: { published: true } } }
    });

    expect(foundUser?.posts).toHaveLength(1);
  });
});
```

### E2E Testing

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

## Best Practices and Interview Questions

### Common Interview Questions

#### What are the core differences between Prisma and traditional ORMs?

**Key Points**:
- Prisma uses declarative Schema rather than code-first entity classes
- Auto-generates type-safe client providing compile-time type checking
- Query API design is more intuitive, reducing learning curve
- Built-in database migration tool integrates well with version control
- Virtual relation fields simplify querying associated data

#### How do you handle the N+1 query problem in Prisma?

**Key Points**:
```typescript
// Use include to preload related data
const users = await prisma.user.findMany({
  include: { posts: true }
});

// Or use select for precise control over returned fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    posts: { select: { title: true } }
  }
});
```

#### What transaction types does Prisma support and when should you use each?

**Key Points**:
- **Nested Writes**: For simple scenarios involving related data creation/updates
- **Batch Transactions ($transaction array)**: For multiple independent operations needing atomic execution
- **Interactive Transactions**: For complex business scenarios requiring conditional logic and error handling

#### How do you optimize Prisma performance in production?

**Key Points**:
- Use `select` to query only necessary fields
- Configure database connection pool appropriately
- Create indexes for frequently queried fields
- Use `findMany` with pagination instead of loading all at once
- Enable query logging to analyze slow queries
- Consider Prisma Accelerate for connection pooling and edge caching

#### How do Prisma Migrate commands differ between development and production?

**Key Points**:
- **Development**: Use `prisma migrate dev` - can reset database, interactive migration creation
- **Production**: Use `prisma migrate deploy` - only applies pending migrations, never resets data
- Migration files should be committed to version control
- Production migrations should run automatically in CI/CD pipeline

#### How do you test code that uses Prisma?

**Key Points**:
- **Unit Tests**: Use jest-mock-extended to mock Prisma Client
- **Integration Tests**: Use separate test database, reset data before each test
- **E2E Tests**: Start full application, test API endpoints
- Use `beforeEach` hooks to clean test data, ensuring test isolation

### Practical Code Exercise

**Problem**: Design a blog system data model with users, posts, comments, and tags. Implement the following features:

1. Get all published posts for a user with comment count
2. Create a post that automatically associates existing tags or creates new ones
3. Implement soft delete for posts

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
  deletedAt   DateTime? // Soft delete marker
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
// Implementation
class BlogService {
  constructor(private prisma: PrismaClient) {}

  // 1. Get user's published posts with comment count
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

  // 2. Create post and handle tags
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

  // 3. Soft delete post
  async softDeletePost(postId: number) {
    return this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() }
    });
  }

  // Restore deleted post
  async restorePost(postId: number) {
    return this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: null }
    });
  }
}
```

## Summary

Prisma, as a modern ORM solution, significantly improves the database development experience through declarative data modeling, type-safe query APIs, and powerful migration systems. With Prisma's core concepts and best practices, you can build more reliable and maintainable database applications.

### Key Takeaways

1. **Schema First**: All data models are defined in the `schema.prisma` file
2. **Type Safety**: Auto-generated client provides complete type support
3. **Simplified Relations**: Use `include` and `select` to easily handle related data
4. **Transaction Support**: Nested writes, batch transactions, and interactive transactions cover different scenarios
5. **Migration Management**: `prisma migrate` commands manage database schema changes
6. **Framework Friendly**: Seamless integration with Next.js, NestJS, Express, and other frameworks

### Further Learning

Continue exploring Prisma's ecosystem, including:

- **Prisma Accelerate**: Global edge caching and connection pooling
- **Prisma Pulse**: Real-time data synchronization
- **Prisma Studio**: Visual database management
- **Prisma Data Platform**: Managed database services

Stay updated with Prisma's latest features and best practices to build high-performance modern applications.

### Related Resources

- [Prisma Official Documentation](https://www.prisma.io/docs)
- [Prisma GitHub Repository](https://github.com/prisma/prisma)
- [Prisma Examples](https://github.com/prisma/prisma-examples)
- [Prisma Blog](https://www.prisma.io/blog)
