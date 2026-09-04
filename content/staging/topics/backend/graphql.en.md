---
title: GraphQL Complete Guide
description: Master GraphQL for flexible API development
track: backend
section: http-apis
difficulty: intermediate
tags:
  - GraphQL
  - API
  - Apollo
  - Query Language
status: imported
origin: old/src/content/docs/backend/graphql.en.md
divergence: 0.209
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 8
  lastUpdated: 2026-01-07
---

## Concept Overview

### What is GraphQL

GraphQL is an API query language and runtime developed internally by Facebook in 2012 and open-sourced in 2015. It provides a more efficient and flexible alternative to REST, allowing clients to precisely specify the data structure they need, avoiding over-fetching and under-fetching problems.

The core philosophy of GraphQL is **client-driven data fetching**. Unlike REST where the server determines what data to return, GraphQL gives clients complete control over the response structure and content.

### Core Features of GraphQL

1. **Declarative Data Fetching**: Clients declare the data structure they need through query statements
2. **Single Endpoint**: All requests are handled through a single endpoint (typically `/graphql`)
3. **Strong Type System**: Schema defines the complete type system of the API
4. **Introspection**: APIs can be queried about their own structure
5. **Version-Free**: APIs evolve by adding fields rather than versions

## GraphQL vs REST Comparison

### Architectural Differences

| Feature | REST | GraphQL |
|---------|------|---------|
| Endpoints | Multiple endpoints, one per resource | Single endpoint |
| Data Fetching | Fixed structure, server-determined | Flexible structure, client-determined |
| Version Management | Via URL or Header | Via Schema evolution |
| Caching | HTTP caching mechanisms | Requires additional implementation |
| Type System | No built-in types | Strongly typed Schema |
| Real-time Updates | Requires polling or WebSocket | Built-in Subscription |

### Practical Comparison Example

Suppose we need to fetch user information along with their recent orders:

**REST Approach**:
```javascript
// Multiple requests needed
// Request 1: Get user information
GET /api/users/123
// Response may include unnecessary fields
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "...",
  "createdAt": "...",
  "updatedAt": "...",
  // ...more fields
}

// Request 2: Get user orders
GET /api/users/123/orders?limit=5
// Again, potentially returning too much data
```

**GraphQL Approach**:
```graphql
# Single request, precisely fetching required data
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

# Response precisely matches the query structure
{
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "orders": [
        { "id": "1", "total": 299.00, "status": "COMPLETED" },
        { "id": "2", "total": 158.50, "status": "PENDING" }
      ]
    }
  }
}
```

### When to Choose GraphQL

**Scenarios Suitable for GraphQL**:
- Mobile applications (bandwidth-sensitive, requiring precise data)
- Complex data relationships and nested queries
- Multiple platform clients (Web, mobile, desktop)
- Rapidly iterating product requirements
- Microservices aggregation layer

**REST May Be More Suitable**:
- Simple CRUD operations
- Primarily file uploads/downloads
- Need to leverage HTTP caching
- Team is more familiar with REST

## Schema Definition Language (SDL)

### Basic Types

GraphQL Schema uses SDL (Schema Definition Language) to define the API's type system.

```graphql
# Scalar types
scalar DateTime

# Enum types
enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
}

# Object types
type User {
  id: ID!              # Non-null ID
  name: String!        # Non-null string
  email: String!
  age: Int             # Optional integer
  balance: Float       # Float
  isActive: Boolean!   # Boolean
  createdAt: DateTime!
  orders: [Order!]!    # Non-null array with non-null elements
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

### Input Types

Input types are used for Mutation and Query parameters:

```graphql
# Input types
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

# Pagination input
input PaginationInput {
  page: Int = 1
  limit: Int = 10
}
```

### Interfaces and Union Types

```graphql
# Interface types
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

# Union types
union SearchResult = User | Product | Order

