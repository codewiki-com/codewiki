---
title: 安全工具与自动化
description: 掌握常用安全工具，实现安全测试自动化
track: security
section: appsec
difficulty: intermediate
tags:
  - 安全工具
  - SAST
  - DAST
  - 漏洞扫描
status: imported
origin: old/src/content/docs/security/security-tools.en.md
divergence: 0.21
issues:
  - title-lang-en
  - title-language
legacy:
  category: Security
  subcategory: Tools
  order: 5
  lastUpdated: 2026-01-07
---

In modern software development, security is no longer an afterthought but a core concern that needs to be integrated throughout the entire development lifecycle. By introducing automated security tools, development teams can discover and fix security vulnerabilities early, significantly reducing security risks and remediation costs. We'll provide a comprehensive overview of various security tools and their integration methods in CI/CD pipelines.

## Overview of Security Testing Types

Before diving into specific tools, we need to understand different types of security testing and their applicable scenarios:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Security Testing Types Overview                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    SAST     │  │    DAST     │  │    IAST     │  │    SCA      │    │
│  │Static Anal. │  │Dynamic Anal.│  │Interactive  │  │Composition  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │           │
│         ▼                ▼                ▼                ▼           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Source Code │  │Runtime Test │  │Code+Runtime │  │ Dependency  │    │
│  │ Compile Time│  │ Black Box   │  │White+Black  │  │License Check│    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │Container    │  │Secret       │  │Fuzz Testing │  │Penetration  │    │
│  │ Image Scan  │  │ Secret Scan │  │   Fuzzing   │  │  Pen Test   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Testing Type Comparison

| Testing Type | Testing Phase | Advantages | Limitations |
|--------------|---------------|------------|-------------|
| SAST | Development/Compile Phase | Early detection, comprehensive coverage | High false positive rate, cannot detect runtime issues |
| DAST | Runtime Phase | Finds real vulnerabilities, low false positives | Limited coverage, long testing time |
| IAST | Runtime Phase | Precise location, low false positives | Requires runtime environment, performance overhead |
| SCA | Development/Build Phase | Fast, automated | Only for known vulnerabilities |

### Shift Left Security

The core concept of Shift Left Security is to integrate security testing as early as possible in the development process:

```
Traditional Model:
Development → Testing → Deployment → Security Testing → Remediation → Redeployment

Shift Left Model:
[Security Requirements] → [Security Design] → [Secure Coding] → [Security Testing] → [Secure Deployment] → [Security Monitoring]
         ↓                      ↓                  ↓                  ↓                    ↓                     ↓
  Threat Modeling      Security Architecture   SAST/SCA          DAST/IAST          Config Audit        Runtime Monitoring
```

## SAST Static Analysis Tools

Static Application Security Testing (SAST) analyzes source code, bytecode, or binary files without executing the code to identify potential security vulnerabilities.

### SonarQube

SonarQube is one of the most popular code quality and security analysis platforms:

```yaml
# docker-compose.yml - SonarQube Deployment
version: '3.8'
services:
  sonarqube:
    image: sonarqube:lts-community
    container_name: sonarqube
    depends_on:
      - db
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://db:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
    ports:
      - "9000:9000"

  db:
    image: postgres:15
    container_name: sonarqube-db
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonar
    volumes:
      - postgresql_data:/var/lib/postgresql/data

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgresql_data:
```

```bash
# Scanning with SonarScanner
# Install SonarScanner
npm install -g sonarqube-scanner

# Create sonar-project.properties
cat > sonar-project.properties << EOF
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0
sonar.sources=src
sonar.tests=tests
sonar.language=js
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.host.url=http://localhost:9000
sonar.token=your-token-here
EOF

# Execute scan
sonar-scanner
```

### Semgrep

Semgrep is a fast, open-source static analysis tool that supports custom rules:

```bash
# Install Semgrep
pip install semgrep

# Scan with official rulesets
semgrep --config=auto .

# Use specific rulesets
semgrep --config=p/security-audit .
semgrep --config=p/owasp-top-ten .
semgrep --config=p/javascript .
```

```yaml
# Custom Semgrep rules (.semgrep/custom-rules.yaml)
rules:
  - id: hardcoded-password
    patterns:
      - pattern-either:
          - pattern: password = "..."
          - pattern: PASSWORD = "..."
          - pattern: pwd = "..."
    message: Hardcoded password detected, please use environment variables or a secrets management service
    languages: [python, javascript, java]
    severity: ERROR
    metadata:
      cwe: "CWE-798: Use of Hard-coded Credentials"
      owasp: "A07:2021 - Identification and Authentication Failures"

  - id: sql-injection-risk
    patterns:
      - pattern: |
          $QUERY = "..." + $USER_INPUT + "..."
      - pattern-not: |
          $QUERY = "..." + sanitize($USER_INPUT) + "..."
    message: Potential SQL injection risk, please use parameterized queries
    languages: [python, javascript]
    severity: ERROR
    metadata:
      cwe: "CWE-89: SQL Injection"

  - id: insecure-random
    pattern: Math.random()
    message: Math.random() is not suitable for security scenarios, please use crypto.randomBytes()
    languages: [javascript, typescript]
    severity: WARNING
    metadata:
      cwe: "CWE-330: Use of Insufficiently Random Values"
```

### ESLint Security Plugins

