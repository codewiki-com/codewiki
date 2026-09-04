---
title: Site Reliability Engineering (SRE) Guide
description: Master SRE practices for reliable production systems
track: devops
section: observability
difficulty: advanced
tags:
  - SRE
  - Reliability
  - SLO
  - On-call
status: imported
origin: old/src/content/docs/devops/sre.en.md
divergence: 0.205
issues: []
legacy:
  category: DevOps
  subcategory: Operations
  order: 23
  lastUpdated: 2026-01-07
---

## What is Site Reliability Engineering?

Site Reliability Engineering (SRE) is a discipline that applies software engineering principles to infrastructure and operations problems. Originated at Google in 2003 by Ben Treynor Sloss, SRE aims to create scalable and highly reliable software systems. As Treynor famously stated, "SRE is what happens when you ask a software engineer to design an operations team."

SRE represents a fundamental shift from traditional operations: instead of manually managing systems, SRE teams automate operations tasks, treat infrastructure as code, and apply engineering rigor to reliability challenges. The core philosophy balances the tension between releasing new features (velocity) and maintaining system stability (reliability).

### SRE vs Traditional Operations

| Aspect | Traditional Ops | SRE |
|--------|-----------------|-----|
| Primary Focus | Stability at all costs | Balance velocity and reliability |
| Automation | Manual processes common | Automate everything possible |
| Error Approach | Avoid all errors | Use error budgets strategically |
| Scaling | Linear with load | Sublinear through engineering |
| Incident Response | Reactive firefighting | Proactive prevention and learning |
| Metrics | Uptime percentage | SLIs, SLOs, and error budgets |

### Core SRE Principles

1. **Embracing Risk**: Acknowledge that 100% reliability is neither achievable nor desirable. Define acceptable risk levels through SLOs.

2. **Service Level Objectives**: Establish clear, measurable targets for system behavior that align with user expectations.

3. **Eliminating Toil**: Reduce manual, repetitive work through automation, freeing engineers for creative problem-solving.

4. **Monitoring and Observability**: Implement comprehensive monitoring to understand system behavior and detect issues proactively.

5. **Automation**: Build systems that can heal themselves and reduce operational burden.

6. **Release Engineering**: Implement safe, reliable, and frequent release processes.

7. **Simplicity**: Design systems that are easy to understand, operate, and debug.

---

## SLI, SLO, and SLA: The Reliability Hierarchy

Understanding the relationship between Service Level Indicators (SLIs), Service Level Objectives (SLOs), and Service Level Agreements (SLAs) is fundamental to SRE practice.

### Service Level Indicators (SLIs)

SLIs are quantitative measures of service behavior. They answer the question: "How well is our service performing right now?"

**Common SLI Categories:**

| Category | Description | Example Metrics |
|----------|-------------|-----------------|
| Availability | Service is accessible and functional | Successful requests / Total requests |
| Latency | Response time for requests | P50, P95, P99 response times |
| Throughput | Rate of successful operations | Requests per second |
| Error Rate | Proportion of failed requests | Failed requests / Total requests |
| Durability | Data preservation over time | Data loss incidents per year |
| Freshness | Data recency | Time since last successful update |

**Defining Good SLIs:**

```python
# Example: Availability SLI calculation
def calculate_availability_sli(successful_requests: int, total_requests: int) -> float:
    """
    Calculate availability SLI as a ratio.

    Args:
        successful_requests: Number of requests that succeeded (HTTP 2xx, 3xx)
        total_requests: Total number of requests received

    Returns:
        Availability ratio between 0.0 and 1.0
    """
    if total_requests == 0:
        return 1.0  # No requests means no failures
    return successful_requests / total_requests

# Example: Latency SLI calculation
def calculate_latency_sli(
    requests_under_threshold: int,
    total_requests: int,
    threshold_ms: int = 300
) -> float:
    """
    Calculate latency SLI as proportion of requests under threshold.

    Args:
        requests_under_threshold: Requests completing under threshold_ms
        total_requests: Total number of requests
        threshold_ms: Latency threshold in milliseconds

    Returns:
        Proportion of requests meeting latency target
    """
    if total_requests == 0:
        return 1.0
    return requests_under_threshold / total_requests
```

**Prometheus SLI Metrics:**

```yaml
# Prometheus recording rules for SLI calculation
groups:
  - name: sli_recording_rules
    interval: 30s
    rules:
      # Availability SLI: proportion of successful HTTP requests
      - record: sli:availability:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{status=~"2..|3.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
        labels:
          sli: availability

      # Latency SLI: proportion of requests under 300ms
      - record: sli:latency:ratio_rate5m
        expr: |
          sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m]))
          /
          sum(rate(http_request_duration_seconds_count[5m]))
        labels:
          sli: latency

      # Error rate SLI
      - record: sli:error_rate:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
        labels:
          sli: error_rate
```

### Service Level Objectives (SLOs)

SLOs are target values for SLIs over a specific time period. They define "good enough" performance and represent the promise to users.

**SLO Design Principles:**

1. **User-Centric**: SLOs should reflect what users actually care about
2. **Achievable**: Set targets that are realistic given system architecture
3. **Measurable**: Must be quantifiable with existing or implementable metrics
4. **Meaningful**: Should correlate with user happiness

**Example SLO Specification:**

