---
title: DevSecOps Security Development and Operations Guide
description: Master DevSecOps practices and integrate security into the development workflow
track: security
section: appsec
difficulty: advanced
tags:
  - DevSecOps
  - Shift Left Security
  - CI/CD Security
  - SSDLC
status: imported
origin: old/src/content/docs/security/devsecops.en.md
divergence: 0.224
issues: []
legacy:
  category: Security
  subcategory: DevSecOps
  order: 9
  lastUpdated: 2026-01-07
---

DevSecOps is a methodology that deeply integrates security practices into the DevOps workflow. It breaks the limitation of traditional development models where security is the last checkpoint, making security everyone's responsibility throughout the entire software development lifecycle. This article covers the core concepts, practical methods, and toolchain of DevSecOps to help teams build a "Security as Code" modern development workflow.

## DevSecOps Core Concepts

### Evolution from DevOps to DevSecOps

In traditional software development models, security is often viewed as the "last checkpoint" after development is complete. This model has obvious deficiencies:

```
Traditional Development Model vs DevSecOps

Traditional Model:
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│ Req  │→│ Dev  │→│ Test │→│ Sec  │→│ Ops  │
└──────┘  └──────┘  └──────┘  └──────┘  └──────┘
                                  ↑
                          Security intervenes too late
                          High remediation cost

DevSecOps Model:
┌──────────────────────────────────────────────────────────┐
│                Security Throughout the Process            │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ Req  │→│ Dev  │→│ Test │→│Deploy│→│ Ops  │       │
│  │  +   │  │  +   │  │  +   │  │  +   │  │  +   │       │
│  │ Sec  │  │ Sec  │  │ Sec  │  │ Sec  │  │ Sec  │       │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘       │
└──────────────────────────────────────────────────────────┘
```

### Three Pillars of DevSecOps

DevSecOps is built on three pillars:

1. **Cultural Transformation**: Security is everyone's responsibility, not just the security team's
2. **Process Automation**: Embed security checks into automated pipelines
3. **Technology Toolchain**: Use modern tools to achieve Security as Code

```yaml
# DevSecOps Maturity Model
devsecops_maturity:
  level_1_initial:
    - Manual security testing
    - Security team works in isolation
    - Lack of security automation

  level_2_managed:
    - Basic SAST/DAST tools
    - Development team starts participating in security
    - Partial automated security checks

  level_3_defined:
    - Complete CI/CD security integration
    - Regular security training
    - Formalized threat modeling process

  level_4_quantified:
    - Security metrics drive improvement
    - Automated vulnerability remediation
    - Security debt visualization

  level_5_optimized:
    - Continuous security optimization
    - AI-assisted security decisions
    - Full implementation of zero trust architecture
```

## Shift Left Security

### Core Concept of Shift Left Security

Shift Left Security means introducing security activities as early as possible in the software development lifecycle. Research shows that the cost of finding and fixing security issues in early development is much lower than in production:

```
Vulnerability Remediation Cost Curve

Cost
 ↑                                                    ┌────┐
 │                                                    │100x│
 │                                              ┌─────┴────┤
 │                                              │   30x    │
 │                                    ┌─────────┴──────────┤
 │                                    │      10x           │
 │                    ┌───────────────┴────────────────────┤
 │                    │           5x                       │
 │      ┌─────────────┴────────────────────────────────────┤
 │      │        2x                                        │
 │ ┌────┴──────────────────────────────────────────────────┤
 │ │ 1x                                                    │
 └─┴───────────────────────────────────────────────────────→
   Req    Design    Dev    Test    Release    Prod

 The earlier vulnerabilities are found, the lower the remediation cost
```

### Security Practices in Requirements Phase

Introducing security considerations in the requirements phase can prevent security issues at the source:

```markdown
# Security Requirements Checklist

## Authentication Requirements
- [ ] Is multi-factor authentication (MFA) needed?
- [ ] Does the password policy meet security standards?
- [ ] Is the session management policy clear?
- [ ] Is SSO/OAuth support needed?

## Authorization Requirements
- [ ] Is the role and permission model defined?
- [ ] Is the principle of least privilege implemented?
- [ ] Do sensitive operations require secondary confirmation?

## Data Security Requirements
- [ ] Does sensitive data need encrypted storage?
- [ ] Does data transmission use TLS?
- [ ] Are there data masking requirements?
- [ ] What are the data retention and deletion policies?

## Compliance Requirements
- [ ] Does it involve privacy regulations like GDPR/CCPA?
- [ ] Does it need to meet PCI-DSS requirements?
- [ ] What are the audit logging requirements?
```

### Threat Modeling

Threat modeling is a core practice of shift left security, helping teams identify potential threats during the design phase:

```python
# Threat Modeling Framework: STRIDE Model Implementation
from dataclasses import dataclass
from enum import Enum
from typing import List

class ThreatCategory(Enum):
    SPOOFING = "Identity Spoofing"           # Impersonating legitimate users or systems
    TAMPERING = "Data Tampering"             # Unauthorized data modification
    REPUDIATION = "Repudiation"              # Denying performed actions
    INFORMATION_DISCLOSURE = "Information Disclosure"  # Exposing sensitive information
    DENIAL_OF_SERVICE = "Denial of Service"  # Making system unavailable
    ELEVATION_OF_PRIVILEGE = "Elevation of Privilege"  # Gaining unauthorized permissions

@dataclass
class Threat:
    """Threat Definition"""
    id: str
    category: ThreatCategory
    description: str
    affected_component: str
    likelihood: str  # High/Medium/Low
    impact: str      # High/Medium/Low
    mitigation: str

@dataclass
class DataFlow:
    """Data Flow Definition"""
    source: str
    destination: str
    data_type: str
    protocol: str
    is_encrypted: bool

class ThreatModel:
    """Threat Model Class"""

    def __init__(self, system_name: str):
        self.system_name = system_name
        self.components: List[str] = []
        self.data_flows: List[DataFlow] = []
        self.threats: List[Threat] = []
        self.trust_boundaries: List[str] = []

    def add_component(self, component: str) -> None:
        """Add system component"""
        self.components.append(component)

    def add_data_flow(self, flow: DataFlow) -> None:
        """Add data flow"""
        self.data_flows.append(flow)

    def analyze_threats(self) -> List[Threat]:
        """Analyze potential threats based on STRIDE"""
        threats = []

        for flow in self.data_flows:
            # Check unencrypted data flows
            if not flow.is_encrypted:
                threats.append(Threat(
                    id=f"THREAT-{len(threats)+1:03d}",
                    category=ThreatCategory.INFORMATION_DISCLOSURE,
                    description=f"Data flow {flow.source} -> {flow.destination} is unencrypted",
                    affected_component=flow.source,
                    likelihood="High",
                    impact="High",
                    mitigation="Use TLS to encrypt data transmission"
                ))

            # Check data flows crossing trust boundaries
            if self._crosses_trust_boundary(flow):
                threats.append(Threat(
                    id=f"THREAT-{len(threats)+1:03d}",
                    category=ThreatCategory.SPOOFING,
                    description=f"Data flow crossing trust boundary requires authentication",
                    affected_component=flow.destination,
                    likelihood="Medium",
                    impact="High",
                    mitigation="Implement strong authentication mechanism"
                ))

        self.threats = threats
        return threats

    def _crosses_trust_boundary(self, flow: DataFlow) -> bool:
        """Check if data flow crosses trust boundary"""
        return flow.source.split('.')[0] != flow.destination.split('.')[0]

    def generate_report(self) -> str:
        """Generate threat modeling report"""
        report = f"# {self.system_name} Threat Modeling Report\n\n"
        report += f"## System Components\n"
        for comp in self.components:
            report += f"- {comp}\n"

        report += f"\n## Identified Threats\n"
        for threat in self.threats:
            report += f"\n### {threat.id}: {threat.category.value}\n"
            report += f"- **Description**: {threat.description}\n"
            report += f"- **Affected Component**: {threat.affected_component}\n"
            report += f"- **Likelihood**: {threat.likelihood}\n"
            report += f"- **Impact**: {threat.impact}\n"
            report += f"- **Mitigation**: {threat.mitigation}\n"

        return report

# Usage Example
if __name__ == "__main__":
    model = ThreatModel("E-commerce Platform")

    # Add components
    model.add_component("web.frontend")
    model.add_component("api.gateway")
    model.add_component("service.order")
    model.add_component("db.mysql")

    # Add data flows
    model.add_data_flow(DataFlow(
        source="web.frontend",
        destination="api.gateway",
        data_type="User Request",
        protocol="HTTPS",
        is_encrypted=True
    ))

    model.add_data_flow(DataFlow(
        source="service.order",
        destination="db.mysql",
        data_type="Order Data",
        protocol="TCP",
        is_encrypted=False  # Potential risk
    ))

    # Analyze threats
    threats = model.analyze_threats()
    print(model.generate_report())
```

### Security Design Principles

The following security principles should be followed during the design phase:

```
Security Design Principles

1. Principle of Least Privilege
   ┌─────────────────────────────────────────────┐
   │ Grant only the minimum permissions needed    │
   │ to complete the task                         │
   │ Example: API can only access its responsible │
   │ database tables                              │
   └─────────────────────────────────────────────┘

2. Defense in Depth
   ┌─────────────────────────────────────────────┐
   │ Multiple security controls, single failure   │
   │ doesn't cause complete compromise            │
   │ Example: WAF + App Protection + DB Encrypt   │
   └─────────────────────────────────────────────┘

3. Secure by Default
   ┌─────────────────────────────────────────────┐
   │ System default configuration should be safe  │
   │ Example: HTTPS enabled, debug mode disabled  │
   └─────────────────────────────────────────────┘

4. Zero Trust Architecture
   ┌─────────────────────────────────────────────┐
   │ Never trust, always verify                   │
   │ Example: Service-to-service calls also need  │
   │ authentication                               │
   └─────────────────────────────────────────────┘

5. Fail Secure
   ┌─────────────────────────────────────────────┐
   │ System should enter safe state on failure    │
   │ Example: Deny all requests when auth service │
   │ fails                                        │
   └─────────────────────────────────────────────┘
```

## CI/CD Security Integration

### Security Pipeline Architecture

Deeply integrating security checks into the CI/CD pipeline is a core DevSecOps practice:

```yaml
# .gitlab-ci.yml - Complete DevSecOps Pipeline Example
stages:
  - pre-commit
  - build
  - security-scan
  - test
  - security-gate
  - deploy
  - post-deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  SCAN_SEVERITY_THRESHOLD: "HIGH"

# ========== Pre-commit Stage ==========
secrets-detection:
  stage: pre-commit
  image: trufflesecurity/trufflehog:latest
  script:
    - trufflehog git file://. --only-verified --fail
  allow_failure: false
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

lint-security:
  stage: pre-commit
  image: python:3.11
  script:
    - pip install bandit safety
    - bandit -r src/ -f json -o bandit-report.json || true
    - safety check --full-report
  artifacts:
    reports:
      sast: bandit-report.json
    paths:
      - bandit-report.json
    expire_in: 1 week

# ========== Build Stage ==========
build-image:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# ========== Security Scan Stage ==========
sast-scan:
  stage: security-scan
  image: semgrep/semgrep:latest
  script:
    - semgrep scan --config auto --json --output semgrep-report.json src/
  artifacts:
    reports:
      sast: semgrep-report.json
    paths:
      - semgrep-report.json
    expire_in: 1 week
  allow_failure: true

dependency-scan:
  stage: security-scan
  image: aquasec/trivy:latest
  script:
    - trivy fs --scanners vuln --format json --output trivy-fs-report.json .
    - trivy fs --scanners vuln --severity HIGH,CRITICAL --exit-code 1 .
  artifacts:
    paths:
      - trivy-fs-report.json
    expire_in: 1 week

container-scan:
  stage: security-scan
  image: aquasec/trivy:latest
  script:
    - trivy image --format json --output trivy-image-report.json $DOCKER_IMAGE
    - trivy image --severity HIGH,CRITICAL --exit-code 1 $DOCKER_IMAGE
  artifacts:
    paths:
      - trivy-image-report.json
    expire_in: 1 week
  needs:
    - build-image

iac-scan:
  stage: security-scan
  image: bridgecrew/checkov:latest
  script:
    - checkov -d infrastructure/ --output-file-path . --output junitxml
  artifacts:
    reports:
      junit: results_junitxml.xml
    expire_in: 1 week
  allow_failure: true

# ========== Test Stage ==========
unit-tests:
  stage: test
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - pytest tests/ --cov=src --cov-report=xml
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml

dast-scan:
  stage: test
  image: owasp/zap2docker-stable
  script:
    - zap-baseline.py -t $STAGING_URL -r zap-report.html -J zap-report.json
  artifacts:
    paths:
      - zap-report.html
      - zap-report.json
    expire_in: 1 week
  when: manual
  needs:
    - deploy-staging

# ========== Security Gate Stage ==========
security-gate:
  stage: security-gate
  image: python:3.11
  script:
    - pip install json-spec
    - python scripts/security_gate.py
  needs:
    - sast-scan
    - dependency-scan
    - container-scan
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ========== Deploy Stage ==========
deploy-staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - kubectl set image deployment/app app=$DOCKER_IMAGE
  needs:
    - security-gate
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  stage: deploy
  environment:
    name: production
    url: https://example.com
  script:
    - kubectl set image deployment/app app=$DOCKER_IMAGE
  needs:
    - deploy-staging
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ========== Post-deploy Stage ==========
runtime-security:
  stage: post-deploy
  script:
    - |
      curl -X POST https://security-platform.example.com/api/scan \
        -H "Authorization: Bearer $SECURITY_TOKEN" \
        -d '{"target": "$PRODUCTION_URL", "type": "runtime"}'
  needs:
    - deploy-production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### Security Gate Implementation

Security Gate is a key control point for ensuring code quality:

```python
#!/usr/bin/env python3
"""
security_gate.py - Security Gate Script
Decides whether to allow deployment based on security scan results
"""

