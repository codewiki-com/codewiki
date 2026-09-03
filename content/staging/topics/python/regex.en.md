---
title: Regular Expressions
description: Complete guide to Python regular expressions, re module, pattern matching and text processing
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - Regular Expressions
  - re module
  - Text Processing
status: imported
origin: old/src/content/docs/python/regex.en.md
divergence: 0.307
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 17
  lastUpdated: 2026-01-07
---

Regular expressions (regex) are powerful tools for pattern matching and text manipulation. Python's `re` module provides comprehensive support for regular expressions, enabling developers to search, match, extract, and transform text with precision and efficiency.

## Introduction to the re Module

The `re` module is Python's built-in library for working with regular expressions. It must be imported before use and provides functions for pattern matching, searching, splitting, and substitution.

```python
import re

# Basic pattern matching example
text = "Python is powerful and Python is popular"
pattern = r"Python"

# Find all occurrences
matches = re.findall(pattern, text)
print(matches)  # Output: ['Python', 'Python']

# Check if pattern exists anywhere in the string
if re.search(pattern, text):
    print("Pattern found!")
```

### Raw Strings in Regular Expressions

Always use raw strings (prefixed with `r`) for regular expression patterns. Raw strings treat backslashes as literal characters, preventing conflicts with Python's string escape sequences.

```python
import re

# Without raw string - problematic
pattern1 = "\\d+"  # Must escape backslash

# With raw string - cleaner and preferred
pattern2 = r"\d+"  # Backslash is literal

# Both patterns are equivalent
text = "Order 12345"
print(re.findall(pattern1, text))  # ['12345']
print(re.findall(pattern2, text))  # ['12345']

# Raw strings are essential for complex patterns
# Without raw string:
complex_pattern1 = "\\b\\w+\\s+\\w+\\b"
# With raw string:
complex_pattern2 = r"\b\w+\s+\w+\b"
```

## Pattern Syntax Reference

Understanding pattern syntax is fundamental to using regular expressions effectively.

### Character Classes

```python
import re

text = "Contact: user@example.com, Phone: 555-123-4567"

# \d - matches any digit (0-9)
digits = re.findall(r"\d", text)
print(digits)  # ['5', '5', '5', '1', '2', '3', '4', '5', '6', '7']

# \D - matches any non-digit
non_digits = re.findall(r"\D+", text)
print(non_digits)  # ['Contact: user@example.com, Phone: ', '-', '-']

# \w - matches word characters (a-z, A-Z, 0-9, _)
words = re.findall(r"\w+", text)
print(words)  # ['Contact', 'user', 'example', 'com', 'Phone', '555', '123', '4567']

# \W - matches non-word characters
non_words = re.findall(r"\W+", text)
print(non_words)  # [': ', '@', '.', ', ', ': ', '-', '-']

# \s - matches whitespace (space, tab, newline)
whitespace = re.findall(r"\s", text)
print(len(whitespace))  # 3

# \S - matches non-whitespace
non_whitespace = re.findall(r"\S+", text)
print(non_whitespace)  # ['Contact:', 'user@example.com,', 'Phone:', '555-123-4567']
```

### Custom Character Sets

```python
import re

text = "The quick brown fox jumps over 42 lazy dogs at 3pm"

# [abc] - matches any character in the set
vowels = re.findall(r"[aeiou]", text)
print(vowels)  # ['e', 'u', 'i', 'o', 'o', 'u', 'o', 'e', 'a', 'o']

# [^abc] - matches any character NOT in the set
non_vowels = re.findall(r"[^aeiou\s]+", text)
print(non_vowels)  # ['Th', 'q', 'ck', 'br', 'wn', 'fx', 'jmps', 'vr', '42', 'lzy', 'dgs', 't', '3pm']

# [a-z] - matches any lowercase letter
lowercase = re.findall(r"[a-z]+", text)
print(lowercase)  # ['he', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dogs', 'at', 'pm']

# [A-Za-z] - matches any letter (case insensitive)
letters = re.findall(r"[A-Za-z]+", text)
print(letters)  # ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dogs', 'at', 'pm']

# [0-9] - equivalent to \d
numbers = re.findall(r"[0-9]+", text)
print(numbers)  # ['42', '3']

# Combined ranges
alphanumeric = re.findall(r"[A-Za-z0-9]+", text)
print(alphanumeric)
# ['The', 'quick', 'brown', 'fox', 'jumps', 'over', '42', 'lazy', 'dogs', 'at', '3pm']
```

### Quantifiers

```python
import re

text = "aaa ab abbb a123 12345"

# * - matches 0 or more occurrences
pattern_star = re.findall(r"ab*", text)
print(pattern_star)  # ['a', 'a', 'a', 'a', 'ab', 'abbb', 'a']

# + - matches 1 or more occurrences
pattern_plus = re.findall(r"ab+", text)
print(pattern_plus)  # ['ab', 'abbb']

# ? - matches 0 or 1 occurrence
pattern_question = re.findall(r"ab?", text)
print(pattern_question)  # ['a', 'a', 'a', 'a', 'ab', 'ab', 'a']

# {n} - matches exactly n occurrences
pattern_exact = re.findall(r"\d{3}", text)
print(pattern_exact)  # ['123', '123']

# {n,} - matches n or more occurrences
pattern_min = re.findall(r"\d{3,}", text)
print(pattern_min)  # ['123', '12345']

# {n,m} - matches between n and m occurrences
pattern_range = re.findall(r"\d{2,4}", text)
print(pattern_range)  # ['123', '1234']

# Greedy vs non-greedy (lazy) quantifiers
html = "<div>content</div><span>more</span>"

# Greedy (default) - matches as much as possible
greedy = re.findall(r"<.*>", html)
print(greedy)  # ['<div>content</div><span>more</span>']

# Non-greedy (lazy) - matches as little as possible
lazy = re.findall(r"<.*?>", html)
print(lazy)  # ['<div>', '</div>', '<span>', '</span>']
```

### Anchors and Boundaries

