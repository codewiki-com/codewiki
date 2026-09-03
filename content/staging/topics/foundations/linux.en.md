---
title: Linux System Administration Guide
description: Master Linux administration for DevOps engineering
track: foundations
section: operating-systems
difficulty: intermediate
tags:
  - Linux
  - System Admin
  - Shell
  - Operations
status: imported
origin: old/src/content/docs/devops/linux.en.md
divergence: 0.144
issues: []
legacy:
  category: DevOps
  subcategory: System
  order: 11
  lastUpdated: 2026-01-07
---

Linux is the cornerstone of modern internet infrastructure. From cloud servers to container environments, from embedded devices to supercomputers, Linux is ubiquitous. As a DevOps engineer, deep understanding of Linux system administration is an essential core skill. This article covers all aspects of Linux system administration to help you build a complete knowledge framework.

## Linux Filesystem and Directory Structure

### Filesystem Hierarchy Standard (FHS)

Linux follows the Filesystem Hierarchy Standard (FHS). Understanding this standard is fundamental to system administration:

```
/
├── bin/        # Essential user commands (ls, cp, mv, etc.)
├── boot/       # Boot loader files and kernel
├── dev/        # Device files
├── etc/        # System configuration files
├── home/       # User home directories
├── lib/        # Shared library files
├── media/      # Mount points for removable media
├── mnt/        # Temporary mount points
├── opt/        # Third-party software installation directory
├── proc/       # Process and kernel information (virtual filesystem)
├── root/       # Root user's home directory
├── run/        # Runtime data
├── sbin/       # System administration commands
├── srv/        # Service data
├── sys/        # Kernel and device information (virtual filesystem)
├── tmp/        # Temporary files
├── usr/        # User programs and data
│   ├── bin/    # User commands
│   ├── lib/    # Library files
│   ├── local/  # Locally installed software
│   └── share/  # Shared data
└── var/        # Variable data (logs, cache, etc.)
    ├── log/    # System logs
    ├── cache/  # Application cache
    └── lib/    # Program state data
```

### Important Directories Explained

**/etc - Configuration File Center**

```bash
# Network configuration
/etc/hosts              # Static hostname resolution
/etc/hostname           # Hostname
/etc/resolv.conf        # DNS configuration
/etc/network/           # Network interface config (Debian-based)
/etc/sysconfig/network-scripts/  # Network config (RHEL-based)

# Users and authentication
/etc/passwd             # User account information
/etc/shadow             # Encrypted user passwords
/etc/group              # Group information
/etc/sudoers            # sudo privilege configuration

# System services
/etc/systemd/           # systemd service configuration
/etc/crontab            # System-level scheduled tasks
```

**/proc - Process Information**

```bash
# View CPU information
cat /proc/cpuinfo

# View memory information
cat /proc/meminfo

# View specific process information
ls /proc/1/           # Process information for PID 1
cat /proc/1/status    # Process status
cat /proc/1/cmdline   # Startup command

# Kernel parameters
cat /proc/sys/net/ipv4/ip_forward  # IP forwarding setting
```

### File Types and Permissions

In Linux, everything is a file. File types are identified by the first character:

```bash
$ ls -la
drwxr-xr-x  # d - directory
-rw-r--r--  # - - regular file
lrwxrwxrwx  # l - symbolic link
crw-rw----  # c - character device
brw-rw----  # b - block device
srwxrwxrwx  # s - socket
prw-r--r--  # p - named pipe (FIFO)
```

**Permission Bit Analysis**:

```
-rwxr-xr-x  1  root  root  4096  Jan 15 10:00  script.sh
│└┬┘└┬┘└┬┘  │   │     │     │          │           │
│ │  │  │   │   │     │     │          │           └── Filename
│ │  │  │   │   │     │     │          └── Modification time
│ │  │  │   │   │     │     └── File size
│ │  │  │   │   │     └── Group owner
│ │  │  │   │   └── Owner
│ │  │  │   └── Hard link count
│ │  │  └── Other users permission (r-x = 5)
│ │  └── Group permission (r-x = 5)
│ └── Owner permission (rwx = 7)
└── File type
```

