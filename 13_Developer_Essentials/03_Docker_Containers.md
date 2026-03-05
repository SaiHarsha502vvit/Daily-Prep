# 🐳 Docker & Containers — Complete Guide

> **Navigation**: [< Linux CLI](02_Linux_CLI_Shell.md) | [Index](00_INDEX.md) | [Next: CI/CD >](04_CICD_Pipelines.md)

---

# WHY: Why Containers Exist

## The Problem

```
Developer: "It works on MY machine!"
Ops Team:  "Well, it DOESN'T work on the server."

WHY? Because your machine has:
  - Java 17, but server has Java 11
  - MySQL 8.0, but server has 5.7
  - Ubuntu 22, but server has CentOS 7
  - 50 environment variables you forgot to document
  
The SAME code behaves differently in different environments.
This is the #1 cause of deployment failures in the industry.
```

## The Solution: Containers

```
Container = Your application + ALL its dependencies
            packaged into ONE portable unit

┌──────────────────────────────┐
│         Container            │
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Your │ │ Java │ │MySQL │  │
│  │ App  │ │  17  │ │ 8.0  │  │
│  └──────┘ └──────┘ └──────┘  │
│  ┌──────────────────────────┐│
│  │    Ubuntu 22.04 (base)   ││
│  └──────────────────────────┘│
└──────────────────────────────┘

This container runs IDENTICALLY on:
  ✅ Your laptop
  ✅ Your colleague's Mac
  ✅ Testing server
  ✅ Production AWS EC2
  ✅ Kubernetes cluster
```

## Container vs Virtual Machine

```
┌─── VM ────────────────────┐    ┌─── Container ─────────────┐
│ App A    App B    App C   │    │ App A    App B    App C   │
│ Bins/Libs Bins/Libs B/L   │    │ Bins/Libs Bins/Libs B/L   │
│ Guest OS  Guest OS  G.OS  │    │                           │
│ (Ubuntu)  (CentOS) (Deb)  │    │      Docker Engine        │
│                           │    │                           │
│      Hypervisor           │    │      Host OS (Linux)      │
│      Host OS              │    │      Hardware             │
│      Hardware             │    └────────────────────────────┘
└────────────────────────────────────────────────────────────┘
                                  
VM:        Heavy (GB), 30s startup, full OS per app
Container: Light (MB), 1s startup, shared OS kernel

Analogy:
  VM = Separate HOUSES (each has foundation, walls, roof)
  Container = APARTMENTS (shared building, private units)
```

## WHO: Origin

```
2013: Solomon Hykes at dotCloud
      Built Docker as internal tool
      Open-sourced it → Revolutionized deployment

Based on: Linux cgroups + namespaces (existed since 2008)
Docker's genius = Made containers EASY to use
```

---

# WHAT: Core Concepts

## Images vs Containers

```
IMAGE = Blueprint/Template (read-only)
  - Like a Java CLASS
  - Defines what the container will contain
  - Stored in registries (Docker Hub)

CONTAINER = Running instance of an image
  - Like a Java OBJECT
  - Created from an image
  - Has its own state, network, filesystem

One image → Many containers:
  Image: my-spring-app:1.0
    → Container 1 (port 8080)
    → Container 2 (port 8081)
    → Container 3 (port 8082)
```

## Layers (How Images are Efficient)

```
Dockerfile:                    Image Layers:
FROM ubuntu:22.04      →  ┌─────────────────┐ Layer 1: Ubuntu (shared!)
RUN apt install java   →  ├─────────────────┤ Layer 2: Java
COPY app.jar /app/     →  ├─────────────────┤ Layer 3: Your JAR
CMD ["java","-jar"]    →  └─────────────────┘

Key insight: Layers are CACHED and SHARED
  - 10 apps using Java 17? → Java layer downloaded ONCE
  - Change only your code? → Only Layer 3 rebuilds
```

---

# HOW: Docker in Practice

## Installation

```bash
# Windows: Install Docker Desktop
# Mac: Install Docker Desktop
# Linux:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## Level 1: Running Containers (Day 1)

```bash
# Run your first container
docker run hello-world

# Run interactive Ubuntu
docker run -it ubuntu bash
# You're now INSIDE an Ubuntu container!
# Try: ls, cat /etc/os-release, exit

# Run Nginx web server
docker run -d -p 8080:80 nginx
# -d = detached (background)
# -p 8080:80 = map host port 8080 → container port 80
# Visit http://localhost:8080 → you'll see Nginx!

# Run MySQL
docker run -d \
  --name my-mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -p 3306:3306 \
  mysql:8.0

# Container management
docker ps                  # List RUNNING containers
docker ps -a               # List ALL containers (including stopped)
docker stop <name/id>      # Stop container
docker rm <name/id>        # Remove container
docker logs <name/id>      # View container logs
docker logs -f <name/id>   # Follow logs (real-time)
docker exec -it <name> bash  # Get shell INSIDE running container
```

## Level 2: Building Your Own Image (Week 1)

### Dockerfile for Spring Boot Application

```dockerfile
# === Dockerfile ===

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:resolve         # Cache dependencies
COPY src/ ./src/
RUN mvn package -DskipTests

# Stage 2: Run (smaller image)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Non-root user (security best practice)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Building and Running

