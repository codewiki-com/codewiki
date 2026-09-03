---
title: Express.js Complete Guide
description: Master Express.js for building robust Node.js web applications
track: javascript
section: node
difficulty: beginner
tags:
  - Express
  - Node.js
  - REST API
  - Middleware
status: imported
origin: old/src/content/docs/backend/expressjs-guide.zh.md
divergence: 0.214
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Backend
  subcategory: Node.js
  order: 2
  lastUpdated: 2026-01-07
---

## 概念概述

Express.js 是一个快速、无约束、极简的 Node.js Web 应用框架。作为 Node.js 生态系统中最流行的后端框架之一，Express 提供了一套简洁而强大的工具，用于构建 Web 应用程序和 RESTful API。

### 为什么选择 Express.js？

Express.js 遵循"极简主义"（无约束）的设计理念，这意味着它不会强制开发者遵循特定的项目结构或设计模式。这种灵活性允许开发者根据项目需求自由组织代码，同时保持框架的轻量级特性。

Express 的核心优势包括：

- **易于学习**：直观的 API 设计，学习曲线平缓
- **高度可扩展**：通过中间件机制进行功能扩展
- **丰富的生态系统**：大量第三方中间件和插件可供选择
- **活跃的社区**：广泛的社区支持和丰富的学习资源
- **卓越的性能**：基于 Node.js 的异步非阻塞 I/O 模型

### 安装与配置

在开始使用 Express 之前，请确保已安装 Node.js。然后创建一个新项目：

```bash
# 创建项目目录
mkdir my-express-app
cd my-express-app

# 初始化 package.json
npm init -y

# 安装 Express
npm install express
```

## Express 基础

### 创建你的第一个应用

创建 Express 应用的第一步是实例化应用对象：

```javascript
const express = require('express');
const app = express();

// 定义一个简单的路由
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

### 应用配置

Express 提供了多种方法来配置你的应用：

```javascript
const express = require('express');
const app = express();

// 应用设置
app.set('view engine', 'pug');        // 设置模板引擎
app.set('views', './views');           // 设置视图目录
app.set('case sensitive routing', true); // 启用大小写敏感路由
app.set('strict routing', true);       // 启用严格路由

// 环境特定配置
if (app.get('env') === 'development') {
  app.set('json spaces', 2); // 在开发环境中格式化 JSON 输出
}

// 出于安全考虑禁用 X-Powered-By 头
app.disable('x-powered-by');
```

## 路由

路由是指应用程序如何响应特定端点的客户端请求。每个路由可以有一个或多个处理函数，当路由匹配时执行。

### 基本路由定义

```javascript
// GET 请求
app.get('/', (req, res) => {
  res.send('Welcome to the homepage');
});

// POST 请求
app.post('/users', (req, res) => {
  res.json({ message: 'User created successfully' });
});

// PUT 请求
app.put('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} updated successfully` });
});

// DELETE 请求
app.delete('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} deleted successfully` });
});

// PATCH 请求
app.patch('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} partially updated` });
});

// 处理所有 HTTP 方法
app.all('/secret', (req, res, next) => {
  console.log('Accessing the secret section...');
  next(); // 将控制权传递给下一个处理程序
});
```

### 路由参数

```javascript
// 单个参数
app.get('/users/:userId', (req, res) => {
  res.send(`User ID: ${req.params.userId}`);
});

// 多个参数
app.get('/users/:userId/books/:bookId', (req, res) => {
  res.json({
    userId: req.params.userId,
    bookId: req.params.bookId
  });
});

// 可选参数（使用正则表达式）
app.get('/users/:userId?', (req, res) => {
  if (req.params.userId) {
    res.send(`User ID: ${req.params.userId}`);
  } else {
    res.send('User list');
  }
});

// 带模式约束的路由参数
app.get('/users/:userId(\\d+)', (req, res) => {
  // 仅匹配数字用户 ID
  res.send(`Numeric User ID: ${req.params.userId}`);
});
```

### 使用 Express Router 实现模块化路由

将路由组织到单独的模块中可以提高代码的可维护性：

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

// 此路由器特定的中间件
router.use((req, res, next) => {
  console.log('User route accessed:', Date.now());
  next();
});

// 用户列表
router.get('/', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]);
});

// 获取单个用户
router.get('/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'User' });
});

// 创建用户
router.post('/', (req, res) => {
  res.status(201).json({ id: 3, name: req.body.name });
});

// 更新用户
router.put('/:id', (req, res) => {
  res.json({ id: req.params.id, name: req.body.name });
});

// 删除用户
router.delete('/:id', (req, res) => {
  res.status(204).send();
});

module.exports = router;
```

