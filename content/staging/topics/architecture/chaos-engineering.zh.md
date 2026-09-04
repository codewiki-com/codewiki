---
title: 混沌工程
description: 通过混沌工程提高系统弹性
track: architecture
section: distributed
difficulty: advanced
tags:
  - 混沌工程
  - 弹性
  - 故障注入
  - Netflix
status: imported
origin: old/src/content/docs/devops/chaos-engineering.zh.md
divergence: 0.141
issues: []
legacy:
  category: DevOps
  subcategory: Resilience
  order: 19
  lastUpdated: 2026-01-07
---

## 概念解释

混沌工程（Chaos Engineering）是一门在分布式系统上进行实验的学科，旨在建立对系统在生产环境中承受动荡条件能力的信心。通过主动引入故障来测试系统的弹性，混沌工程帮助团队在问题影响用户之前发现潜在的系统弱点。

### 什么是混沌工程？

混沌工程起源于 Netflix，当时他们正在将基础设施从数据中心迁移到 AWS 云平台。为了确保系统能够承受云环境中不可避免的故障，Netflix 的工程师开发了 Chaos Monkey，这是第一个混沌工程工具。

```
┌─────────────────────────────────────────────────────────────────┐
│                      混沌工程核心理念                             │
└─────────────────────────────────────────────────────────────────┘
                               │
    ┌───────────────┬──────────┼──────────┬───────────────┐
    │               │          │          │               │
    ▼               ▼          ▼          ▼               ▼
┌────────┐    ┌──────────┐  ┌────────┐  ┌─────────┐   ┌──────────┐
│ 假设稳态 │    │ 变量多样化│  │ 生产实验 │  │ 自动化   │   │ 最小爆炸  │
│        │    │          │  │        │  │  实验    │   │   半径   │
└────────┘    └──────────┘  └────────┘  └─────────┘   └──────────┘
    │               │          │          │               │
    ▼               ▼          ▼          ▼               ▼
 定义正常       引入真实     真实环境      持续验证       控制影响
 系统行为       世界事件     最有价值      系统弹性       范围
```

### 为什么需要混沌工程？

在现代分布式系统中，故障是不可避免的。传统的测试方法无法完全覆盖生产环境中可能出现的各种故障场景：

| 传统测试 | 混沌工程 |
|---------|---------|
| 验证已知行为 | 探索未知行为 |
| 在测试环境进行 | 在生产环境进行 |
| 预定义测试用例 | 假设驱动实验 |
| 发现代码缺陷 | 发现系统弱点 |
| 关注单个组件 | 关注系统整体 |

## 混沌工程原则

Netflix 提出了混沌工程的五大核心原则，这些原则指导着混沌工程实践的开展。

### 建立稳态假设

在进行任何混沌实验之前，必须首先定义系统的"稳态"——即系统正常运行时的可测量行为。

```yaml
# 稳态定义示例
steady_state:
  name: "订单服务稳态"
  description: "订单服务在正常负载下的期望行为"

  metrics:
    # 业务指标
    - name: orders_per_minute
      expected_range: [800, 1200]
      measurement: prometheus
      query: "rate(orders_total[1m])"

    # 性能指标
    - name: response_time_p99
      expected_range: [0, 500]  # 毫秒
      measurement: prometheus
      query: "histogram_quantile(0.99, order_latency_bucket)"

    # 可用性指标
    - name: success_rate
      expected_range: [99.5, 100]  # 百分比
      measurement: prometheus
      query: "rate(orders_success[5m]) / rate(orders_total[5m]) * 100"

    # 资源指标
    - name: cpu_usage
      expected_range: [0, 70]  # 百分比
      measurement: prometheus
      query: "avg(container_cpu_usage_seconds_total{service='order'})"
```

### 变量多样化

混沌实验应该引入反映真实世界事件的变量：

```python
# 混沌变量类型示例
class ChaosVariables:
    """混沌实验变量分类"""

    # 基础设施故障
    INFRASTRUCTURE = [
        "server_crash",           # 服务器崩溃
        "disk_failure",           # 磁盘故障
        "network_partition",      # 网络分区
        "datacenter_outage",      # 数据中心故障
        "dns_failure",            # DNS 故障
    ]

    # 应用层故障
    APPLICATION = [
        "process_kill",           # 进程终止
        "memory_leak",            # 内存泄漏
        "cpu_spike",              # CPU 飙升
        "dependency_failure",     # 依赖服务故障
        "database_slowdown",      # 数据库变慢
    ]

    # 网络故障
    NETWORK = [
        "latency_injection",      # 延迟注入
        "packet_loss",            # 丢包
        "bandwidth_limit",        # 带宽限制
        "connection_timeout",     # 连接超时
        "ssl_expiry",             # SSL 证书过期
    ]

    # 状态故障
    STATE = [
        "data_corruption",        # 数据损坏
        "clock_skew",             # 时钟偏移
        "cache_invalidation",     # 缓存失效
        "config_change",          # 配置变更
    ]
```

### 在生产环境运行实验

虽然可以在预生产环境开始，但最有价值的实验是在生产环境进行的：

```
┌─────────────────────────────────────────────────────────────────┐
│                     混沌工程成熟度模型                           │
└─────────────────────────────────────────────────────────────────┘

Level 0: 初始阶段
├── 手动故障注入测试
├── 无系统化方法
└── 仅在开发环境

Level 1: 简单实验
├── 使用基础工具（如 Chaos Monkey）
├── 在预生产环境实验
└── 单一故障类型

Level 2: 扩展实验
├── 多种故障类型组合
├── 在生产环境的非关键服务实验
└── 建立实验流程

Level 3: 高级实验
├── 生产环境全面覆盖
├── 自动化实验执行
└── 与 CI/CD 集成

Level 4: 专家级
├── 游戏日（Game Days）
├── 持续混沌工程
└── 预测性故障分析
```

