---
title: API Design Best Practices
description: Master API design for elegant and usable interfaces
track: backend
section: http-apis
difficulty: intermediate
tags:
  - API Design
  - REST
  - Versioning
  - Documentation
status: imported
origin: old/src/content/docs/backend/api-design.en.md
divergence: 0.209
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 23
  lastUpdated: 2026-01-07
---

## Introduction

An API (Application Programming Interface) is the cornerstone of modern software development. A well-designed API can boost development efficiency, reduce maintenance costs, and improve user experience. We'll explore the core principles, best practices, and common patterns of API design to help you build elegant, user-friendly, and maintainable interfaces.

## API Design Principles

### Consistency Principle

Consistency is the primary principle of API design. Maintaining consistent naming, structure, and behavior significantly reduces the learning curve for developers.

```javascript
// Good design: Consistent naming and structure
GET    /api/v1/users          // Get user list
GET    /api/v1/users/:id      // Get single user
POST   /api/v1/users          // Create user
PUT    /api/v1/users/:id      // Update user
DELETE /api/v1/users/:id      // Delete user

GET    /api/v1/products       // Get product list
GET    /api/v1/products/:id   // Get single product
POST   /api/v1/products       // Create product
PUT    /api/v1/products/:id   // Update product
DELETE /api/v1/products/:id   // Delete product

// Poor design: Inconsistent naming
GET    /api/v1/getUsers
POST   /api/v1/user/create
DELETE /api/v1/removeProduct/:id
```

### Simplicity Principle

APIs should be simple and intuitive, following the Principle of Least Astonishment.

```javascript
// Simple API design
const apiClient = {
  // Clear and straightforward method signatures
  async getUser(userId) {
    return fetch(`/api/v1/users/${userId}`);
  },

  async createUser(userData) {
    return fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  },

  // Avoid over-engineering
  async searchUsers(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      page: options.page || 1,
      limit: options.limit || 20
    });
    return fetch(`/api/v1/users/search?${params}`);
  }
};
```

### Predictability Principle

Users should be able to predict API behavior. Similar operations should have similar interfaces.

```python
# Flask example: Predictable response structure
from flask import Flask, jsonify
from functools import wraps
from datetime import datetime

app = Flask(__name__)

def standard_response(func):
    """Decorator for unified response format"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            return jsonify({
                'success': True,
                'data': result,
                'error': None,
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'data': None,
                'error': {
                    'code': getattr(e, 'code', 'INTERNAL_ERROR'),
                    'message': str(e)
                },
                'timestamp': datetime.utcnow().isoformat()
            }), getattr(e, 'status_code', 500)
    return wrapper

@app.route('/api/v1/users/<int:user_id>')
@standard_response
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return user.to_dict()
```

### Backward Compatibility Principle

API changes should not break existing clients. Adding new fields is generally safe, but removing or modifying fields requires careful handling.

```javascript
// Backward compatible evolution strategy
// v1: Original response
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}

// v1 evolution: Adding new fields (backward compatible)
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "avatar_url": "https://example.com/avatars/1.jpg",  // New field
  "created_at": "2024-01-15T10:00:00Z"               // New field
}

// v2: Breaking changes require new version
{
  "id": 1,
  "full_name": "John Doe",  // name changed to full_name
  "contact": {              // email nested in contact object
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

## RESTful Design Specification

### Resource-Oriented Design

The core of REST API is resources. Each resource should have a unique URI and be operated through HTTP methods.

```javascript
// Express.js resource routing example
const express = require('express');
const router = express.Router();

// User resource
router.route('/users')
  .get(userController.list)      // GET /users - List
  .post(userController.create);  // POST /users - Create

router.route('/users/:id')
  .get(userController.get)       // GET /users/:id - Retrieve
  .put(userController.update)    // PUT /users/:id - Full update
  .patch(userController.patch)   // PATCH /users/:id - Partial update
  .delete(userController.delete);// DELETE /users/:id - Delete

// Nested resources
router.route('/users/:userId/orders')
  .get(orderController.listByUser)
  .post(orderController.createForUser);

router.route('/users/:userId/orders/:orderId')
  .get(orderController.getByUser)
  .put(orderController.updateByUser);
```

### HTTP Method Semantics

| Method | Semantic | Idempotent | Safe | Example |
|--------|----------|------------|------|---------|
| GET | Retrieve resource | Yes | Yes | Get user info |
| POST | Create resource | No | No | Create new user |
| PUT | Full replacement | Yes | No | Update all user fields |
| PATCH | Partial update | No* | No | Update only user email |
| DELETE | Delete resource | Yes | No | Delete user |
| HEAD | Get metadata | Yes | Yes | Check if resource exists |
| OPTIONS | Get supported methods | Yes | Yes | CORS preflight request |

```python
# FastAPI complete CRUD example
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class UserCreate(BaseModel):
    name: str
    email: str
    age: Optional[int] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None

