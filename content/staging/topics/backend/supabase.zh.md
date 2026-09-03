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
origin: old/src/content/docs/backend/supabase.zh.md
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

## 简介

Supabase 是一个开源的后端即服务（BaaS）平台，为开发者提供构建现代应用程序所需的全部后端基础设施。它常被称为"开源 Firebase 替代方案"，其独特之处在于构建于 PostgreSQL 之上——这是世界上最先进的开源关系型数据库。

### Supabase 提供的功能

Supabase 提供全面的后端服务套件：

- **PostgreSQL 数据库**：完全托管、可扩展的关系型数据库
- **身份认证**：支持多种认证提供商的完整用户管理系统
- **存储**：S3 兼容的对象存储，用于文件和媒体
- **实时订阅**：跨客户端的实时数据同步
- **边缘函数**：全球部署的无服务器函数
- **自动生成 API**：从数据库架构即时生成 RESTful 和 GraphQL API
- **行级安全性**：数据库级别的细粒度访问控制

### 为什么选择 Supabase？

| 特性 | Supabase | Firebase |
|---------|----------|----------|
| 数据库类型 | PostgreSQL（关系型） | Firestore（NoSQL） |
| 开源 | 是 | 否 |
| 自托管 | 支持 | 不支持 |
| SQL 支持 | 完整 SQL | 有限查询 |
| 定价模式 | 可预测 | 按量付费（可能激增） |
| 供应商锁定 | 最小 | 高 |

## Supabase 入门

### 创建 Supabase 项目

你可以通过两种方式开始使用 Supabase：使用云平台或本地运行。

**云端设置：**

