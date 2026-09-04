---
title: Webpack Complete Guide
description: Master Webpack module bundler for frontend builds
track: frontend
section: build-tools
difficulty: advanced
tags:
  - Webpack
  - Bundler
  - Build Tool
  - Module
status: imported
origin: old/src/content/docs/frontend/webpack.en.md
divergence: 0.182
issues: []
legacy:
  category: Frontend
  subcategory: Build Tools
  order: 24
  lastUpdated: 2026-01-07
---

Webpack is one of the most essential module bundlers in modern frontend development. It treats various resources (JavaScript, CSS, images, etc.) as modules, analyzes their dependencies, and bundles them into static assets optimized for browser loading. This comprehensive guide covers Webpack's core concepts, configuration techniques, and production optimization strategies.

## Core Concepts

### Entry

Entry is the starting point where Webpack begins building its dependency graph. Webpack recursively constructs a dependency graph from the entry file, then bundles all dependencies into the output.

```javascript
// webpack.config.js

// Single entry configuration
module.exports = {
  entry: './src/index.js'
}

// Multiple entry configuration
module.exports = {
  entry: {
    app: './src/app.js',
    admin: './src/admin.js',
    vendor: ['react', 'react-dom', 'lodash']
  }
}

// Dynamic entry configuration
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

**Entry Configuration Best Practices**:

| Scenario | Configuration | Description |
|----------|---------------|-------------|
| Single Page App | String | One entry file |
| Multi-Page App | Object | Multiple entries, one per page |
| Vendor Separation | Array/Object | Extract common dependencies |

### Output

Output configuration tells Webpack where to emit the bundled files and how to name them.

```javascript
const path = require('path')

