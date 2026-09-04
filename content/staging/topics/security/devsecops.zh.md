---
title: DevSecOps 安全开发运维指南
description: 掌握DevSecOps实践，将安全融入开发流程
track: security
section: appsec
difficulty: advanced
tags:
  - DevSecOps
  - 安全左移
  - CI/CD安全
  - SSDLC
status: imported
origin: old/src/content/docs/security/devsecops.zh.md
divergence: 0.224
issues: []
legacy:
  category: Security
  subcategory: DevSecOps
  order: 9
  lastUpdated: 2026-01-07
---

DevSecOps 是将安全实践深度融入 DevOps 流程的方法论，它打破了传统开发模式中安全作为最后关卡的局限，让安全成为整个软件开发生命周期中每个人的责任。本文将系统性地介绍 DevSecOps 的核心理念、实践方法和工具链，帮助团队构建"安全即代码"的现代化开发流程。

## DevSecOps 核心理念

### 从 DevOps 到 DevSecOps 的演进

传统的软件开发模式中，安全往往被视为开发完成后的"最后一道关卡"。这种模式存在明显的缺陷：

```
传统开发模式 vs DevSecOps

传统模式：
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│ 需求  │→│ 开发  │→│ 测试  │→│ 安全  │→│ 运维  │
└──────┘  └──────┘  └──────┘  └──────┘  └──────┘
                                  ↑
                          安全介入太晚
                          修复成本高昂

DevSecOps 模式：
┌──────────────────────────────────────────────────────────┐
│                    安全贯穿全流程                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ 需求  │→│ 开发  │→│ 测试  │→│ 部署  │→│ 运维  │       │
│  │  +   │  │  +   │  │  +   │  │  +   │  │  +   │       │
│  │ 安全 │  │ 安全 │  │ 安全 │  │ 安全 │  │ 安全 │       │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘       │
└──────────────────────────────────────────────────────────┘
```

### DevSecOps 的三大支柱

DevSecOps 建立在三大支柱之上：

1. **文化转变**：安全是每个人的责任，而非仅属于安全团队
2. **流程自动化**：将安全检查嵌入自动化流水线
3. **技术工具链**：使用现代化工具实现安全即代码

```yaml
# DevSecOps 成熟度模型
devsecops_maturity:
  level_1_initial:
    - 手动安全测试
    - 安全团队孤立工作
    - 缺乏安全自动化

  level_2_managed:
    - 基本的 SAST/DAST 工具
    - 开发团队开始参与安全
    - 部分自动化安全检查

  level_3_defined:
    - 完整的 CI/CD 安全集成
    - 安全培训常态化
    - 威胁建模流程化

  level_4_quantified:
    - 安全指标驱动改进
    - 自动化漏洞修复
    - 安全债务可视化

  level_5_optimized:
    - 持续安全优化
    - AI 辅助安全决策
    - 零信任架构全面落地
```

## 安全左移（Shift Left Security）

### 安全左移的核心理念

安全左移是指将安全活动尽可能早地引入软件开发生命周期。研究表明，在开发早期发现和修复安全问题的成本远低于生产环境：

```
漏洞修复成本曲线

成本
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
   需求    设计    开发    测试    发布    生产

 越早发现漏洞，修复成本越低
```

### 需求阶段的安全实践

在需求阶段引入安全考量，可以从源头避免安全问题：

```markdown
# 安全需求检查清单

## 身份认证需求
- [ ] 是否需要多因素认证（MFA）？
- [ ] 密码策略是否符合安全标准？
- [ ] 会话管理策略是否明确？
- [ ] 是否需要支持 SSO/OAuth？

## 授权需求
- [ ] 是否定义了角色和权限模型？
- [ ] 是否需要实现最小权限原则？
- [ ] 敏感操作是否需要二次确认？

## 数据安全需求
- [ ] 敏感数据是否需要加密存储？
- [ ] 数据传输是否使用 TLS？
- [ ] 是否有数据脱敏需求？
- [ ] 数据保留和删除策略？

## 合规需求
- [ ] 是否涉及 GDPR/CCPA 等隐私法规？
- [ ] 是否需要满足 PCI-DSS 要求？
- [ ] 审计日志记录需求？
```

### 威胁建模（Threat Modeling）

威胁建模是安全左移的核心实践，帮助团队在设计阶段识别潜在威胁：

