---
title: 运行时安全 (Falco)
description: Falco 完全指南 - 云原生容器和 Kubernetes 运行时安全
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
origin: old/src/content/docs/security/falco.zh.md
divergence: 0.214
issues: []
legacy:
  category: Security
  subcategory: Cloud Security
  order: 16
  lastUpdated: 2026-01-20
---

运行时安全是云原生环境纵深防御策略中的关键层。虽然镜像扫描可以在部署前捕获漏洞，网络策略可以限制流量流向，但运行时安全监控的是容器和主机在执行期间实际发生的事情。Falco 作为 CNCF 毕业项目，已成为云原生运行时安全的事实标准，通过监控系统调用和内核事件提供实时威胁检测能力。

## 理解运行时安全

### 什么是运行时安全？

运行时安全专注于检测和响应应用程序运行时发生的威胁。与静态分析（在部署前检查代码或镜像）不同，运行时安全观察实际行为模式并实时识别异常。

```
+------------------------------------------------------------------+
|                    安全生命周期覆盖范围                             |
+------------------------------------------------------------------+
|                                                                    |
|   开发阶段        构建阶段        部署阶段        运行阶段          |
|   +---------+     +---------+     +---------+     +---------+     |
|   |  SAST   |     |  镜像   |     | 准入    |     | 运行时   |     |
|   |  代码   |---->|  扫描   |---->| 控制    |---->| 安全     |     |
|   |  审查   |     |  SBOM   |     | 策略    |     | 监控     |     |
|   +---------+     +---------+     +---------+     +---------+     |
|                                                                    |
|   部署前安全                       |    运行时安全                  |
|   - 发现已知漏洞                   |    - 检测未知威胁              |
|   - 策略合规                       |    - 行为异常                  |
|   - 配置验证                       |    - 实时响应                  |
|                                                                    |
+------------------------------------------------------------------+
```

### 为什么运行时安全很重要

传统安全方法在云原生环境中存在显著差距：

1. **零日漏洞**：镜像扫描器无法检测尚未编目的漏洞
2. **配置漂移**：容器在生产环境中的行为可能与预期不同
3. **内部威胁**：合法访问可能被滥用
4. **供应链攻击**：被入侵的依赖可能通过初始扫描
5. **就地取材攻击**：攻击者使用合法工具进行恶意操作

运行时安全通过监控实际行为而不是仅依赖静态分析来解决这些差距。

### Falco：CNCF 标准

Falco 最初由 Sysdig 于 2016 年创建，并于 2018 年捐赠给云原生计算基金会（CNCF）。它于 2024 年成为 CNCF 毕业项目，这表明其成熟度、采用率以及社区对其长期可行性的信心。

**关键特征：**
- 开源且厂商中立
- 可扩展的规则引擎
- 支持多种数据源
- 强大的社区和生态系统
- 与云原生工具集成

## 核心架构与原理

### 系统调用监控

Falco 的核心是监控系统调用——用户空间应用程序与 Linux 内核之间的接口。每个重要操作（文件访问、网络连接、进程创建）都需要系统调用，这使其成为理想的观察点。

```
+------------------------------------------------------------------+
|                    Falco 架构                                      |
+------------------------------------------------------------------+
|                                                                    |
|   用户空间                                                         |
|   +----------------------------------------------------------+    |
|   |  应用程序       |    容器         |    Pod              |    |
|   +----------------------------------------------------------+    |
|                            |                                       |
|                            | 系统调用                              |
|                            v                                       |
|   +----------------------------------------------------------+    |
|   |                    Linux 内核                             |    |
|   |  +--------------------------------------------------+    |    |
|   |  |              Falco 驱动                           |    |    |
|   |  |   +----------------+  +-------------------+       |    |    |
|   |  |   | 内核模块       |  |  eBPF 探针        |       |    |    |
|   |  |   | (kmod)         |  |  (modern-ebpf)    |       |    |    |
|   |  |   +----------------+  +-------------------+       |    |    |
|   |  +--------------------------------------------------+    |    |
|   +----------------------------------------------------------+    |
|                            |                                       |
|                            | 事件                                  |
|                            v                                       |
|   +----------------------------------------------------------+    |
|   |                 Falco 引擎                                |    |
|   |  +------------+  +-------------+  +------------------+    |    |
|   |  | 事件       |  | 规则        |  | 输出             |    |    |
|   |  | 解析器     |->| 引擎        |->| 通道             |    |    |
|   |  +------------+  +-------------+  +------------------+    |    |
|   +----------------------------------------------------------+    |
|                                                                    |
+------------------------------------------------------------------+
```

### 驱动选项

Falco 支持多种驱动技术来捕获系统事件：

| 驱动 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| `modern-ebpf` | 现代 eBPF 探针 | 无需内核头文件，CO-RE 支持 | 需要内核 5.8+ |
| `ebpf` | 经典 eBPF 探针 | 更广泛的内核支持 | 需要内核头文件 |
| `kmod` | 内核模块 | 最佳性能 | 需要为每个内核编译 |
| `plugin` | 基于插件的源 | 可扩展，云事件 | 仅限特定源 |

**推荐方法：** 在现代内核（5.8+）上的新部署使用 `modern-ebpf`。它利用 CO-RE（一次编译，到处运行）技术，无需内核头文件。

### 规则引擎