Security rules for JavaScript/TypeScript projects:

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:security/recommended',
    'plugin:security-node/recommended'
  ],
  plugins: [
    'security',
    'security-node',
    'no-secrets'
  ],
  rules: {
    // Detect potential SQL injection
    'security/detect-sql-injection': 'error',

    // Detect unsafe regular expressions (ReDoS)
    'security/detect-unsafe-regex': 'error',

    // Detect eval usage
    'security/detect-eval-with-expression': 'error',

    // Detect non-literal require
    'security/detect-non-literal-require': 'warn',

    // Detect non-literal filesystem operations
    'security/detect-non-literal-fs-filename': 'warn',

    // Detect possible timing attacks
    'security/detect-possible-timing-attacks': 'error',

    // Detect hardcoded secrets
    'no-secrets/no-secrets': ['error', {
      ignoreContent: '^EXAMPLE_',
      tolerance: 4.5
    }],

    // Prohibit use of Buffer() constructor
    'security-node/detect-buffer-unsafe-allocation': 'error',

    // Detect child process injection risks
    'security-node/detect-child-process': 'warn'
  }
};
```

```bash
# Install dependencies
npm install --save-dev eslint eslint-plugin-security \
  eslint-plugin-security-node eslint-plugin-no-secrets

# Run security scan
npx eslint --ext .js,.ts src/ --format json --output-file security-report.json
```

### Bandit (Python)

A dedicated security scanning tool for Python projects:

```bash
# Install Bandit
pip install bandit

# Basic scan
bandit -r ./src

# Generate detailed report
bandit -r ./src -f json -o bandit-report.json

# Exclude specific checks
bandit -r ./src --skip B101,B102

# Only check high severity vulnerabilities
bandit -r ./src -ll
```

```ini
# .bandit configuration file
[bandit]
exclude_dirs = tests,venv,.venv
skips = B101,B601
targets = src

[bandit.plugins]
# Custom plugin configuration
B104.hardcoded_bind_all_interfaces = true
```

## DAST Dynamic Analysis Tools

Dynamic Application Security Testing (DAST) tests applications while they are running, simulating real attack scenarios.

### OWASP ZAP

OWASP ZAP is the most popular open-source web application security scanner:

```bash
# Running ZAP with Docker
# Baseline scan (quick)
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://target-app.com \
  -r zap-report.html

# Full scan (deep)
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t https://target-app.com \
  -r zap-full-report.html

# API scan
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t https://target-app.com/api/openapi.json \
  -f openapi \
  -r zap-api-report.html
```

```python
# Automated scanning using ZAP Python API
from zapv2 import ZAPv2
import time

class ZAPScanner:
    def __init__(self, target_url, api_key=''):
        self.target = target_url
        self.zap = ZAPv2(apikey=api_key,
                        proxies={'http': 'http://127.0.0.1:8080',
                                'https': 'http://127.0.0.1:8080'})

    def spider_scan(self):
        """Execute spider scan"""
        print(f'Starting spider scan: {self.target}')
        scan_id = self.zap.spider.scan(self.target)

        while int(self.zap.spider.status(scan_id)) < 100:
            print(f'Spider progress: {self.zap.spider.status(scan_id)}%')
            time.sleep(5)

        print(f'Spider complete, discovered {len(self.zap.spider.results(scan_id))} URLs')
        return self.zap.spider.results(scan_id)

    def active_scan(self):
        """Execute active scan"""
        print(f'Starting active scan: {self.target}')
        scan_id = self.zap.ascan.scan(self.target)

        while int(self.zap.ascan.status(scan_id)) < 100:
            print(f'Scan progress: {self.zap.ascan.status(scan_id)}%')
            time.sleep(10)

        print('Active scan complete')

    def get_alerts(self, risk_level='High'):
        """Get alert information"""
        alerts = self.zap.core.alerts(baseurl=self.target)

        risk_mapping = {'High': 3, 'Medium': 2, 'Low': 1, 'Informational': 0}
        min_risk = risk_mapping.get(risk_level, 0)

        filtered_alerts = [
            alert for alert in alerts
            if alert.get('riskcode', 0) >= min_risk
        ]

        return filtered_alerts

    def generate_report(self, filename='zap-report.html'):
        """Generate HTML report"""
        with open(filename, 'w') as f:
            f.write(self.zap.core.htmlreport())
        print(f'Report generated: {filename}')

# Usage example
if __name__ == '__main__':
    scanner = ZAPScanner('https://target-app.com')
    scanner.spider_scan()
    scanner.active_scan()

    alerts = scanner.get_alerts('Medium')
    for alert in alerts:
        print(f"[{alert['risk']}] {alert['name']}")
        print(f"  URL: {alert['url']}")
        print(f"  Description: {alert['description'][:100]}...")

    scanner.generate_report()
```

### Nuclei

Nuclei is a fast vulnerability scanner that supports many templates:

```bash
# Install Nuclei
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Or use Docker
docker pull projectdiscovery/nuclei:latest

# Basic scan
nuclei -u https://target-app.com

# Use specific templates
nuclei -u https://target-app.com -t cves/
nuclei -u https://target-app.com -t vulnerabilities/
nuclei -u https://target-app.com -t exposures/

# Batch scan
nuclei -l urls.txt -t nuclei-templates/ -o results.txt

# Filter by severity
nuclei -u https://target-app.com -severity critical,high
```

```yaml
# Custom Nuclei template (custom-sqli.yaml)
id: custom-sql-injection

info:
  name: Custom SQL Injection Detection
  author: security-team
  severity: critical
  description: Detect common SQL injection vulnerabilities
  tags: sqli,owasp,injection

