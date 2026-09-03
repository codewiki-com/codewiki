---
title: Python Abstract Syntax Trees (AST)
description: A comprehensive guide to Python's ast module for parsing and analyzing Python code, with practical examples of traversing, transforming, and manipulating abstract syntax trees.
track: python
section: stdlib
difficulty: advanced
tags:
  - ast
  - code-analysis
  - metaprogramming
  - parsing
  - abstract-syntax-tree
  - compiler-design
status: imported
origin: old/src/content/docs/python/ast.en.md
divergence: 0.122
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Explanation

The Abstract Syntax Tree (AST) is a fundamental data structure in programming language design that represents the hierarchical structure of source code. Python's `ast` module provides tools to parse Python source code into an AST and traverse or manipulate this tree.

An AST is a tree representation of the abstract syntactic structure of source code. Unlike a concrete syntax tree that preserves all details (parentheses, spacing, etc.), an AST only retains semantic information necessary for compilation or interpretation. Each node in the tree represents a construct in the source code—functions, classes, expressions, statements, and so on.

### Historical Context

Python's `ast` module was introduced in Python 2.6 as part of PEP 3108's standard library reorganization. Before this, most AST manipulation required the `compiler` module or direct parsing. The modern `ast` module provides a stable, well-documented interface aligned with the Python compiler's internal representations.

### Problem It Solves

The `ast` module enables:
- **Code analysis**: Finding patterns, detecting issues, or gathering metrics
- **Code transformation**: Modifying code programmatically (linting, optimization)
- **Metaprogramming**: Building tools that understand code structure
- **Education**: Understanding how Python interprets source code
- **Code generation**: Creating Python code from other representations

## Core Principles

### Parsing Process

When Python parses source code, it follows this sequence:
1. **Tokenization**: Source code → tokens (lexical analysis)
2. **Parsing**: Tokens → abstract syntax tree (syntactic analysis)
3. **Compilation**: AST → bytecode (semantic analysis & code generation)

The `ast` module exposes step 2 directly to users.

### Tree Structure

An AST is composed of:
- **Nodes**: Objects representing code constructs (ast.Module, ast.FunctionDef, etc.)
- **Fields**: Attributes of nodes that reference child nodes or values
- **Values**: Leaf data (strings, numbers, operators)

```
Module
├── body: [stmt*]
│   ├── FunctionDef
│   │   ├── name: str
│   │   ├── args: arguments
│   │   └── body: [stmt*]
│   └── ...
```

### Node Hierarchy

All AST nodes inherit from `ast.AST` base class. Nodes are categorized:
- **stmt** (statements): assignments, loops, conditionals
- **expr** (expressions): operations, literals, variables
- **mod** (modules): the root node type
- **comprehension**: list/dict/set comprehensions
- **excepthandler**: exception handlers
- **arguments**: function arguments
- **keyword**: keyword arguments
- **alias**: import aliases

### Immutability and Building

AST nodes are mutable during construction but should be treated as immutable once created. The module supports:
- **Direct instantiation**: Creating nodes and setting attributes
- **parse()**: Parsing Python code into an AST
- **dump()**: Converting AST to readable string representation

## Key Points

### Key Functions

**ast.parse(source, filename='<unknown>', mode='exec', *, type_comments=False, feature_version=None)**
- Parses Python source code into an AST
- Modes: 'exec' (statements), 'eval' (expression), 'single' (interactive)
- Returns an ast.Module, ast.Expression, or ast.Interactive node

**ast.dump(node, annotate_fields=True, include_attributes=False, indent=None)**
- Returns string representation of an AST node tree
- Useful for debugging and visualization
- indent parameter (3.9+) for formatted output

**ast.walk(node)**
- Yields all descendant nodes in the tree (depth-first order)
- Convenient for finding all nodes of a type

**ast.fix_missing_locations(node)**
- Fills in missing lineno and col_offset attributes
- Essential after programmatically creating AST nodes

**ast.increment_lineno(node, n=1)**
- Adds n to lineno and end_lineno of all nodes
- Useful when inserting code blocks

