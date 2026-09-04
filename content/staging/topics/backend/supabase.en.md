---
title: "Supabase: Open Source Firebase Alternative"
description: Build full-stack application backends quickly with Supabase
track: backend
section: deployment
difficulty: beginner
tags:
  - Supabase
  - PostgreSQL
  - BaaS
  - Real-time Database
status: imported
origin: old/src/content/docs/backend/supabase.en.md
divergence: 0.214
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Backend
  subcategory: BaaS
  order: 23
  lastUpdated: 2026-01-07
---

## Introduction

Supabase is an open-source Backend-as-a-Service (BaaS) platform that provides developers with all the backend infrastructure needed to build modern applications. Often referred to as the "open-source Firebase alternative," Supabase differentiates itself by building on top of PostgreSQL, the world's most advanced open-source relational database.

### What Supabase Offers

Supabase provides a comprehensive suite of backend services:

- **PostgreSQL Database**: A fully managed, scalable relational database
- **Authentication**: Complete user management with multiple auth providers
- **Storage**: S3-compatible object storage for files and media
- **Real-time Subscriptions**: Live data synchronization across clients
- **Edge Functions**: Serverless functions deployed globally
- **Auto-generated APIs**: Instant RESTful and GraphQL APIs from your schema
- **Row Level Security**: Fine-grained access control at the database level

### Why Choose Supabase?

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Database Type | PostgreSQL (Relational) | Firestore (NoSQL) |
| Open Source | Yes | No |
| Self-Hosting | Supported | Not Available |
| SQL Support | Full SQL | Limited Queries |
| Pricing Model | Predictable | Usage-based (can spike) |
| Vendor Lock-in | Minimal | High |

## Getting Started with Supabase

### Creating a Supabase Project

You can start with Supabase in two ways: using the cloud platform or running locally.

**Cloud Setup:**