```python
# 威胁建模框架：STRIDE 模型实现
from dataclasses import dataclass
from enum import Enum
from typing import List

class ThreatCategory(Enum):
    SPOOFING = "身份伪造"           # 冒充合法用户或系统
    TAMPERING = "数据篡改"          # 未授权修改数据
    REPUDIATION = "否认性"          # 否认已执行的操作
    INFORMATION_DISCLOSURE = "信息泄露"  # 暴露敏感信息
    DENIAL_OF_SERVICE = "拒绝服务"   # 使系统不可用
    ELEVATION_OF_PRIVILEGE = "权限提升"  # 获取未授权的权限

@dataclass
class Threat:
    """威胁定义"""
    id: str
    category: ThreatCategory
    description: str
    affected_component: str
    likelihood: str  # 高/中/低
    impact: str      # 高/中/低
    mitigation: str

@dataclass
class DataFlow:
    """数据流定义"""
    source: str
    destination: str
    data_type: str
    protocol: str
    is_encrypted: bool

class ThreatModel:
    """威胁模型类"""

    def __init__(self, system_name: str):
        self.system_name = system_name
        self.components: List[str] = []
        self.data_flows: List[DataFlow] = []
        self.threats: List[Threat] = []
        self.trust_boundaries: List[str] = []

    def add_component(self, component: str) -> None:
        """添加系统组件"""
        self.components.append(component)

    def add_data_flow(self, flow: DataFlow) -> None:
        """添加数据流"""
        self.data_flows.append(flow)

    def analyze_threats(self) -> List[Threat]:
        """基于 STRIDE 分析潜在威胁"""
        threats = []

        for flow in self.data_flows:
            # 检查未加密的数据流
            if not flow.is_encrypted:
                threats.append(Threat(
                    id=f"THREAT-{len(threats)+1:03d}",
                    category=ThreatCategory.INFORMATION_DISCLOSURE,
                    description=f"数据流 {flow.source} -> {flow.destination} 未加密",
                    affected_component=flow.source,
                    likelihood="高",
                    impact="高",
                    mitigation="使用 TLS 加密数据传输"
                ))

            # 检查跨越信任边界的数据流
            if self._crosses_trust_boundary(flow):
                threats.append(Threat(
                    id=f"THREAT-{len(threats)+1:03d}",
                    category=ThreatCategory.SPOOFING,
                    description=f"跨信任边界的数据流需要身份验证",
                    affected_component=flow.destination,
                    likelihood="中",
                    impact="高",
                    mitigation="实现强身份认证机制"
                ))

        self.threats = threats
        return threats

    def _crosses_trust_boundary(self, flow: DataFlow) -> bool:
        """检查数据流是否跨越信任边界"""
        return flow.source.split('.')[0] != flow.destination.split('.')[0]

    def generate_report(self) -> str:
        """生成威胁建模报告"""
        report = f"# {self.system_name} 威胁建模报告\n\n"
        report += f"## 系统组件\n"
        for comp in self.components:
            report += f"- {comp}\n"

        report += f"\n## 识别的威胁\n"
        for threat in self.threats:
            report += f"\n### {threat.id}: {threat.category.value}\n"
            report += f"- **描述**: {threat.description}\n"
            report += f"- **影响组件**: {threat.affected_component}\n"
            report += f"- **可能性**: {threat.likelihood}\n"
            report += f"- **影响程度**: {threat.impact}\n"
            report += f"- **缓解措施**: {threat.mitigation}\n"

        return report

# 使用示例
if __name__ == "__main__":
    model = ThreatModel("电商平台")

    # 添加组件
    model.add_component("web.frontend")
    model.add_component("api.gateway")
    model.add_component("service.order")
    model.add_component("db.mysql")

    # 添加数据流
    model.add_data_flow(DataFlow(
        source="web.frontend",
        destination="api.gateway",
        data_type="用户请求",
        protocol="HTTPS",
        is_encrypted=True
    ))

    model.add_data_flow(DataFlow(
        source="service.order",
        destination="db.mysql",
        data_type="订单数据",
        protocol="TCP",
        is_encrypted=False  # 潜在风险
    ))

    # 分析威胁
    threats = model.analyze_threats()
    print(model.generate_report())
```

### 安全设计原则

在设计阶段应遵循以下安全原则：

```
安全设计原则

1. 最小权限原则 (Least Privilege)
   ┌─────────────────────────────────────────────┐
   │ 只授予完成任务所需的最小权限                   │
   │ 示例：API 只能访问其负责的数据库表             │
   └─────────────────────────────────────────────┘

2. 纵深防御 (Defense in Depth)
   ┌─────────────────────────────────────────────┐
   │ 多层安全控制，单点失效不导致全面沦陷           │
   │ 示例：WAF + 应用防护 + 数据库加密              │
   └─────────────────────────────────────────────┘

3. 默认安全 (Secure by Default)
   ┌─────────────────────────────────────────────┐
   │ 系统默认配置应该是安全的                       │
   │ 示例：默认启用 HTTPS，禁用调试模式             │
   └─────────────────────────────────────────────┘

4. 零信任架构 (Zero Trust)
   ┌─────────────────────────────────────────────┐
   │ 永不信任，始终验证                             │
   │ 示例：服务间调用也需要身份验证                  │
   └─────────────────────────────────────────────┘

5. 安全失败 (Fail Secure)
   ┌─────────────────────────────────────────────┐
   │ 系统故障时应进入安全状态                       │
   │ 示例：认证服务故障时拒绝所有请求               │
   └─────────────────────────────────────────────┘
```

## CI/CD 安全集成

### 安全流水线架构

将安全检查深度集成到 CI/CD 流水线是 DevSecOps 的核心实践：

