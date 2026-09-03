---
title: Maven Build Tool
description: Complete guide to Maven, project management, dependency management and lifecycle
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Maven
  - Build Tool
  - Dependency Management
status: imported
origin: old/src/content/docs/java/maven.en.md
divergence: 0.317
issues: []
legacy:
  category: Java
  subcategory: Toolchain
  order: 15
  lastUpdated: 2026-01-07
---

Apache Maven is a powerful build automation and project management tool primarily used for Java projects. It provides a standardized way to build projects, manage dependencies, and handle project documentation and reporting. Maven uses a declarative approach through XML configuration files, making it easier to understand and maintain project builds.

## Introduction to Maven

Maven addresses several challenges in Java project development:

- **Standardized project structure**: Consistent directory layout across projects
- **Dependency management**: Automatic resolution and downloading of libraries
- **Build lifecycle**: Predefined phases for compilation, testing, packaging, and deployment
- **Plugin ecosystem**: Extensible architecture with thousands of available plugins
- **Project documentation**: Automatic generation of project sites and reports

### Installing Maven

Download Maven from the official Apache website and configure environment variables:

```bash
# Download and extract Maven
wget https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz
tar -xzf apache-maven-3.9.6-bin.tar.gz
sudo mv apache-maven-3.9.6 /opt/maven

# Set environment variables (add to ~/.bashrc or ~/.zshrc)
export M2_HOME=/opt/maven
export PATH=$M2_HOME/bin:$PATH

# Verify installation
mvn --version
```

### Standard Directory Structure

Maven projects follow a conventional directory layout:

```
my-project/
├── pom.xml                          # Project Object Model
├── src/
│   ├── main/
│   │   ├── java/                    # Application source code
│   │   │   └── com/example/
│   │   │       └── App.java
│   │   ├── resources/               # Application resources
│   │   │   ├── application.properties
│   │   │   └── logback.xml
│   │   └── webapp/                  # Web application resources (WAR projects)
│   │       ├── WEB-INF/
│   │       └── index.html
│   └── test/
│       ├── java/                    # Test source code
│       │   └── com/example/
│       │       └── AppTest.java
│       └── resources/               # Test resources
│           └── test-data.json
└── target/                          # Build output (generated)
    ├── classes/
    ├── test-classes/
    └── my-project-1.0.0.jar
```

## POM Structure

The Project Object Model (POM) is an XML file that contains all project configuration. It describes the project, its dependencies, build settings, and plugins.

### Basic POM Elements

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <!-- POM model version (always 4.0.0) -->
    <modelVersion>4.0.0</modelVersion>

    <!-- Project coordinates (GAV) -->
    <groupId>com.example</groupId>
    <artifactId>my-application</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <!-- Project metadata -->
    <name>My Application</name>
    <description>A sample Maven project</description>
    <url>https://github.com/example/my-application</url>

    <!-- License information -->
    <licenses>
        <license>
            <name>Apache License, Version 2.0</name>
            <url>https://www.apache.org/licenses/LICENSE-2.0</url>
        </license>
    </licenses>

    <!-- Developer information -->
    <developers>
        <developer>
            <id>johndoe</id>
            <name>John Doe</name>
            <email>john@example.com</email>
            <organization>Example Inc.</organization>
            <roles>
                <role>Lead Developer</role>
            </roles>
        </developer>
    </developers>

    <!-- Source control management -->
    <scm>
        <connection>scm:git:git://github.com/example/my-application.git</connection>
        <developerConnection>scm:git:ssh://github.com/example/my-application.git</developerConnection>
        <url>https://github.com/example/my-application</url>
    </scm>

</project>
```

### Properties

Properties allow you to define reusable values throughout the POM:

```xml
<properties>
    <!-- Java version -->
    <java.version>17</java.version>
    <maven.compiler.source>${java.version}</maven.compiler.source>
    <maven.compiler.target>${java.version}</maven.compiler.target>

    <!-- Encoding -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>

    <!-- Dependency versions -->
    <spring.version>6.1.2</spring.version>
    <junit.version>5.10.1</junit.version>
    <lombok.version>1.18.30</lombok.version>
    <slf4j.version>2.0.9</slf4j.version>

    <!-- Plugin versions -->
    <maven-compiler-plugin.version>3.12.1</maven-compiler-plugin.version>
    <maven-surefire-plugin.version>3.2.3</maven-surefire-plugin.version>
</properties>
```

Properties can be referenced anywhere in the POM using `${property.name}` syntax:

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>${spring.version}</version>
</dependency>
```

### Parent POM Inheritance

Projects can inherit configuration from a parent POM:

```xml
<!-- Child POM inheriting from parent -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.1</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>

<groupId>com.example</groupId>
<artifactId>my-spring-app</artifactId>
<version>1.0.0</version>
```

Creating a custom parent POM for your organization:

```xml
<!-- Parent POM (packaging must be pom) -->
<project>
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.mycompany</groupId>
    <artifactId>parent-pom</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>${java.version}</maven.compiler.source>
        <maven.compiler.target>${java.version}</maven.compiler.target>
    </properties>

    <!-- Common dependencies for all child projects -->
    <dependencies>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.9</version>
        </dependency>
    </dependencies>

    <!-- Managed dependencies (children must declare but not version) -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.junit.jupiter</groupId>
                <artifactId>junit-jupiter</artifactId>
                <version>5.10.1</version>
                <scope>test</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <!-- Common plugin configuration -->
    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.12.1</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

## Dependency Management

Maven's dependency management system automatically downloads libraries from repositories and manages the classpath.

### Declaring Dependencies

```xml
<dependencies>
    <!-- Compile scope (default) - available in all classpaths -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>6.1.2</version>
    </dependency>

    <!-- Provided scope - expected to be provided by runtime environment -->
    <dependency>
        <groupId>jakarta.servlet</groupId>
        <artifactId>jakarta.servlet-api</artifactId>
        <version>6.0.0</version>
        <scope>provided</scope>
    </dependency>

    <!-- Runtime scope - not needed for compilation, only at runtime -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <version>8.2.0</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Test scope - only for test compilation and execution -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.1</version>
        <scope>test</scope>
    </dependency>

    <!-- System scope - use with caution, requires systemPath -->
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>legacy-lib</artifactId>
        <version>1.0</version>
        <scope>system</scope>
        <systemPath>${project.basedir}/lib/legacy-lib.jar</systemPath>
    </dependency>

    <!-- Import scope - for importing dependencyManagement -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>3.2.1</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencies>
```

### Dependency Scopes

| Scope | Compile Classpath | Test Classpath | Runtime Classpath | Transitive |
|-------|-------------------|----------------|-------------------|------------|
| compile | Yes | Yes | Yes | Yes |
| provided | Yes | Yes | No | No |
| runtime | No | Yes | Yes | Yes |
| test | No | Yes | No | No |
| system | Yes | Yes | No | No |

### Transitive Dependencies

Maven automatically resolves transitive dependencies (dependencies of dependencies):

```xml
<!-- If you include spring-context -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>6.1.2</version>
</dependency>
<!-- Maven automatically includes:
     - spring-core
     - spring-beans
     - spring-aop
     - spring-expression
     - etc.
-->
```

### Excluding Transitive Dependencies

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>6.1.2</version>
    <exclusions>
        <!-- Exclude a specific transitive dependency -->
        <exclusion>
            <groupId>org.springframework</groupId>
            <artifactId>spring-aop</artifactId>
        </exclusion>
        <!-- Wildcard exclusion (all transitive dependencies from a group) -->
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>*</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

### Optional Dependencies

Optional dependencies are not transitively included in dependent projects:

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>
    <optional>true</optional>
</dependency>
```

### Dependency Management Section

The `dependencyManagement` section defines versions without actually adding dependencies:

```xml
<dependencyManagement>
    <dependencies>
        <!-- BOM (Bill of Materials) import -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>

        <!-- Version management for individual dependencies -->
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>32.1.3-jre</version>
        </dependency>

        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>3.14.0</version>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Actual dependencies - version inherited from dependencyManagement -->
<dependencies>
    <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava</artifactId>
        <!-- Version not needed - inherited from dependencyManagement -->
    </dependency>
</dependencies>
```

### Dependency Analysis Commands

```bash
# Display dependency tree
mvn dependency:tree

# Analyze unused and undeclared dependencies
mvn dependency:analyze

# Display effective POM (with all inherited settings)
mvn help:effective-pom

# Display effective settings
mvn help:effective-settings

# List available dependency updates
mvn versions:display-dependency-updates

# List available plugin updates
mvn versions:display-plugin-updates
```

### Dependency Conflicts Resolution

Maven uses the "nearest definition" strategy for conflict resolution:

```xml
<!-- If A -> B -> C:1.0 and A -> C:2.0, then C:2.0 wins (nearer to root) -->

<!-- Force a specific version using dependencyManagement -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>conflicting-lib</artifactId>
            <version>2.0.0</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## Build Lifecycle and Phases

Maven defines three built-in lifecycles: `default`, `clean`, and `site`. Each lifecycle consists of phases executed in order.

### Default Lifecycle Phases

The default lifecycle handles project deployment:

```
validate     -> Validate project structure
initialize   -> Initialize build state
generate-sources -> Generate source code
process-sources  -> Process source files
generate-resources -> Generate resources
process-resources  -> Copy resources to output directory
compile      -> Compile source code
process-classes -> Post-process compiled classes
generate-test-sources -> Generate test sources
process-test-sources  -> Process test sources
generate-test-resources -> Generate test resources
process-test-resources  -> Copy test resources
test-compile -> Compile test sources
process-test-classes -> Post-process test classes
test         -> Run unit tests
prepare-package -> Prepare packaging
package      -> Create distributable package (JAR/WAR)
pre-integration-test -> Setup for integration tests
integration-test -> Run integration tests
post-integration-test -> Cleanup after integration tests
verify       -> Verify package validity
install      -> Install to local repository
deploy       -> Deploy to remote repository
```

### Clean Lifecycle

```
pre-clean    -> Execute before cleaning
clean        -> Delete target directory
post-clean   -> Execute after cleaning
```

### Site Lifecycle

```
pre-site     -> Execute before site generation
site         -> Generate project site
post-site    -> Execute after site generation
site-deploy  -> Deploy site to web server
```

### Running Lifecycle Phases

```bash
# Run a specific phase (all preceding phases run first)
mvn compile          # Runs: validate -> ... -> compile
mvn test             # Runs: validate -> ... -> test
mvn package          # Runs: validate -> ... -> package
mvn install          # Runs: validate -> ... -> install

# Run clean lifecycle before default lifecycle
mvn clean package    # Clean, then validate -> ... -> package

# Run multiple lifecycles
mvn clean install site

# Skip tests
mvn package -DskipTests              # Skip test execution
mvn package -Dmaven.test.skip=true   # Skip compilation and execution

# Run with a specific profile
mvn package -Pproduction

# Parallel build (for multi-module projects)
mvn -T 4 package      # 4 threads
mvn -T 1C package     # 1 thread per CPU core

# Offline mode (use local repository only)
mvn -o package

# Update snapshots
mvn -U package

# Debug mode
mvn -X package

# Quiet mode
mvn -q package

# Fail at end (continue building other modules)
mvn -fae package