class User(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int] = None

# Simulated database
users_db = {}

@app.get("/users", response_model=list[User])
async def list_users(skip: int = 0, limit: int = 10):
    """Get user list"""
    return list(users_db.values())[skip:skip + limit]

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    """Get single user"""
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return users_db[user_id]

@app.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Create user"""
    user_id = len(users_db) + 1
    new_user = User(id=user_id, **user.dict())
    users_db[user_id] = new_user
    return new_user

@app.put("/users/{user_id}", response_model=User)
async def replace_user(user_id: int, user: UserCreate):
    """Full replacement of user"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    updated_user = User(id=user_id, **user.dict())
    users_db[user_id] = updated_user
    return updated_user

@app.patch("/users/{user_id}", response_model=User)
async def update_user(user_id: int, user: UserUpdate):
    """Partial update of user"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    stored_user = users_db[user_id]
    update_data = user.dict(exclude_unset=True)
    updated_user = stored_user.copy(update=update_data)
    users_db[user_id] = updated_user
    return updated_user

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """Delete user"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    del users_db[user_id]
```

## URL Design and Naming

### URL Design Principles

```
# URL design best practices

# Use plural nouns for collections
GET /api/v1/users              # Correct
GET /api/v1/user               # Avoid
GET /api/v1/getUsers           # Wrong: Don't use verbs

# Use hyphens to separate multiple words
GET /api/v1/user-profiles      # Correct
GET /api/v1/user_profiles      # Acceptable (maintain consistency)
GET /api/v1/userProfiles       # Avoid

# Use lowercase letters
GET /api/v1/users              # Correct
GET /api/v1/Users              # Avoid

# Don't include file extensions
GET /api/v1/users/123          # Correct
GET /api/v1/users/123.json     # Avoid

# Nesting represents relationships
GET /api/v1/users/123/orders            # User's orders
GET /api/v1/users/123/orders/456        # User's specific order
GET /api/v1/users/123/orders/456/items  # Order's items

