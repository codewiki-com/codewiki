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
origin: old/src/content/docs/devops/docker-guide.zh.md
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

Docker 彻底改变了我们构建、分发和运行应用程序的方式。作为现代云原生开发的基石，Docker 提供了从开发到生产的一致环境，消除了令人头疼的"在我机器上可以运行"问题。本指南涵盖了从基础概念到高级技术的全部内容，为你在实际项目和技术面试中做好充分准备。

## Docker 基础

### 什么是 Docker？

Docker 是一个开源平台，可以将应用程序自动化部署在轻量级、可移植的容器中。与传统虚拟化不同，Docker 容器共享宿主操作系统的内核，使其在系统资源方面更加高效。

### 容器与虚拟机

理解容器与虚拟机（VM）的区别是掌握 Docker 价值的基础。

**虚拟机架构：**

虚拟机运行在模拟完整硬件的虚拟机管理程序上。每个虚拟机包括：
- 完整的客户操作系统
- 虚拟化的硬件资源（CPU、内存、存储、网络）
- 应用程序二进制文件和依赖项

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

**容器架构：**

容器利用 Linux 内核特性如 **Namespaces** 和 **Cgroups** 来实现进程隔离：
- **Namespaces**：为进程、网络、文件系统和其他资源提供隔离
- **Cgroups**：控制和限制资源使用（CPU、内存、I/O）

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

### 主要差异对比

| 特性 | 虚拟机 | 容器 |
|---------|----------------|-----------|
| 启动时间 | 分钟级 | 秒级 |
| 资源占用 | GB 级别 | MB 级别 |
| 隔离级别 | 完全隔离 | 进程级别 |
| 性能开销 | 5-15% | 接近原生 |
| 镜像大小 | 数 GB | 数十到数百 MB |
| 部署密度 | 每主机数十个 | 每主机数百到数千个 |

### 为什么使用 Docker？

1. **一致性**：从开发到生产环境保持一致
2. **隔离性**：应用程序独立运行，互不冲突
3. **可移植性**：在任何安装了 Docker 的地方运行
4. **高效性**：比虚拟机更轻量
5. **可扩展性**：易于水平扩展
6. **版本控制**：追踪基础设施的变更

## 镜像与容器

### 镜像

镜像是一个只读模板，包含运行应用程序所需的一切：代码、运行时、库、环境变量和配置文件。

**分层架构：** Docker 镜像使用联合文件系统（UnionFS），由多个只读层组成。这种设计提供了：

- **存储效率**：相同的层在镜像间共享
- **构建效率**：只有变更的层需要重建
- **传输效率**：只下载本地不存在的层

```bash
# 查看镜像层结构
docker history nginx:latest

# 拉取镜像
docker pull python:3.11-slim

# 列出本地镜像
docker images

# 删除镜像
docker rmi python:3.11-slim

# 删除未使用的镜像
docker image prune
```

### 容器

容器是镜像的可运行实例——一个隔离的进程。容器在镜像的只读层之上添加一个可写层（容器层）。

```bash
# 运行容器
docker run -d --name my-nginx -p 80:80 nginx

# 列出运行中的容器
docker ps

# 列出所有容器（包括已停止的）
docker ps -a

# 进入运行中的容器
docker exec -it my-nginx /bin/bash

# 查看容器日志
docker logs -f my-nginx

# 停止容器
docker stop my-nginx

# 删除容器
docker rm my-nginx

# 停止并删除容器
docker stop my-nginx && docker rm my-nginx

# 查看容器资源使用情况
docker stats
```

### 容器生命周期

```
Created --> Running --> Paused --> Running --> Stopped --> Removed
    |                                              |
    +----------------------------------------------+
                      docker rm
```

### 仓库

仓库用于存储和分发 Docker 镜像。

- **Docker Hub**：官方公共仓库
- **私有仓库**：Harbor、AWS ECR、Google Container Registry、Azure Container Registry

```bash
# 登录仓库
docker login registry.example.com

# 为镜像打标签
docker tag myapp:latest registry.example.com/myapp:v1.0

# 推送镜像
docker push registry.example.com/myapp:v1.0

# 从私有仓库拉取
docker pull registry.example.com/myapp:v1.0
```

## Dockerfile 最佳实践

Dockerfile 是包含构建 Docker 镜像指令的文本文件。

### 基本结构

