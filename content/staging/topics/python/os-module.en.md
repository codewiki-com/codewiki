---
title: Python os Module
description: Master Python os module for file system operations, environment variables, and process management
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - os
  - filesystem
  - system programming
status: imported
origin: old/src/content/docs/python/os-module.en.md
divergence: 0.263
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 34
  lastUpdated: 2026-01-07
---

The `os` module is one of Python's most essential standard library modules, providing a portable way to interact with the operating system. It offers functions for file and directory manipulation, environment variables, process management, and much more. Understanding the `os` module is fundamental for system programming, automation, and building cross-platform applications.

## Overview and Import

The `os` module provides a unified interface for operating system functionality regardless of the underlying platform:

```python
import os

# Check the current operating system
print(os.name)  # 'posix' on Linux/macOS, 'nt' on Windows

# Get more detailed platform information
import sys
print(sys.platform)  # 'linux', 'darwin', 'win32'
```

### Module Organization

The `os` module contains several submodules and categories of functionality:

- **File and directory operations**: Creating, removing, and navigating directories
- **Path manipulation**: `os.path` submodule for path operations
- **Environment variables**: Accessing and modifying environment variables
- **Process management**: Process creation, termination, and signals
- **File descriptors**: Low-level file operations
- **System information**: Information about the system and user

## Working with Environment Variables

Environment variables are key-value pairs that configure the operating environment for processes. The `os` module provides comprehensive tools for managing them.

### Accessing Environment Variables

```python
import os

# Access a specific environment variable
home = os.environ.get('HOME')
print(f"Home directory: {home}")

# Using get() with a default value
debug_mode = os.environ.get('DEBUG', 'false')
print(f"Debug mode: {debug_mode}")

# Direct access (raises KeyError if not found)
try:
    path = os.environ['PATH']
    print(f"PATH: {path}")
except KeyError:
    print("PATH not set")

# Check if variable exists
if 'VIRTUAL_ENV' in os.environ:
    print(f"Running in virtualenv: {os.environ['VIRTUAL_ENV']}")

# Get all environment variables
for key, value in os.environ.items():
    print(f"{key}={value}")
```

### Modifying Environment Variables

```python
import os

# Set an environment variable
os.environ['MY_APP_CONFIG'] = '/etc/myapp/config.json'

# Modify PATH
os.environ['PATH'] = '/custom/bin:' + os.environ.get('PATH', '')

# Remove an environment variable
if 'TEMP_VAR' in os.environ:
    del os.environ['TEMP_VAR']

# Alternative: pop with default
removed = os.environ.pop('OLD_VAR', None)

# Using putenv() and unsetenv() - lower level
os.putenv('DIRECT_VAR', 'value')  # Does not update os.environ
os.unsetenv('DIRECT_VAR')         # Does not update os.environ
# Note: Prefer os.environ for consistency
```

### Environment Variable Utilities

```python
import os

# Expand environment variables in strings
path_template = '$HOME/documents/$USER'
expanded = os.path.expandvars(path_template)
print(expanded)  # /home/username/documents/username

# Get specific common variables
print(os.getlogin())     # Current logged-in user
print(os.getuid())       # User ID (Unix)
print(os.getgid())       # Group ID (Unix)
print(os.getpid())       # Process ID
print(os.getppid())      # Parent process ID

# Get user's home directory
print(os.path.expanduser('~'))  # /home/username
```

## File and Directory Operations

The `os` module provides extensive functionality for manipulating files and directories.

### Getting Current Working Directory

```python
import os

# Get current working directory
cwd = os.getcwd()
print(f"Current directory: {cwd}")

# Get current directory as bytes (useful for non-UTF8 filesystems)
cwd_bytes = os.getcwdb()
print(f"Current directory (bytes): {cwd_bytes}")
```

### Changing Directories

```python
import os

# Change to a specific directory
os.chdir('/tmp')
print(os.getcwd())  # /tmp

# Change to home directory
os.chdir(os.path.expanduser('~'))
print(os.getcwd())

# Context manager for temporary directory change
from contextlib import contextmanager

@contextmanager
def change_dir(path):
    """Temporarily change directory."""
    original = os.getcwd()
    try:
        os.chdir(path)
        yield
    finally:
        os.chdir(original)

# Usage
with change_dir('/tmp'):
    print(f"Inside: {os.getcwd()}")  # /tmp
print(f"Outside: {os.getcwd()}")     # Original directory
```

### Listing Directory Contents

```python
import os

# List all entries in a directory
entries = os.listdir('.')
print(entries)  # ['file1.txt', 'dir1', 'file2.py', ...]

# List specific directory
entries = os.listdir('/home')
print(entries)

# List as bytes (for non-UTF8 filenames)
entries_bytes = os.listdir(b'/home')

# Using scandir() for better performance (Python 3.5+)
with os.scandir('.') as entries:
    for entry in entries:
        print(f"Name: {entry.name}")
        print(f"Path: {entry.path}")
        print(f"Is file: {entry.is_file()}")
        print(f"Is dir: {entry.is_dir()}")
        print(f"Is symlink: {entry.is_symlink()}")
        # Get stat info without extra system call
        stat_info = entry.stat()
        print(f"Size: {stat_info.st_size}")
        print()
```

