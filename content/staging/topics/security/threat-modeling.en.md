---
title: 威胁建模
description: 学习系统化识别和评估安全威胁
track: security
section: appsec
difficulty: intermediate
tags:
  - 威胁建模
  - STRIDE
  - 安全设计
  - 风险评估
status: imported
origin: old/src/content/docs/security/threat-modeling.en.md
divergence: 0.212
issues:
  - title-lang-en
  - title-language
legacy:
  category: Security
  subcategory: Design
  order: 14
  lastUpdated: 2026-01-07
---

Threat modeling is a systematic security analysis methodology used to identify, assess, and address potential security threats in software systems. By considering security issues during the design phase, teams can discover and resolve security vulnerabilities before writing code, significantly reducing remediation costs and security risks.

## Concept Explanation

### What is Threat Modeling

Threat Modeling is a structured process for identifying security requirements, determining threats and potential vulnerabilities, quantifying the severity of threats and vulnerabilities, and prioritizing mitigation measures. It answers four core questions:

1. **What are we building?** - Understand system architecture and data flows
2. **What can go wrong?** - Identify potential threats
3. **What are we going to do about it?** - Determine mitigation strategies
4. **Did we do a good enough job?** - Validate and improve

### Why Threat Modeling is Needed

| Advantage | Description |
|-----------|-------------|
| Early problem detection | Identify security issues during design phase when remediation cost is lowest |
| Systematic thinking | Provides structured approach to avoid missing critical threats |
| Resource optimization | Helps teams prioritize the most critical security risks |
| Knowledge sharing | Promotes shared understanding of system security requirements |
| Compliance support | Meets security assessment requirements of PCI DSS, HIPAA, and other regulations |

### When to Perform Threat Modeling

Threat modeling should be conducted at multiple stages of the software development lifecycle:

- **Design phase**: Most valuable, lowest modification cost
- **Development phase**: Verify implementation conforms to security design
- **Pre-launch**: Final security review
- **Major changes**: Re-evaluate when adding new features or architecture changes
- **Regular reviews**: Address newly emerging threats and attack techniques

## Threat Modeling Methodologies

### STRIDE Model

STRIDE is a threat classification model developed by Microsoft and is one of the most widely used threat modeling frameworks. Each letter represents a threat type:

| Threat Type | Full Name | Description | Violated Security Property |
|-------------|-----------|-------------|---------------------------|
| Spoofing | Spoofing | Impersonating another user or system | Authentication |
| Tampering | Tampering | Malicious modification of data | Integrity |
| Repudiation | Repudiation | Denying actions performed | Non-repudiation |
| Information Disclosure | Information Disclosure | Exposing sensitive information | Confidentiality |
| Denial of Service | Denial of Service | Making system unavailable | Availability |
| Elevation of Privilege | Elevation of Privilege | Gaining unauthorized access privileges | Authorization |

**STRIDE Threats and Security Controls Mapping**:

```
Threat Type          →    Mitigation Strategy
─────────────────────────────────────────
Spoofing        →    Authentication
Tampering       →    Integrity Verification
Repudiation     →    Logging/Auditing
Info Disclosure →    Encryption/ACL
DoS             →    Availability Design
EoP             →    Authorization
```

**STRIDE Application Example**:

```
Using web application login functionality as an example:

┌─────────────────┐      HTTPS       ┌─────────────────┐
│      User       │ ───────────────> │   Web Server    │
│   (Browser)     │                  │                 │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │    Database     │
                                     │                 │
                                     └─────────────────┘

Threat Analysis:
┌──────────┬────────────────────────────────────────┐
│ Threat   │ Specific Threat                        │
├──────────┼────────────────────────────────────────┤
│ Spoofing │ Attacker impersonates legitimate user  │
│ Tampering│ Man-in-the-middle modifies login req   │
│ Repudiati│ User denies making a login attempt     │
│ Info Disc│ Password leaked during transit/storage │
│ DoS      │ Brute force causes account lockout     │
│ EoP      │ Regular user gains admin privileges    │
└──────────┴────────────────────────────────────────┘
```

### PASTA Methodology

PASTA (Process for Attack Simulation and Threat Analysis) is a risk-centric seven-stage threat modeling methodology that emphasizes business impact analysis.

**Seven Stages**:

```
Stage 1: Define Objectives
    │   - Identify business objectives
    │   - Determine security and compliance requirements
    │   - Conduct preliminary business impact analysis
    ▼
Stage 2: Define Technical Scope
    │   - Determine system boundaries
    │   - Identify dependencies
    │   - Document technical architecture
    ▼
Stage 3: Application Decomposition
    │   - Create data flow diagrams
    │   - Identify entry points
    │   - Identify trust boundaries
    ▼
Stage 4: Threat Analysis
    │   - Gather threat intelligence
    │   - Analyze attack scenarios
    │   - Identify threat agents
    ▼
Stage 5: Vulnerability Analysis
    │   - Identify system vulnerabilities
    │   - Correlate threats and vulnerabilities
    │   - Assess vulnerability exploitability
    ▼
Stage 6: Attack Modeling
    │   - Create attack trees
    │   - Simulate attack paths
    │   - Determine attack probability
    ▼
Stage 7: Risk & Impact Analysis
        - Quantify risk
        - Prioritize
        - Develop mitigation strategies
```

**PASTA vs STRIDE Comparison**:

| Feature | STRIDE | PASTA |
|---------|--------|-------|
| Focus | Technical threats | Business risk |
| Complexity | Lower | Higher |
| Time required | Shorter | Longer |
| Use case | Quick threat identification | Deep risk analysis |
| Output | Threat list | Complete risk report |

### LINDDUN Methodology

LINDDUN focuses on privacy threat modeling, particularly suitable for systems that process personal data.

**Seven Privacy Threats**:

| Threat | Full Name | Description |
|--------|-----------|-------------|
| Linkability | Linkability | Ability to link two or more pieces of data to the same person |
| Identifiability | Identifiability | Ability to identify the data subject |
| Non-repudiation | Non-repudiation | User cannot deny their actions (negative from privacy perspective) |
| Detectability | Detectability | Ability to discover existence of a record |
| Disclosure | Disclosure of information | Excessive exposure of personal information |
| Unawareness | Unawareness | Data subject unaware of data collection or use |
| Non-compliance | Non-compliance | Violation of privacy regulations or policies |

**LINDDUN Application Scenario**:

```
Using a healthcare application as an example:

User data flow:
User → Health App → Cloud Service → Healthcare Provider

Privacy threat analysis:
┌─────────────────┬───────────────────────────────────┐
│ Threat          │ Specific Risk                     │
├─────────────────┼───────────────────────────────────┤
│ Linkability     │ Multiple visits linked to track   │
│                 │ user behavior                     │
│ Identifiability │ Identify individual through       │
│                 │ health data patterns              │
│ Non-repudiation │ User cannot deny viewing specific │
│                 │ health information                │
│ Detectability   │ Attacker can discover user has    │
│                 │ specific disease record           │
│ Disclosure      │ Health data accessed by           │
│                 │ unauthorized parties              │
│ Unawareness     │ User unaware data analyzed by     │
│                 │ third parties                     │
│ Non-compliance  │ Violation of GDPR or HIPAA        │
└─────────────────┴───────────────────────────────────┘
```

## Data Flow Diagrams (DFD)

Data flow diagrams are the core tool for threat modeling, used to visualize data movement within systems.

### DFD Elements

```
┌─────────────────────────────────────────────────────────────┐
│                      DFD Basic Elements                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐                                                │
│  │         │    External Entity                             │
│  │  User   │    - Participants outside the system           │
│  │         │    - Can be people, external systems, etc.     │
│  └─────────┘                                                │
│                                                             │
│  ╔═════════╗                                                │
│  ║         ║    Process                                     │
│  ║Web Svc  ║    - Components that process or transform data │
│  ║         ║    - Internal processing logic of the system   │
│  ╚═════════╝                                                │
│                                                             │
│  ═══════════                                                │
│  │Database │     Data Store                                 │
│  ═══════════    - Location where data is stored             │
│                 - Files, databases, caches, etc.            │
│                                                             │
│  ──────────>    Data Flow                                   │
│                 - Movement of data between elements         │
│                 - Annotate data type and transport protocol │
│                                                             │
│  - - - - - -    Trust Boundary                              │
│  │        │     - Boundary between different trust levels   │
│  - - - - - -    - Data flows crossing boundaries need       │
│                   special attention                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### DFD Levels

DFDs can be divided into multiple levels based on detail:

```
Level 0 (Context Diagram):
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌──────┐         ╔════════════════╗        ┌───────┐  │
│  │ User │ ──────> ║  E-Commerce    ║ ─────> │Payment│  │
│  └──────┘         ║    System      ║        │Gateway│  │
│                   ╚════════════════╝        └───────┘  │
└────────────────────────────────────────────────────────┘

Level 1 (System Decomposition):
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌──────┐      ╔══════════╗      ╔══════════╗     ┌──────┐ │
│  │ User │ ───> ║Web Front ║ ───> ║API Service║ ──>│Payment│ │
│  └──────┘      ╚══════════╝      ╚════╤═════╝     │Gateway│ │
│                                       │           └──────┘ │
│                                       ▼                    │
│                                 ═══════════                │
│                                 │Order DB │                │
│                                 ═══════════                │
└────────────────────────────────────────────────────────────┘

Level 2 (Component Detail Analysis):
Further decompose API Service internal components...
```

### DFD Practical Example

Using a typical microservices e-commerce system as an example:

```
                     ┌─────────────────────────────────────────────────┐
                     │                Internet (Untrusted)              │
                     └─────────────────────────────────────────────────┘
                                            │
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ DMZ                                       ▼                        │
│                                   ╔═══════════════╗                │
│  ┌─────────┐    HTTPS            ║  API Gateway  ║                │
│  │  User   │ ──────────────────> ║ (Auth/Rate    ║                │
│  │(Browser)│                     ║   Limiting)   ║                │
│  └─────────┘                     ╚═══════╤═══════╝                │
│                                          │                         │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                                           │ gRPC/mTLS
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ Internal Network                         │                        │
│                      ┌────────────────────┼────────────────────┐   │
│                      │                    │                    │   │
│                      ▼                    ▼                    ▼   │
│              ╔═══════════════╗    ╔═══════════════╗    ╔════════╗  │
│              ║ User Service  ║    ║ Order Service ║    ║Payment ║  │
│              ╚═══════╤═══════╝    ╚═══════╤═══════╝    ║Service ║  │
│                      │                    │            ╚════╤═══╝  │
│                      ▼                    ▼                 │      │
│               ═══════════          ═══════════              │      │
│               │ User DB │          │Order DB │              │      │
│               ═══════════          ═══════════              │      │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ┘
                                                              │
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ┐
│ External Services                                           │      │
│                                                             ▼      │
│                                                       ┌─────────┐  │
│                                                       │ Payment │  │
│                                                       │ Gateway │  │
│                                                       └─────────┘  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

Trust Boundaries:
- - - - DMZ Boundary: Boundary between internet and internal network
- - - - Service Boundary: Boundary between different microservices
- - - - External Boundary: Boundary with third-party services
```

## Attack Trees

Attack trees are tree-structured diagrams used to systematically describe attack methods against a system.

### Attack Tree Basic Structure

```
Attack Tree Structure Explanation:
- Root node: Attacker's ultimate goal
- Branch nodes: Sub-goals or methods to achieve the goal
- Leaf nodes: Specific attack techniques
- AND nodes: All child node conditions must be met
- OR nodes: Any child node condition being met is sufficient
```

### Attack Tree Example: Credential Theft

```
                    ┌──────────────────────────┐
                    │ Steal User Credentials   │
                    │          (OR)            │
                    └────────────┬─────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Network Attack  │    │ Client Attack   │    │ Server Attack   │
