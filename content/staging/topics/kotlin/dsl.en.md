---
title: Domain-Specific Languages (DSL)
description: Complete guide to Kotlin DSL, building type-safe domain-specific languages
track: kotlin
section: functions-classes
difficulty: advanced
tags:
  - Kotlin
  - DSL
  - Type-safe
  - Builders
status: imported
origin: old/src/content/docs/kotlin/dsl.en.md
divergence: 0.231
issues: []
legacy:
  category: Kotlin
  subcategory: Advanced Features
  order: 6
  lastUpdated: 2026-01-07
---

Domain-Specific Languages (DSLs) are specialized mini-languages designed to express solutions in a particular problem domain with maximum clarity and minimal boilerplate. Kotlin's powerful language features make it one of the best platforms for building internal DSLs that are type-safe, expressive, and feel like natural extensions of the language itself.

---

## What is a DSL?

A Domain-Specific Language is a programming language optimized for a specific class of problems. Unlike general-purpose languages (like Kotlin, Java, or Python), DSLs trade broad applicability for expressiveness within their target domain.

### Types of DSLs

**External DSLs** are standalone languages with their own syntax and parser:
- SQL for database queries
- Regular expressions for pattern matching
- HTML/CSS for web markup and styling
- YAML/JSON for configuration

**Internal DSLs** (also called embedded DSLs) are built within a host language, leveraging its syntax:
- Kotlin's type-safe builders
- Gradle Kotlin DSL
- Ktor routing definitions
- Kotest specifications

This guide focuses on **internal DSLs** in Kotlin, which provide several advantages:

- **Type Safety**: The compiler catches errors at compile time
- **IDE Support**: Full auto-completion, refactoring, and navigation
- **No Parser Required**: Uses the host language's compiler
- **Seamless Integration**: Can freely mix DSL code with regular Kotlin

### DSL Design Goals

A well-designed DSL should:

1. **Read like prose**: Code should express intent clearly
2. **Minimize boilerplate**: Remove syntactic noise
3. **Prevent invalid states**: Use the type system to enforce constraints
4. **Provide discoverability**: IDE auto-complete guides users

```kotlin
// Without DSL - verbose and noisy
val html = HTML()
val body = Body()
val div = Div()
div.addClass("container")
val p = Paragraph()
p.setText("Hello, World!")
div.addChild(p)
body.addChild(div)
html.setBody(body)

// With DSL - clear and expressive
val html = html {
    body {
        div(class_ = "container") {
            p { +"Hello, World!" }
        }
    }
}
```

---

## DSL Fundamentals in Kotlin

Kotlin provides several language features that make DSL construction elegant:

| Feature | DSL Application |
|---------|----------------|
| Lambda with receiver | Provides implicit `this` context in blocks |
| Extension functions | Add domain-specific methods to existing types |
| Infix functions | Enable natural two-operand syntax |
| Operator overloading | Use symbols like `+`, `-`, `[]` meaningfully |
| @DslMarker | Prevent scope confusion in nested builders |
| Default/named parameters | Reduce boilerplate and improve readability |

Let's explore each of these in depth.

---

## Lambda with Receiver

Lambda with receiver is the cornerstone of Kotlin DSL design. It allows you to call methods on an implicit receiver object within a lambda block, creating a scoped context.

### Understanding the Syntax

```kotlin
// Regular lambda: explicit parameter
val greet: (String) -> String = { name -> "Hello, $name!" }

// Lambda with receiver: implicit 'this'
val greetWithReceiver: String.() -> String = { "Hello, $this!" }

// Usage
println(greet("World"))                    // Hello, World!
println("World".greetWithReceiver())       // Hello, World!
println(greetWithReceiver("World"))        // Also works: Hello, World!
```

The function type `String.() -> String` means:
- `String.` - the receiver type (available as `this`)
- `()` - no additional parameters
- `-> String` - returns a String

### How It Enables DSLs

