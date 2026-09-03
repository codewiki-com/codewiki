---
title: Runtime Security (Falco)
description: A comprehensive guide to Falco - cloud-native runtime security for containers and Kubernetes
track: security
section: infra-security
difficulty: intermediate
tags:
  - Falco
  - Runtime Security
  - Kubernetes
  - eBPF
  - Container Security
  - CNCF
status: imported
origin: old/src/content/docs/security/falco.en.md
divergence: 0.214
issues: []
legacy:
  category: Security
  subcategory: Cloud Security
  order: 16
  lastUpdated: 2026-01-20
---

Runtime security is a critical layer in the defense-in-depth strategy for cloud-native environments. While image scanning catches vulnerabilities before deployment and network policies restrict traffic flow, runtime security monitors what actually happens inside your containers and hosts during execution. Falco, a CNCF graduated project, has emerged as the de facto standard for cloud-native runtime security, providing real-time threat detection by monitoring system calls and kernel events.

## Understanding Runtime Security

### What is Runtime Security?

Runtime security focuses on detecting and responding to threats that occur while applications are running. Unlike static analysis (which examines code or images before deployment), runtime security observes actual behavior patterns and identifies anomalies in real-time.

```
+------------------------------------------------------------------+
|                    Security Lifecycle Coverage                     |
+------------------------------------------------------------------+
|                                                                    |
|   Development        Build           Deploy          Runtime       |
|   +---------+     +---------+     +---------+     +---------+     |
|   |  SAST   |     |  Image  |     | Admission|     | Runtime |     |
|   |  Code   |---->| Scanning|---->| Control  |---->| Security|     |
|   | Review  |     |  SBOM   |     | Policy   |     | Monitor |     |
|   +---------+     +---------+     +---------+     +---------+     |
|                                                                    |
|   Pre-deployment Security          |    Runtime Security          |
|   - Find known vulnerabilities     |    - Detect unknown threats  |
|   - Policy compliance              |    - Behavioral anomalies    |
|   - Configuration validation       |    - Real-time response      |
|                                                                    |
+------------------------------------------------------------------+
```

### Why Runtime Security Matters

Traditional security approaches have significant gaps when it comes to cloud-native environments:

1. **Zero-Day Vulnerabilities**: Image scanners can't detect vulnerabilities that aren't yet catalogued
2. **Configuration Drift**: Containers may behave differently in production than expected
3. **Insider Threats**: Legitimate access can be misused
4. **Supply Chain Attacks**: Compromised dependencies may pass initial scans
5. **Living-off-the-Land Attacks**: Attackers use legitimate tools for malicious purposes

Runtime security addresses these gaps by monitoring actual behavior rather than relying solely on static analysis.

### Falco: The CNCF Standard

Falco was originally created by Sysdig in 2016 and donated to the Cloud Native Computing Foundation (CNCF) in 2018. It graduated as a CNCF project in 2024, indicating its maturity, adoption, and the community's confidence in its long-term viability.

**Key Characteristics:**
- Open source and vendor-neutral
- Extensible rule engine
- Support for multiple data sources
- Strong community and ecosystem
- Integration with cloud-native tooling

## Core Architecture and Principles

### System Call Monitoring

At its core, Falco monitors system calls - the interface between user-space applications and the Linux kernel. Every significant action (file access, network connections, process creation) requires a system call, making this an ideal observation point.

```
+------------------------------------------------------------------+
|                    Falco Architecture                              |
+------------------------------------------------------------------+
|                                                                    |
|   User Space                                                       |
|   +----------------------------------------------------------+    |
|   |  Applications    |    Containers    |    Pods           |    |
|   +----------------------------------------------------------+    |
|                            |                                       |
|                            | System Calls                          |
|                            v                                       |
|   +----------------------------------------------------------+    |
|   |                    Linux Kernel                           |    |
|   |  +--------------------------------------------------+    |    |
|   |  |              Falco Driver                         |    |    |
|   |  |   +----------------+  +-------------------+       |    |    |
|   |  |   | Kernel Module  |  |  eBPF Probe       |       |    |    |
|   |  |   | (kmod)         |  |  (modern-ebpf)    |       |    |    |
|   |  |   +----------------+  +-------------------+       |    |    |
|   |  +--------------------------------------------------+    |    |
|   +----------------------------------------------------------+    |
|                            |                                       |
|                            | Events                                |
|                            v                                       |
|   +----------------------------------------------------------+    |
|   |                 Falco Engine                              |    |
|   |  +------------+  +-------------+  +------------------+    |    |
|   |  | Event      |  | Rule        |  | Output           |    |    |
|   |  | Parser     |->| Engine      |->| Channels         |    |    |
|   |  +------------+  +-------------+  +------------------+    |    |
|   +----------------------------------------------------------+    |
|                                                                    |
+------------------------------------------------------------------+
```

### Driver Options

Falco supports multiple driver technologies for capturing system events:

| Driver | Description | Pros | Cons |
|--------|-------------|------|------|
| `modern-ebpf` | Modern eBPF probe | No kernel headers needed, CO-RE support | Requires kernel 5.8+ |
| `ebpf` | Classic eBPF probe | Wider kernel support | Needs kernel headers |
| `kmod` | Kernel module | Best performance | Requires compilation for each kernel |
| `plugin` | Plugin-based sources | Extensible, cloud events | Limited to specific sources |

**Recommended approach:** Use `modern-ebpf` for new deployments on modern kernels (5.8+). It leverages CO-RE (Compile Once, Run Everywhere) technology, eliminating the need for kernel headers.

### Rule Engine

Falco's rule engine evaluates events against a set of rules written in YAML. The engine uses a highly optimized filtering mechanism to minimize performance overhead.

