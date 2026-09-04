---
title: Ansible 自动化运维指南
description: 掌握Ansible配置管理工具，实现基础设施自动化
track: devops
section: iac
difficulty: intermediate
tags:
  - Ansible
  - 自动化
  - 配置管理
  - IaC
status: imported
origin: old/src/content/docs/devops/ansible.zh.md
divergence: 0.204
issues:
  - title-lang-en
  - title-language
legacy:
  category: DevOps
  subcategory: Automation
  order: 18
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Ansible

Ansible 是一款开源的自动化运维工具，由 Michael DeHaan 于 2012 年创建，2015 年被 Red Hat 收购。它采用无代理 (Agentless) 架构，通过 SSH 协议与目标主机通信，使用 YAML 语言编写自动化脚本，实现配置管理、应用部署、任务编排等功能。

Ansible 的名称来源于科幻小说中的超光速通信设备，寓意着能够瞬间控制远程系统。这个命名恰如其分地描述了 Ansible 的核心能力：简单、快速、无处不在的自动化控制。

### 为什么选择 Ansible

在众多自动化运维工具中（如 Puppet、Chef、SaltStack），Ansible 脱颖而出的原因包括：

1. **无代理架构**：无需在目标主机安装客户端，只需 SSH 和 Python 即可
2. **简单易学**：使用 YAML 语法，学习曲线平缓
3. **幂等性**：多次执行结果一致，保证系统状态可预测
4. **模块丰富**：3000+ 官方模块，覆盖几乎所有运维场景
5. **可扩展性**：支持自定义模块、插件和动态 Inventory

### 核心概念术语

| 术语 | 英文 | 说明 |
|------|------|------|
| 控制节点 | Control Node | 运行 Ansible 命令的机器 |
| 受管节点 | Managed Node | 被 Ansible 管理的目标主机 |
| 清单 | Inventory | 定义受管节点的配置文件 |
| 剧本 | Playbook | YAML 格式的自动化脚本 |
| 任务 | Task | 单个自动化操作单元 |
| 模块 | Module | 执行具体操作的代码单元 |
| 角色 | Role | 可复用的 Playbook 组织方式 |
| 事实 | Facts | 从受管节点收集的系统信息 |

## Ansible 架构与工作原理

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Control Node                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Inventory  │  │  Playbooks  │  │      Ansible Core       │  │
│  │  (主机清单)  │  │   (剧本)    │  │  ┌─────────────────┐   │  │
│  └──────┬──────┘  └──────┬──────┘  │  │    Modules      │   │  │
│         │                │         │  │  (2000+ 模块)    │   │  │
│         └────────────────┼─────────┤  └─────────────────┘   │  │
│                          │         │  ┌─────────────────┐   │  │
│                          │         │  │    Plugins      │   │  │
│                          │         │  │  (连接/回调等)   │   │  │
│                          │         │  └─────────────────┘   │  │
│                          │         └─────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           │ SSH / WinRM
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
     ▼                     ▼                     ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│ Web 服务器│          │ DB 服务器 │          │ Cache   │
│ (Node 1) │          │ (Node 2) │          │ (Node 3)│
└─────────┘          └─────────┘          └─────────┘
```

### 工作流程详解

Ansible 执行任务的完整流程：

```yaml
# 工作流程示例
# 解析 Inventory，确定目标主机
# 加载 Playbook，解析 YAML 结构
# 收集 Facts（可选）
# 编译任务模块为 Python 脚本
# 通过 SSH 传输脚本到目标主机
# 在目标主机执行脚本
# 收集执行结果并返回
# 清理临时文件
```

### 安装与配置

```bash
# Ubuntu/Debian 安装
sudo apt update
sudo apt install ansible -y

# CentOS/RHEL 安装
sudo yum install epel-release -y
sudo yum install ansible -y

# macOS 安装
brew install ansible

# pip 安装（推荐，获取最新版本）
pip3 install ansible

# 验证安装
ansible --version
```

### 配置文件层级

Ansible 按以下优先级查找配置文件：

```bash
# 优先级从高到低
1. ANSIBLE_CONFIG (环境变量)
2. ./ansible.cfg (当前目录)
3. ~/.ansible.cfg (用户目录)
4. /etc/ansible/ansible.cfg (系统全局)
```

典型的 `ansible.cfg` 配置：

```ini
[defaults]
# 主机清单文件路径
inventory = ./inventory/hosts

# 远程用户
remote_user = deploy

# 私钥文件
private_key_file = ~/.ssh/id_rsa

# 禁用 host_key_checking（生产环境建议开启）
host_key_checking = False

# 并行执行数量
forks = 20

# 日志文件
log_path = ./ansible.log

# 角色路径
roles_path = ./roles

# 重试文件
retry_files_enabled = False

# 回调插件（美化输出）
stdout_callback = yaml
callback_whitelist = profile_tasks

[privilege_escalation]
# 权限提升
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
# SSH 连接优化
pipelining = True
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
```

## Inventory 清单管理

### INI 格式清单

```ini
# inventory/hosts

# 单独主机定义
192.168.1.10
web01.example.com

# 主机组定义
[webservers]
web01.example.com ansible_host=192.168.1.11 ansible_port=22
web02.example.com ansible_host=192.168.1.12
web03.example.com ansible_host=192.168.1.13

[dbservers]
db01.example.com ansible_host=192.168.1.21 ansible_user=postgres
db02.example.com ansible_host=192.168.1.22 ansible_user=postgres

[cacheservers]
cache01.example.com ansible_host=192.168.1.31
cache02.example.com ansible_host=192.168.1.32

# 组的组（父组）
[production:children]
webservers
dbservers
cacheservers

# 组变量
[webservers:vars]
http_port=80
max_clients=200

[production:vars]
env=production
ntp_server=ntp.example.com

# 主机范围模式
[loadbalancers]
lb[01:05].example.com

# 字母范围
[app_servers]
app-[a:f].example.com
```

### YAML 格式清单

```yaml
# inventory/hosts.yml
all:
  children:
    production:
      children:
        webservers:
          hosts:
            web01.example.com:
              ansible_host: 192.168.1.11
              http_port: 80
            web02.example.com:
              ansible_host: 192.168.1.12
              http_port: 8080
          vars:
            nginx_version: "1.24.0"

        dbservers:
          hosts:
            db01.example.com:
              ansible_host: 192.168.1.21
              mysql_port: 3306
            db02.example.com:
              ansible_host: 192.168.1.22
              mysql_port: 3306
          vars:
            mysql_version: "8.0"

    staging:
      hosts:
        staging01.example.com:
          ansible_host: 192.168.2.10
      vars:
        env: staging

  vars:
    ansible_user: deploy
    ansible_ssh_private_key_file: ~/.ssh/deploy_key
