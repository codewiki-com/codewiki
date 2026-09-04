---
title: Command-Line Argument Parsing
description: Complete guide to Python's argparse module for building professional command-line interfaces
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - argparse
  - CLI
  - Command Line
status: imported
origin: old/src/content/docs/python/argparse.en.md
divergence: 0.237
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 22
  lastUpdated: 2026-01-07
---

Command-line interfaces (CLI) are an important way to interact with programs. Python's `argparse` module provides a powerful and flexible set of tools for parsing command-line arguments, automatically generating help information, and validating arguments. Whether for simple scripts or complex command-line tools, argparse can help you build professional user interfaces.

## Why Choose argparse?

Compared to manually parsing `sys.argv`, argparse provides the following advantages:

- **Automatic help generation**: Automatically creates `-h/--help` options showing usage of all arguments
- **Type conversion**: Automatically converts string arguments to specified types (int, float, etc.)
- **Argument validation**: Automatically checks required arguments, argument value ranges, etc.
- **Error handling**: Provides user-friendly error messages
- **Subcommand support**: Easily implement git-style subcommand structures

## Quick Start

### Simplest Example

```python
import argparse

# Create parser
parser = argparse.ArgumentParser(description='A simple program')

# Add argument
parser.add_argument('name', help='Your name')

# Parse arguments
args = parser.parse_args()

# Use argument
print(f'Hello, {args.name}!')
```

Running output:

```bash
$ python hello.py John
Hello, John!

$ python hello.py --help
usage: hello.py [-h] name

A simple program

positional arguments:
  name        Your name

options:
  -h, --help  show this help message and exit
```

### Positional and Optional Arguments

argparse supports two types of arguments:

```python
import argparse

parser = argparse.ArgumentParser(description='File processing tool')

# Positional argument (required)
parser.add_argument('filename', help='File to process')

# Optional arguments (prefixed with - or --)
parser.add_argument('-o', '--output', help='Output filename')
parser.add_argument('-v', '--verbose', action='store_true', help='Show detailed information')

args = parser.parse_args()

print(f'Input file: {args.filename}')
print(f'Output file: {args.output}')
print(f'Verbose mode: {args.verbose}')
```

Running examples:

```bash
$ python process.py input.txt -o output.txt -v
Input file: input.txt
Output file: output.txt
Verbose mode: True

$ python process.py input.txt
Input file: input.txt
Output file: None
Verbose mode: False
```

## ArgumentParser In Depth

### Creating the Parser

`ArgumentParser` is the core class of argparse, responsible for parsing command-line arguments.

```python
import argparse

parser = argparse.ArgumentParser(
    prog='myapp',                    # Program name (defaults to sys.argv[0])
    description='Program description', # Displayed at start of help
    epilog='For more info visit...', # Displayed at end of help
    formatter_class=argparse.RawDescriptionHelpFormatter,  # Formatter class
    add_help=True,                   # Whether to add -h/--help (default True)
    allow_abbrev=True,               # Whether to allow abbreviations (default True)
)
```

### Common Formatter Classes

argparse provides several formatter classes to control help display:

```python
import argparse

# Default formatter (auto line wrap)
parser = argparse.ArgumentParser(
    formatter_class=argparse.HelpFormatter
)

# Preserve original format (no auto line wrap)
parser = argparse.ArgumentParser(
    formatter_class=argparse.RawDescriptionHelpFormatter
)

# Preserve original format for both description and help text
parser = argparse.ArgumentParser(
    formatter_class=argparse.RawTextHelpFormatter
)

# Automatically add default value info
parser = argparse.ArgumentParser(
    formatter_class=argparse.ArgumentDefaultsHelpFormatter
)

# Show type names in help
parser = argparse.ArgumentParser(
    formatter_class=argparse.MetavarTypeHelpFormatter
)
```

Using `ArgumentDefaultsHelpFormatter`:

```python
import argparse

parser = argparse.ArgumentParser(
    formatter_class=argparse.ArgumentDefaultsHelpFormatter
)
parser.add_argument('--timeout', type=int, default=30, help='Timeout in seconds')
parser.print_help()
```

Output:

```
usage: prog.py [-h] [--timeout TIMEOUT]

options:
  -h, --help         show this help message and exit
  --timeout TIMEOUT  Timeout in seconds (default: 30)
```

## Adding Arguments

### The add_argument() Method

`add_argument()` is the core method for defining arguments, with many optional parameters:

