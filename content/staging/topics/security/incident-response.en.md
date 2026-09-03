---
title: Security Incident Response
description: Learn security incident response process and best practices
track: security
section: infra-security
difficulty: intermediate
tags:
  - incident response
  - security operations
  - SOC
  - forensics
status: imported
origin: old/src/content/docs/security/incident-response.en.md
divergence: 0.228
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: Security
  subcategory: Operations
  order: 12
  lastUpdated: 2026-01-07
---

Security incidents are inevitable in today's threat landscape. Whether it is a data breach, malware infection, denial of service attack, or insider threat, organizations must be prepared to detect, respond to, and recover from security events effectively. This comprehensive guide covers the incident response lifecycle, preparation strategies, detection and analysis techniques, containment procedures, eradication and recovery processes, lessons learned practices, playbook development, and essential tooling.

## Understanding Incident Response

Incident response (IR) is the systematic approach to preparing for, detecting, containing, and recovering from security incidents. A well-structured IR program minimizes damage, reduces recovery time and costs, and helps prevent future incidents through continuous improvement.

### Why Incident Response Matters

Organizations without a mature incident response capability face significant risks:

- Extended dwell time allowing attackers to cause more damage
- Increased financial losses from prolonged incidents
- Regulatory penalties for inadequate response procedures
- Reputational damage from poorly handled breaches
- Loss of customer trust and business opportunities

```
Incident Response Value Chain:
+------------------+     +------------------+     +------------------+
|   Preparation    |     |   Detection &    |     |   Containment    |
|                  |---->|   Analysis       |---->|                  |
| - Plans/Playbooks|     | - Monitoring     |     | - Short-term     |
| - Team Training  |     | - Triage         |     | - Long-term      |
| - Tool Selection |     | - Investigation  |     | - Evidence       |
+------------------+     +------------------+     +------------------+
         ^                                                  |
         |                                                  v
+------------------+     +------------------+     +------------------+
|     Lessons      |     |     Recovery     |     |   Eradication    |
|     Learned      |<----|                  |<----|                  |
| - Post-mortems   |     | - System Restore |     | - Root Cause     |
| - Improvements   |     | - Validation     |     | - Malware Remove |
| - Documentation  |     | - Monitoring     |     | - Vulnerability  |
+------------------+     +------------------+     +------------------+
```

## The Incident Response Lifecycle

The incident response lifecycle, as defined by NIST Special Publication 800-61, consists of four primary phases. Understanding each phase is essential for building an effective IR program.

### Phase 1: Preparation

Preparation is the foundation of effective incident response. This phase involves establishing and training the incident response team, developing policies and procedures, and deploying necessary tools and infrastructure.

**Key Preparation Activities:**

```yaml
# Incident Response Preparation Checklist
preparation:
  team:
    - Identify and train IR team members
    - Define roles and responsibilities
    - Establish escalation procedures
    - Create on-call rotation schedules
    - Conduct regular training and exercises

  documentation:
    - Develop IR policy and procedures
    - Create incident classification criteria
    - Document communication templates
    - Maintain contact lists (internal/external)
    - Establish evidence handling procedures

  infrastructure:
    - Deploy SIEM and monitoring tools
    - Configure log aggregation
    - Set up forensic workstations
    - Establish secure communication channels
    - Create isolated analysis environments

  relationships:
    - Identify legal counsel
    - Establish law enforcement contacts
    - Contract with IR service providers
    - Coordinate with PR/communications team
    - Build vendor support relationships
```

**Incident Response Team Structure:**

```
Incident Response Team Organization:
+-------------------------------------------------------------------------+
|                        IR Steering Committee                            |
|  (CISO, Legal, HR, Communications, Business Unit Leaders)               |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        IR Team Lead/Manager                             |
|  - Overall incident coordination                                        |
|  - Stakeholder communication                                            |
|  - Resource allocation                                                  |
+-------------------------------------------------------------------------+
          |                         |                         |
          v                         v                         v
+-------------------+   +-------------------+   +-------------------+
|   Triage Team     |   |  Analysis Team    |   |  Recovery Team    |
| - Initial assess  |   | - Deep forensics  |   | - System restore  |
| - Alert handling  |   | - Malware analysis|   | - Patch/harden    |
| - Classification  |   | - Timeline build  |   | - Validation      |
+-------------------+   +-------------------+   +-------------------+
          |                         |                         |
          v                         v                         v
+-------------------------------------------------------------------------+
|                     Supporting Functions                                |
| - Legal (compliance, liability)      - HR (insider threats)            |
| - Communications (PR, customer)      - IT Operations (infrastructure)  |
| - Business Units (impact assessment) - External (law enforcement, IR)  |
+-------------------------------------------------------------------------+
```

**Incident Classification Framework:**

```python
# Incident severity classification system
class IncidentSeverity:
    """
    Incident severity levels based on impact and urgency.
    """

    SEVERITY_LEVELS = {
        'critical': {
            'level': 1,
            'description': 'Business-critical systems compromised',
            'response_time': '15 minutes',
            'examples': [
                'Active data exfiltration',
                'Ransomware spreading',
                'Core infrastructure compromise',
                'Customer data breach confirmed'
            ],
            'escalation': ['CISO', 'CEO', 'Legal', 'Board'],
            'notification': 'Immediate'
        },
        'high': {
            'level': 2,
            'description': 'Significant impact to operations or data',
            'response_time': '1 hour',
            'examples': [
                'Malware on multiple systems',
                'Unauthorized privileged access',
                'DDoS affecting services',
                'Suspected data exposure'
            ],
            'escalation': ['CISO', 'IT Director', 'Legal'],
            'notification': 'Within 1 hour'
        },
        'medium': {
            'level': 3,
            'description': 'Limited impact, contained threat',
            'response_time': '4 hours',
            'examples': [
                'Single system malware',
                'Phishing with credential theft',
                'Unauthorized access attempt',
                'Policy violation'
            ],
            'escalation': ['Security Manager', 'IT Manager'],
            'notification': 'Within 4 hours'
        },
        'low': {
            'level': 4,
            'description': 'Minimal impact, routine handling',
            'response_time': '24 hours',
            'examples': [
                'Failed attack attempts',
                'Minor policy violations',
                'Suspicious but unconfirmed activity',
                'Vulnerability without exploitation'
            ],
            'escalation': ['SOC Lead'],
            'notification': 'Next business day'
        }
    }

    @classmethod
    def classify_incident(cls, impact_score, urgency_score):
        """
        Determine severity based on impact and urgency.
        Impact: Data sensitivity, systems affected, business criticality
        Urgency: Active threat, spreading, time-sensitive
        """
        combined_score = (impact_score + urgency_score) / 2

        if combined_score >= 9:
            return 'critical'
        elif combined_score >= 7:
            return 'high'
        elif combined_score >= 4:
            return 'medium'
        else:
            return 'low'

    @classmethod
    def get_response_procedures(cls, severity):
        """Get response procedures for severity level."""
        return cls.SEVERITY_LEVELS.get(severity, cls.SEVERITY_LEVELS['medium'])
```

### Phase 2: Detection and Analysis

Detection and analysis is often the most challenging phase. It requires identifying that an incident has occurred, understanding its scope and impact, and gathering evidence for response and potential legal proceedings.

**Detection Sources:**

