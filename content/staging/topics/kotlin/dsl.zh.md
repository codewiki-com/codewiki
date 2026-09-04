---
title: 领域特定语言（DSL）
description: Kotlin DSL 完整指南，构建类型安全的领域特定语言
track: kotlin
section: functions-classes
difficulty: advanced
tags:
  - Kotlin
  - DSL
  - Type-safe
  - Builders
status: imported
origin: old/src/content/docs/kotlin/dsl.zh.md
divergence: 0.231
issues: []
legacy:
  category: Kotlin
  subcategory: Advanced Features
  order: 6
  lastUpdated: 2026-01-07
---

领域特定语言（DSL）是专门设计用于在特定问题领域中以最大清晰度和最小样板代码表达解决方案的专用迷你语言。Kotlin 强大的语言特性使其成为构建类型安全、富有表达力且感觉像语言本身自然扩展的内部 DSL 的最佳平台之一。

---

## 什么是 DSL？

领域特定语言是针对特定问题类别优化的编程语言。与通用语言（如 Kotlin、Java 或 Python）不同，DSL 用通用性换取在目标领域内的表达力。

### DSL 的类型

**外部 DSL** 是具有自己语法和解析器的独立语言：
- SQL 用于数据库查询
- 正则表达式用于模式匹配
- HTML/CSS 用于网页标记和样式
- YAML/JSON 用于配置

**内部 DSL**（也称为嵌入式 DSL）是在宿主语言内构建的，利用其语法：
- Kotlin 的类型安全构建器
- Gradle Kotlin DSL
- Ktor 路由定义
- Kotest 规范

本指南重点介绍 Kotlin 中的**内部 DSL**，它提供了几个优势：

- **类型安全**：编译器在编译时捕获错误
- **IDE 支持**：完整的自动补全、重构和导航
- **无需解析器**：使用宿主语言的编译器
- **无缝集成**：可以自由地将 DSL 代码与常规 Kotlin 混合

### DSL 设计目标

设计良好的 DSL 应该：

1. **像散文一样阅读**：代码应该清晰地表达意图
2. **最小化样板代码**：消除语法噪音
3. **防止无效状态**：使用类型系统强制约束
4. **提供可发现性**：IDE 自动补全引导用户

```kotlin
// 没有 DSL - 冗长且嘈杂
val html = HTML()
val body = Body()
val div = Div()
div.addClass("container")
val p = Paragraph()
p.setText("Hello, World!")
div.addChild(p)
body.addChild(div)
html.setBody(body)

// 使用 DSL - 清晰且富有表达力
val html = html {
    body {
        div(class_ = "container") {
            p { +"Hello, World!" }
        }
    }
}
```

---

## Kotlin 中的 DSL 基础

Kotlin 提供了几个使 DSL 构建优雅的语言特性：

| 特性 | DSL 应用 |
|---------|----------------|
| 带接收者的 Lambda | 在块中提供隐式 `this` 上下文 |
| 扩展函数 | 向现有类型添加领域特定方法 |
| 中缀函数 | 启用自然的双操作数语法 |
| 操作符重载 | 有意义地使用 `+`、`-`、`[]` 等符号 |
| @DslMarker | 防止嵌套构建器中的作用域混淆 |
| 默认/命名参数 | 减少样板代码并提高可读性 |

让我们深入探索每一个。

---

## 带接收者的 Lambda

带接收者的 Lambda 是 Kotlin DSL 设计的基石。它允许你在 lambda 块内对隐式接收者对象调用方法，创建一个作用域上下文。

### 理解语法

```kotlin
// 常规 lambda：显式参数
val greet: (String) -> String = { name -> "Hello, $name!" }

// 带接收者的 lambda：隐式 'this'
val greetWithReceiver: String.() -> String = { "Hello, $this!" }

// 用法
println(greet("World"))                    // Hello, World!
println("World".greetWithReceiver())       // Hello, World!
println(greetWithReceiver("World"))        // 也可以：Hello, World!
```

函数类型 `String.() -> String` 意味着：
- `String.` - 接收者类型（作为 `this` 可用）
- `()` - 没有额外参数
- `-> String` - 返回 String

### 它如何启用 DSL

```kotlin
class StringBuilder {
    private val content = mutableListOf<String>()

    fun append(text: String) {
        content.add(text)
    }

    override fun toString() = content.joinToString("")
}

// 带 lambda 接收者的构建器函数
fun buildString(block: StringBuilder.() -> Unit): String {
    val builder = StringBuilder()
    builder.block()  // 'builder' 是接收者
    return builder.toString()
}

// 用法 - 'this' 指向 StringBuilder
val result = buildString {
    append("Hello, ")
    append("Kotlin ")
    append("DSL!")
}
println(result)  // Hello, Kotlin DSL!
```

### apply、with 和 run 函数

Kotlin 标准库广泛使用带接收者的 lambda：

```kotlin
// apply：配置对象并返回它
data class Person(var name: String = "", var age: Int = 0)

val person = Person().apply {
    name = "Alice"
    age = 30
}

// with：操作对象并返回结果
val description = with(person) {
    "Name: $name, Age: $age"
}

// run：结合 apply 和 with
val greeting = person.run {
    "Hello, I'm $name and I'm $age years old"
}

// let：安全地操作可空值
val length = person.name?.let { it.length }
```

### 编译器如何转换带接收者的 Lambda

理解编译有助于揭开 DSL 行为的神秘面纱：

```kotlin
// 你写的：
buildString {
    append("Hello")
    append("World")
}

// 编译器看到的（概念上）：
buildString(object : StringBuilder.() -> Unit {
    override fun invoke(receiver: StringBuilder) {
        receiver.append("Hello")
        receiver.append("World")
    }
})
```

### 嵌套接收者

DSL 通常嵌套多个接收者：

```kotlin
class HTML {
    private val children = mutableListOf<Element>()

    fun body(block: Body.() -> Unit) {
        val body = Body()
        body.block()
        children.add(body)
    }

    override fun toString() = "<html>${children.joinToString("")}</html>"
}

class Body : Element("body") {
    fun div(block: Div.() -> Unit) {
        val div = Div()
        div.block()
        children.add(div)
    }
}

class Div : Element("div")

abstract class Element(private val tag: String) {
    protected val children = mutableListOf<Element>()

    override fun toString() = "<$tag>${children.joinToString("")}</$tag>"
}

fun html(block: HTML.() -> Unit): HTML {
    val html = HTML()
    html.block()
    return html
}

// 用法
val page = html {
    body {
        div {
            // 嵌套上下文
        }
    }
}
```

---

## @DslMarker 注解

当 DSL 嵌套多个接收者时，会出现一个问题：内部 lambda 可能意外访问外部接收者。`@DslMarker` 注解可以防止这种作用域泄漏。

### 没有 @DslMarker 的问题

```kotlin
class Outer {
    fun outerMethod() = println("Outer method called")

    fun inner(block: Inner.() -> Unit) {
        Inner().block()
    }
}

class Inner {
    fun innerMethod() = println("Inner method called")
}

fun outer(block: Outer.() -> Unit) = Outer().apply(block)

// 没有 @DslMarker - 这可以编译但可能不是预期的
outer {
    inner {
        innerMethod()   // OK - Inner 的方法
        outerMethod()   // 也 OK！- 意外调用了 Outer 的方法
    }
}
```