# Avoid deep nesting (recommend no more than 3 levels)
GET /api/v1/orders/456/items            # Simplified: Direct access to order items
GET /api/v1/order-items?order_id=456    # Or use query parameters
```

### Query Parameter Design

```javascript
// Express.js query parameter handling
app.get('/api/v1/products', async (req, res) => {
  const {
    // Pagination parameters
    page = 1,
    limit = 20,

    // Sorting parameters
    sort = 'created_at',
    order = 'desc',

    // Filter parameters
    category,
    min_price,
    max_price,
    in_stock,

    // Search parameters
    q,

    // Field selection
    fields
  } = req.query;

  // Build query
  let query = Product.find();

  // Apply filters
  if (category) query = query.where('category').equals(category);
  if (min_price) query = query.where('price').gte(parseFloat(min_price));
  if (max_price) query = query.where('price').lte(parseFloat(max_price));
  if (in_stock !== undefined) query = query.where('in_stock').equals(in_stock === 'true');

  // Apply search
  if (q) {
    query = query.where('name').regex(new RegExp(q, 'i'));
  }

  // Apply sorting
  const sortOrder = order === 'asc' ? 1 : -1;
  query = query.sort({ [sort]: sortOrder });

  // Apply field selection
  if (fields) {
    const selectedFields = fields.split(',').join(' ');
    query = query.select(selectedFields);
  }

  // Apply pagination
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100); // Limit maximum
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    query.skip(skip).limit(limitNum),
    Product.countDocuments(query.getFilter())
  ]);

  res.json({
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// Example request
// GET /api/v1/products?category=electronics&min_price=100&sort=price&order=asc&page=2&limit=10&fields=id,name,price
```

## HTTP Status Code Usage

### Status Code Categories

```javascript
// Status code constant definitions
const HttpStatus = {
  // 2xx Success
  OK: 200,                    // Request successful
  CREATED: 201,               // Resource created successfully
  ACCEPTED: 202,              // Request accepted, async processing
  NO_CONTENT: 204,            // Success, no return content

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,     // Permanent redirect
  FOUND: 302,                 // Temporary redirect
  NOT_MODIFIED: 304,          // Resource not modified (cache valid)

  // 4xx Client Errors
  BAD_REQUEST: 400,           // Request format error
  UNAUTHORIZED: 401,          // Not authenticated
  FORBIDDEN: 403,             // No permission
  NOT_FOUND: 404,             // Resource not found
  METHOD_NOT_ALLOWED: 405,    // Method not allowed
  CONFLICT: 409,              // Resource conflict
  GONE: 410,                  // Resource deleted
  UNPROCESSABLE_ENTITY: 422,  // Validation failed
  TOO_MANY_REQUESTS: 429,     // Too many requests

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500, // Server internal error
  NOT_IMPLEMENTED: 501,       // Feature not implemented
  BAD_GATEWAY: 502,           // Gateway error
  SERVICE_UNAVAILABLE: 503,   // Service unavailable
  GATEWAY_TIMEOUT: 504        // Gateway timeout
};
```

### Status Code Usage Scenarios

```python
# FastAPI status code usage examples
from fastapi import FastAPI, HTTPException, status, Response
from fastapi.responses import JSONResponse

app = FastAPI()

# 200 OK - Successful retrieval
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await find_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user  # Default 200

# 201 Created - Creation successful
@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    new_user = await save_user(user)
    return new_user

# 202 Accepted - Async processing
@app.post("/reports", status_code=status.HTTP_202_ACCEPTED)
async def generate_report(report_config: ReportConfig):
    task_id = await queue_report_generation(report_config)
    return {
        "message": "Report generation started",
        "task_id": task_id,
        "status_url": f"/tasks/{task_id}"
    }

# 204 No Content - Deletion successful
@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    await remove_user(user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# 400 Bad Request - Request format error
@app.post("/users")
async def create_user_with_validation(user: UserCreate):
    if not is_valid_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    return await save_user(user)

# 401 Unauthorized - Not authenticated
@app.get("/profile")
async def get_profile(token: str = None):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return await get_user_profile(token)

# 403 Forbidden - No permission
@app.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return await remove_user(user_id)

# 409 Conflict - Resource conflict
@app.post("/users")
async def create_user_unique(user: UserCreate):
    existing = await find_user_by_email(user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    return await save_user(user)

# 422 Unprocessable Entity - Validation failed
@app.post("/orders")
async def create_order(order: OrderCreate):
    if order.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{
                "field": "quantity",
                "message": "Quantity must be positive"
            }]
        )
    return await save_order(order)

# 429 Too Many Requests - Rate limiting
@app.get("/api/data")
async def get_data_with_rate_limit(request: Request):
    if is_rate_limited(request.client.host):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": "60"}
        )
    return await fetch_data()
```

## Request/Response Format

### Unified Response Format

```typescript
// TypeScript response format definitions
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: ResponseMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetail[];
  stack?: string; // Development environment only
}

interface ErrorDetail {
  field: string;
  message: string;
  code?: string;
}

interface ResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Express.js middleware implementation
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Response formatting utilities
export const responseHelper = {
  success<T>(res: Response, data: T, meta?: Partial<ResponseMeta>) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req.requestId,
        ...meta
      }
    };
    return res.json(response);
  },

  created<T>(res: Response, data: T) {
    return res.status(201).json({
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req.requestId
      }
    });
  },

  error(res: Response, statusCode: number, error: ApiError) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req.requestId
      }
    };
    return res.status(statusCode).json(response);
  },

  paginated<T>(res: Response, data: T[], pagination: PaginationMeta) {
    return res.json({
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req.requestId,
        pagination
      }
    });
  }
};

// Usage example
app.get('/api/v1/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return responseHelper.error(res, 404, {
      code: 'USER_NOT_FOUND',
      message: `User with id ${req.params.id} not found`
    });
  }
  return responseHelper.success(res, user);
});
```

### Request Body Design

```javascript
// Request validation middleware
const Joi = require('joi');

// Define validation schemas
const schemas = {
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    age: Joi.number().integer().min(0).max(150).optional(),
    role: Joi.string().valid('user', 'admin', 'moderator').default('user'),
    preferences: Joi.object({
      newsletter: Joi.boolean().default(false),
      notifications: Joi.boolean().default(true),
      language: Joi.string().valid('en', 'es', 'fr', 'de').default('en')
    }).optional()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    age: Joi.number().integer().min(0).max(150),
    preferences: Joi.object({
      newsletter: Joi.boolean(),
      notifications: Joi.boolean(),
      language: Joi.string().valid('en', 'es', 'fr', 'de')
    })
  }).min(1) // At least one field to update
};

// Validation middleware
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
        code: d.type
      }));

      return res.status(422).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details
        }
      });
    }

    req.validatedBody = value;
    next();
  };
};

