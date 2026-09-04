---
title: SAST and DAST Security Testing
description: Learn static and dynamic application security testing
track: security
section: appsec
difficulty: intermediate
tags:
  - SAST
  - DAST
  - code scanning
  - security testing
status: imported
origin: old/src/content/docs/security/sast-dast.en.md
divergence: 0.175
issues: []
legacy:
  category: Security
  subcategory: AppSec
  order: 11
  lastUpdated: 2026-01-07
---

Application security testing is a critical component of modern software development. Two fundamental approaches dominate the landscape: Static Application Security Testing (SAST) and Dynamic Application Security Testing (DAST). Understanding when and how to use each approach, along with their respective strengths and limitations, is essential for building a comprehensive security testing strategy.

We'll take a deep dive into both SAST and DAST, covering their core concepts, popular tools, CI/CD integration patterns, false positive management strategies, and how to combine these approaches for maximum security coverage.

## Understanding SAST and DAST

Before diving into implementation details, it is essential to understand what each testing methodology offers and how they complement each other.

### What is SAST?

Static Application Security Testing (SAST), also known as white-box testing, analyzes source code, bytecode, or binary code to identify security vulnerabilities without executing the application. SAST tools examine the code structure, data flow, and control flow to detect potential security issues.

```
+-----------------------------------------------------------------------+
|                    SAST Analysis Process                               |
+-----------------------------------------------------------------------+
|                                                                       |
|   Source Code        Parsing &          Pattern         Vulnerability |
|   Repository   -->   Analysis    -->    Matching   -->   Report       |
|                                                                       |
|   +----------+      +----------+      +----------+      +----------+  |
|   | .java    |      | AST      |      | SQL Inj  |      | Critical |  |
|   | .py      | ---> | CFG      | ---> | XSS      | ---> | High     |  |
|   | .js      |      | DFG      |      | Crypto   |      | Medium   |  |
|   | .go      |      |          |      | Auth     |      | Low      |  |
|   +----------+      +----------+      +----------+      +----------+  |
|                                                                       |
|   Legend: AST = Abstract Syntax Tree                                  |
|           CFG = Control Flow Graph                                    |
|           DFG = Data Flow Graph                                       |
+-----------------------------------------------------------------------+
```

Key characteristics of SAST:

- **Early Detection**: Identifies vulnerabilities during development, before code is deployed
- **Code-Level Insights**: Provides exact line numbers and code paths for vulnerabilities
- **Language-Specific**: Requires parsers and rules for each programming language
- **No Runtime Required**: Analyzes code without needing a running application

### What is DAST?

Dynamic Application Security Testing (DAST), also known as black-box testing, analyzes running applications by simulating attacks from an external perspective. DAST tools interact with the application through its interfaces (HTTP, APIs, etc.) to discover vulnerabilities that manifest during runtime.

```
+-----------------------------------------------------------------------+
|                    DAST Analysis Process                               |
+-----------------------------------------------------------------------+
|                                                                       |
|   Running          Crawling &        Attack           Vulnerability   |
|   Application -->  Discovery   -->   Simulation  -->  Report          |
|                                                                       |
|   +----------+      +----------+      +----------+      +----------+  |
|   | Web App  |      | Endpoints|      | Payloads |      | Confirmed|  |
|   | API      | ---> | Forms    | ---> | Fuzzing  | ---> | Potential|  |
|   | Service  |      | Params   |      | Exploits |      | Info     |  |
|   +----------+      +----------+      +----------+      +----------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

Key characteristics of DAST:

- **Runtime Verification**: Tests actual application behavior, not just code patterns
- **Technology Agnostic**: Works with any application regardless of programming language
- **Finds Configuration Issues**: Detects server misconfigurations and deployment problems
- **External Perspective**: Simulates real attacker behavior and attack vectors

## SAST vs DAST: Detailed Comparison

Understanding the differences between SAST and DAST helps teams choose the right approach for their specific needs.

### Comprehensive Comparison

| Aspect | SAST | DAST |
|--------|------|------|
| **Testing Approach** | White-box (code analysis) | Black-box (external testing) |
| **When Applied** | Development phase | QA/Staging environment |
| **Input Required** | Source code access | Running application URL |
| **Vulnerability Detection** | Code-level patterns | Runtime behavior |
| **False Positive Rate** | Higher | Lower |
| **False Negative Rate** | Lower for code issues | Lower for runtime issues |
| **Speed** | Fast (minutes) | Slower (hours) |
| **Coverage** | All code paths (theoretical) | Reachable endpoints only |
| **Developer Feedback** | Line-by-line guidance | Endpoint/request level |
| **Configuration Issues** | Limited detection | Strong detection |
| **Business Logic Flaws** | Difficult to detect | Can detect some |
| **Third-party Dependencies** | Limited visibility | Tests integrated behavior |

### Vulnerability Detection Capabilities

Different vulnerability types are better suited to detection by SAST or DAST:

```
+-----------------------------------------------------------------------+
|           Vulnerability Detection by Testing Type                      |
+-----------------------------------------------------------------------+
|                                                                       |
|   Vulnerability Type          SAST Detection    DAST Detection        |
|   ---------------------------------------------------------------     |
|   SQL Injection               Excellent         Excellent             |
|   Cross-Site Scripting        Good              Excellent             |
|   Command Injection           Good              Good                  |
|   Path Traversal              Good              Excellent             |
|   Hardcoded Secrets           Excellent         Poor                  |
|   Insecure Crypto             Excellent         Poor                  |
|   Authentication Bypass       Poor              Good                  |
|   Session Management          Poor              Excellent             |
|   Server Misconfiguration     Poor              Excellent             |
|   Missing Security Headers    Poor              Excellent             |
|   Race Conditions             Poor              Good                  |
|   Business Logic Flaws        Poor              Moderate              |
|   Null Pointer Dereference    Excellent         Poor                  |
|   Buffer Overflow             Good              Poor                  |
|   Insecure Deserialization    Good              Good                  |
|                                                                       |
+-----------------------------------------------------------------------+
```

### When to Use Each Approach

#### Use SAST When:

1. **During Active Development**: Integrate into IDE and pre-commit hooks for immediate feedback
2. **Code Review Process**: Automate security checks alongside code reviews
3. **Compliance Requirements**: Need to demonstrate code-level security analysis
4. **Large Codebase Analysis**: Need comprehensive coverage of all code paths
5. **Detecting Coding Mistakes**: Finding insecure patterns and anti-patterns

#### Use DAST When:

1. **Pre-Production Testing**: Validate application security before deployment
2. **Configuration Validation**: Verify server and application configuration
3. **Third-Party Applications**: Testing applications without source code access
4. **API Security Testing**: Validating API endpoints and authentication
5. **Compliance Verification**: Demonstrating runtime security posture

## Popular SAST Tools

Several mature SAST tools are available, each with distinct strengths and use cases.

### SonarQube

SonarQube is one of the most widely adopted code quality and security platforms, offering both open-source and commercial editions.

#### Basic Configuration

```properties
# sonar-project.properties
sonar.projectKey=my-application
sonar.projectName=My Application
sonar.projectVersion=1.0
sonar.sources=src/main
sonar.tests=src/test
sonar.sourceEncoding=UTF-8