### 解决方案：@DslMarker

```kotlin
@DslMarker
annotation class HtmlDsl

@HtmlDsl
class HTML {
    fun body(block: Body.() -> Unit) {
        Body().apply(block)
    }

    fun head(block: Head.() -> Unit) {
        Head().apply(block)
    }
}

@HtmlDsl
class Body {
    fun div(block: Div.() -> Unit) {
        Div().apply(block)
    }
}

@HtmlDsl
class Head {
    fun title(text: String) { }
}

@HtmlDsl
class Div {
    fun p(text: String) { }
}

fun html(block: HTML.() -> Unit) = HTML().apply(block)

// 使用 @DslMarker
html {
    body {
        div {
            p("Hello")
            // head { }  // 编译错误！head() 不在 Div 的作用域内
            // 要访问外部接收者，必须显式指定：
            // this@html.head { }
        }
    }
}
```

### @DslMarker 的工作原理

1. 创建一个用 `@DslMarker` 注解的标记注解
2. 将此注解应用于所有 DSL 类
3. 编译器限制对用相同 `@DslMarker` 标记的接收者的隐式访问
4. 需要显式限定（`this@label`）才能访问外部作用域

### 完整的 @DslMarker 示例

```kotlin
@DslMarker
annotation class FormDsl

@FormDsl
class Form(val action: String) {
    private val fields = mutableListOf<FormField>()

    fun textField(name: String, block: TextField.() -> Unit = {}) {
        fields.add(TextField(name).apply(block))
    }

    fun selectField(name: String, block: SelectField.() -> Unit) {
        fields.add(SelectField(name).apply(block))
    }

    fun submit(text: String) {
        fields.add(SubmitButton(text))
    }

    fun render(): String = buildString {
        appendLine("<form action=\"$action\">")
        fields.forEach { appendLine("  ${it.render()}") }
        appendLine("</form>")
    }
}

@FormDsl
sealed class FormField {
    abstract fun render(): String
}

@FormDsl
class TextField(private val name: String) : FormField() {
    var label: String = ""
    var placeholder: String = ""
    var required: Boolean = false

    override fun render(): String {
        val attrs = mutableListOf("name=\"$name\"")
        if (placeholder.isNotEmpty()) attrs.add("placeholder=\"$placeholder\"")
        if (required) attrs.add("required")
        val input = "<input type=\"text\" ${attrs.joinToString(" ")}/>"
        return if (label.isNotEmpty()) "<label>$label $input</label>" else input
    }
}

@FormDsl
class SelectField(private val name: String) : FormField() {
    private val options = mutableListOf<Pair<String, String>>()
    var label: String = ""

    fun option(value: String, text: String) {
        options.add(value to text)
    }

    override fun render(): String {
        val optionsHtml = options.joinToString("\n") { (v, t) ->
            "    <option value=\"$v\">$t</option>"
        }
        val select = "<select name=\"$name\">\n$optionsHtml\n  </select>"
        return if (label.isNotEmpty()) "<label>$label $select</label>" else select
    }
}

class SubmitButton(private val text: String) : FormField() {
    override fun render() = "<button type=\"submit\">$text</button>"
}

fun form(action: String, block: Form.() -> Unit): Form {
    return Form(action).apply(block)
}

// 用法
val registrationForm = form("/register") {
    textField("username") {
        label = "Username"
        placeholder = "Enter username"
        required = true
    }

    textField("email") {
        label = "Email"
        placeholder = "user@example.com"
        required = true
    }

    selectField("country") {
        label = "Country"
        option("us", "United States")
        option("uk", "United Kingdom")
        option("ca", "Canada")

        // 使用 @DslMarker 这将是编译错误：
        // textField("invalid") { }  // 错误：textField 不在 SelectField 作用域内
    }

    submit("Register")
}

println(registrationForm.render())
```

---

## 类型安全构建器

类型安全构建器结合了带接收者的 lambda、@DslMarker 和 Kotlin 的类型系统，创建在编译时防止无效配置的 API。

### 类型安全构建器的构建块

```kotlin
@DslMarker
annotation class ConfigDsl

@ConfigDsl
class ServerConfig {
    var host: String = "localhost"
    var port: Int = 8080

    private var _ssl: SslConfig? = null
    private var _database: DatabaseConfig? = null
    private val endpoints = mutableListOf<Endpoint>()

    val ssl: SslConfig? get() = _ssl
    val database: DatabaseConfig? get() = _database

    fun ssl(block: SslConfig.() -> Unit) {
        _ssl = SslConfig().apply(block)
    }

    fun database(block: DatabaseConfig.() -> Unit) {
        _database = DatabaseConfig().apply(block)
    }

    fun endpoint(path: String, block: Endpoint.() -> Unit) {
        endpoints.add(Endpoint(path).apply(block))
    }

    fun validate(): List<String> {
        val errors = mutableListOf<String>()
        if (port !in 1..65535) errors.add("Invalid port: $port")
        if (host.isBlank()) errors.add("Host cannot be blank")
        _ssl?.let { ssl ->
            if (ssl.certPath.isBlank()) errors.add("SSL cert path required")
            if (ssl.keyPath.isBlank()) errors.add("SSL key path required")
        }
        return errors
    }
}

@ConfigDsl
class SslConfig {
    var certPath: String = ""
    var keyPath: String = ""
    var protocols: List<String> = listOf("TLSv1.2", "TLSv1.3")
}

@ConfigDsl
class DatabaseConfig {
    var url: String = ""
    var username: String = ""
    var password: String = ""
    var maxConnections: Int = 10

    fun connectionString() = "$url?user=$username"
}

@ConfigDsl
class Endpoint(val path: String) {
    var method: HttpMethod = HttpMethod.GET
    var handler: (Request) -> Response = { Response(200, "OK") }

    fun get(handler: (Request) -> Response) {
        this.method = HttpMethod.GET
        this.handler = handler
    }

    fun post(handler: (Request) -> Response) {
        this.method = HttpMethod.POST
        this.handler = handler
    }
}

enum class HttpMethod { GET, POST, PUT, DELETE, PATCH }
data class Request(val body: String, val params: Map<String, String> = emptyMap())
data class Response(val status: Int, val body: String)

fun server(block: ServerConfig.() -> Unit): ServerConfig {
    return ServerConfig().apply(block).also { config ->
        val errors = config.validate()
        require(errors.isEmpty()) { "Configuration errors: ${errors.joinToString()}" }
    }
}

// 用法
val config = server {
    host = "0.0.0.0"
    port = 443

    ssl {
        certPath = "/etc/ssl/cert.pem"
        keyPath = "/etc/ssl/key.pem"
        protocols = listOf("TLSv1.3")
    }

    database {
        url = "jdbc:postgresql://localhost:5432/mydb"
        username = "admin"
        password = "secret"
        maxConnections = 50
    }

    endpoint("/api/users") {
        get { request ->
            Response(200, """{"users": []}""")
        }
    }

    endpoint("/api/users") {
        post { request ->
            Response(201, """{"id": 1}""")
        }
    }
}
```

