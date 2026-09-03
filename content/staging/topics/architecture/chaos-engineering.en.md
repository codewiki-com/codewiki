---
title: Chaos Engineering
description: Improve system resilience through chaos engineering
track: architecture
section: distributed
difficulty: advanced
tags:
  - chaos engineering
  - resilience
  - fault injection
  - Netflix
status: imported
origin: old/src/content/docs/devops/chaos-engineering.en.md
divergence: 0.141
issues: []
legacy:
  category: DevOps
  subcategory: Resilience
  order: 19
  lastUpdated: 2026-01-07
---

## What is Chaos Engineering?

Chaos Engineering is the discipline of experimenting on a distributed system to build confidence in its ability to withstand turbulent conditions in production. Rather than waiting for failures to occur naturally and cause outages, chaos engineering proactively injects failures to discover weaknesses before they impact users.

The practice originated at Netflix in 2010 when the company migrated to AWS and faced the reality that cloud infrastructure is inherently unreliable. Engineers needed a way to validate that their systems could handle the loss of individual components without cascading into full outages. This led to the creation of Chaos Monkey and eventually the broader discipline of chaos engineering.

### The Philosophy Behind Chaos Engineering

Traditional approaches to reliability focus on preventing failures through redundancy and careful design. While important, this approach has limitations: complex distributed systems inevitably fail in unexpected ways. Chaos engineering embraces this reality by treating failures as expected events rather than exceptional circumstances.

The core insight is simple but powerful: **if you want to know how your system behaves when things go wrong, you must make things go wrong deliberately and observe the results**.

### Chaos Engineering vs Traditional Testing

| Aspect | Traditional Testing | Chaos Engineering |
|--------|---------------------|-------------------|
| Environment | Often pre-production | Production or production-like |
| Approach | Verify known behaviors | Discover unknown weaknesses |
| Failure Type | Simulated, controlled | Real or realistic failures |
| Scope | Individual components | System-wide interactions |
| Goal | Prove code works | Prove system is resilient |
| Mindset | Prove correctness | Challenge assumptions |

---

## Core Principles of Chaos Engineering

The Chaos Engineering community has established five foundational principles that guide safe and effective experimentation.

### Build a Hypothesis Around Steady State Behavior

Before introducing chaos, you must understand what "normal" looks like for your system. Steady state is defined by measurable business metrics that indicate the system is working correctly.

**Good Steady State Indicators:**
- Requests per second
- Error rate
- Latency percentiles (p50, p95, p99)
- Successful transactions
- User engagement metrics

**Example Hypothesis:**

```python
from dataclasses import dataclass
from typing import List, Callable

@dataclass
class SteadyStateMetric:
    """Define a measurable steady state indicator."""
    name: str
    baseline_value: float
    acceptable_deviation: float  # Percentage
    measurement_function: Callable[[], float]

    def is_within_bounds(self, current_value: float) -> bool:
        """Check if current value is within acceptable range."""
        lower_bound = self.baseline_value * (1 - self.acceptable_deviation)
        upper_bound = self.baseline_value * (1 + self.acceptable_deviation)
        return lower_bound <= current_value <= upper_bound

@dataclass
class ChaosHypothesis:
    """Formalize a chaos engineering hypothesis."""
    name: str
    description: str
    steady_state_metrics: List[SteadyStateMetric]
    expected_outcome: str

    def evaluate(self) -> dict:
        """Evaluate all steady state metrics."""
        results = {}
        for metric in self.steady_state_metrics:
            current = metric.measurement_function()
            results[metric.name] = {
                "baseline": metric.baseline_value,
                "current": current,
                "within_bounds": metric.is_within_bounds(current),
                "deviation": abs(current - metric.baseline_value) / metric.baseline_value
            }
        return results

# Example usage
hypothesis = ChaosHypothesis(
    name="Database Failover Resilience",
    description="System should maintain normal operation during database primary failover",
    steady_state_metrics=[
        SteadyStateMetric(
            name="error_rate",
            baseline_value=0.001,  # 0.1% error rate
            acceptable_deviation=0.5,  # Allow 50% increase (to 0.15%)
            measurement_function=lambda: get_current_error_rate()
        ),
        SteadyStateMetric(
            name="p99_latency_ms",
            baseline_value=200,
            acceptable_deviation=0.25,  # Allow 25% increase
            measurement_function=lambda: get_p99_latency()
        )
    ],
    expected_outcome="Error rate and latency remain within acceptable bounds during failover"
)
```

### Vary Real-World Events

Chaos experiments should simulate realistic failure scenarios that could occur in production. Focus on events that:
- Have occurred in the past
- Could plausibly occur
- Would have significant impact

**Common Real-World Events to Simulate:**

| Category | Events |
|----------|--------|
| Infrastructure | Server crashes, disk failures, network partitions |
| Dependencies | Third-party API timeouts, database unavailability |
| Resources | CPU exhaustion, memory pressure, disk full |
| Network | Latency spikes, packet loss, DNS failures |
| Application | Process crashes, thread pool exhaustion |

### Run Experiments in Production

While this principle often causes concern, running experiments in production provides the most accurate results. Production environments have:
- Real traffic patterns
- Actual data volumes
- True dependency interactions
- Production-specific configurations

**When Production is Not Feasible:**

```python
class EnvironmentSelector:
    """Determine appropriate environment for chaos experiments."""

    ENVIRONMENT_RISK_LEVELS = {
        "development": 1,
        "staging": 2,
        "production_canary": 3,
        "production_subset": 4,
        "production_full": 5
    }

    def recommend_environment(
        self,
        experiment_risk: int,  # 1-5
        team_maturity: int,    # 1-5
        has_safety_controls: bool,
        blast_radius_controllable: bool
    ) -> str:
        """Recommend appropriate environment for experiment."""
        if not has_safety_controls:
            return "staging"

        if not blast_radius_controllable:
            return "production_canary"

        risk_tolerance = min(team_maturity, 5)

        if experiment_risk <= risk_tolerance and blast_radius_controllable:
            return "production_subset"
        elif experiment_risk <= risk_tolerance - 1:
            return "production_full"
        else:
            return "staging"
```

### Automate Experiments to Run Continuously

Manual, one-time experiments provide limited value. Continuous automated experiments catch regressions and validate that resilience improvements work.

```python
from datetime import datetime, timedelta
from typing import Optional
from enum import Enum
import random

class ExperimentSchedule(Enum):
    BUSINESS_HOURS = "business_hours"
    OFF_PEAK = "off_peak"
    RANDOM = "random"
    CONTINUOUS = "continuous"

class ChaosScheduler:
    """Schedule and run chaos experiments automatically."""

    def __init__(self, experiments: list):
        self.experiments = experiments
        self.run_history = []

    def should_run(
        self,
        schedule: ExperimentSchedule,
        current_time: Optional[datetime] = None
    ) -> bool:
        """Determine if experiment should run based on schedule."""
        now = current_time or datetime.now()
        hour = now.hour
        weekday = now.weekday()

        if schedule == ExperimentSchedule.BUSINESS_HOURS:
            return 9 <= hour <= 17 and weekday < 5

        elif schedule == ExperimentSchedule.OFF_PEAK:
            return hour < 6 or hour > 22 or weekday >= 5

        elif schedule == ExperimentSchedule.RANDOM:
            return random.random() < 0.1  # 10% chance each check

        elif schedule == ExperimentSchedule.CONTINUOUS:
            return True

        return False

    def run_scheduled_experiments(self) -> list:
        """Execute experiments based on their schedules."""
        results = []
        for experiment in self.experiments:
            if self.should_run(experiment.schedule):
                result = experiment.run()
                self.run_history.append({
                    "experiment": experiment.name,
                    "timestamp": datetime.now(),
                    "result": result
                })
                results.append(result)
        return results
```