```yaml
# SLO specification document
apiVersion: sloth.slok.dev/v1
kind: PrometheusServiceLevel
metadata:
  name: api-service-slos
  namespace: production
spec:
  service: api-service
  labels:
    team: platform
    tier: critical
  slos:
    # Availability SLO
    - name: availability
      objective: 99.9  # 99.9% target
      description: "API should be available 99.9% of the time"
      sli:
        events:
          errorQuery: sum(rate(http_requests_total{status=~"5.."}[{{.window}}]))
          totalQuery: sum(rate(http_requests_total[{{.window}}]))
      alerting:
        name: HighErrorRate
        labels:
          severity: critical
        annotations:
          summary: "API availability below SLO target"
        pageAlert:
          labels:
            severity: page
        ticketAlert:
          labels:
            severity: ticket

    # Latency SLO
    - name: latency_p99
      objective: 99.0  # 99% of requests under 500ms
      description: "99% of requests should complete within 500ms"
      sli:
        events:
          errorQuery: |
            sum(rate(http_request_duration_seconds_count[{{.window}}]))
            -
            sum(rate(http_request_duration_seconds_bucket{le="0.5"}[{{.window}}]))
          totalQuery: sum(rate(http_request_duration_seconds_count[{{.window}}]))
```

**SLO Calculation in Code:**

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional
import statistics

@dataclass
class SLOConfig:
    """Configuration for an SLO."""
    name: str
    target: float  # e.g., 0.999 for 99.9%
    window_days: int  # Rolling window in days
    sli_type: str  # 'availability', 'latency', 'error_rate'

@dataclass
class SLIDataPoint:
    """Single SLI measurement."""
    timestamp: datetime
    good_events: int
    total_events: int

class SLOTracker:
    """Track SLO compliance over time."""

    def __init__(self, config: SLOConfig):
        self.config = config
        self.data_points: List[SLIDataPoint] = []

    def add_measurement(self, good_events: int, total_events: int) -> None:
        """Record a new SLI measurement."""
        self.data_points.append(SLIDataPoint(
            timestamp=datetime.now(),
            good_events=good_events,
            total_events=total_events
        ))
        self._cleanup_old_data()

    def _cleanup_old_data(self) -> None:
        """Remove data points outside the SLO window."""
        cutoff = datetime.now() - timedelta(days=self.config.window_days)
        self.data_points = [
            dp for dp in self.data_points
            if dp.timestamp > cutoff
        ]

    def current_sli(self) -> float:
        """Calculate current SLI value over the window."""
        if not self.data_points:
            return 1.0

        total_good = sum(dp.good_events for dp in self.data_points)
        total_events = sum(dp.total_events for dp in self.data_points)

        if total_events == 0:
            return 1.0
        return total_good / total_events

    def is_meeting_slo(self) -> bool:
        """Check if currently meeting the SLO target."""
        return self.current_sli() >= self.config.target

    def remaining_error_budget(self) -> float:
        """
        Calculate remaining error budget as a percentage.

        Returns:
            Percentage of error budget remaining (can be negative)
        """
        allowed_bad_ratio = 1.0 - self.config.target
        actual_bad_ratio = 1.0 - self.current_sli()

        if allowed_bad_ratio == 0:
            return 0.0 if actual_bad_ratio > 0 else 100.0

        consumed = actual_bad_ratio / allowed_bad_ratio
        return (1.0 - consumed) * 100

# Usage example
availability_slo = SLOTracker(SLOConfig(
    name="api-availability",
    target=0.999,  # 99.9%
    window_days=30,
    sli_type="availability"
))

# Record measurements
availability_slo.add_measurement(good_events=9990, total_events=10000)
print(f"Current SLI: {availability_slo.current_sli():.4f}")
print(f"Meeting SLO: {availability_slo.is_meeting_slo()}")
print(f"Error Budget Remaining: {availability_slo.remaining_error_budget():.1f}%")
```

### Service Level Agreements (SLAs)

SLAs are contractual obligations between service providers and customers. They typically include SLOs plus consequences for not meeting them.

**SLA vs SLO Relationship:**

- **SLO**: Internal engineering target (e.g., 99.95% availability)
- **SLA**: External customer promise (e.g., 99.9% availability with credits)

The gap between SLO and SLA provides a safety buffer. If your SLO is stricter than your SLA, you have time to react before breaching customer commitments.

```
SLO Target (99.95%) > SLA Commitment (99.9%)
     ^                      ^
     |                      |
  Internal              External
  Engineering           Customer
  Goal                  Promise
```

**SLA Calculation Example:**

```python
@dataclass
class SLACredits:
    """Define SLA credit tiers."""
    availability_threshold: float
    credit_percentage: float
    description: str

class SLAManager:
    """Manage SLA compliance and credits."""

    CREDIT_TIERS = [
        SLACredits(0.999, 0, "No credits - SLA met"),
        SLACredits(0.995, 10, "10% credit for 99.5-99.9%"),
        SLACredits(0.990, 25, "25% credit for 99.0-99.5%"),
        SLACredits(0.950, 50, "50% credit for 95.0-99.0%"),
        SLACredits(0.0, 100, "100% credit for below 95%"),
    ]

    def calculate_credit(self, actual_availability: float) -> SLACredits:
        """Determine credit owed based on availability."""
        for tier in self.CREDIT_TIERS:
            if actual_availability >= tier.availability_threshold:
                return tier
        return self.CREDIT_TIERS[-1]

    def monthly_report(
        self,
        availability: float,
        monthly_revenue: float
    ) -> dict:
        """Generate monthly SLA compliance report."""
        credit_tier = self.calculate_credit(availability)
        credit_amount = monthly_revenue * (credit_tier.credit_percentage / 100)

        return {
            "availability": f"{availability * 100:.3f}%",
            "sla_met": availability >= 0.999,
            "credit_percentage": credit_tier.credit_percentage,
            "credit_amount": credit_amount,
            "description": credit_tier.description
        }
