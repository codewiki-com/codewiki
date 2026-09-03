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
origin: old/src/content/docs/backend/expressjs-guide.en.md
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

## Concept Overview

Express.js is a fast, unopinionated, and minimalist web application framework for Node.js. As one of the most popular backend frameworks in the Node.js ecosystem, Express provides a clean and powerful set of tools for building web applications and RESTful APIs.

### Why Choose Express.js?

Express.js follows a "minimalist" (unopinionated) design philosophy, meaning it does not force developers to follow specific project structures or design patterns. This flexibility allows developers to freely organize code according to project requirements while maintaining the framework's lightweight characteristics.

The core advantages of Express include:

- **Easy to Learn**: Intuitive API design with a gentle learning curve
- **Highly Extensible**: Feature extension through the middleware mechanism
- **Rich Ecosystem**: Extensive collection of third-party middleware and plugins
- **Active Community**: Wide community support and abundant learning resources
- **Excellent Performance**: Built on Node.js's asynchronous non-blocking I/O model

### Installation and Setup

Before starting with Express, ensure you have Node.js installed. Then create a new project:

```bash
# Create project directory
mkdir my-express-app
cd my-express-app

# Initialize package.json
npm init -y

# Install Express
npm install express
```

## Express Basics

### Creating Your First Application

The first step in creating an Express application is instantiating the application object:

```javascript
const express = require('express');
const app = express();

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

### Application Configuration

Express provides several methods to configure your application:

```javascript
const express = require('express');
const app = express();

// Application settings
app.set('view engine', 'pug');        // Set template engine
app.set('views', './views');           // Set views directory
app.set('case sensitive routing', true); // Enable case-sensitive routes
app.set('strict routing', true);       // Enable strict routing

// Environment-specific configuration
if (app.get('env') === 'development') {
  app.set('json spaces', 2); // Pretty print JSON in development
}

// Disable X-Powered-By header for security
app.disable('x-powered-by');
```

## Routing

Routing refers to how an application responds to client requests at specific endpoints. Each route can have one or more handler functions that execute when the route matches.

### Basic Route Definition

```javascript
// GET request
app.get('/', (req, res) => {
  res.send('Welcome to the homepage');
});

// POST request
app.post('/users', (req, res) => {
  res.json({ message: 'User created successfully' });
});

// PUT request
app.put('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} updated successfully` });
});

// DELETE request
app.delete('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} deleted successfully` });
});

// PATCH request
app.patch('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} partially updated` });
});

// Handle all HTTP methods
app.all('/secret', (req, res, next) => {
  console.log('Accessing the secret section...');
  next(); // Pass control to the next handler
});
```

### Route Parameters

```javascript
// Single parameter
app.get('/users/:userId', (req, res) => {
  res.send(`User ID: ${req.params.userId}`);
});

// Multiple parameters
app.get('/users/:userId/books/:bookId', (req, res) => {
  res.json({
    userId: req.params.userId,
    bookId: req.params.bookId
  });
});

// Optional parameters (using regex)
app.get('/users/:userId?', (req, res) => {
  if (req.params.userId) {
    res.send(`User ID: ${req.params.userId}`);
  } else {
    res.send('User list');
  }
});

// Route parameter with pattern constraint
app.get('/users/:userId(\\d+)', (req, res) => {
  // Only matches numeric user IDs
  res.send(`Numeric User ID: ${req.params.userId}`);
});
```

### Using Express Router for Modular Routes

Organizing routes into separate modules improves code maintainability:

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

// Middleware specific to this router
router.use((req, res, next) => {
  console.log('User route accessed:', Date.now());
  next();
});

// User list
router.get('/', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]);
});

// Get single user
router.get('/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'User' });
});

// Create user
router.post('/', (req, res) => {
  res.status(201).json({ id: 3, name: req.body.name });
});

// Update user
router.put('/:id', (req, res) => {
  res.json({ id: req.params.id, name: req.body.name });
});

// Delete user
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

### Route Chaining

Use `route()` to chain handlers for the same path:

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

## Middleware System

Middleware is one of the most fundamental concepts in Express.js. Middleware functions have access to the request object (req), the response object (res), and the next middleware function in the application's request-response cycle (next).

### Middleware Execution Flow

```
Request -> Middleware1 -> Middleware2 -> Middleware3 -> Route Handler -> Response
```

### Types of Middleware

#### Application-Level Middleware

Application-level middleware binds to the `app` object and applies to all requests:

```javascript
const express = require('express');
const app = express();