# Language-specific settings
sonar.java.binaries=target/classes
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.python.coverage.reportPaths=coverage.xml

# Security-specific settings
sonar.security.hotspots.review.status=REVIEWED
sonar.qualitygate.wait=true
```

#### Docker Deployment

```yaml
# docker-compose.yml
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
    image: postgres:14
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

#### Running SonarQube Analysis

```bash
# For Maven projects
mvn sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=${SONAR_TOKEN}

# For other projects using sonar-scanner
sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=${SONAR_TOKEN} \
  -Dsonar.projectKey=my-project \
  -Dsonar.sources=src
```

### Snyk

Snyk provides comprehensive security scanning including SAST capabilities alongside its well-known dependency scanning features.

#### CLI Usage

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Run SAST analysis (Snyk Code)
snyk code test

# Test with specific severity threshold
snyk code test --severity-threshold=high

# Output results in JSON format
snyk code test --json > snyk-results.json

# Test specific files or directories
snyk code test --file=src/main/java
```

#### Configuration File

```yaml
# .snyk
version: v1.5.0

# Ignore specific vulnerabilities
ignore:
  SNYK-JS-LODASH-567746:
    - '*':
        reason: 'Risk accepted - input is sanitized'
        expires: '2024-06-01T00:00:00.000Z'

# Exclude paths from scanning
exclude:
  global:
    - 'test/**'
    - 'docs/**'
    - '**/node_modules/**'
```

#### Snyk API Integration

```python
# snyk_integration.py
import requests
import json