import json
import sys
from dataclasses import dataclass
from typing import List, Dict, Any
from enum import Enum

class Severity(Enum):
    CRITICAL = 4
    HIGH = 3
    MEDIUM = 2
    LOW = 1
    INFO = 0

@dataclass
class SecurityPolicy:
    """Security Policy Configuration"""
    max_critical: int = 0
    max_high: int = 5
    max_medium: int = 20
    block_on_secrets: bool = True
    required_scans: List[str] = None

    def __post_init__(self):
        if self.required_scans is None:
            self.required_scans = ['sast', 'dependency', 'container']

@dataclass
class ScanResult:
    """Scan Result"""
    scan_type: str
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int
    secrets_found: bool = False

class SecurityGate:
    """Security Gate Class"""

    def __init__(self, policy: SecurityPolicy):
        self.policy = policy
        self.results: List[ScanResult] = []
        self.violations: List[str] = []

    def load_semgrep_results(self, file_path: str) -> ScanResult:
        """Load Semgrep SAST scan results"""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)

            findings = data.get('results', [])
            severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}

            for finding in findings:
                severity = finding.get('extra', {}).get('severity', 'low').lower()
                if severity in severity_counts:
                    severity_counts[severity] += 1

            return ScanResult(
                scan_type='sast',
                total_findings=len(findings),
                critical=severity_counts['critical'],
                high=severity_counts['high'],
                medium=severity_counts['medium'],
                low=severity_counts['low']
            )
        except FileNotFoundError:
            print(f"Warning: SAST scan result file not found {file_path}")
            return None

    def load_trivy_results(self, file_path: str, scan_type: str) -> ScanResult:
        """Load Trivy scan results"""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)

            severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}

            results = data.get('Results', [])
            for result in results:
                vulnerabilities = result.get('Vulnerabilities', [])
                for vuln in vulnerabilities:
                    severity = vuln.get('Severity', 'LOW').lower()
                    if severity in severity_counts:
                        severity_counts[severity] += 1

            total = sum(severity_counts.values())

            return ScanResult(
                scan_type=scan_type,
                total_findings=total,
                critical=severity_counts['critical'],
                high=severity_counts['high'],
                medium=severity_counts['medium'],
                low=severity_counts['low']
            )
        except FileNotFoundError:
            print(f"Warning: Scan result file not found {file_path}")
            return None

    def check_policy(self) -> bool:
        """Check if security policy is met"""
        passed = True

        # Aggregate all scan results
        total_critical = sum(r.critical for r in self.results if r)
        total_high = sum(r.high for r in self.results if r)
        total_medium = sum(r.medium for r in self.results if r)

        # Check critical vulnerability count
        if total_critical > self.policy.max_critical:
            self.violations.append(
                f"Critical vulnerability count ({total_critical}) exceeds threshold ({self.policy.max_critical})"
            )
            passed = False

        if total_high > self.policy.max_high:
            self.violations.append(
                f"High vulnerability count ({total_high}) exceeds threshold ({self.policy.max_high})"
            )
            passed = False

        if total_medium > self.policy.max_medium:
            self.violations.append(
                f"Medium vulnerability count ({total_medium}) exceeds threshold ({self.policy.max_medium})"
            )
            passed = False

        # Check for secret leakage
        if self.policy.block_on_secrets:
            for result in self.results:
                if result and result.secrets_found:
                    self.violations.append("Detected sensitive secrets in code")
                    passed = False
                    break

        # Check if required scans completed
        completed_scans = {r.scan_type for r in self.results if r}
        missing_scans = set(self.policy.required_scans) - completed_scans
        if missing_scans:
            self.violations.append(f"Missing required security scans: {missing_scans}")
            passed = False

        return passed

    def generate_report(self) -> str:
        """Generate security gate report"""
        report = []
        report.append("=" * 60)
        report.append("           Security Gate Check Report")
        report.append("=" * 60)
        report.append("")

        # Scan results summary
        report.append("## Scan Results Summary")
        report.append("-" * 40)
        for result in self.results:
            if result:
                report.append(f"\n### {result.scan_type.upper()} Scan")
                report.append(f"  - Total Findings: {result.total_findings}")
                report.append(f"  - Critical: {result.critical}")
                report.append(f"  - High: {result.high}")
                report.append(f"  - Medium: {result.medium}")
                report.append(f"  - Low: {result.low}")

        # Policy check results
        report.append("\n## Policy Check")
        report.append("-" * 40)
        report.append(f"  - Max Critical Allowed: {self.policy.max_critical}")
        report.append(f"  - Max High Allowed: {self.policy.max_high}")
        report.append(f"  - Max Medium Allowed: {self.policy.max_medium}")

        # Violations
        if self.violations:
            report.append("\n## Violations (BLOCKED)")
            report.append("-" * 40)
            for violation in self.violations:
                report.append(f"  [X] {violation}")

        # Final result
        report.append("\n" + "=" * 60)
        if not self.violations:
            report.append("          Result: PASSED")
        else:
            report.append("          Result: BLOCKED")
        report.append("=" * 60)

        return "\n".join(report)

def main():
    # Define security policy
    policy = SecurityPolicy(
        max_critical=0,
        max_high=5,
        max_medium=20,
        block_on_secrets=True,
        required_scans=['sast', 'dependency', 'container']
    )

    gate = SecurityGate(policy)

    # Load various scan results
    sast_result = gate.load_semgrep_results('semgrep-report.json')
    if sast_result:
        gate.results.append(sast_result)

    dep_result = gate.load_trivy_results('trivy-fs-report.json', 'dependency')
    if dep_result:
        gate.results.append(dep_result)

    container_result = gate.load_trivy_results('trivy-image-report.json', 'container')
    if container_result:
        gate.results.append(container_result)

    # Check policy
    passed = gate.check_policy()

    # Generate report
    print(gate.generate_report())

    # Return exit code
    sys.exit(0 if passed else 1)

if __name__ == "__main__":
    main()
