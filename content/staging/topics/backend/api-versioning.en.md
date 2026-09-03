---
title: API Versioning
description: Learn API versioning strategies and best practices
track: backend
section: http-apis
difficulty: intermediate
tags:
  - API
  - versioning
  - RESTful
  - backward compatibility
status: imported
origin: old/src/content/docs/backend/api-versioning.en.md
divergence: 0.316
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 32
  lastUpdated: 2026-01-07
---

## Introduction

API versioning is a critical aspect of API lifecycle management that enables you to evolve your API while maintaining backward compatibility for existing clients. As your application grows and requirements change, you will inevitably need to modify your API. Without proper versioning, these changes can break existing integrations and frustrate your users.

You'll learn the essential strategies, best practices, and patterns for implementing effective API versioning, including how to choose the right versioning approach, manage deprecation gracefully, and guide your users through migrations.

## Why API Versioning Matters

### The Evolution Problem

APIs are contracts between your service and its consumers. When you need to:

- Add new required fields to requests
- Remove or rename existing fields
- Change response structures
- Modify authentication mechanisms
- Update business logic that affects outputs

You face a choice: break existing clients or maintain multiple versions. Proper versioning provides a structured way to introduce changes without disrupting active integrations.

### Benefits of Versioning

1. **Backward Compatibility**: Existing clients continue to work while new clients can use enhanced features
2. **Controlled Migration**: Users can migrate at their own pace rather than being forced to update immediately
3. **Clear Communication**: Version numbers signal the magnitude and nature of changes
4. **Risk Mitigation**: Bugs or issues in new versions do not affect users on stable versions
5. **Documentation Clarity**: Each version can have its own documentation reflecting its specific behavior

## Versioning Strategies

There are several approaches to API versioning, each with distinct advantages and trade-offs. The right choice depends on your specific use case, client base, and infrastructure.

### URL Path Versioning

The most common and visible approach places the version number directly in the URL path.

```
https://api.example.com/v1/users
https://api.example.com/v2/users
https://api.example.com/v3/users
```

#### Implementation Example (Express.js)

```javascript
const express = require('express');
const app = express();

// Version 1 routes
const v1Router = express.Router();
v1Router.get('/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'John Doe' }
    ]
  });
});

// Version 2 routes with enhanced response
const v2Router = express.Router();
v2Router.get('/users', (req, res) => {
  res.json({
    data: {
      users: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: '2024-01-15T10:00:00Z'
        }
      ]
    },
    meta: {
      total: 1,
      page: 1,
      limit: 20
    }
  });
});

// Mount versioned routers
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

app.listen(3000);
```

#### Implementation Example (Python FastAPI)

```python
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime

app = FastAPI()

# Version 1 models and routes
class UserV1(BaseModel):
    id: int
    name: str

v1_router = APIRouter(prefix="/v1")

@v1_router.get("/users", response_model=List[UserV1])
async def get_users_v1():
    return [{"id": 1, "name": "John Doe"}]

# Version 2 models and routes with enhanced structure
class UserV2(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

class PaginatedResponse(BaseModel):
    data: List[UserV2]
    total: int
    page: int
    limit: int

v2_router = APIRouter(prefix="/v2")

@v2_router.get("/users", response_model=PaginatedResponse)
async def get_users_v2():
    return {
        "data": [{
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "created_at": datetime.now()
        }],
        "total": 1,
        "page": 1,
        "limit": 20
    }

app.include_router(v1_router, prefix="/api")
app.include_router(v2_router, prefix="/api")
```

#### Advantages

- Highly visible and explicit
- Easy to understand and implement
- Simple to route and cache
- Works with all HTTP clients
- Easy to test different versions

#### Disadvantages

- URLs change between versions
- Can lead to code duplication
- Clutters URL namespace
- Breaks REST purist principles (URL should identify resource, not version)

### Header Versioning

This approach uses custom HTTP headers to specify the API version, keeping URLs clean and consistent.

```http
GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/json
API-Version: 2
```

Or using the `Accept` header with a custom media type:

```http
GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/vnd.example.v2+json
```

#### Implementation Example (Express.js)

