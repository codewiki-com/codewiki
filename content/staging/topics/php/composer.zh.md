---
title: Composer包管理
description: Composer完全指南，PHP依赖管理、自动加载与包发布
track: php
section: tooling
difficulty: beginner
tags:
  - PHP
  - Composer
  - 包管理
  - 依赖管理
status: imported
origin: old/src/content/docs/php/composer.zh.md
divergence: 0.133
issues: []
legacy:
  category: PHP
  subcategory: 工具链
  order: 5
  lastUpdated: 2026-01-07
---

Composer 是 PHP 的依赖管理工具，它允许你声明项目所需的库，并为你安装和管理这些依赖。Composer 已成为现代 PHP 开发的标准工具，几乎所有主流 PHP 框架和库都使用 Composer 进行依赖管理。

## 安装 Composer

### Windows 安装

在 Windows 上，最简单的方法是下载并运行 Composer-Setup.exe 安装程序：

```bash
# 或使用命令行安装
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"

# 移动到系统路径
move composer.phar C:\bin\composer.phar
```

### Linux/macOS 安装

```bash
# 下载安装脚本
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"

# 验证安装脚本完整性（可选但推荐）
php -r "if (hash_file('sha384', 'composer-setup.php') === 'EXPECTED_HASH') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"

# 运行安装
php composer-setup.php

# 删除安装脚本
php -r "unlink('composer-setup.php');"

# 全局安装
sudo mv composer.phar /usr/local/bin/composer
```

### 验证安装

```bash
composer --version
# Composer version 2.7.x 2024-xx-xx xx:xx:xx
```

## composer.json 配置文件

`composer.json` 是 Composer 的核心配置文件，定义了项目的依赖和其他元数据。

### 基本结构

```json
{
    "name": "vendor/project-name",
    "description": "项目描述",
    "type": "project",
    "license": "MIT",
    "authors": [
        {
            "name": "张三",
            "email": "zhangsan@example.com"
        }
    ],
    "minimum-stability": "stable",
    "prefer-stable": true,
    "require": {
        "php": ">=8.1",
        "monolog/monolog": "^3.0",
        "guzzlehttp/guzzle": "^7.8"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.5",
        "phpstan/phpstan": "^1.10"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "analyse": "phpstan analyse src"
    },
    "config": {
        "optimize-autoloader": true,
        "sort-packages": true
    }
}
```

### 配置字段详解

#### name（包名称）

包名称格式为 `vendor/package`，必须小写，可以使用连字符：

```json
{
    "name": "acme/my-awesome-package"
}
```

#### type（包类型）

常见的包类型：

```json
{
    "type": "library"    // 默认类型，可复用的库
    // "type": "project" // 项目类型
    // "type": "metapackage" // 元包，只包含依赖
    // "type": "composer-plugin" // Composer 插件
}
```

#### license（许可证）

```json
{
    "license": "MIT"
    // 或多个许可证
    // "license": ["MIT", "GPL-3.0-or-later"]
}
```

#### require（生产依赖）

声明生产环境需要的依赖：

```json
{
    "require": {
        "php": ">=8.1",
        "ext-json": "*",
        "ext-pdo": "*",
        "monolog/monolog": "^3.0",
        "symfony/console": "^6.0|^7.0"
    }
}
```

#### require-dev（开发依赖）

声明仅在开发时需要的依赖：

```json
{
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "mockery/mockery": "^1.6",
        "fakerphp/faker": "^1.23",
        "laravel/pint": "^1.13"
    }
}
```

## 依赖管理

### 安装依赖

```bash
# 安装所有依赖（包括开发依赖）
composer install

# 仅安装生产依赖
composer install --no-dev

# 优化自动加载（生产环境推荐）
composer install --no-dev --optimize-autoloader
```

### 添加依赖

```bash
# 添加生产依赖
composer require monolog/monolog

# 指定版本
composer require monolog/monolog:^3.0

# 添加开发依赖
composer require --dev phpunit/phpunit

# 添加多个包
composer require guzzlehttp/guzzle symfony/console
```

### 更新依赖