1. 访问 [supabase.com](https://supabase.com) 并创建账户
2. 点击"New Project"并填写项目详情
3. 等待数据库配置完成（通常不到 2 分钟）
4. 从项目设置中复制项目 URL 和 API 密钥

**本地开发设置：**

```bash
# 安装 Supabase CLI
npm install -g supabase

# 或在 macOS 上使用 Homebrew
brew install supabase/tap/supabase

# 初始化新项目
supabase init

# 启动本地 Supabase 环境
supabase start
```

运行 `supabase start` 后，你将获得完整的本地开发环境，包括：

- PostgreSQL 数据库，端口 54322
- Supabase Studio（仪表板），端口 54323
- API 网关，端口 54321
- 邮件测试服务器（Inbucket），端口 54324

### 安装客户端库

Supabase 为多种语言提供客户端库。JavaScript 客户端是最常用的：

```bash
# 使用 npm
npm install @supabase/supabase-js

# 使用 yarn
yarn add @supabase/supabase-js

# 使用 pnpm
pnpm add @supabase/supabase-js
```

### 初始化客户端

```javascript
import { createClient } from '@supabase/supabase-js'

// 你的 Supabase 项目凭证
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'your-anon-public-key'

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 对于 TypeScript 项目，你可以添加类型定义
// npx supabase gen types typescript --project-id your-project-id > database.types.ts

import { Database } from './database.types'
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**环境变量最佳实践：**

```javascript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

// 在你的代码中
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

## 身份认证

Supabase Auth 提供完整的身份认证系统，支持多种提供商、会话管理以及与行级安全性的集成。

### 邮箱和密码认证

```javascript
// 注册新用户
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      // 可选：包含额外的用户元数据
      data: {
        first_name: 'John',
        last_name: 'Doe',
        age: 25
      },
      // 可选：邮箱确认后的重定向 URL
      emailRedirectTo: 'https://yourapp.com/welcome'
    }
  })

  if (error) {
    console.error('注册错误:', error.message)
    return null
  }

  // 返回用户对象，但如果需要邮箱确认，session 可能为 null
  console.log('用户已创建:', data.user)
  return data
}

// 登录现有用户
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })

  if (error) {
    console.error('登录错误:', error.message)
    return null
  }

  console.log('已登录用户:', data.user)
  console.log('会话:', data.session)
  return data
}

// 登出当前用户
async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('登出错误:', error.message)
  }
}

// 获取当前用户
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return user
}

// 获取当前会话
async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return session
}
```

### OAuth 社交登录

Supabase 支持众多 OAuth 提供商，包括 Google、GitHub、Facebook、Apple、Twitter、Discord 等。

```javascript
// 使用 Google 登录
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
    console.error('OAuth 错误:', error.message)
  }
}

// 使用 GitHub 登录
async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: 'https://yourapp.com/auth/callback',
      scopes: 'read:user user:email'
    }
  })
}

// 使用 Discord 登录
async function signInWithDiscord() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: 'https://yourapp.com/auth/callback'
    }
  })
}
```

**设置 OAuth 提供商：**

1. 在 Supabase 仪表板中进入 Authentication > Providers
2. 启用你想使用的提供商
3. 添加你的 OAuth 应用的 Client ID 和 Client Secret
4. 在 OAuth 提供商的设置中配置回调 URL：
   `https://your-project-id.supabase.co/auth/v1/callback`

### Magic Link 认证

Magic Link 通过邮件提供无密码认证：

```javascript
// 发送 magic link
async function sendMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: 'https://yourapp.com/auth/callback',
      shouldCreateUser: true // 如果用户不存在则创建
    }
  })

  if (error) {
    console.error('Magic link 错误:', error.message)
    return false
  }

  console.log('Magic link 已发送！')
  return true
}
```

### 手机/短信认证

```javascript
// 使用手机号登录
async function signInWithPhone(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone // 格式: +1234567890
  })

  if (error) {
    console.error('手机认证错误:', error.message)
    return false
  }

  return true
}

// 验证 OTP 验证码
async function verifyOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone,
    token: token,
    type: 'sms'
  })

  if (error) {
    console.error('OTP 验证错误:', error.message)
    return null
  }

  return data
}
```

### 会话管理和认证状态

```javascript
// 监听认证状态变化
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('认证事件:', event)

    switch (event) {
      case 'INITIAL_SESSION':
        // 处理初始会话加载
        break
      case 'SIGNED_IN':
        console.log('用户已登录:', session?.user)
        // 重定向到仪表板、更新 UI 等
        break
      case 'SIGNED_OUT':
        console.log('用户已登出')
        // 重定向到登录页面、清除本地状态等
        break
      case 'TOKEN_REFRESHED':
        console.log('令牌已刷新')
        break
      case 'USER_UPDATED':
        console.log('用户数据已更新:', session?.user)
        break
      case 'PASSWORD_RECOVERY':
        console.log('密码恢复已启动')
        break
    }
  }
)

// 组件卸载时记得取消订阅
// subscription.unsubscribe()

// 更新用户数据
async function updateUser(updates) {
  const { data, error } = await supabase.auth.updateUser({
    email: updates.email, // 可选：触发邮箱更改流程
    password: updates.password, // 可选：更新密码
    data: {
      // 更新用户元数据
      first_name: updates.firstName,
      avatar_url: updates.avatarUrl
    }
  })

  return { data, error }
}

// 密码重置流程
async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://yourapp.com/auth/reset-password'
  })

  return { data, error }
}
```

## 数据库（PostgreSQL）

Supabase 提供完整的 PostgreSQL 数据库，并自动生成 API。你可以直接使用 SQL 或通过客户端库与数据交互。

### 创建表

你可以在 Supabase SQL 编辑器中使用 SQL 或通过迁移来创建表：

```sql
-- 创建与 auth.users 关联的 profiles 表
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

-- 创建 posts 表
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

-- 创建 comments 表
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建索引以提高查询性能
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published) WHERE published = TRUE;
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- 创建自动更新 updated_at 时间戳的触发器
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

### CRUD 操作

**创建（Insert）：**

```javascript
// 插入单行
const { data, error } = await supabase
  .from('posts')
  .insert({
    author_id: userId,
    title: 'My First Post',
    slug: 'my-first-post',
    content: 'Hello, Supabase!',
    excerpt: 'A quick introduction to Supabase'
  })
  .select() // 返回插入的行
  .single() // 期望单行

// 插入多行
const { data, error } = await supabase
  .from('posts')
  .insert([
    { author_id: userId, title: 'Post 1', slug: 'post-1', content: '...' },
    { author_id: userId, title: 'Post 2', slug: 'post-2', content: '...' },
    { author_id: userId, title: 'Post 3', slug: 'post-3', content: '...' }
  ])
  .select()

// Upsert（如果存在则插入或更新）
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

**读取（Select）：**

```javascript
// 获取所有行
const { data, error } = await supabase
  .from('posts')
  .select('*')

// 获取特定列
const { data, error } = await supabase
  .from('posts')
  .select('id, title, slug, published_at')

// 获取关联数据（连接查询）
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

// 获取单行
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('slug', 'my-first-post')
  .single()

// 计数行
const { count, error } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true })
  .eq('published', true)
```

**更新（Update）：**

```javascript
// 更新匹配条件的行
const { data, error } = await supabase
  .from('posts')
  .update({
    title: 'Updated Title',
    content: 'Updated content...'
  })
  .eq('id', postId)
  .select()
  .single()

// 多条件更新
const { data, error } = await supabase
  .from('posts')
  .update({ published: true, published_at: new Date().toISOString() })
  .eq('author_id', userId)
  .eq('published', false)
  .select()

// 递增值
const { data, error } = await supabase.rpc('increment_view_count', {
  post_id: postId
})
```

**删除（Delete）：**

```javascript
// 删除匹配条件的行
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)

// 多条件删除
const { error } = await supabase
  .from('comments')
  .delete()
  .eq('post_id', postId)
  .eq('author_id', userId)
```

### 过滤和查询

```javascript
// 相等过滤
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true) // 等于
  .neq('author_id', excludedUserId) // 不等于

// 比较过滤
const { data } = await supabase
  .from('posts')
  .select('*')
  .gt('view_count', 100) // 大于
  .gte('view_count', 100) // 大于等于
  .lt('view_count', 1000) // 小于
  .lte('view_count', 1000) // 小于等于

// 范围过滤
const { data } = await supabase
  .from('posts')
  .select('*')
  .gte('published_at', '2024-01-01')
  .lte('published_at', '2024-12-31')

// 模式匹配
const { data } = await supabase
  .from('posts')
  .select('*')
  .like('title', '%Supabase%') // SQL LIKE
  .ilike('title', '%supabase%') // 不区分大小写的 LIKE

// 全文搜索
const { data } = await supabase
  .from('posts')
  .select('*')
  .textSearch('title', 'supabase database', {
    type: 'websearch', // 或 'plain'
    config: 'english'
  })

// 数组操作
const { data } = await supabase
  .from('posts')
  .select('*')
  .contains('tags', ['javascript', 'tutorial']) // 数组包含全部
  .overlaps('tags', ['javascript', 'python']) // 数组有交集

// NULL 检查
const { data } = await supabase
  .from('posts')
  .select('*')
  .is('published_at', null) // IS NULL
  .not('cover_image', 'is', null) // IS NOT NULL

// IN 操作符
const { data } = await supabase
  .from('posts')
  .select('*')
  .in('id', [postId1, postId2, postId3])

// OR 条件
const { data } = await supabase
  .from('posts')
  .select('*')
  .or('published.eq.true,author_id.eq.' + currentUserId)

// 使用 filter() 的复杂过滤
const { data } = await supabase
  .from('posts')
  .select('*')
  .filter('title', 'ilike', '%tutorial%')
```

### 分页和排序

```javascript
// 使用 limit 和 offset 的基本分页
const page = 1
const pageSize = 10
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('published_at', { ascending: false })
  .range((page - 1) * pageSize, page * pageSize - 1)

// 带计数的分页
const { data, error, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .eq('published', true)
  .order('published_at', { ascending: false })
  .range(0, 9)

// 多字段排序
const { data } = await supabase
  .from('posts')
  .select('*')
  .order('published', { ascending: false })
  .order('published_at', { ascending: false })
  .order('title', { ascending: true })

// 基于游标的分页（对大数据集更高效）
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('published_at', { ascending: false })
  .lt('published_at', lastPostPublishedAt) // 游标
  .limit(10)
```

### 数据库函数（RPC）

```sql
-- 创建 PostgreSQL 函数
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 返回数据的函数
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

-- 带搜索功能的函数
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

**从客户端调用函数：**

```javascript
// 调用 void 函数
const { error } = await supabase.rpc('increment_view_count', {
  post_id: postId
})

// 调用返回数据的函数
const { data, error } = await supabase.rpc('get_user_stats', {
  user_uuid: userId
})

// 调用返回行的函数
const { data, error } = await supabase.rpc('search_posts', {
  search_query: 'supabase'
})
```

## 存储

Supabase Storage 提供 S3 兼容的对象存储，通过行级安全策略实现细粒度访问控制。

### 创建存储桶

```javascript
// 创建公共存储桶
const { data, error } = await supabase.storage.createBucket('public-assets', {
  public: true,
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
})

// 创建私有存储桶
const { data, error } = await supabase.storage.createBucket('user-documents', {
  public: false,
  fileSizeLimit: 52428800 // 50MB
})

// 列出所有存储桶
const { data: buckets, error } = await supabase.storage.listBuckets()

// 获取存储桶详情
const { data: bucket, error } = await supabase.storage.getBucket('avatars')

// 更新存储桶设置
const { data, error } = await supabase.storage.updateBucket('avatars', {
  public: true,
  fileSizeLimit: 5242880
})

// 删除存储桶（必须为空）
const { error } = await supabase.storage.deleteBucket('old-bucket')

// 清空存储桶
const { error } = await supabase.storage.emptyBucket('temp-files')
```

### 上传文件

```javascript
// 从文件输入上传
const fileInput = document.getElementById('file-input')
const file = fileInput.files[0]

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600', // 缓存 1 小时
    contentType: file.type,
    upsert: true // 如果存在则覆盖
  })