```yaml
# Anatomy of a Falco rule
- rule: Terminal shell in container
  desc: >
    A shell was used as the entrypoint/exec point into a container
    with an attached terminal.
  condition: >
    spawned_process
    and container
    and shell_procs
    and proc.tty != 0
    and container_entrypoint
    and not user_expected_terminal_shell_in_container_conditions
  output: >
    A shell was spawned in a container with an attached terminal
    (evt.type=%evt.type user=%user.name user_uid=%user.uid
    user_loginuid=%user.loginuid process=%proc.name
    proc_exepath=%proc.exepath parent=%proc.pname
    command=%proc.cmdline terminal=%proc.tty exe_flags=%evt.arg.flags
    %container.info)
  priority: NOTICE
  tags: [maturity_stable, container, shell, mitre_execution, T1059]
```

## Key Concepts and Rule Syntax

### Rule Components

A Falco rule consists of several key components:

```yaml
- rule: <rule_name>           # Unique identifier for the rule
  desc: <description>          # Human-readable description
  condition: <filter_expr>     # Boolean expression that triggers the rule
  output: <output_format>      # Message format when rule triggers
  priority: <severity>         # EMERGENCY, ALERT, CRITICAL, ERROR, WARNING, NOTICE, INFO, DEBUG
  tags: [<tag1>, <tag2>]      # Categorization tags
  enabled: true/false          # Whether rule is active
  source: syscall/k8s_audit    # Event source type
```

### Macros and Lists

Macros and lists help create reusable, maintainable rules:

```yaml
# Lists - Named collections of items
- list: shell_binaries
  items: [ash, bash, csh, ksh, sh, tcsh, zsh, dash]

- list: sensitive_file_names
  items:
    - /etc/shadow
    - /etc/sudoers
    - /etc/pam.conf
    - /etc/security/pwquality.conf

# Macros - Named conditions for reuse
- macro: shell_procs
  condition: proc.name in (shell_binaries)

- macro: container
  condition: container.id != host

- macro: spawned_process
  condition: >
    evt.type in (execve, execveat)
    and evt.dir = <

- macro: open_write
  condition: >
    evt.type in (open, openat, openat2)
    and evt.is_open_write = true
    and fd.typechar = 'f'
    and fd.num >= 0
```

### Common Fields and Operators

Falco provides rich field access for building conditions:

```yaml
# Process fields
proc.name          # Process name
proc.exe           # Full executable path
proc.cmdline       # Full command line
proc.pname         # Parent process name
proc.pcmdline      # Parent command line
proc.aname[n]      # Ancestor name at level n
proc.tty           # TTY number (0 if none)

# File descriptor fields
fd.name            # Full file path
fd.directory       # Directory portion of path
fd.filename        # File name only
fd.typechar        # Type: f(file), d(directory), i(ipv4), etc.

# User fields
user.name          # User name
user.uid           # User ID
user.loginuid      # Login UID (for audit trail)

# Container fields
container.id       # Container ID
container.name     # Container name
container.image    # Container image name
container.image.repository  # Image repository

# Kubernetes fields (with k8s metadata enabled)
k8s.pod.name       # Pod name
k8s.ns.name        # Namespace
k8s.deployment.name # Deployment name

# Event fields
evt.type           # System call type
evt.dir            # Direction: > (enter) or < (exit)
evt.time           # Event timestamp
evt.arg.X          # System call argument X
```

### Built-in Rule Sets

Falco ships with comprehensive default rules covering common security scenarios:

```yaml
# Categories of built-in rules:

# 1. Container-specific rules
- Terminal shell in container
- Container drift detected (new executable)
- Launch privileged container
- Mount sensitive paths into container

# 2. File integrity rules
- Read sensitive file untrusted
- Write below etc
- Write below root
- Modify binary dirs

# 3. Process rules
- Unexpected process spawned
- User mgmt binaries
- Schedule cron jobs

# 4. Network rules
- Unexpected outbound connection
- Unexpected inbound connection
- Network connection outside subnet

# 5. Privilege escalation rules
- Sudo potential privilege escalation
- Non sudo setuid
- User privilege escalation

# 6. Cryptomining detection
- Detect crypto miners using stratum protocol
- Detect outbound connections to common miner pools
```

## Installation and Configuration

### Installing Falco with Helm

The recommended installation method for Kubernetes is using Helm:

```bash
# Add Falco Helm repository
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

# Install Falco with modern eBPF driver
helm install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace \
  --set driver.kind=modern_ebpf \
  --set falcosidekick.enabled=true \
  --set falcosidekick.webui.enabled=true
```

### Detailed Helm Configuration

```yaml
# values.yaml - Production-ready Falco configuration
driver:
  kind: modern_ebpf  # Use modern eBPF driver
  ebpf:
    hostNetwork: true

falco:
  # JSON output for log aggregation
  json_output: true
  json_include_output_property: true
  json_include_tags_property: true

  # Log level
  log_level: info

  # Enable kernel events
  syscall_event_drops:
    actions:
      - log
      - alert

  # Rule file locations
  rules_file:
    - /etc/falco/falco_rules.yaml
    - /etc/falco/falco_rules.local.yaml
    - /etc/falco/rules.d

  # Output settings
  stdout_output:
    enabled: true

  # HTTP output for external systems
  http_output:
    enabled: true
    url: http://falcosidekick:2801/

  # gRPC for Falco integrations
  grpc:
    enabled: true
    bind_address: "unix:///run/falco/falco.sock"
    threadiness: 8

  grpc_output:
    enabled: true

# Resource limits
resources:
  limits:
    cpu: 1000m
    memory: 1024Mi
  requests:
    cpu: 100m
    memory: 512Mi

# Tolerations for all nodes
tolerations:
  - effect: NoSchedule
    operator: Exists

# Falcosidekick configuration
falcosidekick:
  enabled: true
  config:
    slack:
      webhookurl: ""  # Add your Slack webhook
      minimumpriority: warning
    prometheus:
      extralabels: "source:falco"

  webui:
    enabled: true
    replicaCount: 1

# Custom rules ConfigMap
customRules:
  custom-rules.yaml: |-
    - rule: Unauthorized AWS Metadata Access
      desc: Detect attempts to access AWS metadata service
      condition: >
        outbound
        and fd.sip = "169.254.169.254"
        and not aws_metadata_allowed
      output: >
        Unauthorized AWS metadata access attempt
        (user=%user.name command=%proc.cmdline connection=%fd.name
        %container.info)
      priority: WARNING
      tags: [cloud, aws, metadata]
```

