---
title: TypeScript Progressive Migration Strategy
description: "A comprehensive guide to migrating JavaScript projects to TypeScript incrementally: planning strategies, configuration setup, type coverage improvement, and best practices for large-scale migrations"
track: typescript
section: config-migration
difficulty: intermediate
tags:
  - TypeScript
  - Migration
  - JavaScript
  - Refactoring
  - Type Safety
  - Legacy Code
status: imported
origin: old/src/content/docs/typescript/progressive-migration.en.md
divergence: 0.235
issues: []
legacy:
  category: TypeScript
  subcategory: Migration
  order: 20
  lastUpdated: 2026-01-22
---

Migrating a JavaScript codebase to TypeScript is a significant undertaking that requires careful planning and execution. A progressive migration strategy allows teams to adopt TypeScript incrementally, minimizing disruption while gradually improving type safety. This article explores proven strategies, tools, and best practices for successfully migrating JavaScript projects to TypeScript.

## Concept Explanation

### What is Progressive Migration?

Progressive migration is an incremental approach to converting a JavaScript codebase to TypeScript. Instead of rewriting the entire codebase at once (a "big bang" migration), you gradually introduce TypeScript file by file, module by module, while keeping the application functional throughout the process.

```
JavaScript Codebase (100%)
         ↓
    Phase 1: Setup & Configuration
         ↓
    Phase 2: Core Utilities (20% TS)
         ↓
    Phase 3: Shared Components (50% TS)
         ↓
    Phase 4: Feature Modules (80% TS)
         ↓
    Phase 5: Strict Mode & Cleanup (100% TS)
         ↓
TypeScript Codebase (100%)
```

### Why Progressive Migration?

| Approach | Pros | Cons |
|----------|------|------|
| Big Bang | Complete type safety immediately | High risk, blocks development |
| Progressive | Lower risk, continuous delivery | Mixed codebase temporarily |

Progressive migration offers several advantages:

1. **Reduced Risk**: Changes are incremental and reversible
2. **Continuous Delivery**: The application remains deployable throughout
3. **Learning Curve**: Team members can learn TypeScript gradually
4. **Immediate Benefits**: Start gaining type safety benefits early
5. **Manageable Scope**: Each phase has clear, achievable goals

### Migration Prerequisites

Before starting a migration, assess your project's readiness:

```typescript
// Migration readiness checklist
interface MigrationReadiness {
  // Build system
  buildToolSupportsTS: boolean;      // Webpack, Vite, etc.
  canConfigureTSLoader: boolean;     // ts-loader, esbuild, etc.

  // Testing
  testsExist: boolean;               // Unit/integration tests
  testCoverage: number;              // Percentage of code covered

  // Team
  teamTSExperience: "none" | "some" | "experienced";
  trainingPlanned: boolean;

  // Codebase
  codebaseSize: "small" | "medium" | "large";
  hasTypeDependencies: boolean;      // @types/* packages available
  documentationExists: boolean;
}
```

## Core Principles

### The Migration Pyramid

Effective migration follows a bottom-up approach, starting with foundational code:

```
                    ┌─────────────┐
                    │   Pages/    │  ← Migrate Last
                    │   Routes    │
                 ┌──┴─────────────┴──┐
                 │    Components     │
              ┌──┴───────────────────┴──┐
              │    Services/Hooks       │
           ┌──┴─────────────────────────┴──┐
           │      Utilities/Helpers        │
        ┌──┴───────────────────────────────┴──┐
        │         Types/Interfaces            │  ← Migrate First
        └─────────────────────────────────────┘
```

### Type Safety Spectrum

Migration involves moving along the type safety spectrum:

```typescript
// Level 0: Pure JavaScript
function processData(data) {
  return data.map(item => item.value * 2);
}

// Level 1: JSDoc annotations
/**
 * @param {Array<{value: number}>} data
 * @returns {number[]}
 */
function processData(data) {
  return data.map(item => item.value * 2);
}

// Level 2: TypeScript with implicit any
function processData(data: any): any {
  return data.map((item: any) => item.value * 2);
}

// Level 3: TypeScript with loose types
interface DataItem {
  value: number;
  [key: string]: any;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value * 2);
}

// Level 4: TypeScript with strict types
interface DataItem {
  readonly id: string;
  value: number;
  metadata?: Record<string, unknown>;
}

function processData(data: readonly DataItem[]): number[] {
  return data.map(item => item.value * 2);
}
```

