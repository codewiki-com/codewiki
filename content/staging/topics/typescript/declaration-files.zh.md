---
title: 声明文件
description: TypeScript声明文件完全指南，.d.ts文件、类型声明与DefinitelyTyped
track: typescript
section: type-system
difficulty: advanced
tags:
  - TypeScript
  - 声明文件
  - .d.ts
  - 类型定义
status: imported
origin: old/src/content/docs/typescript/declaration-files.zh.md
divergence: 0.219
issues: []
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 9
  lastUpdated: 2026-01-07
---

声明文件是 TypeScript 生态系统中至关重要的组成部分。它们为 JavaScript 代码提供类型信息，使得 TypeScript 编译器能够理解和检查那些原本没有类型注解的代码。本文将深入探讨声明文件的方方面面。

## 什么是声明文件

声明文件（Declaration Files）是以 `.d.ts` 为扩展名的特殊 TypeScript 文件。它们只包含类型声明，不包含任何实际的实现代码。声明文件的主要作用是：

1. **为 JavaScript 库提供类型信息** - 让 TypeScript 能够理解 JavaScript 代码的类型结构
2. **提供 IDE 智能提示** - 改善开发体验，提供自动补全和文档提示
3. **启用类型检查** - 在编译时捕获潜在的类型错误
4. **作为 API 文档** - 清晰地描述模块的公共接口

### 声明文件 vs 普通 TypeScript 文件

```typescript
// 普通 TypeScript 文件 (.ts)
// 包含类型和实现
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// 声明文件 (.d.ts)
// 只包含类型声明，没有实现
declare function greet(name: string): string;
```

### .d.ts 文件的基本结构

```typescript
// math.js (JavaScript 实现)
export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export const PI = 3.14159;
```

```typescript
// math.d.ts (对应的类型声明)
export function add(a: number, b: number): number;
export function multiply(a: number, b: number): number;
export const PI: number;
```

## declare 关键字

`declare` 关键字用于告诉 TypeScript 编译器某个变量、函数、类或模块存在于其他地方（通常是 JavaScript 代码中），编译器应该信任这些声明而不需要看到实际实现。

### 声明变量

```typescript
// 声明全局变量
declare const API_URL: string;
declare let DEBUG_MODE: boolean;
declare var VERSION: string;

// 声明只读配置对象
declare const CONFIG: {
  readonly apiKey: string;
  readonly timeout: number;
  readonly retries: number;
};

// 使用这些变量
console.log(API_URL);  // TypeScript 知道这是 string 类型
if (DEBUG_MODE) {
  console.log(`Version: ${VERSION}`);
}
```

### 声明函数

```typescript
// 声明简单函数签名
declare function $(selector: string): HTMLElement;
declare function ajax(url: string, options?: AjaxOptions): Promise<Response>;

// 函数重载声明
declare function createElement(tag: 'div'): HTMLDivElement;
declare function createElement(tag: 'span'): HTMLSpanElement;
declare function createElement(tag: 'input'): HTMLInputElement;
declare function createElement(tag: 'canvas'): HTMLCanvasElement;
declare function createElement(tag: string): HTMLElement;

// 带有回调的函数
declare function fetchData<T>(
  url: string,
  callback: (error: Error | null, data: T) => void
): void;

// 带有可选参数和默认值的函数
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

### 声明类

```typescript
// 基本类声明
declare class EventEmitter {
  constructor();
  on(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
  off(event: string, listener: (...args: any[]) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string): this;
}

// 带有静态成员的类
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

// 带有泛型的类
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

// 抽象类声明
declare abstract class Component<P = {}, S = {}> {
  props: Readonly<P>;
  state: Readonly<S>;
  constructor(props: P);
  abstract render(): string;
  setState(state: Partial<S>): void;
  forceUpdate(): void;
}
```

### 声明接口和类型

在声明文件中，`interface` 和 `type` 不需要 `declare` 关键字：

```typescript
// 接口声明
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 嵌套接口
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

// 类型别名
type ID = string | number;
type Callback<T> = (error: Error | null, result: T) => void;
type AsyncCallback<T> = (error: Error | null, result: T) => Promise<void>;

// 复杂类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
type EventHandler<E extends Event = Event> = (event: E) => void;

// 枚举需要 declare 关键字
declare enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 常量枚举
declare const enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT'
}
```

## 环境声明（Ambient Declarations）

环境声明用于描述在 TypeScript 之外定义的代码结构，比如浏览器 API、Node.js 全局对象或第三方 JavaScript 库。

### 全局变量声明

```typescript
// globals.d.ts
// 声明浏览器中的全局变量
declare const __DEV__: boolean;
declare const __PROD__: boolean;
declare const __VERSION__: string;
declare const __BUILD_TIME__: string;

// 声明 process 对象（Node.js 风格）
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

