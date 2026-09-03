---
title: 命令行参数解析
description: Python argparse模块完全指南，构建专业的命令行接口
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - argparse
  - CLI
  - 命令行
status: imported
origin: old/src/content/docs/python/argparse.zh.md
divergence: 0.237
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 22
  lastUpdated: 2026-01-07
---

命令行接口（CLI）是与程序交互的重要方式。Python 的 `argparse` 模块提供了一套强大而灵活的工具，用于解析命令行参数，自动生成帮助信息，并进行参数验证。无论是简单的脚本还是复杂的命令行工具，argparse 都能帮你构建专业的用户界面。

## 为什么选择 argparse？

相比手动解析 `sys.argv`，argparse 提供了以下优势：

- **自动生成帮助信息**：自动创建 `-h/--help` 选项，展示所有参数的用法
- **类型转换**：自动将字符串参数转换为指定类型（int、float 等）
- **参数验证**：自动检查必需参数、参数值范围等
- **错误处理**：提供友好的错误提示信息
- **子命令支持**：轻松实现 git 风格的子命令结构

## 快速入门

### 最简单的示例

```python
import argparse

# 创建解析器
parser = argparse.ArgumentParser(description='一个简单的程序')

# 添加参数
parser.add_argument('name', help='你的名字')

# 解析参数
args = parser.parse_args()

# 使用参数
print(f'你好，{args.name}！')
```

运行效果：

```bash
$ python hello.py 张三
你好，张三！

$ python hello.py --help
usage: hello.py [-h] name

一个简单的程序

positional arguments:
  name        你的名字

options:
  -h, --help  show this help message and exit
```

### 位置参数与可选参数

argparse 支持两种类型的参数：

```python
import argparse

parser = argparse.ArgumentParser(description='文件处理工具')

# 位置参数（必需）
parser.add_argument('filename', help='要处理的文件名')

# 可选参数（以 - 或 -- 开头）
parser.add_argument('-o', '--output', help='输出文件名')
parser.add_argument('-v', '--verbose', action='store_true', help='显示详细信息')

args = parser.parse_args()

print(f'输入文件: {args.filename}')
print(f'输出文件: {args.output}')
print(f'详细模式: {args.verbose}')
```

运行示例：

```bash
$ python process.py input.txt -o output.txt -v
输入文件: input.txt
输出文件: output.txt
详细模式: True

$ python process.py input.txt
输入文件: input.txt
输出文件: None
详细模式: False
```

## ArgumentParser 详解

### 创建解析器

`ArgumentParser` 是 argparse 的核心类，它负责解析命令行参数。

```python
import argparse

parser = argparse.ArgumentParser(
    prog='myapp',                    # 程序名称（默认为 sys.argv[0]）
    description='程序功能描述',       # 显示在帮助信息的开头
    epilog='更多信息请访问...',       # 显示在帮助信息的结尾
    formatter_class=argparse.RawDescriptionHelpFormatter,  # 格式化类
    add_help=True,                   # 是否添加 -h/--help（默认 True）
    allow_abbrev=True,               # 是否允许参数缩写（默认 True）
)
```

### 常用格式化类

argparse 提供了几种格式化类来控制帮助信息的显示：

```python
import argparse

# 默认格式化（自动换行）
parser = argparse.ArgumentParser(
    formatter_class=argparse.HelpFormatter
)

# 保留原始格式（不自动换行）
parser = argparse.ArgumentParser(
    formatter_class=argparse.RawDescriptionHelpFormatter
)

# 同时保留描述和帮助文本的原始格式
parser = argparse.ArgumentParser(
    formatter_class=argparse.RawTextHelpFormatter
)

# 自动添加默认值信息
parser = argparse.ArgumentParser(
    formatter_class=argparse.ArgumentDefaultsHelpFormatter
)

# 在帮助信息中显示类型名称
parser = argparse.ArgumentParser(
    formatter_class=argparse.MetavarTypeHelpFormatter
)
```

使用 `ArgumentDefaultsHelpFormatter` 的效果：

```python
import argparse

parser = argparse.ArgumentParser(
    formatter_class=argparse.ArgumentDefaultsHelpFormatter
)
parser.add_argument('--timeout', type=int, default=30, help='超时时间（秒）')
parser.print_help()
```

输出：

```
usage: prog.py [-h] [--timeout TIMEOUT]

options:
  -h, --help         show this help message and exit
  --timeout TIMEOUT  超时时间（秒） (default: 30)
```

## 添加参数

### add_argument() 方法

`add_argument()` 是定义参数的核心方法，它有许多可选参数：

```python
parser.add_argument(
    'name',                  # 参数名（位置参数）
    '-s', '--short',         # 或短选项和长选项（可选参数）
    action='store',          # 参数动作
    nargs=None,              # 参数个数
    const=None,              # 常量值
    default=None,            # 默认值
    type=str,                # 参数类型
    choices=None,            # 允许的值列表
    required=False,          # 是否必需（仅可选参数）
    help='参数说明',          # 帮助信息
    metavar='NAME',          # 在帮助信息中显示的参数名
    dest='variable_name'     # 存储参数值的属性名
)
```

