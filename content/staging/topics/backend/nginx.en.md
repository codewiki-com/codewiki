---
title: Nginx Complete Guide
description: Master Nginx for web serving and reverse proxy
track: backend
section: deployment
difficulty: intermediate
tags:
  - Nginx
  - Reverse Proxy
  - Load Balancing
  - Web Server
status: imported
origin: old/src/content/docs/devops/nginx.en.md
divergence: 0.218
issues: []
legacy:
  category: DevOps
  subcategory: Web Server
  order: 12
  lastUpdated: 2026-01-07
---

Nginx (pronounced "engine-x") is a high-performance HTTP server and reverse proxy server, originally developed by Russian programmer Igor Sysoev in 2004. Today, Nginx has become one of the most popular web servers in the world, powering over 30% of all websites, including major enterprises like Netflix, Airbnb, and Dropbox.

## Nginx Architecture and How It Works

### Event-Driven Architecture

Unlike Apache's multi-process/multi-threaded model, Nginx adopts an **event-driven** and **asynchronous non-blocking** architecture, enabling it to handle massive concurrent connections with limited resources.

```
+-------------------------------------------------------------+
|                        Master Process                        |
|  - Reads and validates configuration files                   |
|  - Manages Worker processes                                  |
|  - Handles graceful upgrades (hot deployment)                |
+-------------------------------------------------------------+
                              |
        +---------------------+---------------------+
        v                     v                     v
+---------------+    +---------------+    +---------------+
| Worker Process|    | Worker Process|    | Worker Process|
|   (CPU Core)  |    |   (CPU Core)  |    |   (CPU Core)  |
|               |    |               |    |               |
|  Event Loop   |    |  Event Loop   |    |  Event Loop   |
| (epoll/kqueue)|    | (epoll/kqueue)|    | (epoll/kqueue)|
+---------------+    +---------------+    +---------------+
```

### Process Model

Nginx employs a **Master-Worker** process model:

- **Master Process**: Responsible for reading configuration, managing Worker processes, and handling signals
- **Worker Processes**: Actually process client requests; typically set to the number of CPU cores
- **Cache Manager/Loader**: Manages caching (optional)

```bash
# View Nginx processes
ps aux | grep nginx

# Example output:
# root      1234  0.0  0.1  nginx: master process
# www-data  1235  0.0  0.2  nginx: worker process
# www-data  1236  0.0  0.2  nginx: worker process
```

### Request Processing Flow

```
Client Request --> Master Assigns --> Worker Receives
                                           |
                                    Parse Request Headers
                                           |
                              +------------+------------+
                              v                         v
                        Static Resources          Proxy Request
                              |                         |
                        Read File               Forward to Backend
                              |                         |
                              +------------+------------+
                                           |
                                    Return Response
```

### Apache vs Nginx Comparison

| Feature | Apache | Nginx |
|---------|--------|-------|
| Architecture | Multi-process/Multi-threaded | Event-driven |
| Concurrency Performance | Medium | Excellent |
| Memory Consumption | Higher | Lower |
| Static Files | Average | Extremely Fast |
| Dynamic Content | Modules handle directly | Requires proxy to backend |
| Configuration | .htaccess | Centralized config |
| Module Loading | Dynamic loading | Compiled-in |

## Configuration File Structure

### Configuration File Locations

```bash
# Main configuration file
/etc/nginx/nginx.conf

# Site configuration directories
/etc/nginx/conf.d/          # General configurations
/etc/nginx/sites-available/ # Available sites (Debian/Ubuntu)
/etc/nginx/sites-enabled/   # Enabled sites

# Other important directories
/var/log/nginx/             # Log directory
/var/www/html/              # Default web root directory
```

### Configuration File Hierarchy

