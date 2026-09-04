---
title: MongoDB Complete Guide
description: Master MongoDB for flexible document database solutions
track: backend
section: databases
difficulty: intermediate
tags:
  - MongoDB
  - NoSQL
  - Document Database
  - Database
status: imported
origin: old/src/content/docs/backend/mongodb.en.md
divergence: 0.299
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 15
  lastUpdated: 2026-01-07
---

MongoDB is one of the most popular NoSQL databases, designed to handle large volumes of unstructured and semi-structured data. Its flexible document model, horizontal scalability, and powerful query capabilities make it an excellent choice for modern applications. This comprehensive guide will walk you through MongoDB fundamentals, advanced features, and best practices for building robust database solutions.

## MongoDB vs Relational Databases

Understanding the fundamental differences between MongoDB and traditional relational databases is crucial for making informed architectural decisions.

### Data Model Comparison

| Aspect | MongoDB | Relational Database |
|--------|---------|---------------------|
| Data Structure | Documents (JSON/BSON) | Tables with Rows |
| Schema | Flexible (Schema-less) | Fixed Schema |
| Relationships | Embedded Documents or References | Foreign Keys and Joins |
| Scalability | Horizontal (Sharding) | Primarily Vertical |
| Transactions | Multi-document ACID (4.0+) | Full ACID Support |
| Query Language | MQL (MongoDB Query Language) | SQL |

### When to Choose MongoDB

MongoDB excels in scenarios where:

- **Flexible Schema Requirements**: Your data structure evolves frequently or varies between records
- **High Write Throughput**: Applications requiring rapid data ingestion
- **Horizontal Scalability**: Need to distribute data across multiple servers
- **Document-Centric Data**: Natural fit for JSON-like data structures
- **Rapid Development**: Agile projects benefiting from schema flexibility

### When to Choose Relational Databases

Relational databases are preferable when:

- **Complex Transactions**: Financial systems requiring strict ACID guarantees
- **Structured Data**: Well-defined, stable schemas with complex relationships
- **Complex Joins**: Frequent multi-table queries with intricate relationships
- **Reporting and Analytics**: Traditional BI tools and reporting requirements

---

## Document Model

The document model is the foundation of MongoDB's flexibility and power. Understanding how to design effective document schemas is essential for building performant applications.

### BSON Document Structure

MongoDB stores data as BSON (Binary JSON) documents, which support rich data types beyond standard JSON:

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  profile: {
    bio: "Software Developer",
    skills: ["JavaScript", "Python", "MongoDB"],
    social: {
      twitter: "@johndoe",
      github: "johndoe"
    }
  },
  orders: [
    { productId: ObjectId("..."), quantity: 2, price: 29.99 },
    { productId: ObjectId("..."), quantity: 1, price: 49.99 }
  ],
  metadata: {
    lastLogin: ISODate("2024-01-14T08:00:00Z"),
    loginCount: NumberInt(42)
  }
}
```

### Data Types

MongoDB supports a rich set of data types:

| Type | Description | Example |
|------|-------------|---------|
| String | UTF-8 encoded text | `"Hello World"` |
| Number | Integer or Double | `42`, `3.14` |
| Boolean | True or False | `true`, `false` |
| Date | UTC datetime | `ISODate("2024-01-15")` |
| ObjectId | 12-byte unique identifier | `ObjectId("...")` |
| Array | Ordered list of values | `[1, 2, 3]` |
| Object | Embedded document | `{ key: "value" }` |
| Binary | Binary data | `BinData(0, "...")` |
| Null | Null value | `null` |
| Decimal128 | High-precision decimal | `NumberDecimal("9.99")` |

### Schema Design Patterns

#### Embedded Documents (Denormalization)

Embed related data within a single document for frequently accessed together data:

```javascript
// User with embedded address - good for 1:1 or 1:few relationships
{
  _id: ObjectId("..."),
  name: "Jane Smith",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  }
}
```

#### References (Normalization)

Use references when data is accessed independently or relationships are many-to-many:

```javascript
// Order referencing User and Products
{
  _id: ObjectId("..."),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  products: [
    { productId: ObjectId("..."), quantity: 2 },
    { productId: ObjectId("..."), quantity: 1 }
  ],
  totalAmount: 129.97,
  status: "shipped"
}
```

#### Hybrid Approach

Combine embedding and referencing based on access patterns:

```javascript
// Blog post with embedded author summary but referenced full author
{
  _id: ObjectId("..."),
  title: "MongoDB Best Practices",
  content: "...",
  author: {
    _id: ObjectId("..."),  // Reference for full lookup
    name: "John Doe",       // Embedded for display
    avatar: "avatar.jpg"    // Embedded for display
  },
  tags: ["mongodb", "database", "nosql"],
  comments: [
    { userId: ObjectId("..."), text: "Great article!", createdAt: ISODate("...") }
  ]
}
```

---

## CRUD Operations

CRUD (Create, Read, Update, Delete) operations form the foundation of database interactions. MongoDB provides a rich API for performing these operations.

### Create Operations

```javascript
// Insert a single document
db.users.insertOne({
  name: "Alice Johnson",
  email: "alice@example.com",
  age: 28,
  createdAt: new Date()
});

