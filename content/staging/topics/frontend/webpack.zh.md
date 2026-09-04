---
title: Webpack 完全指南
description: 掌握Webpack模块打包工具，深入理解前端构建原理
track: frontend
section: build-tools
difficulty: advanced
tags:
  - Webpack
  - 打包
  - 构建工具
  - 模块化
status: imported
origin: old/src/content/docs/frontend/webpack.zh.md
divergence: 0.182
issues: []
legacy:
  category: Frontend
  subcategory: Build Tools
  order: 24
  lastUpdated: 2026-01-07
---

Webpack 是现代前端开发中最重要的模块打包工具之一。它可以将各种资源（JavaScript、CSS、图片等）视为模块，通过分析依赖关系，将它们打包成适合浏览器加载的静态资源。本文将深入讲解 Webpack 的核心概念、配置技巧和生产环境优化策略。

## Webpack 核心概念

### Entry（入口）

Entry 是 Webpack 构建依赖图的起点。Webpack 从入口文件开始，递归地构建一个依赖图，然后将所有依赖打包到 bundle 中。

```javascript
// webpack.config.js

// 单入口配置
module.exports = {
  entry: './src/index.js'
}

// 多入口配置
module.exports = {
  entry: {
    app: './src/app.js',
    admin: './src/admin.js',
    vendor: ['react', 'react-dom', 'lodash']
  }
}

// 动态入口配置
module.exports = {
  entry: () => new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        app: './src/app.js',
        admin: './src/admin.js'
      })
    }, 1000)
  })
}
```

**入口配置的最佳实践**：

| 场景 | 配置方式 | 说明 |
|------|---------|------|
| 单页应用 | 字符串 | 一个入口文件 |
| 多页应用 | 对象 | 多个入口，每个页面一个 |
| 分离第三方库 | 数组/对象 | 提取公共依赖 |

### Output（输出）

Output 配置告诉 Webpack 在哪里输出打包后的文件，以及如何命名这些文件。

```javascript
const path = require('path')

module.exports = {
  entry: {
    app: './src/app.js',
    admin: './src/admin.js'
  },
  output: {
    // 输出目录（绝对路径）
    path: path.resolve(__dirname, 'dist'),

    // 输出文件名（支持占位符）
    filename: '[name].[contenthash:8].js',

    // 非入口 chunk 的文件名
    chunkFilename: '[name].[contenthash:8].chunk.js',

    // 资源文件的公共路径
    publicPath: '/assets/',

    // 清理输出目录
    clean: true,

    // 库的导出方式
    library: {
      name: 'MyLibrary',
      type: 'umd',
      export: 'default'
    }
  }
}
```

**常用占位符**：

| 占位符 | 描述 |
|--------|------|
| `[name]` | 入口名称 |
| `[id]` | chunk ID |
| `[hash]` | 编译哈希值 |
| `[chunkhash]` | chunk 内容哈希值 |
| `[contenthash]` | 文件内容哈希值（推荐） |
| `[ext]` | 资源扩展名 |

### Loader（加载器）

Webpack 原生只能理解 JavaScript 和 JSON 文件。Loader 让 Webpack 能够处理其他类型的文件，并将它们转换为有效的模块。

```javascript
module.exports = {
  module: {
    rules: [
      // Babel 处理 JavaScript
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      },

      // TypeScript 处理
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },

      // CSS 处理链
      {
        test: /\.css$/,
        use: [
          'style-loader',      // 将 CSS 注入 DOM
          'css-loader',        // 解析 CSS 导入
          'postcss-loader'     // PostCSS 处理
        ]
      },

      // SCSS 处理
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,   // CSS Modules
              importLoaders: 2
            }
          },
          'postcss-loader',
          'sass-loader'
        ]
      },

      // 图片资源
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024  // 8KB 以下转 base64
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      },

      // 字体文件
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]'
        }
      }
    ]
  }
}
```

**Loader 执行顺序**：从右到左，从下到上执行。例如处理 SCSS 文件时，执行顺序为：`sass-loader` -> `postcss-loader` -> `css-loader` -> `style-loader`。

### Plugin（插件）

Plugin 用于执行范围更广的任务，包括打包优化、资源管理和环境变量注入等。

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const webpack = require('webpack')

