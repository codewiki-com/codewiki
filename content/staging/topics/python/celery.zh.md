---
title: Python Celery 分布式任务队列
description: 学习 Celery 进行异步任务处理和分布式任务调度
track: python
section: concurrency
difficulty: intermediate
tags:
  - Python
  - Celery
  - 任务队列
  - 分布式
status: imported
origin: old/src/content/docs/python/celery.zh.md
divergence: 0.228
issues: []
legacy:
  category: Python
  subcategory: 异步
  order: 40
  lastUpdated: 2026-01-07
---

## 简介

Celery 是一个强大的分布式任务队列系统，用于处理大量消息，同时提供维护这种系统所需的工具。它专注于实时操作，但也支持任务调度。Celery 在 Python Web 开发中被广泛使用，特别适合处理耗时的后台任务。

### 为什么需要任务队列？

在 Web 应用中，某些操作非常耗时：

```python
# 同步处理 - 用户必须等待
def send_welcome_email(user_id):
    user = get_user(user_id)
    email = compose_email(user)
    send_email(email)  # 可能需要 5-10 秒
    log_email_sent(user_id)
    return "邮件已发送"

# 在 Web 请求中调用
@app.route('/register', methods=['POST'])
def register():
    user = create_user(request.form)
    send_welcome_email(user.id)  # 用户需要等待邮件发送完成
    return "注册成功"
```

使用 Celery 可以将这些任务放到后台执行：

```python
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task
def send_welcome_email(user_id):
    user = get_user(user_id)
    email = compose_email(user)
    send_email(email)
    log_email_sent(user_id)
    return "邮件已发送"

# 在 Web 请求中调用
@app.route('/register', methods=['POST'])
def register():
    user = create_user(request.form)
    send_welcome_email.delay(user.id)  # 立即返回，任务在后台执行
    return "注册成功"
```

### Celery 的核心特性

1. **异步任务执行**: 任务在后台 Worker 中执行
2. **分布式处理**: 支持多个 Worker 跨多台机器
3. **任务调度**: 支持定时任务和周期性任务
4. **任务工作流**: 支持任务链、组和编排
5. **结果存储**: 可选的任务结果后端
6. **重试机制**: 自动重试失败的任务
7. **监控工具**: 内置监控和管理工具

## 安装与配置

### 基本安装

```bash
# 安装 Celery
pip install celery

# 安装 Redis 支持（推荐的消息代理）
pip install celery[redis]

# 安装 RabbitMQ 支持
pip install celery[rabbitmq]

# 安装所有可选依赖
pip install celery[redis,rabbitmq,sqlalchemy]
```

### 创建 Celery 应用

```python
# celery_app.py
from celery import Celery

# 创建 Celery 实例
app = Celery(
    'myproject',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1',
    include=['tasks']
)

# 配置选项
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Shanghai',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 任务超时时间（秒）
)

if __name__ == '__main__':
    app.start()
```

### 使用配置文件

```python
# celeryconfig.py
broker_url = 'redis://localhost:6379/0'
result_backend = 'redis://localhost:6379/1'

task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'Asia/Shanghai'
enable_utc = True

# 任务路由
task_routes = {
    'tasks.email.*': {'queue': 'email'},
    'tasks.report.*': {'queue': 'report'},
}

# 任务速率限制
task_annotations = {
    'tasks.send_email': {'rate_limit': '10/m'},
}

# Worker 配置
worker_prefetch_multiplier = 4
worker_concurrency = 8
```

```python
# celery_app.py
from celery import Celery

app = Celery('myproject')
app.config_from_object('celeryconfig')
```

### 使用类进行配置

```python
# config.py
class CeleryConfig:
    broker_url = 'redis://localhost:6379/0'
    result_backend = 'redis://localhost:6379/1'
    task_serializer = 'json'
    result_serializer = 'json'
    accept_content = ['json']
    timezone = 'Asia/Shanghai'
    enable_utc = True

# celery_app.py
from celery import Celery
from config import CeleryConfig

app = Celery('myproject')
app.config_from_object(CeleryConfig)
```

## 消息代理 (Broker)

消息代理是 Celery 的核心组件，负责在客户端和 Worker 之间传递消息。

### Redis 作为 Broker

Redis 是最流行的 Celery Broker 选择，简单易用且性能优秀。