// Insert multiple documents
db.users.insertMany([
  { name: "Bob Wilson", email: "bob@example.com", age: 35 },
  { name: "Carol Davis", email: "carol@example.com", age: 42 }
]);

// Insert with custom _id
db.products.insertOne({
  _id: "PROD-001",
  name: "Wireless Mouse",
  price: 29.99,
  category: "Electronics"
});
```

### Read Operations

```javascript
// Find all documents
db.users.find();

// Find with query filter
db.users.find({ age: { $gte: 30 } });

// Find one document
db.users.findOne({ email: "alice@example.com" });

// Projection - include specific fields
db.users.find(
  { age: { $gte: 25 } },
  { name: 1, email: 1, _id: 0 }
);

// Query operators
db.products.find({
  $and: [
    { price: { $gte: 10, $lte: 100 } },
    { category: { $in: ["Electronics", "Accessories"] } }
  ]
});

// Array queries
db.users.find({ "profile.skills": "MongoDB" });
db.users.find({ "profile.skills": { $all: ["JavaScript", "Python"] } });

// Sorting and limiting
db.products.find()
  .sort({ price: -1 })  // Descending
  .limit(10)
  .skip(20);  // Pagination

// Count documents
db.users.countDocuments({ age: { $gte: 30 } });

// Distinct values
db.products.distinct("category");
```

### Update Operations

```javascript
// Update one document
db.users.updateOne(
  { email: "alice@example.com" },
  {
    $set: { age: 29 },
    $currentDate: { lastModified: true }
  }
);

// Update multiple documents
db.users.updateMany(
  { status: "inactive" },
  { $set: { status: "archived" } }
);

// Replace entire document
db.users.replaceOne(
  { _id: ObjectId("...") },
  { name: "New Name", email: "new@example.com", age: 30 }
);

// Upsert - insert if not exists
db.users.updateOne(
  { email: "new@example.com" },
  { $set: { name: "New User", age: 25 } },
  { upsert: true }
);

// Array update operators
db.users.updateOne(
  { _id: ObjectId("...") },
  {
    $push: { "profile.skills": "GraphQL" },
    $addToSet: { tags: "developer" }  // Only adds if not exists
  }
);

// Update array element
db.users.updateOne(
  { _id: ObjectId("..."), "orders.productId": ObjectId("...") },
  { $set: { "orders.$.quantity": 5 } }
);

// Increment numeric values
db.products.updateOne(
  { _id: "PROD-001" },
  { $inc: { stock: -1, sold: 1 } }
);
```

### Delete Operations

```javascript
// Delete one document
db.users.deleteOne({ email: "alice@example.com" });

// Delete multiple documents
db.users.deleteMany({ status: "archived" });

// Delete all documents in collection
db.logs.deleteMany({});

// Find and delete (returns deleted document)
db.tasks.findOneAndDelete(
  { status: "completed" },
  { sort: { completedAt: 1 } }
);
```

---

## Indexing

Indexes are crucial for query performance in MongoDB. Without proper indexes, MongoDB must perform a collection scan, examining every document to find matches.

### Index Types

#### Single Field Index

```javascript
// Create ascending index
db.users.createIndex({ email: 1 });

// Create descending index
db.products.createIndex({ price: -1 });