### 参数类型（type）

argparse 会自动将命令行字符串转换为指定类型：

```python
import argparse

parser = argparse.ArgumentParser()

# 内置类型
parser.add_argument('--count', type=int, help='整数参数')
parser.add_argument('--ratio', type=float, help='浮点数参数')
parser.add_argument('--flag', type=bool, help='布尔参数')  # 注意：这可能不是你想要的

# 文件类型（自动打开文件）
parser.add_argument('--input', type=argparse.FileType('r'), help='输入文件')
parser.add_argument('--output', type=argparse.FileType('w'), help='输出文件')

args = parser.parse_args()
```

**自定义类型转换函数**：

```python
import argparse

def positive_int(value):
    """只接受正整数"""
    ivalue = int(value)
    if ivalue <= 0:
        raise argparse.ArgumentTypeError(f'{value} 不是正整数')
    return ivalue

def date_type(value):
    """解析日期字符串"""
    from datetime import datetime
    try:
        return datetime.strptime(value, '%Y-%m-%d')
    except ValueError:
        raise argparse.ArgumentTypeError(f'{value} 不是有效的日期格式（YYYY-MM-DD）')

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=positive_int, help='端口号（正整数）')
parser.add_argument('--date', type=date_type, help='日期（YYYY-MM-DD）')

args = parser.parse_args()
```

运行示例：

```bash
$ python app.py --port -1
usage: app.py [-h] [--port PORT]
app.py: error: argument --port: -1 不是正整数

$ python app.py --date 2026-01-07
# 成功解析为 datetime 对象
```

### 参数选项（choices）

限制参数只能取特定值：

```python
import argparse

parser = argparse.ArgumentParser()

# 字符串选项
parser.add_argument(
    '--format',
    choices=['json', 'xml', 'csv'],
    default='json',
    help='输出格式'
)

# 整数选项
parser.add_argument(
    '--verbosity',
    type=int,
    choices=[0, 1, 2],
    default=0,
    help='日志详细程度'
)

# 枚举选项
from enum import Enum

class Color(Enum):
    RED = 'red'
    GREEN = 'green'
    BLUE = 'blue'

parser.add_argument(
    '--color',
    type=Color,
    choices=list(Color),
    help='颜色选择'
)

args = parser.parse_args()
```

运行示例：

```bash
$ python app.py --format yaml
usage: app.py [-h] [--format {json,xml,csv}]
app.py: error: argument --format: invalid choice: 'yaml' (choose from 'json', 'xml', 'csv')
```

### 参数个数（nargs）

控制参数接受的值的数量：

```python
import argparse

parser = argparse.ArgumentParser()

# 固定数量
parser.add_argument('--point', nargs=2, type=float, help='坐标点 (x y)')

# 零个或多个
parser.add_argument('--files', nargs='*', help='文件列表（可以为空）')

# 一个或多个
parser.add_argument('--hosts', nargs='+', help='主机列表（至少一个）')

# 可选（零个或一个）
parser.add_argument('--config', nargs='?', const='default.cfg', help='配置文件')

# 剩余所有参数
parser.add_argument('rest', nargs=argparse.REMAINDER, help='其他参数')

args = parser.parse_args()
```

nargs 值说明：

| nargs 值 | 含义 | 结果类型 |
|----------|------|----------|
| N（整数） | 恰好 N 个参数 | 列表 |
| `'?'` | 零个或一个 | 单个值或 default/const |
| `'*'` | 零个或多个 | 列表 |
| `'+'` | 一个或多个 | 列表 |
| `argparse.REMAINDER` | 所有剩余参数 | 列表 |

使用 `nargs='?'` 的详细示例：

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument(
    '--output',
    nargs='?',
    const='default_output.txt',  # 只有 --output 但没有值时使用
    default=None,                 # 完全没有 --output 时使用
    help='输出文件'
)

args = parser.parse_args()
```

```bash
$ python app.py
output: None

$ python app.py --output
output: default_output.txt

$ python app.py --output result.txt
output: result.txt
```

### 参数动作（action）

action 决定参数被发现时如何处理：

```python
import argparse

parser = argparse.ArgumentParser()

# store：存储参数值（默认）
parser.add_argument('--name', action='store')

# store_const：存储常量值
parser.add_argument('--enable', action='store_const', const=True)

# store_true / store_false：存储布尔值
parser.add_argument('-v', '--verbose', action='store_true')
parser.add_argument('--no-cache', action='store_false', dest='cache')

# append：多次使用参数，值追加到列表
parser.add_argument('--include', action='append')

# append_const：多次使用参数，常量追加到列表
parser.add_argument('-v', action='append_const', const=1, dest='verbosity')

# count：计数参数出现次数
parser.add_argument('-v', '--verbose', action='count', default=0)

# version：显示版本信息并退出
parser.add_argument('--version', action='version', version='%(prog)s 1.0.0')

# extend：扩展列表（Python 3.8+）
parser.add_argument('--files', action='extend', nargs='+', type=str)

