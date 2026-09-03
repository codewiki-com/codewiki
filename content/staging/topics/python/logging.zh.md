---
title: 日志模块
description: Python logging模块完全指南，日志级别、处理器、格式化器与最佳实践
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - logging
  - 日志
  - 调试
status: imported
origin: old/src/content/docs/python/logging.zh.md
divergence: 0.181
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 18
  lastUpdated: 2026-01-07
---

日志记录是软件开发中不可或缺的一部分。Python 的 `logging` 模块提供了一个灵活、强大的日志系统，能够帮助开发者追踪程序运行状态、调试问题和监控应用程序。

## 为什么使用 logging 模块

很多初学者习惯使用 `print()` 来调试程序，但这种方式存在诸多问题：

- 无法区分消息的重要程度
- 难以控制输出目标（控制台、文件等）
- 生产环境中难以关闭调试信息
- 缺乏时间戳、来源等上下文信息

`logging` 模块解决了这些问题，提供了专业的日志管理能力。

## 基础用法

### 快速开始

```python
import logging

# 最简单的用法
logging.warning('这是一条警告信息')
logging.error('这是一条错误信息')
```

默认情况下，`logging` 模块只会显示 WARNING 及以上级别的日志。

### 基本配置

使用 `basicConfig()` 进行简单配置：

```python
import logging

# 配置日志的基本设置
logging.basicConfig(
    level=logging.DEBUG,  # 设置最低日志级别
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# 现在可以记录所有级别的日志
logging.debug('调试信息')
logging.info('普通信息')
logging.warning('警告信息')
logging.error('错误信息')
logging.critical('严重错误')
```

输出示例：
```
2026-01-07 10:30:45 - root - DEBUG - 调试信息
2026-01-07 10:30:45 - root - INFO - 普通信息
2026-01-07 10:30:45 - root - WARNING - 警告信息
2026-01-07 10:30:45 - root - ERROR - 错误信息
2026-01-07 10:30:45 - root - CRITICAL - 严重错误
```

## 日志级别

Python `logging` 模块定义了六个标准日志级别，按严重程度从低到高排列：

| 级别 | 数值 | 说明 |
|------|------|------|
| NOTSET | 0 | 未设置 |
| DEBUG | 10 | 调试信息，用于开发阶段 |
| INFO | 20 | 确认程序按预期运行 |
| WARNING | 30 | 表示可能出现问题 |
| ERROR | 40 | 由于严重问题，程序某些功能无法执行 |
| CRITICAL | 50 | 严重错误，程序可能无法继续运行 |

### 选择合适的日志级别

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def process_data(data):
    logger.debug(f'开始处理数据: {data}')  # 详细的调试信息

    if not data:
        logger.warning('接收到空数据')  # 潜在问题
        return None

    try:
        result = data['value'] * 2
        logger.info(f'数据处理成功，结果: {result}')  # 正常流程
        return result
    except KeyError:
        logger.error('数据格式错误，缺少 value 字段')  # 可恢复的错误
        return None
    except Exception as e:
        logger.critical(f'处理数据时发生严重错误: {e}')  # 严重问题
        raise
```

## Logger 对象

### 创建 Logger

推荐使用 `__name__` 作为 logger 名称，这样可以清楚地知道日志来自哪个模块：

```python
import logging

# 创建一个以模块名命名的 logger
logger = logging.getLogger(__name__)

# 设置日志级别
logger.setLevel(logging.DEBUG)

logger.info('使用自定义 logger 记录日志')
```

### Logger 层级结构

Logger 采用层级命名方式，类似于 Python 的包结构：

```python
import logging

# 父 logger
parent_logger = logging.getLogger('myapp')
parent_logger.setLevel(logging.WARNING)

# 子 logger（继承父 logger 的设置）
child_logger = logging.getLogger('myapp.module1')

# 孙 logger
grandchild_logger = logging.getLogger('myapp.module1.submodule')

# 子 logger 会向上传播日志消息
```

### 禁止日志传播

```python
import logging

logger = logging.getLogger('myapp.module')
logger.propagate = False  # 不向父 logger 传播
```

## 处理器（Handler）

Handler 决定日志消息的输出目标。Python 提供了多种内置 Handler。

### StreamHandler - 控制台输出

```python
import logging
import sys

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# 创建控制台处理器
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)

# 添加到 logger
logger.addHandler(console_handler)

