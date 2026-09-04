---
title: Gradle Build Tool
description: Complete guide to Gradle, Groovy/Kotlin DSL, tasks and dependency management
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Gradle
  - Build Tool
  - Kotlin DSL
status: imported
origin: old/src/content/docs/java/gradle.en.md
divergence: 0.241
issues: []
legacy:
  category: Java
  subcategory: Toolchain
  order: 16
  lastUpdated: 2026-01-07
---

Gradle is a powerful, flexible build automation tool that has become the standard for Java projects, Android development, and many other JVM-based languages. It combines the best features of Apache Ant and Apache Maven while introducing a domain-specific language (DSL) based on Groovy or Kotlin for defining build logic.

## Why Gradle?

Gradle addresses many limitations found in earlier build tools:

- **Performance**: Incremental builds, build cache, and parallel execution make Gradle significantly faster than Maven
- **Flexibility**: A programmable build script allows complex customization without plugins
- **Dependency Management**: Robust dependency resolution with support for transitive dependencies
- **Multi-Project Builds**: First-class support for complex project structures
- **Extensibility**: Easy to create custom tasks and plugins

## Project Structure

A typical Gradle project follows this structure:

```
my-project/
├── build.gradle(.kts)      # Build script
├── settings.gradle(.kts)   # Project settings
├── gradle.properties       # Build properties
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew                 # Unix wrapper script
├── gradlew.bat             # Windows wrapper script
└── src/
    ├── main/
    │   ├── java/           # Production Java source
    │   └── resources/      # Production resources
    └── test/
        ├── java/           # Test Java source
        └── resources/      # Test resources
```

## Groovy DSL vs Kotlin DSL

Gradle supports two DSLs for writing build scripts. The choice between them affects file extensions and syntax.

### Groovy DSL (build.gradle)

The traditional and more concise approach:

```groovy
plugins {
    id 'java'
    id 'application'
}

group = 'com.example'
version = '1.0.0'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}

application {
    mainClass = 'com.example.Application'
}

test {
    useJUnitPlatform()
}
```

### Kotlin DSL (build.gradle.kts)

Type-safe with better IDE support:

```kotlin
plugins {
    java
    application
}

group = "com.example"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:3.2.0")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
}

application {
    mainClass.set("com.example.Application")
}

tasks.test {
    useJUnitPlatform()
}
```

### Comparison

| Feature | Groovy DSL | Kotlin DSL |
|---------|------------|------------|
| File Extension | `.gradle` | `.gradle.kts` |
| Syntax | Dynamic, flexible | Statically typed |
| IDE Support | Good | Excellent |
| Auto-completion | Limited | Full |
| Learning Curve | Lower | Higher |
| Performance | Faster parsing | Slower first build |

## Build Script Structure

### Settings File (settings.gradle.kts)

The settings file configures project structure and is evaluated before the build script:

```kotlin
rootProject.name = "my-application"

// Include subprojects
include("app")
include("core")
include("api")

// Plugin management
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

// Dependency resolution management
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
    }
}
```

### Build Script (build.gradle.kts)

A complete build script example:

```kotlin
import org.gradle.api.tasks.testing.logging.TestExceptionFormat

plugins {
    java
    `java-library`
    `maven-publish`
    jacoco
}

group = "com.example"
version = "1.0.0-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21

    withJavadocJar()
    withSourcesJar()
}

repositories {
    mavenCentral()
    maven {
        url = uri("https://repo.spring.io/milestone")
    }
}

dependencies {
    // API dependencies (exposed to consumers)
    api("org.slf4j:slf4j-api:2.0.9")

    // Implementation dependencies (internal)
    implementation("com.google.guava:guava:32.1.3-jre")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.16.0")

    // Compile-only dependencies
    compileOnly("org.projectlombok:lombok:1.18.30")
    annotationProcessor("org.projectlombok:lombok:1.18.30")

    // Test dependencies
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    testImplementation("org.mockito:mockito-core:5.7.0")
    testImplementation("org.assertj:assertj-core:3.24.2")

    // Test runtime
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.compileJava {
    options.encoding = "UTF-8"
    options.compilerArgs.addAll(listOf("-Xlint:all", "-Werror"))
}

tasks.test {
    useJUnitPlatform()

    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = TestExceptionFormat.FULL
        showStandardStreams = true
    }

    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)

    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])

            pom {
                name.set("My Library")
                description.set("A sample library")
                url.set("https://github.com/example/my-library")
            }
        }
    }
}
```

## Dependency Management

### Dependency Configurations

