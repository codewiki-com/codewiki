---
title: MongoDB 完全指南
description: 掌握MongoDB文档数据库，构建灵活的数据存储方案
track: backend
section: databases
difficulty: intermediate
tags:
  - MongoDB
  - NoSQL
  - 文档数据库
  - 数据库
status: imported
origin: old/src/content/docs/backend/mongodb.zh.md
divergence: 0.299
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 15
  lastUpdated: 2026-01-07
---

MongoDB 是当今最流行的 NoSQL 文档数据库，以其灵活的数据模型、强大的查询能力和优秀的水平扩展性著称。本文将全面介绍 MongoDB 的核心概念、操作技巧和最佳实践，帮助开发者从入门到精通这一强大的数据库系统。

## MongoDB vs 关系型数据库

### 数据模型对比

MongoDB 和传统关系型数据库（如 MySQL、PostgreSQL）在数据模型上存在根本性差异。理解这些差异是选择合适数据库的关键。

| 特性 | MongoDB | 关系型数据库 |
|-----|---------|-------------|
| 数据模型 | 文档（Document） | 表（Table） |
| 数据单元 | 文档（JSON/BSON） | 行（Row） |
| 数据结构 | 灵活的 Schema | 固定 Schema |
| 关系表达 | 嵌入或引用 | 外键关联 |
| 查询语言 | MongoDB Query Language | SQL |
| 事务支持 | 多文档 ACID（4.0+） | 完整 ACID |
| 扩展方式 | 水平扩展（分片） | 垂直扩展为主 |

### 术语对照

关系型数据库与 MongoDB 术语对应关系：

- Database → Database
- Table → Collection
- Row → Document
- Column → Field
- Index → Index
- Primary Key → _id
- Foreign Key → Reference/$lookup
- JOIN → $lookup/嵌入文档

### 何时选择 MongoDB

**适合场景：**
- 数据结构灵活多变，Schema 经常调整
- 需要存储半结构化或非结构化数据
- 高并发读写，需要水平扩展
- 快速开发迭代的敏捷项目
- 内容管理系统、用户画像、日志分析等场景

**不适合场景：**
- 复杂的多表关联查询频繁
- 对事务一致性要求极高的金融场景
- 数据结构高度规范化且稳定
- 需要复杂报表和 BI 分析

### 核心优势

```javascript
// MongoDB 文档示例 - 用户订单
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "username": "john_doe",
  "email": "john@example.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg"
  },
  "orders": [
    {
      "orderId": "ORD-001",
      "items": [
        { "product": "iPhone 15", "quantity": 1, "price": 999 }
      ],
      "total": 999,
      "status": "delivered"
    }
  ],
  "tags": ["premium", "verified"],
  "createdAt": ISODate("2024-01-15T10:30:00Z")
}
```

这个单一文档包含了在关系型数据库中可能需要 4-5 张表才能表达的信息，大大简化了数据访问模式。

## 文档模型与数据建模

### BSON 数据类型

MongoDB 使用 BSON（Binary JSON）格式存储数据，支持丰富的数据类型：

```javascript
{
  // 基本类型
  "string": "Hello World",
  "number": 42,
  "double": 3.14159,
  "boolean": true,
  "null": null,

  // 日期和时间
  "date": ISODate("2024-01-15T10:30:00Z"),
  "timestamp": Timestamp(1705314600, 1),

  // 二进制数据
  "binary": BinData(0, "SGVsbG8gV29ybGQ="),

  // ObjectId（默认主键类型）
  "_id": ObjectId("507f1f77bcf86cd799439011"),

  // 数组
  "array": [1, 2, 3, "four", { "nested": true }],

  // 嵌套文档
  "document": {
    "key": "value",
    "nested": { "deep": "data" }
  },

  // Decimal128（高精度小数）
  "decimal": NumberDecimal("9999999.99")
}
```

### 嵌入式文档 vs 引用

数据建模的核心决策是选择嵌入还是引用。两种方式各有优劣：

**嵌入式文档（Embedding）：**