module.exports = {
  plugins: [
    // 生成 HTML 文件
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['app'],
      minify: {
        collapseWhitespace: true,
        removeComments: true
      }
    }),

    // 提取 CSS 到独立文件
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[id].[contenthash:8].css'
    }),

    // 定义环境变量
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      __DEV__: JSON.stringify(false)
    }),

    // 打包分析
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false
    }),

    // 显示编译进度
    new webpack.ProgressPlugin()
  ]
}
```

## 模块解析与依赖图

### 模块解析（Module Resolution）

Webpack 使用 enhanced-resolve 库来解析模块路径。理解模块解析规则对于调试和优化构建非常重要。

```javascript
module.exports = {
  resolve: {
    // 模块查找目录
    modules: ['node_modules', 'src'],

    // 别名配置
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      // 精确匹配
      'react$': path.resolve(__dirname, 'node_modules/react')
    },

    // 自动解析的扩展名
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],

    // 主文件名
    mainFiles: ['index'],

    // package.json 中的字段优先级
    mainFields: ['browser', 'module', 'main'],

    // 符号链接解析
    symlinks: true,

    // 缓存配置
    cache: true,

    // 解析器的额外配置
    plugins: []
  },

  // 外部依赖配置
  externals: {
    jquery: 'jQuery',
    lodash: '_'
  }
}
```

### 依赖图的构建过程

Webpack 构建依赖图的过程如下：

```
1. 从入口文件开始
   ↓
2. 解析模块路径（resolve）
   ↓
3. 加载模块内容（loader 处理）
   ↓
4. 解析模块依赖（AST 分析 import/require）
   ↓
5. 递归处理依赖模块
   ↓
6. 生成完整的依赖图
   ↓
7. 根据依赖图生成 chunk
   ↓
8. 输出打包文件
```

```javascript
// 示例：依赖关系
// index.js -> App.js -> Header.js
//                    -> Footer.js
//          -> utils.js -> lodash

// index.js
import App from './App'
import { formatDate } from './utils'

// App.js
import Header from './components/Header'
import Footer from './components/Footer'

// utils.js
import { format } from 'lodash'
```

### Module Federation（模块联邦）

Webpack 5 引入的模块联邦允许不同构建之间共享代码：

```javascript
// 主应用 webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        app1: 'app1@http://localhost:3001/remoteEntry.js',
        app2: 'app2@http://localhost:3002/remoteEntry.js'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' }
      }
    })
  ]
}

// 远程应用 webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app1',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/components/Button',
        './Header': './src/components/Header'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true }
      }
    })
  ]
}
```

## 常用 Loader 配置

### JavaScript/TypeScript 处理

```javascript
module.exports = {
  module: {
    rules: [
      // Babel 配置
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: '> 0.25%, not dead',
                useBuiltIns: 'usage',
                corejs: 3
              }],
              ['@babel/preset-react', {
                runtime: 'automatic'
              }]
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
              ['@babel/plugin-proposal-decorators', { legacy: true }]
            ],
            cacheDirectory: true
          }
        }
      },

      // TypeScript 配置
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,  // 只转译，类型检查交给 fork-ts-checker
              happyPackMode: true
            }
          }
        ]
      }
    ]
  }
}
```

### CSS 处理完整配置

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const isProduction = process.env.NODE_ENV === 'production'

const cssLoaders = (modules = false) => [
  isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
  {
    loader: 'css-loader',
    options: {
      modules: modules ? {
        localIdentName: isProduction
          ? '[hash:base64:8]'
          : '[path][name]__[local]'
      } : false,
      importLoaders: 2,
      sourceMap: !isProduction
    }
  },
  {
    loader: 'postcss-loader',
    options: {
      postcssOptions: {
        plugins: [
          'autoprefixer',
          isProduction && ['cssnano', { preset: 'default' }]
        ].filter(Boolean)
      }
    }
  }
]

module.exports = {
  module: {
    rules: [
      // 普通 CSS
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: cssLoaders(false)
      },

      // CSS Modules
      {
        test: /\.module\.css$/,
        use: cssLoaders(true)
      },

      // SCSS
      {
        test: /\.scss$/,
        exclude: /\.module\.scss$/,
        use: [
          ...cssLoaders(false),
          {
            loader: 'sass-loader',
            options: {
              additionalData: `@import "@/styles/variables.scss";`
            }
          }
        ]
      },

      // SCSS Modules
      {
        test: /\.module\.scss$/,
        use: [
          ...cssLoaders(true),
          'sass-loader'
        ]
      },

      // Less
      {
        test: /\.less$/,
        use: [
          ...cssLoaders(false),
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
                modifyVars: {
                  'primary-color': '#1890ff'
                }
              }
            }
          }
        ]
      }
    ]
  }
}
```

