---
title: AI Coding CLI Tools
description: "Master AI-powered programming CLI tools: Claude Code, aider, GitHub Copilot CLI and more"
track: ai-era
section: tooling
difficulty: intermediate
tags:
  - CLI
  - Claude Code
  - aider
  - AI Programming
  - Terminal Tools
status: imported
origin: old/src/content/docs/ai/ai-coding-cli.en.md
divergence: 0.215
issues: []
legacy:
  category: AI
  subcategory: AI Coding
  order: 26
  lastUpdated: 2026-01-07
---

## Overview

AI Coding CLI (Command Line Interface) tools are AI programming assistants that run in terminal environments. Compared to GUI-based AI IDEs, CLI tools are lightweight, flexible, and scriptable, making them particularly suitable for:

- Remote server development and operations
- Automation workflows and CI/CD integration
- Developers who prefer keyboard-centric workflows
- Resource-constrained environments
- Integration with existing terminal toolchains

### Major AI Coding CLI Tools Comparison

| Tool | Developer | Features | Model Support | Open Source |
|------|-----------|----------|---------------|-------------|
| **Claude Code** | Anthropic | Official CLI, deep system integration | Claude | No |
| **aider** | Paul Gauthier | Git integration, multi-model | Multi-model | Yes |
| **GitHub Copilot CLI** | GitHub | Shell command assistance | GPT-4 | No |
| **Mentat** | AbanteAI | Codebase understanding | Multi-model | Yes |
| **gpt-engineer** | AntonOsika | Project generation | GPT-4 | Yes |
| **Continue CLI** | Continue.dev | Lightweight | Multi-model | Yes |

---

## Claude Code

Claude Code is Anthropic's official AI programming CLI tool, providing deep integration with Claude models.

### Installation

```bash
# Install using npm
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

### Basic Usage

```bash
# Start interactive session
claude

# Start in current directory
cd my-project
claude

# Execute task directly
claude "Create an Express.js server with user authentication"

# Continue previous session
claude --continue
```

### Core Features

#### Code Editing

```bash
# In Claude Code session

> Help me refactor src/utils/helpers.js, split functions into separate modules

Claude: I'll analyze this file and refactor it...

[Analyzing file structure]
[Creating new module files]
[Updating import statements]
[Running tests to confirm]

Done! I've:
1. Created src/utils/string-helpers.js
2. Created src/utils/date-helpers.js
3. Created src/utils/array-helpers.js
4. Updated all files that import these functions
```

#### Command Execution

```bash
> Run the project's test suite and fix failing tests

Claude: Let me run the tests first...

$ npm test

[Shows test results]

Found 3 failing tests:
1. UserService.test.js - 'should validate email format'
2. AuthController.test.js - 'should reject expired tokens'
3. Database.test.js - 'should handle connection timeout'

Let me fix them one by one...
```

#### MCP Server Integration

Claude Code supports Model Context Protocol (MCP) servers to extend its capabilities:

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

#### Project Rules Configuration

```markdown
# CLAUDE.md - Project Rules File

## Project Overview
This is a Next.js 14 e-commerce platform project.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- Stripe Payments

## Code Standards
- Use functional components and Hooks
- Follow Airbnb ESLint rules
- Components use PascalCase, utilities use camelCase
- All API responses must include error handling

## Directory Structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/           # Utilities and config
├── prisma/        # Database models
└── types/         # TypeScript type definitions
```

## Testing Requirements
- All new features must have unit tests
- Use Jest and React Testing Library
- Coverage target > 80%
```

### Claude Code Shortcuts

| Shortcut | Function |
|----------|----------|
| `Ctrl+C` | Interrupt current operation |
| `Ctrl+D` | Exit session |
| `Esc` | Cancel current input |
| `↑/↓` | Browse command history |

### Advanced Usage

```bash
# Use specific model
claude --model claude-3-5-sonnet-20241022

# Set max tokens
claude --max-tokens 8192

# Debug mode
claude --verbose

# Dry run mode (don't execute)
claude --dry-run "Remove all console.log statements"

# Use system prompt
claude --system-prompt "You are a security-focused code review expert"
```

---

## aider

aider is a popular open-source AI programming assistant known for its deep Git integration.

### Installation

```bash
# Install using pip
pip install aider-chat

# Or using pipx (recommended)
pipx install aider-chat

# Verify installation
aider --version
```

### Configuration

```bash
# Set API keys
export OPENAI_API_KEY=your-openai-key
export ANTHROPIC_API_KEY=your-anthropic-key

# Or use config file
# ~/.aider.conf.yml
```

