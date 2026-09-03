---
title: Remix Full-Stack Framework
description: Learn Remix for building modern full-stack web applications
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Remix
  - full-stack
  - React
  - SSR
status: imported
origin: old/src/content/docs/frontend/remix.en.md
divergence: 0.17
issues: []
legacy:
  category: Frontend
  subcategory: Frameworks
  order: 38
  lastUpdated: 2026-01-07
---

Remix is a full-stack web framework built on React that focuses on web standards and modern web application development. By leveraging native browser features and the HTTP protocol, Remix enables developers to build fast, resilient, and accessible web applications. This comprehensive guide covers Remix philosophy, core concepts, and practical implementation strategies.

## Remix Philosophy

Remix takes a fundamentally different approach to web development compared to traditional single-page applications. Understanding this philosophy is essential for leveraging the framework effectively.

### Web Standards First

Remix embraces web standards rather than abstracting them away:

- **Native Forms**: Uses standard HTML forms with progressive enhancement
- **HTTP Semantics**: Leverages proper HTTP methods (GET, POST, PUT, DELETE)
- **Request/Response Model**: Built on the Fetch API and Web Request/Response objects
- **URL-Based State**: Emphasizes URL as the source of truth for application state

### Progressive Enhancement

Remix applications work without JavaScript and enhance when JavaScript is available:

```javascript
// This form works with or without JavaScript
export default function ContactForm() {
  return (
    <Form method="post">
      <input type="text" name="name" required />
      <input type="email" name="email" required />
      <textarea name="message" required />
      <button type="submit">Send Message</button>
    </Form>
  );
}
```

When JavaScript loads, Remix enhances the form with:
- Client-side validation
- Optimistic UI updates
- Loading states
- Error handling without full page reloads

### Server-Centric Architecture

Remix moves logic back to the server where it belongs:

- Data fetching happens on the server
- Mutations are handled via server actions
- Sensitive logic never reaches the client
- Reduced client-side JavaScript bundle

### The Remix Data Flow

```
User Action (click, form submit)
         |
         v
    [Browser] -----> Request -----> [Server]
         |                              |
         |                              v
         |                        [Loader/Action]
         |                              |
         |                              v
         |                        [Database/API]
         |                              |
         v                              v
    [UI Update] <---- Response <---- [JSON Data]
```

## Getting Started

### Project Setup

Create a new Remix project using the official CLI:

```bash
# Create a new Remix project
npx create-remix@latest my-remix-app

# Navigate to project directory
cd my-remix-app

# Start development server
npm run dev
```

### Project Structure

A typical Remix project structure:

```
my-remix-app/
├── app/
│   ├── routes/           # Route modules
│   │   ├── _index.tsx    # Home page (/)
│   │   ├── about.tsx     # About page (/about)
│   │   └── posts.$id.tsx # Dynamic route (/posts/:id)
│   ├── components/       # Shared components
│   ├── utils/            # Utility functions
│   ├── styles/           # CSS files
│   ├── entry.client.tsx  # Client entry point
│   ├── entry.server.tsx  # Server entry point
│   └── root.tsx          # Root layout
├── public/               # Static assets
├── package.json
├── remix.config.js       # Remix configuration
└── vite.config.ts        # Vite configuration
```

### Root Layout

The root layout defines the HTML document structure:

```typescript
// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import stylesheet from "~/styles/global.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

## Loaders and Actions

Loaders and actions are the core of Remix's data handling. They run only on the server.

### Loaders - Data Fetching

Loaders fetch data for GET requests and provide it to your components:

```typescript
// app/routes/posts.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getPosts } from "~/models/post.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Access request headers, cookies, etc.
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  // Fetch data from database or API
  const posts = await getPosts({ search });

  // Return JSON response
  return json({ posts, search });
}