```javascript
const express = require('express');
const app = express();

// Middleware to extract version from header
const versionMiddleware = (req, res, next) => {
  // Check custom header first
  let version = req.headers['api-version'];

  // Fall back to Accept header media type
  if (!version) {
    const accept = req.headers['accept'] || '';
    const match = accept.match(/application\/vnd\.example\.v(\d+)\+json/);
    if (match) {
      version = match[1];
    }
  }

  // Default to version 1
  req.apiVersion = parseInt(version) || 1;
  next();
};

app.use(versionMiddleware);

app.get('/api/users', (req, res) => {
  if (req.apiVersion === 1) {
    return res.json({
      users: [{ id: 1, name: 'John Doe' }]
    });
  }

  if (req.apiVersion === 2) {
    return res.json({
      data: {
        users: [{
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: '2024-01-15T10:00:00Z'
        }]
      },
      meta: { total: 1, page: 1, limit: 20 }
    });
  }

  res.status(400).json({
    error: 'Unsupported API version'
  });
});

app.listen(3000);
```

#### Implementation Example (Python FastAPI)

```python
from fastapi import FastAPI, Header, HTTPException
from typing import Optional

app = FastAPI()

def get_api_version(
    api_version: Optional[str] = Header(None, alias="API-Version"),
    accept: Optional[str] = Header(None)
) -> int:
    """Extract API version from headers."""
    if api_version:
        return int(api_version)

    if accept:
        import re
        match = re.search(r'application/vnd\.example\.v(\d+)\+json', accept)
        if match:
            return int(match.group(1))

    return 1  # Default version

@app.get("/api/users")
async def get_users(
    api_version: Optional[str] = Header(None, alias="API-Version"),
    accept: Optional[str] = Header(None)
):
    version = get_api_version(api_version, accept)

    if version == 1:
        return {"users": [{"id": 1, "name": "John Doe"}]}

    if version == 2:
        return {
            "data": {
                "users": [{
                    "id": 1,
                    "name": "John Doe",
                    "email": "john@example.com",
                    "createdAt": "2024-01-15T10:00:00Z"
                }]
            },
            "meta": {"total": 1, "page": 1, "limit": 20}
        }

    raise HTTPException(status_code=400, detail="Unsupported API version")
```

#### Advantages

- Clean, version-free URLs
- Follows REST principles more closely
- Single URL can serve multiple versions
- Better for resource-oriented APIs

#### Disadvantages

- Less visible and discoverable
- Harder to test in browsers
- Requires header manipulation in clients
- Can be overlooked in documentation
- Caching becomes more complex

### Query Parameter Versioning

This method passes the version as a query parameter, offering a middle ground between URL and header approaches.

```
https://api.example.com/users?version=2
https://api.example.com/users?api-version=2
```

#### Implementation Example (Express.js)

```javascript
const express = require('express');
const app = express();

app.get('/api/users', (req, res) => {
  const version = parseInt(req.query.version) || 1;

  switch (version) {
    case 1:
      return res.json({
        users: [{ id: 1, name: 'John Doe' }]
      });

    case 2:
      return res.json({
        data: {
          users: [{
            id: 1,
            name: 'John Doe',
            email: 'john@example.com'
          }]
        },
        meta: { total: 1 }
      });

    default:
      return res.status(400).json({
        error: `Version ${version} is not supported`
      });
  }
});

app.listen(3000);
```

#### Implementation Example (Python FastAPI)

```python
from fastapi import FastAPI, Query, HTTPException

app = FastAPI()

@app.get("/api/users")
async def get_users(version: int = Query(default=1, alias="version")):
    if version == 1:
        return {"users": [{"id": 1, "name": "John Doe"}]}

    if version == 2:
        return {
            "data": {
                "users": [{
                    "id": 1,
                    "name": "John Doe",
                    "email": "john@example.com"
                }]
            },
            "meta": {"total": 1}
        }

    raise HTTPException(
        status_code=400,
        detail=f"Version {version} is not supported"
    )
```

#### Advantages

- Easy to implement and test
- Visible in URLs but less intrusive than path versioning
- Works with all HTTP clients
- Simple to switch versions during development

#### Disadvantages

- Mixes versioning with query parameters
- Can be accidentally modified or omitted
- Less elegant than other approaches
- Query string can become cluttered