### Common Node Types

**Module, Interactive, Expression**
- Root nodes for different parse modes

**FunctionDef, AsyncFunctionDef**
- Function/async function definitions
- Has name, args (arguments), body, decorator_list, returns

**ClassDef**
- Class definitions
- Has name, bases, keywords, body, decorator_list

**Return, Yield, YieldFrom**
- Return statements
- Yield expressions for generators

**Assign, AugAssign, AnnAssign**
- Assignment statements
- targets, value, and annotation handling

**For, AsyncFor, While, If**
- Loop and conditional statements

**Try, ExceptHandler, Raise**
- Exception handling

**With, AsyncWith**
- Context managers

**Import, ImportFrom**
- Module imports

**Call, Attribute, Subscript**
- Function calls, attribute access, indexing

**BinOp, UnaryOp, Compare**
- Mathematical and comparison operations

**Lambda, ListComp, DictComp, SetComp, GeneratorExp**
- Functional and comprehension constructs

### Node Attributes

Every node has:
- **lineno**: Line number in source code
- **col_offset**: Column offset in source code
- **end_lineno, end_col_offset**: End position (Python 3.8+)

These enable error reporting with precise locations.

### Visitor Pattern

The `ast.NodeVisitor` class implements the visitor pattern for tree traversal:
- Override `visit_<NodeType>()` methods for specific node types
- Override `generic_visit()` for default handling
- Return values enable tree transformation

## Code Examples

### Example 1: Basic Parsing and Dumping

```python
import ast

code = """
def greet(name):
    return f"Hello, {name}!"

result = greet("Alice")
"""

tree = ast.parse(code)
print(ast.dump(tree, indent=2))
```

Output shows the complete tree structure with all nodes and attributes.

### Example 2: Finding All Function Definitions

```python
import ast

code = """
def func1():
    pass

class MyClass:
    def method1(self):
        pass

    def method2(self):
        pass

def func2():
    pass
"""

tree = ast.parse(code)

class FunctionFinder(ast.NodeVisitor):
    def __init__(self):
        self.functions = []

    def visit_FunctionDef(self, node):
        self.functions.append({
            'name': node.name,
            'lineno': node.lineno,
            'args': [arg.arg for arg in node.args.args]
        })
        self.generic_visit(node)  # Continue visiting child nodes

    def visit_AsyncFunctionDef(self, node):
        # Also handle async functions
        self.visit_FunctionDef(node)

finder = FunctionFinder()
finder.visit(tree)

for func in finder.functions:
    print(f"Function {func['name']} at line {func['lineno']} "
          f"with args: {func['args']}")
# Output:
# Function func1 at line 2 with args: []
# Function method1 at line 6 with args: ['self']
# Function method2 at line 9 with args: ['self']
# Function func2 at line 13 with args: []
```

### Example 3: Counting Occurrences of Variables

```python
import ast

code = """
x = 10
y = 20
z = x + y
result = x * 2 + y / 3
"""

tree = ast.parse(code)

class VariableCounter(ast.NodeVisitor):
    def __init__(self):
        self.names = {}

    def visit_Name(self, node):
        # Count occurrences of variable names
        if node.id not in self.names:
            self.names[node.id] = {'read': 0, 'write': 0}

        # Check context: Store = assignment, Load = usage
        if isinstance(node.ctx, ast.Store):
            self.names[node.id]['write'] += 1
        elif isinstance(node.ctx, ast.Load):
            self.names[node.id]['read'] += 1

        self.generic_visit(node)

counter = VariableCounter()
counter.visit(tree)

for name, counts in counter.names.items():
    print(f"{name}: written {counts['write']} times, "
          f"read {counts['read']} times")
# Output:
# x: written 1 times, read 2 times
# y: written 1 times, read 2 times
# z: written 1 times, read 0 times
# result: written 1 times, read 0 times
```

### Example 4: Transforming the AST (Renaming Variables)