```python
parser.add_argument(
    'name',                  # Argument name (positional argument)
    '-s', '--short',         # Or short and long options (optional argument)
    action='store',          # Argument action
    nargs=None,              # Number of arguments
    const=None,              # Constant value
    default=None,            # Default value
    type=str,                # Argument type
    choices=None,            # Allowed values list
    required=False,          # Whether required (optional arguments only)
    help='Argument description', # Help text
    metavar='NAME',          # Name shown in help
    dest='variable_name'     # Attribute name for storing value
)
```

### Argument Types (type)

argparse automatically converts command-line strings to specified types:

```python
import argparse

parser = argparse.ArgumentParser()

# Built-in types
parser.add_argument('--count', type=int, help='Integer argument')
parser.add_argument('--ratio', type=float, help='Float argument')
parser.add_argument('--flag', type=bool, help='Boolean argument')  # Note: may not be what you want

# File types (auto opens file)
parser.add_argument('--input', type=argparse.FileType('r'), help='Input file')
parser.add_argument('--output', type=argparse.FileType('w'), help='Output file')

args = parser.parse_args()
```

**Custom type conversion functions**:

```python
import argparse

def positive_int(value):
    """Accept only positive integers"""
    ivalue = int(value)
    if ivalue <= 0:
        raise argparse.ArgumentTypeError(f'{value} is not a positive integer')
    return ivalue

def date_type(value):
    """Parse date string"""
    from datetime import datetime
    try:
        return datetime.strptime(value, '%Y-%m-%d')
    except ValueError:
        raise argparse.ArgumentTypeError(f'{value} is not a valid date format (YYYY-MM-DD)')

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=positive_int, help='Port number (positive integer)')
parser.add_argument('--date', type=date_type, help='Date (YYYY-MM-DD)')

args = parser.parse_args()
```

Running examples:

```bash
$ python app.py --port -1
usage: app.py [-h] [--port PORT]
app.py: error: argument --port: -1 is not a positive integer

$ python app.py --date 2026-01-07
# Successfully parsed as datetime object
```

### Argument Choices

Restrict argument to specific values:

```python
import argparse

parser = argparse.ArgumentParser()

# String choices
parser.add_argument(
    '--format',
    choices=['json', 'xml', 'csv'],
    default='json',
    help='Output format'
)

# Integer choices
parser.add_argument(
    '--verbosity',
    type=int,
    choices=[0, 1, 2],
    default=0,
    help='Log verbosity level'
)

# Enum choices
from enum import Enum

class Color(Enum):
    RED = 'red'
    GREEN = 'green'
    BLUE = 'blue'

parser.add_argument(
    '--color',
    type=Color,
    choices=list(Color),
    help='Color selection'
)

args = parser.parse_args()
```

Running example:

```bash
$ python app.py --format yaml
usage: app.py [-h] [--format {json,xml,csv}]
app.py: error: argument --format: invalid choice: 'yaml' (choose from 'json', 'xml', 'csv')
```

### Number of Arguments (nargs)

Control how many values an argument accepts:

```python
import argparse

parser = argparse.ArgumentParser()

# Fixed count
parser.add_argument('--point', nargs=2, type=float, help='Coordinates (x y)')

# Zero or more
parser.add_argument('--files', nargs='*', help='File list (can be empty)')

# One or more
parser.add_argument('--hosts', nargs='+', help='Host list (at least one)')

# Optional (zero or one)
parser.add_argument('--config', nargs='?', const='default.cfg', help='Config file')

# All remaining arguments
parser.add_argument('rest', nargs=argparse.REMAINDER, help='Other arguments')

args = parser.parse_args()
```

nargs value descriptions:

| nargs value | Meaning | Result type |
|-------------|---------|-------------|
| N (integer) | Exactly N arguments | list |
| `'?'` | Zero or one | single value or default/const |
| `'*'` | Zero or more | list |
| `'+'` | One or more | list |
| `argparse.REMAINDER` | All remaining arguments | list |