### Creating Directories

```python
import os

# Create a single directory
os.mkdir('new_directory')

# Create with specific permissions (Unix)
os.mkdir('secure_dir', mode=0o700)

# Create nested directories (like mkdir -p)
os.makedirs('parent/child/grandchild')

# Create nested directories, ignore if exists
os.makedirs('parent/child/grandchild', exist_ok=True)

# Create with specific permissions
os.makedirs('secure/nested/dir', mode=0o755, exist_ok=True)
```

### Removing Files and Directories

```python
import os

# Remove a file
os.remove('file_to_delete.txt')
# Alternative name
os.unlink('another_file.txt')

# Remove an empty directory
os.rmdir('empty_directory')

# Remove nested empty directories
os.removedirs('parent/child/grandchild')
# Note: Removes directories from right to left until non-empty

# For removing non-empty directories, use shutil
import shutil
shutil.rmtree('directory_with_contents')

# Safe removal with error handling
def safe_remove(path):
    """Remove file or directory safely."""
    try:
        if os.path.isfile(path):
            os.remove(path)
        elif os.path.isdir(path):
            os.rmdir(path)
    except FileNotFoundError:
        pass  # Already removed
    except OSError as e:
        print(f"Error removing {path}: {e}")
```

### Renaming and Moving

```python
import os

# Rename a file or directory
os.rename('old_name.txt', 'new_name.txt')

# Move file to different directory
os.rename('file.txt', '/tmp/file.txt')

# Replace destination if it exists (Python 3.3+)
os.replace('source.txt', 'destination.txt')

# Rename with intermediate directories (creates if needed)
os.renames('old/path/file.txt', 'new/path/file.txt')
# Note: Also removes empty directories from old path

# Cross-device move (rename may fail across filesystems)
import shutil
shutil.move('source.txt', '/different/filesystem/dest.txt')
```

### File Permissions and Ownership

```python
import os
import stat

# Get file permissions
mode = os.stat('file.txt').st_mode
print(f"Mode: {oct(mode)}")

# Check specific permissions
print(f"Readable: {bool(mode & stat.S_IRUSR)}")
print(f"Writable: {bool(mode & stat.S_IWUSR)}")
print(f"Executable: {bool(mode & stat.S_IXUSR)}")

# Change file permissions
os.chmod('script.py', 0o755)  # rwxr-xr-x
os.chmod('private.txt', 0o600)  # rw-------

# Change using stat constants
os.chmod('file.txt', stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP)

# Change ownership (Unix only, requires appropriate privileges)
os.chown('file.txt', uid=1000, gid=1000)

# Change just the user or group
os.chown('file.txt', uid=1000, gid=-1)  # -1 means don't change

# Recursive permission change
def chmod_recursive(path, mode):
    """Change permissions recursively."""
    for root, dirs, files in os.walk(path):
        for d in dirs:
            os.chmod(os.path.join(root, d), mode)
        for f in files:
            os.chmod(os.path.join(root, f), mode)
```

## The os.path Submodule

The `os.path` submodule provides functions for manipulating file paths in a cross-platform manner.

### Path Components

```python
import os.path

path = '/home/user/documents/report.txt'

# Get the filename
print(os.path.basename(path))  # report.txt

# Get the directory
print(os.path.dirname(path))   # /home/user/documents

# Split into directory and filename
directory, filename = os.path.split(path)
print(f"Dir: {directory}, File: {filename}")

# Get the file extension
root, ext = os.path.splitext(path)
print(f"Root: {root}, Extension: {ext}")  # /home/user/documents/report, .txt

# Split drive (useful on Windows)
drive, tail = os.path.splitdrive('C:\\Users\\Documents\\file.txt')
print(f"Drive: {drive}, Path: {tail}")  # C:, \Users\Documents\file.txt
```

### Building Paths

```python
import os.path

# Join path components
full_path = os.path.join('/home', 'user', 'documents', 'file.txt')
print(full_path)  # /home/user/documents/file.txt

# Join handles absolute paths correctly
path = os.path.join('/home/user', '/etc/config')
print(path)  # /etc/config (second absolute path takes over)

# Normalize a path
messy_path = '/home/user/../user/./documents//file.txt'
clean_path = os.path.normpath(messy_path)
print(clean_path)  # /home/user/documents/file.txt

# Get absolute path
relative = 'documents/file.txt'
absolute = os.path.abspath(relative)
print(absolute)  # /current/working/dir/documents/file.txt

# Get real path (resolve symlinks)
real = os.path.realpath('/usr/bin/python')
print(real)  # Actual path, not symlink

# Get common prefix of paths
common = os.path.commonpath([
    '/home/user/documents/a.txt',
    '/home/user/documents/b.txt',
    '/home/user/pictures/c.txt'
])
print(common)  # /home/user

# Common prefix (character-based, use with caution)
prefix = os.path.commonprefix([
    '/home/user/documents',
    '/home/user/downloads'
])
print(prefix)  # /home/user/do (not useful!)
```