```python
from celery import Celery

# 基本配置
app = Celery('tasks', broker='redis://localhost:6379/0')

# 带密码的配置
app = Celery('tasks', broker='redis://:password@localhost:6379/0')

# 使用 Redis Sentinel（高可用）
app = Celery('tasks')
app.conf.broker_url = 'sentinel://localhost:26379'
app.conf.broker_transport_options = {
    'master_name': 'mymaster',
    'sentinel_kwargs': {'password': 'sentinel_password'},
}

# Redis 集群配置
app.conf.broker_url = 'redis+cluster://localhost:7000/0'
app.conf.broker_transport_options = {
    'skip_full_coverage_check': True,
}
```

### RabbitMQ 作为 Broker

RabbitMQ 是一个功能丰富的消息代理，提供更强的消息持久性和路由功能。

```python
from celery import Celery

# 基本配置
app = Celery('tasks', broker='amqp://guest:guest@localhost:5672//')

# 带虚拟主机的配置
app = Celery('tasks', broker='amqp://user:password@localhost:5672/myvhost')

# 高级配置
app.conf.broker_url = 'amqp://user:password@localhost:5672/myvhost'
app.conf.broker_connection_retry_on_startup = True
app.conf.broker_heartbeat = 10
app.conf.broker_pool_limit = 10
```

### Broker 对比

| 特性 | Redis | RabbitMQ |
|------|-------|----------|
| 设置难度 | 简单 | 中等 |
| 性能 | 非常高 | 高 |
| 消息持久性 | 需配置 | 默认支持 |
| 消息路由 | 基本 | 高级 |
| 监控工具 | 有限 | 丰富 |
| 集群支持 | Redis Cluster | 原生支持 |
| 内存使用 | 较低 | 较高 |

## 结果后端 (Result Backend)

结果后端用于存储任务执行结果。

### Redis 后端

```python
from celery import Celery

app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

# 配置结果过期时间
app.conf.result_expires = 3600  # 结果保存 1 小时
```

### 数据库后端（SQLAlchemy）

```python
from celery import Celery

app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='db+postgresql://user:password@localhost/celery_results'
)

# 支持的数据库
# SQLite: db+sqlite:///results.sqlite
# PostgreSQL: db+postgresql://user:password@localhost/dbname
# MySQL: db+mysql://user:password@localhost/dbname
```

### 自定义结果序列化

```python
from celery import Celery

app = Celery('tasks')

# 推荐：使用 JSON 序列化（安全且高效）
app.conf.result_serializer = 'json'
app.conf.accept_content = ['json']

# 自定义序列化器（使用 msgpack）
from kombu.serialization import register
import msgpack

def msgpack_encoder(obj):
    return msgpack.packb(obj, use_bin_type=True)

def msgpack_decoder(data):
    return msgpack.unpackb(data, raw=False)

register(
    'msgpack',
    msgpack_encoder,
    msgpack_decoder,
    content_type='application/x-msgpack',
    content_encoding='binary'
)

app.conf.result_serializer = 'msgpack'
app.conf.accept_content = ['msgpack', 'json']
```

## 定义和调用任务

### 基本任务定义

```python
# tasks.py
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task
def add(x, y):
    """简单的加法任务"""
    return x + y

@app.task
def multiply(x, y):
    """乘法任务"""
    return x * y

@app.task(name='tasks.send_notification')
def send_notification(user_id, message):
    """发送通知任务"""
    # 发送通知逻辑
    print(f"发送通知给用户 {user_id}: {message}")
    return True
```

### 调用任务

```python
from tasks import add, send_notification

# 方式 1: delay() - 最简单的方式
result = add.delay(4, 6)

# 方式 2: apply_async() - 更多选项
result = add.apply_async(args=[4, 6])

# 带选项的调用
result = add.apply_async(
    args=[4, 6],
    countdown=10,  # 10 秒后执行
    expires=60,    # 60 秒后过期
    retry=True,
    retry_policy={
        'max_retries': 3,
        'interval_start': 0,
        'interval_step': 0.2,
        'interval_max': 0.5,
    }
)

# 指定队列
result = send_notification.apply_async(
    args=[123, "你好"],
    queue='notifications'
)

# 指定执行时间
from datetime import datetime, timedelta

# 在特定时间执行
eta = datetime(2026, 1, 8, 10, 0, 0)
result = add.apply_async(args=[4, 6], eta=eta)

# 倒计时执行
result = add.apply_async(args=[4, 6], countdown=60)
```

### 获取任务结果