args = parser.parse_args()
```

count 动作的常见用法：

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('-v', '--verbose', action='count', default=0)

args = parser.parse_args()

if args.verbose >= 2:
    print('非常详细的输出')
elif args.verbose >= 1:
    print('详细输出')
else:
    print('正常输出')
```

```bash
$ python app.py           # verbose = 0
$ python app.py -v        # verbose = 1
$ python app.py -vv       # verbose = 2
$ python app.py -v -v -v  # verbose = 3
```

### 必需的可选参数

默认情况下，可选参数不是必需的。可以使用 `required=True` 改变这一行为：

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--api-key', required=True, help='API 密钥（必需）')
parser.add_argument('--endpoint', required=True, help='API 端点（必需）')

args = parser.parse_args()
```

```bash
$ python app.py
usage: app.py [-h] --api-key API_KEY --endpoint ENDPOINT
app.py: error: the following arguments are required: --api-key, --endpoint
```

### 默认值

设置参数的默认值：

```python
import argparse

parser = argparse.ArgumentParser()

# 简单默认值
parser.add_argument('--port', type=int, default=8080)

# 使用环境变量作为默认值
import os
parser.add_argument(
    '--host',
    default=os.getenv('APP_HOST', 'localhost')
)

# 抑制默认值（不添加到 namespace）
parser.add_argument('--debug', default=argparse.SUPPRESS)

args = parser.parse_args()
```

### 帮助信息与显示名

使用 `help` 和 `metavar` 自定义帮助信息：

```python
import argparse

parser = argparse.ArgumentParser()

# 基本帮助信息
parser.add_argument('--timeout', type=int, help='请求超时时间（秒）')

# 自定义显示名
parser.add_argument(
    '--output',
    metavar='FILE',
    help='输出文件路径'
)

# 多值参数的显示名
parser.add_argument(
    '--range',
    nargs=2,
    metavar=('START', 'END'),
    type=int,
    help='范围起止值'
)

# 隐藏参数（不在帮助中显示）
parser.add_argument('--secret', help=argparse.SUPPRESS)

parser.print_help()
```

输出：

```
usage: prog.py [-h] [--timeout TIMEOUT] [--output FILE] [--range START END]

options:
  -h, --help          show this help message and exit
  --timeout TIMEOUT   请求超时时间（秒）
  --output FILE       输出文件路径
  --range START END   范围起止值
```

### 目标属性名（dest）

指定参数值存储的属性名：

```python
import argparse

parser = argparse.ArgumentParser()

# 默认情况下，dest 由参数名推断
parser.add_argument('-n', '--name')  # dest='name'
parser.add_argument('--user-name')   # dest='user_name'（连字符转下划线）

# 自定义 dest
parser.add_argument('-v', '--verbose', dest='verbosity', action='count', default=0)

args = parser.parse_args(['-v', '-v'])
print(args.verbosity)  # 2
```

## 参数分组

### 基本分组

将相关参数组织在一起，使帮助信息更清晰：

```python
import argparse

parser = argparse.ArgumentParser(description='数据库管理工具')

# 连接参数组
connection_group = parser.add_argument_group('连接选项')
connection_group.add_argument('--host', default='localhost', help='数据库主机')
connection_group.add_argument('--port', type=int, default=5432, help='数据库端口')
connection_group.add_argument('--user', help='用户名')
connection_group.add_argument('--password', help='密码')

# 操作参数组
operation_group = parser.add_argument_group('操作选项')
operation_group.add_argument('--backup', action='store_true', help='备份数据库')
operation_group.add_argument('--restore', metavar='FILE', help='从文件恢复')

parser.print_help()
```

输出：

```
usage: db.py [-h] [--host HOST] [--port PORT] [--user USER] [--password PASSWORD]
             [--backup] [--restore FILE]

数据库管理工具

options:
  -h, --help           show this help message and exit

连接选项:
  --host HOST          数据库主机
  --port PORT          数据库端口
  --user USER          用户名
  --password PASSWORD  密码

操作选项:
  --backup             备份数据库
  --restore FILE       从文件恢复
```

### 互斥参数组

某些参数之间互斥，不能同时使用：

```python
import argparse

parser = argparse.ArgumentParser(description='文件压缩工具')

# 创建互斥组
mode_group = parser.add_mutually_exclusive_group(required=True)
mode_group.add_argument('-c', '--compress', action='store_true', help='压缩文件')
mode_group.add_argument('-x', '--extract', action='store_true', help='解压文件')
mode_group.add_argument('-l', '--list', action='store_true', help='列出内容')

parser.add_argument('archive', help='压缩包文件')

args = parser.parse_args()
```

```bash
$ python archive.py -c -x data.zip
usage: archive.py [-h] (-c | -x | -l) archive
archive.py: error: argument -x/--extract: not allowed with argument -c/--compress

$ python archive.py -c data.zip
# 成功
```

## 子命令（Subparsers）

子命令允许你创建类似 `git commit`、`git push` 这样的命令结构：

```python
import argparse