### Minimize Blast Radius

Start small and increase scope gradually. The goal is learning, not causing outages.

**Blast Radius Control Strategies:**

1. **Start with non-production environments**
2. **Target a subset of traffic or instances**
3. **Implement automatic rollback**
4. **Set strict duration limits**
5. **Have kill switches readily available**

```python
from dataclasses import dataclass
from typing import Optional
import time

@dataclass
class BlastRadiusConfig:
    """Configure experiment blast radius."""
    target_percentage: float = 5.0  # Start with 5% of traffic
    max_duration_seconds: int = 300  # 5 minutes max
    affected_regions: list = None
    excluded_customers: list = None
    auto_rollback_on_threshold: bool = True
    rollback_error_threshold: float = 0.05  # 5% error rate

class BlastRadiusController:
    """Control and limit the impact of chaos experiments."""

    def __init__(self, config: BlastRadiusConfig):
        self.config = config
        self.start_time: Optional[float] = None
        self.is_active = False

    def start_experiment(self) -> bool:
        """Start experiment with blast radius controls."""
        self.start_time = time.time()
        self.is_active = True
        return True

    def check_limits(self, current_error_rate: float) -> dict:
        """Check if experiment should continue or be stopped."""
        if not self.is_active:
            return {"continue": False, "reason": "Experiment not active"}

        elapsed = time.time() - self.start_time

        # Check duration limit
        if elapsed > self.config.max_duration_seconds:
            self.stop_experiment()
            return {"continue": False, "reason": "Duration limit reached"}

        # Check error threshold
        if self.config.auto_rollback_on_threshold:
            if current_error_rate > self.config.rollback_error_threshold:
                self.stop_experiment()
                return {
                    "continue": False,
                    "reason": f"Error rate {current_error_rate:.2%} exceeded threshold"
                }

        return {"continue": True, "elapsed": elapsed}

    def stop_experiment(self) -> None:
        """Stop experiment and rollback."""
        self.is_active = False
        # Trigger rollback procedures
```

---

## Fault Injection Techniques

Fault injection is the mechanism by which chaos is introduced into a system. Different techniques target different layers of the stack.

### Infrastructure-Level Fault Injection

**Server Termination:**

```python
import boto3
import random
from typing import List, Optional

class EC2ChaosInjector:
    """Inject chaos at the EC2 infrastructure level."""

    def __init__(self, region: str = "us-east-1"):
        self.ec2 = boto3.client("ec2", region_name=region)

    def get_target_instances(
        self,
        tag_filters: dict,
        percentage: float = 10.0
    ) -> List[str]:
        """Select random instances for termination."""
        filters = [
            {"Name": f"tag:{k}", "Values": [v]}
            for k, v in tag_filters.items()
        ]
        filters.append({"Name": "instance-state-name", "Values": ["running"]})

        response = self.ec2.describe_instances(Filters=filters)

        instance_ids = []
        for reservation in response["Reservations"]:
            for instance in reservation["Instances"]:
                instance_ids.append(instance["InstanceId"])

        # Select percentage of instances
        num_targets = max(1, int(len(instance_ids) * percentage / 100))
        return random.sample(instance_ids, min(num_targets, len(instance_ids)))

    def terminate_instances(
        self,
        instance_ids: List[str],
        dry_run: bool = True
    ) -> dict:
        """Terminate selected instances."""
        if dry_run:
            return {
                "action": "terminate",
                "dry_run": True,
                "targets": instance_ids
            }

        response = self.ec2.terminate_instances(InstanceIds=instance_ids)
        return {
            "action": "terminate",
            "terminated": [
                i["InstanceId"]
                for i in response["TerminatingInstances"]
            ]
        }
```

### Network-Level Fault Injection

Network chaos simulates real-world network issues like latency, packet loss, and partitions.

**Using tc (Traffic Control) for Network Chaos:**

```bash
#!/bin/bash
# network_chaos.sh - Inject network faults using tc

set -e

INTERFACE="${1:-eth0}"
ACTION="${2:-add}"
FAULT_TYPE="${3:-latency}"

add_latency() {
    local delay_ms="${1:-100}"
    local jitter_ms="${2:-10}"

    tc qdisc add dev "$INTERFACE" root netem delay "${delay_ms}ms" "${jitter_ms}ms"
    echo "Added ${delay_ms}ms latency with ${jitter_ms}ms jitter to $INTERFACE"
}

add_packet_loss() {
    local loss_percent="${1:-5}"

    tc qdisc add dev "$INTERFACE" root netem loss "${loss_percent}%"
    echo "Added ${loss_percent}% packet loss to $INTERFACE"
}

add_bandwidth_limit() {
    local rate="${1:-1mbit}"

    tc qdisc add dev "$INTERFACE" root tbf rate "$rate" burst 32kbit latency 400ms
    echo "Limited bandwidth to $rate on $INTERFACE"
}

remove_chaos() {
    tc qdisc del dev "$INTERFACE" root 2>/dev/null || true
    echo "Removed all traffic control rules from $INTERFACE"
}

case "$ACTION" in
    add)
        case "$FAULT_TYPE" in
            latency) add_latency "${4:-100}" "${5:-10}" ;;
            loss) add_packet_loss "${4:-5}" ;;
            bandwidth) add_bandwidth_limit "${4:-1mbit}" ;;
            *) echo "Unknown fault type: $FAULT_TYPE" && exit 1 ;;
        esac
        ;;
    remove)
        remove_chaos
        ;;
    *)
        echo "Usage: $0 <interface> <add|remove> <latency|loss|bandwidth> [params...]"
        exit 1
        ;;
esac
```

**Python Network Chaos Controller:**

