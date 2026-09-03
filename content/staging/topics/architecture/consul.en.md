---
title: Consul Service Discovery and Configuration
description: Implement service discovery and distributed configuration with Consul
track: architecture
section: distributed
difficulty: intermediate
tags:
  - Consul
  - service discovery
  - configuration
  - HashiCorp
status: imported
origin: old/src/content/docs/devops/consul.en.md
divergence: 0.122
issues: []
legacy:
  category: DevOps
  subcategory: Service Discovery
  order: 17
  lastUpdated: 2026-01-07
---

## Conceptual Overview

### What is Consul?

Consul is a distributed service mesh solution developed by HashiCorp that provides service discovery, configuration management, and segmentation functionality. It enables organizations to build secure service-to-service communication across any runtime platform and public or private cloud.

At its core, Consul addresses the fundamental challenge of connecting services in dynamic, distributed environments where services can scale up and down, move between hosts, and need to communicate securely without hardcoded network addresses.

### Why Consul?

In modern distributed systems, particularly microservices architectures, services need to discover and communicate with each other dynamically:

```
Traditional Static Configuration:

+------------------+     +------------------+
|   Service A      |     |   Service B      |
|                  |     |                  |
| config.yaml:     |     | config.yaml:     |
|  db_host: 10.0.1.5    |  api_host: 10.0.1.10
|  cache: 10.0.1.6 |     |  cache: 10.0.1.6 |
+------------------+     +------------------+

Problems:
- Manual configuration updates
- No automatic failover
- Configuration drift
- Difficult scaling
```

```
Consul-Based Dynamic Discovery:

+------------------+     +------------------+
|   Service A      |     |   Service B      |
|                  |     |                  |
| Query Consul:    |     | Query Consul:    |
|  "db.service"    |     |  "api.service"   |
|  "cache.service" |     |  "cache.service" |
+------------------+     +------------------+
         |                       |
         v                       v
+---------------------------------------------+
|              Consul Cluster                  |
|  +--------+   +--------+   +--------+       |
|  | Server |   | Server |   | Server |       |
|  | (Leader)|  |(Follower)| |(Follower)|     |
|  +--------+   +--------+   +--------+       |
|                                             |
|  Service Catalog | Health Checks | KV Store |
+---------------------------------------------+
```

**Key benefits of Consul:**

1. **Dynamic Service Discovery**: Services register themselves and discover others automatically
2. **Health Checking**: Built-in health monitoring with automatic service deregistration
3. **Key/Value Storage**: Distributed configuration management
4. **Secure Communication**: Service mesh capabilities with mTLS
5. **Multi-Datacenter**: Native support for federated deployments
6. **Platform Agnostic**: Works with containers, VMs, and bare metal

## Consul Architecture

### Core Components

```
Consul Architecture Overview:

+----------------------------------------------------------+
|                    Consul Datacenter                      |
|                                                           |
|  +----------------------------------------------------+  |
|  |              Server Cluster (Raft)                  |  |
|  |  +----------+  +----------+  +----------+          |  |
|  |  | Server 1 |  | Server 2 |  | Server 3 |          |  |
|  |  | (Leader) |  |(Follower)|  |(Follower)|          |  |
|  |  +----------+  +----------+  +----------+          |  |
|  |         \          |          /                     |  |
|  |          \         |         /                      |  |
|  |           \        |        /                       |  |
|  |            v       v       v                        |  |
|  |  +------------------------------------+             |  |
|  |  |         Raft Consensus             |             |  |
|  |  |  - Leader Election                 |             |  |
|  |  |  - Log Replication                 |             |  |
|  |  |  - Strong Consistency              |             |  |
|  |  +------------------------------------+             |  |
|  +----------------------------------------------------+  |
|                          |                                |
|                    Gossip Protocol                       |
|                          |                                |
|  +----------------------------------------------------+  |
|  |                  Client Agents                      |  |
|  |  +--------+  +--------+  +--------+  +--------+    |  |
|  |  | Client |  | Client |  | Client |  | Client |    |  |
|  |  | Agent  |  | Agent  |  | Agent  |  | Agent  |    |  |
|  |  +--------+  +--------+  +--------+  +--------+    |  |
|  |      |           |           |           |          |  |
|  |  +-------+   +-------+   +-------+   +-------+     |  |
|  |  |Service|   |Service|   |Service|   |Service|     |  |
|  |  |   A   |   |   B   |   |   C   |   |   D   |     |  |
|  |  +-------+   +-------+   +-------+   +-------+     |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

### Server vs Client Agents

Consul operates using a server-client architecture:

**Server Agents:**
- Participate in the Raft consensus protocol
- Maintain the cluster state
- Handle all queries and transactions
- Recommended: 3 or 5 servers per datacenter for fault tolerance

**Client Agents:**
- Lightweight processes running on each node
- Forward requests to servers
- Cache query results locally
- Participate in the gossip protocol for membership

### Consensus Protocol (Raft)

Consul uses the Raft consensus algorithm for leader election and log replication:

```
Raft Consensus Flow:

1. Leader Election
   +--------+     +--------+     +--------+
   |Follower| --> |Candidate| --> | Leader |
   +--------+     +--------+     +--------+
        ^                             |
        |_____________________________|
                 Heartbeat

2. Log Replication
   +--------+                    +--------+
   | Leader | --- Log Entry ---> |Follower|
   +--------+                    +--------+
       |                             |
       +---- Commit Confirmation ----+

3. Consistency Modes
   - default: Leader forwards reads to ensure consistency
   - consistent: All reads go through Raft
   - stale: Allow reading from any server (eventual consistency)
```

## Getting Started

### Installation

```bash
# Download and install Consul (Linux)
wget https://releases.hashicorp.com/consul/1.17.0/consul_1.17.0_linux_amd64.zip
unzip consul_1.17.0_linux_amd64.zip
sudo mv consul /usr/local/bin/

# Verify installation
consul version

# macOS with Homebrew
brew tap hashicorp/tap
brew install hashicorp/tap/consul

# Docker
docker pull hashicorp/consul:1.17
```

### Development Mode

For local development and testing:

```bash
# Start Consul in development mode
consul agent -dev

# Access the UI at http://localhost:8500

# Check cluster members
consul members

# View the catalog
consul catalog services
```

### Production Configuration

```hcl
# /etc/consul.d/consul.hcl - Server Configuration

datacenter = "dc1"
data_dir = "/opt/consul/data"
log_level = "INFO"
node_name = "consul-server-1"
server = true
bootstrap_expect = 3

# Bind to all interfaces
bind_addr = "0.0.0.0"
client_addr = "0.0.0.0"

# Advertise the private IP
advertise_addr = "10.0.1.10"

# Join other servers
retry_join = [
  "10.0.1.10",
  "10.0.1.11",
  "10.0.1.12"
]

# Enable the UI
ui_config {
  enabled = true
}

# Enable ACLs (recommended for production)
acl {
  enabled = true
  default_policy = "deny"
  enable_token_persistence = true
}

# Encryption
encrypt = "your-gossip-encryption-key"

# TLS configuration
tls {
  defaults {
    verify_incoming = true
    verify_outgoing = true
    ca_file = "/etc/consul.d/certs/consul-agent-ca.pem"
    cert_file = "/etc/consul.d/certs/dc1-server-consul-0.pem"
    key_file = "/etc/consul.d/certs/dc1-server-consul-0-key.pem"
  }
  internal_rpc {
    verify_server_hostname = true
  }
}

# Performance tuning
performance {
  raft_multiplier = 1
}

# Telemetry
telemetry {
  prometheus_retention_time = "24h"
  disable_hostname = true
}
```

```hcl
# /etc/consul.d/consul.hcl - Client Configuration

datacenter = "dc1"
data_dir = "/opt/consul/data"
log_level = "INFO"
node_name = "app-server-1"
server = false

bind_addr = "0.0.0.0"
advertise_addr = "10.0.2.10"

retry_join = [
  "10.0.1.10",
  "10.0.1.11",
  "10.0.1.12"
]

# Encryption (same key as servers)
encrypt = "your-gossip-encryption-key"

# TLS configuration
tls {
  defaults {
    verify_incoming = true
    verify_outgoing = true
    ca_file = "/etc/consul.d/certs/consul-agent-ca.pem"
    cert_file = "/etc/consul.d/certs/dc1-client-consul-0.pem"
    key_file = "/etc/consul.d/certs/dc1-client-consul-0-key.pem"
  }
}
```

### Starting the Cluster

```bash
# Generate gossip encryption key
consul keygen

# Start server agents
sudo systemctl start consul

# Verify cluster status
consul members
consul operator raft list-peers
```

## Service Discovery

### Registering Services

Services can be registered using configuration files or the HTTP API:

```hcl
# /etc/consul.d/web-service.hcl

service {
  name = "web"
  id = "web-1"
  port = 8080
  tags = ["v1", "primary"]

  meta = {
    version = "1.0.0"
    environment = "production"
  }

  # Health check
  check {
    id = "web-health"
    name = "HTTP Health Check"
    http = "http://localhost:8080/health"
    interval = "10s"
    timeout = "2s"

    # Deregister critical services after 1 minute
    deregister_critical_service_after = "1m"
  }

  # Weighted load balancing
  weights {
    passing = 10
    warning = 1
  }
}
```

```bash
# Reload configuration
consul reload

# Or register via API
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "api",
    "ID": "api-1",
    "Port": 3000,
    "Tags": ["v2"],
    "Check": {
      "HTTP": "http://localhost:3000/health",
      "Interval": "10s"
    }
  }' \
  http://localhost:8500/v1/agent/service/register
```

### Discovering Services

```bash
# DNS Interface (default port 8600)
dig @127.0.0.1 -p 8600 web.service.consul

# SRV records for port information
dig @127.0.0.1 -p 8600 web.service.consul SRV

# Filter by tag
dig @127.0.0.1 -p 8600 v1.web.service.consul

# HTTP API
curl http://localhost:8500/v1/catalog/service/web

# Health-aware query
curl http://localhost:8500/v1/health/service/web?passing=true
```

### Service Discovery in Applications

```go
// Go example using the Consul API client
package main