### HTML 构建器示例

类型安全构建器的经典示例是 HTML 生成：

```kotlin
@DslMarker
annotation class HtmlTagMarker

@HtmlTagMarker
abstract class Tag(val name: String) {
    protected val children = mutableListOf<Tag>()
    protected val attributes = mutableMapOf<String, String>()

    protected fun <T : Tag> initTag(tag: T, block: T.() -> Unit): T {
        tag.block()
        children.add(tag)
        return tag
    }

    operator fun String.unaryPlus() {
        children.add(TextNode(this))
    }

    fun attr(name: String, value: String) {
        attributes[name] = value
    }

    override fun toString(): String {
        val attrString = if (attributes.isEmpty()) "" else {
            " " + attributes.entries.joinToString(" ") { "${it.key}=\"${it.value}\"" }
        }
        return if (children.isEmpty()) {
            "<$name$attrString/>"
        } else {
            "<$name$attrString>${children.joinToString("")}</$name>"
        }
    }
}

class TextNode(private val text: String) : Tag("") {
    override fun toString() = text
}

class HTML : Tag("html") {
    fun head(block: Head.() -> Unit) = initTag(Head(), block)
    fun body(block: Body.() -> Unit) = initTag(Body(), block)
}

class Head : Tag("head") {
    fun title(block: Title.() -> Unit) = initTag(Title(), block)
    fun meta(name: String, content: String) {
        children.add(Meta().apply {
            attr("name", name)
            attr("content", content)
        })
    }
    fun link(rel: String, href: String) {
        children.add(Link().apply {
            attr("rel", rel)
            attr("href", href)
        })
    }
}

class Meta : Tag("meta")
class Link : Tag("link")
class Title : Tag("title")

class Body : Tag("body") {
    fun div(className: String? = null, block: Div.() -> Unit) =
        initTag(Div(), block).also { className?.let { c -> it.attr("class", c) } }
    fun h1(block: H1.() -> Unit) = initTag(H1(), block)
    fun h2(block: H2.() -> Unit) = initTag(H2(), block)
    fun p(className: String? = null, block: P.() -> Unit) =
        initTag(P(), block).also { className?.let { c -> it.attr("class", c) } }
    fun a(href: String, block: A.() -> Unit) =
        initTag(A(), block).also { it.attr("href", href) }
    fun ul(block: Ul.() -> Unit) = initTag(Ul(), block)
    fun form(action: String, method: String = "POST", block: FormTag.() -> Unit) =
        initTag(FormTag(), block).also {
            it.attr("action", action)
            it.attr("method", method)
        }
}

class Div : Tag("div") {
    fun div(className: String? = null, block: Div.() -> Unit) =
        initTag(Div(), block).also { className?.let { c -> it.attr("class", c) } }
    fun p(block: P.() -> Unit) = initTag(P(), block)
    fun span(block: Span.() -> Unit) = initTag(Span(), block)
    fun h1(block: H1.() -> Unit) = initTag(H1(), block)
    fun h2(block: H2.() -> Unit) = initTag(H2(), block)
    fun a(href: String, block: A.() -> Unit) =
        initTag(A(), block).also { it.attr("href", href) }
}

class H1 : Tag("h1")
class H2 : Tag("h2")
class P : Tag("p")
class Span : Tag("span")
class A : Tag("a")
class Ul : Tag("ul") {
    fun li(block: Li.() -> Unit) = initTag(Li(), block)
}
class Li : Tag("li")

class FormTag : Tag("form") {
    fun input(type: String, name: String, block: Input.() -> Unit = {}) =
        initTag(Input(), block).also {
            it.attr("type", type)
            it.attr("name", name)
        }
    fun button(type: String = "submit", block: Button.() -> Unit) =
        initTag(Button(), block).also { it.attr("type", type) }
}

class Input : Tag("input")
class Button : Tag("button")

fun html(block: HTML.() -> Unit): HTML = HTML().apply(block)

// 用法
val page = html {
    head {
        title { +"My Kotlin DSL Page" }
        meta("viewport", "width=device-width, initial-scale=1")
        link("stylesheet", "/styles.css")
    }
    body {
        div("container") {
            h1 { +"Welcome to Kotlin DSL" }
            p { +"This page was generated using a type-safe builder." }

            div("card") {
                h2 { +"Features" }
                // ul { } 在这里不可用 - 类型安全！
            }

            a("https://kotlinlang.org") {
                +"Learn Kotlin"
            }
        }

        form("/submit", "POST") {
            input("text", "username") {
                attr("placeholder", "Username")
            }
            input("password", "password") {
                attr("placeholder", "Password")
            }
            button { +"Login" }
        }
    }
}

println(page)
```

---

## DSL 中的扩展函数

扩展函数允许向现有类型添加新功能而无需修改它们，非常适合创建流畅的 DSL API。

### 基本扩展

```kotlin
// 向现有类型添加 DSL 友好的方法
fun String.toSlug(): String =
    this.lowercase()
        .replace(Regex("[^a-z0-9\\s-]"), "")
        .replace(Regex("\\s+"), "-")
        .trim('-')

fun <T> List<T>.second(): T = this[1]
fun <T> List<T>.secondOrNull(): T? = this.getOrNull(1)

// 扩展属性
val String.wordCount: Int
    get() = this.split(Regex("\\s+")).filter { it.isNotEmpty() }.size

println("Hello World".wordCount)  // 2
println("My Blog Post Title".toSlug())  // my-blog-post-title
```

### 带接收者的扩展

```kotlin
class QueryBuilder {
    private val conditions = mutableListOf<String>()
    private var table = ""
    private val columns = mutableListOf<String>()
    private var orderColumn: String? = null
    private var orderDirection = "ASC"
    private var limitCount: Int? = null

    fun from(tableName: String): QueryBuilder {
        table = tableName
        return this
    }

    fun select(vararg cols: String): QueryBuilder {
        columns.addAll(cols)
        return this
    }

    fun where(condition: String): QueryBuilder {
        conditions.add(condition)
        return this
    }

    fun orderBy(column: String, direction: String = "ASC"): QueryBuilder {
        orderColumn = column
        orderDirection = direction
        return this
    }

    fun limit(count: Int): QueryBuilder {
        limitCount = count
        return this
    }

    fun build(): String = buildString {
        append("SELECT ")
        append(if (columns.isEmpty()) "*" else columns.joinToString(", "))
        append(" FROM $table")
        if (conditions.isNotEmpty()) {
            append(" WHERE ")
            append(conditions.joinToString(" AND "))
        }
        orderColumn?.let { append(" ORDER BY $it $orderDirection") }
        limitCount?.let { append(" LIMIT $it") }
    }
}

// 用于流畅 API 的扩展函数
fun QueryBuilder.whereEquals(column: String, value: Any): QueryBuilder =
    where("$column = ${formatValue(value)}")

fun QueryBuilder.whereIn(column: String, values: List<Any>): QueryBuilder =
    where("$column IN (${values.joinToString { formatValue(it) }})")

fun QueryBuilder.whereLike(column: String, pattern: String): QueryBuilder =
    where("$column LIKE ${formatValue(pattern)}")

fun QueryBuilder.whereNotNull(column: String): QueryBuilder =
    where("$column IS NOT NULL")

private fun formatValue(value: Any): String = when (value) {
    is String -> "'$value'"
    is Number -> value.toString()
    else -> "'$value'"
}

fun query(block: QueryBuilder.() -> Unit): String {
    return QueryBuilder().apply(block).build()
}

// 用法
val sql = query {
    select("id", "name", "email")
    from("users")
    whereEquals("status", "active")
    whereNotNull("email")
    whereLike("name", "John%")
    orderBy("created_at", "DESC")
    limit(10)
}

println(sql)
// SELECT id, name, email FROM users WHERE status = 'active' AND email IS NOT NULL AND name LIKE 'John%' ORDER BY created_at DESC LIMIT 10
```