Falco 的规则引擎根据 YAML 编写的规则集评估事件。引擎使用高度优化的过滤机制来最小化性能开销。

```yaml
# Falco 规则剖析
- rule: Terminal shell in container
  desc: >
    在容器中使用 shell 作为入口点/执行点，
    并附加了终端。
  condition: >
    spawned_process
    and container
    and shell_procs
    and proc.tty != 0
    and container_entrypoint
    and not user_expected_terminal_shell_in_container_conditions
  output: >
    在容器中生成了带有附加终端的 shell
    (evt.type=%evt.type user=%user.name user_uid=%user.uid
    user_loginuid=%user.loginuid process=%proc.name
    proc_exepath=%proc.exepath parent=%proc.pname
    command=%proc.cmdline terminal=%proc.tty exe_flags=%evt.arg.flags
    %container.info)
  priority: NOTICE
  tags: [maturity_stable, container, shell, mitre_execution, T1059]
```

## 核心要点与规则语法

### 规则组件

Falco 规则由几个关键组件组成：

```yaml
- rule: <rule_name>           # 规则的唯一标识符
  desc: <description>          # 人类可读的描述
  condition: <filter_expr>     # 触发规则的布尔表达式
  output: <output_format>      # 规则触发时的消息格式
  priority: <severity>         # EMERGENCY, ALERT, CRITICAL, ERROR, WARNING, NOTICE, INFO, DEBUG
  tags: [<tag1>, <tag2>]      # 分类标签
  enabled: true/false          # 规则是否激活
  source: syscall/k8s_audit    # 事件源类型
```

### 宏和列表

宏和列表有助于创建可重用、可维护的规则：

```yaml
# 列表 - 命名的项目集合
- list: shell_binaries
  items: [ash, bash, csh, ksh, sh, tcsh, zsh, dash]

- list: sensitive_file_names
  items:
    - /etc/shadow
    - /etc/sudoers
    - /etc/pam.conf
    - /etc/security/pwquality.conf

# 宏 - 可重用的命名条件
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

### 常用字段和操作符

Falco 提供丰富的字段访问来构建条件：

```yaml
# 进程字段
proc.name          # 进程名
proc.exe           # 完整可执行路径
proc.cmdline       # 完整命令行
proc.pname         # 父进程名
proc.pcmdline      # 父进程命令行
proc.aname[n]      # 第 n 级祖先名
proc.tty           # TTY 号（如果没有则为 0）

# 文件描述符字段
fd.name            # 完整文件路径
fd.directory       # 路径的目录部分
fd.filename        # 仅文件名
fd.typechar        # 类型：f(文件), d(目录), i(ipv4) 等

# 用户字段
user.name          # 用户名
user.uid           # 用户 ID
user.loginuid      # 登录 UID（用于审计跟踪）

# 容器字段
container.id       # 容器 ID
container.name     # 容器名
container.image    # 容器镜像名
container.image.repository  # 镜像仓库

# Kubernetes 字段（启用 k8s 元数据时）
k8s.pod.name       # Pod 名
k8s.ns.name        # 命名空间
k8s.deployment.name # Deployment 名

# 事件字段
evt.type           # 系统调用类型
evt.dir            # 方向：>（进入）或 <（退出）
evt.time           # 事件时间戳
evt.arg.X          # 系统调用参数 X
```

### 内置规则集

Falco 附带了涵盖常见安全场景的全面默认规则：

```yaml
# 内置规则类别：

# 1. 容器特定规则
- Terminal shell in container
- Container drift detected (new executable)
- Launch privileged container
- Mount sensitive paths into container

# 2. 文件完整性规则
- Read sensitive file untrusted
- Write below etc
- Write below root
- Modify binary dirs

# 3. 进程规则
- Unexpected process spawned
- User mgmt binaries
- Schedule cron jobs

# 4. 网络规则
- Unexpected outbound connection
- Unexpected inbound connection
- Network connection outside subnet

# 5. 权限提升规则
- Sudo potential privilege escalation
- Non sudo setuid
- User privilege escalation

# 6. 加密挖矿检测
- Detect crypto miners using stratum protocol
- Detect outbound connections to common miner pools
```

## 安装与配置

### 使用 Helm 安装 Falco

Kubernetes 推荐使用 Helm 安装：

```bash
# 添加 Falco Helm 仓库
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

# 使用现代 eBPF 驱动安装 Falco
helm install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace \
  --set driver.kind=modern_ebpf \
  --set falcosidekick.enabled=true \
  --set falcosidekick.webui.enabled=true
```

### 详细 Helm 配置

```yaml
# values.yaml - 生产就绪的 Falco 配置
driver:
  kind: modern_ebpf  # 使用现代 eBPF 驱动
  ebpf:
    hostNetwork: true

falco:
  # JSON 输出用于日志聚合
  json_output: true
  json_include_output_property: true
  json_include_tags_property: true

  # 日志级别
  log_level: info

  # 启用内核事件
  syscall_event_drops:
    actions:
      - log
      - alert

  # 规则文件位置
  rules_file:
    - /etc/falco/falco_rules.yaml
    - /etc/falco/falco_rules.local.yaml
    - /etc/falco/rules.d

  # 输出设置
  stdout_output:
    enabled: true

  # HTTP 输出用于外部系统
  http_output:
    enabled: true
    url: http://falcosidekick:2801/

  # gRPC 用于 Falco 集成
  grpc:
    enabled: true
    bind_address: "unix:///run/falco/falco.sock"
    threadiness: 8

  grpc_output:
    enabled: true

