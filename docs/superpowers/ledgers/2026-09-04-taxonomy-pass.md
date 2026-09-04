# Frontmatter taxonomy pass over the 290 topic pairs (Opus, 2026-09-04)

Answers item 4 of `2026-09-04-real-content-design-notes.md`: track hubs showed
mis-assigned topics, duplicate titles and three competing title styles. This pass touched
only `section` and `title` in `src/content/topics/*/*.{en,zh}.mdx` — no prose, no H1s, no
other frontmatter field.

Totals: **30 sections corrected**, **142 titles normalised** (en and/or zh), **7 duplicate
pairs resolved**. `src/data/tracks.ts` was the authority for every section id; no new
section id was invented.

## Rules applied to titles

1. Sentence case. Only the first word, proper nouns and identifiers keep a capital
   (`Hugging Face`, `Ruby on Rails`, `Spring Boot`, `Dev Containers`, `Map and Set`,
   `Proxy and Reflect`, `Box, Rc and Arc`, `Pin and Unpin`, `Span<T> and Memory<T>`).
2. Drop a leading track-name prefix when the topic is inside that track and the remainder
   still names the subject: `Python Control Flow` → `Control flow`, `Java Generics` →
   `Generics`, `Swift Optionals` → `Optionals`.
3. Exceptions to rule 2, kept deliberately:
   - the track's own entry topic, where the remainder would be a bare `Fundamentals` that
     names nothing: `Python fundamentals`, `Go fundamentals`, `Kotlin fundamentals`,
     `PHP fundamentals`, `Swift fundamentals`, `C# fundamentals`, `JavaScript fundamentals`,
     `Java language fundamentals`, `Backend development`, `Frontend development foundations`;
   - version-named topics (`Java 17 features`, `Java 21 features`, `PHP 8.0 features`);
   - the `C ` prefix inside the `cpp` track. The track is named `C++`, and the prefix is
     what separates the C topics (`C pointers`, `C preprocessor`, `C-style arrays`) from
     the C++ ones (`Classes`, `References`, `Smart pointers`);
   - `Security response headers` and `Web security fundamentals`, where the leading word is
     part of the concept, not the track name.
4. Serial commas dropped, for one house style: `map, filter and reduce`,
   `defer, panic and recover`, `call, apply and bind`, `Box, Rc and Arc`,
   `C structs, unions and enums`.
5. Chinese titles follow the English decision (prefix dropped when the English prefix was
   dropped), stay natural Simplified Chinese, and keep identifiers verbatim
   (`reflect.Type 与 reflect.Value`, `LEGB 名称查找`).
6. Every title is a noun phrase, ≤ 40 characters, with no colon. Verified over the whole
   corpus after the pass: longest is `Protocol constraints and existentials` (37).

## Section changes (30)

