---
title: Rspack 构建工具
description: 深入理解 Rspack - 基于 Rust 的高性能打包工具，兼容 webpack 生态系统
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Rspack
  - 打包工具
  - 构建工具
  - Rust
  - Webpack
  - 性能
status: imported
origin: old/src/content/docs/frontend/rspack.zh.md
divergence: 0.22
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 2
  lastUpdated: 2026-01-22
---

Rspack 是一个用 Rust 编写的高性能 JavaScript 打包工具，旨在成为 webpack 的直接替代品，同时提供显著更快的构建速度。Rspack 由字节跳动开发，旨在解决基于 JavaScript 的打包工具的性能瓶颈，同时保持与 webpack 生态系统的完全兼容。

## 概念解释

### 什么是 Rspack？

**Rspack** 是新一代打包工具，利用 Rust 的强大性能实现比 webpack 快 5-10 倍的构建速度。它保持与 webpack 兼容的 API，允许团队以最小的配置更改迁移现有项目，同时享受显著改善的构建性能。

```javascript
// rspack.config.js - webpack 用户看起来很熟悉
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'builtin:swc-loader'
      }
    ]
  }
};
```

关键洞察在于 Rspack 用 Rust 重新实现了 webpack 的核心算法，同时暴露了 JavaScript 兼容的配置接口。这种混合方式提供了两全其美的效果：原生性能与生态系统兼容性。

### 发展历史

JavaScript 打包工具领域经历了显著的演进：

| 时期 | 技术 | 方式 |
|------|------|------|
| 2012 | Browserify | 首个模块打包工具 |
| 2014 | Webpack | 基于插件的打包 |
| 2017 | Parcel | 零配置打包 |
| 2019 | Snowpack | 无打包开发 |
| 2020 | Vite | 基于 ESM 的开发服务器 |
| 2021 | esbuild | 基于 Go 的打包工具 |
| 2022 | Turbopack | 基于 Rust（Vercel） |
| 2023 | Rspack | Rust + webpack 兼容 |
| 2024 | Rspack 1.0 | 生产就绪版本 |

### Rspack 与其他打包工具对比

#### Rspack vs Webpack

```javascript
// Webpack - 基于 JavaScript，较慢但成熟
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader', // JavaScript 转换
        exclude: /node_modules/
      }
    ]
  }
};

// Rspack - 基于 Rust，更快且内置转换
// rspack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'builtin:swc-loader', // 原生 Rust 转换
        exclude: /node_modules/
      }
    ]
  }
};
```

#### Rspack vs Vite

```javascript
// Vite - 基于 ESM，开发体验优秀
// vite.config.js
export default {
  build: {
    rollupOptions: {
      // 生产构建使用 Rollup
    }
  }
};

// Rspack - 基于打包，开发/生产行为一致
// rspack.config.js
module.exports = {
  // 开发和生产使用相同的打包方式
  // 环境之间行为更可预测
};
```

### Rspack 的核心特征

1. **Rust 性能**：核心算法用 Rust 实现，获得原生速度
2. **Webpack 兼容**：大多数 webpack 配置可直接替换
3. **内置转换**：原生 SWC 支持，无需外部加载器
4. **增量编译**：高效的缓存和部分重建
5. **Tree Shaking**：高级死代码消除
6. **代码分割**：自动和手动的 chunk 优化

## 核心原理

### Rust 驱动的架构

Rspack 的性能来自其 Rust 实现。关键路径操作——解析、转换和打包——都在原生代码中执行：

```
传统 webpack：
JavaScript -> 解析(JS) -> 转换(JS) -> 打包(JS) -> 输出
     |          |           |           |
     +-------- 全部在单线程 JS 中执行 ----+

Rspack：
JavaScript -> 解析(Rust) -> 转换(Rust) -> 打包(Rust) -> 输出
     |           |             |            |
     +-------- 并行、原生执行 ----------------+
```

### 内置加载器

Rspack 提供常用加载器的原生实现，消除 JavaScript 开销：