if (error) {
  console.error('上传错误:', error.message)
} else {
  console.log('文件已上传:', data.path)
}

// 使用唯一文件名上传
const fileExt = file.name.split('.').pop()
const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
const filePath = `${userId}/${fileName}`

const { data, error } = await supabase.storage
  .from('uploads')
  .upload(filePath, file)

// 从 base64 上传
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAUA...' // 不带前缀的 Base64
const { data, error } = await supabase.storage
  .from('images')
  .upload('path/to/image.png', base64ToArrayBuffer(base64Data), {
    contentType: 'image/png'
  })
```

### 下载文件

```javascript
// 下载文件
const { data, error } = await supabase.storage
  .from('documents')
  .download('path/to/file.pdf')

if (data) {
  // data 是 Blob
  const url = URL.createObjectURL(data)
  // 使用 URL 显示或下载
}

// 获取公共 URL（用于公共存储桶）
const { data } = supabase.storage
  .from('public-assets')
  .getPublicUrl('images/logo.png')

console.log('公共 URL:', data.publicUrl)

// 获取带转换的公共 URL
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

// 创建签名 URL（用于私有存储桶）
const { data, error } = await supabase.storage
  .from('user-documents')
  .createSignedUrl('private/document.pdf', 3600) // 1 小时后过期