```

### 动态 Inventory

动态 Inventory 允许从外部数据源（云平台、CMDB 等）获取主机信息：

```python
#!/usr/bin/env python3
# inventory/dynamic_inventory.py

import json
import boto3

def get_inventory():
    """从 AWS 获取 EC2 实例信息"""
    ec2 = boto3.client('ec2', region_name='us-east-1')

    inventory = {
        '_meta': {
            'hostvars': {}
        },
        'all': {
            'children': ['webservers', 'dbservers']
        },
        'webservers': {
            'hosts': []
        },
        'dbservers': {
            'hosts': []
        }
    }

    response = ec2.describe_instances(
        Filters=[
            {'Name': 'instance-state-name', 'Values': ['running']},
            {'Name': 'tag:Managed', 'Values': ['ansible']}
        ]
    )

    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            hostname = instance['PrivateIpAddress']

            # 获取标签
            tags = {t['Key']: t['Value'] for t in instance.get('Tags', [])}
            role = tags.get('Role', 'other')

            # 添加到对应组
            if role in inventory:
                inventory[role]['hosts'].append(hostname)

            # 设置主机变量
            inventory['_meta']['hostvars'][hostname] = {
                'ansible_host': instance['PublicIpAddress'],
                'instance_id': instance['InstanceId'],
                'instance_type': instance['InstanceType'],
                'environment': tags.get('Environment', 'unknown')
            }

    return inventory

if __name__ == '__main__':
    print(json.dumps(get_inventory(), indent=2))
```

```bash
# 使用动态 Inventory
ansible-inventory -i inventory/dynamic_inventory.py --list
ansible all -i inventory/dynamic_inventory.py -m ping
```

### 云平台 Inventory 插件

```yaml
# inventory/aws_ec2.yml
plugin: aws_ec2
regions:
  - us-east-1
  - us-west-2

filters:
  instance-state-name: running
  "tag:Managed": ansible

keyed_groups:
  - key: tags.Environment
    prefix: env
  - key: tags.Role
    prefix: role
  - key: placement.availability_zone
    prefix: az

hostnames:
  - private-ip-address

compose:
  ansible_host: public_ip_address
```

## Playbook 编写

### Playbook 基本结构

```yaml
# playbooks/site.yml
---
- name: Configure Web Servers
  hosts: webservers
  become: yes
  gather_facts: yes

  vars:
    app_name: myapp
    app_version: "1.2.0"

  vars_files:
    - vars/common.yml
    - vars/{{ env }}.yml

  pre_tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

  roles:
    - common
    - nginx
    - app

  tasks:
    - name: Ensure application directory exists
      file:
        path: /opt/{{ app_name }}
        state: directory
        owner: www-data
        group: www-data
        mode: '0755'

    - name: Deploy application
      unarchive:
        src: "https://releases.example.com/{{ app_name }}-{{ app_version }}.tar.gz"
        dest: /opt/{{ app_name }}
        remote_src: yes
      notify: Restart application

  post_tasks:
    - name: Verify deployment
      uri:
        url: "http://localhost:{{ http_port }}/health"
        status_code: 200
      register: health_check
      retries: 5
      delay: 10
      until: health_check.status == 200

  handlers:
    - name: Restart application
      systemd:
        name: "{{ app_name }}"
        state: restarted
        daemon_reload: yes

- name: Configure Database Servers
  hosts: dbservers
  become: yes

  roles:
    - mysql
```

### 条件判断与循环

```yaml
# playbooks/conditional_loops.yml
---
- name: Demonstrate Conditionals and Loops
  hosts: all
  become: yes

  vars:
    packages:
      - name: nginx
        state: present
        service: nginx
      - name: redis
        state: present
        service: redis-server
      - name: memcached
        state: absent
        service: memcached

    users:
      - name: alice
        groups: ["admin", "developers"]
        shell: /bin/bash
      - name: bob
        groups: ["developers"]
        shell: /bin/zsh
      - name: charlie
        groups: ["operators"]
        shell: /bin/bash

  tasks:
    # when 条件判断
    - name: Install packages on Debian systems
      apt:
        name: "{{ item.name }}"
        state: "{{ item.state }}"
      loop: "{{ packages }}"
      when:
        - ansible_os_family == "Debian"
        - item.state == "present"

    - name: Install packages on RedHat systems
      yum:
        name: "{{ item.name }}"
        state: "{{ item.state }}"
      loop: "{{ packages }}"
      when:
        - ansible_os_family == "RedHat"
        - item.state == "present"

    # 复杂条件
    - name: Configure high-memory settings
      template:
        src: high_memory.conf.j2
        dest: /etc/app/memory.conf
      when:
        - ansible_memtotal_mb > 8192
        - env == "production"

    # loop 循环
    - name: Create users
      user:
        name: "{{ item.name }}"
        groups: "{{ item.groups | join(',') }}"
        shell: "{{ item.shell }}"
        state: present
      loop: "{{ users }}"

    # loop with index
    - name: Create numbered config files
      copy:
        content: "Server {{ ansible_loop.index }}: {{ item }}"
        dest: "/etc/servers/server{{ ansible_loop.index }}.conf"
      loop:
        - web01.example.com
        - web02.example.com
        - web03.example.com
      loop_control:
        extended: yes

    # dict2items 遍历字典
    - name: Set sysctl parameters
      sysctl:
        name: "{{ item.key }}"
        value: "{{ item.value }}"
        state: present
        reload: yes
      loop: "{{ sysctl_params | dict2items }}"
      vars:
        sysctl_params:
          net.core.somaxconn: 65535
          net.ipv4.tcp_max_syn_backlog: 65535
          vm.swappiness: 10

    # with_fileglob 文件匹配
    - name: Copy all config files
      copy:
        src: "{{ item }}"
        dest: /etc/myapp/conf.d/
        owner: root
        mode: '0644'
      with_fileglob:
        - "files/configs/*.conf"
