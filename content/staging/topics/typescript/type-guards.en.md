---
title: Type Guards
description: "A Complete Guide to TypeScript Type Guards: Type Narrowing, Custom Type Guards, and Assertion Functions"
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - Type Guards
  - Type Narrowing
  - Type Safety
status: imported
origin: old/src/content/docs/typescript/type-guards.en.md
divergence: 0.228
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 5
  lastUpdated: 2026-01-07
---

In TypeScript, type guards are techniques for checking types at runtime that help the compiler narrow the type of a variable within specific code blocks. With type guards, we can write safer and more precise code while getting better type inference support.

## What Are Type Guards?

Type guards are expressions that perform runtime checks to ensure types within a certain scope. When TypeScript recognizes a type guard, it automatically narrows the variable's type to a more specific type.

```typescript
function example(value: string | number) {
  // Here, value's type is string | number

  if (typeof value === "string") {
    // In this block, TypeScript knows value is a string
    console.log(value.toUpperCase());
  } else {
    // In this block, TypeScript knows value is a number
    console.log(value.toFixed(2));
  }
}
```

## The typeof Type Guard

`typeof` is a native JavaScript operator that TypeScript uses as a type guard. It's suitable for checking primitive types.

### Basic Usage

```typescript
function processValue(value: string | number | boolean) {
  if (typeof value === "string") {
    // value: string
    return value.trim().toLowerCase();
  }

  if (typeof value === "number") {
    // value: number
    return value * 2;
  }

  // value: boolean
  return !value;
}
```

### Types Recognized by typeof

The `typeof` operator can return the following string values:

- `"string"`
- `"number"`
- `"bigint"`
- `"boolean"`
- `"symbol"`
- `"undefined"`
- `"object"` (including `null`)
- `"function"`

```typescript
function handleUnknown(value: unknown) {
  if (typeof value === "string") {
    console.log("String:", value);
  } else if (typeof value === "number") {
    console.log("Number:", value);
  } else if (typeof value === "boolean") {
    console.log("Boolean:", value);
  } else if (typeof value === "function") {
    console.log("Function:", value.name);
  } else if (typeof value === "object") {
    if (value === null) {
      console.log("null value");
    } else {
      console.log("Object:", value);
    }
  } else if (typeof value === "undefined") {
    console.log("Undefined");
  } else if (typeof value === "symbol") {
    console.log("Symbol:", value.toString());
  } else if (typeof value === "bigint") {
    console.log("BigInt:", value);
  }
}
```

### Limitations of typeof

`typeof` cannot distinguish between different object types:

```typescript
function processObject(value: Date | RegExp | Array<number>) {
  if (typeof value === "object") {
    // value is still Date | RegExp | number[]
    // typeof cannot further distinguish
  }
}

// typeof null returns "object" (a historical JavaScript quirk)
const arr = [1, 2, 3];
const obj = { a: 1 };

console.log(typeof arr); // "object"
console.log(typeof obj); // "object"
console.log(typeof null); // "object"
```

## The instanceof Type Guard

The `instanceof` operator checks whether an object is an instance of a particular class. It works by checking the prototype chain and is excellent for distinguishing class instances.

### Basic Usage

```typescript
class Dog {
  bark() {
    console.log("Woof!");
  }
}

class Cat {
  meow() {
    console.log("Meow!");
  }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    // animal: Dog
    animal.bark();
  } else {
    // animal: Cat
    animal.meow();
  }
}

const dog = new Dog();
const cat = new Cat();

makeSound(dog); // Output: Woof!
makeSound(cat); // Output: Meow!
```

### Handling Built-in Objects

```typescript
function processValue(value: Date | RegExp | Error) {
  if (value instanceof Date) {
    // value: Date
    console.log("Date:", value.toISOString());
  } else if (value instanceof RegExp) {
    // value: RegExp
    console.log("RegExp:", value.source);
  } else {
    // value: Error
    console.log("Error:", value.message);
  }
}

processValue(new Date());           // Date: 2026-01-07T...
processValue(/hello/g);             // RegExp: hello
processValue(new Error("Oops"));    // Error: Oops
```

### Handling Arrays

