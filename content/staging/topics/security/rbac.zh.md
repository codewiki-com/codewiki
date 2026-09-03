---
title: RBAC 权限控制模型
description: 掌握基于角色的访问控制，构建安全的权限体系
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - RBAC
  - 权限控制
  - 授权
  - 访问控制
status: imported
origin: old/src/content/docs/security/rbac.zh.md
divergence: 0.18
issues: []
legacy:
  category: Security
  subcategory: Access Control
  order: 8
  lastUpdated: 2026-01-07
---

在现代软件系统中，权限控制是保障系统安全的核心环节。RBAC（Role-Based Access Control，基于角色的访问控制）作为最广泛应用的权限模型，通过角色这一中间层，优雅地解决了用户与权限之间的映射问题。本文将深入探讨 RBAC 的设计理念、实现方法及最佳实践。

## 访问控制模型概述

在深入 RBAC 之前，我们先了解主流的访问控制模型及其特点。

### 访问控制模型对比

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         访问控制模型演进                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   DAC (自主访问控制)                                                         │
│   ├── 资源所有者决定访问权限                                                  │
│   ├── 灵活但难以统一管理                                                      │
│   └── 典型应用：文件系统权限                                                  │
│                                                                             │
│   MAC (强制访问控制)                                                         │
│   ├── 系统强制执行安全策略                                                    │
│   ├── 基于安全级别和标签                                                      │
│   └── 典型应用：军事、政府系统                                                │
│                                                                             │
│   RBAC (基于角色的访问控制)                                                   │
│   ├── 通过角色间接授权                                                        │
│   ├── 易于管理和审计                                                         │
│   └── 典型应用：企业应用、SaaS 系统                                          │
│                                                                             │
│   ABAC (基于属性的访问控制)                                                   │
│   ├── 基于主体、资源、环境属性                                                │
│   ├── 最灵活但最复杂                                                         │
│   └── 典型应用：云平台、复杂业务系统                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### DAC（自主访问控制）

DAC 是最早的访问控制模型，资源所有者可以自主决定谁能访问其资源。

```javascript
// DAC 示例：文件权限管理
class File {
  constructor(name, owner) {
    this.name = name;
    this.owner = owner;
    this.permissions = {
      [owner]: ['read', 'write', 'delete', 'share']
    };
  }

  // 所有者可以授予其他用户权限
  grantPermission(grantedBy, targetUser, permission) {
    if (this.owner !== grantedBy) {
      throw new Error('只有所有者才能授予权限');
    }
    if (!this.permissions[targetUser]) {
      this.permissions[targetUser] = [];
    }
    this.permissions[targetUser].push(permission);
  }

  // 检查用户是否有特定权限
  hasPermission(user, permission) {
    return this.permissions[user]?.includes(permission) || false;
  }
}
```

### MAC（强制访问控制）

MAC 由系统强制执行安全策略，用户无法更改。常用于高安全需求场景。

```javascript
// MAC 示例：基于安全级别的访问控制
const SecurityLevels = {
  TOP_SECRET: 4,
  SECRET: 3,
  CONFIDENTIAL: 2,
  UNCLASSIFIED: 1
};

class MACSystem {
  constructor() {
    this.subjects = new Map(); // 主体（用户）安全级别
    this.objects = new Map();  // 客体（资源）安全级别
  }

  setSubjectLevel(subject, level) {
    this.subjects.set(subject, level);
  }

  setObjectLevel(object, level) {
    this.objects.set(object, level);
  }

  // Bell-LaPadula 模型：不上读，不下写
  canRead(subject, object) {
    const subjectLevel = this.subjects.get(subject);
    const objectLevel = this.objects.get(object);
    // 主体安全级别 >= 客体安全级别 才能读取
    return subjectLevel >= objectLevel;
  }

  canWrite(subject, object) {
    const subjectLevel = this.subjects.get(subject);
    const objectLevel = this.objects.get(object);
    // 主体安全级别 <= 客体安全级别 才能写入（防止信息向下泄露）
    return subjectLevel <= objectLevel;
  }
}

// 使用示例
const mac = new MACSystem();
mac.setSubjectLevel('alice', SecurityLevels.SECRET);
mac.setObjectLevel('classified_doc', SecurityLevels.CONFIDENTIAL);

console.log(mac.canRead('alice', 'classified_doc'));  // true（向下读）
console.log(mac.canWrite('alice', 'classified_doc')); // false（不能向下写）
```

### ABAC（基于属性的访问控制）

ABAC 是最灵活的访问控制模型，基于主体属性、资源属性、环境属性和操作属性进行决策。

```javascript
// ABAC 示例：基于属性的策略引擎
class ABACEngine {
  constructor() {
    this.policies = [];
  }

  addPolicy(policy) {
    this.policies.push(policy);
  }

  evaluate(context) {
    // context 包含：subject, resource, action, environment
    for (const policy of this.policies) {
      if (this.matchPolicy(policy, context)) {
        return policy.effect; // 'allow' 或 'deny'
      }
    }
    return 'deny'; // 默认拒绝
  }

  matchPolicy(policy, context) {
    return (
      this.matchAttributes(policy.subject, context.subject) &&
      this.matchAttributes(policy.resource, context.resource) &&
      this.matchAttributes(policy.action, context.action) &&
      this.matchAttributes(policy.environment, context.environment)
    );
  }

  matchAttributes(policyAttrs, contextAttrs) {
    if (!policyAttrs) return true;
    return Object.entries(policyAttrs).every(([key, value]) => {
      if (typeof value === 'function') {
        return value(contextAttrs[key]);
      }
      return contextAttrs[key] === value;
    });
  }
}

// 定义策略：部门经理只能在工作时间访问本部门员工数据
const abac = new ABACEngine();
abac.addPolicy({
  effect: 'allow',
  subject: {
    role: 'manager'
  },
  resource: {
    type: 'employee_data',
    department: (dept) => true // 将在运行时检查是否与主体部门匹配
  },
  action: { type: 'read' },
  environment: {
    time: (time) => time.getHours() >= 9 && time.getHours() < 18
  }
});
```

## RBAC 核心概念

RBAC 的核心在于引入"角色"作为用户和权限之间的桥梁，大大简化了权限管理。

