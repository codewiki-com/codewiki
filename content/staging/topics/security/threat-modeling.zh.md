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
origin: old/src/content/docs/security/threat-modeling.zh.md
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

威胁建模是一种系统化的安全分析方法，用于识别、评估和应对软件系统中的潜在安全威胁。通过在设计阶段就考虑安全问题，团队可以在代码编写之前就发现并解决安全漏洞，从而大幅降低修复成本和安全风险。

## 概念解释

### 什么是威胁建模

威胁建模（Threat Modeling）是一个结构化的过程，用于识别安全需求、确定威胁和潜在漏洞、量化威胁和漏洞的严重性，并确定缓解措施的优先级。它回答四个核心问题：

1. **我们在构建什么？** - 理解系统架构和数据流
2. **什么可能出错？** - 识别潜在威胁
3. **我们该怎么办？** - 确定缓解策略
4. **我们做得够好吗？** - 验证和改进

### 为什么需要威胁建模

| 优势 | 描述 |
|------|------|
| 早期发现问题 | 在设计阶段识别安全问题，修复成本最低 |
| 系统化思维 | 提供结构化方法，避免遗漏关键威胁 |
| 资源优化 | 帮助团队优先处理最关键的安全风险 |
| 知识共享 | 促进团队对系统安全需求的共同理解 |
| 合规支持 | 满足PCI DSS、HIPAA等法规的安全评估要求 |

### 威胁建模的时机

威胁建模应该在软件开发生命周期的多个阶段进行：

- **设计阶段**：最有价值，修改成本最低
- **开发阶段**：验证实现是否符合安全设计
- **上线前**：最终安全评审
- **重大变更时**：新功能或架构变更时重新评估
- **定期审查**：应对新出现的威胁和攻击技术

## 威胁建模方法论

### STRIDE模型

STRIDE是由微软开发的威胁分类模型，是最广泛使用的威胁建模框架之一。每个字母代表一种威胁类型：

| 威胁类型 | 英文 | 描述 | 违反的安全属性 |
|----------|------|------|----------------|
| 欺骗 | Spoofing | 冒充其他用户或系统 | 认证 |
| 篡改 | Tampering | 恶意修改数据 | 完整性 |
| 抵赖 | Repudiation | 否认执行过的操作 | 不可否认性 |
| 信息泄露 | Information Disclosure | 暴露敏感信息 | 机密性 |
| 拒绝服务 | Denial of Service | 使系统不可用 | 可用性 |
| 权限提升 | Elevation of Privilege | 获取未授权的访问权限 | 授权 |

**STRIDE威胁与安全控制的对应关系**：

```
威胁类型         →    缓解策略
─────────────────────────────────────────
Spoofing        →    认证（Authentication）
Tampering       →    完整性验证（Integrity）
Repudiation     →    审计日志（Logging/Auditing）
Info Disclosure →    加密/访问控制（Encryption/ACL）
DoS             →    可用性设计（Availability）
EoP             →    授权（Authorization）
```

**STRIDE应用示例**：

```
以Web应用登录功能为例：

┌─────────────────┐      HTTPS       ┌─────────────────┐
│     用户        │ ───────────────> │    Web服务器     │
│   (浏览器)      │                  │                 │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │    数据库       │
                                     │                 │
                                     └─────────────────┘

威胁分析：
┌──────────┬────────────────────────────────────────┐
│ 威胁类型  │ 具体威胁                               │
├──────────┼────────────────────────────────────────┤
│ Spoofing │ 攻击者冒充合法用户登录                   │
│ Tampering│ 中间人篡改登录请求                      │
│ Repudiati│ 用户否认进行过某次登录                   │
│ Info Disc│ 密码在传输或存储中泄露                   │
│ DoS      │ 暴力破解导致账户锁定                     │
│ EoP      │ 普通用户获取管理员权限                   │
└──────────┴────────────────────────────────────────┘
```

### PASTA方法论

PASTA（Process for Attack Simulation and Threat Analysis）是一个以风险为中心的七阶段威胁建模方法论，强调业务影响分析。

**七个阶段**：

```
阶段1: 定义目标 (Define Objectives)
    │   - 识别业务目标
    │   - 确定安全和合规需求
    │   - 进行初步业务影响分析
    ▼
阶段2: 定义技术范围 (Define Technical Scope)
    │   - 确定系统边界
    │   - 识别依赖关系
    │   - 记录技术架构
    ▼
阶段3: 应用分解 (Application Decomposition)
    │   - 创建数据流图
    │   - 识别入口点
    │   - 识别信任边界
    ▼
阶段4: 威胁分析 (Threat Analysis)
    │   - 收集威胁情报
    │   - 分析攻击场景
    │   - 识别威胁代理
    ▼
阶段5: 漏洞分析 (Vulnerability Analysis)
    │   - 识别系统漏洞
    │   - 关联威胁和漏洞
    │   - 评估漏洞可利用性
    ▼
阶段6: 攻击建模 (Attack Modeling)
    │   - 创建攻击树
    │   - 模拟攻击路径
    │   - 确定攻击概率
    ▼
阶段7: 风险与影响分析 (Risk & Impact Analysis)
        - 量化风险
        - 优先级排序
        - 制定缓解策略
```

**PASTA与STRIDE的对比**：