### DSL 中的扩展属性

```kotlin
class StyleBuilder {
    private val styles = mutableMapOf<String, String>()

    fun set(property: String, value: String) {
        styles[property] = value
    }

    fun build(): String = styles.entries.joinToString("; ") { "${it.key}: ${it.value}" }
}

// 常见 CSS 属性的扩展属性
var StyleBuilder.color: String
    get() = throw UnsupportedOperationException()
    set(value) = set("color", value)

var StyleBuilder.backgroundColor: String
    get() = throw UnsupportedOperationException()
    set(value) = set("background-color", value)

var StyleBuilder.fontSize: String
    get() = throw UnsupportedOperationException()
    set(value) = set("font-size", value)

var StyleBuilder.padding: String
    get() = throw UnsupportedOperationException()
    set(value) = set("padding", value)

var StyleBuilder.margin: String
    get() = throw UnsupportedOperationException()
    set(value) = set("margin", value)

var StyleBuilder.display: String
    get() = throw UnsupportedOperationException()
    set(value) = set("display", value)

fun style(block: StyleBuilder.() -> Unit): String {
    return StyleBuilder().apply(block).build()
}

// 用法
val css = style {
    color = "#333"
    backgroundColor = "#fff"
    fontSize = "16px"
    padding = "20px"
    margin = "0 auto"
    display = "flex"
}

println(css)  // color: #333; background-color: #fff; font-size: 16px; padding: 20px; margin: 0 auto; display: flex
```

---

## 用于自然语法的中缀函数

中缀函数允许省略单参数成员或扩展函数的点和括号，创建更自然的语法。

### 基本中缀函数

```kotlin
// 必须是成员或扩展函数
// 必须恰好有一个参数
infix fun Int.times(str: String): String = str.repeat(this)
infix fun String.shouldEqual(expected: String) {
    if (this != expected) throw AssertionError("Expected '$expected' but got '$this'")
}

// 用法 - 可以不用点和括号调用
println(3 times "Hello ")  // Hello Hello Hello
"test" shouldEqual "test"  // 通过
```

### 测试 DSL 中的中缀函数

```kotlin
class Assertion<T>(private val actual: T) {
    infix fun shouldBe(expected: T) {
        if (actual != expected) {
            throw AssertionError("Expected <$expected> but was <$actual>")
        }
    }

    infix fun shouldNotBe(expected: T) {
        if (actual == expected) {
            throw AssertionError("Expected value to not be <$expected>")
        }
    }
}

class StringAssertion(private val actual: String) {
    infix fun shouldContain(substring: String) {
        if (substring !in actual) {
            throw AssertionError("Expected '$actual' to contain '$substring'")
        }
    }

    infix fun shouldStartWith(prefix: String) {
        if (!actual.startsWith(prefix)) {
            throw AssertionError("Expected '$actual' to start with '$prefix'")
        }
    }

    infix fun shouldMatch(regex: Regex) {
        if (!actual.matches(regex)) {
            throw AssertionError("Expected '$actual' to match ${regex.pattern}")
        }
    }
}

class CollectionAssertion<T>(private val actual: Collection<T>) {
    infix fun shouldHaveSize(expectedSize: Int) {
        if (actual.size != expectedSize) {
            throw AssertionError("Expected size $expectedSize but was ${actual.size}")
        }
    }

    infix fun shouldContain(element: T) {
        if (element !in actual) {
            throw AssertionError("Expected collection to contain $element")
        }
    }
}

// 工厂函数
fun <T> expect(actual: T) = Assertion(actual)
fun expect(actual: String) = StringAssertion(actual)
fun <T> expect(actual: Collection<T>) = CollectionAssertion(actual)

// 在测试中使用
fun testExample() {
    val result = 2 + 2
    expect(result) shouldBe 4

    val name = "Kotlin DSL"
    expect(name) shouldContain "DSL"
    expect(name) shouldStartWith "Kotlin"

    val list = listOf(1, 2, 3)
    expect(list) shouldHaveSize 3
    expect(list) shouldContain 2
}
```

### 使用中缀的时间 DSL

```kotlin
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

// 自定义时间表达式
data class TimeExpression(val amount: Long, val unit: TimeUnit)

enum class TimeUnit { SECONDS, MINUTES, HOURS, DAYS }

// 用于自然语法的扩展属性
val Int.secs: TimeExpression get() = TimeExpression(this.toLong(), TimeUnit.SECONDS)
val Int.mins: TimeExpression get() = TimeExpression(this.toLong(), TimeUnit.MINUTES)
val Int.hrs: TimeExpression get() = TimeExpression(this.toLong(), TimeUnit.HOURS)
val Int.dys: TimeExpression get() = TimeExpression(this.toLong(), TimeUnit.DAYS)

// "ago" 和 "fromNow" 的中缀
infix fun TimeExpression.ago(from: java.time.Instant): java.time.Instant {
    val seconds = when (unit) {
        TimeUnit.SECONDS -> amount
        TimeUnit.MINUTES -> amount * 60
        TimeUnit.HOURS -> amount * 3600
        TimeUnit.DAYS -> amount * 86400
    }
    return from.minusSeconds(seconds)
}

// 使用 Kotlin 内置的 Duration 来处理更简单的情况
val timeout = 30.seconds
val cacheExpiry = 1.hours
val tokenLifetime = 7.days

// 中缀算术
infix fun Duration.and(other: Duration): Duration = this + other

val totalTime = 2.hours and 30.minutes  // 2h 30m
```

---

## 操作符重载

Kotlin 允许重载预定义的操作符，为领域特定操作启用直观的语法。

### 常见操作符

| 操作符 | 函数名 | 表达式 |
|----------|---------------|------------|
| `+` | `plus` | `a + b` |
| `-` | `minus` | `a - b` |
| `*` | `times` | `a * b` |
| `/` | `div` | `a / b` |
| `%` | `rem` | `a % b` |
| `[]` | `get`/`set` | `a[i]`, `a[i] = b` |
| `()` | `invoke` | `a()`, `a(b)` |
| `in` | `contains` | `a in b` |
| `..` | `rangeTo` | `a..b` |
| `+=` | `plusAssign` | `a += b` |
| `unaryMinus` | `unaryMinus` | `-a` |
| `!` | `not` | `!a` |

### 向量数学 DSL