Gradle provides several dependency configurations for Java projects:

```kotlin
dependencies {
    // Production dependencies
    api("...")              // Exposed to consumers (java-library plugin)
    implementation("...")   // Internal implementation detail
    compileOnly("...")      // Compile-time only (not in runtime)
    runtimeOnly("...")      // Runtime only (not at compile time)

    // Annotation processing
    annotationProcessor("...")

    // Test dependencies
    testImplementation("...")
    testCompileOnly("...")
    testRuntimeOnly("...")
    testAnnotationProcessor("...")
}
```

### Dependency Declaration Formats

```kotlin
dependencies {
    // String notation
    implementation("org.apache.commons:commons-lang3:3.14.0")

    // Map notation
    implementation(group = "org.apache.commons", name = "commons-lang3", version = "3.14.0")

    // Project dependency
    implementation(project(":core"))

    // File dependency
    implementation(files("libs/custom-lib.jar"))
    implementation(fileTree("libs") { include("*.jar") })

    // Platform (BOM) dependency
    implementation(platform("org.springframework.boot:spring-boot-dependencies:3.2.0"))

    // Excluding transitive dependencies
    implementation("com.example:library:1.0.0") {
        exclude(group = "org.unwanted", module = "module")
    }

    // Forcing a version
    implementation("com.google.guava:guava") {
        version {
            strictly("32.1.3-jre")
        }
    }
}
```

### Version Catalogs

Modern Gradle projects use version catalogs for centralized dependency management. Create `gradle/libs.versions.toml`:

```toml
[versions]
spring-boot = "3.2.0"
junit = "5.10.0"
jackson = "2.16.0"
lombok = "1.18.30"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
spring-boot-starter-test = { module = "org.springframework.boot:spring-boot-starter-test", version.ref = "spring-boot" }
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }
jackson-databind = { module = "com.fasterxml.jackson.core:jackson-databind", version.ref = "jackson" }
lombok = { module = "org.projectlombok:lombok", version.ref = "lombok" }

[bundles]
testing = ["junit-jupiter", "spring-boot-starter-test"]

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
```

Reference in build script:

```kotlin
dependencies {
    implementation(libs.spring.boot.starter.web)
    implementation(libs.jackson.databind)

    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)

    testImplementation(libs.bundles.testing)
}
```

## Tasks

Tasks are the fundamental unit of work in Gradle. Every action Gradle performs is organized as a task.

### Built-in Tasks

```bash
# Common tasks
./gradlew build          # Compile, test, and assemble
./gradlew clean          # Delete build directory
./gradlew test           # Run tests
./gradlew check          # Run all verification tasks
./gradlew assemble       # Assemble outputs without tests
./gradlew jar            # Create JAR file
./gradlew javadoc        # Generate Javadoc

# Information tasks
./gradlew tasks          # List available tasks
./gradlew dependencies   # Show dependency tree
./gradlew properties     # Show project properties
./gradlew projects       # Show sub-projects
```

### Custom Tasks

```kotlin
// Simple task
tasks.register("hello") {
    group = "custom"
    description = "Prints a greeting"

    doLast {
        println("Hello, Gradle!")
    }
}

// Task with inputs and outputs
tasks.register<Copy>("copyDocs") {
    from("src/docs")
    into(layout.buildDirectory.dir("docs"))
    include("**/*.md")
}

// Typed task
tasks.register<Zip>("packageDistribution") {
    archiveFileName.set("app-${project.version}.zip")
    destinationDirectory.set(layout.buildDirectory.dir("dist"))

    from(layout.buildDirectory.dir("libs"))
    from(layout.projectDirectory.dir("config"))
}

// Task dependencies
tasks.register("release") {
    dependsOn("build", "packageDistribution")

    doLast {
        println("Release complete!")
    }
}

// Task ordering
tasks.named("processResources") {
    mustRunAfter("generateCode")
}

// Configuring existing tasks
tasks.named<Jar>("jar") {
    manifest {
        attributes(
            "Main-Class" to "com.example.Application",
            "Implementation-Version" to project.version
        )
    }
}
```

### Task Types

Gradle provides many built-in task types:

```kotlin
// Copy files
tasks.register<Copy>("copyResources") {
    from("src/main/resources")
    into(layout.buildDirectory.dir("resources"))

    filter { line -> line.replace("@version@", project.version.toString()) }
    rename { filename -> filename.replace(".template", "") }
}

// Execute external command
tasks.register<Exec>("runDocker") {
    commandLine("docker", "build", "-t", "myapp:latest", ".")
    workingDir(projectDir)
}

// Delete files
tasks.register<Delete>("cleanLogs") {
    delete(fileTree("logs") { include("*.log") })
}

// Generate files
tasks.register("generateBuildInfo") {
    val outputFile = layout.buildDirectory.file("generated/build-info.properties")
    outputs.file(outputFile)

    doLast {
        outputFile.get().asFile.writeText("""
            build.version=${project.version}
            build.timestamp=${java.time.Instant.now()}
        """.trimIndent())
    }
}
```

## Plugins

Plugins extend Gradle's functionality and add new tasks, configurations, and conventions.

### Applying Plugins

```kotlin
// Using plugins DSL (recommended)
plugins {
    java
    application
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

// Legacy apply method
apply(plugin = "java")
apply(from = "gradle/custom.gradle.kts")
```

### Common Plugins

```kotlin
plugins {
    // Core plugins (no version needed)
    java                        // Java compilation
    `java-library`              // Library conventions
    application                 // Executable application
    `maven-publish`             // Publish to Maven repos
    signing                     // Sign artifacts
    jacoco                      // Code coverage

    // Community plugins (version required)
    id("org.springframework.boot") version "3.2.0"
    id("com.github.johnrengelman.shadow") version "8.1.1"
    id("com.google.protobuf") version "0.9.4"
    id("org.flywaydb.flyway") version "10.0.0"
    id("com.diffplug.spotless") version "6.23.0"
}
```

### Creating Custom Plugins

Inline plugin in build script:

```kotlin
// Define plugin
class GreetingPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        project.tasks.register("greet") {
            doLast {
                println("Hello from ${project.name}!")
            }
        }
    }
}

// Apply plugin
apply<GreetingPlugin>()
```

Plugin in `buildSrc/src/main/kotlin/greeting-plugin.gradle.kts`:

```kotlin
tasks.register("greet") {
    group = "custom"
    description = "Prints a greeting message"

    doLast {
        println("Hello from ${project.name}!")
    }
}
```

Apply convention plugin:

```kotlin
plugins {
    id("greeting-plugin")
}
```

## Multi-Project Builds

Gradle excels at managing complex multi-project builds.

### Project Structure

```
my-application/
├── settings.gradle.kts
├── build.gradle.kts
├── app/
│   ├── build.gradle.kts
│   └── src/
├── core/
│   ├── build.gradle.kts
│   └── src/
└── api/
    ├── build.gradle.kts
    └── src/
```

### Settings File

```kotlin
// settings.gradle.kts
rootProject.name = "my-application"

include("app")
include("core")
include("api")
```

### Root Build Script

```kotlin
// build.gradle.kts (root)
plugins {
    java
}

allprojects {
    group = "com.example"
    version = "1.0.0"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "java")

    java {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    dependencies {
        testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    }

    tasks.test {
        useJUnitPlatform()
    }
}
```

### Subproject Build Scripts

```kotlin
// core/build.gradle.kts
plugins {
    `java-library`
}

dependencies {
    api("org.slf4j:slf4j-api:2.0.9")
    implementation("com.google.guava:guava:32.1.3-jre")
}
```

```kotlin
// api/build.gradle.kts
plugins {
    `java-library`
}

dependencies {
    api(project(":core"))
    implementation("com.fasterxml.jackson.core:jackson-databind:2.16.0")
}
```

```kotlin
// app/build.gradle.kts
plugins {
    application
}

dependencies {
    implementation(project(":api"))
    implementation(project(":core"))

    runtimeOnly("ch.qos.logback:logback-classic:1.4.14")
}

application {
    mainClass.set("com.example.Application")
}
```

### Convention Plugins with buildSrc

For shared configuration, use convention plugins. Create `buildSrc/build.gradle.kts`:

```kotlin
plugins {
    `kotlin-dsl`
}

repositories {
    mavenCentral()
    gradlePluginPortal()
}
```

Create `buildSrc/src/main/kotlin/java-conventions.gradle.kts`:

```kotlin
plugins {
    java
    jacoco
}

group = "com.example"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    testImplementation("org.assertj:assertj-core:3.24.2")
}

tasks.test {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}
```

Apply in subprojects:

```kotlin
// core/build.gradle.kts
plugins {
    id("java-conventions")
    `java-library`
}
```

## Gradle Wrapper

The Gradle Wrapper ensures consistent Gradle versions across all environments.

### Generating the Wrapper

```bash
# Generate wrapper files
gradle wrapper --gradle-version 8.5

# Upgrade wrapper version
./gradlew wrapper --gradle-version 8.5
```