1. Visit [supabase.com](https://supabase.com) and create an account
2. Click "New Project" and fill in your project details
3. Wait for the database to be provisioned (usually under 2 minutes)
4. Copy your project URL and API keys from the project settings

**Local Development Setup:**

```bash
# Install Supabase CLI
npm install -g supabase

# Or using Homebrew on macOS
brew install supabase/tap/supabase

# Initialize a new project
supabase init

# Start the local Supabase stack
supabase start
```

When you run `supabase start`, you get a complete local development environment including:

- PostgreSQL database on port 54322
- Supabase Studio (dashboard) on port 54323
- API gateway on port 54321
- Email testing server (Inbucket) on port 54324

### Installing the Client Library

Supabase provides client libraries for multiple languages. The JavaScript client is the most commonly used:

```bash
# Using npm
npm install @supabase/supabase-js

# Using yarn
yarn add @supabase/supabase-js

# Using pnpm
pnpm add @supabase/supabase-js
```

### Initializing the Client

```javascript
import { createClient } from '@supabase/supabase-js'

// Your Supabase project credentials
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'your-anon-public-key'

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For TypeScript projects, you can add type definitions
// npx supabase gen types typescript --project-id your-project-id > database.types.ts

import { Database } from './database.types'
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**Environment Variables Best Practice:**

```javascript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

// In your code
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

## Authentication

Supabase Auth provides a complete authentication system with support for multiple providers, session management, and integration with Row Level Security.

### Email and Password Authentication

```javascript
// Sign up a new user
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      // Optional: Include additional user metadata
      data: {
        first_name: 'John',
        last_name: 'Doe',
        age: 25
      },
      // Optional: Redirect URL after email confirmation
      emailRedirectTo: 'https://yourapp.com/welcome'
    }
  })

  if (error) {
    console.error('Sign up error:', error.message)
    return null
  }

  // User object is returned, but session may be null
  // if email confirmation is required
  console.log('User created:', data.user)
  return data
}

// Sign in an existing user
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })

  if (error) {
    console.error('Sign in error:', error.message)
    return null
  }

  console.log('Signed in user:', data.user)
  console.log('Session:', data.session)
  return data
}

// Sign out the current user
async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error.message)
  }
}

// Get the current user
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return user
}

// Get the current session
async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return session
}
```

### OAuth Social Login

Supabase supports numerous OAuth providers including Google, GitHub, Facebook, Apple, Twitter, Discord, and many more.

```javascript
// Sign in with Google
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://yourapp.com/auth/callback',
      scopes: 'email profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })

  if (error) {
    console.error('OAuth error:', error.message)
  }
}

// Sign in with GitHub
async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: 'https://yourapp.com/auth/callback',
      scopes: 'read:user user:email'
    }
  })
}

// Sign in with Discord
async function signInWithDiscord() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: 'https://yourapp.com/auth/callback'
    }
  })
}
```

**Setting up OAuth Providers:**

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable the provider you want to use
3. Add your OAuth app's Client ID and Client Secret
4. Configure the callback URL in your OAuth provider's settings:
   `https://your-project-id.supabase.co/auth/v1/callback`

### Magic Link Authentication

Magic links provide passwordless authentication via email:

```javascript
// Send a magic link
async function sendMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: 'https://yourapp.com/auth/callback',
      shouldCreateUser: true // Create user if doesn't exist
    }
  })

  if (error) {
    console.error('Magic link error:', error.message)
    return false
  }

  console.log('Magic link sent!')
  return true
}
```

### Phone/SMS Authentication

```javascript
// Sign in with phone number
async function signInWithPhone(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone // Format: +1234567890
  })

  if (error) {
    console.error('Phone auth error:', error.message)
    return false
  }

  return true
}

// Verify the OTP code
async function verifyOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone,
    token: token,
    type: 'sms'
  })

  if (error) {
    console.error('OTP verification error:', error.message)
    return null
  }

  return data
}
```

### Session Management and Auth State

```javascript
// Listen for auth state changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event)

    switch (event) {
      case 'INITIAL_SESSION':
        // Handle initial session load
        break
      case 'SIGNED_IN':
        console.log('User signed in:', session?.user)
        // Redirect to dashboard, update UI, etc.
        break
      case 'SIGNED_OUT':
        console.log('User signed out')
        // Redirect to login page, clear local state, etc.
        break
      case 'TOKEN_REFRESHED':
        console.log('Token refreshed')
        break
      case 'USER_UPDATED':
        console.log('User data updated:', session?.user)
        break
      case 'PASSWORD_RECOVERY':
        console.log('Password recovery initiated')
        break
    }
  }
)

// Don't forget to unsubscribe when component unmounts
// subscription.unsubscribe()

// Update user data
async function updateUser(updates) {
  const { data, error } = await supabase.auth.updateUser({
    email: updates.email, // Optional: triggers email change flow
    password: updates.password, // Optional: update password
    data: {
      // Update user metadata
      first_name: updates.firstName,
      avatar_url: updates.avatarUrl
    }
  })

  return { data, error }
}

// Password reset flow
async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://yourapp.com/auth/reset-password'
  })

  return { data, error }
}
```

## Database (PostgreSQL)

Supabase provides a full PostgreSQL database with auto-generated APIs. You can use SQL directly or the client library to interact with your data.

### Creating Tables

You can create tables using SQL in the Supabase SQL Editor or through migrations:

```sql
-- Create a profiles table linked to auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create a posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  cover_image TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create a comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published) WHERE published = TRUE;
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Create a trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### CRUD Operations

**Create (Insert):**

```javascript
// Insert a single row
const { data, error } = await supabase
  .from('posts')
  .insert({
    author_id: userId,
    title: 'My First Post',
    slug: 'my-first-post',
    content: 'Hello, Supabase!',
    excerpt: 'A quick introduction to Supabase'
  })
  .select() // Return the inserted row
  .single() // Expect a single row

// Insert multiple rows
const { data, error } = await supabase
  .from('posts')
  .insert([
    { author_id: userId, title: 'Post 1', slug: 'post-1', content: '...' },
    { author_id: userId, title: 'Post 2', slug: 'post-2', content: '...' },
    { author_id: userId, title: 'Post 3', slug: 'post-3', content: '...' }
  ])
  .select()

// Upsert (insert or update if exists)
const { data, error } = await supabase
  .from('profiles')
  .upsert({
    id: userId,
    username: 'johndoe',
    full_name: 'John Doe'
  })
  .select()
  .single()
```

**Read (Select):**

```javascript
// Fetch all rows
const { data, error } = await supabase
  .from('posts')
  .select('*')

// Fetch specific columns
const { data, error } = await supabase
  .from('posts')
  .select('id, title, slug, published_at')

// Fetch with related data (joins)
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    slug,
    content,
    published_at,
    author:profiles!author_id (
      id,
      username,
      full_name,
      avatar_url
    ),
    comments (
      id,
      content,
      created_at,
      author:profiles!author_id (
        username,
        avatar_url
      )
    )
  `)
  .eq('published', true)
  .order('published_at', { ascending: false })
  .limit(10)

// Fetch a single row
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('slug', 'my-first-post')
  .single()

// Count rows
const { count, error } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true })
  .eq('published', true)
```

**Update:**

```javascript
// Update rows matching a condition
const { data, error } = await supabase
  .from('posts')
  .update({
    title: 'Updated Title',
    content: 'Updated content...'
  })
  .eq('id', postId)
  .select()
  .single()

// Update multiple conditions
const { data, error } = await supabase
  .from('posts')
  .update({ published: true, published_at: new Date().toISOString() })
  .eq('author_id', userId)
  .eq('published', false)
  .select()

// Increment a value
const { data, error } = await supabase.rpc('increment_view_count', {
  post_id: postId
})
```

**Delete:**

```javascript
// Delete rows matching a condition
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)

// Delete with multiple conditions
const { error } = await supabase
  .from('comments')
  .delete()
  .eq('post_id', postId)
  .eq('author_id', userId)
```

### Filtering and Querying

```javascript
// Equality filters
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true) // Equal
  .neq('author_id', excludedUserId) // Not equal

// Comparison filters
const { data } = await supabase
  .from('posts')
  .select('*')
  .gt('view_count', 100) // Greater than
  .gte('view_count', 100) // Greater than or equal
  .lt('view_count', 1000) // Less than
  .lte('view_count', 1000) // Less than or equal

// Range filters
const { data } = await supabase
  .from('posts')
  .select('*')
  .gte('published_at', '2024-01-01')
  .lte('published_at', '2024-12-31')

// Pattern matching
const { data } = await supabase
  .from('posts')
  .select('*')
  .like('title', '%Supabase%') // SQL LIKE
  .ilike('title', '%supabase%') // Case insensitive LIKE

// Full-text search
const { data } = await supabase
  .from('posts')
  .select('*')
  .textSearch('title', 'supabase database', {
    type: 'websearch', // or 'plain'
    config: 'english'
  })

// Array operations
const { data } = await supabase
  .from('posts')
  .select('*')
  .contains('tags', ['javascript', 'tutorial']) // Array contains all
  .overlaps('tags', ['javascript', 'python']) // Array has any overlap

// NULL checks
const { data } = await supabase
  .from('posts')
  .select('*')
  .is('published_at', null) // IS NULL
  .not('cover_image', 'is', null) // IS NOT NULL

// IN operator
const { data } = await supabase
  .from('posts')
  .select('*')
  .in('id', [postId1, postId2, postId3])

// OR conditions
const { data } = await supabase
  .from('posts')
  .select('*')
  .or('published.eq.true,author_id.eq.' + currentUserId)

// Complex filters with filter()
const { data } = await supabase
  .from('posts')
  .select('*')
  .filter('title', 'ilike', '%tutorial%')
```

### Pagination and Ordering

```javascript
// Basic pagination with limit and offset
const page = 1
const pageSize = 10
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('published_at', { ascending: false })
  .range((page - 1) * pageSize, page * pageSize - 1)

// Pagination with count
const { data, error, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .eq('published', true)
  .order('published_at', { ascending: false })
  .range(0, 9)

// Multiple ordering
const { data } = await supabase
  .from('posts')
  .select('*')
  .order('published', { ascending: false })
  .order('published_at', { ascending: false })
  .order('title', { ascending: true })

// Cursor-based pagination (more efficient for large datasets)
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('published_at', { ascending: false })
  .lt('published_at', lastPostPublishedAt) // Cursor
  .limit(10)
```

### Database Functions (RPC)

```sql
-- Create a PostgreSQL function
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function that returns data
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_posts', (SELECT COUNT(*) FROM posts WHERE author_id = user_uuid),
    'published_posts', (SELECT COUNT(*) FROM posts WHERE author_id = user_uuid AND published = TRUE),
    'total_comments', (SELECT COUNT(*) FROM comments WHERE author_id = user_uuid),
    'total_views', (SELECT COALESCE(SUM(view_count), 0) FROM posts WHERE author_id = user_uuid)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function with search capability
CREATE OR REPLACE FUNCTION search_posts(search_query TEXT)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE published = TRUE
    AND (
      title ILIKE '%' || search_query || '%'
      OR content ILIKE '%' || search_query || '%'
    )
  ORDER BY published_at DESC;
END;
$$ LANGUAGE plpgsql;
```

**Calling Functions from the Client:**

```javascript
// Call a void function
const { error } = await supabase.rpc('increment_view_count', {
  post_id: postId
})

// Call a function that returns data
const { data, error } = await supabase.rpc('get_user_stats', {
  user_uuid: userId
})

// Call a function that returns rows
const { data, error } = await supabase.rpc('search_posts', {
  search_query: 'supabase'
})
```

## Storage

Supabase Storage provides S3-compatible object storage with fine-grained access control through Row Level Security policies.

### Creating Storage Buckets

```javascript
// Create a public bucket
const { data, error } = await supabase.storage.createBucket('public-assets', {
  public: true,
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
})

// Create a private bucket
const { data, error } = await supabase.storage.createBucket('user-documents', {
  public: false,
  fileSizeLimit: 52428800 // 50MB
})

// List all buckets
const { data: buckets, error } = await supabase.storage.listBuckets()

// Get bucket details
const { data: bucket, error } = await supabase.storage.getBucket('avatars')

// Update bucket settings
const { data, error } = await supabase.storage.updateBucket('avatars', {
  public: true,
  fileSizeLimit: 5242880
})

// Delete a bucket (must be empty)
const { error } = await supabase.storage.deleteBucket('old-bucket')

// Empty a bucket
const { error } = await supabase.storage.emptyBucket('temp-files')
```

### Uploading Files

```javascript
// Upload from a file input
const fileInput = document.getElementById('file-input')
const file = fileInput.files[0]

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600', // Cache for 1 hour
    contentType: file.type,
    upsert: true // Overwrite if exists
  })

if (error) {
  console.error('Upload error:', error.message)
} else {
  console.log('File uploaded:', data.path)
}

// Upload with a unique filename
const fileExt = file.name.split('.').pop()
const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
const filePath = `${userId}/${fileName}`

const { data, error } = await supabase.storage
  .from('uploads')
  .upload(filePath, file)

// Upload from base64
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAUA...' // Base64 without prefix
const { data, error } = await supabase.storage
  .from('images')
  .upload('path/to/image.png', base64ToArrayBuffer(base64Data), {
    contentType: 'image/png'
  })
```

### Downloading Files

```javascript
// Download a file
const { data, error } = await supabase.storage
  .from('documents')
  .download('path/to/file.pdf')

if (data) {
  // data is a Blob
  const url = URL.createObjectURL(data)
  // Use the URL to display or download
}

// Get public URL (for public buckets)
const { data } = supabase.storage
  .from('public-assets')
  .getPublicUrl('images/logo.png')

console.log('Public URL:', data.publicUrl)

// Get public URL with transformations
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('user123/avatar.png', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover',
      quality: 80,
      format: 'webp'
    }
  })

// Create signed URL (for private buckets)
const { data, error } = await supabase.storage
  .from('user-documents')
  .createSignedUrl('private/document.pdf', 3600) // Expires in 1 hour

if (data) {
  console.log('Signed URL:', data.signedUrl)
}

// Create multiple signed URLs
const { data, error } = await supabase.storage
  .from('user-documents')
  .createSignedUrls([
    'document1.pdf',
    'document2.pdf',
    'document3.pdf'
  ], 3600)
```

### File Management

```javascript
// List files in a folder
const { data: files, error } = await supabase.storage
  .from('uploads')
  .list(`${userId}/`, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  })

// Move/rename a file
const { data, error } = await supabase.storage
  .from('uploads')
  .move('old-path/file.png', 'new-path/file.png')

// Copy a file
const { data, error } = await supabase.storage
  .from('uploads')
  .copy('source/file.png', 'destination/file.png')

// Delete a single file
const { error } = await supabase.storage
  .from('uploads')
  .remove(['path/to/file.png'])

// Delete multiple files
const { error } = await supabase.storage
  .from('uploads')
  .remove([
    'file1.png',
    'file2.png',
    'folder/file3.png'
  ])
```

### Storage Policies

Set up Row Level Security policies for storage in SQL:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Real-time Subscriptions

Supabase Realtime enables live data synchronization through three main features: Database Changes, Broadcast, and Presence.

### Subscribing to Database Changes

```javascript
// Subscribe to all changes on a table
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // 'INSERT', 'UPDATE', 'DELETE', or '*'
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('Change type:', payload.eventType)
      console.log('New record:', payload.new)
      console.log('Old record:', payload.old)
    }
  )
  .subscribe()

// Subscribe to INSERT events only
const insertChannel = supabase
  .channel('new-posts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('New post created:', payload.new)
      // Update your UI with the new post
    }
  )
  .subscribe()

// Subscribe with row-level filtering
const userChannel = supabase
  .channel('user-posts')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `author_id=eq.${userId}`
    },
    (payload) => {
      console.log('User post changed:', payload)
    }
  )
  .subscribe()

// Subscribe to multiple tables
const multiChannel = supabase
  .channel('multi-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => console.log('Post change:', payload)
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'comments' },
    (payload) => console.log('Comment change:', payload)
  )
  .subscribe()

// Unsubscribe when done
await supabase.removeChannel(channel)
```

**Important:** To receive database changes, you need to enable real-time for your table:

```sql
-- Enable real-time for a table
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- For UPDATE and DELETE events to include old data:
ALTER TABLE posts REPLICA IDENTITY FULL;
```

### Broadcast Messages

Broadcast allows real-time messaging between clients without database persistence:

```javascript
// Create a channel
const chatRoom = supabase.channel('chat-room-1', {
  config: {
    broadcast: {
      self: true // Receive your own broadcasts
    }
  }
})

// Subscribe to messages
chatRoom
  .on('broadcast', { event: 'message' }, (payload) => {
    console.log('Message received:', payload.payload)
    // { username: 'john', text: 'Hello!', timestamp: '...' }
  })
  .on('broadcast', { event: 'typing' }, (payload) => {
    console.log('User typing:', payload.payload.username)
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to chat room')
    }
  })

// Send a message
async function sendMessage(text) {
  await chatRoom.send({
    type: 'broadcast',
    event: 'message',
    payload: {
      username: currentUser.username,
      text: text,
      timestamp: new Date().toISOString()
    }
  })
}

// Send typing indicator
async function sendTypingIndicator() {
  await chatRoom.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      username: currentUser.username
    }
  })
}
```

### Presence Tracking

Track online users and their state in real-time:

```javascript
const presenceChannel = supabase.channel('online-users')

// Subscribe to presence events
presenceChannel
  .on('presence', { event: 'sync' }, () => {
    // Called whenever presence state changes
    const state = presenceChannel.presenceState()

    // Get all online users
    const onlineUsers = Object.values(state).flat()
    console.log('Online users:', onlineUsers)

    // Update your UI with online users
    updateOnlineUsersList(onlineUsers)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // Track this user's presence
      const presenceTrackStatus = await presenceChannel.track({
        user_id: currentUser.id,
        username: currentUser.username,
        avatar_url: currentUser.avatarUrl,
        online_at: new Date().toISOString(),
        status: 'online'
      })

      console.log('Tracking status:', presenceTrackStatus)
    }
  })

// Update presence state (e.g., change status to 'away')
async function updateStatus(newStatus) {
  await presenceChannel.track({
    user_id: currentUser.id,
    username: currentUser.username,
    avatar_url: currentUser.avatarUrl,
    online_at: new Date().toISOString(),
    status: newStatus // 'online', 'away', 'busy', etc.
  })
}

// Stop tracking (go offline)
async function goOffline() {
  await presenceChannel.untrack()
}
```

### Complete Real-time Example

```javascript
// A collaborative document editing channel
function createCollaborationChannel(documentId) {
  const channel = supabase.channel(`document-${documentId}`)

  channel
    // Database changes for document saves
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `id=eq.${documentId}`
      },
      (payload) => {
        console.log('Document saved:', payload.new)
        updateDocumentContent(payload.new.content)
      }
    )
    // Broadcast for cursor positions
    .on('broadcast', { event: 'cursor' }, (payload) => {
      updateCursorPosition(payload.payload)
    })
    // Broadcast for selections
    .on('broadcast', { event: 'selection' }, (payload) => {
      updateUserSelection(payload.payload)
    })
    // Presence for active editors
    .on('presence', { event: 'sync' }, () => {
      const editors = channel.presenceState()
      updateEditorsList(Object.values(editors).flat())
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: currentUser.id,
          username: currentUser.username,
          color: generateUserColor(currentUser.id)
        })
      }
    })

  return {
    sendCursor: (position) => channel.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { userId: currentUser.id, position }
    }),
    sendSelection: (selection) => channel.send({
      type: 'broadcast',
      event: 'selection',
      payload: { userId: currentUser.id, selection }
    }),
    leave: () => supabase.removeChannel(channel)
  }
}
```

## Edge Functions

Supabase Edge Functions are serverless TypeScript functions that run on Deno at the edge, close to your users.

### Creating Edge Functions

```bash
# Create a new function
supabase functions new hello-world

# This creates:
# supabase/functions/hello-world/index.ts
```

### Basic Edge Function

```typescript
// supabase/functions/hello-world/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name } = await req.json()

    const data = {
      message: `Hello, ${name || 'World'}!`,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
```

### Edge Function with Supabase Client

```typescript
// supabase/functions/get-user-data/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with the user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Query with RLS enforced based on the user's JWT
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    const { data: posts, error: postsError } = await supabaseClient
      .from('posts')
      .select('id, title, published_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (postsError) throw postsError

    return new Response(
      JSON.stringify({ user, profile, recentPosts: posts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500
      }
    )
  }
})
```

### Edge Function with Service Role

```typescript
// supabase/functions/admin-operation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Use service role to bypass RLS
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // This operation bypasses RLS
  const { data, error } = await supabaseAdmin
    .from('posts')
    .update({ featured: true })
    .eq('id', postId)

  // ...
})
```

### Deploying Edge Functions

```bash
# Deploy a specific function
supabase functions deploy hello-world

# Deploy all functions
supabase functions deploy

# Deploy with specific project
supabase functions deploy hello-world --project-ref your-project-ref

# Set secrets for functions
supabase secrets set MY_API_KEY=secret123
supabase secrets set STRIPE_SECRET_KEY=sk_live_...

# List secrets
supabase secrets list
```

### Invoking Edge Functions

```javascript
// From your client application
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'John' }
})

// With authentication (uses current session)
const { data, error } = await supabase.functions.invoke('get-user-data')

// With custom headers
const { data, error } = await supabase.functions.invoke('webhook-handler', {
  body: { event: 'payment.completed' },
  headers: {
    'X-Custom-Header': 'custom-value'
  }
})

// Invoke via HTTP directly
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/hello-world',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ name: 'John' })
  }
)
```

## Row Level Security (RLS)

Row Level Security is a PostgreSQL feature that provides fine-grained access control at the row level. Supabase uses RLS to secure your data based on the authenticated user.

### Enabling RLS

```sql
-- Enable RLS on a table (REQUIRED for security)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (recommended)
ALTER TABLE posts FORCE ROW LEVEL SECURITY;
```

**Warning:** Without RLS enabled, your data is accessible to anyone with your anon key!

### Understanding RLS Policies

RLS policies use two clauses:

- **USING**: Determines which existing rows can be accessed (for SELECT, UPDATE, DELETE)
- **WITH CHECK**: Determines which new/modified rows are allowed (for INSERT, UPDATE)

### Common RLS Patterns

**Public Read, Authenticated Write:**

```sql
-- Anyone can read published posts
CREATE POLICY "Public posts are viewable by everyone"
ON posts FOR SELECT
USING (published = true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);
```

**User-Specific Data:**

```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**Role-Based Access:**

```sql
-- Check user role from JWT metadata
CREATE POLICY "Admins have full access"
ON posts FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Moderators can update any post
CREATE POLICY "Moderators can update posts"
ON posts FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator')
);
```

**Team/Organization Access:**

```sql
-- Create a helper function for team membership
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Team members can access team resources
CREATE POLICY "Team members can view team posts"
ON posts FOR SELECT
TO authenticated
USING (is_team_member(team_id));