### 资源文件处理

```javascript
module.exports = {
  module: {
    rules: [
      // 图片处理
      {
        test: /\.(png|jpg|jpeg|gif|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024  // 10KB
          }
        },
        generator: {
          filename: 'images/[name].[contenthash:8][ext]'
        }
      },

      // SVG 特殊处理
      {
        test: /\.svg$/,
        oneOf: [
          // 作为 React 组件导入
          {
            issuer: /\.[jt]sx?$/,
            resourceQuery: /react/,  // import Icon from './icon.svg?react'
            use: ['@svgr/webpack']
          },
          // 作为 URL 导入
          {
            type: 'asset',
            generator: {
              filename: 'images/[name].[contenthash:8][ext]'
            }
          }
        ]
      },

      // 字体文件
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]'
        }
      },

      // 视频/音频
      {
        test: /\.(mp4|webm|mp3|wav|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'media/[name].[contenthash:8][ext]'
        }
      }
    ]
  }
}
```

## 常用 Plugin 配置

### 核心插件配置

```javascript
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = {
  plugins: [
    // 清理输出目录
    new CleanWebpackPlugin(),

    // 生成 HTML
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      title: '我的应用',
      favicon: './public/favicon.ico',
      inject: 'body',
      scriptLoading: 'defer',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true
      },
      templateParameters: {
        BASE_URL: '/'
      }
    }),

    // 提取 CSS
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css'
    }),

    // 环境变量
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        API_URL: JSON.stringify(process.env.API_URL)
      }
    }),

    // TypeScript 类型检查（独立进程）
    new ForkTsCheckerWebpackPlugin({
      async: false,
      typescript: {
        configFile: './tsconfig.json'
      }
    }),

    // ESLint 检查
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
      emitWarning: true,
      emitError: true,
      failOnError: false
    }),

    // 复制静态资源
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html']
          }
        }
      ]
    }),

    // 编译进度
    new webpack.ProgressPlugin()
  ],

  // 优化配置
  optimization: {
    minimizer: [
      // JavaScript 压缩
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          format: {
            comments: false
          }
        },
        extractComments: false
      }),

      // CSS 压缩
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ['default', {
            discardComments: { removeAll: true }
          }]
        }
      })
    ]
  }
}
```

### 开发环境专用插件

```javascript
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  plugins: [
    // React 快速刷新
    new ReactRefreshWebpackPlugin({
      overlay: {
        sockIntegration: 'wds'
      }
    }),

    // 热模块替换
    new webpack.HotModuleReplacementPlugin()
  ]
}
```

### 生产环境专用插件

```javascript
const CompressionPlugin = require('compression-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const WorkboxPlugin = require('workbox-webpack-plugin')

module.exports = {
  mode: 'production',
  plugins: [
    // Gzip 压缩
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8
    }),

    // Brotli 压缩
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
      filename: '[path][base].br'
    }),

    // 打包分析
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false
    }),

    // PWA 支持
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\./,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache'
          }
        }
      ]
    })
  ]
}
```

## 代码分割与懒加载

### SplitChunksPlugin 配置

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',  // 对所有 chunk 进行分割
      minSize: 20000, // 最小 chunk 大小
      minRemainingSize: 0,
      minChunks: 1,   // 最少被引用次数
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,

      cacheGroups: {
        // 第三方库
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          reuseExistingChunk: true
        },

        // React 相关
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          priority: 20,
          chunks: 'all'
        },

        // UI 组件库
        antd: {
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          name: 'antd',
          priority: 15,
          chunks: 'all'
        },

        // 工具库
        utils: {
          test: /[\\/]node_modules[\\/](lodash|moment|dayjs)[\\/]/,
          name: 'utils',
          priority: 10
        },

        // 公共模块
        common: {
          minChunks: 2,
          name: 'common',
          priority: -20,
          reuseExistingChunk: true
        }
      }
    },

    // 运行时代码单独打包
    runtimeChunk: {
      name: 'runtime'
    }
  }
}
```

### 动态导入与懒加载

```javascript
// 基础动态导入
const loadModule = async () => {
  const module = await import('./heavy-module.js')
  module.doSomething()
}