logger.info('这条消息会输出到控制台')
```

### FileHandler - 文件输出

```python
import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# 创建文件处理器
file_handler = logging.FileHandler(
    'app.log',
    mode='a',  # 追加模式
    encoding='utf-8'
)
file_handler.setLevel(logging.DEBUG)

logger.addHandler(file_handler)

logger.debug('这条消息会写入文件')
```

### 多个 Handler 组合使用

```python
import logging
import sys

def setup_logger(name, log_file, level=logging.INFO):
    """配置一个同时输出到控制台和文件的 logger"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # 文件处理器 - 记录所有级别
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)

    # 控制台处理器 - 只记录 INFO 及以上
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # 设置格式
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # 添加处理器
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

# 使用
logger = setup_logger('myapp', 'application.log')
logger.debug('只会出现在文件中')
logger.info('会同时出现在控制台和文件中')
```

## 格式化器（Formatter）

Formatter 定义日志消息的输出格式。

### 格式化字符串属性

常用的格式化属性：

| 属性 | 格式 | 说明 |
|------|------|------|
| asctime | %(asctime)s | 日志创建时间 |
| name | %(name)s | Logger 名称 |
| levelname | %(levelname)s | 日志级别名称 |
| message | %(message)s | 日志消息 |
| filename | %(filename)s | 源文件名 |
| funcName | %(funcName)s | 函数名 |
| lineno | %(lineno)d | 行号 |
| pathname | %(pathname)s | 完整路径 |
| module | %(module)s | 模块名 |
| process | %(process)d | 进程 ID |
| thread | %(thread)d | 线程 ID |
| threadName | %(threadName)s | 线程名称 |

### 自定义格式

```python
import logging

# 简单格式
simple_formatter = logging.Formatter('%(levelname)s - %(message)s')

# 详细格式
detailed_formatter = logging.Formatter(
    '%(asctime)s | %(name)s | %(levelname)-8s | '
    '%(filename)s:%(lineno)d | %(funcName)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# JSON 格式（适合日志收集系统）
import json
from datetime import datetime

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        if record.exc_info:
            log_record['exception'] = self.formatException(record.exc_info)
        return json.dumps(log_record, ensure_ascii=False)

# 使用 JSON 格式
handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
```

## 过滤器（Filter）

Filter 提供更细粒度的日志过滤控制。

### 基本过滤器

```python
import logging

class LevelFilter(logging.Filter):
    """只允许特定级别的日志通过"""

    def __init__(self, level):
        super().__init__()
        self.level = level

    def filter(self, record):
        return record.levelno == self.level

# 使用
logger = logging.getLogger('myapp')
handler = logging.StreamHandler()

# 添加过滤器，只允许 WARNING 级别
handler.addFilter(LevelFilter(logging.WARNING))
logger.addHandler(handler)
```

### 上下文过滤器

```python
import logging

class ContextFilter(logging.Filter):
    """添加额外的上下文信息"""

    def __init__(self, user_id=None):
        super().__init__()
        self.user_id = user_id

    def filter(self, record):
        record.user_id = self.user_id or 'anonymous'
        return True

# 使用
logger = logging.getLogger('myapp')
logger.addFilter(ContextFilter(user_id='user123'))

formatter = logging.Formatter(
    '%(asctime)s - %(user_id)s - %(levelname)s - %(message)s'
)
```

### 关键词过滤器

```python
import logging

class KeywordFilter(logging.Filter):
    """过滤包含敏感关键词的日志"""

    def __init__(self, keywords):
        super().__init__()
        self.keywords = keywords

    def filter(self, record):
        message = record.getMessage().lower()
        return not any(kw.lower() in message for kw in self.keywords)

# 过滤掉包含密码信息的日志
sensitive_filter = KeywordFilter(['password', 'secret', 'token'])
logger.addFilter(sensitive_filter)
```

## 日志轮转

### RotatingFileHandler - 按大小轮转

```python
import logging
from logging.handlers import RotatingFileHandler

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# 创建按大小轮转的处理器
# 每个文件最大 5MB，保留 3 个备份
rotating_handler = RotatingFileHandler(
    'app.log',
    maxBytes=5 * 1024 * 1024,  # 5MB
    backupCount=3,
    encoding='utf-8'
)

formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
)
rotating_handler.setFormatter(formatter)

logger.addHandler(rotating_handler)

# 文件会自动轮转：app.log -> app.log.1 -> app.log.2 -> app.log.3
```

### TimedRotatingFileHandler - 按时间轮转

```python
import logging
from logging.handlers import TimedRotatingFileHandler

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# 创建按时间轮转的处理器
# 每天午夜轮转，保留 7 天的日志
timed_handler = TimedRotatingFileHandler(
    'app.log',
    when='midnight',  # 轮转时机
    interval=1,       # 间隔
    backupCount=7,    # 保留数量
    encoding='utf-8'
)

# when 参数选项：
# 'S' - 秒
# 'M' - 分钟
# 'H' - 小时
# 'D' - 天
# 'midnight' - 每天午夜
# 'W0'-'W6' - 每周几（0=周一）

timed_handler.suffix = '%Y-%m-%d'  # 备份文件后缀格式

formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
)
timed_handler.setFormatter(formatter)

logger.addHandler(timed_handler)
```

## 配置方式

### 使用字典配置

```python
import logging
import logging.config

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,

    'formatters': {
        'standard': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'detailed': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - '
                     '%(filename)s:%(lineno)d - %(message)s'
        }
    },

    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'DEBUG',
            'formatter': 'detailed',
            'filename': 'app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'encoding': 'utf-8'
        },
        'error_file': {
            'class': 'logging.FileHandler',
            'level': 'ERROR',
            'formatter': 'detailed',
            'filename': 'error.log',
            'encoding': 'utf-8'
        }
    },

    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True
        },
        'myapp': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False
        },
        'myapp.database': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False
        }
    }
}

# 应用配置
logging.config.dictConfig(LOGGING_CONFIG)

# 使用
logger = logging.getLogger('myapp')
logger.info('应用程序启动')
```

### 使用配置文件

创建 `logging.ini` 文件：

```ini
[loggers]
keys=root,myapp

[handlers]
keys=consoleHandler,fileHandler

[formatters]
keys=simpleFormatter,detailedFormatter

[logger_root]
level=DEBUG
handlers=consoleHandler

[logger_myapp]
level=DEBUG
handlers=consoleHandler,fileHandler
qualname=myapp
propagate=0

[handler_consoleHandler]
class=StreamHandler
level=INFO
formatter=simpleFormatter
args=(sys.stdout,)

[handler_fileHandler]
class=FileHandler
level=DEBUG
formatter=detailedFormatter
args=('app.log', 'a', 'utf-8')

[formatter_simpleFormatter]
format=%(levelname)s - %(message)s

[formatter_detailedFormatter]
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s
datefmt=%Y-%m-%d %H:%M:%S
```

加载配置文件：

```python
import logging
import logging.config

logging.config.fileConfig('logging.ini')
logger = logging.getLogger('myapp')
```

## 异常日志记录

### 记录异常信息

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        # exc_info=True 会记录完整的堆栈信息
        logger.error('除零错误', exc_info=True)
        return None

# 或者使用 exception 方法（自动包含异常信息）
def divide_v2(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        logger.exception('除零错误')  # 等同于 error(..., exc_info=True)
        return None

divide(10, 0)
```

输出：
```
ERROR - 除零错误
Traceback (most recent call last):
  File "example.py", line 9, in divide
    return a / b
ZeroDivisionError: division by zero
```

### 自定义异常处理

```python
import logging
import sys

def setup_exception_logging():
    """设置全局异常日志记录"""
    logger = logging.getLogger('exceptions')

    def handle_exception(exc_type, exc_value, exc_traceback):
        # 不处理键盘中断
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return

        logger.critical(
            '未捕获的异常',
            exc_info=(exc_type, exc_value, exc_traceback)
        )

    sys.excepthook = handle_exception

setup_exception_logging()
```

## 实际应用示例

### Web 应用日志配置

```python
import logging
import logging.config
import os
from datetime import datetime

def setup_web_logging(app_name, log_dir='logs'):
    """Web 应用日志配置"""

    # 确保日志目录存在
    os.makedirs(log_dir, exist_ok=True)

    config = {
        'version': 1,
        'disable_existing_loggers': False,

        'formatters': {
            'standard': {
                'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
            },
            'access': {
                'format': '%(asctime)s - %(message)s'
            }
        },

        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'INFO',
                'formatter': 'standard'
            },
            'app_file': {
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'level': 'DEBUG',
                'formatter': 'standard',
                'filename': os.path.join(log_dir, f'{app_name}.log'),
                'when': 'midnight',
                'backupCount': 30,
                'encoding': 'utf-8'
            },
            'access_file': {
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'level': 'INFO',
                'formatter': 'access',
                'filename': os.path.join(log_dir, 'access.log'),
                'when': 'midnight',
                'backupCount': 30,
                'encoding': 'utf-8'
            },
            'error_file': {
                'class': 'logging.FileHandler',
                'level': 'ERROR',
                'formatter': 'standard',
                'filename': os.path.join(log_dir, 'error.log'),
                'encoding': 'utf-8'
            }
        },

        'loggers': {
            app_name: {
                'handlers': ['console', 'app_file', 'error_file'],
                'level': 'DEBUG',
                'propagate': False
            },
            f'{app_name}.access': {
                'handlers': ['access_file'],
                'level': 'INFO',
                'propagate': False
            }
        }
    }

    logging.config.dictConfig(config)
    return logging.getLogger(app_name)

# 使用
logger = setup_web_logging('mywebapp')
access_logger = logging.getLogger('mywebapp.access')

logger.info('Web 应用启动')
access_logger.info('GET /api/users 200 15ms')
```

### 带上下文的日志记录

```python
import logging
import threading
from contextlib import contextmanager

# 线程本地存储
_context = threading.local()

class ContextFilter(logging.Filter):
    """从线程本地存储获取上下文信息"""

    def filter(self, record):
        record.request_id = getattr(_context, 'request_id', '-')
        record.user_id = getattr(_context, 'user_id', '-')
        return True

@contextmanager
def log_context(**kwargs):
    """设置日志上下文的上下文管理器"""
    old_values = {}
    for key, value in kwargs.items():
        old_values[key] = getattr(_context, key, None)
        setattr(_context, key, value)
    try:
        yield
    finally:
        for key, old_value in old_values.items():
            if old_value is None:
                delattr(_context, key)
            else:
                setattr(_context, key, old_value)

# 配置
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('myapp')

handler = logging.StreamHandler()
handler.addFilter(ContextFilter())
handler.setFormatter(logging.Formatter(
    '%(asctime)s [%(request_id)s] [%(user_id)s] %(levelname)s - %(message)s'
))
logger.handlers = [handler]

# 使用
with log_context(request_id='req-123', user_id='user-456'):
    logger.info('处理用户请求')
    logger.debug('查询数据库')

logger.info('上下文已清除')
```

### 性能日志装饰器

```python
import logging
import functools
import time

logger = logging.getLogger(__name__)

def log_performance(func):
    """记录函数执行时间的装饰器"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()

        logger.debug(f'开始执行 {func.__name__}')

        try:
            result = func(*args, **kwargs)
            elapsed = time.perf_counter() - start_time
            logger.info(f'{func.__name__} 执行成功，耗时: {elapsed:.4f}秒')
            return result
        except Exception as e:
            elapsed = time.perf_counter() - start_time
            logger.error(f'{func.__name__} 执行失败，耗时: {elapsed:.4f}秒，错误: {e}')
            raise

    return wrapper

