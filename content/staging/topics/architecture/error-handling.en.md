---
title: Backend Error Handling
description: Learn backend error handling patterns and best practices
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - error handling
  - exceptions
  - logging
  - monitoring
status: imported
origin: old/src/content/docs/backend/error-handling.en.md
divergence: 0.144
issues: []
legacy:
  category: Backend
  subcategory: Patterns
  order: 33
  lastUpdated: 2026-01-07
---

## Concept Overview

Error handling is a fundamental aspect of building robust backend applications. A well-designed error handling strategy ensures that applications can gracefully recover from unexpected situations, provide meaningful feedback to users, and give developers the information they need to diagnose and fix problems.

### Why Error Handling Matters

Proper error handling directly impacts several critical aspects of your application:

- **User Experience**: Users receive clear, actionable feedback instead of cryptic technical messages
- **System Reliability**: Applications can recover gracefully from failures without crashing
- **Debugging Efficiency**: Developers can quickly identify and resolve issues with proper error context
- **Security**: Sensitive information is not leaked through error messages
- **Operational Visibility**: Teams can monitor and respond to issues before they become critical

### The Cost of Poor Error Handling

Neglecting error handling leads to significant problems:

```
1. Unhelpful error messages frustrate users and increase support burden
2. Silent failures cause data corruption and inconsistent state
3. Missing error context extends debugging time exponentially
4. Exposed stack traces create security vulnerabilities
5. Cascading failures bring down entire systems
```

## Error Types and Categories

Understanding different error types helps you handle them appropriately. Errors can be categorized based on their origin, recoverability, and how they should be communicated.

### Operational vs Programming Errors

**Operational Errors**

These are expected errors that can occur during normal operation. They should be anticipated and handled gracefully.

```javascript
// Node.js examples of operational errors
const fs = require('fs');
const http = require('http');

// File not found - operational error
fs.readFile('/path/to/missing/file.txt', (err, data) => {
  if (err && err.code === 'ENOENT') {
    // Handle missing file gracefully
    console.log('File not found, using defaults');
    return useDefaults();
  }
});

// Network timeout - operational error
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('https://api.example.com/data', {
    signal: controller.signal
  });
} catch (err) {
  if (err.name === 'AbortError') {
    // Handle timeout gracefully
    return fallbackData();
  }
}
```

**Programming Errors**

These are bugs in the code that should be fixed rather than handled at runtime.

```javascript
// Programming errors - these should be fixed, not caught

// TypeError - accessing property of undefined
const user = null;
console.log(user.name); // TypeError: Cannot read property 'name' of null

// ReferenceError - using undefined variable
console.log(undefinedVariable); // ReferenceError

// RangeError - value out of range
const arr = new Array(-1); // RangeError: Invalid array length
```

### Client vs Server Errors

Understanding the source of errors helps determine the appropriate HTTP status code and response.

```python
# Python example with Flask
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

app = Flask(__name__)

# Custom error classes
class ClientError(Exception):
    """Errors caused by client input (4xx)"""
    def __init__(self, message, status_code=400, error_code=None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

class ServerError(Exception):
    """Errors caused by server issues (5xx)"""
    def __init__(self, message, status_code=500, error_code=None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

# Client error examples
class ValidationError(ClientError):
    """Invalid input from client"""
    def __init__(self, message, field=None):
        super().__init__(message, status_code=400, error_code='VALIDATION_ERROR')
        self.field = field

class NotFoundError(ClientError):
    """Requested resource not found"""
    def __init__(self, resource_type, resource_id):
        message = f"{resource_type} with id '{resource_id}' not found"
        super().__init__(message, status_code=404, error_code='NOT_FOUND')

class UnauthorizedError(ClientError):
    """Authentication required"""
    def __init__(self, message="Authentication required"):
        super().__init__(message, status_code=401, error_code='UNAUTHORIZED')

class ForbiddenError(ClientError):
    """Access denied"""
    def __init__(self, message="Access denied"):
        super().__init__(message, status_code=403, error_code='FORBIDDEN')

# Server error examples
class DatabaseError(ServerError):
    """Database operation failed"""
    def __init__(self, operation, original_error=None):
        message = f"Database {operation} failed"
        super().__init__(message, status_code=500, error_code='DATABASE_ERROR')
        self.original_error = original_error

class ExternalServiceError(ServerError):
    """External service unavailable"""
    def __init__(self, service_name, original_error=None):
        message = f"External service '{service_name}' is unavailable"
        super().__init__(message, status_code=502, error_code='EXTERNAL_SERVICE_ERROR')
        self.service_name = service_name
```