```python
# Common detection sources and their characteristics
class DetectionSources:
    """
    Categories of incident detection sources.
    """

    SOURCES = {
        'automated': {
            'siem_alerts': {
                'description': 'Security Information and Event Management alerts',
                'strengths': ['24/7 monitoring', 'Correlation', 'Historical data'],
                'weaknesses': ['False positives', 'Requires tuning'],
                'typical_detections': [
                    'Brute force attacks',
                    'Anomalous access patterns',
                    'Known attack signatures',
                    'Policy violations'
                ]
            },
            'ids_ips': {
                'description': 'Intrusion Detection/Prevention Systems',
                'strengths': ['Network visibility', 'Real-time blocking'],
                'weaknesses': ['Encrypted traffic', 'Signature-based limitations'],
                'typical_detections': [
                    'Network-based attacks',
                    'Exploit attempts',
                    'Malicious payloads',
                    'C2 communication'
                ]
            },
            'edr': {
                'description': 'Endpoint Detection and Response',
                'strengths': ['Behavioral analysis', 'Process visibility'],
                'weaknesses': ['Endpoint coverage', 'Resource intensive'],
                'typical_detections': [
                    'Malware execution',
                    'Fileless attacks',
                    'Lateral movement',
                    'Privilege escalation'
                ]
            },
            'dlp': {
                'description': 'Data Loss Prevention',
                'strengths': ['Data-centric', 'Policy enforcement'],
                'weaknesses': ['False positives', 'Encryption blind spots'],
                'typical_detections': [
                    'Data exfiltration',
                    'Policy violations',
                    'Unauthorized sharing',
                    'Sensitive data exposure'
                ]
            }
        },
        'human': {
            'user_reports': {
                'description': 'Reports from employees or customers',
                'strengths': ['Contextual awareness', 'Novel detection'],
                'weaknesses': ['Inconsistent', 'Delayed reporting'],
                'typical_detections': [
                    'Phishing emails',
                    'Suspicious behavior',
                    'Social engineering',
                    'Physical security issues'
                ]
            },
            'threat_hunting': {
                'description': 'Proactive search for threats',
                'strengths': ['Finds advanced threats', 'Hypothesis-driven'],
                'weaknesses': ['Resource intensive', 'Requires expertise'],
                'typical_detections': [
                    'APT activity',
                    'Living off the land',
                    'Insider threats',
                    'Novel attack techniques'
                ]
            },
            'third_party': {
                'description': 'External notifications',
                'strengths': ['External perspective', 'Threat intel'],
                'weaknesses': ['Verification needed', 'Delayed'],
                'typical_detections': [
                    'Data on dark web',
                    'Brand abuse',
                    'Compromised credentials',
                    'Sector-specific threats'
                ]
            }
        }
    }
```

**Initial Triage Process:**

```python
import json
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

class IncidentStatus(Enum):
    NEW = "new"
    TRIAGING = "triaging"
    ANALYZING = "analyzing"
    CONTAINING = "containing"
    ERADICATING = "eradicating"
    RECOVERING = "recovering"
    CLOSED = "closed"

@dataclass
class IncidentTicket:
    """
    Incident tracking ticket structure.
    """
    incident_id: str
    title: str
    description: str
    severity: str
    status: IncidentStatus
    detection_source: str
    detection_time: datetime
    affected_systems: List[str] = field(default_factory=list)
    affected_users: List[str] = field(default_factory=list)
    indicators: Dict[str, List[str]] = field(default_factory=dict)
    timeline: List[Dict[str, Any]] = field(default_factory=list)
    assigned_to: Optional[str] = None

    def add_timeline_entry(self, action: str, details: str, analyst: str):
        """Add entry to incident timeline."""
        self.timeline.append({
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'details': details,
            'analyst': analyst
        })

    def add_indicator(self, ioc_type: str, value: str):
        """Add indicator of compromise."""
        if ioc_type not in self.indicators:
            self.indicators[ioc_type] = []
        if value not in self.indicators[ioc_type]:
            self.indicators[ioc_type].append(value)

    def escalate(self, new_severity: str, reason: str, analyst: str):
        """Escalate incident severity."""
        old_severity = self.severity
        self.severity = new_severity
        self.add_timeline_entry(
            'escalation',
            f'Escalated from {old_severity} to {new_severity}: {reason}',
            analyst
        )


class IncidentTriage:
    """
    Initial incident triage and analysis procedures.
    """

    TRIAGE_QUESTIONS = [
        {
            'category': 'identification',
            'questions': [
                'What type of incident is this?',
                'When was it first detected?',
                'How was it detected?',
                'Who reported it?'
            ]
        },
        {
            'category': 'scope',
            'questions': [
                'What systems are affected?',
                'What data may be impacted?',
                'How many users are affected?',
                'Is the incident ongoing or contained?'
            ]
        },
        {
            'category': 'impact',
            'questions': [
                'What is the business impact?',
                'Are critical services affected?',
                'Is there regulatory exposure?',
                'What is the potential data loss?'
            ]
        },
        {
            'category': 'attribution',
            'questions': [
                'Is this an external or internal threat?',
                'Are there known threat actor indicators?',
                'What is the likely motivation?',
                'Is this targeted or opportunistic?'
            ]
        }
    ]

    @staticmethod
    def perform_initial_triage(alert_data: dict) -> IncidentTicket:
        """
        Perform initial triage on an alert.
        """
        # Create incident ticket
        incident = IncidentTicket(
            incident_id=f"INC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            title=alert_data.get('title', 'Security Incident'),
            description=alert_data.get('description', ''),
            severity='medium',  # Default, will be assessed
            status=IncidentStatus.TRIAGING,
            detection_source=alert_data.get('source', 'unknown'),
            detection_time=datetime.utcnow()
        )

        # Extract initial indicators
        if 'indicators' in alert_data:
            for ioc_type, values in alert_data['indicators'].items():
                for value in values:
                    incident.add_indicator(ioc_type, value)

        # Add initial timeline entry
        incident.add_timeline_entry(
            'triage_started',
            'Initial triage process initiated',
            'system'
        )

        return incident

    @staticmethod
    def assess_severity(incident: IncidentTicket, assessment: dict) -> str:
        """
        Assess incident severity based on impact factors.
        """
        # Impact scoring factors
        data_sensitivity = assessment.get('data_sensitivity', 1)  # 1-10
        system_criticality = assessment.get('system_criticality', 1)  # 1-10
        user_impact = assessment.get('user_impact', 1)  # 1-10
        business_impact = assessment.get('business_impact', 1)  # 1-10

        # Urgency scoring factors
        is_active = assessment.get('is_active', False)
        is_spreading = assessment.get('is_spreading', False)
        regulatory_exposure = assessment.get('regulatory_exposure', False)

        # Calculate impact score
        impact_score = (
            data_sensitivity * 0.3 +
            system_criticality * 0.3 +
            user_impact * 0.2 +
            business_impact * 0.2
        )

        # Calculate urgency score
        urgency_score = 5  # Base score
        if is_active:
            urgency_score += 2
        if is_spreading:
            urgency_score += 2
        if regulatory_exposure:
            urgency_score += 1

        return IncidentSeverity.classify_incident(impact_score, urgency_score)
```

**Evidence Collection Framework:**

```python
import hashlib
import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Tuple

class EvidenceCollector:
    """
    Digital evidence collection and chain of custody management.
    """

    def __init__(self, case_id: str, evidence_root: str):
        self.case_id = case_id
        self.evidence_root = Path(evidence_root) / case_id
        self.chain_of_custody: List[dict] = []
        self._initialize_evidence_directory()

    def _initialize_evidence_directory(self):
        """Create evidence directory structure."""
        directories = [
            'disk_images',
            'memory_dumps',
            'network_captures',
            'logs',
            'malware_samples',
            'screenshots',
            'documents'
        ]

        for directory in directories:
            (self.evidence_root / directory).mkdir(parents=True, exist_ok=True)

        # Create chain of custody log
        self._log_custody_event(
            action='case_created',
            details=f'Evidence repository initialized for case {self.case_id}'
        )

    def _calculate_hash(self, file_path: Path) -> Tuple[str, str]:
        """Calculate MD5 and SHA256 hashes of a file."""
        md5_hash = hashlib.md5()
        sha256_hash = hashlib.sha256()

        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                md5_hash.update(chunk)
                sha256_hash.update(chunk)

        return md5_hash.hexdigest(), sha256_hash.hexdigest()

    def _log_custody_event(self, action: str, details: str,
                          evidence_id: str = None, analyst: str = 'system'):
        """Log chain of custody event."""
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'details': details,
            'evidence_id': evidence_id,
            'analyst': analyst,
            'case_id': self.case_id
        }
        self.chain_of_custody.append(event)

        # Write to custody log file
        log_file = self.evidence_root / 'chain_of_custody.log'
        with open(log_file, 'a') as f:
            f.write(f"{event}\n")

    def collect_file(self, source_path: str, category: str,
                    description: str, analyst: str) -> dict:
        """
        Collect a file as evidence with proper documentation.
        """
        source = Path(source_path)
        if not source.exists():
            raise FileNotFoundError(f"Evidence source not found: {source_path}")

        # Generate evidence ID
        evidence_id = f"EVD-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        # Calculate original hashes
        orig_md5, orig_sha256 = self._calculate_hash(source)

        # Copy to evidence repository
        dest_dir = self.evidence_root / category
        dest_path = dest_dir / f"{evidence_id}_{source.name}"
        shutil.copy2(source, dest_path)

        # Verify copy integrity
        copy_md5, copy_sha256 = self._calculate_hash(dest_path)

        if orig_sha256 != copy_sha256:
            raise ValueError("Evidence integrity check failed - hash mismatch")

        # Create evidence metadata
        evidence_record = {
            'evidence_id': evidence_id,
            'original_path': str(source),
            'stored_path': str(dest_path),
            'category': category,
            'description': description,
            'collection_time': datetime.utcnow().isoformat(),
            'collected_by': analyst,
            'original_modified_time': datetime.fromtimestamp(
                source.stat().st_mtime
            ).isoformat(),
            'file_size': source.stat().st_size,
            'md5_hash': orig_md5,
            'sha256_hash': orig_sha256,
            'integrity_verified': True
        }

        # Log chain of custody
        self._log_custody_event(
            action='evidence_collected',
            details=f"Collected {source.name}: {description}",
            evidence_id=evidence_id,
            analyst=analyst
        )

        # Write metadata file
        metadata_path = dest_path.with_suffix(dest_path.suffix + '.metadata.json')
        import json
        with open(metadata_path, 'w') as f:
            json.dump(evidence_record, f, indent=2)

        return evidence_record

    def collect_memory_dump(self, hostname: str, analyst: str) -> dict:
        """
        Document memory acquisition from a system.
        """
        evidence_id = f"MEM-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        # In practice, this would trigger memory acquisition tools
        # For documentation purposes:
        acquisition_record = {
            'evidence_id': evidence_id,
            'hostname': hostname,
            'acquisition_time': datetime.utcnow().isoformat(),
            'acquired_by': analyst,
            'tool_used': 'winpmem/linpmem',
            'status': 'pending'
        }

        self._log_custody_event(
            action='memory_acquisition_initiated',
            details=f"Memory dump initiated for {hostname}",
            evidence_id=evidence_id,
            analyst=analyst
        )

        return acquisition_record
```