// React 组件懒加载
import React, { Suspense, lazy } from 'react'

// 使用 webpackChunkName 指定 chunk 名称
const Dashboard = lazy(() => import(
  /* webpackChunkName: "dashboard" */
  './pages/Dashboard'
))

const Settings = lazy(() => import(
  /* webpackChunkName: "settings" */
  /* webpackPrefetch: true */
  './pages/Settings'
))

const Analytics = lazy(() => import(
  /* webpackChunkName: "analytics" */
  /* webpackPreload: true */
  './pages/Analytics'
))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  )
}
```

### 预加载与预获取

```javascript
// webpackPrefetch: 浏览器空闲时加载（未来可能需要）
// webpackPreload: 与父 chunk 并行加载（当前导航需要）

// 预获取示例
button.addEventListener('click', async () => {
  const { Modal } = await import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "modal" */
    './components/Modal'
  )
  Modal.show()
})

// 预加载示例
import(
  /* webpackPreload: true */
  /* webpackChunkName: "critical-styles" */
  './critical-styles.css'
)
```

## Tree Shaking

### Tree Shaking 原理与配置

Tree Shaking 是一种通过静态分析移除未使用代码的技术。它依赖于 ES Modules 的静态结构。

```javascript
// utils.js - 导出多个函数
export const add = (a, b) => a + b
export const subtract = (a, b) => a - b
export const multiply = (a, b) => a * b
export const divide = (a, b) => a / b

// index.js - 只使用 add
import { add } from './utils'
console.log(add(1, 2))

// Tree Shaking 后，subtract、multiply、divide 会被移除
```

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',  // 生产模式自动启用

  optimization: {
    usedExports: true,      // 标记未使用的导出
    minimize: true,          // 启用压缩
    sideEffects: true,       // 启用副作用分析

    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            dead_code: true,      // 移除死代码
            unused: true,         // 移除未使用变量
            pure_funcs: ['console.log']  // 移除指定函数调用
          }
        }
      })
    ]
  }
}
```

### sideEffects 配置

```json
// package.json
{
  "name": "my-package",
  "sideEffects": false
}

// 或者指定有副作用的文件
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}
```

### 确保 Tree Shaking 生效的最佳实践

```javascript
// 1. 使用 ES Modules 语法
// Bad - CommonJS
const { debounce } = require('lodash')

// Good - ES Modules
import { debounce } from 'lodash-es'

// 2. 避免默认导出整个对象
// Bad
export default {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
}

// Good
export const add = (a, b) => a + b
export const subtract = (a, b) => a - b

// 3. 使用具名导入
// Bad - 导入整个模块
import _ from 'lodash'
_.debounce(fn, 300)

// Good - 只导入需要的函数
import debounce from 'lodash/debounce'
debounce(fn, 300)

// 4. 配置 Babel 保留 ES Modules
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false  // 不转换 ES Modules
    }]
  ]
}
```

## 开发服务器与 HMR

### DevServer 完整配置

```javascript
module.exports = {
  devServer: {
    // 基础配置
    host: '0.0.0.0',
    port: 3000,
    open: true,

    // 热模块替换
    hot: true,
    liveReload: true,

    // 静态文件服务
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/assets',
      watch: true
    },

    // 历史模式（SPA 路由）
    historyApiFallback: {
      rewrites: [
        { from: /^\/admin/, to: '/admin.html' },
        { from: /./, to: '/index.html' }
      ]
    },

    // 代理配置
    proxy: [
      {
        context: ['/api', '/auth'],
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        },
        // WebSocket 代理
        ws: true,
        // 自定义处理
        onProxyReq(proxyReq, req, res) {
          proxyReq.setHeader('X-Custom-Header', 'value')
        }
      }
    ],

    // HTTPS 配置
    https: {
      key: fs.readFileSync('./cert/server.key'),
      cert: fs.readFileSync('./cert/server.crt')
    },

    // 压缩响应
    compress: true,

    // 客户端覆盖层
    client: {
      overlay: {
        errors: true,
        warnings: false
      },
      progress: true,
      logging: 'info'
    },

    // 自定义中间件
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.get('/api/mock', (req, res) => {
        res.json({ message: 'Mock data' })
      })
      return middlewares
    },

    // 开发服务器头部
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}
```

