---
title: 后端错误处理
description: 学习后端错误处理的模式和最佳实践
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - 错误处理
  - 异常
  - 日志
  - 监控
status: imported
origin: old/src/content/docs/backend/error-handling.zh.md
divergence: 0.144
issues: []
legacy:
  category: Backend
  subcategory: Patterns
  order: 33
  lastUpdated: 2026-01-07
---

错误处理是构建健壮后端系统的基石。一个设计良好的错误处理策略不仅能帮助开发者快速定位问题，还能为用户提供清晰的反馈，确保系统在异常情况下优雅降级。本文将深入探讨错误类型、错误响应设计、集中式错误处理、日志记录、监控告警、优雅降级以及用户友好消息等核心主题。

## 错误类型分类

### 错误类型概览

在后端系统中，错误可以按照不同维度进行分类，理解这些分类有助于制定针对性的处理策略。

```
错误类型分类：
┌─────────────────────────────────────────────────────────────────────────┐
│ 按来源分类                                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ 客户端错误  │ 请求参数错误、认证失败、权限不足、资源不存在              │
│ 服务端错误  │ 代码异常、依赖服务故障、资源耗尽、配置错误                │
│ 外部错误    │ 第三方 API 失败、网络超时、数据库连接失败                 │
├─────────────────────────────────────────────────────────────────────────┤
│ 按可恢复性分类                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 可恢复错误  │ 临时性故障，重试后可能成功（网络抖动、限流）              │
│ 不可恢复错误│ 永久性故障，需要人工介入（配置错误、数据损坏）            │
├─────────────────────────────────────────────────────────────────────────┤
│ 按严重程度分类                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 致命错误    │ 系统无法继续运行，需要立即处理                            │
│ 严重错误    │ 核心功能受损，需要尽快处理                                │
│ 警告错误    │ 非核心功能异常，可以延后处理                              │
│ 信息性错误  │ 预期内的业务异常，正常处理即可                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 自定义错误类型体系

建立统一的错误类型体系是错误处理的基础。

```typescript
// 基础错误类
abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

// 客户端错误基类（4xx）
abstract class ClientError extends AppError {
  readonly isOperational = true;
}

// 服务端错误基类（5xx）
abstract class ServerError extends AppError {
  readonly isOperational = false;
}

// 具体错误类型实现
class ValidationError extends ClientError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';

  constructor(
    message: string,
    public readonly fields: Record<string, string[]>
  ) {
    super(message, { fields });
  }
}

class AuthenticationError extends ClientError {
  readonly statusCode = 401;
  readonly errorCode = 'AUTHENTICATION_ERROR';
}

class AuthorizationError extends ClientError {
  readonly statusCode = 403;
  readonly errorCode = 'AUTHORIZATION_ERROR';
}

class NotFoundError extends ClientError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';

  constructor(resource: string, identifier: string | number) {
    super(`${resource} not found: ${identifier}`, { resource, identifier });
  }
}

class ConflictError extends ClientError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT';
}

class RateLimitError extends ClientError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_EXCEEDED';

  constructor(
    public readonly retryAfter: number
  ) {
    super('Rate limit exceeded', { retryAfter });
  }
}

class InternalServerError extends ServerError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_SERVER_ERROR';
  readonly isOperational = false;
}

class ServiceUnavailableError extends ServerError {
  readonly statusCode = 503;
  readonly errorCode = 'SERVICE_UNAVAILABLE';
  readonly isOperational = true; // 临时性故障，可恢复

  constructor(
    service: string,
    public readonly retryAfter?: number
  ) {
    super(`Service unavailable: ${service}`, { service, retryAfter });
  }
}
```

### Python 错误类型体系

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from enum import Enum
import traceback

class ErrorSeverity(Enum):
    """错误严重程度"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ErrorContext:
    """错误上下文信息"""
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    trace_id: Optional[str] = None
    additional_data: Dict[str, Any] = field(default_factory=dict)


class AppError(Exception, ABC):
    """应用错误基类"""

    def __init__(
        self,
        message: str,
        context: Optional[ErrorContext] = None,
        cause: Optional[Exception] = None
    ):
        super().__init__(message)
        self.message = message
        self.context = context or ErrorContext()
        self.cause = cause
        self.stack_trace = traceback.format_exc()

    @property
    @abstractmethod
    def status_code(self) -> int:
        pass

    @property
    @abstractmethod
    def error_code(self) -> str:
        pass

    @property
    @abstractmethod
    def is_operational(self) -> bool:
        """是否为操作性错误（预期内的错误）"""
        pass

    @property
    def severity(self) -> ErrorSeverity:
        """错误严重程度"""
        return ErrorSeverity.MEDIUM

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.error_code,
            "message": self.message,
            "status_code": self.status_code,
            "context": {
                "request_id": self.context.request_id,
                "trace_id": self.context.trace_id,
            }
        }


class ValidationError(AppError):
    """验证错误"""

    def __init__(
        self,
        message: str,
        field_errors: Dict[str, List[str]] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        self.field_errors = field_errors or {}

    @property
    def status_code(self) -> int:
        return 400

    @property
    def error_code(self) -> str:
        return "VALIDATION_ERROR"

    @property
    def is_operational(self) -> bool:
        return True

    def to_dict(self) -> Dict[str, Any]:
        result = super().to_dict()
        result["field_errors"] = self.field_errors
        return result


class NotFoundError(AppError):
    """资源不存在错误"""

    def __init__(self, resource: str, identifier: Any, **kwargs):
        message = f"{resource} not found: {identifier}"
        super().__init__(message, **kwargs)
        self.resource = resource
        self.identifier = identifier

    @property
    def status_code(self) -> int:
        return 404

    @property
    def error_code(self) -> str:
        return "NOT_FOUND"

    @property
    def is_operational(self) -> bool:
        return True


class AuthenticationError(AppError):
    """认证错误"""

    @property
    def status_code(self) -> int:
        return 401

    @property
    def error_code(self) -> str:
        return "AUTHENTICATION_ERROR"

    @property
    def is_operational(self) -> bool:
        return True


class AuthorizationError(AppError):
    """授权错误"""

    @property
    def status_code(self) -> int:
        return 403

    @property
    def error_code(self) -> str:
        return "AUTHORIZATION_ERROR"

    @property
    def is_operational(self) -> bool:
        return True


class ExternalServiceError(AppError):
    """外部服务错误"""

    def __init__(
        self,
        service_name: str,
        original_error: Optional[str] = None,
        **kwargs
    ):
        message = f"External service error: {service_name}"
        super().__init__(message, **kwargs)
        self.service_name = service_name
        self.original_error = original_error

    @property
    def status_code(self) -> int:
        return 502

    @property
    def error_code(self) -> str:
        return "EXTERNAL_SERVICE_ERROR"

    @property
    def is_operational(self) -> bool:
        return True  # 外部服务故障是可预期的

    @property
    def severity(self) -> ErrorSeverity:
        return ErrorSeverity.HIGH


class InternalServerError(AppError):
    """内部服务器错误"""

    @property
    def status_code(self) -> int:
        return 500

    @property
    def error_code(self) -> str:
        return "INTERNAL_SERVER_ERROR"

    @property
    def is_operational(self) -> bool:
        return False  # 非预期错误

    @property
    def severity(self) -> ErrorSeverity:
        return ErrorSeverity.CRITICAL
```

