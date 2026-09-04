---
title: GraphQL 完全指南
description: 掌握GraphQL API查询语言，构建灵活高效的数据接口
track: backend
section: http-apis
difficulty: intermediate
tags:
  - GraphQL
  - API
  - Apollo
  - 查询语言
status: imported
origin: old/src/content/docs/backend/graphql.zh.md
divergence: 0.209
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 8
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 GraphQL

GraphQL 是由 Facebook 于 2012 年内部开发、2015 年开源的一种 API 查询语言和运行时。它提供了一种更高效、更灵活的替代 REST 的方案，允许客户端精确指定所需的数据结构，避免过度获取（Over-fetching）或获取不足（Under-fetching）的问题。

GraphQL 的核心思想是：**客户端驱动的数据获取**。不同于 REST 中服务端决定返回什么数据，GraphQL 让客户端完全控制响应的数据结构和内容。

### GraphQL 的核心特性

1. **声明式数据获取**：客户端通过查询语句声明需要的数据结构
2. **单一端点**：所有请求通过一个端点（通常是 `/graphql`）处理
3. **强类型系统**：Schema 定义了 API 的完整类型系统
4. **自省能力**：API 可以被查询其自身的结构
5. **版本无关**：通过添加字段而非版本来演进 API

## GraphQL vs REST 对比

### 架构差异

| 特性 | REST | GraphQL |
|------|------|---------|
| 端点数量 | 多个端点，每个资源一个 | 单一端点 |
| 数据获取 | 固定结构，服务端决定 | 灵活结构，客户端决定 |
| 版本管理 | 通过 URL 或 Header | 通过 Schema 演进 |
| 缓存 | HTTP 缓存机制 | 需要额外实现 |
| 类型系统 | 无内置类型 | 强类型 Schema |
| 实时更新 | 需要轮询或 WebSocket | 内置 Subscription |

### 实际对比示例

假设我们需要获取用户信息及其最近的订单：

**REST 方式**：
```javascript
// 需要多次请求
// 请求 1：获取用户信息
GET /api/users/123
// 响应包含可能不需要的字段
{
  "id": 123,
  "name": "张三",
  "email": "zhangsan@example.com",
  "avatar": "...",
  "createdAt": "...",
  "updatedAt": "...",
  // ...更多字段
}

// 请求 2：获取用户订单
GET /api/users/123/orders?limit=5
// 又一次可能返回过多数据
```

**GraphQL 方式**：
```graphql
# 单次请求，精确获取所需数据
query {
  user(id: 123) {
    name
    email
    orders(limit: 5) {
      id
      total
      status
    }
  }
}

# 响应精确匹配查询结构
{
  "data": {
    "user": {
      "name": "张三",
      "email": "zhangsan@example.com",
      "orders": [
        { "id": "1", "total": 299.00, "status": "COMPLETED" },
        { "id": "2", "total": 158.50, "status": "PENDING" }
      ]
    }
  }
}
```

### 何时选择 GraphQL

**适合 GraphQL 的场景**：
- 移动应用（带宽敏感，需要精确数据）
- 复杂的数据关系和嵌套查询
- 多平台客户端（Web、移动、桌面）
- 快速迭代的产品需求
- 微服务聚合层

**REST 可能更适合**：
- 简单的 CRUD 操作
- 文件上传/下载为主
- 需要利用 HTTP 缓存
- 团队对 REST 更熟悉

## Schema 定义语言（SDL）

### 基本类型

GraphQL Schema 使用 SDL（Schema Definition Language）定义 API 的类型系统。

```graphql
# 标量类型
scalar DateTime

# 枚举类型
enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
}

# 对象类型
type User {
  id: ID!              # 非空 ID
  name: String!        # 非空字符串
  email: String!
  age: Int             # 可选整数
  balance: Float       # 浮点数
  isActive: Boolean!   # 布尔值
  createdAt: DateTime!
  orders: [Order!]!    # 非空数组，元素也非空
}

type Order {
  id: ID!
  total: Float!
  status: OrderStatus!
  items: [OrderItem!]!
  user: User!
  createdAt: DateTime!
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  price: Float!
}

type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  stock: Int!
}
```

### 输入类型