```python
import ast

code = """
def calculate():
    x = 10
    y = 20
    return x + y
"""

tree = ast.parse(code)

class VariableRenamer(ast.NodeTransformer):
    def __init__(self, old_name, new_name):
        self.old_name = old_name
        self.new_name = new_name

    def visit_Name(self, node):
        if node.id == self.old_name:
            node.id = self.new_name
        return node

renamer = VariableRenamer('x', 'value')
new_tree = renamer.visit(tree)

# Fix missing location info after transformation
ast.fix_missing_locations(new_tree)

# Convert back to source code
import astor
print(astor.to_source(new_tree))
# Output: 'x' renamed to 'value' throughout
```

### Example 5: Code Quality Analysis (Finding Long Functions)

```python
import ast

code = """
def long_function():
    # This function has many statements
    a = 1
    b = 2
    c = 3
    d = 4
    e = 5
    f = 6
    g = 7
    h = 8
    i = 9
    j = 10
    return a + b + c + d + e + f + g + h + i + j

def short_function():
    return 42
"""

tree = ast.parse(code)

class FunctionComplexityAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.current_function = None
        self.results = []

    def visit_FunctionDef(self, node):
        # Count statements in function body
        statement_count = len(node.body)

        self.results.append({
            'name': node.name,
            'lineno': node.lineno,
            'statements': statement_count
        })

        self.generic_visit(node)

analyzer = FunctionComplexityAnalyzer()
analyzer.visit(tree)

for func in analyzer.results:
    print(f"{func['name']}: {func['statements']} statements "
          f"(line {func['lineno']})")
    if func['statements'] > 5:
        print(f"  WARNING: Consider refactoring - function is too long")
# Output:
# long_function: 12 statements (line 2)
#   WARNING: Consider refactoring - function is too long
# short_function: 1 statements (line 14)
```

### Example 6: Detecting Unused Variables

```python
import ast

code = """
def process_data(data):
    result = 0
    unused_var = 100
    for item in data:
        result += item
    return result
"""

tree = ast.parse(code)

class UnusedVariableDetector(ast.NodeVisitor):
    def __init__(self):
        self.assigned = set()
        self.used = set()

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Store):
            self.assigned.add(node.id)
        elif isinstance(node.ctx, ast.Load):
            self.used.add(node.id)
        self.generic_visit(node)

detector = UnusedVariableDetector()
detector.visit(tree)

unused = detector.assigned - detector.used
print(f"Unused variables: {unused}")
# Output: Unused variables: {'unused_var'}
```

### Example 7: Creating AST Nodes Programmatically

```python
import ast

# Programmatically create this code:
# x = 42
# print(x)

module = ast.Module(
    body=[
        ast.Assign(
            targets=[ast.Name(id='x', ctx=ast.Store())],
            value=ast.Constant(value=42)
        ),
        ast.Expr(
            value=ast.Call(
                func=ast.Name(id='print', ctx=ast.Load()),
                args=[ast.Name(id='x', ctx=ast.Load())],
                keywords=[]
            )
        )
    ],
    type_ignores=[]
)

# Fix missing location info
ast.fix_missing_locations(module)

# Compile and execute
code = compile(module, filename='<ast>', mode='exec')
exec(code)
# Output: 42
```

### Example 8: Extracting Documentation

```python
import ast
import inspect

code = """
def add(a, b):
    '''Add two numbers together.

    Args:
        a: First number
        b: Second number

    Returns:
        Sum of a and b
    '''
    return a + b

class Calculator:
    '''A simple calculator class.'''

    def multiply(self, x, y):
        '''Multiply two numbers.'''
        return x * y
"""

tree = ast.parse(code)

class DocstringExtractor(ast.NodeVisitor):
    def __init__(self):
        self.docstrings = []

    def visit_FunctionDef(self, node):
        docstring = ast.get_docstring(node)
        self.docstrings.append({
            'type': 'function',
            'name': node.name,
            'docstring': docstring
        })
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        docstring = ast.get_docstring(node)
        self.docstrings.append({
            'type': 'class',
            'name': node.name,
            'docstring': docstring
        })
        self.generic_visit(node)

    def visit_Module(self, node):
        docstring = ast.get_docstring(node)
        if docstring:
            self.docstrings.append({
                'type': 'module',
                'name': '<module>',
                'docstring': docstring
            })
        self.generic_visit(node)

extractor = DocstringExtractor()
extractor.visit(tree)

for item in extractor.docstrings:
    print(f"{item['type'].upper()}: {item['name']}")
    if item['docstring']:
        lines = item['docstring'].split('\n')
        for line in lines[:2]:  # Show first 2 lines
            print(f"  {line}")
    print()
```

