---
title: Subprocess Module
description: Complete guide to Python subprocess module, process creation, pipe communication and command execution
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - subprocess
  - Process
  - System Commands
status: imported
origin: old/src/content/docs/python/subprocess.en.md
divergence: 0.229
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 21
  lastUpdated: 2026-01-07
---

The `subprocess` module is Python's primary interface for spawning new processes, connecting to their input/output/error pipes, and obtaining their return codes. It replaces several older modules and functions, providing a modern, secure approach to process management.

## Why Use subprocess?

The subprocess module offers significant advantages over older alternatives:

- **Security**: Better control over shell injection vulnerabilities
- **Flexibility**: Fine-grained control over input, output, and error streams
- **Cross-platform**: Works consistently across Windows, Linux, and macOS
- **Power**: Chain commands, handle timeouts, and manage complex process interactions
- **Modern API**: Clean, Pythonic interface with `subprocess.run()` (Python 3.5+)

## The subprocess.run() Function

The `run()` function is the recommended approach for most use cases. It was introduced in Python 3.5 and provides a simple, high-level interface.

### Basic Usage

```python
import subprocess

# Run a simple command
result = subprocess.run(['ls', '-la'])

# Check the return code
print(f"Return code: {result.returncode}")
```

### Capturing Output

Use `capture_output=True` to capture stdout and stderr:

```python
import subprocess

result = subprocess.run(
    ['ls', '-la'],
    capture_output=True,
    text=True  # Return strings instead of bytes
)

print("STDOUT:")
print(result.stdout)

print("STDERR:")
print(result.stderr)

print(f"Return code: {result.returncode}")
```

Alternatively, use `stdout` and `stderr` parameters:

```python
import subprocess

result = subprocess.run(
    ['ls', '-la'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

print(result.stdout)
```

### Handling Return Codes

By default, `run()` does not raise an exception on non-zero return codes:

```python
import subprocess

# This won't raise an exception even if the command fails
result = subprocess.run(['ls', '/nonexistent'])
print(f"Return code: {result.returncode}")  # Non-zero

# Use check=True to raise CalledProcessError on failure
try:
    result = subprocess.run(
        ['ls', '/nonexistent'],
        check=True,
        capture_output=True,
        text=True
    )
except subprocess.CalledProcessError as e:
    print(f"Command failed with code {e.returncode}")
    print(f"Error output: {e.stderr}")
```

### Providing Input

Send data to a command's stdin:

```python
import subprocess

# Using input parameter
result = subprocess.run(
    ['grep', 'hello'],
    input='hello world\ngoodbye world\nhello again\n',
    capture_output=True,
    text=True
)
print(result.stdout)
# Output:
# hello world
# hello again
```

### Timeouts

Prevent commands from running indefinitely:

```python
import subprocess

try:
    result = subprocess.run(
        ['sleep', '30'],
        timeout=5,
        capture_output=True
    )
except subprocess.TimeoutExpired as e:
    print(f"Command timed out after {e.timeout} seconds")
    print(f"Partial output: {e.stdout}")
```

### Complete run() Parameters

```python
import subprocess

result = subprocess.run(
    args=['command', 'arg1', 'arg2'],  # Command and arguments
    stdin=None,                         # Input stream
    input=None,                         # Input data (bytes or string)
    stdout=subprocess.PIPE,             # Capture stdout
    stderr=subprocess.PIPE,             # Capture stderr
    capture_output=True,                # Shortcut for stdout=PIPE, stderr=PIPE
    shell=False,                        # Run through shell
    cwd='/path/to/dir',                 # Working directory
    timeout=30,                         # Timeout in seconds
    check=False,                        # Raise on non-zero exit
    encoding='utf-8',                   # Text encoding
    errors='strict',                    # Encoding error handling
    text=True,                          # Text mode (equivalent to universal_newlines)
    env={'KEY': 'value'},               # Environment variables
)
```

## The CompletedProcess Object

`subprocess.run()` returns a `CompletedProcess` instance:

```python
import subprocess

result = subprocess.run(
    ['echo', 'Hello, World!'],
    capture_output=True,
    text=True
)

# Available attributes
print(f"args: {result.args}")           # ['echo', 'Hello, World!']
print(f"returncode: {result.returncode}") # 0
print(f"stdout: {result.stdout}")        # Hello, World!\n
print(f"stderr: {result.stderr}")        # (empty string)
```

## Shell Commands

### Using shell=True

When you need shell features like pipes, globbing, or environment variable expansion:

```python
import subprocess

# Shell command with pipe
result = subprocess.run(
    'ls -la | grep ".py"',
    shell=True,
    capture_output=True,
    text=True
)
print(result.stdout)

# Environment variable expansion
result = subprocess.run(
    'echo $HOME',
    shell=True,
    capture_output=True,
    text=True
)
print(result.stdout)  # /home/username
```

### Security Warning

**Never use `shell=True` with untrusted input!** This creates a shell injection vulnerability:

```python
import subprocess

# DANGEROUS - Never do this!
user_input = "; rm -rf /"
# subprocess.run(f'echo {user_input}', shell=True)  # Security risk!

# SAFE - Use a list of arguments
subprocess.run(['echo', user_input])  # Safe
```

### When to Use shell=True

- Quick scripts with trusted, hardcoded commands
- When you need shell features (pipes, redirects, globbing)
- Complex shell one-liners

### When to Avoid shell=True

- Any command containing user input
- Production code handling external data
- Security-sensitive applications

## The Popen Class

For more complex process interactions, use `Popen` directly. It provides:

- Non-blocking process execution
- Real-time I/O streaming
- Process chaining (pipes between processes)
- Fine-grained process control

### Basic Popen Usage

```python
import subprocess

# Start a process
process = subprocess.Popen(
    ['ls', '-la'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Wait for completion and get output
stdout, stderr = process.communicate()
print(stdout)

# Check return code
print(f"Return code: {process.returncode}")
```

### Non-blocking Execution

```python
import subprocess
import time

# Start a long-running process
process = subprocess.Popen(
    ['sleep', '10'],
    stdout=subprocess.PIPE
)

# Do other work while process runs
while process.poll() is None:
    print("Process still running...")
    time.sleep(1)
    # Do other work here

print(f"Process finished with code: {process.returncode}")
```

### Real-time Output Streaming

```python
import subprocess
import sys

process = subprocess.Popen(
    ['ping', '-c', '5', 'google.com'],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1  # Line buffered
)

# Read output line by line as it's produced
for line in process.stdout:
    print(f"[PING] {line}", end='')
    sys.stdout.flush()

process.wait()
```

### Interactive Processes

```python
import subprocess

process = subprocess.Popen(
    ['python3'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Send commands and receive output
stdout, stderr = process.communicate(input='print("Hello from subprocess!")\n')
print(stdout)
```

### Process Chaining (Pipes)

Replicate shell pipes like `ls | grep ".py"`:

```python
import subprocess

# Method 1: Using shell=True (simpler but less secure)
result = subprocess.run(
    'ls -la | grep ".py"',
    shell=True,
    capture_output=True,
    text=True
)

# Method 2: Chaining Popen objects (more secure)
p1 = subprocess.Popen(
    ['ls', '-la'],
    stdout=subprocess.PIPE
)
p2 = subprocess.Popen(
    ['grep', '.py'],
    stdin=p1.stdout,
    stdout=subprocess.PIPE,
    text=True
)

# Allow p1 to receive SIGPIPE if p2 exits
p1.stdout.close()

output = p2.communicate()[0]
print(output)
```

### Complex Pipeline Example

```python
import subprocess

def pipeline(*commands):
    """Execute a pipeline of commands."""
    processes = []
    prev_stdout = None

    for i, cmd in enumerate(commands):
        stdin = prev_stdout
        stdout = subprocess.PIPE

        process = subprocess.Popen(
            cmd,
            stdin=stdin,
            stdout=stdout,
            stderr=subprocess.PIPE,
            text=True
        )

        if prev_stdout:
            prev_stdout.close()

        processes.append(process)
        prev_stdout = process.stdout

    # Get output from last process
    output, error = processes[-1].communicate()

    # Wait for all processes
    for process in processes[:-1]:
        process.wait()

    return output

# Usage
result = pipeline(
    ['cat', '/etc/passwd'],
    ['grep', 'root'],
    ['cut', '-d:', '-f1']
)
print(result)
```