```dockerfile
# 使用带有特定版本的官方基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 先复制依赖文件（利用缓存）
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd --create-home appuser
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

### 关键最佳实践

**1. 使用特定的基础镜像标签**

生产环境中不要使用 `latest`。固定特定版本以确保可重现的构建。

```dockerfile
# 推荐
FROM node:20.10.0-alpine

# 不推荐
FROM node:latest
```

**2. 按变更频率排序指令**

将变更较少的指令放在前面，最大化利用缓存。

```dockerfile
# 依赖变更频率低于代码
COPY package*.json ./
RUN npm install
COPY . .
```

**3. 合并 RUN 命令**

减少层数，在同一命令中进行清理。

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

**4. 使用 .dockerignore**

从构建上下文中排除不必要的文件。

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

**5. 使用 COPY 代替 ADD**

`COPY` 更加透明。只有在需要 ADD 的特殊功能（URL 下载、自动解压）时才使用 ADD。

```dockerfile
# 推荐
COPY package.json ./

# 仅在需要时使用
ADD https://example.com/file.tar.gz /tmp/
```

## Docker Compose

Docker Compose 是一个使用 YAML 文件定义和运行多容器应用的工具。

### 完整示例

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

### 常用命令

```bash
# 后台启动服务
docker compose up -d

# 查看日志
docker compose logs -f app

# 查看所有服务日志
docker compose logs -f

# 扩展服务
docker compose up -d --scale app=3

# 停止服务
docker compose stop

# 停止并删除容器、网络
docker compose down

# 停止并删除，包括卷
docker compose down -v

# 重新构建镜像
docker compose build --no-cache

# 拉取最新镜像
docker compose pull

# 在运行的服务中执行命令
docker compose exec app sh
```

### 环境变量

```yaml
# 使用 .env 文件
services:
  app:
    env_file:
      - .env
      - .env.local
    environment:
      - DEBUG=${DEBUG:-false}
```

## 网络

Docker 提供多种网络模式以满足不同的使用场景。

### 网络类型

| 网络模式 | 描述 | 使用场景 |
|--------------|-------------|----------|
| bridge | 默认模式，容器通过虚拟网桥通信 | 单主机多容器 |
| host | 容器直接使用宿主机网络 | 高网络性能需求 |
| none | 禁用网络 | 安全隔离 |
| overlay | 跨主机网络 | Docker Swarm/Kubernetes |
| macvlan | 容器获得独立 MAC 地址 | 直接访问物理网络 |

### 创建自定义网络

```bash
# 创建自定义网络
docker network create --driver bridge my-network

# 创建带子网的网络
docker network create --driver bridge --subnet=172.20.0.0/16 my-network

# 在网络上运行容器
docker run -d --name db --network my-network postgres:15
docker run -d --name app --network my-network -p 8080:8080 myapp

# 容器可以通过名称通信
# App 可以通过 "db:5432" 访问数据库

# 将现有容器连接到网络
docker network connect my-network existing-container

# 从网络断开
docker network disconnect my-network existing-container

# 列出网络
docker network ls

# 检查网络
docker network inspect my-network

# 删除网络
docker network rm my-network
```

### DNS 解析

同一用户自定义网络上的容器可以通过容器名称相互解析。这种内置的 DNS 在默认的 bridge 网络上不可用。

```bash
# 在自定义网络上：可以工作
docker exec app ping db

# 在默认 bridge 网络上：需要使用 IP 地址
```

## 卷与持久化

容器本质上是临时的。卷提供超越容器生命周期的数据持久化。

### 卷类型

```bash
# 命名卷（生产环境推荐）
docker volume create my-data
docker run -v my-data:/app/data nginx

# 绑定挂载（适合开发环境）
docker run -v $(pwd)/src:/app/src nginx
docker run -v /absolute/path:/container/path nginx

# tmpfs 挂载（存储在内存中）
docker run --tmpfs /app/cache nginx

# 只读卷
docker run -v my-data:/app/data:ro nginx
```

### 卷管理

```bash
# 列出卷
docker volume ls

# 检查卷详情
docker volume inspect my-data

# 删除卷
docker volume rm my-data

# 删除未使用的卷
docker volume prune

# 备份卷
docker run --rm -v my-data:/source -v $(pwd):/backup alpine \
    tar czf /backup/my-data-backup.tar.gz -C /source .

# 恢复卷
docker run --rm -v my-data:/target -v $(pwd):/backup alpine \
    tar xzf /backup/my-data-backup.tar.gz -C /target