│      (OR)       │    │      (OR)       │    │      (OR)       │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
    ┌────┴────┐            ┌────┴────┐            ┌────┴────┐
    │         │            │         │            │         │
    ▼         ▼            ▼         ▼            ▼         ▼
┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐
│ MITM  │ │ DNS   │   │Phishing│ │Keylog-│   │ SQL   │ │ Brute │
│Attack │ │Spoof- │   │       │ │  ger  │   │Inject-│ │ Force │
│       │ │ ing   │   │       │ │       │   │ ion   │ │       │
└───────┘ └───────┘   └───────┘ └───────┘   └───────┘ └───────┘

Risk Assessment (Example):
┌───────────────┬────────┬────────┬────────┬────────┐
│ Attack Method │Difficulty│ Cost  │Detection│ Risk  │
├───────────────┼────────┼────────┼────────┼────────┤
│ Phishing      │ Low    │ Low    │ Medium │ High   │
│ SQL Injection │ Medium │ Low    │ Medium │ High   │
│ MITM Attack   │ High   │ Medium │ High   │ Medium │
│ Brute Force   │ Medium │ Low    │ High   │ Medium │
│ Keylogger     │ High   │ Medium │ Medium │ Medium │
└───────────────┴────────┴────────┴────────┴────────┘
```

### Attack Tree Example: Privilege Escalation

```
                    ┌─────────────────────────────┐
                    │  Gain Admin Privileges (OR) │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│Exploit App Vuln │      │Social Engineering│     │Exploit Misconfig│
│      (OR)       │      │      (OR)       │      │      (OR)       │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
    ┌────┼────┐              ┌────┼────┐              ┌────┼────┐
    │    │    │              │    │    │              │    │    │
    ▼    ▼    ▼              ▼    ▼    ▼              ▼    ▼    ▼
┌─────┐┌────┐┌─────┐   ┌─────┐┌────┐┌─────┐   ┌─────┐┌────┐┌─────┐
│IDOR ││Dese││Priv │   │Imper││Phish││Insider│  │Default││Wrong││Stale│
│Vuln ││rial││Bypass│   │sonate││Admin││Threat│  │Creds ││ ACL ││Acct │
└─────┘└────┘└─────┘   │Admin ││    │└─────┘   └─────┘└────┘└─────┘
                       └─────┘└────┘
```

## Identifying Threats

### Threat Identification Process

```
Step 1: Asset Identification
    │   - Data assets (user data, transaction data, logs)
    │   - System assets (servers, databases, APIs)
    │   - Personnel assets (developers, operations staff)
    ▼
Step 2: Entry Point Analysis
    │   - Network entry points (API endpoints, WebSocket)
    │   - User input (forms, file uploads)
    │   - Third-party integrations (OAuth, Webhooks)
    ▼
Step 3: Trust Boundary Identification
    │   - Network boundaries (internet/intranet)
    │   - Process boundaries (different privilege levels)
    │   - User boundaries (anonymous/authenticated/admin)
    ▼
Step 4: Threat Enumeration
    │   - Apply STRIDE to each component
    │   - Analyze data flows crossing trust boundaries
    │   - Consider threat agent motivations and capabilities
    ▼
Step 5: Threat Validation
        - Confirm threat feasibility
        - Eliminate false positives and low-risk threats
```

### STRIDE-per-Element Method

Apply different STRIDE threats to each element type in the DFD:

| Element Type | S | T | R | I | D | E |
|--------------|---|---|---|---|---|---|
| External Entity | * |   | * |   |   |   |
| Process | * | * | * | * | * | * |
| Data Store |   | * | * | * | * |   |
| Data Flow |   | * |   | * | * |   |

### Threat Template

Use structured templates to document threats:

```
Threat ID: T-001
Threat Name: SQL Injection Leading to User Data Breach
Threat Type: Information Disclosure, Tampering
Threat Description: Attacker injects malicious SQL through user search
                   functionality to obtain sensitive user information
                   from the database
Attack Vector: User search input → Search API → Database query
Preconditions:
  - Search functionality has SQL injection vulnerability
  - Application uses string concatenation to build SQL
Affected Assets: User database
Attacker: External attacker (no authentication required)
Impact Assessment:
  - Confidentiality Impact: High (user PII disclosure)
  - Integrity Impact: High (data can be tampered)
  - Availability Impact: Medium (data can be deleted)
Likelihood: High (common attack, mature tools)
Risk Level: Critical
Mitigation Measures:
  1. Use parameterized queries
  2. Implement input validation
  3. Least privilege database accounts
  4. WAF rule filtering
```

## Risk Assessment and Prioritization

### DREAD Model

DREAD is a risk scoring system used to quantify threat risk:

| Dimension | Full Name | Description | Score (0-10) |
|-----------|-----------|-------------|--------------|
| Damage | Damage | Degree of harm if attack succeeds | 10=Complete destruction |
| Reproducibility | Reproducibility | Can attack be reliably reproduced | 10=Always succeeds |
| Exploitability | Exploitability | Difficulty to execute attack | 10=Extremely easy |
| Affected Users | Affected Users | Scope of affected users | 10=All users |
| Discoverability | Discoverability | Difficulty to discover vulnerability | 10=Extremely easy |

**Risk Score Calculation**:

```
Risk Score = (D + R + E + A + D) / 5

Risk Level Classification:
- 0-3: Low risk
- 4-6: Medium risk
- 7-8: High risk
- 9-10: Critical risk
```

**Scoring Example**:

```
Threat: SQL Injection Leading to Data Breach

Damage:         9 (Can obtain all user data)
Reproducibility: 8 (Reliably reproducible)
Exploitability: 7 (Automated tools exist)
Affected Users: 10 (Affects all users)
Discoverability: 8 (Easily discovered through scanning)

Risk Score = (9 + 8 + 7 + 10 + 8) / 5 = 8.4
Risk Level = High Risk
```

### CVSS Scoring

CVSS (Common Vulnerability Scoring System) is the industry standard vulnerability scoring system:

**Base Metric Group**:

```
Attack Vector (AV):
  Network (N)    - Network accessible
  Adjacent (A)   - Adjacent network
  Local (L)      - Local access
  Physical (P)   - Physical contact

