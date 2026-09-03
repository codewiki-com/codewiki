---
title: 网络安全基础
description: 了解网络安全的核心概念和防护措施
track: security
section: infra-security
difficulty: intermediate
tags:
  - 网络安全
  - 防火墙
  - IDS/IPS
  - VPN
status: imported
origin: old/src/content/docs/security/network-security.zh.md
divergence: 0.3
issues: []
legacy:
  category: Security
  subcategory: Network
  order: 13
  lastUpdated: 2026-01-07
---

网络安全是保护计算机网络及其数据免受未授权访问、攻击、破坏或泄露的实践。在当今高度互联的世界中，网络安全已成为每个组织和开发者必须掌握的核心技能。

## 网络安全基本概念

### 什么是网络安全

网络安全涵盖了保护网络基础设施、数据传输和网络服务的所有措施和实践：

```
网络安全的三大核心目标 (CIA 三要素)
├── 机密性 (Confidentiality)
│   └── 确保数据只能被授权用户访问
├── 完整性 (Integrity)
│   └── 确保数据未被未授权修改
└── 可用性 (Availability)
    └── 确保授权用户能够访问资源
```

### OSI 模型与安全威胁

```
OSI 七层模型安全威胁分析：

第7层 - 应用层
├── 威胁：SQL注入、XSS、CSRF、应用层DDoS
└── 防护：WAF、输入验证、安全编码

第6层 - 表示层
├── 威胁：加密弱点、数据格式攻击
└── 防护：强加密算法、安全协议

第5层 - 会话层
├── 威胁：会话劫持、会话固定
└── 防护：会话管理、令牌机制

第4层 - 传输层
├── 威胁：SYN Flood、端口扫描
└── 防护：防火墙、IPS、速率限制

第3层 - 网络层
├── 威胁：IP欺骗、路由攻击、ICMP攻击
└── 防护：包过滤、路由安全

第2层 - 数据链路层
├── 威胁：ARP欺骗、MAC泛洪
└── 防护：端口安全、ARP检查

第1层 - 物理层
├── 威胁：物理入侵、线路窃听
└── 防护：物理安全、加密
```

### TCP/IP 安全风险

```python
# TCP/IP 协议栈安全风险演示
"""
TCP/IP 协议栈在设计时并未充分考虑安全性，导致多种安全威胁：

应用层 (HTTP, FTP, SMTP)     -> 应用层攻击、数据泄露
传输层 (TCP, UDP)            -> SYN Flood、会话劫持
网络层 (IP, ICMP)            -> IP欺骗、路由攻击
数据链路层 (Ethernet, ARP)   -> ARP欺骗、MAC泛洪
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum

class ProtocolLayer(Enum):
    APPLICATION = "应用层"
    TRANSPORT = "传输层"
    NETWORK = "网络层"
    DATALINK = "数据链路层"

@dataclass
class SecurityThreat:
    """安全威胁定义"""
    name: str
    layer: ProtocolLayer
    description: str
    mitigation: List[str]

class NetworkSecurityAnalyzer:
    """网络安全威胁分析器"""

    def __init__(self):
        self.threats: List[SecurityThreat] = []
        self._load_common_threats()

    def _load_common_threats(self):
        """加载常见威胁"""
        self.threats = [
            SecurityThreat(
                name="SYN Flood",
                layer=ProtocolLayer.TRANSPORT,
                description="利用TCP三次握手机制耗尽服务器资源",
                mitigation=["SYN Cookies", "速率限制", "防火墙过滤"]
            ),
            SecurityThreat(
                name="ARP欺骗",
                layer=ProtocolLayer.DATALINK,
                description="伪造ARP响应实现中间人攻击",
                mitigation=["静态ARP绑定", "ARP检测", "网络分段"]
            ),
            SecurityThreat(
                name="IP欺骗",
                layer=ProtocolLayer.NETWORK,
                description="伪造源IP地址绕过访问控制",
                mitigation=["入口过滤", "uRPF检查", "防火墙规则"]
            )
        ]

    def analyze_threat(self, threat_name: str) -> Dict:
        """分析特定威胁"""
        for threat in self.threats:
            if threat.name == threat_name:
                return {
                    "name": threat.name,
                    "layer": threat.layer.value,
                    "description": threat.description,
                    "mitigation": threat.mitigation,
                    "risk_level": self._calculate_risk(threat)
                }
        return {"error": "威胁未找到"}

    def _calculate_risk(self, threat: SecurityThreat) -> str:
        """计算风险等级"""
        # 简化的风险评估
        high_risk = ["SYN Flood", "ARP欺骗"]
        return "高" if threat.name in high_risk else "中"

# 使用示例
analyzer = NetworkSecurityAnalyzer()
print(analyzer.analyze_threat("SYN Flood"))
```

## 防火墙技术

### 防火墙类型

防火墙是网络安全的第一道防线，根据工作原理可分为以下几类：

```
1. 包过滤防火墙 (Packet Filter)
   - 基于 IP 地址、端口、协议进行过滤
   - 工作在网络层和传输层
   - 性能高但功能有限

2. 状态检测防火墙 (Stateful Inspection)
   - 跟踪连接状态
   - 能够识别合法的响应包
   - 更安全但资源消耗更大

3. 应用层防火墙 (Application Gateway)
   - 深度包检测 (DPI)
   - 理解应用层协议
   - 可以检测应用层攻击

4. 下一代防火墙 (NGFW)
   - 集成 IPS、应用识别、用户识别
   - 威胁情报集成
   - 沙箱分析
```

### iptables 配置实战

```bash
#!/bin/bash
# 企业级 iptables 防火墙配置脚本

# 清空现有规则
iptables -F
iptables -X
iptables -Z

# 设置默认策略 - 默认拒绝所有入站流量
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 允许本地回环接口
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# 允许已建立的连接和相关连接
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# SSH 访问控制（限制连接速率防止暴力破解）
# 60秒内最多4次新连接
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set --name SSH
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 --name SSH -j DROP
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -j ACCEPT

# 允许 HTTP/HTTPS 流量
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 防止 SYN Flood 攻击
iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP

# 防止 ICMP Flood
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 4 -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-request -j DROP

# 丢弃无效数据包
iptables -A INPUT -m state --state INVALID -j DROP

# 防止端口扫描 - 丢弃异常 TCP 标志组合
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL FIN,PSH,URG -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j DROP

# 记录被丢弃的数据包（用于分析）
iptables -A INPUT -j LOG --log-prefix "IPTables-Dropped: " --log-level 4

# 保存规则
iptables-save > /etc/iptables/rules.v4

echo "防火墙规则配置完成"
```

### Python 防火墙管理工具

```python
import subprocess
import json
from dataclasses import dataclass, field
from typing import List, Optional, Dict
from enum import Enum

class FirewallAction(Enum):
    ACCEPT = "ACCEPT"
    DROP = "DROP"
    REJECT = "REJECT"
    LOG = "LOG"

class FirewallChain(Enum):
    INPUT = "INPUT"
    OUTPUT = "OUTPUT"
    FORWARD = "FORWARD"

@dataclass
class FirewallRule:
    """防火墙规则数据类"""
    chain: FirewallChain
    protocol: str
    action: FirewallAction
    source: Optional[str] = None
    destination: Optional[str] = None
    sport: Optional[int] = None
    dport: Optional[int] = None
    comment: Optional[str] = None

    def to_command(self) -> List[str]:
        """转换为 iptables 命令"""
        cmd = ['iptables', '-A', self.chain.value, '-p', self.protocol]

        if self.source:
            cmd.extend(['-s', self.source])
        if self.destination:
            cmd.extend(['-d', self.destination])
        if self.sport:
            cmd.extend(['--sport', str(self.sport)])
        if self.dport:
            cmd.extend(['--dport', str(self.dport)])
        if self.comment:
            cmd.extend(['-m', 'comment', '--comment', self.comment])

        cmd.extend(['-j', self.action.value])
        return cmd

class FirewallManager:
    """防火墙管理器"""

    def __init__(self):
        self.rules: List[FirewallRule] = []
        self.applied_rules: List[FirewallRule] = []

    def add_rule(self, rule: FirewallRule) -> bool:
        """添加防火墙规则"""
        try:
            cmd = rule.to_command()
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                self.rules.append(rule)
                self.applied_rules.append(rule)
                return True
            else:
                print(f"添加规则失败: {result.stderr}")
                return False
        except Exception as e:
            print(f"执行命令时出错: {e}")
            return False

    def remove_rule(self, rule: FirewallRule) -> bool:
        """删除防火墙规则"""
        cmd = rule.to_command()
        cmd[1] = '-D'  # 将 -A 改为 -D

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            if rule in self.applied_rules:
                self.applied_rules.remove(rule)
            return True
        return False

    def list_rules(self, chain: Optional[FirewallChain] = None) -> str:
        """列出防火墙规则"""
        cmd = ['iptables', '-L', '-n', '-v', '--line-numbers']
        if chain:
            cmd.insert(2, chain.value)

        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout

    def flush_chain(self, chain: FirewallChain) -> bool:
        """清空指定链的所有规则"""
        cmd = ['iptables', '-F', chain.value]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0

    def save_rules(self, filepath: str = '/etc/iptables/rules.v4') -> bool:
        """保存规则到文件"""
        result = subprocess.run(
            ['iptables-save'],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            with open(filepath, 'w') as f:
                f.write(result.stdout)
            return True
        return False

    def get_statistics(self) -> Dict:
        """获取防火墙统计信息"""
        return {
            'total_rules': len(self.applied_rules),
            'rules_by_chain': {
                chain.value: sum(1 for r in self.applied_rules if r.chain == chain)
                for chain in FirewallChain
            },
            'rules_by_action': {
                action.value: sum(1 for r in self.applied_rules if r.action == action)
                for action in FirewallAction
            }
        }

# 使用示例
def setup_web_server_firewall():
    """配置 Web 服务器防火墙"""
    manager = FirewallManager()

    # 允许 HTTP
    manager.add_rule(FirewallRule(
        chain=FirewallChain.INPUT,
        protocol='tcp',
        dport=80,
        action=FirewallAction.ACCEPT,
        comment='Allow HTTP'
    ))

    # 允许 HTTPS
    manager.add_rule(FirewallRule(
        chain=FirewallChain.INPUT,
        protocol='tcp',
        dport=443,
        action=FirewallAction.ACCEPT,
        comment='Allow HTTPS'
    ))

    # 允许 SSH（仅限特定 IP）
    manager.add_rule(FirewallRule(
        chain=FirewallChain.INPUT,
        protocol='tcp',
        source='10.0.0.0/8',
        dport=22,
        action=FirewallAction.ACCEPT,
        comment='Allow SSH from internal network'
    ))

    print("Web 服务器防火墙配置完成")
    print(f"统计信息: {manager.get_statistics()}")
```

