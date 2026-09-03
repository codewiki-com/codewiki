---
title: Linux 系统管理指南
description: 掌握Linux系统管理核心技能，成为合格的DevOps工程师
track: foundations
section: operating-systems
difficulty: intermediate
tags:
  - Linux
  - 系统管理
  - Shell
  - 运维
status: imported
origin: old/src/content/docs/devops/linux.zh.md
divergence: 0.144
issues: []
legacy:
  category: DevOps
  subcategory: System
  order: 11
  lastUpdated: 2026-01-07
---

Linux 是现代互联网基础设施的基石，从云服务器到容器环境，从嵌入式设备到超级计算机，Linux 无处不在。作为 DevOps 工程师，深入理解 Linux 系统管理是必备的核心技能。本文将系统性地介绍 Linux 系统管理的各个方面，帮助你建立完整的知识体系。

## Linux 文件系统与目录结构

### 文件系统层次标准（FHS）

Linux 遵循文件系统层次标准（Filesystem Hierarchy Standard），理解这个标准是系统管理的基础：

```
/
├── bin/        # 基本用户命令（ls, cp, mv 等）
├── boot/       # 引导加载程序文件和内核
├── dev/        # 设备文件
├── etc/        # 系统配置文件
├── home/       # 用户主目录
├── lib/        # 共享库文件
├── media/      # 可移动设备挂载点
├── mnt/        # 临时挂载点
├── opt/        # 第三方软件安装目录
├── proc/       # 进程和内核信息（虚拟文件系统）
├── root/       # root 用户主目录
├── run/        # 运行时数据
├── sbin/       # 系统管理命令
├── srv/        # 服务数据
├── sys/        # 内核和设备信息（虚拟文件系统）
├── tmp/        # 临时文件
├── usr/        # 用户程序和数据
│   ├── bin/    # 用户命令
│   ├── lib/    # 库文件
│   ├── local/  # 本地安装的软件
│   └── share/  # 共享数据
└── var/        # 可变数据（日志、缓存等）
    ├── log/    # 系统日志
    ├── cache/  # 应用缓存
    └── lib/    # 程序状态数据
```

### 重要目录详解

**`/etc` - 配置文件中心**

```bash
# 网络配置
/etc/hosts              # 静态主机名解析
/etc/hostname           # 主机名
/etc/resolv.conf        # DNS 配置
/etc/network/           # 网络接口配置（Debian系）
/etc/sysconfig/network-scripts/  # 网络配置（RHEL系）

# 用户和认证
/etc/passwd             # 用户账户信息
/etc/shadow             # 加密的用户密码
/etc/group              # 用户组信息
/etc/sudoers            # sudo 权限配置

# 系统服务
/etc/systemd/           # systemd 服务配置
/etc/crontab            # 系统级计划任务
```

**`/proc` - 进程信息**

```bash
# 查看 CPU 信息
cat /proc/cpuinfo

# 查看内存信息
cat /proc/meminfo

# 查看特定进程信息
ls /proc/1/           # PID 为 1 的进程信息
cat /proc/1/status    # 进程状态
cat /proc/1/cmdline   # 启动命令

# 内核参数
cat /proc/sys/net/ipv4/ip_forward  # IP 转发设置
```

### 文件类型与权限

Linux 中一切皆文件，文件类型通过首字符标识：

```bash
$ ls -la
drwxr-xr-x  # d - 目录
-rw-r--r--  # - - 普通文件
lrwxrwxrwx  # l - 符号链接
crw-rw----  # c - 字符设备
brw-rw----  # b - 块设备
srwxrwxrwx  # s - 套接字
prw-r--r--  # p - 命名管道
```

**权限位解析**：