```bash
# 更新所有依赖
composer update

# 更新指定包
composer update monolog/monolog

# 更新多个包
composer update monolog/monolog guzzlehttp/guzzle

# 仅更新开发依赖
composer update --dev

# 更新到最新的次要版本
composer update --prefer-lowest
```

### 移除依赖

```bash
# 移除包
composer remove monolog/monolog

# 移除开发依赖
composer remove --dev phpunit/phpunit
```

### 查看依赖信息

```bash
# 查看已安装的包
composer show

# 查看特定包信息
composer show monolog/monolog

# 查看依赖树
composer show --tree

# 查看可更新的包
composer outdated

# 检查安全漏洞
composer audit
```

## 版本约束

Composer 使用语义化版本（Semantic Versioning）来管理依赖版本。

### 版本约束语法

```json
{
    "require": {
        // 精确版本
        "vendor/package": "1.2.3",

        // 版本范围
        "vendor/package": ">=1.0",
        "vendor/package": ">=1.0 <2.0",
        "vendor/package": ">1.0 <1.5 || >=2.0",

        // 通配符
        "vendor/package": "1.2.*",

        // 波浪号（~）：允许最后一位数字增加
        "vendor/package": "~1.2.3",  // 等同于 >=1.2.3 <1.3.0
        "vendor/package": "~1.2",    // 等同于 >=1.2.0 <2.0.0

        // 脱字符（^）：允许不破坏兼容性的更新（推荐）
        "vendor/package": "^1.2.3",  // 等同于 >=1.2.3 <2.0.0
        "vendor/package": "^0.3",    // 等同于 >=0.3.0 <0.4.0

        // 稳定性标识
        "vendor/package": "1.0-beta",
        "vendor/package": "1.0@dev",
        "vendor/package": "dev-main"
    }
}
```

### 版本约束对比

| 约束         | 含义                           | 示例版本范围       |
| ------------ | ------------------------------ | ------------------ |
| `1.2.3`      | 精确版本                       | 1.2.3              |
| `>=1.0`      | 大于等于 1.0                   | 1.0, 1.5, 2.0, ... |
| `<2.0`       | 小于 2.0                       | 0.1, 1.0, 1.9, ... |
| `1.2.*`      | 1.2.x 的任意版本               | 1.2.0, 1.2.5, ...  |
| `~1.2.3`     | 1.2.x 系列（>=1.2.3 <1.3.0）   | 1.2.3, 1.2.9, ...  |
| `^1.2.3`     | 1.x.x 系列（>=1.2.3 <2.0.0）   | 1.2.3, 1.9.9, ...  |
| `^0.2.3`     | 0.2.x 系列（>=0.2.3 <0.3.0）   | 0.2.3, 0.2.9, ...  |

### composer.lock 文件

`composer.lock` 文件记录了所有已安装依赖的精确版本。

```bash
# 查看 lock 文件与 json 文件的差异
composer validate

# 根据 lock 文件安装（推荐用于生产环境）
composer install

# 更新 lock 文件
composer update
```

**最佳实践**：
- 始终将 `composer.lock` 提交到版本控制
- 生产环境使用 `composer install` 而非 `composer update`
- 团队成员使用相同的依赖版本

## PSR-4 自动加载

PSR-4 是 PHP 的自动加载标准，Composer 完美支持这一标准。

### 基本配置

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "src/",
            "App\\Controllers\\": "src/Http/Controllers/",
            "Database\\Seeders\\": "database/seeders/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    }
}
```

### 目录结构示例

```
project/
├── composer.json
├── src/
│   ├── Application.php          # App\Application
│   ├── Models/
│   │   └── User.php             # App\Models\User
│   ├── Services/
│   │   └── UserService.php      # App\Services\UserService
│   └── Http/
│       └── Controllers/
│           └── HomeController.php  # App\Controllers\HomeController
├── tests/
│   └── Unit/
│       └── UserTest.php         # Tests\Unit\UserTest
└── vendor/
    └── autoload.php
```

### 类文件示例

```php
<?php
// src/Models/User.php

namespace App\Models;

class User
{
    private string $name;
    private string $email;

    public function __construct(string $name, string $email)
    {
        $this->name = $name;
        $this->email = $email;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }
}
```

```php
<?php
// src/Services/UserService.php

namespace App\Services;