// Create unique index
db.users.createIndex({ email: 1 }, { unique: true });
```

#### Compound Index

```javascript
// Compound index on multiple fields
db.orders.createIndex({ userId: 1, createdAt: -1 });

// Order matters! This index supports:
// - Queries on userId alone
// - Queries on userId AND createdAt
// - But NOT queries on createdAt alone
```

#### Text Index

```javascript
// Create text index for full-text search
db.articles.createIndex({ title: "text", content: "text" });

// Weighted text index
db.articles.createIndex(
  { title: "text", content: "text", tags: "text" },
  { weights: { title: 10, content: 5, tags: 1 } }
);

// Text search query
db.articles.find({ $text: { $search: "mongodb database" } });

// Text search with score
db.articles.find(
  { $text: { $search: "mongodb" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });
```

#### Geospatial Index

```javascript
// 2dsphere index for geographic data
db.locations.createIndex({ coordinates: "2dsphere" });

// Store location data
db.locations.insertOne({
  name: "Central Park",
  coordinates: {
    type: "Point",
    coordinates: [-73.965355, 40.782865]  // [longitude, latitude]
  }
});

// Find nearby locations
db.locations.find({
  coordinates: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.97, 40.77] },
      $maxDistance: 5000  // meters
    }
  }
});
```

#### Hashed Index

```javascript
// Hashed index for sharding
db.users.createIndex({ odot: "hashed" });
```

### Index Options

```javascript
// Partial index - only index documents matching filter
db.orders.createIndex(
  { createdAt: 1 },
  { partialFilterExpression: { status: "active" } }
);

// Sparse index - only index documents with the field
db.users.createIndex(
  { phoneNumber: 1 },
  { sparse: true }
);

// TTL index - automatically delete documents
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }  // Delete after 1 hour
);

// Background index creation (deprecated in 4.2+, now default)
db.largeCollection.createIndex(
  { field: 1 },
  { background: true }
);
```

### Index Management

```javascript
// List all indexes
db.users.getIndexes();

// Drop index by name
db.users.dropIndex("email_1");

// Drop all indexes except _id
db.users.dropIndexes();

// Explain query execution
db.users.find({ email: "test@example.com" }).explain("executionStats");

// Check index usage statistics
db.users.aggregate([{ $indexStats: {} }]);
```

### Index Best Practices

1. **Create indexes for query patterns**: Analyze your queries and create indexes accordingly
2. **Use compound indexes wisely**: Order fields by equality, sort, range (ESR rule)
3. **Avoid over-indexing**: Each index adds write overhead
4. **Monitor index usage**: Remove unused indexes
5. **Consider index size**: Indexes consume memory

---

## Aggregation Pipeline

The aggregation pipeline is MongoDB's powerful framework for data transformation and analysis. It processes documents through a sequence of stages, each transforming the data.

### Pipeline Stages

```javascript
// Basic aggregation pipeline structure
db.orders.aggregate([
  { $match: { status: "completed" } },      // Filter documents
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },  // Group and aggregate
  { $sort: { total: -1 } },                 // Sort results
  { $limit: 10 }                            // Limit output
]);
```

### Common Aggregation Stages

#### $match - Filter Documents

```javascript
db.orders.aggregate([
  {
    $match: {
      status: "completed",
      createdAt: { $gte: ISODate("2024-01-01") }
    }
  }
]);
```

#### $group - Group and Aggregate

```javascript
db.orders.aggregate([
  {
    $group: {
      _id: "$category",
      totalSales: { $sum: "$amount" },
      avgAmount: { $avg: "$amount" },
      count: { $sum: 1 },
      products: { $push: "$productName" },
      uniqueCustomers: { $addToSet: "$customerId" }
    }
  }
]);
```

#### $project - Shape Output Documents

```javascript
db.users.aggregate([
  {
    $project: {
      fullName: { $concat: ["$firstName", " ", "$lastName"] },
      email: 1,
      age: 1,
      isAdult: { $gte: ["$age", 18] },
      yearOfBirth: { $subtract: [2024, "$age"] }
    }
  }
]);
```

#### $lookup - Join Collections

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "customer"
    }
  },
  { $unwind: "$customer" },
  {
    $project: {
      orderNumber: 1,
      amount: 1,
      customerName: "$customer.name",
      customerEmail: "$customer.email"
    }
  }
]);

// Advanced lookup with pipeline
db.orders.aggregate([
  {
    $lookup: {
      from: "products",
      let: { productIds: "$items.productId" },
      pipeline: [
        { $match: { $expr: { $in: ["$_id", "$$productIds"] } } },
        { $project: { name: 1, price: 1 } }
      ],
      as: "productDetails"
    }
  }
]);
```

