---
title: Composer Package Management
description: Complete guide to Composer, PHP dependency management, autoloading and package publishing
track: php
section: tooling
difficulty: beginner
tags:
  - PHP
  - Composer
  - Package Management
  - Dependency Management
status: imported
origin: old/src/content/docs/php/composer.en.md
divergence: 0.133
issues: []
legacy:
  category: PHP
  subcategory: Toolchain
  order: 5
  lastUpdated: 2026-01-07
---

Composer is the de facto standard dependency manager for PHP. It allows you to declare the libraries your project depends on and manages (installs/updates) them for you. This comprehensive guide covers everything from basic usage to advanced package publishing.

## What is Composer

Composer is a tool for dependency management in PHP. It allows you to declare the libraries your project depends on and it will manage (install/update) them for you. Composer is not a package manager in the same sense as Yum or Apt. While it deals with packages or libraries, it manages them on a per-project basis.

### Key Features

- **Dependency Resolution**: Automatically resolves and installs dependencies of dependencies
- **Autoloading**: Generates PSR-4 compliant autoloader for all installed packages
- **Version Locking**: Uses composer.lock to ensure consistent installations across environments
- **Scripts**: Run custom scripts at various points during installation/update
- **Platform Requirements**: Specify PHP version and extension requirements

## Installation

### Installing Composer Globally

**On Linux/macOS:**

```bash
# Download the installer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"

# Verify the installer (optional but recommended)
php -r "if (hash_file('sha384', 'composer-setup.php') === file_get_contents('https://composer.github.io/installer.sig')) { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"

# Run the installer
php composer-setup.php

# Remove the installer
php -r "unlink('composer-setup.php');"

# Move to global path
sudo mv composer.phar /usr/local/bin/composer
```

**On Windows:**