### 自动化实验

持续运行的自动化实验比一次性手动测试更有价值：

```python
from datetime import datetime, timedelta
import random

class ChaosExperimentScheduler:
    """混沌实验调度器"""

    def __init__(self, experiments: list, config: dict):
        self.experiments = experiments
        self.config = config
        self.execution_history = []

    def should_run_experiment(self) -> bool:
        """判断是否应该运行实验"""
        # 检查是否在允许的时间窗口内
        current_hour = datetime.now().hour
        allowed_hours = self.config.get('allowed_hours', range(9, 17))

        if current_hour not in allowed_hours:
            return False

        # 检查是否在冻结期（如黑五促销期间）
        freeze_periods = self.config.get('freeze_periods', [])
        now = datetime.now()

        for period in freeze_periods:
            if period['start'] <= now <= period['end']:
                return False

        # 检查系统健康状态
        if not self.check_system_health():
            return False

        return True

    def check_system_health(self) -> bool:
        """检查系统是否处于健康状态"""
        # 检查关键指标
        health_checks = [
            self.check_error_rate(),
            self.check_latency(),
            self.check_saturation(),
        ]
        return all(health_checks)

    def select_experiment(self) -> dict:
        """选择要运行的实验"""
        # 根据权重和历史选择实验
        weights = []
        for exp in self.experiments:
            # 最近运行过的实验权重降低
            recent_runs = self.count_recent_runs(exp['name'])
            weight = exp.get('weight', 1.0) / (recent_runs + 1)
            weights.append(weight)

        return random.choices(self.experiments, weights=weights)[0]

    def run_scheduled_experiment(self):
        """运行计划的实验"""
        if not self.should_run_experiment():
            return None

        experiment = self.select_experiment()

        # 执行实验
        result = self.execute_experiment(experiment)

        # 记录结果
        self.execution_history.append({
            'experiment': experiment['name'],
            'timestamp': datetime.now(),
            'result': result,
        })

        return result
```

### 最小化爆炸半径

控制实验的影响范围是安全进行混沌工程的关键：

```yaml
# 爆炸半径控制配置
blast_radius:
  # 流量百分比限制
  traffic_percentage:
    initial: 1%
    max: 10%
    increment: 1%

  # 目标限制
  targets:
    max_instances: 2
    max_percentage: 5%
    exclude_critical: true

  # 区域限制
  regions:
    allowed:
      - us-west-2a
    excluded:
      - us-east-1  # 主区域

  # 时间限制
  duration:
    max: 300  # 秒
    cooldown: 3600  # 两次实验之间的间隔

  # 自动回滚条件
  abort_conditions:
    - error_rate > 5%
    - latency_p99 > 2000ms
    - availability < 99%
```

## 故障注入技术

故障注入是混沌工程的核心技术，通过模拟各种故障场景来测试系统的弹性。

### 基础设施层故障注入

```python
import subprocess
import psutil
import signal
import os

class InfrastructureChaos:
    """基础设施层混沌注入"""

    def kill_process(self, process_name: str):
        """终止指定进程"""
        for proc in psutil.process_iter(['name', 'pid']):
            if proc.info['name'] == process_name:
                os.kill(proc.info['pid'], signal.SIGKILL)
                return True
        return False

    def consume_cpu(self, percentage: int, duration: int):
        """消耗 CPU 资源"""
        # 使用 stress-ng 工具
        cmd = f"stress-ng --cpu 0 --cpu-load {percentage} --timeout {duration}s"
        subprocess.Popen(cmd, shell=True)

    def consume_memory(self, size_mb: int, duration: int):
        """消耗内存资源"""
        cmd = f"stress-ng --vm 1 --vm-bytes {size_mb}M --timeout {duration}s"
        subprocess.Popen(cmd, shell=True)

    def fill_disk(self, path: str, size_gb: int):
        """填充磁盘空间"""
        filename = os.path.join(path, 'chaos_fill')
        cmd = f"fallocate -l {size_gb}G {filename}"
        subprocess.run(cmd, shell=True)
        return filename

    def cleanup_disk(self, filename: str):
        """清理填充的磁盘空间"""
        if os.path.exists(filename):
            os.remove(filename)
```

### 网络层故障注入

```bash
#!/bin/bash
# 网络故障注入脚本

# 添加网络延迟
add_latency() {
    local interface=$1
    local delay=$2  # 毫秒
    local jitter=$3 # 抖动，毫秒

    tc qdisc add dev $interface root netem delay ${delay}ms ${jitter}ms
    echo "Added ${delay}ms latency with ${jitter}ms jitter to $interface"
}

# 模拟丢包
add_packet_loss() {
    local interface=$1
    local percentage=$2

    tc qdisc add dev $interface root netem loss ${percentage}%
    echo "Added ${percentage}% packet loss to $interface"
}

# 限制带宽
limit_bandwidth() {
    local interface=$1
    local rate=$2  # 如 1mbit, 100kbit

    tc qdisc add dev $interface root tbf rate $rate burst 32kbit latency 400ms
    echo "Limited bandwidth to $rate on $interface"
}

# 模拟网络分区
network_partition() {
    local target_ip=$1

    iptables -A OUTPUT -d $target_ip -j DROP
    iptables -A INPUT -s $target_ip -j DROP
    echo "Created network partition with $target_ip"
}

# 恢复网络
restore_network() {
    local interface=$1

    tc qdisc del dev $interface root 2>/dev/null
    iptables -F
    echo "Network restored on $interface"
}

# 模拟 DNS 故障
dns_failure() {
    local domain=$1

    echo "127.0.0.1 $domain" >> /etc/hosts
    echo "DNS resolution blocked for $domain"
}
```

### 应用层故障注入