### Phase 3: Containment

Containment focuses on limiting the damage from an incident and preventing further spread. This phase typically has both short-term and long-term containment strategies.

**Containment Strategies:**

```python
from enum import Enum
from typing import List, Dict, Optional
from dataclasses import dataclass
import subprocess
import logging

logger = logging.getLogger(__name__)

class ContainmentAction(Enum):
    NETWORK_ISOLATE = "network_isolate"
    DISABLE_ACCOUNT = "disable_account"
    BLOCK_IP = "block_ip"
    BLOCK_DOMAIN = "block_domain"
    QUARANTINE_FILE = "quarantine_file"
    DISABLE_SERVICE = "disable_service"
    RESET_CREDENTIALS = "reset_credentials"

@dataclass
class ContainmentDecision:
    """
    Document containment decision and rationale.
    """
    action: ContainmentAction
    target: str
    rationale: str
    approved_by: str
    risks: List[str]
    rollback_procedure: str
    executed: bool = False
    execution_time: Optional[str] = None


class ContainmentManager:
    """
    Manage incident containment actions.
    """

    def __init__(self, incident_id: str):
        self.incident_id = incident_id
        self.actions_taken: List[ContainmentDecision] = []

    def evaluate_containment_options(self, incident_type: str,
                                    affected_systems: List[str]) -> List[dict]:
        """
        Evaluate containment options based on incident type.
        """
        options = {
            'malware': [
                {
                    'action': ContainmentAction.NETWORK_ISOLATE,
                    'description': 'Isolate infected systems from network',
                    'effectiveness': 'high',
                    'business_impact': 'high',
                    'recommended_for': 'Active spreading malware'
                },
                {
                    'action': ContainmentAction.QUARANTINE_FILE,
                    'description': 'Quarantine malicious files',
                    'effectiveness': 'medium',
                    'business_impact': 'low',
                    'recommended_for': 'Identified malware samples'
                },
                {
                    'action': ContainmentAction.BLOCK_DOMAIN,
                    'description': 'Block C2 domains at DNS/proxy',
                    'effectiveness': 'high',
                    'business_impact': 'low',
                    'recommended_for': 'Known C2 infrastructure'
                }
            ],
            'unauthorized_access': [
                {
                    'action': ContainmentAction.DISABLE_ACCOUNT,
                    'description': 'Disable compromised accounts',
                    'effectiveness': 'high',
                    'business_impact': 'medium',
                    'recommended_for': 'Confirmed account compromise'
                },
                {
                    'action': ContainmentAction.RESET_CREDENTIALS,
                    'description': 'Force password reset',
                    'effectiveness': 'high',
                    'business_impact': 'medium',
                    'recommended_for': 'Suspected credential theft'
                },
                {
                    'action': ContainmentAction.BLOCK_IP,
                    'description': 'Block attacker IP addresses',
                    'effectiveness': 'medium',
                    'business_impact': 'low',
                    'recommended_for': 'Known attacker infrastructure'
                }
            ],
            'data_breach': [
                {
                    'action': ContainmentAction.NETWORK_ISOLATE,
                    'description': 'Isolate affected data stores',
                    'effectiveness': 'high',
                    'business_impact': 'high',
                    'recommended_for': 'Active exfiltration'
                },
                {
                    'action': ContainmentAction.DISABLE_SERVICE,
                    'description': 'Disable affected services',
                    'effectiveness': 'high',
                    'business_impact': 'high',
                    'recommended_for': 'Service exploitation'
                }
            ]
        }

        return options.get(incident_type, [])

    def execute_network_isolation(self, hostname: str,
                                 vlan_id: str = 'quarantine') -> bool:
        """
        Isolate a system by moving to quarantine VLAN.
        """
        # This would integrate with network management systems
        # Example using network automation:
        isolation_commands = f"""
        # Example Cisco switch commands for VLAN isolation
        interface {hostname}_port
          switchport access vlan {vlan_id}
          shutdown
          no shutdown
        """

        logger.info(f"Executing network isolation for {hostname}")

        # In practice, execute through network automation platform
        # For example, using Ansible, NAPALM, or vendor APIs

        return True

    def block_indicators(self, ioc_type: str, values: List[str]) -> Dict[str, bool]:
        """
        Block indicators of compromise at various security controls.
        """
        results = {}

        for value in values:
            if ioc_type == 'ip':
                # Block at firewall
                results[value] = self._block_ip_firewall(value)
            elif ioc_type == 'domain':
                # Block at DNS/proxy
                results[value] = self._block_domain_dns(value)
            elif ioc_type == 'hash':
                # Add to EDR blocklist
                results[value] = self._block_hash_edr(value)

        return results

    def _block_ip_firewall(self, ip: str) -> bool:
        """Block IP at perimeter firewall."""
        # Integration with firewall API
        logger.info(f"Blocking IP {ip} at firewall")
        return True

    def _block_domain_dns(self, domain: str) -> bool:
        """Block domain at DNS resolver."""
        logger.info(f"Blocking domain {domain} at DNS")
        return True

    def _block_hash_edr(self, file_hash: str) -> bool:
        """Add hash to EDR blocklist."""
        logger.info(f"Adding hash {file_hash} to EDR blocklist")
        return True

    def disable_user_account(self, username: str, domain: str = None) -> bool:
        """
        Disable a user account in Active Directory or identity provider.
        """
        # Example using PowerShell for AD
        if domain:
            # Active Directory
            ps_command = f'Disable-ADAccount -Identity "{username}"'
            logger.info(f"Disabling AD account: {username}")
        else:
            # Could integrate with identity providers like Okta, Azure AD
            logger.info(f"Disabling account: {username}")

        return True

    def document_containment(self, action: ContainmentDecision):
        """Document containment action taken."""
        self.actions_taken.append(action)
        logger.info(
            f"Containment action documented: {action.action.value} on {action.target}"
        )
```

### Phase 4: Eradication

Eradication involves removing the threat from the environment, including malware, backdoors, and any artifacts left by the attacker.

**Eradication Procedures:**