| Topic | From | To | Why |
| --- | --- | --- | --- |
| `cpp/raii` | `basics` | `memory-ownership` | RAII is the C++ ownership idiom, not a syntax basic. |
| `cpp/c-preprocessor` | `memory-ownership` | `basics` | Macros and conditional compilation are a language basic, not memory or ownership. |
| `csharp/events` | `basics` | `types-linq` | Events are delegate-typed members; they belong beside delegates in Types and LINQ. |
| `csharp/source-generators` | `types-linq` | `tooling` | Source generators are a compiler/build feature, so Tooling. |
| `frontend/css-flexbox` | `html-css` | `layout` | Flexbox is a layout module; Layout exists for exactly this. |
| `frontend/css-grid` | `html-css` | `layout` | Grid is a layout module; Layout exists for exactly this. |
| `frontend/responsive-design` | `html-css` | `layout` | Responsive design is layout work (breakpoints, fluid grids), not raw HTML/CSS syntax. |
| `go/maps` | `types-interfaces` | `basics` | Maps are a built-in composite type; they sit with slices in Basics. |
| `go/structs` | `basics` | `types-interfaces` | Structs carry embedding, method sets and tags, which is the Types and interfaces story. |
| `java/records` | `basics` | `oop-generics` | A record is a class kind, so OOP and generics rather than Basics. |
| `java/sealed-classes` | `basics` | `oop-generics` | Sealed hierarchies are an inheritance feature, so OOP and generics. |
| `javascript/closures` | `core` | `functions-scope` | A closure is a function plus its scope; the section is literally Functions and scope. |
| `javascript/this-binding` | `core` | `functions-scope` | `this` is decided by how a function is invoked, so Functions and scope. |
| `javascript/data-types` | `functions-scope` | `core` | Data types are core language, not functions or scope. |
| `kotlin/collections` | `functions-classes` | `basics` | The collection API is stdlib surface, not a functions-and-classes feature. |
| `kotlin/null-safety` | `functions-classes` | `basics` | Null safety is a core language rule taught early, so Basics. |
| `python/copy` | `basics` | `objects` | Shallow/deep copy is about object graphs and identity, so Objects and classes. |
| `python/django` | `basics` | `typing-tooling` | Django is a third-party framework, not a language basic; Typing and tooling is the track ecosystem section. |
| `python/fastapi` | `basics` | `typing-tooling` | FastAPI is a third-party framework, not a language basic; Typing and tooling is the track ecosystem section. |
| `rust/borrowing-rules` | `basics` | `ownership-borrowing` | Borrowing is the other half of Ownership and borrowing. |
| `rust/pattern-matching` | `ownership-borrowing` | `basics` | Pattern matching is a core syntax feature, unrelated to ownership. |
| `rust/pin` | `ownership-borrowing` | `concurrency-async` | Pin and Unpin exist for self-referential futures, so Concurrency and async. |
| `typescript/advanced-types` | `type-system` | `generics-advanced` | Conditional/mapped types are the advanced half of Generics and advanced types. |
| `typescript/basics` | `type-system` | `basics` | The entry topic on basic types belongs in Basics. |
| `typescript/branded-types` | `type-system` | `generics-advanced` | Branding is an advanced typing technique built on intersections. |
| `typescript/declaration-files` | `type-system` | `config-migration` | `.d.ts` authoring is a config and migration concern. |
| `typescript/generics` | `type-system` | `generics-advanced` | Generics has its own section in this track. |
| `typescript/strict-mode` | `type-system` | `config-migration` | `strict` is a tsconfig flag, so Config and migration. |
| `typescript/type-coverage` | `type-system` | `config-migration` | Type coverage is a migration metric and tool, so Config and migration. |
| `typescript/utility-types` | `type-system` | `generics-advanced` | Utility types are built from conditional and mapped types. |

Sections left alone after review, with the reasoning recorded so the next pass does not
redo it: the `backend` framework and client topics (Django, FastAPI, Flask, Elysia, Hono,
Laravel, Rails, Spring Boot, tRPC, Requests, HTTPX, URLSession) stay in `http-apis`,
because the backend track has no framework section and `http-apis` is the closest
registered one; `foundations`, `ai-era`, `architecture`, `security`, `gamedev`, `devops`,
`data` and `datascience` were already consistent.

## Duplicate titles resolved (7 pairs)