```nginx
# Global block: Affects overall Nginx operation
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

# Events block: Network connection configuration
events {
    worker_connections 1024;
    use epoll;              # Use epoll on Linux
    multi_accept on;        # Accept multiple connections at once
}

# HTTP block: HTTP server configuration
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Log format
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    # Performance optimization
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Server block: Virtual host configuration
    server {
        listen 80;
        server_name example.com;
        root /var/www/html;

        # Location block: URL matching rules
        location / {
            try_files $uri $uri/ =404;
        }

        location /api {
            proxy_pass http://backend;
        }
    }

    # Include other configuration files
    include /etc/nginx/conf.d/*.conf;
}
```

### Location Matching Rules

The Location directive matches URIs according to the following priority:

```nginx
# Exact match (highest priority)
location = /exact {
    # Only matches /exact
}

# Prefix match (^~ stops regex checking)
location ^~ /images/ {
    # Matches URIs starting with /images/, skips regex check
}

# Regex match (case-sensitive)
location ~ \.php$ {
    # Matches URIs ending with .php
}

# Regex match (case-insensitive)
location ~* \.(jpg|jpeg|png|gif)$ {
    # Matches image files
}

# Standard prefix match (lowest priority)
location /static/ {
    # Matches URIs starting with /static/
}

# Default match
location / {
    # Matches all requests
}
```

**Priority Summary**: `=` > `^~` > `~` / `~*` > Standard prefix (longest match) > `/`

## Static File Serving

### Basic Static File Configuration