```

---

## Error Budgets: Balancing Reliability and Velocity

Error budgets are the mathematical foundation of SRE's approach to balancing reliability with feature development velocity. The concept is simple: if your SLO allows 0.1% errors, that 0.1% is your error budget to "spend" on releases, experiments, and planned risks.

### Understanding Error Budgets

**The Math:**

```
Error Budget = 100% - SLO Target

For 99.9% availability SLO:
Error Budget = 100% - 99.9% = 0.1%

In a 30-day month (43,200 minutes):
Allowed Downtime = 43,200 * 0.001 = 43.2 minutes
```

**Error Budget Policy:**

```python
from enum import Enum
from typing import Optional

class ReleasePolicy(Enum):
    FULL_SPEED = "full_speed"      # Normal release cadence
    CAUTIOUS = "cautious"           # Reduced release frequency
    FREEZE = "freeze"               # No new releases
    EMERGENCY_ONLY = "emergency"    # Only critical fixes

@dataclass
class ErrorBudgetPolicy:
    """Define policies based on error budget consumption."""

    def determine_release_policy(
        self,
        budget_remaining_percent: float
    ) -> ReleasePolicy:
        """
        Determine release policy based on remaining error budget.

        Args:
            budget_remaining_percent: Percentage of budget remaining (0-100)

        Returns:
            Appropriate release policy
        """
        if budget_remaining_percent >= 50:
            return ReleasePolicy.FULL_SPEED
        elif budget_remaining_percent >= 25:
            return ReleasePolicy.CAUTIOUS
        elif budget_remaining_percent >= 0:
            return ReleasePolicy.FREEZE
        else:
            return ReleasePolicy.EMERGENCY_ONLY

    def get_policy_actions(self, policy: ReleasePolicy) -> dict:
        """Get specific actions for each policy level."""
        actions = {
            ReleasePolicy.FULL_SPEED: {
                "releases": "Normal cadence",
                "experiments": "Allowed",
                "risky_changes": "Allowed with review",
                "on_call_load": "Normal",
            },
            ReleasePolicy.CAUTIOUS: {
                "releases": "Weekly only",
                "experiments": "Limited scope",
                "risky_changes": "Postponed",
                "on_call_load": "Increased monitoring",
            },
            ReleasePolicy.FREEZE: {
                "releases": "Bug fixes only",
                "experiments": "Stopped",
                "risky_changes": "Prohibited",
                "on_call_load": "Focus on reliability",
            },
            ReleasePolicy.EMERGENCY_ONLY: {
                "releases": "Critical security only",
                "experiments": "Stopped",
                "risky_changes": "Prohibited",
                "on_call_load": "All hands on reliability",
            },
        }
        return actions[policy]
```

### Error Budget Burn Rate

Burn rate measures how quickly you're consuming your error budget relative to the ideal consumption rate.

```python
from datetime import datetime, timedelta

class BurnRateCalculator:
    """Calculate error budget burn rates for alerting."""

    def __init__(self, slo_target: float, window_days: int = 30):
        self.slo_target = slo_target
        self.window_days = window_days
        self.error_budget = 1.0 - slo_target

    def calculate_burn_rate(
        self,
        current_error_rate: float,
        measurement_window_hours: float = 1.0
    ) -> float:
        """
        Calculate how fast the error budget is being consumed.

        A burn rate of 1.0 means consuming budget at exactly the
        sustainable rate over the SLO window.
        A burn rate of 10.0 means consuming 10x faster than sustainable.
        """
        # Sustainable error rate per hour
        hours_in_window = self.window_days * 24
        sustainable_hourly_rate = self.error_budget / hours_in_window

        if sustainable_hourly_rate == 0:
            return float('inf') if current_error_rate > 0 else 0.0

        return current_error_rate / sustainable_hourly_rate

    def time_to_exhaustion(
        self,
        current_burn_rate: float,
        budget_remaining_percent: float
    ) -> Optional[timedelta]:
        """Calculate time until error budget is exhausted."""
        if current_burn_rate <= 0:
            return None  # Not consuming budget

        # Hours until exhaustion at current rate
        total_hours = self.window_days * 24
        remaining_hours = total_hours * (budget_remaining_percent / 100)
        hours_to_exhaustion = remaining_hours / current_burn_rate

        return timedelta(hours=hours_to_exhaustion)