## 错误响应设计

### 统一错误响应格式

设计一致的错误响应格式，便于客户端统一处理。

```typescript
// 标准错误响应接口
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // 机器可读的错误代码
    message: string;        // 人类可读的错误消息
    details?: unknown;      // 详细错误信息（可选）
    timestamp: string;      // ISO 8601 时间戳
    requestId: string;      // 请求追踪 ID
    path: string;           // 请求路径
    documentation?: string; // 文档链接（可选）
  };
}

// 验证错误响应
interface ValidationErrorResponse extends ErrorResponse {
  error: ErrorResponse['error'] & {
    details: {
      fields: {
        field: string;
        message: string;
        code: string;
        value?: unknown;
      }[];
    };
  };
}

// 错误响应构建器
class ErrorResponseBuilder {
  private response: ErrorResponse;

  constructor(
    private readonly requestId: string,
    private readonly path: string
  ) {
    this.response = {
      success: false,
      error: {
        code: '',
        message: '',
        timestamp: new Date().toISOString(),
        requestId: this.requestId,
        path: this.path,
      },
    };
  }

  setError(error: AppError): this {
    this.response.error.code = error.errorCode;
    this.response.error.message = error.message;
    return this;
  }

  setDetails(details: unknown): this {
    this.response.error.details = details;
    return this;
  }

  setDocumentation(url: string): this {
    this.response.error.documentation = url;
    return this;
  }

  build(): ErrorResponse {
    return this.response;
  }
}
```

### HTTP 状态码映射

```typescript
// HTTP 状态码与错误类型映射
const HTTP_STATUS_CODES = {
  // 客户端错误 (4xx)
  400: {
    name: 'Bad Request',
    description: '请求参数错误或格式不正确',
    retryable: false,
  },
  401: {
    name: 'Unauthorized',
    description: '身份认证失败或未提供认证信息',
    retryable: false,
  },
  403: {
    name: 'Forbidden',
    description: '没有权限访问该资源',
    retryable: false,
  },
  404: {
    name: 'Not Found',
    description: '请求的资源不存在',
    retryable: false,
  },
  409: {
    name: 'Conflict',
    description: '请求与当前资源状态冲突',
    retryable: false,
  },
  422: {
    name: 'Unprocessable Entity',
    description: '请求格式正确但语义错误',
    retryable: false,
  },
  429: {
    name: 'Too Many Requests',
    description: '请求频率超过限制',
    retryable: true,
    headers: ['Retry-After', 'X-RateLimit-Reset'],
  },

  // 服务端错误 (5xx)
  500: {
    name: 'Internal Server Error',
    description: '服务器内部错误',
    retryable: false,
  },
  502: {
    name: 'Bad Gateway',
    description: '上游服务响应错误',
    retryable: true,
  },
  503: {
    name: 'Service Unavailable',
    description: '服务暂时不可用',
    retryable: true,
    headers: ['Retry-After'],
  },
  504: {
    name: 'Gateway Timeout',
    description: '上游服务响应超时',
    retryable: true,
  },
} as const;

// 错误响应辅助函数
function createErrorResponse(
  error: AppError,
  requestContext: { requestId: string; path: string }
): { status: number; body: ErrorResponse; headers: Record<string, string> } {
  const builder = new ErrorResponseBuilder(
    requestContext.requestId,
    requestContext.path
  );

  const response = builder.setError(error);

  // 添加错误详情
  if (error instanceof ValidationError) {
    response.setDetails({ fields: error.fields });
  }

  // 构建响应头
  const headers: Record<string, string> = {};

  if (error instanceof RateLimitError) {
    headers['Retry-After'] = String(error.retryAfter);
    headers['X-RateLimit-Reset'] = String(Date.now() + error.retryAfter * 1000);
  }

  return {
    status: error.statusCode,
    body: response.build(),
    headers,
  };
}
```

### 错误响应示例

```json
// 验证错误响应示例
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "邮箱格式不正确",
          "code": "INVALID_EMAIL",
          "value": "invalid-email"
        },
        {
          "field": "password",
          "message": "密码长度至少为8位",
          "code": "MIN_LENGTH",
          "value": "***"
        }
      ]
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_abc123xyz",
    "path": "/api/v1/users/register",
    "documentation": "https://api.example.com/docs/errors#VALIDATION_ERROR"
  }
}

// 认证错误响应示例
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "身份认证失败，请重新登录",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_def456uvw",
    "path": "/api/v1/users/profile"
  }
}

// 服务不可用响应示例
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "服务暂时不可用，请稍后重试",
    "details": {
      "retryAfter": 30,
      "reason": "数据库维护中"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_ghi789rst",
    "path": "/api/v1/orders"
  }
}
```

## 集中式错误处理

### Express.js 错误处理中间件