### 基本元素

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RBAC 核心模型                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────┐         ┌──────────┐         ┌──────────┐                  │
│    │   用户    │   N:M   │   角色    │   N:M   │   权限    │                  │
│    │  (User)  │ ──────▶ │  (Role)  │ ──────▶ │(Permission)│                 │
│    └──────────┘         └──────────┘         └──────────┘                  │
│                                                                             │
│    用户：系统的使用者，可以是人或系统                                          │
│    角色：权限的集合，代表一类职能                                              │
│    权限：对资源执行操作的许可                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 权限定义

权限通常由"资源"和"操作"两部分组成：

```javascript
// 权限定义示例
const permissions = {
  // 格式：resource:action
  'user:create': { resource: 'user', action: 'create', description: '创建用户' },
  'user:read': { resource: 'user', action: 'read', description: '查看用户' },
  'user:update': { resource: 'user', action: 'update', description: '更新用户' },
  'user:delete': { resource: 'user', action: 'delete', description: '删除用户' },
  'article:create': { resource: 'article', action: 'create', description: '创建文章' },
  'article:publish': { resource: 'article', action: 'publish', description: '发布文章' },
  'system:config': { resource: 'system', action: 'config', description: '系统配置' }
};

// 角色定义
const roles = {
  admin: {
    name: '管理员',
    permissions: ['user:*', 'article:*', 'system:*'] // 使用通配符
  },
  editor: {
    name: '编辑',
    permissions: ['article:create', 'article:read', 'article:update', 'article:publish']
  },
  author: {
    name: '作者',
    permissions: ['article:create', 'article:read', 'article:update']
  },
  viewer: {
    name: '访客',
    permissions: ['article:read', 'user:read']
  }
};
```

### RBAC 核心类实现

```typescript
// rbac.ts - RBAC 核心实现
interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Set<string>;
  parentRoles?: string[]; // 支持角色继承
}

interface User {
  id: string;
  username: string;
  roles: Set<string>;
}

class RBAC {
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();

  // 注册权限
  registerPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  // 创建角色
  createRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  // 为角色分配权限
  assignPermissionToRole(roleId: string, permissionId: string): void {
    const role = this.roles.get(roleId);
    if (!role) throw new Error(`角色 ${roleId} 不存在`);
    if (!this.permissions.has(permissionId) && !permissionId.includes('*')) {
      throw new Error(`权限 ${permissionId} 不存在`);
    }
    role.permissions.add(permissionId);
  }

  // 为用户分配角色
  assignRoleToUser(userId: string, roleId: string): void {
    let user = this.users.get(userId);
    if (!user) {
      user = { id: userId, username: userId, roles: new Set() };
      this.users.set(userId, user);
    }
    if (!this.roles.has(roleId)) {
      throw new Error(`角色 ${roleId} 不存在`);
    }
    user.roles.add(roleId);
  }

  // 获取角色的所有权限（包括继承的权限）
  getRolePermissions(roleId: string, visited: Set<string> = new Set()): Set<string> {
    if (visited.has(roleId)) return new Set(); // 防止循环继承
    visited.add(roleId);

    const role = this.roles.get(roleId);
    if (!role) return new Set();

    const permissions = new Set(role.permissions);

    // 递归获取父角色的权限
    if (role.parentRoles) {
      for (const parentRoleId of role.parentRoles) {
        const parentPermissions = this.getRolePermissions(parentRoleId, visited);
        parentPermissions.forEach(p => permissions.add(p));
      }
    }

    return permissions;
  }

  // 获取用户的所有权限
  getUserPermissions(userId: string): Set<string> {
    const user = this.users.get(userId);
    if (!user) return new Set();

    const permissions = new Set<string>();
    for (const roleId of user.roles) {
      const rolePermissions = this.getRolePermissions(roleId);
      rolePermissions.forEach(p => permissions.add(p));
    }
    return permissions;
  }

  // 检查权限（支持通配符）
  checkPermission(userId: string, requiredPermission: string): boolean {
    const userPermissions = this.getUserPermissions(userId);

    // 直接匹配
    if (userPermissions.has(requiredPermission)) return true;

    // 通配符匹配
    const [resource, action] = requiredPermission.split(':');

    // 检查 resource:* 格式
    if (userPermissions.has(`${resource}:*`)) return true;

    // 检查 *:action 格式
    if (userPermissions.has(`*:${action}`)) return true;

    // 检查 *:* 超级权限
    if (userPermissions.has('*:*')) return true;

    return false;
  }
}

// 使用示例
const rbac = new RBAC();

// 注册权限
rbac.registerPermission({ id: 'user:create', resource: 'user', action: 'create' });
rbac.registerPermission({ id: 'user:read', resource: 'user', action: 'read' });
rbac.registerPermission({ id: 'user:update', resource: 'user', action: 'update' });
rbac.registerPermission({ id: 'user:delete', resource: 'user', action: 'delete' });

// 创建角色
rbac.createRole({ id: 'admin', name: '管理员', permissions: new Set(['*:*']) });
rbac.createRole({ id: 'user_manager', name: '用户管理员', permissions: new Set(['user:*']) });
rbac.createRole({ id: 'viewer', name: '查看者', permissions: new Set(['user:read']) });

// 分配角色
rbac.assignRoleToUser('alice', 'admin');
rbac.assignRoleToUser('bob', 'user_manager');
rbac.assignRoleToUser('charlie', 'viewer');

// 权限检查
console.log(rbac.checkPermission('alice', 'user:delete'));   // true
console.log(rbac.checkPermission('bob', 'user:delete'));     // true
console.log(rbac.checkPermission('charlie', 'user:delete')); // false
```

## 角色层次与继承

RBAC1 模型引入了角色层次结构，允许角色之间存在继承关系，子角色自动继承父角色的所有权限。

### 角色继承模型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          角色继承层次图                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌─────────────┐                                     │
│                         │  超级管理员   │                                     │
│                         │ (SuperAdmin) │                                     │
│                         └──────┬──────┘                                     │
│                                │                                            │
│              ┌─────────────────┼─────────────────┐                          │
│              │                 │                 │                          │
│              ▼                 ▼                 ▼                          │
│       ┌──────────┐      ┌──────────┐      ┌──────────┐                     │
│       │ 用户管理员 │      │ 内容管理员 │      │ 系统管理员 │                     │
│       │(UserAdmin)│      │(ContentAdmin)│   │(SysAdmin) │                    │
│       └─────┬────┘      └─────┬────┘      └──────────┘                     │
│             │                 │                                             │
│             ▼                 ▼                                             │
│       ┌──────────┐      ┌──────────┐                                       │
│       │  普通用户  │      │   编辑    │                                       │
│       │  (User)   │      │ (Editor)  │                                       │
│       └──────────┘      └─────┬────┘                                       │
│                               │                                             │
│                               ▼                                             │
│                         ┌──────────┐                                       │
│                         │   作者    │                                       │
│                         │ (Author)  │                                       │
│                         └──────────┘                                       │
│                                                                             │
│   说明：箭头方向表示继承关系，子角色继承父角色的所有权限                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 角色继承实现

