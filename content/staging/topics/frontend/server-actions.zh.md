---
title: Server Actions 服务器操作
description: 深入剖析 Server Actions - 直接从 React 组件处理服务器端数据变更的革命性模式
track: frontend
section: react
difficulty: intermediate
tags:
  - Server Actions
  - React
  - Next.js
  - 服务器组件
  - 表单
  - 数据变更
status: imported
origin: old/src/content/docs/frontend/server-actions.zh.md
divergence: 0.199
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 11
  lastUpdated: 2026-01-21
---

Server Actions 代表了我们在 React 应用中处理数据变更方式的根本性转变。通过允许从客户端组件直接调用服务器端代码，它们消除了对单独 API 路由的需求，并提供了更无缝的开发体验。本文将从概念基础到高级实现模式深入探索 Server Actions。

## 概念解释

### 什么是 Server Actions？

**Server Actions** 是在服务器上执行但可以从客户端 React 组件直接调用的异步函数。它们提供了一种类型安全、安全的方式来处理表单提交和数据变更，无需手动创建 API 端点。

```typescript
// 一个简单的 Server Action
'use server'

async function createUser(formData: FormData) {
  const name = formData.get('name')
  const email = formData.get('email')

  await db.users.create({ name, email })

  revalidatePath('/users')
}
```

关键洞察是 Server Actions 模糊了客户端和服务器代码之间的界限，同时维护清晰的安全边界。它们只在服务器上运行，但可以传递给客户端组件并从中调用。

### 历史与演进

| 年份 | 里程碑 | 意义 |
|------|--------|------|
| 2020 | React Server Components RFC | 服务器端 React 的基础 |
| 2022 | Next.js 13 App Router | 生产环境中的服务器组件 |
| 2023 | Server Actions Alpha | 初始变更原语 |
| 2023 | Next.js 14 稳定版 | Server Actions 变为稳定版 |
| 2024 | React 19 Canary | 原生 React 支持 |
| 2025 | React 19 稳定版 | Server Actions 标准化 |
| 2026 | 生态系统采用 | 广泛的框架支持 |

### 它解决的问题

在 Server Actions 之前，处理变更需要多层：

```typescript
// 传统方法 - 多个文件，手动连接

// app/api/users/route.ts
export async function POST(request: Request) {
  const body = await request.json()

  // 验证输入
  if (!body.name || !body.email) {
    return Response.json({ error: '无效输入' }, { status: 400 })
  }

  // 创建用户
  const user = await db.users.create(body)

  return Response.json(user)
}

// components/UserForm.tsx
'use client'

function UserForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.target as HTMLFormElement)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email')
        })
      })

      if (!response.ok) {
        throw new Error('创建用户失败')
      }

      // 手动重新验证或重定向
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
    </form>
  )
}
```

使用 Server Actions：

```typescript
// actions/users.ts
'use server'

async function createUser(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string

  await db.users.create({ name, email })
  revalidatePath('/users')
}

// components/UserForm.tsx
function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">创建用户</button>
    </form>
  )
}
```

### Server Actions 如何工作

```
+-------------------------------------------------------------+
|                    Server Action 流程                        |
+-------------------------------------------------------------+
|                                                              |
|  1. 客户端调用                                                |
|     +-- 用户触发操作（表单提交、按钮点击）                     |
|     +-- React 序列化参数                                      |
|     +-- HTTP POST 请求发送到服务器                            |
|                                                              |
|  2. 服务器执行                                                |
|     +-- 服务器接收请求                                        |
|     +-- 参数反序列化                                          |
|     +-- Action 函数执行                                       |
|     +-- 数据库/外部服务调用                                   |
|                                                              |
|  3. 响应处理                                                  |
|     +-- 返回值序列化                                          |
|     +-- 重新验证指令处理                                      |
|     +-- 重定向指令处理                                        |
|     +-- 响应发送到客户端                                      |
|                                                              |
|  4. 客户端更新                                                |
|     +-- React 处理响应                                        |
|     +-- UI 使用新的服务器状态更新                             |
|     +-- 待处理状态清除                                        |
|     +-- 乐观更新协调                                          |
|                                                              |
+-------------------------------------------------------------+
```

## 核心原理

### 'use server' 指令

`'use server'` 指令将函数标记为 Server Actions：

```typescript
// 文件级指令 - 所有导出都是 Server Actions
'use server'

export async function createPost(data: FormData) {
  // 在服务器上运行
}

export async function deletePost(id: string) {
  // 也在服务器上运行
}
```

