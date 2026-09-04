---
title: RESTful API Design Complete Guide
description: Master REST API design principles and best practices
track: backend
section: http-apis
difficulty: intermediate
tags:
  - REST
  - API
  - HTTP
  - Design
status: imported
origin: old/src/content/docs/backend/restful-api-design.en.md
divergence: 0.214
issues:
  - order-mismatch
legacy:
  category: Backend
  subcategory: API
  order: 6
  lastUpdated: 2026-01-07
---

## What is REST?

REST (Representational State Transfer) is an architectural style for designing networked applications. It was introduced by Roy Fielding in his 2000 doctoral dissertation and has since become the de facto standard for building web APIs. REST is not a protocol or standard but rather a set of architectural constraints and principles that, when applied correctly, create scalable, maintainable, and intuitive web services.

A RESTful API is a web API that adheres to REST principles, leveraging the existing features of HTTP to enable communication between clients and servers. The core idea behind REST is to treat server-side data and functionality as resources that can be identified, accessed, and manipulated through a uniform interface.

### The Six REST Architectural Constraints

1. **Client-Server Separation**: The client and server have distinct responsibilities. The client handles the user interface and user experience, while the server manages data storage, business logic, and security. This separation improves portability and scalability.

2. **Statelessness**: Each request from a client must contain all the information needed to understand and process it. The server does not store any client context between requests. This constraint simplifies server design and improves reliability and scalability.

3. **Cacheability**: Responses must explicitly define whether they are cacheable or not. When properly implemented, caching can eliminate some client-server interactions, improving performance and scalability.

4. **Uniform Interface**: This is the fundamental constraint that distinguishes REST from other architectural styles. It consists of four sub-constraints:
   - Resource identification through URIs
   - Resource manipulation through representations
   - Self-descriptive messages
   - Hypermedia as the engine of application state (HATEOAS)

5. **Layered System**: A client cannot tell whether it is connected directly to the end server or to an intermediary. This allows for load balancers, caches, and security layers to be inserted transparently.

6. **Code on Demand (Optional)**: Servers can temporarily extend or customize client functionality by transferring executable code, such as JavaScript.

### Problems REST Solves

- **Interoperability**: Through a uniform interface, systems built on different platforms and languages can communicate seamlessly
- **Scalability**: Stateless design makes horizontal scaling straightforward
- **Performance**: Caching mechanisms reduce unnecessary network requests
- **Simplicity**: Leveraging existing HTTP protocols reduces learning and implementation costs

## REST Principles Deep Dive

### Resources and Representations

The core concept in REST is the **resource**. A resource is any named piece of information: a document, an image, a service, a collection of other resources, or even a non-virtual object like a person. Each resource is uniquely identified by a URI (Uniform Resource Identifier).

A **representation** is a snapshot of a resource's state at a particular point in time. Representations can be in various formats such as JSON, XML, HTML, or plain text. Clients interact with resources by exchanging representations.

```
Resource: User John
URI: /users/123
Representation: {"id": 123, "name": "John", "email": "john@example.com"}
```

### State Transfer

The "State Transfer" in REST refers to the client triggering changes to resource state through HTTP methods (GET, POST, PUT, DELETE, etc.). The server does not maintain client state; instead, it executes state transitions based on the information contained in each request.

## Resource Naming Conventions

Good resource naming is crucial for creating intuitive and consistent APIs. Following these conventions will make your API easier to understand and use.

### Core Naming Principles

1. **Use Nouns, Not Verbs**

Resources represent things, not actions. The HTTP method indicates the action.

```
Correct: GET /users          Wrong: GET /getUsers
Correct: POST /orders        Wrong: POST /createOrder
Correct: DELETE /products/1  Wrong: DELETE /deleteProduct/1
```

2. **Use Plural Nouns**

Consistency is key. Always use plural forms for collection resources.

```
Correct: /users, /orders, /products
Wrong: /user, /order, /product
```

3. **Use Lowercase Letters and Hyphens**

URIs should be lowercase and use hyphens for multi-word resources.

```
Correct: /user-profiles, /order-items
Wrong: /userProfiles, /user_items, /OrderItems
```

4. **Use Hierarchy to Express Relationships**

Nested resources indicate ownership or containment relationships.

```http
GET /users/123/orders          # All orders for user 123
GET /users/123/orders/456      # Order 456 belonging to user 123
GET /shops/1/products/2/reviews # Reviews for product 2 in shop 1
```

### URL Structure

```
https://api.example.com/v1/users?page=1&limit=20&sort=-created_at
\___/   \_____________/ \/ \____/ \__________________________/
Protocol     Domain   Version Resource      Query Parameters
```

### Anti-Patterns to Avoid

