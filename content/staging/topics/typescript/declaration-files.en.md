---
title: Declaration Files
description: "A Complete Guide to TypeScript Declaration Files: .d.ts Files, Type Declarations, and DefinitelyTyped"
track: typescript
section: type-system
difficulty: advanced
tags:
  - TypeScript
  - Declaration Files
  - .d.ts
  - Type Definitions
status: imported
origin: old/src/content/docs/typescript/declaration-files.en.md
divergence: 0.219
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 9
  lastUpdated: 2026-01-07
---

Declaration files are a crucial component of the TypeScript ecosystem. They provide type information for JavaScript code, enabling the TypeScript compiler to understand and type-check code that originally had no type annotations. We'll cover every aspect of declaration files in depth.

## What Are Declaration Files

Declaration Files are special TypeScript files with the `.d.ts` extension. They contain only type declarations without any actual implementation code. The main purposes of declaration files are:

1. **Provide type information for JavaScript libraries** - Enable TypeScript to understand the type structure of JavaScript code
2. **Provide IDE intellisense** - Improve developer experience with auto-completion and documentation hints
3. **Enable type checking** - Catch potential type errors at compile time
4. **Serve as API documentation** - Clearly describe a module's public interface

### Declaration Files vs Regular TypeScript Files

```typescript
// Regular TypeScript file (.ts)
// Contains types and implementation
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Declaration file (.d.ts)
// Contains only type declarations, no implementation
declare function greet(name: string): string;
```

### Basic Structure of .d.ts Files

```typescript
// math.js (JavaScript implementation)
export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export const PI = 3.14159;
```

```typescript
// math.d.ts (corresponding type declarations)
export function add(a: number, b: number): number;
export function multiply(a: number, b: number): number;
export const PI: number;
```

## The declare Keyword

The `declare` keyword tells the TypeScript compiler that a variable, function, class, or module exists elsewhere (usually in JavaScript code), and the compiler should trust these declarations without needing to see the actual implementation.

### Declaring Variables

```typescript
// Declare global variables
declare const API_URL: string;
declare let DEBUG_MODE: boolean;
declare var VERSION: string;

// Declare read-only configuration object
declare const CONFIG: {
  readonly apiKey: string;
  readonly timeout: number;
  readonly retries: number;
};

// Use these variables
console.log(API_URL);  // TypeScript knows this is string type
if (DEBUG_MODE) {
  console.log(`Version: ${VERSION}`);
}
```

### Declaring Functions

```typescript
// Declare simple function signatures
declare function $(selector: string): HTMLElement;
declare function ajax(url: string, options?: AjaxOptions): Promise<Response>;

// Function overload declarations
declare function createElement(tag: 'div'): HTMLDivElement;
declare function createElement(tag: 'span'): HTMLSpanElement;
declare function createElement(tag: 'input'): HTMLInputElement;
declare function createElement(tag: 'canvas'): HTMLCanvasElement;
declare function createElement(tag: string): HTMLElement;

// Function with callbacks
declare function fetchData<T>(
  url: string,
  callback: (error: Error | null, data: T) => void
): void;

// Function with optional parameters and default values
declare function request(
  url: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string | FormData;
    timeout?: number;
  }
): Promise<Response>;
```

### Declaring Classes

```typescript
// Basic class declaration
declare class EventEmitter {
  constructor();
  on(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
  off(event: string, listener: (...args: any[]) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string): this;
}

// Class with static members
declare class Logger {
  static level: 'debug' | 'info' | 'warn' | 'error';
  static getInstance(): Logger;
  static setLevel(level: Logger['level']): void;

  private constructor();
  log(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: Error): void;
}

// Class with generics
declare class Collection<T> {
  constructor(items?: T[]);
  add(item: T): this;
  remove(item: T): boolean;
  find(predicate: (item: T) => boolean): T | undefined;
  filter(predicate: (item: T) => boolean): Collection<T>;
  map<U>(mapper: (item: T) => U): Collection<U>;
  toArray(): T[];
  readonly length: number;
}

// Abstract class declaration
declare abstract class Component<P = {}, S = {}> {
  props: Readonly<P>;
  state: Readonly<S>;
  constructor(props: P);
  abstract render(): string;
  setState(state: Partial<S>): void;
  forceUpdate(): void;
}
```

### Declaring Interfaces and Types

In declaration files, `interface` and `type` don't need the `declare` keyword:

```typescript
// Interface declarations
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Nested interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

// Type aliases
type ID = string | number;
type Callback<T> = (error: Error | null, result: T) => void;
type AsyncCallback<T> = (error: Error | null, result: T) => Promise<void>;

// Complex types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
type EventHandler<E extends Event = Event> = (event: E) => void;

// Enums require the declare keyword
declare enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// Const enums
declare const enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT'
}
```

## Ambient Declarations

Ambient declarations describe code structures defined outside of TypeScript, such as browser APIs, Node.js global objects, or third-party JavaScript libraries.

### Global Variable Declarations

```typescript
// globals.d.ts
// Declare global variables in the browser
declare const __DEV__: boolean;
declare const __PROD__: boolean;
declare const __VERSION__: string;
declare const __BUILD_TIME__: string;

// Declare process object (Node.js style)
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    API_URL?: string;
    DEBUG?: string;
    [key: string]: string | undefined;
  };
  platform: string;
  version: string;
  cwd(): string;
  exit(code?: number): never;
};

// Extend Window interface
interface Window {
  // Custom analytics tool
  analytics: {
    track(event: string, properties?: Record<string, any>): void;
    identify(userId: string, traits?: Record<string, any>): void;
    page(name?: string, properties?: Record<string, any>): void;
  };

  // Redux DevTools
  __REDUX_DEVTOOLS_EXTENSION__?: () => any;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof Function;

  // Custom app configuration
  APP_CONFIG: {
    apiEndpoint: string;
    features: Record<string, boolean>;
  };
}

// Now you can use these safely
window.analytics.track('page_view', { page: '/home' });
console.log(window.APP_CONFIG.apiEndpoint);
```

### Global Functions and Namespaces

```typescript
// Declare global functions
declare function requestIdleCallback(
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout: number }
): number;

declare function cancelIdleCallback(handle: number): void;

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining(): number;
}

// Declare performance-related APIs
declare function queueMicrotask(callback: () => void): void;

declare function structuredClone<T>(value: T, options?: StructuredSerializeOptions): T;

interface StructuredSerializeOptions {
  transfer?: ArrayBuffer[];
}

// Declare namespace to extend Node.js environment
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    JWT_SECRET?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
  }

  interface Process {
    browser?: boolean;
  }
}
```

### declare global

When declaring global types in a module file, you need to use `declare global`:

```typescript
// This is a module file (because it has import/export)
import type { User } from './types';

// Extend global scope
declare global {
  // Extend Array prototype
  interface Array<T> {
    /**
     * Returns the first element of the array
     */
    first(): T | undefined;

    /**
     * Returns the last element of the array
     */
    last(): T | undefined;

    /**
     * Groups elements by a specified key
     */
    groupBy<K extends string | number>(
      keySelector: (item: T) => K
    ): Record<K, T[]>;

    /**
     * Removes duplicates
     */
    unique(): T[];
  }

  // Extend String prototype
  interface String {
    /**
     * Truncates the string
     */
    truncate(length: number, suffix?: string): string;

    /**
     * Converts to URL-friendly slug
     */
    slugify(): string;
  }

  // Add global variables
  var currentUser: User | null;
  var appVersion: string;

  // Extend Window
  interface Window {
    myApp: {
      version: string;
      init(): void;
      destroy(): void;
    };
  }

  // Add global functions
  function formatCurrency(amount: number, currency?: string): string;
}

// Must export to make this a module
export {};
```

### Practical Applications of Ambient Declarations

```typescript
// env.d.ts - Declare environment variable types for Vite projects
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declare static asset modules
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '*.md' {
  const content: string;
  export default content;
}
```

## Module Declarations

Module declarations provide type information for JavaScript modules that don't have type definitions.

### Declaring External Modules

```typescript
// lodash.d.ts - Create complete type declarations for lodash library
declare module 'lodash' {
  // Array methods
  export function chunk<T>(array: T[], size: number): T[][];
  export function compact<T>(array: (T | null | undefined | false | '' | 0)[]): T[];
  export function uniq<T>(array: T[]): T[];
  export function uniqBy<T>(array: T[], iteratee: keyof T | ((item: T) => any)): T[];
  export function flatten<T>(array: (T | T[])[]): T[];
  export function flattenDeep<T>(array: any[]): T[];
  export function difference<T>(array: T[], ...values: T[][]): T[];
  export function intersection<T>(...arrays: T[][]): T[];

  // Object methods
  export function pick<T extends object, K extends keyof T>(
    object: T,
    ...keys: K[]
  ): Pick<T, K>;
  export function omit<T extends object, K extends keyof T>(
    object: T,
    ...keys: K[]
  ): Omit<T, K>;
  export function merge<T, S>(object: T, source: S): T & S;
  export function cloneDeep<T>(value: T): T;

  // Function utilities
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: DebounceSettings
  ): DebouncedFunc<T>;

  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: ThrottleSettings
  ): DebouncedFunc<T>;

  export function memoize<T extends (...args: any[]) => any>(
    func: T,
    resolver?: (...args: Parameters<T>) => any
  ): T & { cache: Map<any, ReturnType<T>> };

  interface DebounceSettings {
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
  }

  interface ThrottleSettings {
    leading?: boolean;
    trailing?: boolean;
  }

  interface DebouncedFunc<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T> | undefined;
    cancel(): void;
    flush(): ReturnType<T> | undefined;
    pending(): boolean;
  }

  // String methods
  export function camelCase(string?: string): string;
  export function snakeCase(string?: string): string;
  export function kebabCase(string?: string): string;
  export function capitalize(string?: string): string;
  export function startCase(string?: string): string;
}
```

### Declaring Modules with Multiple Export Styles

```typescript
// axios.d.ts - Supporting both default and named exports
declare module 'axios' {
  export interface AxiosRequestConfig<D = any> {
    url?: string;
    method?: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options';
    baseURL?: string;
    headers?: Record<string, string>;
    params?: any;
    data?: D;
    timeout?: number;
    withCredentials?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    signal?: AbortSignal;
    onUploadProgress?: (progressEvent: ProgressEvent) => void;
    onDownloadProgress?: (progressEvent: ProgressEvent) => void;
  }

  export interface AxiosResponse<T = any, D = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: AxiosRequestConfig<D>;
    request?: any;
  }

  export interface AxiosError<T = any, D = any> extends Error {
    config: AxiosRequestConfig<D>;
    code?: string;
    request?: any;
    response?: AxiosResponse<T, D>;
    isAxiosError: true;
    toJSON: () => object;
  }

  export interface AxiosInstance {
    defaults: AxiosRequestConfig;
    interceptors: {
      request: AxiosInterceptorManager<AxiosRequestConfig>;
      response: AxiosInterceptorManager<AxiosResponse>;
    };

    <T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
    <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;

    get<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    delete<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    head<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    post<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    put<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    patch<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  }

  export interface AxiosInterceptorManager<V> {
    use(
      onFulfilled?: (value: V) => V | Promise<V>,
      onRejected?: (error: any) => any
    ): number;
    eject(id: number): void;
    clear(): void;
  }

  export function create(config?: AxiosRequestConfig): AxiosInstance;
  export function isAxiosError(payload: any): payload is AxiosError;
  export function isCancel(value: any): boolean;

  const axios: AxiosInstance & {
    create: typeof create;
    isAxiosError: typeof isAxiosError;
    isCancel: typeof isCancel;
    CancelToken: CancelTokenStatic;
    Cancel: CancelStatic;
    all: typeof Promise.all;
    spread: <T, R>(callback: (...args: T[]) => R) => (array: T[]) => R;
  };

  export interface CancelTokenStatic {
    new (executor: (cancel: (message?: string) => void) => void): CancelToken;
    source(): CancelTokenSource;
  }

  export interface CancelToken {
    promise: Promise<Cancel>;
    reason?: Cancel;
    throwIfRequested(): void;
  }

  export interface CancelTokenSource {
    token: CancelToken;
    cancel: (message?: string) => void;
  }

  export interface CancelStatic {
    new (message?: string): Cancel;
  }

  export interface Cancel {
    message: string;
  }

  export default axios;
}
```

### Wildcard Module Declarations

For non-JavaScript resources, you can use wildcard module declarations:

```typescript
// assets.d.ts - Declare various static asset types

// Image modules
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

// SVG can be imported as a component (React projects)
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

// Style modules (CSS Modules)
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Regular style files
declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

// JSON and YAML modules
declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*.yaml' {
  const value: any;
  export default value;
}

declare module '*.yml' {
  const value: any;
  export default value;
}

// Text files
declare module '*.txt' {
  const content: string;
  export default content;
}

declare module '*.md' {
  const content: string;
  export default content;
}

// Web Worker
declare module '*.worker.ts' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

// Now you can import like this:
// import logo from './logo.png';
// import styles from './styles.module.css';
// import Icon, { ReactComponent as IconComponent } from './icon.svg';
// import config from './config.json';
```

### Module Augmentation

Module augmentation allows you to extend existing module type definitions:

```typescript
// express-augmentation.d.ts - Extending Express types
import 'express';

declare module 'express' {
  // Extend Request interface
  interface Request {
    // User authentication info
    user?: {
      id: string;
      email: string;
      role: 'admin' | 'user' | 'guest';
      permissions: string[];
    };

    // Session info
    session: {
      token: string;
      expiresAt: Date;
      data: Record<string, any>;
    };

    // Request tracking
    requestId: string;
    startTime: number;
  }

  // Extend Response interface
  interface Response {
    // Success response
    success<T>(data: T, message?: string): void;

    // Paginated response
    paginate<T>(data: T[], page: number, limit: number, total: number): void;

    // Error response
    error(message: string, code?: number, details?: any): void;
  }

  // Extend Application interface
  interface Application {
    // Custom configuration
    config: {
      port: number;
      env: string;
      database: {
        host: string;
        port: number;
        name: string;
      };
    };
  }
}

// Usage example
import express, { Request, Response } from 'express';

const app = express();

app.get('/user', (req: Request, res: Response) => {
  if (req.user) {
    res.success({ user: req.user });
  } else {
    res.error('Unauthorized', 401);
  }
});
```

```typescript
// vue-augmentation.d.ts - Extending Vue types
import 'vue';

declare module 'vue' {
  // Extend component custom properties
  interface ComponentCustomProperties {
    // API client
    $api: {
      get<T>(url: string, params?: Record<string, any>): Promise<T>;
      post<T>(url: string, data?: any): Promise<T>;
      put<T>(url: string, data?: any): Promise<T>;
      delete<T>(url: string): Promise<T>;
    };

    // Date formatting
    $formatDate: (date: Date | string, format?: string) => string;

    // Currency formatting
    $formatCurrency: (amount: number, currency?: string) => string;

    // Toast notifications
    $toast: {
      success(message: string): void;
      error(message: string): void;
      warning(message: string): void;
      info(message: string): void;
    };

    // Confirmation dialog
    $confirm: (message: string, title?: string) => Promise<boolean>;
  }

  // Extend global components
  interface GlobalComponents {
    BaseButton: typeof import('./components/BaseButton.vue').default;
    BaseInput: typeof import('./components/BaseInput.vue').default;
    BaseModal: typeof import('./components/BaseModal.vue').default;
  }
}

export {};
```

## Namespace Declarations

Namespaces are used to organize and group related type declarations:

```typescript
// jquery.d.ts - jQuery complete type declaration example
declare namespace JQuery {
  // Ajax-related types
  interface AjaxSettings {
    url?: string;
    type?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    dataType?: 'json' | 'xml' | 'html' | 'text' | 'script';
    contentType?: string | false;
    headers?: Record<string, string>;
    timeout?: number;
    async?: boolean;
    cache?: boolean;
    crossDomain?: boolean;
    success?: (data: any, textStatus: string, jqXHR: JQueryXHR) => void;
    error?: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => void;
    complete?: (jqXHR: JQueryXHR, textStatus: string) => void;
    beforeSend?: (jqXHR: JQueryXHR, settings: AjaxSettings) => boolean | void;
  }

  interface JQueryXHR extends XMLHttpRequest {
    responseJSON?: any;
    abort(statusText?: string): void;
    done(callback: (data: any, textStatus: string, jqXHR: JQueryXHR) => void): JQueryXHR;
    fail(callback: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => void): JQueryXHR;
    always(callback: () => void): JQueryXHR;
  }

  // Event-related types
  interface Event {
    type: string;
    target: Element;
    currentTarget: Element;
    delegateTarget: Element;
    timeStamp: number;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
    isDefaultPrevented(): boolean;
    isPropagationStopped(): boolean;
    isImmediatePropagationStopped(): boolean;
  }

  interface MouseEvent extends Event {
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
    which: number;
    button: number;
  }

  interface KeyboardEvent extends Event {
    key: string;
    keyCode: number;
    charCode: number;
    which: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
  }

  // jQuery static methods
  interface JQueryStatic {
    // Selectors
    (selector: string): JQuery;
    (selector: string, context: Element | JQuery): JQuery;
    (element: Element): JQuery;
    (elements: Element[]): JQuery;
    (html: string): JQuery;
    (callback: () => void): JQuery;

    // Ajax
    ajax(settings: AjaxSettings): JQueryXHR;
    ajax(url: string, settings?: AjaxSettings): JQueryXHR;
    get(url: string, data?: any, callback?: (data: any) => void, dataType?: string): JQueryXHR;
    post(url: string, data?: any, callback?: (data: any) => void, dataType?: string): JQueryXHR;
    getJSON(url: string, data?: any, callback?: (data: any) => void): JQueryXHR;

    // Utility functions
    extend<T, U>(target: T, source: U): T & U;
    extend<T, U, V>(target: T, source1: U, source2: V): T & U & V;
    each<T>(array: T[], callback: (index: number, item: T) => boolean | void): T[];
    each<T>(object: T, callback: (key: keyof T, value: T[keyof T]) => boolean | void): T;
    map<T, U>(array: T[], callback: (item: T, index: number) => U): U[];
    grep<T>(array: T[], callback: (item: T, index: number) => boolean, invert?: boolean): T[];
    inArray<T>(value: T, array: T[], fromIndex?: number): number;
    isArray(obj: any): obj is any[];
    isFunction(obj: any): obj is Function;
    isPlainObject(obj: any): boolean;
    trim(str: string): string;

    // Deferred
    Deferred<T>(): JQueryDeferred<T>;
    when<T>(...deferreds: Array<T | JQueryPromise<T>>): JQueryPromise<T>;
  }

  // jQuery instance methods
  interface JQuery {
    length: number;
    [index: number]: Element;

    // Traversal
    each(callback: (index: number, element: Element) => boolean | void): JQuery;
    map<T>(callback: (index: number, element: Element) => T): JQuery;
    find(selector: string): JQuery;
    filter(selector: string): JQuery;
    filter(callback: (index: number, element: Element) => boolean): JQuery;
    first(): JQuery;
    last(): JQuery;
    eq(index: number): JQuery;
    parent(selector?: string): JQuery;
    parents(selector?: string): JQuery;
    children(selector?: string): JQuery;
    siblings(selector?: string): JQuery;
    closest(selector: string): JQuery;

    // DOM manipulation
    text(): string;
    text(value: string | number): JQuery;
    html(): string;
    html(value: string): JQuery;
    val(): string;
    val(value: string | number | string[]): JQuery;
    attr(name: string): string | undefined;
    attr(name: string, value: string | number): JQuery;
    attr(attributes: Record<string, string | number>): JQuery;
    prop(name: string): any;
    prop(name: string, value: any): JQuery;
    data(key: string): any;
    data(key: string, value: any): JQuery;

    // CSS
    css(name: string): string;
    css(name: string, value: string | number): JQuery;
    css(properties: Record<string, string | number>): JQuery;
    addClass(className: string): JQuery;
    removeClass(className?: string): JQuery;
    toggleClass(className: string, state?: boolean): JQuery;
    hasClass(className: string): boolean;

    // Events
    on(event: string, handler: (event: Event) => void): JQuery;
    on(event: string, selector: string, handler: (event: Event) => void): JQuery;
    off(event?: string, handler?: (event: Event) => void): JQuery;
    trigger(event: string, extraParameters?: any): JQuery;
    click(handler?: (event: MouseEvent) => void): JQuery;
    submit(handler?: (event: Event) => void): JQuery;
    focus(handler?: (event: Event) => void): JQuery;
    blur(handler?: (event: Event) => void): JQuery;

    // Effects
    show(duration?: number | string): JQuery;
    hide(duration?: number | string): JQuery;
    toggle(duration?: number | string): JQuery;
    fadeIn(duration?: number | string): JQuery;
    fadeOut(duration?: number | string): JQuery;
    slideUp(duration?: number | string): JQuery;
    slideDown(duration?: number | string): JQuery;
    animate(properties: Record<string, any>, duration?: number, easing?: string, complete?: () => void): JQuery;

    // DOM insertion
    append(content: string | Element | JQuery): JQuery;
    prepend(content: string | Element | JQuery): JQuery;
    after(content: string | Element | JQuery): JQuery;
    before(content: string | Element | JQuery): JQuery;
    appendTo(target: string | Element | JQuery): JQuery;
    prependTo(target: string | Element | JQuery): JQuery;
    remove(selector?: string): JQuery;
    empty(): JQuery;
    clone(withDataAndEvents?: boolean): JQuery;
  }

  // Promise-related
  interface JQueryPromise<T> {
    then<U>(
      doneCallback: (value: T) => U | JQueryPromise<U>,
      failCallback?: (reason: any) => any
    ): JQueryPromise<U>;
    done(callback: (value: T) => void): JQueryPromise<T>;
    fail(callback: (reason: any) => void): JQueryPromise<T>;
    always(callback: () => void): JQueryPromise<T>;
  }

  interface JQueryDeferred<T> extends JQueryPromise<T> {
    resolve(value?: T): JQueryDeferred<T>;
    reject(reason?: any): JQueryDeferred<T>;
    notify(progress: any): JQueryDeferred<T>;
    promise(): JQueryPromise<T>;
  }
}

declare const $: JQuery.JQueryStatic;
declare const jQuery: JQuery.JQueryStatic;
```