### Strategy Comparison

| Aspect | URL Path | Header | Query Parameter |
|--------|----------|--------|-----------------|
| Visibility | High | Low | Medium |
| REST Compliance | Low | High | Medium |
| Caching | Easy | Complex | Medium |
| Browser Testing | Easy | Hard | Easy |
| Implementation | Simple | Moderate | Simple |
| Client Adoption | Easy | Requires Education | Easy |

## Semantic Versioning for APIs

Semantic Versioning (SemVer) provides a standardized way to communicate the nature of changes between versions.

### Version Number Format

```
MAJOR.MINOR.PATCH

Example: 2.1.3
- MAJOR: 2 (breaking changes)
- MINOR: 1 (new features, backward compatible)
- PATCH: 3 (bug fixes, backward compatible)
```

### When to Increment

#### Major Version (Breaking Changes)

Increment the major version when you make incompatible API changes:

```javascript
// v1: Original response structure
{
  "user": {
    "name": "John Doe",
    "created": "2024-01-15"
  }
}

// v2: Breaking change - restructured response
{
  "data": {
    "user": {
      "fullName": "John Doe",  // Field renamed
      "createdAt": "2024-01-15T10:00:00Z"  // Format changed
    }
  }
}
```

Common breaking changes include:

- Removing endpoints or fields
- Renaming fields or endpoints
- Changing data types
- Modifying required fields
- Changing authentication mechanisms
- Altering error response formats

#### Minor Version (New Features)

Increment the minor version for backward-compatible functionality:

```javascript
// v1.0: Original
{
  "user": {
    "id": 1,
    "name": "John Doe"
  }
}

// v1.1: Added optional field (backward compatible)
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg"  // New optional field
  }
}
```

Minor version changes include:

- Adding new optional fields
- Adding new endpoints
- Adding new query parameters
- Extending enum values
- Adding new response formats

#### Patch Version (Bug Fixes)

Increment the patch version for backward-compatible bug fixes:

- Fixing incorrect calculations
- Correcting typos in messages
- Fixing edge cases
- Performance improvements
- Security patches

### Practical Implementation

Most APIs expose only the major version number in the URL or headers, while documenting full semantic versions in changelogs.

```javascript
// API exposes major version
app.use('/api/v2', v2Router);

// Full version available via endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: '2.1.3',
    major: 2,
    minor: 1,
    patch: 3,
    releaseDate: '2024-01-15'
  });
});
```

## Deprecation Strategy

Deprecation is the process of phasing out old API versions in a controlled manner. A well-executed deprecation strategy maintains trust with your users while allowing you to retire legacy code.

### Deprecation Timeline

```
Announce    Migration     End of      End of
Deprecation Period       Support     Life
    |          |            |          |
    v          v            v          v
----|---------|-----------|-----------|--->
    |<--6mo-->|<---6mo--->|<--3mo--->|

Phase 1: Announcement (Day 0)
- Document deprecation in changelog
- Add deprecation headers to responses
- Send notifications to API consumers

Phase 2: Migration Period (6 months)
- New version is available
- Old version fully functional
- Migration guides published
- Support team assists migrations

Phase 3: End of Support (6 months)
- No new features for old version
- Only critical security fixes
- Enhanced deprecation warnings

Phase 4: End of Life (3 months notice)
- Final shutdown warning
- API returns errors for old version
- Redirect to migration documentation
```

### Implementing Deprecation Headers

```javascript
const express = require('express');
const app = express();

// Deprecation middleware for v1
const deprecationMiddleware = (req, res, next) => {
  // Add standard deprecation headers
  res.set({
    'Deprecation': 'true',
    'Sunset': 'Sat, 15 Jun 2024 00:00:00 GMT',
    'Link': '</api/v2/docs>; rel="successor-version"',
    'X-API-Deprecation-Info': 'https://api.example.com/deprecation/v1'
  });

  // Add deprecation notice to response
  res.locals.deprecationNotice = {
    warning: 'API v1 is deprecated and will be removed on 2024-06-15',
    migrationGuide: 'https://api.example.com/migration/v1-to-v2',
    newVersion: '/api/v2'
  };

  next();
};

// Apply to v1 routes
app.use('/api/v1', deprecationMiddleware, v1Router);

// Include notice in responses
v1Router.get('/users', (req, res) => {
  res.json({
    _deprecation: res.locals.deprecationNotice,
    users: [{ id: 1, name: 'John Doe' }]
  });
});
```