```python
from tasks import add

# 发送任务
result = add.delay(4, 6)

# 检查任务状态
print(result.state)  # PENDING, STARTED, SUCCESS, FAILURE, RETRY

# 检查是否完成
if result.ready():
    print("任务已完成")

# 检查是否成功
if result.successful():
    print("任务成功")

# 获取结果（阻塞等待）
value = result.get()  # 返回 10

# 带超时的等待
try:
    value = result.get(timeout=5)
except TimeoutError:
    print("任务超时")

# 禁用传播异常
value = result.get(propagate=False)
if result.failed():
    print(f"任务失败: {result.result}")

# 获取任务 ID
task_id = result.id

# 通过 ID 获取结果
from celery.result import AsyncResult
result = AsyncResult(task_id)
```

### 任务选项

```python
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task(
    bind=True,                    # 第一个参数是 self
    name='tasks.process_data',    # 自定义任务名
    max_retries=3,                # 最大重试次数
    default_retry_delay=60,       # 默认重试延迟（秒）
    autoretry_for=(Exception,),   # 自动重试的异常
    retry_backoff=True,           # 指数退避
    retry_backoff_max=600,        # 最大退避时间
    retry_jitter=True,            # 添加随机抖动
    rate_limit='10/m',            # 速率限制
    time_limit=300,               # 硬时间限制（秒）
    soft_time_limit=240,          # 软时间限制（秒）
    ignore_result=False,          # 是否存储结果
    acks_late=True,               # 任务完成后确认
    reject_on_worker_lost=True,   # Worker 丢失时拒绝任务
    track_started=True,           # 追踪任务开始状态
)
def process_data(self, data):
    """处理数据的任务"""
    try:
        # 处理逻辑
        result = do_processing(data)
        return result
    except TemporaryError as exc:
        # 手动重试
        raise self.retry(exc=exc, countdown=60)
```

### 绑定任务（访问 self）

```python
from celery import Celery
from celery.exceptions import MaxRetriesExceededError

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task(bind=True)
def send_email(self, to, subject, body):
    """发送邮件任务"""
    try:
        # 发送邮件
        smtp_send(to, subject, body)
        return True
    except SMTPError as exc:
        # 使用指数退避重试
        try:
            self.retry(exc=exc, countdown=2 ** self.request.retries)
        except MaxRetriesExceededError:
            # 记录失败
            log_email_failure(to, subject)
            raise

@app.task(bind=True)
def debug_task(self):
    """调试任务 - 打印请求信息"""
    print(f'任务 ID: {self.request.id}')
    print(f'任务参数: {self.request.args}')
    print(f'任务名称: {self.name}')
    print(f'重试次数: {self.request.retries}')
    print(f'交付信息: {self.request.delivery_info}')
```

## 任务工作流

Celery 提供了强大的任务编排功能，用于构建复杂的工作流。

### Chain（任务链）

任务链按顺序执行任务，每个任务的结果传递给下一个。

```python
from celery import chain
from tasks import add, multiply

# 创建任务链: (2 + 2) * 4 = 16
workflow = chain(add.s(2, 2), multiply.s(4))
result = workflow.delay()
print(result.get())  # 16

# 使用 | 操作符（更直观）
workflow = add.s(2, 2) | multiply.s(4) | add.s(10)
result = workflow.delay()
print(result.get())  # 26

# 不可变签名（不接收前一个任务的结果）
workflow = add.si(2, 2) | multiply.si(3, 4)
result = workflow.delay()
# 第二个任务不会接收第一个任务的结果
```

### Group（任务组）

任务组并行执行多个任务。

```python
from celery import group
from tasks import add

# 创建任务组 - 并行执行
job = group([
    add.s(2, 2),
    add.s(4, 4),
    add.s(8, 8),
    add.s(16, 16),
])

result = job.delay()

# 获取所有结果
print(result.get())  # [4, 8, 16, 32]

# 检查完成状态
print(result.ready())      # True/False
print(result.successful()) # True/False
print(result.completed_count())  # 已完成数量

# 遍历结果
for r in result:
    print(r.get())
```

### Chord（任务和弦）

Chord 是一个带回调的任务组，所有任务完成后执行回调。

```python
from celery import chord
from tasks import add, multiply

# 定义汇总任务
@app.task
def tsum(numbers):
    return sum(numbers)

# 创建 chord: 先并行执行 add，然后汇总
callback = tsum.s()
header = [add.s(i, i) for i in range(10)]

result = chord(header)(callback)
print(result.get())  # 0+2+4+6+8+10+12+14+16+18 = 90

# 简写形式
result = chord([add.s(i, i) for i in range(10)])(tsum.s())
```