```python
import subprocess
from dataclasses import dataclass
from enum import Enum
from typing import Optional

class NetworkFaultType(Enum):
    LATENCY = "latency"
    PACKET_LOSS = "packet_loss"
    BANDWIDTH_LIMIT = "bandwidth"
    PARTITION = "partition"
    CORRUPTION = "corruption"

@dataclass
class NetworkFault:
    """Define a network fault to inject."""
    fault_type: NetworkFaultType
    interface: str = "eth0"
    latency_ms: int = 100
    jitter_ms: int = 10
    packet_loss_percent: float = 5.0
    bandwidth_limit: str = "1mbit"
    target_ip: Optional[str] = None

class NetworkChaosInjector:
    """Inject network-level chaos using Linux tc."""

    def inject(self, fault: NetworkFault) -> dict:
        """Inject the specified network fault."""
        if fault.fault_type == NetworkFaultType.LATENCY:
            return self._add_latency(
                fault.interface,
                fault.latency_ms,
                fault.jitter_ms
            )
        elif fault.fault_type == NetworkFaultType.PACKET_LOSS:
            return self._add_packet_loss(
                fault.interface,
                fault.packet_loss_percent
            )
        elif fault.fault_type == NetworkFaultType.PARTITION:
            return self._add_partition(
                fault.interface,
                fault.target_ip
            )
        else:
            raise ValueError(f"Unsupported fault type: {fault.fault_type}")

    def _add_latency(
        self,
        interface: str,
        delay_ms: int,
        jitter_ms: int
    ) -> dict:
        """Add network latency."""
        cmd = [
            "tc", "qdisc", "add", "dev", interface,
            "root", "netem", "delay",
            f"{delay_ms}ms", f"{jitter_ms}ms"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return {
            "success": result.returncode == 0,
            "command": " ".join(cmd),
            "error": result.stderr if result.returncode != 0 else None
        }

    def _add_packet_loss(
        self,
        interface: str,
        loss_percent: float
    ) -> dict:
        """Add packet loss."""
        cmd = [
            "tc", "qdisc", "add", "dev", interface,
            "root", "netem", "loss", f"{loss_percent}%"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return {
            "success": result.returncode == 0,
            "command": " ".join(cmd),
            "error": result.stderr if result.returncode != 0 else None
        }

    def _add_partition(
        self,
        interface: str,
        target_ip: str
    ) -> dict:
        """Create network partition to specific IP."""
        cmd = [
            "iptables", "-A", "INPUT",
            "-s", target_ip, "-j", "DROP"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return {
            "success": result.returncode == 0,
            "command": " ".join(cmd),
            "error": result.stderr if result.returncode != 0 else None
        }

    def clear(self, interface: str) -> dict:
        """Remove all injected faults."""
        cmd = ["tc", "qdisc", "del", "dev", interface, "root"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return {"success": True, "message": f"Cleared faults from {interface}"}
```

### Application-Level Fault Injection

Inject faults directly into application code for more precise control.

```python
import random
import time
from functools import wraps
from typing import Callable, Optional
import threading

class ChaosContext:
    """Thread-local chaos configuration."""
    _local = threading.local()

    @classmethod
    def is_chaos_enabled(cls) -> bool:
        return getattr(cls._local, 'enabled', False)

    @classmethod
    def set_enabled(cls, enabled: bool) -> None:
        cls._local.enabled = enabled

class ApplicationChaosInjector:
    """Inject chaos at the application level."""

    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        self.fault_configs = {}

    def configure_fault(
        self,
        name: str,
        probability: float = 0.1,
        latency_ms: int = 0,
        exception_type: Optional[type] = None,
        exception_message: str = "Chaos-induced failure"
    ) -> None:
        """Configure a named fault injection point."""
        self.fault_configs[name] = {
            "probability": probability,
            "latency_ms": latency_ms,
            "exception_type": exception_type,
            "exception_message": exception_message
        }

    def maybe_inject(self, fault_name: str) -> None:
        """Potentially inject a fault at this point."""
        if not self.enabled or fault_name not in self.fault_configs:
            return

        config = self.fault_configs[fault_name]

        if random.random() > config["probability"]:
            return

        # Inject latency
        if config["latency_ms"] > 0:
            time.sleep(config["latency_ms"] / 1000.0)

        # Inject exception
        if config["exception_type"]:
            raise config["exception_type"](config["exception_message"])

    def chaos_point(self, fault_name: str) -> Callable:
        """Decorator to add chaos injection point to a function."""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                self.maybe_inject(fault_name)
                return func(*args, **kwargs)
            return wrapper
        return decorator


# Usage example
chaos = ApplicationChaosInjector(enabled=True)

# Configure faults
chaos.configure_fault(
    "database_read",
    probability=0.05,
    latency_ms=500,
    exception_type=TimeoutError,
    exception_message="Database read timeout"
)

chaos.configure_fault(
    "external_api",
    probability=0.1,
    latency_ms=2000
)

@chaos.chaos_point("database_read")
def get_user(user_id: str) -> dict:
    """Fetch user from database - with chaos injection."""
    # Normal database logic
    return {"id": user_id, "name": "Test User"}

@chaos.chaos_point("external_api")
def call_payment_api(amount: float) -> dict:
    """Call external payment API - with chaos injection."""
    # Normal API call logic
    return {"status": "success", "amount": amount}
```

---

## Chaos Monkey and Netflix's Simian Army

Chaos Monkey is the original and most famous chaos engineering tool, created by Netflix in 2011. It randomly terminates instances in production to ensure that engineers design services that can tolerate instance failures.

### The Simian Army

Netflix expanded Chaos Monkey into a complete "Simian Army" of chaos tools:

| Tool | Purpose |
|------|---------|
| Chaos Monkey | Randomly terminates instances |
| Latency Monkey | Introduces artificial delays |
| Conformity Monkey | Finds instances not adhering to best practices |
| Doctor Monkey | Detects unhealthy instances |
| Janitor Monkey | Cleans up unused resources |
| Security Monkey | Finds security violations |
| Chaos Gorilla | Simulates entire availability zone failure |
| Chaos Kong | Simulates entire region failure |

### Modern Chaos Monkey Configuration

```yaml
# chaosmonkey.yaml - Chaos Monkey configuration
chaosmonkey:
  enabled: true

  # Scheduling
  scheduler:
    frequency: 1     # How often to run (in hours)
    timezone: "America/Los_Angeles"

    # Only run during business hours when engineers are available
    business_hours:
      start: 9
      end: 17

    # Skip weekends
    skip_days:
      - Saturday
      - Sunday

  # Targeting
  targeting:
    # Which applications to target
    applications:
      - name: "api-service"
        enabled: true
        min_instances: 3  # Never go below this

      - name: "worker-service"
        enabled: true
        min_instances: 2

    # Regions to include
    regions:
      - us-east-1
      - us-west-2

    # Never target these
    exclusions:
      - pattern: "*-critical*"
      - pattern: "*database*"

  # Termination settings
  termination:
    probability: 0.5  # 50% chance per check

    # Grouping strategy
    group_by: "auto_scaling_group"

    # Maximum terminations
    max_per_day: 10
    max_per_group: 1

  # Notifications
  notifications:
    slack:
      webhook_url: "${SLACK_WEBHOOK}"
      channel: "#chaos-notifications"

    email:
      recipients:
        - oncall@company.com
```

### Implementing Chaos Monkey Logic

