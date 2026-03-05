> **Navigation**: [< Previous Chapter](16a_SB_Missing_Core.md) | [Back to Index](../00_MASTER_INDEX.md)

---

# application.yml
springdoc:
    api-docs:
        path: /v3/api-docs
    swagger-ui:
        path: /swagger-ui.html
        operationsSorter: method
        tagsSorter: alpha
    show-actuator: false
```

### OpenAPI Configuration

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("My Application API")
                .version("1.0.0")
                .description("API documentation for My Application")
                .contact(new Contact()
                    .name("Backend Team")
                    .email("team@company.com")
                    .url("https://company.com"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0")))
            .externalDocs(new ExternalDocumentation()
                .description("Wiki Documentation")
                .url("https://wiki.company.com"))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Enter JWT token")));
    }
}
```

### Annotating Controllers

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "APIs for managing users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(
        summary = "Get user by ID",
        description = "Retrieves a user by their unique identifier"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "User found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(
            @Parameter(description = "User ID", required = true, example = "1")
            @PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @Operation(summary = "Create a new user")
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "User to create",
                required = true,
                content = @Content(
                    schema = @Schema(implementation = CreateUserRequest.class),
                    examples = @ExampleObject(
                        name = "Example user",
                        value = """
                            {
                                "email": "john@example.com",
                                "name": "John Doe",
                                "role": "USER"
                            }
                            """
                    )
                )
            )
            @RequestBody @Valid CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.create(request));
    }

    @Operation(
        summary = "Search users",
        description = "Search users with filtering and pagination"
    )
    @GetMapping("/search")
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @Parameter(description = "Search by name")
            @RequestParam(required = false) String name,

            @Parameter(description = "Filter by role")
            @RequestParam(required = false) String role,

            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.search(name, role, page, size));
    }
}


// DTO with schema annotations
@Schema(description = "User creation request")
public record CreateUserRequest(

    @Schema(
        description = "User's email address",
        example = "john@example.com",
        required = true
    )
    @Email
    @NotBlank
    String email,

    @Schema(
        description = "User's full name",
        example = "John Doe",
        minLength = 2,
        maxLength = 100
    )
    @NotBlank
    @Size(min = 2, max = 100)
    String name,

    @Schema(
        description = "User role",
        allowableValues = {"USER", "ADMIN", "MODERATOR"},
        defaultValue = "USER"
    )
    String role
) {}
```

**Access Swagger UI:** `http://localhost:8080/swagger-ui.html`

---

# SECTION 6: FILE UPLOAD/DOWNLOAD

---

## Chapter 6: Multipart File Handling

```yaml
# application.yml
spring:
    servlet:
        multipart:
            enabled: true
            max-file-size: 10MB
            max-request-size: 50MB
            file-size-threshold: 2KB # After this, write to disk
```

```java
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileStorageService storageService;

    /**
     * Single file upload
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedType(contentType)) {
            throw new BadRequestException("File type not allowed");
        }

        String fileName = storageService.store(file);

        return ResponseEntity.ok(new FileUploadResponse(
            fileName,
            file.getOriginalFilename(),
            file.getSize(),
            file.getContentType()
        ));
    }

    /**
     * Multiple file upload
     */
    @PostMapping("/upload-multiple")
    public ResponseEntity<List<FileUploadResponse>> uploadMultiple(
            @RequestParam("files") MultipartFile[] files) {

        return ResponseEntity.ok(
            Arrays.stream(files)
                .filter(f -> !f.isEmpty())
                .map(f -> {
                    String name = storageService.store(f);
                    return new FileUploadResponse(name, f.getOriginalFilename(),
                                                   f.getSize(), f.getContentType());
                })
                .toList()
        );
    }

    /**
     * File download
     */
    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        Resource resource = storageService.loadAsResource(filename);

        String contentType = "application/octet-stream";

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + resource.getFilename() + "\"")
            .body(resource);
    }

    /**
     * Stream large file
     */
    @GetMapping("/stream/{filename}")
    public ResponseEntity<StreamingResponseBody> streamFile(@PathVariable String filename) {
        Path filePath = storageService.getPath(filename);

        StreamingResponseBody stream = outputStream -> {
            try (InputStream inputStream = Files.newInputStream(filePath)) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
            }
        };

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + filename + "\"")
            .body(stream);
    }

    private boolean isAllowedType(String contentType) {
        return List.of(
            "image/jpeg", "image/png", "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ).contains(contentType);
    }
}


@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Path.of(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String store(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
            ? originalName.substring(originalName.lastIndexOf("."))
            : "";
        String newFileName = UUID.randomUUID() + extension;

        Path destinationPath = Path.of(uploadDir).resolve(newFileName);

        try {
            file.transferTo(destinationPath);
            log.info("File stored: {}", newFileName);
            return newFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Resource loadAsResource(String filename) {
        try {
            Path file = Path.of(uploadDir).resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileNotFoundException("File not found: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new FileNotFoundException("File not found: " + filename);
        }
    }

    public Path getPath(String filename) {
        return Path.of(uploadDir).resolve(filename);
    }
}
```