```python
import time
import random
import functools
from typing import Callable, Any

class ApplicationChaos:
    """应用层混沌注入"""

    def __init__(self, enabled: bool = True):
        self.enabled = enabled
        self.fault_config = {}

    def latency_fault(self,
                      min_delay: float = 0.1,
                      max_delay: float = 1.0,
                      probability: float = 0.1):
        """延迟注入装饰器"""
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                if self.enabled and random.random() < probability:
                    delay = random.uniform(min_delay, max_delay)
                    time.sleep(delay)
                return func(*args, **kwargs)
            return wrapper
        return decorator

    def error_fault(self,
                    exception_class: type = Exception,
                    message: str = "Chaos injection error",
                    probability: float = 0.1):
        """错误注入装饰器"""
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                if self.enabled and random.random() < probability:
                    raise exception_class(message)
                return func(*args, **kwargs)
            return wrapper
        return decorator

    def response_modifier(self,
                          modifier: Callable[[Any], Any],
                          probability: float = 0.1):
        """响应修改装饰器"""
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                result = func(*args, **kwargs)
                if self.enabled and random.random() < probability:
                    return modifier(result)
                return result
            return wrapper
        return decorator


# 使用示例
chaos = ApplicationChaos(enabled=True)

@chaos.latency_fault(min_delay=0.5, max_delay=2.0, probability=0.05)
@chaos.error_fault(exception_class=TimeoutError, probability=0.01)
def call_external_service(request):
    """调用外部服务"""
    # 实际的服务调用逻辑
    pass
```

## Chaos Monkey 与 Simian Army

Netflix 开发的 Simian Army 是混沌工程工具的鼻祖，包含多个专门的"猴子"工具。

### Simian Army 工具族

```
┌─────────────────────────────────────────────────────────────────┐
│                       Netflix Simian Army                        │
└─────────────────────────────────────────────────────────────────┘
         │
         ├── Chaos Monkey (混沌猴)
         │   └── 随机终止生产环境中的虚拟机实例
         │
         ├── Latency Monkey (延迟猴)
         │   └── 在 RESTful 调用中引入人工延迟
         │
         ├── Conformity Monkey (一致性猴)
         │   └── 检查实例是否符合最佳实践
         │
         ├── Doctor Monkey (医生猴)
         │   └── 检查实例健康状况
         │
         ├── Janitor Monkey (清洁猴)
         │   └── 清理未使用的资源
         │
         ├── Security Monkey (安全猴)
         │   └── 检查安全漏洞和配置问题
         │
         ├── 10-18 Monkey (国际化猴)
         │   └── 检测本地化和国际化问题
         │
         └── Chaos Gorilla / Chaos Kong (混沌大猩猩/金刚)
             └── 模拟整个可用区或区域故障
```

### Chaos Monkey 配置示例

```properties
# chaos-monkey.properties

# 基本配置
simianarmy.chaos.enabled = true
simianarmy.chaos.leashed = false

# AWS 配置
simianarmy.client.aws.accountKey = YOUR_ACCOUNT_KEY
simianarmy.client.aws.secretKey = YOUR_SECRET_KEY
simianarmy.client.aws.region = us-west-2

# 调度配置
simianarmy.scheduler.frequency = 1
simianarmy.scheduler.frequencyUnit = HOURS
simianarmy.calendar.openHour = 9
simianarmy.calendar.closeHour = 17
simianarmy.calendar.timezone = America/Los_Angeles

# 终止策略
simianarmy.chaos.terminateOndemand.enabled = true
simianarmy.chaos.mandatoryTermination.enabled = true
simianarmy.chaos.mandatoryTermination.windowInDays = 5

# 概率配置
simianarmy.chaos.asg.probability = 1.0
simianarmy.chaos.asg.maxTerminationsPerDay = 1.0

# 排除配置
simianarmy.chaos.asg.enabled.isOptedIn = false
simianarmy.chaos.asg.disabled = autoscaling-group-name-to-exclude
```

### Spring Boot Chaos Monkey

对于 Java/Spring 应用，可以使用 Chaos Monkey for Spring Boot：

```xml
<!-- pom.xml -->
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>chaos-monkey-spring-boot</artifactId>
    <version>3.0.0</version>
</dependency>
```

```yaml
# application.yml
chaos:
  monkey:
    enabled: true
    watcher:
      controller: true
      restController: true
      service: true
      repository: true
      component: false
    assaults:
      level: 5  # 攻击频率 (1-10000)
      latencyActive: true
      latencyRangeStart: 1000
      latencyRangeEnd: 3000
      exceptionsActive: true
      exception:
        type: java.lang.RuntimeException
        message: "Chaos Monkey Exception"
      killApplicationActive: false
      memoryActive: false
      memoryMillisecondsHoldFilledMemory: 90000
      memoryMillisecondsWaitNextIncrease: 1000
      memoryFillIncrementFraction: 0.15
      memoryFillTargetFraction: 0.25

# 运行时控制端点
management:
  endpoint:
    chaosmonkey:
      enabled: true
    chaosmonkeyjmx:
      enabled: true
  endpoints:
    web:
      exposure:
        include: health,info,chaosmonkey
```

```java
// 运行时控制 API 示例
@RestController
@RequestMapping("/chaos-api")
public class ChaosController {

    @Autowired
    private ChaosMonkeySettings chaosMonkeySettings;

    @Autowired
    private ChaosMonkeyRuntimeScope chaosMonkeyRuntimeScope;

    @PostMapping("/enable")
    public ResponseEntity<String> enableChaos() {
        chaosMonkeyRuntimeScope.setEnabled(true);
        return ResponseEntity.ok("Chaos Monkey enabled");
    }

    @PostMapping("/disable")
    public ResponseEntity<String> disableChaos() {
        chaosMonkeyRuntimeScope.setEnabled(false);
        return ResponseEntity.ok("Chaos Monkey disabled");
    }

    @PostMapping("/assault/latency")
    public ResponseEntity<String> configureLatency(
            @RequestParam int level,
            @RequestParam int minLatency,
            @RequestParam int maxLatency) {

        AssaultProperties assaultProperties = chaosMonkeySettings.getAssaultProperties();
        assaultProperties.setLevel(level);
        assaultProperties.setLatencyActive(true);
        assaultProperties.setLatencyRangeStart(minLatency);
        assaultProperties.setLatencyRangeEnd(maxLatency);

        return ResponseEntity.ok("Latency assault configured");
    }
}
```