### Path Queries

```python
import os.path

path = '/home/user/documents/file.txt'

# Check if path exists
print(os.path.exists(path))      # True/False

# Check if it's a file
print(os.path.isfile(path))      # True/False

# Check if it's a directory
print(os.path.isdir('/home'))    # True

# Check if it's an absolute path
print(os.path.isabs(path))       # True
print(os.path.isabs('relative')) # False

# Check if it's a symbolic link
print(os.path.islink('/usr/bin/python'))

# Check if it's a mount point
print(os.path.ismount('/'))      # True

# Check if two paths refer to the same file
print(os.path.samefile('/home/user', os.path.expanduser('~')))
```

### File Information

```python
import os.path
import time

path = '/home/user/documents/file.txt'

# Get file size in bytes
size = os.path.getsize(path)
print(f"Size: {size} bytes")

# Get modification time
mtime = os.path.getmtime(path)
print(f"Modified: {time.ctime(mtime)}")

# Get access time
atime = os.path.getatime(path)
print(f"Accessed: {time.ctime(atime)}")

# Get creation time (or metadata change time on Unix)
ctime = os.path.getctime(path)
print(f"Created/Changed: {time.ctime(ctime)}")
```

### User Path Expansion

```python
import os.path

# Expand ~ to home directory
home_path = os.path.expanduser('~/documents')
print(home_path)  # /home/username/documents

# Expand another user's home
other_home = os.path.expanduser('~otheruser/documents')
print(other_home)  # /home/otheruser/documents

# Expand environment variables
config_path = os.path.expandvars('$HOME/config/$APP_NAME')
print(config_path)

# Combined expansion
full_path = os.path.expandvars(os.path.expanduser('~/$MY_DIR'))
print(full_path)
```

## Walking Directory Trees

The `os.walk()` function is powerful for traversing directory structures.

### Basic Usage

```python
import os

# Walk through a directory tree
for root, dirs, files in os.walk('/home/user/project'):
    print(f"Directory: {root}")
    print(f"Subdirectories: {dirs}")
    print(f"Files: {files}")
    print()

# Get full paths
for root, dirs, files in os.walk('.'):
    for file in files:
        full_path = os.path.join(root, file)
        print(full_path)
```

### Controlling Directory Traversal

```python
import os

# Top-down (default) - can modify dirs to control recursion
for root, dirs, files in os.walk('/project', topdown=True):
    # Exclude hidden directories and __pycache__
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']

    for file in files:
        if file.endswith('.py'):
            print(os.path.join(root, file))

# Bottom-up traversal
for root, dirs, files in os.walk('/project', topdown=False):
    # Process children before parents
    print(f"Processing: {root}")

# Follow symbolic links
for root, dirs, files in os.walk('/project', followlinks=True):
    # Be careful of infinite loops with circular symlinks
    pass
```

### Practical Examples

```python
import os

def find_files(directory, extension):
    """Find all files with a specific extension."""
    matches = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(extension):
                matches.append(os.path.join(root, file))
    return matches

# Find all Python files
python_files = find_files('/project', '.py')

def get_directory_size(directory):
    """Calculate total size of a directory."""
    total = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            path = os.path.join(root, file)
            try:
                total += os.path.getsize(path)
            except OSError:
                pass  # Skip inaccessible files
    return total

size = get_directory_size('/home/user')
print(f"Total size: {size / 1024 / 1024:.2f} MB")

def find_duplicates_by_size(directory):
    """Find potential duplicate files by size."""
    size_map = {}
    for root, dirs, files in os.walk(directory):
        for file in files:
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                if size in size_map:
                    size_map[size].append(path)
                else:
                    size_map[size] = [path]
            except OSError:
                pass

    return {s: paths for s, paths in size_map.items() if len(paths) > 1}
```

## File Statistics with os.stat()

The `os.stat()` function returns detailed information about a file.

### Basic Usage

```python
import os
import stat
import time

path = '/home/user/file.txt'

# Get file statistics
st = os.stat(path)

print(f"Mode: {oct(st.st_mode)}")        # File type and permissions
print(f"Inode: {st.st_ino}")             # Inode number
print(f"Device: {st.st_dev}")            # Device ID
print(f"Hard links: {st.st_nlink}")      # Number of hard links
print(f"UID: {st.st_uid}")               # Owner user ID
print(f"GID: {st.st_gid}")               # Owner group ID
print(f"Size: {st.st_size}")             # Size in bytes
print(f"Access time: {time.ctime(st.st_atime)}")   # Last access
print(f"Modify time: {time.ctime(st.st_mtime)}")   # Last modification
print(f"Change time: {time.ctime(st.st_ctime)}")   # Metadata change (Unix) / creation (Windows)
```

### Interpreting File Mode