```typescript
function processData(data: number[] | Set<number> | Map<string, number>) {
  if (Array.isArray(data)) {
    // data: number[]
    console.log("Array length:", data.length);
    data.forEach(item => console.log(item));
  } else if (data instanceof Set) {
    // data: Set<number>
    console.log("Set size:", data.size);
    data.forEach(item => console.log(item));
  } else {
    // data: Map<string, number>
    console.log("Map size:", data.size);
    data.forEach((value, key) => console.log(key, value));
  }
}
```

### instanceof in Inheritance Hierarchies

```typescript
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class Bird extends Animal {
  fly() {
    console.log(`${this.name} is flying`);
  }
}

class Fish extends Animal {
  swim() {
    console.log(`${this.name} is swimming`);
  }
}

function move(animal: Animal) {
  if (animal instanceof Bird) {
    // animal: Bird
    animal.fly();
  } else if (animal instanceof Fish) {
    // animal: Fish
    animal.swim();
  } else {
    console.log(`${animal.name} is moving`);
  }
}

const bird = new Bird("Sparrow");
console.log(bird instanceof Bird);   // true
console.log(bird instanceof Animal); // true (checks prototype chain)
console.log(bird instanceof Object); // true
```

## The in Operator Type Guard

The `in` operator checks whether an object has a particular property. This is particularly useful for distinguishing object types with different properties.

### Basic Usage

```typescript
interface Bird {
  fly: () => void;
  layEggs: () => void;
}

interface Fish {
  swim: () => void;
  layEggs: () => void;
}

function move(animal: Bird | Fish) {
  if ("fly" in animal) {
    // animal: Bird
    animal.fly();
  } else {
    // animal: Fish
    animal.swim();
  }
}

const fish: Fish = {
  swim: () => console.log("Swimming..."),
  layEggs: () => console.log("Laying eggs...")
};

const bird: Bird = {
  fly: () => console.log("Flying..."),
  layEggs: () => console.log("Laying eggs...")
};

move(fish); // Output: Swimming...
move(bird); // Output: Flying...
```

### Distinguishing Multiple Types

```typescript
interface Car {
  drive: () => void;
  wheels: number;
}

interface Boat {
  sail: () => void;
  propellers: number;
}

interface Plane {
  fly: () => void;
  wings: number;
}

type Vehicle = Car | Boat | Plane;

function operate(vehicle: Vehicle) {
  if ("drive" in vehicle) {
    // vehicle: Car
    console.log(`This car has ${vehicle.wheels} wheels`);
    vehicle.drive();
  } else if ("sail" in vehicle) {
    // vehicle: Boat
    console.log(`This boat has ${vehicle.propellers} propellers`);
    vehicle.sail();
  } else {
    // vehicle: Plane
    console.log(`This plane has ${vehicle.wings} wings`);
    vehicle.fly();
  }
}
```

### Handling Optional Properties

```typescript
interface BasicUser {
  id: number;
  name: string;
}

interface AdminUser {
  id: number;
  name: string;
  permissions: string[];
  adminLevel: number;
}

function getUserInfo(user: BasicUser | AdminUser) {
  console.log(`User: ${user.name} (ID: ${user.id})`);

  if ("permissions" in user) {
    // user: AdminUser
    console.log(`Admin level: ${user.adminLevel}`);
    console.log(`Permissions: ${user.permissions.join(", ")}`);
  }
}

// Checking if optional properties exist
interface User {
  name: string;
  email?: string;
  phone?: string;
}

function contactUser(user: User) {
  if ("email" in user && user.email) {
    console.log(`Sending email to: ${user.email}`);
  } else if ("phone" in user && user.phone) {
    console.log(`Calling: ${user.phone}`);
  } else {
    console.log(`Cannot contact ${user.name}`);
  }
}
```

## Custom Type Guards

When built-in type guards don't meet your needs, you can create custom type guards. A custom type guard is a function that returns a type predicate.

### Type Predicate Syntax

A type predicate has the form `parameterName is Type`:

```typescript
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function processValue(value: unknown) {
  if (isString(value)) {
    // value: string
    console.log(value.toUpperCase());
  }
}
```