```typescript
// 内联指令 - 特定函数是 Server Action
async function ClientComponent() {
  async function handleAction(data: FormData) {
    'use server'
    // 这个特定函数在服务器上运行
  }

  return <form action={handleAction}>...</form>
}
```

### 序列化边界

Server Actions 只能接受和返回可序列化的值：

```typescript
// 有效 - 可序列化类型
'use server'

async function validAction(
  text: string,           // 原始类型
  count: number,
  active: boolean,
  items: string[],        // 数组
  config: {               // 普通对象
    setting: string
  },
  formData: FormData      // FormData
): Promise<{             // 返回可序列化
  success: boolean
  id: string
}> {
  // ...
}

// 无效 - 不可序列化类型
async function invalidAction(
  callback: () => void,   // 函数
  element: JSX.Element,   // React 元素
  classInstance: MyClass, // 类实例
  date: Date,             // 某些对象（使用 ISO 字符串）
  map: Map<string, any>   // Map/Set
) {
  // 不会工作
}
```

### 安全模型

Server Actions 包含内置的安全功能：

```typescript
'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'

// 1. 身份验证检查
async function secureAction(data: FormData) {
  const session = await auth()
  if (!session) {
    throw new Error('未授权')
  }

  // 2. 输入验证
  const schema = z.object({
    title: z.string().min(1).max(100),
    content: z.string().max(10000)
  })

  const parsed = schema.safeParse({
    title: data.get('title'),
    content: data.get('content')
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // 3. 授权检查
  const canCreate = await checkPermission(session.userId, 'posts:create')
  if (!canCreate) {
    throw new Error('禁止访问')
  }

  // 4. 安全的数据库操作
  const post = await db.posts.create({
    data: parsed.data,
    userId: session.userId // 使用已认证的用户 ID
  })

  return { success: true, post }
}
```

### 闭包和捕获的值

Server Actions 可以从其作用域捕获值：

```typescript
// 服务器组件
async function PostList() {
  const posts = await db.posts.findMany()

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          {post.title}
          <DeleteButton postId={post.id} />
        </li>
      ))}
    </ul>
  )
}

// 使用闭包捕获 postId
function DeleteButton({ postId }: { postId: string }) {
  async function deletePost() {
    'use server'
    // postId 被加密并随 action 发送
    await db.posts.delete({ where: { id: postId } })
    revalidatePath('/posts')
  }

  return (
    <form action={deletePost}>
      <button type="submit">删除</button>
    </form>
  )
}
```

**重要**：捕获的值在发送到客户端时会被加密。这可以防止篡改，但你仍然应该验证授权。

## 核心要点

### 1. 表单 Actions

最常见的用例 - 将 actions 绑定到表单：

```typescript
// actions/posts.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const post = await db.posts.create({
    data: { title, content }
  })

  revalidatePath('/posts')
  redirect(`/posts/${post.id}`)
}

// components/PostForm.tsx
import { createPost } from '@/actions/posts'

export function PostForm() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />
      <button type="submit">创建文章</button>
    </form>
  )
}
```

### 2. 使用 useFormStatus

在表单提交期间跟踪待处理状态：

```typescript
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? '创建中...' : '创建文章'}
    </button>
  )
}

function PostForm() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <SubmitButton />
    </form>
  )
}
```

### 3. 使用 useActionState (React 19)

使用新的 React 19 hook 处理 action 状态：

```typescript
'use client'

import { useActionState } from 'react'
import { createPost } from '@/actions/posts'

type State = {
  error?: string
  success?: boolean
}

function PostForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (prevState, formData) => {
      const result = await createPost(formData)
      return result
    },
    { error: undefined, success: false }
  )

  return (
    <form action={formAction}>
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">文章已创建！</p>}

      <input name="title" required />
      <textarea name="content" required />

      <button type="submit" disabled={isPending}>
        {isPending ? '创建中...' : '创建文章'}
      </button>
    </form>
  )
}
```

### 4. 乐观更新

在服务器响应之前显示即时反馈：