# Resume from specific module
mvn -rf :module-name package
```

## Plugins

Plugins perform the actual work in Maven builds. Each plugin provides one or more goals that can be bound to lifecycle phases.

### Plugin Configuration

```xml
<build>
    <plugins>
        <!-- Compiler plugin -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.12.1</version>
            <configuration>
                <source>17</source>
                <target>17</target>
                <compilerArgs>
                    <arg>-parameters</arg>
                    <arg>-Xlint:all</arg>
                </compilerArgs>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>1.18.30</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>

        <!-- Surefire plugin for unit tests -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.3</version>
            <configuration>
                <includes>
                    <include>**/*Test.java</include>
                    <include>**/*Tests.java</include>
                </includes>
                <excludes>
                    <exclude>**/*IntegrationTest.java</exclude>
                </excludes>
                <parallel>methods</parallel>
                <threadCount>4</threadCount>
                <argLine>-Xmx1024m</argLine>
            </configuration>
        </plugin>

        <!-- Failsafe plugin for integration tests -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-failsafe-plugin</artifactId>
            <version>3.2.3</version>
            <executions>
                <execution>
                    <goals>
                        <goal>integration-test</goal>
                        <goal>verify</goal>
                    </goals>
                </execution>
            </executions>
            <configuration>
                <includes>
                    <include>**/*IntegrationTest.java</include>
                    <include>**/*IT.java</include>
                </includes>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### Common Plugins

#### JAR Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.3.0</version>
    <configuration>
        <archive>
            <manifest>
                <mainClass>com.example.Main</mainClass>
                <addClasspath>true</addClasspath>
                <classpathPrefix>lib/</classpathPrefix>
            </manifest>
            <manifestEntries>
                <Implementation-Title>${project.name}</Implementation-Title>
                <Implementation-Version>${project.version}</Implementation-Version>
                <Built-By>${user.name}</Built-By>
                <Build-Timestamp>${maven.build.timestamp}</Build-Timestamp>
            </manifestEntries>
        </archive>
    </configuration>
</plugin>
```

#### Shade Plugin (Uber JAR)

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <version>3.5.1</version>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>shade</goal>
            </goals>
            <configuration>
                <transformers>
                    <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                        <mainClass>com.example.Main</mainClass>
                    </transformer>
                    <!-- Merge service files -->
                    <transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
                </transformers>
                <filters>
                    <filter>
                        <artifact>*:*</artifact>
                        <excludes>
                            <exclude>META-INF/*.SF</exclude>
                            <exclude>META-INF/*.DSA</exclude>
                            <exclude>META-INF/*.RSA</exclude>
                        </excludes>
                    </filter>
                </filters>
                <relocations>
                    <relocation>
                        <pattern>com.google.common</pattern>
                        <shadedPattern>com.example.shaded.guava</shadedPattern>
                    </relocation>
                </relocations>
            </configuration>
        </execution>
    </executions>
</plugin>
```

#### Assembly Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-assembly-plugin</artifactId>
    <version>3.6.0</version>
    <configuration>
        <descriptorRefs>
            <descriptorRef>jar-with-dependencies</descriptorRef>
        </descriptorRefs>
        <archive>
            <manifest>
                <mainClass>com.example.Main</mainClass>
            </manifest>
        </archive>
    </configuration>
    <executions>
        <execution>
            <id>make-assembly</id>
            <phase>package</phase>
            <goals>
                <goal>single</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

Custom assembly descriptor (`src/assembly/distribution.xml`):

```xml
<assembly xmlns="http://maven.apache.org/ASSEMBLY/2.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/ASSEMBLY/2.2.0
                              http://maven.apache.org/xsd/assembly-2.2.0.xsd">
    <id>distribution</id>
    <formats>
        <format>zip</format>
        <format>tar.gz</format>
    </formats>
    <includeBaseDirectory>true</includeBaseDirectory>

    <fileSets>
        <fileSet>
            <directory>${project.basedir}</directory>
            <includes>
                <include>README.md</include>
                <include>LICENSE</include>
            </includes>
        </fileSet>
        <fileSet>
            <directory>${project.basedir}/src/main/scripts</directory>
            <outputDirectory>bin</outputDirectory>
            <fileMode>0755</fileMode>
        </fileSet>
        <fileSet>
            <directory>${project.basedir}/src/main/config</directory>
            <outputDirectory>config</outputDirectory>
        </fileSet>
    </fileSets>

    <dependencySets>
        <dependencySet>
            <outputDirectory>lib</outputDirectory>
            <useProjectArtifact>true</useProjectArtifact>
        </dependencySet>
    </dependencySets>
</assembly>
```

#### Resources Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <version>3.3.1</version>
    <configuration>
        <encoding>UTF-8</encoding>
        <!-- Enable filtering for property substitution -->
        <nonFilteredFileExtensions>
            <nonFilteredFileExtension>pdf</nonFilteredFileExtension>
            <nonFilteredFileExtension>png</nonFilteredFileExtension>
            <nonFilteredFileExtension>jpg</nonFilteredFileExtension>
        </nonFilteredFileExtensions>
    </configuration>
</plugin>
```

Enable resource filtering in the build:

```xml
<build>
    <resources>
        <resource>
            <directory>src/main/resources</directory>
            <filtering>true</filtering>
            <includes>
                <include>**/*.properties</include>
                <include>**/*.xml</include>
            </includes>
        </resource>
        <resource>
            <directory>src/main/resources</directory>
            <filtering>false</filtering>
            <excludes>
                <exclude>**/*.properties</exclude>
                <exclude>**/*.xml</exclude>
            </excludes>
        </resource>
    </resources>
</build>
```

Resource file with placeholders (`application.properties`):

```properties
app.name=${project.name}
app.version=${project.version}
build.timestamp=${maven.build.timestamp}
```

#### Exec Plugin

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <version>3.1.1</version>
    <executions>
        <execution>
            <goals>
                <goal>java</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <mainClass>com.example.Main</mainClass>
        <arguments>
            <argument>arg1</argument>
            <argument>arg2</argument>
        </arguments>
        <systemProperties>
            <systemProperty>
                <key>app.env</key>
                <value>development</value>
            </systemProperty>
        </systemProperties>
    </configuration>
</plugin>
```

Run with: `mvn exec:java`

#### Enforcer Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-enforcer-plugin</artifactId>
    <version>3.4.1</version>
    <executions>
        <execution>
            <id>enforce-versions</id>
            <goals>
                <goal>enforce</goal>
            </goals>
            <configuration>
                <rules>
                    <!-- Require minimum Maven version -->
                    <requireMavenVersion>
                        <version>[3.8.0,)</version>
                        <message>Maven 3.8.0 or higher is required</message>
                    </requireMavenVersion>

                    <!-- Require minimum Java version -->
                    <requireJavaVersion>
                        <version>[17,)</version>
                        <message>Java 17 or higher is required</message>
                    </requireJavaVersion>

                    <!-- Ban duplicate dependencies -->
                    <banDuplicatePomDependencyVersions/>

                    <!-- Require environment variable -->
                    <requireEnvironmentVariable>
                        <variableName>JAVA_HOME</variableName>
                    </requireEnvironmentVariable>

                    <!-- Ban specific dependencies -->
                    <bannedDependencies>
                        <excludes>
                            <exclude>commons-logging:commons-logging</exclude>
                            <exclude>log4j:log4j</exclude>
                        </excludes>
                        <message>Use SLF4J instead of these logging libraries</message>
                    </bannedDependencies>

                    <!-- Require dependency convergence -->
                    <dependencyConvergence/>
                </rules>
                <fail>true</fail>
            </configuration>
        </execution>
    </executions>
</plugin>
```

#### Versions Plugin

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>versions-maven-plugin</artifactId>
    <version>2.16.2</version>
    <configuration>
        <generateBackupPoms>false</generateBackupPoms>
    </configuration>
</plugin>
```

Commands:

```bash
# Display dependency updates
mvn versions:display-dependency-updates

# Display plugin updates
mvn versions:display-plugin-updates

# Update parent version
mvn versions:update-parent

# Set project version
mvn versions:set -DnewVersion=2.0.0

# Revert version changes
mvn versions:revert

# Commit version changes
mvn versions:commit
```

### Plugin Management

Plugin management centralizes plugin configuration for multi-module projects:

```xml
<build>
    <pluginManagement>
        <plugins>
            <!-- Define plugin versions and configurations -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.12.1</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>
        </plugins>
    </pluginManagement>

    <plugins>
        <!-- Actual plugin usage (inherits from pluginManagement) -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <!-- Version and configuration inherited -->
        </plugin>
    </plugins>
</build>
```

## Profiles

Profiles allow you to customize builds for different environments or use cases.

### Defining Profiles

```xml
<profiles>
    <!-- Development profile -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <env>development</env>
            <log.level>DEBUG</log.level>
            <db.url>jdbc:h2:mem:testdb</db.url>
        </properties>
        <dependencies>
            <dependency>
                <groupId>com.h2database</groupId>
                <artifactId>h2</artifactId>
                <version>2.2.224</version>
            </dependency>
        </dependencies>
    </profile>

    <!-- Production profile -->
    <profile>
        <id>prod</id>
        <properties>
            <env>production</env>
            <log.level>WARN</log.level>
            <db.url>jdbc:mysql://prod-db:3306/mydb</db.url>
        </properties>
        <dependencies>
            <dependency>
                <groupId>com.mysql</groupId>
                <artifactId>mysql-connector-j</artifactId>
                <version>8.2.0</version>
            </dependency>
        </dependencies>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <configuration>
                        <debug>false</debug>
                        <optimize>true</optimize>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </profile>

    <!-- CI/CD profile -->
    <profile>
        <id>ci</id>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.jacoco</groupId>
                    <artifactId>jacoco-maven-plugin</artifactId>
                    <version>0.8.11</version>
                    <executions>
                        <execution>
                            <goals>
                                <goal>prepare-agent</goal>
                            </goals>
                        </execution>
                        <execution>
                            <id>report</id>
                            <phase>test</phase>
                            <goals>
                                <goal>report</goal>
                            </goals>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

### Profile Activation

Profiles can be activated in several ways:

```xml
<profiles>
    <!-- Activated by command line: mvn -Pprofile-id -->
    <profile>
        <id>manual</id>
    </profile>

    <!-- Activated by default -->
    <profile>
        <id>default-profile</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
    </profile>

    <!-- Activated by JDK version -->
    <profile>
        <id>jdk17</id>
        <activation>
            <jdk>17</jdk>
        </activation>
    </profile>

    <!-- Activated by JDK version range -->
    <profile>
        <id>jdk17-plus</id>
        <activation>
            <jdk>[17,)</jdk>
        </activation>
    </profile>

    <!-- Activated by OS -->
    <profile>
        <id>windows</id>
        <activation>
            <os>
                <family>Windows</family>
            </os>
        </activation>
    </profile>

    <profile>
        <id>linux</id>
        <activation>
            <os>
                <family>unix</family>
                <name>Linux</name>
            </os>
        </activation>
    </profile>

    <!-- Activated by system property -->
    <profile>
        <id>with-tests</id>
        <activation>
            <property>
                <name>tests</name>
                <value>true</value>
            </property>
        </activation>
    </profile>

    <!-- Activated when property is NOT set -->
    <profile>
        <id>default-db</id>
        <activation>
            <property>
                <name>!db.type</name>
            </property>
        </activation>
    </profile>

    <!-- Activated by file existence -->
    <profile>
        <id>local-config</id>
        <activation>
            <file>
                <exists>${basedir}/src/main/resources/local.properties</exists>
            </file>
        </activation>
    </profile>

    <!-- Activated by file absence -->
    <profile>
        <id>generate-config</id>
        <activation>
            <file>
                <missing>${basedir}/config/settings.xml</missing>
            </file>
        </activation>
    </profile>
</profiles>
```

### Using Profiles

```bash
# Activate a single profile
mvn package -Pprod

# Activate multiple profiles
mvn package -Pprod,ci

# Deactivate a profile
mvn package -P!dev

# Check active profiles
mvn help:active-profiles

# Display all profiles
mvn help:all-profiles
```

### External Profile Configuration

Profiles can also be defined in `settings.xml` for user-specific configuration:

```xml
<!-- ~/.m2/settings.xml -->
<settings>
    <profiles>
        <profile>
            <id>company-repos</id>
            <repositories>
                <repository>
                    <id>company-releases</id>
                    <url>https://nexus.company.com/repository/releases</url>
                </repository>
            </repositories>
        </profile>
    </profiles>

    <activeProfiles>
        <activeProfile>company-repos</activeProfile>
    </activeProfiles>
</settings>
```

## Multi-Module Projects

Multi-module projects (also called aggregator projects) allow you to build multiple related projects together.

### Parent POM

```xml
<!-- parent/pom.xml -->
<project>
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>my-application-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <name>My Application - Parent</name>

    <!-- Child modules -->
    <modules>
        <module>common</module>
        <module>api</module>
        <module>service</module>
        <module>web</module>
    </modules>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>${java.version}</maven.compiler.source>
        <maven.compiler.target>${java.version}</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

        <!-- Centralized dependency versions -->
        <spring-boot.version>3.2.1</spring-boot.version>
        <junit.version>5.10.1</junit.version>
    </properties>

    <!-- Dependency management for all modules -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Internal module dependencies -->
            <dependency>
                <groupId>com.example</groupId>
                <artifactId>common</artifactId>
                <version>${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.example</groupId>
                <artifactId>api</artifactId>
                <version>${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.example</groupId>
                <artifactId>service</artifactId>
                <version>${project.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <!-- Common dependencies for all modules -->
    <dependencies>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.12.1</version>
                </plugin>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>${spring-boot.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

### Child Module POMs

```xml
<!-- common/pom.xml -->
<project>
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-application-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>common</artifactId>
    <name>My Application - Common</name>

    <dependencies>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
        </dependency>
    </dependencies>
</project>
```

```xml
<!-- api/pom.xml -->
<project>
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-application-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>api</artifactId>
    <name>My Application - API</name>

    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>common</artifactId>
        </dependency>
        <dependency>
            <groupId>jakarta.validation</groupId>
            <artifactId>jakarta.validation-api</artifactId>
        </dependency>
    </dependencies>
</project>
```

```xml
<!-- service/pom.xml -->
<project>
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-application-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>service</artifactId>
    <name>My Application - Service</name>

    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>api</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
    </dependencies>
</project>
```

```xml
<!-- web/pom.xml -->
<project>
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-application-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>web</artifactId>
    <name>My Application - Web</name>

    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>service</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <executions>
                    <execution>
                        <goals>
                            <goal>repackage</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### Directory Structure

```
my-application/
├── pom.xml                    # Parent POM
├── common/
│   ├── pom.xml
│   └── src/
│       ├── main/java/
│       └── test/java/
├── api/
│   ├── pom.xml
│   └── src/
│       ├── main/java/
│       └── test/java/
├── service/
│   ├── pom.xml
│   └── src/
│       ├── main/java/
│       └── test/java/
└── web/
    ├── pom.xml
    └── src/
        ├── main/java/
        ├── main/resources/
        └── test/java/
```

### Building Multi-Module Projects

```bash
# Build all modules from parent directory
mvn clean install

# Build specific module (and its dependencies)
mvn clean install -pl service -am

# -pl (projects list): specify modules to build
# -am (also make): build dependencies of specified modules
# -amd (also make dependents): build modules that depend on specified modules

# Build specific module without dependencies
mvn clean install -pl service

# Skip modules
mvn clean install -pl !web

# Resume from a specific module
mvn clean install -rf :service

# Parallel build
mvn -T 4 clean install
mvn -T 1C clean install  # 1 thread per CPU core
```

## Repository Management

Maven uses repositories to store and retrieve artifacts.

### Local Repository

The local repository (default: `~/.m2/repository`) caches downloaded artifacts:

```bash
# Clear local repository
rm -rf ~/.m2/repository

# Purge local repository of SNAPSHOT versions
mvn dependency:purge-local-repository -DsnapshotsOnly=true
```

### Remote Repositories

Configure remote repositories in the POM:

```xml
<repositories>
    <repository>
        <id>central</id>
        <name>Maven Central</name>
        <url>https://repo.maven.apache.org/maven2</url>
        <releases>
            <enabled>true</enabled>
            <updatePolicy>never</updatePolicy>
        </releases>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>

    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>

    <repository>
        <id>company-internal</id>
        <name>Company Internal Repository</name>
        <url>https://nexus.company.com/repository/maven-public</url>
        <releases>
            <enabled>true</enabled>
        </releases>
        <snapshots>
            <enabled>true</enabled>
            <updatePolicy>daily</updatePolicy>
        </snapshots>
    </repository>
</repositories>

<!-- Plugin repositories -->
<pluginRepositories>
    <pluginRepository>
        <id>central</id>
        <url>https://repo.maven.apache.org/maven2</url>
    </pluginRepository>
</pluginRepositories>
```

### Distribution Management

Configure where to deploy your artifacts:

```xml
<distributionManagement>
    <repository>
        <id>releases</id>
        <name>Release Repository</name>
        <url>https://nexus.company.com/repository/releases</url>
    </repository>

    <snapshotRepository>
        <id>snapshots</id>
        <name>Snapshot Repository</name>
        <url>https://nexus.company.com/repository/snapshots</url>
    </snapshotRepository>

    <!-- Site deployment -->
    <site>
        <id>website</id>
        <url>scp://www.company.com/www/docs/project/</url>
    </site>
</distributionManagement>
```

### Repository Authentication

Configure credentials in `~/.m2/settings.xml`:

```xml
<settings>
    <servers>
        <server>
            <id>releases</id>
            <username>deploy-user</username>
            <password>encrypted-password</password>
        </server>

        <server>
            <id>snapshots</id>
            <username>deploy-user</username>
            <password>encrypted-password</password>
        </server>

        <!-- Using private key authentication -->
        <server>
            <id>github</id>
            <privateKey>${user.home}/.ssh/id_rsa</privateKey>
            <passphrase>key-passphrase</passphrase>
        </server>
    </servers>
</settings>
```

Encrypt passwords:

```bash
# Create master password
mvn --encrypt-master-password

# Store in ~/.m2/settings-security.xml
# <settingsSecurity>
#   <master>{encrypted-master-password}</master>
# </settingsSecurity>

# Encrypt server password
mvn --encrypt-password
```

### Mirror Configuration

Configure mirrors to redirect repository requests:

```xml
<!-- ~/.m2/settings.xml -->
<settings>
    <mirrors>
        <!-- Mirror all repositories through company proxy -->
        <mirror>
            <id>company-mirror</id>
            <name>Company Nexus Mirror</name>
            <url>https://nexus.company.com/repository/maven-public</url>
            <mirrorOf>*</mirrorOf>
        </mirror>

        <!-- Mirror central only -->
        <mirror>
            <id>central-mirror</id>
            <name>Central Mirror</name>
            <url>https://mirror.example.com/maven2</url>
            <mirrorOf>central</mirrorOf>
        </mirror>

        <!-- Mirror all except certain repos -->
        <mirror>
            <id>nexus</id>
            <url>https://nexus.company.com/repository/maven-public</url>
            <mirrorOf>*,!spring-milestones</mirrorOf>
        </mirror>
    </mirrors>
</settings>
```

### Deploying Artifacts

```bash
# Deploy to configured repository
mvn deploy

# Deploy a single file
mvn deploy:deploy-file \
    -DgroupId=com.example \
    -DartifactId=my-artifact \
    -Dversion=1.0.0 \
    -Dpackaging=jar \
    -Dfile=path/to/file.jar \
    -DrepositoryId=releases \
    -Durl=https://nexus.company.com/repository/releases

# Install to local repository
mvn install

# Install a single file
mvn install:install-file \
    -DgroupId=com.example \
    -DartifactId=my-artifact \
    -Dversion=1.0.0 \
    -Dpackaging=jar \
    -Dfile=path/to/file.jar
```

## Best Practices

### Version Management

Use consistent versioning across your project:

```xml
<properties>
    <!-- Use properties for version management -->
    <spring-boot.version>3.2.1</spring-boot.version>
    <jackson.version>2.16.1</jackson.version>

    <!-- Use project.version for internal modules -->
</properties>

<dependencyManagement>
    <dependencies>
        <!-- Import BOMs for version management -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring-boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Dependency Best Practices

```xml
<!-- Always specify scope explicitly for non-compile dependencies -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>

<!-- Use dependencyManagement in parent POMs -->
<!-- Don't duplicate version numbers across modules -->

<!-- Exclude conflicting transitive dependencies -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <exclusions>
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- Prefer official BOMs over manual version management -->
```

### Plugin Best Practices

```xml
<build>
    <pluginManagement>
        <plugins>
            <!-- Always specify plugin versions -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.12.1</version>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```

### Profile Best Practices

```xml
<profiles>
    <!-- Use profiles for environment-specific configuration -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
    </profile>

    <!-- Don't use profiles for required dependencies -->
    <!-- Use profiles for optional features and optimizations -->
</profiles>
```

### Multi-Module Best Practices

```xml
<!-- Use consistent versioning with ${project.version} -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>common</artifactId>
    <version>${project.version}</version>
</dependency>

<!-- Define all inter-module dependencies in parent dependencyManagement -->

<!-- Keep module-specific dependencies in child POMs -->

<!-- Use parent for shared configuration, not for inheritance of unrelated projects -->
```

### Build Optimization

```bash
# Use parallel builds
mvn -T 1C clean install

# Skip tests when iterating quickly
mvn package -DskipTests

# Use incremental builds
mvn package -pl module-name -am

# Offline mode when you have all dependencies
mvn -o package

# Use build cache (with Maven Daemon)
mvnd clean install
```

### CI/CD Configuration

```xml
<profile>
    <id>ci</id>
    <build>
        <plugins>
            <!-- Enable test coverage -->
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.11</version>
            </plugin>

            <!-- Static analysis -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
                <version>3.3.1</version>
            </plugin>

            <!-- OWASP dependency check -->
            <plugin>
                <groupId>org.owasp</groupId>
                <artifactId>dependency-check-maven</artifactId>
                <version>9.0.7</version>
            </plugin>
        </plugins>
    </build>
</profile>
```

### Documentation

```xml
<!-- Include javadoc and sources -->
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-source-plugin</artifactId>
            <version>3.3.0</version>
            <executions>
                <execution>
                    <id>attach-sources</id>
                    <goals>
                        <goal>jar</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>

        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-javadoc-plugin</artifactId>
            <version>3.6.3</version>
            <executions>
                <execution>
                    <id>attach-javadocs</id>
                    <goals>
                        <goal>jar</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

### Maven Wrapper

Include Maven Wrapper for consistent builds across environments:

```bash
# Generate wrapper files
mvn wrapper:wrapper -Dmaven=3.9.6
```

This creates:

```
.mvn/
└── wrapper/
    ├── maven-wrapper.jar
    └── maven-wrapper.properties
mvnw          # Unix shell script
mvnw.cmd      # Windows batch script
```

Use the wrapper instead of system Maven:

```bash
./mvnw clean install
```

### Settings Template

Create a template `settings.xml` for team consistency:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0
                              http://maven.apache.org/xsd/settings-1.2.0.xsd">

    <localRepository>${user.home}/.m2/repository</localRepository>

    <interactiveMode>true</interactiveMode>

    <offline>false</offline>

    <servers>
        <!-- Add server credentials here -->
    </servers>

    <mirrors>
        <!-- Add mirrors here -->
    </mirrors>

    <profiles>
        <profile>
            <id>default-profile</id>
            <properties>
                <maven.compiler.source>17</maven.compiler.source>
                <maven.compiler.target>17</maven.compiler.target>
            </properties>
        </profile>
    </profiles>

    <activeProfiles>
        <activeProfile>default-profile</activeProfile>
    </activeProfiles>
</settings>
```

## Conclusion

Apache Maven provides a comprehensive solution for Java project management:

- **Standardized structure**: Convention over configuration ensures consistent project layouts
- **Dependency management**: Automatic resolution and conflict management for libraries
- **Build lifecycle**: Well-defined phases that cover the entire build process
- **Plugin ecosystem**: Extensible architecture with plugins for virtually any build task
- **Multi-module support**: Efficient management of complex projects with multiple components
- **Repository management**: Centralized artifact storage and distribution

By following Maven best practices such as proper version management, using BOMs, leveraging the Maven wrapper, and optimizing CI/CD builds, you can create maintainable, reproducible builds that scale well from small projects to large enterprise applications.

## Additional Resources

- [Apache Maven Official Documentation](https://maven.apache.org/guides/)
- [Maven Central Repository](https://central.sonatype.com/)
- [Maven Plugin Index](https://maven.apache.org/plugins/)
- [Sonatype Nexus Repository Manager](https://www.sonatype.com/products/nexus-repository)
- [JFrog Artifactory](https://jfrog.com/artifactory/)
- [Maven Wrapper](https://maven.apache.org/wrapper/)
- [Maven Daemon (mvnd)](https://github.com/apache/maven-mvnd)