# 资源限制
resources:
  limits:
    cpu: 1000m
    memory: 1024Mi
  requests:
    cpu: 100m
    memory: 512Mi

# 容忍所有节点
tolerations:
  - effect: NoSchedule
    operator: Exists

# Falcosidekick 配置
falcosidekick:
  enabled: true
  config:
    slack:
      webhookurl: ""  # 添加你的 Slack webhook
      minimumpriority: warning
    prometheus:
      extralabels: "source:falco"

  webui:
    enabled: true
    replicaCount: 1

# 自定义规则 ConfigMap
customRules:
  custom-rules.yaml: |-
    - rule: Unauthorized AWS Metadata Access
      desc: 检测访问 AWS 元数据服务的尝试
      condition: >
        outbound
        and fd.sip = "169.254.169.254"
        and not aws_metadata_allowed
      output: >
        未授权的 AWS 元数据访问尝试
        (user=%user.name command=%proc.cmdline connection=%fd.name
        %container.info)
      priority: WARNING
      tags: [cloud, aws, metadata]
```

### 在 Linux 主机上安装

对于非 Kubernetes 部署：

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

# 使用现代 eBPF 驱动启动 Falco
sudo falco --modern-bpf
```

### 配置文件结构

```yaml
# /etc/falco/falco.yaml - 主配置文件

# 规则配置
rules_file:
  - /etc/falco/falco_rules.yaml
  - /etc/falco/falco_rules.local.yaml
  - /etc/falco/rules.d

# 监视规则文件变更
watch_config_files: true

# 输出设置
json_output: true
json_include_output_property: true
json_include_tags_property: true

# 日志
log_stderr: true
log_syslog: true
log_level: info

# 输出通道
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

# 缓冲输出（用于性能）
buffered_outputs: true
output_timeout: 2000

# 优先级设置
priority: debug  # 输出的最低优先级

# 速率限制
outputs_rate: 1
outputs_max_burst: 1000

# 系统调用事件设置
syscall_event_drops:
  threshold: 0.1
  actions:
    - log
    - alert
  rate: 0.03333
  max_burst: 1

syscall_event_timeouts:
  max_consecutives: 1000

# 基础系统调用（始终启用）
base_syscalls:
  custom_set: []
  repair: false

# 元数据设置
metadata_download:
  max_mb: 100
  chunk_wait_us: 1000
  watch_freq_sec: 1
```

## 编写自定义规则

### 基础规则示例

```yaml
# 检测容器中生成的 shell
- rule: Shell Spawned in Container
  desc: 检测容器内生成 shell 的情况
  condition: >
    spawned_process
    and container
    and shell_procs
  output: >
    容器中生成了 Shell
    (user=%user.name user_uid=%user.uid shell=%proc.name
    parent=%proc.pname cmdline=%proc.cmdline container=%container.name
    image=%container.image.repository)
  priority: WARNING
  tags: [container, shell, mitre_execution]

# 检测敏感文件访问
- rule: Sensitive File Access
  desc: 检测对敏感文件的读取访问
  condition: >
    open_read
    and container
    and fd.name in (sensitive_file_names)
    and not proc.name in (trusted_readers)
  output: >
    容器中读取了敏感文件
    (file=%fd.name user=%user.name command=%proc.cmdline
    container=%container.name image=%container.image.repository)
  priority: WARNING
  tags: [filesystem, sensitive_files]

# 检测到可疑端口的出站连接
- rule: Outbound Connection to Suspicious Port
  desc: 检测到常用于 C2 的端口的连接
  condition: >
    outbound
    and container
    and fd.sport in (suspicious_ports)
    and not fd.sip in (allowed_external_ips)
  output: >
    可疑的出站连接
    (command=%proc.cmdline connection=%fd.name port=%fd.sport
    container=%container.name)
  priority: WARNING
  tags: [network, c2]

- list: suspicious_ports
  items: [4444, 5555, 6666, 1337, 31337, 8888]
```

### 高级规则模式

```yaml
# 检测通过挂载的 Docker socket 进行容器逃逸的尝试
- rule: Docker Socket Access in Container
  desc: 检测容器访问 Docker socket
  condition: >
    container
    and (
      (open_write and fd.name = "/var/run/docker.sock")
      or (spawned_process and proc.name = "docker")
    )
  output: >
    容器中访问了 Docker socket（潜在逃逸）
    (user=%user.name command=%proc.cmdline container=%container.name
    image=%container.image.repository)
  priority: CRITICAL
  tags: [container, escape, mitre_privilege_escalation]

# 检测加密货币挖矿活动
- rule: Cryptocurrency Mining Detected
  desc: 检测潜在的加密货币挖矿活动
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
    检测到可能的加密货币挖矿活动
    (user=%user.name command=%proc.cmdline container=%container.name
    image=%container.image.repository)
  priority: CRITICAL
  tags: [cryptomining, mitre_resource_hijacking]

- list: crypto_miner_names
  items: [
    xmrig, xmr-stak, minerd, cpuminer, cgminer, bfgminer,
    ethminer, minergate, nicehash, phoenixminer
  ]

# 检测反向 shell 模式
- rule: Reverse Shell Detected
  desc: 检测常见的反向 shell 模式
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
    检测到反向 shell
    (user=%user.name command=%proc.cmdline container=%container.name
    image=%container.image.repository)
  priority: CRITICAL
  tags: [network, reverse_shell, mitre_command_and_control]

# 检测通过 setuid 进行权限提升
- rule: Setuid or Setgid bit Set
  desc: 检测在文件上设置 setuid/setgid 位
  condition: >
    consider_all_chmods
    and chmod
    and (evt.arg.mode contains "S_ISUID" or evt.arg.mode contains "S_ISGID")
    and not user.name = "root"
  output: >
    在文件上设置了 Setuid/setgid 位
    (user=%user.name command=%proc.cmdline file=%fd.name
    mode=%evt.arg.mode container=%container.name)
  priority: WARNING
  tags: [filesystem, privilege_escalation]
```