### Installing on Linux Hosts

For non-Kubernetes deployments:

```bash
# Debian/Ubuntu
curl -fsSL https://falco.org/repo/falcosecurity-packages.asc | \
  sudo gpg --dearmor -o /usr/share/keyrings/falco-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/falco-archive-keyring.gpg] \
  https://download.falco.org/packages/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/falcosecurity.list

sudo apt-get update
sudo apt-get install -y falco

# RHEL/CentOS
sudo rpm --import https://falco.org/repo/falcosecurity-packages.asc
sudo curl -fsSL -o /etc/yum.repos.d/falcosecurity.repo \
  https://falco.org/repo/falcosecurity-rpm.repo
sudo yum install -y falco

# Start Falco with modern eBPF driver
sudo falco --modern-bpf
```

### Configuration File Structure

```yaml
# /etc/falco/falco.yaml - Main configuration file

# Rules configuration
rules_file:
  - /etc/falco/falco_rules.yaml
  - /etc/falco/falco_rules.local.yaml
  - /etc/falco/rules.d

# Watch for rule file changes
watch_config_files: true

# Output settings
json_output: true
json_include_output_property: true
json_include_tags_property: true

# Logging
log_stderr: true
log_syslog: true
log_level: info

# Output channels
stdout_output:
  enabled: true

syslog_output:
  enabled: true

file_output:
  enabled: true
  keep_alive: false
  filename: /var/log/falco/events.log

http_output:
  enabled: true
  url: http://localhost:2801/
  user_agent: "falco/0.37.0"
  insecure: false

program_output:
  enabled: false
  keep_alive: false
  program: "jq '{text: .output}' | curl -s -X POST https://hooks.slack.com/... -d @-"

# Buffered outputs (for performance)
buffered_outputs: true
output_timeout: 2000

# Priority settings
priority: debug  # Minimum priority to output

# Rate limiting
outputs_rate: 1
outputs_max_burst: 1000

# Syscall event settings
syscall_event_drops:
  threshold: 0.1
  actions:
    - log
    - alert
  rate: 0.03333
  max_burst: 1

syscall_event_timeouts:
  max_consecutives: 1000

# Base syscalls (always enabled)
base_syscalls:
  custom_set: []
  repair: false

# Metadata settings
metadata_download:
  max_mb: 100
  chunk_wait_us: 1000
  watch_freq_sec: 1
```

## Writing Custom Rules

### Basic Rule Examples

```yaml
# Detect shell spawned in container
- rule: Shell Spawned in Container
  desc: Detect when a shell is spawned inside a container
  condition: >
    spawned_process
    and container
    and shell_procs
  output: >
    Shell spawned in container
    (user=%user.name user_uid=%user.uid shell=%proc.name
    parent=%proc.pname cmdline=%proc.cmdline container=%container.name
    image=%container.image.repository)
  priority: WARNING
  tags: [container, shell, mitre_execution]

# Detect sensitive file access
- rule: Sensitive File Access
  desc: Detect read access to sensitive files
  condition: >
    open_read
    and container
    and fd.name in (sensitive_file_names)
    and not proc.name in (trusted_readers)
  output: >
    Sensitive file read in container
    (file=%fd.name user=%user.name command=%proc.cmdline
    container=%container.name image=%container.image.repository)
  priority: WARNING
  tags: [filesystem, sensitive_files]

# Detect outbound connection to suspicious ports
- rule: Outbound Connection to Suspicious Port
  desc: Detect connections to ports commonly used for C2
  condition: >
    outbound
    and container
    and fd.sport in (suspicious_ports)
    and not fd.sip in (allowed_external_ips)
  output: >
    Suspicious outbound connection
    (command=%proc.cmdline connection=%fd.name port=%fd.sport
    container=%container.name)
  priority: WARNING
  tags: [network, c2]

- list: suspicious_ports
  items: [4444, 5555, 6666, 1337, 31337, 8888]
```

### Advanced Rule Patterns

```yaml
# Detect container escape attempts via mounted Docker socket
- rule: Docker Socket Access in Container
  desc: Detect container accessing Docker socket
  condition: >
    container
    and (
      (open_write and fd.name = "/var/run/docker.sock")
      or (spawned_process and proc.name = "docker")
    )
  output: >
    Docker socket access from container (potential escape)
    (user=%user.name command=%proc.cmdline container=%container.name
    image=%container.image.repository)
  priority: CRITICAL
  tags: [container, escape, mitre_privilege_escalation]

# Detect cryptocurrency mining activity
- rule: Cryptocurrency Mining Detected
  desc: Detect potential cryptocurrency mining activity
  condition: >
    spawned_process
    and (
      proc.name in (crypto_miner_names)
      or proc.cmdline contains "stratum+tcp://"
      or proc.cmdline contains "stratum+ssl://"
      or proc.cmdline contains "--donate-level"
      or proc.cmdline contains "-o pool."
      or proc.cmdline contains "xmr."
      or proc.cmdline contains "monero"
    )
  output: >
    Possible cryptocurrency mining activity detected
    (user=%user.name command=%proc.cmdline container=%container.name
    image=%container.image.repository)
  priority: CRITICAL
  tags: [cryptomining, mitre_resource_hijacking]

- list: crypto_miner_names
  items: [
    xmrig, xmr-stak, minerd, cpuminer, cgminer, bfgminer,
    ethminer, minergate, nicehash, phoenixminer
  ]

# Detect reverse shell patterns
- rule: Reverse Shell Detected
  desc: Detect common reverse shell patterns
  condition: >
    spawned_process
    and container
    and (
      (proc.cmdline contains "/dev/tcp/" and proc.cmdline contains "bash")
      or (proc.cmdline contains "nc " and proc.cmdline contains " -e ")
      or (proc.cmdline contains "ncat " and proc.cmdline contains " -e ")
      or (proc.name = "python" and proc.cmdline contains "socket" and proc.cmdline contains "subprocess")
      or (proc.cmdline contains "php" and proc.cmdline contains "fsockopen")
      or proc.cmdline contains "mknod" and proc.cmdline contains "backpipe"
    )
  output: >
    Reverse shell detected
    (user=%user.name command=%proc.cmdline container=%container.name
    image=%container.image.repository)
  priority: CRITICAL
  tags: [network, reverse_shell, mitre_command_and_control]

# Detect privilege escalation via setuid
- rule: Setuid or Setgid bit Set
  desc: Detect setting of setuid/setgid bits on files
  condition: >
    consider_all_chmods
    and chmod
    and (evt.arg.mode contains "S_ISUID" or evt.arg.mode contains "S_ISGID")
    and not user.name = "root"
  output: >
    Setuid/setgid bit set on file
    (user=%user.name command=%proc.cmdline file=%fd.name
    mode=%evt.arg.mode container=%container.name)
  priority: WARNING
  tags: [filesystem, privilege_escalation]
```