```nginx
server {
    listen 80;
    server_name static.example.com;
    root /var/www/static;

    # Default index pages
    index index.html index.htm;

    # Static resource caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;  # Disable logging for static resources
    }

    # HTML files - no caching
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### SPA Application Configuration (Vue/React)

```nginx
server {
    listen 80;
    server_name app.example.com;
    root /var/www/spa;
    index index.html;

    # SPA routing support: Return index.html for all requests
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### File Download Service

```nginx
server {
    listen 80;
    server_name download.example.com;
    root /var/www/downloads;

    location /files/ {
        # Enable directory listing
        autoindex on;
        autoindex_exact_size off;  # Show human-readable sizes
        autoindex_localtime on;     # Show local time

        # Large file optimization
        sendfile on;
        tcp_nopush on;

        # Limit download speed (1MB per second)
        limit_rate 1m;

        # Set download filename
        if ($request_filename ~* ^.*?/([^/]*?)$) {
            set $filename $1;
        }
        add_header Content-Disposition "attachment; filename=$filename";
    }
}
```

## Reverse Proxy Configuration

### Basic Reverse Proxy

```nginx
upstream backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;

        # Pass real client information
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout configuration
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer configuration
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
```

### WebSocket Proxy

```nginx
server {
    listen 80;
    server_name ws.example.com;

    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        # WebSocket essential configuration
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Long connection timeout
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

### Multiple Backend Services Proxy

```nginx
server {
    listen 80;
    server_name gateway.example.com;

    # User service
    location /api/users/ {
        proxy_pass http://user-service:3001/;
        include /etc/nginx/proxy_params;
    }

    # Order service
    location /api/orders/ {
        proxy_pass http://order-service:3002/;
        include /etc/nginx/proxy_params;
    }

    # Product service
    location /api/products/ {
        proxy_pass http://product-service:3003/;
        include /etc/nginx/proxy_params;
    }

    # Frontend application
    location / {
        proxy_pass http://frontend:3000;
        include /etc/nginx/proxy_params;
    }
}

# /etc/nginx/proxy_params common configuration
# proxy_set_header Host $host;
# proxy_set_header X-Real-IP $remote_addr;
# proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
# proxy_set_header X-Forwarded-Proto $scheme;
```

## Load Balancing Strategies

### Load Balancing Algorithms

```nginx
# Round Robin (default): Distributes requests sequentially
upstream backend_round_robin {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

# Weighted: Distributes by weight ratio
upstream backend_weighted {
    server 192.168.1.101:8080 weight=5;  # 50% of requests
    server 192.168.1.102:8080 weight=3;  # 30% of requests
    server 192.168.1.103:8080 weight=2;  # 20% of requests
}

# IP Hash: Same IP accesses same backend (session persistence)
upstream backend_ip_hash {
    ip_hash;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

# Least Connections: Prioritizes servers with fewest connections
upstream backend_least_conn {
    least_conn;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

# Consistent Hash: Distributes based on specified key
upstream backend_hash {
    hash $request_uri consistent;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}
```

### Health Checks and Failover

```nginx
upstream backend {
    server 192.168.1.101:8080 weight=5 max_fails=3 fail_timeout=30s;
    server 192.168.1.102:8080 weight=3 max_fails=3 fail_timeout=30s;
    server 192.168.1.103:8080 backup;  # Backup server
    server 192.168.1.104:8080 down;    # Marked as unavailable

    # Keep-alive configuration
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
        proxy_set_header Connection "";  # Enable keep-alive

        # Failover configuration
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
}
```

### Session Persistence (Sticky Sessions)

```nginx
# Method 1: Cookie-based session persistence (requires nginx-sticky-module)
upstream backend {
    sticky cookie srv_id expires=1h domain=.example.com path=/;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# Method 2: IP Hash based
upstream backend {
    ip_hash;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# Method 3: Hash based on request header or cookie
upstream backend {
    hash $cookie_jsessionid consistent;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}
```

## HTTPS Configuration

### Basic HTTPS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name secure.example.com;

    # SSL certificate configuration
    ssl_certificate /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    # SSL protocol versions
    ssl_protocols TLSv1.2 TLSv1.3;

    # Cipher suites (recommended configuration)
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;

    # SSL session cache
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

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name secure.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Let's Encrypt Free Certificates

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Automatically obtain certificate and configure Nginx
certbot --nginx -d example.com -d www.example.com

# Automatic renewal (add to crontab)
0 0 * * * /usr/bin/certbot renew --quiet
```

```nginx
# Certbot auto-generated configuration
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... other configurations
}
```

### Security Response Headers

```nginx
server {
    listen 443 ssl http2;
    server_name secure.example.com;

    # HSTS (force HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Prevent clickjacking
    add_header X-Frame-Options "SAMEORIGIN" always;

    # XSS protection
    add_header X-XSS-Protection "1; mode=block" always;

    # Prevent MIME type sniffing
    add_header X-Content-Type-Options "nosniff" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Referrer Policy
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ... other configurations
}
```

## Caching Configuration

### Proxy Cache

```nginx
# Define cache zone
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m
                 max_size=10g inactive=60m use_temp_path=off;

server {
    listen 80;
    server_name cached.example.com;

    location / {
        proxy_pass http://backend;

        # Enable caching
        proxy_cache my_cache;
        proxy_cache_key $scheme$proxy_host$request_uri;

        # Cache validity
        proxy_cache_valid 200 301 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_valid any 5m;

        # Cache conditions
        proxy_cache_min_uses 3;  # Cache after 3 requests
        proxy_cache_methods GET HEAD;

        # Cache bypass conditions
        proxy_cache_bypass $cookie_nocache $arg_nocache;
        proxy_no_cache $cookie_nocache $arg_nocache;

        # Add cache status header
        add_header X-Cache-Status $upstream_cache_status;

        # Use stale cache when backend unavailable
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_cache_lock on;
    }
}
```

### FastCGI Cache (PHP)

```nginx
# Define FastCGI cache
fastcgi_cache_path /var/cache/nginx/fastcgi levels=1:2 keys_zone=php_cache:10m max_size=1g inactive=60m;

server {
    listen 80;
    server_name php.example.com;
    root /var/www/php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # Enable FastCGI cache
        fastcgi_cache php_cache;
        fastcgi_cache_key $scheme$request_method$host$request_uri;
        fastcgi_cache_valid 200 60m;
        fastcgi_cache_valid 404 1m;

        # Don't cache POST requests and requests with cookies
        fastcgi_cache_bypass $request_method $http_cookie;
        fastcgi_no_cache $request_method $http_cookie;

        add_header X-FastCGI-Cache $upstream_cache_status;
    }
}
```

### Browser Caching

```nginx
server {
    listen 80;
    server_name static.example.com;
    root /var/www/static;

    # Long-term cache (versioned resources)
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        etag off;
    }

    # Medium-term cache
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # Short-term cache
    location ~* \.(html|htm)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # No cache
    location /api/ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
        add_header Pragma "no-cache";
    }
}
```

## Rate Limiting and Access Control

### Request Rate Limiting

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=1r/s;

server {
    listen 80;
    server_name api.example.com;

    # Global rate limiting
    location / {
        limit_req zone=req_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://backend;
    }

    # Strict rate limiting for login endpoint
    location /api/login {
        limit_req zone=login_limit burst=5;
        limit_req_status 429;

        proxy_pass http://backend;
    }
}
```

### Connection Limiting

```nginx
# Define connection limit zones
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn_zone $server_name zone=server_limit:10m;

server {
    listen 80;
    server_name download.example.com;

    # Maximum 10 connections per IP
    limit_conn conn_limit 10;

    # Maximum 1000 connections for entire server
    limit_conn server_limit 1000;

    # Limit download speed
    location /files/ {
        limit_rate_after 10m;  # No limit for first 10MB
        limit_rate 1m;          # Then limit to 1MB/s
    }
}
```

### IP Access Control

```nginx
server {
    listen 80;
    server_name admin.example.com;

    # IP whitelist
    location /admin/ {
        allow 192.168.1.0/24;    # Allow internal network
        allow 10.0.0.100;        # Allow specific IP
        deny all;                 # Deny others

        proxy_pass http://admin-backend;
    }

    # IP blacklist
    location / {
        deny 192.168.1.50;       # Deny specific IP
        deny 10.0.0.0/8;         # Deny entire subnet
        allow all;                # Allow others

        proxy_pass http://backend;
    }
}
```

### Basic Authentication

```bash
# Create password file
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

### Preventing Malicious Requests

```nginx
server {
    listen 80;
    server_name secure.example.com;

    # Prevent oversized request body
    client_max_body_size 10m;
    client_body_buffer_size 128k;

    # Prevent Host header injection
    if ($host !~* ^(example\.com|www\.example\.com)$) {
        return 444;
    }

    # Block specific User-Agents
    if ($http_user_agent ~* (wget|curl|scrapy|bot)) {
        return 403;
    }

    # Prevent SQL injection and XSS (simple example)
    if ($query_string ~* "(<|>|'|%22|%27|%3C|%3E)") {
        return 403;
    }

    # Hide Nginx version number
    server_tokens off;
}
```

## Performance Optimization

### Worker Process Optimization

```nginx
# Number of worker processes (typically set to CPU cores)
worker_processes auto;

# CPU affinity (improves cache hit rate)
worker_cpu_affinity auto;

# Maximum file descriptors per process
worker_rlimit_nofile 65535;

events {
    # Maximum connections per worker
    worker_connections 65535;

    # Use efficient event model
    use epoll;

    # Accept multiple connections at once
    multi_accept on;
}
```

### Network Optimization

```nginx
http {
    # Enable sendfile (zero-copy)
    sendfile on;

    # Optimize sendfile
    tcp_nopush on;
    tcp_nodelay on;

    # Connection timeout
    keepalive_timeout 65;
    keepalive_requests 1000;

    # Client timeout
    client_header_timeout 60;
    client_body_timeout 60;
    send_timeout 60;

    # Reset timed-out connections
    reset_timedout_connection on;

    # Hash table size optimization
    types_hash_max_size 2048;
    server_names_hash_bucket_size 64;
}
```

### Gzip Compression

```nginx
http {
    # Enable Gzip
    gzip on;

    # Minimum compression length
    gzip_min_length 1024;

    # Compression level (1-9, recommended 4-6)
    gzip_comp_level 5;

    # Compression buffer
    gzip_buffers 16 8k;

    # HTTP version
    gzip_http_version 1.1;

    # Compression types
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

    # Compress proxied requests too
    gzip_proxied any;

    # Add Vary header
    gzip_vary on;

    # Disable for IE6
    gzip_disable "msie6";
}
```

### Enabling Brotli Compression (Higher Compression Ratio)

```nginx
# Requires ngx_brotli module compilation
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

### Complete Optimization Configuration Example

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

    # Log optimization
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    '$request_time $upstream_response_time';

    access_log /var/log/nginx/access.log main buffer=32k flush=5s;

    # Network optimization
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;

    # Buffer optimization
    client_body_buffer_size 128k;
    client_max_body_size 100m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 32k;

    # Compression optimization
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;

    # Security configuration
    server_tokens off;

    # Rate limiting configuration
    limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Cache configuration
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cache:100m
                     max_size=10g inactive=60m use_temp_path=off;

    include /etc/nginx/conf.d/*.conf;
}
```

## Common Commands and Debugging

### Common Management Commands

```bash
# Check configuration file syntax
nginx -t

# Reload configuration (graceful restart)
nginx -s reload

# Quick stop
nginx -s stop

# Graceful stop (complete existing requests)
nginx -s quit

# Reopen log files
nginx -s reopen

# View compile parameters
nginx -V

# Start with specific configuration file
nginx -c /path/to/nginx.conf
```

### Log Analysis

```bash
# View most accessed IPs
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# View most accessed URLs
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# View response status code distribution
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Real-time access log monitoring
tail -f /var/log/nginx/access.log | awk '{print $1, $7, $9}'

# View slow requests (over 1 second)
awk '($NF > 1){print $0}' /var/log/nginx/access.log
```

### Performance Monitoring

```nginx
# Enable status monitoring
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
# View status
curl http://localhost:8080/nginx_status

# Example output:
# Active connections: 291
# server accepts handled requests
#  16630948 16630948 31070465
# Reading: 6 Writing: 179 Waiting: 106
```

## Interview Key Points

### Core Concept Questions

**Q1: Why is Nginx so performant?**

```
Answer: Reasons for Nginx's high performance:
1. Event-driven architecture: Uses efficient I/O multiplexing like epoll/kqueue
2. Asynchronous non-blocking: Single thread handles many concurrent connections, no context switching overhead
3. Master-Worker model: Worker processes handle requests independently without interference
4. Memory pool design: Reduces memory fragmentation and frequent allocation
5. Efficient data structures: Red-black trees, hash tables, etc.
6. sendfile zero-copy: Reduces data copy operations
```

**Q2: What's the difference between forward proxy and reverse proxy?**

```
Answer:
Forward Proxy:
- Proxies the client; client is aware of the proxy
- Use cases: Bypassing restrictions, access control, caching
- Examples: VPN, proxy servers

Reverse Proxy:
- Proxies the server; client is unaware of real server
- Use cases: Load balancing, security protection, SSL termination, caching
- Examples: Nginx reverse proxying backend applications
```

**Q3: How does Nginx achieve hot deployment?**

```
Answer: Nginx hot deployment process:
1. Modify configuration file
2. Run nginx -t to check syntax
3. Run nginx -s reload to reload
4. Master process creates new Worker processes
5. New requests are handled by new Workers
6. Old Workers gracefully exit after completing current requests
```

### Practical Configuration Questions

**Q4: How to configure Nginx for static/dynamic separation?**

```nginx
server {
    listen 80;
    server_name example.com;

    # Static resources
    location ~* \.(html|css|js|jpg|png|gif|ico)$ {
        root /var/www/static;
        expires 30d;
        access_log off;
    }

    # Dynamic requests proxy to backend
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Q5: How to configure Nginx for CORS (Cross-Origin Resource Sharing)?**

```nginx
location /api/ {
    # CORS configuration
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials true always;

    # Preflight requests
    if ($request_method = OPTIONS) {
        return 204;
    }

    proxy_pass http://backend;
}
```

**Q6: What load balancing strategies does Nginx offer? When to use each?**

```
Answer:
1. Round Robin (default): For servers with similar performance
2. Weighted: For servers with varying performance levels
3. IP Hash: When session persistence is needed
4. Least Connections: When request processing times vary significantly
5. URL Hash: For cache server scenarios
6. Fair (third-party): Distributes by response time, for backends with large performance differences
```

### Troubleshooting Questions

**Q7: How to troubleshoot Nginx 502 Bad Gateway?**

```
Answer: 502 indicates Nginx cannot connect to backend server. Troubleshooting steps:
1. Check if backend service is running: ps aux | grep backend
2. Check if backend port is listening: netstat -tlnp | grep 8080
3. Check Nginx error log: tail -f /var/log/nginx/error.log
4. Test direct backend connection: curl localhost:8080
5. Check firewall rules: iptables -L
6. Verify upstream configuration is correct
7. Adjust timeout configuration: proxy_connect_timeout
```

**Q8: How to resolve Nginx 504 Gateway Timeout?**

```
Answer: 504 indicates backend response timeout. Solutions:
1. Increase timeout configuration:
   proxy_connect_timeout 300;
   proxy_send_timeout 300;
   proxy_read_timeout 300;

2. Optimize backend performance to reduce response time
3. Check network latency issues
4. Handle slow requests asynchronously
5. Add appropriate caching to reduce backend load
```

### Performance Optimization Questions

**Q9: How to optimize Nginx for high concurrent connections?**

```nginx
# System-level optimization
# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# Nginx configuration optimization
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

**Q10: Production Environment Nginx Configuration Checklist**

```
1. Performance Configuration:
   - Set worker_processes to CPU core count
   - Set worker_connections to reasonable value
   - Enable sendfile, tcp_nopush, tcp_nodelay
   - Configure Gzip compression

2. Security Configuration:
   - Disable server_tokens
   - Configure HTTPS and security headers
   - Limit request size and rate
   - Set access controls

3. Logging Configuration:
   - Customize log format with key information
   - Configure log rotation
   - Set appropriate error log level

4. Monitoring Configuration:
   - Enable stub_status
   - Configure health checks
   - Set alert thresholds
```

## Summary

Nginx, as a high-performance web server and reverse proxy, derives its core advantage from its event-driven asynchronous architecture. Mastering Nginx requires understanding its working principles, becoming familiar with configuration syntax, and grasping best practices for various use cases. In production environments, proper configuration and continuous performance optimization are key to ensuring stable and efficient service.

**Key Knowledge Points Review**:

1. **Architecture Principles**: Master-Worker model, event-driven, asynchronous non-blocking
2. **Configuration Structure**: Global block, events block, http block, server block, location block
3. **Location Matching**: Exact match > Prefix match (^~) > Regex match > Standard prefix
4. **Reverse Proxy**: proxy_pass, header forwarding, timeout configuration
5. **Load Balancing**: Round robin, weighted, IP hash, least connections, consistent hash
6. **HTTPS**: Certificate configuration, protocol versions, cipher suites, HSTS
7. **Caching Strategies**: Proxy cache, browser cache, cache control headers
8. **Rate Limiting**: Request rate limiting, connection limiting, access control
9. **Performance Optimization**: Worker configuration, network optimization, compression, caching

## Further Reading

### Official Resources

- [Nginx Official Documentation](https://nginx.org/en/docs/)
- [Nginx Admin Guide](https://docs.nginx.com/nginx/admin-guide/)
- [Nginx Directives Index](https://nginx.org/en/docs/dirindex.html)

### Advanced Topics

- **High Availability**: Nginx Plus, Keepalived, HAProxy integration
- **Container Deployment**: Nginx in Docker, Kubernetes Ingress Controller
- **Security Hardening**: ModSecurity WAF, SSL Labs best practices
- **Observability**: Prometheus nginx-exporter, OpenTelemetry integration

### Recommended Books

- "Nginx HTTP Server" by Clement Nedelcu
- "Mastering Nginx" by Dimitri Aivaliotis
- "High Performance Browser Networking" by Ilya Grigorik

### Community Resources

- [Nginx Community](https://community.nginx.org/)
- [Nginx GitHub](https://github.com/nginx/nginx)
- [Server Fault - Nginx Tag](https://serverfault.com/questions/tagged/nginx)

Continuous learning of Nginx's advanced features and integration with other components will help you build more robust and efficient web architectures.
