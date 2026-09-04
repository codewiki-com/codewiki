---
title: 安全事件响应
description: 学习安全事件响应流程和最佳实践
track: security
section: infra-security
difficulty: intermediate
tags:
  - 事件响应
  - 安全运维
  - SOC
  - 取证
status: imported
origin: old/src/content/docs/security/incident-response.zh.md
divergence: 0.228
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: security
  subcategory: ""
  order: 12
  lastUpdated: 2026-01-07
---

在当今的威胁环境中，安全事件是不可避免的。无论是数据泄露、恶意软件感染、拒绝服务攻击还是内部威胁，组织都必须准备好有效地检测、响应和恢复安全事件。本综合指南涵盖事件响应生命周期、准备策略、检测和分析技术、遏制程序、根除和恢复流程、经验教训实践、剧本开发和必要的工具。

## 理解事件响应

事件响应（IR）是一种系统化方法，用于准备、检测、遏制和恢复安全事件。一个结构良好的IR计划可以最小化损害、减少恢复时间和成本，并通过持续改进帮助防止未来事件的发生。

### 为什么事件响应很重要

没有成熟事件响应能力的组织面临重大风险：

- 延长的驻留时间允许攻击者造成更多损害
- 因事件持续导致的财务损失增加
- 因响应程序不足而面临的监管罚款
- 处理不当泄露导致的声誉损害
- 客户信任和商业机会的丧失

```
事件响应价值链：
+------------------+     +------------------+     +------------------+
|   准备阶段       |     |   检测和分析     |     |   遏制阶段       |
|                  |---->|                  |---->|                  |
| - 计划/剧本      |     | - 监控           |     | - 短期措施       |
| - 团队培训       |     | - 分类           |     | - 长期措施       |
| - 工具选择       |     | - 调查           |     | - 证据           |
+------------------+     +------------------+     +------------------+
         ^                                              |
         |                                              v
+------------------+     +------------------+     +------------------+
|   经验教训       |     |   恢复阶段       |     |   根除阶段       |
|                  |<----|                  |<----|                  |
| - 事后分析       |     | - 系统恢复       |     | - 根本原因       |
| - 改进方案       |     | - 验证           |     | - 恶意软件移除   |
| - 文档记录       |     | - 监控           |     | - 漏洞修复       |
+------------------+     +------------------+     +------------------+
```

## 事件响应生命周期

如NIST特别公报800-61中定义的事件响应生命周期包括四个主要阶段。理解每个阶段对于建立有效的IR计划至关重要。

### 第一阶段：准备

准备是有效事件响应的基础。此阶段涉及建立和培训事件响应团队、制定政策和程序，以及部署必要的工具和基础设施。

**关键准备活动：**

```yaml
# 事件响应准备核对清单
preparation:
  team:
    - 识别并培训IR团队成员
    - 定义角色和职责
    - 建立上报程序
    - 创建待命轮转计划
    - 进行定期培训和演练

  documentation:
    - 制定IR政策和程序
    - 创建事件分类标准
    - 记录沟通模板
    - 维护联系人列表（内部/外部）
    - 建立证据处理程序

  infrastructure:
    - 部署SIEM和监控工具
    - 配置日志聚合
    - 设置取证工作站
    - 建立安全通信渠道
    - 创建隔离分析环境

  relationships:
    - 识别法律顾问
    - 建立执法机构联系
    - 与IR服务提供商签约
    - 与PR/通讯团队协调
    - 建立供应商支持关系
```

**事件响应团队结构：**

```
事件响应团队组织：
+-------------------------------------------------------------------------+
|                        IR指导委员会                                     |
|  (CISO, 法务, HR, 通讯, 业务部门负责人)                                  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        IR团队负责人/经理                                 |
|  - 整体事件协调                                                          |
|  - 利益相关者沟通                                                        |
|  - 资源分配                                                              |
+-------------------------------------------------------------------------+
          |                         |                         |
          v                         v                         v
+-------------------+   +-------------------+   +-------------------+
|   分类团队        |   |  分析团队         |   |  恢复团队         |
| - 初步评估        |   | - 深度取证        |   | - 系统恢复        |
| - 警报处理        |   | - 恶意软件分析    |   | - 修补/加固       |
| - 分类            |   | - 时间轴建立      |   | - 验证            |
+-------------------+   +-------------------+   +-------------------+
          |                         |                         |
          v                         v                         v
+-------------------------------------------------------------------------+
|                     支持功能                                              |
| - 法务 (合规性, 责任)          - HR (内部威胁)                            |
| - 通讯 (PR, 客户)              - IT运维 (基础设施)                        |
| - 业务部门 (影响评估)          - 外部 (执法部门, IR)                      |
+-------------------------------------------------------------------------+
```

**事件分类框架：**

```python
# 事件严重程度分类系统
class IncidentSeverity:
    """
    基于影响和紧急性的事件严重程度级别。
    """

    SEVERITY_LEVELS = {
        'critical': {
            'level': 1,
            'description': '业务关键系统已被攻破',
            'response_time': '15分钟',
            'examples': [
                '主动数据外泄',
                '勒索软件传播',
                '核心基础设施被攻破',
                '客户数据泄露确认'
            ],
            'escalation': ['CISO', 'CEO', '法务', '董事会'],
            'notification': '立即'
        },
        'high': {
            'level': 2,
            'description': '对运营或数据造成重大影响',
            'response_time': '1小时',
            'examples': [
                '多个系统上的恶意软件',
                '未授权的特权访问',
                '影响服务的DDoS',
                '怀疑的数据泄露'
            ],
            'escalation': ['CISO', 'IT总监', '法务'],
            'notification': '1小时内'
        },
        'medium': {
            'level': 3,
            'description': '影响有限，威胁已被遏制',
            'response_time': '4小时',
            'examples': [
                '单个系统恶意软件',
                '网络钓鱼与凭证盗窃',
                '未授权访问尝试',
                '政策违规'
            ],
            'escalation': ['安全经理', 'IT经理'],
            'notification': '4小时内'
        },
        'low': {
            'level': 4,
            'description': '影响最小，常规处理',
            'response_time': '24小时',
            'examples': [
                '失败的攻击尝试',
                '轻微政策违规',
                '可疑但未确认的活动',
                '未被利用的漏洞'
            ],
            'escalation': ['SOC负责人'],
            'notification': '下一工作日'
        }
    }

    @classmethod
    def classify_incident(cls, impact_score, urgency_score):
        """
        根据影响和紧急性确定严重程度。
        影响：数据敏感性、受影响系统、业务关键性
        紧急性：活跃威胁、传播、时间敏感
        """
        combined_score = (impact_score + urgency_score) / 2

        if combined_score >= 9:
            return 'critical'
        elif combined_score >= 7:
            return 'high'
        elif combined_score >= 4:
            return 'medium'
        else:
            return 'low'

    @classmethod
    def get_response_procedures(cls, severity):
        """获取严重程度级别的响应程序。"""
        return cls.SEVERITY_LEVELS.get(severity, cls.SEVERITY_LEVELS['medium'])
```

### 第二阶段：检测和分析

检测和分析通常是最具挑战性的阶段。它需要识别已发生事件、理解其范围和影响，并收集证据以供响应和潜在的法律诉讼使用。

**检测来源：**