### Checking Object Shapes

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    "email" in value &&
    typeof (value as User).id === "number" &&
    typeof (value as User).name === "string" &&
    typeof (value as User).email === "string"
  );
}

function processData(data: unknown) {
  if (isUser(data)) {
    // data: User
    console.log(`User: ${data.name}, Email: ${data.email}`);
  } else {
    console.log("Invalid user data");
  }
}

// Usage example
processData({ id: 1, name: "John", email: "john@example.com" });
// Output: User: John, Email: john@example.com

processData({ id: "1", name: "John" });
// Output: Invalid user data
```

### Array Type Guards

```typescript
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === "string")
  );
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === "number")
  );
}

function processArray(arr: unknown) {
  if (isStringArray(arr)) {
    // arr: string[]
    console.log(arr.map(s => s.toUpperCase()));
  } else if (isNumberArray(arr)) {
    // arr: number[]
    console.log(arr.reduce((sum, n) => sum + n, 0));
  }
}

processArray(["a", "b", "c"]); // Output: ["A", "B", "C"]
processArray([1, 2, 3]);       // Output: 6
```

### Generic Type Guards

```typescript
// Non-nullable value check
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function processValues(values: (string | null | undefined)[]) {
  const validValues = values.filter(isNonNullable);
  // validValues: string[]
  console.log(validValues);
}

processValues(["hello", null, "world", undefined]);
// Output: ["hello", "world"]

// More generic type guard
function isInstanceOf<T>(
  constructor: new (...args: any[]) => T
): (value: unknown) => value is T {
  return (value: unknown): value is T => value instanceof constructor;
}

const isDate = isInstanceOf(Date);
const isRegExp = isInstanceOf(RegExp);
const isError = isInstanceOf(Error);

function example(value: unknown) {
  if (isDate(value)) {
    // value: Date
    console.log(value.getFullYear());
  } else if (isRegExp(value)) {
    // value: RegExp
    console.log(value.source);
  } else if (isError(value)) {
    // value: Error
    console.log(value.message);
  }
}
```

### Complex Object Validation

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: number;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: number;
}

type Response<T> = ApiResponse<T> | ErrorResponse;

function isSuccessResponse<T>(
  response: Response<T>
): response is ApiResponse<T> {
  return response.success === true;
}

function isErrorResponse<T>(
  response: Response<T>
): response is ErrorResponse {
  return response.success === false;
}

async function fetchData<T>(url: string): Promise<T | null> {
  const response: Response<T> = await fetch(url).then(r => r.json());

  if (isSuccessResponse(response)) {
    // response: ApiResponse<T>
    console.log(`Data fetched successfully, timestamp: ${response.timestamp}`);
    return response.data;
  } else {
    // response: ErrorResponse
    console.error(`Error ${response.code}: ${response.error}`);
    return null;
  }
}
```

### Using this Type Guards

In classes, we can use `this is Type` to create type guard methods:

```typescript
class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  isBird(): this is Bird {
    return this instanceof Bird;
  }

  isFish(): this is Fish {
    return this instanceof Fish;
  }
}

class Bird extends Animal {
  fly() {
    console.log(`${this.name} is flying`);
  }
}

class Fish extends Animal {
  swim() {
    console.log(`${this.name} is swimming`);
  }
}

function moveAnimal(animal: Animal) {
  if (animal.isBird()) {
    // animal: Bird
    animal.fly();
  } else if (animal.isFish()) {
    // animal: Fish
    animal.swim();
  }
}

const sparrow = new Bird("Sparrow");
const salmon = new Fish("Salmon");

moveAnimal(sparrow); // Sparrow is flying
moveAnimal(salmon);  // Salmon is swimming
```

## Assertion Functions

Assertion functions are a feature introduced in TypeScript 3.7. Unlike type guards, assertion functions throw an error when the condition is not met, rather than returning a boolean value.

### The asserts Syntax

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Expected string, but got ${typeof value}`);
  }
}

function processValue(value: unknown) {
  assertIsString(value);
  // From here on, value's type is string
  console.log(value.toUpperCase());
}

try {
  processValue("hello"); // Output: HELLO
  processValue(123);     // Throws error
} catch (e) {
  console.error(e);
}
```