## Working with stdin, stdout, and stderr

### Redirecting to Files

```python
import subprocess

# Redirect stdout to a file
with open('output.txt', 'w') as f:
    subprocess.run(['ls', '-la'], stdout=f)

# Redirect both stdout and stderr to the same file
with open('all_output.txt', 'w') as f:
    subprocess.run(
        ['ls', '-la', '/nonexistent'],
        stdout=f,
        stderr=subprocess.STDOUT
    )

# Separate files for stdout and stderr
with open('stdout.txt', 'w') as out, open('stderr.txt', 'w') as err:
    subprocess.run(
        ['ls', '-la', '/nonexistent'],
        stdout=out,
        stderr=err
    )
```

### Suppressing Output

```python
import subprocess

# Suppress all output
result = subprocess.run(
    ['ls', '-la'],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

# Only suppress stderr
result = subprocess.run(
    ['ls', '-la', '/nonexistent'],
    capture_output=False,
    stderr=subprocess.DEVNULL
)
```

### Merging stdout and stderr

```python
import subprocess

result = subprocess.run(
    ['ls', '-la', '/nonexistent'],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,  # Merge stderr into stdout
    text=True
)
print(result.stdout)  # Contains both stdout and stderr
```

## Environment Variables

### Passing Environment Variables

```python
import subprocess
import os

# Method 1: Replace entire environment
result = subprocess.run(
    ['printenv'],
    env={'MY_VAR': 'my_value', 'PATH': '/usr/bin'},
    capture_output=True,
    text=True
)

# Method 2: Modify current environment
my_env = os.environ.copy()
my_env['MY_VAR'] = 'my_value'
my_env['ANOTHER_VAR'] = 'another_value'

result = subprocess.run(
    ['bash', '-c', 'echo $MY_VAR $ANOTHER_VAR'],
    env=my_env,
    capture_output=True,
    text=True
)
print(result.stdout)  # my_value another_value
```

### Reading Environment from Subprocess

```python
import subprocess

# Get environment variable from subprocess
result = subprocess.run(
    ['bash', '-c', 'echo $HOME'],
    capture_output=True,
    text=True
)
print(result.stdout.strip())
```

## Working Directory

Change the working directory for the subprocess:

```python
import subprocess

# Run command in specific directory
result = subprocess.run(
    ['ls', '-la'],
    cwd='/tmp',
    capture_output=True,
    text=True
)
print(result.stdout)

# Useful for git commands
result = subprocess.run(
    ['git', 'status'],
    cwd='/path/to/repo',
    capture_output=True,
    text=True
)
```

## Error Handling

### Comprehensive Error Handling

```python
import subprocess

def run_command(cmd, timeout=30):
    """Run a command with comprehensive error handling."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=True
        )
        return result.stdout

    except subprocess.CalledProcessError as e:
        print(f"Command failed with exit code {e.returncode}")
        print(f"Command: {e.cmd}")
        print(f"Stderr: {e.stderr}")
        raise

    except subprocess.TimeoutExpired as e:
        print(f"Command timed out after {e.timeout} seconds")
        print(f"Command: {e.cmd}")
        if e.stdout:
            print(f"Partial stdout: {e.stdout}")
        if e.stderr:
            print(f"Partial stderr: {e.stderr}")
        raise

    except FileNotFoundError as e:
        print(f"Command not found: {cmd[0]}")
        raise

    except PermissionError as e:
        print(f"Permission denied executing: {cmd[0]}")
        raise

# Usage
try:
    output = run_command(['ls', '-la'])
    print(output)
except Exception as e:
    print(f"Error: {e}")
```

### Exception Types

| Exception | Cause |
|-----------|-------|
| `CalledProcessError` | Command returned non-zero exit code (with `check=True`) |
| `TimeoutExpired` | Command exceeded timeout |
| `FileNotFoundError` | Command executable not found |
| `PermissionError` | No permission to execute command |
| `OSError` | Other OS-level errors |

