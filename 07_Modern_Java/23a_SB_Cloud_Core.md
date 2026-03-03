> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](23b_SB_Cloud_Advanced.md)

---

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

| Feature | AWS | Azure | GCP |
|---------|-----|-------|-----|
| Compute | EC2, ECS, EKS, Lambda | VMs, AKS, Functions | Compute Engine, GKE, Cloud Run |
| Database | RDS, DynamoDB | SQL Database, Cosmos DB | Cloud SQL, Firestore |
| Storage | S3 | Blob Storage | Cloud Storage |
| Messaging | SQS, SNS, Kinesis | Service Bus, Event Hubs | Pub/Sub |
| Container Registry | ECR | ACR | GCR, Artifact Registry |
| Config | Parameter Store, Secrets Manager | Key Vault | Secret Manager |

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
version: '3.8'

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
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/actuator/health"]
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