// 扩展 Window 接口
interface Window {
  // 自定义分析工具
  analytics: {
    track(event: string, properties?: Record<string, any>): void;
    identify(userId: string, traits?: Record<string, any>): void;
    page(name?: string, properties?: Record<string, any>): void;
  };

  // Redux DevTools
  __REDUX_DEVTOOLS_EXTENSION__?: () => any;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof Function;

  // 自定义应用配置
  APP_CONFIG: {
    apiEndpoint: string;
    features: Record<string, boolean>;
  };
}

// 现在可以安全使用
window.analytics.track('page_view', { page: '/home' });
console.log(window.APP_CONFIG.apiEndpoint);
```

### 全局函数和命名空间

```typescript
// 声明全局函数
declare function requestIdleCallback(
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout: number }
): number;

declare function cancelIdleCallback(handle: number): void;

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining(): number;
}

// 声明性能相关 API
declare function queueMicrotask(callback: () => void): void;

declare function structuredClone<T>(value: T, options?: StructuredSerializeOptions): T;

interface StructuredSerializeOptions {
  transfer?: ArrayBuffer[];
}

// 声明命名空间扩展 Node.js 环境
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

在模块文件中声明全局类型时，需要使用 `declare global`：

```typescript
// 这是一个模块文件（因为有 import/export）
import type { User } from './types';

// 扩展全局作用域
declare global {
  // 扩展 Array 原型
  interface Array<T> {
    /**
     * 返回数组的第一个元素
     */
    first(): T | undefined;

    /**
     * 返回数组的最后一个元素
     */
    last(): T | undefined;

    /**
     * 按照指定键分组
     */
    groupBy<K extends string | number>(
      keySelector: (item: T) => K
    ): Record<K, T[]>;

    /**
     * 去重
     */
    unique(): T[];
  }

  // 扩展 String 原型
  interface String {
    /**
     * 截断字符串
     */
    truncate(length: number, suffix?: string): string;

    /**
     * 转换为 URL 友好的 slug
     */
    slugify(): string;
  }

  // 添加全局变量
  var currentUser: User | null;
  var appVersion: string;

  // 扩展 Window
  interface Window {
    myApp: {
      version: string;
      init(): void;
      destroy(): void;
    };
  }

  // 添加全局函数
  function formatCurrency(amount: number, currency?: string): string;
}

// 必须导出，使其成为模块
export {};
```

### 环境声明的实际应用

```typescript
// env.d.ts - 为 Vite 项目声明环境变量类型
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

// 声明静态资源模块
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

## 模块声明

模块声明用于为没有类型定义的 JavaScript 模块提供类型信息。

### 声明外部模块

```typescript
// lodash.d.ts - 为 lodash 库创建完整类型声明
declare module 'lodash' {
  // 数组方法
  export function chunk<T>(array: T[], size: number): T[][];
  export function compact<T>(array: (T | null | undefined | false | '' | 0)[]): T[];
  export function uniq<T>(array: T[]): T[];
  export function uniqBy<T>(array: T[], iteratee: keyof T | ((item: T) => any)): T[];
  export function flatten<T>(array: (T | T[])[]): T[];
  export function flattenDeep<T>(array: any[]): T[];
  export function difference<T>(array: T[], ...values: T[][]): T[];
  export function intersection<T>(...arrays: T[][]): T[];

  // 对象方法
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

  // 函数工具
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

  // 字符串方法
  export function camelCase(string?: string): string;
  export function snakeCase(string?: string): string;
  export function kebabCase(string?: string): string;
  export function capitalize(string?: string): string;
  export function startCase(string?: string): string;
}
```

### 声明具有多种导出风格的模块

```typescript
// axios.d.ts - 同时支持默认导出和命名导出
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

### 通配符模块声明

对于非 JavaScript 资源，可以使用通配符模块声明：

```typescript
// assets.d.ts - 声明各种静态资源类型

// 图片模块
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

// SVG 可以作为组件导入（React 项目）
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

// 样式模块（CSS Modules）
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

// 普通样式文件
declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

// JSON 和 YAML 模块
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

// 文本文件
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

// 现在可以这样导入
// import logo from './logo.png';
// import styles from './styles.module.css';
// import Icon, { ReactComponent as IconComponent } from './icon.svg';
// import config from './config.json';
```

### 模块增强（Module Augmentation）

模块增强允许你扩展现有模块的类型定义：