```typescript
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

// 请求上下文中间件
function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

// 异步处理器包装
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 全局错误处理中间件
const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestContext = {
    requestId: req.requestId || 'unknown',
    path: req.path,
  };

  // 处理已知的应用错误
  if (err instanceof AppError) {
    const { status, body, headers } = createErrorResponse(err, requestContext);

    // 记录操作性错误（警告级别）
    if (err.isOperational) {
      logger.warn('Operational error occurred', {
        error: err.toJSON(),
        requestId: requestContext.requestId,
        path: requestContext.path,
        method: req.method,
        duration: Date.now() - (req.startTime || 0),
      });
    } else {
      // 记录非操作性错误（错误级别）
      logger.error('Non-operational error occurred', {
        error: err.toJSON(),
        stack: err.stack,
        requestId: requestContext.requestId,
        path: requestContext.path,
        method: req.method,
      });
    }

    // 设置响应头
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(status).json(body);
  }

  // 处理验证库错误（如 Joi、Zod）
  if (err.name === 'ZodError') {
    const zodError = err as any;
    const validationError = new ValidationError(
      '请求参数验证失败',
      formatZodErrors(zodError.errors)
    );
    const { status, body } = createErrorResponse(validationError, requestContext);
    return res.status(status).json(body);
  }

  // 处理 JSON 解析错误
  if (err instanceof SyntaxError && 'body' in err) {
    const validationError = new ValidationError('请求体 JSON 格式错误', {
      body: ['Invalid JSON syntax'],
    });
    const { status, body } = createErrorResponse(validationError, requestContext);
    return res.status(status).json(body);
  }

  // 处理未知错误
  logger.error('Unhandled error', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    requestId: requestContext.requestId,
    path: requestContext.path,
    method: req.method,
  });

  // 生产环境不暴露内部错误信息
  const internalError = new InternalServerError(
    process.env.NODE_ENV === 'production'
      ? '服务器内部错误，请稍后重试'
      : err.message
  );

  const { status, body } = createErrorResponse(internalError, requestContext);
  return res.status(status).json(body);
};

// 404 处理中间件
function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError('Route', `${req.method} ${req.path}`));
}

// 应用中间件
app.use(requestContextMiddleware);
app.use(express.json());
// ... 路由定义
app.use(notFoundHandler);
app.use(errorHandler);
```

### FastAPI 异常处理

```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uuid
import time
import logging
from typing import Union

app = FastAPI()
logger = logging.getLogger(__name__)


# 请求上下文中间件
@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    # 生成或获取请求 ID
    request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
    request.state.request_id = request_id
    request.state.start_time = time.time()

    response = await call_next(request)

    # 添加请求 ID 到响应头
    response.headers["X-Request-Id"] = request_id

    # 记录请求日志
    duration = time.time() - request.state.start_time
    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
        }
    )

    return response


def create_error_response(
    error: Union[AppError, Exception],
    request: Request
) -> dict:
    """创建统一错误响应"""
    request_id = getattr(request.state, "request_id", "unknown")

    if isinstance(error, AppError):
        return {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
                "requestId": request_id,
                "path": str(request.url.path),
                **error.to_dict().get("field_errors", {}),
            }
        }

    # 处理未知错误
    return {
        "success": False,
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "服务器内部错误" if app.debug else str(error),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "requestId": request_id,
            "path": str(request.url.path),
        }
    }


# 自定义异常处理器
@app.exception_handler(AppError)
async def app_error_handler(request: Request, error: AppError):
    """处理应用自定义错误"""
    request_id = getattr(request.state, "request_id", "unknown")

    # 记录日志
    if error.is_operational:
        logger.warning(
            f"Operational error: {error.error_code}",
            extra={
                "request_id": request_id,
                "error_code": error.error_code,
                "message": error.message,
                "path": request.url.path,
            }
        )
    else:
        logger.error(
            f"Non-operational error: {error.error_code}",
            extra={
                "request_id": request_id,
                "error_code": error.error_code,
                "message": error.message,
                "path": request.url.path,
                "stack_trace": error.stack_trace,
            }
        )

    return JSONResponse(
        status_code=error.status_code,
        content=create_error_response(error, request),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, error: RequestValidationError):
    """处理请求验证错误"""
    field_errors = {}

    for err in error.errors():
        field_name = ".".join(str(loc) for loc in err["loc"][1:])  # 跳过 'body'
        if field_name not in field_errors:
            field_errors[field_name] = []
        field_errors[field_name].append(err["msg"])

    validation_error = ValidationError(
        message="请求参数验证失败",
        field_errors=field_errors,
    )

    return JSONResponse(
        status_code=400,
        content=create_error_response(validation_error, request),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, error: StarletteHTTPException):
    """处理 HTTP 异常"""
    return JSONResponse(
        status_code=error.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{error.status_code}",
                "message": error.detail,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
                "requestId": getattr(request.state, "request_id", "unknown"),
                "path": str(request.url.path),
            }
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, error: Exception):
    """处理未捕获的异常"""
    request_id = getattr(request.state, "request_id", "unknown")

    logger.exception(
        "Unhandled exception occurred",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
        }
    )

    internal_error = InternalServerError("服务器内部错误，请稍后重试")

    return JSONResponse(
        status_code=500,
        content=create_error_response(internal_error, request),
    )
```

### Go Gin 错误处理