```typescript
'use client'

import { useOptimistic } from 'react'
import { addTodo } from '@/actions/todos'

type Todo = {
  id: string
  text: string
  completed: boolean
}

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  )

  async function handleSubmit(formData: FormData) {
    const text = formData.get('text') as string

    // 立即显示乐观更新
    addOptimisticTodo({
      id: `temp-${Date.now()}`,
      text,
      completed: false
    })

    // 然后执行实际 action
    await addTodo(formData)
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="text" placeholder="新待办" required />
        <button type="submit">添加</button>
      </form>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{
            opacity: todo.id.startsWith('temp-') ? 0.5 : 1
          }}>
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 5. 非表单调用

在表单之外调用 Server Actions：

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateLikes } from '@/actions/posts'

function LikeButton({ postId, initialLikes }: {
  postId: string
  initialLikes: number
}) {
  const [likes, setLikes] = useState(initialLikes)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const newLikes = await updateLikes(postId)
      setLikes(newLikes)
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? '...' : `${likes} 赞`}
    </button>
  )
}
```

### 6. 错误处理

在 Server Actions 中优雅地处理错误：

```typescript
// actions/posts.ts
'use server'

type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    // 验证会话
    const session = await auth()
    if (!session) {
      return { success: false, error: '请登录后创建文章' }
    }

    // 验证输入
    const title = formData.get('title') as string
    if (!title || title.length < 3) {
      return { success: false, error: '标题至少需要3个字符' }
    }

    // 创建文章
    const post = await db.posts.create({
      data: {
        title,
        content: formData.get('content') as string,
        authorId: session.userId
      }
    })

    revalidatePath('/posts')
    return { success: true, data: post }

  } catch (error) {
    console.error('创建文章失败:', error)
    return { success: false, error: '出了点问题，请重试。' }
  }
}
```

## 代码示例

### 完整的 CRUD 实现

```typescript
// actions/tasks.ts
'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { db } from '@/lib/db'

// 验证模式
const createTaskSchema = z.object({
  title: z.string().min(1, '标题是必需的').max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional()
})

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
  completed: z.boolean().optional()
})

// 类型
type ActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  data?: any
}

// CREATE
export async function createTask(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) {
    return { success: false, error: '需要身份验证' }
  }

  const rawData = {
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    priority: formData.get('priority') || 'medium',
    dueDate: formData.get('dueDate') || undefined
  }

  const parsed = createTaskSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }

  try {
    const task = await db.task.create({
      data: {
        ...parsed.data,
        userId: session.userId
      }
    })

    revalidatePath('/tasks')
    return { success: true, data: task }
  } catch (error) {
    return { success: false, error: '创建任务失败' }
  }
}

// READ（用于服务器组件，不是 action）
export async function getTasks() {
  const session = await auth()
  if (!session) return []

  return db.task.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' }
  })
}

// UPDATE
export async function updateTask(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) {
    return { success: false, error: '需要身份验证' }
  }

  const rawData = {
    id: formData.get('id'),
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    priority: formData.get('priority') || undefined,
    dueDate: formData.get('dueDate') || undefined,
    completed: formData.get('completed') === 'true'
  }

  const parsed = updateTaskSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }

  // 验证所有权
  const existing = await db.task.findUnique({
    where: { id: parsed.data.id }
  })

  if (!existing || existing.userId !== session.userId) {
    return { success: false, error: '任务未找到' }
  }

  try {
    const task = await db.task.update({
      where: { id: parsed.data.id },
      data: parsed.data
    })

    revalidatePath('/tasks')
    return { success: true, data: task }
  } catch (error) {
    return { success: false, error: '更新任务失败' }
  }
}

// DELETE
export async function deleteTask(id: string): Promise<ActionState> {
  const session = await auth()
  if (!session) {
    return { success: false, error: '需要身份验证' }
  }

  // 验证所有权
  const existing = await db.task.findUnique({
    where: { id }
  })

  if (!existing || existing.userId !== session.userId) {
    return { success: false, error: '任务未找到' }
  }

  try {
    await db.task.delete({ where: { id } })
    revalidatePath('/tasks')
    return { success: true }
  } catch (error) {
    return { success: false, error: '删除任务失败' }
  }
}

// 切换完成状态
export async function toggleTaskComplete(id: string): Promise<ActionState> {
  const session = await auth()
  if (!session) {
    return { success: false, error: '需要身份验证' }
  }

  const existing = await db.task.findUnique({
    where: { id }
  })

  if (!existing || existing.userId !== session.userId) {
    return { success: false, error: '任务未找到' }
  }

  try {
    const task = await db.task.update({
      where: { id },
      data: { completed: !existing.completed }
    })

    revalidatePath('/tasks')
    return { success: true, data: task }
  } catch (error) {
    return { success: false, error: '更新任务失败' }
  }
}
```