### Asserting Non-null Values

```typescript
function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "Value cannot be null or undefined");
  }
}

function getUser(id: number): { name: string } | null {
  // Simulating database query
  return id === 1 ? { name: "John" } : null;
}

function processUser(id: number) {
  const user = getUser(id);
  assertDefined(user, `User with ID ${id} not found`);
  // user: { name: string }
  console.log(user.name);
}

processUser(1); // Output: John
// processUser(2); // Throws: User with ID 2 not found
```

### Asserting Conditions

```typescript
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function divide(a: number, b: number): number {
  assert(b !== 0, "Divisor cannot be zero");
  // TypeScript now knows b is not 0
  return a / b;
}

console.log(divide(10, 2)); // 5
// divide(10, 0); // Throws: Divisor cannot be zero
```

### Combining Type Checking with Assertions

```typescript
interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

function assertValidConfig(config: unknown): asserts config is Config {
  if (typeof config !== "object" || config === null) {
    throw new Error("Config must be an object");
  }

  const obj = config as Record<string, unknown>;

  if (typeof obj.apiUrl !== "string") {
    throw new Error("apiUrl must be a string");
  }

  if (typeof obj.timeout !== "number" || obj.timeout <= 0) {
    throw new Error("timeout must be a positive number");
  }

  if (typeof obj.retries !== "number" || obj.retries < 0) {
    throw new Error("retries must be a non-negative integer");
  }
}

function initializeApp(config: unknown) {
  assertValidConfig(config);
  // config: Config
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Timeout: ${config.timeout}ms`);
  console.log(`Retries: ${config.retries}`);
}

// Valid config
initializeApp({
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3
});

// Invalid config will throw an error
// initializeApp({ apiUrl: 123 });
```

### Comparing Assertion Functions and Type Guards

```typescript
// Type guard: Returns boolean, requires conditional check
function isPositive(value: number): value is number {
  return value > 0;
}

function processWithGuard(value: number) {
  if (isPositive(value)) {
    // Here value is considered positive
    console.log(Math.sqrt(value));
  } else {
    console.log("Value is not positive");
  }
}

// Assertion function: Throws exception, subsequent code uses narrowed type directly
function assertPositive(value: number): asserts value is number {
  if (value <= 0) {
    throw new Error("Value must be positive");
  }
}

function processWithAssertion(value: number) {
  assertPositive(value);
  // From here on, value is considered positive
  console.log(Math.sqrt(value));
}
```

## Discriminated Unions

Discriminated unions are a powerful pattern that combines union types and literal types, using a common "tag" property to distinguish different types.

### Basic Pattern

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape: Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape: Rectangle
      return shape.width * shape.height;
    case "triangle":
      // shape: Triangle
      return (shape.base * shape.height) / 2;
  }
}

const circle: Circle = { kind: "circle", radius: 5 };
const rectangle: Rectangle = { kind: "rectangle", width: 10, height: 5 };
const triangle: Triangle = { kind: "triangle", base: 8, height: 6 };

console.log(calculateArea(circle));    // 78.54...
console.log(calculateArea(rectangle)); // 50
console.log(calculateArea(triangle));  // 24
```

### Exhaustiveness Checking

Use the `never` type to ensure all possible cases are handled:

```typescript
function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}

function getShapeDescription(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `A circle with radius ${shape.radius}`;
    case "rectangle":
      return `A ${shape.width} x ${shape.height} rectangle`;
    case "triangle":
      return `A triangle with base ${shape.base} and height ${shape.height}`;
    default:
      // If a new shape type is added but not handled, this will cause a compile error
      return assertNever(shape);
  }
}
```

### Application in State Management