## Litmus Chaos

Litmus 是一个云原生的混沌工程框架，专为 Kubernetes 环境设计。

### Litmus 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       Litmus Chaos 架构                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│   ChaosCenter   │────▶│  Chaos Operator  │────▶│   Chaos        │
│   (控制平面)     │     │  (代理执行)       │     │   Experiments  │
└─────────────────┘     └──────────────────┘     └────────────────┘
        │                       │                        │
        │                       ▼                        ▼
        │               ┌──────────────────┐     ┌────────────────┐
        │               │  ChaosEngine     │     │   ChaosResult  │
        │               │  (实验引擎)       │     │   (结果存储)    │
        │               └──────────────────┘     └────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ChaosHub                                  │
│                    (实验模板仓库)                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Pod     │  │ Node    │  │ Network │  │  AWS    │  ...       │
│  │ Chaos   │  │ Chaos   │  │ Chaos   │  │  Chaos  │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 安装 Litmus

```bash
# 安装 Litmus Operator
kubectl apply -f https://litmuschaos.github.io/litmus/litmus-operator-v3.0.0.yaml

# 验证安装
kubectl get pods -n litmus

# 安装 ChaosHub
kubectl apply -f https://hub.litmuschaos.io/api/chaos/3.0.0?file=charts/generic/experiments.yaml

# 查看可用实验
kubectl get chaosexperiments -n litmus
```

### Litmus 实验定义

```yaml
# pod-delete-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: nginx-chaos
  namespace: default
spec:
  appinfo:
    appns: default
    applabel: "app=nginx"
    appkind: deployment

  # 实验状态：主动 / 停止
  engineState: "active"

  # 混沌服务账户
  chaosServiceAccount: litmus-admin

  # 实验列表
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            # 目标容器
            - name: TARGET_CONTAINER
              value: "nginx"

            # 强制删除
            - name: FORCE
              value: "true"

            # 混沌持续时间
            - name: TOTAL_CHAOS_DURATION
              value: "60"

            # 混沌间隔
            - name: CHAOS_INTERVAL
              value: "10"

            # 并发删除的 Pod 数量
            - name: PODS_AFFECTED_PERC
              value: "50"

            # 随机序列
            - name: SEQUENCE
              value: "parallel"

        probe:
          - name: "check-nginx-health"
            type: "httpProbe"
            httpProbe/inputs:
              url: "http://nginx-service:80/health"
              insecureSkipVerify: false
              method:
                get:
                  criteria: "=="
                  responseCode: "200"
            mode: "Continuous"
            runProperties:
              probeTimeout: 5
              interval: 2
              retry: 1
              probePollingInterval: 1

---
# network-chaos-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: network-chaos
  namespace: default
spec:
  appinfo:
    appns: default
    applabel: "app=myapp"
    appkind: deployment

  engineState: "active"
  chaosServiceAccount: litmus-admin

  experiments:
    - name: pod-network-latency
      spec:
        components:
          env:
            - name: NETWORK_INTERFACE
              value: "eth0"

            - name: TARGET_CONTAINER
              value: ""

            # 网络延迟（毫秒）
            - name: NETWORK_LATENCY
              value: "2000"

            # 抖动（毫秒）
            - name: JITTER
              value: "500"

            - name: TOTAL_CHAOS_DURATION
              value: "120"

            # 目标 Pod IP
            - name: DESTINATION_IPS
              value: ""

            # 目标主机
            - name: DESTINATION_HOSTS
              value: "database-service"
```

### Litmus Workflow

```yaml
# chaos-workflow.yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: chaos-workflow
  namespace: litmus
spec:
  entrypoint: chaos-workflow
  serviceAccountName: argo-chaos

  templates:
    - name: chaos-workflow
      steps:
        # 第一步：验证稳态
        - - name: verify-steady-state
            template: steady-state-check

        # 第二步：运行混沌实验
        - - name: run-pod-delete
            template: pod-delete-chaos

        # 第三步：验证恢复
        - - name: verify-recovery
            template: recovery-check

        # 第四步：运行网络延迟实验
        - - name: run-network-latency
            template: network-latency-chaos

        # 第五步：最终验证
        - - name: final-verification
            template: steady-state-check

    - name: steady-state-check
      container:
        image: curlimages/curl:latest
        command: ["/bin/sh", "-c"]
        args:
          - |
            # 检查服务健康状态
            response=$(curl -s -o /dev/null -w "%{http_code}" http://myapp-service:8080/health)
            if [ "$response" != "200" ]; then
              echo "Steady state check failed"
              exit 1
            fi
            echo "Steady state verified"

    - name: pod-delete-chaos
      inputs:
        artifacts:
          - name: pod-delete-experiment
            path: /tmp/chaosengine.yaml
            raw:
              data: |
                apiVersion: litmuschaos.io/v1alpha1
                kind: ChaosEngine
                metadata:
                  name: pod-delete-engine
                spec:
                  appinfo:
                    appns: default
                    applabel: "app=myapp"
                    appkind: deployment
                  engineState: "active"
                  chaosServiceAccount: litmus-admin
                  experiments:
                    - name: pod-delete
                      spec:
                        components:
                          env:
                            - name: TOTAL_CHAOS_DURATION
                              value: "30"
                            - name: PODS_AFFECTED_PERC
                              value: "30"
      container:
        image: litmuschaos/litmus-checker:latest
        command: ["/bin/sh", "-c"]
        args:
          - |
            kubectl apply -f /tmp/chaosengine.yaml
            sleep 60
            kubectl delete -f /tmp/chaosengine.yaml
```

