---
title: TypeScript 联合类型与交叉类型
description: 深入掌握 TypeScript 联合类型与交叉类型：类型组合、可辨识联合、类型收窄与实战应用
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - 联合类型
  - 交叉类型
  - 可辨识联合
  - 类型收窄
status: imported
origin: old/src/content/docs/typescript/union-intersection.en.md
divergence: 0.221
issues:
  - title-lang-en
  - title-language
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 4
  lastUpdated: 2026-01-07
---

Union Types and Intersection Types are two core concepts in TypeScript's type system that provide powerful type composition capabilities. Union types represent an "or" relationship, while intersection types represent an "and" relationship. Mastering these two types is essential for writing type-safe TypeScript code.

## Concept Explanation

### Union Types

Union types use the pipe `|` symbol to connect multiple types, indicating that a value can be any one of these types. This is similar to the concept of "union" in mathematics.

```typescript
// Basic union type
type StringOrNumber = string | number;

let value: StringOrNumber;
value = "hello";  // Valid
value = 42;       // Valid
// value = true;  // Error: boolean is not in the union type
```

### Intersection Types

Intersection types use the `&` symbol to connect multiple types, indicating that a value must satisfy the requirements of all types simultaneously. This is similar to the concept of "intersection" in mathematics, but in the type system it manifests as type merging.

```typescript
// Basic intersection type
interface Named {
  name: string;
}

interface Aged {
  age: number;
}

type Person = Named & Aged;

const person: Person = {
  name: "Alice",  // Must have name
  age: 30         // Must have age
};
```

### Historical Background

Union types and intersection types originate from Algebraic Data Types (ADTs) in type theory. Union types correspond to "Sum Types," and intersection types correspond to "Product Types." TypeScript has supported union types since version 1.4 and intersection types since version 1.6.

### Problems Solved

1. **Type Flexibility**: Allows variables to accept values of multiple types
2. **Type Composition**: Combines multiple types without inheritance
3. **Precise Modeling**: More accurately expresses type relationships in business domains
4. **API Design**: Creates more flexible function signatures

## Core Principles

### Underlying Mechanism of Union Types

Union types adopt a "permissive input, strict output" strategy during type checking:

```typescript
type StringOrNumber = string | number;

function process(value: StringOrNumber) {
  // Inside the function, only properties/methods common to both string and number can be accessed
  // value.length;  // Error: number doesn't have length property
  // value.toFixed(); // Error: string doesn't have toFixed method

  // Common methods can be accessed
  value.toString();  // Valid: both have toString
  value.valueOf();   // Valid: both have valueOf
}
```

### Underlying Mechanism of Intersection Types

Intersection types merge members from multiple types into one type:

```typescript
interface A {
  a: string;
  shared: number;
}

interface B {
  b: string;
  shared: number;
}

type AB = A & B;

// AB is equivalent to:
// {
//   a: string;
//   b: string;
//   shared: number;  // Same property types must be compatible
// }

const ab: AB = {
  a: "a value",
  b: "b value",
  shared: 42
};
```

### Type Compatibility Rules

```typescript
// Union type compatibility
type Narrow = string;
type Wide = string | number;

let narrow: Narrow = "hello";
let wide: Wide = narrow;  // Valid: Narrow can be assigned to Wide
// narrow = wide;         // Error: Wide cannot be assigned to Narrow

// Intersection type compatibility
interface Base {
  id: number;
}

interface Extended {
  id: number;
  name: string;
}

// Extended is automatically compatible with Base & { name: string }
let extended: Extended = { id: 1, name: "test" };
let intersected: Base & { name: string } = extended;  // Valid
```

### Property Conflict Handling

When property types conflict in intersection types:

```typescript
interface X {
  prop: string;
}

interface Y {
  prop: number;
}

type XY = X & Y;

// prop's type becomes string & number, which is never
// Because no value can be both string and number
// const xy: XY = { prop: ??? };  // Cannot create a valid value
```