```python
# 常见检测来源及其特征
class DetectionSources:
    """
    事件检测来源的分类。
    """

    SOURCES = {
        'automated': {
            'siem_alerts': {
                'description': '安全信息和事件管理警报',
                'strengths': ['24/7监控', '关联分析', '历史数据'],
                'weaknesses': ['误报', '需要调优'],
                'typical_detections': [
                    '暴力破解攻击',
                    '异常访问模式',
                    '已知攻击签名',
                    '政策违规'
                ]
            },
            'ids_ips': {
                'description': '入侵检测/防御系统',
                'strengths': ['网络可见性', '实时阻止'],
                'weaknesses': ['加密流量', '基于签名的局限'],
                'typical_detections': [
                    '网络攻击',
                    '漏洞利用尝试',
                    '恶意载荷',
                    'C2通讯'
                ]
            },
            'edr': {
                'description': '端点检测和响应',
                'strengths': ['行为分析', '进程可见性'],
                'weaknesses': ['端点覆盖', '资源密集'],
                'typical_detections': [
                    '恶意软件执行',
                    '无文件攻击',
                    '横向移动',
                    '权限提升'
                ]
            },
            'dlp': {
                'description': '数据丢失防护',
                'strengths': ['以数据为中心', '政策执行'],
                'weaknesses': ['误报', '加密盲点'],
                'typical_detections': [
                    '数据外泄',
                    '政策违规',
                    '未授权共享',
                    '敏感数据暴露'
                ]
            }
        },
        'human': {
            'user_reports': {
                'description': '来自员工或客户的报告',
                'strengths': ['上下文感知', '新颖检测'],
                'weaknesses': ['不一致', '延迟报告'],
                'typical_detections': [
                    '网络钓鱼邮件',
                    '可疑行为',
                    '社会工程',
                    '物理安全问题'
                ]
            },
            'threat_hunting': {
                'description': '主动搜索威胁',
                'strengths': ['发现高级威胁', '假设驱动'],
                'weaknesses': ['资源密集', '需要专业知识'],
                'typical_detections': [
                    'APT活动',
                    '利用地方工具',
                    '内部威胁',
                    '新型攻击技术'
                ]
            },
            'third_party': {
                'description': '外部通知',
                'strengths': ['外部视角', '威胁情报'],
                'weaknesses': ['需要验证', '延迟'],
                'typical_detections': [
                    '暗网上的数据',
                    '品牌滥用',
                    '泄露凭证',
                    '特定行业威胁'
                ]
            }
        }
    }
```

**初步分类流程：**

```python
import json
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

class IncidentStatus(Enum):
    NEW = "new"
    TRIAGING = "triaging"
    ANALYZING = "analyzing"
    CONTAINING = "containing"
    ERADICATING = "eradicating"
    RECOVERING = "recovering"
    CLOSED = "closed"

@dataclass
class IncidentTicket:
    """
    事件跟踪票据结构。
    """
    incident_id: str
    title: str
    description: str
    severity: str
    status: IncidentStatus
    detection_source: str
    detection_time: datetime
    affected_systems: List[str] = field(default_factory=list)
    affected_users: List[str] = field(default_factory=list)
    indicators: Dict[str, List[str]] = field(default_factory=dict)
    timeline: List[Dict[str, Any]] = field(default_factory=list)
    assigned_to: Optional[str] = None

    def add_timeline_entry(self, action: str, details: str, analyst: str):
        """添加事件时间轴条目。"""
        self.timeline.append({
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'details': details,
            'analyst': analyst
        })

    def add_indicator(self, ioc_type: str, value: str):
        """添加折衷指示器。"""
        if ioc_type not in self.indicators:
            self.indicators[ioc_type] = []
        if value not in self.indicators[ioc_type]:
            self.indicators[ioc_type].append(value)

    def escalate(self, new_severity: str, reason: str, analyst: str):
        """上报事件严重程度。"""
        old_severity = self.severity
        self.severity = new_severity
        self.add_timeline_entry(
            'escalation',
            f'从{old_severity}上报到{new_severity}：{reason}',
            analyst
        )


class IncidentTriage:
    """
    初步事件分类和分析程序。
    """

    TRIAGE_QUESTIONS = [
        {
            'category': 'identification',
            'questions': [
                '这是什么类型的事件？',
                '首次检测时间是什么时候？',
                '如何检测到的？',
                '谁报告的？'
            ]
        },
        {
            'category': 'scope',
            'questions': [
                '哪些系统受到影响？',
                '哪些数据可能受影响？',
                '有多少用户受影响？',
                '事件是在进行中还是已被遏制？'
            ]
        },
        {
            'category': 'impact',
            'questions': [
                '业务影响是什么？',
                '关键服务是否受影响？',
                '是否存在监管风险？',
                '潜在的数据丢失是多少？'
            ]
        },
        {
            'category': 'attribution',
            'questions': [
                '这是外部还是内部威胁？',
                '是否有已知的威胁参与者指标？',
                '可能的动机是什么？',
                '这是有针对性的还是机会性的？'
            ]
        }
    ]

    @staticmethod
    def perform_initial_triage(alert_data: dict) -> IncidentTicket:
        """
        对警报执行初步分类。
        """
        # 创建事件票据
        incident = IncidentTicket(
            incident_id=f"INC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            title=alert_data.get('title', '安全事件'),
            description=alert_data.get('description', ''),
            severity='medium',  # 默认值，待评估
            status=IncidentStatus.TRIAGING,
            detection_source=alert_data.get('source', 'unknown'),
            detection_time=datetime.utcnow()
        )

        # 提取初步指示器
        if 'indicators' in alert_data:
            for ioc_type, values in alert_data['indicators'].items():
                for value in values:
                    incident.add_indicator(ioc_type, value)

        # 添加初步时间轴条目
        incident.add_timeline_entry(
            'triage_started',
            '初步分类流程已启动',
            'system'
        )

        return incident

    @staticmethod
    def assess_severity(incident: IncidentTicket, assessment: dict) -> str:
        """
        基于影响因素评估事件严重程度。
        """
        # 影响评分因素
        data_sensitivity = assessment.get('data_sensitivity', 1)  # 1-10
        system_criticality = assessment.get('system_criticality', 1)  # 1-10
        user_impact = assessment.get('user_impact', 1)  # 1-10
        business_impact = assessment.get('business_impact', 1)  # 1-10

        # 紧急程度评分因素
        is_active = assessment.get('is_active', False)
        is_spreading = assessment.get('is_spreading', False)
        regulatory_exposure = assessment.get('regulatory_exposure', False)

        # 计算影响分数
        impact_score = (
            data_sensitivity * 0.3 +
            system_criticality * 0.3 +
            user_impact * 0.2 +
            business_impact * 0.2
        )

        # 计算紧急程度分数
        urgency_score = 5  # 基础分数
        if is_active:
            urgency_score += 2
        if is_spreading:
            urgency_score += 2
        if regulatory_exposure:
            urgency_score += 1

        return IncidentSeverity.classify_incident(impact_score, urgency_score)
```

**证据收集框架：**

```python
import hashlib
import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Tuple

class EvidenceCollector:
    """
    数字证据收集和监管链管理。
    """

    def __init__(self, case_id: str, evidence_root: str):
        self.case_id = case_id
        self.evidence_root = Path(evidence_root) / case_id
        self.chain_of_custody: List[dict] = []
        self._initialize_evidence_directory()

    def _initialize_evidence_directory(self):
        """创建证据目录结构。"""
        directories = [
            'disk_images',
            'memory_dumps',
            'network_captures',
            'logs',
            'malware_samples',
            'screenshots',
            'documents'
        ]

        for directory in directories:
            (self.evidence_root / directory).mkdir(parents=True, exist_ok=True)

        # 创建监管链日志
        self._log_custody_event(
            action='case_created',
            details=f'为案件{self.case_id}初始化证据库'
        )

    def _calculate_hash(self, file_path: Path) -> Tuple[str, str]:
        """计算文件的MD5和SHA256哈希。"""
        md5_hash = hashlib.md5()
        sha256_hash = hashlib.sha256()

        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                md5_hash.update(chunk)
                sha256_hash.update(chunk)

        return md5_hash.hexdigest(), sha256_hash.hexdigest()

    def _log_custody_event(self, action: str, details: str,
                          evidence_id: str = None, analyst: str = 'system'):
        """记录监管链事件。"""
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'details': details,
            'evidence_id': evidence_id,
            'analyst': analyst,
            'case_id': self.case_id
        }
        self.chain_of_custody.append(event)

        # 写入监管日志文件
        log_file = self.evidence_root / 'chain_of_custody.log'
        with open(log_file, 'a') as f:
            f.write(f"{event}\n")

    def collect_file(self, source_path: str, category: str,
                    description: str, analyst: str) -> dict:
        """
        收集文件作为证据并进行适当文档记录。
        """
        source = Path(source_path)
        if not source.exists():
            raise FileNotFoundError(f"证据来源未找到：{source_path}")

        # 生成证据ID
        evidence_id = f"EVD-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        # 计算原始哈希
        orig_md5, orig_sha256 = self._calculate_hash(source)

        # 复制到证据库
        dest_dir = self.evidence_root / category
        dest_path = dest_dir / f"{evidence_id}_{source.name}"
        shutil.copy2(source, dest_path)

        # 验证复制完整性
        copy_md5, copy_sha256 = self._calculate_hash(dest_path)

        if orig_sha256 != copy_sha256:
            raise ValueError("证据完整性检查失败 - 哈希不匹配")

        # 创建证据元数据
        evidence_record = {
            'evidence_id': evidence_id,
            'original_path': str(source),
            'stored_path': str(dest_path),
            'category': category,
            'description': description,
            'collection_time': datetime.utcnow().isoformat(),
            'collected_by': analyst,
            'original_modified_time': datetime.fromtimestamp(
                source.stat().st_mtime
            ).isoformat(),
            'file_size': source.stat().st_size,
            'md5_hash': orig_md5,
            'sha256_hash': orig_sha256,
            'integrity_verified': True
        }

        # 记录监管链
        self._log_custody_event(
            action='evidence_collected',
            details=f"收集{source.name}：{description}",
            evidence_id=evidence_id,
            analyst=analyst
        )

        # 写入元数据文件
        metadata_path = dest_path.with_suffix(dest_path.suffix + '.metadata.json')
        import json
        with open(metadata_path, 'w') as f:
            json.dump(evidence_record, f, indent=2)

        return evidence_record

    def collect_memory_dump(self, hostname: str, analyst: str) -> dict:
        """
        记录从系统进行的内存获取。
        """
        evidence_id = f"MEM-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        # 在实践中，这会触发内存获取工具
        # 出于文档目的：
        acquisition_record = {
            'evidence_id': evidence_id,
            'hostname': hostname,
            'acquisition_time': datetime.utcnow().isoformat(),
            'acquired_by': analyst,
            'tool_used': 'winpmem/linpmem',
            'status': 'pending'
        }

        self._log_custody_event(
            action='memory_acquisition_initiated',
            details=f"为{hostname}启动内存转储",
            evidence_id=evidence_id,
            analyst=analyst
        )

        return acquisition_record
```

