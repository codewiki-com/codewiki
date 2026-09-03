---
title: Python AST 模块：抽象语法树深入指南
description: 深入探讨 Python ast 模块的核心原理、应用场景和最佳实践，包括语法树解析、遍历、转换和代码生成。
track: python
section: stdlib
difficulty: advanced
tags:
  - ast
  - 抽象语法树
  - 代码解析
  - 元编程
  - 编译原理
  - 代码转换
status: imported
origin: old/src/content/docs/python/ast.zh.md
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

## 概念解释

### 什么是抽象语法树（AST）

**抽象语法树**（Abstract Syntax Tree，简称 AST）是源代码结构的树形表示。它以树的形式展现编程语言的句法结构，其中：
- 每个节点代表代码中的一个语法构造（如表达式、语句、函数定义）
- 树的层级反映了代码的语法嵌套关系
- 节点的子节点代表其组成部分

### Python 中的 AST

Python 的 `ast` 模块提供了解析和处理 Python 源代码的工具。它将 Python 代码字符串转换为 AST 对象，允许程序员以编程方式分析、修改和生成 Python 代码。

### 历史背景

- Python 2 开始提供 AST 支持
- Python 3 进一步完善了 AST 模块，使其成为核心功能
- 现代 Python 工具链（如代码格式化器、静态分析工具）都基于 AST

### 解决的问题

1. **静态代码分析**：检查代码错误、风格问题
2. **代码转换**：自动重构、优化、格式化
3. **代码生成**：从一种形式生成另一种
4. **元编程**：在运行时分析和修改代码
5. **工具构建**：实现 linter、formatter、IDE 功能

---

## 核心原理

### 解析过程（Parse Pipeline）

```
Python 源代码
    ↓
词法分析（Tokenization）- 将代码分解为令牌
    ↓
语法分析（Parsing）- 按语法规则构建树
    ↓
AST 生成 - 创建 AST 对象
```

### AST 节点类型

所有 AST 节点都继承自 `ast.AST` 基类。主要分为几类：

**模块级节点**：
- `Module` - 整个模块
- `Interactive` - 交互式代码块
- `Expression` - 单个表达式

**语句节点**：
- `FunctionDef` / `AsyncFunctionDef` - 函数定义
- `ClassDef` - 类定义
- `Return` - 返回语句
- `If` / `While` / `For` - 控制流
- `With` / `AsyncWith` - 上下文管理

**表达式节点**：
- `BinOp` - 二元操作
- `UnaryOp` - 一元操作
- `Call` - 函数调用
- `Attribute` - 属性访问
- `Subscript` - 下标访问

### AST 遍历机制

**深度优先遍历（DFS）**：

```python
# visitor 模式（推荐）
class MyVisitor(ast.NodeVisitor):
    def visit_BinOp(self, node):
        # 处理当前节点
        # 继续遍历子节点
        self.generic_visit(node)

# 或者手动遍历
for child in ast.iter_child_nodes(node):
    process(child)
```

**修改 AST**：

```python
# 创建新节点
class MyTransformer(ast.NodeTransformer):
    def visit_BinOp(self, node):
        # 返回修改后的节点或新节点
        return modified_node
```

### 作用域分析

AST 本身不包含作用域信息，但可以通过遍历来构建：

```python
# 构建符号表
symbols = {}
for node in ast.walk(tree):
    if isinstance(node, ast.Name):
        symbols[node.id] = node.ctx
```

### 源代码恢复

可以从 AST 重新生成代码，但会丢失注释、空白符等信息。推荐使用 `unparse()` 函数（Python 3.9+）。

---

## 核心要点

### 关键概念清单

| 概念 | 说明 | 用途 |
|------|------|------|
| **AST 节点** | 语法树中的基本单元 | 表示代码结构 |
| **NodeVisitor** | 遍历 AST 的访问者模式 | 分析代码 |
| **NodeTransformer** | 修改 AST 的转换器 | 代码转换 |
| **ast.parse()** | 解析源代码为 AST | 获取 AST 树 |
| **ast.unparse()** | 将 AST 转换回源代码 | 代码生成 |
| **ast.dump()** | 将 AST 转换为字符串表示 | 调试和检查 |
| **ast.iter_child_nodes()** | 迭代节点的直接子节点 | 树遍历 |
| **ast.walk()** | 递归遍历所有节点 | 深度优先遍历 |