## Key Points

### Union Type Key Points

| Feature | Description | Example |
|---------|-------------|---------|
| Syntax | Connect types with `\|` | `string \| number` |
| Member Access | Can only access common members | `value.toString()` |
| Type Narrowing | Requires type guards to determine specific type | `typeof`, `instanceof` |
| Distributive | Automatically distributes in generics | `T extends U ? X : Y` |
| Assignment Rules | Narrow types can be assigned to wide types | `string` -> `string \| number` |

### Intersection Type Key Points

| Feature | Description | Example |
|---------|-------------|---------|
| Syntax | Connect types with `&` | `A & B` |
| Member Access | Can access all members | All properties after merging |
| Conflict Handling | Same property types are intersected | `string & number` = `never` |
| Use Cases | Combining multiple types/interfaces | Mixin pattern |
| Assignment Rules | Wide types can be assigned to narrow types | `A & B` -> `A` |

### Type Narrowing Methods

1. **typeof Guards**: For primitive types
2. **instanceof Guards**: For class instances
3. **in Operator**: Checks if a property exists
4. **Discriminated Unions**: Uses shared literal properties
5. **Custom Type Guards**: Uses the `is` keyword
6. **Truthiness Narrowing**: Leverages JavaScript's truthy evaluation
7. **Equality Narrowing**: Uses `===` or `!==`

## Code Examples

### Basic Union Type Usage

```typescript
// 1. Basic union type
type ID = string | number;

function printId(id: ID) {
  console.log(`ID is: ${id}`);
}

printId(101);      // "ID is: 101"
printId("abc");    // "ID is: abc"

// 2. Union type arrays
type StringOrNumberArray = (string | number)[];

const mixed: StringOrNumberArray = [1, "two", 3, "four"];

// 3. Literal union types
type Direction = "north" | "south" | "east" | "west";

function move(direction: Direction) {
  console.log(`Moving ${direction}`);
}

move("north");  // Valid
// move("up");  // Error: not in the union type

// 4. Union types with null/undefined
type NullableString = string | null | undefined;

function greet(name: NullableString) {
  if (name) {
    console.log(`Hello, ${name}!`);
  } else {
    console.log("Hello, stranger!");
  }
}
```

### Basic Intersection Type Usage

```typescript
// 1. Interface merging
interface Printable {
  print(): void;
}

interface Loggable {
  log(): void;
}

type PrintableAndLoggable = Printable & Loggable;

class Document implements PrintableAndLoggable {
  print() {
    console.log("Printing document...");
  }

  log() {
    console.log("Logging document...");
  }
}

// 2. Object type merging
type Name = {
  firstName: string;
  lastName: string;
};

type Contact = {
  email: string;
  phone: string;
};

type Employee = Name & Contact & {
  employeeId: number;
};

const employee: Employee = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "123-456-7890",
  employeeId: 12345
};

// 3. Function type intersection
type Logger = {
  log: (message: string) => void;
};

type Formatter = {
  format: (data: unknown) => string;
};

type LoggerWithFormatter = Logger & Formatter;

const logger: LoggerWithFormatter = {
  log: (message) => console.log(message),
  format: (data) => JSON.stringify(data)
};
```

### Type Narrowing

