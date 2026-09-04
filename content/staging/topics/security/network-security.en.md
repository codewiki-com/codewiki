---
title: Network Security Fundamentals
description: Understanding core concepts and protective measures in network security
track: security
section: infra-security
difficulty: intermediate
tags:
  - network security
  - firewall
  - IDS/IPS
  - VPN
status: imported
origin: old/src/content/docs/security/network-security.en.md
divergence: 0.3
issues: []
legacy:
  category: Security
  subcategory: Network
  order: 13
  lastUpdated: 2026-01-07
---

Network security is the practice of protecting computer networks and their data from unauthorized access, attacks, damage, or disclosure. In today's highly interconnected world, network security has become a core skill that every organization and developer must master.

## Basic Concepts of Network Security

### What is Network Security

Network security encompasses all measures and practices for protecting network infrastructure, data transmission, and network services:

```
The Three Core Objectives of Network Security (CIA Triad)
├── Confidentiality
│   └── Ensure data can only be accessed by authorized users
├── Integrity
│   └── Ensure data has not been modified without authorization
└── Availability
    └── Ensure authorized users can access resources
```

### OSI Model and Security Threats

```
OSI Seven-Layer Model Security Threat Analysis:

Layer 7 - Application Layer
├── Threats: SQL injection, XSS, CSRF, application-layer DDoS
└── Protection: WAF, input validation, secure coding

Layer 6 - Presentation Layer
├── Threats: Encryption weaknesses, data format attacks
└── Protection: Strong encryption algorithms, secure protocols

Layer 5 - Session Layer
├── Threats: Session hijacking, session fixation
└── Protection: Session management, token mechanisms

Layer 4 - Transport Layer
├── Threats: SYN Flood, port scanning
└── Protection: Firewall, IPS, rate limiting

Layer 3 - Network Layer
├── Threats: IP spoofing, routing attacks, ICMP attacks
└── Protection: Packet filtering, routing security

Layer 2 - Data Link Layer
├── Threats: ARP spoofing, MAC flooding
└── Protection: Port security, ARP inspection

Layer 1 - Physical Layer
├── Threats: Physical intrusion, wiretapping
└── Protection: Physical security, encryption
```

### TCP/IP Security Risks

```python
# TCP/IP Protocol Stack Security Risk Demonstration
"""
The TCP/IP protocol stack was not designed with security in mind, leading to various security threats:

Application Layer (HTTP, FTP, SMTP)     -> Application layer attacks, data leakage
Transport Layer (TCP, UDP)              -> SYN Flood, session hijacking
Network Layer (IP, ICMP)                -> IP spoofing, routing attacks
Data Link Layer (Ethernet, ARP)         -> ARP spoofing, MAC flooding
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum

class ProtocolLayer(Enum):
    APPLICATION = "Application Layer"
    TRANSPORT = "Transport Layer"
    NETWORK = "Network Layer"
    DATALINK = "Data Link Layer"

@dataclass
class SecurityThreat:
    """Security threat definition"""
    name: str
    layer: ProtocolLayer
    description: str
    mitigation: List[str]

class NetworkSecurityAnalyzer:
    """Network security threat analyzer"""

    def __init__(self):
        self.threats: List[SecurityThreat] = []
        self._load_common_threats()

    def _load_common_threats(self):
        """Load common threats"""
        self.threats = [
            SecurityThreat(
                name="SYN Flood",
                layer=ProtocolLayer.TRANSPORT,
                description="Exploits TCP three-way handshake to exhaust server resources",
                mitigation=["SYN Cookies", "Rate limiting", "Firewall filtering"]
            ),
            SecurityThreat(
                name="ARP Spoofing",
                layer=ProtocolLayer.DATALINK,
                description="Forges ARP responses to perform man-in-the-middle attacks",
                mitigation=["Static ARP binding", "ARP inspection", "Network segmentation"]
            ),
            SecurityThreat(
                name="IP Spoofing",
                layer=ProtocolLayer.NETWORK,
                description="Forges source IP address to bypass access controls",
                mitigation=["Ingress filtering", "uRPF check", "Firewall rules"]
            )
        ]

    def analyze_threat(self, threat_name: str) -> Dict:
        """Analyze a specific threat"""
        for threat in self.threats:
            if threat.name == threat_name:
                return {
                    "name": threat.name,
                    "layer": threat.layer.value,
                    "description": threat.description,
                    "mitigation": threat.mitigation,
                    "risk_level": self._calculate_risk(threat)
                }
        return {"error": "Threat not found"}

    def _calculate_risk(self, threat: SecurityThreat) -> str:
        """Calculate risk level"""
        # Simplified risk assessment
        high_risk = ["SYN Flood", "ARP Spoofing"]
        return "High" if threat.name in high_risk else "Medium"

# Usage example
analyzer = NetworkSecurityAnalyzer()
print(analyzer.analyze_threat("SYN Flood"))
```

## Firewall Technology

### Firewall Types

Firewalls are the first line of defense in network security. Based on their operating principles, they can be categorized as follows:

```
1. Packet Filter Firewall
   - Filters based on IP address, port, protocol
   - Operates at network and transport layers
   - High performance but limited functionality

2. Stateful Inspection Firewall
   - Tracks connection state
   - Can identify legitimate response packets
   - More secure but higher resource consumption

3. Application Layer Firewall (Application Gateway)
   - Deep Packet Inspection (DPI)
   - Understands application layer protocols
   - Can detect application layer attacks

4. Next-Generation Firewall (NGFW)
   - Integrates IPS, application recognition, user identification
   - Threat intelligence integration
   - Sandbox analysis
```

### iptables Configuration in Practice

```bash
#!/bin/bash
# Enterprise-grade iptables firewall configuration script

# Flush existing rules
iptables -F
iptables -X
iptables -Z

# Set default policies - deny all inbound traffic by default
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback interface
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established and related connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# SSH access control (rate limiting to prevent brute force)
# Maximum 4 new connections per 60 seconds
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set --name SSH
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 --name SSH -j DROP
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -j ACCEPT

# Allow HTTP/HTTPS traffic
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Prevent SYN Flood attacks
iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP

# Prevent ICMP Flood
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 4 -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-request -j DROP

# Drop invalid packets
iptables -A INPUT -m state --state INVALID -j DROP

# Prevent port scanning - drop abnormal TCP flag combinations
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL FIN,PSH,URG -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j DROP

# Log dropped packets (for analysis)
iptables -A INPUT -j LOG --log-prefix "IPTables-Dropped: " --log-level 4

# Save rules
iptables-save > /etc/iptables/rules.v4

echo "Firewall rules configuration complete"
```

### Python Firewall Management Tool