requests:
  - method: GET
    path:
      - "{{BaseURL}}/?id=1"
      - "{{BaseURL}}/?id=1'"
      - "{{BaseURL}}/?id=1 AND 1=1"
      - "{{BaseURL}}/?id=1 AND 1=2"
      - "{{BaseURL}}/?id=1 OR 1=1"
      - "{{BaseURL}}/?id=1' OR '1'='1"
      - "{{BaseURL}}/?id=1; DROP TABLE users--"

    matchers-condition: or
    matchers:
      - type: word
        words:
          - "SQL syntax"
          - "mysql_fetch"
          - "ORA-01756"
          - "SQLite3::SQLException"
          - "PostgreSQL query failed"
          - "Warning: pg_"
        condition: or

      - type: regex
        regex:
          - "(?i)you have an error in your sql syntax"
          - "(?i)unclosed quotation mark"
          - "(?i)quoted string not properly terminated"
```

## Dependency Vulnerability Scanning

Known vulnerabilities in dependencies are one of the most common sources of security risk.

### Snyk

Snyk provides comprehensive Software Composition Analysis (SCA) capabilities:

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Scan project dependencies
snyk test

# Scan and generate detailed report
snyk test --json > snyk-report.json

# Monitor project (continuous monitoring for new vulnerabilities)
snyk monitor

# Scan Docker image
snyk container test nginx:latest

# Scan Infrastructure as Code
snyk iac test ./terraform/
```

```yaml
# GitHub Actions configuration (.github/workflows/snyk.yml)
name: Snyk Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --json-file-output=snyk-results.json

      - name: Upload Snyk results
        uses: actions/upload-artifact@v4
        with:
          name: snyk-results
          path: snyk-results.json
```

### Dependabot

GitHub's native dependency update and vulnerability detection service:

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
    commit-message:
      prefix: "deps"
      include: "scope"
    # Ignore updates for specific dependencies
    ignore:
      - dependency-name: "lodash"
        versions: ["4.x"]
    # Group by dependency type
    groups:
      development-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
      production-dependencies:
        dependency-type: "production"

  # Docker base image updates
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "devops-team"

  # GitHub Actions updates
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  # Python dependency updates
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "daily"
```

### npm audit and yarn audit

Built-in security audit tools for the Node.js ecosystem:

```bash
# npm audit
npm audit
npm audit --json > npm-audit.json
npm audit fix  # Auto-fix
npm audit fix --force  # Force update (may have breaking changes)

# yarn audit
yarn audit
yarn audit --json > yarn-audit.json

# pnpm audit
pnpm audit
pnpm audit --json > pnpm-audit.json
```

```javascript
// Automated audit script (scripts/security-audit.js)
const { spawnSync } = require('child_process');
const fs = require('fs');