| 特性 | STRIDE | PASTA |
|------|--------|-------|
| 关注点 | 技术威胁 | 业务风险 |
| 复杂度 | 较低 | 较高 |
| 耗时 | 较短 | 较长 |
| 适用场景 | 快速威胁识别 | 深度风险分析 |
| 输出 | 威胁列表 | 完整风险报告 |

### LINDDUN方法论

LINDDUN专注于隐私威胁建模，特别适用于处理个人数据的系统。

**七种隐私威胁**：

| 威胁 | 英文 | 描述 |
|------|------|------|
| 关联性 | Linkability | 能够将两条或多条数据关联到同一个人 |
| 可识别性 | Identifiability | 能够识别数据主体的身份 |
| 不可否认性 | Non-repudiation | 用户无法否认自己的行为（隐私视角下的负面） |
| 可检测性 | Detectability | 能够发现某项记录的存在 |
| 信息披露 | Disclosure of information | 过度暴露个人信息 |
| 不知情 | Unawareness | 数据主体不知道数据被收集或使用 |
| 不合规 | Non-compliance | 违反隐私法规或政策 |

**LINDDUN应用场景**：

```
以医疗健康应用为例：

用户数据流：
用户 → 健康App → 云服务 → 医疗机构

隐私威胁分析：
┌─────────────────┬───────────────────────────────────┐
│ 威胁            │ 具体风险                          │
├─────────────────┼───────────────────────────────────┤
│ Linkability     │ 多次就诊记录可被关联追踪用户行为   │
│ Identifiability │ 通过健康数据模式识别特定个人       │
│ Non-repudiation │ 用户无法否认曾查看特定健康信息     │
│ Detectability   │ 攻击者能发现用户有特定疾病记录     │
│ Disclosure      │ 健康数据被未授权方获取            │
│ Unawareness     │ 用户不知道数据被第三方分析        │
│ Non-compliance  │ 违反GDPR或HIPAA规定              │
└─────────────────┴───────────────────────────────────┘
```

## 数据流图（DFD）

数据流图是威胁建模的核心工具，用于可视化系统中的数据流动。

### DFD元素

```
┌─────────────────────────────────────────────────────────────┐
│                      DFD 基本元素                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐                                                │
│  │         │    外部实体（External Entity）                  │
│  │  用户   │    - 系统外部的参与者                           │
│  │         │    - 可以是人、外部系统等                       │
│  └─────────┘                                                │
│                                                             │
│  ╔═════════╗                                                │
│  ║         ║    进程（Process）                             │
│  ║ Web服务 ║    - 处理或转换数据的组件                       │
│  ║         ║    - 系统内部的处理逻辑                         │
│  ╚═════════╝                                                │
│                                                             │
│  ═══════════                                                │
│  │ 数据库 │     数据存储（Data Store）                       │
│  ═══════════    - 存储数据的位置                            │
│                 - 文件、数据库、缓存等                       │
│                                                             │
│  ──────────>    数据流（Data Flow）                         │
│                 - 数据在元素之间的流动                       │
│                 - 标注数据类型和传输协议                     │
│                                                             │
│  - - - - - -    信任边界（Trust Boundary）                  │
│  │        │     - 不同信任级别的分界线                      │
│  - - - - - -    - 跨越边界的数据流需特别关注                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### DFD层级

DFD可以按照详细程度分为多个层级：

```
Level 0 (上下文图):
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌──────┐         ╔════════════════╗        ┌───────┐  │
│  │ 用户 │ ──────> ║   电商系统     ║ ─────> │ 支付  │  │
│  └──────┘         ╚════════════════╝        │ 网关  │  │
│                                             └───────┘  │
└────────────────────────────────────────────────────────┘

Level 1 (系统分解):
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌──────┐      ╔══════════╗      ╔══════════╗     ┌──────┐ │
│  │ 用户 │ ───> ║ Web前端  ║ ───> ║ API服务  ║ ──> │ 支付 │ │
│  └──────┘      ╚══════════╝      ╚════╤═════╝     │ 网关 │ │
│                                       │           └──────┘ │
│                                       ▼                    │
│                                 ═══════════                │
│                                 │ 订单库  │                │
│                                 ═══════════                │
└────────────────────────────────────────────────────────────┘

Level 2 (组件详细分析):
进一步分解API服务的内部组件...
```

### DFD实战示例

以典型的微服务电商系统为例：

```
                     ┌─────────────────────────────────────────────────┐
                     │                  互联网（不可信）                │
                     └─────────────────────────────────────────────────┘
                                            │
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ DMZ                                       ▼                        │
│                                   ╔═══════════════╗                │
│  ┌─────────┐    HTTPS            ║    API网关    ║                │
│  │  用户   │ ──────────────────> ║  (认证/限流)   ║                │
│  │ (浏览器)│                     ╚═══════╤═══════╝                │
│  └─────────┘                             │                         │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                                           │ gRPC/mTLS
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ 内部网络                                  │                        │
│                      ┌────────────────────┼────────────────────┐   │
│                      │                    │                    │   │
│                      ▼                    ▼                    ▼   │
│              ╔═══════════════╗    ╔═══════════════╗    ╔════════╗  │
│              ║   用户服务    ║    ║   订单服务    ║    ║ 支付   ║  │
│              ╚═══════╤═══════╝    ╚═══════╤═══════╝    ║ 服务   ║  │
│                      │                    │            ╚════╤═══╝  │
│                      ▼                    ▼                 │      │
│               ═══════════          ═══════════              │      │
│               │ 用户DB │          │ 订单DB  │              │      │
│               ═══════════          ═══════════              │      │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ┘
                                                              │
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ┐
│ 外部服务                                                    │      │
│                                                             ▼      │
│                                                       ┌─────────┐  │
│                                                       │  支付   │  │
│                                                       │  网关   │  │
│                                                       └─────────┘  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