### Kubernetes 审计事件规则

```yaml
# 在 falco.yaml 中启用 Kubernetes 审计日志源
# plugins:
#   - name: k8saudit
#     library_path: libk8saudit.so
#     open_params: "http://:9765/k8s-audit"

# 检测匿名认证尝试
- rule: Anonymous Auth Attempt
  desc: 检测匿名认证尝试
  condition: >
    ka.verb in (get, list, watch, create, update, patch, delete)
    and ka.user.name = "system:anonymous"
  output: >
    检测到匿名认证尝试
    (user=%ka.user.name verb=%ka.verb resource=%ka.target.resource
    namespace=%ka.target.namespace name=%ka.target.name)
  priority: WARNING
  source: k8s_audit
  tags: [k8s, authentication]

# 检测 exec 进入 pod
- rule: Exec into Pod
  desc: 检测 exec/attach 到 pod
  condition: >
    ka.verb = create
    and ka.target.subresource in (exec, attach)
    and not ka.user.name in (allowed_exec_users)
  output: >
    检测到 Exec/attach 到 pod
    (user=%ka.user.name verb=%ka.verb pod=%ka.target.name
    namespace=%ka.target.namespace)
  priority: NOTICE
  source: k8s_audit
  tags: [k8s, exec]

- list: allowed_exec_users
  items: [admin, developer]

# 检测 secret 访问
- rule: Secret Accessed
  desc: 检测 secret 被读取
  condition: >
    ka.verb in (get, list)
    and ka.target.resource = "secrets"
    and not ka.user.name in (system_accounts)
  output: >
    Secret 被访问
    (user=%ka.user.name secret=%ka.target.name
    namespace=%ka.target.namespace)
  priority: INFO
  source: k8s_audit
  tags: [k8s, secrets]
```

## 输出通道与集成

### Falcosidekick 配置

Falcosidekick 是将 Falco 告警转发到各种目的地的推荐方式：

```yaml
# Falcosidekick 的 Helm values
falcosidekick:
  enabled: true
  config:
    # Slack 集成
    slack:
      webhookurl: "https://hooks.slack.com/services/XXX/YYY/ZZZ"
      channel: "#security-alerts"
      username: "Falco"
      icon: "https://falco.org/favicon.png"
      minimumpriority: "warning"
      messageformat: |
        *规则*: {{ .Rule }}
        *优先级*: {{ .Priority }}
        *输出*: {{ .Output }}
        *时间*: {{ .Time }}

    # Elasticsearch
    elasticsearch:
      hostport: "https://elasticsearch:9200"
      index: "falco"
      type: "_doc"
      minimumpriority: "debug"
      mutualtls: false
      checkcert: true

    # Prometheus 指标
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

    # Webhook（通用）
    webhook:
      address: "https://your-webhook-endpoint.com/falco"
      minimumpriority: "warning"
      customHeaders:
        Authorization: "Bearer YOUR_TOKEN"
```

### 直接输出配置

```yaml
# /etc/falco/falco.yaml - 直接输出通道

# 文件输出
file_output:
  enabled: true
  keep_alive: false
  filename: /var/log/falco/events.log

# 程序输出（管道到外部命令）
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

# HTTP 输出
http_output:
  enabled: true
  url: http://falcosidekick:2801/
  user_agent: "falco/0.37.0"
  insecure: false
  mtls: false

# gRPC 输出（用于 Falco Sidekick 和其他集成）
grpc:
  enabled: true
  bind_address: "unix:///run/falco/falco.sock"
  threadiness: 8

grpc_output:
  enabled: true
```

### 与 SIEM 系统集成

```yaml
# 示例：通过 Falcosidekick 集成 Splunk HEC
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
# 示例：Sumo Logic 集成
falcosidekick:
  config:
    sumologic:
      receiverurl: "https://endpoint.sumologic.com/receiver/v1/http/YOUR_ENDPOINT"
      minimumpriority: "warning"
      sourcecategory: "security/falco"
      sourcehost: ""
      name: ""

---
# 示例：Datadog 集成
falcosidekick:
  config:
    datadog:
      apikey: "YOUR_DD_API_KEY"
      minimumpriority: "warning"
```

## 最佳实践

### 规则调优策略

1. **从审计模式开始**：在执行前以仅审计模式启用规则