```kotlin
data class Vector2D(val x: Double, val y: Double) {
    // 算术操作符
    operator fun plus(other: Vector2D) = Vector2D(x + other.x, y + other.y)
    operator fun minus(other: Vector2D) = Vector2D(x - other.x, y - other.y)
    operator fun times(scalar: Double) = Vector2D(x * scalar, y * scalar)
    operator fun div(scalar: Double) = Vector2D(x / scalar, y / scalar)

    // 一元操作符
    operator fun unaryMinus() = Vector2D(-x, -y)
    operator fun unaryPlus() = this

    // 比较
    operator fun compareTo(other: Vector2D): Int =
        magnitude.compareTo(other.magnitude)

    // 索引
    operator fun get(index: Int): Double = when (index) {
        0 -> x
        1 -> y
        else -> throw IndexOutOfBoundsException("Vector2D has only 2 components")
    }

    // 属性
    val magnitude: Double get() = kotlin.math.sqrt(x * x + y * y)
    val normalized: Vector2D get() = this / magnitude

    // 点积作为中缀
    infix fun dot(other: Vector2D): Double = x * other.x + y * other.y

    override fun toString() = "($x, $y)"
}

// 标量 * 向量的扩展
operator fun Double.times(vector: Vector2D) = vector * this

// 用法
val v1 = Vector2D(3.0, 4.0)
val v2 = Vector2D(1.0, 2.0)

println(v1 + v2)           // (4.0, 6.0)
println(v1 - v2)           // (2.0, 2.0)
println(v1 * 2.0)          // (6.0, 8.0)
println(2.0 * v1)          // (6.0, 8.0)
println(-v1)               // (-3.0, -4.0)
println(v1[0])             // 3.0
println(v1.magnitude)      // 5.0
println(v1 dot v2)         // 11.0
```

### invoke 操作符

`invoke` 操作符允许对象像函数一样被调用：

```kotlin
class Command(private val name: String) {
    operator fun invoke(vararg args: String): CommandResult {
        println("Executing: $name ${args.joinToString(" ")}")
        return CommandResult(0, "Success")
    }
}

data class CommandResult(val exitCode: Int, val output: String)

// 用法
val git = Command("git")
val result = git("commit", "-m", "Initial commit")

// DSL 应用：路由处理器
class RouteHandler {
    private val routes = mutableMapOf<String, (Request) -> Response>()

    operator fun String.invoke(handler: (Request) -> Response) {
        routes[this] = handler
    }

    fun handle(path: String, request: Request): Response? {
        return routes[path]?.invoke(request)
    }
}

data class Request(val params: Map<String, String> = emptyMap())
data class Response(val body: String, val status: Int = 200)

fun routes(block: RouteHandler.() -> Unit): RouteHandler {
    return RouteHandler().apply(block)
}

val api = routes {
    "/users" { request ->
        Response("User list")
    }

    "/users/{id}" { request ->
        val id = request.params["id"]
        Response("User $id")
    }
}
```

### 使用操作符的集合构建器

```kotlin
class JsonBuilder {
    private val content = mutableMapOf<String, Any?>()

    // 用索引赋值
    operator fun set(key: String, value: Any?) {
        content[key] = value
    }

    // 用索引获取
    operator fun get(key: String): Any? = content[key]

    // 用 += 添加条目
    operator fun plusAssign(pair: Pair<String, Any?>) {
        content[pair.first] = pair.second
    }

    // 嵌套对象
    fun obj(key: String, block: JsonBuilder.() -> Unit) {
        content[key] = JsonBuilder().apply(block).build()
    }

    // 数组
    fun array(key: String, block: JsonArrayBuilder.() -> Unit) {
        content[key] = JsonArrayBuilder().apply(block).build()
    }

    fun build(): Map<String, Any?> = content.toMap()

    override fun toString(): String = buildJsonString(content)
}

class JsonArrayBuilder {
    private val items = mutableListOf<Any?>()

    operator fun Any?.unaryPlus() {
        items.add(this)
    }

    fun obj(block: JsonBuilder.() -> Unit) {
        items.add(JsonBuilder().apply(block).build())
    }

    fun build(): List<Any?> = items.toList()
}

private fun buildJsonString(value: Any?, indent: Int = 0): String {
    val spaces = "  ".repeat(indent)
    return when (value) {
        null -> "null"
        is String -> "\"$value\""
        is Number, is Boolean -> value.toString()
        is Map<*, *> -> {
            val entries = value.entries.joinToString(",\n") { (k, v) ->
                "$spaces  \"$k\": ${buildJsonString(v, indent + 1)}"
            }
            "{\n$entries\n$spaces}"
        }
        is List<*> -> {
            val items = value.joinToString(",\n") { "$spaces  ${buildJsonString(it, indent + 1)}" }
            "[\n$items\n$spaces]"
        }
        else -> "\"$value\""
    }
}

fun json(block: JsonBuilder.() -> Unit): String {
    return buildJsonString(JsonBuilder().apply(block).build())
}

// 用法
val jsonOutput = json {
    this["name"] = "John Doe"
    this["age"] = 30
    this["active"] = true
    this += "email" to "john@example.com"  // 使用 plusAssign

    obj("address") {
        this["street"] = "123 Main St"
        this["city"] = "New York"
        this["zip"] = "10001"
    }

    array("tags") {
        +"developer"
        +"kotlin"
        +"dsl"
    }

    array("projects") {
        obj {
            this["name"] = "Project A"
            this["status"] = "active"
        }
        obj {
            this["name"] = "Project B"
            this["status"] = "completed"
        }
    }
}

println(jsonOutput)
```

---

## Gradle Kotlin DSL

Gradle Kotlin DSL 是 Kotlin DSL 最突出的实际示例之一。它用类型安全的 `build.gradle.kts` 文件取代了传统的基于 Groovy 的 `build.gradle`。

### 基本结构

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.22"
    application
}

group = "com.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
    google()
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("io.ktor:ktor-server-core:2.3.7")

    testImplementation(kotlin("test"))
    testImplementation("io.mockk:mockk:1.13.8")
}

kotlin {
    jvmToolchain(17)
}

application {
    mainClass.set("com.example.MainKt")
}

tasks.test {
    useJUnitPlatform()
}
```

### 理解 DSL 模式

```kotlin
// plugins 块使用特殊的 DSL
plugins {
    // 这是 PluginDependenciesSpec 上的扩展函数
    kotlin("jvm") version "1.9.22"

    // 'application' 是属性访问器
    application

    // id() 是函数调用
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

// dependencies 块
dependencies {
    // 这些是 DependencyHandlerScope 上的扩展函数
    implementation("group:artifact:version")

    // 平台对齐
    implementation(platform("org.springframework.boot:spring-boot-dependencies:3.2.0"))

    // 项目依赖
    implementation(project(":core"))

    // 带配置块
    implementation("group:artifact:version") {
        exclude(group = "org.slf4j")
        isTransitive = false
    }
}
```

### 自定义任务定义

```kotlin
// 定义自定义任务
tasks.register("generateDocs") {
    group = "documentation"
    description = "Generates project documentation"

    doLast {
        println("Generating documentation...")
        // 任务实现
    }
}

// 类型化任务
tasks.register<Copy>("copyResources") {
    from("src/main/resources")
    into("build/resources")
    include("**/*.json", "**/*.xml")
}

// 配置现有任务
tasks.named<Jar>("jar") {
    manifest {
        attributes(
            "Main-Class" to "com.example.MainKt",
            "Implementation-Version" to project.version
        )
    }
}

// 任务依赖
tasks.named("build") {
    dependsOn("generateDocs")
}
```

### 多项目构建

```kotlin
// settings.gradle.kts
rootProject.name = "my-project"

include(
    "core",
    "api",
    "web",
    "common:utils",
    "common:models"
)

// 根 build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.22" apply false
}