**Understanding Permission Values**:

| Permission | Symbol | Numeric Value |
|------------|--------|---------------|
| Read       | r      | 4             |
| Write      | w      | 2             |
| Execute    | x      | 1             |
| None       | -      | 0             |

Common permission combinations:
- `755` (rwxr-xr-x) - Executables and directories
- `644` (rw-r--r--) - Regular files
- `600` (rw-------) - Private files
- `777` (rwxrwxrwx) - Full access (use sparingly)

## User and Permission Management

### User Management Commands

```bash
# Create user
useradd -m -s /bin/bash -G docker,sudo username
# -m: Create home directory
# -s: Specify login shell
# -G: Add to supplementary groups

# Set password
passwd username

# Modify user
usermod -aG wheel username  # Add to wheel group
usermod -L username         # Lock user account
usermod -U username         # Unlock user account

# Delete user
userdel -r username  # -r: Also remove home directory

# View user information
id username
groups username
whoami
who
w
```

### Group Management

```bash
# Create group
groupadd developers

# Add user to group
usermod -aG developers username

# Change file group ownership
chgrp developers /project

# Delete group
groupdel developers

# View group members
getent group developers
```

### Permission Management

```bash
# Modify permissions (numeric method)
chmod 755 script.sh   # rwxr-xr-x
chmod 644 config.txt  # rw-r--r--
chmod 600 secret.key  # rw-------

# Modify permissions (symbolic method)
chmod u+x script.sh   # Add execute permission for owner
chmod g-w file.txt    # Remove write permission for group
chmod o=r file.txt    # Set others to read-only
chmod a+r file.txt    # Add read permission for all

# Recursive modification
chmod -R 755 /var/www/html

# Change ownership
chown user:group file.txt
chown -R www-data:www-data /var/www
```

### Special Permissions

```bash
# SUID (4) - Execute as file owner
chmod u+s /usr/bin/passwd
chmod 4755 /usr/bin/passwd

# SGID (2) - Execute as file group; new files in directory inherit group
chmod g+s /shared/project
chmod 2775 /shared/project

# Sticky Bit (1) - Only owner can delete files (commonly used for /tmp)
chmod +t /tmp
chmod 1777 /tmp

# View special permissions
ls -la /usr/bin/passwd
-rwsr-xr-x 1 root root 68208 Jan 15 10:00 /usr/bin/passwd
```

### ACL (Access Control Lists)

ACLs provide more fine-grained access control beyond traditional Unix permissions:

```bash
# View ACL
getfacl /data/project

# Set user ACL
setfacl -m u:developer:rwx /data/project

# Set group ACL
setfacl -m g:devops:rx /data/project

# Set default ACL (new files inherit)
setfacl -d -m g:devops:rwx /data/project

# Recursive setting
setfacl -R -m u:developer:rwx /data/project

# Remove ACL
setfacl -x u:developer /data/project
setfacl -b /data/project  # Remove all ACLs
```

## Process Management

### Viewing Processes

**ps Command**:

```bash
# View all processes
ps aux
# a: Show processes from all users
# u: Show detailed information
# x: Include processes without controlling terminal

# View process tree
ps auxf

# View processes for specific user
ps -u nginx

# Custom output format
ps -eo pid,ppid,user,%cpu,%mem,stat,start,time,comm --sort=-%mem | head -20

# Find specific processes
ps aux | grep nginx
pgrep -a nginx
```

**top/htop Real-time Monitoring**:

```bash
# top keyboard shortcuts
# P - Sort by CPU
# M - Sort by memory
# k - Kill process
# r - Renice (adjust priority)
# 1 - Show each CPU core
# c - Show full command
# q - Quit

# Non-interactive usage
top -bn1 | head -20

# htop (more user-friendly interface)
htop
```

### Process Control