```

**Multi-Window Burn Rate Alerting:**

```yaml
# Prometheus alerting rules for error budget burn rate
groups:
  - name: error_budget_alerts
    rules:
      # Fast burn: 14.4x burn rate over 1 hour
      # Would exhaust 30-day budget in 2 days
      - alert: ErrorBudgetFastBurn
        expr: |
          (
            1 - (
              sum(rate(http_requests_total{status!~"5.."}[1h]))
              /
              sum(rate(http_requests_total[1h]))
            )
          ) > (14.4 * 0.001)  # 14.4 * error_budget
        for: 2m
        labels:
          severity: critical
          alert_type: burn_rate
        annotations:
          summary: "High error budget burn rate detected"
          description: |
            Error budget is being consumed at 14.4x the sustainable rate.
            At this rate, the monthly budget will be exhausted in ~2 days.

      # Slow burn: 3x burn rate over 6 hours
      # Would exhaust 30-day budget in 10 days
      - alert: ErrorBudgetSlowBurn
        expr: |
          (
            1 - (
              sum(rate(http_requests_total{status!~"5.."}[6h]))
              /
              sum(rate(http_requests_total[6h]))
            )
          ) > (3 * 0.001)  # 3 * error_budget
        for: 15m
        labels:
          severity: warning
          alert_type: burn_rate
        annotations:
          summary: "Elevated error budget consumption"
          description: |
            Error budget consumption is 3x the sustainable rate.
            Investigate trending issues before they become critical.
```

---

## On-Call and Incident Management

Effective on-call practices and incident management are crucial for maintaining system reliability while ensuring sustainable operations for engineering teams.

### On-Call Best Practices

**On-Call Structure:**

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional
from enum import Enum

class EscalationLevel(Enum):
    PRIMARY = 1
    SECONDARY = 2
    MANAGER = 3
    EXECUTIVE = 4

@dataclass
class OnCallEngineer:
    name: str
    email: str
    phone: str
    slack_id: str
    escalation_level: EscalationLevel

@dataclass
class OnCallRotation:
    """Manage on-call rotation schedule."""

    team_name: str
    rotation_length_days: int = 7
    handoff_day: str = "Monday"
    handoff_hour: int = 10  # 10 AM
    engineers: List[OnCallEngineer] = field(default_factory=list)
    current_index: int = 0

    def current_primary(self) -> OnCallEngineer:
        """Get current primary on-call engineer."""
        primaries = [e for e in self.engineers
                     if e.escalation_level == EscalationLevel.PRIMARY]
        return primaries[self.current_index % len(primaries)]

    def current_secondary(self) -> Optional[OnCallEngineer]:
        """Get current secondary on-call engineer."""
        secondaries = [e for e in self.engineers
                       if e.escalation_level == EscalationLevel.SECONDARY]
        if not secondaries:
            return None
        return secondaries[self.current_index % len(secondaries)]

    def next_handoff(self) -> datetime:
        """Calculate next rotation handoff time."""
        now = datetime.now()
        days_until_handoff = (
            ["Monday", "Tuesday", "Wednesday", "Thursday",
             "Friday", "Saturday", "Sunday"].index(self.handoff_day)
            - now.weekday()
        ) % 7

        if days_until_handoff == 0 and now.hour >= self.handoff_hour:
            days_until_handoff = 7

        handoff = now.replace(
            hour=self.handoff_hour,
            minute=0,
            second=0,
            microsecond=0
        ) + timedelta(days=days_until_handoff)

        return handoff

@dataclass
class OnCallMetrics:
    """Track on-call health metrics."""

    pages_received: int = 0
    pages_acknowledged: int = 0
    pages_escalated: int = 0
    mean_time_to_acknowledge_minutes: float = 0.0
    after_hours_pages: int = 0

    def acknowledgment_rate(self) -> float:
        """Calculate page acknowledgment rate."""
        if self.pages_received == 0:
            return 1.0
        return self.pages_acknowledged / self.pages_received

    def escalation_rate(self) -> float:
        """Calculate escalation rate."""
        if self.pages_received == 0:
            return 0.0
        return self.pages_escalated / self.pages_received

    def is_healthy(self) -> bool:
        """
        Determine if on-call load is healthy.

        Guidelines:
        - Less than 2 pages per shift
        - Less than 25% after-hours pages
        - Acknowledgment rate > 95%
        - Mean time to acknowledge < 5 minutes
        """
        return (
            self.pages_received <= 14  # ~2 per day for week
            and self.escalation_rate() < 0.1
            and self.acknowledgment_rate() > 0.95
            and self.mean_time_to_acknowledge_minutes < 5.0
        )
```

### Incident Management Framework

**Incident Severity Levels:**

| Severity | Impact | Response Time | Examples |
|----------|--------|---------------|----------|
| SEV1 | Complete outage | 5 minutes | Site down, data loss |
| SEV2 | Major degradation | 15 minutes | Core feature broken |
| SEV3 | Minor impact | 1 hour | Non-critical feature issue |
| SEV4 | Minimal impact | 4 hours | Cosmetic issues |

**Incident Lifecycle:**