import (
    "fmt"
    "log"

    "github.com/hashicorp/consul/api"
)

func main() {
    // Create a Consul client
    config := api.DefaultConfig()
    config.Address = "localhost:8500"

    client, err := api.NewClient(config)
    if err != nil {
        log.Fatal(err)
    }

    // Discover healthy service instances
    services, _, err := client.Health().Service("web", "", true, nil)
    if err != nil {
        log.Fatal(err)
    }

    for _, service := range services {
        fmt.Printf("Service: %s, Address: %s, Port: %d\n",
            service.Service.Service,
            service.Service.Address,
            service.Service.Port)
    }
}
```

```python
# Python example using python-consul
import consul

# Create a Consul client
c = consul.Consul(host='localhost', port=8500)

# Register a service
c.agent.service.register(
    name='api',
    service_id='api-1',
    port=3000,
    tags=['v1'],
    check=consul.Check.http('http://localhost:3000/health', interval='10s')
)

# Discover services
index, services = c.health.service('web', passing=True)
for service in services:
    node = service['Node']
    svc = service['Service']
    print(f"Service: {svc['Service']}, Address: {svc['Address']}:{svc['Port']}")
```

```javascript
// Node.js example using consul package
const Consul = require('consul');

const consul = new Consul({
  host: 'localhost',
  port: 8500
});

// Register a service
consul.agent.service.register({
  name: 'api',
  id: 'api-1',
  port: 3000,
  tags: ['v1'],
  check: {
    http: 'http://localhost:3000/health',
    interval: '10s'
  }
}, (err) => {
  if (err) throw err;
  console.log('Service registered');
});

// Discover services
consul.health.service({
  service: 'web',
  passing: true
}, (err, result) => {
  if (err) throw err;
  result.forEach((entry) => {
    console.log(`${entry.Service.Service}: ${entry.Service.Address}:${entry.Service.Port}`);
  });
});
```

## Health Checking

### Health Check Types

Consul supports multiple health check types:

```hcl
# HTTP Check
check {
  id = "api-http"
  name = "API HTTP Check"
  http = "http://localhost:8080/health"
  method = "GET"
  header {
    Authorization = ["Bearer token"]
  }
  interval = "10s"
  timeout = "2s"
}

# TCP Check
check {
  id = "db-tcp"
  name = "Database TCP Check"
  tcp = "localhost:5432"
  interval = "10s"
  timeout = "1s"
}

# gRPC Check
check {
  id = "grpc-health"
  name = "gRPC Health Check"
  grpc = "localhost:9090"
  grpc_use_tls = true
  interval = "10s"
}

# Script Check (requires enable_local_script_checks = true)
check {
  id = "disk-check"
  name = "Disk Space Check"
  args = ["/usr/local/bin/check-disk.sh"]
  interval = "30s"
  timeout = "5s"
}

# TTL Check (service must update)
check {
  id = "app-ttl"
  name = "Application TTL"
  ttl = "30s"
}

# Docker Check
check {
  id = "docker-health"
  name = "Docker Container Health"
  docker_container_id = "container-id"
  shell = "/bin/bash"
  args = ["/health-check.sh"]
  interval = "10s"
}

# Alias Check (mirrors another check)
check {
  id = "alias-web"
  name = "Web Alias"
  alias_service = "web"
}
```

### Health Check States

```
Health Check States:

+----------+     +---------+     +----------+
| Passing  | <-> | Warning | <-> | Critical |
+----------+     +---------+     +----------+
     |                                 |
     |                                 v
     |                      +-------------------+
     |                      | Deregister After  |
     |                      | (if configured)   |
     |                      +-------------------+
     |                                 |
     +<--------------------------------+
              (if recovered)
```

### TTL Health Checks

For applications that need to actively report their health:

```go
// Update TTL check status
package main

import (
    "log"
    "time"

    "github.com/hashicorp/consul/api"
)

func main() {
    client, _ := api.NewClient(api.DefaultConfig())
    agent := client.Agent()

    // Periodically update the TTL check
    ticker := time.NewTicker(10 * time.Second)
    for range ticker.C {
        if applicationHealthy() {
            err := agent.UpdateTTL("app-ttl", "Application is healthy", api.HealthPassing)
            if err != nil {
                log.Printf("Failed to update TTL: %v", err)
            }
        } else {
            agent.UpdateTTL("app-ttl", "Application is degraded", api.HealthWarning)
        }
    }
}

func applicationHealthy() bool {
    // Check application health
    return true
}
```

## Key/Value Store

### Basic KV Operations

```bash
# Put a value
consul kv put config/database/host "10.0.1.5"
consul kv put config/database/port "5432"

# Get a value
consul kv get config/database/host

# Get with metadata
consul kv get -detailed config/database/host

# List keys with prefix
consul kv get -recurse config/

# Delete a key
consul kv delete config/database/host

# Delete recursively
consul kv delete -recurse config/database/

# Export all KV pairs
consul kv export config/ > backup.json

# Import KV pairs
consul kv import @backup.json