if (data) {
  console.log('签名 URL:', data.signedUrl)
}

// 创建多个签名 URL
const { data, error } = await supabase.storage
  .from('user-documents')
  .createSignedUrls([
    'document1.pdf',
    'document2.pdf',
    'document3.pdf'
  ], 3600)
```

### 文件管理

```javascript
// 列出文件夹中的文件
const { data: files, error } = await supabase.storage
  .from('uploads')
  .list(`${userId}/`, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  })

// 移动/重命名文件
const { data, error } = await supabase.storage
  .from('uploads')
  .move('old-path/file.png', 'new-path/file.png')

// 复制文件
const { data, error } = await supabase.storage
  .from('uploads')
  .copy('source/file.png', 'destination/file.png')

// 删除单个文件
const { error } = await supabase.storage
  .from('uploads')
  .remove(['path/to/file.png'])

// 删除多个文件
const { error } = await supabase.storage
  .from('uploads')
  .remove([
    'file1.png',
    'file2.png',
    'folder/file3.png'
  ])
```

### 存储策略

在 SQL 中为存储设置行级安全策略：

```sql
-- 允许已认证用户上传到自己的文件夹
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许公开读取头像
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 允许用户更新自己的文件
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

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 实时订阅

Supabase Realtime 通过三个主要功能实现实时数据同步：数据库变更、广播和在线状态。