```python
import random
from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass, field
import boto3

@dataclass
class TerminationRule:
    """Define rules for instance termination."""
    application: str
    enabled: bool = True
    min_instances: int = 2
    probability: float = 0.5
    max_daily_terminations: int = 5

@dataclass
class ChaosMonkeyConfig:
    """Configuration for Chaos Monkey."""
    rules: List[TerminationRule] = field(default_factory=list)
    business_hours_only: bool = True
    business_hour_start: int = 9
    business_hour_end: int = 17
    skip_weekends: bool = True
    dry_run: bool = True

class ChaosMonkey:
    """A simplified implementation of Chaos Monkey."""

    def __init__(self, config: ChaosMonkeyConfig, region: str = "us-east-1"):
        self.config = config
        self.ec2 = boto3.client("ec2", region_name=region)
        self.daily_terminations = {}

    def should_run(self, current_time: Optional[datetime] = None) -> bool:
        """Check if Chaos Monkey should run based on schedule."""
        now = current_time or datetime.now()

        if self.config.skip_weekends and now.weekday() >= 5:
            return False

        if self.config.business_hours_only:
            if not (self.config.business_hour_start
                    <= now.hour
                    < self.config.business_hour_end):
                return False

        return True

    def get_candidates(self, rule: TerminationRule) -> List[dict]:
        """Get termination candidates for a rule."""
        filters = [
            {"Name": "tag:Application", "Values": [rule.application]},
            {"Name": "instance-state-name", "Values": ["running"]}
        ]

        response = self.ec2.describe_instances(Filters=filters)

        instances = []
        for reservation in response["Reservations"]:
            for instance in reservation["Instances"]:
                instances.append({
                    "id": instance["InstanceId"],
                    "launch_time": instance["LaunchTime"],
                    "availability_zone": instance["Placement"]["AvailabilityZone"]
                })

        return instances

    def select_victim(
        self,
        candidates: List[dict],
        rule: TerminationRule
    ) -> Optional[dict]:
        """Select a random instance to terminate."""
        if len(candidates) <= rule.min_instances:
            return None

        if random.random() > rule.probability:
            return None

        # Check daily limit
        today = datetime.now().date().isoformat()
        daily_count = self.daily_terminations.get(rule.application, {}).get(today, 0)
        if daily_count >= rule.max_daily_terminations:
            return None

        return random.choice(candidates)

    def terminate(self, instance: dict, rule: TerminationRule) -> dict:
        """Terminate the selected instance."""
        instance_id = instance["id"]

        if self.config.dry_run:
            return {
                "action": "terminate",
                "dry_run": True,
                "instance_id": instance_id,
                "application": rule.application
            }

        self.ec2.terminate_instances(InstanceIds=[instance_id])

        # Track daily terminations
        today = datetime.now().date().isoformat()
        if rule.application not in self.daily_terminations:
            self.daily_terminations[rule.application] = {}
        self.daily_terminations[rule.application][today] = \
            self.daily_terminations[rule.application].get(today, 0) + 1

        return {
            "action": "terminate",
            "dry_run": False,
            "instance_id": instance_id,
            "application": rule.application,
            "timestamp": datetime.now().isoformat()
        }

    def run(self) -> List[dict]:
        """Execute Chaos Monkey for all configured rules."""
        if not self.should_run():
            return [{"skipped": True, "reason": "Outside scheduled hours"}]

        results = []
        for rule in self.config.rules:
            if not rule.enabled:
                continue

            candidates = self.get_candidates(rule)
            victim = self.select_victim(candidates, rule)

            if victim:
                result = self.terminate(victim, rule)
                results.append(result)
            else:
                results.append({
                    "application": rule.application,
                    "action": "none",
                    "reason": "No suitable victim found or probability check failed"
                })

        return results
```

---

## LitmusChaos for Kubernetes

LitmusChaos is a cloud-native chaos engineering platform designed for Kubernetes environments. It provides a declarative approach to chaos experiments using Custom Resource Definitions (CRDs).

### Installing LitmusChaos

```bash
# Install LitmusChaos using Helm
helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm/
helm repo update

# Install Litmus in a dedicated namespace
kubectl create namespace litmus

helm install litmus litmuschaos/litmus \
    --namespace litmus \
    --set portal.frontend.service.type=LoadBalancer
```

### LitmusChaos Architecture

```
+------------------+     +------------------+
|   Litmus Portal  |     |    Chaos Hub     |
| (Web Dashboard)  |<--->| (Experiment Repo)|
+--------+---------+     +------------------+
         |
         v
+--------+---------+
|   Chaos Center   |
|  (Control Plane) |
+--------+---------+
         |
         v
+--------+---------+     +------------------+
| Chaos Subscriber |---->|   Target Cluster |
| (Agent per NS)   |     |   Applications   |
+------------------+     +------------------+
```

### Defining Chaos Experiments

**Pod Delete Experiment:**

```yaml
# pod-delete-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: api-pod-delete
  namespace: production
spec:
  # Target application
  appinfo:
    appns: production
    applabel: "app=api-service"
    appkind: deployment

  # Chaos configuration
  engineState: "active"
  chaosServiceAccount: litmus-admin

  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            # Number of pods to kill
            - name: TOTAL_CHAOS_DURATION
              value: "30"

            # How many pods to delete
            - name: PODS_AFFECTED_PERC
              value: "50"

            # Delete pods sequentially or in parallel
            - name: SEQUENCE
              value: "parallel"

            # Time between pod deletions
            - name: CHAOS_INTERVAL
              value: "10"

            # Force delete
            - name: FORCE
              value: "false"

        probe:
          - name: "check-api-health"
            type: "httpProbe"
            httpProbe/inputs:
              url: "http://api-service.production.svc:8080/health"
              method:
                get:
                  criteria: "=="
                  responseCode: "200"
            mode: "Continuous"
            runProperties:
              probeTimeout: 5
              interval: 2
              retry: 3
```

**Network Chaos Experiment:**

```yaml
# network-chaos-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: api-network-chaos
  namespace: production
spec:
  appinfo:
    appns: production
    applabel: "app=api-service"
    appkind: deployment

  engineState: "active"
  chaosServiceAccount: litmus-admin

  experiments:
    - name: pod-network-latency
      spec:
        components:
          env:
            # Duration of chaos
            - name: TOTAL_CHAOS_DURATION
              value: "60"

            # Network latency in milliseconds
            - name: NETWORK_LATENCY
              value: "300"

            # Jitter in milliseconds
            - name: JITTER
              value: "50"

            # Target specific container
            - name: TARGET_CONTAINER
              value: "api"

            # Network interface
            - name: NETWORK_INTERFACE
              value: "eth0"

            # Destination IPs (optional)
            - name: DESTINATION_IPS
              value: ""

        probe:
          - name: "latency-threshold"
            type: "promProbe"
            promProbe/inputs:
              endpoint: "http://prometheus.monitoring:9090"
              query: "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[1m]))"
              comparator:
                type: "float"
                criteria: "<="
                value: "2.0"
            mode: "Edge"
            runProperties:
              probeTimeout: 10
              interval: 5
```

**CPU Stress Experiment:**

```yaml
# cpu-stress-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: api-cpu-stress
  namespace: production
spec:
  appinfo:
    appns: production
    applabel: "app=api-service"
    appkind: deployment

  engineState: "active"
  chaosServiceAccount: litmus-admin

  experiments:
    - name: pod-cpu-hog
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "120"

            # Number of CPU cores to stress
            - name: CPU_CORES
              value: "2"

            # CPU load percentage
            - name: CPU_LOAD
              value: "80"

            # Target container
            - name: TARGET_CONTAINER
              value: "api"

        probe:
          - name: "response-time-check"
            type: "httpProbe"
            httpProbe/inputs:
              url: "http://api-service.production.svc:8080/health"
              responseTimeout: 3000
              method:
                get:
                  criteria: "=="
                  responseCode: "200"
            mode: "Continuous"
            runProperties:
              probeTimeout: 5
              interval: 3
              retry: 3
```

### LitmusChaos Workflow