```python
import re

text = "Python programming in Python"
multiline_text = """Line 1: Python
Line 2: Java
Line 3: Python"""

# ^ - matches start of string (or line with MULTILINE flag)
start_match = re.findall(r"^Python", text)
print(start_match)  # ['Python']

# $ - matches end of string (or line with MULTILINE flag)
end_match = re.findall(r"Python$", text)
print(end_match)  # ['Python']

# \b - matches word boundary
word_boundary = re.findall(r"\bPython\b", text)
print(word_boundary)  # ['Python', 'Python']

# \B - matches non-word boundary
text2 = "Python Pythonic Pythonista"
non_boundary = re.findall(r"\BPython\B", text2)
print(non_boundary)  # [] - no matches because Python is always at word boundary

non_boundary2 = re.findall(r"Python\B", text2)
print(non_boundary2)  # ['Python', 'Python'] - Pythonic and Pythonista

# Using anchors with MULTILINE flag
lines_starting_with_python = re.findall(r"^Line.*Python$", multiline_text, re.MULTILINE)
print(lines_starting_with_python)  # ['Line 1: Python', 'Line 3: Python']
```

### Special Characters and Escaping

```python
import re

# Special regex characters: . ^ $ * + ? { } [ ] \ | ( )
text = "Price: $19.99 (50% off)"

# . matches any character except newline
any_char = re.findall(r"1.", text)
print(any_char)  # ['19']

# To match literal special characters, escape with backslash
price = re.findall(r"\$\d+\.\d+", text)
print(price)  # ['$19.99']

percent = re.findall(r"\d+%", text)
print(percent)  # ['50%']

# Use re.escape() for user-provided patterns
user_input = "$19.99"
safe_pattern = re.escape(user_input)
print(safe_pattern)  # \$19\.99

# | for alternation (OR)
text2 = "I like cats and dogs but not rats"
animals = re.findall(r"cats|dogs|birds", text2)
print(animals)  # ['cats', 'dogs']
```

## Pattern Matching Functions

The `re` module provides several functions for different matching scenarios.

### match() - Match at Beginning

The `match()` function checks if the pattern matches at the very beginning of the string.

```python
import re

# match() only checks the beginning of the string
text = "Python 3.11 is the latest version"

result = re.match(r"Python", text)
if result:
    print(f"Found: {result.group()}")  # Found: Python
    print(f"Span: {result.span()}")    # Span: (0, 6)

# match() fails if pattern is not at the beginning
result = re.match(r"3.11", text)
print(result)  # None

# Practical example: validate input format
def validate_id(id_string):
    """Validate ID format: 2-3 uppercase letters followed by 4-6 digits."""
    pattern = r"^[A-Z]{2,3}\d{4,6}$"
    return re.match(pattern, id_string) is not None

print(validate_id("AB1234"))    # True
print(validate_id("XYZ123456")) # True
print(validate_id("A12345"))    # False - only one letter
print(validate_id("ABCD1234"))  # False - four letters
```

### search() - Search Anywhere

The `search()` function scans through the string looking for the first location where the pattern matches.

```python
import re

text = "The error occurred at line 42 in module.py"

# search() finds the pattern anywhere in the string
result = re.search(r"\d+", text)
if result:
    print(f"Found: {result.group()}")  # Found: 42
    print(f"Start: {result.start()}")  # Start: 27
    print(f"End: {result.end()}")      # End: 29
    print(f"Span: {result.span()}")    # Span: (27, 29)

# Extract multiple pieces of information
log_entry = "2024-01-15 14:30:45 [ERROR] Database connection timeout"

timestamp = re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", log_entry)
level = re.search(r"\[(ERROR|WARNING|INFO|DEBUG)\]", log_entry)
message = re.search(r"\] (.+)$", log_entry)

if all([timestamp, level, message]):
    print(f"Time: {timestamp.group()}")     # Time: 2024-01-15 14:30:45
    print(f"Level: {level.group(1)}")       # Level: ERROR
    print(f"Message: {message.group(1)}")   # Message: Database connection timeout
```

### findall() - Find All Matches

The `findall()` function returns all non-overlapping matches as a list of strings.

```python
import re

text = """
Contact Information:
Email: john.doe@example.com, jane.smith@company.org
Phone: 555-123-4567, 555-987-6543
Website: https://example.com
"""

# Find all email addresses
emails = re.findall(r"[\w\.-]+@[\w\.-]+\.\w+", text)
print(emails)  # ['john.doe@example.com', 'jane.smith@company.org']

# Find all phone numbers
phones = re.findall(r"\d{3}-\d{3}-\d{4}", text)
print(phones)  # ['555-123-4567', '555-987-6543']

# Find all URLs
urls = re.findall(r"https?://[\w\.-]+", text)
print(urls)  # ['https://example.com']

# When pattern has groups, findall returns group contents
text2 = "John: 25 years, Jane: 30 years, Bob: 22 years"
ages = re.findall(r"(\w+): (\d+) years", text2)
print(ages)  # [('John', '25'), ('Jane', '30'), ('Bob', '22')]

# Single group returns list of strings
names_only = re.findall(r"(\w+): \d+ years", text2)
print(names_only)  # ['John', 'Jane', 'Bob']
```

### finditer() - Iterator of Match Objects

The `finditer()` function returns an iterator of match objects, providing detailed information about each match.

```python
import re

text = "Error at line 10, Warning at line 25, Error at line 42"
pattern = r"(Error|Warning) at line (\d+)"

# finditer provides match objects with full details
for match in re.finditer(pattern, text):
    print(f"Match: {match.group()}")
    print(f"  Type: {match.group(1)}")
    print(f"  Line: {match.group(2)}")
    print(f"  Position: {match.start()}-{match.end()}")
    print()

# Output:
# Match: Error at line 10
#   Type: Error
#   Line: 10
#   Position: 0-16
#
# Match: Warning at line 25
#   Type: Warning
#   Line: 25
#   Position: 18-37
#
# Match: Error at line 42
#   Type: Error
#   Line: 42
#   Position: 39-55

# Practical example: extract and process matches
code = """
def calculate(x, y):
    result = x + y
    return result

def process(data):
    return data.upper()
"""

functions = []
for match in re.finditer(r"def (\w+)\(([^)]*)\):", code):
    functions.append({
        "name": match.group(1),
        "params": match.group(2),
        "position": match.start()
    })

for func in functions:
    print(f"Function: {func['name']}, Params: '{func['params']}'")
# Function: calculate, Params: 'x, y'
# Function: process, Params: 'data'
```

### fullmatch() - Match Entire String

The `fullmatch()` function checks if the entire string matches the pattern.

```python
import re

# fullmatch requires the pattern to match the complete string
pattern = r"\d{3}-\d{4}"

# Partial match fails
result1 = re.fullmatch(pattern, "Phone: 555-1234")
print(result1)  # None

# Complete match succeeds
result2 = re.fullmatch(pattern, "555-1234")
print(result2.group() if result2 else None)  # 555-1234

# Practical example: input validation
def validate_date(date_string):
    """Validate date in YYYY-MM-DD format."""
    pattern = r"\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])"
    return re.fullmatch(pattern, date_string) is not None

print(validate_date("2024-01-15"))  # True
print(validate_date("2024-13-01"))  # False - invalid month
print(validate_date("2024-1-5"))    # False - missing leading zeros
```