```

### 错误处理与调试

```yaml
# playbooks/error_handling.yml
---
- name: Error Handling Examples
  hosts: webservers
  become: yes

  tasks:
    # 忽略错误继续执行
    - name: Try to stop a service that might not exist
      service:
        name: nonexistent-service
        state: stopped
      ignore_errors: yes

    # 自定义失败条件
    - name: Check disk space
      shell: df -h / | tail -1 | awk '{print $5}' | sed 's/%//'
      register: disk_usage
      failed_when: disk_usage.stdout | int > 90
      changed_when: false

    # block/rescue/always 结构
    - name: Database migration block
      block:
        - name: Backup database
          shell: mysqldump -u root mydb > /backup/mydb_{{ ansible_date_time.iso8601 }}.sql

        - name: Run migrations
          shell: /opt/app/migrate.sh
          register: migration_result

        - name: Verify migration
          uri:
            url: http://localhost:8080/api/health
            status_code: 200

      rescue:
        - name: Restore database on failure
          shell: mysql -u root mydb < /backup/mydb_latest.sql

        - name: Send alert
          mail:
            to: ops@example.com
            subject: "Migration failed on {{ inventory_hostname }}"
            body: "Migration failed. Database restored from backup."

      always:
        - name: Clean up temporary files
          file:
            path: /tmp/migration_temp
            state: absent

    # 调试变量
    - name: Debug output
      debug:
        msg: "Host: {{ inventory_hostname }}, IP: {{ ansible_default_ipv4.address }}"

    - name: Debug variable structure
      debug:
        var: ansible_mounts
        verbosity: 2

    # assert 断言
    - name: Verify prerequisites
      assert:
        that:
          - ansible_memtotal_mb >= 2048
          - ansible_distribution == "Ubuntu"
          - ansible_distribution_major_version | int >= 20
        fail_msg: "System does not meet minimum requirements"
        success_msg: "All prerequisites met"
```

## 模块与任务

### 常用模块详解

```yaml
# playbooks/common_modules.yml
---
- name: Common Modules Examples
  hosts: all
  become: yes

  tasks:
    # ============ 文件操作模块 ============

    # file - 管理文件和目录
    - name: Create directory with specific permissions
      file:
        path: /opt/myapp
        state: directory
        owner: app
        group: app
        mode: '0755'
        recurse: yes

    - name: Create symbolic link
      file:
        src: /opt/myapp/current
        dest: /var/www/app
        state: link

    # copy - 复制文件
    - name: Copy configuration file
      copy:
        src: files/nginx.conf
        dest: /etc/nginx/nginx.conf
        owner: root
        group: root
        mode: '0644'
        backup: yes
      notify: Reload nginx

    # template - 使用 Jinja2 模板
    - name: Deploy app configuration
      template:
        src: templates/app.conf.j2
        dest: /etc/myapp/app.conf
        owner: app
        group: app
        mode: '0600'
        validate: '/opt/myapp/bin/validate-config %s'

    # lineinfile - 管理文件中的行
    - name: Ensure line in file
      lineinfile:
        path: /etc/hosts
        line: "192.168.1.100 api.internal"
        state: present

    - name: Update configuration value
      lineinfile:
        path: /etc/myapp/app.conf
        regexp: '^max_connections='
        line: 'max_connections=1000'
        backup: yes

    # blockinfile - 管理文件中的块
    - name: Add configuration block
      blockinfile:
        path: /etc/nginx/nginx.conf
        marker: "# {mark} ANSIBLE MANAGED - upstream servers"
        insertafter: "http {"
        block: |
          upstream backend {
              server 192.168.1.11:8080;
              server 192.168.1.12:8080;
              server 192.168.1.13:8080;
          }

    # ============ 包管理模块 ============

    # apt - Debian/Ubuntu 包管理
    - name: Install multiple packages
      apt:
        name:
          - nginx
          - python3-pip
          - git
        state: present
        update_cache: yes
        cache_valid_time: 3600

    # yum - RedHat/CentOS 包管理
    - name: Install packages on RedHat
      yum:
        name:
          - httpd
          - python3
          - git
        state: present
      when: ansible_os_family == "RedHat"

    # pip - Python 包管理
    - name: Install Python packages
      pip:
        name:
          - flask
          - gunicorn
          - redis
        state: present
        virtualenv: /opt/myapp/venv
        virtualenv_python: python3

    # ============ 服务管理模块 ============

    # systemd - systemd 服务管理
    - name: Manage systemd service
      systemd:
        name: nginx
        state: started
        enabled: yes
        daemon_reload: yes

    # service - 通用服务管理
    - name: Ensure service is running
      service:
        name: nginx
        state: started
        enabled: yes

    # ============ 用户和组模块 ============

    # user - 用户管理
    - name: Create application user
      user:
        name: app
        comment: "Application User"
        uid: 1001
        group: app
        groups: www-data
        shell: /bin/bash
        home: /home/app
        create_home: yes
        password: "{{ 'password123' | password_hash('sha512') }}"

    # group - 组管理
    - name: Create application group
      group:
        name: app
        gid: 1001
        state: present

    # authorized_key - SSH 公钥管理
    - name: Add SSH authorized key
      authorized_key:
        user: deploy
        state: present
        key: "{{ lookup('file', 'files/deploy_key.pub') }}"

    # ============ 命令执行模块 ============

    # command - 执行命令（不通过 shell）
    - name: Run command
      command: /opt/myapp/bin/check-health
      args:
        chdir: /opt/myapp
      register: health_result
      changed_when: false

    # shell - 通过 shell 执行命令
    - name: Run shell command with pipes
      shell: |
        cat /var/log/nginx/access.log | grep "500" | wc -l
      register: error_count
      changed_when: false

    # raw - 原始命令（不需要 Python）
    - name: Bootstrap Python on minimal systems
      raw: apt-get install -y python3
      when: bootstrap_required | default(false)

    # ============ 网络模块 ============

    # uri - HTTP 请求
    - name: Check API endpoint
      uri:
        url: "https://api.example.com/health"
        method: GET
        headers:
          Authorization: "Bearer {{ api_token }}"
        status_code: 200
        timeout: 30
      register: api_response

    - name: POST data to API
      uri:
        url: "https://api.example.com/deploy"
        method: POST
        body:
          version: "{{ app_version }}"
          environment: "{{ env }}"
        body_format: json
        headers:
          Content-Type: "application/json"
        status_code: [200, 201]

    # get_url - 下载文件
    - name: Download application binary
      get_url:
        url: "https://releases.example.com/app-{{ version }}.tar.gz"
        dest: /tmp/app-{{ version }}.tar.gz
        checksum: "sha256:{{ app_checksum }}"
        mode: '0644'

    # ============ 归档模块 ============

    # unarchive - 解压文件
    - name: Extract application
      unarchive:
        src: /tmp/app-{{ version }}.tar.gz
        dest: /opt/myapp/
        remote_src: yes
        owner: app
        group: app

    # archive - 创建归档
    - name: Create backup archive
      archive:
        path:
          - /opt/myapp/data
          - /opt/myapp/config
        dest: /backup/app-backup-{{ ansible_date_time.date }}.tar.gz
        format: gz
```

### 自定义模块

```python
#!/usr/bin/env python3
# library/check_service_health.py

from ansible.module_utils.basic import AnsibleModule
import requests
import time

