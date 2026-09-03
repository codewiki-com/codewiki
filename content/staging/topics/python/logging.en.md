---
title: Logging Module
description: Complete guide to Python logging module, log levels, handlers, formatters and best practices
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - logging
  - Logs
  - Debugging
status: imported
origin: old/src/content/docs/python/logging.en.md
divergence: 0.181
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 18
  lastUpdated: 2026-01-07
---

The `logging` module is Python's built-in solution for tracking events that occur during program execution. Unlike simple `print()` statements, logging provides a flexible framework for emitting log messages with different severity levels, formatting options, and output destinations.

## Why Use Logging Instead of Print?

Before diving into the logging module, let's understand why it's preferable to `print()` statements:

```python
# Using print (not recommended for production)
print("User logged in")
print("Error: Database connection failed")

# Using logging (recommended)
import logging
logging.info("User logged in")
logging.error("Database connection failed")
```

Key advantages of logging over print:

- **Severity Levels**: Categorize messages by importance (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- **Configurability**: Enable or disable messages without modifying code
- **Flexible Output**: Send logs to files, network sockets, email, or multiple destinations
- **Rich Context**: Automatically include timestamps, module names, line numbers
- **Thread Safety**: Safe to use in multi-threaded applications
- **Performance**: Lazy evaluation of log messages

## Getting Started with Basic Logging

### The Simplest Example

```python
import logging

# Configure basic logging
logging.basicConfig(level=logging.DEBUG)

# Log messages at different levels
logging.debug("This is a debug message")
logging.info("This is an info message")
logging.warning("This is a warning message")
logging.error("This is an error message")
logging.critical("This is a critical message")
```

Output:
```
DEBUG:root:This is a debug message
INFO:root:This is an info message
WARNING:root:This is a warning message
ERROR:root:This is an error message
CRITICAL:root:This is a critical message
```

### Configuring Basic Logging

The `basicConfig()` function provides a quick way to configure the root logger:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    filename='app.log',
    filemode='w'  # 'w' for overwrite, 'a' for append
)

logging.info("Application started")
logging.warning("Low memory warning")
```

Output in `app.log`:
```
2026-01-07 10:30:45 - root - INFO - Application started
2026-01-07 10:30:45 - root - WARNING - Low memory warning
```

## Understanding Log Levels

Python logging defines five standard levels, each with a numeric value:

| Level | Numeric Value | Description |
|-------|---------------|-------------|
| DEBUG | 10 | Detailed information for diagnosing problems |
| INFO | 20 | Confirmation that things are working as expected |
| WARNING | 30 | Something unexpected happened, but the program still works |
| ERROR | 40 | A more serious problem; the program couldn't perform a function |
| CRITICAL | 50 | A serious error; the program may not be able to continue |

### How Log Levels Work

When you set a logging level, messages at that level and above are processed:

```python
import logging

# Setting level to WARNING means DEBUG and INFO are ignored
logging.basicConfig(level=logging.WARNING)

logging.debug("This won't be shown")      # Level 10 < 30
logging.info("This won't be shown")       # Level 20 < 30
logging.warning("This will be shown")     # Level 30 >= 30
logging.error("This will be shown")       # Level 40 >= 30
logging.critical("This will be shown")    # Level 50 >= 30
```

### Choosing the Right Log Level

```python
import logging

logging.basicConfig(level=logging.DEBUG)

def process_user_data(user_id, data):
    logging.debug(f"Processing data for user {user_id}: {data}")

    if not data:
        logging.warning(f"Empty data received for user {user_id}")
        return None

    try:
        # Simulate processing
        result = {"processed": True, "user_id": user_id}
        logging.info(f"Successfully processed data for user {user_id}")
        return result
    except ValueError as e:
        logging.error(f"Invalid data format for user {user_id}: {e}")
        return None
    except Exception as e:
        logging.critical(f"Unexpected error processing user {user_id}: {e}")
        raise