## 入侵检测与防御系统 (IDS/IPS)

### IDS 与 IPS 对比

```
IDS (入侵检测系统)                    IPS (入侵防御系统)
├── 被动监控                          ├── 主动防护
├── 检测并报警                        ├── 检测并阻断
├── 不阻断流量                        ├── 实时响应
├── 部署方式：镜像/SPAN               ├── 部署方式：串联
└── 适合监控和分析                    └── 适合生产环境保护

检测方法：
1. 签名检测 (Signature-based)
   - 基于已知攻击特征
   - 准确率高，但无法检测新攻击

2. 异常检测 (Anomaly-based)
   - 基于正常行为基线
   - 可检测未知攻击，但误报率较高

3. 协议分析 (Protocol Analysis)
   - 检测协议违规
   - 可发现协议层攻击
```

### Snort 规则配置

```bash
# Snort IDS/IPS 规则示例

# 规则格式：
# action protocol src_ip src_port -> dst_ip dst_port (options)

# 检测 SQL 注入尝试
alert tcp any any -> $HOME_NET $HTTP_PORTS (
    msg:"SQL Injection Attempt - UNION SELECT";
    flow:to_server,established;
    content:"UNION"; nocase;
    content:"SELECT"; nocase; distance:0;
    pcre:"/UNION\s+(ALL\s+)?SELECT/i";
    classtype:web-application-attack;
    sid:1000001;
    rev:1;
)

# 检测 XSS 攻击
alert tcp any any -> $HOME_NET $HTTP_PORTS (
    msg:"XSS Attack Detected - Script Tag";
    flow:to_server,established;
    content:"<script"; nocase;
    pcre:"/<script[^>]*>.*?<\/script>/i";
    classtype:web-application-attack;
    sid:1000002;
    rev:1;
)

# 检测 SSH 暴力破解
alert tcp any any -> $HOME_NET 22 (
    msg:"SSH Brute Force Attempt";
    flow:to_server;
    detection_filter:track by_src, count 5, seconds 60;
    classtype:attempted-admin;
    sid:1000003;
    rev:1;
)

# 检测端口扫描
alert tcp any any -> $HOME_NET any (
    msg:"Possible Port Scan Detected";
    flags:S;
    detection_filter:track by_src, count 20, seconds 10;
    classtype:attempted-recon;
    sid:1000004;
    rev:1;
)

# 检测命令注入
alert tcp any any -> $HOME_NET $HTTP_PORTS (
    msg:"Command Injection Attempt";
    flow:to_server,established;
    pcre:"/[;&|`$]\s*(cat|ls|pwd|id|whoami|wget|curl)/i";
    classtype:web-application-attack;
    sid:1000005;
    rev:1;
)
```

### Python 入侵检测系统实现

```python
import re
import logging
import hashlib
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict, Callable, Optional, Set
from enum import Enum
import threading

class ThreatLevel(Enum):
    INFO = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    CRITICAL = 5

@dataclass
class Alert:
    """安全告警"""
    id: str
    timestamp: datetime
    source_ip: str
    destination_ip: str
    threat_level: ThreatLevel
    rule_name: str
    description: str
    raw_data: str

    def __post_init__(self):
        if not self.id:
            self.id = hashlib.md5(
                f"{self.timestamp}{self.source_ip}{self.rule_name}".encode()
            ).hexdigest()[:12]

@dataclass
class DetectionRule:
    """检测规则"""
    name: str
    description: str
    threat_level: ThreatLevel
    patterns: List[str]
    enabled: bool = True

class SimpleIDS:
    """简易入侵检测系统"""

    def __init__(self):
        self.alerts: List[Alert] = []
        self.connection_tracker: Dict[str, List[datetime]] = defaultdict(list)
        self.rules: List[DetectionRule] = []
        self.blocked_ips: Set[str] = set()
        self.lock = threading.Lock()

        # 配置日志
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

        # 加载默认规则
        self._load_default_rules()

    def _load_default_rules(self):
        """加载默认检测规则"""
        self.rules = [
            DetectionRule(
                name="SQL Injection",
                description="检测 SQL 注入攻击",
                threat_level=ThreatLevel.HIGH,
                patterns=[
                    r"(\%27)|(\')|(\-\-)|(\%23)|(#)",
                    r"(?i)UNION\s+(ALL\s+)?SELECT",
                    r"(?i)SELECT\s+.*\s+FROM\s+.*\s+WHERE",
                    r"(?i)(INSERT|UPDATE|DELETE)\s+.*\s+(INTO|SET|FROM)",
                    r"(?i)DROP\s+(TABLE|DATABASE)",
                    r"(?i)OR\s+['\"]?1['\"]?\s*=\s*['\"]?1"
                ]
            ),
            DetectionRule(
                name="XSS Attack",
                description="检测跨站脚本攻击",
                threat_level=ThreatLevel.HIGH,
                patterns=[
                    r"<script[^>]*>.*?</script>",
                    r"javascript\s*:",
                    r"on\w+\s*=\s*['\"]",
                    r"<img[^>]+onerror\s*=",
                    r"document\.(cookie|location|write)",
                    r"eval\s*\("
                ]
            ),
            DetectionRule(
                name="Path Traversal",
                description="检测目录遍历攻击",
                threat_level=ThreatLevel.MEDIUM,
                patterns=[
                    r"\.\./",
                    r"\.\.\\",
                    r"%2e%2e%2f",
                    r"%2e%2e/",
                    r"\.\.%2f",
                    r"/etc/(passwd|shadow|hosts)",
                    r"c:\\windows\\system32"
                ]
            ),
            DetectionRule(
                name="Command Injection",
                description="检测命令注入攻击",
                threat_level=ThreatLevel.CRITICAL,
                patterns=[
                    r"[;&|`$]\s*(cat|ls|pwd|id|whoami)",
                    r"\|\s*(nc|netcat|wget|curl)\s",
                    r";\s*(rm|mv|cp)\s+-rf?\s",
                    r"\$\(.*\)",
                    r"`.*`"
                ]
            ),
            DetectionRule(
                name="Sensitive File Access",
                description="检测敏感文件访问尝试",
                threat_level=ThreatLevel.MEDIUM,
                patterns=[
                    r"\.htaccess",
                    r"\.htpasswd",
                    r"\.git/",
                    r"\.env",
                    r"wp-config\.php",
                    r"config\.(php|yml|json)"
                ]
            )
        ]

    def add_rule(self, rule: DetectionRule):
        """添加自定义规则"""
        self.rules.append(rule)
        self.logger.info(f"添加规则: {rule.name}")

    def analyze_packet(self, packet: Dict) -> List[Alert]:
        """分析数据包"""
        detected_alerts = []
        payload = str(packet.get('payload', ''))
        src_ip = packet.get('src_ip', 'unknown')
        dst_ip = packet.get('dst_ip', 'unknown')

        with self.lock:
            # 检查是否已被封禁
            if src_ip in self.blocked_ips:
                return []

            # 应用检测规则
            for rule in self.rules:
                if not rule.enabled:
                    continue

                for pattern in rule.patterns:
                    if re.search(pattern, payload, re.IGNORECASE):
                        alert = Alert(
                            id="",
                            timestamp=datetime.now(),
                            source_ip=src_ip,
                            destination_ip=dst_ip,
                            threat_level=rule.threat_level,
                            rule_name=rule.name,
                            description=f"{rule.description}: 匹配模式 {pattern[:50]}...",
                            raw_data=payload[:500]
                        )
                        detected_alerts.append(alert)
                        self.alerts.append(alert)
                        self._handle_alert(alert)
                        break

            # 暴力破解检测
            brute_force_alert = self._detect_brute_force(packet)
            if brute_force_alert:
                detected_alerts.append(brute_force_alert)

        return detected_alerts

    def _detect_brute_force(self, packet: Dict) -> Optional[Alert]:
        """检测暴力破解攻击"""
        src_ip = packet.get('src_ip', '')
        dst_port = packet.get('dst_port', 0)

        # 监控登录相关端口
        login_ports = {22: 'SSH', 23: 'Telnet', 21: 'FTP',
                       3389: 'RDP', 3306: 'MySQL', 5432: 'PostgreSQL'}

        if dst_port not in login_ports:
            return None

        now = datetime.now()
        key = f"{src_ip}:{dst_port}"

        # 记录连接
        self.connection_tracker[key].append(now)

        # 清理过期记录（5分钟前）
        cutoff = now - timedelta(minutes=5)
        self.connection_tracker[key] = [
            t for t in self.connection_tracker[key]
            if t > cutoff
        ]

        # 5分钟内超过10次连接视为暴力破解
        if len(self.connection_tracker[key]) > 10:
            service = login_ports[dst_port]
            alert = Alert(
                id="",
                timestamp=now,
                source_ip=src_ip,
                destination_ip=packet.get('dst_ip', 'unknown'),
                threat_level=ThreatLevel.MEDIUM,
                rule_name="Brute Force Detection",
                description=f"检测到对 {service} 服务的暴力破解尝试，5分钟内连接次数: {len(self.connection_tracker[key])}",
                raw_data=str(packet)
            )
            self.alerts.append(alert)
            self._handle_alert(alert)
            return alert

        return None

    def _handle_alert(self, alert: Alert):
        """处理告警"""
        level_name = alert.threat_level.name

        # 记录日志
        if alert.threat_level.value >= ThreatLevel.HIGH.value:
            self.logger.warning(
                f"[{level_name}] {alert.rule_name} - "
                f"来源: {alert.source_ip} -> {alert.destination_ip}"
            )
        else:
            self.logger.info(
                f"[{level_name}] {alert.rule_name} - 来源: {alert.source_ip}"
            )

        # 高危告警自动封禁
        if alert.threat_level == ThreatLevel.CRITICAL:
            self.block_ip(alert.source_ip)

    def block_ip(self, ip: str):
        """封禁 IP"""
        self.blocked_ips.add(ip)
        self.logger.warning(f"IP 已封禁: {ip}")

    def unblock_ip(self, ip: str):
        """解封 IP"""
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
            self.logger.info(f"IP 已解封: {ip}")

    def get_alerts_summary(self) -> Dict:
        """获取告警摘要"""
        summary = {
            'total_alerts': len(self.alerts),
            'blocked_ips': len(self.blocked_ips),
            'by_level': defaultdict(int),
            'by_rule': defaultdict(int),
            'top_sources': defaultdict(int)
        }

        for alert in self.alerts:
            summary['by_level'][alert.threat_level.name] += 1
            summary['by_rule'][alert.rule_name] += 1
            summary['top_sources'][alert.source_ip] += 1

        # 排序获取 Top 10 源 IP
        summary['top_sources'] = dict(
            sorted(summary['top_sources'].items(),
                   key=lambda x: x[1], reverse=True)[:10]
        )

        return dict(summary)

    def export_alerts(self, filepath: str):
        """导出告警到文件"""
        import json

        export_data = []
        for alert in self.alerts:
            export_data.append({
                'id': alert.id,
                'timestamp': alert.timestamp.isoformat(),
                'source_ip': alert.source_ip,
                'destination_ip': alert.destination_ip,
                'threat_level': alert.threat_level.name,
                'rule_name': alert.rule_name,
                'description': alert.description
            })

        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