```typescript
// components/TaskForm.tsx
'use client'

import { useActionState } from 'react'
import { createTask } from '@/actions/tasks'

export function TaskForm() {
  const [state, formAction, isPending] = useActionState(createTask, {
    success: false
  })

  return (
    <form action={formAction} className="task-form">
      {state.error && (
        <div className="error-banner">{state.error}</div>
      )}

      <div className="field">
        <label htmlFor="title">标题</label>
        <input
          id="title"
          name="title"
          required
          aria-describedby={state.fieldErrors?.title ? 'title-error' : undefined}
        />
        {state.fieldErrors?.title && (
          <p id="title-error" className="field-error">
            {state.fieldErrors.title[0]}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="description">描述</label>
        <textarea id="description" name="description" rows={3} />
      </div>

      <div className="field">
        <label htmlFor="priority">优先级</label>
        <select id="priority" name="priority" defaultValue="medium">
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="dueDate">截止日期</label>
        <input id="dueDate" name="dueDate" type="datetime-local" />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? '创建中...' : '创建任务'}
      </button>
    </form>
  )
}
```

```typescript
// components/TaskList.tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleTaskComplete, deleteTask } from '@/actions/tasks'

type Task = {
  id: string
  title: string
  completed: boolean
  priority: string
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [optimisticTasks, updateOptimisticTask] = useOptimistic(
    tasks,
    (state, { id, action }: { id: string; action: 'toggle' | 'delete' }) => {
      if (action === 'delete') {
        return state.filter(t => t.id !== id)
      }
      return state.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }
  )

  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string) {
    startTransition(async () => {
      updateOptimisticTask({ id, action: 'toggle' })
      await toggleTaskComplete(id)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('删除此任务？')) return

    startTransition(async () => {
      updateOptimisticTask({ id, action: 'delete' })
      await deleteTask(id)
    })
  }

  return (
    <ul className="task-list">
      {optimisticTasks.map(task => (
        <li
          key={task.id}
          className={`task-item ${task.completed ? 'completed' : ''}`}
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => handleToggle(task.id)}
            disabled={isPending}
          />
          <span className="task-title">{task.title}</span>
          <span className={`priority ${task.priority}`}>
            {task.priority === 'low' ? '低' : task.priority === 'medium' ? '中' : '高'}
          </span>
          <button
            onClick={() => handleDelete(task.id)}
            disabled={isPending}
            className="delete-btn"
          >
            删除
          </button>
        </li>
      ))}
    </ul>
  )
}
```

### 使用 Server Actions 上传文件

```typescript
// actions/upload.ts
'use server'

import { writeFile } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type UploadResult = {
  success: boolean
  error?: string
  url?: string
}

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const session = await auth()
  if (!session) {
    return { success: false, error: '需要身份验证' }
  }

  const file = formData.get('file') as File | null

  if (!file) {
    return { success: false, error: '未提供文件' }
  }

  // 验证文件类型
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: '无效的文件类型。允许：JPEG、PNG、WebP、GIF'
    }
  }

  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: '文件太大。最大大小：5MB'
    }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成唯一文件名
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const extension = file.type.split('/')[1]
    const filename = `${session.userId}-${uniqueSuffix}.${extension}`

    // 保存到上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // 保存到数据库
    await db.image.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        userId: session.userId
      }
    })

    revalidatePath('/gallery')

    return {
      success: true,
      url: `/uploads/${filename}`
    }
  } catch (error) {
    console.error('上传失败:', error)
    return { success: false, error: '上传失败，请重试。' }
  }
}
```

```typescript
// components/ImageUploader.tsx
'use client'

import { useState, useRef } from 'react'
import { uploadImage } from '@/actions/upload'

export function ImageUploader() {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<{ url?: string; error?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 显示预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(formData: FormData) {
    setUploading(true)
    setResult(null)

    const uploadResult = await uploadImage(formData)

    setUploading(false)
    setResult(uploadResult)

    if (uploadResult.success) {
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="uploader">
      <form action={handleSubmit}>
        <div className="drop-zone">
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            required
          />

          {preview ? (
            <img src={preview} alt="预览" className="preview" />
          ) : (
            <p>拖放图片或点击选择</p>
          )}
        </div>

        <button type="submit" disabled={uploading || !preview}>
          {uploading ? '上传中...' : '上传'}
        </button>
      </form>

      {result?.error && (
        <p className="error">{result.error}</p>
      )}

      {result?.url && (
        <div className="success">
          <p>上传成功！</p>
          <img src={result.url} alt="已上传" className="uploaded-image" />
        </div>
      )}
    </div>
  )
}
```

