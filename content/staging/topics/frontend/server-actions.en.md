---
title: Server Actions
description: Deep dive into Server Actions - the revolutionary pattern for handling server-side mutations directly from React components
track: frontend
section: react
difficulty: intermediate
tags:
  - Server Actions
  - React
  - Next.js
  - Server Components
  - Forms
  - Data Mutations
status: imported
origin: old/src/content/docs/frontend/server-actions.en.md
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

Server Actions represent a fundamental shift in how we handle data mutations in React applications. By allowing server-side code to be called directly from client components, they eliminate the need for separate API routes and provide a more seamless developer experience. This article explores Server Actions in depth, from their conceptual foundations to advanced implementation patterns.

## Concept Explanation

### What Are Server Actions?

**Server Actions** are asynchronous functions that execute on the server but can be invoked directly from client-side React components. They provide a type-safe, secure way to handle form submissions and data mutations without manually creating API endpoints.

```typescript
// A simple Server Action
'use server'

async function createUser(formData: FormData) {
  const name = formData.get('name')
  const email = formData.get('email')

  await db.users.create({ name, email })

  revalidatePath('/users')
}
```

The key insight is that Server Actions blur the line between client and server code while maintaining clear security boundaries. They run exclusively on the server but can be passed to and invoked from client components.

### History and Evolution

| Year | Milestone | Significance |
|------|-----------|--------------|
| 2020 | React Server Components RFC | Foundation for server-side React |
| 2022 | Next.js 13 App Router | Server Components in production |
| 2023 | Server Actions Alpha | Initial mutation primitive |
| 2023 | Next.js 14 Stable | Server Actions become stable |
| 2024 | React 19 Canary | Native React support |
| 2025 | React 19 Stable | Server Actions standardized |
| 2026 | Ecosystem adoption | Wide framework support |

### The Problem They Solve

Before Server Actions, handling mutations required multiple layers:

```typescript
// Traditional approach - multiple files, manual wiring

// app/api/users/route.ts
export async function POST(request: Request) {
  const body = await request.json()

  // Validate input
  if (!body.name || !body.email) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Create user
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
        throw new Error('Failed to create user')
      }

      // Manually revalidate or redirect
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

With Server Actions:

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
      <button type="submit">Create User</button>
    </form>
  )
}
```

### How Server Actions Work

```
┌─────────────────────────────────────────────────────────────┐
│                    Server Action Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CLIENT INVOCATION                                        │
│     ├── User triggers action (form submit, button click)     │
│     ├── React serializes arguments                           │
│     └── HTTP POST request sent to server                     │
│                                                              │
│  2. SERVER EXECUTION                                         │
│     ├── Server receives request                              │
│     ├── Arguments deserialized                               │
│     ├── Action function executes                             │
│     └── Database/external service calls                      │
│                                                              │
│  3. RESPONSE HANDLING                                        │
│     ├── Return value serialized                              │
│     ├── Revalidation directives processed                    │
│     ├── Redirect instructions handled                        │
│     └── Response sent to client                              │
│                                                              │
│  4. CLIENT UPDATE                                            │
│     ├── React processes response                             │
│     ├── UI updates with new server state                     │
│     ├── Pending state cleared                                │
│     └── Optimistic updates reconciled                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles

### The 'use server' Directive

The `'use server'` directive marks functions as Server Actions:

```typescript
// File-level directive - all exports are Server Actions
'use server'

export async function createPost(data: FormData) {
  // Runs on server
}

export async function deletePost(id: string) {
  // Also runs on server
}
```

```typescript
// Inline directive - specific function is a Server Action
async function ClientComponent() {
  async function handleAction(data: FormData) {
    'use server'
    // This specific function runs on server
  }

  return <form action={handleAction}>...</form>
}
```

### Serialization Boundaries

Server Actions can only accept and return serializable values:

```typescript
// VALID - Serializable types
'use server'