```typescript
interface LoadingState {
  status: "loading";
}

interface SuccessState<T> {
  status: "success";
  data: T;
}

interface ErrorState {
  status: "error";
  error: string;
}

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

function renderState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case "loading":
      return "Loading...";
    case "success":
      return `Data: ${JSON.stringify(state.data)}`;
    case "error":
      return `Error: ${state.error}`;
  }
}

// Practical application example
interface User {
  id: number;
  name: string;
}

type UserState = AsyncState<User>;

function UserComponent(state: UserState) {
  if (state.status === "loading") {
    return "<div>Loading user information...</div>";
  }

  if (state.status === "error") {
    return `<div class="error">Failed to load: ${state.error}</div>`;
  }

  // state: SuccessState<User>
  return `<div>Welcome, ${state.data.name}!</div>`;
}

// Usage examples
const loadingState: UserState = { status: "loading" };
const successState: UserState = { status: "success", data: { id: 1, name: "John" } };
const errorState: UserState = { status: "error", error: "Network error" };

console.log(UserComponent(loadingState)); // <div>Loading user information...</div>
console.log(UserComponent(successState)); // <div>Welcome, John!</div>
console.log(UserComponent(errorState));   // <div class="error">Failed to load: Network error</div>
```

### Redux Action Pattern

```typescript
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

interface DeleteTodoAction {
  type: "DELETE_TODO";
  payload: {
    id: number;
  };
}

interface ClearCompletedAction {
  type: "CLEAR_COMPLETED";
}

type TodoAction =
  | AddTodoAction
  | ToggleTodoAction
  | DeleteTodoAction
  | ClearCompletedAction;

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case "ADD_TODO":
      // action: AddTodoAction
      return [
        ...state,
        {
          id: action.payload.id,
          text: action.payload.text,
          completed: false,
        },
      ];

    case "TOGGLE_TODO":
      // action: ToggleTodoAction
      return state.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );

    case "DELETE_TODO":
      // action: DeleteTodoAction
      return state.filter(todo => todo.id !== action.payload.id);

    case "CLEAR_COMPLETED":
      // action: ClearCompletedAction
      return state.filter(todo => !todo.completed);
  }
}
```

### Multiple Discriminant Properties

Sometimes one discriminant property isn't enough; you can use multiple:

```typescript
interface HttpRequest {
  protocol: "http";
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
}

interface WebSocketRequest {
  protocol: "ws";
  action: "connect" | "disconnect" | "message";
  channel: string;
}

interface GrpcRequest {
  protocol: "grpc";
  service: string;
  method: string;
}

type NetworkRequest = HttpRequest | WebSocketRequest | GrpcRequest;

function handleRequest(request: NetworkRequest) {
  switch (request.protocol) {
    case "http":
      // request: HttpRequest
      console.log(`HTTP ${request.method} ${request.url}`);
      break;
    case "ws":
      // request: WebSocketRequest
      console.log(`WebSocket ${request.action} on ${request.channel}`);
      break;
    case "grpc":
      // request: GrpcRequest
      console.log(`gRPC ${request.service}.${request.method}`);
      break;
  }
}
```

### Nested Discriminated Unions

```typescript
interface TextMessage {
  type: "message";
  messageType: "text";
  content: string;
}

interface ImageMessage {
  type: "message";
  messageType: "image";
  url: string;
  width: number;
  height: number;
}

interface JoinNotification {
  type: "notification";
  notificationType: "join";
  userId: string;
  timestamp: Date;
}

interface LeaveNotification {
  type: "notification";
  notificationType: "leave";
  userId: string;
  timestamp: Date;
}

type Message = TextMessage | ImageMessage;
type Notification = JoinNotification | LeaveNotification;
type ChatEvent = Message | Notification;

function handleChatEvent(event: ChatEvent) {
  if (event.type === "message") {
    // event: Message (TextMessage | ImageMessage)
    if (event.messageType === "text") {
      // event: TextMessage
      console.log(`Text message: ${event.content}`);
    } else {
      // event: ImageMessage
      console.log(`Image message: ${event.url} (${event.width}x${event.height})`);
    }
  } else {
    // event: Notification (JoinNotification | LeaveNotification)
    if (event.notificationType === "join") {
      // event: JoinNotification
      console.log(`User ${event.userId} joined the chat`);
    } else {
      // event: LeaveNotification
      console.log(`User ${event.userId} left the chat`);
    }
  }
}
```

## Advanced Type Guard Techniques

### Combining Multiple Type Guards