```python
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class EradicationTask:
    """Track eradication task status."""
    task_id: str
    description: str
    target_system: str
    status: str  # pending, in_progress, completed, failed
    assigned_to: str
    created_time: datetime
    completed_time: datetime = None
    verification_status: str = None
    notes: str = ""


class EradicationManager:
    """
    Manage threat eradication activities.
    """

    def __init__(self, incident_id: str):
        self.incident_id = incident_id
        self.tasks: List[EradicationTask] = []
        self.root_cause_analysis: Dict[str, Any] = {}

    def identify_root_cause(self, investigation_data: dict) -> dict:
        """
        Document root cause analysis findings.
        """
        self.root_cause_analysis = {
            'incident_id': self.incident_id,
            'analysis_time': datetime.utcnow().isoformat(),
            'initial_access': {
                'vector': investigation_data.get('initial_vector'),
                'timestamp': investigation_data.get('first_evidence'),
                'details': investigation_data.get('access_details')
            },
            'vulnerabilities_exploited': investigation_data.get('vulnerabilities', []),
            'misconfigurations': investigation_data.get('misconfigurations', []),
            'contributing_factors': investigation_data.get('contributing_factors', []),
            'attack_chain': investigation_data.get('attack_chain', [])
        }

        return self.root_cause_analysis

    def generate_eradication_plan(self, findings: dict) -> List[EradicationTask]:
        """
        Generate eradication tasks based on investigation findings.
        """
        tasks = []
        task_counter = 1

        # Remove malware from affected systems
        for system in findings.get('infected_systems', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"Remove malware and artifacts from {system}",
                target_system=system,
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        # Remove persistence mechanisms
        for persistence in findings.get('persistence_mechanisms', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"Remove persistence: {persistence['type']} on {persistence['system']}",
                target_system=persistence['system'],
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        # Patch vulnerabilities
        for vuln in findings.get('vulnerabilities', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"Patch vulnerability: {vuln['cve']} on affected systems",
                target_system=vuln.get('affected_systems', 'multiple'),
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        # Reset compromised credentials
        for account in findings.get('compromised_accounts', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"Reset credentials for {account}",
                target_system='identity_provider',
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        # Remove attacker access
        for backdoor in findings.get('backdoors', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"Remove backdoor: {backdoor['type']} on {backdoor['location']}",
                target_system=backdoor['system'],
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        self.tasks = tasks
        return tasks

    def verify_eradication(self, task: EradicationTask) -> dict:
        """
        Verify that eradication was successful.
        """
        verification_checks = {
            'malware_scan': {
                'description': 'Run full antivirus/EDR scan',
                'passed': False
            },
            'ioc_search': {
                'description': 'Search for known indicators',
                'passed': False
            },
            'persistence_check': {
                'description': 'Verify no persistence mechanisms remain',
                'passed': False
            },
            'network_monitoring': {
                'description': 'Monitor for suspicious network activity',
                'passed': False
            },
            'log_review': {
                'description': 'Review logs for signs of continued compromise',
                'passed': False
            }
        }

        # In practice, these would be automated checks
        logger.info(f"Running eradication verification for task {task.task_id}")

        return verification_checks
```

### Phase 5: Recovery

Recovery involves safely restoring systems to normal operation and validating that they are functioning properly and securely.

**Recovery Procedures:**

```python
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class RecoveryPhase(Enum):
    PLANNING = "planning"
    VALIDATION = "validation"
    RESTORATION = "restoration"
    TESTING = "testing"
    MONITORING = "monitoring"
    COMPLETE = "complete"

@dataclass
class SystemRecovery:
    """Track system recovery status."""
    system_name: str
    criticality: str  # critical, high, medium, low
    current_phase: RecoveryPhase
    restoration_method: str  # rebuild, restore_backup, patch_in_place
    backup_date: Optional[datetime]
    recovery_start: datetime
    recovery_complete: Optional[datetime]
    validation_results: Dict[str, bool]
    approved_for_production: bool = False


class RecoveryManager:
    """
    Manage system recovery and validation.
    """

    def __init__(self, incident_id: str):
        self.incident_id = incident_id
        self.recovery_queue: List[SystemRecovery] = []
        self.recovery_criteria: Dict[str, List[str]] = {}

    def prioritize_recovery(self, affected_systems: List[dict]) -> List[dict]:
        """
        Prioritize systems for recovery based on business criticality.
        """
        # Sort by criticality and dependencies
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}

        sorted_systems = sorted(
            affected_systems,
            key=lambda x: (
                priority_order.get(x.get('criticality', 'low'), 3),
                -len(x.get('dependencies', []))  # Systems with fewer dependencies first
            )
        )

        # Add recovery sequence numbers
        for i, system in enumerate(sorted_systems):
            system['recovery_sequence'] = i + 1
            system['estimated_recovery_time'] = self._estimate_recovery_time(system)

        return sorted_systems

    def _estimate_recovery_time(self, system: dict) -> str:
        """Estimate recovery time based on system characteristics."""
        base_time = {
            'rebuild': 4,  # hours
            'restore_backup': 2,
            'patch_in_place': 1
        }

        method = system.get('restoration_method', 'rebuild')
        hours = base_time.get(method, 4)

        # Adjust for complexity
        if system.get('has_database'):
            hours += 2
        if system.get('custom_config'):
            hours += 1

        return f"{hours} hours"

    def define_recovery_criteria(self, system_type: str) -> List[str]:
        """
        Define criteria that must be met before system returns to production.
        """
        base_criteria = [
            'System passes all security scans',
            'No indicators of compromise detected',
            'All patches and updates applied',
            'Security configurations verified',
            'Logging and monitoring enabled',
            'Backup verified and scheduled'
        ]

        type_specific = {
            'web_server': [
                'Web application security scan passed',
                'SSL/TLS certificates valid',
                'WAF rules configured',
                'Access controls verified'
            ],
            'database': [
                'Database integrity verified',
                'Access credentials rotated',
                'Encryption at rest enabled',
                'Audit logging configured'
            ],
            'workstation': [
                'EDR agent installed and reporting',
                'User credentials reset',
                'Local admin privileges removed',
                'Application allowlist enforced'
            ],
            'domain_controller': [
                'Kerberos tickets invalidated',
                'KRBTGT password rotated twice',
                'Trust relationships verified',
                'Group policies audited'
            ]
        }

        criteria = base_criteria + type_specific.get(system_type, [])
        self.recovery_criteria[system_type] = criteria
        return criteria

    def validate_system_recovery(self, recovery: SystemRecovery) -> Dict[str, bool]:
        """
        Validate that recovered system meets all criteria.
        """
        validation_results = {}

        validation_checks = [
            ('security_scan', self._run_security_scan),
            ('ioc_check', self._check_for_iocs),
            ('patch_verification', self._verify_patches),
            ('config_audit', self._audit_security_config),
            ('monitoring_check', self._verify_monitoring),
            ('backup_check', self._verify_backup)
        ]

        for check_name, check_func in validation_checks:
            try:
                result = check_func(recovery.system_name)
                validation_results[check_name] = result
                logger.info(
                    f"Validation {check_name} for {recovery.system_name}: "
                    f"{'PASSED' if result else 'FAILED'}"
                )
            except Exception as e:
                validation_results[check_name] = False
                logger.error(f"Validation {check_name} error: {e}")

        recovery.validation_results = validation_results
        recovery.approved_for_production = all(validation_results.values())

        return validation_results

    def _run_security_scan(self, system: str) -> bool:
        """Run comprehensive security scan."""
        logger.info(f"Running security scan on {system}")
        return True  # Placeholder

    def _check_for_iocs(self, system: str) -> bool:
        """Check for indicators of compromise."""
        logger.info(f"Checking IOCs on {system}")
        return True  # Placeholder

    def _verify_patches(self, system: str) -> bool:
        """Verify all patches are applied."""
        logger.info(f"Verifying patches on {system}")
        return True  # Placeholder

    def _audit_security_config(self, system: str) -> bool:
        """Audit security configuration."""
        logger.info(f"Auditing security config on {system}")
        return True  # Placeholder

    def _verify_monitoring(self, system: str) -> bool:
        """Verify monitoring is active."""
        logger.info(f"Verifying monitoring on {system}")
        return True  # Placeholder

    def _verify_backup(self, system: str) -> bool:
        """Verify backup is configured."""
        logger.info(f"Verifying backup on {system}")
        return True  # Placeholder

    def implement_enhanced_monitoring(self, systems: List[str],
                                     duration_days: int = 30) -> dict:
        """
        Implement enhanced monitoring for recovered systems.
        """
        monitoring_config = {
            'duration': f"{duration_days} days",
            'start_time': datetime.utcnow().isoformat(),
            'systems': systems,
            'enhanced_alerts': [
                'Authentication anomalies',
                'Unusual process execution',
                'Network connection to known-bad IPs',
                'File integrity changes',
                'Privilege escalation attempts',
                'Lateral movement indicators'
            ],
            'log_retention': 'extended',
            'review_frequency': 'daily'
        }

        logger.info(
            f"Enhanced monitoring configured for {len(systems)} systems "
            f"for {duration_days} days"
        )

        return monitoring_config
```