export default function Posts() {
  // Type-safe access to loader data
  const { posts, search } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Blog Posts</h1>
      {search && <p>Searching for: {search}</p>}
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a href={`/posts/${post.slug}`}>{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Actions - Data Mutations

Actions handle non-GET requests (POST, PUT, PATCH, DELETE):

```typescript
// app/routes/posts.new.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";

import { createPost } from "~/models/post.server";
import { requireUserId } from "~/session.server";

export async function action({ request }: ActionFunctionArgs) {
  // Ensure user is authenticated
  const userId = await requireUserId(request);

  // Parse form data
  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");

  // Validate input
  const errors: Record<string, string> = {};

  if (typeof title !== "string" || title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  }

  if (typeof content !== "string" || content.length < 10) {
    errors.content = "Content must be at least 10 characters";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  // Create the post
  const post = await createPost({
    title: title as string,
    content: content as string,
    authorId: userId,
  });

  // Redirect to the new post
  return redirect(`/posts/${post.slug}`);
}

export default function NewPost() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h1>Create New Post</h1>
      <Form method="post">
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            aria-invalid={actionData?.errors?.title ? true : undefined}
            aria-describedby="title-error"
          />
          {actionData?.errors?.title && (
            <p id="title-error" className="error">
              {actionData.errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            rows={10}
            aria-invalid={actionData?.errors?.content ? true : undefined}
            aria-describedby="content-error"
          />
          {actionData?.errors?.content && (
            <p id="content-error" className="error">
              {actionData.errors.content}
            </p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Post"}
        </button>
      </Form>
    </div>
  );
}
```

### Loader and Action Context

Both loaders and actions receive useful context:

```typescript
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

export async function loader({
  request,  // The incoming Request object
  params,   // URL parameters from dynamic segments
  context,  // Server context (adapter-specific)
}: LoaderFunctionArgs) {
  // Access URL parameters
  const { id } = params;

  // Access query parameters
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";

  // Access headers
  const userAgent = request.headers.get("User-Agent");

  // Access cookies
  const cookieHeader = request.headers.get("Cookie");

  return json({ id, page, userAgent });
}

export async function action({
  request,
  params,
  context,
}: ActionFunctionArgs) {
  // Determine the HTTP method
  const method = request.method;

  // Parse different content types
  const contentType = request.headers.get("Content-Type");

  if (contentType?.includes("application/json")) {
    const body = await request.json();
  } else {
    const formData = await request.formData();
  }

  return json({ success: true });
}
```

## Nested Routing

Remix's nested routing is one of its most powerful features, allowing you to compose complex layouts from simple, focused route modules.

### Route File Conventions

Remix uses file-based routing with specific conventions:

```
app/routes/
├── _index.tsx              # / (index route)
├── about.tsx               # /about
├── posts.tsx               # /posts (layout)
├── posts._index.tsx        # /posts (index)
├── posts.$slug.tsx         # /posts/:slug
├── posts.$slug.edit.tsx    # /posts/:slug/edit
├── users.$id.settings.tsx  # /users/:id/settings
├── files.$.tsx             # /files/* (splat route)
├── _auth.tsx               # Layout without URL segment
├── _auth.login.tsx         # /login (uses _auth layout)
├── _auth.register.tsx      # /register (uses _auth layout)
└── api.webhook.tsx         # /api/webhook (resource route)
```

### Parent-Child Layouts

Parent routes render their children via the `Outlet` component:

```typescript
// app/routes/posts.tsx (Parent layout)
import { Outlet, Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";

import { getCategories } from "~/models/category.server";

export async function loader() {
  const categories = await getCategories();
  return json({ categories });
}

export default function PostsLayout() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <div className="posts-layout">
      <aside className="sidebar">
        <h2>Categories</h2>
        <nav>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/posts?category=${cat.slug}`}>
              {cat.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="content">
        {/* Child routes render here */}
        <Outlet />
      </main>
    </div>
  );
}
```

```typescript
// app/routes/posts._index.tsx (Index route)
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";

import { getPosts } from "~/models/post.server";

export async function loader() {
  const posts = await getPosts();
  return json({ posts });
}