allprojects {
    group = "com.example"
    version = "1.0.0"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")

    dependencies {
        "implementation"(kotlin("stdlib"))
        "testImplementation"(kotlin("test"))
    }

    tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
        kotlinOptions {
            jvmTarget = "17"
            freeCompilerArgs = listOf("-Xjsr305=strict")
        }
    }
}
```

### 创建 Gradle 插件 DSL

```kotlin
// 在 buildSrc 或单独的插件项目中
open class MyPluginExtension {
    var enabled: Boolean = true
    var outputDir: String = "build/generated"
    var features: MutableList<String> = mutableListOf()

    fun feature(name: String) {
        features.add(name)
    }
}

class MyPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val extension = project.extensions.create<MyPluginExtension>("myPlugin")

        project.tasks.register("myTask") {
            doLast {
                if (extension.enabled) {
                    println("Output: ${extension.outputDir}")
                    println("Features: ${extension.features}")
                }
            }
        }
    }
}

// 在 build.gradle.kts 中使用
plugins {
    id("com.example.my-plugin")
}

myPlugin {
    enabled = true
    outputDir = "build/output"
    feature("caching")
    feature("logging")
}
```

---

## 实际 DSL 示例

### 测试框架 DSL（Kotest 风格）

```kotlin
@DslMarker
annotation class SpecDsl

@SpecDsl
abstract class Spec(val name: String) {
    private val testCases = mutableListOf<TestCase>()
    private var beforeAll: (() -> Unit)? = null
    private var afterAll: (() -> Unit)? = null
    private var beforeEach: (() -> Unit)? = null
    private var afterEach: (() -> Unit)? = null

    protected fun beforeAll(block: () -> Unit) { beforeAll = block }
    protected fun afterAll(block: () -> Unit) { afterAll = block }
    protected fun beforeEach(block: () -> Unit) { beforeEach = block }
    protected fun afterEach(block: () -> Unit) { afterEach = block }

    protected fun test(description: String, block: TestContext.() -> Unit) {
        testCases.add(TestCase(description, block))
    }

    protected infix fun String.should(block: TestContext.() -> Unit) {
        testCases.add(TestCase(this, block))
    }

    fun run() {
        println("\n$name")
        println("=".repeat(name.length))

        beforeAll?.invoke()

        var passed = 0
        var failed = 0

        testCases.forEach { testCase ->
            beforeEach?.invoke()
            try {
                TestContext().apply(testCase.block)
                println("  [PASS] ${testCase.description}")
                passed++
            } catch (e: AssertionError) {
                println("  [FAIL] ${testCase.description}")
                println("         ${e.message}")
                failed++
            }
            afterEach?.invoke()
        }

        afterAll?.invoke()

        println("\nResults: $passed passed, $failed failed")
    }
}

data class TestCase(val description: String, val block: TestContext.() -> Unit)

@SpecDsl
class TestContext {
    infix fun <T> T.shouldBe(expected: T) {
        if (this != expected) {
            throw AssertionError("Expected <$expected> but was <$this>")
        }
    }

    infix fun <T> T.shouldNotBe(expected: T) {
        if (this == expected) {
            throw AssertionError("Expected value to not be <$expected>")
        }
    }

    fun <T> T.shouldBeNull() {
        if (this != null) {
            throw AssertionError("Expected null but was <$this>")
        }
    }

    fun <T> T.shouldNotBeNull(): T {
        if (this == null) {
            throw AssertionError("Expected non-null value")
        }
        return this
    }

    infix fun String.shouldContain(substring: String) {
        if (substring !in this) {
            throw AssertionError("Expected '$this' to contain '$substring'")
        }
    }

    infix fun <T> Collection<T>.shouldContain(element: T) {
        if (element !in this) {
            throw AssertionError("Expected collection to contain $element")
        }
    }

    infix fun <T> Collection<T>.shouldHaveSize(size: Int) {
        if (this.size != size) {
            throw AssertionError("Expected size $size but was ${this.size}")
        }
    }

    fun <T : Throwable> shouldThrow(type: kotlin.reflect.KClass<T>, block: () -> Unit): T {
        try {
            block()
            throw AssertionError("Expected ${type.simpleName} to be thrown")
        } catch (e: Throwable) {
            if (type.isInstance(e)) {
                @Suppress("UNCHECKED_CAST")
                return e as T
            }
            throw AssertionError("Expected ${type.simpleName} but ${e::class.simpleName} was thrown")
        }
    }
}

// 用法
class CalculatorSpec : Spec("Calculator Tests") {
    private var calculator: Calculator? = null

    init {
        beforeEach {
            calculator = Calculator()
        }

        test("addition works correctly") {
            calculator!!.add(2, 3) shouldBe 5
        }

        "subtraction handles negative results" should {
            calculator!!.subtract(3, 5) shouldBe -2
        }

        test("division by zero throws exception") {
            shouldThrow(ArithmeticException::class) {
                calculator!!.divide(10, 0)
            }
        }

        test("list operations") {
            val result = calculator!!.multiplyAll(listOf(1, 2, 3, 4))
            result shouldBe 24
            listOf(1, 2, 3) shouldHaveSize 3
            listOf(1, 2, 3) shouldContain 2
        }
    }
}

class Calculator {
    fun add(a: Int, b: Int) = a + b
    fun subtract(a: Int, b: Int) = a - b
    fun divide(a: Int, b: Int) = a / b
    fun multiplyAll(numbers: List<Int>) = numbers.reduce { acc, n -> acc * n }
}

// 运行测试
fun main() {
    CalculatorSpec().run()
}
```

### HTTP 路由 DSL（Ktor 风格）

```kotlin
@DslMarker
annotation class RouterDsl

@RouterDsl
class Router {
    private val routes = mutableListOf<Route>()

    fun get(path: String, handler: RouteContext.() -> Unit) {
        routes.add(Route(HttpMethod.GET, path, handler))
    }

    fun post(path: String, handler: RouteContext.() -> Unit) {
        routes.add(Route(HttpMethod.POST, path, handler))
    }

    fun put(path: String, handler: RouteContext.() -> Unit) {
        routes.add(Route(HttpMethod.PUT, path, handler))
    }

    fun delete(path: String, handler: RouteContext.() -> Unit) {
        routes.add(Route(HttpMethod.DELETE, path, handler))
    }

    fun route(path: String, block: Router.() -> Unit) {
        val subRouter = Router()
        subRouter.block()
        subRouter.routes.forEach { route ->
            routes.add(route.copy(path = path + route.path))
        }
    }