class SnykScanner:
    def __init__(self, token: str, org_id: str):
        self.token = token
        self.org_id = org_id
        self.base_url = "https://api.snyk.io/v1"
        self.headers = {
            "Authorization": f"token {token}",
            "Content-Type": "application/json"
        }

    def test_project(self, project_id: str) -> dict:
        """Run security test on a Snyk project."""
        url = f"{self.base_url}/org/{self.org_id}/project/{project_id}/test"
        response = requests.post(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_issues(self, project_id: str) -> list:
        """Retrieve issues for a project."""
        url = f"{self.base_url}/org/{self.org_id}/project/{project_id}/issues"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json().get("issues", [])

    def filter_high_severity(self, issues: list) -> list:
        """Filter issues to only high and critical severity."""
        return [
            issue for issue in issues
            if issue.get("severity") in ["high", "critical"]
        ]

# Usage
scanner = SnykScanner(
    token="your-snyk-token",
    org_id="your-org-id"
)
issues = scanner.get_issues("project-id")
critical_issues = scanner.filter_high_severity(issues)
```

### Semgrep

Semgrep is a lightweight, open-source SAST tool that uses pattern-based matching for vulnerability detection.

#### Basic Usage

```bash
# Install Semgrep
pip install semgrep

# Run with default rules
semgrep --config=auto .

# Run specific rule sets
semgrep --config=p/security-audit .
semgrep --config=p/owasp-top-ten .
semgrep --config=p/javascript .

# Output formats
semgrep --config=auto --json -o results.json .
semgrep --config=auto --sarif -o results.sarif .
```

#### Custom Rule Example

```yaml
# custom-rules.yaml
rules:
  - id: hardcoded-jwt-secret
    patterns:
      - pattern-either:
          - pattern: jwt.sign($PAYLOAD, "...")
          - pattern: jwt.verify($TOKEN, "...")
    message: "JWT secret is hardcoded. Use environment variables instead."
    languages: [javascript, typescript]
    severity: ERROR
    metadata:
      category: security
      cwe: "CWE-798"
      owasp: "A3:2017"

  - id: sql-injection-format-string
    patterns:
      - pattern: |
          $QUERY = f"... {$USER_INPUT} ..."
          ...
          cursor.execute($QUERY)
    message: "Potential SQL injection via f-string formatting"
    languages: [python]
    severity: ERROR
    metadata:
      category: security
      cwe: "CWE-89"

  - id: insecure-random
    pattern: random.random()
    message: "Use secrets module for security-sensitive random values"
    languages: [python]
    severity: WARNING
    fix: secrets.token_bytes(32)
```

#### Running Custom Rules

```bash
# Run with custom rules
semgrep --config=custom-rules.yaml .

# Combine with default rules
semgrep --config=auto --config=custom-rules.yaml .

# Exclude test files
semgrep --config=auto --exclude='*_test.py' --exclude='test_*.py' .
```

### CodeQL

CodeQL, developed by GitHub, provides deep semantic code analysis using a query language designed for security research.

#### GitHub Actions Integration

```yaml
# .github/workflows/codeql.yml
name: "CodeQL Analysis"

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Weekly on Monday

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
        language: ['javascript', 'python', 'java']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: ${{ matrix.language }}
          queries: security-extended,security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v2

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          category: "/language:${{ matrix.language }}"
```

#### Custom CodeQL Query

```ql
// custom-queries/sql-injection.ql
/**
 * @name SQL injection vulnerability
 * @description User input flows into SQL query without sanitization
 * @kind path-problem
 * @problem.severity error
 * @security-severity 9.8
 * @precision high
 * @id custom/sql-injection
 * @tags security
 *       external/cwe/cwe-089
 */

import javascript
import DataFlow::PathGraph

class SqlInjectionConfig extends TaintTracking::Configuration {
  SqlInjectionConfig() { this = "SqlInjectionConfig" }

  override predicate isSource(DataFlow::Node source) {
    exists(Express::RequestInputAccess input |
      source = input
    )
  }

  override predicate isSink(DataFlow::Node sink) {
    exists(DatabaseAccess db |
      sink = db.getAnArgument()
    )
  }
}

from SqlInjectionConfig cfg, DataFlow::PathNode source, DataFlow::PathNode sink
where cfg.hasFlowPath(source, sink)
select sink.getNode(), source, sink, "SQL injection from $@.", source.getNode(), "user input"
```

## Popular DAST Tools

DAST tools test running applications by simulating attacks and analyzing responses.

### OWASP ZAP (Zed Attack Proxy)

OWASP ZAP is the most widely used open-source DAST tool, providing comprehensive web application security testing capabilities.

#### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  zap:
    image: ghcr.io/zaproxy/zaproxy:stable
    container_name: owasp-zap
    command: zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.key=your-api-key
    ports:
      - "8080:8080"
    volumes:
      - ./zap-reports:/zap/wrk:rw
    networks:
      - security-testing

  target-app:
    image: your-app:latest
    container_name: target-application
    ports:
      - "3000:3000"
    networks:
      - security-testing

networks:
  security-testing:
    driver: bridge
```

#### Baseline Scan Script

```bash
#!/bin/bash
# zap-baseline-scan.sh

TARGET_URL="http://target-app:3000"
REPORT_DIR="/zap/wrk"

# Run baseline scan (passive only, fast)
docker run --rm -v $(pwd)/reports:/zap/wrk:rw \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t ${TARGET_URL} \
  -r baseline-report.html \
  -J baseline-report.json \
  -I  # Don't return failure on warnings

echo "Baseline scan complete. Report saved to reports/baseline-report.html"
```

#### Full Scan Script

```bash
#!/bin/bash
# zap-full-scan.sh

TARGET_URL="http://target-app:3000"

# Run full scan (active scanning, comprehensive)
docker run --rm -v $(pwd)/reports:/zap/wrk:rw \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py \
  -t ${TARGET_URL} \
  -r full-scan-report.html \
  -J full-scan-report.json \
  -a  # Include alpha rules
  -d  # Show debug messages

echo "Full scan complete. Report saved to reports/full-scan-report.html"
```

#### API Scan with OpenAPI Specification

```bash
#!/bin/bash
# zap-api-scan.sh

OPENAPI_URL="http://target-app:3000/api/openapi.json"

# Scan API defined by OpenAPI spec
docker run --rm -v $(pwd)/reports:/zap/wrk:rw \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
  -t ${OPENAPI_URL} \
  -f openapi \
  -r api-scan-report.html \
  -J api-scan-report.json

echo "API scan complete."
```

#### Python Automation with ZAP API

```python
# zap_automation.py
from zapv2 import ZAPv2
import time

class ZAPScanner:
    def __init__(self, api_key: str, proxy_address: str = "http://localhost:8080"):
        self.zap = ZAPv2(apikey=api_key, proxies={
            'http': proxy_address,
            'https': proxy_address
        })

    def spider_scan(self, target_url: str, max_depth: int = 5) -> int:
        """Spider the target to discover URLs."""
        print(f"Starting spider scan on {target_url}")
        scan_id = self.zap.spider.scan(target_url, maxchildren=max_depth)

        while int(self.zap.spider.status(scan_id)) < 100:
            print(f"Spider progress: {self.zap.spider.status(scan_id)}%")
            time.sleep(2)

        print(f"Spider complete. Found {len(self.zap.spider.results(scan_id))} URLs")
        return scan_id

    def active_scan(self, target_url: str) -> int:
        """Run active security scan."""
        print(f"Starting active scan on {target_url}")
        scan_id = self.zap.ascan.scan(target_url)

        while int(self.zap.ascan.status(scan_id)) < 100:
            print(f"Active scan progress: {self.zap.ascan.status(scan_id)}%")
            time.sleep(5)

        print("Active scan complete")
        return scan_id

    def get_alerts(self, base_url: str = None) -> list:
        """Retrieve all security alerts."""
        if base_url:
            return self.zap.core.alerts(baseurl=base_url)
        return self.zap.core.alerts()

    def get_high_risk_alerts(self, base_url: str = None) -> list:
        """Filter alerts to high and critical only."""
        alerts = self.get_alerts(base_url)
        return [
            alert for alert in alerts
            if alert.get('risk') in ['High', 'Critical']
        ]

    def generate_report(self, report_type: str = 'html') -> str:
        """Generate security report."""
        if report_type == 'html':
            return self.zap.core.htmlreport()
        elif report_type == 'json':
            return self.zap.core.jsonreport()
        elif report_type == 'xml':
            return self.zap.core.xmlreport()
        else:
            raise ValueError(f"Unknown report type: {report_type}")

    def full_scan(self, target_url: str) -> dict:
        """Run complete scan workflow."""
        # Spider first
        self.spider_scan(target_url)

        # Then active scan
        self.active_scan(target_url)

        # Get results
        alerts = self.get_alerts(target_url)
        high_risk = self.get_high_risk_alerts(target_url)

        return {
            'total_alerts': len(alerts),
            'high_risk_count': len(high_risk),
            'high_risk_alerts': high_risk
        }

# Usage example
scanner = ZAPScanner(api_key="your-api-key")
results = scanner.full_scan("http://localhost:3000")
print(f"Found {results['high_risk_count']} high-risk vulnerabilities")
```

### Burp Suite

Burp Suite is a commercial DAST tool widely used in professional penetration testing, with a limited free Community Edition.

#### Configuration for CI/CD (Enterprise Edition)

```json
{
  "scan_configurations": [
    {
      "name": "CI/CD Security Scan",
      "type": "NamedConfiguration",
      "scan_configuration_fragment": {
        "audit_optimization": {
          "scan_speed": "fast",
          "consolidate_insertion_points": true
        },
        "audit_phase": {
          "detection_only": false,
          "audit_strategies": [
            "sql_injection",
            "xss",
            "command_injection",
            "path_traversal",
            "authentication"
          ]
        },
        "crawl_limits": {
          "maximum_link_depth": 10,
          "maximum_crawl_time": 1800
        }
      }
    }
  ],
  "urls": ["http://target-app:3000"],
  "report_type": "HTML"
}
```

### Nuclei

Nuclei is a fast, template-based vulnerability scanner that can be used for DAST-style testing.

```bash
# Install Nuclei
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Update templates
nuclei -update-templates

# Basic scan
nuclei -u https://target-app.com -t cves/ -t vulnerabilities/

# Scan with specific templates
nuclei -u https://target-app.com \
  -t http/cves/ \
  -t http/vulnerabilities/ \
  -t http/misconfiguration/ \
  -severity critical,high \
  -o nuclei-results.txt

# Scan multiple targets
nuclei -l targets.txt -t http/cves/ -o results.txt

# JSON output for integration
nuclei -u https://target-app.com -t http/cves/ -json -o results.json
```

#### Custom Nuclei Template

```yaml
# custom-templates/api-key-exposure.yaml
id: api-key-in-response

info:
  name: API Key Exposure in Response
  author: security-team
  severity: high
  description: Detects exposed API keys in HTTP responses
  tags: api,exposure,sensitive-data

requests:
  - method: GET
    path:
      - "{{BaseURL}}/api/config"
      - "{{BaseURL}}/api/settings"
      - "{{BaseURL}}/.env"

    matchers-condition: or
    matchers:
      - type: regex
        regex:
          - "(?i)(api[_-]?key|apikey)['\"]?\\s*[=:]\\s*['\"]?[a-zA-Z0-9]{20,}"
          - "(?i)(secret[_-]?key|secretkey)['\"]?\\s*[=:]\\s*['\"]?[a-zA-Z0-9]{20,}"
          - "sk-[a-zA-Z0-9]{32,}"  # OpenAI API key pattern

      - type: word
        words:
          - "AWS_ACCESS_KEY_ID"
          - "AWS_SECRET_ACCESS_KEY"
        condition: or
```

## CI/CD Integration

Integrating SAST and DAST into CI/CD pipelines ensures consistent security testing throughout the development lifecycle.

### GitHub Actions Pipeline

```yaml
# .github/workflows/security.yml
name: Security Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

jobs:
  # SAST Jobs
  sast-sonarqube:
    name: SonarQube Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for better analysis

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Cache SonarQube packages
        uses: actions/cache@v4
        with:
          path: ~/.sonar/cache
          key: ${{ runner.os }}-sonar
          restore-keys: ${{ runner.os }}-sonar

      - name: Build and analyze
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        run: |
          mvn clean verify sonar:sonar \
            -Dsonar.projectKey=${{ github.repository_owner }}_${{ github.event.repository.name }} \
            -Dsonar.host.url=${{ env.SONAR_HOST_URL }} \
            -Dsonar.login=${{ secrets.SONAR_TOKEN }}

  sast-semgrep:
    name: Semgrep Analysis
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        run: |
          semgrep ci \
            --config=auto \
            --config=p/security-audit \
            --sarif --output=semgrep-results.sarif

      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: semgrep-results.sarif
        if: always()

  sast-snyk:
    name: Snyk Code Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk Code
        uses: snyk/actions/code@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --sarif-file-output=snyk-code.sarif

      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: snyk-code.sarif
        if: always()

  # DAST Jobs
  dast-zap:
    name: OWASP ZAP Scan
    runs-on: ubuntu-latest
    needs: [sast-sonarqube, sast-semgrep]  # Run after SAST passes
    services:
      app:
        image: ${{ github.repository }}:${{ github.sha }}
        ports:
          - 3000:3000
    steps:
      - uses: actions/checkout@v4

      - name: Wait for application
        run: |
          timeout 60 bash -c 'until curl -s http://localhost:3000/health; do sleep 2; done'

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a -j'

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v4
        with:
          name: zap-report
          path: report_html.html
        if: always()

  dast-nuclei:
    name: Nuclei Scan
    runs-on: ubuntu-latest
    needs: [sast-sonarqube, sast-semgrep]
    services:
      app:
        image: ${{ github.repository }}:${{ github.sha }}
        ports:
          - 3000:3000
    steps:
      - uses: actions/checkout@v4

      - name: Run Nuclei
        uses: projectdiscovery/nuclei-action@main
        with:
          target: http://localhost:3000
          templates: cves,vulnerabilities,misconfiguration
          output: nuclei-results.txt
          sarif-export: nuclei-results.sarif

      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: nuclei-results.sarif
        if: always()

  # Security Gate
  security-gate:
    name: Security Gate
    runs-on: ubuntu-latest
    needs: [sast-sonarqube, sast-semgrep, sast-snyk, dast-zap, dast-nuclei]
    steps:
      - name: Check security status
        run: |
          echo "All security scans completed"
          # Add logic to check for blocking vulnerabilities
```

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - build
  - sast
  - deploy-staging
  - dast
  - security-gate

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  STAGING_URL: https://staging.example.com

# SAST Stage
sonarqube-analysis:
  stage: sast
  image: sonarsource/sonar-scanner-cli:latest
  variables:
    SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"
    GIT_DEPTH: 0
  cache:
    key: "${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  script:
    - sonar-scanner
      -Dsonar.projectKey=${CI_PROJECT_PATH_SLUG}
      -Dsonar.host.url=${SONAR_HOST_URL}
      -Dsonar.login=${SONAR_TOKEN}
      -Dsonar.qualitygate.wait=true
  allow_failure: false

semgrep-scan:
  stage: sast
  image: returntocorp/semgrep
  script:
    - semgrep ci --config=auto --sarif --output=semgrep.sarif
  artifacts:
    reports:
      sast: semgrep.sarif
    paths:
      - semgrep.sarif
    when: always

snyk-code:
  stage: sast
  image: snyk/snyk:node
  script:
    - snyk auth ${SNYK_TOKEN}
    - snyk code test --sarif-file-output=snyk-code.sarif || true
  artifacts:
    reports:
      sast: snyk-code.sarif
    when: always

# Deploy to Staging
deploy-staging:
  stage: deploy-staging
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker pull ${DOCKER_IMAGE}
    - docker tag ${DOCKER_IMAGE} staging-app:latest
    - docker-compose -f docker-compose.staging.yml up -d
  environment:
    name: staging
    url: ${STAGING_URL}

# DAST Stage
zap-baseline:
  stage: dast
  image: ghcr.io/zaproxy/zaproxy:stable
  script:
    - mkdir -p /zap/wrk
    - zap-baseline.py -t ${STAGING_URL} -r zap-report.html -J zap-report.json -I
  artifacts:
    reports:
      dast: zap-report.json
    paths:
      - zap-report.html
    when: always
  needs:
    - deploy-staging

zap-full-scan:
  stage: dast
  image: ghcr.io/zaproxy/zaproxy:stable
  script:
    - mkdir -p /zap/wrk
    - zap-full-scan.py -t ${STAGING_URL} -r zap-full-report.html -J zap-full-report.json
  artifacts:
    paths:
      - zap-full-report.html
      - zap-full-report.json
    when: always
  needs:
    - deploy-staging
  when: manual  # Full scan on-demand due to time

# Security Gate
security-gate:
  stage: security-gate
  image: alpine:latest
  script:
    - apk add --no-cache jq
    - |
      # Check for critical/high vulnerabilities
      HIGH_COUNT=$(jq '[.site[].alerts[] | select(.riskcode >= "3")] | length' zap-report.json)
      if [ "$HIGH_COUNT" -gt 0 ]; then
        echo "Found $HIGH_COUNT high-risk vulnerabilities"
        exit 1
      fi
      echo "Security gate passed"
  needs:
    - zap-baseline
    - semgrep-scan
```

## Managing False Positives

False positives are a significant challenge in security testing. Effective management is crucial for maintaining developer trust and workflow efficiency.

### Understanding False Positive Rates

```
+-----------------------------------------------------------------------+
|               False Positive Impact on Development                     |
+-----------------------------------------------------------------------+
|                                                                       |
|   High False Positive Rate:                                           |
|   - Developer fatigue and alert blindness                             |
|   - Time wasted investigating non-issues                              |
|   - Loss of trust in security tools                                   |
|   - Security findings ignored or dismissed                            |
|                                                                       |
|   Low False Positive Rate:                                            |
|   - May miss real vulnerabilities (false negatives)                   |
|   - Over-tuned rules may lack coverage                                |
|   - Developers may become complacent                                  |
|                                                                       |
|   Optimal Balance:                                                    |
|   - Meaningful alerts that developers trust                           |
|   - Clear process for triage and escalation                           |
|   - Continuous tuning based on feedback                               |
|                                                                       |
+-----------------------------------------------------------------------+
```

### False Positive Management Strategies

#### Baseline and Suppress Known Issues

```yaml
# .security/baseline.yaml
suppressions:
  - tool: semgrep
    rule_id: javascript.lang.security.audit.sqli
    file_pattern: "test/**/*"
    reason: "Test files with intentional vulnerable patterns"
    expires: "2024-12-31"
    approved_by: "security-team"

  - tool: sonarqube
    issue_key: "squid:S2068"
    file: "src/config/defaults.js"
    reason: "Default configuration values, not actual secrets"
    approved_by: "john.smith@example.com"

  - tool: zap
    alert_id: 10038
    url_pattern: "/api/health"
    reason: "Health endpoint intentionally exposes version info"
    risk_accepted: true
```

#### Implement Triage Workflow

```python
# triage_workflow.py
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import json

class TriageStatus(Enum):
    NEW = "new"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    RISK_ACCEPTED = "risk_accepted"
    FIXED = "fixed"

@dataclass
class SecurityFinding:
    id: str
    tool: str
    severity: str
    title: str
    description: str
    file_path: Optional[str]
    line_number: Optional[int]
    status: TriageStatus = TriageStatus.NEW
    notes: str = ""
    assigned_to: Optional[str] = None

class TriageManager:
    def __init__(self, findings_file: str):
        self.findings_file = findings_file
        self.findings: List[SecurityFinding] = []
        self.load_findings()

    def load_findings(self):
        """Load findings from file."""
        try:
            with open(self.findings_file, 'r') as f:
                data = json.load(f)
                self.findings = [
                    SecurityFinding(**finding)
                    for finding in data.get('findings', [])
                ]
        except FileNotFoundError:
            self.findings = []

    def save_findings(self):
        """Save findings to file."""
        with open(self.findings_file, 'w') as f:
            json.dump({
                'findings': [
                    {
                        'id': finding.id,
                        'tool': finding.tool,
                        'severity': finding.severity,
                        'title': finding.title,
                        'description': finding.description,
                        'file_path': finding.file_path,
                        'line_number': finding.line_number,
                        'status': finding.status.value,
                        'notes': finding.notes,
                        'assigned_to': finding.assigned_to
                    }
                    for finding in self.findings
                ]
            }, f, indent=2)

    def mark_false_positive(self, finding_id: str, reason: str, approved_by: str):
        """Mark a finding as false positive."""
        for finding in self.findings:
            if finding.id == finding_id:
                finding.status = TriageStatus.FALSE_POSITIVE
                finding.notes = f"False positive: {reason} (Approved by: {approved_by})"
                self.save_findings()
                return True
        return False

    def accept_risk(self, finding_id: str, justification: str, approved_by: str):
        """Accept risk for a finding."""
        for finding in self.findings:
            if finding.id == finding_id:
                finding.status = TriageStatus.RISK_ACCEPTED
                finding.notes = f"Risk accepted: {justification} (Approved by: {approved_by})"
                self.save_findings()
                return True
        return False

    def get_actionable_findings(self) -> List[SecurityFinding]:
        """Get findings that need action."""
        return [
            finding for finding in self.findings
            if finding.status in [TriageStatus.NEW, TriageStatus.CONFIRMED]
        ]

    def generate_suppression_config(self) -> dict:
        """Generate suppression configuration from triaged findings."""
        suppressions = []
        for finding in self.findings:
            if finding.status in [TriageStatus.FALSE_POSITIVE, TriageStatus.RISK_ACCEPTED]:
                suppressions.append({
                    'tool': finding.tool,
                    'finding_id': finding.id,
                    'file': finding.file_path,
                    'reason': finding.notes,
                    'status': finding.status.value
                })
        return {'suppressions': suppressions}
```

#### Tool-Specific Suppression

**SonarQube Suppressions:**

```java
// Inline suppression
@SuppressWarnings("squid:S2068")
public class Config {
    // SonarQube will ignore hardcoded password rule here
    private static final String DEFAULT_PASSWORD = "changeme";
}
```

**Semgrep Suppressions:**

```python
# nosemgrep: python.lang.security.audit.subprocess-shell-true
subprocess.run(command, shell=True)  # Justified: command is from trusted config
```

**Snyk Suppressions:**

```yaml
# .snyk
version: v1.5.0
ignore:
  SNYK-JS-LODASH-567746:
    - '*':
        reason: 'Vulnerability not exploitable in our usage context'
        expires: '2024-06-01'
        created: '2024-01-15'
```

#### Automated False Positive Detection

```python
# false_positive_detector.py
from typing import List, Dict
import re

class FalsePositiveDetector:
    """Heuristic-based false positive detection."""

    def __init__(self):
        self.patterns = {
            'test_file': [
                r'test[_-].*\.py$',
                r'.*[_-]test\.py$',
                r'.*\.test\.[jt]sx?$',
                r'__tests__/',
                r'spec/'
            ],
            'example_code': [
                r'example',
                r'sample',
                r'demo',
                r'placeholder'
            ],
            'documentation': [
                r'\.md$',
                r'docs/',
                r'README'
            ]
        }

    def is_likely_false_positive(self, finding: Dict) -> tuple:
        """
        Check if a finding is likely a false positive.
        Returns (is_likely_fp, reason)
        """
        file_path = finding.get('file_path', '')
        code_snippet = finding.get('code_snippet', '')

        # Check if in test file
        for pattern in self.patterns['test_file']:
            if re.search(pattern, file_path, re.IGNORECASE):
                return True, "Finding is in a test file"

        # Check if example/placeholder code
        for pattern in self.patterns['example_code']:
            if re.search(pattern, code_snippet, re.IGNORECASE):
                return True, "Code appears to be example/placeholder"

        # Check for documentation
        for pattern in self.patterns['documentation']:
            if re.search(pattern, file_path, re.IGNORECASE):
                return True, "Finding is in documentation"

        # Check for obvious placeholders in secrets detection
        if finding.get('category') == 'hardcoded_secret':
            placeholder_patterns = [
                r'xxx+',
                r'your[_-]?api[_-]?key',
                r'<.*>',
                r'\$\{.*\}',
                r'changeme',
                r'placeholder'
            ]
            for pattern in placeholder_patterns:
                if re.search(pattern, code_snippet, re.IGNORECASE):
                    return True, "Appears to be a placeholder value"

        return False, None

    def filter_findings(self, findings: List[Dict]) -> Dict:
        """Filter findings into actionable and likely false positives."""
        actionable = []
        likely_fp = []

        for finding in findings:
            is_fp, reason = self.is_likely_false_positive(finding)
            if is_fp:
                finding['fp_reason'] = reason
                likely_fp.append(finding)
            else:
                actionable.append(finding)

        return {
            'actionable': actionable,
            'likely_false_positives': likely_fp,
            'stats': {
                'total': len(findings),
                'actionable_count': len(actionable),
                'likely_fp_count': len(likely_fp),
                'fp_rate': len(likely_fp) / len(findings) if findings else 0
            }
        }
```

### Tracking False Positive Rates

```python
# fp_metrics.py
from datetime import datetime
import json

class FPMetricsTracker:
    """Track false positive rates over time."""

    def __init__(self, metrics_file: str):
        self.metrics_file = metrics_file
        self.metrics = self.load_metrics()

    def load_metrics(self) -> dict:
        try:
            with open(self.metrics_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {'history': [], 'by_tool': {}, 'by_rule': {}}

    def save_metrics(self):
        with open(self.metrics_file, 'w') as f:
            json.dump(self.metrics, f, indent=2)

    def record_triage_result(self, tool: str, rule_id: str, is_false_positive: bool):
        """Record a triage decision."""
        today = datetime.now().strftime('%Y-%m-%d')

        # Initialize structures if needed
        if tool not in self.metrics['by_tool']:
            self.metrics['by_tool'][tool] = {'total': 0, 'fp': 0}
        if rule_id not in self.metrics['by_rule']:
            self.metrics['by_rule'][rule_id] = {'total': 0, 'fp': 0, 'tool': tool}

        # Update counts
        self.metrics['by_tool'][tool]['total'] += 1
        self.metrics['by_rule'][rule_id]['total'] += 1

        if is_false_positive:
            self.metrics['by_tool'][tool]['fp'] += 1
            self.metrics['by_rule'][rule_id]['fp'] += 1

        # Record in history
        self.metrics['history'].append({
            'date': today,
            'tool': tool,
            'rule_id': rule_id,
            'is_fp': is_false_positive
        })

        self.save_metrics()

    def get_fp_rate_by_tool(self) -> dict:
        """Get false positive rate by tool."""
        rates = {}
        for tool, stats in self.metrics['by_tool'].items():
            if stats['total'] > 0:
                rates[tool] = {
                    'fp_rate': stats['fp'] / stats['total'],
                    'total_findings': stats['total'],
                    'false_positives': stats['fp']
                }
        return rates

    def get_problematic_rules(self, threshold: float = 0.5) -> list:
        """Get rules with high false positive rates."""
        problematic = []
        for rule_id, stats in self.metrics['by_rule'].items():
            if stats['total'] >= 5:  # Minimum sample size
                fp_rate = stats['fp'] / stats['total']
                if fp_rate >= threshold:
                    problematic.append({
                        'rule_id': rule_id,
                        'tool': stats['tool'],
                        'fp_rate': fp_rate,
                        'total': stats['total']
                    })
        return sorted(problematic, key=lambda x: x['fp_rate'], reverse=True)

    def generate_report(self) -> str:
        """Generate a false positive metrics report."""
        report = ["# False Positive Metrics Report\n"]

        # Overall stats
        total = sum(t['total'] for t in self.metrics['by_tool'].values())
        total_fp = sum(t['fp'] for t in self.metrics['by_tool'].values())
        overall_rate = total_fp / total if total > 0 else 0

        report.append(f"## Overall Statistics")
        report.append(f"- Total Findings Triaged: {total}")
        report.append(f"- False Positives: {total_fp}")
        report.append(f"- Overall FP Rate: {overall_rate:.1%}\n")

        # By tool
        report.append("## False Positive Rate by Tool")
        for tool, rates in self.get_fp_rate_by_tool().items():
            report.append(f"- **{tool}**: {rates['fp_rate']:.1%} "
                         f"({rates['false_positives']}/{rates['total_findings']})")

        # Problematic rules
        report.append("\n## Rules with High FP Rates (>50%)")
        problematic = self.get_problematic_rules()
        if problematic:
            for rule in problematic[:10]:
                report.append(f"- {rule['rule_id']} ({rule['tool']}): "
                             f"{rule['fp_rate']:.1%} ({rule['total']} findings)")
        else:
            report.append("No rules with consistently high false positive rates.")

        return '\n'.join(report)
```

## Combining SAST and DAST

The most effective security testing strategy combines both SAST and DAST approaches to achieve comprehensive coverage.

### Complementary Coverage Model

```
+-----------------------------------------------------------------------+
|              Combined SAST + DAST Security Coverage                    |
+-----------------------------------------------------------------------+
|                                                                       |
|   Development Phase              Testing/Staging Phase                |
|   +------------------------+     +------------------------+           |
|   |         SAST           |     |         DAST           |           |
|   |                        |     |                        |           |
|   | - Code patterns        |     | - Runtime behavior     |           |
|   | - Data flow analysis   |     | - Configuration issues |           |
|   | - Hardcoded secrets    |     | - Authentication tests |           |
|   | - Insecure crypto      |     | - Session management   |           |
|   | - Input validation     |     | - Server headers       |           |
|   |                        |     |                        |           |
|   +------------------------+     +------------------------+           |
|              |                              |                         |
|              v                              v                         |
|   +-------------------------------------------------------+           |
|   |              Unified Security Dashboard                |           |
|   |                                                       |           |
|   | - Correlated findings                                 |           |
|   | - Risk prioritization                                 |           |
|   | - Remediation tracking                                |           |
|   | - Compliance reporting                                |           |
|   +-------------------------------------------------------+           |
|                                                                       |
+-----------------------------------------------------------------------+
```

### Correlation-Enhanced Prioritization

When the same vulnerability is detected by both SAST and DAST, confidence in the finding increases significantly:

```
+-----------------------------------------------------------------------+
|              Finding Prioritization Matrix                             |
+-----------------------------------------------------------------------+
|                                                                       |
|   Priority Level    Criteria                          Action          |
|   ---------------------------------------------------------------------
|   P0 (Critical)     - DAST confirmed exploitable      Fix immediately |
|                     - Critical severity               Block release   |
|                     - Correlated SAST+DAST                            |
|                                                                       |
|   P1 (High)         - High severity                   Fix within      |
|                     - DAST confirmed OR               sprint          |
|                     - Correlated finding                              |
|                                                                       |
|   P2 (Medium)       - Medium severity                 Plan for fix    |
|                     - SAST only, high confidence                      |
|                                                                       |
|   P3 (Low)          - Low severity                    Backlog         |
|                     - SAST only                                       |
|                     - May be false positive                           |
|                                                                       |
+-----------------------------------------------------------------------+
```

## Best Practices Summary

### SAST Best Practices

1. **Integrate Early**: Add SAST to pre-commit hooks and IDE plugins for immediate feedback
2. **Start with Defaults**: Begin with default rules, then tune based on false positive analysis
3. **Maintain Baseline**: Track acknowledged issues to prevent alert fatigue
4. **Update Regularly**: Keep tools and rules updated for new vulnerability patterns
5. **Cover All Languages**: Ensure SAST coverage for all languages in your stack

### DAST Best Practices

1. **Test Realistic Environments**: Run DAST against staging with production-like data
2. **Authenticate Properly**: Configure authenticated scanning for comprehensive coverage
3. **Schedule Appropriately**: Balance scan frequency with environment stability
4. **Handle Dynamic Content**: Ensure proper crawling of JavaScript-heavy applications
5. **Protect Test Data**: Use appropriate test accounts and sanitized data

### Combined Strategy Best Practices

1. **Layer Your Defenses**: Use both SAST and DAST for complementary coverage
2. **Correlate Findings**: Prioritize vulnerabilities confirmed by multiple tools
3. **Automate Triage**: Implement automated false positive detection
4. **Track Metrics**: Monitor false positive rates and remediation velocity
5. **Continuous Improvement**: Regularly review and tune your security testing strategy

## Conclusion

SAST and DAST are complementary approaches that together provide comprehensive application security coverage. SAST excels at finding code-level vulnerabilities early in development, while DAST validates application security in runtime environments. By implementing both methodologies with proper CI/CD integration, false positive management, and unified reporting, organizations can build robust security testing programs that catch vulnerabilities before they reach production.

The key to success lies not in choosing one approach over the other, but in strategically combining them based on your application's risk profile, development workflow, and security requirements. Regular tuning, metric tracking, and continuous improvement ensure that your security testing remains effective as your applications and threat landscape evolve.