```python
import subprocess
import json
from dataclasses import dataclass, field
from typing import List, Optional, Dict
from enum import Enum

class FirewallAction(Enum):
    ACCEPT = "ACCEPT"
    DROP = "DROP"
    REJECT = "REJECT"
    LOG = "LOG"

class FirewallChain(Enum):
    INPUT = "INPUT"
    OUTPUT = "OUTPUT"
    FORWARD = "FORWARD"

@dataclass
class FirewallRule:
    """Firewall rule data class"""
    chain: FirewallChain
    protocol: str
    action: FirewallAction
    source: Optional[str] = None
    destination: Optional[str] = None
    sport: Optional[int] = None
    dport: Optional[int] = None
    comment: Optional[str] = None

    def to_command(self) -> List[str]:
        """Convert to iptables command"""
        cmd = ['iptables', '-A', self.chain.value, '-p', self.protocol]

        if self.source:
            cmd.extend(['-s', self.source])
        if self.destination:
            cmd.extend(['-d', self.destination])
        if self.sport:
            cmd.extend(['--sport', str(self.sport)])
        if self.dport:
            cmd.extend(['--dport', str(self.dport)])
        if self.comment:
            cmd.extend(['-m', 'comment', '--comment', self.comment])

        cmd.extend(['-j', self.action.value])
        return cmd

class FirewallManager:
    """Firewall manager"""

    def __init__(self):
        self.rules: List[FirewallRule] = []
        self.applied_rules: List[FirewallRule] = []

    def add_rule(self, rule: FirewallRule) -> bool:
        """Add firewall rule"""
        try:
            cmd = rule.to_command()
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                self.rules.append(rule)
                self.applied_rules.append(rule)
                return True
            else:
                print(f"Failed to add rule: {result.stderr}")
                return False
        except Exception as e:
            print(f"Error executing command: {e}")
            return False

    def remove_rule(self, rule: FirewallRule) -> bool:
        """Remove firewall rule"""
        cmd = rule.to_command()
        cmd[1] = '-D'  # Change -A to -D

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            if rule in self.applied_rules:
                self.applied_rules.remove(rule)
            return True
        return False

    def list_rules(self, chain: Optional[FirewallChain] = None) -> str:
        """List firewall rules"""
        cmd = ['iptables', '-L', '-n', '-v', '--line-numbers']
        if chain:
            cmd.insert(2, chain.value)

        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout

    def flush_chain(self, chain: FirewallChain) -> bool:
        """Flush all rules in specified chain"""
        cmd = ['iptables', '-F', chain.value]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0

    def save_rules(self, filepath: str = '/etc/iptables/rules.v4') -> bool:
        """Save rules to file"""
        result = subprocess.run(
            ['iptables-save'],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            with open(filepath, 'w') as f:
                f.write(result.stdout)
            return True
        return False

    def get_statistics(self) -> Dict:
        """Get firewall statistics"""
        return {
            'total_rules': len(self.applied_rules),
            'rules_by_chain': {
                chain.value: sum(1 for r in self.applied_rules if r.chain == chain)
                for chain in FirewallChain
            },
            'rules_by_action': {
                action.value: sum(1 for r in self.applied_rules if r.action == action)
                for action in FirewallAction
            }
        }

# Usage example
def setup_web_server_firewall():
    """Configure web server firewall"""
    manager = FirewallManager()

    # Allow HTTP
    manager.add_rule(FirewallRule(
        chain=FirewallChain.INPUT,
        protocol='tcp',
        dport=80,
        action=FirewallAction.ACCEPT,
        comment='Allow HTTP'
    ))

    # Allow HTTPS
    manager.add_rule(FirewallRule(
        chain=FirewallChain.INPUT,
        protocol='tcp',
        dport=443,
        action=FirewallAction.ACCEPT,
        comment='Allow HTTPS'
    ))

    # Allow SSH (from specific IP only)
    manager.add_rule(FirewallRule(
        chain=FirewallChain.INPUT,
        protocol='tcp',
        source='10.0.0.0/8',
        dport=22,
        action=FirewallAction.ACCEPT,
        comment='Allow SSH from internal network'
    ))

    print("Web server firewall configuration complete")
    print(f"Statistics: {manager.get_statistics()}")
```

## Intrusion Detection and Prevention Systems (IDS/IPS)

### IDS vs IPS Comparison

```
IDS (Intrusion Detection System)           IPS (Intrusion Prevention System)
├── Passive monitoring                     ├── Active protection
├── Detects and alerts                     ├── Detects and blocks
├── Does not block traffic                 ├── Real-time response
├── Deployment: Mirror/SPAN                ├── Deployment: Inline
└── Suitable for monitoring and analysis   └── Suitable for production protection

Detection Methods:
1. Signature-based Detection
   - Based on known attack signatures
   - High accuracy but cannot detect new attacks

2. Anomaly-based Detection
   - Based on normal behavior baseline
   - Can detect unknown attacks but higher false positive rate

3. Protocol Analysis
   - Detects protocol violations
   - Can discover protocol-layer attacks
```

### Snort Rule Configuration

```bash
# Snort IDS/IPS Rule Examples

# Rule format:
# action protocol src_ip src_port -> dst_ip dst_port (options)

# Detect SQL injection attempts
alert tcp any any -> $HOME_NET $HTTP_PORTS (
    msg:"SQL Injection Attempt - UNION SELECT";
    flow:to_server,established;
    content:"UNION"; nocase;
    content:"SELECT"; nocase; distance:0;
    pcre:"/UNION\s+(ALL\s+)?SELECT/i";
    classtype:web-application-attack;
    sid:1000001;
    rev:1;
)

# Detect XSS attacks
alert tcp any any -> $HOME_NET $HTTP_PORTS (
    msg:"XSS Attack Detected - Script Tag";
    flow:to_server,established;
    content:"<script"; nocase;
    pcre:"/<script[^>]*>.*?<\/script>/i";
    classtype:web-application-attack;
    sid:1000002;
    rev:1;
)

# Detect SSH brute force
alert tcp any any -> $HOME_NET 22 (
    msg:"SSH Brute Force Attempt";
    flow:to_server;
    detection_filter:track by_src, count 5, seconds 60;
    classtype:attempted-admin;
    sid:1000003;
    rev:1;
)

# Detect port scanning
alert tcp any any -> $HOME_NET any (
    msg:"Possible Port Scan Detected";
    flags:S;
    detection_filter:track by_src, count 20, seconds 10;
    classtype:attempted-recon;
    sid:1000004;
    rev:1;
)

# Detect command injection
alert tcp any any -> $HOME_NET $HTTP_PORTS (
    msg:"Command Injection Attempt";
    flow:to_server,established;
    pcre:"/[;&|`$]\s*(cat|ls|pwd|id|whoami|wget|curl)/i";
    classtype:web-application-attack;
    sid:1000005;
    rev:1;
)
```

### Python Intrusion Detection System Implementation

```python
import re
import logging
import hashlib
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict, Callable, Optional, Set
from enum import Enum
import threading

class ThreatLevel(Enum):
    INFO = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    CRITICAL = 5

@dataclass
class Alert:
    """Security alert"""
    id: str
    timestamp: datetime
    source_ip: str
    destination_ip: str
    threat_level: ThreatLevel
    rule_name: str
    description: str
    raw_data: str

    def __post_init__(self):
        if not self.id:
            self.id = hashlib.md5(
                f"{self.timestamp}{self.source_ip}{self.rule_name}".encode()
            ).hexdigest()[:12]

@dataclass
class DetectionRule:
    """Detection rule"""
    name: str
    description: str
    threat_level: ThreatLevel
    patterns: List[str]
    enabled: bool = True

