---
title: Rspack Build Tool
description: Deep dive into Rspack - a high-performance Rust-based bundler compatible with webpack ecosystem
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Rspack
  - Bundler
  - Build Tools
  - Rust
  - Webpack
  - Performance
status: imported
origin: old/src/content/docs/frontend/rspack.en.md
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

Rspack is a high-performance JavaScript bundler written in Rust, designed to be a drop-in replacement for webpack while delivering significantly faster build times. Developed by ByteDance, Rspack aims to solve the performance bottlenecks of JavaScript-based bundlers while maintaining full compatibility with the webpack ecosystem.

## Concept Explanation

### What is Rspack?

**Rspack** is a next-generation bundler that leverages the power of Rust to achieve build speeds 5-10x faster than webpack. It maintains a webpack-compatible API, allowing teams to migrate existing projects with minimal configuration changes while enjoying dramatically improved build performance.

```javascript
// rspack.config.js - looks familiar to webpack users
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

The key insight is that Rspack reimplements webpack's core algorithms in Rust while exposing a JavaScript-compatible configuration interface. This hybrid approach delivers the best of both worlds: native performance with ecosystem compatibility.

### History and Evolution

The JavaScript bundler landscape has evolved significantly:

| Era | Technology | Approach |
|-----|------------|----------|
| 2012 | Browserify | First module bundler |
| 2014 | Webpack | Plugin-based bundling |
| 2017 | Parcel | Zero-config bundling |
| 2019 | Snowpack | Unbundled development |
| 2020 | Vite | ESM-based dev server |
| 2021 | esbuild | Go-based bundler |
| 2022 | Turbopack | Rust-based (Vercel) |
| 2023 | Rspack | Rust + webpack compat |
| 2024 | Rspack 1.0 | Production-ready release |

### Rspack vs Other Bundlers

#### Rspack vs Webpack

```javascript
// Webpack - JavaScript-based, slower but mature
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader', // JavaScript transformation
        exclude: /node_modules/
      }
    ]
  }
};

// Rspack - Rust-based, faster with built-in transformations
// rspack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'builtin:swc-loader', // Native Rust transformation
        exclude: /node_modules/
      }
    ]
  }
};
```

#### Rspack vs Vite

```javascript
// Vite - ESM-based, great for development
// vite.config.js
export default {
  build: {
    rollupOptions: {
      // Uses Rollup for production builds
    }
  }
};

// Rspack - Bundle-based, consistent dev/prod behavior
// rspack.config.js
module.exports = {
  // Same bundling approach for dev and production
  // More predictable behavior between environments
};
```

### Key Characteristics of Rspack

1. **Rust Performance**: Core algorithms implemented in Rust for native speed
2. **Webpack Compatibility**: Drop-in replacement for most webpack configurations
3. **Built-in Transformations**: Native SWC support without external loaders
4. **Incremental Compilation**: Efficient caching and partial rebuilds
5. **Tree Shaking**: Advanced dead code elimination
6. **Code Splitting**: Automatic and manual chunk optimization

## Core Principles

### Rust-Powered Architecture

Rspack's performance comes from its Rust implementation. The critical path operations - parsing, transformation, and bundling - all happen in native code:

```
Traditional webpack:
JavaScript -> Parse (JS) -> Transform (JS) -> Bundle (JS) -> Output
     |           |              |               |
     +------------ All in single-threaded JS ---+

Rspack:
JavaScript -> Parse (Rust) -> Transform (Rust) -> Bundle (Rust) -> Output
     |            |               |                |
     +--------- Parallel, native execution --------+