#### $unwind - Deconstruct Arrays

```javascript
db.orders.aggregate([
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.productId",
      totalQuantity: { $sum: "$items.quantity" },
      orderCount: { $sum: 1 }
    }
  }
]);

// Preserve null and empty arrays
db.orders.aggregate([
  {
    $unwind: {
      path: "$items",
      preserveNullAndEmptyArrays: true
    }
  }
]);
```

#### $facet - Multiple Pipelines

```javascript
db.products.aggregate([
  {
    $facet: {
      "byCategory": [
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ],
      "priceStats": [
        {
          $group: {
            _id: null,
            avgPrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" }
          }
        }
      ],
      "topRated": [
        { $sort: { rating: -1 } },
        { $limit: 5 },
        { $project: { name: 1, rating: 1 } }
      ]
    }
  }
]);
```

#### $bucket and $bucketAuto - Histogram Analysis

```javascript
// Manual bucket boundaries
db.users.aggregate([
  {
    $bucket: {
      groupBy: "$age",
      boundaries: [0, 18, 30, 45, 60, 100],
      default: "Other",
      output: {
        count: { $sum: 1 },
        users: { $push: "$name" }
      }
    }
  }
]);

// Automatic bucket distribution
db.products.aggregate([
  {
    $bucketAuto: {
      groupBy: "$price",
      buckets: 5,
      output: {
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" }
      }
    }
  }
]);
```

### Window Functions (MongoDB 5.0+)

```javascript
db.sales.aggregate([
  {
    $setWindowFields: {
      partitionBy: "$region",
      sortBy: { date: 1 },
      output: {
        runningTotal: {
          $sum: "$amount",
          window: { documents: ["unbounded", "current"] }
        },
        movingAvg: {
          $avg: "$amount",
          window: { documents: [-2, 2] }
        },
        rank: { $rank: {} }
      }
    }
  }
]);
```

---

## Transactions

MongoDB supports multi-document ACID transactions starting from version 4.0 for replica sets and 4.2 for sharded clusters.

### Transaction Basics

```javascript
// Start a session
const session = db.getMongo().startSession();

// Start transaction
session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" }
});

try {
  const accounts = session.getDatabase("bank").accounts;

  // Transfer money between accounts
  accounts.updateOne(
    { _id: "account1" },
    { $inc: { balance: -100 } },
    { session }
  );

  accounts.updateOne(
    { _id: "account2" },
    { $inc: { balance: 100 } },
    { session }
  );

  // Commit transaction
  session.commitTransaction();
  print("Transaction committed successfully");
} catch (error) {
  // Abort transaction on error
  session.abortTransaction();
  print("Transaction aborted: " + error.message);
} finally {
  session.endSession();
}
```

### Transaction with Node.js Driver

```javascript
const { MongoClient } = require('mongodb');

async function transferFunds(client, fromAccount, toAccount, amount) {
  const session = client.startSession();

  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };

  try {
    await session.withTransaction(async () => {
      const accounts = client.db('bank').collection('accounts');

      // Debit from source account
      const debitResult = await accounts.updateOne(
        { _id: fromAccount, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { session }
      );

      if (debitResult.modifiedCount !== 1) {
        throw new Error('Insufficient funds');
      }

      // Credit to destination account
      await accounts.updateOne(
        { _id: toAccount },
        { $inc: { balance: amount } },
        { session }
      );

      // Log the transaction
      await client.db('bank').collection('transactions').insertOne({
        from: fromAccount,
        to: toAccount,
        amount: amount,
        timestamp: new Date()
      }, { session });

    }, transactionOptions);

    console.log('Transaction completed successfully');
  } catch (error) {
    console.error('Transaction failed:', error.message);
    throw error;
  } finally {
    await session.endSession();
  }
}
```

### Transaction Considerations

- **Performance**: Transactions add overhead; use only when necessary
- **Timeout**: Default transaction timeout is 60 seconds
- **Size Limits**: Keep transactions small to avoid lock contention
- **Retry Logic**: Implement retry logic for transient errors