    fun handle(method: HttpMethod, path: String): RouteContext? {
        val route = routes.find { it.method == method && matchPath(it.path, path) }
        return route?.let {
            val params = extractParams(it.path, path)
            RouteContext(params).apply(it.handler)
        }
    }

    private fun matchPath(pattern: String, path: String): Boolean {
        val patternParts = pattern.split("/")
        val pathParts = path.split("/")
        if (patternParts.size != pathParts.size) return false
        return patternParts.zip(pathParts).all { (p, a) ->
            p.startsWith("{") || p == a
        }
    }

    private fun extractParams(pattern: String, path: String): Map<String, String> {
        val params = mutableMapOf<String, String>()
        val patternParts = pattern.split("/")
        val pathParts = path.split("/")
        patternParts.zip(pathParts).forEach { (p, a) ->
            if (p.startsWith("{") && p.endsWith("}")) {
                params[p.removeSurrounding("{", "}")] = a
            }
        }
        return params
    }
}

enum class HttpMethod { GET, POST, PUT, DELETE }

data class Route(
    val method: HttpMethod,
    val path: String,
    val handler: RouteContext.() -> Unit
)

@RouterDsl
class RouteContext(val params: Map<String, String> = emptyMap()) {
    var statusCode: Int = 200
    var responseBody: String = ""
    val headers = mutableMapOf<String, String>()

    fun param(name: String): String? = params[name]

    fun respond(body: String, status: Int = 200) {
        responseBody = body
        statusCode = status
    }

    fun json(body: Any, status: Int = 200) {
        headers["Content-Type"] = "application/json"
        responseBody = body.toString()  // 实际应使用正确的 JSON 序列化
        statusCode = status
    }

    fun header(name: String, value: String) {
        headers[name] = value
    }
}

fun router(block: Router.() -> Unit): Router {
    return Router().apply(block)
}

// 用法
val app = router {
    get("/") {
        respond("Welcome to the API")
    }

    route("/api") {
        route("/users") {
            get("") {
                json(mapOf("users" to listOf("Alice", "Bob")))
            }

            get("/{id}") {
                val userId = param("id")
                json(mapOf("id" to userId, "name" to "User $userId"))
            }

            post("") {
                respond("User created", 201)
            }

            delete("/{id}") {
                val userId = param("id")
                respond("User $userId deleted", 204)
            }
        }

        route("/products") {
            get("") {
                json(listOf("Product A", "Product B"))
            }
        }
    }
}

// 模拟请求
fun main() {
    val ctx1 = app.handle(HttpMethod.GET, "/")
    println("GET / -> ${ctx1?.responseBody}")

    val ctx2 = app.handle(HttpMethod.GET, "/api/users/42")
    println("GET /api/users/42 -> ${ctx2?.responseBody}")
}
```

### 数据库查询 DSL

```kotlin
@DslMarker
annotation class QueryDsl

sealed class SqlExpression {
    abstract fun toSql(): String
}

data class Column(val name: String, val table: String? = null) : SqlExpression() {
    override fun toSql() = if (table != null) "$table.$name" else name
}

data class Literal(val value: Any?) : SqlExpression() {
    override fun toSql() = when (value) {
        null -> "NULL"
        is String -> "'${value.replace("'", "''")}'"
        is Boolean -> if (value) "TRUE" else "FALSE"
        else -> value.toString()
    }
}

data class BinaryOp(
    val left: SqlExpression,
    val operator: String,
    val right: SqlExpression
) : SqlExpression() {
    override fun toSql() = "(${left.toSql()} $operator ${right.toSql()})"
}

@QueryDsl
class QueryBuilder {
    private var selectColumns = mutableListOf<SqlExpression>()
    private var fromTable: String = ""
    private var whereClause: SqlExpression? = null
    private var orderByColumns = mutableListOf<Pair<SqlExpression, SortOrder>>()
    private var limitValue: Int? = null
    private var offsetValue: Int? = null
    private var joins = mutableListOf<JoinClause>()

    fun select(vararg columns: String) {
        selectColumns.addAll(columns.map { Column(it) })
    }

    fun selectAll() {
        selectColumns.add(Column("*"))
    }

    fun from(table: String) {
        fromTable = table
    }

    fun join(table: String, block: JoinBuilder.() -> Unit) {
        joins.add(JoinBuilder(table, JoinType.INNER).apply(block).build())
    }

    fun leftJoin(table: String, block: JoinBuilder.() -> Unit) {
        joins.add(JoinBuilder(table, JoinType.LEFT).apply(block).build())
    }

    fun where(block: WhereBuilder.() -> SqlExpression) {
        whereClause = WhereBuilder().block()
    }

    fun orderBy(column: String, order: SortOrder = SortOrder.ASC) {
        orderByColumns.add(Column(column) to order)
    }

    fun limit(count: Int) {
        limitValue = count
    }

    fun offset(count: Int) {
        offsetValue = count
    }

    fun build(): String = buildString {
        append("SELECT ")
        append(selectColumns.joinToString(", ") { it.toSql() })
        append(" FROM $fromTable")

        joins.forEach { join ->
            append(" ${join.type.sql} JOIN ${join.table} ON ${join.condition.toSql()}")
        }

        whereClause?.let {
            append(" WHERE ${it.toSql()}")
        }

        if (orderByColumns.isNotEmpty()) {
            append(" ORDER BY ")
            append(orderByColumns.joinToString(", ") { (col, order) ->
                "${col.toSql()} ${order.name}"
            })
        }

        limitValue?.let { append(" LIMIT $it") }
        offsetValue?.let { append(" OFFSET $it") }
    }
}

enum class SortOrder { ASC, DESC }
enum class JoinType(val sql: String) { INNER("INNER"), LEFT("LEFT"), RIGHT("RIGHT") }

data class JoinClause(val table: String, val type: JoinType, val condition: SqlExpression)

@QueryDsl
class JoinBuilder(private val table: String, private val type: JoinType) {
    private var onCondition: SqlExpression? = null

    fun on(block: WhereBuilder.() -> SqlExpression) {
        onCondition = WhereBuilder().block()
    }

    fun build() = JoinClause(table, type, onCondition!!)
}

@QueryDsl
class WhereBuilder {
    fun column(name: String, table: String? = null) = Column(name, table)
    fun lit(value: Any?) = Literal(value)

    infix fun SqlExpression.eq(other: SqlExpression) = BinaryOp(this, "=", other)
    infix fun SqlExpression.eq(value: Any?) = BinaryOp(this, "=", Literal(value))

    infix fun SqlExpression.neq(other: SqlExpression) = BinaryOp(this, "<>", other)
    infix fun SqlExpression.neq(value: Any?) = BinaryOp(this, "<>", Literal(value))

    infix fun SqlExpression.gt(value: Any?) = BinaryOp(this, ">", Literal(value))
    infix fun SqlExpression.gte(value: Any?) = BinaryOp(this, ">=", Literal(value))
    infix fun SqlExpression.lt(value: Any?) = BinaryOp(this, "<", Literal(value))
    infix fun SqlExpression.lte(value: Any?) = BinaryOp(this, "<=", Literal(value))

