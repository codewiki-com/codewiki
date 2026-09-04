---
title: API-First Design
description: Learn API-first development methodology
track: backend
section: http-apis
difficulty: intermediate
tags:
  - API-first
  - OpenAPI
  - contracts
  - design
status: imported
origin: old/src/content/docs/architecture/api-first.en.md
divergence: 0.098
issues: []
legacy:
  category: Architecture
  subcategory: API
  order: 26
  lastUpdated: 2026-01-07
---

## Concept Overview

### What is API-First Design?

API-First Design is a development methodology where the API specification is created and agreed upon before any implementation begins. Rather than treating the API as an afterthought derived from implementation details, API-First puts the interface contract at the center of the development process, making it the primary artifact that drives all subsequent work.

Think of API-First Design as architectural blueprints for a building. Just as architects create detailed plans before construction begins, API-First requires teams to design and document the API contract before writing any code. This approach ensures all stakeholders agree on the interface before significant development effort is invested.

```
Traditional (Code-First) Approach:

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Implement     │────▶│   Generate      │────▶│   Share with    │
│   Backend       │     │   API Docs      │     │   Consumers     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
Problems:                                               ▼
- API design influenced by implementation        ┌─────────────────┐
- Late discovery of integration issues           │   Consumer      │
- Consumers blocked until backend ready          │   Implements    │
- Changes require re-implementation              └─────────────────┘


API-First Approach:

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Design API    │────▶│   Review &      │────▶│   Publish       │
│   Contract      │     │   Iterate       │     │   Contract      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                              ┌──────────────────────────┼──────────────────────────┐
                              │                          │                          │
                              ▼                          ▼                          ▼
                    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
                    │   Generate      │      │   Generate      │      │   Generate      │
                    │   Mock Server   │      │   Client SDKs   │      │   Server Stubs  │
                    └─────────────────┘      └─────────────────┘      └─────────────────┘
                              │                          │                          │
                              ▼                          ▼                          ▼
                    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
                    │   Frontend      │      │   Consumers     │      │   Backend       │
                    │   Development   │      │   Integrate     │      │   Development   │
                    └─────────────────┘      └─────────────────┘      └─────────────────┘

Benefits:
- Parallel development enabled
- Early stakeholder alignment
- Consistent documentation
- Contract-driven testing
```

### Why API-First Matters

API-First Design addresses several critical challenges in modern software development:

1. **Parallel Development**: Frontend and backend teams can work simultaneously once the contract is defined.

2. **Early Feedback**: Stakeholders can review and validate the API design before implementation begins.

3. **Better Developer Experience**: Well-designed APIs with comprehensive documentation improve adoption and reduce integration friction.

4. **Reduced Rework**: Catching design issues early prevents costly changes after implementation.

5. **Consistency**: Generated artifacts (documentation, SDKs, mocks) stay synchronized with the specification.

6. **Contract Testing**: The specification serves as the source of truth for validating implementations.

## OpenAPI Specification

### Understanding OpenAPI

OpenAPI Specification (formerly known as Swagger) is the industry standard for describing RESTful APIs. It provides a language-agnostic, machine-readable format that enables tooling for documentation, code generation, testing, and more.