## Groups and Capturing

Groups allow you to extract specific parts of a match and organize complex patterns.

### Basic Groups

```python
import re

# Parentheses create capturing groups
text = "John Smith: john.smith@example.com"
pattern = r"(\w+)\s+(\w+):\s+([\w\.-]+@[\w\.-]+)"

match = re.search(pattern, text)
if match:
    print(f"Full match: {match.group(0)}")   # John Smith: john.smith@example.com
    print(f"First name: {match.group(1)}")   # John
    print(f"Last name: {match.group(2)}")    # Smith
    print(f"Email: {match.group(3)}")        # john.smith@example.com
    print(f"All groups: {match.groups()}")   # ('John', 'Smith', 'john.smith@example.com')

# Nested groups
date_text = "Date: 2024-01-15"
date_pattern = r"((\d{4})-(\d{2})-(\d{2}))"

match = re.search(date_pattern, date_text)
if match:
    print(f"Full date: {match.group(1)}")  # 2024-01-15
    print(f"Year: {match.group(2)}")       # 2024
    print(f"Month: {match.group(3)}")      # 01
    print(f"Day: {match.group(4)}")        # 15
```

### Named Groups

Named groups use the syntax `(?P<name>...)` and make patterns more readable and maintainable.

```python
import re

# Named groups with (?P<name>pattern)
log_entry = "2024-01-15 10:30:45 [ERROR] Connection failed: timeout"
pattern = r"""
    (?P<date>\d{4}-\d{2}-\d{2})
    \s+
    (?P<time>\d{2}:\d{2}:\d{2})
    \s+
    \[(?P<level>\w+)\]
    \s+
    (?P<message>.+)
"""

match = re.search(pattern, log_entry, re.VERBOSE)
if match:
    print(f"Date: {match.group('date')}")      # Date: 2024-01-15
    print(f"Time: {match.group('time')}")      # Time: 10:30:45
    print(f"Level: {match.group('level')}")    # Level: ERROR
    print(f"Message: {match.group('message')}") # Message: Connection failed: timeout

    # Get all named groups as dictionary
    print(match.groupdict())
    # {'date': '2024-01-15', 'time': '10:30:45', 'level': 'ERROR',
    #  'message': 'Connection failed: timeout'}

# Named groups in finditer
urls = "Visit https://example.com or http://test.org/page"
url_pattern = r"(?P<protocol>https?)://(?P<domain>[\w\.]+)(?P<path>/\w+)?"

for match in re.finditer(url_pattern, urls):
    info = match.groupdict()
    print(f"Protocol: {info['protocol']}, Domain: {info['domain']}, Path: {info['path']}")
# Protocol: https, Domain: example.com, Path: None
# Protocol: http, Domain: test.org, Path: /page
```

### Non-Capturing Groups

Non-capturing groups `(?:...)` group patterns without creating a capture group, improving performance and simplifying results.

```python
import re

# Capturing group - includes in results
text = "http://example.com and https://secure.org"
pattern_capturing = r"(http|https)://(\w+\.\w+)"
matches = re.findall(pattern_capturing, text)
print(matches)  # [('http', 'example.com'), ('https', 'secure.org')]

# Non-capturing group - excludes from results
pattern_non_capturing = r"(?:http|https)://(\w+\.\w+)"
matches = re.findall(pattern_non_capturing, text)
print(matches)  # ['example.com', 'secure.org']

# Practical example: complex pattern with optional parts
phone_numbers = ["555-123-4567", "+1-555-123-4567", "1-555-123-4567"]
# Non-capturing group for optional country code
pattern = r"(?:\+?1[-.]?)?(\d{3})[-.]?(\d{3})[-.]?(\d{4})"

for phone in phone_numbers:
    match = re.match(pattern, phone)
    if match:
        area, exchange, number = match.groups()
        print(f"{phone} -> ({area}) {exchange}-{number}")
# 555-123-4567 -> (555) 123-4567
# +1-555-123-4567 -> (555) 123-4567
# 1-555-123-4567 -> (555) 123-4567
```

### Backreferences

Backreferences allow you to match the same text as a previously captured group.

```python
import re

# \1, \2, etc. refer to captured groups by number
# Find repeated words
text = "The the quick brown fox fox jumps"
pattern = r"\b(\w+)\s+\1\b"
repeated = re.findall(pattern, text, re.IGNORECASE)
print(repeated)  # ['The', 'fox']

# Find matching HTML tags
html = "<div>Content</div> <span>Text</span> <p>Wrong</div>"
pattern = r"<(\w+)>.*?</\1>"
valid_tags = re.findall(pattern, html)
print(valid_tags)  # ['div', 'span']

# Named backreferences using (?P=name)
text2 = "The value is 'hello' or \"world\""
pattern = r"(?P<quote>['\"])(?P<content>.*?)(?P=quote)"
for match in re.finditer(pattern, text2):
    print(f"Quote type: {match.group('quote')}, Content: {match.group('content')}")
# Quote type: ', Content: hello
# Quote type: ", Content: world

# Detect repeated characters (potential typos)
text3 = "I haave a goood ideaa"
pattern = r"(\w)\1{1,}"
matches = [(m.group(), m.start()) for m in re.finditer(pattern, text3)]
print(matches)  # [('aa', 3), ('ooo', 12), ('aa', 18)]
```

## Substitution and Replacement

The `sub()` and `subn()` functions replace matched patterns with new text.

### Basic Substitution with sub()

```python
import re

# Simple string replacement
text = "I love cats. Cats are amazing!"
result = re.sub(r"cats", "dogs", text, flags=re.IGNORECASE)
print(result)  # I love dogs. dogs are amazing!

# Limit number of replacements with count parameter
text = "one two one two one two"
result = re.sub(r"one", "1", text, count=2)
print(result)  # 1 two 1 two one two

# Remove unwanted content
messy_text = "Price:   $50   (discounted)"
clean = re.sub(r"\s+", " ", messy_text)  # Normalize whitespace
print(clean)  # Price: $50 (discounted)

# Remove HTML tags
html_content = "<p>Hello <b>World</b></p>"
plain_text = re.sub(r"<[^>]+>", "", html_content)
print(plain_text)  # Hello World

# Censor sensitive words
message = "The password is secret123 and the key is abc456"
censored = re.sub(r"\b(password|key)\s+is\s+\w+", r"\1 is [REDACTED]", message)
print(censored)  # The password is [REDACTED] and the key is [REDACTED]
```