CREATE POLICY "Team members can create team posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (is_team_member(team_id));
```

**Time-Based Access:**

```sql
-- Posts only visible after scheduled publish date
CREATE POLICY "Scheduled posts visibility"
ON posts FOR SELECT
USING (
  published = true
  AND (published_at IS NULL OR published_at <= NOW())
);
```

### Combining Policies

Multiple policies for the same operation are combined with OR logic:

```sql
-- Policy 1: Public can see published posts
CREATE POLICY "Public published posts"
ON posts FOR SELECT
USING (published = true);

-- Policy 2: Authors can see their own unpublished posts
CREATE POLICY "Authors see own drafts"
ON posts FOR SELECT
TO authenticated
USING (auth.uid() = author_id AND published = false);

-- Result: A post is visible if (published = true) OR (user is author AND not published)
```

### Debugging RLS Policies

```sql
-- Check current user ID
SELECT auth.uid();

-- Check current user role
SELECT auth.role();

-- Check JWT claims
SELECT auth.jwt();

-- Test a policy as a specific user
SET request.jwt.claim.sub = 'user-uuid-here';
SET request.jwt.claims = '{"role": "authenticated", "user_metadata": {"role": "admin"}}';

-- Run your query
SELECT * FROM posts;

-- Reset
RESET request.jwt.claim.sub;
RESET request.jwt.claims;
```

## Self-Hosting Supabase

Supabase is fully open-source and can be self-hosted for complete control over your data and infrastructure.

### Docker Compose Setup

```bash
# Clone the Supabase repository
git clone --depth 1 https://github.com/supabase/supabase