async function validAction(
  text: string,           // Primitives
  count: number,
  active: boolean,
  items: string[],        // Arrays
  config: {               // Plain objects
    setting: string
  },
  formData: FormData      // FormData
): Promise<{             // Return serializable
  success: boolean
  id: string
}> {
  // ...
}

// INVALID - Non-serializable types
async function invalidAction(
  callback: () => void,   // Functions
  element: JSX.Element,   // React elements
  classInstance: MyClass, // Class instances
  date: Date,             // Some objects (use ISO string)
  map: Map<string, any>   // Map/Set
) {
  // Won't work
}
```

### Security Model

Server Actions include built-in security features:

```typescript
'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'

// 1. Authentication check
async function secureAction(data: FormData) {
  const session = await auth()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // 2. Input validation
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

  // 3. Authorization check
  const canCreate = await checkPermission(session.userId, 'posts:create')
  if (!canCreate) {
    throw new Error('Forbidden')
  }

  // 4. Safe database operation
  const post = await db.posts.create({
    data: parsed.data,
    userId: session.userId // Use authenticated user ID
  })

  return { success: true, post }
}
```

### Closures and Captured Values

Server Actions can capture values from their scope:

```typescript
// Server Component
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

// Using closure to capture postId
function DeleteButton({ postId }: { postId: string }) {
  async function deletePost() {
    'use server'
    // postId is encrypted and sent with the action
    await db.posts.delete({ where: { id: postId } })
    revalidatePath('/posts')
  }

  return (
    <form action={deletePost}>
      <button type="submit">Delete</button>
    </form>
  )
}
```

**Important**: Captured values are encrypted when sent to the client. This prevents tampering but you should still validate authorization.

## Core Concepts

### 1. Form Actions

The most common use case - binding actions to forms:

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
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

### 2. Using useFormStatus

Track pending state during form submission:

```typescript
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
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

### 3. Using useActionState (React 19)

Handle action state with the new React 19 hook:

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
      {state.success && <p className="success">Post created!</p>}

      <input name="title" required />
      <textarea name="content" required />

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}
```

### 4. Optimistic Updates

Show immediate feedback before server response:

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

    // Immediately show optimistic update
    addOptimisticTodo({
      id: `temp-${Date.now()}`,
      text,
      completed: false
    })

    // Then perform actual action
    await addTodo(formData)
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="text" placeholder="New todo" required />
        <button type="submit">Add</button>
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

### 5. Non-Form Invocation

Call Server Actions outside of forms:

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
      {isPending ? '...' : `${likes} Likes`}
    </button>
  )
}
```

### 6. Error Handling

Handle errors gracefully in Server Actions:

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
    // Validate session
    const session = await auth()
    if (!session) {
      return { success: false, error: 'Please sign in to create a post' }
    }

    // Validate input
    const title = formData.get('title') as string
    if (!title || title.length < 3) {
      return { success: false, error: 'Title must be at least 3 characters' }
    }

    // Create post
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
    console.error('Failed to create post:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
```

## Code Examples

### Complete CRUD Implementation

```typescript
// actions/tasks.ts
'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional()
})

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
  completed: z.boolean().optional()
})

// Types
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
    return { success: false, error: 'Authentication required' }
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
    return { success: false, error: 'Failed to create task' }
  }
}

// READ (for server components, not an action)
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
    return { success: false, error: 'Authentication required' }
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

  // Verify ownership
  const existing = await db.task.findUnique({
    where: { id: parsed.data.id }
  })

  if (!existing || existing.userId !== session.userId) {
    return { success: false, error: 'Task not found' }
  }

  try {
    const task = await db.task.update({
      where: { id: parsed.data.id },
      data: parsed.data
    })

    revalidatePath('/tasks')
    return { success: true, data: task }
  } catch (error) {
    return { success: false, error: 'Failed to update task' }
  }
}

