---
title: Docker Complete Guide
description: Master Docker containerization for consistent application deployment
track: devops
section: containers
difficulty: beginner
tags:
  - Docker
  - Containers
  - DevOps
  - Deployment
status: imported
origin: old/src/content/docs/devops/docker-guide.en.md
divergence: 0.211
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: Containers
  order: 1
  lastUpdated: 2026-01-07
---

Docker has revolutionized the way we build, ship, and run applications. As the cornerstone of modern cloud-native development, Docker provides a consistent environment from development to production, eliminating the infamous "it works on my machine" problem. This comprehensive guide covers everything from fundamental concepts to advanced techniques, preparing you for both real-world projects and technical interviews.

## Docker Fundamentals

### What is Docker?

Docker is an open-source platform that automates the deployment of applications inside lightweight, portable containers. Unlike traditional virtualization, Docker containers share the host operating system's kernel, making them significantly more efficient in terms of system resources.

### Containers vs Virtual Machines

Understanding the difference between containers and virtual machines (VMs) is fundamental to grasping Docker's value proposition.

**Virtual Machine Architecture:**

Virtual machines run on a hypervisor that simulates complete hardware. Each VM includes:
- A full guest operating system
- Virtualized hardware resources (CPU, memory, storage, network)
- Application binaries and dependencies

```
+------------------------------------------+
|              Application                  |
+------------------------------------------+
|              Guest OS                     |
+------------------------------------------+
|              Hypervisor                   |
+------------------------------------------+
|              Host OS                      |
+------------------------------------------+
|              Hardware                     |
+------------------------------------------+
```

**Container Architecture:**

Containers leverage Linux kernel features like **Namespaces** and **Cgroups** for process isolation:
- **Namespaces**: Provide isolation for processes, network, filesystem, and other resources
- **Cgroups**: Control and limit resource usage (CPU, memory, I/O)

```
+----------+ +----------+ +----------+
|  App A   | |  App B   | |  App C   |
+----------+ +----------+ +----------+
| Libs/Deps| |Libs/Deps | |Libs/Deps |
+----------+-+----------+-+----------+
+------------------------------------------+
|            Docker Engine                  |
+------------------------------------------+
|              Host OS                      |
+------------------------------------------+
|              Hardware                     |
+------------------------------------------+
```

### Key Differences Comparison

| Feature | Virtual Machine | Container |
|---------|----------------|-----------|
| Startup Time | Minutes | Seconds |
| Resource Usage | GBs | MBs |
| Isolation Level | Full isolation | Process-level |
| Performance Overhead | 5-15% | Near-native |
| Image Size | Several GBs | Tens to hundreds of MBs |
| Density | Dozens per host | Hundreds to thousands |

### Why Use Docker?

1. **Consistency**: Same environment from development to production
2. **Isolation**: Applications run independently without conflicts
3. **Portability**: Run anywhere Docker is installed
4. **Efficiency**: Lightweight compared to VMs
5. **Scalability**: Easy horizontal scaling
6. **Version Control**: Track changes to your infrastructure

## Images and Containers

### Images

An image is a read-only template containing everything needed to run an application: code, runtime, libraries, environment variables, and configuration files.

**Layered Architecture:** Docker images use a Union File System (UnionFS), composed of multiple read-only layers. This design provides:

- **Storage Efficiency**: Identical layers are shared across images
- **Build Efficiency**: Only changed layers need rebuilding
- **Transfer Efficiency**: Only download layers not present locally

```bash
# View image layer structure
docker history nginx:latest

# Pull an image
docker pull python:3.11-slim

# List local images
docker images

# Remove an image
docker rmi python:3.11-slim

# Remove unused images
docker image prune
```

### Containers

A container is a runnable instance of an image - an isolated process. Containers add a writable layer (Container Layer) on top of the image's read-only layers.

```bash
# Run a container
docker run -d --name my-nginx -p 80:80 nginx

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Enter a running container
docker exec -it my-nginx /bin/bash

# View container logs
docker logs -f my-nginx

# Stop a container
docker stop my-nginx

# Remove a container
docker rm my-nginx

# Stop and remove in one command
docker stop my-nginx && docker rm my-nginx

# View container resource usage
docker stats
```

### Container Lifecycle

```
Created --> Running --> Paused --> Running --> Stopped --> Removed
    |                                              |
    +----------------------------------------------+
                      docker rm
```

### Registry

A registry stores and distributes Docker images.