```

### Docker Compose 中的卷

```yaml
services:
  db:
    image: postgres:15
    volumes:
      # 命名卷
      - postgres_data:/var/lib/postgresql/data
      # 绑定挂载（相对路径）
      - ./init:/docker-entrypoint-initdb.d:ro
      # 带选项的绑定挂载
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

## 多阶段构建

多阶段构建对于创建优化的生产镜像至关重要，特别是对于编译型语言。

### Go 应用示例

```dockerfile
# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server

# 运行阶段
FROM scratch

COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080
ENTRYPOINT ["/server"]
```

### Node.js 应用示例

```dockerfile
# 依赖阶段
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
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

### Python 应用示例

```dockerfile
# 构建阶段
FROM python:3.11-slim AS builder

WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 运行阶段
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

### 多阶段构建的优势

1. **更小的镜像**：最终镜像只包含运行时依赖
2. **安全性**：构建工具和源代码不包含在内
3. **更快的部署**：更小的镜像意味着更快的拉取
4. **单一 Dockerfile**：构建和运行时在一个文件中

## 安全

### 核心安全实践

**1. 以非 Root 用户运行**

```dockerfile
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser
```

**2. 使用只读文件系统**

```bash
docker run --read-only --tmpfs /tmp --tmpfs /var/run myapp
```

**3. 删除权限**

```bash
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp
```

**4. 限制资源**

```bash
docker run \
    --memory=512m \
    --cpus=1 \
    --pids-limit=100 \
    myapp
```

**5. 使用安全选项**

```bash
docker run \
    --security-opt=no-new-privileges:true \
    --security-opt=seccomp:default \
    myapp
```

### 镜像安全

```bash
# 启用 Docker Content Trust 以使用签名镜像
export DOCKER_CONTENT_TRUST=1

# 使用 Docker Scout 扫描镜像漏洞
docker scout cves myimage:latest

# 使用 Trivy 扫描
trivy image myimage:latest

# 使用 Grype 扫描
grype myimage:latest
```

### 安全清单

- [ ] 使用官方或经过验证的基础镜像
- [ ] 固定特定的镜像版本
- [ ] 定期扫描镜像漏洞
- [ ] 以非 root 用户运行容器
- [ ] 尽可能使用只读文件系统
- [ ] 限制容器资源
- [ ] 不在镜像中存储密钥
- [ ] 使用 Docker secrets 或外部密钥管理
- [ ] 保持 Docker 和基础镜像更新
- [ ] 实施网络分段
- [ ] 启用审计日志

### 密钥管理

```yaml
# 使用 secrets 的 docker-compose.yml
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

## 面试要点

### 基础概念

**问：Docker 容器和虚拟机有什么区别？**

答：容器通过共享宿主操作系统内核提供进程级隔离，启动更快，资源占用更少。虚拟机提供硬件级虚拟化，每个虚拟机运行完整的客户操作系统，提供更强的隔离但资源开销更高。容器以 MB 为单位，秒级启动；虚拟机以 GB 为单位，分钟级启动。

**问：解释 Docker 的分层镜像架构。**

答：Docker 镜像使用联合文件系统，每个 Dockerfile 指令创建一个只读层。层是堆叠的，每层只包含与前一层的变化。当容器运行时，在顶部添加一个可写的容器层。这种架构实现了镜像间的层共享、高效存储和增量构建。

**问：CMD 和 ENTRYPOINT 有什么区别？**

答：`CMD` 提供可在运行时覆盖的默认参数。`ENTRYPOINT` 定义可执行文件，更难被覆盖。最佳实践：使用 `ENTRYPOINT` 作为主命令，`CMD` 作为默认参数。

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
# docker run myimage script.py  -> 运行: python script.py
```

### 中级话题

**问：如何优化 Docker 镜像大小？**

答：
1. 使用多阶段构建
2. 选择最小化基础镜像（alpine、slim、distroless）
3. 合并 RUN 命令并在同一层中清理
4. 使用 .dockerignore 排除不必要的文件
5. 删除包管理器缓存
6. 只安装生产依赖

**问：解释 Docker 网络模式以及何时使用。**

答：
- **bridge**：默认，用于单主机容器通信
- **host**：需要最大网络性能时，容器使用宿主机网络
- **none**：不需要网络访问时实现最大隔离
- **overlay**：用于 Swarm/Kubernetes 中的跨主机通信
- **macvlan**：容器需要在网络上表现为物理设备时使用

