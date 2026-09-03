---
title: TypeScript Branded/Nominal Types
description: "Master TypeScript branded types: create distinct nominal types from primitives using type branding patterns"
track: typescript
section: type-system
difficulty: advanced
tags:
  - TypeScript
  - Branded Types
  - Nominal Types
  - Type Safety
  - Advanced Types
status: imported
origin: old/src/content/docs/typescript/branded-types.en.md
divergence: 0.346
issues:
  - order-mismatch
legacy:
  category: TypeScript
  subcategory: Type System
  order: 25
  lastUpdated: 2026-01-07
---

## Concept Explanation

TypeScript's type system is **structurally typed** by default, meaning two types are considered equivalent if they have the same structure, regardless of how they're declared. This is powerful for flexibility, but sometimes you need **nominal typing**—where types are distinct based on their declaration, not just their structure.

**Branded types** (also called **phantom types** or **opaque types**) are a pattern that adds a unique "brand" or "tag" to a type, making it distinct from structurally identical types. This creates a form of nominal typing in TypeScript's otherwise structural type system.

```typescript
// Structural typing: these are considered the same type
type UserId = number;
type ProductId = number;

const userId: UserId = 123;
const productId: ProductId = userId; // ✓ Allowed (not type safe!)

// Branded typing: these are distinct types
type UserId = number & { readonly __brand: "UserId" };
type ProductId = number & { readonly __brand: "ProductId" };

const userId: UserId = 123 as UserId;
const productId: ProductId = userId; // ✗ Type error (type safe!)
```

## Core Principles

### The Brand Property
A brand is an invisible property used only for type checking. The `readonly` modifier and `unique symbol` ensure the brand exists only at compile-time:

```typescript
type UserId = string & { readonly __brand: "UserId" };
```

### Structural Identity vs Nominal Identity
- **Structural**: Two types are equal if they have the same shape
- **Nominal**: Two types are equal only if they're explicitly the same type

Branded types simulate nominal typing by adding a unique marker:

```typescript
// Without brand (structural)
type Email1 = string;
type Email2 = string;
const e1: Email1 = "test@example.com";
const e2: Email2 = e1; // ✓ Allowed

// With brand (nominal-like)
type Email1 = string & { readonly __brand: "Email1" };
type Email2 = string & { readonly __brand: "Email2" };
const e1: Email1 = "test@example.com" as Email1;
const e2: Email2 = e1; // ✗ Type error
```

### Helper Functions for Creation
Since you can't directly assign a value to a branded type, create helper functions:

```typescript
type UserId = number & { readonly __brand: "UserId" };

function UserId(id: number): UserId {
  if (id <= 0) throw new Error("User ID must be positive");
  return id as UserId;
}

const validId = UserId(123); // ✓ Type is UserId
```

### Brand Uniqueness
Each brand name must be unique within your type system to prevent accidental type conflicts:

```typescript
// Good: descriptive, unique names
type ValidationToken = string & { readonly __brand: "ValidationToken" };
type JwtToken = string & { readonly __brand: "JwtToken" };
type RefreshToken = string & { readonly __brand: "RefreshToken" };

// Bad: generic names
type Token = string & { readonly __brand: "Token" };
type Token2 = string & { readonly __brand: "Token2" };
```

## Key Points

1. **Compile-time only**: Brands exist only in TypeScript's type system; they disappear at runtime
2. **No runtime overhead**: Branded types have zero performance cost—no wrapper objects or validation at runtime
3. **Prevents mixing**: Different brands can't be assigned to each other, preventing subtle bugs
4. **Self-documenting**: Brand names communicate intent and type requirements
5. **Combinable**: You can stack brands for multi-dimensional type safety
6. **Validation gap**: TypeScript can't enforce validation; you must implement it in helper functions
7. **Can be narrowed**: Use type guards to narrow union types containing brands
8. **Works with any base type**: Not limited to primitives; works with objects, arrays, etc.

## Code Examples

### Basic Branded Types

The most common use case is preventing primitive type mixups:

```typescript
// Define branded types
type UserId = number & { readonly __brand: "UserId" };
type ProductId = number & { readonly __brand: "ProductId" };
type Email = string & { readonly __brand: "Email" };

// Constructor functions
function UserId(id: number): UserId {
  if (id <= 0) throw new Error("User ID must be positive");
  return id as UserId;
}

function ProductId(id: number): ProductId {
  if (id <= 0) throw new Error("Product ID must be positive");
  return id as ProductId;
}

function Email(email: string): Email {
  if (!email.includes("@")) throw new Error("Invalid email");
  return email as Email;
}

// Usage
const userId = UserId(1);
const productId = ProductId(2);
const email = Email("user@example.com");

// Type safety: prevents accidental mixing
function getUser(id: UserId): void {
  console.log(`Fetching user ${id}`);
}

getUser(userId); // ✓ Correct type
getUser(productId); // ✗ Type error: ProductId is not UserId
getUser(123); // ✗ Type error: number is not UserId
```

### Symbol-based Brands

For even stronger isolation, use `unique symbol`:

```typescript
declare const UserIdBrand: unique symbol;
type UserId = number & { readonly [UserIdBrand]: "UserId" };

declare const ProductIdBrand: unique symbol;
type ProductId = number & { readonly [ProductIdBrand]: "ProductId" };

function UserId(id: number): UserId {
  return id as UserId;
}

function ProductId(id: number): ProductId {
  return id as ProductId;
}

// These are more strongly isolated than string brands
const userId = UserId(1);
const productId = ProductId(2);

function getUser(id: UserId): void {}
getUser(productId); // ✗ Type error (stronger guarantee)
```

### Branded Objects

Brands work beyond primitives:

```typescript
// Database record that's been validated
type ValidatedUser = {
  id: number;
  name: string;
  email: string;
} & { readonly __brand: "ValidatedUser" };

// Function that requires validated input
function saveUser(user: ValidatedUser): void {
  // Can safely save without additional validation
  database.insert(user);
}

// Constructor that performs validation
function ValidatedUser(user: {
  id: number;
  name: string;
  email: string;
}): ValidatedUser {
  if (user.id <= 0) throw new Error("Invalid ID");
  if (!user.name.trim()) throw new Error("Name required");
  if (!user.email.includes("@")) throw new Error("Invalid email");
  return user as ValidatedUser;
}

// Usage
const data = { id: 1, name: "Alice", email: "alice@example.com" };
const validatedUser = ValidatedUser(data); // Performs validation
saveUser(validatedUser); // Safe to use
```

### Branded Arrays and Tuples

```typescript
type NonEmptyArray<T> = Array<T> & { readonly __brand: "NonEmptyArray" };
type NonEmptyString = string & { readonly __brand: "NonEmptyString" };

function NonEmptyArray<T>(arr: Array<T>): NonEmptyArray<T> {
  if (arr.length === 0) throw new Error("Array must not be empty");
  return arr as NonEmptyArray<T>;
}

function NonEmptyString(str: string): NonEmptyString {
  if (str.length === 0) throw new Error("String must not be empty");
  return str as NonEmptyString;
}

// Usage
function getFirst<T>(arr: NonEmptyArray<T>): T {
  return arr[0]; // Safe because array is non-empty
}

const items = NonEmptyArray([1, 2, 3]);
const first = getFirst(items); // ✓ Type safe

const name = NonEmptyString("Alice");
console.log(name.toUpperCase()); // ✓ Can safely use string methods
```

### Multi-level Branding

Stack brands for cumulative type safety:

```typescript
// Progressive refinement through validation stages
type User = { id: number; name: string; email: string };

// Stage 1: Parsed from input
type ParsedUser = User & { readonly __brand: "ParsedUser" };

// Stage 2: Validated data
type ValidatedUser = ParsedUser & { readonly __brand: "ValidatedUser" };

// Stage 3: Ready to persist
type PersistedUser = ValidatedUser & { readonly __brand: "PersistedUser" };

function parseUser(input: unknown): ParsedUser {
  if (typeof input !== "object" || input === null) throw new Error("Invalid input");
  const obj = input as any;
  if (typeof obj.id !== "number" || typeof obj.name !== "string" || typeof obj.email !== "string") {
    throw new Error("Invalid structure");
  }
  return input as ParsedUser;
}

function validateUser(user: ParsedUser): ValidatedUser {
  if (user.id <= 0) throw new Error("Invalid ID");
  if (!user.name.trim()) throw new Error("Invalid name");
  if (!user.email.includes("@")) throw new Error("Invalid email");
  return user as ValidatedUser;
}

function persistUser(user: ValidatedUser): PersistedUser {
  const id = database.insert(user);
  return { ...user, id } as PersistedUser;
}

// Type-safe pipeline
const raw = JSON.parse(jsonString);
const parsed = parseUser(raw); // ParsedUser
const validated = validateUser(parsed); // ValidatedUser
const persisted = persistUser(validated); // PersistedUser
```

### Type Guards with Branded Types

```typescript
type AdminToken = string & { readonly __brand: "AdminToken" };
type UserToken = string & { readonly __brand: "UserToken" };
type Token = AdminToken | UserToken;

function isAdminToken(token: Token): token is AdminToken {
  // In reality, decode and check claims
  return token.startsWith("admin-");
}

function handleRequest(token: Token): void {
  if (isAdminToken(token)) {
    // token is AdminToken here
    performAdminAction(token);
  } else {
    // token is UserToken here
    performUserAction(token);
  }
}
```

### Branded Generics

Create flexible branded types:

```typescript
// Generic branded type factory
type Branded<T, Brand extends string> = T & {
  readonly __brand: Brand;
};

type UserId = Branded<number, "UserId">;
type ProductId = Branded<number, "ProductId">;
type Email = Branded<string, "Email">;

// Generic helper function
function create<T, B extends string>(
  value: T,
  brand: B,
  validator: (value: T) => boolean
): Branded<T, B> {
  if (!validator(value)) throw new Error(`Invalid ${brand}`);
  return value as Branded<T, B>;
}

const userId = create(123, "UserId", (id: number) => id > 0);
const email = create("user@example.com", "Email", (e: string) => e.includes("@"));
```

### Const Assertion Pattern

For simple cases without validation:

```typescript
const UserId = (id: number) => id as unknown as { __brand: "UserId" } & number;
const ProductId = (id: number) => id as unknown as { __brand: "ProductId" } & number;

// Usage
const userId = UserId(123);
const productId = ProductId(456);

function getUser(id: ReturnType<typeof UserId>): void {}
getUser(userId); // ✓
getUser(productId); // ✗ Type error
```

## Best Practices

### Use Descriptive Brand Names
```typescript
// Good
type ValidatedEmail = string & { readonly __brand: "ValidatedEmail" };
type JwtAccessToken = string & { readonly __brand: "JwtAccessToken" };

// Bad
type Email2 = string & { readonly __brand: "Email2" };
type Token123 = string & { readonly __brand: "Token123" };
```

### Create Constructor Functions
Always pair brands with constructor functions that validate:

```typescript
type UserId = number & { readonly __brand: "UserId" };

function UserId(id: number): UserId {
  if (id <= 0) throw new Error("User ID must be positive");
  return id as UserId;
}

// Not this:
const id = 123 as UserId; // Bypasses validation!
```

### Keep Validation in Constructor
Don't trust the brand to enforce constraints:

```typescript
// Good: validation in constructor
function UserId(id: number): UserId {
  if (typeof id !== "number" || id <= 0) {
    throw new Error("Invalid user ID");
  }
  return id as UserId;
}

// Bad: brand without validation
const userId = someUnvalidatedNumber as UserId;
```

### Use readonly Brand Properties
Prevents accidental mutation:

```typescript
// Good
type UserId = number & { readonly __brand: "UserId" };

// Bad (mutable, can cause issues)
type UserId = number & { __brand: "UserId" };
```

