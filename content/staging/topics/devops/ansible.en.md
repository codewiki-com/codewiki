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
origin: old/src/content/docs/devops/ansible.en.md
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

## Concept Explanation

### What is Ansible

Ansible is an open-source automation operations tool created by Michael DeHaan in 2012 and acquired by Red Hat in 2015. It adopts an agentless architecture, communicates with target hosts via SSH protocol, and uses YAML language to write automation scripts for configuration management, application deployment, task orchestration, and more.

The name Ansible comes from a faster-than-light communication device in science fiction novels, implying the ability to instantly control remote systems. This naming aptly describes Ansible's core capability: simple, fast, and ubiquitous automation control.

### Why Choose Ansible

Among many automation operations tools (such as Puppet, Chef, SaltStack), Ansible stands out for the following reasons:

1. **Agentless Architecture**: No need to install clients on target hosts, only SSH and Python are required
2. **Easy to Learn**: Uses YAML syntax with a gentle learning curve
3. **Idempotency**: Multiple executions produce consistent results, ensuring predictable system state
4. **Rich Modules**: 3000+ official modules covering almost all operations scenarios
5. **Extensibility**: Supports custom modules, plugins, and dynamic Inventory

### Core Terminology

| Term | English | Description |
|------|------|------|
| Control Node | Control Node | The machine running Ansible commands |
| Managed Node | Managed Node | Target hosts managed by Ansible |
| Inventory | Inventory | Configuration file defining managed nodes |
| Playbook | Playbook | Automation scripts in YAML format |
| Task | Task | A single automation operation unit |
| Module | Module | Code units that perform specific operations |
| Role | Role | Reusable Playbook organization method |
| Facts | Facts | System information collected from managed nodes |

## Ansible Architecture and Working Principles

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Control Node                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Inventory  │  │  Playbooks  │  │      Ansible Core       │  │
│  │  (Host List)│  │  (Playbooks)│  │  ┌─────────────────┐   │  │
│  └──────┬──────┘  └──────┬──────┘  │  │    Modules      │   │  │
│         │                │         │  │  (2000+ Modules) │   │  │
│         └────────────────┼─────────┤  └─────────────────┘   │  │
│                          │         │  ┌─────────────────┐   │  │
│                          │         │  │    Plugins      │   │  │
│                          │         │  │(Connection/Callback)│  │
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
│Web Server│          │DB Server │          │ Cache   │
│ (Node 1) │          │ (Node 2) │          │ (Node 3)│
└─────────┘          └─────────┘          └─────────┘
```

### Workflow Details

The complete workflow of Ansible task execution:

```yaml
# Workflow Example
# Parse Inventory, determine target hosts
# Load Playbook, parse YAML structure
# Gather Facts (optional)
# Compile task modules into Python scripts
# Transfer scripts to target hosts via SSH
# Execute scripts on target hosts
# Collect execution results and return
# Clean up temporary files
```

### Installation and Configuration

```bash
# Ubuntu/Debian installation
sudo apt update
sudo apt install ansible -y

# CentOS/RHEL installation
sudo yum install epel-release -y
sudo yum install ansible -y

# macOS installation
brew install ansible

# pip installation (recommended for latest version)
pip3 install ansible

# Verify installation
ansible --version
```

### Configuration File Hierarchy

Ansible searches for configuration files in the following priority order:

```bash
# Priority from high to low
1. ANSIBLE_CONFIG (environment variable)
2. ./ansible.cfg (current directory)
3. ~/.ansible.cfg (user directory)
4. /etc/ansible/ansible.cfg (system global)
```

Typical `ansible.cfg` configuration:

```ini
[defaults]
# Host inventory file path
inventory = ./inventory/hosts

# Remote user
remote_user = deploy

# Private key file
private_key_file = ~/.ssh/id_rsa

# Disable host_key_checking (recommended to enable in production)
host_key_checking = False

# Parallel execution count
forks = 20

# Log file
log_path = ./ansible.log

# Roles path
roles_path = ./roles

# Retry files
retry_files_enabled = False

# Callback plugin (beautify output)
stdout_callback = yaml
callback_whitelist = profile_tasks

[privilege_escalation]
# Privilege escalation
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
# SSH connection optimization
pipelining = True
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
```

## Inventory Management

### INI Format Inventory

```ini
# inventory/hosts