```

### Built-in Loaders

Rspack provides native implementations of common loaders, eliminating JavaScript overhead:

```javascript
// rspack.config.js
module.exports = {
  module: {
    rules: [
      // Built-in SWC loader for JavaScript/TypeScript
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
      // Built-in CSS support
      {
        test: /\.css$/,
        type: 'css'
      },
      // Built-in asset handling
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset'
      }
    ]
  }
};
```

### Incremental Compilation

Rspack uses a sophisticated caching system for fast rebuilds:

```javascript
// rspack.config.js
module.exports = {
  // Persistent caching between builds
  cache: true,

  // Or more detailed configuration
  experiments: {
    incrementalRebuild: {
      make: true,
      emitAssets: true
    }
  }
};
```

The incremental compilation system tracks:
- Module dependencies
- File timestamps
- Content hashes
- Transformation results

### Parallel Processing

Unlike webpack's single-threaded nature, Rspack leverages Rust's concurrency:

```
Module Graph Construction:
┌─────────────────────────────────────────────┐
│ Thread 1: Parse A.js → Transform A.js       │
│ Thread 2: Parse B.js → Transform B.js       │
│ Thread 3: Parse C.js → Transform C.js       │
│ Thread 4: Parse D.js → Transform D.js       │
└─────────────────────────────────────────────┘
                    ↓
           Bundle Assembly
                    ↓
              Output Files
```

## Core Concepts

### Configuration Basics

Rspack configuration mirrors webpack with some enhancements:

```javascript
// rspack.config.js
const path = require('path');