export default function PostsIndex() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>All Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={post.slug}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```typescript
// app/routes/posts.$slug.tsx (Dynamic route)
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getPostBySlug } from "~/models/post.server";
import { PostContent } from "~/components/post-content";

export async function loader({ params }: LoaderFunctionArgs) {
  const post = await getPostBySlug(params.slug!);

  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }

  return json({ post });
}

export default function PostDetail() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{post.title}</h1>
      <time dateTime={post.createdAt}>
        {new Date(post.createdAt).toLocaleDateString()}
      </time>
      <PostContent content={post.content} />
    </article>
  );
}
```

### Rendering Rich Content Safely

When rendering user-generated or CMS content containing HTML, always sanitize it properly using a library like DOMPurify or isomorphic-dompurify. Configure allowed tags and attributes based on your security requirements:

```typescript
// app/components/post-content.tsx
import DOMPurify from "isomorphic-dompurify";

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "h2", "h3", "blockquote", "code", "pre"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });

  return (
    <div
      className="post-content prose"
      // Only use after sanitization - see DOMPurify docs for configuration
      // Reference: https://github.com/cure53/DOMPurify
    />
  );
}
```

### Pathless Layouts

Use underscore prefix for layouts without URL segments:

```typescript
// app/routes/_auth.tsx (Layout for auth pages)
import { Outlet } from "@remix-run/react";

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <img src="/logo.svg" alt="Logo" />
        <Outlet />
      </div>
    </div>
  );
}
```

```typescript
// app/routes/_auth.login.tsx (Renders at /login)
import { Form } from "@remix-run/react";

export default function Login() {
  return (
    <Form method="post">
      <h1>Login</h1>
      <input type="email" name="email" placeholder="Email" />
      <input type="password" name="password" placeholder="Password" />
      <button type="submit">Log In</button>
    </Form>
  );
}
```

### Splat Routes

Catch-all routes using the `$` suffix:

```typescript
// app/routes/files.$.tsx (Matches /files/*)
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ params }: LoaderFunctionArgs) {
  // params["*"] contains the rest of the path
  const filePath = params["*"]; // e.g., "documents/reports/2024/q1.pdf"

  const file = await getFile(filePath);

  if (!file) {
    throw new Response("File not found", { status: 404 });
  }

  return new Response(file.content, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.name}"`,
    },
  });
}
```

## Form Handling

Remix provides enhanced form handling that works with or without JavaScript.

### The Form Component

```typescript
import { Form, useNavigation, useActionData } from "@remix-run/react";

export default function ContactForm() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <fieldset disabled={isSubmitting}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={actionData?.values?.name}
            required
          />
          {actionData?.errors?.name && (
            <span className="error">{actionData.errors.name}</span>
          )}
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={actionData?.values?.email}
            required
          />
          {actionData?.errors?.email && (
            <span className="error">{actionData.errors.email}</span>
          )}
        </div>

        <div>
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows={5}
            defaultValue={actionData?.values?.message}
            required
          />
          {actionData?.errors?.message && (
            <span className="error">{actionData.errors.message}</span>
          )}
        </div>

        <button type="submit">
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </fieldset>
    </Form>
  );
}
```

### useFetcher for Non-Navigation Mutations

Use `useFetcher` when you need to submit forms without navigating:

```typescript
import { useFetcher } from "@remix-run/react";

function NewsletterSignup() {
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;

  return (
    <fetcher.Form method="post" action="/api/newsletter">
      {isSuccess ? (
        <p>Thanks for subscribing!</p>
      ) : (
        <>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </button>
          {fetcher.data?.error && (
            <p className="error">{fetcher.data.error}</p>
          )}
        </>
      )}
    </fetcher.Form>
  );
}
```

### Optimistic UI

Implement optimistic updates for better UX:

```typescript
import { useFetcher } from "@remix-run/react";