// Using validation middleware
app.post('/api/v1/users', validate('createUser'), async (req, res) => {
  const user = await User.create(req.validatedBody);
  res.status(201).json({ success: true, data: user });
});
```

## Pagination and Filtering

### Pagination Strategies

```python
# FastAPI pagination implementation
from fastapi import FastAPI, Query, Depends
from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel
from pydantic.generics import GenericModel

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = Query(1, ge=1, description="Page number")
    limit: int = Query(20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit

class PaginatedResponse(GenericModel, Generic[T]):
    data: List[T]
    pagination: dict

    @classmethod
    def create(cls, items: List[T], total: int, params: PaginationParams):
        total_pages = (total + params.limit - 1) // params.limit
        return cls(
            data=items,
            pagination={
                "page": params.page,
                "limit": params.limit,
                "total": total,
                "total_pages": total_pages,
                "has_next": params.page < total_pages,
                "has_prev": params.page > 1
            }
        )

# Offset pagination (suitable for small datasets)
@app.get("/users", response_model=PaginatedResponse[User])
async def list_users(
    pagination: PaginationParams = Depends(),
    name: Optional[str] = Query(None),
    role: Optional[str] = Query(None)
):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if role:
        query["role"] = role

    total = await User.count_documents(query)
    users = await User.find(query) \
        .skip(pagination.offset) \
        .limit(pagination.limit) \
        .to_list(pagination.limit)

    return PaginatedResponse.create(users, total, pagination)

# Cursor pagination (suitable for large datasets)
class CursorPaginationParams(BaseModel):
    cursor: Optional[str] = Query(None, description="Pagination cursor")
    limit: int = Query(20, ge=1, le=100)

@app.get("/posts")
async def list_posts(
    pagination: CursorPaginationParams = Depends()
):
    query = {}

    # Parse cursor
    if pagination.cursor:
        cursor_data = decode_cursor(pagination.cursor)
        query["_id"] = {"$gt": cursor_data["last_id"]}

    posts = await Post.find(query) \
        .sort("_id", 1) \
        .limit(pagination.limit + 1) \
        .to_list(pagination.limit + 1)

    has_next = len(posts) > pagination.limit
    if has_next:
        posts = posts[:-1]

    next_cursor = None
    if has_next and posts:
        next_cursor = encode_cursor({"last_id": str(posts[-1]["_id"])})

    return {
        "data": posts,
        "pagination": {
            "next_cursor": next_cursor,
            "has_next": has_next,
            "limit": pagination.limit
        }
    }

def encode_cursor(data: dict) -> str:
    import base64
    import json
    return base64.urlsafe_b64encode(json.dumps(data).encode()).decode()

def decode_cursor(cursor: str) -> dict:
    import base64
    import json
    return json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
```

### Advanced Filtering

```javascript
// Express.js advanced filtering implementation
const buildFilter = (query) => {
  const filter = {};
  const operators = {
    eq: (v) => v,
    ne: (v) => ({ $ne: v }),
    gt: (v) => ({ $gt: parseFloat(v) }),
    gte: (v) => ({ $gte: parseFloat(v) }),
    lt: (v) => ({ $lt: parseFloat(v) }),
    lte: (v) => ({ $lte: parseFloat(v) }),
    in: (v) => ({ $in: v.split(',') }),
    nin: (v) => ({ $nin: v.split(',') }),
    like: (v) => ({ $regex: v, $options: 'i' }),
    between: (v) => {
      const [min, max] = v.split(',');
      return { $gte: parseFloat(min), $lte: parseFloat(max) };
    }
  };

  // Parse filter parameters: field[operator]=value
  Object.entries(query).forEach(([key, value]) => {
    const match = key.match(/^(\w+)\[(\w+)\]$/);
    if (match) {
      const [, field, op] = match;
      if (operators[op]) {
        filter[field] = operators[op](value);
      }
    } else if (!['page', 'limit', 'sort', 'fields'].includes(key)) {
      // Simple equality filter
      filter[key] = value;
    }
  });

  return filter;
};

// Usage example
app.get('/api/v1/products', async (req, res) => {
  const filter = buildFilter(req.query);

  // Request examples:
  // GET /products?category=electronics&price[gte]=100&price[lte]=500
  // GET /products?name[like]=phone&status[in]=active,pending
  // GET /products?created_at[between]=2024-01-01,2024-12-31

  const products = await Product.find(filter)
    .sort(req.query.sort || '-created_at')
    .skip((req.query.page - 1) * req.query.limit)
    .limit(parseInt(req.query.limit) || 20);

  res.json({ success: true, data: products });
});
```

## API Versioning

### Versioning Strategies

```javascript
// 1. URL path versioning (most common)
// /api/v1/users
// /api/v2/users

const express = require('express');
const app = express();

// v1 routes
const v1Router = express.Router();
v1Router.get('/users', (req, res) => {
  res.json({ version: 'v1', data: users });
});

// v2 routes (new field structure)
const v2Router = express.Router();
v2Router.get('/users', (req, res) => {
  const transformedUsers = users.map(u => ({
    ...u,
    fullName: `${u.firstName} ${u.lastName}`,
    contact: { email: u.email, phone: u.phone }
  }));
  res.json({ version: 'v2', data: transformedUsers });
});

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// 2. Header versioning
// Accept: application/vnd.myapi.v1+json

const versionMiddleware = (req, res, next) => {
  const accept = req.headers['accept'] || '';
  const match = accept.match(/application\/vnd\.myapi\.v(\d+)\+json/);
  req.apiVersion = match ? parseInt(match[1]) : 1;
  next();
};

app.use(versionMiddleware);

app.get('/api/users', (req, res) => {
  if (req.apiVersion === 2) {
    return res.json({ version: 'v2', data: transformedUsers });
  }
  return res.json({ version: 'v1', data: users });
});

// 3. Query parameter versioning
// /api/users?version=2

app.get('/api/users', (req, res) => {
  const version = parseInt(req.query.version) || 1;
  // Return different format based on version
});
```

### Version Migration Strategy

```python
# FastAPI version migration example
from fastapi import FastAPI, APIRouter, Depends, Header
from typing import Optional
import warnings

app = FastAPI()

# Version detection middleware
async def get_api_version(
    x_api_version: Optional[str] = Header(None, alias="X-API-Version")
) -> int:
    if x_api_version:
        return int(x_api_version)
    return 1

# v1 response model
class UserV1(BaseModel):
    id: int
    name: str
    email: str

# v2 response model (structural changes)
class UserV2(BaseModel):
    id: int
    profile: dict
    contact: dict

# Version adapter
class UserAdapter:
    @staticmethod
    def to_v1(user: dict) -> UserV1:
        return UserV1(
            id=user["id"],
            name=user["name"],
            email=user["email"]
        )

    @staticmethod
    def to_v2(user: dict) -> UserV2:
        return UserV2(
            id=user["id"],
            profile={
                "name": user["name"],
                "avatar": user.get("avatar"),
                "bio": user.get("bio")
            },
            contact={
                "email": user["email"],
                "phone": user.get("phone")
            }
        )

# Unified endpoint, returns different format based on version
@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    version: int = Depends(get_api_version)
):
    user = await fetch_user(user_id)

    if version == 1:
        # v1 deprecation warning
        warnings.warn("API v1 is deprecated. Please migrate to v2.")
        return {
            "data": UserAdapter.to_v1(user),
            "deprecation": {
                "message": "This API version is deprecated",
                "sunset_date": "2025-01-01",
                "migration_guide": "https://docs.example.com/migration/v1-to-v2"
            }
        }
    elif version == 2:
        return {"data": UserAdapter.to_v2(user)}
    else:
        raise HTTPException(400, f"Unsupported API version: {version}")