module.exports = {
  entry: {
    app: './src/app.js',
    admin: './src/admin.js'
  },
  output: {
    // Output directory (absolute path)
    path: path.resolve(__dirname, 'dist'),

    // Output filename (supports placeholders)
    filename: '[name].[contenthash:8].js',

    // Non-entry chunk filename
    chunkFilename: '[name].[contenthash:8].chunk.js',

    // Public path for assets
    publicPath: '/assets/',

    // Clean output directory before emit
    clean: true,

    // Library export configuration
    library: {
      name: 'MyLibrary',
      type: 'umd',
      export: 'default'
    }
  }
}
```

**Common Placeholders**:

| Placeholder | Description |
|-------------|-------------|
| `[name]` | Entry name |
| `[id]` | Chunk ID |
| `[hash]` | Compilation hash |
| `[chunkhash]` | Chunk content hash |
| `[contenthash]` | File content hash (recommended) |
| `[ext]` | Resource extension |

### Mode

The mode configuration option tells Webpack to use its built-in optimizations for either development or production environments.

```javascript
module.exports = {
  mode: 'development' // or 'production' or 'none'
}
```

| Mode | Optimizations |
|------|---------------|
| `development` | Faster builds, detailed error messages, source maps |
| `production` | Minification, tree shaking, scope hoisting |
| `none` | No optimizations applied |

## Loaders: Transforming Non-JavaScript Files

Webpack natively only understands JavaScript and JSON files. Loaders allow Webpack to process other types of files and convert them into valid modules.

### How Loaders Work

Loaders are transformations applied to the source code of a module. They transform files from a different language (like TypeScript) to JavaScript, or inline images as data URLs. Loaders execute from right to left (or bottom to top).

```javascript
module.exports = {
  module: {
    rules: [
      // Babel for JavaScript
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

      // TypeScript processing
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },

      // CSS processing chain
      {
        test: /\.css$/,
        use: [
          'style-loader',      // Injects CSS into DOM
          'css-loader',        // Resolves CSS imports
          'postcss-loader'     // PostCSS processing
        ]
      },

      // SCSS processing
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

      // Image assets
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024  // 8KB or less becomes base64
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      },

      // Font files
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

**Loader Execution Order**: Loaders execute from right to left, bottom to top. For example, when processing SCSS files, the execution order is: `sass-loader` -> `postcss-loader` -> `css-loader` -> `style-loader`.

### JavaScript and TypeScript Processing

```javascript
module.exports = {
  module: {
    rules: [
      // Babel configuration
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

      // TypeScript configuration
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,  // Type checking delegated to fork-ts-checker
              happyPackMode: true
            }
          }
        ]
      }
    ]
  }
}
```

### Complete CSS Processing Configuration

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
      // Regular CSS
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

### Asset Modules (Webpack 5)

Webpack 5 introduced Asset Modules, which replace the need for `file-loader`, `url-loader`, and `raw-loader`:

```javascript
module.exports = {
  module: {
    rules: [
      // Image processing
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

      // SVG special handling
      {
        test: /\.svg$/,
        oneOf: [
          // Import as React component
          {
            issuer: /\.[jt]sx?$/,
            resourceQuery: /react/,  // import Icon from './icon.svg?react'
            use: ['@svgr/webpack']
          },
          // Import as URL
          {
            type: 'asset',
            generator: {
              filename: 'images/[name].[contenthash:8][ext]'
            }
          }
        ]
      },

      // Font files
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]'
        }
      },

      // Video/Audio
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

| Asset Module Type | Replaces | Description |
|-------------------|----------|-------------|
| `asset/resource` | file-loader | Emits separate file, returns URL |
| `asset/inline` | url-loader | Inlines as data URI |
| `asset/source` | raw-loader | Returns source code as string |
| `asset` | url-loader with size limit | Auto-chooses based on file size |

## Plugins: Extending Webpack Functionality

Plugins perform a wider range of tasks than loaders, including bundle optimization, asset management, and environment variable injection.

### Core Plugin Configuration

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
    // Clean output directory
    new CleanWebpackPlugin(),

    // Generate HTML
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      title: 'My Application',
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

    // Extract CSS
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css'
    }),

    // Environment variables
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        API_URL: JSON.stringify(process.env.API_URL)
      }
    }),

    // TypeScript type checking (separate process)
    new ForkTsCheckerWebpackPlugin({
      async: false,
      typescript: {
        configFile: './tsconfig.json'
      }
    }),

    // ESLint checking
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
      emitWarning: true,
      emitError: true,
      failOnError: false
    }),

    // Copy static assets
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

    // Compilation progress
    new webpack.ProgressPlugin()
  ],

  // Optimization configuration
  optimization: {
    minimizer: [
      // JavaScript minification
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

      // CSS minification
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

### Development Environment Plugins

```javascript
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  plugins: [
    // React Fast Refresh
    new ReactRefreshWebpackPlugin({
      overlay: {
        sockIntegration: 'wds'
      }
    }),

    // Hot Module Replacement
    new webpack.HotModuleReplacementPlugin()
  ]
}
```

### Production Environment Plugins

```javascript
const CompressionPlugin = require('compression-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const WorkboxPlugin = require('workbox-webpack-plugin')

module.exports = {
  mode: 'production',
  plugins: [
    // Gzip compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8
    }),

    // Brotli compression
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
      filename: '[path][base].br'
    }),

    // Bundle analysis
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false
    }),

    // PWA support
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

## Code Splitting and Lazy Loading

Code splitting is one of the most compelling features of Webpack. It allows you to split your code into various bundles that can be loaded on demand or in parallel.

### SplitChunksPlugin Configuration

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',  // Split all chunks
      minSize: 20000, // Minimum chunk size
      minRemainingSize: 0,
      minChunks: 1,   // Minimum times a module must be shared
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,

      cacheGroups: {
        // Third-party libraries
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          reuseExistingChunk: true
        },

        // React related
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          priority: 20,
          chunks: 'all'
        },

        // UI component libraries
        antd: {
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          name: 'antd',
          priority: 15,
          chunks: 'all'
        },

        // Utility libraries
        utils: {
          test: /[\\/]node_modules[\\/](lodash|moment|dayjs)[\\/]/,
          name: 'utils',
          priority: 10
        },

        // Common modules
        common: {
          minChunks: 2,
          name: 'common',
          priority: -20,
          reuseExistingChunk: true
        }
      }
    },

    // Extract runtime code
    runtimeChunk: {
      name: 'runtime'
    }
  }
}
```

### Dynamic Imports and Lazy Loading

```javascript
// Basic dynamic import
const loadModule = async () => {
  const module = await import('./heavy-module.js')
  module.doSomething()
}