### Nested Namespaces

```typescript
// Application type organization example
declare namespace App {
  // Model layer
  namespace Models {
    interface User {
      id: number;
      username: string;
      email: string;
      profile: UserProfile;
      roles: Role[];
      createdAt: Date;
      updatedAt: Date;
    }

    interface UserProfile {
      firstName: string;
      lastName: string;
      avatar?: string;
      bio?: string;
      location?: string;
    }

    interface Role {
      id: number;
      name: string;
      permissions: Permission[];
    }

    interface Permission {
      id: number;
      resource: string;
      action: 'create' | 'read' | 'update' | 'delete';
    }

    interface Post {
      id: number;
      title: string;
      content: string;
      author: User;
      tags: string[];
      status: 'draft' | 'published' | 'archived';
      publishedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    }

    interface Comment {
      id: number;
      content: string;
      author: User;
      post: Post;
      parentId?: number;
      createdAt: Date;
    }
  }

  // Service layer
  namespace Services {
    interface UserService {
      getUser(id: number): Promise<Models.User>;
      getUserByEmail(email: string): Promise<Models.User | null>;
      createUser(data: Omit<Models.User, 'id' | 'createdAt' | 'updatedAt'>): Promise<Models.User>;
      updateUser(id: number, data: Partial<Models.User>): Promise<Models.User>;
      deleteUser(id: number): Promise<boolean>;
      authenticate(email: string, password: string): Promise<{ user: Models.User; token: string }>;
    }

    interface PostService {
      getPosts(options?: QueryOptions): Promise<PaginatedResult<Models.Post>>;
      getPostById(id: number): Promise<Models.Post>;
      createPost(data: Omit<Models.Post, 'id' | 'author' | 'createdAt' | 'updatedAt'>): Promise<Models.Post>;
      updatePost(id: number, data: Partial<Models.Post>): Promise<Models.Post>;
      deletePost(id: number): Promise<boolean>;
      publishPost(id: number): Promise<Models.Post>;
    }

    interface QueryOptions {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      filters?: Record<string, any>;
    }

    interface PaginatedResult<T> {
      data: T[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }

  // Utility functions
  namespace Utils {
    function formatDate(date: Date, format?: string): string;
    function parseDate(dateString: string, format?: string): Date;
    function generateId(): string;
    function generateUUID(): string;
    function slugify(text: string): string;
    function truncate(text: string, length: number, suffix?: string): string;
    function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): T;
    function throttle<T extends (...args: any[]) => any>(fn: T, wait: number): T;
    function deepClone<T>(obj: T): T;
    function deepMerge<T extends object, U extends object>(target: T, source: U): T & U;
  }

  // Constants
  namespace Constants {
    const API_BASE_URL: string;
    const DEFAULT_PAGE_SIZE: number;
    const MAX_UPLOAD_SIZE: number;
    const SUPPORTED_IMAGE_TYPES: readonly string[];
    const DATE_FORMAT: string;
    const DATETIME_FORMAT: string;
  }
}
```

## DefinitelyTyped

[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) is a massive community-maintained repository containing type declaration files for thousands of JavaScript libraries.

### Installing Type Declarations

```bash
# Install common library type declarations
npm install --save-dev @types/node
npm install --save-dev @types/react @types/react-dom
npm install --save-dev @types/express
npm install --save-dev @types/lodash
npm install --save-dev @types/jest
npm install --save-dev @types/mocha @types/chai

# Install specific version of type declarations
npm install --save-dev @types/node@18
npm install --save-dev @types/react@18

# Search for available type declarations
npm search @types/jquery

# Use npx to quickly find missing types
npx typesync
```

### Type Declaration Version Management

Type declaration versions typically correspond to library versions. Keeping versions synchronized is important:

```json
{
  "dependencies": {
    "lodash": "^4.17.21",
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/lodash": "^4.14.191",
    "@types/express": "^4.17.17",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^18.15.0"
  }
}
```

### Type Declaration Resolution Order

The TypeScript compiler looks for type declarations in the following order:

1. **Built-in declarations** - TypeScript's built-in `lib.d.ts` files
2. **node_modules/@types** - Installed @types packages
3. **typeRoots** - Type root directories configured in tsconfig.json
4. **types** - Type packages specified in tsconfig.json
5. **Project .d.ts files** - Declaration files in the project source code

```json
// tsconfig.json - Configure type resolution
{
  "compilerOptions": {
    // Specify type declaration root directories (default is node_modules/@types)
    "typeRoots": [
      "./typings",
      "./node_modules/@types"
    ],

    // Only include specified type packages (if not specified, includes all packages under typeRoots)
    "types": [
      "node",
      "jest",
      "webpack-env"
    ],

    // Path mapping
    "paths": {
      "@/*": ["./src/*"],
      "@types/*": ["./typings/*"]
    }
  }
}
```

### Handling Missing Type Declarations