### 第三阶段：遏制

遏制专注于限制事件造成的损害并防止进一步传播。此阶段通常同时具有短期和长期遏制策略。

**遏制策略：**

```python
from enum import Enum
from typing import List, Dict, Optional
from dataclasses import dataclass
import subprocess
import logging

logger = logging.getLogger(__name__)

class ContainmentAction(Enum):
    NETWORK_ISOLATE = "network_isolate"
    DISABLE_ACCOUNT = "disable_account"
    BLOCK_IP = "block_ip"
    BLOCK_DOMAIN = "block_domain"
    QUARANTINE_FILE = "quarantine_file"
    DISABLE_SERVICE = "disable_service"
    RESET_CREDENTIALS = "reset_credentials"

@dataclass
class ContainmentDecision:
    """
    文档化遏制决策和理由。
    """
    action: ContainmentAction
    target: str
    rationale: str
    approved_by: str
    risks: List[str]
    rollback_procedure: str
    executed: bool = False
    execution_time: Optional[str] = None


class ContainmentManager:
    """
    管理事件遏制行动。
    """

    def __init__(self, incident_id: str):
        self.incident_id = incident_id
        self.actions_taken: List[ContainmentDecision] = []

    def evaluate_containment_options(self, incident_type: str,
                                    affected_systems: List[str]) -> List[dict]:
        """
        根据事件类型评估遏制选项。
        """
        options = {
            'malware': [
                {
                    'action': ContainmentAction.NETWORK_ISOLATE,
                    'description': '将受感染系统与网络隔离',
                    'effectiveness': 'high',
                    'business_impact': 'high',
                    'recommended_for': '主动传播恶意软件'
                },
                {
                    'action': ContainmentAction.QUARANTINE_FILE,
                    'description': '隔离恶意文件',
                    'effectiveness': 'medium',
                    'business_impact': 'low',
                    'recommended_for': '已识别的恶意软件样本'
                },
                {
                    'action': ContainmentAction.BLOCK_DOMAIN,
                    'description': '在DNS/代理处阻止C2域名',
                    'effectiveness': 'high',
                    'business_impact': 'low',
                    'recommended_for': '已知C2基础设施'
                }
            ],
            'unauthorized_access': [
                {
                    'action': ContainmentAction.DISABLE_ACCOUNT,
                    'description': '禁用被攻击账户',
                    'effectiveness': 'high',
                    'business_impact': 'medium',
                    'recommended_for': '已确认账户被攻破'
                },
                {
                    'action': ContainmentAction.RESET_CREDENTIALS,
                    'description': '强制密码重置',
                    'effectiveness': 'high',
                    'business_impact': 'medium',
                    'recommended_for': '怀疑凭证被盗'
                },
                {
                    'action': ContainmentAction.BLOCK_IP,
                    'description': '阻止攻击者IP地址',
                    'effectiveness': 'medium',
                    'business_impact': 'low',
                    'recommended_for': '已知攻击者基础设施'
                }
            ],
            'data_breach': [
                {
                    'action': ContainmentAction.NETWORK_ISOLATE,
                    'description': '隔离受影响的数据存储',
                    'effectiveness': 'high',
                    'business_impact': 'high',
                    'recommended_for': '主动数据外泄'
                },
                {
                    'action': ContainmentAction.DISABLE_SERVICE,
                    'description': '禁用受影响的服务',
                    'effectiveness': 'high',
                    'business_impact': 'high',
                    'recommended_for': '服务利用'
                }
            ]
        }

        return options.get(incident_type, [])

    def execute_network_isolation(self, hostname: str,
                                 vlan_id: str = 'quarantine') -> bool:
        """
        通过移至隔离VLAN来隔离系统。
        """
        # 这将与网络管理系统集成
        # 例子使用网络自动化：
        isolation_commands = f"""
        # 思科交换机命令示例进行VLAN隔离
        interface {hostname}_port
          switchport access vlan {vlan_id}
          shutdown
          no shutdown
        """

        logger.info(f"为{hostname}执行网络隔离")

        # 在实践中，通过网络自动化平台执行
        # 例如使用Ansible、NAPALM或供应商API

        return True

    def block_indicators(self, ioc_type: str, values: List[str]) -> Dict[str, bool]:
        """
        在各个安全控制处阻止折衷指示器。
        """
        results = {}

        for value in values:
            if ioc_type == 'ip':
                # 在防火墙处阻止
                results[value] = self._block_ip_firewall(value)
            elif ioc_type == 'domain':
                # 在DNS/代理处阻止
                results[value] = self._block_domain_dns(value)
            elif ioc_type == 'hash':
                # 添加到EDR阻止列表
                results[value] = self._block_hash_edr(value)

        return results

    def _block_ip_firewall(self, ip: str) -> bool:
        """在周边防火墙阻止IP。"""
        # 与防火墙API集成
        logger.info(f"在防火墙处阻止IP {ip}")
        return True

    def _block_domain_dns(self, domain: str) -> bool:
        """在DNS解析器阻止域名。"""
        logger.info(f"在DNS处阻止域名{domain}")
        return True

    def _block_hash_edr(self, file_hash: str) -> bool:
        """添加哈希到EDR阻止列表。"""
        logger.info(f"将哈希{file_hash}添加到EDR阻止列表")
        return True

    def disable_user_account(self, username: str, domain: str = None) -> bool:
        """
        在Active Directory或身份提供商中禁用用户账户。
        """
        # 使用PowerShell进行AD的示例
        if domain:
            # Active Directory
            ps_command = f'Disable-ADAccount -Identity "{username}"'
            logger.info(f"禁用AD账户：{username}")
        else:
            # 可与Okta、Azure AD等身份提供商集成
            logger.info(f"禁用账户：{username}")

        return True

    def document_containment(self, action: ContainmentDecision):
        """记录采取的遏制行动。"""
        self.actions_taken.append(action)
        logger.info(
            f"遏制行动已记录：{action.action.value}目标为{action.target}"
        )
```

### 第四阶段：根除

根除涉及从环境中移除威胁，包括恶意软件、后门和攻击者留下的任何工件。

**根除程序：**

