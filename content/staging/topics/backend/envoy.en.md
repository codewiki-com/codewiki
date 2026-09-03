---
title: Envoy Proxy
description: Learn Envoy proxy configuration and usage
track: backend
section: deployment
difficulty: advanced
tags:
  - Envoy
  - proxy
  - load balancing
  - service mesh
status: imported
origin: old/src/content/docs/devops/envoy.en.md
divergence: 0.217
issues: []
legacy:
  category: DevOps
  subcategory: Proxy
  order: 25
  lastUpdated: 2026-01-07
---

Envoy is a high-performance, open-source edge and service proxy designed for cloud-native applications. Originally developed at Lyft and later donated to the Cloud Native Computing Foundation (CNCF), Envoy has become the de facto standard for service mesh data planes, powering projects like Istio, AWS App Mesh, and Consul Connect.

## Envoy Architecture Overview

### Core Design Philosophy

Envoy was designed with several key principles that distinguish it from traditional proxies:

```
+------------------------------------------------------------------+
|                        Envoy Proxy                                |
|                                                                   |
|  +------------+    +------------+    +------------+               |
|  |  Listener  |    |  Listener  |    |  Listener  |               |
|  |  (Port 80) |    | (Port 443) |    | (Port 8080)|               |
|  +-----+------+    +-----+------+    +-----+------+               |
|        |                 |                 |                      |
|        v                 v                 v                      |
|  +----------------------------------------------------+          |
|  |              Filter Chain Manager                   |          |
|  +----------------------------------------------------+          |
|        |                 |                 |                      |
|        v                 v                 v                      |
|  +-----------+    +-----------+    +-----------+                 |
|  |  Network  |    |   HTTP    |    |   gRPC    |                 |
|  |  Filters  |    |  Filters  |    |  Filters  |                 |
|  +-----------+    +-----------+    +-----------+                 |
|        |                 |                 |                      |
|        v                 v                 v                      |
|  +----------------------------------------------------+          |
|  |                  Router / Cluster Manager           |          |
|  +----------------------------------------------------+          |
|        |                 |                 |                      |
|        v                 v                 v                      |
|  +------------+    +------------+    +------------+               |
|  |  Cluster A |    |  Cluster B |    |  Cluster C |               |
|  | (upstream) |    | (upstream) |    | (upstream) |               |
|  +------------+    +------------+    +------------+               |
+------------------------------------------------------------------+
```

### Key Components

Envoy's architecture consists of several interconnected components:

- **Listeners**: Accept incoming connections on specified ports
- **Filter Chains**: Process network/HTTP traffic through a series of filters
- **Clusters**: Define upstream service endpoints for load balancing
- **Routes**: Map incoming requests to specific clusters
- **Endpoints**: Individual service instances within a cluster

```
Downstream Client --> Listener --> Filter Chain --> Route --> Cluster --> Endpoint --> Upstream Service
```

### Process Model

Unlike Nginx's multi-process model, Envoy uses a single-process, multi-threaded architecture:

```
+---------------------------------------------------------------+
|                      Envoy Process                             |
|                                                                |
|  +-------------------+                                         |
|  |    Main Thread    |                                         |
|  | - xDS management  |                                         |
|  | - Config updates  |                                         |
|  | - Stats collection|                                         |
|  +-------------------+                                         |
|           |                                                    |
|           v                                                    |
|  +-------------------+  +-------------------+  +-------------+ |
|  |   Worker Thread   |  |   Worker Thread   |  |   Worker    | |
|  |   (Connection 1)  |  |   (Connection 2)  |  |   Thread N  | |
|  |                   |  |                   |  |             | |
|  |  - Event loop     |  |  - Event loop     |  |  - Event    | |
|  |  - Filter chain   |  |  - Filter chain   |  |    loop     | |
|  |  - Connection pool|  |  - Connection pool|  |             | |
|  +-------------------+  +-------------------+  +-------------+ |
+---------------------------------------------------------------+
```

### Envoy vs Traditional Proxies

| Feature | Envoy | Nginx | HAProxy |
|---------|-------|-------|---------|
| Configuration | Dynamic (xDS) | Static files | Static files |
| Protocol Support | HTTP/1.1, HTTP/2, gRPC, TCP | HTTP/1.1, HTTP/2 | HTTP/1.1, TCP |
| Observability | Built-in (stats, tracing) | Limited | Limited |
| Service Discovery | Native support | External required | External required |
| Hot Reload | Draining support | Binary upgrade | Soft stop |
| Extension | C++ filters, WASM | C modules, Lua | Lua |

## Listeners Configuration

### Basic Listener Setup

Listeners are the entry points for network connections in Envoy:

```yaml
static_resources:
  listeners:
    - name: http_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                codec_type: AUTO
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: service_backend
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### TLS Listener Configuration

```yaml
listeners:
  - name: https_listener
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 8443
    filter_chains:
      - transport_socket:
          name: envoy.transport_sockets.tls
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
            common_tls_context:
              tls_certificates:
                - certificate_chain:
                    filename: "/etc/envoy/certs/server.crt"
                  private_key:
                    filename: "/etc/envoy/certs/server.key"
              alpn_protocols: ["h2", "http/1.1"]
              tls_params:
                tls_minimum_protocol_version: TLSv1_2
                tls_maximum_protocol_version: TLSv1_3
        filters:
          - name: envoy.filters.network.http_connection_manager
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
              stat_prefix: ingress_https
              codec_type: AUTO
              route_config:
                name: local_route
                virtual_hosts:
                  - name: backend
                    domains: ["*"]
                    routes:
                      - match:
                          prefix: "/"
                        route:
                          cluster: service_backend
              http_filters:
                - name: envoy.filters.http.router
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### Multiple Listener Addresses