// DELETE
export async function deleteTask(id: string): Promise<ActionState> {
  const session = await auth()
  if (!session) {
    return { success: false, error: 'Authentication required' }
  }

  // Verify ownership
  const existing = await db.task.findUnique({
    where: { id }
  })

  if (!existing || existing.userId !== session.userId) {
    return { success: false, error: 'Task not found' }
  }

  try {
    await db.task.delete({ where: { id } })
    revalidatePath('/tasks')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete task' }
  }
}

// TOGGLE COMPLETION
export async function toggleTaskComplete(id: string): Promise<ActionState> {
  const session = await auth()
  if (!session) {
    return { success: false, error: 'Authentication required' }
  }

  const existing = await db.task.findUnique({
    where: { id }
  })

  if (!existing || existing.userId !== session.userId) {
    return { success: false, error: 'Task not found' }
  }

  try {
    const task = await db.task.update({
      where: { id },
      data: { completed: !existing.completed }
    })

    revalidatePath('/tasks')
    return { success: true, data: task }
  } catch (error) {
    return { success: false, error: 'Failed to update task' }
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
        <label htmlFor="title">Title</label>
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
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} />
      </div>

      <div className="field">
        <label htmlFor="priority">Priority</label>
        <select id="priority" name="priority" defaultValue="medium">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="dueDate">Due Date</label>
        <input id="dueDate" name="dueDate" type="datetime-local" />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Task'}
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
    if (!confirm('Delete this task?')) return

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
            {task.priority}
          </span>
          <button
            onClick={() => handleDelete(task.id)}
            disabled={isPending}
            className="delete-btn"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
```

### File Upload with Server Actions

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
    return { success: false, error: 'Authentication required' }
  }

  const file = formData.get('file') as File | null

  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'
    }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: 'File too large. Maximum size: 5MB'
    }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const extension = file.type.split('/')[1]
    const filename = `${session.userId}-${uniqueSuffix}.${extension}`

    // Save to uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Save to database
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
    console.error('Upload failed:', error)
    return { success: false, error: 'Upload failed. Please try again.' }
  }
}

export async function uploadMultipleImages(
  formData: FormData
): Promise<{ success: boolean; results: UploadResult[] }> {
  const files = formData.getAll('files') as File[]
  const results: UploadResult[] = []

  for (const file of files) {
    const singleFormData = new FormData()
    singleFormData.append('file', file)
    const result = await uploadImage(singleFormData)
    results.push(result)
  }

  return {
    success: results.every(r => r.success),
    results
  }
}
```

```typescript
// components/ImageUploader.tsx
'use client'

import { useState, useRef } from 'react'
import { uploadImage, uploadMultipleImages } from '@/actions/upload'

export function ImageUploader() {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<{ url?: string; error?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
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
            <img src={preview} alt="Preview" className="preview" />
          ) : (
            <p>Drop an image or click to select</p>
          )}
        </div>

        <button type="submit" disabled={uploading || !preview}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {result?.error && (
        <p className="error">{result.error}</p>
      )}

      {result?.url && (
        <div className="success">
          <p>Upload successful!</p>
          <img src={result.url} alt="Uploaded" className="uploaded-image" />
        </div>
      )}
    </div>
  )
}
```

### Real-time Search with Server Actions

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

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="search-container">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="search-input"
        onFocus={() => results.length > 0 && setIsOpen(true)}
      />

      {isPending && <span className="search-spinner" />}

      {isOpen && results.length > 0 && (
        <ul className="search-results">
          {results.map(result => (
            <li key={`${result.type}-${result.id}`}>
              <a href={`/${result.type}s/${result.id}`}>
                <span className="result-type">{result.type}</span>
                <span className="result-title">{result.title}</span>
                <span className="result-excerpt">{result.excerpt}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isPending && (
        <div className="no-results">No results found</div>
      )}
    </div>
  )
}
```

## Best Practices

### 1. Organize Actions by Domain

```typescript
// actions/index.ts - Re-export for cleaner imports
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

### 2. Type-Safe Return Values

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

// Usage in action
'use server'

import { success, error } from '@/lib/action-utils'

export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session) {
    return error('Please sign in')
  }

  const title = formData.get('title') as string
  if (!title) {
    return error('Validation failed', { title: ['Title is required'] })
  }

  const post = await db.posts.create({ data: { title } })
  return success(post)
}
```

### 3. Revalidation Strategies

```typescript
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

// Path-based revalidation
export async function updatePost(id: string, data: FormData) {
  await db.posts.update({ where: { id }, data: { /* ... */ } })

  // Revalidate specific page
  revalidatePath(`/posts/${id}`)

  // Revalidate listing page
  revalidatePath('/posts')

  // Revalidate layout (includes all nested routes)
  revalidatePath('/posts', 'layout')
}

// Tag-based revalidation (more granular)
export async function updatePost(id: string, data: FormData) {
  await db.posts.update({ where: { id }, data: { /* ... */ } })

  // Revalidate all caches with this tag
  revalidateTag('posts')
  revalidateTag(`post-${id}`)
}

// In your data fetching
async function getPost(id: string) {
  const post = await fetch(`/api/posts/${id}`, {
    next: { tags: ['posts', `post-${id}`] }
  })
  return post
}
```

### 4. Composable Actions

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
      return { error: 'Authentication required' }
    }
    return action(session.userId, ...args)
  }
}

// Usage
const createPost = withAuth(async (userId, formData: FormData) => {
  // userId is guaranteed to exist
  const post = await db.posts.create({
    data: {
      title: formData.get('title') as string,
      authorId: userId
    }
  })
  return { success: true, post }
})
```

### 5. Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
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
      error: 'Too many requests. Please try again later.',
      retryAfter: reset
    }
  }

  // Proceed with action
  // ...
}
```

## Common Pitfalls

### 1. Forgetting 'use server' Directive

```typescript
// WRONG - Action will run on client (and fail)
export async function createPost(formData: FormData) {
  await db.posts.create({ /* ... */ }) // db is not available on client!
}