# Individual host definition
192.168.1.10
web01.example.com

# Host group definition
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

# Group of groups (parent group)
[production:children]
webservers
dbservers
cacheservers

# Group variables
[webservers:vars]
http_port=80
max_clients=200

[production:vars]
env=production
ntp_server=ntp.example.com

# Host range pattern
[loadbalancers]
lb[01:05].example.com

# Letter range
[app_servers]
app-[a:f].example.com
```

### YAML Format Inventory

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

### Dynamic Inventory

Dynamic Inventory allows fetching host information from external data sources (cloud platforms, CMDB, etc.):

```python
#!/usr/bin/env python3
# inventory/dynamic_inventory.py

import json
import boto3

def get_inventory():
    """Get EC2 instance information from AWS"""
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

            # Get tags
            tags = {t['Key']: t['Value'] for t in instance.get('Tags', [])}
            role = tags.get('Role', 'other')

            # Add to corresponding group
            if role in inventory:
                inventory[role]['hosts'].append(hostname)

            # Set host variables
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
# Use dynamic Inventory
ansible-inventory -i inventory/dynamic_inventory.py --list
ansible all -i inventory/dynamic_inventory.py -m ping
```

### Cloud Platform Inventory Plugins

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

## Playbook Writing

### Basic Playbook Structure

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

### Conditionals and Loops

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
    # when conditional
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

    # Complex conditions
    - name: Configure high-memory settings
      template:
        src: high_memory.conf.j2
        dest: /etc/app/memory.conf
      when:
        - ansible_memtotal_mb > 8192
        - env == "production"

    # loop iteration
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

    # dict2items iterate dictionary
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

    # with_fileglob file matching
    - name: Copy all config files
      copy:
        src: "{{ item }}"
        dest: /etc/myapp/conf.d/
        owner: root
        mode: '0644'
      with_fileglob:
        - "files/configs/*.conf"
```

### Error Handling and Debugging

```yaml
# playbooks/error_handling.yml
---
- name: Error Handling Examples
  hosts: webservers
  become: yes

  tasks:
    # Ignore errors and continue execution
    - name: Try to stop a service that might not exist
      service:
        name: nonexistent-service
        state: stopped
      ignore_errors: yes

    # Custom failure conditions
    - name: Check disk space
      shell: df -h / | tail -1 | awk '{print $5}' | sed 's/%//'
      register: disk_usage
      failed_when: disk_usage.stdout | int > 90
      changed_when: false

    # block/rescue/always structure
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

    # Debug variables
    - name: Debug output
      debug:
        msg: "Host: {{ inventory_hostname }}, IP: {{ ansible_default_ipv4.address }}"

    - name: Debug variable structure
      debug:
        var: ansible_mounts
        verbosity: 2

    # assert assertions
    - name: Verify prerequisites
      assert:
        that:
          - ansible_memtotal_mb >= 2048
          - ansible_distribution == "Ubuntu"
          - ansible_distribution_major_version | int >= 20
        fail_msg: "System does not meet minimum requirements"
        success_msg: "All prerequisites met"
```

## Modules and Tasks

### Common Modules Explained