// Logging middleware - applies to all routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next(); // Must call next() to pass control to the next middleware
});

// Middleware for specific path
app.use('/api', (req, res, next) => {
  console.log('API request received');
  next();
});

// Multiple middleware functions
app.use('/admin',
  (req, res, next) => {
    console.log('Admin access attempt');
    next();
  },
  (req, res, next) => {
    // Check admin privileges
    next();
  }
);
```

#### Router-Level Middleware

Router-level middleware binds to an `express.Router()` instance:

```javascript
const express = require('express');
const router = express.Router();

// Middleware for all routes in this router
router.use((req, res, next) => {
  console.log('Router middleware executed');
  next();
});

// Middleware for specific path within router
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

// Mount router on app
app.use('/', router);
```

#### Built-in Middleware

Express 4.x+ provides several built-in middleware functions:

```javascript
// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

// Serve static files with options
app.use(express.static('public', {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['htm', 'html'],
  index: 'index.html',
  maxAge: '1d',
  redirect: true
}));

// Raw body parser (useful for webhooks)
app.use('/webhook', express.raw({ type: 'application/json' }));

// Text body parser
app.use('/logs', express.text({ type: 'text/plain' }));
```

#### Third-Party Middleware

Popular third-party middleware packages:

```javascript
const morgan = require('morgan');         // HTTP request logger
const cors = require('cors');             // Cross-origin resource sharing
const helmet = require('helmet');         // Security headers
const compression = require('compression'); // Gzip compression
const rateLimit = require('express-rate-limit'); // Rate limiting

// Request logging
app.use(morgan('combined')); // Apache combined log format
app.use(morgan('dev'));      // Concise colored output for development

// Enable CORS
app.use(cors());
app.use(cors({
  origin: ['http://localhost:3000', 'https://example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Preflight cache duration in seconds
}));

// Security headers
app.use(helmet());

// Gzip compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use('/api', limiter);
```

### Custom Middleware Examples

```javascript
// Request timing middleware
const requestTimer = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
  });

  next();
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (token.startsWith('Bearer ')) {
    const tokenValue = token.slice(7);
    // Verify token (simplified example)
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

// Role-based authorization middleware
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

// Usage
app.use(requestTimer);
app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});
app.delete('/admin/users/:id', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'User deleted' });
});
```

## Request/Response Handling

### Request Object (req)

The request object contains all information about the HTTP request:

```javascript
app.get('/api/search', (req, res) => {
  // Route parameters: /users/:id
  const userId = req.params.id;

  // Query parameters: /search?keyword=express&page=1
  const keyword = req.query.keyword;
  const page = parseInt(req.query.page) || 1;

  // Request headers
  const contentType = req.headers['content-type'];
  const authToken = req.headers.authorization;
  const userAgent = req.get('User-Agent');

  // Request body (requires body-parser middleware)
  const body = req.body;

  // Request method and path
  console.log(`${req.method} ${req.url}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Path: ${req.path}`);

  // Client information
  console.log(`IP: ${req.ip}`);
  console.log(`Protocol: ${req.protocol}`);
  console.log(`Hostname: ${req.hostname}`);
  console.log(`Secure: ${req.secure}`);

  // Check if request is AJAX
  const isAjax = req.xhr;

  // Accept header checking
  if (req.accepts('html')) {
    // Client prefers HTML
  } else if (req.accepts('json')) {
    // Client prefers JSON
  }

  res.json({ keyword, page });
});
```

### Response Object (res)

The response object provides multiple methods to send responses:

```javascript
app.get('/api/demo', (req, res) => {
  // Send text response
  res.send('Hello World');

  // Send JSON response
  res.json({ name: 'Express', version: '4.x' });

  // Set status code and send
  res.status(201).json({ message: 'Created successfully' });

  // Send status only
  res.sendStatus(204); // Sends 204 No Content

  // Redirect
  res.redirect('/new-location');
  res.redirect(301, '/permanent-redirect');
  res.redirect('back'); // Redirect to referer

  // Send file
  res.sendFile('/absolute/path/to/file.pdf');
  res.sendFile('file.pdf', { root: './public' });

  // Download file
  res.download('/path/to/file.pdf', 'custom-filename.pdf');

  // Set response headers
  res.set('X-Custom-Header', 'value');
  res.set({
    'Content-Type': 'application/json',
    'X-Request-Id': '12345'
  });

  // Set cookies
  res.cookie('sessionId', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 3600000
  });

  // Clear cookies
  res.clearCookie('sessionId');

  // Set content type
  res.type('json');
  res.type('application/json');

  // Append to existing header
  res.append('Set-Cookie', 'foo=bar');

  // End response without data
  res.end();
});