```typescript
// 1. typeof type guard
function padLeft(value: string, padding: string | number): string {
  if (typeof padding === "number") {
    // Here padding's type is narrowed to number
    return " ".repeat(padding) + value;
  }
  // Here padding's type is narrowed to string
  return padding + value;
}

console.log(padLeft("Hello", 4));      // "    Hello"
console.log(padLeft("Hello", ">>> ")); // ">>> Hello"

// 2. instanceof type guard
class Bird {
  fly() {
    console.log("Flying...");
  }
}

class Fish {
  swim() {
    console.log("Swimming...");
  }
}

type Pet = Bird | Fish;

function move(pet: Pet) {
  if (pet instanceof Bird) {
    pet.fly();  // pet is narrowed to Bird
  } else {
    pet.swim(); // pet is narrowed to Fish
  }
}

// 3. in operator
interface Admin {
  name: string;
  privileges: string[];
}

interface User {
  name: string;
  email: string;
}

type UnknownEmployee = Admin | User;

function printEmployeeInfo(emp: UnknownEmployee) {
  console.log(`Name: ${emp.name}`);

  if ("privileges" in emp) {
    // emp is narrowed to Admin
    console.log(`Privileges: ${emp.privileges.join(", ")}`);
  }

  if ("email" in emp) {
    // emp is narrowed to User
    console.log(`Email: ${emp.email}`);
  }
}

// 4. Custom type guards
interface Cat {
  meow(): void;
}

interface Dog {
  bark(): void;
}

// Type predicate: return type is pet is Cat
function isCat(pet: Cat | Dog): pet is Cat {
  return (pet as Cat).meow !== undefined;
}

function makeSound(pet: Cat | Dog) {
  if (isCat(pet)) {
    pet.meow();  // pet is narrowed to Cat
  } else {
    pet.bark();  // pet is narrowed to Dog
  }
}

// 5. Truthiness narrowing
function printLength(str: string | null | undefined) {
  if (str) {
    // str is narrowed to string
    console.log(str.length);
  }
}

// 6. Equality narrowing
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // Both x and y are narrowed to string (the only type that could be equal)
    console.log(x.toUpperCase());
    console.log(y.toLowerCase());
  }
}
```

### Discriminated Unions

```typescript
// Using common literal properties to distinguish union type members

// 1. Basic discriminated union
interface Circle {
  kind: "circle";  // Discriminant property
  radius: number;
}

interface Rectangle {
  kind: "rectangle";  // Discriminant property
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";  // Discriminant property
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape is narrowed to Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape is narrowed to Rectangle
      return shape.width * shape.height;
    case "triangle":
      // shape is narrowed to Triangle
      return (shape.base * shape.height) / 2;
  }
}

// 2. State machine pattern
interface IdleState {
  status: "idle";
}

interface LoadingState {
  status: "loading";
  progress: number;
}

interface SuccessState {
  status: "success";
  data: unknown;
}

interface ErrorState {
  status: "error";
  error: Error;
}

type RequestState = IdleState | LoadingState | SuccessState | ErrorState;

function handleRequest(state: RequestState) {
  switch (state.status) {
    case "idle":
      console.log("Ready to start");
      break;
    case "loading":
      console.log(`Loading: ${state.progress}%`);
      break;
    case "success":
      console.log("Data received:", state.data);
      break;
    case "error":
      console.log("Error:", state.error.message);
      break;
  }
}

// 3. Exhaustiveness checking
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function getShapeDescription(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `Circle with radius ${shape.radius}`;
    case "rectangle":
      return `Rectangle ${shape.width}x${shape.height}`;
    case "triangle":
      return `Triangle with base ${shape.base}`;
    default:
      // If a new Shape type is added but not handled, this will cause an error
      return assertNever(shape);
  }
}

// 4. Redux Action pattern
interface AddTodoAction {
  type: "ADD_TODO";
  payload: {
    id: number;
    text: string;
  };
}

interface ToggleTodoAction {
  type: "TOGGLE_TODO";
  payload: {
    id: number;
  };
}

interface RemoveTodoAction {
  type: "REMOVE_TODO";
  payload: {
    id: number;
  };
}

type TodoAction = AddTodoAction | ToggleTodoAction | RemoveTodoAction;

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case "ADD_TODO":
      return [
        ...state,
        {
          id: action.payload.id,
          text: action.payload.text,
          completed: false
        }
      ];
    case "TOGGLE_TODO":
      return state.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    case "REMOVE_TODO":
      return state.filter(todo => todo.id !== action.payload.id);
  }
}
```

### Advanced Composition Patterns