### Deprecation Response Example

```json
{
  "_deprecation": {
    "warning": "API v1 is deprecated and will be removed on 2024-06-15",
    "migrationGuide": "https://api.example.com/migration/v1-to-v2",
    "newVersion": "/api/v2"
  },
  "users": [
    {
      "id": 1,
      "name": "John Doe"
    }
  ]
}
```

### Monitoring Deprecated Version Usage

```javascript
const deprecationMetrics = {
  requests: new Map(),

  track(version, clientId) {
    const key = `${version}:${clientId}`;
    const current = this.requests.get(key) || 0;
    this.requests.set(key, current + 1);
  },

  getReport() {
    const report = {};
    for (const [key, count] of this.requests) {
      const [version, clientId] = key.split(':');
      if (!report[version]) report[version] = {};
      report[version][clientId] = count;
    }
    return report;
  }
};

// Middleware to track deprecated API usage
const trackDeprecatedUsage = (req, res, next) => {
  const clientId = req.headers['x-client-id'] || 'anonymous';
  deprecationMetrics.track('v1', clientId);
  next();
};

app.use('/api/v1', trackDeprecatedUsage, v1Router);
```

## Backward Compatibility

Maintaining backward compatibility allows existing clients to continue functioning as your API evolves. Strategies to achieve this goal:

### Additive Changes Only

The safest approach is to only make additive changes within a version:

```javascript
// Original v2.0.0
{
  "user": {
    "id": 1,
    "name": "John Doe"
  }
}

// v2.1.0 - Safe additive changes
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",      // New optional field
    "preferences": {                   // New optional object
      "theme": "dark",
      "language": "en"
    }
  }
}
```

### Default Values for New Required Fields

When adding required fields, provide sensible defaults for existing records:

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserV2(BaseModel):
    id: int
    name: str
    email: str
    # New required field with default for existing data
    account_type: str = Field(default="standard")
    # New field with computed default
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Database migration ensures existing records have defaults
async def migrate_users():
    await db.execute("""
        UPDATE users
        SET account_type = 'standard'
        WHERE account_type IS NULL
    """)
```

### Response Envelope Pattern

Use a consistent envelope to add metadata without breaking existing parsers:

```javascript
// Envelope pattern allows adding metadata safely
const createResponse = (data, meta = {}) => ({
  success: true,
  data: data,
  meta: {
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    ...meta
  }
});

app.get('/api/v2/users', (req, res) => {
  const users = [{ id: 1, name: 'John Doe' }];
  res.json(createResponse(users, { total: users.length }));
});
```

### Flexible Request Handling

Accept both old and new request formats:

```python
from fastapi import FastAPI
from pydantic import BaseModel, validator
from typing import Optional, Union

app = FastAPI()

class CreateUserRequest(BaseModel):
    # Support both old and new field names
    name: Optional[str] = None
    full_name: Optional[str] = None

    # Support both formats for email
    email: Optional[str] = None
    email_address: Optional[str] = None

    @validator('full_name', pre=True, always=True)
    def set_full_name(cls, v, values):
        return v or values.get('name')

    @validator('email_address', pre=True, always=True)
    def set_email(cls, v, values):
        return v or values.get('email')

    def get_normalized(self):
        return {
            "full_name": self.full_name or self.name,
            "email": self.email_address or self.email
        }

@app.post("/api/v2/users")
async def create_user(request: CreateUserRequest):
    normalized = request.get_normalized()
    # Process with normalized data
    return {"user": normalized}
```

### Feature Flags for Gradual Rollout

```javascript
const featureFlags = {
  'v2.enhanced-pagination': {
    enabled: true,
    rolloutPercentage: 50,
    enabledClients: ['client-a', 'client-b']
  }
};