# 使用示例
if __name__ == "__main__":
    ids = SimpleIDS()

    # 模拟恶意请求
    test_packets = [
        {
            'src_ip': '192.168.1.100',
            'dst_ip': '10.0.0.1',
            'dst_port': 80,
            'payload': "SELECT * FROM users WHERE id=1 OR '1'='1'"
        },
        {
            'src_ip': '192.168.1.101',
            'dst_ip': '10.0.0.1',
            'dst_port': 80,
            'payload': "<script>alert('XSS')</script>"
        },
        {
            'src_ip': '192.168.1.102',
            'dst_ip': '10.0.0.1',
            'dst_port': 80,
            'payload': "../../etc/passwd"
        }
    ]

    for packet in test_packets:
        alerts = ids.analyze_packet(packet)
        for alert in alerts:
            print(f"检测到攻击: {alert.rule_name} - {alert.description}")

    print("\n告警摘要:")
    print(ids.get_alerts_summary())
```

## 网络分段与隔离

### 网络分段策略

网络分段是将网络划分为多个隔离区域，限制横向移动和攻击扩散：

```
传统网络分段架构：

         互联网
            │
      ┌─────┴─────┐
      │  边界防火墙  │
      └─────┬─────┘
            │
      ┌─────┴─────┐
      │    DMZ     │  ← 对外服务区
      │  (Web服务器) │
      └─────┬─────┘
            │
      ┌─────┴─────┐
      │ 内部防火墙  │
      └─────┬─────┘
            │
   ┌────────┼────────┐
   │        │        │
┌──┴──┐ ┌───┴──┐ ┌───┴──┐
│办公区│ │开发区│ │数据区│
└─────┘ └──────┘ └──────┘

VLAN 分段示例：
VLAN 10: 管理网络 (10.0.10.0/24)
VLAN 20: 办公网络 (10.0.20.0/24)
VLAN 30: 开发网络 (10.0.30.0/24)
VLAN 40: 生产网络 (10.0.40.0/24)
VLAN 50: DMZ网络 (10.0.50.0/24)
```

### 微分段实现

```python
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional
from enum import Enum
import ipaddress
import json

class SecurityZone(Enum):
    """安全区域定义"""
    UNTRUSTED = "untrusted"      # 不可信区域（互联网）
    DMZ = "dmz"                   # 隔离区
    INTERNAL = "internal"         # 内部网络
    RESTRICTED = "restricted"     # 受限区域
    MANAGEMENT = "management"     # 管理区域

@dataclass
class NetworkSegment:
    """网络段定义"""
    name: str
    zone: SecurityZone
    cidr: str
    vlan_id: int
    description: str
    allowed_inbound_zones: List[SecurityZone] = field(default_factory=list)
    allowed_outbound_zones: List[SecurityZone] = field(default_factory=list)
    allowed_ports: List[int] = field(default_factory=list)

@dataclass
class AccessPolicy:
    """访问控制策略"""
    name: str
    source_zone: SecurityZone
    destination_zone: SecurityZone
    protocol: str
    ports: List[int]
    action: str  # "allow" or "deny"
    logging: bool = True

class MicroSegmentationManager:
    """微分段管理器"""

    def __init__(self):
        self.segments: Dict[str, NetworkSegment] = {}
        self.policies: List[AccessPolicy] = []
        self.default_policy = "deny"  # 默认拒绝

    def add_segment(self, segment: NetworkSegment):
        """添加网络段"""
        self.segments[segment.name] = segment
        print(f"添加网络段: {segment.name} ({segment.cidr})")

    def add_policy(self, policy: AccessPolicy):
        """添加访问策略"""
        self.policies.append(policy)
        print(f"添加策略: {policy.name}")

    def get_segment_for_ip(self, ip: str) -> Optional[NetworkSegment]:
        """根据 IP 获取所属网络段"""
        try:
            ip_addr = ipaddress.ip_address(ip)
            for segment in self.segments.values():
                network = ipaddress.ip_network(segment.cidr, strict=False)
                if ip_addr in network:
                    return segment
        except ValueError:
            pass
        return None

    def check_access(self, src_ip: str, dst_ip: str,
                     port: int, protocol: str = 'tcp') -> Dict:
        """检查访问权限"""
        src_segment = self.get_segment_for_ip(src_ip)
        dst_segment = self.get_segment_for_ip(dst_ip)

        result = {
            'allowed': False,
            'source_ip': src_ip,
            'destination_ip': dst_ip,
            'source_segment': src_segment.name if src_segment else 'unknown',
            'destination_segment': dst_segment.name if dst_segment else 'unknown',
            'matched_policy': None,
            'reason': ''
        }

        if not src_segment or not dst_segment:
            result['reason'] = '未知网络段'
            return result

        # 检查策略
        for policy in self.policies:
            if (policy.source_zone == src_segment.zone and
                policy.destination_zone == dst_segment.zone and
                policy.protocol == protocol and
                port in policy.ports):

                result['matched_policy'] = policy.name
                result['allowed'] = (policy.action == 'allow')
                result['reason'] = f"匹配策略: {policy.name}"
                return result

        # 默认策略
        result['reason'] = f"默认策略: {self.default_policy}"
        result['allowed'] = (self.default_policy == 'allow')
        return result

    def generate_acl_rules(self) -> List[str]:
        """生成 ACL 规则"""
        rules = []
        for policy in self.policies:
            action = "permit" if policy.action == "allow" else "deny"
            ports = ','.join(map(str, policy.ports))
            rule = (f"{action} {policy.protocol} "
                   f"zone {policy.source_zone.value} "
                   f"to zone {policy.destination_zone.value} "
                   f"ports {ports}")
            rules.append(rule)
        return rules

    def export_config(self, filepath: str):
        """导出配置"""
        config = {
            'segments': [
                {
                    'name': s.name,
                    'zone': s.zone.value,
                    'cidr': s.cidr,
                    'vlan_id': s.vlan_id,
                    'description': s.description
                }
                for s in self.segments.values()
            ],
            'policies': [
                {
                    'name': p.name,
                    'source_zone': p.source_zone.value,
                    'destination_zone': p.destination_zone.value,
                    'protocol': p.protocol,
                    'ports': p.ports,
                    'action': p.action
                }
                for p in self.policies
            ]
        }

        with open(filepath, 'w') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)