```yaml
# openapi.yaml - Complete API Specification Example
openapi: 3.1.0
info:
  title: Task Management API
  description: |
    API for managing tasks and projects in a collaborative workspace.

    ## Authentication
    All endpoints require Bearer token authentication.

    ## Rate Limiting
    - 1000 requests per hour for standard users
    - 5000 requests per hour for premium users
  version: 1.0.0
  contact:
    name: API Support
    email: api-support@example.com
    url: https://developer.example.com/support
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server
  - url: http://localhost:3000/v1
    description: Local development

tags:
  - name: Tasks
    description: Task management operations
  - name: Projects
    description: Project management operations
  - name: Users
    description: User management operations

paths:
  /tasks:
    get:
      tags:
        - Tasks
      summary: List all tasks
      description: Retrieves a paginated list of tasks with optional filtering
      operationId: listTasks
      parameters:
        - name: status
          in: query
          description: Filter tasks by status
          schema:
            type: string
            enum: [pending, in_progress, completed, cancelled]
        - name: assignee
          in: query
          description: Filter tasks by assignee user ID
          schema:
            type: string
            format: uuid
        - name: project_id
          in: query
          description: Filter tasks by project
          schema:
            type: string
            format: uuid
        - name: page
          in: query
          description: Page number for pagination
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: Number of items per page
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: sort
          in: query
          description: Sort field and direction
          schema:
            type: string
            enum: [created_at, updated_at, due_date, priority]
            default: created_at
        - name: order
          in: query
          description: Sort order
          schema:
            type: string
            enum: [asc, desc]
            default: desc
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskListResponse'
              examples:
                success:
                  summary: Successful task list
                  value:
                    data:
                      - id: "550e8400-e29b-41d4-a716-446655440000"
                        title: "Implement user authentication"
                        status: "in_progress"
                        priority: "high"
                        assignee:
                          id: "user-123"
                          name: "John Doe"
                        due_date: "2024-02-15"
                        created_at: "2024-01-10T10:00:00Z"
                    pagination:
                      page: 1
                      limit: 20
                      total: 45
                      total_pages: 3
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/InternalError'
      security:
        - bearerAuth: []

    post:
      tags:
        - Tasks
      summary: Create a new task
      description: Creates a new task in the system
      operationId: createTask
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTaskRequest'
            examples:
              basic:
                summary: Basic task creation
                value:
                  title: "Review pull request"
                  description: "Review the authentication module PR"
                  priority: "medium"
                  project_id: "proj-456"
              complete:
                summary: Complete task with all fields
                value:
                  title: "Implement caching layer"
                  description: "Add Redis caching for frequently accessed data"
                  priority: "high"
                  project_id: "proj-456"
                  assignee_id: "user-789"
                  due_date: "2024-02-01"
                  tags: ["backend", "performance"]
      responses:
        '201':
          description: Task created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskResponse'
          headers:
            Location:
              description: URL of the created task
              schema:
                type: string
                format: uri
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '422':
          $ref: '#/components/responses/ValidationError'
        '500':
          $ref: '#/components/responses/InternalError'
      security:
        - bearerAuth: []

  /tasks/{taskId}:
    parameters:
      - name: taskId
        in: path
        required: true
        description: Unique task identifier
        schema:
          type: string
          format: uuid

    get:
      tags:
        - Tasks
      summary: Get a task by ID
      description: Retrieves detailed information about a specific task
      operationId: getTask
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '500':
          $ref: '#/components/responses/InternalError'
      security:
        - bearerAuth: []

    put:
      tags:
        - Tasks
      summary: Update a task
      description: Updates an existing task with new data
      operationId: updateTask
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateTaskRequest'
      responses:
        '200':
          description: Task updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/ValidationError'
        '500':
          $ref: '#/components/responses/InternalError'
      security:
        - bearerAuth: []

    delete:
      tags:
        - Tasks
      summary: Delete a task
      description: Permanently removes a task from the system
      operationId: deleteTask
      responses:
        '204':
          description: Task deleted successfully
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '500':
          $ref: '#/components/responses/InternalError'
      security:
        - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from the authentication endpoint

  schemas:
    Task:
      type: object
      required:
        - id
        - title
        - status
        - priority
        - created_at
        - updated_at
      properties:
        id:
          type: string
          format: uuid
          description: Unique task identifier
          readOnly: true
        title:
          type: string
          minLength: 1
          maxLength: 200
          description: Task title
        description:
          type: string
          maxLength: 5000
          description: Detailed task description
        status:
          type: string
          enum: [pending, in_progress, completed, cancelled]
          default: pending
          description: Current task status
        priority:
          type: string
          enum: [low, medium, high, critical]
          default: medium
          description: Task priority level
        assignee:
          $ref: '#/components/schemas/UserSummary'
        project_id:
          type: string
          format: uuid
          description: Associated project ID
        due_date:
          type: string
          format: date
          description: Task due date
        tags:
          type: array
          items:
            type: string
          description: Task tags for categorization
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true

    UserSummary:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        avatar_url:
          type: string
          format: uri

    CreateTaskRequest:
      type: object
      required:
        - title
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
          maxLength: 5000
        priority:
          type: string
          enum: [low, medium, high, critical]
          default: medium
        project_id:
          type: string
          format: uuid
        assignee_id:
          type: string
          format: uuid
        due_date:
          type: string
          format: date
        tags:
          type: array
          items:
            type: string
            maxLength: 50
          maxItems: 10

    UpdateTaskRequest:
      type: object
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
          maxLength: 5000
        status:
          type: string
          enum: [pending, in_progress, completed, cancelled]
        priority:
          type: string
          enum: [low, medium, high, critical]
        assignee_id:
          type: string
          format: uuid
          nullable: true
        due_date:
          type: string
          format: date
          nullable: true
        tags:
          type: array
          items:
            type: string
            maxLength: 50
          maxItems: 10

    TaskResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/Task'

    TaskListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Task'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          description: Machine-readable error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: array
          items:
            $ref: '#/components/schemas/ErrorDetail'

    ErrorDetail:
      type: object
      properties:
        field:
          type: string
          description: Field that caused the error
        message:
          type: string
          description: Detailed error message
        code:
          type: string
          description: Error code for this specific field

  responses:
    BadRequest:
      description: Invalid request parameters
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "BAD_REQUEST"
            message: "Invalid request parameters"

    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "UNAUTHORIZED"
            message: "Authentication token is missing or invalid"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "NOT_FOUND"
            message: "The requested resource was not found"

    Conflict:
      description: Resource conflict
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "CONFLICT"
            message: "Resource has been modified by another request"

    ValidationError:
      description: Validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "VALIDATION_ERROR"
            message: "Request validation failed"
            details:
              - field: "title"
                message: "Title cannot be empty"
                code: "REQUIRED"

    InternalError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "INTERNAL_ERROR"
            message: "An unexpected error occurred"
```

### OpenAPI Best Practices

When designing OpenAPI specifications, follow these guidelines for maximum effectiveness:

```yaml
# Best Practice: Use meaningful operation IDs
paths:
  /users/{userId}/tasks:
    get:
      operationId: getUserTasks  # Clear, consistent naming
      # NOT: get_tasks_for_user, GetUserTasks, tasks-by-user

# Best Practice: Comprehensive schema validation
components:
  schemas:
    Email:
      type: string
      format: email
      pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
      maxLength: 254
      example: "user@example.com"

    PhoneNumber:
      type: string
      pattern: "^\\+[1-9]\\d{1,14}$"
      description: Phone number in E.164 format
      example: "+14155551234"

    Money:
      type: object
      required:
        - amount
        - currency
      properties:
        amount:
          type: string
          pattern: "^-?\\d+\\.\\d{2}$"
          description: Amount with exactly 2 decimal places
          example: "99.99"
        currency:
          type: string
          pattern: "^[A-Z]{3}$"
          description: ISO 4217 currency code
          example: "USD"

# Best Practice: Versioning strategy
info:
  version: 2.1.0  # Semantic versioning

servers:
  - url: https://api.example.com/v2
    description: Version 2 (current)
  - url: https://api.example.com/v1
    description: Version 1 (deprecated, sunset 2024-06-01)

# Best Practice: Deprecation indicators
paths:
  /users/{userId}/settings:
    get:
      deprecated: true
      x-sunset: "2024-06-01"
      description: |
        **Deprecated**: Use `/users/{userId}/preferences` instead.
        This endpoint will be removed on 2024-06-01.
```

## Code Generation

### Generating Client SDKs

One of the most powerful benefits of API-First design is automatic code generation. OpenAPI Generator supports over 50 programming languages and frameworks.

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/typescript-client \
  --additional-properties=supportsES6=true,npmName=task-api-client

# Generate Python client
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client \
  --additional-properties=packageName=task_api_client

# Generate Java client with custom templates
openapi-generator-cli generate \
  -i openapi.yaml \
  -g java \
  -o ./generated/java-client \
  --additional-properties=library=retrofit2,dateLibrary=java8 \
  -t ./custom-templates/java
```

The generated TypeScript client provides type-safe API calls:

```typescript
// Using the generated TypeScript client
import { TasksApi, Configuration, CreateTaskRequest, Task } from 'task-api-client';

// Configure the API client
const config = new Configuration({
  basePath: 'https://api.example.com/v1',
  accessToken: async () => {
    // Return the current authentication token
    return await getAuthToken();
  },
});

const tasksApi = new TasksApi(config);

// Type-safe API calls with full IDE support
async function createAndListTasks(): Promise<void> {
  // Create a new task - TypeScript ensures correct structure
  const newTask: CreateTaskRequest = {
    title: 'Implement user dashboard',
    description: 'Create the main dashboard view with widgets',
    priority: 'high',
    projectId: 'proj-123',
    dueDate: '2024-02-15',
    tags: ['frontend', 'ui'],
  };

  try {
    const createResponse = await tasksApi.createTask(newTask);
    console.log('Created task:', createResponse.data.data?.id);

    // List tasks with filtering
    const listResponse = await tasksApi.listTasks(
      'in_progress',  // status
      undefined,       // assignee
      'proj-123',     // project_id
      1,              // page
      20,             // limit
      'created_at',   // sort
      'desc'          // order
    );

    // Full type information available
    const tasks: Task[] = listResponse.data.data ?? [];
    tasks.forEach(task => {
      console.log(`${task.title} - ${task.status} - ${task.priority}`);
    });
  } catch (error) {
    if (error.response) {
      // Handle API errors with typed error response
      console.error('API Error:', error.response.data);
    }
    throw error;
  }
}
```

### Generating Server Stubs

Server-side code generation creates the interface layer that your implementation must satisfy:

```bash
# Generate Node.js/Express server
openapi-generator-cli generate \
  -i openapi.yaml \
  -g nodejs-express-server \
  -o ./generated/server

# Generate Spring Boot server
openapi-generator-cli generate \
  -i openapi.yaml \
  -g spring \
  -o ./generated/spring-server \
  --additional-properties=interfaceOnly=true,delegatePattern=true
```

```typescript
// Generated interface that implementation must satisfy
// generated/server/services/TasksService.ts

export interface TasksService {
  /**
   * List all tasks
   * Retrieves a paginated list of tasks with optional filtering
   */
  listTasks(
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    assignee?: string,
    projectId?: string,
    page?: number,
    limit?: number,
    sort?: 'created_at' | 'updated_at' | 'due_date' | 'priority',
    order?: 'asc' | 'desc'
  ): Promise<TaskListResponse>;

  /**
   * Create a new task
   */
  createTask(request: CreateTaskRequest): Promise<TaskResponse>;

  /**
   * Get a task by ID
   */
  getTask(taskId: string): Promise<TaskResponse>;

  /**
   * Update a task
   */
  updateTask(taskId: string, request: UpdateTaskRequest): Promise<TaskResponse>;

  /**
   * Delete a task
   */
  deleteTask(taskId: string): Promise<void>;
}

// Implementation of the generated interface
// src/services/TasksServiceImpl.ts

import { TasksService } from '../generated/services/TasksService';
import { TaskRepository } from '../repositories/TaskRepository';
import { NotFoundError, ValidationError } from '../errors';