| Pair | Verdict | Kept | Retitled |
| --- | --- | --- | --- |
| `python/scope` · `python/scope-namespaces` | Same subject — the two files are byte-identical apart from `difficulty`, one `<Term>` link, the quiz id and `origin`. `scope-namespaces` is the better copy (glossary link, correct `intermediate` level, 8 inbound references against 2). | `python/scope-namespaces` → `Scope and namespaces` | `python/scope` → `LEGB name lookup` (the article's dominant mechanism) |
| `go/reflect` · `go/reflection` | Same subject. `reflect` is longer (466 vs 433 lines), covers struct tags and the Go 1.27 API boundary, and has 10 inbound references against 2. | `go/reflect` → `Reflection` | `go/reflection` → `reflect.Type and reflect.Value`, which is what its body actually walks through (Type, Value, Kind, settability, nil boundaries) |
| `go/generics` · `go/type-parameters` | Same subject — in Go, type parameters *are* generics. `generics` has 15 inbound references against 4. | `go/generics` → `Generics` | `go/type-parameters` → `Constraints and type sets`, its real focus (type-set algebra, receiver parameters, `comparable` edges) |
| `rust/ownership` · `rust/ownership-rules` | Same subject. `ownership` is the beginner entry with 28 inbound references. | `rust/ownership` → `Ownership` | `rust/ownership-rules` → `Moves, partial moves and drops`, matching its H2s (initialization state, partial moves, destruction order) |
| `rust/lifetimes` · `rust/lifetime-annotations` | Same subject at different altitudes; `lifetimes` is the broader article (variance, HRTB, reborrowing, trait-object defaults). | `rust/lifetimes` → `Lifetimes` | `rust/lifetime-annotations` → `Lifetime elision and annotations`, matching its H3s (signatures as constraints, elision rules, borrowed fields) |
| `swift/protocols` · `swift/generics` · `swift/protocols-generics` | Three topics where the third read as the union of the first two. | `swift/protocols` → `Protocols`, `swift/generics` → `Generics` | `swift/protocols-generics` → `Protocol constraints and existentials` (`some` vs `any`, existentials, type erasure, conditional conformance) |
| `csharp/events` · `csharp/delegates-events` | Overlapping; `delegates-events` is the broader article (10 inbound references against 6) and now sits next to it after the section move. | `csharp/delegates-events` → `Delegates and events` | `csharp/events` → `Event subscription and lifetime`, its real angle (subscribe/unsubscribe, publisher retention, exception policy, reentrancy) |

Noted but deliberately not retitled: `backend/wsgi` (`WSGI`) and `backend/wsgi-asgi`
(`WSGI and ASGI`) overlap in content, but the titles already state different scopes.

Still open for a content pass, not a frontmatter one: `python/scope` and
`python/scope-namespaces` remain two copies of the same 400-line article. The titles no
longer collide, but one of them needs to be rewritten to its new title or the pair merged.

## Title changes (142)

| Topic | Title (en) | Title (zh) |
| --- | --- | --- |
| `ai/getting-started` | `LLM Application Basics` → `LLM application basics` | (unchanged) |
| `ai/nlp` | `Natural Language Processing` → `Natural language processing` | (unchanged) |
| `ai-era/ai-coding-cli` | `AI Coding CLIs` → `AI coding CLIs` | (unchanged) |
| `backend/jwt-authentication` | `JWT Authentication` → `JWT authentication` | (unchanged) |
| `backend/restful-api-design` | `RESTful API Design` → `RESTful API design` | (unchanged) |
| `cpp/c-file-io` | `C File I/O` → `C file I/O` | (unchanged) |
| `cpp/c-function-pointers` | `C Function Pointers` → `C function pointers` | (unchanged) |
| `cpp/c-structs-unions` | `C Structs, Unions, and Enums` → `C structs, unions and enums` | (unchanged) |
| `cpp/classes` | `C++ Classes` → `Classes` | `C++ 类` → `类` |
| `cpp/exceptions` | `C++ exceptions` → `Exceptions` | `C++ 异常处理` → `异常处理` |
| `cpp/inheritance` | `C++ Inheritance` → `Inheritance` | `C++ 继承` → `继承` |
| `cpp/namespaces` | `C++ Namespaces` → `Namespaces` | `C++ 命名空间` → `命名空间` |
| `cpp/operator-overloading` | `C++ operator overloading` → `Operator overloading` | `C++ 运算符重载` → `运算符重载` |
| `cpp/virtual-functions` | `C++ Virtual Functions` → `Virtual functions` | `C++ 虚函数` → `虚函数` |
| `cpp/references` | `C++ references` → `References` | `C++ 引用` → `引用` |
| `cpp/smart-pointers` | `C++ Smart Pointers` → `Smart pointers` | `C++ 智能指针` → `智能指针` |
| `csharp/data-types` | `C# data types` → `Data types` | `C# 数据类型` → `数据类型` |
| `csharp/events` | `C# events` → `Event subscription and lifetime` | `C# 事件` → `事件订阅与生命周期` |
| `csharp/exceptions` | `C# exceptions` → `Exceptions` | `C# 异常` → `异常` |
| `csharp/fundamentals` | `C# Fundamentals` → `C# fundamentals` | (unchanged) |
| `csharp/properties` | `C# Properties` → `Properties` | `C# 属性` → `属性` |
| `csharp/attributes` | `C# attributes` → `Attributes` | `C# 特性` → `特性` |
| `csharp/collections` | `C# collections` → `Collections` | `C# 集合` → `集合` |
| `csharp/delegates-events` | `C# delegates and events` → `Delegates and events` | `C# 委托与事件` → `委托与事件` |
| `csharp/expression-trees` | `C# expression trees` → `Expression trees` | `C# 表达式树` → `表达式树` |
| `csharp/pattern-matching` | `Pattern Matching` → `Pattern matching` | (unchanged) |
| `csharp/reflection` | `C# Reflection` → `Reflection` | `C# 反射` → `反射` |
| `csharp/source-generators` | `C# Source Generators` → `Source generators` | `C# 源生成器` → `源生成器` |
| `devops/wasm-containers` | `WebAssembly Containers` → `WebAssembly containers` | (unchanged) |
| `foundations/git-deep-dive` | `Git's Internal Model` → `Git's internal model` | (unchanged) |
| `frontend/css-animation` | `CSS Animations` → `CSS animations` | (unchanged) |
| `frontend/css-flexbox` | `CSS Flexbox` → `CSS flexbox` | (unchanged) |
| `frontend/css-grid` | `CSS Grid` → `CSS grid` | (unchanged) |
| `frontend/getting-started` | `Frontend Development Foundations` → `Frontend development foundations` | (unchanged) |
| `frontend/responsive-design` | `Responsive Web Design` → `Responsive web design` | (unchanged) |
| `go/defer-panic-recover` | `defer, panic, and recover` → `defer, panic and recover` | (unchanged) |
| `go/slices` | `Go slices` → `Slices` | `Go 切片` → `切片` |
| `go/maps` | `Go maps` → `Maps` | `Go map` → `Map` |
| `go/generics` | `Go generics` → `Generics` | `Go 泛型` → `泛型` |
| `go/type-parameters` | `Go type parameters` → `Constraints and type sets` | `Go 类型参数` → `约束与类型集` |
| `go/methods` | `Go Methods` → `Methods` | `Go 方法` → `方法` |
| `go/reflect` | `Go Reflection` → `Reflection` | `Go 反射` → `反射` |
| `go/reflection` | `Go Reflection` → `reflect.Type and reflect.Value` | `Go 反射` → `reflect.Type 与 reflect.Value` |
| `java/data-types` | `Java Data Types` → `Data types` | `Java 数据类型` → `数据类型` |
| `java/exceptions` | `Java Exceptions` → `Exceptions` | `Java 异常处理` → `异常处理` |
| `java/fundamentals` | `Java Language Fundamentals` → `Java language fundamentals` | (unchanged) |
| `java/java17-features` | `Java 17 Features` → `Java 17 features` | (unchanged) |
| `java/java21-features` | `Java 21 Features` → `Java 21 features` | (unchanged) |
| `java/records` | `Java records` → `Records` | `Java 记录类` → `记录类` |
| `java/sealed-classes` | `Java sealed classes` → `Sealed classes` | `Java 密封类` → `密封类` |
| `java/strings` | `Java Strings` → `Strings` | `Java 字符串` → `字符串` |
| `java/annotations` | `Java annotations` → `Annotations` | `Java 注解` → `注解` |
| `java/generics` | `Java Generics` → `Generics` | `Java 泛型` → `泛型` |
| `java/inner-classes` | `Java inner classes` → `Inner classes` | `Java 内部类` → `内部类` |
| `java/interfaces` | `Java Interfaces` → `Interfaces` | `Java 接口` → `接口` |
| `java/oop` | `Java Object-Oriented Programming` → `Object-oriented programming` | `Java 面向对象编程` → `面向对象编程` |
| `java/reflection` | `Java reflection` → `Reflection` | `Java 反射` → `反射` |
| `java/type-erasure` | `Java type erasure` → `Type erasure` | `Java 类型擦除` → `类型擦除` |
| `javascript/array-methods` | `JavaScript array methods` → `Array methods` | `JavaScript 数组方法` → `数组方法` |
| `javascript/classes` | `JavaScript classes` → `Classes` | `JavaScript 类` → `类` |
| `javascript/error-handling` | `Error Handling` → `Error handling` | (unchanged) |
| `javascript/iterators-generators` | `Iterators and Generators` → `Iterators and generators` | (unchanged) |
| `javascript/json` | `JavaScript JSON` → `JSON` | `JavaScript JSON` → `JSON` |
| `javascript/math-object` | `JavaScript Math object` → `Math object` | `JavaScript Math 对象` → `Math 对象` |
| `javascript/memory-management` | `JavaScript Memory Management` → `Memory management` | `JavaScript 内存管理` → `内存管理` |
| `javascript/modules` | `JavaScript Modules` → `Modules` | `JavaScript 模块` → `模块` |
| `javascript/object-methods` | `Object Static Methods` → `Object static methods` | (unchanged) |
| `javascript/objects-prototypes` | `Objects and Prototypes` → `Objects and prototypes` | (unchanged) |
| `javascript/private-fields` | `JavaScript private fields` → `Private fields` | `JavaScript 私有字段` → `私有字段` |
| `javascript/regexp` | `JavaScript Regular Expressions` → `Regular expressions` | `JavaScript 正则表达式` → `正则表达式` |
| `javascript/string-methods` | `JavaScript String Methods` → `String methods` | `JavaScript 字符串方法` → `字符串方法` |
| `javascript/arrow-functions` | `Arrow Functions` → `Arrow functions` | (unchanged) |
| `javascript/call-apply-bind` | `call, apply, and bind` → `call, apply and bind` | (unchanged) |
| `javascript/data-types` | `Data Types` → `Data types` | (unchanged) |
| `javascript/functions` | `JavaScript Functions` → `Functions` | `JavaScript 函数` → `函数` |
| `kotlin/collections` | `Kotlin Collections` → `Collections` | `Kotlin 集合` → `集合` |
| `kotlin/dsl` | `Kotlin DSLs` → `DSLs` | `Kotlin DSL` → `DSL` |
| `kotlin/extensions` | `Kotlin extensions` → `Extensions` | `Kotlin 扩展` → `扩展` |
| `kotlin/inline-classes` | `Kotlin inline value classes` → `Inline value classes` | `Kotlin 内联值类` → `内联值类` |
| `kotlin/null-safety` | `Kotlin null safety` → `Null safety` | `Kotlin 空安全` → `空安全` |
| `kotlin/oop` | (unchanged) | `Kotlin 面向对象编程` → `面向对象编程` |
| `kotlin/sealed-classes` | `Sealed Classes and Interfaces` → `Sealed classes and interfaces` | (unchanged) |
| `php/array-functions` | `PHP array functions` → `Array functions` | `PHP 数组函数` → `数组函数` |
| `php/arrays` | `PHP arrays` → `Arrays` | `PHP 数组` → `数组` |
| `php/data-types` | `PHP data types` → `Data types` | `PHP 数据类型` → `数据类型` |
| `php/enums` | `PHP enums` → `Enums` | `PHP 枚举` → `枚举` |
| `php/error-handling` | `PHP error handling` → `Error handling` | `PHP 错误处理` → `错误处理` |
| `php/exceptions` | `PHP exceptions` → `Exceptions` | `PHP 异常` → `异常` |
| `php/namespaces` | `PHP namespaces` → `Namespaces` | `PHP 命名空间` → `命名空间` |
| `php/php8-features` | `PHP 8.0 Features` → `PHP 8.0 features` | (unchanged) |
| `php/magic-methods` | `PHP magic methods` → `Magic methods` | `PHP 魔术方法` → `魔术方法` |
| `php/oop` | `PHP object-oriented programming` → `Object-oriented programming` | `PHP 面向对象编程` → `面向对象编程` |
| `php/traits` | `PHP traits` → `Traits` | `PHP Trait` → `Trait` |
| `python/control-flow` | `Python Control Flow` → `Control flow` | `Python 控制流` → `控制流` |
| `python/copy` | `Shallow and Deep Copy` → `Shallow and deep copy` | (unchanged) |
| `python/functions` | `Python Functions` → `Functions` | `Python 函数` → `函数` |
| `python/list-comprehensions` | `List Comprehensions` → `List comprehensions` | (unchanged) |
| `python/sets` | `Python Sets` → `Sets` | `Python 集合` → `集合` |
| `python/variables-data-types` | `Python variables and data types` → `Variables and data types` | `Python 变量与数据类型` → `变量与数据类型` |
| `python/decorators` | `Python decorators` → `Decorators` | `Python 装饰器` → `装饰器` |
| `python/lru-cache` | `lru_cache Function Caching` → `lru_cache function caching` | (unchanged) |
| `python/map-filter-reduce` | `map, filter, and reduce` → `map, filter and reduce` | (unchanged) |
| `python/scope` | `Python scope and namespaces` → `LEGB name lookup` | `Python 作用域与命名空间` → `LEGB 名称查找` |
| `python/scope-namespaces` | `Python scope and namespaces` → `Scope and namespaces` | `Python 作用域与命名空间` → `作用域与命名空间` |
| `rust/borrowing-rules` | (unchanged) | `Rust 借用规则` → `借用规则` |
| `rust/collections` | `Rust collections` → `Collections` | `Rust 集合` → `集合` |
| `rust/modules-crates` | (unchanged) | `Rust 模块与 crate` → `模块与 crate` |
| `rust/strings` | `Rust strings` → `Strings` | `Rust 字符串` → `字符串` |
| `rust/box-rc-arc` | `Box, Rc, and Arc` → `Box, Rc and Arc` | (unchanged) |
| `rust/lifetime-annotations` | `Rust lifetime annotations` → `Lifetime elision and annotations` | `Rust 生命周期标注` → `生命周期省略与标注` |
| `rust/lifetimes` | `Rust lifetimes` → `Lifetimes` | `Rust 生命周期` → `生命周期` |
| `rust/ownership-rules` | `Rust ownership rules` → `Moves, partial moves and drops` | `Rust 所有权规则` → `移动、部分移动与丢弃` |
| `rust/pattern-matching` | `Rust Pattern Matching` → `Pattern matching` | `Rust 模式匹配` → `模式匹配` |
| `security/security-headers` | `Security Response Headers` → `Security response headers` | (unchanged) |
| `security/ssrf` | `Server-Side Request Forgery` → `Server-side request forgery` | (unchanged) |
| `security/web-security-fundamentals` | `Web Security Fundamentals` → `Web security fundamentals` | (unchanged) |
| `swift/arc` | `Automatic Reference Counting` → `Automatic reference counting` | (unchanged) |
| `swift/closures` | `Swift Closures` → `Closures` | `Swift 闭包` → `闭包` |
| `swift/enums-pattern-matching` | `Enums and Pattern Matching` → `Enums and pattern matching` | (unchanged) |
| `swift/error-handling` | `Swift Error Handling` → `Error handling` | `Swift 错误处理` → `错误处理` |
| `swift/fundamentals` | `Swift Fundamentals` → `Swift fundamentals` | (unchanged) |
| `swift/structs-classes` | `Swift Structures and Classes` → `Structures and classes` | `Swift 结构体与类` → `结构体与类` |
| `swift/extensions` | `Swift Extensions` → `Extensions` | `Swift 扩展` → `扩展` |
| `swift/generics` | `Swift generics` → `Generics` | `Swift 泛型` → `泛型` |
| `swift/optionals` | `Swift Optionals` → `Optionals` | `Swift 可选类型` → `可选类型` |
| `swift/property-wrappers` | `Swift Property Wrappers` → `Property wrappers` | `Swift 属性包装器` → `属性包装器` |
| `swift/protocols` | `Swift Protocols` → `Protocols` | `Swift 协议` → `协议` |
| `swift/protocols-generics` | `Protocols and generics` → `Protocol constraints and existentials` | `协议与泛型` → `协议约束与存在类型` |
| `typescript/advanced-types` | `Advanced TypeScript Types` → `Advanced types` | `TypeScript 高级类型` → `高级类型` |
| `typescript/basics` | `TypeScript Basic Types` → `Basic types` | `TypeScript 基础类型` → `基础类型` |
| `typescript/branded-types` | `Branded Types` → `Branded types` | `TypeScript 品牌类型` → `品牌类型` |
| `typescript/enums` | `TypeScript Enums` → `Enums` | `TypeScript 枚举` → `枚举` |
| `typescript/generics` | `TypeScript generics` → `Generics` | `TypeScript 泛型` → `泛型` |
| `typescript/literal-types` | `TypeScript Literal Types` → `Literal types` | `TypeScript 字面量类型` → `字面量类型` |
| `typescript/satisfies` | `satisfies Operator` → `satisfies operator` | (unchanged) |
| `typescript/strict-mode` | `TypeScript strict mode` → `Strict mode` | `TypeScript 严格模式` → `严格模式` |
| `typescript/type-coverage` | `TypeScript type coverage` → `Type coverage` | `TypeScript 类型覆盖率` → `类型覆盖率` |
| `typescript/type-guards` | `Type Guards` → `Type guards` | (unchanged) |
| `typescript/type-inference` | `Type Inference` → `Type inference` | (unchanged) |
| `typescript/type-narrowing` | `Type Narrowing` → `Type narrowing` | (unchanged) |
| `typescript/union-intersection` | `Union and Intersection Types` → `Union and intersection types` | (unchanged) |
| `typescript/utility-types` | `TypeScript Utility Types` → `Utility types` | `TypeScript 工具类型` → `工具类型` |

## Out-of-scope repairs the gate forced

`pnpm content:check` failed on five topics for a reason unrelated to frontmatter: eight
`issues` entries in review quiz items wrote the *end line* into `lines`, which the checker
reads as a span, so `line: 14` + `lines: 22` claimed line 35 of a 22-line snippet. All
eight were converted to real spans, leaving the highlighted range as authored.

| Quiz | Item · issue | `line` | `lines` before → after |
| --- | --- | --- | --- |
| `python/fastapi` | 4 · 2 | 14 | 22 → 9 |
| `python/fastapi` | 4 · 4 | 18 | 19 → 2 |
| `backend/fastapi` | 4 · 2 | 14 | 22 → 9 |
| `backend/fastapi` | 4 · 4 | 18 | 19 → 2 |
| `frontend/sass` | 4 · 2 | 13 | 14 → 2 |
| `frontend/sass` | 4 · 3 | 17 | 24 → 8 |
| `java/annotations` | 4 · 4 | 16 | 18 → 3 |
| `java/generics` | 4 · 2 | 12 | 14 → 3 |

A corpus-wide scan found no other review item whose issue range runs past its snippet.