# 使用示例
def setup_enterprise_network():
    """配置企业网络微分段"""
    manager = MicroSegmentationManager()

    # 定义网络段
    segments = [
        NetworkSegment(
            name="dmz",
            zone=SecurityZone.DMZ,
            cidr="10.0.50.0/24",
            vlan_id=50,
            description="DMZ 对外服务区"
        ),
        NetworkSegment(
            name="internal",
            zone=SecurityZone.INTERNAL,
            cidr="10.0.20.0/24",
            vlan_id=20,
            description="内部办公网络"
        ),
        NetworkSegment(
            name="database",
            zone=SecurityZone.RESTRICTED,
            cidr="10.0.40.0/24",
            vlan_id=40,
            description="数据库服务区"
        ),
        NetworkSegment(
            name="management",
            zone=SecurityZone.MANAGEMENT,
            cidr="10.0.10.0/24",
            vlan_id=10,
            description="管理网络"
        )
    ]

    for segment in segments:
        manager.add_segment(segment)

    # 定义访问策略
    policies = [
        AccessPolicy(
            name="dmz-to-database",
            source_zone=SecurityZone.DMZ,
            destination_zone=SecurityZone.RESTRICTED,
            protocol="tcp",
            ports=[3306, 5432],
            action="allow"
        ),
        AccessPolicy(
            name="internal-to-dmz",
            source_zone=SecurityZone.INTERNAL,
            destination_zone=SecurityZone.DMZ,
            protocol="tcp",
            ports=[80, 443],
            action="allow"
        ),
        AccessPolicy(
            name="management-to-all",
            source_zone=SecurityZone.MANAGEMENT,
            destination_zone=SecurityZone.INTERNAL,
            protocol="tcp",
            ports=[22, 3389],
            action="allow"
        )
    ]

    for policy in policies:
        manager.add_policy(policy)

    # 测试访问检查
    print("\n访问检查测试:")
    tests = [
        ("10.0.50.10", "10.0.40.20", 3306),  # DMZ -> Database
        ("10.0.20.10", "10.0.50.20", 80),    # Internal -> DMZ
        ("10.0.20.10", "10.0.40.20", 3306),  # Internal -> Database (应拒绝)
    ]

    for src, dst, port in tests:
        result = manager.check_access(src, dst, port)
        status = "允许" if result['allowed'] else "拒绝"
        print(f"  {src} -> {dst}:{port} : {status} ({result['reason']})")

    return manager

# 执行示例
if __name__ == "__main__":
    manager = setup_enterprise_network()
```

## VPN 技术

### VPN 类型对比

```
VPN 技术对比：

┌─────────────┬──────────────┬──────────────┬──────────────┐
│   特性       │  IPSec VPN   │  SSL/TLS VPN │  WireGuard   │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ 工作层      │ 网络层 (L3)   │ 传输层 (L4)  │ 网络层 (L3)  │
│ 使用场景    │ Site-to-Site │ 远程访问      │ 通用         │
│ 配置复杂度  │ 高            │ 中           │ 低           │
│ 性能        │ 高            │ 中           │ 很高         │
│ 代码行数    │ ~100,000      │ ~70,000      │ ~4,000       │
│ 客户端要求  │ 需要客户端    │ 浏览器即可   │ 需要客户端   │
│ NAT 穿透    │ 困难          │ 容易         │ 容易         │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

### WireGuard 配置

```ini
# /etc/wireguard/wg0.conf - 服务器端配置
[Interface]
# 服务器私钥
PrivateKey = SERVER_PRIVATE_KEY_HERE
# VPN 内网地址
Address = 10.0.0.1/24
# 监听端口
ListenPort = 51820
# 启动后执行的防火墙规则
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# 客户端配置
[Peer]
# 客户端公钥
PublicKey = CLIENT_PUBLIC_KEY_HERE
# 允许的 IP 范围
AllowedIPs = 10.0.0.2/32
```

```ini
# /etc/wireguard/wg0.conf - 客户端配置
[Interface]
# 客户端私钥
PrivateKey = CLIENT_PRIVATE_KEY_HERE
# 客户端 VPN 内网地址
Address = 10.0.0.2/24
# DNS 服务器
DNS = 8.8.8.8, 8.8.4.4

[Peer]
# 服务器公钥
PublicKey = SERVER_PUBLIC_KEY_HERE
# 服务器地址
Endpoint = vpn.example.com:51820
# 路由所有流量通过 VPN
AllowedIPs = 0.0.0.0/0, ::/0
# 保持连接活跃
PersistentKeepalive = 25
```

### VPN 管理脚本

```python
import subprocess
import os
from dataclasses import dataclass, field
from typing import List, Optional, Dict
import json
import base64

@dataclass
class WireGuardPeer:
    """WireGuard 对等节点"""
    name: str
    public_key: str
    allowed_ips: str
    endpoint: Optional[str] = None
    persistent_keepalive: int = 25
    preshared_key: Optional[str] = None

@dataclass
class WireGuardConfig:
    """WireGuard 配置"""
    interface_name: str
    private_key: str
    address: str
    listen_port: int = 51820
    dns: Optional[str] = None
    peers: List[WireGuardPeer] = field(default_factory=list)
    post_up: Optional[str] = None
    post_down: Optional[str] = None

class WireGuardManager:
    """WireGuard VPN 管理器"""

    def __init__(self, config_dir: str = '/etc/wireguard'):
        self.config_dir = config_dir

    @staticmethod
    def generate_keypair() -> tuple:
        """生成密钥对"""
        # 生成私钥
        private_key_result = subprocess.run(
            ['wg', 'genkey'],
            capture_output=True,
            text=True,
            check=True
        )
        private_key = private_key_result.stdout.strip()

        # 从私钥生成公钥
        public_key_result = subprocess.run(
            ['wg', 'pubkey'],
            input=private_key,
            capture_output=True,
            text=True,
            check=True
        )
        public_key = public_key_result.stdout.strip()

        return private_key, public_key

    @staticmethod
    def generate_preshared_key() -> str:
        """生成预共享密钥"""
        result = subprocess.run(
            ['wg', 'genpsk'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()

    def generate_config(self, config: WireGuardConfig) -> str:
        """生成配置文件内容"""
        lines = ['[Interface]']
        lines.append(f'PrivateKey = {config.private_key}')
        lines.append(f'Address = {config.address}')

        if config.listen_port:
            lines.append(f'ListenPort = {config.listen_port}')
        if config.dns:
            lines.append(f'DNS = {config.dns}')
        if config.post_up:
            lines.append(f'PostUp = {config.post_up}')
        if config.post_down:
            lines.append(f'PostDown = {config.post_down}')

        for peer in config.peers:
            lines.append('')
            lines.append('[Peer]')
            lines.append(f'# {peer.name}')
            lines.append(f'PublicKey = {peer.public_key}')
            lines.append(f'AllowedIPs = {peer.allowed_ips}')
            if peer.endpoint:
                lines.append(f'Endpoint = {peer.endpoint}')
            if peer.preshared_key:
                lines.append(f'PresharedKey = {peer.preshared_key}')
            if peer.persistent_keepalive:
                lines.append(f'PersistentKeepalive = {peer.persistent_keepalive}')

        return '\n'.join(lines)

    def save_config(self, config: WireGuardConfig):
        """保存配置文件"""
        config_path = os.path.join(
            self.config_dir,
            f'{config.interface_name}.conf'
        )
        content = self.generate_config(config)

        with open(config_path, 'w') as f:
            f.write(content)

        # 设置权限
        os.chmod(config_path, 0o600)
        print(f"配置已保存到: {config_path}")

    def start_interface(self, interface: str):
        """启动 VPN 接口"""
        subprocess.run(
            ['wg-quick', 'up', interface],
            check=True
        )
        print(f"接口 {interface} 已启动")

    def stop_interface(self, interface: str):
        """停止 VPN 接口"""
        subprocess.run(
            ['wg-quick', 'down', interface],
            check=True
        )
        print(f"接口 {interface} 已停止")

    def get_status(self, interface: str = None) -> Dict:
        """获取 VPN 状态"""
        cmd = ['wg', 'show']
        if interface:
            cmd.append(interface)

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return {'status': 'down', 'error': result.stderr}

        return {
            'status': 'up',
            'details': result.stdout
        }

    def add_peer(self, interface: str, peer: WireGuardPeer):
        """添加对等节点"""
        cmd = [
            'wg', 'set', interface,
            'peer', peer.public_key,
            'allowed-ips', peer.allowed_ips
        ]

        if peer.endpoint:
            cmd.extend(['endpoint', peer.endpoint])
        if peer.preshared_key:
            cmd.extend(['preshared-key', '/dev/stdin'])
        if peer.persistent_keepalive:
            cmd.extend(['persistent-keepalive', str(peer.persistent_keepalive)])

        if peer.preshared_key:
            subprocess.run(cmd, input=peer.preshared_key, text=True, check=True)
        else:
            subprocess.run(cmd, check=True)

        print(f"已添加对等节点: {peer.name}")

    def remove_peer(self, interface: str, public_key: str):
        """删除对等节点"""
        subprocess.run(
            ['wg', 'set', interface, 'peer', public_key, 'remove'],
            check=True
        )
        print(f"已删除对等节点: {public_key[:20]}...")

# 使用示例
def setup_vpn_server():
    """配置 VPN 服务器"""
    manager = WireGuardManager()

    # 生成服务器密钥
    server_private, server_public = manager.generate_keypair()
    print(f"服务器公钥: {server_public}")

    # 生成客户端密钥
    client_private, client_public = manager.generate_keypair()
    print(f"客户端公钥: {client_public}")

    # 服务器配置
    server_config = WireGuardConfig(
        interface_name='wg0',
        private_key=server_private,
        address='10.0.0.1/24',
        listen_port=51820,
        post_up='iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE',
        post_down='iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE',
        peers=[
            WireGuardPeer(
                name='client1',
                public_key=client_public,
                allowed_ips='10.0.0.2/32'
            )
        ]
    )

    # 客户端配置
    client_config = WireGuardConfig(
        interface_name='wg0',
        private_key=client_private,
        address='10.0.0.2/24',
        dns='8.8.8.8',
        peers=[
            WireGuardPeer(
                name='server',
                public_key=server_public,
                allowed_ips='0.0.0.0/0',
                endpoint='vpn.example.com:51820'
            )
        ]
    )

    print("\n服务器配置:")
    print(manager.generate_config(server_config))
    print("\n客户端配置:")
    print(manager.generate_config(client_config))
```