### Error Hierarchy Design

Creating a well-structured error hierarchy improves code organization and handling consistency.

```typescript
// TypeScript example of error hierarchy

// Base application error
abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly isOperational: boolean = true;
  readonly timestamp: Date = new Date();

  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        timestamp: this.timestamp.toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          stack: this.stack,
          context: this.context
        })
      }
    };
  }
}

// Client errors (4xx)
class BadRequestError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'BAD_REQUEST';
}

class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';

  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message, { validationErrors: errors });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.errors
    };
  }
}

class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';

  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} with id '${resourceId}' not found`, {
      resourceType,
      resourceId
    });
  }
}

class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT';
}

// Server errors (5xx)
class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_SERVER_ERROR';
}

class ServiceUnavailableError extends AppError {
  readonly statusCode = 503;
  readonly errorCode = 'SERVICE_UNAVAILABLE';

  constructor(serviceName: string, retryAfter?: number) {
    super(`Service '${serviceName}' is temporarily unavailable`, {
      serviceName,
      retryAfter
    });
  }
}
```

## Error Response Format

Consistent error responses make it easier for API consumers to handle errors programmatically.

### Standard Error Response Structure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ],
    "requestId": "req_abc123xyz",
    "timestamp": "2024-01-15T10:30:00Z",
    "documentation": "https://api.example.com/docs/errors#VALIDATION_ERROR"
  }
}
```

### Implementing Consistent Error Responses

```javascript
// Express.js error response implementation
class ErrorResponse {
  constructor(error, requestId) {
    this.error = {
      code: error.errorCode || 'UNKNOWN_ERROR',
      message: error.message,
      requestId: requestId,
      timestamp: new Date().toISOString()
    };

    // Add validation details if present
    if (error.validationErrors) {
      this.error.details = error.validationErrors;
    }

    // Add documentation link
    this.error.documentation =
      `https://api.example.com/docs/errors#${this.error.code}`;

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      this.error.stack = error.stack;
    }
  }
}

// Usage in error handler middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const response = new ErrorResponse(err, req.id);

  res.status(statusCode).json(response);
});
```

### Error Responses for Different Scenarios

```go
// Go example with consistent error responses
package main

import (
    "encoding/json"
    "net/http"
    "time"
)

type ErrorResponse struct {
    Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
    Code          string            `json:"code"`
    Message       string            `json:"message"`
    Details       []ValidationError `json:"details,omitempty"`
    RequestID     string            `json:"requestId"`
    Timestamp     string            `json:"timestamp"`
    Documentation string            `json:"documentation"`
}

type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

func NewErrorResponse(code, message, requestID string, details []ValidationError) ErrorResponse {
    return ErrorResponse{
        Error: ErrorDetail{
            Code:          code,
            Message:       message,
            Details:       details,
            RequestID:     requestID,
            Timestamp:     time.Now().UTC().Format(time.RFC3339),
            Documentation: "https://api.example.com/docs/errors#" + code,
        },
    }
}

func writeError(w http.ResponseWriter, statusCode int, err ErrorResponse) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(err)
}