const isFeatureEnabled = (feature, clientId) => {
  const flag = featureFlags[feature];
  if (!flag || !flag.enabled) return false;

  if (flag.enabledClients.includes(clientId)) return true;

  // Consistent hash for percentage rollout
  const hash = clientId.split('').reduce((a, b) => {
    return ((a << 5) - a) + b.charCodeAt(0);
  }, 0);

  return Math.abs(hash % 100) < flag.rolloutPercentage;
};

app.get('/api/v2/users', (req, res) => {
  const clientId = req.headers['x-client-id'];

  if (isFeatureEnabled('v2.enhanced-pagination', clientId)) {
    // Return enhanced response
    return res.json({
      data: users,
      pagination: { cursors: { next: 'abc123' } }
    });
  }

  // Return standard response
  res.json({ data: users, meta: { page: 1 } });
});
```

## Migration Guides

Effective migration guides help your users transition smoothly between API versions.

### Migration Guide Structure

```markdown
# Migration Guide: v1 to v2

## Overview
This guide covers the changes between API v1 and v2 and provides
step-by-step instructions for updating your integration.

## Timeline
- v2 Released: January 1, 2024
- v1 Deprecated: July 1, 2024
- v1 End of Life: January 1, 2025

## Breaking Changes Summary
1. Response envelope structure changed
2. User endpoint fields renamed
3. Authentication header format updated

## Detailed Changes

### Response Envelope

**v1 Format:**
```json
{
  "users": [...]
}
```

**v2 Format:**
```json
{
  "data": {
    "users": [...]
  },
  "meta": {
    "total": 100,
    "page": 1
  }
}
```

**Migration Steps:**
1. Update response parsers to access `response.data.users`
2. Utilize new pagination metadata from `response.meta`
```

### Automated Migration Tools

Provide tools to help users identify required changes:

```javascript
// Migration validator script
const validateMigration = async (oldResponse, newResponse) => {
  const issues = [];

  // Check for removed fields
  const oldFields = Object.keys(flattenObject(oldResponse));
  const newFields = Object.keys(flattenObject(newResponse));

  const removedFields = oldFields.filter(f => !newFields.includes(f));
  if (removedFields.length > 0) {
    issues.push({
      type: 'removed_fields',
      fields: removedFields,
      action: 'Update code to not depend on these fields'
    });
  }

  // Check for renamed fields
  const renamedFields = detectRenamedFields(oldResponse, newResponse);
  if (renamedFields.length > 0) {
    issues.push({
      type: 'renamed_fields',
      fields: renamedFields,
      action: 'Update field references in your code'
    });
  }

  return {
    compatible: issues.length === 0,
    issues: issues
  };
};

// API endpoint to validate client compatibility
app.post('/api/migration/validate', async (req, res) => {
  const { clientCode, targetVersion } = req.body;
  const analysis = await analyzeMigrationRequirements(clientCode, targetVersion);
  res.json(analysis);
});
```

### SDK Updates and Changelogs

```javascript
// Changelog format
const changelog = {
  "2.0.0": {
    date: "2024-01-15",
    breaking: [
      {
        change: "Response envelope restructured",
        migration: "Access data via response.data instead of response directly"
      },
      {
        change: "User.name renamed to User.fullName",
        migration: "Update all references from .name to .fullName"
      }
    ],
    added: [
      "Pagination support with cursor-based navigation",
      "Rate limit headers in all responses"
    ],
    deprecated: [],
    fixed: []
  },
  "2.1.0": {
    date: "2024-02-01",
    breaking: [],
    added: [
      "User avatar field",
      "Bulk operations endpoint"
    ],
    deprecated: [
      "Legacy search endpoint (use /search/v2 instead)"
    ],
    fixed: [
      "Pagination cursor encoding issue"
    ]
  }
};
```

## Best Practices

### Version from Day One

Start with versioning even for your first release:

```javascript
// Good: Versioned from the start
app.use('/api/v1', apiRouter);

// Avoid: Unversioned API
app.use('/api', apiRouter);  // Hard to version later
```

### Document Everything

Maintain comprehensive documentation for each version:

```yaml
# OpenAPI specification for versioned API
openapi: 3.0.0
info:
  title: Example API
  version: 2.1.0
  description: |
    ## Versioning
    This API uses URL path versioning. Include the version
    number in all requests: `/api/v2/...`

    ## Supported Versions
    - v2 (current): Full support
    - v1 (deprecated): Security fixes only until 2024-06-15

    ## Changelog
    See [CHANGELOG.md](/changelog) for detailed version history.