```python
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

class IncidentStatus(Enum):
    DETECTED = "detected"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MITIGATING = "mitigating"
    RESOLVED = "resolved"
    POSTMORTEM = "postmortem"
    CLOSED = "closed"

class IncidentSeverity(Enum):
    SEV1 = 1
    SEV2 = 2
    SEV3 = 3
    SEV4 = 4

@dataclass
class IncidentTimelineEvent:
    timestamp: datetime
    status: IncidentStatus
    description: str
    actor: str

@dataclass
class Incident:
    """Track incident lifecycle and metrics."""

    id: str
    title: str
    severity: IncidentSeverity
    status: IncidentStatus = IncidentStatus.DETECTED
    created_at: datetime = field(default_factory=datetime.now)

    incident_commander: Optional[str] = None
    communications_lead: Optional[str] = None

    timeline: List[IncidentTimelineEvent] = field(default_factory=list)

    acknowledged_at: Optional[datetime] = None
    identified_at: Optional[datetime] = None
    mitigated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    root_cause: Optional[str] = None
    action_items: List[str] = field(default_factory=list)

    def update_status(
        self,
        new_status: IncidentStatus,
        description: str,
        actor: str
    ) -> None:
        """Update incident status and record timeline."""
        now = datetime.now()
        self.status = new_status

        self.timeline.append(IncidentTimelineEvent(
            timestamp=now,
            status=new_status,
            description=description,
            actor=actor
        ))

        # Record milestone timestamps
        if new_status == IncidentStatus.ACKNOWLEDGED:
            self.acknowledged_at = now
        elif new_status == IncidentStatus.IDENTIFIED:
            self.identified_at = now
        elif new_status == IncidentStatus.MITIGATING:
            self.mitigated_at = now
        elif new_status == IncidentStatus.RESOLVED:
            self.resolved_at = now

    def time_to_acknowledge(self) -> Optional[timedelta]:
        """Calculate time from detection to acknowledgment."""
        if self.acknowledged_at:
            return self.acknowledged_at - self.created_at
        return None

    def time_to_mitigate(self) -> Optional[timedelta]:
        """Calculate time from detection to mitigation."""
        if self.mitigated_at:
            return self.mitigated_at - self.created_at
        return None

    def time_to_resolve(self) -> Optional[timedelta]:
        """Calculate total incident duration."""
        if self.resolved_at:
            return self.resolved_at - self.created_at
        return None

class IncidentManager:
    """Manage incident lifecycle and communication."""

    def __init__(self):
        self.incidents: List[Incident] = []

    def create_incident(
        self,
        title: str,
        severity: IncidentSeverity,
        detected_by: str
    ) -> Incident:
        """Create and register a new incident."""
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{len(self.incidents) + 1:04d}"

        incident = Incident(
            id=incident_id,
            title=title,
            severity=severity
        )

        incident.timeline.append(IncidentTimelineEvent(
            timestamp=incident.created_at,
            status=IncidentStatus.DETECTED,
            description=f"Incident detected: {title}",
            actor=detected_by
        ))

        self.incidents.append(incident)
        self._notify_on_call(incident)

        return incident

    def _notify_on_call(self, incident: Incident) -> None:
        """Send notifications based on severity."""
        # Implementation would integrate with PagerDuty, Slack, etc.
        pass

    def calculate_mttr(self) -> timedelta:
        """Calculate Mean Time To Resolve across all incidents."""
        resolved = [i for i in self.incidents if i.resolved_at]
        if not resolved:
            return timedelta(0)

        total_seconds = sum(
            i.time_to_resolve().total_seconds()
            for i in resolved
        )
        return timedelta(seconds=total_seconds / len(resolved))
```

### Postmortem Culture

Blameless postmortems are essential for learning from incidents and preventing recurrence.

**Postmortem Template:**

```markdown
# Incident Postmortem: [INC-XXXXXX]

## Incident Summary
- **Date**: YYYY-MM-DD
- **Duration**: X hours Y minutes
- **Severity**: SEV-X
- **Impact**: Brief description of user impact
- **Services Affected**: List of affected services

## Timeline (All times in UTC)
| Time | Event |
|------|-------|
| HH:MM | Incident detected via [monitoring/customer report] |
| HH:MM | On-call engineer paged |
| HH:MM | Incident acknowledged |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Service restored |

## Root Cause
Detailed technical explanation of what caused the incident.

## Contributing Factors
- Factor 1: Description
- Factor 2: Description

## Detection
How was the incident detected? Could we have detected it earlier?

## Response
What went well? What could be improved?

## Impact
- X% of users affected
- $Y estimated revenue impact
- Z error budget consumed

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| Implement circuit breaker | @engineer | YYYY-MM-DD | P1 |
| Add monitoring for X | @engineer | YYYY-MM-DD | P2 |
| Update runbook | @engineer | YYYY-MM-DD | P2 |

## Lessons Learned
What did we learn that we did not know before?
```

---

## Capacity Planning

Effective capacity planning ensures systems can handle current and future load while optimizing costs.

### Capacity Planning Framework

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import math

@dataclass
class ResourceMetrics:
    """Current resource utilization metrics."""
    cpu_utilization: float  # 0.0 to 1.0
    memory_utilization: float
    disk_utilization: float
    network_bandwidth_utilization: float
    request_rate: float  # requests per second

@dataclass
class CapacityThresholds:
    """Define safe operating thresholds."""
    target_utilization: float = 0.70  # 70% target
    warning_threshold: float = 0.80   # 80% warning
    critical_threshold: float = 0.90  # 90% critical

    def headroom(self, current: float) -> float:
        """Calculate remaining headroom before target."""
        return max(0, self.target_utilization - current)

    def status(self, current: float) -> str:
        """Get capacity status."""
        if current >= self.critical_threshold:
            return "CRITICAL"
        elif current >= self.warning_threshold:
            return "WARNING"
        elif current >= self.target_utilization:
            return "ELEVATED"
        return "HEALTHY"