// Render template
app.get('/page', (req, res) => {
  res.render('index', {
    title: 'My Page',
    user: { name: 'John' }
  });
});

// Format response based on Accept header
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

## Error Handling

Comprehensive error handling is essential for production-grade applications. Express provides multiple error handling mechanisms.

### Synchronous Error Handling

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

### Asynchronous Error Handling

Express 5.x natively supports async/await error handling:

```javascript
// Express 5.x - automatically catches async errors
app.get('/async-data', async (req, res, next) => {
  const data = await fetchUserData(); // If promise rejects, automatically calls next(err)
  res.json(data);
});

// Express 4.x - requires manual catching
app.get('/async-data', async (req, res, next) => {
  try {
    const data = await fetchUserData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Helper wrapper for Express 4.x
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/users', asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json(users);
}));
```

### Error-Handling Middleware

Error-handling middleware must have four parameters (err, req, res, next):

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 handler - place after all routes
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl}`, 404));
});

// Global error handler - must have 4 parameters
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // Development: send detailed error info
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production: send minimal error info
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Programming or unknown error
      console.error('ERROR:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
});

// Usage
app.get('/users/:id', async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json(user);
});
```

## Template Engines

Express supports multiple template engines for rendering dynamic HTML pages.

### Setting Up a Template Engine

```javascript
const express = require('express');
const app = express();

// Set view engine
app.set('view engine', 'pug');
app.set('views', './views');

// For EJS
// app.set('view engine', 'ejs');

// For Handlebars
// const exphbs = require('express-handlebars');
// app.engine('handlebars', exphbs());
// app.set('view engine', 'handlebars');
```

### Pug (formerly Jade)

```javascript
// Register Pug engine
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

### EJS (Embedded JavaScript)

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

### Rendering Views

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

// With callback
app.get('/page', (req, res) => {
  res.render('index', { title: 'Page' }, (err, html) => {
    if (err) {
      return res.status(500).send('Render error');
    }
    res.send(html);
  });
});
```

## Static Files

Express provides built-in middleware for serving static files.

### Basic Static File Serving

```javascript
const path = require('path');

// Serve files from 'public' directory
// GET /style.css -> public/style.css
app.use(express.static('public'));

// Serve from multiple directories
app.use(express.static('public'));
app.use(express.static('files'));
app.use(express.static('uploads'));

// Mount at specific path
// GET /static/style.css -> public/style.css
app.use('/static', express.static('public'));

// Using absolute path (recommended)
app.use('/static', express.static(path.join(__dirname, 'public')));
```

### Advanced Static File Options

```javascript
const options = {
  dotfiles: 'ignore',        // How to handle dotfiles: 'allow', 'deny', 'ignore'
  etag: true,                // Enable ETag generation
  extensions: ['htm', 'html'], // File extensions to try
  index: 'index.html',       // Default file name
  maxAge: '1d',              // Cache max-age directive
  redirect: true,            // Redirect to trailing "/" when path is a directory
  setHeaders: function (res, path, stat) {
    // Custom headers
    res.set('x-timestamp', Date.now());
    res.set('Cache-Control', 'public, max-age=31536000');
  }
};

app.use(express.static('public', options));
```

### Virtual Path Prefix

```javascript
// Files in 'public' served from '/static' path
app.use('/static', express.static('public'));
app.use('/assets', express.static('assets'));

// Example URLs:
// http://localhost:3000/static/images/logo.png
// http://localhost:3000/assets/js/main.js
```

## Security Best Practices

Security is crucial for production applications. Here are essential security measures for Express applications.

### Use Helmet for Security Headers

```javascript
const helmet = require('helmet');

// Use with default settings
app.use(helmet());

// Custom configuration
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

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for authentication
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
```