class SimpleIDS:
    """Simple Intrusion Detection System"""

    def __init__(self):
        self.alerts: List[Alert] = []
        self.connection_tracker: Dict[str, List[datetime]] = defaultdict(list)
        self.rules: List[DetectionRule] = []
        self.blocked_ips: Set[str] = set()
        self.lock = threading.Lock()

        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

        # Load default rules
        self._load_default_rules()

    def _load_default_rules(self):
        """Load default detection rules"""
        self.rules = [
            DetectionRule(
                name="SQL Injection",
                description="Detects SQL injection attacks",
                threat_level=ThreatLevel.HIGH,
                patterns=[
                    r"(\%27)|(\')|(\-\-)|(\%23)|(#)",
                    r"(?i)UNION\s+(ALL\s+)?SELECT",
                    r"(?i)SELECT\s+.*\s+FROM\s+.*\s+WHERE",
                    r"(?i)(INSERT|UPDATE|DELETE)\s+.*\s+(INTO|SET|FROM)",
                    r"(?i)DROP\s+(TABLE|DATABASE)",
                    r"(?i)OR\s+['\"]?1['\"]?\s*=\s*['\"]?1"
                ]
            ),
            DetectionRule(
                name="XSS Attack",
                description="Detects cross-site scripting attacks",
                threat_level=ThreatLevel.HIGH,
                patterns=[
                    r"<script[^>]*>.*?</script>",
                    r"javascript\s*:",
                    r"on\w+\s*=\s*['\"]",
                    r"<img[^>]+onerror\s*=",
                    r"document\.(cookie|location|write)",
                    r"eval\s*\("
                ]
            ),
            DetectionRule(
                name="Path Traversal",
                description="Detects directory traversal attacks",
                threat_level=ThreatLevel.MEDIUM,
                patterns=[
                    r"\.\./",
                    r"\.\.\\",
                    r"%2e%2e%2f",
                    r"%2e%2e/",
                    r"\.\.%2f",
                    r"/etc/(passwd|shadow|hosts)",
                    r"c:\\windows\\system32"
                ]
            ),
            DetectionRule(
                name="Command Injection",
                description="Detects command injection attacks",
                threat_level=ThreatLevel.CRITICAL,
                patterns=[
                    r"[;&|`$]\s*(cat|ls|pwd|id|whoami)",
                    r"\|\s*(nc|netcat|wget|curl)\s",
                    r";\s*(rm|mv|cp)\s+-rf?\s",
                    r"\$\(.*\)",
                    r"`.*`"
                ]
            ),
            DetectionRule(
                name="Sensitive File Access",
                description="Detects sensitive file access attempts",
                threat_level=ThreatLevel.MEDIUM,
                patterns=[
                    r"\.htaccess",
                    r"\.htpasswd",
                    r"\.git/",
                    r"\.env",
                    r"wp-config\.php",
                    r"config\.(php|yml|json)"
                ]
            )
        ]

    def add_rule(self, rule: DetectionRule):
        """Add custom rule"""
        self.rules.append(rule)
        self.logger.info(f"Added rule: {rule.name}")

    def analyze_packet(self, packet: Dict) -> List[Alert]:
        """Analyze packet"""
        detected_alerts = []
        payload = str(packet.get('payload', ''))
        src_ip = packet.get('src_ip', 'unknown')
        dst_ip = packet.get('dst_ip', 'unknown')

        with self.lock:
            # Check if already blocked
            if src_ip in self.blocked_ips:
                return []

            # Apply detection rules
            for rule in self.rules:
                if not rule.enabled:
                    continue

                for pattern in rule.patterns:
                    if re.search(pattern, payload, re.IGNORECASE):
                        alert = Alert(
                            id="",
                            timestamp=datetime.now(),
                            source_ip=src_ip,
                            destination_ip=dst_ip,
                            threat_level=rule.threat_level,
                            rule_name=rule.name,
                            description=f"{rule.description}: matched pattern {pattern[:50]}...",
                            raw_data=payload[:500]
                        )
                        detected_alerts.append(alert)
                        self.alerts.append(alert)
                        self._handle_alert(alert)
                        break

            # Brute force detection
            brute_force_alert = self._detect_brute_force(packet)
            if brute_force_alert:
                detected_alerts.append(brute_force_alert)

        return detected_alerts

    def _detect_brute_force(self, packet: Dict) -> Optional[Alert]:
        """Detect brute force attacks"""
        src_ip = packet.get('src_ip', '')
        dst_port = packet.get('dst_port', 0)

        # Monitor login-related ports
        login_ports = {22: 'SSH', 23: 'Telnet', 21: 'FTP',
                       3389: 'RDP', 3306: 'MySQL', 5432: 'PostgreSQL'}

        if dst_port not in login_ports:
            return None

        now = datetime.now()
        key = f"{src_ip}:{dst_port}"

        # Record connection
        self.connection_tracker[key].append(now)

        # Clean up expired records (5 minutes ago)
        cutoff = now - timedelta(minutes=5)
        self.connection_tracker[key] = [
            t for t in self.connection_tracker[key]
            if t > cutoff
        ]

        # More than 10 connections in 5 minutes is considered brute force
        if len(self.connection_tracker[key]) > 10:
            service = login_ports[dst_port]
            alert = Alert(
                id="",
                timestamp=now,
                source_ip=src_ip,
                destination_ip=packet.get('dst_ip', 'unknown'),
                threat_level=ThreatLevel.MEDIUM,
                rule_name="Brute Force Detection",
                description=f"Detected brute force attempt on {service} service, connection count in 5 minutes: {len(self.connection_tracker[key])}",
                raw_data=str(packet)
            )
            self.alerts.append(alert)
            self._handle_alert(alert)
            return alert

        return None

    def _handle_alert(self, alert: Alert):
        """Handle alert"""
        level_name = alert.threat_level.name

        # Log
        if alert.threat_level.value >= ThreatLevel.HIGH.value:
            self.logger.warning(
                f"[{level_name}] {alert.rule_name} - "
                f"Source: {alert.source_ip} -> {alert.destination_ip}"
            )
        else:
            self.logger.info(
                f"[{level_name}] {alert.rule_name} - Source: {alert.source_ip}"
            )

        # Auto-block on critical alerts
        if alert.threat_level == ThreatLevel.CRITICAL:
            self.block_ip(alert.source_ip)

    def block_ip(self, ip: str):
        """Block IP"""
        self.blocked_ips.add(ip)
        self.logger.warning(f"IP blocked: {ip}")

    def unblock_ip(self, ip: str):
        """Unblock IP"""
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
            self.logger.info(f"IP unblocked: {ip}")

    def get_alerts_summary(self) -> Dict:
        """Get alerts summary"""
        summary = {
            'total_alerts': len(self.alerts),
            'blocked_ips': len(self.blocked_ips),
            'by_level': defaultdict(int),
            'by_rule': defaultdict(int),
            'top_sources': defaultdict(int)
        }

        for alert in self.alerts:
            summary['by_level'][alert.threat_level.name] += 1
            summary['by_rule'][alert.rule_name] += 1
            summary['top_sources'][alert.source_ip] += 1

        # Sort to get Top 10 source IPs
        summary['top_sources'] = dict(
            sorted(summary['top_sources'].items(),
                   key=lambda x: x[1], reverse=True)[:10]
        )

        return dict(summary)