```bash
# Send signals
kill PID           # Default SIGTERM (15)
kill -9 PID        # SIGKILL - force terminate
kill -HUP PID      # SIGHUP - reload configuration
kill -STOP PID     # SIGSTOP - pause process
kill -CONT PID     # SIGCONT - continue process

# Kill processes by name
killall nginx
pkill -f "python script.py"

# Adjust process priority
nice -n 10 ./script.sh       # Set at startup (-20 to 19, lower = higher priority)
renice -n 5 -p PID           # Modify running process

# Background job management
./long_task.sh &             # Run in background
nohup ./task.sh &            # Ignore hangup signal
jobs                         # List background jobs
fg %1                        # Bring job to foreground
bg %1                        # Continue job in background
disown %1                    # Detach from shell
```

### systemd Service Management

```bash
# Service control
systemctl start nginx
systemctl stop nginx
systemctl restart nginx
systemctl reload nginx       # Reload configuration (no service interruption)
systemctl status nginx

# Boot startup
systemctl enable nginx
systemctl disable nginx
systemctl is-enabled nginx

# View all services
systemctl list-units --type=service
systemctl list-units --type=service --state=running

# View service dependencies
systemctl list-dependencies nginx

# View service logs
journalctl -u nginx
journalctl -u nginx -f       # Real-time follow
journalctl -u nginx --since "1 hour ago"
```

**Creating Custom Services**:

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
# Reload systemd configuration
systemctl daemon-reload
systemctl enable --now myapp
```

## Shell Scripting

### Script Basics

```bash
#!/bin/bash
# Script description comment

# Strict mode
set -euo pipefail
# -e: Exit on command failure
# -u: Error on undefined variable usage
# -o pipefail: Exit on any failure in pipeline

# Variables
name="Linux"
version=5.15
echo "System: $name $version"
echo "Script path: $0"
echo "First argument: $1"
echo "All arguments: $@"
echo "Argument count: $#"
echo "Exit status of last command: $?"

# Arrays
servers=("web1" "web2" "db1")
echo "First: ${servers[0]}"
echo "All: ${servers[@]}"
echo "Count: ${#servers[@]}"

# Command substitution
current_date=$(date +%Y-%m-%d)
file_count=$(ls -1 | wc -l)
```

### Conditional Statements

```bash
# File tests
if [ -f "/etc/passwd" ]; then
    echo "File exists"
fi

# Common file tests
# -f  File exists and is a regular file
# -d  Directory exists
# -e  File/directory exists
# -r  File is readable
# -w  File is writable
# -x  File is executable
# -s  File size is greater than 0
# -L  File is a symbolic link

# String comparison
if [ "$str1" = "$str2" ]; then
    echo "Strings are equal"
fi

if [ -z "$var" ]; then
    echo "Variable is empty"
fi

if [ -n "$var" ]; then
    echo "Variable is not empty"
fi

# Numeric comparison
if [ "$num" -eq 10 ]; then
    echo "Equal to 10"
fi
# -eq equal, -ne not equal
# -gt greater than, -ge greater than or equal
# -lt less than, -le less than or equal

# Logical operators
if [ "$a" -gt 5 ] && [ "$b" -lt 10 ]; then
    echo "Condition met"
fi

# Using [[ ]] for more powerful tests
if [[ "$str" =~ ^[0-9]+$ ]]; then
    echo "String is numeric"
fi

# case statement
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

### Loop Structures

```bash
# for loop
for server in web1 web2 web3; do
    echo "Processing $server"
done

# Iterate over array
for server in "${servers[@]}"; do
    ssh "$server" "uptime"
done

# C-style for loop
for ((i=1; i<=10; i++)); do
    echo "Number: $i"
done

# Iterate over files
for file in /var/log/*.log; do
    echo "Processing: $file"
done

# while loop
count=0
while [ $count -lt 5 ]; do
    echo "Count: $count"
    ((count++))
done

# Read file line by line
while IFS= read -r line; do
    echo "Line: $line"
done < /etc/hosts

# Infinite loop
while true; do
    check_service
    sleep 60
done

# until loop
count=0
until [ $count -ge 5 ]; do
    echo "Count: $count"
    ((count++))
done
```