type Query {
  search(query: String!): [SearchResult!]!
}
```

## Queries, Mutations, and Subscriptions

### Query - Data Retrieval

Query is a read-only operation in GraphQL used for fetching data:

```graphql
type Query {
  # Single query
  user(id: ID!): User

  # List query
  users(filter: UserFilterInput, pagination: PaginationInput): UserConnection!

  # Complex query
  searchUsers(query: String!, limit: Int = 10): [User!]!

  # Aggregate query
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

**Client Query Examples**:

```graphql
# Basic query
query GetUser {
  user(id: "123") {
    id
    name
    email
  }
}

# Query with variables
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

# Aliases and fragments
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

### Mutation - Data Modification

Mutation is used for creating, updating, and deleting data:

```graphql
type Mutation {
  # Create
  createUser(input: CreateUserInput!): CreateUserPayload!

  # Update
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!

  # Delete
  deleteUser(id: ID!): DeleteUserPayload!

  # Batch operations
  deleteUsers(ids: [ID!]!): DeleteUsersPayload!

  # Business operations
  createOrder(input: CreateOrderInput!): CreateOrderPayload!
  cancelOrder(id: ID!, reason: String): CancelOrderPayload!
}

# Payload types (recommended pattern)
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

**Mutation Call Example**:

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

# Variables
{
  "input": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "securePassword123"
  }
}
```

### Subscription - Real-time Updates

Subscription is used for real-time data push, typically based on WebSocket:

```graphql
type Subscription {
  # Subscribe to new messages
  messageAdded(channelId: ID!): Message!

  # Subscribe to order status changes
  orderStatusChanged(userId: ID!): Order!

  # Subscribe to user presence changes
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

**Client Subscription Example**:

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

## Resolvers

Resolvers are the bridge between GraphQL Schema and data sources, responsible for resolving the actual data for each field.

### Basic Resolver Structure

```javascript
// resolvers.js
const resolvers = {
  Query: {
    // Basic query resolver
    user: async (parent, args, context, info) => {
      const { id } = args;
      const { dataSources, user: currentUser } = context;

      return dataSources.userAPI.getUserById(id);
    },

    // List query
    users: async (_, { filter, pagination }, { dataSources }) => {
      const { page = 1, limit = 10 } = pagination || {};
      return dataSources.userAPI.getUsers(filter, { page, limit });
    },

    // Search query
    searchUsers: async (_, { query, limit }, { dataSources }) => {
      return dataSources.userAPI.searchUsers(query, limit);
    },
  },

  Mutation: {
    createUser: async (_, { input }, { dataSources, user }) => {
      try {
        // Permission check
        if (!user?.isAdmin) {
          return {
            success: false,
            message: 'Unauthorized to perform this operation',
            errors: [{ field: '_', message: 'Unauthorized' }],
          };
        }

        const newUser = await dataSources.userAPI.createUser(input);
        return {
          success: true,
          message: 'User created successfully',
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
        message: 'User deleted successfully',
      };
    },
  },

  // Type resolvers
  User: {
    // Field-level resolver
    orders: async (parent, { limit = 10 }, { dataSources }) => {
      // parent is the user object returned by the parent resolver
      return dataSources.orderAPI.getOrdersByUserId(parent.id, limit);
    },

    // Computed field
    fullName: (parent) => {
      return `${parent.firstName} ${parent.lastName}`;
    },

    // Formatted field
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

  // Union type resolver
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

### Resolver Parameters Explained

```javascript
const resolver = async (parent, args, context, info) => {
  // parent: Return value of the parent resolver
  //   - For top-level Query/Mutation resolvers, typically undefined
  //   - For nested field resolvers, it's the parent object's data

  // args: Arguments passed to the query
  //   - { id: "123", filter: { status: "ACTIVE" } }

  // context: Shared context across all resolvers
  //   - Typically includes: current user, data sources, database connections, etc.

  // info: AST information about the query
  //   - Contains field name, return type, query structure metadata
};
```

## Apollo Server and Client

### Apollo Server Configuration

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

  // Create Schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // WebSocket server (for Subscriptions)
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

  // Create Apollo Server
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
      // Hide internal error details in production
      if (process.env.NODE_ENV === 'production') {
        if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
          return {
            message: 'Internal server error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          };
        }
      }
      return formattedError;
    },
  });

  await server.start();

  // Express middleware
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Parse token
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

### Apollo Client Configuration (React)

```javascript
// apollo-client.js
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP link
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Authentication link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// WebSocket link (for Subscriptions)
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: {
      authorization: localStorage.getItem('token'),
    },
  })
);