export class TasksServiceImpl implements TasksService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async listTasks(
    status?: string,
    assignee?: string,
    projectId?: string,
    page = 1,
    limit = 20,
    sort = 'created_at',
    order = 'desc'
  ): Promise<TaskListResponse> {
    const filters = { status, assignee, projectId };
    const pagination = { page, limit };
    const sorting = { field: sort, direction: order };

    const [tasks, total] = await this.taskRepository.findAll(
      filters,
      pagination,
      sorting
    );

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createTask(request: CreateTaskRequest): Promise<TaskResponse> {
    // Validate business rules
    if (request.dueDate && new Date(request.dueDate) < new Date()) {
      throw new ValidationError('Due date cannot be in the past');
    }

    const task = await this.taskRepository.create({
      ...request,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { data: task };
  }

  async getTask(taskId: string): Promise<TaskResponse> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    return { data: task };
  }

  async updateTask(
    taskId: string,
    request: UpdateTaskRequest
  ): Promise<TaskResponse> {
    const existing = await this.taskRepository.findById(taskId);

    if (!existing) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    const updated = await this.taskRepository.update(taskId, {
      ...request,
      updatedAt: new Date(),
    });

    return { data: updated };
  }

  async deleteTask(taskId: string): Promise<void> {
    const existing = await this.taskRepository.findById(taskId);

    if (!existing) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    await this.taskRepository.delete(taskId);
  }
}
```

## API Mocking

### Why Mocking Matters

Mocking allows frontend teams and API consumers to begin development immediately after the API specification is finalized, without waiting for the backend implementation.

```
API-First Development Timeline with Mocking:

Week 1: API Design
─────────────────────────────────────────────────────────────
│ Design API    │ Review    │ Finalize   │ Publish        │
│ Specification │ Process   │ Contract   │ Specification  │
─────────────────────────────────────────────────────────────

Week 2-4: Parallel Development (Enabled by Mocking)
─────────────────────────────────────────────────────────────
│                Backend Implementation                     │
├───────────────────────────────────────────────────────────┤
│                                                           │
│   ┌─────────────────────────────────────────────────┐    │
│   │            Mock Server Running                   │    │
│   └─────────────────────────────────────────────────┘    │
│                          │                                │
├──────────────────────────┼────────────────────────────────┤
│   Frontend Development   │   Consumer Integration        │
│   (Using Mock Server)    │   (Using Mock Server)         │
─────────────────────────────────────────────────────────────

Week 5: Integration
─────────────────────────────────────────────────────────────
│ Switch to Real API │ Integration Testing │ Final QA     │
─────────────────────────────────────────────────────────────
```

### Setting Up Mock Servers

Several tools can generate mock servers from OpenAPI specifications:

```bash
# Using Prism (Stoplight)
npm install -g @stoplight/prism-cli

# Start mock server with dynamic response generation
prism mock openapi.yaml --dynamic

# Start with specific port and host
prism mock openapi.yaml --port 4010 --host 0.0.0.0
```

```typescript
// Custom mock server with more control
// mock-server.ts

import express from 'express';
import { OpenAPIBackend } from 'openapi-backend';
import type { Request } from 'openapi-backend';

const app = express();
app.use(express.json());

// Initialize OpenAPI Backend with the specification
const api = new OpenAPIBackend({
  definition: './openapi.yaml',
  handlers: {
    // Handler for listing tasks
    listTasks: async (context, req, res) => {
      const { status, page = 1, limit = 20 } = context.request.query;

      // Generate mock data based on query parameters
      const mockTasks = generateMockTasks(limit, status);

      return res.status(200).json({
        data: mockTasks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 100,
          total_pages: Math.ceil(100 / Number(limit)),
        },
      });
    },

    // Handler for creating a task
    createTask: async (context, req, res) => {
      const body = context.request.requestBody;

      const newTask = {
        id: generateUUID(),
        ...body,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return res.status(201)
        .header('Location', `/tasks/${newTask.id}`)
        .json({ data: newTask });
    },

    // Handler for getting a single task
    getTask: async (context, req, res) => {
      const { taskId } = context.request.params;

      // Simulate not found for specific IDs
      if (taskId === '00000000-0000-0000-0000-000000000000') {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      return res.status(200).json({
        data: generateMockTask(taskId),
      });
    },

    // Default handler for validation failures
    validationFail: async (context, req, res) => {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: context.validation.errors?.map(error => ({
          field: error.instancePath || 'body',
          message: error.message,
          code: error.keyword?.toUpperCase(),
        })),
      });
    },

    // Handler for undefined operations
    notFound: async (context, req, res) => {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: `Path ${context.request.path} not found`,
      });
    },

    // Handler for unsupported methods
    methodNotAllowed: async (context, req, res) => {
      return res.status(405).json({
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${context.request.method} not allowed`,
      });
    },
  },
});

// Initialize the API
api.init();

// Use OpenAPI Backend as middleware
app.use((req, res) => api.handleRequest(req as Request, req, res));

// Helper functions for generating mock data
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateMockTask(id?: string): object {
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'critical'];

  return {
    id: id || generateUUID(),
    title: `Mock Task ${Math.floor(Math.random() * 1000)}`,
    description: 'This is a mock task generated for testing purposes',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    assignee: {
      id: generateUUID(),
      name: 'John Doe',
      avatar_url: 'https://example.com/avatars/johndoe.png',
    },
    project_id: generateUUID(),
    due_date: '2024-02-15',
    tags: ['mock', 'testing'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function generateMockTasks(count: number, status?: string): object[] {
  return Array.from({ length: count }, () => {
    const task = generateMockTask();
    if (status) {
      return { ...task, status };
    }
    return task;
  });
}

// Start the mock server
const PORT = process.env.PORT || 4010;
app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET    /tasks');
  console.log('  POST   /tasks');
  console.log('  GET    /tasks/:taskId');
  console.log('  PUT    /tasks/:taskId');
  console.log('  DELETE /tasks/:taskId');
});
```

### Advanced Mocking with Scenarios

```typescript
// scenario-mock-server.ts
// Support for different testing scenarios

interface MockScenario {
  name: string;
  description: string;
  handlers: Record<string, (context: any) => any>;
}

const scenarios: Record<string, MockScenario> = {
  happy_path: {
    name: 'Happy Path',
    description: 'All operations succeed with valid data',
    handlers: {
      listTasks: () => ({
        status: 200,
        body: { data: generateMockTasks(5), pagination: defaultPagination },
      }),
      createTask: (ctx) => ({
        status: 201,
        body: { data: { id: generateUUID(), ...ctx.request.requestBody } },
      }),
    },
  },

  empty_state: {
    name: 'Empty State',
    description: 'No data exists - useful for testing empty states',
    handlers: {
      listTasks: () => ({
        status: 200,
        body: { data: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } },
      }),
    },
  },

  error_scenarios: {
    name: 'Error Scenarios',
    description: 'Various error conditions for error handling testing',
    handlers: {
      listTasks: () => ({
        status: 500,
        body: { code: 'INTERNAL_ERROR', message: 'Database connection failed' },
      }),
      createTask: () => ({
        status: 422,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'title', message: 'Title already exists', code: 'DUPLICATE' }],
        },
      }),
    },
  },

  slow_responses: {
    name: 'Slow Responses',
    description: 'Delayed responses for testing loading states and timeouts',
    handlers: {
      listTasks: async () => {
        await delay(3000); // 3 second delay
        return {
          status: 200,
          body: { data: generateMockTasks(5), pagination: defaultPagination },
        };
      },
    },
  },

  rate_limited: {
    name: 'Rate Limited',
    description: 'Simulates rate limiting responses',
    handlers: {
      '*': () => ({
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
        body: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      }),
    },
  },
};

// Scenario selection via header or environment variable
function getActiveScenario(req: express.Request): MockScenario {
  const scenarioName = req.headers['x-mock-scenario'] as string
    || process.env.MOCK_SCENARIO
    || 'happy_path';

  return scenarios[scenarioName] || scenarios.happy_path;
}
```

## API Documentation

### Auto-Generated Documentation

Well-designed OpenAPI specifications generate excellent documentation automatically:

```typescript
// documentation-server.ts
// Serving API documentation with Swagger UI and Redoc

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();

// Load the OpenAPI specification
const openapiSpec = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Swagger UI - Interactive documentation
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Task API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
  })
);

// Serve raw OpenAPI spec
app.get('/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

app.get('/openapi.json', (req, res) => {
  res.json(openapiSpec);
});

// Redoc - Beautiful read-only documentation
app.get('/redoc', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Task API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <redoc spec-url='/openapi.json'
               expand-responses="200,201"
               hide-download-button="false"
               theme='{
                 "colors": {
                   "primary": { "main": "#1976d2" }
                 },
                 "typography": {
                   "fontSize": "15px",
                   "fontFamily": "Roboto, sans-serif",
                   "headings": {
                     "fontFamily": "Montserrat, sans-serif"
                   }
                 }
               }'>
        </redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('Documentation server running:');
  console.log('  Swagger UI: http://localhost:3000/docs');
  console.log('  Redoc:      http://localhost:3000/redoc');
  console.log('  OpenAPI:    http://localhost:3000/openapi.yaml');
});
```

### Enhancing Documentation with Examples

```yaml
# Enhanced documentation with comprehensive examples
paths:
  /tasks:
    post:
      summary: Create a new task
      description: |
        Creates a new task in the system.

        ## Business Rules

        - Tasks are created with `pending` status by default
        - Due dates cannot be in the past
        - Maximum 10 tags per task
        - Title must be unique within a project

        ## Permissions

        - Requires `tasks:write` scope
        - Users can only create tasks in projects they have access to

        ## Side Effects

        - Sends notification to assignee (if specified)
        - Updates project task count
        - Triggers webhook events
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTaskRequest'
            examples:
              minimal:
                summary: Minimal task
                description: Creating a task with only required fields
                value:
                  title: "Quick task"

              standard:
                summary: Standard task
                description: A typical task with common fields
                value:
                  title: "Review quarterly report"
                  description: "Review and approve Q4 financial report"
                  priority: "high"
                  project_id: "550e8400-e29b-41d4-a716-446655440001"
                  due_date: "2024-01-31"

              complete:
                summary: Complete task
                description: Task with all available fields
                value:
                  title: "Implement new feature"
                  description: |
                    Implement the user dashboard feature including:
                    - Activity timeline
                    - Statistics widgets
                    - Notification preferences
                  priority: "critical"
                  project_id: "550e8400-e29b-41d4-a716-446655440001"
                  assignee_id: "550e8400-e29b-41d4-a716-446655440002"
                  due_date: "2024-02-15"
                  tags:
                    - "frontend"
                    - "feature"
                    - "dashboard"

              bug_report:
                summary: Bug report task
                description: Task representing a bug that needs fixing
                value:
                  title: "[BUG] Login fails with special characters in password"
                  description: |
                    ## Steps to Reproduce
                    1. Go to login page
                    2. Enter username: testuser
                    3. Enter password with special chars: p@ss!w0rd#
                    4. Click login

                    ## Expected
                    User should be logged in successfully

                    ## Actual
                    Error message: "Invalid credentials"
                  priority: "high"
                  project_id: "550e8400-e29b-41d4-a716-446655440001"
                  tags:
                    - "bug"
                    - "authentication"
                    - "urgent"
```

## Consumer-Driven Contracts

### Understanding Consumer-Driven Contracts

Consumer-Driven Contracts (CDC) is a testing approach where API consumers define the contract expectations, and providers verify they meet those expectations. This inverts the traditional provider-centric approach.

```
Traditional Provider-Centric Approach:

┌──────────────┐                      ┌──────────────┐
│   Provider   │ ────────────────────▶│   Consumer   │
│   Defines    │       Provides       │   Adapts     │
│   Contract   │       Contract       │   to Fit     │
└──────────────┘                      └──────────────┘

Problems:
- Provider may not understand consumer needs
- Breaking changes discovered late in integration
- Unused API features maintained unnecessarily


Consumer-Driven Contract Approach:

┌──────────────┐                      ┌──────────────┐
│   Consumer   │ ────────────────────▶│   Provider   │
│   Defines    │    Publishes         │   Verifies   │
│   Contract   │    Contract          │   Contract   │
└──────────────┘                      └──────────────┘
       │                                      │
       └──────────────────┬───────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    Contract Broker    │
              │   (Pact Broker, etc)  │
              └───────────────────────┘

Benefits:
- Consumer needs drive API design
- Breaking changes detected immediately
- Provider knows exactly what consumers need
- Safe to remove unused features
```

### Implementing CDC with Pact

```typescript
// consumer.spec.ts - Consumer-side contract test

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { TaskApiClient } from './task-api-client';

const { like, eachLike, uuid, iso8601DateTimeWithMillis } = MatchersV3;

const provider = new PactV3({
  consumer: 'TaskWebApp',
  provider: 'TaskApi',
  logLevel: 'warn',
});

describe('Task API Consumer Contract Tests', () => {
  describe('GET /tasks', () => {
    it('returns a list of tasks', async () => {
      // Define the expected interaction
      await provider
        .given('tasks exist')
        .uponReceiving('a request for all tasks')
        .withRequest({
          method: 'GET',
          path: '/v1/tasks',
          headers: {
            Authorization: 'Bearer valid-token',
            Accept: 'application/json',
          },
          query: {
            page: '1',
            limit: '20',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: eachLike({
              id: uuid(),
              title: like('Example Task'),
              status: like('pending'),
              priority: like('medium'),
              created_at: iso8601DateTimeWithMillis(),
              updated_at: iso8601DateTimeWithMillis(),
            }),
            pagination: {
              page: like(1),
              limit: like(20),
              total: like(100),
              total_pages: like(5),
            },
          },
        });

      // Execute the test against the mock provider
      await provider.executeTest(async (mockServer) => {
        const client = new TaskApiClient({
          baseUrl: mockServer.url,
          token: 'valid-token',
        });

        const response = await client.listTasks({ page: 1, limit: 20 });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.pagination.page).toBe(1);
      });
    });
  });

  describe('POST /tasks', () => {
    it('creates a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        project_id: '550e8400-e29b-41d4-a716-446655440001',
      };

      await provider
        .given('project exists')
        .uponReceiving('a request to create a task')
        .withRequest({
          method: 'POST',
          path: '/v1/tasks',
          headers: {
            Authorization: 'Bearer valid-token',
            'Content-Type': 'application/json',
          },
          body: newTask,
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            Location: like('/v1/tasks/550e8400-e29b-41d4-a716-446655440000'),
          },
          body: {
            data: {
              id: uuid(),
              title: like('New Task'),
              description: like('Task description'),
              status: 'pending',
              priority: like('high'),
              project_id: uuid(),
              created_at: iso8601DateTimeWithMillis(),
              updated_at: iso8601DateTimeWithMillis(),
            },
          },
        });

      await provider.executeTest(async (mockServer) => {
        const client = new TaskApiClient({
          baseUrl: mockServer.url,
          token: 'valid-token',
        });

        const response = await client.createTask(newTask);

        expect(response.data.id).toBeDefined();
        expect(response.data.title).toBe('New Task');
        expect(response.data.status).toBe('pending');
      });
    });
  });

  describe('GET /tasks/{taskId}', () => {
    it('returns a specific task', async () => {
      const taskId = '550e8400-e29b-41d4-a716-446655440000';

      await provider
        .given('task with id 550e8400-e29b-41d4-a716-446655440000 exists')
        .uponReceiving('a request for a specific task')
        .withRequest({
          method: 'GET',
          path: `/v1/tasks/${taskId}`,
          headers: {
            Authorization: 'Bearer valid-token',
          },
        })
        .willRespondWith({
          status: 200,
          body: {
            data: {
              id: taskId,
              title: like('Existing Task'),
              status: like('in_progress'),
              priority: like('high'),
              assignee: like({
                id: uuid(),
                name: like('John Doe'),
              }),
              created_at: iso8601DateTimeWithMillis(),
              updated_at: iso8601DateTimeWithMillis(),
            },
          },
        });

      await provider.executeTest(async (mockServer) => {
        const client = new TaskApiClient({
          baseUrl: mockServer.url,
          token: 'valid-token',
        });

        const response = await client.getTask(taskId);

        expect(response.data.id).toBe(taskId);
        expect(response.data.assignee).toBeDefined();
      });
    });

    it('returns 404 for non-existent task', async () => {
      const taskId = '00000000-0000-0000-0000-000000000000';

      await provider
        .given('task does not exist')
        .uponReceiving('a request for a non-existent task')
        .withRequest({
          method: 'GET',
          path: `/v1/tasks/${taskId}`,
          headers: {
            Authorization: 'Bearer valid-token',
          },
        })
        .willRespondWith({
          status: 404,
          body: {
            code: 'NOT_FOUND',
            message: like('Task not found'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const client = new TaskApiClient({
          baseUrl: mockServer.url,
          token: 'valid-token',
        });

        await expect(client.getTask(taskId)).rejects.toThrow('Task not found');
      });
    });
  });
});
```

### Provider Verification

```typescript
// provider.spec.ts - Provider-side contract verification

import { Verifier } from '@pact-foundation/pact';
import { app } from './app';
import { TaskRepository } from './repositories/TaskRepository';

describe('Task API Provider Contract Verification', () => {
  let server: any;
  const port = 3001;

  beforeAll(async () => {
    // Start the real provider
    server = app.listen(port);
  });

  afterAll(async () => {
    server.close();
  });

  it('verifies the contract against the consumer expectations', async () => {
    const verifier = new Verifier({
      provider: 'TaskApi',
      providerBaseUrl: `http://localhost:${port}`,

      // Pact Broker configuration
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,

      // Or use local pact files
      // pactUrls: ['./pacts/taskwebapp-taskapi.json'],

      // Provider version for tracking
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      providerVersionBranch: process.env.GIT_BRANCH || 'main',

      // Publish verification results
      publishVerificationResult: process.env.CI === 'true',

      // State handlers to set up test data
      stateHandlers: {
        'tasks exist': async () => {
          // Set up test data for this state
          await TaskRepository.seed([
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'Test Task 1',
              status: 'pending',
              priority: 'medium',
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              title: 'Test Task 2',
              status: 'in_progress',
              priority: 'high',
            },
          ]);
        },

        'project exists': async () => {
          await TaskRepository.seedProject({
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Test Project',
          });
        },

        'task with id 550e8400-e29b-41d4-a716-446655440000 exists': async () => {
          await TaskRepository.seed([
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'Existing Task',
              status: 'in_progress',
              priority: 'high',
              assignee: {
                id: '550e8400-e29b-41d4-a716-446655440099',
                name: 'John Doe',
              },
            },
          ]);
        },

        'task does not exist': async () => {
          // Ensure no task exists with the specified ID
          await TaskRepository.deleteAll();
        },
      },

      // Request filters for authentication
      requestFilter: (req, res, next) => {
        // Inject valid token for testing
        if (req.headers.authorization === 'Bearer valid-token') {
          req.user = { id: 'test-user', roles: ['user'] };
        }
        next();
      },
    });

    await verifier.verifyProvider();
  });
});
```

### CI/CD Integration for Contract Testing

```yaml
# .github/workflows/contract-tests.yml