```kotlin
class StringBuilder {
    private val content = mutableListOf<String>()

    fun append(text: String) {
        content.add(text)
    }

    override fun toString() = content.joinToString("")
}

// Builder function with lambda receiver
fun buildString(block: StringBuilder.() -> Unit): String {
    val builder = StringBuilder()
    builder.block()  // 'builder' is the receiver
    return builder.toString()
}

// Usage - 'this' refers to StringBuilder
val result = buildString {
    append("Hello, ")
    append("Kotlin ")
    append("DSL!")
}
println(result)  // Hello, Kotlin DSL!
```

### The apply, with, and run Functions

Kotlin's standard library uses lambda with receiver extensively:

```kotlin
// apply: configure object and return it
data class Person(var name: String = "", var age: Int = 0)

val person = Person().apply {
    name = "Alice"
    age = 30
}

// with: operate on object and return result
val description = with(person) {
    "Name: $name, Age: $age"
}

// run: combines apply and with
val greeting = person.run {
    "Hello, I'm $name and I'm $age years old"
}

// let: operate on nullable safely
val length = person.name?.let { it.length }
```

### How the Compiler Transforms Lambda with Receiver

Understanding the compilation helps demystify DSL behavior:

```kotlin
// What you write:
buildString {
    append("Hello")
    append("World")
}

// What the compiler sees (conceptually):
buildString(object : StringBuilder.() -> Unit {
    override fun invoke(receiver: StringBuilder) {
        receiver.append("Hello")
        receiver.append("World")
    }
})
```

### Nested Receivers

DSLs often nest multiple receivers:

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

// Usage
val page = html {
    body {
        div {
            // nested context
        }
    }
}
```

---

## The @DslMarker Annotation

When DSLs nest multiple receivers, a problem arises: inner lambdas can accidentally access outer receivers. The `@DslMarker` annotation prevents this scope leakage.

### The Problem Without @DslMarker

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

// Without @DslMarker - this compiles but may be unintended
outer {
    inner {
        innerMethod()   // OK - Inner's method
        outerMethod()   // Also OK! - accidentally calls Outer's method
    }
}
```

### The Solution: @DslMarker

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

// With @DslMarker
html {
    body {
        div {
            p("Hello")
            // head { }  // Compile error! head() is not in Div's scope
            // To access outer receiver, must be explicit:
            // this@html.head { }
        }
    }
}
```

### How @DslMarker Works

1. Create a marker annotation annotated with `@DslMarker`
2. Apply this annotation to all DSL classes
3. The compiler restricts implicit access to receivers marked with the same `@DslMarker`
4. Explicit qualification (`this@label`) is required to access outer scopes

### Complete @DslMarker Example

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

// Usage
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

        // This would be a compile error with @DslMarker:
        // textField("invalid") { }  // Error: textField not in SelectField scope
    }

    submit("Register")
}

println(registrationForm.render())
```

---

## Type-Safe Builders

Type-safe builders combine lambda with receiver, @DslMarker, and Kotlin's type system to create APIs that prevent invalid configurations at compile time.

### Building Blocks of Type-Safe Builders

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

// Usage
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

### HTML Builder Example

A classic example of type-safe builders is HTML generation:

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

// Usage
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
                // ul { } is not available here - type safety!
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

## Extension Functions in DSLs

Extension functions allow adding new functionality to existing types without modifying them, making them ideal for creating fluent DSL APIs.

### Basic Extensions

```kotlin
// Add DSL-friendly methods to existing types
fun String.toSlug(): String =
    this.lowercase()
        .replace(Regex("[^a-z0-9\\s-]"), "")
        .replace(Regex("\\s+"), "-")
        .trim('-')

fun <T> List<T>.second(): T = this[1]
fun <T> List<T>.secondOrNull(): T? = this.getOrNull(1)

// Extension property
val String.wordCount: Int
    get() = this.split(Regex("\\s+")).filter { it.isNotEmpty() }.size

println("Hello World".wordCount)  // 2
println("My Blog Post Title".toSlug())  // my-blog-post-title
```