When a library doesn't have an available @types package:

```typescript
// Method 1: Create a simple module declaration
// typings/untyped-library.d.ts
declare module 'untyped-library' {
  const lib: any;
  export default lib;
  export = lib;
}

// Method 2: Create more detailed type declarations
// typings/some-library.d.ts
declare module 'some-library' {
  export interface Options {
    debug?: boolean;
    timeout?: number;
  }

  export function init(options?: Options): void;
  export function process(data: string): Promise<string>;

  export class Client {
    constructor(apiKey: string);
    request<T>(endpoint: string): Promise<T>;
  }
}

// Method 3: Use any to quickly bypass
// In the file where you use it
// @ts-ignore
import something from 'completely-untyped';
```

## Creating Declaration Files for JavaScript Libraries

### Basic Steps

1. **Analyze the library's API** - Review documentation, source code, and examples
2. **Create .d.ts files** - Create corresponding declaration files for each module
3. **Test declarations** - Ensure types work correctly
4. **Publish or contribute** - Publish to npm or contribute to DefinitelyTyped

### Practical Example: Creating Declarations for a Simple Library

Let's say we have a simple JavaScript utility library:

```javascript
// string-utils.js
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str, length, suffix = '...') {
  if (str.length <= length) return str;
  return str.slice(0, length) + suffix;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

function camelCase(str) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}

function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

module.exports = { capitalize, truncate, slugify, camelCase, kebabCase };
```

The corresponding declaration file:

```typescript
// string-utils.d.ts
/**
 * String utility library
 * @packageDocumentation
 */

/**
 * Capitalizes the first letter of a string
 * @param str - Input string
 * @returns String with first letter capitalized
 * @example
 * ```ts
 * capitalize('hello') // 'Hello'
 * capitalize('WORLD') // 'WORLD'
 * ```
 */
export function capitalize(str: string): string;

/**
 * Truncates a string to a specified length
 * @param str - Input string
 * @param length - Maximum length
 * @param suffix - Suffix after truncation, defaults to '...'
 * @returns Truncated string
 * @example
 * ```ts
 * truncate('Hello World', 5) // 'Hello...'
 * truncate('Hello', 10) // 'Hello'
 * truncate('Hello World', 5, '...') // 'Hello...'
 * ```
 */
export function truncate(str: string, length: number, suffix?: string): string;

/**
 * Converts a string to a URL-friendly slug
 * @param str - Input string
 * @returns Slug string
 * @example
 * ```ts
 * slugify('Hello World') // 'hello-world'
 * slugify('TypeScript Tutorial') // 'typescript-tutorial'
 * ```
 */
export function slugify(str: string): string;

/**
 * Converts a string to camelCase
 * @param str - Input string
 * @returns camelCase string
 * @example
 * ```ts
 * camelCase('hello-world') // 'helloWorld'
 * camelCase('hello_world') // 'helloWorld'
 * camelCase('Hello World') // 'helloWorld'
 * ```
 */
export function camelCase(str: string): string;

/**
 * Converts a string to kebab-case
 * @param str - Input string
 * @returns kebab-case string
 * @example
 * ```ts
 * kebabCase('helloWorld') // 'hello-world'
 * kebabCase('HelloWorld') // 'hello-world'
 * kebabCase('hello_world') // 'hello-world'
 * ```
 */
export function kebabCase(str: string): string;
```

### Practical Example: Creating Declarations for a Complex Library

Let's say we have a more complex HTTP client library:

```javascript
// http-client.js
class HttpClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || '';
    this.headers = config.headers || {};
    this.timeout = config.timeout || 30000;
    this.interceptors = {
      request: [],
      response: []
    };
  }

  use(type, interceptor) {
    this.interceptors[type].push(interceptor);
    return () => {
      const index = this.interceptors[type].indexOf(interceptor);
      if (index !== -1) {
        this.interceptors[type].splice(index, 1);
      }
    };
  }

  async request(method, url, options = {}) {
    // Implementation details...
  }

  get(url, options) {
    return this.request('GET', url, options);
  }

  post(url, data, options) {
    return this.request('POST', url, { ...options, body: data });
  }

  put(url, data, options) {
    return this.request('PUT', url, { ...options, body: data });
  }

  delete(url, options) {
    return this.request('DELETE', url, options);
  }

  patch(url, data, options) {
    return this.request('PATCH', url, { ...options, body: data });
  }
}

HttpClient.create = function(config) {
  return new HttpClient(config);
};

module.exports = HttpClient;
module.exports.default = HttpClient;
```

The corresponding declaration file:

```typescript
// http-client.d.ts

declare namespace HttpClient {
  /**
   * Client configuration options
   */
  interface Config {
    /** Base URL, all request URLs will be relative to this */
    baseURL?: string;
    /** Default request headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds, default 30000 */
    timeout?: number;
  }

  /**
   * Request configuration
   */
  interface RequestConfig {
    /** Request URL (relative to baseURL) */
    url: string;
    /** HTTP method */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    /** Request headers */
    headers?: Record<string, string>;
    /** URL query parameters */
    params?: Record<string, string | number | boolean | undefined>;
    /** Request body */
    body?: any;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Signal for request cancellation */
    signal?: AbortSignal;
  }

  /**
   * Response object
   */
  interface Response<T = any> {
    /** Response data */
    data: T;
    /** HTTP status code */
    status: number;
    /** Status text */
    statusText: string;
    /** Response headers */
    headers: Record<string, string>;
    /** Original request configuration */
    config: RequestConfig;
  }

  /**
   * Request options
   */
  interface RequestOptions {
    /** Request headers */
    headers?: Record<string, string>;
    /** URL query parameters */
    params?: Record<string, string | number | boolean | undefined>;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Signal for request cancellation */
    signal?: AbortSignal;
  }

  /**
   * Request interceptor
   */
  type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

  /**
   * Response interceptor
   */
  type ResponseInterceptor<T = any> = (response: Response<T>) => Response<T> | Promise<Response<T>>;

  /**
   * Interceptor type
   */
  type InterceptorType = 'request' | 'response';

  /**
   * Unsubscribe function for interceptors
   */
  type Unsubscribe = () => void;
}

/**
 * HTTP client class
 * @example
 * ```ts
 * const client = HttpClient.create({ baseURL: 'https://api.example.com' });
 *
 * // GET request
 * const users = await client.get<User[]>('/users');
 *
 * // POST request
 * const newUser = await client.post<User>('/users', { name: 'John' });
 *
 * // Add interceptor
 * const unsubscribe = client.use('request', (config) => {
 *   config.headers = { ...config.headers, Authorization: 'Bearer token' };
 *   return config;
 * });
 * ```
 */
declare class HttpClient {
  /** Base URL */
  baseURL: string;
  /** Default request headers */
  headers: Record<string, string>;
  /** Timeout in milliseconds */
  timeout: number;

  /**
   * Creates an HttpClient instance
   * @param config - Client configuration
   */
  constructor(config?: HttpClient.Config);

  /**
   * Adds an interceptor
   * @param type - Interceptor type: 'request' or 'response'
   * @param interceptor - Interceptor function
   * @returns Unsubscribe function
   */
  use(type: 'request', interceptor: HttpClient.RequestInterceptor): HttpClient.Unsubscribe;
  use<T = any>(type: 'response', interceptor: HttpClient.ResponseInterceptor<T>): HttpClient.Unsubscribe;

  /**
   * Sends a request
   * @param method - HTTP method
   * @param url - Request URL
   * @param options - Request options
   * @returns Promise containing the response
   */
  request<T = any>(
    method: string,
    url: string,
    options?: HttpClient.RequestOptions & { body?: any }
  ): Promise<HttpClient.Response<T>>;

  /**
   * Sends a GET request
   * @param url - Request URL
   * @param options - Request options
   * @returns Promise containing the response
   */
  get<T = any>(
    url: string,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * Sends a POST request
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise containing the response
   */
  post<T = any>(
    url: string,
    data?: any,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * Sends a PUT request
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise containing the response
   */
  put<T = any>(
    url: string,
    data?: any,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * Sends a DELETE request
   * @param url - Request URL
   * @param options - Request options
   * @returns Promise containing the response
   */
  delete<T = any>(
    url: string,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * Sends a PATCH request
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise containing the response
   */
  patch<T = any>(
    url: string,
    data?: any,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * Creates a new HttpClient instance (static method)
   * @param config - Client configuration
   * @returns New HttpClient instance
   */
  static create(config?: HttpClient.Config): HttpClient;
}

export = HttpClient;
export as namespace HttpClient;
```

