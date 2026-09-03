---
title: AI 编程 CLI 工具
description: 掌握AI辅助编程命令行工具：Claude Code、aider、GitHub Copilot CLI等
track: ai-era
section: tooling
difficulty: intermediate
tags:
  - CLI
  - Claude Code
  - aider
  - AI编程
  - 终端工具
status: imported
origin: old/src/content/docs/ai/ai-coding-cli.zh.md
divergence: 0.215
issues: []
legacy:
  category: AI
  subcategory: AI Coding
  order: 26
  lastUpdated: 2026-01-07
---

## 概述

AI 编程 CLI（Command Line Interface）工具是在终端环境中运行的 AI 编程助手。相比 GUI 界面的 AI IDE，CLI 工具具有轻量、灵活、可脚本化的特点，特别适合以下场景：

- 远程服务器开发和运维
- 自动化工作流和 CI/CD 集成
- 偏好键盘操作的开发者
- 资源受限环境
- 与现有终端工具链集成

### 主流 AI 编程 CLI 工具对比

| 工具 | 开发者 | 特点 | 模型支持 | 开源 |
|------|--------|------|----------|------|
| **Claude Code** | Anthropic | 官方CLI，深度系统集成 | Claude | 否 |
| **aider** | Paul Gauthier | Git集成，多模型 | 多模型 | 是 |
| **GitHub Copilot CLI** | GitHub | Shell命令辅助 | GPT-4 | 否 |
| **Mentat** | AbanteAI | 代码库理解 | 多模型 | 是 |
| **gpt-engineer** | AntonOsika | 项目生成 | GPT-4 | 是 |
| **Continue CLI** | Continue.dev | 轻量级 | 多模型 | 是 |

---

## Claude Code

Claude Code 是 Anthropic 官方推出的 AI 编程 CLI 工具，提供了与 Claude 模型的深度集成。

### 安装

```bash
# 使用 npm 安装
npm install -g @anthropic-ai/claude-code

# 验证安装
claude --version
```

### 基本使用

```bash
# 启动交互式会话
claude

# 在当前目录启动
cd my-project
claude

# 直接执行任务
claude "创建一个 Express.js 服务器，包含用户认证功能"

# 继续上次会话
claude --continue
```

### 核心功能

#### 代码编辑

```bash
# Claude Code 会话中

> 帮我重构 src/utils/helpers.js，将函数拆分为独立模块

Claude: 我来分析这个文件并进行重构...

[分析文件结构]
[创建新的模块文件]
[更新导入语句]
[运行测试确认]

完成！我已经：
1. 创建了 src/utils/string-helpers.js
2. 创建了 src/utils/date-helpers.js
3. 创建了 src/utils/array-helpers.js
4. 更新了所有导入这些函数的文件
```

#### 命令执行

```bash
> 运行项目的测试套件并修复失败的测试

Claude: 让我先运行测试看看结果...

$ npm test

[显示测试结果]

发现 3 个失败的测试：
1. UserService.test.js - 'should validate email format'
2. AuthController.test.js - 'should reject expired tokens'
3. Database.test.js - 'should handle connection timeout'

让我逐个修复...
```

#### MCP 服务器集成

Claude Code 支持 Model Context Protocol (MCP) 服务器，扩展其能力：

```json
// ~/.claude/claude_desktop_config.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-filesystem", "/path/to/allowed/dir"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db"
      }
    }
  }
}
```

#### 项目规则配置

```markdown
# CLAUDE.md - 项目规则文件

## 项目概述
这是一个 Next.js 14 电商平台项目。

## 技术栈
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- Stripe 支付

## 代码规范
- 使用函数式组件和 Hooks
- 遵循 Airbnb ESLint 规则
- 组件使用 PascalCase，工具函数使用 camelCase
- 所有 API 响应必须包含错误处理

## 目录结构
```
src/
├── app/           # Next.js App Router 页面
├── components/    # React 组件
├── lib/           # 工具函数和配置
├── prisma/        # 数据库模型
└── types/         # TypeScript 类型定义
```

## 测试要求
- 所有新功能必须有单元测试
- 使用 Jest 和 React Testing Library
- 覆盖率目标 > 80%
```