name: Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
  PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

jobs:
  consumer-tests:
    name: Consumer Contract Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run consumer contract tests
        run: npm run test:contract:consumer

      - name: Publish pacts to broker
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version=${{ github.sha }} \
            --branch=${{ github.ref_name }} \
            --broker-base-url=$PACT_BROKER_URL \
            --broker-token=$PACT_BROKER_TOKEN

  provider-verification:
    name: Provider Contract Verification
    runs-on: ubuntu-latest
    needs: consumer-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start provider
        run: npm run start:test &

      - name: Wait for provider
        run: npx wait-on http://localhost:3001/health

      - name: Verify provider contracts
        run: npm run test:contract:provider
        env:
          GIT_COMMIT: ${{ github.sha }}
          GIT_BRANCH: ${{ github.ref_name }}
          CI: true

  can-i-deploy:
    name: Can I Deploy Check
    runs-on: ubuntu-latest
    needs: [consumer-tests, provider-verification]

    steps:
      - name: Check deployment safety
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=TaskWebApp \
            --version=${{ github.sha }} \
            --to-environment=production \
            --broker-base-url=$PACT_BROKER_URL \
            --broker-token=$PACT_BROKER_TOKEN
```

## API-First Workflow

### Complete Development Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API-First Development Lifecycle                       │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 1: Design
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Gather      │───▶│  Draft       │───▶│  Review &    │───▶│ Publish   │ │
│  │  Requirements│    │  OpenAPI     │    │  Iterate     │    │ Contract  │ │
│  │              │    │  Spec        │    │              │    │           │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│                                                                             │
│  Stakeholders:       Tools:              Process:           Output:         │
│  - Product           - Stoplight         - API Review       - openapi.yaml  │
│  - Engineering       - SwaggerHub        - Breaking Change  - SDK specs     │
│  - Consumers         - VS Code plugin    - Security Review  - Mock config   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 2: Generate
┌─────────────────────────────────────────────────────────────────────────────┐
│                           openapi.yaml                                      │
│                               │                                             │
│       ┌───────────────────────┼───────────────────────┐                    │
│       │                       │                       │                     │
│       ▼                       ▼                       ▼                     │
│  ┌──────────┐          ┌──────────┐          ┌──────────────┐              │
│  │  Client  │          │  Server  │          │ Documentation│              │
│  │  SDKs    │          │  Stubs   │          │              │              │
│  └──────────┘          └──────────┘          └──────────────┘              │
│       │                       │                       │                     │
│       ▼                       ▼                       ▼                     │
│  TypeScript, Java,     Express, Spring,     Swagger UI,                     │
│  Python, Go...         FastAPI...           Redoc, Postman                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 3: Develop (Parallel)
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Mock Server                                  │   │
│  │                   (Generated from OpenAPI)                          │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│       ┌─────────────────────────┼─────────────────────────┐                │
│       │                         │                         │                 │
│       ▼                         ▼                         ▼                 │
│  ┌──────────┐          ┌──────────────┐          ┌──────────────┐          │
│  │ Frontend │          │   Backend    │          │   Consumer   │          │
│  │ Team     │          │   Team       │          │   Teams      │          │
│  │          │          │              │          │              │          │
│  │ Uses mock│          │ Implements   │          │ Integrate    │          │
│  │ server   │          │ real API     │          │ using SDKs   │          │
│  └──────────┘          └──────────────┘          └──────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 4: Test
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Contract    │    │  Integration │    │  E2E         │    │ Security  │ │
│  │  Tests       │    │  Tests       │    │  Tests       │    │ Tests     │ │
│  │              │    │              │    │              │    │           │ │
│  │  Pact        │    │  Against     │    │  Full        │    │  OWASP    │ │
│  │  Dredd       │    │  Real API    │    │  Scenarios   │    │  Scanning │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 5: Deploy
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Can I       │───▶│  Deploy to   │───▶│  Monitor     │───▶│ Version   │ │
│  │  Deploy?     │    │  Production  │    │  & Alert     │    │ & Sunset  │ │
│  │              │    │              │    │              │    │           │ │
│  │  Contract    │    │  API Gateway │    │  Metrics     │    │  API      │ │
│  │  Verification│    │  Blue/Green  │    │  Logging     │    │  Lifecycle│ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Design Review Checklist

```markdown
## API Design Review Checklist