信任边界：
- - - - DMZ边界：互联网与内部网络的分界
- - - - 服务边界：不同微服务之间的边界
- - - - 外部边界：与第三方服务的边界
```

## 攻击树

攻击树是一种树状结构，用于系统化地描述对系统的攻击方式。

### 攻击树基本结构

```
攻击树结构说明：
- 根节点：攻击者的最终目标
- 分支节点：实现目标的子目标或方法
- 叶节点：具体的攻击手段
- AND节点：所有子节点条件都必须满足
- OR节点：任一子节点条件满足即可
```

### 攻击树示例：窃取用户凭证

```
                    ┌──────────────────────────┐
                    │   窃取用户登录凭证 (OR)   │
                    └────────────┬─────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  网络攻击 (OR)   │    │  客户端攻击(OR) │    │  服务端攻击(OR) │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
    ┌────┴────┐            ┌────┴────┐            ┌────┴────┐
    │         │            │         │            │         │
    ▼         ▼            ▼         ▼            ▼         ▼
┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐
│中间人 │ │DNS欺 │   │钓鱼   │ │键盘记 │   │SQL注  │ │暴力破 │
│攻击   │ │骗    │   │攻击   │ │录器   │   │入     │ │解     │
└───────┘ └───────┘   └───────┘ └───────┘   └───────┘ └───────┘

风险评估（示例）：
┌───────────────┬────────┬────────┬────────┬────────┐
│ 攻击方式      │ 难度   │ 成本   │ 检测率 │ 风险值 │
├───────────────┼────────┼────────┼────────┼────────┤
│ 钓鱼攻击      │ 低     │ 低     │ 中     │ 高     │
│ SQL注入       │ 中     │ 低     │ 中     │ 高     │
│ 中间人攻击    │ 高     │ 中     │ 高     │ 中     │
│ 暴力破解      │ 中     │ 低     │ 高     │ 中     │
│ 键盘记录器    │ 高     │ 中     │ 中     │ 中     │
└───────────────┴────────┴────────┴────────┴────────┘
```

### 攻击树示例：权限提升

```
                    ┌─────────────────────────────┐
                    │   获取管理员权限 (OR)        │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 利用应用漏洞(OR)│      │  社会工程(OR)   │      │ 利用配置错误(OR)│
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
    ┌────┼────┐              ┌────┼────┐              ┌────┼────┐
    │    │    │              │    │    │              │    │    │
    ▼    ▼    ▼              ▼    ▼    ▼              ▼    ▼    ▼
┌─────┐┌────┐┌─────┐   ┌─────┐┌────┐┌─────┐   ┌─────┐┌────┐┌─────┐
│IDOR ││反序││权限 │   │冒充 ││钓鱼││内部 │   │默认 ││错误││过期 │
│漏洞 ││列化││绕过 │   │管理 ││管理││威胁 │   │凭证 ││ACL ││账户 │
└─────┘└────┘└─────┘   │员   ││员  │└─────┘   └─────┘└────┘└─────┘
                       └─────┘└────┘
```

## 识别威胁

### 威胁识别流程

```
Step 1: 资产识别
    │   - 数据资产（用户数据、交易数据、日志）
    │   - 系统资产（服务器、数据库、API）
    │   - 人员资产（开发人员、运维人员）
    ▼
Step 2: 入口点分析
    │   - 网络入口（API端点、WebSocket）
    │   - 用户输入（表单、文件上传）
    │   - 第三方集成（OAuth、Webhook）
    ▼
Step 3: 信任边界识别
    │   - 网络边界（互联网/内网）
    │   - 进程边界（不同权限级别）
    │   - 用户边界（匿名/认证/管理员）
    ▼
Step 4: 威胁枚举
    │   - 应用STRIDE到每个组件
    │   - 分析跨信任边界的数据流
    │   - 考虑威胁代理的动机和能力
    ▼
Step 5: 威胁验证
        - 确认威胁的可行性
        - 排除误报和低风险威胁
```

### STRIDE-per-Element方法

针对DFD中的每个元素类型应用不同的STRIDE威胁：

| 元素类型 | S | T | R | I | D | E |
|----------|---|---|---|---|---|---|
| 外部实体 | * |   | * |   |   |   |
| 进程     | * | * | * | * | * | * |
| 数据存储 |   | * | * | * | * |   |
| 数据流   |   | * |   | * | * |   |

### 威胁模板

使用结构化模板记录威胁：

```
威胁编号: T-001
威胁名称: SQL注入导致用户数据泄露
威胁类型: Information Disclosure, Tampering
威胁描述: 攻击者通过用户搜索功能注入恶意SQL，
         获取数据库中的用户敏感信息
攻击向量: 用户搜索输入 → 搜索API → 数据库查询
前置条件:
  - 搜索功能存在SQL注入漏洞
  - 应用使用字符串拼接构建SQL