```yaml
# playbooks/common_modules.yml
---
- name: Common Modules Examples
  hosts: all
  become: yes

  tasks:
    # ============ File Operation Modules ============

    # file - Manage files and directories
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

    # copy - Copy files
    - name: Copy configuration file
      copy:
        src: files/nginx.conf
        dest: /etc/nginx/nginx.conf
        owner: root
        group: root
        mode: '0644'
        backup: yes
      notify: Reload nginx

    # template - Use Jinja2 templates
    - name: Deploy app configuration
      template:
        src: templates/app.conf.j2
        dest: /etc/myapp/app.conf
        owner: app
        group: app
        mode: '0600'
        validate: '/opt/myapp/bin/validate-config %s'

    # lineinfile - Manage lines in files
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

    # blockinfile - Manage blocks in files
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

    # ============ Package Management Modules ============

    # apt - Debian/Ubuntu package management
    - name: Install multiple packages
      apt:
        name:
          - nginx
          - python3-pip
          - git
        state: present
        update_cache: yes
        cache_valid_time: 3600

    # yum - RedHat/CentOS package management
    - name: Install packages on RedHat
      yum:
        name:
          - httpd
          - python3
          - git
        state: present
      when: ansible_os_family == "RedHat"

    # pip - Python package management
    - name: Install Python packages
      pip:
        name:
          - flask
          - gunicorn
          - redis
        state: present
        virtualenv: /opt/myapp/venv
        virtualenv_python: python3

    # ============ Service Management Modules ============

    # systemd - systemd service management
    - name: Manage systemd service
      systemd:
        name: nginx
        state: started
        enabled: yes
        daemon_reload: yes

    # service - General service management
    - name: Ensure service is running
      service:
        name: nginx
        state: started
        enabled: yes

    # ============ User and Group Modules ============

    # user - User management
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

    # group - Group management
    - name: Create application group
      group:
        name: app
        gid: 1001
        state: present

    # authorized_key - SSH public key management
    - name: Add SSH authorized key
      authorized_key:
        user: deploy
        state: present
        key: "{{ lookup('file', 'files/deploy_key.pub') }}"

    # ============ Command Execution Modules ============

    # command - Execute command (not through shell)
    - name: Run command
      command: /opt/myapp/bin/check-health
      args:
        chdir: /opt/myapp
      register: health_result
      changed_when: false

    # shell - Execute command through shell
    - name: Run shell command with pipes
      shell: |
        cat /var/log/nginx/access.log | grep "500" | wc -l
      register: error_count
      changed_when: false

    # raw - Raw command (doesn't require Python)
    - name: Bootstrap Python on minimal systems
      raw: apt-get install -y python3
      when: bootstrap_required | default(false)

    # ============ Network Modules ============

    # uri - HTTP requests
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

    # get_url - Download files
    - name: Download application binary
      get_url:
        url: "https://releases.example.com/app-{{ version }}.tar.gz"
        dest: /tmp/app-{{ version }}.tar.gz
        checksum: "sha256:{{ app_checksum }}"
        mode: '0644'

    # ============ Archive Modules ============

    # unarchive - Extract files
    - name: Extract application
      unarchive:
        src: /tmp/app-{{ version }}.tar.gz
        dest: /opt/myapp/
        remote_src: yes
        owner: app
        group: app

    # archive - Create archives
    - name: Create backup archive
      archive:
        path:
          - /opt/myapp/data
          - /opt/myapp/config
        dest: /backup/app-backup-{{ ansible_date_time.date }}.tar.gz
        format: gz
```

### Custom Modules

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

## Variables and Facts

### Variable Precedence

Ansible variable precedence (from lowest to highest):

```yaml
# Command line values (passed via -e, highest priority)
# role defaults
# inventory file or script group variables
# inventory group_vars/all
# playbook group_vars/all
# inventory group_vars/*
# playbook group_vars/*
# inventory file or script host variables
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
# extra vars (-e parameter, highest priority)
```

### Variable Definition Methods

```yaml
# group_vars/all.yml
---
# Global variables
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
    # Simple variables
    app_name: myapp
    app_version: "2.0.0"

    # List variables
    required_packages:
      - nginx
      - python3
      - git

    # Dictionary variables
    database:
      host: db.example.com
      port: 3306
      name: production
      user: app

    # Nested variables
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
    # Using variables
    - name: Display variables
      debug:
        msg: |
          App: {{ app_name }} v{{ app_version }}
          DB Host: {{ database.host }}
          Web Port: {{ services['web']['port'] }}

    # Register variables
    - name: Get current date
      command: date +%Y%m%d
      register: current_date
      changed_when: false

    - name: Use registered variable
      debug:
        msg: "Current date is {{ current_date.stdout }}"

    # set_fact dynamically set variables
    - name: Set deployment timestamp
      set_fact:
        deploy_timestamp: "{{ ansible_date_time.iso8601 }}"
        deploy_dir: "/opt/{{ app_name }}/releases/{{ current_date.stdout }}"

    # Default values
    - name: Use variable with default
      debug:
        msg: "Port: {{ custom_port | default(8080) }}"

    # Environment variables
    - name: Use environment variable
      debug:
        msg: "Home directory: {{ lookup('env', 'HOME') }}"
```

### Facts Gathering and Usage