```

### Communicate Changes Early

```javascript
// Include version info and upcoming changes in responses
app.use((req, res, next) => {
  res.set({
    'X-API-Version': '2.1.0',
    'X-API-Changelog': 'https://api.example.com/changelog',
    'X-API-Upcoming-Changes': 'https://api.example.com/upcoming'
  });
  next();
});
```

### Support Multiple Versions Simultaneously

Plan for maintaining at least two major versions:

```javascript
// Version routing configuration
const versionConfig = {
  v1: {
    status: 'deprecated',
    sunset: '2024-06-15',
    router: v1Router
  },
  v2: {
    status: 'current',
    router: v2Router
  },
  v3: {
    status: 'beta',
    router: v3Router
  }
};

Object.entries(versionConfig).forEach(([version, config]) => {
  if (config.status !== 'retired') {
    app.use(`/api/${version}`, config.router);
  }
});
```

### Use Consistent Error Formats Across Versions

```javascript
// Standardized error response across all versions
const createError = (status, code, message, details = {}) => ({
  error: {
    status: status,
    code: code,
    message: message,
    details: details,
    timestamp: new Date().toISOString(),
    documentation: `https://api.example.com/errors/${code}`
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  const apiVersion = req.path.match(/\/api\/v(\d+)/)?.[1] || '1';

  res.status(err.status || 500).json(
    createError(
      err.status || 500,
      err.code || 'INTERNAL_ERROR',
      err.message || 'An unexpected error occurred',
      { apiVersion: apiVersion }
    )
  );
});
```

### Test All Supported Versions

```javascript
// Jest test suite for multiple API versions
describe('API Versioning', () => {
  const versions = ['v1', 'v2'];

  versions.forEach(version => {
    describe(`${version} - Users Endpoint`, () => {
      it('should return users list', async () => {
        const response = await request(app)
          .get(`/api/${version}/users`)
          .expect(200);

        // Version-specific assertions
        if (version === 'v1') {
          expect(response.body).toHaveProperty('users');
        } else {
          expect(response.body).toHaveProperty('data.users');
          expect(response.body).toHaveProperty('meta');
        }
      });

      it('should handle errors consistently', async () => {
        const response = await request(app)
          .get(`/api/${version}/users/invalid`)
          .expect(404);

        expect(response.body).toHaveProperty('error.code');
        expect(response.body).toHaveProperty('error.message');
      });
    });
  });
});
```

## Real-World Examples

### GitHub API

GitHub uses URL path versioning with a date-based approach for their GraphQL API:

```http
# REST API
GET https://api.github.com/repos/owner/repo
Accept: application/vnd.github.v3+json

# GraphQL API with schema versioning
POST https://api.github.com/graphql
X-GitHub-Api-Version: 2023-01-01
```

### Stripe API

Stripe uses date-based versioning via headers:

```http
POST https://api.stripe.com/v1/charges
Stripe-Version: 2023-10-16
```

They maintain extensive backward compatibility and provide detailed migration guides for each version.

### Twilio API

Twilio uses URL path versioning with major version numbers:

```http
GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages
```

## Summary

Effective API versioning is essential for building APIs that can evolve while maintaining client trust and compatibility. Key takeaways:

1. **Choose a versioning strategy** that fits your use case - URL path versioning is most common and easiest to implement
2. **Use semantic versioning** to communicate the nature and impact of changes
3. **Plan deprecation carefully** with clear timelines and communication
4. **Maintain backward compatibility** within major versions through additive changes
5. **Provide comprehensive migration guides** to help users transition between versions
6. **Document thoroughly** and communicate changes early
7. **Test all supported versions** to ensure consistent behavior

By following these practices, you can confidently evolve your API while providing a stable and reliable experience for your users.

## Further Reading

- [Semantic Versioning Specification](https://semver.org/)
- [API Changelog Best Practices](https://keepachangelog.com/)
- [HTTP Sunset Header RFC](https://datatracker.ietf.org/doc/html/rfc8594)
- [REST API Design Guidelines](https://restfulapi.net/)