Download and run the [Composer-Setup.exe](https://getcomposer.org/Composer-Setup.exe) installer.

### Verifying Installation

```bash
composer --version
# Output: Composer version 2.x.x 2026-xx-xx xx:xx:xx
```

## Basic Usage

### Starting a New Project

```bash
# Create a new project directory
mkdir my-project
cd my-project

# Initialize Composer
composer init
```

The `init` command will interactively ask you for project details:

```
Package name (<vendor>/<name>): myvendor/my-project
Description []: My awesome PHP project
Author [Your Name <email@example.com>]:
Minimum Stability []: stable
Package Type (e.g. library, project, metapackage, composer-plugin) []: project
License []: MIT
```

### Installing Dependencies

```bash
# Install a package
composer require monolog/monolog

# Install a development dependency
composer require --dev phpunit/phpunit

# Install all dependencies from composer.json
composer install

# Update all dependencies
composer update

# Update a specific package
composer update monolog/monolog
```

### Removing Dependencies

```bash
# Remove a package
composer remove monolog/monolog
```

## The composer.json File

The `composer.json` file is the heart of any Composer-managed project. It describes your project and its dependencies.

### Complete Example

```json
{
    "name": "myvendor/my-application",
    "description": "A sample PHP application",
    "type": "project",
    "license": "MIT",
    "authors": [
        {
            "name": "John Doe",
            "email": "john@example.com",
            "homepage": "https://example.com",
            "role": "Developer"
        }
    ],
    "minimum-stability": "stable",
    "prefer-stable": true,
    "require": {
        "php": "^8.1",
        "ext-json": "*",
        "ext-pdo": "*",
        "monolog/monolog": "^3.0",
        "guzzlehttp/guzzle": "^7.5",
        "symfony/console": "^6.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "phpstan/phpstan": "^1.10",
        "squizlabs/php_codesniffer": "^3.7"
    },
    "autoload": {
        "psr-4": {
            "MyApp\\": "src/"
        },
        "files": [
            "src/helpers.php"
        ]
    },
    "autoload-dev": {
        "psr-4": {
            "MyApp\\Tests\\": "tests/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "analyse": "phpstan analyse src",
        "cs-check": "phpcs src",
        "cs-fix": "phpcbf src",
        "post-install-cmd": [
            "@php -r \"echo 'Installation complete!\\n';\""
        ]
    },
    "config": {
        "optimize-autoloader": true,
        "sort-packages": true,
        "allow-plugins": {
            "dealerdirect/phpcodesniffer-composer-installer": true
        }
    },
    "extra": {
        "branch-alias": {
            "dev-main": "1.0.x-dev"
        }
    }
}
```

### Key Sections Explained

#### name

The package name in `vendor/package` format:

```json
{
    "name": "mycompany/payment-gateway"
}
```

#### type

Defines the package type:

- `library` (default): A reusable library
- `project`: A full application
- `metapackage`: An empty package with dependencies
- `composer-plugin`: A Composer plugin

```json
{
    "type": "library"
}
```

#### require

Production dependencies with version constraints:

```json
{
    "require": {
        "php": "^8.1",
        "ext-curl": "*",
        "vendor/package": "^2.0"
    }
}
```

#### require-dev

Development-only dependencies:

```json
{
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "mockery/mockery": "^1.6"
    }
}
```

## Managing Dependencies

### The composer.lock File

When you run `composer install` for the first time or `composer update`, Composer creates a `composer.lock` file. This file locks your project to the specific versions that were installed.

**Important Rules:**

1. **Always commit composer.lock** to version control for applications
2. Run `composer install` in production (reads from lock file)
3. Run `composer update` only when you want to update dependencies

```bash
# Install exact versions from lock file
composer install

# Update lock file with latest versions matching constraints
composer update

# Update only the lock file hash (no package updates)
composer update --lock
```

### Checking for Updates

```bash
# Show outdated packages
composer outdated

# Show only direct dependencies
composer outdated --direct

# Show why a package is installed
composer why monolog/monolog

# Show why a package cannot be installed
composer why-not php 8.3
```

### Platform Requirements

Specify PHP version and extension requirements:

```json
{
    "require": {
        "php": "^8.1",
        "ext-json": "*",
        "ext-mbstring": "*",
        "ext-openssl": "*",
        "lib-curl": ">=7.50"
    }
}
```

### Conflict and Replace

```json
{
    "conflict": {
        "vendor/old-package": "*"
    },
    "replace": {
        "vendor/fork-origin": "self.version"
    }
}
```

## Autoloading

Composer generates an autoloader that automatically loads your classes. This is one of its most powerful features.

### PSR-4 Autoloading

PSR-4 is the modern autoloading standard. It maps namespaces to directories:

```json
{
    "autoload": {
        "psr-4": {
            "MyApp\\": "src/",
            "MyApp\\Models\\": "src/Models/",
            "MyApp\\Controllers\\": ["src/Controllers/", "src/Http/Controllers/"]
        }
    }
}
```

**Directory Structure:**

```
my-project/
├── composer.json
├── src/
│   ├── Application.php      -> MyApp\Application
│   ├── Models/
│   │   └── User.php         -> MyApp\Models\User
│   └── Controllers/
│       └── HomeController.php -> MyApp\Controllers\HomeController
└── vendor/
    └── autoload.php
```

**Example Class (src/Models/User.php):**

```php
<?php

namespace MyApp\Models;

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

**Using the Autoloader:**

```php
<?php

// Include the autoloader
require __DIR__ . '/vendor/autoload.php';

use MyApp\Models\User;
use MyApp\Controllers\HomeController;

$user = new User('John Doe', 'john@example.com');
echo $user->getName();
```

### PSR-0 Autoloading (Legacy)

PSR-0 is an older standard still supported for backwards compatibility:

```json
{
    "autoload": {
        "psr-0": {
            "LegacyVendor_": "src/"
        }
    }
}
```

### Classmap Autoloading

For classes that don't follow a standard, use classmap:

```json
{
    "autoload": {
        "classmap": [
            "src/legacy/",
            "lib/",
            "Something.php"
        ]
    }
}
```

### Files Autoloading

For functions or constants that need to be loaded on every request:

```json
{
    "autoload": {
        "files": [
            "src/helpers.php",
            "src/constants.php"
        ]
    }
}
```

**Example helpers.php:**

```php
<?php

if (!function_exists('dd')) {
    function dd(...$vars): never
    {
        foreach ($vars as $var) {
            var_dump($var);
        }
        exit(1);
    }
}

if (!function_exists('env')) {
    function env(string $key, mixed $default = null): mixed
    {
        $value = getenv($key);
        return $value !== false ? $value : $default;
    }
}
```

### Development Autoloading

Separate autoloading for development (tests, etc.):

```json
{
    "autoload-dev": {
        "psr-4": {
            "MyApp\\Tests\\": "tests/",
            "MyApp\\Tests\\Fixtures\\": "tests/fixtures/"
        }
    }
}
```

### Regenerating the Autoloader

After changing autoload configuration:

```bash
# Regenerate autoloader
composer dump-autoload

# Optimize for production
composer dump-autoload --optimize

# Generate classmap for all classes (maximum optimization)
composer dump-autoload --classmap-authoritative
```

## Scripts and Hooks

Composer scripts allow you to run custom code at various points in the Composer lifecycle.

### Defining Scripts

```json
{
    "scripts": {
        "test": "phpunit",
        "test:coverage": "phpunit --coverage-html coverage",
        "lint": "phpcs --standard=PSR12 src/",
        "lint:fix": "phpcbf --standard=PSR12 src/",
        "analyse": "phpstan analyse src --level=max",
        "check": [
            "@lint",
            "@analyse",
            "@test"
        ],
        "build": [
            "@composer install --no-dev --optimize-autoloader",
            "npm run build"
        ]
    }
}
```

### Running Scripts

```bash
# Run a script
composer test
composer check

# Run with arguments
composer test -- --filter=UserTest

# List available scripts
composer list
```

### Event Hooks

Composer provides lifecycle events you can hook into:

```json
{
    "scripts": {
        "pre-install-cmd": "MyApp\\Composer\\Hooks::preInstall",
        "post-install-cmd": [
            "MyApp\\Composer\\Hooks::postInstall",
            "@php artisan optimize"
        ],
        "pre-update-cmd": "MyApp\\Composer\\Hooks::preUpdate",
        "post-update-cmd": "MyApp\\Composer\\Hooks::postUpdate",
        "post-autoload-dump": [
            "MyApp\\Composer\\Hooks::postAutoloadDump"
        ],
        "post-root-package-install": [
            "@php -r \"file_put_contents('.env', file_get_contents('.env.example'));\""
        ],
        "post-create-project-cmd": [
            "@php artisan key:generate"
        ]
    }
}
```

**Example Hook Class:**

```php
<?php

namespace MyApp\Composer;

use Composer\Script\Event;

class Hooks
{
    public static function postInstall(Event $event): void
    {
        $composer = $event->getComposer();
        $io = $event->getIO();

        $io->write('Running post-install tasks...');

        // Perform setup tasks
        self::createDirectories();
        self::copyConfiguration();

        $io->write('Post-install tasks completed!');
    }

    public static function postUpdate(Event $event): void
    {
        $io = $event->getIO();
        $io->write('Dependencies updated successfully!');
    }

    private static function createDirectories(): void
    {
        $dirs = ['storage', 'storage/logs', 'storage/cache'];
        foreach ($dirs as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }

    private static function copyConfiguration(): void
    {
        if (!file_exists('.env') && file_exists('.env.example')) {
            copy('.env.example', '.env');
        }
    }
}
```

### Available Events

| Event | Description |
|-------|-------------|
| `pre-install-cmd` | Before install command |
| `post-install-cmd` | After install command |
| `pre-update-cmd` | Before update command |
| `post-update-cmd` | After update command |
| `pre-autoload-dump` | Before autoloader generation |
| `post-autoload-dump` | After autoloader generation |
| `post-root-package-install` | After root package install (create-project) |
| `post-create-project-cmd` | After create-project command |

## Version Constraints

Understanding version constraints is crucial for managing dependencies effectively.

### Semantic Versioning

Composer follows semantic versioning (SemVer):

- **MAJOR.MINOR.PATCH** (e.g., 2.1.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Constraint Types

#### Exact Version

```json
{
    "require": {
        "vendor/package": "1.2.3"
    }
}
```

#### Range Operators

```json
{
    "require": {
        "vendor/package": ">=1.0",
        "vendor/package2": ">=1.0 <2.0",
        "vendor/package3": ">=1.0 <1.1 || >=1.2"
    }
}
```

#### Hyphen Range

```json
{
    "require": {
        "vendor/package": "1.0 - 2.0"
    }
}
```

This is equivalent to `>=1.0.0 <2.1` (2.0 is treated as 2.0.*).

#### Wildcard

```json
{
    "require": {
        "vendor/package": "1.0.*"
    }
}
```

Equivalent to `>=1.0 <1.1`.

#### Tilde Operator (~)

Allows patch-level changes:

```json
{
    "require": {
        "vendor/package": "~1.2"
    }
}
```

- `~1.2` is equivalent to `>=1.2 <2.0.0`
- `~1.2.3` is equivalent to `>=1.2.3 <1.3.0`

#### Caret Operator (^)

Allows non-breaking changes (recommended):

```json
{
    "require": {
        "vendor/package": "^1.2.3"
    }
}
```

- `^1.2.3` is equivalent to `>=1.2.3 <2.0.0`
- `^0.3` is equivalent to `>=0.3.0 <0.4.0`
- `^0.0.3` is equivalent to `>=0.0.3 <0.0.4`

### Stability Flags

```json
{
    "require": {
        "vendor/package": "^1.0@beta",
        "vendor/package2": "^1.0@RC",
        "vendor/package3": "dev-main"
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
```

Stability levels (least to most stable):
1. dev
2. alpha
3. beta
4. RC (Release Candidate)
5. stable

### Version Constraint Examples

| Constraint | Allowed Versions |
|------------|-----------------|
| `1.0.2` | Exactly 1.0.2 |
| `>=1.0` | 1.0.0 and above |
| `>=1.0 <2.0` | 1.x.x only |
| `^1.2.3` | 1.2.3 to <2.0.0 |
| `~1.2.3` | 1.2.3 to <1.3.0 |
| `1.0.*` | 1.0.0 to <1.1.0 |
| `dev-main` | Latest main branch |

## Publishing Packages

### Preparing Your Package

1. **Create a proper composer.json:**

```json
{
    "name": "myvendor/awesome-library",
    "description": "An awesome PHP library for doing awesome things",
    "type": "library",
    "license": "MIT",
    "authors": [
        {
            "name": "Your Name",
            "email": "you@example.com"
        }
    ],
    "require": {
        "php": "^8.1"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0"
    },
    "autoload": {
        "psr-4": {
            "MyVendor\\AwesomeLibrary\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "MyVendor\\AwesomeLibrary\\Tests\\": "tests/"
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
```

2. **Project Structure:**

```
awesome-library/
├── .gitignore
├── composer.json
├── LICENSE
├── README.md
├── CHANGELOG.md
├── src/
│   └── AwesomeClass.php
└── tests/
    └── AwesomeClassTest.php
```

3. **Create a .gitignore:**

```gitignore
/vendor/
composer.lock
.phpunit.result.cache
coverage/
.idea/
.vscode/
*.cache
```

### Publishing to Packagist

1. Create an account on [Packagist](https://packagist.org)
2. Push your code to a public GitHub/GitLab/Bitbucket repository
3. Submit your repository URL on Packagist
4. Set up auto-updating (Packagist will provide a webhook URL)

### Creating Releases

Use Git tags for versioning:

```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# List tags
git tag -l

# Delete a tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

### Package Validation

```bash
# Validate composer.json
composer validate

# Check for security vulnerabilities
composer audit

# Archive your package
composer archive --format=zip
```

## Private Repositories

### Configuring Private Repositories

#### VCS Repository

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "git@github.com:mycompany/private-package.git"
        }
    ],
    "require": {
        "mycompany/private-package": "^1.0"
    }
}
```

#### Path Repository (Local Development)

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
        "myvendor/my-local-package": "*"
    }
}
```

#### Composer Repository (Satis/Private Packagist)

```json
{
    "repositories": [
        {
            "type": "composer",
            "url": "https://packages.mycompany.com"
        }
    ]
}
```

### Authentication

#### Using auth.json

Create an `auth.json` file (do not commit to version control):

```json
{
    "http-basic": {
        "packages.mycompany.com": {
            "username": "your-username",
            "password": "your-token"
        }
    },
    "github-oauth": {
        "github.com": "your-github-token"
    },
    "gitlab-token": {
        "gitlab.com": "your-gitlab-token"
    }
}
```

#### Command Line Authentication

```bash
# GitHub token
composer config --global github-oauth.github.com YOUR_TOKEN

# GitLab token
composer config --global gitlab-token.gitlab.com YOUR_TOKEN

# HTTP basic auth
composer config --global http-basic.packages.mycompany.com username password
```

### Setting Up Satis

Satis is a static Composer repository generator:

1. **Install Satis:**

```bash
composer create-project composer/satis:dev-main
```

2. **Create satis.json:**

```json
{
    "name": "My Company Packages",
    "homepage": "https://packages.mycompany.com",
    "repositories": [
        {
            "type": "vcs",
            "url": "git@github.com:mycompany/package-one.git"
        },
        {
            "type": "vcs",
            "url": "git@github.com:mycompany/package-two.git"
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

3. **Build the Repository:**

```bash
php bin/satis build satis.json public/
```

### Private Packagist

For larger teams, consider [Private Packagist](https://packagist.com), which offers:

- Mirroring of packagist.org
- Team access management
- Security vulnerability monitoring
- Build artifact storage

## Best Practices

### General Guidelines

1. **Always commit composer.lock** for applications (ensures consistent installs)
2. **Don't commit composer.lock** for libraries (consumers need flexibility)
3. **Use `^` constraints** for most dependencies (allows minor/patch updates)
4. **Run `composer install` in production**, not `composer update`
5. **Review changes** before running `composer update`

### Security

```bash
# Check for known vulnerabilities
composer audit

# Update only security fixes
composer update --with-all-dependencies

# Use specific versions for critical packages
```

### Performance

```bash
# Optimize autoloader for production
composer install --no-dev --optimize-autoloader

# Use classmap for maximum performance
composer dump-autoload --classmap-authoritative

# Install without scripts (for CI/CD)
composer install --no-scripts
```

### CI/CD Configuration

**GitHub Actions Example:**

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        php: ['8.1', '8.2', '8.3']

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          coverage: xdebug

      - name: Cache Composer dependencies
        uses: actions/cache@v4
        with:
          path: vendor
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: |
            ${{ runner.os }}-composer-

      - name: Install dependencies
        run: composer install --prefer-dist --no-progress

      - name: Run tests
        run: composer test
```

### Useful Commands Reference

| Command | Description |
|---------|-------------|
| `composer init` | Initialize a new project |
| `composer require vendor/package` | Add a dependency |
| `composer require --dev vendor/package` | Add a dev dependency |
| `composer remove vendor/package` | Remove a dependency |
| `composer install` | Install from lock file |
| `composer update` | Update all dependencies |
| `composer update vendor/package` | Update specific package |
| `composer outdated` | Show outdated packages |
| `composer show` | Show installed packages |
| `composer show vendor/package` | Show package details |
| `composer why vendor/package` | Show why package is installed |
| `composer validate` | Validate composer.json |
| `composer audit` | Check for security issues |
| `composer dump-autoload` | Regenerate autoloader |
| `composer clear-cache` | Clear Composer cache |
| `composer diagnose` | Diagnose system issues |

### Troubleshooting

**Common Issues:**

1. **Memory Limit Errors:**
```bash
COMPOSER_MEMORY_LIMIT=-1 composer update
```

2. **Slow Downloads:**
```bash
composer config --global repo.packagist composer https://packagist.org
```

3. **Version Conflicts:**
```bash
# See why a version cannot be installed
composer why-not vendor/package 2.0

# Try with more verbose output
composer update -vvv
```

4. **Clear Cache:**
```bash
composer clear-cache
rm -rf vendor/
composer install
```

## Conclusion

Composer has revolutionized PHP development by providing a robust, standardized way to manage dependencies. By understanding its core concepts including the composer.json file, autoloading, scripts, and version constraints you can effectively manage even the most complex PHP projects.

Key takeaways:

- Use `composer.lock` to ensure reproducible builds
- Follow PSR-4 for autoloading your classes
- Use semantic versioning and the caret operator for flexible dependency management
- Leverage scripts to automate common tasks
- Consider private repositories for proprietary code

With these tools and practices, you will be well-equipped to manage dependencies in any PHP project, from small scripts to large enterprise applications.