### Document Brand Purpose
```typescript
/**
 * A user ID that has been validated.
 * - Must be greater than 0
 * - Must correspond to an existing user
 * @example
 * const id = UserId(123); // Throws if invalid
 */
type UserId = number & { readonly __brand: "UserId" };
```

### Group Related Brands
```typescript
// ID brands
type UserId = number & { readonly __brand: "UserId" };
type ProductId = number & { readonly __brand: "ProductId" };
type OrderId = number & { readonly __brand: "OrderId" };

// Token brands
type JwtToken = string & { readonly __brand: "JwtToken" };
type RefreshToken = string & { readonly __brand: "RefreshToken" };
type ApiKey = string & { readonly __brand: "ApiKey" };
```

### Export Type and Constructor Together
```typescript
// module.ts
export type UserId = number & { readonly __brand: "UserId" };

export function UserId(id: number): UserId {
  if (id <= 0) throw new Error("Invalid user ID");
  return id as UserId;
}

// Consumers use both
import { UserId, type UserId as UserIdType } from "./module";
const id = UserId(123); // UserId function
const idType: UserIdType = id; // UserId type
```

### Use Symbol Brands for Critical Types
```typescript
// For security-sensitive types
declare const AdminBrand: unique symbol;
type AdminUser = User & { readonly [AdminBrand]: "AdminUser" };

declare const RegularBrand: unique symbol;
type RegularUser = User & { readonly [RegularBrand]: "RegularUser" };
```

## Common Pitfalls

### Pitfall 1: Forgetting to Use Constructor Functions

```typescript
// ❌ Wrong: Bypasses validation
const id: UserId = 123 as UserId;
const id2: UserId = unsafeGetId(); // May be invalid

// ✓ Right: Uses constructor
const id = UserId(123); // Validates
```

### Pitfall 2: Treating Brands as Values

```typescript
// ❌ Wrong: Brands don't exist at runtime
type UserId = number & { readonly __brand: "UserId" };
const id: UserId = 123 as UserId;
console.log(id.__brand); // undefined! Brands exist only in types

// ✓ Right: Use the branded value as-is
console.log(id); // 123
console.log(typeof id); // "number"
```

### Pitfall 3: Mixing Brand Patterns

```typescript
// ❌ Inconsistent: mixing different brand styles
type UserId = number & { readonly __brand: "UserId" };
type Email = string & { __brand: "Email" }; // Not readonly!

declare const TokenBrand: unique symbol;
type Token = string & { readonly [TokenBrand]: "Token" }; // Different pattern

// ✓ Consistent: one pattern throughout
type UserId = number & { readonly __brand: "UserId" };
type Email = string & { readonly __brand: "Email" };
type Token = string & { readonly __brand: "Token" };
```

### Pitfall 4: Brands Don't Prevent All Type Errors

```typescript
// ❌ Misunderstanding: TypeScript still allows some unsafe patterns
type UserId = number & { readonly __brand: "UserId" };
type ProductId = number & { readonly __brand: "ProductId" };

const userId: UserId = 123 as UserId;
const productId: ProductId = userId as any; // Bypasses with 'as any'

// ✓ Right: only use legitimate type assertions
```

### Pitfall 5: Over-branding

```typescript
// ❌ Too many brands creates maintenance overhead
type UserId = number & { readonly __brand: "UserId" };
type ValidatedUserId = number & { readonly __brand: "ValidatedUserId" };
type AdminUserId = number & { readonly __brand: "AdminUserId" };
type ActiveUserId = number & { readonly __brand: "ActiveUserId" };

// ✓ Right: group related concerns
type UserId = number & { readonly __brand: "UserId" }; // Implies validation
type AdminUserId = UserId & { readonly __brand: "AdminUserId" };
```

### Pitfall 6: Importing Wrong Brand