function LikeButton({ postId, initialLikes, userHasLiked }) {
  const fetcher = useFetcher();

  // Use optimistic value if submitting, otherwise use actual data
  const optimisticLiked = fetcher.formData
    ? fetcher.formData.get("action") === "like"
    : userHasLiked;

  const optimisticLikes = fetcher.formData
    ? initialLikes + (optimisticLiked ? 1 : -1)
    : initialLikes;

  return (
    <fetcher.Form method="post" action={`/posts/${postId}/like`}>
      <input
        type="hidden"
        name="action"
        value={optimisticLiked ? "unlike" : "like"}
      />
      <button type="submit">
        {optimisticLiked ? "Unlike" : "Like"} ({optimisticLikes})
      </button>
    </fetcher.Form>
  );
}
```

### Multiple Forms on One Page

Handle multiple forms with the `intent` pattern:

```typescript
// Route action
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "update-profile":
      return handleProfileUpdate(formData);
    case "change-password":
      return handlePasswordChange(formData);
    case "delete-account":
      return handleAccountDeletion(formData);
    default:
      return json({ error: "Invalid intent" }, { status: 400 });
  }
}

// Component
export default function Settings() {
  return (
    <div>
      <Form method="post">
        <input type="hidden" name="intent" value="update-profile" />
        <input name="name" placeholder="Name" />
        <button type="submit">Update Profile</button>
      </Form>

      <Form method="post">
        <input type="hidden" name="intent" value="change-password" />
        <input name="currentPassword" type="password" placeholder="Current" />
        <input name="newPassword" type="password" placeholder="New" />
        <button type="submit">Change Password</button>
      </Form>

      <Form method="post">
        <input type="hidden" name="intent" value="delete-account" />
        <button type="submit" className="danger">Delete Account</button>
      </Form>
    </div>
  );
}
```

## Error Boundaries

Remix provides granular error handling through ErrorBoundary components at every route level.

### Route Error Boundaries

```typescript
// app/routes/posts.$slug.tsx
import {
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  // Handle HTTP Response errors (thrown responses)
  if (isRouteErrorResponse(error)) {
    return (
      <div className="error-container">
        <h1>{error.status} {error.statusText}</h1>
        {error.status === 404 ? (
          <p>The post you are looking for does not exist.</p>
        ) : error.status === 401 ? (
          <p>You must be logged in to view this post.</p>
        ) : (
          <p>{error.data}</p>
        )}
      </div>
    );
  }

  // Handle JavaScript errors
  if (error instanceof Error) {
    return (
      <div className="error-container">
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === "development" && (
          <pre>{error.stack}</pre>
        )}
      </div>
    );
  }

  // Fallback for unknown errors
  return (
    <div className="error-container">
      <h1>Unknown Error</h1>
      <p>An unexpected error occurred.</p>
    </div>
  );
}
```

### Throwing Responses

Throw responses to trigger error boundaries with specific status codes:

```typescript
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const post = await getPost(params.slug);

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  if (post.authorId !== user.id && !post.published) {
    throw json(
      { message: "You don't have permission to view this draft" },
      { status: 403 }
    );
  }

  return json({ post });
}
```

### Nested Error Boundaries

Errors bubble up until they find an ErrorBoundary:

```
app/
├── root.tsx              # Has ErrorBoundary (catches all uncaught errors)
├── routes/
│   ├── dashboard.tsx     # Has ErrorBoundary (catches dashboard errors)
│   ├── dashboard._index.tsx
│   └── dashboard.settings.tsx  # Error here bubbles to dashboard.tsx
```

```typescript
// app/routes/dashboard.tsx
import { Link, Outlet } from "@remix-run/react";
import { useRouteError } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-error">
        <h1>Dashboard Error</h1>
        <p>Something went wrong in the dashboard.</p>
        <Link to="/dashboard">Try again</Link>
      </main>
    </div>
  );
}
```

### Root Error Boundary

Always provide a root error boundary as a fallback:

```typescript
// app/root.tsx
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - My App</title>
      </head>
      <body>
        <div className="error-page">
          <h1>Oops! Something went wrong</h1>
          {isRouteErrorResponse(error) ? (
            <p>{error.status}: {error.statusText}</p>
          ) : error instanceof Error ? (
            <p>{error.message}</p>
          ) : (
            <p>Unknown error</p>
          )}
          <a href="/">Go back home</a>
        </div>
      </body>
    </html>
  );
}
```

## Streaming

Remix supports streaming responses for improved perceived performance using `defer` and `Await`.

### Deferred Data Loading

```typescript
// app/routes/dashboard.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { defer } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";