// Split links based on operation type
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

// Create Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          users: {
            // Pagination cache policy
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

### React Hooks Usage

```jsx
// components/UserList.jsx
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';

// Define Query
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
    // Optimistic update
    optimisticResponse: {
      createUser: {
        __typename: 'CreateUserPayload',
        success: true,
        message: 'Creating...',
        user: {
          __typename: 'User',
          id: 'temp-id',
          name: 'New User',
          email: 'temp@example.com',
        },
        errors: null,
      },
    },
    // Update cache
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
        console.log('User created successfully');
      }
    },
    onError: (error) => {
      console.error('Creation failed:', error.message);
    },
  });

  // Subscription Hook
  useSubscription(USER_CREATED, {
    onData: ({ data }) => {
      console.log('New user:', data.data.userCreated);
      refetch(); // Refresh the list
    },
  });

  // Load more
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

  if (loading && !data) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>User List (Total: {data.users.totalCount})</h2>
      <ul>
        {data.users.edges.map(({ node }) => (
          <li key={node.id}>
            {node.name} - {node.email}
          </li>
        ))}
      </ul>
      {data.users.pageInfo.hasNextPage && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
      <button
        onClick={() => createUser({
          variables: {
            input: { name: 'New User', email: 'new@example.com', password: '123456' },
          },
        })}
        disabled={creating}
      >
        Create User
      </button>
    </div>
  );
}

export default UserList;
```

## The N+1 Problem and DataLoader

### What is the N+1 Problem

The N+1 problem is a common performance issue in GraphQL. When querying nested data, without optimization, numerous duplicate database queries are generated.

```graphql
# This query may cause an N+1 problem
query {
  users {           # 1 query to get all users
    id
    name
    orders {        # N queries, one per user for their orders
      id
      total
    }
  }
}
```

If there are 100 users, the above query would execute 1 + 100 = 101 database queries.

### DataLoader Solution

DataLoader is a batch loading and caching tool developed by Facebook, specifically designed to solve the N+1 problem.

```javascript
// dataloaders.js
const DataLoader = require('dataloader');

// Create DataLoader factory function
function createLoaders(db) {
  return {
    // User batch loader
    userLoader: new DataLoader(async (userIds) => {
      // Batch query
      const users = await db.query(
        'SELECT * FROM users WHERE id = ANY($1)',
        [userIds]
      );

      // Return results in request order
      const userMap = new Map(users.map(u => [u.id, u]));
      return userIds.map(id => userMap.get(id) || null);
    }),

    // User orders batch loader
    ordersByUserLoader: new DataLoader(async (userIds) => {
      const orders = await db.query(
        'SELECT * FROM orders WHERE user_id = ANY($1)',
        [userIds]
      );

      // Group by user ID
      const ordersByUser = new Map();
      userIds.forEach(id => ordersByUser.set(id, []));
      orders.forEach(order => {
        ordersByUser.get(order.user_id)?.push(order);
      });

      return userIds.map(id => ordersByUser.get(id) || []);
    }),

    // Product batch loader
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

### Integrating DataLoader with Apollo Server

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

      // Create new DataLoader instances for each request (important!)
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

### Using DataLoader in Resolvers

```javascript
const resolvers = {
  Query: {
    users: async (_, __, { db }) => {
      return db.query('SELECT * FROM users');
    },

    user: async (_, { id }, { loaders }) => {
      // Use DataLoader to load a single user
      return loaders.userLoader.load(id);
    },
  },

  User: {
    orders: async (parent, _, { loaders }) => {
      // Use DataLoader for batch loading orders
      return loaders.ordersByUserLoader.load(parent.id);
    },
  },

  Order: {
    user: async (parent, _, { loaders }) => {
      // Use DataLoader to load user
      return loaders.userLoader.load(parent.userId);
    },
  },

  OrderItem: {
    product: async (parent, _, { loaders }) => {
      // Use DataLoader to load product
      return loaders.productLoader.load(parent.productId);
    },
  },
};
```

### DataLoader Cache Configuration

```javascript
const userLoader = new DataLoader(batchFn, {
  // Disable caching (query on every call)
  cache: false,

  // Custom cache key
  cacheKeyFn: (key) => key.toString(),

  // Batch size limit
  maxBatchSize: 100,

  // Batch scheduling function
  batchScheduleFn: (callback) => setTimeout(callback, 10),
});