### 复杂工作流示例

```python
from celery import chain, group, chord
from tasks import fetch_data, process_data, aggregate, notify

# 场景：数据处理管道
# 从多个源获取数据（并行）
# 处理每个数据源的数据（并行）
# 汇总结果
# 发送通知

data_sources = ['source_a', 'source_b', 'source_c']

# 构建工作流
workflow = chain(
    # 步骤 1: 并行获取数据
    group([fetch_data.s(source) for source in data_sources]),
    # 步骤 2: 处理数据（会接收上一步的结果列表）
    process_all_data.s(),
    # 步骤 3: 汇总
    aggregate.s(),
    # 步骤 4: 通知
    notify.s('admin@example.com')
)

result = workflow.delay()
```

### Map 和 Starmap

```python
from celery import group
from tasks import add

# map: 对每个元素应用任务
items = [1, 2, 3, 4, 5]
result = add.map([(i, i) for i in items]).delay()
print(result.get())  # [2, 4, 6, 8, 10]

# starmap: 展开参数
result = add.starmap([(1, 1), (2, 2), (3, 3)]).delay()
print(result.get())  # [2, 4, 6]

# chunks: 分块处理大量任务
result = add.chunks([(i, i) for i in range(100)], 10).delay()
# 将 100 个任务分成 10 个一组执行
```

## 任务调度

Celery 支持使用 Celery Beat 调度周期性任务。

### 配置定时任务

```python
# celeryconfig.py
from celery.schedules import crontab
from datetime import timedelta

# 定时任务配置
beat_schedule = {
    # 每 30 秒执行一次
    'add-every-30-seconds': {
        'task': 'tasks.add',
        'schedule': 30.0,
        'args': (16, 16)
    },

    # 使用 timedelta
    'cleanup-every-hour': {
        'task': 'tasks.cleanup',
        'schedule': timedelta(hours=1),
    },

    # 使用 crontab - 每周一上午 7:30
    'weekly-report': {
        'task': 'tasks.generate_report',
        'schedule': crontab(hour=7, minute=30, day_of_week=1),
        'args': ('weekly',),
    },

    # 每天午夜执行
    'daily-backup': {
        'task': 'tasks.backup_database',
        'schedule': crontab(hour=0, minute=0),
    },

    # 每小时的第 15 分钟
    'hourly-check': {
        'task': 'tasks.health_check',
        'schedule': crontab(minute=15),
    },

    # 每月 1 号上午 8 点
    'monthly-report': {
        'task': 'tasks.monthly_report',
        'schedule': crontab(hour=8, minute=0, day_of_month=1),
    },

    # 工作日（周一到周五）每天上午 9 点
    'weekday-standup': {
        'task': 'tasks.standup_reminder',
        'schedule': crontab(hour=9, minute=0, day_of_week='mon-fri'),
    },
}

# 时区设置
timezone = 'Asia/Shanghai'
```

### Crontab 表达式详解

```python
from celery.schedules import crontab

# crontab 参数
# minute: 分钟 (0-59)
# hour: 小时 (0-23)
# day_of_week: 星期几 (0-6，0=周日，或 mon,tue,wed,thu,fri,sat,sun)
# day_of_month: 月份中的日期 (1-31)
# month_of_year: 月份 (1-12)

# 示例
crontab()                              # 每分钟
crontab(minute=0, hour=0)              # 每天午夜
crontab(minute=0, hour='*/3')          # 每 3 小时
crontab(minute=0, hour='8-17')         # 工作时间每小时
crontab(minute='*/15')                 # 每 15 分钟
crontab(hour=4, minute=30, day_of_week=0)  # 每周日 4:30
crontab(day_of_month='1,15')           # 每月 1 号和 15 号
crontab(month_of_year='1,4,7,10')      # 每季度第一个月
```

### 启动 Celery Beat

```bash
# 启动 Beat 调度器
celery -A celery_app beat

# 启动 Beat 和 Worker（开发环境）
celery -A celery_app worker --beat --loglevel=info

# 使用 PID 文件（生产环境）
celery -A celery_app beat --pidfile=/var/run/celery/beat.pid

# 持久化调度状态到数据库
celery -A celery_app beat --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### 动态任务调度

```python
# 使用 django-celery-beat 实现动态调度
# pip install django-celery-beat