### 使用 Server Actions 实现实时搜索

```typescript
// actions/search.ts
'use server'

import { db } from '@/lib/db'

type SearchResult = {
  id: string
  title: string
  excerpt: string
  type: 'post' | 'user' | 'product'
}

export async function search(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) {
    return []
  }

  const [posts, users, products] = await Promise.all([
    db.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: { id: true, title: true, content: true }
    }),
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: { id: true, name: true, email: true }
    }),
    db.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: { id: true, name: true, description: true }
    })
  ])

  return [
    ...posts.map(p => ({
      id: p.id,
      title: p.title,
      excerpt: p.content.slice(0, 100),
      type: 'post' as const
    })),
    ...users.map(u => ({
      id: u.id,
      title: u.name,
      excerpt: u.email,
      type: 'user' as const
    })),
    ...products.map(p => ({
      id: p.id,
      title: p.name,
      excerpt: p.description?.slice(0, 100) || '',
      type: 'product' as const
    }))
  ]
}
```

```typescript
// components/SearchBar.tsx
'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { search } from '@/actions/search'
import { useDebounce } from '@/hooks/useDebounce'

type SearchResult = {
  id: string
  title: string
  excerpt: string
  type: 'post' | 'user' | 'product'
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      startTransition(async () => {
        const searchResults = await search(debouncedQuery)
        setResults(searchResults)
        setIsOpen(true)
      })
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [debouncedQuery])

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const typeLabels = {
    post: '文章',
    user: '用户',
    product: '产品'
  }

  return (
    <div ref={containerRef} className="search-container">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索..."
        className="search-input"
        onFocus={() => results.length > 0 && setIsOpen(true)}
      />

      {isPending && <span className="search-spinner" />}

      {isOpen && results.length > 0 && (
        <ul className="search-results">
          {results.map(result => (
            <li key={`${result.type}-${result.id}`}>
              <a href={`/${result.type}s/${result.id}`}>
                <span className="result-type">{typeLabels[result.type]}</span>
                <span className="result-title">{result.title}</span>
                <span className="result-excerpt">{result.excerpt}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isPending && (
        <div className="no-results">未找到结果</div>
      )}
    </div>
  )
}
```

## 最佳实践

### 1. 按领域组织 Actions

```typescript
// actions/index.ts - 重新导出以获得更清晰的导入
export * from './users'
export * from './posts'
export * from './comments'

// actions/users.ts
'use server'

export async function createUser() { /* ... */ }
export async function updateUser() { /* ... */ }
export async function deleteUser() { /* ... */ }

// actions/posts.ts
'use server'

export async function createPost() { /* ... */ }
export async function updatePost() { /* ... */ }
export async function deletePost() { /* ... */ }
```

### 2. 类型安全的返回值

```typescript
// lib/action-utils.ts
type ActionSuccess<T> = {
  success: true
  data: T
}

type ActionError = {
  success: false
  error: string
  fieldErrors?: Record<string, string[]>
}

type ActionResult<T> = ActionSuccess<T> | ActionError

export function success<T>(data: T): ActionSuccess<T> {
  return { success: true, data }
}

export function error(message: string, fieldErrors?: Record<string, string[]>): ActionError {
  return { success: false, error: message, fieldErrors }
}

// 在 action 中使用
'use server'

import { success, error } from '@/lib/action-utils'

export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session) {
    return error('请先登录')
  }

  const title = formData.get('title') as string
  if (!title) {
    return error('验证失败', { title: ['标题是必需的'] })
  }

  const post = await db.posts.create({ data: { title } })
  return success(post)
}
```

### 3. 重新验证策略

```typescript
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

// 基于路径的重新验证
export async function updatePost(id: string, data: FormData) {
  await db.posts.update({ where: { id }, data: { /* ... */ } })

  // 重新验证特定页面
  revalidatePath(`/posts/${id}`)

  // 重新验证列表页面
  revalidatePath('/posts')

  // 重新验证布局（包括所有嵌套路由）
  revalidatePath('/posts', 'layout')
}

// 基于标签的重新验证（更细粒度）
export async function updatePost(id: string, data: FormData) {
  await db.posts.update({ where: { id }, data: { /* ... */ } })

  // 重新验证所有带此标签的缓存
  revalidateTag('posts')
  revalidateTag(`post-${id}`)
}

// 在数据获取中
async function getPost(id: string) {
  const post = await fetch(`/api/posts/${id}`, {
    next: { tags: ['posts', `post-${id}`] }
  })
  return post
}
```