# Version deprecation response headers
@app.middleware("http")
async def add_deprecation_headers(request, call_next):
    response = await call_next(request)

    # Add deprecation warning headers for v1 requests
    if "v1" in request.url.path:
        response.headers["Deprecation"] = "true"
        response.headers["Sunset"] = "Sat, 01 Jan 2025 00:00:00 GMT"
        response.headers["Link"] = '</api/v2>; rel="successor-version"'

    return response
```

## Error Handling Specification

### Unified Error Format

```typescript
// Error type definitions
interface ApiError {
  code: string;           // Error code (machine readable)
  message: string;        // Error message (human readable)
  details?: ErrorDetail[];// Detailed errors (field level)
  doc_url?: string;       // Documentation link
  request_id?: string;    // Request tracking ID
}

interface ErrorDetail {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Error code enum
const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Authorization errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Business errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  ORDER_EXPIRED: 'ORDER_EXPIRED',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

// Custom error class
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: ErrorDetail[]
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: ErrorDetail[]) {
    return new AppError(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(ErrorCodes.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = 'Permission denied') {
    return new AppError(ErrorCodes.FORBIDDEN, message, 403);
  }

  static notFound(resource: string) {
    return new AppError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
  }

  static conflict(message: string) {
    return new AppError(ErrorCodes.CONFLICT, message, 409);
  }

  static validation(details: ErrorDetail[]) {
    return new AppError(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      422,
      details
    );
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}

// Global error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error
  console.error({
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method
  });

  // AppError handling
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        ...err.toJSON(),
        request_id: req.requestId,
        doc_url: `https://docs.example.com/errors/${err.code}`
      }
    });
  }

  // Joi validation error
  if (err.name === 'ValidationError' && err.isJoi) {
    const details = err.details.map(d => ({
      field: d.path.join('.'),
      code: d.type,
      message: d.message
    }));
    return res.status(422).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Request validation failed',
        details,
        request_id: req.requestId
      }
    });
  }

  // Unknown error
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: isDev ? err.message : 'An unexpected error occurred',
      stack: isDev ? err.stack : undefined,
      request_id: req.requestId
    }
  });
};