```typescript
// module-a.ts
export type UserId = number & { readonly __brand: "UserId" };

// module-b.ts
export type UserId = number & { readonly __brand: "UserId" };

// app.ts
import { UserId as AUserId } from "./module-a";
import { UserId as BUserId } from "./module-b";

const a: AUserId = 123 as AUserId;
const b: BUserId = a; // ✗ Type error (different modules, different brands)
```

### Pitfall 7: Validating Only at Entry Points

```typescript
// ❌ Wrong: validation only when creating
function getUser(id: number): User {
  // No validation here! Just casting
  return database.get(id as UserId);
}

// User might pass any number
const user = getUser(-1); // Validation missing!

// ✓ Right: validation in constructor
function UserId(id: number): UserId {
  if (id <= 0) throw new Error("Invalid");
  return id as UserId;
}

function getUser(id: UserId): User {
  return database.get(id);
}

const user = getUser(UserId(-1)); // Throws
```

## Performance Considerations

### Compile-time Impact

**Minimal**: Brands are resolved at compile-time and have zero runtime impact:

```typescript
// Compiled TypeScript
type UserId = number & { readonly __brand: "UserId" };
const id: UserId = 123 as UserId;

// Compiled JavaScript (brands disappear)
const id = 123; // That's it!
```

### Bundle Size

**Negligible**: Since brands are erased at compile-time, they add no bytes to your bundle:

```typescript
// TypeScript with brands
type Email = string & { readonly __brand: "Email" };
function sendEmail(to: Email) {}

// JavaScript output
function sendEmail(to) {}
// No brand metadata included!
```

### Runtime Validation Performance

The performance of constructor functions depends on validation logic:

```typescript
// Fast: minimal checks
function UserId(id: number): UserId {
  if (id <= 0) throw new Error("Invalid");
  return id as UserId;
}

// Slower: expensive validation
function Email(email: string): Email {
  // Complex regex, database lookup, etc.
  if (!expensiveValidationRegex.test(email)) throw new Error("Invalid");
  const exists = database.query(email); // Async operation?
  return email as Email;
}
```

### Optimization Tips

1. **Cache validated values** to avoid re-validation:
```typescript
const cachedEmail = Email(input); // Validate once
useEmail(cachedEmail); // Reuse validated value
useEmail(cachedEmail); // No re-validation needed
```

2. **Validate at boundaries** rather than everywhere:
```typescript
// Good: validate at entry
const userId = UserId(getUserIdFromRequest());
// Rest of code uses trusted UserId

// Bad: validate everywhere
function process(id: number) {
  const safe = UserId(id);
  // ...
}
```

3. **Use lightweight validation** in hot paths:
```typescript
// Hot path: fast check
function UserId(id: number): UserId {
  if (id <= 0) throw new Error("Invalid");
  return id as UserId;
}

// Not hot path: expensive checks OK
function ValidatedEmail(email: string): Email {
  // DNS lookup, deliverability check, etc.
}
```

### Type-checking Performance

Branded types have minimal impact on TypeScript compile times:

```typescript
// TypeScript must solve:
// 1. Is A assignable to B?
// 2. Do branded types match?

// This is simple structural comparison:
type UserId = number & { readonly __brand: "UserId" };
type ProductId = number & { readonly __brand: "ProductId" };

// TypeScript just checks: do both have the same __brand property?
// If not: type error (fast, simple check)
```

## Real-world Scenarios

### Scenario 1: User Authentication

```typescript
// Define branded authentication types
type SessionToken = string & { readonly __brand: "SessionToken" };
type RefreshToken = string & { readonly __brand: "RefreshToken" };
type UserId = number & { readonly __brand: "UserId" };

// Constructors with validation
function SessionToken(token: string): SessionToken {
  const decoded = jwt.verify(token, SESSION_SECRET);
  if (!decoded.userId) throw new Error("Invalid session token");
  return token as SessionToken;
}

function RefreshToken(token: string): RefreshToken {
  const decoded = jwt.verify(token, REFRESH_SECRET);
  if (!decoded.userId) throw new Error("Invalid refresh token");
  return token as RefreshToken;
}

function UserId(id: number): UserId {
  if (id <= 0) throw new Error("Invalid user ID");
  return id as UserId;
}

// Usage in routes
app.post("/api/protected", (req: Request) => {
  try {
    const token = SessionToken(req.headers.authorization || "");
    const userId = UserId(jwt.decode(token).userId);

    // Now we have validated tokens and IDs
    const user = database.getUser(userId);
    return response.json(user);
  } catch (error) {
    return response.status(401).json({ error: "Unauthorized" });
  }
});
```