### Rules for Kubernetes Audit Events

```yaml
# Enable Kubernetes audit log source in falco.yaml
# plugins:
#   - name: k8saudit
#     library_path: libk8saudit.so
#     open_params: "http://:9765/k8s-audit"

# Detect anonymous auth attempt
- rule: Anonymous Auth Attempt
  desc: Detect attempts to authenticate anonymously
  condition: >
    ka.verb in (get, list, watch, create, update, patch, delete)
    and ka.user.name = "system:anonymous"
  output: >
    Anonymous auth attempt detected
    (user=%ka.user.name verb=%ka.verb resource=%ka.target.resource
    namespace=%ka.target.namespace name=%ka.target.name)
  priority: WARNING
  source: k8s_audit
  tags: [k8s, authentication]

# Detect exec into pod
- rule: Exec into Pod
  desc: Detect exec/attach to pod
  condition: >
    ka.verb = create
    and ka.target.subresource in (exec, attach)
    and not ka.user.name in (allowed_exec_users)
  output: >
    Exec/attach to pod detected
    (user=%ka.user.name verb=%ka.verb pod=%ka.target.name
    namespace=%ka.target.namespace)
  priority: NOTICE
  source: k8s_audit
  tags: [k8s, exec]

- list: allowed_exec_users
  items: [admin, developer]

# Detect secret access
- rule: Secret Accessed
  desc: Detect when secrets are read
  condition: >
    ka.verb in (get, list)
    and ka.target.resource = "secrets"
    and not ka.user.name in (system_accounts)
  output: >
    Secret accessed
    (user=%ka.user.name secret=%ka.target.name
    namespace=%ka.target.namespace)
  priority: INFO
  source: k8s_audit
  tags: [k8s, secrets]
```

## Output Channels and Integration

### Falcosidekick Configuration

Falcosidekick is the recommended way to forward Falco alerts to various destinations:

```yaml
# Helm values for Falcosidekick
falcosidekick:
  enabled: true
  config:
    # Slack integration
    slack:
      webhookurl: "https://hooks.slack.com/services/XXX/YYY/ZZZ"
      channel: "#security-alerts"
      username: "Falco"
      icon: "https://falco.org/favicon.png"
      minimumpriority: "warning"
      messageformat: |
        *Rule*: {{ .Rule }}
        *Priority*: {{ .Priority }}
        *Output*: {{ .Output }}
        *Time*: {{ .Time }}

    # Elasticsearch
    elasticsearch:
      hostport: "https://elasticsearch:9200"
      index: "falco"
      type: "_doc"
      minimumpriority: "debug"
      mutualtls: false
      checkcert: true

    # Prometheus metrics
    prometheus:
      extralabels: "source:falco,environment:production"

    # AWS CloudWatch
    aws:
      cloudwatchlogs:
        loggroup: "/falco/alerts"
        logstream: ""
        minimumpriority: "warning"

    # PagerDuty
    pagerduty:
      routingkey: "YOUR_ROUTING_KEY"
      minimumpriority: "critical"

    # Kafka
    kafka:
      hostport: "kafka:9092"
      topic: "falco-alerts"
      minimumpriority: "debug"

    # Webhook (generic)
    webhook:
      address: "https://your-webhook-endpoint.com/falco"
      minimumpriority: "warning"
      customHeaders:
        Authorization: "Bearer YOUR_TOKEN"
```

### Direct Output Configuration

```yaml
# /etc/falco/falco.yaml - Direct output channels

# File output
file_output:
  enabled: true
  keep_alive: false
  filename: /var/log/falco/events.log

# Program output (pipe to external command)
program_output:
  enabled: true
  keep_alive: true
  program: |
    while read line; do
      echo "$line" | jq -c '{
        alert_type: "falco",
        message: .output,
        priority: .priority,
        rule: .rule,
        timestamp: .time
      }' | curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_TOKEN" \
        -d @- https://siem.company.com/api/alerts
    done

# HTTP output
http_output:
  enabled: true
  url: http://falcosidekick:2801/
  user_agent: "falco/0.37.0"
  insecure: false
  mtls: false

# gRPC output (for Falco Sidekick and other integrations)
grpc:
  enabled: true
  bind_address: "unix:///run/falco/falco.sock"
  threadiness: 8

grpc_output:
  enabled: true
```

### Integration with SIEM Systems

```yaml
# Example: Splunk HEC integration via Falcosidekick
falcosidekick:
  config:
    splunk:
      hostport: "https://splunk-hec.company.com:8088"
      token: "YOUR_HEC_TOKEN"
      index: "security"
      source: "falco"
      sourcetype: "falco:alert"
      minimumpriority: "debug"

---
# Example: Sumo Logic integration
falcosidekick:
  config:
    sumologic:
      receiverurl: "https://endpoint.sumologic.com/receiver/v1/http/YOUR_ENDPOINT"
      minimumpriority: "warning"
      sourcecategory: "security/falco"
      sourcehost: ""
      name: ""

---
# Example: Datadog integration
falcosidekick:
  config:
    datadog:
      apikey: "YOUR_DD_API_KEY"
      minimumpriority: "warning"
```

