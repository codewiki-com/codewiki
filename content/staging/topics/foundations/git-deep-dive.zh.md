---
title: Git Complete Guide
description: Master Git version control for effective collaboration
track: foundations
section: git-shell
difficulty: intermediate
tags:
  - Git
  - Version Control
  - Collaboration
  - DevOps
status: imported
origin: old/src/content/docs/devops/git-deep-dive.zh.md
divergence: 0.217
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: Version Control
  order: 5
  lastUpdated: 2026-01-07
---

Git 是世界上最流行的分布式版本控制系统，由 Linus Torvalds 于 2005 年创建，用于管理 Linux 内核开发。本综合指南深入探讨 Git 的内部架构、高级操作、分支策略以及团队协作最佳实践。无论你是在准备面试还是希望深化 Git 专业知识，本文都涵盖了你需要了解的所有内容。

## 理解 Git 内部原理

在掌握 Git 命令之前，了解 Git 底层工作原理至关重要。Git 本质上是一个内容寻址的文件系统，在其之上构建了版本控制系统。

### 对象模型

Git 将所有数据存储为四种类型的对象，每种对象都由 SHA-1 哈希标识：

#### Blob 对象（二进制大对象）

Blob 存储文件内容，不包含文件名等元数据：

```bash
# 创建一个 blob 并获取其哈希值
echo "Hello Git" | git hash-object --stdin
# 输出: 9f4d96d5b00d98959ea9960f069585ce42b1349a

# 查看 blob 内容
git cat-file -p 9f4d96d

# 查看对象类型
git cat-file -t 9f4d96d
# 输出: blob
```

每个唯一的文件内容都会产生唯一的哈希值。如果两个文件内容相同，它们共享同一个 blob。

#### Tree 对象

Tree 代表目录，存储对 blob 和其他 tree 的引用：

```bash
# 查看当前提交的 tree
git cat-file -p HEAD^{tree}

# 输出示例:
# 100644 blob 9f4d96d...  README.md
# 100644 blob a1b2c3d...  package.json
# 040000 tree e5f6789...  src
```

文件模式表示：
- `100644`：普通文件
- `100755`：可执行文件
- `040000`：目录（tree）
- `120000`：符号链接

#### Commit 对象

Commit 将所有内容与元数据关联在一起：

```bash
git cat-file -p HEAD

# 输出示例:
# tree 3a2b1c4d5e6f7890abcdef1234567890abcdef12
# parent 4d5e6f7890abcdef1234567890abcdef12345678
# author John Doe <john@example.com> 1704067200 +0000
# committer John Doe <john@example.com> 1704067200 +0000
#
# Add user authentication feature
```

每个 commit 包含：
- 指向根 tree 的指针
- 父 commit——初始 commit 没有父级，合并有多个父级
- 带时间戳的作者信息
- 带时间戳的提交者信息
- 提交消息

#### Tag 对象

带注释的标签是包含元数据的完整对象：

```bash
# 创建一个带注释的标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 查看标签对象
git cat-file -p v1.0.0

# 输出:
# object abc123...
# type commit
# tag v1.0.0
# tagger John Doe <john@example.com> 1704067200 +0000
#
# Release version 1.0.0
```

### 引用（Refs）

引用是指向 commit 的人类可读指针，存储在 `.git/refs/` 中：

```
.git/refs/
├── heads/          # 本地分支
│   ├── main
│   └── feature-x
├── remotes/        # 远程跟踪分支
│   └── origin/
│       ├── main
│       └── feature-y
└── tags/           # 标签
    └── v1.0.0
```

特殊引用包括：
- `HEAD`：指向当前分支或 commit
- `FETCH_HEAD`：最近获取的分支
- `ORIG_HEAD`：危险操作前 HEAD 的备份
- `MERGE_HEAD`：正在合并到 HEAD 的 commit

### 索引（暂存区）

索引是位于 `.git/index` 的暂存区：

```bash
# 查看索引内容
git ls-files --stage

# 输出:
# 100644 9f4d96d5b00d98959ea9960f069585ce42b1349a 0 README.md
# 100644 a1b2c3d4e5f6789012345678901234567890abcd 0 src/index.js
```

索引的作用：
- 工作目录和仓库之间的缓存
- 下次提交的暂存区
- 合并期间的冲突解决工作区

## 分支策略

选择正确的分支策略对团队生产力至关重要。以下是最流行的几种方法：

### Git Flow