```javascript
// app.js
const express = require('express');
const userRoutes = require('./routes/users');

const app = express();

app.use(express.json());
app.use('/api/users', userRoutes);

app.listen(3000);
```

### 路由链式调用

使用 `route()` 方法为同一路径链式添加处理程序：

```javascript
app.route('/books')
  .get((req, res) => {
    res.send('Get all books');
  })
  .post((req, res) => {
    res.send('Add a book');
  })
  .put((req, res) => {
    res.send('Update all books');
  });

app.route('/books/:id')
  .get((req, res) => {
    res.send(`Get book ${req.params.id}`);
  })
  .put((req, res) => {
    res.send(`Update book ${req.params.id}`);
  })
  .delete((req, res) => {
    res.send(`Delete book ${req.params.id}`);
  });
```

## 中间件系统

中间件是 Express.js 中最基本的概念之一。中间件函数可以访问请求对象（req）、响应对象（res）以及应用程序请求-响应周期中的下一个中间件函数（next）。

### 中间件执行流程

```
请求 -> 中间件1 -> 中间件2 -> 中间件3 -> 路由处理程序 -> 响应
```

### 中间件类型

#### 应用级中间件

应用级中间件绑定到 `app` 对象，适用于所有请求：

```javascript
const express = require('express');
const app = express();

// 日志中间件 - 适用于所有路由
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next(); // 必须调用 next() 将控制权传递给下一个中间件
});

// 针对特定路径的中间件
app.use('/api', (req, res, next) => {
  console.log('API request received');
  next();
});

// 多个中间件函数
app.use('/admin',
  (req, res, next) => {
    console.log('Admin access attempt');
    next();
  },
  (req, res, next) => {
    // 检查管理员权限
    next();
  }
);
```

#### 路由级中间件

路由级中间件绑定到 `express.Router()` 实例：

```javascript
const express = require('express');
const router = express.Router();

// 此路由器中所有路由的中间件
router.use((req, res, next) => {
  console.log('Router middleware executed');
  next();
});

// 路由器内特定路径的中间件
router.use('/user/:id', (req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  next();
}, (req, res, next) => {
  console.log('Request Type:', req.method);
  next();
});

router.get('/user/:id', (req, res) => {
  res.send('User info');
});

// 将路由器挂载到应用
app.use('/', router);
```

#### 内置中间件

Express 4.x+ 提供了几个内置中间件函数：

```javascript
// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));

// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 提供静态文件
app.use(express.static('public'));

// 带选项的静态文件服务
app.use(express.static('public', {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['htm', 'html'],
  index: 'index.html',
  maxAge: '1d',
  redirect: true
}));

// 原始请求体解析器（适用于 webhook）
app.use('/webhook', express.raw({ type: 'application/json' }));

// 文本请求体解析器
app.use('/logs', express.text({ type: 'text/plain' }));
```

#### 第三方中间件

常用的第三方中间件包：

```javascript
const morgan = require('morgan');         // HTTP 请求日志记录器
const cors = require('cors');             // 跨源资源共享
const helmet = require('helmet');         // 安全头
const compression = require('compression'); // Gzip 压缩
const rateLimit = require('express-rate-limit'); // 速率限制

// 请求日志
app.use(morgan('combined')); // Apache combined 日志格式
app.use(morgan('dev'));      // 用于开发的简洁彩色输出

// 启用 CORS
app.use(cors());
app.use(cors({
  origin: ['http://localhost:3000', 'https://example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存时间（秒）
}));

// 安全头
app.use(helmet());

// Gzip 压缩
app.use(compression());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 在时间窗口内限制 100 个请求
  message: 'Too many requests, please try again later.'
});
app.use('/api', limiter);
```

### 自定义中间件示例

```javascript
// 请求计时中间件
const requestTimer = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
  });

  next();
};

// 认证中间件
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (token.startsWith('Bearer ')) {
    const tokenValue = token.slice(7);
    // 验证令牌（简化示例）
    if (tokenValue === 'valid-token') {
      req.user = { id: 1, name: 'John', role: 'admin' };
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    res.status(401).json({ error: 'Invalid token format' });
  }
};

// 基于角色的授权中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// 使用方法
app.use(requestTimer);
app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});
app.delete('/admin/users/:id', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'User deleted' });
});
```

## 请求/响应处理

### 请求对象（req）

请求对象包含有关 HTTP 请求的所有信息：