输入类型用于 Mutation 和 Query 的参数：

```graphql
# 输入类型
input CreateUserInput {
  name: String!
  email: String!
  password: String!
  age: Int
}

input UpdateUserInput {
  name: String
  email: String
  age: Int
}

input OrderFilterInput {
  status: OrderStatus
  minTotal: Float
  maxTotal: Float
  startDate: DateTime
  endDate: DateTime
}

# 分页输入
input PaginationInput {
  page: Int = 1
  limit: Int = 10
}
```

### 接口与联合类型

```graphql
# 接口类型
interface Node {
  id: ID!
}

interface Timestamped {
  createdAt: DateTime!
  updatedAt: DateTime!
}

type User implements Node & Timestamped {
  id: ID!
  name: String!
  email: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 联合类型
union SearchResult = User | Product | Order

type Query {
  search(query: String!): [SearchResult!]!
}
```

## Query、Mutation、Subscription

### Query - 数据查询

Query 是 GraphQL 的只读操作，用于获取数据：

```graphql
type Query {
  # 单个查询
  user(id: ID!): User

  # 列表查询
  users(filter: UserFilterInput, pagination: PaginationInput): UserConnection!

  # 复杂查询
  searchUsers(query: String!, limit: Int = 10): [User!]!

  # 聚合查询
  userStats: UserStats!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type UserStats {
  totalUsers: Int!
  activeUsers: Int!
  newUsersThisMonth: Int!
}
```

**客户端查询示例**：

```graphql
# 基础查询
query GetUser {
  user(id: "123") {
    id
    name
    email
  }
}

# 带变量的查询
query GetUserWithOrders($userId: ID!, $orderLimit: Int = 5) {
  user(id: $userId) {
    name
    email
    orders(limit: $orderLimit) {
      id
      total
      status
      items {
        product {
          name
        }
        quantity
      }
    }
  }
}

# 别名和片段
query GetMultipleUsers {
  admin: user(id: "1") {
    ...UserFields
  }
  customer: user(id: "2") {
    ...UserFields
  }
}

fragment UserFields on User {
  id
  name
  email
  isActive
}
```

### Mutation - 数据修改

Mutation 用于创建、更新、删除数据：

```graphql
type Mutation {
  # 创建
  createUser(input: CreateUserInput!): CreateUserPayload!

  # 更新
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!

  # 删除
  deleteUser(id: ID!): DeleteUserPayload!

  # 批量操作
  deleteUsers(ids: [ID!]!): DeleteUsersPayload!

  # 业务操作
  createOrder(input: CreateOrderInput!): CreateOrderPayload!
  cancelOrder(id: ID!, reason: String): CancelOrderPayload!
}

# Payload 类型（推荐模式）
type CreateUserPayload {
  success: Boolean!
  message: String
  user: User
  errors: [FieldError!]
}

type FieldError {
  field: String!
  message: String!
}
```

**Mutation 调用示例**：

```graphql
mutation CreateNewUser($input: CreateUserInput!) {
  createUser(input: $input) {
    success
    message
    user {
      id
      name
      email
    }
    errors {
      field
      message
    }
  }
}

# 变量
{
  "input": {
    "name": "李四",
    "email": "lisi@example.com",
    "password": "securePassword123"
  }
}
```

### Subscription - 实时订阅

Subscription 用于实时数据推送，通常基于 WebSocket：

```graphql
type Subscription {
  # 订阅新消息
  messageAdded(channelId: ID!): Message!

  # 订阅订单状态变化
  orderStatusChanged(userId: ID!): Order!

  # 订阅在线用户变化
  userPresenceChanged: UserPresence!
}

type Message {
  id: ID!
  content: String!
  author: User!
  createdAt: DateTime!
}

type UserPresence {
  user: User!
  status: PresenceStatus!
}

enum PresenceStatus {
  ONLINE
  OFFLINE
  AWAY
}
```

**客户端订阅示例**：

```graphql
subscription OnNewMessage($channelId: ID!) {
  messageAdded(channelId: $channelId) {
    id
    content
    author {
      name
      avatar
    }
    createdAt
  }
}
```

## Resolver 实现

Resolver 是 GraphQL Schema 与数据源之间的桥梁，负责解析每个字段的实际数据。