Git Flow 适用于有计划发布周期的项目：

```
main ─────●────────────●────────────●──────▶
          │            ↑            ↑
          │         release-1.0  release-1.1
          ▼            ↑            ↑
develop ──●────●───●───●────●───●───●──────▶
               │   ↑        │   ↑
               ▼   │        ▼   │
        feature-a──┘  feature-b──┘
```

**分支类型：**

- `main`（或 `master`）：生产就绪的代码
- `develop`：功能的集成分支
- `feature/*`：新功能开发
- `release/*`：发布准备和稳定化
- `hotfix/*`：紧急生产修复

```bash
# 开始一个新功能
git checkout -b feature/user-authentication develop

# 完成功能
git checkout develop
git merge --no-ff feature/user-authentication
git branch -d feature/user-authentication

# 创建发布分支
git checkout -b release/1.0.0 develop

# 完成发布
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"
git checkout develop
git merge --no-ff release/1.0.0
git branch -d release/1.0.0

# 创建热修复
git checkout -b hotfix/critical-bug main
# ... 修复 bug ...
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix 1.0.1"
git checkout develop
git merge --no-ff hotfix/critical-bug
git branch -d hotfix/critical-bug
```

### GitHub Flow

GitHub Flow 更简单，适合持续部署：

```
main ────●────●────●────●────●──────▶
         │    ↑    │    ↑
         │    │    │    │
    feature-a─┘ feature-b─┘
```

**工作流程：**

1. 从 `main` 创建分支
2. 添加提交
3. 打开 Pull Request
4. 讨论和审查代码
5. 部署和测试
6. 合并到 `main`

```bash
# 创建功能分支
git checkout -b feature/new-api main

# 进行更改并推送
git add .
git commit -m "Implement new API endpoint"
git push -u origin feature/new-api

# 通过 GitHub CLI 创建 PR
gh pr create --title "Add new API endpoint" --body "Description of changes"

# 审批后合并
gh pr merge --squash
```

### 主干开发

主干开发强调小规模、频繁的集成：

```
main ────●────●────●────●────●──────▶
         │    ↑    │    ↑
   短生命周期分支 (< 1 天)
```

**核心原则：**

- 主分支始终可部署
- 分支存活时间以小时计，而非天
- 功能开关控制未发布的功能
- 强调 CI/CD 和自动化测试
- 代码审查快速进行

```bash
# 创建短生命周期分支
git checkout -b quick-fix main

# 进行小规模、专注的更改
git add .
git commit -m "Fix null pointer in user service"

# 立即推送并创建 PR
git push -u origin quick-fix
gh pr create --title "Fix null pointer exception"

# 审查后当天合并
gh pr merge --rebase
```

## 合并 vs 变基

理解何时使用合并与变基对于维护清晰且有用的历史记录至关重要。

### 合并（Merge）

合并保留完整历史并创建合并提交：

```bash
git checkout main
git merge feature

# 历史可视化:
#   A---B---C feature
#  /         \
# D---E---F---G main (合并提交)
```

**优点：**
- 保留完整的历史和上下文
- 非破坏性操作
- 历史中可见清晰的合并点
- 对共享分支安全

**缺点：**
- 可能创建复杂的非线性历史
- 大量合并提交可能使日志混乱

```bash
# 标准合并
git checkout main
git merge feature-branch

# 即使可以快进也强制创建合并提交
git merge --no-ff feature-branch

# 使用自定义消息合并
git merge feature-branch -m "Merge feature: user authentication"
```

### 变基（Rebase）

变基在另一个分支之上重放提交：

```bash
git checkout feature
git rebase main

# 变基前:
#   A---B---C feature
#  /
# D---E---F main

# 变基后:
# D---E---F---A'---B'---C' feature
```

**优点：**
- 创建线性、清晰的历史
- 更易于理解和导航
- 简化代码审查
- 使 bisect 更有效

**缺点：**
- 重写历史（提交获得新的 SHA-1 哈希）
- 可能对共享分支造成问题
- 长分支的冲突解决更复杂

```bash
# 基本变基
git checkout feature
git rebase main

# 交互式变基清理提交
git rebase -i HEAD~5

# 变基到特定提交
git rebase --onto main feature~3 feature
```

### 交互式变基

交互式变基是在共享前清理历史的强大工具：