- **Docker Hub**: Official public registry
- **Private Registries**: Harbor, AWS ECR, Google Container Registry, Azure Container Registry

```bash
# Log in to a registry
docker login registry.example.com

# Tag an image
docker tag myapp:latest registry.example.com/myapp:v1.0

# Push an image
docker push registry.example.com/myapp:v1.0

# Pull from a private registry
docker pull registry.example.com/myapp:v1.0
```

## Dockerfile Best Practices

A Dockerfile is a text file containing instructions to build a Docker image.

### Basic Structure

```dockerfile
# Use an official base image with a specific version
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy dependency files first (leverage caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create a non-root user
RUN useradd --create-home appuser
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Startup command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

### Key Best Practices

**1. Use Specific Base Image Tags**

Never use `latest` in production. Pin specific versions for reproducible builds.

```dockerfile
# Good
FROM node:20.10.0-alpine

# Bad
FROM node:latest
```

**2. Order Instructions by Change Frequency**

Place instructions that change less frequently at the top to maximize cache utilization.

```dockerfile
# Dependencies change less often than code
COPY package*.json ./
RUN npm install
COPY . .
```

**3. Combine RUN Commands**

Reduce layers and clean up in the same command.

```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get purge -y build-essential && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*
```

**4. Use .dockerignore**

Exclude unnecessary files from the build context.

```dockerignore
# .dockerignore
.git
.gitignore
__pycache__
*.pyc
*.pyo
.env
.venv
node_modules
*.md
tests/
.coverage
.pytest_cache
Dockerfile
docker-compose*.yml
```

**5. Use COPY Instead of ADD**

`COPY` is more transparent. Use `ADD` only when you need its special features (URL downloads, auto-extraction).

```dockerfile
# Preferred
COPY package.json ./

# Only when needed
ADD https://example.com/file.tar.gz /tmp/
```

## Docker Compose

Docker Compose is a tool for defining and running multi-container applications using a YAML file.

### Complete Example

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    networks:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - backend
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:

networks:
  backend:
    driver: bridge
```

### Common Commands

```bash
# Start services in the background
docker compose up -d

# View logs
docker compose logs -f app

# View logs for all services
docker compose logs -f

# Scale a service
docker compose up -d --scale app=3

# Stop services
docker compose stop

# Stop and remove containers, networks
docker compose down

# Stop and remove including volumes
docker compose down -v

# Rebuild images
docker compose build --no-cache

# Pull latest images
docker compose pull

# Execute command in running service
docker compose exec app sh
```

### Environment Variables

```yaml
# Using .env file
services:
  app:
    env_file:
      - .env
      - .env.local
    environment:
      - DEBUG=${DEBUG:-false}
```

## Networking

Docker provides multiple networking modes for different use cases.

### Network Types

| Network Mode | Description | Use Case |
|--------------|-------------|----------|
| bridge | Default mode, containers communicate via virtual bridge | Single-host multi-container |
| host | Container uses host's network directly | High network performance needs |
| none | Disables networking | Security isolation |
| overlay | Cross-host networking | Docker Swarm/Kubernetes |
| macvlan | Container gets its own MAC address | Direct physical network access |

### Creating Custom Networks

```bash
# Create a custom network
docker network create --driver bridge my-network

# Create network with subnet
docker network create --driver bridge --subnet=172.20.0.0/16 my-network

# Run containers on the network
docker run -d --name db --network my-network postgres:15
docker run -d --name app --network my-network -p 8080:8080 myapp

# Containers can communicate by name
# App can reach database at "db:5432"

# Connect existing container to network
docker network connect my-network existing-container

# Disconnect from network
docker network disconnect my-network existing-container

# List networks
docker network ls

# Inspect network
docker network inspect my-network

# Remove network
docker network rm my-network
```

### DNS Resolution

Containers on the same user-defined network can resolve each other by container name. This built-in DNS is not available on the default bridge network.

```bash
# On custom network: works
docker exec app ping db

# On default bridge: need to use IP addresses
```

## Volumes and Persistence

Containers are ephemeral by nature. Volumes provide data persistence that survives container lifecycle.

### Volume Types