### Phase 6: Lessons Learned

The lessons learned phase is critical for improving future incident response capabilities. This phase involves conducting post-incident reviews and implementing improvements.

**Post-Incident Review Process:**

```python
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

@dataclass
class LessonsLearned:
    """
    Document lessons learned from an incident.
    """
    incident_id: str
    incident_summary: str
    review_date: datetime
    participants: List[str]

    # Timeline analysis
    timeline_assessment: Dict[str, Any] = field(default_factory=dict)

    # What worked well
    successes: List[str] = field(default_factory=list)

    # Areas for improvement
    improvements: List[Dict[str, str]] = field(default_factory=list)

    # Action items
    action_items: List[Dict[str, Any]] = field(default_factory=list)

    # Metrics
    metrics: Dict[str, Any] = field(default_factory=dict)


class PostIncidentReview:
    """
    Conduct and document post-incident reviews.
    """

    REVIEW_QUESTIONS = {
        'detection': [
            'How was the incident initially detected?',
            'How long did it take to detect the incident?',
            'Were there earlier indicators that were missed?',
            'How can detection capabilities be improved?'
        ],
        'response': [
            'Was the incident response plan followed?',
            'Were roles and responsibilities clear?',
            'Was communication effective internally and externally?',
            'Were the right people involved at the right times?'
        ],
        'containment': [
            'How quickly was the threat contained?',
            'Were containment actions effective?',
            'What was the business impact of containment decisions?',
            'Could containment have been faster or less disruptive?'
        ],
        'eradication': [
            'Was the root cause identified?',
            'Were all threats completely removed?',
            'Were vulnerabilities properly addressed?',
            'Was the eradication verified?'
        ],
        'recovery': [
            'How long did recovery take?',
            'Were systems properly validated before returning to production?',
            'Was enhanced monitoring implemented?',
            'Were backups adequate for recovery needs?'
        ],
        'overall': [
            'What tools or capabilities were missing?',
            'What training would have helped?',
            'What process improvements are needed?',
            'What would we do differently next time?'
        ]
    }

    def __init__(self, incident_id: str):
        self.incident_id = incident_id
        self.lessons_learned: Optional[LessonsLearned] = None

    def calculate_metrics(self, incident_timeline: dict) -> Dict[str, Any]:
        """
        Calculate key incident response metrics.
        """
        metrics = {
            'mttd': None,  # Mean Time to Detect
            'mttr': None,  # Mean Time to Respond
            'mttc': None,  # Mean Time to Contain
            'mttre': None,  # Mean Time to Eradicate
            'total_duration': None,
            'business_impact': {}
        }

        # Calculate detection time
        if incident_timeline.get('initial_compromise') and incident_timeline.get('detection'):
            compromise_time = datetime.fromisoformat(incident_timeline['initial_compromise'])
            detection_time = datetime.fromisoformat(incident_timeline['detection'])
            metrics['mttd'] = str(detection_time - compromise_time)

        # Calculate response time
        if incident_timeline.get('detection') and incident_timeline.get('response_started'):
            detection_time = datetime.fromisoformat(incident_timeline['detection'])
            response_time = datetime.fromisoformat(incident_timeline['response_started'])
            metrics['mttr'] = str(response_time - detection_time)

        # Calculate containment time
        if incident_timeline.get('response_started') and incident_timeline.get('contained'):
            response_time = datetime.fromisoformat(incident_timeline['response_started'])
            containment_time = datetime.fromisoformat(incident_timeline['contained'])
            metrics['mttc'] = str(containment_time - response_time)

        # Calculate total duration
        if incident_timeline.get('initial_compromise') and incident_timeline.get('closed'):
            start = datetime.fromisoformat(incident_timeline['initial_compromise'])
            end = datetime.fromisoformat(incident_timeline['closed'])
            metrics['total_duration'] = str(end - start)

        return metrics

    def generate_action_items(self, findings: List[dict]) -> List[Dict[str, Any]]:
        """
        Generate action items from lessons learned.
        """
        action_items = []

        for finding in findings:
            action_item = {
                'id': f"AI-{self.incident_id}-{len(action_items) + 1:03d}",
                'finding': finding['description'],
                'action': finding['recommended_action'],
                'priority': finding.get('priority', 'medium'),
                'owner': finding.get('owner', 'TBD'),
                'due_date': finding.get('due_date'),
                'status': 'open',
                'category': finding.get('category', 'process')
            }
            action_items.append(action_item)

        return action_items

    def create_executive_summary(self, lessons: LessonsLearned) -> str:
        """
        Generate executive summary for leadership.
        """
        summary = f"""
# Incident Post-Mortem Executive Summary

## Incident: {lessons.incident_id}

### Summary
{lessons.incident_summary}

### Key Metrics
- Time to Detect: {lessons.metrics.get('mttd', 'N/A')}
- Time to Respond: {lessons.metrics.get('mttr', 'N/A')}
- Time to Contain: {lessons.metrics.get('mttc', 'N/A')}
- Total Duration: {lessons.metrics.get('total_duration', 'N/A')}

### What Went Well
{chr(10).join(f'- {success}' for success in lessons.successes)}

### Areas for Improvement
{chr(10).join(f"- {imp['area']}: {imp['description']}" for imp in lessons.improvements)}

### Key Action Items
{chr(10).join(f"- [{item['priority'].upper()}] {item['action']} (Owner: {item['owner']})" for item in lessons.action_items[:5])}

### Recommendations
Based on this incident, we recommend prioritizing investments in:
1. Enhanced detection capabilities
2. Improved response procedures
3. Additional staff training
4. Tool and automation improvements

Review Date: {lessons.review_date.strftime('%Y-%m-%d')}
Participants: {', '.join(lessons.participants)}
"""
        return summary

    def update_playbooks(self, lessons: LessonsLearned) -> List[str]:
        """
        Identify playbook updates based on lessons learned.
        """
        updates = []

        for improvement in lessons.improvements:
            if improvement.get('requires_playbook_update'):
                updates.append({
                    'playbook': improvement['affected_playbook'],
                    'section': improvement['section'],
                    'change': improvement['recommended_change'],
                    'rationale': improvement['description']
                })

        return updates
```

## Incident Response Playbooks

Playbooks provide step-by-step procedures for handling specific types of incidents. Well-designed playbooks ensure consistent, effective response regardless of which team member is handling the incident.

**Playbook Template:**