```typescript
// role-hierarchy.ts - 角色层次结构实现
class RoleHierarchy {
  private roles: Map<string, {
    name: string;
    permissions: Set<string>;
    parents: Set<string>;
    children: Set<string>;
  }> = new Map();

  addRole(id: string, name: string, permissions: string[] = []): void {
    this.roles.set(id, {
      name,
      permissions: new Set(permissions),
      parents: new Set(),
      children: new Set()
    });
  }

  // 建立继承关系：child 继承 parent 的权限
  addInheritance(childId: string, parentId: string): void {
    const child = this.roles.get(childId);
    const parent = this.roles.get(parentId);

    if (!child || !parent) {
      throw new Error('角色不存在');
    }

    // 检测循环继承
    if (this.wouldCreateCycle(childId, parentId)) {
      throw new Error('检测到循环继承');
    }

    child.parents.add(parentId);
    parent.children.add(childId);
  }

  // 检测是否会产生循环继承
  private wouldCreateCycle(childId: string, newParentId: string): boolean {
    const visited = new Set<string>();
    const queue = [childId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === newParentId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const role = this.roles.get(current);
      if (role) {
        queue.push(...role.children);
      }
    }
    return false;
  }

  // 获取角色的所有有效权限（包括继承的）
  getEffectivePermissions(roleId: string): Set<string> {
    const permissions = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const role = this.roles.get(id);
      if (!role) return;

      role.permissions.forEach(p => permissions.add(p));
      role.parents.forEach(parentId => traverse(parentId));
    };

    traverse(roleId);
    return permissions;
  }

  // 获取角色的所有祖先角色
  getAncestors(roleId: string): Set<string> {
    const ancestors = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      const role = this.roles.get(id);
      if (!role) return;

      for (const parentId of role.parents) {
        if (!visited.has(parentId)) {
          visited.add(parentId);
          ancestors.add(parentId);
          traverse(parentId);
        }
      }
    };

    traverse(roleId);
    return ancestors;
  }

  // 获取角色的所有后代角色
  getDescendants(roleId: string): Set<string> {
    const descendants = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      const role = this.roles.get(id);
      if (!role) return;

      for (const childId of role.children) {
        if (!visited.has(childId)) {
          visited.add(childId);
          descendants.add(childId);
          traverse(childId);
        }
      }
    };

    traverse(roleId);
    return descendants;
  }
}

// 使用示例
const hierarchy = new RoleHierarchy();

// 定义角色
hierarchy.addRole('super_admin', '超级管理员', ['*:*']);
hierarchy.addRole('user_admin', '用户管理员', ['user:*']);
hierarchy.addRole('content_admin', '内容管理员', ['article:*', 'comment:*']);
hierarchy.addRole('editor', '编辑', ['article:edit', 'article:publish']);
hierarchy.addRole('author', '作者', ['article:create', 'article:read']);

// 建立继承关系
hierarchy.addInheritance('user_admin', 'super_admin');
hierarchy.addInheritance('content_admin', 'super_admin');
hierarchy.addInheritance('editor', 'content_admin');
hierarchy.addInheritance('author', 'editor');

// 获取作者的有效权限
const authorPermissions = hierarchy.getEffectivePermissions('author');
console.log('作者的有效权限:', [...authorPermissions]);
// 输出: ['article:create', 'article:read', 'article:edit', 'article:publish', 'article:*', 'comment:*', '*:*']
```

## 权限分配策略

合理的权限分配策略是 RBAC 系统成功的关键。以下是几种常见的策略。

### 最小权限原则

```typescript
// 最小权限原则实现
class MinimumPrivilegeManager {
  private userActivities: Map<string, Set<string>> = new Map();
  private permissionUsage: Map<string, Map<string, number>> = new Map();

  // 记录用户实际使用的权限
  recordActivity(userId: string, permission: string): void {
    if (!this.userActivities.has(userId)) {
      this.userActivities.set(userId, new Set());
    }
    this.userActivities.get(userId)!.add(permission);

    if (!this.permissionUsage.has(userId)) {
      this.permissionUsage.set(userId, new Map());
    }
    const usage = this.permissionUsage.get(userId)!;
    usage.set(permission, (usage.get(permission) || 0) + 1);
  }

  // 分析用户的权限使用情况
  analyzePermissionUsage(userId: string, assignedPermissions: Set<string>): {
    used: string[];
    unused: string[];
    recommendations: string[];
  } {
    const activities = this.userActivities.get(userId) || new Set();
    const used: string[] = [];
    const unused: string[] = [];
    const recommendations: string[] = [];

    for (const permission of assignedPermissions) {
      if (activities.has(permission)) {
        used.push(permission);
      } else {
        unused.push(permission);
        recommendations.push(`考虑移除未使用的权限: ${permission}`);
      }
    }

    return { used, unused, recommendations };
  }

  // 生成最小权限集建议
  suggestMinimumPermissions(userId: string): string[] {
    const activities = this.userActivities.get(userId);
    if (!activities) return [];

    return [...activities];
  }
}
```

### 职责分离（SoD）