use App\Models\User;

class UserService
{
    private array $users = [];

    public function createUser(string $name, string $email): User
    {
        $user = new User($name, $email);
        $this->users[] = $user;
        return $user;
    }

    public function findByEmail(string $email): ?User
    {
        foreach ($this->users as $user) {
            if ($user->getEmail() === $email) {
                return $user;
            }
        }
        return null;
    }
}
```

### 使用自动加载

```php
<?php
// index.php

// 引入 Composer 自动加载
require __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Services\UserService;

$userService = new UserService();
$user = $userService->createUser('张三', 'zhangsan@example.com');

echo "用户名: " . $user->getName() . PHP_EOL;
echo "邮箱: " . $user->getEmail() . PHP_EOL;
```

### 其他自动加载方式

```json
{
    "autoload": {
        // PSR-4 自动加载（推荐）
        "psr-4": {
            "App\\": "src/"
        },

        // PSR-0 自动加载（已废弃，不推荐）
        "psr-0": {
            "Legacy_": "src/legacy/"
        },

        // 类映射（用于不遵循命名规范的类）
        "classmap": [
            "src/legacy/",
            "lib/"
        ],

        // 文件自动加载（用于函数文件）
        "files": [
            "src/helpers.php",
            "src/functions.php"
        ]
    }
}
```

### 更新自动加载

修改 autoload 配置后，需要重新生成自动加载文件：

```bash
# 重新生成自动加载文件
composer dump-autoload

# 优化自动加载（生产环境推荐）
composer dump-autoload --optimize

# 使用类映射优化（最快）
composer dump-autoload --classmap-authoritative
```

## Composer 脚本

Composer 脚本允许你在 Composer 事件触发时执行自定义命令。

### 定义脚本

```json
{
    "scripts": {
        "test": "phpunit",
        "test:coverage": "phpunit --coverage-html coverage",
        "lint": "php-cs-fixer fix --dry-run --diff",
        "lint:fix": "php-cs-fixer fix",
        "analyse": "phpstan analyse src --level=8",
        "check": [
            "@lint",
            "@analyse",
            "@test"
        ],
        "post-install-cmd": [
            "@php artisan key:generate --ansi"
        ],
        "post-update-cmd": [
            "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
        ],
        "post-autoload-dump": [
            "Illuminate\\Foundation\\ComposerScripts::postAutoloadDump"
        ]
    },
    "scripts-descriptions": {
        "test": "运行 PHPUnit 测试",
        "test:coverage": "运行测试并生成覆盖率报告",
        "lint": "检查代码风格",
        "lint:fix": "修复代码风格问题",
        "analyse": "静态代码分析",
        "check": "运行所有检查（代码风格、静态分析、测试）"
    }
}
```

### 运行脚本

```bash
# 运行测试脚本
composer test

# 运行代码检查
composer check

# 列出所有可用脚本
composer list
```

### Composer 事件

可用的 Composer 事件：

| 事件                    | 触发时机                         |
| ----------------------- | -------------------------------- |
| `pre-install-cmd`       | `composer install` 执行前        |
| `post-install-cmd`      | `composer install` 执行后        |
| `pre-update-cmd`        | `composer update` 执行前         |
| `post-update-cmd`       | `composer update` 执行后         |
| `pre-autoload-dump`     | 自动加载生成前                   |
| `post-autoload-dump`    | 自动加载生成后                   |
| `post-root-package-install` | 根包安装后（create-project） |
| `post-create-project-cmd` | create-project 完成后          |

### 使用 PHP 回调

```json
{
    "scripts": {
        "post-install-cmd": [
            "App\\Composer\\ScriptHandler::postInstall"
        ]
    }
}
```

```php
<?php
// src/Composer/ScriptHandler.php

namespace App\Composer;

use Composer\Script\Event;

class ScriptHandler
{
    public static function postInstall(Event $event): void
    {
        $composer = $event->getComposer();
        $io = $event->getIO();

        $io->write('执行安装后脚本...');

        // 创建必要的目录
        $dirs = ['storage/logs', 'storage/cache', 'storage/sessions'];
        foreach ($dirs as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
                $io->write("  创建目录: $dir");
            }
        }