```yaml
# chaos-workflow.yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: resilience-test-workflow
  namespace: litmus
spec:
  entrypoint: resilience-tests
  serviceAccountName: argo-chaos

  templates:
    - name: resilience-tests
      steps:
        # Step 1: Verify steady state
        - - name: verify-baseline
            template: http-probe
            arguments:
              parameters:
                - name: url
                  value: "http://api-service.production:8080/health"

        # Step 2: Run pod deletion chaos
        - - name: pod-delete-chaos
            template: run-chaos
            arguments:
              parameters:
                - name: experiment
                  value: "pod-delete"

        # Step 3: Verify recovery
        - - name: verify-recovery
            template: http-probe
            arguments:
              parameters:
                - name: url
                  value: "http://api-service.production:8080/health"

        # Step 4: Run network chaos
        - - name: network-chaos
            template: run-chaos
            arguments:
              parameters:
                - name: experiment
                  value: "pod-network-latency"

        # Step 5: Final verification
        - - name: final-verification
            template: http-probe
            arguments:
              parameters:
                - name: url
                  value: "http://api-service.production:8080/health"

    - name: run-chaos
      inputs:
        parameters:
          - name: experiment
      container:
        image: litmuschaos/litmus-checker:latest
        args:
          - -experiment={{inputs.parameters.experiment}}

    - name: http-probe
      inputs:
        parameters:
          - name: url
      container:
        image: curlimages/curl:latest
        command: [sh, -c]
        args:
          - |
            for i in $(seq 1 10); do
              if curl -sf {{inputs.parameters.url}}; then
                exit 0
              fi
              sleep 5
            done
            exit 1
```

---

## Designing Chaos Experiments

Effective chaos experiments require careful planning and a scientific approach.

### Experiment Design Framework

```python
from dataclasses import dataclass, field
from typing import List, Optional, Callable
from enum import Enum
from datetime import datetime

class ExperimentPhase(Enum):
    PLANNING = "planning"
    BASELINE = "baseline"
    INJECTION = "injection"
    OBSERVATION = "observation"
    ROLLBACK = "rollback"
    ANALYSIS = "analysis"

@dataclass
class SteadyStateHypothesis:
    """Define expected steady state behavior."""
    description: str
    metrics: List[str]
    acceptable_ranges: dict
    verification_query: str

@dataclass
class ChaosAction:
    """Define a chaos action to perform."""
    name: str
    type: str  # e.g., "kill_pod", "inject_latency"
    target: str
    parameters: dict
    duration_seconds: int

@dataclass
class RollbackPlan:
    """Define how to rollback if things go wrong."""
    automatic: bool = True
    trigger_conditions: List[str] = field(default_factory=list)
    actions: List[str] = field(default_factory=list)

@dataclass
class ChaosExperiment:
    """Complete chaos experiment definition."""
    name: str
    description: str
    hypothesis: str
    steady_state: SteadyStateHypothesis
    actions: List[ChaosAction]
    rollback: RollbackPlan
    blast_radius: str
    owner: str
    reviewers: List[str] = field(default_factory=list)
    approved: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def to_runbook(self) -> str:
        """Generate a human-readable runbook."""
        return f"""
# Chaos Experiment Runbook: {self.name}

## Overview
{self.description}

## Hypothesis
{self.hypothesis}

## Steady State Definition
{self.steady_state.description}

Metrics to monitor:
{chr(10).join(f'- {m}' for m in self.steady_state.metrics)}

## Blast Radius
{self.blast_radius}

## Experiment Steps

### Pre-flight Checks
1. Verify steady state metrics are within normal ranges
2. Confirm on-call engineer is available
3. Verify rollback procedures are in place
4. Notify stakeholders in #chaos-experiments channel

### Execution
{chr(10).join(f'{i+1}. {a.name}: {a.type} on {a.target} for {a.duration_seconds}s' for i, a in enumerate(self.actions))}

### Rollback Triggers
{chr(10).join(f'- {c}' for c in self.rollback.trigger_conditions)}

### Rollback Actions
{chr(10).join(f'{i+1}. {a}' for i, a in enumerate(self.rollback.actions))}

## Owner
{self.owner}

## Approvers
{', '.join(self.reviewers)}
"""


class ExperimentRunner:
    """Execute chaos experiments safely."""

    def __init__(self):
        self.current_phase = None
        self.metrics_collector = None
        self.rollback_triggered = False

    def run_experiment(self, experiment: ChaosExperiment) -> dict:
        """Execute a chaos experiment with safety controls."""
        results = {
            "experiment": experiment.name,
            "started_at": datetime.now().isoformat(),
            "phases": []
        }

        try:
            # Phase 1: Baseline
            self.current_phase = ExperimentPhase.BASELINE
            baseline = self._capture_baseline(experiment.steady_state)
            results["phases"].append({
                "phase": "baseline",
                "metrics": baseline,
                "status": "completed"
            })

            # Verify baseline is healthy
            if not self._verify_steady_state(experiment.steady_state, baseline):
                return {
                    **results,
                    "status": "aborted",
                    "reason": "Baseline steady state verification failed"
                }

            # Phase 2: Injection
            self.current_phase = ExperimentPhase.INJECTION
            for action in experiment.actions:
                action_result = self._execute_action(action)
                results["phases"].append({
                    "phase": "injection",
                    "action": action.name,
                    "result": action_result
                })

                # Monitor during injection
                if self._should_rollback(experiment):
                    raise RollbackTriggered("Safety threshold exceeded")

            # Phase 3: Observation
            self.current_phase = ExperimentPhase.OBSERVATION
            post_injection = self._capture_baseline(experiment.steady_state)
            results["phases"].append({
                "phase": "observation",
                "metrics": post_injection,
                "status": "completed"
            })

            # Phase 4: Analysis
            self.current_phase = ExperimentPhase.ANALYSIS
            analysis = self._analyze_results(baseline, post_injection, experiment)
            results["analysis"] = analysis
            results["hypothesis_validated"] = analysis["steady_state_maintained"]

        except RollbackTriggered as e:
            self.current_phase = ExperimentPhase.ROLLBACK
            rollback_result = self._execute_rollback(experiment.rollback)
            results["phases"].append({
                "phase": "rollback",
                "triggered_by": str(e),
                "result": rollback_result
            })
            results["status"] = "rolled_back"

        except Exception as e:
            results["status"] = "failed"
            results["error"] = str(e)
            self._execute_rollback(experiment.rollback)

        results["completed_at"] = datetime.now().isoformat()
        return results

    def _capture_baseline(self, steady_state: SteadyStateHypothesis) -> dict:
        """Capture current metric values."""
        # Implementation would query actual metrics
        return {}

    def _verify_steady_state(
        self,
        steady_state: SteadyStateHypothesis,
        metrics: dict
    ) -> bool:
        """Verify metrics are within acceptable ranges."""
        for metric, value in metrics.items():
            if metric in steady_state.acceptable_ranges:
                range_def = steady_state.acceptable_ranges[metric]
                if not (range_def["min"] <= value <= range_def["max"]):
                    return False
        return True

    def _execute_action(self, action: ChaosAction) -> dict:
        """Execute a chaos action."""
        # Implementation would perform actual chaos injection
        return {"status": "executed", "action": action.name}

    def _should_rollback(self, experiment: ChaosExperiment) -> bool:
        """Check if rollback should be triggered."""
        # Implementation would check current metrics against thresholds
        return False

    def _execute_rollback(self, rollback: RollbackPlan) -> dict:
        """Execute rollback procedures."""
        results = []
        for action in rollback.actions:
            results.append({"action": action, "status": "completed"})
        return {"actions": results}

    def _analyze_results(
        self,
        baseline: dict,
        post_injection: dict,
        experiment: ChaosExperiment
    ) -> dict:
        """Analyze experiment results."""
        return {
            "baseline_metrics": baseline,
            "post_injection_metrics": post_injection,
            "steady_state_maintained": True,
            "findings": []
        }


class RollbackTriggered(Exception):
    """Exception raised when rollback is triggered."""
    pass
```