module.exports = {
  // Entry points
  entry: {
    main: './src/index.js',
    vendor: './src/vendor.js'
  },

  // Output configuration
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true
  },

  // Development mode optimizations
  mode: 'development', // or 'production'

  // Source maps
  devtool: 'source-map',

  // Module resolution
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
};
```

### Built-in SWC Loader

The SWC loader is a core feature providing fast JavaScript/TypeScript transformation:

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
            // Source type
            sourceMap: true,

            // JavaScript compiler options
            jsc: {
              // Parser configuration
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: true,
                dynamicImport: true
              },

              // Transformation options
              transform: {
                // React transformation
                react: {
                  runtime: 'automatic',
                  development: process.env.NODE_ENV === 'development',
                  refresh: process.env.NODE_ENV === 'development'
                },

                // Decorator support
                legacyDecorator: true,
                decoratorMetadata: true
              },

              // Target environment
              target: 'es2020',

              // Minification (in production)
              minify: {
                compress: true,
                mangle: true
              }
            },

            // Environment targets
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

### CSS Handling

Rspack has built-in CSS support with multiple modes:

```javascript
// rspack.config.js
module.exports = {
  module: {
    rules: [
      // Native CSS modules
      {
        test: /\.module\.css$/,
        type: 'css/module',
        generator: {
          localIdentName: '[local]--[hash:8]'
        }
      },

      // Regular CSS
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css'
      },

      // Sass/SCSS (requires sass-loader)
      {
        test: /\.scss$/,
        use: ['sass-loader'],
        type: 'css'
      },

      // PostCSS processing
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

  // CSS extraction for production
  experiments: {
    css: true
  }
};
```

### Code Splitting

Rspack supports automatic and manual code splitting:

```javascript
// rspack.config.js
module.exports = {
  optimization: {
    // Enable chunk splitting
    splitChunks: {
      chunks: 'all',

      // Cache groups for vendor splitting
      cacheGroups: {
        // Vendor chunk
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },

        // Common modules chunk
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        },

        // React-specific chunk
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

Dynamic imports work seamlessly:

```javascript
// src/App.jsx
import { lazy, Suspense } from 'react';

// Automatic code splitting with dynamic imports
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// Named chunks with magic comments
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

### Dev Server

Rspack includes a fast development server:

```javascript
// rspack.config.js
module.exports = {
  devServer: {
    port: 3000,
    hot: true,
    open: true,

    // Proxy API requests
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    },

    // History API fallback for SPA
    historyApiFallback: true,

    // Static file serving
    static: {
      directory: './public'
    },

    // Custom middleware
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

## Code Examples

### Complete React Project Setup

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

      // CSS Modules
      {
        test: /\.module\.css$/,
        type: 'css/module'
      },

      // Global CSS
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css'
      },

      // Images
      {
        test: /\.(png|jpg|jpeg|gif|webp)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8KB
          }
        }
      },

      // SVG as React components
      {
        test: /\.svg$/,
        issuer: /\.(ts|tsx|js|jsx)$/,
        use: ['@svgr/webpack']
      },

      // Fonts
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

### Migration from Webpack

```javascript
// Before: webpack.config.js
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

// After: rspack.config.js
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
        use: 'builtin:swc-loader', // Replace babel-loader
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        type: 'css' // Built-in CSS support
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
    css: true // Enable CSS extraction
  }
};
```

### Multi-Environment Configuration

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
              // Only minify in production
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

### Plugin Usage

```javascript
// rspack.config.js
const path = require('path');
const { CopyRspackPlugin } = require('@rspack/plugin-copy');

module.exports = {
  entry: './src/index.js',

  plugins: [
    // Copy static assets
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
    // Built-in HTML plugin
    html: [
      {
        template: './public/index.html',
        filename: 'index.html',
        inject: 'body',
        scriptLoading: 'defer',
        minify: process.env.NODE_ENV === 'production'
      }
    ],

    // Built-in define plugin
    define: {
      'process.env.VERSION': JSON.stringify(require('./package.json').version),
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
    },

    // Built-in progress plugin
    progress: true,

    // Minification configuration
    minifyOptions: {
      dropConsole: process.env.NODE_ENV === 'production'
    }
  }
};
```

## Best Practices

### Optimize Build Performance

```javascript
// rspack.config.js
module.exports = {
  // 1. Use built-in loaders when possible
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader', // Fastest option
        exclude: /node_modules/
      }
    ]
  },

  // 2. Enable persistent caching
  cache: true,

  // 3. Optimize resolve configuration
  resolve: {
    // Limit extensions to check
    extensions: ['.tsx', '.ts', '.jsx', '.js'],

    // Use explicit aliases
    alias: {
      '@': path.resolve(__dirname, 'src')
    },

    // Skip symlink resolution if not needed
    symlinks: false
  },

  // 4. Exclude large directories
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'builtin:swc-loader'
      }
    ]
  },

  // 5. Use appropriate source maps
  devtool: process.env.NODE_ENV === 'production'
    ? 'source-map'  // Full maps for production debugging
    : 'eval-cheap-module-source-map'  // Fast maps for development
};
```

### Efficient Code Splitting

```javascript
// rspack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',

      // Size thresholds
      minSize: 20000,      // 20KB minimum chunk size
      maxSize: 244000,     // 244KB maximum chunk size

      // Chunk naming
      name: (module, chunks, cacheGroupKey) => {
        const allChunksNames = chunks.map(c => c.name).join('~');
        return `${cacheGroupKey}-${allChunksNames}`;
      },

      cacheGroups: {
        // Critical vendor code
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'framework',
          priority: 40,
          enforce: true
        },

        // Large libraries
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

        // Shared modules
        common: {
          minChunks: 2,
          priority: 20,
          reuseExistingChunk: true
        }
      }
    },

    // Separate runtime code
    runtimeChunk: {
      name: 'runtime'
    }
  }
};
```

### Environment-Specific Configuration

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

## Common Pitfalls

### Loader Compatibility Issues

```javascript
// Problem: Using webpack-specific loader features
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'some-webpack-loader',
          options: {
            // Webpack-specific options may not work
            webpackSpecificOption: true
          }
        }
      }
    ]
  }
};

// Solution: Use built-in loaders or verified compatible loaders
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            // SWC options are well-documented and supported
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

### Plugin Compatibility

```javascript
// Problem: Assuming all webpack plugins work
const SomeWebpackPlugin = require('some-webpack-plugin');

module.exports = {
  plugins: [
    new SomeWebpackPlugin() // May not be compatible
  ]
};

// Solution: Check compatibility or use built-in alternatives
module.exports = {
  // Use built-in features when available
  builtins: {
    html: [{ template: './index.html' }],
    define: { __VERSION__: JSON.stringify('1.0.0') }
  },

  // Only use verified compatible plugins
  plugins: [
    // Check rspack documentation for compatibility
  ]
};
```

### CSS Processing Differences

```javascript
// Problem: Expecting identical CSS processing to webpack
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'] // webpack style
      }
    ]
  }
};