### Function Definitions

```bash
#!/bin/bash

# Define function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message"
}

# Function with return value
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        return 0
    else
        return 1
    fi
}

# Using functions
log "INFO" "Starting deployment"

if check_service "nginx"; then
    log "INFO" "Nginx is running"
else
    log "ERROR" "Nginx is not running"
    exit 1
fi

# Capture function output
get_memory_usage() {
    free -m | awk '/^Mem:/ {printf "%.2f", $3/$2 * 100}'
}

usage=$(get_memory_usage)
echo "Memory usage: ${usage}%"
```

### Practical Script Examples

**System Health Check Script**:

```bash
#!/bin/bash
set -euo pipefail

# Configuration
THRESHOLD_CPU=80
THRESHOLD_MEM=80
THRESHOLD_DISK=90

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

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

**Backup Script with Rotation**:

```bash
#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="/backup"
SOURCE_DIR="/var/www/html"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="website_backup_${DATE}.tar.gz"

# Create backup
create_backup() {
    echo "Creating backup: ${BACKUP_NAME}"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"
    echo "Backup created successfully"
}

# Rotate old backups
rotate_backups() {
    echo "Rotating backups older than ${RETENTION_DAYS} days"
    find "${BACKUP_DIR}" -name "website_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    echo "Rotation complete"
}