```yaml
# .gitlab-ci.yml - DevSecOps 完整流水线示例
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

# ========== 预提交阶段 ==========
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

# ========== 构建阶段 ==========
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

# ========== 安全扫描阶段 ==========
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

# ========== 测试阶段 ==========
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

# ========== 安全门禁阶段 ==========
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

# ========== 部署阶段 ==========
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

# ========== 部署后阶段 ==========
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

### 安全门禁实现

安全门禁（Security Gate）是确保代码质量的关键控制点：

```python
#!/usr/bin/env python3
"""
security_gate.py - 安全门禁脚本
根据安全扫描结果决定是否允许部署
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
    """安全策略配置"""
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
    """扫描结果"""
    scan_type: str
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int
    secrets_found: bool = False

class SecurityGate:
    """安全门禁类"""

    def __init__(self, policy: SecurityPolicy):
        self.policy = policy
        self.results: List[ScanResult] = []
        self.violations: List[str] = []

    def load_semgrep_results(self, file_path: str) -> ScanResult:
        """加载 Semgrep SAST 扫描结果"""
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
            print(f"警告: 未找到 SAST 扫描结果文件 {file_path}")
            return None

    def load_trivy_results(self, file_path: str, scan_type: str) -> ScanResult:
        """加载 Trivy 扫描结果"""
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
            print(f"警告: 未找到扫描结果文件 {file_path}")
            return None

    def check_policy(self) -> bool:
        """检查是否符合安全策略"""
        passed = True

        # 聚合所有扫描结果
        total_critical = sum(r.critical for r in self.results if r)
        total_high = sum(r.high for r in self.results if r)
        total_medium = sum(r.medium for r in self.results if r)

        # 检查严重漏洞数量
        if total_critical > self.policy.max_critical:
            self.violations.append(
                f"严重漏洞数量 ({total_critical}) 超过阈值 ({self.policy.max_critical})"
            )
            passed = False

        if total_high > self.policy.max_high:
            self.violations.append(
                f"高危漏洞数量 ({total_high}) 超过阈值 ({self.policy.max_high})"
            )
            passed = False

        if total_medium > self.policy.max_medium:
            self.violations.append(
                f"中危漏洞数量 ({total_medium}) 超过阈值 ({self.policy.max_medium})"
            )
            passed = False

        # 检查密钥泄露
        if self.policy.block_on_secrets:
            for result in self.results:
                if result and result.secrets_found:
                    self.violations.append("检测到代码中包含敏感密钥")
                    passed = False
                    break

        # 检查必需的扫描是否完成
        completed_scans = {r.scan_type for r in self.results if r}
        missing_scans = set(self.policy.required_scans) - completed_scans
        if missing_scans:
            self.violations.append(f"缺少必需的安全扫描: {missing_scans}")
            passed = False

        return passed

    def generate_report(self) -> str:
        """生成安全门禁报告"""
        report = []
        report.append("=" * 60)
        report.append("           安全门禁检查报告")
        report.append("=" * 60)
        report.append("")

        # 扫描结果汇总
        report.append("## 扫描结果汇总")
        report.append("-" * 40)
        for result in self.results:
            if result:
                report.append(f"\n### {result.scan_type.upper()} 扫描")
                report.append(f"  - 总发现: {result.total_findings}")
                report.append(f"  - 严重: {result.critical}")
                report.append(f"  - 高危: {result.high}")
                report.append(f"  - 中危: {result.medium}")
                report.append(f"  - 低危: {result.low}")

        # 策略检查结果
        report.append("\n## 策略检查")
        report.append("-" * 40)
        report.append(f"  - 最大允许严重漏洞: {self.policy.max_critical}")
        report.append(f"  - 最大允许高危漏洞: {self.policy.max_high}")
        report.append(f"  - 最大允许中危漏洞: {self.policy.max_medium}")

        # 违规项
        if self.violations:
            report.append("\n## 违规项 (BLOCKED)")
            report.append("-" * 40)
            for violation in self.violations:
                report.append(f"  [X] {violation}")

        # 最终结果
        report.append("\n" + "=" * 60)
        if not self.violations:
            report.append("          结果: 通过 (PASSED)")
        else:
            report.append("          结果: 阻止 (BLOCKED)")
        report.append("=" * 60)

        return "\n".join(report)

def main():
    # 定义安全策略
    policy = SecurityPolicy(
        max_critical=0,
        max_high=5,
        max_medium=20,
        block_on_secrets=True,
        required_scans=['sast', 'dependency', 'container']
    )

    gate = SecurityGate(policy)

    # 加载各类扫描结果
    sast_result = gate.load_semgrep_results('semgrep-report.json')
    if sast_result:
        gate.results.append(sast_result)

    dep_result = gate.load_trivy_results('trivy-fs-report.json', 'dependency')
    if dep_result:
        gate.results.append(dep_result)

    container_result = gate.load_trivy_results('trivy-image-report.json', 'container')
    if container_result:
        gate.results.append(container_result)

    # 检查策略
    passed = gate.check_policy()

    # 生成报告
    print(gate.generate_report())

    # 返回退出码
    sys.exit(0 if passed else 1)

if __name__ == "__main__":
    main()
```

### Pre-commit 安全钩子

在代码提交前进行安全检查，是安全左移的重要实践：

```yaml
# .pre-commit-config.yaml
repos:
  # 密钥检测
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package-lock.json

  # Git 安全检查
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

  # Python 安全检查
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        args: ['-r', 'src/', '-ll']
        exclude: tests/

  # Dockerfile 安全检查
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint-docker
        args: ['--ignore', 'DL3008']

  # Terraform 安全检查
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

  # Semgrep 轻量级扫描
  - repo: https://github.com/semgrep/semgrep
    rev: v1.52.0
    hooks:
      - id: semgrep
        args: ['--config', 'auto', '--error']
```

```bash
#!/bin/bash
# scripts/setup-precommit.sh - 安装和配置 pre-commit

set -e

echo "正在安装 pre-commit 安全钩子..."

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "错误: 需要 Python 3"
    exit 1
fi

# 安装 pre-commit
pip install pre-commit

# 安装钩子
pre-commit install
pre-commit install --hook-type commit-msg

# 初始化密钥基线文件
if [ ! -f ".secrets.baseline" ]; then
    echo "正在创建密钥检测基线..."
    detect-secrets scan > .secrets.baseline
fi

# 运行一次完整检查
echo "正在运行初始安全检查..."
pre-commit run --all-files || true

echo "安装完成！每次提交前将自动运行安全检查。"
```

## 安全扫描自动化

### SAST（静态应用安全测试）

静态分析在不运行代码的情况下检测安全漏洞。以下是用于检测常见漏洞模式的 Semgrep 规则示例：

```yaml
# custom_semgrep_rules/security-rules.yaml
# 这些规则用于检测代码中的安全漏洞模式
rules:
  - id: hardcoded-password
    patterns:
      - pattern-either:
          - pattern: password = "..."
          - pattern: PASSWORD = "..."
          - pattern: passwd = "..."
          - pattern: secret = "..."
    message: "检测到硬编码密码，请使用环境变量或密钥管理服务"
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
    message: "潜在的 SQL 注入漏洞，请使用参数化查询"
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
    message: "不安全的 YAML 反序列化，请使用 yaml.safe_load()"
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
    message: "使用了弱哈希算法，请使用 SHA-256 或更强的算法"
    severity: WARNING
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-327"
```

### SAST 扫描编排器

```python
#!/usr/bin/env python3
"""
sast_orchestrator.py - SAST 扫描编排器
整合多种 SAST 工具的扫描结果
"""

import subprocess
import json
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class Finding:
    """安全发现"""
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
    """SAST 扫描编排器"""

    def __init__(self, target_dir: str):
        self.target_dir = Path(target_dir)
        self.findings: List[Finding] = []
        self.scan_results: Dict[str, Any] = {}

    def run_semgrep(self) -> List[Finding]:
        """运行 Semgrep 扫描"""
        print("正在运行 Semgrep 扫描...")

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
        """运行 Bandit 扫描（Python 项目）"""
        print("正在运行 Bandit 扫描...")

        cmd = [
            "bandit",
            "-r", str(self.target_dir),
            "-f", "json",
            "-ll"  # 只报告中等及以上严重性
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
        """运行所有扫描"""
        self.findings.extend(self.run_semgrep())
        self.findings.extend(self.run_bandit())
        self._deduplicate_findings()

    def _deduplicate_findings(self) -> None:
        """去除重复发现"""
        seen = set()
        unique_findings = []

        for finding in self.findings:
            key = (finding.file_path, finding.line_number, finding.rule_id)
            if key not in seen:
                seen.add(key)
                unique_findings.append(finding)

        self.findings = unique_findings

    def generate_report(self, output_path: str) -> None:
        """生成统一格式的扫描报告"""
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

        print(f"报告已生成: {output_path}")

    def _count_by_severity(self) -> Dict[str, int]:
        """按严重性统计"""
        counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        for finding in self.findings:
            severity = finding.severity.upper()
            if severity in counts:
                counts[severity] += 1
        return counts

    def _count_by_tool(self) -> Dict[str, int]:
        """按工具统计"""
        counts = {}
        for finding in self.findings:
            counts[finding.tool] = counts.get(finding.tool, 0) + 1
        return counts
```

### SCA（软件成分分析）

分析项目依赖中的已知漏洞：

```yaml
# .github/workflows/dependency-scan.yml
name: Dependency Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # 每天运行

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

      # Node.js 依赖扫描
      - name: NPM Audit
        if: hashFiles('package-lock.json') != ''
        run: |
          npm audit --json > npm-audit.json || true
          npm audit --audit-level=high
        continue-on-error: true

      # Python 依赖扫描
      - name: Safety Check
        if: hashFiles('requirements.txt') != ''
        run: |
          pip install safety
          safety check -r requirements.txt --json > safety-report.json || true
          safety check -r requirements.txt
        continue-on-error: true

      # Trivy 全面扫描
      - name: Trivy Vulnerability Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      # 上传到 GitHub Security
      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      # SBOM 生成
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

### SBOM 分析器

```python
#!/usr/bin/env python3
"""
sbom_analyzer.py - SBOM 分析器
分析软件物料清单，识别许可证风险和安全问题
"""

import json
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class Component:
    """软件组件"""
    name: str
    version: str
    license: str
    purl: str
    vulnerabilities: List[str]

class SBOMAnalyzer:
    """SBOM 分析器"""

    # 高风险许可证（可能有传染性）
    RISKY_LICENSES = {
        'GPL-3.0', 'GPL-2.0', 'AGPL-3.0', 'LGPL-3.0',
        'SSPL-1.0', 'Commons Clause'
    }

    # 宽松许可证
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
        """解析 SPDX 格式的 SBOM"""
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
        """分析许可证风险"""
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
        """检查生命周期结束的组件"""
        eol_components = []

        # 已知 EOL 版本模式
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
        """生成分析报告"""
        license_analysis = self.analyze_licenses()
        eol_components = self.check_eol_components()

        report = []
        report.append("=" * 60)
        report.append("           SBOM 安全分析报告")
        report.append("=" * 60)
        report.append(f"\n总组件数: {len(self.components)}")

        report.append("\n## 许可证分析")
        report.append("-" * 40)

        if license_analysis['risky']:
            report.append("\n### 高风险许可证 (需要法务审核)")
            for item in license_analysis['risky']:
                report.append(f"  [!] {item}")

        report.append(f"\n宽松许可证组件: {len(license_analysis['permissive'])}")
        report.append(f"未知许可证组件: {len(license_analysis['unknown'])}")

        if eol_components:
            report.append("\n## 生命周期结束的组件")
            report.append("-" * 40)
            for item in eol_components:
                report.append(f"  [!] {item}")

        return "\n".join(report)
```

### DAST（动态应用安全测试）

在运行时检测安全漏洞：

```python
#!/usr/bin/env python3
"""
dast_scanner.py - DAST 扫描器封装
整合 OWASP ZAP 进行动态安全测试
"""

import time
import json
import requests
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class DastFinding:
    """DAST 发现"""
    alert: str
    risk: str
    confidence: str
    url: str
    description: str
    solution: str
    cweid: str
    wascid: str

class ZAPScanner:
    """OWASP ZAP 扫描器"""

    def __init__(self, zap_url: str = "http://localhost:8080", api_key: str = ""):
        self.zap_url = zap_url
        self.api_key = api_key
        self.session = requests.Session()

    def _api_call(self, endpoint: str, params: Dict = None) -> Dict:
        """调用 ZAP API"""
        if params is None:
            params = {}
        params['apikey'] = self.api_key

        response = self.session.get(f"{self.zap_url}/{endpoint}", params=params)
        return response.json()

    def spider_scan(self, target_url: str, max_depth: int = 5) -> str:
        """爬虫扫描"""
        print(f"开始爬虫扫描: {target_url}")

        result = self._api_call("JSON/spider/action/scan/", {
            "url": target_url,
            "maxChildren": max_depth
        })

        scan_id = result.get('scan')

        # 等待爬虫完成
        while True:
            status = self._api_call("JSON/spider/view/status/", {"scanId": scan_id})
            progress = int(status.get('status', 0))
            print(f"爬虫进度: {progress}%")

            if progress >= 100:
                break
            time.sleep(5)

        return scan_id

    def active_scan(self, target_url: str) -> str:
        """主动扫描"""
        print(f"开始主动扫描: {target_url}")

        result = self._api_call("JSON/ascan/action/scan/", {
            "url": target_url,
            "recurse": "true",
            "inScopeOnly": "true"
        })

        scan_id = result.get('scan')

        # 等待扫描完成
        while True:
            status = self._api_call("JSON/ascan/view/status/", {"scanId": scan_id})
            progress = int(status.get('status', 0))
            print(f"扫描进度: {progress}%")

            if progress >= 100:
                break
            time.sleep(10)

        return scan_id

    def get_alerts(self, base_url: str = None) -> List[DastFinding]:
        """获取扫描告警"""
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
    """DAST 扫描编排器"""

    def __init__(self, target_url: str, zap_url: str = "http://localhost:8080"):
        self.target_url = target_url
        self.scanner = ZAPScanner(zap_url)
        self.findings: List[DastFinding] = []

    def run_full_scan(self) -> None:
        """运行完整扫描"""
        print("=" * 50)
        print(f"开始 DAST 扫描: {self.target_url}")
        print("=" * 50)

        self.scanner.spider_scan(self.target_url)
        self.scanner.active_scan(self.target_url)
        self.findings = self.scanner.get_alerts(self.target_url)

        print(f"\n扫描完成，发现 {len(self.findings)} 个问题")

    def run_baseline_scan(self) -> None:
        """运行基线扫描（仅被动扫描）"""
        print("=" * 50)
        print(f"开始基线扫描: {self.target_url}")
        print("=" * 50)

        self.scanner.spider_scan(self.target_url)
        time.sleep(30)  # 等待被动扫描
        self.findings = self.scanner.get_alerts(self.target_url)

        print(f"\n扫描完成，发现 {len(self.findings)} 个问题")

    def get_summary(self) -> Dict[str, int]:
        """获取扫描摘要"""
        summary = {'High': 0, 'Medium': 0, 'Low': 0, 'Informational': 0}

        for finding in self.findings:
            if finding.risk in summary:
                summary[finding.risk] += 1

        return summary

    def export_report(self, output_path: str) -> None:
        """导出 JSON 报告"""
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

        print(f"JSON 报告已生成: {output_path}")
```

## 安全软件开发生命周期（SSDLC）

### SSDLC 框架

安全软件开发生命周期将安全融入开发的每个阶段：

```
安全软件开发生命周期 (SSDLC)

┌────────────┐     ┌────────────┐     ┌────────────┐
│   需求      │────→│   设计      │────→│   开发      │
│            │     │            │     │            │
│ - 安全需求  │     │ - 威胁建模  │     │ - 安全编码  │
│ - 合规需求  │     │ - 安全架构  │     │ - 代码审查  │
│ - 风险评估  │     │ - 设计审查  │     │ - SAST扫描  │
└────────────┘     └────────────┘     └────────────┘
       ↑                                     │
       │                                     ↓
┌────────────┐     ┌────────────┐     ┌────────────┐
│   运维      │←────│   部署      │←────│   测试      │
│            │     │            │     │            │
│ - 安全监控  │     │ - 安全配置  │     │ - DAST扫描  │
│ - 事件响应  │     │ - 渗透测试  │     │ - SCA扫描   │
│ - 持续评估  │     │ - 安全审计  │     │ - 安全测试  │
└────────────┘     └────────────┘     └────────────┘

                持续反馈和改进
```

### 安全编码规范

建立和执行安全编码规范是 SSDLC 的核心：

```python
"""
secure_coding_guidelines.py - 安全编码规范示例
展示常见安全问题的正确处理方式
"""

import hashlib
import secrets
import hmac
from typing import Optional
import re
import os

# ==================== 输入验证 ====================

class InputValidator:
    """输入验证器"""

    @staticmethod
    def validate_email(email: str) -> bool:
        """验证邮箱格式"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False
        if len(email) > 254:
            return False
        return True

    @staticmethod
    def validate_username(username: str) -> bool:
        """验证用户名 - 只允许字母、数字、下划线"""
        pattern = r'^[a-zA-Z0-9_]{3,20}$'
        return bool(re.match(pattern, username))

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """清理文件名，防止路径遍历"""
        # 移除路径分隔符
        filename = os.path.basename(filename)
        # 移除特殊字符
        filename = re.sub(r'[^\w\.-]', '_', filename)
        # 移除开头的点（隐藏文件）
        filename = filename.lstrip('.')
        return filename or 'unnamed'

    @staticmethod
    def validate_url(url: str, allowed_schemes: list = None) -> bool:
        """验证 URL，防止 SSRF"""
        if allowed_schemes is None:
            allowed_schemes = ['https']

        from urllib.parse import urlparse
        try:
            parsed = urlparse(url)
            if parsed.scheme not in allowed_schemes:
                return False
            if not parsed.netloc:
                return False
            # 防止 SSRF - 阻止内网地址
            if parsed.hostname in ['localhost', '127.0.0.1', '0.0.0.0']:
                return False
            return True
        except Exception:
            return False