```yaml
# ~/.aider.conf.yml
model: claude-3-5-sonnet-20241022
auto-commits: true
dark-mode: true
pretty: true
stream: true

# Git configuration
attribute-author: true
attribute-committer: true
commit-prompt: |
  Generate a conventional commit message for these changes.
  Format: <type>(<scope>): <description>
```

### Basic Usage

```bash
# Start in project directory
cd my-project
aider

# Specify files to edit
aider src/main.py src/utils.py

# Use specific model
aider --model claude-3-5-sonnet-20241022
aider --model gpt-4o
aider --model ollama/codellama

# Read-only mode (Q&A only, no file modifications)
aider --no-auto-commits
```

### Core Features

#### File Management

```bash
# In aider session

# Add file to context
/add src/components/Button.tsx
/add src/styles/button.css

# Remove file
/drop src/styles/button.css

# View current files
/files

# Add read-only file (for reference)
/read-only src/types/index.ts
```

#### Git Integration

```bash
# aider automatically creates meaningful commits
> Add dark mode support to the Button component

# aider auto-commits:
# feat(button): add dark mode support
#
# - Add darkMode prop to Button component
# - Implement dark theme styles
# - Update Button tests

# Undo last change
/undo

# View change diff
/diff
```

#### Code Modification

```bash
> Refactor this class to a functional component using React Hooks

aider: I'll help you refactor this component...

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

#### Multi-model Support

```bash
# Use OpenAI
aider --model gpt-4o

# Use Anthropic Claude
aider --model claude-3-5-sonnet-20241022

# Use local Ollama
aider --model ollama/deepseek-coder:33b

# Use OpenRouter (access various models)
export OPENROUTER_API_KEY=your-key
aider --model openrouter/anthropic/claude-3.5-sonnet

# Use Azure OpenAI
aider --model azure/gpt-4o
```

### aider Command Reference

| Command | Description |
|---------|-------------|
| `/add <file>` | Add file to edit context |
| `/drop <file>` | Remove file from context |
| `/files` | List files in current context |
| `/undo` | Undo last Git commit |
| `/diff` | Show diff of last changes |
| `/run <cmd>` | Run shell command |
| `/test` | Run tests |
| `/lint` | Run linter |
| `/clear` | Clear conversation history |
| `/help` | Show help information |
| `/quit` | Exit aider |

---

## GitHub Copilot CLI

GitHub Copilot CLI focuses on helping users write and understand shell commands.

### Installation

```bash
# Install GitHub CLI
brew install gh

# Install Copilot extension
gh extension install github/gh-copilot

# Authenticate
gh auth login
```

### Basic Usage

```bash
# Explain command
gh copilot explain "find . -name '*.js' -exec grep -l 'TODO' {} \;"

# Output:
# This command does the following:
# Recursively finds all .js files in current directory
# Executes grep on each found file
# grep -l only outputs filenames containing 'TODO'

# Suggest command
gh copilot suggest "find files modified in the last 24 hours larger than 100MB"

# Output:
# Suggested command:
# find . -mtime -1 -size +100M

# Execute? [Y/n/e(edit)]
```

### Command Modes

```bash
# General shell commands
gh copilot suggest -t shell "compress logs directory and delete logs older than 30 days"

# Git commands
gh copilot suggest -t git "undo last 3 commits but keep changes"

# GitHub CLI commands
gh copilot suggest -t gh "create a draft PR and add reviewers"
```

### Alias Configuration

```bash
# Add to ~/.bashrc or ~/.zshrc

# Quick aliases
alias '??'='gh copilot suggest -t shell'
alias 'git?'='gh copilot suggest -t git'
alias 'gh?'='gh copilot suggest -t gh'
alias 'explain'='gh copilot explain'

# Usage examples
?? "batch rename files, replacing spaces with underscores"
git? "view complete modification history of a file"
explain "tar -czvf archive.tar.gz --exclude='node_modules' ."
```

---

## Mentat

Mentat is an AI programming assistant focused on codebase understanding and coordinated editing.

### Installation

```bash
pip install mentat
```

### Basic Usage

```bash
# Start Mentat
cd my-project
mentat

# Specify files
mentat src/api/ src/models/

# Use specific model
mentat --model gpt-4o
```

### Core Features

```bash
# In Mentat session

> Analyze this codebase's architecture and give improvement suggestions

Mentat: Let me analyze the project structure...

Project Architecture Analysis:
==============================

Directory Structure:
├── src/
│   ├── api/          # REST API endpoints
│   ├── models/       # Data models
│   ├── services/     # Business logic
│   └── utils/        # Utility functions