### Using Groups in Replacement

```python
import re

# Rearrange matched content using group references
text = "Smith, John and Doe, Jane"
result = re.sub(r"(\w+), (\w+)", r"\2 \1", text)
print(result)  # John Smith and Jane Doe

# Format phone numbers consistently
phones = "5551234567, 555-123-4567, (555) 123 4567"
pattern = r"\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})"
formatted = re.sub(pattern, r"(\1) \2-\3", phones)
print(formatted)  # (555) 123-4567, (555) 123-4567, (555) 123-4567

# Add markup to text
text = "Visit example.com or test.org for more info"
linked = re.sub(r"\b(\w+\.(com|org|net))\b", r'<a href="https://\1">\1</a>', text)
print(linked)
# Visit <a href="https://example.com">example.com</a> or <a href="https://test.org">test.org</a> for more info

# Named group references using \g<name>
date_text = "Today is 01/15/2024"
pattern = r"(?P<month>\d{2})/(?P<day>\d{2})/(?P<year>\d{4})"
iso_format = re.sub(pattern, r"\g<year>-\g<month>-\g<day>", date_text)
print(iso_format)  # Today is 2024-01-15
```

### Function-Based Replacement

Using a function for replacement enables dynamic, complex transformations.

```python
import re

# Replacement function receives match object
def double_numbers(match):
    number = int(match.group())
    return str(number * 2)

text = "I have 3 cats and 5 dogs"
result = re.sub(r"\d+", double_numbers, text)
print(result)  # I have 6 cats and 10 dogs

# Temperature conversion
def celsius_to_fahrenheit(match):
    celsius = float(match.group(1))
    fahrenheit = (celsius * 9/5) + 32
    return f"{fahrenheit:.1f}F"

temps = "Today: 20C, Tomorrow: 25C, Next week: 15C"
converted = re.sub(r"(\d+)C", celsius_to_fahrenheit, temps)
print(converted)  # Today: 68.0F, Tomorrow: 77.0F, Next week: 59.0F

# Title case transformation
def title_case_word(match):
    word = match.group()
    return word.capitalize()

text = "hello world from python"
result = re.sub(r"\b\w+", title_case_word, text)
print(result)  # Hello World From Python

# Obfuscate email addresses
def obfuscate_email(match):
    local = match.group(1)
    domain = match.group(2)
    hidden_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{hidden_local}@{domain}"

emails = "Contact john.doe@example.com or admin@site.org"
protected = re.sub(r"([\w\.]+)@([\w\.]+)", obfuscate_email, emails)
print(protected)  # Contact j******e@example.com or a***n@site.org
```

### subn() - Substitution with Count

```python
import re

# subn() returns a tuple: (result, number_of_replacements)
text = "Error Error Warning Error Warning"

result, count = re.subn(r"Error", "Fixed", text)
print(f"Result: {result}")        # Result: Fixed Fixed Warning Fixed Warning
print(f"Replacements: {count}")   # Replacements: 3

# Useful for reporting changes
def sanitize_html(html):
    result = html
    total_changes = 0

    # Remove script tags
    result, count = re.subn(r"<script[^>]*>.*?</script>", "", result, flags=re.DOTALL)
    total_changes += count

    # Remove event handlers
    result, count = re.subn(r"\s*on\w+\s*=\s*[\"'][^\"']*[\"']", "", result)
    total_changes += count

    return result, total_changes

html = '<div onclick="alert()">Hello</div><script>evil()</script>'
clean, changes = sanitize_html(html)
print(f"Cleaned HTML: {clean}")     # Cleaned HTML: <div>Hello</div>
print(f"Changes made: {changes}")   # Changes made: 2
```

## Regular Expression Flags

Flags modify how patterns are interpreted and matched.

### Common Flags

```python
import re

text = """Hello World
hello python
HELLO REGEX"""

# re.IGNORECASE (re.I) - Case-insensitive matching
matches = re.findall(r"hello", text, re.IGNORECASE)
print(matches)  # ['Hello', 'hello', 'HELLO']

# re.MULTILINE (re.M) - ^ and $ match at line boundaries
matches = re.findall(r"^hello", text, re.MULTILINE | re.IGNORECASE)
print(matches)  # ['Hello', 'hello', 'HELLO']

# re.DOTALL (re.S) - . matches newline characters
pattern_no_dotall = re.findall(r"World.hello", text, re.IGNORECASE)
print(pattern_no_dotall)  # []

pattern_dotall = re.findall(r"World.hello", text, re.IGNORECASE | re.DOTALL)
print(pattern_dotall)  # ['World\nhello']

# re.ASCII (re.A) - Make \w, \W, \b, \B, \d, \D match ASCII only
text_unicode = "cafe and cafe"
print(re.findall(r"\w+", text_unicode))  # ['cafe', 'and', 'cafe']
print(re.findall(r"\w+", text_unicode, re.ASCII))  # ['caf', 'and', 'caf']
```

### re.VERBOSE (re.X) for Readable Patterns

The VERBOSE flag allows you to write multi-line patterns with comments.

```python
import re

# Complex pattern without VERBOSE - hard to read
email_pattern_compact = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

# Same pattern with VERBOSE - much more readable
email_pattern_verbose = re.compile(r"""
    ^                       # Start of string
    [a-zA-Z0-9._%+-]+       # Local part: letters, digits, and special chars
    @                       # Literal @ symbol
    [a-zA-Z0-9.-]+          # Domain name
    \.                      # Literal dot
    [a-zA-Z]{2,}            # TLD (at least 2 letters)
    $                       # End of string
""", re.VERBOSE)

# Test the pattern
test_emails = ["user@example.com", "invalid-email", "test@site.co.uk"]
for email in test_emails:
    is_valid = email_pattern_verbose.match(email) is not None
    print(f"{email}: {'Valid' if is_valid else 'Invalid'}")

# Complex URL pattern with VERBOSE
url_pattern = re.compile(r"""
    (?P<protocol>https?://)     # Protocol (http or https)
    (?P<domain>                 # Domain group
        (?:www\.)?              # Optional www
        [a-zA-Z0-9-]+           # Domain name
        (?:\.[a-zA-Z]{2,})+     # TLD(s)
    )
    (?P<path>                   # Path group (optional)
        /[a-zA-Z0-9/_-]*        # Path segments
    )?
    (?P<query>                  # Query string group (optional)
        \?[a-zA-Z0-9=&]+
    )?
""", re.VERBOSE)

url = "https://www.example.com/path/to/page?id=123&name=test"
match = url_pattern.match(url)
if match:
    print(match.groupdict())
```

