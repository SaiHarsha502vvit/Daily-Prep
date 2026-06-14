**Navigation**: [< Previous](Ch08_Collections_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch13_Networking_NIO.md)

# 🔧 Chapter 45 — Maven & Gradle Build Internals: How Java Projects Actually Build

**"Every Java developer uses Maven or Gradle daily, but few understand the lifecycle phases, dependency resolution algorithm, or why 'mvn clean install' does what it does. Understanding build tools is what makes you self-sufficient — you stop copying Stack Overflow commands blindly."**

---

## Table of Contents

1. [Why Build Tools Exist](#1-why-build-tools-exist)
2. [Maven Lifecycle & Phases](#2-maven-lifecycle--phases)
3. [POM.xml Deep Dive](#3-pomxml-deep-dive)
4. [Maven Dependency Resolution](#4-maven-dependency-resolution)
5. [Dependency Scopes](#5-dependency-scopes)
6. [BOM — Bill of Materials](#6-bom--bill-of-materials)
7. [Maven Profiles & Properties](#7-maven-profiles--properties)
8. [Gradle — Task-Based Build System](#8-gradle--task-based-build-system)
9. [Gradle Dependency Management](#9-gradle-dependency-management)
10. [Maven vs Gradle Comparison](#10-maven-vs-gradle-comparison)
11. [Common Build Problems & Fixes](#11-common-build-problems--fixes)
12. [Maven Wrapper & Gradle Wrapper](#12-maven-wrapper--gradle-wrapper)

---


### Historical Evolution

**Inventor / Originator:** Apache Foundation (2004) — Maven 1.0 by Jason van Zyl and Sonatype team.

**Predecessor context:** Make (Stuart Feldman, 1977) compiled C. Ant (James Duncan Davidson, 2000) compiled Java with XML build files but no dependency management. Every project manually downloaded JARs into `lib/` — "JAR hell."

**Evolution narrative:** Maven 1.0 (2004) introduced convention over configuration, dependency coordinates (`groupId:artifactId:version`), and remote repositories (Maven Central, 2005). The `pom.xml` replaced `build.xml`. Maven's reactor built multi-module projects in dependency order. Maven 2.0 (2007) added the local repository (`~/.m2/repository`) and improved dependency mediation. Gradle (2007 first commit, 2012 1.0 release) was created by Hans Dockter and Gradle Inc. to combine Ant's flexibility with Maven's dependency management. Gradle used a Groovy (later Kotlin) DSL instead of XML, enabling programmatic builds. Gradle's incremental compilation (2012) and build cache (2017) dramatically reduced build times — a 500-module project could go from 10 minutes to under 2 minutes. Gradle 8.x (2023) adds configuration cache and version catalog support.

**Modern practice:** Gradle has overtaken Maven for new projects (especially Android, 2013). Maven is still dominant in enterprise Java (Spring, Hibernate). Both support `mvnw` / `gradlew` wrappers for reproducible builds. `build.gradle.kts` (Kotlin DSL) is preferred for type-safe builds. Version catalogs (`libs.versions.toml`, Gradle 7+) and Maven BOMs centralize version management.

- **Make — 1977**: Stuart Feldman. C compilation. First build tool. Not Java-aware.
- **Ant — Apache 2000**: James Duncan Davidson. Java XML builds. No dependency management.
- **Maven 1.0 — 2004**: Jason van Zyl / Sonatype. Convention + dependency coordinates + remote repo.
- **Maven Central — 2005**: Sonatype. Central artifact repository. 35M+ artifacts today.
- **Gradle 1.0 — 2012**: Hans Dockter / Gradle Inc. Groovy DSL. Incremental builds. Gradle daemon.
- **Gradle build cache — 2017**: Remote build cache. Same inputs → cached outputs. Massive time savings.
## 1. Why Build Tools Exist

```
  WITHOUT A BUILD TOOL:
  ═════════════════════

  1. Download 47 JAR files manually
  2. Track which version of each library you need
  3. Run javac with all 47 JARs in classpath
  4. Remember the order to compile modules
  5. Copy resources to output directory
  6. Run tests manually
  7. Package into JAR/WAR
  8. Deploy somewhere

  Repeat for every developer on the team...


  WITH A BUILD TOOL:
  ══════════════════

  mvn clean package    ← One command does everything

  Build tool handles:
  • Dependency download and version management
  • Compile order (module dependencies)
  • Resource copying
  • Test execution
  • Packaging (JAR, WAR, Docker image)
  • Publishing to artifact repositories
```

---

## 2. Maven Lifecycle & Phases

```
  Maven has 3 built-in lifecycles:

  1. CLEAN lifecycle:     clean
  2. DEFAULT lifecycle:   compile → test → package → install → deploy
  3. SITE lifecycle:      site (generates documentation)


  DEFAULT LIFECYCLE PHASES (in order):
  ════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────┐
  │  validate     → Check POM is correct and all info available │
  │      ↓                                                      │
  │  compile      → Compile src/main/java → target/classes      │
  │      ↓                                                      │
  │  test-compile → Compile src/test/java → target/test-classes │
  │      ↓                                                      │
  │  test         → Run unit tests (Surefire plugin)            │
  │      ↓                                                      │
  │  package      → Create JAR/WAR in target/                  │
  │      ↓                                                      │
  │  verify       → Run integration tests (Failsafe plugin)    │
  │      ↓                                                      │
  │  install      → Copy artifact to ~/.m2/repository (local)  │
  │      ↓                                                      │
  │  deploy       → Upload to remote repository (Nexus/Artifactory)│
  └─────────────────────────────────────────────────────────────┘

  KEY RULE: Running a phase runs ALL PRECEDING phases!

  mvn package  = validate + compile + test-compile + test + package
  mvn install  = all above + verify + install
  mvn test     = validate + compile + test-compile + test
```

```
  COMMON COMMANDS DECODED:
  ════════════════════════

  mvn clean install
  ├── clean    → Delete target/ directory
  └── install  → validate → compile → test → package → verify → install

  mvn clean package -DskipTests
  ├── clean         → Delete target/
  ├── package       → Compile and create JAR
  └── -DskipTests   → Skip running tests (still compiles test code)

  mvn clean package -Dmaven.test.skip=true
  └── Skip test compilation AND execution (faster)

  mvn dependency:tree
  └── Show full dependency tree (transitive deps visible)

  mvn dependency:analyze
  └── Find unused declared and used undeclared dependencies
```

---

## 3. POM.xml Deep Dive

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <!-- PROJECT COORDINATES (unique identifier) -->
    <groupId>com.harsha</groupId>        <!-- Organization -->
    <artifactId>my-app</artifactId>      <!-- Project name -->
    <version>1.0.0-SNAPSHOT</version>    <!-- Version -->
    <packaging>jar</packaging>            <!-- jar, war, pom -->

    <!-- PARENT POM (inherit configuration) -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <!-- PROPERTIES (variables) -->
    <properties>
        <java.version>21</java.version>
        <spring.version>6.1.0</spring.version>
    </properties>

    <!-- DEPENDENCIES -->
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <!-- Version inherited from parent BOM -->
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>  <!-- Only available during testing -->
        </dependency>
    </dependencies>

    <!-- BUILD CONFIGURATION -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

```
  POM INHERITANCE:
  ════════════════

  Super POM (Maven default)
       ↓ inherits
  Parent POM (spring-boot-starter-parent)
       ↓ inherits
  Your POM (my-app)

  Your POM inherits:
  • Plugin configurations
  • Dependency versions (from parent's dependencyManagement)
  • Properties
  • Build settings

  Check effective POM (everything merged):
  mvn help:effective-pom
```

---

## 4. Maven Dependency Resolution

```
  HOW MAVEN RESOLVES DEPENDENCIES:
  ═════════════════════════════════

  1. Read your POM → Build dependency tree
  2. For each dependency:
     a. Check local repo (~/.m2/repository)
     b. If not found → download from remote (Maven Central)
     c. Download transitively (dependencies of dependencies)


  TRANSITIVE DEPENDENCIES:
  ═══════════════════════

  Your app → spring-boot-starter-web
                ├── spring-web
                ├── spring-webmvc
                ├── spring-boot-starter-tomcat
                │   ├── tomcat-embed-core
                │   └── tomcat-embed-websocket
                └── spring-boot-starter-json
                    ├── jackson-databind
                    └── jackson-datatype-jdk8

  You declared 1 dependency. Maven downloaded 20+.


  CONFLICT RESOLUTION (nearest-wins):
  ════════════════════════════════════

  Your app → A 1.0 → C 1.0
  Your app → B 1.0 → C 2.0

  Which version of C?
  Both are 2 levels deep → Maven picks the FIRST one declared in POM.

  Your app → C 3.0  (direct dependency, depth 1)
  Your app → A 1.0 → C 1.0  (transitive, depth 2)

  Which C? → C 3.0 wins (nearest to root = depth 1)
```

```xml
<!-- EXCLUDE a transitive dependency: -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<!-- Now add Jetty instead: -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

---

🔬 **Section Challenge — 4. Maven Dependency Resolution**

**Challenge 1 (Reasoning):** Constructor injection vs field injection (`@Autowired` on field) — which is better and why?

<details><summary>Answer</summary>

Constructor injection is better: (1) Dependencies explicit — you can't create object without them. (2) Immutable — field can be `final`. (3) Testable — inject mocks via constructor, no Spring context needed. (4) Detects circular deps at startup, not at first use. Field injection: shorter code but: hidden dependencies, can't be `final`, requires Spring for test setup, circular deps detected late. Spring itself recommends constructor injection since v4.

</details>

## 5. Dependency Scopes

```
  ┌──────────────┬───────────┬───────────┬─────────────────────────┐
  │ Scope        │ Compile   │ Runtime   │ Purpose                 │
  │              │ classpath │ classpath │                         │
  ├──────────────┼───────────┼───────────┼─────────────────────────┤
  │ compile      │    ✅     │    ✅     │ Default. Available      │
  │ (default)    │           │           │ everywhere.             │
  ├──────────────┼───────────┼───────────┼─────────────────────────┤
  │ provided     │    ✅     │    ❌     │ Container provides it   │
  │              │           │           │ (servlet-api in Tomcat) │
  ├──────────────┼───────────┼───────────┼─────────────────────────┤
  │ runtime      │    ❌     │    ✅     │ Not needed to compile,  │
  │              │           │           │ only at runtime         │
  │              │           │           │ (JDBC driver)           │
  ├──────────────┼───────────┼───────────┼─────────────────────────┤
  │ test         │    ❌     │    ❌     │ Only for test compile   │
  │              │ (test ✅) │ (test ✅) │ & test runtime          │
  │              │           │           │ (JUnit, Mockito)        │
  ├──────────────┼───────────┼───────────┼─────────────────────────┤
  │ system       │    ✅     │    ❌     │ Explicit JAR path       │
  │              │           │           │ (avoid — not portable!) │
  └──────────────┴───────────┴───────────┴─────────────────────────┘
```

---

🔬 **Section Challenge — 5. Dependency Scopes**

**Challenge 1 (Reasoning):** Constructor injection vs field injection (`@Autowired` on field) — which is better and why?

<details><summary>Answer</summary>

Constructor injection is better: (1) Dependencies explicit — you can't create object without them. (2) Immutable — field can be `final`. (3) Testable — inject mocks via constructor, no Spring context needed. (4) Detects circular deps at startup, not at first use. Field injection: shorter code but: hidden dependencies, can't be `final`, requires Spring for test setup, circular deps detected late. Spring itself recommends constructor injection since v4.

</details>

## 6. BOM — Bill of Materials

```
  PROBLEM: You use Spring Boot + Spring Cloud + Spring Security.
  Each has 10+ modules. Which version of spring-core works with all?

  SOLUTION: BOM → pre-approved version combinations.
```

```xml
<!-- BOM declaration (in dependencyManagement): -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Now you can omit versions — BOM provides them: -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <!-- No <version> needed! BOM defines it. -->
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <!-- BOM knows which jackson version is compatible. -->
    </dependency>
</dependencies>
```

---

## 7. Maven Profiles & Properties

```xml
<!-- PROFILES: Different config for different environments -->
<profiles>
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <db.url>jdbc:h2:mem:devdb</db.url>
        </properties>
    </profile>
    <profile>
        <id>prod</id>
        <properties>
            <db.url>jdbc:postgresql://prod-server:5432/appdb</db.url>
        </properties>
        <dependencies>
            <dependency>
                <groupId>org.postgresql</groupId>
                <artifactId>postgresql</artifactId>
            </dependency>
        </dependencies>
    </profile>
</profiles>

<!-- Activate: mvn clean package -Pprod -->
```

---

## 8. Gradle — Task-Based Build System

```
  MAVEN: Lifecycle-based (fixed phases, convention over configuration)
  GRADLE: Task-based (directed acyclic graph of tasks, flexible)

  Instead of XML, Gradle uses Groovy or Kotlin DSL.
```

```groovy
// build.gradle (Groovy DSL):
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.harsha'
version = '1.0.0-SNAPSHOT'

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()    // Where to download dependencies
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

```kotlin
// build.gradle.kts (Kotlin DSL — type-safe, IDE autocomplete):
plugins {
    java
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.harsha"
version = "1.0.0-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

```
  GRADLE TASK GRAPH:
  ═══════════════════

  Every Gradle build is a DAG (Directed Acyclic Graph) of tasks:

  compileJava → processResources → classes → jar
  compileTestJava → processTestResources → testClasses → test

  Run: gradle tasks --all  (see all available tasks)


  COMMON COMMANDS:
  ════════════════

  gradle build           → compile + test + jar
  gradle bootRun         → Run Spring Boot app
  gradle test            → Run tests only
  gradle dependencies    → Show dependency tree
  gradle clean build     → Delete build/ and rebuild
  gradle build -x test   → Skip tests
```

---

## 9. Gradle Dependency Management

```groovy
dependencies {
    // CONFIGURATION → scope equivalent:
    implementation 'com.example:lib:1.0'      // compile scope
    api 'com.example:lib:1.0'                 // compile + exposed to consumers
    compileOnly 'javax.servlet:servlet-api'   // provided scope
    runtimeOnly 'org.postgresql:postgresql'    // runtime scope
    testImplementation 'org.junit:junit'       // test scope

    // Force a version:
    implementation('com.example:lib') {
        version { strictly '2.0' }
    }

    // Exclude transitive:
    implementation('com.example:lib') {
        exclude group: 'commons-logging', module: 'commons-logging'
    }
}
```

```
  implementation vs api:
  ══════════════════════

  Module A → Module B → Module C

  If B declares C as 'implementation':
    A CANNOT see C. C is hidden from A.
    If C changes → only B recompiles (faster builds!)

  If B declares C as 'api':
    A CAN see C. C leaks to A.
    If C changes → both B and A recompile.

  RULE: Use 'implementation' by default. Use 'api' only when
  your public API exposes types from the dependency.
```

---

🔬 **Section Challenge — 9. Gradle Dependency Management**

**Challenge 1 (Reasoning):** Constructor injection vs field injection (`@Autowired` on field) — which is better and why?

<details><summary>Answer</summary>

Constructor injection is better: (1) Dependencies explicit — you can't create object without them. (2) Immutable — field can be `final`. (3) Testable — inject mocks via constructor, no Spring context needed. (4) Detects circular deps at startup, not at first use. Field injection: shorter code but: hidden dependencies, can't be `final`, requires Spring for test setup, circular deps detected late. Spring itself recommends constructor injection since v4.

</details>

## 10. Maven vs Gradle Comparison

```
  ┌──────────────────────┬──────────────────┬──────────────────┐
  │ Feature              │ Maven            │ Gradle           │
  ├──────────────────────┼──────────────────┼──────────────────┤
  │ Config format        │ XML (verbose)    │ Groovy/Kotlin DSL│
  │ Build model          │ Lifecycle phases │ Task DAG         │
  │ Speed                │ Slower           │ 2-10x faster     │
  │                      │                  │ (daemon + cache) │
  │ Incremental build    │ Limited          │ Excellent        │
  │ Flexibility          │ Convention-heavy │ Very flexible    │
  │ Learning curve       │ Lower            │ Higher           │
  │ IDE support          │ Excellent        │ Excellent        │
  │ Industry adoption    │ Very high        │ Growing fast     │
  │ Android              │ No               │ Default tool     │
  │ Multi-module         │ Good             │ Better           │
  │ Plugin ecosystem     │ Huge             │ Large            │
  └──────────────────────┴──────────────────┴──────────────────┘

  WHICH TO CHOOSE?
  • New Spring Boot project? Either works. Gradle is faster.
  • Android? Gradle (mandatory).
  • Enterprise/legacy? Likely Maven (more common).
  • Need custom build logic? Gradle (it's a programming language).
```

---

## 11. Common Build Problems & Fixes

```
  PROBLEM: "Could not find artifact X"
  FIX: Check repository URLs. Is the artifact in Maven Central?
       Run: mvn dependency:resolve -U  (force update)
       Check: ~/.m2/settings.xml for proxy/mirror config

  PROBLEM: "Duplicate class found in X and Y"
  FIX: Run: mvn dependency:tree | grep conflicting-lib
       Exclude one: add <exclusion> in POM

  PROBLEM: "NoSuchMethodError at runtime" (version mismatch)
  FIX: Two versions of same library on classpath.
       Run: mvn dependency:tree
       Find the conflict. Force correct version in your POM.

  PROBLEM: Tests pass locally, fail in CI
  FIX: Check: Java version mismatch? OS-specific paths?
       Run: mvn clean verify (clean build, don't use cached classes)
       Check: test ordering (use @TestMethodOrder)

  PROBLEM: Build is slow
  FIX (Maven):  mvn -T 4 clean package  (4 threads)
  FIX (Gradle): Already uses daemon + incremental.
                Add: org.gradle.caching=true in gradle.properties
```

---

## 12. Maven Wrapper & Gradle Wrapper

```
  PROBLEM: "Works on my machine" — different Maven/Gradle versions.
  SOLUTION: Wrapper script committed to repo. Everyone uses same version.
```

```bash
# MAVEN WRAPPER:
# Generate wrapper files:
mvn wrapper:wrapper -Dmaven=3.9.6

# Creates:
# .mvn/wrapper/maven-wrapper.properties  (version config)
# mvnw      (Unix script)
# mvnw.cmd  (Windows script)

# Usage (instead of 'mvn'):
./mvnw clean package         # Unix
mvnw.cmd clean package       # Windows


# GRADLE WRAPPER:
# Generate wrapper:
gradle wrapper --gradle-version 8.5

# Creates:
# gradle/wrapper/gradle-wrapper.properties
# gradlew      (Unix script)
# gradlew.bat  (Windows script)

# Usage (instead of 'gradle'):
./gradlew build              # Unix
gradlew.bat build            # Windows
```

```
  ╔═══════════════════════════════════════════════════════════╗
  ║  RULE: Always commit wrapper files to source control.     ║
  ║  Always use ./mvnw or ./gradlew in CI/CD pipelines.      ║
  ║  Never rely on globally installed Maven/Gradle.           ║
  ╚═══════════════════════════════════════════════════════════╝
```

### Production Reality

Build tools fail in production in ways that are invisible in local development. These are the named failure modes and debug workflows every Java developer encounters.

**Named failure modes:**

- **`Maven dependency convergence failure`** — Two transitive dependencies pull in different versions of the same library (e.g., `spring-core 5.2` vs `5.3`). Maven's nearest-wins strategy picks one, but the other is still on the classpath via a different path. At runtime: `NoSuchMethodError`, `ClassNotFoundException`, or silent behavior differences. **Debug workflow:** Run `mvn dependency:tree -Dincludes=com.example:library` to find all versions, then add an explicit `<version>` in `<dependencyManagement>` or use `<exclusion>`. Check with `mvn dependency:analyze` which warns about used-but-undeclared and unused-declared-but-used dependencies.

- **`JAR hell — split package`** — Two JARs declare classes in the same package (e.g., `com.google.gson` appears in both `gson.jar` and a shaded uber-jar). The JVM loads whichever is found first — behavior is non-deterministic across environments. **Debug workflow:** Run `mvn dependency:tree | grep -E "gson|jackson|guava"` looking for duplicate artifacts. Use `jdeps` (Java 8+) to trace which JAR defines which package: `jdeps -s target/myapp.jar`. Fix with Maven Enforcer Plugin's `banDuplicatePomDependencyVersions` rule.

- **`ClassNotFoundException` vs `NoClassDefFoundError` distinction** — `ClassNotFoundException` is a checked exception thrown when a class is missing at runtime (typically via reflection: `Class.forName()`, classloader.loadClass()). `NoClassDefFoundError` is an error thrown when the class existed at compile time but is missing at runtime (class was loaded successfully before, but a static initializer failed). The distinction matters: CNFE means the class was never found; NCDOE means the class was found but failed to initialize — a more subtle and dangerous failure. **Debug workflow:** For NCDOE, add `-XX:+TraceClassLoading` to see which class failed to initialize. For CNFE, check `mvn dependency:tree` for missing transitive dependencies.

- **Circular reactor build** — Maven reactor (multi-module builds) traverses modules in dependency order. A circular dependency (A→B→C→A) causes a cryptic error: `Circular dependency between modules`. **Debug workflow:** `mvn dependency:resolve-plugins` shows where the cycle forms. Use `mvn reactor:make -DmakeOrder=descending` to visualize the module graph. Fix by extracting the shared module (e.g., `common`) to a third module that both A and B depend on.

- **`mvn clean` wiping generated sources** — `mvn clean` deletes the entire `target/` directory including generated sources (from `maven-annotation-plugin`, `openapi-generator`, or Lombok annotation processing). If annotation processors run in a different phase than expected, regenerated files are missing and compile fails with hundreds of errors. **Debug workflow:** Always use `mvn compile` followed by `mvn test-compile` rather than relying on incremental processing. For Lombok, add `<annotationProcessorPaths>` explicitly in the `<plugin>` section to guarantee ordering.

- **`System.gc()` triggering Full GC in production** — While not build-tool-specific, Maven Surefire plugin (via RMI registry startup) can trigger `System.gc()` heuristics that cause long GC pauses during test runs. **Debug workflow:** Add `-XX:+DisableExplicitGC` to `MAVEN_OPTS` environment variable. Verify with GC logs: `-Xlog:gc*:file=gc.log`.

---

**Next Chapter**: [Java Networking & NIO →](Ch13_Networking_NIO.md)