class CapacityPlanner:
    """Plan and forecast capacity needs."""

    def __init__(
        self,
        service_name: str,
        thresholds: Optional[CapacityThresholds] = None
    ):
        self.service_name = service_name
        self.thresholds = thresholds or CapacityThresholds()
        self.historical_data: List[tuple] = []  # (timestamp, metrics)

    def record_metrics(self, metrics: ResourceMetrics) -> None:
        """Record current metrics for trending."""
        self.historical_data.append((datetime.now(), metrics))

    def calculate_growth_rate(
        self,
        metric_name: str,
        lookback_days: int = 30
    ) -> float:
        """
        Calculate daily growth rate for a metric.

        Returns:
            Daily growth rate as a multiplier (e.g., 1.02 for 2% daily growth)
        """
        if len(self.historical_data) < 2:
            return 1.0

        cutoff = datetime.now() - timedelta(days=lookback_days)
        relevant_data = [
            (ts, getattr(m, metric_name))
            for ts, m in self.historical_data
            if ts > cutoff
        ]

        if len(relevant_data) < 2:
            return 1.0

        first_ts, first_val = relevant_data[0]
        last_ts, last_val = relevant_data[-1]

        days_elapsed = (last_ts - first_ts).total_seconds() / 86400
        if days_elapsed < 1 or first_val == 0:
            return 1.0

        total_growth = last_val / first_val
        daily_rate = math.pow(total_growth, 1 / days_elapsed)

        return daily_rate

    def forecast_capacity(
        self,
        current_value: float,
        growth_rate: float,
        days_ahead: int
    ) -> float:
        """Forecast metric value at future date."""
        return current_value * math.pow(growth_rate, days_ahead)

    def days_until_threshold(
        self,
        current_value: float,
        growth_rate: float,
        threshold: float
    ) -> Optional[int]:
        """Calculate days until reaching a threshold."""
        if growth_rate <= 1.0:
            return None  # Not growing
        if current_value >= threshold:
            return 0  # Already exceeded

        # threshold = current * rate^days
        # days = log(threshold/current) / log(rate)
        days = math.log(threshold / current_value) / math.log(growth_rate)
        return int(math.ceil(days))

    def generate_capacity_report(
        self,
        current_metrics: ResourceMetrics
    ) -> Dict:
        """Generate comprehensive capacity report."""
        cpu_growth = self.calculate_growth_rate('cpu_utilization')
        memory_growth = self.calculate_growth_rate('memory_utilization')

        return {
            "service": self.service_name,
            "generated_at": datetime.now().isoformat(),
            "current_state": {
                "cpu": {
                    "utilization": f"{current_metrics.cpu_utilization:.1%}",
                    "status": self.thresholds.status(current_metrics.cpu_utilization),
                    "headroom": f"{self.thresholds.headroom(current_metrics.cpu_utilization):.1%}"
                },
                "memory": {
                    "utilization": f"{current_metrics.memory_utilization:.1%}",
                    "status": self.thresholds.status(current_metrics.memory_utilization),
                    "headroom": f"{self.thresholds.headroom(current_metrics.memory_utilization):.1%}"
                }
            },
            "growth_analysis": {
                "cpu_daily_growth": f"{(cpu_growth - 1) * 100:.2f}%",
                "memory_daily_growth": f"{(memory_growth - 1) * 100:.2f}%"
            },
            "forecasts": {
                "30_day_cpu": f"{self.forecast_capacity(current_metrics.cpu_utilization, cpu_growth, 30):.1%}",
                "30_day_memory": f"{self.forecast_capacity(current_metrics.memory_utilization, memory_growth, 30):.1%}"
            },
            "time_to_threshold": {
                "cpu_to_warning": self.days_until_threshold(
                    current_metrics.cpu_utilization,
                    cpu_growth,
                    self.thresholds.warning_threshold
                ),
                "memory_to_warning": self.days_until_threshold(
                    current_metrics.memory_utilization,
                    memory_growth,
                    self.thresholds.warning_threshold
                )
            },
            "recommendations": self._generate_recommendations(
                current_metrics,
                cpu_growth,
                memory_growth
            )
        }

    def _generate_recommendations(
        self,
        metrics: ResourceMetrics,
        cpu_growth: float,
        memory_growth: float
    ) -> List[str]:
        """Generate capacity recommendations."""
        recommendations = []

        # CPU recommendations
        cpu_days = self.days_until_threshold(
            metrics.cpu_utilization,
            cpu_growth,
            self.thresholds.warning_threshold
        )
        if cpu_days and cpu_days < 30:
            recommendations.append(
                f"CPU capacity will reach warning threshold in {cpu_days} days. "
                "Consider scaling horizontally or optimizing CPU-intensive operations."
            )

        # Memory recommendations
        memory_days = self.days_until_threshold(
            metrics.memory_utilization,
            memory_growth,
            self.thresholds.warning_threshold
        )
        if memory_days and memory_days < 30:
            recommendations.append(
                f"Memory capacity will reach warning threshold in {memory_days} days. "
                "Review memory leaks, caching strategies, or vertical scaling."
            )

        # General recommendations
        if metrics.cpu_utilization > 0.6 and metrics.memory_utilization < 0.3:
            recommendations.append(
                "CPU-bound workload detected. Consider CPU-optimized instance types."
            )
        elif metrics.memory_utilization > 0.6 and metrics.cpu_utilization < 0.3:
            recommendations.append(
                "Memory-bound workload detected. Consider memory-optimized instance types."
            )

        return recommendations
```

### Load Testing for Capacity Validation

```python
import asyncio
import aiohttp
from dataclasses import dataclass
from typing import List
from datetime import datetime
import statistics