### 基础 Resolver 结构

```javascript
// resolvers.js
const resolvers = {
  Query: {
    // 基础查询 resolver
    user: async (parent, args, context, info) => {
      const { id } = args;
      const { dataSources, user: currentUser } = context;

      return dataSources.userAPI.getUserById(id);
    },

    // 列表查询
    users: async (_, { filter, pagination }, { dataSources }) => {
      const { page = 1, limit = 10 } = pagination || {};
      return dataSources.userAPI.getUsers(filter, { page, limit });
    },

    // 搜索查询
    searchUsers: async (_, { query, limit }, { dataSources }) => {
      return dataSources.userAPI.searchUsers(query, limit);
    },
  },

  Mutation: {
    createUser: async (_, { input }, { dataSources, user }) => {
      try {
        // 权限检查
        if (!user?.isAdmin) {
          return {
            success: false,
            message: '无权限执行此操作',
            errors: [{ field: '_', message: 'Unauthorized' }],
          };
        }

        const newUser = await dataSources.userAPI.createUser(input);
        return {
          success: true,
          message: '用户创建成功',
          user: newUser,
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          errors: [{ field: '_', message: error.message }],
        };
      }
    },

    updateUser: async (_, { id, input }, { dataSources }) => {
      const updatedUser = await dataSources.userAPI.updateUser(id, input);
      return {
        success: true,
        user: updatedUser,
      };
    },

    deleteUser: async (_, { id }, { dataSources }) => {
      await dataSources.userAPI.deleteUser(id);
      return {
        success: true,
        message: '用户已删除',
      };
    },
  },

  // 类型 Resolver
  User: {
    // 字段级 resolver
    orders: async (parent, { limit = 10 }, { dataSources }) => {
      // parent 是父级 resolver 返回的 user 对象
      return dataSources.orderAPI.getOrdersByUserId(parent.id, limit);
    },

    // 计算字段
    fullName: (parent) => {
      return `${parent.firstName} ${parent.lastName}`;
    },

    // 格式化字段
    createdAt: (parent) => {
      return parent.createdAt.toISOString();
    },
  },

  Order: {
    user: async (parent, _, { dataSources }) => {
      return dataSources.userAPI.getUserById(parent.userId);
    },

    items: async (parent, _, { dataSources }) => {
      return dataSources.orderAPI.getOrderItems(parent.id);
    },
  },

  // 联合类型 resolver
  SearchResult: {
    __resolveType(obj) {
      if (obj.email) return 'User';
      if (obj.price) return 'Product';
      if (obj.total) return 'Order';
      return null;
    },
  },

  Subscription: {
    messageAdded: {
      subscribe: (_, { channelId }, { pubsub }) => {
        return pubsub.asyncIterator([`MESSAGE_ADDED_${channelId}`]);
      },
    },

    orderStatusChanged: {
      subscribe: (_, { userId }, { pubsub }) => {
        return pubsub.asyncIterator([`ORDER_STATUS_${userId}`]);
      },
    },
  },
};

module.exports = resolvers;
```

### Resolver 参数详解

```javascript
const resolver = async (parent, args, context, info) => {
  // parent: 父级 resolver 的返回值
  //   - 对于 Query/Mutation 的顶级 resolver，通常是 undefined
  //   - 对于嵌套字段的 resolver，是父对象的数据

  // args: 查询传入的参数
  //   - { id: "123", filter: { status: "ACTIVE" } }

  // context: 跨所有 resolver 共享的上下文
  //   - 通常包含：当前用户、数据源、数据库连接等

  // info: 查询的 AST 信息
  //   - 包含字段名、返回类型、查询结构等元数据
};
```

## Apollo Server/Client

### Apollo Server 配置

```javascript
// server.js
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const express = require('express');
const http = require('http');
const cors = require('cors');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { UserAPI, OrderAPI } = require('./datasources');
const { verifyToken } = require('./auth');

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // 创建 Schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // WebSocket 服务器（用于 Subscription）
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const token = ctx.connectionParams?.authorization;
        const user = token ? await verifyToken(token) : null;
        return { user };
      },
    },
    wsServer
  );

  // 创建 Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (formattedError, error) => {
      // 生产环境隐藏内部错误详情
      if (process.env.NODE_ENV === 'production') {
        if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
          return {
            message: '服务器内部错误',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          };
        }
      }
      return formattedError;
    },
  });

  await server.start();

  // Express 中间件
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // 解析 token
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = token ? await verifyToken(token) : null;

        return {
          user,
          dataSources: {
            userAPI: new UserAPI(),
            orderAPI: new OrderAPI(),
          },
        };
      },
    })
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer();
```