```yaml
# 审计模式 - 记录但不执行
- rule: My New Rule
  desc: 测试新的检测规则
  condition: <your_condition>
  output: <your_output>
  priority: DEBUG  # 从低优先级开始
  tags: [audit, testing]
```

2. **基线正常行为**：在对异常发出告警前了解什么是正常的

```bash
# 收集基线数据
kubectl logs -n falco -l app.kubernetes.io/name=falco \
  --since=24h | jq -r '.rule' | sort | uniq -c | sort -rn
```

3. **迭代改进**：根据误报持续改进规则

```yaml
# 使用例外改进规则
- macro: allowed_package_managers
  condition: >
    proc.name in (apt, apt-get, dpkg, yum, rpm, dnf, apk)
    and container.image.repository in (trusted_build_images)

- list: trusted_build_images
  items:
    - docker.io/library/ubuntu
    - gcr.io/distroless/base
```

### 降噪技术

```yaml
# 1. 使用特定的容器/镜像匹配
- macro: my_app_container
  condition: >
    container.image.repository = "mycompany/myapp"
    or k8s.deployment.name = "myapp"

# 2. 白名单已知良好行为
- list: known_outbound_destinations
  items:
    - "api.example.com"
    - "*.cloudprovider.com"

- macro: allowed_outbound
  condition: >
    fd.sip.name in (known_outbound_destinations)

# 3. 基于时间的例外（维护窗口）
- macro: maintenance_window
  condition: >
    (evt.time.hour >= 2 and evt.time.hour < 4)
    and evt.time.weekday in (0, 6)

# 4. 基于用户的例外
- list: ops_users
  items: [admin, sre-bot, deployment-bot]

- macro: ops_activity
  condition: user.name in (ops_users)

# 5. 智能组合例外
- rule: Suspicious Process in Production
  desc: 检测意外进程
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

### 多集群部署

```yaml
# 多集群部署的 Helm values
# 在输出中包含集群标识符

falco:
  json_output: true
  json_include_output_property: true

customRules:
  cluster-id.yaml: |-
    # 为所有输出添加集群标识
    - macro: cluster_info
      condition: always_true
      append: true

    # 覆盖默认输出以包含集群
    - rule: Terminal shell in container
      output: >
        [cluster=us-east-1-prod] 容器中生成了 Shell
        (user=%user.name container=%container.name
        image=%container.image.repository)
      append: true

# 环境特定配置
falcosidekick:
  config:
    customfields:
      cluster: "us-east-1-prod"
      environment: "production"
      team: "platform"
```

### 规则组织

```bash
# 推荐的目录结构
/etc/falco/
├── falco.yaml              # 主配置
├── falco_rules.yaml        # 默认规则（由包管理）
├── falco_rules.local.yaml  # 本地覆盖/例外
└── rules.d/                # 自定义规则目录
    ├── 00-macros.yaml      # 自定义宏
    ├── 01-lists.yaml       # 自定义列表
    ├── 10-container.yaml   # 容器特定规则
    ├── 20-network.yaml     # 网络规则
    ├── 30-filesystem.yaml  # 文件系统规则
    └── 99-exceptions.yaml  # 环境特定例外
```

## 常见陷阱与解决方案

### 性能问题

**问题**：高 CPU 使用率或事件丢弃

```bash
# 检查事件丢弃
falco --stats-interval 5
# 或检查 Prometheus 指标
# falco_events_dropped_total
```

**解决方案**：

```yaml
# 1. 使用现代 eBPF 驱动（更高效）
driver:
  kind: modern_ebpf

# 2. 优化规则 - 避免昂贵的条件
# 不好：在每个事件上使用正则
- rule: Bad Rule
  condition: proc.cmdline regex ".*password.*"

# 好：先预过滤再检查
- rule: Good Rule
  condition: >
    spawned_process
    and proc.cmdline contains "password"

# 3. 限制跟踪的系统调用
base_syscalls:
  custom_set:
    - execve
    - execveat
    - open
    - openat
    - connect
    - accept
  repair: false

# 4. 增加缓冲区大小
syscall_buf_size_preset: 4  # 0-4，越高缓冲区越大

# 5. 资源限制
resources:
  limits:
    cpu: 2000m
    memory: 2048Mi
```

### 误报管理

**问题**：来自合法活动的告警过多

```yaml
# 解决方案 1：创建特定例外
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
    and not expected_shell_in_container  # 添加例外
  # ...

# 解决方案 2：使用 append 修改现有规则
- rule: Terminal shell in container
  condition: and not container.image.repository = "debug-tools"
  append: true

# 解决方案 3：按命名空间禁用规则
- macro: in_excluded_namespace
  condition: k8s.ns.name in (falco_excluded_namespaces)

- list: falco_excluded_namespaces
  items: [kube-system, monitoring, logging]
```

### 规则维护挑战

**问题**：规则变得过时或更新后损坏

```yaml
# 解决方案 1：版本锁定规则
# 在 CI 测试中使用特定 Falco 版本
helm install falco falcosecurity/falco --version 4.0.0

# 解决方案 2：部署前测试规则
# falco-rules-check 工具
falco -r /path/to/rules.yaml --validate

# 解决方案 3：使用规则成熟度标签
- rule: My Rule
  tags: [maturity_incubating]  # 标记成熟度级别