```bash
# Build the image
docker build -t my-spring-app:1.0 .

# Run it
docker run -d -p 8080:8080 --name myapp my-spring-app:1.0

# Test it
curl http://localhost:8080/api/health
```

### Dockerfile Best Practices

```dockerfile
# BAD: Everything in one layer
FROM ubuntu
RUN apt update && apt install java && apt install maven
COPY . /app
RUN mvn package

# GOOD: Optimized layers, multi-stage, minimal base
FROM eclipse-temurin:17-jre-alpine   # Small base (200MB vs 1GB)
COPY --from=build app.jar /app/      # Only the artifact

# GOOD: .dockerignore (like .gitignore)
# .dockerignore:
.git
target
*.md
.idea
```

## Level 3: Docker Compose (Week 2)

### WHY Compose?

```
Typical app needs:
  - Spring Boot API (port 8080)
  - PostgreSQL database (port 5432)
  - Redis cache (port 6379)
  - Nginx reverse proxy (port 80)

Without Compose: 4 separate docker run commands with 20+ flags
With Compose: ONE yaml file, ONE command
```

### docker-compose.yml Example

```yaml
version: '3.8'

services:
  # Spring Boot Application
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/myapp
      - SPRING_DATASOURCE_USERNAME=admin
      - SPRING_DATASOURCE_PASSWORD=secret
      - SPRING_REDIS_HOST=cache
    depends_on:
      - db
      - cache
    restart: unless-stopped

  # PostgreSQL Database
  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data    # Persistent storage!

  # Redis Cache
  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

volumes:
  pgdata:    # Named volume for database persistence
```

### Compose Commands

```bash
docker-compose up -d              # Start everything
docker-compose down               # Stop everything
docker-compose logs -f app        # Follow app logs
docker-compose ps                 # Status of all services
docker-compose exec app bash      # Shell into app container
docker-compose build              # Rebuild images
docker-compose up -d --build      # Rebuild and restart
```

## Level 4: Volumes & Networking (Month 1)

### Volumes (Persistent Data)

```bash
# Problem: Container dies → ALL data inside dies too
# Solution: Volumes mount external storage into containers

# Named volume (Docker manages location)
docker run -v mydata:/var/lib/mysql mysql:8

# Bind mount (your specific folder)
docker run -v $(pwd)/config:/app/config my-app

# In docker-compose:
volumes:
  - pgdata:/var/lib/postgresql/data     # Named volume
  - ./config:/app/config                # Bind mount
  - ./logs:/app/logs                    # Logs accessible from host
```

### Networking

```
Docker creates internal networks:
  app ←──────→ db       ← communicate by SERVICE NAME
  app ←──────→ cache    ← no need for IP addresses!
  
  nginx ←────→ internet ← only nginx exposed to outside

This is WHY your Spring Boot connects to "db:5432"
instead of "localhost:5432" inside Docker
```

---

# WHERE: Real-World Docker Usage

## Local Development Environment

```yaml
# docker-compose.dev.yml
# New developer joins → runs ONE command → entire stack works

services:
  app:
    build: .
    volumes:
      - ./src:/app/src      # Hot reload! Edit code → changes instantly
    ports:
      - "8080:8080"
      - "5005:5005"         # Debug port
    environment:
      - SPRING_PROFILES_ACTIVE=dev
```

## Production Deployment

```bash
# Build → Tag → Push → Pull → Run

# On CI/CD server:
docker build -t mycompany/myapp:v2.1.0 .
docker push mycompany/myapp:v2.1.0

# On production server:
docker pull mycompany/myapp:v2.1.0
docker run -d --name myapp mycompany/myapp:v2.1.0
```

---

# WHEN: Decision Guide

```
USE Docker when:
  ✅ Multiple services need to work together
  ✅ "Works on my machine" problems
  ✅ Need consistent dev/test/prod environments
  ✅ Microservices architecture
  ✅ Deploying to cloud

DON'T use Docker when:
  ❌ Simple single-file scripts
  ❌ Learning basic programming (unnecessary complexity)
  ❌ Performance-critical apps needing bare-metal speed
```

---

# 🧭 Docker Cheat Sheet

```
IMAGES:      build | pull | push | images | rmi
CONTAINERS:  run | start | stop | rm | ps | logs | exec
COMPOSE:     up | down | logs | ps | build | exec
VOLUMES:     volume create | volume ls | volume rm
NETWORK:     network create | network ls | network inspect
CLEANUP:     system prune | image prune | container prune
```

---

# 🏋️ Practice Exercises

## Exercise 1: Run & Explore
```
1. Run an nginx container with port mapping
2. Run a MySQL container with environment variables
3. Use docker exec to get inside the MySQL container
4. Run a SQL query from inside the container
```

## Exercise 2: Build Custom Image
```
1. Create a simple Spring Boot app (or any Java app)
2. Write a Dockerfile with multi-stage build
3. Build and run it
4. Push to Docker Hub
```

## Exercise 3: Compose Full Stack
```
1. Create docker-compose.yml with:
   - Spring Boot app
   - PostgreSQL 
   - Adminer (DB web UI)
2. Connect app to PostgreSQL
3. Verify data persistence after container restart
```

---

> **Next Chapter**: [CI/CD Pipelines →](04_CICD_Pipelines.md)