```yaml
# playbooks/facts.yml
---
- name: Working with Facts
  hosts: all
  gather_facts: yes

  tasks:
    # View all Facts
    - name: Display all facts
      debug:
        var: ansible_facts
      when: show_all_facts | default(false)

    # Common Facts
    - name: Show system information
      debug:
        msg: |
          Hostname: {{ ansible_hostname }}
          FQDN: {{ ansible_fqdn }}
          OS: {{ ansible_distribution }} {{ ansible_distribution_version }}
          Kernel: {{ ansible_kernel }}
          Architecture: {{ ansible_architecture }}
          CPU Cores: {{ ansible_processor_vcpus }}
          Memory: {{ ansible_memtotal_mb }} MB
          IP Address: {{ ansible_default_ipv4.address }}
          MAC Address: {{ ansible_default_ipv4.macaddress }}

    # Conditional based on Facts
    - name: Install package based on OS
      package:
        name: "{{ item }}"
        state: present
      loop:
        - "{{ 'httpd' if ansible_os_family == 'RedHat' else 'nginx' }}"

    # Custom Facts
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

    # Re-gather Facts to get custom Facts
    - name: Refresh facts
      setup:
        filter: ansible_local

    - name: Show custom facts
      debug:
        var: ansible_local.app_info

    # Facts caching
    # Configure in ansible.cfg:
    # [defaults]
    # gathering = smart
    # fact_caching = jsonfile
    # fact_caching_connection = /tmp/ansible_facts_cache
    # fact_caching_timeout = 86400
```

## Roles Best Practices

### Role Directory Structure

```
roles/
└── nginx/
    ├── defaults/           # Default variables (lowest priority)
    │   └── main.yml
    ├── vars/               # Role variables (higher priority)
    │   └── main.yml
    ├── tasks/              # Task files
    │   ├── main.yml
    │   ├── install.yml
    │   ├── configure.yml
    │   └── service.yml
    ├── handlers/           # Handlers
    │   └── main.yml
    ├── templates/          # Jinja2 templates
    │   ├── nginx.conf.j2
    │   └── vhost.conf.j2
    ├── files/              # Static files
    │   └── ssl/
    ├── meta/               # Role metadata and dependencies
    │   └── main.yml
    ├── tests/              # Test files
    │   ├── inventory
    │   └── test.yml
    └── README.md           # Documentation
```

### Complete Nginx Role Example

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

### Using Roles

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

## Jinja2 Templates

### Template Syntax Explained

```jinja2
{# templates/app.conf.j2 #}

{# Comment: This is an application configuration template #}

# Application Configuration
# Generated by Ansible on {{ ansible_date_time.iso8601 }}
# Managed host: {{ inventory_hostname }}

# ================== Variable Interpolation ==================
app_name = {{ app_name }}
app_version = {{ app_version }}
environment = {{ env | default('development') }}

# ================== Filter Usage ==================
# String operations
app_name_upper = {{ app_name | upper }}
app_name_lower = {{ app_name | lower }}
app_name_title = {{ app_name | title }}
app_name_hash = {{ app_name | hash('md5') }}

# Default values
custom_setting = {{ custom_setting | default('default_value') }}
optional_port = {{ optional_port | default(8080) }}

# Number formatting
memory_limit = {{ memory_limit_mb | default(512) | int }}MB

# List operations
allowed_hosts = {{ allowed_hosts | join(', ') }}
first_host = {{ allowed_hosts | first }}
last_host = {{ allowed_hosts | last }}
host_count = {{ allowed_hosts | length }}

# JSON output
database_config = {{ database | to_json }}
database_pretty = {{ database | to_nice_json }}

# Regex replacement
clean_name = {{ app_name | regex_replace('[^a-zA-Z0-9]', '_') }}

# ================== Conditional Statements ==================
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

# Ternary expression
cache_enabled = {{ 'true' if enable_cache | default(false) else 'false' }}

# ================== Loop Statements ==================
# Simple loop
[allowed_ips]
{% for ip in allowed_ips %}
{{ ip }}
{% endfor %}

# Loop with index
[servers]
{% for server in servers %}
server_{{ loop.index }} = {{ server.host }}:{{ server.port }}
{% endfor %}

# Loop control
[active_servers]
{% for server in servers if server.active %}
{{ server.name }} = {{ server.host }}:{{ server.port }}
{% endfor %}

# Dictionary loop
[environment_variables]
{% for key, value in env_vars.items() %}
{{ key }} = {{ value }}
{% endfor %}

# Loop variables
{% for item in items %}
{# loop.index - 1-based index #}
{# loop.index0 - 0-based index #}
{# loop.first - Is first element #}
{# loop.last - Is last element #}
{# loop.length - Total element count #}
item_{{ loop.index0 }} = {{ item }}{% if not loop.last %},{% endif %}

{% endfor %}

# ================== Macro Definitions ==================
{% macro server_block(name, host, port, weight=1) %}
upstream_{{ name }} {
    server {{ host }}:{{ port }} weight={{ weight }};
}
{% endmacro %}

{{ server_block('web', 'localhost', 8080, 5) }}
{{ server_block('api', 'localhost', 8081, 3) }}

# ================== Whitespace Control ==================
{#- Use - to remove preceding whitespace -#}
{% for user in users -%}
{{ user.name }}
{%- endfor %}

# ================== Include Other Templates ==================
{% include 'partials/database.conf.j2' %}

# ================== Raw Block (No Parsing) ==================
{% raw %}
# The following content will not be parsed by Jinja2
template_variable = {{ not_a_variable }}
{% endraw %}
```