### 4. 可组合的 Actions

```typescript
// actions/base.ts
'use server'

import { auth } from '@/lib/auth'

type AuthenticatedAction<T extends any[], R> = (
  userId: string,
  ...args: T
) => Promise<R>

export function withAuth<T extends any[], R>(
  action: AuthenticatedAction<T, R>
) {
  return async (...args: T): Promise<R | { error: string }> => {
    const session = await auth()
    if (!session) {
      return { error: '需要身份验证' }
    }
    return action(session.userId, ...args)
  }
}

// 使用
const createPost = withAuth(async (userId, formData: FormData) => {
  // userId 保证存在
  const post = await db.posts.create({
    data: {
      title: formData.get('title') as string,
      authorId: userId
    }
  })
  return { success: true, post }
})
```

### 5. 速率限制

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10秒内10个请求
})

// actions/protected.ts
'use server'

import { headers } from 'next/headers'
import { ratelimit } from '@/lib/rate-limit'

export async function protectedAction(formData: FormData) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || 'anonymous'

  const { success, limit, reset, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return {
      error: '请求过多，请稍后重试。',
      retryAfter: reset
    }
  }

  // 继续执行 action
  // ...
}
```

## 常见陷阱

### 1. 忘记 'use server' 指令

```typescript
// 错误 - Action 将在客户端运行（并失败）
export async function createPost(formData: FormData) {
  await db.posts.create({ /* ... */ }) // db 在客户端不可用！
}

// 正确 - 标记为 server action
'use server'

export async function createPost(formData: FormData) {
  await db.posts.create({ /* ... */ })
}
```

### 2. 未验证输入

```typescript
// 错误 - 信任所有输入
'use server'

export async function updateUser(formData: FormData) {
  const id = formData.get('id') as string
  const role = formData.get('role') as string

  // 危险！用户可能将自己设置为管理员
  await db.users.update({
    where: { id },
    data: { role }
  })
}

// 正确 - 验证和授权
'use server'

export async function updateUser(formData: FormData) {
  const session = await auth()
  if (!session) {
    return { error: '未认证' }
  }

  const id = formData.get('id') as string

  // 只允许用户更新自己的资料
  if (id !== session.userId) {
    return { error: '未授权' }
  }

  // 不允许通过此 action 更改角色
  const name = formData.get('name') as string
  const schema = z.string().min(1).max(100)
  const parsed = schema.safeParse(name)

  if (!parsed.success) {
    return { error: '无效的名称' }
  }

  await db.users.update({
    where: { id: session.userId },
    data: { name: parsed.data }
  })
}
```

### 3. 暴露敏感数据

```typescript
// 错误 - 返回敏感数据
'use server'

export async function getUser(id: string) {
  return db.users.findUnique({
    where: { id }
    // 返回密码哈希、令牌等！
  })
}

// 正确 - 只选择需要的字段
'use server'

export async function getUser(id: string) {
  return db.users.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true
      // 没有密码，没有令牌
    }
  })
}
```

### 4. 缺少错误边界

```typescript
// 错误 - 未处理的错误导致应用崩溃
'use server'

export async function riskyAction() {
  const result = await externalAPI.call() // 可能抛出
  return result
}

// 正确 - 捕获和处理错误
'use server'

export async function riskyAction() {
  try {
    const result = await externalAPI.call()
    return { success: true, data: result }
  } catch (error) {
    console.error('API 调用失败:', error)
    return { success: false, error: '操作失败，请重试。' }
  }
}
```

### 5. 非表单 Actions 未使用 Transitions

```typescript
// 错误 - UI 不显示加载状态
function LikeButton({ postId }) {
  async function handleClick() {
    await likePost(postId) // UI 冻结
  }

  return <button onClick={handleClick}>点赞</button>
}

// 正确 - 使用 transition 获取待处理状态
function LikeButton({ postId }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await likePost(postId)
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? '点赞中...' : '点赞'}
    </button>
  )
}
```

## 性能考量

### 最小化服务器往返

```typescript
// 错误 - 相关数据多个 actions
await updateTitle(id, newTitle)
await updateContent(id, newContent)
await updateTags(id, newTags)
// 3 次往返！