```go
package middleware

import (
    "fmt"
    "net/http"
    "runtime/debug"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "go.uber.org/zap"
)

// AppError 应用错误接口
type AppError interface {
    error
    StatusCode() int
    ErrorCode() string
    IsOperational() bool
    ToJSON() map[string]interface{}
}

// BaseError 基础错误结构
type BaseError struct {
    Message     string                 `json:"message"`
    Code        string                 `json:"code"`
    Status      int                    `json:"status"`
    Operational bool                   `json:"operational"`
    Context     map[string]interface{} `json:"context,omitempty"`
}

func (e *BaseError) Error() string           { return e.Message }
func (e *BaseError) StatusCode() int         { return e.Status }
func (e *BaseError) ErrorCode() string       { return e.Code }
func (e *BaseError) IsOperational() bool     { return e.Operational }
func (e *BaseError) ToJSON() map[string]interface{} {
    return map[string]interface{}{
        "code":    e.Code,
        "message": e.Message,
        "context": e.Context,
    }
}

// 预定义错误构造函数
func NewValidationError(message string, fields map[string][]string) *BaseError {
    return &BaseError{
        Message:     message,
        Code:        "VALIDATION_ERROR",
        Status:      http.StatusBadRequest,
        Operational: true,
        Context:     map[string]interface{}{"fields": fields},
    }
}

func NewNotFoundError(resource, identifier string) *BaseError {
    return &BaseError{
        Message:     fmt.Sprintf("%s not found: %s", resource, identifier),
        Code:        "NOT_FOUND",
        Status:      http.StatusNotFound,
        Operational: true,
        Context:     map[string]interface{}{"resource": resource, "identifier": identifier},
    }
}

func NewAuthenticationError(message string) *BaseError {
    return &BaseError{
        Message:     message,
        Code:        "AUTHENTICATION_ERROR",
        Status:      http.StatusUnauthorized,
        Operational: true,
    }
}

func NewInternalError(message string) *BaseError {
    return &BaseError{
        Message:     message,
        Code:        "INTERNAL_SERVER_ERROR",
        Status:      http.StatusInternalServerError,
        Operational: false,
    }
}

// ErrorResponse 统一错误响应结构
type ErrorResponse struct {
    Success bool `json:"success"`
    Error   struct {
        Code      string                 `json:"code"`
        Message   string                 `json:"message"`
        Details   map[string]interface{} `json:"details,omitempty"`
        Timestamp string                 `json:"timestamp"`
        RequestID string                 `json:"requestId"`
        Path      string                 `json:"path"`
    } `json:"error"`
}

// RequestContextMiddleware 请求上下文中间件
func RequestContextMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        requestID := c.GetHeader("X-Request-Id")
        if requestID == "" {
            requestID = uuid.New().String()
        }

        c.Set("requestId", requestID)
        c.Set("startTime", time.Now())
        c.Header("X-Request-Id", requestID)

        c.Next()
    }
}

// ErrorHandlerMiddleware 全局错误处理中间件
func ErrorHandlerMiddleware(logger *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if r := recover(); r != nil {
                // 处理 panic
                logger.Error("Panic recovered",
                    zap.Any("panic", r),
                    zap.String("stack", string(debug.Stack())),
                    zap.String("requestId", c.GetString("requestId")),
                    zap.String("path", c.Request.URL.Path),
                )

                respondWithError(c, NewInternalError("服务器内部错误"))
            }
        }()

        c.Next()

        // 检查是否有错误
        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err
            handleError(c, err, logger)
        }
    }
}

func handleError(c *gin.Context, err error, logger *zap.Logger) {
    requestID := c.GetString("requestId")

    // 处理应用错误
    if appErr, ok := err.(AppError); ok {
        if appErr.IsOperational() {
            logger.Warn("Operational error",
                zap.String("code", appErr.ErrorCode()),
                zap.String("message", appErr.Error()),
                zap.String("requestId", requestID),
                zap.String("path", c.Request.URL.Path),
            )
        } else {
            logger.Error("Non-operational error",
                zap.String("code", appErr.ErrorCode()),
                zap.String("message", appErr.Error()),
                zap.String("requestId", requestID),
                zap.String("path", c.Request.URL.Path),
            )
        }

        respondWithError(c, appErr)
        return
    }

    // 处理未知错误
    logger.Error("Unknown error",
        zap.Error(err),
        zap.String("requestId", requestID),
        zap.String("path", c.Request.URL.Path),
    )

    respondWithError(c, NewInternalError("服务器内部错误"))
}

func respondWithError(c *gin.Context, appErr AppError) {
    response := ErrorResponse{
        Success: false,
    }
    response.Error.Code = appErr.ErrorCode()
    response.Error.Message = appErr.Error()
    response.Error.Timestamp = time.Now().UTC().Format(time.RFC3339)
    response.Error.RequestID = c.GetString("requestId")
    response.Error.Path = c.Request.URL.Path

    if details := appErr.ToJSON()["context"]; details != nil {
        response.Error.Details = details.(map[string]interface{})
    }

    c.AbortWithStatusJSON(appErr.StatusCode(), response)
}

// 路由处理器示例
func GetUserHandler(c *gin.Context) {
    userID := c.Param("id")

    user, err := userService.GetByID(userID)
    if err != nil {
        c.Error(err) // 将错误传递给中间件处理
        return
    }

    if user == nil {
        c.Error(NewNotFoundError("User", userID))
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    user,
    })
}
```

## 日志记录策略

### 错误日志结构化

```typescript
import winston from 'winston';

// 自定义错误日志格式
const errorFormat = winston.format((info) => {
  if (info.error instanceof Error) {
    info.error = {
      name: info.error.name,
      message: info.error.message,
      stack: info.error.stack,
      ...(info.error instanceof AppError ? info.error.toJSON() : {}),
    };
  }
  return info;
});

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    errorFormat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'api-service',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

// 错误日志辅助函数
interface ErrorLogContext {
  requestId: string;
  userId?: string;
  path: string;
  method: string;
  duration?: number;
  userAgent?: string;
  ip?: string;
}

function logError(
  error: Error,
  context: ErrorLogContext,
  additionalData?: Record<string, unknown>
) {
  const logData = {
    error,
    ...context,
    ...additionalData,
  };

  if (error instanceof AppError) {
    if (error.isOperational) {
      logger.warn('Operational error', logData);
    } else {
      logger.error('System error', logData);
    }
  } else {
    logger.error('Unhandled error', logData);
  }
}

// 使用示例
logError(
  new NotFoundError('User', '12345'),
  {
    requestId: 'req_abc123',
    userId: 'user_001',
    path: '/api/users/12345',
    method: 'GET',
    duration: 45,
    ip: '192.168.1.1',
  }
);
```

### 日志输出示例

```json
// 操作性错误日志
{
  "level": "warn",
  "message": "Operational error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "api-service",
  "environment": "production",
  "version": "1.2.3",
  "error": {
    "name": "NotFoundError",
    "message": "User not found: 12345",
    "errorCode": "NOT_FOUND",
    "statusCode": 404,
    "context": {
      "resource": "User",
      "identifier": "12345"
    }
  },
  "requestId": "req_abc123",
  "userId": "user_001",
  "path": "/api/users/12345",
  "method": "GET",
  "duration": 45,
  "ip": "192.168.1.1"
}

// 系统错误日志
{
  "level": "error",
  "message": "System error",
  "timestamp": "2024-01-15T10:31:00.000Z",
  "service": "api-service",
  "environment": "production",
  "version": "1.2.3",
  "error": {
    "name": "InternalServerError",
    "message": "Database connection failed",
    "errorCode": "INTERNAL_SERVER_ERROR",
    "statusCode": 500,
    "stack": "Error: Database connection failed\n    at DatabasePool.getConnection (/app/src/db/pool.js:45:15)\n    ..."
  },
  "requestId": "req_def456",
  "path": "/api/orders",
  "method": "POST",
  "duration": 5023
}
```