```yaml
# Incident Response Playbook Template
playbook:
  name: "Ransomware Incident Response"
  version: "2.1"
  last_updated: "2024-01-15"
  author: "IR Team"

  overview:
    description: |
      This playbook provides procedures for responding to ransomware incidents,
      including initial detection, containment, eradication, and recovery.

    trigger_conditions:
      - Ransomware detected by EDR/AV
      - User reports encrypted files
      - Ransom note discovered
      - Unusual file encryption activity detected

    severity: "Critical"

    objectives:
      - Contain the spread of ransomware
      - Preserve evidence for investigation
      - Identify the ransomware variant
      - Determine scope of impact
      - Recover encrypted data
      - Prevent reinfection

  roles_required:
    - IR Lead
    - Malware Analyst
    - Network Security
    - System Administrator
    - Communications Lead

  phases:
    - phase: 1
      name: "Initial Response"
      time_limit: "15 minutes"

      steps:
        - step: 1.1
          action: "Confirm ransomware activity"
          details: |
            - Review alert details from detection source
            - Check for ransom notes on affected systems
            - Verify file encryption indicators
            - Document initial findings
          tools: ["EDR Console", "File Share Access"]
          responsible: "IR Lead"

        - step: 1.2
          action: "Activate incident response"
          details: |
            - Create incident ticket
            - Notify IR team members
            - Establish communication channel
            - Begin incident timeline
          tools: ["Ticketing System", "Slack/Teams"]
          responsible: "IR Lead"

        - step: 1.3
          action: "Initial containment decision"
          details: |
            - Assess spread indicators
            - Determine if network isolation needed
            - Identify critical systems at risk
            - Get approval for containment actions
          decision_tree:
            - condition: "Active encryption spreading"
              action: "Immediate network isolation"
            - condition: "Single system affected"
              action: "Isolate affected system only"
            - condition: "Unclear scope"
              action: "Segment network, investigate further"
          responsible: "IR Lead"

    - phase: 2
      name: "Containment"
      time_limit: "1 hour"

      steps:
        - step: 2.1
          action: "Network isolation"
          details: |
            - Disconnect affected systems from network
            - Block lateral movement paths
            - Implement network segmentation
            - Disable shared drives if necessary
          commands:
            windows: |
              # Disable network adapters
              Get-NetAdapter | Disable-NetAdapter -Confirm:$false

              # Or isolate via firewall
              netsh advfirewall set allprofiles firewallpolicy blockinbound,blockoutbound
            linux: |
              # Disable network interfaces
              ip link set eth0 down

              # Or block all traffic
              iptables -P INPUT DROP
              iptables -P OUTPUT DROP
              iptables -P FORWARD DROP
          responsible: "Network Security"

        - step: 2.2
          action: "Preserve evidence"
          details: |
            - Capture memory from affected systems
            - Collect ransom notes
            - Document encrypted file extensions
            - Preserve system logs
          evidence_items:
            - "Memory dump"
            - "Ransom note files"
            - "Malware samples"
            - "Event logs"
            - "Network traffic captures"
          responsible: "IR Lead"

        - step: 2.3
          action: "Block known indicators"
          details: |
            - Add file hashes to EDR blocklist
            - Block C2 domains/IPs at firewall
            - Update email filters for known IOCs
          responsible: "Network Security"

    - phase: 3
      name: "Investigation"
      time_limit: "4 hours"

      steps:
        - step: 3.1
          action: "Identify ransomware variant"
          details: |
            - Analyze ransom note for variant identification
            - Submit samples to malware analysis
            - Check ransomware identification services
            - Document variant characteristics
          resources:
            - "ID Ransomware (https://id-ransomware.malwarehunterteam.com)"
            - "No More Ransom (https://www.nomoreransom.org)"
            - "VirusTotal"
          responsible: "Malware Analyst"

        - step: 3.2
          action: "Determine scope"
          details: |
            - Identify all affected systems
            - Determine data impact
            - Identify initial infection vector
            - Map lateral movement
          queries:
            siem: |
              # Search for ransomware indicators
              index=endpoint
              (process_name="*.exe" OR file_extension IN ("*.encrypted", "*.locked"))
              | stats count by host, process_name
            edr: |
              # Query for encryption activity
              FileCreate
              | where FileName matches "*.encrypted|*.locked|DECRYPT*.txt"
              | summarize count() by DeviceName
          responsible: "IR Lead"

        - step: 3.3
          action: "Identify initial access"
          details: |
            - Review email logs for phishing
            - Check VPN/remote access logs
            - Review patch status of affected systems
            - Analyze exploitation indicators
          responsible: "IR Lead"

    - phase: 4
      name: "Eradication"
      time_limit: "Variable"

      steps:
        - step: 4.1
          action: "Remove ransomware"
          details: |
            - Run full AV/EDR scans
            - Remove identified malware files
            - Clean registry entries
            - Remove persistence mechanisms
          responsible: "System Administrator"

        - step: 4.2
          action: "Patch vulnerabilities"
          details: |
            - Apply security patches to exploited vulnerabilities
            - Update antivirus signatures
            - Strengthen security configurations
          responsible: "System Administrator"

        - step: 4.3
          action: "Reset credentials"
          details: |
            - Reset passwords for affected accounts
            - Rotate service account credentials
            - Invalidate active sessions
            - Review and update access permissions
          responsible: "System Administrator"

    - phase: 5
      name: "Recovery"
      time_limit: "Variable"

      steps:
        - step: 5.1
          action: "Assess recovery options"
          details: |
            - Check for available decryption tools
            - Evaluate backup integrity
            - Assess rebuild requirements
          decision_tree:
            - condition: "Decryptor available"
              action: "Use decryption tool"
            - condition: "Clean backups available"
              action: "Restore from backup"
            - condition: "No recovery options"
              action: "Rebuild systems"
          responsible: "IR Lead"

        - step: 5.2
          action: "Restore systems"
          details: |
            - Restore from verified clean backups
            - Rebuild systems if necessary
            - Apply security hardening
            - Install monitoring agents
          responsible: "System Administrator"

        - step: 5.3
          action: "Validate recovery"
          details: |
            - Verify system functionality
            - Confirm no ransomware remains
            - Test security controls
            - Enable enhanced monitoring
          responsible: "IR Lead"

    - phase: 6
      name: "Post-Incident"

      steps:
        - step: 6.1
          action: "Documentation"
          details: |
            - Complete incident report
            - Document timeline
            - Record all actions taken
            - Preserve evidence
          responsible: "IR Lead"

        - step: 6.2
          action: "Lessons learned"
          details: |
            - Schedule post-incident review
            - Identify improvements
            - Update playbooks
            - Assign action items
          responsible: "IR Lead"

        - step: 6.3
          action: "Communication"
          details: |
            - Prepare internal report for leadership
            - Assess regulatory notification requirements
            - Plan customer/stakeholder communication if needed
          responsible: "Communications Lead"

  appendices:
    communication_templates:
      initial_notification: |
        Subject: Security Incident - Ransomware Detection

        A ransomware incident has been detected affecting [SCOPE].
        The incident response team has been activated.

        Current Status: [STATUS]
        Next Update: [TIME]

        Actions Required:
        - Do not attempt to access affected systems
        - Report any suspicious activity
        - Preserve any relevant evidence

      status_update: |
        Subject: Security Incident Update - [INCIDENT_ID]

        Incident Status: [STATUS]
        Systems Affected: [COUNT]
        Current Phase: [PHASE]

        Recent Actions:
        [ACTIONS]

        Next Steps:
        [NEXT_STEPS]

        Next Update: [TIME]

    escalation_criteria:
      immediate:
        - "Ransomware spreading to critical systems"
        - "Customer data confirmed encrypted"
        - "Backup systems compromised"
        - "Ransom demand received"
      within_1_hour:
        - "More than 10 systems affected"
        - "Domain controller involved"
        - "Financial systems impacted"

    reference_materials:
      - "NIST Ransomware Guidelines"
      - "CISA Ransomware Guide"
      - "Internal backup procedures"
      - "Business continuity plan"
```

**Phishing Incident Playbook:**