// 正确 - 批量更新的单个 action
'use server'

export async function updatePost(id: string, updates: {
  title?: string
  content?: string
  tags?: string[]
}) {
  await db.posts.update({
    where: { id },
    data: updates
  })
  revalidatePath(`/posts/${id}`)
}

// 使用 - 1 次往返
await updatePost(id, { title, content, tags })
```

### 并行执行

```typescript
// 错误 - 顺序执行
'use server'

export async function getPageData(id: string) {
  const post = await db.posts.findUnique({ where: { id } })
  const comments = await db.comments.findMany({ where: { postId: id } })
  const author = await db.users.findUnique({ where: { id: post.authorId } })
  return { post, comments, author }
}

// 正确 - 并行执行
'use server'

export async function getPageData(id: string) {
  const post = await db.posts.findUnique({ where: { id } })

  // 这些可以并行运行
  const [comments, author] = await Promise.all([
    db.comments.findMany({ where: { postId: id } }),
    db.users.findUnique({ where: { id: post.authorId } })
  ])

  return { post, comments, author }
}
```

### 缓存 Action 结果

```typescript
import { unstable_cache } from 'next/cache'

// 缓存昂贵的计算
const getCachedStats = unstable_cache(
  async (userId: string) => {
    return db.stats.aggregate({
      where: { userId },
      // 复杂聚合
    })
  },
  ['user-stats'],
  { revalidate: 60 } // 缓存60秒
)

'use server'

export async function getUserDashboard() {
  const session = await auth()
  if (!session) return null

  const stats = await getCachedStats(session.userId)
  return { stats }
}
```

## 实战场景

### 电商结账流程

```typescript
// actions/checkout.ts
'use server'

import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type CheckoutState = {
  error?: string
  step: 'cart' | 'shipping' | 'payment' | 'confirmation'
}

export async function validateCart(): Promise<{
  valid: boolean
  errors?: string[]
}> {
  const session = await auth()
  if (!session) {
    return { valid: false, errors: ['请登录后结账'] }
  }

  const cart = await db.cart.findUnique({
    where: { userId: session.userId },
    include: { items: { include: { product: true } } }
  })

  if (!cart || cart.items.length === 0) {
    return { valid: false, errors: ['您的购物车是空的'] }
  }

  // 检查库存可用性
  const outOfStock = cart.items.filter(
    item => item.quantity > item.product.stock
  )

  if (outOfStock.length > 0) {
    return {
      valid: false,
      errors: outOfStock.map(
        item => `${item.product.name} 只有 ${item.product.stock} 件库存`
      )
    }
  }

  return { valid: true }
}

export async function saveShippingAddress(formData: FormData) {
  const session = await auth()
  if (!session) {
    return { error: '请先登录' }
  }

  const address = {
    street: formData.get('street') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip: formData.get('zip') as string,
    country: formData.get('country') as string
  }

  // 验证地址
  // ...

  await db.order.upsert({
    where: { cartId: session.cartId },
    update: { shippingAddress: address },
    create: {
      cartId: session.cartId,
      userId: session.userId,
      shippingAddress: address,
      status: 'pending'
    }
  })

  return { success: true }
}

export async function createPaymentIntent() {
  const session = await auth()
  if (!session) {
    return { error: '请先登录' }
  }

  const cart = await db.cart.findUnique({
    where: { userId: session.userId },
    include: { items: { include: { product: true } } }
  })

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100), // 转换为分
    currency: 'cny',
    metadata: { orderId: cart.orderId }
  })

  return {
    success: true,
    clientSecret: paymentIntent.client_secret
  }
}