```typescript
// express-augmentation.d.ts - 扩展 Express 类型
import 'express';

declare module 'express' {
  // 扩展 Request 接口
  interface Request {
    // 用户认证信息
    user?: {
      id: string;
      email: string;
      role: 'admin' | 'user' | 'guest';
      permissions: string[];
    };

    // 会话信息
    session: {
      token: string;
      expiresAt: Date;
      data: Record<string, any>;
    };

    // 请求追踪
    requestId: string;
    startTime: number;
  }

  // 扩展 Response 接口
  interface Response {
    // 成功响应
    success<T>(data: T, message?: string): void;

    // 分页响应
    paginate<T>(data: T[], page: number, limit: number, total: number): void;

    // 错误响应
    error(message: string, code?: number, details?: any): void;
  }

  // 扩展 Application 接口
  interface Application {
    // 自定义配置
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

// 使用示例
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
// vue-augmentation.d.ts - 扩展 Vue 类型
import 'vue';

declare module 'vue' {
  // 扩展组件自定义属性
  interface ComponentCustomProperties {
    // API 客户端
    $api: {
      get<T>(url: string, params?: Record<string, any>): Promise<T>;
      post<T>(url: string, data?: any): Promise<T>;
      put<T>(url: string, data?: any): Promise<T>;
      delete<T>(url: string): Promise<T>;
    };

    // 日期格式化
    $formatDate: (date: Date | string, format?: string) => string;

    // 货币格式化
    $formatCurrency: (amount: number, currency?: string) => string;

    // 消息提示
    $toast: {
      success(message: string): void;
      error(message: string): void;
      warning(message: string): void;
      info(message: string): void;
    };

    // 确认对话框
    $confirm: (message: string, title?: string) => Promise<boolean>;
  }

  // 扩展全局组件
  interface GlobalComponents {
    BaseButton: typeof import('./components/BaseButton.vue').default;
    BaseInput: typeof import('./components/BaseInput.vue').default;
    BaseModal: typeof import('./components/BaseModal.vue').default;
  }
}

export {};
```

## 命名空间声明

命名空间（Namespace）用于组织和分组相关的类型声明：

```typescript
// jquery.d.ts - jQuery 完整类型声明示例
declare namespace JQuery {
  // Ajax 相关类型
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

  // 事件相关类型
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

  // JQuery 静态方法
  interface JQueryStatic {
    // 选择器
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

    // 工具函数
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

  // JQuery 实例方法
  interface JQuery {
    length: number;
    [index: number]: Element;

    // 遍历
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

    // DOM 操作
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

    // 事件
    on(event: string, handler: (event: Event) => void): JQuery;
    on(event: string, selector: string, handler: (event: Event) => void): JQuery;
    off(event?: string, handler?: (event: Event) => void): JQuery;
    trigger(event: string, extraParameters?: any): JQuery;
    click(handler?: (event: MouseEvent) => void): JQuery;
    submit(handler?: (event: Event) => void): JQuery;
    focus(handler?: (event: Event) => void): JQuery;
    blur(handler?: (event: Event) => void): JQuery;

    // 效果
    show(duration?: number | string): JQuery;
    hide(duration?: number | string): JQuery;
    toggle(duration?: number | string): JQuery;
    fadeIn(duration?: number | string): JQuery;
    fadeOut(duration?: number | string): JQuery;
    slideUp(duration?: number | string): JQuery;
    slideDown(duration?: number | string): JQuery;
    animate(properties: Record<string, any>, duration?: number, easing?: string, complete?: () => void): JQuery;

    // DOM 插入
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

  // Promise 相关
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

### 嵌套命名空间

```typescript
// 应用程序类型组织示例
declare namespace App {
  // 模型层
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

  // 服务层
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

  // 工具函数
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