function runAudit() {
  console.log('Starting security audit...\n');

  // Use spawnSync instead of exec to avoid shell injection risks
  const result = spawnSync('npm', ['audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  try {
    const audit = JSON.parse(result.stdout || '{}');

    // Analyze results
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    const summary = {
      total: vulnerabilities.total || 0,
      critical: vulnerabilities.critical || 0,
      high: vulnerabilities.high || 0,
      moderate: vulnerabilities.moderate || 0,
      low: vulnerabilities.low || 0
    };

    console.log('Vulnerability Statistics:');
    console.log(`  Critical: ${summary.critical}`);
    console.log(`  High: ${summary.high}`);
    console.log(`  Moderate: ${summary.moderate}`);
    console.log(`  Low: ${summary.low}`);
    console.log(`  Total: ${summary.total}\n`);

    // Check for critical or high vulnerabilities
    if (summary.critical > 0 || summary.high > 0) {
      console.error('Critical or high vulnerabilities found, build failed!');
      process.exit(1);
    }

    // Save report
    fs.writeFileSync(
      'security-audit-report.json',
      JSON.stringify(audit, null, 2)
    );
    console.log('Audit report saved: security-audit-report.json');

  } catch (error) {
    console.error('Failed to parse audit results:', error.message);
    process.exit(1);
  }
}

runAudit();
```

## Container Image Scanning

Container images may contain vulnerable base system components and application dependencies.

### Trivy

Trivy is a comprehensive container and filesystem vulnerability scanner:

```bash
# Install Trivy
# macOS
brew install aquasecurity/trivy/trivy

# Linux
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Scan container image
trivy image nginx:latest

# Scan and show only high and critical vulnerabilities
trivy image --severity HIGH,CRITICAL nginx:latest

# Generate JSON report
trivy image --format json --output trivy-report.json nginx:latest

# Scan local Dockerfile
trivy config ./Dockerfile

# Scan filesystem
trivy fs --security-checks vuln,config .

# Scan Kubernetes configuration
trivy k8s --report summary cluster
```

```yaml
# GitHub Actions integration with Trivy
name: Container Security Scan

on:
  push:
    branches: [main]
  pull_request:

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

### Grype

Anchore's open-source container vulnerability scanner:

```bash
# Install Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Scan image
grype nginx:latest

# Scan local directory
grype dir:/path/to/project

# Scan SBOM
grype sbom:./sbom.json

# Output JSON format
grype nginx:latest -o json > grype-report.json

# Set failure threshold
grype nginx:latest --fail-on high
```

### Building Secure Docker Images

```dockerfile
# Dockerfile Security Best Practices

# Use specific version tags, avoid using latest
FROM node:20.10-alpine3.19

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Only copy necessary files
COPY package*.json ./

# Install dependencies (production mode)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=nodejs:nodejs . .

# Remove unnecessary files
RUN rm -rf tests/ docs/ *.md

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Use dumb-init or tini for signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Add labels
LABEL maintainer="security-team@company.com"
LABEL version="1.0.0"
LABEL description="Secure Node.js application"
```

## Code Audit Tools

Code audit tools help discover security and quality issues in code.

### CodeQL

GitHub's semantic code analysis engine:

```yaml
# .github/workflows/codeql.yml
name: "CodeQL Analysis"

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'python']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: +security-extended,security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"
```

```ql
// Custom CodeQL query (queries/sql-injection.ql)
/**
 * @name SQL injection vulnerability
 * @description Detects cases where user input is directly concatenated into SQL queries
 * @kind path-problem
 * @problem.severity error
 * @security-severity 9.8
 * @precision high
 * @id js/sql-injection
 * @tags security
 *       external/cwe/cwe-089
 */

import javascript
import semmle.javascript.security.dataflow.SqlInjectionQuery
import DataFlow::PathGraph

from SqlInjectionConfiguration cfg, DataFlow::PathNode source, DataFlow::PathNode sink
where cfg.hasFlowPath(source, sink)
select sink.getNode(), source, sink,
  "This SQL query may contain untrusted data from $@.",
  source.getNode(), "user input"
```

### Git Secrets Detection

Prevent sensitive information from being committed to code repositories:

```bash
# Install git-secrets
brew install git-secrets  # macOS
# Or install from source

# Initialize repository
git secrets --install
git secrets --register-aws  # Register AWS key patterns

# Add custom patterns
git secrets --add 'private_key'
git secrets --add 'api[_-]?key[_-]?[=:]\s*["\x27]?[A-Za-z0-9]{20,}'
git secrets --add 'password\s*=\s*["\x27][^"\x27]{8,}'

# Scan commit history
git secrets --scan-history

# Configure as pre-commit hook
git secrets --install -f
```

```yaml
# Using Gitleaks for more comprehensive secret detection
# .gitleaks.toml
title = "Gitleaks Configuration"

[allowlist]
description = "Global allowlist"
paths = [
  '''gitleaks\.toml''',
  '''(.*?)(jpg|gif|doc|pdf|bin)$''',
  '''node_modules''',
  '''vendor'''
]

[[rules]]
id = "aws-access-key-id"
description = "AWS Access Key ID"
regex = '''(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}'''
tags = ["aws", "credentials"]

[[rules]]
id = "generic-api-key"
description = "Generic API Key"
regex = '''(?i)(api[_-]?key|apikey|api_secret)[_-]?[=:]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?'''
tags = ["api", "credentials"]

[[rules]]
id = "jwt-token"
description = "JWT Token"
regex = '''eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]+'''
tags = ["jwt", "token"]

[[rules]]
id = "private-key"
description = "Private Key"
regex = '''-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----'''
tags = ["key", "private"]
```

```bash
# Run Gitleaks scan
# Install
brew install gitleaks

# Scan current repository
gitleaks detect --source . -v

# Scan specific commit range
gitleaks detect --source . --log-opts="HEAD~10..HEAD"

# Generate report
gitleaks detect --source . --report-format json --report-path gitleaks-report.json
```

## CI/CD Security Integration

Integrate security tools into CI/CD pipelines to achieve automated security checks.

### Complete Security Pipeline Example

```yaml
# .github/workflows/security-pipeline.yml
name: Security Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  # Stage 1: Static Analysis
  sast:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint security checks
        run: npx eslint --ext .js,.ts src/ --format json --output-file eslint-results.json
        continue-on-error: true

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

      - name: Upload SAST results
        uses: actions/upload-artifact@v4
        with:
          name: sast-results
          path: |
            eslint-results.json
            semgrep-results.sarif

  # Stage 2: Dependency Scanning
  sca:
    name: Dependency Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --json > npm-audit.json || true

      - name: Run Snyk
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --json-file-output=snyk-results.json

      - name: Upload SCA results
        uses: actions/upload-artifact@v4
        with:
          name: sca-results
          path: |
            npm-audit.json
            snyk-results.json

  # Stage 3: Secrets Detection
  secrets:
    name: Secrets Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

  # Stage 4: Build and Container Scanning
  container-scan:
    name: Container Security
    runs-on: ubuntu-latest
    needs: [sast, sca, secrets]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'json'
          output: 'trivy-results.json'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      - name: Run Grype scanner
        uses: anchore/scan-action@v3
        with:
          image: 'myapp:${{ github.sha }}'
          fail-build: true
          severity-cutoff: high
          output-format: json

      - name: Upload container scan results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: container-scan-results
          path: |
            trivy-results.json

  # Stage 5: Dynamic Testing (only after deployment to test environment)
  dast:
    name: Dynamic Analysis
    runs-on: ubuntu-latest
    needs: container-scan
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to test environment
        run: |
          # Script to deploy to test environment
          echo "Deploying to test environment..."

      - name: Wait for deployment
        run: sleep 60

      - name: Run OWASP ZAP scan
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: 'https://test.example.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

      - name: Run Nuclei scan
        uses: projectdiscovery/nuclei-action@main
        with:
          target: 'https://test.example.com'
          templates: 'cves,vulnerabilities,exposed-panels'
          output: 'nuclei-results.txt'

  # Stage 6: Security Report Summary
  security-report:
    name: Generate Security Report
    runs-on: ubuntu-latest
    needs: [sast, sca, secrets, container-scan]
    if: always()
    steps:
      - uses: actions/checkout@v4

      - name: Download all artifacts
        uses: actions/download-artifact@v4

      - name: Generate consolidated report
        run: |
          echo "# Security Scan Report" > security-report.md
          echo "Generated: $(date)" >> security-report.md
          echo "" >> security-report.md
          # Summarize all scan results
          node scripts/generate-security-report.js

      - name: Upload security report
        uses: actions/upload-artifact@v4
        with:
          name: security-report
          path: security-report.md

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('security-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### Jenkins Security Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        SNYK_TOKEN = credentials('snyk-token')
        SONAR_TOKEN = credentials('sonar-token')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Security Scans') {
            parallel {
                stage('SAST - SonarQube') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            sh '''
                                sonar-scanner \
                                    -Dsonar.projectKey=${JOB_NAME} \
                                    -Dsonar.sources=src \
                                    -Dsonar.host.url=${SONAR_HOST_URL} \
                                    -Dsonar.token=${SONAR_TOKEN}
                            '''
                        }
                    }
                }

                stage('SAST - Semgrep') {
                    steps {
                        sh '''
                            docker run --rm -v "${WORKSPACE}:/src" \
                                returntocorp/semgrep \
                                semgrep --config=auto --json --output=/src/semgrep-results.json /src
                        '''
                    }
                }

                stage('SCA - Snyk') {
                    steps {
                        sh '''
                            snyk test --json > snyk-results.json || true
                            snyk monitor
                        '''
                    }
                }

                stage('Secrets - Gitleaks') {
                    steps {
                        sh '''
                            docker run --rm -v "${WORKSPACE}:/path" \
                                zricethezav/gitleaks:latest \
                                detect --source=/path --report-format=json --report-path=/path/gitleaks-report.json
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t myapp:${BUILD_NUMBER} .'
            }
        }

        stage('Container Scan') {
            steps {
                sh '''
                    trivy image --exit-code 1 --severity HIGH,CRITICAL \
                        --format json --output trivy-results.json \
                        myapp:${BUILD_NUMBER}
                '''
            }
        }

        stage('DAST - ZAP') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    docker run --rm -v "${WORKSPACE}:/zap/wrk" \
                        -t ghcr.io/zaproxy/zaproxy:stable \
                        zap-baseline.py -t https://test.example.com \
                        -r zap-report.html -J zap-report.json
                '''
            }
        }
    }

    post {
        always {
            // Archive security reports
            archiveArtifacts artifacts: '*-results.json, *-report.*', allowEmptyArchive: true

            // Publish HTML report
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '.',
                reportFiles: 'zap-report.html',
                reportName: 'ZAP Security Report'
            ])
        }

        failure {
            // Send alert
            slackSend(
                color: 'danger',
                message: "Security scan failed for ${JOB_NAME} - ${BUILD_NUMBER}"
            )
        }
    }
}
```

## Vulnerability Management Platforms

Effective vulnerability management requires dedicated platforms to track, prioritize, and remediate vulnerabilities.

### DefectDojo

DefectDojo is an open-source vulnerability management platform:

```yaml
# docker-compose.yml - DefectDojo Deployment
version: '3.8'
services:
  nginx:
    image: defectdojo/defectdojo-nginx:latest
    depends_on:
      - uwsgi
    ports:
      - "8080:8080"
    volumes:
      - defectdojo_media:/usr/share/nginx/html/media

  uwsgi:
    image: defectdojo/defectdojo-django:latest
    depends_on:
      - mysql
      - rabbitmq
    environment:
      DD_DATABASE_URL: mysql://defectdojo:defectdojo@mysql:3306/defectdojo
      DD_CELERY_BROKER_URL: amqp://defectdojo:defectdojo@rabbitmq:5672//
      DD_SECRET_KEY: ${DD_SECRET_KEY}
    volumes:
      - defectdojo_media:/app/media

  celerybeat:
    image: defectdojo/defectdojo-django:latest
    command: celery -A dojo beat -l info
    depends_on:
      - mysql
      - rabbitmq
    environment:
      DD_DATABASE_URL: mysql://defectdojo:defectdojo@mysql:3306/defectdojo
      DD_CELERY_BROKER_URL: amqp://defectdojo:defectdojo@rabbitmq:5672//

  celeryworker:
    image: defectdojo/defectdojo-django:latest
    command: celery -A dojo worker -l info
    depends_on:
      - mysql
      - rabbitmq
    environment:
      DD_DATABASE_URL: mysql://defectdojo:defectdojo@mysql:3306/defectdojo
      DD_CELERY_BROKER_URL: amqp://defectdojo:defectdojo@rabbitmq:5672//

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: defectdojo
      MYSQL_USER: defectdojo
      MYSQL_PASSWORD: defectdojo
    volumes:
      - defectdojo_mysql:/var/lib/mysql

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: defectdojo
      RABBITMQ_DEFAULT_PASS: defectdojo

volumes:
  defectdojo_media:
  defectdojo_mysql:
```

```python
# Using DefectDojo API to import scan results
import requests

class DefectDojoClient:
    def __init__(self, host, api_token):
        self.host = host
        self.api_token = api_token
        self.headers = {
            'Authorization': f'Token {api_token}',
            'Content-Type': 'application/json'
        }

    def create_engagement(self, product_id, name, target_start, target_end):
        """Create test engagement"""
        url = f'{self.host}/api/v2/engagements/'
        data = {
            'name': name,
            'product': product_id,
            'target_start': target_start,
            'target_end': target_end,
            'engagement_type': 'CI/CD',
            'status': 'In Progress'
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def import_scan(self, engagement_id, scan_type, file_path):
        """Import scan results"""
        url = f'{self.host}/api/v2/import-scan/'

        # Supported scan type mapping
        scan_types = {
            'snyk': 'Snyk Scan',
            'trivy': 'Trivy Scan',
            'zap': 'ZAP Scan',
            'semgrep': 'Semgrep JSON Report',
            'bandit': 'Bandit Scan',
            'npm_audit': 'NPM Audit Scan'
        }

        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {
                'engagement': engagement_id,
                'scan_type': scan_types.get(scan_type, scan_type),
                'verified': False,
                'active': True
            }

            headers = {'Authorization': f'Token {self.api_token}'}
            response = requests.post(url, data=data, files=files, headers=headers)

        return response.json()

    def get_findings(self, engagement_id, severity=None):
        """Get vulnerability findings"""
        url = f'{self.host}/api/v2/findings/'
        params = {'engagement': engagement_id}

        if severity:
            params['severity'] = severity

        response = requests.get(url, params=params, headers=self.headers)
        return response.json()

# Usage example
if __name__ == '__main__':
    client = DefectDojoClient(
        'https://defectdojo.example.com',
        'your-api-token'
    )

    # Create engagement
    engagement = client.create_engagement(
        product_id=1,
        name='Sprint 15 Security Scan',
        target_start='2024-01-15',
        target_end='2024-01-22'
    )

    # Import various scan results
    client.import_scan(engagement['id'], 'snyk', 'snyk-results.json')
    client.import_scan(engagement['id'], 'trivy', 'trivy-results.json')
    client.import_scan(engagement['id'], 'zap', 'zap-report.json')

    # Get high severity vulnerabilities
    findings = client.get_findings(engagement['id'], severity='High')
    print(f'Found {findings["count"]} high severity vulnerabilities')
```

## Security Automation Workflows

### Automated Security Response

```python
# security_automation.py - Security Automation Response System
import json
import requests
from datetime import datetime
from typing import List, Dict

class SecurityAutomation:
    def __init__(self, config: Dict):
        self.config = config
        self.slack_webhook = config.get('slack_webhook')
        self.jira_config = config.get('jira')
        self.pagerduty_key = config.get('pagerduty_key')

    def process_scan_results(self, scan_type: str, results_file: str):
        """Process scan results and trigger automated response"""
        with open(results_file) as f:
            results = json.load(f)

        # Parse results based on scan type
        vulnerabilities = self._parse_results(scan_type, results)

        # Categorize vulnerabilities
        critical = [v for v in vulnerabilities if v['severity'] == 'CRITICAL']
        high = [v for v in vulnerabilities if v['severity'] == 'HIGH']

        # Trigger response
        if critical:
            self._trigger_critical_response(critical)

        if high:
            self._trigger_high_response(high)

        # Create Jira tickets
        self._create_jira_issues(vulnerabilities)

        return {
            'total': len(vulnerabilities),
            'critical': len(critical),
            'high': len(high)
        }

    def _parse_results(self, scan_type: str, results: Dict) -> List[Dict]:
        """Parse different types of scan results"""
        parsers = {
            'snyk': self._parse_snyk,
            'trivy': self._parse_trivy,
            'semgrep': self._parse_semgrep
        }

        parser = parsers.get(scan_type)
        if parser:
            return parser(results)
        return []

    def _parse_snyk(self, results: Dict) -> List[Dict]:
        """Parse Snyk scan results"""
        vulnerabilities = []
        for vuln in results.get('vulnerabilities', []):
            vulnerabilities.append({
                'id': vuln.get('id'),
                'title': vuln.get('title'),
                'severity': vuln.get('severity', '').upper(),
                'package': vuln.get('packageName'),
                'version': vuln.get('version'),
                'fix_version': vuln.get('fixedIn', [None])[0],
                'cve': vuln.get('identifiers', {}).get('CVE', []),
                'description': vuln.get('description')
            })
        return vulnerabilities

    def _parse_trivy(self, results: Dict) -> List[Dict]:
        """Parse Trivy scan results"""
        vulnerabilities = []
        for result in results.get('Results', []):
            for vuln in result.get('Vulnerabilities', []):
                vulnerabilities.append({
                    'id': vuln.get('VulnerabilityID'),
                    'title': vuln.get('Title'),
                    'severity': vuln.get('Severity', '').upper(),
                    'package': vuln.get('PkgName'),
                    'version': vuln.get('InstalledVersion'),
                    'fix_version': vuln.get('FixedVersion'),
                    'cve': [vuln.get('VulnerabilityID')],
                    'description': vuln.get('Description')
                })
        return vulnerabilities

    def _parse_semgrep(self, results: Dict) -> List[Dict]:
        """Parse Semgrep scan results"""
        severity_map = {'ERROR': 'HIGH', 'WARNING': 'MEDIUM', 'INFO': 'LOW'}
        vulnerabilities = []

        for result in results.get('results', []):
            vulnerabilities.append({
                'id': result.get('check_id'),
                'title': result.get('extra', {}).get('message'),
                'severity': severity_map.get(
                    result.get('extra', {}).get('severity', 'INFO'),
                    'LOW'
                ),
                'file': result.get('path'),
                'line': result.get('start', {}).get('line'),
                'code': result.get('extra', {}).get('lines'),
                'description': result.get('extra', {}).get('message')
            })
        return vulnerabilities

    def _trigger_critical_response(self, vulnerabilities: List[Dict]):
        """Trigger critical vulnerability response"""
        # Send PagerDuty alert
        if self.pagerduty_key:
            self._send_pagerduty_alert(vulnerabilities)

        # Send urgent Slack notification
        message = self._format_critical_message(vulnerabilities)
        self._send_slack_notification(message, urgent=True)

    def _trigger_high_response(self, vulnerabilities: List[Dict]):
        """Trigger high vulnerability response"""
        message = self._format_high_message(vulnerabilities)
        self._send_slack_notification(message)

    def _send_slack_notification(self, message: str, urgent: bool = False):
        """Send Slack notification"""
        if not self.slack_webhook:
            return

        payload = {
            'text': message,
            'channel': '#security-alerts' if urgent else '#security-reports',
            'username': 'Security Bot',
            'icon_emoji': ':warning:' if urgent else ':shield:'
        }

        requests.post(self.slack_webhook, json=payload)

    def _send_pagerduty_alert(self, vulnerabilities: List[Dict]):
        """Send PagerDuty alert"""
        payload = {
            'routing_key': self.pagerduty_key,
            'event_action': 'trigger',
            'dedup_key': f'security-critical-{datetime.now().strftime("%Y%m%d")}',
            'payload': {
                'summary': f'Found {len(vulnerabilities)} critical security vulnerabilities',
                'severity': 'critical',
                'source': 'Security Scanner',
                'custom_details': {
                    'vulnerabilities': [v['id'] for v in vulnerabilities[:10]]
                }
            }
        }

        requests.post(
            'https://events.pagerduty.com/v2/enqueue',
            json=payload
        )

    def _create_jira_issues(self, vulnerabilities: List[Dict]):
        """Create Jira tickets for vulnerabilities"""
        if not self.jira_config:
            return

        # Only create tickets for high and critical vulnerabilities
        for vuln in vulnerabilities:
            if vuln['severity'] in ['CRITICAL', 'HIGH']:
                self._create_single_jira_issue(vuln)

    def _create_single_jira_issue(self, vuln: Dict):
        """Create a single Jira ticket"""
        issue_data = {
            'fields': {
                'project': {'key': self.jira_config['project']},
                'summary': f"[Security] {vuln['title']}",
                'description': self._format_jira_description(vuln),
                'issuetype': {'name': 'Bug'},
                'priority': {
                    'name': 'Highest' if vuln['severity'] == 'CRITICAL' else 'High'
                },
                'labels': ['security', 'vulnerability', vuln['severity'].lower()]
            }
        }

        response = requests.post(
            f"{self.jira_config['url']}/rest/api/2/issue",
            json=issue_data,
            auth=(self.jira_config['user'], self.jira_config['token'])
        )

        return response.json()

    def _format_critical_message(self, vulnerabilities: List[Dict]) -> str:
        """Format critical vulnerability message"""
        vuln_list = '\n'.join([
            f"  - {v['id']}: {v['title']}"
            for v in vulnerabilities[:5]
        ])

        return f"""
:rotating_light: *Critical Security Vulnerability Alert* :rotating_light:

Found *{len(vulnerabilities)}* critical vulnerabilities requiring immediate action:

{vuln_list}

Please check and fix these vulnerabilities immediately!
        """.strip()

    def _format_high_message(self, vulnerabilities: List[Dict]) -> str:
        """Format high vulnerability message"""
        vuln_items = [f"  - {v['id']}: {v['title']}" for v in vulnerabilities[:10]]
        return f"""
:warning: *High Security Vulnerability Report*

Found *{len(vulnerabilities)}* high severity vulnerabilities:

{chr(10).join(vuln_items)}

Please complete remediation within this week.
        """.strip()

    def _format_jira_description(self, vuln: Dict) -> str:
        """Format Jira description"""
        cve_list = ', '.join(vuln.get('cve', [])) or 'N/A'
        return f"""
h2. Vulnerability Details

* *ID*: {vuln.get('id', 'N/A')}
* *Severity*: {vuln.get('severity', 'N/A')}
* *Affected Component*: {vuln.get('package', 'N/A')} @ {vuln.get('version', 'N/A')}
* *Fix Version*: {vuln.get('fix_version', 'Unknown')}
* *CVE*: {cve_list}

h2. Description

{vuln.get('description', 'No description')}

h2. Remediation Recommendations

1. Upgrade to fix version: {vuln.get('fix_version', 'See official recommendations')}
2. If upgrade is not possible, evaluate temporary mitigation measures
3. Perform security testing to verify fix after remediation
        """.strip()

# Usage example
if __name__ == '__main__':
    config = {
        'slack_webhook': 'https://hooks.slack.com/services/xxx',
        'pagerduty_key': 'your-pagerduty-key',
        'jira': {
            'url': 'https://your-domain.atlassian.net',
            'project': 'SEC',
            'user': 'user@example.com',
            'token': 'your-api-token'
        }
    }

    automation = SecurityAutomation(config)

    # Process Snyk scan results
    result = automation.process_scan_results('snyk', 'snyk-results.json')
    print(f"Processing complete: {result}")
```

## Interview Key Points

### Common Interview Questions

**1. What is the difference between SAST and DAST? What are the advantages and disadvantages of each?**

```
SAST (Static Application Security Testing):
- Timing: Development/compile phase, does not require running the application
- Method: Analyzes source code, bytecode, or binary files
- Advantages:
  * Early detection of issues, low remediation cost
  * High coverage, can analyze all code paths
  * Can pinpoint exact code lines
- Disadvantages:
  * Higher false positive rate
  * Cannot detect runtime and configuration issues
  * Limited detection capability for certain vulnerability types (e.g., authentication issues)

DAST (Dynamic Application Security Testing):
- Timing: Runtime phase, requires deployed application
- Method: Simulates attacker performing black-box testing from outside
- Advantages:
  * Finds real exploitable vulnerabilities
  * Low false positive rate
  * Can find configuration and deployment issues
- Disadvantages:
  * Limited coverage, depends on test cases
  * Cannot pinpoint exact code lines
  * Longer testing time
  * Requires runtime environment

Best Practice: Combine SAST and DAST for complementary coverage
```

**2. How would you design a complete DevSecOps pipeline?**

```
DevSecOps Pipeline Design Principles:

1. Code Commit Phase:
   - pre-commit hooks: Secret detection, code formatting
   - Local SAST quick scan

2. Continuous Integration Phase:
   - Full SAST scan (SonarQube, Semgrep)
   - SCA dependency scan (Snyk, npm audit)
   - Secret leak detection (Gitleaks)
   - Unit tests and security tests

3. Build Phase:
   - Container image scan (Trivy, Grype)
   - IaC security scan
   - SBOM generation

4. Pre-deployment Phase:
   - DAST scan (ZAP, Nuclei)
   - Configuration compliance check
   - Security approval process (for high-risk changes)

5. Production Environment:
   - Runtime security monitoring (RASP)
   - Log analysis and anomaly detection
   - Regular penetration testing

6. Feedback Loop:
   - Vulnerability management platform integration
   - Automated ticket creation
   - Security metrics dashboard
```

**3. How do you prioritize when facing many security vulnerabilities?**

```
Vulnerability Prioritization Framework:

1. CVSS Score: But cannot rely solely on CVSS
   - Critical (9.0-10.0)
   - High (7.0-8.9)
   - Medium (4.0-6.9)
   - Low (0.1-3.9)

2. Exploitability Assessment:
   - Is there a public PoC or exploit code
   - Is it being actively exploited in the wild
   - Exploit complexity

3. Business Impact:
   - Importance of affected assets
   - Data sensitivity
   - Business disruption risk

4. Exposure Level:
   - Internet accessible vs internal network
   - User volume and traffic
   - Whether on the attack surface

5. Remediation Difficulty:
   - Time and resources required for fix
   - Availability of patches
   - Compatibility impact of dependency upgrades

Priority Matrix Example:
+-------------------------------------------------+
| P1 (Immediate): CVSS >= 9 and Internet exposed and has exploit code |
| P2 (24h):  CVSS >= 7 and Internet exposed               |
| P3 (1 week):  CVSS >= 7 or sensitive data related             |
| P4 (1 month):  Medium/low severity vulnerabilities                            |
+-------------------------------------------------+
```

**4. How do you handle security vulnerabilities in third-party dependencies?**

```
Third-party Dependency Vulnerability Handling Strategy:

1. Preventive Measures:
   - Use lockfile to pin dependency versions
   - Regular dependency updates
   - Use automated update tools like Dependabot
   - Establish dependency introduction review process

2. Handling After Discovering Vulnerabilities:
   a) Assess Impact:
      - Is the vulnerable functionality actually used
      - Is it in the attack path

   b) Choose Remediation Option:
      - Upgrade to fixed version (preferred)
      - Use patch version
      - Temporary mitigation measures
      - Replace with alternative library

   c) Verify Fix:
      - Regression testing
      - Security scan confirmation

3. When Immediate Fix Is Not Possible:
   - Document risk acceptance decision
   - Implement compensating controls
   - Set remediation timeline
   - Continuous monitoring

4. Long-term Strategy:
   - Establish SBOM (Software Bill of Materials)
   - Regular dependency audits
   - Reduce unnecessary dependencies
   - Consider dependency maintenance status
```

### Practical Recommendations

1. **Tool Selection**: Choose appropriate tool combinations based on tech stack and team size
2. **Progressive Integration**: Start with critical checks, gradually add security checks
3. **False Positive Management**: Establish false positive handling process to avoid alert fatigue
4. **Metrics Tracking**: Define and track security KPIs (e.g., mean time to remediate vulnerabilities)
5. **Continuous Improvement**: Regularly review and optimize security processes

## Summary

Security tools and automation are indispensable components of modern software development. By properly selecting and combining SAST, DAST, SCA, and other tools, and integrating them into CI/CD pipelines, teams can:

- Discover and fix security vulnerabilities early
- Reduce security risks and remediation costs
- Improve development efficiency and release velocity
- Build a sustainable security culture

Remember, tools are just means to an end. True security requires combining processes, personnel training, and continuous improvement. Security is an ongoing process, not a one-time check.

## Further Reading

- [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)
- [NIST Secure Software Development Framework](https://csrc.nist.gov/Projects/ssdf)
- [CIS Software Supply Chain Security Guide](https://www.cisecurity.org/)
- [SANS Secure DevOps Resources](https://www.sans.org/cloud-security/)