# settings.py
INSTALLED_APPS = [
    ...
    'django_celery_beat',
]

# 使用模型创建定时任务
from django_celery_beat.models import PeriodicTask, IntervalSchedule

# 创建间隔调度
schedule, created = IntervalSchedule.objects.get_or_create(
    every=10,
    period=IntervalSchedule.SECONDS,
)

# 创建周期任务
PeriodicTask.objects.create(
    interval=schedule,
    name='每 10 秒执行',
    task='tasks.add',
    args='[2, 2]',
)

# 创建 crontab 调度
from django_celery_beat.models import CrontabSchedule

crontab_schedule, _ = CrontabSchedule.objects.get_or_create(
    minute='0',
    hour='8',
    day_of_week='*',
    day_of_month='*',
    month_of_year='*',
)

PeriodicTask.objects.create(
    crontab=crontab_schedule,
    name='每天上午 8 点执行',
    task='tasks.daily_task',
)
```

## 错误处理和重试

### 自动重试

```python
from celery import Celery
from celery.exceptions import MaxRetriesExceededError

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task(
    autoretry_for=(ConnectionError, TimeoutError),
    retry_kwargs={'max_retries': 5},
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def fetch_external_data(url):
    """自动重试的任务"""
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()
```

### 手动重试

```python
@app.task(bind=True, max_retries=3)
def send_sms(self, phone, message):
    """手动控制重试逻辑"""
    try:
        result = sms_api.send(phone, message)
        return result
    except RateLimitError:
        # 达到速率限制，等待更长时间
        raise self.retry(countdown=60)
    except TemporaryError as exc:
        # 临时错误，指数退避
        countdown = 2 ** self.request.retries
        raise self.retry(exc=exc, countdown=countdown)
    except PermanentError as exc:
        # 永久错误，不重试
        log_permanent_failure(phone, message, exc)
        raise  # 不调用 retry，直接抛出

@app.task(bind=True)
def reliable_task(self, data):
    """带异常处理的可靠任务"""
    try:
        process(data)
    except MaxRetriesExceededError:
        # 所有重试都失败了
        notify_admin("任务多次重试后失败", data)
        raise
```

### 错误回调

```python
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task
def error_handler(request, exc, traceback):
    """错误处理任务"""
    print(f'任务 {request.id} 失败: {exc}')
    print(f'参数: {request.args}, {request.kwargs}')
    # 发送告警
    send_alert(f"任务失败: {request.id}", str(exc))

@app.task
def success_handler(result):
    """成功处理任务"""
    print(f'任务成功，结果: {result}')

@app.task
def my_task(data):
    # 处理逻辑
    return process(data)

# 使用回调
my_task.apply_async(
    args=[data],
    link=success_handler.s(),        # 成功回调
    link_error=error_handler.s(),    # 失败回调
)
```

### 自定义异常处理

```python
from celery import Task

class CustomTask(Task):
    """自定义任务基类"""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """任务失败时调用"""
        print(f'任务 {task_id} 失败: {exc}')
        super().on_failure(exc, task_id, args, kwargs, einfo)

    def on_success(self, retval, task_id, args, kwargs):
        """任务成功时调用"""
        print(f'任务 {task_id} 成功: {retval}')
        super().on_success(retval, task_id, args, kwargs)

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """任务重试时调用"""
        print(f'任务 {task_id} 重试: {exc}')
        super().on_retry(exc, task_id, args, kwargs, einfo)

@app.task(base=CustomTask)
def my_custom_task(data):
    """使用自定义基类的任务"""
    return process(data)
```

## 监控与管理

### 命令行工具

```bash
# 启动 Worker
celery -A celery_app worker --loglevel=info

# 多个并发进程
celery -A celery_app worker --concurrency=8

# 指定队列
celery -A celery_app worker --queues=default,email,report

# 指定 Worker 名称
celery -A celery_app worker --hostname=worker1@%h

# 查看活跃的 Worker
celery -A celery_app inspect active

# 查看注册的任务
celery -A celery_app inspect registered

# 查看保留的任务
celery -A celery_app inspect reserved

# 查看调度的任务
celery -A celery_app inspect scheduled

# 查看统计信息
celery -A celery_app inspect stats

# 撤销任务
celery -A celery_app control revoke <task_id>

# 清除所有等待的任务
celery -A celery_app purge

# 关闭 Worker
celery -A celery_app control shutdown
```

### Flower 监控工具

Flower 是 Celery 的实时 Web 监控工具。

```bash
# 安装 Flower
pip install flower

# 启动 Flower
celery -A celery_app flower

# 指定端口和地址
celery -A celery_app flower --port=5555 --address=0.0.0.0

# 启用基本认证
celery -A celery_app flower --basic_auth=user:password

# 持久化数据
celery -A celery_app flower --persistent=True --db=flower.db
```

Flower 提供的功能：

1. **实时任务监控**: 查看任务状态、结果、执行时间
2. **Worker 管理**: 查看 Worker 状态、资源使用
3. **任务统计**: 成功率、失败率、平均执行时间
4. **任务操作**: 撤销任务、重试任务
5. **配置查看**: 查看 Celery 配置

### 信号处理

```python
from celery.signals import (
    task_prerun, task_postrun, task_success, task_failure,
    task_retry, task_revoked, worker_ready, worker_shutdown
)

@task_prerun.connect
def task_prerun_handler(sender=None, task_id=None, task=None,
                         args=None, kwargs=None, **kwds):
    """任务开始前"""
    print(f'任务 {task_id} 即将开始')

@task_postrun.connect
def task_postrun_handler(sender=None, task_id=None, task=None,
                          args=None, kwargs=None, retval=None,
                          state=None, **kwds):
    """任务结束后"""
    print(f'任务 {task_id} 已完成，状态: {state}')

@task_success.connect
def task_success_handler(sender=None, result=None, **kwargs):
    """任务成功"""
    print(f'任务成功，结果: {result}')

@task_failure.connect
def task_failure_handler(sender=None, task_id=None, exception=None,
                          traceback=None, **kwargs):
    """任务失败"""
    print(f'任务 {task_id} 失败: {exception}')

@worker_ready.connect
def worker_ready_handler(sender=None, **kwargs):
    """Worker 就绪"""
    print('Worker 已就绪')

@worker_shutdown.connect
def worker_shutdown_handler(sender=None, **kwargs):
    """Worker 关闭"""
    print('Worker 正在关闭')
```

### 日志配置

```python
# celeryconfig.py
import logging

# 日志级别
worker_hijack_root_logger = False
worker_log_format = '[%(asctime)s: %(levelname)s/%(processName)s] %(message)s'
worker_task_log_format = '[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s'

# 自定义日志配置
from celery.signals import setup_logging

@setup_logging.connect
def configure_logging(sender=None, **kwargs):
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] [%(levelname)s] %(message)s',
        handlers=[
            logging.FileHandler('celery.log'),
            logging.StreamHandler()
        ]
    )