## 零信任网络架构

### 零信任核心原则

```
零信任架构 (Zero Trust Architecture) 核心原则：

1. 永不信任，始终验证 (Never Trust, Always Verify)
   └── 不论请求来源，每次访问都需要验证

2. 最小权限原则 (Least Privilege)
   └── 只授予完成任务所需的最小权限

3. 假设已被入侵 (Assume Breach)
   └── 假设攻击者已在网络内部，实施纵深防御

4. 明确验证 (Explicit Verification)
   └── 基于身份、设备、位置、行为等多因素验证

5. 持续监控 (Continuous Monitoring)
   └── 实时监控所有活动，及时发现异常

零信任实施要素：
┌─────────────────────────────────────────────┐
│                零信任架构                    │
├──────────────┬──────────────┬───────────────┤
│   身份验证    │   设备安全   │   网络分段    │
├──────────────┼──────────────┼───────────────┤
│ - MFA多因素  │ - 设备认证   │ - 微分段      │
│ - SSO单点登录│ - 设备合规   │ - 软件定义    │
│ - 身份管理   │ - 端点检测   │ - 加密通信    │
└──────────────┴──────────────┴───────────────┘
```

### 零信任访问控制实现

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import json

class DeviceCompliance(Enum):
    """设备合规状态"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    UNKNOWN = "unknown"

class RiskLevel(Enum):
    """风险等级"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class DeviceContext:
    """设备上下文"""
    device_id: str
    device_type: str
    os_version: str
    antivirus_active: bool = False
    firewall_enabled: bool = False
    disk_encrypted: bool = False
    last_patch_date: Optional[datetime] = None
    jailbroken: bool = False

@dataclass
class UserContext:
    """用户上下文"""
    user_id: str
    username: str
    groups: List[str] = field(default_factory=list)
    mfa_verified: bool = False
    last_password_change: Optional[datetime] = None
    risk_score: float = 0.5

@dataclass
class RequestContext:
    """请求上下文"""
    source_ip: str
    geo_location: str
    timestamp: datetime
    resource: str
    action: str
    is_corporate_network: bool = False
    vpn_connected: bool = False

@dataclass
class AccessDecision:
    """访问决策"""
    allowed: bool
    trust_score: float
    reason: str
    required_actions: List[str] = field(default_factory=list)
    session_restrictions: Dict = field(default_factory=dict)