# ==================== 密码处理 ====================

class PasswordHandler:
    """安全密码处理"""

    MIN_LENGTH = 12
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL = True

    @classmethod
    def validate_password_strength(cls, password: str) -> tuple:
        """验证密码强度"""
        if len(password) < cls.MIN_LENGTH:
            return False, f"密码长度至少 {cls.MIN_LENGTH} 个字符"

        if cls.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            return False, "密码需要包含大写字母"

        if cls.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            return False, "密码需要包含小写字母"

        if cls.REQUIRE_DIGIT and not re.search(r'\d', password):
            return False, "密码需要包含数字"

        if cls.REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "密码需要包含特殊字符"

        return True, "密码强度符合要求"

    @staticmethod
    def hash_password(password: str) -> str:
        """使用安全算法哈希密码"""
        try:
            # 推荐：使用 Argon2
            from argon2 import PasswordHasher
            ph = PasswordHasher()
            return ph.hash(password)
        except ImportError:
            # 后备方案：使用 PBKDF2
            salt = secrets.token_bytes(32)
            key = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode(),
                salt,
                iterations=600000  # OWASP 推荐
            )
            return f"pbkdf2:sha256:600000${salt.hex()}${key.hex()}"

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """验证密码"""
        try:
            from argon2 import PasswordHasher
            ph = PasswordHasher()
            ph.verify(hashed, password)
            return True
        except ImportError:
            # PBKDF2 验证
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