```typescript
// 1. Mixing union and intersection types
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fetchUser(id: number): Result<{ name: string; email: string }> {
  if (id > 0) {
    return {
      success: true,
      data: { name: "Alice", email: "alice@example.com" }
    };
  }
  return {
    success: false,
    error: "Invalid user ID"
  };
}

const result = fetchUser(1);
if (result.success) {
  console.log(result.data.name);  // Type-safe
} else {
  console.log(result.error);
}

// 2. Conditional types and union types
type NonNullable<T> = T extends null | undefined ? never : T;

type T1 = NonNullable<string | null | undefined>;  // string
type T2 = NonNullable<string | number | null>;     // string | number

// 3. Mapped types and union types
type PartialByKeys<T, K extends keyof T> = {
  [P in K]?: T[P];
} & {
  [P in Exclude<keyof T, K>]: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type UserWithOptionalContact = PartialByKeys<User, "email" | "age">;
// { id: number; name: string; email?: string; age?: number }

// 4. Generic constraints and intersection types
function merge<T extends object, U extends object>(
  obj1: T,
  obj2: U
): T & U {
  return { ...obj1, ...obj2 };
}

const merged = merge(
  { name: "Alice" },
  { age: 30 }
);
// merged: { name: string } & { age: number }

// 5. Converting union types to intersection types
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends
  ((k: infer I) => void) ? I : never;

type Union = { a: string } | { b: number } | { c: boolean };
type Intersection = UnionToIntersection<Union>;
// Intersection = { a: string } & { b: number } & { c: boolean }
```

## Best Practices

### Prefer Discriminated Unions

```typescript
// Recommended: Use discriminated unions
interface Dog {
  type: "dog";
  bark(): void;
}

interface Cat {
  type: "cat";
  meow(): void;
}

type Animal = Dog | Cat;

function handleAnimal(animal: Animal) {
  switch (animal.type) {
    case "dog":
      animal.bark();
      break;
    case "cat":
      animal.meow();
      break;
  }
}

// Not recommended: Using optional properties to simulate unions
interface AnimalBad {
  type: "dog" | "cat";
  bark?: () => void;  // Optional
  meow?: () => void;  // Optional
}
// Drawback: Cannot guarantee that dog always has bark, cat always has meow
```

### Use Exhaustiveness Checking

```typescript
type Status = "pending" | "approved" | "rejected";

function getStatusMessage(status: Status): string {
  switch (status) {
    case "pending":
      return "Waiting for review";
    case "approved":
      return "Request approved";
    case "rejected":
      return "Request rejected";
    default:
      // Ensures all cases are handled
      const _exhaustive: never = status;
      return _exhaustive;
  }
}
```

### Use Type Aliases Appropriately

```typescript
// Create meaningful aliases for complex union/intersection types
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONArray
  | JSONObject;

interface JSONArray extends Array<JSONValue> {}
interface JSONObject {
  [key: string]: JSONValue;
}

// Instead of using inline types everywhere
function parse(json: string): JSONValue {
  return JSON.parse(json);
}
```

### Avoid Deep Nesting

```typescript
// Not recommended: Deeply nested
type Complex = (A | B) & (C | D) & (E | F);

// Recommended: Step-by-step definition
type AB = A | B;
type CD = C | D;
type EF = E | F;
type Combined = AB & CD & EF;
```

### Use Type Guard Functions

```typescript
// Encapsulate type checking logic into reusable functions
interface ApiError {
  code: number;
  message: string;
}

interface ApiSuccess<T> {
  data: T;
}

type ApiResponse<T> = ApiError | ApiSuccess<T>;

function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return "code" in response && "message" in response;
}

function handleResponse<T>(response: ApiResponse<T>) {
  if (isApiError(response)) {
    console.error(`Error ${response.code}: ${response.message}`);
  } else {
    console.log("Success:", response.data);
  }
}
```

## Common Pitfalls