```javascript
// 嵌入式设计 - 博客文章和评论
{
  "_id": ObjectId("..."),
  "title": "MongoDB 入门教程",
  "content": "...",
  "author": {
    "name": "张三",
    "email": "zhang@example.com"
  },
  "comments": [
    {
      "user": "李四",
      "text": "写得很好！",
      "createdAt": ISODate("2024-01-15T10:30:00Z")
    },
    {
      "user": "王五",
      "text": "受益匪浅",
      "createdAt": ISODate("2024-01-15T11:00:00Z")
    }
  ]
}
```

**引用式设计（Referencing）：**

```javascript
// 引用式设计 - 用户集合
{
  "_id": ObjectId("user001"),
  "name": "张三",
  "email": "zhang@example.com"
}

// 订单集合
{
  "_id": ObjectId("order001"),
  "userId": ObjectId("user001"),  // 引用用户
  "items": [...],
  "total": 1999
}
```

### 建模决策指南

| 考虑因素 | 选择嵌入 | 选择引用 |
|---------|---------|---------|
| 数据关系 | 一对一、一对少 | 一对多、多对多 |
| 访问模式 | 总是一起访问 | 经常单独访问 |
| 数据大小 | 嵌入数据较小 | 嵌入数据可能很大 |
| 更新频率 | 嵌入数据不常变 | 需要独立更新 |
| 文档大小 | 不会超过 16MB | 可能超过限制 |

### 高级建模模式

**子集模式（Subset Pattern）：**

```javascript
// 商品文档 - 只嵌入最近的评论
{
  "_id": ObjectId("product001"),
  "name": "MacBook Pro",
  "price": 14999,
  "recentReviews": [
    // 只保留最新的 10 条评论
    { "user": "用户A", "rating": 5, "text": "很棒" },
    { "user": "用户B", "rating": 4, "text": "不错" }
  ],
  "totalReviews": 1523
}

// 完整评论放在单独的集合
// reviews 集合
{
  "_id": ObjectId("review001"),
  "productId": ObjectId("product001"),
  "user": "用户A",
  "rating": 5,
  "text": "很棒",
  "createdAt": ISODate("...")
}
```

**预计算模式（Computed Pattern）：**

```javascript
// 预计算统计数据
{
  "_id": ObjectId("article001"),
  "title": "MongoDB 性能优化",
  "content": "...",
  // 预计算的统计字段
  "stats": {
    "viewCount": 15234,
    "likeCount": 892,
    "commentCount": 156,
    "lastUpdated": ISODate("2024-01-15T10:30:00Z")
  }
}
```

## CRUD 操作详解

### 创建操作（Create）

```javascript
// 插入单个文档
db.users.insertOne({
  name: "张三",
  email: "zhang@example.com",
  age: 28,
  tags: ["developer", "nodejs"],
  createdAt: new Date()
});

// 插入多个文档
db.users.insertMany([
  { name: "李四", email: "li@example.com", age: 25 },
  { name: "王五", email: "wang@example.com", age: 32 }
]);

// 插入时指定 _id
db.products.insertOne({
  _id: "SKU-001",
  name: "iPhone 15",
  price: 6999,
  stock: 100
});
```

### 读取操作（Read）

```javascript
// 查找单个文档
db.users.findOne({ email: "zhang@example.com" });

// 查找多个文档
db.users.find({ age: { $gte: 25 } });

// 投影 - 只返回指定字段
db.users.find(
  { age: { $gte: 25 } },
  { name: 1, email: 1, _id: 0 }
);

// 排序和分页
db.users.find()
  .sort({ createdAt: -1 })
  .skip(10)
  .limit(10);

// 统计数量
db.users.countDocuments({ age: { $gte: 25 } });

// 去重
db.users.distinct("tags");
```

### 查询操作符

```javascript
// 比较操作符
db.products.find({
  price: { $gt: 100 },      // 大于
  stock: { $gte: 10 },      // 大于等于
  category: { $ne: "food" }, // 不等于
  status: { $in: ["active", "pending"] }  // 在数组中
});

// 逻辑操作符
db.users.find({
  $and: [
    { age: { $gte: 18 } },
    { age: { $lte: 60 } }
  ]
});

db.users.find({
  $or: [
    { status: "premium" },
    { orders: { $gt: 10 } }
  ]
});

// 元素操作符
db.users.find({
  email: { $exists: true },
  age: { $type: "number" }
});

// 数组操作符
db.articles.find({
  tags: { $all: ["mongodb", "nosql"] },  // 包含所有
  comments: { $size: 5 },                 // 数组长度
  "scores.0": { $gt: 90 }                 // 数组索引
});

// $elemMatch - 数组元素匹配
db.orders.find({
  items: {
    $elemMatch: {
      product: "iPhone",
      quantity: { $gte: 2 }
    }
  }
});
```