# 解决方案 4：记录规则变更
# 在规则描述或单独的变更日志中包含
- rule: Detect XYZ
  desc: |
    检测 XYZ 攻击模式。
    版本: 1.2
    最后更新: 2026-01-15
    变更: 为合法工具 ABC 添加了例外
```

### 驱动兼容性问题

**问题**：驱动在某些内核上无法加载

```bash
# 检查内核版本
uname -r

# 检查 eBPF 支持
ls /sys/kernel/btf/vmlinux  # 应该存在用于现代 eBPF
```

**解决方案**：

```yaml
# Helm 回退配置
driver:
  kind: modern_ebpf
  # 回退选项
  ebpf:
    fallback:
      enabled: true
      # 如果现代失败则回退到经典 eBPF
```

## 性能考量

### 资源开销

| 组件 | CPU（典型） | 内存（典型） | 说明 |
|------|------------|--------------|------|
| Falco (modern-ebpf) | 0.5-2% | 256-512MB | 随事件率变化 |
| Falco (kmod) | 0.3-1% | 128-256MB | 性能更好，可移植性较差 |
| Falcosidekick | 0.1-0.5% | 64-128MB | 取决于输出量 |

### 优化策略

```yaml
# 1. 选择性系统调用跟踪
base_syscalls:
  custom_set:
    - execve      # 进程执行
    - execveat    # 进程执行
    - open        # 文件打开
    - openat      # 文件打开
    - openat2     # 文件打开
    - connect     # 网络连接
    - accept      # 网络连接
    - accept4     # 网络连接
    - clone       # 进程创建
    - clone3      # 进程创建
    - fork        # 进程创建
  repair: false

# 2. 输出速率限制
outputs_rate: 0.5           # 每秒最大告警数
outputs_max_burst: 100      # 突发允许量

# 3. 缓冲输出
buffered_outputs: true
output_timeout: 2000        # 毫秒

# 4. 高效的规则设计
# 避免：
- condition: evt.rawres regex ".*error.*"
# 推荐：
- condition: evt.rawres contains "error"

# 5. 对高容量事件使用采样
syscall_event_drops:
  threshold: 0.1           # 10% 丢弃阈值
  actions:
    - log
  rate: 0.03333           # 每 30 秒记录一次
```

### 监控 Falco 性能

```yaml
# 要监控的 Prometheus 指标
# falco_events_total - 处理的事件总数
# falco_events_dropped_total - 由于缓冲区溢出而丢弃的事件
# falco_kernel_releases_total - 内核缓冲区释放
# falco_outputs_total - 生成的输出总数
# falco_outputs_failed_total - 失败的输出

# Grafana 仪表板查询示例
# 事件处理率
rate(falco_events_total[5m])

# 丢弃率
rate(falco_events_dropped_total[5m]) / rate(falco_events_total[5m]) * 100

# 按优先级的告警率
sum by (priority) (rate(falco_outputs_total[5m]))
```

## 实战场景

### 容器逃逸检测

```yaml
# 全面的容器逃逸检测规则
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
  desc: 检测容器访问容器运行时 socket
  condition: >
    container
    and (
      (open_write and fd.name in (escape_paths))
      or (spawned_process and proc.name in (escape_binaries))
    )
  output: >
    检测到容器逃逸尝试
    (user=%user.name command=%proc.cmdline file=%fd.name
    container=%container.name image=%container.image.repository
    pod=%k8s.pod.name namespace=%k8s.ns.name)
  priority: CRITICAL
  tags: [container, escape, mitre_privilege_escalation, T1611]

- rule: Container Namespace Escape
  desc: 检测突破容器命名空间的尝试
  condition: >
    spawned_process
    and container
    and proc.name = "nsenter"
    and proc.cmdline contains "target"
  output: >
    检测到命名空间逃逸尝试
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: CRITICAL
  tags: [container, escape, namespace]

- rule: Mount Namespace Manipulation
  desc: 检测可能导致逃逸的挂载操作
  condition: >
    container
    and evt.type in (mount, umount, umount2)
    and not proc.name = "mount"
  output: >
    容器中的挂载操作
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: WARNING
  tags: [container, mount, escape]
```

### 加密挖矿检测

```yaml
# 全面的加密挖矿检测
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
  desc: 检测已知的加密货币挖矿进程
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
    检测到加密货币挖矿进程
    (user=%user.name process=%proc.name command=%proc.cmdline
    container=%container.name image=%container.image.repository)
  priority: CRITICAL
  tags: [cryptomining, mitre_resource_hijacking, T1496]

- rule: Cryptomining Network Activity
  desc: 检测到矿池的网络连接
  condition: >
    outbound
    and (
      fd.sport in (miner_ports)
      or fd.sip.name pmatch (miner_domains)
    )
  output: >
    检测到矿池连接
    (user=%user.name command=%proc.cmdline connection=%fd.name
    container=%container.name)
  priority: CRITICAL
  tags: [cryptomining, network, mitre_resource_hijacking]

- rule: High CPU with Mining Indicators
  desc: 检测带有挖矿相关参数消耗资源的进程
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
    带有线程选项的潜在加密挖矿
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: WARNING
  tags: [cryptomining]
```

### 合规审计

```yaml
# PCI-DSS 和 SOC2 合规规则