```
# Avoid verbs in URLs
Wrong: POST /users/123/activate
Correct: PATCH /users/123 { "status": "active" }

# Avoid deep nesting (recommend maximum 3 levels)
Wrong: /countries/1/cities/2/districts/3/streets/4/buildings/5
Correct: /buildings/5?district_id=3

# Avoid exposing implementation details
Wrong: /api/v1/mysql/users/select
Correct: /api/v1/users
```

## HTTP Methods

HTTP methods define the actions to be performed on resources. Each method has specific semantics regarding safety, idempotency, and cacheability.

### GET - Retrieve Resources

```http
GET /users         # Get list of users
GET /users/123     # Get specific user
GET /users/123/orders  # Get orders for a user
```

**Characteristics**:
- **Safe**: Does not modify server resource state
- **Idempotent**: Multiple identical requests produce the same result
- **Cacheable**: Responses can be cached

```javascript
// Express.js example
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
```

### POST - Create Resources

```http
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Characteristics**:
- **Not Safe**: Creates new resources
- **Not Idempotent**: Multiple calls may create multiple resources
- Returns `201 Created` with the new resource's URI

```javascript
app.post('/api/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201)
     .location(`/api/users/${user.id}`)
     .json(user);
});
```

### PUT - Full Update/Replace Resources

```http
PUT /users/123
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "age": 30
}
```

**Characteristics**:
- **Not Safe**: Modifies resources
- **Idempotent**: Multiple identical calls produce the same result
- Client must send the complete resource representation

```javascript
app.put('/api/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, overwrite: true }  // Complete replacement
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
```

### PATCH - Partial Update Resources

```http
PATCH /users/123
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

**Characteristics**:
- **Not Safe**: Modifies resources
- **Not Always Idempotent**: Depends on implementation
- Only sends fields that need updating

```javascript
app.patch('/api/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },  // Partial update
    { new: true }
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
```

### DELETE - Remove Resources

```http
DELETE /users/123
```

**Characteristics**:
- **Not Safe**: Removes resources
- **Idempotent**: Deleting the same resource multiple times has the same effect
- Typically returns `204 No Content` or `200 OK`

```javascript
app.delete('/api/users/:id', async (req, res) => {
  const result = await User.findByIdAndDelete(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(204).send();
});
```

### HTTP Methods Comparison Table

| Method  | Safe | Idempotent | Request Body | Purpose              |
|---------|------|------------|--------------|----------------------|
| GET     | Yes  | Yes        | No           | Read resources       |
| POST    | No   | No         | Yes          | Create resources     |
| PUT     | No   | Yes        | Yes          | Replace resources    |
| PATCH   | No   | No         | Yes          | Partial update       |
| DELETE  | No   | Yes        | Optional     | Delete resources     |
| HEAD    | Yes  | Yes        | No           | Get response headers |
| OPTIONS | Yes  | Yes        | No           | Get allowed methods  |

## Status Codes

HTTP status codes communicate the result of a request. Using them correctly improves API usability and debugging.

### 2xx Success

| Code | Name        | Use Case                           |
|------|-------------|-------------------------------------|
| 200  | OK          | GET/PUT/PATCH succeeded            |
| 201  | Created     | POST created a new resource        |
| 202  | Accepted    | Async task accepted for processing |
| 204  | No Content  | DELETE succeeded, no response body |

### 3xx Redirection

| Code | Name              | Use Case                      |
|------|-------------------|-------------------------------|
| 301  | Moved Permanently | Resource permanently moved    |
| 302  | Found             | Temporary redirect            |
| 304  | Not Modified      | Resource unchanged (cache valid) |

### 4xx Client Errors

| Code | Name                 | Use Case                          |
|------|----------------------|-----------------------------------|
| 400  | Bad Request          | Malformed request syntax          |
| 401  | Unauthorized         | Authentication required           |
| 403  | Forbidden            | Authenticated but not authorized  |
| 404  | Not Found            | Resource does not exist           |
| 405  | Method Not Allowed   | HTTP method not supported         |
| 409  | Conflict             | Resource conflict (e.g., duplicate) |
| 422  | Unprocessable Entity | Syntactically correct but semantically wrong |
| 429  | Too Many Requests    | Rate limit exceeded               |

### 5xx Server Errors

| Code | Name                  | Use Case              |
|------|-----------------------|-----------------------|
| 500  | Internal Server Error | Server-side error     |
| 502  | Bad Gateway           | Gateway error         |
| 503  | Service Unavailable   | Service temporarily down |
| 504  | Gateway Timeout       | Gateway timeout       |

## Request/Response Format

### Request Format

```http
POST /api/v1/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Accept: application/json
Accept-Language: en-US

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

### Response Format

**Success Response**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**List Response**:

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error Response**:

```json
{
  "code": 40001,
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "documentation": "https://api.example.com/docs/errors#40001",
  "requestId": "req_abc123xyz",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Date/Time Format

Use ISO 8601 format for consistency:

```json
{
  "createdAt": "2024-01-15T10:30:00Z",        // UTC
  "updatedAt": "2024-01-15T18:30:00+08:00"    // With timezone
}
```

## Pagination and Filtering

### Pagination Strategies

**Offset Pagination**:

```http
GET /users?page=2&pageSize=20
GET /users?offset=20&limit=20
```

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

**Cursor Pagination** (recommended for large datasets):

```http
GET /users?cursor=eyJpZCI6MTAwfQ&limit=20
```

```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIwfQ",
    "prevCursor": "eyJpZCI6ODV9",
    "hasMore": true
  }
}
```

Cursor pagination avoids performance issues with deep pagination in large datasets.

### Filtering

```http
# Exact match
GET /users?status=active

# Multiple values
GET /users?role=admin,editor

# Range filtering
GET /orders?created_after=2024-01-01&created_before=2024-12-31
GET /products?price_min=100&price_max=500

# Search
GET /users?q=john
GET /products?search=iPhone
```

### Sorting

```http
# Single field sorting
GET /users?sort=created_at        # Ascending
GET /users?sort=-created_at       # Descending (prefix with -)

# Multiple field sorting
GET /users?sort=-created_at,name  # First by created_at desc, then name asc

# Explicit sort direction
GET /users?sort_by=name&order=asc
```

### Field Selection

```http
# Return only specified fields
GET /users?fields=id,name,email

# Exclude certain fields
GET /users?exclude=password,internal_notes
```

## Versioning

API versioning ensures backward compatibility as your API evolves. There are several strategies to implement versioning.

### URL Path Versioning (Recommended)

```
https://api.example.com/v1/users
https://api.example.com/v2/users
```

**Pros**: Intuitive, easy to understand, cache-friendly, simple routing

### Header Versioning

Using Accept header:

```http
GET /users HTTP/1.1
Accept: application/vnd.example.v1+json
```

Or custom header:

```http
GET /users HTTP/1.1
X-API-Version: 1
```

### Query Parameter Versioning

```
https://api.example.com/users?version=1
```

### Version Management Example

```javascript
// Version routing configuration
const express = require('express');
const app = express();

// Version 1
const v1Router = require('./routes/v1');
app.use('/api/v1', v1Router);

// Version 2 (new features)
const v2Router = require('./routes/v2');
app.use('/api/v2', v2Router);

// Default redirect to latest stable version
app.use('/api', (req, res) => {
  res.redirect(301, `/api/v1${req.path}`);
});
```

## HATEOAS

### What is HATEOAS?

HATEOAS (Hypermedia as the Engine of Application State) represents the highest level of REST maturity. It requires responses to include hyperlinks to related operations, enabling clients to discover available actions dynamically.

### Richardson Maturity Model

- **Level 0**: Single URI, single HTTP method (RPC style)
- **Level 1**: Multiple resource URIs, single HTTP method
- **Level 2**: Multiple resource URIs + correct HTTP method usage
- **Level 3**: Level 2 + HATEOAS (fully RESTful)

### HATEOAS Response Example

```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active",
  "_links": {
    "self": {
      "href": "/api/v1/users/123"
    },
    "update": {
      "href": "/api/v1/users/123",
      "method": "PUT"
    },
    "delete": {
      "href": "/api/v1/users/123",
      "method": "DELETE"
    },
    "orders": {
      "href": "/api/v1/users/123/orders"
    },
    "deactivate": {
      "href": "/api/v1/users/123/deactivate",
      "method": "POST"
    }
  },
  "_embedded": {
    "recentOrders": [
      {
        "id": 456,
        "total": 299.00,
        "_links": {
          "self": { "href": "/api/v1/orders/456" }
        }
      }
    ]
  }
}
```

### Implementing HATEOAS

```javascript
// Link generator
function generateLinks(user, baseUrl) {
  const links = {
    self: { href: `${baseUrl}/users/${user.id}` },
    update: { href: `${baseUrl}/users/${user.id}`, method: 'PUT' },
    orders: { href: `${baseUrl}/users/${user.id}/orders` }
  };

  // Conditional links based on state
  if (user.status === 'active') {
    links.deactivate = {
      href: `${baseUrl}/users/${user.id}/deactivate`,
      method: 'POST'
    };
  } else {
    links.activate = {
      href: `${baseUrl}/users/${user.id}/activate`,
      method: 'POST'
    };
  }

  return links;
}

app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({
    ...user.toJSON(),
    _links: generateLinks(user, `${req.protocol}://${req.get('host')}/api/v1`)
  });
});
```

### Why HATEOAS is Rarely Used

While HATEOAS is theoretically ideal for RESTful APIs, it is rarely fully implemented in practice because:

- It adds complexity to responses
- Modern frontend frameworks typically do not rely on hypermedia for navigation
- API clients usually have hardcoded knowledge of available endpoints
- It is more valuable for public APIs than internal ones

## Best Practices

### Security

```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Max 100 requests
  message: { code: 10002, message: 'Too many requests' }
}));