```python
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class EradicationTask:
    """跟踪根除任务状态。"""
    task_id: str
    description: str
    target_system: str
    status: str  # pending, in_progress, completed, failed
    assigned_to: str
    created_time: datetime
    completed_time: datetime = None
    verification_status: str = None
    notes: str = ""


class EradicationManager:
    """
    管理威胁根除活动。
    """

    def __init__(self, incident_id: str):
        self.incident_id = incident_id
        self.tasks: List[EradicationTask] = []
        self.root_cause_analysis: Dict[str, Any] = {}

    def identify_root_cause(self, investigation_data: dict) -> dict:
        """
        记录根本原因分析发现。
        """
        self.root_cause_analysis = {
            'incident_id': self.incident_id,
            'analysis_time': datetime.utcnow().isoformat(),
            'initial_access': {
                'vector': investigation_data.get('initial_vector'),
                'timestamp': investigation_data.get('first_evidence'),
                'details': investigation_data.get('access_details')
            },
            'vulnerabilities_exploited': investigation_data.get('vulnerabilities', []),
            'misconfigurations': investigation_data.get('misconfigurations', []),
            'contributing_factors': investigation_data.get('contributing_factors', []),
            'attack_chain': investigation_data.get('attack_chain', [])
        }

        return self.root_cause_analysis

    def generate_eradication_plan(self, findings: dict) -> List[EradicationTask]:
        """
        基于调查发现生成根除任务。
        """
        tasks = []
        task_counter = 1

        # 从受影响系统移除恶意软件
        for system in findings.get('infected_systems', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"从{system}移除恶意软件和工件",
                target_system=system,
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        # 移除持久机制
        for persistence in findings.get('persistence_mechanisms', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"移除持久机制：{persistence['type']}在{persistence['system']}",
                target_system=persistence['system'],
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        # 修补漏洞
        for vuln in findings.get('vulnerabilities', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"修补漏洞：{vuln['cve']}在受影响系统",
                target_system=vuln.get('affected_systems', 'multiple'),
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        # 重置被攻破凭证
        for account in findings.get('compromised_accounts', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"重置{account}的凭证",
                target_system='identity_provider',
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        # 移除攻击者访问
        for backdoor in findings.get('backdoors', []):
            task = EradicationTask(
                task_id=f"ERA-{self.incident_id}-{task_counter:03d}",
                description=f"移除后门：{backdoor['type']}在{backdoor['location']}",
                target_system=backdoor['system'],
                status='pending',
                assigned_to='',
                created_time=datetime.utcnow()
            )
            tasks.append(task)
            task_counter += 1

        self.tasks = tasks
        return tasks

    def verify_eradication(self, task: EradicationTask) -> dict:
        """
        验证根除是否成功。
        """
        verification_checks = {
            'malware_scan': {
                'description': '运行完整防病毒/EDR扫描',
                'passed': False
            },
            'ioc_search': {
                'description': '搜索已知指示器',
                'passed': False
            },
            'persistence_check': {
                'description': '验证没有持久机制留存',
                'passed': False
            },
            'network_monitoring': {
                'description': '监控可疑网络活动',
                'passed': False
            },
            'log_review': {
                'description': '审查日志查看继续被攻破的迹象',
                'passed': False
            }
        }

        # 在实践中，这些将是自动化检查
        logger.info(f"对任务{task.task_id}运行根除验证")

        return verification_checks
```

### 第五阶段：恢复

恢复涉及安全地将系统恢复到正常运行状态并验证它们工作正常和安全。

**恢复程序：**

```python
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class RecoveryPhase(Enum):
    PLANNING = "planning"
    VALIDATION = "validation"
    RESTORATION = "restoration"
    TESTING = "testing"
    MONITORING = "monitoring"
    COMPLETE = "complete"

@dataclass
class SystemRecovery:
    """跟踪系统恢复状态。"""
    system_name: str
    criticality: str  # critical, high, medium, low
    current_phase: RecoveryPhase
    restoration_method: str  # rebuild, restore_backup, patch_in_place
    backup_date: Optional[datetime]
    recovery_start: datetime
    recovery_complete: Optional[datetime]
    validation_results: Dict[str, bool]
    approved_for_production: bool = False


class RecoveryManager:
    """
    管理系统恢复和验证。
    """

    def __init__(self, incident_id: str):
        self.incident_id = incident_id
        self.recovery_queue: List[SystemRecovery] = []
        self.recovery_criteria: Dict[str, List[str]] = {}

    def prioritize_recovery(self, affected_systems: List[dict]) -> List[dict]:
        """
        根据业务关键性优先恢复系统。
        """
        # 按关键性和依赖关系排序
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}

        sorted_systems = sorted(
            affected_systems,
            key=lambda x: (
                priority_order.get(x.get('criticality', 'low'), 3),
                -len(x.get('dependencies', []))  # 依赖性少的系统优先
            )
        )

        # 添加恢复序列号
        for i, system in enumerate(sorted_systems):
            system['recovery_sequence'] = i + 1
            system['estimated_recovery_time'] = self._estimate_recovery_time(system)

        return sorted_systems

    def _estimate_recovery_time(self, system: dict) -> str:
        """根据系统特性估计恢复时间。"""
        base_time = {
            'rebuild': 4,  # 小时
            'restore_backup': 2,
            'patch_in_place': 1
        }

        method = system.get('restoration_method', 'rebuild')
        hours = base_time.get(method, 4)

        # 根据复杂性调整
        if system.get('has_database'):
            hours += 2
        if system.get('custom_config'):
            hours += 1

        return f"{hours}小时"

    def define_recovery_criteria(self, system_type: str) -> List[str]:
        """
        定义系统返回生产前必须满足的标准。
        """
        base_criteria = [
            '系统通过所有安全扫描',
            '未检测到折衷指示器',
            '所有补丁和更新已应用',
            '安全配置已验证',
            '日志记录和监控已启用',
            '备份已验证并计划'
        ]

        type_specific = {
            'web_server': [
                '网络应用安全扫描已通过',
                'SSL/TLS证书有效',
                'WAF规则已配置',
                '访问控制已验证'
            ],
            'database': [
                '数据库完整性已验证',
                '访问凭证已轮换',
                '启用静止加密',
                '已配置审计日志'
            ],
            'workstation': [
                'EDR代理已安装并报告',
                '用户凭证已重置',
                '已移除本地管理员权限',
                '已强制应用程序白名单'
            ],
            'domain_controller': [
                'Kerberos票证已失效',
                'KRBTGT密码已轮换两次',
                '信任关系已验证',
                '组策略已审计'
            ]
        }

        criteria = base_criteria + type_specific.get(system_type, [])
        self.recovery_criteria[system_type] = criteria
        return criteria

    def validate_system_recovery(self, recovery: SystemRecovery) -> Dict[str, bool]:
        """
        验证恢复的系统满足所有标准。
        """
        validation_results = {}

        validation_checks = [
            ('security_scan', self._run_security_scan),
            ('ioc_check', self._check_for_iocs),
            ('patch_verification', self._verify_patches),
            ('config_audit', self._audit_security_config),
            ('monitoring_check', self._verify_monitoring),
            ('backup_check', self._verify_backup)
        ]

        for check_name, check_func in validation_checks:
            try:
                result = check_func(recovery.system_name)
                validation_results[check_name] = result
                logger.info(
                    f"验证{check_name}为{recovery.system_name}："
                    f"{'通过' if result else '失败'}"
                )
            except Exception as e:
                validation_results[check_name] = False
                logger.error(f"验证{check_name}错误：{e}")

        recovery.validation_results = validation_results
        recovery.approved_for_production = all(validation_results.values())

        return validation_results

    def _run_security_scan(self, system: str) -> bool:
        """运行全面安全扫描。"""
        logger.info(f"在{system}上运行安全扫描")
        return True  # 占位符

    def _check_for_iocs(self, system: str) -> bool:
        """检查折衷指示器。"""
        logger.info(f"在{system}上检查IOCs")
        return True  # 占位符

    def _verify_patches(self, system: str) -> bool:
        """验证所有补丁已应用。"""
        logger.info(f"在{system}上验证补丁")
        return True  # 占位符

    def _audit_security_config(self, system: str) -> bool:
        """审计安全配置。"""
        logger.info(f"在{system}上审计安全配置")
        return True  # 占位符

    def _verify_monitoring(self, system: str) -> bool:
        """验证监控是否处于活跃状态。"""
        logger.info(f"在{system}上验证监控")
        return True  # 占位符

    def _verify_backup(self, system: str) -> bool:
        """验证备份已配置。"""
        logger.info(f"在{system}上验证备份")
        return True  # 占位符

    def implement_enhanced_monitoring(self, systems: List[str],
                                     duration_days: int = 30) -> dict:
        """
        为恢复的系统实施增强监控。
        """
        monitoring_config = {
            'duration': f"{duration_days}天",
            'start_time': datetime.utcnow().isoformat(),
            'systems': systems,
            'enhanced_alerts': [
                '身份验证异常',
                '异常进程执行',
                '到已知恶意IP的网络连接',
                '文件完整性变更',
                '权限升级尝试',
                '横向移动指示器'
            ],
            'log_retention': 'extended',
            'review_frequency': 'daily'
        }

        logger.info(
            f"为{len(systems)}个系统配置增强监控"
            f"{duration_days}天"
        )

        return monitoring_config
```