# 合规性文件完整性监控
- rule: Modification of Authentication Configuration
  desc: 检测认证文件的变更（PCI-DSS 10.2.5）
  condition: >
    open_write
    and fd.name in (auth_config_files)
    and not proc.name in (auth_management_tools)
  output: >
    认证配置被修改
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

# 用户和权限监控
- rule: User Account Created
  desc: 检测新用户账户创建（SOC2, PCI-DSS）
  condition: >
    spawned_process
    and proc.name in (user_mgmt_binaries)
    and proc.cmdline contains "useradd"
  output: >
    用户账户被创建
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: NOTICE
  tags: [compliance, user_management, soc2]

- list: user_mgmt_binaries
  items: [useradd, usermod, userdel, adduser, deluser]

# 日志和审计跟踪
- rule: Audit Log Tampered
  desc: 检测审计日志的修改或删除
  condition: >
    (open_write or evt.type in (unlink, unlinkat, rename, renameat))
    and fd.directory in (audit_log_dirs)
    and not proc.name in (authorized_log_rotators)
  output: >
    检测到审计日志修改
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

# 数据访问监控
- rule: Access to Cardholder Data
  desc: 检测对包含持卡人数据的文件的访问
  condition: >
    open_read
    and fd.directory in (cardholder_data_paths)
    and not user.name in (authorized_data_users)
  output: >
    检测到持卡人数据访问
    (file=%fd.name user=%user.name command=%proc.cmdline
    container=%container.name)
  priority: WARNING
  tags: [compliance, pci-dss, data_access]
```

## 面试要点

### 概念问题

**Q1：运行时安全与其他安全控制（如镜像扫描）有什么区别？**

```
关键点：
1. 时机：
   - 镜像扫描：部署前（左移）
   - 运行时安全：执行期间（实时）

2. 覆盖范围：
   - 镜像扫描：已知漏洞，静态分析
   - 运行时安全：未知威胁，行为异常

3. 检测能力：
   - 镜像扫描：CVE，配置错误，密钥
   - 运行时安全：零日漏洞，就地取材攻击，内部威胁

4. 响应：
   - 镜像扫描：阻止部署
   - 运行时安全：告警，遏制，响应

5. 互补性：
   - 纵深防御需要两者
   - 镜像扫描减少攻击面
   - 运行时安全检测漏网之鱼
```

**Q2：解释 Falco 如何捕获系统事件以及驱动选项之间的差异。**

```
关键点：
1. 系统调用监控：
   - Falco 挂钩到内核以捕获系统调用
   - 每个重要操作都需要系统调用
   - 提供对系统行为的完整可见性

2. 驱动选项：
   a) modern-ebpf：
      - 使用带有 CO-RE（一次编译，到处运行）的 eBPF
      - 不需要内核头文件
      - 需要内核 5.8+
      - 推荐用于新部署

   b) ebpf（经典）：
      - 需要内核头文件
      - 适用于较旧的内核
      - 部署更复杂

   c) kmod（内核模块）：
      - 最佳性能
      - 必须为每个内核版本编译
      - 维护负担最高

   d) plugin：
      - 用于非系统调用源（云事件，K8s 审计）
      - 可扩展架构

3. 选择标准：
   - 内核版本兼容性
   - 性能要求
   - 运营复杂性容忍度
```

**Q3：如何处理 Falco 中的误报？**

```
关键点：
1. 规则调优方法：
   - 使用列表和宏添加特定例外
   - 使用 append 指令修改现有规则
   - 创建环境特定的例外文件

2. 白名单策略：
   - 基于容器镜像的例外
   - 基于用户/服务账户的例外
   - 基于命名空间的例外
   - 基于时间的例外（维护窗口）

3. 流程：
   a) 收集告警基线
   b) 分析误报模式
   c) 创建有针对性的例外
   d) 在审计模式下测试
   e) 部署并监控

4. 最佳实践：
   - 记录所有例外
   - 定期审查例外
   - 使用特定条件，而非广泛例外
   - 考虑每个例外的安全影响
```

### 实践问题

**Q4：如何在多集群环境中部署 Falco？**

```
关键点：
1. 安装策略：
   - 使用带有集群特定值的 Helm
   - 在所有输出中包含集群标识符
   - 通过 GitOps 进行集中规则管理

2. 输出聚合：
   - 每个集群部署 Falcosidekick
   - 转发到集中的 SIEM/日志系统
   - 为所有事件添加集群元数据

3. 规则管理：
   - 基础规则：所有集群通用
   - 集群特定规则：每个环境的例外
   - 版本控制所有规则

4. 监控：
   - 每个集群的 Prometheus 指标
   - 集中的 Grafana 仪表板
   - 对 Falco 健康问题发出告警

5. 示例架构：
   集群 A ─► Falcosidekick ─┐
   集群 B ─► Falcosidekick ─┼─► 中央 SIEM
   集群 C ─► Falcosidekick ─┘
```

**Q5：设计一个规则来检测 Kubernetes 集群内的横向移动。**

```yaml
# 答案：
- list: service_discovery_commands
  items: [nslookup, dig, host, nmap, masscan]

- list: known_scan_patterns
  items:
    - "*.svc.cluster.local"
    - "10.0.0.0/8"
    - "172.16.0.0/12"
    - "192.168.0.0/16"