```
-rwxr-xr-x  1  root  root  4096  Jan 15 10:00  script.sh
│└┬┘└┬┘└┬┘  │   │     │     │          │           │
│ │  │  │   │   │     │     │          │           └── 文件名
│ │  │  │   │   │     │     │          └── 修改时间
│ │  │  │   │   │     │     └── 文件大小
│ │  │  │   │   │     └── 所属组
│ │  │  │   │   └── 所有者
│ │  │  │   └── 硬链接数
│ │  │  └── 其他用户权限（r-x = 5）
│ │  └── 组权限（r-x = 5）
│ └── 所有者权限（rwx = 7）
└── 文件类型
```

## 用户与权限管理

### 用户管理命令

```bash
# 创建用户
useradd -m -s /bin/bash -G docker,sudo username
# -m: 创建主目录
# -s: 指定登录 shell
# -G: 添加到附加组

# 设置密码
passwd username

# 修改用户
usermod -aG wheel username  # 添加到 wheel 组
usermod -L username         # 锁定用户
usermod -U username         # 解锁用户

# 删除用户
userdel -r username  # -r: 同时删除主目录

# 查看用户信息
id username
groups username
```

### 组管理

```bash
# 创建组
groupadd developers

# 将用户添加到组
usermod -aG developers username

# 修改文件所属组
chgrp developers /project

# 删除组
groupdel developers
```

### 权限管理

```bash
# 修改权限（数字方式）
chmod 755 script.sh   # rwxr-xr-x
chmod 644 config.txt  # rw-r--r--
chmod 600 secret.key  # rw-------

# 修改权限（符号方式）
chmod u+x script.sh   # 给所有者添加执行权限
chmod g-w file.txt    # 移除组的写权限
chmod o=r file.txt    # 设置其他用户只读
chmod a+r file.txt    # 所有人添加读权限

# 递归修改
chmod -R 755 /var/www/html

# 修改所有者
chown user:group file.txt
chown -R www-data:www-data /var/www
```

### 特殊权限

```bash
# SUID (4) - 以文件所有者身份执行
chmod u+s /usr/bin/passwd
chmod 4755 /usr/bin/passwd

# SGID (2) - 以文件所属组身份执行，目录中新建文件继承组
chmod g+s /shared/project
chmod 2775 /shared/project

# Sticky Bit (1) - 只有所有者可删除文件（常用于 /tmp）
chmod +t /tmp
chmod 1777 /tmp

# 查看特殊权限
ls -la /usr/bin/passwd
-rwsr-xr-x 1 root root 68208 Jan 15 10:00 /usr/bin/passwd
```

### ACL 访问控制列表

```bash
# 查看 ACL
getfacl /data/project

# 设置用户 ACL
setfacl -m u:developer:rwx /data/project

# 设置组 ACL
setfacl -m g:devops:rx /data/project

# 设置默认 ACL（新文件继承）
setfacl -d -m g:devops:rwx /data/project

# 递归设置
setfacl -R -m u:developer:rwx /data/project

# 移除 ACL
setfacl -x u:developer /data/project
setfacl -b /data/project  # 移除所有 ACL
```

## 进程管理

### 查看进程

**ps 命令**：

```bash
# 查看所有进程
ps aux
# a: 显示所有用户的进程
# u: 显示详细信息
# x: 包括没有控制终端的进程

# 查看进程树
ps auxf

# 查看特定用户的进程
ps -u nginx

# 自定义输出格式
ps -eo pid,ppid,user,%cpu,%mem,stat,start,time,comm --sort=-%mem | head -20

# 查找特定进程
ps aux | grep nginx
pgrep -a nginx
```

**top/htop 实时监控**：

```bash
# top 常用快捷键
# P - 按 CPU 排序
# M - 按内存排序
# k - 杀死进程
# r - 调整优先级
# 1 - 显示每个 CPU 核心
# c - 显示完整命令

# 非交互式使用
top -bn1 | head -20

# htop（更友好的界面）
htop
```

### 进程控制