```

## 与 Web 框架集成

### Flask 集成

```python
# app.py
from flask import Flask
from celery import Celery

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery

# 创建 Flask 应用
app = Flask(__name__)
app.config.update(
    CELERY_BROKER_URL='redis://localhost:6379/0',
    CELERY_RESULT_BACKEND='redis://localhost:6379/1'
)

celery = make_celery(app)

# 定义任务
@celery.task
def send_async_email(email_data):
    with app.app_context():
        send_email(email_data)

# 路由
@app.route('/send-email', methods=['POST'])
def trigger_email():
    email_data = request.json
    task = send_async_email.delay(email_data)
    return {'task_id': task.id}

@app.route('/task-status/<task_id>')
def get_task_status(task_id):
    task = send_async_email.AsyncResult(task_id)
    return {
        'state': task.state,
        'result': task.result if task.ready() else None
    }
```

### Django 集成

```python
# myproject/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

app = Celery('myproject')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

# myproject/__init__.py
from .celery import app as celery_app

__all__ = ('celery_app',)

# settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/1'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Shanghai'

# myapp/tasks.py
from celery import shared_task

@shared_task
def add(x, y):
    return x + y

@shared_task
def send_notification_email(user_id):
    from django.contrib.auth.models import User
    from django.core.mail import send_mail

    user = User.objects.get(pk=user_id)
    send_mail(
        '欢迎',
        '感谢注册！',
        'from@example.com',
        [user.email],
    )

# myapp/views.py
from django.http import JsonResponse
from .tasks import send_notification_email

def register_user(request):
    # 创建用户
    user = create_user(request.POST)

    # 异步发送邮件
    task = send_notification_email.delay(user.id)

    return JsonResponse({'user_id': user.id, 'task_id': task.id})
```

### FastAPI 集成

```python
# celery_app.py
from celery import Celery