app.use(errorHandler);
```

### Error Response Examples

```json
// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided access token is invalid or expired",
    "doc_url": "https://docs.example.com/errors/INVALID_TOKEN",
    "request_id": "req_abc123"
  }
}

// 422 Validation Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "code": "invalid_format",
        "message": "Must be a valid email address",
        "value": "invalid-email"
      },
      {
        "field": "age",
        "code": "out_of_range",
        "message": "Must be between 0 and 150",
        "value": -5
      }
    ],
    "request_id": "req_xyz789"
  }
}

// 429 Rate Limit
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds",
    "retry_after": 60,
    "limit": 100,
    "remaining": 0,
    "reset_at": "2024-01-15T10:30:00Z",
    "request_id": "req_def456"
  }
}
```

## API Documentation (OpenAPI/Swagger)

### OpenAPI Specification

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: User Management API
  description: |
    This is the API documentation for a user management system.

    ## Authentication
    All authenticated endpoints require a Bearer Token in the request header:
    ```
    Authorization: Bearer <your_token>
    ```

    ## Error Handling
    All error responses follow a unified format, see the error response model.
  version: 1.0.0
  contact:
    name: API Support Team
    email: api-support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging
  - url: http://localhost:3000/v1
    description: Local Development

tags:
  - name: Users
    description: User management operations
  - name: Authentication
    description: Authentication operations

paths:
  /users:
    get:
      tags:
        - Users
      summary: Get user list
      description: Get paginated user list with filtering and sorting
      operationId: listUsers
      parameters:
        - name: page
          in: query
          description: Page number (starting from 1)
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: Items per page
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: role
          in: query
          description: Filter by role
          schema:
            type: string
            enum: [user, admin, moderator]
        - name: sort
          in: query
          description: Sort field
          schema:
            type: string
            default: created_at
        - name: order
          in: query
          description: Sort direction
          schema:
            type: string
            enum: [asc, desc]
            default: desc
      responses:
        '200':
          description: Successfully retrieved user list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
              example:
                success: true
                data:
                  - id: 1
                    name: "John Doe"
                    email: "john@example.com"
                    role: "user"
                    created_at: "2024-01-15T10:00:00Z"
                pagination:
                  page: 1
                  limit: 20
                  total: 100
                  total_pages: 5
        '401':
          $ref: '#/components/responses/Unauthorized'
      security:
        - bearerAuth: []

    post:
      tags:
        - Users
      summary: Create user
      description: Create a new user
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            example:
              name: "Jane Smith"
              email: "jane@example.com"
              password: "SecurePass123!"
              role: "user"
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/ValidationError'
      security:
        - bearerAuth: []

  /users/{userId}:
    parameters:
      - name: userId
        in: path
        required: true
        description: User ID
        schema:
          type: integer
          minimum: 1

    get:
      tags:
        - Users
      summary: Get user details
      operationId: getUser
      responses:
        '200':
          description: Successfully retrieved user
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

    put:
      tags:
        - Users
      summary: Update user
      operationId: updateUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUserRequest'
      responses:
        '200':
          description: User updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '404':
          $ref: '#/components/responses/NotFound'
        '422':
          $ref: '#/components/responses/ValidationError'
      security:
        - bearerAuth: []

    delete:
      tags:
        - Users
      summary: Delete user
      operationId: deleteUser
      responses:
        '204':
          description: User deleted successfully
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT authentication token

  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          description: User ID
          example: 1
        name:
          type: string
          description: User name
          example: "John Doe"
        email:
          type: string
          format: email
          description: Email address
          example: "john@example.com"
        role:
          type: string
          enum: [user, admin, moderator]
          description: User role
          example: "user"
        created_at:
          type: string
          format: date-time
          description: Creation timestamp
        updated_at:
          type: string
          format: date-time
          description: Update timestamp
      required:
        - id
        - name
        - email
        - role

    CreateUserRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 100
          example: "Jane Smith"
        email:
          type: string
          format: email
          example: "jane@example.com"
        password:
          type: string
          minLength: 8
          maxLength: 128
          example: "SecurePass123!"
        role:
          type: string
          enum: [user, admin, moderator]
          default: user
      required:
        - name
        - email
        - password

    UpdateUserRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 100
        email:
          type: string
          format: email
        role:
          type: string
          enum: [user, admin, moderator]
      minProperties: 1

    UserResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          $ref: '#/components/schemas/User'

    UserListResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        page:
          type: integer
          example: 1
        limit:
          type: integer
          example: 20
        total:
          type: integer
          example: 100
        total_pages:
          type: integer
          example: 5
        has_next:
          type: boolean
          example: true
        has_prev:
          type: boolean
          example: false

    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
              example: "VALIDATION_ERROR"
            message:
              type: string
              example: "Request validation failed"
            details:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                  code:
                    type: string
                  message:
                    type: string
            request_id:
              type: string
              example: "req_abc123"

  responses:
    BadRequest:
      description: Bad request format
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    Unauthorized:
      description: Not authenticated
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: "UNAUTHORIZED"
              message: "Authentication required"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: "NOT_FOUND"
              message: "User not found"

    Conflict:
      description: Resource conflict
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: "ALREADY_EXISTS"
              message: "Email already registered"

    ValidationError:
      description: Validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

### Integrating Swagger UI

```javascript
// Express.js Swagger integration
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const swaggerDocument = YAML.load('./openapi.yaml');