### 节点属性

每个 AST 节点都有：
- **属性（Attributes）**：存储节点的信息（如操作符类型）
- **子节点列表**：包含子表达式、子语句等
- **行列号信息**：`lineno`、`col_offset`、`end_lineno`、`end_col_offset`

---

## 代码示例

### 示例 1：基本解析和检查

```python
import ast

code = """
def greet(name):
    message = f"Hello, {name}!"
    print(message)
"""

# 解析代码
tree = ast.parse(code)

# 查看 AST 结构
print(ast.dump(tree, indent=2))

# 遍历找到所有函数定义
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        print(f"函数名: {node.name}")
        print(f"参数: {[arg.arg for arg in node.args.args]}")
```

### 示例 2：访问者模式 - 找出所有函数调用

```python
import ast

class CallVisitor(ast.NodeVisitor):
    def __init__(self):
        self.calls = []

    def visit_Call(self, node):
        # 获取函数名
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            func_name = node.func.attr
        else:
            func_name = "unknown"

        self.calls.append({
            'name': func_name,
            'lineno': node.lineno,
            'args_count': len(node.args)
        })

        # 继续访问子节点
        self.generic_visit(node)

code = """
result = sum([1, 2, 3])
print(result)
obj.method(10, 20)
"""

tree = ast.parse(code)
visitor = CallVisitor()
visitor.visit(tree)

for call in visitor.calls:
    print(f"调用: {call['name']}() 在第 {call['lineno']} 行，参数数: {call['args_count']}")
```

输出：
```
调用: sum() 在第 2 行，参数数: 1
调用: print() 在第 3 行，参数数: 1
调用: method() 在第 4 行，参数数: 2
```

### 示例 3：代码转换 - 将所有字符串转为大写

```python
import ast
import sys

class StringUpperTransformer(ast.NodeTransformer):
    def visit_Constant(self, node):
        # 转换字符串常量
        if isinstance(node.value, str):
            node.value = node.value.upper()
        return node

code = """
message = "hello world"
name = "alice"
count = 42
"""

tree = ast.parse(code)
transformer = StringUpperTransformer()
new_tree = transformer.visit(tree)

# 将修改后的 AST 转换回代码
if sys.version_info >= (3, 9):
    new_code = ast.unparse(new_tree)
    print(new_code)
else:
    print("需要 Python 3.9+ 来使用 ast.unparse()")
```

### 示例 4：静态分析 - 检查变量使用

```python
import ast

class VariableAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.defined = set()
        self.used = set()
        self.undefined = set()

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Store):
            # 变量被赋值
            self.defined.add(node.id)
        elif isinstance(node.ctx, ast.Load):
            # 变量被使用
            if node.id not in self.defined:
                self.undefined.add(node.id)
            self.used.add(node.id)
        self.generic_visit(node)

code = """
x = 10
y = x + z
print(x, y)
"""

tree = ast.parse(code)
analyzer = VariableAnalyzer()
analyzer.visit(tree)

print(f"定义的变量: {analyzer.defined}")
print(f"使用的变量: {analyzer.used}")
print(f"未定义但使用的变量: {analyzer.undefined}")
```

### 示例 5：代码生成 - 动态创建函数

```python
import ast

# 使用 AST 创建一个计算 x^2 + 2*x + 1 的函数
function_ast = ast.Module(
    body=[
        ast.FunctionDef(
            name='quadratic',
            args=ast.arguments(
                posonlyargs=[],
                args=[ast.arg(arg='x', annotation=None)],
                kwonlyargs=[],
                kw_defaults=[],
                defaults=[]
            ),
            body=[
                ast.Return(
                    value=ast.BinOp(
                        left=ast.BinOp(
                            left=ast.Name(id='x', ctx=ast.Load()),
                            op=ast.Pow(),
                            right=ast.Constant(value=2)
                        ),
                        op=ast.Add(),
                        right=ast.BinOp(
                            left=ast.Constant(value=2),
                            op=ast.Mult(),
                            right=ast.Name(id='x', ctx=ast.Load())
                        )
                    )
                )
            ],
            decorator_list=[],
            returns=None
        )
    ],
    type_ignores=[]
)

# 修复 AST
ast.fix_missing_locations(function_ast)

# 编译并执行
code = compile(function_ast, filename='<ast>', mode='exec')
namespace = {}
exec(code, namespace)

# 使用生成的函数
quadratic = namespace['quadratic']
print(f"quadratic(3) = {quadratic(3)}")
```