// Manually clear cache
userLoader.clear(userId);      // Clear single entry
userLoader.clearAll();         // Clear all entries

// Pre-populate cache
userLoader.prime(userId, user);
```

## Authentication and Authorization

### JWT Authentication Implementation

```javascript
// auth.js
const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate Token
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

// Verify Token
async function verifyToken(authHeader) {
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Optionally fetch full user info from database
    return decoded;
  } catch (error) {
    return null;
  }
}

// Authentication check
function requireAuth(user) {
  if (!user) {
    throw new GraphQLError('Please log in first', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return user;
}

// Role check
function requireRole(user, roles) {
  requireAuth(user);
  if (!roles.includes(user.role)) {
    throw new GraphQLError('Unauthorized to perform this operation', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

module.exports = { generateToken, verifyToken, requireAuth, requireRole };
```

### Schema Directive Authorization

```graphql
# schema.graphql
directive @auth(requires: Role = USER) on FIELD_DEFINITION

enum Role {
  ADMIN
  USER
  GUEST
}

type Query {
  # Public query
  publicPosts: [Post!]!

  # Requires login
  me: User @auth

  # Requires admin privileges
  allUsers: [User!]! @auth(requires: ADMIN)

  # Requires user privileges
  myOrders: [Order!]! @auth(requires: USER)
}

type Mutation {
  # Public operations
  login(email: String!, password: String!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!

  # Requires login
  updateProfile(input: UpdateProfileInput!): User! @auth

  # Requires admin
  deleteUser(id: ID!): Boolean! @auth(requires: ADMIN)
}
```

### Directive Implementation

```javascript
// directives/auth.js
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver, GraphQLError } = require('graphql');

function authDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];

      if (authDirective) {
        const { requires = 'USER' } = authDirective;
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async function (source, args, context, info) {
          const { user } = context;

          // Check if logged in
          if (!user) {
            throw new GraphQLError('Please log in first', {
              extensions: { code: 'UNAUTHENTICATED' },
            });
          }

          // Check role permissions
          const roleHierarchy = { ADMIN: 3, USER: 2, GUEST: 1 };
          if (roleHierarchy[user.role] < roleHierarchy[requires]) {
            throw new GraphQLError(`Requires ${requires} privileges`, {
              extensions: { code: 'FORBIDDEN' },
            });
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

### Field-Level Permission Control

```javascript
const resolvers = {
  User: {
    // Sensitive field permission control
    email: (parent, _, { user }) => {
      // Only the owner or admin can see the email
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

    // Completely hide sensitive fields
    password: () => null, // Never return password
  },

  Order: {
    // Only order owner or admin can view
    paymentInfo: (parent, _, { user }) => {
      if (user?.id !== parent.userId && user?.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized to view payment information', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return parent.paymentInfo;
    },
  },
};
```

## Error Handling

### GraphQL Error Structure

```javascript
// Standard GraphQL error response
{
  "data": null,
  "errors": [
    {
      "message": "User not found",
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

### Custom Error Classes

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
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource, id });
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Please log in first') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Unauthorized to perform this operation') {
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

### Resolver Error Handling

```javascript
const { NotFoundError, ValidationError } = require('./errors');

const resolvers = {
  Query: {
    user: async (_, { id }, { dataSources }) => {
      const user = await dataSources.userAPI.getUserById(id);

      if (!user) {
        throw new NotFoundError('User', id);
      }

      return user;
    },
  },

  Mutation: {
    createUser: async (_, { input }, { dataSources }) => {
      // Validate input
      const errors = [];

      if (!input.email?.includes('@')) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }

      if (input.password?.length < 6) {
        errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
      }

      if (errors.length > 0) {
        return {
          success: false,
          message: 'Input validation failed',
          errors,
        };
      }

      // Check if email already exists
      const existingUser = await dataSources.userAPI.getUserByEmail(input.email);
      if (existingUser) {
        return {
          success: false,
          message: 'Email already registered',
          errors: [{ field: 'email', message: 'This email is already in use' }],
        };
      }

      try {
        const user = await dataSources.userAPI.createUser(input);
        return {
          success: true,
          message: 'User created successfully',
          user,
        };
      } catch (error) {
        // Log error
        console.error('Failed to create user:', error);

        return {
          success: false,
          message: 'Failed to create user, please try again later',
          errors: [{ field: '_', message: 'Internal server error' }],
        };
      }
    },
  },
};
```

### Global Error Handling

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    // Log all errors
    console.error('GraphQL Error:', {
      message: formattedError.message,
      code: formattedError.extensions?.code,
      path: formattedError.path,
      stack: error.stack,
    });

    // Return full error in development
    if (process.env.NODE_ENV === 'development') {
      return {
        ...formattedError,
        stack: error.stack,
      };
    }

    // Hide sensitive information in production
    const code = formattedError.extensions?.code;

    // Known error types, return user-friendly message
    if (['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHENTICATED', 'FORBIDDEN'].includes(code)) {
      return formattedError;
    }

    // Unknown errors, return generic message
    return {
      message: 'Internal server error, please try again later',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    };
  },
});
```

## Performance Optimization and Caching

### Query Complexity Limits

```javascript
// complexity.js
const { createComplexityLimitRule } = require('graphql-validation-complexity');

// Method 1: Using validation rules
const complexityRule = createComplexityLimitRule(1000, {
  onCost: (cost) => {
    console.log('Query complexity:', cost);
  },
  formatErrorMessage: (cost) => {
    return `Query complexity ${cost} exceeds limit of 1000`;
  },
});

// Use in Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [complexityRule],
});
```

### Query Depth Limits

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

### Response Caching

```javascript
// Using Apollo Server cache plugin
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

// Configure caching in Schema
// schema.graphql
type Query {
  # Public data, cache for 1 hour
  posts: [Post!]! @cacheControl(maxAge: 3600)

  # User-related data, private cache
  me: User @cacheControl(maxAge: 0, scope: PRIVATE)

  # No caching
  notifications: [Notification!]! @cacheControl(maxAge: 0)
}

type Post {
  id: ID!
  title: String!
  content: String!
  # Cache author info for 30 minutes
  author: User! @cacheControl(maxAge: 1800)
}
```

### Persisted Queries

```javascript
// Persisted queries reduce network transfer
// Client sends query hash instead of full query

// server.js
const { ApolloServerPluginCacheControl } = require('@apollo/server/plugin/cacheControl');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  persistedQueries: {
    cache: new KeyvAdapter(new Keyv('redis://localhost:6379')),
    ttl: 900, // 15 minutes
  },
});

// Client configuration
const client = new ApolloClient({
  link: createPersistedQueryLink({ sha256 }).concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Batch Requests

```javascript
// Using @defer and @stream directives (experimental)
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

// Stream large lists
query GetAllPosts {
  posts @stream(initialCount: 10) {
    id
    title
    content
  }
}
```

### Field-Level Optimization

```javascript
const resolvers = {
  User: {
    // Only load when requested
    posts: async (parent, _, { loaders }, info) => {
      // Check if posts field was actually requested
      const requestedFields = info.fieldNodes[0].selectionSet?.selections || [];
      const needsFullData = requestedFields.some(f => f.name.value !== 'id');

      if (!needsFullData) {
        // Only need IDs, use lightweight query
        return loaders.postIdsByUserLoader.load(parent.id);
      }

      return loaders.postsByUserLoader.load(parent.id);
    },
  },
};
```

## Interview Key Points

### Core GraphQL Concepts

**Q: What is GraphQL? How does it differ from REST?**

A: GraphQL is an API query language and runtime. Key differences:
- **Endpoints**: REST has multiple endpoints, GraphQL has a single endpoint
- **Data Fetching**: REST has fixed response structure, GraphQL lets clients specify needed fields
- **Version Management**: REST versions via URL, GraphQL evolves via Schema
- **Type System**: GraphQL has strongly typed Schema
- **Network Efficiency**: GraphQL reduces over-fetching and under-fetching

### The N+1 Problem

**Q: What is the N+1 problem? How do you solve it?**

A: The N+1 problem is a performance issue when querying nested data. For example, fetching 100 users with their orders executes 1 (user list) + 100 (orders for each user) = 101 queries.

Solutions:
- **DataLoader**: Batch loading and request-level caching
- **Eager Loading**: ORM-level pre-fetching
- **Field Resolution Optimization**: Optimize data fetching based on query structure

### Authentication and Authorization

**Q: How do you implement authentication and authorization in GraphQL?**

A:
- **Authentication**: Pass user information through Context, typically using JWT
- **Authorization**:
  - Resolver-level checks
  - Custom directives (@auth)
  - Field-level permission control
  - Middleware interception

### Error Handling

**Q: How does GraphQL handle errors?**

A:
- GraphQL responses contain both `data` and `errors` fields
- Partial success: Returns available data along with partial errors
- Custom error types and error codes
- `formatError` hook for error formatting

### Performance Optimization

**Q: How do you optimize GraphQL API performance?**

A:
- **DataLoader** to solve the N+1 problem
- **Query complexity limits** to prevent malicious queries
- **Query depth limits**
- **Response caching** (HTTP caching, Apollo caching)
- **Persisted queries** to reduce network transfer
- **Field-level lazy loading**

### Subscription Implementation

**Q: How does GraphQL Subscription work?**

A:
- Based on WebSocket long connections
- Uses Pub/Sub pattern
- Server publishes events, clients subscribe and receive
- Suitable for real-time notifications, messaging, status updates

### Schema Design

**Q: What are the best practices for GraphQL Schema design?**

A:
- Use meaningful type and field names
- Mutations should return Payload types
- Use Connection pattern for pagination
- Interfaces and union types for polymorphism
- Separate input types from output types
- Use enums appropriately

### Apollo Ecosystem

**Q: What is Apollo Client's caching mechanism?**

A:
- **InMemoryCache**: Normalized cache
- Identifies cached objects via `__typename` and `id`
- **fetchPolicy** controls caching strategy
- **typePolicies** for custom cache behavior
- **Optimistic updates** for better user experience

## Summary

GraphQL provides a powerful and flexible API design approach, particularly suitable for:

1. **Complex Data Requirements**: Nested relationships, diverse clients
2. **Rapid Iteration**: No version management needed, Schema evolution
3. **Mobile Applications**: Precise data fetching, reduced bandwidth
4. **Microservices Aggregation**: Unified data layer

Mastering GraphQL requires understanding:
- Schema design and type systems
- Resolver implementation and data loading optimization
- Authentication, authorization, and error handling
- Performance optimization and caching strategies

By properly utilizing DataLoader, caching, query limits, and other techniques, you can build high-performance, scalable GraphQL APIs.

## Further Reading

### Official Resources

- [GraphQL Official Documentation](https://graphql.org/learn/) - Complete learning guide
- [Apollo Documentation](https://www.apollographql.com/docs/) - Apollo ecosystem documentation
- [GraphQL Specification](https://spec.graphql.org/) - Official specification

### Books

- "Learning GraphQL" - Eve Porcello & Alex Banks
- "Production Ready GraphQL" - Marc-Andre Giroux
- "The Road to GraphQL" - Robin Wieruch

### Tools and Libraries

- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) - Popular GraphQL server
- [Apollo Client](https://www.apollographql.com/docs/react/) - Full-featured GraphQL client
- [GraphQL Playground](https://github.com/graphql/graphql-playground) - Interactive IDE
- [GraphiQL](https://github.com/graphql/graphiql) - In-browser IDE
- [DataLoader](https://github.com/graphql/dataloader) - Batch loading utility
- [graphql-tools](https://www.graphql-tools.com/) - Schema utilities

### Online Resources

- [How to GraphQL](https://www.howtographql.com/) - Free full-stack tutorial
- [GraphQL Weekly](https://www.graphqlweekly.com/) - Weekly newsletter
- [Apollo Blog](https://www.apollographql.com/blog/) - Technical articles and best practices
- [The Guild Blog](https://the-guild.dev/blog) - GraphQL ecosystem insights