### 更新操作（Update）

```javascript
// 更新单个文档
db.users.updateOne(
  { email: "zhang@example.com" },
  { $set: { age: 29, updatedAt: new Date() } }
);

// 更新多个文档
db.users.updateMany(
  { status: "inactive" },
  { $set: { status: "archived" } }
);

// 更新操作符
db.users.updateOne(
  { _id: ObjectId("...") },
  {
    $set: { name: "新名字" },        // 设置字段
    $unset: { tempField: "" },       // 删除字段
    $inc: { loginCount: 1 },         // 自增
    $mul: { score: 1.5 },            // 乘法
    $min: { minScore: 60 },          // 取最小值
    $max: { maxScore: 100 },         // 取最大值
    $currentDate: { lastLogin: true } // 设置当前时间
  }
);

// 数组更新操作符
db.users.updateOne(
  { _id: ObjectId("...") },
  {
    $push: { tags: "newTag" },              // 添加元素
    $addToSet: { roles: "admin" },          // 添加（去重）
    $pull: { tags: "oldTag" },              // 删除匹配元素
    $pop: { notifications: 1 }              // 删除最后一个
  }
);

// $push 高级用法
db.users.updateOne(
  { _id: ObjectId("...") },
  {
    $push: {
      logs: {
        $each: [{ action: "login" }, { action: "view" }],
        $sort: { timestamp: -1 },
        $slice: -100  // 只保留最新 100 条
      }
    }
  }
);

// upsert - 不存在则插入
db.stats.updateOne(
  { date: "2024-01-15" },
  { $inc: { pageViews: 1 } },
  { upsert: true }
);

// findOneAndUpdate - 原子操作并返回文档
const result = db.counters.findOneAndUpdate(
  { _id: "orderId" },
  { $inc: { seq: 1 } },
  { returnDocument: "after", upsert: true }
);
```

### 删除操作（Delete）

```javascript
// 删除单个文档
db.users.deleteOne({ email: "test@example.com" });

// 删除多个文档
db.logs.deleteMany({
  createdAt: { $lt: ISODate("2023-01-01") }
});

// findOneAndDelete - 删除并返回
const deleted = db.tasks.findOneAndDelete(
  { status: "pending" },
  { sort: { priority: -1 } }  // 删除优先级最高的
);

// 删除集合中所有文档
db.tempData.deleteMany({});

// 删除整个集合
db.tempCollection.drop();
```

### 批量写入操作

```javascript
// bulkWrite - 混合批量操作
db.inventory.bulkWrite([
  {
    insertOne: {
      document: { item: "新商品", qty: 100 }
    }
  },
  {
    updateOne: {
      filter: { item: "商品A" },
      update: { $inc: { qty: -10 } }
    }
  },
  {
    updateMany: {
      filter: { status: "pending" },
      update: { $set: { status: "processed" } }
    }
  },
  {
    deleteOne: {
      filter: { item: "过期商品" }
    }
  },
  {
    replaceOne: {
      filter: { item: "商品B" },
      replacement: { item: "商品B", qty: 50, updated: true }
    }
  }
], { ordered: true });  // ordered: false 可并行执行
```

## 索引设计与优化

索引是 MongoDB 查询性能优化的核心。合理的索引设计可以将查询时间从秒级降低到毫秒级。

### 索引类型

```javascript
// 单字段索引
db.users.createIndex({ email: 1 });  // 升序
db.users.createIndex({ age: -1 });   // 降序

// 复合索引
db.orders.createIndex({ userId: 1, createdAt: -1 });

// 唯一索引
db.users.createIndex(
  { email: 1 },
  { unique: true }
);

// 稀疏索引（只索引存在该字段的文档）
db.users.createIndex(
  { phone: 1 },
  { sparse: true }
);

// 部分索引（只索引满足条件的文档）
db.orders.createIndex(
  { status: 1 },
  { partialFilterExpression: { status: "active" } }
);

// TTL 索引（自动过期删除）
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }  // 1小时后过期
);

// 文本索引
db.articles.createIndex({
  title: "text",
  content: "text"
});

// 地理空间索引
db.locations.createIndex({ coordinates: "2dsphere" });

// 哈希索引
db.users.createIndex({ uniqueId: "hashed" });
```