```python
class PhishingPlaybook:
    """
    Automated phishing incident response playbook.
    """

    def __init__(self, incident_id: str, email_sample: dict):
        self.incident_id = incident_id
        self.email_sample = email_sample
        self.affected_users: List[str] = []
        self.indicators: Dict[str, List[str]] = {
            'sender_addresses': [],
            'urls': [],
            'attachments': [],
            'ip_addresses': []
        }

    def extract_indicators(self) -> Dict[str, List[str]]:
        """
        Extract IOCs from phishing email.
        """
        import re

        # Extract sender
        self.indicators['sender_addresses'].append(
            self.email_sample.get('from', '')
        )

        # Extract URLs from body
        body = self.email_sample.get('body', '')
        urls = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', body)
        self.indicators['urls'].extend(urls)

        # Extract attachment hashes
        for attachment in self.email_sample.get('attachments', []):
            if attachment.get('hash'):
                self.indicators['attachments'].append(attachment['hash'])

        # Extract sending IP
        headers = self.email_sample.get('headers', {})
        received = headers.get('received', '')
        ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', received)
        self.indicators['ip_addresses'].extend(ips)

        return self.indicators

    def search_mailboxes(self, email_gateway_api) -> List[str]:
        """
        Search for all recipients of the phishing email.
        """
        # Build search query based on indicators
        search_criteria = {
            'sender': self.indicators['sender_addresses'],
            'subject': self.email_sample.get('subject'),
            'timeframe': '24h'
        }

        # Query email gateway
        results = email_gateway_api.search(search_criteria)

        self.affected_users = [r['recipient'] for r in results]
        return self.affected_users

    def quarantine_emails(self, email_gateway_api) -> dict:
        """
        Quarantine phishing emails from all mailboxes.
        """
        quarantine_results = {
            'success': [],
            'failed': []
        }

        for user in self.affected_users:
            try:
                email_gateway_api.quarantine(
                    user=user,
                    criteria={
                        'sender': self.indicators['sender_addresses'],
                        'subject': self.email_sample.get('subject')
                    }
                )
                quarantine_results['success'].append(user)
            except Exception as e:
                quarantine_results['failed'].append({
                    'user': user,
                    'error': str(e)
                })

        return quarantine_results

    def identify_clickers(self, proxy_logs, click_timeframe: str = '24h') -> List[dict]:
        """
        Identify users who clicked phishing links.
        """
        clickers = []

        for url in self.indicators['urls']:
            # Query proxy logs for URL access
            clicks = proxy_logs.search(
                url=url,
                timeframe=click_timeframe
            )

            for click in clicks:
                clickers.append({
                    'user': click['user'],
                    'url': url,
                    'timestamp': click['timestamp'],
                    'user_agent': click['user_agent']
                })

        return clickers

    def assess_credential_compromise(self, clickers: List[dict]) -> List[dict]:
        """
        Assess if credentials may have been compromised.
        """
        compromised = []

        for clicker in clickers:
            # Check if user submitted credentials
            # This would query web proxy POST data or form submissions
            risk_assessment = {
                'user': clicker['user'],
                'clicked_url': clicker['url'],
                'likely_entered_credentials': False,  # Determine from POST data
                'recommended_action': 'password_reset'
            }

            compromised.append(risk_assessment)

        return compromised

    def generate_response_actions(self) -> List[dict]:
        """
        Generate list of response actions based on analysis.
        """
        actions = []

        # Block indicators
        actions.append({
            'action': 'block_sender',
            'target': self.indicators['sender_addresses'],
            'system': 'email_gateway'
        })

        actions.append({
            'action': 'block_urls',
            'target': self.indicators['urls'],
            'system': 'web_proxy'
        })

        # User notifications
        actions.append({
            'action': 'notify_users',
            'target': self.affected_users,
            'message_type': 'phishing_warning'
        })

        # Credential reset for clickers
        actions.append({
            'action': 'force_password_reset',
            'target': [c['user'] for c in self.identify_clickers([])],
            'system': 'identity_provider'
        })

        return actions
```

## Incident Response Tools

Effective incident response requires a variety of tools for detection, analysis, containment, and recovery.

**Essential IR Tool Categories:**

```
Incident Response Tool Stack:
+-------------------------------------------------------------------------+
|                           Detection & Monitoring                         |
| +-------------------+ +-------------------+ +-------------------+        |
| |      SIEM         | |   EDR Platform    | |  Network IDS     |        |
| | - Splunk          | | - CrowdStrike     | | - Suricata       |        |
| | - Elastic SIEM    | | - Carbon Black    | | - Zeek           |        |
| | - Microsoft       | | - SentinelOne     | | - Snort          |        |
| |   Sentinel        | | - Defender ATP    | |                  |        |
| +-------------------+ +-------------------+ +-------------------+        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         Investigation & Analysis                         |
| +-------------------+ +-------------------+ +-------------------+        |
| | Forensics Tools   | | Malware Analysis  | | Network Analysis |        |
| | - Autopsy         | | - Cuckoo Sandbox  | | - Wireshark      |        |
| | - FTK             | | - Any.Run         | | - NetworkMiner   |        |
| | - Velociraptor    | | - REMnux          | | - Moloch         |        |
| | - KAPE            | | - Ghidra          | | - Rita           |        |
| +-------------------+ +-------------------+ +-------------------+        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        Response & Containment                            |
| +-------------------+ +-------------------+ +-------------------+        |
| | Orchestration     | | Threat Intel      | | Communication    |        |
| | - TheHive         | | - MISP            | | - Slack          |        |
| | - Cortex XSOAR    | | - OpenCTI         | | - PagerDuty      |        |
| | - Shuffle         | | - ThreatConnect   | | - Jira           |        |
| | - Swimlane        | |                   | |                  |        |
| +-------------------+ +-------------------+ +-------------------+        |
+-------------------------------------------------------------------------+
```

**SIEM Query Examples:**

```python
class SIEMQueries:
    """
    Common SIEM queries for incident investigation.
    """

    SPLUNK_QUERIES = {
        'failed_logins': '''
            index=auth sourcetype=windows:security EventCode=4625
            | stats count by src_ip, user, dest
            | where count > 5
            | sort -count
        ''',

        'lateral_movement': '''
            index=endpoint sourcetype=windows:security
            (EventCode=4624 Logon_Type=3) OR (EventCode=4648)
            | stats count by src_ip, dest, user
            | where count > 1
            | table _time, src_ip, dest, user, count
        ''',

        'process_creation': '''
            index=endpoint sourcetype=sysmon EventCode=1
            | search process_name IN ("powershell.exe", "cmd.exe", "wscript.exe")
            | stats count by host, user, parent_process, process_name, command_line
            | sort -count
        ''',

        'dns_exfiltration': '''
            index=network sourcetype=dns
            | eval query_length=len(query)
            | where query_length > 50
            | stats count by src_ip, query
            | where count > 100
        ''',

        'ransomware_indicators': '''
            index=endpoint sourcetype=sysmon
            (EventCode=11 TargetFilename="*.encrypted" OR TargetFilename="*.locked")
            OR (EventCode=1 CommandLine="*vssadmin*delete*shadows*")
            OR (EventCode=1 CommandLine="*bcdedit*/set*recoveryenabled*no*")
            | stats count by host, EventCode, process_name
        '''
    }

    ELASTIC_QUERIES = {
        'brute_force': {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"event.category": "authentication"}},
                        {"match": {"event.outcome": "failure"}}
                    ],
                    "filter": [
                        {"range": {"@timestamp": {"gte": "now-1h"}}}
                    ]
                }
            },
            "aggs": {
                "by_source": {
                    "terms": {"field": "source.ip"},
                    "aggs": {
                        "by_user": {
                            "terms": {"field": "user.name"}
                        }
                    }
                }
            }
        },

        'suspicious_powershell': {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"process.name": "powershell.exe"}}
                    ],
                    "should": [
                        {"match": {"process.command_line": "encodedcommand"}},
                        {"match": {"process.command_line": "bypass"}},
                        {"match": {"process.command_line": "hidden"}},
                        {"match": {"process.command_line": "downloadstring"}}
                    ],
                    "minimum_should_match": 1
                }
            }
        }
    }
```

**Forensic Analysis Tools:**