### Common Filters Reference

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

## Ansible Vault Encryption

### Basic Vault Operations

```bash
# Create encrypted file
ansible-vault create secrets.yml

# Edit encrypted file
ansible-vault edit secrets.yml

# View encrypted file content
ansible-vault view secrets.yml

# Encrypt existing file
ansible-vault encrypt vars/production.yml

# Decrypt file
ansible-vault decrypt vars/production.yml

# Change password
ansible-vault rekey secrets.yml

# Encrypt string
ansible-vault encrypt_string 'SuperSecretPassword' --name 'db_password'
```

### Vault Usage Methods

```yaml
# group_vars/production/vault.yml (encrypted file)
---
vault_db_password: "P@ssw0rd!2024"
vault_api_key: "sk-xxxxxxxxxxxx"
vault_ssl_private_key: |
  -----BEGIN PRIVATE KEY-----
  MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...
  -----END PRIVATE KEY-----

# group_vars/production/vars.yml (plaintext file, references encrypted variables)
---
db_password: "{{ vault_db_password }}"
api_key: "{{ vault_api_key }}"
ssl_private_key: "{{ vault_ssl_private_key }}"
```

```yaml
# Using encrypted variables in Playbook
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
# Provide password at runtime
ansible-playbook playbooks/deploy.yml --ask-vault-pass

# Use password file
ansible-playbook playbooks/deploy.yml --vault-password-file ~/.vault_pass

# Multiple Vault IDs (different passwords for different environments)
ansible-vault create --vault-id prod@prompt secrets_prod.yml
ansible-vault create --vault-id dev@prompt secrets_dev.yml

ansible-playbook site.yml \
  --vault-id dev@~/.vault_pass_dev \
  --vault-id prod@~/.vault_pass_prod
```

### Vault Configuration

```ini
# ansible.cfg
[defaults]
vault_password_file = ~/.vault_pass

# Or use a script to get password
vault_password_file = /path/to/vault_password_script.py
```

```python
#!/usr/bin/env python3
# vault_password_script.py
# Get Vault password from key management service

import boto3

def get_vault_password():
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(SecretId='ansible-vault-password')
    return response['SecretString']

if __name__ == '__main__':
    print(get_vault_password())
```

## CI/CD Integration

### GitLab CI Integration

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

### GitHub Actions Integration

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

### Jenkins Pipeline Integration

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

### AWX Installation and Configuration

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

## Interview Key Points

### Core Concept Questions

**Q1: What are the differences between Ansible and other configuration management tools (Puppet, Chef, SaltStack)?**

```
Key Differences:

1. Architecture Model:
   - Ansible: Agentless, push via SSH
   - Puppet/Chef: Requires Agent installation, client pull
   - SaltStack: Supports both modes

2. Language:
   - Ansible: YAML (declarative)
   - Puppet: Custom DSL
   - Chef: Ruby
   - SaltStack: YAML/Python

3. Learning Curve:
   Ansible < SaltStack < Puppet < Chef

4. Use Cases:
   - Ansible: General automation, ad-hoc tasks, small to medium scale
   - Puppet: Large-scale configuration management, compliance
   - Chef: Complex application deployment, developer-friendly
   - SaltStack: Large-scale real-time execution, event-driven
```