```javascript
app.get('/api/search', (req, res) => {
  // 路由参数: /users/:id
  const userId = req.params.id;

  // 查询参数: /search?keyword=express&page=1
  const keyword = req.query.keyword;
  const page = parseInt(req.query.page) || 1;

  // 请求头
  const contentType = req.headers['content-type'];
  const authToken = req.headers.authorization;
  const userAgent = req.get('User-Agent');

  // 请求体（需要 body-parser 中间件）
  const body = req.body;

  // 请求方法和路径
  console.log(`${req.method} ${req.url}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Path: ${req.path}`);

  // 客户端信息
  console.log(`IP: ${req.ip}`);
  console.log(`Protocol: ${req.protocol}`);
  console.log(`Hostname: ${req.hostname}`);
  console.log(`Secure: ${req.secure}`);

  // 检查请求是否为 AJAX
  const isAjax = req.xhr;

  // Accept 头检查
  if (req.accepts('html')) {
    // 客户端偏好 HTML
  } else if (req.accepts('json')) {
    // 客户端偏好 JSON
  }

  res.json({ keyword, page });
});
```

### 响应对象（res）

响应对象提供多种发送响应的方法：

```javascript
app.get('/api/demo', (req, res) => {
  // 发送文本响应
  res.send('Hello World');

  // 发送 JSON 响应
  res.json({ name: 'Express', version: '4.x' });

  // 设置状态码并发送
  res.status(201).json({ message: 'Created successfully' });

  // 仅发送状态码
  res.sendStatus(204); // 发送 204 No Content

  // 重定向
  res.redirect('/new-location');
  res.redirect(301, '/permanent-redirect');
  res.redirect('back'); // 重定向到引用页

  // 发送文件
  res.sendFile('/absolute/path/to/file.pdf');
  res.sendFile('file.pdf', { root: './public' });

  // 下载文件
  res.download('/path/to/file.pdf', 'custom-filename.pdf');

  // 设置响应头
  res.set('X-Custom-Header', 'value');
  res.set({
    'Content-Type': 'application/json',
    'X-Request-Id': '12345'
  });

  // 设置 cookie
  res.cookie('sessionId', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 3600000
  });

  // 清除 cookie
  res.clearCookie('sessionId');

  // 设置内容类型
  res.type('json');
  res.type('application/json');

  // 追加到现有头
  res.append('Set-Cookie', 'foo=bar');

  // 不发送数据结束响应
  res.end();
});

// 渲染模板
app.get('/page', (req, res) => {
  res.render('index', {
    title: 'My Page',
    user: { name: 'John' }
  });
});

// 根据 Accept 头格式化响应
app.get('/users/:id', (req, res) => {
  const user = { id: req.params.id, name: 'John' };

  res.format({
    'text/plain': () => {
      res.send(`User: ${user.name}`);
    },
    'text/html': () => {
      res.send(`<h1>User: ${user.name}</h1>`);
    },
    'application/json': () => {
      res.json(user);
    },
    default: () => {
      res.status(406).send('Not Acceptable');
    }
  });
});
```

## 错误处理

全面的错误处理对于生产级应用程序至关重要。Express 提供了多种错误处理机制。

### 同步错误处理

```javascript
app.get('/sync-error', (req, res) => {
  try {
    const jsonStr = req.query.data;
    const jsonObj = JSON.parse(jsonStr);
    res.json(jsonObj);
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON format' });
  }
});
```

### 异步错误处理

Express 5.x 原生支持 async/await 错误处理：

```javascript
// Express 5.x - 自动捕获异步错误
app.get('/async-data', async (req, res, next) => {
  const data = await fetchUserData(); // 如果 promise 被拒绝，自动调用 next(err)
  res.json(data);
});

// Express 4.x - 需要手动捕获
app.get('/async-data', async (req, res, next) => {
  try {
    const data = await fetchUserData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Express 4.x 的辅助包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/users', asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json(users);
}));
```

### 错误处理中间件

错误处理中间件必须有四个参数（err, req, res, next）：

```javascript
// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 处理程序 - 放在所有路由之后
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl}`, 404));
});

// 全局错误处理程序 - 必须有 4 个参数
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // 开发环境：发送详细错误信息
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // 生产环境：发送最少错误信息
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // 编程或未知错误
      console.error('ERROR:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
});

// 使用方法
app.get('/users/:id', async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json(user);
});
```

## 模板引擎

Express 支持多种模板引擎来渲染动态 HTML 页面。

### 设置模板引擎

```javascript
const express = require('express');
const app = express();