class ZeroTrustEngine:
    """零信任策略引擎"""

    def __init__(self):
        self.registered_devices: Dict[str, DeviceContext] = {}
        self.user_sessions: Dict[str, Dict] = {}
        self.access_logs: List[Dict] = []

        # 资源安全等级
        self.resource_requirements = {
            'public': 0.3,
            'internal': 0.5,
            'confidential': 0.7,
            'restricted': 0.85,
            'critical': 0.95
        }

        # 可疑行为模式
        self.suspicious_patterns: Set[str] = set()

    def register_device(self, device: DeviceContext):
        """注册设备"""
        self.registered_devices[device.device_id] = device

    def calculate_device_trust(self, device: DeviceContext) -> float:
        """计算设备信任分数"""
        score = 0.0

        # 设备注册
        if device.device_id in self.registered_devices:
            score += 0.2

        # 安全软件
        if device.antivirus_active:
            score += 0.15
        if device.firewall_enabled:
            score += 0.1

        # 磁盘加密
        if device.disk_encrypted:
            score += 0.15

        # 系统更新
        if device.last_patch_date:
            days_since_patch = (datetime.now() - device.last_patch_date).days
            if days_since_patch < 7:
                score += 0.2
            elif days_since_patch < 30:
                score += 0.1

        # 越狱/Root 检测
        if device.jailbroken:
            score -= 0.3

        return max(0.0, min(1.0, score))

    def calculate_user_trust(self, user: UserContext) -> float:
        """计算用户信任分数"""
        score = 0.3  # 基础分

        # MFA 验证
        if user.mfa_verified:
            score += 0.3

        # 密码更新
        if user.last_password_change:
            days = (datetime.now() - user.last_password_change).days
            if days < 30:
                score += 0.1
            elif days > 90:
                score -= 0.1

        # 用户风险分数
        score += (1 - user.risk_score) * 0.2

        return max(0.0, min(1.0, score))

    def calculate_context_trust(self, request: RequestContext) -> float:
        """计算上下文信任分数"""
        score = 0.2  # 基础分

        # 企业网络
        if request.is_corporate_network:
            score += 0.3

        # VPN 连接
        if request.vpn_connected:
            score += 0.2

        # 地理位置异常检测
        if self._check_location_anomaly(request):
            score -= 0.3

        # 时间异常检测
        if self._check_time_anomaly(request):
            score -= 0.2

        return max(0.0, min(1.0, score))

    def _check_location_anomaly(self, request: RequestContext) -> bool:
        """检测地理位置异常"""
        # 简化实现：检查是否从高风险地区访问
        high_risk_locations = ['unknown', 'tor_exit']
        return request.geo_location.lower() in high_risk_locations

    def _check_time_anomaly(self, request: RequestContext) -> bool:
        """检测时间异常"""
        # 简化实现：非工作时间访问
        hour = request.timestamp.hour
        return hour < 6 or hour > 22

    def evaluate_access(self, user: UserContext, device: DeviceContext,
                       request: RequestContext,
                       resource_level: str = 'internal') -> AccessDecision:
        """评估访问请求"""
        # 计算各维度信任分数
        device_trust = self.calculate_device_trust(device)
        user_trust = self.calculate_user_trust(user)
        context_trust = self.calculate_context_trust(request)

        # 综合信任分数（加权平均）
        total_trust = (
            device_trust * 0.3 +
            user_trust * 0.4 +
            context_trust * 0.3
        )

        # 获取资源要求
        required_score = self.resource_requirements.get(resource_level, 0.5)

        # 生成决策
        required_actions = []
        session_restrictions = {}

        if total_trust >= required_score:
            allowed = True
            reason = f"访问已授权 (信任分数: {total_trust:.2f} >= 要求: {required_score:.2f})"

            # 添加会话限制
            if total_trust < required_score + 0.2:
                session_restrictions['timeout'] = 1800  # 30分钟超时
                session_restrictions['reauthentication'] = True

        elif total_trust >= required_score - 0.15:
            allowed = False
            reason = "需要额外验证"

            # 添加要求的操作
            if not user.mfa_verified:
                required_actions.append("完成 MFA 验证")
            if not device.antivirus_active:
                required_actions.append("启用防病毒软件")
            if not request.vpn_connected and not request.is_corporate_network:
                required_actions.append("连接企业 VPN")

        else:
            allowed = False
            reason = f"访问被拒绝 (信任分数: {total_trust:.2f} < 要求: {required_score:.2f})"

        decision = AccessDecision(
            allowed=allowed,
            trust_score=total_trust,
            reason=reason,
            required_actions=required_actions,
            session_restrictions=session_restrictions
        )

        # 记录访问日志
        self._log_access(user, device, request, decision)

        return decision

    def _log_access(self, user: UserContext, device: DeviceContext,
                   request: RequestContext, decision: AccessDecision):
        """记录访问日志"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'user_id': user.user_id,
            'device_id': device.device_id,
            'source_ip': request.source_ip,
            'resource': request.resource,
            'action': request.action,
            'decision': 'allowed' if decision.allowed else 'denied',
            'trust_score': decision.trust_score,
            'reason': decision.reason
        }
        self.access_logs.append(log_entry)

    def get_access_report(self) -> Dict:
        """生成访问报告"""
        total = len(self.access_logs)
        allowed = sum(1 for log in self.access_logs if log['decision'] == 'allowed')
        denied = total - allowed

        return {
            'total_requests': total,
            'allowed': allowed,
            'denied': denied,
            'denial_rate': denied / max(total, 1),
            'unique_users': len(set(log['user_id'] for log in self.access_logs)),
            'unique_devices': len(set(log['device_id'] for log in self.access_logs))
        }

# 使用示例
def demonstrate_zero_trust():
    """演示零信任访问控制"""
    engine = ZeroTrustEngine()

    # 注册合规设备
    device = DeviceContext(
        device_id='DEV-001',
        device_type='laptop',
        os_version='Windows 11',
        antivirus_active=True,
        firewall_enabled=True,
        disk_encrypted=True,
        last_patch_date=datetime.now() - timedelta(days=5)
    )
    engine.register_device(device)

    # 用户上下文
    user = UserContext(
        user_id='USER-001',
        username='john.doe',
        groups=['developers', 'employees'],
        mfa_verified=True,
        last_password_change=datetime.now() - timedelta(days=15),
        risk_score=0.2
    )

    # 请求上下文
    request = RequestContext(
        source_ip='10.0.20.100',
        geo_location='US',
        timestamp=datetime.now(),
        resource='/api/sensitive-data',
        action='read',
        is_corporate_network=True,
        vpn_connected=False
    )

    # 评估访问
    print("场景1: 合规设备 + MFA + 企业网络 -> 访问敏感资源")
    decision = engine.evaluate_access(user, device, request, 'confidential')
    print(f"  决策: {'允许' if decision.allowed else '拒绝'}")
    print(f"  信任分数: {decision.trust_score:.2f}")
    print(f"  原因: {decision.reason}")

    # 场景2: 未验证 MFA
    user.mfa_verified = False
    print("\n场景2: 未完成 MFA 验证")
    decision = engine.evaluate_access(user, device, request, 'confidential')
    print(f"  决策: {'允许' if decision.allowed else '拒绝'}")
    print(f"  信任分数: {decision.trust_score:.2f}")
    print(f"  原因: {decision.reason}")
    if decision.required_actions:
        print(f"  需要操作: {decision.required_actions}")

    # 场景3: 非企业网络
    user.mfa_verified = True
    request.is_corporate_network = False
    print("\n场景3: 从外部网络访问")
    decision = engine.evaluate_access(user, device, request, 'confidential')
    print(f"  决策: {'允许' if decision.allowed else '拒绝'}")
    print(f"  信任分数: {decision.trust_score:.2f}")

    print("\n访问报告:")
    print(engine.get_access_report())

if __name__ == "__main__":
    demonstrate_zero_trust()
```

## DDoS 攻击防护

### DDoS 攻击类型

```
DDoS 攻击分类：

1. 容量型攻击 (Volumetric Attacks)
   ├── UDP Flood - 大量 UDP 数据包淹没带宽
   ├── ICMP Flood - Ping 泛洪
   ├── DNS 放大 - 利用开放 DNS 解析器
   └── NTP 放大 - 利用 NTP monlist 命令

2. 协议型攻击 (Protocol Attacks)
   ├── SYN Flood - 耗尽服务器连接表
   ├── Ping of Death - 发送畸形 ICMP 包
   ├── Smurf Attack - ICMP 广播放大
   └── Fragmentation Attack - IP 分片攻击

3. 应用层攻击 (Application Layer Attacks)
   ├── HTTP Flood - 大量 HTTP 请求
   ├── Slowloris - 慢速连接攻击
   ├── RUDY - 慢速 POST 攻击
   └── DNS 查询泛洪

攻击规模参考：
├── 小规模: < 10 Gbps
├── 中规模: 10-100 Gbps
├── 大规模: 100-500 Gbps
└── 超大规模: > 500 Gbps
```

### DDoS 防护实现

```python
import time
import threading
import hashlib
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple
from enum import Enum

class AttackType(Enum):
    """攻击类型"""
    VOLUMETRIC = "volumetric"
    PROTOCOL = "protocol"
    APPLICATION = "application"

@dataclass
class RateLimitConfig:
    """速率限制配置"""
    requests_per_second: int = 100
    burst_size: int = 200
    block_duration: int = 300  # 秒
    warning_threshold: float = 0.8

@dataclass
class ConnectionConfig:
    """连接限制配置"""
    max_connections_per_ip: int = 100
    connection_timeout: int = 30
    slow_request_threshold: int = 10  # 秒

class DDoSProtection:
    """DDoS 防护系统"""

    def __init__(self, rate_config: RateLimitConfig = None,
                 conn_config: ConnectionConfig = None):
        self.rate_config = rate_config or RateLimitConfig()
        self.conn_config = conn_config or ConnectionConfig()

        # 请求计数器
        self.request_counts: Dict[str, List[float]] = defaultdict(list)
        # 封禁列表
        self.blocked_ips: Dict[str, float] = {}
        # 白名单
        self.whitelist: Set[str] = set()
        # 可疑 IP
        self.suspicious_ips: Dict[str, int] = defaultdict(int)
        # 连接追踪
        self.connections: Dict[str, List[Tuple[str, float]]] = defaultdict(list)

        # 统计数据
        self.stats = {
            'total_requests': 0,
            'blocked_requests': 0,
            'attacks_detected': 0
        }

        self.lock = threading.Lock()

    def add_to_whitelist(self, ip: str):
        """添加到白名单"""
        self.whitelist.add(ip)

    def _clean_old_requests(self, ip: str, window: float = 1.0):
        """清理过期请求记录"""
        now = time.time()
        self.request_counts[ip] = [
            t for t in self.request_counts[ip]
            if now - t < window
        ]

    def _is_blocked(self, ip: str) -> bool:
        """检查 IP 是否被封禁"""
        if ip in self.blocked_ips:
            if time.time() - self.blocked_ips[ip] > self.rate_config.block_duration:
                del self.blocked_ips[ip]
                return False
            return True
        return False

    def _block_ip(self, ip: str, reason: str):
        """封禁 IP"""
        self.blocked_ips[ip] = time.time()
        self.stats['attacks_detected'] += 1
        print(f"[DDoS Protection] IP {ip} 已封禁: {reason}")

    def check_request(self, ip: str, path: str = '/',
                     request_size: int = 0) -> Tuple[bool, str]:
        """
        检查请求是否应该被允许
        返回: (allowed: bool, reason: str)
        """
        self.stats['total_requests'] += 1

        # 白名单直接放行
        if ip in self.whitelist:
            return True, "白名单"

        with self.lock:
            # 检查封禁状态
            if self._is_blocked(ip):
                self.stats['blocked_requests'] += 1
                return False, "IP 已被封禁"

            now = time.time()
            self._clean_old_requests(ip)

            # 记录请求
            self.request_counts[ip].append(now)
            request_count = len(self.request_counts[ip])

            # 检查速率
            if request_count > self.rate_config.burst_size:
                self._block_ip(ip, f"请求速率过高: {request_count}/s")
                self.stats['blocked_requests'] += 1
                return False, "请求速率过高，IP 已封禁"

            if request_count > self.rate_config.requests_per_second:
                self.suspicious_ips[ip] += 1
                if self.suspicious_ips[ip] > 3:
                    self._block_ip(ip, "多次超过速率限制")
                self.stats['blocked_requests'] += 1
                return False, "请求速率超限"

            # 警告阈值
            if request_count > self.rate_config.requests_per_second * self.rate_config.warning_threshold:
                self.suspicious_ips[ip] += 1

            return True, "OK"

    def register_connection(self, ip: str, conn_id: str) -> Tuple[bool, str]:
        """注册新连接（防止 Slowloris）"""
        with self.lock:
            now = time.time()

            # 清理超时连接
            self.connections[ip] = [
                (cid, t) for cid, t in self.connections[ip]
                if now - t < self.conn_config.connection_timeout
            ]

            # 检查连接数
            if len(self.connections[ip]) >= self.conn_config.max_connections_per_ip:
                self.suspicious_ips[ip] += 1
                if self.suspicious_ips[ip] > 5:
                    self._block_ip(ip, "连接数过多（疑似 Slowloris）")
                return False, "连接数已达上限"

            self.connections[ip].append((conn_id, now))
            return True, "OK"

    def close_connection(self, ip: str, conn_id: str):
        """关闭连接"""
        with self.lock:
            self.connections[ip] = [
                (cid, t) for cid, t in self.connections[ip]
                if cid != conn_id
            ]

    def check_slow_request(self, ip: str, conn_id: str,
                          request_start: float) -> Tuple[bool, str]:
        """检测慢速请求攻击"""
        duration = time.time() - request_start

        if duration > self.conn_config.slow_request_threshold:
            self.suspicious_ips[ip] += 1
            if self.suspicious_ips[ip] > 3:
                self._block_ip(ip, f"慢速请求攻击: {duration:.2f}s")
                return False, "慢速请求被阻止"

        return True, "OK"

    def get_stats(self) -> Dict:
        """获取统计信息"""
        return {
            **self.stats,
            'currently_blocked': len(self.blocked_ips),
            'suspicious_ips': len(self.suspicious_ips),
            'active_connections': sum(
                len(conns) for conns in self.connections.values()
            ),
            'block_list': list(self.blocked_ips.keys())
        }

    def unblock_ip(self, ip: str):
        """解封 IP"""
        if ip in self.blocked_ips:
            del self.blocked_ips[ip]
            print(f"[DDoS Protection] IP {ip} 已解封")

class ChallengeResponse:
    """挑战-响应机制（用于应用层防护）"""

    def __init__(self, difficulty: int = 4):
        self.difficulty = difficulty
        self.pending_challenges: Dict[str, str] = {}
        self.verified_clients: Dict[str, float] = {}
        self.verification_ttl = 3600  # 1小时

    def generate_challenge(self, client_id: str) -> str:
        """生成挑战"""
        import secrets
        challenge = secrets.token_hex(16)
        self.pending_challenges[client_id] = challenge
        return challenge

    def verify_response(self, client_id: str, response: str) -> bool:
        """验证响应"""
        if client_id not in self.pending_challenges:
            return False

        challenge = self.pending_challenges[client_id]
        expected = hashlib.sha256(challenge.encode()).hexdigest()

        # 简化验证：检查响应是否正确
        if response == expected[:self.difficulty * 2]:
            del self.pending_challenges[client_id]
            self.verified_clients[client_id] = time.time()
            return True

        return False

    def is_verified(self, client_id: str) -> bool:
        """检查客户端是否已验证"""
        if client_id in self.verified_clients:
            if time.time() - self.verified_clients[client_id] < self.verification_ttl:
                return True
            del self.verified_clients[client_id]
        return False

# 使用示例
def demonstrate_ddos_protection():
    """演示 DDoS 防护"""
    protection = DDoSProtection(
        rate_config=RateLimitConfig(
            requests_per_second=10,
            burst_size=20,
            block_duration=60
        )
    )

    # 添加白名单
    protection.add_to_whitelist('10.0.0.1')

    # 模拟正常流量
    print("正常流量测试:")
    for i in range(5):
        allowed, reason = protection.check_request('192.168.1.100', '/')
        print(f"  请求 {i+1}: {'允许' if allowed else '拒绝'} - {reason}")

    # 模拟攻击流量
    print("\n模拟 DDoS 攻击:")
    attacker_ip = '10.10.10.10'
    for i in range(25):
        allowed, reason = protection.check_request(attacker_ip, '/')
        if not allowed:
            print(f"  请求 {i+1}: 拒绝 - {reason}")
            break

    # 查看统计
    print("\n防护统计:")
    stats = protection.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    demonstrate_ddos_protection()
```

## 网络监控与日志分析

### 网络流量监控

```python
import time
import threading
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import json

@dataclass
class FlowRecord:
    """网络流量记录"""
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    bytes_sent: int = 0
    bytes_received: int = 0
    packets_sent: int = 0
    packets_received: int = 0
    start_time: float = field(default_factory=time.time)
    last_update: float = field(default_factory=time.time)

@dataclass
class Alert:
    """监控告警"""
    timestamp: datetime
    alert_type: str
    severity: str
    source: str
    description: str
    metadata: Dict = field(default_factory=dict)

class NetworkMonitor:
    """网络流量监控系统"""

    def __init__(self):
        self.flows: Dict[str, FlowRecord] = {}
        self.alerts: List[Alert] = []
        self.statistics: Dict[str, Dict] = defaultdict(
            lambda: {'bytes': 0, 'packets': 0, 'connections': 0}
        )
        self.lock = threading.Lock()

        # 告警阈值
        self.thresholds = {
            'bytes_per_second': 100 * 1024 * 1024,  # 100 MB/s
            'packets_per_second': 100000,
            'connections_per_ip': 1000,
            'unusual_ports': [4444, 5555, 6666, 31337]  # 常见恶意端口
        }

        # 基线数据
        self.baseline: Dict[str, float] = {}

    def _get_flow_key(self, src_ip: str, dst_ip: str,
                     src_port: int, dst_port: int) -> str:
        """生成流量键"""
        return f"{src_ip}:{src_port}->{dst_ip}:{dst_port}"

    def record_packet(self, packet: Dict):
        """记录数据包"""
        with self.lock:
            src_ip = packet['src_ip']
            dst_ip = packet['dst_ip']
            src_port = packet.get('src_port', 0)
            dst_port = packet.get('dst_port', 0)
            protocol = packet.get('protocol', 'unknown')
            bytes_count = packet.get('bytes', 0)

            key = self._get_flow_key(src_ip, dst_ip, src_port, dst_port)
            now = time.time()

            if key not in self.flows:
                self.flows[key] = FlowRecord(
                    src_ip=src_ip,
                    dst_ip=dst_ip,
                    src_port=src_port,
                    dst_port=dst_port,
                    protocol=protocol
                )

            flow = self.flows[key]
            flow.bytes_sent += bytes_count
            flow.packets_sent += 1
            flow.last_update = now

            # 更新统计
            self.statistics[src_ip]['bytes'] += bytes_count
            self.statistics[src_ip]['packets'] += 1

            # 检测异常
            self._check_anomalies(src_ip, dst_port)

    def _check_anomalies(self, src_ip: str, dst_port: int):
        """检测流量异常"""
        stats = self.statistics[src_ip]

        # 检查带宽异常
        if stats['bytes'] > self.thresholds['bytes_per_second']:
            self._create_alert(
                alert_type='high_bandwidth',
                severity='warning',
                source=src_ip,
                description=f"IP {src_ip} 带宽使用异常: {stats['bytes'] / 1024 / 1024:.2f} MB"
            )

        # 检查可疑端口
        if dst_port in self.thresholds['unusual_ports']:
            self._create_alert(
                alert_type='suspicious_port',
                severity='high',
                source=src_ip,
                description=f"检测到可疑端口访问: {dst_port}"
            )

    def _create_alert(self, alert_type: str, severity: str,
                     source: str, description: str, **metadata):
        """创建告警"""
        alert = Alert(
            timestamp=datetime.now(),
            alert_type=alert_type,
            severity=severity,
            source=source,
            description=description,
            metadata=metadata
        )
        self.alerts.append(alert)

    def get_top_talkers(self, limit: int = 10) -> List[Tuple[str, Dict]]:
        """获取流量最大的 IP"""
        sorted_stats = sorted(
            self.statistics.items(),
            key=lambda x: x[1]['bytes'],
            reverse=True
        )
        return sorted_stats[:limit]

    def get_flow_summary(self) -> Dict:
        """获取流量摘要"""
        return {
            'total_flows': len(self.flows),
            'total_bytes': sum(f.bytes_sent for f in self.flows.values()),
            'total_packets': sum(f.packets_sent for f in self.flows.values()),
            'unique_sources': len(set(f.src_ip for f in self.flows.values())),
            'unique_destinations': len(set(f.dst_ip for f in self.flows.values())),
            'active_alerts': len(self.alerts)
        }

    def get_protocol_distribution(self) -> Dict[str, int]:
        """获取协议分布"""
        distribution = defaultdict(int)
        for flow in self.flows.values():
            distribution[flow.protocol] += flow.bytes_sent
        return dict(distribution)

    def export_flows(self, filepath: str):
        """导出流量数据"""
        export_data = []
        for key, flow in self.flows.items():
            export_data.append({
                'flow_key': key,
                'src_ip': flow.src_ip,
                'dst_ip': flow.dst_ip,
                'src_port': flow.src_port,
                'dst_port': flow.dst_port,
                'protocol': flow.protocol,
                'bytes_sent': flow.bytes_sent,
                'packets_sent': flow.packets_sent,
                'duration': flow.last_update - flow.start_time
            })

        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2)


class LogAnalyzer:
    """日志分析器"""

    def __init__(self):
        self.parsed_logs: List[Dict] = []
        self.security_events: List[Dict] = []

        # 攻击模式
        self.attack_patterns = [
            (r'\.\./|\.\.\\', 'Path Traversal'),
            (r'<script', 'XSS Attempt'),
            (r'union.*select', 'SQL Injection'),
            (r'eval\s*\(', 'Code Injection'),
            (r'/etc/passwd', 'Sensitive File Access'),
            (r'cmd\.exe|/bin/sh', 'Command Execution'),
        ]

    def parse_nginx_log(self, line: str) -> Optional[Dict]:
        """解析 Nginx 日志"""
        import re
        pattern = re.compile(
            r'(?P<ip>\d+\.\d+\.\d+\.\d+) - - '
            r'\[(?P<time>[^\]]+)\] '
            r'"(?P<method>\w+) (?P<path>[^ ]+) HTTP/[^"]*" '
            r'(?P<status>\d+) (?P<size>\d+) '
            r'"(?P<referer>[^"]*)" "(?P<user_agent>[^"]*)"'
        )

        match = pattern.match(line.strip())
        if match:
            return match.groupdict()
        return None

    def analyze_log_file(self, filepath: str):
        """分析日志文件"""
        import re

        with open(filepath, 'r') as f:
            for line in f:
                log_entry = self.parse_nginx_log(line)
                if log_entry:
                    self.parsed_logs.append(log_entry)
                    self._detect_security_event(log_entry)

    def _detect_security_event(self, log_entry: Dict):
        """检测安全事件"""
        import re

        path = log_entry.get('path', '')
        user_agent = log_entry.get('user_agent', '')

        for pattern, attack_type in self.attack_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                self.security_events.append({
                    'type': attack_type,
                    'ip': log_entry.get('ip'),
                    'path': path,
                    'timestamp': log_entry.get('time'),
                    'user_agent': user_agent
                })
                break

    def get_statistics(self) -> Dict:
        """获取统计信息"""
        from collections import Counter

        if not self.parsed_logs:
            return {}

        ips = [log['ip'] for log in self.parsed_logs if 'ip' in log]
        statuses = [log['status'] for log in self.parsed_logs if 'status' in log]
        methods = [log['method'] for log in self.parsed_logs if 'method' in log]

        return {
            'total_requests': len(self.parsed_logs),
            'unique_ips': len(set(ips)),
            'top_ips': Counter(ips).most_common(10),
            'status_distribution': dict(Counter(statuses)),
            'method_distribution': dict(Counter(methods)),
            'security_events': len(self.security_events),
            'events_by_type': dict(Counter(
                e['type'] for e in self.security_events
            ))
        }

    def generate_report(self) -> str:
        """生成安全报告"""
        stats = self.get_statistics()

        lines = [
            "=" * 60,
            "网络安全日志分析报告",
            "=" * 60,
            f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "基本统计:",
            f"  总请求数: {stats.get('total_requests', 0)}",
            f"  独立 IP 数: {stats.get('unique_ips', 0)}",
            f"  安全事件数: {stats.get('security_events', 0)}",
            "",
            "状态码分布:",
        ]

        for status, count in stats.get('status_distribution', {}).items():
            lines.append(f"  {status}: {count}")

        if stats.get('events_by_type'):
            lines.append("")
            lines.append("安全事件分布:")
            for event_type, count in stats['events_by_type'].items():
                lines.append(f"  {event_type}: {count}")

        lines.append("=" * 60)

        return '\n'.join(lines)

# 使用示例
if __name__ == "__main__":
    # 网络监控示例
    monitor = NetworkMonitor()

    # 模拟数据包
    test_packets = [
        {'src_ip': '192.168.1.100', 'dst_ip': '10.0.0.1',
         'src_port': 45678, 'dst_port': 80, 'protocol': 'tcp', 'bytes': 1500},
        {'src_ip': '192.168.1.100', 'dst_ip': '10.0.0.1',
         'src_port': 45679, 'dst_port': 443, 'protocol': 'tcp', 'bytes': 2000},
        {'src_ip': '192.168.1.101', 'dst_ip': '10.0.0.2',
         'src_port': 54321, 'dst_port': 4444, 'protocol': 'tcp', 'bytes': 500},
    ]

    for packet in test_packets:
        monitor.record_packet(packet)

    print("流量摘要:")
    print(json.dumps(monitor.get_flow_summary(), indent=2))

    print("\nTop Talkers:")
    for ip, stats in monitor.get_top_talkers(5):
        print(f"  {ip}: {stats['bytes']} bytes, {stats['packets']} packets")

    print("\n协议分布:")
    print(monitor.get_protocol_distribution())
```

## 安全最佳实践

### 网络安全检查清单

```markdown
## 网络安全检查清单

### 边界安全
- [ ] 部署边界防火墙，配置默认拒绝策略
- [ ] 启用入侵检测/防御系统 (IDS/IPS)
- [ ] 配置 DDoS 防护措施
- [ ] 实施 Web 应用防火墙 (WAF)
- [ ] 定期审查防火墙规则

### 网络分段
- [ ] 实施 VLAN 隔离关键系统
- [ ] 配置网络访问控制列表 (ACL)
- [ ] 隔离管理网络和生产网络
- [ ] 实施微分段策略
- [ ] DMZ 区域正确配置

### 访问控制
- [ ] 实施零信任网络架构
- [ ] 部署 VPN 用于远程访问
- [ ] 强制多因素认证 (MFA)
- [ ] 实施最小权限原则
- [ ] 定期审查访问权限

### 加密通信
- [ ] 强制使用 TLS 1.2 或更高版本
- [ ] 配置安全的加密套件
- [ ] 启用 HSTS
- [ ] 证书管理和自动续期
- [ ] 内部通信加密

### 监控和日志
- [ ] 启用全面的网络日志记录
- [ ] 部署 SIEM 系统
- [ ] 配置实时告警
- [ ] 定期日志审查
- [ ] 日志安全存储和备份

### 应急响应
- [ ] 制定安全事件响应计划
- [ ] 定期进行安全演练
- [ ] 建立事件升级流程
- [ ] 准备取证工具和流程
- [ ] 定期更新联系人列表
```

### 网络安全架构图

```
                        互联网
                           │
                    ┌──────┴──────┐
                    │   CDN/WAF   │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ DDoS 防护   │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ 边界防火墙  │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
      ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
      │    DMZ    │  │   VPN     │  │  远程访问  │
      │ (公开服务) │  │  网关     │  │   网关    │
      └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────┴──────┐
                    │ 内部防火墙  │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
 ┌─────┴─────┐       ┌─────┴─────┐       ┌─────┴─────┐
 │  应用层   │       │  数据层   │       │  管理层   │
 │  (Web/API) │       │ (数据库)  │       │ (监控)    │
 └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    ┌──────┴──────┐
                    │    SIEM     │
                    │  安全监控   │
                    └─────────────┘
```

## 面试要点

### 常见面试问题与答案

```
Q1: 什么是 TCP 三次握手？SYN Flood 如何利用它？

A: TCP 三次握手：
   1. 客户端发送 SYN 包
   2. 服务器返回 SYN-ACK 包
   3. 客户端发送 ACK 包，连接建立

   SYN Flood 攻击原理：
   - 攻击者发送大量伪造源 IP 的 SYN 包
   - 服务器为每个 SYN 分配资源等待 ACK
   - 因源 IP 伪造，ACK 永远不会到达
   - 服务器资源耗尽，无法处理正常请求

   防护措施：SYN Cookies、增加 backlog、减少重试次数

---

Q2: 状态检测防火墙和包过滤防火墙的区别？

A: 包过滤防火墙：
   - 只检查单个数据包的头部信息
   - 基于 IP/端口/协议过滤
   - 不维护连接状态，性能高但安全性较低

   状态检测防火墙：
   - 维护连接状态表，跟踪 TCP 连接
   - 能识别合法的响应包
   - 可防止某些欺骗攻击，更安全但资源消耗更大

---

Q3: IDS 和 IPS 的区别？

A: IDS (入侵检测系统)：
   - 被动监控，检测并告警
   - 不会中断流量
   - 部署方式：镜像/SPAN 口
   - 适合流量分析、取证

   IPS (入侵防御系统)：
   - 主动防护，检测并阻断
   - 串联部署，实时响应
   - 适合生产环境实时防护

---

Q4: 零信任架构的核心原则是什么？

A: 1. 永不信任，始终验证 - 每次访问都需验证
   2. 最小权限原则 - 只授予必要的最小权限
   3. 假设已被入侵 - 实施纵深防御
   4. 明确验证 - 基于身份、设备、位置等多因素
   5. 持续监控 - 实时监控所有活动

---

Q5: 如何防护 DDoS 攻击？

A: 多层防护策略：
   1. 网络层：增加带宽、BGP Anycast
   2. 边界层：CDN 分发、云清洗服务
   3. 服务器层：SYN Cookies、连接限制
   4. 应用层：验证码挑战、行为分析
   5. 应急措施：自动扩容、IP 黑名单
```

## 总结

网络安全是一个持续演进的领域，需要从多个层面构建纵深防御体系。本文涵盖了网络安全的核心知识：

1. **网络安全基础**：理解 OSI 模型各层的安全威胁
2. **防火墙技术**：掌握包过滤、状态检测和下一代防火墙
3. **入侵检测/防御**：了解 IDS/IPS 的工作原理和规则编写
4. **网络分段**：实施 VLAN 和微分段隔离策略
5. **VPN 技术**：配置安全的远程访问通道
6. **零信任架构**：实施现代化的安全访问控制
7. **DDoS 防护**：多层次的拒绝服务攻击防护
8. **监控与日志**：通过日志分析发现安全威胁

掌握这些知识，能够帮助你设计和实施有效的网络安全策略，保护组织的数字资产免受威胁。