```bash
# Named volumes (recommended for production)
docker volume create my-data
docker run -v my-data:/app/data nginx

# Bind mounts (useful for development)
docker run -v $(pwd)/src:/app/src nginx
docker run -v /absolute/path:/container/path nginx

# tmpfs mounts (stored in memory)
docker run --tmpfs /app/cache nginx

# Read-only volumes
docker run -v my-data:/app/data:ro nginx
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume details
docker volume inspect my-data

# Remove a volume
docker volume rm my-data

# Remove unused volumes
docker volume prune

# Backup a volume
docker run --rm -v my-data:/source -v $(pwd):/backup alpine \
    tar czf /backup/my-data-backup.tar.gz -C /source .

# Restore a volume
docker run --rm -v my-data:/target -v $(pwd):/backup alpine \
    tar xzf /backup/my-data-backup.tar.gz -C /target
```

### Volume in Docker Compose

```yaml
services:
  db:
    image: postgres:15
    volumes:
      # Named volume
      - postgres_data:/var/lib/postgresql/data
      # Bind mount (relative path)
      - ./init:/docker-entrypoint-initdb.d:ro
      # Bind mount with options
      - type: bind
        source: ./data
        target: /data
        read_only: true

volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/on/host
```

## Multi-Stage Builds

Multi-stage builds are essential for creating optimized production images, especially for compiled languages.

### Go Application Example

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server

# Runtime stage
FROM scratch

COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080
ENTRYPOINT ["/server"]
```

### Node.js Application Example

```dockerfile
# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

USER nextjs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Python Application Example

```dockerfile
# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim AS runner

WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN useradd --create-home appuser
USER appuser

COPY --chown=appuser:appuser . .

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

### Benefits of Multi-Stage Builds

1. **Smaller Images**: Only runtime dependencies in final image
2. **Security**: Build tools and source code not included
3. **Faster Deployments**: Smaller images mean faster pulls
4. **Single Dockerfile**: Build and runtime in one file

## Security

### Core Security Practices

**1. Run as Non-Root User**

```dockerfile
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser
```

**2. Use Read-Only Filesystem**

```bash
docker run --read-only --tmpfs /tmp --tmpfs /var/run myapp
```

**3. Drop Capabilities**

```bash
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp
```

**4. Limit Resources**

```bash
docker run \
    --memory=512m \
    --cpus=1 \
    --pids-limit=100 \
    myapp
```

**5. Use Security Options**

```bash
docker run \
    --security-opt=no-new-privileges:true \
    --security-opt=seccomp:default \
    myapp
```

### Image Security

```bash
# Enable Docker Content Trust for signed images
export DOCKER_CONTENT_TRUST=1

# Scan images for vulnerabilities with Docker Scout
docker scout cves myimage:latest

# Scan with Trivy
trivy image myimage:latest

# Scan with Grype
grype myimage:latest
```

### Security Checklist

- [ ] Use official or verified base images
- [ ] Pin specific image versions
- [ ] Scan images for vulnerabilities regularly
- [ ] Run containers as non-root
- [ ] Use read-only filesystems where possible
- [ ] Limit container resources
- [ ] Don't store secrets in images
- [ ] Use Docker secrets or external secret management
- [ ] Keep Docker and base images updated
- [ ] Implement network segmentation
- [ ] Enable audit logging

### Secrets Management

```yaml
# docker-compose.yml with secrets
services:
  app:
    image: myapp
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    external: true
```

## Interview Key Points

### Fundamental Concepts

**Q: What is the difference between Docker containers and virtual machines?**

A: Containers provide process-level isolation by sharing the host OS kernel, resulting in faster startup times and lower resource usage. VMs provide hardware-level virtualization with each VM running a complete guest OS, offering stronger isolation but higher resource overhead. Containers are measured in MBs and start in seconds; VMs are measured in GBs and start in minutes.

**Q: Explain Docker's layered image architecture.**

A: Docker images use a Union File System where each Dockerfile instruction creates a read-only layer. Layers are stacked, with each layer containing only the changes from the previous layer. When a container runs, a writable container layer is added on top. This architecture enables layer sharing between images, efficient storage, and incremental builds.

**Q: What is the difference between CMD and ENTRYPOINT?**

A: `CMD` provides default arguments that can be overridden at runtime. `ENTRYPOINT` defines the executable and is harder to override. Best practice: use `ENTRYPOINT` for the main command and `CMD` for default arguments.

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
# docker run myimage script.py  -> runs: python script.py
```

### Intermediate Topics

**Q: How do you optimize Docker image size?**