```typescript
// 职责分离实现
interface SoDRule {
  id: string;
  description: string;
  conflictingRoles: [string, string]; // 互斥的角色对
}

class SeparationOfDuties {
  private rules: SoDRule[] = [];

  addRule(rule: SoDRule): void {
    this.rules.push(rule);
  }

  // 检查用户的角色分配是否违反 SoD 规则
  checkViolations(userRoles: Set<string>): SoDRule[] {
    const violations: SoDRule[] = [];

    for (const rule of this.rules) {
      const [role1, role2] = rule.conflictingRoles;
      if (userRoles.has(role1) && userRoles.has(role2)) {
        violations.push(rule);
      }
    }

    return violations;
  }

  // 尝试分配角色，如果违反 SoD 则拒绝
  canAssignRole(currentRoles: Set<string>, newRole: string): {
    allowed: boolean;
    violations: SoDRule[];
  } {
    const testRoles = new Set([...currentRoles, newRole]);
    const violations = this.checkViolations(testRoles);

    return {
      allowed: violations.length === 0,
      violations
    };
  }
}

// 使用示例
const sod = new SeparationOfDuties();

// 添加职责分离规则
sod.addRule({
  id: 'sod-1',
  description: '创建采购订单和审批采购订单必须由不同人执行',
  conflictingRoles: ['purchase_creator', 'purchase_approver']
});

sod.addRule({
  id: 'sod-2',
  description: '系统管理员和审计员必须分离',
  conflictingRoles: ['sys_admin', 'auditor']
});

// 检查角色分配
const userRoles = new Set(['purchase_creator']);
const result = sod.canAssignRole(userRoles, 'purchase_approver');
console.log('允许分配:', result.allowed); // false
console.log('违反规则:', result.violations);
```

### 动态权限约束

```typescript
// 动态权限约束
interface DynamicConstraint {
  id: string;
  type: 'time' | 'location' | 'count' | 'custom';
  evaluate: (context: ConstraintContext) => boolean;
}

interface ConstraintContext {
  userId: string;
  permission: string;
  timestamp: Date;
  ipAddress?: string;
  sessionData?: Record<string, any>;
}

class DynamicPermissionManager {
  private constraints: Map<string, DynamicConstraint[]> = new Map();

  // 为权限添加约束
  addConstraint(permission: string, constraint: DynamicConstraint): void {
    if (!this.constraints.has(permission)) {
      this.constraints.set(permission, []);
    }
    this.constraints.get(permission)!.push(constraint);
  }

  // 检查权限是否满足所有约束
  checkPermissionWithConstraints(
    hasStaticPermission: boolean,
    context: ConstraintContext
  ): { allowed: boolean; failedConstraints: string[] } {
    if (!hasStaticPermission) {
      return { allowed: false, failedConstraints: ['静态权限检查失败'] };
    }

    const constraints = this.constraints.get(context.permission) || [];
    const failedConstraints: string[] = [];

    for (const constraint of constraints) {
      if (!constraint.evaluate(context)) {
        failedConstraints.push(constraint.id);
      }
    }

    return {
      allowed: failedConstraints.length === 0,
      failedConstraints
    };
  }
}

// 使用示例
const dynamicManager = new DynamicPermissionManager();

// 添加工作时间约束
dynamicManager.addConstraint('financial:approve', {
  id: 'business-hours',
  type: 'time',
  evaluate: (ctx) => {
    const hour = ctx.timestamp.getHours();
    return hour >= 9 && hour < 18;
  }
});

// 添加 IP 地址约束
dynamicManager.addConstraint('system:config', {
  id: 'internal-network',
  type: 'location',
  evaluate: (ctx) => {
    return ctx.ipAddress?.startsWith('192.168.') || ctx.ipAddress === '127.0.0.1';
  }
});

// 添加操作次数约束
const operationCounts = new Map<string, number>();
dynamicManager.addConstraint('data:export', {
  id: 'daily-limit',
  type: 'count',
  evaluate: (ctx) => {
    const key = `${ctx.userId}:${ctx.timestamp.toDateString()}`;
    const count = operationCounts.get(key) || 0;
    return count < 10; // 每天最多导出10次
  }
});
```

## 数据库设计

良好的数据库设计是 RBAC 系统的基础。以下是推荐的数据库模式。

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive', 'locked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- 角色表
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    name VARCHAR(100) NOT NULL COMMENT '角色名称',
    description TEXT COMMENT '角色描述',
    parent_id BIGINT DEFAULT NULL COMMENT '父角色ID，用于角色继承',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统内置角色',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES roles(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status)
);

-- 权限表
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码，格式：resource:action',
    name VARCHAR(100) NOT NULL COMMENT '权限名称',
    description TEXT COMMENT '权限描述',
    resource VARCHAR(50) NOT NULL COMMENT '资源类型',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统内置权限',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_resource (resource),
    INDEX idx_resource_action (resource, action)
);

-- 用户-角色关联表
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    granted_by BIGINT COMMENT '授权人',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT '过期时间，NULL表示永不过期',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user (user_id),
    INDEX idx_role (role_id),
    INDEX idx_expires (expires_at)
);

-- 角色-权限关联表
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    INDEX idx_role (role_id),
    INDEX idx_permission (permission_id)
);

-- 权限组表（可选，用于批量管理权限）
CREATE TABLE permission_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限组-权限关联表
CREATE TABLE permission_group_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES permission_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_group_permission (group_id, permission_id)
);

-- 操作审计日志表
CREATE TABLE permission_audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    action_type ENUM('grant_role', 'revoke_role', 'grant_permission', 'revoke_permission') NOT NULL,
    target_type ENUM('user', 'role') NOT NULL,
    target_id BIGINT NOT NULL,
    role_id BIGINT NULL,
    permission_id BIGINT NULL,
    operator_id BIGINT NOT NULL COMMENT '操作人',
    operator_ip VARCHAR(45),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_operator (operator_id),
    INDEX idx_created (created_at),
    INDEX idx_action_type (action_type)
);
```

### 常用查询

```sql
-- 获取用户的所有角色
SELECT r.*
FROM roles r
JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = ?
  AND r.status = 'active'
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- 获取用户的所有权限（包括通过角色继承的）
WITH RECURSIVE role_hierarchy AS (
    -- 用户直接拥有的角色
    SELECT r.id, r.parent_id, 0 as level
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
      AND r.status = 'active'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())

    UNION ALL

    -- 递归获取父角色
    SELECT r.id, r.parent_id, rh.level + 1
    FROM roles r
    JOIN role_hierarchy rh ON r.id = rh.parent_id
    WHERE r.status = 'active'
)
SELECT DISTINCT p.*
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN role_hierarchy rh ON rp.role_id = rh.id;

-- 检查用户是否拥有特定权限
SELECT EXISTS(
    WITH RECURSIVE role_hierarchy AS (
        SELECT r.id, r.parent_id
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
          AND r.status = 'active'
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())

        UNION ALL

        SELECT r.id, r.parent_id
        FROM roles r
        JOIN role_hierarchy rh ON r.id = rh.parent_id
        WHERE r.status = 'active'
    )
    SELECT 1
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN role_hierarchy rh ON rp.role_id = rh.id
    WHERE p.code = ?
) as has_permission;