## Practical Examples

### Running System Commands

```python
import subprocess
import platform

def get_system_info():
    """Get system information using subprocess."""
    info = {}

    # Get hostname
    result = subprocess.run(
        ['hostname'],
        capture_output=True,
        text=True
    )
    info['hostname'] = result.stdout.strip()

    # Get current user
    result = subprocess.run(
        ['whoami'],
        capture_output=True,
        text=True
    )
    info['user'] = result.stdout.strip()

    # Get disk usage
    result = subprocess.run(
        ['df', '-h', '/'],
        capture_output=True,
        text=True
    )
    info['disk'] = result.stdout

    return info

system_info = get_system_info()
for key, value in system_info.items():
    print(f"{key}: {value}")
```

### Git Operations

```python
import subprocess
from pathlib import Path

class GitRepo:
    def __init__(self, path):
        self.path = Path(path)

    def _run(self, *args):
        """Run a git command and return output."""
        result = subprocess.run(
            ['git'] + list(args),
            cwd=self.path,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()

    def status(self):
        """Get repository status."""
        return self._run('status', '--short')

    def current_branch(self):
        """Get current branch name."""
        return self._run('branch', '--show-current')

    def commit(self, message):
        """Create a commit."""
        return self._run('commit', '-m', message)

    def log(self, n=5):
        """Get recent commits."""
        return self._run('log', f'-{n}', '--oneline')

    def diff(self, staged=False):
        """Get diff of changes."""
        if staged:
            return self._run('diff', '--staged')
        return self._run('diff')

# Usage
repo = GitRepo('/path/to/repo')
print(repo.current_branch())
print(repo.status())
```

### Process Monitoring

```python
import subprocess
import time

def monitor_process(cmd, interval=1):
    """Monitor a long-running process."""
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    print(f"Started process with PID: {process.pid}")

    while True:
        # Check if process is still running
        return_code = process.poll()

        if return_code is not None:
            # Process finished
            stdout, stderr = process.communicate()
            print(f"Process finished with code: {return_code}")
            return return_code, stdout, stderr

        print(f"Process {process.pid} still running...")
        time.sleep(interval)

# Usage
code, out, err = monitor_process(['sleep', '5'])
```

### Running Commands in Parallel

```python
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

def run_command(cmd):
    """Run a command and return result."""
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True
    )
    return {
        'command': ' '.join(cmd),
        'returncode': result.returncode,
        'stdout': result.stdout,
        'stderr': result.stderr
    }

def run_parallel(commands, max_workers=4):
    """Run multiple commands in parallel."""
    results = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(run_command, cmd): cmd
            for cmd in commands
        }

        for future in as_completed(futures):
            cmd = futures[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                results.append({
                    'command': ' '.join(cmd),
                    'error': str(e)
                })

    return results

# Usage
commands = [
    ['ls', '-la'],
    ['pwd'],
    ['whoami'],
    ['date'],
]

results = run_parallel(commands)
for result in results:
    print(f"Command: {result['command']}")
    print(f"Output: {result.get('stdout', result.get('error'))}")
    print()
```

### Download with Progress

```python
import subprocess
import sys

def download_with_progress(url, output_file):
    """Download file using wget with progress."""
    process = subprocess.Popen(
        ['wget', '--progress=dot:giga', '-O', output_file, url],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    for line in process.stdout:
        # Parse wget progress output
        if '%' in line:
            sys.stdout.write(f'\rDownloading: {line.strip()}')
            sys.stdout.flush()

    process.wait()
    print()  # New line after progress

    if process.returncode == 0:
        print(f"Downloaded successfully: {output_file}")
    else:
        print(f"Download failed with code: {process.returncode}")

    return process.returncode

# Usage
# download_with_progress('https://example.com/file.zip', 'file.zip')
```

### Command Wrapper Class