## 混沌实验设计

设计有效的混沌实验需要系统化的方法论。

### 实验设计框架

```
┌─────────────────────────────────────────────────────────────────┐
│                       混沌实验设计流程                           │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  假设    │────▶│  设计    │────▶│  执行    │────▶│  分析    │
    │  形成    │     │  实验    │     │  实验    │     │  结果    │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
         │                                                   │
         │                                                   │
         └───────────────────────────────────────────────────┘
                            持续改进
```

### 实验假设模板

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime

@dataclass
class ChaosHypothesis:
    """混沌实验假设"""

    # 基本信息
    id: str
    title: str
    description: str

    # 系统上下文
    target_system: str
    target_components: List[str]

    # 假设陈述
    hypothesis: str  # "我们假设当...发生时，系统将..."

    # 稳态定义
    steady_state_metrics: Dict[str, dict]

    # 故障类型
    fault_type: str
    fault_parameters: Dict[str, any]

    # 预期结果
    expected_behavior: str
    expected_recovery_time: int  # 秒

    # 风险评估
    risk_level: str  # low, medium, high
    blast_radius: str
    rollback_procedure: str

    # 元数据
    author: str
    created_at: datetime
    tags: List[str]


# 实验假设示例
order_service_hypothesis = ChaosHypothesis(
    id="exp-001",
    title="订单服务数据库故障恢复测试",
    description="验证订单服务在数据库连接中断时的行为",

    target_system="order-system",
    target_components=["order-service", "order-db"],

    hypothesis="""
    我们假设当订单服务的主数据库连接中断时：
    1. 服务将在 5 秒内切换到只读副本
    2. 写操作将被缓存到消息队列
    3. 用户体验不会受到明显影响（延迟增加 < 500ms）
    4. 主库恢复后，缓存的操作将在 60 秒内完成同步
    """,

    steady_state_metrics={
        "order_success_rate": {
            "query": "rate(orders_success[5m]) / rate(orders_total[5m]) * 100",
            "expected_min": 99.5
        },
        "order_latency_p99": {
            "query": "histogram_quantile(0.99, order_latency_bucket)",
            "expected_max": 500
        },
        "active_connections": {
            "query": "pg_stat_activity_count{database='orders'}",
            "expected_range": [10, 100]
        }
    },

    fault_type="database_connection_failure",
    fault_parameters={
        "target": "order-db-primary",
        "duration": 120,
        "connection_drop_percentage": 100
    },

    expected_behavior="服务降级但保持可用",
    expected_recovery_time=10,

    risk_level="medium",
    blast_radius="订单服务用户，预计影响 < 1%",
    rollback_procedure="恢复数据库网络连接，重启连接池",

    author="chaos-team",
    created_at=datetime.now(),
    tags=["database", "failover", "order-service"]
)
```

### 实验执行计划

```yaml
# experiment-plan.yaml
apiVersion: chaos.io/v1
kind: ExperimentPlan
metadata:
  name: database-failover-test
  namespace: chaos-experiments

spec:
  # 实验元数据
  hypothesis:
    id: "exp-001"
    statement: "数据库故障时服务应在10秒内完成故障转移"

  # 前置条件检查
  preconditions:
    - name: system-health
      check:
        type: prometheus
        query: "up{job='order-service'} == 1"
        expected: true

    - name: no-active-incidents
      check:
        type: pagerduty
        query: "active_incidents"
        expected: 0

    - name: within-maintenance-window
      check:
        type: time
        allowed_hours: [10, 11, 12, 13, 14, 15, 16]
        timezone: "Asia/Shanghai"

  # 稳态基线采集
  baseline:
    duration: 300  # 5分钟基线
    metrics:
      - name: success_rate
        query: "rate(http_requests_total{status='200'}[1m]) / rate(http_requests_total[1m])"
      - name: latency_p99
        query: "histogram_quantile(0.99, http_request_duration_seconds_bucket)"
      - name: error_rate
        query: "rate(http_requests_total{status=~'5..'}[1m])"

  # 实验步骤
  steps:
    - name: inject-fault
      action:
        type: network-partition
        target:
          selector:
            app: order-db
            role: primary
        parameters:
          duration: 120

      monitoring:
        interval: 5
        metrics:
          - success_rate
          - latency_p99
          - error_rate

      abort_conditions:
        - metric: error_rate
          operator: ">"
          threshold: 0.1
        - metric: success_rate
          operator: "<"
          threshold: 0.9

    - name: observe-failover
      action:
        type: wait
        duration: 30

      assertions:
        - name: failover-completed
          query: "pg_replication_is_replica{instance='order-db-primary'} == 1"
          timeout: 15

    - name: verify-recovery
      action:
        type: restore
        target:
          selector:
            app: order-db
            role: primary

      assertions:
        - name: metrics-restored
          conditions:
            - metric: success_rate
              operator: ">="
              threshold: 0.995
            - metric: latency_p99
              operator: "<="
              threshold: 0.5
          timeout: 60

  # 后置操作
  postconditions:
    - name: cleanup
      action:
        type: restore-all

    - name: generate-report
      action:
        type: report
        format: markdown
        destination: s3://chaos-reports/
```

## 爆炸半径控制

安全地进行混沌工程的关键是精确控制实验的影响范围。

### 爆炸半径策略

```python
from enum import Enum
from typing import List, Dict, Optional
import random

class BlastRadiusLevel(Enum):
    """爆炸半径级别"""
    MINIMAL = "minimal"      # 单个实例
    LIMITED = "limited"      # 少量实例（<5%）
    MODERATE = "moderate"    # 中等范围（5-20%）
    SIGNIFICANT = "significant"  # 较大范围（20-50%）
    FULL = "full"           # 全量