### HMR 原理与手动实现

```javascript
// HMR 工作流程
// 1. 文件修改
// 2. Webpack 重新编译修改的模块
// 3. WDS 通过 WebSocket 通知浏览器
// 4. HMR Runtime 下载更新的模块
// 5. HMR Runtime 替换旧模块

// 手动处理 HMR
if (module.hot) {
  // 接受自身更新
  module.hot.accept()

  // 接受依赖更新
  module.hot.accept('./module.js', () => {
    console.log('module.js 已更新')
    // 重新执行相关逻辑
  })

  // 清理副作用
  module.hot.dispose((data) => {
    // 保存状态到 data
    data.savedState = currentState
    // 清理定时器、事件监听等
    clearInterval(timer)
  })

  // 恢复状态
  if (module.hot.data) {
    currentState = module.hot.data.savedState
  }
}

// React 组件 HMR（使用 react-refresh）
// webpack.config.js
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = {
  plugins: [
    new ReactRefreshWebpackPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              require.resolve('react-refresh/babel')
            ]
          }
        }
      }
    ]
  }
}
```

## 生产环境优化

### 完整的生产配置

```javascript
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  mode: 'production',

  // 构建目标
  target: ['web', 'es2015'],

  entry: {
    app: './src/index.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
    publicPath: '/',
    clean: true
  },

  // 优化配置
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          parse: { ecma: 2020 },
          compress: {
            ecma: 2015,
            comparisons: false,
            inline: 2,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.info', 'console.debug']
          },
          mangle: { safari10: true },
          output: {
            ecma: 2015,
            comments: false,
            ascii_only: true
          }
        }
      }),
      new CssMinimizerPlugin({
        parallel: true,
        minimizerOptions: {
          preset: ['default', {
            discardComments: { removeAll: true },
            normalizeWhitespace: true
          }]
        }
      })
    ],

    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        common: {
          minChunks: 2,
          name: 'common',
          chunks: 'all',
          priority: -10
        }
      }
    },

    runtimeChunk: 'single',
    moduleIds: 'deterministic'
  },

  // 性能提示
  performance: {
    hints: 'warning',
    maxEntrypointSize: 250 * 1024,
    maxAssetSize: 250 * 1024
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
    }),

    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css'
    }),

    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8
    }),

    // 作用域提升
    new webpack.optimize.ModuleConcatenationPlugin(),

    // 环境变量
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),

    // 分析报告
    process.env.ANALYZE && new BundleAnalyzerPlugin()
  ].filter(Boolean),

  // 缓存配置
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
}
```

### 构建性能优化

```javascript
const os = require('os')
const TerserPlugin = require('terser-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = {
  // 1. 持久化缓存
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
    buildDependencies: {
      config: [__filename],
      tsconfig: [path.resolve(__dirname, 'tsconfig.json')]
    },
    version: '1.0'
  },

  // 2. 并行处理
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: os.cpus().length - 1
      })
    ]
  },

  // 3. 缩小构建范围
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },

  // 4. 解析优化
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    // 减少解析
    mainFields: ['browser', 'main']
  },

  // 5. TypeScript 类型检查独立进程
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        memoryLimit: 4096,
        diagnosticOptions: {
          semantic: true,
          syntactic: true
        }
      }
    })
  ],

  // 6. Source Map 策略
  devtool: 'source-map',  // 生产环境
  // devtool: 'eval-cheap-module-source-map',  // 开发环境

  // 7. 外部化依赖
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
}
```

## Webpack 5 新特性

### 主要更新