### 敏感信息脱敏

```typescript
// 敏感字段列表
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'creditCard',
  'ssn',
  'authorization',
];

// 脱敏函数
function maskSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 10) return obj; // 防止无限递归

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
        // 脱敏敏感字段
        if (typeof value === 'string') {
          masked[key] = value.length > 4
            ? `${value.slice(0, 2)}***${value.slice(-2)}`
            : '***';
        } else {
          masked[key] = '***';
        }
      } else {
        masked[key] = maskSensitiveData(value, depth + 1);
      }
    }

    return masked;
  }

  return obj;
}

// 日志中间件中应用脱敏
const safeLogFormat = winston.format((info) => {
  return maskSensitiveData(info) as winston.Logform.TransformableInfo;
});
```

## 监控与告警

### 错误指标收集

```typescript
import { Counter, Histogram, Registry } from 'prom-client';

// 创建指标注册表
const register = new Registry();

// 错误计数器
const errorCounter = new Counter({
  name: 'app_errors_total',
  help: 'Total number of errors',
  labelNames: ['error_code', 'error_type', 'path', 'method'],
  registers: [register],
});

// 错误响应时间直方图
const errorLatencyHistogram = new Histogram({
  name: 'app_error_latency_seconds',
  help: 'Error response latency in seconds',
  labelNames: ['error_code', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// 记录错误指标
function recordErrorMetrics(
  error: AppError,
  context: { path: string; method: string; duration: number }
) {
  errorCounter.inc({
    error_code: error.errorCode,
    error_type: error.isOperational ? 'operational' : 'system',
    path: context.path,
    method: context.method,
  });

  errorLatencyHistogram.observe(
    {
      error_code: error.errorCode,
      path: context.path,
    },
    context.duration / 1000
  );
}

// 在错误处理中间件中使用
const errorHandlerWithMetrics: ErrorRequestHandler = (err, req, res, next) => {
  const duration = Date.now() - (req.startTime || 0);

  if (err instanceof AppError) {
    recordErrorMetrics(err, {
      path: req.route?.path || req.path,
      method: req.method,
      duration,
    });
  }

  // 继续原有的错误处理逻辑
  errorHandler(err, req, res, next);
};
```

### 告警规则配置

```yaml
# Prometheus 告警规则
groups:
  - name: application_errors
    rules:
      # 高错误率告警
      - alert: HighErrorRate
        expr: |
          sum(rate(app_errors_total{error_type="system"}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "高错误率告警"
          description: "系统错误率超过 1%，当前值: {{ $value | humanizePercentage }}"

      # 特定错误码激增告警
      - alert: ErrorCodeSpike
        expr: |
          increase(app_errors_total{error_code="INTERNAL_SERVER_ERROR"}[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "内部错误激增"
          description: "5分钟内内部服务器错误超过 10 次"

      # 认证错误异常告警（可能的攻击）
      - alert: AuthenticationErrorSpike
        expr: |
          increase(app_errors_total{error_code="AUTHENTICATION_ERROR"}[5m]) > 50
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "认证错误激增"
          description: "5分钟内认证失败超过 50 次，可能存在暴力破解攻击"

      # 错误响应延迟告警
      - alert: HighErrorLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(app_error_latency_seconds_bucket[5m])) by (le, error_code)
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "错误响应延迟过高"
          description: "错误码 {{ $labels.error_code }} 的 P95 响应时间超过 2 秒"

      # 服务不可用告警
      - alert: ServiceUnavailable
        expr: |
          increase(app_errors_total{error_code="SERVICE_UNAVAILABLE"}[1m]) > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务不可用"
          description: "服务在 1 分钟内返回 5 次以上的 503 错误"
```

### 错误追踪集成

```typescript
import * as Sentry from '@sentry/node';

// 初始化 Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,

  // 采样率配置
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 过滤敏感信息
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },

  // 只上报非操作性错误
  beforeSendTransaction(event) {
    return event;
  },
});

// 增强的错误上报函数
function reportError(
  error: Error,
  context: {
    requestId: string;
    userId?: string;
    path: string;
    method: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  // 操作性错误不上报到 Sentry（减少噪音）
  if (error instanceof AppError && error.isOperational) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag('request_id', context.requestId);
    scope.setTag('path', context.path);
    scope.setTag('method', context.method);

    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context.extra) {
      scope.setExtras(context.extra);
    }

    if (error instanceof AppError) {
      scope.setTag('error_code', error.errorCode);
      scope.setLevel('error');
    } else {
      scope.setLevel('fatal');
    }

    Sentry.captureException(error);
  });
}

// Express 错误处理中集成 Sentry
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
// ... 路由
app.use(Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // 只处理非操作性错误
    if (error instanceof AppError) {
      return !error.isOperational;
    }
    return true;
  },
}));
app.use(errorHandler);
```

## 优雅降级策略

### 断路器模式

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerOptions {
  failureThreshold: number;      // 触发断路的失败次数
  successThreshold: number;      // 恢复正常的成功次数
  timeout: number;               // 断路后等待时间（毫秒）
  monitoringPeriod: number;      // 监控周期（毫秒）
}