### Input Validation

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

    // Process valid request
    res.json({ message: 'User created' });
  }
);
```

### HTTPS and Secure Cookies

```javascript
// Force HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Secure cookie settings
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

### Additional Security Measures

```javascript
// Prevent parameter pollution
const hpp = require('hpp');
app.use(hpp());

// Data sanitization against NoSQL injection
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Data sanitization against XSS
const xss = require('xss-clean');
app.use(xss());

// Limit request body size
app.use(express.json({ limit: '10kb' }));

// Hide technology stack
app.disable('x-powered-by');
```

## Project Structure Best Practices

A well-organized Express project structure improves code maintainability and team collaboration:

```
project/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/
│   │   ├── index.js           # Configuration aggregation
│   │   ├── database.js        # Database configuration
│   │   └── constants.js       # Constants definition
│   ├── controllers/
│   │   ├── userController.js  # User controller
│   │   └── postController.js  # Post controller
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   ├── validate.js        # Validation middleware
│   │   └── errorHandler.js    # Error handling
│   ├── models/
│   │   ├── User.js            # User model
│   │   └── Post.js            # Post model
│   ├── routes/
│   │   ├── index.js           # Route aggregation
│   │   ├── userRoutes.js      # User routes
│   │   └── postRoutes.js      # Post routes
│   ├── services/
│   │   ├── userService.js     # User business logic
│   │   └── emailService.js    # Email service
│   └── utils/
│       ├── logger.js          # Logging utility
│       └── helpers.js         # Helper functions
├── tests/
│   ├── unit/
│   └── integration/
├── .env
├── .env.example
├── package.json
└── README.md
```

### Layered Architecture Example

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

## Interview Key Points

### Common Interview Questions

1. **What is the execution order of Express middleware?**
   - Middleware executes in the order registered with `app.use()`
   - Must call `next()` to pass control to the next middleware
   - Error-handling middleware requires four parameters

2. **How do you handle asynchronous errors in Express?**
   - Express 5.x automatically catches async function errors
   - Express 4.x requires try-catch or wrapper functions like express-async-handler

3. **What is the difference between Express and Koa?**
   - Middleware model: Express is linear, Koa uses onion model
   - Koa natively supports async/await
   - Koa is more lightweight, Express has richer ecosystem

4. **How do you optimize Express application performance?**
   - Use gzip compression
   - Implement response caching
   - Use cluster module for multi-core utilization
   - Avoid synchronous code
   - Use load balancing
   - Set NODE_ENV to 'production'

5. **What is RESTful API and how do you implement it with Express?**
   - Use HTTP verbs to represent operations (GET, POST, PUT, DELETE)
   - URLs represent resources
   - Use status codes to indicate results
   - Stateless design

### Code Challenge Example

```javascript
// Implement a request timing middleware
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

// Implement a simple caching middleware
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
  // Data fetched and cached for 1 minute
  res.json({ data: 'expensive computation result' });
});
```

## Further Reading

### Official Resources

- [Express.js Official Documentation](https://expressjs.com/)
- [Express.js GitHub Repository](https://github.com/expressjs/express)
- [Express.js Middleware List](https://expressjs.com/en/resources/middleware.html)

### Recommended Learning Path

1. **Beginner Stage**: Master routing, middleware, and request/response handling
2. **Intermediate Stage**: Learn error handling, security best practices, and performance optimization
3. **Advanced Stage**: Build RESTful APIs, integrate databases, and deploy to production

### Related Technologies

- **Databases**: MongoDB + Mongoose, PostgreSQL + Sequelize/Prisma
- **Authentication**: Passport.js, JWT, OAuth 2.0
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest, Mocha
- **Deployment**: PM2, Docker, Kubernetes

### Advanced Topics

- Express 5.x new features
- GraphQL integration with Express
- WebSocket support (Socket.io)
- Microservices architecture
- Serverless deployment (AWS Lambda, Vercel)

---

Express.js remains one of the most mature and widely-used web frameworks in the Node.js ecosystem. Its minimalist design and rich ecosystem make it an excellent choice for building web applications and APIs. You should now understand Express's core concepts and be able to build production-grade applications. Stay updated with the official documentation and community developments to keep abreast of new features and best practices.