---

# SECTION 7: EMAIL SENDING

---

## Chapter 7: JavaMailSender

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
    mail:
        host: smtp.gmail.com
        port: 587
        username: ${MAIL_USERNAME}
        password: ${MAIL_PASSWORD} # Use app password for Gmail
        properties:
            mail:
                smtp:
                    auth: true
                    starttls:
                        enable: true
                        required: true
                    connectiontimeout: 5000
                    timeout: 5000
                    writetimeout: 5000
```

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Simple text email
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
        log.info("Email sent to {}", to);
    }

    /**
     * HTML email
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent)
            throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);  // true = HTML

        mailSender.send(message);
        log.info("HTML email sent to {}", to);
    }

    /**
     * Email with attachment
     */
    public void sendEmailWithAttachment(String to, String subject, String text,
                                         String attachmentPath) throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text);

        FileSystemResource file = new FileSystemResource(new File(attachmentPath));
        helper.addAttachment(file.getFilename(), file);

        mailSender.send(message);
        log.info("Email with attachment sent to {}", to);
    }

    /**
     * Template-based email (with Thymeleaf)
     */
    @Autowired
    private SpringTemplateEngine templateEngine;

    public void sendTemplatedEmail(String to, String templateName,
                                    Map<String, Object> variables) throws MessagingException {

        Context context = new Context();
        context.setVariables(variables);

        String htmlContent = templateEngine.process(templateName, context);
        sendHtmlEmail(to, (String) variables.get("subject"), htmlContent);
    }
}


// Email template: src/main/resources/templates/email/welcome.html
// <!DOCTYPE html>
// <html xmlns:th="http://www.thymeleaf.org">
// <body>
//     <h1>Welcome, <span th:text="${name}">User</span>!</h1>
//     <p>Your account has been created successfully.</p>
//     <a th:href="${activationLink}">Activate your account</a>
// </body>
// </html>
```

---

# SECTION 8: LOGGING

---

## Chapter 8: Logging Configuration

```yaml
# application.yml
logging:
    level:
        root: INFO
        com.myapp: DEBUG
        org.springframework: INFO
        org.hibernate.SQL: DEBUG
        org.hibernate.type.descriptor.sql.BasicBinder: TRACE # Show query params
    pattern:
        console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
        file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file:
        name: logs/application.log
        max-size: 10MB
        max-history: 30
```

### Logback Configuration

```xml
<!-- src/main/resources/logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <!-- Console appender -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} %highlight(%-5level) %cyan(%logger{36}) - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- Rolling file appender -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/application.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} %-5level [%thread] %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- JSON format for production (ELK stack) -->
    <appender name="JSON" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.json</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/application.%d{yyyy-MM-dd}.json</fileNamePattern>
            <maxHistory>7</maxHistory>
        </rollingPolicy>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
    </appender>

    <!-- Profile-specific configuration -->
    <springProfile name="dev">
        <root level="DEBUG">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>

    <springProfile name="prod">
        <root level="INFO">
            <appender-ref ref="FILE"/>
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

### Structured Logging with MDC

```java
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
            throws ServletException, IOException {

        // Add context to all logs in this request
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        String userId = request.getHeader("X-User-Id");

        MDC.put("requestId", requestId);
        MDC.put("userId", userId != null ? userId : "anonymous");
        MDC.put("path", request.getRequestURI());

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();  // Important: clear after request
        }
    }
}