### Compatibility Layers

During migration, you'll need to maintain compatibility between JS and TS code:

```typescript
// types/legacy.d.ts - Type declarations for JavaScript modules
declare module "legacy-module" {
  export function legacyFunction(input: unknown): unknown;
  export const legacyConfig: Record<string, any>;
}

// Wrapper for type-safe usage
// utils/legacyWrapper.ts
import { legacyFunction } from "legacy-module";

interface TypedInput {
  id: string;
  data: number[];
}

interface TypedOutput {
  result: string;
  success: boolean;
}

export function typedLegacyFunction(input: TypedInput): TypedOutput {
  const result = legacyFunction(input);

  // Runtime validation
  if (
    typeof result === "object" &&
    result !== null &&
    "result" in result &&
    "success" in result
  ) {
    return result as TypedOutput;
  }

  throw new Error("Unexpected legacy function output");
}
```

## Key Points

### Phase 1: Project Setup

#### Initial TypeScript Configuration

Start with a permissive configuration that allows JavaScript files:

```json
// tsconfig.json - Initial migration configuration
{
  "compilerOptions": {
    // Allow JavaScript files
    "allowJs": true,
    "checkJs": false,

    // Loose type checking initially
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,

    // Module settings
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,

    // Output settings
    "target": "ES2020",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,

    // Source maps for debugging
    "sourceMap": true,

    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Directory Structure

Organize your project for migration:

```
src/
├── types/              # Shared type definitions
│   ├── index.ts
│   ├── api.ts
│   └── models.ts
├── utils/              # Migrate first (pure functions)
│   ├── helpers.ts      # Converted to TS
│   └── legacy.js       # Not yet converted
├── services/           # API and business logic
│   ├── api.ts
│   └── auth.js
├── components/         # UI components
│   ├── Button.tsx
│   └── Form.jsx
└── pages/              # Migrate last
    ├── Home.tsx
    └── Dashboard.jsx
```

### Phase 2: Type Foundation

#### Creating Shared Types

Define core types that will be used across the codebase:

```typescript
// src/types/models.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "admin" | "editor" | "viewer";

export interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// src/types/api.ts
export interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig;
export type ResponseInterceptor<T> = (response: T) => T;
```

#### JSDoc as a Bridge

Use JSDoc to add types to JavaScript files before conversion:

```javascript
// src/utils/validation.js

/**
 * @typedef {Object} ValidationRule
 * @property {string} field
 * @property {(value: unknown) => boolean} validate
 * @property {string} message
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * Validates data against a set of rules
 * @param {Record<string, unknown>} data - Data to validate
 * @param {ValidationRule[]} rules - Validation rules
 * @returns {ValidationResult}
 */