// CORRECT - Marked as server action
'use server'

export async function createPost(formData: FormData) {
  await db.posts.create({ /* ... */ })
}
```

### 2. Not Validating Input

```typescript
// WRONG - Trust all input
'use server'

export async function updateUser(formData: FormData) {
  const id = formData.get('id') as string
  const role = formData.get('role') as string

  // Dangerous! User could set themselves as admin
  await db.users.update({
    where: { id },
    data: { role }
  })
}

// CORRECT - Validate and authorize
'use server'

export async function updateUser(formData: FormData) {
  const session = await auth()
  if (!session) {
    return { error: 'Not authenticated' }
  }

  const id = formData.get('id') as string

  // Only allow users to update their own profile
  if (id !== session.userId) {
    return { error: 'Not authorized' }
  }

  // Don't allow role changes through this action
  const name = formData.get('name') as string
  const schema = z.string().min(1).max(100)
  const parsed = schema.safeParse(name)

  if (!parsed.success) {
    return { error: 'Invalid name' }
  }

  await db.users.update({
    where: { id: session.userId },
    data: { name: parsed.data }
  })
}
```

### 3. Exposing Sensitive Data

```typescript
// WRONG - Returning sensitive data
'use server'

export async function getUser(id: string) {
  return db.users.findUnique({
    where: { id }
    // Returns password hash, tokens, etc!
  })
}

// CORRECT - Select only needed fields
'use server'

export async function getUser(id: string) {
  return db.users.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true
      // No password, no tokens
    }
  })
}
```

### 4. Missing Error Boundaries

```typescript
// WRONG - Unhandled errors crash the app
'use server'

export async function riskyAction() {
  const result = await externalAPI.call() // Could throw
  return result
}

// CORRECT - Catch and handle errors
'use server'