```javascript
// rspack.config.js
module.exports = {
  module: {
    rules: [
      // 内置 SWC 加载器用于 JavaScript/TypeScript
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true
              },
              transform: {
                react: {
                  runtime: 'automatic'
                }
              }
            }
          }
        }
      },
      // 内置 CSS 支持
      {
        test: /\.css$/,
        type: 'css'
      },
      // 内置资源处理
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset'
      }
    ]
  }
};
```

### 增量编译

Rspack 使用精密的缓存系统实现快速重建：

```javascript
// rspack.config.js
module.exports = {
  // 构建之间的持久缓存
  cache: true,

  // 或更详细的配置
  experiments: {
    incrementalRebuild: {
      make: true,
      emitAssets: true
    }
  }
};
```

增量编译系统追踪：
- 模块依赖
- 文件时间戳
- 内容哈希
- 转换结果

### 并行处理

与 webpack 的单线程特性不同，Rspack 利用了 Rust 的并发能力：

```
模块图构建：
┌─────────────────────────────────────────────┐
│ 线程 1: 解析 A.js → 转换 A.js               │
│ 线程 2: 解析 B.js → 转换 B.js               │
│ 线程 3: 解析 C.js → 转换 C.js               │
│ 线程 4: 解析 D.js → 转换 D.js               │
└─────────────────────────────────────────────┘
                    ↓
              Bundle 组装
                    ↓
               输出文件
```

## 核心要点

### 配置基础

Rspack 配置与 webpack 相似，并有一些增强：

```javascript
// rspack.config.js
const path = require('path');

module.exports = {
  // 入口点
  entry: {
    main: './src/index.js',
    vendor: './src/vendor.js'
  },

  // 输出配置
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true
  },

  // 开发模式优化
  mode: 'development', // 或 'production'

  // Source maps
  devtool: 'source-map',

  // 模块解析
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
};
```

### 内置 SWC 加载器

SWC 加载器是核心功能，提供快速的 JavaScript/TypeScript 转换：

```javascript
// rspack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            // 源类型
            sourceMap: true,

            // JavaScript 编译器选项
            jsc: {
              // 解析器配置
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: true,
                dynamicImport: true
              },

              // 转换选项
              transform: {
                // React 转换
                react: {
                  runtime: 'automatic',
                  development: process.env.NODE_ENV === 'development',
                  refresh: process.env.NODE_ENV === 'development'
                },

                // 装饰器支持
                legacyDecorator: true,
                decoratorMetadata: true
              },

              // 目标环境
              target: 'es2020',

              // 压缩（生产环境）
              minify: {
                compress: true,
                mangle: true
              }
            },

            // 环境目标
            env: {
              targets: 'chrome >= 87'
            }
          }
        },
        exclude: /node_modules/
      }
    ]
  }
};
```

### CSS 处理

Rspack 内置 CSS 支持，有多种模式：

```javascript
// rspack.config.js
module.exports = {
  module: {
    rules: [
      // 原生 CSS 模块
      {
        test: /\.module\.css$/,
        type: 'css/module',
        generator: {
          localIdentName: '[local]--[hash:8]'
        }
      },

      // 普通 CSS
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css'
      },

      // Sass/SCSS（需要 sass-loader）
      {
        test: /\.scss$/,
        use: ['sass-loader'],
        type: 'css'
      },

      // PostCSS 处理
      {
        test: /\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['autoprefixer']
              }
            }
          }
        ],
        type: 'css'
      }
    ]
  },

  // 生产环境 CSS 提取
  experiments: {
    css: true
  }
};
```

### 代码分割

Rspack 支持自动和手动代码分割：

```javascript
// rspack.config.js
module.exports = {
  optimization: {
    // 启用 chunk 分割
    splitChunks: {
      chunks: 'all',

      // 用于 vendor 分割的缓存组
      cacheGroups: {
        // Vendor chunk
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },

        // 公共模块 chunk
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        },

        // React 专用 chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        }
      }
    },

    // Runtime chunk
    runtimeChunk: 'single'
  }
};
```

动态导入无缝工作：