class BlastRadiusController:
    """爆炸半径控制器"""

    def __init__(self, config: dict):
        self.config = config
        self.current_level = BlastRadiusLevel.MINIMAL

    def select_targets(self,
                       all_targets: List[str],
                       level: BlastRadiusLevel) -> List[str]:
        """根据爆炸半径级别选择目标"""

        percentages = {
            BlastRadiusLevel.MINIMAL: 0.01,      # 1%
            BlastRadiusLevel.LIMITED: 0.05,      # 5%
            BlastRadiusLevel.MODERATE: 0.15,     # 15%
            BlastRadiusLevel.SIGNIFICANT: 0.35,  # 35%
            BlastRadiusLevel.FULL: 1.0,          # 100%
        }

        # 计算目标数量
        percentage = percentages[level]
        target_count = max(1, int(len(all_targets) * percentage))

        # 排除关键实例
        safe_targets = self.filter_critical_instances(all_targets)

        # 随机选择
        selected = random.sample(safe_targets, min(target_count, len(safe_targets)))

        return selected

    def filter_critical_instances(self, targets: List[str]) -> List[str]:
        """过滤关键实例"""
        critical_patterns = self.config.get('critical_patterns', [])

        safe_targets = []
        for target in targets:
            is_critical = any(pattern in target for pattern in critical_patterns)
            if not is_critical:
                safe_targets.append(target)

        return safe_targets

    def can_expand_blast_radius(self,
                                 current_metrics: Dict[str, float],
                                 thresholds: Dict[str, float]) -> bool:
        """判断是否可以扩大爆炸半径"""

        for metric, value in current_metrics.items():
            threshold = thresholds.get(metric)
            if threshold and value > threshold:
                return False

        return True

    def gradual_expansion(self,
                          targets: List[str],
                          start_level: BlastRadiusLevel,
                          max_level: BlastRadiusLevel,
                          metrics_checker) -> Dict:
        """渐进式扩大爆炸半径"""

        levels = list(BlastRadiusLevel)
        start_idx = levels.index(start_level)
        max_idx = levels.index(max_level)

        results = {
            "phases": [],
            "final_level": start_level,
            "stopped_early": False
        }

        for level in levels[start_idx:max_idx + 1]:
            selected_targets = self.select_targets(targets, level)

            # 执行实验
            phase_result = self.execute_phase(selected_targets)
            results["phases"].append({
                "level": level.value,
                "targets": len(selected_targets),
                "result": phase_result
            })

            # 检查指标
            current_metrics = metrics_checker.get_current_metrics()
            if not self.can_expand_blast_radius(current_metrics, self.config['thresholds']):
                results["stopped_early"] = True
                results["final_level"] = level
                break

            results["final_level"] = level

        return results
```

### 金丝雀发布与混沌工程结合

```yaml
# canary-chaos.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp

  progressDeadlineSeconds: 3600

  service:
    port: 80
    targetPort: 8080

  analysis:
    # 金丝雀分析间隔
    interval: 1m

    # 成功阈值
    threshold: 10

    # 最大失败次数
    maxWeight: 50

    # 步进权重
    stepWeight: 5

    # 指标检查
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m

      - name: request-duration
        thresholdRange:
          max: 500
        interval: 1m

    # 混沌测试 Webhooks
    webhooks:
      - name: chaos-test
        type: rollout
        url: http://chaos-controller.chaos-system/api/v1/test
        timeout: 5m
        metadata:
          type: "pod-failure"
          target: "canary"
          duration: "30s"

      - name: load-test
        type: rollout
        url: http://flagger-loadtester.test/
        timeout: 5m
        metadata:
          cmd: "hey -z 2m -q 10 -c 2 http://myapp-canary.production:80/"
```

## 安全实施混沌工程

在生产环境中安全地实施混沌工程需要完善的保护机制。

### 安全检查清单

```python
from dataclasses import dataclass
from typing import List, Callable
from datetime import datetime, time
import pytz

@dataclass
class SafetyCheck:
    """安全检查项"""
    name: str
    check_function: Callable[[], bool]
    is_blocking: bool  # 是否阻塞实验
    description: str


