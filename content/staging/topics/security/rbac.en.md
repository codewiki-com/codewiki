---
title: RBAC Access Control Model
description: Master role-based access control for secure systems
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - RBAC
  - Access Control
  - Authorization
  - Permissions
status: imported
origin: old/src/content/docs/security/rbac.en.md
divergence: 0.18
issues: []
legacy:
  category: Security
  subcategory: Access Control
  order: 8
  lastUpdated: 2026-01-07
---

Role-Based Access Control (RBAC) is one of the most widely adopted authorization models in modern software systems. It provides a structured approach to managing user permissions by associating privileges with roles rather than individual users. We'll cover RBAC from fundamental concepts to practical implementation, giving you the knowledge to build secure, maintainable authorization systems.

## Concept Explanation

### What is Access Control?

Access control is the selective restriction of access to resources. It determines who can do what with which resources in a system. Before diving into RBAC, let's understand the broader landscape of access control models.

### Access Control Models Overview

| Model | Full Name | Description | Use Cases |
|-------|-----------|-------------|-----------|
| DAC | Discretionary Access Control | Resource owners control access at their discretion | File systems, personal sharing |
| MAC | Mandatory Access Control | System-enforced policies based on security labels | Military, government systems |
| RBAC | Role-Based Access Control | Permissions assigned to roles, roles assigned to users | Enterprise applications |
| ABAC | Attribute-Based Access Control | Dynamic decisions based on attributes and policies | Complex enterprise, cloud |
| ReBAC | Relationship-Based Access Control | Access based on relationships between entities | Social networks, document sharing |

### Why RBAC?

RBAC was formalized by NIST in the 1990s to address the limitations of earlier models. It emerged from the observation that in most organizations, permissions align with job functions rather than individual needs.

**Key advantages of RBAC:**

1. **Simplified Administration**: Manage permissions at the role level instead of per-user
2. **Principle of Least Privilege**: Users receive only the permissions necessary for their role
3. **Separation of Duties**: Prevent conflicts of interest through mutually exclusive roles
4. **Audit Compliance**: Clear role-permission mappings simplify compliance audits
5. **Scalability**: Adding users is as simple as assigning roles

### RBAC vs Other Models

```
DAC:  User -> Resource (owner decides)
MAC:  User Label -> Resource Label (system decides)
RBAC: User -> Role -> Permission -> Resource (role mediates)
ABAC: User Attributes + Resource Attributes + Context -> Policy Engine -> Decision
```

## Core Principles

### RBAC0: Core RBAC

The foundational RBAC model defines three core components:

```
+----------+     +----------+     +-------------+
|   Users  |---->|  Roles   |---->| Permissions |
+----------+     +----------+     +-------------+
     |                                    |
     |         User Assignment            |
     |         Role Assignment            |
     +------------------------------------+
```

**Components:**

- **Users**: Individual identities in the system
- **Roles**: Named collections of permissions representing job functions
- **Permissions**: Approvals to perform specific operations on resources
- **Sessions**: Mappings between users and activated role subsets

### RBAC1: Role Hierarchies

RBAC1 extends the core model with role inheritance:

```
                    +-------------+
                    |   Admin     |
                    +------+------+
                           | inherits
              +------------+------------+
              |            |            |
       +------+------+ +---+---+ +------+------+
       | UserManager | |Editor | | SysOperator |
       +------+------+ +---+---+ +------+------+
              |            |            |
              +------------+------------+
                           | inherits
                    +------+------+
                    |   Viewer    |
                    +-------------+
```

**Hierarchy Types:**

- **General Hierarchy**: Roles can have multiple parents (multiple inheritance)
- **Limited Hierarchy**: Roles have at most one parent (tree structure)

### RBAC2: Constraints

RBAC2 adds constraints to enforce organizational policies:

**Static Separation of Duty (SSD):**
- Prevents users from being assigned conflicting roles
- Example: A user cannot be both "Auditor" and "Accountant"

**Dynamic Separation of Duty (DSD):**
- Prevents users from activating conflicting roles in the same session
- Example: A user can have both "Approver" and "Requester" roles but not activate both simultaneously

**Cardinality Constraints:**
- Limit the number of users assigned to a role
- Limit the number of roles a user can have

### RBAC3: Consolidated Model

RBAC3 combines RBAC1 and RBAC2, providing the full feature set:

```
RBAC3 = RBAC1 (Hierarchies) + RBAC2 (Constraints)
```

## Core Concepts Deep Dive

### Roles

A role is an abstraction that represents a job function or responsibility within an organization.