```javascript
// src/App.jsx
import { lazy, Suspense } from 'react';

// 使用动态导入自动代码分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// 使用魔法注释命名 chunks
const Analytics = lazy(() =>
  import(/* webpackChunkName: "analytics" */ './pages/Analytics')
);

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

### 开发服务器

Rspack 包含一个快速的开发服务器：

```javascript
// rspack.config.js
module.exports = {
  devServer: {
    port: 3000,
    hot: true,
    open: true,

    // 代理 API 请求
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    },

    // 用于 SPA 的 History API 回退
    historyApiFallback: true,

    // 静态文件服务
    static: {
      directory: './public'
    },

    // 自定义中间件
    setupMiddlewares: (middlewares, devServer) => {
      middlewares.unshift({
        path: '/health',
        handler: (req, res) => {
          res.json({ status: 'ok' });
        }
      });
      return middlewares;
    }
  }
};
```

## 代码示例

### 完整的 React 项目设置

```javascript
// rspack.config.js
const path = require('path');
const { defineConfig } = require('@rspack/cli');

module.exports = defineConfig({
  entry: {
    main: './src/index.tsx'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'assets/[name].[hash:8][ext]',
    publicPath: '/',
    clean: true
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },

  module: {
    rules: [
      // TypeScript/JavaScript
      {
        test: /\.(ts|tsx|js|jsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: process.env.NODE_ENV === 'development',
                  refresh: process.env.NODE_ENV === 'development'
                }
              }
            }
          }
        },
        exclude: /node_modules/
      },

      // CSS 模块
      {
        test: /\.module\.css$/,
        type: 'css/module'
      },

      // 全局 CSS
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css'
      },

      // 图片
      {
        test: /\.(png|jpg|jpeg|gif|webp)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8KB
          }
        }
      },

      // SVG 作为 React 组件
      {
        test: /\.svg$/,
        issuer: /\.(ts|tsx|js|jsx)$/,
        use: ['@svgr/webpack']
      },

      // 字体
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource'
      }
    ]
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'react',
          priority: 20
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    },
    runtimeChunk: 'single'
  },

  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true
  },

  builtins: {
    html: [
      {
        template: './public/index.html',
        favicon: './public/favicon.ico'
      }
    ],
    define: {
      'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:8080')
    }
  }
});
```

### 从 Webpack 迁移

```javascript
// 之前: webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new MiniCssExtractPlugin()
  ]
};

// 之后: rspack.config.js
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'builtin:swc-loader', // 替换 babel-loader
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        type: 'css' // 内置 CSS 支持
      }
    ]
  },
  builtins: {
    html: [
      {
        template: './public/index.html'
      }
    ]
  },
  experiments: {
    css: true // 启用 CSS 提取
  }
};
```

### 多环境配置

```javascript
// rspack.config.js
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',

  devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

  entry: './src/index.tsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction
      ? '[name].[contenthash:8].js'
      : '[name].js',
    chunkFilename: isProduction
      ? '[name].[contenthash:8].chunk.js'
      : '[name].chunk.js',
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: !isProduction,
                  refresh: !isProduction
                }
              },
              // 仅在生产环境压缩
              ...(isProduction && {
                minify: {
                  compress: {
                    drop_console: true,
                    drop_debugger: true
                  },
                  mangle: true
                }
              })
            }
          }
        }
      }
    ]
  },

  optimization: {
    minimize: isProduction,
    splitChunks: isProduction ? {
      chunks: 'all',
      maxSize: 244000, // 244KB chunks
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    } : false
  },

  devServer: !isProduction ? {
    port: 3000,
    hot: true,
    historyApiFallback: true
  } : undefined
};
```

### 插件使用

```javascript
// rspack.config.js
const path = require('path');
const { CopyRspackPlugin } = require('@rspack/plugin-copy');