# Usage
process_user_data(123, {"name": "Alice"})
process_user_data(456, None)
```

## Loggers, Handlers, and Formatters

The logging module has four main components:

1. **Loggers**: The interface that application code uses directly
2. **Handlers**: Send log records to appropriate destinations
3. **Formatters**: Specify the layout of log records
4. **Filters**: Provide fine-grained control over which records to output

### Creating Custom Loggers

Instead of using the root logger, create named loggers for better control:

```python
import logging

# Create a custom logger
logger = logging.getLogger('my_application')
logger.setLevel(logging.DEBUG)

# Create handlers
console_handler = logging.StreamHandler()
file_handler = logging.FileHandler('app.log')

# Set levels for handlers
console_handler.setLevel(logging.WARNING)  # Only WARNING+ to console
file_handler.setLevel(logging.DEBUG)       # All messages to file

# Create formatters
console_format = logging.Formatter('%(levelname)s - %(message)s')
file_format = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
)

# Add formatters to handlers
console_handler.setFormatter(console_format)
file_handler.setFormatter(file_format)

# Add handlers to logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# Use the logger
logger.debug("Debug message - only in file")
logger.info("Info message - only in file")
logger.warning("Warning message - console and file")
logger.error("Error message - console and file")
```

### Logger Hierarchy

Loggers follow a hierarchical naming convention using dots:

```python
import logging

# Parent logger
parent_logger = logging.getLogger('myapp')
parent_logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(name)s - %(levelname)s - %(message)s'))
parent_logger.addHandler(handler)

# Child loggers inherit from parent
db_logger = logging.getLogger('myapp.database')
api_logger = logging.getLogger('myapp.api')
api_auth_logger = logging.getLogger('myapp.api.auth')

# All these use the parent's handler
db_logger.warning("Database connection slow")
api_logger.info("API request received")
api_auth_logger.error("Authentication failed")
```

Output:
```
myapp.database - WARNING - Database connection slow
myapp.api - INFO - API request received
myapp.api.auth - ERROR - Authentication failed
```

## Handlers in Detail

Python provides several built-in handlers for different use cases.

### StreamHandler

Sends log output to streams like `sys.stdout` or `sys.stderr`:

```python
import logging
import sys

logger = logging.getLogger('stream_example')
logger.setLevel(logging.DEBUG)

# Send to stdout
stdout_handler = logging.StreamHandler(sys.stdout)
stdout_handler.setLevel(logging.DEBUG)

# Send errors to stderr
stderr_handler = logging.StreamHandler(sys.stderr)
stderr_handler.setLevel(logging.ERROR)

logger.addHandler(stdout_handler)
logger.addHandler(stderr_handler)
```

### FileHandler

Writes log messages to a file:

```python
import logging

logger = logging.getLogger('file_example')
logger.setLevel(logging.DEBUG)

# Basic file handler
file_handler = logging.FileHandler(
    'application.log',
    mode='a',           # Append mode
    encoding='utf-8'    # Handle unicode properly
)
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

logger.addHandler(file_handler)
```

### RotatingFileHandler

Rotates log files when they reach a certain size:

```python
import logging
from logging.handlers import RotatingFileHandler

logger = logging.getLogger('rotating_example')
logger.setLevel(logging.DEBUG)

# Rotate when file reaches 5MB, keep 3 backup files
rotating_handler = RotatingFileHandler(
    'app.log',
    maxBytes=5*1024*1024,  # 5 MB
    backupCount=3,
    encoding='utf-8'
)

formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
rotating_handler.setFormatter(formatter)

logger.addHandler(rotating_handler)

# This will create app.log, app.log.1, app.log.2, app.log.3
for i in range(10000):
    logger.info(f"Log message number {i}")
```

### TimedRotatingFileHandler

Rotates log files based on time intervals:

```python
import logging
from logging.handlers import TimedRotatingFileHandler

logger = logging.getLogger('timed_rotating')
logger.setLevel(logging.DEBUG)

# Rotate daily at midnight, keep 7 days of logs
timed_handler = TimedRotatingFileHandler(
    'app.log',
    when='midnight',      # Rotate at midnight
    interval=1,           # Every 1 day
    backupCount=7,        # Keep 7 backup files
    encoding='utf-8'
)