# ==================== 安全随机数 ====================

class SecureRandom:
    """安全随机数生成"""

    @staticmethod
    def generate_token(length: int = 32) -> str:
        """生成安全令牌"""
        return secrets.token_urlsafe(length)

    @staticmethod
    def generate_api_key() -> str:
        """生成 API 密钥"""
        return f"sk_{secrets.token_urlsafe(32)}"

    @staticmethod
    def generate_otp(digits: int = 6) -> str:
        """生成一次性密码"""
        return ''.join(str(secrets.randbelow(10)) for _ in range(digits))

# ==================== SQL 注入防护 ====================

class DatabaseHandler:
    """安全数据库操作"""

    def __init__(self, connection):
        self.conn = connection

    def get_user_secure(self, user_id: int) -> Optional[dict]:
        """安全的用户查询 - 使用参数化查询"""
        cursor = self.conn.cursor()

        # 正确：使用参数化查询，永远不要拼接 SQL
        cursor.execute(
            "SELECT id, username, email FROM users WHERE id = %s",
            (user_id,)
        )

        row = cursor.fetchone()
        if row:
            return {'id': row[0], 'username': row[1], 'email': row[2]}
        return None

    def search_users_secure(self, keyword: str, limit: int = 10) -> list:
        """安全的模糊搜索"""
        cursor = self.conn.cursor()

        # 正确：参数化查询 + 限制结果数量
        cursor.execute(
            "SELECT id, username FROM users WHERE username LIKE %s LIMIT %s",
            (f"%{keyword}%", min(limit, 100))
        )

        return [{'id': row[0], 'username': row[1]} for row in cursor.fetchall()]