### Wrapper Files

```
gradle/
└── wrapper/
    ├── gradle-wrapper.jar        # Download logic
    └── gradle-wrapper.properties # Version configuration
gradlew                           # Unix script
gradlew.bat                       # Windows script
```

### Configuration (gradle-wrapper.properties)

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

### Using the Wrapper

Always use the wrapper instead of a system Gradle installation:

```bash
# Unix/macOS
./gradlew build

# Windows
gradlew.bat build
```

## Build Configuration

### gradle.properties

Project-wide properties in `gradle.properties`:

```properties
# Project configuration
group=com.example
version=1.0.0

# JVM settings for Gradle
org.gradle.jvmargs=-Xmx2g -XX:+UseParallelGC

# Build performance
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configuration-cache=true

# Daemon settings
org.gradle.daemon=true
org.gradle.daemon.idletimeout=10800000

# Custom properties
springBootVersion=3.2.0
myCustomProperty=customValue
```

Access in build script:

```kotlin
val springBootVersion: String by project

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:$springBootVersion")
}
```

### Environment-Specific Configuration

```kotlin
// build.gradle.kts
val env = project.findProperty("env") as String? ?: "dev"

tasks.processResources {
    filesMatching("application.properties") {
        expand("env" to env)
    }
}

// Run with: ./gradlew build -Penv=prod
```

## Build Performance

### Build Cache

Enable local and remote build caching:

```kotlin
// settings.gradle.kts
buildCache {
    local {
        isEnabled = true
        directory = File(rootDir, ".gradle/build-cache")
    }

    remote<HttpBuildCache> {
        url = uri("https://cache.example.com/")
        isPush = System.getenv("CI") != null
        credentials {
            username = System.getenv("CACHE_USER")
            password = System.getenv("CACHE_PASSWORD")
        }
    }
}
```

### Parallel Execution

```properties
# gradle.properties
org.gradle.parallel=true
org.gradle.workers.max=4
```

### Configuration Cache

```properties
# gradle.properties
org.gradle.configuration-cache=true
org.gradle.configuration-cache.problems=warn
```

### Profiling Builds

```bash
# Generate build scan
./gradlew build --scan

# Profile locally
./gradlew build --profile
```

## Testing Configuration

### JUnit 5 Configuration

```kotlin
tasks.test {
    useJUnitPlatform {
        includeTags("fast")
        excludeTags("slow")
    }

    // JVM settings
    jvmArgs("-Xmx1g")

    // System properties
    systemProperty("spring.profiles.active", "test")

    // Environment variables
    environment("DATABASE_URL", "jdbc:h2:mem:testdb")

    // Parallel execution
    maxParallelForks = Runtime.getRuntime().availableProcessors() / 2

    // Fail fast
    failFast = true

    // Logging
    testLogging {
        events("passed", "skipped", "failed")
        showExceptions = true
        showCauses = true
        showStackTraces = true
    }
}
```

### Integration Tests

```kotlin
// Create integration test source set
sourceSets {
    create("integrationTest") {
        compileClasspath += sourceSets.main.get().output
        runtimeClasspath += sourceSets.main.get().output
    }
}

val integrationTestImplementation by configurations.getting {
    extendsFrom(configurations.testImplementation.get())
}

configurations["integrationTestRuntimeOnly"].extendsFrom(configurations.testRuntimeOnly.get())

dependencies {
    integrationTestImplementation("org.testcontainers:testcontainers:1.19.3")
    integrationTestImplementation("org.testcontainers:junit-jupiter:1.19.3")
}

tasks.register<Test>("integrationTest") {
    description = "Runs integration tests."
    group = "verification"

    testClassesDirs = sourceSets["integrationTest"].output.classesDirs
    classpath = sourceSets["integrationTest"].runtimeClasspath

    useJUnitPlatform()

    shouldRunAfter(tasks.test)
}

tasks.check {
    dependsOn(tasks.named("integrationTest"))
}
```

## Publishing Artifacts

### Maven Publishing