export async function completeOrder(paymentIntentId: string) {
  const session = await auth()
  if (!session) {
    return { error: '请先登录' }
  }

  // 验证支付
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status !== 'succeeded') {
    return { error: '支付未完成' }
  }

  // 更新订单状态
  const order = await db.order.update({
    where: { id: paymentIntent.metadata.orderId },
    data: {
      status: 'paid',
      paidAt: new Date()
    }
  })

  // 减少库存
  const cart = await db.cart.findUnique({
    where: { id: order.cartId },
    include: { items: true }
  })

  await Promise.all(
    cart.items.map(item =>
      db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    )
  )

  // 清空购物车
  await db.cart.delete({ where: { id: order.cartId } })

  revalidatePath('/orders')
  redirect(`/orders/${order.id}/confirmation`)
}
```

## 面试要点

### 基础概念

**Q1：什么是 Server Actions，它们与 API 路由有什么区别？**

Server Actions 是在服务器上运行但可以从 React 组件直接调用的异步函数。与 API 路由的主要区别：

1. **调用方式**：Server Actions 像普通函数一样调用，而不是通过 HTTP 请求
2. **类型安全**：完整的 TypeScript 支持，自动类型推断
3. **集成**：与 React 的表单处理和 transitions 直接集成
4. **无需手动序列化**：参数和返回值自动序列化

**Q2：'use server' 指令如何工作？**

`'use server'` 指令将函数标记为 Server Actions。它可以是：
- 文件级：使文件中的所有导出成为 Server Actions
- 内联：使组件内的特定函数成为 Server Action

当 React 遇到这个指令时，它会创建一个对函数的引用，当调用时，会向服务器发送 HTTP 请求。

**Q3：Server Actions 的安全影响是什么？**

关键的安全考虑：
1. **闭包加密**：捕获的值在发送到客户端之前会被加密
2. **身份验证**：必须在每个 action 中检查
3. **输入验证**：所有输入必须在服务器端验证
4. **授权**：操作前验证用户权限
5. **CSRF 保护**：内置同源检查

### 实践问题

**Q4：如何在 Server Actions 中处理错误？**

```typescript
'use server'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function safeAction(data: FormData): Promise<Result<User>> {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: '未认证' }
    }

    const user = await db.users.create({ /* ... */ })
    return { success: true, data: user }
  } catch (e) {
    console.error(e)
    return { success: false, error: '操作失败' }
  }
}
```

**Q5：乐观更新如何与 Server Actions 配合工作？**

使用 `useOptimistic` 显示即时 UI 更新：

```typescript
const [optimisticItems, addOptimistic] = useOptimistic(items, (state, newItem) => {
  return [...state, { ...newItem, pending: true }]
})

async function handleAdd(formData: FormData) {
  addOptimistic({ id: 'temp', name: formData.get('name') })
  await addItem(formData)
}
```

**Q6：useActionState 和 useFormStatus 有什么区别？**

- `useFormStatus`：为最近的父表单提供待处理状态
- `useActionState`：管理 action 状态，包括返回值和待处理状态

```typescript
// useFormStatus - 只有待处理状态
function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>提交</button>
}

// useActionState - 完整的状态管理
const [state, action, pending] = useActionState(serverAction, initialState)
```

### 高级问题

**Q7：如何使用 Server Actions 实现渐进增强？**

通过使用原生表单提交，Server Actions 在没有 JavaScript 的情况下也能工作：

```typescript
// 即使 JS 加载失败，此表单也能工作
<form action={serverAction}>
  <input name="email" type="email" required />
  <button type="submit">订阅</button>
</form>
```

**Q8：如何在 Server Actions 中处理文件上传？**

```typescript
'use server'

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // 保存到存储
  await saveToStorage(buffer, file.name)
}
```

## 延伸阅读

### 官方文档

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) - 官方 Next.js 指南
- [React Server Actions RFC](https://github.com/reactjs/rfcs/blob/main/text/0000-server-actions.md) - 原始提案
- [React 19 文档](https://react.dev/reference/rsc/server-actions) - React 官方文档

### 框架指南

- [Vercel Server Actions 指南](https://vercel.com/docs/functions/server-actions) - 部署注意事项
- [SolidStart Actions](https://start.solidjs.com/core-concepts/actions) - SolidJS 中的类似模式
- [Remix Actions](https://remix.run/docs/en/main/route/action) - Remix 中的类似方法

### 教程和示例

- [Next.js 表单和变更](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations) - 官方教程
- [Server Actions 最佳实践](https://www.youtube.com/watch?v=dDpZfOQBMaU) - Vercel 教程
- [使用 Server Actions 构建表单](https://www.pronextjs.dev/server-actions) - 高级模式

### 相关技术

- [Zod](https://zod.dev/) - Server Actions 的模式验证
- [next-safe-action](https://github.com/TheEdoRan/next-safe-action) - 类型安全的 action 库
- [React Hook Form](https://react-hook-form.com/) - 客户端表单处理

---

Server Actions 代表了我们在 React 应用中处理数据变更方式的重大演进。通过消除客户端和服务器代码之间的间隙，同时维护清晰的安全边界，它们能够更快地开发全栈功能。随着生态系统的成熟和更多框架采用类似模式，理解 Server Actions 成为现代 React 开发的必备技能。
