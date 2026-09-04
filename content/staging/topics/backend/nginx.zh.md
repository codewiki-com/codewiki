---
title: Nginx 完全指南
description: 掌握Nginx Web服务器和反向代理，构建高性能Web架构
track: backend
section: deployment
difficulty: intermediate
tags:
  - Nginx
  - 反向代理
  - 负载均衡
  - Web服务器
status: imported
origin: old/src/content/docs/devops/nginx.zh.md
divergence: 0.218
issues: []
legacy:
  category: DevOps
  subcategory: Web Server
  order: 12
  lastUpdated: 2026-01-07
---

Nginx（发音为 "engine-x"）是一个高性能的 HTTP 服务器和反向代理服务器，由俄罗斯程序员 Igor Sysoev 于 2004 年开发。如今，Nginx 已成为全球最流行的 Web 服务器之一，为超过 30% 的网站提供服务，包括 Netflix、Airbnb、Dropbox 等知名企业。

## Nginx 架构与工作原理

### 事件驱动架构

与 Apache 的多进程/多线程模型不同，Nginx 采用**事件驱动**和**异步非阻塞**的架构，这使得它能够在有限的资源下处理大量并发连接。

```
┌─────────────────────────────────────────────────────────────┐
│                        Master Process                        │
│  - 读取和验证配置文件                                          │
│  - 管理 Worker 进程                                           │
│  - 平滑升级（热部署）                                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Worker Process│    │ Worker Process│    │ Worker Process│
│   (CPU Core)  │    │   (CPU Core)  │    │   (CPU Core)  │
│               │    │               │    │               │
│  Event Loop   │    │  Event Loop   │    │  Event Loop   │
│  (epoll/kqueue)│    │  (epoll/kqueue)│    │  (epoll/kqueue)│
└───────────────┘    └───────────────┘    └───────────────┘
```

### 进程模型

Nginx 采用 **Master-Worker** 进程模型：

- **Master 进程**：负责读取配置、管理 Worker 进程、处理信号
- **Worker 进程**：实际处理客户端请求，数量通常设置为 CPU 核心数
- **Cache Manager/Loader**：管理缓存（可选）

```bash
# 查看 Nginx 进程
ps aux | grep nginx

# 输出示例：
# root      1234  0.0  0.1  nginx: master process
# www-data  1235  0.0  0.2  nginx: worker process
# www-data  1236  0.0  0.2  nginx: worker process
```

### 请求处理流程

```
客户端请求 → Master 分配 → Worker 接收
                              ↓
                         解析请求头
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
               静态资源            代理请求
                    ↓                   ↓
              读取文件           转发到后端
                    ↓                   ↓
                    └─────────┬─────────┘
                              ↓
                         返回响应
```

### Apache vs Nginx 对比

| 特性 | Apache | Nginx |
|------|--------|-------|
| 架构模型 | 多进程/多线程 | 事件驱动 |
| 并发性能 | 中等 | 优秀 |
| 内存消耗 | 较高 | 较低 |
| 静态文件 | 一般 | 极快 |
| 动态内容 | 模块直接处理 | 需代理到后端 |
| 配置方式 | .htaccess | 集中配置 |
| 模块加载 | 动态加载 | 编译时加载 |

## 配置文件结构

### 配置文件位置

```bash
# 主配置文件
/etc/nginx/nginx.conf

# 站点配置目录
/etc/nginx/conf.d/          # 通用配置
/etc/nginx/sites-available/ # 可用站点（Debian/Ubuntu）
/etc/nginx/sites-enabled/   # 已启用站点

# 其他重要目录
/var/log/nginx/             # 日志目录
/var/www/html/              # 默认网站根目录
```

### 配置文件层级结构

```nginx
# 全局块：影响 Nginx 整体运行
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

# events 块：网络连接相关配置
events {
    worker_connections 1024;
    use epoll;              # Linux 使用 epoll
    multi_accept on;        # 一次接受多个连接
}

# http 块：HTTP 服务器配置
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # server 块：虚拟主机配置
    server {
        listen 80;
        server_name example.com;
        root /var/www/html;

        # location 块：URL 匹配规则
        location / {
            try_files $uri $uri/ =404;
        }

        location /api {
            proxy_pass http://backend;
        }
    }

    # 可包含其他配置文件
    include /etc/nginx/conf.d/*.conf;
}
```