### Apollo Client 配置（React）

```javascript
// apollo-client.js
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP 连接
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// 认证链接
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// WebSocket 连接（用于 Subscription）
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: {
      authorization: localStorage.getItem('token'),
    },
  })
);

// 根据操作类型分割链接
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// 创建 Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          users: {
            // 分页缓存策略
            keyArgs: ['filter'],
            merge(existing = { edges: [] }, incoming) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
        },
      },
      User: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default client;
```

### React Hooks 使用

```jsx
// components/UserList.jsx
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';

// 定义 Query
const GET_USERS = gql`
  query GetUsers($filter: UserFilterInput, $pagination: PaginationInput) {
    users(filter: $filter, pagination: $pagination) {
      edges {
        node {
          id
          name
          email
          isActive
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      success
      message
      user {
        id
        name
        email
      }
      errors {
        field
        message
      }
    }
  }
`;

const USER_CREATED = gql`
  subscription OnUserCreated {
    userCreated {
      id
      name
      email
    }
  }
`;

function UserList() {
  // Query Hook
  const { data, loading, error, fetchMore, refetch } = useQuery(GET_USERS, {
    variables: {
      filter: { isActive: true },
      pagination: { page: 1, limit: 10 },
    },
    notifyOnNetworkStatusChange: true,
  });

  // Mutation Hook
  const [createUser, { loading: creating }] = useMutation(CREATE_USER, {
    // 乐观更新
    optimisticResponse: {
      createUser: {
        __typename: 'CreateUserPayload',
        success: true,
        message: '创建中...',
        user: {
          __typename: 'User',
          id: 'temp-id',
          name: '新用户',
          email: 'temp@example.com',
        },
        errors: null,
      },
    },
    // 更新缓存
    update(cache, { data: { createUser } }) {
      if (createUser.success) {
        cache.modify({
          fields: {
            users(existing = { edges: [] }) {
              const newUserRef = cache.writeFragment({
                data: createUser.user,
                fragment: gql`
                  fragment NewUser on User {
                    id
                    name
                    email
                  }
                `,
              });
              return {
                ...existing,
                edges: [{ node: newUserRef }, ...existing.edges],
              };
            },
          },
        });
      }
    },
    onCompleted: (data) => {
      if (data.createUser.success) {
        console.log('用户创建成功');
      }
    },
    onError: (error) => {
      console.error('创建失败:', error.message);
    },
  });

  // Subscription Hook
  useSubscription(USER_CREATED, {
    onData: ({ data }) => {
      console.log('新用户:', data.data.userCreated);
      refetch(); // 刷新列表
    },
  });

  // 加载更多
  const loadMore = () => {
    if (data?.users.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          pagination: {
            page: Math.ceil(data.users.edges.length / 10) + 1,
            limit: 10,
          },
        },
      });
    }
  };

  if (loading && !data) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>用户列表 (共 {data.users.totalCount} 人)</h2>
      <ul>
        {data.users.edges.map(({ node }) => (
          <li key={node.id}>
            {node.name} - {node.email}
          </li>
        ))}
      </ul>
      {data.users.pageInfo.hasNextPage && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? '加载中...' : '加载更多'}
        </button>
      )}
      <button
        onClick={() => createUser({
          variables: {
            input: { name: '新用户', email: 'new@example.com', password: '123456' },
          },
        })}
        disabled={creating}
      >
        创建用户
      </button>
    </div>
  );
}

export default UserList;
```

## 数据加载与 N+1 问题

### 什么是 N+1 问题

N+1 问题是 GraphQL 中常见的性能问题。当查询嵌套数据时，如果不做优化，会产生大量重复的数据库查询。

```graphql
# 这个查询可能导致 N+1 问题
query {
  users {           # 1 次查询获取所有用户
    id
    name
    orders {        # N 次查询，每个用户查询一次订单
      id
      total
    }
  }
}
```

如果有 100 个用户，上述查询会执行 1 + 100 = 101 次数据库查询。

### DataLoader 解决方案

DataLoader 是 Facebook 开发的批量加载和缓存工具，专门解决 N+1 问题。

```javascript
// dataloaders.js
const DataLoader = require('dataloader');

// 创建 DataLoader 工厂函数
function createLoaders(db) {
  return {
    // 用户批量加载器
    userLoader: new DataLoader(async (userIds) => {
      // 批量查询
      const users = await db.query(
        'SELECT * FROM users WHERE id = ANY($1)',
        [userIds]
      );

      // 按请求顺序返回结果
      const userMap = new Map(users.map(u => [u.id, u]));
      return userIds.map(id => userMap.get(id) || null);
    }),

    // 用户订单批量加载器
    ordersByUserLoader: new DataLoader(async (userIds) => {
      const orders = await db.query(
        'SELECT * FROM orders WHERE user_id = ANY($1)',
        [userIds]
      );

      // 按用户 ID 分组
      const ordersByUser = new Map();
      userIds.forEach(id => ordersByUser.set(id, []));
      orders.forEach(order => {
        ordersByUser.get(order.user_id)?.push(order);
      });

      return userIds.map(id => ordersByUser.get(id) || []);
    }),

    // 产品批量加载器
    productLoader: new DataLoader(async (productIds) => {
      const products = await db.query(
        'SELECT * FROM products WHERE id = ANY($1)',
        [productIds]
      );

      const productMap = new Map(products.map(p => [p.id, p]));
      return productIds.map(id => productMap.get(id) || null);
    }),
  };
}

module.exports = createLoaders;
```

### 在 Apollo Server 中集成 DataLoader

```javascript
// server.js
const createLoaders = require('./dataloaders');

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => {
      const user = await verifyToken(req.headers.authorization);

      // 每个请求创建新的 DataLoader 实例（很重要！）
      const loaders = createLoaders(db);

      return {
        user,
        db,
        loaders,
      };
    },
  })
);
```

### 在 Resolver 中使用 DataLoader

```javascript
const resolvers = {
  Query: {
    users: async (_, __, { db }) => {
      return db.query('SELECT * FROM users');
    },

    user: async (_, { id }, { loaders }) => {
      // 使用 DataLoader 加载单个用户
      return loaders.userLoader.load(id);
    },
  },

  User: {
    orders: async (parent, _, { loaders }) => {
      // 使用 DataLoader 批量加载订单
      return loaders.ordersByUserLoader.load(parent.id);
    },
  },

  Order: {
    user: async (parent, _, { loaders }) => {
      // 使用 DataLoader 加载用户
      return loaders.userLoader.load(parent.userId);
    },
  },

  OrderItem: {
    product: async (parent, _, { loaders }) => {
      // 使用 DataLoader 加载产品
      return loaders.productLoader.load(parent.productId);
    },
  },
};
```

### DataLoader 缓存配置

```javascript
const userLoader = new DataLoader(batchFn, {
  // 禁用缓存（每次调用都查询）
  cache: false,

  // 自定义缓存 key
  cacheKeyFn: (key) => key.toString(),

  // 批量大小限制
  maxBatchSize: 100,

  // 批量调度函数
  batchScheduleFn: (callback) => setTimeout(callback, 10),
});

// 手动清除缓存
userLoader.clear(userId);      // 清除单个
userLoader.clearAll();         // 清除所有

// 预填充缓存
userLoader.prime(userId, user);
```

## 认证与授权

### JWT 认证实现

```javascript
// auth.js
const jwt = require('jsonwebtoken');
const { AuthenticationError, ForbiddenError } = require('@apollo/server');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成 Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 验证 Token
async function verifyToken(authHeader) {
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 可以从数据库获取完整用户信息
    return decoded;
  } catch (error) {
    return null;
  }
}

// 认证检查
function requireAuth(user) {
  if (!user) {
    throw new AuthenticationError('请先登录');
  }
  return user;
}

// 权限检查
function requireRole(user, roles) {
  requireAuth(user);
  if (!roles.includes(user.role)) {
    throw new ForbiddenError('无权限执行此操作');
  }
  return user;
}

module.exports = { generateToken, verifyToken, requireAuth, requireRole };
```

### Schema 指令授权

```graphql
# schema.graphql
directive @auth(requires: Role = USER) on FIELD_DEFINITION

enum Role {
  ADMIN
  USER
  GUEST
}

type Query {
  # 公开查询
  publicPosts: [Post!]!

  # 需要登录
  me: User @auth

  # 需要管理员权限
  allUsers: [User!]! @auth(requires: ADMIN)

  # 需要用户权限
  myOrders: [Order!]! @auth(requires: USER)
}

type Mutation {
  # 公开操作
  login(email: String!, password: String!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!

  # 需要登录
  updateProfile(input: UpdateProfileInput!): User! @auth

  # 需要管理员
  deleteUser(id: ID!): Boolean! @auth(requires: ADMIN)
}
```

### 指令实现

```javascript
// directives/auth.js
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver } = require('graphql');
const { AuthenticationError, ForbiddenError } = require('@apollo/server');

function authDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];

      if (authDirective) {
        const { requires = 'USER' } = authDirective;
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async function (source, args, context, info) {
          const { user } = context;

          // 检查是否登录
          if (!user) {
            throw new AuthenticationError('请先登录');
          }

          // 检查角色权限
          const roleHierarchy = { ADMIN: 3, USER: 2, GUEST: 1 };
          if (roleHierarchy[user.role] < roleHierarchy[requires]) {
            throw new ForbiddenError(`需要 ${requires} 权限`);
          }

          return resolve(source, args, context, info);
        };
      }

      return fieldConfig;
    },
  });
}

module.exports = authDirectiveTransformer;
```

### 字段级权限控制

```javascript
const resolvers = {
  User: {
    // 敏感字段权限控制
    email: (parent, _, { user }) => {
      // 只有本人或管理员可以看到邮箱
      if (user?.id === parent.id || user?.role === 'ADMIN') {
        return parent.email;
      }
      return null;
    },

    phone: (parent, _, { user }) => {
      if (user?.id === parent.id || user?.role === 'ADMIN') {
        return parent.phone;
      }
      return '******';
    },

    // 完全隐藏敏感字段
    password: () => null, // 永远不返回密码
  },

  Order: {
    // 只有订单所有者或管理员可以查看
    paymentInfo: (parent, _, { user }) => {
      if (user?.id !== parent.userId && user?.role !== 'ADMIN') {
        throw new ForbiddenError('无权查看支付信息');
      }
      return parent.paymentInfo;
    },
  },
};
```

## 错误处理

### GraphQL 错误结构

```javascript
// 标准 GraphQL 错误响应
{
  "data": null,
  "errors": [
    {
      "message": "用户不存在",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user"],
      "extensions": {
        "code": "NOT_FOUND",
        "statusCode": 404
      }
    }
  ]
}
```

### 自定义错误类

```javascript
// errors.js
const { GraphQLError } = require('graphql');

class AppError extends GraphQLError {
  constructor(message, code, statusCode = 400, details = {}) {
    super(message, {
      extensions: {
        code,
        statusCode,
        ...details,
      },
    });
  }
}

class ValidationError extends AppError {
  constructor(message, field, details = {}) {
    super(message, 'VALIDATION_ERROR', 400, { field, ...details });
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} 不存在`, 'NOT_FOUND', 404, { resource, id });
  }
}