// Logback pattern to include MDC
// %d{yyyy-MM-dd HH:mm:ss} [%X{requestId}] [%X{userId}] %-5level %logger{36} - %msg%n
```

---

# SECTION 9: DATABASE MIGRATIONS

---

## Chapter 9: Flyway

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId> <!-- or flyway-database-postgresql -->
</dependency>
```

```yaml
# application.yml
spring:
    flyway:
        enabled: true
        baseline-on-migrate: true
        locations: classpath:db/migration
        validate-on-migrate: true
```

### Migration Files

```sql
-- src/main/resources/db/migration/V1__Create_users_table.sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);


-- src/main/resources/db/migration/V2__Add_role_to_users.sql
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';


-- src/main/resources/db/migration/V3__Create_orders_table.sql
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Flyway Naming Convention

```
V<version>__<description>.sql

Examples:
V1__Create_users_table.sql
V2__Add_role_column.sql
V3__Create_orders_table.sql
V1.1__Add_index.sql  (Versioned: runs once)
R__Insert_reference_data.sql  (Repeatable: runs when checksum changes)
```

---

# SECTION 10: DOCKER DEPLOYMENT

---

## Chapter 10: Dockerizing Spring Boot

```dockerfile
# Dockerfile - Multi-stage build
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
    app:
        build: .
        ports:
            - "8080:8080"
        environment:
            - SPRING_PROFILES_ACTIVE=prod
            - SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/mydb
            - SPRING_DATASOURCE_USERNAME=root
            - SPRING_DATASOURCE_PASSWORD=secret
            - SPRING_REDIS_HOST=redis
        depends_on:
            - db
            - redis
        healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
            interval: 30s
            timeout: 10s
            retries: 3

    db:
        image: mysql:8
        environment:
            MYSQL_ROOT_PASSWORD: secret
            MYSQL_DATABASE: mydb
        volumes:
            - mysql-data:/var/lib/mysql
        ports:
            - "3306:3306"

    redis:
        image: redis:7-alpine
        ports:
            - "6379:6379"
        volumes:
            - redis-data:/data

volumes:
    mysql-data:
    redis-data:
```

### Building and Running

```bash
# Build image
docker build -t myapp:latest .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

# SECTION 11: ENVIRONMENT CONFIGURATION

---

## Chapter 11: Externalized Configuration

```yaml
# application.yml - Common settings
spring:
    application:
        name: my-application
    profiles:
        active: ${SPRING_PROFILES_ACTIVE:dev}

---
# application-dev.yml
spring:
    config:
        activate:
            on-profile: dev
    datasource:
        url: jdbc:h2:mem:devdb
        driver-class-name: org.h2.Driver
    h2:
        console:
            enabled: true

logging:
    level:
        com.myapp: DEBUG

---
# application-prod.yml
spring:
    config:
        activate:
            on-profile: prod
    datasource:
        url: ${DATABASE_URL}
        username: ${DATABASE_USERNAME}
        password: ${DATABASE_PASSWORD}
        hikari:
            maximum-pool-size: 20
            minimum-idle: 5

logging:
    level:
        root: WARN
        com.myapp: INFO
```

### Configuration Properties Class

```java
@Configuration
@ConfigurationProperties(prefix = "app")
@Validated
@Getter @Setter
public class AppProperties {

    @NotBlank
    private String name;

    @Valid
    private Security security = new Security();

    @Valid
    private Cache cache = new Cache();

    @Getter @Setter
    public static class Security {
        @NotBlank
        private String jwtSecret;

        @Positive
        private long jwtExpirationMs = 86400000;  // 1 day default
    }

    @Getter @Setter
    public static class Cache {
        @Positive
        private int ttlMinutes = 60;

        @Positive
        private int maxSize = 1000;
    }
}

// application.yml
// app:
//   name: My Application
//   security:
//     jwt-secret: ${JWT_SECRET:default-dev-secret}
//     jwt-expiration-ms: 86400000
//   cache:
//     ttl-minutes: 30
//     max-size: 500


// Usage
@Service
@RequiredArgsConstructor
public class JwtService {
    private final AppProperties appProperties;

    public String generateToken(User user) {
        return Jwts.builder()
            .setSubject(user.getEmail())
            .setExpiration(new Date(System.currentTimeMillis() +
                appProperties.getSecurity().getJwtExpirationMs()))
            .signWith(Keys.hmacShaKeyFor(
                appProperties.getSecurity().getJwtSecret().getBytes()))
            .compact();
    }
}
```