### 第六阶段：经验教训

经验教训阶段对于改进未来事件响应能力至关重要。此阶段涉及进行事后审查和实施改进。

**事后审查流程：**

```python
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

@dataclass
class LessonsLearned:
    """
    记录从事件中学到的经验教训。
    """
    incident_id: str
    incident_summary: str
    review_date: datetime
    participants: List[str]

    # 时间轴分析
    timeline_assessment: Dict[str, Any] = field(default_factory=dict)

    # 什么工作良好
    successes: List[str] = field(default_factory=list)

    # 改进领域
    improvements: List[Dict[str, str]] = field(default_factory=list)

    # 行动项
    action_items: List[Dict[str, Any]] = field(default_factory=list)

    # 指标
    metrics: Dict[str, Any] = field(default_factory=dict)


class PostIncidentReview:
    """
    进行并记录事后审查。
    """

    REVIEW_QUESTIONS = {
        'detection': [
            '事件最初是如何检测到的？',
            '检测事件需要多长时间？',
            '是否有更早被忽视的指示器？',
            '如何改进检测能力？'
        ],
        'response': [
            '是否遵循了事件响应计划？',
            '角色和职责是否清晰？',
            '内部和外部沟通是否有效？',
            '是否在正确时间涉及了合适的人员？'
        ],
        'containment': [
            '威胁被遏制需要多长时间？',
            '遏制行动是否有效？',
            '遏制决策的业务影响是什么？',
            '遏制可能更快或破坏性更小吗？'
        ],
        'eradication': [
            '根本原因是否已识别？',
            '所有威胁是否完全移除？',
            '漏洞是否得到适当解决？',
            '根除是否已验证？'
        ],
        'recovery': [
            '恢复需要多长时间？',
            '返回生产前系统是否得到适当验证？',
            '是否实施了增强监控？',
            '备份是否足以满足恢复需求？'
        ],
        'overall': [
            '缺少什么工具或能力？',
            '什么培训会有帮助？',
            '需要进行哪些流程改进？',
            '下次我们会做什么不同？'
        ]
    }

    def __init__(self, incident_id: str):
        self.incident_id = incident_id
        self.lessons_learned: Optional[LessonsLearned] = None

    def calculate_metrics(self, incident_timeline: dict) -> Dict[str, Any]:
        """
        计算关键事件响应指标。
        """
        metrics = {
            'mttd': None,  # 检测平均时间
            'mttr': None,  # 响应平均时间
            'mttc': None,  # 遏制平均时间
            'mttre': None,  # 根除平均时间
            'total_duration': None,
            'business_impact': {}
        }

        # 计算检测时间
        if incident_timeline.get('initial_compromise') and incident_timeline.get('detection'):
            compromise_time = datetime.fromisoformat(incident_timeline['initial_compromise'])
            detection_time = datetime.fromisoformat(incident_timeline['detection'])
            metrics['mttd'] = str(detection_time - compromise_time)

        # 计算响应时间
        if incident_timeline.get('detection') and incident_timeline.get('response_started'):
            detection_time = datetime.fromisoformat(incident_timeline['detection'])
            response_time = datetime.fromisoformat(incident_timeline['response_started'])
            metrics['mttr'] = str(response_time - detection_time)

        # 计算遏制时间
        if incident_timeline.get('response_started') and incident_timeline.get('contained'):
            response_time = datetime.fromisoformat(incident_timeline['response_started'])
            containment_time = datetime.fromisoformat(incident_timeline['contained'])
            metrics['mttc'] = str(containment_time - response_time)

        # 计算总持续时间
        if incident_timeline.get('initial_compromise') and incident_timeline.get('closed'):
            start = datetime.fromisoformat(incident_timeline['initial_compromise'])
            end = datetime.fromisoformat(incident_timeline['closed'])
            metrics['total_duration'] = str(end - start)

        return metrics

    def generate_action_items(self, findings: List[dict]) -> List[Dict[str, Any]]:
        """
        从经验教训生成行动项。
        """
        action_items = []

        for finding in findings:
            action_item = {
                'id': f"AI-{self.incident_id}-{len(action_items) + 1:03d}",
                'finding': finding['description'],
                'action': finding['recommended_action'],
                'priority': finding.get('priority', 'medium'),
                'owner': finding.get('owner', 'TBD'),
                'due_date': finding.get('due_date'),
                'status': 'open',
                'category': finding.get('category', 'process')
            }
            action_items.append(action_item)

        return action_items

    def create_executive_summary(self, lessons: LessonsLearned) -> str:
        """
        为领导层生成执行摘要。
        """
        summary = f"""
# 事件事后分析执行摘要

## 事件：{lessons.incident_id}

### 摘要
{lessons.incident_summary}

### 关键指标
- 检测时间：{lessons.metrics.get('mttd', '未知')}
- 响应时间：{lessons.metrics.get('mttr', '未知')}
- 遏制时间：{lessons.metrics.get('mttc', '未知')}
- 总持续时间：{lessons.metrics.get('total_duration', '未知')}

### 哪些工作良好
{chr(10).join(f'- {success}' for success in lessons.successes)}

### 改进领域
{chr(10).join(f"- {imp['area']}：{imp['description']}" for imp in lessons.improvements)}

### 关键行动项
{chr(10).join(f"- [{item['priority'].upper()}] {item['action']}（负责人：{item['owner']}）" for item in lessons.action_items[:5])}

### 建议
基于此事件，我们建议优先考虑投资于：
1. 增强的检测能力
2. 改进的响应程序
3. 额外的员工培训
4. 工具和自动化改进

审查日期：{lessons.review_date.strftime('%Y-%m-%d')}
参与者：{', '.join(lessons.participants)}
"""
        return summary

    def update_playbooks(self, lessons: LessonsLearned) -> List[str]:
        """
        根据经验教训识别剧本更新。
        """
        updates = []

        for improvement in lessons.improvements:
            if improvement.get('requires_playbook_update'):
                updates.append({
                    'playbook': improvement['affected_playbook'],
                    'section': improvement['section'],
                    'change': improvement['recommended_change'],
                    'rationale': improvement['description']
                })

        return updates
```

## 事件响应剧本

剧本为处理特定类型的事件提供分步程序。设计精良的剧本确保无论哪个团队成员处理事件，响应都一致有效。

**剧本模板：**