```javascript
// 1. 持久化缓存（Persistent Caching）
module.exports = {
  cache: {
    type: 'filesystem',
    name: 'production-cache',
    version: '1.0',
    cacheDirectory: path.resolve(__dirname, '.temp_cache'),
    buildDependencies: {
      config: [__filename]
    }
  }
}

// 2. 资源模块（Asset Modules）- 替代 file-loader、url-loader
module.exports = {
  module: {
    rules: [
      // asset/resource - 替代 file-loader
      {
        test: /\.png$/,
        type: 'asset/resource'
      },
      // asset/inline - 替代 url-loader
      {
        test: /\.svg$/,
        type: 'asset/inline'
      },
      // asset/source - 替代 raw-loader
      {
        test: /\.txt$/,
        type: 'asset/source'
      },
      // asset - 自动选择
      {
        test: /\.jpg$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024
          }
        }
      }
    ]
  }
}

// 3. 模块联邦（Module Federation）
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app',
      remotes: {
        shared: 'shared@http://localhost:3001/remoteEntry.js'
      },
      exposes: {
        './Button': './src/components/Button'
      },
      shared: ['react', 'react-dom']
    })
  ]
}

// 4. 更好的 Tree Shaking
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: true,
    innerGraph: true,  // 追踪导出的使用
    providedExports: true
  }
}

// 5. 顶层 await 支持
// main.js
const data = await fetch('/api/config').then(r => r.json())
console.log(data)

// webpack.config.js
module.exports = {
  experiments: {
    topLevelAwait: true
  }
}

// 6. 更好的长期缓存
module.exports = {
  optimization: {
    moduleIds: 'deterministic',  // 稳定的模块 ID
    chunkIds: 'deterministic',   // 稳定的 chunk ID
    realContentHash: true         // 真正的内容哈希
  }
}

// 7. 输出 ES6 代码
module.exports = {
  target: ['web', 'es2020'],
  output: {
    module: true,
    chunkFormat: 'module'
  },
  experiments: {
    outputModule: true
  }
}
```

### 迁移注意事项

```javascript
// Webpack 5 移除的特性与替代方案

// 1. Node.js 核心模块 polyfill 不再自动添加
module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      fs: false  // 明确不需要
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ]
}

// 2. 废弃的 loader 配置
// Webpack 4
module.exports = {
  module: {
    rules: [
      {
        test: /\.png$/,
        use: 'file-loader'
      }
    ]
  }
}

// Webpack 5
module.exports = {
  module: {
    rules: [
      {
        test: /\.png$/,
        type: 'asset/resource'
      }
    ]
  }
}

// 3. 插件 API 变化
// Webpack 4
compiler.hooks.emit.tap('MyPlugin', (compilation) => {
  // compilation.assets 是对象
})

// Webpack 5
compiler.hooks.processAssets.tap(
  {
    name: 'MyPlugin',
    stage: Compilation.PROCESS_ASSETS_STAGE_REPORT
  },
  (assets) => {
    // assets 是 Map
  }
)
```

## 面试要点

### 核心概念类

**Q: 解释 Webpack 的核心概念？**

A: Webpack 有五个核心概念：

1. **Entry**：打包入口，Webpack 从这里开始构建依赖图
2. **Output**：输出配置，指定打包文件的位置和命名规则
3. **Loader**：模块转换器，让 Webpack 能处理非 JavaScript 文件
4. **Plugin**：扩展 Webpack 功能，执行更广泛的任务
5. **Mode**：模式配置，决定是开发还是生产环境

**Q: Loader 和 Plugin 的区别？**

A:
- **Loader**：文件转换器，将非 JS 文件转换为 Webpack 能处理的模块。在模块加载时执行，配置在 `module.rules` 中。
- **Plugin**：扩展 Webpack 功能，可以在整个构建流程中注入逻辑。通过钩子机制工作，配置在 `plugins` 数组中。

```javascript
// Loader 示例：处理单个文件
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader']
}

// Plugin 示例：影响整个构建流程
new HtmlWebpackPlugin({ template: './index.html' })
```

### 优化类

**Q: 如何优化 Webpack 构建速度？**

A: 主要从以下几个方面：