```python
import subprocess
import shlex
from dataclasses import dataclass
from typing import Optional, List, Dict

@dataclass
class CommandResult:
    command: List[str]
    returncode: int
    stdout: str
    stderr: str
    success: bool

class Command:
    """Wrapper for subprocess operations."""

    def __init__(
        self,
        cmd: str | List[str],
        cwd: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None
    ):
        if isinstance(cmd, str):
            self.cmd = shlex.split(cmd)
        else:
            self.cmd = cmd
        self.cwd = cwd
        self.env = env
        self.timeout = timeout

    def run(self, check: bool = False) -> CommandResult:
        """Execute the command."""
        try:
            result = subprocess.run(
                self.cmd,
                cwd=self.cwd,
                env=self.env,
                timeout=self.timeout,
                capture_output=True,
                text=True,
                check=check
            )
            return CommandResult(
                command=self.cmd,
                returncode=result.returncode,
                stdout=result.stdout,
                stderr=result.stderr,
                success=result.returncode == 0
            )
        except subprocess.CalledProcessError as e:
            return CommandResult(
                command=self.cmd,
                returncode=e.returncode,
                stdout=e.stdout or '',
                stderr=e.stderr or '',
                success=False
            )
        except subprocess.TimeoutExpired as e:
            return CommandResult(
                command=self.cmd,
                returncode=-1,
                stdout=e.stdout or '' if hasattr(e, 'stdout') else '',
                stderr=f'Timeout after {e.timeout}s',
                success=False
            )

    def __or__(self, other: 'Command') -> 'PipelineCommand':
        """Enable pipe syntax: cmd1 | cmd2"""
        return PipelineCommand([self, other])

class PipelineCommand:
    """Handle piped commands."""

    def __init__(self, commands: List[Command]):
        self.commands = commands

    def __or__(self, other: Command) -> 'PipelineCommand':
        return PipelineCommand(self.commands + [other])

    def run(self) -> CommandResult:
        """Execute the pipeline."""
        prev_stdout = None
        processes = []

        for cmd in self.commands:
            process = subprocess.Popen(
                cmd.cmd,
                stdin=prev_stdout,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=cmd.cwd,
                env=cmd.env,
                text=True
            )
            if prev_stdout:
                prev_stdout.close()
            processes.append(process)
            prev_stdout = process.stdout

        stdout, stderr = processes[-1].communicate()

        for process in processes[:-1]:
            process.wait()

        return CommandResult(
            command=[c.cmd for c in self.commands],
            returncode=processes[-1].returncode,
            stdout=stdout,
            stderr=stderr,
            success=processes[-1].returncode == 0
        )

# Usage
cmd = Command('ls -la')
result = cmd.run()
print(result.stdout)

# Pipeline
pipeline = Command('cat /etc/passwd') | Command('grep root') | Command('cut -d: -f1')
result = pipeline.run()
print(result.stdout)
```

## Cross-platform Considerations

### Windows vs Unix

```python
import subprocess
import platform
import shutil

def get_directory_listing():
    """Cross-platform directory listing."""
    if platform.system() == 'Windows':
        cmd = ['dir']
        shell = True
    else:
        cmd = ['ls', '-la']
        shell = False

    return subprocess.run(
        cmd,
        shell=shell,
        capture_output=True,
        text=True
    )

def find_executable(name):
    """Find an executable cross-platform."""
    # shutil.which works cross-platform
    path = shutil.which(name)
    if path:
        return path

    # Fallback for Windows
    if platform.system() == 'Windows':
        result = subprocess.run(
            ['where', name],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return result.stdout.strip().split('\n')[0]

    return None

# Usage
python_path = find_executable('python3') or find_executable('python')
print(f"Python at: {python_path}")
```

### Shell Selection

```python
import subprocess
import platform

def run_shell_command(command):
    """Run a shell command cross-platform."""
    if platform.system() == 'Windows':
        # Use cmd.exe on Windows
        shell_cmd = ['cmd', '/c', command]
    else:
        # Use bash on Unix-like systems
        shell_cmd = ['bash', '-c', command]

    return subprocess.run(
        shell_cmd,
        capture_output=True,
        text=True
    )

result = run_shell_command('echo Hello World')
print(result.stdout)
```

## Performance Tips

### Avoid shell=True When Possible

```python
import subprocess

# Slower - spawns shell process
subprocess.run('ls -la', shell=True)

# Faster - direct execution
subprocess.run(['ls', '-la'])
```