### Claude Code 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+C` | 中断当前操作 |
| `Ctrl+D` | 退出会话 |
| `Esc` | 取消当前输入 |
| `↑/↓` | 浏览历史命令 |

### 高级用法

```bash
# 使用特定模型
claude --model claude-3-5-sonnet-20241022

# 设置最大 token
claude --max-tokens 8192

# 调试模式
claude --verbose

# 仅打印模式（不执行）
claude --dry-run "删除所有 console.log 语句"

# 使用系统提示
claude --system-prompt "你是一个专注于安全的代码审查专家"
```

---

## aider

aider 是一个流行的开源 AI 编程助手，特点是与 Git 的深度集成。

### 安装

```bash
# 使用 pip 安装
pip install aider-chat

# 或使用 pipx（推荐）
pipx install aider-chat

# 验证安装
aider --version
```

### 配置

```bash
# 设置 API 密钥
export OPENAI_API_KEY=your-openai-key
export ANTHROPIC_API_KEY=your-anthropic-key

# 或使用配置文件
# ~/.aider.conf.yml
```

```yaml
# ~/.aider.conf.yml
model: claude-3-5-sonnet-20241022
auto-commits: true
dark-mode: true
pretty: true
stream: true

# Git 配置
attribute-author: true
attribute-committer: true
commit-prompt: |
  Generate a conventional commit message for these changes.
  Format: <type>(<scope>): <description>
```

### 基本使用

```bash
# 在项目目录启动
cd my-project
aider

# 指定要编辑的文件
aider src/main.py src/utils.py

# 使用特定模型
aider --model claude-3-5-sonnet-20241022
aider --model gpt-4o
aider --model ollama/codellama

# 只读模式（仅问答，不修改文件）
aider --no-auto-commits
```

### 核心功能

#### 文件管理

```bash
# aider 会话中

# 添加文件到上下文
/add src/components/Button.tsx
/add src/styles/button.css

# 移除文件
/drop src/styles/button.css

# 查看当前文件
/files

# 添加只读文件（参考用）
/read-only src/types/index.ts
```

#### Git 集成

```bash
# aider 自动创建有意义的提交
> 添加暗色模式支持到 Button 组件

# aider 完成后自动提交：
# feat(button): add dark mode support
#
# - Add darkMode prop to Button component
# - Implement dark theme styles
# - Update Button tests

# 撤销上次更改
/undo

# 查看更改差异
/diff
```

#### 代码修改

```bash
> 将这个类重构为函数式组件，使用 React Hooks

aider: 我来帮你重构这个组件...

```diff
- class UserProfile extends React.Component {
-   constructor(props) {
-     super(props);
-     this.state = { user: null, loading: true };
-   }
-
-   componentDidMount() {
-     this.fetchUser();
-   }
-
-   fetchUser = async () => {
-     const user = await api.getUser(this.props.userId);
-     this.setState({ user, loading: false });
-   }
-
-   render() {
-     if (this.state.loading) return <Spinner />;
-     return <div>{this.state.user.name}</div>;
-   }
- }

+ function UserProfile({ userId }) {
+   const [user, setUser] = useState(null);
+   const [loading, setLoading] = useState(true);
+
+   useEffect(() => {
+     async function fetchUser() {
+       const userData = await api.getUser(userId);
+       setUser(userData);
+       setLoading(false);
+     }
+     fetchUser();
+   }, [userId]);
+
+   if (loading) return <Spinner />;
+   return <div>{user.name}</div>;
+ }
```

#### 多模型支持

```bash
# 使用 OpenAI
aider --model gpt-4o

# 使用 Anthropic Claude
aider --model claude-3-5-sonnet-20241022

# 使用本地 Ollama
aider --model ollama/deepseek-coder:33b

# 使用 OpenRouter（访问多种模型）
export OPENROUTER_API_KEY=your-key
aider --model openrouter/anthropic/claude-3.5-sonnet