class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private nextAttemptTime = 0;

  constructor(
    private readonly name: string,
    private readonly fn: () => Promise<T>,
    private readonly fallback: () => Promise<T>,
    private readonly options: CircuitBreakerOptions
  ) {}

  async execute(): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        // 断路器打开，直接返回降级结果
        logger.warn(`Circuit breaker ${this.name} is OPEN, using fallback`);
        return this.fallback();
      }
      // 尝试进入半开状态
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const result = await this.fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);

      if (this.state === CircuitState.OPEN) {
        return this.fallback();
      }
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(error: Error) {
    this.failures++;
    this.lastFailureTime = Date.now();

    logger.warn(`Circuit breaker ${this.name} failure`, {
      failures: this.failures,
      threshold: this.options.failureThreshold,
      error: error.message,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState) {
    const oldState = this.state;
    this.state = newState;

    logger.info(`Circuit breaker ${this.name} state change`, {
      from: oldState,
      to: newState,
    });

    if (newState === CircuitState.OPEN) {
      this.nextAttemptTime = Date.now() + this.options.timeout;
      this.successes = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.successes = 0;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// 使用示例
const paymentCircuitBreaker = new CircuitBreaker(
  'payment-service',
  async () => {
    return await paymentService.processPayment(order);
  },
  async () => {
    // 降级策略：将订单放入待处理队列
    await orderQueue.enqueue(order, { priority: 'high' });
    return {
      status: 'pending',
      message: '支付服务暂时不可用，订单已加入处理队列',
    };
  },
  {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    monitoringPeriod: 60000,
  }
);
```

### 重试策略

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

class RetryHandler {
  private readonly defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };

  async execute<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error | null = null;
    let delay = opts.baseDelay;

    for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // 检查是否可重试
        if (!this.isRetryable(error as Error, opts)) {
          throw error;
        }

        // 已达最大重试次数
        if (attempt > opts.maxRetries) {
          break;
        }

        // 计算下次重试延迟（指数退避 + 抖动）
        const jitter = Math.random() * 0.3 * delay;
        const actualDelay = Math.min(delay + jitter, opts.maxDelay);

        opts.onRetry?.(lastError, attempt, actualDelay);

        logger.warn('Retrying operation', {
          attempt,
          maxRetries: opts.maxRetries,
          delay: actualDelay,
          error: lastError.message,
        });

        await this.sleep(actualDelay);
        delay *= opts.backoffMultiplier;
      }
    }

    // 所有重试都失败
    throw new ServiceUnavailableError(
      'Operation failed after retries',
      opts.maxRetries
    );
  }

  private isRetryable(error: Error, options: RetryOptions): boolean {
    // 检查特定错误码
    if (options.retryableErrors && error instanceof AppError) {
      return options.retryableErrors.includes(error.errorCode);
    }

    // 默认可重试的错误
    if (error instanceof ServiceUnavailableError) return true;
    if (error.message.includes('ECONNREFUSED')) return true;
    if (error.message.includes('ETIMEDOUT')) return true;
    if (error.message.includes('ENOTFOUND')) return true;

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 使用示例
const retryHandler = new RetryHandler();

const result = await retryHandler.execute(
  async () => {
    return await externalApi.fetchData();
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    retryableErrors: ['SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT'],
    onRetry: (error, attempt, delay) => {
      logger.info(`Retry attempt ${attempt}, waiting ${delay}ms`, {
        error: error.message,
      });
    },
  }
);
```

### 降级响应策略

```typescript
// 降级策略接口
interface FallbackStrategy<T> {
  execute(error: Error, context: Record<string, unknown>): Promise<T>;
}

// 缓存降级策略
class CacheFallbackStrategy<T> implements FallbackStrategy<T> {
  constructor(
    private readonly cache: CacheService,
    private readonly keyGenerator: (context: Record<string, unknown>) => string
  ) {}

  async execute(error: Error, context: Record<string, unknown>): Promise<T> {
    const cacheKey = this.keyGenerator(context);
    const cachedData = await this.cache.get<T>(cacheKey);

    if (cachedData) {
      logger.info('Using cached data as fallback', { cacheKey });
      return cachedData;
    }

    throw new ServiceUnavailableError('Service unavailable and no cached data');
  }
}

// 默认值降级策略
class DefaultValueFallbackStrategy<T> implements FallbackStrategy<T> {
  constructor(private readonly defaultValue: T) {}

  async execute(): Promise<T> {
    logger.info('Using default value as fallback');
    return this.defaultValue;
  }
}

// 队列降级策略（异步处理）
class QueueFallbackStrategy<T> implements FallbackStrategy<T> {
  constructor(
    private readonly queue: MessageQueue,
    private readonly queueName: string,
    private readonly pendingResponse: T
  ) {}

  async execute(error: Error, context: Record<string, unknown>): Promise<T> {
    await this.queue.publish(this.queueName, {
      context,
      error: error.message,
      timestamp: Date.now(),
    });

    logger.info('Request queued for later processing', {
      queue: this.queueName,
      context,
    });

    return this.pendingResponse;
  }
}

// 降级服务
class DegradationService {
  private strategies: Map<string, FallbackStrategy<unknown>> = new Map();

  register<T>(name: string, strategy: FallbackStrategy<T>) {
    this.strategies.set(name, strategy);
  }

  async executeWithFallback<T>(
    name: string,
    primaryFn: () => Promise<T>,
    context: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      return await primaryFn();
    } catch (error) {
      const strategy = this.strategies.get(name);

      if (strategy) {
        logger.warn(`Primary operation failed, using fallback: ${name}`, {
          error: (error as Error).message,
        });
        return strategy.execute(error as Error, context) as Promise<T>;
      }

      throw error;
    }
  }
}

// 使用示例
const degradationService = new DegradationService();

// 注册降级策略
degradationService.register(
  'user-profile',
  new CacheFallbackStrategy<UserProfile>(
    cacheService,
    (ctx) => `user:profile:${ctx.userId}`
  )
);

degradationService.register(
  'recommendations',
  new DefaultValueFallbackStrategy<Recommendation[]>([])
);

// 使用降级服务
const profile = await degradationService.executeWithFallback(
  'user-profile',
  async () => await userService.getProfile(userId),
  { userId }
);
```

## 用户友好消息

### 错误消息国际化

```typescript
// 错误消息配置
interface ErrorMessages {
  [errorCode: string]: {
    title: string;
    message: string;
    suggestion?: string;
  };
}

const errorMessages: Record<string, ErrorMessages> = {
  'zh-CN': {
    VALIDATION_ERROR: {
      title: '请求参数错误',
      message: '提交的数据格式不正确，请检查后重试',
      suggestion: '请确保所有必填项已正确填写',
    },
    AUTHENTICATION_ERROR: {
      title: '身份认证失败',
      message: '您的登录已过期或凭证无效',
      suggestion: '请重新登录后继续操作',
    },
    AUTHORIZATION_ERROR: {
      title: '权限不足',
      message: '您没有权限执行此操作',
      suggestion: '如需访问权限，请联系管理员',
    },
    NOT_FOUND: {
      title: '资源不存在',
      message: '您请求的资源不存在或已被删除',
      suggestion: '请检查链接是否正确，或返回首页',
    },
    RATE_LIMIT_EXCEEDED: {
      title: '请求过于频繁',
      message: '您的请求频率超过了限制',
      suggestion: '请稍后再试',
    },
    INTERNAL_SERVER_ERROR: {
      title: '服务器错误',
      message: '服务器遇到了一些问题，我们正在处理',
      suggestion: '请稍后重试，或联系客服获取帮助',
    },
    SERVICE_UNAVAILABLE: {
      title: '服务暂时不可用',
      message: '系统正在维护中或暂时无法处理请求',
      suggestion: '请稍后再试',
    },
  },
  'en-US': {
    VALIDATION_ERROR: {
      title: 'Invalid Request',
      message: 'The submitted data format is incorrect',
      suggestion: 'Please ensure all required fields are filled correctly',
    },
    AUTHENTICATION_ERROR: {
      title: 'Authentication Failed',
      message: 'Your session has expired or credentials are invalid',
      suggestion: 'Please log in again to continue',
    },
    // ... 其他错误消息
  },
};

// 错误消息服务
class ErrorMessageService {
  private defaultLocale = 'zh-CN';

  getUserFriendlyMessage(
    errorCode: string,
    locale: string = this.defaultLocale
  ): {
    title: string;
    message: string;
    suggestion?: string;
  } {
    const messages = errorMessages[locale] || errorMessages[this.defaultLocale];

    return (
      messages[errorCode] || {
        title: '发生错误',
        message: '处理您的请求时出现了问题',
        suggestion: '请稍后重试',
      }
    );
  }

  formatValidationErrors(
    fieldErrors: Record<string, string[]>,
    locale: string = this.defaultLocale
  ): { field: string; messages: string[] }[] {
    const fieldLabels = this.getFieldLabels(locale);

    return Object.entries(fieldErrors).map(([field, messages]) => ({
      field: fieldLabels[field] || field,
      messages,
    }));
  }

  private getFieldLabels(locale: string): Record<string, string> {
    const labels: Record<string, Record<string, string>> = {
      'zh-CN': {
        email: '邮箱',
        password: '密码',
        username: '用户名',
        phone: '手机号',
        // ...
      },
      'en-US': {
        email: 'Email',
        password: 'Password',
        username: 'Username',
        phone: 'Phone Number',
        // ...
      },
    };

    return labels[locale] || labels[this.defaultLocale];
  }
}
```

### 客户端友好的错误响应

```typescript
// 增强的错误响应
interface UserFriendlyErrorResponse {
  success: false;
  error: {
    // 技术信息
    code: string;
    statusCode: number;
    requestId: string;
    timestamp: string;

    // 用户友好信息
    title: string;
    message: string;
    suggestion?: string;

    // 详细信息（可选）
    details?: {
      fields?: { field: string; messages: string[] }[];
      retryAfter?: number;
      documentationUrl?: string;
    };

    // 操作建议
    actions?: {
      type: 'retry' | 'redirect' | 'contact' | 'login';
      label: string;
      url?: string;
    }[];
  };
}

// 创建用户友好的错误响应
function createUserFriendlyResponse(
  error: AppError,
  requestContext: { requestId: string; path: string },
  locale: string = 'zh-CN'
): UserFriendlyErrorResponse {
  const messageService = new ErrorMessageService();
  const friendlyMessage = messageService.getUserFriendlyMessage(error.errorCode, locale);

  const response: UserFriendlyErrorResponse = {
    success: false,
    error: {
      code: error.errorCode,
      statusCode: error.statusCode,
      requestId: requestContext.requestId,
      timestamp: new Date().toISOString(),
      title: friendlyMessage.title,
      message: friendlyMessage.message,
      suggestion: friendlyMessage.suggestion,
    },
  };

  // 添加验证错误详情
  if (error instanceof ValidationError) {
    response.error.details = {
      fields: messageService.formatValidationErrors(error.fields, locale),
    };
  }

  // 添加限流信息
  if (error instanceof RateLimitError) {
    response.error.details = {
      retryAfter: error.retryAfter,
    };
  }

  // 添加操作建议
  response.error.actions = getRecommendedActions(error);

  return response;
}

function getRecommendedActions(error: AppError): UserFriendlyErrorResponse['error']['actions'] {
  const actions: UserFriendlyErrorResponse['error']['actions'] = [];

  switch (error.errorCode) {
    case 'AUTHENTICATION_ERROR':
      actions.push({ type: 'login', label: '重新登录', url: '/login' });
      break;
    case 'RATE_LIMIT_EXCEEDED':
    case 'SERVICE_UNAVAILABLE':
      actions.push({ type: 'retry', label: '稍后重试' });
      break;
    case 'AUTHORIZATION_ERROR':
      actions.push({ type: 'contact', label: '联系管理员' });
      break;
    case 'NOT_FOUND':
      actions.push({ type: 'redirect', label: '返回首页', url: '/' });
      break;
    default:
      actions.push({ type: 'retry', label: '重试' });
      actions.push({ type: 'contact', label: '联系客服' });
  }

  return actions;
}
```

### 错误提示 UI 组件示例

```typescript
// React 错误提示组件
interface ErrorAlertProps {
  error: UserFriendlyErrorResponse['error'];
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onRetry, onDismiss }) => {
  const getSeverityColor = (statusCode: number) => {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warning';
    return 'info';
  };

  return (
    <Alert
      severity={getSeverityColor(error.statusCode)}
      onClose={onDismiss}
    >
      <AlertTitle>{error.title}</AlertTitle>
      <Typography variant="body2">{error.message}</Typography>

      {error.suggestion && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {error.suggestion}
        </Typography>
      )}

      {error.details?.fields && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">请修正以下问题：</Typography>
          <ul>
            {error.details.fields.map(({ field, messages }) => (
              <li key={field}>
                <strong>{field}：</strong>
                {messages.join('，')}
              </li>
            ))}
          </ul>
        </Box>
      )}

      {error.details?.retryAfter && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          请在 {error.details.retryAfter} 秒后重试
        </Typography>
      )}

      {error.actions && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {error.actions.map((action, index) => (
            <Button
              key={index}
              size="small"
              variant={index === 0 ? 'contained' : 'outlined'}
              onClick={() => {
                if (action.type === 'retry') onRetry?.();
                else if (action.url) window.location.href = action.url;
              }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      )}

      <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
        错误代码：{error.code} | 请求 ID：{error.requestId}
      </Typography>
    </Alert>
  );
};
```

## 最佳实践总结

### 错误处理检查清单

```
后端错误处理检查清单：
┌─────────────────────────────────────────────────────────────────────────┐
│ 错误类型设计                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│ □ 建立统一的错误类型体系                                                  │
│ □ 区分操作性错误和系统错误                                                │
│ □ 为每种错误类型分配唯一的错误代码                                        │
│ □ 正确映射 HTTP 状态码                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ 错误响应设计                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│ □ 使用统一的错误响应格式                                                  │
│ □ 包含请求追踪 ID                                                        │
│ □ 提供机器可读的错误代码                                                  │
│ □ 提供人类可读的错误消息                                                  │
│ □ 不泄露敏感信息或内部实现细节                                            │
├─────────────────────────────────────────────────────────────────────────┤
│ 集中式错误处理                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ □ 实现全局错误处理中间件                                                  │
│ □ 处理异步错误                                                           │
│ □ 处理未捕获的异常和 Promise 拒绝                                         │
│ □ 实现优雅的 404 处理                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ 日志与监控                                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ □ 结构化日志记录                                                         │
│ □ 敏感信息脱敏                                                           │
│ □ 错误指标收集                                                           │
│ □ 告警规则配置                                                           │
│ □ 错误追踪集成（如 Sentry）                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ 优雅降级                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ □ 实现断路器模式                                                         │
│ □ 配置重试策略                                                           │
│ □ 准备降级响应                                                           │
│ □ 缓存作为备份数据源                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 用户体验                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ □ 错误消息国际化                                                         │
│ □ 提供明确的操作建议                                                     │
│ □ 显示友好的错误提示 UI                                                  │
│ □ 提供错误恢复选项                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 常见反模式

```typescript
// 反模式 1：吞掉错误
// 不推荐
async function badErrorHandling() {
  try {
    await riskyOperation();
  } catch (error) {
    // 错误被完全忽略
  }
}

// 推荐
async function goodErrorHandling() {
  try {
    await riskyOperation();
  } catch (error) {
    logger.error('Operation failed', { error });
    throw error; // 或者进行适当的错误转换
  }
}

// 反模式 2：暴露内部错误信息
// 不推荐
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message, // 可能包含敏感信息
    stack: err.stack,   // 暴露内部实现
  });
});