  // 常量
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

[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) 是一个巨大的社区维护仓库，包含了数千个 JavaScript 库的类型声明文件。

### 安装类型声明

```bash
# 安装常用库的类型声明
npm install --save-dev @types/node
npm install --save-dev @types/react @types/react-dom
npm install --save-dev @types/express
npm install --save-dev @types/lodash
npm install --save-dev @types/jest
npm install --save-dev @types/mocha @types/chai

# 安装特定版本的类型声明
npm install --save-dev @types/node@18
npm install --save-dev @types/react@18

# 查找可用的类型声明
npm search @types/jquery

# 使用 npx 快速查找缺失的类型
npx typesync
```

### 类型声明的版本管理

类型声明的版本通常与库的版本对应。保持版本同步很重要：

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

### 类型声明的查找顺序

TypeScript 编译器按以下顺序查找类型声明：

1. **内置声明** - TypeScript 内置的 `lib.d.ts` 文件
2. **node_modules/@types** - 安装的 @types 包
3. **typeRoots** - tsconfig.json 中配置的类型根目录
4. **types** - tsconfig.json 中指定的类型包
5. **项目中的 .d.ts 文件** - 项目源码中的声明文件

```json
// tsconfig.json - 配置类型查找
{
  "compilerOptions": {
    // 指定类型声明根目录（默认是 node_modules/@types）
    "typeRoots": [
      "./typings",
      "./node_modules/@types"
    ],

    // 只包含指定的类型包（如果不指定则包含 typeRoots 下所有包）
    "types": [
      "node",
      "jest",
      "webpack-env"
    ],

    // 路径映射
    "paths": {
      "@/*": ["./src/*"],
      "@types/*": ["./typings/*"]
    }
  }
}
```

### 处理缺失的类型声明

当库没有可用的 @types 包时：

```typescript
// 方法1：创建简单的模块声明
// typings/untyped-library.d.ts
declare module 'untyped-library' {
  const lib: any;
  export default lib;
  export = lib;
}

// 方法2：创建更详细的类型声明
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

// 方法3：使用 any 快速跳过
// 在使用的文件中
// @ts-ignore
import something from 'completely-untyped';
```

## 为 JavaScript 库创建声明文件

### 基本步骤

1. **分析库的 API** - 查看文档、源码和示例
2. **创建 .d.ts 文件** - 为每个模块创建对应的声明文件
3. **测试声明** - 确保类型正确工作
4. **发布或贡献** - 发布到 npm 或贡献到 DefinitelyTyped

### 实战示例：为简单库创建声明

假设我们有一个简单的 JavaScript 工具库：

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

对应的声明文件：

```typescript
// string-utils.d.ts
/**
 * 字符串工具库
 * @packageDocumentation
 */

/**
 * 将字符串首字母大写
 * @param str - 输入字符串
 * @returns 首字母大写的字符串
 * @example
 * ```ts
 * capitalize('hello') // 'Hello'
 * capitalize('WORLD') // 'WORLD'
 * ```
 */
export function capitalize(str: string): string;

/**
 * 截断字符串到指定长度
 * @param str - 输入字符串
 * @param length - 最大长度
 * @param suffix - 截断后的后缀，默认为 '...'
 * @returns 截断后的字符串
 * @example
 * ```ts
 * truncate('Hello World', 5) // 'Hello...'
 * truncate('Hello', 10) // 'Hello'
 * truncate('Hello World', 5, '…') // 'Hello…'
 * ```
 */
export function truncate(str: string, length: number, suffix?: string): string;

/**
 * 将字符串转换为 URL 友好的 slug
 * @param str - 输入字符串
 * @returns slug 字符串
 * @example
 * ```ts
 * slugify('Hello World') // 'hello-world'
 * slugify('TypeScript 入门') // 'typescript-'
 * ```
 */
export function slugify(str: string): string;

/**
 * 将字符串转换为驼峰命名
 * @param str - 输入字符串
 * @returns 驼峰命名字符串
 * @example
 * ```ts
 * camelCase('hello-world') // 'helloWorld'
 * camelCase('hello_world') // 'helloWorld'
 * camelCase('Hello World') // 'helloWorld'
 * ```
 */
export function camelCase(str: string): string;

/**
 * 将字符串转换为短横线命名
 * @param str - 输入字符串
 * @returns 短横线命名字符串
 * @example
 * ```ts
 * kebabCase('helloWorld') // 'hello-world'
 * kebabCase('HelloWorld') // 'hello-world'
 * kebabCase('hello_world') // 'hello-world'
 * ```
 */
export function kebabCase(str: string): string;
```

### 实战示例：为复杂库创建声明

假设我们有一个更复杂的 HTTP 客户端库：

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
    // 实现细节...
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

对应的声明文件：

```typescript
// http-client.d.ts

declare namespace HttpClient {
  /**
   * 客户端配置选项
   */
  interface Config {
    /** 基础 URL，所有请求 URL 都会相对于此 */
    baseURL?: string;
    /** 默认请求头 */
    headers?: Record<string, string>;
    /** 请求超时时间（毫秒），默认 30000 */
    timeout?: number;
  }

  /**
   * 请求配置
   */
  interface RequestConfig {
    /** 请求 URL（相对于 baseURL） */
    url: string;
    /** HTTP 方法 */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    /** 请求头 */
    headers?: Record<string, string>;
    /** URL 查询参数 */
    params?: Record<string, string | number | boolean | undefined>;
    /** 请求体 */
    body?: any;
    /** 超时时间（毫秒） */
    timeout?: number;
    /** 信号，用于取消请求 */
    signal?: AbortSignal;
  }

  /**
   * 响应对象
   */
  interface Response<T = any> {
    /** 响应数据 */
    data: T;
    /** HTTP 状态码 */
    status: number;
    /** 状态文本 */
    statusText: string;
    /** 响应头 */
    headers: Record<string, string>;
    /** 原始请求配置 */
    config: RequestConfig;
  }

  /**
   * 请求选项
   */
  interface RequestOptions {
    /** 请求头 */
    headers?: Record<string, string>;
    /** URL 查询参数 */
    params?: Record<string, string | number | boolean | undefined>;
    /** 超时时间（毫秒） */
    timeout?: number;
    /** 信号，用于取消请求 */
    signal?: AbortSignal;
  }

  /**
   * 请求拦截器
   */
  type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

  /**
   * 响应拦截器
   */
  type ResponseInterceptor<T = any> = (response: Response<T>) => Response<T> | Promise<Response<T>>;

  /**
   * 拦截器类型
   */
  type InterceptorType = 'request' | 'response';

  /**
   * 取消拦截器的函数
   */
  type Unsubscribe = () => void;
}

/**
 * HTTP 客户端类
 * @example
 * ```ts
 * const client = HttpClient.create({ baseURL: 'https://api.example.com' });
 *
 * // GET 请求
 * const users = await client.get<User[]>('/users');
 *
 * // POST 请求
 * const newUser = await client.post<User>('/users', { name: 'John' });
 *
 * // 添加拦截器
 * const unsubscribe = client.use('request', (config) => {
 *   config.headers = { ...config.headers, Authorization: 'Bearer token' };
 *   return config;
 * });
 * ```
 */
declare class HttpClient {
  /** 基础 URL */
  baseURL: string;
  /** 默认请求头 */
  headers: Record<string, string>;
  /** 超时时间（毫秒） */
  timeout: number;

  /**
   * 创建 HttpClient 实例
   * @param config - 客户端配置
   */
  constructor(config?: HttpClient.Config);

  /**
   * 添加拦截器
   * @param type - 拦截器类型：'request' 或 'response'
   * @param interceptor - 拦截器函数
   * @returns 取消订阅函数
   */
  use(type: 'request', interceptor: HttpClient.RequestInterceptor): HttpClient.Unsubscribe;
  use<T = any>(type: 'response', interceptor: HttpClient.ResponseInterceptor<T>): HttpClient.Unsubscribe;

  /**
   * 发送请求
   * @param method - HTTP 方法
   * @param url - 请求 URL
   * @param options - 请求选项
   * @returns Promise 包含响应
   */
  request<T = any>(
    method: string,
    url: string,
    options?: HttpClient.RequestOptions & { body?: any }
  ): Promise<HttpClient.Response<T>>;

  /**
   * 发送 GET 请求
   * @param url - 请求 URL
   * @param options - 请求选项
   * @returns Promise 包含响应
   */
  get<T = any>(
    url: string,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * 发送 POST 请求
   * @param url - 请求 URL
   * @param data - 请求体数据
   * @param options - 请求选项
   * @returns Promise 包含响应
   */
  post<T = any>(
    url: string,
    data?: any,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * 发送 PUT 请求
   * @param url - 请求 URL
   * @param data - 请求体数据
   * @param options - 请求选项
   * @returns Promise 包含响应
   */
  put<T = any>(
    url: string,
    data?: any,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * 发送 DELETE 请求
   * @param url - 请求 URL
   * @param options - 请求选项
   * @returns Promise 包含响应
   */
  delete<T = any>(
    url: string,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * 发送 PATCH 请求
   * @param url - 请求 URL
   * @param data - 请求体数据
   * @param options - 请求选项
   * @returns Promise 包含响应
   */
  patch<T = any>(
    url: string,
    data?: any,
    options?: HttpClient.RequestOptions
  ): Promise<HttpClient.Response<T>>;

  /**
   * 创建新的 HttpClient 实例（静态方法）
   * @param config - 客户端配置
   * @returns 新的 HttpClient 实例
   */
  static create(config?: HttpClient.Config): HttpClient;
}

export = HttpClient;
export as namespace HttpClient;
```

### 使用泛型增强类型安全

```typescript
// event-emitter.d.ts - 类型安全的事件发射器
/**
 * 类型安全的事件发射器
 * @typeParam Events - 事件名称到参数数组的映射
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
 * // 类型安全的事件监听
 * emitter.on('user:login', (userId, timestamp) => {
 *   // userId: string, timestamp: Date
 *   console.log(`User ${userId} logged in at ${timestamp}`);
 * });
 *
 * // 类型安全的事件发射
 * emitter.emit('user:login', 'user123', new Date());
 *
 * // 类型错误示例
 * emitter.on('invalid', () => {}); // Error: 'invalid' 不是有效事件
 * emitter.emit('user:login', 123); // Error: userId 应该是 string
 * ```
 */
declare class TypedEventEmitter<Events extends Record<string, any[]>> {
  /**
   * 注册事件监听器
   * @param event - 事件名称
   * @param listener - 监听器函数
   * @returns this（支持链式调用）
   */
  on<E extends keyof Events>(
    event: E,
    listener: (...args: Events[E]) => void
  ): this;