### 订阅数据库变更

```javascript
// 订阅表的所有变更
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // 'INSERT'、'UPDATE'、'DELETE' 或 '*'
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('变更类型:', payload.eventType)
      console.log('新记录:', payload.new)
      console.log('旧记录:', payload.old)
    }
  )
  .subscribe()

// 仅订阅 INSERT 事件
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
      console.log('新文章已创建:', payload.new)
      // 用新文章更新你的 UI
    }
  )
  .subscribe()

// 带行级过滤的订阅
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
      console.log('用户文章已变更:', payload)
    }
  )
  .subscribe()

// 订阅多个表
const multiChannel = supabase
  .channel('multi-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => console.log('文章变更:', payload)
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'comments' },
    (payload) => console.log('评论变更:', payload)
  )
  .subscribe()

// 完成后取消订阅
await supabase.removeChannel(channel)
```

**重要提示：** 要接收数据库变更，你需要为表启用实时功能：

```sql
-- 为表启用实时功能
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- 要在 UPDATE 和 DELETE 事件中包含旧数据：
ALTER TABLE posts REPLICA IDENTITY FULL;
```

### 广播消息

广播允许客户端之间进行实时消息传递，无需数据库持久化：

```javascript
// 创建频道
const chatRoom = supabase.channel('chat-room-1', {
  config: {
    broadcast: {
      self: true // 接收自己的广播
    }
  }
})

// 订阅消息
chatRoom
  .on('broadcast', { event: 'message' }, (payload) => {
    console.log('收到消息:', payload.payload)
    // { username: 'john', text: 'Hello!', timestamp: '...' }
  })
  .on('broadcast', { event: 'typing' }, (payload) => {
    console.log('用户正在输入:', payload.payload.username)
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('已连接到聊天室')
    }
  })

// 发送消息
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

// 发送正在输入指示器
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

### 在线状态追踪

实时追踪在线用户及其状态：

```javascript
const presenceChannel = supabase.channel('online-users')

// 订阅在线状态事件
presenceChannel
  .on('presence', { event: 'sync' }, () => {
    // 每当在线状态变化时调用
    const state = presenceChannel.presenceState()

    // 获取所有在线用户
    const onlineUsers = Object.values(state).flat()
    console.log('在线用户:', onlineUsers)

    // 用在线用户更新你的 UI
    updateOnlineUsersList(onlineUsers)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('用户加入:', newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('用户离开:', leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // 追踪此用户的在线状态
      const presenceTrackStatus = await presenceChannel.track({
        user_id: currentUser.id,
        username: currentUser.username,
        avatar_url: currentUser.avatarUrl,
        online_at: new Date().toISOString(),
        status: 'online'
      })

      console.log('追踪状态:', presenceTrackStatus)
    }
  })

// 更新在线状态（例如，将状态改为"离开"）
async function updateStatus(newStatus) {
  await presenceChannel.track({
    user_id: currentUser.id,
    username: currentUser.username,
    avatar_url: currentUser.avatarUrl,
    online_at: new Date().toISOString(),
    status: newStatus // 'online'、'away'、'busy' 等
  })
}

// 停止追踪（下线）
async function goOffline() {
  await presenceChannel.untrack()
}
```

### 完整的实时示例

```javascript
// 协作文档编辑频道
function createCollaborationChannel(documentId) {
  const channel = supabase.channel(`document-${documentId}`)

  channel
    // 文档保存的数据库变更
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `id=eq.${documentId}`
      },
      (payload) => {
        console.log('文档已保存:', payload.new)
        updateDocumentContent(payload.new.content)
      }
    )
    // 光标位置广播
    .on('broadcast', { event: 'cursor' }, (payload) => {
      updateCursorPosition(payload.payload)
    })
    // 选择广播
    .on('broadcast', { event: 'selection' }, (payload) => {
      updateUserSelection(payload.payload)
    })
    // 活跃编辑者的在线状态
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