受影响资产: 用户数据库
攻击者: 外部攻击者（无需认证）
影响评估:
  - 机密性影响: 高（用户PII泄露）
  - 完整性影响: 高（数据可被篡改）
  - 可用性影响: 中（数据可被删除）
可能性: 高（常见攻击、工具成熟）
风险等级: 严重
缓解措施:
  1. 使用参数化查询
  2. 实施输入验证
  3. 最小权限数据库账户
  4. WAF规则过滤
```

## 风险评估与优先级

### DREAD模型

DREAD是一种风险评分系统，用于量化威胁风险：

| 维度 | 英文 | 描述 | 评分(0-10) |
|------|------|------|------------|
| 破坏力 | Damage | 攻击成功造成的损害程度 | 10=完全破坏 |
| 可重现性 | Reproducibility | 攻击能否稳定重现 | 10=每次成功 |
| 可利用性 | Exploitability | 实施攻击的难度 | 10=极易利用 |
| 受影响用户 | Affected Users | 受影响的用户范围 | 10=所有用户 |
| 可发现性 | Discoverability | 漏洞被发现的难度 | 10=极易发现 |

**风险评分计算**：

```
风险分数 = (D + R + E + A + D) / 5

风险等级划分：
- 0-3: 低风险
- 4-6: 中风险
- 7-8: 高风险
- 9-10: 严重风险
```

**评分示例**：

```
威胁: SQL注入导致数据泄露

Damage:         9 (可获取所有用户数据)
Reproducibility: 8 (稳定可重现)
Exploitability: 7 (存在自动化工具)
Affected Users: 10 (影响所有用户)
Discoverability: 8 (容易通过扫描发现)

风险分数 = (9 + 8 + 7 + 10 + 8) / 5 = 8.4
风险等级 = 高风险
```

### CVSS评分

CVSS（Common Vulnerability Scoring System）是行业标准的漏洞评分系统：

**基础指标组**：

```
攻击向量 (AV):
  Network (N)    - 网络可达
  Adjacent (A)   - 相邻网络
  Local (L)      - 本地访问
  Physical (P)   - 物理接触

攻击复杂度 (AC):
  Low (L)        - 无特殊条件
  High (H)       - 需要特定条件

权限要求 (PR):
  None (N)       - 无需权限
  Low (L)        - 普通用户
  High (H)       - 管理员权限

用户交互 (UI):
  None (N)       - 无需用户交互
  Required (R)   - 需要用户参与

影响范围 (S):
  Unchanged (U)  - 仅影响本组件
  Changed (C)    - 可影响其他组件

机密性影响 (C): None/Low/High
完整性影响 (I): None/Low/High
可用性影响 (A): None/Low/High
```

**CVSS评分示例**：

```
漏洞: 未认证的远程代码执行

CVSS向量: AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H
CVSS分数: 10.0 (Critical)

解读:
- 通过网络可利用
- 无需复杂条件
- 无需任何权限
- 无需用户交互
- 可影响其他组件
- 完全破坏机密性、完整性、可用性
```

### 风险矩阵

使用风险矩阵可视化风险优先级：

```
              影　响
              低      中      高      严重
         ┌────────┬────────┬────────┬────────┐
    高   │   中   │   高   │  严重  │  严重  │
         ├────────┼────────┼────────┼────────┤
可  中   │   低   │   中   │   高   │  严重  │
能  ─────┼────────┼────────┼────────┼────────┤
性  低   │   低   │   低   │   中   │   高   │
         ├────────┼────────┼────────┼────────┤
    极低 │   低   │   低   │   低   │   中   │
         └────────┴────────┴────────┴────────┘

处理优先级:
- 严重: 立即修复，停止发布
- 高:   本迭代内修复
- 中:   计划修复（1-2个迭代）
- 低:   记录并监控
```

## 缓解策略

### 缓解措施分类

```
┌─────────────────────────────────────────────────────────────┐
│                      缓解策略类型                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  预防性控制 (Preventive)                                    │
│  ├─ 输入验证                                                │
│  ├─ 访问控制                                                │
│  ├─ 加密                                                    │
│  └─ 安全配置                                                │
│                                                             │
│  检测性控制 (Detective)                                     │
│  ├─ 日志审计                                                │
│  ├─ 入侵检测                                                │
│  ├─ 异常监控                                                │
│  └─ 安全扫描                                                │
│                                                             │
│  响应性控制 (Responsive)                                    │
│  ├─ 事件响应                                                │
│  ├─ 自动封禁                                                │
│  ├─ 熔断机制                                                │
│  └─ 灾难恢复                                                │
│                                                             │
│  补偿性控制 (Compensating)                                  │
│  ├─ 当主要控制无法实施时的替代方案                          │
│  └─ 例：无法加密时使用网络隔离                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### STRIDE缓解策略对照表

| 威胁类型 | 缓解策略 | 具体措施 |
|----------|----------|----------|
| Spoofing | 认证 | MFA、证书认证、生物识别 |
| Tampering | 完整性保护 | 数字签名、HMAC、加密传输 |
| Repudiation | 审计日志 | 安全日志、区块链存证、时间戳 |
| Info Disclosure | 加密与访问控制 | TLS、静态加密、最小权限 |
| DoS | 可用性设计 | 限流、负载均衡、CDN、冗余 |
| EoP | 授权 | RBAC、最小权限、沙箱隔离 |

### 缓解措施模板