### Using Generics to Enhance Type Safety

```typescript
// event-emitter.d.ts - Type-safe event emitter
/**
 * Type-safe event emitter
 * @typeParam Events - Mapping of event names to argument arrays
 * @example
 * ```ts
 * interface MyEvents {
 *   'user:login': [userId: string, timestamp: Date];
 *   'user:logout': [userId: string];
 *   'error': [error: Error];
 *   'data': [data: unknown];
 * }
 *
 * const emitter = new TypedEventEmitter<MyEvents>();
 *
 * // Type-safe event listening
 * emitter.on('user:login', (userId, timestamp) => {
 *   // userId: string, timestamp: Date
 *   console.log(`User ${userId} logged in at ${timestamp}`);
 * });
 *
 * // Type-safe event emission
 * emitter.emit('user:login', 'user123', new Date());
 *
 * // Type error examples
 * emitter.on('invalid', () => {}); // Error: 'invalid' is not a valid event
 * emitter.emit('user:login', 123); // Error: userId should be string
 * ```
 */
declare class TypedEventEmitter<Events extends Record<string, any[]>> {
  /**
   * Registers an event listener
   * @param event - Event name
   * @param listener - Listener function
   * @returns this (supports chaining)
   */
  on<E extends keyof Events>(
    event: E,
    listener: (...args: Events[E]) => void
  ): this;

  /**
   * Removes an event listener
   * @param event - Event name
   * @param listener - Listener function to remove
   * @returns this (supports chaining)
   */
  off<E extends keyof Events>(
    event: E,
    listener: (...args: Events[E]) => void
  ): this;

  /**
   * Emits an event
   * @param event - Event name
   * @param args - Arguments to pass to listeners
   * @returns Whether any listeners were called
   */
  emit<E extends keyof Events>(event: E, ...args: Events[E]): boolean;

  /**
   * Registers a one-time event listener
   * @param event - Event name
   * @param listener - Listener function (will only be called once)
   * @returns this (supports chaining)
   */
  once<E extends keyof Events>(
    event: E,
    listener: (...args: Events[E]) => void
  ): this;

  /**
   * Removes all listeners for a specified event
   * @param event - Event name (optional, if not provided removes all event listeners)
   * @returns this (supports chaining)
   */
  removeAllListeners<E extends keyof Events>(event?: E): this;

  /**
   * Gets the number of listeners for a specified event
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount<E extends keyof Events>(event: E): number;

  /**
   * Gets all listeners for a specified event
   * @param event - Event name
   * @returns Array of listeners
   */
  listeners<E extends keyof Events>(event: E): Array<(...args: Events[E]) => void>;

  /**
   * Gets all registered event names
   * @returns Array of event names
   */
  eventNames(): Array<keyof Events>;
}

export = TypedEventEmitter;
```

## Declaration File Organization

### Single File Declarations

Suitable for small libraries:

```typescript
// my-library.d.ts
declare module 'my-library' {
  export function doSomething(): void;
  export function doSomethingElse(value: string): number;

  export class MyClass {
    constructor(options: MyClassOptions);
    method(): void;
    asyncMethod(): Promise<void>;
  }

  export interface MyClassOptions {
    name: string;
    value: number;
    callback?: () => void;
  }

  export type Result = 'success' | 'failure';

  export const VERSION: string;
}
```

### Multi-File Declarations

Suitable for large libraries, using directory structure for organization:

```
types/
├── index.d.ts          # Main entry, aggregates all exports
├── core.d.ts           # Core types
├── utils.d.ts          # Utility function types
├── constants.d.ts      # Constant types
├── models/
│   ├── index.d.ts      # Models entry
│   ├── user.d.ts       # User model
│   ├── post.d.ts       # Post model
│   └── comment.d.ts    # Comment model
├── services/
│   ├── index.d.ts      # Services entry
│   ├── api.d.ts        # API service
│   ├── auth.d.ts       # Auth service
│   └── storage.d.ts    # Storage service
└── plugins/
    ├── index.d.ts      # Plugins entry
    └── logger.d.ts     # Logger plugin
```

```typescript
// types/index.d.ts - Main entry file
/// <reference path="./core.d.ts" />
/// <reference path="./utils.d.ts" />
/// <reference path="./constants.d.ts" />
/// <reference path="./models/index.d.ts" />
/// <reference path="./services/index.d.ts" />
/// <reference path="./plugins/index.d.ts" />

declare module 'my-large-library' {
  // Re-export from each submodule
  export * from './core';
  export * from './utils';
  export * from './constants';
  export * from './models';
  export * from './services';
  export * from './plugins';

  // Default export
  export default function createApp(config: AppConfig): App;

  export interface AppConfig {
    name: string;
    version: string;
    plugins?: Plugin[];
  }

  export interface App {
    name: string;
    version: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    use(plugin: Plugin): this;
  }

  export interface Plugin {
    name: string;
    install(app: App): void;
  }
}
```

### Using Triple-Slash Directives

Triple-slash directives declare dependencies between declaration files:

```typescript
// types/my-node-library.d.ts
/// <reference types="node" />         // Reference @types/node
/// <reference path="./common.d.ts" /> // Reference local declaration file
/// <reference lib="es2020" />         // Reference built-in library definition

declare module 'my-node-library' {
  import { EventEmitter } from 'events';
  import { Readable, Writable, Transform } from 'stream';
  import { IncomingMessage, ServerResponse } from 'http';

  /**
   * Custom readable stream
   */
  export class MyReadableStream extends Readable {
    constructor(options?: MyStreamOptions);
    pipe<T extends Writable>(destination: T, options?: { end?: boolean }): T;
    pause(): this;
    resume(): this;
  }

  /**
   * Custom event emitter
   */
  export class MyEmitter extends EventEmitter {
    emit(event: 'data', chunk: Buffer): boolean;
    emit(event: 'end'): boolean;
    emit(event: 'error', error: Error): boolean;

    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
  }

  /**
   * HTTP middleware
   */
  export type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: Error) => void
  ) => void;

  export interface MyStreamOptions {
    highWaterMark?: number;
    encoding?: BufferEncoding;
    objectMode?: boolean;
  }
}
```

## Publishing Declaration Files

### Publishing with the Library

Specify the type entry in package.json:

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "typings": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    },
    "./utils": {
      "import": {
        "types": "./dist/utils.d.mts",
        "default": "./dist/utils.mjs"
      },
      "require": {
        "types": "./dist/utils.d.ts",
        "default": "./dist/utils.js"
      }
    }
  },
  "files": [
    "dist"
  ]
}
```

### Auto-generating Declaration Files

Use the TypeScript compiler to auto-generate:

```json
// tsconfig.json
{
  "compilerOptions": {
    // Generate declaration files
    "declaration": true,
    // Declaration file output directory
    "declarationDir": "./dist/types",
    // Generate declaration file source maps
    "declarationMap": true,
    // Only generate declaration files, not JS
    "emitDeclarationOnly": false,
    // Output directory
    "outDir": "./dist",
    // Source file directory
    "rootDir": "./src",
    // Skip type checking for node_modules
    "skipLibCheck": true,
    // Strict mode
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### Using Build Tools to Generate Declaration Files

```typescript
// rollup.config.js - Using Rollup to generate declaration files
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // Generate JS
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.js', format: 'cjs' },
      { file: 'dist/index.esm.js', format: 'es' }
    ],
    plugins: [typescript()]
  },
  // Generate merged declaration file
  {
    input: 'dist/types/index.d.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()]
  }
];
```

### Contributing to DefinitelyTyped

1. Fork the DefinitelyTyped repository
2. Create a new type package directory: `types/my-library/`
3. Create required files

```typescript
// types/my-library/index.d.ts
// Type definitions for my-library 1.0
// Project: https://github.com/author/my-library
// Definitions by: Your Name <https://github.com/your-github-username>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export function myFunction(input: string): number;

export class MyClass {
  constructor(options: Options);
  method(): void;
}

export interface Options {
  name: string;
  value?: number;
}

export as namespace MyLibrary;
```

```typescript
// types/my-library/my-library-tests.ts
import { myFunction, MyClass } from 'my-library';

// Test function return type
const result: number = myFunction('test');

// Test class instantiation
const instance = new MyClass({ name: 'test' });
instance.method();

// Test optional parameters
const instanceWithValue = new MyClass({ name: 'test', value: 42 });

// These tests ensure types work correctly
// @ts-expect-error - Wrong parameter type
myFunction(123);

// @ts-expect-error - Missing required property
new MyClass({});
```

```json
// types/my-library/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "lib": ["es6"],
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "types": [],
    "noEmit": true,
    "forceConsistentCasingInFileNames": true
  },
  "files": [
    "index.d.ts",
    "my-library-tests.ts"
  ]
}
```

## Common Patterns and Best Practices

### Conditional Types in Declaration Files

```typescript
// Infer return type based on input type
declare function parse<T extends string | object>(
  input: T
): T extends string ? object : string;

// Extract Promise inner type
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// Return different types based on configuration
interface FetchConfig<T extends boolean> {
  url: string;
  json: T;
}

declare function fetch<T extends boolean>(
  config: FetchConfig<T>
): Promise<T extends true ? object : string>;

// Usage example
const jsonData = fetch({ url: '/api', json: true }); // Promise<object>
const textData = fetch({ url: '/api', json: false }); // Promise<string>
```

### Using this Type for Method Chaining

```typescript
declare class Builder<T extends object> {
  /**
   * Sets a property value
   */
  set<K extends keyof T>(key: K, value: T[K]): this;

  /**
   * Removes a property
   */
  unset<K extends keyof T>(key: K): this;

  /**
   * Conditional setting
   */
  when(condition: boolean, callback: (builder: this) => this): this;

  /**
   * Builds the final object
   */
  build(): T;
}

// Extended Builder
declare class ValidatedBuilder<T extends object> extends Builder<T> {
  /**
   * Validates current data
   */
  validate(): this;

  /**
   * Adds a validation rule
   */
  addRule<K extends keyof T>(key: K, validator: (value: T[K]) => boolean): this;
}

// Usage example
interface User {
  name: string;
  email: string;
  age: number;
}

declare const userBuilder: ValidatedBuilder<User>;

// Method chaining, all methods return this
userBuilder
  .set('name', 'John')
  .set('email', 'john@example.com')
  .addRule('age', (age) => age >= 0)
  .validate()
  .build();
```

### Correct Order for Function Overloads

```typescript
// Overloads should be ordered from specific to general
// TypeScript matches in order, using the first match

// Most specific overloads come first
declare function format(value: null | undefined): string;
declare function format(value: Date): string;
declare function format(value: number, decimals?: number): string;
declare function format(value: string, template?: string): string;
declare function format(value: boolean): string;
// Most general overload comes last
declare function format(value: unknown): string;

// TypeScript matches in order when used
format(null);              // Uses first overload
format(new Date());        // Uses second overload
format(3.14159, 2);        // Uses third overload
format('hello', 'upper');  // Uses fourth overload
format(true);              // Uses fifth overload
format({ x: 1 });          // Uses last general overload

// Another overload example: createElement
declare function createElement(tag: 'a', props?: AnchorProps): HTMLAnchorElement;
declare function createElement(tag: 'button', props?: ButtonProps): HTMLButtonElement;
declare function createElement(tag: 'canvas', props?: CanvasProps): HTMLCanvasElement;
declare function createElement(tag: 'div', props?: DivProps): HTMLDivElement;
declare function createElement(tag: 'form', props?: FormProps): HTMLFormElement;
declare function createElement(tag: 'img', props?: ImgProps): HTMLImageElement;
declare function createElement(tag: 'input', props?: InputProps): HTMLInputElement;
declare function createElement(tag: 'span', props?: SpanProps): HTMLSpanElement;
declare function createElement(tag: string, props?: ElementProps): HTMLElement;

interface ElementProps {
  id?: string;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
}

interface AnchorProps extends ElementProps {
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

interface ButtonProps extends ElementProps {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

// ... other property interfaces
```

### Callable and Constructable Objects

```typescript
// Objects that can be both called and new'd
interface DateConstructor {
  // Called as a function, returns string
  (): string;

  // Called as a constructor, returns Date object
  new (): Date;
  new (value: number | string): Date;
  new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): Date;

  // Static methods
  now(): number;
  parse(s: string): number;
  UTC(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): number;

  // Static properties
  readonly prototype: Date;
}

declare const Date: DateConstructor;

// Another example: jQuery-style constructor
interface JQueryConstructor {
  // Selector call
  (selector: string): JQueryElement;
  (selector: string, context: Element): JQueryElement;

  // Element wrapping
  (element: Element): JQueryElement;
  (elements: Element[]): JQueryElement;

  // DOM Ready
  (callback: () => void): void;

  // HTML creation
  (html: string): JQueryElement;

  // Static methods
  ajax(settings: AjaxSettings): Promise<any>;
  get(url: string): Promise<any>;
  post(url: string, data?: any): Promise<any>;
  extend<T, U>(target: T, source: U): T & U;

  // Static properties
  fn: JQueryElement;
}

interface JQueryElement {
  length: number;
  [index: number]: Element;
  // ... instance methods
}

declare const $: JQueryConstructor;
declare const jQuery: JQueryConstructor;
```

### Index Signatures and Known Properties

```typescript
// Combining known properties with dynamic properties
interface Config {
  // Known required properties
  name: string;
  version: string;

  // Known optional properties
  description?: string;
  author?: string;

  // Index signature allows additional string properties
  [key: string]: string | number | boolean | undefined;
}

// Using Record type for stricter typing
interface StrictConfig {
  name: string;
  version: string;
  options: Record<string, unknown>;  // Additional options in a separate field
}

// Using interface inheritance to separate concerns
interface BaseConfig {
  name: string;
  version: string;
}

interface ExtendedConfig extends BaseConfig {
  [key: string]: unknown;
}

// Using intersection types
type FlexibleConfig = {
  name: string;
  version: string;
} & Record<string, unknown>;
```

### Type Guard Declarations

```typescript
// Declare type guard functions
declare function isString(value: unknown): value is string;
declare function isNumber(value: unknown): value is number;
declare function isArray<T>(value: unknown): value is T[];
declare function isObject(value: unknown): value is object;
declare function isNull(value: unknown): value is null;
declare function isUndefined(value: unknown): value is undefined;
declare function isNullOrUndefined(value: unknown): value is null | undefined;

// Complex type guards
interface User {
  id: number;
  name: string;
  email: string;
}

declare function isUser(value: unknown): value is User;

// Assertion functions
declare function assertString(value: unknown, message?: string): asserts value is string;
declare function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T;
declare function assertNever(value: never, message?: string): never;

// Usage example
function processValue(value: unknown) {
  if (isString(value)) {
    // value is string
    console.log(value.toUpperCase());
  } else if (isNumber(value)) {
    // value is number
    console.log(value.toFixed(2));
  } else if (isUser(value)) {
    // value is User
    console.log(value.email);
  }
}
```

## Debugging Declaration Files

### Common Errors and Solutions

```typescript
// Error 1: Cannot find declaration file for module
// Error: Could not find a declaration file for module 'some-library'

// Solution 1: Install @types package
// npm install --save-dev @types/some-library

// Solution 2: Create local declaration file
// typings/some-library.d.ts
declare module 'some-library' {
  export function someFunction(): void;
}

// Solution 3: Use require and disable checking
// const lib = require('some-library'); // @ts-ignore

// ---

// Error 2: Namespace and module conflict
// Error: 'X' only refers to a type, but is being used as a namespace here

// Wrong example
declare module 'my-lib' {
  namespace MyLib {  // This will cause problems
    interface Config {}
  }
}

// Correct approach
declare module 'my-lib' {
  export interface Config {}
  export function init(config: Config): void;
}

// ---

// Error 3: Type incompatibility
// Error: Type 'X' is not assignable to type 'Y'

// Check if type definitions match actual API
// Use typeof to check runtime types
// Use 'as' type assertion (use sparingly)

// ---

// Error 4: Implicit any type
// Error: Parameter 'x' implicitly has an 'any' type

// Add type annotations for all parameters and return values
declare function process(data: unknown): ProcessedData;

// ---

// Error 5: Duplicate declarations
// Error: Duplicate identifier 'X'

// Check if the same type is declared in multiple files
// Use module augmentation instead of re-declaration
```

### Using skipLibCheck

When encountering third-party declaration file issues:

```json
{
  "compilerOptions": {
    // Skip type checking for .d.ts files
    "skipLibCheck": true
  }
}
```

Note: `skipLibCheck` skips checking all declaration files, including your own, so use it cautiously.

### Type Checking and Debugging Tools

```bash
# Check type resolution paths
tsc --traceResolution

# Type check only, no output
tsc --noEmit

# Generate detailed compilation information
tsc --extendedDiagnostics

# List all included files
tsc --listFiles
```

```typescript
// Use type checking in code
type Test = typeof myFunction;
//   ^? Hover to see type

// Use utility types to check parameters and return values
type Params = Parameters<typeof myFunction>;
type Return = ReturnType<typeof myFunction>;

// Use @ts-expect-error to test type errors
// @ts-expect-error - This should throw an error
const invalid: string = 123;

// Use satisfies operator to validate types
const config = {
  name: 'app',
  version: '1.0.0',
} satisfies Config;
```

## Summary

Declaration files are an essential part of the TypeScript ecosystem. They:

1. **Provide type safety** - Add type information to JavaScript code to catch errors at compile time
2. **Improve developer experience** - Provide intellisense, auto-completion, and inline documentation
3. **Serve as API documentation** - Clearly describe a module's public interface and usage
4. **Support gradual migration** - Allow seamless use of JavaScript libraries in TypeScript projects

### Key Points

- Use the `declare` keyword for ambient types to tell TypeScript these entities exist elsewhere
- Understand the difference between module declarations (`declare module`) and global declarations (`declare global`)
- Leverage DefinitelyTyped community resources, preferring existing @types packages
- Create high-quality declaration files for your libraries with complete JSDoc documentation
- Follow best practices:
  - Avoid using `any`, prefer `unknown` or specific types
  - Use namespaces to organize related types
  - Order function overloads from specific to general
  - Add detailed JSDoc comments
  - Write type test files to verify declaration correctness

### Advanced Recommendations

1. **Study existing declaration files** - Read declaration files in @types packages to learn high-quality type definition patterns
2. **Use type tests** - Write tests for declaration files to ensure types work as expected
3. **Stay synchronized** - Update type declarations promptly when libraries are updated
4. **Contribute to the community** - If you find missing or incorrect type definitions, consider contributing to DefinitelyTyped

By mastering declaration file writing techniques, you can better leverage TypeScript's type system, whether using third-party libraries or adding type support to your own JavaScript libraries.