### 复合索引优化

```javascript
// ESR 原则：Equality, Sort, Range
// 1. 等值查询字段放前面
// 2. 排序字段其次
// 3. 范围查询字段放后面

// 查询：查找特定用户最近的订单
db.orders.find({
  userId: ObjectId("..."),        // Equality
  status: "completed"             // Equality
}).sort({ createdAt: -1 });       // Sort

// 最佳索引
db.orders.createIndex({
  userId: 1,
  status: 1,
  createdAt: -1
});

// 带范围查询的情况
db.orders.find({
  userId: ObjectId("..."),        // Equality
  createdAt: { $gte: startDate }  // Range
}).sort({ total: -1 });           // Sort

// 索引设计
db.orders.createIndex({
  userId: 1,
  total: -1,        // Sort 在 Range 前
  createdAt: 1      // Range
});
```

### 索引管理

```javascript
// 查看集合所有索引
db.users.getIndexes();

// 查看索引大小
db.users.stats().indexSizes;

// 分析查询执行计划
db.users.find({ email: "test@example.com" }).explain("executionStats");

// 删除索引
db.users.dropIndex("email_1");
db.users.dropIndexes();  // 删除所有（_id 除外）

// 后台创建索引（不阻塞操作）
db.largeCollection.createIndex(
  { field: 1 },
  { background: true }
);

// 隐藏索引（测试删除索引影响）
db.users.hideIndex("email_1");
db.users.unhideIndex("email_1");
```

### 索引使用分析

```javascript
// explain 输出解读
const plan = db.users.find({
  status: "active",
  age: { $gte: 18 }
}).explain("executionStats");

// 关键指标
// - COLLSCAN：全表扫描（需要优化）
// - IXSCAN：索引扫描（良好）
// - totalDocsExamined：扫描的文档数
// - totalKeysExamined：扫描的索引键数
// - executionTimeMillis：执行时间

// 理想情况：
// totalKeysExamined 约等于 nReturned
// totalDocsExamined 约等于 nReturned
```

## 聚合管道（Aggregation Pipeline）

聚合管道是 MongoDB 最强大的数据处理功能，类似于 SQL 中的 GROUP BY、HAVING、JOIN 等操作的组合。

### 基本聚合阶段

```javascript
// $match - 过滤文档
db.orders.aggregate([
  { $match: { status: "completed" } }
]);

// $project - 投影字段
db.users.aggregate([
  {
    $project: {
      fullName: { $concat: ["$firstName", " ", "$lastName"] },
      email: 1,
      _id: 0
    }
  }
]);

// $group - 分组聚合
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",
      totalOrders: { $sum: 1 },
      totalAmount: { $sum: "$amount" },
      avgAmount: { $avg: "$amount" },
      firstOrder: { $min: "$createdAt" },
      lastOrder: { $max: "$createdAt" }
    }
  }
]);

// $sort - 排序
db.products.aggregate([
  { $sort: { sales: -1, name: 1 } }
]);

// $limit 和 $skip - 分页
db.products.aggregate([
  { $sort: { sales: -1 } },
  { $skip: 20 },
  { $limit: 10 }
]);

// $unwind - 展开数组
db.orders.aggregate([
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.productId",
      totalSold: { $sum: "$items.quantity" }
    }
  }
]);
```

### $lookup - 关联查询

```javascript
// 基本 $lookup
db.orders.aggregate([
  {
    $lookup: {
      from: "users",           // 关联的集合
      localField: "userId",    // 本集合字段
      foreignField: "_id",     // 关联集合字段
      as: "userInfo"           // 输出数组字段名
    }
  },
  { $unwind: "$userInfo" }     // 展开为对象
]);

// 管道式 $lookup（更灵活）
db.orders.aggregate([
  {
    $lookup: {
      from: "products",
      let: { orderItems: "$items" },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ["$_id", "$$orderItems.productId"]
            }
          }
        },
        { $project: { name: 1, price: 1 } }
      ],
      as: "productDetails"
    }
  }
]);
```