```typescript
interface Dog {
  type: "dog";
  bark: () => void;
}

interface Cat {
  type: "cat";
  meow: () => void;
}

interface Bird {
  type: "bird";
  fly: () => void;
}

type Pet = Dog | Cat | Bird;

function isDog(pet: Pet): pet is Dog {
  return pet.type === "dog";
}

function isCat(pet: Pet): pet is Cat {
  return pet.type === "cat";
}

function isBird(pet: Pet): pet is Bird {
  return pet.type === "bird";
}

// Combining type guards
function isDogOrCat(pet: Pet): pet is Dog | Cat {
  return isDog(pet) || isCat(pet);
}

function handlePet(pet: Pet) {
  if (isDogOrCat(pet)) {
    // pet: Dog | Cat
    if (isDog(pet)) {
      pet.bark();
    } else {
      pet.meow();
    }
  } else {
    // pet: Bird
    pet.fly();
  }
}
```

### Type Guards with Mapped Types

```typescript
type EventMap = {
  click: { x: number; y: number };
  keypress: { key: string; code: number };
  scroll: { scrollTop: number; scrollLeft: number };
};

type EventName = keyof EventMap;

interface Event<T extends EventName> {
  type: T;
  data: EventMap[T];
}

type AnyEvent = Event<"click"> | Event<"keypress"> | Event<"scroll">;

function isEventType<T extends EventName>(
  event: AnyEvent,
  type: T
): event is Event<T> {
  return event.type === type;
}

function handleEvent(event: AnyEvent) {
  if (isEventType(event, "click")) {
    // event: Event<"click">
    console.log(`Click position: (${event.data.x}, ${event.data.y})`);
  } else if (isEventType(event, "keypress")) {
    // event: Event<"keypress">
    console.log(`Key pressed: ${event.data.key} (${event.data.code})`);
  } else {
    // event: Event<"scroll">
    console.log(`Scroll: ${event.data.scrollTop}, ${event.data.scrollLeft}`);
  }
}
```

### Type Guard Factory Functions

```typescript
// Create a property check type guard
function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === "object" && obj !== null && key in obj;
}

// Create a type check type guard
function hasPropertyOfType<K extends string, T>(
  obj: unknown,
  key: K,
  typeCheck: (value: unknown) => value is T
): obj is Record<K, T> {
  return hasProperty(obj, key) && typeCheck(obj[key]);
}

// Primitive type checkers
const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

// Usage example
function processData(data: unknown) {
  if (
    hasPropertyOfType(data, "name", isString) &&
    hasPropertyOfType(data, "age", isNumber)
  ) {
    // data: Record<"name", string> & Record<"age", number>
    console.log(`${data.name} is ${data.age} years old`);
  }
}

processData({ name: "John", age: 25 }); // John is 25 years old
```

### Recursive Type Guards

```typescript
interface TreeNode {
  value: number;
  left?: TreeNode;
  right?: TreeNode;
}

function isTreeNode(value: unknown): value is TreeNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.value !== "number") {
    return false;
  }

  // Recursively check child nodes
  if (obj.left !== undefined && !isTreeNode(obj.left)) {
    return false;
  }

  if (obj.right !== undefined && !isTreeNode(obj.right)) {
    return false;
  }

  return true;
}

// Usage example
const tree: unknown = {
  value: 1,
  left: {
    value: 2,
    left: { value: 4 },
    right: { value: 5 }
  },
  right: {
    value: 3
  }
};

if (isTreeNode(tree)) {
  console.log("Valid tree structure");
  console.log("Root value:", tree.value);
}
```

## Practical Examples

### Form Validation