## Best Practices

### Rule Tuning Strategy

1. **Start in Audit Mode**: Enable rules in audit-only mode before enforcing

```yaml
# Audit mode - log but don't enforce
- rule: My New Rule
  desc: Testing new detection rule
  condition: <your_condition>
  output: <your_output>
  priority: DEBUG  # Start with low priority
  tags: [audit, testing]
```

2. **Baseline Normal Behavior**: Understand what's normal before alerting on anomalies

```bash
# Collect baseline data
kubectl logs -n falco -l app.kubernetes.io/name=falco \
  --since=24h | jq -r '.rule' | sort | uniq -c | sort -rn
```

3. **Iterative Refinement**: Continuously refine rules based on false positives

```yaml
# Refine rules with exceptions
- macro: allowed_package_managers
  condition: >
    proc.name in (apt, apt-get, dpkg, yum, rpm, dnf, apk)
    and container.image.repository in (trusted_build_images)

- list: trusted_build_images
  items:
    - docker.io/library/ubuntu
    - gcr.io/distroless/base
```

### Noise Reduction Techniques

```yaml
# 1. Use specific container/image matching
- macro: my_app_container
  condition: >
    container.image.repository = "mycompany/myapp"
    or k8s.deployment.name = "myapp"

# 2. Whitelist known good behavior
- list: known_outbound_destinations
  items:
    - "api.example.com"
    - "*.cloudprovider.com"

- macro: allowed_outbound
  condition: >
    fd.sip.name in (known_outbound_destinations)

# 3. Time-based exceptions (maintenance windows)
- macro: maintenance_window
  condition: >
    (evt.time.hour >= 2 and evt.time.hour < 4)
    and evt.time.weekday in (0, 6)

# 4. User-based exceptions
- list: ops_users
  items: [admin, sre-bot, deployment-bot]

- macro: ops_activity
  condition: user.name in (ops_users)

# 5. Combine exceptions intelligently
- rule: Suspicious Process in Production
  desc: Detect unexpected processes
  condition: >
    spawned_process
    and container
    and k8s.ns.name = "production"
    and not expected_process
    and not ops_activity
    and not maintenance_window
  output: <output>
  priority: WARNING
```

### Multi-Cluster Deployment

```yaml
# Helm values for multi-cluster deployment
# Include cluster identifier in outputs

falco:
  json_output: true
  json_include_output_property: true

customRules:
  cluster-id.yaml: |-
    # Add cluster identification to all outputs
    - macro: cluster_info
      condition: always_true
      append: true

    # Override default output to include cluster
    - rule: Terminal shell in container
      output: >
        [cluster=us-east-1-prod] Shell spawned in container
        (user=%user.name container=%container.name
        image=%container.image.repository)
      append: true

# Environment-specific configuration
falcosidekick:
  config:
    customfields:
      cluster: "us-east-1-prod"
      environment: "production"
      team: "platform"
```

### Rule Organization

```bash
# Recommended directory structure
/etc/falco/
├── falco.yaml              # Main configuration
├── falco_rules.yaml        # Default rules (managed by package)
├── falco_rules.local.yaml  # Local overrides/exceptions
└── rules.d/                # Custom rules directory
    ├── 00-macros.yaml      # Custom macros
    ├── 01-lists.yaml       # Custom lists
    ├── 10-container.yaml   # Container-specific rules
    ├── 20-network.yaml     # Network rules
    ├── 30-filesystem.yaml  # Filesystem rules
    └── 99-exceptions.yaml  # Environment-specific exceptions
```

## Common Pitfalls and Solutions

### Performance Issues

**Problem**: High CPU usage or event drops

```bash
# Check for event drops
falco --stats-interval 5
# Or check Prometheus metrics
# falco_events_dropped_total
```

**Solutions**:

```yaml
# 1. Use modern eBPF driver (more efficient)
driver:
  kind: modern_ebpf

# 2. Optimize rules - avoid expensive conditions
# Bad: Uses regex on every event
- rule: Bad Rule
  condition: proc.cmdline regex ".*password.*"

# Good: Pre-filter then check
- rule: Good Rule
  condition: >
    spawned_process
    and proc.cmdline contains "password"

# 3. Limit syscalls being traced
base_syscalls:
  custom_set:
    - execve
    - execveat
    - open
    - openat
    - connect
    - accept
  repair: false

# 4. Increase buffer sizes
syscall_buf_size_preset: 4  # 0-4, higher = larger buffers

# 5. Resource limits
resources:
  limits:
    cpu: 2000m
    memory: 2048Mi
```

### False Positive Management

**Problem**: Too many alerts from legitimate activity

```yaml
# Solution 1: Create specific exceptions
- list: legitimate_shell_images
  items:
    - "docker.io/bitnami/kubectl"
    - "gcr.io/google-containers/toolbox"

- macro: expected_shell_in_container
  condition: >
    container.image.repository in (legitimate_shell_images)

- rule: Shell Spawned in Container
  condition: >
    spawned_process
    and container
    and shell_procs
    and not expected_shell_in_container  # Add exception
  # ...

# Solution 2: Use append to modify existing rules
- rule: Terminal shell in container
  condition: and not container.image.repository = "debug-tools"
  append: true

# Solution 3: Disable rules per namespace
- macro: in_excluded_namespace
  condition: k8s.ns.name in (falco_excluded_namespaces)

- list: falco_excluded_namespaces
  items: [kube-system, monitoring, logging]
```

### Rule Maintenance Challenges

**Problem**: Rules become stale or break after updates