### Union Type Property Access Errors

```typescript
type StringOrNumber = string | number;

function processValue(value: StringOrNumber) {
  // Wrong example
  // console.log(value.length);  // Error: number doesn't have length

  // Correct example: Narrow the type first
  if (typeof value === "string") {
    console.log(value.length);
  }
}
```

### Intersection Type Conflicts

```typescript
interface A {
  prop: string;
}

interface B {
  prop: number;
}

type AB = A & B;
// AB.prop's type is never (string & number = never)

// Solution: Use generics or redesign the type structure
interface BaseWithProp<T> {
  prop: T;
}

type AWithGeneric = BaseWithProp<string>;
type BWithGeneric = BaseWithProp<number>;
```

### Ignoring Discriminated Union Exhaustiveness

```typescript
type Shape = Circle | Rectangle;

function getArea(shape: Shape) {
  if (shape.kind === "circle") {
    return Math.PI * shape.radius ** 2;
  }
  // Missing rectangle handling
  // If new types are added later, the compiler won't warn
}

// Correct approach: Use switch and exhaustiveness checking
function getAreaSafe(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    default:
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustive}`);
  }
}
```

### Unexpected Behavior of Distributive Conditional Types

```typescript
type ToArray<T> = T extends any ? T[] : never;

// Union types distribute
type Result = ToArray<string | number>;
// Result = string[] | number[] (not (string | number)[])

// To avoid distributive behavior, wrap in a tuple
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type ResultNonDist = ToArrayNonDist<string | number>;
// ResultNonDist = (string | number)[]
```

### Type Guard Scope Issues

```typescript
type Pet = { type: "cat"; meow(): void } | { type: "dog"; bark(): void };

function handlePet(pet: Pet) {
  if (pet.type === "cat") {
    pet.meow();  // Correct

    setTimeout(() => {
      // pet.meow();  // Error! Type narrowing is lost in callbacks
      // Solution: Save the narrowed reference outside the closure
    }, 1000);
  }
}

// Correct approach
function handlePetCorrect(pet: Pet) {
  if (pet.type === "cat") {
    const cat = pet;  // Save the narrowed type
    setTimeout(() => {
      cat.meow();  // Correct
    }, 1000);
  }
}
```

## Performance Considerations

### Compile-time Performance

1. **Simplify Complex Types**: Overly complex union/intersection types increase compile time

```typescript
// Avoid overly complex type computations
type TooComplex =
  | Type1 & Type2 & Type3
  | Type4 & Type5 & Type6
  | Type7 & Type8 & Type9;

// Consider simplifying or decomposing
```

2. **Limit Union Type Members**: Large numbers of members affect type checking performance

```typescript
// Not recommended: Too many union members
type AllHTMLElements =
  | HTMLDivElement
  | HTMLSpanElement
  | HTMLInputElement
  // ... 100+ more

// Recommended: Use base classes or generics
type HTMLElements = HTMLElement;
```

### Runtime Performance

1. **Cost of Type Narrowing**: Runtime type checking has performance overhead

```typescript
// In frequently called functions, consider using discriminated unions over typeof
// typeof check
function processTypeof(value: string | number) {
  if (typeof value === "string") {
    // ...
  }
}

// Discriminated union (usually faster)
function processDiscriminated(
  value: { type: "string"; value: string } | { type: "number"; value: number }
) {
  if (value.type === "string") {
    // ...
  }
}
```

2. **Avoid Unnecessary Type Guards**

```typescript
// If the type can be determined at compile time, no runtime check is needed
function process(value: string) {
  // No need for typeof check
  console.log(value.length);
}
```

## Real-world Scenarios

### Scenario 1: API Response Handling

```typescript
// Define API response types
interface SuccessResponse<T> {
  status: "success";
  data: T;
  timestamp: number;
}