### Extensions with Receivers

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

// Extension functions for fluent API
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

// Usage
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

### Extension Properties in DSLs

```kotlin
class StyleBuilder {
    private val styles = mutableMapOf<String, String>()

    fun set(property: String, value: String) {
        styles[property] = value
    }

    fun build(): String = styles.entries.joinToString("; ") { "${it.key}: ${it.value}" }
}

// Extension properties for common CSS properties
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

// Usage
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

## Infix Functions for Natural Syntax

Infix functions allow omitting the dot and parentheses for single-parameter member or extension functions, creating more natural-looking syntax.

### Basic Infix Functions

```kotlin
// Must be a member or extension function
// Must have exactly one parameter
infix fun Int.times(str: String): String = str.repeat(this)
infix fun String.shouldEqual(expected: String) {
    if (this != expected) throw AssertionError("Expected '$expected' but got '$this'")
}

// Usage - can call without dot and parentheses
println(3 times "Hello ")  // Hello Hello Hello
"test" shouldEqual "test"  // passes
```

### Infix Functions in Testing DSLs

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

// Factory functions
fun <T> expect(actual: T) = Assertion(actual)
fun expect(actual: String) = StringAssertion(actual)
fun <T> expect(actual: Collection<T>) = CollectionAssertion(actual)

// Usage in tests
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

### Duration DSL with Infix

```kotlin
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

// Custom time expressions
data class TimeExpression(val amount: Long, val unit: TimeUnit)

enum class TimeUnit { SECONDS, MINUTES, HOURS, DAYS }

// Extension properties for natural syntax
val Int.secs: TimeExpression get() = TimeExpression(this.toLong(), TimeUnit.SECONDS)
val Int.mins: TimeExpression get() = TimeExpression(this.toLong(), TimeUnit.MINUTES)
val Int.hrs: TimeExpression get() = TimeExpression(this.toLong(), TimeUnit.HOURS)
val Int.dys: TimeExpression get() = TimeExpression(this.toLong(), TimeUnit.DAYS)

// Infix for "ago" and "fromNow"
infix fun TimeExpression.ago(from: java.time.Instant): java.time.Instant {
    val seconds = when (unit) {
        TimeUnit.SECONDS -> amount
        TimeUnit.MINUTES -> amount * 60
        TimeUnit.HOURS -> amount * 3600
        TimeUnit.DAYS -> amount * 86400
    }
    return from.minusSeconds(seconds)
}

// Using Kotlin's built-in Duration for simpler cases
val timeout = 30.seconds
val cacheExpiry = 1.hours
val tokenLifetime = 7.days

// Infix arithmetic
infix fun Duration.and(other: Duration): Duration = this + other

val totalTime = 2.hours and 30.minutes  // 2h 30m
```

---

## Operator Overloading

Kotlin allows overloading predefined operators, enabling intuitive syntax for domain-specific operations.

### Common Operators

| Operator | Function Name | Expression |
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

### Vector Math DSL

```kotlin
data class Vector2D(val x: Double, val y: Double) {
    // Arithmetic operators
    operator fun plus(other: Vector2D) = Vector2D(x + other.x, y + other.y)
    operator fun minus(other: Vector2D) = Vector2D(x - other.x, y - other.y)
    operator fun times(scalar: Double) = Vector2D(x * scalar, y * scalar)
    operator fun div(scalar: Double) = Vector2D(x / scalar, y / scalar)

    // Unary operators
    operator fun unaryMinus() = Vector2D(-x, -y)
    operator fun unaryPlus() = this

    // Comparison
    operator fun compareTo(other: Vector2D): Int =
        magnitude.compareTo(other.magnitude)

    // Indexing
    operator fun get(index: Int): Double = when (index) {
        0 -> x
        1 -> y
        else -> throw IndexOutOfBoundsException("Vector2D has only 2 components")
    }