# 创建主解析器
parser = argparse.ArgumentParser(description='项目管理工具')
parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')

# 创建子命令解析器
subparsers = parser.add_subparsers(
    title='子命令',
    dest='command',
    description='可用的子命令',
    help='子命令帮助'
)

# init 子命令
init_parser = subparsers.add_parser('init', help='初始化新项目')
init_parser.add_argument('name', help='项目名称')
init_parser.add_argument('--template', default='default', help='项目模板')

# build 子命令
build_parser = subparsers.add_parser('build', help='构建项目')
build_parser.add_argument('--release', action='store_true', help='发布构建')
build_parser.add_argument('--target', default='all', help='构建目标')

# deploy 子命令
deploy_parser = subparsers.add_parser('deploy', help='部署项目')
deploy_parser.add_argument('environment', choices=['dev', 'staging', 'prod'], help='目标环境')
deploy_parser.add_argument('--force', action='store_true', help='强制部署')

args = parser.parse_args()

# 处理子命令
if args.command == 'init':
    print(f'初始化项目: {args.name}，模板: {args.template}')
elif args.command == 'build':
    mode = '发布' if args.release else '开发'
    print(f'构建项目: {mode}模式，目标: {args.target}')
elif args.command == 'deploy':
    print(f'部署到: {args.environment}')
else:
    parser.print_help()
```

运行示例：

```bash
$ python project.py --help
usage: project.py [-h] [--verbose] {init,build,deploy} ...

项目管理工具

options:
  -h, --help            show this help message and exit
  --verbose, -v         详细输出

子命令:
  可用的子命令

  {init,build,deploy}   子命令帮助
    init                初始化新项目
    build               构建项目
    deploy              部署项目

$ python project.py init myapp --template flask
初始化项目: myapp，模板: flask

$ python project.py build --release
构建项目: 发布模式，目标: all

$ python project.py deploy prod --force
部署到: prod
```

### 子命令别名

为子命令添加别名：

```python
import argparse

parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers(dest='command')

# checkout 子命令，别名 co
checkout = subparsers.add_parser('checkout', aliases=['co'], help='切换分支')
checkout.add_argument('branch', help='分支名')

args = parser.parse_args()
```

```bash
$ python vcs.py co main     # 使用别名
$ python vcs.py checkout main  # 使用完整名称
```

### 设置子命令处理函数

为每个子命令设置专门的处理函数：

```python
import argparse

def init_project(args):
    print(f'初始化项目: {args.name}')

def build_project(args):
    print(f'构建项目，目标: {args.target}')

def deploy_project(args):
    print(f'部署到: {args.environment}')

parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers()

# init
init_parser = subparsers.add_parser('init')
init_parser.add_argument('name')
init_parser.set_defaults(func=init_project)

# build
build_parser = subparsers.add_parser('build')
build_parser.add_argument('--target', default='all')
build_parser.set_defaults(func=build_project)

# deploy
deploy_parser = subparsers.add_parser('deploy')
deploy_parser.add_argument('environment')
deploy_parser.set_defaults(func=deploy_project)

args = parser.parse_args()

# 调用对应的处理函数
if hasattr(args, 'func'):
    args.func(args)
else:
    parser.print_help()
```

## 自定义动作（Custom Actions）

当内置的 action 不能满足需求时，可以创建自定义动作：

```python
import argparse

class ValidateEmailAction(argparse.Action):
    """验证邮箱格式的自定义动作"""

    def __call__(self, parser, namespace, values, option_string=None):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, values):
            raise argparse.ArgumentError(self, f'无效的邮箱地址: {values}')
        setattr(namespace, self.dest, values)

class RangeAction(argparse.Action):
    """验证数值范围的自定义动作"""

    def __init__(self, option_strings, dest, min_val=None, max_val=None, **kwargs):
        self.min_val = min_val
        self.max_val = max_val
        super().__init__(option_strings, dest, **kwargs)

    def __call__(self, parser, namespace, values, option_string=None):
        if self.min_val is not None and values < self.min_val:
            raise argparse.ArgumentError(self, f'值必须 >= {self.min_val}')
        if self.max_val is not None and values > self.max_val:
            raise argparse.ArgumentError(self, f'值必须 <= {self.max_val}')
        setattr(namespace, self.dest, values)

class AppendUniqueAction(argparse.Action):
    """追加不重复的值到列表"""

    def __call__(self, parser, namespace, values, option_string=None):
        items = getattr(namespace, self.dest, None) or []
        if values not in items:
            items.append(values)
        setattr(namespace, self.dest, items)

# 使用自定义动作
parser = argparse.ArgumentParser()

parser.add_argument('--email', action=ValidateEmailAction, help='邮箱地址')

parser.add_argument(
    '--port',
    type=int,
    action=RangeAction,
    min_val=1,
    max_val=65535,
    help='端口号（1-65535）'
)

parser.add_argument(
    '--tag',
    action=AppendUniqueAction,
    help='标签（可多次使用，自动去重）'
)