celery_app = Celery(
    'worker',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

# tasks.py
from celery_app import celery_app

@celery_app.task
def process_data(data: dict):
    # 处理数据
    result = heavy_computation(data)
    return result

# main.py
from fastapi import FastAPI, BackgroundTasks
from celery.result import AsyncResult
from tasks import process_data

app = FastAPI()

@app.post('/process')
async def create_task(data: dict):
    task = process_data.delay(data)
    return {'task_id': task.id}

@app.get('/task/{task_id}')
async def get_task_status(task_id: str):
    task = AsyncResult(task_id)
    if task.state == 'PENDING':
        response = {
            'state': task.state,
            'status': '任务等待中...'
        }
    elif task.state == 'FAILURE':
        response = {
            'state': task.state,
            'status': str(task.info)
        }
    else:
        response = {
            'state': task.state,
            'result': task.result
        }
    return response
```

## 生产环境最佳实践

### 项目结构

```
myproject/
├── celery_app.py          # Celery 应用配置
├── celeryconfig.py        # Celery 配置
├── tasks/
│   ├── __init__.py
│   ├── email.py           # 邮件相关任务
│   ├── report.py          # 报告相关任务
│   └── notification.py    # 通知相关任务
├── workers/
│   ├── __init__.py
│   └── base.py            # 基础 Worker 配置
└── scripts/
    ├── start_worker.sh
    └── start_beat.sh
```

### Supervisor 配置

```ini
; /etc/supervisor/conf.d/celery.conf

[program:celery-worker]
command=/path/to/venv/bin/celery -A celery_app worker --loglevel=info --concurrency=4
directory=/path/to/project
user=celery
numprocs=1
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker_error.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600
killasgroup=true
priority=998

[program:celery-beat]
command=/path/to/venv/bin/celery -A celery_app beat --loglevel=info
directory=/path/to/project
user=celery
numprocs=1
stdout_logfile=/var/log/celery/beat.log
stderr_logfile=/var/log/celery/beat_error.log
autostart=true
autorestart=true
startsecs=10
priority=999

[group:celery]
programs=celery-worker,celery-beat
```

### Systemd 配置

```ini
# /etc/systemd/system/celery.service
[Unit]
Description=Celery Service
After=network.target

[Service]
Type=forking
User=celery
Group=celery
EnvironmentFile=/etc/default/celery
WorkingDirectory=/path/to/project
ExecStart=/bin/sh -c '${CELERY_BIN} -A $CELERY_APP multi start $CELERYD_NODES \
    --pidfile=${CELERYD_PID_FILE} --logfile=${CELERYD_LOG_FILE} \
    --loglevel=${CELERYD_LOG_LEVEL} $CELERYD_OPTS'
ExecStop=/bin/sh -c '${CELERY_BIN} multi stopwait $CELERYD_NODES \
    --pidfile=${CELERYD_PID_FILE}'
ExecReload=/bin/sh -c '${CELERY_BIN} -A $CELERY_APP multi restart $CELERYD_NODES \
    --pidfile=${CELERYD_PID_FILE} --logfile=${CELERYD_LOG_FILE} \
    --loglevel=${CELERYD_LOG_LEVEL} $CELERYD_OPTS'
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# /etc/default/celery
CELERYD_NODES="worker1 worker2 worker3"
CELERY_BIN="/path/to/venv/bin/celery"
CELERY_APP="celery_app"
CELERYD_MULTI="multi"
CELERYD_OPTS="--time-limit=300 --concurrency=8"
CELERYD_PID_FILE="/var/run/celery/%n.pid"
CELERYD_LOG_FILE="/var/log/celery/%n%I.log"
CELERYD_LOG_LEVEL="INFO"
```

### Docker 部署

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 默认启动 Worker
CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  celery-worker:
    build: .
    command: celery -A celery_app worker --loglevel=info --concurrency=4
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - redis
    deploy:
      replicas: 2

  celery-beat:
    build: .
    command: celery -A celery_app beat --loglevel=info
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - redis

  flower:
    build: .
    command: celery -A celery_app flower --port=5555
    ports:
      - "5555:5555"
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - redis
      - celery-worker

volumes:
  redis_data:
```

### 性能优化

```python
# celeryconfig.py

# 预取优化
worker_prefetch_multiplier = 4  # 每个 Worker 预取的任务数

# 连接池
broker_pool_limit = 10
result_backend_transport_options = {'max_connections': 20}

# 序列化优化（推荐使用 JSON）
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']

# 结果优化
result_expires = 3600  # 结果过期时间
task_ignore_result = True  # 如果不需要结果，设为 True

# 任务确认
task_acks_late = True  # 任务完成后确认
task_reject_on_worker_lost = True

# 时间限制
task_time_limit = 300  # 硬限制
task_soft_time_limit = 240  # 软限制

# 队列优化
task_default_queue = 'default'
task_queues = {
    'high_priority': {'exchange': 'high_priority'},
    'default': {'exchange': 'default'},
    'low_priority': {'exchange': 'low_priority'},
}

task_routes = {
    'tasks.urgent.*': {'queue': 'high_priority'},
    'tasks.report.*': {'queue': 'low_priority'},
}
```

## 常见问题与解决方案

### 任务卡住不执行

```python
# 检查 Worker 是否运行
# celery -A celery_app inspect active

# 检查任务是否在队列中
# celery -A celery_app inspect reserved

# 可能的原因和解决方案:
# Worker 没有运行 - 启动 Worker
# 队列不匹配 - 确保 Worker 监听正确的队列
# 任务序列化错误 - 检查任务参数是否可序列化

# 强制重新发送任务
from celery.result import AsyncResult
result = AsyncResult('task_id')
if result.state == 'PENDING':
    # 任务可能丢失，重新发送
    my_task.delay(*args)
```

### 内存泄漏

```python
# 配置 Worker 最大任务数后重启
worker_max_tasks_per_child = 1000

# 配置最大内存使用后重启
worker_max_memory_per_child = 200000  # 200MB

# 在任务中显式清理
@app.task
def memory_intensive_task(data):
    try:
        result = process_large_data(data)
        return result
    finally:
        # 清理大对象
        import gc
        gc.collect()
```

### 任务幂等性

```python
from functools import wraps
import hashlib

def idempotent_task(cache_timeout=3600):
    """确保任务幂等的装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 创建任务指纹
            task_key = f"{func.__name__}:{hashlib.md5(str(args).encode() + str(kwargs).encode()).hexdigest()}"

            # 检查是否已执行
            if cache.get(task_key):
                return None  # 已执行，跳过

            try:
                result = func(*args, **kwargs)
                # 标记为已执行
                cache.set(task_key, True, timeout=cache_timeout)
                return result
            except Exception:
                # 失败时不标记，允许重试
                raise

        return wrapper
    return decorator

@app.task
@idempotent_task(cache_timeout=86400)
def process_order(order_id):
    """处理订单（幂等）"""
    order = get_order(order_id)
    if order.status == 'processed':
        return  # 已处理
    # 处理订单...
```

### 任务优先级

```python
# 配置优先级队列
from kombu import Queue

task_queues = [
    Queue('high', routing_key='high'),
    Queue('default', routing_key='default'),
    Queue('low', routing_key='low'),
]

task_routes = {
    'tasks.urgent_task': {'queue': 'high'},
    'tasks.normal_task': {'queue': 'default'},
    'tasks.batch_task': {'queue': 'low'},
}

# 启动不同优先级的 Worker
# celery -A celery_app worker -Q high --concurrency=4
# celery -A celery_app worker -Q default --concurrency=2
# celery -A celery_app worker -Q low --concurrency=1

# 动态指定队列
urgent_task.apply_async(args=[data], queue='high')
```

## 总结

### Celery 的核心优势

1. **简单易用**: 简洁的 API 和装饰器语法
2. **高度可扩展**: 支持水平扩展多个 Worker
3. **灵活的消息代理**: 支持 Redis、RabbitMQ 等
4. **丰富的功能**: 任务调度、工作流、监控
5. **生产就绪**: 大量生产环境验证

### 适用场景

- **异步任务**: 邮件发送、文件处理、报告生成
- **定时任务**: 数据备份、清理任务、定期报告
- **分布式计算**: 数据处理、批量操作
- **工作流编排**: 复杂的多步骤任务

### 最佳实践总结

1. **任务设计**: 保持任务简单、幂等、可重试
2. **错误处理**: 实现适当的重试策略和错误回调
3. **监控**: 使用 Flower 或自定义监控
4. **资源管理**: 配置适当的并发数和内存限制
5. **队列策略**: 根据任务优先级使用不同队列
6. **日志记录**: 详细的日志便于问题排查
7. **测试**: 编写任务的单元测试和集成测试

Celery 是 Python 生态系统中处理异步任务和分布式计算的首选解决方案。掌握 Celery 将显著提升你构建高性能、可扩展应用的能力。