```

### Pre-commit Security Hooks

Performing security checks before code commits is an important shift left practice:

```yaml
# .pre-commit-config.yaml
repos:
  # Secret Detection
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package-lock.json

  # Git Security Checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-added-large-files
        args: ['--maxkb=1024']
      - id: check-case-conflict
      - id: check-merge-conflict
      - id: detect-private-key
      - id: check-json
      - id: check-yaml
      - id: end-of-file-fixer
      - id: trailing-whitespace

  # Python Security Checks
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        args: ['-r', 'src/', '-ll']
        exclude: tests/

  # Dockerfile Security Checks
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint-docker
        args: ['--ignore', 'DL3008']

  # Terraform Security Checks
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_tfsec
      - id: terraform_checkov

  # YAML lint
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.33.0
    hooks:
      - id: yamllint
        args: ['-c', '.yamllint.yml']

  # Semgrep Lightweight Scan
  - repo: https://github.com/semgrep/semgrep
    rev: v1.52.0
    hooks:
      - id: semgrep
        args: ['--config', 'auto', '--error']
```

```bash
#!/bin/bash
# scripts/setup-precommit.sh - Install and configure pre-commit

set -e

echo "Installing pre-commit security hooks..."

# Check Python environment
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required"
    exit 1
fi

# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install
pre-commit install --hook-type commit-msg

# Initialize secrets baseline file
if [ ! -f ".secrets.baseline" ]; then
    echo "Creating secrets detection baseline..."
    detect-secrets scan > .secrets.baseline
fi

# Run full check once
echo "Running initial security check..."
pre-commit run --all-files || true

echo "Installation complete! Security checks will run automatically before each commit."
```

## Security Scan Automation

### SAST (Static Application Security Testing)

Static analysis detects security vulnerabilities without running the code. Here are example Semgrep rules for detecting common vulnerability patterns:

```yaml
# custom_semgrep_rules/security-rules.yaml
# These rules detect security vulnerability patterns in code
rules:
  - id: hardcoded-password
    patterns:
      - pattern-either:
          - pattern: password = "..."
          - pattern: PASSWORD = "..."
          - pattern: passwd = "..."
          - pattern: secret = "..."
    message: "Detected hardcoded password, use environment variables or secret management service"
    severity: ERROR
    languages: [python, javascript, java]
    metadata:
      category: security
      cwe: "CWE-798"
      owasp: "A3:2017"

  - id: sql-injection-format-string
    patterns:
      - pattern-either:
          - pattern: |
              cursor.execute($QUERY % ...)
          - pattern: |
              cursor.execute($QUERY.format(...))
    message: "Potential SQL injection vulnerability, use parameterized queries"
    severity: ERROR
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-89"
      owasp: "A1:2017"

  - id: insecure-yaml-load
    patterns:
      - pattern-either:
          - pattern: yaml.load(..., Loader=yaml.Loader)
          - pattern: yaml.unsafe_load(...)
    message: "Insecure YAML deserialization, use yaml.safe_load()"
    severity: ERROR
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-502"
      owasp: "A8:2017"

  - id: weak-crypto-hash
    patterns:
      - pattern-either:
          - pattern: hashlib.md5(...)
          - pattern: hashlib.sha1(...)
    message: "Weak hash algorithm used, use SHA-256 or stronger algorithm"
    severity: WARNING
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-327"
```

### SAST Scan Orchestrator

```python
#!/usr/bin/env python3
"""
sast_orchestrator.py - SAST Scan Orchestrator
Integrates scan results from multiple SAST tools
"""

import subprocess
import json
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class Finding:
    """Security Finding"""
    tool: str
    rule_id: str
    severity: str
    message: str
    file_path: str
    line_number: int
    code_snippet: str
    cwe: str = ""
    owasp: str = ""

class SASTOrchestrator:
    """SAST Scan Orchestrator"""

    def __init__(self, target_dir: str):
        self.target_dir = Path(target_dir)
        self.findings: List[Finding] = []
        self.scan_results: Dict[str, Any] = {}

    def run_semgrep(self) -> List[Finding]:
        """Run Semgrep scan"""
        print("Running Semgrep scan...")

        cmd = [
            "semgrep", "scan",
            "--config", "auto",
            "--config", "custom_semgrep_rules/",
            "--json",
            str(self.target_dir)
        ]

        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=300
            )
            data = json.loads(result.stdout)

            findings = []
            for match in data.get('results', []):
                finding = Finding(
                    tool="semgrep",
                    rule_id=match.get('check_id', ''),
                    severity=match.get('extra', {}).get('severity', 'MEDIUM'),
                    message=match.get('extra', {}).get('message', ''),
                    file_path=match.get('path', ''),
                    line_number=match.get('start', {}).get('line', 0),
                    code_snippet=match.get('extra', {}).get('lines', ''),
                    cwe=match.get('extra', {}).get('metadata', {}).get('cwe', ''),
                    owasp=match.get('extra', {}).get('metadata', {}).get('owasp', '')
                )
                findings.append(finding)

            self.scan_results['semgrep'] = {
                'status': 'success',
                'findings_count': len(findings)
            }
            return findings

        except subprocess.TimeoutExpired:
            self.scan_results['semgrep'] = {'status': 'timeout'}
            return []
        except Exception as e:
            self.scan_results['semgrep'] = {'status': 'error', 'message': str(e)}
            return []

    def run_bandit(self) -> List[Finding]:
        """Run Bandit scan (Python projects)"""
        print("Running Bandit scan...")

        cmd = [
            "bandit",
            "-r", str(self.target_dir),
            "-f", "json",
            "-ll"  # Only report medium and above severity
        ]

        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=300
            )
            data = json.loads(result.stdout)

            findings = []
            for issue in data.get('results', []):
                finding = Finding(
                    tool="bandit",
                    rule_id=issue.get('test_id', ''),
                    severity=issue.get('issue_severity', 'MEDIUM'),
                    message=issue.get('issue_text', ''),
                    file_path=issue.get('filename', ''),
                    line_number=issue.get('line_number', 0),
                    code_snippet=issue.get('code', ''),
                    cwe=f"CWE-{issue.get('issue_cwe', {}).get('id', '')}"
                )
                findings.append(finding)

            self.scan_results['bandit'] = {
                'status': 'success',
                'findings_count': len(findings)
            }
            return findings

        except subprocess.TimeoutExpired:
            self.scan_results['bandit'] = {'status': 'timeout'}
            return []
        except Exception as e:
            self.scan_results['bandit'] = {'status': 'error', 'message': str(e)}
            return []

    def run_all_scans(self) -> None:
        """Run all scans"""
        self.findings.extend(self.run_semgrep())
        self.findings.extend(self.run_bandit())
        self._deduplicate_findings()

    def _deduplicate_findings(self) -> None:
        """Remove duplicate findings"""
        seen = set()
        unique_findings = []

        for finding in self.findings:
            key = (finding.file_path, finding.line_number, finding.rule_id)
            if key not in seen:
                seen.add(key)
                unique_findings.append(finding)

        self.findings = unique_findings

    def generate_report(self, output_path: str) -> None:
        """Generate unified format scan report"""
        report = {
            'scan_date': datetime.now().isoformat(),
            'target_directory': str(self.target_dir),
            'scan_results': self.scan_results,
            'summary': {
                'total_findings': len(self.findings),
                'by_severity': self._count_by_severity(),
                'by_tool': self._count_by_tool()
            },
            'findings': [asdict(f) for f in self.findings]
        }

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"Report generated: {output_path}")

    def _count_by_severity(self) -> Dict[str, int]:
        """Count by severity"""
        counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        for finding in self.findings:
            severity = finding.severity.upper()
            if severity in counts:
                counts[severity] += 1
        return counts

    def _count_by_tool(self) -> Dict[str, int]:
        """Count by tool"""
        counts = {}
        for finding in self.findings:
            counts[finding.tool] = counts.get(finding.tool, 0) + 1
        return counts
