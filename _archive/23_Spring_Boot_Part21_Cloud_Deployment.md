# Spring Boot Part 21: Cloud Deployment

## AWS, Azure, and GCP Integration Complete Guide

> **"The cloud is not just about cost savings—it's about speed, scale, and innovation"** - Deploy anywhere, scale everywhere

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Cloud Deployment?                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Scalability: Auto-scale based on traffic (pay only for what you use)       │
│  • Reliability: Multi-region, high availability built-in                      │
│  • Speed: Deploy in minutes, not days (CI/CD pipelines)                       │
│  • Managed services: Focus on code, not infrastructure                        │
│  • Global reach: Deploy to any region, serve users worldwide                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How to Deploy to Cloud?                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Containerize: Docker multi-stage build for Spring Boot                     │
│  • Orchestrate: Kubernetes (EKS/AKS/GKE) for container management             │
│  • Automate: CI/CD with GitHub Actions/GitLab CI                              │
│  • Infrastructure as Code: Terraform for reproducible deployments            │
│  • Secrets: Cloud secret managers (AWS Secrets, Azure Key Vault)              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Each Cloud Service?                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Docker: Every deployment (containerization is standard)                    │
│  • Kubernetes: Multiple services, scaling needs, production                   │
│  • Serverless (Lambda/Cloud Run): Event-driven, sporadic workloads            │
│  • PaaS (Elastic Beanstalk): Simple apps, less control needed                 │
│  • Multi-cloud: Vendor lock-in concerns, compliance requirements              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Cloud Provider?                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  AWS:   Market leader, most services, best for startups (free tier)            │
│  Azure: Best for Microsoft shops, enterprise, hybrid cloud                     │
│  GCP:   Best for data/ML, Kubernetes (invented there), competitive pricing    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Table of Contents