### Combining Multiple Flags

```python
import re

# Combine flags with | operator
text = """First Line
second line
THIRD LINE"""

# Match lines starting with specific words, case-insensitive
pattern = r"^(first|third)"
matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
print(matches)  # ['First', 'THIRD']

# Inline flags within pattern using (?flags)
# (?i) = IGNORECASE, (?m) = MULTILINE, (?s) = DOTALL, (?x) = VERBOSE

# Mixed case sensitivity in same pattern
pattern_inline = r"(?i)hello|WORLD"  # hello is case-insensitive, WORLD is case-sensitive
text2 = "Hello WORLD hello world"
matches = re.findall(pattern_inline, text2)
print(matches)  # ['Hello', 'WORLD', 'hello']

# Turn off flag for part of pattern using (?-flags)
# Match "python" case-insensitively but "3" exactly
pattern = r"(?i)python(?-i)3"  # Only Python3, PYTHON3, etc. but NOT Python2
```

## Compiled Patterns

Compiling patterns improves performance when using the same pattern multiple times.

### Creating Compiled Patterns

```python
import re

# Compile a pattern for reuse
email_pattern = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")

# Use compiled pattern methods
text = "Contact: user@example.com or admin@site.org"

# All re module functions are available as methods
print(email_pattern.findall(text))  # ['user@example.com', 'admin@site.org']
print(email_pattern.search(text).group())  # user@example.com

# Compile with flags
word_pattern = re.compile(r"\b[a-z]+\b", re.IGNORECASE)
print(word_pattern.findall("Hello World 123"))  # ['Hello', 'World']
```

### Performance Benefits

```python
import re
import time

# Performance comparison
text_list = ["email: test@example.com"] * 10000
pattern_string = r"[\w\.-]+@[\w\.-]+\.\w+"

# Without compilation - pattern is compiled each time
start = time.time()
for text in text_list:
    re.findall(pattern_string, text)
without_compile = time.time() - start

# With compilation - pattern compiled once
compiled_pattern = re.compile(pattern_string)
start = time.time()
for text in text_list:
    compiled_pattern.findall(text)
with_compile = time.time() - start

print(f"Without compilation: {without_compile:.4f}s")
print(f"With compilation: {with_compile:.4f}s")
print(f"Speedup: {without_compile/with_compile:.2f}x")
```

### Pattern Object Attributes

```python
import re

# Access pattern properties
pattern = re.compile(r"(?P<name>\w+)\s+(?P<age>\d+)", re.IGNORECASE | re.VERBOSE)

print(f"Pattern: {pattern.pattern}")     # (?P<name>\w+)\s+(?P<age>\d+)
print(f"Flags: {pattern.flags}")         # 66 (combination of flag values)
print(f"Groups: {pattern.groups}")       # 2
print(f"Group index: {pattern.groupindex}")  # {'name': 1, 'age': 2}

# Practical use: validate and extract
class DataExtractor:
    def __init__(self):
        self.patterns = {
            'email': re.compile(r"[\w\.-]+@[\w\.-]+\.\w+"),
            'phone': re.compile(r"\d{3}[-.]?\d{3}[-.]?\d{4}"),
            'date': re.compile(r"\d{4}-\d{2}-\d{2}"),
            'url': re.compile(r"https?://[\w\.-]+(?:/[\w\.-]*)*")
        }

    def extract_all(self, text):
        results = {}
        for name, pattern in self.patterns.items():
            matches = pattern.findall(text)
            if matches:
                results[name] = matches
        return results

extractor = DataExtractor()
text = """
Contact: john@example.com, 555-123-4567
Meeting: 2024-01-15
Info: https://example.com/page
"""
print(extractor.extract_all(text))
# {'email': ['john@example.com'], 'phone': ['555-123-4567'],
#  'date': ['2024-01-15'], 'url': ['https://example.com/page']}
```

## Lookahead and Lookbehind Assertions

Lookahead and lookbehind are zero-width assertions that match a position without consuming characters.

### Positive Lookahead (?=...)

Positive lookahead matches if the pattern ahead matches, without including it in the match.

```python
import re

# Match word followed by specific pattern
text = "cat123 dog456 cat789 bird"

# Find words followed by digits
pattern = r"\w+(?=\d)"
matches = re.findall(pattern, text)
print(matches)  # ['cat', 'dog', 'cat']

# Password validation - must have at least one digit ahead
def has_digit(password):
    return re.search(r"(?=.*\d)", password) is not None

print(has_digit("password"))    # False
print(has_digit("password1"))   # True

# Find prices that have cents
prices = "$10 $20.50 $30.99 $40"
pattern = r"\$\d+(?=\.\d{2})"
prices_with_cents = re.findall(pattern, prices)
print(prices_with_cents)  # ['$20', '$30']

# Multiple lookaheads for password validation
def validate_password(password):
    """
    Password must have:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    pattern = r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$"
    return re.match(pattern, password) is not None

print(validate_password("weak"))           # False
print(validate_password("StrongPass1!"))   # True
print(validate_password("NoSpecial1"))     # False
```

### Negative Lookahead (?!...)

Negative lookahead matches if the pattern ahead does NOT match.

```python
import re

# Match word NOT followed by specific pattern
text = "cat123 dog bird456 fish"

# Find words NOT followed by digits
pattern = r"\b\w+\b(?!\d)"
matches = re.findall(pattern, text)
print(matches)  # ['cat12', 'dog', 'bird45', 'fish']

# Better: match complete words not followed by digits
pattern = r"\b[a-zA-Z]+\b(?!\d)"
matches = re.findall(pattern, text)
print(matches)  # ['dog', 'fish']

# Find file names without certain extensions
files = ["script.py", "data.json", "image.png", "style.css", "app.js"]
# Match files that are NOT .png or .css
pattern = r"\w+\.(?!png|css)\w+"
for f in files:
    if re.match(pattern, f):
        print(f"Include: {f}")
# Include: script.py
# Include: data.json
# Include: app.js

# Validate no consecutive repeated characters
def no_consecutive_repeats(text):
    pattern = r"^(?!.*(.)\1).+$"
    return re.match(pattern, text) is not None

print(no_consecutive_repeats("hello"))   # False (ll)
print(no_consecutive_repeats("world"))   # True
```