## Best Practices

### Always Use NodeVisitor for Traversal

```python
# Good: Uses visitor pattern
class MyVisitor(ast.NodeVisitor):
    def visit_FunctionDef(self, node):
        # Handle function definitions
        self.generic_visit(node)

# Avoid: Manual recursion
def traverse(node):
    # Hard to maintain, easy to miss cases
    for child in ast.iter_child_nodes(node):
        traverse(child)
```

### Use NodeTransformer for Modifications

```python
# Good: Use NodeTransformer for tree modification
class MyTransformer(ast.NodeTransformer):
    def visit_Name(self, node):
        # Modify and return
        return node

# Always fix locations after transformation
new_tree = transformer.visit(tree)
ast.fix_missing_locations(new_tree)

# Don't modify tree in place unless necessary
```

### Handle All Relevant Node Types

```python
# Good: Handle async variants
class FunctionVisitor(ast.NodeVisitor):
    def visit_FunctionDef(self, node):
        self.process_function(node)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self.process_function(node)
        self.generic_visit(node)

    def process_function(self, node):
        # Common processing logic
        pass

# Don't assume only one variant exists
```

### Manage Context Properly

```python
# Good: Track context for accurate analysis
class ContextAwareVisitor(ast.NodeVisitor):
    def __init__(self):
        self.scope_stack = [set()]  # Stack of variable scopes

    def visit_FunctionDef(self, node):
        self.scope_stack.append(set())  # New scope
        for arg in node.args.args:
            self.scope_stack[-1].add(arg.arg)

        self.generic_visit(node)
        self.scope_stack.pop()  # Exit scope
```

### Cache Parsed Results

```python
# Good: Cache expensive AST parsing
import functools

@functools.lru_cache(maxsize=128)
def get_ast(source_code):
    return ast.parse(source_code)

# Avoid repeated parsing of the same code
```

### Use Type Annotations in Visitor Methods

```python
from typing import Optional, Any

class TypedVisitor(ast.NodeVisitor):
    def visit_FunctionDef(self, node: ast.FunctionDef) -> Optional[Any]:
        # Clear type hints help with IDE support and maintainability
        return self.generic_visit(node)
```

## Common Pitfalls

### Forgetting ast.fix_missing_locations()

```python
# WRONG: Creates invalid bytecode
module = ast.Module(
    body=[ast.Pass()],
    type_ignores=[]
)
compile(module, '<ast>', 'exec')  # Will fail!

# CORRECT: Always fix locations
ast.fix_missing_locations(module)
compile(module, '<ast>', 'exec')  # Works!
```

### Not Calling generic_visit()

```python
# WRONG: Doesn't visit child nodes
class BadVisitor(ast.NodeVisitor):
    def visit_FunctionDef(self, node):
        print(node.name)
        # Forgot to call generic_visit!

# CORRECT: Continue traversal
class GoodVisitor(ast.NodeVisitor):
    def visit_FunctionDef(self, node):
        print(node.name)
        self.generic_visit(node)  # Essential!
```

### Confusing Load and Store Contexts

```python
# WRONG: Doesn't distinguish between read/write
class BadCounter(ast.NodeVisitor):
    def visit_Name(self, node):
        self.count += 1  # Counts both reads and writes

# CORRECT: Check context
class GoodCounter(ast.NodeVisitor):
    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            self.reads += 1
        elif isinstance(node.ctx, ast.Store):
            self.writes += 1
```

### Not Handling Different Parse Modes