-- 获取拥有特定权限的所有用户
SELECT DISTINCT u.*
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.code = ?
  AND u.status = 'active'
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
```

### 数据库访问层

```typescript
// repository/permission.repository.ts
import { Pool, RowDataPacket } from 'mysql2/promise';

interface UserPermission {
  id: number;
  code: string;
  name: string;
  resource: string;
  action: string;
}

class PermissionRepository {
  constructor(private pool: Pool) {}

  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    const sql = `
      WITH RECURSIVE role_hierarchy AS (
        SELECT r.id, r.parent_id
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
          AND r.status = 'active'
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())

        UNION ALL

        SELECT r.id, r.parent_id
        FROM roles r
        JOIN role_hierarchy rh ON r.id = rh.parent_id
        WHERE r.status = 'active'
      )
      SELECT DISTINCT p.id, p.code, p.name, p.resource, p.action
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN role_hierarchy rh ON rp.role_id = rh.id
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, [userId]);
    return rows as UserPermission[];
  }

  async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const sql = `
      SELECT EXISTS(
        WITH RECURSIVE role_hierarchy AS (
          SELECT r.id, r.parent_id
          FROM roles r
          JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = ?
            AND r.status = 'active'
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())

          UNION ALL

          SELECT r.id, r.parent_id
          FROM roles r
          JOIN role_hierarchy rh ON r.id = rh.parent_id
          WHERE r.status = 'active'
        )
        SELECT 1
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN role_hierarchy rh ON rp.role_id = rh.id
        WHERE p.code = ?
      ) as has_permission
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, [userId, permissionCode]);
    return rows[0].has_permission === 1;
  }

  async assignRoleToUser(
    userId: number,
    roleId: number,
    grantedBy: number,
    expiresAt?: Date
  ): Promise<void> {
    const sql = `
      INSERT INTO user_roles (user_id, role_id, granted_by, expires_at)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        granted_by = VALUES(granted_by),
        granted_at = CURRENT_TIMESTAMP,
        expires_at = VALUES(expires_at)
    `;

    await this.pool.execute(sql, [userId, roleId, grantedBy, expiresAt || null]);

    // 记录审计日志
    await this.logAudit(userId, 'grant_role', 'user', userId, roleId, null, grantedBy);
  }

  private async logAudit(
    userId: number,
    actionType: string,
    targetType: string,
    targetId: number,
    roleId: number | null,
    permissionId: number | null,
    operatorId: number
  ): Promise<void> {
    const sql = `
      INSERT INTO permission_audit_logs
      (user_id, action_type, target_type, target_id, role_id, permission_id, operator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.pool.execute(sql, [
      userId, actionType, targetType, targetId, roleId, permissionId, operatorId
    ]);
  }
}
```

## API 权限控制实现

在实际应用中，我们需要在 API 层面实现权限控制。

### Express 中间件实现

```typescript
// middleware/authorization.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PermissionRepository } from '../repository/permission.repository';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        permissions?: Set<string>;
      };
    }
  }
}

// 权限缓存（生产环境建议使用 Redis）
class PermissionCache {
  private cache: Map<number, { permissions: Set<string>; expiresAt: number }> = new Map();
  private ttl = 5 * 60 * 1000; // 5分钟缓存

  get(userId: number): Set<string> | null {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }
    this.cache.delete(userId);
    return null;
  }

  set(userId: number, permissions: Set<string>): void {
    this.cache.set(userId, {
      permissions,
      expiresAt: Date.now() + this.ttl
    });
  }

  invalidate(userId: number): void {
    this.cache.delete(userId);
  }
}

const permissionCache = new PermissionCache();

// 加载用户权限中间件
export function loadUserPermissions(permissionRepo: PermissionRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    // 尝试从缓存获取
    let permissions = permissionCache.get(req.user.id);

    if (!permissions) {
      // 从数据库加载
      const userPermissions = await permissionRepo.getUserPermissions(req.user.id);
      permissions = new Set(userPermissions.map(p => p.code));
      permissionCache.set(req.user.id, permissions);
    }

    req.user.permissions = permissions;
    next();
  };
}

// 权限检查中间件工厂
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录'
      });
    }

    if (!req.user.permissions) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '权限信息未加载'
      });
    }

    const hasPermission = requiredPermissions.some(permission => {
      // 直接匹配
      if (req.user!.permissions!.has(permission)) return true;

      // 通配符匹配
      const [resource, action] = permission.split(':');
      if (req.user!.permissions!.has(`${resource}:*`)) return true;
      if (req.user!.permissions!.has(`*:${action}`)) return true;
      if (req.user!.permissions!.has('*:*')) return true;

      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '没有执行此操作的权限',
        required: requiredPermissions
      });
    }

    next();
  };
}

// 角色检查中间件
export function requireRole(...requiredRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录'
      });
    }

    // 从数据库检查用户角色（实际应用中应该缓存）
    const userRoles = await getUserRoles(req.user.id);

    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '没有所需的角色',
        required: requiredRoles
      });
    }

    next();
  };
}

// 资源所有权检查
export function requireOwnership(resourceGetter: (req: Request) => Promise<{ ownerId: number } | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const resource = await resourceGetter(req);

    if (!resource) {
      return res.status(404).json({ error: 'Not Found' });
    }

    // 检查是否是资源所有者或有管理员权限
    const isOwner = resource.ownerId === req.user.id;
    const isAdmin = req.user.permissions?.has('*:*') || req.user.permissions?.has('admin:*');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '只能操作自己的资源'
      });
    }

    next();
  };
}
```

### 路由使用示例

```typescript
// routes/article.routes.ts
import { Router } from 'express';
import { requirePermission, requireOwnership } from '../middleware/authorization.middleware';
import { ArticleController } from '../controllers/article.controller';
import { ArticleService } from '../services/article.service';

const router = Router();
const articleController = new ArticleController();
const articleService = new ArticleService();

// 文章列表 - 需要 article:read 权限
router.get(
  '/articles',
  requirePermission('article:read'),
  articleController.list
);

// 创建文章 - 需要 article:create 权限
router.post(
  '/articles',
  requirePermission('article:create'),
  articleController.create
);

// 更新文章 - 需要 article:update 权限 + 所有权验证
router.put(
  '/articles/:id',
  requirePermission('article:update'),
  requireOwnership(async (req) => {
    const article = await articleService.findById(parseInt(req.params.id));
    return article ? { ownerId: article.authorId } : null;
  }),
  articleController.update
);

// 删除文章 - 需要 article:delete 权限
router.delete(
  '/articles/:id',
  requirePermission('article:delete'),
  articleController.delete
);

// 发布文章 - 需要 article:publish 权限
router.post(
  '/articles/:id/publish',
  requirePermission('article:publish'),
  articleController.publish
);

export default router;
```

### 装饰器模式（适用于 NestJS）

```typescript
// decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

// guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    return requiredPermissions.some(permission =>
      this.matchPermission(user.permissions, permission)
    );
  }

  private matchPermission(userPermissions: Set<string>, required: string): boolean {
    if (userPermissions.has(required)) return true;

    const [resource, action] = required.split(':');
    if (userPermissions.has(`${resource}:*`)) return true;
    if (userPermissions.has(`*:${action}`)) return true;
    if (userPermissions.has('*:*')) return true;

    return false;
  }
}

// 使用示例
// controllers/article.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('articles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ArticleController {
  @Get()
  @RequirePermissions('article:read')
  findAll() {
    // 获取文章列表
  }

  @Post()
  @RequirePermissions('article:create')
  create(@Body() createArticleDto: CreateArticleDto) {
    // 创建文章
  }

  @Put(':id')
  @RequirePermissions('article:update')
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    // 更新文章
  }

  @Delete(':id')
  @RequirePermissions('article:delete')
  remove(@Param('id') id: string) {
    // 删除文章
  }

  @Post(':id/publish')
  @RequirePermissions('article:publish')
  publish(@Param('id') id: string) {
    // 发布文章
  }
}
```

## 前端权限控制

前端权限控制主要包括路由控制、UI 元素控制和 API 请求拦截。

### React 权限组件

```tsx
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 从本地存储恢复用户信息
    const token = localStorage.getItem('token');
    if (token) {
      loadUserInfo(token);
    }
  }, []);

  const loadUserInfo = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('加载用户信息失败', error);
      localStorage.removeItem('token');
    }
  };

  const matchPermission = (userPermissions: string[], required: string): boolean => {
    if (userPermissions.includes(required)) return true;

    const [resource, action] = required.split(':');
    if (userPermissions.includes(`${resource}:*`)) return true;
    if (userPermissions.includes(`*:${action}`)) return true;
    if (userPermissions.includes('*:*')) return true;

    return false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return matchPermission(user.permissions, permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    await loadUserInfo(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      hasPermission,
      hasRole,
      hasAnyPermission,
      hasAllPermissions,
      login,
      logout
    }}>
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

// components/PermissionGate.tsx
interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  roles?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  fallback = null,
  children
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();

  let hasAccess = true;

  // 检查单个权限
  if (permission) {
    hasAccess = hasAccess && hasPermission(permission);
  }

  // 检查多个权限
  if (permissions && permissions.length > 0) {
    hasAccess = hasAccess && (requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions));
  }

  // 检查角色
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  if (roles && roles.length > 0) {
    hasAccess = hasAccess && roles.some(r => hasRole(r));
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// 使用示例
function ArticleManagement() {
  return (
    <div>
      <h1>文章管理</h1>

      <PermissionGate permission="article:create">
        <button>新建文章</button>
      </PermissionGate>

      <PermissionGate
        permissions={['article:update', 'article:delete']}
        requireAll={true}
      >
        <button>批量操作</button>
      </PermissionGate>

      <PermissionGate
        permission="article:publish"
        fallback={<span>您没有发布权限</span>}
      >
        <button>发布文章</button>
      </PermissionGate>
    </div>
  );
}
```

### 路由权限控制

```tsx
// routes/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  let hasAccess = true;

  if (permission) {
    hasAccess = hasAccess && hasPermission(permission);
  }

  if (permissions && permissions.length > 0) {
    hasAccess = hasAccess && (requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions));
  }

  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

// routes/index.tsx
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* 需要登录 */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      {/* 需要特定权限 */}
      <Route path="/articles" element={
        <ProtectedRoute permission="article:read">
          <ArticleListPage />
        </ProtectedRoute>
      } />

      <Route path="/articles/new" element={
        <ProtectedRoute permission="article:create">
          <ArticleCreatePage />
        </ProtectedRoute>
      } />

      {/* 需要管理员角色 */}
      <Route path="/admin/*" element={
        <ProtectedRoute role="admin">
          <AdminRoutes />
        </ProtectedRoute>
      } />

      {/* 需要多个权限 */}
      <Route path="/settings" element={
        <ProtectedRoute
          permissions={['system:config', 'user:manage']}
          requireAll={true}
        >
          <SettingsPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

### 动态菜单渲染

```tsx
// components/SideMenu.tsx
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  permission?: string;
  permissions?: string[];
  children?: MenuItem[];
}

const menuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    path: '/dashboard',
    icon: <DashboardIcon />
  },
  {
    key: 'content',
    label: '内容管理',
    icon: <ContentIcon />,
    children: [
      {
        key: 'articles',
        label: '文章管理',
        path: '/articles',
        permission: 'article:read'
      },
      {
        key: 'categories',
        label: '分类管理',
        path: '/categories',
        permission: 'category:read'
      }
    ]
  },
  {
    key: 'users',
    label: '用户管理',
    path: '/users',
    icon: <UserIcon />,
    permission: 'user:read'
  },
  {
    key: 'system',
    label: '系统设置',
    icon: <SettingsIcon />,
    permissions: ['system:config'],
    children: [
      {
        key: 'roles',
        label: '角色管理',
        path: '/system/roles',
        permission: 'role:read'
      },
      {
        key: 'permissions',
        label: '权限管理',
        path: '/system/permissions',
        permission: 'permission:read'
      }
    ]
  }
];

function SideMenu() {
  const { hasPermission, hasAnyPermission } = useAuth();

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // 检查权限
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }
      if (item.permissions && !hasAnyPermission(item.permissions)) {
        return false;
      }

      // 递归过滤子菜单
      if (item.children) {
        item.children = filterMenuItems(item.children);
        // 如果所有子菜单都被过滤掉了，隐藏父菜单
        if (item.children.length === 0) {
          return false;
        }
      }

      return true;
    });
  };

  const visibleMenuItems = filterMenuItems([...menuConfig]);

  return (
    <nav className="side-menu">
      {visibleMenuItems.map(item => (
        <MenuItemComponent key={item.key} item={item} />
      ))}
    </nav>
  );
}
```

## 与认证系统集成

RBAC 通常需要与认证系统紧密集成，JWT 是最常见的认证方案。

### JWT 中包含角色和权限

```typescript
// services/auth.service.ts
import jwt from 'jsonwebtoken';
import { PermissionRepository } from '../repository/permission.repository';
import { UserRepository } from '../repository/user.repository';