```

### SCA (Software Composition Analysis)

Analyze known vulnerabilities in project dependencies:

```yaml
# .github/workflows/dependency-scan.yml
name: Dependency Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Run daily

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      # Node.js dependency scan
      - name: NPM Audit
        if: hashFiles('package-lock.json') != ''
        run: |
          npm audit --json > npm-audit.json || true
          npm audit --audit-level=high
        continue-on-error: true

      # Python dependency scan
      - name: Safety Check
        if: hashFiles('requirements.txt') != ''
        run: |
          pip install safety
          safety check -r requirements.txt --json > safety-report.json || true
          safety check -r requirements.txt
        continue-on-error: true

      # Trivy comprehensive scan
      - name: Trivy Vulnerability Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      # Upload to GitHub Security
      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      # SBOM generation
      - name: Generate SBOM
        run: |
          curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
          syft . -o spdx-json > sbom.json

      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: security-reports
          path: |
            npm-audit.json
            safety-report.json
            trivy-results.sarif
            sbom.json
```

### SBOM Analyzer

```python
#!/usr/bin/env python3
"""
sbom_analyzer.py - SBOM Analyzer
Analyzes Software Bill of Materials to identify license risks and security issues
"""

import json
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class Component:
    """Software Component"""
    name: str
    version: str
    license: str
    purl: str
    vulnerabilities: List[str]

class SBOMAnalyzer:
    """SBOM Analyzer"""

    # High-risk licenses (potentially viral)
    RISKY_LICENSES = {
        'GPL-3.0', 'GPL-2.0', 'AGPL-3.0', 'LGPL-3.0',
        'SSPL-1.0', 'Commons Clause'
    }

    # Permissive licenses
    PERMISSIVE_LICENSES = {
        'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause',
        'ISC', 'Unlicense', 'CC0-1.0'
    }

    def __init__(self, sbom_path: str):
        with open(sbom_path, 'r') as f:
            self.sbom = json.load(f)
        self.components: List[Component] = []
        self._parse_sbom()

    def _parse_sbom(self) -> None:
        """Parse SPDX format SBOM"""
        packages = self.sbom.get('packages', [])

        for pkg in packages:
            ext_refs = pkg.get('externalRefs', [{}])
            purl = ext_refs[0].get('referenceLocator', '') if ext_refs else ''

            component = Component(
                name=pkg.get('name', ''),
                version=pkg.get('versionInfo', ''),
                license=pkg.get('licenseConcluded', 'NOASSERTION'),
                purl=purl,
                vulnerabilities=[]
            )
            self.components.append(component)

    def analyze_licenses(self) -> Dict[str, List[str]]:
        """Analyze license risks"""
        results = {
            'risky': [],
            'permissive': [],
            'unknown': []
        }

        for comp in self.components:
            license_id = comp.license

            if license_id in self.RISKY_LICENSES:
                results['risky'].append(f"{comp.name}@{comp.version}: {license_id}")
            elif license_id in self.PERMISSIVE_LICENSES:
                results['permissive'].append(f"{comp.name}@{comp.version}: {license_id}")
            else:
                results['unknown'].append(f"{comp.name}@{comp.version}: {license_id}")

        return results

    def check_eol_components(self) -> List[str]:
        """Check for end-of-life components"""
        eol_components = []

        # Known EOL version patterns
        eol_patterns = {
            'python': ['2.7', '3.5', '3.6'],
            'node': ['10.', '12.', '14.'],
            'django': ['1.', '2.0', '2.1'],
            'angular': ['1.', '2.', '4.', '5.', '6.', '7.', '8.']
        }

        for comp in self.components:
            name_lower = comp.name.lower()
            for pattern_name, versions in eol_patterns.items():
                if pattern_name in name_lower:
                    for v in versions:
                        if comp.version.startswith(v):
                            eol_components.append(
                                f"{comp.name}@{comp.version} (EOL)"
                            )
                            break

        return eol_components

    def generate_report(self) -> str:
        """Generate analysis report"""
        license_analysis = self.analyze_licenses()
        eol_components = self.check_eol_components()

        report = []
        report.append("=" * 60)
        report.append("           SBOM Security Analysis Report")
        report.append("=" * 60)
        report.append(f"\nTotal Components: {len(self.components)}")

        report.append("\n## License Analysis")
        report.append("-" * 40)

        if license_analysis['risky']:
            report.append("\n### High-Risk Licenses (Legal Review Required)")
            for item in license_analysis['risky']:
                report.append(f"  [!] {item}")

        report.append(f"\nPermissive License Components: {len(license_analysis['permissive'])}")
        report.append(f"Unknown License Components: {len(license_analysis['unknown'])}")

        if eol_components:
            report.append("\n## End-of-Life Components")
            report.append("-" * 40)
            for item in eol_components:
                report.append(f"  [!] {item}")

        return "\n".join(report)
```

### DAST (Dynamic Application Security Testing)

Detect security vulnerabilities at runtime:

```python
#!/usr/bin/env python3
"""
dast_scanner.py - DAST Scanner Wrapper
Integrates OWASP ZAP for dynamic security testing
"""

import time
import json
import requests
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class DastFinding:
    """DAST Finding"""
    alert: str
    risk: str
    confidence: str
    url: str
    description: str
    solution: str
    cweid: str
    wascid: str