### Naming Conventions
- [ ] Resource names are plural nouns (e.g., /users, /tasks)
- [ ] URL paths use kebab-case (e.g., /user-profiles)
- [ ] Query parameters use snake_case (e.g., ?sort_by=created_at)
- [ ] JSON properties use camelCase or snake_case consistently
- [ ] Operation IDs are unique and descriptive

### HTTP Methods
- [ ] GET for retrieval (idempotent, safe)
- [ ] POST for creation (not idempotent)
- [ ] PUT for full replacement (idempotent)
- [ ] PATCH for partial update (not necessarily idempotent)
- [ ] DELETE for removal (idempotent)

### Status Codes
- [ ] 200 OK for successful GET, PUT, PATCH
- [ ] 201 Created for successful POST with Location header
- [ ] 204 No Content for successful DELETE
- [ ] 400 Bad Request for invalid syntax
- [ ] 401 Unauthorized for missing/invalid authentication
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for missing resources
- [ ] 409 Conflict for state conflicts
- [ ] 422 Unprocessable Entity for validation errors
- [ ] 429 Too Many Requests for rate limiting
- [ ] 500 Internal Server Error for server failures

### Request/Response Design
- [ ] Request bodies have clear validation constraints
- [ ] Required fields are explicitly marked
- [ ] Optional fields have sensible defaults documented
- [ ] Response schemas include all necessary fields
- [ ] Pagination implemented for list endpoints
- [ ] Filtering and sorting options available