```
威胁编号: T-001
威胁名称: SQL注入导致用户数据泄露

缓解措施:

M-001: 参数化查询 [预防]
  描述: 使用预编译语句和参数化查询
  实施位置: 数据访问层
  有效性: 高（根本解决）
  实施成本: 低
  优先级: P1

M-002: 输入验证 [预防]
  描述: 对所有用户输入进行白名单验证
  实施位置: API层
  有效性: 中（纵深防御）
  实施成本: 中
  优先级: P1

M-003: 最小权限 [预防]
  描述: 数据库账户仅授予必要的表和操作权限
  实施位置: 数据库
  有效性: 中（限制影响）
  实施成本: 低
  优先级: P2

M-004: WAF规则 [检测/预防]
  描述: 部署Web应用防火墙规则过滤SQL注入
  实施位置: 网络边界
  有效性: 中（可能被绕过）
  实施成本: 中
  优先级: P2

M-005: 安全审计日志 [检测]
  描述: 记录所有数据库查询，监控异常
  实施位置: 数据库/应用
  有效性: 中（事后检测）
  实施成本: 低
  优先级: P2

残余风险:
  采用M-001后，SQL注入风险降至极低
  残余风险：应用其他部分可能存在类似问题

接受人: 安全负责人
接受日期: 2024-01-15
```

## 威胁建模工具

### Microsoft Threat Modeling Tool

微软提供的免费威胁建模工具，支持STRIDE方法论：

**主要功能**：
- 可视化DFD绘制
- 自动威胁生成
- 自定义模板
- 报告生成

**使用流程**：

```
1. 创建新模型
   └─ 选择模板（Azure、通用Web等）

2. 绘制数据流图
   ├─ 添加外部实体
   ├─ 添加进程
   ├─ 添加数据存储
   └─ 连接数据流

3. 定义信任边界
   └─ 圈选不同信任域

4. 生成威胁
   └─ 工具自动应用STRIDE

5. 分析与处理
   ├─ 评估每个威胁
   ├─ 确定缓解措施
   └─ 标记状态

6. 生成报告
   └─ 导出HTML/Markdown报告
```

### OWASP Threat Dragon

开源的跨平台威胁建模工具：

```
特点:
- 开源免费
- 跨平台（Web/Desktop）
- 支持STRIDE和CIA
- 与GitHub集成
- JSON格式存储（便于版本控制）

安装:
npm install -g owasp-threat-dragon

使用:
threat-dragon --help
```

### PyTM (Python Threat Modeling)

使用Python代码定义威胁模型：

```python
from pytm import TM, Server, Datastore, Dataflow, Boundary, Actor, Lambda

# 创建威胁模型
tm = TM("电商系统威胁模型")
tm.description = "电商平台核心服务的威胁分析"
tm.isOrdered = True

# 定义边界
internet = Boundary("互联网")
dmz = Boundary("DMZ")
internal = Boundary("内部网络")

# 定义参与者
user = Actor("用户")
user.inBoundary = internet

# 定义服务器和数据存储
api_gateway = Server("API网关")
api_gateway.inBoundary = dmz
api_gateway.isHardened = True
api_gateway.sanitizesInput = True
api_gateway.protocol = "HTTPS"

user_service = Server("用户服务")
user_service.inBoundary = internal
user_service.isHardened = True

user_db = Datastore("用户数据库")
user_db.inBoundary = internal
user_db.isEncrypted = True
user_db.storesPII = True

# 定义数据流
user_to_api = Dataflow(user, api_gateway, "用户请求")
user_to_api.protocol = "HTTPS"
user_to_api.isEncrypted = True

api_to_user_service = Dataflow(api_gateway, user_service, "API调用")
api_to_user_service.protocol = "gRPC"
api_to_user_service.isEncrypted = True

user_service_to_db = Dataflow(user_service, user_db, "数据查询")
user_service_to_db.protocol = "PostgreSQL"
user_service_to_db.isEncrypted = True

# 生成报告
tm.process()
```

### 威胁建模自动化

集成到CI/CD流程的示例：

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

## 代码示例

### 威胁模型数据结构

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
    ACCEPTED = "accepted"  # 接受风险

@dataclass
class Asset:
    """系统资产"""
    id: str
    name: str
    description: str
    asset_type: str  # data, system, person
    criticality: RiskLevel
    owner: str

@dataclass
class TrustBoundary:
    """信任边界"""
    id: str
    name: str
    description: str
    trust_level: int  # 0-10, 10为最高信任

@dataclass
class DataFlow:
    """数据流"""
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
    """DREAD风险评分"""
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
    """缓解措施"""
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
    """威胁"""
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
    """威胁模型"""
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
        """获取严重威胁"""
        return [t for t in self.threats
                if t.risk_level == RiskLevel.CRITICAL]

    def get_unmitigated_threats(self) -> List[Threat]:
        """获取未缓解的威胁"""
        return [t for t in self.threats
                if t.status == "open" and not t.mitigations]

    def calculate_overall_risk(self) -> float:
        """计算整体风险分数"""
        if not self.threats:
            return 0.0
        return sum(t.dread_score.total for t in self.threats) / len(self.threats)
```

### 威胁模型分析器

```python
from typing import Dict, List, Tuple
import json