    // Properties
    val magnitude: Double get() = kotlin.math.sqrt(x * x + y * y)
    val normalized: Vector2D get() = this / magnitude

    // Dot product as infix
    infix fun dot(other: Vector2D): Double = x * other.x + y * other.y

    override fun toString() = "($x, $y)"
}

// Extension for scalar * vector
operator fun Double.times(vector: Vector2D) = vector * this

// Usage
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

### The invoke Operator

The `invoke` operator allows objects to be called like functions:

```kotlin
class Command(private val name: String) {
    operator fun invoke(vararg args: String): CommandResult {
        println("Executing: $name ${args.joinToString(" ")}")
        return CommandResult(0, "Success")
    }
}

data class CommandResult(val exitCode: Int, val output: String)

// Usage
val git = Command("git")
val result = git("commit", "-m", "Initial commit")

// DSL application: route handlers
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

### Collection Builder with Operators

```kotlin
class JsonBuilder {
    private val content = mutableMapOf<String, Any?>()

    // Assign with indexing
    operator fun set(key: String, value: Any?) {
        content[key] = value
    }

    // Get with indexing
    operator fun get(key: String): Any? = content[key]

    // Add entries with +=
    operator fun plusAssign(pair: Pair<String, Any?>) {
        content[pair.first] = pair.second
    }

    // Nested object
    fun obj(key: String, block: JsonBuilder.() -> Unit) {
        content[key] = JsonBuilder().apply(block).build()
    }

    // Array
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

// Usage
val jsonOutput = json {
    this["name"] = "John Doe"
    this["age"] = 30
    this["active"] = true
    this += "email" to "john@example.com"  // Using plusAssign

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

Gradle Kotlin DSL is one of the most prominent real-world examples of Kotlin DSL. It replaces the traditional Groovy-based `build.gradle` with type-safe `build.gradle.kts` files.

### Basic Structure

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

### Understanding the DSL Patterns

```kotlin
// The plugins block uses a special DSL
plugins {
    // This is an extension function on PluginDependenciesSpec
    kotlin("jvm") version "1.9.22"

    // 'application' is a property accessor
    application

    // id() is a function call
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

// dependencies block
dependencies {
    // These are extension functions on DependencyHandlerScope
    implementation("group:artifact:version")

    // Platform alignment
    implementation(platform("org.springframework.boot:spring-boot-dependencies:3.2.0"))

    // Project dependencies
    implementation(project(":core"))

    // With configuration block
    implementation("group:artifact:version") {
        exclude(group = "org.slf4j")
        isTransitive = false
    }
}
```

### Custom Task Definition

```kotlin
// Defining a custom task
tasks.register("generateDocs") {
    group = "documentation"
    description = "Generates project documentation"

    doLast {
        println("Generating documentation...")
        // Task implementation
    }
}

// Typed task
tasks.register<Copy>("copyResources") {
    from("src/main/resources")
    into("build/resources")
    include("**/*.json", "**/*.xml")
}

// Configuring existing tasks
tasks.named<Jar>("jar") {
    manifest {
        attributes(
            "Main-Class" to "com.example.MainKt",
            "Implementation-Version" to project.version
        )
    }
}

// Task dependencies
tasks.named("build") {
    dependsOn("generateDocs")
}
```

### Multi-Project Build

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

// Root build.gradle.kts
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

### Creating a Gradle Plugin DSL

```kotlin
// In buildSrc or a separate plugin project
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

// Usage in build.gradle.kts
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

## Real-World DSL Examples

### Test Framework DSL (Kotest-style)

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

// Usage
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

// Run the tests
fun main() {
    CalculatorSpec().run()
}
```

### HTTP Router DSL (Ktor-style)

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
        responseBody = body.toString()  // Would use proper JSON serialization
        statusCode = status
    }

    fun header(name: String, value: String) {
        headers[name] = value
    }
}

fun router(block: Router.() -> Unit): Router {
    return Router().apply(block)
}