class ZAPScanner:
    """OWASP ZAP Scanner"""

    def __init__(self, zap_url: str = "http://localhost:8080", api_key: str = ""):
        self.zap_url = zap_url
        self.api_key = api_key
        self.session = requests.Session()

    def _api_call(self, endpoint: str, params: Dict = None) -> Dict:
        """Call ZAP API"""
        if params is None:
            params = {}
        params['apikey'] = self.api_key

        response = self.session.get(f"{self.zap_url}/{endpoint}", params=params)
        return response.json()

    def spider_scan(self, target_url: str, max_depth: int = 5) -> str:
        """Spider scan"""
        print(f"Starting spider scan: {target_url}")

        result = self._api_call("JSON/spider/action/scan/", {
            "url": target_url,
            "maxChildren": max_depth
        })

        scan_id = result.get('scan')

        # Wait for spider to complete
        while True:
            status = self._api_call("JSON/spider/view/status/", {"scanId": scan_id})
            progress = int(status.get('status', 0))
            print(f"Spider progress: {progress}%")

            if progress >= 100:
                break
            time.sleep(5)

        return scan_id

    def active_scan(self, target_url: str) -> str:
        """Active scan"""
        print(f"Starting active scan: {target_url}")

        result = self._api_call("JSON/ascan/action/scan/", {
            "url": target_url,
            "recurse": "true",
            "inScopeOnly": "true"
        })

        scan_id = result.get('scan')

        # Wait for scan to complete
        while True:
            status = self._api_call("JSON/ascan/view/status/", {"scanId": scan_id})
            progress = int(status.get('status', 0))
            print(f"Scan progress: {progress}%")

            if progress >= 100:
                break
            time.sleep(10)

        return scan_id

    def get_alerts(self, base_url: str = None) -> List[DastFinding]:
        """Get scan alerts"""
        params = {}
        if base_url:
            params['baseurl'] = base_url

        result = self._api_call("JSON/core/view/alerts/", params)

        findings = []
        for alert in result.get('alerts', []):
            finding = DastFinding(
                alert=alert.get('alert', ''),
                risk=alert.get('risk', ''),
                confidence=alert.get('confidence', ''),
                url=alert.get('url', ''),
                description=alert.get('description', ''),
                solution=alert.get('solution', ''),
                cweid=alert.get('cweid', ''),
                wascid=alert.get('wascid', '')
            )
            findings.append(finding)

        return findings

class DastOrchestrator:
    """DAST Scan Orchestrator"""

    def __init__(self, target_url: str, zap_url: str = "http://localhost:8080"):
        self.target_url = target_url
        self.scanner = ZAPScanner(zap_url)
        self.findings: List[DastFinding] = []

    def run_full_scan(self) -> None:
        """Run full scan"""
        print("=" * 50)
        print(f"Starting DAST scan: {self.target_url}")
        print("=" * 50)

        self.scanner.spider_scan(self.target_url)
        self.scanner.active_scan(self.target_url)
        self.findings = self.scanner.get_alerts(self.target_url)

        print(f"\nScan complete, found {len(self.findings)} issues")

    def run_baseline_scan(self) -> None:
        """Run baseline scan (passive scan only)"""
        print("=" * 50)
        print(f"Starting baseline scan: {self.target_url}")
        print("=" * 50)

        self.scanner.spider_scan(self.target_url)
        time.sleep(30)  # Wait for passive scan
        self.findings = self.scanner.get_alerts(self.target_url)

        print(f"\nScan complete, found {len(self.findings)} issues")

    def get_summary(self) -> Dict[str, int]:
        """Get scan summary"""
        summary = {'High': 0, 'Medium': 0, 'Low': 0, 'Informational': 0}

        for finding in self.findings:
            if finding.risk in summary:
                summary[finding.risk] += 1

        return summary

    def export_report(self, output_path: str) -> None:
        """Export JSON report"""
        report = {
            'target_url': self.target_url,
            'summary': self.get_summary(),
            'findings': [
                {
                    'alert': f.alert,
                    'risk': f.risk,
                    'confidence': f.confidence,
                    'url': f.url,
                    'description': f.description,
                    'solution': f.solution,
                    'cwe': f.cweid
                }
                for f in self.findings
            ]
        }

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"JSON report generated: {output_path}")
```

## Secure Software Development Lifecycle (SSDLC)

### SSDLC Framework

The Secure Software Development Lifecycle integrates security into every phase of development:

```
Secure Software Development Lifecycle (SSDLC)

┌────────────┐     ┌────────────┐     ┌────────────┐
│Requirements│────→│   Design   │────→│Development │
│            │     │            │     │            │
│ - Security │     │ - Threat   │     │ - Secure   │
│   Req      │     │   Modeling │     │   Coding   │
│ - Compliance│    │ - Security │     │ - Code     │
│ - Risk     │     │   Arch     │     │   Review   │
│   Assessment│    │ - Design   │     │ - SAST     │
└────────────┘     │   Review   │     └────────────┘
       ↑           └────────────┘            │
       │                                     ↓
┌────────────┐     ┌────────────┐     ┌────────────┐
│ Operations │←────│  Deploy    │←────│   Test     │
│            │     │            │     │            │
│ - Security │     │ - Security │     │ - DAST     │
│   Monitoring│    │   Config   │     │ - SCA      │
│ - Incident │     │ - Pen Test │     │ - Security │
│   Response │     │ - Security │     │   Testing  │
│ - Continuous│    │   Audit    │     └────────────┘
│   Assessment│    └────────────┘
└────────────┘

              Continuous Feedback and Improvement
```

### Security Coding Guidelines

Establishing and enforcing security coding standards is core to SSDLC:

```python
"""
secure_coding_guidelines.py - Security Coding Guidelines Example
Demonstrates proper handling of common security issues
"""

import hashlib
import secrets
import hmac
from typing import Optional
import re
import os

# ==================== Input Validation ====================

class InputValidator:
    """Input Validator"""

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False
        if len(email) > 254:
            return False
        return True

    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username - only allow letters, numbers, underscores"""
        pattern = r'^[a-zA-Z0-9_]{3,20}$'
        return bool(re.match(pattern, username))

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal"""
        # Remove path separators
        filename = os.path.basename(filename)
        # Remove special characters
        filename = re.sub(r'[^\w\.-]', '_', filename)
        # Remove leading dots (hidden files)
        filename = filename.lstrip('.')
        return filename or 'unnamed'

    @staticmethod
    def validate_url(url: str, allowed_schemes: list = None) -> bool:
        """Validate URL to prevent SSRF"""
        if allowed_schemes is None:
            allowed_schemes = ['https']

        from urllib.parse import urlparse
        try:
            parsed = urlparse(url)
            if parsed.scheme not in allowed_schemes:
                return False
            if not parsed.netloc:
                return False
            # Prevent SSRF - block internal addresses
            if parsed.hostname in ['localhost', '127.0.0.1', '0.0.0.0']:
                return False
            return True
        except Exception:
            return False

# ==================== Password Handling ====================