# 使用
@log_performance
def process_data(items):
    time.sleep(0.5)  # 模拟处理
    return [item * 2 for item in items]

result = process_data([1, 2, 3, 4, 5])
```

### 数据处理管道日志

```python
import logging
from typing import List, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class PipelineStats:
    """管道统计信息"""
    records_in: int = 0
    records_out: int = 0
    errors: int = 0
    start_time: datetime = None
    end_time: datetime = None

class DataPipeline:
    """带有详细日志的数据处理管道"""

    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f'pipeline.{name}')
        self.stats = PipelineStats()

    def process(self, data: List[Any]) -> List[Any]:
        self.stats.start_time = datetime.now()
        self.stats.records_in = len(data)

        self.logger.info(f'管道 [{self.name}] 开始处理，输入记录数: {len(data)}')

        try:
            # 步骤 1: 验证
            self.logger.debug('步骤 1: 数据验证')
            valid_data = self._validate(data)
            self.logger.info(f'验证通过: {len(valid_data)}/{len(data)} 条记录')

            # 步骤 2: 转换
            self.logger.debug('步骤 2: 数据转换')
            transformed = self._transform(valid_data)
            self.logger.info(f'转换完成: {len(transformed)} 条记录')

            # 步骤 3: 聚合
            self.logger.debug('步骤 3: 数据聚合')
            result = self._aggregate(transformed)
            self.logger.info(f'聚合完成: {len(result)} 条记录')

            self.stats.records_out = len(result)
            self.stats.end_time = datetime.now()

            duration = (self.stats.end_time - self.stats.start_time).total_seconds()
            self.logger.info(
                f'管道 [{self.name}] 处理完成，'
                f'耗时: {duration:.2f}秒，'
                f'输入: {self.stats.records_in}，'
                f'输出: {self.stats.records_out}，'
                f'错误: {self.stats.errors}'
            )

            return result

        except Exception as e:
            self.logger.exception(f'管道 [{self.name}] 处理失败')
            raise

    def _validate(self, data: List[Any]) -> List[Any]:
        valid = []
        for i, item in enumerate(data):
            if item is not None:
                valid.append(item)
            else:
                self.stats.errors += 1
                self.logger.warning(f'记录 {i} 验证失败: 空值')
        return valid

    def _transform(self, data: List[Any]) -> List[Any]:
        return [item * 2 for item in data]

    def _aggregate(self, data: List[Any]) -> List[Any]:
        return data