```yaml
# Solution 1: Version pin rules
# Use specific Falco version in CI testing
helm install falco falcosecurity/falco --version 4.0.0

# Solution 2: Test rules before deployment
# falco-rules-check tool
falco -r /path/to/rules.yaml --validate

# Solution 3: Use rule maturity tags
- rule: My Rule
  tags: [maturity_incubating]  # Mark maturity level

# Solution 4: Document rule changes
# Include in rule description or separate changelog
- rule: Detect XYZ
  desc: |
    Detects XYZ attack pattern.
    Version: 1.2
    Last updated: 2026-01-15
    Changes: Added exception for legitimate tool ABC
```

### Driver Compatibility Issues

**Problem**: Driver fails to load on certain kernels

```bash
# Check kernel version
uname -r

# Check eBPF support
ls /sys/kernel/btf/vmlinux  # Should exist for modern eBPF
```

**Solutions**:

```yaml
# Helm fallback configuration
driver:
  kind: modern_ebpf
  # Fallback options
  ebpf:
    fallback:
      enabled: true
      # Falls back to classic eBPF if modern fails
```

## Performance Considerations

### Resource Overhead

| Component | CPU (typical) | Memory (typical) | Notes |
|-----------|--------------|------------------|-------|
| Falco (modern-ebpf) | 0.5-2% | 256-512MB | Varies with event rate |
| Falco (kmod) | 0.3-1% | 128-256MB | Better performance, less portable |
| Falcosidekick | 0.1-0.5% | 64-128MB | Depends on output volume |

### Optimization Strategies

```yaml
# 1. Selective syscall tracing
base_syscalls:
  custom_set:
    - execve      # Process execution
    - execveat    # Process execution
    - open        # File open
    - openat      # File open
    - openat2     # File open
    - connect     # Network connections
    - accept      # Network connections
    - accept4     # Network connections
    - clone       # Process creation
    - clone3      # Process creation
    - fork        # Process creation
  repair: false

# 2. Output rate limiting
outputs_rate: 0.5           # Max alerts per second
outputs_max_burst: 100      # Burst allowance

# 3. Buffered outputs
buffered_outputs: true
output_timeout: 2000        # ms

# 4. Efficient rule design
# Avoid:
- condition: evt.rawres regex ".*error.*"
# Prefer:
- condition: evt.rawres contains "error"

# 5. Use sampling for high-volume events
syscall_event_drops:
  threshold: 0.1           # 10% drop threshold
  actions:
    - log
  rate: 0.03333           # Log every 30 seconds
```

### Monitoring Falco Performance

```yaml
# Prometheus metrics to monitor
# falco_events_total - Total events processed
# falco_events_dropped_total - Events dropped due to buffer overflow
# falco_kernel_releases_total - Kernel buffer releases
# falco_outputs_total - Total outputs generated
# falco_outputs_failed_total - Failed outputs

# Grafana dashboard query examples
# Event processing rate
rate(falco_events_total[5m])

# Drop rate
rate(falco_events_dropped_total[5m]) / rate(falco_events_total[5m]) * 100

# Alert rate by priority
sum by (priority) (rate(falco_outputs_total[5m]))
```

## Real-World Scenarios

### Container Escape Detection

```yaml
# Comprehensive container escape detection rules
- list: escape_binaries
  items: [nsenter, runc, ctr, crictl, docker]

- list: escape_paths
  items:
    - /var/run/docker.sock
    - /var/run/containerd/containerd.sock
    - /var/run/crio/crio.sock
    - /proc/1/root
    - /proc/1/ns

- rule: Container Escape via Docker Socket
  desc: Detect container accessing container runtime socket
  condition: >
    container
    and (
      (open_write and fd.name in (escape_paths))
      or (spawned_process and proc.name in (escape_binaries))
    )
  output: >
    Container escape attempt detected
    (user=%user.name command=%proc.cmdline file=%fd.name
    container=%container.name image=%container.image.repository
    pod=%k8s.pod.name namespace=%k8s.ns.name)
  priority: CRITICAL
  tags: [container, escape, mitre_privilege_escalation, T1611]

- rule: Container Namespace Escape
  desc: Detect attempts to break out of container namespace
  condition: >
    spawned_process
    and container
    and proc.name = "nsenter"
    and proc.cmdline contains "target"
  output: >
    Namespace escape attempt detected
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: CRITICAL
  tags: [container, escape, namespace]

- rule: Mount Namespace Manipulation
  desc: Detect mount operations that could lead to escape
  condition: >
    container
    and evt.type in (mount, umount, umount2)
    and not proc.name = "mount"
  output: >
    Mount operation in container
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: WARNING
  tags: [container, mount, escape]
```

### Cryptomining Detection

```yaml
# Comprehensive cryptomining detection
- list: miner_domains
  items:
    - "pool.minexmr.com"
    - "xmr.pool.minergate.com"
    - "stratum.antpool.com"
    - "pool.supportxmr.com"
    - "*.nicehash.com"
    - "*.f2pool.com"
    - "*.mining-dutch.nl"

- list: miner_ports
  items: [3333, 3334, 4444, 5555, 7777, 8888, 9999, 14444, 45560]

- rule: Cryptomining Process Detected
  desc: Detect known cryptocurrency mining processes
  condition: >
    spawned_process
    and (
      proc.name in (crypto_miner_names)
      or proc.cmdline contains "stratum+tcp"
      or proc.cmdline contains "stratum+ssl"
      or proc.cmdline contains "--coin="
      or proc.cmdline contains "--donate-level"
      or proc.cmdline icontains "xmrig"
    )
  output: >
    Cryptocurrency mining process detected
    (user=%user.name process=%proc.name command=%proc.cmdline
    container=%container.name image=%container.image.repository)
  priority: CRITICAL
  tags: [cryptomining, mitre_resource_hijacking, T1496]

- rule: Cryptomining Network Activity
  desc: Detect network connections to mining pools
  condition: >
    outbound
    and (
      fd.sport in (miner_ports)
      or fd.sip.name pmatch (miner_domains)
    )
  output: >
    Connection to mining pool detected
    (user=%user.name command=%proc.cmdline connection=%fd.name
    container=%container.name)
  priority: CRITICAL
  tags: [cryptomining, network, mitre_resource_hijacking]

- rule: High CPU with Mining Indicators
  desc: Detect processes with mining-related arguments consuming resources
  condition: >
    spawned_process
    and container
    and (
      proc.cmdline contains "--threads"
      or proc.cmdline contains "-t "
      or proc.cmdline contains "--cpu-priority"
    )
    and (
      proc.cmdline icontains "hash"
      or proc.cmdline icontains "mine"
      or proc.cmdline icontains "pool"
    )
  output: >
    Potential cryptomining with threading options
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: WARNING
  tags: [cryptomining]
```