// 设置视图引擎
app.set('view engine', 'pug');
app.set('views', './views');

// 对于 EJS
// app.set('view engine', 'ejs');

// 对于 Handlebars
// const exphbs = require('express-handlebars');
// app.engine('handlebars', exphbs());
// app.set('view engine', 'handlebars');
```

### Pug（原名 Jade）

```javascript
// 注册 Pug 引擎
app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');
```

```pug
//- views/layout.pug
doctype html
html
  head
    title= title
    link(rel='stylesheet', href='/stylesheets/style.css')
  body
    block content

//- views/index.pug
extends layout

block content
  h1= title
  p Welcome to #{title}
  ul
    each user in users
      li= user.name
```

### EJS（嵌入式 JavaScript）

```javascript
app.set('view engine', 'ejs');
```

```html
<!-- views/index.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <h1><%= title %></h1>
  <ul>
    <% users.forEach(function(user) { %>
      <li><%= user.name %></li>
    <% }); %>
  </ul>
</body>
</html>
```

### 渲染视图

```javascript
app.get('/', (req, res) => {
  res.render('index', {
    title: 'My App',
    users: [
      { name: 'Alice' },
      { name: 'Bob' }
    ]
  });
});

// 带回调
app.get('/page', (req, res) => {
  res.render('index', { title: 'Page' }, (err, html) => {
    if (err) {
      return res.status(500).send('Render error');
    }
    res.send(html);
  });
});
```

## 静态文件

Express 提供内置中间件来提供静态文件服务。

### 基本静态文件服务

```javascript
const path = require('path');

// 从 'public' 目录提供文件
// GET /style.css -> public/style.css
app.use(express.static('public'));

// 从多个目录提供文件
app.use(express.static('public'));
app.use(express.static('files'));
app.use(express.static('uploads'));

// 挂载到特定路径
// GET /static/style.css -> public/style.css
app.use('/static', express.static('public'));

// 使用绝对路径（推荐）
app.use('/static', express.static(path.join(__dirname, 'public')));
```

### 高级静态文件选项

```javascript
const options = {
  dotfiles: 'ignore',        // 如何处理点文件：'allow'、'deny'、'ignore'
  etag: true,                // 启用 ETag 生成
  extensions: ['htm', 'html'], // 要尝试的文件扩展名
  index: 'index.html',       // 默认文件名
  maxAge: '1d',              // Cache max-age 指令
  redirect: true,            // 当路径是目录时重定向到尾部 "/"
  setHeaders: function (res, path, stat) {
    // 自定义头
    res.set('x-timestamp', Date.now());
    res.set('Cache-Control', 'public, max-age=31536000');
  }
};

app.use(express.static('public', options));
```

### 虚拟路径前缀

```javascript
// 'public' 中的文件从 '/static' 路径提供
app.use('/static', express.static('public'));
app.use('/assets', express.static('assets'));

// 示例 URL：
// http://localhost:3000/static/images/logo.png
// http://localhost:3000/assets/js/main.js
```

## 安全最佳实践

安全对于生产应用程序至关重要。以下是 Express 应用程序的基本安全措施。

### 使用 Helmet 设置安全头

```javascript
const helmet = require('helmet');

// 使用默认设置
app.use(helmet());

// 自定义配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.example.com']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### 速率限制

```javascript
const rateLimit = require('express-rate-limit');

// 通用速率限制器
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个时间窗口 100 个请求
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 认证的严格速率限制器
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 5, // 每小时 5 次尝试
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
```

### 输入验证

```javascript
const { body, param, query, validationResult } = require('express-validator');

app.post('/users',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).trim(),
  body('name').notEmpty().escape(),
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 处理有效请求
    res.json({ message: 'User created' });
  }
);
```

### HTTPS 和安全 Cookie

```javascript
// 在生产环境强制使用 HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// 安全 cookie 设置
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 3600000
  },
  resave: false,
  saveUninitialized: false
}));
```

### 其他安全措施

```javascript
// 防止参数污染
const hpp = require('hpp');
app.use(hpp());

// 数据清理防止 NoSQL 注入
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// 数据清理防止 XSS
const xss = require('xss-clean');
app.use(xss());

// 限制请求体大小
app.use(express.json({ limit: '10kb' }));

// 隐藏技术栈
app.disable('x-powered-by');
```

## 项目结构最佳实践

良好组织的 Express 项目结构可以提高代码可维护性和团队协作效率：