export function validateData(data, rules) {
  const errors = [];

  for (const rule of rules) {
    const value = data[rule.field];
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Phase 3: Gradual File Conversion

#### Converting JavaScript to TypeScript

Follow this process for each file:

```typescript
// Step 1: Rename .js to .ts (or .jsx to .tsx)
// Step 2: Add type imports and basic annotations

// Before: utils/formatters.js
export function formatCurrency(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency
  }).format(amount);
}

export function formatDate(date, format) {
  // Implementation
}

// After: utils/formatters.ts
type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY";
type DateFormat = "short" | "medium" | "long" | "full";

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}

export function formatDate(
  date: Date | string | number,
  format: DateFormat = "medium"
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  }[format];

  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}
```

#### Handling Third-Party Libraries

```typescript
// Option 1: Install @types package
// npm install --save-dev @types/lodash

import { debounce } from "lodash";  // Types automatically available

// Option 2: Create local declarations
// src/types/vendors.d.ts
declare module "untyped-library" {
  export function doSomething(input: string): Promise<void>;
  export interface LibConfig {
    timeout: number;
    retries: number;
  }
}

// Option 3: Use any for quick migration (not recommended long-term)
// @ts-ignore
import { unknownFunction } from "problematic-library";
```

### Phase 4: Incremental Strictness

#### Progressive tsconfig Strictness

Create multiple configs for different phases:

```json
// tsconfig.base.json - Shared settings
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  }
}

// tsconfig.json - Current development config
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noImplicitAny": true,  // Enable one at a time
    "strictNullChecks": false
  },
  "include": ["src/**/*"]
}

// tsconfig.strict.json - Target configuration
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "allowJs": false,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"]
}
```

#### Per-File Strict Mode

Use comments to enable stricter checking in specific files:

```typescript
// src/utils/critical.ts
// @ts-strict - Enable strict mode for this file only (proposed feature)

// Alternative: Use eslint for per-file rules
/* eslint-disable @typescript-eslint/no-explicit-any */

// Or create separate directory with stricter config
// src/strict/
// tsconfig.json with strict: true
```

### Phase 5: Dealing with Legacy Code

#### Type Assertions and Guards

```typescript
// For data from external sources
interface UserData {
  id: string;
  name: string;
  email: string;
}

function isUserData(value: unknown): value is UserData {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as UserData).id === "string" &&
    typeof (value as UserData).name === "string" &&
    typeof (value as UserData).email === "string"
  );
}

// Usage with legacy API
async function fetchUser(id: string): Promise<UserData> {
  const response = await legacyApi.get(`/users/${id}`);
  const data: unknown = response.data;

  if (isUserData(data)) {
    return data;
  }

  throw new Error("Invalid user data format");
}

// For legacy module integration
import { legacyProcess } from "./legacy";

interface ProcessResult {
  success: boolean;
  output: string;
}

function processWithTypes(input: string): ProcessResult {
  // Legacy function returns unknown shape
  const result = legacyProcess(input) as Record<string, unknown>;

  return {
    success: Boolean(result.success),
    output: String(result.output ?? "")
  };
}
```

#### Migration Utilities

```typescript
// src/utils/migration.ts

/**
 * Safely access nested properties in untyped objects
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue: T
): T {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return (current as T) ?? defaultValue;
}

/**
 * Assert that a value is not null or undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "Value is null or undefined");
  }
}

/**
 * Convert unknown to a specific type with validation
 */
export function coerce<T>(
  value: unknown,
  validator: (v: unknown) => v is T,
  errorMessage: string
): T {
  if (validator(value)) {
    return value;
  }
  throw new TypeError(errorMessage);
}

// Usage
const config = safeGet(legacyConfig, "database.connection.host", "localhost");
assertDefined(user, "User must be logged in");
const validatedData = coerce(input, isUserData, "Invalid user data");
```

## Code Examples

### Complete Migration Example: API Service

```javascript
// Before: services/api.js
import axios from "axios";

const instance = axios.create({
  baseURL: process.env.API_URL,
  timeout: 10000
});

export async function get(url, params) {
  const response = await instance.get(url, { params });
  return response.data;
}

export async function post(url, data) {
  const response = await instance.post(url, data);
  return response.data;
}

export async function handleApiError(error) {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data.message || "Unknown error"
    };
  }
  return {
    status: 500,
    message: error.message
  };
}
```

```typescript
// After: services/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig
} from "axios";

// Types
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiErrorResponse };

// Implementation
class ApiService {
  private instance: AxiosInstance;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 10000,
      headers: config.headers
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  async get<T>(
    url: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResult<T>> {
    try {
      const response = await this.instance.get<T>(url, { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  async post<T, D = unknown>(
    url: string,
    data?: D
  ): Promise<ApiResult<T>> {
    try {
      const response = await this.instance.post<T>(url, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  async put<T, D = unknown>(
    url: string,
    data?: D
  ): Promise<ApiResult<T>> {
    try {
      const response = await this.instance.put<T>(url, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  async delete<T>(url: string): Promise<ApiResult<T>> {
    try {
      const response = await this.instance.delete<T>(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  private handleError(error: unknown): ApiErrorResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; code?: string }>;

      if (axiosError.response) {
        return {
          status: axiosError.response.status,
          code: axiosError.response.data?.code ?? "UNKNOWN_ERROR",
          message: axiosError.response.data?.message ?? "An error occurred"
        };
      }

      if (axiosError.request) {
        return {
          status: 0,
          code: "NETWORK_ERROR",
          message: "Network error - please check your connection"
        };
      }
    }

    return {
      status: 500,
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Export singleton instance
export const api = new ApiService({
  baseURL: process.env.API_URL ?? "http://localhost:3000"
});

// Export class for custom instances
export { ApiService };
```

### React Component Migration

```jsx
// Before: components/UserCard.jsx
import React, { useState, useEffect } from "react";

export function UserCard({ user, onEdit, onDelete, showActions }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    setIsLoading(true);
    await onEdit(user.id);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure?")) {
      setIsLoading(true);
      await onDelete(user.id);
      setIsLoading(false);
    }
  };

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {showActions && (
        <div className="actions">
          <button onClick={handleEdit} disabled={isLoading}>
            Edit
          </button>
          <button onClick={handleDelete} disabled={isLoading}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
```

```tsx
// After: components/UserCard.tsx
import React, { useState, useCallback } from "react";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "user";
}

export interface UserCardProps {
  user: User;
  onEdit?: (userId: string) => Promise<void>;
  onDelete?: (userId: string) => Promise<void>;
  showActions?: boolean;
  className?: string;
}

// Component
export function UserCard({
  user,
  onEdit,
  onDelete,
  showActions = true,
  className = ""
}: UserCardProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = useCallback(async (): Promise<void> => {
    if (!onEdit) return;

    setIsLoading(true);
    setError(null);

    try {
      await onEdit(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit user");
    } finally {
      setIsLoading(false);
    }
  }, [onEdit, user.id]);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      await onDelete(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  }, [onDelete, user.id, user.name]);

  return (
    <div className={`user-card ${className}`.trim()}>
      <img
        src={user.avatar}
        alt={`${user.name}'s avatar`}
        className="user-card__avatar"
      />
      <div className="user-card__info">
        <h3 className="user-card__name">{user.name}</h3>
        <p className="user-card__email">{user.email}</p>
        <span className="user-card__role">{user.role}</span>
      </div>

      {error && (
        <div className="user-card__error" role="alert">
          {error}
        </div>
      )}

      {showActions && (onEdit || onDelete) && (
        <div className="user-card__actions">
          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              disabled={isLoading}
              className="user-card__button user-card__button--edit"
            >
              {isLoading ? "Loading..." : "Edit"}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="user-card__button user-card__button--delete"
            >
              {isLoading ? "Loading..." : "Delete"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Default export for backward compatibility
export default UserCard;
```

## Best Practices

### Migration Planning

```typescript
// Create a migration tracking system
interface MigrationFile {
  path: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  assignee?: string;
  priority: "high" | "medium" | "low";
  dependencies: string[];
  notes?: string;
}

interface MigrationPlan {
  phase: number;
  name: string;
  description: string;
  files: MigrationFile[];
  startDate: Date;
  targetDate: Date;
}

// Example migration plan
const migrationPlan: MigrationPlan[] = [
  {
    phase: 1,
    name: "Foundation",
    description: "Set up TypeScript and create core types",
    files: [
      {
        path: "src/types/index.ts",
        status: "completed",
        priority: "high",
        dependencies: []
      },
      {
        path: "src/utils/helpers.ts",
        status: "in-progress",
        assignee: "developer1",
        priority: "high",
        dependencies: ["src/types/index.ts"]
      }
    ],
    startDate: new Date("2024-01-01"),
    targetDate: new Date("2024-01-15")
  }
];
```

### Maintain Type Coverage Reports

```bash
# Install type-coverage tool
npm install -g type-coverage

# Run coverage report
type-coverage --detail --strict

# Add to CI pipeline
# .github/workflows/type-check.yml
```

```yaml
# .github/workflows/type-check.yml
name: Type Check

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx type-coverage --at-least 80
```

### Document Migration Decisions

```typescript
// src/types/README.md or inline documentation

/**
 * Migration Decision Log
 *
 * 2024-01-15: Chose discriminated unions over class hierarchies for API responses
 * Reason: Better type narrowing, simpler serialization
 *
 * 2024-01-20: Using `unknown` instead of `any` for external data
 * Reason: Forces runtime validation, catches more errors
 *
 * 2024-02-01: Adopted branded types for IDs
 * Reason: Prevents mixing different ID types
 */

// Branded types implementation
type Brand<K, T> = K & { __brand: T };

type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;

function createUserId(id: string): UserId {
  return id as UserId;
}

function createPostId(id: string): PostId {
  return id as PostId;
}

// This prevents errors like:
// getUserById(postId) - TypeScript will catch this!
```

### Gradual Strictness Increase

```json
// Week 1-2: Start with allowJs
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false
  }
}

// Week 3-4: Enable noImplicitAny
{
  "compilerOptions": {
    "allowJs": true,
    "noImplicitAny": true
  }
}

// Week 5-6: Enable strictNullChecks
{
  "compilerOptions": {
    "allowJs": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// Week 7+: Enable remaining strict options
{
  "compilerOptions": {
    "allowJs": true,
    "strict": true
  }
}
```

## Common Pitfalls

### Overusing Type Assertions

```typescript
// BAD: Using assertions to silence errors
function processData(data: unknown) {
  const user = data as User;  // Dangerous!
  return user.name.toUpperCase();
}

// GOOD: Validate at runtime
function processData(data: unknown) {
  if (!isUser(data)) {
    throw new Error("Invalid user data");
  }
  return data.name.toUpperCase();
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as User).name === "string" &&
    typeof (value as User).email === "string"
  );
}
```

### Ignoring Implicit Any in Dependencies

```typescript
// BAD: Ignoring type errors from dependencies
// @ts-ignore
import { something } from "untyped-package";

// GOOD: Create proper declarations
// src/types/untyped-package.d.ts
declare module "untyped-package" {
  export function something(input: string): Promise<Result>;

  export interface Result {
    success: boolean;
    data: unknown;
  }
}
```

### Converting Too Many Files at Once

```typescript
// BAD: Converting entire directories at once
// This creates a flood of errors and blocks progress

// GOOD: Convert file by file with this checklist:
interface ConversionChecklist {
  steps: string[];
}

const conversionProcess: ConversionChecklist = {
  steps: [
    "1. Rename .js to .ts",
    "2. Add type imports",
    "3. Type function parameters",
    "4. Type function return values",
    "5. Type local variables where needed",
    "6. Fix any resulting errors",
    "7. Run tests",
    "8. Commit changes"
  ]
};
```

### Not Testing After Conversion

```typescript
// Always verify converted code works correctly

// Original JavaScript tests should still pass
describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
  });

  it("handles zero", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00");
  });
});