```python
# WRONG: Assumes everything is a Module
code = "x + 5"
tree = ast.parse(code, mode='eval')
# This is an Expression, not a Module!

# CORRECT: Verify node type
tree = ast.parse(code)
assert isinstance(tree, ast.Module), "Expected Module"
# Or check what you actually get
if isinstance(tree, ast.Expression):
    expr_value = tree.body
```

### Comparing Nodes with ==

```python
# WRONG: Uses object equality (always False for different instances)
node1 = ast.Name(id='x', ctx=ast.Load())
node2 = ast.Name(id='x', ctx=ast.Load())
if node1 == node2:  # False! Different objects
    print("Equal")

# CORRECT: Compare dumps or implement custom equality
dump1 = ast.dump(node1)
dump2 = ast.dump(node2)
if dump1 == dump2:
    print("Equal")
```

### Mutating While Iterating

```python
# WRONG: Modifying tree while traversing
for node in ast.walk(tree):
    if isinstance(node, ast.Name) and node.id == 'x':
        # Don't modify here - invalidates iteration

# CORRECT: Use NodeTransformer
class Renamer(ast.NodeTransformer):
    def visit_Name(self, node):
        if node.id == 'x':
            node.id = 'y'
        return node
```

## Performance Considerations

### Parsing Large Files

```python
import ast
import time

# Parsing is relatively fast, but grows with file size
large_code = "x = 1\n" * 100000

start = time.time()
tree = ast.parse(large_code)
elapsed = time.time() - start

print(f"Parsed {len(large_code)} bytes in {elapsed:.3f}s")
# Modern systems can parse ~100MB/sec of Python code
```

### Walking vs Visitor Pattern

```python
# ast.walk() is fast for simple traversals
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        # Process function definitions

# NodeVisitor has slight overhead but better for complex logic
class Visitor(ast.NodeVisitor):
    def visit_FunctionDef(self, node):
        # Process function definitions
        self.generic_visit(node)

# For simple cases, ast.walk() is marginally faster
# For complex traversals with state, NodeVisitor is cleaner
```

### Memoization for Complex Analysis

```python
import functools

class AnalysisVisitor(ast.NodeVisitor):
    @functools.lru_cache(maxsize=1024)
    def get_node_depth(self, node_id):
        # Cache expensive computations
        pass

    def visit_Name(self, node):
        depth = self.get_node_depth(id(node))
        # Use cached value
```

### Memory Usage with Large ASTs

```python
import sys

tree = ast.parse(large_code)
print(f"AST size: {sys.getsizeof(tree)} bytes")

# The AST maintains references to all nodes - O(n) memory
# For very large files, consider processing in chunks
```

### Compilation vs Interpretation

```python
# Parsing -> AST -> Compilation (one-time cost)
tree = ast.parse(code)  # ~1ms for typical code
bytecode = compile(tree, '<ast>', 'exec')  # ~0.1ms

# Execution is fast
exec(bytecode)  # Very fast, many times

# Cache if executing multiple times
for _ in range(1000):
    exec(bytecode)  # Fast because compiled
```

## Real-world Scenarios

### Scenario 1: Building a Linter

```python
import ast

class SimpleLinter(ast.NodeVisitor):
    def __init__(self):
        self.issues = []

    def visit_FunctionDef(self, node):
        # Check function naming convention
        if not node.name.islower():
            self.issues.append({
                'line': node.lineno,
                'message': f'Function "{node.name}" should be lowercase'
            })

        # Check function length
        if len(node.body) > 20:
            self.issues.append({
                'line': node.lineno,
                'message': f'Function "{node.name}" is too long'
            })

        self.generic_visit(node)

    def visit_Assign(self, node):
        # Check variable naming
        for target in node.targets:
            if isinstance(target, ast.Name):
                if target.id.isupper():
                    self.issues.append({
                        'line': node.lineno,
                        'message': f'Variable "{target.id}" should not be UPPERCASE'
                    })

        self.generic_visit(node)

code = """
def MyFunction():  # Bad name
    X = 10  # Bad name
    return X * 2
"""

linter = SimpleLinter()
linter.visit(ast.parse(code))

for issue in linter.issues:
    print(f"Line {issue['line']}: {issue['message']}")
```