// React component lazy loading
import React, { Suspense, lazy } from 'react'

// Use webpackChunkName to specify chunk name
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

### Prefetching and Preloading

Webpack supports resource hints to tell the browser about resources that will be needed:

```javascript
// webpackPrefetch: Load during browser idle time (may be needed in future)
// webpackPreload: Load in parallel with parent chunk (needed for current navigation)

// Prefetch example
button.addEventListener('click', async () => {
  const { Modal } = await import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "modal" */
    './components/Modal'
  )
  Modal.show()
})

// Preload example
import(
  /* webpackPreload: true */
  /* webpackChunkName: "critical-styles" */
  './critical-styles.css'
)
```

| Resource Hint | When Loaded | Use Case |
|---------------|-------------|----------|
| Prefetch | During idle time | Resources for next navigation |
| Preload | Parallel with parent | Critical resources for current page |

## Tree Shaking

Tree shaking is a technique used to eliminate dead code. It relies on the static structure of ES Modules.

### How Tree Shaking Works

```javascript
// utils.js - Exports multiple functions
export const add = (a, b) => a + b
export const subtract = (a, b) => a - b
export const multiply = (a, b) => a * b
export const divide = (a, b) => a / b

// index.js - Only uses add
import { add } from './utils'
console.log(add(1, 2))

// After tree shaking, subtract, multiply, and divide are removed
```

### Configuration for Tree Shaking

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',  // Automatically enabled in production

  optimization: {
    usedExports: true,      // Mark unused exports
    minimize: true,          // Enable minification
    sideEffects: true,       // Enable side effects analysis

    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            dead_code: true,      // Remove dead code
            unused: true,         // Remove unused variables
            pure_funcs: ['console.log']  // Remove specific function calls
          }
        }
      })
    ]
  }
}
```

### sideEffects Configuration

The `sideEffects` flag in package.json helps Webpack identify pure modules:

```json
// package.json
{
  "name": "my-package",
  "sideEffects": false
}

// Or specify files with side effects
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}
```

### Best Practices for Effective Tree Shaking

```javascript
// 1. Use ES Modules syntax
// Bad - CommonJS
const { debounce } = require('lodash')

// Good - ES Modules
import { debounce } from 'lodash-es'

// 2. Avoid default export of entire objects
// Bad
export default {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
}

// Good
export const add = (a, b) => a + b
export const subtract = (a, b) => a - b

// 3. Use named imports
// Bad - Imports entire module
import _ from 'lodash'
_.debounce(fn, 300)

// Good - Only imports what is needed
import debounce from 'lodash/debounce'
debounce(fn, 300)