// Add TypeScript-specific tests
describe("formatCurrency types", () => {
  it("accepts valid currency codes", () => {
    // This test verifies the type system at compile time
    const result: string = formatCurrency(100, "EUR");
    expect(typeof result).toBe("string");
  });

  // TypeScript will catch this at compile time:
  // formatCurrency(100, "INVALID"); // Error!
});
```

## Performance Considerations

### Build Time Optimization

```json
// tsconfig.json optimizations for faster builds
{
  "compilerOptions": {
    // Skip type checking of declaration files
    "skipLibCheck": true,

    // Incremental compilation
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",

    // Use project references for large codebases
    "composite": true
  }
}
```

### Project References for Large Codebases

```json
// tsconfig.json (root)
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/api" },
    { "path": "./packages/ui" }
  ]
}

// packages/core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}

// packages/api/tsconfig.json
{
  "compilerOptions": {
    "composite": true
  },
  "references": [
    { "path": "../core" }
  ]
}
```

### Parallel Type Checking

```bash
# Use fork-ts-checker for parallel type checking during development
npm install --save-dev fork-ts-checker-webpack-plugin

# Or use tsc in watch mode with incremental
tsc --watch --incremental
```

## Practical Scenarios

### Scenario 1: E-commerce Platform Migration

```typescript
// Phase 1: Define core domain types
// src/types/ecommerce.ts

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: Money;
  inventory: InventoryStatus;
  categories: CategoryId[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export type CurrencyCode = "USD" | "EUR" | "GBP";

export interface InventoryStatus {
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
}

// Phase 2: Migrate cart service
// src/services/cart.ts

export interface CartItem {
  productId: string;
  quantity: number;
  price: Money;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId: string | null;  // null for guest carts
  items: CartItem[];
  subtotal: Money;
  discounts: Discount[];
  total: Money;
}

export class CartService {
  async addItem(
    cartId: string,
    productId: string,
    quantity: number
  ): Promise<Cart> {
    // Implementation
  }

  async removeItem(
    cartId: string,
    productId: string
  ): Promise<Cart> {
    // Implementation
  }

  calculateTotal(cart: Cart): Money {
    // Implementation
  }
}
```

### Scenario 2: Legacy API Client Migration

```typescript
// Wrap legacy API client with type-safe interface

// Original untyped client
// const legacyClient = require("./legacy-api-client");

// Type-safe wrapper
// src/services/typed-api-client.ts

interface LegacyApiResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

interface TypedUser {
  id: string;
  username: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

class TypedApiClient {
  private legacy: typeof legacyClient;

  constructor() {
    this.legacy = legacyClient;
  }

  async getUser(id: string): Promise<TypedUser> {
    const response: LegacyApiResponse = await this.legacy.get(`/users/${id}`);

    if (response.status !== 200) {
      throw new ApiError(response.status, "Failed to fetch user");
    }

    return this.validateUser(response.body);
  }

  private validateUser(data: unknown): TypedUser {
    // Runtime validation
    if (!this.isTypedUser(data)) {
      throw new ValidationError("Invalid user data format");
    }
    return data;
  }

  private isTypedUser(value: unknown): value is TypedUser {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const obj = value as Record<string, unknown>;

    return (
      typeof obj.id === "string" &&
      typeof obj.username === "string" &&
      typeof obj.email === "string" &&
      typeof obj.profile === "object" &&
      obj.profile !== null
    );
  }
}

export const apiClient = new TypedApiClient();
```

## Interview Key Points

### Q1: What is the recommended order for enabling strict mode options during migration?

**Key Points**:
- Start with `noImplicitAny` - forces explicit type annotations
- Then enable `strictNullChecks` - catches null reference errors
- Next add `strictFunctionTypes` - ensures callback type safety
- Finally enable `strictPropertyInitialization` - class property safety
- Use `strict: true` only when all individual options pass

### Q2: How do you handle third-party libraries without type definitions?

**Key Points**:
- Check DefinitelyTyped for `@types/*` packages
- Create local declaration files in `src/types/` or `@types/`
- Use `declare module` for module augmentation
- As last resort, use `// @ts-ignore` with TODO comments
- Consider contributing types back to DefinitelyTyped

### Q3: What strategies help maintain team velocity during migration?

**Key Points**:
- Establish clear migration phases with deadlines
- Allow `any` temporarily with lint rules to track usage
- Use type-coverage tools to measure progress
- Pair experienced TypeScript developers with beginners
- Create shared utilities for common migration patterns
- Don't block PRs on perfect types during initial phases

### Q4: How do you ensure type safety at runtime for external data?

**Key Points**:
- Use type guards for runtime validation
- Consider validation libraries like Zod, io-ts, or Yup
- Create factory functions that validate and return typed data
- Never trust `as` assertions for external data
- Implement error boundaries for type validation failures

### Q5: What are the signs that a migration is going well or poorly?

**Key Points**:
- Good signs: Type coverage increasing, fewer runtime errors, team confidence growing
- Bad signs: Excessive use of `any`, `@ts-ignore` comments everywhere, build times exploding
- Track metrics: type coverage percentage, `any` usage count, build time
- Regular retrospectives to adjust migration strategy

## Further Reading

- [TypeScript Official Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [Migrating Large TypeScript Codebases to Strict Mode](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [type-coverage Tool](https://github.com/nicholasserra/type-coverage)
- [Definitely Typed Repository](https://github.com/DefinitelyTyped/DefinitelyTyped)
- [TypeScript Deep Dive - Migration](https://basarat.gitbook.io/typescript/getting-started/migrating)
- [Airbnb's TypeScript Migration Journey](https://medium.com/airbnb-engineering/ts-migrate-a-tool-for-migrating-to-typescript-at-scale-cd23bfeb5cc)
- [ts-migrate: Automated Migration Tool](https://github.com/airbnb/ts-migrate)