interface JWTPayload {
  sub: number;      // 用户 ID
  username: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

class AuthService {
  constructor(
    private userRepo: UserRepository,
    private permissionRepo: PermissionRepository,
    private jwtSecret: string
  ) {}

  async login(username: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 验证用户凭据
    const user = await this.userRepo.findByUsername(username);
    if (!user || !await this.verifyPassword(password, user.passwordHash)) {
      throw new Error('用户名或密码错误');
    }

    // 获取用户角色和权限
    const roles = await this.userRepo.getUserRoles(user.id);
    const permissions = await this.permissionRepo.getUserPermissions(user.id);

    // 生成 JWT
    const accessToken = this.generateAccessToken({
      sub: user.id,
      username: user.username,
      roles: roles.map(r => r.code),
      permissions: permissions.map(p => p.code)
    });

    const refreshToken = this.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  private generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m' // Access Token 有效期较短
    });
  }

  private generateRefreshToken(userId: number): string {
    return jwt.sign(
      { sub: userId, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as { sub: number; type: string };

      if (decoded.type !== 'refresh') {
        throw new Error('无效的刷新令牌');
      }

      // 重新获取用户信息和权限（权限可能已更新）
      const user = await this.userRepo.findById(decoded.sub);
      if (!user) {
        throw new Error('用户不存在');
      }

      const roles = await this.userRepo.getUserRoles(user.id);
      const permissions = await this.permissionRepo.getUserPermissions(user.id);

      return this.generateAccessToken({
        sub: user.id,
        username: user.username,
        roles: roles.map(r => r.code),
        permissions: permissions.map(p => p.code)
      });
    } catch (error) {
      throw new Error('刷新令牌无效或已过期');
    }
  }

  verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.jwtSecret) as JWTPayload;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }
}
```

### 权限变更实时生效

```typescript
// services/permission-invalidation.service.ts
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

class PermissionInvalidationService {
  private redis: Redis;
  private pubsub: Redis;
  private eventEmitter: EventEmitter;
  private invalidatedUsers: Set<number> = new Set();

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.pubsub = new Redis(redisUrl);
    this.eventEmitter = new EventEmitter();

    // 订阅权限变更频道
    this.pubsub.subscribe('permission:invalidate');
    this.pubsub.on('message', (channel, message) => {
      if (channel === 'permission:invalidate') {
        const { userId } = JSON.parse(message);
        this.invalidatedUsers.add(userId);
        this.eventEmitter.emit('invalidate', userId);
      }
    });
  }

  // 当用户权限变更时调用
  async invalidateUserPermissions(userId: number): Promise<void> {
    // 清除缓存
    await this.redis.del(`user:permissions:${userId}`);

    // 发布失效消息
    await this.redis.publish('permission:invalidate', JSON.stringify({ userId }));
  }

  // 检查用户权限是否已失效（需要重新获取）
  isPermissionInvalidated(userId: number): boolean {
    return this.invalidatedUsers.has(userId);
  }

  // 确认已重新获取权限
  acknowledgeInvalidation(userId: number): void {
    this.invalidatedUsers.delete(userId);
  }

  // 监听权限失效事件
  onInvalidate(callback: (userId: number) => void): void {
    this.eventEmitter.on('invalidate', callback);
  }
}

// 中间件：检查权限是否需要刷新
export function checkPermissionValidity(invalidationService: PermissionInvalidationService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next();

    if (invalidationService.isPermissionInvalidated(req.user.id)) {
      // 告知客户端需要刷新 Token
      res.setHeader('X-Permission-Refresh-Required', 'true');

      // 或者直接返回 401 要求重新认证
      // return res.status(401).json({
      //   error: 'PermissionChanged',
      //   message: '您的权限已变更，请重新登录'
      // });
    }

    next();
  };
}
```

## 最佳实践

### 设计原则

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RBAC 设计最佳实践                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 最小权限原则                                                             │
│     └── 只授予完成工作所需的最小权限集                                        │
│                                                                             │
│  2. 职责分离                                                                 │
│     └── 敏感操作需要多人配合完成                                              │
│                                                                             │
│  3. 默认拒绝                                                                 │
│     └── 未明确授权的操作默认拒绝                                              │
│                                                                             │
│  4. 权限粒度适中                                                             │
│     └── 太粗缺乏灵活性，太细难以管理                                          │
│                                                                             │
│  5. 角色设计贴合业务                                                         │
│     └── 角色应反映实际业务职能                                                │
│                                                                             │
│  6. 定期审计                                                                 │
│     └── 定期检查权限分配是否合理                                              │
│                                                                             │
│  7. 权限继承要谨慎                                                           │
│     └── 避免过深的继承层次                                                    │
│                                                                             │
│  8. 前后端双重验证                                                           │
│     └── 前端控制体验，后端保证安全                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 权限命名规范

```typescript
// 推荐的权限命名规范
const permissionNamingConvention = {
  // 格式: resource:action
  // resource: 资源名称，使用名词单数形式
  // action: 操作动词

  // 基础 CRUD 操作
  'user:create': '创建用户',
  'user:read': '查看用户',
  'user:update': '更新用户',
  'user:delete': '删除用户',
  'user:list': '查看用户列表',

  // 特定业务操作
  'article:publish': '发布文章',
  'article:archive': '归档文章',
  'order:approve': '审批订单',
  'order:cancel': '取消订单',

  // 批量操作
  'user:batch-delete': '批量删除用户',
  'article:batch-publish': '批量发布文章',

  // 导入导出
  'user:export': '导出用户数据',
  'user:import': '导入用户数据',

  // 管理操作
  'user:assign-role': '分配用户角色',
  'role:assign-permission': '分配角色权限',

  // 系统级操作
  'system:config': '系统配置',
  'system:audit-log': '查看审计日志',
  'system:backup': '系统备份'
};
```

### 性能优化建议

```typescript
// 性能优化示例
class OptimizedPermissionService {
  private redis: Redis;
  private localCache: Map<number, { permissions: Set<string>; timestamp: number }>;
  private localCacheTTL = 60 * 1000; // 本地缓存 1 分钟