A:
1. Use multi-stage builds
2. Choose minimal base images (alpine, slim, distroless)
3. Combine RUN commands and clean up in the same layer
4. Use .dockerignore to exclude unnecessary files
5. Remove package manager caches
6. Only install production dependencies

**Q: Explain Docker networking modes and when to use each.**

A:
- **bridge**: Default, for single-host container communication
- **host**: When you need maximum network performance, container uses host network
- **none**: For maximum isolation when network access isn't needed
- **overlay**: For cross-host communication in Swarm/Kubernetes
- **macvlan**: When containers need to appear as physical devices on the network

**Q: How do you handle persistent data in Docker?**

A: Three options:
1. **Named volumes**: Managed by Docker, best for production data
2. **Bind mounts**: Direct host path mapping, good for development
3. **tmpfs**: In-memory storage for sensitive temporary data

### Advanced Scenarios

**Q: How do you ensure container security in production?**

A:
1. Run as non-root user
2. Use read-only filesystems
3. Drop unnecessary Linux capabilities
4. Limit resources (memory, CPU, PIDs)
5. Scan images for vulnerabilities
6. Use trusted base images
7. Don't store secrets in images
8. Implement network segmentation
9. Enable security options (no-new-privileges, seccomp)
10. Regular patching and updates

**Q: How do you implement health checks?**

A: Use the `HEALTHCHECK` instruction in Dockerfile or healthcheck configuration in docker-compose.yml:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
```

Docker marks containers as healthy, unhealthy, or starting based on these checks, enabling automatic restart and load balancer integration.

**Q: Explain the difference between docker-compose up and docker-compose run.**

A: `docker-compose up` starts all services defined in the compose file, creating containers, networks, and volumes as needed. `docker-compose run` starts a single service and runs a one-off command, typically used for running tests or administrative tasks.

## Common Pitfalls and Troubleshooting

### Build-Time Mistakes

```dockerfile
# Wrong: Downloads dependencies on every build
COPY . .
RUN pip install -r requirements.txt

# Correct: Leverage cache by copying dependencies first
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

### Runtime Mistakes

```bash
# Wrong: Using & for background (container stops when shell exits)
docker run myapp &

# Correct: Use -d flag
docker run -d myapp

# Wrong: Logs grow indefinitely
# Correct: Configure logging driver
docker run \
    --log-driver json-file \
    --log-opt max-size=10m \
    --log-opt max-file=3 \
    myapp
```

### Troubleshooting Commands

```bash
# Container won't start - check logs
docker logs <container_id>

# Inspect container configuration
docker inspect <container_id>

# Network connectivity issues
docker network inspect bridge
docker exec -it <container_id> ping <target>

# Disk space issues
docker system df
docker system prune -a

# View container processes
docker top <container_id>

# Check container events
docker events --since 1h
```

## Further Reading

### Official Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

### Advanced Topics

- **Container Orchestration**: Kubernetes, Docker Swarm
- **Image Building**: BuildKit, Kaniko, Buildah
- **Container Registries**: Harbor, Nexus, AWS ECR
- **Security Scanning**: Trivy, Falco, OPA Gatekeeper
- **Runtime Alternatives**: containerd, CRI-O, Podman

### Recommended Books

- *Docker Deep Dive* by Nigel Poulton
- *Docker in Practice* by Ian Miell and Aidan Hobson Sayers
- *Container Security* by Liz Rice
- *Kubernetes in Action* by Marko Luksa

### Community Resources

- [Docker Hub](https://hub.docker.com/) - Official image registry
- [CNCF Cloud Native Foundation](https://www.cncf.io/) - Cloud native ecosystem
- [OCI Open Container Initiative](https://opencontainers.org/) - Container standards
- [Awesome Docker](https://github.com/veggiemonk/awesome-docker) - Curated resources

---

## Summary

Docker has become an essential skill for modern software development and operations. Mastering Docker requires understanding not just the commands but the underlying concepts: how containers differ from VMs, how the layered filesystem works, and how networking and storage are managed.

Key takeaways:
- Containers share the host kernel, making them lightweight and fast
- Images are built in layers, enabling efficient storage and caching
- Use multi-stage builds for production-optimized images
- Security must be considered at every layer: base images, Dockerfile, runtime
- Docker Compose simplifies multi-container application management
- Volumes persist data beyond container lifecycle

Containerization is just the beginning of the cloud-native journey. As you become comfortable with Docker, consider learning Kubernetes for container orchestration, which has become the de facto standard for running containers at scale in production environments.