### 高级聚合操作

```javascript
// $facet - 多管道并行处理
db.products.aggregate([
  {
    $facet: {
      // 按类别统计
      byCategory: [
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ],
      // 价格统计
      priceStats: [
        {
          $group: {
            _id: null,
            avgPrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" }
          }
        }
      ],
      // 最热门商品
      topProducts: [
        { $sort: { sales: -1 } },
        { $limit: 5 }
      ]
    }
  }
]);

// $bucket - 分桶统计
db.users.aggregate([
  {
    $bucket: {
      groupBy: "$age",
      boundaries: [0, 18, 30, 50, 100],
      default: "unknown",
      output: {
        count: { $sum: 1 },
        avgIncome: { $avg: "$income" }
      }
    }
  }
]);

// $addFields - 添加计算字段
db.orders.aggregate([
  {
    $addFields: {
      totalWithTax: { $multiply: ["$total", 1.1] },
      itemCount: { $size: "$items" },
      orderYear: { $year: "$createdAt" }
    }
  }
]);

// $graphLookup - 递归查询（如组织架构）
db.employees.aggregate([
  {
    $graphLookup: {
      from: "employees",
      startWith: "$managerId",
      connectFromField: "managerId",
      connectToField: "_id",
      as: "reportingChain",
      maxDepth: 5
    }
  }
]);
```

### 聚合表达式

```javascript
// 字符串表达式
db.users.aggregate([
  {
    $project: {
      upperName: { $toUpper: "$name" },
      nameLength: { $strLenCP: "$name" },
      emailDomain: {
        $arrayElemAt: [{ $split: ["$email", "@"] }, 1]
      }
    }
  }
]);

// 日期表达式
db.orders.aggregate([
  {
    $project: {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      dayOfWeek: { $dayOfWeek: "$createdAt" },
      formattedDate: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt"
        }
      }
    }
  }
]);

// 条件表达式
db.products.aggregate([
  {
    $project: {
      name: 1,
      priceCategory: {
        $switch: {
          branches: [
            { case: { $lt: ["$price", 100] }, then: "便宜" },
            { case: { $lt: ["$price", 500] }, then: "中等" },
            { case: { $gte: ["$price", 500] }, then: "昂贵" }
          ],
          default: "未知"
        }
      },
      discountPrice: {
        $cond: {
          if: { $gte: ["$stock", 100] },
          then: { $multiply: ["$price", 0.9] },
          else: "$price"
        }
      }
    }
  }
]);

// 数组表达式
db.orders.aggregate([
  {
    $project: {
      itemCount: { $size: "$items" },
      firstItem: { $arrayElemAt: ["$items", 0] },
      expensiveItems: {
        $filter: {
          input: "$items",
          as: "item",
          cond: { $gt: ["$$item.price", 100] }
        }
      }
    }
  }
]);
```

## 事务支持

MongoDB 4.0 开始支持多文档 ACID 事务，4.2 扩展到分片集群。

### 单副本集事务

```javascript
// Node.js 驱动使用事务
const session = client.startSession();

try {
  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });

  // 转账操作
  await accounts.updateOne(
    { _id: fromAccountId },
    { $inc: { balance: -amount } },
    { session }
  );

  await accounts.updateOne(
    { _id: toAccountId },
    { $inc: { balance: amount } },
    { session }
  );

  // 记录交易
  await transactions.insertOne({
    from: fromAccountId,
    to: toAccountId,
    amount,
    timestamp: new Date()
  }, { session });

  await session.commitTransaction();
  console.log("事务提交成功");
} catch (error) {
  await session.abortTransaction();
  console.error("事务回滚:", error);
} finally {
  await session.endSession();
}
```

### 使用 withTransaction

```javascript
// 简化的事务 API
const session = client.startSession();

await session.withTransaction(async () => {
  await orders.insertOne({
    userId: user._id,
    items: cartItems,
    total: totalAmount
  }, { session });

  await inventory.updateMany(
    { _id: { $in: cartItems.map(i => i.productId) } },
    { $inc: { stock: -1 } },
    { session }
  );

  await carts.deleteOne({ userId: user._id }, { session });
});

await session.endSession();
```