# when options: 'S' (seconds), 'M' (minutes), 'H' (hours),
#               'D' (days), 'midnight', 'W0'-'W6' (weekday)

formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
timed_handler.setFormatter(formatter)

logger.addHandler(timed_handler)
```

### SMTPHandler

Sends log messages via email (useful for critical errors):

```python
import logging
from logging.handlers import SMTPHandler

logger = logging.getLogger('email_example')
logger.setLevel(logging.ERROR)

mail_handler = SMTPHandler(
    mailhost=('smtp.example.com', 587),
    fromaddr='alerts@example.com',
    toaddrs=['admin@example.com'],
    subject='Application Error Alert',
    credentials=('username', 'password'),
    secure=()  # Use TLS
)
mail_handler.setLevel(logging.CRITICAL)

logger.addHandler(mail_handler)
```

### HTTPHandler

Sends log records to a web server:

```python
import logging
from logging.handlers import HTTPHandler

logger = logging.getLogger('http_example')
logger.setLevel(logging.WARNING)

http_handler = HTTPHandler(
    host='logging-server.example.com',
    url='/api/logs',
    method='POST'
)
http_handler.setLevel(logging.WARNING)

logger.addHandler(http_handler)
```

## Formatters in Detail

Formatters control the final output format of log messages.

### Available Format Attributes

| Attribute | Description |
|-----------|-------------|
| `%(asctime)s` | Human-readable time |
| `%(created)f` | Time as a Unix timestamp |
| `%(filename)s` | Filename portion of pathname |
| `%(funcName)s` | Name of function containing the logging call |
| `%(levelname)s` | Text logging level (DEBUG, INFO, etc.) |
| `%(levelno)s` | Numeric logging level |
| `%(lineno)d` | Source line number |
| `%(message)s` | The logged message |
| `%(module)s` | Module name |
| `%(name)s` | Logger name |
| `%(pathname)s` | Full pathname of source file |
| `%(process)d` | Process ID |
| `%(processName)s` | Process name |
| `%(thread)d` | Thread ID |
| `%(threadName)s` | Thread name |

### Custom Formatter Examples

```python
import logging

logger = logging.getLogger('format_examples')
logger.setLevel(logging.DEBUG)

# Simple format
simple_formatter = logging.Formatter('%(levelname)s: %(message)s')

# Detailed format for debugging
debug_formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# JSON-like format for log aggregation
json_formatter = logging.Formatter(
    '{"time": "%(asctime)s", "level": "%(levelname)s", '
    '"logger": "%(name)s", "message": "%(message)s"}'
)

handler = logging.StreamHandler()
handler.setFormatter(debug_formatter)
logger.addHandler(handler)

def my_function():
    logger.info("This message includes function context")

my_function()
```

Output:
```
2026-01-07 10:45:30 | INFO     | format_examples:my_function:25 | This message includes function context
```

### Creating a Custom Formatter Class

```python
import logging
from datetime import datetime

class ColoredFormatter(logging.Formatter):
    """Custom formatter that adds colors to log levels."""

    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[41m',  # Red background
    }
    RESET = '\033[0m'

    def format(self, record):
        # Add color to levelname
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)

# Usage
logger = logging.getLogger('colored')
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setFormatter(ColoredFormatter('%(levelname)s - %(message)s'))
logger.addHandler(handler)

logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
```

## Filters

Filters provide additional control over which log records are processed.

### Basic Filter

```python
import logging

class InfoFilter(logging.Filter):
    """Only allow INFO level messages."""

    def filter(self, record):
        return record.levelno == logging.INFO

logger = logging.getLogger('filter_example')
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.addFilter(InfoFilter())  # Apply filter to handler

logger.addHandler(handler)

logger.debug("This won't be shown")
logger.info("This will be shown")
logger.warning("This won't be shown")
```

### Context Filter

```python
import logging

class ContextFilter(logging.Filter):
    """Add extra context to log records."""

    def __init__(self, user_id=None):
        super().__init__()
        self.user_id = user_id

    def filter(self, record):
        record.user_id = self.user_id or 'anonymous'
        return True

logger = logging.getLogger('context_example')
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setFormatter(
    logging.Formatter('%(asctime)s - User:%(user_id)s - %(message)s')
)