```typescript
interface FormData {
  username?: string;
  email?: string;
  age?: number;
  password?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

type ValidationResult =
  | { valid: true; data: Required<FormData> }
  | { valid: false; errors: ValidationError[] };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(data: FormData): ValidationResult {
  const errors: ValidationError[] = [];

  // Check username
  if (!data.username || data.username.length < 3) {
    errors.push({
      field: "username",
      message: "Username must be at least 3 characters"
    });
  }

  // Check email
  if (!data.email || !isValidEmail(data.email)) {
    errors.push({
      field: "email",
      message: "Invalid email format"
    });
  }

  // Check age
  if (data.age === undefined || data.age < 0 || data.age > 150) {
    errors.push({
      field: "age",
      message: "Age must be between 0 and 150"
    });
  }

  // Check password
  if (!data.password || data.password.length < 8) {
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters"
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as Required<FormData>
  };
}

// Usage example
function handleSubmit(formData: FormData) {
  const result = validateForm(formData);

  if (result.valid) {
    // result.data: Required<FormData>
    console.log(`Registration successful: ${result.data.username}`);
    console.log(`Email: ${result.data.email}`);
  } else {
    // result.errors: ValidationError[]
    result.errors.forEach(error => {
      console.error(`${error.field}: ${error.message}`);
    });
  }
}
```

### API Response Handling

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

interface SingleResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

type ApiResponse<T> = SingleResponse<T> | PaginatedResponse<T> | ErrorResponse;

function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SingleResponse<T> | PaginatedResponse<T> {
  return response.success === true;
}

function isPaginatedResponse<T>(
  response: ApiResponse<T>
): response is PaginatedResponse<T> {
  return response.success === true && "pagination" in response;
}

function isSingleResponse<T>(
  response: ApiResponse<T>
): response is SingleResponse<T> {
  return response.success === true && !("pagination" in response);
}

async function fetchUsers(): Promise<User[] | null> {
  const response: ApiResponse<User> = await fetch("/api/users").then(r => r.json());

  if (!isSuccessResponse(response)) {
    console.error(`Error ${response.error.code}: ${response.error.message}`);
    return null;
  }

  if (isPaginatedResponse(response)) {
    console.log(`Page ${response.pagination.page}, total ${response.pagination.total} records`);
    return response.data;
  }

  // Single response, wrap in array
  return [response.data];
}
```

### Event Handling System

```typescript
interface MouseClickEvent {
  type: "click";
  button: "left" | "right" | "middle";
  x: number;
  y: number;
  target: HTMLElement;
}

interface KeyboardEvent {
  type: "keydown" | "keyup";
  key: string;
  code: string;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
}

interface TouchEvent {
  type: "touchstart" | "touchmove" | "touchend";
  touches: Array<{ x: number; y: number }>;
}

interface CustomEvent<T = unknown> {
  type: "custom";
  name: string;
  data: T;
}

type AppEvent = MouseClickEvent | KeyboardEvent | TouchEvent | CustomEvent;

function isMouseEvent(event: AppEvent): event is MouseClickEvent {
  return event.type === "click";
}

function isKeyboardEvent(event: AppEvent): event is KeyboardEvent {
  return event.type === "keydown" || event.type === "keyup";
}

function isTouchEvent(event: AppEvent): event is TouchEvent {
  return event.type === "touchstart" ||
         event.type === "touchmove" ||
         event.type === "touchend";
}

function isCustomEvent<T>(
  event: AppEvent,
  name?: string
): event is CustomEvent<T> {
  if (event.type !== "custom") return false;
  if (name && (event as CustomEvent).name !== name) return false;
  return true;
}

class EventEmitter {
  private handlers: Array<(event: AppEvent) => void> = [];

  on(handler: (event: AppEvent) => void) {
    this.handlers.push(handler);
  }

  emit(event: AppEvent) {
    this.handlers.forEach(handler => handler(event));
  }
}

// Usage example
const emitter = new EventEmitter();

emitter.on((event) => {
  if (isMouseEvent(event)) {
    console.log(`Mouse ${event.button} button click: (${event.x}, ${event.y})`);
  } else if (isKeyboardEvent(event)) {
    const modifiers = [];
    if (event.modifiers.ctrl) modifiers.push("Ctrl");
    if (event.modifiers.shift) modifiers.push("Shift");
    if (event.modifiers.alt) modifiers.push("Alt");
    const prefix = modifiers.length > 0 ? modifiers.join("+") + "+" : "";
    console.log(`Key ${event.type}: ${prefix}${event.key}`);
  } else if (isTouchEvent(event)) {
    console.log(`Touch event ${event.type}: ${event.touches.length} touch points`);
  } else if (isCustomEvent<{ userId: number }>(event, "userLogin")) {
    console.log(`User login: ${event.data.userId}`);
  }
});
```

## Common Pitfalls and Best Practices

### Pitfall 1: Type Guards Don't Validate Runtime Types

```typescript
// Dangerous type guard - not strict enough
function isUser(value: unknown): value is User {
  // This check is not strict enough!
  return value !== null && typeof value === "object";
}