# 使用 Azure OpenAI
aider --model azure/gpt-4o
```

### aider 命令参考

| 命令 | 说明 |
|------|------|
| `/add <file>` | 添加文件到编辑上下文 |
| `/drop <file>` | 从上下文移除文件 |
| `/files` | 列出当前上下文中的文件 |
| `/undo` | 撤销上次 Git 提交 |
| `/diff` | 显示上次更改的差异 |
| `/run <cmd>` | 运行 shell 命令 |
| `/test` | 运行测试 |
| `/lint` | 运行 linter |
| `/clear` | 清除对话历史 |
| `/help` | 显示帮助信息 |
| `/quit` | 退出 aider |

---

## GitHub Copilot CLI

GitHub Copilot CLI 专注于帮助用户编写和理解 shell 命令。

### 安装

```bash
# 安装 GitHub CLI
brew install gh

# 安装 Copilot 扩展
gh extension install github/gh-copilot

# 认证
gh auth login
```

### 基本使用

```bash
# 解释命令
gh copilot explain "find . -name '*.js' -exec grep -l 'TODO' {} \;"

# 输出：
# 这个命令做了以下事情：
# 在当前目录递归查找所有 .js 文件
# 对每个找到的文件执行 grep 命令
# grep -l 只输出包含 'TODO' 的文件名

# 建议命令
gh copilot suggest "查找过去24小时修改的大于100MB的文件"

# 输出：
# 建议的命令：
# find . -mtime -1 -size +100M

# 确认执行？ [Y/n/e(edit)]
```

### 命令模式

```bash
# 通用 shell 命令
gh copilot suggest -t shell "压缩 logs 目录并删除30天前的日志"

# Git 命令
gh copilot suggest -t git "撤销最近3次提交但保留更改"

# GitHub CLI 命令
gh copilot suggest -t gh "创建一个草稿 PR 并添加审查者"
```

### 别名配置

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加

# 快捷别名
alias '??'='gh copilot suggest -t shell'
alias 'git?'='gh copilot suggest -t git'
alias 'gh?'='gh copilot suggest -t gh'
alias 'explain'='gh copilot explain'

# 使用示例
?? "批量重命名文件，将空格替换为下划线"
git? "查看某个文件的完整修改历史"
explain "tar -czvf archive.tar.gz --exclude='node_modules' ."
```

---

## Mentat

Mentat 是一个专注于代码库理解和协调编辑的 AI 编程助手。

### 安装

```bash
pip install mentat
```

### 基本使用

```bash
# 启动 Mentat
cd my-project
mentat

# 指定文件
mentat src/api/ src/models/

# 使用特定模型
mentat --model gpt-4o
```

### 核心功能

```bash
# Mentat 会话中

> 分析这个代码库的架构，给出改进建议

Mentat: 让我分析项目结构...

项目架构分析：
================

目录结构：
├── src/
│   ├── api/          # REST API 端点
│   ├── models/       # 数据模型
│   ├── services/     # 业务逻辑
│   └── utils/        # 工具函数

发现的问题：
1. services/ 中存在循环依赖
2. 部分 API 端点缺少输入验证
3. 数据库查询没有使用连接池

建议改进：
1. 引入依赖注入解决循环依赖
2. 添加 zod 或 joi 进行请求验证
3. 配置数据库连接池

需要我帮你实现这些改进吗？
```

---

## gpt-engineer

gpt-engineer 专注于从自然语言描述生成完整项目。

### 安装

```bash
pip install gpt-engineer
```

### 基本使用

```bash
# 创建项目目录
mkdir my-new-project
cd my-new-project

# 创建提示文件
cat > prompt << EOF
创建一个 Python Flask API，具有以下功能：
- 用户注册和登录（JWT认证）
- CRUD 操作管理待办事项
- SQLite 数据库
- 完整的 API 文档（Swagger）
- Docker 支持
- 单元测试
EOF

# 运行 gpt-engineer
gpt-engineer .

# 改进现有项目
gpt-engineer . --improve
```

### 工作流程