args = parser.parse_args()
```

## 高级功能

### 从文件读取参数

使用 `fromfile_prefix_chars` 从文件读取参数：

```python
import argparse

parser = argparse.ArgumentParser(
    fromfile_prefix_chars='@'
)
parser.add_argument('--host')
parser.add_argument('--port', type=int)
parser.add_argument('--user')

args = parser.parse_args()
```

创建参数文件 `config.txt`：

```
--host
localhost
--port
8080
--user
admin
```

使用：

```bash
$ python app.py @config.txt
# 等同于：python app.py --host localhost --port 8080 --user admin
```

### 参数缩写

默认情况下，argparse 支持参数缩写：

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--verbose')
parser.add_argument('--version')

# --verb 可以匹配 --verbose（如果无歧义）
args = parser.parse_args(['--verb', 'yes'])
```

禁用缩写：

```python
parser = argparse.ArgumentParser(allow_abbrev=False)
```

### 参数前缀

自定义参数前缀字符：

```python
import argparse

# Windows 风格的参数（使用 / 作为前缀）
parser = argparse.ArgumentParser(prefix_chars='/')
parser.add_argument('/v', '/verbose', action='store_true')
parser.add_argument('/output', '/o')

args = parser.parse_args(['/v', '/o', 'result.txt'])
```

### 父解析器

在多个解析器之间共享参数定义：

```python
import argparse

# 创建共享参数的父解析器
parent_parser = argparse.ArgumentParser(add_help=False)
parent_parser.add_argument('--verbose', '-v', action='store_true')
parent_parser.add_argument('--config', '-c', default='config.yaml')

# 子解析器继承父解析器的参数
parser_a = argparse.ArgumentParser(parents=[parent_parser])
parser_a.add_argument('--host')

parser_b = argparse.ArgumentParser(parents=[parent_parser])
parser_b.add_argument('--port', type=int)

# 两个解析器都有 --verbose 和 --config
```

### 解析已知参数

当你需要只解析部分参数，忽略未知参数时：

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--known', action='store_true')

# parse_known_args 返回 (已知参数, 未知参数列表)
args, unknown = parser.parse_known_args(['--known', '--unknown', 'value'])

print(args)     # Namespace(known=True)
print(unknown)  # ['--unknown', 'value']
```

### 解析间歇模式

使用 `REMAINDER` 收集剩余参数（常用于包装其他命令）：

```python
import argparse
import subprocess

parser = argparse.ArgumentParser(description='命令包装器')
parser.add_argument('--dry-run', action='store_true', help='只打印命令，不执行')
parser.add_argument('command', help='要执行的命令')
parser.add_argument('args', nargs=argparse.REMAINDER, help='命令参数')

args = parser.parse_args()

if args.dry_run:
    print(f'将执行: {args.command} {" ".join(args.args)}')
else:
    subprocess.run([args.command] + args.args)
```

```bash
$ python wrapper.py --dry-run ls -la /tmp
将执行: ls -la /tmp
```

## 错误处理

### 自定义错误消息

```python
import argparse
import sys

class CustomArgumentParser(argparse.ArgumentParser):
    def error(self, message):
        """自定义错误处理"""
        sys.stderr.write(f'错误: {message}\n')
        sys.stderr.write(f'使用 --help 查看帮助信息\n')
        sys.exit(2)

parser = CustomArgumentParser()
parser.add_argument('--name', required=True)

args = parser.parse_args()
```

### 参数验证

在解析后进行额外验证：

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--start', type=int, required=True)
parser.add_argument('--end', type=int, required=True)

args = parser.parse_args()

# 后验证
if args.start >= args.end:
    parser.error('--start 必须小于 --end')
```

## 实战示例

### 示例 1：文件转换工具

```python
#!/usr/bin/env python3
"""文件格式转换工具"""

import argparse
import json
import csv
import sys
from pathlib import Path

def json_to_csv(input_file, output_file):
    """JSON 转 CSV"""
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        return

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

def csv_to_json(input_file, output_file):
    """CSV 转 JSON"""
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    parser = argparse.ArgumentParser(
        description='文件格式转换工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  %(prog)s input.json output.csv         # JSON 转 CSV
  %(prog)s input.csv output.json         # CSV 转 JSON
  %(prog)s -f json input.csv output.json # 强制指定输出格式
        '''
    )

    parser.add_argument('input', help='输入文件')
    parser.add_argument('output', help='输出文件')
    parser.add_argument(
        '-f', '--format',
        choices=['json', 'csv'],
        help='强制指定输出格式（默认根据扩展名推断）'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='显示详细信息'
    )
    parser.add_argument(
        '--version',
        action='version',
        version='%(prog)s 1.0.0'
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        parser.error(f'输入文件不存在: {args.input}')

    # 确定输出格式
    if args.format:
        output_format = args.format
    else:
        output_format = output_path.suffix.lstrip('.')

    if args.verbose:
        print(f'输入文件: {input_path}')
        print(f'输出文件: {output_path}')
        print(f'输出格式: {output_format}')

    # 执行转换
    try:
        if output_format == 'csv':
            json_to_csv(input_path, output_path)
        elif output_format == 'json':
            csv_to_json(input_path, output_path)
        else:
            parser.error(f'不支持的输出格式: {output_format}')

        if args.verbose:
            print('转换完成！')

    except Exception as e:
        print(f'转换失败: {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

### 示例 2：数据库管理工具

```python
#!/usr/bin/env python3
"""数据库管理命令行工具"""