// 推荐
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? '服务器内部错误' : err.message,
      requestId: req.requestId,
    },
  });
});

// 反模式 3：过于宽泛的错误捕获
// 不推荐
async function tooGenericCatch() {
  try {
    const user = await getUser(id);
    const order = await createOrder(user);
    await sendEmail(user.email);
  } catch (error) {
    // 无法区分是哪个操作失败
    throw new Error('Something went wrong');
  }
}

// 推荐
async function specificErrorHandling() {
  let user: User;
  try {
    user = await getUser(id);
  } catch (error) {
    throw new NotFoundError('User', id);
  }

  let order: Order;
  try {
    order = await createOrder(user);
  } catch (error) {
    throw new InternalServerError('Failed to create order');
  }

  try {
    await sendEmail(user.email);
  } catch (error) {
    // 邮件发送失败不应阻塞主流程
    logger.warn('Failed to send email', { error, userId: user.id });
  }

  return order;
}

// 反模式 4：错误状态码使用不当
// 不推荐
if (!user) {
  res.status(200).json({ error: 'User not found' }); // 用 200 返回错误
}

// 推荐
if (!user) {
  throw new NotFoundError('User', userId); // 正确使用 404
}
```

### 错误处理流程图

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              错误处理流程                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   请求进入                                                                    │
│       │                                                                      │
│       ▼                                                                      │
│   ┌────────────┐                                                             │
│   │  业务逻辑  │                                                             │
│   └─────┬──────┘                                                             │
│         │                                                                    │
│    错误发生                                                                   │
│         │                                                                    │
│         ▼                                                                    │
│   ┌────────────────┐    是     ┌────────────────┐                            │
│   │  是否可重试？   │─────────▶│   执行重试策略   │                            │
│   └───────┬────────┘          └────────┬───────┘                            │
│           │ 否                         │                                     │
│           ▼                            │ 仍然失败                             │
│   ┌────────────────┐                   │                                     │
│   │ 是否有降级策略？ │◀─────────────────┘                                     │
│   └───────┬────────┘                                                        │
│           │                                                                  │
│     ┌─────┴─────┐                                                            │
│     │ 是        │ 否                                                         │
│     ▼           ▼                                                            │
│ ┌──────────┐ ┌───────────┐                                                  │
│ │ 执行降级  │ │ 分类错误   │                                                  │
│ └────┬─────┘ └─────┬─────┘                                                  │
│      │             │                                                         │
│      │       ┌─────┴─────┐                                                   │
│      │       │ 操作性错误  │ 系统错误                                          │
│      │       ▼           ▼                                                   │
│      │   ┌────────┐ ┌────────┐                                               │
│      │   │ WARN   │ │ ERROR  │                                               │
│      │   │ 日志   │ │ 日志   │                                               │
│      │   └───┬────┘ └───┬────┘                                               │
│      │       │          │                                                    │
│      │       │          ▼                                                    │
│      │       │     ┌──────────┐                                              │
│      │       │     │ 上报监控  │                                              │
│      │       │     │(Sentry等)│                                              │
│      │       │     └────┬─────┘                                              │
│      │       │          │                                                    │
│      ▼       ▼          ▼                                                    │
│   ┌─────────────────────────┐                                                │
│   │    构建错误响应          │                                                │
│   │  - 错误代码              │                                                │
│   │  - 用户友好消息          │                                                │
│   │  - 请求追踪 ID           │                                                │
│   └───────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│        返回错误响应                                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 总结

后端错误处理是构建可靠系统的关键组成部分。本文介绍的核心要点包括：

1. **错误类型设计**：建立清晰的错误类型体系，区分操作性错误和系统错误
2. **统一错误响应**：设计一致的 API 错误响应格式，便于客户端处理
3. **集中式处理**：在框架层面统一处理错误，避免分散的错误处理代码
4. **日志与监控**：结构化记录错误日志，配置监控告警
5. **优雅降级**：实现断路器、重试和降级策略，提高系统弹性
6. **用户友好**：提供清晰的错误提示和恢复建议

良好的错误处理不仅能帮助开发者快速定位问题，还能提升用户体验，是构建生产级后端系统的必备技能。