**问：如何在 Docker 中处理持久化数据？**

答：三种选择：
1. **命名卷**：由 Docker 管理，最适合生产数据
2. **绑定挂载**：直接映射宿主机路径，适合开发
3. **tmpfs**：内存存储，用于敏感的临时数据

### 高级场景

**问：如何确保生产环境中的容器安全？**

答：
1. 以非 root 用户运行
2. 使用只读文件系统
3. 删除不必要的 Linux 权限
4. 限制资源（内存、CPU、PID）
5. 扫描镜像漏洞
6. 使用可信的基础镜像
7. 不在镜像中存储密钥
8. 实施网络分段
9. 启用安全选项（no-new-privileges、seccomp）
10. 定期打补丁和更新

**问：如何实现健康检查？**

答：使用 Dockerfile 中的 `HEALTHCHECK` 指令或 docker-compose.yml 中的 healthcheck 配置：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
```

Docker 根据这些检查将容器标记为 healthy、unhealthy 或 starting，实现自动重启和负载均衡器集成。

**问：解释 docker-compose up 和 docker-compose run 的区别。**

答：`docker-compose up` 启动 compose 文件中定义的所有服务，根据需要创建容器、网络和卷。`docker-compose run` 启动单个服务并运行一次性命令，通常用于运行测试或管理任务。

## 常见错误与故障排除

### 构建时错误

```dockerfile
# 错误：每次构建都下载依赖
COPY . .
RUN pip install -r requirements.txt

# 正确：利用缓存，先复制依赖
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

### 运行时错误

```bash
# 错误：使用 & 后台运行（shell 退出时容器停止）
docker run myapp &

# 正确：使用 -d 标志
docker run -d myapp

# 错误：日志无限增长
# 正确：配置日志驱动
docker run \
    --log-driver json-file \
    --log-opt max-size=10m \
    --log-opt max-file=3 \
    myapp
```

### 故障排除命令

```bash
# 容器无法启动 - 检查日志
docker logs <container_id>

# 检查容器配置
docker inspect <container_id>

# 网络连接问题
docker network inspect bridge
docker exec -it <container_id> ping <target>

# 磁盘空间问题
docker system df
docker system prune -a

# 查看容器进程
docker top <container_id>

# 检查容器事件
docker events --since 1h
```

## 延伸阅读

### 官方资源

- [Docker 官方文档](https://docs.docker.com/)
- [Dockerfile 参考](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose 规范](https://docs.docker.com/compose/compose-file/)
- [Docker 安全最佳实践](https://docs.docker.com/develop/security-best-practices/)

### 进阶话题

- **容器编排**：Kubernetes、Docker Swarm
- **镜像构建**：BuildKit、Kaniko、Buildah
- **容器仓库**：Harbor、Nexus、AWS ECR
- **安全扫描**：Trivy、Falco、OPA Gatekeeper
- **运行时替代方案**：containerd、CRI-O、Podman

### 推荐书籍

- *Docker Deep Dive* - Nigel Poulton 著
- *Docker in Practice* - Ian Miell 和 Aidan Hobson Sayers 著
- *Container Security* - Liz Rice 著
- *Kubernetes in Action* - Marko Luksa 著

### 社区资源

- [Docker Hub](https://hub.docker.com/) - 官方镜像仓库
- [CNCF 云原生计算基金会](https://www.cncf.io/) - 云原生生态系统
- [OCI 开放容器倡议](https://opencontainers.org/) - 容器标准
- [Awesome Docker](https://github.com/veggiemonk/awesome-docker) - 精选资源

---

## 总结

Docker 已成为现代软件开发和运维的必备技能。掌握 Docker 不仅需要了解命令，还需要理解底层概念：容器与虚拟机的区别、分层文件系统的工作原理，以及网络和存储的管理方式。

核心要点：
- 容器共享宿主机内核，使其轻量且快速
- 镜像以层的形式构建，实现高效存储和缓存
- 使用多阶段构建创建生产优化镜像
- 安全必须在每一层考虑：基础镜像、Dockerfile、运行时
- Docker Compose 简化多容器应用管理
- 卷使数据持久化超越容器生命周期

容器化只是云原生之旅的开始。当你熟悉 Docker 后，可以考虑学习 Kubernetes 进行容器编排，它已成为生产环境中大规模运行容器的事实标准。