```
1. 读取 prompt 文件
       ↓
2. 分析需求，生成技术方案
       ↓
3. 用户确认方案（可修改）
       ↓
4. 生成完整项目代码
       ↓
5. 运行测试验证
       ↓
6. 项目就绪
```

---

## 最佳实践

### 选择合适的工具

```
┌─────────────────────────────────────────────────────────────────┐
│                      工具选择决策树                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  需要什么功能？                                                   │
│       │                                                         │
│       ├── 完整代码编辑 ─────────────┐                            │
│       │                           │                            │
│       │   需要 Git 集成？          │                            │
│       │   ├── 是 → aider          │                            │
│       │   └── 否 → Claude Code     │                            │
│       │                                                         │
│       ├── Shell 命令辅助 → GitHub Copilot CLI                    │
│       │                                                         │
│       ├── 项目生成 → gpt-engineer                                │
│       │                                                         │
│       └── 代码库分析 → Mentat                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 安全考虑

```bash
# 审查命令再执行
# 大多数 CLI 工具会在执行命令前请求确认

# Claude Code 示例
> 删除 node_modules 并重新安装

Claude: 我将执行以下命令：
$ rm -rf node_modules
$ npm install

确认执行？ [y/N]

# 设置安全边界
# ~/.aider.conf.yml
safe-commands:
  - npm test
  - npm run lint
  - pytest

dangerous-commands:
  - rm -rf
  - DROP TABLE
  - git push --force
```

### 工作流集成

```bash
# Git pre-commit hook 集成
# .git/hooks/pre-commit
#!/bin/bash

# 使用 aider 进行代码审查
echo "Running AI code review..."
aider --model gpt-4o --no-auto-commits --message "Review these changes for bugs and security issues" $(git diff --cached --name-only)

# CI/CD 集成示例
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: AI Review
        run: |
          pip install aider-chat
          aider --model gpt-4o \
                --no-auto-commits \
                --message "Review this PR for issues" \
                $(git diff --name-only origin/main)
```

### 效率技巧

```bash
# 使用会话历史
claude --continue  # 继续上次会话

# 批量处理
aider src/**/*.py --message "为所有函数添加类型注解"

# 管道操作
cat error.log | claude "分析这个错误日志并给出修复建议"

# 自动化脚本
#!/bin/bash
# auto-fix.sh - 自动修复 lint 错误

npm run lint 2>&1 | claude "根据这些 lint 错误修复代码"
```

---

## 常见问题

### Q1: CLI 工具 vs GUI IDE，如何选择？

| 场景 | 推荐 |
|------|------|
| 远程服务器开发 | CLI |
| 需要可视化差异 | GUI |
| 自动化脚本 | CLI |
| 复杂多文件重构 | GUI |
| 快速小修改 | CLI |
| 新手学习 | GUI |

### Q2: 如何降低 API 成本？

```bash
# 使用较小的模型
aider --model gpt-4o-mini

# 使用本地模型
aider --model ollama/codellama:13b

# 限制上下文
aider src/specific-file.py  # 只添加必要文件

# 使用缓存
export AIDER_CACHE_DIR=~/.aider/cache
```

### Q3: 如何处理敏感代码？

```bash
# 使用本地模型
aider --model ollama/deepseek-coder

# 配置忽略文件
# .aiderignore
.env
secrets/
*.pem
config/production.yml

# 审计模式
claude --dry-run "检查安全漏洞"
```

---

## 总结

AI 编程 CLI 工具为开发者提供了强大的终端 AI 编程能力：

| 工具 | 最佳场景 |
|------|----------|
| **Claude Code** | 全功能 AI 编程，官方支持 |
| **aider** | Git 工作流，开源可定制 |
| **GitHub Copilot CLI** | Shell 命令辅助 |
| **Mentat** | 代码库理解和分析 |
| **gpt-engineer** | 从零开始生成项目 |

选择工具时考虑：
- 团队工作流和现有工具链
- 模型偏好和 API 成本
- 开源 vs 商业需求
- 本地部署需求
- Git 集成需求

随着 AI 技术发展，这些工具将变得更加智能和自主，成为开发者工具箱中不可或缺的一部分。