interface ErrorResponse {
  status: "error";
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: number;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// API client
async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || "Unknown error"
        },
        timestamp: Date.now()
      };
    }

    return {
      status: "success",
      data,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      status: "error",
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error"
      },
      timestamp: Date.now()
    };
  }
}

// Usage example
interface User {
  id: number;
  name: string;
  email: string;
}

async function getUser(id: number) {
  const response = await fetchData<User>(`/api/users/${id}`);

  if (response.status === "success") {
    console.log(`User: ${response.data.name}`);
    return response.data;
  } else {
    console.error(`Error: ${response.error.message}`);
    throw new Error(response.error.message);
  }
}
```

### Scenario 2: Form Validation

```typescript
// Validation result type
type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

// Field validator type
type Validator<T> = (value: T) => ValidationResult;

// Create validators
const required: Validator<string> = (value) => {
  if (!value.trim()) {
    return { valid: false, errors: ["This field is required"] };
  }
  return { valid: true };
};

const minLength = (min: number): Validator<string> => (value) => {
  if (value.length < min) {
    return { valid: false, errors: [`Minimum length is ${min}`] };
  }
  return { valid: true };
};

const email: Validator<string> = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { valid: false, errors: ["Invalid email format"] };
  }
  return { valid: true };
};

// Combine validators
function combine<T>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    const errors: string[] = [];

    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return errors.length > 0
      ? { valid: false, errors }
      : { valid: true };
  };
}

// Form field type
interface FormField<T> {
  value: T;
  validator: Validator<T>;
}

// Form validation
function validateForm<T extends Record<string, FormField<any>>>(
  form: T
): { [K in keyof T]: ValidationResult } {
  const results = {} as { [K in keyof T]: ValidationResult };

  for (const key in form) {
    const field = form[key];
    results[key] = field.validator(field.value);
  }

  return results;
}

// Usage example
const registrationForm = {
  username: {
    value: "john",
    validator: combine(required, minLength(3))
  },
  email: {
    value: "john@example.com",
    validator: combine(required, email)
  },
  password: {
    value: "123456",
    validator: combine(required, minLength(8))
  }
};

const validationResults = validateForm(registrationForm);
```

### Scenario 3: State Management

```typescript
// Async operation state
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// Create async state hook (conceptual example)
function useAsyncState<T>() {
  let state: AsyncState<T> = { status: "idle" };

  return {
    getState: () => state,
    setIdle: () => { state = { status: "idle" }; },
    setLoading: () => { state = { status: "loading" }; },
    setSuccess: (data: T) => { state = { status: "success", data }; },
    setError: (error: Error) => { state = { status: "error", error }; }
  };
}

// Render function
function renderAsyncState<T>(
  state: AsyncState<T>,
  render: {
    idle: () => string;
    loading: () => string;
    success: (data: T) => string;
    error: (error: Error) => string;
  }
): string {
  switch (state.status) {
    case "idle":
      return render.idle();
    case "loading":
      return render.loading();
    case "success":
      return render.success(state.data);
    case "error":
      return render.error(state.error);
  }
}

// Usage example
const userState: AsyncState<User> = {
  status: "success",
  data: { id: 1, name: "Alice", email: "alice@example.com" }
};

const output = renderAsyncState(userState, {
  idle: () => "Click to load",
  loading: () => "Loading...",
  success: (user) => `Hello, ${user.name}!`,
  error: (err) => `Error: ${err.message}`
});
```

### Scenario 4: Plugin System

```typescript
// Plugin interfaces
interface BasePlugin {
  name: string;
  version: string;
}

interface LoggerPlugin extends BasePlugin {
  type: "logger";
  log: (message: string) => void;
  level: "debug" | "info" | "warn" | "error";
}

interface StoragePlugin extends BasePlugin {
  type: "storage";
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
}

interface AnalyticsPlugin extends BasePlugin {
  type: "analytics";
  track: (event: string, data: Record<string, unknown>) => void;
}

type Plugin = LoggerPlugin | StoragePlugin | AnalyticsPlugin;