```python
import os
import stat

st = os.stat('/home/user/file.txt')
mode = st.st_mode

# Check file type
print(f"Regular file: {stat.S_ISREG(mode)}")
print(f"Directory: {stat.S_ISDIR(mode)}")
print(f"Symbolic link: {stat.S_ISLNK(mode)}")
print(f"Socket: {stat.S_ISSOCK(mode)}")
print(f"FIFO: {stat.S_ISFIFO(mode)}")
print(f"Block device: {stat.S_ISBLK(mode)}")
print(f"Character device: {stat.S_ISCHR(mode)}")

# Check permissions
print(f"Owner can read: {bool(mode & stat.S_IRUSR)}")
print(f"Owner can write: {bool(mode & stat.S_IWUSR)}")
print(f"Owner can execute: {bool(mode & stat.S_IXUSR)}")
print(f"Group can read: {bool(mode & stat.S_IRGRP)}")
print(f"Others can read: {bool(mode & stat.S_IROTH)}")

# Check special bits
print(f"Setuid: {bool(mode & stat.S_ISUID)}")
print(f"Setgid: {bool(mode & stat.S_ISGID)}")
print(f"Sticky: {bool(mode & stat.S_ISVTX)}")

# Format permissions like ls -l
def format_permissions(mode):
    """Format file permissions like ls -l."""
    chars = ['r', 'w', 'x']
    result = ''

    for who in [stat.S_IRUSR, stat.S_IRGRP, stat.S_IROTH]:
        base = who
        for i, c in enumerate(chars):
            result += c if mode & (base >> i) else '-'

    return result

print(format_permissions(mode))  # e.g., rw-r--r--
```

### Symbolic Links

```python
import os

# stat follows symbolic links
target_stat = os.stat('/path/to/symlink')

# lstat returns info about the link itself
link_stat = os.lstat('/path/to/symlink')

# Check if path is a symlink
if os.path.islink('/path/to/symlink'):
    # Get the target of the symlink
    target = os.readlink('/path/to/symlink')
    print(f"Symlink points to: {target}")
```

## Symbolic Links and Hard Links

### Creating Links

```python
import os

# Create a symbolic link
os.symlink('/path/to/target', '/path/to/symlink')

# Create symbolic link to a directory
os.symlink('/path/to/directory', '/path/to/dirlink', target_is_directory=True)

# Create a hard link
os.link('/path/to/original', '/path/to/hardlink')

# Read the target of a symbolic link
target = os.readlink('/path/to/symlink')
print(f"Link target: {target}")
```

### Working with Links

```python
import os

def resolve_symlink(path, max_depth=10):
    """Resolve a symlink, handling chains."""
    depth = 0
    while os.path.islink(path) and depth < max_depth:
        target = os.readlink(path)
        if not os.path.isabs(target):
            # Relative symlink - resolve relative to link location
            path = os.path.join(os.path.dirname(path), target)
        else:
            path = target
        depth += 1
    return os.path.normpath(path)

# Check for broken symlinks
def is_broken_symlink(path):
    """Check if path is a broken symbolic link."""
    return os.path.islink(path) and not os.path.exists(path)

# Find all symlinks in a directory
def find_symlinks(directory):
    """Find all symbolic links in a directory tree."""
    symlinks = []
    for root, dirs, files in os.walk(directory):
        for name in dirs + files:
            path = os.path.join(root, name)
            if os.path.islink(path):
                target = os.readlink(path)
                symlinks.append((path, target))
    return symlinks
```

## Temporary Files and Directories

The `os` module provides tools for working with temporary files, though `tempfile` module is often preferred.

```python
import os
import tempfile

# Get the default temp directory
print(tempfile.gettempdir())  # /tmp on Unix

# Using os module for temp directory
print(os.environ.get('TMPDIR', '/tmp'))

# Create a unique temporary filename
fd, path = tempfile.mkstemp(suffix='.txt', prefix='myapp_')
try:
    os.write(fd, b'temporary content')
finally:
    os.close(fd)
    os.unlink(path)

# Create a temporary directory
temp_dir = tempfile.mkdtemp(prefix='myapp_')
try:
    # Use the temporary directory
    temp_file = os.path.join(temp_dir, 'data.txt')
    with open(temp_file, 'w') as f:
        f.write('temporary data')
finally:
    import shutil
    shutil.rmtree(temp_dir)

# Using context managers (preferred)
with tempfile.TemporaryDirectory() as temp_dir:
    temp_file = os.path.join(temp_dir, 'data.txt')
    with open(temp_file, 'w') as f:
        f.write('data')
    # Directory is automatically cleaned up
```

## Process Management

The `os` module provides functions for process creation and management, though `subprocess` is often preferred for creating new processes.

### Process Information

```python
import os

# Current process information
print(f"Process ID: {os.getpid()}")
print(f"Parent process ID: {os.getppid()}")
print(f"Process group ID: {os.getpgrp()}")
print(f"Session ID: {os.getsid(0)}")

# User and group information (Unix)
print(f"User ID: {os.getuid()}")
print(f"Effective user ID: {os.geteuid()}")
print(f"Group ID: {os.getgid()}")
print(f"Effective group ID: {os.getegid()}")
print(f"Groups: {os.getgroups()}")

# Login name
try:
    print(f"Login name: {os.getlogin()}")
except OSError:
    # May fail in some environments
    import pwd
    print(f"User name: {pwd.getpwuid(os.getuid()).pw_name}")
```