Detailed example using `nargs='?'`:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument(
    '--output',
    nargs='?',
    const='default_output.txt',  # Used when --output given without value
    default=None,                 # Used when --output not given at all
    help='Output file'
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

### Argument Actions

action determines how the argument is handled when found:

```python
import argparse

parser = argparse.ArgumentParser()

# store: store argument value (default)
parser.add_argument('--name', action='store')

# store_const: store constant value
parser.add_argument('--enable', action='store_const', const=True)

# store_true / store_false: store boolean value
parser.add_argument('-v', '--verbose', action='store_true')
parser.add_argument('--no-cache', action='store_false', dest='cache')

# append: append values to list when used multiple times
parser.add_argument('--include', action='append')

# append_const: append constant to list when used multiple times
parser.add_argument('-v', action='append_const', const=1, dest='verbosity')

# count: count how many times argument appears
parser.add_argument('-v', '--verbose', action='count', default=0)

# version: show version info and exit
parser.add_argument('--version', action='version', version='%(prog)s 1.0.0')

# extend: extend list (Python 3.8+)
parser.add_argument('--files', action='extend', nargs='+', type=str)

args = parser.parse_args()
```

Common usage of count action:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('-v', '--verbose', action='count', default=0)

args = parser.parse_args()

if args.verbose >= 2:
    print('Very verbose output')
elif args.verbose >= 1:
    print('Verbose output')
else:
    print('Normal output')
```

```bash
$ python app.py           # verbose = 0
$ python app.py -v        # verbose = 1
$ python app.py -vv       # verbose = 2
$ python app.py -v -v -v  # verbose = 3
```

### Required Optional Arguments

By default, optional arguments are not required. Use `required=True` to change this:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--api-key', required=True, help='API key (required)')
parser.add_argument('--endpoint', required=True, help='API endpoint (required)')

args = parser.parse_args()
```

```bash
$ python app.py
usage: app.py [-h] --api-key API_KEY --endpoint ENDPOINT
app.py: error: the following arguments are required: --api-key, --endpoint
```

### Default Values

Set default values for arguments:

```python
import argparse

parser = argparse.ArgumentParser()

# Simple default value
parser.add_argument('--port', type=int, default=8080)

# Use environment variable as default
import os
parser.add_argument(
    '--host',
    default=os.getenv('APP_HOST', 'localhost')
)

# Suppress default (don't add to namespace)
parser.add_argument('--debug', default=argparse.SUPPRESS)

args = parser.parse_args()
```

### Help and Metavar

Customize help with `help` and `metavar`:

```python
import argparse

parser = argparse.ArgumentParser()

# Basic help
parser.add_argument('--timeout', type=int, help='Request timeout in seconds')

# Custom display name
parser.add_argument(
    '--output',
    metavar='FILE',
    help='Output file path'
)

# Multiple value display names
parser.add_argument(
    '--range',
    nargs=2,
    metavar=('START', 'END'),
    type=int,
    help='Range start and end values'
)

# Hidden argument (not shown in help)
parser.add_argument('--secret', help=argparse.SUPPRESS)

parser.print_help()
```

Output:

```
usage: prog.py [-h] [--timeout TIMEOUT] [--output FILE] [--range START END]

options:
  -h, --help          show this help message and exit
  --timeout TIMEOUT   Request timeout in seconds
  --output FILE       Output file path
  --range START END   Range start and end values
```

### Destination Attribute Name (dest)

Specify the attribute name for storing the argument value:

```python
import argparse

parser = argparse.ArgumentParser()

# By default, dest is inferred from argument name
parser.add_argument('-n', '--name')  # dest='name'
parser.add_argument('--user-name')   # dest='user_name' (hyphens become underscores)

# Custom dest
parser.add_argument('-v', '--verbose', dest='verbosity', action='count', default=0)

args = parser.parse_args(['-v', '-v'])
print(args.verbosity)  # 2
```

## Argument Groups

### Basic Grouping

Organize related arguments together for clearer help:

```python
import argparse

parser = argparse.ArgumentParser(description='Database management tool')

# Connection argument group
connection_group = parser.add_argument_group('Connection Options')
connection_group.add_argument('--host', default='localhost', help='Database host')
connection_group.add_argument('--port', type=int, default=5432, help='Database port')
connection_group.add_argument('--user', help='Username')
connection_group.add_argument('--password', help='Password')

# Operation argument group
operation_group = parser.add_argument_group('Operation Options')
operation_group.add_argument('--backup', action='store_true', help='Backup database')
operation_group.add_argument('--restore', metavar='FILE', help='Restore from file')

parser.print_help()
```

Output:

```
usage: db.py [-h] [--host HOST] [--port PORT] [--user USER] [--password PASSWORD]
             [--backup] [--restore FILE]

Database management tool

options:
  -h, --help           show this help message and exit

Connection Options:
  --host HOST          Database host
  --port PORT          Database port
  --user USER          Username
  --password PASSWORD  Password

Operation Options:
  --backup             Backup database
  --restore FILE       Restore from file
```

### Mutually Exclusive Groups

Some arguments are mutually exclusive and cannot be used together:

```python
import argparse

parser = argparse.ArgumentParser(description='File compression tool')

# Create mutually exclusive group
mode_group = parser.add_mutually_exclusive_group(required=True)
mode_group.add_argument('-c', '--compress', action='store_true', help='Compress files')
mode_group.add_argument('-x', '--extract', action='store_true', help='Extract files')
mode_group.add_argument('-l', '--list', action='store_true', help='List contents')

parser.add_argument('archive', help='Archive file')

args = parser.parse_args()
```

```bash
$ python archive.py -c -x data.zip
usage: archive.py [-h] (-c | -x | -l) archive
archive.py: error: argument -x/--extract: not allowed with argument -c/--compress

$ python archive.py -c data.zip
# Success
```

## Subcommands (Subparsers)

Subcommands allow creating command structures like `git commit`, `git push`:

```python
import argparse

# Create main parser
parser = argparse.ArgumentParser(description='Project management tool')
parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

# Create subcommand parser
subparsers = parser.add_subparsers(
    title='Subcommands',
    dest='command',
    description='Available subcommands',
    help='Subcommand help'
)

# init subcommand
init_parser = subparsers.add_parser('init', help='Initialize new project')
init_parser.add_argument('name', help='Project name')
init_parser.add_argument('--template', default='default', help='Project template')

# build subcommand
build_parser = subparsers.add_parser('build', help='Build project')
build_parser.add_argument('--release', action='store_true', help='Release build')
build_parser.add_argument('--target', default='all', help='Build target')

# deploy subcommand
deploy_parser = subparsers.add_parser('deploy', help='Deploy project')
deploy_parser.add_argument('environment', choices=['dev', 'staging', 'prod'], help='Target environment')
deploy_parser.add_argument('--force', action='store_true', help='Force deploy')

args = parser.parse_args()

# Handle subcommands
if args.command == 'init':
    print(f'Initializing project: {args.name}, template: {args.template}')
elif args.command == 'build':
    mode = 'release' if args.release else 'development'
    print(f'Building project: {mode} mode, target: {args.target}')
elif args.command == 'deploy':
    print(f'Deploying to: {args.environment}')
else:
    parser.print_help()
```

Running examples:

```bash
$ python project.py --help
usage: project.py [-h] [--verbose] {init,build,deploy} ...

Project management tool

options:
  -h, --help            show this help message and exit
  --verbose, -v         Verbose output

Subcommands:
  Available subcommands

  {init,build,deploy}   Subcommand help
    init                Initialize new project
    build               Build project
    deploy              Deploy project

$ python project.py init myapp --template flask
Initializing project: myapp, template: flask

$ python project.py build --release
Building project: release mode, target: all

$ python project.py deploy prod --force
Deploying to: prod
```

### Subcommand Aliases

Add aliases to subcommands:

```python
import argparse

parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers(dest='command')

# checkout subcommand with alias co
checkout = subparsers.add_parser('checkout', aliases=['co'], help='Switch branch')
checkout.add_argument('branch', help='Branch name')

args = parser.parse_args()
```

```bash
$ python vcs.py co main     # Using alias
$ python vcs.py checkout main  # Using full name
```

### Setting Subcommand Handler Functions

Set dedicated handler functions for each subcommand:

```python
import argparse

def init_project(args):
    print(f'Initializing project: {args.name}')

def build_project(args):
    print(f'Building project, target: {args.target}')

def deploy_project(args):
    print(f'Deploying to: {args.environment}')

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

# Call the corresponding handler
if hasattr(args, 'func'):
    args.func(args)
else:
    parser.print_help()
```

## Custom Actions

When built-in actions aren't enough, create custom actions:

```python
import argparse

class ValidateEmailAction(argparse.Action):
    """Custom action to validate email format"""

    def __call__(self, parser, namespace, values, option_string=None):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, values):
            raise argparse.ArgumentError(self, f'Invalid email address: {values}')
        setattr(namespace, self.dest, values)

class RangeAction(argparse.Action):
    """Custom action to validate numeric range"""

    def __init__(self, option_strings, dest, min_val=None, max_val=None, **kwargs):
        self.min_val = min_val
        self.max_val = max_val
        super().__init__(option_strings, dest, **kwargs)

    def __call__(self, parser, namespace, values, option_string=None):
        if self.min_val is not None and values < self.min_val:
            raise argparse.ArgumentError(self, f'Value must be >= {self.min_val}')
        if self.max_val is not None and values > self.max_val:
            raise argparse.ArgumentError(self, f'Value must be <= {self.max_val}')
        setattr(namespace, self.dest, values)

class AppendUniqueAction(argparse.Action):
    """Append unique values to list"""

    def __call__(self, parser, namespace, values, option_string=None):
        items = getattr(namespace, self.dest, None) or []
        if values not in items:
            items.append(values)
        setattr(namespace, self.dest, items)

# Using custom actions
parser = argparse.ArgumentParser()

parser.add_argument('--email', action=ValidateEmailAction, help='Email address')

parser.add_argument(
    '--port',
    type=int,
    action=RangeAction,
    min_val=1,
    max_val=65535,
    help='Port number (1-65535)'
)

parser.add_argument(
    '--tag',
    action=AppendUniqueAction,
    help='Tag (can use multiple times, auto-dedup)'
)

args = parser.parse_args()
```

## Advanced Features

### Reading Arguments from Files

Use `fromfile_prefix_chars` to read arguments from files:

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

Create argument file `config.txt`:

```
--host
localhost
--port
8080
--user
admin
```

Usage:

```bash
$ python app.py @config.txt
# Equivalent to: python app.py --host localhost --port 8080 --user admin
```

### Argument Abbreviation

By default, argparse supports argument abbreviation:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--verbose')
parser.add_argument('--version')

# --verb can match --verbose (if unambiguous)
args = parser.parse_args(['--verb', 'yes'])
```

Disable abbreviation:

```python
parser = argparse.ArgumentParser(allow_abbrev=False)
```

### Argument Prefix

Customize argument prefix characters:

```python
import argparse

# Windows style arguments (using / as prefix)
parser = argparse.ArgumentParser(prefix_chars='/')
parser.add_argument('/v', '/verbose', action='store_true')
parser.add_argument('/output', '/o')

args = parser.parse_args(['/v', '/o', 'result.txt'])
```

### Parent Parsers

Share argument definitions between multiple parsers:

```python
import argparse

# Create parent parser with shared arguments
parent_parser = argparse.ArgumentParser(add_help=False)
parent_parser.add_argument('--verbose', '-v', action='store_true')
parent_parser.add_argument('--config', '-c', default='config.yaml')

# Child parsers inherit parent arguments
parser_a = argparse.ArgumentParser(parents=[parent_parser])
parser_a.add_argument('--host')

parser_b = argparse.ArgumentParser(parents=[parent_parser])
parser_b.add_argument('--port', type=int)

# Both parsers have --verbose and --config
```

### Parsing Known Arguments

When you need to parse only some arguments and ignore unknown ones:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--known', action='store_true')

# parse_known_args returns (known args, unknown args list)
args, unknown = parser.parse_known_args(['--known', '--unknown', 'value'])

print(args)     # Namespace(known=True)
print(unknown)  # ['--unknown', 'value']
```

### Intermixed Parsing Mode

Use `REMAINDER` to collect remaining arguments (common for wrapping other commands):

```python
import argparse
import subprocess

parser = argparse.ArgumentParser(description='Command wrapper')
parser.add_argument('--dry-run', action='store_true', help='Print command only, do not execute')
parser.add_argument('command', help='Command to execute')
parser.add_argument('args', nargs=argparse.REMAINDER, help='Command arguments')

args = parser.parse_args()

if args.dry_run:
    print(f'Would execute: {args.command} {" ".join(args.args)}')
else:
    subprocess.run([args.command] + args.args)
```

```bash
$ python wrapper.py --dry-run ls -la /tmp
Would execute: ls -la /tmp
```

## Error Handling

### Custom Error Messages

```python
import argparse
import sys

class CustomArgumentParser(argparse.ArgumentParser):
    def error(self, message):
        """Custom error handling"""
        sys.stderr.write(f'Error: {message}\n')
        sys.stderr.write(f'Use --help to see help information\n')
        sys.exit(2)

parser = CustomArgumentParser()
parser.add_argument('--name', required=True)

args = parser.parse_args()
```

### Argument Validation

Perform additional validation after parsing:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--start', type=int, required=True)
parser.add_argument('--end', type=int, required=True)

args = parser.parse_args()

# Post-validation
if args.start >= args.end:
    parser.error('--start must be less than --end')
```

## Practical Examples

### Example 1: File Conversion Tool

```python
#!/usr/bin/env python3
"""File format conversion tool"""

import argparse
import json
import csv
import sys
from pathlib import Path

def json_to_csv(input_file, output_file):
    """JSON to CSV"""
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        return

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

def csv_to_json(input_file, output_file):
    """CSV to JSON"""
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    parser = argparse.ArgumentParser(
        description='File format conversion tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s input.json output.csv         # JSON to CSV
  %(prog)s input.csv output.json         # CSV to JSON
  %(prog)s -f json input.csv output.json # Force specify output format
        '''
    )

    parser.add_argument('input', help='Input file')
    parser.add_argument('output', help='Output file')
    parser.add_argument(
        '-f', '--format',
        choices=['json', 'csv'],
        help='Force specify output format (default infers from extension)'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Show detailed information'
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
        parser.error(f'Input file does not exist: {args.input}')

    # Determine output format
    if args.format:
        output_format = args.format
    else:
        output_format = output_path.suffix.lstrip('.')

    if args.verbose:
        print(f'Input file: {input_path}')
        print(f'Output file: {output_path}')
        print(f'Output format: {output_format}')

    # Perform conversion
    try:
        if output_format == 'csv':
            json_to_csv(input_path, output_path)
        elif output_format == 'json':
            csv_to_json(input_path, output_path)
        else:
            parser.error(f'Unsupported output format: {output_format}')

        if args.verbose:
            print('Conversion complete!')

    except Exception as e:
        print(f'Conversion failed: {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

### Example 2: Database Management Tool

```python
#!/usr/bin/env python3
"""Database management CLI tool"""

import argparse
import sys

def cmd_connect(args):
    """Connect to database"""
    print(f'Connecting to {args.user}@{args.host}:{args.port}/{args.database}')

def cmd_backup(args):
    """Backup database"""
    output = args.output or f'{args.database}_backup.sql'
    print(f'Backing up database {args.database} to {output}')
    if args.compress:
        print('Compression enabled')

def cmd_restore(args):
    """Restore database"""
    print(f'Restoring from {args.file} to {args.database}')
    if args.force:
        print('Force mode: overwriting existing data')

def cmd_migrate(args):
    """Execute migration"""
    if args.rollback:
        print(f'Rolling back last {args.rollback} migrations')
    else:
        print('Executing database migrations')
    if args.dry_run:
        print('(Dry run mode)')

def main():
    # Main parser
    parser = argparse.ArgumentParser(
        prog='dbctl',
        description='Database management tool'
    )
    parser.add_argument('--version', action='version', version='%(prog)s 2.0.0')

    # Global arguments
    parser.add_argument(
        '-H', '--host',
        default='localhost',
        help='Database host (default: localhost)'
    )
    parser.add_argument(
        '-P', '--port',
        type=int,
        default=5432,
        help='Database port (default: 5432)'
    )
    parser.add_argument(
        '-u', '--user',
        default='postgres',
        help='Database user (default: postgres)'
    )
    parser.add_argument(
        '-d', '--database',
        required=True,
        help='Database name'
    )

    # Subcommands
    subparsers = parser.add_subparsers(
        title='Commands',
        dest='command',
        required=True
    )

    # connect command
    connect_parser = subparsers.add_parser('connect', help='Connect to database')
    connect_parser.set_defaults(func=cmd_connect)

    # backup command
    backup_parser = subparsers.add_parser('backup', help='Backup database')
    backup_parser.add_argument('-o', '--output', help='Output filename')
    backup_parser.add_argument('-z', '--compress', action='store_true', help='Compress backup')
    backup_parser.set_defaults(func=cmd_backup)

    # restore command
    restore_parser = subparsers.add_parser('restore', help='Restore database')
    restore_parser.add_argument('file', help='Backup file')
    restore_parser.add_argument('--force', action='store_true', help='Force overwrite')
    restore_parser.set_defaults(func=cmd_restore)

    # migrate command
    migrate_parser = subparsers.add_parser('migrate', help='Execute migration')
    migrate_group = migrate_parser.add_mutually_exclusive_group()
    migrate_group.add_argument('--rollback', type=int, metavar='N', help='Rollback N migrations')
    migrate_group.add_argument('--dry-run', action='store_true', help='Dry run')
    migrate_parser.set_defaults(func=cmd_migrate)

    args = parser.parse_args()
    args.func(args)

if __name__ == '__main__':
    main()
```

Running examples:

```bash
$ dbctl -d mydb connect
Connecting to postgres@localhost:5432/mydb

$ dbctl -d mydb backup -o backup.sql -z
Backing up database mydb to backup.sql
Compression enabled

$ dbctl -d mydb restore backup.sql --force
Restoring from backup.sql to mydb
Force mode: overwriting existing data

$ dbctl -d mydb migrate --dry-run
Executing database migrations
(Dry run mode)
```

### Example 3: Log Analysis Tool

```python
#!/usr/bin/env python3
"""Log analysis tool"""

import argparse
import re
from datetime import datetime
from collections import Counter
from pathlib import Path

def parse_log_line(line, pattern):
    """Parse log line"""
    match = re.match(pattern, line)
    if match:
        return match.groupdict()
    return None

def analyze_logs(args):
    """Analyze log files"""
    # Default log patterns
    patterns = {
        'apache': r'(?P<ip>\S+) .* \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<url>\S+) \S+" (?P<status>\d+)',
        'nginx': r'(?P<ip>\S+) .* \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<url>\S+) \S+" (?P<status>\d+)',
        'custom': args.pattern or r'.*'
    }

    pattern = patterns.get(args.format, patterns['custom'])

    # Statistics
    status_counter = Counter()
    ip_counter = Counter()
    url_counter = Counter()
    total_lines = 0
    parsed_lines = 0

    for log_file in args.files:
        path = Path(log_file)
        if not path.exists():
            print(f'Warning: File does not exist {log_file}')
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

    # Output results
    print(f'\nLog Analysis Report')
    print('=' * 50)
    print(f'Total lines: {total_lines}')
    print(f'Successfully parsed: {parsed_lines}')
    print(f'Parse rate: {parsed_lines/total_lines*100:.1f}%' if total_lines else 'No data')

    if args.show_status:
        print(f'\nStatus Code Statistics (Top {args.top}):')
        for status, count in status_counter.most_common(args.top):
            print(f'  {status}: {count}')

    if args.show_ip:
        print(f'\nIP Access Statistics (Top {args.top}):')
        for ip, count in ip_counter.most_common(args.top):
            print(f'  {ip}: {count}')

    if args.show_url:
        print(f'\nURL Access Statistics (Top {args.top}):')
        for url, count in url_counter.most_common(args.top):
            print(f'  {url}: {count}')

def main():
    parser = argparse.ArgumentParser(
        description='Log analysis tool',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    # Input files
    parser.add_argument(
        'files',
        nargs='+',
        help='Log file paths'
    )

    # Log format
    parser.add_argument(
        '-f', '--format',
        choices=['apache', 'nginx', 'custom'],
        default='apache',
        help='Log format'
    )

    parser.add_argument(
        '-p', '--pattern',
        help='Custom regex pattern (for custom format)'
    )

    # Output options
    output_group = parser.add_argument_group('Output Options')
    output_group.add_argument(
        '--show-status',
        action='store_true',
        help='Show status code statistics'
    )
    output_group.add_argument(
        '--show-ip',
        action='store_true',
        help='Show IP statistics'
    )
    output_group.add_argument(
        '--show-url',
        action='store_true',
        help='Show URL statistics'
    )
    output_group.add_argument(
        '-a', '--all',
        action='store_true',
        help='Show all statistics'
    )
    output_group.add_argument(
        '-n', '--top',
        type=int,
        default=10,
        help='Show top N items'
    )

    args = parser.parse_args()

    # Handle --all option
    if args.all:
        args.show_status = True
        args.show_ip = True
        args.show_url = True

    # If no output specified, default to show all
    if not (args.show_status or args.show_ip or args.show_url):
        args.show_status = True
        args.show_ip = True
        args.show_url = True

    analyze_logs(args)

if __name__ == '__main__':
    main()
```

## Integration with Other Libraries

### With logging

```python
import argparse
import logging

def setup_logging(verbosity):
    """Set log level based on verbosity"""
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
    help='Increase output verbosity (-v, -vv)'
)

args = parser.parse_args()
setup_logging(args.verbose)

logging.debug('Debug info')
logging.info('Info message')
logging.warning('Warning message')
```

### With Environment Variables

```python
import argparse
import os

def env_or_default(env_var, default):
    """Prefer environment variable"""
    return os.getenv(env_var, default)

parser = argparse.ArgumentParser()
parser.add_argument(
    '--api-key',
    default=env_or_default('API_KEY', None),
    help='API key (can also be set via API_KEY environment variable)'
)
parser.add_argument(
    '--host',
    default=env_or_default('APP_HOST', 'localhost'),
    help='Host address (default: APP_HOST env var or localhost)'
)

args = parser.parse_args()
```

### With Config Files

```python
import argparse
import configparser

# Create config parser
config = configparser.ConfigParser()
config.read('config.ini')

# Get defaults from config file
defaults = dict(config['DEFAULT']) if 'DEFAULT' in config else {}

parser = argparse.ArgumentParser()
parser.set_defaults(**defaults)

parser.add_argument('--host')
parser.add_argument('--port', type=int)

args = parser.parse_args()
# Command-line arguments override config file values
```

## Best Practices

### Provide Meaningful Help

```python
import argparse

parser = argparse.ArgumentParser(
    description='A data processing tool',
    epilog='For more information visit: https://example.com/docs'
)

# Good help message
parser.add_argument(
    '--batch-size',
    type=int,
    default=100,
    metavar='N',
    help='Number of records per batch (default: %(default)s)'
)

# Poor help message
parser.add_argument('--bs', type=int, default=100)  # Missing help text
```

### Use Appropriate Argument Names

```python
# Recommended: Use meaningful long option names
parser.add_argument('--output-file', help='Output file path')
parser.add_argument('--max-retries', type=int, help='Maximum retry count')

# Provide short options as convenience
parser.add_argument('-o', '--output', help='Output file')
parser.add_argument('-n', '--number', type=int, help='Number')
```

### Reasonable Default Values

```python
import argparse
import os

parser = argparse.ArgumentParser()

# Use constant defaults
parser.add_argument('--timeout', type=int, default=30)

# Use environment variables
parser.add_argument('--api-url', default=os.getenv('API_URL', 'https://api.example.com'))

# Don't use mutable objects as defaults
parser.add_argument('--items', nargs='*', default=None)  # Good
# parser.add_argument('--items', nargs='*', default=[])  # Avoid
```

### Validate Argument Combinations

```python
import argparse
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--output')
parser.add_argument('--in-place', action='store_true')

args = parser.parse_args()

# Validate argument combinations
if args.in_place and args.output:
    parser.error('--in-place and --output cannot be used together')

if not args.in_place and not args.output:
    parser.error('Must specify --output or use --in-place')
```

### Structure Complex Tools

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
    help = 'Process data'

    def add_arguments(self, parser):
        parser.add_argument('input', help='Input file')
        parser.add_argument('--format', choices=['json', 'csv'])

    def run(self, args):
        print(f'Processing {args.input}')

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

## Common Questions

### Question 1: How to handle boolean arguments?

```python
import argparse

parser = argparse.ArgumentParser()

# Method 1: store_true/store_false
parser.add_argument('--verbose', action='store_true')
parser.add_argument('--no-cache', action='store_false', dest='cache')

# Method 2: Mutually exclusive group
feature_group = parser.add_mutually_exclusive_group()
feature_group.add_argument('--enable-feature', action='store_true', dest='feature')
feature_group.add_argument('--disable-feature', action='store_false', dest='feature')
parser.set_defaults(feature=True)

# Method 3: BooleanOptionalAction (Python 3.9+)
parser.add_argument('--debug', action=argparse.BooleanOptionalAction)
# Automatically supports --debug and --no-debug
```

### Question 2: How to accept password without showing in command line?

```python
import argparse
import getpass

parser = argparse.ArgumentParser()
parser.add_argument('--password', help='Password (interactive input)')

args = parser.parse_args()

if not args.password:
    args.password = getpass.getpass('Enter password: ')
```

### Question 3: How to support both config file and command-line arguments?

```python
import argparse
import configparser

# Create config parser
config = configparser.ConfigParser()
config.read('config.ini')

# Get defaults from config file
defaults = dict(config['DEFAULT']) if 'DEFAULT' in config else {}

parser = argparse.ArgumentParser()
parser.set_defaults(**defaults)

parser.add_argument('--host')
parser.add_argument('--port', type=int)

args = parser.parse_args()
# Command-line arguments override config file values
```

### Question 4: How to test argparse code?

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

## Summary

argparse is the standard tool for building command-line interfaces in Python. You have learned:

1. **Basic usage**: Creating ArgumentParser, adding positional and optional arguments
2. **Argument configuration**: Type conversion, choice restriction, multi-value arguments, argument actions
3. **Organization structure**: Argument groups, mutually exclusive arguments, subcommands
4. **Advanced features**: Custom actions, reading from files, parent parsers
5. **Practical techniques**: Error handling, integration with other modules, best practices

Mastering argparse allows you to create professional, user-friendly command-line interfaces for Python programs. Whether for simple scripts or complex tools, argparse can meet your needs.