# 使用示例
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

pipeline = DataPipeline('user_scores')
result = pipeline.process([10, 20, None, 30, 40, None, 50])
```

### 多进程日志处理

```python
import logging
import logging.handlers
import multiprocessing
from typing import Callable

def setup_queue_logging():
    """设置基于队列的多进程日志系统"""

    # 创建日志队列
    log_queue = multiprocessing.Queue(-1)

    # 队列处理器（子进程使用）
    queue_handler = logging.handlers.QueueHandler(log_queue)

    # 实际的处理器（主进程使用）
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(processName)s - %(levelname)s - %(message)s'
    ))

    file_handler = logging.FileHandler('multiprocess.log', encoding='utf-8')
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(processName)s - %(name)s - %(levelname)s - %(message)s'
    ))

    # 队列监听器
    listener = logging.handlers.QueueListener(
        log_queue,
        console_handler,
        file_handler,
        respect_handler_level=True
    )

    return log_queue, queue_handler, listener

def worker_init(queue: multiprocessing.Queue):
    """工作进程初始化函数"""
    handler = logging.handlers.QueueHandler(queue)
    root = logging.getLogger()
    root.handlers = []
    root.addHandler(handler)
    root.setLevel(logging.DEBUG)

def worker_task(task_id: int) -> int:
    """工作进程任务"""
    logger = logging.getLogger(f'worker.task_{task_id}')
    logger.info(f'任务 {task_id} 开始')

    import time
    time.sleep(0.1)

    result = task_id * 2
    logger.info(f'任务 {task_id} 完成，结果: {result}')
    return result