### Positive Lookbehind (?<=...)

Positive lookbehind matches if the pattern behind matches, without including it in the match.

```python
import re

# Match content after specific pattern
text = "Price: $100, Cost: $200, Value: $300"

# Find amounts after dollar sign
pattern = r"(?<=\$)\d+"
amounts = re.findall(pattern, text)
print(amounts)  # ['100', '200', '300']

# Extract domain from email
emails = "john@example.com, jane@test.org"
pattern = r"(?<=@)[\w\.]+"
domains = re.findall(pattern, emails)
print(domains)  # ['example.com', 'test.org']

# Extract values from key-value pairs
config = "host=localhost;port=8080;debug=true"
pattern = r"(?<=port=)\d+"
port = re.search(pattern, config)
print(port.group() if port else None)  # 8080

# Find words after "the"
text = "the quick brown fox and the lazy dog"
pattern = r"(?<=the\s)\w+"
words_after_the = re.findall(pattern, text)
print(words_after_the)  # ['quick', 'lazy']
```

### Negative Lookbehind (?<!...)

Negative lookbehind matches if the pattern behind does NOT match.

```python
import re

# Match pattern NOT preceded by specific text
text = "USD100 EUR200 GBP300 100"

# Find numbers NOT preceded by currency code
pattern = r"(?<![A-Z]{3})\b\d+\b"
matches = re.findall(pattern, text)
print(matches)  # ['100'] (only the standalone number)

# Find http:// but not https://
urls = "http://example.com https://secure.com http://test.org"
pattern = r"(?<!s)://[\w\.]+"
insecure = re.findall(pattern, urls)
print(insecure)  # ['://example.com', '://test.org']

# Validate no leading zeros (except for "0" itself)
def no_leading_zeros(number_str):
    pattern = r"^(?!0\d)\d+$"
    return re.match(pattern, number_str) is not None

print(no_leading_zeros("123"))   # True
print(no_leading_zeros("0"))     # True
print(no_leading_zeros("007"))   # False
print(no_leading_zeros("100"))   # True
```

### Combined Lookaround Patterns

```python
import re

# Extract content between specific markers
text = "Start[content1]End Start[content2]End other[ignored]"

# Match content inside [] only when preceded by "Start" and followed by "End"
pattern = r"(?<=Start\[)[^\]]+(?=\]End)"
matches = re.findall(pattern, text)
print(matches)  # ['content1', 'content2']

# Find and replace while preserving context
text = "Total: $100.00, Tax: $15.00, Grand Total: $115.00"

# Double only amounts after "Total:"
def double_totals(text):
    def double_amount(match):
        amount = float(match.group())
        return f"{amount * 2:.2f}"

    # Match numbers after "Total: $"
    pattern = r"(?<=Total: \$)\d+\.\d{2}"
    return re.sub(pattern, double_amount, text)

result = double_totals(text)
print(result)  # Total: $200.00, Tax: $15.00, Grand Total: $230.00

# Extract quoted strings while ignoring escaped quotes
text = 'Say "hello \\"world\\"" and "goodbye"'
# This is complex - match " not preceded by \
pattern = r'"(?:[^"\\]|\\.)*"'
quotes = re.findall(pattern, text)
print(quotes)  # ['"hello \\"world\\""', '"goodbye"']
```

## Splitting Strings

The `split()` function divides strings based on pattern matches.

```python
import re

# Split on multiple delimiters
text = "apple,banana;orange:grape|melon"
items = re.split(r"[,;:|]", text)
print(items)  # ['apple', 'banana', 'orange', 'grape', 'melon']

# Split on whitespace (handles multiple spaces, tabs, newlines)
text = "one  two\t\tthree\n\nfour"
words = re.split(r"\s+", text)
print(words)  # ['one', 'two', 'three', 'four']

# Limit number of splits with maxsplit
text = "a:b:c:d:e"
parts = re.split(r":", text, maxsplit=2)
print(parts)  # ['a', 'b', 'c:d:e']

# Keep delimiters using capturing groups
text = "Hello123World456Python"
parts = re.split(r"(\d+)", text)
print(parts)  # ['Hello', '123', 'World', '456', 'Python']

# Split on sentence boundaries (keeping punctuation)
text = "First sentence. Second one! Third? Fourth."
sentences = re.split(r"(?<=[.!?])\s+", text)
print(sentences)  # ['First sentence.', 'Second one!', 'Third?', 'Fourth.']

# Split camelCase or PascalCase
text = "getUserName and setFirstName"
words = re.split(r"(?<=[a-z])(?=[A-Z])", text)
print(words)  # ['get', 'User', 'Name and set', 'First', 'Name']

# Better camelCase split
def split_camel_case(text):
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", text).split()

print(split_camel_case("getUserName"))  # ['get', 'User', 'Name']
print(split_camel_case("XMLParser"))    # ['XMLParser']
```

## Practical Examples

### Email Validation and Extraction

```python
import re

def validate_email(email):
    """Comprehensive email validation."""
    pattern = re.compile(r"""
        ^                           # Start
        (?!.*\.\.)                  # No consecutive dots
        [a-zA-Z0-9]                 # Must start with alphanumeric
        [a-zA-Z0-9._%+-]{0,63}      # Local part (max 64 chars total)
        @                           # @ symbol
        (?!-)                       # Domain can't start with hyphen
        [a-zA-Z0-9-]{1,63}          # Domain name
        (?<!-)                      # Domain can't end with hyphen
        (?:\.[a-zA-Z]{2,})+         # TLD(s)
        $                           # End
    """, re.VERBOSE | re.IGNORECASE)

    return pattern.match(email) is not None

def extract_emails(text):
    """Extract all email addresses from text."""
    pattern = r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"
    return re.findall(pattern, text)

# Test validation
test_emails = [
    "user@example.com",           # Valid
    "user.name+tag@example.co.uk", # Valid
    "user@sub.domain.example.com", # Valid
    "invalid@",                    # Invalid
    "@invalid.com",                # Invalid
    "user@-invalid.com",           # Invalid
    "user..name@example.com"       # Invalid (consecutive dots)
]

for email in test_emails:
    status = "Valid" if validate_email(email) else "Invalid"
    print(f"{email}: {status}")

# Test extraction
document = """
Please contact our team at:
- Sales: sales@company.com
- Support: support@company.org
- Personal inquiries: john.doe@example.co.uk
"""
print(f"\nExtracted emails: {extract_emails(document)}")
```

### Log File Parser