### Creating Processes

```python
import os
import sys

# Fork a process (Unix only)
pid = os.fork()
if pid == 0:
    # Child process
    print(f"Child process: {os.getpid()}")
    os._exit(0)  # Exit child without cleanup
else:
    # Parent process
    print(f"Parent process: {os.getpid()}, child: {pid}")
    os.waitpid(pid, 0)  # Wait for child

# Execute a new program (replaces current process)
# os.execv('/bin/ls', ['ls', '-la'])

# Execute with PATH search
# os.execvp('ls', ['ls', '-la'])

# Execute with environment
# os.execve('/bin/ls', ['ls', '-la'], os.environ)

# Spawn a new process (more portable than fork)
pid = os.spawnlp(os.P_NOWAIT, 'ls', 'ls', '-la')
os.waitpid(pid, 0)

# For most use cases, prefer subprocess module
import subprocess
result = subprocess.run(['ls', '-la'], capture_output=True, text=True)
print(result.stdout)
```

### Process Control

```python
import os
import signal

# Send a signal to a process
os.kill(pid, signal.SIGTERM)  # Terminate
os.kill(pid, signal.SIGKILL)  # Force kill
os.kill(pid, signal.SIGSTOP)  # Stop/pause
os.kill(pid, signal.SIGCONT)  # Continue

# Send signal to process group
os.killpg(pgid, signal.SIGTERM)

# Wait for child process
pid, status = os.wait()  # Wait for any child
pid, status = os.waitpid(specific_pid, 0)  # Wait for specific child
pid, status = os.waitpid(-1, os.WNOHANG)  # Non-blocking wait

# Check exit status
if os.WIFEXITED(status):
    exit_code = os.WEXITSTATUS(status)
    print(f"Process exited with code: {exit_code}")
elif os.WIFSIGNALED(status):
    signal_num = os.WTERMSIG(status)
    print(f"Process killed by signal: {signal_num}")
```

## System Information

### System Identification

```python
import os

# Get system identification (Unix)
uname = os.uname()
print(f"System: {uname.sysname}")      # Linux, Darwin, etc.
print(f"Node: {uname.nodename}")        # Hostname
print(f"Release: {uname.release}")      # Kernel version
print(f"Version: {uname.version}")      # OS version
print(f"Machine: {uname.machine}")      # Architecture

# CPU count
print(f"CPU count: {os.cpu_count()}")

# System load averages (Unix)
load1, load5, load15 = os.getloadavg()
print(f"Load averages: {load1:.2f}, {load5:.2f}, {load15:.2f}")
```

### Terminal Information

```python
import os

# Get terminal size
try:
    size = os.get_terminal_size()
    print(f"Terminal: {size.columns} x {size.lines}")
except OSError:
    print("Not running in a terminal")

# Check if file descriptor is a terminal
print(f"stdin is tty: {os.isatty(0)}")
print(f"stdout is tty: {os.isatty(1)}")
print(f"stderr is tty: {os.isatty(2)}")

# Get terminal name
if os.isatty(0):
    print(f"Terminal: {os.ttyname(0)}")
```

### Filesystem Information

```python
import os

# Get filesystem statistics
stat = os.statvfs('/')
print(f"Block size: {stat.f_bsize}")
print(f"Total blocks: {stat.f_blocks}")
print(f"Free blocks: {stat.f_bfree}")
print(f"Available blocks: {stat.f_bavail}")
print(f"Total inodes: {stat.f_files}")
print(f"Free inodes: {stat.f_ffree}")

# Calculate disk space
total = stat.f_blocks * stat.f_bsize
free = stat.f_bavail * stat.f_bsize
used = total - free
print(f"Total: {total / 1024**3:.2f} GB")
print(f"Used: {used / 1024**3:.2f} GB")
print(f"Free: {free / 1024**3:.2f} GB")

# Disk usage helper function
def get_disk_usage(path):
    """Get disk usage statistics for a path."""
    stat = os.statvfs(path)
    total = stat.f_blocks * stat.f_bsize
    free = stat.f_bavail * stat.f_bsize
    used = total - free
    return {
        'total': total,
        'used': used,
        'free': free,
        'percent_used': (used / total) * 100
    }
```

## Low-Level File Operations

The `os` module provides low-level file operations using file descriptors.

### File Descriptors

```python
import os

# Open a file and get file descriptor
fd = os.open('file.txt', os.O_RDWR | os.O_CREAT, 0o644)

try:
    # Write to file
    os.write(fd, b'Hello, World!')

    # Seek to beginning
    os.lseek(fd, 0, os.SEEK_SET)

    # Read from file
    data = os.read(fd, 1024)
    print(data.decode())

    # Get file status
    stat = os.fstat(fd)
    print(f"Size: {stat.st_size}")

    # Truncate file
    os.ftruncate(fd, 5)

    # Sync to disk
    os.fsync(fd)
finally:
    os.close(fd)
```