**Q2: Explain Ansible's Idempotency**

```yaml
# Idempotency Example
- name: Non-idempotent operation (avoid)
  shell: echo "config_line" >> /etc/myapp.conf  # Appends every execution

- name: Idempotent operation (recommended)
  lineinfile:
    path: /etc/myapp.conf
    line: "config_line"
    state: present  # Only adds if not present
```

**Q3: How to improve Ansible execution efficiency?**

```ini
# ansible.cfg optimization configuration
[defaults]
forks = 50                    # Increase parallelism
gathering = smart             # Smart Facts gathering
fact_caching = jsonfile       # Enable Facts caching
fact_caching_connection = /tmp/facts_cache
fact_caching_timeout = 86400

[ssh_connection]
pipelining = True             # Enable pipelining, reduce SSH connections
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
```

```yaml
# Playbook optimization
- hosts: all
  gather_facts: no  # Disable Facts gathering when not needed
  strategy: free    # Free execution strategy, don't wait for other hosts

  tasks:
    - name: Gather only network facts
      setup:
        gather_subset:
          - network
      when: need_network_info
```

### Practical Questions

**Q4: How to implement Rolling Updates?**

```yaml
# playbooks/rolling_update.yml
---
- name: Rolling Update
  hosts: webservers
  serial: "30%"          # Process 30% of hosts per batch
  max_fail_percentage: 10  # Stop when failure rate exceeds 10%

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

**Q5: How to handle sensitive information?**

```yaml
# Use Ansible Vault
ansible-vault encrypt_string 'db_password_123' --name 'db_password'

# Use lookup plugin to fetch from external sources
- name: Get secret from AWS Secrets Manager
  set_fact:
    db_password: "{{ lookup('aws_ssm', '/prod/db/password', region='us-east-1') }}"

# Use no_log to hide sensitive output
- name: Set database password
  mysql_user:
    name: app
    password: "{{ db_password }}"
  no_log: true
```

**Q6: How to organize large-scale Ansible projects?**

```
ansible-project/
├── ansible.cfg
├── requirements.yml          # Galaxy dependencies
├── site.yml                  # Main entry point
├── webservers.yml           # Type-specific Playbook
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
├── library/                  # Custom modules
├── filter_plugins/           # Custom filters
├── callback_plugins/         # Custom callbacks
│
└── docs/
    └── README.md
```

### Common Troubleshooting

```bash
# Debug mode
ansible-playbook site.yml -vvvv

# Syntax check
ansible-playbook site.yml --syntax-check

# List tasks
ansible-playbook site.yml --list-tasks

# List hosts
ansible-playbook site.yml --list-hosts

# Check mode (dry run)
ansible-playbook site.yml --check --diff

# Step-by-step execution
ansible-playbook site.yml --step

# Start from specific task
ansible-playbook site.yml --start-at-task="Install nginx"

# Run only tasks with specific tags
ansible-playbook site.yml --tags "nginx,deploy"

# Skip tasks with specific tags
ansible-playbook site.yml --skip-tags "slow_tasks"
```

## Summary

Ansible, as a core tool for modern operations automation, has become an essential skill for DevOps engineers due to its simplicity and powerful capabilities. We covered the complete knowledge system from basic concepts to advanced practices:

1. **Core Architecture**: Understanding agentless architecture, SSH communication mechanism, and execution flow
2. **Inventory Management**: Static inventory, dynamic inventory, multi-environment management
3. **Playbook Writing**: Comprehensive use of tasks, roles, variables, conditionals, and loops
4. **Module System**: Mastering common modules and developing custom modules
5. **Security Practices**: Using Vault to encrypt sensitive information
6. **CI/CD Integration**: Seamless integration with GitLab CI, GitHub Actions, and Jenkins
7. **Best Practices**: Project organization, performance optimization, and troubleshooting

Mastering this content will enable you to build maintainable and scalable automation operations systems, significantly improving infrastructure management efficiency.