```
project/
├── src/
│   ├── app.js                 # Express 应用配置
│   ├── server.js              # 服务器入口点
│   ├── config/
│   │   ├── index.js           # 配置聚合
│   │   ├── database.js        # 数据库配置
│   │   └── constants.js       # 常量定义
│   ├── controllers/
│   │   ├── userController.js  # 用户控制器
│   │   └── postController.js  # 文章控制器
│   ├── middleware/
│   │   ├── auth.js            # 认证中间件
│   │   ├── validate.js        # 验证中间件
│   │   └── errorHandler.js    # 错误处理
│   ├── models/
│   │   ├── User.js            # 用户模型
│   │   └── Post.js            # 文章模型
│   ├── routes/
│   │   ├── index.js           # 路由聚合
│   │   ├── userRoutes.js      # 用户路由
│   │   └── postRoutes.js      # 文章路由
│   ├── services/
│   │   ├── userService.js     # 用户业务逻辑
│   │   └── emailService.js    # 邮件服务
│   └── utils/
│       ├── logger.js          # 日志工具
│       └── helpers.js         # 辅助函数
├── tests/
│   ├── unit/
│   └── integration/
├── .env
├── .env.example
├── package.json
└── README.md
```

### 分层架构示例

```javascript
// controllers/userController.js
const userService = require('../services/userService');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await userService.findAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};
```

```javascript
// services/userService.js
const User = require('../models/User');

exports.findAll = async () => {
  return await User.find();
};

exports.create = async (userData) => {
  const user = new User(userData);
  return await user.save();
};
```

## 面试重点

### 常见面试问题

1. **Express 中间件的执行顺序是什么？**
   - 中间件按照 `app.use()` 注册的顺序执行
   - 必须调用 `next()` 将控制权传递给下一个中间件
   - 错误处理中间件需要四个参数

2. **如何在 Express 中处理异步错误？**
   - Express 5.x 自动捕获异步函数错误
   - Express 4.x 需要 try-catch 或包装函数如 express-async-handler

3. **Express 和 Koa 的区别是什么？**
   - 中间件模型：Express 是线性的，Koa 使用洋葱模型
   - Koa 原生支持 async/await
   - Koa 更轻量，Express 生态系统更丰富

4. **如何优化 Express 应用性能？**
   - 使用 gzip 压缩
   - 实现响应缓存
   - 使用 cluster 模块利用多核
   - 避免同步代码
   - 使用负载均衡
   - 将 NODE_ENV 设置为 'production'

5. **什么是 RESTful API，如何用 Express 实现？**
   - 使用 HTTP 动词表示操作（GET、POST、PUT、DELETE）
   - URL 表示资源
   - 使用状态码表示结果
   - 无状态设计

### 代码挑战示例

```javascript
// 实现请求计时中间件
const responseTime = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    console.log(`${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
  });

  next();
};

app.use(responseTime);

// 实现简单的缓存中间件
const cache = new Map();

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      originalJson(data);
    };

    next();
  };
};

app.get('/api/data', cacheMiddleware(60000), (req, res) => {
  // 数据被获取并缓存 1 分钟
  res.json({ data: 'expensive computation result' });
});
```

## 延伸阅读

### 官方资源

- [Express.js 官方文档](https://expressjs.com/)
- [Express.js GitHub 仓库](https://github.com/expressjs/express)
- [Express.js 中间件列表](https://expressjs.com/en/resources/middleware.html)

### 推荐学习路径

1. **入门阶段**：掌握路由、中间件和请求/响应处理
2. **进阶阶段**：学习错误处理、安全最佳实践和性能优化
3. **高级阶段**：构建 RESTful API、集成数据库和部署到生产环境

### 相关技术

- **数据库**：MongoDB + Mongoose、PostgreSQL + Sequelize/Prisma
- **认证**：Passport.js、JWT、OAuth 2.0
- **API 文档**：Swagger/OpenAPI
- **测试**：Jest、Supertest、Mocha
- **部署**：PM2、Docker、Kubernetes

### 进阶主题

- Express 5.x 新特性
- GraphQL 与 Express 集成
- WebSocket 支持（Socket.io）
- 微服务架构
- Serverless 部署（AWS Lambda、Vercel）

---

Express.js 仍然是 Node.js 生态系统中最成熟、使用最广泛的 Web 框架之一。其极简的设计和丰富的生态系统使其成为构建 Web 应用程序和 API 的绝佳选择。通过本指南，你现在应该理解了 Express 的核心概念，并能够构建生产级应用程序。请持续关注官方文档和社区动态，以了解新功能和最佳实践。