### Open Flags

```python
import os

# Common flags for os.open()
flags = (
    os.O_RDONLY    # Read only
    | os.O_WRONLY  # Write only
    | os.O_RDWR    # Read and write
    | os.O_CREAT   # Create if doesn't exist
    | os.O_EXCL    # Fail if exists (with O_CREAT)
    | os.O_TRUNC   # Truncate to zero length
    | os.O_APPEND  # Append mode
)

# Exclusive creation (atomic)
try:
    fd = os.open('lockfile', os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
    # File created exclusively
    os.close(fd)
except FileExistsError:
    print("File already exists")
```

### Pipe Operations

```python
import os

# Create a pipe
read_fd, write_fd = os.pipe()

pid = os.fork()
if pid == 0:
    # Child process - write to pipe
    os.close(read_fd)
    os.write(write_fd, b'Hello from child!')
    os.close(write_fd)
    os._exit(0)
else:
    # Parent process - read from pipe
    os.close(write_fd)
    data = os.read(read_fd, 1024)
    print(f"Received: {data.decode()}")
    os.close(read_fd)
    os.waitpid(pid, 0)
```

### Duplicating File Descriptors

```python
import os
import sys

# Redirect stdout to a file
original_stdout = os.dup(1)  # Save original stdout

with open('output.txt', 'w') as f:
    os.dup2(f.fileno(), 1)  # Redirect stdout to file
    print("This goes to file")

os.dup2(original_stdout, 1)  # Restore stdout
os.close(original_stdout)
print("This goes to console")
```

## Random Data Generation

```python
import os

# Generate cryptographically secure random bytes
random_bytes = os.urandom(32)
print(f"Random bytes: {random_bytes.hex()}")

# Generate random integer
import struct
random_int = struct.unpack('I', os.urandom(4))[0]
print(f"Random integer: {random_int}")

# For most purposes, use secrets module (Python 3.6+)
import secrets
token = secrets.token_hex(16)
print(f"Secure token: {token}")
```

## Practical Examples

### Example 1: Cross-Platform File Manager

```python
import os
import shutil
from datetime import datetime

class FileManager:
    """Cross-platform file management utility."""

    @staticmethod
    def ensure_directory(path):
        """Create directory if it doesn't exist."""
        os.makedirs(path, exist_ok=True)
        return path

    @staticmethod
    def list_directory(path, pattern=None):
        """List directory contents with optional pattern matching."""
        import fnmatch
        entries = []

        with os.scandir(path) as scanner:
            for entry in scanner:
                if pattern and not fnmatch.fnmatch(entry.name, pattern):
                    continue

                stat = entry.stat()
                entries.append({
                    'name': entry.name,
                    'path': entry.path,
                    'is_file': entry.is_file(),
                    'is_dir': entry.is_dir(),
                    'size': stat.st_size,
                    'modified': datetime.fromtimestamp(stat.st_mtime)
                })

        return entries

    @staticmethod
    def get_size(path):
        """Get size of file or directory."""
        if os.path.isfile(path):
            return os.path.getsize(path)

        total = 0
        for root, dirs, files in os.walk(path):
            for f in files:
                try:
                    total += os.path.getsize(os.path.join(root, f))
                except OSError:
                    pass
        return total

    @staticmethod
    def safe_delete(path):
        """Safely delete a file or directory."""
        if os.path.isfile(path):
            os.remove(path)
        elif os.path.isdir(path):
            shutil.rmtree(path)

    @staticmethod
    def copy(src, dst, preserve_metadata=True):
        """Copy file or directory."""
        if os.path.isfile(src):
            if preserve_metadata:
                shutil.copy2(src, dst)
            else:
                shutil.copy(src, dst)
        else:
            shutil.copytree(src, dst)

# Usage
fm = FileManager()
fm.ensure_directory('/tmp/myapp/data')
files = fm.list_directory('/tmp', '*.txt')
```

### Example 2: Configuration Manager with Environment Variables