### Experiment Categories

**Availability Experiments:**

```yaml
# availability-experiments.yaml
experiments:
  - name: "Single Instance Failure"
    description: "Validate service survives loss of one instance"
    type: "availability"
    actions:
      - type: "terminate_instance"
        target: "random"
        count: 1
    expected_impact: "None - other instances handle traffic"
    recovery_time: "< 30 seconds"

  - name: "Multiple Instance Failure"
    description: "Validate service survives loss of 50% instances"
    type: "availability"
    actions:
      - type: "terminate_instance"
        target: "random"
        percentage: 50
    expected_impact: "Temporary latency increase"
    recovery_time: "< 2 minutes"

  - name: "Availability Zone Failure"
    description: "Validate service survives AZ outage"
    type: "availability"
    actions:
      - type: "network_partition"
        target: "availability_zone"
        zone: "us-east-1a"
    expected_impact: "Brief traffic rerouting"
    recovery_time: "< 1 minute"
```

**Latency Experiments:**

```yaml
# latency-experiments.yaml
experiments:
  - name: "Database Latency"
    description: "Validate service handles slow database"
    type: "latency"
    actions:
      - type: "inject_latency"
        target: "database_connection"
        latency_ms: 500
        duration_seconds: 300
    expected_impact: "Increased response times, circuit breaker may trigger"

  - name: "External API Latency"
    description: "Validate service handles slow third-party API"
    type: "latency"
    actions:
      - type: "inject_latency"
        target: "payment_api"
        latency_ms: 2000
        duration_seconds: 120
    expected_impact: "Timeout errors, fallback behavior activated"

  - name: "Network Latency"
    description: "Validate service handles network degradation"
    type: "latency"
    actions:
      - type: "network_delay"
        target: "all_traffic"
        latency_ms: 100
        jitter_ms: 50
    expected_impact: "Slight performance degradation"
```

---

## Blast Radius Control

Controlling blast radius is essential for safe chaos engineering. The goal is to learn from failures without causing significant user impact.

### Blast Radius Strategies

```python
from enum import Enum
from dataclasses import dataclass
from typing import List, Optional

class BlastRadiusLevel(Enum):
    """Levels of blast radius from safest to most risky."""
    DEVELOPMENT = 1      # Dev environment only
    STAGING = 2          # Staging environment
    CANARY = 3           # Small production subset
    PERCENTAGE = 4       # Configurable production percentage
    REGION = 5           # Single region
    GLOBAL = 6           # Full production

@dataclass
class TargetSelector:
    """Define what infrastructure to target."""
    namespace: Optional[str] = None
    labels: dict = None
    percentage: float = 5.0
    max_targets: int = 1
    exclude_patterns: List[str] = None

@dataclass
class BlastRadiusControl:
    """Control experiment blast radius."""
    level: BlastRadiusLevel
    target_selector: TargetSelector
    geographic_scope: List[str] = None
    customer_segments_excluded: List[str] = None
    time_limit_seconds: int = 300
    abort_on_error_rate: float = 0.05

class BlastRadiusManager:
    """Manage and enforce blast radius controls."""

    def __init__(self, default_limits: dict = None):
        self.default_limits = default_limits or {
            BlastRadiusLevel.DEVELOPMENT: {"percentage": 100, "max_targets": None},
            BlastRadiusLevel.STAGING: {"percentage": 100, "max_targets": None},
            BlastRadiusLevel.CANARY: {"percentage": 1, "max_targets": 3},
            BlastRadiusLevel.PERCENTAGE: {"percentage": 10, "max_targets": 10},
            BlastRadiusLevel.REGION: {"percentage": 100, "max_targets": None},
            BlastRadiusLevel.GLOBAL: {"percentage": 5, "max_targets": 20}
        }

    def validate_experiment(
        self,
        control: BlastRadiusControl,
        team_approval_level: BlastRadiusLevel
    ) -> dict:
        """Validate experiment against blast radius policies."""
        issues = []

        # Check if team has approval for this level
        if control.level.value > team_approval_level.value:
            issues.append(
                f"Team not approved for {control.level.name} experiments"
            )

        # Check percentage limits
        limits = self.default_limits[control.level]
        if (control.target_selector.percentage >
                limits.get("percentage", 100)):
            issues.append(
                f"Percentage {control.target_selector.percentage}% exceeds "
                f"limit of {limits['percentage']}% for {control.level.name}"
            )

        # Check max targets
        if limits.get("max_targets"):
            if control.target_selector.max_targets > limits["max_targets"]:
                issues.append(
                    f"Max targets {control.target_selector.max_targets} exceeds "
                    f"limit of {limits['max_targets']} for {control.level.name}"
                )

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "recommendations": self._get_recommendations(control, issues)
        }

    def _get_recommendations(
        self,
        control: BlastRadiusControl,
        issues: List[str]
    ) -> List[str]:
        """Provide recommendations for fixing issues."""
        recommendations = []

        if control.level.value >= BlastRadiusLevel.PERCENTAGE.value:
            recommendations.append(
                "Consider starting with CANARY level before scaling up"
            )

        if control.target_selector.percentage > 5:
            recommendations.append(
                "Reduce target percentage to 5% or less for first run"
            )

        if control.time_limit_seconds > 300:
            recommendations.append(
                "Reduce time limit to 5 minutes for initial experiments"
            )

        return recommendations

    def calculate_affected_users(
        self,
        control: BlastRadiusControl,
        total_traffic: int
    ) -> dict:
        """Estimate user impact of experiment."""
        affected_percentage = control.target_selector.percentage / 100
        affected_users = int(total_traffic * affected_percentage)

        return {
            "total_traffic": total_traffic,
            "affected_users": affected_users,
            "affected_percentage": control.target_selector.percentage,
            "max_duration_seconds": control.time_limit_seconds,
            "max_user_minutes_affected": (
                affected_users * control.time_limit_seconds / 60
            )
        }
```

### Progressive Blast Radius Expansion

```python
from typing import Callable
import time

class ProgressiveBlastRadius:
    """Gradually expand blast radius based on results."""

    def __init__(
        self,
        initial_percentage: float = 1.0,
        max_percentage: float = 25.0,
        step_size: float = 2.0,
        observation_period_seconds: int = 60,
        success_criteria: Callable[[], bool] = None
    ):
        self.current_percentage = initial_percentage
        self.max_percentage = max_percentage
        self.step_size = step_size
        self.observation_period = observation_period_seconds
        self.success_criteria = success_criteria or (lambda: True)
        self.expansion_history = []

    def should_expand(self) -> bool:
        """Determine if blast radius should be expanded."""
        if self.current_percentage >= self.max_percentage:
            return False

        return self.success_criteria()

    def expand(self) -> dict:
        """Expand blast radius by one step."""
        previous = self.current_percentage
        self.current_percentage = min(
            self.current_percentage * self.step_size,
            self.max_percentage
        )

        result = {
            "previous_percentage": previous,
            "new_percentage": self.current_percentage,
            "at_maximum": self.current_percentage >= self.max_percentage
        }

        self.expansion_history.append(result)
        return result

    def run_progressive_experiment(
        self,
        inject_chaos: Callable[[float], None],
        check_health: Callable[[], bool]
    ) -> dict:
        """Run experiment with progressive blast radius expansion."""
        results = {
            "started_at": time.time(),
            "stages": [],
            "final_percentage": 0,
            "success": True
        }

        while self.current_percentage <= self.max_percentage:
            stage_result = {
                "percentage": self.current_percentage,
                "started_at": time.time()
            }

            # Inject chaos at current level
            inject_chaos(self.current_percentage)

            # Observe for configured period
            time.sleep(self.observation_period)

            # Check health
            if not check_health():
                stage_result["healthy"] = False
                results["stages"].append(stage_result)
                results["success"] = False
                results["final_percentage"] = self.current_percentage
                break

            stage_result["healthy"] = True
            results["stages"].append(stage_result)

            # Try to expand
            if self.should_expand():
                self.expand()
            else:
                break

        results["final_percentage"] = self.current_percentage
        results["completed_at"] = time.time()
        return results
```