@dataclass
class LoadTestResult:
    """Results from a load test run."""
    total_requests: int
    successful_requests: int
    failed_requests: int
    mean_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    requests_per_second: float
    duration_seconds: float
    errors: List[str]

class LoadTester:
    """Simple load testing utility for capacity validation."""

    def __init__(self, base_url: str, timeout_seconds: float = 30.0):
        self.base_url = base_url
        self.timeout = aiohttp.ClientTimeout(total=timeout_seconds)

    async def _make_request(
        self,
        session: aiohttp.ClientSession,
        endpoint: str
    ) -> tuple:
        """Make a single request and return timing."""
        start = datetime.now()
        try:
            async with session.get(f"{self.base_url}{endpoint}") as response:
                await response.read()
                elapsed = (datetime.now() - start).total_seconds() * 1000
                return (response.status < 500, elapsed, None)
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            return (False, elapsed, str(e))

    async def run_load_test(
        self,
        endpoint: str,
        concurrent_users: int,
        requests_per_user: int
    ) -> LoadTestResult:
        """Run a load test with specified concurrency."""
        start_time = datetime.now()
        latencies: List[float] = []
        errors: List[str] = []
        success_count = 0

        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            tasks = []
            for _ in range(concurrent_users):
                for _ in range(requests_per_user):
                    tasks.append(self._make_request(session, endpoint))

            results = await asyncio.gather(*tasks)

            for success, latency, error in results:
                latencies.append(latency)
                if success:
                    success_count += 1
                if error:
                    errors.append(error)

        duration = (datetime.now() - start_time).total_seconds()
        sorted_latencies = sorted(latencies)
        total = len(latencies)

        return LoadTestResult(
            total_requests=total,
            successful_requests=success_count,
            failed_requests=total - success_count,
            mean_latency_ms=statistics.mean(latencies),
            p50_latency_ms=sorted_latencies[int(total * 0.50)],
            p95_latency_ms=sorted_latencies[int(total * 0.95)],
            p99_latency_ms=sorted_latencies[int(total * 0.99)],
            requests_per_second=total / duration,
            duration_seconds=duration,
            errors=errors[:10]  # Limit error samples
        )

    async def find_breaking_point(
        self,
        endpoint: str,
        start_users: int = 10,
        max_users: int = 1000,
        step: int = 10,
        latency_threshold_ms: float = 1000.0,
        error_threshold: float = 0.01
    ) -> dict:
        """Find the breaking point where service degrades."""
        results = []
        breaking_point = None

        for users in range(start_users, max_users + 1, step):
            result = await self.run_load_test(endpoint, users, 10)
            results.append({"users": users, "result": result})

            error_rate = result.failed_requests / result.total_requests

            if (result.p99_latency_ms > latency_threshold_ms or
                error_rate > error_threshold):
                breaking_point = users - step
                break

        return {
            "breaking_point_users": breaking_point,
            "max_sustainable_rps": (
                results[-2]["result"].requests_per_second
                if len(results) > 1 else None
            ),
            "test_results": results
        }
```

---

## Implementing SRE in Practice

### Kubernetes SRE Configuration

```yaml
# PodDisruptionBudget for high availability
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
  namespace: production
spec:
  minAvailable: 2  # Or use maxUnavailable: 1
  selector:
    matchLabels:
      app: api-service

---
# Horizontal Pod Autoscaler with custom metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max

---
# Resource Quotas for namespace protection
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi
    persistentvolumeclaims: "50"
    services.loadbalancers: "5"
```

### Observability Stack Configuration

```yaml
# Prometheus ServiceMonitor for SLI collection
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api-service-monitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: api-service
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
  namespaceSelector:
    matchNames:
      - production

---
# Grafana Dashboard ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  slo-dashboard.json: |
    {
      "title": "SLO Dashboard",
      "panels": [
        {
          "title": "Availability SLI (30 day rolling)",
          "type": "gauge",
          "targets": [
            {
              "expr": "sum(increase(http_requests_total{status!~\"5..\"}[30d])) / sum(increase(http_requests_total[30d]))"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "thresholds": {
                "steps": [
                  {"color": "red", "value": 0},
                  {"color": "yellow", "value": 0.99},
                  {"color": "green", "value": 0.999}
                ]
              },
              "unit": "percentunit",
              "min": 0.95,
              "max": 1
            }
          }
        },
        {
          "title": "Error Budget Remaining",
          "type": "stat",
          "targets": [
            {
              "expr": "(1 - ((1 - (sum(increase(http_requests_total{status!~\"5..\"}[30d])) / sum(increase(http_requests_total[30d])))) / 0.001)) * 100"
            }
          ]
        }
      ]
    }
```

### Alerting Strategy

```yaml
# Prometheus AlertManager configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/xxx'
      pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

    route:
      receiver: 'default'
      group_by: ['alertname', 'severity', 'service']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      routes:
        # Critical alerts go to PagerDuty
        - match:
            severity: critical
          receiver: 'pagerduty-critical'
          group_wait: 10s
          repeat_interval: 1h

        # Warning alerts go to Slack
        - match:
            severity: warning
          receiver: 'slack-warnings'
          repeat_interval: 4h

        # SLO alerts get special routing
        - match:
            alert_type: slo_burn
          receiver: 'slo-alerts'
          group_by: ['service', 'slo_name']

    receivers:
      - name: 'default'
        slack_configs:
          - channel: '#alerts-default'

      - name: 'pagerduty-critical'
        pagerduty_configs:
          - service_key: '<pagerduty-service-key>'
            severity: critical
            description: '{{ .GroupLabels.alertname }}'
            details:
              service: '{{ .GroupLabels.service }}'
              summary: '{{ .Annotations.summary }}'

      - name: 'slack-warnings'
        slack_configs:
          - channel: '#alerts-warnings'
            title: '{{ .GroupLabels.alertname }}'
            text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'

      - name: 'slo-alerts'
        slack_configs:
          - channel: '#slo-alerts'
        pagerduty_configs:
          - service_key: '<pagerduty-slo-key>'

    inhibit_rules:
      # If a critical alert is firing, inhibit warnings for same service
      - source_match:
          severity: 'critical'
        target_match:
          severity: 'warning'
        equal: ['service']