# ==================== 日志安全 ====================

class SecureLogger:
    """安全日志记录"""

    SENSITIVE_FIELDS = {
        'password', 'passwd', 'secret', 'token', 'api_key',
        'credit_card', 'ssn', 'authorization'
    }

    @classmethod
    def sanitize_log_data(cls, data: dict) -> dict:
        """清理日志数据中的敏感信息"""
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
        """记录安全事件"""
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

### 安全代码审查清单

```markdown
# 安全代码审查清单

## 认证和授权
- [ ] 密码使用强哈希算法（Argon2, bcrypt, PBKDF2）
- [ ] 实现了账户锁定机制
- [ ] 会话令牌使用加密安全的随机数生成
- [ ] 敏感操作需要重新认证
- [ ] 权限检查在服务端执行
- [ ] 遵循最小权限原则

## 输入验证
- [ ] 所有用户输入都经过验证
- [ ] 使用白名单而非黑名单验证
- [ ] 文件上传限制类型和大小
- [ ] 防止路径遍历攻击
- [ ] URL 重定向只允许白名单域名

## 输出编码
- [ ] HTML 输出正确编码
- [ ] JavaScript 上下文正确转义
- [ ] SQL 使用参数化查询
- [ ] 命令执行使用安全 API（避免 shell 调用）

## 数据保护
- [ ] 敏感数据传输使用 TLS
- [ ] 敏感数据存储加密
- [ ] 密钥使用密钥管理服务
- [ ] 日志中不包含敏感信息
- [ ] 实现数据最小化原则

## 错误处理
- [ ] 不向用户暴露详细错误信息
- [ ] 安全失败（fail secure）
- [ ] 异常被正确捕获和处理
- [ ] 记录安全相关错误

## 安全配置
- [ ] 生产环境禁用调试模式
- [ ] 安全 HTTP 头已配置
- [ ] CORS 策略正确配置
- [ ] 依赖项是最新版本
```