### Scenario 2: Extracting Test Information

```python
import ast

class TestExtractor(ast.NodeVisitor):
    def __init__(self):
        self.tests = []

    def visit_FunctionDef(self, node):
        # Find test functions
        if node.name.startswith('test_'):
            test_info = {
                'name': node.name,
                'lineno': node.lineno,
                'has_assertions': False,
                'decorators': []
            }

            # Check for decorators
            for dec in node.decorator_list:
                if isinstance(dec, ast.Name):
                    test_info['decorators'].append(dec.id)
                elif isinstance(dec, ast.Call):
                    if isinstance(dec.func, ast.Name):
                        test_info['decorators'].append(dec.func.id)

            # Check for assertions in body
            for item in ast.walk(node):
                if isinstance(item, ast.Assert):
                    test_info['has_assertions'] = True
                    break

            self.tests.append(test_info)

        self.generic_visit(node)

test_code = """
def test_addition():
    assert 1 + 1 == 2

@pytest.mark.skip
def test_future():
    pass

def not_a_test():
    pass
"""

extractor = TestExtractor()
extractor.visit(ast.parse(test_code))

for test in extractor.tests:
    print(f"Test: {test['name']} (line {test['lineno']})")
    print(f"  Decorators: {test['decorators']}")
    print(f"  Has assertions: {test['has_assertions']}")
```

### Scenario 3: Code Metrics Collection

```python
import ast
from collections import defaultdict

class CodeMetrics(ast.NodeVisitor):
    def __init__(self):
        self.metrics = {
            'functions': 0,
            'classes': 0,
            'imports': 0,
            'lines_of_code': 0,
            'max_nesting_depth': 0,
            'current_depth': 0,
        }

    def visit_FunctionDef(self, node):
        self.metrics['functions'] += 1
        self.current_depth += 1
        self.metrics['max_nesting_depth'] = max(
            self.metrics['max_nesting_depth'],
            self.current_depth
        )
        self.generic_visit(node)
        self.current_depth -= 1

    def visit_AsyncFunctionDef(self, node):
        self.visit_FunctionDef(node)

    def visit_ClassDef(self, node):
        self.metrics['classes'] += 1
        self.current_depth += 1
        self.metrics['max_nesting_depth'] = max(
            self.metrics['max_nesting_depth'],
            self.current_depth
        )
        self.generic_visit(node)
        self.current_depth -= 1

    def visit_Import(self, node):
        self.metrics['imports'] += len(node.names)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        self.metrics['imports'] += len(node.names)
        self.generic_visit(node)

    def visit_Module(self, node):
        # Count lines with actual code
        if hasattr(node, 'end_lineno') and node.end_lineno:
            self.metrics['lines_of_code'] = node.end_lineno
        self.generic_visit(node)

code = """
import os
from typing import List

class DataProcessor:
    def process(self, data: List[str]):
        for item in data:
            if item.strip():
                self.handle_item(item)

    def handle_item(self, item: str):
        pass
"""

metrics = CodeMetrics()
metrics.visit(ast.parse(code))

for key, value in metrics.metrics.items():
    print(f"{key}: {value}")
```

## Interview Points

### Q1: What is an Abstract Syntax Tree and why is it useful?

**Answer**: An AST is a tree representation of the syntactic structure of source code. Unlike a parse tree that represents concrete syntax with all tokens, an AST abstracts away syntactic noise and retains only semantic information.

**Usefulness**:
- **Compilation**: Compilers use ASTs for semantic analysis and code generation
- **Static Analysis**: Tools analyze ASTs to detect bugs, style issues, or security vulnerabilities
- **Code Transformation**: Refactoring, optimization, and code generation tools operate on ASTs
- **Language Tools**: IDEs, formatters, and linters all work with ASTs

### Q2: Explain the difference between ast.NodeVisitor and ast.NodeTransformer