import argparse
import sys

def cmd_connect(args):
    """连接数据库"""
    print(f'连接到 {args.user}@{args.host}:{args.port}/{args.database}')

def cmd_backup(args):
    """备份数据库"""
    output = args.output or f'{args.database}_backup.sql'
    print(f'备份数据库 {args.database} 到 {output}')
    if args.compress:
        print('启用压缩')

def cmd_restore(args):
    """恢复数据库"""
    print(f'从 {args.file} 恢复到 {args.database}')
    if args.force:
        print('强制模式：覆盖现有数据')

def cmd_migrate(args):
    """执行迁移"""
    if args.rollback:
        print(f'回滚最近 {args.rollback} 次迁移')
    else:
        print('执行数据库迁移')
    if args.dry_run:
        print('（试运行模式）')

def main():
    # 主解析器
    parser = argparse.ArgumentParser(
        prog='dbctl',
        description='数据库管理工具'
    )
    parser.add_argument('--version', action='version', version='%(prog)s 2.0.0')

    # 全局参数
    parser.add_argument(
        '-H', '--host',
        default='localhost',
        help='数据库主机 (默认: localhost)'
    )
    parser.add_argument(
        '-P', '--port',
        type=int,
        default=5432,
        help='数据库端口 (默认: 5432)'
    )
    parser.add_argument(
        '-u', '--user',
        default='postgres',
        help='数据库用户 (默认: postgres)'
    )
    parser.add_argument(
        '-d', '--database',
        required=True,
        help='数据库名称'
    )

    # 子命令
    subparsers = parser.add_subparsers(
        title='命令',
        dest='command',
        required=True
    )

    # connect 命令
    connect_parser = subparsers.add_parser('connect', help='连接数据库')
    connect_parser.set_defaults(func=cmd_connect)

    # backup 命令
    backup_parser = subparsers.add_parser('backup', help='备份数据库')
    backup_parser.add_argument('-o', '--output', help='输出文件名')
    backup_parser.add_argument('-z', '--compress', action='store_true', help='压缩备份')
    backup_parser.set_defaults(func=cmd_backup)

    # restore 命令
    restore_parser = subparsers.add_parser('restore', help='恢复数据库')
    restore_parser.add_argument('file', help='备份文件')
    restore_parser.add_argument('--force', action='store_true', help='强制覆盖')
    restore_parser.set_defaults(func=cmd_restore)

    # migrate 命令
    migrate_parser = subparsers.add_parser('migrate', help='执行迁移')
    migrate_group = migrate_parser.add_mutually_exclusive_group()
    migrate_group.add_argument('--rollback', type=int, metavar='N', help='回滚 N 次迁移')
    migrate_group.add_argument('--dry-run', action='store_true', help='试运行')
    migrate_parser.set_defaults(func=cmd_migrate)

    args = parser.parse_args()
    args.func(args)

if __name__ == '__main__':
    main()
```

运行示例：

```bash
$ dbctl -d mydb connect
连接到 postgres@localhost:5432/mydb

$ dbctl -d mydb backup -o backup.sql -z
备份数据库 mydb 到 backup.sql
启用压缩

$ dbctl -d mydb restore backup.sql --force
从 backup.sql 恢复到 mydb
强制模式：覆盖现有数据

$ dbctl -d mydb migrate --dry-run
执行数据库迁移
（试运行模式）
```

### 示例 3：日志分析工具

```python
#!/usr/bin/env python3
"""日志分析工具"""

import argparse
import re
from datetime import datetime
from collections import Counter
from pathlib import Path

def parse_log_line(line, pattern):
    """解析日志行"""
    match = re.match(pattern, line)
    if match:
        return match.groupdict()
    return None