# Atomic Check-And-Set (CAS)
consul kv put -cas -modify-index=123 config/leader "node-1"
```

### Structured Configuration

```bash
# Store JSON configuration
consul kv put config/app/settings '{
  "debug": false,
  "log_level": "info",
  "features": {
    "new_ui": true,
    "beta_api": false
  },
  "database": {
    "max_connections": 100,
    "timeout": 30
  }
}'

# Retrieve and parse
consul kv get config/app/settings | jq .features
```

### KV API Usage

```go
// Go example for KV operations
package main

import (
    "encoding/json"
    "fmt"
    "log"

    "github.com/hashicorp/consul/api"
)

type AppConfig struct {
    Debug     bool   `json:"debug"`
    LogLevel  string `json:"log_level"`
    Database  struct {
        Host           string `json:"host"`
        Port           int    `json:"port"`
        MaxConnections int    `json:"max_connections"`
    } `json:"database"`
}

func main() {
    client, _ := api.NewClient(api.DefaultConfig())
    kv := client.KV()

    // Write configuration
    config := AppConfig{
        Debug:    false,
        LogLevel: "info",
    }
    config.Database.Host = "db.example.com"
    config.Database.Port = 5432
    config.Database.MaxConnections = 100

    data, _ := json.Marshal(config)
    p := &api.KVPair{Key: "config/app", Value: data}
    _, err := kv.Put(p, nil)
    if err != nil {
        log.Fatal(err)
    }

    // Read configuration
    pair, _, err := kv.Get("config/app", nil)
    if err != nil {
        log.Fatal(err)
    }

    var readConfig AppConfig
    json.Unmarshal(pair.Value, &readConfig)
    fmt.Printf("Config: %+v\n", readConfig)
}
```

### Watch for Changes

```bash
# Watch for changes using blocking queries
consul watch -type=key -key=config/app/settings ./reload-config.sh

# Watch for service changes
consul watch -type=service -service=web ./update-loadbalancer.sh
```

```go
// Programmatic watching
package main

import (
    "fmt"
    "log"

    "github.com/hashicorp/consul/api"
)

func main() {
    client, _ := api.NewClient(api.DefaultConfig())
    kv := client.KV()

    var lastIndex uint64 = 0

    for {
        // Blocking query - waits for changes
        pair, meta, err := kv.Get("config/app", &api.QueryOptions{
            WaitIndex: lastIndex,
        })
        if err != nil {
            log.Printf("Error: %v", err)
            continue
        }

        if meta.LastIndex != lastIndex {
            lastIndex = meta.LastIndex
            fmt.Printf("Configuration changed: %s\n", string(pair.Value))
            // Reload application configuration
        }
    }
}
```

## DNS Interface

### DNS Query Types

Consul provides a built-in DNS server for service discovery:

```bash
# Standard A record query
dig @127.0.0.1 -p 8600 web.service.consul

# Query specific datacenter
dig @127.0.0.1 -p 8600 web.service.dc2.consul

# Query by tag
dig @127.0.0.1 -p 8600 primary.web.service.consul

# SRV record (includes port)
dig @127.0.0.1 -p 8600 web.service.consul SRV

# Node lookup
dig @127.0.0.1 -p 8600 node1.node.consul

# Prepared query
dig @127.0.0.1 -p 8600 my-query.query.consul
```

### DNS Configuration

```hcl
# consul.hcl - DNS configuration

dns_config {
  # Allow stale reads for better performance
  allow_stale = true
  max_stale = "30s"

  # Cache settings
  node_ttl = "30s"
  service_ttl {
    "*" = "30s"
    "web" = "10s"
  }

  # Enable DNS caching
  enable_truncate = true
  only_passing = false

  # UDP response size limit
  udp_answer_limit = 3

  # Enable recursion
  recursor_timeout = "2s"
}

# Forward non-Consul queries to external DNS
recursors = ["8.8.8.8", "8.8.4.4"]

# Listen on standard DNS port (requires root or capabilities)
ports {
  dns = 53
}
```

### Integrating with System DNS

```bash
# Option 1: Configure dnsmasq
# /etc/dnsmasq.d/10-consul
server=/consul/127.0.0.1#8600

# Option 2: Configure systemd-resolved
# /etc/systemd/resolved.conf.d/consul.conf
[Resolve]
DNS=127.0.0.1:8600
Domains=~consul

# Option 3: Use iptables to redirect
iptables -t nat -A OUTPUT -d 127.0.0.1 -p udp --dport 53 -j REDIRECT --to-ports 8600
iptables -t nat -A OUTPUT -d 127.0.0.1 -p tcp --dport 53 -j REDIRECT --to-ports 8600
```

### Prepared Queries

Prepared queries provide advanced service discovery features:

```bash
# Create a prepared query via API
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "geo-web",
    "Service": {
      "Service": "web",
      "Tags": ["v1"],
      "Failover": {
        "NearestN": 3,
        "Datacenters": ["dc2", "dc3"]
      },
      "OnlyPassing": true,
      "Near": "_agent"
    },
    "DNS": {
      "TTL": "10s"
    }
  }' \
  http://localhost:8500/v1/query

# Query using DNS
dig @127.0.0.1 -p 8600 geo-web.query.consul