## 边缘函数

Supabase Edge Functions 是在 Deno 上运行的无服务器 TypeScript 函数，部署在全球边缘节点，靠近你的用户。

### 创建边缘函数

```bash
# 创建新函数
supabase functions new hello-world

# 这将创建：
# supabase/functions/hello-world/index.ts
```

### 基本边缘函数

```typescript
// supabase/functions/hello-world/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理 CORS 预检请求
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

### 带 Supabase 客户端的边缘函数

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
    // 使用用户的认证上下文创建 Supabase 客户端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 获取已认证的用户
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // 基于用户的 JWT 执行带 RLS 的查询
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

### 带服务角色的边缘函数

```typescript
// supabase/functions/admin-operation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 使用服务角色绕过 RLS
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 此操作绕过 RLS
  const { data, error } = await supabaseAdmin
    .from('posts')
    .update({ featured: true })
    .eq('id', postId)

  // ...
})
```

### 部署边缘函数

```bash
# 部署特定函数
supabase functions deploy hello-world

# 部署所有函数
supabase functions deploy

# 部署到指定项目
supabase functions deploy hello-world --project-ref your-project-ref

# 为函数设置密钥
supabase secrets set MY_API_KEY=secret123
supabase secrets set STRIPE_SECRET_KEY=sk_live_...

# 列出密钥
supabase secrets list
```

### 调用边缘函数

```javascript
// 从客户端应用调用
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'John' }
})

// 带认证（使用当前会话）
const { data, error } = await supabase.functions.invoke('get-user-data')

// 带自定义头
const { data, error } = await supabase.functions.invoke('webhook-handler', {
  body: { event: 'payment.completed' },
  headers: {
    'X-Custom-Header': 'custom-value'
  }
})

// 直接通过 HTTP 调用
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

## 行级安全性（RLS）

行级安全性是 PostgreSQL 的一项功能，可在行级别提供细粒度访问控制。Supabase 使用 RLS 根据已认证的用户来保护你的数据。

### 启用 RLS

```sql
-- 在表上启用 RLS（安全性必需）
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 对表所有者也强制执行 RLS（推荐）
ALTER TABLE posts FORCE ROW LEVEL SECURITY;
```

**警告：** 如果不启用 RLS，你的数据将对任何持有 anon key 的人可访问！

### 理解 RLS 策略

RLS 策略使用两个子句：

- **USING**：确定可以访问哪些现有行（用于 SELECT、UPDATE、DELETE）
- **WITH CHECK**：确定允许哪些新/修改的行（用于 INSERT、UPDATE）

### 常见 RLS 模式

**公开读取，认证写入：**

```sql
-- 任何人都可以读取已发布的文章
CREATE POLICY "Public posts are viewable by everyone"
ON posts FOR SELECT
USING (published = true);

-- 已认证用户可以创建文章
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- 用户可以更新自己的文章
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 用户可以删除自己的文章
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);
```

**用户特定数据：**

```sql
-- 用户只能查看自己的个人资料
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 用户可以更新自己的个人资料
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 注册时自动创建个人资料
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**基于角色的访问：**

```sql
-- 从 JWT 元数据检查用户角色
CREATE POLICY "Admins have full access"
ON posts FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 版主可以更新任何文章
CREATE POLICY "Moderators can update posts"
ON posts FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator')
);
```

**团队/组织访问：**

```sql
-- 创建团队成员资格的辅助函数
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