# Create your project directory
mkdir my-supabase-project
cd my-supabase-project

# Copy the Docker configuration
cp -rf ../supabase/docker/* .

# Copy environment variables
cp .env.example .env

# Pull the latest images
docker compose pull

# Start Supabase
docker compose up -d
```

### Environment Configuration

Edit the `.env` file with your configuration:

```bash
# Database
POSTGRES_PASSWORD=your-super-secret-password
POSTGRES_DB=postgres

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters

# API Keys
ANON_KEY=your-generated-anon-key
SERVICE_ROLE_KEY=your-generated-service-role-key

# URLs
SITE_URL=http://localhost:3000
API_EXTERNAL_URL=http://localhost:8000
SUPABASE_PUBLIC_URL=http://localhost:8000

# Studio Authentication
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your-dashboard-password

# Email (optional - for auth emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_SENDER_NAME=Your App Name

# Storage
STORAGE_BACKEND=file
FILE_STORAGE_BACKEND_PATH=/var/lib/storage
```

### Generating API Keys

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate API keys using the JWT secret
# Use a JWT library or online tool to generate:
# - anon key: {"role": "anon", "iss": "supabase"}
# - service_role key: {"role": "service_role", "iss": "supabase"}
```

### Docker Compose Services

The self-hosted stack includes:

```yaml
services:
  # PostgreSQL Database
  db:
    image: supabase/postgres

  # REST API (PostgREST)
  rest:
    image: postgrest/postgrest

  # Realtime Server
  realtime:
    image: supabase/realtime

  # Storage API
  storage:
    image: supabase/storage-api

  # Authentication Server (GoTrue)
  auth:
    image: supabase/gotrue

  # API Gateway (Kong)
  kong:
    image: kong

  # Supabase Studio (Dashboard)
  studio:
    image: supabase/studio

  # Edge Functions (Deno)
  functions:
    image: supabase/edge-runtime
```

### Production Considerations

1. **Database Backups:**
```bash
# Set up automated backups
docker exec supabase-db pg_dump -U postgres > backup.sql

# Or use pg_dump with timestamps
docker exec supabase-db pg_dump -U postgres > "backup_$(date +%Y%m%d_%H%M%S).sql"
```

2. **SSL/TLS Configuration:**
```yaml
# Add to your reverse proxy (nginx, traefik, etc.)
# Example nginx configuration
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Resource Limits:**
```yaml
# Add resource limits in docker-compose.yml
services:
  db:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

4. **Monitoring:**
```yaml
# Add monitoring services
services:
  prometheus:
    image: prom/prometheus

  grafana:
    image: grafana/grafana
```

### Updating Self-Hosted Supabase

```bash
# Pull latest images
docker compose pull

# Restart services
docker compose down
docker compose up -d

# Check logs for any issues
docker compose logs -f
```

## Best Practices

### Security Best Practices

1. **Always Enable RLS**: Enable Row Level Security on all tables containing user data
2. **Use Environment Variables**: Never hardcode API keys in your code
3. **Validate on Server**: Don't rely solely on client-side validation
4. **Use Service Role Sparingly**: Only use the service role key in secure server environments
5. **Implement Rate Limiting**: Protect your APIs from abuse

### Performance Best Practices

```javascript
// 1. Select only needed columns
const { data } = await supabase
  .from('posts')
  .select('id, title, slug') // Not '*'

// 2. Use pagination for large datasets
const { data } = await supabase
  .from('posts')
  .select('*')
  .range(0, 9) // Fetch 10 items

// 3. Create proper indexes
// In SQL:
// CREATE INDEX idx_posts_author ON posts(author_id);

// 4. Use count efficiently
const { count } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true }) // Only count, no data

// 5. Batch operations when possible
const { data } = await supabase
  .from('posts')
  .insert([post1, post2, post3]) // Single request
```

### Error Handling

```javascript
async function fetchWithErrorHandling() {
  try {
    const { data, error, status } = await supabase
      .from('posts')
      .select('*')

    if (error) {
      // Handle specific error codes
      switch (error.code) {
        case 'PGRST116':
          console.log('No rows found')
          return []
        case '42501':
          console.error('Permission denied - check RLS policies')
          throw new Error('Access denied')
        case '23505':
          console.error('Duplicate key violation')
          throw new Error('Record already exists')
        default:
          console.error('Database error:', error.message)
          throw error
      }
    }

    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    throw err
  }
}
```

### TypeScript Integration

```typescript
// Generate types from your database
// npx supabase gen types typescript --project-id your-project > database.types.ts

import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Now you get full type safety
const { data: posts } = await supabase
  .from('posts')
  .select('id, title, author_id')
  .eq('published', true)

// posts is typed as { id: string; title: string; author_id: string }[] | null
```

## Summary

Supabase provides a comprehensive backend solution that combines the reliability and power of PostgreSQL with modern features like real-time subscriptions, authentication, and edge functions. Key takeaways:

- **PostgreSQL Foundation**: Full SQL support with extensions, functions, and triggers
- **Built-in Auth**: Multiple authentication methods with session management
- **Real-time**: Database changes, broadcast messaging, and presence tracking
- **Row Level Security**: Fine-grained access control at the database level
- **Edge Functions**: Serverless TypeScript functions deployed globally
- **Open Source**: Self-host for complete control or use the managed cloud service

Supabase is an excellent choice for developers who want the flexibility of a relational database with the convenience of a managed backend service. Its open-source nature and generous free tier make it accessible for projects of all sizes.

## Further Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase GitHub Repository](https://github.com/supabase/supabase)
- [Supabase Blog](https://supabase.com/blog)
- [Supabase Discord Community](https://discord.supabase.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