# Query via HTTP API
curl http://localhost:8500/v1/query/geo-web/execute
```

## Consul Connect (Service Mesh)

### Enabling Connect

Consul Connect provides secure service-to-service communication with automatic mTLS:

```hcl
# consul.hcl - Enable Connect

connect {
  enabled = true
}

# Enable Connect for the service
service {
  name = "web"
  port = 8080

  connect {
    sidecar_service {
      port = 21000

      proxy {
        upstreams = [
          {
            destination_name = "api"
            local_bind_port = 9191
          },
          {
            destination_name = "database"
            local_bind_port = 9192
          }
        ]
      }
    }
  }
}
```

### Service Mesh Architecture

```
Consul Connect Service Mesh:

+-------------------------------------------------------+
|                    Application Pod                     |
|  +------------------+       +----------------------+  |
|  |   Application    |       |   Envoy Sidecar     |  |
|  |                  |       |                      |  |
|  |  localhost:9191 ------->| Upstream: api        |  |
|  |  localhost:9192 ------->| Upstream: database   |  |
|  |                  |       |                      |  |
|  |  :8080 <---------------| Inbound Listener     |  |
|  +------------------+       +----------------------+  |
|                                      |                 |
+--------------------------------------|----------------+
                                       | mTLS
                                       v
+-------------------------------------------------------+
|              Consul Control Plane                      |
|  - Certificate Authority (CA)                         |
|  - Service Graph                                       |
|  - Intention Configuration                             |
+-------------------------------------------------------+
```

### Intentions (Authorization)

Intentions define which services are allowed to communicate:

```bash
# Allow web to communicate with api
consul intention create web api

# Deny all traffic to database by default
consul intention create -deny "*" database

# Allow specific service to access database
consul intention create api database

# List all intentions
consul intention list

# Check if communication is allowed
consul intention check web api
```

```hcl
# Intention configuration file
Kind = "service-intentions"
Name = "api"
Sources = [
  {
    Name = "web"
    Action = "allow"
  },
  {
    Name = "admin"
    Action = "allow"
    Permissions = [
      {
        Action = "allow"
        HTTP {
          PathPrefix = "/admin"
          Methods = ["GET", "POST"]
        }
      }
    ]
  },
  {
    Name = "*"
    Action = "deny"
  }
]
```

### Envoy Integration

Consul Connect uses Envoy as the default data plane proxy:

```bash
# Start Envoy sidecar for a service
consul connect envoy -sidecar-for web

# With custom configuration
consul connect envoy -sidecar-for web \
  -envoy-binary /usr/local/bin/envoy \
  -admin-bind localhost:19000
```

```yaml
# Kubernetes - Consul Connect Inject
apiVersion: v1
kind: Pod
metadata:
  name: web
  annotations:
    "consul.hashicorp.com/connect-inject": "true"
    "consul.hashicorp.com/connect-service-upstreams": "api:9191,database:9192"
spec:
  containers:
    - name: web
      image: myapp:latest
      ports:
        - containerPort: 8080
      env:
        - name: API_URL
          value: "http://localhost:9191"
        - name: DATABASE_URL
          value: "localhost:9192"
```

### Traffic Management

```hcl
# Service Router - Route traffic based on HTTP headers
Kind = "service-router"
Name = "api"
Routes = [
  {
    Match {
      HTTP {
        Header = [
          {
            Name = "x-version"
            Exact = "2"
          }
        ]
      }
    }
    Destination {
      Service = "api"
      ServiceSubset = "v2"
    }
  },
  {
    Match {
      HTTP {
        PathPrefix = "/admin"
      }
    }
    Destination {
      Service = "api-admin"
    }
  }
]
```

```hcl
# Service Splitter - Canary deployments
Kind = "service-splitter"
Name = "api"
Splits = [
  {
    Weight = 90
    ServiceSubset = "v1"
  },
  {
    Weight = 10
    ServiceSubset = "v2"
  }
]
```

```hcl
# Service Resolver - Load balancing and failover
Kind = "service-resolver"
Name = "api"
DefaultSubset = "v1"
Subsets = {
  v1 = {
    Filter = "Service.Meta.version == 1"
  }
  v2 = {
    Filter = "Service.Meta.version == 2"
  }
}
Failover = {
  "*" = {
    Datacenters = ["dc2", "dc3"]
  }
}
LoadBalancer = {
  Policy = "least_request"
  LeastRequestConfig = {
    ChoiceCount = 2
  }
}
```

## Access Control Lists (ACLs)

### ACL System Overview

Consul's ACL system provides authentication and authorization for cluster operations:

```
ACL Token Flow:

+--------+     +--------+     +--------+
| Client | --> | Token  | --> | Policy |
+--------+     +--------+     +--------+
                   |               |
                   v               v
              +--------+     +--------+
              | Secret |     |  Rules |
              |   ID   |     +--------+
              +--------+          |
                                  v
                            +-----------+
                            | Resources |
                            +-----------+
```

### Bootstrapping ACLs

```bash
# Bootstrap the ACL system (run once)
consul acl bootstrap

# Save the bootstrap token securely
# SecretID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

