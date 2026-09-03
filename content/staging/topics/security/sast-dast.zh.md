---
title: SAST 与 DAST 安全测试
description: 了解静态和动态应用安全测试
track: security
section: appsec
difficulty: intermediate
tags:
  - SAST
  - DAST
  - 代码扫描
  - 安全测试
status: imported
origin: old/src/content/docs/security/sast-dast.zh.md
divergence: 0.175
issues: []
legacy:
  category: Security
  subcategory: AppSec
  order: 11
  lastUpdated: 2026-01-07
---

在现代软件开发中，安全测试是确保应用程序安全性的关键环节。SAST（静态应用安全测试）和 DAST（动态应用安全测试）是两种互补的安全测试方法，它们从不同角度发现应用程序中的安全漏洞。本文将深入探讨这两种测试方法的原理、应用场景、常用工具以及最佳实践。

## 什么是 SAST 和 DAST？

### SAST（Static Application Security Testing）

静态应用安全测试是一种"白盒"测试方法，在不执行代码的情况下分析应用程序的源代码、字节码或二进制文件。SAST 工具通过扫描代码库来识别潜在的安全漏洞。

```
┌─────────────────────────────────────────────────────────────────┐
│                      SAST 工作流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   源代码/字节码          静态分析引擎           漏洞报告         │
│   ┌─────────┐          ┌─────────────┐       ┌─────────────┐   │
│   │ .java   │          │  词法分析    │       │ SQL 注入    │   │
│   │ .py     │ ───────▶ │  语法分析    │ ────▶ │ XSS 漏洞    │   │
│   │ .js     │          │  数据流分析  │       │ 硬编码密钥  │   │
│   │ .go     │          │  控制流分析  │       │ 不安全配置  │   │
│   └─────────┘          └─────────────┘       └─────────────┘   │
│                                                                 │
│   特点：                                                        │
│   • 无需运行应用程序                                             │
│   • 可以在开发早期进行                                           │
│   • 能够覆盖所有代码路径                                         │
│   • 可能产生误报（False Positives）                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**SAST 可以发现的典型漏洞：**

- SQL 注入
- 跨站脚本（XSS）
- 缓冲区溢出
- 硬编码凭据
- 不安全的加密实现
- 路径遍历
- 命令注入
- 不安全的反序列化

### DAST（Dynamic Application Security Testing）

动态应用安全测试是一种"黑盒"测试方法，通过模拟攻击者的行为，在应用程序运行时对其进行测试。DAST 工具不需要访问源代码，而是通过与运行中的应用程序交互来发现漏洞。

```
┌─────────────────────────────────────────────────────────────────┐
│                      DAST 工作流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   运行中的应用           DAST 扫描器            漏洞报告         │
│   ┌─────────┐          ┌─────────────┐       ┌─────────────┐   │
│   │         │          │  爬虫模块    │       │ 认证绕过    │   │
│   │  Web    │ ◀──────▶ │  模糊测试    │ ────▶ │ 会话劫持    │   │
│   │  API    │          │  注入测试    │       │ CSRF 漏洞   │   │
│   │  App    │          │  配置检查    │       │ 敏感信息泄露│   │
│   └─────────┘          └─────────────┘       └─────────────┘   │
│        ▲                                                        │
│        │    HTTP 请求/响应                                       │
│        └────────────────────────────────────────────────────────│
│                                                                 │
│   特点：                                                        │
│   • 需要运行中的应用程序                                         │
│   • 模拟真实攻击场景                                             │
│   • 发现运行时漏洞                                               │
│   • 误报率较低                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**DAST 可以发现的典型漏洞：**

- 身份验证和授权问题
- 服务器配置错误
- 会话管理漏洞
- 跨站请求伪造（CSRF）
- 敏感数据暴露
- 安全头缺失
- SSL/TLS 配置问题
- 运行时注入漏洞

## SAST 与 DAST 对比

### 详细对比表

| 特性 | SAST | DAST |
|------|------|------|
| 测试类型 | 白盒测试 | 黑盒测试 |
| 测试时机 | 开发/编译阶段 | 运行阶段 |
| 代码访问 | 需要源代码 | 不需要源代码 |
| 环境要求 | 无需运行环境 | 需要运行环境 |
| 覆盖范围 | 所有代码路径 | 可访问的功能 |
| 漏洞定位 | 精确到代码行 | HTTP 请求/响应级别 |
| 误报率 | 较高 | 较低 |
| 漏报率 | 较低 | 较高 |
| 扫描速度 | 快速 | 相对较慢 |
| 语言依赖 | 需要语言支持 | 语言无关 |
| 修复难度 | 易于定位修复 | 需要额外分析 |

### 漏洞发现能力对比