```yaml
# 事件响应剧本模板
playbook:
  name: "勒索软件事件响应"
  version: "2.1"
  last_updated: "2024-01-15"
  author: "IR团队"

  overview:
    description: |
      此剧本为响应勒索软件事件提供程序，
      包括初始检测、遏制、根除和恢复。

    trigger_conditions:
      - EDR/AV检测到勒索软件
      - 用户报告文件加密
      - 发现赎金便条
      - 检测到异常文件加密活动

    severity: "Critical"

    objectives:
      - 遏制勒索软件传播
      - 保留证据以供调查
      - 识别勒索软件变体
      - 确定影响范围
      - 恢复加密数据
      - 防止重新感染

  roles_required:
    - IR负责人
    - 恶意软件分析师
    - 网络安全
    - 系统管理员
    - 通讯负责人

  phases:
    - phase: 1
      name: "初始响应"
      time_limit: "15分钟"

      steps:
        - step: 1.1
          action: "确认勒索软件活动"
          details: |
            - 查看检测来源的警报详情
            - 检查受影响系统上的赎金便条
            - 验证文件加密指示器
            - 记录初始发现
          tools: ["EDR控制台", "文件共享访问"]
          responsible: "IR负责人"

        - step: 1.2
          action: "激活事件响应"
          details: |
            - 创建事件票据
            - 通知IR团队成员
            - 建立通讯渠道
            - 开始事件时间轴
          tools: ["票务系统", "Slack/Teams"]
          responsible: "IR负责人"

        - step: 1.3
          action: "初始遏制决策"
          details: |
            - 评估传播指示器
            - 确定是否需要网络隔离
            - 识别面临风险的关键系统
            - 获得遏制行动的批准
          decision_tree:
            - condition: "主动加密传播"
              action: "立即网络隔离"
            - condition: "单个系统受影响"
              action: "仅隔离受影响系统"
            - condition: "范围不清"
              action: "分段网络，进一步调查"
          responsible: "IR负责人"

    - phase: 2
      name: "遏制"
      time_limit: "1小时"

      steps:
        - step: 2.1
          action: "网络隔离"
          details: |
            - 从网络断开受影响系统
            - 阻止横向移动路径
            - 实施网络分段
            - 如必要禁用共享驱动器
          commands:
            windows: |
              # 禁用网络适配器
              Get-NetAdapter | Disable-NetAdapter -Confirm:$false

              # 或通过防火墙隔离
              netsh advfirewall set allprofiles firewallpolicy blockinbound,blockoutbound
            linux: |
              # 禁用网络接口
              ip link set eth0 down

              # 或阻止所有流量
              iptables -P INPUT DROP
              iptables -P OUTPUT DROP
              iptables -P FORWARD DROP
          responsible: "网络安全"

        - step: 2.2
          action: "保留证据"
          details: |
            - 从受影响系统捕获内存
            - 收集赎金便条
            - 记录加密文件扩展名
            - 保留系统日志
          evidence_items:
            - "内存转储"
            - "赎金便条文件"
            - "恶意软件样本"
            - "事件日志"
            - "网络流量捕获"
          responsible: "IR负责人"

        - step: 2.3
          action: "阻止已知指示器"
          details: |
            - 将文件哈希添加到EDR阻止列表
            - 在防火墙处阻止C2域名/IP
            - 为已知IOCs更新电子邮件过滤器
          responsible: "网络安全"

    - phase: 3
      name: "调查"
      time_limit: "4小时"

      steps:
        - step: 3.1
          action: "识别勒索软件变体"
          details: |
            - 分析赎金便条以识别变体
            - 提交样本进行恶意软件分析
            - 检查勒索软件识别服务
            - 记录变体特征
          resources:
            - "ID Ransomware (https://id-ransomware.malwarehunterteam.com)"
            - "No More Ransom (https://www.nomoreransom.org)"
            - "VirusTotal"
          responsible: "恶意软件分析师"

        - step: 3.2
          action: "确定范围"
          details: |
            - 识别所有受影响系统
            - 确定数据影响
            - 识别初始感染向量
            - 映射横向移动
          queries:
            siem: |
              # 搜索勒索软件指示器
              index=endpoint
              (process_name="*.exe" OR file_extension IN ("*.encrypted", "*.locked"))
              | stats count by host, process_name
            edr: |
              # 查询加密活动
              FileCreate
              | where FileName matches "*.encrypted|*.locked|DECRYPT*.txt"
              | summarize count() by DeviceName
          responsible: "IR负责人"

        - step: 3.3
          action: "识别初始访问"
          details: |
            - 审查电子邮件日志以查看网络钓鱼
            - 检查VPN/远程访问日志
            - 审查受影响系统的补丁状态
            - 分析利用指示器
          responsible: "IR负责人"

    - phase: 4
      name: "根除"
      time_limit: "可变"

      steps:
        - step: 4.1
          action: "移除勒索软件"
          details: |
            - 运行完整AV/EDR扫描
            - 移除已识别的恶意软件文件
            - 清理注册表项
            - 移除持久机制
          responsible: "系统管理员"

        - step: 4.2
          action: "修补漏洞"
          details: |
            - 应用被利用漏洞的安全补丁
            - 更新防病毒签名
            - 加强安全配置
          responsible: "系统管理员"

        - step: 4.3
          action: "重置凭证"
          details: |
            - 重置受影响账户的密码
            - 轮换服务账户凭证
            - 失效活跃会话
            - 审查并更新访问权限
          responsible: "系统管理员"

    - phase: 5
      name: "恢复"
      time_limit: "可变"

      steps:
        - step: 5.1
          action: "评估恢复选项"
          details: |
            - 检查是否有可用的解密工具
            - 评估备份完整性
            - 评估重建要求
          decision_tree:
            - condition: "解密工具可用"
              action: "使用解密工具"
            - condition: "干净备份可用"
              action: "从备份恢复"
            - condition: "没有恢复选项"
              action: "重建系统"
          responsible: "IR负责人"

        - step: 5.2
          action: "恢复系统"
          details: |
            - 从已验证的干净备份恢复
            - 如必要重建系统
            - 应用安全加固
            - 安装监控代理
          responsible: "系统管理员"

        - step: 5.3
          action: "验证恢复"
          details: |
            - 验证系统功能
            - 确认没有勒索软件留存
            - 测试安全控制
            - 启用增强监控
          responsible: "IR负责人"

    - phase: 6
      name: "事后"

      steps:
        - step: 6.1
          action: "文档记录"
          details: |
            - 完成事件报告
            - 记录时间轴
            - 记录所有采取的行动
            - 保留证据
          responsible: "IR负责人"

        - step: 6.2
          action: "经验教训"
          details: |
            - 安排事后审查
            - 识别改进
            - 更新剧本
            - 分配行动项
          responsible: "IR负责人"

        - step: 6.3
          action: "通讯"
          details: |
            - 为领导层准备内部报告
            - 评估监管通知要求
            - 如需要计划客户/利益相关者通讯
          responsible: "通讯负责人"

  appendices:
    communication_templates:
      initial_notification: |
        主题：安全事件 - 勒索软件检测

        已检测到影响[范围]的勒索软件事件。
        事件响应团队已被激活。

        当前状态：[状态]
        下次更新：[时间]

        需要采取的行动：
        - 不要尝试访问受影响系统
        - 报告任何可疑活动
        - 保留任何相关证据

      status_update: |
        主题：安全事件更新 - [事件ID]

        事件状态：[状态]
        受影响系统：[数量]
        当前阶段：[阶段]

        最近的行动：
        [行动]

        后续步骤：
        [后续步骤]

        下次更新：[时间]

    escalation_criteria:
      immediate:
        - "勒索软件传播到关键系统"
        - "客户数据确认被加密"
        - "备份系统被攻破"
        - "收到赎金要求"
      within_1_hour:
        - "超过10个系统受影响"
        - "域控制器涉及"
        - "财务系统受影响"

    reference_materials:
      - "NIST勒索软件指南"
      - "CISA勒索软件指南"
      - "内部备份程序"
      - "业务连续性计划"
```

**网络钓鱼事件剧本：**