import { getUser, getRecentActivity, getAnalytics } from "~/models";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  // Start these promises but don't await them
  const activityPromise = getRecentActivity(user.id);
  const analyticsPromise = getAnalytics(user.id);

  return defer({
    user,
    // These will stream to the client
    activity: activityPromise,
    analytics: analyticsPromise,
  });
}

export default function Dashboard() {
  const { user, activity, analytics } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>

      <section>
        <h2>Recent Activity</h2>
        <Suspense fallback={<ActivitySkeleton />}>
          <Await resolve={activity}>
            {(resolvedActivity) => (
              <ul>
                {resolvedActivity.map((item) => (
                  <li key={item.id}>{item.description}</li>
                ))}
              </ul>
            )}
          </Await>
        </Suspense>
      </section>

      <section>
        <h2>Analytics</h2>
        <Suspense fallback={<AnalyticsSkeleton />}>
          <Await resolve={analytics} errorElement={<AnalyticsError />}>
            {(resolvedAnalytics) => (
              <AnalyticsChart data={resolvedAnalytics} />
            )}
          </Await>
        </Suspense>
      </section>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="skeleton">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
  );
}

function AnalyticsSkeleton() {
  return <div className="skeleton-chart" />;
}

function AnalyticsError() {
  return <p>Failed to load analytics. Please try again later.</p>;
}
```

### Error Handling with Await

Handle errors in deferred data:

```typescript
<Suspense fallback={<Loading />}>
  <Await
    resolve={dataPromise}
    errorElement={<ErrorComponent />}
  >
    {(data) => <DataDisplay data={data} />}
  </Await>
</Suspense>
```

Or handle errors programmatically:

```typescript
import { useAsyncError } from "@remix-run/react";

function DeferredErrorBoundary() {
  const error = useAsyncError();

  return (
    <div className="error">
      <p>Failed to load: {error.message}</p>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}

// Usage
<Await resolve={promise} errorElement={<DeferredErrorBoundary />}>
  {(data) => <Component data={data} />}
</Await>
```

### When to Use Streaming

Stream data when:
- Data is non-critical for initial render
- Some data takes significantly longer to load
- You want to show progressive loading states

Do NOT stream when:
- Data is critical for SEO (use regular await)
- Data is needed for the initial meaningful paint
- The data fetch is fast

```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  // Always await critical data
  const product = await getProduct(params.id);

  // Defer non-critical data
  const reviewsPromise = getReviews(params.id);
  const relatedPromise = getRelatedProducts(params.id);

  return defer({
    product,
    reviews: reviewsPromise,
    related: relatedPromise,
  });
}
```

## Resource Routes

Resource routes are routes that do not render UI components but return other types of responses.

### API Endpoints

```typescript
// app/routes/api.posts.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { getPosts, createPost } from "~/models/post.server";
import { requireApiKey } from "~/auth.server";

// GET /api/posts
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const { posts, total } = await getPosts({ page, limit });

  return json({
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

// POST /api/posts
export async function action({ request }: ActionFunctionArgs) {
  await requireApiKey(request);

  const body = await request.json();
  const post = await createPost(body);

  return json(post, { status: 201 });
}
```

### File Downloads

```typescript
// app/routes/reports.$id.pdf.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";

import { getReport, generatePDF } from "~/models/report.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const report = await getReport(params.id!);

  if (!report) {
    throw new Response("Report not found", { status: 404 });
  }

  const pdf = await generatePDF(report);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${params.id}.pdf"`,
    },
  });
}
```

### Webhook Handlers

```typescript
// app/routes/webhooks.stripe.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed");
    return json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return json({ received: true });
}
```

### RSS Feeds

```typescript
// app/routes/rss[.]xml.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";