// Plugin manager
class PluginManager {
  private plugins: Plugin[] = [];

  register(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  getPlugin<T extends Plugin["type"]>(
    type: T
  ): Extract<Plugin, { type: T }> | undefined {
    return this.plugins.find(
      (p): p is Extract<Plugin, { type: T }> => p.type === type
    );
  }

  getAllPlugins(): Plugin[] {
    return [...this.plugins];
  }
}

// Usage example
const manager = new PluginManager();

manager.register({
  name: "ConsoleLogger",
  version: "1.0.0",
  type: "logger",
  log: console.log,
  level: "info"
});

const logger = manager.getPlugin("logger");
if (logger) {
  logger.log("Hello from plugin!");  // Type-safe
}
```

## Interview Key Points

### What is the difference between union types and intersection types?

**Reference Answer**:
- Union types (`|`) represent an "or" relationship; values can be any one of the types
- Intersection types (`&`) represent an "and" relationship; values must satisfy all types simultaneously
- Union types can only access common members when accessing properties
- Intersection types can access all members when accessing properties

### What are discriminated unions? How do you implement them?

**Reference Answer**:
Discriminated unions are a special union type pattern where each member has a common literal property (the discriminant property). By checking this property, TypeScript can automatically narrow the type.

```typescript
interface Circle { kind: "circle"; radius: number; }
interface Square { kind: "square"; side: number; }
type Shape = Circle | Square;

function area(shape: Shape) {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.side ** 2;
  }
}
```

### What are the type narrowing methods in TypeScript?

**Reference Answer**:
1. `typeof` guards: For primitive types
2. `instanceof` guards: For class instances
3. `in` operator: Checks property existence
4. Discriminated unions: Uses literal discriminant properties
5. Custom type guards: Uses the `is` keyword
6. Truthiness narrowing: Leverages JavaScript truthy evaluation
7. Equality narrowing: Uses `===` or `!==`

### How are property conflicts handled in intersection types?

**Reference Answer**:
When the same property in an intersection type has different types, the property's type becomes the intersection of those types. If the intersection results in `never`, the property cannot be assigned.

```typescript
interface A { prop: string; }
interface B { prop: number; }
type AB = A & B;  // prop type is string & number = never
```

Solutions: Use generics, redesign the type structure, or use type assertions.

### How do you implement exhaustiveness checking?

**Reference Answer**:
Use the `never` type for exhaustiveness checking to ensure all union type members are handled:

```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function handle(value: "a" | "b" | "c") {
  switch (value) {
    case "a": return "A";
    case "b": return "B";
    case "c": return "C";
    default: return assertNever(value);
  }
}
```

### What are distributive conditional types? How do you avoid them?

**Reference Answer**:
When conditional types are applied to union types, they distribute over each member, computing separately and then unioning the results.

```typescript
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>;  // string[] | number[]
```

To avoid distributive behavior, wrap the type parameter in a tuple:

```typescript
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result = ToArrayNonDist<string | number>;  // (string | number)[]
```

## Further Reading

### Official Documentation

- [TypeScript Handbook - Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [TypeScript Handbook - Intersection Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

### In-depth Learning Resources

- [TypeScript Deep Dive - Union Types](https://basarat.gitbook.io/typescript/type-system/discriminated-unions)
- [Effective TypeScript](https://effectivetypescript.com/) - Dan Vanderkam
- [Programming TypeScript](https://www.oreilly.com/library/view/programming-typescript/9781492037644/) - Boris Cherny

### Related Topics

- [TypeScript Generics](/typescript/generics) - Learn about combining generics with union/intersection types
- [TypeScript Advanced Types](/typescript/advanced-types) - Deep dive into conditional types, mapped types, etc.
- [TypeScript Type Guards](/typescript/type-guards) - Master various type narrowing techniques
- [TypeScript Utility Types](/typescript/utility-types) - Learn built-in type manipulation tools