### 示例 6：高级 - 实现简单的代码分析工具

```python
import ast

class CodeMetrics(ast.NodeVisitor):
    """计算代码指标的分析工具"""

    def __init__(self):
        self.functions = {}
        self.current_function = None
        self.classes = set()
        self.imports = []

    def visit_FunctionDef(self, node):
        func_info = {
            'name': node.name,
            'lineno': node.lineno,
            'args': len(node.args.args),
            'docstring': ast.get_docstring(node),
            'statements': 0,
            'calls': 0
        }

        old_function = self.current_function
        self.current_function = node.name
        self.functions[node.name] = func_info

        self.generic_visit(node)
        self.current_function = old_function

    def visit_ClassDef(self, node):
        self.classes.add(node.name)
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_Expr(self, node):
        if self.current_function:
            self.functions[self.current_function]['statements'] += 1
        self.generic_visit(node)

    def visit_Call(self, node):
        if self.current_function:
            self.functions[self.current_function]['calls'] += 1
        self.generic_visit(node)

    def report(self):
        print("=" * 50)
        print("代码分析报告")
        print("=" * 50)

        print(f"\n类定义: {len(self.classes)}")
        if self.classes:
            for cls in self.classes:
                print(f"  - {cls}")

        print(f"\n导入: {len(set(self.imports))}")
        if self.imports:
            for imp in set(self.imports):
                print(f"  - {imp}")

        print(f"\n函数定义: {len(self.functions)}")
        for func_name, info in self.functions.items():
            print(f"  {func_name}:")
            print(f"    - 行号: {info['lineno']}")
            print(f"    - 参数数: {info['args']}")
            print(f"    - 调用数: {info['calls']}")
            if info['docstring']:
                doc_preview = info['docstring'][:50]
                print(f"    - 文档: {doc_preview}...")

code = """
import os

class FileHandler:
    pass

def process_file(filepath):
    with open(filepath) as f:
        content = f.read()
    print(len(content))
    return content

def main():
    process_file('test.txt')
    os.getcwd()
"""

tree = ast.parse(code)
metrics = CodeMetrics()
metrics.visit(tree)
metrics.report()
```

---

## 最佳实践

### 使用访问者模式而不是递归

```python
# 好的做法
class MyVisitor(ast.NodeVisitor):
    def visit_FunctionDef(self, node):
        # 处理逻辑
        self.generic_visit(node)

# 避免手动递归
def bad_traverse(node):
    for child in ast.iter_child_nodes(node):
        bad_traverse(child)
```

### 始终修复 AST 的位置信息

```python
# 生成新的 AST 后，必须修复位置信息
new_tree = generate_ast()
ast.fix_missing_locations(new_tree)

# 或者手动设置
node.lineno = 1
node.col_offset = 0
```

### 处理不同的上下文

```python
def visit_Name(self, node):
    if isinstance(node.ctx, ast.Load):
        # 读操作
        pass
    elif isinstance(node.ctx, ast.Store):
        # 写操作
        pass
    elif isinstance(node.ctx, ast.Del):
        # 删除操作
        pass
```

### 使用 `ast.get_docstring()` 获取文档字符串

```python
# 正确方式
docstring = ast.get_docstring(func_node)

# 避免手动解析
# docstring = func_node.body[0].value
```

### 保存源代码位置信息

```python
class LocationTracker(ast.NodeVisitor):
    def __init__(self, source):
        self.source_lines = source.splitlines()

    def visit(self, node):
        if hasattr(node, 'lineno'):
            idx = node.lineno - 1
            if 0 <= idx < len(self.source_lines):
                node.source_line = self.source_lines[idx]
        self.generic_visit(node)
```

### 使用类型检查避免 AttributeError

```python
# 好的做法
if isinstance(node.func, ast.Name):
    func_name = node.func.id
elif isinstance(node.func, ast.Attribute):
    func_name = node.func.attr
else:
    func_name = None
```