```
┌────────────────────────────────────────────────────────────────────────┐
│                     漏洞发现能力矩阵                                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  漏洞类型              SAST 发现能力    DAST 发现能力    推荐方法       │
│  ────────────────────────────────────────────────────────────────────  │
│  SQL 注入              ████████░░        ██████████       两者结合      │
│  XSS                   ████████░░        ██████████       两者结合      │
│  硬编码凭据            ██████████        ░░░░░░░░░░       SAST         │
│  不安全依赖            ██████████        ░░░░░░░░░░       SAST + SCA   │
│  认证绕过              ████░░░░░░        ██████████       DAST         │
│  会话管理问题          ██░░░░░░░░        ██████████       DAST         │
│  安全配置错误          ████░░░░░░        ████████░░       DAST         │
│  CSRF                  ████░░░░░░        ██████████       DAST         │
│  缓冲区溢出            ██████████        ████░░░░░░       SAST         │
│  路径遍历              ████████░░        ██████████       两者结合      │
│  敏感数据暴露          ████████░░        ████████░░       两者结合      │
│  不安全反序列化        ██████████        ██████░░░░       两者结合      │
│                                                                        │
│  说明: ██ = 高发现能力  ░░ = 低发现能力                                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## 何时使用 SAST 和 DAST？

### 使用 SAST 的最佳时机

1. **开发早期阶段**：在编写代码时就进行扫描
2. **代码审查过程**：作为 PR 检查的一部分
3. **CI/CD 管道**：每次代码提交时自动扫描
4. **安全合规审计**：满足代码审计要求

```yaml
# SAST 在 CI/CD 中的典型使用场景
stages:
  - build
  - test
  - sast  # 在构建和测试后进行 SAST 扫描
  - deploy

sast_scan:
  stage: sast
  script:
    - sonar-scanner
  rules:
    - if: $CI_MERGE_REQUEST_ID  # 合并请求时触发
    - if: $CI_COMMIT_BRANCH == "main"  # 主分支提交时触发
```

### 使用 DAST 的最佳时机

1. **预生产环境测试**：在部署到生产之前
2. **定期安全评估**：周期性的安全扫描
3. **渗透测试准备**：自动化初步安全评估
4. **第三方应用测试**：没有源代码访问权限时

```yaml
# DAST 在 CI/CD 中的典型使用场景
stages:
  - build
  - test
  - deploy_staging
  - dast  # 部署到测试环境后进行 DAST 扫描
  - deploy_production

dast_scan:
  stage: dast
  script:
    - zap-baseline.py -t $STAGING_URL
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  dependencies:
    - deploy_staging
```

### 选择策略指南

```
┌────────────────────────────────────────────────────────────────────┐
│                    测试方法选择决策树                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                    ┌─────────────────┐                             │
│                    │ 是否有源代码访问权？│                           │
│                    └────────┬────────┘                             │
│                             │                                      │
│              ┌──────────────┴──────────────┐                       │
│              ▼                              ▼                       │
│          ┌──是──┐                       ┌──否──┐                   │
│          │      │                       │      │                   │
│          ▼      │                       ▼      │                   │
│   使用 SAST    │                   仅使用 DAST │                   │
│          │      │                              │                   │
│          ▼      │                              │                   │
│   ┌─────────────┐                              │                   │
│   │应用程序可运行？│                             │                   │
│   └──────┬──────┘                              │                   │
│          │                                     │                   │
│     ┌────┴────┐                                │                   │
│     ▼         ▼                                │                   │
│   ┌是┐      ┌否┐                               │                   │
│   │  │      │  │                               │                   │
│   ▼  │      ▼  │                               │                   │
│  结合 DAST  仅使用 SAST                          │                   │
│                                                │                   │
│                                                │                   │
│  推荐策略: SAST + DAST + SCA = 全面安全测试      │                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## 常用 SAST 工具

### SonarQube

SonarQube 是最流行的开源代码质量和安全分析平台，支持 30+ 种编程语言。

#### 安装和配置

```yaml
# docker-compose.yml - SonarQube 部署
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
      SONAR_JDBC_PASSWORD: ${SONAR_DB_PASSWORD}
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
    ports:
      - "9000:9000"
    ulimits:
      nofile:
        soft: 65536
        hard: 65536

  db:
    image: postgres:15
    container_name: sonarqube-db
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: ${SONAR_DB_PASSWORD}
      POSTGRES_DB: sonar
    volumes:
      - postgresql_data:/var/lib/postgresql/data

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgresql_data:
```

#### 项目配置

```properties
# sonar-project.properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0

# 源代码路径
sonar.sources=src
sonar.tests=tests

# 语言设置
sonar.language=java
sonar.java.binaries=target/classes

# 排除文件
sonar.exclusions=**/node_modules/**,**/vendor/**,**/*.min.js

# 安全热点配置
sonar.security.hotspots.ignored=false

# 质量门禁
sonar.qualitygate.wait=true
```

#### CI/CD 集成示例

```yaml
# GitHub Actions 集成 SonarQube
name: SonarQube Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 完整克隆以获取完整历史

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Cache SonarQube packages
        uses: actions/cache@v3
        with:
          path: ~/.sonar/cache
          key: ${{ runner.os }}-sonar
          restore-keys: ${{ runner.os }}-sonar

      - name: Build and analyze
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        run: |
          mvn clean verify sonar:sonar \
            -Dsonar.projectKey=my-project \
            -Dsonar.host.url=$SONAR_HOST_URL \
            -Dsonar.login=$SONAR_TOKEN
```