# Usage example
if __name__ == "__main__":
    ids = SimpleIDS()

    # Simulate malicious requests
    test_packets = [
        {
            'src_ip': '192.168.1.100',
            'dst_ip': '10.0.0.1',
            'dst_port': 80,
            'payload': "SELECT * FROM users WHERE id=1 OR '1'='1'"
        },
        {
            'src_ip': '192.168.1.101',
            'dst_ip': '10.0.0.1',
            'dst_port': 80,
            'payload': "<script>alert('XSS')</script>"
        },
        {
            'src_ip': '192.168.1.102',
            'dst_ip': '10.0.0.1',
            'dst_port': 80,
            'payload': "../../etc/passwd"
        }
    ]

    for packet in test_packets:
        alerts = ids.analyze_packet(packet)
        for alert in alerts:
            print(f"Attack detected: {alert.rule_name} - {alert.description}")

    print("\nAlert Summary:")
    print(ids.get_alerts_summary())
```

## Network Segmentation and Isolation

### Network Segmentation Strategy

Network segmentation divides a network into multiple isolated zones to limit lateral movement and attack propagation:

```
Traditional Network Segmentation Architecture:

         Internet
            │
      ┌─────┴─────┐
      │  Perimeter │
      │  Firewall  │
      └─────┬─────┘
            │
      ┌─────┴─────┐
      │    DMZ     │  <- External Service Zone
      │(Web Server)│
      └─────┬─────┘
            │
      ┌─────┴─────┐
      │  Internal  │
      │  Firewall  │
      └─────┬─────┘
            │
   ┌────────┼────────┐
   │        │        │
┌──┴──┐ ┌───┴──┐ ┌───┴──┐
│Office│ │ Dev  │ │ Data │
│ Zone │ │ Zone │ │ Zone │
└─────┘ └──────┘ └──────┘

VLAN Segmentation Example:
VLAN 10: Management Network (10.0.10.0/24)
VLAN 20: Office Network (10.0.20.0/24)
VLAN 30: Development Network (10.0.30.0/24)
VLAN 40: Production Network (10.0.40.0/24)
VLAN 50: DMZ Network (10.0.50.0/24)
```

### Micro-Segmentation Implementation

```python
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional
from enum import Enum
import ipaddress
import json

class SecurityZone(Enum):
    """Security zone definition"""
    UNTRUSTED = "untrusted"      # Untrusted zone (Internet)
    DMZ = "dmz"                   # Demilitarized zone
    INTERNAL = "internal"         # Internal network
    RESTRICTED = "restricted"     # Restricted zone
    MANAGEMENT = "management"     # Management zone

@dataclass
class NetworkSegment:
    """Network segment definition"""
    name: str
    zone: SecurityZone
    cidr: str
    vlan_id: int
    description: str
    allowed_inbound_zones: List[SecurityZone] = field(default_factory=list)
    allowed_outbound_zones: List[SecurityZone] = field(default_factory=list)
    allowed_ports: List[int] = field(default_factory=list)

@dataclass
class AccessPolicy:
    """Access control policy"""
    name: str
    source_zone: SecurityZone
    destination_zone: SecurityZone
    protocol: str
    ports: List[int]
    action: str  # "allow" or "deny"
    logging: bool = True

class MicroSegmentationManager:
    """Micro-segmentation manager"""

    def __init__(self):
        self.segments: Dict[str, NetworkSegment] = {}
        self.policies: List[AccessPolicy] = []
        self.default_policy = "deny"  # Default deny

    def add_segment(self, segment: NetworkSegment):
        """Add network segment"""
        self.segments[segment.name] = segment
        print(f"Added network segment: {segment.name} ({segment.cidr})")

    def add_policy(self, policy: AccessPolicy):
        """Add access policy"""
        self.policies.append(policy)
        print(f"Added policy: {policy.name}")

    def get_segment_for_ip(self, ip: str) -> Optional[NetworkSegment]:
        """Get network segment for IP"""
        try:
            ip_addr = ipaddress.ip_address(ip)
            for segment in self.segments.values():
                network = ipaddress.ip_network(segment.cidr, strict=False)
                if ip_addr in network:
                    return segment
        except ValueError:
            pass
        return None

    def check_access(self, src_ip: str, dst_ip: str,
                     port: int, protocol: str = 'tcp') -> Dict:
        """Check access permission"""
        src_segment = self.get_segment_for_ip(src_ip)
        dst_segment = self.get_segment_for_ip(dst_ip)

        result = {
            'allowed': False,
            'source_ip': src_ip,
            'destination_ip': dst_ip,
            'source_segment': src_segment.name if src_segment else 'unknown',
            'destination_segment': dst_segment.name if dst_segment else 'unknown',
            'matched_policy': None,
            'reason': ''
        }

        if not src_segment or not dst_segment:
            result['reason'] = 'Unknown network segment'
            return result

        # Check policies
        for policy in self.policies:
            if (policy.source_zone == src_segment.zone and
                policy.destination_zone == dst_segment.zone and
                policy.protocol == protocol and
                port in policy.ports):

                result['matched_policy'] = policy.name
                result['allowed'] = (policy.action == 'allow')
                result['reason'] = f"Matched policy: {policy.name}"
                return result

        # Default policy
        result['reason'] = f"Default policy: {self.default_policy}"
        result['allowed'] = (self.default_policy == 'allow')
        return result

    def generate_acl_rules(self) -> List[str]:
        """Generate ACL rules"""
        rules = []
        for policy in self.policies:
            action = "permit" if policy.action == "allow" else "deny"
            ports = ','.join(map(str, policy.ports))
            rule = (f"{action} {policy.protocol} "
                   f"zone {policy.source_zone.value} "
                   f"to zone {policy.destination_zone.value} "
                   f"ports {ports}")
            rules.append(rule)
        return rules

# Usage example
def setup_enterprise_network():
    """Configure enterprise network micro-segmentation"""
    manager = MicroSegmentationManager()

    # Define network segments
    segments = [
        NetworkSegment(
            name="dmz",
            zone=SecurityZone.DMZ,
            cidr="10.0.50.0/24",
            vlan_id=50,
            description="DMZ External Service Zone"
        ),
        NetworkSegment(
            name="internal",
            zone=SecurityZone.INTERNAL,
            cidr="10.0.20.0/24",
            vlan_id=20,
            description="Internal Office Network"
        ),
        NetworkSegment(
            name="database",
            zone=SecurityZone.RESTRICTED,
            cidr="10.0.40.0/24",
            vlan_id=40,
            description="Database Service Zone"
        ),
        NetworkSegment(
            name="management",
            zone=SecurityZone.MANAGEMENT,
            cidr="10.0.10.0/24",
            vlan_id=10,
            description="Management Network"
        )
    ]

    for segment in segments:
        manager.add_segment(segment)

    # Define access policies
    policies = [
        AccessPolicy(
            name="dmz-to-database",
            source_zone=SecurityZone.DMZ,
            destination_zone=SecurityZone.RESTRICTED,
            protocol="tcp",
            ports=[3306, 5432],
            action="allow"
        ),
        AccessPolicy(
            name="internal-to-dmz",
            source_zone=SecurityZone.INTERNAL,
            destination_zone=SecurityZone.DMZ,
            protocol="tcp",
            ports=[80, 443],
            action="allow"
        ),
        AccessPolicy(
            name="management-to-all",
            source_zone=SecurityZone.MANAGEMENT,
            destination_zone=SecurityZone.INTERNAL,
            protocol="tcp",
            ports=[22, 3389],
            action="allow"
        )
    ]

    for policy in policies:
        manager.add_policy(policy)

    # Test access checks
    print("\nAccess Check Tests:")
    tests = [
        ("10.0.50.10", "10.0.40.20", 3306),  # DMZ -> Database
        ("10.0.20.10", "10.0.50.20", 80),    # Internal -> DMZ
        ("10.0.20.10", "10.0.40.20", 3306),  # Internal -> Database (should be denied)
    ]

    for src, dst, port in tests:
        result = manager.check_access(src, dst, port)
        status = "Allowed" if result['allowed'] else "Denied"
        print(f"  {src} -> {dst}:{port} : {status} ({result['reason']})")

    return manager