```hcl
# consul.hcl - Enable ACLs
acl {
  enabled = true
  default_policy = "deny"
  enable_token_persistence = true

  tokens {
    initial_management = "bootstrap-token-here"
    agent = "agent-token-here"
  }
}
```

### Creating Policies

```hcl
# policies/node-policy.hcl
node_prefix "" {
  policy = "read"
}

node "consul-server-1" {
  policy = "write"
}

agent_prefix "" {
  policy = "read"
}

agent "consul-server-1" {
  policy = "write"
}
```

```hcl
# policies/service-web.hcl
service "web" {
  policy = "write"
}

service "web-sidecar-proxy" {
  policy = "write"
}

service_prefix "" {
  policy = "read"
}

node_prefix "" {
  policy = "read"
}

# Allow health check registration
check_prefix "" {
  policy = "write"
}
```

```bash
# Create policies
consul acl policy create -name "node-policy" -rules @policies/node-policy.hcl
consul acl policy create -name "service-web" -rules @policies/service-web.hcl

# Create token with policies
consul acl token create \
  -description "Web service token" \
  -policy-name "service-web"
```

### Service and Agent Tokens

```hcl
# Different token types and their purposes

# Agent token - used by Consul agent for internal operations
acl {
  tokens {
    agent = "agent-token"
    default = "default-token-for-requests"
  }
}

# Service definition with token
service {
  name = "web"
  token = "service-specific-token"
  port = 8080
}
```

### ACL Roles

```hcl
# Create a role for web services
consul acl role create \
  -name "web-role" \
  -description "Role for web services" \
  -policy-name "service-web" \
  -policy-name "kv-read"

# Create token with role
consul acl token create \
  -description "Web service token" \
  -role-name "web-role"
```

## Multi-Datacenter Deployment

### WAN Federation

Consul supports multi-datacenter deployments for global service discovery:

```
Multi-Datacenter Architecture:

+---------------------------+     +---------------------------+
|       Datacenter 1        |     |       Datacenter 2        |
|                           |     |                           |
|  +-------+   +-------+    |     |    +-------+   +-------+  |
|  |Server1|---|Server2|    |     |    |Server1|---|Server2|  |
|  +-------+   +-------+    |     |    +-------+   +-------+  |
|       \         /         |     |         \         /       |
|        \       /          |     |          \       /        |
|       +-------+           |     |          +-------+        |
|       |Server3|           |     |          |Server3|        |
|       +-------+           |     |          +-------+        |
|           |               |     |               |           |
|           |   WAN Gossip  |     |   WAN Gossip  |           |
|           +-------------------------------------+           |
|                           |     |                           |
|  +--------+  +--------+   |     |   +--------+  +--------+  |
|  | Client |  | Client |   |     |   | Client |  | Client |  |
|  +--------+  +--------+   |     |   +--------+  +--------+  |
+---------------------------+     +---------------------------+
```

### Datacenter Configuration

```hcl
# DC1 Server Configuration
datacenter = "dc1"
primary_datacenter = "dc1"

# WAN address for cross-datacenter communication
advertise_addr_wan = "203.0.113.10"

# Join other datacenters
retry_join_wan = [
  "203.0.113.20",  # DC2 server
  "203.0.113.30"   # DC3 server
]

# Enable Connect across datacenters
connect {
  enabled = true
  enable_mesh_gateway_wan_federation = true
}
```

```hcl
# DC2 Server Configuration
datacenter = "dc2"
primary_datacenter = "dc1"

advertise_addr_wan = "203.0.113.20"

retry_join_wan = [
  "203.0.113.10",  # DC1 server
  "203.0.113.30"   # DC3 server
]
```

### Cross-Datacenter Service Discovery

```bash
# Query service in another datacenter
dig @127.0.0.1 -p 8600 web.service.dc2.consul

# HTTP API with datacenter parameter
curl "http://localhost:8500/v1/catalog/service/web?dc=dc2"
```

### Mesh Gateways

Mesh gateways enable cross-datacenter service mesh communication:

```hcl
# Mesh Gateway Service Registration
service {
  name = "mesh-gateway"
  kind = "mesh-gateway"
  port = 8443

  proxy {
    config {
      envoy_gateway_bind_addresses {
        wan {
          address = "0.0.0.0"
          port = 8443
        }
        lan {
          address = "0.0.0.0"
          port = 8444
        }
      }
    }
  }
}
```

```bash
# Start mesh gateway
consul connect envoy -gateway=mesh -register \
  -service "mesh-gateway" \
  -address "10.0.1.10:8443" \
  -wan-address "203.0.113.10:8443"
```

### Failover Configuration

```hcl
# Service resolver with cross-datacenter failover
Kind = "service-resolver"
Name = "api"
ConnectTimeout = "5s"
Failover = {
  "*" = {
    Datacenters = ["dc2", "dc3"]
  }
}
```

## Kubernetes Integration

### Installing with Helm

```bash
# Add HashiCorp Helm repository
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

# Install Consul
helm install consul hashicorp/consul \
  --namespace consul \
  --create-namespace \
  --values values.yaml
```