// Usage
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

// Simulate requests
fun main() {
    val ctx1 = app.handle(HttpMethod.GET, "/")
    println("GET / -> ${ctx1?.responseBody}")

    val ctx2 = app.handle(HttpMethod.GET, "/api/users/42")
    println("GET /api/users/42 -> ${ctx2?.responseBody}")
}
```

### Database Query DSL

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

// Usage
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

## Best Practices

### Use @DslMarker Consistently

Always annotate all DSL classes with the same `@DslMarker` annotation to prevent scope leakage:

```kotlin
@DslMarker
annotation class MyDsl

@MyDsl class Builder { ... }
@MyDsl class ChildBuilder { ... }
@MyDsl class GrandchildBuilder { ... }
```

### Provide Meaningful Names

Choose domain-specific names that make the DSL read naturally:

```kotlin
// Bad: generic names
fun item(block: Item.() -> Unit)
fun config(block: Config.() -> Unit)

// Good: domain-specific names
fun route(path: String, block: RouteBuilder.() -> Unit)
fun testCase(description: String, block: TestContext.() -> Unit)
```

### Use Extension Functions for Discoverability

Extension functions appear in IDE auto-complete, making your DSL more discoverable:

```kotlin
// Users can type "container." and see all available child elements
fun Container.button(text: String, block: Button.() -> Unit = {})
fun Container.textField(label: String, block: TextField.() -> Unit = {})
fun Container.checkbox(label: String, block: Checkbox.() -> Unit = {})
```

### Leverage Default and Named Parameters

Reduce boilerplate while keeping flexibility:

```kotlin
fun endpoint(
    path: String,
    method: HttpMethod = HttpMethod.GET,
    auth: Boolean = true,
    handler: RequestContext.() -> Unit
)

// Simple usage
endpoint("/public") { respond("Hello") }

// Configured usage
endpoint("/admin", method = HttpMethod.POST, auth = true) { respond("OK") }
```

### Make Invalid States Impossible

Use the type system to prevent incorrect configurations:

```kotlin
// Force required configuration through constructor
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

### Provide Validation

Validate configurations and give clear error messages:

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

### Document with Examples

Provide clear documentation with usage examples:

```kotlin
/**
 * Creates a type-safe HTML document.
 *
 * Example:
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
 * @param block The HTML builder block
 * @return The constructed HTML document
 */
fun html(block: HTML.() -> Unit): HTML
```

### Consider Immutability

Return immutable results when possible:

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

### Use Inline Functions for Performance

For performance-critical DSLs, use inline functions to avoid lambda allocation:

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

### Test Your DSL Thoroughly

Write tests that verify both valid usage and proper error handling:

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

## Conclusion

Kotlin's DSL capabilities enable you to create powerful, type-safe, and expressive domain-specific languages. By combining:

- **Lambda with receiver** for scoped contexts
- **@DslMarker** for scope control
- **Extension functions** for fluent APIs
- **Infix functions** for natural syntax
- **Operator overloading** for intuitive operations
- **Type-safe builders** for compile-time safety

You can build DSLs that feel like natural extensions of the Kotlin language, providing excellent developer experience with full IDE support, compile-time checking, and clear, readable code.

Whether you're building configuration systems, test frameworks, query builders, or any domain-specific tool, these techniques give you the flexibility to express solutions in the most natural way for your problem domain.

## Further Reading

- [Kotlin Official Documentation - Type-Safe Builders](https://kotlinlang.org/docs/type-safe-builders.html)
- [Kotlin Official Documentation - Scope Functions](https://kotlinlang.org/docs/scope-functions.html)
- [Gradle Kotlin DSL Primer](https://docs.gradle.org/current/userguide/kotlin_dsl.html)
- [Ktor Documentation](https://ktor.io/docs/welcome.html)
- [Kotest Framework](https://kotest.io/)
- [kotlinx.html Library](https://github.com/Kotlin/kotlinx.html)