```yaml
listeners:
  # IPv4 listener
  - name: listener_ipv4
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 8080
        protocol: TCP
    filter_chains:
      - filters:
          - name: envoy.filters.network.http_connection_manager
            # ... configuration

  # IPv6 listener
  - name: listener_ipv6
    address:
      socket_address:
        address: "::"
        port_value: 8080
        protocol: TCP
        ipv4_compat: true
    filter_chains:
      - filters:
          - name: envoy.filters.network.http_connection_manager
            # ... configuration

  # Unix domain socket listener
  - name: listener_unix
    address:
      pipe:
        path: /var/run/envoy.sock
        mode: 0644
    filter_chains:
      - filters:
          - name: envoy.filters.network.http_connection_manager
            # ... configuration
```

### Listener Filters

```yaml
listeners:
  - name: listener_with_filters
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 8080
    listener_filters:
      # Original destination filter (for transparent proxying)
      - name: envoy.filters.listener.original_dst
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.listener.original_dst.v3.OriginalDst
      # TLS inspector (for SNI-based routing)
      - name: envoy.filters.listener.tls_inspector
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.listener.tls_inspector.v3.TlsInspector
      # HTTP inspector
      - name: envoy.filters.listener.http_inspector
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.listener.http_inspector.v3.HttpInspector
    filter_chains:
      # ... filter chain configuration
```

## Clusters Configuration

### Basic Cluster Definition

Clusters represent upstream services that Envoy can route traffic to:

```yaml
clusters:
  - name: service_backend
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    connect_timeout: 5s
    load_assignment:
      cluster_name: service_backend
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080
```

### Cluster Discovery Types

```yaml
clusters:
  # Static cluster with explicit endpoints
  - name: static_cluster
    type: STATIC
    load_assignment:
      cluster_name: static_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.10
                    port_value: 8080
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.11
                    port_value: 8080

  # DNS-based cluster
  - name: dns_cluster
    type: STRICT_DNS
    dns_lookup_family: V4_ONLY
    dns_refresh_rate: 30s
    load_assignment:
      cluster_name: dns_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: service.example.com
                    port_value: 8080

  # Logical DNS (single endpoint from DNS)
  - name: logical_dns_cluster
    type: LOGICAL_DNS
    dns_lookup_family: V4_ONLY
    load_assignment:
      cluster_name: logical_dns_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: external-api.example.com
                    port_value: 443

  # EDS (Endpoint Discovery Service) cluster
  - name: eds_cluster
    type: EDS
    eds_cluster_config:
      eds_config:
        resource_api_version: V3
        api_config_source:
          api_type: GRPC
          transport_api_version: V3
          grpc_services:
            - envoy_grpc:
                cluster_name: xds_cluster
```

### Health Checking

```yaml
clusters:
  - name: backend_with_health_checks
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    connect_timeout: 5s
    load_assignment:
      cluster_name: backend_with_health_checks
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080
    health_checks:
      # HTTP health check
      - timeout: 5s
        interval: 10s
        unhealthy_threshold: 3
        healthy_threshold: 2
        http_health_check:
          path: "/health"
          expected_statuses:
            - start: 200
              end: 299
          request_headers_to_add:
            - header:
                key: "x-health-check"
                value: "envoy"

      # TCP health check
      - timeout: 5s
        interval: 10s
        unhealthy_threshold: 3
        healthy_threshold: 2
        tcp_health_check:
          send:
            text: "ping"
          receive:
            - text: "pong"

      # gRPC health check
      - timeout: 5s
        interval: 10s
        unhealthy_threshold: 3
        healthy_threshold: 2
        grpc_health_check:
          service_name: "my.service.Health"
```

### Circuit Breaking

```yaml
clusters:
  - name: backend_with_circuit_breaker
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    connect_timeout: 5s
    load_assignment:
      cluster_name: backend_with_circuit_breaker
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080
    circuit_breakers:
      thresholds:
        - priority: DEFAULT
          max_connections: 100
          max_pending_requests: 100
          max_requests: 1000
          max_retries: 3
          track_remaining: true
        - priority: HIGH
          max_connections: 200
          max_pending_requests: 200
          max_requests: 2000
          max_retries: 5
```

### Outlier Detection

```yaml
clusters:
  - name: backend_with_outlier_detection
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    connect_timeout: 5s
    load_assignment:
      cluster_name: backend_with_outlier_detection
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080
    outlier_detection:
      consecutive_5xx: 5
      consecutive_gateway_failure: 5
      interval: 10s
      base_ejection_time: 30s
      max_ejection_percent: 50
      success_rate_minimum_hosts: 3
      success_rate_request_volume: 100
      success_rate_stdev_factor: 1900
      failure_percentage_threshold: 50
      failure_percentage_minimum_hosts: 3
      failure_percentage_request_volume: 50
```

## Routes Configuration

### Basic Routing

```yaml
route_config:
  name: local_route
  virtual_hosts:
    - name: backend_service
      domains: ["api.example.com"]
      routes:
        # Exact path match
        - match:
            path: "/api/v1/users"
          route:
            cluster: users_service

        # Prefix match
        - match:
            prefix: "/api/v1/"
          route:
            cluster: api_v1_service

        # Regex match
        - match:
            safe_regex:
              google_re2: {}
              regex: "^/users/[0-9]+$"
          route:
            cluster: users_service

        # Default route
        - match:
            prefix: "/"
          route:
            cluster: default_service
```

### Header-Based Routing

```yaml
route_config:
  name: header_based_route
  virtual_hosts:
    - name: backend
      domains: ["*"]
      routes:
        # Route based on header presence
        - match:
            prefix: "/api/"
            headers:
              - name: "x-canary"
                present_match: true
          route:
            cluster: canary_cluster

        # Route based on header value
        - match:
            prefix: "/api/"
            headers:
              - name: "x-version"
                exact_match: "v2"
          route:
            cluster: api_v2_cluster

        # Route based on header regex
        - match:
            prefix: "/api/"
            headers:
              - name: "x-tenant-id"
                safe_regex_match:
                  google_re2: {}
                  regex: "^tenant-[0-9]+$"
          route:
            cluster: multi_tenant_cluster

        # Default route
        - match:
            prefix: "/"
          route:
            cluster: default_cluster
```