```bash
git rebase -i HEAD~4

# 编辑器打开显示:
# pick abc1234 Add user model
# pick def5678 Fix typo
# pick 789abcd Add validation
# pick 012efgh Update tests

# 改为:
# pick abc1234 Add user model
# squash def5678 Fix typo
# pick 789abcd Add validation
# reword 012efgh Update tests
```

**可用命令：**
- `pick`：按原样使用提交
- `reword`：更改提交消息
- `edit`：停下来修改提交
- `squash`：与前一个提交合并
- `fixup`：类似 squash，但丢弃消息
- `drop`：完全删除提交

### 黄金法则

**永远不要对已推送到共享分支的提交进行变基。** 这会重写历史，给基于这些提交工作的其他人造成问题。

```bash
# 安全：将本地功能分支变基到更新后的 main
git fetch origin
git rebase origin/main

# 安全：对未推送的提交进行交互式变基
git rebase -i origin/feature~5

# 危险：推送到共享分支后变基
# 这需要强制推送并影响队友
git push --force-with-lease  # 仅在绝对必要时使用
```

## 高级命令

### Cherry-pick

将特定提交应用到当前分支：

```bash
# Cherry-pick 单个提交
git cherry-pick abc1234

# Cherry-pick 多个提交
git cherry-pick abc1234 def5678 ghi9012

# Cherry-pick 一个范围（起始不包含，结束包含）
git cherry-pick A^..B

# Cherry-pick 但不提交
git cherry-pick --no-commit abc1234

# Cherry-pick 保留原作者
git cherry-pick -x abc1234  # 添加 "cherry picked from commit..." 到消息
```

**使用场景：**
- 将热修复从发布分支应用到 main
- 从废弃分支恢复有用的提交
- 将功能回移植到维护分支

### Bisect

二分查找引入 bug 的提交：

```bash
# 开始 bisect
git bisect start

# 标记当前版本为坏
git bisect bad

# 标记已知的好版本
git bisect good v1.0.0

# Git 检出中间的提交
# 测试并标记为好或坏
git bisect good  # 或 git bisect bad

# 继续直到找到罪魁祸首
# Git 将报告："abc1234 is the first bad commit"

# 结束 bisect
git bisect reset
```

**使用测试脚本自动化 bisect：**

```bash
# 脚本返回 0 表示好，非零表示坏
git bisect start HEAD v1.0.0
git bisect run ./test-script.sh

# 示例测试脚本
#!/bin/bash
npm test
```

### Reflog

Reflog 记录所有 HEAD 移动，对于恢复非常有价值：

```bash
# 查看 reflog
git reflog

# 输出:
# abc1234 HEAD@{0}: commit: Add feature
# def5678 HEAD@{1}: checkout: moving from main to feature
# 789abcd HEAD@{2}: reset: moving to HEAD~1
# 012efgh HEAD@{3}: commit: Important work

# 恢复"丢失"的提交
git checkout HEAD@{3}

# 从恢复的状态创建分支
git branch recovered-work HEAD@{3}

# 硬重置后恢复
git reset --hard HEAD@{2}
```

**重要提示：** Reflog 是本地的，通常保留 90 天。它是你本地错误的安全网。

### Stash

临时存储未提交的更改：

```bash
# 存储当前更改
git stash

# 带消息存储
git stash push -m "Work in progress on login feature"

# 包括未跟踪文件的存储
git stash -u

# 列出所有存储
git stash list
# stash@{0}: On feature: Work in progress on login feature
# stash@{1}: WIP on main: abc1234 Previous commit

# 应用最近的存储（保留存储）
git stash apply

# 应用并删除存储
git stash pop

# 应用特定存储
git stash apply stash@{1}

# 从存储创建分支
git stash branch new-feature stash@{0}

# 删除一个存储
git stash drop stash@{1}

# 清除所有存储
git stash clear
```

### Worktrees

同时在多个分支上工作而无需存储：

```bash
# 为分支创建新的工作树
git worktree add ../project-hotfix hotfix/critical-bug

# 列出工作树
git worktree list

# 创建带新分支的工作树
git worktree add -b feature/new-ui ../project-ui

# 删除工作树
git worktree remove ../project-hotfix

# 清理过期的工作树信息
git worktree prune
```

## Git 钩子

Git 钩子是在 Git 工作流程的特定点自动运行的脚本。

### 客户端钩子

位于 `.git/hooks/`：

```
.git/hooks/
├── pre-commit       # 提交创建前
├── prepare-commit-msg  # 提交消息编辑器打开前
├── commit-msg       # 验证提交消息
├── post-commit      # 提交创建后
├── pre-push         # 推送到远程前
├── pre-rebase       # 变基开始前
└── post-merge       # 合并完成后
```