Issues Found:
1. Circular dependencies in services/
2. Some API endpoints lack input validation
3. Database queries don't use connection pooling

Suggested Improvements:
1. Introduce dependency injection to resolve circular deps
2. Add zod or joi for request validation
3. Configure database connection pool

Would you like me to help implement these improvements?
```

---

## gpt-engineer

gpt-engineer focuses on generating complete projects from natural language descriptions.

### Installation

```bash
pip install gpt-engineer
```

### Basic Usage

```bash
# Create project directory
mkdir my-new-project
cd my-new-project

# Create prompt file
cat > prompt << EOF
Create a Python Flask API with the following features:
- User registration and login (JWT authentication)
- CRUD operations for managing todos
- SQLite database
- Complete API documentation (Swagger)
- Docker support
- Unit tests
EOF

# Run gpt-engineer
gpt-engineer .

# Improve existing project
gpt-engineer . --improve
```

### Workflow

```
1. Read prompt file
       ↓
2. Analyze requirements, generate technical plan
       ↓
3. User confirms plan (can modify)
       ↓
4. Generate complete project code
       ↓
5. Run tests to verify
       ↓
6. Project ready
```

---

## Best Practices

### Choosing the Right Tool

```
┌─────────────────────────────────────────────────────────────────┐
│                      Tool Selection Decision Tree                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What do you need?                                              │
│       │                                                         │
│       ├── Full code editing ─────────────┐                      │
│       │                                  │                      │
│       │   Need Git integration?          │                      │
│       │   ├── Yes → aider                │                      │
│       │   └── No → Claude Code           │                      │
│       │                                                         │
│       ├── Shell command assistance → GitHub Copilot CLI         │
│       │                                                         │
│       ├── Project generation → gpt-engineer                     │
│       │                                                         │
│       └── Codebase analysis → Mentat                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Security Considerations

```bash
# Review commands before execution
# Most CLI tools ask for confirmation before executing

# Claude Code example
> Delete node_modules and reinstall

Claude: I will execute the following commands:
$ rm -rf node_modules
$ npm install

Confirm execution? [y/N]

# Set safety boundaries
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

### Workflow Integration

```bash
# Git pre-commit hook integration
# .git/hooks/pre-commit
#!/bin/bash

# Use aider for code review
echo "Running AI code review..."
aider --model gpt-4o --no-auto-commits --message "Review these changes for bugs and security issues" $(git diff --cached --name-only)

# CI/CD integration example
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

### Efficiency Tips

```bash
# Use session history
claude --continue  # Continue previous session

# Batch processing
aider src/**/*.py --message "Add type annotations to all functions"

# Pipeline operations
cat error.log | claude "Analyze this error log and suggest fixes"

# Automation scripts
#!/bin/bash
# auto-fix.sh - Auto-fix lint errors

npm run lint 2>&1 | claude "Fix the code based on these lint errors"
```

---

## FAQ

### Q1: CLI Tools vs GUI IDEs - How to Choose?

| Scenario | Recommendation |
|----------|----------------|
| Remote server development | CLI |
| Need visual diffs | GUI |
| Automation scripts | CLI |
| Complex multi-file refactoring | GUI |
| Quick small fixes | CLI |
| Beginner learning | GUI |

### Q2: How to Reduce API Costs?

```bash
# Use smaller models
aider --model gpt-4o-mini

# Use local models
aider --model ollama/codellama:13b

# Limit context
aider src/specific-file.py  # Only add necessary files

# Use caching
export AIDER_CACHE_DIR=~/.aider/cache
```

### Q3: How to Handle Sensitive Code?

```bash
# Use local models
aider --model ollama/deepseek-coder

# Configure ignore files
# .aiderignore
.env
secrets/
*.pem
config/production.yml

# Audit mode
claude --dry-run "Check for security vulnerabilities"
```

---

## Summary

AI Coding CLI tools provide developers with powerful terminal-based AI programming capabilities:

| Tool | Best For |
|------|----------|
| **Claude Code** | Full-featured AI programming, official support |
| **aider** | Git workflows, open source customizable |
| **GitHub Copilot CLI** | Shell command assistance |
| **Mentat** | Codebase understanding and analysis |
| **gpt-engineer** | Generate projects from scratch |

Consider when choosing tools:
- Team workflow and existing toolchain
- Model preferences and API costs
- Open source vs commercial needs
- Local deployment requirements
- Git integration needs

As AI technology advances, these tools will become more intelligent and autonomous, becoming an indispensable part of the developer's toolbox.