### Location 匹配规则

Location 指令用于匹配 URI，按照以下优先级进行匹配：

```nginx
# 精确匹配（优先级最高）
location = /exact {
    # 只匹配 /exact
}

# 前缀匹配（^~ 阻止正则）
location ^~ /images/ {
    # 匹配以 /images/ 开头的 URI，不再检查正则
}

# 正则匹配（区分大小写）
location ~ \.php$ {
    # 匹配以 .php 结尾的 URI
}

# 正则匹配（不区分大小写）
location ~* \.(jpg|jpeg|png|gif)$ {
    # 匹配图片文件
}

# 普通前缀匹配（优先级最低）
location /static/ {
    # 匹配以 /static/ 开头的 URI
}

# 默认匹配
location / {
    # 匹配所有请求
}
```

**匹配优先级总结**：`=` > `^~` > `~` / `~*` > 普通前缀（最长匹配）> `/`

## 静态文件服务

### 基本静态文件配置

```nginx
server {
    listen 80;
    server_name static.example.com;
    root /var/www/static;

    # 默认首页
    index index.html index.htm;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;  # 关闭静态资源日志
    }

    # HTML 文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### SPA 应用配置（Vue/React）

```nginx
server {
    listen 80;
    server_name app.example.com;
    root /var/www/spa;
    index index.html;

    # SPA 路由支持：所有请求都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 文件下载服务

```nginx
server {
    listen 80;
    server_name download.example.com;
    root /var/www/downloads;

    location /files/ {
        # 启用目录列表
        autoindex on;
        autoindex_exact_size off;  # 显示人类可读大小
        autoindex_localtime on;     # 显示本地时间

        # 大文件优化
        sendfile on;
        tcp_nopush on;

        # 限制下载速度（每秒 1MB）
        limit_rate 1m;

        # 设置下载文件名
        if ($request_filename ~* ^.*?/([^/]*?)$) {
            set $filename $1;
        }
        add_header Content-Disposition "attachment; filename=$filename";
    }
}
```

## 反向代理配置

### 基本反向代理

```nginx
upstream backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;

        # 传递客户端真实信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲配置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
```

### WebSocket 代理

```nginx
server {
    listen 80;
    server_name ws.example.com;

    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        # WebSocket 关键配置
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 长连接超时
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

### 多后端服务代理

```nginx
server {
    listen 80;
    server_name gateway.example.com;

    # 用户服务
    location /api/users/ {
        proxy_pass http://user-service:3001/;
        include /etc/nginx/proxy_params;
    }

    # 订单服务
    location /api/orders/ {
        proxy_pass http://order-service:3002/;
        include /etc/nginx/proxy_params;
    }

    # 商品服务
    location /api/products/ {
        proxy_pass http://product-service:3003/;
        include /etc/nginx/proxy_params;
    }

    # 前端应用
    location / {
        proxy_pass http://frontend:3000;
        include /etc/nginx/proxy_params;
    }
}

# /etc/nginx/proxy_params 公共配置
# proxy_set_header Host $host;
# proxy_set_header X-Real-IP $remote_addr;
# proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
# proxy_set_header X-Forwarded-Proto $scheme;
```

## 负载均衡策略

### 负载均衡算法

```nginx
# 轮询（默认）：按顺序分配请求
upstream backend_round_robin {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

# 权重：按权重比例分配
upstream backend_weighted {
    server 192.168.1.101:8080 weight=5;  # 50% 请求
    server 192.168.1.102:8080 weight=3;  # 30% 请求
    server 192.168.1.103:8080 weight=2;  # 20% 请求
}

# IP Hash：相同 IP 访问同一后端（会话保持）
upstream backend_ip_hash {
    ip_hash;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

# 最少连接：优先分配给连接数最少的服务器
upstream backend_least_conn {
    least_conn;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

# 一致性哈希：基于指定 key 分配
upstream backend_hash {
    hash $request_uri consistent;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}
```

### 健康检查与故障转移

```nginx
upstream backend {
    server 192.168.1.101:8080 weight=5 max_fails=3 fail_timeout=30s;
    server 192.168.1.102:8080 weight=3 max_fails=3 fail_timeout=30s;
    server 192.168.1.103:8080 backup;  # 备用服务器
    server 192.168.1.104:8080 down;    # 标记为不可用

    # 长连接配置
    keepalive 32;
    keepalive_requests 1000;
    keepalive_timeout 60s;
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";  # 启用长连接

        # 故障转移配置
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
}
```

### 会话保持（Sticky Session）

```nginx
# 方式一：基于 Cookie 的会话保持（需要 nginx-sticky-module）
upstream backend {
    sticky cookie srv_id expires=1h domain=.example.com path=/;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# 方式二：基于 IP Hash
upstream backend {
    ip_hash;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# 方式三：基于请求头或 Cookie 哈希
upstream backend {
    hash $cookie_jsessionid consistent;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}
```

## HTTPS 配置

### 基本 HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name secure.example.com;

    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    # SSL 协议版本
    ssl_protocols TLSv1.2 TLSv1.3;

    # 加密套件（推荐配置）
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;

    # SSL 会话缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/nginx/ssl/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;

    root /var/www/secure;
    index index.html;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name secure.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Let's Encrypt 免费证书

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx

# 自动获取证书并配置 Nginx
certbot --nginx -d example.com -d www.example.com

# 自动续期（添加到 crontab）
0 0 * * * /usr/bin/certbot renew --quiet
```

```nginx
# Certbot 自动生成的配置
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... 其他配置
}
```

### 安全响应头配置

```nginx
server {
    listen 443 ssl http2;
    server_name secure.example.com;

    # HSTS（强制 HTTPS）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 防止点击劫持
    add_header X-Frame-Options "SAMEORIGIN" always;

    # XSS 保护
    add_header X-XSS-Protection "1; mode=block" always;

    # 禁止 MIME 类型嗅探
    add_header X-Content-Type-Options "nosniff" always;

    # 内容安全策略
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # 引用策略
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ... 其他配置
}
```

## 缓存配置

### 代理缓存

```nginx
# 定义缓存区域
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m
                 max_size=10g inactive=60m use_temp_path=off;

server {
    listen 80;
    server_name cached.example.com;

    location / {
        proxy_pass http://backend;

        # 启用缓存
        proxy_cache my_cache;
        proxy_cache_key $scheme$proxy_host$request_uri;

        # 缓存有效期
        proxy_cache_valid 200 301 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_valid any 5m;

        # 缓存条件
        proxy_cache_min_uses 3;  # 请求3次后才缓存
        proxy_cache_methods GET HEAD;

        # 缓存绕过条件
        proxy_cache_bypass $cookie_nocache $arg_nocache;
        proxy_no_cache $cookie_nocache $arg_nocache;

        # 添加缓存状态头
        add_header X-Cache-Status $upstream_cache_status;

        # 后端不可用时使用过期缓存
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_cache_lock on;
    }
}
```

### FastCGI 缓存（PHP）

```nginx
# 定义 FastCGI 缓存
fastcgi_cache_path /var/cache/nginx/fastcgi levels=1:2 keys_zone=php_cache:10m max_size=1g inactive=60m;

server {
    listen 80;
    server_name php.example.com;
    root /var/www/php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # 启用 FastCGI 缓存
        fastcgi_cache php_cache;
        fastcgi_cache_key $scheme$request_method$host$request_uri;
        fastcgi_cache_valid 200 60m;
        fastcgi_cache_valid 404 1m;

        # 不缓存 POST 请求和带 Cookie 的请求
        fastcgi_cache_bypass $request_method $http_cookie;
        fastcgi_no_cache $request_method $http_cookie;

        add_header X-FastCGI-Cache $upstream_cache_status;
    }
}
```

### 浏览器缓存

```nginx
server {
    listen 80;
    server_name static.example.com;
    root /var/www/static;

    # 长期缓存（带版本号的资源）
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        etag off;
    }

    # 中期缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # 短期缓存
    location ~* \.(html|htm)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # 禁止缓存
    location /api/ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
        add_header Pragma "no-cache";
    }
}
```

## 限流与访问控制

### 请求限流

```nginx
# 定义限流区域
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=1r/s;

server {
    listen 80;
    server_name api.example.com;

    # 全局限流
    location / {
        limit_req zone=req_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://backend;
    }

    # 登录接口严格限流
    location /api/login {
        limit_req zone=login_limit burst=5;
        limit_req_status 429;

        proxy_pass http://backend;
    }
}
```

### 连接数限制

```nginx
# 定义连接数限制区域
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn_zone $server_name zone=server_limit:10m;

server {
    listen 80;
    server_name download.example.com;

    # 每个 IP 最多 10 个连接
    limit_conn conn_limit 10;

    # 整个服务器最多 1000 个连接
    limit_conn server_limit 1000;

    # 限制下载速度
    location /files/ {
        limit_rate_after 10m;  # 前 10MB 不限速
        limit_rate 1m;          # 之后限速 1MB/s
    }
}
```

### IP 访问控制

```nginx
server {
    listen 80;
    server_name admin.example.com;

    # IP 白名单
    location /admin/ {
        allow 192.168.1.0/24;    # 允许内网
        allow 10.0.0.100;        # 允许特定 IP
        deny all;                 # 拒绝其他

        proxy_pass http://admin-backend;
    }

    # IP 黑名单
    location / {
        deny 192.168.1.50;       # 拒绝特定 IP
        deny 10.0.0.0/8;         # 拒绝整个网段
        allow all;                # 允许其他

        proxy_pass http://backend;
    }
}
```

### 基本认证

```bash
# 创建密码文件
htpasswd -c /etc/nginx/.htpasswd admin
```

```nginx
server {
    listen 80;
    server_name protected.example.com;

    location /secure/ {
        auth_basic "Restricted Area";
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass http://backend;
    }
}
```

### 防止恶意请求

```nginx
server {
    listen 80;
    server_name secure.example.com;

    # 防止请求体过大
    client_max_body_size 10m;
    client_body_buffer_size 128k;

    # 防止 Host 头注入
    if ($host !~* ^(example\.com|www\.example\.com)$) {
        return 444;
    }

    # 阻止特定 User-Agent
    if ($http_user_agent ~* (wget|curl|scrapy|bot)) {
        return 403;
    }

    # 防止 SQL 注入和 XSS（简单示例）
    if ($query_string ~* "(<|>|'|%22|%27|%3C|%3E)") {
        return 403;
    }

    # 隐藏 Nginx 版本号
    server_tokens off;
}
```

## 性能优化

### Worker 进程优化

```nginx
# 工作进程数量（通常设置为 CPU 核心数）
worker_processes auto;

# 绑定 CPU（提高缓存命中率）
worker_cpu_affinity auto;

# 单进程最大文件描述符数量
worker_rlimit_nofile 65535;

events {
    # 单进程最大连接数
    worker_connections 65535;

    # 使用高效的事件模型
    use epoll;

    # 一次接受多个连接
    multi_accept on;
}
```

### 网络优化

```nginx
http {
    # 启用 sendfile（零拷贝）
    sendfile on;

    # 优化 sendfile
    tcp_nopush on;
    tcp_nodelay on;

    # 连接超时
    keepalive_timeout 65;
    keepalive_requests 1000;

    # 客户端超时
    client_header_timeout 60;
    client_body_timeout 60;
    send_timeout 60;

    # 重置超时连接
    reset_timedout_connection on;

    # 哈希表大小优化
    types_hash_max_size 2048;
    server_names_hash_bucket_size 64;
}
```

### Gzip 压缩

```nginx
http {
    # 启用 Gzip
    gzip on;

    # 最小压缩长度
    gzip_min_length 1024;

    # 压缩级别（1-9，推荐 4-6）
    gzip_comp_level 5;

    # 压缩缓冲区
    gzip_buffers 16 8k;

    # HTTP 版本
    gzip_http_version 1.1;

    # 压缩类型
    gzip_types
        text/plain
        text/css
        text/javascript
        text/xml
        application/json
        application/javascript
        application/xml
        application/xml+rss
        application/x-javascript
        image/svg+xml;

    # 代理请求也压缩
    gzip_proxied any;

    # 添加 Vary 头
    gzip_vary on;

    # 禁用 IE6 压缩
    gzip_disable "msie6";
}
```

### 开启 Brotli 压缩（更高压缩率）

```nginx
# 需要编译 ngx_brotli 模块
http {
    brotli on;
    brotli_comp_level 6;
    brotli_buffers 16 8k;
    brotli_min_length 20;
    brotli_types
        text/plain
        text/css
        text/javascript
        text/xml
        application/json
        application/javascript
        application/xml
        image/svg+xml;
}
```

### 完整优化配置示例

```nginx
user nginx;
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志优化
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    '$request_time $upstream_response_time';

    access_log /var/log/nginx/access.log main buffer=32k flush=5s;

    # 网络优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;

    # 缓冲区优化
    client_body_buffer_size 128k;
    client_max_body_size 100m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 32k;

    # 压缩优化
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;

    # 安全配置
    server_tokens off;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # 缓存配置
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cache:100m
                     max_size=10g inactive=60m use_temp_path=off;

    include /etc/nginx/conf.d/*.conf;
}
```

## 常用命令与调试

### 常用管理命令

```bash
# 检查配置文件语法
nginx -t

# 重新加载配置（平滑重启）
nginx -s reload

# 快速停止
nginx -s stop

# 优雅停止（完成现有请求）
nginx -s quit

# 重新打开日志文件
nginx -s reopen

# 查看编译参数
nginx -V

# 指定配置文件启动
nginx -c /path/to/nginx.conf
```

### 日志分析

```bash
# 查看访问最多的 IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# 查看访问最多的 URL
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# 查看响应状态码分布
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 实时监控访问日志
tail -f /var/log/nginx/access.log | awk '{print $1, $7, $9}'

# 查看慢请求（超过 1 秒）
awk '($NF > 1){print $0}' /var/log/nginx/access.log
```

### 性能监控

```nginx
# 启用状态监控
server {
    listen 8080;
    server_name localhost;

    location /nginx_status {
        stub_status on;
        allow 127.0.0.1;
        deny all;
    }
}
```

```bash
# 查看状态
curl http://localhost:8080/nginx_status

# 输出示例：
# Active connections: 291
# server accepts handled requests
#  16630948 16630948 31070465
# Reading: 6 Writing: 179 Waiting: 106
```

## 面试要点

### 核心概念题

**Q1：Nginx 为什么性能高？**

```
答：Nginx 高性能的原因：
1. 事件驱动架构：使用 epoll/kqueue 等高效 I/O 多路复用
2. 异步非阻塞：单线程处理大量并发，无上下文切换开销
3. Master-Worker 模型：Worker 进程独立处理请求，互不影响
4. 内存池设计：减少内存碎片和频繁分配
5. 高效的数据结构：如红黑树、哈希表等
6. sendfile 零拷贝：减少数据拷贝次数
```

**Q2：正向代理和反向代理的区别？**

```
答：
正向代理：
- 代理客户端，客户端知道代理的存在
- 用途：翻墙、访问控制、缓存加速
- 示例：VPN、代理服务器

反向代理：
- 代理服务端，客户端不知道真实服务器
- 用途：负载均衡、安全防护、SSL 终端、缓存
- 示例：Nginx 反向代理后端应用
```

**Q3：Nginx 如何实现热部署？**

```
答：Nginx 热部署流程：
1. 修改配置文件
2. 执行 nginx -t 检查语法
3. 执行 nginx -s reload 重新加载
4. Master 进程创建新的 Worker 进程
5. 新请求由新 Worker 处理
6. 旧 Worker 完成当前请求后优雅退出
```

### 配置实战题

**Q4：如何配置 Nginx 实现动静分离？**

```nginx
server {
    listen 80;
    server_name example.com;

    # 静态资源
    location ~* \.(html|css|js|jpg|png|gif|ico)$ {
        root /var/www/static;
        expires 30d;
        access_log off;
    }

    # 动态请求代理到后端
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Q5：如何配置 Nginx 实现跨域？**

```nginx
location /api/ {
    # CORS 配置
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials true always;

    # 预检请求
    if ($request_method = OPTIONS) {
        return 204;
    }

    proxy_pass http://backend;
}
```

**Q6：Nginx 负载均衡有哪些策略？各适用什么场景？**

```
答：
1. 轮询（默认）：适用于服务器性能相近的场景
2. 权重（weight）：适用于服务器性能不均的场景
3. IP Hash：适用于需要会话保持的场景
4. 最少连接（least_conn）：适用于请求处理时间不均的场景
5. URL Hash：适用于缓存服务器场景
6. fair（第三方）：按响应时间分配，适用于后端性能差异大的场景
```

### 故障排查题

**Q7：Nginx 返回 502 Bad Gateway 怎么排查？**

```
答：502 表示 Nginx 无法连接后端服务器，排查步骤：
1. 检查后端服务是否运行：ps aux | grep backend
2. 检查后端端口是否监听：netstat -tlnp | grep 8080
3. 检查 Nginx 错误日志：tail -f /var/log/nginx/error.log
4. 测试后端直连：curl localhost:8080
5. 检查防火墙规则：iptables -L
6. 检查 upstream 配置是否正确
7. 调整超时配置：proxy_connect_timeout
```

**Q8：Nginx 返回 504 Gateway Timeout 怎么解决？**

```
答：504 表示后端响应超时，解决方案：
1. 增加超时配置：
   proxy_connect_timeout 300;
   proxy_send_timeout 300;
   proxy_read_timeout 300;

2. 优化后端性能，减少响应时间
3. 检查网络延迟问题
4. 对慢请求做异步处理
5. 添加适当的缓存减少后端压力
```

### 性能优化题

**Q9：如何优化 Nginx 处理大量并发连接？**

```nginx
# 系统级优化
# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# Nginx 配置优化
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 10000;
}
```

**Q10：生产环境 Nginx 配置检查清单**

```
1. 性能配置：
   - worker_processes 设置为 CPU 核心数
   - worker_connections 设置合理值
   - 开启 sendfile、tcp_nopush、tcp_nodelay
   - 配置 Gzip 压缩

2. 安全配置：
   - 关闭 server_tokens
   - 配置 HTTPS 和安全响应头
   - 限制请求大小和频率
   - 设置访问控制

3. 日志配置：
   - 自定义日志格式包含关键信息
   - 配置日志轮转
   - 错误日志级别设置合理

4. 监控配置：
   - 开启 stub_status
   - 配置健康检查
   - 设置告警阈值
```

## 总结

Nginx 作为高性能的 Web 服务器和反向代理，其核心优势在于事件驱动的异步架构。掌握 Nginx 需要理解其工作原理、熟悉配置语法、掌握各种应用场景的最佳实践。在生产环境中，合理的配置和持续的性能优化是保证服务稳定高效的关键。

**核心知识点回顾**：

1. **架构原理**：Master-Worker 模型、事件驱动、异步非阻塞
2. **配置结构**：全局块、events块、http块、server块、location块
3. **Location 匹配**：精确匹配 > 前缀匹配(^~) > 正则匹配 > 普通前缀
4. **反向代理**：proxy_pass、请求头传递、超时配置
5. **负载均衡**：轮询、权重、IP Hash、最少连接、一致性哈希
6. **HTTPS**：证书配置、协议版本、加密套件、HSTS
7. **缓存策略**：代理缓存、浏览器缓存、缓存控制头
8. **限流控制**：请求限流、连接限流、访问控制
9. **性能优化**：Worker 配置、网络优化、压缩、缓存

持续学习 Nginx 的高级特性和与其他组件的集成，将帮助你构建更加健壮和高效的 Web 架构。