// 4. Configure Babel to preserve ES Modules
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false  // Do not transform ES Modules
    }]
  ]
}
```

## Development Server and Hot Module Replacement

### Complete DevServer Configuration

```javascript
module.exports = {
  devServer: {
    // Basic configuration
    host: '0.0.0.0',
    port: 3000,
    open: true,

    // Hot Module Replacement
    hot: true,
    liveReload: true,

    // Static file serving
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/assets',
      watch: true
    },

    // History API fallback (SPA routing)
    historyApiFallback: {
      rewrites: [
        { from: /^\/admin/, to: '/admin.html' },
        { from: /./, to: '/index.html' }
      ]
    },

    // Proxy configuration
    proxy: [
      {
        context: ['/api', '/auth'],
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        },
        // WebSocket proxy
        ws: true,
        // Custom request handling
        onProxyReq(proxyReq, req, res) {
          proxyReq.setHeader('X-Custom-Header', 'value')
        }
      }
    ],

    // HTTPS configuration
    https: {
      key: fs.readFileSync('./cert/server.key'),
      cert: fs.readFileSync('./cert/server.crt')
    },

    // Response compression
    compress: true,

    // Client overlay
    client: {
      overlay: {
        errors: true,
        warnings: false
      },
      progress: true,
      logging: 'info'
    },

    // Custom middleware
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.get('/api/mock', (req, res) => {
        res.json({ message: 'Mock data' })
      })
      return middlewares
    },

    // Dev server headers
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}
```

### HMR Workflow and Manual Implementation

Understanding how Hot Module Replacement works:

```
1. File modification detected
   |
2. Webpack recompiles modified module
   |
3. WDS notifies browser via WebSocket
   |
4. HMR Runtime downloads updated module
   |
5. HMR Runtime replaces old module
```

```javascript
// Manual HMR handling
if (module.hot) {
  // Accept self updates
  module.hot.accept()

  // Accept dependency updates
  module.hot.accept('./module.js', () => {
    console.log('module.js has been updated')
    // Re-execute related logic
  })

  // Cleanup side effects
  module.hot.dispose((data) => {
    // Save state to data
    data.savedState = currentState
    // Clear timers, event listeners, etc.
    clearInterval(timer)
  })

  // Restore state
  if (module.hot.data) {
    currentState = module.hot.data.savedState
  }
}

// React component HMR (using react-refresh)
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

## Production Optimization

### Complete Production Configuration

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

  // Build target
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

  // Optimization configuration
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

  // Performance hints
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

    // Scope hoisting
    new webpack.optimize.ModuleConcatenationPlugin(),

    // Environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),

    // Bundle analysis (conditional)
    process.env.ANALYZE && new BundleAnalyzerPlugin()
  ].filter(Boolean),

  // Cache configuration
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
}
```

### Build Performance Optimization

```javascript
const os = require('os')
const TerserPlugin = require('terser-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = {
  // 1. Persistent caching
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
    buildDependencies: {
      config: [__filename],
      tsconfig: [path.resolve(__dirname, 'tsconfig.json')]
    },
    version: '1.0'
  },

  // 2. Parallel processing
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: os.cpus().length - 1
      })
    ]
  },

  // 3. Narrow build scope
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

  // 4. Resolution optimization
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    // Reduce resolution
    mainFields: ['browser', 'main']
  },

  // 5. TypeScript type checking in separate process
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

  // 6. Source Map strategy
  devtool: 'source-map',  // Production
  // devtool: 'eval-cheap-module-source-map',  // Development

  // 7. Externalize dependencies
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
}
```

## Module Resolution and Dependency Graph

### Module Resolution Configuration

Webpack uses the enhanced-resolve library to resolve module paths. Understanding resolution rules is crucial for debugging and optimization.

```javascript
module.exports = {
  resolve: {
    // Module lookup directories
    modules: ['node_modules', 'src'],

    // Alias configuration
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      // Exact match
      'react$': path.resolve(__dirname, 'node_modules/react')
    },

    // Auto-resolved extensions
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],

    // Main file names
    mainFiles: ['index'],

    // package.json field priority
    mainFields: ['browser', 'module', 'main'],

    // Symlink resolution
    symlinks: true,

    // Cache configuration
    cache: true,

    // Additional resolver plugins
    plugins: []
  },

  // External dependencies
  externals: {
    jquery: 'jQuery',
    lodash: '_'
  }
}
```

### Dependency Graph Building Process

```
1. Start from entry file
   |
2. Resolve module path (resolve)
   |
3. Load module content (loader processing)
   |
4. Parse module dependencies (AST analysis of import/require)
   |
5. Recursively process dependencies
   |
6. Generate complete dependency graph
   |