        $io->write('安装后脚本执行完成！');
    }
}
```

## 发布包到 Packagist

Packagist 是 Composer 的默认包仓库，发布包需要以下步骤。

### 准备包

1. 创建规范的目录结构：

```
my-package/
├── composer.json
├── README.md
├── LICENSE
├── src/
│   └── MyClass.php
├── tests/
│   └── MyClassTest.php
└── .gitignore
```

2. 配置 composer.json：

```json
{
    "name": "your-vendor/my-package",
    "description": "一个有用的 PHP 包",
    "type": "library",
    "license": "MIT",
    "authors": [
        {
            "name": "你的名字",
            "email": "your-email@example.com"
        }
    ],
    "require": {
        "php": ">=8.1"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0"
    },
    "autoload": {
        "psr-4": {
            "YourVendor\\MyPackage\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "YourVendor\\MyPackage\\Tests\\": "tests/"
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
```

### 发布步骤

1. 将代码推送到 GitHub：

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-vendor/my-package.git
git push -u origin main
```

2. 创建版本标签：

```bash
git tag -a v1.0.0 -m "版本 1.0.0"
git push origin v1.0.0
```

3. 在 Packagist 上提交：
   - 访问 https://packagist.org
   - 使用 GitHub 账号登录
   - 点击 "Submit" 按钮
   - 输入 GitHub 仓库 URL
   - 设置 GitHub Webhook 自动更新

### 版本发布规范

遵循语义化版本：

```bash
# 主版本（不兼容的 API 变更）
git tag -a v2.0.0 -m "版本 2.0.0 - 重大更新"

# 次版本（向后兼容的功能新增）
git tag -a v1.1.0 -m "版本 1.1.0 - 新增功能"

# 补丁版本（向后兼容的问题修复）
git tag -a v1.0.1 -m "版本 1.0.1 - Bug 修复"

# 预发布版本
git tag -a v2.0.0-beta.1 -m "版本 2.0.0 Beta 1"
git tag -a v2.0.0-rc.1 -m "版本 2.0.0 RC 1"
```

## 私有仓库配置

企业环境中，经常需要使用私有包仓库。

### 使用私有 VCS 仓库

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/your-company/private-package"
        }
    ],
    "require": {
        "your-company/private-package": "^1.0"
    }
}
```

### 使用私有 Composer 仓库

```json
{
    "repositories": [
        {
            "type": "composer",
            "url": "https://packages.your-company.com"
        }
    ],
    "require": {
        "your-company/private-package": "^1.0"
    }
}
```

### 使用 Satis 搭建私有仓库

Satis 是一个静态 Composer 仓库生成器：

1. 安装 Satis：

```bash
composer create-project composer/satis --stability=dev
```

2. 创建配置文件 `satis.json`：

```json
{
    "name": "My Company Packages",
    "homepage": "https://packages.your-company.com",
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/your-company/package-a"
        },
        {
            "type": "vcs",
            "url": "https://github.com/your-company/package-b"
        }
    ],
    "require-all": true,
    "archive": {
        "directory": "dist",
        "format": "tar",
        "skip-dev": true
    }
}
```

3. 生成仓库：

```bash
php bin/satis build satis.json public/
```

### 使用 Private Packagist

Private Packagist 是官方提供的私有包托管服务：

```json
{
    "repositories": [
        {
            "type": "composer",
            "url": "https://your-company.repo.packagist.com"
        }
    ]
}
```

### 认证配置

对于需要认证的私有仓库：

```bash
# 使用命令配置
composer config --global --auth http-basic.packages.your-company.com username password

# 或使用 GitHub Token
composer config --global github-oauth.github.com YOUR_GITHUB_TOKEN

# 或使用 GitLab Token
composer config --global gitlab-token.gitlab.com YOUR_GITLAB_TOKEN
```

认证信息存储在 `~/.composer/auth.json`：

```json
{
    "http-basic": {
        "packages.your-company.com": {
            "username": "your-username",
            "password": "your-password"
        }
    },
    "github-oauth": {
        "github.com": "your-github-token"
    }
}
```

### 禁用 Packagist

如果只使用私有仓库，可以禁用默认的 Packagist：

```json
{
    "repositories": [
        {
            "type": "composer",
            "url": "https://packages.your-company.com"
        },
        {
            "packagist.org": false
        }
    ]
}
```

## 常用命令参考

### 依赖管理

```bash
# 安装依赖
composer install
composer install --no-dev
composer install --prefer-dist
composer install --prefer-source