### Snyk

Snyk 是一个强大的开发者安全平台，专注于发现和修复依赖项、代码、容器和基础设施中的漏洞。

#### 安装和基本使用

```bash
# 安装 Snyk CLI
npm install -g snyk

# 认证
snyk auth

# 测试项目依赖
snyk test

# 测试代码（SAST）
snyk code test

# 测试容器镜像
snyk container test my-image:tag

# 测试 IaC 配置
snyk iac test
```

#### Snyk Code 配置

```yaml
# .snyk 配置文件
version: v1.0.0

# 忽略特定漏洞
ignore:
  SNYK-JS-LODASH-1018905:
    - '*':
        reason: '已通过其他方式缓解'
        expires: 2024-06-01T00:00:00.000Z

# 语言设置
language-settings:
  javascript:
    packageManager: npm

# 排除路径
exclude:
  - node_modules
  - tests
  - '**/*.test.js'
```

#### CI/CD 集成

```yaml
# GitHub Actions 集成 Snyk
name: Snyk Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run Snyk Code (SAST)
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: code test
          args: --severity-threshold=high

      - name: Upload Snyk report
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: snyk.sarif
```

### 其他 SAST 工具

```
┌────────────────────────────────────────────────────────────────────────┐
│                      常用 SAST 工具对比                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  工具名称          类型        支持语言              特点               │
│  ────────────────────────────────────────────────────────────────────  │
│  SonarQube        开源/商业   30+ 种语言            全面的代码质量平台   │
│  Snyk Code        商业        多种主流语言          专注于安全，集成度高 │
│  Checkmarx        商业        25+ 种语言            企业级 SAST         │
│  Fortify          商业        多种语言              传统企业安全工具     │
│  Semgrep          开源        多种语言              轻量级，规则灵活     │
│  CodeQL           免费        多种语言              GitHub 原生集成     │
│  Bandit           开源        Python               Python 专用         │
│  ESLint + Rules   开源        JavaScript/TS        可配置安全规则       │
│  Gosec            开源        Go                   Go 语言专用         │
│  Brakeman         开源        Ruby on Rails        Rails 专用          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Semgrep 示例

```yaml
# .semgrep.yml - 自定义规则
rules:
  - id: hardcoded-password
    patterns:
      - pattern-either:
          - pattern: password = "..."
          - pattern: PASSWORD = "..."
          - pattern: pwd = "..."
    message: 发现硬编码密码
    languages: [python, javascript, java]
    severity: ERROR

  - id: sql-injection
    patterns:
      - pattern: |
          $QUERY = "..." + $USER_INPUT + "..."
          $DB.execute($QUERY)
    message: 潜在的 SQL 注入漏洞
    languages: [python]
    severity: ERROR
```

```bash
# 运行 Semgrep 扫描
semgrep --config auto .
semgrep --config p/security-audit .
semgrep --config .semgrep.yml .
```

## 常用 DAST 工具

### OWASP ZAP

OWASP Zed Attack Proxy (ZAP) 是最流行的开源 DAST 工具，由 OWASP 社区维护。

#### 安装和基本使用

```bash
# Docker 运行 ZAP
docker pull zaproxy/zap-stable

# 快速扫描
docker run -t zaproxy/zap-stable zap-baseline.py \
  -t https://target-app.example.com

# 完整扫描
docker run -t zaproxy/zap-stable zap-full-scan.py \
  -t https://target-app.example.com

# API 扫描
docker run -t zaproxy/zap-stable zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi
```

#### ZAP 自动化框架

```yaml
# zap-automation.yaml
env:
  contexts:
    - name: "Default Context"
      urls:
        - "https://target-app.example.com"
      includePaths:
        - "https://target-app.example.com.*"
      excludePaths:
        - ".*\\.js"
        - ".*\\.css"
      authentication:
        method: "form"
        parameters:
          loginUrl: "https://target-app.example.com/login"
          loginRequestData: "username={%username%}&password={%password%}"
        verification:
          method: "response"
          loggedInRegex: "\\QWelcome\\E"
      users:
        - name: "test-user"
          credentials:
            username: "testuser"
            password: "testpass123"

jobs:
  - type: spider
    parameters:
      context: "Default Context"
      user: "test-user"
      maxDuration: 5
      maxDepth: 10

  - type: spiderAjax
    parameters:
      context: "Default Context"
      user: "test-user"
      maxDuration: 5

  - type: passiveScan-wait
    parameters:
      maxDuration: 10

  - type: activeScan
    parameters:
      context: "Default Context"
      user: "test-user"
      policy: "Default Policy"
      maxRuleDurationInMins: 5

  - type: report
    parameters:
      template: "traditional-html"
      reportDir: "/zap/reports"
      reportFile: "zap-report"
    risks:
      - high
      - medium
      - low