```bash
# 发送信号
kill PID           # 默认 SIGTERM (15)
kill -9 PID        # SIGKILL 强制终止
kill -HUP PID      # SIGHUP 重新加载配置
kill -STOP PID     # SIGSTOP 暂停进程
kill -CONT PID     # SIGCONT 继续进程

# 批量杀死进程
killall nginx
pkill -f "python script.py"

# 调整进程优先级
nice -n 10 ./script.sh       # 启动时设置（-20到19，越低优先级越高）
renice -n 5 -p PID           # 修改运行中进程

# 后台任务管理
./long_task.sh &             # 后台运行
nohup ./task.sh &            # 忽略挂断信号
jobs                         # 查看后台任务
fg %1                        # 将任务调到前台
bg %1                        # 继续后台运行
disown %1                    # 从 shell 分离
```

### systemd 服务管理

```bash
# 服务控制
systemctl start nginx
systemctl stop nginx
systemctl restart nginx
systemctl reload nginx       # 重新加载配置（不中断服务）
systemctl status nginx

# 开机启动
systemctl enable nginx
systemctl disable nginx
systemctl is-enabled nginx

# 查看所有服务
systemctl list-units --type=service
systemctl list-units --type=service --state=running

# 查看服务依赖
systemctl list-dependencies nginx

# 查看服务日志
journalctl -u nginx
journalctl -u nginx -f       # 实时跟踪
journalctl -u nginx --since "1 hour ago"
```

**创建自定义服务**：

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/myapp/server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# 重新加载 systemd 配置
systemctl daemon-reload
systemctl enable --now myapp
```

## Shell 脚本编程

### 脚本基础

```bash
#!/bin/bash
# 脚本说明注释

# 严格模式
set -euo pipefail
# -e: 命令失败时退出
# -u: 使用未定义变量时报错
# -o pipefail: 管道中任意命令失败时退出

# 变量
name="Linux"
version=5.15
echo "System: $name $version"
echo "Script path: $0"
echo "First argument: $1"
echo "All arguments: $@"
echo "Argument count: $#"

# 数组
servers=("web1" "web2" "db1")
echo "First: ${servers[0]}"
echo "All: ${servers[@]}"
echo "Count: ${#servers[@]}"

# 命令替换
current_date=$(date +%Y-%m-%d)
file_count=`ls -1 | wc -l`
```

### 条件判断

```bash
# 文件测试
if [ -f "/etc/passwd" ]; then
    echo "File exists"
fi

# 常用文件测试
# -f 文件存在且是普通文件
# -d 目录存在
# -e 文件/目录存在
# -r 可读
# -w 可写
# -x 可执行
# -s 文件大小大于0

# 字符串比较
if [ "$str1" = "$str2" ]; then
    echo "Strings are equal"
fi

if [ -z "$var" ]; then
    echo "Variable is empty"
fi

if [ -n "$var" ]; then
    echo "Variable is not empty"
fi

# 数值比较
if [ "$num" -eq 10 ]; then
    echo "Equal to 10"
fi
# -eq 等于, -ne 不等于
# -gt 大于, -ge 大于等于
# -lt 小于, -le 小于等于

# 逻辑运算
if [ "$a" -gt 5 ] && [ "$b" -lt 10 ]; then
    echo "Condition met"
fi

# 使用 [[ ]] 更强大的测试
if [[ "$str" =~ ^[0-9]+$ ]]; then
    echo "String is numeric"
fi

# case 语句
case "$action" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        start_service
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac
```

### 循环结构

```bash
# for 循环
for server in web1 web2 web3; do
    echo "Processing $server"
done

# 遍历数组
for server in "${servers[@]}"; do
    ssh "$server" "uptime"
done

# C 风格 for
for ((i=1; i<=10; i++)); do
    echo "Number: $i"
done