### Weighted Routing (Traffic Splitting)

```yaml
route_config:
  name: weighted_route
  virtual_hosts:
    - name: backend
      domains: ["*"]
      routes:
        - match:
            prefix: "/"
          route:
            weighted_clusters:
              clusters:
                - name: service_v1
                  weight: 90
                - name: service_v2
                  weight: 10
              total_weight: 100
```

### Route Timeouts and Retries

```yaml
route_config:
  name: route_with_policies
  virtual_hosts:
    - name: backend
      domains: ["*"]
      routes:
        - match:
            prefix: "/api/"
          route:
            cluster: backend_cluster
            timeout: 30s
            idle_timeout: 15s
            retry_policy:
              retry_on: "5xx,reset,connect-failure,retriable-4xx"
              num_retries: 3
              per_try_timeout: 10s
              retry_back_off:
                base_interval: 0.5s
                max_interval: 10s
              retriable_status_codes:
                - 503
                - 504
              retry_host_predicate:
                - name: envoy.retry_host_predicates.previous_hosts
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.retry.host.previous_hosts.v3.PreviousHostsPredicate
              host_selection_retry_max_attempts: 3
```

### Request/Response Manipulation

```yaml
route_config:
  name: route_with_manipulation
  virtual_hosts:
    - name: backend
      domains: ["*"]
      routes:
        - match:
            prefix: "/"
          route:
            cluster: backend_cluster
          request_headers_to_add:
            - header:
                key: "x-forwarded-by"
                value: "envoy"
              append: false
            - header:
                key: "x-request-id"
                value: "%REQ(x-request-id)%"
          request_headers_to_remove:
            - "x-internal-header"
          response_headers_to_add:
            - header:
                key: "x-envoy-upstream-service-time"
                value: "%RESP(x-envoy-upstream-service-time)%"
            - header:
                key: "x-cache-status"
                value: "MISS"
          response_headers_to_remove:
            - "x-powered-by"
```

### Rate Limiting Routes

```yaml
route_config:
  name: rate_limited_route
  virtual_hosts:
    - name: backend
      domains: ["*"]
      routes:
        - match:
            prefix: "/api/"
          route:
            cluster: backend_cluster
            rate_limits:
              - actions:
                  - request_headers:
                      header_name: "x-api-key"
                      descriptor_key: "api_key"
              - actions:
                  - remote_address: {}
              - actions:
                  - generic_key:
                      descriptor_value: "api_requests"
```

## Filter Configuration

### Network Filters

```yaml
filter_chains:
  - filters:
      # TCP Proxy filter
      - name: envoy.filters.network.tcp_proxy
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.tcp_proxy.v3.TcpProxy
          stat_prefix: tcp_stats
          cluster: backend_cluster
          access_log:
            - name: envoy.access_loggers.file
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                path: "/var/log/envoy/tcp_access.log"
```

```yaml
filter_chains:
  - filters:
      # Rate limit filter (network level)
      - name: envoy.filters.network.ratelimit
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.ratelimit.v3.RateLimit
          stat_prefix: rate_limit
          domain: "tcp_rate_limit"
          descriptors:
            - entries:
                - key: "remote_address"
          rate_limit_service:
            grpc_service:
              envoy_grpc:
                cluster_name: rate_limit_cluster
            transport_api_version: V3
      # HTTP connection manager
      - name: envoy.filters.network.http_connection_manager
        # ... configuration
```

### HTTP Filters

```yaml
http_filters:
  # JWT Authentication filter
  - name: envoy.filters.http.jwt_authn
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.jwt_authn.v3.JwtAuthentication
      providers:
        auth0:
          issuer: "https://example.auth0.com/"
          audiences:
            - "api.example.com"
          remote_jwks:
            http_uri:
              uri: "https://example.auth0.com/.well-known/jwks.json"
              cluster: auth0_cluster
              timeout: 5s
            cache_duration: 300s
          forward: true
          payload_in_metadata: "jwt_payload"
      rules:
        - match:
            prefix: "/api/"
          requires:
            provider_name: "auth0"

  # CORS filter
  - name: envoy.filters.http.cors
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors

  # Compression filter
  - name: envoy.filters.http.compressor
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.compressor.v3.Compressor
      response_direction_config:
        common_config:
          min_content_length: 1024
          content_type:
            - "text/html"
            - "application/json"
            - "text/css"
            - "application/javascript"
        disable_on_etag_header: true
      compressor_library:
        name: gzip
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.compression.gzip.compressor.v3.Gzip
          memory_level: 5
          window_bits: 12
          compression_level: BEST_SPEED

  # External authorization filter
  - name: envoy.filters.http.ext_authz
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz
      grpc_service:
        envoy_grpc:
          cluster_name: ext_authz_cluster
        timeout: 0.5s
      transport_api_version: V3
      failure_mode_allow: false
      with_request_body:
        max_request_bytes: 8192
        allow_partial_message: true
        pack_as_bytes: true

  # Rate limit filter (HTTP level)
  - name: envoy.filters.http.ratelimit
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
      domain: "http_rate_limit"
      stage: 0
      rate_limit_service:
        grpc_service:
          envoy_grpc:
            cluster_name: rate_limit_cluster
        transport_api_version: V3

  # Lua filter for custom logic
  - name: envoy.filters.http.lua
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua
      inline_code: |
        function envoy_on_request(request_handle)
          local headers = request_handle:headers()
          local path = headers:get(":path")
          request_handle:logInfo("Request path: " .. path)

          -- Add custom header
          request_handle:headers():add("x-custom-header", "value")
        end

        function envoy_on_response(response_handle)
          response_handle:headers():add("x-lua-processed", "true")
        end

  # Router filter (must be last)
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### WASM Filter

```yaml
http_filters:
  - name: envoy.filters.http.wasm
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.wasm.v3.Wasm
      config:
        name: "my_wasm_filter"
        root_id: "my_root_id"
        vm_config:
          vm_id: "my_vm_id"
          runtime: "envoy.wasm.runtime.v8"
          code:
            local:
              filename: "/etc/envoy/wasm/my_filter.wasm"
          allow_precompiled: true
        configuration:
          "@type": type.googleapis.com/google.protobuf.StringValue
          value: |
            {
              "key": "value"
            }
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

