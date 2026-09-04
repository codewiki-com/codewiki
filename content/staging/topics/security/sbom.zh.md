---
title: 软件物料清单 (SBOM)
description: SBOM 完全指南 - 理解、生成和管理软件组件清单以保障安全
track: security
section: appsec
difficulty: intermediate
tags:
  - SBOM
  - 软件供应链
  - SPDX
  - CycloneDX
  - 漏洞管理
status: imported
origin: old/src/content/docs/security/sbom.zh.md
divergence: 0.218
issues: []
legacy:
  category: Security
  subcategory: Supply Chain
  order: 14
  lastUpdated: 2026-01-20
---

软件物料清单（Software Bill of Materials，SBOM）是构成软件应用程序所有组件的完整清单。就像制造业中的物料清单列出产品中的每个零件一样，SBOM 提供了软件中包含的每个库、框架和依赖项的完整可见性。在应用程序通常包含数百甚至数千个第三方组件的时代，SBOM 已成为安全、合规和漏洞管理的必备要素。

## 理解 SBOM

### 什么是 SBOM？

SBOM 是一个正式结构化的、机器可读的软件组件列表，包含它们的关系和相关元数据。它相当于软件应用程序的详细"成分表"。

```
SBOM 结构概览：

┌─────────────────────────────────────────────────────────────────────┐
│                         软件物料清单                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │    组件信息       │  │    依赖关系       │  │     元数据       │  │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  │
│  │ • 名称           │  │ • 直接依赖       │  │ • 创建日期       │  │
│  │ • 版本           │  │ • 开发依赖       │  │ • 作者/工具      │  │
│  │ • 供应商         │  │ • 可选依赖       │  │ • 文档 ID        │  │
│  │ • 许可证         │  │ • 构建依赖       │  │ • 命名空间       │  │
│  │ • 哈希/校验和    │  │ • 运行时依赖     │  │ • 标准版本       │  │
│  │ • 下载地址       │  │ • 传递依赖       │  │ • 注释           │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        安全信息                               │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  • 已知漏洞（CVE 引用）                                       │   │
│  │  • 安全公告                                                   │   │
│  │  • 补丁可用性                                                 │   │
│  │  • 风险评分（CVSS）                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 历史背景与驱动事件

几个重大安全事件凸显了 SBOM 的关键需求：

#### Log4Shell 事件（2021 年 12 月）

Log4j 漏洞（CVE-2021-44228）暴露了软件供应链管理中的根本性问题：

```
Log4Shell 影响：
- CVSS 评分：10.0（严重）
- 影响范围：全球数百万 Java 应用
- 挑战：Log4j 作为传递依赖存在于无数项目中
- 响应时间：许多组织需要数天到数周才能识别受影响的系统

关键教训：没有 SBOM，组织无法快速回答：
"我们哪些系统使用了 Log4j，使用的是什么版本？"
```

#### SolarWinds 攻击（2020 年）

这次复杂的供应链攻击展示了软件构建过程中的漏洞：

```
攻击链：
1. 攻击者入侵 SolarWinds 构建系统
2. 在编译过程中注入恶意代码
3. 签名的更新分发给 18,000+ 客户
4. 政府机构和财富 500 强公司受到影响

关键教训：构建时完整性和组件追踪至关重要
```

#### 第 14028 号行政命令（2021 年 5 月）

美国政府发布了第 14028 号行政命令"改善国家网络安全"，要求向联邦机构销售的软件必须提供 SBOM：

```
行政命令要求：
1. 软件供应商必须向联邦采购方提供 SBOM
2. SBOM 必须是机器可读的
3. 必须在每次构建或发布时生成
4. 建立 SBOM 内容的最低要素
```

### 为什么 SBOM 很重要

```
SBOM 的商业价值：

┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  安全响应              合规性                风险管理          │
│  ──────────           ──────                ──────────         │
│  • 快速漏洞           • 许可证              • 供应链           │
│    识别                 合规                  透明度           │
│  • 高效修补           • 监管                • 供应商           │
│  • 攻击面               要求                  评估             │
│    可见性             • 审计                • 组件             │
│                         追踪                  质量             │
│                                                                 │
│  运营收益              开发者体验                              │
│  ──────────           ────────────                             │
│  • 更快的事件         • 依赖                • 自动化           │
│    响应                 可见性                更新             │
│  • 减少停机           • 构建                • 技术             │
│  • 成本节约             可复现性              债务追踪         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 核心原理

### SBOM 格式标准

SBOM 领域有两个主要标准：SPDX 和 CycloneDX。

#### SPDX（软件包数据交换）

SPDX 是 Linux 基金会创建的用于传达软件物料清单信息的开放标准：

```json
{
  "spdxVersion": "SPDX-2.3",
  "dataLicense": "CC0-1.0",
  "SPDXID": "SPDXRef-DOCUMENT",
  "name": "webapp-sbom",
  "documentNamespace": "https://example.com/webapp/sbom/v1.0.0",
  "creationInfo": {
    "created": "2026-01-20T10:00:00Z",
    "creators": [
      "Tool: syft-1.0.0",
      "Organization: Example Corp"
    ],
    "licenseListVersion": "3.19"
  },
  "packages": [
    {
      "SPDXID": "SPDXRef-Package-express-4.18.2",
      "name": "express",
      "versionInfo": "4.18.2",
      "supplier": "Organization: OpenJS Foundation",
      "downloadLocation": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "filesAnalyzed": false,
      "checksums": [
        {
          "algorithm": "SHA256",
          "checksumValue": "8f2c5a2e98f8d3b7a1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8"
        }
      ],
      "licenseConcluded": "MIT",
      "licenseDeclared": "MIT",
      "copyrightText": "Copyright (c) 2009-2014 TJ Holowaychuk <tj@vision-media.ca>",
      "externalRefs": [
        {
          "referenceCategory": "PACKAGE-MANAGER",
          "referenceType": "purl",
          "referenceLocator": "pkg:npm/express@4.18.2"
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
      "relatedSpdxElement": "SPDXRef-Package-express-4.18.2",
      "relationshipType": "DESCRIBES"
    },
    {
      "spdxElementId": "SPDXRef-Package-express-4.18.2",
      "relatedSpdxElement": "SPDXRef-Package-body-parser-1.20.1",
      "relationshipType": "DEPENDS_ON"
    }
  ]
}
```

#### CycloneDX

CycloneDX 是 OWASP 维护的标准，专为安全用例设计：

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "serialNumber": "urn:uuid:3e671687-395b-41f5-a30f-a58921a69b79",
  "version": 1,
  "metadata": {
    "timestamp": "2026-01-20T10:00:00Z",
    "tools": {
      "components": [
        {
          "type": "application",
          "name": "syft",
          "version": "1.0.0",
          "vendor": "Anchore"
        }
      ]
    },
    "component": {
      "type": "application",
      "name": "webapp",
      "version": "1.0.0",
      "purl": "pkg:npm/webapp@1.0.0"
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
            "id": "MIT",
            "url": "https://opensource.org/licenses/MIT"
          }
        }
      ],
      "hashes": [
        {
          "alg": "SHA-256",
          "content": "8f2c5a2e98f8d3b7a1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8"
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
        },
        {
          "type": "issue-tracker",
          "url": "https://github.com/expressjs/express/issues"
        }
      ]
    }
  ],
  "dependencies": [
    {
      "ref": "pkg:npm/webapp@1.0.0",
      "dependsOn": [
        "pkg:npm/express@4.18.2"
      ]
    },
    {
      "ref": "pkg:npm/express@4.18.2",
      "dependsOn": [
        "pkg:npm/body-parser@1.20.1",
        "pkg:npm/cookie@0.5.0"
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
          "source": { "name": "NVD" },
          "score": 7.5,
          "severity": "high",
          "method": "CVSSv31",
          "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N"
        }
      ],
      "affects": [
        {
          "ref": "pkg:npm/express@4.18.2",
          "versions": [
            { "version": "4.18.2", "status": "affected" }
          ]
        }
      ],
      "recommendation": "升级到 4.18.3 或更高版本"
    }
  ]
}
```

### 格式对比

| 特性 | SPDX | CycloneDX |
|------|------|-----------|
| 主要关注点 | 许可证合规 | 安全性 |
| 维护者 | Linux 基金会 | OWASP |
| ISO 标准 | ISO/IEC 5962:2021 | ECMA-424 |
| 漏洞数据 | 通过外部引用 | 原生支持 |
| 服务组件 | 有限支持 | 完整支持 |
| 硬件 BOM | 不支持 | 支持 |
| 组合分析 | 支持 | 支持 |
| 文件级详情 | 详尽 | 可选 |

### 组件识别

#### 包 URL（PURL）

PURL 提供了识别和定位软件包的标准化方式：

```
PURL 格式：pkg:type/namespace/name@version?qualifiers#subpath

示例：
pkg:npm/express@4.18.2
pkg:maven/org.apache.logging.log4j/log4j-core@2.17.1
pkg:pypi/requests@2.28.1
pkg:golang/github.com/gin-gonic/gin@v1.9.0
pkg:cargo/serde@1.0.152
pkg:nuget/Newtonsoft.Json@13.0.1
pkg:deb/debian/curl@7.74.0-1.3+deb11u1
pkg:docker/library/nginx@1.23.3
pkg:github/actions/checkout@v4
```

#### 通用平台枚举（CPE）

CPE 提供了描述软件的标准化方法，主要用于漏洞映射：

```
CPE 格式：cpe:2.3:part:vendor:product:version:update:edition:language:sw_edition:target_sw:target_hw:other