# Execute example
if __name__ == "__main__":
    manager = setup_enterprise_network()
```

## VPN Technology

### VPN Type Comparison

```
VPN Technology Comparison:

┌─────────────┬──────────────┬──────────────┬──────────────┐
│   Feature   │  IPSec VPN   │  SSL/TLS VPN │  WireGuard   │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ Layer       │ Network (L3) │ Transport(L4)│ Network (L3) │
│ Use Case    │ Site-to-Site │ Remote Access│ Universal    │
│ Complexity  │ High         │ Medium       │ Low          │
│ Performance │ High         │ Medium       │ Very High    │
│ Code Lines  │ ~100,000     │ ~70,000      │ ~4,000       │
│ Client      │ Required     │ Browser OK   │ Required     │
│ NAT Traversal│ Difficult   │ Easy         │ Easy         │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

### WireGuard Configuration

```ini
# /etc/wireguard/wg0.conf - Server configuration
[Interface]
# Server private key
PrivateKey = SERVER_PRIVATE_KEY_HERE
# VPN internal address
Address = 10.0.0.1/24
# Listen port
ListenPort = 51820
# Firewall rules executed after startup
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client configuration
[Peer]
# Client public key
PublicKey = CLIENT_PUBLIC_KEY_HERE
# Allowed IP range
AllowedIPs = 10.0.0.2/32
```

```ini
# /etc/wireguard/wg0.conf - Client configuration
[Interface]
# Client private key
PrivateKey = CLIENT_PRIVATE_KEY_HERE
# Client VPN internal address
Address = 10.0.0.2/24
# DNS server
DNS = 8.8.8.8, 8.8.4.4

[Peer]
# Server public key
PublicKey = SERVER_PUBLIC_KEY_HERE
# Server address
Endpoint = vpn.example.com:51820
# Route all traffic through VPN
AllowedIPs = 0.0.0.0/0, ::/0
# Keep connection alive
PersistentKeepalive = 25
```

### VPN Management Script

```python
import subprocess
import os
from dataclasses import dataclass, field
from typing import List, Optional, Dict
import json
import base64

@dataclass
class WireGuardPeer:
    """WireGuard peer node"""
    name: str
    public_key: str
    allowed_ips: str
    endpoint: Optional[str] = None
    persistent_keepalive: int = 25
    preshared_key: Optional[str] = None

@dataclass
class WireGuardConfig:
    """WireGuard configuration"""
    interface_name: str
    private_key: str
    address: str
    listen_port: int = 51820
    dns: Optional[str] = None
    peers: List[WireGuardPeer] = field(default_factory=list)
    post_up: Optional[str] = None
    post_down: Optional[str] = None

class WireGuardManager:
    """WireGuard VPN Manager"""

    def __init__(self, config_dir: str = '/etc/wireguard'):
        self.config_dir = config_dir

    @staticmethod
    def generate_keypair() -> tuple:
        """Generate key pair"""
        # Generate private key
        private_key_result = subprocess.run(
            ['wg', 'genkey'],
            capture_output=True,
            text=True,
            check=True
        )
        private_key = private_key_result.stdout.strip()

        # Generate public key from private key
        public_key_result = subprocess.run(
            ['wg', 'pubkey'],
            input=private_key,
            capture_output=True,
            text=True,
            check=True
        )
        public_key = public_key_result.stdout.strip()

        return private_key, public_key

    @staticmethod
    def generate_preshared_key() -> str:
        """Generate preshared key"""
        result = subprocess.run(
            ['wg', 'genpsk'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()

    def generate_config(self, config: WireGuardConfig) -> str:
        """Generate configuration file content"""
        lines = ['[Interface]']
        lines.append(f'PrivateKey = {config.private_key}')
        lines.append(f'Address = {config.address}')

        if config.listen_port:
            lines.append(f'ListenPort = {config.listen_port}')
        if config.dns:
            lines.append(f'DNS = {config.dns}')
        if config.post_up:
            lines.append(f'PostUp = {config.post_up}')
        if config.post_down:
            lines.append(f'PostDown = {config.post_down}')

        for peer in config.peers:
            lines.append('')
            lines.append('[Peer]')
            lines.append(f'# {peer.name}')
            lines.append(f'PublicKey = {peer.public_key}')
            lines.append(f'AllowedIPs = {peer.allowed_ips}')
            if peer.endpoint:
                lines.append(f'Endpoint = {peer.endpoint}')
            if peer.preshared_key:
                lines.append(f'PresharedKey = {peer.preshared_key}')
            if peer.persistent_keepalive:
                lines.append(f'PersistentKeepalive = {peer.persistent_keepalive}')

        return '\n'.join(lines)

    def save_config(self, config: WireGuardConfig):
        """Save configuration file"""
        config_path = os.path.join(
            self.config_dir,
            f'{config.interface_name}.conf'
        )
        content = self.generate_config(config)

        with open(config_path, 'w') as f:
            f.write(content)

        # Set permissions
        os.chmod(config_path, 0o600)
        print(f"Configuration saved to: {config_path}")

    def start_interface(self, interface: str):
        """Start VPN interface"""
        subprocess.run(
            ['wg-quick', 'up', interface],
            check=True
        )
        print(f"Interface {interface} started")

    def stop_interface(self, interface: str):
        """Stop VPN interface"""
        subprocess.run(
            ['wg-quick', 'down', interface],
            check=True
        )
        print(f"Interface {interface} stopped")

    def get_status(self, interface: str = None) -> Dict:
        """Get VPN status"""
        cmd = ['wg', 'show']
        if interface:
            cmd.append(interface)

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return {'status': 'down', 'error': result.stderr}

        return {
            'status': 'up',
            'details': result.stdout
        }

# Usage example
def setup_vpn_server():
    """Configure VPN server"""
    manager = WireGuardManager()

    # Generate server keys
    server_private, server_public = manager.generate_keypair()
    print(f"Server public key: {server_public}")

    # Generate client keys
    client_private, client_public = manager.generate_keypair()
    print(f"Client public key: {client_public}")

    # Server configuration
    server_config = WireGuardConfig(
        interface_name='wg0',
        private_key=server_private,
        address='10.0.0.1/24',
        listen_port=51820,
        post_up='iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE',
        post_down='iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE',
        peers=[
            WireGuardPeer(
                name='client1',
                public_key=client_public,
                allowed_ips='10.0.0.2/32'
            )
        ]
    )

    # Client configuration
    client_config = WireGuardConfig(
        interface_name='wg0',
        private_key=client_private,
        address='10.0.0.2/24',
        dns='8.8.8.8',
        peers=[
            WireGuardPeer(
                name='server',
                public_key=server_public,
                allowed_ips='0.0.0.0/0',
                endpoint='vpn.example.com:51820'
            )
        ]
    )

    print("\nServer Configuration:")
    print(manager.generate_config(server_config))
    print("\nClient Configuration:")
    print(manager.generate_config(client_config))
```