## DevSecOps 工具链

### 工具链全景图

```
DevSecOps 工具链

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    代码安全      │  │    构建安全      │  │    部署安全      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - Semgrep       │  │ - Trivy         │  │ - Falco         │
│ - SonarQube     │  │ - Snyk          │  │ - OPA/Gatekeeper│
│ - Bandit        │  │ - Grype         │  │ - Vault         │
│ - ESLint        │  │ - Cosign        │  │ - Cert-Manager  │
│ - Checkov       │  │ - Syft          │  │ - Istio         │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    运行时安全    │  │    监控告警      │  │    合规审计      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - Sysdig        │  │ - Prometheus    │  │ - OpenSCAP      │
│ - Aqua Security │  │ - Grafana       │  │ - InSpec        │
│ - StackRox      │  │ - ELK Stack     │  │ - Anchore       │
│ - Tetragon      │  │ - Splunk        │  │ - Prowler       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 密钥管理集成

```python
#!/usr/bin/env python3
"""
secrets_manager.py - 密钥管理集成
支持多种密钥管理后端
"""

import os
from abc import ABC, abstractmethod
from typing import Optional, Dict

class SecretsBackend(ABC):
    """密钥后端抽象类"""

    @abstractmethod
    def get_secret(self, key: str) -> Optional[str]:
        """获取密钥"""
        pass

    @abstractmethod
    def set_secret(self, key: str, value: str) -> bool:
        """设置密钥"""
        pass