// Safer version
function isUserSafe(value: unknown): value is User {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.email === "string"
  );
}

// Safest version - using a runtime validation library like Zod
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

function isUserWithZod(value: unknown): value is User {
  return UserSchema.safeParse(value).success;
}
```

### Pitfall 2: Ignoring null Checks

```typescript
function processElement(element: HTMLElement | null) {
  // Error: could be null
  // element.style.color = "red";

  // Correct approach 1: Conditional check
  if (element) {
    element.style.color = "red";
  }

  // Correct approach 2: Use assertion
  if (element === null) {
    throw new Error("Element does not exist");
  }
  element.style.color = "red";

  // Correct approach 3: Optional chaining
  element?.style && (element.style.color = "red");
}
```

### Pitfall 3: typeof null Returns "object"

```typescript
function processValue(value: object | null) {
  if (typeof value === "object") {
    // Note: value could still be null!
    // value.toString(); // Runtime error
  }

  // Correct approach
  if (value !== null && typeof value === "object") {
    value.toString(); // Safe
  }
}
```

### Pitfall 4: Type Assertions in Type Guards

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  size: number;
}

type Shape = Circle | Square;

// Wrong: Using type assertion to bypass checks
function isCircle(shape: Shape): shape is Circle {
  // Using assertion here, but not actually checking
  return true; // Always returns true!
}

// Correct: Actually check the type
function isCircleCorrect(shape: Shape): shape is Circle {
  return shape.kind === "circle";
}
```

### Best Practices Summary

```typescript
// 1. Create reusable functions for common type guards
function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

// 2. Use detailed error messages
function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== "number") {
    throw new TypeError(
      `Expected number type, but received ${typeof value}: ${JSON.stringify(value)}`
    );
  }
}

// 3. Use exhaustiveness checking to ensure all cases are handled
function exhaustiveCheck(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

// 4. Prefer type guards over type assertions
// Not recommended
function processInputBad(input: unknown) {
  const str = input as string;
  return str.toUpperCase(); // Runtime error if input is not a string
}

// Recommended
function processInputGood(input: unknown) {
  if (typeof input === "string") {
    return input.toUpperCase();
  }
  throw new Error("Input must be a string");
}

// 5. Use literal types for discriminated unions
type Result =
  | { status: "loading" }
  | { status: "success"; data: unknown }
  | { status: "error"; error: string };

// 6. Avoid overusing non-null assertions
// Not recommended
function getUserBad(id: number) {
  const user = users.find(u => u.id === id)!;
  return user.name; // Will crash if user not found
}

// Recommended
function getUserGood(id: number) {
  const user = users.find(u => u.id === id);
  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }
  return user.name;
}
```

## Summary

Type guards are an essential part of TypeScript's type system. They help us:

1. **Improve type safety**: Validate types at runtime to ensure code correctness
2. **Enhance developer experience**: Get more precise type inference and intelligent suggestions
3. **Write clearer code**: Clearly express the intent of type checking
4. **Handle complex type scenarios**: Use discriminated unions and custom type guards to handle complex business logic

Mastering type guards allows you to write more robust and maintainable TypeScript code. In practice, choose the appropriate type guard approach based on the specific scenario:

| Scenario | Recommended Approach |
|----------|---------------------|
| Primitive type checking | `typeof` |
| Class instance checking | `instanceof` |
| Object property checking | `in` operator |
| Complex type validation | Custom type guards |
| Required conditions | Assertion functions |
| Union type branching | Discriminated unions pattern |

Remember, the core purpose of type guards is to help the TypeScript compiler understand your code's intent, thereby providing better type inference and error checking. Using these techniques properly can significantly improve code quality and development efficiency.