class PasswordHandler:
    """Secure Password Handling"""

    MIN_LENGTH = 12
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL = True

    @classmethod
    def validate_password_strength(cls, password: str) -> tuple:
        """Validate password strength"""
        if len(password) < cls.MIN_LENGTH:
            return False, f"Password must be at least {cls.MIN_LENGTH} characters"

        if cls.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            return False, "Password must contain uppercase letters"

        if cls.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            return False, "Password must contain lowercase letters"

        if cls.REQUIRE_DIGIT and not re.search(r'\d', password):
            return False, "Password must contain digits"

        if cls.REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain special characters"

        return True, "Password strength meets requirements"

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using secure algorithm"""
        try:
            # Recommended: Use Argon2
            from argon2 import PasswordHasher
            ph = PasswordHasher()
            return ph.hash(password)
        except ImportError:
            # Fallback: Use PBKDF2
            salt = secrets.token_bytes(32)
            key = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode(),
                salt,
                iterations=600000  # OWASP recommended
            )
            return f"pbkdf2:sha256:600000${salt.hex()}${key.hex()}"

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password"""
        try:
            from argon2 import PasswordHasher
            ph = PasswordHasher()
            ph.verify(hashed, password)
            return True
        except ImportError:
            # PBKDF2 verification
            if not hashed.startswith('pbkdf2:'):
                return False
            parts = hashed.split('$')
            salt = bytes.fromhex(parts[1])
            stored_key = bytes.fromhex(parts[2])
            new_key = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode(),
                salt,
                iterations=600000
            )
            return hmac.compare_digest(new_key, stored_key)
        except Exception:
            return False

# ==================== Secure Random Numbers ====================

class SecureRandom:
    """Secure Random Number Generation"""

    @staticmethod
    def generate_token(length: int = 32) -> str:
        """Generate secure token"""
        return secrets.token_urlsafe(length)

    @staticmethod
    def generate_api_key() -> str:
        """Generate API key"""
        return f"sk_{secrets.token_urlsafe(32)}"

    @staticmethod
    def generate_otp(digits: int = 6) -> str:
        """Generate one-time password"""
        return ''.join(str(secrets.randbelow(10)) for _ in range(digits))

# ==================== SQL Injection Prevention ====================

class DatabaseHandler:
    """Secure Database Operations"""

    def __init__(self, connection):
        self.conn = connection

    def get_user_secure(self, user_id: int) -> Optional[dict]:
        """Secure user query - using parameterized queries"""
        cursor = self.conn.cursor()

        # Correct: Use parameterized queries, never concatenate SQL
        cursor.execute(
            "SELECT id, username, email FROM users WHERE id = %s",
            (user_id,)
        )

        row = cursor.fetchone()
        if row:
            return {'id': row[0], 'username': row[1], 'email': row[2]}
        return None

    def search_users_secure(self, keyword: str, limit: int = 10) -> list:
        """Secure fuzzy search"""
        cursor = self.conn.cursor()

        # Correct: Parameterized query + limit result count
        cursor.execute(
            "SELECT id, username FROM users WHERE username LIKE %s LIMIT %s",
            (f"%{keyword}%", min(limit, 100))
        )

        return [{'id': row[0], 'username': row[1]} for row in cursor.fetchall()]

# ==================== Secure Logging ====================

class SecureLogger:
    """Secure Logging"""

    SENSITIVE_FIELDS = {
        'password', 'passwd', 'secret', 'token', 'api_key',
        'credit_card', 'ssn', 'authorization'
    }

    @classmethod
    def sanitize_log_data(cls, data: dict) -> dict:
        """Sanitize sensitive information in log data"""
        sanitized = {}

        for key, value in data.items():
            key_lower = key.lower()

            if any(sensitive in key_lower for sensitive in cls.SENSITIVE_FIELDS):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_log_data(value)
            else:
                sanitized[key] = value

        return sanitized

    @classmethod
    def log_security_event(cls, event_type: str, details: dict) -> None:
        """Log security event"""
        import logging
        import json
        from datetime import datetime

        logger = logging.getLogger('security')

        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'details': cls.sanitize_log_data(details)
        }

        logger.info(json.dumps(log_entry))
```

### Security Code Review Checklist

```markdown
# Security Code Review Checklist

## Authentication and Authorization
- [ ] Passwords use strong hash algorithms (Argon2, bcrypt, PBKDF2)
- [ ] Account lockout mechanism implemented
- [ ] Session tokens use cryptographically secure random generation
- [ ] Sensitive operations require re-authentication
- [ ] Permission checks executed on server side
- [ ] Principle of least privilege followed

## Input Validation
- [ ] All user input is validated
- [ ] Whitelist validation instead of blacklist
- [ ] File uploads limited by type and size
- [ ] Path traversal attacks prevented
- [ ] URL redirects only allow whitelisted domains

## Output Encoding
- [ ] HTML output properly encoded
- [ ] JavaScript context properly escaped
- [ ] SQL uses parameterized queries
- [ ] Command execution uses safe APIs (avoid shell calls)

## Data Protection
- [ ] Sensitive data transmitted using TLS
- [ ] Sensitive data storage encrypted
- [ ] Keys use key management services
- [ ] Logs do not contain sensitive information
- [ ] Data minimization principle implemented

## Error Handling
- [ ] Detailed error information not exposed to users
- [ ] Fail secure
- [ ] Exceptions properly caught and handled
- [ ] Security-related errors logged

## Security Configuration
- [ ] Debug mode disabled in production
- [ ] Security HTTP headers configured
- [ ] CORS policy properly configured
- [ ] Dependencies are latest versions
```

## DevSecOps Toolchain

### Toolchain Overview

```
DevSecOps Toolchain

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Code Security   │  │  Build Security  │  │ Deploy Security  │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - Semgrep       │  │ - Trivy         │  │ - Falco         │
│ - SonarQube     │  │ - Snyk          │  │ - OPA/Gatekeeper│
│ - Bandit        │  │ - Grype         │  │ - Vault         │
│ - ESLint        │  │ - Cosign        │  │ - Cert-Manager  │
│ - Checkov       │  │ - Syft          │  │ - Istio         │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Runtime Security │  │   Monitoring     │  │ Compliance Audit │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - Sysdig        │  │ - Prometheus    │  │ - OpenSCAP      │
│ - Aqua Security │  │ - Grafana       │  │ - InSpec        │
│ - StackRox      │  │ - ELK Stack     │  │ - Anchore       │
│ - Tetragon      │  │ - Splunk        │  │ - Prowler       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Secret Management Integration