// Custom Swagger UI configuration
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "User Management API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// JSON format OpenAPI specification
app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});
```

```python
# FastAPI auto-generated documentation
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="User Management API",
    description="This is a user management system API",
    version="1.0.0",
    docs_url="/api-docs",      # Swagger UI
    redoc_url="/api-redoc",    # ReDoc
    openapi_url="/openapi.json"
)

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="User Management API",
        version="1.0.0",
        description="Complete user management API documentation",
        routes=app.routes,
    )

    # Add security definitions
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    # Add server configuration
    openapi_schema["servers"] = [
        {"url": "https://api.example.com/v1", "description": "Production"},
        {"url": "http://localhost:8000", "description": "Local Development"}
    ]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between REST and RESTful?**

```
REST is an architectural style proposed by Roy Fielding in 2000, defining six constraints:
1. Client-Server separation
2. Stateless
3. Cacheable
4. Uniform interface
5. Layered system
6. Code on demand (optional)

RESTful refers to APIs designed following REST architectural constraints. Strictly speaking,
only APIs that fully comply with all constraints (especially HATEOAS) can be called RESTful,
but in practice, meeting core constraints is usually sufficient.
```

**Q2: What is the difference between PUT and PATCH?**

```javascript
// PUT: Complete replacement of resource, requires all fields
// If fields are missing, they will be set to null or default values
PUT /users/1
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 25,
  "role": "user"
}

// PATCH: Partial update, only provide fields to be modified
// Unprovided fields remain unchanged
PATCH /users/1
{
  "email": "newemail@example.com"
}

// Key differences:
// - PUT is idempotent (multiple calls yield same result)
// - PATCH may not be idempotent (e.g., {"views": "+1"})
// - PUT has clearer semantics, PATCH is more flexible
```

**Q3: How to design a pagination API? What pagination methods are there?**

```javascript
// 1. Offset Pagination
// Pros: Simple, supports page jumping
// Cons: Poor performance for large datasets, may miss or duplicate data when data changes
GET /users?page=5&limit=20

// 2. Cursor Pagination
// Pros: Good performance, data consistency
// Cons: No page jumping, more complex implementation
GET /users?cursor=eyJpZCI6MTAwfQ&limit=20

// 3. Keyset Pagination
// Pros: Good performance, simple
// Cons: Requires unique sort key
GET /users?after_id=100&limit=20

// Selection recommendations:
// - Small datasets or need page jumping: Offset pagination
// - Large datasets or infinite scroll: Cursor pagination
// - Real-time data streams: Cursor pagination
```

**Q4: How to handle API version upgrades?**