## Zero Trust Network Architecture

### Zero Trust Core Principles

```
Zero Trust Architecture Core Principles:

1. Never Trust, Always Verify
   └── Every access request must be verified regardless of origin

2. Least Privilege Principle
   └── Grant only the minimum permissions needed to complete tasks

3. Assume Breach
   └── Assume attackers are already inside the network, implement defense in depth

4. Explicit Verification
   └── Multi-factor verification based on identity, device, location, behavior, etc.

5. Continuous Monitoring
   └── Real-time monitoring of all activities, timely anomaly detection

Zero Trust Implementation Elements:
┌─────────────────────────────────────────────┐
│             Zero Trust Architecture          │
├──────────────┬──────────────┬───────────────┤
│   Identity   │   Device     │   Network     │
│  Verification│   Security   │  Segmentation │
├──────────────┼──────────────┼───────────────┤
│ - MFA        │ - Device Auth│ - Micro-seg   │
│ - SSO        │ - Compliance │ - Software-   │
│ - Identity   │ - Endpoint   │   defined     │
│   Management │   Detection  │ - Encrypted   │
└──────────────┴──────────────┴───────────────┘
```

### Zero Trust Access Control Implementation

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import json

class DeviceCompliance(Enum):
    """Device compliance status"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    UNKNOWN = "unknown"

class RiskLevel(Enum):
    """Risk level"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class DeviceContext:
    """Device context"""
    device_id: str
    device_type: str
    os_version: str
    antivirus_active: bool = False
    firewall_enabled: bool = False
    disk_encrypted: bool = False
    last_patch_date: Optional[datetime] = None
    jailbroken: bool = False

@dataclass
class UserContext:
    """User context"""
    user_id: str
    username: str
    groups: List[str] = field(default_factory=list)
    mfa_verified: bool = False
    last_password_change: Optional[datetime] = None
    risk_score: float = 0.5

@dataclass
class RequestContext:
    """Request context"""
    source_ip: str
    geo_location: str
    timestamp: datetime
    resource: str
    action: str
    is_corporate_network: bool = False
    vpn_connected: bool = False

@dataclass
class AccessDecision:
    """Access decision"""
    allowed: bool
    trust_score: float
    reason: str
    required_actions: List[str] = field(default_factory=list)
    session_restrictions: Dict = field(default_factory=dict)