### Scenario 2: E-commerce Order Processing

```typescript
// Stage-based branding
type Order = { id: number; items: OrderItem[]; total: number };
type UnvalidatedOrder = Order & { readonly __brand: "UnvalidatedOrder" };
type ValidatedOrder = Order & { readonly __brand: "ValidatedOrder" };
type PaidOrder = ValidatedOrder & { readonly __brand: "PaidOrder" };
type ShippedOrder = PaidOrder & { readonly __brand: "ShippedOrder" };

// Processing pipeline
function validateOrder(order: UnvalidatedOrder): ValidatedOrder {
  if (order.items.length === 0) throw new Error("No items");
  if (order.total <= 0) throw new Error("Invalid total");
  return order as ValidatedOrder;
}

function processPayment(order: ValidatedOrder): PaidOrder {
  const result = paymentGateway.charge(order.total);
  if (!result.success) throw new Error("Payment failed");
  return order as PaidOrder;
}

function shipOrder(order: PaidOrder): ShippedOrder {
  warehouse.createShipment(order.items);
  return order as ShippedOrder;
}

// Type-safe workflow
const rawOrder: UnvalidatedOrder = createOrderFromRequest() as UnvalidatedOrder;
const validated = validateOrder(rawOrder);
const paid = processPayment(validated);
const shipped = shipOrder(paid);
// shipped is ShippedOrder - guaranteed valid through entire pipeline
```

### Scenario 3: Database Models

```typescript
type UserId = number & { readonly __brand: "UserId" };
type Email = string & { readonly __brand: "Email" };

// Database-specific types
type DBUser = {
  id: UserId;
  email: Email;
  createdAt: Date;
  updatedAt: Date;
};

type ApiUser = Omit<DBUser, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

// Safe conversions
function dbUserToApi(user: DBUser): ApiUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function apiUserToDb(user: Partial<ApiUser>): DBUser {
  return {
    id: UserId(user.id || 0),
    email: Email(user.email || ""),
    createdAt: new Date(user.createdAt || 0),
    updatedAt: new Date(user.updatedAt || 0),
  };
}
```

### Scenario 4: API Client with Branded Responses

```typescript
type Endpoint = string & { readonly __brand: "Endpoint" };
type ApiKey = string & { readonly __brand: "ApiKey" };

const Endpoint = (path: string): Endpoint => {
  if (!path.startsWith("/")) throw new Error("Endpoint must start with /");
  return path as Endpoint;
};

const ApiKey = (key: string): ApiKey => {
  if (key.length < 32) throw new Error("Invalid API key");
  return key as ApiKey;
};

class ApiClient {
  constructor(private apiKey: ApiKey, private baseUrl: string) {}

  async request<T>(endpoint: Endpoint): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.json();
  }
}

// Usage: type-safe endpoints
const client = new ApiClient(
  ApiKey(process.env.API_KEY!),
  "https://api.example.com"
);

const users = await client.request<User[]>(Endpoint("/users"));
const products = await client.request<Product[]>(Endpoint("/products"));
```

## Interview Points

### Interview Question 1: Explain Branded Types

**Answer**: Branded types are a TypeScript pattern that adds a unique "brand" marker to a type, creating a form of nominal typing in TypeScript's structural type system. They prevent accidentally mixing similar types.

```typescript
type UserId = number & { readonly __brand: "UserId" };
type ProductId = number & { readonly __brand: "ProductId" };

// Without brands: both are just numbers, accidentally interchangeable
// With brands: UserId and ProductId are distinct, type error if mixed
```