### 事务最佳实践

```javascript
// 事务配置选项
const transactionOptions = {
  readPreference: "primary",
  readConcern: { level: "local" },
  writeConcern: { w: "majority" },
  maxCommitTimeMS: 1000  // 最大提交时间
};

// 重试逻辑
async function runTransactionWithRetry(txnFunc) {
  const session = client.startSession();
  try {
    await session.withTransaction(txnFunc, transactionOptions);
  } catch (error) {
    if (error.hasErrorLabel("TransientTransactionError")) {
      console.log("临时错误，重试事务...");
      await runTransactionWithRetry(txnFunc);
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }
}
```

## 复制集与分片

### 复制集（Replica Set）

复制集提供数据冗余和高可用性，由一个主节点和多个从节点组成。

```javascript
// 复制集配置示例
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", arbiterOnly: true }
  ]
});

// 查看复制集状态
rs.status();

// 读取偏好设置
// primary：只从主节点读取（默认）
// primaryPreferred：优先主节点
// secondary：只从从节点读取
// secondaryPreferred：优先从节点
// nearest：最近的节点

// Node.js 设置读取偏好
const collection = client.db("test").collection("users", {
  readPreference: "secondaryPreferred"
});
```

### 分片（Sharding）

分片实现水平扩展，将数据分布在多个服务器上。

```javascript
// 启用分片
sh.enableSharding("myDatabase");

// 创建分片键
// 范围分片
sh.shardCollection("myDatabase.users", { createdAt: 1 });

// 哈希分片（更均匀分布）
sh.shardCollection("myDatabase.logs", { userId: "hashed" });

// 复合分片键
sh.shardCollection("myDatabase.orders", {
  customerId: 1,
  createdAt: 1
});

// 查看分片状态
sh.status();

// 查看数据分布
db.users.getShardDistribution();
```

### 分片策略选择

| 分片类型 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| 范围分片 | 范围查询高效 | 可能热点 | 时间序列数据 |
| 哈希分片 | 数据分布均匀 | 范围查询效率低 | 随机访问模式 |
| Zone 分片 | 数据本地化 | 配置复杂 | 多地域部署 |

## Mongoose ODM

Mongoose 是 Node.js 中最流行的 MongoDB ODM（Object Document Mapper），提供 Schema 定义、验证、中间件等功能。

### 连接配置

```javascript
const mongoose = require('mongoose');

// 基本连接
await mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 带选项的连接
await mongoose.connect('mongodb://localhost:27017/myapp', {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4  // 使用 IPv4
});

// 连接事件监听
mongoose.connection.on('connected', () => {
  console.log('MongoDB 连接成功');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB 连接断开');
});
```

### Schema 定义

```javascript
const { Schema, model } = require('mongoose');

// 定义 Schema
const userSchema = new Schema({
  // 基本字段
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false  // 查询时默认不返回
  },
  age: {
    type: Number,
    min: [0, '年龄不能为负数'],
    max: [150, '年龄不能超过150']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },

  // 嵌套对象
  profile: {
    firstName: String,
    lastName: String,
    avatar: { type: String, default: '/default-avatar.png' }
  },

  // 数组
  tags: [String],

  // 引用其他模型
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],

  // Mixed 类型（任意结构）
  metadata: Schema.Types.Mixed
}, {
  timestamps: true,  // 自动添加 createdAt 和 updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
userSchema.virtual('fullName').get(function() {
  return this.profile.firstName + ' ' + this.profile.lastName;
});

// 虚拟关联
userSchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// 创建模型
const User = model('User', userSchema);
```

### 中间件（Middleware）

```javascript
const bcrypt = require('bcryptjs');

// 保存前中间件
userSchema.pre('save', async function(next) {
  // 只在密码被修改时哈希
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 保存后中间件
userSchema.post('save', function(doc, next) {
  console.log('用户 ' + doc.username + ' 已保存');
  next();
});

// 查询中间件
userSchema.pre(/^find/, function(next) {
  // 默认只查询活跃用户
  this.find({ isActive: { $ne: false } });
  next();
});

// 聚合中间件
userSchema.pre('aggregate', function(next) {
  // 在聚合管道开头添加过滤
  this.pipeline().unshift({ $match: { isActive: true } });
  next();
});

// 删除中间件 - 级联删除
userSchema.pre('deleteOne', { document: true }, async function(next) {
  await Post.deleteMany({ author: this._id });
  next();
});
```