---

## Implementing Chaos Engineering Safely

Safety is paramount in chaos engineering. A well-designed safety system prevents experiments from causing real outages.

### Safety Controls Framework

```python
from dataclasses import dataclass, field
from typing import List, Callable, Optional
from datetime import datetime, timedelta
from enum import Enum
import threading

class SafetyLevel(Enum):
    """Safety levels for chaos experiments."""
    STRICT = "strict"      # Maximum safety, abort on any anomaly
    NORMAL = "normal"      # Standard safety controls
    RELAXED = "relaxed"    # Reduced controls for experienced teams

@dataclass
class SafetyCheck:
    """Define a safety check to run before/during experiments."""
    name: str
    check_function: Callable[[], bool]
    is_blocking: bool = True
    check_interval_seconds: int = 10

@dataclass
class SafetyConfig:
    """Configuration for experiment safety controls."""
    level: SafetyLevel = SafetyLevel.NORMAL
    max_error_rate: float = 0.05
    max_latency_ms: float = 5000
    min_healthy_instances: int = 2
    auto_rollback: bool = True
    manual_approval_required: bool = False
    allowed_hours: tuple = (9, 17)
    allowed_days: tuple = (0, 1, 2, 3, 4)  # Monday-Friday
    emergency_contacts: List[str] = field(default_factory=list)

class SafetyController:
    """Control safety aspects of chaos experiments."""

    def __init__(self, config: SafetyConfig):
        self.config = config
        self.safety_checks: List[SafetyCheck] = []
        self.is_experiment_active = False
        self.abort_requested = False
        self._monitor_thread: Optional[threading.Thread] = None

    def add_check(self, check: SafetyCheck) -> None:
        """Add a safety check."""
        self.safety_checks.append(check)

    def pre_flight_checks(self) -> dict:
        """Run all pre-flight safety checks."""
        results = {
            "passed": True,
            "checks": [],
            "blocking_failures": []
        }

        # Check allowed time
        now = datetime.now()
        if now.weekday() not in self.config.allowed_days:
            results["passed"] = False
            results["blocking_failures"].append(
                f"Experiments not allowed on {now.strftime('%A')}"
            )

        if not (self.config.allowed_hours[0]
                <= now.hour
                < self.config.allowed_hours[1]):
            results["passed"] = False
            results["blocking_failures"].append(
                f"Experiments only allowed between "
                f"{self.config.allowed_hours[0]}:00 and "
                f"{self.config.allowed_hours[1]}:00"
            )

        # Run custom checks
        for check in self.safety_checks:
            try:
                passed = check.check_function()
                results["checks"].append({
                    "name": check.name,
                    "passed": passed,
                    "blocking": check.is_blocking
                })

                if not passed and check.is_blocking:
                    results["passed"] = False
                    results["blocking_failures"].append(
                        f"Safety check failed: {check.name}"
                    )
            except Exception as e:
                results["checks"].append({
                    "name": check.name,
                    "passed": False,
                    "error": str(e)
                })
                if check.is_blocking:
                    results["passed"] = False
                    results["blocking_failures"].append(
                        f"Safety check error: {check.name} - {str(e)}"
                    )

        return results

    def start_monitoring(
        self,
        get_error_rate: Callable[[], float],
        get_latency: Callable[[], float],
        get_healthy_instances: Callable[[], int],
        on_abort: Callable[[], None]
    ) -> None:
        """Start continuous safety monitoring."""
        self.is_experiment_active = True
        self.abort_requested = False

        def monitor():
            while self.is_experiment_active and not self.abort_requested:
                try:
                    error_rate = get_error_rate()
                    latency = get_latency()
                    healthy = get_healthy_instances()

                    should_abort = False
                    abort_reason = None

                    if error_rate > self.config.max_error_rate:
                        should_abort = True
                        abort_reason = (
                            f"Error rate {error_rate:.2%} exceeds threshold "
                            f"{self.config.max_error_rate:.2%}"
                        )

                    if latency > self.config.max_latency_ms:
                        should_abort = True
                        abort_reason = (
                            f"Latency {latency}ms exceeds threshold "
                            f"{self.config.max_latency_ms}ms"
                        )

                    if healthy < self.config.min_healthy_instances:
                        should_abort = True
                        abort_reason = (
                            f"Only {healthy} healthy instances, "
                            f"minimum is {self.config.min_healthy_instances}"
                        )

                    if should_abort and self.config.auto_rollback:
                        self.abort_requested = True
                        on_abort()

                except Exception:
                    pass  # Log but continue monitoring

                time.sleep(5)  # Check every 5 seconds

        self._monitor_thread = threading.Thread(target=monitor, daemon=True)
        self._monitor_thread.start()

    def stop_monitoring(self) -> None:
        """Stop safety monitoring."""
        self.is_experiment_active = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=10)

    def request_abort(self, reason: str) -> None:
        """Request immediate experiment abort."""
        self.abort_requested = True
```

### Kill Switch Implementation

```python
import signal
import sys
from typing import Callable, Optional
import redis

class KillSwitch:
    """Emergency kill switch for chaos experiments."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        kill_switch_key: str = "chaos:kill_switch"
    ):
        self.redis_client = redis_client
        self.kill_switch_key = kill_switch_key
        self.cleanup_callbacks: List[Callable] = []
        self._setup_signal_handlers()

    def _setup_signal_handlers(self) -> None:
        """Setup handlers for SIGTERM and SIGINT."""
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)

    def _signal_handler(self, signum, frame) -> None:
        """Handle kill signals."""
        self.trigger("Signal received: " + str(signum))
        sys.exit(1)

    def register_cleanup(self, callback: Callable) -> None:
        """Register a cleanup callback."""
        self.cleanup_callbacks.append(callback)

    def check(self) -> bool:
        """Check if kill switch is activated."""
        if self.redis_client:
            return bool(self.redis_client.get(self.kill_switch_key))
        return False

    def trigger(self, reason: str = "Manual trigger") -> None:
        """Activate kill switch and run all cleanup."""
        if self.redis_client:
            self.redis_client.set(
                self.kill_switch_key,
                reason,
                ex=3600  # Expire after 1 hour
            )

        for callback in self.cleanup_callbacks:
            try:
                callback()
            except Exception:
                pass  # Best effort cleanup

    def reset(self) -> None:
        """Reset the kill switch."""
        if self.redis_client:
            self.redis_client.delete(self.kill_switch_key)


class GradualRollback:
    """Implement gradual rollback of chaos injection."""

    def __init__(self):
        self.active_injections = []

    def register_injection(
        self,
        name: str,
        rollback_function: Callable
    ) -> None:
        """Register an active injection for rollback."""
        self.active_injections.append({
            "name": name,
            "rollback": rollback_function,
            "rolled_back": False
        })

    def rollback_all(self, gradual: bool = True) -> List[dict]:
        """Rollback all active injections."""
        results = []

        for injection in reversed(self.active_injections):
            if injection["rolled_back"]:
                continue

            try:
                injection["rollback"]()
                injection["rolled_back"] = True
                results.append({
                    "name": injection["name"],
                    "status": "rolled_back"
                })
            except Exception as e:
                results.append({
                    "name": injection["name"],
                    "status": "failed",
                    "error": str(e)
                })

            if gradual:
                time.sleep(5)  # Wait between rollbacks

        return results
```