DOCUMENTATION = '''
---
module: check_service_health
short_description: Check service health endpoint
description:
    - Checks if a service health endpoint returns expected status
options:
    url:
        description: Health check URL
        required: true
        type: str
    expected_status:
        description: Expected HTTP status code
        default: 200
        type: int
    timeout:
        description: Request timeout in seconds
        default: 30
        type: int
    retries:
        description: Number of retries
        default: 3
        type: int
    delay:
        description: Delay between retries in seconds
        default: 5
        type: int
'''

EXAMPLES = '''
- name: Check application health
  check_service_health:
    url: http://localhost:8080/health
    expected_status: 200
    retries: 5
    delay: 10
'''

def main():
    module = AnsibleModule(
        argument_spec=dict(
            url=dict(type='str', required=True),
            expected_status=dict(type='int', default=200),
            timeout=dict(type='int', default=30),
            retries=dict(type='int', default=3),
            delay=dict(type='int', default=5)
        ),
        supports_check_mode=True
    )

    url = module.params['url']
    expected_status = module.params['expected_status']
    timeout = module.params['timeout']
    retries = module.params['retries']
    delay = module.params['delay']

    if module.check_mode:
        module.exit_json(changed=False, msg="Would check health at {}".format(url))

    last_error = None
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=timeout)
            if response.status_code == expected_status:
                module.exit_json(
                    changed=False,
                    status_code=response.status_code,
                    response=response.text[:500],
                    attempts=attempt + 1
                )
        except requests.RequestException as e:
            last_error = str(e)

        if attempt < retries - 1:
            time.sleep(delay)

    module.fail_json(
        msg="Health check failed after {} attempts".format(retries),
        last_error=last_error
    )

if __name__ == '__main__':
    main()
```

## 变量与 Facts

### 变量优先级

Ansible 变量优先级（从低到高）：

```yaml
# 命令行值（通过 -e 传递，优先级最高）
# role defaults
# inventory 文件或脚本组变量
# inventory group_vars/all
# playbook group_vars/all
# inventory group_vars/*
# playbook group_vars/*
# inventory 文件或脚本主机变量
# inventory host_vars/*
# playbook host_vars/*
# host facts / cached set_facts
# play vars
# play vars_prompt
# play vars_files
# role vars
# block vars
# task vars
# include_vars
# set_facts / registered vars
# role parameters
# include parameters
# extra vars（-e 参数，优先级最高）
```

### 变量定义方式

```yaml
# group_vars/all.yml
---
# 全局变量
company_name: "Example Corp"
default_timezone: "Asia/Shanghai"
ntp_servers:
  - ntp1.aliyun.com
  - ntp2.aliyun.com

# group_vars/webservers.yml
---
http_port: 80
https_port: 443
nginx_worker_processes: "{{ ansible_processor_vcpus }}"
nginx_worker_connections: 4096

# host_vars/web01.example.com.yml
---
nginx_worker_processes: 4
custom_vhosts:
  - domain: api.example.com
    upstream: backend
    ssl: true
```

```yaml
# playbooks/variables.yml
---
- name: Variable Examples
  hosts: all

  vars:
    # 简单变量
    app_name: myapp
    app_version: "2.0.0"

    # 列表变量
    required_packages:
      - nginx
      - python3
      - git

    # 字典变量
    database:
      host: db.example.com
      port: 3306
      name: production
      user: app

    # 嵌套变量
    services:
      web:
        port: 80
        workers: 4
      api:
        port: 8080
        workers: 8

  vars_files:
    - vars/secrets.yml
    - "vars/{{ env }}.yml"

  tasks:
    # 使用变量
    - name: Display variables
      debug:
        msg: |
          App: {{ app_name }} v{{ app_version }}
          DB Host: {{ database.host }}
          Web Port: {{ services['web']['port'] }}

    # 注册变量
    - name: Get current date
      command: date +%Y%m%d
      register: current_date
      changed_when: false

    - name: Use registered variable
      debug:
        msg: "Current date is {{ current_date.stdout }}"

    # set_fact 动态设置变量
    - name: Set deployment timestamp
      set_fact:
        deploy_timestamp: "{{ ansible_date_time.iso8601 }}"
        deploy_dir: "/opt/{{ app_name }}/releases/{{ current_date.stdout }}"

    # 默认值
    - name: Use variable with default
      debug:
        msg: "Port: {{ custom_port | default(8080) }}"

    # 环境变量
    - name: Use environment variable
      debug:
        msg: "Home directory: {{ lookup('env', 'HOME') }}"
```

### Facts 收集与使用

```yaml
# playbooks/facts.yml
---
- name: Working with Facts
  hosts: all
  gather_facts: yes

  tasks:
    # 查看所有 Facts
    - name: Display all facts
      debug:
        var: ansible_facts
      when: show_all_facts | default(false)

    # 常用 Facts
    - name: Show system information
      debug:
        msg: |
          主机名: {{ ansible_hostname }}
          FQDN: {{ ansible_fqdn }}
          操作系统: {{ ansible_distribution }} {{ ansible_distribution_version }}
          内核: {{ ansible_kernel }}
          架构: {{ ansible_architecture }}
          CPU 核数: {{ ansible_processor_vcpus }}
          内存: {{ ansible_memtotal_mb }} MB
          IP 地址: {{ ansible_default_ipv4.address }}
          MAC 地址: {{ ansible_default_ipv4.macaddress }}

    # 基于 Facts 的条件判断
    - name: Install package based on OS
      package:
        name: "{{ item }}"
        state: present
      loop:
        - "{{ 'httpd' if ansible_os_family == 'RedHat' else 'nginx' }}"

    # 自定义 Facts
    - name: Create custom facts directory
      file:
        path: /etc/ansible/facts.d
        state: directory
        mode: '0755'

    - name: Deploy custom fact script
      copy:
        dest: /etc/ansible/facts.d/app_info.fact
        mode: '0755'
        content: |
          #!/bin/bash
          echo '{"app_version": "2.0.0", "deploy_date": "'$(date +%Y-%m-%d)'"}'

    # 重新收集 Facts 以获取自定义 Facts
    - name: Refresh facts
      setup:
        filter: ansible_local

    - name: Show custom facts
      debug:
        var: ansible_local.app_info

    # Facts 缓存
    # 在 ansible.cfg 中配置:
    # [defaults]
    # gathering = smart
    # fact_caching = jsonfile
    # fact_caching_connection = /tmp/ansible_facts_cache
    # fact_caching_timeout = 86400