def analyze_logs(args):
    """分析日志文件"""
    # 默认日志模式
    patterns = {
        'apache': r'(?P<ip>\S+) .* \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<url>\S+) \S+" (?P<status>\d+)',
        'nginx': r'(?P<ip>\S+) .* \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<url>\S+) \S+" (?P<status>\d+)',
        'custom': args.pattern or r'.*'
    }

    pattern = patterns.get(args.format, patterns['custom'])

    # 统计数据
    status_counter = Counter()
    ip_counter = Counter()
    url_counter = Counter()
    total_lines = 0
    parsed_lines = 0

    for log_file in args.files:
        path = Path(log_file)
        if not path.exists():
            print(f'警告: 文件不存在 {log_file}')
            continue

        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                total_lines += 1
                data = parse_log_line(line.strip(), pattern)
                if data:
                    parsed_lines += 1
                    if 'status' in data:
                        status_counter[data['status']] += 1
                    if 'ip' in data:
                        ip_counter[data['ip']] += 1
                    if 'url' in data:
                        url_counter[data['url']] += 1

    # 输出结果
    print(f'\n日志分析报告')
    print('=' * 50)
    print(f'总行数: {total_lines}')
    print(f'解析成功: {parsed_lines}')
    print(f'解析率: {parsed_lines/total_lines*100:.1f}%' if total_lines else '无数据')

    if args.show_status:
        print(f'\n状态码统计 (Top {args.top}):')
        for status, count in status_counter.most_common(args.top):
            print(f'  {status}: {count}')

    if args.show_ip:
        print(f'\nIP 访问统计 (Top {args.top}):')
        for ip, count in ip_counter.most_common(args.top):
            print(f'  {ip}: {count}')

    if args.show_url:
        print(f'\nURL 访问统计 (Top {args.top}):')
        for url, count in url_counter.most_common(args.top):
            print(f'  {url}: {count}')

def main():
    parser = argparse.ArgumentParser(
        description='日志分析工具',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    # 输入文件
    parser.add_argument(
        'files',
        nargs='+',
        help='日志文件路径'
    )

    # 日志格式
    parser.add_argument(
        '-f', '--format',
        choices=['apache', 'nginx', 'custom'],
        default='apache',
        help='日志格式'
    )

    parser.add_argument(
        '-p', '--pattern',
        help='自定义正则表达式（用于 custom 格式）'
    )

    # 输出选项
    output_group = parser.add_argument_group('输出选项')
    output_group.add_argument(
        '--show-status',
        action='store_true',
        help='显示状态码统计'
    )
    output_group.add_argument(
        '--show-ip',
        action='store_true',
        help='显示 IP 统计'
    )
    output_group.add_argument(
        '--show-url',
        action='store_true',
        help='显示 URL 统计'
    )
    output_group.add_argument(
        '-a', '--all',
        action='store_true',
        help='显示所有统计'
    )
    output_group.add_argument(
        '-n', '--top',
        type=int,
        default=10,
        help='显示前 N 项'
    )

    args = parser.parse_args()

    # 处理 --all 选项
    if args.all:
        args.show_status = True
        args.show_ip = True
        args.show_url = True

    # 如果没有指定任何输出，默认显示全部
    if not (args.show_status or args.show_ip or args.show_url):
        args.show_status = True
        args.show_ip = True
        args.show_url = True

    analyze_logs(args)

if __name__ == '__main__':
    main()
```

## 与其他库配合

### 与 logging 配合

```python
import argparse
import logging

def setup_logging(verbosity):
    """根据 verbosity 设置日志级别"""
    levels = {
        0: logging.WARNING,
        1: logging.INFO,
        2: logging.DEBUG
    }
    level = levels.get(verbosity, logging.DEBUG)
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

parser = argparse.ArgumentParser()
parser.add_argument(
    '-v', '--verbose',
    action='count',
    default=0,
    help='增加输出详细程度 (-v, -vv)'
)

args = parser.parse_args()
setup_logging(args.verbose)

logging.debug('调试信息')
logging.info('普通信息')
logging.warning('警告信息')
```

### 与环境变量配合

```python
import argparse
import os

def env_or_default(env_var, default):
    """优先使用环境变量"""
    return os.getenv(env_var, default)

parser = argparse.ArgumentParser()
parser.add_argument(
    '--api-key',
    default=env_or_default('API_KEY', None),
    help='API 密钥 (也可通过 API_KEY 环境变量设置)'
)
parser.add_argument(
    '--host',
    default=env_or_default('APP_HOST', 'localhost'),
    help='主机地址 (默认: APP_HOST 环境变量或 localhost)'
)

args = parser.parse_args()
```

### 与配置文件配合

```python
import argparse
import json
from pathlib import Path

def load_config(config_file):
    """加载配置文件"""
    path = Path(config_file)
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return {}

parser = argparse.ArgumentParser()
parser.add_argument('--config', default='config.json', help='配置文件')
parser.add_argument('--host', help='主机地址')
parser.add_argument('--port', type=int, help='端口')

# 第一次解析获取配置文件路径
args, remaining = parser.parse_known_args()

# 加载配置文件
config = load_config(args.config)

# 设置默认值并重新解析
parser.set_defaults(**config)
args = parser.parse_args()

print(f'Host: {args.host}')
print(f'Port: {args.port}')
```

## 最佳实践

### 提供有意义的帮助信息

```python
import argparse

parser = argparse.ArgumentParser(
    description='一个数据处理工具',
    epilog='更多信息请访问: https://example.com/docs'
)

# 好的帮助信息
parser.add_argument(
    '--batch-size',
    type=int,
    default=100,
    metavar='N',
    help='每批处理的记录数 (默认: %(default)s)'
)

# 不好的帮助信息
parser.add_argument('--bs', type=int, default=100)  # 缺少帮助信息
```

### 使用合适的参数命名

```python
# 推荐：使用有意义的长选项名
parser.add_argument('--output-file', help='输出文件路径')
parser.add_argument('--max-retries', type=int, help='最大重试次数')

# 提供短选项作为便捷方式
parser.add_argument('-o', '--output', help='输出文件')
parser.add_argument('-n', '--number', type=int, help='数量')
```

### 合理使用默认值

```python
import argparse
import os

parser = argparse.ArgumentParser()

# 使用常量默认值
parser.add_argument('--timeout', type=int, default=30)

# 使用环境变量
parser.add_argument('--api-url', default=os.getenv('API_URL', 'https://api.example.com'))

# 不要使用可变对象作为默认值
parser.add_argument('--items', nargs='*', default=None)  # 好
# parser.add_argument('--items', nargs='*', default=[])  # 避免
```

### 验证参数组合

```python
import argparse
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--output')
parser.add_argument('--in-place', action='store_true')

args = parser.parse_args()

# 验证参数组合
if args.in_place and args.output:
    parser.error('--in-place 和 --output 不能同时使用')

if not args.in_place and not args.output:
    parser.error('必须指定 --output 或使用 --in-place')
```

### 结构化复杂工具

```python
# commands/base.py
class BaseCommand:
    name = None
    help = None

    def add_arguments(self, parser):
        pass

    def run(self, args):
        raise NotImplementedError

# commands/process.py
from .base import BaseCommand

class ProcessCommand(BaseCommand):
    name = 'process'
    help = '处理数据'

    def add_arguments(self, parser):
        parser.add_argument('input', help='输入文件')
        parser.add_argument('--format', choices=['json', 'csv'])

    def run(self, args):
        print(f'处理 {args.input}')

# main.py
import argparse
from commands.process import ProcessCommand

def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='command')

    commands = [ProcessCommand()]

    for cmd in commands:
        cmd_parser = subparsers.add_parser(cmd.name, help=cmd.help)
        cmd.add_arguments(cmd_parser)
        cmd_parser.set_defaults(cmd_obj=cmd)

    args = parser.parse_args()

    if hasattr(args, 'cmd_obj'):
        args.cmd_obj.run(args)