# 遍历文件
for file in /var/log/*.log; do
    echo "Processing: $file"
done

# while 循环
count=0
while [ $count -lt 5 ]; do
    echo "Count: $count"
    ((count++))
done

# 读取文件
while IFS= read -r line; do
    echo "Line: $line"
done < /etc/hosts

# 无限循环
while true; do
    check_service
    sleep 60
done
```

### 函数定义

```bash
#!/bin/bash

# 定义函数
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message"
}

# 带返回值的函数
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        return 0
    else
        return 1
    fi
}

# 使用函数
log "INFO" "Starting deployment"

if check_service "nginx"; then
    log "INFO" "Nginx is running"
else
    log "ERROR" "Nginx is not running"
    exit 1
fi

# 获取函数输出
get_memory_usage() {
    free -m | awk '/^Mem:/ {printf "%.2f", $3/$2 * 100}'
}

usage=$(get_memory_usage)
echo "Memory usage: ${usage}%"
```

### 实用脚本示例

**系统健康检查脚本**：

```bash
#!/bin/bash
set -euo pipefail

# 配置
THRESHOLD_CPU=80
THRESHOLD_MEM=80
THRESHOLD_DISK=90

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

check_cpu() {
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    cpu_int=${cpu_usage%.*}

    if [ "$cpu_int" -ge "$THRESHOLD_CPU" ]; then
        log "${RED}[CRITICAL]${NC} CPU usage: ${cpu_usage}%"
        return 1
    else
        log "${GREEN}[OK]${NC} CPU usage: ${cpu_usage}%"
        return 0
    fi
}

check_memory() {
    local mem_usage
    mem_usage=$(free | awk '/^Mem:/ {printf "%.0f", $3/$2 * 100}')

    if [ "$mem_usage" -ge "$THRESHOLD_MEM" ]; then
        log "${RED}[CRITICAL]${NC} Memory usage: ${mem_usage}%"
        return 1
    else
        log "${GREEN}[OK]${NC} Memory usage: ${mem_usage}%"
        return 0
    fi
}

check_disk() {
    local status=0
    while read -r line; do
        usage=$(echo "$line" | awk '{print $5}' | tr -d '%')
        mount=$(echo "$line" | awk '{print $6}')

        if [ "$usage" -ge "$THRESHOLD_DISK" ]; then
            log "${RED}[CRITICAL]${NC} Disk usage on $mount: ${usage}%"
            status=1
        else
            log "${GREEN}[OK]${NC} Disk usage on $mount: ${usage}%"
        fi
    done < <(df -h | grep '^/dev/')
    return $status
}

main() {
    log "=== System Health Check ==="

    local exit_code=0

    check_cpu || exit_code=1
    check_memory || exit_code=1
    check_disk || exit_code=1

    if [ $exit_code -eq 0 ]; then
        log "${GREEN}All checks passed${NC}"
    else
        log "${RED}Some checks failed${NC}"
    fi

    return $exit_code
}

main "$@"
```

## 网络配置与排错

### 网络配置

**查看网络信息**：

```bash
# 查看网络接口
ip addr show
ip a

# 查看路由表
ip route show
route -n

# 查看 ARP 缓存
ip neigh show
arp -a

# 查看监听端口
ss -tlnp    # TCP 监听
ss -ulnp    # UDP 监听
netstat -tlnp
```

**配置网络接口**：

```bash
# 临时配置
ip addr add 192.168.1.100/24 dev eth0
ip addr del 192.168.1.100/24 dev eth0
ip link set eth0 up
ip link set eth0 down
ip route add default via 192.168.1.1

# 永久配置（Ubuntu/Debian - Netplan）
# /etc/netplan/01-netcfg.yaml
```

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
# 应用配置
sudo netplan apply
```

### 网络排错工具

```bash
# 连通性测试
ping -c 4 google.com
ping6 -c 4 ipv6.google.com

# 路由追踪
traceroute google.com
mtr google.com

# DNS 查询
dig google.com
nslookup google.com
host google.com

# 端口测试
telnet host 80
nc -zv host 80
curl -v telnet://host:80

# 抓包分析
tcpdump -i eth0 -n port 80
tcpdump -i any -w capture.pcap
tcpdump -r capture.pcap

# HTTP 调试
curl -I https://example.com           # 只获取头部
curl -v https://example.com           # 详细输出
curl -X POST -d '{"key":"value"}' -H "Content-Type: application/json" URL
```

### 防火墙配置

**iptables**：

```bash
# 查看规则
iptables -L -n -v

# 允许已建立的连接
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 允许 SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# 允许 HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 默认拒绝
iptables -P INPUT DROP

# 保存规则
iptables-save > /etc/iptables/rules.v4
```

**firewalld**：

```bash
# 查看状态
firewall-cmd --state
firewall-cmd --list-all

# 添加服务
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https

# 添加端口
firewall-cmd --permanent --add-port=8080/tcp

# 重新加载
firewall-cmd --reload
```

## 磁盘与存储管理

### 磁盘信息

```bash
# 查看磁盘
lsblk
fdisk -l
parted -l

# 查看文件系统使用情况
df -h
df -i    # inode 使用情况

# 查看目录大小
du -sh /var/log
du -h --max-depth=1 /var

# 查看磁盘 I/O
iostat -x 1
iotop
```

### 分区与格式化

```bash
# 使用 fdisk 分区
fdisk /dev/sdb
# n - 新建分区
# d - 删除分区
# p - 打印分区表
# w - 写入并退出

# 使用 parted（支持大于 2TB 磁盘）
parted /dev/sdb
(parted) mklabel gpt
(parted) mkpart primary 0% 100%

# 格式化
mkfs.ext4 /dev/sdb1
mkfs.xfs /dev/sdb1

# 挂载
mount /dev/sdb1 /mnt/data

# 永久挂载（/etc/fstab）
echo "/dev/sdb1 /mnt/data ext4 defaults 0 2" >> /etc/fstab

# 使用 UUID 挂载（更可靠）
blkid /dev/sdb1
echo "UUID=xxx-xxx /mnt/data ext4 defaults 0 2" >> /etc/fstab
```

### LVM 逻辑卷管理

```bash
# 创建物理卷
pvcreate /dev/sdb /dev/sdc
pvs

# 创建卷组
vgcreate data_vg /dev/sdb /dev/sdc
vgs

# 创建逻辑卷
lvcreate -L 100G -n data_lv data_vg
lvcreate -l 100%FREE -n data_lv data_vg  # 使用所有剩余空间
lvs

# 格式化并挂载
mkfs.ext4 /dev/data_vg/data_lv
mount /dev/data_vg/data_lv /mnt/data

# 扩展逻辑卷
lvextend -L +50G /dev/data_vg/data_lv
resize2fs /dev/data_vg/data_lv    # ext4
xfs_growfs /mnt/data              # xfs
```

## 日志管理

### 系统日志

```bash
# 传统日志文件
/var/log/syslog      # 系统日志（Debian系）
/var/log/messages    # 系统日志（RHEL系）
/var/log/auth.log    # 认证日志
/var/log/kern.log    # 内核日志
/var/log/dmesg       # 启动日志

# 查看日志
tail -f /var/log/syslog
tail -100 /var/log/auth.log
less /var/log/messages
```

### journalctl

```bash
# 基本查询
journalctl                    # 所有日志
journalctl -b                 # 本次启动的日志
journalctl -b -1              # 上次启动的日志
journalctl --since "1 hour ago"
journalctl --since "2024-01-15 10:00:00"

# 按服务过滤
journalctl -u nginx
journalctl -u nginx -f        # 实时跟踪

# 按优先级过滤
journalctl -p err             # 错误及以上
journalctl -p warning         # 警告及以上

# 输出格式
journalctl -o json            # JSON 格式
journalctl -o json-pretty     # 格式化 JSON

# 磁盘使用
journalctl --disk-usage
journalctl --vacuum-size=1G   # 清理到 1G
journalctl --vacuum-time=30d  # 保留 30 天
```

### 日志轮转

```bash
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload myapp > /dev/null 2>&1 || true
    endscript
}
```

```bash
# 测试配置
logrotate -d /etc/logrotate.d/myapp

# 强制执行
logrotate -f /etc/logrotate.d/myapp
```

## 性能监控与调优

### 性能监控工具

```bash
# CPU 监控
top
htop
mpstat 1                      # 每秒显示 CPU 统计
vmstat 1                      # 虚拟内存统计

# 内存监控
free -h
cat /proc/meminfo
vmstat -s

# 磁盘 I/O
iostat -x 1
iotop
pidstat -d 1                  # 每个进程的 I/O

# 网络监控
iftop
nethogs
sar -n DEV 1                  # 网络统计

# 综合监控
dstat
glances
nmon
```

### 内核参数调优

```bash
# 查看当前参数
sysctl -a

# 临时修改
sysctl -w net.core.somaxconn=65535
sysctl -w vm.swappiness=10

# 永久修改 /etc/sysctl.conf
cat >> /etc/sysctl.conf << 'EOF'
# 网络优化
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.ip_local_port_range = 1024 65535

# 内存优化
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 5

# 文件描述符
fs.file-max = 2097152
EOF

# 应用修改
sysctl -p
```

### 文件描述符限制

```bash
# 查看当前限制
ulimit -a
ulimit -n    # 文件描述符限制

# 临时修改
ulimit -n 65535

# 永久修改 /etc/security/limits.conf
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
root soft nofile 65535
root hard nofile 65535
EOF

# systemd 服务限制
# 在 [Service] 段添加
LimitNOFILE=65535
LimitNPROC=65535
```

## 安全加固

### SSH 安全配置

```bash
# /etc/ssh/sshd_config
Port 22022                          # 修改默认端口
PermitRootLogin no                  # 禁止 root 登录
PasswordAuthentication no           # 禁用密码认证
PubkeyAuthentication yes            # 启用公钥认证
MaxAuthTries 3                      # 最大尝试次数
ClientAliveInterval 300             # 超时时间
ClientAliveCountMax 2               # 超时次数
AllowUsers admin deploy             # 允许的用户
Protocol 2                          # 只使用 SSH2

# 重启服务
systemctl restart sshd
```

### 用户安全

```bash
# 密码策略 /etc/login.defs
PASS_MAX_DAYS   90
PASS_MIN_DAYS   7
PASS_MIN_LEN    12
PASS_WARN_AGE   14

# 密码复杂度（PAM）
# /etc/pam.d/common-password
password requisite pam_pwquality.so retry=3 minlen=12 difok=3 ucredit=-1 lcredit=-1 dcredit=-1

# 锁定失败次数过多的账户
# /etc/pam.d/common-auth
auth required pam_tally2.so deny=5 unlock_time=900
```

### 系统加固

```bash
# 禁用不需要的服务
systemctl disable cups
systemctl disable avahi-daemon
systemctl disable bluetooth

# 内核安全参数
cat >> /etc/sysctl.conf << 'EOF'
# 禁用 IP 转发（非路由器）
net.ipv4.ip_forward = 0

# 禁用 ICMP 重定向
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0

# 禁用源路由
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# 启用 SYN Cookie
net.ipv4.tcp_syncookies = 1

# 忽略 ICMP 广播
net.ipv4.icmp_echo_ignore_broadcasts = 1

# 记录可疑包
net.ipv4.conf.all.log_martians = 1
EOF

# 文件权限加固
chmod 700 /root
chmod 600 /etc/shadow
chmod 644 /etc/passwd
chmod 644 /etc/group
```

### 审计与监控

```bash
# 安装 auditd
apt install auditd
systemctl enable auditd

# 配置审计规则 /etc/audit/rules.d/audit.rules
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /var/log/auth.log -p wa -k auth_log

# 查看审计日志
ausearch -k identity
aureport --summary

# 安装 fail2ban
apt install fail2ban
systemctl enable fail2ban

# 配置 /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

## 面试要点

### 常见面试题

**Q1: Linux 启动过程是怎样的？**

```
1. BIOS/UEFI 自检
2. 加载引导程序（GRUB）
3. 加载内核（vmlinuz）和初始化内存盘（initrd/initramfs）
4. 内核初始化硬件，挂载根文件系统
5. 启动 init 进程（PID 1）- 现代系统为 systemd
6. systemd 启动系统服务
7. 启动登录服务，等待用户登录
```

**Q2: 如何排查高 CPU 使用率？**

```bash
# 找出高 CPU 进程
top -c
ps aux --sort=-%cpu | head -10

# 分析进程
pidstat -p PID 1

# 查看进程的线程
top -H -p PID

# 分析系统调用
strace -p PID -c

# 分析进程内存映射
pmap PID

# 对于 Java 应用
jstack PID > thread_dump.txt
```

**Q3: 如何排查内存泄漏？**

```bash
# 查看内存使用趋势
free -h
vmstat 1

# 按内存排序进程
ps aux --sort=-%mem | head -10

# 查看进程详细内存
cat /proc/PID/status | grep -i mem
pmap -x PID

# 查看 OOM killer 日志
dmesg | grep -i "killed process"
journalctl -k | grep -i "out of memory"

# 使用 valgrind（开发环境）
valgrind --leak-check=full ./program
```

**Q4: 文件系统满了怎么处理？**

```bash
# 查看磁盘使用
df -h

# 找出大文件
du -sh /* | sort -hr | head -20
find / -type f -size +100M -exec ls -lh {} \;

# 查看已删除但未释放的文件
lsof +L1

# 清理日志
journalctl --vacuum-size=100M
logrotate -f /etc/logrotate.conf

# 清理包缓存
apt clean                    # Debian/Ubuntu
yum clean all               # RHEL/CentOS
```

### 核心知识点

| 主题 | 关键点 |
|------|--------|
| 文件系统 | FHS 标准、ext4/xfs 区别、inode 概念 |
| 权限 | rwx 位、特殊权限、ACL |
| 进程 | 进程状态、信号、僵尸进程处理 |
| 内存 | 虚拟内存、swap、OOM killer |
| 网络 | TCP/IP 协议栈、iptables、常用排错工具 |
| 存储 | LVM、RAID 级别、磁盘 I/O 调度器 |
| 安全 | SSH 加固、防火墙、SELinux/AppArmor |
| 性能 | 常用监控工具、内核参数调优 |

### 实战技能清单

```markdown
## 必备技能

- [ ] 熟练使用 vim/nano 编辑器
- [ ] 掌握常用命令：grep、awk、sed、find
- [ ] 能够编写 Shell 脚本自动化任务
- [ ] 熟悉 systemd 服务管理
- [ ] 掌握网络配置和排错
- [ ] 理解文件系统和权限管理
- [ ] 掌握日志分析和性能监控
- [ ] 了解安全加固最佳实践

## 进阶技能

- [ ] LVM 和 RAID 管理
- [ ] 内核参数调优
- [ ] 容器和虚拟化基础
- [ ] 配置管理工具（Ansible）
- [ ] 监控系统搭建（Prometheus + Grafana）
```

## 总结

Linux 系统管理是一个广泛而深入的领域，本文涵盖了从文件系统、用户权限、进程管理到网络配置、安全加固等核心主题。作为 DevOps 工程师，你需要：

1. **打好基础**：熟悉文件系统结构、权限管理和常用命令
2. **掌握工具**：熟练使用性能监控、日志分析、网络排错工具
3. **自动化思维**：用 Shell 脚本和配置管理工具提高效率
4. **安全意识**：始终考虑系统安全，遵循最小权限原则
5. **持续学习**：Linux 生态系统不断发展，保持学习的热情

记住，理论知识需要通过实践来巩固。建议在虚拟机或云服务器上进行实验，逐步积累经验。遇到问题时，善用 `man` 命令查看文档，搜索社区资源，并记录自己的学习笔记。

掌握 Linux 系统管理，将为你的 DevOps 之路奠定坚实的基础。