export async function riskyAction() {
  try {
    const result = await externalAPI.call()
    return { success: true, data: result }
  } catch (error) {
    console.error('API call failed:', error)
    return { success: false, error: 'Operation failed. Please try again.' }
  }
}
```

### 5. Not Using Transitions for Non-Form Actions

```typescript
// WRONG - UI doesn't show loading state
function LikeButton({ postId }) {
  async function handleClick() {
    await likePost(postId) // UI freezes
  }

  return <button onClick={handleClick}>Like</button>
}

// CORRECT - Use transition for pending state
function LikeButton({ postId }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await likePost(postId)
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Liking...' : 'Like'}
    </button>
  )
}
```

## Performance Considerations

### Minimizing Server Round-trips

```typescript
// WRONG - Multiple actions for related data
await updateTitle(id, newTitle)
await updateContent(id, newContent)
await updateTags(id, newTags)
// 3 round-trips!

// CORRECT - Single action for batch updates
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

// Usage - 1 round-trip
await updatePost(id, { title, content, tags })
```

### Parallel Execution

```typescript
// WRONG - Sequential execution
'use server'

export async function getPageData(id: string) {
  const post = await db.posts.findUnique({ where: { id } })
  const comments = await db.comments.findMany({ where: { postId: id } })
  const author = await db.users.findUnique({ where: { id: post.authorId } })
  return { post, comments, author }
}

// CORRECT - Parallel execution
'use server'

export async function getPageData(id: string) {
  const post = await db.posts.findUnique({ where: { id } })

  // These can run in parallel
  const [comments, author] = await Promise.all([
    db.comments.findMany({ where: { postId: id } }),
    db.users.findUnique({ where: { id: post.authorId } })
  ])

  return { post, comments, author }
}
```

### Caching Action Results

```typescript
import { unstable_cache } from 'next/cache'

// Cache expensive computations
const getCachedStats = unstable_cache(
  async (userId: string) => {
    return db.stats.aggregate({
      where: { userId },
      // Complex aggregation
    })
  },
  ['user-stats'],
  { revalidate: 60 } // Cache for 60 seconds
)

'use server'

export async function getUserDashboard() {
  const session = await auth()
  if (!session) return null

  const stats = await getCachedStats(session.userId)
  return { stats }
}
```

## Real-World Scenarios

### E-commerce Checkout Flow

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
    return { valid: false, errors: ['Please sign in to checkout'] }
  }

  const cart = await db.cart.findUnique({
    where: { userId: session.userId },
    include: { items: { include: { product: true } } }
  })

  if (!cart || cart.items.length === 0) {
    return { valid: false, errors: ['Your cart is empty'] }
  }

  // Check stock availability
  const outOfStock = cart.items.filter(
    item => item.quantity > item.product.stock
  )

  if (outOfStock.length > 0) {
    return {
      valid: false,
      errors: outOfStock.map(
        item => `${item.product.name} only has ${item.product.stock} in stock`
      )
    }
  }

  return { valid: true }
}

export async function saveShippingAddress(formData: FormData) {
  const session = await auth()
  if (!session) {
    return { error: 'Please sign in' }
  }

  const address = {
    street: formData.get('street') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip: formData.get('zip') as string,
    country: formData.get('country') as string
  }

  // Validate address
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
    return { error: 'Please sign in' }
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
    amount: Math.round(total * 100), // Convert to cents
    currency: 'usd',
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
    return { error: 'Please sign in' }
  }

  // Verify payment
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status !== 'succeeded') {
    return { error: 'Payment not completed' }
  }

  // Update order status
  const order = await db.order.update({
    where: { id: paymentIntent.metadata.orderId },
    data: {
      status: 'paid',
      paidAt: new Date()
    }
  })

  // Reduce stock
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

  // Clear cart
  await db.cart.delete({ where: { id: order.cartId } })

  revalidatePath('/orders')
  redirect(`/orders/${order.id}/confirmation`)
}
```

## Interview Key Points

### Fundamental Concepts

**Q1: What are Server Actions and how do they differ from API routes?**

Server Actions are asynchronous functions that run on the server but can be invoked directly from React components. Key differences from API routes:

1. **Invocation**: Server Actions are called like regular functions, not via HTTP requests
2. **Type Safety**: Full TypeScript support with automatic type inference
3. **Integration**: Direct integration with React's form handling and transitions
4. **No Manual Serialization**: Arguments and return values are automatically serialized

**Q2: How does the 'use server' directive work?**

The `'use server'` directive marks functions as Server Actions. It can be:
- File-level: Makes all exports from the file Server Actions
- Inline: Makes a specific function within a component a Server Action

When React encounters this directive, it creates a reference to the function that, when called, sends an HTTP request to the server.

**Q3: What are the security implications of Server Actions?**

Key security considerations:
1. **Closure Encryption**: Captured values are encrypted before sending to client
2. **Authentication**: Must be checked in every action
3. **Input Validation**: All input must be validated server-side
4. **Authorization**: Verify user permissions before operations
5. **CSRF Protection**: Built-in with same-origin checks

### Practical Questions

**Q4: How do you handle errors in Server Actions?**

```typescript
'use server'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function safeAction(data: FormData): Promise<Result<User>> {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const user = await db.users.create({ /* ... */ })
    return { success: true, data: user }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'Operation failed' }
  }
}
```

**Q5: How do optimistic updates work with Server Actions?**

Use `useOptimistic` to show immediate UI updates:

```typescript
const [optimisticItems, addOptimistic] = useOptimistic(items, (state, newItem) => {
  return [...state, { ...newItem, pending: true }]
})

async function handleAdd(formData: FormData) {
  addOptimistic({ id: 'temp', name: formData.get('name') })
  await addItem(formData)
}
```

**Q6: What's the difference between useActionState and useFormStatus?**

- `useFormStatus`: Provides pending state for the nearest parent form
- `useActionState`: Manages action state including return values and pending state

```typescript
// useFormStatus - just pending state
function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>Submit</button>
}

// useActionState - full state management
const [state, action, pending] = useActionState(serverAction, initialState)
```

### Advanced Questions

**Q7: How do you implement progressive enhancement with Server Actions?**

Server Actions work without JavaScript by using native form submissions:

```typescript
// This form works even if JS fails to load
<form action={serverAction}>
  <input name="email" type="email" required />
  <button type="submit">Subscribe</button>
</form>
```

**Q8: How do you handle file uploads in Server Actions?**

```typescript
'use server'

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Save to storage
  await saveToStorage(buffer, file.name)
}
```

## Further Reading

### Official Documentation

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) - Official Next.js guide
- [React Server Actions RFC](https://github.com/reactjs/rfcs/blob/main/text/0000-server-actions.md) - Original proposal
- [React 19 Documentation](https://react.dev/reference/rsc/server-actions) - React official docs

### Framework Guides

- [Vercel Server Actions Guide](https://vercel.com/docs/functions/server-actions) - Deployment considerations
- [SolidStart Actions](https://start.solidjs.com/core-concepts/actions) - Similar pattern in SolidJS
- [Remix Actions](https://remix.run/docs/en/main/route/action) - Comparable approach in Remix

### Tutorials and Examples

- [Next.js Forms and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations) - Official tutorial
- [Server Actions Best Practices](https://www.youtube.com/watch?v=dDpZfOQBMaU) - Vercel tutorial
- [Building Forms with Server Actions](https://www.pronextjs.dev/server-actions) - Advanced patterns

### Related Technologies

- [Zod](https://zod.dev/) - Schema validation for Server Actions
- [next-safe-action](https://github.com/TheEdoRan/next-safe-action) - Type-safe action library
- [React Hook Form](https://react-hook-form.com/) - Client-side form handling

---

Server Actions represent a significant evolution in how we handle data mutations in React applications. By eliminating the gap between client and server code while maintaining clear security boundaries, they enable faster development of full-stack features. As the ecosystem matures and more frameworks adopt similar patterns, understanding Server Actions becomes essential for modern React development.