class AuthenticationError extends AppError {
  constructor(message = '请先登录') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '无权限执行此操作') {
    super(message, 'FORBIDDEN', 403);
  }
}

class ConflictError extends AppError {
  constructor(message, details = {}) {
    super(message, 'CONFLICT', 409, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
};
```

### Resolver 错误处理

```javascript
const { NotFoundError, ValidationError } = require('./errors');

const resolvers = {
  Query: {
    user: async (_, { id }, { dataSources }) => {
      const user = await dataSources.userAPI.getUserById(id);

      if (!user) {
        throw new NotFoundError('用户', id);
      }

      return user;
    },
  },

  Mutation: {
    createUser: async (_, { input }, { dataSources }) => {
      // 验证输入
      const errors = [];

      if (!input.email?.includes('@')) {
        errors.push({ field: 'email', message: '邮箱格式不正确' });
      }

      if (input.password?.length < 6) {
        errors.push({ field: 'password', message: '密码至少需要6个字符' });
      }

      if (errors.length > 0) {
        return {
          success: false,
          message: '输入验证失败',
          errors,
        };
      }

      // 检查邮箱是否已存在
      const existingUser = await dataSources.userAPI.getUserByEmail(input.email);
      if (existingUser) {
        return {
          success: false,
          message: '邮箱已被注册',
          errors: [{ field: 'email', message: '该邮箱已被使用' }],
        };
      }

      try {
        const user = await dataSources.userAPI.createUser(input);
        return {
          success: true,
          message: '用户创建成功',
          user,
        };
      } catch (error) {
        // 记录错误日志
        console.error('创建用户失败:', error);

        return {
          success: false,
          message: '创建用户失败，请稍后重试',
          errors: [{ field: '_', message: '服务器内部错误' }],
        };
      }
    },
  },
};
```

### 全局错误处理

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    // 记录所有错误
    console.error('GraphQL Error:', {
      message: formattedError.message,
      code: formattedError.extensions?.code,
      path: formattedError.path,
      stack: error.stack,
    });

    // 开发环境返回完整错误
    if (process.env.NODE_ENV === 'development') {
      return {
        ...formattedError,
        stack: error.stack,
      };
    }

    // 生产环境隐藏敏感信息
    const code = formattedError.extensions?.code;

    // 已知错误类型，返回用户友好信息
    if (['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHENTICATED', 'FORBIDDEN'].includes(code)) {
      return formattedError;
    }

    // 未知错误，返回通用信息
    return {
      message: '服务器内部错误，请稍后重试',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    };
  },
});
```

## 性能优化与缓存

### 查询复杂度限制

```javascript
// complexity.js
const { createComplexityLimitRule } = require('graphql-validation-complexity');

// 方法1：使用验证规则
const complexityRule = createComplexityLimitRule(1000, {
  onCost: (cost) => {
    console.log('Query complexity:', cost);
  },
  formatErrorMessage: (cost) => {
    return `查询复杂度 ${cost} 超过限制 1000`;
  },
});

// 在 Apollo Server 中使用
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [complexityRule],
});
```

### 查询深度限制

```javascript
const depthLimit = require('graphql-depth-limit');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(10, { ignore: ['Query.search'] }),
  ],
});
```

### 响应缓存

```javascript
// 使用 Apollo Server 缓存插件
const responseCachePlugin = require('@apollo/server-plugin-response-cache').default;
const { KeyvAdapter } = require('@apollo/utils.keyvadapter');
const Keyv = require('keyv');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    responseCachePlugin({
      cache: new KeyvAdapter(new Keyv('redis://localhost:6379')),
      sessionId: (context) => context.user?.id || null,
    }),
  ],
});

// 在 Schema 中配置缓存
// schema.graphql
type Query {
  # 公共数据，缓存1小时
  posts: [Post!]! @cacheControl(maxAge: 3600)

  # 用户相关数据，私有缓存
  me: User @cacheControl(maxAge: 0, scope: PRIVATE)

  # 不缓存
  notifications: [Notification!]! @cacheControl(maxAge: 0)
}

type Post {
  id: ID!
  title: String!
  content: String!
  # 作者信息缓存30分钟
  author: User! @cacheControl(maxAge: 1800)
}
```

### 持久化查询

```javascript
// 持久化查询可以减少网络传输
// 客户端发送查询哈希而不是完整查询

// server.js
const { ApolloServerPluginCacheControl } = require('@apollo/server/plugin/cacheControl');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  persistedQueries: {
    cache: new KeyvAdapter(new Keyv('redis://localhost:6379')),
    ttl: 900, // 15分钟
  },
});

// 客户端配置
const client = new ApolloClient({
  link: createPersistedQueryLink({ sha256 }).concat(httpLink),
  cache: new InMemoryCache(),
});
```

### 批量请求

```javascript
// 使用 @defer 和 @stream 指令（实验性）
query GetUserWithPosts($id: ID!) {
  user(id: $id) {
    id
    name
    ... @defer {
      posts {
        id
        title
      }
    }
  }
}

// 流式返回大列表
query GetAllPosts {
  posts @stream(initialCount: 10) {
    id
    title
    content
  }
}
```

### 字段级优化

```javascript
const resolvers = {
  User: {
    // 只在请求时才加载
    posts: async (parent, _, { loaders }, info) => {
      // 检查是否真的请求了 posts 字段
      const requestedFields = info.fieldNodes[0].selectionSet?.selections || [];
      const needsFullData = requestedFields.some(f => f.name.value !== 'id');

      if (!needsFullData) {
        // 只需要 ID，使用轻量级查询
        return loaders.postIdsByUserLoader.load(parent.id);
      }

      return loaders.postsByUserLoader.load(parent.id);
    },
  },
};
```

## 面试要点

### GraphQL 核心概念

**问：什么是 GraphQL？它与 REST 有什么区别？**

答：GraphQL 是一种 API 查询语言和运行时，主要区别：
- **端点**：REST 多端点，GraphQL 单端点
- **数据获取**：REST 固定响应结构，GraphQL 客户端指定所需字段
- **版本管理**：REST 通过 URL 版本化，GraphQL 通过 Schema 演进
- **类型系统**：GraphQL 有强类型 Schema
- **网络效率**：GraphQL 减少 Over-fetching 和 Under-fetching

### N+1 问题

**问：什么是 N+1 问题？如何解决？**

答：N+1 问题是查询嵌套数据时产生的性能问题。例如获取 100 个用户及其订单，会执行 1（用户列表）+ 100（每个用户的订单）= 101 次查询。

解决方案：
- **DataLoader**：批量加载和请求级缓存
- **预加载**：ORM 层面的 eager loading
- **字段解析优化**：根据查询结构优化数据获取

### 认证与授权

**问：GraphQL 中如何实现认证和授权？**

答：
- **认证**：通过 Context 传递用户信息，通常使用 JWT
- **授权**：
  - Resolver 级别检查
  - 自定义指令（@auth）
  - 字段级权限控制
  - 中间件拦截

### 错误处理

**问：GraphQL 如何处理错误？**

答：
- GraphQL 响应包含 `data` 和 `errors` 两个字段
- 部分成功：返回可用数据和部分错误
- 自定义错误类型和错误码
- `formatError` 钩子处理错误格式

### 性能优化

**问：如何优化 GraphQL API 性能？**

答：
- **DataLoader** 解决 N+1 问题
- **查询复杂度限制** 防止恶意查询
- **查询深度限制**
- **响应缓存**（HTTP 缓存、Apollo 缓存）
- **持久化查询** 减少网络传输
- **字段级懒加载**

### Subscription 实现

**问：GraphQL Subscription 如何工作？**

答：
- 基于 WebSocket 的长连接
- 使用 Pub/Sub 模式
- 服务端发布事件，客户端订阅接收
- 适用于实时通知、消息、状态更新

### Schema 设计

**问：GraphQL Schema 设计的最佳实践？**

答：
- 使用有意义的类型名和字段名
- Mutation 返回 Payload 类型
- 使用 Connection 模式分页
- 接口和联合类型实现多态
- 输入类型与输出类型分离
- 合理使用枚举

### Apollo 生态系统

**问：Apollo Client 的缓存机制是什么？**

答：
- **InMemoryCache**：规范化缓存
- 通过 `__typename` 和 `id` 标识缓存对象
- **fetchPolicy** 控制缓存策略
- **typePolicies** 自定义缓存行为
- **乐观更新** 提升用户体验

## 总结

GraphQL 提供了一种强大而灵活的 API 设计方式，特别适合：

1. **复杂数据需求**：嵌套关系、多样化客户端
2. **快速迭代**：无需版本管理，Schema 演进
3. **移动应用**：精确数据获取，减少带宽
4. **微服务聚合**：统一数据层

掌握 GraphQL 需要理解：
- Schema 设计和类型系统
- Resolver 实现和数据加载优化
- 认证授权和错误处理
- 性能优化和缓存策略

通过合理运用 DataLoader、缓存、查询限制等技术，可以构建高性能、可扩展的 GraphQL API。