### Pre-Experiment Checklist

```python
from dataclasses import dataclass
from typing import List

@dataclass
class ChecklistItem:
    """Single item in pre-experiment checklist."""
    category: str
    item: str
    verified: bool = False
    verified_by: str = None
    notes: str = None

class PreExperimentChecklist:
    """Comprehensive pre-experiment checklist."""

    def __init__(self):
        self.items: List[ChecklistItem] = []
        self._initialize_standard_items()

    def _initialize_standard_items(self) -> None:
        """Initialize standard checklist items."""
        standard_items = [
            # Technical Readiness
            ("Technical", "Monitoring dashboards are visible and accessible"),
            ("Technical", "Alerting is configured and tested"),
            ("Technical", "Rollback procedures are documented and tested"),
            ("Technical", "Kill switch is operational"),
            ("Technical", "Baseline metrics have been captured"),

            # Team Readiness
            ("Team", "On-call engineer is aware of experiment"),
            ("Team", "Incident commander identified"),
            ("Team", "Communication channel established"),
            ("Team", "Escalation path is clear"),

            # Approval
            ("Approval", "Experiment design reviewed"),
            ("Approval", "Blast radius approved"),
            ("Approval", "Stakeholders notified"),

            # Safety
            ("Safety", "Experiment scheduled during business hours"),
            ("Safety", "No conflicting deployments or experiments"),
            ("Safety", "Customer impact assessment completed"),
            ("Safety", "Error budget checked - sufficient remaining"),

            # Environment
            ("Environment", "Target environment confirmed"),
            ("Environment", "Dependencies are healthy"),
            ("Environment", "Sufficient capacity exists"),
        ]

        for category, item in standard_items:
            self.items.append(ChecklistItem(category=category, item=item))

    def verify_item(
        self,
        item_index: int,
        verified_by: str,
        notes: str = None
    ) -> None:
        """Mark an item as verified."""
        if 0 <= item_index < len(self.items):
            self.items[item_index].verified = True
            self.items[item_index].verified_by = verified_by
            self.items[item_index].notes = notes

    def is_complete(self) -> bool:
        """Check if all items are verified."""
        return all(item.verified for item in self.items)

    def get_pending_items(self) -> List[ChecklistItem]:
        """Get items that haven't been verified."""
        return [item for item in self.items if not item.verified]

    def generate_report(self) -> str:
        """Generate a checklist completion report."""
        report = ["# Pre-Experiment Checklist Report\n"]

        categories = set(item.category for item in self.items)

        for category in sorted(categories):
            report.append(f"\n## {category}\n")
            category_items = [i for i in self.items if i.category == category]

            for item in category_items:
                status = "[x]" if item.verified else "[ ]"
                report.append(f"- {status} {item.item}")
                if item.verified_by:
                    report.append(f"  - Verified by: {item.verified_by}")
                if item.notes:
                    report.append(f"  - Notes: {item.notes}")

        pending = self.get_pending_items()
        report.append(f"\n## Summary")
        report.append(f"- Total items: {len(self.items)}")
        report.append(f"- Verified: {len(self.items) - len(pending)}")
        report.append(f"- Pending: {len(pending)}")
        report.append(f"- Ready to proceed: {'Yes' if self.is_complete() else 'No'}")

        return "\n".join(report)
```

---

## Interview Key Points

### Core Concepts

**1. What is Chaos Engineering and why is it important?**

Chaos Engineering is the practice of deliberately injecting failures into systems to identify weaknesses before they cause real outages. It is important because:
- Modern distributed systems are inherently complex and unpredictable
- Traditional testing cannot anticipate all failure modes
- It builds confidence that systems can withstand turbulent conditions
- It shifts the discovery of weaknesses from production incidents to controlled experiments

**2. Explain the five principles of Chaos Engineering.**

1. **Build a hypothesis around steady state**: Define measurable indicators of normal system behavior
2. **Vary real-world events**: Simulate realistic failure scenarios
3. **Run experiments in production**: Production provides the most accurate results
4. **Automate experiments to run continuously**: Catch regressions and validate improvements
5. **Minimize blast radius**: Start small and increase scope gradually

**3. What is blast radius and how do you control it?**

Blast radius is the scope of potential impact from a chaos experiment. Control strategies include:
- Starting in non-production environments
- Targeting a small percentage of traffic/instances
- Implementing automatic rollback
- Setting strict time limits
- Having kill switches readily available
- Progressively expanding scope based on results

### Practical Scenarios

**1. How would you design a chaos experiment for a new microservice?**

```
1. Understand the service architecture and dependencies
2. Identify critical user journeys the service supports
3. Define steady state metrics (latency, error rate, throughput)
4. Start with single instance failure experiments
5. Progress to dependency failures (database, cache, APIs)
6. Test network conditions (latency, packet loss)
7. Validate circuit breakers and fallback mechanisms
8. Document findings and create runbooks
```

**2. An experiment caused an unexpected outage. What do you do?**

```
1. Immediately trigger the kill switch
2. Execute rollback procedures
3. Verify service recovery
4. Conduct blameless postmortem
5. Identify what safety controls failed
6. Update blast radius limits and safety checks
7. Improve monitoring and alerting
8. Share learnings with the team
```

**3. How do you measure the success of a chaos engineering program?**

- Mean Time to Recovery (MTTR) improvement
- Reduction in production incidents
- Number of weaknesses identified proactively
- Team confidence in system resilience
- Improved runbook coverage
- Faster incident response times

---

## Summary

Chaos Engineering transforms how organizations think about system reliability. Instead of hoping systems will survive failures, teams proactively validate resilience through controlled experiments.

**Key Takeaways:**

1. **Start with steady state**: Always define what "normal" looks like before injecting chaos.

2. **Minimize blast radius**: Begin small and expand gradually. The goal is learning, not causing outages.

3. **Automate safety controls**: Kill switches, automatic rollback, and continuous monitoring are essential.

4. **Run in production carefully**: Production experiments provide the best insights but require mature safety practices.

5. **Learn from every experiment**: Whether the system survives or fails, document findings and improve.

6. **Build a culture of resilience**: Chaos engineering is as much about mindset as it is about tools.

**Implementation Roadmap:**

1. Start with game days - manual, infrequent chaos sessions
2. Implement basic fault injection in staging
3. Add safety controls and monitoring
4. Graduate to automated experiments in production canary
5. Expand blast radius progressively
6. Integrate chaos experiments into CI/CD pipelines
7. Build a chaos engineering platform for self-service

Chaos Engineering is not about breaking things randomly - it is about systematically building confidence in your system's ability to withstand the inevitable failures that will occur in production.