```

---

## Interview Key Points

### Core SRE Concepts

**1. What is an Error Budget and how do you use it?**

An error budget is the acceptable amount of unreliability derived from SLOs. For a 99.9% availability SLO, the error budget is 0.1% (about 43 minutes per month). Teams can "spend" this budget on:
- Feature releases that may introduce instability
- Planned maintenance
- Experimentation

When the budget is exhausted, the team shifts focus to reliability improvements.

**2. Explain the difference between SLI, SLO, and SLA.**

- **SLI (Service Level Indicator)**: Quantitative measurement of service behavior (e.g., request latency, error rate)
- **SLO (Service Level Objective)**: Target value for an SLI (e.g., 99.9% of requests under 200ms)
- **SLA (Service Level Agreement)**: Contractual commitment with consequences for missing targets

**3. How do you balance reliability with feature velocity?**

Use error budgets as the mechanism:
- When budget is healthy: Normal release pace
- When budget is low: Reduce releases, focus on reliability
- When budget is exhausted: Freeze features, prioritize stability

This creates a data-driven negotiation between product and engineering.

### Practical Scenarios

**1. Your service is experiencing a slow burn of the error budget. What do you do?**

```
1. Analyze: Identify the source of errors/latency
2. Prioritize: Is it worth the budget consumption?
3. Mitigate: Implement quick fixes if possible
4. Plan: Schedule proper fixes
5. Communicate: Update stakeholders on budget status
6. Adjust: Consider tightening change management
```

**2. How would you design an SLO for a new service?**

```
1. Identify critical user journeys
2. Define what "good" means for each journey
3. Select appropriate SLIs (availability, latency, correctness)
4. Analyze historical data or similar services
5. Set initial targets (start conservative)
6. Implement measurement and alerting
7. Iterate based on user feedback and data
```

**3. An incident just occurred. Walk through your response.**

```
1. Detect: Alert fires or customer reports
2. Respond: Acknowledge, assign incident commander
3. Triage: Assess severity and impact
4. Communicate: Update status page, notify stakeholders
5. Investigate: Gather data, form hypotheses
6. Mitigate: Apply quick fix to restore service
7. Resolve: Implement proper fix
8. Learn: Conduct blameless postmortem
9. Improve: Track and complete action items
```

---

## Further Reading

### Official Resources

- [Google SRE Books](https://sre.google/books/) - Free online versions
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/)
- [Building Secure and Reliable Systems](https://sre.google/books/building-secure-reliable-systems/)

### Tools and Frameworks

- **SLO Tools**: Sloth, OpenSLO, Nobl9
- **Incident Management**: PagerDuty, OpsGenie, FireHydrant
- **Observability**: Prometheus, Grafana, Datadog, Honeycomb
- **Chaos Engineering**: Chaos Monkey, Gremlin, LitmusChaos

### Certifications

- **Google Cloud Professional Cloud DevOps Engineer**
- **AWS DevOps Engineer Professional**
- **Certified Kubernetes Administrator (CKA)**

### Recommended Reading

- *Site Reliability Engineering* by Betsy Beyer et al.
- *The Site Reliability Workbook* by Betsy Beyer et al.
- *Implementing Service Level Objectives* by Alex Hidalgo
- *Observability Engineering* by Charity Majors et al.
- *Chaos Engineering* by Casey Rosenthal et al.

---

## Summary

Site Reliability Engineering represents a paradigm shift in how organizations approach system reliability. By applying software engineering principles to operations challenges, SRE teams build systems that are simultaneously reliable and agile.

**Key Takeaways:**

1. **SLOs are the foundation**: Everything in SRE flows from well-defined Service Level Objectives that reflect user expectations.

2. **Error budgets enable velocity**: By quantifying acceptable unreliability, teams can make data-driven decisions about feature development versus reliability work.

3. **Automation reduces toil**: Every manual task is a candidate for automation. SREs should spend no more than 50% of their time on operational work.

4. **Incidents are learning opportunities**: Blameless postmortems and action item tracking turn failures into improvements.

5. **Capacity planning prevents outages**: Proactive planning and load testing ensure systems can handle growth.

6. **On-call should be sustainable**: Healthy on-call rotations prevent burnout and ensure effective incident response.

**Implementation Roadmap:**

1. Start by defining SLOs for your most critical services
2. Implement monitoring to measure SLIs accurately
3. Calculate and track error budgets
4. Establish incident response procedures
5. Conduct regular postmortems
6. Automate repetitive operational tasks
7. Plan capacity proactively
8. Continuously iterate and improve

SRE is not a destination but a journey of continuous improvement. Start where you are, measure what matters, and systematically reduce toil while increasing reliability.