```python
import re
from datetime import datetime
from collections import defaultdict

def parse_log_file(log_content):
    """Parse log entries and return structured data."""

    pattern = re.compile(r"""
        (?P<timestamp>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})  # Timestamp
        \s+
        \[(?P<level>DEBUG|INFO|WARNING|ERROR|CRITICAL)\]      # Log level
        \s+
        (?P<source>[\w\.]+):                                   # Source module
        \s+
        (?P<message>.+)                                        # Message
    """, re.VERBOSE)

    entries = []
    for line in log_content.strip().split('\n'):
        match = pattern.match(line)
        if match:
            entry = match.groupdict()
            entry['timestamp'] = datetime.strptime(
                entry['timestamp'],
                '%Y-%m-%d %H:%M:%S'
            )
            entries.append(entry)

    return entries

def analyze_logs(entries):
    """Analyze log entries."""
    level_counts = defaultdict(int)
    source_errors = defaultdict(list)

    for entry in entries:
        level_counts[entry['level']] += 1
        if entry['level'] in ('ERROR', 'CRITICAL'):
            source_errors[entry['source']].append(entry['message'])

    return dict(level_counts), dict(source_errors)

# Example usage
log_content = """
2024-01-15 10:30:45 [INFO] app.main: Application started
2024-01-15 10:30:46 [DEBUG] db.connection: Connecting to database
2024-01-15 10:30:47 [INFO] db.connection: Connected successfully
2024-01-15 10:31:00 [WARNING] cache.manager: Cache miss for key 'user_123'
2024-01-15 10:31:15 [ERROR] api.handler: Request timeout: /api/users
2024-01-15 10:31:20 [ERROR] db.connection: Connection pool exhausted
2024-01-15 10:31:25 [CRITICAL] app.main: Service unavailable
"""

entries = parse_log_file(log_content)
level_counts, source_errors = analyze_logs(entries)

print("Log Level Summary:")
for level, count in sorted(level_counts.items()):
    print(f"  {level}: {count}")

print("\nErrors by Source:")
for source, messages in source_errors.items():
    print(f"  {source}:")
    for msg in messages:
        print(f"    - {msg}")
```

### URL Parser

```python
import re

def parse_url(url):
    """Parse URL into components."""
    pattern = re.compile(r"""
        ^
        (?P<protocol>https?|ftp)://         # Protocol
        (?:(?P<user>\w+)                    # Optional username
           (?::(?P<password>\w+))?          # Optional password
           @)?
        (?P<host>[\w.-]+)                   # Host
        (?::(?P<port>\d+))?                 # Optional port
        (?P<path>/[^\?#]*)?                 # Optional path
        (?:\?(?P<query>[^#]*))?             # Optional query string
        (?:\#(?P<fragment>.*))?             # Optional fragment
        $
    """, re.VERBOSE)

    match = pattern.match(url)
    if match:
        result = match.groupdict()

        # Parse query string into dictionary
        if result['query']:
            query_pattern = r"([^=&]+)=([^&]*)"
            result['query_params'] = dict(re.findall(query_pattern, result['query']))
        else:
            result['query_params'] = {}

        return result
    return None

# Test URLs
test_urls = [
    "https://example.com",
    "https://example.com:8080/path/to/page",
    "http://user:pass@example.com/api?key=value&foo=bar",
    "https://example.com/search?q=python+regex#results",
    "ftp://files.example.com/downloads/file.zip"
]

for url in test_urls:
    parsed = parse_url(url)
    if parsed:
        print(f"\nURL: {url}")
        print(f"  Protocol: {parsed['protocol']}")
        print(f"  Host: {parsed['host']}")
        print(f"  Port: {parsed['port']}")
        print(f"  Path: {parsed['path']}")
        print(f"  Query params: {parsed['query_params']}")
```

### Data Cleaning and Normalization

```python
import re

def clean_phone_number(phone):
    """Normalize phone number to standard format."""
    # Remove all non-digits
    digits = re.sub(r"\D", "", phone)

    # Handle different lengths
    if len(digits) == 10:
        return re.sub(r"(\d{3})(\d{3})(\d{4})", r"(\1) \2-\3", digits)
    elif len(digits) == 11 and digits[0] == '1':
        return re.sub(r"1(\d{3})(\d{3})(\d{4})", r"+1 (\1) \2-\3", digits)
    return None

def clean_whitespace(text):
    """Normalize whitespace in text."""
    # Replace multiple spaces with single space
    text = re.sub(r" {2,}", " ", text)
    # Replace multiple newlines with double newline
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove leading/trailing whitespace from lines
    text = re.sub(r"^[ \t]+|[ \t]+$", "", text, flags=re.MULTILINE)
    return text.strip()

def extract_numbers(text, include_decimals=True):
    """Extract all numbers from text."""
    if include_decimals:
        pattern = r"-?\d+\.?\d*"
    else:
        pattern = r"-?\d+"
    return [float(n) if '.' in n else int(n) for n in re.findall(pattern, text)]

def redact_sensitive_data(text):
    """Redact sensitive information from text."""
    # Redact SSN
    text = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[SSN REDACTED]", text)
    # Redact credit card numbers
    text = re.sub(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", "[CARD REDACTED]", text)
    # Redact email addresses
    text = re.sub(r"\b[\w.-]+@[\w.-]+\.\w+\b", "[EMAIL REDACTED]", text)
    return text

# Test examples
phones = ["555-123-4567", "(555) 123.4567", "1-555-123-4567", "+1 555 123 4567"]
for phone in phones:
    print(f"{phone} -> {clean_phone_number(phone)}")

messy_text = """
This   has    irregular     spacing.


Too many blank lines.

   Indented lines.
"""
print("\nCleaned text:")
print(clean_whitespace(messy_text))

data_text = "Temperature: 72.5F, Humidity: -15%, Count: 42"
print(f"\nExtracted numbers: {extract_numbers(data_text)}")

sensitive = "Contact john@example.com, SSN: 123-45-6789, Card: 4532-1234-5678-9012"
print(f"\nRedacted: {redact_sensitive_data(sensitive)}")
```

### Markdown Link Extractor