7. Create chunks based on dependency graph
   |
8. Output bundled files
```

## Webpack 5 Features

### Major Updates in Webpack 5

```javascript
// 1. Persistent Caching
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

// 2. Asset Modules - Replaces file-loader, url-loader
module.exports = {
  module: {
    rules: [
      // asset/resource - Replaces file-loader
      {
        test: /\.png$/,
        type: 'asset/resource'
      },
      // asset/inline - Replaces url-loader
      {
        test: /\.svg$/,
        type: 'asset/inline'
      },
      // asset/source - Replaces raw-loader
      {
        test: /\.txt$/,
        type: 'asset/source'
      },
      // asset - Auto-select
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

// 3. Module Federation
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

// 4. Better Tree Shaking
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: true,
    innerGraph: true,  // Track export usage
    providedExports: true
  }
}

// 5. Top-level await support
// main.js
const data = await fetch('/api/config').then(r => r.json())
console.log(data)

// webpack.config.js
module.exports = {
  experiments: {
    topLevelAwait: true
  }
}

// 6. Better long-term caching
module.exports = {
  optimization: {
    moduleIds: 'deterministic',  // Stable module IDs
    chunkIds: 'deterministic',   // Stable chunk IDs
    realContentHash: true         // True content hash
  }
}

// 7. Output ES6 code
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

### Migration Considerations

```javascript
// Webpack 5 removed features and replacements

// 1. Node.js core module polyfills no longer auto-added
module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      fs: false  // Explicitly not needed
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ]
}

// 2. Deprecated loader configuration
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

// 3. Plugin API changes
// Webpack 4
compiler.hooks.emit.tap('MyPlugin', (compilation) => {
  // compilation.assets is an object
})

// Webpack 5
compiler.hooks.processAssets.tap(
  {
    name: 'MyPlugin',
    stage: Compilation.PROCESS_ASSETS_STAGE_REPORT
  },
  (assets) => {
    // assets is a Map
  }
)
```

## Module Federation

Module Federation, introduced in Webpack 5, allows sharing code between different builds at runtime.

```javascript
// Host application webpack.config.js
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

// Remote application webpack.config.js
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

// Using remote modules in host
const RemoteButton = React.lazy(() => import('app1/Button'))

function App() {
  return (
    <Suspense fallback="Loading...">
      <RemoteButton />
    </Suspense>
  )
}
```

## Interview Key Points

### Core Concept Questions

**Q: Explain Webpack's core concepts?**

A: Webpack has five core concepts:

1. **Entry**: The starting point where Webpack begins building its dependency graph
2. **Output**: Configuration specifying where to output bundled files and how to name them
3. **Loader**: Module transformers that allow Webpack to process non-JavaScript files
4. **Plugin**: Extensions that perform broader tasks like bundle optimization and asset management
5. **Mode**: Configuration determining development or production environment optimizations

**Q: What is the difference between Loader and Plugin?**

A:
- **Loader**: File transformer that converts non-JS files into modules Webpack can process. Executes during module loading, configured in `module.rules`.
- **Plugin**: Extends Webpack functionality and can inject logic throughout the build process. Works through the hook system, configured in `plugins` array.

```javascript
// Loader example: Processes single file
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader']
}

// Plugin example: Affects entire build process
new HtmlWebpackPlugin({ template: './index.html' })
```

### Optimization Questions

**Q: How do you optimize Webpack build speed?**

A: Main approaches include:

```javascript
// 1. Use caching
cache: { type: 'filesystem' }

// 2. Narrow build scope
module: {
  rules: [{
    include: path.resolve('src'),
    exclude: /node_modules/
  }]
}

// 3. Parallel processing
new TerserPlugin({ parallel: true })

// 4. Use DLL or externals
externals: { react: 'React' }

// 5. Appropriate source-map usage
devtool: 'eval-cheap-module-source-map'  // Development
```

**Q: How do you optimize bundle size?**

A:
1. **Code splitting**: Use `splitChunks` to separate third-party libraries
2. **Tree shaking**: Remove unused code
3. **Minification**: Use `TerserPlugin` and `CssMinimizerPlugin`
4. **Lazy loading**: Use dynamic `import()` for on-demand loading
5. **Externalize dependencies**: Load large libraries from CDN
6. **Analysis and optimization**: Use `BundleAnalyzerPlugin` to analyze bundle composition

### Principle Questions

**Q: Explain Webpack's build process?**

A: Webpack's build process has three main phases:

1. **Initialization Phase**:
   - Read configuration file
   - Initialize Compiler object
   - Load all configured plugins

2. **Build Phase**:
   - Start from entry files, call Loaders to transform modules
   - Parse module dependencies (AST analysis)
   - Recursively process all dependencies, build dependency graph

3. **Generation Phase**:
   - Generate Chunks based on dependency graph
   - Optimize Chunks (splitting, merging)
   - Output final bundled files

**Q: What is HMR? How does it work?**

A: HMR (Hot Module Replacement) allows updating modules at runtime without a full page refresh.

Workflow:
1. File modification triggers Webpack to recompile the changed module
2. Webpack Dev Server pushes update notification via WebSocket
3. Browser-side HMR Runtime requests updated module
4. HMR Runtime replaces old module and executes callbacks

```javascript
// Manual HMR handling
if (module.hot) {
  module.hot.accept('./module', () => {
    // Handle module update logic
  })
}
```

### Practical Questions

**Q: How do you configure a multi-page application?**

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

**Q: How do you implement lazy loading?**

```javascript
// 1. Route-level lazy loading
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))

// 2. Component-level lazy loading
const HeavyComponent = React.lazy(() => import('./HeavyComponent'))

// 3. Use magic comments for optimization
import(
  /* webpackChunkName: "chart" */
  /* webpackPrefetch: true */
  './ChartLibrary'
)
```

**Q: What are the differences between Webpack and Vite?**

| Feature | Webpack | Vite |
|---------|---------|------|
| Development mode | Bundle then serve | Native ESM + on-demand compilation |
| Cold start | Slow (requires full bundling) | Extremely fast (on-demand loading) |
| HMR speed | Scales with project size | Consistently fast |
| Production build | Webpack | Rollup |
| Ecosystem | Very mature | Rapidly growing |
| Configuration complexity | Higher | Out of box |

## Summary

Webpack remains an indispensable tool in frontend engineering, particularly for large-scale projects. Despite its configuration complexity, its powerful features and mature ecosystem make it the go-to choice for enterprise applications. Mastering Webpack requires understanding these core areas:

1. **Core Concepts**: Entry, Output, Loader, Plugin, and Mode
2. **Module Resolution**: Understanding dependency graph construction and resolution rules
3. **Performance Optimization**: Code splitting, tree shaking, and caching strategies
4. **Development Experience**: DevServer and HMR configuration
5. **Production Builds**: Minification, code splitting, and long-term caching

We recommend gaining hands-on experience with Webpack in real projects, starting from basic configurations and gradually learning advanced features. Meanwhile, stay informed about newer tools like Vite and esbuild, as they represent the future direction of frontend build tools. Regardless of which tool you use, understanding build principles helps you optimize application performance.

## Further Reading

### Official Resources

- [Webpack Official Documentation](https://webpack.js.org/) - Complete configuration reference and guides
- [Webpack GitHub Repository](https://github.com/webpack/webpack) - Source code and issue discussions

### Related Tools

- **webpack-bundle-analyzer**: Visualize bundle composition
- **speed-measure-webpack-plugin**: Measure build time
- **Vite**: Next-generation frontend build tool
- **esbuild**: Extremely fast JavaScript bundler

### Advanced Topics

- Writing custom Webpack plugins
- Understanding the Tapable plugin system
- Implementing custom loaders
- Advanced Module Federation patterns
- Micro-frontend architectures with Webpack