---

# SECTION 12: MESSAGING BASICS

---

## Chapter 12: Kafka & RabbitMQ

### Kafka Producer/Consumer

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
    kafka:
        bootstrap-servers: localhost:9092
        consumer:
            group-id: my-group
            auto-offset-reset: earliest
            key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
            value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
            properties:
                spring.json.trusted.packages: "*"
        producer:
            key-serializer: org.apache.kafka.common.serialization.StringSerializer
            value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
```

```java
// Kafka Producer
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendOrderCreated(OrderCreatedEvent event) {
        kafkaTemplate.send("order-events", event.getOrderId(), event)
            .whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Order event sent: {}", event.getOrderId());
                } else {
                    log.error("Failed to send order event", ex);
                }
            });
    }
}

// Kafka Consumer
@Service
@Slf4j
public class OrderEventConsumer {

    @KafkaListener(topics = "order-events", groupId = "notification-service")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Received order event: {}", event.getOrderId());
        // Send notification, update analytics, etc.
    }

    @KafkaListener(
        topics = "order-events",
        groupId = "inventory-service",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleInventoryUpdate(
            @Payload OrderCreatedEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Inventory update: {} from partition {} offset {}",
                 event.getOrderId(), partition, offset);
    }
}
```

### RabbitMQ

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

```java
@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue orderQueue() {
        return new Queue("order-queue", true);  // durable
    }

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange("order-exchange");
    }

    @Bean
    public Binding orderBinding(Queue orderQueue, TopicExchange orderExchange) {
        return BindingBuilder
            .bind(orderQueue)
            .to(orderExchange)
            .with("order.#");  // Routing key pattern
    }
}

@Service
@RequiredArgsConstructor
public class RabbitProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendOrder(OrderEvent event) {
        rabbitTemplate.convertAndSend(
            "order-exchange",
            "order.created",
            event
        );
    }
}

@Service
@Slf4j
public class RabbitConsumer {

    @RabbitListener(queues = "order-queue")
    public void handleOrder(OrderEvent event) {
        log.info("Received via RabbitMQ: {}", event);
    }
}
```

---

# QUICK REFERENCE

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│              PART 14 QUICK REFERENCE                                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CACHING:                                                                        │
│  @Cacheable - Read from cache                                                    │
│  @CacheEvict - Remove from cache                                                 │
│  @CachePut - Always update cache                                                 │
│                                                                                  │
│  ASYNC:                                                                          │
│  @EnableAsync + @Async                                                           │
│  Return CompletableFuture<T> for result                                          │
│                                                                                  │
│  SCHEDULING:                                                                     │
│  @EnableScheduling + @Scheduled                                                  │
│  fixedRate, fixedDelay, cron                                                     │
│                                                                                  │
│  ACTUATOR ENDPOINTS:                                                             │
│  /actuator/health - Health check                                                 │
│  /actuator/metrics - JVM metrics                                                 │
│  /actuator/info - App info                                                       │
│                                                                                  │
│  SWAGGER:                                                                        │
│  @Tag, @Operation, @ApiResponse, @Schema                                         │
│  URL: /swagger-ui.html                                                           │
│                                                                                  │
│  FILES:                                                                          │
│  @RequestParam("file") MultipartFile file                                        │
│                                                                                  │
│  EMAIL:                                                                          │
│  JavaMailSender, SimpleMailMessage, MimeMessage                                  │
│                                                                                  │
│  FLYWAY:                                                                         │
│  V<version>__<description>.sql in db/migration/                                  │
│                                                                                  │
│  DOCKER:                                                                         │
│  Multi-stage build, docker-compose                                               │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

_This completes the essential missing topics in Spring Boot!_