```

#### CI/CD 集成

```yaml
# GitHub Actions 集成 OWASP ZAP
name: DAST Scan with OWASP ZAP

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # 每周一凌晨 2 点运行

jobs:
  dast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start application
        run: |
          docker-compose up -d
          sleep 30  # 等待应用启动

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:8080'
          rules_file_name: '.zap/rules.tsv'
          allow_issue_writing: false

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: zap-report
          path: report_html.html
```

```tsv
# .zap/rules.tsv - 自定义规则配置
10021	WARN	X-Content-Type-Options Header Missing
10038	WARN	Content Security Policy Header Not Set
40012	IGNORE	Cross Site Scripting (Reflected) - 已知误报
```

### Nuclei

Nuclei 是一个快速、可定制的漏洞扫描器，基于模板驱动。

```bash
# 安装 Nuclei
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# 基本扫描
nuclei -u https://target.example.com

# 使用特定模板
nuclei -u https://target.example.com -t cves/
nuclei -u https://target.example.com -t vulnerabilities/

# 批量扫描
nuclei -l targets.txt -t nuclei-templates/ -o results.txt

# 严重性过滤
nuclei -u https://target.example.com -severity critical,high
```

```yaml
# 自定义 Nuclei 模板示例
id: custom-sql-injection

info:
  name: Custom SQL Injection Check
  author: security-team
  severity: critical
  tags: sqli,injection

requests:
  - method: GET
    path:
      - "{{BaseURL}}/search?q=test'"
      - "{{BaseURL}}/search?q=test%27"

    matchers-condition: or
    matchers:
      - type: word
        words:
          - "SQL syntax"
          - "mysql_fetch"
          - "ORA-01756"
          - "PostgreSQL"
        condition: or

      - type: regex
        regex:
          - "(?i)sql.*(syntax|error)"
          - "(?i)unclosed.*(quotation|string)"
```

### 其他 DAST 工具

```
┌────────────────────────────────────────────────────────────────────────┐
│                      常用 DAST 工具对比                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  工具名称          类型        特点                   适用场景          │
│  ────────────────────────────────────────────────────────────────────  │
│  OWASP ZAP        开源        功能全面，社区活跃      Web 应用扫描      │
│  Burp Suite       商业        专业渗透测试工具        深度安全测试       │
│  Nuclei           开源        模板驱动，速度快        批量漏洞扫描       │
│  Nikto            开源        Web 服务器扫描         服务器配置检查     │
│  Arachni          开源        自动化 Web 扫描        Web 应用安全       │
│  Acunetix         商业        企业级 DAST            企业 Web 安全      │
│  Netsparker       商业        自动验证漏洞           企业安全测试       │
│  Qualys WAS       商业        云端扫描服务           企业合规扫描       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## CI/CD 集成最佳实践

### 完整的安全管道示例

```yaml
# .gitlab-ci.yml - 完整的安全测试管道
stages:
  - build
  - test
  - sast
  - build_image
  - deploy_staging
  - dast
  - deploy_production

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

# ==================== 构建阶段 ====================
build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

# ==================== 单元测试 ====================
test:
  stage: test
  script:
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# ==================== SAST 扫描 ====================
sast:
  stage: sast
  parallel:
    matrix:
      - SCANNER: [sonarqube, snyk, semgrep]
  script:
    - |
      case $SCANNER in
        sonarqube)
          sonar-scanner \
            -Dsonar.projectKey=$CI_PROJECT_PATH_SLUG \
            -Dsonar.sources=src \
            -Dsonar.host.url=$SONAR_HOST_URL \
            -Dsonar.login=$SONAR_TOKEN
          ;;
        snyk)
          snyk test --severity-threshold=high
          snyk code test --severity-threshold=high
          ;;
        semgrep)
          semgrep --config auto --sarif --output semgrep.sarif .
          ;;
      esac
  allow_failure: false
  rules:
    - if: $CI_MERGE_REQUEST_ID
    - if: $CI_COMMIT_BRANCH == "main"

# ==================== 依赖扫描 ====================
dependency_scan:
  stage: sast
  script:
    - snyk test --all-projects --json > snyk-deps.json
    - npm audit --json > npm-audit.json
  artifacts:
    reports:
      dependency_scanning: snyk-deps.json
  allow_failure: true

# ==================== 密钥扫描 ====================
secret_scan:
  stage: sast
  script:
    - gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif
    - trufflehog git file://. --json > trufflehog.json
  artifacts:
    paths:
      - gitleaks.sarif
      - trufflehog.json
  rules:
    - if: $CI_COMMIT_BRANCH

# ==================== 容器镜像构建 ====================
build_image:
  stage: build_image
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
    # 容器镜像扫描
    - trivy image --severity HIGH,CRITICAL $DOCKER_IMAGE
    - snyk container test $DOCKER_IMAGE --severity-threshold=high

# ==================== 部署到测试环境 ====================
deploy_staging:
  stage: deploy_staging
  script:
    - kubectl set image deployment/app app=$DOCKER_IMAGE -n staging
    - kubectl rollout status deployment/app -n staging --timeout=300s
  environment:
    name: staging
    url: https://staging.example.com

# ==================== DAST 扫描 ====================
dast:
  stage: dast
  image: zaproxy/zap-stable
  script:
    - mkdir -p /zap/reports
    - |
      zap.sh -cmd -autorun /builds/$CI_PROJECT_PATH/zap-automation.yaml \
        -config replacer.full_list(0).replacement=$STAGING_URL
    - cp /zap/reports/* .
  artifacts:
    paths:
      - zap-report.*
    reports:
      dast: zap-report.json
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  dependencies:
    - deploy_staging

# API 安全扫描
api_security_scan:
  stage: dast
  script:
    - |
      zap-api-scan.py \
        -t $STAGING_URL/api/openapi.json \
        -f openapi \
        -r api-scan-report.html
    - |
      nuclei -u $STAGING_URL \
        -t nuclei-templates/http/apis/ \
        -severity critical,high \
        -o nuclei-api-results.txt
  artifacts:
    paths:
      - api-scan-report.html
      - nuclei-api-results.txt
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ==================== 部署到生产环境 ====================
deploy_production:
  stage: deploy_production
  script:
    - kubectl set image deployment/app app=$DOCKER_IMAGE -n production
    - kubectl rollout status deployment/app -n production --timeout=300s
  environment:
    name: production
    url: https://app.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  when: manual
```