**Answer**:
- **NodeVisitor**: Read-only traversal. Override `visit_*` methods to process nodes. Called with `visit(node)`. Returns value from `visit_*` methods (typically None for traversal).
- **NodeTransformer**: Enables tree modification. Override `visit_*` methods and return new nodes or modified nodes. Must call `ast.fix_missing_locations()` after transformation.

**Key Difference**: NodeVisitor is for analysis, NodeTransformer is for transformation.

### Q3: What does ast.fix_missing_locations() do and why is it necessary?

**Answer**: When creating AST nodes programmatically, you typically don't set lineno and col_offset attributes. The `fix_missing_locations()` function fills in these attributes based on parent nodes. This is necessary because:
- Compilation requires these attributes for error reporting
- Debugging and introspection rely on accurate line numbers
- Some AST operations check location consistency

### Q4: How would you detect unused variables in code?

**Answer**:
1. Walk the AST and find all Name nodes
2. Categorize by context: Store (assignment) vs Load (usage)
3. Calculate assigned variables minus used variables
4. Account for scope (variables in different functions are independent)
5. Handle parameters (implicitly "used")

### Q5: What are the limitations of AST analysis?

**Answer**:
- **Type Information**: AST doesn't include type information (except annotations)
- **Control Flow**: Difficult to determine which code paths execute
- **Runtime Behavior**: Can't know if a name is local or global without full scope analysis
- **Dynamic Features**: Hard to analyze code with dynamic imports or exec
- **Comments**: Removed during parsing (Python 3.8+ has some support)

### Q6: How does Python's parsing differ from AST generation?

**Answer**: Python has two related but distinct processes:
1. **Parsing**: Tokenization + syntax analysis -> parse tree
2. **AST Generation**: Simplification of parse tree -> abstract representation
3. **Compilation**: Semantic analysis of AST -> bytecode

The `ast` module exposes the AST, not the parse tree. The parse tree includes syntax details (parentheses, semicolons) that don't affect semantics.

### Q7: Can you modify Python code by manipulating its AST?

**Answer**: Yes! Use `ast.NodeTransformer` to modify nodes, then:
1. Call `ast.fix_missing_locations()` to update line/column info
2. Use `compile()` to create bytecode from modified AST
3. Use `exec()` or `eval()` to execute the bytecode

**Limitations**: The modified code is executed but may not be printed back to valid Python syntax without additional tools (use `astor` or similar).

## Further Reading

### Official Documentation
- [Python ast module documentation](https://docs.python.org/3/library/ast.html)
- [PEP 3108 - Standard Library Reorganization](https://www.python.org/dev/peps/pep-3108/)
- [ast module reference](https://docs.python.org/3/library/ast.html#ast.NodeVisitor)

### Related Libraries
- **astor**: Convert AST back to Python source code
- **astroid**: Enhanced AST for static analysis (used by Pylint)
- **ast-monitor**: Monitor AST operations for debugging
- **redbaron**: AST manipulation with full source preservation

### Learning Resources
- [Understanding Python's AST](https://docs.python.org/3/reference/compound_statements.html)
- [Compiler Design Course Materials](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
- [Building a Python Linter Tutorial](https://github.com/topics/python-linter)

### Advanced Topics
- [Implementing Code Analysis Tools](https://www.python.org/dev/peps/pep-0465/)
- [AST Optimization Techniques](https://www.python.org/dev/peps/pep-0465/)
- [Source Code Instrumentation with AST](https://github.com/tonybaloney/Kernprof)

### Classic References
- "Engineering a Compiler" - Cooper & Torczon
- "Compilers: Principles, Techniques, and Tools" - Aho, Lam, Sethi, Ullman (Dragon Book)
- [Python's Internal Code Structure](https://devguide.python.org/internals/interpreter/)

### Tools Built with AST
- **Pylint**: Static code analysis
- **Black**: Code formatter
- **Pytest**: Test framework (collects tests via AST)
- **Bandit**: Security issue finder
- **Py-to-Java**: Code transpiler
- **AutoDocstring**: Documentation generator