```python
class PhishingPlaybook:
    """
    自动化网络钓鱼事件响应剧本。
    """

    def __init__(self, incident_id: str, email_sample: dict):
        self.incident_id = incident_id
        self.email_sample = email_sample
        self.affected_users: List[str] = []
        self.indicators: Dict[str, List[str]] = {
            'sender_addresses': [],
            'urls': [],
            'attachments': [],
            'ip_addresses': []
        }

    def extract_indicators(self) -> Dict[str, List[str]]:
        """
        从网络钓鱼邮件提取IOCs。
        """
        import re

        # 提取发件人
        self.indicators['sender_addresses'].append(
            self.email_sample.get('from', '')
        )

        # 从正文提取URL
        body = self.email_sample.get('body', '')
        urls = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', body)
        self.indicators['urls'].extend(urls)

        # 提取附件哈希
        for attachment in self.email_sample.get('attachments', []):
            if attachment.get('hash'):
                self.indicators['attachments'].append(attachment['hash'])

        # 提取发送IP
        headers = self.email_sample.get('headers', {})
        received = headers.get('received', '')
        ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', received)
        self.indicators['ip_addresses'].extend(ips)

        return self.indicators

    def search_mailboxes(self, email_gateway_api) -> List[str]:
        """
        搜索网络钓鱼邮件的所有收件人。
        """
        # 基于指示器构建搜索查询
        search_criteria = {
            'sender': self.indicators['sender_addresses'],
            'subject': self.email_sample.get('subject'),
            'timeframe': '24h'
        }

        # 查询电子邮件网关
        results = email_gateway_api.search(search_criteria)

        self.affected_users = [r['recipient'] for r in results]
        return self.affected_users

    def quarantine_emails(self, email_gateway_api) -> dict:
        """
        从所有邮箱隔离网络钓鱼邮件。
        """
        quarantine_results = {
            'success': [],
            'failed': []
        }

        for user in self.affected_users:
            try:
                email_gateway_api.quarantine(
                    user=user,
                    criteria={
                        'sender': self.indicators['sender_addresses'],
                        'subject': self.email_sample.get('subject')
                    }
                )
                quarantine_results['success'].append(user)
            except Exception as e:
                quarantine_results['failed'].append({
                    'user': user,
                    'error': str(e)
                })

        return quarantine_results

    def identify_clickers(self, proxy_logs, click_timeframe: str = '24h') -> List[dict]:
        """
        识别点击网络钓鱼链接的用户。
        """
        clickers = []

        for url in self.indicators['urls']:
            # 查询代理日志以查找URL访问
            clicks = proxy_logs.search(
                url=url,
                timeframe=click_timeframe
            )

            for click in clicks:
                clickers.append({
                    'user': click['user'],
                    'url': url,
                    'timestamp': click['timestamp'],
                    'user_agent': click['user_agent']
                })

        return clickers

    def assess_credential_compromise(self, clickers: List[dict]) -> List[dict]:
        """
        评估凭证是否可能被攻破。
        """
        compromised = []

        for clicker in clickers:
            # 检查用户是否提交了凭证
            # 这将查询网络代理POST数据或表单提交
            risk_assessment = {
                'user': clicker['user'],
                'clicked_url': clicker['url'],
                'likely_entered_credentials': False,  # 从POST数据确定
                'recommended_action': 'password_reset'
            }

            compromised.append(risk_assessment)

        return compromised

    def generate_response_actions(self) -> List[dict]:
        """
        根据分析生成响应行动列表。
        """
        actions = []

        # 阻止指示器
        actions.append({
            'action': 'block_sender',
            'target': self.indicators['sender_addresses'],
            'system': 'email_gateway'
        })

        actions.append({
            'action': 'block_urls',
            'target': self.indicators['urls'],
            'system': 'web_proxy'
        })

        # 用户通知
        actions.append({
            'action': 'notify_users',
            'target': self.affected_users,
            'message_type': 'phishing_warning'
        })

        # 点击者凭证重置
        actions.append({
            'action': 'force_password_reset',
            'target': [c['user'] for c in self.identify_clickers([])],
            'system': 'identity_provider'
        })

        return actions
```

## 事件响应工具

有效的事件响应需要各种工具用于检测、分析、遏制和恢复。

**必要的IR工具分类：**

```
事件响应工具堆栈：
+-------------------------------------------------------------------------+
|                           检测和监控                                     |
| +-------------------+ +-------------------+ +-------------------+        |
| |      SIEM         | |   EDR平台         | |  网络IDS          |        |
| | - Splunk          | | - CrowdStrike     | | - Suricata        |        |
| | - Elastic SIEM    | | - Carbon Black    | | - Zeek            |        |
| | - Microsoft       | | - SentinelOne     | | - Snort           |        |
| |   Sentinel        | | - Defender ATP    | |                   |        |
| +-------------------+ +-------------------+ +-------------------+        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         调查和分析                                       |
| +-------------------+ +-------------------+ +-------------------+        |
| | 取证工具          | | 恶意软件分析      | | 网络分析          |        |
| | - Autopsy         | | - Cuckoo Sandbox  | | - Wireshark       |        |
| | - FTK             | | - Any.Run         | | - NetworkMiner    |        |
| | - Velociraptor    | | - REMnux          | | - Moloch          |        |
| | - KAPE            | | - Ghidra          | | - Rita            |        |
| +-------------------+ +-------------------+ +-------------------+        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        响应和遏制                                        |
| +-------------------+ +-------------------+ +-------------------+        |
| | 编排              | | 威胁情报          | | 通讯              |        |
| | - TheHive         | | - MISP            | | - Slack           |        |
| | - Cortex XSOAR    | | - OpenCTI         | | - PagerDuty       |        |
| | - Shuffle         | | - ThreatConnect   | | - Jira            |        |
| | - Swimlane        | |                   | |                   |        |
| +-------------------+ +-------------------+ +-------------------+        |
+-------------------------------------------------------------------------+
```

**SIEM查询示例：**

```python
class SIEMQueries:
    """
    用于事件调查的常见SIEM查询。
    """

    SPLUNK_QUERIES = {
        'failed_logins': '''
            index=auth sourcetype=windows:security EventCode=4625
            | stats count by src_ip, user, dest
            | where count > 5
            | sort -count
        ''',

        'lateral_movement': '''
            index=endpoint sourcetype=windows:security
            (EventCode=4624 Logon_Type=3) OR (EventCode=4648)
            | stats count by src_ip, dest, user
            | where count > 1
            | table _time, src_ip, dest, user, count
        ''',

        'process_creation': '''
            index=endpoint sourcetype=sysmon EventCode=1
            | search process_name IN ("powershell.exe", "cmd.exe", "wscript.exe")
            | stats count by host, user, parent_process, process_name, command_line
            | sort -count
        ''',

        'dns_exfiltration': '''
            index=network sourcetype=dns
            | eval query_length=len(query)
            | where query_length > 50
            | stats count by src_ip, query
            | where count > 100
        ''',

        'ransomware_indicators': '''
            index=endpoint sourcetype=sysmon
            (EventCode=11 TargetFilename="*.encrypted" OR TargetFilename="*.locked")
            OR (EventCode=1 CommandLine="*vssadmin*delete*shadows*")
            OR (EventCode=1 CommandLine="*bcdedit*/set*recoveryenabled*no*")
            | stats count by host, EventCode, process_name
        '''
    }

    ELASTIC_QUERIES = {
        'brute_force': {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"event.category": "authentication"}},
                        {"match": {"event.outcome": "failure"}}
                    ],
                    "filter": [
                        {"range": {"@timestamp": {"gte": "now-1h"}}}
                    ]
                }
            },
            "aggs": {
                "by_source": {
                    "terms": {"field": "source.ip"},
                    "aggs": {
                        "by_user": {
                            "terms": {"field": "user.name"}
                        }
                    }
                }
            }
        },

        'suspicious_powershell': {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"process.name": "powershell.exe"}}
                    ],
                    "should": [
                        {"match": {"process.command_line": "encodedcommand"}},
                        {"match": {"process.command_line": "bypass"}},
                        {"match": {"process.command_line": "hidden"}},
                        {"match": {"process.command_line": "downloadstring"}}
                    ],
                    "minimum_should_match": 1
                }
            }
        }
    }
```

**取证分析工具：**