```python
import os
from typing import Any, Optional

class ConfigManager:
    """Configuration manager using environment variables."""

    def __init__(self, prefix: str = ''):
        self.prefix = prefix
        self._cache = {}

    def _get_key(self, name: str) -> str:
        """Get the full environment variable key."""
        if self.prefix:
            return f"{self.prefix}_{name}".upper()
        return name.upper()

    def get(self, name: str, default: Any = None,
            cast: type = str) -> Any:
        """Get a configuration value."""
        key = self._get_key(name)

        if key in self._cache:
            return self._cache[key]

        value = os.environ.get(key)
        if value is None:
            return default

        # Type casting
        if cast == bool:
            value = value.lower() in ('true', '1', 'yes', 'on')
        elif cast == list:
            value = value.split(',')
        else:
            value = cast(value)

        self._cache[key] = value
        return value

    def set(self, name: str, value: Any) -> None:
        """Set a configuration value."""
        key = self._get_key(name)
        os.environ[key] = str(value)
        self._cache[key] = value

    def require(self, name: str, cast: type = str) -> Any:
        """Get a required configuration value."""
        value = self.get(name, cast=cast)
        if value is None:
            raise ValueError(f"Required config '{name}' not set")
        return value

    def all(self) -> dict:
        """Get all configuration values with the prefix."""
        result = {}
        prefix = self.prefix.upper() + '_' if self.prefix else ''

        for key, value in os.environ.items():
            if prefix and key.startswith(prefix):
                name = key[len(prefix):].lower()
                result[name] = value
            elif not prefix:
                result[key.lower()] = value

        return result

# Usage
config = ConfigManager('MYAPP')
# Set MYAPP_DEBUG=true, MYAPP_PORT=8080 in environment

debug = config.get('debug', default=False, cast=bool)
port = config.get('port', default=8080, cast=int)
database_url = config.require('database_url')
```

### Example 3: File Watcher

```python
import os
import time
from collections import defaultdict
from typing import Callable, Set

class FileWatcher:
    """Watch files and directories for changes."""

    def __init__(self, paths: list, recursive: bool = False):
        self.paths = [os.path.abspath(p) for p in paths]
        self.recursive = recursive
        self._callbacks = defaultdict(list)
        self._state = {}
        self._scan()

    def _scan(self) -> dict:
        """Scan all paths and get current state."""
        state = {}

        for path in self.paths:
            if os.path.isfile(path):
                state[path] = self._get_file_info(path)
            elif os.path.isdir(path):
                if self.recursive:
                    for root, dirs, files in os.walk(path):
                        for f in files:
                            fp = os.path.join(root, f)
                            state[fp] = self._get_file_info(fp)
                else:
                    for f in os.listdir(path):
                        fp = os.path.join(path, f)
                        if os.path.isfile(fp):
                            state[fp] = self._get_file_info(fp)

        return state

    def _get_file_info(self, path: str) -> tuple:
        """Get file modification info."""
        try:
            stat = os.stat(path)
            return (stat.st_mtime, stat.st_size)
        except OSError:
            return None

    def on(self, event: str, callback: Callable) -> None:
        """Register a callback for an event."""
        self._callbacks[event].append(callback)

    def _emit(self, event: str, path: str) -> None:
        """Emit an event."""
        for callback in self._callbacks[event]:
            callback(path)

    def check(self) -> Set[str]:
        """Check for changes since last scan."""
        new_state = self._scan()
        changes = set()

        # Check for modified and deleted files
        for path, info in self._state.items():
            if path not in new_state:
                self._emit('deleted', path)
                changes.add(path)
            elif new_state[path] != info:
                self._emit('modified', path)
                changes.add(path)

        # Check for new files
        for path in new_state:
            if path not in self._state:
                self._emit('created', path)
                changes.add(path)

        self._state = new_state
        return changes

    def watch(self, interval: float = 1.0) -> None:
        """Watch continuously for changes."""
        self._state = self._scan()

        while True:
            time.sleep(interval)
            self.check()

# Usage
watcher = FileWatcher(['/path/to/watch'], recursive=True)
watcher.on('modified', lambda p: print(f"Modified: {p}"))
watcher.on('created', lambda p: print(f"Created: {p}"))
watcher.on('deleted', lambda p: print(f"Deleted: {p}"))
# watcher.watch()  # Start watching
```

### Example 4: Path Utilities

```python
import os
from typing import List, Optional

class PathUtils:
    """Utility functions for path manipulation."""

    @staticmethod
    def find_up(filename: str, start_dir: str = None) -> Optional[str]:
        """Find a file by walking up the directory tree."""
        current = start_dir or os.getcwd()

        while True:
            candidate = os.path.join(current, filename)
            if os.path.exists(candidate):
                return candidate

            parent = os.path.dirname(current)
            if parent == current:
                return None
            current = parent

    @staticmethod
    def relative_to(path: str, base: str) -> str:
        """Get path relative to base."""
        path = os.path.abspath(path)
        base = os.path.abspath(base)
        return os.path.relpath(path, base)

    @staticmethod
    def common_base(paths: List[str]) -> str:
        """Find the common base directory of multiple paths."""
        if not paths:
            return ''

        abs_paths = [os.path.abspath(p) for p in paths]
        return os.path.commonpath(abs_paths)

    @staticmethod
    def split_all(path: str) -> List[str]:
        """Split a path into all its components."""
        parts = []
        while True:
            head, tail = os.path.split(path)
            if tail:
                parts.insert(0, tail)
            elif head:
                parts.insert(0, head)
                break
            else:
                break
            path = head
        return parts

    @staticmethod
    def ensure_extension(path: str, extension: str) -> str:
        """Ensure a path has the specified extension."""
        if not extension.startswith('.'):
            extension = '.' + extension

        if not path.endswith(extension):
            return path + extension
        return path

    @staticmethod
    def unique_path(path: str) -> str:
        """Generate a unique path by adding numbers."""
        if not os.path.exists(path):
            return path

        base, ext = os.path.splitext(path)
        counter = 1

        while True:
            new_path = f"{base}_{counter}{ext}"
            if not os.path.exists(new_path):
                return new_path
            counter += 1

# Usage
config_file = PathUtils.find_up('config.json')
unique_file = PathUtils.unique_path('/tmp/output.txt')
```