    infix fun SqlExpression.like(pattern: String) = BinaryOp(this, "LIKE", Literal(pattern))

    infix fun SqlExpression.and(other: SqlExpression) = BinaryOp(this, "AND", other)
    infix fun SqlExpression.or(other: SqlExpression) = BinaryOp(this, "OR", other)
}

fun query(block: QueryBuilder.() -> Unit): String {
    return QueryBuilder().apply(block).build()
}

// 用法
val sql = query {
    select("u.id", "u.name", "u.email", "o.total")
    from("users u")

    leftJoin("orders o") {
        on { column("u.id") eq column("o.user_id") }
    }

    where {
        (column("u.status") eq "active") and
        (column("u.age") gte 18) and
        (column("u.name") like "John%")
    }

    orderBy("u.created_at", SortOrder.DESC)
    limit(10)
    offset(0)
}

println(sql)
// SELECT u.id, u.name, u.email, o.total FROM users u
// LEFT JOIN orders o ON (u.id = o.user_id)
// WHERE (((u.status = 'active') AND (u.age >= 18)) AND (u.name LIKE 'John%'))
// ORDER BY u.created_at DESC LIMIT 10 OFFSET 0
```

---

## 最佳实践

### 一致地使用 @DslMarker

始终用相同的 `@DslMarker` 注解标注所有 DSL 类以防止作用域泄漏：

```kotlin
@DslMarker
annotation class MyDsl

@MyDsl class Builder { ... }
@MyDsl class ChildBuilder { ... }
@MyDsl class GrandchildBuilder { ... }
```

### 提供有意义的名称

选择使 DSL 自然阅读的领域特定名称：

```kotlin
// 不好：通用名称
fun item(block: Item.() -> Unit)
fun config(block: Config.() -> Unit)

// 好：领域特定名称
fun route(path: String, block: RouteBuilder.() -> Unit)
fun testCase(description: String, block: TestContext.() -> Unit)
```

### 使用扩展函数提高可发现性

扩展函数出现在 IDE 自动补全中，使你的 DSL 更容易被发现：

```kotlin
// 用户可以输入 "container." 并看到所有可用的子元素
fun Container.button(text: String, block: Button.() -> Unit = {})
fun Container.textField(label: String, block: TextField.() -> Unit = {})
fun Container.checkbox(label: String, block: Checkbox.() -> Unit = {})
```

### 利用默认和命名参数

减少样板代码同时保持灵活性：

```kotlin
fun endpoint(
    path: String,
    method: HttpMethod = HttpMethod.GET,
    auth: Boolean = true,
    handler: RequestContext.() -> Unit
)

// 简单用法
endpoint("/public") { respond("Hello") }

// 配置用法
endpoint("/admin", method = HttpMethod.POST, auth = true) { respond("OK") }
```

### 使无效状态不可能

使用类型系统防止错误配置：

```kotlin
// 通过构造函数强制必需配置
class Database private constructor(
    val host: String,
    val port: Int,
    val name: String
) {
    class Builder {
        var host: String? = null
        var port: Int = 5432
        var name: String? = null

        fun build(): Database {
            requireNotNull(host) { "host is required" }
            requireNotNull(name) { "database name is required" }
            return Database(host!!, port, name!!)
        }
    }
}
```

### 提供验证

验证配置并给出清晰的错误消息：

```kotlin
class ServerConfig {
    var port: Int = 8080
        set(value) {
            require(value in 1..65535) { "Port must be between 1 and 65535" }
            field = value
        }

    var timeout: Duration = 30.seconds
        set(value) {
            require(value.isPositive()) { "Timeout must be positive" }
            field = value
        }
}
```

### 用示例文档化

提供带有使用示例的清晰文档：

```kotlin
/**
 * 创建类型安全的 HTML 文档。
 *
 * 示例：
 * ```kotlin
 * val page = html {
 *     head {
 *         title { +"My Page" }
 *     }
 *     body {
 *         h1 { +"Welcome" }
 *         p { +"Hello, World!" }
 *     }
 * }
 * ```
 *
 * @param block HTML 构建器块
 * @return 构建的 HTML 文档
 */
fun html(block: HTML.() -> Unit): HTML
```

### 考虑不可变性

尽可能返回不可变结果：

```kotlin
data class Configuration(
    val host: String,
    val port: Int,
    val features: List<String>
) {
    class Builder {
        var host = "localhost"
        var port = 8080
        private val features = mutableListOf<String>()

        fun feature(name: String) { features.add(name) }

        fun build() = Configuration(host, port, features.toList())
    }
}

fun config(block: Configuration.Builder.() -> Unit): Configuration {
    return Configuration.Builder().apply(block).build()
}
```

### 使用内联函数提升性能

对于性能关键的 DSL，使用内联函数避免 lambda 分配：

```kotlin
inline fun <T> buildList(block: MutableList<T>.() -> Unit): List<T> {
    return mutableListOf<T>().apply(block)
}

inline fun measureTime(block: () -> Unit): Long {
    val start = System.nanoTime()
    block()
    return System.nanoTime() - start
}
```

### 彻底测试你的 DSL

编写验证有效用法和正确错误处理的测试：

```kotlin
class RouterDslTest {
    @Test
    fun `routes are registered correctly`() {
        val router = router {
            get("/users") { respond("users") }
            post("/users") { respond("created") }
        }

        val getResult = router.handle(HttpMethod.GET, "/users")
        assertEquals("users", getResult?.responseBody)

        val postResult = router.handle(HttpMethod.POST, "/users")
        assertEquals("created", postResult?.responseBody)
    }

    @Test
    fun `path parameters are extracted`() {
        val router = router {
            get("/users/{id}") {
                respond("User ${param("id")}")
            }
        }

        val result = router.handle(HttpMethod.GET, "/users/42")
        assertEquals("User 42", result?.responseBody)
    }
}
```

---

## 结论

Kotlin 的 DSL 功能使你能够创建强大、类型安全和富有表达力的领域特定语言。通过结合：

- **带接收者的 Lambda** 用于作用域上下文
- **@DslMarker** 用于作用域控制
- **扩展函数** 用于流畅的 API
- **中缀函数** 用于自然语法
- **操作符重载** 用于直观操作
- **类型安全构建器** 用于编译时安全

你可以构建感觉像 Kotlin 语言自然扩展的 DSL，提供出色的开发者体验，包括完整的 IDE 支持、编译时检查和清晰易读的代码。

无论你是在构建配置系统、测试框架、查询构建器还是任何领域特定工具，这些技术都给你以最自然的方式为问题领域表达解决方案的灵活性。

## 延伸阅读

- [Kotlin 官方文档 - 类型安全构建器](https://kotlinlang.org/docs/type-safe-builders.html)
- [Kotlin 官方文档 - 作用域函数](https://kotlinlang.org/docs/scope-functions.html)
- [Gradle Kotlin DSL 入门](https://docs.gradle.org/current/userguide/kotlin_dsl.html)
- [Ktor 文档](https://ktor.io/docs/welcome.html)
- [Kotest 框架](https://kotest.io/)
- [kotlinx.html 库](https://github.com/Kotlin/kotlinx.html)