```javascript
// 1. 使用缓存
cache: { type: 'filesystem' }

// 2. 缩小构建范围
module: {
  rules: [{
    include: path.resolve('src'),
    exclude: /node_modules/
  }]
}

// 3. 并行处理
new TerserPlugin({ parallel: true })

// 4. 使用 DLL 或 externals
externals: { react: 'React' }

// 5. 合理使用 source-map
devtool: 'eval-cheap-module-source-map'  // 开发环境
```

**Q: 如何优化打包体积？**

A:
1. **代码分割**：使用 `splitChunks` 分离第三方库
2. **Tree Shaking**：移除未使用代码
3. **压缩**：使用 `TerserPlugin` 和 `CssMinimizerPlugin`
4. **按需加载**：使用动态 `import()` 实现懒加载
5. **外部化依赖**：使用 CDN 加载大型库
6. **分析优化**：使用 `BundleAnalyzerPlugin` 分析打包结果

### 原理类

**Q: 解释 Webpack 的构建流程？**

A: Webpack 的构建流程主要分为三个阶段：

1. **初始化阶段**：
   - 读取配置文件
   - 初始化 Compiler 对象
   - 加载所有配置的插件

2. **构建阶段**：
   - 从入口文件开始，调用 Loader 转换模块
   - 解析模块依赖（AST 分析）
   - 递归处理所有依赖，构建依赖图

3. **生成阶段**：
   - 根据依赖图生成 Chunk
   - 对 Chunk 进行优化（分割、合并）
   - 输出最终的打包文件

**Q: 什么是 HMR？原理是什么？**

A: HMR（Hot Module Replacement）热模块替换，允许在运行时更新模块而无需完全刷新页面。

原理：
1. 文件修改后，Webpack 重新编译变更的模块
2. Webpack Dev Server 通过 WebSocket 推送更新通知
3. 浏览器端的 HMR Runtime 请求更新的模块
4. HMR Runtime 替换旧模块，执行回调

```javascript
// 手动处理 HMR
if (module.hot) {
  module.hot.accept('./module', () => {
    // 模块更新后的处理逻辑
  })
}
```

### 实践类

**Q: 如何配置多页面应用？**

```javascript
module.exports = {
  entry: {
    home: './src/pages/home/index.js',
    about: './src/pages/about/index.js',
    contact: './src/pages/contact/index.js'
  },
  output: {
    filename: '[name].[contenthash].js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/home/index.html',
      filename: 'home.html',
      chunks: ['home', 'vendors']
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/about/index.html',
      filename: 'about.html',
      chunks: ['about', 'vendors']
    })
  ]
}
```

**Q: 如何实现按需加载？**

```javascript
// 1. 路由级别懒加载
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))

// 2. 组件级别懒加载
const HeavyComponent = React.lazy(() => import('./HeavyComponent'))

// 3. 使用 magic comments 优化
import(
  /* webpackChunkName: "chart" */
  /* webpackPrefetch: true */
  './ChartLibrary'
)
```

**Q: Webpack 和 Vite 的区别？**

| 特性 | Webpack | Vite |
|------|---------|------|
| 开发模式 | 打包后服务 | 原生 ESM + 按需编译 |
| 冷启动 | 较慢（需要完整打包） | 极快（按需加载） |
| HMR 速度 | 与项目规模相关 | 始终快速 |
| 生产构建 | Webpack | Rollup |
| 生态系统 | 非常成熟 | 快速发展 |
| 配置复杂度 | 较高 | 开箱即用 |

---

## 总结

Webpack 作为前端工程化的核心工具，虽然配置复杂，但其强大的功能和成熟的生态使其在大型项目中仍然不可替代。掌握 Webpack 需要理解以下核心要点：

1. **核心概念**：Entry、Output、Loader、Plugin、Mode 五大核心
2. **模块解析**：理解依赖图的构建过程和模块解析规则
3. **性能优化**：代码分割、Tree Shaking、缓存策略
4. **开发体验**：DevServer、HMR 配置
5. **生产构建**：压缩、代码分割、长期缓存

建议在实际项目中深入使用 Webpack，从基础配置开始，逐步掌握高级特性。同时也要关注 Vite、esbuild 等新工具的发展，它们代表了前端构建工具的未来趋势。无论使用哪种工具，理解构建原理都将帮助你更好地优化应用性能。