-- 团队成员可以访问团队资源
CREATE POLICY "Team members can view team posts"
ON posts FOR SELECT
TO authenticated
USING (is_team_member(team_id));

CREATE POLICY "Team members can create team posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (is_team_member(team_id));
```

**基于时间的访问：**

```sql
-- 文章仅在预定发布日期后可见
CREATE POLICY "Scheduled posts visibility"
ON posts FOR SELECT
USING (
  published = true
  AND (published_at IS NULL OR published_at <= NOW())
);
```

### 组合策略

同一操作的多个策略使用 OR 逻辑组合：

```sql
-- 策略 1：公众可以查看已发布的文章
CREATE POLICY "Public published posts"
ON posts FOR SELECT
USING (published = true);

-- 策略 2：作者可以查看自己未发布的文章
CREATE POLICY "Authors see own drafts"
ON posts FOR SELECT
TO authenticated
USING (auth.uid() = author_id AND published = false);

-- 结果：文章可见条件为 (published = true) OR (用户是作者 AND 未发布)
```

### 调试 RLS 策略

```sql
-- 检查当前用户 ID
SELECT auth.uid();

-- 检查当前用户角色
SELECT auth.role();

-- 检查 JWT 声明
SELECT auth.jwt();

-- 以特定用户身份测试策略
SET request.jwt.claim.sub = 'user-uuid-here';
SET request.jwt.claims = '{"role": "authenticated", "user_metadata": {"role": "admin"}}';

-- 运行你的查询
SELECT * FROM posts;

-- 重置
RESET request.jwt.claim.sub;
RESET request.jwt.claims;
```

## 自托管 Supabase

Supabase 是完全开源的，可以自托管以完全控制你的数据和基础设施。

### Docker Compose 设置

```bash
# 克隆 Supabase 仓库
git clone --depth 1 https://github.com/supabase/supabase

# 创建你的项目目录
mkdir my-supabase-project
cd my-supabase-project