import { getPosts } from "~/models/post.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const posts = await getPosts({ limit: 20 });
  const host = new URL(request.url).origin;

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>My Blog</title>
    <description>Latest posts from my blog</description>
    <link>${host}</link>
    <atom:link href="${host}/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <description>${escapeXml(post.excerpt)}</description>
      <link>${host}/posts/${post.slug}</link>
      <guid isPermaLink="true">${host}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

## Deployment Options

Remix can be deployed to various platforms with different adapters.

### Deployment Adapters

Remix provides official adapters for different deployment targets:

```bash
# Node.js server
npm install @remix-run/node @remix-run/express

# Cloudflare Workers
npm install @remix-run/cloudflare

# Vercel
npm install @remix-run/vercel

# Netlify
npm install @remix-run/netlify

# Deno
npm install @remix-run/deno
```

### Express Server Deployment

```typescript
// server.js
import express from "express";
import { createRequestHandler } from "@remix-run/express";

const app = express();

// Serve static files
app.use(express.static("public", { maxAge: "1y" }));

// Serve build assets
app.use(express.static("build/client", { maxAge: "1y" }));

// Handle Remix requests
app.all(
  "*",
  createRequestHandler({
    build: await import("./build/server/index.js"),
    mode: process.env.NODE_ENV,
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Vercel Deployment

```javascript
// remix.config.js
/** @type {import('@remix-run/dev').AppConfig} */
export default {
  serverBuildTarget: "vercel",
  server: process.env.NODE_ENV === "development" ? undefined : "./server.js",
  ignoredRouteFiles: ["**/.*"],
};
```

### Cloudflare Workers

```typescript
// server.ts
import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server";

const handleRequest = createRequestHandler(build, process.env.NODE_ENV);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handleRequest(request, {
      env,
      ctx,
    });
  },
};
```

### Docker Deployment

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

### Vite Configuration

Remix now uses Vite as its default bundler:

```typescript
// vite.config.ts
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    remix({
      // Customize route configuration
      routes(defineRoutes) {
        return defineRoutes((route) => {
          route("/custom-path", "routes/custom.tsx");
        });
      },
      // Future flags
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  // Server configuration
  server: {
    port: 3000,
  },
  // Build configuration
  build: {
    sourcemap: true,
  },
});
```

## Advanced Patterns

### Session Management

```typescript
// app/session.server.ts
import { createCookieSessionStorage, redirect } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET!;

const storage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await storage.getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId || typeof userId !== "string") {
    return null;
  }

  return userId;
}