```python
#!/usr/bin/env python3
"""
secrets_manager.py - Secret Management Integration
Supports multiple secret management backends
"""

import os
from abc import ABC, abstractmethod
from typing import Optional, Dict

class SecretsBackend(ABC):
    """Secrets Backend Abstract Class"""

    @abstractmethod
    def get_secret(self, key: str) -> Optional[str]:
        """Get secret"""
        pass

    @abstractmethod
    def set_secret(self, key: str, value: str) -> bool:
        """Set secret"""
        pass

class HashiCorpVault(SecretsBackend):
    """HashiCorp Vault Integration"""

    def __init__(self, addr: str, token: str, mount_point: str = "secret"):
        import hvac
        self.client = hvac.Client(url=addr, token=token)
        self.mount_point = mount_point

    def get_secret(self, key: str) -> Optional[str]:
        try:
            secret = self.client.secrets.kv.v2.read_secret_version(
                path=key,
                mount_point=self.mount_point
            )
            return secret['data']['data'].get('value')
        except Exception:
            return None

    def set_secret(self, key: str, value: str) -> bool:
        try:
            self.client.secrets.kv.v2.create_or_update_secret(
                path=key,
                secret={'value': value},
                mount_point=self.mount_point
            )
            return True
        except Exception:
            return False

class AWSSecretsManager(SecretsBackend):
    """AWS Secrets Manager Integration"""

    def __init__(self, region: str = "us-east-1"):
        import boto3
        self.client = boto3.client('secretsmanager', region_name=region)

    def get_secret(self, key: str) -> Optional[str]:
        try:
            response = self.client.get_secret_value(SecretId=key)
            return response['SecretString']
        except Exception:
            return None

    def set_secret(self, key: str, value: str) -> bool:
        try:
            self.client.put_secret_value(
                SecretId=key,
                SecretString=value
            )
            return True
        except Exception:
            return False

class SecretsManager:
    """Unified Secrets Manager"""

    def __init__(self, backend: SecretsBackend):
        self.backend = backend
        self._cache: Dict[str, str] = {}
        self._cache_enabled = True

    def get(self, key: str, default: str = None) -> Optional[str]:
        """Get secret with caching support"""
        # First check environment variables
        env_value = os.environ.get(key)
        if env_value:
            return env_value

        # Check cache
        if self._cache_enabled and key in self._cache:
            return self._cache[key]

        # Get from backend
        value = self.backend.get_secret(key)

        if value and self._cache_enabled:
            self._cache[key] = value

        return value or default

    def clear_cache(self) -> None:
        """Clear cache"""
        self._cache.clear()

def create_secrets_manager() -> SecretsManager:
    """Create secrets manager based on environment"""
    backend_type = os.environ.get('SECRETS_BACKEND', 'vault')

    if backend_type == 'vault':
        return SecretsManager(HashiCorpVault(
            addr=os.environ.get('VAULT_ADDR', 'http://localhost:8200'),
            token=os.environ.get('VAULT_TOKEN', '')
        ))
    elif backend_type == 'aws':
        return SecretsManager(AWSSecretsManager(
            region=os.environ.get('AWS_REGION', 'us-east-1')
        ))
    else:
        raise ValueError(f"Unsupported secrets backend: {backend_type}")
```

## Summary and Best Practices

### DevSecOps Implementation Roadmap

```
DevSecOps Implementation Roadmap

Phase 1 (1-3 months): Foundation Building
┌─────────────────────────────────────────────────────────────┐
│ - Establish security coding standards                       │
│ - Deploy SAST tools                                         │
│ - Configure pre-commit security checks                      │
│ - Conduct security awareness training                       │
└─────────────────────────────────────────────────────────────┘

Phase 2 (3-6 months): Process Integration
┌─────────────────────────────────────────────────────────────┐
│ - CI/CD pipeline security integration                       │
│ - Implement SCA dependency scanning                         │
│ - Establish security gate mechanism                         │
│ - Formalize threat modeling process                         │
└─────────────────────────────────────────────────────────────┘

Phase 3 (6-12 months): Deep Optimization
┌─────────────────────────────────────────────────────────────┐
│ - Container and IaC security scanning                       │
│ - DAST automated testing                                    │
│ - Establish security metrics system                         │
│ - Implement security champions program                      │
└─────────────────────────────────────────────────────────────┘

Phase 4 (Ongoing): Mature Operations
┌─────────────────────────────────────────────────────────────┐
│ - Continuous improvement and optimization                   │
│ - Automated vulnerability remediation                       │
│ - Security Operations Center (SOC) integration              │
│ - Zero trust architecture evolution                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Success Factors

1. **Leadership Support**: DevSecOps transformation requires top-down promotion
2. **Cultural Change**: Security is everyone's responsibility, not just the security team's
3. **Automation First**: Automate security checks as much as possible, reduce manual intervention
4. **Incremental Implementation**: Start small, gradually expand
5. **Continuous Learning**: Security threats constantly evolve, teams need continuous learning

### Common Pitfalls and Responses

| Pitfall | Manifestation | Response Strategy |
|---------|---------------|-------------------|
| Tool Hoarding | Deploy many tools without integration | Establish tool selection criteria, focus on tool integration |
| Ignoring Culture | Only focus on technology, ignore training | Establish security champions program, regular training |
| Over-blocking | Security gates too strict affecting efficiency | Gradually raise standards, balance security and efficiency |
| Alert Fatigue | Many false positives cause team to ignore alerts | Optimize rules, reduce false positives, tiered alerting |
| Lack of Metrics | Cannot quantify security improvement | Establish security metrics system, regular assessment |

### Security Metrics System

```yaml
# DevSecOps Key Metrics
metrics:
  # Vulnerability Management
  vulnerability_metrics:
    - name: "Mean Time to Remediate (MTTR)"
      target: "Critical vulnerabilities < 24 hours"
      measurement: "Average time from discovery to fix"

    - name: "Vulnerability Escape Rate"
      target: "< 5%"
      measurement: "Vulnerabilities found in production / Total vulnerabilities"

    - name: "Security Debt"
      target: "Continuously decreasing"
      measurement: "Cumulative count of unfixed vulnerabilities"

  # Process Metrics
  process_metrics:
    - name: "Security Scan Coverage"
      target: "> 95%"
      measurement: "Code changes scanned / Total changes"

    - name: "Security Gate Pass Rate"
      target: "> 80%"
      measurement: "Builds passing security gate first time / Total builds"

    - name: "Threat Modeling Coverage"
      target: "> 90%"
      measurement: "Projects with threat modeling / Total projects"

  # Culture Metrics
  culture_metrics:
    - name: "Security Training Completion Rate"
      target: "100%"
      measurement: "Developers completing training / Total developers"

    - name: "Security Champion Coverage"
      target: "At least 1 per team"
      measurement: "Number of teams with security champions"
```

DevSecOps is a continuous journey, not a destination. By integrating security into every aspect of the development workflow, organizations can significantly improve software security while maintaining development velocity. Remember, security is not an obstacle to innovation, but the foundation enabling sustainable business development.