// Handler example
func createUserHandler(w http.ResponseWriter, r *http.Request) {
    requestID := r.Header.Get("X-Request-ID")

    // Validation error example
    validationErrors := []ValidationError{
        {Field: "email", Message: "Invalid email format"},
        {Field: "age", Message: "Age must be a positive number"},
    }

    if len(validationErrors) > 0 {
        errResp := NewErrorResponse(
            "VALIDATION_ERROR",
            "Request validation failed",
            requestID,
            validationErrors,
        )
        writeError(w, http.StatusBadRequest, errResp)
        return
    }
}
```

## Centralized Error Handling

Centralizing error handling reduces code duplication and ensures consistent error processing across your application.

### Express.js Centralized Error Handler

```javascript
// middleware/errorHandler.js
const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID)
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log the error
  const logContext = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    userId: req.user?.id,
    ip: req.ip
  };

  if (statusCode >= 500) {
    logger.error('Server error occurred', {
      ...logContext,
      error: err.message,
      stack: err.stack
    });
  } else {
    logger.warn('Client error occurred', {
      ...logContext,
      error: err.message
    });
  }

  // Send response
  const response = {
    error: {
      code: errorCode,
      message: err.isOperational ? message : 'An unexpected error occurred',
      requestId: req.id,
      timestamp: new Date().toISOString()
    }
  };

  // Include details in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
    response.error.details = err.details;
  }

  res.status(statusCode).json(response);
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, asyncHandler };
```

### Python Flask Centralized Error Handling

```python
# error_handlers.py
from flask import Flask, jsonify, request, current_app
from werkzeug.exceptions import HTTPException
from datetime import datetime
import traceback
import uuid

class AppError(Exception):
    """Base application error"""
    def __init__(self, message, status_code=500, error_code='INTERNAL_ERROR'):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

class ValidationError(AppError):
    def __init__(self, errors):
        super().__init__('Validation failed', 400, 'VALIDATION_ERROR')
        self.errors = errors

class NotFoundError(AppError):
    def __init__(self, resource, resource_id):
        message = f'{resource} with id {resource_id} not found'
        super().__init__(message, 404, 'NOT_FOUND')

class UnauthorizedError(AppError):
    def __init__(self, message='Authentication required'):
        super().__init__(message, 401, 'UNAUTHORIZED')

def register_error_handlers(app: Flask):
    """Register all error handlers for the Flask app"""

    @app.errorhandler(AppError)
    def handle_app_error(error):
        """Handle custom application errors"""
        request_id = getattr(request, 'id', str(uuid.uuid4()))

        response = {
            'error': {
                'code': error.error_code,
                'message': error.message,
                'requestId': request_id,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
        }

        # Add validation errors if present
        if hasattr(error, 'errors'):
            response['error']['details'] = error.errors

        # Log the error
        current_app.logger.warning(
            f'App error: {error.error_code}',
            extra={
                'request_id': request_id,
                'error_code': error.error_code,
                'status_code': error.status_code,
                'path': request.path,
                'method': request.method
            }
        )

        return jsonify(response), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle Werkzeug HTTP exceptions"""
        request_id = getattr(request, 'id', str(uuid.uuid4()))

        response = {
            'error': {
                'code': error.name.upper().replace(' ', '_'),
                'message': error.description,
                'requestId': request_id,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
        }

        return jsonify(response), error.code

    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handle unexpected exceptions"""
        request_id = getattr(request, 'id', str(uuid.uuid4()))

        # Log the full error with stack trace
        current_app.logger.error(
            f'Unhandled exception: {str(error)}',
            extra={
                'request_id': request_id,
                'path': request.path,
                'method': request.method,
                'traceback': traceback.format_exc()
            }
        )

        response = {
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'An unexpected error occurred',
                'requestId': request_id,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
        }

        # Include details in development
        if current_app.debug:
            response['error']['details'] = str(error)
            response['error']['traceback'] = traceback.format_exc()

        return jsonify(response), 500
```

### Java Spring Boot Global Exception Handler

```java
// GlobalExceptionHandler.java
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Handle custom application exceptions
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(
            AppException ex, WebRequest request) {

        String requestId = request.getHeader("X-Request-ID");

        logger.warn("Application error: {} - {}",
            ex.getErrorCode(), ex.getMessage());

        ErrorResponse response = new ErrorResponse(
            ex.getErrorCode(),
            ex.getMessage(),
            requestId,
            Instant.now().toString()
        );

        return new ResponseEntity<>(response, ex.getStatus());
    }

    // Handle validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {

        String requestId = request.getHeader("X-Request-ID");

        List<ValidationErrorDetail> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> new ValidationErrorDetail(
                error.getField(),
                error.getDefaultMessage()
            ))
            .collect(Collectors.toList());

        logger.warn("Validation error with {} field errors", errors.size());

        ErrorResponse response = new ErrorResponse(
            "VALIDATION_ERROR",
            "Request validation failed",
            requestId,
            Instant.now().toString(),
            errors
        );

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // Handle resource not found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex, WebRequest request) {

        String requestId = request.getHeader("X-Request-ID");

        ErrorResponse response = new ErrorResponse(
            "NOT_FOUND",
            ex.getMessage(),
            requestId,
            Instant.now().toString()
        );

        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    // Handle all other exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, WebRequest request) {

        String requestId = request.getHeader("X-Request-ID");

        logger.error("Unhandled exception: {}", ex.getClass().getName(), ex);

        ErrorResponse response = new ErrorResponse(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred",
            requestId,
            Instant.now().toString()
        );

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