def run_multiprocess():
    """运行多进程任务"""
    log_queue, queue_handler, listener = setup_queue_logging()
    listener.start()

    # 主进程日志配置
    root = logging.getLogger()
    root.addHandler(queue_handler)
    root.setLevel(logging.DEBUG)

    logger = logging.getLogger('main')
    logger.info('启动多进程任务')

    # 创建进程池
    with multiprocessing.Pool(
        processes=4,
        initializer=worker_init,
        initargs=(log_queue,)
    ) as pool:
        results = pool.map(worker_task, range(10))

    logger.info(f'所有任务完成，结果: {results}')
    listener.stop()

if __name__ == '__main__':
    run_multiprocess()
```

## 最佳实践

### 使用模块级别的 logger

```python
# 推荐
import logging
logger = logging.getLogger(__name__)

# 不推荐
logger = logging.getLogger('my_custom_name')
```

### 避免在模块级别配置日志

```python
# 不推荐 - 在模块级别配置
import logging
logging.basicConfig(level=logging.DEBUG)  # 可能影响其他模块

# 推荐 - 在入口点配置
def main():
    setup_logging()
    # 应用逻辑

if __name__ == '__main__':
    main()
```

### 使用延迟格式化

```python
# 推荐 - 使用 % 格式化，只在需要时才格式化
logger.debug('处理数据: %s', expensive_data)

# 不推荐 - f-string 总是会执行格式化
logger.debug(f'处理数据: {expensive_data}')

# 对于昂贵的操作，先检查日志级别
if logger.isEnabledFor(logging.DEBUG):
    logger.debug('详细信息: %s', compute_expensive_debug_info())
```

### 合理设置日志级别

```python
import os

# 通过环境变量控制日志级别
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logging.getLogger().setLevel(getattr(logging, log_level))

# 开发环境
# export LOG_LEVEL=DEBUG

# 生产环境
# export LOG_LEVEL=WARNING
```

### 不要记录敏感信息

```python
# 不推荐
logger.info(f'用户登录: {username}, 密码: {password}')

# 推荐
logger.info(f'用户登录: {username}')

# 或者使用脱敏处理
def mask_sensitive(value: str, visible: int = 4) -> str:
    if len(value) <= visible:
        return '*' * len(value)
    return value[:visible] + '*' * (len(value) - visible)