Attack Complexity (AC):
  Low (L)        - No special conditions
  High (H)       - Requires specific conditions

Privileges Required (PR):
  None (N)       - No privileges required
  Low (L)        - Regular user
  High (H)       - Admin privileges

User Interaction (UI):
  None (N)       - No user interaction required
  Required (R)   - Requires user participation

Scope (S):
  Unchanged (U)  - Only affects this component
  Changed (C)    - Can affect other components

Confidentiality Impact (C): None/Low/High
Integrity Impact (I): None/Low/High
Availability Impact (A): None/Low/High
```

**CVSS Scoring Example**:

```
Vulnerability: Unauthenticated Remote Code Execution

CVSS Vector: AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H
CVSS Score: 10.0 (Critical)

Interpretation:
- Exploitable over network
- No complex conditions required
- No privileges required
- No user interaction required
- Can affect other components
- Complete compromise of confidentiality, integrity, availability
```

### Risk Matrix

Use a risk matrix to visualize risk priorities:

```
              Impact
              Low     Medium   High    Critical
         ┌────────┬────────┬────────┬────────┐
   High  │ Medium │  High  │Critical│Critical│
         ├────────┼────────┼────────┼────────┤
Like- Med│  Low   │ Medium │  High  │Critical│
li-  ────┼────────┼────────┼────────┼────────┤
hood Low │  Low   │  Low   │ Medium │  High  │
         ├────────┼────────┼────────┼────────┤
   V.Low │  Low   │  Low   │  Low   │ Medium │
         └────────┴────────┴────────┴────────┘

Handling Priority:
- Critical: Fix immediately, stop release
- High: Fix within current iteration
- Medium: Plan fix (1-2 iterations)
- Low: Document and monitor
```

## Mitigation Strategies

### Mitigation Measure Categories

```
┌─────────────────────────────────────────────────────────────┐
│                    Mitigation Strategy Types                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Preventive Controls                                        │
│  ├─ Input validation                                        │
│  ├─ Access control                                          │
│  ├─ Encryption                                              │
│  └─ Security configuration                                  │
│                                                             │
│  Detective Controls                                         │
│  ├─ Log auditing                                            │
│  ├─ Intrusion detection                                     │
│  ├─ Anomaly monitoring                                      │
│  └─ Security scanning                                       │
│                                                             │
│  Responsive Controls                                        │
│  ├─ Incident response                                       │
│  ├─ Automatic blocking                                      │
│  ├─ Circuit breaker mechanism                               │
│  └─ Disaster recovery                                       │
│                                                             │
│  Compensating Controls                                      │
│  ├─ Alternative solutions when primary controls             │
│  │   cannot be implemented                                  │
│  └─ Example: Use network isolation when encryption          │
│       is not possible                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### STRIDE Mitigation Strategy Reference Table

| Threat Type | Mitigation Strategy | Specific Measures |
|-------------|--------------------|--------------------|
| Spoofing | Authentication | MFA, certificate authentication, biometrics |
| Tampering | Integrity protection | Digital signatures, HMAC, encrypted transport |
| Repudiation | Audit logging | Security logs, blockchain attestation, timestamps |
| Info Disclosure | Encryption & access control | TLS, encryption at rest, least privilege |
| DoS | Availability design | Rate limiting, load balancing, CDN, redundancy |
| EoP | Authorization | RBAC, least privilege, sandbox isolation |

### Mitigation Measure Template

```
Threat ID: T-001
Threat Name: SQL Injection Leading to User Data Breach

Mitigation Measures:

M-001: Parameterized Queries [Preventive]
  Description: Use prepared statements and parameterized queries
  Implementation Location: Data access layer
  Effectiveness: High (root cause solution)
  Implementation Cost: Low
  Priority: P1

M-002: Input Validation [Preventive]
  Description: Whitelist validation for all user input
  Implementation Location: API layer
  Effectiveness: Medium (defense in depth)
  Implementation Cost: Medium
  Priority: P1

M-003: Least Privilege [Preventive]
  Description: Database account granted only necessary table
               and operation permissions
  Implementation Location: Database
  Effectiveness: Medium (limits impact)
  Implementation Cost: Low
  Priority: P2

M-004: WAF Rules [Detective/Preventive]
  Description: Deploy Web Application Firewall rules to filter
               SQL injection
  Implementation Location: Network boundary
  Effectiveness: Medium (can be bypassed)
  Implementation Cost: Medium
  Priority: P2

M-005: Security Audit Logging [Detective]
  Description: Log all database queries, monitor anomalies
  Implementation Location: Database/Application
  Effectiveness: Medium (post-incident detection)
  Implementation Cost: Low
  Priority: P2

Residual Risk:
  After implementing M-001, SQL injection risk reduced to very low
  Residual risk: Similar issues may exist in other parts of application

Accepted By: Security Lead
Acceptance Date: 2024-01-15
```

## Threat Modeling Tools

### Microsoft Threat Modeling Tool

A free threat modeling tool provided by Microsoft that supports the STRIDE methodology:

**Main Features**:
- Visual DFD drawing
- Automatic threat generation
- Custom templates
- Report generation

**Usage Flow**:

```
1. Create New Model
   └─ Select template (Azure, Generic Web, etc.)

2. Draw Data Flow Diagram
   ├─ Add external entities
   ├─ Add processes
   ├─ Add data stores
   └─ Connect data flows

3. Define Trust Boundaries
   └─ Enclose different trust domains

4. Generate Threats
   └─ Tool automatically applies STRIDE

5. Analyze and Process
   ├─ Evaluate each threat
   ├─ Determine mitigations
   └─ Mark status

6. Generate Report
   └─ Export HTML/Markdown report
```

### OWASP Threat Dragon

An open-source cross-platform threat modeling tool:

```
Features:
- Open source and free
- Cross-platform (Web/Desktop)
- Supports STRIDE and CIA
- GitHub integration
- JSON format storage (version control friendly)

Installation:
npm install -g owasp-threat-dragon

Usage:
threat-dragon --help
```

### PyTM (Python Threat Modeling)

Define threat models using Python code:

```python
from pytm import TM, Server, Datastore, Dataflow, Boundary, Actor, Lambda

# Create threat model
tm = TM("E-Commerce System Threat Model")
tm.description = "Threat analysis for e-commerce platform core services"
tm.isOrdered = True

# Define boundaries
internet = Boundary("Internet")
dmz = Boundary("DMZ")
internal = Boundary("Internal Network")

# Define actors
user = Actor("User")
user.inBoundary = internet

# Define servers and data stores
api_gateway = Server("API Gateway")
api_gateway.inBoundary = dmz
api_gateway.isHardened = True
api_gateway.sanitizesInput = True
api_gateway.protocol = "HTTPS"

user_service = Server("User Service")
user_service.inBoundary = internal
user_service.isHardened = True

user_db = Datastore("User Database")
user_db.inBoundary = internal
user_db.isEncrypted = True
user_db.storesPII = True

# Define data flows
user_to_api = Dataflow(user, api_gateway, "User Request")
user_to_api.protocol = "HTTPS"
user_to_api.isEncrypted = True

api_to_user_service = Dataflow(api_gateway, user_service, "API Call")
api_to_user_service.protocol = "gRPC"
api_to_user_service.isEncrypted = True

user_service_to_db = Dataflow(user_service, user_db, "Data Query")
user_service_to_db.protocol = "PostgreSQL"
user_service_to_db.isEncrypted = True

# Generate report
tm.process()
```

### Threat Modeling Automation

Example of integration into CI/CD pipeline:

```yaml
# .github/workflows/threat-model.yml
name: Threat Model Analysis

on:
  pull_request:
    paths:
      - 'docs/threat-model/**'
      - 'architecture/**'

jobs:
  threat-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install PyTM
        run: pip install pytm

      - name: Run Threat Model
        run: |
          python docs/threat-model/model.py --report

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: threat-model-report
          path: docs/threat-model/report.html

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('docs/threat-model/summary.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Threat Model Analysis\n\n${summary}`
            });
```

## Code Examples

### Threat Model Data Structures

```python
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional
from datetime import datetime

class ThreatType(Enum):
    SPOOFING = "Spoofing"
    TAMPERING = "Tampering"
    REPUDIATION = "Repudiation"
    INFO_DISCLOSURE = "Information Disclosure"
    DOS = "Denial of Service"
    ELEVATION = "Elevation of Privilege"