---

## Replication and Sharding

MongoDB provides two key mechanisms for high availability and horizontal scaling: replication and sharding.

### Replica Sets

A replica set is a group of MongoDB instances that maintain the same data set, providing redundancy and high availability.

```javascript
// Check replica set status
rs.status();

// Initiate replica set
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongodb0.example.com:27017" },
    { _id: 1, host: "mongodb1.example.com:27017" },
    { _id: 2, host: "mongodb2.example.com:27017" }
  ]
});

// Add a member
rs.add("mongodb3.example.com:27017");

// Add an arbiter (voting member without data)
rs.addArb("arbiter.example.com:27017");

// Configure read preference
db.getMongo().setReadPref("secondaryPreferred");
```

#### Read Preferences

| Mode | Description |
|------|-------------|
| primary | Always read from primary (default) |
| primaryPreferred | Primary if available, otherwise secondary |
| secondary | Always read from secondary |
| secondaryPreferred | Secondary if available, otherwise primary |
| nearest | Read from member with lowest network latency |

#### Write Concerns

```javascript
// Write with majority acknowledgment
db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority", j: true, wtimeout: 5000 } }
);
```

### Sharding

Sharding distributes data across multiple machines, enabling horizontal scaling for large datasets.

#### Sharding Architecture

- **Shard**: Contains a subset of the sharded data (each shard is a replica set)
- **Config Servers**: Store cluster metadata and configuration
- **mongos**: Query router that directs operations to appropriate shards

#### Shard Key Selection

```javascript
// Enable sharding on database
sh.enableSharding("myDatabase");

// Shard collection with hashed key (even distribution)
sh.shardCollection("myDatabase.users", { odot: "hashed" });

// Shard collection with ranged key (for range queries)
sh.shardCollection("myDatabase.logs", { timestamp: 1 });

// Compound shard key
sh.shardCollection("myDatabase.orders", { customerId: 1, orderDate: 1 });
```

#### Shard Key Considerations

1. **Cardinality**: High cardinality enables better distribution
2. **Write Distribution**: Avoid monotonically increasing keys (causes hot spots)
3. **Query Isolation**: Include fields frequently used in queries
4. **Immutability**: Shard key values cannot be changed (prior to 4.2)

```javascript
// Check sharding status
sh.status();

// Get chunk distribution
db.collection.getShardDistribution();

// Manual chunk splitting
sh.splitAt("myDatabase.users", { odot: "user_50000" });

// Move chunk to specific shard
sh.moveChunk("myDatabase.users", { odot: "user_50000" }, "shard0002");
```

---

## Mongoose ODM

Mongoose is the most popular Object Document Mapper (ODM) for MongoDB in Node.js, providing schema validation, middleware, and a rich query API.

### Schema Definition

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define schema with validation
const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false  // Exclude from queries by default
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  profile: {
    bio: String,
    avatar: String,
    social: {
      twitter: String,
      github: String
    }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,  // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create model
const User = mongoose.model('User', userSchema);
```

### Virtuals and Methods

```javascript
// Virtual property
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual populate
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author'
});

// Instance method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Query helper
userSchema.query.active = function() {
  return this.where({ isActive: true });
};
```

### Middleware (Hooks)

```javascript
// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only hash password if modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Post-save middleware
userSchema.post('save', function(doc, next) {
  console.log(`User ${doc.email} was saved`);
  next();
});

// Pre-find middleware
userSchema.pre(/^find/, function(next) {
  // Exclude inactive users by default
  this.find({ isActive: { $ne: false } });
  next();
});

// Pre-remove middleware
userSchema.pre('remove', async function(next) {
  // Delete related documents
  await Post.deleteMany({ author: this._id });
  next();
});
```

### Queries and Population

```javascript
// Basic queries
const user = await User.findById(id);
const users = await User.find({ role: 'admin' });
const user = await User.findOne({ email: 'test@example.com' });

// Query with chaining
const users = await User
  .find({ age: { $gte: 18 } })
  .select('name email')
  .sort({ createdAt: -1 })
  .limit(10)
  .skip(20);