## Load Balancing Strategies

### Load Balancing Algorithms

```yaml
clusters:
  # Round Robin (default)
  - name: round_robin_cluster
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: round_robin_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend1.example.com
                    port_value: 8080
            - endpoint:
                address:
                  socket_address:
                    address: backend2.example.com
                    port_value: 8080

  # Least Request
  - name: least_request_cluster
    type: STRICT_DNS
    lb_policy: LEAST_REQUEST
    least_request_lb_config:
      choice_count: 2  # Power of 2 choices
    load_assignment:
      cluster_name: least_request_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080

  # Ring Hash (consistent hashing)
  - name: ring_hash_cluster
    type: STRICT_DNS
    lb_policy: RING_HASH
    ring_hash_lb_config:
      minimum_ring_size: 1024
      maximum_ring_size: 8388608
      hash_function: XX_HASH
    load_assignment:
      cluster_name: ring_hash_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080

  # Maglev (consistent hashing)
  - name: maglev_cluster
    type: STRICT_DNS
    lb_policy: MAGLEV
    maglev_lb_config:
      table_size: 65537
    load_assignment:
      cluster_name: maglev_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080

  # Random
  - name: random_cluster
    type: STRICT_DNS
    lb_policy: RANDOM
    load_assignment:
      cluster_name: random_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080
```

### Weighted Endpoints

```yaml
clusters:
  - name: weighted_cluster
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: weighted_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend1.example.com
                    port_value: 8080
              load_balancing_weight: 75  # 75% of traffic
            - endpoint:
                address:
                  socket_address:
                    address: backend2.example.com
                    port_value: 8080
              load_balancing_weight: 25  # 25% of traffic
```

### Priority-Based Load Balancing

```yaml
clusters:
  - name: priority_cluster
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: priority_cluster
      endpoints:
        # Primary endpoints (priority 0)
        - priority: 0
          lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: primary1.example.com
                    port_value: 8080
            - endpoint:
                address:
                  socket_address:
                    address: primary2.example.com
                    port_value: 8080
        # Secondary endpoints (priority 1) - used if primary fails
        - priority: 1
          lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: secondary1.example.com
                    port_value: 8080
```

### Locality-Aware Load Balancing

```yaml
clusters:
  - name: locality_aware_cluster
    type: EDS
    lb_policy: ROUND_ROBIN
    common_lb_config:
      locality_weighted_lb_config: {}
      zone_aware_lb_config:
        routing_enabled:
          runtime_key: routing_enabled
          default_value: 100
        min_cluster_size: 6
    load_assignment:
      cluster_name: locality_aware_cluster
      endpoints:
        - locality:
            region: "us-east-1"
            zone: "us-east-1a"
          priority: 0
          lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 10.0.1.10
                    port_value: 8080
              load_balancing_weight: 100
        - locality:
            region: "us-east-1"
            zone: "us-east-1b"
          priority: 0
          lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 10.0.2.10
                    port_value: 8080
              load_balancing_weight: 100
        - locality:
            region: "us-west-2"
            zone: "us-west-2a"
          priority: 1
          lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 10.1.1.10
                    port_value: 8080
              load_balancing_weight: 100
```

### Session Affinity (Sticky Sessions)

```yaml
route_config:
  name: sticky_route
  virtual_hosts:
    - name: backend
      domains: ["*"]
      routes:
        - match:
            prefix: "/"
          route:
            cluster: backend_cluster
            hash_policy:
              # Hash by cookie
              - cookie:
                  name: "session_id"
                  ttl: 3600s
              # Or hash by header
              - header:
                  header_name: "x-user-id"
              # Or hash by source IP
              - connection_properties:
                  source_ip: true

clusters:
  - name: backend_cluster
    type: STRICT_DNS
    lb_policy: RING_HASH  # Required for hash-based routing
    ring_hash_lb_config:
      minimum_ring_size: 1024
    load_assignment:
      cluster_name: backend_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080
```

## Observability

### Access Logging

```yaml
http_connection_manager:
  stat_prefix: ingress_http
  access_log:
    # File-based access log
    - name: envoy.access_loggers.file
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
        path: "/var/log/envoy/access.log"
        log_format:
          json_format:
            time: "%START_TIME%"
            protocol: "%PROTOCOL%"
            method: "%REQ(:METHOD)%"
            path: "%REQ(:PATH)%"
            response_code: "%RESPONSE_CODE%"
            response_flags: "%RESPONSE_FLAGS%"
            bytes_received: "%BYTES_RECEIVED%"
            bytes_sent: "%BYTES_SENT%"
            duration: "%DURATION%"
            upstream_service_time: "%RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)%"
            x_forwarded_for: "%REQ(X-FORWARDED-FOR)%"
            user_agent: "%REQ(USER-AGENT)%"
            request_id: "%REQ(X-REQUEST-ID)%"
            upstream_host: "%UPSTREAM_HOST%"
            upstream_cluster: "%UPSTREAM_CLUSTER%"

    # gRPC access log (for external log collection)
    - name: envoy.access_loggers.http_grpc
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.access_loggers.grpc.v3.HttpGrpcAccessLogConfig
        common_config:
          log_name: "access_log"
          transport_api_version: V3
          grpc_service:
            envoy_grpc:
              cluster_name: access_log_cluster
        additional_request_headers_to_log:
          - "x-custom-header"
        additional_response_headers_to_log:
          - "x-custom-response"
```

### Statistics and Metrics

```yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901
  access_log:
    - name: envoy.access_loggers.file
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
        path: "/var/log/envoy/admin_access.log"

stats_config:
  stats_tags:
    - tag_name: "cluster_name"
      regex: "^cluster\\.((.+?)\\.)"
    - tag_name: "listener_address"
      regex: "^listener\\.((\\d+\\.\\d+\\.\\d+\\.\\d+_\\d+)\\.)"
  use_all_default_tags: true

stats_sinks:
  # StatsD sink
  - name: envoy.stat_sinks.statsd
    typed_config:
      "@type": type.googleapis.com/envoy.config.metrics.v3.StatsdSink
      address:
        socket_address:
          address: statsd.example.com
          port_value: 8125
      prefix: "envoy"

  # Prometheus sink (via admin endpoint /stats/prometheus)
  # No additional configuration needed, access via admin interface
```

### Distributed Tracing

```yaml
http_connection_manager:
  tracing:
    provider:
      name: envoy.tracers.zipkin
      typed_config:
        "@type": type.googleapis.com/envoy.config.trace.v3.ZipkinConfig
        collector_cluster: zipkin_cluster
        collector_endpoint: "/api/v2/spans"
        collector_endpoint_version: HTTP_JSON
        shared_span_context: false
        trace_id_128bit: true
    random_sampling:
      value: 100  # Sample 100% of requests
    custom_tags:
      - tag: "environment"
        literal:
          value: "production"
      - tag: "version"
        request_header:
          name: "x-version"
          default_value: "unknown"
  # ... other configuration
```

```yaml
# Alternative: Jaeger tracing
http_connection_manager:
  tracing:
    provider:
      name: envoy.tracers.opentelemetry
      typed_config:
        "@type": type.googleapis.com/envoy.config.trace.v3.OpenTelemetryConfig
        grpc_service:
          envoy_grpc:
            cluster_name: opentelemetry_collector
          timeout: 0.250s
        service_name: "my-service"
```

### Health Check Endpoint

```yaml
http_connection_manager:
  route_config:
    name: local_route
    virtual_hosts:
      - name: backend
        domains: ["*"]
        routes:
          # Health check endpoint
          - match:
              prefix: "/healthz"
            direct_response:
              status: 200
              body:
                inline_string: "OK"
          # Ready check endpoint
          - match:
              prefix: "/ready"
            route:
              cluster: local_service
          # Other routes
          - match:
              prefix: "/"
            route:
              cluster: backend_cluster
```

### Admin Interface

```yaml
admin:
  address:
    socket_address:
      address: 127.0.0.1  # Bind to localhost for security
      port_value: 9901
```

Common admin endpoints:

```bash
# Get server info
curl http://localhost:9901/server_info

# Get all stats
curl http://localhost:9901/stats

# Get stats in Prometheus format
curl http://localhost:9901/stats/prometheus

# Get cluster status
curl http://localhost:9901/clusters

# Get listener status
curl http://localhost:9901/listeners

# Get current configuration
curl http://localhost:9901/config_dump

# Health check status
curl http://localhost:9901/ready

# Drain listeners (graceful shutdown)
curl -X POST http://localhost:9901/drain_listeners

# Modify log level at runtime
curl -X POST "http://localhost:9901/logging?level=debug"
```

## xDS API (Dynamic Configuration)

### xDS Overview

xDS is Envoy's discovery service protocol for dynamic configuration:

```
+------------------------------------------------------------------+
|                        xDS Services                               |
|                                                                   |
|  +----------+  +----------+  +----------+  +----------+          |
|  |   LDS    |  |   RDS    |  |   CDS    |  |   EDS    |          |
|  | Listener |  |  Route   |  | Cluster  |  | Endpoint |          |
|  | Discovery|  | Discovery|  | Discovery|  | Discovery|          |
|  +----------+  +----------+  +----------+  +----------+          |
|                                                                   |
|  +----------+  +----------+  +----------+  +----------+          |
|  |   SDS    |  |   RTDS   |  |   SRDS   |  |   ADS    |          |
|  |  Secret  |  | Runtime  |  |  Scoped  |  |Aggregated|          |
|  | Discovery|  | Discovery|  |  Routes  |  | Discovery|          |
|  +----------+  +----------+  +----------+  +----------+          |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                        Envoy Proxy                                |
|  Dynamically receives and applies configuration updates          |
+------------------------------------------------------------------+
```

### Bootstrap Configuration for xDS

```yaml
node:
  id: "envoy-node-1"
  cluster: "my-cluster"
  metadata:
    role: "sidecar"
    version: "v1.0.0"
  locality:
    region: "us-east-1"
    zone: "us-east-1a"

dynamic_resources:
  # Listener Discovery Service (LDS)
  lds_config:
    resource_api_version: V3
    api_config_source:
      api_type: GRPC
      transport_api_version: V3
      grpc_services:
        - envoy_grpc:
            cluster_name: xds_cluster
      set_node_on_first_message_only: true

  # Cluster Discovery Service (CDS)
  cds_config:
    resource_api_version: V3
    api_config_source:
      api_type: GRPC
      transport_api_version: V3
      grpc_services:
        - envoy_grpc:
            cluster_name: xds_cluster
      set_node_on_first_message_only: true

static_resources:
  clusters:
    # xDS control plane cluster
    - name: xds_cluster
      type: STRICT_DNS
      connect_timeout: 5s
      http2_protocol_options: {}
      load_assignment:
        cluster_name: xds_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: xds-server.example.com
                      port_value: 18000
```

### Aggregated Discovery Service (ADS)

```yaml
node:
  id: "envoy-node-1"
  cluster: "my-cluster"

dynamic_resources:
  ads_config:
    api_type: GRPC
    transport_api_version: V3
    grpc_services:
      - envoy_grpc:
          cluster_name: xds_cluster
    set_node_on_first_message_only: true

  lds_config:
    resource_api_version: V3
    ads: {}

  cds_config:
    resource_api_version: V3
    ads: {}

static_resources:
  clusters:
    - name: xds_cluster
      type: STRICT_DNS
      connect_timeout: 5s
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
          explicit_http_config:
            http2_protocol_options: {}
      load_assignment:
        cluster_name: xds_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: xds-server.example.com
                      port_value: 18000
```