```javascript
// Role definition example
const roles = {
  admin: {
    name: 'Administrator',
    description: 'Full system access',
    permissions: ['*'],
    inherits: ['user_manager', 'content_editor', 'system_operator']
  },
  content_editor: {
    name: 'Content Editor',
    description: 'Can create and modify content',
    permissions: ['content:create', 'content:read', 'content:update'],
    inherits: ['viewer']
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['content:read', 'profile:read']
  }
};
```

### Permissions

Permissions define specific actions that can be performed on resources. A common convention uses the format: `resource:action` or `resource:action:scope`.

```javascript
// Permission naming conventions
const permissionPatterns = {
  // Simple format
  simple: 'users:read',

  // With scope
  scoped: 'users:read:own',

  // Hierarchical
  hierarchical: 'api:users:profile:update',

  // Wildcard
  wildcard: 'content:*',

  // Full access
  superadmin: '*'
};

// Permission structure
const permissions = {
  'users:create': {
    description: 'Create new users',
    resource: 'users',
    action: 'create'
  },
  'users:read': {
    description: 'View user information',
    resource: 'users',
    action: 'read'
  },
  'users:read:own': {
    description: 'View own user profile',
    resource: 'users',
    action: 'read',
    scope: 'own'
  }
};
```

### Sessions

Sessions represent the context in which users exercise their roles:

```javascript
// Session management
class Session {
  constructor(user) {
    this.user = user;
    this.activatedRoles = new Set();
    this.createdAt = new Date();
  }

  activateRole(role) {
    // Check DSD constraints before activation
    if (this.hasConflict(role)) {
      throw new Error('Cannot activate role due to separation of duty constraints');
    }
    this.activatedRoles.add(role);
  }

  deactivateRole(role) {
    this.activatedRoles.delete(role);
  }

  hasConflict(newRole) {
    const conflicts = getDSDConflicts(newRole);
    return conflicts.some(r => this.activatedRoles.has(r));
  }

  getEffectivePermissions() {
    const permissions = new Set();
    for (const role of this.activatedRoles) {
      const rolePermissions = getRolePermissions(role);
      rolePermissions.forEach(p => permissions.add(p));
    }
    return permissions;
  }
}
```

## Database Design

### Core Schema