### Security
- [ ] Authentication requirements documented
- [ ] Authorization scopes defined
- [ ] Sensitive data not exposed in URLs
- [ ] Rate limiting documented
- [ ] Input validation comprehensive

### Documentation
- [ ] Clear descriptions for all operations
- [ ] Examples provided for all requests/responses
- [ ] Error responses documented
- [ ] Breaking changes noted
- [ ] Deprecation timeline specified
```

## Best Practices Summary

### Do's

1. **Design First**: Always create the API specification before implementation
2. **Version from Day One**: Include versioning strategy in initial design
3. **Use Semantic Versioning**: Follow semver for API versions
4. **Document Everything**: Include examples, error cases, and business rules
5. **Validate Contracts**: Use automated contract testing in CI/CD
6. **Mock Early**: Enable parallel development with mock servers
7. **Review Changes**: Implement API review process for all changes
8. **Monitor Usage**: Track which endpoints consumers actually use

### Don'ts

1. **Don't Skip Design Review**: Catching issues early saves time
2. **Don't Break Contracts**: Use additive changes whenever possible
3. **Don't Ignore Consumers**: Their needs should drive API design
4. **Don't Forget Errors**: Error responses are part of the contract
5. **Don't Hardcode URLs**: Use discovery mechanisms when possible
6. **Don't Over-Engineer**: Start simple, evolve based on real needs
7. **Don't Neglect Security**: Security is a first-class concern

## Conclusion

API-First Design transforms how teams build and integrate software. By putting the API contract at the center of development, teams achieve better alignment, faster parallel development, and higher quality integrations.

Key takeaways:

1. **Design the contract before implementation** - This enables parallel work and early feedback
2. **Use OpenAPI specification** - Industry standard with excellent tooling support
3. **Generate everything possible** - Clients, servers, documentation, and mocks
4. **Test contracts automatically** - Consumer-driven contracts catch breaking changes
5. **Treat APIs as products** - They deserve the same care as user-facing features

The investment in API-First design pays dividends throughout the software lifecycle, from initial development through long-term maintenance and evolution.