module.exports = {
  entry: './src/index.js',

  plugins: [
    // 复制静态资源
    new CopyRspackPlugin({
      patterns: [
        {
          from: 'public/static',
          to: 'static'
        }
      ]
    })
  ],

  builtins: {
    // 内置 HTML 插件
    html: [
      {
        template: './public/index.html',
        filename: 'index.html',
        inject: 'body',
        scriptLoading: 'defer',
        minify: process.env.NODE_ENV === 'production'
      }
    ],

    // 内置 define 插件
    define: {
      'process.env.VERSION': JSON.stringify(require('./package.json').version),
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
    },

    // 内置 progress 插件
    progress: true,

    // 压缩配置
    minifyOptions: {
      dropConsole: process.env.NODE_ENV === 'production'
    }
  }
};
```

## 最佳实践

### 优化构建性能

```javascript
// rspack.config.js
module.exports = {
  // 1. 尽可能使用内置加载器
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader', // 最快的选择
        exclude: /node_modules/
      }
    ]
  },

  // 2. 启用持久缓存
  cache: true,

  // 3. 优化 resolve 配置
  resolve: {
    // 限制要检查的扩展名
    extensions: ['.tsx', '.ts', '.jsx', '.js'],

    // 使用显式别名
    alias: {
      '@': path.resolve(__dirname, 'src')
    },

    // 如果不需要则跳过符号链接解析
    symlinks: false
  },

  // 4. 排除大型目录
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'builtin:swc-loader'
      }
    ]
  },

  // 5. 使用适当的 source maps
  devtool: process.env.NODE_ENV === 'production'
    ? 'source-map'  // 完整 maps 用于生产调试
    : 'eval-cheap-module-source-map'  // 快速 maps 用于开发
};
```

### 高效的代码分割

```javascript
// rspack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',

      // 大小阈值
      minSize: 20000,      // 20KB 最小 chunk 大小
      maxSize: 244000,     // 244KB 最大 chunk 大小

      // Chunk 命名
      name: (module, chunks, cacheGroupKey) => {
        const allChunksNames = chunks.map(c => c.name).join('~');
        return `${cacheGroupKey}-${allChunksNames}`;
      },

      cacheGroups: {
        // 关键 vendor 代码
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'framework',
          priority: 40,
          enforce: true
        },

        // 大型库
        lib: {
          test: /[\\/]node_modules[\\/]/,
          name: (module) => {
            const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
            return match ? `lib-${match[1].replace('@', '')}` : 'lib';
          },
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true
        },

        // 共享模块
        common: {
          minChunks: 2,
          priority: 20,
          reuseExistingChunk: true
        }
      }
    },

    // 分离 runtime 代码
    runtimeChunk: {
      name: 'runtime'
    }
  }
};
```

### 环境特定配置

```javascript
// rspack.config.js
const { merge } = require('webpack-merge');

const baseConfig = {
  entry: './src/index.tsx',
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader'
      }
    ]
  }
};

const devConfig = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    hot: true,
    port: 3000
  }
};

const prodConfig = {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all'
    }
  }
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  return merge(baseConfig, isProduction ? prodConfig : devConfig);
};
```

## 常见陷阱

### 加载器兼容性问题

```javascript
// 问题：使用 webpack 特定的加载器功能
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'some-webpack-loader',
          options: {
            // Webpack 特定选项可能不工作
            webpackSpecificOption: true
          }
        }
      }
    ]
  }
};

// 解决方案：使用内置加载器或经过验证的兼容加载器
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            // SWC 选项有良好的文档和支持
            jsc: {
              parser: {
                syntax: 'ecmascript'
              }
            }
          }
        }
      }
    ]
  }
};
```

### 插件兼容性

```javascript
// 问题：假设所有 webpack 插件都能工作
const SomeWebpackPlugin = require('some-webpack-plugin');

module.exports = {
  plugins: [
    new SomeWebpackPlugin() // 可能不兼容
  ]
};

// 解决方案：检查兼容性或使用内置替代方案
module.exports = {
  // 可用时使用内置功能
  builtins: {
    html: [{ template: './index.html' }],
    define: { __VERSION__: JSON.stringify('1.0.0') }
  },

  // 只使用经过验证的兼容插件
  plugins: [
    // 查看 rspack 文档了解兼容性
  ]
};
```

### CSS 处理差异

```javascript
// 问题：期望与 webpack 相同的 CSS 处理
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'] // webpack 风格
      }
    ]
  }
};