```python
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

class ForensicToolkit:
    """
    常见取证工具和分析的包装器。
    """

    def __init__(self, case_dir: str):
        self.case_dir = Path(case_dir)
        self.case_dir.mkdir(parents=True, exist_ok=True)

    def acquire_memory(self, target: str, tool: str = 'winpmem') -> str:
        """
        从目标系统获取内存。
        """
        output_file = self.case_dir / f"memory_{target}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.raw"

        if tool == 'winpmem':
            # Windows内存获取
            cmd = f'winpmem.exe -o {output_file}'
        elif tool == 'linpmem':
            # Linux内存获取
            cmd = f'linpmem -o {output_file}'

        # 执行获取
        # subprocess.run(cmd, shell=True, check=True)

        return str(output_file)

    def analyze_memory_volatility(self, memory_file: str,
                                  profile: str) -> Dict[str, any]:
        """
        使用Volatility分析内存转储。
        """
        results = {}

        volatility_plugins = [
            'pslist',      # 运行进程
            'pstree',      # 进程树
            'netscan',     # 网络连接
            'malfind',     # 注入代码
            'dlllist',     # 加载的DLL
            'handles',     # 打开的句柄
            'cmdline',     # 命令行参数
            'filescan',    # 文件对象
        ]

        for plugin in volatility_plugins:
            cmd = f'vol.py -f {memory_file} --profile={profile} {plugin}'
            # result = subprocess.run(cmd, shell=True, capture_output=True)
            # results[plugin] = result.stdout.decode()

        return results

    def create_timeline(self, evidence_sources: List[str]) -> List[Dict]:
        """
        从多个证据来源创建超级时间轴。
        """
        timeline_entries = []

        for source in evidence_sources:
            # 使用plaso/log2timeline创建时间轴
            # cmd = f'log2timeline.py --storage-file timeline.plaso {source}'
            pass

        # 导出时间轴
        # cmd = 'psort.py -o dynamic timeline.plaso'

        return timeline_entries

    def extract_artifacts_kape(self, target_drive: str,
                              artifact_categories: List[str]) -> str:
        """
        使用KAPE提取取证工件。
        """
        output_dir = self.case_dir / 'kape_output'
        output_dir.mkdir(exist_ok=True)

        # 构建KAPE目标字符串
        targets = ','.join(artifact_categories)

        cmd = f'kape.exe --tsource {target_drive} --tdest {output_dir} --target {targets}'
        # subprocess.run(cmd, shell=True, check=True)

        return str(output_dir)

    def parse_windows_events(self, evtx_file: str) -> List[Dict]:
        """
        解析Windows事件日志。
        """
        events = []

        # 使用python-evtx或类似工具
        security_events_of_interest = [
            4624,  # 成功登录
            4625,  # 失败的登录
            4648,  # 使用显式凭证登录
            4672,  # 分配了特殊权限
            4688,  # 进程创建
            4697,  # 已安装服务
            4698,  # 创建计划任务
            4720,  # 创建用户账户
            4732,  # 成员添加到安全组
            7045,  # 已安装服务（系统日志）
        ]

        # 解析和过滤事件
        # 这将使用python-evtx或类似库

        return events

    def analyze_prefetch(self, prefetch_dir: str) -> List[Dict]:
        """
        分析Windows预读取文件以查找执行证据。
        """
        prefetch_data = []

        # 使用PECmd或类似工具
        # cmd = f'PECmd.exe -d {prefetch_dir} --csv {self.case_dir}'

        return prefetch_data

    def extract_browser_history(self, user_profile: str) -> Dict[str, List]:
        """
        提取浏览器历史记录和工件。
        """
        browser_artifacts = {
            'chrome': [],
            'firefox': [],
            'edge': []
        }

        # Chrome历史记录
        chrome_history = Path(user_profile) / 'AppData/Local/Google/Chrome/User Data/Default/History'

        # Firefox历史记录
        firefox_profile = Path(user_profile) / 'AppData/Roaming/Mozilla/Firefox/Profiles'

        # Edge历史记录
        edge_history = Path(user_profile) / 'AppData/Local/Microsoft/Edge/User Data/Default/History'

        # 解析SQLite数据库
        # 这将使用sqlite3查询浏览器数据库

        return browser_artifacts
```

## 构建事件响应计划

创建成熟的事件响应能力需要组织承诺和持续改进。

**IR计划成熟度模型：**

```
IR计划成熟度级别：
+-------------------------------------------------------------------------+
| 第5级：优化                                                               |
| - 由指标驱动的持续改进                                                    |
| - 预测性威胁检测                                                          |
| - 常见事件的完全自动化响应                                                |
| - 行业领导力和信息共享                                                    |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
| 第4级：可测量                                                             |
| - 全面的指标和KPI                                                         |
| - 威胁狩猎计划                                                            |
| - 高级自动化和编排                                                        |
| - 定期第三方评估                                                          |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
| 第3级：已定义                                                             |
| - 已记录的流程和剧本                                                      |
| - 专门的IR团队                                                            |
| - 集成的工具和工作流                                                      |
| - 定期培训和演练                                                          |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
| 第2级：发展中                                                             |
| - 存在基本的IR计划                                                        |
| - 一些员工接受过IR培训                                                    |
| - 基本的检测能力                                                          |
| - 临时响应程序                                                            |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
| 第1级：初始                                                               |
| - 没有正式的IR能力                                                        |
| - 仅被动响应                                                              |
| - 有限的可见性和日志记录                                                  |
| - 没有记录的程序                                                          |
+-------------------------------------------------------------------------+
```

**关键性能指标：**

```python
class IRMetrics:
    """
    事件响应关键性能指标。
    """

    KPIs = {
        'detection': {
            'mttd': {
                'name': '检测平均时间',
                'description': '从被攻破到检测的平均时间',
                'target': '< 24小时',
                'calculation': 'Average(detection_time - compromise_time)',
                'data_source': '事件票据'
            },
            'detection_rate': {
                'name': '检测率',
                'description': '内部检测的事件百分比',
                'target': '> 80%',
                'calculation': '(内部检测 / 总事件) * 100',
                'data_source': '事件票据'
            },
            'false_positive_rate': {
                'name': '误报率',
                'description': '是误报的警报百分比',
                'target': '< 20%',
                'calculation': '(误报 / 总警报) * 100',
                'data_source': 'SIEM/警报数据'
            }
        },
        'response': {
            'mttr': {
                'name': '响应平均时间',
                'description': '从检测到响应启动的平均时间',
                'target': '< 1小时',
                'calculation': 'Average(response_start - detection_time)',
                'data_source': '事件票据'
            },
            'mttc': {
                'name': '遏制平均时间',
                'description': '从检测到遏制的平均时间',
                'target': '< 4小时',
                'calculation': 'Average(containment_time - detection_time)',
                'data_source': '事件票据'
            },
            'mttre': {
                'name': '根除平均时间',
                'description': '完全移除威胁的平均时间',
                'target': '< 24小时',
                'calculation': 'Average(eradication_time - containment_time)',
                'data_source': '事件票据'
            }
        },
        'recovery': {
            'mttr_recovery': {
                'name': '恢复平均时间',
                'description': '恢复正常运营的平均时间',
                'target': '< 48小时',
                'calculation': 'Average(recovery_time - eradication_time)',
                'data_source': '事件票据'
            },
            'data_loss': {
                'name': '数据丢失事件',
                'description': '确认数据丢失的事件数',
                'target': '0',
                'calculation': '其中data_loss=true的事件计数',
                'data_source': '事件票据'
            }
        },
        'operational': {
            'incident_volume': {
                'name': '事件量',
                'description': '每个时间段的事件数',
                'target': '趋势下降',
                'calculation': '每月事件计数',
                'data_source': '事件票据'
            },
            'recurrence_rate': {
                'name': '复发率',
                'description': '重复事件类型的百分比',
                'target': '< 10%',
                'calculation': '(重复事件 / 总事件) * 100',
                'data_source': '事件票据'
            },
            'playbook_coverage': {
                'name': '剧本覆盖率',
                'description': '具有剧本的事件类型百分比',
                'target': '> 90%',
                'calculation': '(具有剧本的事件类型 / 总事件类型) * 100',
                'data_source': '剧本库存'
            }
        }
    }

    @classmethod
    def calculate_metrics(cls, incident_data: List[dict],
                         time_period: str = 'monthly') -> Dict[str, any]:
        """
        从事件数据计算所有KPI。
        """
        metrics = {}

        # 计算检测指标
        detection_times = []
        for incident in incident_data:
            if incident.get('detection_time') and incident.get('compromise_time'):
                detection_times.append(
                    incident['detection_time'] - incident['compromise_time']
                )

        if detection_times:
            metrics['mttd'] = sum(detection_times) / len(detection_times)

        # 计算响应指标
        response_times = []
        for incident in incident_data:
            if incident.get('response_start') and incident.get('detection_time'):
                response_times.append(
                    incident['response_start'] - incident['detection_time']
                )

        if response_times:
            metrics['mttr'] = sum(response_times) / len(response_times)

        # 其他计算将遵循类似的模式

        return metrics
```

## 结论

有效的事件响应是任何组织的关键能力。通过实施本指南所述的实践，包括适当的准备、结构化的检测和分析、系统化的遏制和根除、彻底的恢复程序以及通过经验教训的持续改进，组织可以最小化安全事件的影响并改进其整体安全姿态。

建立强大事件响应计划的关键要点：

1. **准备至关重要**：在事件发生前投资规划、培训和工具
2. **速度重要**：更快的检测和响应直接减少事件影响
3. **文档至关重要**：全面的文档支持调查、法律需求和改进
4. **定期练习**：进行演兵表和模拟以测试和改进响应能力
5. **学习和改进**：每个事件都是加强防御和响应程序的机会
6. **尽可能自动化**：使用编排和自动化来加速响应并减少人为错误
7. **建立关系**：在需要之前建立与执法部门、IR公司和行业同行的合作伙伴关系

请记住，事件响应不仅是一个技术功能，还需要跨组织的协调，包括法律、通讯、人力资源和业务领导。准备充分的组织可以将安全事件从危机转变为可管理的事件，影响最小。