示例：
cpe:2.3:a:expressjs:express:4.18.2:*:*:*:*:node.js:*:*
cpe:2.3:a:apache:log4j:2.17.0:*:*:*:*:*:*:*
cpe:2.3:o:linux:linux_kernel:5.15.0:*:*:*:*:*:*:*

Part 值：
- a = 应用程序
- o = 操作系统
- h = 硬件
```

### 依赖类型

理解依赖关系对于完整的 SBOM 生成至关重要：

```
依赖关系类型：

┌─────────────────────────────────────────────────────────────────┐
│                          你的应用程序                            │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  直接运行时依赖  │  │  直接开发依赖    │  │    可选依赖     │
│   (express)     │  │   (jest)        │  │  (compression)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│    传递依赖     │  ← 手动追踪经常遗漏
│  (body-parser)  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   深层传递依赖   │  ← 可能有很多层级
│    (bytes)      │
└─────────────────┘
```

```json
// package.json 示例展示依赖类型
{
  "name": "my-application",
  "dependencies": {
    "express": "^4.18.2",      // 运行时依赖
    "lodash": "^4.17.21"       // 运行时依赖
  },
  "devDependencies": {
    "jest": "^29.5.0",         // 仅开发环境
    "eslint": "^8.40.0"        // 仅开发环境
  },
  "optionalDependencies": {
    "fsevents": "^2.3.2"       // 可选（平台特定）
  },
  "peerDependencies": {
    "react": "^18.0.0"         // 对等依赖（用于库）
  }
}
```

## 核心要点

### NTIA 最小要素

美国国家电信和信息管理局（NTIA）定义了 SBOM 的最小要素：

```
NTIA SBOM 最小要素：

┌─────────────────────────────────────────────────────────────────┐
│                      数据字段（必需）                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 供应商名称         识别谁提供了该组件                       │
│  2. 组件名称           供应商使用的名称                         │
│  3. 组件版本           版本标识符                               │
│  4. 唯一标识符         唯一 ID（PURL、CPE、SWID 等）           │
│  5. 依赖关系           上游组件关系                             │
│  6. SBOM 作者          谁创建了这个 SBOM 文档                  │
│  7. 时间戳             SBOM 生成时间                           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        自动化支持                                │
├─────────────────────────────────────────────────────────────────┤
│  • 机器可读格式（JSON、XML、tag-value）                         │
│  • 从构建系统自动生成                                           │
│  • 安全工具自动消费                                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                       实践与流程                                 │
├─────────────────────────────────────────────────────────────────┤
│  • 每次新发布时生成                                             │
│  • 随软件交付一起分发                                           │
│  • 支持 SBOM 分发的访问控制                                    │
│  • 支持错误修正和更新                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### SBOM 生成工具

#### Syft - 多生态系统 SBOM 生成器

Syft 是最全面的 SBOM 生成工具之一，支持多种生态系统：

```bash
# 安装 Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# 从目录生成 SBOM
syft dir:./my-project -o spdx-json > sbom.spdx.json

# 从容器镜像生成 SBOM
syft myregistry.io/myapp:v1.0.0 -o cyclonedx-json > sbom.cdx.json

# 从 Dockerfile 生成 SBOM
syft docker:myapp:latest -o cyclonedx-json

# 多种输出格式
syft . -o spdx              # SPDX tag-value 格式
syft . -o spdx-json         # SPDX JSON 格式
syft . -o cyclonedx         # CycloneDX XML 格式
syft . -o cyclonedx-json    # CycloneDX JSON 格式
syft . -o table             # 人类可读的表格
syft . -o json              # Syft 原生 JSON 格式

# 同时生成多种输出
syft . -o spdx-json=sbom.spdx.json -o cyclonedx-json=sbom.cdx.json -o table
```

**Syft 配置文件：**

```yaml
# .syft.yaml
output:
  - "spdx-json=sbom.spdx.json"
  - "cyclonedx-json=sbom.cdx.json"

exclude:
  - "**/test/**"
  - "**/node_modules/.cache/**"
  - "**/.git/**"

catalogers:
  javascript:
    search:
      include-indexed-archives: true
      include-unindexed-archives: false
  python:
    guess-unpinned-requirements: true

file:
  metadata:
    digests:
      - sha256
      - sha1
    selection: owned-by-package
```

#### Trivy - 集成扫描与 SBOM 生成

Trivy 将漏洞扫描与 SBOM 生成结合在一起：

```bash
# 安装 Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# 生成 CycloneDX 格式的 SBOM
trivy fs --format cyclonedx --output sbom.cdx.json .

# 生成 SPDX 格式的 SBOM
trivy fs --format spdx-json --output sbom.spdx.json .

# 从容器镜像生成 SBOM
trivy image --format cyclonedx --output sbom.cdx.json myapp:latest

# 同时扫描和生成 SBOM
trivy fs --format table --output scan-results.txt \
  --sbom-output sbom.cdx.json \
  .
```

#### 特定语言工具

**Node.js - @cyclonedx/cyclonedx-npm：**

```bash
# 安装
npm install -g @cyclonedx/cyclonedx-npm

# 为 npm 项目生成 SBOM
cyclonedx-npm --output-file sbom.json --spec-version 1.5

# 包含开发依赖
cyclonedx-npm --include-dev --output-file sbom-full.json

# 仅生成生产依赖
cyclonedx-npm --omit dev --output-file sbom-prod.json
```

**Python - cyclonedx-py：**

```bash
# 安装
pip install cyclonedx-bom

# 从 requirements.txt 生成
cyclonedx-py requirements -o sbom.json requirements.txt

# 从 Poetry 项目生成
cyclonedx-py poetry -o sbom.json

# 从 Pipenv 项目生成
cyclonedx-py pipenv -o sbom.json

# 从环境生成
cyclonedx-py environment -o sbom.json
```

**Java/Maven：**

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.cyclonedx</groupId>
    <artifactId>cyclonedx-maven-plugin</artifactId>
    <version>2.7.9</version>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>makeAggregateBom</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <projectType>application</projectType>
        <schemaVersion>1.5</schemaVersion>
        <includeBomSerialNumber>true</includeBomSerialNumber>
        <includeCompileScope>true</includeCompileScope>
        <includeProvidedScope>true</includeProvidedScope>
        <includeRuntimeScope>true</includeRuntimeScope>
        <includeSystemScope>true</includeSystemScope>
        <includeTestScope>false</includeTestScope>
        <includeLicenseText>false</includeLicenseText>
        <outputFormat>json</outputFormat>
        <outputName>sbom</outputName>
    </configuration>
</plugin>
```

```bash
# 使用 Maven 生成 SBOM
mvn cyclonedx:makeAggregateBom
```

**Go：**

```bash
# 安装 cyclonedx-gomod
go install github.com/CycloneDX/cyclonedx-gomod/cmd/cyclonedx-gomod@latest

# 生成 SBOM
cyclonedx-gomod mod -json -output sbom.json

# 包含测试依赖
cyclonedx-gomod mod -json -test -output sbom-full.json
```

**.NET：**

```bash
# 安装 CycloneDX .NET 工具
dotnet tool install --global CycloneDX

# 为解决方案生成 SBOM
dotnet CycloneDX MySolution.sln -o sbom.json -j

# 为项目生成 SBOM
dotnet CycloneDX MyProject.csproj -o sbom.json -j
```

## 代码示例

### 在 CI/CD 中生成 SBOM

**GitHub Actions 工作流：**

```yaml
# .github/workflows/sbom.yml
name: SBOM 生成和漏洞扫描

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  release:
    types: [published]

jobs:
  generate-sbom:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      security-events: write

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 安装依赖
        run: npm ci

      - name: 使用 Syft 生成 SBOM
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom.cdx.json

      - name: 生成 SPDX SBOM
        uses: anchore/sbom-action@v0
        with:
          format: spdx-json
          output-file: sbom.spdx.json

      - name: 扫描 SBOM 漏洞
        uses: anchore/scan-action@v3
        with:
          sbom: sbom.cdx.json
          fail-build: true
          severity-cutoff: high
          output-format: sarif

      - name: 上传 SARIF 到 GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif

      - name: 上传 SBOM 产物
        uses: actions/upload-artifact@v4
        with:
          name: sbom-files
          path: |
            sbom.cdx.json
            sbom.spdx.json
          retention-days: 90

      - name: 将 SBOM 附加到发布
        if: github.event_name == 'release'
        uses: softprops/action-gh-release@v2
        with:
          files: |
            sbom.cdx.json
            sbom.spdx.json
```

**GitLab CI 流水线：**

```yaml
# .gitlab-ci.yml
stages:
  - build
  - sbom
  - scan
  - release

variables:
  SBOM_FILE: "sbom.cdx.json"

generate-sbom:
  stage: sbom
  image: anchore/syft:latest
  script:
    - syft dir:. -o cyclonedx-json > ${SBOM_FILE}
    - syft dir:. -o spdx-json > sbom.spdx.json
  artifacts:
    paths:
      - ${SBOM_FILE}
      - sbom.spdx.json
    expire_in: 1 year