### 实例方法和静态方法

```javascript
// 实例方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// 静态方法
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getActiveUsers = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.find({ isActive: true, lastLogin: { $gte: thirtyDaysAgo } });
};

// 使用
const user = await User.findByEmail('test@example.com');
const isValid = await user.comparePassword('password123');
const token = user.generateAuthToken();
```

### 查询构建

```javascript
// 链式查询
const users = await User
  .find({ role: 'user' })
  .select('username email profile')
  .populate('posts', 'title createdAt')
  .sort({ createdAt: -1 })
  .skip(10)
  .limit(10)
  .lean();  // 返回普通 JS 对象

// 条件构建
const query = User.find();

if (filters.role) {
  query.where('role').equals(filters.role);
}
if (filters.minAge) {
  query.where('age').gte(filters.minAge);
}
if (filters.search) {
  query.where('username').regex(new RegExp(filters.search, 'i'));
}

const results = await query.exec();

// populate 高级用法
const post = await Post.findById(id)
  .populate({
    path: 'author',
    select: 'username profile.avatar',
    match: { isActive: true }
  })
  .populate({
    path: 'comments',
    populate: {
      path: 'user',
      select: 'username'
    },
    options: { sort: { createdAt: -1 }, limit: 10 }
  });
```

## 性能优化

### 查询优化

```javascript
// 1. 使用投影减少数据传输
db.users.find({}, { name: 1, email: 1 });

// 2. 使用覆盖索引
db.orders.createIndex({ userId: 1, total: 1 });
db.orders.find(
  { userId: ObjectId("...") },
  { total: 1, _id: 0 }
);

// 3. 避免大跳过值
// 不好的做法
db.logs.find().skip(100000).limit(20);

// 好的做法：使用范围查询
db.logs.find({ _id: { $gt: lastId } }).limit(20);

// 4. 使用 hint 强制使用索引
db.orders.find({ status: "active" }).hint({ status: 1 });

// 5. 批量操作代替循环
await db.items.bulkWrite(
  items.map(item => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: item }
    }
  }))
);
```

### 读写优化

```javascript
// 1. 使用 lean() 减少内存（Mongoose）
const docs = await Model.find().lean();

// 2. 流式处理大量数据
const cursor = db.logs.find().batchSize(1000);
while (await cursor.hasNext()) {
  const doc = await cursor.next();
  // 处理文档
}

// Mongoose cursor
const cursor = Model.find().cursor();
for await (const doc of cursor) {
  // 处理文档
}

// 3. 使用批量写入
const bulk = db.items.initializeUnorderedBulkOp();
data.forEach(item => {
  bulk.insert(item);
});
await bulk.execute();

// 4. 读写分离
// 从节点读取
db.users.find().readPref("secondaryPreferred");
```

### 索引优化

```javascript
// 1. 分析索引使用情况
db.collection.aggregate([
  { $indexStats: {} }
]);

// 2. 识别慢查询
db.setProfilingLevel(1, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(10);

// 3. 优化复合索引顺序
// 查询：{ a: 1, b: { $gt: 10 }, c: 1 }
// 排序：{ d: 1 }
// 最佳索引：{ a: 1, c: 1, d: 1, b: 1 }

// 4. 使用 explain 验证
db.orders.find({ userId: id }).explain("executionStats");
```

### 连接池配置

```javascript
// Node.js 驱动连接池
const client = new MongoClient(uri, {
  maxPoolSize: 100,      // 最大连接数
  minPoolSize: 10,       // 最小连接数
  maxIdleTimeMS: 30000,  // 空闲超时
  waitQueueTimeoutMS: 10000  // 等待超时
});

// Mongoose 连接池
mongoose.connect(uri, {
  maxPoolSize: 100,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000
});
```

## 面试要点

### 常见面试问题

**1. MongoDB 和关系型数据库的核心区别？**