logger.info(f'信用卡: {mask_sensitive(card_number)}')
```

### 使用结构化日志

```python
import logging
import json

class StructuredMessage:
    def __init__(self, message, **kwargs):
        self.message = message
        self.kwargs = kwargs

    def __str__(self):
        return json.dumps({
            'message': self.message,
            **self.kwargs
        }, ensure_ascii=False)

# 使用
logger.info(StructuredMessage(
    '用户操作',
    action='login',
    user_id='123',
    ip='192.168.1.1',
    duration_ms=150
))
```

### 处理第三方库的日志

```python
# 降低第三方库的日志级别
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('requests').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

# 或者统一处理
def configure_third_party_logging():
    """配置第三方库日志"""
    noisy_loggers = [
        'urllib3',
        'requests',
        'boto3',
        'botocore',
        'paramiko',
        'elasticsearch',
    ]
    for name in noisy_loggers:
        logging.getLogger(name).setLevel(logging.WARNING)
```

### 日志轮转策略

```python
import logging
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

# 按大小轮转 - 适合日志量不可预测的场景
size_handler = RotatingFileHandler(
    'app.log',
    maxBytes=50 * 1024 * 1024,  # 50MB
    backupCount=10,
    encoding='utf-8'
)

# 按时间轮转 - 适合需要按日期归档的场景
time_handler = TimedRotatingFileHandler(
    'app.log',
    when='midnight',
    interval=1,
    backupCount=30,  # 保留30天
    encoding='utf-8'
)

# 组合使用 - 同时考虑大小和时间
# 需要自定义实现或使用第三方库如 concurrent-log-handler
```

## 常见问题

### 日志不显示

```python
# 检查是否配置了 handler
logger = logging.getLogger('myapp')
print(f'Handlers: {logger.handlers}')  # 如果为空，需要添加 handler
print(f'Level: {logger.level}')  # 0 表示 NOTSET
print(f'Effective level: {logger.getEffectiveLevel()}')

# 解决方案
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)
```

### 日志重复

```python
# 原因：多次添加 handler 或 propagate 导致

# 解决方案 1：清除已有 handler
logger = logging.getLogger('myapp')
logger.handlers.clear()

# 解决方案 2：检查后再添加
if not logger.handlers:
    logger.addHandler(handler)

# 解决方案 3：禁止传播
logger.propagate = False
```

### 多线程日志安全

```python
# logging 模块本身是线程安全的
# 但如果使用自定义 handler，需要注意线程安全

import threading

class ThreadSafeHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self._lock = threading.Lock()

    def emit(self, record):
        with self._lock:
            # 线程安全的操作
            msg = self.format(record)
            # 写入操作...
```

### 异步日志处理

```python
import logging
import logging.handlers
import queue
import atexit

def setup_async_logging():
    """设置异步日志处理，避免 I/O 阻塞主线程"""

    # 创建内存队列
    log_queue = queue.Queue(-1)

    # 队列 handler
    queue_handler = logging.handlers.QueueHandler(log_queue)

    # 实际的 handler
    file_handler = logging.FileHandler('app.log', encoding='utf-8')
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    ))

    # 监听器在后台线程处理日志
    listener = logging.handlers.QueueListener(
        log_queue,
        file_handler,
        respect_handler_level=True
    )
    listener.start()

    # 确保程序退出时停止监听器
    atexit.register(listener.stop)

    # 配置 root logger
    root = logging.getLogger()
    root.addHandler(queue_handler)
    root.setLevel(logging.DEBUG)

    return listener

# 使用
listener = setup_async_logging()
logger = logging.getLogger(__name__)
logger.info('这条日志会异步写入文件')
```

## 总结

Python 的 `logging` 模块是一个功能完善的日志系统，掌握它对于开发高质量的应用程序至关重要。关键要点：

1. **使用 logging 而非 print**：提供更专业的日志管理能力
2. **理解日志级别**：根据信息重要程度选择合适的级别（DEBUG < INFO < WARNING < ERROR < CRITICAL）
3. **合理配置 Handler**：根据需求输出到不同目标（控制台、文件、网络等）
4. **使用 Formatter**：格式化日志以便阅读和分析
5. **使用 Filter**：实现细粒度的日志过滤
6. **配置日志轮转**：避免日志文件无限增长
7. **遵循最佳实践**：使用 `__name__` 命名、延迟格式化、保护敏感信息

通过合理使用日志，你可以更好地监控应用程序运行状态，快速定位和解决问题，提高开发和运维效率。