### Compliance Auditing

```yaml
# PCI-DSS and SOC2 compliance rules

# File integrity monitoring for compliance
- rule: Modification of Authentication Configuration
  desc: Detect changes to authentication files (PCI-DSS 10.2.5)
  condition: >
    open_write
    and fd.name in (auth_config_files)
    and not proc.name in (auth_management_tools)
  output: >
    Authentication configuration modified
    (file=%fd.name user=%user.name command=%proc.cmdline
    container=%container.name)
  priority: WARNING
  tags: [compliance, pci-dss, file_integrity]

- list: auth_config_files
  items:
    - /etc/pam.conf
    - /etc/pam.d
    - /etc/security
    - /etc/login.defs
    - /etc/ssh/sshd_config

# User and privilege monitoring
- rule: User Account Created
  desc: Detect new user account creation (SOC2, PCI-DSS)
  condition: >
    spawned_process
    and proc.name in (user_mgmt_binaries)
    and proc.cmdline contains "useradd"
  output: >
    User account created
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: NOTICE
  tags: [compliance, user_management, soc2]

- list: user_mgmt_binaries
  items: [useradd, usermod, userdel, adduser, deluser]

# Logging and audit trail
- rule: Audit Log Tampered
  desc: Detect modification or deletion of audit logs
  condition: >
    (open_write or evt.type in (unlink, unlinkat, rename, renameat))
    and fd.directory in (audit_log_dirs)
    and not proc.name in (authorized_log_rotators)
  output: >
    Audit log modification detected
    (file=%fd.name user=%user.name command=%proc.cmdline)
  priority: CRITICAL
  tags: [compliance, audit, pci-dss, soc2]

- list: audit_log_dirs
  items:
    - /var/log/audit
    - /var/log/falco
    - /var/log/secure
    - /var/log/auth.log

- list: authorized_log_rotators
  items: [logrotate, rsyslog, syslog-ng]

# Data access monitoring
- rule: Access to Cardholder Data
  desc: Detect access to files containing cardholder data
  condition: >
    open_read
    and fd.directory in (cardholder_data_paths)
    and not user.name in (authorized_data_users)
  output: >
    Cardholder data access detected
    (file=%fd.name user=%user.name command=%proc.cmdline
    container=%container.name)
  priority: WARNING
  tags: [compliance, pci-dss, data_access]
```

## Interview Questions

### Conceptual Questions

**Q1: What is the difference between runtime security and other security controls like image scanning?**

```
Key Points:
1. Timing:
   - Image scanning: Pre-deployment (shift-left)
   - Runtime security: During execution (real-time)

2. Coverage:
   - Image scanning: Known vulnerabilities, static analysis
   - Runtime security: Unknown threats, behavioral anomalies

3. Detection capabilities:
   - Image scanning: CVEs, misconfigurations, secrets
   - Runtime security: Zero-days, living-off-the-land, insider threats

4. Response:
   - Image scanning: Block deployment
   - Runtime security: Alert, contain, respond

5. Complementary nature:
   - Both are needed for defense in depth
   - Image scanning reduces attack surface
   - Runtime security detects what slips through
```

**Q2: Explain how Falco captures system events and the differences between driver options.**

```
Key Points:
1. System Call Monitoring:
   - Falco hooks into kernel to capture syscalls
   - Every significant action requires a syscall
   - Provides complete visibility into system behavior

2. Driver Options:
   a) modern-ebpf:
      - Uses eBPF with CO-RE (Compile Once, Run Everywhere)
      - No kernel headers needed
      - Requires kernel 5.8+
      - Recommended for new deployments

   b) ebpf (classic):
      - Requires kernel headers
      - Works on older kernels
      - More complex deployment

   c) kmod (kernel module):
      - Best performance
      - Must be compiled per kernel version
      - Highest maintenance burden

   d) plugin:
      - For non-syscall sources (cloud events, K8s audit)
      - Extensible architecture

3. Selection Criteria:
   - Kernel version compatibility
   - Performance requirements
   - Operational complexity tolerance
```

**Q3: How do you handle false positives in Falco?**

```
Key Points:
1. Rule Tuning Approaches:
   - Add specific exceptions using lists and macros
   - Use append directive to modify existing rules
   - Create environment-specific exception files

2. Whitelisting Strategies:
   - Container image-based exceptions
   - User/service account-based exceptions
   - Namespace-based exceptions
   - Time-based exceptions (maintenance windows)

3. Process:
   a) Collect baseline of alerts
   b) Analyze false positive patterns
   c) Create targeted exceptions
   d) Test in audit mode
   e) Deploy and monitor

4. Best Practices:
   - Document all exceptions
   - Review exceptions periodically
   - Use specific conditions, not broad exceptions
   - Consider security implications of each exception
```

### Practical Questions

**Q4: How would you deploy Falco in a multi-cluster environment?**

```
Key Points:
1. Installation Strategy:
   - Use Helm with cluster-specific values
   - Include cluster identifier in all outputs
   - Centralized rule management via GitOps

2. Output Aggregation:
   - Deploy Falcosidekick per cluster
   - Forward to centralized SIEM/log system
   - Add cluster metadata to all events

3. Rule Management:
   - Base rules: Common across all clusters
   - Cluster-specific rules: Exceptions per environment
   - Version control all rules

4. Monitoring:
   - Prometheus metrics per cluster
   - Centralized Grafana dashboard
   - Alert on Falco health issues

5. Example Architecture:
   Cluster A ─► Falcosidekick ─┐
   Cluster B ─► Falcosidekick ─┼─► Central SIEM
   Cluster C ─► Falcosidekick ─┘
```