// Solution: Use Rspack's built-in CSS handling
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        type: 'css' // Built-in CSS support
      },
      {
        test: /\.module\.css$/,
        type: 'css/module' // CSS Modules support
      }
    ]
  },
  experiments: {
    css: true // Enable CSS extraction
  }
};
```

### Hot Module Replacement

```javascript
// Problem: HMR not working correctly
module.exports = {
  devServer: {
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader'
        // Missing React Refresh configuration
      }
    ]
  }
};

// Solution: Enable React Refresh properly
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
                  refresh: true // Enable React Refresh
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
      refresh: true // Also enable at builtins level
    }
  }
};
```

## Performance Considerations

### Build Time Comparison

```
Benchmark: Large React Application (500+ components)

                  Cold Build    Incremental    Memory Usage
Webpack 5         45s           8s             1.2GB
Vite              12s           0.3s           400MB
esbuild           3s            0.1s           200MB
Rspack            5s            0.5s           300MB

Notes:
- Rspack is 9x faster than webpack for cold builds
- Maintains webpack compatibility unlike esbuild
- Faster incremental builds than webpack
```

### Memory Optimization

```javascript
// rspack.config.js
module.exports = {
  // Limit parallelism if memory is constrained
  experiments: {
    parallelism: 4 // Reduce from default based on available memory
  },

  // Optimize caching strategy
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },

  // Reduce source map memory usage
  devtool: process.env.NODE_ENV === 'production'
    ? false  // Disable in CI if not needed
    : 'eval-cheap-source-map'
};
```

### Production Optimization

```javascript
// rspack.config.js
module.exports = {
  mode: 'production',

  optimization: {
    minimize: true,

    // Tree shaking
    usedExports: true,
    sideEffects: true,

    // Module concatenation
    concatenateModules: true,

    // Chunk optimization
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

  // Minification with SWC
  builtins: {
    minifyOptions: {
      dropConsole: true,
      dropDebugger: true,
      passes: 2
    }
  }
};
```

## Real-World Scenarios

### Large-Scale Application Migration

```javascript
// Step 1: Audit current webpack config
// Identify custom loaders and plugins

// Step 2: Create rspack.config.js with equivalent settings
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
      // Migrate existing aliases
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks')
    }
  },

  module: {
    rules: [
      // Replace babel-loader with builtin:swc-loader
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

      // Migrate CSS configuration
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

// Step 3: Run parallel builds during migration
// package.json
{
  "scripts": {
    "build:webpack": "webpack --config webpack.config.js",
    "build:rspack": "rspack --config rspack.config.js",
    "build:compare": "npm run build:webpack && npm run build:rspack"
  }
}
```

### Monorepo Configuration

```javascript
// packages/app/rspack.config.js
const path = require('path');

module.exports = {
  entry: './src/index.tsx',

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Reference shared packages
      '@shared/ui': path.resolve(__dirname, '../shared-ui/src'),
      '@shared/utils': path.resolve(__dirname, '../shared-utils/src')
    }
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader',
        // Include shared packages for transformation
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

### Micro-Frontend Setup

```javascript
// rspack.config.js for Module Federation
module.exports = {
  entry: './src/index.tsx',

  builtins: {
    // Module Federation configuration
    moduleFederation: {
      name: 'app',
      filename: 'remoteEntry.js',

      // Expose modules
      exposes: {
        './Button': './src/components/Button',
        './Header': './src/components/Header'
      },

      // Consume remote modules
      remotes: {
        shared: 'shared@http://localhost:3001/remoteEntry.js'
      },

      // Shared dependencies
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

## Interview Key Points

### Core Concepts

**Q1: What is Rspack and how does it differ from webpack?**

Rspack is a Rust-based JavaScript bundler designed as a drop-in replacement for webpack:

1. **Performance**: 5-10x faster builds due to Rust implementation
2. **Compatibility**: Maintains webpack API compatibility for easy migration
3. **Built-in Features**: Native SWC integration, CSS handling without extra plugins
4. **Parallelization**: Leverages Rust's concurrent processing capabilities

**Q2: Why is Rspack faster than webpack?**

1. **Rust Performance**: Native code execution vs JavaScript interpretation
2. **Parallel Processing**: Multi-threaded parsing and transformation
3. **Built-in Loaders**: No JavaScript overhead for common transformations
4. **Efficient Caching**: Persistent cache with smart invalidation
5. **Optimized Algorithms**: Rust implementations of dependency resolution and bundling

**Q3: When should you choose Rspack over Vite or esbuild?**

Choose Rspack when:
- Migrating from webpack with complex configurations
- Needing webpack plugin compatibility
- Wanting consistent dev/prod bundling behavior
- Working with large codebases requiring fast builds

Choose Vite when:
- Starting new projects with simpler requirements
- Preferring unbundled development experience
- Using frameworks with first-class Vite support

Choose esbuild when:
- Maximum build speed is priority
- Simple bundling requirements
- Building libraries

### Practical Questions

**Q4: How do you migrate from webpack to Rspack?**

1. Install Rspack: `npm install @rspack/cli @rspack/core`
2. Rename `webpack.config.js` to `rspack.config.js`
3. Replace `babel-loader` with `builtin:swc-loader`
4. Replace CSS loaders with built-in `type: 'css'`
5. Replace HtmlWebpackPlugin with `builtins.html`
6. Test build output for equivalence
7. Gradually migrate custom plugins

**Q5: How do you optimize Rspack build performance?**

```javascript
module.exports = {
  // Use built-in loaders
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'builtin:swc-loader'
    }]
  },

  // Enable caching
  cache: true,

  // Optimize resolve
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    symlinks: false
  },

  // Appropriate source maps
  devtool: 'eval-cheap-module-source-map'
};
```

## Further Reading

### Official Documentation

- [Rspack Documentation](https://rspack.dev/) - Official documentation and guides
- [Rspack GitHub Repository](https://github.com/web-infra-dev/rspack) - Source code and issues
- [Rspack Migration Guide](https://rspack.dev/guide/migrate-from-webpack) - Webpack migration documentation

### Related Tools

- [SWC Documentation](https://swc.rs/) - The Rust-based JavaScript compiler used by Rspack
- [webpack Documentation](https://webpack.js.org/) - For understanding webpack compatibility
- [Rsbuild](https://rsbuild.dev/) - Higher-level build tool built on Rspack

### Performance Resources

- [Rspack Benchmark](https://github.com/web-infra-dev/rspack/tree/main/benchmarks) - Official benchmarks
- [JavaScript Bundler Comparison](https://bundlers.tooling.report/) - Cross-bundler feature comparison

### Community Resources

- [Rspack Discord](https://discord.gg/rspack) - Community discussions
- [ByteDance Engineering Blog](https://blog.bytedance.com/) - Technical articles from the Rspack team

---

Rspack represents a significant advancement in the JavaScript build tool ecosystem, offering webpack compatibility with Rust-powered performance. By understanding its architecture, configuration options, and migration strategies, teams can dramatically improve their build times while maintaining their existing development workflows. As the tool continues to mature, it's becoming an increasingly attractive option for projects that have outgrown webpack's performance limitations.