A well-designed RBAC database schema is essential for performance and maintainability.

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- User-Role assignments
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Role-Permission assignments
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Role hierarchy
CREATE TABLE role_hierarchy (
    parent_role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_role_id, child_role_id),
    CHECK (parent_role_id != child_role_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_hierarchy_parent ON role_hierarchy(parent_role_id);
CREATE INDEX idx_role_hierarchy_child ON role_hierarchy(child_role_id);
```

### Querying User Permissions

```sql
-- Get all permissions for a user (including inherited roles)
WITH RECURSIVE role_tree AS (
    -- Base case: direct roles assigned to user
    SELECT r.id, r.name, 0 AS depth
    FROM roles r
    INNER JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)

    UNION

    -- Recursive case: inherited roles
    SELECT r.id, r.name, rt.depth + 1
    FROM roles r
    INNER JOIN role_hierarchy rh ON r.id = rh.child_role_id
    INNER JOIN role_tree rt ON rh.parent_role_id = rt.id
    WHERE rt.depth < 10 -- Prevent infinite loops
)
SELECT DISTINCT p.name, p.resource, p.action
FROM permissions p
INNER JOIN role_permissions rp ON p.id = rp.permission_id
INNER JOIN role_tree rt ON rp.role_id = rt.id
ORDER BY p.resource, p.action;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_name VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    WITH RECURSIVE role_tree AS (
        SELECT r.id
        FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = p_user_id
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)

        UNION

        SELECT r.id
        FROM roles r
        INNER JOIN role_hierarchy rh ON r.id = rh.child_role_id
        INNER JOIN role_tree rt ON rh.parent_role_id = rt.id
    )
    SELECT EXISTS (
        SELECT 1
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN role_tree rt ON rp.role_id = rt.id
        WHERE p.name = p_permission_name
           OR p.name = '*'
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;
```

### Constraint Tables

```sql
-- Static Separation of Duty constraints
CREATE TABLE ssd_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ssd_constraint_roles (
    constraint_id UUID REFERENCES ssd_constraints(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (constraint_id, role_id)
);

-- Dynamic Separation of Duty constraints
CREATE TABLE dsd_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_roles INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dsd_constraint_roles (
    constraint_id UUID REFERENCES dsd_constraints(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (constraint_id, role_id)
);

-- Function to check SSD violations before role assignment
CREATE OR REPLACE FUNCTION check_ssd_constraint()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM ssd_constraints sc
        INNER JOIN ssd_constraint_roles scr1 ON sc.id = scr1.constraint_id
        INNER JOIN ssd_constraint_roles scr2 ON sc.id = scr2.constraint_id
        WHERE scr1.role_id = NEW.role_id
          AND scr2.role_id IN (
              SELECT role_id FROM user_roles WHERE user_id = NEW.user_id
          )
          AND scr1.role_id != scr2.role_id
    ) THEN
        RAISE EXCEPTION 'Role assignment violates separation of duty constraint';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ssd_check_trigger
BEFORE INSERT ON user_roles
FOR EACH ROW EXECUTE FUNCTION check_ssd_constraint();
```

## API Implementation

### Express.js RBAC Middleware

```javascript
// rbac.js - Core RBAC implementation
const { Pool } = require('pg');

class RBAC {
  constructor(pool) {
    this.pool = pool;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  // Get user's effective permissions with caching
  async getUserPermissions(userId) {
    const cacheKey = `perms:${userId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.permissions;
    }

    const query = `
      WITH RECURSIVE role_tree AS (
        SELECT r.id
        FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)

        UNION

        SELECT r.id
        FROM roles r
        INNER JOIN role_hierarchy rh ON r.id = rh.child_role_id
        INNER JOIN role_tree rt ON rh.parent_role_id = rt.id
      )
      SELECT DISTINCT p.name
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN role_tree rt ON rp.role_id = rt.id
    `;

    const result = await this.pool.query(query, [userId]);
    const permissions = new Set(result.rows.map(r => r.name));

    this.cache.set(cacheKey, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  }

  // Check if user has permission
  async hasPermission(userId, permission) {
    const permissions = await this.getUserPermissions(userId);

    // Check for exact match
    if (permissions.has(permission)) return true;

    // Check for wildcard
    if (permissions.has('*')) return true;

    // Check for resource wildcard (e.g., "users:*")
    const [resource] = permission.split(':');
    if (permissions.has(`${resource}:*`)) return true;

    return false;
  }

  // Invalidate cache for user
  invalidateUserCache(userId) {
    this.cache.delete(`perms:${userId}`);
  }

  // Get user's roles
  async getUserRoles(userId) {
    const query = `
      SELECT r.id, r.name, r.description
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // Assign role to user
  async assignRole(userId, roleId, assignedBy, expiresAt = null) {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, role_id)
      DO UPDATE SET expires_at = $4, assigned_at = CURRENT_TIMESTAMP
    `;
    await this.pool.query(query, [userId, roleId, assignedBy, expiresAt]);
    this.invalidateUserCache(userId);
  }

  // Revoke role from user
  async revokeRole(userId, roleId) {
    const query = `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`;
    await this.pool.query(query, [userId, roleId]);
    this.invalidateUserCache(userId);
  }
}

module.exports = RBAC;
```

### Authorization Middleware

```javascript
// middleware/authorize.js
const RBAC = require('./rbac');
const pool = require('./db');

const rbac = new RBAC(pool);

// Permission-based authorization
function requirePermission(...permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user has any of the required permissions
      for (const permission of permissions) {
        const hasPermission = await rbac.hasPermission(req.user.id, permission);
        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({
        error: 'Forbidden',
        message: `Required permissions: ${permissions.join(' or ')}`
      });
    } catch (error) {
      next(error);
    }
  };
}

// Role-based authorization
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRoles = await rbac.getUserRoles(req.user.id);
      const roleNames = userRoles.map(r => r.name);

      const hasRole = roles.some(role => roleNames.includes(role));
      if (hasRole) {
        return next();
      }

      return res.status(403).json({
        error: 'Forbidden',
        message: `Required roles: ${roles.join(' or ')}`
      });
    } catch (error) {
      next(error);
    }
  };
}

// Owner-based authorization (for resource ownership)
function requireOwnerOrPermission(permission, getOwnerId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check ownership
      const ownerId = await getOwnerId(req);
      if (ownerId === req.user.id) {
        return next();
      }

      // Check permission
      const hasPermission = await rbac.hasPermission(req.user.id, permission);
      if (hasPermission) {
        return next();
      }

      return res.status(403).json({ error: 'Forbidden' });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requirePermission,
  requireRole,
  requireOwnerOrPermission,
  rbac
};
```

### API Routes

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();
const { requirePermission, requireOwnerOrPermission } = require('../middleware/authorize');
const authenticate = require('../middleware/authenticate');

// Apply authentication to all routes
router.use(authenticate);

// List all users - requires users:read permission
router.get('/', requirePermission('users:read'), async (req, res) => {
  const users = await userService.findAll();
  res.json(users);
});

// Get user by ID - owner can read their own, others need users:read
router.get('/:id',
  requireOwnerOrPermission('users:read', (req) => req.params.id),
  async (req, res) => {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  }
);

// Create user - requires users:create permission
router.post('/', requirePermission('users:create'), async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
});

// Update user - owner can update their own, others need users:update
router.put('/:id',
  requireOwnerOrPermission('users:update', (req) => req.params.id),
  async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  }
);

// Delete user - requires users:delete permission
router.delete('/:id', requirePermission('users:delete'), async (req, res) => {
  await userService.delete(req.params.id);
  res.status(204).send();
});

module.exports = router;
```

### Role Management API

```javascript
// routes/roles.js - Role management API
const express = require('express');
const router = express.Router();
const { requirePermission, rbac } = require('../middleware/authorize');

router.use(authenticate);

// List all roles
router.get('/', requirePermission('roles:read'), async (req, res) => {
  const query = 'SELECT * FROM roles ORDER BY name';
  const result = await pool.query(query);
  res.json(result.rows);
});

// Assign role to user
router.post('/assign', requirePermission('roles:assign'), async (req, res) => {
  const { userId, roleId, expiresAt } = req.body;

  try {
    await rbac.assignRole(userId, roleId, req.user.id, expiresAt);
    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    if (error.message.includes('separation of duty')) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
});

// Revoke role from user
router.post('/revoke', requirePermission('roles:revoke'), async (req, res) => {
  const { userId, roleId } = req.body;
  await rbac.revokeRole(userId, roleId);
  res.json({ message: 'Role revoked successfully' });
});

// Get user's roles
router.get('/user/:userId', requirePermission('roles:read'), async (req, res) => {
  const roles = await rbac.getUserRoles(req.params.userId);
  res.json(roles);
});

module.exports = router;
```

## Frontend Implementation

### React RBAC Context

```jsx
// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(new Set());
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserSession();
  }, []);

  const loadUserSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPermissions(new Set(data.permissions));
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    setPermissions(new Set(data.permissions));
    setRoles(data.roles);
    return data;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    setPermissions(new Set());
    setRoles([]);
  };

  // Permission check functions
  const hasPermission = (permission) => {
    if (permissions.has('*')) return true;
    if (permissions.has(permission)) return true;

    // Check wildcard patterns
    const [resource] = permission.split(':');
    if (permissions.has(`${resource}:*`)) return true;

    return false;
  };

  const hasAnyPermission = (...perms) => {
    return perms.some(p => hasPermission(p));
  };

  const hasAllPermissions = (...perms) => {
    return perms.every(p => hasPermission(p));
  };

  const hasRole = (role) => {
    return roles.some(r => r.name === role);
  };

  const hasAnyRole = (...roleNames) => {
    return roleNames.some(r => hasRole(r));
  };

  const value = {
    user,
    permissions,
    roles,
    loading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Permission-Based Components

```jsx
// components/PermissionGate.jsx
import { useAuth } from '../contexts/AuthContext';

export function PermissionGate({
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
  children
}) {
  const { hasAnyPermission, hasAllPermissions, hasAnyRole } = useAuth();

  let hasAccess = false;

  // Check permissions
  if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(...permissions);
    } else {
      hasAccess = hasAnyPermission(...permissions);
    }
  }

  // Check roles (if no permissions specified or in addition to permissions)
  if (roles.length > 0) {
    const hasRoleAccess = hasAnyRole(...roles);
    if (permissions.length === 0) {
      hasAccess = hasRoleAccess;
    } else {
      hasAccess = hasAccess || hasRoleAccess;
    }
  }

  // Default to true if no permissions or roles specified
  if (permissions.length === 0 && roles.length === 0) {
    hasAccess = true;
  }

  return hasAccess ? children : fallback;
}

// Usage examples
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Only show if user can read users */}
      <PermissionGate permissions={['users:read']}>
        <UserList />
      </PermissionGate>

      {/* Only show if user is admin */}
      <PermissionGate roles={['admin']}>
        <AdminPanel />
      </PermissionGate>

      {/* Show if user has any of these permissions */}
      <PermissionGate permissions={['reports:view', 'analytics:read']}>
        <ReportsSection />
      </PermissionGate>

      {/* Require ALL permissions */}
      <PermissionGate
        permissions={['content:create', 'content:publish']}
        requireAll={true}
      >
        <ContentPublisher />
      </PermissionGate>

      {/* Show fallback for unauthorized users */}
      <PermissionGate
        permissions={['billing:manage']}
        fallback={<p>Contact admin to manage billing</p>}
      >
        <BillingManager />
      </PermissionGate>
    </div>
  );
}
```

### Protected Routes

```jsx
// components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({
  permissions = [],
  roles = [],
  requireAll = false,
  redirectTo = '/unauthorized',
  children
}) {
  const { user, loading, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let hasAccess = true;

  if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(...permissions);
    } else {
      hasAccess = hasAnyPermission(...permissions);
    }
  }

  if (roles.length > 0 && hasAccess) {
    hasAccess = roles.some(role => hasRole(role));
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
```

### App Route Configuration

```jsx
// App.jsx - Route configuration
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute permissions={['users:read']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute
              permissions={['settings:read', 'settings:write']}
              requireAll={true}
            >
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Custom Hooks

```jsx
// hooks/usePermission.js
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function usePermission(permission) {
  const { hasPermission, loading } = useAuth();

  const allowed = useMemo(() => {
    if (loading) return false;
    return hasPermission(permission);
  }, [permission, hasPermission, loading]);

  return { allowed, loading };
}

export function usePermissions(permissions, requireAll = false) {
  const { hasAnyPermission, hasAllPermissions, loading } = useAuth();

  const allowed = useMemo(() => {
    if (loading) return false;
    return requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions);
  }, [permissions, requireAll, hasAnyPermission, hasAllPermissions, loading]);

  return { allowed, loading };
}