class ChaosEngineeringSafetyController:
    """混沌工程安全控制器"""

    def __init__(self, config: dict):
        self.config = config
        self.safety_checks: List[SafetyCheck] = []
        self.register_default_checks()

    def register_default_checks(self):
        """注册默认安全检查"""

        # 时间窗口检查
        self.safety_checks.append(SafetyCheck(
            name="time_window",
            check_function=self.check_time_window,
            is_blocking=True,
            description="确保在允许的时间窗口内运行"
        ))

        # 冻结期检查
        self.safety_checks.append(SafetyCheck(
            name="freeze_period",
            check_function=self.check_freeze_period,
            is_blocking=True,
            description="确保不在冻结期（如促销活动期间）"
        ))

        # 系统健康检查
        self.safety_checks.append(SafetyCheck(
            name="system_health",
            check_function=self.check_system_health,
            is_blocking=True,
            description="确保系统处于健康状态"
        ))

        # 进行中事件检查
        self.safety_checks.append(SafetyCheck(
            name="active_incidents",
            check_function=self.check_active_incidents,
            is_blocking=True,
            description="确保没有进行中的事件"
        ))

        # 值班人员确认
        self.safety_checks.append(SafetyCheck(
            name="oncall_acknowledgment",
            check_function=self.check_oncall_acknowledgment,
            is_blocking=True,
            description="确保值班人员已确认"
        ))

    def check_time_window(self) -> bool:
        """检查是否在允许的时间窗口内"""
        tz = pytz.timezone(self.config.get('timezone', 'UTC'))
        current_time = datetime.now(tz).time()

        allowed_start = time(
            self.config.get('allowed_start_hour', 9),
            self.config.get('allowed_start_minute', 0)
        )
        allowed_end = time(
            self.config.get('allowed_end_hour', 17),
            self.config.get('allowed_end_minute', 0)
        )

        # 检查是否是工作日
        current_day = datetime.now(tz).weekday()
        if current_day >= 5:  # 周末
            return False

        return allowed_start <= current_time <= allowed_end

    def check_freeze_period(self) -> bool:
        """检查是否在冻结期"""
        freeze_periods = self.config.get('freeze_periods', [])
        now = datetime.now()

        for period in freeze_periods:
            start = datetime.fromisoformat(period['start'])
            end = datetime.fromisoformat(period['end'])
            if start <= now <= end:
                return False

        return True

    def check_system_health(self) -> bool:
        """检查系统健康状态"""
        health_checks = self.config.get('health_checks', [])

        for check in health_checks:
            # 执行健康检查（示例）
            result = self.execute_health_check(check)
            if not result:
                return False

        return True

    def check_active_incidents(self) -> bool:
        """检查是否有进行中的事件"""
        # 集成 PagerDuty、OpsGenie 等告警平台
        # 这里是示例实现
        return True

    def check_oncall_acknowledgment(self) -> bool:
        """检查值班人员是否已确认"""
        # 检查是否收到值班人员的确认
        # 可以通过 Slack 机器人、Web UI 等方式
        return self.config.get('oncall_acknowledged', False)

    def run_all_checks(self) -> dict:
        """运行所有安全检查"""
        results = {
            "passed": True,
            "checks": [],
            "blocking_failures": []
        }

        for check in self.safety_checks:
            passed = check.check_function()
            results["checks"].append({
                "name": check.name,
                "passed": passed,
                "description": check.description
            })

            if not passed:
                if check.is_blocking:
                    results["passed"] = False
                    results["blocking_failures"].append(check.name)

        return results

    def execute_health_check(self, check: dict) -> bool:
        """执行单个健康检查"""
        # 实现具体的健康检查逻辑
        return True
```

### 紧急停止机制

```python
import asyncio
from typing import Dict, List
import aiohttp

class EmergencyStop:
    """紧急停止机制"""

    def __init__(self, config: dict):
        self.config = config
        self.active_experiments: Dict[str, dict] = {}
        self.stop_triggered = False

    async def monitor_metrics(self, experiment_id: str):
        """持续监控实验指标"""
        while experiment_id in self.active_experiments:
            metrics = await self.fetch_current_metrics()

            if self.should_abort(metrics):
                await self.trigger_emergency_stop(experiment_id, metrics)
                break

            await asyncio.sleep(5)  # 每5秒检查一次

    def should_abort(self, metrics: Dict[str, float]) -> bool:
        """判断是否应该中止实验"""
        abort_conditions = self.config.get('abort_conditions', {})

        for metric, threshold in abort_conditions.items():
            current_value = metrics.get(metric)
            if current_value is None:
                continue

            operator = threshold.get('operator', '>')
            value = threshold.get('value')

            if operator == '>' and current_value > value:
                return True
            elif operator == '<' and current_value < value:
                return True
            elif operator == '>=' and current_value >= value:
                return True
            elif operator == '<=' and current_value <= value:
                return True

        return False

    async def trigger_emergency_stop(self,
                                      experiment_id: str,
                                      trigger_metrics: Dict[str, float]):
        """触发紧急停止"""
        self.stop_triggered = True

        # 1. 立即停止故障注入
        await self.stop_fault_injection(experiment_id)

        # 2. 执行回滚程序
        await self.execute_rollback(experiment_id)

        # 3. 发送告警通知
        await self.send_alerts(experiment_id, trigger_metrics)

        # 4. 记录事件
        self.log_emergency_stop(experiment_id, trigger_metrics)

        # 5. 从活跃实验列表中移除
        del self.active_experiments[experiment_id]

    async def stop_fault_injection(self, experiment_id: str):
        """停止故障注入"""
        experiment = self.active_experiments.get(experiment_id)
        if not experiment:
            return

        # 根据故障类型执行对应的停止操作
        fault_type = experiment.get('fault_type')

        if fault_type == 'network':
            await self.restore_network()
        elif fault_type == 'process':
            await self.restore_processes()
        elif fault_type == 'resource':
            await self.release_resources()

    async def execute_rollback(self, experiment_id: str):
        """执行回滚程序"""
        experiment = self.active_experiments.get(experiment_id)
        rollback_steps = experiment.get('rollback_steps', [])

        for step in rollback_steps:
            try:
                await self.execute_step(step)
            except Exception as e:
                # 回滚失败时升级告警
                await self.escalate_alert(experiment_id, step, e)

    async def send_alerts(self,
                          experiment_id: str,
                          trigger_metrics: Dict[str, float]):
        """发送告警通知"""
        alert_channels = self.config.get('alert_channels', [])

        message = f"""
        [紧急] 混沌实验已自动终止

        实验ID: {experiment_id}
        触发原因: 指标超出阈值
        触发指标: {trigger_metrics}
        时间: {datetime.now().isoformat()}

        请检查系统状态并确认恢复。
        """

        for channel in alert_channels:
            if channel['type'] == 'slack':
                await self.send_slack_alert(channel['webhook'], message)
            elif channel['type'] == 'pagerduty':
                await self.send_pagerduty_alert(channel['key'], message)
```

### 游戏日（Game Day）流程

```markdown
# 游戏日执行手册

## 准备阶段（提前1-2周）

### 确定范围和目标
- [ ] 选择要测试的系统和服务
- [ ] 定义成功标准
- [ ] 确定参与团队

### 风险评估
- [ ] 识别潜在风险
- [ ] 准备缓解措施
- [ ] 建立回滚计划

### 通知相关方
- [ ] 通知运维团队
- [ ] 通知客服团队
- [ ] 通知业务相关方
- [ ] 更新事件响应文档