class ThreatModelAnalyzer:
    """威胁模型分析器"""

    # STRIDE威胁映射到元素类型
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
        """分析STRIDE覆盖情况"""
        coverage = {t.value: [] for t in ThreatType}

        for threat in self.model.threats:
            coverage[threat.threat_type.value].append(threat.id)

        return coverage

    def find_gaps(self) -> Dict[str, List[str]]:
        """发现威胁建模差距"""
        gaps = {
            "uncovered_assets": [],
            "uncovered_dataflows": [],
            "boundary_crossing_risks": [],
            "missing_mitigations": []
        }

        # 检查未覆盖的资产
        covered_assets = set()
        for threat in self.model.threats:
            covered_assets.update(threat.affected_assets)

        for asset in self.model.assets:
            if asset.id not in covered_assets:
                gaps["uncovered_assets"].append(asset.id)

        # 检查跨信任边界的数据流
        for dataflow in self.model.data_flows:
            if dataflow.crosses_boundary and not dataflow.is_encrypted:
                gaps["boundary_crossing_risks"].append(
                    f"{dataflow.id}: 跨越{dataflow.crosses_boundary}但未加密"
                )

        # 检查缺少缓解措施的高风险威胁
        for threat in self.model.threats:
            if (threat.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
                and not threat.mitigations):
                gaps["missing_mitigations"].append(threat.id)

        return gaps

    def generate_stride_threats(self, element_type: str,
                                 element_name: str) -> List[Dict]:
        """为指定元素自动生成STRIDE威胁"""
        applicable_threats = self.STRIDE_ELEMENT_MAPPING.get(element_type, [])
        generated_threats = []

        threat_templates = {
            "SPOOFING": {
                "name": f"欺骗{element_name}",
                "description": f"攻击者可能冒充{element_name}与系统交互"
            },
            "TAMPERING": {
                "name": f"篡改{element_name}数据",
                "description": f"攻击者可能恶意修改{element_name}的数据"
            },
            "REPUDIATION": {
                "name": f"{element_name}操作抵赖",
                "description": f"{element_name}可能否认执行过的操作"
            },
            "INFO_DISCLOSURE": {
                "name": f"{element_name}信息泄露",
                "description": f"{element_name}可能暴露敏感信息"
            },
            "DOS": {
                "name": f"{element_name}拒绝服务",
                "description": f"攻击者可能使{element_name}不可用"
            },
            "ELEVATION": {
                "name": f"通过{element_name}提权",
                "description": f"攻击者可能通过{element_name}获取更高权限"
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
        """威胁优先级排序"""
        prioritized = []

        for threat in self.model.threats:
            score = threat.dread_score.total

            # 调整因素
            if threat.status == "open":
                score *= 1.2  # 未处理的威胁优先级更高

            # 检查是否影响关键资产
            critical_assets = [a for a in self.model.assets
                             if a.criticality == RiskLevel.CRITICAL]
            for asset in critical_assets:
                if asset.id in threat.affected_assets:
                    score *= 1.3
                    break

            # 确定处理建议
            if score >= 9:
                action = "立即修复 - 阻止发布"
            elif score >= 7:
                action = "本迭代内修复"
            elif score >= 4:
                action = "计划修复（1-2迭代）"
            else:
                action = "记录并监控"

            prioritized.append((threat, action, score))

        # 按分数降序排序
        prioritized.sort(key=lambda x: x[2], reverse=True)

        return [(t, a) for t, a, _ in prioritized]

    def generate_report(self) -> str:
        """生成威胁模型报告"""
        report = []
        report.append(f"# {self.model.name} - 威胁模型报告\n")
        report.append(f"版本: {self.model.version}")
        report.append(f"日期: {self.model.last_updated.strftime('%Y-%m-%d')}")
        report.append(f"负责人: {self.model.owner}\n")

        # 执行摘要
        report.append("## 执行摘要\n")
        report.append(f"- 总威胁数: {len(self.model.threats)}")
        report.append(f"- 严重威胁: {len(self.get_threats_by_level(RiskLevel.CRITICAL))}")
        report.append(f"- 高危威胁: {len(self.get_threats_by_level(RiskLevel.HIGH))}")
        report.append(f"- 整体风险分数: {self.model.calculate_overall_risk():.1f}/10\n")

        # 差距分析
        gaps = self.find_gaps()
        if any(gaps.values()):
            report.append("## 发现的差距\n")
            for gap_type, items in gaps.items():
                if items:
                    report.append(f"### {gap_type}")
                    for item in items:
                        report.append(f"- {item}")
            report.append("")

        # 优先级列表
        report.append("## 威胁优先级\n")
        report.append("| 威胁 | 类型 | 风险分数 | 建议 |")
        report.append("|------|------|----------|------|")

        for threat, action in self.prioritize_threats():
            report.append(
                f"| {threat.name} | {threat.threat_type.value} | "
                f"{threat.dread_score.total:.1f} | {action} |"
            )

        return "\n".join(report)

    def get_threats_by_level(self, level: RiskLevel) -> List[Threat]:
        """按风险等级获取威胁"""
        return [t for t in self.model.threats if t.risk_level == level]
```

### 攻击树生成器

```python
from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

class NodeType(Enum):
    AND = "AND"
    OR = "OR"
    LEAF = "LEAF"

@dataclass
class AttackTreeNode:
    """攻击树节点"""
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
        """计算风险分数"""
        difficulty_scores = {"low": 3, "medium": 2, "high": 1}
        cost_scores = {"low": 3, "medium": 2, "high": 1}
        detection_scores = {"low": 3, "medium": 2, "high": 1}

        score = (difficulty_scores[self.difficulty] +
                cost_scores[self.cost] +
                detection_scores[self.detection_risk]) / 3

        if not self.children:
            return score

        if self.node_type == NodeType.AND:
            # AND节点：取子节点分数的最小值（最难实现的路径）
            child_scores = [c.calculate_risk_score() for c in self.children]
            return min(child_scores) if child_scores else score
        else:
            # OR节点：取子节点分数的最大值（最容易的路径）
            child_scores = [c.calculate_risk_score() for c in self.children]
            return max(child_scores) if child_scores else score

class AttackTreeBuilder:
    """攻击树构建器"""

    def __init__(self):
        self.trees = {}

    def create_tree(self, goal: str, description: str) -> AttackTreeNode:
        """创建新的攻击树"""
        root = AttackTreeNode(
            id=f"AT-{len(self.trees) + 1}",
            name=goal,
            description=description,
            node_type=NodeType.OR  # 根节点通常是OR
        )
        self.trees[root.id] = root
        return root

    def build_credential_theft_tree(self) -> AttackTreeNode:
        """构建凭证窃取攻击树"""
        root = self.create_tree(
            "窃取用户凭证",
            "获取合法用户的登录凭证"
        )

        # 网络攻击分支
        network_attack = AttackTreeNode(
            id="AT-1.1",
            name="网络攻击",
            description="通过网络层面获取凭证",
            node_type=NodeType.OR
        )

        mitm = AttackTreeNode(
            id="AT-1.1.1",
            name="中间人攻击",
            description="拦截用户与服务器之间的通信",
            node_type=NodeType.AND,
            difficulty="high",
            cost="medium",
            detection_risk="medium",
            mitigations=["强制HTTPS", "HSTS", "证书固定"]
        )

        dns_spoofing = AttackTreeNode(
            id="AT-1.1.2",
            name="DNS欺骗",
            description="劫持DNS解析将用户导向恶意服务器",
            node_type=NodeType.LEAF,
            difficulty="high",
            cost="low",
            detection_risk="low",
            mitigations=["DNSSEC", "DNS over HTTPS"]
        )

        network_attack.add_child(mitm)
        network_attack.add_child(dns_spoofing)

        # 客户端攻击分支
        client_attack = AttackTreeNode(
            id="AT-1.2",
            name="客户端攻击",
            description="攻击用户端获取凭证",
            node_type=NodeType.OR
        )

        phishing = AttackTreeNode(
            id="AT-1.2.1",
            name="钓鱼攻击",
            description="诱骗用户在假冒页面输入凭证",
            node_type=NodeType.LEAF,
            difficulty="low",
            cost="low",
            detection_risk="medium",
            mitigations=["用户安全意识培训", "邮件安全网关", "FIDO2/WebAuthn"]
        )

        keylogger = AttackTreeNode(
            id="AT-1.2.2",
            name="键盘记录",
            description="在用户设备上安装键盘记录程序",
            node_type=NodeType.AND,
            difficulty="medium",
            cost="medium",
            detection_risk="medium",
            mitigations=["端点保护", "应用白名单"]
        )

        client_attack.add_child(phishing)
        client_attack.add_child(keylogger)

        # 服务端攻击分支
        server_attack = AttackTreeNode(
            id="AT-1.3",
            name="服务端攻击",
            description="攻击服务器获取凭证",
            node_type=NodeType.OR
        )

        sql_injection = AttackTreeNode(
            id="AT-1.3.1",
            name="SQL注入",
            description="通过SQL注入获取用户表数据",
            node_type=NodeType.LEAF,
            difficulty="medium",
            cost="low",
            detection_risk="medium",
            mitigations=["参数化查询", "WAF", "最小权限"]
        )

        brute_force = AttackTreeNode(
            id="AT-1.3.2",
            name="暴力破解",
            description="尝试常见密码组合",
            node_type=NodeType.LEAF,
            difficulty="low",
            cost="low",
            detection_risk="high",
            mitigations=["账户锁定", "验证码", "密码策略"]
        )

        server_attack.add_child(sql_injection)
        server_attack.add_child(brute_force)

        # 组装树
        root.add_child(network_attack)
        root.add_child(client_attack)
        root.add_child(server_attack)

        return root

    def to_mermaid(self, node: AttackTreeNode, level: int = 0) -> str:
        """将攻击树转换为Mermaid图表格式"""
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
            lines.extend(self.to_mermaid(child, level + 1)[1:])  # 跳过mermaid头

        if level == 0:
            lines.append("```")

        return "\n".join(lines)

    def analyze_attack_paths(self, node: AttackTreeNode,
                            current_path: List[str] = None) -> List[List[str]]:
        """分析所有可能的攻击路径"""
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
        """找出最容易被利用的攻击路径"""
        paths = self.analyze_attack_paths(node)

        path_scores = []
        for path in paths:
            # 简化评分：假设每个节点都有difficulty属性
            score = len(path)  # 简化为路径长度
            path_scores.append((path, score))

        # 返回最短路径（最容易的攻击）
        path_scores.sort(key=lambda x: x[1])
        return path_scores[0] if path_scores else ([], 0)
```

## 最佳实践

### 威胁建模流程

```
1. 准备阶段
   ├─ 组建团队（开发、安全、架构、产品）
   ├─ 收集文档（架构图、需求文档、API规范）
   └─ 确定范围（哪些系统、功能需要分析）

2. 建模阶段
   ├─ 绘制数据流图
   ├─ 标识信任边界
   ├─ 识别资产和入口点
   └─ 审核模型完整性

3. 威胁识别
   ├─ 应用STRIDE等方法论
   ├─ 考虑每个组件的威胁
   ├─ 关注跨边界数据流
   └─ 使用攻击树深入分析

4. 风险评估
   ├─ 使用DREAD或CVSS评分
   ├─ 考虑业务影响
   ├─ 确定风险优先级
   └─ 识别可接受的风险

5. 制定缓解策略
   ├─ 设计缓解控制
   ├─ 分配责任人
   ├─ 设定时间表
   └─ 评估残余风险

6. 验证与迭代
   ├─ 验证缓解措施有效性
   ├─ 更新威胁模型
   ├─ 定期重新评估
   └─ 跟踪威胁状态
```

### 常见错误

| 错误 | 影响 | 正确做法 |
|------|------|----------|
| 只在项目初期做一次 | 无法应对变更带来的新威胁 | 持续更新威胁模型 |
| 过于关注技术细节 | 忽略业务风险和人为因素 | 结合业务影响分析 |
| 仅由安全团队完成 | 缺少开发和业务视角 | 跨职能团队协作 |
| 威胁列表过于庞大 | 资源分散，重点不突出 | 聚焦高优先级威胁 |
| 忽略第三方组件 | 供应链攻击风险 | 评估所有依赖项 |
| 不更新历史威胁状态 | 无法追踪改进进度 | 维护威胁跟踪系统 |

### 与SDLC集成

```
需求阶段:
├─ 安全需求分析
├─ 初步威胁建模
└─ 定义安全边界

设计阶段:
├─ 详细威胁建模
├─ 架构安全评审
└─ 制定安全设计方案

开发阶段:
├─ 安全编码实践
├─ 威胁缓解实施
└─ 代码安全扫描

测试阶段:
├─ 安全测试（SAST/DAST）
├─ 渗透测试验证威胁
└─ 更新威胁模型

部署阶段:
├─ 安全配置审查
├─ 最终威胁评估
└─ 上线前安全检查

运维阶段:
├─ 监控与告警
├─ 事件响应
└─ 定期威胁评估更新
```

## 面试要点

### 常见面试问题

**Q1: 什么是威胁建模？为什么重要？**

威胁建模是一种系统化识别和评估安全威胁的方法。重要性在于：
1. 在设计阶段发现问题，修复成本最低
2. 帮助团队理解系统安全需求
3. 提供风险优先级指导资源分配
4. 满足合规要求

**Q2: 解释STRIDE模型及其每个威胁类型**

STRIDE代表六种威胁类型：
- Spoofing（欺骗）：冒充其他身份
- Tampering（篡改）：恶意修改数据
- Repudiation（抵赖）：否认执行的操作
- Information Disclosure（信息泄露）：暴露敏感信息
- Denial of Service（拒绝服务）：使系统不可用
- Elevation of Privilege（权限提升）：获取未授权权限

**Q3: DREAD评分系统如何工作？**

DREAD通过五个维度评估风险：
- Damage：攻击造成的损害
- Reproducibility：攻击的可重复性
- Exploitability：利用难度
- Affected Users：受影响用户范围
- Discoverability：漏洞发现难度

每个维度0-10分，平均值为最终风险分数。

**Q4: 数据流图的主要元素有哪些？**

DFD包含五个基本元素：
- 外部实体：系统外部的参与者
- 进程：处理数据的组件
- 数据存储：存储数据的位置
- 数据流：数据在元素间的流动
- 信任边界：不同信任级别的分界线

**Q5: 什么是攻击树？如何使用？**

攻击树是一种图形化方法，用树状结构表示实现攻击目标的所有可能路径。根节点是攻击目标，分支表示实现该目标的不同方法，叶节点是具体攻击手段。AND节点表示所有条件必须满足，OR节点表示任一条件满足即可。

**Q6: 如何将威胁建模集成到敏捷开发？**

关键实践：
1. 初始迭代进行高层次威胁建模
2. 每个Sprint评估新功能的安全影响
3. 将安全任务纳入Backlog
4. 使用轻量级威胁建模工具
5. 定期回顾和更新威胁模型
6. 安全团队参与Sprint计划

## 延伸阅读

### 官方资源

- [Microsoft SDL威胁建模](https://www.microsoft.com/en-us/securityengineering/sdl/threatmodeling)
- [OWASP威胁建模](https://owasp.org/www-community/Threat_Modeling)
- [NIST网络安全框架](https://www.nist.gov/cyberframework)

### 推荐书籍

- 《Threat Modeling: Designing for Security》- Adam Shostack
- 《Risk Centric Threat Modeling》- Tony UcedaVelez
- 《Threat Modeling》- Izar Tarandach & Matthew Coles

### 工具资源

- [Microsoft Threat Modeling Tool](https://aka.ms/threatmodelingtool)
- [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/)
- [PyTM](https://github.com/izar/pytm)
- [Threagile](https://threagile.io/)

### 学习资源

- [SAFECode Threat Modeling Guide](https://safecode.org/publication/SAFECode_TM_Whitepaper.pdf)
- [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/)
- [STRIDE Threat Modeling](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