### Interview Question 2: How Are Branded Types Implemented?

**Answer**: Branded types use type intersection with a unique property:

```typescript
// The brand is just an invisible marker
type UserId = number & { readonly __brand: "UserId" };

// At runtime, this is just a number (brands erased)
const id: UserId = 123 as UserId;
console.log(typeof id); // "number", not "UserId"
```

### Interview Question 3: What Are the Limitations?

**Answer**:
1. Brands are compile-time only; they disappear at runtime
2. They require explicit type assertions to create
3. They don't prevent all type errors (e.g., `as any` bypasses them)
4. Validation is manual; TypeScript doesn't enforce it
5. Can be circumvented with less scrupulous code

### Interview Question 4: When Would You Use Branded Types?

**Answer**: Use branded types when:
- Preventing mixing of similar primitives (IDs, tokens, emails)
- Creating validated types with guarantees
- Building type-safe pipelines with multiple stages
- Documenting implicit requirements in function signatures
- Reducing runtime errors from type confusion

### Interview Question 5: Compare Branded Types to Enums

```typescript
// Branded types: for creating distinct primitive types
type UserId = number & { readonly __brand: "UserId" };

// Enums: for creating named constants
enum UserRole {
  Admin = "admin",
  User = "user",
}

// Use branded types when you need type safety on existing values
// Use enums when you need a fixed set of named constants
```

### Interview Question 6: How Do Branded Types Work with Generics?

**Answer**: Branded types work well with generics:

```typescript
type Branded<T, B extends string> = T & { readonly __brand: B };

// Generic factory
function create<T, B extends string>(
  value: T,
  brand: B
): Branded<T, B> {
  return value as Branded<T, B>;
}

const userId = create(123, "UserId");
const email = create("user@example.com", "Email");
```

## Further Reading

### Related TypeScript Concepts

- **Structural vs Nominal Types**: TypeScript's fundamental type system philosophy
- **Type Guards**: Narrowing types with `is` keyword
- **Utility Types**: Built-in types like `Readonly`, `Partial`, `Required`
- **Type Assertions**: Using `as` keyword to assert types
- **Mapped Types**: Creating new types from existing ones
- **Conditional Types**: Types that depend on type conditions
- **Template Literal Types**: String manipulation in the type system

### Key Resources

1. **TypeScript Handbook - Type Inference**: Understanding how types work
2. **TypeScript Handbook - Type Guards**: Implementing custom type guards
3. **Branded Types Pattern**: Common in functional programming libraries
4. **Phantom Types**: The functional programming equivalent
5. **Newtype Pattern**: Common in languages like Haskell

### Library Examples

- **io-ts**: Runtime type validation library using branded types
- **fp-ts**: Functional programming library using branded types for effects
- **zod**: Schema validation with branded types
- **Effect**: Functional effects library with extensive branding

### Related Patterns

- **Sealed Classes**: In languages with true nominal typing
- **Opaque Types**: Not exposing implementation details
- **Protocol-based Types**: Duck typing vs strict typing
- **Refinement Types**: Types with specific constraints

### Best Practices Articles

- Creating safe APIs with branded types
- Type-driven development in TypeScript
- Building domain models with types
- Preventing runtime errors through types
- Type-safe pipelines and workflows

---

## Summary

Branded types are a powerful pattern for adding nominal type safety to TypeScript's structural type system. By creating unique type markers, you can:

- **Prevent mixing** of similarly-shaped types
- **Document requirements** implicitly in function signatures
- **Build type-safe pipelines** with validated data flowing through stages
- **Reduce runtime errors** caused by type confusion
- **Maintain clarity** about what types are what

While they require manual validation and can be bypassed with `as any`, branded types are a valuable tool for building robust, maintainable TypeScript applications, especially in domains where type confusion could cause subtle bugs.

The key to using branded types effectively is pairing them with constructor functions that validate values, ensuring that the brand's promise is upheld throughout your application.