```yaml
# values.yaml
global:
  name: consul
  datacenter: dc1

  # Enable TLS for all components
  tls:
    enabled: true
    enableAutoEncrypt: true
    verify: true

  # Enable ACLs
  acls:
    manageSystemACLs: true

# Server configuration
server:
  replicas: 3
  bootstrapExpect: 3
  storage: 10Gi
  storageClass: standard

  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"

# Client configuration
client:
  enabled: true
  grpc: true

# Connect/Service Mesh
connectInject:
  enabled: true
  default: false  # Require explicit annotation

# Mesh Gateway for multi-cluster
meshGateway:
  enabled: true
  replicas: 2

# Ingress Gateway
ingressGateways:
  enabled: true
  gateways:
    - name: ingress-gateway
      replicas: 2
      service:
        type: LoadBalancer

# Consul UI
ui:
  enabled: true
  service:
    type: LoadBalancer
```

### Service Mesh on Kubernetes

```yaml
# Deploy application with Connect sidecar
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
      annotations:
        # Enable Connect injection
        "consul.hashicorp.com/connect-inject": "true"
        # Define upstream services
        "consul.hashicorp.com/connect-service-upstreams": "api:9191,cache:9192"
        # Enable metrics
        "consul.hashicorp.com/enable-metrics": "true"
        "consul.hashicorp.com/prometheus-scrape-port": "20200"
    spec:
      serviceAccountName: web
      containers:
        - name: web
          image: myapp/web:v1
          ports:
            - containerPort: 8080
          env:
            - name: API_URL
              value: "http://localhost:9191"
            - name: CACHE_URL
              value: "localhost:9192"
```

```yaml
# Service Intentions via CRD
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceIntentions
metadata:
  name: api-intentions
spec:
  destination:
    name: api
  sources:
    - name: web
      action: allow
    - name: admin
      action: allow
      permissions:
        - action: allow
          http:
            pathPrefix: /admin
            methods:
              - GET
              - POST
    - name: "*"
      action: deny
```

### Sync Services

```yaml
# values.yaml - Enable catalog sync
syncCatalog:
  enabled: true

  # Sync Kubernetes services to Consul
  toConsul: true

  # Sync Consul services to Kubernetes
  toK8S: true

  # Only sync specific services
  k8sAllowNamespaces: ["default", "production"]
  k8sDenyNamespaces: ["kube-system"]

  # Prefix for synced services
  k8sPrefix: "k8s-"
  consulPrefix: "consul-"
```

## Best Practices

### Production Deployment Checklist

```
Production Readiness Checklist:

[x] Server Configuration
    - 3 or 5 servers per datacenter
    - Dedicated storage for data directory
    - Proper resource allocation

[x] Security
    - ACLs enabled with default deny
    - TLS encryption for all communication
    - Gossip encryption enabled
    - Secure token management

[x] High Availability
    - Multi-AZ server deployment
    - Automated backup strategy
    - Disaster recovery plan
    - Health monitoring and alerting

[x] Performance
    - Appropriate hardware sizing
    - Network latency considerations
    - Caching configuration optimized
    - Connection pooling configured

[x] Observability
    - Metrics exported to monitoring system
    - Log aggregation configured
    - Distributed tracing enabled
    - Dashboard and alerts set up
```

### Security Hardening

```hcl
# Production security configuration

# Enable TLS
tls {
  defaults {
    verify_incoming = true
    verify_outgoing = true
    verify_server_hostname = true
    ca_file = "/etc/consul.d/certs/consul-agent-ca.pem"
    cert_file = "/etc/consul.d/certs/dc1-server-consul-0.pem"
    key_file = "/etc/consul.d/certs/dc1-server-consul-0-key.pem"
  }

  internal_rpc {
    verify_server_hostname = true
  }

  grpc {
    verify_incoming = true
  }
}

# ACL configuration
acl {
  enabled = true
  default_policy = "deny"
  enable_token_persistence = true
  enable_token_replication = true
}

# Limit HTTP API access
http_config {
  block_endpoints = [
    "/v1/agent/members",
    "/v1/operator/"
  ]
}

# Disable script checks unless needed
enable_script_checks = false
enable_local_script_checks = false

# Audit logging
audit {
  enabled = true
  sink "file" {
    type = "file"
    format = "json"
    path = "/var/log/consul/audit.log"
    delivery_guarantee = "best-effort"
  }
}
```

### Monitoring and Observability

```yaml
# Prometheus ServiceMonitor for Consul
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: consul
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: consul
  endpoints:
    - port: http
      path: /v1/agent/metrics
      params:
        format: ["prometheus"]
      interval: 15s
```

```promql
# Key Consul metrics

# Raft commit time (should be < 50ms)
histogram_quantile(0.99,
  sum(rate(consul_raft_commitTime_bucket[5m])) by (le))

# Leader elections (should be rare)
sum(increase(consul_raft_state_leader[1h]))

# Service health
consul_catalog_services_total
consul_health_service_status{status="critical"}

# RPC latency
histogram_quantile(0.99,
  sum(rate(consul_rpc_query_bucket[5m])) by (le))

# KV store operations
rate(consul_kvs_apply_count[5m])
```

### Backup and Recovery