// Population
const postSchema = new Schema({
  title: String,
  content: String,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

// Populate references
const post = await Post
  .findById(postId)
  .populate('author', 'name email')
  .populate({
    path: 'comments.user',
    select: 'name avatar'
  });

// Nested population
const post = await Post
  .findById(postId)
  .populate({
    path: 'author',
    populate: { path: 'followers', select: 'name' }
  });
```

### Connection Management

```javascript
const mongoose = require('mongoose');

// Connection options
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4  // Use IPv4
};

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myapp', options)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Connection error:', err));

// Connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
```

---

## Interview Key Points

### Common Interview Questions

1. **What is the difference between MongoDB and relational databases?**
   - Document-based vs table-based data model
   - Flexible schema vs fixed schema
   - Horizontal scaling (sharding) vs vertical scaling
   - Embedded documents vs foreign key relationships

2. **Explain the document model and when to embed vs reference.**
   - Embed for: one-to-one, one-to-few relationships; data accessed together
   - Reference for: one-to-many, many-to-many relationships; independent access
   - Consider document size limit (16MB) and update patterns

3. **How do indexes work in MongoDB?**
   - B-tree structure for most indexes
   - Support for compound, text, geospatial, and hashed indexes
   - Indexes improve read performance but add write overhead
   - Use explain() to analyze query performance

4. **What is the aggregation pipeline?**
   - Series of stages that transform documents
   - Stages: $match, $group, $project, $lookup, $unwind, etc.
   - More powerful and flexible than simple queries
   - Can perform complex data transformations and analytics

5. **How does MongoDB ensure high availability?**
   - Replica sets with automatic failover
   - Primary handles writes, secondaries replicate data
   - Arbiter nodes can break ties in elections
   - Configurable read preferences and write concerns

6. **Explain sharding in MongoDB.**
   - Horizontal partitioning across multiple servers
   - Shard key determines data distribution
   - mongos routes queries to appropriate shards
   - Config servers store cluster metadata

7. **What are MongoDB transactions and their limitations?**
   - Multi-document ACID transactions (4.0+)
   - Require replica sets or sharded clusters
   - Add performance overhead
   - 60-second default timeout

8. **How do you optimize MongoDB performance?**
   - Proper index design based on query patterns
   - Schema design optimized for access patterns
   - Use explain() to identify slow queries
   - Monitor with MongoDB Atlas or self-hosted tools
   - Consider read preferences for read-heavy workloads

### Performance Optimization Checklist

- [ ] Create indexes for frequently queried fields
- [ ] Use compound indexes following ESR (Equality, Sort, Range) rule
- [ ] Avoid large documents (stay well under 16MB limit)
- [ ] Use projection to return only needed fields
- [ ] Implement pagination for large result sets
- [ ] Use aggregation pipeline for complex data processing
- [ ] Monitor slow queries with profiler
- [ ] Configure appropriate read/write concerns

---

## Further Reading

### Official Resources

- [MongoDB Official Documentation](https://docs.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

### Recommended Books

- *MongoDB: The Definitive Guide* by Shannon Bradshaw
- *MongoDB in Action* by Kyle Banker
- *Mongoose for Application Development* by Simon Holmes

### Online Learning

- [MongoDB University](https://university.mongodb.com/) - Official free certification courses
- [MongoDB Developer Center](https://www.mongodb.com/developer/)
- [Mongoose Getting Started Guide](https://mongoosejs.com/docs/guide.html)

### Tools and Utilities

- **MongoDB Compass**: Official GUI for MongoDB
- **MongoDB Atlas**: Fully managed cloud database service
- **Studio 3T**: Advanced MongoDB IDE
- **Mongosh**: Modern MongoDB shell
- **Percona Server for MongoDB**: Enhanced open-source distribution

### Advanced Topics

- Change Streams for real-time data processing
- MongoDB Atlas Search for full-text search
- Time Series Collections (MongoDB 5.0+)
- Queryable Encryption (MongoDB 7.0+)
- Vector Search for AI applications

---

MongoDB's flexible document model, powerful query capabilities, and horizontal scalability make it an excellent choice for modern applications. Understanding its core concepts, from document design to aggregation pipelines, and knowing when to use features like transactions and sharding, will help you build robust, performant database solutions. Continue exploring the official documentation and MongoDB University courses to deepen your expertise and stay current with the latest features and best practices.