### GitHub Actions 完整示例

```yaml
# .github/workflows/security.yml
name: Security Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行

jobs:
  # ==================== SAST 扫描 ====================
  sast:
    name: SAST Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, python

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

      - name: Run Snyk SAST
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: code test
          args: --sarif-file-output=snyk-code.sarif

      - name: Upload Snyk SARIF
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: snyk-code.sarif

  # ==================== 依赖扫描 ====================
  dependency-scan:
    name: Dependency Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk Dependency Scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --all-projects --severity-threshold=medium

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Dependency Review
        uses: actions/dependency-review-action@v3
        if: github.event_name == 'pull_request'

  # ==================== 密钥扫描 ====================
  secret-scan:
    name: Secret Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  # ==================== 容器扫描 ====================
  container-scan:
    name: Container Scanning
    runs-on: ubuntu-latest
    needs: sast
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t app:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'app:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  # ==================== DAST 扫描 ====================
  dast:
    name: DAST Scanning
    runs-on: ubuntu-latest
    needs: [sast, dependency-scan]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Start application
        run: |
          docker-compose up -d
          sleep 60

      - name: OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:8080'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

      - name: OWASP ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.8.0
        with:
          target: 'http://localhost:8080'
          rules_file_name: '.zap/rules.tsv'

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: zap-report
          path: report_html.html

  # ==================== 安全报告汇总 ====================
  security-report:
    name: Security Report
    runs-on: ubuntu-latest
    needs: [sast, dependency-scan, secret-scan, container-scan, dast]
    if: always()
    steps:
      - name: Generate Security Summary
        run: |
          echo "# Security Scan Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Check | Status |" >> $GITHUB_STEP_SUMMARY
          echo "|-------|--------|" >> $GITHUB_STEP_SUMMARY
          echo "| SAST | ${{ needs.sast.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Dependencies | ${{ needs.dependency-scan.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Secrets | ${{ needs.secret-scan.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Container | ${{ needs.container-scan.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| DAST | ${{ needs.dast.result }} |" >> $GITHUB_STEP_SUMMARY
```

## 误报管理

### 误报的来源和类型

```
┌────────────────────────────────────────────────────────────────────────┐
│                      误报类型和处理策略                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  误报类型              描述                    处理策略                 │
│  ────────────────────────────────────────────────────────────────────  │
│  规则过于宽泛          规则匹配范围太广        调整规则精确度            │
│  上下文不足            工具无法理解业务逻辑    添加注释或白名单          │
│  安全控制未识别        存在其他安全措施        记录并标记为已缓解        │
│  测试/示例代码         非生产代码被扫描        排除测试目录              │
│  已知问题              第三方库的已知行为      添加到忽略列表            │
│  环境差异              开发/生产配置不同       使用环境特定配置          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 误报管理最佳实践

#### SonarQube 误报处理

```java
// 方法 1: 使用注释标记误报
public void processInput(String input) {
    // 这里的 input 已经在上层进行了验证和清理
    @SuppressWarnings("squid:S2083")  // 路径遍历 - 输入已验证
    File file = new File(basePath, input);
    // ...
}

// 方法 2: 使用 NOSONAR 标记
String query = "SELECT * FROM users WHERE id = " + id; // NOSONAR - 参数化查询在底层实现
```

```xml
<!-- 方法 3: 在 sonar-project.properties 中配置 -->
<!-- sonar.issue.ignore.multicriteria=e1,e2