// Input validation
const Joi = require('joi');
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150)
});

// Security headers
const helmet = require('helmet');
app.use(helmet());
```

### Idempotency

```javascript
// Use idempotency keys to prevent duplicate submissions
app.post('/orders', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (idempotencyKey) {
    const existing = await cache.get(`idem:${idempotencyKey}`);
    if (existing) {
      return res.json(existing);
    }
  }

  const order = await Order.create(req.body);

  if (idempotencyKey) {
    await cache.set(`idem:${idempotencyKey}`, order, 86400);
  }

  res.status(201).json(order);
});
```

### Error Handling

```javascript
// Custom error class
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const response = {
    code: err.code || 10000,
    message: err.message || 'Internal server error',
    details: err.details,
    requestId: req.id,
    timestamp: new Date().toISOString()
  };

  // Hide stack trace in production
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});
```

### Common Pitfalls to Avoid

1. **Using verbs in URLs**: RESTful APIs should use HTTP methods for actions
2. **Inconsistent naming**: Mixing camelCase and snake_case
3. **Ignoring HTTP status codes**: Returning 200 for all responses
4. **Over-nesting**: URL hierarchies that are too deep to maintain
5. **Exposing sensitive information**: Such as passwords or internal IDs
6. **Lacking version control**: API changes breaking client applications
7. **No pagination**: Large datasets degrading performance
8. **Vague error messages**: Not helping clients identify issues

## Interview Key Points

### Common Interview Questions

1. **What is RESTful API? How does it differ from RPC?**
   - REST is resource-oriented, RPC is procedure-oriented
   - REST uses standard HTTP methods, RPC typically only uses POST
   - REST is stateless, RPC may maintain state

2. **What is the difference between PUT and PATCH?**
   - PUT is a complete replacement, requires sending all resource fields
   - PATCH is a partial update, only sends fields to modify
   - PUT is idempotent, PATCH may not be

3. **How would you design a pagination API?**
   - Offset pagination vs cursor pagination
   - Return metadata like total count and page numbers
   - Recommend cursor pagination for large datasets

4. **What is the difference between 401 and 403?**
   - 401 Unauthorized: Not authenticated (need to log in)
   - 403 Forbidden: Authenticated but not authorized

5. **How do you ensure API idempotency?**
   - GET/PUT/DELETE are naturally idempotent
   - Use idempotency keys for POST
   - Database unique constraints

6. **What is HATEOAS? Why is it rarely used?**
   - Hypermedia-driven application state
   - Adds response complexity, frontend frameworks do not depend on it
   - Better suited for public APIs; internal APIs can simplify

7. **What are the different ways to version an API?**
   - URL path (recommended)
   - Request headers (Accept or custom header)
   - Query parameters

### Performance Considerations

1. **Use ETag and conditional requests**: Reduce unnecessary data transfer
2. **Compress responses**: Enable gzip/brotli compression
3. **Field selection**: Allow clients to choose required fields
4. **Batch operations**: Reduce the number of HTTP requests
5. **Cache strategy**: Set appropriate Cache-Control headers
6. **Connection reuse**: Use HTTP/2 or Keep-Alive
7. **Async processing**: Return 202 Accepted for long-running operations

## Further Reading

### Official Specifications

- [HTTP/1.1 RFC 7231](https://tools.ietf.org/html/rfc7231) - HTTP Semantics and Content
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) - API Description Standard
- [JSON:API](https://jsonapi.org/) - JSON API Specification

### Books

- "RESTful Web APIs" by Leonard Richardson
- "REST API Design Rulebook" by Mark Masse
- "Web API Design" by Brian Mulloy (Apigee)

### Resources

- [REST API Tutorial](https://restfulapi.net/) - Comprehensive tutorial
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines) - Microsoft's API design guide
- [Google API Design Guide](https://cloud.google.com/apis/design) - Google's API design principles
- [Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/) - Zalando's API specifications

### Tools

- [Postman](https://www.postman.com/) - API development and testing platform
- [Insomnia](https://insomnia.rest/) - Lightweight API client
- [Swagger Editor](https://editor.swagger.io/) - Online OpenAPI editor
- [Hoppscotch](https://hoppscotch.io/) - Open-source API testing tool