### Secret Discovery Service (SDS)

```yaml
clusters:
  - name: backend_cluster
    type: STRICT_DNS
    transport_socket:
      name: envoy.transport_sockets.tls
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
        common_tls_context:
          tls_certificate_sds_secret_configs:
            - name: "client-cert"
              sds_config:
                resource_api_version: V3
                api_config_source:
                  api_type: GRPC
                  transport_api_version: V3
                  grpc_services:
                    - envoy_grpc:
                        cluster_name: sds_cluster
          validation_context_sds_secret_config:
            name: "validation-context"
            sds_config:
              resource_api_version: V3
              api_config_source:
                api_type: GRPC
                transport_api_version: V3
                grpc_services:
                  - envoy_grpc:
                      cluster_name: sds_cluster
    load_assignment:
      cluster_name: backend_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8443
```

### xDS Protocol Types

| Protocol | Full Name | Purpose |
|----------|-----------|---------|
| LDS | Listener Discovery Service | Dynamically configure listeners |
| RDS | Route Discovery Service | Dynamically configure routes |
| CDS | Cluster Discovery Service | Dynamically configure clusters |
| EDS | Endpoint Discovery Service | Dynamically configure endpoints |
| SDS | Secret Discovery Service | Dynamically configure TLS certificates |
| RTDS | Runtime Discovery Service | Dynamically configure runtime flags |
| SRDS | Scoped Route Discovery Service | Dynamically configure scoped routes |
| ADS | Aggregated Discovery Service | Single stream for all xDS types |

## Complete Configuration Examples

### API Gateway Configuration

```yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

static_resources:
  listeners:
    - name: api_gateway_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: api_gateway
                codec_type: AUTO
                route_config:
                  name: api_routes
                  virtual_hosts:
                    - name: api
                      domains: ["api.example.com", "api"]
                      routes:
                        # User service
                        - match:
                            prefix: "/api/v1/users"
                          route:
                            cluster: users_service
                            timeout: 30s
                            retry_policy:
                              retry_on: "5xx"
                              num_retries: 3
                        # Orders service
                        - match:
                            prefix: "/api/v1/orders"
                          route:
                            cluster: orders_service
                            timeout: 60s
                        # Products service
                        - match:
                            prefix: "/api/v1/products"
                          route:
                            cluster: products_service
                        # Default
                        - match:
                            prefix: "/"
                          direct_response:
                            status: 404
                            body:
                              inline_string: '{"error": "Not Found"}'
                http_filters:
                  # Rate limiting
                  - name: envoy.filters.http.local_ratelimit
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
                      stat_prefix: http_local_rate_limiter
                      token_bucket:
                        max_tokens: 1000
                        tokens_per_fill: 100
                        fill_interval: 1s
                      filter_enabled:
                        runtime_key: local_rate_limit_enabled
                        default_value:
                          numerator: 100
                          denominator: HUNDRED
                      filter_enforced:
                        runtime_key: local_rate_limit_enforced
                        default_value:
                          numerator: 100
                          denominator: HUNDRED
                  # Router
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
                access_log:
                  - name: envoy.access_loggers.file
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                      path: "/var/log/envoy/access.log"

  clusters:
    - name: users_service
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      connect_timeout: 5s
      health_checks:
        - timeout: 5s
          interval: 10s
          unhealthy_threshold: 3
          healthy_threshold: 2
          http_health_check:
            path: "/health"
      circuit_breakers:
        thresholds:
          - priority: DEFAULT
            max_connections: 100
            max_pending_requests: 100
            max_requests: 1000
      load_assignment:
        cluster_name: users_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: users-service
                      port_value: 8080

    - name: orders_service
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      connect_timeout: 5s
      load_assignment:
        cluster_name: orders_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: orders-service
                      port_value: 8080

    - name: products_service
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      connect_timeout: 5s
      load_assignment:
        cluster_name: products_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: products-service
                      port_value: 8080
```

### Service Mesh Sidecar Configuration

```yaml
admin:
  address:
    socket_address:
      address: 127.0.0.1
      port_value: 15000

static_resources:
  listeners:
    # Inbound listener (traffic to the application)
    - name: inbound_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 15006
      listener_filters:
        - name: envoy.filters.listener.original_dst
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.listener.original_dst.v3.OriginalDst
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: inbound_http
                codec_type: AUTO
                route_config:
                  name: inbound_route
                  virtual_hosts:
                    - name: local_service
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: local_app
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

    # Outbound listener (traffic from the application)
    - name: outbound_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 15001
      listener_filters:
        - name: envoy.filters.listener.original_dst
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.listener.original_dst.v3.OriginalDst
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: outbound_http
                codec_type: AUTO
                route_config:
                  name: outbound_route
                  virtual_hosts:
                    - name: external_services
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: passthrough_cluster
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  clusters:
    - name: local_app
      type: STATIC
      connect_timeout: 1s
      load_assignment:
        cluster_name: local_app
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 127.0.0.1
                      port_value: 8080

    - name: passthrough_cluster
      type: ORIGINAL_DST
      connect_timeout: 5s
      lb_policy: CLUSTER_PROVIDED
```

### gRPC Load Balancer Configuration

```yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

static_resources:
  listeners:
    - name: grpc_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 50051
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: grpc_service
                codec_type: AUTO
                http2_protocol_options:
                  max_concurrent_streams: 100
                  initial_stream_window_size: 65536
                  initial_connection_window_size: 1048576
                route_config:
                  name: grpc_route
                  virtual_hosts:
                    - name: grpc_service
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/my.service.MyService"
                          route:
                            cluster: grpc_backend
                            timeout: 60s
                            retry_policy:
                              retry_on: "unavailable,resource-exhausted"
                              num_retries: 3
                              per_try_timeout: 20s
                        - match:
                            prefix: "/grpc.health.v1.Health"
                          route:
                            cluster: grpc_backend
                http_filters:
                  - name: envoy.filters.http.grpc_web
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
                access_log:
                  - name: envoy.access_loggers.file
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                      path: "/var/log/envoy/grpc_access.log"

  clusters:
    - name: grpc_backend
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      connect_timeout: 5s
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
          explicit_http_config:
            http2_protocol_options: {}
      health_checks:
        - timeout: 5s
          interval: 10s
          unhealthy_threshold: 3
          healthy_threshold: 2
          grpc_health_check:
            service_name: "my.service.MyService"
      load_assignment:
        cluster_name: grpc_backend
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: grpc-backend-1
                      port_value: 50051
              - endpoint:
                  address:
                    socket_address:
                      address: grpc-backend-2
                      port_value: 50051
```

## Common Operations and Debugging

### Common Commands

```bash
# Start Envoy with configuration file
envoy -c /etc/envoy/envoy.yaml

# Validate configuration
envoy --mode validate -c /etc/envoy/envoy.yaml

# Start with debug logging
envoy -c /etc/envoy/envoy.yaml -l debug

# Start with specific log format
envoy -c /etc/envoy/envoy.yaml --log-format '%v'

# Hot restart (zero-downtime)
envoy -c /etc/envoy/envoy.yaml --restart-epoch 1

# Run in Docker
docker run -d \
  -v /path/to/envoy.yaml:/etc/envoy/envoy.yaml \
  -p 8080:8080 \
  -p 9901:9901 \
  envoyproxy/envoy:v1.28.0
```

### Admin Interface Debugging

```bash
# Get server information
curl http://localhost:9901/server_info | jq .

# Get all clusters and their status
curl http://localhost:9901/clusters

# Get cluster health
curl "http://localhost:9901/clusters?format=json" | jq '.cluster_statuses[] | {name: .name, health: .host_statuses[].health_status}'

# Get listener information
curl http://localhost:9901/listeners

# Dump current configuration
curl http://localhost:9901/config_dump | jq .

# Get specific config type
curl "http://localhost:9901/config_dump?resource=dynamic_listeners" | jq .

# Get stats
curl http://localhost:9901/stats

# Get specific stat
curl "http://localhost:9901/stats?filter=cluster.backend"

# Get stats in Prometheus format
curl http://localhost:9901/stats/prometheus

# Check readiness
curl http://localhost:9901/ready

# Modify log level dynamically
curl -X POST "http://localhost:9901/logging?level=debug"
curl -X POST "http://localhost:9901/logging?paths=connection:trace,http:debug"

# Reset counters
curl -X POST http://localhost:9901/reset_counters

# Drain listeners for graceful shutdown
curl -X POST http://localhost:9901/drain_listeners
```

### Log Analysis

```bash
# Common log patterns
# Access log format
# [%START_TIME%] "%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%"
# %RESPONSE_CODE% %RESPONSE_FLAGS% %BYTES_RECEIVED% %BYTES_SENT%
# %DURATION% %RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)% "%REQ(X-FORWARDED-FOR)%"
# "%REQ(USER-AGENT)%" "%REQ(X-REQUEST-ID)%" "%REQ(:AUTHORITY)%" "%UPSTREAM_HOST%"

# Response flags meanings
# UH: No healthy upstream
# UF: Upstream connection failure
# UO: Upstream overflow (circuit breaker)
# NR: No route configured
# URX: Upstream retry limit exceeded
# NC: No cluster configured
# DC: Downstream connection termination
# LH: Local service failed health check
# UT: Upstream request timeout
# LR: Connection local reset
# UR: Upstream remote reset
# UC: Upstream connection termination

# Example: Find all 5xx errors
grep '"5[0-9][0-9]"' /var/log/envoy/access.log

# Example: Find connection failures
grep 'UF' /var/log/envoy/access.log

# Example: Find timeout issues
grep 'UT' /var/log/envoy/access.log

# Example: Find circuit breaker triggers
grep 'UO' /var/log/envoy/access.log
```

### Performance Tuning

```yaml
# Worker thread configuration
# Usually set via command line
# --concurrency <num_threads>

# Buffer tuning
http_connection_manager:
  http2_protocol_options:
    initial_stream_window_size: 65536
    initial_connection_window_size: 1048576
    max_concurrent_streams: 100

# Connection pool settings
clusters:
  - name: backend
    connection_pool_per_downstream_connection: false
    max_requests_per_connection: 1000
    typed_extension_protocol_options:
      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
        "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
        common_http_protocol_options:
          idle_timeout: 3600s
          max_connection_duration: 0s
          max_requests_per_connection: 0  # unlimited
        http_protocol_options:
          enable_trailers: true
        explicit_http_config:
          http_protocol_options: {}
```

## Interview Key Points

### Core Concept Questions

**Q1: What are the main differences between Envoy and traditional proxies like Nginx?**

```
Answer: Key differences include:
1. Configuration: Envoy uses dynamic configuration via xDS APIs,
   while Nginx uses static configuration files
2. Protocol Support: Envoy has native HTTP/2, gRPC, and WebSocket support
3. Observability: Envoy has built-in distributed tracing, metrics, and logging
4. Service Discovery: Native support for dynamic endpoint discovery
5. Extension Model: Envoy supports WASM filters for extensibility
6. Architecture: Single process, multi-threaded vs Nginx's multi-process model
```

**Q2: Explain the xDS protocol and its components.**

```
Answer: xDS is Envoy's discovery service protocol consisting of:
- LDS (Listener Discovery): Configures listeners dynamically
- RDS (Route Discovery): Configures routing rules dynamically
- CDS (Cluster Discovery): Configures upstream clusters dynamically
- EDS (Endpoint Discovery): Configures cluster endpoints dynamically
- SDS (Secret Discovery): Configures TLS certificates dynamically
- ADS (Aggregated Discovery): Single stream for all xDS types

Benefits:
- Zero-downtime configuration updates
- Centralized configuration management
- Integration with service mesh control planes
```