// 解决方案：使用 Rspack 的内置 CSS 处理
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        type: 'css' // 内置 CSS 支持
      },
      {
        test: /\.module\.css$/,
        type: 'css/module' // CSS 模块支持
      }
    ]
  },
  experiments: {
    css: true // 启用 CSS 提取
  }
};
```

### 热模块替换

```javascript
// 问题：HMR 不能正常工作
module.exports = {
  devServer: {
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader'
        // 缺少 React Refresh 配置
      }
    ]
  }
};

// 解决方案：正确启用 React Refresh
module.exports = {
  devServer: {
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              transform: {
                react: {
                  runtime: 'automatic',
                  development: true,
                  refresh: true // 启用 React Refresh
                }
              }
            }
          }
        }
      }
    ]
  },
  builtins: {
    react: {
      refresh: true // 也在 builtins 级别启用
    }
  }
};
```

## 性能考量

### 构建时间对比

```
基准测试：大型 React 应用程序（500+ 组件）

                  冷构建    增量构建    内存使用
Webpack 5         45s       8s         1.2GB
Vite              12s       0.3s       400MB
esbuild           3s        0.1s       200MB
Rspack            5s        0.5s       300MB

注意：
- Rspack 冷构建比 webpack 快 9 倍
- 保持 webpack 兼容性，不像 esbuild
- 增量构建比 webpack 更快
```

### 内存优化

```javascript
// rspack.config.js
module.exports = {
  // 如果内存受限，限制并行度
  experiments: {
    parallelism: 4 // 根据可用内存从默认值减少
  },

  // 优化缓存策略
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },

  // 减少 source map 内存使用
  devtool: process.env.NODE_ENV === 'production'
    ? false  // 如果不需要则在 CI 中禁用
    : 'eval-cheap-source-map'
};
```

### 生产优化

```javascript
// rspack.config.js
module.exports = {
  mode: 'production',

  optimization: {
    minimize: true,

    // Tree shaking
    usedExports: true,
    sideEffects: true,

    // 模块合并
    concatenateModules: true,

    // Chunk 优化
    splitChunks: {
      chunks: 'all',
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      minSize: 20000,

      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true
        }
      }
    }
  },

  // 使用 SWC 压缩
  builtins: {
    minifyOptions: {
      dropConsole: true,
      dropDebugger: true,
      passes: 2
    }
  }
};
```

## 实战场景

### 大型应用迁移

```javascript
// 步骤 1：审计当前 webpack 配置
// 识别自定义加载器和插件

// 步骤 2：创建等效设置的 rspack.config.js
const path = require('path');

module.exports = {
  entry: './src/index.tsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    publicPath: '/'
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      // 迁移现有别名
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks')
    }
  },

  module: {
    rules: [
      // 用 builtin:swc-loader 替换 babel-loader
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: true
              },
              transform: {
                react: {
                  runtime: 'automatic'
                },
                legacyDecorator: true
              }
            }
          }
        }
      },

      // 迁移 CSS 配置
      {
        test: /\.css$/,
        type: 'css'
      },
      {
        test: /\.scss$/,
        use: ['sass-loader'],
        type: 'css'
      }
    ]
  }
};

// 步骤 3：迁移期间运行并行构建
// package.json
{
  "scripts": {
    "build:webpack": "webpack --config webpack.config.js",
    "build:rspack": "rspack --config rspack.config.js",
    "build:compare": "npm run build:webpack && npm run build:rspack"
  }
}
```

### Monorepo 配置

```javascript
// packages/app/rspack.config.js
const path = require('path');