class RiskLevel(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class MitigationStatus(Enum):
    PROPOSED = "proposed"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"
    VERIFIED = "verified"
    ACCEPTED = "accepted"  # Accept risk

@dataclass
class Asset:
    """System Asset"""
    id: str
    name: str
    description: str
    asset_type: str  # data, system, person
    criticality: RiskLevel
    owner: str

@dataclass
class TrustBoundary:
    """Trust Boundary"""
    id: str
    name: str
    description: str
    trust_level: int  # 0-10, 10 is highest trust

@dataclass
class DataFlow:
    """Data Flow"""
    id: str
    name: str
    source: str
    destination: str
    data_type: str
    protocol: str
    is_encrypted: bool
    crosses_boundary: Optional[str] = None

@dataclass
class DREADScore:
    """DREAD Risk Score"""
    damage: int  # 0-10
    reproducibility: int
    exploitability: int
    affected_users: int
    discoverability: int

    @property
    def total(self) -> float:
        return (self.damage + self.reproducibility +
                self.exploitability + self.affected_users +
                self.discoverability) / 5

    @property
    def risk_level(self) -> RiskLevel:
        score = self.total
        if score >= 9:
            return RiskLevel.CRITICAL
        elif score >= 7:
            return RiskLevel.HIGH
        elif score >= 4:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

@dataclass
class Mitigation:
    """Mitigation Measure"""
    id: str
    name: str
    description: str
    control_type: str  # preventive, detective, responsive, compensating
    implementation_location: str
    effectiveness: str  # low, medium, high
    cost: str  # low, medium, high
    status: MitigationStatus
    owner: str
    deadline: Optional[datetime] = None

@dataclass
class Threat:
    """Threat"""
    id: str
    name: str
    description: str
    threat_type: ThreatType
    attack_vector: str
    preconditions: List[str]
    affected_assets: List[str]
    affected_dataflows: List[str]
    attacker_profile: str
    dread_score: DREADScore
    mitigations: List[Mitigation] = field(default_factory=list)
    residual_risk: Optional[str] = None
    status: str = "open"  # open, mitigated, accepted, closed

    @property
    def risk_level(self) -> RiskLevel:
        return self.dread_score.risk_level

@dataclass
class ThreatModel:
    """Threat Model"""
    id: str
    name: str
    version: str
    description: str
    created_date: datetime
    last_updated: datetime
    owner: str
    reviewers: List[str]
    assets: List[Asset] = field(default_factory=list)
    trust_boundaries: List[TrustBoundary] = field(default_factory=list)
    data_flows: List[DataFlow] = field(default_factory=list)
    threats: List[Threat] = field(default_factory=list)

    def get_critical_threats(self) -> List[Threat]:
        """Get critical threats"""
        return [t for t in self.threats
                if t.risk_level == RiskLevel.CRITICAL]

    def get_unmitigated_threats(self) -> List[Threat]:
        """Get unmitigated threats"""
        return [t for t in self.threats
                if t.status == "open" and not t.mitigations]

    def calculate_overall_risk(self) -> float:
        """Calculate overall risk score"""
        if not self.threats:
            return 0.0
        return sum(t.dread_score.total for t in self.threats) / len(self.threats)
```

### Threat Model Analyzer

```python
from typing import Dict, List, Tuple
import json

class ThreatModelAnalyzer:
    """Threat Model Analyzer"""

    # STRIDE threat mapping to element types
    STRIDE_ELEMENT_MAPPING = {
        "external_entity": ["SPOOFING", "REPUDIATION"],
        "process": ["SPOOFING", "TAMPERING", "REPUDIATION",
                   "INFO_DISCLOSURE", "DOS", "ELEVATION"],
        "data_store": ["TAMPERING", "REPUDIATION", "INFO_DISCLOSURE", "DOS"],
        "data_flow": ["TAMPERING", "INFO_DISCLOSURE", "DOS"]
    }

    def __init__(self, threat_model: ThreatModel):
        self.model = threat_model

    def analyze_stride_coverage(self) -> Dict[str, List[str]]:
        """Analyze STRIDE coverage"""
        coverage = {t.value: [] for t in ThreatType}

        for threat in self.model.threats:
            coverage[threat.threat_type.value].append(threat.id)

        return coverage

    def find_gaps(self) -> Dict[str, List[str]]:
        """Find threat modeling gaps"""
        gaps = {
            "uncovered_assets": [],
            "uncovered_dataflows": [],
            "boundary_crossing_risks": [],
            "missing_mitigations": []
        }

        # Check uncovered assets
        covered_assets = set()
        for threat in self.model.threats:
            covered_assets.update(threat.affected_assets)

        for asset in self.model.assets:
            if asset.id not in covered_assets:
                gaps["uncovered_assets"].append(asset.id)

        # Check data flows crossing trust boundaries
        for dataflow in self.model.data_flows:
            if dataflow.crosses_boundary and not dataflow.is_encrypted:
                gaps["boundary_crossing_risks"].append(
                    f"{dataflow.id}: Crosses {dataflow.crosses_boundary} but not encrypted"
                )

        # Check high-risk threats missing mitigations
        for threat in self.model.threats:
            if (threat.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
                and not threat.mitigations):
                gaps["missing_mitigations"].append(threat.id)

        return gaps

    def generate_stride_threats(self, element_type: str,
                                 element_name: str) -> List[Dict]:
        """Automatically generate STRIDE threats for specified element"""
        applicable_threats = self.STRIDE_ELEMENT_MAPPING.get(element_type, [])
        generated_threats = []

        threat_templates = {
            "SPOOFING": {
                "name": f"Spoofing {element_name}",
                "description": f"Attacker may impersonate {element_name} to interact with system"
            },
            "TAMPERING": {
                "name": f"Tampering {element_name} Data",
                "description": f"Attacker may maliciously modify {element_name} data"
            },
            "REPUDIATION": {
                "name": f"{element_name} Operation Repudiation",
                "description": f"{element_name} may deny actions performed"
            },
            "INFO_DISCLOSURE": {
                "name": f"{element_name} Information Disclosure",
                "description": f"{element_name} may expose sensitive information"
            },
            "DOS": {
                "name": f"{element_name} Denial of Service",
                "description": f"Attacker may make {element_name} unavailable"
            },
            "ELEVATION": {
                "name": f"Privilege Escalation via {element_name}",
                "description": f"Attacker may gain elevated privileges through {element_name}"
            }
        }

        for threat_type in applicable_threats:
            template = threat_templates[threat_type]
            generated_threats.append({
                "type": threat_type,
                "name": template["name"],
                "description": template["description"],
                "element": element_name,
                "element_type": element_type
            })

        return generated_threats

    def prioritize_threats(self) -> List[Tuple[Threat, str]]:
        """Threat priority ranking"""
        prioritized = []

        for threat in self.model.threats:
            score = threat.dread_score.total

            # Adjustment factors
            if threat.status == "open":
                score *= 1.2  # Unaddressed threats have higher priority

            # Check if affecting critical assets
            critical_assets = [a for a in self.model.assets
                             if a.criticality == RiskLevel.CRITICAL]
            for asset in critical_assets:
                if asset.id in threat.affected_assets:
                    score *= 1.3
                    break

            # Determine handling recommendation
            if score >= 9:
                action = "Fix immediately - Block release"
            elif score >= 7:
                action = "Fix within current iteration"
            elif score >= 4:
                action = "Plan fix (1-2 iterations)"
            else:
                action = "Document and monitor"

            prioritized.append((threat, action, score))

        # Sort by score descending
        prioritized.sort(key=lambda x: x[2], reverse=True)

        return [(t, a) for t, a, _ in prioritized]

    def generate_report(self) -> str:
        """Generate threat model report"""
        report = []
        report.append(f"# {self.model.name} - Threat Model Report\n")
        report.append(f"Version: {self.model.version}")
        report.append(f"Date: {self.model.last_updated.strftime('%Y-%m-%d')}")
        report.append(f"Owner: {self.model.owner}\n")

        # Executive summary
        report.append("## Executive Summary\n")
        report.append(f"- Total Threats: {len(self.model.threats)}")
        report.append(f"- Critical Threats: {len(self.get_threats_by_level(RiskLevel.CRITICAL))}")
        report.append(f"- High Risk Threats: {len(self.get_threats_by_level(RiskLevel.HIGH))}")
        report.append(f"- Overall Risk Score: {self.model.calculate_overall_risk():.1f}/10\n")

        # Gap analysis
        gaps = self.find_gaps()
        if any(gaps.values()):
            report.append("## Identified Gaps\n")
            for gap_type, items in gaps.items():
                if items:
                    report.append(f"### {gap_type}")
                    for item in items:
                        report.append(f"- {item}")
            report.append("")

        # Priority list
        report.append("## Threat Priority\n")
        report.append("| Threat | Type | Risk Score | Recommendation |")
        report.append("|--------|------|------------|----------------|")

        for threat, action in self.prioritize_threats():
            report.append(
                f"| {threat.name} | {threat.threat_type.value} | "
                f"{threat.dread_score.total:.1f} | {action} |"
            )

        return "\n".join(report)

    def get_threats_by_level(self, level: RiskLevel) -> List[Threat]:
        """Get threats by risk level"""
        return [t for t in self.model.threats if t.risk_level == level]
```

### Attack Tree Generator

```python
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
from enum import Enum

class NodeType(Enum):
    AND = "AND"
    OR = "OR"
    LEAF = "LEAF"

@dataclass
class AttackTreeNode:
    """Attack Tree Node"""
    id: str
    name: str
    description: str
    node_type: NodeType
    difficulty: str = "medium"  # low, medium, high
    cost: str = "medium"
    detection_risk: str = "medium"
    children: List['AttackTreeNode'] = field(default_factory=list)
    mitigations: List[str] = field(default_factory=list)

    def add_child(self, child: 'AttackTreeNode') -> None:
        self.children.append(child)

    def calculate_risk_score(self) -> float:
        """Calculate risk score"""
        difficulty_scores = {"low": 3, "medium": 2, "high": 1}
        cost_scores = {"low": 3, "medium": 2, "high": 1}
        detection_scores = {"low": 3, "medium": 2, "high": 1}

        score = (difficulty_scores[self.difficulty] +
                cost_scores[self.cost] +
                detection_scores[self.detection_risk]) / 3

        if not self.children:
            return score

        if self.node_type == NodeType.AND:
            # AND node: take minimum of child scores (hardest path)
            child_scores = [c.calculate_risk_score() for c in self.children]
            return min(child_scores) if child_scores else score
        else:
            # OR node: take maximum of child scores (easiest path)
            child_scores = [c.calculate_risk_score() for c in self.children]
            return max(child_scores) if child_scores else score

class AttackTreeBuilder:
    """Attack Tree Builder"""

    def __init__(self):
        self.trees = {}

    def create_tree(self, goal: str, description: str) -> AttackTreeNode:
        """Create new attack tree"""
        root = AttackTreeNode(
            id=f"AT-{len(self.trees) + 1}",
            name=goal,
            description=description,
            node_type=NodeType.OR  # Root node is usually OR
        )
        self.trees[root.id] = root
        return root

    def build_credential_theft_tree(self) -> AttackTreeNode:
        """Build credential theft attack tree"""
        root = self.create_tree(
            "Steal User Credentials",
            "Obtain login credentials of legitimate users"
        )

        # Network attack branch
        network_attack = AttackTreeNode(
            id="AT-1.1",
            name="Network Attack",
            description="Obtain credentials through network layer",
            node_type=NodeType.OR
        )

        mitm = AttackTreeNode(
            id="AT-1.1.1",
            name="Man-in-the-Middle Attack",
            description="Intercept communication between user and server",
            node_type=NodeType.AND,
            difficulty="high",
            cost="medium",
            detection_risk="medium",
            mitigations=["Enforce HTTPS", "HSTS", "Certificate pinning"]
        )

        dns_spoofing = AttackTreeNode(
            id="AT-1.1.2",
            name="DNS Spoofing",
            description="Hijack DNS resolution to redirect users to malicious server",
            node_type=NodeType.LEAF,
            difficulty="high",
            cost="low",
            detection_risk="low",
            mitigations=["DNSSEC", "DNS over HTTPS"]
        )

        network_attack.add_child(mitm)
        network_attack.add_child(dns_spoofing)

        # Client attack branch
        client_attack = AttackTreeNode(
            id="AT-1.2",
            name="Client Attack",
            description="Attack user side to obtain credentials",
            node_type=NodeType.OR
        )

        phishing = AttackTreeNode(
            id="AT-1.2.1",
            name="Phishing Attack",
            description="Trick users into entering credentials on fake page",
            node_type=NodeType.LEAF,
            difficulty="low",
            cost="low",
            detection_risk="medium",
            mitigations=["User security awareness training", "Email security gateway", "FIDO2/WebAuthn"]
        )

        keylogger = AttackTreeNode(
            id="AT-1.2.2",
            name="Keylogger",
            description="Install keylogging software on user device",
            node_type=NodeType.AND,
            difficulty="medium",
            cost="medium",
            detection_risk="medium",
            mitigations=["Endpoint protection", "Application whitelisting"]
        )

        client_attack.add_child(phishing)
        client_attack.add_child(keylogger)

        # Server attack branch
        server_attack = AttackTreeNode(
            id="AT-1.3",
            name="Server Attack",
            description="Attack server to obtain credentials",
            node_type=NodeType.OR
        )

        sql_injection = AttackTreeNode(
            id="AT-1.3.1",
            name="SQL Injection",
            description="Obtain user table data through SQL injection",
            node_type=NodeType.LEAF,
            difficulty="medium",
            cost="low",
            detection_risk="medium",
            mitigations=["Parameterized queries", "WAF", "Least privilege"]
        )

        brute_force = AttackTreeNode(
            id="AT-1.3.2",
            name="Brute Force",
            description="Try common password combinations",
            node_type=NodeType.LEAF,
            difficulty="low",
            cost="low",
            detection_risk="high",
            mitigations=["Account lockout", "CAPTCHA", "Password policy"]
        )

        server_attack.add_child(sql_injection)
        server_attack.add_child(brute_force)

        # Assemble tree
        root.add_child(network_attack)
        root.add_child(client_attack)
        root.add_child(server_attack)

        return root

    def to_mermaid(self, node: AttackTreeNode, level: int = 0) -> str:
        """Convert attack tree to Mermaid diagram format"""
        lines = []

        if level == 0:
            lines.append("```mermaid")
            lines.append("graph TD")

        node_label = f"{node.id}[{node.name}]"
        if node.node_type == NodeType.AND:
            node_label = f"{node.id}(({node.name} - AND))"
        elif node.node_type == NodeType.OR and level > 0:
            node_label = f"{node.id}{{{node.name} - OR}}"

        for child in node.children:
            child_label = child.id
            lines.append(f"    {node.id} --> {child_label}")
            lines.extend(self.to_mermaid(child, level + 1)[1:])  # Skip mermaid header

        if level == 0:
            lines.append("```")

        return "\n".join(lines)

    def analyze_attack_paths(self, node: AttackTreeNode,
                            current_path: List[str] = None) -> List[List[str]]:
        """Analyze all possible attack paths"""
        if current_path is None:
            current_path = []

        current_path = current_path + [node.name]

        if not node.children:
            return [current_path]

        paths = []
        for child in node.children:
            child_paths = self.analyze_attack_paths(child, current_path)
            paths.extend(child_paths)

        return paths

    def find_weakest_path(self, node: AttackTreeNode) -> Tuple[List[str], float]:
        """Find the most easily exploited attack path"""
        paths = self.analyze_attack_paths(node)

        path_scores = []
        for path in paths:
            # Simplified scoring: assume each node has difficulty attribute
            score = len(path)  # Simplified to path length
            path_scores.append((path, score))

        # Return shortest path (easiest attack)
        path_scores.sort(key=lambda x: x[1])
        return path_scores[0] if path_scores else ([], 0)
```

## Best Practices

### Threat Modeling Process

```
1. Preparation Phase
   ├─ Assemble team (development, security, architecture, product)
   ├─ Gather documentation (architecture diagrams, requirements, API specs)
   └─ Determine scope (which systems, features need analysis)

2. Modeling Phase
   ├─ Draw data flow diagrams
   ├─ Identify trust boundaries
   ├─ Identify assets and entry points
   └─ Review model completeness

3. Threat Identification
   ├─ Apply STRIDE and other methodologies
   ├─ Consider threats for each component
   ├─ Focus on cross-boundary data flows
   └─ Use attack trees for deep analysis

4. Risk Assessment
   ├─ Use DREAD or CVSS scoring
   ├─ Consider business impact
   ├─ Determine risk priority
   └─ Identify acceptable risks

5. Develop Mitigation Strategies
   ├─ Design mitigation controls
   ├─ Assign owners
   ├─ Set timelines
   └─ Assess residual risk

6. Validation and Iteration
   ├─ Verify mitigation effectiveness
   ├─ Update threat model
   ├─ Periodic reassessment
   └─ Track threat status
```

### Common Mistakes

| Mistake | Impact | Correct Approach |
|---------|--------|------------------|
| Only done once at project start | Cannot address new threats from changes | Continuously update threat model |
| Over-focus on technical details | Ignores business risk and human factors | Combine with business impact analysis |
| Only completed by security team | Lacks development and business perspective | Cross-functional team collaboration |
| Threat list too extensive | Resources scattered, priorities unclear | Focus on high-priority threats |
| Ignoring third-party components | Supply chain attack risk | Evaluate all dependencies |
| Not updating historical threat status | Cannot track improvement progress | Maintain threat tracking system |

### SDLC Integration

```
Requirements Phase:
├─ Security requirements analysis
├─ Initial threat modeling
└─ Define security boundaries

Design Phase:
├─ Detailed threat modeling
├─ Architecture security review
└─ Develop secure design approach

Development Phase:
├─ Secure coding practices
├─ Implement threat mitigations
└─ Code security scanning

Testing Phase:
├─ Security testing (SAST/DAST)
├─ Penetration testing to verify threats
└─ Update threat model

Deployment Phase:
├─ Security configuration review
├─ Final threat assessment
└─ Pre-launch security checklist

Operations Phase:
├─ Monitoring and alerting
├─ Incident response
└─ Periodic threat assessment updates
```

## Interview Key Points

### Common Interview Questions

**Q1: What is threat modeling? Why is it important?**

Threat modeling is a systematic method for identifying and assessing security threats. Its importance lies in:
1. Finding issues during design phase when remediation cost is lowest
2. Helping teams understand system security requirements
3. Providing risk priorities to guide resource allocation
4. Meeting compliance requirements

**Q2: Explain the STRIDE model and each threat type**

STRIDE represents six threat types:
- Spoofing: Impersonating another identity
- Tampering: Maliciously modifying data
- Repudiation: Denying actions performed
- Information Disclosure: Exposing sensitive information
- Denial of Service: Making system unavailable
- Elevation of Privilege: Gaining unauthorized privileges

**Q3: How does the DREAD scoring system work?**

DREAD assesses risk through five dimensions:
- Damage: Harm caused by attack
- Reproducibility: Attack reproducibility
- Exploitability: Exploitation difficulty
- Affected Users: Scope of affected users
- Discoverability: Vulnerability discovery difficulty

Each dimension scores 0-10, with the average as the final risk score.

**Q4: What are the main elements of a data flow diagram?**

DFD contains five basic elements:
- External Entity: Participants outside the system
- Process: Components that process data
- Data Store: Location where data is stored
- Data Flow: Movement of data between elements
- Trust Boundary: Boundary between different trust levels

**Q5: What is an attack tree? How is it used?**

An attack tree is a graphical method using a tree structure to represent all possible paths to achieve an attack goal. The root node is the attack goal, branches represent different methods to achieve that goal, and leaf nodes are specific attack techniques. AND nodes indicate all conditions must be met, OR nodes indicate any condition being met is sufficient.

**Q6: How to integrate threat modeling into agile development?**

Key practices:
1. Perform high-level threat modeling in initial iterations
2. Assess security impact of new features each Sprint
3. Include security tasks in Backlog
4. Use lightweight threat modeling tools
5. Regularly review and update threat models
6. Security team participates in Sprint planning

## Further Reading

### Official Resources

- [Microsoft SDL Threat Modeling](https://www.microsoft.com/en-us/securityengineering/sdl/threatmodeling)
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Recommended Books

- "Threat Modeling: Designing for Security" - Adam Shostack
- "Risk Centric Threat Modeling" - Tony UcedaVelez
- "Threat Modeling" - Izar Tarandach & Matthew Coles

### Tool Resources

- [Microsoft Threat Modeling Tool](https://aka.ms/threatmodelingtool)
- [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/)
- [PyTM](https://github.com/izar/pytm)
- [Threagile](https://threagile.io/)

### Learning Resources

- [SAFECode Threat Modeling Guide](https://safecode.org/publication/SAFECode_TM_Whitepaper.pdf)
- [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/)
- [STRIDE Threat Modeling](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