# Add filter with context
context_filter = ContextFilter(user_id='user123')
handler.addFilter(context_filter)

logger.addHandler(handler)
logger.info("User performed an action")
```

Output:
```
2026-01-07 10:50:00 - User:user123 - User performed an action
```

### Module Filter

```python
import logging

class ModuleFilter(logging.Filter):
    """Only allow logs from specific modules."""

    def __init__(self, allowed_modules):
        super().__init__()
        self.allowed_modules = allowed_modules

    def filter(self, record):
        return record.module in self.allowed_modules

# Only show logs from specific modules
handler = logging.StreamHandler()
handler.addFilter(ModuleFilter(['main', 'database', 'api']))
```

## Configuration Methods

### Dictionary Configuration

For complex setups, dictionary configuration is cleaner:

```python
import logging
import logging.config

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,

    'formatters': {
        'standard': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        },
        'detailed': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
        },
    },

    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'DEBUG',
            'formatter': 'detailed',
            'filename': 'app.log',
            'maxBytes': 10485760,  # 10 MB
            'backupCount': 5,
            'encoding': 'utf-8',
        },
        'error_file': {
            'class': 'logging.FileHandler',
            'level': 'ERROR',
            'formatter': 'detailed',
            'filename': 'errors.log',
            'encoding': 'utf-8',
        },
    },

    'loggers': {
        '': {  # Root logger
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'myapp.database': {
            'handlers': ['file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

logging.config.dictConfig(LOGGING_CONFIG)

# Use the configured loggers
logger = logging.getLogger('myapp')
db_logger = logging.getLogger('myapp.database')

logger.info("Application started")
db_logger.error("Database connection failed")
```

### File-Based Configuration (INI Format)

Create a `logging.conf` file:

```ini
[loggers]
keys=root,myapp

[handlers]
keys=consoleHandler,fileHandler

[formatters]
keys=standardFormatter

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
formatter=standardFormatter
args=(sys.stdout,)

[handler_fileHandler]
class=FileHandler
level=DEBUG
formatter=standardFormatter
args=('app.log', 'a')

[formatter_standardFormatter]
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s
datefmt=%Y-%m-%d %H:%M:%S
```

Load the configuration:

```python
import logging
import logging.config

logging.config.fileConfig('logging.conf')

logger = logging.getLogger('myapp')
logger.info("Configuration loaded from file")
```

### YAML Configuration

Using YAML for configuration (requires PyYAML):

```yaml
# logging_config.yaml
version: 1
disable_existing_loggers: false

formatters:
  standard:
    format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    datefmt: "%Y-%m-%d %H:%M:%S"

handlers:
  console:
    class: logging.StreamHandler
    level: DEBUG
    formatter: standard
    stream: ext://sys.stdout

  file:
    class: logging.handlers.RotatingFileHandler
    level: INFO
    formatter: standard
    filename: app.log
    maxBytes: 10485760
    backupCount: 5

loggers:
  myapp:
    level: DEBUG
    handlers: [console, file]
    propagate: no

root:
  level: WARNING
  handlers: [console]
```

Load YAML configuration:

```python
import logging
import logging.config
import yaml

with open('logging_config.yaml', 'r') as f:
    config = yaml.safe_load(f)
    logging.config.dictConfig(config)

logger = logging.getLogger('myapp')
logger.info("YAML configuration loaded")
```

## Logging Exceptions

Python logging provides excellent support for exception logging.

### Basic Exception Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('exception_example')

def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        logger.exception("Division by zero attempted")
        return None

divide(10, 0)
```

Output:
```
ERROR:exception_example:Division by zero attempted
Traceback (most recent call last):
  File "example.py", line 8, in divide
    return a / b
ZeroDivisionError: division by zero
```

### Different Ways to Log Exceptions

```python
import logging

logger = logging.getLogger('exception_methods')
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(levelname)s - %(message)s'))
logger.addHandler(handler)

try:
    result = 1 / 0
except ZeroDivisionError as e:
    # Method 1: exception() - includes full traceback
    logger.exception("Full traceback:")

    # Method 2: error() with exc_info=True - same as exception()
    logger.error("With exc_info:", exc_info=True)

    # Method 3: error() with just the exception message
    logger.error(f"Just the message: {e}")

    # Method 4: Include exception in a specific format
    logger.error("Custom format: %s - %s", type(e).__name__, e)
```

## Structured Logging

For modern applications, structured logging in JSON format is often preferred:

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Format log records as JSON."""

    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)

        return json.dumps(log_data)

# Usage
logger = logging.getLogger('json_logger')
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)

logger.info("User logged in", extra={'extra_data': {'user_id': 123, 'ip': '192.168.1.1'}})
```

Output:
```json
{"timestamp": "2026-01-07T10:55:00.000000", "level": "INFO", "logger": "json_logger", "message": "User logged in", "module": "example", "function": "<module>", "line": 35, "user_id": 123, "ip": "192.168.1.1"}
```

## Logging in Multi-Threaded Applications

The logging module is thread-safe by default:

```python
import logging
import threading
import time

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(threadName)s - %(message)s'
)
logger = logging.getLogger('threading_example')

def worker(name, count):
    for i in range(count):
        logger.info(f"Worker {name} - iteration {i}")
        time.sleep(0.1)

# Create and start threads
threads = []
for i in range(3):
    t = threading.Thread(target=worker, args=(f"Thread-{i}", 5))
    threads.append(t)
    t.start()

# Wait for all threads to complete
for t in threads:
    t.join()

logger.info("All workers completed")
```

### Using QueueHandler for High-Performance Logging

For high-throughput applications, use a queue to avoid blocking:

```python
import logging
import logging.handlers
import queue
import threading

# Create a queue for log records
log_queue = queue.Queue()

# Create a handler that puts records in the queue
queue_handler = logging.handlers.QueueHandler(log_queue)

# Create the actual handlers
file_handler = logging.FileHandler('app.log')
console_handler = logging.StreamHandler()

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Create a listener that processes the queue
listener = logging.handlers.QueueListener(
    log_queue,
    file_handler,
    console_handler,
    respect_handler_level=True
)

# Configure the logger
logger = logging.getLogger('queue_example')
logger.setLevel(logging.DEBUG)
logger.addHandler(queue_handler)

# Start the listener
listener.start()

# Log messages (non-blocking)
for i in range(100):
    logger.info(f"Message {i}")

# Stop the listener when done
listener.stop()
```

## Best Practices

### Use Module-Level Loggers

```python
# At the top of each module
import logging

logger = logging.getLogger(__name__)

def my_function():
    logger.info("Function called")
```

### Don't Log Sensitive Information

```python
import logging

logger = logging.getLogger(__name__)

def authenticate(username, password):
    # BAD: Logging sensitive data
    # logger.debug(f"Authenticating {username} with password {password}")

    # GOOD: Log only what's necessary
    logger.debug(f"Authenticating user: {username}")

    # If authentication fails
    logger.warning(f"Failed authentication attempt for user: {username}")
```

### Use Lazy String Formatting

```python
import logging

logger = logging.getLogger(__name__)

expensive_data = {"key": "value", "nested": {"data": [1, 2, 3]}}

# BAD: String is always formatted, even if DEBUG is disabled
logger.debug("Processing data: %s" % str(expensive_data))
logger.debug(f"Processing data: {expensive_data}")

# GOOD: String is only formatted if DEBUG level is enabled
logger.debug("Processing data: %s", expensive_data)
```

### Configure Logging Early

```python
# main.py
import logging
import logging.config

def setup_logging():
    """Configure logging before any other imports."""
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            },
        },
        'handlers': {
            'default': {
                'class': 'logging.StreamHandler',
                'formatter': 'standard',
                'level': 'DEBUG',
            },
        },
        'root': {
            'handlers': ['default'],
            'level': 'INFO',
        },
    }
    logging.config.dictConfig(config)

# Call before importing other modules
setup_logging()

# Now import your application modules
from myapp import main
main.run()
```

### Use Context Managers for Temporary Log Level Changes

```python
import logging
from contextlib import contextmanager

@contextmanager
def log_level(logger, level):
    """Temporarily change log level."""
    old_level = logger.level
    logger.setLevel(level)
    try:
        yield
    finally:
        logger.setLevel(old_level)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

logger.debug("This won't be shown")

with log_level(logger, logging.DEBUG):
    logger.debug("This will be shown")

logger.debug("This won't be shown again")
```

### Create a Logging Utility Module

```python
# logging_utils.py
import logging
import logging.handlers
import sys
from pathlib import Path

def setup_logger(
    name: str,
    log_file: str = None,
    level: int = logging.INFO,
    console_output: bool = True,
    max_bytes: int = 10485760,
    backup_count: int = 5
) -> logging.Logger:
    """
    Set up a logger with console and optional file output.

    Args:
        name: Logger name
        log_file: Path to log file (optional)
        level: Logging level
        console_output: Whether to output to console
        max_bytes: Max file size before rotation
        backup_count: Number of backup files to keep

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Prevent adding handlers multiple times
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger

# Usage
logger = setup_logger('myapp', log_file='logs/app.log', level=logging.DEBUG)
logger.info("Application started")
```

### Environment-Based Configuration

```python
import logging
import os

def get_log_level():
    """Get log level from environment variable."""
    level_name = os.getenv('LOG_LEVEL', 'INFO').upper()
    return getattr(logging, level_name, logging.INFO)

def setup_logging():
    """Configure logging based on environment."""
    level = get_log_level()
    log_file = os.getenv('LOG_FILE')

    handlers = [logging.StreamHandler()]

    if log_file:
        handlers.append(logging.FileHandler(log_file))

    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=handlers
    )

# Usage:
# LOG_LEVEL=DEBUG LOG_FILE=app.log python main.py
```

## Common Patterns and Recipes

### Logging Decorator

```python
import logging
import functools
import time

logger = logging.getLogger(__name__)

def log_function_call(func):
    """Decorator to log function calls with timing."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            elapsed = time.time() - start_time
            logger.debug(f"{func.__name__} completed in {elapsed:.3f}s")
            return result
        except Exception as e:
            elapsed = time.time() - start_time
            logger.exception(f"{func.__name__} failed after {elapsed:.3f}s")
            raise
    return wrapper

@log_function_call
def process_data(data):
    time.sleep(0.5)  # Simulate work
    return len(data)

process_data([1, 2, 3, 4, 5])
```

### Request ID Tracking

```python
import logging
import uuid
import threading

# Thread-local storage for request context
_request_context = threading.local()

class RequestContextFilter(logging.Filter):
    """Add request ID to all log records."""

    def filter(self, record):
        record.request_id = getattr(_request_context, 'request_id', 'no-request')
        return True

def set_request_id(request_id=None):
    """Set the request ID for the current thread."""
    _request_context.request_id = request_id or str(uuid.uuid4())[:8]

def get_request_id():
    """Get the current request ID."""
    return getattr(_request_context, 'request_id', None)

# Setup
logger = logging.getLogger('request_tracking')
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setFormatter(
    logging.Formatter('%(asctime)s - [%(request_id)s] - %(levelname)s - %(message)s')
)
handler.addFilter(RequestContextFilter())
logger.addHandler(handler)

# Usage in a web request handler
def handle_request(request):
    set_request_id()
    logger.info("Request received")
    # ... process request ...
    logger.info("Request completed")
```

### Performance-Aware Logging

```python
import logging

logger = logging.getLogger(__name__)

def expensive_computation():
    """Simulate an expensive computation for logging."""
    import time
    time.sleep(1)
    return {"result": "expensive data"}

# Check if level is enabled before expensive operations
if logger.isEnabledFor(logging.DEBUG):
    logger.debug("Expensive data: %s", expensive_computation())

# Or use lazy evaluation with a lambda-like approach
class LazyString:
    def __init__(self, func):
        self.func = func

    def __str__(self):
        return str(self.func())

logger.debug("Lazy data: %s", LazyString(expensive_computation))
```

### Masking Sensitive Data

```python
import logging
import re

class SensitiveDataFilter(logging.Filter):
    """Filter that masks sensitive data in log messages."""

    PATTERNS = [
        (r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', 'XXXX-XXXX-XXXX-XXXX'),  # Credit card
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]'),  # Email
        (r'password["\']?\s*[:=]\s*["\']?[^"\'}\s]+', 'password=[REDACTED]'),  # Password
    ]

    def filter(self, record):
        message = record.getMessage()
        for pattern, replacement in self.PATTERNS:
            message = re.sub(pattern, replacement, message, flags=re.IGNORECASE)
        record.msg = message
        record.args = ()
        return True

logger = logging.getLogger('secure')
handler = logging.StreamHandler()
handler.addFilter(SensitiveDataFilter())
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

logger.info("User email: john@example.com, card: 1234-5678-9012-3456")
# Output: User email: [EMAIL], card: XXXX-XXXX-XXXX-XXXX
```

## Testing with Logging

Capture logs in unit tests:

```python
import logging
import unittest

class TestLogging(unittest.TestCase):
    def setUp(self):
        self.logger = logging.getLogger('test')
        self.log_capture = []

        # Create custom handler
        class ListHandler(logging.Handler):
            def emit(handler_self, record):
                self.log_capture.append(record)

        self.handler = ListHandler()
        self.logger.addHandler(self.handler)
        self.logger.setLevel(logging.DEBUG)

    def tearDown(self):
        self.logger.removeHandler(self.handler)

    def test_function_logs_info(self):
        self.logger.info("Test message")

        self.assertEqual(len(self.log_capture), 1)
        self.assertEqual(self.log_capture[0].levelname, 'INFO')
        self.assertEqual(self.log_capture[0].getMessage(), 'Test message')

# Using pytest with caplog fixture
def test_with_caplog(caplog):
    logger = logging.getLogger('test')
    with caplog.at_level(logging.INFO):
        logger.info("Test message")

    assert "Test message" in caplog.text
    assert len(caplog.records) == 1
    assert caplog.records[0].levelname == "INFO"
```

## Common Pitfalls and Solutions

### Multiple basicConfig() Calls

```python
# Problem: Second call has no effect
logging.basicConfig(level=logging.DEBUG)
logging.basicConfig(level=logging.INFO)  # Ignored!

# Solution: Configure the root logger directly
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Or use force=True (Python 3.8+)
logging.basicConfig(level=logging.INFO, force=True)
```

### Logger Propagation Issues

```python
import logging

# Child logger
child_logger = logging.getLogger('parent.child')
child_handler = logging.StreamHandler()
child_logger.addHandler(child_handler)

# Parent logger
parent_logger = logging.getLogger('parent')
parent_handler = logging.StreamHandler()
parent_logger.addHandler(parent_handler)

# Problem: This will output twice (child and parent handlers)
child_logger.info("Message")

# Solution: Disable propagation
child_logger.propagate = False
```

### Logger Not Showing Messages

```python
import logging

logger = logging.getLogger('myapp')

# Problem: No output because no handler is configured
logger.info("This won't appear")

# Solution: Add a handler
handler = logging.StreamHandler()
logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.info("Now this will appear")
```

### Logging in Module Scope

```python
# Problem: Logger created with hardcoded name
logger = logging.getLogger('my_logger')

# Solution: Use __name__ for proper hierarchy
logger = logging.getLogger(__name__)
```

## Summary

The Python logging module is a powerful and flexible system for recording events in your applications. Key takeaways:

1. **Use logging instead of print** for any production code
2. **Choose appropriate log levels** to categorize message severity
3. **Create named loggers** using `__name__` for better organization
4. **Configure handlers** to direct logs to appropriate destinations
5. **Use formatters** to include relevant context in log messages
6. **Implement rotating handlers** to manage log file sizes
7. **Use dictionary configuration** for complex logging setups
8. **Apply filters** for fine-grained control over log output
9. **Follow best practices** like lazy formatting and avoiding sensitive data

Proper logging is essential for debugging, monitoring, and maintaining applications in production. Invest time in setting up a good logging infrastructure early in your project, and it will pay dividends throughout the application's lifecycle.