class ZeroTrustEngine:
    """Zero Trust Policy Engine"""

    def __init__(self):
        self.registered_devices: Dict[str, DeviceContext] = {}
        self.user_sessions: Dict[str, Dict] = {}
        self.access_logs: List[Dict] = []

        # Resource security levels
        self.resource_requirements = {
            'public': 0.3,
            'internal': 0.5,
            'confidential': 0.7,
            'restricted': 0.85,
            'critical': 0.95
        }

        # Suspicious behavior patterns
        self.suspicious_patterns: Set[str] = set()

    def register_device(self, device: DeviceContext):
        """Register device"""
        self.registered_devices[device.device_id] = device

    def calculate_device_trust(self, device: DeviceContext) -> float:
        """Calculate device trust score"""
        score = 0.0

        # Device registration
        if device.device_id in self.registered_devices:
            score += 0.2

        # Security software
        if device.antivirus_active:
            score += 0.15
        if device.firewall_enabled:
            score += 0.1

        # Disk encryption
        if device.disk_encrypted:
            score += 0.15

        # System updates
        if device.last_patch_date:
            days_since_patch = (datetime.now() - device.last_patch_date).days
            if days_since_patch < 7:
                score += 0.2
            elif days_since_patch < 30:
                score += 0.1

        # Jailbreak/Root detection
        if device.jailbroken:
            score -= 0.3

        return max(0.0, min(1.0, score))

    def calculate_user_trust(self, user: UserContext) -> float:
        """Calculate user trust score"""
        score = 0.3  # Base score

        # MFA verification
        if user.mfa_verified:
            score += 0.3

        # Password update
        if user.last_password_change:
            days = (datetime.now() - user.last_password_change).days
            if days < 30:
                score += 0.1
            elif days > 90:
                score -= 0.1

        # User risk score
        score += (1 - user.risk_score) * 0.2

        return max(0.0, min(1.0, score))

    def calculate_context_trust(self, request: RequestContext) -> float:
        """Calculate context trust score"""
        score = 0.2  # Base score

        # Corporate network
        if request.is_corporate_network:
            score += 0.3

        # VPN connection
        if request.vpn_connected:
            score += 0.2

        # Geolocation anomaly detection
        if self._check_location_anomaly(request):
            score -= 0.3

        # Time anomaly detection
        if self._check_time_anomaly(request):
            score -= 0.2

        return max(0.0, min(1.0, score))

    def _check_location_anomaly(self, request: RequestContext) -> bool:
        """Detect geolocation anomaly"""
        # Simplified implementation: check if access from high-risk region
        high_risk_locations = ['unknown', 'tor_exit']
        return request.geo_location.lower() in high_risk_locations

    def _check_time_anomaly(self, request: RequestContext) -> bool:
        """Detect time anomaly"""
        # Simplified implementation: access during non-working hours
        hour = request.timestamp.hour
        return hour < 6 or hour > 22

    def evaluate_access(self, user: UserContext, device: DeviceContext,
                       request: RequestContext,
                       resource_level: str = 'internal') -> AccessDecision:
        """Evaluate access request"""
        # Calculate trust scores for each dimension
        device_trust = self.calculate_device_trust(device)
        user_trust = self.calculate_user_trust(user)
        context_trust = self.calculate_context_trust(request)

        # Composite trust score (weighted average)
        total_trust = (
            device_trust * 0.3 +
            user_trust * 0.4 +
            context_trust * 0.3
        )

        # Get resource requirements
        required_score = self.resource_requirements.get(resource_level, 0.5)

        # Generate decision
        required_actions = []
        session_restrictions = {}

        if total_trust >= required_score:
            allowed = True
            reason = f"Access granted (trust score: {total_trust:.2f} >= required: {required_score:.2f})"

            # Add session restrictions
            if total_trust < required_score + 0.2:
                session_restrictions['timeout'] = 1800  # 30-minute timeout
                session_restrictions['reauthentication'] = True

        elif total_trust >= required_score - 0.15:
            allowed = False
            reason = "Additional verification required"

            # Add required actions
            if not user.mfa_verified:
                required_actions.append("Complete MFA verification")
            if not device.antivirus_active:
                required_actions.append("Enable antivirus software")
            if not request.vpn_connected and not request.is_corporate_network:
                required_actions.append("Connect to corporate VPN")

        else:
            allowed = False
            reason = f"Access denied (trust score: {total_trust:.2f} < required: {required_score:.2f})"

        decision = AccessDecision(
            allowed=allowed,
            trust_score=total_trust,
            reason=reason,
            required_actions=required_actions,
            session_restrictions=session_restrictions
        )

        # Log access
        self._log_access(user, device, request, decision)

        return decision

    def _log_access(self, user: UserContext, device: DeviceContext,
                   request: RequestContext, decision: AccessDecision):
        """Log access"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'user_id': user.user_id,
            'device_id': device.device_id,
            'source_ip': request.source_ip,
            'resource': request.resource,
            'action': request.action,
            'decision': 'allowed' if decision.allowed else 'denied',
            'trust_score': decision.trust_score,
            'reason': decision.reason
        }
        self.access_logs.append(log_entry)

# Usage example
def demonstrate_zero_trust():
    """Demonstrate Zero Trust access control"""
    engine = ZeroTrustEngine()

    # Register compliant device
    device = DeviceContext(
        device_id='DEV-001',
        device_type='laptop',
        os_version='Windows 11',
        antivirus_active=True,
        firewall_enabled=True,
        disk_encrypted=True,
        last_patch_date=datetime.now() - timedelta(days=5)
    )
    engine.register_device(device)

    # User context
    user = UserContext(
        user_id='USER-001',
        username='john.doe',
        groups=['developers', 'employees'],
        mfa_verified=True,
        last_password_change=datetime.now() - timedelta(days=15),
        risk_score=0.2
    )

    # Request context
    request = RequestContext(
        source_ip='10.0.20.100',
        geo_location='US',
        timestamp=datetime.now(),
        resource='/api/sensitive-data',
        action='read',
        is_corporate_network=True,
        vpn_connected=False
    )

    # Evaluate access
    print("Scenario 1: Compliant device + MFA + Corporate network -> Access sensitive resource")
    decision = engine.evaluate_access(user, device, request, 'confidential')
    print(f"  Decision: {'Allowed' if decision.allowed else 'Denied'}")
    print(f"  Trust score: {decision.trust_score:.2f}")
    print(f"  Reason: {decision.reason}")

    # Scenario 2: MFA not verified
    user.mfa_verified = False
    print("\nScenario 2: MFA not verified")
    decision = engine.evaluate_access(user, device, request, 'confidential')
    print(f"  Decision: {'Allowed' if decision.allowed else 'Denied'}")
    print(f"  Trust score: {decision.trust_score:.2f}")
    print(f"  Reason: {decision.reason}")
    if decision.required_actions:
        print(f"  Required actions: {decision.required_actions}")

if __name__ == "__main__":
    demonstrate_zero_trust()
```

## DDoS Attack Protection

### DDoS Attack Types

```
DDoS Attack Classification:

1. Volumetric Attacks
   ├── UDP Flood - Overwhelms bandwidth with massive UDP packets
   ├── ICMP Flood - Ping flood
   ├── DNS Amplification - Exploits open DNS resolvers
   └── NTP Amplification - Exploits NTP monlist command

2. Protocol Attacks
   ├── SYN Flood - Exhausts server connection table
   ├── Ping of Death - Sends malformed ICMP packets
   ├── Smurf Attack - ICMP broadcast amplification
   └── Fragmentation Attack - IP fragmentation attacks

3. Application Layer Attacks
   ├── HTTP Flood - Massive HTTP requests
   ├── Slowloris - Slow connection attack
   ├── RUDY - Slow POST attack
   └── DNS Query Flood

Attack Scale Reference:
├── Small: < 10 Gbps
├── Medium: 10-100 Gbps
├── Large: 100-500 Gbps
└── Massive: > 500 Gbps
```

### DDoS Protection Implementation

```python
import time
import threading
import hashlib
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple
from enum import Enum

class AttackType(Enum):
    """Attack type"""
    VOLUMETRIC = "volumetric"
    PROTOCOL = "protocol"
    APPLICATION = "application"

@dataclass
class RateLimitConfig:
    """Rate limit configuration"""
    requests_per_second: int = 100
    burst_size: int = 200
    block_duration: int = 300  # seconds
    warning_threshold: float = 0.8

@dataclass
class ConnectionConfig:
    """Connection limit configuration"""
    max_connections_per_ip: int = 100
    connection_timeout: int = 30
    slow_request_threshold: int = 10  # seconds

class DDoSProtection:
    """DDoS Protection System"""

    def __init__(self, rate_config: RateLimitConfig = None,
                 conn_config: ConnectionConfig = None):
        self.rate_config = rate_config or RateLimitConfig()
        self.conn_config = conn_config or ConnectionConfig()

        # Request counters
        self.request_counts: Dict[str, List[float]] = defaultdict(list)
        # Block list
        self.blocked_ips: Dict[str, float] = {}
        # Whitelist
        self.whitelist: Set[str] = set()
        # Suspicious IPs
        self.suspicious_ips: Dict[str, int] = defaultdict(int)
        # Connection tracking
        self.connections: Dict[str, List[Tuple[str, float]]] = defaultdict(list)

        # Statistics
        self.stats = {
            'total_requests': 0,
            'blocked_requests': 0,
            'attacks_detected': 0
        }

        self.lock = threading.Lock()

    def add_to_whitelist(self, ip: str):
        """Add to whitelist"""
        self.whitelist.add(ip)

    def _clean_old_requests(self, ip: str, window: float = 1.0):
        """Clean expired request records"""
        now = time.time()
        self.request_counts[ip] = [
            t for t in self.request_counts[ip]
            if now - t < window
        ]

    def _is_blocked(self, ip: str) -> bool:
        """Check if IP is blocked"""
        if ip in self.blocked_ips:
            if time.time() - self.blocked_ips[ip] > self.rate_config.block_duration:
                del self.blocked_ips[ip]
                return False
            return True
        return False

    def _block_ip(self, ip: str, reason: str):
        """Block IP"""
        self.blocked_ips[ip] = time.time()
        self.stats['attacks_detected'] += 1
        print(f"[DDoS Protection] IP {ip} blocked: {reason}")

    def check_request(self, ip: str, path: str = '/',
                     request_size: int = 0) -> Tuple[bool, str]:
        """
        Check if request should be allowed
        Returns: (allowed: bool, reason: str)
        """
        self.stats['total_requests'] += 1

        # Whitelist passes directly
        if ip in self.whitelist:
            return True, "Whitelisted"

        with self.lock:
            # Check block status
            if self._is_blocked(ip):
                self.stats['blocked_requests'] += 1
                return False, "IP is blocked"

            now = time.time()
            self._clean_old_requests(ip)

            # Record request
            self.request_counts[ip].append(now)
            request_count = len(self.request_counts[ip])

            # Check rate
            if request_count > self.rate_config.burst_size:
                self._block_ip(ip, f"Request rate too high: {request_count}/s")
                self.stats['blocked_requests'] += 1
                return False, "Request rate too high, IP blocked"

            if request_count > self.rate_config.requests_per_second:
                self.suspicious_ips[ip] += 1
                if self.suspicious_ips[ip] > 3:
                    self._block_ip(ip, "Multiple rate limit violations")
                self.stats['blocked_requests'] += 1
                return False, "Request rate exceeded"

            # Warning threshold
            if request_count > self.rate_config.requests_per_second * self.rate_config.warning_threshold:
                self.suspicious_ips[ip] += 1

            return True, "OK"

    def register_connection(self, ip: str, conn_id: str) -> Tuple[bool, str]:
        """Register new connection (prevent Slowloris)"""
        with self.lock:
            now = time.time()

            # Clean up timed-out connections
            self.connections[ip] = [
                (cid, t) for cid, t in self.connections[ip]
                if now - t < self.conn_config.connection_timeout
            ]

            # Check connection count
            if len(self.connections[ip]) >= self.conn_config.max_connections_per_ip:
                self.suspicious_ips[ip] += 1
                if self.suspicious_ips[ip] > 5:
                    self._block_ip(ip, "Too many connections (suspected Slowloris)")
                return False, "Connection limit reached"

            self.connections[ip].append((conn_id, now))
            return True, "OK"

    def get_stats(self) -> Dict:
        """Get statistics"""
        return {
            **self.stats,
            'currently_blocked': len(self.blocked_ips),
            'suspicious_ips': len(self.suspicious_ips),
            'active_connections': sum(
                len(conns) for conns in self.connections.values()
            ),
            'block_list': list(self.blocked_ips.keys())
        }

    def unblock_ip(self, ip: str):
        """Unblock IP"""
        if ip in self.blocked_ips:
            del self.blocked_ips[ip]
            print(f"[DDoS Protection] IP {ip} unblocked")

# Usage example
def demonstrate_ddos_protection():
    """Demonstrate DDoS protection"""
    protection = DDoSProtection(
        rate_config=RateLimitConfig(
            requests_per_second=10,
            burst_size=20,
            block_duration=60
        )
    )

    # Add whitelist
    protection.add_to_whitelist('10.0.0.1')

    # Simulate normal traffic
    print("Normal traffic test:")
    for i in range(5):
        allowed, reason = protection.check_request('192.168.1.100', '/')
        print(f"  Request {i+1}: {'Allowed' if allowed else 'Denied'} - {reason}")

    # Simulate attack traffic
    print("\nSimulate DDoS attack:")
    attacker_ip = '10.10.10.10'
    for i in range(25):
        allowed, reason = protection.check_request(attacker_ip, '/')
        if not allowed:
            print(f"  Request {i+1}: Denied - {reason}")
            break

    # View statistics
    print("\nProtection statistics:")
    stats = protection.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    demonstrate_ddos_protection()
```

## Network Monitoring and Log Analysis

### Network Traffic Monitoring

```python
import time
import threading
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import json

@dataclass
class FlowRecord:
    """Network flow record"""
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    bytes_sent: int = 0
    bytes_received: int = 0
    packets_sent: int = 0
    packets_received: int = 0
    start_time: float = field(default_factory=time.time)
    last_update: float = field(default_factory=time.time)

@dataclass
class Alert:
    """Monitoring alert"""
    timestamp: datetime
    alert_type: str
    severity: str
    source: str
    description: str
    metadata: Dict = field(default_factory=dict)

class NetworkMonitor:
    """Network Traffic Monitoring System"""

    def __init__(self):
        self.flows: Dict[str, FlowRecord] = {}
        self.alerts: List[Alert] = []
        self.statistics: Dict[str, Dict] = defaultdict(
            lambda: {'bytes': 0, 'packets': 0, 'connections': 0}
        )
        self.lock = threading.Lock()

        # Alert thresholds
        self.thresholds = {
            'bytes_per_second': 100 * 1024 * 1024,  # 100 MB/s
            'packets_per_second': 100000,
            'connections_per_ip': 1000,
            'unusual_ports': [4444, 5555, 6666, 31337]  # Common malicious ports
        }

        # Baseline data
        self.baseline: Dict[str, float] = {}

    def _get_flow_key(self, src_ip: str, dst_ip: str,
                     src_port: int, dst_port: int) -> str:
        """Generate flow key"""
        return f"{src_ip}:{src_port}->{dst_ip}:{dst_port}"

    def record_packet(self, packet: Dict):
        """Record packet"""
        with self.lock:
            src_ip = packet['src_ip']
            dst_ip = packet['dst_ip']
            src_port = packet.get('src_port', 0)
            dst_port = packet.get('dst_port', 0)
            protocol = packet.get('protocol', 'unknown')
            bytes_count = packet.get('bytes', 0)

            key = self._get_flow_key(src_ip, dst_ip, src_port, dst_port)
            now = time.time()

            if key not in self.flows:
                self.flows[key] = FlowRecord(
                    src_ip=src_ip,
                    dst_ip=dst_ip,
                    src_port=src_port,
                    dst_port=dst_port,
                    protocol=protocol
                )

            flow = self.flows[key]
            flow.bytes_sent += bytes_count
            flow.packets_sent += 1
            flow.last_update = now

            # Update statistics
            self.statistics[src_ip]['bytes'] += bytes_count
            self.statistics[src_ip]['packets'] += 1

            # Detect anomalies
            self._check_anomalies(src_ip, dst_port)

    def _check_anomalies(self, src_ip: str, dst_port: int):
        """Detect traffic anomalies"""
        stats = self.statistics[src_ip]

        # Check bandwidth anomaly
        if stats['bytes'] > self.thresholds['bytes_per_second']:
            self._create_alert(
                alert_type='high_bandwidth',
                severity='warning',
                source=src_ip,
                description=f"IP {src_ip} abnormal bandwidth usage: {stats['bytes'] / 1024 / 1024:.2f} MB"
            )

        # Check suspicious ports
        if dst_port in self.thresholds['unusual_ports']:
            self._create_alert(
                alert_type='suspicious_port',
                severity='high',
                source=src_ip,
                description=f"Detected suspicious port access: {dst_port}"
            )

    def _create_alert(self, alert_type: str, severity: str,
                     source: str, description: str, **metadata):
        """Create alert"""
        alert = Alert(
            timestamp=datetime.now(),
            alert_type=alert_type,
            severity=severity,
            source=source,
            description=description,
            metadata=metadata
        )
        self.alerts.append(alert)

    def get_statistics_summary(self) -> Dict:
        """Get statistics summary"""
        total_bytes = sum(s['bytes'] for s in self.statistics.values())
        total_packets = sum(s['packets'] for s in self.statistics.values())

        return {
            'total_flows': len(self.flows),
            'total_bytes': total_bytes,
            'total_packets': total_packets,
            'unique_sources': len(self.statistics),
            'alerts_count': len(self.alerts)
        }
```

## Summary

Network security is an extensive and in-depth field that requires comprehensive consideration from multiple dimensions to protect network infrastructure and data security:

1. **Defense in Depth**: No single security measure is foolproof; multiple layers of defense must be deployed
2. **Zero Trust**: In modern network environments, assume the network is insecure and verify each access request
3. **Continuous Monitoring**: Real-time monitoring of network traffic and system logs to detect anomalies
4. **Regular Assessment**: Periodically conduct security assessments and penetration testing
5. **Incident Response**: Establish comprehensive incident response processes to respond quickly to security events
6. **Security Awareness**: Provide security training to employees to raise overall security awareness

Network security is an ongoing journey, not a destination. As threats continue to evolve, security measures must be continuously updated and improved to address new challenges.