### 实用钩子示例

**pre-commit（代码质量检查）：**

```bash
#!/bin/sh
# .git/hooks/pre-commit

# 运行 linter
echo "Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "ESLint failed. Please fix errors before committing."
    exit 1
fi

# 运行测试
echo "Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "Tests failed. Please fix before committing."
    exit 1
fi

# 检查调试语句
if git diff --cached | grep -E "console\.log|debugger|binding\.pry"; then
    echo "Warning: Debug statements found. Remove before committing."
    exit 1
fi

# 检查大文件
MAX_SIZE=5242880  # 5MB
for file in $(git diff --cached --name-only); do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        if [ $size -gt $MAX_SIZE ]; then
            echo "Error: $file is larger than 5MB. Use Git LFS."
            exit 1
        fi
    fi
done

exit 0
```

**commit-msg（强制使用约定式提交）：**

```bash
#!/bin/sh
# .git/hooks/commit-msg

commit_msg=$(cat "$1")
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,72}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
    echo "ERROR: Invalid commit message format."
    echo ""
    echo "Expected format: type(scope): description"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
    echo ""
    echo "Examples:"
    echo "  feat(auth): add OAuth2 login support"
    echo "  fix(api): handle null response from server"
    echo "  docs: update installation instructions"
    exit 1
fi
```

**pre-push（防止强制推送到受保护分支）：**

```bash
#!/bin/sh
# .git/hooks/pre-push

protected_branches="main master develop"
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

for branch in $protected_branches; do
    if [ "$current_branch" = "$branch" ]; then
        # 检查强制推送
        if echo "$@" | grep -q "\-\-force\|\-f"; then
            echo "ERROR: Force push to $branch is not allowed!"
            exit 1
        fi
    fi
done

exit 0
```

### 使用 Husky 管理钩子

Husky 使 JavaScript 项目的钩子管理更加简单：

```bash
# 安装 Husky
npm install husky --save-dev

# 初始化 Husky
npx husky install

# 添加到 package.json scripts
{
  "scripts": {
    "prepare": "husky install"
  }
}

# 添加钩子
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/commit-msg "npx commitlint --edit $1"

# 安装 commitlint 用于消息验证
npm install @commitlint/cli @commitlint/config-conventional --save-dev

# 创建 commitlint 配置
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
```

## 冲突解决

当 Git 无法自动合并更改时会发生冲突。了解如何高效解决冲突至关重要。

### 理解冲突标记

```
<<<<<<< HEAD
当前分支上的你的更改
=======
被合并分支的传入更改
>>>>>>> feature-branch
```

对于使用 `diff3` 样式的三方合并：

```
<<<<<<< HEAD
你的更改
||||||| common ancestor
原始内容
=======
他们的更改
>>>>>>> feature-branch
```

### 冲突解决策略

```bash
# 查看有冲突的文件
git status

# 使用可视化合并工具
git mergetool

# 接受当前分支的更改
git checkout --ours filename.txt

# 接受传入分支的更改
git checkout --theirs filename.txt

# 手动编辑后标记为已解决
git add filename.txt

# 继续合并
git commit

# 如需要可中止合并
git merge --abort
```

### 配置合并工具

```bash
# 设置默认合并工具
git config --global merge.tool vscode

# 配置 VS Code 作为合并工具
git config --global mergetool.vscode.cmd 'code --wait $MERGED'

# 使用 diff3 冲突样式（显示共同祖先）
git config --global merge.conflictstyle diff3
```

### 预防冲突

```bash
# 定期与上游同步
git fetch origin
git rebase origin/main

# 开始工作前
git pull --rebase

# 使用 rerere（重用已记录的解决方案）
git config --global rerere.enabled true

# 解决后，Git 会记住解决方案
# 未来相同的冲突会自动解决
```

## Git 工作流程（GitFlow vs 主干开发）

### GitFlow：何时使用

**最适合：**
- 有计划发布的项目
- 生产中有多个版本
- 有正式发布流程的大型团队
- 发布前需要大量 QA 的产品

**挑战：**
- 长生命周期分支可能显著分化
- 合并冲突变得更复杂
- 集成周期更慢
- 认知负担更高

### 主干开发：何时使用

**最适合：**
- 持续部署环境
- 实践 CI/CD 的团队
- 初创公司和敏捷团队
- 需要快速迭代的项目