### Reuse Popen for Multiple Commands

```python
import subprocess

# For many short commands, use a persistent shell
process = subprocess.Popen(
    ['bash'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

commands = ['pwd', 'ls', 'whoami']
for cmd in commands:
    process.stdin.write(cmd + '\n')
    process.stdin.flush()

process.stdin.close()
output = process.stdout.read()
print(output)
```

### Use bufsize for Large Outputs

```python
import subprocess

# For large outputs, increase buffer size
process = subprocess.Popen(
    ['command_with_large_output'],
    stdout=subprocess.PIPE,
    bufsize=1024 * 1024  # 1MB buffer
)
```

### Stream Large Outputs

```python
import subprocess

def process_large_output(cmd):
    """Process large output without loading into memory."""
    with subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        text=True,
        bufsize=1
    ) as process:
        for line in process.stdout:
            # Process line by line
            yield line.strip()

for line in process_large_output(['find', '/', '-name', '*.py']):
    print(line)
```

## Common Pitfalls

### Deadlock with communicate()

```python
import subprocess

# WRONG - May deadlock if output is large
process = subprocess.Popen(
    ['cat', 'large_file.txt'],
    stdout=subprocess.PIPE
)
# Reading all at once - blocks
output = process.stdout.read()  # May deadlock!

# CORRECT - Use communicate()
process = subprocess.Popen(
    ['cat', 'large_file.txt'],
    stdout=subprocess.PIPE
)
output, _ = process.communicate()  # Safe

# OR stream the output
process = subprocess.Popen(
    ['cat', 'large_file.txt'],
    stdout=subprocess.PIPE,
    text=True
)
for line in process.stdout:
    print(line, end='')
process.wait()
```

### Not Handling Encoding

```python
import subprocess

# May fail with non-ASCII characters
result = subprocess.run(
    ['cat', 'unicode_file.txt'],
    capture_output=True,
    text=True  # Uses system default encoding
)

# Specify encoding explicitly
result = subprocess.run(
    ['cat', 'unicode_file.txt'],
    capture_output=True,
    text=True,
    encoding='utf-8',
    errors='replace'  # Handle encoding errors gracefully
)
```

### Ignoring Return Codes

```python
import subprocess

# BAD - Ignoring failure
result = subprocess.run(['rm', 'important_file.txt'])
# File might not have been deleted!

# GOOD - Check return code
result = subprocess.run(['rm', 'important_file.txt'])
if result.returncode != 0:
    print("Failed to delete file")

# BETTER - Use check=True
try:
    subprocess.run(['rm', 'important_file.txt'], check=True)
except subprocess.CalledProcessError:
    print("Failed to delete file")
```

### Resource Leaks

```python
import subprocess

# BAD - Process not properly closed
process = subprocess.Popen(['long_running_command'])
# ... if exception occurs, process may be orphaned

# GOOD - Use context manager
with subprocess.Popen(['long_running_command']) as process:
    # Process is automatically terminated on exception
    pass

# GOOD - Explicit cleanup
process = subprocess.Popen(['long_running_command'])
try:
    process.wait(timeout=30)
except subprocess.TimeoutExpired:
    process.kill()
    process.wait()
```

## Summary

The subprocess module is essential for system interaction in Python. Key takeaways:

| Use Case | Recommended Approach |
|----------|---------------------|
| Simple command execution | `subprocess.run()` with `capture_output=True` |
| Check for errors | `subprocess.run()` with `check=True` |
| Real-time output streaming | `Popen` with line-by-line reading |
| Command pipelines | Chain `Popen` objects |
| Interactive processes | `Popen` with `communicate()` |
| Cross-platform | Avoid `shell=True`, use `shutil.which()` |
| Security | Never use `shell=True` with user input |

Best practices:

- Always specify `text=True` for string I/O
- Use `check=True` to catch command failures
- Set appropriate timeouts for long-running commands
- Handle `CalledProcessError` and `TimeoutExpired` exceptions
- Avoid `shell=True` with untrusted input
- Use `communicate()` to prevent deadlocks
- Close process resources properly with context managers

The subprocess module provides everything you need to execute external commands safely and efficiently in Python applications.