1. [Cloud Native Principles](#cloud-native-principles)
2. [Containerization with Docker](#containerization-with-docker)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Azure Deployment](#azure-deployment)
6. [GCP Deployment](#gcp-deployment)
7. [Multi-Cloud Strategy](#multi-cloud-strategy)
8. [CI/CD Pipelines](#cicd-pipelines)
9. [Infrastructure as Code](#infrastructure-as-code)
10. [Secrets Management](#secrets-management)
11. [Monitoring and Logging](#monitoring-and-logging)
12. [Cost Optimization](#cost-optimization)
13. [Security Best Practices](#security-best-practices)
14. [Disaster Recovery](#disaster-recovery)
15. [Interview Questions](#interview-questions)

---

## Cloud Native Principles

### The Twelve-Factor App

```
┌─────────────────────────────────────────────────────────────────┐
│                   12-FACTOR APP PRINCIPLES                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Codebase      │ One codebase, many deploys                  │
│  2. Dependencies  │ Explicitly declare and isolate              │
│  3. Config        │ Store in environment                        │
│  4. Backing Svcs  │ Treat as attached resources                 │
│  5. Build/Release │ Strictly separate stages                    │
│  6. Processes     │ Execute as stateless processes              │
│  7. Port Binding  │ Export services via port binding            │
│  8. Concurrency   │ Scale via process model                     │
│  9. Disposability │ Fast startup and graceful shutdown          │
│ 10. Dev/Prod Parity│ Keep environments similar                  │
│ 11. Logs          │ Treat as event streams                      │
│ 12. Admin Process │ Run admin tasks as one-off processes        │
└─────────────────────────────────────────────────────────────────┘
```

### Cloud Provider Comparison

| Feature            | AWS                              | Azure                   | GCP                            |
| ------------------ | -------------------------------- | ----------------------- | ------------------------------ |
| Compute            | EC2, ECS, EKS, Lambda            | VMs, AKS, Functions     | Compute Engine, GKE, Cloud Run |
| Database           | RDS, DynamoDB                    | SQL Database, Cosmos DB | Cloud SQL, Firestore           |
| Storage            | S3                               | Blob Storage            | Cloud Storage                  |
| Messaging          | SQS, SNS, Kinesis                | Service Bus, Event Hubs | Pub/Sub                        |
| Container Registry | ECR                              | ACR                     | GCR, Artifact Registry         |
| Config             | Parameter Store, Secrets Manager | Key Vault               | Secret Manager                 |

---

## Containerization with Docker

### Optimized Dockerfile for Spring Boot

```dockerfile
# Multi-stage build for optimal image size
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy gradle files first for better caching
COPY gradle gradle
COPY gradlew .
COPY build.gradle settings.gradle ./

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon

# Copy source code
COPY src src

# Build application
RUN ./gradlew bootJar --no-daemon -x test

# Extract layers for better caching
RUN java -Djarmode=layertools -jar build/libs/*.jar extract

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

# Security: Run as non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

WORKDIR /app

# Copy layers in order of change frequency
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Run with optimized JVM settings
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "org.springframework.boot.loader.launch.JarLauncher"]
```

### Maven Dockerfile Alternative

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw package -DskipTests

# Extract layers
RUN java -Djarmode=layertools -jar target/*.jar extract

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

WORKDIR /app
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

### Docker Compose for Local Development

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/appdb
      - SPRING_REDIS_HOST=redis
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--spider",
          "-q",
          "http://localhost:8080/actuator/health",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d appdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis123}
    ports:
      - "6379:6379"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    depends_on:
      - zookeeper
    networks:
      - app-network

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

---

## Kubernetes Deployment

### Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CONTROL PLANE                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │API Server│ │Controller│ │Scheduler │ │  etcd    │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────┐     │
│  │                      WORKER NODES                      │     │
│  │  ┌──────────────────┐    ┌──────────────────┐         │     │
│  │  │     Node 1       │    │     Node 2       │         │     │
│  │  │ ┌────┐ ┌────┐    │    │ ┌────┐ ┌────┐    │         │     │
│  │  │ │Pod │ │Pod │    │    │ │Pod │ │Pod │    │         │     │
│  │  │ └────┘ └────┘    │    │ └────┘ └────┘    │         │     │
│  │  │ kubelet, proxy   │    │ kubelet, proxy   │         │     │
│  │  └──────────────────┘    └──────────────────┘         │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Manifest

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: production
  labels:
    app: order-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      serviceAccountName: order-service
      containers:
        - name: order-service
          image: myregistry/order-service:1.0.0
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              name: http
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "kubernetes,prod"
            - name: JAVA_OPTS
              value: "-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: order-service-config
                  key: db-host
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: order-service-secrets
                  key: db-password
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]
          volumeMounts:
            - name: config-volume
              mountPath: /config
              readOnly: true
      volumes:
        - name: config-volume
          configMap:
            name: order-service-config
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: order-service
                topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: order-service

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: order-service
  namespace: production
  labels:
    app: order-service
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
      name: http
  selector:
    app: order-service

---
# hpa.yaml (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### ConfigMap and Secrets

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-service-config
  namespace: production
data:
  db-host: "postgres.database.svc.cluster.local"
  redis-host: "redis.cache.svc.cluster.local"
  kafka-brokers: "kafka-0.kafka.messaging:9092,kafka-1.kafka.messaging:9092"
  application.yml: |
    spring:
      datasource:
        hikari:
          maximum-pool-size: 10
          minimum-idle: 5
      cache:
        type: redis
        redis:
          time-to-live: 600000
    management:
      endpoints:
        web:
          exposure:
            include: health,info,prometheus,metrics

---
# secret.yaml (use sealed secrets or external secrets in production)
apiVersion: v1
kind: Secret
metadata:
  name: order-service-secrets
  namespace: production
type: Opaque
stringData:
  db-password: ${DB_PASSWORD}
  redis-password: ${REDIS_PASSWORD}
  jwt-secret: ${JWT_SECRET}
```

### Ingress Configuration

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - api.mycompany.com
      secretName: api-tls
  rules:
    - host: api.mycompany.com
      http:
        paths:
          - path: /api/users
            pathType: Prefix
            backend:
              service:
                name: user-service
                port:
                  number: 80
          - path: /api/orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 80
          - path: /api/payments
            pathType: Prefix
            backend:
              service:
                name: payment-service
                port:
                  number: 80
```

---

## AWS Deployment

### AWS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS CLOUD                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Route 53 (DNS)                      │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           CloudFront (CDN) + WAF + Shield               │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Application Load Balancer (ALB)                │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────┐     │
│  │                  EKS / ECS Cluster                     │     │
│  │  ┌──────────────────┐    ┌──────────────────┐         │     │
│  │  │  AZ-1 (us-east)  │    │  AZ-2 (us-east)  │         │     │
│  │  │  ┌────┐ ┌────┐   │    │  ┌────┐ ┌────┐   │         │     │
│  │  │  │Pod │ │Pod │   │    │  │Pod │ │Pod │   │         │     │
│  │  │  └────┘ └────┘   │    │  └────┘ └────┘   │         │     │
│  │  └──────────────────┘    └──────────────────┘         │     │
│  └───────────────────────────────────────────────────────┘     │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────┐     │
│  │               Data Layer                               │     │
│  │  ┌────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  │     │
│  │  │  RDS   │  │ElastiCache│  │   S3   │  │ DynamoDB │  │     │
│  │  │(Multi-AZ│  │ (Redis)  │  │        │  │          │  │     │
│  │  └────────┘  └──────────┘  └────────┘  └──────────┘  │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AWS SDK Integration

```xml
<!-- AWS SDK Dependencies -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>bom</artifactId>
    <version>2.21.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
</dependency>

<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>sqs</artifactId>
</dependency>

<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>secretsmanager</artifactId>
</dependency>
```

### S3 Integration

```java
@Configuration
public class AWSConfig {

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
            .region(Region.US_EAST_1)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
    }

    @Bean
    public SqsAsyncClient sqsClient() {
        return SqsAsyncClient.builder()
            .region(Region.US_EAST_1)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
    }
}

@Service
@RequiredArgsConstructor
@Slf4j
public class S3StorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    public String uploadFile(MultipartFile file, String key) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

            s3Client.putObject(request,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);

        } catch (IOException e) {
            throw new StorageException("Failed to upload file", e);
        }
    }

    public byte[] downloadFile(String key) {
        GetObjectRequest request = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build();

        return s3Client.getObjectAsBytes(request).asByteArray();
    }

    public String getPresignedUrl(String key, Duration expiration) {
        try (S3Presigner presigner = S3Presigner.create()) {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiration)
                .getObjectRequest(getObjectRequest)
                .build();

            return presigner.presignGetObject(presignRequest).url().toString();
        }
    }

    public void deleteFile(String key) {
        DeleteObjectRequest request = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build();

        s3Client.deleteObject(request);
    }
}
```

### SQS Integration

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SQSMessageService {

    private final SqsAsyncClient sqsClient;

    @Value("${aws.sqs.order-queue-url}")
    private String orderQueueUrl;

    public CompletableFuture<String> sendMessage(Object message) {
        try {
            String messageBody = new ObjectMapper().writeValueAsString(message);

            SendMessageRequest request = SendMessageRequest.builder()
                .queueUrl(orderQueueUrl)
                .messageBody(messageBody)
                .messageGroupId("orders")  // For FIFO queues
                .messageDeduplicationId(UUID.randomUUID().toString())
                .build();

            return sqsClient.sendMessage(request)
                .thenApply(SendMessageResponse::messageId);

        } catch (JsonProcessingException e) {
            throw new MessageException("Failed to serialize message", e);
        }
    }

    @Scheduled(fixedDelay = 5000)
    public void pollMessages() {
        ReceiveMessageRequest request = ReceiveMessageRequest.builder()
            .queueUrl(orderQueueUrl)
            .maxNumberOfMessages(10)
            .waitTimeSeconds(20)  // Long polling
            .visibilityTimeout(30)
            .build();

        sqsClient.receiveMessage(request)
            .thenAccept(response -> {
                response.messages().forEach(this::processMessage);
            });
    }

    private void processMessage(Message message) {
        try {
            log.info("Processing message: {}", message.messageId());

            // Process the message
            OrderEvent event = new ObjectMapper()
                .readValue(message.body(), OrderEvent.class);

            // Handle the event
            handleOrderEvent(event);

            // Delete message after successful processing
            deleteMessage(message.receiptHandle());

        } catch (Exception e) {
            log.error("Failed to process message: {}", message.messageId(), e);
            // Message will become visible again after visibility timeout
        }
    }

    private void deleteMessage(String receiptHandle) {
        DeleteMessageRequest request = DeleteMessageRequest.builder()
            .queueUrl(orderQueueUrl)
            .receiptHandle(receiptHandle)
            .build();

        sqsClient.deleteMessage(request);
    }
}
```

### AWS Secrets Manager

```java
@Configuration
public class SecretsManagerConfig {

    @Bean
    public SecretsManagerClient secretsManagerClient() {
        return SecretsManagerClient.builder()
            .region(Region.US_EAST_1)
            .build();
    }
}

@Service
@RequiredArgsConstructor
public class SecretsService {

    private final SecretsManagerClient secretsClient;
    private final Map<String, CachedSecret> cache = new ConcurrentHashMap<>();

    public String getSecret(String secretName) {
        CachedSecret cached = cache.get(secretName);

        if (cached != null && !cached.isExpired()) {
            return cached.getValue();
        }

        GetSecretValueRequest request = GetSecretValueRequest.builder()
            .secretId(secretName)
            .build();

        GetSecretValueResponse response = secretsClient.getSecretValue(request);
        String secretValue = response.secretString();

        cache.put(secretName, new CachedSecret(secretValue, Duration.ofMinutes(5)));

        return secretValue;
    }

    public <T> T getSecretAs(String secretName, Class<T> type) {
        String secretJson = getSecret(secretName);
        try {
            return new ObjectMapper().readValue(secretJson, type);
        } catch (JsonProcessingException e) {
            throw new SecretRetrievalException("Failed to parse secret", e);
        }
    }

    @Data
    @AllArgsConstructor
    private static class CachedSecret {
        private String value;
        private Instant expiresAt;

        public CachedSecret(String value, Duration ttl) {
            this.value = value;
            this.expiresAt = Instant.now().plus(ttl);
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}

// Database password from Secrets Manager
@Configuration
public class DataSourceConfig {

    @Autowired
    private SecretsService secretsService;

    @Bean
    @Primary
    public DataSource dataSource() {
        DatabaseCredentials creds = secretsService
            .getSecretAs("prod/database/credentials", DatabaseCredentials.class);

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(creds.getHost());
        dataSource.setUsername(creds.getUsername());
        dataSource.setPassword(creds.getPassword());

        return dataSource;
    }

    @Data
    public static class DatabaseCredentials {
        private String host;
        private String username;
        private String password;
    }
}
```

### EKS Deployment with eksctl

```yaml
# cluster.yaml for eksctl
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: production-cluster
  region: us-east-1
  version: "1.28"

vpc:
  cidr: 10.0.0.0/16
  nat:
    gateway: HighlyAvailable

iam:
  withOIDC: true
  serviceAccounts:
    - metadata:
        name: aws-load-balancer-controller
        namespace: kube-system
      wellKnownPolicies:
        awsLoadBalancerController: true

managedNodeGroups:
  - name: app-nodes
    instanceType: m5.large
    desiredCapacity: 3
    minSize: 2
    maxSize: 10
    volumeSize: 100
    volumeType: gp3
    privateNetworking: true
    labels:
      role: app
    tags:
      Environment: production
    iam:
      withAddonPolicies:
        ebs: true
        cloudWatch: true

  - name: system-nodes
    instanceType: t3.medium
    desiredCapacity: 2
    volumeSize: 50
    labels:
      role: system
    taints:
      - key: system
        value: "true"
        effect: NoSchedule

addons:
  - name: vpc-cni
    version: latest
  - name: coredns
    version: latest
  - name: kube-proxy
    version: latest
  - name: aws-ebs-csi-driver
    version: latest

cloudWatch:
  clusterLogging:
    enableTypes:
      - api
      - audit
      - authenticator
      - controllerManager
      - scheduler
```

---

## Azure Deployment

### Azure Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AZURE CLOUD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Azure Front Door + WAF                        │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Application Gateway                           │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────┐     │
│  │                  AKS Cluster                           │     │
│  │  ┌──────────────────┐    ┌──────────────────┐         │     │
│  │  │   Node Pool 1    │    │   Node Pool 2    │         │     │
│  │  │  (System Nodes)  │    │   (App Nodes)    │         │     │
│  │  └──────────────────┘    └──────────────────┘         │     │
│  └───────────────────────────────────────────────────────┘     │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────┐     │
│  │              Managed Services                          │     │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────┐  │     │
│  │  │ Azure SQL│  │  Redis   │  │ Blob   │  │Key Vault│  │     │
│  │  │ Database │  │  Cache   │  │Storage │  │         │  │     │
│  │  └──────────┘  └──────────┘  └────────┘  └────────┘  │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Azure SDK Integration

```xml
<dependency>
    <groupId>com.azure.spring</groupId>
    <artifactId>spring-cloud-azure-starter-keyvault-secrets</artifactId>
</dependency>

<dependency>
    <groupId>com.azure.spring</groupId>
    <artifactId>spring-cloud-azure-starter-storage-blob</artifactId>
</dependency>

<dependency>
    <groupId>com.azure.spring</groupId>
    <artifactId>spring-cloud-azure-starter-servicebus</artifactId>
</dependency>
```

```yaml
# application.yml for Azure
spring:
  cloud:
    azure:
      keyvault:
        secret:
          property-sources:
            - name: key-vault
              endpoint: https://mykeyvault.vault.azure.net/
      storage:
        blob:
          account-name: ${AZURE_STORAGE_ACCOUNT}
          account-key: ${AZURE_STORAGE_KEY}
          container-name: documents
      servicebus:
        connection-string: ${AZURE_SERVICEBUS_CONNECTION_STRING}
        entity-type: queue
```

### Azure Blob Storage Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AzureBlobStorageService {

    private final BlobServiceClient blobServiceClient;

    @Value("${spring.cloud.azure.storage.blob.container-name}")
    private String containerName;

    public String uploadFile(MultipartFile file, String blobName) {
        try {
            BlobContainerClient containerClient = blobServiceClient
                .getBlobContainerClient(containerName);

            BlobClient blobClient = containerClient.getBlobClient(blobName);

            blobClient.upload(file.getInputStream(), file.getSize(), true);

            return blobClient.getBlobUrl();

        } catch (IOException e) {
            throw new StorageException("Failed to upload to Azure Blob", e);
        }
    }

    public byte[] downloadFile(String blobName) {
        BlobClient blobClient = blobServiceClient
            .getBlobContainerClient(containerName)
            .getBlobClient(blobName);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.downloadStream(outputStream);

        return outputStream.toByteArray();
    }

    public String generateSasUrl(String blobName, Duration expiration) {
        BlobClient blobClient = blobServiceClient
            .getBlobContainerClient(containerName)
            .getBlobClient(blobName);

        OffsetDateTime expiryTime = OffsetDateTime.now().plus(expiration);

        BlobSasPermission permission = new BlobSasPermission()
            .setReadPermission(true);

        BlobServiceSasSignatureValues sasValues = new BlobServiceSasSignatureValues(
            expiryTime, permission);

        return blobClient.getBlobUrl() + "?" + blobClient.generateSas(sasValues);
    }
}
```

### Azure Key Vault Configuration

```java
@Configuration
public class AzureKeyVaultConfig {

    // Key Vault values are automatically injected when using spring-cloud-azure
    @Value("${database-password}")  // From Key Vault
    private String databasePassword;

    @Value("${jwt-secret}")  // From Key Vault
    private String jwtSecret;

    @Bean
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String url,
            @Value("${spring.datasource.username}") String username) {

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(databasePassword);

        return dataSource;
    }
}
```

### AKS Deployment with Terraform

```hcl
# main.tf
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "rg-production"
  location = "East US"
}

resource "azurerm_kubernetes_cluster" "main" {
  name                = "aks-production"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "production"

  default_node_pool {
    name                = "system"
    node_count          = 2
    vm_size             = "Standard_D2s_v3"
    enable_auto_scaling = true
    min_count           = 2
    max_count           = 5
    vnet_subnet_id      = azurerm_subnet.aks.id
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  tags = {
    Environment = "Production"
  }
}

resource "azurerm_kubernetes_cluster_node_pool" "app" {
  name                  = "app"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D4s_v3"
  enable_auto_scaling   = true
  min_count             = 3
  max_count             = 10
  vnet_subnet_id        = azurerm_subnet.aks.id

  node_labels = {
    "role" = "app"
  }
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-production"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  administrator_login    = "psqladmin"
  administrator_password = var.db_password
  zone                   = "1"
  storage_mb             = 32768
  sku_name               = "GP_Standard_D2s_v3"

  high_availability {
    mode = "ZoneRedundant"
  }
}

resource "azurerm_key_vault" "main" {
  name                = "kv-production"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id

    secret_permissions = [
      "Get",
      "List"
    ]
  }
}
```

---

## GCP Deployment

### GCP Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GOOGLE CLOUD PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Cloud CDN + Cloud Armor                     │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Global HTTP(S) Load Balancer                │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────┐     │
│  │                    GKE Autopilot                       │     │
│  │  ┌──────────────────┐    ┌──────────────────┐         │     │
│  │  │   Zone A         │    │   Zone B         │         │     │
│  │  │  ┌────┐ ┌────┐   │    │  ┌────┐ ┌────┐   │         │     │
│  │  │  │Pod │ │Pod │   │    │  │Pod │ │Pod │   │         │     │
│  │  │  └────┘ └────┘   │    │  └────┘ └────┘   │         │     │
│  │  └──────────────────┘    └──────────────────┘         │     │
│  └───────────────────────────────────────────────────────┘     │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────┐     │
│  │              Managed Services                          │     │
│  │  ┌────────┐  ┌─────────┐  ┌───────┐  ┌────────────┐  │     │
│  │  │Cloud SQL│  │MemoryStore│  │ GCS  │  │Secret Mgr │  │     │
│  │  │(Postgres)│ │ (Redis) │  │      │  │            │  │     │
│  │  └────────┘  └─────────┘  └───────┘  └────────────┘  │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### GCP SDK Integration

```xml
<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter</artifactId>
</dependency>

<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-storage</artifactId>
</dependency>

<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-pubsub</artifactId>
</dependency>

<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-secretmanager</artifactId>
</dependency>
```

```yaml
# application.yml for GCP
spring:
  cloud:
    gcp:
      project-id: ${GCP_PROJECT_ID}
      credentials:
        location: classpath:service-account.json
      storage:
        bucket: ${GCS_BUCKET_NAME}
      secretmanager:
        enabled: true

# Reference secrets with sm:// prefix
database:
  password: ${sm://database-password}
jwt:
  secret: ${sm://jwt-secret}
```

### Cloud Storage Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudStorageService {

    private final Storage storage;

    @Value("${spring.cloud.gcp.storage.bucket}")
    private String bucketName;

    public String uploadFile(MultipartFile file, String objectName) {
        try {
            BlobId blobId = BlobId.of(bucketName, objectName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

            storage.create(blobInfo, file.getBytes());

            return String.format("gs://%s/%s", bucketName, objectName);

        } catch (IOException e) {
            throw new StorageException("Failed to upload to GCS", e);
        }
    }

    public byte[] downloadFile(String objectName) {
        Blob blob = storage.get(BlobId.of(bucketName, objectName));
        return blob.getContent();
    }

    public String getSignedUrl(String objectName, Duration expiration) {
        BlobInfo blobInfo = BlobInfo.newBuilder(
            BlobId.of(bucketName, objectName)).build();

        URL signedUrl = storage.signUrl(
            blobInfo,
            expiration.toMinutes(),
            TimeUnit.MINUTES,
            Storage.SignUrlOption.withV4Signature()
        );

        return signedUrl.toString();
    }
}
```

### Pub/Sub Integration

```java
@Configuration
public class PubSubConfig {

    @Bean
    public MessageChannel orderInputChannel() {
        return new PublishSubscribeChannel();
    }

    @Bean
    public MessageChannel orderOutputChannel() {
        return new DirectChannel();
    }
}

@Service
@RequiredArgsConstructor
@Slf4j
public class PubSubService {

    private final PubSubTemplate pubSubTemplate;

    @Value("${gcp.pubsub.order-topic}")
    private String orderTopic;

    public CompletableFuture<String> publishOrder(OrderEvent event) {
        try {
            String message = new ObjectMapper().writeValueAsString(event);

            return pubSubTemplate.publish(orderTopic, message)
                .completable()
                .thenApply(id -> {
                    log.info("Published message to {}: {}", orderTopic, id);
                    return id;
                });

        } catch (JsonProcessingException e) {
            throw new MessagingException("Failed to serialize order event", e);
        }
    }
}

// Message handler
@Component
@Slf4j
public class OrderSubscriber {

    @Bean
    public Consumer<Message<String>> orderMessageConsumer() {
        return message -> {
            log.info("Received order message: {}", message.getPayload());

            try {
                OrderEvent event = new ObjectMapper()
                    .readValue(message.getPayload(), OrderEvent.class);
                processOrder(event);

            } catch (Exception e) {
                log.error("Failed to process order message", e);
                throw new RuntimeException(e);
            }
        };
    }

    private void processOrder(OrderEvent event) {
        // Process the order
    }
}
```

### Cloud Run Deployment

```yaml
# cloudbuild.yaml for Cloud Run
steps:
  # Build the container
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "build"
      - "-t"
      - "gcr.io/$PROJECT_ID/order-service:$COMMIT_SHA"
      - "."

  # Push to Container Registry
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "push"
      - "gcr.io/$PROJECT_ID/order-service:$COMMIT_SHA"

  # Deploy to Cloud Run
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: gcloud
    args:
      - "run"
      - "deploy"
      - "order-service"
      - "--image=gcr.io/$PROJECT_ID/order-service:$COMMIT_SHA"
      - "--region=us-central1"
      - "--platform=managed"
      - "--allow-unauthenticated"
      - "--memory=1Gi"
      - "--cpu=1"
      - "--min-instances=1"
      - "--max-instances=10"
      - "--concurrency=80"
      - "--set-env-vars=SPRING_PROFILES_ACTIVE=gcp"
      - "--set-secrets=DB_PASSWORD=database-password:latest"
      - "--vpc-connector=vpc-connector"

images:
  - "gcr.io/$PROJECT_ID/order-service:$COMMIT_SHA"
```

---

## CI/CD Pipelines

### GitHub Actions Pipeline

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
          cache: "gradle"

      - name: Run tests
        run: ./gradlew test

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: build/reports/tests/

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/setup-kubectl@v3

      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/order-service \
            order-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n staging
          kubectl rollout status deployment/order-service -n staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/setup-kubectl@v3

      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to production
        run: |
          kubectl set image deployment/order-service \
            order-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n production
          kubectl rollout status deployment/order-service -n production
```

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  GRADLE_OPTS: "-Dorg.gradle.daemon=false"
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  image: eclipse-temurin:21-jdk
  script:
    - ./gradlew test
  artifacts:
    when: always
    reports:
      junit: build/test-results/test/*.xml

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - main

deploy-staging:
  stage: deploy-staging
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/order-service order-service=$DOCKER_IMAGE -n staging
    - kubectl rollout status deployment/order-service -n staging
  environment:
    name: staging
  only:
    - main

deploy-production:
  stage: deploy-production
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context production
    - kubectl set image deployment/order-service order-service=$DOCKER_IMAGE -n production
    - kubectl rollout status deployment/order-service -n production
  environment:
    name: production
  when: manual
  only:
    - main
```

---

## Infrastructure as Code

### Terraform Multi-Cloud Structure

```
infrastructure/
├── modules/
│   ├── kubernetes/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   │   ├── main.tf
│   │   └── variables.tf
│   └── storage/
│       ├── main.tf
│       └── variables.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
└── providers/
    ├── aws/
    ├── azure/
    └── gcp/
```

### Terraform Kubernetes Module

```hcl
# modules/kubernetes/main.tf
variable "cloud_provider" {
  type = string
  validation {
    condition     = contains(["aws", "azure", "gcp"], var.cloud_provider)
    error_message = "Cloud provider must be aws, azure, or gcp."
  }
}

variable "cluster_name" {
  type = string
}

variable "node_count" {
  type    = number
  default = 3
}

variable "node_size" {
  type = string
}

# AWS EKS
resource "aws_eks_cluster" "main" {
  count = var.cloud_provider == "aws" ? 1 : 0
  name  = var.cluster_name
  # ... EKS configuration
}

# Azure AKS
resource "azurerm_kubernetes_cluster" "main" {
  count = var.cloud_provider == "azure" ? 1 : 0
  name  = var.cluster_name
  # ... AKS configuration
}

# GCP GKE
resource "google_container_cluster" "main" {
  count = var.cloud_provider == "gcp" ? 1 : 0
  name  = var.cluster_name
  # ... GKE configuration
}

output "kubeconfig" {
  value = var.cloud_provider == "aws" ? aws_eks_cluster.main[0].kubeconfig : (
    var.cloud_provider == "azure" ? azurerm_kubernetes_cluster.main[0].kube_config_raw : (
      google_container_cluster.main[0].master_auth
    )
  )
  sensitive = true
}
```

---

## Secrets Management

### External Secrets Operator

```yaml
# external-secret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
    - secretKey: db-password
      remoteRef:
        key: prod/database/password
    - secretKey: jwt-secret
      remoteRef:
        key: prod/jwt/secret

---
# ClusterSecretStore for AWS
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets

---
# ClusterSecretStore for Azure Key Vault
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: azure-key-vault
spec:
  provider:
    azurekv:
      vaultUrl: "https://mykeyvault.vault.azure.net"
      authType: ManagedIdentity
```

---

## Monitoring and Logging

### Prometheus + Grafana Stack

```yaml
# prometheus-values.yaml for Helm
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi

    serviceMonitorSelector:
      matchLabels:
        prometheus: main

grafana:
  adminPassword: ${GRAFANA_ADMIN_PASSWORD}
  persistence:
    enabled: true
    size: 10Gi

  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
        - name: "spring-boot"
          folder: "Spring Boot"
          type: file
          options:
            path: /var/lib/grafana/dashboards/spring-boot

alertmanager:
  config:
    route:
      receiver: "slack"
      routes:
        - match:
            severity: critical
          receiver: "pagerduty"
    receivers:
      - name: "slack"
        slack_configs:
          - channel: "#alerts"
            send_resolved: true
      - name: "pagerduty"
        pagerduty_configs:
          - service_key: ${PAGERDUTY_KEY}
```

### Application Logging Configuration

```yaml
# application.yml - Cloud-native logging
spring:
  application:
    name: order-service

logging:
  pattern:
    console: '{"timestamp":"%d{yyyy-MM-dd HH:mm:ss.SSS}","level":"%p","service":"${spring.application.name}","trace":"%X{traceId:-}","span":"%X{spanId:-}","class":"%logger{36}","message":"%m"}%n'
  level:
    root: INFO
    com.example: DEBUG
    org.springframework.web: INFO

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  metrics:
    tags:
      application: ${spring.application.name}
      environment: ${ENVIRONMENT:local}
    export:
      prometheus:
        enabled: true
```

---

## Cost Optimization

### Best Practices

```
┌─────────────────────────────────────────────────────────────────┐
│                   COST OPTIMIZATION STRATEGIES                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COMPUTE                                                        │
│  ✅ Right-size instances based on actual usage                  │
│  ✅ Use Spot/Preemptible instances for non-critical workloads   │
│  ✅ Implement auto-scaling with proper thresholds               │
│  ✅ Schedule non-prod environments to shut down                 │
│                                                                  │
│  STORAGE                                                        │
│  ✅ Use appropriate storage tiers (hot/cold/archive)            │
│  ✅ Implement lifecycle policies for old data                   │
│  ✅ Compress data before storing                                │
│                                                                  │
│  DATABASE                                                       │
│  ✅ Use reserved instances for production                       │
│  ✅ Implement read replicas for read-heavy workloads            │
│  ✅ Use serverless options for variable workloads               │
│                                                                  │
│  NETWORK                                                        │
│  ✅ Use CDN for static content                                  │
│  ✅ Minimize cross-region data transfer                         │
│  ✅ Use private endpoints where possible                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Kubernetes Cost Optimization

```yaml
# Resource quotas
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "200Gi"
    limits.cpu: "200"
    limits.memory: "400Gi"
    persistentvolumeclaims: "20"

---
# Limit ranges
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
    - default:
        memory: "512Mi"
        cpu: "500m"
      defaultRequest:
        memory: "256Mi"
        cpu: "100m"
      type: Container

---
# Vertical Pod Autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: order-service-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: order-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
      - containerName: order-service
        minAllowed:
          cpu: 100m
          memory: 256Mi
        maxAllowed:
          cpu: 2
          memory: 4Gi
```

---

## Interview Questions

### Basic

**Q1: What is the difference between IaaS, PaaS, and SaaS?**

```
IaaS (Infrastructure as a Service):
- Raw infrastructure: VMs, storage, networking
- You manage: OS, runtime, applications
- Examples: EC2, Azure VMs, Compute Engine

PaaS (Platform as a Service):
- Managed platform for applications
- You manage: Application code
- Examples: Heroku, Cloud Run, App Service

SaaS (Software as a Service):
- Complete application
- You manage: Configuration, users
- Examples: Salesforce, Gmail, Slack
```

**Q2: What are the benefits of using containers?**

```
Benefits:
- Consistency across environments
- Faster deployments
- Better resource utilization
- Easy scaling
- Isolation between applications
- Version control of infrastructure
```

**Q3: Explain the difference between EKS, AKS, and GKE**

```
EKS (Elastic Kubernetes Service - AWS):
- AWS managed Kubernetes
- Deep AWS service integration
- Pay for control plane + nodes

AKS (Azure Kubernetes Service):
- Azure managed Kubernetes
- Free control plane
- Azure AD integration

GKE (Google Kubernetes Engine):
- Google managed Kubernetes
- Autopilot mode available
- Best native Kubernetes experience
```

### Advanced

**Q4: How do you handle secrets in cloud deployments?**

```
Best practices:
1. Never store secrets in code or config files
2. Use cloud secret managers:
   - AWS Secrets Manager / Parameter Store
   - Azure Key Vault
   - GCP Secret Manager
3. Use Kubernetes External Secrets Operator
4. Rotate secrets regularly
5. Use IAM roles for service-to-service auth
6. Encrypt secrets at rest and in transit
```

**Q5: Explain blue-green vs canary deployments**

```
Blue-Green:
- Two identical environments
- Switch traffic instantly
- Easy rollback
- Needs 2x resources

Canary:
- Gradual traffic shift
- Test with real traffic
- Metrics-based progression
- More complex but lower risk

Use blue-green for:
- Database schema changes
- Breaking changes

Use canary for:
- Feature releases
- Performance testing
```

**Q6: How do you ensure high availability in cloud?**

```
Strategies:
1. Multi-AZ deployment
2. Load balancing
3. Auto-scaling
4. Health checks
5. Database replication
6. CDN for static content
7. Chaos engineering
8. Regular backups
9. Disaster recovery plan
10. Monitoring and alerting
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUD DEPLOYMENT CHEAT SHEET                     │
├─────────────────────────────────────────────────────────────────────┤
│ DOCKER COMMANDS                                                     │
│  docker build -t app .           │ Build image                      │
│  docker run -p 8080:8080 app     │ Run container                    │
│  docker push registry/app        │ Push to registry                 │
│  docker-compose up -d            │ Start services                   │
├─────────────────────────────────────────────────────────────────────┤
│ KUBECTL COMMANDS                                                    │
│  kubectl apply -f manifest.yaml  │ Apply configuration              │
│  kubectl get pods -n namespace   │ List pods                        │
│  kubectl logs pod-name           │ View logs                        │
│  kubectl describe pod name       │ Pod details                      │
│  kubectl rollout restart deploy  │ Restart deployment               │
│  kubectl scale deploy --replicas │ Scale deployment                 │
├─────────────────────────────────────────────────────────────────────┤
│ CLOUD CLI COMMANDS                                                  │
│  AWS                                                                │
│  aws eks update-kubeconfig       │ Configure kubectl                │
│  aws ecr get-login-password      │ Docker login to ECR              │
│                                                                     │
│  AZURE                                                              │
│  az aks get-credentials          │ Configure kubectl                │
│  az acr login                    │ Docker login to ACR              │
│                                                                     │
│  GCP                                                                │
│  gcloud container clusters get-credentials│ Configure kubectl       │
│  gcloud auth configure-docker    │ Docker login to GCR              │
├─────────────────────────────────────────────────────────────────────┤
│ TERRAFORM COMMANDS                                                  │
│  terraform init                  │ Initialize                       │
│  terraform plan                  │ Preview changes                  │
│  terraform apply                 │ Apply changes                    │
│  terraform destroy               │ Destroy resources                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

Cloud deployment requires understanding:

1. **Containerization** - Docker for packaging applications
2. **Orchestration** - Kubernetes for managing containers
3. **Cloud Services** - AWS/Azure/GCP specific services
4. **CI/CD** - Automated build and deployment pipelines
5. **IaC** - Terraform for infrastructure management
6. **Observability** - Monitoring, logging, tracing
7. **Security** - Secrets management, IAM

> **Remember**: "Cloud is not a destination, it's a journey of continuous improvement and optimization"

---

_This completes the Spring Boot Cloud Deployment guide - you're now ready to deploy anywhere!_