**要求：**
- 强大的自动化测试
- 未完成功能的功能开关
- 快速的代码审查周转
- 成熟的 CI/CD 流水线

### 对比表

| 方面 | GitFlow | 主干开发 |
|--------|---------|-------------|
| 分支生命周期 | 数天到数周 | 数小时到 1-2 天 |
| 发布流程 | 计划性 | 持续性 |
| 集成频率 | 低 | 高 |
| 合并冲突 | 更频繁、更复杂 | 更少、更简单 |
| 功能开关 | 可选 | 必需 |
| 团队规模 | 中到大型 | 任意规模 |
| 测试要求 | 标准 | 高度自动化 |

## 最佳实践

### 提交指南

```bash
# 原子提交——每次提交一个逻辑更改
git add -p  # 交互式暂存代码块

# 编写有意义的提交消息
git commit -m "feat(auth): implement JWT refresh token rotation

- Add refresh token endpoint
- Implement token rotation on refresh
- Add tests for token expiration scenarios

Closes #123"

# 在功能分支上早提交、勤提交
# 合并到 main 前根据需要压缩
git rebase -i origin/main
```

### 分支命名规范

```bash
# 功能分支
feature/user-authentication
feature/JIRA-123-payment-integration

# Bug 修复
fix/null-pointer-exception
bugfix/JIRA-456-login-redirect

# 热修复
hotfix/security-vulnerability
hotfix/v1.2.1

# 发布
release/1.0.0
release/2024-q1

# 实验
experiment/new-algorithm
spike/performance-optimization
```

### 安全最佳实践

```bash
# 永远不要提交敏感数据
echo ".env" >> .gitignore
echo "*.pem" >> .gitignore
echo "secrets/" >> .gitignore

# 使用凭据助手
git config --global credential.helper cache

# 使用 GPG 签名提交
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_KEY_ID

# 验证签名提交
git log --show-signature

# 如果意外提交了密钥
# 使用 BFG Repo-Cleaner（比 filter-branch 更快）
bfg --delete-files secrets.env
bfg --replace-text passwords.txt

# 清理后强制推送（与团队协调！）
git push --force-with-lease
```

### 仓库维护

```bash
# 垃圾回收
git gc

# 激进清理
git gc --aggressive --prune=now

# 删除不再存在的远程跟踪分支
git fetch --prune

# 查找历史中的大文件
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sed -n 's/^blob //p' | \
  sort -rnk2 | \
  head -20

# 检查仓库完整性
git fsck --full
```

## 面试要点

### 基础问题

**问：Git 和 SVN 有什么区别？**

| Git | SVN |
|-----|-----|
| 分布式 | 集中式 |
| 完整的本地仓库 | 仅工作副本 |
| 分支是轻量级的 | 分支是目录 |
| 快速（本地操作） | 较慢（网络操作） |
| 内容寻址存储 | 基于文件的存储 |

**问：解释 `git fetch` 和 `git pull` 的区别。**

- `git fetch`：从远程下载对象和引用；不修改工作目录
- `git pull`：运行 `git fetch` 然后运行 `git merge`（使用 `--rebase` 则运行 `git rebase`）

```bash
# 等同于 git pull
git fetch origin
git merge origin/main

# 等同于 git pull --rebase
git fetch origin
git rebase origin/main
```

**问：什么是快进合并？**

当目标分支自分支以来没有新提交时，Git 只是简单地向前移动指针。不会创建合并提交。

```bash
# 即使可以快进也强制创建合并提交
git merge --no-ff feature-branch
```

### 中级问题

**问：解释 Git 的"三棵树"。**

1. **HEAD**：最后一次提交的快照，下次提交的父级
2. **索引（暂存区）**：建议的下次提交快照
3. **工作目录**：编辑文件的沙箱

**问：`reset`、`checkout` 和 `revert` 有什么区别？**

- `git reset`：移动 HEAD，可选地更新索引/工作目录
- `git checkout`：切换分支或恢复文件；不移动分支指针
- `git revert`：创建新提交来撤销更改（对共享历史安全）

```bash
# Reset：将分支指针向后移动
git reset --soft HEAD~1   # 保持更改已暂存
git reset --mixed HEAD~1  # 保持更改未暂存（默认）
git reset --hard HEAD~1   # 丢弃更改

# Checkout：切换或恢复
git checkout feature-branch
git checkout -- file.txt  # 恢复文件

# Revert：创建撤销提交
git revert abc1234
```