  /**
   * 移除事件监听器
   * @param event - 事件名称
   * @param listener - 要移除的监听器函数
   * @returns this（支持链式调用）
   */
  off<E extends keyof Events>(
    event: E,
    listener: (...args: Events[E]) => void
  ): this;

  /**
   * 发射事件
   * @param event - 事件名称
   * @param args - 传递给监听器的参数
   * @returns 是否有监听器被调用
   */
  emit<E extends keyof Events>(event: E, ...args: Events[E]): boolean;

  /**
   * 注册一次性事件监听器
   * @param event - 事件名称
   * @param listener - 监听器函数（只会被调用一次）
   * @returns this（支持链式调用）
   */
  once<E extends keyof Events>(
    event: E,
    listener: (...args: Events[E]) => void
  ): this;

  /**
   * 移除指定事件的所有监听器
   * @param event - 事件名称（可选，不传则移除所有事件的监听器）
   * @returns this（支持链式调用）
   */
  removeAllListeners<E extends keyof Events>(event?: E): this;

  /**
   * 获取指定事件的监听器数量
   * @param event - 事件名称
   * @returns 监听器数量
   */
  listenerCount<E extends keyof Events>(event: E): number;

  /**
   * 获取指定事件的所有监听器
   * @param event - 事件名称
   * @returns 监听器数组
   */
  listeners<E extends keyof Events>(event: E): Array<(...args: Events[E]) => void>;