## os Module vs pathlib

While `pathlib` (Python 3.4+) provides an object-oriented approach to path manipulation, the `os` module remains essential for:

| Feature | os Module | pathlib |
|---------|-----------|---------|
| Path manipulation | `os.path.*` | `Path` methods |
| Directory listing | `os.listdir()`, `os.scandir()` | `Path.iterdir()` |
| Environment variables | `os.environ` | Not available |
| Process management | `os.fork()`, `os.exec*()` | Not available |
| File descriptors | `os.open()`, `os.read()` | Not available |
| System information | `os.uname()`, `os.cpu_count()` | Not available |
| Permissions | `os.chmod()`, `os.chown()` | `Path.chmod()` (limited) |

```python
# Use pathlib for path manipulation
from pathlib import Path

p = Path('/home/user/documents')
files = list(p.glob('*.txt'))

# Use os for environment and system operations
import os

debug = os.environ.get('DEBUG', 'false')
os.chmod(str(p / 'script.py'), 0o755)
```

## Best Practices

### Use pathlib for Path Operations

```python
# Modern approach
from pathlib import Path

config_dir = Path.home() / '.config' / 'myapp'
config_dir.mkdir(parents=True, exist_ok=True)

# Legacy approach (still valid)
import os

config_dir = os.path.join(os.path.expanduser('~'), '.config', 'myapp')
os.makedirs(config_dir, exist_ok=True)
```

### Handle Errors Gracefully

```python
import os

def safe_operation(path):
    """Handle common file operation errors."""
    try:
        # Perform operation
        os.remove(path)
    except FileNotFoundError:
        pass  # File already deleted
    except PermissionError:
        print(f"Permission denied: {path}")
    except IsADirectoryError:
        print(f"Expected file, got directory: {path}")
    except OSError as e:
        print(f"OS error: {e}")
```

### Clean Up Resources

```python
import os
import tempfile
from contextlib import contextmanager

@contextmanager
def temp_directory():
    """Create and clean up a temporary directory."""
    temp_dir = tempfile.mkdtemp()
    try:
        yield temp_dir
    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

with temp_directory() as tmpdir:
    # Work with temporary directory
    pass
```

### Use Environment Variables Safely

```python
import os

# Good: Use get() with defaults
db_host = os.environ.get('DB_HOST', 'localhost')

# Good: Check before accessing
if 'API_KEY' in os.environ:
    api_key = os.environ['API_KEY']

# Good: Validate required variables at startup
required_vars = ['DATABASE_URL', 'SECRET_KEY']
missing = [v for v in required_vars if v not in os.environ]
if missing:
    raise RuntimeError(f"Missing required environment variables: {missing}")
```

### Be Cross-Platform Aware

```python
import os
import sys

# Use os.path.join for paths
path = os.path.join('dir', 'subdir', 'file.txt')

# Use os.sep for separator
parts = path.split(os.sep)

# Check platform for specific operations
if sys.platform == 'win32':
    # Windows-specific code
    pass
elif sys.platform == 'darwin':
    # macOS-specific code
    pass
else:
    # Linux/Unix code
    pass

# Use os.name for broader checks
if os.name == 'posix':
    # Unix-like system
    pass
elif os.name == 'nt':
    # Windows
    pass
```

### Prefer subprocess Over Legacy Functions

For running external commands, use the `subprocess` module instead of deprecated `os` functions:

```python
import subprocess

# Modern approach - use subprocess
result = subprocess.run(['ls', '-la'], capture_output=True, text=True)
print(result.stdout)

# Avoid legacy functions like os.popen()
```

## Summary

The `os` module is a foundational part of Python's standard library that provides:

- **Environment variables**: Access and modify environment variables with `os.environ`
- **File operations**: Create, delete, rename, and manage files and directories
- **Path manipulation**: The `os.path` submodule for cross-platform path operations
- **Directory traversal**: Walk directory trees with `os.walk()` and `os.scandir()`
- **Process management**: Create and control processes with fork, exec, and spawn
- **System information**: Get details about the system, user, and filesystem
- **Low-level file I/O**: Direct file descriptor operations for advanced use cases

Key recommendations:

1. Use `pathlib` for modern path manipulation when possible
2. Use `os.environ` for environment variable management
3. Use `subprocess` instead of legacy os functions for running commands
4. Always handle `OSError` and its subclasses for file operations
5. Use context managers and cleanup code for temporary resources
6. Be mindful of cross-platform differences when using Unix-specific features

The `os` module remains essential for system programming in Python, especially for operations that go beyond simple path manipulation, such as environment management, process control, and low-level file operations.