# 复制 Docker 配置
cp -rf ../supabase/docker/* .

# 复制环境变量
cp .env.example .env

# 拉取最新镜像
docker compose pull

# 启动 Supabase
docker compose up -d
```

### 环境配置

编辑 `.env` 文件进行配置：

```bash
# 数据库
POSTGRES_PASSWORD=your-super-secret-password
POSTGRES_DB=postgres

# JWT 密钥（生成强密钥）
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters

# API 密钥
ANON_KEY=your-generated-anon-key
SERVICE_ROLE_KEY=your-generated-service-role-key

# URL
SITE_URL=http://localhost:3000
API_EXTERNAL_URL=http://localhost:8000
SUPABASE_PUBLIC_URL=http://localhost:8000

# Studio 认证
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your-dashboard-password

# 邮件（可选 - 用于认证邮件）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_SENDER_NAME=Your App Name

# 存储
STORAGE_BACKEND=file
FILE_STORAGE_BACKEND_PATH=/var/lib/storage
```

### 生成 API 密钥

```bash
# 生成 JWT 密钥
openssl rand -base64 32

# 使用 JWT 密钥生成 API 密钥
# 使用 JWT 库或在线工具生成：
# - anon key: {"role": "anon", "iss": "supabase"}
# - service_role key: {"role": "service_role", "iss": "supabase"}
```

### Docker Compose 服务

自托管堆栈包括：

```yaml
services:
  # PostgreSQL 数据库
  db:
    image: supabase/postgres

  # REST API (PostgREST)
  rest:
    image: postgrest/postgrest

  # 实时服务器
  realtime:
    image: supabase/realtime

  # 存储 API
  storage:
    image: supabase/storage-api

  # 认证服务器 (GoTrue)
  auth:
    image: supabase/gotrue

  # API 网关 (Kong)
  kong:
    image: kong

  # Supabase Studio（仪表板）
  studio:
    image: supabase/studio

  # 边缘函数 (Deno)
  functions:
    image: supabase/edge-runtime
```

### 生产环境注意事项

1. **数据库备份：**
```bash
# 设置自动备份
docker exec supabase-db pg_dump -U postgres > backup.sql

# 或使用带时间戳的 pg_dump
docker exec supabase-db pg_dump -U postgres > "backup_$(date +%Y%m%d_%H%M%S).sql"
```

2. **SSL/TLS 配置：**
```yaml
# 添加到你的反向代理（nginx、traefik 等）
# nginx 配置示例
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

3. **资源限制：**
```yaml
# 在 docker-compose.yml 中添加资源限制
services:
  db:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

4. **监控：**
```yaml
# 添加监控服务
services:
  prometheus:
    image: prom/prometheus

  grafana:
    image: grafana/grafana
```

### 更新自托管 Supabase

```bash
# 拉取最新镜像
docker compose pull

# 重启服务
docker compose down
docker compose up -d

# 检查日志是否有问题
docker compose logs -f
```

## 最佳实践

### 安全最佳实践

1. **始终启用 RLS**：在所有包含用户数据的表上启用行级安全性
2. **使用环境变量**：永远不要在代码中硬编码 API 密钥
3. **在服务器端验证**：不要仅依赖客户端验证
4. **谨慎使用服务角色**：仅在安全的服务器环境中使用服务角色密钥
5. **实施速率限制**：保护你的 API 免受滥用

### 性能最佳实践

```javascript
// 1. 只选择需要的列
const { data } = await supabase
  .from('posts')
  .select('id, title, slug') // 而不是 '*'

// 2. 对大数据集使用分页
const { data } = await supabase
  .from('posts')
  .select('*')
  .range(0, 9) // 获取 10 条记录

// 3. 创建适当的索引
// 在 SQL 中：
// CREATE INDEX idx_posts_author ON posts(author_id);

// 4. 高效使用计数
const { count } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true }) // 只计数，不返回数据

// 5. 尽可能批量操作
const { data } = await supabase
  .from('posts')
  .insert([post1, post2, post3]) // 单次请求
```

### 错误处理

```javascript
async function fetchWithErrorHandling() {
  try {
    const { data, error, status } = await supabase
      .from('posts')
      .select('*')

    if (error) {
      // 处理特定错误代码
      switch (error.code) {
        case 'PGRST116':
          console.log('未找到记录')
          return []
        case '42501':
          console.error('权限被拒绝 - 检查 RLS 策略')
          throw new Error('访问被拒绝')
        case '23505':
          console.error('重复键违规')
          throw new Error('记录已存在')
        default:
          console.error('数据库错误:', error.message)
          throw error
      }
    }

    return data
  } catch (err) {
    console.error('意外错误:', err)
    throw err
  }
}
```

### TypeScript 集成

```typescript
// 从数据库生成类型
// npx supabase gen types typescript --project-id your-project > database.types.ts

import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 现在你获得完整的类型安全
const { data: posts } = await supabase
  .from('posts')
  .select('id, title, author_id')
  .eq('published', true)

// posts 的类型为 { id: string; title: string; author_id: string }[] | null
```

## 总结

Supabase 提供了一个全面的后端解决方案，将 PostgreSQL 的可靠性和强大功能与实时订阅、身份认证和边缘函数等现代特性相结合。主要要点：

- **PostgreSQL 基础**：完整的 SQL 支持，包括扩展、函数和触发器
- **内置认证**：多种认证方式和会话管理
- **实时功能**：数据库变更、广播消息和在线状态追踪
- **行级安全性**：数据库级别的细粒度访问控制
- **边缘函数**：全球部署的无服务器 TypeScript 函数
- **开源**：可自托管以完全控制，或使用托管云服务

Supabase 是那些既想要关系型数据库的灵活性，又想要托管后端服务便利性的开发者的绝佳选择。其开源性质和慷慨的免费层使其适用于各种规模的项目。

## 更多资源

- [Supabase 文档](https://supabase.com/docs)
- [Supabase GitHub 仓库](https://github.com/supabase/supabase)
- [Supabase 博客](https://supabase.com/blog)
- [Supabase Discord 社区](https://discord.supabase.com)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