### 缓存 AST 以提高性能

```python
import hashlib
import pickle

class ASTCache:
    def __init__(self, cache_dir='.ast_cache'):
        self.cache_dir = cache_dir

    def get_ast(self, source):
        source_hash = hashlib.md5(source.encode()).hexdigest()
        cache_file = f"{self.cache_dir}/{source_hash}.pkl"

        try:
            with open(cache_file, 'rb') as f:
                return pickle.load(f)
        except FileNotFoundError:
            tree = ast.parse(source)
            with open(cache_file, 'wb') as f:
                pickle.dump(tree, f)
            return tree
```

---

## 常见陷阱

### 混淆 `ast.walk()` 和 `ast.iter_child_nodes()`

```python
# ast.walk() - 递归遍历所有节点
for node in ast.walk(tree):
    # 访问所有节点

# ast.iter_child_nodes() - 仅遍历直接子节点
for child in ast.iter_child_nodes(node):
    # 只访问直接子节点
```

### 修改后忘记调用 `fix_missing_locations()`

```python
# 错误
tree = MyTransformer().visit(tree)
compile(tree, '<ast>', 'exec')

# 正确
tree = MyTransformer().visit(tree)
ast.fix_missing_locations(tree)
compile(tree, '<ast>', 'exec')
```

### 在 NodeVisitor 中修改 AST

```python
# 错误 - NodeVisitor 用于只读遍历
class BadVisitor(ast.NodeVisitor):
    def visit_BinOp(self, node):
        node.op = ast.Sub()

# 正确 - 使用 NodeTransformer
class GoodTransformer(ast.NodeTransformer):
    def visit_BinOp(self, node):
        node.op = ast.Sub()
        return node
```

### 假设 AST 包含所有代码信息

AST 丢失的信息包括：
- 注释
- 空白符和缩进
- 括号和分号的确切位置

### 不处理不同的节点类型

```python
# 错误
def get_operator(node):
    return node.op

# 正确
def get_operator(node):
    if isinstance(node, (ast.BinOp, ast.UnaryOp, ast.BoolOp)):
        return node.op
    return None
```

### Python 版本差异

```python
import sys

# Python 3.8+ 用 Constant，之前用 Num, Str 等
if sys.version_info >= (3, 8):
    # 使用 ast.Constant
    pass
else:
    # 处理 ast.Num, ast.Str 等
    pass
```

---

## 性能考量

### 解析性能

```python
import ast
import time

code = "x = " + " + ".join(["1"] * 1000)

start = time.time()
tree = ast.parse(code)
elapsed = time.time() - start
print(f"解析耗时: {elapsed:.4f}s")
```

### 内存使用

AST 对于大型代码库可能占用大量内存。考虑流式处理或增量解析。

### 遍历性能优化

```python
# 高效 - 单次遍历
functions = []
classes = []
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        functions.append(node)
    elif isinstance(node, ast.ClassDef):
        classes.append(node)
```

### 避免频繁的 isinstance 检查

```python
# 高效 - 字典分发
handlers = {
    ast.FunctionDef: handle_function,
    ast.ClassDef: handle_class,
    ast.Return: handle_return,
}

for node in ast.walk(tree):
    handler = handlers.get(type(node))
    if handler:
        handler(node)
```

---

## 实战场景

### 场景 1：实现 Python Linter

```python
import ast

class SimpleLinter(ast.NodeVisitor):
    """简单的 Python linter"""

    def __init__(self):
        self.issues = []

    def visit_FunctionDef(self, node):
        # 检查函数名是否为小蛇形
        if not self._is_snake_case(node.name):
            self.issues.append((
                node.lineno,
                f"函数名 '{node.name}' 应该用小蛇形命名"
            ))

        self.generic_visit(node)

    def visit_ClassDef(self, node):
        # 检查类名是否为大驼峰式
        if not self._is_pascal_case(node.name):
            self.issues.append((
                node.lineno,
                f"类名 '{node.name}' 应该用大驼峰式命名"
            ))

        self.generic_visit(node)

    @staticmethod
    def _is_snake_case(name):
        return name.islower()

    @staticmethod
    def _is_pascal_case(name):
        return name[0].isupper() and '_' not in name

code = """
def BadFunctionName():
    x = 1

class bad_class:
    pass
"""

tree = ast.parse(code)
linter = SimpleLinter()
linter.visit(tree)

for lineno, msg in sorted(linter.issues):
    print(f"Line {lineno}: {msg}")
```