sonar.issue.ignore.multicriteria.e1.ruleKey=java:S2083
sonar.issue.ignore.multicriteria.e1.resourceKey=**/legacy/**

sonar.issue.ignore.multicriteria.e2.ruleKey=javascript:S3776
sonar.issue.ignore.multicriteria.e2.resourceKey=**/generated/** -->
```

#### Snyk 误报处理

```yaml
# .snyk 文件
version: v1.0.0

ignore:
  # 忽略特定漏洞
  SNYK-JS-LODASH-1018905:
    - '*':
        reason: '该函数在我们的代码中未使用'
        expires: 2024-12-31T00:00:00.000Z
        created: 2024-01-15T00:00:00.000Z

  # 忽略特定路径
  'snyk:lic:npm:package:GPL-3.0':
    - 'tests/*':
        reason: '仅用于测试，不包含在生产代码中'

patch:
  # 应用补丁而不是升级
  SNYK-JS-EXAMPLE-123456:
    - some-package > nested-package:
        patched: '2024-01-15T00:00:00.000Z'
```

#### OWASP ZAP 误报处理

```python
# zap-rules.conf
# 格式: rule_id	action	reason
10021	WARN	X-Content-Type-Options - 已在反向代理配置
10038	IGNORE	CSP - 使用其他安全机制
40012	IGNORE	XSS - 已知误报，输入已转义
40014	WARN	SQL 注入 - 降低严重性，参数化查询已实现
```

### 建立误报审查流程

```yaml
# 误报审查工作流程
误报审查流程:
  1. 初次发现:
    - 安全工具报告潜在漏洞
    - 自动创建 Issue 或工单

  2. 初步筛选:
    - 开发者查看报告详情
    - 判断是否为明显误报
    - 如明显误报，记录原因并标记

  3. 深入分析:
    - 安全团队审查
    - 验证是否存在安全控制
    - 评估实际风险

  4. 决策记录:
    - 记录决策和原因
    - 设置过期时间
    - 更新规则配置

  5. 定期回顾:
    - 每季度审查误报列表
    - 评估规则有效性
    - 更新或移除过期的例外
```

```python
# 误报跟踪脚本示例
import json
from datetime import datetime, timedelta

class FalsePositiveTracker:
    def __init__(self, config_file='false_positives.json'):
        self.config_file = config_file
        self.load_config()

    def load_config(self):
        try:
            with open(self.config_file, 'r') as f:
                self.data = json.load(f)
        except FileNotFoundError:
            self.data = {'false_positives': []}

    def add_false_positive(self, vuln_id, reason, reviewer, expiry_days=90):
        """添加误报记录"""
        entry = {
            'vuln_id': vuln_id,
            'reason': reason,
            'reviewer': reviewer,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(days=expiry_days)).isoformat(),
            'status': 'active'
        }
        self.data['false_positives'].append(entry)
        self.save_config()

    def check_expired(self):
        """检查过期的误报记录"""
        expired = []
        now = datetime.now()
        for fp in self.data['false_positives']:
            if fp['status'] == 'active':
                expires = datetime.fromisoformat(fp['expires_at'])
                if now > expires:
                    expired.append(fp)
        return expired

    def generate_report(self):
        """生成误报报告"""
        report = {
            'total': len(self.data['false_positives']),
            'active': sum(1 for fp in self.data['false_positives'] if fp['status'] == 'active'),
            'expired': len(self.check_expired()),
            'by_reviewer': {}
        }
        for fp in self.data['false_positives']:
            reviewer = fp['reviewer']
            report['by_reviewer'][reviewer] = report['by_reviewer'].get(reviewer, 0) + 1
        return report

    def save_config(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.data, f, indent=2)
```

## 结合 SAST 和 DAST：全面安全策略

### 互补性分析

```
┌────────────────────────────────────────────────────────────────────────┐
│                    SAST + DAST 互补策略                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  开发阶段                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  IDE 插件 → Pre-commit Hooks → CI SAST → 代码审查               │  │
│  │                                                                 │  │
│  │  • 实时反馈                                                     │  │
│  │  • 早期发现问题                                                 │  │
│  │  • 覆盖所有代码路径                                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              ▼                                         │
│  测试/预发布阶段                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  集成测试 → DAST 扫描 → API 安全测试 → 渗透测试                  │  │
│  │                                                                 │  │
│  │  • 验证运行时行为                                               │  │
│  │  • 发现配置问题                                                 │  │
│  │  • 测试认证/授权                                                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              ▼                                         │
│  生产阶段                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  持续监控 → 定期 DAST → 安全事件响应                             │  │
│  │                                                                 │  │
│  │  • 检测新漏洞                                                   │  │
│  │  • 验证安全控制                                                 │  │
│  │  • 合规检查                                                     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 综合安全测试框架

```python
# security_framework.py - 综合安全测试协调器
import subprocess
import json
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

class ScanType(Enum):
    SAST = "sast"
    DAST = "dast"
    SCA = "sca"
    SECRET = "secret"
    CONTAINER = "container"

@dataclass
class SecurityFinding:
    scan_type: ScanType
    severity: str
    title: str
    description: str
    location: str
    recommendation: str
    tool: str
    confidence: str = "high"

class SecurityOrchestrator:
    def __init__(self, config: Dict):
        self.config = config
        self.findings: List[SecurityFinding] = []

    def run_sast_scans(self) -> List[SecurityFinding]:
        """运行 SAST 扫描"""
        findings = []

        # SonarQube 扫描
        if self.config.get('sonarqube', {}).get('enabled'):
            findings.extend(self._run_sonarqube())

        # Semgrep 扫描
        if self.config.get('semgrep', {}).get('enabled'):
            findings.extend(self._run_semgrep())

        # Snyk Code 扫描
        if self.config.get('snyk', {}).get('enabled'):
            findings.extend(self._run_snyk_code())

        return findings

    def run_dast_scans(self, target_url: str) -> List[SecurityFinding]:
        """运行 DAST 扫描"""
        findings = []

        # OWASP ZAP 扫描
        if self.config.get('zap', {}).get('enabled'):
            findings.extend(self._run_zap(target_url))

        # Nuclei 扫描
        if self.config.get('nuclei', {}).get('enabled'):
            findings.extend(self._run_nuclei(target_url))

        return findings

    def run_sca_scans(self) -> List[SecurityFinding]:
        """运行依赖扫描"""
        findings = []

        # Snyk 依赖扫描
        if self.config.get('snyk', {}).get('enabled'):
            findings.extend(self._run_snyk_deps())

        return findings

    def correlate_findings(self) -> List[Dict]:
        """关联不同工具的发现"""
        correlated = []

        # 按位置分组
        location_map = {}
        for finding in self.findings:
            loc = finding.location
            if loc not in location_map:
                location_map[loc] = []
            location_map[loc].append(finding)

        # 识别被多个工具发现的问题（高置信度）
        for location, findings in location_map.items():
            if len(findings) > 1:
                correlated.append({
                    'location': location,
                    'findings': findings,
                    'confidence': 'very_high',
                    'tools': list(set(f.tool for f in findings))
                })

        return correlated

    def generate_unified_report(self) -> Dict:
        """生成统一报告"""
        report = {
            'summary': {
                'total_findings': len(self.findings),
                'by_severity': self._count_by_severity(),
                'by_type': self._count_by_type(),
                'by_tool': self._count_by_tool()
            },
            'findings': [self._finding_to_dict(f) for f in self.findings],
            'correlations': self.correlate_findings(),
            'recommendations': self._generate_recommendations()
        }
        return report

    def _run_sonarqube(self) -> List[SecurityFinding]:
        """运行 SonarQube 并解析结果"""
        # 实现细节...
        pass

    def _run_semgrep(self) -> List[SecurityFinding]:
        """运行 Semgrep 并解析结果"""
        result = subprocess.run(
            ['semgrep', '--config', 'auto', '--json', '.'],
            capture_output=True, text=True
        )
        data = json.loads(result.stdout)
        findings = []
        for r in data.get('results', []):
            findings.append(SecurityFinding(
                scan_type=ScanType.SAST,
                severity=r.get('extra', {}).get('severity', 'UNKNOWN'),
                title=r.get('check_id', ''),
                description=r.get('extra', {}).get('message', ''),
                location=f"{r.get('path')}:{r.get('start', {}).get('line')}",
                recommendation=r.get('extra', {}).get('fix', ''),
                tool='semgrep'
            ))
        return findings

    def _run_zap(self, target_url: str) -> List[SecurityFinding]:
        """运行 OWASP ZAP 并解析结果"""
        # 实现细节...
        pass

    def _count_by_severity(self) -> Dict[str, int]:
        counts = {}
        for f in self.findings:
            counts[f.severity] = counts.get(f.severity, 0) + 1
        return counts

    def _count_by_type(self) -> Dict[str, int]:
        counts = {}
        for f in self.findings:
            counts[f.scan_type.value] = counts.get(f.scan_type.value, 0) + 1
        return counts

    def _count_by_tool(self) -> Dict[str, int]:
        counts = {}
        for f in self.findings:
            counts[f.tool] = counts.get(f.tool, 0) + 1
        return counts

    def _finding_to_dict(self, finding: SecurityFinding) -> Dict:
        return {
            'scan_type': finding.scan_type.value,
            'severity': finding.severity,
            'title': finding.title,
            'description': finding.description,
            'location': finding.location,
            'recommendation': finding.recommendation,
            'tool': finding.tool,
            'confidence': finding.confidence
        }

    def _generate_recommendations(self) -> List[str]:
        recommendations = []
        severity_counts = self._count_by_severity()

        if severity_counts.get('CRITICAL', 0) > 0:
            recommendations.append("立即修复所有关键级别漏洞")
        if severity_counts.get('HIGH', 0) > 5:
            recommendations.append("优先处理高风险漏洞，制定修复计划")

        return recommendations


# 使用示例
if __name__ == '__main__':
    config = {
        'sonarqube': {'enabled': True, 'url': 'http://sonarqube:9000'},
        'semgrep': {'enabled': True},
        'snyk': {'enabled': True},
        'zap': {'enabled': True},
        'nuclei': {'enabled': True}
    }

    orchestrator = SecurityOrchestrator(config)

    # 运行所有扫描
    orchestrator.findings.extend(orchestrator.run_sast_scans())
    orchestrator.findings.extend(orchestrator.run_sca_scans())
    orchestrator.findings.extend(orchestrator.run_dast_scans('https://staging.example.com'))

    # 生成报告
    report = orchestrator.generate_unified_report()
    print(json.dumps(report, indent=2, ensure_ascii=False))
```

### 安全门禁配置

```yaml
# security-gates.yml - 安全门禁配置
security_gates:
  # 合并请求门禁
  merge_request:
    sast:
      block_on:
        - severity: critical
          count: 0
        - severity: high
          count: 3
      warn_on:
        - severity: medium
          count: 10

    sca:
      block_on:
        - severity: critical
          count: 0
        - exploitable: true
          severity: high
      warn_on:
        - severity: high
          count: 5

    secrets:
      block_on:
        - any: true  # 任何密钥泄露都阻止

  # 生产部署门禁
  production_deploy:
    sast:
      block_on:
        - severity: critical
          count: 0
        - severity: high
          count: 0

    dast:
      block_on:
        - severity: critical
          count: 0
        - severity: high
          count: 0

    sca:
      block_on:
        - severity: critical
          count: 0
        - exploitable: true
          count: 0

    container:
      block_on:
        - severity: critical
          count: 0

  # 例外处理
  exceptions:
    require_approval: true
    approvers:
      - security-team
    max_duration_days: 30
    require_justification: true
```

## 总结和最佳实践

### 核心要点

```
┌────────────────────────────────────────────────────────────────────────┐
│                    SAST 与 DAST 最佳实践总结                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. 采用多层防御策略                                                   │
│     • SAST 用于开发早期，发现代码级漏洞                                │
│     • DAST 用于运行时，发现配置和运行时漏洞                            │
│     • SCA 用于依赖管理，发现第三方组件漏洞                             │
│     • 三者结合，形成完整的安全测试体系                                 │
│                                                                        │
│  2. 集成到 CI/CD 管道                                                  │
│     • 自动化运行安全扫描                                               │
│     • 设置质量门禁阻止不安全的代码部署                                 │
│     • 在正确的阶段运行正确的测试                                       │
│                                                                        │
│  3. 有效管理误报                                                       │
│     • 建立误报审查流程                                                 │
│     • 记录和跟踪误报决策                                               │
│     • 定期回顾和更新规则                                               │
│                                                                        │
│  4. 持续改进                                                           │
│     • 分析安全扫描趋势                                                 │
│     • 培训开发人员安全意识                                             │
│     • 根据发现的问题更新安全策略                                       │
│                                                                        │
│  5. 工具选择考虑因素                                                   │
│     • 语言和框架支持                                                   │
│     • 集成便利性                                                       │
│     • 误报率和准确性                                                   │
│     • 成本和许可证                                                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 实施路线图

```
阶段 1: 基础建设（1-2 个月）
├── 选择并部署 SAST 工具（如 SonarQube）
├── 集成到 CI/CD 管道
├── 建立基线扫描结果
└── 培训开发团队

阶段 2: 扩展覆盖（2-3 个月）
├── 添加 DAST 工具（如 OWASP ZAP）
├── 实施依赖扫描（SCA）
├── 配置安全门禁
└── 建立误报管理流程

阶段 3: 优化完善（3-6 个月）
├── 自定义规则和策略
├── 整合多工具报告
├── 实施自动化修复建议
└── 建立安全指标和仪表板

阶段 4: 持续改进（持续）
├── 定期评估工具效果
├── 更新安全策略
├── 跟踪行业最佳实践
└── 持续安全培训
```

### 常见问题解答

**Q: SAST 和 DAST 哪个更重要？**

A: 两者同等重要，各有侧重。SAST 在开发早期发现问题，成本更低；DAST 发现运行时问题，更贴近真实攻击。最佳实践是两者结合使用。

**Q: 如何处理大量的安全扫描结果？**

A:
1. 设置严重性阈值，优先处理高危漏洞
2. 使用自动化工具过滤已知误报
3. 建立分流机制，将问题分配给相应团队
4. 设置合理的修复 SLA

**Q: 安全扫描会影响开发速度吗？**

A:
1. 选择高效的工具，减少扫描时间
2. 使用增量扫描，只扫描变更的代码
3. 并行运行扫描，不阻塞主流程
4. 合理设置门禁，避免过于严格

**Q: 开源工具能满足企业需求吗？**

A: 对于大多数场景，开源工具（如 SonarQube Community、OWASP ZAP、Semgrep）可以提供良好的安全覆盖。企业版工具通常提供更好的集成、支持和高级功能。

---

通过合理使用 SAST 和 DAST，结合其他安全测试方法，可以构建一个全面的应用程序安全测试体系，在软件开发生命周期的各个阶段发现和修复安全漏洞，有效降低安全风险。