module.exports = {
  entry: './src/index.tsx',

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // 引用共享包
      '@shared/ui': path.resolve(__dirname, '../shared-ui/src'),
      '@shared/utils': path.resolve(__dirname, '../shared-utils/src')
    }
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader',
        // 包含共享包用于转换
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, '../shared-ui'),
          path.resolve(__dirname, '../shared-utils')
        ]
      }
    ]
  }
};
```

### 微前端设置

```javascript
// rspack.config.js 用于 Module Federation
module.exports = {
  entry: './src/index.tsx',

  builtins: {
    // Module Federation 配置
    moduleFederation: {
      name: 'app',
      filename: 'remoteEntry.js',

      // 暴露模块
      exposes: {
        './Button': './src/components/Button',
        './Header': './src/components/Header'
      },

      // 消费远程模块
      remotes: {
        shared: 'shared@http://localhost:3001/remoteEntry.js'
      },

      // 共享依赖
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0'
        }
      }
    }
  }
};
```

## 面试要点

### 核心概念

**Q1：什么是 Rspack，它与 webpack 有什么区别？**

Rspack 是基于 Rust 的 JavaScript 打包工具，设计为 webpack 的直接替代品：

1. **性能**：由于 Rust 实现，构建速度快 5-10 倍
2. **兼容性**：保持 webpack API 兼容性，便于迁移
3. **内置功能**：原生 SWC 集成，CSS 处理无需额外插件
4. **并行化**：利用 Rust 的并发处理能力

**Q2：为什么 Rspack 比 webpack 更快？**

1. **Rust 性能**：原生代码执行 vs JavaScript 解释
2. **并行处理**：多线程解析和转换
3. **内置加载器**：常见转换无 JavaScript 开销
4. **高效缓存**：持久缓存与智能失效
5. **优化算法**：依赖解析和打包的 Rust 实现

**Q3：什么时候应该选择 Rspack 而不是 Vite 或 esbuild？**

选择 Rspack 当：
- 从复杂配置的 webpack 迁移
- 需要 webpack 插件兼容性
- 想要一致的开发/生产打包行为
- 处理需要快速构建的大型代码库

选择 Vite 当：
- 从简单需求的新项目开始
- 偏好无打包的开发体验
- 使用有一流 Vite 支持的框架

选择 esbuild 当：
- 最大构建速度是优先级
- 简单的打包需求
- 构建库

### 实践问题

**Q4：如何从 webpack 迁移到 Rspack？**

1. 安装 Rspack：`npm install @rspack/cli @rspack/core`
2. 将 `webpack.config.js` 重命名为 `rspack.config.js`
3. 用 `builtin:swc-loader` 替换 `babel-loader`
4. 用内置 `type: 'css'` 替换 CSS 加载器
5. 用 `builtins.html` 替换 HtmlWebpackPlugin
6. 测试构建输出的等效性
7. 逐步迁移自定义插件

**Q5：如何优化 Rspack 构建性能？**

```javascript
module.exports = {
  // 使用内置加载器
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'builtin:swc-loader'
    }]
  },

  // 启用缓存
  cache: true,

  // 优化 resolve
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    symlinks: false
  },

  // 适当的 source maps
  devtool: 'eval-cheap-module-source-map'
};
```

## 延伸阅读

### 官方文档

- [Rspack 文档](https://rspack.dev/) - 官方文档和指南
- [Rspack GitHub 仓库](https://github.com/web-infra-dev/rspack) - 源代码和问题
- [Rspack 迁移指南](https://rspack.dev/guide/migrate-from-webpack) - Webpack 迁移文档

### 相关工具

- [SWC 文档](https://swc.rs/) - Rspack 使用的基于 Rust 的 JavaScript 编译器
- [webpack 文档](https://webpack.js.org/) - 用于理解 webpack 兼容性
- [Rsbuild](https://rsbuild.dev/) - 基于 Rspack 构建的更高级构建工具

### 性能资源

- [Rspack 基准测试](https://github.com/web-infra-dev/rspack/tree/main/benchmarks) - 官方基准测试
- [JavaScript 打包工具对比](https://bundlers.tooling.report/) - 跨打包工具功能对比

### 社区资源

- [Rspack Discord](https://discord.gg/rspack) - 社区讨论
- [字节跳动工程博客](https://blog.bytedance.com/) - Rspack 团队的技术文章

---

Rspack 代表了 JavaScript 构建工具生态系统的重大进步，提供了 webpack 兼容性与 Rust 驱动的性能。通过理解其架构、配置选项和迁移策略，团队可以显著改善构建时间，同时保持现有的开发工作流程。随着工具的持续成熟，它正成为那些已超越 webpack 性能限制的项目越来越有吸引力的选择。