### 准备监控
- [ ] 创建专用监控仪表板
- [ ] 设置额外告警
- [ ] 准备日志查询

## 执行阶段

### 开始前检查
- [ ] 确认系统处于稳态
- [ ] 确认所有参与者就位
- [ ] 确认回滚机制可用
- [ ] 开始录制/记录

### 执行实验
- [ ] 按计划注入故障
- [ ] 记录系统行为
- [ ] 记录响应时间
- [ ] 记录恢复时间

### 观察和记录
- [ ] 持续监控指标
- [ ] 记录意外行为
- [ ] 记录团队响应

## 总结阶段

### 事后分析
- [ ] 收集所有数据
- [ ] 分析系统行为
- [ ] 评估假设是否成立

### 编写报告
- [ ] 记录发现的问题
- [ ] 提出改进建议
- [ ] 分配后续任务

### 分享结果
- [ ] 团队内部分享
- [ ] 更新运维文档
- [ ] 跟踪改进进度
```

## 混沌工程工具对比

| 工具 | 适用环境 | 主要特点 | 学习曲线 |
|------|---------|---------|---------|
| Chaos Monkey | AWS | Netflix 开源，随机终止实例 | 低 |
| Litmus | Kubernetes | 云原生，丰富的实验类型 | 中 |
| Gremlin | 多平台 | 企业级，GUI 友好 | 低 |
| Chaos Mesh | Kubernetes | CNCF 项目，功能全面 | 中 |
| Toxiproxy | 应用层 | 网络故障模拟，轻量级 | 低 |
| Pumba | Docker | 容器级混沌，简单易用 | 低 |
| PowerfulSeal | Kubernetes | 策略驱动，支持多种故障 | 中 |
| Chaos Toolkit | 多平台 | 声明式，可扩展 | 中 |

## 最佳实践

### 循序渐进

```
┌─────────────────────────────────────────────────────────────────┐
│                    混沌工程实施路线图                            │
└─────────────────────────────────────────────────────────────────┘

第一阶段：基础建设（1-3个月）
├── 建立可观测性体系
├── 定义稳态指标
├── 在开发环境试验
└── 培训团队

第二阶段：扩展实践（3-6个月）
├── 预生产环境实验
├── 自动化实验执行
├── 建立实验库
└── 进行首次 Game Day

第三阶段：生产实践（6-12个月）
├── 生产环境小规模实验
├── 持续混沌工程
├── 与 CI/CD 集成
└── 扩大团队参与

第四阶段：成熟运营（持续）
├── 全面自动化
├── 预测性故障分析
├── 混沌工程即服务
└── 持续改进
```

### 建立混沌工程文化

```python
# 混沌工程文化建设要素
chaos_engineering_culture = {
    "心态转变": [
        "从恐惧故障到拥抱故障",
        "从被动响应到主动发现",
        "从推卸责任到共同学习",
    ],

    "组织支持": [
        "领导层支持和资源投入",
        "跨团队协作机制",
        "容错的学习环境",
    ],

    "技能建设": [
        "混沌工程培训",
        "故障分析能力",
        "系统思维能力",
    ],

    "流程规范": [
        "实验审批流程",
        "安全检查清单",
        "事后分析模板",
    ],

    "工具平台": [
        "统一的混沌平台",
        "可观测性工具",
        "自动化能力",
    ],
}
```

### 度量混沌工程成效

```yaml
# 混沌工程成效指标
metrics:
  # 弹性指标
  resilience:
    - name: mean_time_to_recovery
      description: 平均恢复时间
      target: "< 5 分钟"

    - name: failure_detection_rate
      description: 故障检测率
      target: "> 95%"

    - name: auto_remediation_rate
      description: 自动修复率
      target: "> 80%"

  # 实验指标
  experiments:
    - name: experiments_per_month
      description: 每月实验次数
      target: "> 20"

    - name: production_coverage
      description: 生产服务覆盖率
      target: "> 80%"

    - name: issues_discovered
      description: 发现的问题数
      target: "持续改进"

  # 文化指标
  culture:
    - name: team_participation
      description: 团队参与率
      target: "> 90%"

    - name: game_days_per_quarter
      description: 每季度 Game Day 次数
      target: ">= 1"

    - name: post_incident_improvements
      description: 事后改进实施率
      target: "> 90%"
```

## 常见问题与解答

### 如何说服管理层支持混沌工程？

- 强调主动发现问题比被动响应更有价值
- 展示业界案例（Netflix、Amazon、Google）
- 从小规模、低风险实验开始证明价值
- 量化潜在故障的业务影响

### 如何处理实验导致的真实故障？

- 始终有紧急停止机制
- 确保回滚程序已验证
- 值班人员随时待命
- 将其视为学习机会而非失败

### 混沌工程与传统测试有什么区别？

- 混沌工程关注系统整体行为，而非单个组件
- 混沌工程在生产环境进行，更接近真实场景
- 混沌工程探索未知问题，传统测试验证已知行为

### 如何选择合适的混沌工程工具？

- 考虑技术栈（Kubernetes、VM、容器）
- 评估团队技能水平
- 权衡开源与商业解决方案
- 考虑与现有工具的集成

## 总结

混沌工程是现代分布式系统可靠性工程的重要组成部分。通过系统化地引入故障，我们能够：

1. **提前发现系统弱点**：在用户受影响之前发现问题
2. **验证弹性机制**：确保故障转移、自动恢复等机制正常工作
3. **建立信心**：对系统在极端条件下的行为有清晰认识
4. **培养文化**：建立拥抱故障、持续学习的工程文化

成功实施混沌工程需要循序渐进、安全第一，并将其作为持续改进的一部分。随着实践的深入，混沌工程将从一次性实验演变为持续运行的系统验证机制，为构建真正可靠的系统提供坚实保障。