**问：如何找到引入 bug 的提交？**

使用 `git bisect` 进行二分查找：

```bash
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
# 测试每次检出，标记好/坏
# Git 识别罪魁祸首
git bisect reset
```

### 高级问题

**问：如何处理大型仓库？**

```bash
# 浅克隆
git clone --depth 1 https://github.com/org/repo.git

# 部分克隆（无 blob）
git clone --filter=blob:none https://github.com/org/repo.git

# 稀疏检出
git sparse-checkout init --cone
git sparse-checkout set src/module1 src/module2

# Git LFS 用于大文件
git lfs track "*.psd"
git lfs track "videos/*"
```

**问：如何安全地修改已推送的历史？**

```bash
# 使用 --force-with-lease（比 --force 更安全）
git push --force-with-lease

# 如果远程有你未获取的新提交，它会失败
# 强制推送前始终与团队沟通
# 未经协调永远不要强制推送到 main/master
```

**问：描述你偏好的 Git 工作流程。**

一个好的回答应包括：
- 工作流程选择的理由（团队规模、发布频率）
- 分支命名规范
- 代码审查流程
- CI/CD 集成
- 如何处理冲突
- 发布管理方法

## 延伸阅读

### 官方资源

- [Pro Git 书籍](https://git-scm.com/book/en/v2) - 全面的官方指南（免费）
- [Git 参考手册](https://git-scm.com/docs) - 完整的命令文档
- [Git 内部原理](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain) - 深入了解 Git 架构

### 交互式学习

- [Learn Git Branching](https://learngitbranching.js.org/) - 可视化、交互式分支教程
- [Oh Shit, Git!?!](https://ohshitgit.com/) - 常见错误恢复指南
- [Git Explorer](https://gitexplorer.com/) - 找到适合你任务的正确命令
- [Visualizing Git](http://git-school.github.io/visualizing-git/) - 查看命令如何影响图形

### 工作流程深入

- [成功的 Git 分支模型](https://nvie.com/posts/a-successful-git-branching-model/) - 原始 GitFlow 文章
- [主干开发](https://trunkbaseddevelopment.com/) - 全面的主干开发指南
- [GitHub Flow 指南](https://docs.github.com/en/get-started/quickstart/github-flow) - GitHub 推荐的工作流程
- [约定式提交](https://www.conventionalcommits.org/) - 提交消息规范

### 高级主题

- [Git Flight Rules](https://github.com/k88hudson/git-flight-rules) - 出问题时该怎么做
- [Git Tips](https://github.com/git-tips/tips) - 有用的 Git 技巧集合
- [Git 钩子文档](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) - 官方钩子指南
- [Git LFS 文档](https://git-lfs.github.io/) - 大文件存储指南

### 书籍

- *Pro Git* 作者 Scott Chacon 和 Ben Straub（在线免费提供）
- *Version Control with Git* 作者 Jon Loeliger 和 Matthew McCullough
- *Git for Teams* 作者 Emma Jane Hogbin Westby
- *Git Pocket Guide* 作者 Richard E. Silverman

## 总结

Git 是现代软件开发的必备工具。理解其内部原理有助于你更有效地使用它，并自信地从错误中恢复。以下是关键要点：

1. **理解对象模型**：Blob、tree、commit 和 tag 构成了 Git 的基础。一切都是内容寻址的。

2. **选择正确的工作流程**：GitFlow 适用于计划发布，GitHub Flow 追求简单，主干开发适用于持续部署。

3. **掌握合并和变基**：在共享分支上使用合并保留历史；使用变基保持功能分支整洁。永远不要对共享历史进行变基。

4. **利用高级命令**：Cherry-pick 用于选择性更改，bisect 用于 bug 追踪，reflog 用于恢复，stash 用于上下文切换。

5. **使用钩子自动化**：自动执行代码质量、提交消息标准和安全检查。

6. **自信地解决冲突**：使用合并工具，理解冲突标记，对重复的冲突模式启用 rerere。

7. **遵循最佳实践**：编写带有有意义消息的原子提交，使用一致的分支命名，永远不要提交密钥。

8. **维护仓库健康**：定期垃圾回收，清理过期分支，对大文件使用 Git LFS。

掌握 Git 的关键是实践。在测试仓库中实验，理解命令失败时会发生什么，并逐步将高级技术融入日常工作流程。当出现问题时，请记住：如果它在 Git 中，它很可能是可恢复的。