  constructor(redis: Redis) {
    this.redis = redis;
    this.localCache = new Map();
  }

  async getUserPermissions(userId: number): Promise<Set<string>> {
    // 1. 先检查本地缓存
    const localCached = this.localCache.get(userId);
    if (localCached && Date.now() - localCached.timestamp < this.localCacheTTL) {
      return localCached.permissions;
    }

    // 2. 检查 Redis 缓存
    const redisCached = await this.redis.smembers(`user:permissions:${userId}`);
    if (redisCached.length > 0) {
      const permissions = new Set(redisCached);
      this.localCache.set(userId, { permissions, timestamp: Date.now() });
      return permissions;
    }

    // 3. 从数据库加载
    const permissions = await this.loadPermissionsFromDB(userId);

    // 4. 写入 Redis 缓存
    if (permissions.size > 0) {
      await this.redis.sadd(`user:permissions:${userId}`, ...permissions);
      await this.redis.expire(`user:permissions:${userId}`, 300); // 5 分钟过期
    }

    // 5. 写入本地缓存
    this.localCache.set(userId, { permissions, timestamp: Date.now() });

    return permissions;
  }

  private async loadPermissionsFromDB(userId: number): Promise<Set<string>> {
    // 实际数据库查询逻辑
    return new Set();
  }

  // 权限检查时使用位运算优化（适用于权限数量固定的场景）
  checkPermissionBitwise(userPermissionBits: bigint, requiredPermissionBit: bigint): boolean {
    return (userPermissionBits & requiredPermissionBit) === requiredPermissionBit;
  }
}
```

## 面试要点

### 常见面试题

**Q1: RBAC 相比 ACL 有什么优势？**

```
答：RBAC 的主要优势包括：
1. 简化管理：通过角色批量管理权限，而非为每个用户单独设置
2. 贴合业务：角色对应实际业务职能，更易理解
3. 减少错误：减少直接操作权限的机会，降低配置错误风险
4. 易于审计：可以按角色审计权限分配情况
5. 扩展性好：新增用户只需分配角色，无需逐个配置权限
```

**Q2: 如何处理权限的实时生效？**

```
答：有几种策略：
1. 短期 Token + 刷新机制：Access Token 有效期短（如 15 分钟），
   权限变更后最多等待 Token 过期即可生效
2. 服务端缓存失效：权限变更时主动清除缓存，下次请求重新加载
3. WebSocket 推送：通过 WebSocket 通知客户端权限已变更
4. Token 黑名单：将旧 Token 加入黑名单，强制重新认证
```

**Q3: 如何实现数据级别的权限控制？**

```
答：数据级权限控制通常需要结合 RBAC 和其他机制：
1. 所有权检查：验证当前用户是否为数据所有者
2. 部门/组织隔离：用户只能访问本部门的数据
3. 数据标签：为数据打标签，按标签控制访问
4. 行级安全策略：数据库层面实现（如 PostgreSQL RLS）
5. 动态 SQL 过滤：根据用户权限动态添加查询条件
```

**Q4: 如何设计一个支持多租户的 RBAC 系统？**

```
答：多租户 RBAC 设计要点：
1. 租户隔离：每个租户有独立的角色和权限定义
2. 系统角色 vs 租户角色：区分平台级角色和租户级角色
3. 数据模型：在角色表和权限表中增加 tenant_id 字段
4. 跨租户访问：特殊场景下允许超级管理员跨租户操作
5. 权限继承：支持从平台默认角色继承到租户角色
```

**Q5: 前端权限控制的意义是什么？**

```
答：前端权限控制的主要目的：
1. 用户体验：隐藏无权操作的元素，避免用户困惑
2. 减少无效请求：提前拦截无权限的操作请求
3. 界面简洁：根据权限展示相关功能，减少界面复杂度

但必须注意：
- 前端权限仅用于优化体验，不能作为安全保障
- 后端必须进行权限验证，前端控制可以被绕过
- 敏感操作必须在后端再次验证
```

### 系统设计题示例

**题目：设计一个企业级权限管理系统**

```
需求分析：
1. 支持多租户
2. 支持组织架构（部门层级）
3. 支持数据权限（只能看本部门数据）
4. 支持审批流程（敏感操作需要审批）
5. 支持权限审计
6. 高性能（QPS > 10000）

设计方案：

1. 权限模型
   - RBAC + ABAC 混合模型
   - RBAC 处理功能权限
   - ABAC 处理数据权限

2. 核心表设计
   - tenants（租户）
   - organizations（组织架构）
   - users（用户）
   - roles（角色）
   - permissions（权限）
   - user_roles（用户角色关联）
   - role_permissions（角色权限关联）
   - data_scopes（数据权限范围）
   - audit_logs（审计日志）

3. 性能优化
   - 多级缓存（本地缓存 + Redis）
   - 权限预计算（登录时计算所有权限）
   - 读写分离（主库写入，从库查询）
   - 异步审计日志写入

4. 高可用设计
   - Redis 集群缓存权限数据
   - 数据库主从复制
   - 权限服务多实例部署
   - 降级策略（缓存失效时直接查库）
```

## 总结

RBAC 是构建企业级应用权限系统的基础模型，其核心优势在于通过角色这一抽象层，实现了用户与权限的解耦。在实际应用中，我们通常会根据业务需求，将 RBAC 与其他访问控制模型（如 ABAC）结合使用，以满足更复杂的权限控制需求。

关键要点回顾：

1. **选择合适的模型**：根据业务复杂度选择 RBAC0-RBAC3 或混合模型
2. **权限粒度设计**：在灵活性和可管理性之间找到平衡
3. **性能优化**：合理使用缓存，避免频繁的数据库查询
4. **安全性**：前后端双重验证，后端验证是安全的最后防线
5. **可审计性**：记录所有权限变更操作，便于追溯和合规
6. **可扩展性**：预留扩展点，支持未来业务发展

掌握 RBAC 不仅是技术能力的体现，更是理解企业级应用安全架构的重要一环。希望本文能帮助你深入理解 RBAC 的设计理念和实现方法，在实际项目中构建安全可靠的权限系统。