  /**
   * 获取所有已注册的事件名称
   * @returns 事件名称数组
   */
  eventNames(): Array<keyof Events>;
}

export = TypedEventEmitter;
```

## 声明文件的组织结构

### 单文件声明

适用于小型库：

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

### 多文件声明

适用于大型库，使用目录结构组织：

```
types/
├── index.d.ts          # 主入口，聚合所有导出
├── core.d.ts           # 核心类型
├── utils.d.ts          # 工具函数类型
├── constants.d.ts      # 常量类型
├── models/
│   ├── index.d.ts      # 模型入口
│   ├── user.d.ts       # 用户模型
│   ├── post.d.ts       # 文章模型
│   └── comment.d.ts    # 评论模型
├── services/
│   ├── index.d.ts      # 服务入口
│   ├── api.d.ts        # API 服务
│   ├── auth.d.ts       # 认证服务
│   └── storage.d.ts    # 存储服务
└── plugins/
    ├── index.d.ts      # 插件入口
    └── logger.d.ts     # 日志插件
```

```typescript
// types/index.d.ts - 主入口文件
/// <reference path="./core.d.ts" />
/// <reference path="./utils.d.ts" />
/// <reference path="./constants.d.ts" />
/// <reference path="./models/index.d.ts" />
/// <reference path="./services/index.d.ts" />
/// <reference path="./plugins/index.d.ts" />

declare module 'my-large-library' {
  // 从各个子模块重新导出
  export * from './core';
  export * from './utils';
  export * from './constants';
  export * from './models';
  export * from './services';
  export * from './plugins';