```

## Roles 最佳实践

### Role 目录结构

```
roles/
└── nginx/
    ├── defaults/           # 默认变量（最低优先级）
    │   └── main.yml
    ├── vars/               # 角色变量（较高优先级）
    │   └── main.yml
    ├── tasks/              # 任务文件
    │   ├── main.yml
    │   ├── install.yml
    │   ├── configure.yml
    │   └── service.yml
    ├── handlers/           # 处理器
    │   └── main.yml
    ├── templates/          # Jinja2 模板
    │   ├── nginx.conf.j2
    │   └── vhost.conf.j2
    ├── files/              # 静态文件
    │   └── ssl/
    ├── meta/               # 角色元数据和依赖
    │   └── main.yml
    ├── tests/              # 测试文件
    │   ├── inventory
    │   └── test.yml
    └── README.md           # 文档
```

### 完整的 Nginx Role 示例

```yaml
# roles/nginx/defaults/main.yml
---
nginx_version: "latest"
nginx_user: www-data
nginx_worker_processes: auto
nginx_worker_connections: 1024
nginx_keepalive_timeout: 65
nginx_client_max_body_size: "64m"

nginx_http_port: 80
nginx_https_port: 443

nginx_enable_ssl: false
nginx_ssl_certificate: ""
nginx_ssl_certificate_key: ""

nginx_vhosts: []
nginx_upstreams: []

nginx_extra_http_options: ""
nginx_extra_server_options: ""
```

```yaml
# roles/nginx/vars/main.yml
---
nginx_packages:
  Debian:
    - nginx
    - nginx-extras
  RedHat:
    - nginx

nginx_config_dir: /etc/nginx
nginx_log_dir: /var/log/nginx
nginx_pid_file: /run/nginx.pid
```

```yaml
# roles/nginx/tasks/main.yml
---
- name: Include OS-specific variables
  include_vars: "{{ item }}"
  with_first_found:
    - "{{ ansible_distribution }}-{{ ansible_distribution_major_version }}.yml"
    - "{{ ansible_distribution }}.yml"
    - "{{ ansible_os_family }}.yml"
    - "default.yml"
  tags: always

- import_tasks: install.yml
  tags: [nginx, nginx-install]

- import_tasks: configure.yml
  tags: [nginx, nginx-configure]

- import_tasks: vhosts.yml
  tags: [nginx, nginx-vhosts]

- import_tasks: service.yml
  tags: [nginx, nginx-service]
```

```yaml
# roles/nginx/tasks/install.yml
---
- name: Install nginx packages
  package:
    name: "{{ nginx_packages[ansible_os_family] }}"
    state: "{{ 'latest' if nginx_version == 'latest' else 'present' }}"
  notify: Restart nginx

- name: Create nginx directories
  file:
    path: "{{ item }}"
    state: directory
    owner: root
    group: root
    mode: '0755'
  loop:
    - "{{ nginx_config_dir }}/conf.d"
    - "{{ nginx_config_dir }}/sites-available"
    - "{{ nginx_config_dir }}/sites-enabled"
    - "{{ nginx_config_dir }}/ssl"
```

```yaml
# roles/nginx/tasks/configure.yml
---
- name: Deploy main nginx configuration
  template:
    src: nginx.conf.j2
    dest: "{{ nginx_config_dir }}/nginx.conf"
    owner: root
    group: root
    mode: '0644'
    validate: 'nginx -t -c %s'
  notify: Reload nginx

- name: Configure upstream blocks
  template:
    src: upstream.conf.j2
    dest: "{{ nginx_config_dir }}/conf.d/upstream.conf"
    owner: root
    group: root
    mode: '0644'
  when: nginx_upstreams | length > 0
  notify: Reload nginx
```

```yaml
# roles/nginx/handlers/main.yml
---
- name: Restart nginx
  systemd:
    name: nginx
    state: restarted
    daemon_reload: yes

- name: Reload nginx
  systemd:
    name: nginx
    state: reloaded
```

```yaml
# roles/nginx/meta/main.yml
---
galaxy_info:
  author: DevOps Team
  description: Install and configure Nginx web server
  company: Example Corp
  license: MIT
  min_ansible_version: "2.9"

  platforms:
    - name: Ubuntu
      versions:
        - focal
        - jammy
    - name: CentOS
      versions:
        - "8"
        - "9"

  galaxy_tags:
    - web
    - nginx
    - reverse_proxy

dependencies:
  - role: common
  - role: firewall
    vars:
      firewall_allowed_ports:
        - "{{ nginx_http_port }}"
        - "{{ nginx_https_port }}"