- rule: Internal Network Reconnaissance
  desc: 检测服务发现和网络扫描
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
    潜在的横向移动侦察
    (user=%user.name command=%proc.cmdline pod=%k8s.pod.name
    namespace=%k8s.ns.name)
  priority: WARNING
  tags: [network, lateral_movement, mitre_discovery]

- rule: Unexpected Internal Service Access
  desc: 检测 Pod 连接到其命名空间外的服务
  condition: >
    outbound
    and container
    and fd.sip.name endswith ".svc.cluster.local"
    and not fd.sip.name contains k8s.ns.name
    and not allowed_cross_namespace_access
  output: >
    检测到跨命名空间服务访问
    (source_pod=%k8s.pod.name source_ns=%k8s.ns.name
    destination=%fd.sip.name command=%proc.cmdline)
  priority: NOTICE
  tags: [network, lateral_movement]
```

### 架构问题

**Q6：如何将 Falco 集成到安全运营工作流中？**

```
关键点：
1. 检测管道：
   Falco ─► Falcosidekick ─► 消息队列 ─► SIEM
                          └─► Alert Manager ─► PagerDuty

2. 响应自动化：
   - 低优先级：记录和聚合
   - 中优先级：创建工单，通知团队
   - 高/严重：呼叫值班人员，触发遏制

3. 丰富化：
   - 添加威胁情报上下文
   - 与其他安全信号关联
   - 链接到漏洞数据

4. 运行手册：
   - 每个规则类别的标准响应程序
   - 容器隔离程序
   - 证据收集步骤

5. 指标和 SLO：
   - 平均检测时间 (MTTD)
   - 平均响应时间 (MTTR)
   - 误报率
   - 按类别的告警量
```

## 延伸阅读

### 官方资源

- [Falco 文档](https://falco.org/docs/)
- [Falco GitHub 仓库](https://github.com/falcosecurity/falco)
- [Falco 规则仓库](https://github.com/falcosecurity/rules)
- [Falcosidekick](https://github.com/falcosecurity/falcosidekick)
- [CNCF Falco 项目页面](https://www.cncf.io/projects/falco/)

### 社区和学习

- [Falco 社区 Slack](https://kubernetes.slack.com/archives/CMWH3EH32)
- [Falco 博客](https://falco.org/blog/)
- [Sysdig 博客 - Falco 主题](https://sysdig.com/blog/tag/falco/)
- [Falco YouTube 频道](https://www.youtube.com/c/Falco-security)

### 相关工具和生态系统

- [Falco Talon](https://github.com/falcosecurity/falco-talon) - 自动响应
- [Falco Exporter](https://github.com/falcosecurity/falco-exporter) - Prometheus 指标
- [Kubernetes Policy](https://github.com/falcosecurity/plugins/tree/master/plugins/k8saudit) - K8s 审计事件
- [Event Generator](https://github.com/falcosecurity/event-generator) - 测试规则覆盖

### 高级主题

- [eBPF 和 Falco 内部原理](https://falco.org/docs/event-sources/drivers/)
- [编写 Falco 插件](https://falco.org/docs/plugins/)
- [Falco 性能调优](https://falco.org/docs/install-operate/performance/)
- [使用 MITRE ATT&CK 进行威胁检测](https://attack.mitre.org/)

### 书籍和深入资源

- 《Container Security》作者 Liz Rice (O'Reilly) - 运行时安全章节
- 《Kubernetes Security and Observability》作者 Brendan Creane 和 Amit Gupta
- 《Practical Cloud Native Security with Falco》作者 Loris Degioanni 和 Leonardo Grasso
- [NIST SP 800-190 应用程序容器安全指南](https://csrc.nist.gov/publications/detail/sp/800-190/final)

## 总结

Falco 通过监控系统调用并实时检测威胁，为云原生环境提供了必不可少的运行时安全能力。作为 CNCF 毕业项目，它已成为容器和 Kubernetes 运行时安全的事实标准。

### 关键要点

| 方面 | 关键点 |
|------|--------|
| 架构 | 通过 eBPF/内核模块进行系统调用监控，基于规则的检测 |
| 驱动 | modern-ebpf（推荐），ebpf（传统），kmod（性能） |
| 规则 | 基于 YAML，带有宏、列表和丰富的字段访问 |
| 集成 | Falcosidekick 支持 50+ 输出目的地 |
| 部署 | Helm 用于 Kubernetes，包用于裸机 |

### 实施清单

- [ ] 根据内核版本选择适当的驱动
- [ ] 以 DaemonSet 方式部署 Falco 并配置适当的资源
- [ ] 配置 Falcosidekick 进行告警路由
- [ ] 为你的环境调优规则（减少误报）
- [ ] 建立正常行为基线
- [ ] 为关键告警创建响应运行手册
- [ ] 监控 Falco 健康和性能
- [ ] 定期更新规则和 Falco 版本
- [ ] 使用 event-generator 测试检测
- [ ] 记录所有自定义规则和例外

### 何时使用 Falco

- 容器和 Kubernetes 运行时保护
- 合规要求（PCI-DSS、SOC2、HIPAA）
- 威胁检测和事件响应
- 大规模安全监控
- 纵深防御策略

Falco 通过提供对运行时实际发生情况的可见性，填补了云原生安全中的关键空白。结合镜像扫描、网络策略和准入控制器，它形成了现代容器化工作负载的全面安全态势。