```kotlin
plugins {
    `maven-publish`
    signing
}

java {
    withJavadocJar()
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])

            pom {
                name.set("My Library")
                description.set("A sample Java library")
                url.set("https://github.com/example/my-library")

                licenses {
                    license {
                        name.set("The Apache License, Version 2.0")
                        url.set("https://www.apache.org/licenses/LICENSE-2.0.txt")
                    }
                }

                developers {
                    developer {
                        id.set("dev")
                        name.set("Developer Name")
                        email.set("dev@example.com")
                    }
                }

                scm {
                    connection.set("scm:git:git://github.com/example/my-library.git")
                    developerConnection.set("scm:git:ssh://github.com/example/my-library.git")
                    url.set("https://github.com/example/my-library")
                }
            }
        }
    }

    repositories {
        maven {
            name = "OSSRH"
            url = uri("https://s01.oss.sonatype.org/service/local/staging/deploy/maven2/")
            credentials {
                username = project.findProperty("ossrhUsername") as String?
                password = project.findProperty("ossrhPassword") as String?
            }
        }
    }
}

signing {
    sign(publishing.publications["mavenJava"])
}
```

## Common Recipes

### Fat/Shadow JAR

```kotlin
plugins {
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

tasks.shadowJar {
    archiveBaseName.set("app")
    archiveClassifier.set("all")
    archiveVersion.set("")

    manifest {
        attributes("Main-Class" to "com.example.Application")
    }

    // Relocate packages to avoid conflicts
    relocate("com.google.guava", "shadow.guava")

    // Minimize JAR by removing unused classes
    minimize {
        exclude(dependency("org.slf4j:.*:.*"))
    }
}
```

### Code Formatting with Spotless

```kotlin
plugins {
    id("com.diffplug.spotless") version "6.23.0"
}

spotless {
    java {
        target("src/**/*.java")
        googleJavaFormat("1.18.1")
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }

    kotlin {
        target("src/**/*.kt")
        ktlint("1.0.1")
    }

    kotlinGradle {
        target("*.gradle.kts")
        ktlint("1.0.1")
    }
}

tasks.check {
    dependsOn(tasks.spotlessCheck)
}
```

### Docker Image Building

```kotlin
plugins {
    id("com.google.cloud.tools.jib") version "3.4.0"
}

jib {
    from {
        image = "eclipse-temurin:21-jre-alpine"
    }

    to {
        image = "myregistry/myapp"
        tags = setOf("latest", project.version.toString())

        auth {
            username = System.getenv("DOCKER_USERNAME")
            password = System.getenv("DOCKER_PASSWORD")
        }
    }

    container {
        jvmFlags = listOf("-Xmx512m", "-XX:+UseG1GC")
        mainClass = "com.example.Application"
        ports = listOf("8080")
        environment = mapOf("SPRING_PROFILES_ACTIVE" to "production")
    }
}
```

## Troubleshooting

### Common Commands

```bash
# Show dependency tree
./gradlew dependencies --configuration runtimeClasspath

# Find dependency conflicts
./gradlew dependencyInsight --dependency guava --configuration runtimeClasspath

# Clean and rebuild
./gradlew clean build --refresh-dependencies

# Stop Gradle daemon
./gradlew --stop

# Run with debug logging
./gradlew build --debug

# Run with stack trace
./gradlew build --stacktrace
```

### Resolving Dependency Conflicts

```kotlin
configurations.all {
    resolutionStrategy {
        // Fail on version conflict
        failOnVersionConflict()

        // Force specific version
        force("com.google.guava:guava:32.1.3-jre")

        // Prefer newest version
        preferProjectModules()

        // Cache dynamic versions
        cacheDynamicVersionsFor(10, "minutes")
        cacheChangingModulesFor(4, "hours")
    }
}
```

## Best Practices

1. **Always use the Gradle Wrapper**: Ensures consistent builds across all environments
2. **Use version catalogs**: Centralize dependency versions in `libs.versions.toml`
3. **Prefer Kotlin DSL**: Better IDE support and type safety
4. **Apply convention plugins**: Share common configuration across projects
5. **Enable build cache**: Dramatically speeds up incremental builds
6. **Configure parallel execution**: Use available CPU cores efficiently
7. **Keep plugins up to date**: Regularly update Gradle and plugins
8. **Use task configuration avoidance**: Use `tasks.register` instead of `tasks.create`
9. **Avoid dynamic versions**: Use explicit versions instead of `latest.release`
10. **Profile slow builds**: Use `--scan` to identify bottlenecks

## Conclusion

Gradle is a powerful and flexible build tool that provides excellent performance, rich dependency management, and extensive customization options. While the learning curve can be steep, mastering Gradle pays dividends in build reliability, speed, and maintainability. The combination of a declarative DSL with full programming language capabilities makes it suitable for projects of any size and complexity.

Start with the basics, gradually adopt advanced features like version catalogs and convention plugins, and always keep performance optimization in mind. With proper configuration, Gradle can handle everything from simple single-module applications to complex enterprise multi-project builds.