```python
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

class ForensicToolkit:
    """
    Wrapper for common forensic tools and analysis.
    """

    def __init__(self, case_dir: str):
        self.case_dir = Path(case_dir)
        self.case_dir.mkdir(parents=True, exist_ok=True)

    def acquire_memory(self, target: str, tool: str = 'winpmem') -> str:
        """
        Acquire memory from target system.
        """
        output_file = self.case_dir / f"memory_{target}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.raw"

        if tool == 'winpmem':
            # Windows memory acquisition
            cmd = f'winpmem.exe -o {output_file}'
        elif tool == 'linpmem':
            # Linux memory acquisition
            cmd = f'linpmem -o {output_file}'

        # Execute acquisition
        # subprocess.run(cmd, shell=True, check=True)

        return str(output_file)

    def analyze_memory_volatility(self, memory_file: str,
                                  profile: str) -> Dict[str, any]:
        """
        Analyze memory dump using Volatility.
        """
        results = {}

        volatility_plugins = [
            'pslist',      # Running processes
            'pstree',      # Process tree
            'netscan',     # Network connections
            'malfind',     # Injected code
            'dlllist',     # Loaded DLLs
            'handles',     # Open handles
            'cmdline',     # Command line arguments
            'filescan',    # File objects
        ]

        for plugin in volatility_plugins:
            cmd = f'vol.py -f {memory_file} --profile={profile} {plugin}'
            # result = subprocess.run(cmd, shell=True, capture_output=True)
            # results[plugin] = result.stdout.decode()

        return results

    def create_timeline(self, evidence_sources: List[str]) -> List[Dict]:
        """
        Create super timeline from multiple evidence sources.
        """
        timeline_entries = []

        for source in evidence_sources:
            # Use plaso/log2timeline for timeline creation
            # cmd = f'log2timeline.py --storage-file timeline.plaso {source}'
            pass

        # Export timeline
        # cmd = 'psort.py -o dynamic timeline.plaso'

        return timeline_entries

    def extract_artifacts_kape(self, target_drive: str,
                              artifact_categories: List[str]) -> str:
        """
        Use KAPE to extract forensic artifacts.
        """
        output_dir = self.case_dir / 'kape_output'
        output_dir.mkdir(exist_ok=True)

        # Build KAPE targets string
        targets = ','.join(artifact_categories)

        cmd = f'kape.exe --tsource {target_drive} --tdest {output_dir} --target {targets}'
        # subprocess.run(cmd, shell=True, check=True)

        return str(output_dir)

    def parse_windows_events(self, evtx_file: str) -> List[Dict]:
        """
        Parse Windows event logs.
        """
        events = []

        # Using python-evtx or similar
        security_events_of_interest = [
            4624,  # Successful logon
            4625,  # Failed logon
            4648,  # Logon with explicit credentials
            4672,  # Special privileges assigned
            4688,  # Process creation
            4697,  # Service installed
            4698,  # Scheduled task created
            4720,  # User account created
            4732,  # Member added to security group
            7045,  # Service installed (System log)
        ]

        # Parse and filter events
        # This would use python-evtx or similar library

        return events

    def analyze_prefetch(self, prefetch_dir: str) -> List[Dict]:
        """
        Analyze Windows Prefetch files for execution evidence.
        """
        prefetch_data = []

        # Use PECmd or similar tool
        # cmd = f'PECmd.exe -d {prefetch_dir} --csv {self.case_dir}'

        return prefetch_data

    def extract_browser_history(self, user_profile: str) -> Dict[str, List]:
        """
        Extract browser history and artifacts.
        """
        browser_artifacts = {
            'chrome': [],
            'firefox': [],
            'edge': []
        }

        # Chrome history
        chrome_history = Path(user_profile) / 'AppData/Local/Google/Chrome/User Data/Default/History'

        # Firefox history
        firefox_profile = Path(user_profile) / 'AppData/Roaming/Mozilla/Firefox/Profiles'

        # Edge history
        edge_history = Path(user_profile) / 'AppData/Local/Microsoft/Edge/User Data/Default/History'

        # Parse SQLite databases
        # This would use sqlite3 to query browser databases

        return browser_artifacts
```

## Building an Incident Response Program

Creating a mature incident response capability requires organizational commitment and continuous improvement.

**IR Program Maturity Model:**

```
IR Program Maturity Levels:
+-------------------------------------------------------------------------+
| Level 5: Optimizing                                                     |
| - Continuous improvement driven by metrics                              |
| - Predictive threat detection                                           |
| - Fully automated response for common incidents                         |
| - Industry leadership and information sharing                           |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
| Level 4: Measured                                                       |
| - Comprehensive metrics and KPIs                                        |
| - Threat hunting program                                                |
| - Advanced automation and orchestration                                 |
| - Regular third-party assessments                                       |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
| Level 3: Defined                                                        |
| - Documented processes and playbooks                                    |
| - Dedicated IR team                                                     |
| - Integrated tooling and workflows                                      |
| - Regular training and exercises                                        |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
| Level 2: Developing                                                     |
| - Basic IR plan exists                                                  |
| - Some staff trained in IR                                              |
| - Basic detection capabilities                                          |
| - Ad-hoc response procedures                                            |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
| Level 1: Initial                                                        |
| - No formal IR capability                                               |
| - Reactive response only                                                |
| - Limited visibility and logging                                        |
| - No documented procedures                                              |
+-------------------------------------------------------------------------+
```

**Key Performance Indicators:**

```python
class IRMetrics:
    """
    Incident Response Key Performance Indicators.
    """

    KPIs = {
        'detection': {
            'mttd': {
                'name': 'Mean Time to Detect',
                'description': 'Average time from compromise to detection',
                'target': '< 24 hours',
                'calculation': 'Average(detection_time - compromise_time)',
                'data_source': 'Incident tickets'
            },
            'detection_rate': {
                'name': 'Detection Rate',
                'description': 'Percentage of incidents detected internally',
                'target': '> 80%',
                'calculation': '(Internal detections / Total incidents) * 100',
                'data_source': 'Incident tickets'
            },
            'false_positive_rate': {
                'name': 'False Positive Rate',
                'description': 'Percentage of alerts that are false positives',
                'target': '< 20%',
                'calculation': '(False positives / Total alerts) * 100',
                'data_source': 'SIEM/Alert data'
            }
        },
        'response': {
            'mttr': {
                'name': 'Mean Time to Respond',
                'description': 'Average time from detection to response initiation',
                'target': '< 1 hour',
                'calculation': 'Average(response_start - detection_time)',
                'data_source': 'Incident tickets'
            },
            'mttc': {
                'name': 'Mean Time to Contain',
                'description': 'Average time from detection to containment',
                'target': '< 4 hours',
                'calculation': 'Average(containment_time - detection_time)',
                'data_source': 'Incident tickets'
            },
            'mttre': {
                'name': 'Mean Time to Eradicate',
                'description': 'Average time to fully remove threat',
                'target': '< 24 hours',
                'calculation': 'Average(eradication_time - containment_time)',
                'data_source': 'Incident tickets'
            }
        },
        'recovery': {
            'mttr_recovery': {
                'name': 'Mean Time to Recover',
                'description': 'Average time to restore normal operations',
                'target': '< 48 hours',
                'calculation': 'Average(recovery_time - eradication_time)',
                'data_source': 'Incident tickets'
            },
            'data_loss': {
                'name': 'Data Loss Incidents',
                'description': 'Number of incidents with confirmed data loss',
                'target': '0',
                'calculation': 'Count of incidents with data_loss=true',
                'data_source': 'Incident tickets'
            }
        },
        'operational': {
            'incident_volume': {
                'name': 'Incident Volume',
                'description': 'Number of incidents per time period',
                'target': 'Trending down',
                'calculation': 'Count of incidents per month',
                'data_source': 'Incident tickets'
            },
            'recurrence_rate': {
                'name': 'Recurrence Rate',
                'description': 'Percentage of recurring incident types',
                'target': '< 10%',
                'calculation': '(Recurring incidents / Total incidents) * 100',
                'data_source': 'Incident tickets'
            },
            'playbook_coverage': {
                'name': 'Playbook Coverage',
                'description': 'Percentage of incident types with playbooks',
                'target': '> 90%',
                'calculation': '(Incident types with playbooks / Total incident types) * 100',
                'data_source': 'Playbook inventory'
            }
        }
    }

    @classmethod
    def calculate_metrics(cls, incident_data: List[dict],
                         time_period: str = 'monthly') -> Dict[str, any]:
        """
        Calculate all KPIs from incident data.
        """
        metrics = {}

        # Calculate detection metrics
        detection_times = []
        for incident in incident_data:
            if incident.get('detection_time') and incident.get('compromise_time'):
                detection_times.append(
                    incident['detection_time'] - incident['compromise_time']
                )

        if detection_times:
            metrics['mttd'] = sum(detection_times) / len(detection_times)

        # Calculate response metrics
        response_times = []
        for incident in incident_data:
            if incident.get('response_start') and incident.get('detection_time'):
                response_times.append(
                    incident['response_start'] - incident['detection_time']
                )

        if response_times:
            metrics['mttr'] = sum(response_times) / len(response_times)

        # Additional calculations would follow similar pattern

        return metrics
```

## Conclusion

Effective incident response is a critical capability for any organization. By implementing the practices covered in this guide, including proper preparation, structured detection and analysis, systematic containment and eradication, thorough recovery procedures, and continuous improvement through lessons learned, organizations can minimize the impact of security incidents and improve their overall security posture.

Key takeaways for building a strong incident response program:

1. **Preparation is Essential**: Invest in planning, training, and tooling before incidents occur
2. **Speed Matters**: Faster detection and response directly reduces incident impact
3. **Documentation is Critical**: Thorough documentation supports investigation, legal needs, and improvement
4. **Practice Regularly**: Conduct tabletop exercises and simulations to test and improve response capabilities
5. **Learn and Improve**: Every incident is an opportunity to strengthen defenses and response procedures
6. **Automate Where Possible**: Use orchestration and automation to accelerate response and reduce human error
7. **Build Relationships**: Establish partnerships with law enforcement, IR firms, and industry peers before you need them

Remember that incident response is not just a technical function but requires coordination across the organization, including legal, communications, human resources, and business leadership. A well-prepared organization can turn a security incident from a crisis into a manageable event with minimal lasting impact.