vulnerability-scan:
  stage: scan
  image: aquasec/trivy:latest
  needs: [generate-sbom]
  script:
    - trivy sbom ${SBOM_FILE} --severity HIGH,CRITICAL --exit-code 1
  allow_failure: false
  artifacts:
    reports:
      container_scanning: trivy-report.json

attach-sbom-to-release:
  stage: release
  image: alpine:latest
  rules:
    - if: $CI_COMMIT_TAG
  needs: [generate-sbom, vulnerability-scan]
  script:
    - apk add --no-cache curl
    - |
      curl --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
           --upload-file ${SBOM_FILE} \
           "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/generic/sbom/${CI_COMMIT_TAG}/sbom.cdx.json"
```

### 程序化解析 SBOM

**Python SBOM 解析器：**

```python
#!/usr/bin/env python3
"""
SBOM 解析器和分析器
解析 CycloneDX 和 SPDX SBOM 文件并提取组件信息。
"""

import json
from dataclasses import dataclass
from typing import Optional
from pathlib import Path


@dataclass
class Component:
    """表示 SBOM 中的软件组件。"""
    name: str
    version: str
    purl: Optional[str] = None
    license: Optional[str] = None
    supplier: Optional[str] = None
    sha256: Optional[str] = None


class SBOMParser:
    """CycloneDX 和 SPDX SBOM 格式解析器。"""

    def __init__(self, sbom_path: str):
        self.sbom_path = Path(sbom_path)
        self.data = self._load_sbom()
        self.format = self._detect_format()

    def _load_sbom(self) -> dict:
        """从 JSON 文件加载 SBOM。"""
        with open(self.sbom_path, 'r') as f:
            return json.load(f)

    def _detect_format(self) -> str:
        """检测 SBOM 格式（CycloneDX 或 SPDX）。"""
        if 'bomFormat' in self.data:
            return 'cyclonedx'
        elif 'spdxVersion' in self.data:
            return 'spdx'
        else:
            raise ValueError("未知的 SBOM 格式")

    def get_components(self) -> list[Component]:
        """从 SBOM 提取所有组件。"""
        if self.format == 'cyclonedx':
            return self._parse_cyclonedx_components()
        else:
            return self._parse_spdx_components()

    def _parse_cyclonedx_components(self) -> list[Component]:
        """从 CycloneDX 格式解析组件。"""
        components = []
        for comp in self.data.get('components', []):
            license_info = None
            if comp.get('licenses'):
                license_obj = comp['licenses'][0].get('license', {})
                license_info = license_obj.get('id') or license_obj.get('name')

            sha256 = None
            for hash_obj in comp.get('hashes', []):
                if hash_obj.get('alg') == 'SHA-256':
                    sha256 = hash_obj.get('content')
                    break

            components.append(Component(
                name=comp.get('name'),
                version=comp.get('version'),
                purl=comp.get('purl'),
                license=license_info,
                supplier=comp.get('supplier', {}).get('name') if comp.get('supplier') else None,
                sha256=sha256
            ))
        return components

    def _parse_spdx_components(self) -> list[Component]:
        """从 SPDX 格式解析组件。"""
        components = []
        for pkg in self.data.get('packages', []):
            purl = None
            sha256 = None

            for ref in pkg.get('externalRefs', []):
                if ref.get('referenceType') == 'purl':
                    purl = ref.get('referenceLocator')
                    break

            for checksum in pkg.get('checksums', []):
                if checksum.get('algorithm') == 'SHA256':
                    sha256 = checksum.get('checksumValue')
                    break

            components.append(Component(
                name=pkg.get('name'),
                version=pkg.get('versionInfo'),
                purl=purl,
                license=pkg.get('licenseDeclared'),
                supplier=pkg.get('supplier'),
                sha256=sha256
            ))
        return components

    def find_component(self, name: str) -> list[Component]:
        """按名称查找组件（不区分大小写的部分匹配）。"""
        components = self.get_components()
        return [c for c in components if name.lower() in c.name.lower()]

    def get_licenses_summary(self) -> dict[str, int]:
        """获取使用的许可证摘要。"""
        licenses = {}
        for comp in self.get_components():
            license_name = comp.license or '未知'
            licenses[license_name] = licenses.get(license_name, 0) + 1
        return dict(sorted(licenses.items(), key=lambda x: x[1], reverse=True))

    def export_dependency_list(self, output_path: str):
        """导出用于文档的简单依赖列表。"""
        components = self.get_components()
        with open(output_path, 'w') as f:
            f.write("# 依赖列表\n\n")
            f.write("| 名称 | 版本 | 许可证 |\n")
            f.write("|------|------|--------|\n")
            for comp in sorted(components, key=lambda x: x.name.lower()):
                f.write(f"| {comp.name} | {comp.version} | {comp.license or 'N/A'} |\n")


# 使用示例
if __name__ == "__main__":
    parser = SBOMParser("sbom.cdx.json")

    print(f"SBOM 格式: {parser.format}")
    print(f"组件总数: {len(parser.get_components())}")

    print("\n许可证摘要:")
    for license_name, count in parser.get_licenses_summary().items():
        print(f"  {license_name}: {count}")

    print("\n搜索 'express':")
    for comp in parser.find_component("express"):
        print(f"  {comp.name}@{comp.version} ({comp.license})")

    parser.export_dependency_list("dependencies.md")
```

**TypeScript SBOM 分析器：**

```typescript
// sbom-analyzer.ts
import { readFileSync, writeFileSync } from 'fs';

interface CycloneDXComponent {
  type: string;
  'bom-ref': string;
  name: string;
  version: string;
  purl?: string;
  licenses?: Array<{ license: { id?: string; name?: string } }>;
  hashes?: Array<{ alg: string; content: string }>;
}

interface CycloneDXVulnerability {
  id: string;
  source: { name: string; url: string };
  ratings: Array<{
    score: number;
    severity: string;
    method: string;
  }>;
  affects: Array<{ ref: string }>;
  recommendation?: string;
}

interface CycloneDXSBOM {
  bomFormat: string;
  specVersion: string;
  components: CycloneDXComponent[];
  vulnerabilities?: CycloneDXVulnerability[];
  dependencies?: Array<{ ref: string; dependsOn: string[] }>;
}

interface AnalysisResult {
  totalComponents: number;
  licenseDistribution: Record<string, number>;
  vulnerabilitySummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  affectedComponents: string[];
}

class SBOMAnalyzer {
  private sbom: CycloneDXSBOM;

  constructor(sbomPath: string) {
    const content = readFileSync(sbomPath, 'utf-8');
    this.sbom = JSON.parse(content);
  }

  analyze(): AnalysisResult {
    return {
      totalComponents: this.sbom.components.length,
      licenseDistribution: this.getLicenseDistribution(),
      vulnerabilitySummary: this.getVulnerabilitySummary(),
      affectedComponents: this.getAffectedComponents(),
    };
  }

  private getLicenseDistribution(): Record<string, number> {
    const licenses: Record<string, number> = {};

    for (const comp of this.sbom.components) {
      const license = comp.licenses?.[0]?.license?.id ||
                     comp.licenses?.[0]?.license?.name ||
                     '未知';
      licenses[license] = (licenses[license] || 0) + 1;
    }

    return licenses;
  }

  private getVulnerabilitySummary() {
    const summary = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const vuln of this.sbom.vulnerabilities || []) {
      const severity = vuln.ratings[0]?.severity?.toLowerCase();
      if (severity && severity in summary) {
        summary[severity as keyof typeof summary]++;
      }
    }