  // 默认导出
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

### 使用三斜杠指令

三斜杠指令用于声明文件之间的依赖：

```typescript
// types/my-node-library.d.ts
/// <reference types="node" />         // 引用 @types/node
/// <reference path="./common.d.ts" /> // 引用本地声明文件
/// <reference lib="es2020" />         // 引用内置库定义

declare module 'my-node-library' {
  import { EventEmitter } from 'events';
  import { Readable, Writable, Transform } from 'stream';
  import { IncomingMessage, ServerResponse } from 'http';

  /**
   * 自定义可读流
   */
  export class MyReadableStream extends Readable {
    constructor(options?: MyStreamOptions);
    pipe<T extends Writable>(destination: T, options?: { end?: boolean }): T;
    pause(): this;
    resume(): this;
  }

  /**
   * 自定义事件发射器
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
   * HTTP 中间件
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

## 声明文件的发布

### 与库一起发布

在 package.json 中指定类型入口：

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

### 自动生成声明文件

使用 TypeScript 编译器自动生成：

```json
// tsconfig.json
{
  "compilerOptions": {
    // 生成声明文件
    "declaration": true,
    // 声明文件输出目录
    "declarationDir": "./dist/types",
    // 生成声明文件的源映射
    "declarationMap": true,
    // 只生成声明文件，不生成 JS
    "emitDeclarationOnly": false,
    // 输出目录
    "outDir": "./dist",
    // 源文件目录
    "rootDir": "./src",
    // 从 node_modules 中排除类型
    "skipLibCheck": true,
    // 严格模式
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### 使用构建工具生成声明文件

```typescript
// rollup.config.js - 使用 Rollup 生成声明文件
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // 生成 JS
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.js', format: 'cjs' },
      { file: 'dist/index.esm.js', format: 'es' }
    ],
    plugins: [typescript()]
  },
  // 生成合并的声明文件
  {
    input: 'dist/types/index.d.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()]
  }
];
```

### 贡献到 DefinitelyTyped

1. Fork DefinitelyTyped 仓库
2. 创建新的类型包目录：`types/my-library/`
3. 创建必需文件

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

// 测试函数返回类型
const result: number = myFunction('test');

// 测试类实例化
const instance = new MyClass({ name: 'test' });
instance.method();

// 测试可选参数
const instanceWithValue = new MyClass({ name: 'test', value: 42 });

// 这些测试确保类型正确工作
// @ts-expect-error - 参数类型错误
myFunction(123);

// @ts-expect-error - 缺少必需属性
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

## 常见模式和最佳实践

### 条件类型在声明文件中的应用

```typescript
// 根据输入类型推断返回类型
declare function parse<T extends string | object>(
  input: T
): T extends string ? object : string;

// 提取 Promise 内部类型
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// 根据配置返回不同类型
interface FetchConfig<T extends boolean> {
  url: string;
  json: T;
}

declare function fetch<T extends boolean>(
  config: FetchConfig<T>
): Promise<T extends true ? object : string>;

// 使用示例
const jsonData = fetch({ url: '/api', json: true }); // Promise<object>
const textData = fetch({ url: '/api', json: false }); // Promise<string>
```

### 使用 this 类型实现链式调用

```typescript
declare class Builder<T extends object> {
  /**
   * 设置属性值
   */
  set<K extends keyof T>(key: K, value: T[K]): this;

  /**
   * 删除属性
   */
  unset<K extends keyof T>(key: K): this;

  /**
   * 条件设置
   */
  when(condition: boolean, callback: (builder: this) => this): this;

  /**
   * 构建最终对象
   */
  build(): T;
}

// 扩展 Builder
declare class ValidatedBuilder<T extends object> extends Builder<T> {
  /**
   * 验证当前数据
   */
  validate(): this;

  /**
   * 添加验证规则
   */
  addRule<K extends keyof T>(key: K, validator: (value: T[K]) => boolean): this;
}

// 使用示例
interface User {
  name: string;
  email: string;
  age: number;
}

declare const userBuilder: ValidatedBuilder<User>;

// 链式调用，所有方法都返回 this
userBuilder
  .set('name', 'John')
  .set('email', 'john@example.com')
  .addRule('age', (age) => age >= 0)
  .validate()
  .build();
```

### 函数重载的正确顺序

```typescript
// 重载从具体到一般排列
// TypeScript 按顺序匹配，找到第一个匹配的就使用

// 最具体的重载放在前面
declare function format(value: null | undefined): string;
declare function format(value: Date): string;
declare function format(value: number, decimals?: number): string;
declare function format(value: string, template?: string): string;
declare function format(value: boolean): string;
// 最通用的重载放在最后
declare function format(value: unknown): string;

// 使用时 TypeScript 会按顺序匹配
format(null);              // 使用第一个重载
format(new Date());        // 使用第二个重载
format(3.14159, 2);        // 使用第三个重载
format('hello', 'upper');  // 使用第四个重载
format(true);              // 使用第五个重载
format({ x: 1 });          // 使用最后的通用重载

// 另一个重载示例：createElement
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

// ... 其他属性接口
```

### 可调用对象和可构造对象

```typescript
// 既可以调用又可以 new 的对象
interface DateConstructor {
  // 作为函数调用，返回字符串
  (): string;

  // 作为构造函数，返回 Date 对象
  new (): Date;
  new (value: number | string): Date;
  new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): Date;

  // 静态方法
  now(): number;
  parse(s: string): number;
  UTC(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): number;

  // 静态属性
  readonly prototype: Date;
}

declare const Date: DateConstructor;

// 另一个示例：jQuery 风格的构造函数
interface JQueryConstructor {
  // 选择器调用
  (selector: string): JQueryElement;
  (selector: string, context: Element): JQueryElement;

  // 元素包装
  (element: Element): JQueryElement;
  (elements: Element[]): JQueryElement;

  // DOM Ready
  (callback: () => void): void;

  // HTML 创建
  (html: string): JQueryElement;

  // 静态方法
  ajax(settings: AjaxSettings): Promise<any>;
  get(url: string): Promise<any>;
  post(url: string, data?: any): Promise<any>;
  extend<T, U>(target: T, source: U): T & U;

  // 静态属性
  fn: JQueryElement;
}

interface JQueryElement {
  length: number;
  [index: number]: Element;
  // ... 实例方法
}

declare const $: JQueryConstructor;
declare const jQuery: JQueryConstructor;
```

### 索引签名和已知属性

```typescript
// 组合已知属性和动态属性
interface Config {
  // 已知的必需属性
  name: string;
  version: string;

  // 已知的可选属性
  description?: string;
  author?: string;

  // 索引签名允许额外的字符串属性
  [key: string]: string | number | boolean | undefined;
}

// 使用 Record 类型更加严格
interface StrictConfig {
  name: string;
  version: string;
  options: Record<string, unknown>;  // 额外选项放在单独字段中
}

// 使用接口继承分离关注点
interface BaseConfig {
  name: string;
  version: string;
}

interface ExtendedConfig extends BaseConfig {
  [key: string]: unknown;
}

// 使用交叉类型
type FlexibleConfig = {
  name: string;
  version: string;
} & Record<string, unknown>;
```

### 类型守卫声明

```typescript
// 声明类型守卫函数
declare function isString(value: unknown): value is string;
declare function isNumber(value: unknown): value is number;
declare function isArray<T>(value: unknown): value is T[];
declare function isObject(value: unknown): value is object;
declare function isNull(value: unknown): value is null;
declare function isUndefined(value: unknown): value is undefined;
declare function isNullOrUndefined(value: unknown): value is null | undefined;

// 复杂类型守卫
interface User {
  id: number;
  name: string;
  email: string;
}

declare function isUser(value: unknown): value is User;

// 断言函数
declare function assertString(value: unknown, message?: string): asserts value is string;
declare function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T;
declare function assertNever(value: never, message?: string): never;

// 使用示例
function processValue(value: unknown) {
  if (isString(value)) {
    // value 是 string
    console.log(value.toUpperCase());
  } else if (isNumber(value)) {
    // value 是 number
    console.log(value.toFixed(2));
  } else if (isUser(value)) {
    // value 是 User
    console.log(value.email);
  }
}
```

## 调试声明文件

### 常见错误及解决方案

```typescript
// 错误 1: 找不到模块的声明文件
// Error: Could not find a declaration file for module 'some-library'

// 解决方案 1: 安装 @types 包
// npm install --save-dev @types/some-library

// 解决方案 2: 创建本地声明文件
// typings/some-library.d.ts
declare module 'some-library' {
  export function someFunction(): void;
}

// 解决方案 3: 使用 require 并禁用检查
// const lib = require('some-library'); // @ts-ignore

// ---

// 错误 2: 命名空间与模块冲突
// Error: 'X' only refers to a type, but is being used as a namespace here

// 错误示例
declare module 'my-lib' {
  namespace MyLib {  // 这会导致问题
    interface Config {}
  }
}

// 正确做法
declare module 'my-lib' {
  export interface Config {}
  export function init(config: Config): void;
}

// ---

// 错误 3: 类型不兼容
// Error: Type 'X' is not assignable to type 'Y'

// 检查类型定义是否与实际 API 匹配
// 使用 typeof 检查运行时类型
// 使用 as 类型断言（谨慎使用）

// ---

// 错误 4: 隐式 any 类型
// Error: Parameter 'x' implicitly has an 'any' type

// 为所有参数和返回值添加类型注解
declare function process(data: unknown): ProcessedData;

// ---

// 错误 5: 重复声明
// Error: Duplicate identifier 'X'

// 检查是否在多个文件中声明了同一类型
// 使用模块增强而不是重新声明
```

### 使用 skipLibCheck

当遇到第三方声明文件问题时：

```json
{
  "compilerOptions": {
    // 跳过 .d.ts 文件的类型检查
    "skipLibCheck": true
  }
}
```

注意：`skipLibCheck` 会跳过所有声明文件的检查，包括你自己的，应谨慎使用。

### 类型检查和调试工具

```bash
# 检查类型解析路径
tsc --traceResolution

# 只进行类型检查，不生成输出
tsc --noEmit

# 生成详细的编译信息
tsc --extendedDiagnostics

# 列出所有被包含的文件
tsc --listFiles
```

```typescript
// 在代码中使用类型检查
type Test = typeof myFunction;
//   ^? 悬停查看类型

// 使用工具类型检查参数和返回值
type Params = Parameters<typeof myFunction>;
type Return = ReturnType<typeof myFunction>;

// 使用 @ts-expect-error 测试类型错误
// @ts-expect-error - 这里应该报错
const invalid: string = 123;

// 使用 satisfies 操作符验证类型
const config = {
  name: 'app',
  version: '1.0.0',
} satisfies Config;
```

## 总结

声明文件是 TypeScript 生态系统的重要组成部分，它们：

1. **提供类型安全** - 为 JavaScript 代码添加类型信息，在编译时捕获错误
2. **改善开发体验** - 提供智能提示、自动补全和内联文档
3. **作为 API 文档** - 清晰描述模块的公共接口和使用方式
4. **支持渐进式迁移** - 允许在 TypeScript 项目中无缝使用 JavaScript 库

### 关键要点

- 使用 `declare` 关键字声明环境类型，告诉 TypeScript 这些实体存在于其他地方
- 理解模块声明（`declare module`）与全局声明（`declare global`）的区别
- 善用 DefinitelyTyped 社区资源，优先使用已有的 @types 包
- 为自己的库创建高质量的声明文件，包含完整的 JSDoc 文档
- 遵循最佳实践：
  - 避免使用 `any`，优先使用 `unknown` 或具体类型
  - 使用命名空间组织相关类型
  - 函数重载从具体到一般排列
  - 添加详细的 JSDoc 注释
  - 编写类型测试文件验证声明正确性

### 进阶建议

1. **学习现有声明文件** - 阅读 @types 包中的声明文件，学习高质量类型定义的写法
2. **使用类型测试** - 为声明文件编写测试，确保类型按预期工作
3. **保持同步** - 当库更新时，及时更新对应的类型声明
4. **贡献社区** - 如果发现缺失或错误的类型定义，考虑贡献到 DefinitelyTyped

通过掌握声明文件的编写技巧，你能够更好地利用 TypeScript 的类型系统，无论是使用第三方库还是为自己的 JavaScript 库添加类型支持，都能游刃有余。