```python
import re

def extract_markdown_links(markdown_text):
    """Extract all links from markdown text."""

    # Pattern for [text](url) style links
    inline_pattern = r"\[(?P<text>[^\]]+)\]\((?P<url>[^)]+)\)"

    # Pattern for [text][ref] style links
    reference_pattern = r"\[(?P<text>[^\]]+)\]\[(?P<ref>[^\]]+)\]"

    # Pattern for reference definitions [ref]: url
    definition_pattern = r"^\[(?P<ref>[^\]]+)\]:\s*(?P<url>\S+)"

    results = {
        'inline_links': [],
        'reference_links': [],
        'reference_definitions': {}
    }

    # Extract inline links
    for match in re.finditer(inline_pattern, markdown_text):
        results['inline_links'].append({
            'text': match.group('text'),
            'url': match.group('url')
        })

    # Extract reference-style links
    for match in re.finditer(reference_pattern, markdown_text):
        results['reference_links'].append({
            'text': match.group('text'),
            'ref': match.group('ref')
        })

    # Extract reference definitions
    for match in re.finditer(definition_pattern, markdown_text, re.MULTILINE):
        results['reference_definitions'][match.group('ref')] = match.group('url')

    return results

markdown = """
# My Document

Check out [Python](https://python.org) for more info.
Also see [the documentation][docs] and [examples][examples].

Here's an [inline link](https://example.com/page?id=1).

[docs]: https://docs.python.org
[examples]: https://github.com/python/examples
"""

links = extract_markdown_links(markdown)
print("Inline links:")
for link in links['inline_links']:
    print(f"  {link['text']} -> {link['url']}")

print("\nReference links:")
for link in links['reference_links']:
    ref = link['ref']
    url = links['reference_definitions'].get(ref, 'undefined')
    print(f"  {link['text']} -> {url}")
```

## Best Practices and Common Pitfalls

### Avoiding Catastrophic Backtracking

```python
import re
import time

# Bad pattern - can cause exponential backtracking
# bad_pattern = r"(a+)+b"  # Don't use this!

# This would be extremely slow or hang on certain inputs:
# re.match(bad_pattern, "a" * 25 + "c")

# Good alternatives - avoid nested quantifiers
good_pattern1 = r"a+b"           # Simple, efficient
good_pattern2 = r"(?:a+)+b"      # Still problematic
good_pattern3 = r"a{1,100}b"     # Bounded, predictable

# Use atomic groups or possessive quantifiers when available
# Python's re module doesn't support these, but regex module does

# Practical tip: set timeouts for regex operations
def safe_regex_match(pattern, text, timeout=1.0):
    """Match with a safety mechanism."""
    import signal

    def handler(signum, frame):
        raise TimeoutError("Regex operation timed out")

    # Note: signal only works on Unix
    try:
        signal.signal(signal.SIGALRM, handler)
        signal.setitimer(signal.ITIMER_REAL, timeout)
        result = re.match(pattern, text)
        signal.setitimer(signal.ITIMER_REAL, 0)
        return result
    except:
        return None
```

### Using Non-Greedy Quantifiers Correctly

```python
import re

html = "<p>First</p><p>Second</p>"

# Greedy - matches too much
greedy = re.findall(r"<p>.*</p>", html)
print(f"Greedy: {greedy}")  # ['<p>First</p><p>Second</p>']

# Non-greedy - matches individual tags
non_greedy = re.findall(r"<p>.*?</p>", html)
print(f"Non-greedy: {non_greedy}")  # ['<p>First</p>', '<p>Second</p>']

# Even better - be specific about what can be matched
specific = re.findall(r"<p>[^<]*</p>", html)
print(f"Specific: {specific}")  # ['<p>First</p>', '<p>Second</p>']
```

### Testing Regular Expressions

```python
import re

def test_pattern(pattern, test_cases):
    """Test a regex pattern against multiple cases."""
    compiled = re.compile(pattern)

    print(f"Testing pattern: {pattern}")
    print("-" * 50)

    all_passed = True
    for text, expected in test_cases:
        match = compiled.search(text)
        result = match.group() if match else None
        passed = result == expected

        status = "PASS" if passed else "FAIL"
        print(f"  {status}: '{text}' -> {result} (expected: {expected})")

        if not passed:
            all_passed = False

    return all_passed

# Example: test email pattern
email_pattern = r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"

test_cases = [
    ("Contact: user@example.com", "user@example.com"),
    ("Email is test.user@domain.co.uk here", "test.user@domain.co.uk"),
    ("No email here", None),
    ("Invalid: @example.com", None),
    ("Also invalid: user@", None),
]

test_pattern(email_pattern, test_cases)
```

### Error Handling

```python
import re

def safe_regex_compile(pattern):
    """Safely compile a regex pattern with error handling."""
    try:
        return re.compile(pattern)
    except re.error as e:
        print(f"Invalid regex pattern: {e}")
        return None

def safe_search(pattern, text):
    """Safely search for pattern with error handling."""
    try:
        compiled = re.compile(pattern) if isinstance(pattern, str) else pattern
        return compiled.search(text)
    except re.error as e:
        print(f"Regex error: {e}")
        return None
    except TypeError as e:
        print(f"Type error: {e}")
        return None

# Test error handling
print("Testing invalid patterns:")
safe_regex_compile(r"[")           # Unclosed bracket
safe_regex_compile(r"*abc")        # Nothing to repeat
safe_regex_compile(r"(?P<>test)")  # Empty group name

print("\nTesting safe search:")
result = safe_search(r"\d+", "abc123")
print(f"Valid search: {result.group() if result else None}")  # 123

result = safe_search(r"[", "test")
print(f"Invalid pattern: {result}")  # None with error message
```

## Conclusion

Python's `re` module provides a comprehensive toolkit for text processing through regular expressions. This guide covered the essential concepts and techniques:

1. **Pattern Syntax**: Character classes, quantifiers, anchors, and special characters form the foundation of regex patterns.

2. **Matching Functions**: Use `match()` for beginning-of-string matches, `search()` for finding patterns anywhere, `findall()` for extracting all matches, and `finditer()` for detailed match information.

3. **Groups**: Capturing groups extract specific parts of matches, named groups improve readability, and backreferences enable matching repeated content.

4. **Substitution**: The `sub()` function enables powerful text transformation with support for group references and dynamic replacement functions.

5. **Flags**: Modifiers like `IGNORECASE`, `MULTILINE`, and `VERBOSE` customize pattern behavior.

6. **Compiled Patterns**: Pre-compiling frequently used patterns improves performance.

7. **Lookahead and Lookbehind**: Zero-width assertions enable matching based on context without consuming characters.

Regular expressions are powerful but can be complex. Always test patterns thoroughly, use `re.VERBOSE` for complex patterns, and be mindful of performance implications, especially with nested quantifiers. When regex patterns become too complex, consider whether alternative string methods or dedicated parsing libraries might be more appropriate.