// Error response DTOs
record ErrorResponse(
    String code,
    String message,
    String requestId,
    String timestamp,
    List<ValidationErrorDetail> details
) {
    public ErrorResponse(String code, String message, String requestId, String timestamp) {
        this(code, message, requestId, timestamp, null);
    }
}

record ValidationErrorDetail(String field, String message) {}
```

## Logging Error Information

Proper error logging is essential for debugging and monitoring. Log enough context to diagnose issues without exposing sensitive information.

### Structured Error Logging

```javascript
// Winston logger configuration with error context
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'api-service',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Error logging utility
function logError(error, context = {}) {
  const errorInfo = {
    name: error.name,
    message: error.message,
    code: error.code || error.errorCode,
    stack: error.stack,
    ...context
  };

  // Sanitize sensitive data
  if (errorInfo.password) delete errorInfo.password;
  if (errorInfo.token) errorInfo.token = '[REDACTED]';
  if (errorInfo.creditCard) errorInfo.creditCard = '[REDACTED]';

  if (error.statusCode >= 500 || !error.isOperational) {
    logger.error('Error occurred', errorInfo);
  } else {
    logger.warn('Client error', errorInfo);
  }
}

// Usage in error handler
app.use((err, req, res, next) => {
  logError(err, {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send response...
});
```

### Contextual Error Logging in Python

```python
import logging
import structlog
from functools import wraps

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

def log_error(error, **context):
    """Log an error with context"""
    # Sanitize sensitive fields
    sanitized_context = {
        k: '[REDACTED]' if k in ('password', 'token', 'secret', 'api_key') else v
        for k, v in context.items()
    }

    error_info = {
        'error_type': type(error).__name__,
        'error_message': str(error),
        **sanitized_context
    }

    if hasattr(error, 'status_code') and error.status_code < 500:
        logger.warning('client_error', **error_info)
    else:
        logger.error('server_error', exc_info=True, **error_info)

def log_exceptions(func):
    """Decorator to log exceptions from functions"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            log_error(e, function=func.__name__)
            raise
    return wrapper

# Usage
@log_exceptions
def process_order(order_id, user_id):
    # Processing logic that might fail
    order = get_order(order_id)
    if not order:
        raise NotFoundError('Order', order_id)
    return order
```

## Monitoring and Alerting

Effective monitoring helps you detect and respond to errors before they impact users significantly.

### Error Rate Monitoring

```javascript
// Prometheus metrics for error monitoring
const promClient = require('prom-client');

// Error counter by type and path
const errorCounter = new promClient.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'path', 'status_code', 'error_code']
});

// Error rate histogram
const errorLatency = new promClient.Histogram({
  name: 'http_error_latency_seconds',
  help: 'Latency of requests that resulted in errors',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Middleware to track errors
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'UNKNOWN';

  // Increment error counter
  errorCounter.inc({
    method: req.method,
    path: req.route?.path || req.path,
    status_code: statusCode,
    error_code: errorCode
  });

  // Record latency
  const duration = (Date.now() - req.startTime) / 1000;
  errorLatency.observe({
    method: req.method,
    path: req.route?.path || req.path,
    status_code: statusCode
  }, duration);

  next(err);
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: error_alerts
    rules:
      # High error rate alert
      - alert: HighErrorRate
        expr: |
          sum(rate(http_errors_total{status_code=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes"

      # Spike in specific error type
      - alert: AuthenticationErrorSpike
        expr: |
          sum(rate(http_errors_total{error_code="UNAUTHORIZED"}[5m])) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Spike in authentication errors"
          description: "{{ $value }} authentication errors per second"

      # Database error alert
      - alert: DatabaseErrors
        expr: |
          sum(rate(http_errors_total{error_code="DATABASE_ERROR"}[5m])) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database errors detected"
          description: "Database errors are occurring"
```

### Error Tracking Integration

```javascript
// Sentry integration for error tracking
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ],
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out expected operational errors
    const error = hint.originalException;
    if (error?.isOperational && error?.statusCode < 500) {
      return null;
    }

    // Sanitize sensitive data
    if (event.request?.data) {
      const data = event.request.data;
      if (data.password) data.password = '[REDACTED]';
      if (data.token) data.token = '[REDACTED]';
    }

    return event;
  }
});

// Request handler must be first middleware
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// Your routes here...

// Error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Only report 5xx errors to Sentry
    return !error.statusCode || error.statusCode >= 500;
  }
}));

// Your custom error handler
app.use(errorHandler);
```

## Graceful Degradation

Graceful degradation ensures your application continues to function, albeit with reduced capability, when errors occur.

### Circuit Breaker Pattern

```javascript
// Circuit breaker implementation
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.monitorInterval = options.monitorInterval || 10000;

    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
  }

  async execute(fn, fallback) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        console.log('Circuit breaker is OPEN, using fallback');
        return fallback();
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      console.log(`Circuit breaker failure: ${this.failures}/${this.failureThreshold}`);

      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`Circuit breaker OPENED, will retry at ${new Date(this.nextAttempt)}`);
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    };
  }
}

// Usage
const externalServiceBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 60000
});

async function fetchExternalData(id) {
  return externalServiceBreaker.execute(
    // Primary function
    async () => {
      const response = await fetch(`https://external-api.com/data/${id}`);
      if (!response.ok) throw new Error('External API error');
      return response.json();
    },
    // Fallback function
    async () => {
      console.log('Using cached data as fallback');
      return getCachedData(id);
    }
  );
}
```

### Retry with Exponential Backoff

```python
import asyncio
import random
from functools import wraps
from typing import TypeVar, Callable

T = TypeVar('T')

class RetryConfig:
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: tuple = (Exception,)
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions

def retry_with_backoff(config: RetryConfig = None):
    """Decorator for retry with exponential backoff"""
    if config is None:
        config = RetryConfig()

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_exception = None

            for attempt in range(config.max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e

                    if attempt == config.max_retries:
                        break

                    # Calculate delay with exponential backoff
                    delay = min(
                        config.base_delay * (config.exponential_base ** attempt),
                        config.max_delay
                    )

                    # Add jitter to prevent thundering herd
                    if config.jitter:
                        delay = delay * (0.5 + random.random())

                    print(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay:.2f}s")
                    await asyncio.sleep(delay)

            raise last_exception

        return wrapper
    return decorator

# Usage
@retry_with_backoff(RetryConfig(
    max_retries=3,
    base_delay=1.0,
    retryable_exceptions=(ConnectionError, TimeoutError)
))
async def fetch_data_from_api(endpoint: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(endpoint, timeout=10) as response:
            if response.status >= 500:
                raise ConnectionError(f"Server error: {response.status}")
            return await response.json()
```

### Fallback Strategies

```javascript
// Multiple fallback strategies
class FallbackChain {
  constructor() {
    this.strategies = [];
  }

  addStrategy(name, fn, options = {}) {
    this.strategies.push({
      name,
      fn,
      timeout: options.timeout || 5000,
      enabled: options.enabled !== false
    });
    return this;
  }

  async execute(context = {}) {
    const errors = [];

    for (const strategy of this.strategies) {
      if (!strategy.enabled) continue;

      try {
        console.log(`Trying strategy: ${strategy.name}`);

        const result = await Promise.race([
          strategy.fn(context),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), strategy.timeout)
          )
        ]);

        console.log(`Strategy ${strategy.name} succeeded`);
        return result;

      } catch (error) {
        console.warn(`Strategy ${strategy.name} failed: ${error.message}`);
        errors.push({ strategy: strategy.name, error });
      }
    }

    throw new AggregateError(
      errors.map(e => e.error),
      `All ${errors.length} strategies failed`
    );
  }
}

// Usage
const productFetcher = new FallbackChain()
  .addStrategy('primary-api', async ({ productId }) => {
    const response = await fetch(`https://api.example.com/products/${productId}`);
    if (!response.ok) throw new Error('API error');
    return response.json();
  })
  .addStrategy('cache', async ({ productId }) => {
    const cached = await redis.get(`product:${productId}`);
    if (!cached) throw new Error('Cache miss');
    return JSON.parse(cached);
  })
  .addStrategy('database', async ({ productId }) => {
    return await db.products.findById(productId);
  })
  .addStrategy('default', async () => {
    return { id: 'unknown', name: 'Product Unavailable', price: 0 };
  });

// Get product with automatic fallback
async function getProduct(productId) {
  return productFetcher.execute({ productId });
}
```

## User-Friendly Error Messages

Error messages shown to users should be clear, helpful, and avoid technical jargon.

### Message Mapping Strategy

```javascript
// Error message mapping for user-friendly responses
const errorMessages = {
  // Validation errors
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'Review the highlighted fields and correct any errors.'
  },
  INVALID_EMAIL: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    action: 'Make sure your email is in the format: name@example.com'
  },
  PASSWORD_TOO_WEAK: {
    title: 'Password Too Weak',
    message: 'Your password does not meet security requirements.',
    action: 'Use at least 8 characters with a mix of letters, numbers, and symbols.'
  },

  // Authentication errors
  UNAUTHORIZED: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons.',
    action: 'Please sign in again to continue.'
  },
  INVALID_CREDENTIALS: {
    title: 'Sign In Failed',
    message: 'The email or password you entered is incorrect.',
    action: 'Check your credentials and try again, or reset your password.'
  },
  ACCOUNT_LOCKED: {
    title: 'Account Locked',
    message: 'Your account has been temporarily locked due to multiple failed attempts.',
    action: 'Please wait 30 minutes or contact support.'
  },

  // Resource errors
  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested item could not be found.',
    action: 'The item may have been moved or deleted.'
  },
  CONFLICT: {
    title: 'Conflict Detected',
    message: 'This action conflicts with the current state.',
    action: 'Refresh the page and try again.'
  },

  // Rate limiting
  RATE_LIMITED: {
    title: 'Too Many Requests',
    message: 'You have made too many requests in a short time.',
    action: 'Please wait a moment before trying again.'
  },

  // Server errors
  INTERNAL_SERVER_ERROR: {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected problem.',
    action: 'Please try again later. If the problem persists, contact support.'
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Temporarily Unavailable',
    message: 'We are experiencing high demand or performing maintenance.',
    action: 'Please try again in a few minutes.'
  },
  MAINTENANCE: {
    title: 'Scheduled Maintenance',
    message: 'We are currently performing scheduled maintenance.',
    action: 'Service will be restored shortly. Thank you for your patience.'
  }
};

function getUserFriendlyError(errorCode, locale = 'en') {
  const template = errorMessages[errorCode] || errorMessages.INTERNAL_SERVER_ERROR;

  return {
    code: errorCode,
    ...template,
    supportLink: 'https://support.example.com/help',
    supportEmail: 'support@example.com'
  };
}

// Middleware to transform errors for client responses
function clientErrorTransformer(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // Get user-friendly message
  const userError = getUserFriendlyError(errorCode, req.acceptsLanguages('en', 'es', 'fr'));

  // Build response
  const response = {
    error: {
      code: errorCode,
      title: userError.title,
      message: userError.message,
      action: userError.action,
      requestId: req.id,
      timestamp: new Date().toISOString()
    }
  };

  // Add validation details if present
  if (err.validationErrors) {
    response.error.fields = err.validationErrors.map(ve => ({
      field: ve.field,
      message: getFieldErrorMessage(ve.field, ve.code)
    }));
  }

  // Add support info for server errors
  if (statusCode >= 500) {
    response.error.support = {
      link: userError.supportLink,
      email: userError.supportEmail,
      reference: req.id
    };
  }

  res.status(statusCode).json(response);
}
```

### Localized Error Messages

```python
# Multi-language error messages
from enum import Enum
from dataclasses import dataclass
from typing import Dict, Optional

class ErrorCode(Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    RATE_LIMITED = "RATE_LIMITED"

@dataclass
class LocalizedMessage:
    title: str
    message: str
    action: str

# Error messages by locale
ERROR_MESSAGES: Dict[str, Dict[ErrorCode, LocalizedMessage]] = {
    "en": {
        ErrorCode.VALIDATION_ERROR: LocalizedMessage(
            title="Invalid Input",
            message="Please check your input and try again.",
            action="Review the highlighted fields."
        ),
        ErrorCode.NOT_FOUND: LocalizedMessage(
            title="Not Found",
            message="The requested resource could not be found.",
            action="Check the URL or go back to the previous page."
        ),
        ErrorCode.UNAUTHORIZED: LocalizedMessage(
            title="Access Denied",
            message="You need to sign in to access this resource.",
            action="Please sign in and try again."
        ),
        ErrorCode.INTERNAL_ERROR: LocalizedMessage(
            title="Something Went Wrong",
            message="We encountered an unexpected problem.",
            action="Please try again later."
        ),
        ErrorCode.RATE_LIMITED: LocalizedMessage(
            title="Too Many Requests",
            message="You've made too many requests.",
            action="Please wait a moment before trying again."
        )
    },
    "es": {
        ErrorCode.VALIDATION_ERROR: LocalizedMessage(
            title="Entrada no valida",
            message="Por favor revise su entrada e intente de nuevo.",
            action="Revise los campos resaltados."
        ),
        ErrorCode.NOT_FOUND: LocalizedMessage(
            title="No encontrado",
            message="El recurso solicitado no pudo ser encontrado.",
            action="Verifique la URL o regrese a la pagina anterior."
        ),
        # ... more translations
    }
}

def get_user_error(
    error_code: ErrorCode,
    locale: str = "en",
    field_errors: Optional[list] = None
) -> dict:
    """Get user-friendly error message"""
    messages = ERROR_MESSAGES.get(locale, ERROR_MESSAGES["en"])
    error_msg = messages.get(error_code, messages[ErrorCode.INTERNAL_ERROR])

    result = {
        "code": error_code.value,
        "title": error_msg.title,
        "message": error_msg.message,
        "action": error_msg.action
    }

    if field_errors:
        result["fields"] = field_errors

    return result
```

## Best Practices Summary

### Error Handling Checklist

```
Do's:
- Use specific error types for different error scenarios
- Include request IDs in all error responses
- Log errors with sufficient context for debugging
- Implement circuit breakers for external dependencies
- Provide user-friendly messages without technical details
- Monitor error rates and set up alerting
- Use retry logic with exponential backoff for transient failures
- Sanitize error messages before logging or returning to clients

Don'ts:
- Don't expose stack traces in production responses
- Don't log sensitive data (passwords, tokens, PII)
- Don't swallow errors silently
- Don't use generic catch-all error messages internally
- Don't retry non-idempotent operations without care
- Don't ignore operational errors
- Don't mix error handling logic with business logic
```

### Error Handling Architecture

```
+-----------------------------------------------------------------+
|                        Client Request                            |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                     Request Middleware                           |
|  - Add request ID                                                |
|  - Start timing                                                  |
|  - Initialize error context                                      |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                      Route Handler                               |
|  - Business logic                                                |
|  - Throw specific errors                                         |
|  - Use async wrapper                                             |
+-----------------------------------------------------------------+
                                |
                        Error Thrown?
                                |
                    +-----------+-----------+
                    | Yes                   | No
                    v                       v
+------------------------------+    +----------------------+
|    Error Handler Middleware   |    |   Success Response    |
|  - Classify error             |    +----------------------+
|  - Log with context           |
|  - Record metrics             |
|  - Format response            |
|  - Send to error tracker      |
+------------------------------+
                    |
                    v
+-----------------------------------------------------------------+
|                     Error Response                               |
|  - Consistent format                                             |
|  - User-friendly message                                         |
|  - Request ID for support                                        |
|  - Appropriate status code                                       |
+-----------------------------------------------------------------+
```

## Interview Key Points

### Common Interview Questions

1. **How do you distinguish between operational and programming errors?**
   - Operational errors are expected failures (network issues, invalid input)
   - Programming errors are bugs that should be fixed in code
   - Operational errors should be handled gracefully; programming errors should crash and restart

2. **What information should be included in error logs?**
   - Timestamp, error type, message, stack trace
   - Request ID, user ID, IP address
   - Request path, method, relevant parameters
   - Never log sensitive data like passwords or tokens

3. **How do you implement graceful degradation?**
   - Circuit breaker pattern for external services
   - Fallback mechanisms (cache, default values)
   - Retry logic with exponential backoff
   - Feature flags to disable problematic features

4. **What's the difference between error handling and exception handling?**
   - Error handling is the broader strategy for managing failures
   - Exception handling is the specific mechanism for catching thrown errors
   - Good error handling includes prevention, detection, and recovery

5. **How do you balance detailed errors for developers vs. security?**
   - Use different response formats for development and production
   - Include request IDs for correlation
   - Log full details server-side, return minimal info to clients
   - Never expose stack traces or internal paths in production

## Further Reading

### Official Documentation

- [Node.js Error Handling](https://nodejs.org/api/errors.html)
- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Python Exception Handling](https://docs.python.org/3/tutorial/errors.html)
- [Spring Boot Exception Handling](https://spring.io/guides/tutorials/rest/)

### Recommended Resources

- [The Twelve-Factor App - Logs](https://12factor.net/logs)
- [Microsoft REST API Guidelines - Errors](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md#7102-error-condition-responses)
- [Google API Design Guide - Errors](https://cloud.google.com/apis/design/errors)

### Related Topics

- **Logging**: Structured logging and log management
- **Monitoring**: Application performance monitoring and alerting
- **Resilience Patterns**: Circuit breakers, bulkheads, and timeouts
- **API Design**: RESTful error responses and status codes

---

Effective error handling is not an afterthought but a core architectural concern. By implementing comprehensive error handling strategies, you create applications that are more reliable, easier to debug, and provide better user experiences. Remember that good error handling is about prevention as much as it is about recovery. Invest in proper error handling infrastructure early, and it will pay dividends throughout the lifecycle of your application.