// Usage
function ActionButton() {
  const { allowed, loading } = usePermission('users:delete');

  if (loading) return <Spinner />;
  if (!allowed) return null;

  return <button onClick={handleDelete}>Delete User</button>;
}
```

## Integration with Authentication

### Unified Auth Flow

```javascript
// services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class AuthService {
  constructor(pool, rbac, jwtSecret) {
    this.pool = pool;
    this.rbac = rbac;
    this.jwtSecret = jwtSecret;
  }

  async login(email, password) {
    // 1. Verify credentials
    const userResult = await this.pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // 2. Load user's roles and permissions
    const roles = await this.rbac.getUserRoles(user.id);
    const permissions = await this.rbac.getUserPermissions(user.id);

    // 3. Generate JWT with embedded role info
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles: roles.map(r => r.name)
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    // 4. Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      roles: roles,
      permissions: Array.from(permissions),
      accessToken: token,
      refreshToken: refreshToken
    };
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);

      // Optionally validate against database for real-time permission check
      const permissions = await this.rbac.getUserPermissions(decoded.sub);

      return {
        userId: decoded.sub,
        email: decoded.email,
        roles: decoded.roles,
        permissions: Array.from(permissions)
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async refreshAccessToken(refreshToken) {
    // Validate refresh token
    const storedToken = await this.getStoredRefreshToken(refreshToken);

    if (!storedToken || storedToken.expires_at < new Date()) {
      throw new Error('Invalid refresh token');
    }

    const user = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [storedToken.user_id]
    );

    if (user.rows.length === 0) {
      throw new Error('User not found');
    }

    const roles = await this.rbac.getUserRoles(storedToken.user_id);

    const newAccessToken = jwt.sign(
      {
        sub: storedToken.user_id,
        email: user.rows[0].email,
        roles: roles.map(r => r.name)
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    return { accessToken: newAccessToken };
  }
}

module.exports = AuthService;
```

### Middleware Integration

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const RBAC = require('./rbac');

function createAuthMiddleware(pool, jwtSecret) {
  const rbac = new RBAC(pool);

  // Authentication middleware
  const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256']
      });

      // Attach user and permission checker to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles
      };

      // Lazy-load permissions when needed
      req.checkPermission = async (permission) => {
        return rbac.hasPermission(decoded.sub, permission);
      };

      req.getPermissions = async () => {
        return rbac.getUserPermissions(decoded.sub);
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Authorization middleware factory
  const authorize = (options = {}) => {
    const { permissions = [], roles = [], requireAll = false } = options;

    return async (req, res, next) => {
      try {
        // Check roles first (faster, no DB query needed)
        if (roles.length > 0) {
          const hasRole = roles.some(role => req.user.roles.includes(role));
          if (hasRole) return next();
        }

        // Check permissions
        if (permissions.length > 0) {
          const userPermissions = await req.getPermissions();

          let hasAccess;
          if (requireAll) {
            hasAccess = permissions.every(p =>
              userPermissions.has(p) ||
              userPermissions.has('*') ||
              userPermissions.has(`${p.split(':')[0]}:*`)
            );
          } else {
            hasAccess = permissions.some(p =>
              userPermissions.has(p) ||
              userPermissions.has('*') ||
              userPermissions.has(`${p.split(':')[0]}:*`)
            );
          }

          if (hasAccess) return next();
        }

        // If no permissions or roles specified, allow access
        if (permissions.length === 0 && roles.length === 0) {
          return next();
        }

        return res.status(403).json({ error: 'Insufficient permissions' });
      } catch (error) {
        next(error);
      }
    };
  };

  return { authenticate, authorize, rbac };
}

module.exports = createAuthMiddleware;
```

## Best Practices

### Role Design Principles

```javascript
// Good: Role hierarchy reflects organizational structure
const roleHierarchy = {
  'super_admin': {
    inherits: ['admin'],
    description: 'Full system access with dangerous operations'
  },
  'admin': {
    inherits: ['user_manager', 'content_manager', 'system_operator'],
    description: 'Administrative access'
  },
  'user_manager': {
    inherits: ['viewer'],
    description: 'Can manage user accounts'
  },
  'content_manager': {
    inherits: ['editor'],
    description: 'Can manage and publish content'
  },
  'editor': {
    inherits: ['viewer'],
    description: 'Can create and edit content'
  },
  'viewer': {
    inherits: [],
    description: 'Read-only access'
  }
};

// Bad: Flat structure with duplicated permissions
const badRoles = {
  'admin': ['read', 'write', 'delete', 'manage'],
  'editor': ['read', 'write'],  // Duplicates admin's read, write
  'viewer': ['read']  // Duplicates editor's read
};
```

### Permission Naming Conventions

```javascript
// Recommended: resource:action[:scope] format
const goodPermissions = [
  'users:read',
  'users:create',
  'users:update',
  'users:delete',
  'users:read:own',      // Scoped to own resources
  'users:update:own',
  'content:publish',
  'reports:export:team'  // Scoped to team
];

// Avoid: Inconsistent or vague naming
const badPermissions = [
  'read_users',          // Inconsistent format
  'UserCreate',          // Mixed case
  'admin_access',        // Too vague
  'do_everything'        // Not specific
];
```

### Cache Strategy

```javascript
class RBACCache {
  constructor(redis, defaultTTL = 300) {
    this.redis = redis;
    this.defaultTTL = defaultTTL;
  }

  async getUserPermissions(userId) {
    const cacheKey = `rbac:permissions:${userId}`;

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return new Set(JSON.parse(cached));
    }

    // Load from database
    const permissions = await this.loadPermissionsFromDB(userId);

    // Cache with TTL
    await this.redis.setex(
      cacheKey,
      this.defaultTTL,
      JSON.stringify(Array.from(permissions))
    );

    return permissions;
  }

  async invalidateUser(userId) {
    await this.redis.del(`rbac:permissions:${userId}`);
  }

  async invalidateRole(roleId) {
    // Get all users with this role and invalidate their caches
    const users = await this.getUsersByRole(roleId);
    const pipeline = this.redis.pipeline();

    for (const userId of users) {
      pipeline.del(`rbac:permissions:${userId}`);
    }

    await pipeline.exec();
  }

  async invalidateAll() {
    const keys = await this.redis.keys('rbac:permissions:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Audit Logging

```javascript
class RBACAuditLogger {
  constructor(pool) {
    this.pool = pool;
  }

  async logRoleAssignment(userId, roleId, assignedBy, action) {
    await this.pool.query(`
      INSERT INTO rbac_audit_log
      (user_id, role_id, action, performed_by, timestamp)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [userId, roleId, action, assignedBy]);
  }

  async logPermissionCheck(userId, permission, result, resource = null) {
    await this.pool.query(`
      INSERT INTO permission_check_log
      (user_id, permission, result, resource_id, timestamp)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [userId, permission, result, resource]);
  }

  async getAuditTrail(userId, options = {}) {
    const { startDate, endDate, limit = 100 } = options;

    let query = `
      SELECT * FROM rbac_audit_log
      WHERE user_id = $1
    `;
    const params = [userId];

    if (startDate) {
      params.push(startDate);
      query += ` AND timestamp >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND timestamp <= $${params.length}`;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }
}
```

## Common Pitfalls

### Role Explosion

```javascript
// Bad: Creating a role for every permission combination
const roles = {
  'read_users_only': ['users:read'],
  'read_users_and_posts': ['users:read', 'posts:read'],
  'read_users_and_create_posts': ['users:read', 'posts:create'],
  // This leads to 2^n roles for n permissions!
};

// Good: Use meaningful business roles with hierarchies
const roles = {
  'viewer': ['read:*'],
  'contributor': ['read:*', 'posts:create', 'posts:update:own'],
  'editor': ['read:*', 'posts:*'],
  'admin': ['*']
};
```

### Not Handling Role Changes

```javascript
// Bad: Permissions cached indefinitely
class BadRBAC {
  constructor() {
    this.cache = new Map();
  }

  async getPermissions(userId) {
    if (!this.cache.has(userId)) {
      this.cache.set(userId, await this.loadFromDB(userId));
    }
    return this.cache.get(userId); // Never invalidated!
  }
}

// Good: Invalidate cache on role changes
class GoodRBAC {
  async assignRole(userId, roleId) {
    await this.db.assignRole(userId, roleId);
    await this.cache.invalidateUser(userId);
    await this.publishEvent('role.assigned', { userId, roleId });
  }

  async revokeRole(userId, roleId) {
    await this.db.revokeRole(userId, roleId);
    await this.cache.invalidateUser(userId);
    await this.publishEvent('role.revoked', { userId, roleId });
  }
}
```

### Frontend-Only Authorization

```javascript
// Bad: Only checking permissions on frontend
function DeleteButton({ userId }) {
  const { hasPermission } = useAuth();

  if (!hasPermission('users:delete')) {
    return null;  // Hidden but API still accessible!
  }

  return <button onClick={() => deleteUser(userId)}>Delete</button>;
}

// Good: Always enforce on backend + hide on frontend
// Backend
router.delete('/users/:id',
  authenticate,
  requirePermission('users:delete'),
  async (req, res) => {
    await userService.delete(req.params.id);
    res.status(204).send();
  }
);

// Frontend (for UX only)
function DeleteButton({ userId }) {
  const { hasPermission } = useAuth();

  if (!hasPermission('users:delete')) {
    return null;  // Hides button, but backend still protects
  }

  return <button onClick={() => deleteUser(userId)}>Delete</button>;
}
```

### Ignoring Hierarchies in Queries

```javascript
// Bad: Only checking direct role assignments
async function hasPermission(userId, permission) {
  const result = await pool.query(`
    SELECT 1 FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = $1 AND p.name = $2
  `, [userId, permission]);

  return result.rows.length > 0;  // Misses inherited permissions!
}

// Good: Use recursive query to include inherited roles
async function hasPermission(userId, permission) {
  const result = await pool.query(`
    WITH RECURSIVE role_tree AS (
      SELECT role_id FROM user_roles WHERE user_id = $1
      UNION
      SELECT rh.child_role_id
      FROM role_hierarchy rh
      JOIN role_tree rt ON rh.parent_role_id = rt.role_id
    )
    SELECT 1 FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN role_tree rt ON rp.role_id = rt.role_id
    WHERE p.name = $2 OR p.name = '*'
    LIMIT 1
  `, [userId, permission]);

  return result.rows.length > 0;
}
```

## Performance Considerations

### Query Optimization

```sql
-- Use materialized view for frequently accessed permission data
CREATE MATERIALIZED VIEW user_effective_permissions AS
WITH RECURSIVE role_tree AS (
  SELECT ur.user_id, ur.role_id
  FROM user_roles ur
  WHERE ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP

  UNION

  SELECT rt.user_id, rh.child_role_id
  FROM role_tree rt
  JOIN role_hierarchy rh ON rt.role_id = rh.parent_role_id
)
SELECT DISTINCT rt.user_id, p.name AS permission
FROM role_tree rt
JOIN role_permissions rp ON rt.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id;

-- Create index for fast lookups
CREATE UNIQUE INDEX idx_user_effective_permissions
ON user_effective_permissions(user_id, permission);

-- Refresh periodically or on role changes
REFRESH MATERIALIZED VIEW CONCURRENTLY user_effective_permissions;
```

### Multi-Level Caching Strategy

```javascript
class HighPerformanceRBAC {
  constructor(pool, redis) {
    this.pool = pool;
    this.redis = redis;
    this.localCache = new Map();
    this.localCacheTTL = 60 * 1000; // 1 minute
  }

  async hasPermission(userId, permission) {
    // Level 1: Local in-memory cache (fastest)
    const localKey = `${userId}:${permission}`;
    const localCached = this.localCache.get(localKey);
    if (localCached && Date.now() - localCached.time < this.localCacheTTL) {
      return localCached.result;
    }

    // Level 2: Redis cache (fast, shared across instances)
    const redisKey = `rbac:check:${userId}:${permission}`;
    const redisCached = await this.redis.get(redisKey);
    if (redisCached !== null) {
      const result = redisCached === '1';
      this.localCache.set(localKey, { result, time: Date.now() });
      return result;
    }

    // Level 3: Database with materialized view (slow but authoritative)
    const result = await this.pool.query(
      'SELECT 1 FROM user_effective_permissions WHERE user_id = $1 AND permission = $2',
      [userId, permission]
    );

    const hasPermission = result.rows.length > 0;

    // Cache results
    await this.redis.setex(redisKey, 300, hasPermission ? '1' : '0');
    this.localCache.set(localKey, { result: hasPermission, time: Date.now() });

    return hasPermission;
  }
}
```

### Batch Permission Checks

```javascript
// Bad: Individual permission checks
async function checkMultiplePermissions(userId, permissions) {
  const results = {};
  for (const perm of permissions) {
    results[perm] = await rbac.hasPermission(userId, perm);
  }
  return results;
}

// Good: Batch check
async function checkMultiplePermissions(userId, permissions) {
  const userPerms = await rbac.getUserPermissions(userId);

  return permissions.reduce((acc, perm) => {
    acc[perm] = userPerms.has(perm) ||
                userPerms.has('*') ||
                userPerms.has(`${perm.split(':')[0]}:*`);
    return acc;
  }, {});
}
```

## Interview Key Points

### Basic Questions

**Q1: What is RBAC and what problem does it solve?**

RBAC (Role-Based Access Control) is an authorization model that manages permissions through roles rather than direct user-permission assignments. It solves the complexity of managing individual user permissions in large systems, provides better alignment with organizational structures, and simplifies compliance auditing.

**Q2: What are the main components of RBAC?**

The core components are:
- **Users**: Individuals who access the system
- **Roles**: Named collections of permissions representing job functions
- **Permissions**: Specific access rights to resources
- **Sessions**: Active user contexts with activated roles

**Q3: What is the difference between RBAC and ABAC?**

RBAC assigns permissions based on roles (static), while ABAC evaluates attributes at runtime (dynamic). RBAC is simpler to implement and audit, while ABAC provides finer-grained, context-aware access control. Many systems use a hybrid approach.

### Intermediate Questions

**Q4: Explain Static vs Dynamic Separation of Duty.**

- **Static Separation of Duty (SSD)**: Prevents users from being assigned conflicting roles (enforced at assignment time). Example: User cannot be both "Auditor" and "Accountant".
- **Dynamic Separation of Duty (DSD)**: Prevents users from activating conflicting roles in the same session (enforced at runtime). Example: User can have both roles but cannot use both simultaneously.

**Q5: How do you handle role hierarchies?**

Role hierarchies allow senior roles to inherit permissions from junior roles. Implementation typically uses recursive queries or materialized views to resolve the complete permission set. Care must be taken to prevent circular dependencies and limit hierarchy depth.

**Q6: How do you optimize RBAC performance?**

Key optimization strategies:
- Cache user permissions with appropriate TTL
- Use materialized views for effective permissions
- Implement multi-level caching (local memory -> Redis -> database)
- Batch permission checks when possible
- Invalidate caches on role/permission changes

### Advanced Questions

**Q7: How do you handle RBAC in a microservices architecture?**

Options include:
- **Centralized RBAC Service**: Single source of truth, all services query it
- **JWT with Embedded Roles**: Include roles/permissions in tokens, services validate locally
- **Sidecar Pattern**: Authorization proxy handles all permission checks
- **Hybrid**: JWT for basic roles, query service for detailed permissions

**Q8: How do you migrate from one RBAC model to another?**

Steps for migration:
1. Audit current permissions and create mapping
2. Design new role structure with business stakeholders
3. Implement parallel running (old and new systems)
4. Gradually migrate users with rollback capability
5. Validate through comprehensive testing
6. Monitor for permission issues post-migration

**Q9: How do you implement tenant-specific RBAC in multi-tenant systems?**

Approaches:
- Namespace roles/permissions per tenant
- Add tenant context to all RBAC queries
- Implement tenant-level role templates
- Consider tenant hierarchy for enterprise customers

## Further Reading

### Official Standards

- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control) - The authoritative RBAC specification
- [XACML](https://docs.oasis-open.org/xacml/3.0/xacml-3.0-core-spec-os-en.html) - eXtensible Access Control Markup Language

### Books

- "Role-Based Access Control" by David F. Ferraiolo, D. Richard Kuhn, and Ramaswamy Chandramouli
- "Identity and Data Security for Web Development" by Jonathan LeBlanc and Tim Messerschmidt
- "API Security in Action" by Neil Madden

### Libraries and Tools

- [Casbin](https://casbin.org/) - Authorization library supporting RBAC, ABAC, and more
- [Open Policy Agent (OPA)](https://www.openpolicyagent.org/) - Policy engine for cloud-native authorization
- [Keycloak](https://www.keycloak.org/) - Identity and access management with RBAC support
- [Auth0](https://auth0.com/docs/manage-users/access-control/rbac) - RBAC implementation guide

### Articles and Tutorials

- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Google Cloud IAM Overview](https://cloud.google.com/iam/docs/overview)