```

```jinja2
{# roles/nginx/templates/nginx.conf.j2 #}
user {{ nginx_user }};
worker_processes {{ nginx_worker_processes }};
pid {{ nginx_pid_file }};
error_log {{ nginx_log_dir }}/error.log;

events {
    worker_connections {{ nginx_worker_connections }};
    use epoll;
    multi_accept on;
}

http {
    include {{ nginx_config_dir }}/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log {{ nginx_log_dir }}/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout {{ nginx_keepalive_timeout }};
    types_hash_max_size 2048;

    client_max_body_size {{ nginx_client_max_body_size }};

{% if nginx_enable_ssl %}
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
{% endif %}

{{ nginx_extra_http_options }}

    include {{ nginx_config_dir }}/conf.d/*.conf;
    include {{ nginx_config_dir }}/sites-enabled/*;
}
```

### 使用 Role

```yaml
# playbooks/webserver.yml
---
- name: Configure Web Servers
  hosts: webservers
  become: yes

  vars:
    nginx_vhosts:
      - server_name: api.example.com
        root: /var/www/api
        index: index.html
        locations:
          - path: /
            proxy_pass: http://backend

    nginx_upstreams:
      - name: backend
        strategy: least_conn
        servers:
          - "192.168.1.11:8080 weight=5"
          - "192.168.1.12:8080 weight=3"
          - "192.168.1.13:8080 backup"

  roles:
    - role: nginx
      nginx_enable_ssl: true
      nginx_ssl_certificate: /etc/nginx/ssl/api.crt
      nginx_ssl_certificate_key: /etc/nginx/ssl/api.key
```

## Jinja2 模板

### 模板语法详解

```jinja2
{# templates/app.conf.j2 #}

{# 注释：这是一个应用配置模板 #}

# Application Configuration
# Generated by Ansible on {{ ansible_date_time.iso8601 }}
# Managed host: {{ inventory_hostname }}

# ================== 变量插值 ==================
app_name = {{ app_name }}
app_version = {{ app_version }}
environment = {{ env | default('development') }}

# ================== 过滤器使用 ==================
# 字符串操作
app_name_upper = {{ app_name | upper }}
app_name_lower = {{ app_name | lower }}
app_name_title = {{ app_name | title }}
app_name_hash = {{ app_name | hash('md5') }}

# 默认值
custom_setting = {{ custom_setting | default('default_value') }}
optional_port = {{ optional_port | default(8080) }}

# 数字格式化
memory_limit = {{ memory_limit_mb | default(512) | int }}MB

# 列表操作
allowed_hosts = {{ allowed_hosts | join(', ') }}
first_host = {{ allowed_hosts | first }}
last_host = {{ allowed_hosts | last }}
host_count = {{ allowed_hosts | length }}

# JSON 输出
database_config = {{ database | to_json }}
database_pretty = {{ database | to_nice_json }}

# 正则替换
clean_name = {{ app_name | regex_replace('[^a-zA-Z0-9]', '_') }}

# ================== 条件语句 ==================
{% if env == 'production' %}
debug = false
log_level = warning
{% elif env == 'staging' %}
debug = true
log_level = info
{% else %}
debug = true
log_level = debug
{% endif %}

{% if enable_ssl is defined and enable_ssl %}
ssl_enabled = true
ssl_cert = {{ ssl_certificate }}
ssl_key = {{ ssl_certificate_key }}
{% endif %}

# 三元表达式
cache_enabled = {{ 'true' if enable_cache | default(false) else 'false' }}

# ================== 循环语句 ==================
# 简单循环
[allowed_ips]
{% for ip in allowed_ips %}
{{ ip }}
{% endfor %}

# 带索引的循环
[servers]
{% for server in servers %}
server_{{ loop.index }} = {{ server.host }}:{{ server.port }}
{% endfor %}

# 循环控制
[active_servers]
{% for server in servers if server.active %}
{{ server.name }} = {{ server.host }}:{{ server.port }}
{% endfor %}

# 字典循环
[environment_variables]
{% for key, value in env_vars.items() %}
{{ key }} = {{ value }}
{% endfor %}

# 循环变量
{% for item in items %}
{# loop.index - 从1开始的索引 #}
{# loop.index0 - 从0开始的索引 #}
{# loop.first - 是否第一个元素 #}
{# loop.last - 是否最后一个元素 #}
{# loop.length - 总元素数 #}
item_{{ loop.index0 }} = {{ item }}{% if not loop.last %},{% endif %}

{% endfor %}

# ================== 宏定义 ==================
{% macro server_block(name, host, port, weight=1) %}
upstream_{{ name }} {
    server {{ host }}:{{ port }} weight={{ weight }};
}
{% endmacro %}

{{ server_block('web', 'localhost', 8080, 5) }}
{{ server_block('api', 'localhost', 8081, 3) }}

# ================== 空白控制 ==================
{#- 使用 - 去除前面的空白 -#}
{% for user in users -%}
{{ user.name }}
{%- endfor %}

# ================== 包含其他模板 ==================
{% include 'partials/database.conf.j2' %}

# ================== 原始块（不解析） ==================
{% raw %}
# 以下内容不会被 Jinja2 解析
template_variable = {{ not_a_variable }}
{% endraw %}
```

### 常用过滤器参考

```yaml
# playbooks/jinja_filters.yml
---
- name: Jinja2 Filter Examples
  hosts: localhost
  gather_facts: no

  vars:
    users:
      - name: alice
        role: admin
        active: true
      - name: bob
        role: developer
        active: true
      - name: charlie
        role: developer
        active: false

    numbers: [1, 2, 3, 4, 5]

  tasks:
    - name: String filters
      debug:
        msg: |
          upper: {{ 'hello' | upper }}
          lower: {{ 'HELLO' | lower }}
          capitalize: {{ 'hello world' | capitalize }}
          title: {{ 'hello world' | title }}
          replace: {{ 'hello' | replace('l', 'L') }}
          trim: {{ '  hello  ' | trim }}
          length: {{ 'hello' | length }}

    - name: List filters
      debug:
        msg: |
          first: {{ users | first }}
          last: {{ users | last }}
          length: {{ users | length }}
          sum: {{ numbers | sum }}
          min: {{ numbers | min }}
          max: {{ numbers | max }}
          unique: {{ [1,1,2,2,3] | unique | list }}
          flatten: {{ [[1,2],[3,4]] | flatten }}
          sort: {{ numbers | sort(reverse=true) | list }}

    - name: Dict filters
      debug:
        msg: |
          selectattr: {{ users | selectattr('active', 'equalto', true) | list }}
          map: {{ users | map(attribute='name') | list }}
          json: {{ users | to_json }}
          yaml: {{ users | to_yaml }}

    - name: Type conversion filters
      debug:
        msg: |
          int: {{ '42' | int }}
          float: {{ '3.14' | float }}
          string: {{ 42 | string }}
          bool: {{ 'yes' | bool }}
          list: {{ 'a,b,c' | split(',') }}

    - name: Path filters
      debug:
        msg: |
          basename: {{ '/path/to/file.txt' | basename }}
          dirname: {{ '/path/to/file.txt' | dirname }}
          expanduser: {{ '~/.ssh' | expanduser }}
          realpath: {{ '../' | realpath }}

    - name: Hash and encode filters
      debug:
        msg: |
          md5: {{ 'hello' | hash('md5') }}
          sha256: {{ 'hello' | hash('sha256') }}
          b64encode: {{ 'hello' | b64encode }}
          b64decode: {{ 'aGVsbG8=' | b64decode }}
          password_hash: {{ 'password' | password_hash('sha512') }}

    - name: Regex filters
      debug:
        msg: |
          search: {{ 'hello123' | regex_search('[0-9]+') }}
          replace: {{ 'hello123' | regex_replace('[0-9]+', 'XXX') }}
          findall: {{ 'a1b2c3' | regex_findall('[0-9]+') }}
```

## Ansible Vault 加密

### Vault 基本操作

```bash
# 创建加密文件
ansible-vault create secrets.yml

# 编辑加密文件
ansible-vault edit secrets.yml

# 查看加密文件内容
ansible-vault view secrets.yml

# 加密现有文件
ansible-vault encrypt vars/production.yml

# 解密文件
ansible-vault decrypt vars/production.yml

# 更改密码
ansible-vault rekey secrets.yml

# 加密字符串
ansible-vault encrypt_string 'SuperSecretPassword' --name 'db_password'
```

### Vault 使用方式

```yaml
# group_vars/production/vault.yml (加密文件)
---
vault_db_password: "P@ssw0rd!2024"
vault_api_key: "sk-xxxxxxxxxxxx"
vault_ssl_private_key: |
  -----BEGIN PRIVATE KEY-----
  MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...
  -----END PRIVATE KEY-----

# group_vars/production/vars.yml (明文文件，引用加密变量)
---
db_password: "{{ vault_db_password }}"
api_key: "{{ vault_api_key }}"
ssl_private_key: "{{ vault_ssl_private_key }}"
```

```yaml
# 在 Playbook 中使用加密变量
# playbooks/deploy.yml
---
- name: Deploy Application with Secrets
  hosts: webservers
  become: yes

  vars_files:
    - group_vars/production/vault.yml
    - group_vars/production/vars.yml

  tasks:
    - name: Create database configuration
      template:
        src: database.yml.j2
        dest: /opt/app/config/database.yml
        owner: app
        group: app
        mode: '0600'

    - name: Set environment variables
      lineinfile:
        path: /etc/environment
        line: "API_KEY={{ api_key }}"
        state: present
```

```bash
# 运行时提供密码
ansible-playbook playbooks/deploy.yml --ask-vault-pass

# 使用密码文件
ansible-playbook playbooks/deploy.yml --vault-password-file ~/.vault_pass

# 多个 Vault ID（不同环境使用不同密码）
ansible-vault create --vault-id prod@prompt secrets_prod.yml
ansible-vault create --vault-id dev@prompt secrets_dev.yml

ansible-playbook site.yml \
  --vault-id dev@~/.vault_pass_dev \
  --vault-id prod@~/.vault_pass_prod
```

### Vault 配置

```ini
# ansible.cfg
[defaults]
vault_password_file = ~/.vault_pass

# 或使用脚本获取密码
vault_password_file = /path/to/vault_password_script.py
```

```python
#!/usr/bin/env python3
# vault_password_script.py
# 从密钥管理服务获取 Vault 密码

import boto3

def get_vault_password():
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(SecretId='ansible-vault-password')
    return response['SecretString']

if __name__ == '__main__':
    print(get_vault_password())
```

## 与 CI/CD 集成

### GitLab CI 集成

```yaml
# .gitlab-ci.yml
---
stages:
  - lint
  - test
  - deploy

variables:
  ANSIBLE_HOST_KEY_CHECKING: "False"
  ANSIBLE_FORCE_COLOR: "true"

.ansible_base:
  image: registry.example.com/ansible:latest
  before_script:
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - echo "$VAULT_PASSWORD" > ~/.vault_pass
    - chmod 600 ~/.vault_pass

lint:
  stage: lint
  extends: .ansible_base
  script:
    - ansible-lint playbooks/
    - yamllint .
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

syntax_check:
  stage: test
  extends: .ansible_base
  script:
    - ansible-playbook playbooks/site.yml --syntax-check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

molecule_test:
  stage: test
  extends: .ansible_base
  services:
    - docker:dind
  variables:
    DOCKER_HOST: tcp://docker:2375
  script:
    - cd roles/nginx
    - molecule test
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - changes:
        - roles/nginx/**/*

deploy_staging:
  stage: deploy
  extends: .ansible_base
  script:
    - ansible-playbook playbooks/site.yml
        -i inventory/staging
        --vault-password-file ~/.vault_pass
        -e "env=staging"
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
      when: manual

deploy_production:
  stage: deploy
  extends: .ansible_base
  script:
    - ansible-playbook playbooks/site.yml
        -i inventory/production
        --vault-password-file ~/.vault_pass
        -e "env=production"
        --limit "webservers[0]"
    - sleep 60
    - ./scripts/health_check.sh
    - ansible-playbook playbooks/site.yml
        -i inventory/production
        --vault-password-file ~/.vault_pass
        -e "env=production"
  environment:
    name: production
    url: https://www.example.com
  rules:
    - if: $CI_COMMIT_TAG
      when: manual
```

### GitHub Actions 集成

```yaml
# .github/workflows/ansible.yml
---
name: Ansible CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  ANSIBLE_HOST_KEY_CHECKING: "False"
  ANSIBLE_FORCE_COLOR: "true"

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install ansible ansible-lint yamllint

      - name: Run yamllint
        run: yamllint .

      - name: Run ansible-lint
        run: ansible-lint playbooks/

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install ansible molecule[docker] docker

      - name: Run Molecule tests
        run: |
          cd roles/nginx
          molecule test
        env:
          PY_COLORS: '1'

  deploy-staging:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install Ansible
        run: pip install ansible boto3

      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

      - name: Create vault password file
        run: echo "${{ secrets.VAULT_PASSWORD }}" > ~/.vault_pass

      - name: Run Ansible Playbook
        run: |
          ansible-playbook playbooks/site.yml \
            -i inventory/staging \
            --vault-password-file ~/.vault_pass \
            -e "env=staging"
```

### Jenkins Pipeline 集成

```groovy
// Jenkinsfile
pipeline {
    agent {
        docker {
            image 'ansible/ansible:latest'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        ANSIBLE_HOST_KEY_CHECKING = 'False'
        ANSIBLE_FORCE_COLOR = 'true'
    }

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['staging', 'production'],
            description: 'Target environment'
        )
        string(
            name: 'LIMIT',
            defaultValue: '',
            description: 'Ansible limit pattern'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Lint') {
            steps {
                sh 'ansible-lint playbooks/'
                sh 'yamllint .'
            }
        }

        stage('Syntax Check') {
            steps {
                sh 'ansible-playbook playbooks/site.yml --syntax-check'
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ansible-ssh-key',
                        keyFileVariable: 'SSH_KEY'
                    ),
                    string(
                        credentialsId: 'ansible-vault-pass',
                        variable: 'VAULT_PASS'
                    )
                ]) {
                    sh '''
                        mkdir -p ~/.ssh
                        cp $SSH_KEY ~/.ssh/id_rsa
                        chmod 600 ~/.ssh/id_rsa
                        echo $VAULT_PASS > ~/.vault_pass

                        LIMIT_OPT=""
                        if [ -n "${LIMIT}" ]; then
                            LIMIT_OPT="--limit ${LIMIT}"
                        fi

                        ansible-playbook playbooks/site.yml \
                            -i inventory/${ENVIRONMENT} \
                            --vault-password-file ~/.vault_pass \
                            -e "env=${ENVIRONMENT}" \
                            ${LIMIT_OPT}
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                color: 'good',
                message: "Deployment to ${params.ENVIRONMENT} succeeded!"
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: "Deployment to ${params.ENVIRONMENT} failed!"
            )
        }
    }
}
```

## Ansible Tower/AWX

### AWX 安装与配置

```yaml
# awx-deploy.yml
---
- name: Deploy AWX
  hosts: awx_server
  become: yes

  vars:
    awx_version: "21.0.0"
    awx_admin_user: admin
    awx_admin_password: "{{ vault_awx_admin_password }}"
    awx_secret_key: "{{ vault_awx_secret_key }}"
    awx_postgres_password: "{{ vault_awx_postgres_password }}"

  tasks:
    - name: Install prerequisites
      package:
        name:
          - docker
          - docker-compose
          - python3-pip
          - git
        state: present

    - name: Clone AWX repository
      git:
        repo: https://github.com/ansible/awx.git
        dest: /opt/awx
        version: "{{ awx_version }}"

    - name: Configure AWX inventory
      template:
        src: awx-inventory.j2
        dest: /opt/awx/installer/inventory

    - name: Run AWX installer
      command: ansible-playbook -i inventory install.yml
      args:
        chdir: /opt/awx/installer
```

## 面试要点

### 核心概念问题

**Q1: Ansible 与其他配置管理工具（Puppet、Chef、SaltStack）的区别？**

```
关键差异点：

1. 架构模式：
   - Ansible: 无代理 (Agentless)，通过 SSH 推送
   - Puppet/Chef: 需要安装 Agent，客户端拉取
   - SaltStack: 支持两种模式

2. 语言：
   - Ansible: YAML (声明式)
   - Puppet: 自定义 DSL
   - Chef: Ruby
   - SaltStack: YAML/Python

3. 学习曲线：
   Ansible < SaltStack < Puppet < Chef

4. 适用场景：
   - Ansible: 通用自动化、临时任务、中小规模
   - Puppet: 大规模配置管理、合规性
   - Chef: 复杂应用部署、开发者友好
   - SaltStack: 大规模实时执行、事件驱动
```

**Q2: 解释 Ansible 的幂等性（Idempotency）**

```yaml
# 幂等性示例
- name: 非幂等操作（避免）
  shell: echo "config_line" >> /etc/myapp.conf  # 每次执行都会追加

- name: 幂等操作（推荐）
  lineinfile:
    path: /etc/myapp.conf
    line: "config_line"
    state: present  # 只有不存在时才添加
```

**Q3: 如何提高 Ansible 执行效率？**

```ini
# ansible.cfg 优化配置
[defaults]
forks = 50                    # 增加并行度
gathering = smart             # 智能收集 Facts
fact_caching = jsonfile       # 启用 Facts 缓存
fact_caching_connection = /tmp/facts_cache
fact_caching_timeout = 86400

[ssh_connection]
pipelining = True             # 启用管道，减少 SSH 连接
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
```

```yaml
# Playbook 优化
- hosts: all
  gather_facts: no  # 不需要时禁用 Facts 收集
  strategy: free    # 自由执行策略，不等待其他主机

  tasks:
    - name: Gather only network facts
      setup:
        gather_subset:
          - network
      when: need_network_info
```

### 实战问题

**Q4: 如何实现滚动更新（Rolling Update）？**

```yaml
# playbooks/rolling_update.yml
---
- name: Rolling Update
  hosts: webservers
  serial: "30%"          # 每批处理 30% 的主机
  max_fail_percentage: 10  # 失败率超过 10% 时停止

  pre_tasks:
    - name: Remove from load balancer
      uri:
        url: "http://lb.example.com/api/deregister"
        method: POST
        body:
          host: "{{ inventory_hostname }}"
        body_format: json
      delegate_to: localhost

    - name: Wait for connections to drain
      wait_for:
        timeout: 30

  roles:
    - app

  post_tasks:
    - name: Health check
      uri:
        url: "http://{{ inventory_hostname }}:{{ http_port }}/health"
        status_code: 200
      retries: 10
      delay: 5

    - name: Add back to load balancer
      uri:
        url: "http://lb.example.com/api/register"
        method: POST
        body:
          host: "{{ inventory_hostname }}"
        body_format: json
      delegate_to: localhost
```

**Q5: 如何处理敏感信息？**

```yaml
# 使用 Ansible Vault
ansible-vault encrypt_string 'db_password_123' --name 'db_password'

# 使用 lookup 插件从外部获取
- name: Get secret from AWS Secrets Manager
  set_fact:
    db_password: "{{ lookup('aws_ssm', '/prod/db/password', region='us-east-1') }}"

# 使用 no_log 隐藏敏感输出
- name: Set database password
  mysql_user:
    name: app
    password: "{{ db_password }}"
  no_log: true
```

**Q6: 如何组织大型 Ansible 项目？**

```
ansible-project/
├── ansible.cfg
├── requirements.yml          # Galaxy 依赖
├── site.yml                  # 主入口
├── webservers.yml           # 按类型的 Playbook
├── dbservers.yml
│
├── inventory/
│   ├── production/
│   │   ├── hosts.yml
│   │   ├── group_vars/
│   │   │   ├── all/
│   │   │   │   ├── vars.yml
│   │   │   │   └── vault.yml
│   │   │   └── webservers.yml
│   │   └── host_vars/
│   └── staging/
│
├── roles/
│   ├── common/
│   ├── nginx/
│   ├── mysql/
│   └── app/
│
├── playbooks/
│   ├── deploy.yml
│   ├── rollback.yml
│   └── maintenance.yml
│
├── library/                  # 自定义模块
├── filter_plugins/           # 自定义过滤器
├── callback_plugins/         # 自定义回调
│
└── docs/
    └── README.md
```

### 常见故障排查

```bash
# 调试模式
ansible-playbook site.yml -vvvv

# 检查语法
ansible-playbook site.yml --syntax-check

# 列出任务
ansible-playbook site.yml --list-tasks

# 列出主机
ansible-playbook site.yml --list-hosts

# 检查模式（不实际执行）
ansible-playbook site.yml --check --diff

# 步进执行
ansible-playbook site.yml --step

# 从指定任务开始
ansible-playbook site.yml --start-at-task="Install nginx"

# 只运行带特定标签的任务
ansible-playbook site.yml --tags "nginx,deploy"

# 跳过特定标签的任务
ansible-playbook site.yml --skip-tags "slow_tasks"
```

## 总结

Ansible 作为现代运维自动化的核心工具，其简洁性和强大功能使其成为 DevOps 工程师的必备技能。本文涵盖了从基础概念到高级实践的完整知识体系：

1. **核心架构**：理解无代理架构、SSH 通信机制和执行流程
2. **Inventory 管理**：静态清单、动态清单、多环境管理
3. **Playbook 编写**：任务、角色、变量、条件、循环的综合运用
4. **模块体系**：掌握常用模块，具备自定义模块能力
5. **安全实践**：使用 Vault 加密敏感信息
6. **CI/CD 集成**：与 GitLab CI、GitHub Actions、Jenkins 的无缝对接
7. **最佳实践**：项目组织、性能优化、故障排查

掌握这些内容，你将能够构建可维护、可扩展的自动化运维体系，显著提升基础设施管理效率。