class HashiCorpVault(SecretsBackend):
    """HashiCorp Vault 集成"""

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
    """AWS Secrets Manager 集成"""

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
    """统一密钥管理器"""

    def __init__(self, backend: SecretsBackend):
        self.backend = backend
        self._cache: Dict[str, str] = {}
        self._cache_enabled = True

    def get(self, key: str, default: str = None) -> Optional[str]:
        """获取密钥，支持缓存"""
        # 首先检查环境变量
        env_value = os.environ.get(key)
        if env_value:
            return env_value

        # 检查缓存
        if self._cache_enabled and key in self._cache:
            return self._cache[key]

        # 从后端获取
        value = self.backend.get_secret(key)

        if value and self._cache_enabled:
            self._cache[key] = value

        return value or default

    def clear_cache(self) -> None:
        """清除缓存"""
        self._cache.clear()

def create_secrets_manager() -> SecretsManager:
    """根据环境创建密钥管理器"""
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
        raise ValueError(f"不支持的密钥后端: {backend_type}")
```

## 总结与最佳实践

### DevSecOps 实施路线图

```
DevSecOps 实施路线图

第一阶段（1-3个月）：基础建设
┌─────────────────────────────────────────────────────────────┐
│ - 建立安全编码规范                                           │
│ - 部署 SAST 工具                                             │
│ - 配置 pre-commit 安全检查                                   │
│ - 开展安全意识培训                                           │
└─────────────────────────────────────────────────────────────┘

第二阶段（3-6个月）：流程集成
┌─────────────────────────────────────────────────────────────┐
│ - CI/CD 流水线安全集成                                       │
│ - 实施 SCA 依赖扫描                                          │
│ - 建立安全门禁机制                                           │
│ - 威胁建模流程化                                             │
└─────────────────────────────────────────────────────────────┘

第三阶段（6-12个月）：深度优化
┌─────────────────────────────────────────────────────────────┐
│ - 容器和 IaC 安全扫描                                        │
│ - DAST 自动化测试                                            │
│ - 安全指标体系建立                                           │
│ - 安全冠军计划推行                                           │
└─────────────────────────────────────────────────────────────┘

第四阶段（持续）：成熟运营
┌─────────────────────────────────────────────────────────────┐
│ - 持续改进和优化                                             │
│ - 自动化漏洞修复                                             │
│ - 安全运营中心（SOC）集成                                    │
│ - 零信任架构演进                                             │
└─────────────────────────────────────────────────────────────┘
```

### 关键成功因素

1. **领导层支持**：DevSecOps 转型需要自上而下的推动
2. **文化变革**：安全是每个人的责任，而非仅属于安全团队
3. **自动化优先**：尽可能自动化安全检查，减少人工干预
4. **渐进式实施**：从小处着手，逐步扩展
5. **持续学习**：安全威胁不断演变，团队需要持续学习

### 常见陷阱与应对

| 陷阱 | 表现 | 应对策略 |
|------|------|----------|
| 工具堆砌 | 部署大量工具但缺乏整合 | 制定工具选型标准，注重工具间集成 |
| 忽视文化 | 只关注技术，忽视人员培训 | 建立安全冠军计划，定期培训 |
| 过度阻断 | 安全门禁过于严格影响效率 | 渐进式提高标准，平衡安全与效率 |
| 告警疲劳 | 大量误报导致团队忽视告警 | 优化规则，减少误报，分级告警 |
| 缺乏度量 | 无法量化安全改进效果 | 建立安全指标体系，定期评估 |

### 安全指标体系

```yaml
# DevSecOps 关键指标
metrics:
  # 漏洞管理
  vulnerability_metrics:
    - name: "平均修复时间 (MTTR)"
      target: "严重漏洞 < 24小时"
      measurement: "从发现到修复的平均时间"

    - name: "漏洞逃逸率"
      target: "< 5%"
      measurement: "生产环境发现的漏洞 / 总漏洞数"

    - name: "安全债务"
      target: "持续下降"
      measurement: "未修复漏洞的累计数量"

  # 流程指标
  process_metrics:
    - name: "安全扫描覆盖率"
      target: "> 95%"
      measurement: "经过安全扫描的代码变更 / 总变更"

    - name: "安全门禁通过率"
      target: "> 80%"
      measurement: "首次通过安全门禁的构建 / 总构建"

    - name: "威胁建模覆盖率"
      target: "> 90%"
      measurement: "完成威胁建模的项目 / 总项目"

  # 文化指标
  culture_metrics:
    - name: "安全培训完成率"
      target: "100%"
      measurement: "完成培训的开发者 / 总开发者"

    - name: "安全冠军覆盖率"
      target: "每个团队至少1人"
      measurement: "拥有安全冠军的团队数"
```

DevSecOps 是一场持续的旅程，而非一个终点。通过将安全融入开发流程的每个环节，组织可以在保持开发速度的同时，显著提升软件安全性。记住，安全不是阻碍创新的障碍，而是赋能业务持续发展的基石。