**Q5: Design a rule to detect lateral movement within a Kubernetes cluster.**

```yaml
# Answer:
- list: service_discovery_commands
  items: [nslookup, dig, host, nmap, masscan]

- list: known_scan_patterns
  items:
    - "*.svc.cluster.local"
    - "10.0.0.0/8"
    - "172.16.0.0/12"
    - "192.168.0.0/16"

- rule: Internal Network Reconnaissance
  desc: Detect service discovery and network scanning
  condition: >
    spawned_process
    and container
    and (
      proc.name in (service_discovery_commands)
      or (
        proc.name in (curl, wget, nc, ncat)
        and proc.cmdline pmatch (known_scan_patterns)
      )
    )
    and not k8s.ns.name in (network_admin_namespaces)
  output: >
    Potential lateral movement reconnaissance
    (user=%user.name command=%proc.cmdline pod=%k8s.pod.name
    namespace=%k8s.ns.name)
  priority: WARNING
  tags: [network, lateral_movement, mitre_discovery]

- rule: Unexpected Internal Service Access
  desc: Detect pods connecting to services outside their namespace
  condition: >
    outbound
    and container
    and fd.sip.name endswith ".svc.cluster.local"
    and not fd.sip.name contains k8s.ns.name
    and not allowed_cross_namespace_access
  output: >
    Cross-namespace service access detected
    (source_pod=%k8s.pod.name source_ns=%k8s.ns.name
    destination=%fd.sip.name command=%proc.cmdline)
  priority: NOTICE
  tags: [network, lateral_movement]
```

### Architecture Questions

**Q6: How would you integrate Falco into a security operations workflow?**

```
Key Points:
1. Detection Pipeline:
   Falco ─► Falcosidekick ─► Message Queue ─► SIEM
                          └─► Alert Manager ─► PagerDuty

2. Response Automation:
   - Low priority: Log and aggregate
   - Medium priority: Create ticket, notify team
   - High/Critical: Page on-call, trigger containment

3. Enrichment:
   - Add threat intelligence context
   - Correlate with other security signals
   - Link to vulnerability data

4. Runbooks:
   - Standard response procedures per rule category
   - Container isolation procedures
   - Evidence collection steps

5. Metrics and SLOs:
   - Mean time to detect (MTTD)
   - Mean time to respond (MTTR)
   - False positive rate
   - Alert volume by category
```

## Further Reading

### Official Resources

- [Falco Documentation](https://falco.org/docs/)
- [Falco GitHub Repository](https://github.com/falcosecurity/falco)
- [Falco Rules Repository](https://github.com/falcosecurity/rules)
- [Falcosidekick](https://github.com/falcosecurity/falcosidekick)
- [CNCF Falco Project Page](https://www.cncf.io/projects/falco/)

### Community and Learning

- [Falco Community Slack](https://kubernetes.slack.com/archives/CMWH3EH32)
- [Falco Blog](https://falco.org/blog/)
- [Sysdig Blog - Falco Topics](https://sysdig.com/blog/tag/falco/)
- [Falco YouTube Channel](https://www.youtube.com/c/Falco-security)

### Related Tools and Ecosystem

- [Falco Talon](https://github.com/falcosecurity/falco-talon) - Automated response
- [Falco Exporter](https://github.com/falcosecurity/falco-exporter) - Prometheus metrics
- [Kubernetes Policy](https://github.com/falcosecurity/plugins/tree/master/plugins/k8saudit) - K8s audit events
- [Event Generator](https://github.com/falcosecurity/event-generator) - Test rule coverage

### Advanced Topics

- [eBPF and Falco Internals](https://falco.org/docs/event-sources/drivers/)
- [Writing Falco Plugins](https://falco.org/docs/plugins/)
- [Falco Performance Tuning](https://falco.org/docs/install-operate/performance/)
- [Threat Detection with MITRE ATT&CK](https://attack.mitre.org/)

### Books and In-Depth Resources

- "Container Security" by Liz Rice (O'Reilly) - Chapter on runtime security
- "Kubernetes Security and Observability" by Brendan Creane and Amit Gupta
- "Practical Cloud Native Security with Falco" by Loris Degioanni and Leonardo Grasso
- [NIST SP 800-190 Application Container Security Guide](https://csrc.nist.gov/publications/detail/sp/800-190/final)

## Summary

Falco provides essential runtime security capabilities for cloud-native environments by monitoring system calls and detecting threats in real-time. As a CNCF graduated project, it has become the de facto standard for container and Kubernetes runtime security.

### Key Takeaways

| Aspect | Key Points |
|--------|------------|
| Architecture | System call monitoring via eBPF/kernel module with rule-based detection |
| Drivers | modern-ebpf (recommended), ebpf (legacy), kmod (performance) |
| Rules | YAML-based with macros, lists, and rich field access |
| Integration | Falcosidekick for 50+ output destinations |
| Deployment | Helm for Kubernetes, packages for bare metal |

### Implementation Checklist

- [ ] Choose appropriate driver based on kernel version
- [ ] Deploy Falco as DaemonSet with appropriate resources
- [ ] Configure Falcosidekick for alert routing
- [ ] Tune rules for your environment (reduce false positives)
- [ ] Establish baseline of normal behavior
- [ ] Create response runbooks for critical alerts
- [ ] Monitor Falco health and performance
- [ ] Regularly update rules and Falco version
- [ ] Test detection with event-generator
- [ ] Document all custom rules and exceptions

### When to Use Falco

- Container and Kubernetes runtime protection
- Compliance requirements (PCI-DSS, SOC2, HIPAA)
- Threat detection and incident response
- Security monitoring at scale
- Defense in depth strategy

Falco fills a critical gap in cloud-native security by providing visibility into what actually happens at runtime. Combined with image scanning, network policies, and admission controllers, it forms a comprehensive security posture for modern containerized workloads.