```bash
# Create snapshot
consul snapshot save backup.snap

# Automated backup script
#!/bin/bash
BACKUP_DIR="/var/backups/consul"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/consul-${DATE}.snap"

consul snapshot save "${BACKUP_FILE}"

# Compress and retain only last 7 days
gzip "${BACKUP_FILE}"
find "${BACKUP_DIR}" -name "*.snap.gz" -mtime +7 -delete

# Upload to S3
aws s3 cp "${BACKUP_FILE}.gz" "s3://my-backups/consul/"
```

```bash
# Restore from snapshot
consul snapshot restore backup.snap

# Verify snapshot
consul snapshot inspect backup.snap
```

## Troubleshooting

### Common Issues

```bash
# Check cluster health
consul members
consul operator raft list-peers

# Debug service registration
consul catalog services
consul catalog nodes -service=web

# Check service health
consul health checks web

# View agent logs
journalctl -u consul -f

# Debug DNS issues
dig @127.0.0.1 -p 8600 web.service.consul +trace

# Check Connect proxy status
consul connect proxy -service web -upstream api:9191 -log-level debug

# Validate configuration
consul validate /etc/consul.d/

# Check ACL token permissions
consul acl token read -id <token-id>
```

### Performance Tuning

```hcl
# Performance configuration

# Raft performance (reduce for slower networks)
performance {
  raft_multiplier = 1  # Default is 5 for development
}

# Increase limits for large clusters
limits {
  http_max_conns_per_client = 200
  rpc_max_conns_per_client = 100
}

# DNS cache settings
dns_config {
  node_ttl = "30s"
  service_ttl {
    "*" = "30s"
  }
  allow_stale = true
  max_stale = "87600h"  # 10 years, rely on TTL
}

# Disable unused features
disable_remote_exec = true
disable_update_check = true
```

## Interview Key Points

### Core Concepts

**Q1: What is Consul and what problems does it solve?**

A: Consul is a service mesh solution providing:
- **Service Discovery**: Dynamic service registration and discovery
- **Health Checking**: Automatic health monitoring and failover
- **KV Store**: Distributed configuration management
- **Secure Communication**: mTLS via Consul Connect
- **Multi-Datacenter**: Native federation support

**Q2: Explain the difference between Consul servers and clients**

A:
- **Servers**: Participate in Raft consensus, store cluster state, handle queries. Deploy 3 or 5 per datacenter.
- **Clients**: Lightweight agents on each node, forward requests to servers, cache results, participate in gossip.

### Architecture Questions

**Q3: How does Consul achieve consistency?**

A: Consul uses the Raft consensus protocol:
- Leader election ensures single writer
- Log replication to followers
- Configurable consistency modes (default, consistent, stale)
- Gossip protocol for membership and failure detection

**Q4: How does Consul Connect work?**

A: Consul Connect provides service mesh capabilities:
- Sidecar proxies (Envoy) handle service-to-service communication
- Automatic mTLS encryption
- Intentions define authorization policies
- Traffic management (routing, splitting, failover)

### Practical Scenarios

**Q5: How would you implement blue-green deployments with Consul?**

```hcl
# Use service resolvers and splitters
Kind = "service-resolver"
Name = "api"
Subsets = {
  blue = { Filter = "Service.Meta.version == blue" }
  green = { Filter = "Service.Meta.version == green" }
}

Kind = "service-splitter"
Name = "api"
Splits = [
  { Weight = 100, ServiceSubset = "blue" },
  { Weight = 0, ServiceSubset = "green" }
]
```

**Q6: How do you handle multi-datacenter failover?**

A: Configure service resolvers with failover:
```hcl
Kind = "service-resolver"
Name = "api"
Failover = {
  "*" = {
    Datacenters = ["dc2", "dc3"]
  }
}
```
Use mesh gateways for cross-datacenter Connect traffic.

## Summary

Consul is a powerful service mesh and service discovery solution that addresses critical challenges in distributed systems:

**Key Takeaways:**

1. **Service Discovery** enables dynamic, health-aware service location without hardcoded addresses
2. **Health Checking** provides automatic failure detection and service deregistration
3. **KV Store** offers distributed configuration management with watch capabilities
4. **Consul Connect** delivers secure service-to-service communication with mTLS
5. **Multi-Datacenter** support enables global service discovery and failover
6. **ACLs** provide fine-grained access control for security

Consul integrates well with container orchestrators like Kubernetes while also supporting traditional VM and bare-metal deployments, making it a versatile choice for organizations with diverse infrastructure.

## Further Reading

- [Consul Official Documentation](https://developer.hashicorp.com/consul/docs)
- [Consul Tutorials](https://developer.hashicorp.com/consul/tutorials)
- [Consul Connect Deep Dive](https://developer.hashicorp.com/consul/docs/connect)
- [Consul on Kubernetes](https://developer.hashicorp.com/consul/docs/k8s)
- [Consul API Reference](https://developer.hashicorp.com/consul/api-docs)
- [HashiCorp Learn - Consul](https://learn.hashicorp.com/consul)
- [Envoy Proxy Documentation](https://www.envoyproxy.io/docs/envoy/latest/)
- [Service Mesh Comparison](https://servicemesh.es/)