### 场景 2：代码复杂度分析

```python
import ast

class ComplexityAnalyzer(ast.NodeVisitor):
    """计算圈复杂度"""

    def __init__(self):
        self.complexity = 0

    def visit_If(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_For(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_While(self, node):
        self.complexity += 1
        self.generic_visit(node)

code = """
def complex_function(x, y):
    if x > 0:
        if y > 0:
            return x + y
        else:
            return x - y
    else:
        return 0
"""

tree = ast.parse(code)
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        analyzer = ComplexityAnalyzer()
        analyzer.visit(node)
        print(f"{node.name} 圈复杂度: {analyzer.complexity + 1}")
```

### 场景 3：自动代码重构

```python
import ast

class PrintToLogTransformer(ast.NodeTransformer):
    """将 print() 调用转换为 logging"""

    def visit_Call(self, node):
        self.generic_visit(node)

        if isinstance(node.func, ast.Name) and node.func.id == 'print':
            return ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='logging', ctx=ast.Load()),
                    attr='info',
                    ctx=ast.Load()
                ),
                args=node.args,
                keywords=node.keywords
            )

        return node
```

---

## 面试要点

### AST 的基本概念

**问：什么是抽象语法树？**

答：抽象语法树是源代码的树形表示，其中每个节点代表代码中的一个语法构造。它抽象了具体的语法细节（如括号、分号），只保留语义信息。

**问：AST 和 Parse Tree 的区别？**

答：
- Parse Tree：一一对应源代码的语法，包含所有符号
- AST：简化版，去除冗余信息，更容易分析

### 实现细节

**问：如何遍历 AST？**

答：主要有三种方法：
1. `ast.walk()` - 递归遍历所有节点
2. `ast.iter_child_nodes()` - 遍历直接子节点
3. `NodeVisitor` - 访问者模式，推荐用于分析

**问：NodeVisitor 和 NodeTransformer 的区别？**

答：
- `NodeVisitor`：只读遍历，不修改 AST
- `NodeTransformer`：可以修改或替换节点

### 应用场景

**问：列举 AST 的应用场景**

答：
- 静态代码分析（linter、type checker）
- 代码格式化（formatter）
- 代码转换和重构
- 代码生成
- IDE 功能（自动补全、重命名）

### 常见问题

**问：为什么修改 AST 后要调用 `fix_missing_locations()`？**

答：编译器需要准确的行号和列号信息来报告错误。新创建的节点没有这些信息，会导致编译时崩溃。

**问：如何处理 AST 中的上下文（Load/Store/Del）？**

答：`ast.Name` 节点的 `ctx` 属性表示变量的上下文：
- `Load`：读取变量
- `Store`：赋值给变量
- `Del`：删除变量

---

## 延伸阅读

### 官方文档
- Python ast 官方文档
- Python 编译原理文档

### 相关库
- **astor** - 高级 AST 转换
- **astroid** - Pylint 使用的 AST 库
- **libcst** - Concrete Syntax Tree

### 相关工具
- **Black** - Python 代码格式化工具
- **Pylint** - 代码检查工具
- **mypy** - 静态类型检查器
- **isort** - import 排序工具

### 推荐学习资源
1. 编译原理基础 - 理解 AST 的理论基础
2. 开源项目 - 参考 Black、Pylint 的实现
3. 官方源码 - Python 的 AST 模块实现

---

## 总结

Python 的 `ast` 模块是强大的代码分析和转换工具。通过理解 AST 的结构和遍历方式，我们可以：

1. **分析代码** - 找出潜在问题、计算指标
2. **转换代码** - 自动重构、优化、格式化
3. **生成代码** - 从 AST 创建新代码
4. **实现工具** - 构建 linter、formatter、IDE 功能

关键在于选择合适的遍历方式（visitor 模式）和正确处理 AST 细节（位置信息、节点类型）。随着实践增加，AST 会成为你实现复杂代码工具的强大武器。