if __name__ == '__main__':
    main()
```

## 常见问题

### 问题 1：如何处理布尔参数？

```python
import argparse

parser = argparse.ArgumentParser()

# 方式 1：store_true/store_false
parser.add_argument('--verbose', action='store_true')
parser.add_argument('--no-cache', action='store_false', dest='cache')

# 方式 2：互斥组
feature_group = parser.add_mutually_exclusive_group()
feature_group.add_argument('--enable-feature', action='store_true', dest='feature')
feature_group.add_argument('--disable-feature', action='store_false', dest='feature')
parser.set_defaults(feature=True)

# 方式 3：BooleanOptionalAction（Python 3.9+）
parser.add_argument('--debug', action=argparse.BooleanOptionalAction)
# 自动支持 --debug 和 --no-debug
```

### 问题 2：如何接受密码而不在命令行显示？

```python
import argparse
import getpass

parser = argparse.ArgumentParser()
parser.add_argument('--password', help='密码（交互式输入）')

args = parser.parse_args()

if not args.password:
    args.password = getpass.getpass('请输入密码: ')
```

### 问题 3：如何支持配置文件和命令行参数？

```python
import argparse
import configparser

# 创建配置解析器
config = configparser.ConfigParser()
config.read('config.ini')

# 从配置文件获取默认值
defaults = dict(config['DEFAULT']) if 'DEFAULT' in config else {}

parser = argparse.ArgumentParser()
parser.set_defaults(**defaults)

parser.add_argument('--host')
parser.add_argument('--port', type=int)

args = parser.parse_args()
# 命令行参数会覆盖配置文件中的值
```

### 问题 4：如何测试 argparse 代码？

```python
import argparse
import unittest
from io import StringIO
import sys

def create_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument('--name', required=True)
    parser.add_argument('--count', type=int, default=1)
    return parser

class TestArgparse(unittest.TestCase):
    def test_required_argument(self):
        parser = create_parser()
        args = parser.parse_args(['--name', 'test'])
        self.assertEqual(args.name, 'test')

    def test_default_value(self):
        parser = create_parser()
        args = parser.parse_args(['--name', 'test'])
        self.assertEqual(args.count, 1)

    def test_missing_required(self):
        parser = create_parser()
        with self.assertRaises(SystemExit):
            parser.parse_args([])

if __name__ == '__main__':
    unittest.main()
```

## 总结

argparse 是 Python 中构建命令行接口的标准工具。通过本文，你学习了：

1. **基础用法**：创建 ArgumentParser，添加位置参数和可选参数
2. **参数配置**：类型转换、选项限制、多值参数、参数动作
3. **组织结构**：参数分组、互斥参数、子命令
4. **高级功能**：自定义动作、从文件读取参数、父解析器
5. **实战技巧**：错误处理、与其他模块配合、最佳实践

掌握 argparse，你就能为 Python 程序创建专业、用户友好的命令行接口。无论是简单的脚本还是复杂的工具，argparse 都能满足你的需求。