    return summary;
  }

  private getAffectedComponents(): string[] {
    const affected = new Set<string>();

    for (const vuln of this.sbom.vulnerabilities || []) {
      for (const affect of vuln.affects) {
        affected.add(affect.ref);
      }
    }

    return Array.from(affected);
  }

  findComponent(name: string): CycloneDXComponent[] {
    return this.sbom.components.filter(c =>
      c.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  getDependencyTree(componentRef: string): string[] {
    const deps = this.sbom.dependencies?.find(d => d.ref === componentRef);
    return deps?.dependsOn || [];
  }

  exportReport(outputPath: string): void {
    const analysis = this.analyze();

    let report = '# SBOM 分析报告\n\n';
    report += `## 摘要\n\n`;
    report += `- 组件总数: ${analysis.totalComponents}\n`;
    report += `- 严重漏洞: ${analysis.vulnerabilitySummary.critical}\n`;
    report += `- 高危漏洞: ${analysis.vulnerabilitySummary.high}\n\n`;

    report += `## 许可证分布\n\n`;
    for (const [license, count] of Object.entries(analysis.licenseDistribution)) {
      report += `- ${license}: ${count}\n`;
    }

    if (analysis.affectedComponents.length > 0) {
      report += `\n## 受影响组件\n\n`;
      for (const comp of analysis.affectedComponents) {
        report += `- ${comp}\n`;
      }
    }

    writeFileSync(outputPath, report);
  }
}

// 使用
const analyzer = new SBOMAnalyzer('sbom.cdx.json');
const results = analyzer.analyze();
console.log('分析结果:', JSON.stringify(results, null, 2));
analyzer.exportReport('sbom-report.md');
```

### 使用 SBOM 进行漏洞扫描

**集成 Grype 进行漏洞扫描：**

```bash
#!/bin/bash
# scan-sbom.sh - SBOM 漏洞扫描脚本

set -euo pipefail

SBOM_FILE="${1:-sbom.cdx.json}"
OUTPUT_DIR="${2:-./security-reports}"
SEVERITY_THRESHOLD="${3:-high}"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

echo "扫描 SBOM: $SBOM_FILE"

# 如果未安装则安装 Grype
if ! command -v grype &> /dev/null; then
    echo "正在安装 Grype..."
    curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
fi

# 更新漏洞数据库
grype db update

# 运行漏洞扫描
echo "正在运行漏洞扫描..."
grype sbom:"$SBOM_FILE" \
    --output json \
    --file "$OUTPUT_DIR/vulnerabilities.json"

# 生成人类可读报告
grype sbom:"$SBOM_FILE" \
    --output table \
    --file "$OUTPUT_DIR/vulnerabilities.txt"

# 生成用于 CI/CD 集成的 SARIF
grype sbom:"$SBOM_FILE" \
    --output sarif \
    --file "$OUTPUT_DIR/vulnerabilities.sarif"

# 按严重性统计漏洞
echo "漏洞摘要:"
jq -r '.matches | group_by(.vulnerability.severity) | .[] | "\(.[0].vulnerability.severity): \(length)"' \
    "$OUTPUT_DIR/vulnerabilities.json"

# 检查严重/高危漏洞是否超过阈值
CRITICAL=$(jq '[.matches[] | select(.vulnerability.severity == "Critical")] | length' "$OUTPUT_DIR/vulnerabilities.json")
HIGH=$(jq '[.matches[] | select(.vulnerability.severity == "High")] | length' "$OUTPUT_DIR/vulnerabilities.json")

echo "严重: $CRITICAL, 高危: $HIGH"

if [[ "$SEVERITY_THRESHOLD" == "critical" && "$CRITICAL" -gt 0 ]]; then
    echo "错误: 发现严重漏洞!"
    exit 1
elif [[ "$SEVERITY_THRESHOLD" == "high" && ($CRITICAL -gt 0 || $HIGH -gt 0) ]]; then
    echo "错误: 发现高危或严重漏洞!"
    exit 1
fi

echo "扫描完成。报告已保存到 $OUTPUT_DIR"
```

**Python 漏洞关联：**

```python
#!/usr/bin/env python3
"""
将 SBOM 与多个来源的漏洞数据关联。
"""

import json
import requests
from dataclasses import dataclass
from typing import Optional


@dataclass
class VulnerabilityInfo:
    cve_id: str
    severity: str
    cvss_score: float
    description: str
    fixed_version: Optional[str]
    published_date: str


class VulnerabilityCorrelator:
    """将 SBOM 组件与漏洞数据库关联。"""

    OSV_API = "https://api.osv.dev/v1/query"

    def __init__(self, sbom_path: str):
        with open(sbom_path) as f:
            self.sbom = json.load(f)

    def query_osv(self, purl: str) -> list[dict]:
        """查询 OSV 数据库获取影响软件包的漏洞。"""
        try:
            response = requests.post(
                self.OSV_API,
                json={"package": {"purl": purl}},
                timeout=10
            )
            response.raise_for_status()
            return response.json().get('vulns', [])
        except requests.RequestException as e:
            print(f"查询 OSV 时出错 {purl}: {e}")
            return []

    def scan_components(self) -> dict[str, list[VulnerabilityInfo]]:
        """扫描所有 SBOM 组件的漏洞。"""
        results = {}

        for component in self.sbom.get('components', []):
            purl = component.get('purl')
            if not purl:
                continue

            comp_key = f"{component['name']}@{component['version']}"
            vulns = self.query_osv(purl)

            if vulns:
                results[comp_key] = []
                for vuln in vulns:
                    severity_info = vuln.get('severity', [{}])[0]
                    results[comp_key].append(VulnerabilityInfo(
                        cve_id=vuln.get('id', '未知'),
                        severity=severity_info.get('type', '未知'),
                        cvss_score=float(severity_info.get('score', 0)),
                        description=vuln.get('summary', ''),
                        fixed_version=self._extract_fixed_version(vuln),
                        published_date=vuln.get('published', '')
                    ))

        return results

    def _extract_fixed_version(self, vuln: dict) -> Optional[str]:
        """从漏洞数据提取修复版本。"""
        for affected in vuln.get('affected', []):
            for r in affected.get('ranges', []):
                for event in r.get('events', []):
                    if 'fixed' in event:
                        return event['fixed']
        return None

    def generate_report(self, output_path: str):
        """生成漏洞报告。"""
        results = self.scan_components()

        report = {
            'scan_date': '2026-01-20',
            'total_components': len(self.sbom.get('components', [])),
            'vulnerable_components': len(results),
            'vulnerabilities': []
        }

        for comp, vulns in results.items():
            for vuln in vulns:
                report['vulnerabilities'].append({
                    'component': comp,
                    'cve_id': vuln.cve_id,
                    'severity': vuln.severity,
                    'cvss_score': vuln.cvss_score,
                    'description': vuln.description,
                    'fixed_version': vuln.fixed_version
                })

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        return report


if __name__ == "__main__":
    correlator = VulnerabilityCorrelator("sbom.cdx.json")
    report = correlator.generate_report("vulnerability-report.json")

    print(f"扫描了 {report['total_components']} 个组件")
    print(f"发现 {report['vulnerable_components']} 个有漏洞的组件")
    print(f"漏洞总数: {len(report['vulnerabilities'])}")
```

## 最佳实践

### SBOM 生成策略

```
SBOM 生成最佳实践：

┌─────────────────────────────────────────────────────────────────┐
│                      何时生成 SBOM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 构建时（推荐）                                              │
│     • 在 CI/CD 流水线中生成                                    │
│     • 最准确的依赖信息                                         │
│     • 可以包含构建时依赖                                       │
│                                                                  │
│  2. 发布时                                                      │
│     • 附加到发布产物                                           │
│     • 版本特定的 SBOM                                          │
│     • 发布清单的一部分                                         │
│                                                                  │
│  3. 容器镜像构建                                                │
│     • 包含操作系统级别的依赖                                   │
│     • 捕获完整的运行时环境                                     │
│     • 与镜像一起签名 SBOM                                      │
│                                                                  │
│  4. 部署时                                                      │
│     • 验证 SBOM 与部署的产物匹配                              │
│     • 运行时环境验证                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**全面的 CI/CD SBOM 策略：**

```yaml
# .github/workflows/comprehensive-sbom.yml
name: 全面 SBOM 管理

on:
  push:
    branches: [main]
  pull_request:
  release:
    types: [published]

env:
  SBOM_VERSION: "1.0"

jobs:
  # 阶段 1：构建时生成 SBOM
  build-and-sbom:
    runs-on: ubuntu-latest
    outputs:
      sbom-hash: ${{ steps.sbom-hash.outputs.hash }}
    steps:
      - uses: actions/checkout@v4

      - name: 设置构建环境
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 构建应用
        run: npm run build

      - name: 生成源码 SBOM
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom-source.cdx.json
          artifact-name: sbom-source

      - name: 构建容器镜像
        run: |
          docker build -t myapp:${{ github.sha }} .

      - name: 生成容器 SBOM
        run: |
          syft myapp:${{ github.sha }} -o cyclonedx-json > sbom-container.cdx.json

      - name: 计算 SBOM 哈希
        id: sbom-hash
        run: |
          HASH=$(sha256sum sbom-source.cdx.json | cut -d' ' -f1)
          echo "hash=$HASH" >> $GITHUB_OUTPUT

      - name: 上传 SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom-artifacts
          path: |
            sbom-source.cdx.json
            sbom-container.cdx.json

  # 阶段 2：验证和扫描 SBOM
  validate-sbom:
    needs: build-and-sbom
    runs-on: ubuntu-latest
    steps:
      - name: 下载 SBOM
        uses: actions/download-artifact@v4
        with:
          name: sbom-artifacts

      - name: 验证 SBOM 格式
        run: |
          # 安装 sbom-utility 进行验证
          curl -sSfL https://raw.githubusercontent.com/CycloneDX/sbom-utility/main/install.sh | sh

          # 验证 CycloneDX 格式
          sbom-utility validate -i sbom-source.cdx.json
          sbom-utility validate -i sbom-container.cdx.json

      - name: 检查 NTIA 最小要素
        run: |
          # 检查必需的 NTIA 字段
          jq -e '.metadata.timestamp' sbom-source.cdx.json
          jq -e '.metadata.tools' sbom-source.cdx.json
          jq -e '.components | length > 0' sbom-source.cdx.json

      - name: 漏洞扫描
        uses: anchore/scan-action@v3
        with:
          sbom: sbom-source.cdx.json
          fail-build: true
          severity-cutoff: high

  # 阶段 3：许可证合规检查
  license-check:
    needs: build-and-sbom
    runs-on: ubuntu-latest
    steps:
      - name: 下载 SBOM
        uses: actions/download-artifact@v4
        with:
          name: sbom-artifacts

      - name: 检查许可证
        run: |
          # 提取并验证许可证
          DENIED_LICENSES=("GPL-3.0" "AGPL-3.0" "SSPL-1.0")

          LICENSES=$(jq -r '.components[].licenses[]?.license.id // empty' sbom-source.cdx.json | sort -u)

          for license in $LICENSES; do
            for denied in "${DENIED_LICENSES[@]}"; do
              if [[ "$license" == "$denied" ]]; then
                echo "不允许的许可证: $license"
                exit 1
              fi
            done
          done

          echo "所有许可证已批准"

  # 阶段 4：存储和分发 SBOM
  store-sbom:
    needs: [validate-sbom, license-check]
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    steps:
      - name: 下载 SBOM
        uses: actions/download-artifact@v4
        with:
          name: sbom-artifacts

      - name: 使用 Cosign 签名 SBOM
        run: |
          # 安装 cosign
          curl -sSfL https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64 -o /usr/local/bin/cosign
          chmod +x /usr/local/bin/cosign

          # 签名 SBOM（使用 OIDC 的无密钥签名）
          cosign sign-blob --yes sbom-source.cdx.json > sbom-source.sig
          cosign sign-blob --yes sbom-container.cdx.json > sbom-container.sig

      - name: 附加到发布
        uses: softprops/action-gh-release@v2
        with:
          files: |
            sbom-source.cdx.json
            sbom-source.sig
            sbom-container.cdx.json
            sbom-container.sig

      - name: 存储到 SBOM 仓库
        run: |
          # 推送到专用 SBOM 存储（如 OCI 注册表）
          oras push ghcr.io/${{ github.repository }}/sbom:${{ github.ref_name }} \
            sbom-source.cdx.json:application/vnd.cyclonedx+json \
            sbom-container.cdx.json:application/vnd.cyclonedx+json
```

### SBOM 存储与分发

```
SBOM 分发策略：

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. 与发布产物一起                                              │
│     ├── myapp-v1.0.0.tar.gz                                    │
│     ├── myapp-v1.0.0.sbom.json                                 │
│     └── myapp-v1.0.0.sbom.sig                                  │
│                                                                  │
│  2. OCI 注册表（推荐用于容器）                                  │
│     └── ghcr.io/org/myapp:v1.0.0                               │
│         ├── 应用镜像                                           │
│         ├── sbom（证明）                                       │
│         └── 签名                                               │
│                                                                  │
│  3. 专用 SBOM 仓库                                              │
│     └── sbom.example.com/                                      │
│         ├── products/                                          │
│         │   └── myapp/                                         │
│         │       ├── v1.0.0/sbom.json                          │
│         │       └── v1.1.0/sbom.json                          │
│         └── index.json                                         │
│                                                                  │
│  4. 包注册表元数据                                              │
│     └── npmjs.com/package/myapp                                │
│         └── provenance（包含 SBOM 引用）                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 持续 SBOM 更新

```yaml
# .github/workflows/sbom-refresh.yml
name: SBOM 刷新和监控

on:
  schedule:
    # 每日漏洞检查
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  refresh-vulnerability-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 下载最新 SBOM
        run: |
          # 从最新发布获取 SBOM
          gh release download --pattern '*.sbom.json' --dir ./sbom
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: 使用更新的漏洞数据库扫描
        run: |
          # 更新 Grype 数据库
          grype db update

          # 扫描 SBOM
          grype sbom:./sbom/*.sbom.json -o json > new-vulnerabilities.json

      - name: 与之前的扫描比较
        id: compare
        run: |
          # 下载之前的扫描结果
          gh run download --name vuln-scan-results --dir ./previous || echo "无之前的结果"

          # 比较并识别新漏洞
          if [ -f ./previous/vulnerabilities.json ]; then
            NEW_VULNS=$(jq -s '.[0].matches - .[1].matches | length' \
              new-vulnerabilities.json ./previous/vulnerabilities.json)
            echo "new_vulnerabilities=$NEW_VULNS" >> $GITHUB_OUTPUT
          else
            NEW_VULNS=$(jq '.matches | length' new-vulnerabilities.json)
            echo "new_vulnerabilities=$NEW_VULNS" >> $GITHUB_OUTPUT
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: 为新漏洞创建 Issue
        if: steps.compare.outputs.new_vulnerabilities > 0
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const vulns = JSON.parse(fs.readFileSync('new-vulnerabilities.json'));

            const critical = vulns.matches.filter(m => m.vulnerability.severity === 'Critical');
            const high = vulns.matches.filter(m => m.vulnerability.severity === 'High');

            if (critical.length > 0 || high.length > 0) {
              await github.rest.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title: `[安全] 检测到依赖中的新漏洞`,
                body: `## 发现新漏洞\n\n` +
                      `- 严重: ${critical.length}\n` +
                      `- 高危: ${high.length}\n\n` +
                      `请审查并更新受影响的依赖。`,
                labels: ['security', 'dependencies']
              });
            }

      - name: 上传扫描结果
        uses: actions/upload-artifact@v4
        with:
          name: vuln-scan-results
          path: new-vulnerabilities.json
```

## 常见陷阱

### 不完整的依赖

```
常见 SBOM 完整性问题：

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  问题 1：遗漏传递依赖                                           │
│  ────────────────────                                           │
│  原因：工具只捕获直接依赖                                       │
│  影响：有漏洞的传递依赖未被检测                                 │
│  解决方案：使用能解析完整依赖树的工具                           │
│                                                                  │
│  问题 2：开发依赖包含/排除问题                                  │
│  ──────────────────────────                                     │
│  原因：生产和开发依赖分离不清                                   │
│  影响：误报或遗漏漏洞                                           │
│  解决方案：为不同范围生成单独的 SBOM                           │
│                                                                  │
│  问题 3：原生/系统依赖                                          │
│  ────────────────────                                           │
│  原因：包管理器不追踪操作系统级别的依赖                         │
│  影响：libc、OpenSSL 漏洞被遗漏                                │
│  解决方案：容器级别的 SBOM 生成                                │
│                                                                  │
│  问题 4：内嵌依赖                                               │
│  ────────────────                                               │
│  原因：复制的源代码不在包清单中                                 │
│  影响：捆绑的有漏洞代码未被检测                                 │
│  解决方案：源代码分析 + 清单扫描                               │
│                                                                  │
│  问题 5：动态依赖                                               │
│  ────────────────                                               │
│  原因：运行时加载的依赖                                         │
│  影响：运行时依赖不在构建时 SBOM 中                            │
│  解决方案：运行时 SBOM 生成 + 静态分析                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**检测不完整的 SBOM：**

```python
#!/usr/bin/env python3
"""
SBOM 完整性检查器
根据已知依赖源验证 SBOM。
"""

import json
import subprocess
from pathlib import Path


class SBOMCompletenessChecker:
    """根据包清单检查 SBOM 完整性。"""

    def __init__(self, sbom_path: str, project_path: str = "."):
        with open(sbom_path) as f:
            self.sbom = json.load(f)
        self.project_path = Path(project_path)

    def get_sbom_packages(self) -> set[str]:
        """从 SBOM 提取包名。"""
        packages = set()
        for comp in self.sbom.get('components', []):
            packages.add(f"{comp['name']}@{comp['version']}")
        return packages

    def get_npm_packages(self) -> set[str]:
        """从 package-lock.json 获取包。"""
        lock_path = self.project_path / "package-lock.json"
        if not lock_path.exists():
            return set()

        with open(lock_path) as f:
            lock = json.load(f)

        packages = set()
        for name, info in lock.get('packages', {}).items():
            if name and 'version' in info:
                pkg_name = name.replace('node_modules/', '')
                packages.add(f"{pkg_name}@{info['version']}")

        return packages

    def get_pip_packages(self) -> set[str]:
        """从 pip freeze 获取包。"""
        try:
            result = subprocess.run(
                ['pip', 'freeze'],
                capture_output=True,
                text=True,
                cwd=self.project_path
            )
            packages = set()
            for line in result.stdout.strip().split('\n'):
                if '==' in line:
                    name, version = line.split('==')
                    packages.add(f"{name.lower()}@{version}")
            return packages
        except Exception:
            return set()

    def check_completeness(self) -> dict:
        """根据所有来源检查 SBOM 完整性。"""
        sbom_packages = self.get_sbom_packages()

        results = {
            'sbom_count': len(sbom_packages),
            'missing': [],
            'sources_checked': []
        }

        # 检查 npm
        npm_packages = self.get_npm_packages()
        if npm_packages:
            results['sources_checked'].append('npm')
            missing_npm = npm_packages - sbom_packages
            results['missing'].extend([f"npm: {p}" for p in missing_npm])

        # 检查 pip
        pip_packages = self.get_pip_packages()
        if pip_packages:
            results['sources_checked'].append('pip')
            missing_pip = pip_packages - sbom_packages
            results['missing'].extend([f"pip: {p}" for p in missing_pip])

        results['completeness_score'] = (
            (results['sbom_count'] /
             (results['sbom_count'] + len(results['missing']))) * 100
            if results['sbom_count'] + len(results['missing']) > 0
            else 100
        )

        return results


if __name__ == "__main__":
    checker = SBOMCompletenessChecker("sbom.cdx.json", ".")
    results = checker.check_completeness()

    print(f"SBOM 完整性: {results['completeness_score']:.1f}%")
    print(f"SBOM 中的包数: {results['sbom_count']}")
    print(f"检查的来源: {', '.join(results['sources_checked'])}")

    if results['missing']:
        print(f"\n缺失的包 ({len(results['missing'])}):")
        for pkg in results['missing'][:10]:
            print(f"  - {pkg}")
        if len(results['missing']) > 10:
            print(f"  ... 还有 {len(results['missing']) - 10} 个")
```

### 格式选择错误

| 场景 | 推荐格式 | 原因 |
|------|----------|------|
| 安全扫描为主 | CycloneDX | 原生漏洞支持 |
| 许可证合规 | SPDX | 详尽的许可证元数据 |
| 政府/监管要求 | SPDX | ISO 标准认可 |
| 容器安全 | CycloneDX | 更好的容器支持 |
| 多格式需求 | 同时生成两种 | 使用支持多输出的工具 |

### SBOM 数据过期

```yaml
# 通过自动检查防止 SBOM 过期
name: SBOM 新鲜度检查

on:
  pull_request:
    paths:
      - 'package*.json'
      - 'requirements*.txt'
      - 'go.mod'
      - 'Cargo.toml'
      - 'pom.xml'

jobs:
  check-sbom-freshness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 检查 SBOM 是否需要重新生成
        run: |
          # 获取最后 SBOM 生成时间
          SBOM_TIME=$(jq -r '.metadata.timestamp' sbom.cdx.json 2>/dev/null || echo "1970-01-01T00:00:00Z")

          # 获取最后依赖文件修改时间
          DEP_FILES=$(find . -name "package*.json" -o -name "requirements*.txt" -o -name "go.mod" | head -1)
          DEP_TIME=$(stat -c %Y "$DEP_FILES" 2>/dev/null || echo "0")

          # 比较时间戳
          SBOM_EPOCH=$(date -d "$SBOM_TIME" +%s 2>/dev/null || echo "0")

          if [ "$DEP_TIME" -gt "$SBOM_EPOCH" ]; then
            echo "警告: SBOM 已过期！依赖在最后 SBOM 生成后被修改。"
            echo "请在合并前重新生成 SBOM。"
            exit 1
          fi
```

## 性能考量

### 生成时间优化

```bash
#!/bin/bash
# optimized-sbom-generation.sh
# 更快 SBOM 生成的技术

# 1. 对 monorepo 并行生成
find . -name "package.json" -not -path "*/node_modules/*" | \
  parallel -j4 'cd $(dirname {}) && syft dir:. -o cyclonedx-json > sbom.cdx.json'

# 2. 使用缓存的增量生成
CACHE_DIR="${HOME}/.cache/syft"
mkdir -p "$CACHE_DIR"

syft dir:. \
  -o cyclonedx-json \
  --cache-dir "$CACHE_DIR" \
  > sbom.cdx.json

# 3. 排除不必要的路径
syft dir:. \
  -o cyclonedx-json \
  --exclude '**/test/**' \
  --exclude '**/docs/**' \
  --exclude '**/.git/**' \
  --exclude '**/node_modules/.cache/**' \
  > sbom.cdx.json

# 4. 对已知项目类型使用特定的分类器
syft dir:. \
  -o cyclonedx-json \
  --select-catalogers javascript \
  > sbom.cdx.json
```

### 大规模 SBOM 管理

```python
#!/usr/bin/env python3
"""
企业级 SBOM 管理系统
处理大规模 SBOM 存储、查询和分析。
"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional


class SBOMDatabase:
    """基于 SQLite 的企业级 SBOM 存储。"""

    def __init__(self, db_path: str = "sbom_inventory.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_schema()

    def _init_schema(self):
        """初始化数据库架构。"""
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                sbom_format TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, version)
            );

            CREATE TABLE IF NOT EXISTS components (
                id INTEGER PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                purl TEXT,
                license TEXT,
                supplier TEXT
            );

            CREATE TABLE IF NOT EXISTS vulnerabilities (
                id INTEGER PRIMARY KEY,
                component_id INTEGER REFERENCES components(id),
                cve_id TEXT NOT NULL,
                severity TEXT,
                cvss_score REAL,
                fixed_version TEXT,
                discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
            CREATE INDEX IF NOT EXISTS idx_components_purl ON components(purl);
            CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cve ON vulnerabilities(cve_id);
        """)
        self.conn.commit()

    def import_sbom(self, sbom_path: str, product_name: str, product_version: str):
        """将 SBOM 导入数据库。"""
        with open(sbom_path) as f:
            sbom = json.load(f)

        # 确定格式
        sbom_format = 'cyclonedx' if 'bomFormat' in sbom else 'spdx'

        # 插入产品
        cursor = self.conn.execute(
            "INSERT OR REPLACE INTO products (name, version, sbom_format) VALUES (?, ?, ?)",
            (product_name, product_version, sbom_format)
        )
        product_id = cursor.lastrowid

        # 插入组件
        components = sbom.get('components', []) if sbom_format == 'cyclonedx' else sbom.get('packages', [])

        for comp in components:
            if sbom_format == 'cyclonedx':
                license_info = comp.get('licenses', [{}])[0].get('license', {}).get('id')
                self.conn.execute(
                    "INSERT INTO components (product_id, name, version, purl, license, supplier) VALUES (?, ?, ?, ?, ?, ?)",
                    (product_id, comp.get('name'), comp.get('version'),
                     comp.get('purl'), license_info, comp.get('supplier', {}).get('name'))
                )
            else:
                self.conn.execute(
                    "INSERT INTO components (product_id, name, version, license, supplier) VALUES (?, ?, ?, ?, ?)",
                    (product_id, comp.get('name'), comp.get('versionInfo'),
                     comp.get('licenseDeclared'), comp.get('supplier'))
                )

        self.conn.commit()

    def find_affected_products(self, component_name: str, vulnerable_versions: list[str]) -> list[dict]:
        """查找所有使用有漏洞组件的产品。"""
        placeholders = ','.join(['?' for _ in vulnerable_versions])
        cursor = self.conn.execute(f"""
            SELECT DISTINCT p.name, p.version, c.version as component_version
            FROM products p
            JOIN components c ON p.id = c.product_id
            WHERE c.name = ? AND c.version IN ({placeholders})
        """, [component_name] + vulnerable_versions)

        return [
            {'product': row[0], 'product_version': row[1], 'component_version': row[2]}
            for row in cursor.fetchall()
        ]

    def get_license_report(self) -> dict:
        """生成组织范围的许可证报告。"""
        cursor = self.conn.execute("""
            SELECT license, COUNT(*) as count, COUNT(DISTINCT product_id) as products
            FROM components
            WHERE license IS NOT NULL
            GROUP BY license
            ORDER BY count DESC
        """)

        return {
            row[0]: {'usage_count': row[1], 'products_affected': row[2]}
            for row in cursor.fetchall()
        }

    def export_inventory(self, output_path: str):
        """导出完整的组件清单。"""
        cursor = self.conn.execute("""
            SELECT p.name, p.version, c.name, c.version, c.license, c.purl
            FROM products p
            JOIN components c ON p.id = c.product_id
            ORDER BY p.name, c.name
        """)

        inventory = []
        for row in cursor.fetchall():
            inventory.append({
                'product': row[0],
                'product_version': row[1],
                'component': row[2],
                'component_version': row[3],
                'license': row[4],
                'purl': row[5]
            })

        with open(output_path, 'w') as f:
            json.dump(inventory, f, indent=2, ensure_ascii=False)


# 使用
if __name__ == "__main__":
    db = SBOMDatabase()

    # 导入 SBOM
    db.import_sbom("webapp-sbom.cdx.json", "webapp", "1.0.0")
    db.import_sbom("api-sbom.cdx.json", "api-service", "2.1.0")

    # 查找受 Log4j 漏洞影响的产品
    affected = db.find_affected_products("log4j-core", ["2.14.0", "2.14.1", "2.15.0"])
    print(f"受 Log4j 影响的产品: {len(affected)}")

    # 许可证报告
    licenses = db.get_license_report()
    print("\n许可证使用:")
    for license_name, stats in list(licenses.items())[:5]:
        print(f"  {license_name}: {stats['usage_count']} 个组件在 {stats['products_affected']} 个产品中")
```

## 实战场景

### CI/CD 集成

**带 SBOM 的完整流水线：**

```yaml
# .github/workflows/complete-pipeline.yml
name: 带 SBOM 的完整 CI/CD

on:
  push:
    branches: [main]
  pull_request:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4

      - name: 设置 Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 构建和推送
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name == 'release' }}
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  sbom:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 生成源码 SBOM
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom-source.json

      - name: 生成容器 SBOM
        if: github.event_name == 'release'
        run: |
          syft ghcr.io/${{ github.repository }}:${{ github.sha }} \
            -o cyclonedx-json > sbom-container.json

      - name: 将 SBOM 证明附加到镜像
        if: github.event_name == 'release'
        run: |
          cosign attest --predicate sbom-container.json \
            --type cyclonedx \
            ghcr.io/${{ github.repository }}:${{ github.sha }}

      - uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom-*.json

  security-scan:
    needs: sbom
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: sbom

      - name: 漏洞扫描
        uses: anchore/scan-action@v3
        with:
          sbom: sbom-source.json
          fail-build: true
          severity-cutoff: high

      - name: 许可证合规
        run: |
          # 检查不允许的许可证
          DISALLOWED=("GPL-3.0" "AGPL-3.0")
          LICENSES=$(jq -r '.components[].licenses[]?.license.id // empty' sbom-source.json)

          for license in $LICENSES; do
            for disallowed in "${DISALLOWED[@]}"; do
              if [[ "$license" == "$disallowed" ]]; then
                echo "不允许的许可证: $license"
                exit 1
              fi
            done
          done

  deploy:
    needs: [build, security-scan]
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: 验证镜像证明
        run: |
          cosign verify-attestation \
            --type cyclonedx \
            ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: 部署到生产
        run: |
          # Kubernetes 部署
          kubectl set image deployment/myapp \
            myapp=ghcr.io/${{ github.repository }}:${{ github.sha }}
```

### 漏洞响应工作流

```python
#!/usr/bin/env python3
"""
自动化漏洞响应系统
使用 SBOM 快速识别和响应新漏洞。
"""

import json
import requests
from datetime import datetime
from pathlib import Path


class VulnerabilityResponseSystem:
    """使用 SBOM 的自动化漏洞响应。"""

    def __init__(self, sbom_inventory_path: str):
        self.inventory_path = Path(sbom_inventory_path)
        self.sboms = self._load_inventory()

    def _load_inventory(self) -> dict:
        """从清单加载所有 SBOM。"""
        sboms = {}
        for sbom_file in self.inventory_path.glob("**/*.cdx.json"):
            with open(sbom_file) as f:
                sbom = json.load(f)
                product = sbom.get('metadata', {}).get('component', {}).get('name', sbom_file.stem)
                sboms[product] = sbom
        return sboms

    def find_affected_systems(self, cve_id: str) -> list[dict]:
        """查找所有受 CVE 影响的系统。"""
        # 查询 OSV 获取受影响的包
        affected_packages = self._get_affected_packages(cve_id)

        results = []
        for product, sbom in self.sboms.items():
            for component in sbom.get('components', []):
                purl = component.get('purl', '')
                for affected in affected_packages:
                    if self._is_affected(component, affected):
                        results.append({
                            'product': product,
                            'component': component['name'],
                            'version': component['version'],
                            'purl': purl,
                            'fixed_version': affected.get('fixed_version')
                        })

        return results

    def _get_affected_packages(self, cve_id: str) -> list[dict]:
        """查询漏洞数据库获取受影响的包。"""
        try:
            response = requests.get(
                f"https://api.osv.dev/v1/vulns/{cve_id}",
                timeout=10
            )
            if response.status_code == 200:
                vuln = response.json()
                affected = []
                for pkg in vuln.get('affected', []):
                    affected.append({
                        'ecosystem': pkg.get('package', {}).get('ecosystem'),
                        'name': pkg.get('package', {}).get('name'),
                        'versions': [r.get('events', [{}])[-1].get('introduced', '*')
                                    for r in pkg.get('ranges', [])],
                        'fixed_version': self._extract_fixed(pkg)
                    })
                return affected
        except Exception as e:
            print(f"查询 OSV 时出错: {e}")
        return []

    def _extract_fixed(self, affected_pkg: dict) -> str:
        """从受影响包信息提取修复版本。"""
        for r in affected_pkg.get('ranges', []):
            for event in r.get('events', []):
                if 'fixed' in event:
                    return event['fixed']
        return None

    def _is_affected(self, component: dict, affected: dict) -> bool:
        """检查组件是否匹配受影响的包。"""
        return (
            component['name'].lower() == affected['name'].lower() and
            component['version'] in affected.get('versions', ['*'])
        )

    def generate_response_plan(self, cve_id: str) -> dict:
        """为 CVE 生成事件响应计划。"""
        affected = self.find_affected_systems(cve_id)

        return {
            'cve_id': cve_id,
            'timestamp': datetime.utcnow().isoformat(),
            'affected_count': len(affected),
            'affected_systems': affected,
            'remediation_steps': [
                {
                    'product': a['product'],
                    'action': f"将 {a['component']} 从 {a['version']} 更新到 {a['fixed_version']}"
                }
                for a in affected if a['fixed_version']
            ],
            'priority': 'critical' if len(affected) > 5 else 'high' if len(affected) > 0 else 'low'
        }


# 使用
if __name__ == "__main__":
    system = VulnerabilityResponseSystem("./sbom-inventory")

    # 模拟 Log4Shell 响应
    response_plan = system.generate_response_plan("CVE-2021-44228")

    print(f"CVE: {response_plan['cve_id']}")
    print(f"优先级: {response_plan['priority']}")
    print(f"受影响系统: {response_plan['affected_count']}")

    for step in response_plan['remediation_steps']:
        print(f"  - {step['product']}: {step['action']}")
```

### 合规审计

```python
#!/usr/bin/env python3
"""
SBOM 合规审计器
根据监管要求（NTIA、EO 14028）验证 SBOM。
"""

import json
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class ComplianceResult:
    requirement: str
    status: str  # "pass", "fail", "warning"
    details: str


class SBOMComplianceAuditor:
    """根据合规要求审计 SBOM。"""

    NTIA_MINIMUM_FIELDS = [
        'supplier_name',
        'component_name',
        'component_version',
        'unique_identifier',
        'dependency_relationship',
        'sbom_author',
        'timestamp'
    ]

    def __init__(self, sbom_path: str):
        with open(sbom_path) as f:
            self.sbom = json.load(f)
        self.format = 'cyclonedx' if 'bomFormat' in self.sbom else 'spdx'

    def audit_ntia_compliance(self) -> list[ComplianceResult]:
        """检查 NTIA 最小要素合规性。"""
        results = []

        # 检查时间戳
        timestamp = self._get_timestamp()
        results.append(ComplianceResult(
            requirement="SBOM 时间戳",
            status="pass" if timestamp else "fail",
            details=f"时间戳: {timestamp}" if timestamp else "缺少时间戳"
        ))

        # 检查作者/工具信息
        author = self._get_author()
        results.append(ComplianceResult(
            requirement="SBOM 作者",
            status="pass" if author else "fail",
            details=f"作者: {author}" if author else "缺少作者信息"
        ))

        # 检查组件是否有必需字段
        components = self._get_components()
        missing_names = [c for c in components if not c.get('name')]
        missing_versions = [c for c in components if not c.get('version')]
        missing_ids = [c for c in components if not self._has_unique_id(c)]

        results.append(ComplianceResult(
            requirement="组件名称",
            status="pass" if not missing_names else "fail",
            details=f"所有 {len(components)} 个组件都有名称" if not missing_names
                    else f"{len(missing_names)} 个组件缺少名称"
        ))

        results.append(ComplianceResult(
            requirement="组件版本",
            status="pass" if not missing_versions else "fail",
            details=f"所有 {len(components)} 个组件都有版本" if not missing_versions
                    else f"{len(missing_versions)} 个组件缺少版本"
        ))

        results.append(ComplianceResult(
            requirement="唯一标识符",
            status="pass" if not missing_ids else "warning",
            details=f"所有组件都有 PURL/CPE" if not missing_ids
                    else f"{len(missing_ids)} 个组件缺少唯一标识符"
        ))

        # 检查依赖关系
        has_deps = self._has_dependency_info()
        results.append(ComplianceResult(
            requirement="依赖关系",
            status="pass" if has_deps else "warning",
            details="存在依赖关系信息" if has_deps
                    else "无依赖关系信息"
        ))

        return results

    def _get_timestamp(self) -> Optional[str]:
        if self.format == 'cyclonedx':
            return self.sbom.get('metadata', {}).get('timestamp')
        else:
            return self.sbom.get('creationInfo', {}).get('created')

    def _get_author(self) -> Optional[str]:
        if self.format == 'cyclonedx':
            tools = self.sbom.get('metadata', {}).get('tools', {})
            if isinstance(tools, dict):
                components = tools.get('components', [])
                if components:
                    return components[0].get('name')
            elif isinstance(tools, list) and tools:
                return tools[0].get('name')
        else:
            creators = self.sbom.get('creationInfo', {}).get('creators', [])
            return creators[0] if creators else None
        return None

    def _get_components(self) -> list:
        if self.format == 'cyclonedx':
            return self.sbom.get('components', [])
        else:
            return self.sbom.get('packages', [])

    def _has_unique_id(self, component: dict) -> bool:
        if self.format == 'cyclonedx':
            return bool(component.get('purl') or component.get('cpe'))
        else:
            refs = component.get('externalRefs', [])
            return any(r.get('referenceType') in ['purl', 'cpe23Type'] for r in refs)

    def _has_dependency_info(self) -> bool:
        if self.format == 'cyclonedx':
            return bool(self.sbom.get('dependencies'))
        else:
            return bool(self.sbom.get('relationships'))

    def generate_report(self) -> dict:
        """生成合规审计报告。"""
        results = self.audit_ntia_compliance()

        return {
            'audit_date': datetime.utcnow().isoformat(),
            'sbom_format': self.format,
            'overall_status': '合规' if all(r.status == 'pass' for r in results) else '不合规',
            'results': [
                {
                    'requirement': r.requirement,
                    'status': r.status,
                    'details': r.details
                }
                for r in results
            ],
            'summary': {
                'passed': len([r for r in results if r.status == 'pass']),
                'failed': len([r for r in results if r.status == 'fail']),
                'warnings': len([r for r in results if r.status == 'warning'])
            }
        }


if __name__ == "__main__":
    auditor = SBOMComplianceAuditor("sbom.cdx.json")
    report = auditor.generate_report()

    print(f"SBOM 合规审计报告")
    print(f"==================")
    print(f"格式: {report['sbom_format']}")
    print(f"总体状态: {report['overall_status'].upper()}")
    print(f"\n结果:")

    for result in report['results']:
        status_icon = {"pass": "[OK]", "fail": "[X]", "warning": "[!]"}[result['status']]
        print(f"  {status_icon} {result['requirement']}: {result['details']}")

    print(f"\n摘要: {report['summary']['passed']} 通过, "
          f"{report['summary']['failed']} 失败, "
          f"{report['summary']['warnings']} 警告")
```

## 面试要点

### 概念问题

**Q1：什么是 SBOM？为什么它对现代软件安全至关重要？**

```
要点：

1. 定义：
   - 软件物料清单 - 软件组件的完整清单
   - 机器可读格式，列出依赖、版本、许可证
   - 类似于食品中的成分表或制造业中的零件清单

2. 安全重要性：
   - 快速漏洞识别（Log4Shell 让许多组织花了数周时间）
   - 供应链攻击检测和响应
   - 传递依赖可见性

3. 合规要求：
   - 美国第 14028 号行政命令要求联邦软件提供 SBOM
   - 欧盟网络弹性法案要求
   - 行业标准（PCI-DSS、HIPAA 考虑因素）

4. 商业价值：
   - 减少漏洞的平均响应时间（MTTR）
   - 许可证合规和法律风险管理
   - 供应商风险评估
```

**Q2：比较 SPDX 和 CycloneDX 格式。何时选择其中一个？**

```
回答框架：

SPDX：
- 由 Linux 基金会创建
- ISO/IEC 5962:2021 国际标准
- 重点关注许可证合规
- 详尽的文件级元数据
- 最适合：许可证审计、监管合规、法律要求

CycloneDX：
- OWASP 项目
- 安全优先设计
- 原生漏洞跟踪支持
- 服务和硬件 BOM 能力
- 最适合：安全扫描、漏洞管理、DevSecOps

决策因素：
- 主要用例（安全与许可证合规）
- 工具生态系统兼容性
- 行业/监管要求
- 现有组织标准

建议：
- 许多组织同时生成两种格式
- 安全工作流使用 CycloneDX
- 法律/合规工作流使用 SPDX
```

**Q3：如何使用 SBOM 响应像 Log4Shell 这样的零日漏洞？**

```
响应计划：

阶段 1：识别（0-30 分钟）
- 查询 SBOM 数据库中受影响的组件（log4j-core）
- 识别所有产品中存在的所有版本
- 列出直接受影响与传递受影响的系统

阶段 2：评估（30-60 分钟）
- 确定哪些系统面向互联网
- 根据使用模式评估可利用性
- 按业务关键性优先排序

阶段 3：遏制（1-4 小时）
- 应用 WAF 规则阻止攻击模式
- 如果可能禁用受影响的功能
- 必要时隔离关键系统

阶段 4：修复（4-24 小时）
- 测试更新的依赖版本
- 分阶段部署到非生产环境
- 带监控部署修复

阶段 5：验证（24-48 小时）
- 确认所有受影响的系统已更新
- 重新生成 SBOM 验证修复
- 记录经验教训

关键成功因素：
- 预先存在的 SBOM 覆盖
- 自动化漏洞关联
- 清晰的所有权和升级路径
```

### 技术问题

**Q4：为拥有 50+ 服务的微服务架构设计 SBOM 生成策略。**

```
架构方法：

1. 集中式 SBOM 生成：
   - 标准化 CI/CD 模板
   - 一致的工具（Syft/Trivy）
   - 统一的输出格式

2. 多层 SBOM：
   - 应用级别（npm、pip 等）
   - 容器级别（操作系统包）
   - 基础设施级别（IaC 组件）

3. 存储策略：
   - 容器 SBOM 使用 OCI 注册表（证明）
   - 集中式 SBOM 数据库用于查询
   - 版本关联存储

4. 聚合：
   - 服务网格 SBOM 组合所有服务
   - 产品级 SBOM 用于发布
   - 组织范围的清单

5. 自动化：
   - 每次构建时生成
   - 每晚漏洞重新扫描
   - 自动化新鲜度监控

实现：
```yaml
# 共享工作流模板
name: 服务 SBOM
on:
  push:
    branches: [main]
jobs:
  sbom:
    uses: org/workflows/.github/workflows/sbom-template.yml@main
    with:
      service-name: ${{ github.event.repository.name }}
      sbom-format: cyclonedx-json
    secrets: inherit
```
```

**Q5：如何在 SBOM 中处理传递依赖和内嵌代码？**

```
传递依赖：

1. 工具选择：
   - 使用能解析完整依赖树的工具
   - Syft、Trivy 捕获传递依赖
   - 语言特定工具（npm、pip）也能解析

2. 验证：
   - 将 SBOM 与锁文件比较
   - 检查组件数量是否符合预期
   - 审计已知的问题模式

内嵌代码：

1. 检测方法：
   - 源代码扫描（不仅仅是清单）
   - 基于哈希的识别
   - 许可证文件检测

2. 工具配置：
   ```yaml
   # syft 内嵌代码配置
   catalogers:
     go:
       search:
         include-indexed-archives: true
     javascript:
       search:
         include-indexed-archives: true
   ```

3. 手动跟踪：
   - 记录内嵌的依赖
   - 包含在自定义 SBOM 条目中
   - 定期审计 vendor 目录

最佳实践：
- 尽可能减少内嵌
- 自动化内嵌代码检测
- 将内嵌依赖包含在安全扫描中
```

### 实践场景问题

**Q6：你的 SBOM 扫描显示 200 个漏洞。如何确定修复优先级？**

```
优先级框架：

1. 严重性 + 可利用性矩阵：
   ┌─────────────┬──────────────────────────────────┐
   │             │           可利用性               │
   │   严重性    ├──────────┬───────────┬───────────┤
   │             │ 活跃利用  │   有 PoC   │  理论上   │
   ├─────────────┼──────────┼───────────┼───────────┤
   │   严重      │   P0     │    P1     │    P2     │
   │   高危      │   P1     │    P2     │    P3     │
   │   中等      │   P2     │    P3     │    P4     │
   │   低        │   P3     │    P4     │    P5     │
   └─────────────┴──────────┴───────────┴───────────┘

2. 附加因素：
   - 面向互联网与内部
   - 直接与传递依赖
   - 修复可用性
   - 受影响系统的业务关键性

3. 修复方法：
   - P0：立即（当天）
   - P1：紧急（24-48 小时）
   - P2：高优先级（1 周）
   - P3：正常（2 周）
   - P4-P5：待办（下个迭代）

4. 自动化：
   - P3+ 的补丁更新自动合并
   - 次要/主要更新需要审查
   - P0/P1 未修复阻止部署
```

## 延伸阅读

### 官方标准和指南

- [NTIA SBOM 最小要素](https://www.ntia.gov/page/software-bill-materials)
- [SPDX 规范](https://spdx.github.io/spdx-spec/)
- [CycloneDX 规范](https://cyclonedx.org/specification/)
- [第 14028 号行政命令](https://www.whitehouse.gov/briefing-room/presidential-actions/2021/05/12/executive-order-on-improving-the-nations-cybersecurity/)

### 工具文档

- [Syft 文档](https://github.com/anchore/syft)
- [Grype 文档](https://github.com/anchore/grype)
- [Trivy 文档](https://aquasecurity.github.io/trivy/)
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)

### 行业资源

- [CISA SBOM 资源](https://www.cisa.gov/sbom)
- [OpenSSF SBOM Everywhere](https://openssf.org/blog/2023/03/23/openssf-announces-sbom-everywhere-an-initiative-to-make-software-bills-of-materials-ubiquitous/)
- [Linux 基金会 SBOM 指南](https://www.linuxfoundation.org/research/the-state-of-software-bill-of-materials-sbom-and-cybersecurity-readiness)

### 相关主题

- [软件供应链安全](/docs/security/supply-chain)
- [容器安全](/docs/security/container-security)
- [DevSecOps 实践](/docs/security/devsecops)
- [漏洞管理](/docs/security/vulnerability-management)

## 总结

软件物料清单已从一个可有可无的实践演变为现代软件安全的关键组成部分。关键要点：

### 核心原则

| 方面 | 建议 |
|------|------|
| 格式 | 安全使用 CycloneDX，合规使用 SPDX |
| 生成 | 在 CI/CD 中自动化，构建时生成 |
| 覆盖 | 包含所有依赖类型（直接、传递、操作系统级别） |
| 存储 | 与发布一起版本化，容器使用证明 |
| 更新 | 每次发布重新生成，每天重新扫描新漏洞 |

### 实施清单

- [ ] 根据用例选择 SBOM 格式
- [ ] 将 SBOM 生成集成到 CI/CD 流水线
- [ ] 建立 SBOM 存储和分发策略
- [ ] 配置自动化漏洞扫描
- [ ] 实施许可证合规检查
- [ ] 创建漏洞响应程序
- [ ] 设置 SBOM 新鲜度监控
- [ ] 在发布流程中记录 SBOM

### 成熟度模型

```
级别 1（基础）：    发布时手动生成 SBOM
级别 2（发展）：    CI/CD 中自动生成
级别 3（定义）：    集成漏洞扫描
级别 4（管理）：    企业范围 SBOM 清单
级别 5（优化）：    自动响应与完整可追溯性
```

通过实施全面的 SBOM 实践，组织可以显著提高安全态势，缩短漏洞响应时间，并满足日益增长的软件透明度监管要求。