# 添加依赖
composer require vendor/package
composer require vendor/package:^1.0
composer require --dev vendor/package

# 更新依赖
composer update
composer update vendor/package
composer update --with-dependencies
composer update --no-dev

# 移除依赖
composer remove vendor/package
composer remove --dev vendor/package
```

### 信息查询

```bash
# 查看已安装的包
composer show
composer show vendor/package
composer show --tree

# 查看可更新的包
composer outdated
composer outdated --direct

# 搜索包
composer search keyword

# 验证 composer.json
composer validate
composer validate --strict

# 检查安全漏洞
composer audit
```

### 自动加载

```bash
# 重新生成自动加载
composer dump-autoload
composer dump-autoload --optimize
composer dump-autoload --classmap-authoritative
```

### 缓存管理

```bash
# 清除缓存
composer clear-cache
composer clearcache

# 查看全局配置
composer config --list --global

# 查看仓库配置
composer config repositories
```

### 创建项目

```bash
# 使用包模板创建项目
composer create-project laravel/laravel my-project
composer create-project symfony/skeleton my-project
composer create-project --prefer-dist yiisoft/yii2-app-basic my-project
```

## 最佳实践

### 版本控制

```bash
# 提交 composer.json 和 composer.lock
git add composer.json composer.lock
git commit -m "更新依赖"

# 不要提交 vendor 目录
echo "vendor/" >> .gitignore
```

### 生产环境部署

```bash
# 生产环境安装
composer install --no-dev --optimize-autoloader --no-interaction

# 或使用类映射优化
composer install --no-dev --classmap-authoritative --no-interaction
```

### CI/CD 配置

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, xml
          coverage: xdebug

      - name: Cache Composer dependencies
        uses: actions/cache@v3
        with:
          path: vendor
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - name: Install dependencies
        run: composer install --prefer-dist --no-progress

      - name: Run tests
        run: composer test
```

### 本地开发包

开发时链接本地包：

```json
{
    "repositories": [
        {
            "type": "path",
            "url": "../my-local-package",
            "options": {
                "symlink": true
            }
        }
    ],
    "require": {
        "vendor/my-local-package": "@dev"
    }
}
```

### 平台要求检查

```json
{
    "config": {
        "platform": {
            "php": "8.1.0",
            "ext-mbstring": "1.0.0"
        },
        "platform-check": true
    }
}
```

## 常见问题排查

### 内存不足

```bash
# 增加内存限制
php -d memory_limit=-1 /usr/local/bin/composer update

# 或设置环境变量
COMPOSER_MEMORY_LIMIT=-1 composer update
```

### 下载超时

```bash
# 增加超时时间
composer config --global process-timeout 600

# 使用国内镜像
composer config -g repos.packagist composer https://mirrors.aliyun.com/composer/
```

### 版本冲突

```bash
# 查看为什么安装了某个版本
composer why vendor/package

# 查看为什么不能安装某个版本
composer why-not vendor/package:2.0

# 检查依赖冲突
composer diagnose
```

### 锁文件问题

```bash
# 重新生成锁文件
rm composer.lock
composer install

# 验证锁文件
composer validate
```

## 总结

Composer 是现代 PHP 开发不可或缺的工具。通过本文，你已经学习了：

- **安装和配置**：在不同操作系统上安装 Composer
- **依赖管理**：使用 require、update、remove 等命令管理依赖
- **版本约束**：使用语义化版本和各种版本约束符号
- **自动加载**：配置 PSR-4 自动加载和其他加载方式
- **脚本功能**：利用 Composer 脚本自动化工作流程
- **包发布**：将自己的包发布到 Packagist
- **私有仓库**：配置和使用私有包仓库

掌握 Composer 将极大地提高你的 PHP 开发效率，让你能够轻松地利用 PHP 社区的丰富资源。建议在日常开发中多加实践，熟练运用各种命令和配置选项。