- 数据模型：MongoDB 使用灵活的文档模型，关系型使用固定 Schema 的表结构
- 扩展方式：MongoDB 原生支持水平扩展（分片），关系型以垂直扩展为主
- 事务支持：关系型对事务支持更成熟，MongoDB 4.0 后支持多文档事务
- 查询语言：MongoDB 使用 JSON 风格查询，关系型使用 SQL
- 适用场景：MongoDB 适合快速迭代、灵活 Schema 的场景

**2. 什么是 ObjectId？它的结构是什么？**

ObjectId 是 12 字节的唯一标识符：
- 4 字节：Unix 时间戳
- 5 字节：随机值（每进程一次）
- 3 字节：递增计数器

优点：无需中心化生成、可提取创建时间、按时间大致排序

**3. 如何设计 MongoDB 的数据模型？**

考虑因素：
- 访问模式：数据是一起还是分开访问
- 数据关系：一对一、一对多、多对多
- 文档大小：16MB 限制
- 原子性需求：单文档操作是原子的

嵌入：数据关系紧密、总是一起访问、一对一或一对少的关系、子文档不会无限增长

引用：数据独立访问、一对多或多对多、需要跨文档事务

**4. 聚合管道有哪些常用阶段？**

- $match - 过滤
- $project - 投影
- $group - 分组
- $sort - 排序
- $limit/$skip - 分页
- $lookup - 关联
- $unwind - 展开数组
- $addFields - 添加字段
- $facet - 多管道
- $bucket - 分桶

性能优化：$match 尽早过滤、$project 减少字段、利用索引

**5. MongoDB 如何保证高可用？**

复制集（Replica Set）：
- 主节点处理写入
- 从节点同步数据并可处理读取
- 主节点故障时自动选举新主
- 最少 3 个节点（可用仲裁节点）

写关注（Write Concern）：
- w: 1 - 主节点确认
- w: majority - 多数节点确认
- w: 0 - 不等待确认

读偏好（Read Preference）：primary、primaryPreferred、secondary、secondaryPreferred、nearest

**6. 如何优化 MongoDB 查询性能？**

- 创建合适的索引
- 使用 explain 分析查询
- 避免大 skip 值
- 使用投影减少返回字段
- 使用覆盖索引
- 批量操作代替循环
- 合理配置连接池
- 使用读写分离

explain 关键指标：COLLSCAN（需优化）、IXSCAN（良好）、nReturned vs totalDocsExamined、executionTimeMillis

**7. MongoDB 事务有什么限制？**

限制：
- 单事务最长运行时间（默认 60s）
- 事务操作数据大小限制（16MB）
- 事务写入的 oplog 大小限制
- 分片集群事务需要 4.2+
- 不能创建/删除集合和索引

最佳实践：事务尽量短小、合理设置超时时间、实现重试逻辑、考虑是否真的需要事务

**8. 什么是分片键？如何选择？**

分片键决定数据如何分布在各分片。

好的分片键特点：
- 高基数（大量不同值）
- 写入分布均匀
- 支持常见查询模式
- 不会产生 jumbo chunk

分片策略：
- 范围分片：适合范围查询
- 哈希分片：数据分布均匀
- Zone 分片：数据本地化

## 延伸阅读

### 官方资源

- [MongoDB 官方文档](https://docs.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/)
- [MongoDB 驱动文档](https://docs.mongodb.com/drivers/)

### 推荐书籍

- 《MongoDB 权威指南》
- 《MongoDB 实战》
- 《MongoDB 应用设计模式》

### 在线学习

- [MongoDB University 免费课程](https://university.mongodb.com/courses)
- [Mongoose 官方文档](https://mongoosejs.com/)
- [MongoDB 设计模式](https://www.mongodb.com/blog/post/building-with-patterns-a-summary)

### 进阶主题

- Change Streams 实时数据变更
- Atlas Search 全文搜索
- Time Series Collections 时序数据
- MongoDB Realm 移动端同步
- Vector Search 向量搜索

---

MongoDB 作为文档数据库的代表，以其灵活的数据模型和强大的扩展能力在现代应用开发中占据重要地位。掌握 MongoDB 的核心概念、建模技巧和优化方法，将帮助开发者构建高性能、可扩展的数据存储方案。随着 MongoDB 不断演进，持续关注新特性和最佳实践是提升技能的关键。