# Main
main() {
    # Ensure backup directory exists
    mkdir -p "${BACKUP_DIR}"

    create_backup
    rotate_backups

    # Show remaining backups
    echo "Current backups:"
    ls -lh "${BACKUP_DIR}"/*.tar.gz 2>/dev/null || echo "No backups found"
}

main "$@"
```

## Network Configuration and Troubleshooting

### Network Configuration

**Viewing Network Information**:

```bash
# View network interfaces
ip addr show
ip a

# View routing table
ip route show
route -n

# View ARP cache
ip neigh show
arp -a

# View listening ports
ss -tlnp    # TCP listening
ss -ulnp    # UDP listening
ss -tulnp   # Both TCP and UDP
netstat -tlnp

# View all connections
ss -a
netstat -an
```

**Configuring Network Interfaces**:

```bash
# Temporary configuration
ip addr add 192.168.1.100/24 dev eth0
ip addr del 192.168.1.100/24 dev eth0
ip link set eth0 up
ip link set eth0 down
ip route add default via 192.168.1.1

# Permanent configuration (Ubuntu/Debian - Netplan)
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
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
# Apply configuration
sudo netplan apply

# RHEL/CentOS configuration
# /etc/sysconfig/network-scripts/ifcfg-eth0
```

### Network Troubleshooting Tools

```bash
# Connectivity tests
ping -c 4 google.com
ping6 -c 4 ipv6.google.com

# Route tracing
traceroute google.com
mtr google.com           # Interactive route analysis

# DNS queries
dig google.com
dig google.com +short    # Short output
dig @8.8.8.8 google.com  # Specify DNS server
nslookup google.com
host google.com

# Port testing
telnet host 80
nc -zv host 80           # Netcat verbose zero-I/O mode
curl -v telnet://host:80

# Packet capture
tcpdump -i eth0 -n port 80
tcpdump -i any -w capture.pcap
tcpdump -r capture.pcap

# HTTP debugging
curl -I https://example.com           # Headers only
curl -v https://example.com           # Verbose output
curl -X POST -d '{"key":"value"}' -H "Content-Type: application/json" URL
curl -o /dev/null -s -w "%{http_code}" URL  # Get status code only
```

### Firewall Configuration

**iptables**:

```bash
# View rules
iptables -L -n -v
iptables -L -n -v --line-numbers

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Default deny
iptables -P INPUT DROP

# Save rules
iptables-save > /etc/iptables/rules.v4

# Restore rules
iptables-restore < /etc/iptables/rules.v4
```

**firewalld (RHEL/CentOS)**:

```bash
# Check status
firewall-cmd --state
firewall-cmd --list-all

# Add services
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https

# Add ports
firewall-cmd --permanent --add-port=8080/tcp

# Remove services/ports
firewall-cmd --permanent --remove-service=http
firewall-cmd --permanent --remove-port=8080/tcp

# Reload configuration
firewall-cmd --reload
```

**UFW (Ubuntu)**:

```bash
# Enable/disable
ufw enable
ufw disable
ufw status verbose

# Allow/deny
ufw allow ssh
ufw allow 80/tcp
ufw allow from 192.168.1.0/24
ufw deny 23/tcp

# Delete rules
ufw delete allow 80/tcp
```

## Disk and Storage Management

### Disk Information

```bash
# View disks
lsblk
lsblk -f     # Show filesystem info
fdisk -l
parted -l

# View filesystem usage
df -h
df -i        # inode usage

# View directory size
du -sh /var/log
du -h --max-depth=1 /var
du -sh * | sort -hr | head -10  # Top 10 largest items

# View disk I/O
iostat -x 1
iotop
```

### Partitioning and Formatting

```bash
# Using fdisk for partitioning
fdisk /dev/sdb
# n - Create new partition
# d - Delete partition
# p - Print partition table
# w - Write changes and exit

# Using parted (supports disks larger than 2TB)
parted /dev/sdb
(parted) mklabel gpt
(parted) mkpart primary 0% 100%

# Format partitions
mkfs.ext4 /dev/sdb1
mkfs.xfs /dev/sdb1
mkfs.btrfs /dev/sdb1

# Mount
mount /dev/sdb1 /mnt/data

# Unmount
umount /mnt/data

# Permanent mount (/etc/fstab)
echo "/dev/sdb1 /mnt/data ext4 defaults 0 2" >> /etc/fstab

# Using UUID for mounting (more reliable)
blkid /dev/sdb1
echo "UUID=xxx-xxx-xxx /mnt/data ext4 defaults 0 2" >> /etc/fstab

# Mount all from fstab
mount -a
```

### LVM (Logical Volume Management)

LVM provides flexible disk management with the ability to resize volumes dynamically:

```bash
# Create physical volumes
pvcreate /dev/sdb /dev/sdc
pvs
pvdisplay

# Create volume group
vgcreate data_vg /dev/sdb /dev/sdc
vgs
vgdisplay

# Create logical volume
lvcreate -L 100G -n data_lv data_vg
lvcreate -l 100%FREE -n data_lv data_vg  # Use all remaining space
lvs
lvdisplay

# Format and mount
mkfs.ext4 /dev/data_vg/data_lv
mount /dev/data_vg/data_lv /mnt/data

# Extend logical volume
lvextend -L +50G /dev/data_vg/data_lv
resize2fs /dev/data_vg/data_lv    # For ext4
xfs_growfs /mnt/data              # For xfs

# Extend to use all available space
lvextend -l +100%FREE /dev/data_vg/data_lv
resize2fs /dev/data_vg/data_lv

# Add new disk to volume group
pvcreate /dev/sdd
vgextend data_vg /dev/sdd
```

### RAID Configuration

```bash
# Create RAID 1 (mirroring)
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb /dev/sdc

# Create RAID 5 (striping with parity)
mdadm --create /dev/md0 --level=5 --raid-devices=3 /dev/sdb /dev/sdc /dev/sdd

# View RAID status
cat /proc/mdstat
mdadm --detail /dev/md0

# Save RAID configuration
mdadm --detail --scan >> /etc/mdadm/mdadm.conf
```

## Log Management

### System Logs

```bash
# Traditional log files
/var/log/syslog      # System log (Debian-based)
/var/log/messages    # System log (RHEL-based)
/var/log/auth.log    # Authentication log (Debian)
/var/log/secure      # Authentication log (RHEL)
/var/log/kern.log    # Kernel log
/var/log/dmesg       # Boot log

# View logs
tail -f /var/log/syslog      # Follow log in real-time
tail -100 /var/log/auth.log  # Last 100 lines
less /var/log/messages       # Browse with paging
grep "error" /var/log/syslog # Search for errors
```

### journalctl (systemd Journal)

```bash
# Basic queries
journalctl                    # All logs
journalctl -b                 # Logs from current boot
journalctl -b -1              # Logs from previous boot
journalctl --since "1 hour ago"
journalctl --since "2024-01-15 10:00:00"
journalctl --since yesterday --until today

# Filter by service
journalctl -u nginx
journalctl -u nginx -f        # Real-time follow

# Filter by priority
journalctl -p err             # Error and above
journalctl -p warning         # Warning and above
# Priorities: emerg, alert, crit, err, warning, notice, info, debug

# Filter by executable
journalctl /usr/bin/dockerd

# Output formats
journalctl -o json            # JSON format
journalctl -o json-pretty     # Formatted JSON
journalctl -o short-precise   # Precise timestamps

# Disk usage management
journalctl --disk-usage
journalctl --vacuum-size=1G   # Reduce to 1G
journalctl --vacuum-time=30d  # Keep only 30 days
```

### Log Rotation

```bash
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily                 # Rotate daily
    missingok            # Don't error if log is missing
    rotate 14            # Keep 14 rotated logs
    compress             # Compress rotated logs
    delaycompress        # Compress on next rotation
    notifempty           # Don't rotate if empty
    create 0640 www-data www-data  # Create new log with permissions
    sharedscripts        # Run scripts once for all logs
    postrotate
        systemctl reload myapp > /dev/null 2>&1 || true
    endscript
}
```

```bash
# Test configuration
logrotate -d /etc/logrotate.d/myapp

# Force rotation
logrotate -f /etc/logrotate.d/myapp
```

## Performance Monitoring and Tuning

### Performance Monitoring Tools

```bash
# CPU monitoring
top
htop
mpstat 1                      # CPU statistics per second
vmstat 1                      # Virtual memory statistics

# Memory monitoring
free -h
cat /proc/meminfo
vmstat -s

# Disk I/O
iostat -x 1
iotop
pidstat -d 1                  # Per-process I/O

# Network monitoring
iftop                         # Interface traffic
nethogs                       # Per-process bandwidth
sar -n DEV 1                  # Network statistics

# Comprehensive monitoring
dstat
glances                       # Python-based monitoring
nmon                          # NCurses system monitor
```

### Kernel Parameter Tuning

```bash
# View current parameters
sysctl -a
sysctl net.core.somaxconn

# Temporary modification
sysctl -w net.core.somaxconn=65535
sysctl -w vm.swappiness=10

# Permanent modification - /etc/sysctl.conf
cat >> /etc/sysctl.conf << 'EOF'
# Network optimization
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.ip_local_port_range = 1024 65535

# Memory optimization
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 5

# File descriptors
fs.file-max = 2097152
EOF

# Apply changes
sysctl -p
```

### File Descriptor Limits

```bash
# View current limits
ulimit -a
ulimit -n    # File descriptor limit

# Temporary modification
ulimit -n 65535

# Permanent modification - /etc/security/limits.conf
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
root soft nofile 65535
root hard nofile 65535
EOF

# For systemd services, add to [Service] section:
LimitNOFILE=65535
LimitNPROC=65535
```

### I/O Scheduler Tuning

```bash
# View current scheduler
cat /sys/block/sda/queue/scheduler

# Change scheduler (temporary)
echo deadline > /sys/block/sda/queue/scheduler

# Common schedulers:
# - mq-deadline: Good for SSDs and general use
# - bfq: Good for interactive workloads
# - none/noop: Good for SSDs, minimal overhead
# - kyber: Low-latency for fast storage
```

## Security Hardening

### SSH Security Configuration

```bash
# /etc/ssh/sshd_config
Port 22022                          # Change default port
PermitRootLogin no                  # Disable root login
PasswordAuthentication no           # Disable password auth
PubkeyAuthentication yes            # Enable public key auth
MaxAuthTries 3                      # Maximum auth attempts
ClientAliveInterval 300             # Timeout interval
ClientAliveCountMax 2               # Timeout count
AllowUsers admin deploy             # Allowed users
Protocol 2                          # Use SSH2 only
X11Forwarding no                    # Disable X11 forwarding

# Restart service
systemctl restart sshd
```

### User Security

```bash
# Password policy - /etc/login.defs
PASS_MAX_DAYS   90    # Maximum password age
PASS_MIN_DAYS   7     # Minimum password age
PASS_MIN_LEN    12    # Minimum password length
PASS_WARN_AGE   14    # Warning before expiration

# Password complexity (PAM)
# /etc/pam.d/common-password (Debian) or /etc/pam.d/system-auth (RHEL)
password requisite pam_pwquality.so retry=3 minlen=12 difok=3 ucredit=-1 lcredit=-1 dcredit=-1

# Lock accounts after failed attempts
# /etc/pam.d/common-auth
auth required pam_tally2.so deny=5 unlock_time=900
```

### System Hardening

```bash
# Disable unnecessary services
systemctl disable cups
systemctl disable avahi-daemon
systemctl disable bluetooth

# Kernel security parameters
cat >> /etc/sysctl.conf << 'EOF'
# Disable IP forwarding (non-routers)
net.ipv4.ip_forward = 0

# Disable ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0

# Disable source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# Enable SYN cookies
net.ipv4.tcp_syncookies = 1

# Ignore ICMP broadcast
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Log suspicious packets
net.ipv4.conf.all.log_martians = 1
EOF

# File permission hardening
chmod 700 /root
chmod 600 /etc/shadow
chmod 644 /etc/passwd
chmod 644 /etc/group
```

### Auditing and Monitoring

```bash
# Install auditd
apt install auditd   # Debian/Ubuntu
yum install audit    # RHEL/CentOS
systemctl enable auditd

# Configure audit rules - /etc/audit/rules.d/audit.rules
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /var/log/auth.log -p wa -k auth_log

# View audit logs
ausearch -k identity
aureport --summary

# Install fail2ban
apt install fail2ban
systemctl enable fail2ban

# Configure - /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

# View banned IPs
fail2ban-client status sshd
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the Linux boot process?**

```
1. BIOS/UEFI self-test (POST)
2. Load bootloader (GRUB)
3. Load kernel (vmlinuz) and initial RAM disk (initrd/initramfs)
4. Kernel initializes hardware, mounts root filesystem
5. Start init process (PID 1) - systemd on modern systems
6. systemd starts system services based on target
7. Start login service, wait for user login
```

**Q2: How do you troubleshoot high CPU usage?**

```bash
# Find high CPU processes
top -c
ps aux --sort=-%cpu | head -10

# Analyze the process
pidstat -p PID 1

# View process threads
top -H -p PID

# Analyze system calls
strace -p PID -c

# Analyze process memory map
pmap PID

# For Java applications
jstack PID > thread_dump.txt
```

**Q3: How do you troubleshoot memory leaks?**

```bash
# View memory usage trends
free -h
vmstat 1

# Sort processes by memory
ps aux --sort=-%mem | head -10

# View detailed process memory
cat /proc/PID/status | grep -i mem
pmap -x PID

# Check OOM killer logs
dmesg | grep -i "killed process"
journalctl -k | grep -i "out of memory"

# Use valgrind (development environment)
valgrind --leak-check=full ./program
```

**Q4: How do you handle a full filesystem?**

```bash
# Check disk usage
df -h

# Find large files
du -sh /* | sort -hr | head -20
find / -type f -size +100M -exec ls -lh {} \;

# Find deleted but not released files
lsof +L1

# Clean logs
journalctl --vacuum-size=100M
logrotate -f /etc/logrotate.conf

# Clean package cache
apt clean                    # Debian/Ubuntu
yum clean all               # RHEL/CentOS
```

**Q5: Explain the difference between soft and hard links?**

```bash
# Hard link
- Points directly to the inode
- Cannot cross filesystems
- Cannot link to directories
- File is deleted only when all hard links are removed
ln source_file hard_link

# Soft link (symbolic link)
- Points to the filename/path
- Can cross filesystems
- Can link to directories
- Becomes broken if target is deleted
ln -s source_file soft_link
```

### Core Knowledge Points

| Topic | Key Points |
|-------|------------|
| Filesystem | FHS standard, ext4/xfs differences, inode concept |
| Permissions | rwx bits, special permissions (SUID/SGID/sticky), ACL |
| Processes | Process states, signals, zombie process handling |
| Memory | Virtual memory, swap, OOM killer mechanism |
| Network | TCP/IP stack, iptables/nftables, common troubleshooting tools |
| Storage | LVM, RAID levels, disk I/O schedulers |
| Security | SSH hardening, firewall, SELinux/AppArmor |
| Performance | Common monitoring tools, kernel parameter tuning |

### Practical Skills Checklist

```markdown
## Essential Skills

- [ ] Proficient with vim/nano editors
- [ ] Master common commands: grep, awk, sed, find
- [ ] Able to write Shell scripts for automation
- [ ] Familiar with systemd service management
- [ ] Master network configuration and troubleshooting
- [ ] Understand filesystem and permission management
- [ ] Master log analysis and performance monitoring
- [ ] Understand security hardening best practices

## Advanced Skills

- [ ] LVM and RAID management
- [ ] Kernel parameter tuning
- [ ] Container and virtualization basics
- [ ] Configuration management tools (Ansible)
- [ ] Monitoring system setup (Prometheus + Grafana)
- [ ] Disaster recovery and backup strategies
```

## Further Reading

### Official Documentation

- [Linux Documentation Project](https://tldp.org/)
- [Red Hat Enterprise Linux Documentation](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Arch Linux Wiki](https://wiki.archlinux.org/) - Excellent resource for all Linux users

### Books

- **"How Linux Works" by Brian Ward** - Deep understanding of Linux internals
- **"The Linux Command Line" by William Shotts** - Comprehensive CLI guide
- **"UNIX and Linux System Administration Handbook"** - Industry standard reference
- **"Linux Bible" by Christopher Negus** - Complete Linux reference

### Online Resources

- [Linux Journey](https://linuxjourney.com/) - Interactive Linux learning
- [OverTheWire Wargames](https://overthewire.org/wargames/) - Security-focused Linux practice
- [Linux From Scratch](https://www.linuxfromscratch.org/) - Build your own Linux distribution
- [Explain Shell](https://explainshell.com/) - Understand complex command lines

### Practice Environments

- **Virtual Machines**: VirtualBox, VMware, KVM for safe experimentation
- **Cloud Platforms**: AWS Free Tier, Google Cloud, DigitalOcean for real-world practice
- **Containers**: Docker for quick, disposable Linux environments

## Summary

Linux system administration is a broad and deep field. This article has covered core topics from filesystem structure and user permissions to process management, network configuration, and security hardening. As a DevOps engineer, you should:

1. **Build a strong foundation**: Master filesystem structure, permission management, and common commands
2. **Master essential tools**: Become proficient with performance monitoring, log analysis, and network troubleshooting tools
3. **Think in automation**: Use Shell scripts and configuration management tools to boost productivity
4. **Maintain security awareness**: Always consider system security and follow the principle of least privilege
5. **Continue learning**: The Linux ecosystem is constantly evolving; maintain your passion for learning

Remember, theoretical knowledge needs to be reinforced through practice. I recommend experimenting on virtual machines or cloud servers to build up experience over time. When encountering problems, use the `man` command to view documentation, search community resources, and keep notes of your learning journey.

Mastering Linux system administration will lay a solid foundation for your DevOps career path.