export async function requireUserId(request: Request): Promise<string> {
  const userId = await getUserId(request);

  if (!userId) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${url.pathname}`);
  }

  return userId;
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));

  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}
```

### Meta Tags and SEO

```typescript
// app/routes/posts.$slug.tsx
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  if (!data?.post) {
    return [
      { title: "Post Not Found" },
      { name: "description", content: "The requested post was not found." },
    ];
  }

  return [
    { title: `${data.post.title} | My Blog` },
    { name: "description", content: data.post.excerpt },
    { property: "og:title", content: data.post.title },
    { property: "og:description", content: data.post.excerpt },
    { property: "og:image", content: data.post.coverImage },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: data.post.title },
    { name: "twitter:description", content: data.post.excerpt },
    { name: "twitter:image", content: data.post.coverImage },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const post = await getPost(params.slug!);

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ post });
}
```

### Prefetching

Remix provides built-in prefetching for improved navigation:

```typescript
import { Link, NavLink } from "@remix-run/react";

function Navigation() {
  return (
    <nav>
      {/* Prefetch on hover (default) */}
      <Link to="/about" prefetch="intent">
        About
      </Link>

      {/* Prefetch when link is rendered */}
      <Link to="/dashboard" prefetch="render">
        Dashboard
      </Link>

      {/* Prefetch when visible in viewport */}
      <Link to="/products" prefetch="viewport">
        Products
      </Link>

      {/* No prefetching */}
      <Link to="/settings" prefetch="none">
        Settings
      </Link>

      {/* NavLink with active state */}
      <NavLink
        to="/posts"
        prefetch="intent"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        Posts
      </NavLink>
    </nav>
  );
}
```

## Interview Key Points

### Frequently Asked Questions

**1. What makes Remix different from Next.js?**

- Remix focuses on web standards and progressive enhancement
- Uses native HTML forms with server actions
- Nested routing with parallel data loading
- No static site generation (SSG) - focuses on dynamic rendering
- Errors in child routes do not break parent routes
- Works without JavaScript enabled

**2. Explain the Remix data flow**

- Loaders run on the server for GET requests
- Actions run on the server for mutations (POST, PUT, DELETE)
- Data is serialized and sent to the client
- Components access data via hooks (useLoaderData, useActionData)
- Mutations trigger automatic revalidation of affected loaders

**3. How does nested routing work in Remix?**

- File-based routing with dot notation for nesting
- Parent routes render children via Outlet
- Each route can have its own loader, action, and error boundary
- Parallel data fetching for nested routes
- URL segments correspond to route hierarchy

**4. What is progressive enhancement in Remix?**

- Applications work without JavaScript
- Forms submit via standard HTTP when JS is unavailable
- JavaScript enhances the experience when available
- Optimistic UI, loading states, and client-side validation
- Graceful degradation for older browsers

**5. How do you handle errors in Remix?**

- ErrorBoundary component at route level
- isRouteErrorResponse for HTTP errors
- Error instance handling for JavaScript errors
- Errors bubble up to nearest boundary
- Root error boundary as final fallback

**6. When should you use useFetcher?**

- Submitting forms without navigation
- Background data mutations
- Optimistic UI updates
- Loading data without changing URL
- Multiple simultaneous submissions

### Best Practices

1. **Route Organization**: Use route groups and pathless layouts to organize complex applications
2. **Data Loading**: Load data in loaders, not in useEffect
3. **Form Handling**: Use progressive enhancement patterns with Remix Form
4. **Error Handling**: Implement error boundaries at appropriate route levels
5. **Performance**: Use defer for non-critical data, prefetch for navigation
6. **Session Management**: Use secure cookie sessions for authentication
7. **Type Safety**: Leverage TypeScript with loader/action type inference

## Further Reading

### Official Resources

- [Remix Documentation](https://remix.run/docs)
- [Remix Tutorial](https://remix.run/docs/en/main/start/tutorial)
- [Remix GitHub Repository](https://github.com/remix-run/remix)
- [Remix Discord Community](https://rmx.as/discord)

### Recommended Tools

- **Prisma**: Type-safe database ORM
- **Zod**: Runtime type validation
- **Tailwind CSS**: Utility-first CSS framework
- **Conform**: Type-safe form validation
- **Remix Auth**: Authentication strategies

### Migration Path

- **From Create React App**: Migrate routing and data fetching to loaders
- **From Next.js**: Convert getServerSideProps to loaders, API routes to actions
- **From Express**: Use Remix as the view layer, keep Express as adapter

## Summary

Remix represents a paradigm shift in React framework development by embracing web standards and progressive enhancement. After reading this guide, you should be able to:

1. Understand Remix philosophy and its web standards approach
2. Master loaders and actions for server-side data handling
3. Build complex applications with nested routing
4. Implement robust form handling with progressive enhancement
5. Handle errors gracefully with nested error boundaries
6. Optimize performance with streaming and prefetching
7. Deploy Remix applications to various platforms

Remix continues to evolve, with recent versions focusing on Vite integration and React Router convergence. The framework excels at building resilient, accessible web applications that work for all users regardless of their device or network conditions.