**Q3: How does Envoy handle circuit breaking?**

```
Answer: Envoy's circuit breaking protects upstream services by limiting:
1. max_connections: Maximum concurrent connections to cluster
2. max_pending_requests: Maximum queued requests
3. max_requests: Maximum concurrent requests
4. max_retries: Maximum concurrent retries

When thresholds are exceeded, Envoy returns errors immediately
instead of overloading the upstream service. This prevents
cascade failures in distributed systems.
```

### Practical Configuration Questions

**Q4: How would you configure Envoy for blue-green deployments?**

```yaml
route_config:
  virtual_hosts:
    - name: backend
      domains: ["*"]
      routes:
        - match:
            prefix: "/"
            headers:
              - name: "x-canary"
                exact_match: "true"
          route:
            cluster: green_cluster  # New version
        - match:
            prefix: "/"
          route:
            cluster: blue_cluster   # Current version
```

**Q5: How do you implement request retries with exponential backoff?**

```yaml
route:
  cluster: backend
  retry_policy:
    retry_on: "5xx,reset,connect-failure"
    num_retries: 3
    per_try_timeout: 10s
    retry_back_off:
      base_interval: 0.5s
      max_interval: 10s
```

**Q6: How would you configure mutual TLS (mTLS) between services?**

```yaml
# Upstream TLS (client side)
clusters:
  - name: backend
    transport_socket:
      name: envoy.transport_sockets.tls
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
        common_tls_context:
          tls_certificates:
            - certificate_chain:
                filename: "/certs/client.crt"
              private_key:
                filename: "/certs/client.key"
          validation_context:
            trusted_ca:
              filename: "/certs/ca.crt"

# Downstream TLS (server side)
filter_chains:
  - transport_socket:
      name: envoy.transport_sockets.tls
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
        require_client_certificate: true
        common_tls_context:
          tls_certificates:
            - certificate_chain:
                filename: "/certs/server.crt"
              private_key:
                filename: "/certs/server.key"
          validation_context:
            trusted_ca:
              filename: "/certs/ca.crt"
```

### Troubleshooting Questions

**Q7: How do you debug connection issues in Envoy?**

```
Answer: Debug connection issues by:
1. Check admin interface for cluster health:
   curl http://localhost:9901/clusters

2. Enable debug logging:
   curl -X POST "http://localhost:9901/logging?level=debug"

3. Check access logs for response flags:
   - UH: No healthy upstream
   - UF: Upstream connection failure
   - NR: No route configured
   - UO: Circuit breaker open

4. Verify upstream connectivity:
   - Check health check configuration
   - Verify DNS resolution
   - Check network policies/firewalls

5. Review stats:
   curl "http://localhost:9901/stats?filter=upstream_cx"
```

**Q8: What causes high latency in Envoy and how to diagnose?**

```
Answer: Common causes and diagnostics:
1. Upstream service latency:
   - Check x-envoy-upstream-service-time header
   - Review upstream cluster health checks

2. Connection pool exhaustion:
   - Monitor cluster.*.upstream_cx_pool_overflow
   - Adjust circuit breaker thresholds

3. DNS resolution delays:
   - Use STRICT_DNS vs LOGICAL_DNS appropriately
   - Configure dns_refresh_rate

4. TLS handshake overhead:
   - Enable session resumption
   - Use connection keepalive

5. Inefficient routing:
   - Review route configuration complexity
   - Optimize header matching rules

Diagnostic commands:
curl http://localhost:9901/stats | grep latency
curl http://localhost:9901/stats | grep cx_connect
```

## Summary

Envoy Proxy has revolutionized modern application networking with its dynamic configuration, rich observability, and cloud-native design. Its key strengths include:

**Architecture Highlights**:
- Event-driven, single process multi-threaded model
- Listener-Filter-Cluster-Endpoint data flow
- Dynamic configuration via xDS APIs
- Extensible through L4/L7 filters and WASM

**Key Capabilities**:
- Advanced load balancing algorithms
- Built-in circuit breaking and outlier detection
- Native distributed tracing support
- Comprehensive health checking
- Protocol-aware routing (HTTP/gRPC)

**Use Cases**:
- API Gateway and edge proxy
- Service mesh data plane (Istio, Consul Connect)
- gRPC load balancing
- Microservices communication

**Best Practices**:
1. Use xDS for dynamic configuration in production
2. Implement circuit breakers to prevent cascade failures
3. Configure health checks for automatic endpoint management
4. Enable distributed tracing for observability
5. Use appropriate load balancing algorithms for your workload

## Further Reading

### Official Resources

- [Envoy Official Documentation](https://www.envoyproxy.io/docs/envoy/latest/)
- [Envoy GitHub Repository](https://github.com/envoyproxy/envoy)
- [xDS Protocol Reference](https://www.envoyproxy.io/docs/envoy/latest/api-docs/xds_protocol)

### Related Technologies

- **Service Mesh**: Istio, Linkerd, Consul Connect
- **Control Planes**: Gloo Edge, Ambassador, Contour
- **Observability**: Prometheus, Jaeger, Zipkin, OpenTelemetry

### Advanced Topics

- Building custom filters with C++ or WASM
- Implementing control plane with go-control-plane
- Performance tuning for high-traffic scenarios
- Security hardening and mTLS deployment

### Community Resources

- [Envoy Community Slack](https://envoyproxy.slack.com/)
- [CNCF Envoy Project](https://www.cncf.io/projects/envoy/)
- [Envoy Blog](https://blog.envoyproxy.io/)

Mastering Envoy requires understanding its architecture, configuration model, and integration patterns. As the foundation for many service mesh implementations, Envoy knowledge is essential for building resilient, observable, and secure cloud-native applications.