```javascript
// Version control strategies:
// 1. URL versioning (most common): /api/v1/users, /api/v2/users
// 2. Header versioning: Accept: application/vnd.myapi.v2+json
// 3. Query parameter: /users?version=2

// Version migration best practices:
// 1. Maintain backward compatibility: Add new fields without removing old ones
// 2. Deprecation period: Give users enough migration time (typically 6-12 months)
// 3. Deprecation notice: Use Deprecation response header
// 4. Migration documentation: Provide detailed upgrade guides
// 5. Gradual migration: Support old and new versions simultaneously

// Response header example
Deprecation: true
Sunset: Sat, 01 Jan 2025 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

**Q5: How to design a secure API?**

```javascript
// 1. Authentication
// - Use OAuth 2.0 or JWT
// - Regular token refresh
// - Two-factor authentication for sensitive operations

// 2. Authorization
// - Role-based access control (RBAC)
// - Resource-level permission checks
// - Principle of least privilege

// 3. Input Validation
// - Validate all input parameters
// - Prevent SQL injection, XSS
// - Limit request body size

// 4. Transport Security
// - Enforce HTTPS
// - Use secure TLS versions

// 5. Rate Limiting
// - Implement rate limits
// - Prevent brute force attacks

// 6. Logging and Auditing
// - Log all sensitive operations
// - Monitor abnormal behavior

// Security response headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

### Design Problem Practice

**Problem: Design an E-commerce Order API**

```yaml
# Order API Design Plan

# Resource definitions
/orders                    # Order collection
/orders/{orderId}          # Single order
/orders/{orderId}/items    # Order items
/orders/{orderId}/payment  # Order payment
/orders/{orderId}/shipment # Order shipment

# Order state machine
# pending -> paid -> shipped -> delivered -> completed
#         -> cancelled

# API endpoint design
GET    /orders                      # Order list (with filtering)
POST   /orders                      # Create order
GET    /orders/{orderId}            # Order details
PATCH  /orders/{orderId}            # Update order
DELETE /orders/{orderId}            # Cancel order

# Order operations (using action resources)
POST   /orders/{orderId}/pay        # Pay for order
POST   /orders/{orderId}/ship       # Ship order
POST   /orders/{orderId}/confirm    # Confirm receipt
POST   /orders/{orderId}/refund     # Request refund

# Query parameters
GET /orders?status=paid&created_after=2024-01-01&sort=-created_at&page=1&limit=20

# Create order request body
POST /orders
{
  "items": [
    {"product_id": 123, "quantity": 2},
    {"product_id": 456, "quantity": 1}
  ],
  "shipping_address": {
    "name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, New York, NY 10001"
  },
  "payment_method": "stripe",
  "coupon_code": "SAVE10"
}

# Order response
{
  "id": "order_abc123",
  "status": "pending",
  "items": [...],
  "subtotal": 299.00,
  "discount": 10.00,
  "shipping_fee": 0,
  "total": 289.00,
  "shipping_address": {...},
  "created_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-01-15T10:30:00Z",
  "_links": {
    "self": "/orders/order_abc123",
    "pay": "/orders/order_abc123/pay",
    "cancel": "/orders/order_abc123"
  }
}
```

### Summary Checklist

| Topic | Key Points |
|-------|------------|
| Design Principles | Consistency, Simplicity, Predictability, Backward Compatibility |
| URL Design | Plural nouns, lowercase with hyphens, avoid deep nesting |
| HTTP Methods | GET is safe and idempotent, POST creates, PUT replaces, PATCH partial updates, DELETE removes |
| Status Codes | 2xx success, 4xx client errors, 5xx server errors |
| Response Format | Unified structure: success + data + error + meta |
| Pagination | Offset pagination for small data, cursor pagination for large data |
| Versioning | URL versioning most common, ensure backward compatibility and deprecation period |
| Error Handling | Unified error format with code, message, details |
| Documentation | OpenAPI/Swagger specification, auto-generate interactive docs |
| Security | HTTPS, authentication/authorization, input validation, rate limiting, auditing |

## Summary

Excellent API design is an art that requires balancing functionality, usability, and maintainability. The best practices covered in this article span the core aspects of API design:

1. **Design Principles**: Consistency, simplicity, and predictability are the foundation of API design
2. **RESTful Standards**: Proper use of HTTP methods and status codes, resource-oriented design
3. **URL Design**: Clear, semantic, avoiding deep nesting
4. **Response Format**: Unified response structure for easy client handling
5. **Pagination and Filtering**: Choose appropriate pagination strategy based on data scale
6. **Versioning**: Maintain backward compatibility, smooth transitions
7. **Error Handling**: Detailed error information helps developers debug
8. **API Documentation**: OpenAPI specification keeps documentation in sync with code

Remember, an API is an interface for people to use. Always think from the user's perspective to design truly usable APIs. Continuously collect feedback and iterate to build excellent APIs.
