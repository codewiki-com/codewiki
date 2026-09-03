---
title: Firebase 全栈应用开发平台
description: 使用 Google Firebase 构建移动和 Web 应用的后端服务
track: backend
section: deployment
difficulty: beginner
tags:
  - Firebase
  - Google Cloud
  - BaaS
  - NoSQL
status: imported
origin: old/src/content/docs/backend/firebase.zh.md
divergence: 0.087
issues: []
legacy:
  category: Backend
  subcategory: BaaS
  order: 24
  lastUpdated: 2026-01-07
---

## 什么是 Firebase

Firebase 是 Google 提供的后端即服务（Backend-as-a-Service，BaaS）平台，为开发者提供了构建、改进和发展移动及 Web 应用所需的完整工具集和基础设施。它消除了管理服务器、编写后端 API 和维护数据库的复杂性，让开发者能够专注于创建出色的用户体验。

### Firebase 核心优势

Firebase 在现代应用开发中具有以下关键优势：

```
Firebase 核心价值：

1. 快速开发
   - 无需搭建后端服务器
   - 几分钟内即可启动项目
   - 丰富的 SDK 支持多平台

2. 实时能力
   - 数据变更自动同步到所有客户端
   - 支持离线数据访问
   - 低延迟的实时通信

3. 无服务器架构
   - 自动扩展处理流量增长
   - 无需管理基础设施
   - 按使用量付费

4. 完整生态系统
   - 认证、数据库、存储、托管一站式解决
   - 与 Google Cloud 深度集成
   - 丰富的分析和监控工具
```

### Firebase 服务全景

Firebase 提供了涵盖应用开发全生命周期的产品套件：

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Firebase 产品生态系统                           │
├─────────────────────────────────────────────────────────────────────┤
│  构建 (Build)                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │ Cloud        │ │ Realtime     │ │ Cloud        │                 │
│  │ Firestore    │ │ Database     │ │ Storage      │                 │
│  │ (文档数据库)  │ │ (实时数据库)  │ │ (文件存储)    │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │ Firebase     │ │ Cloud        │ │ Firebase     │                 │
│  │ Hosting      │ │ Functions    │ │ Auth         │                 │
│  │ (静态托管)    │ │ (云函数)      │ │ (用户认证)    │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
├─────────────────────────────────────────────────────────────────────┤
│  发布与监控 (Release & Monitor)                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │ Crashlytics  │ │ Performance  │ │ Test Lab     │                 │
│  │ (崩溃报告)    │ │ Monitoring   │ │ (测试实验室)  │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
├─────────────────────────────────────────────────────────────────────┤
│  互动 (Engage)                                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │ Analytics    │ │ Cloud        │ │ Remote       │                 │
│  │ (数据分析)    │ │ Messaging    │ │ Config       │                 │
│  └──────────────┘ │ (推送通知)    │ │ (远程配置)    │                 │
│                   └──────────────┘ └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Firebase 项目设置

### 创建 Firebase 项目

首先在 Firebase Console 创建项目，然后安装 Firebase CLI：

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录 Firebase（会打开浏览器进行认证）
firebase login

# 查看已有项目
firebase projects:list

# 初始化项目
firebase init

# 选择需要的功能:
# - Firestore: Cloud Firestore 数据库
# - Functions: Cloud Functions 云函数
# - Hosting: 静态网站托管
# - Storage: 文件存储
# - Emulators: 本地模拟器（推荐用于开发）
```

### Web 应用配置

在 Web 应用中配置和初始化 Firebase：

```javascript
// firebase.js - Firebase 配置文件
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Firebase 配置（从 Firebase Console 获取）
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 初始化 Firebase 应用
const app = initializeApp(firebaseConfig);

// 初始化各个服务
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);

export default app;
```

### 项目目录结构

典型的 Firebase 项目结构：

```
my-firebase-app/
├── firebase.json           # Firebase 配置文件
├── firestore.rules         # Firestore 安全规则
├── firestore.indexes.json  # Firestore 索引配置
├── storage.rules           # Storage 安全规则
├── .firebaserc             # 项目别名配置
├── functions/              # Cloud Functions 目录
│   ├── package.json
│   ├── index.js
│   └── src/
│       ├── auth.js
│       ├── firestore.js
│       └── scheduled.js
├── public/                 # Hosting 静态文件目录
│   └── index.html
└── src/                    # 前端源代码
    ├── firebase.js         # Firebase 配置
    ├── services/
    │   ├── auth.js
    │   ├── firestore.js
    │   └── storage.js
    └── components/
```

## Firebase Authentication 用户认证

Firebase Authentication 提供了完整的用户身份验证解决方案，支持多种认证方式。

### 认证方式概览

```
Firebase Auth 支持的认证方式：
├── 邮箱/密码认证
│   ├── 注册新用户
│   ├── 登录现有用户
│   ├── 密码重置
│   └── 邮箱验证
├── 手机号认证
│   └── 短信验证码
├── 社交账号登录
│   ├── Google
│   ├── Facebook
│   ├── Twitter
│   ├── GitHub
│   ├── Apple
│   └── Microsoft
├── 匿名认证
│   └── 访客用户临时账号
└── 自定义认证
    └── 使用自己的认证系统
```

### 邮箱密码认证

最基本也是最常用的认证方式：

```javascript
// auth-service.js
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from './firebase';

// ==================== 用户注册 ====================
export async function registerUser(email, password, displayName) {
  try {
    // 创建用户账号
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // 更新用户资料
    await updateProfile(user, {
      displayName: displayName
    });

    // 发送邮箱验证邮件
    await sendEmailVerification(user);

    console.log('注册成功，验证邮件已发送');
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    // 处理常见错误
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('该邮箱已被注册');
      case 'auth/invalid-email':
        throw new Error('邮箱格式不正确');
      case 'auth/weak-password':
        throw new Error('密码强度不够，至少需要6个字符');
      default:
        throw new Error(error.message);
    }
  }
}

// ==================== 用户登录 ====================
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // 检查邮箱是否已验证
    if (!user.emailVerified) {
      console.warn('提示：邮箱尚未验证');
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('用户不存在');
      case 'auth/wrong-password':
        throw new Error('密码错误');
      case 'auth/too-many-requests':
        throw new Error('登录尝试次数过多，请稍后再试');
      case 'auth/user-disabled':
        throw new Error('该账号已被禁用');
      default:
        throw new Error(error.message);
    }
  }
}

// ==================== 退出登录 ====================
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('已退出登录');
  } catch (error) {
    throw new Error('退出登录失败: ' + error.message);
  }
}

// ==================== 密码重置 ====================
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('密码重置邮件已发送');
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('该邮箱未注册');
    }
    throw new Error(error.message);
  }
}

// ==================== 更新密码 ====================
export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error('用户未登录');
  }

  // 重新认证用户（安全操作前需要）
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // 更新密码
  await updatePassword(user, newPassword);
  console.log('密码已更新');
}

// ==================== 监听认证状态 ====================
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        isAuthenticated: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        }
      });
    } else {
      callback({
        isAuthenticated: false,
        user: null
      });
    }
  });
}

// ==================== 获取当前用户 ====================
export function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified
  };
}
```

### 社交账号登录

支持 Google、GitHub、Apple 等第三方登录：

```javascript
// social-auth.js
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  linkWithPopup,
  unlink
} from 'firebase/auth';
import { auth } from './firebase';

// ==================== Google 登录 ====================
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();

  // 添加额外的 OAuth 范围（可选）
  provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

  // 设置自定义参数
  provider.setCustomParameters({
    prompt: 'select_account'  // 强制选择账号
  });

  try {
    const result = await signInWithPopup(auth, provider);

    // 获取 Google Access Token（可用于调用 Google API）
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    const user = result.user;
    console.log('Google 登录成功:', user.displayName);

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      },
      accessToken
    };
  } catch (error) {
    handleSocialAuthError(error);
  }
}

// ==================== GitHub 登录 ====================
export async function loginWithGithub() {
  const provider = new GithubAuthProvider();

  // 请求额外的权限
  provider.addScope('repo');
  provider.addScope('user:email');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    return {
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      },
      accessToken
    };
  } catch (error) {
    handleSocialAuthError(error);
  }
}

// ==================== Apple 登录 ====================
export async function loginWithApple() {
  const provider = new OAuthProvider('apple.com');

  provider.addScope('email');
  provider.addScope('name');

  provider.setCustomParameters({
    locale: 'zh_CN'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = OAuthProvider.credentialFromResult(result);

    return {
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      },
      idToken: credential?.idToken
    };
  } catch (error) {
    handleSocialAuthError(error);
  }
}

// ==================== 重定向登录（移动端推荐） ====================
export async function loginWithGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
}

// 获取重定向结果（页面加载时调用）
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      return { user: result.user, credential };
    }
    return null;
  } catch (error) {
    handleSocialAuthError(error);
  }
}

// ==================== 关联多个登录方式 ====================
export async function linkGoogleAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('用户未登录');

  const provider = new GoogleAuthProvider();

  try {
    const result = await linkWithPopup(user, provider);
    console.log('Google 账号已关联');
    return result;
  } catch (error) {
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('该 Google 账号已被其他用户使用');
    }
    throw error;
  }
}

// 取消关联
export async function unlinkProvider(providerId) {
  const user = auth.currentUser;
  if (!user) throw new Error('用户未登录');

  await unlink(user, providerId);
  console.log('已取消关联:', providerId);
}

// ==================== 错误处理 ====================
function handleSocialAuthError(error) {
  switch (error.code) {
    case 'auth/account-exists-with-different-credential':
      throw new Error('该邮箱已使用其他方式注册，请使用原方式登录');
    case 'auth/popup-blocked':
      throw new Error('弹窗被浏览器阻止，请允许弹窗后重试');
    case 'auth/popup-closed-by-user':
      throw new Error('登录已取消');
    case 'auth/cancelled-popup-request':
      // 多次点击导致，通常可忽略
      break;
    default:
      throw error;
  }
}
```

### React 认证 Hook

在 React 中使用认证状态：

```javascript
// useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthChange, loginUser, logoutUser, registerUser } from './auth-service';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证提供者组件
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 监听认证状态变化
    const unsubscribe = onAuthChange((authState) => {
      setUser(authState.user);
      setLoading(false);
    });

    // 清理订阅
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    login: loginUser,
    logout: logoutUser,
    register: registerUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 使用认证的 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 使用示例
function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      // 登录成功，重定向到首页
    } catch (err) {
      setError(err.message);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        required
      />
      <button type="submit">登录</button>
    </form>
  );
}
```

## Cloud Firestore 数据库

Cloud Firestore 是 Firebase 的主推 NoSQL 文档数据库，支持实时同步和离线功能。

### Firestore 数据模型

```
Firestore 数据结构：

集合 (Collections) - 文档的容器
└── users (集合)
    ├── user_001 (文档)
    │   ├── name: "张三"
    │   ├── email: "zhang@example.com"
    │   ├── age: 28
    │   ├── createdAt: Timestamp
    │   └── orders (子集合)
    │       ├── order_001 (文档)
    │       │   ├── total: 299.00
    │       │   └── items: [...]
    │       └── order_002 (文档)
    └── user_002 (文档)
        ├── name: "李四"
        └── email: "li@example.com"

关键概念：
- 集合只能包含文档
- 文档可以包含子集合
- 文档大小限制为 1MB
- 支持嵌套数据（最多 20 层）
```

### CRUD 基本操作

```javascript
// firestore-service.js
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== 创建文档 ====================

// 方式1：自动生成文档 ID（推荐）
export async function createUser(userData) {
  try {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('用户创建成功，ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 方式2：指定文档 ID
export async function createUserWithId(userId, userData) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return userId;
}

// 方式3：合并写入（不覆盖已有字段）
export async function mergeUserData(userId, partialData) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...partialData,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// ==================== 读取文档 ====================

// 读取单个文档
export async function getUser(userId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  } else {
    throw new Error('用户不存在');
  }
}

// 读取集合中的所有文档
export async function getAllUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ==================== 更新文档 ====================

export async function updateUser(userId, updates) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

// 特殊更新操作
export async function updateUserSpecial(userId) {
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    // 数值增加
    loginCount: increment(1),
    // 数组添加元素（不重复）
    tags: arrayUnion('premium'),
    // 数组移除元素
    roles: arrayRemove('guest'),
    // 删除字段
    tempField: deleteField(),
    updatedAt: serverTimestamp()
  });
}

// ==================== 删除文档 ====================

export async function deleteUser(userId) {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
}
```

### 复杂查询

```javascript
// firestore-queries.js
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== 条件查询 ====================

// 单条件查询
export async function getActiveUsers() {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('status', '==', 'active'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 多条件查询
export async function queryUsers(filters) {
  const usersRef = collection(db, 'users');

  // 构建查询条件
  const conditions = [];

  if (filters.status) {
    conditions.push(where('status', '==', filters.status));
  }
  if (filters.minAge) {
    conditions.push(where('age', '>=', filters.minAge));
  }
  if (filters.role) {
    conditions.push(where('role', '==', filters.role));
  }

  // 排序和限制
  conditions.push(orderBy('createdAt', 'desc'));
  conditions.push(limit(filters.limit || 20));

  const q = query(usersRef, ...conditions);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ==================== 数组查询 ====================

// 数组包含查询
export async function getUsersByTag(tag) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('tags', 'array-contains', tag));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 数组包含任一（最多 10 个值）
export async function getUsersByAnyTag(tags) {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('tags', 'array-contains-any', tags.slice(0, 10))
  );

  return getDocs(q);
}

// IN 查询（最多 10 个值）
export async function getUsersByStatus(statuses) {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('status', 'in', statuses.slice(0, 10))
  );

  return getDocs(q);
}

// ==================== 分页查询 ====================

export class PaginatedQuery {
  constructor(collectionName, pageSize = 10) {
    this.collectionRef = collection(db, collectionName);
    this.pageSize = pageSize;
    this.lastDoc = null;
    this.hasMore = true;
  }

  async getFirstPage(conditions = []) {
    const q = query(
      this.collectionRef,
      ...conditions,
      limit(this.pageSize)
    );

    const snapshot = await getDocs(q);

    if (snapshot.docs.length > 0) {
      this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    this.hasMore = snapshot.docs.length === this.pageSize;

    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      hasMore: this.hasMore
    };
  }

  async getNextPage(conditions = []) {
    if (!this.lastDoc || !this.hasMore) {
      return { data: [], hasMore: false };
    }

    const q = query(
      this.collectionRef,
      ...conditions,
      startAfter(this.lastDoc),
      limit(this.pageSize)
    );

    const snapshot = await getDocs(q);

    if (snapshot.docs.length > 0) {
      this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    this.hasMore = snapshot.docs.length === this.pageSize;

    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      hasMore: this.hasMore
    };
  }

  reset() {
    this.lastDoc = null;
    this.hasMore = true;
  }
}

// 使用分页查询
async function loadPaginatedPosts() {
  const paginator = new PaginatedQuery('posts', 20);

  // 第一页
  const firstPage = await paginator.getFirstPage([
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  ]);

  console.log('第一页:', firstPage.data);

  // 下一页
  if (firstPage.hasMore) {
    const nextPage = await paginator.getNextPage([
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    ]);
    console.log('第二页:', nextPage.data);
  }
}

// ==================== 聚合查询 ====================

export async function getDocumentCount(collectionName, conditions = []) {
  const colRef = collection(db, collectionName);
  const q = query(colRef, ...conditions);

  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}
```

### 实时监听

```javascript
// firestore-realtime.js
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== 监听单个文档 ====================

export function subscribeToUser(userId, callback) {
  const userRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(
    userRef,
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('监听错误:', error);
    }
  );

  // 返回取消订阅函数
  return unsubscribe;
}

// ==================== 监听集合查询 ====================

export function subscribeToActiveUsers(callback) {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const users = [];
      const changes = [];

      // 获取变更详情
      snapshot.docChanges().forEach((change) => {
        const userData = { id: change.doc.id, ...change.doc.data() };

        changes.push({
          type: change.type, // 'added', 'modified', 'removed'
          data: userData,
          oldIndex: change.oldIndex,
          newIndex: change.newIndex
        });
      });

      // 获取当前所有数据
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      callback({ users, changes });
    },
    (error) => {
      console.error('监听错误:', error);
    }
  );

  return unsubscribe;
}

// ==================== React Hook ====================

import { useState, useEffect } from 'react';

export function useFirestoreDoc(collectionName, docId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}

export function useFirestoreQuery(collectionName, conditions = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...conditions);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(results);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(conditions)]);

  return { data, loading, error };
}
```

### 批量操作与事务

```javascript
// firestore-batch.js
import {
  doc,
  collection,
  writeBatch,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== 批量写入 ====================

// 批量创建（最多 500 个操作）
export async function batchCreateUsers(users) {
  const batch = writeBatch(db);

  users.forEach((userData) => {
    const userRef = doc(collection(db, 'users'));
    batch.set(userRef, {
      ...userData,
      createdAt: serverTimestamp()
    });
  });

  await batch.commit();
  console.log(`批量创建 ${users.length} 个用户完成`);
}

// 批量更新
export async function batchUpdateUsers(updates) {
  // updates: [{ id: 'user1', data: { status: 'active' } }, ...]
  const batch = writeBatch(db);

  updates.forEach(({ id, data }) => {
    const userRef = doc(db, 'users', id);
    batch.update(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
}

// 批量删除
export async function batchDeleteUsers(userIds) {
  const batch = writeBatch(db);

  userIds.forEach((id) => {
    const userRef = doc(db, 'users', id);
    batch.delete(userRef);
  });

  await batch.commit();
}

// ==================== 事务操作 ====================

// 转账示例：确保原子性
export async function transferCredits(fromUserId, toUserId, amount) {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. 读取操作（必须在写入之前）
      const fromUserRef = doc(db, 'users', fromUserId);
      const toUserRef = doc(db, 'users', toUserId);

      const fromUserDoc = await transaction.get(fromUserRef);
      const toUserDoc = await transaction.get(toUserRef);

      // 2. 验证数据
      if (!fromUserDoc.exists() || !toUserDoc.exists()) {
        throw new Error('用户不存在');
      }

      const fromCredits = fromUserDoc.data().credits || 0;

      if (fromCredits < amount) {
        throw new Error('余额不足');
      }

      // 3. 写入操作
      transaction.update(fromUserRef, {
        credits: fromCredits - amount,
        updatedAt: serverTimestamp()
      });

      transaction.update(toUserRef, {
        credits: (toUserDoc.data().credits || 0) + amount,
        updatedAt: serverTimestamp()
      });

      // 4. 创建交易记录
      const transactionRef = doc(collection(db, 'transactions'));
      transaction.set(transactionRef, {
        from: fromUserId,
        to: toUserId,
        amount,
        type: 'transfer',
        createdAt: serverTimestamp()
      });
    });

    console.log('转账成功');
  } catch (error) {
    console.error('转账失败:', error.message);
    throw error;
  }
}

// 创建订单事务
export async function createOrder(userId, items) {
  return runTransaction(db, async (transaction) => {
    // 1. 获取用户信息
    const userRef = doc(db, 'users', userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
      throw new Error('用户不存在');
    }

    // 2. 验证商品库存并计算总价
    let totalPrice = 0;
    const productUpdates = [];

    for (const item of items) {
      const productRef = doc(db, 'products', item.productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) {
        throw new Error(`商品 ${item.productId} 不存在`);
      }

      const product = productDoc.data();

      if (product.stock < item.quantity) {
        throw new Error(`商品 ${product.name} 库存不足`);
      }

      totalPrice += product.price * item.quantity;
      productUpdates.push({
        ref: productRef,
        newStock: product.stock - item.quantity
      });
    }

    // 3. 验证用户余额
    const userBalance = userDoc.data().balance || 0;
    if (userBalance < totalPrice) {
      throw new Error('余额不足');
    }

    // 4. 执行所有更新
    // 更新库存
    productUpdates.forEach(({ ref, newStock }) => {
      transaction.update(ref, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });
    });

    // 扣除用户余额
    transaction.update(userRef, {
      balance: userBalance - totalPrice,
      updatedAt: serverTimestamp()
    });

    // 创建订单
    const orderRef = doc(collection(db, 'orders'));
    transaction.set(orderRef, {
      userId,
      items,
      totalPrice,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    return orderRef.id;
  });
}
```

## Realtime Database 实时数据库

Realtime Database 是 Firebase 的原始数据库，适合需要低延迟实时同步的场景。

### Realtime Database 基础

```javascript
// realtime-db.js
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  query as rtdbQuery,
  orderByChild,
  orderByKey,
  limitToFirst,
  limitToLast,
  equalTo,
  startAt,
  endAt,
  serverTimestamp as rtdbServerTimestamp,
  onDisconnect
} from 'firebase/database';
import { getDatabase } from 'firebase/database';

const database = getDatabase();

// ==================== 基本操作 ====================

// 写入数据
export async function writeUserData(userId, userData) {
  const userRef = ref(database, `users/${userId}`);
  await set(userRef, {
    ...userData,
    createdAt: rtdbServerTimestamp()
  });
}

// 读取数据
export async function getUserData(userId) {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
}

// 推送数据（自动生成 Key）
export async function addMessage(chatId, message) {
  const messagesRef = ref(database, `chats/${chatId}/messages`);
  const newMessageRef = push(messagesRef);

  await set(newMessageRef, {
    ...message,
    timestamp: rtdbServerTimestamp()
  });

  return newMessageRef.key;
}

// 更新数据
export async function updateUserProfile(userId, updates) {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, {
    ...updates,
    updatedAt: rtdbServerTimestamp()
  });
}

// 多路径更新
export async function multiPathUpdate(updates) {
  // updates: { 'users/user1/name': 'New Name', 'users/user1/age': 30 }
  const rootRef = ref(database);
  await update(rootRef, updates);
}

// 删除数据
export async function deleteUser(userId) {
  const userRef = ref(database, `users/${userId}`);
  await remove(userRef);
}

// ==================== 实时监听 ====================

// 监听数据变化
export function subscribeToUser(userId, callback) {
  const userRef = ref(database, `users/${userId}`);

  const unsubscribe = onValue(userRef, (snapshot) => {
    callback(snapshot.val());
  });

  return unsubscribe;
}

// 监听聊天消息
export function subscribeToChatMessages(chatId, callbacks) {
  const messagesRef = ref(database, `chats/${chatId}/messages`);

  const unsubscribers = [];

  // 新消息
  unsubscribers.push(
    onChildAdded(messagesRef, (snapshot) => {
      callbacks.onAdded?.({
        key: snapshot.key,
        ...snapshot.val()
      });
    })
  );

  // 消息修改
  unsubscribers.push(
    onChildChanged(messagesRef, (snapshot) => {
      callbacks.onChanged?.({
        key: snapshot.key,
        ...snapshot.val()
      });
    })
  );

  // 消息删除
  unsubscribers.push(
    onChildRemoved(messagesRef, (snapshot) => {
      callbacks.onRemoved?.(snapshot.key);
    })
  );

  return () => unsubscribers.forEach(unsub => unsub());
}

// ==================== 在线状态管理 ====================

export function setupPresence(userId) {
  const userStatusRef = ref(database, `status/${userId}`);
  const connectedRef = ref(database, '.info/connected');

  const isOffline = {
    state: 'offline',
    lastChanged: rtdbServerTimestamp()
  };

  const isOnline = {
    state: 'online',
    lastChanged: rtdbServerTimestamp()
  };

  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === false) {
      return;
    }

    // 设置断开连接时的操作
    onDisconnect(userStatusRef)
      .set(isOffline)
      .then(() => {
        // 设置当前状态为在线
        set(userStatusRef, isOnline);
      });
  });
}
```

### Firestore vs Realtime Database

```
特性对比：

┌─────────────────┬─────────────────────┬─────────────────────┐
│     特性        │   Cloud Firestore   │  Realtime Database  │
├─────────────────┼─────────────────────┼─────────────────────┤
│ 数据模型        │ 文档-集合            │ JSON 树             │
│ 查询能力        │ 强大，支持复合查询    │ 基础，有限的排序    │
│ 离线支持        │ 完整支持             │ 仅限移动端          │
│ 扩展性          │ 自动分片             │ 单一数据库          │
│ 定价模式        │ 按读写次数           │ 按下载带宽          │
│ 实时延迟        │ 较低                 │ 极低                │
│ 适用场景        │ 复杂查询、结构化数据  │ 实时聊天、游戏状态  │
└─────────────────┴─────────────────────┴─────────────────────┘

选择建议：
- 新项目优先选择 Firestore
- 需要极低延迟的实时功能选择 Realtime Database
- 两者可以在同一项目中并用
```

## Cloud Functions 云函数

Cloud Functions 让你可以运行服务端代码响应各种事件，无需管理服务器。

### HTTP 函数

```javascript
// functions/index.js
const { onRequest } = require('firebase-functions/v2/https');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// ==================== HTTP 请求函数 ====================

// 基本 HTTP 函数
exports.helloWorld = onRequest((request, response) => {
  response.json({ message: 'Hello from Firebase!' });
});

// RESTful API
exports.api = onRequest(async (request, response) => {
  // CORS 处理
  response.set('Access-Control-Allow-Origin', '*');

  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.status(204).send('');
    return;
  }

  const path = request.path;
  const method = request.method;

  try {
    // GET /users - 获取用户列表
    if (path === '/users' && method === 'GET') {
      const snapshot = await db.collection('users').limit(50).get();
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      response.json(users);
      return;
    }

    // POST /users - 创建用户
    if (path === '/users' && method === 'POST') {
      const userData = request.body;
      const docRef = await db.collection('users').add({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      response.status(201).json({ id: docRef.id });
      return;
    }

    response.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    response.status(500).json({ error: error.message });
  }
});

// ==================== 可调用函数（推荐） ====================

// 客户端可直接调用的函数
exports.createPost = onCall(async (request) => {
  // 验证用户已登录
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      '需要登录才能发布文章'
    );
  }

  const { title, content, tags } = request.data;

  // 数据验证
  if (!title || title.length < 5) {
    throw new HttpsError(
      'invalid-argument',
      '标题至少需要5个字符'
    );
  }

  if (!content || content.length < 100) {
    throw new HttpsError(
      'invalid-argument',
      '内容至少需要100个字符'
    );
  }

  try {
    const postRef = await db.collection('posts').add({
      title,
      content,
      tags: tags || [],
      authorId: request.auth.uid,
      authorName: request.auth.token.name || 'Anonymous',
      status: 'published',
      viewCount: 0,
      likeCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 更新用户文章计数
    await db.collection('users').doc(request.auth.uid).update({
      postCount: admin.firestore.FieldValue.increment(1)
    });

    return {
      success: true,
      postId: postRef.id
    };
  } catch (error) {
    console.error('创建文章失败:', error);
    throw new HttpsError('internal', '创建文章失败');
  }
});

// 客户端调用可调用函数
// import { httpsCallable } from 'firebase/functions';
// const createPost = httpsCallable(functions, 'createPost');
// const result = await createPost({ title: '...', content: '...' });
```

### Firestore 触发器

```javascript
// functions/triggers.js
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } =
  require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

const db = admin.firestore();

// ==================== 文档创建触发器 ====================

exports.onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const userData = event.data.data();

  console.log(`新用户创建: ${userId}`);

  try {
    // 1. 发送欢迎邮件
    await db.collection('mail').add({
      to: userData.email,
      template: {
        name: 'welcome',
        data: { userName: userData.name }
      }
    });

    // 2. 创建用户统计文档
    await db.collection('userStats').doc(userId).set({
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. 更新全站统计
    await db.collection('siteStats').doc('users').update({
      totalCount: admin.firestore.FieldValue.increment(1)
    });

    console.log('用户初始化完成:', userId);
  } catch (error) {
    console.error('用户初始化失败:', error);
  }
});

// ==================== 文档更新触发器 ====================

exports.onUserUpdated = onDocumentUpdated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  // 检测邮箱变更
  if (beforeData.email !== afterData.email) {
    console.log(`用户 ${userId} 邮箱已变更`);

    await db.collection('auditLog').add({
      userId,
      action: 'email_changed',
      oldValue: beforeData.email,
      newValue: afterData.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 检测头像变更 - 删除旧头像
  if (beforeData.photoURL !== afterData.photoURL && beforeData.photoURL) {
    try {
      const bucket = admin.storage().bucket();
      const oldFilePath = extractPathFromURL(beforeData.photoURL);
      await bucket.file(oldFilePath).delete();
      console.log('旧头像已删除');
    } catch (error) {
      console.error('删除旧头像失败:', error);
    }
  }
});

// ==================== 文档删除触发器 ====================

exports.onUserDeleted = onDocumentDeleted('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const userData = event.data.data();

  console.log(`用户已删除: ${userId}`);

  const batch = db.batch();

  // 删除用户的所有文章
  const postsSnapshot = await db
    .collection('posts')
    .where('authorId', '==', userId)
    .get();

  postsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 删除用户统计
  batch.delete(db.collection('userStats').doc(userId));

  await batch.commit();

  // 删除用户上传的文件
  const bucket = admin.storage().bucket();
  await bucket.deleteFiles({
    prefix: `users/${userId}/`
  });

  // 更新全站统计
  await db.collection('siteStats').doc('users').update({
    totalCount: admin.firestore.FieldValue.increment(-1)
  });
});

// ==================== 评论触发器 ====================

exports.onCommentCreated = onDocumentCreated(
  'posts/{postId}/comments/{commentId}',
  async (event) => {
    const { postId, commentId } = event.params;
    const commentData = event.data.data();

    // 更新文章评论计数
    await db.collection('posts').doc(postId).update({
      commentCount: admin.firestore.FieldValue.increment(1)
    });

    // 获取文章作者并发送通知
    const postDoc = await db.collection('posts').doc(postId).get();
    const authorId = postDoc.data().authorId;

    if (authorId !== commentData.userId) {
      await db.collection('notifications').add({
        userId: authorId,
        type: 'new_comment',
        postId,
        commentId,
        fromUser: commentData.userName,
        message: `${commentData.userName} 评论了你的文章`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
);
```

### Storage 触发器

```javascript
// functions/storage.js
const { onObjectFinalized, onObjectDeleted } =
  require('firebase-functions/v2/storage');
const admin = require('firebase-admin');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs');

// 图片上传处理
exports.onImageUploaded = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;
  const bucket = admin.storage().bucket(event.data.bucket);

  // 只处理图片
  if (!contentType.startsWith('image/')) {
    console.log('不是图片，跳过处理');
    return;
  }

  // 跳过已处理的缩略图
  if (filePath.includes('_thumb')) {
    return;
  }

  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);

  try {
    // 下载原图
    await bucket.file(filePath).download({ destination: tempFilePath });

    // 生成缩略图
    const thumbFileName = `${path.parse(fileName).name}_thumb.webp`;
    const thumbFilePath = path.join(os.tmpdir(), thumbFileName);

    await sharp(tempFilePath)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(thumbFilePath);

    // 上传缩略图
    const thumbDestination = path.join(path.dirname(filePath), thumbFileName);
    await bucket.upload(thumbFilePath, {
      destination: thumbDestination,
      metadata: {
        contentType: 'image/webp',
        metadata: {
          originalFile: filePath
        }
      }
    });

    // 更新原文件元数据
    await bucket.file(filePath).setMetadata({
      metadata: {
        processed: 'true',
        thumbnail: thumbDestination
      }
    });

    // 清理临时文件
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(thumbFilePath);

    console.log('图片处理完成:', filePath);
  } catch (error) {
    console.error('图片处理失败:', error);
  }
});
```

### 定时任务

```javascript
// functions/scheduled.js
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

const db = admin.firestore();

// 每日清理任务 - 凌晨3点执行
exports.dailyCleanup = onSchedule('0 3 * * *', async (event) => {
  console.log('开始每日清理任务');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 删除30天前的临时文件记录
  const tempFilesSnapshot = await db
    .collection('tempFiles')
    .where('createdAt', '<', thirtyDaysAgo)
    .limit(500)
    .get();

  const batch = db.batch();
  tempFilesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`已删除 ${tempFilesSnapshot.size} 条过期记录`);
});

// 每小时统计任务
exports.hourlyStats = onSchedule('every 1 hours', async (event) => {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // 计算活跃用户数
  const activeUsersSnapshot = await db
    .collection('users')
    .where('lastActiveAt', '>', oneHourAgo)
    .count()
    .get();

  await db.collection('siteStats').doc('realtime').update({
    activeUsers: activeUsersSnapshot.data().count,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

// 每周报告 - 每周一早上9点
exports.weeklyReport = onSchedule({
  schedule: '0 9 * * 1',
  timeZone: 'Asia/Shanghai'
}, async (event) => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const newUsersCount = await db
    .collection('users')
    .where('createdAt', '>', lastWeek)
    .count()
    .get();

  const newPostsCount = await db
    .collection('posts')
    .where('createdAt', '>', lastWeek)
    .count()
    .get();

  await db.collection('reports').add({
    period: 'weekly',
    startDate: lastWeek,
    endDate: new Date(),
    newUsers: newUsersCount.data().count,
    newPosts: newPostsCount.data().count,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

## Cloud Storage 文件存储

Firebase Storage 提供安全、可扩展的文件存储服务。

### 文件上传与下载

```javascript
// storage-service.js
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from './firebase';

// ==================== 简单上传 ====================

export async function uploadFile(file, path) {
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      path: snapshot.ref.fullPath,
      url: downloadURL,
      size: snapshot.metadata.size
    };
  } catch (error) {
    console.error('上传失败:', error);
    throw error;
  }
}

// ==================== 带进度的上传 ====================

export function uploadFileWithProgress(file, path, callbacks) {
  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type
  });

  uploadTask.on('state_changed',
    // 进度回调
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      callbacks.onProgress?.(progress, snapshot.state);
    },
    // 错误回调
    (error) => {
      callbacks.onError?.(error);
    },
    // 完成回调
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      callbacks.onComplete?.({
        url: downloadURL,
        path: uploadTask.snapshot.ref.fullPath
      });
    }
  );

  // 返回控制对象
  return {
    pause: () => uploadTask.pause(),
    resume: () => uploadTask.resume(),
    cancel: () => uploadTask.cancel()
  };
}

// ==================== Base64 上传 ====================

export async function uploadBase64Image(base64Data, path) {
  const storageRef = ref(storage, path);

  // base64Data 格式: "data:image/png;base64,iVBORw0KGgo..."
  const snapshot = await uploadString(storageRef, base64Data, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

// ==================== 下载与删除 ====================

export async function getFileUrl(path) {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
}

export async function deleteFile(path) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

// ==================== 列出文件 ====================

export async function listFiles(path) {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);

  const files = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      const metadata = await getMetadata(itemRef);

      return {
        name: itemRef.name,
        path: itemRef.fullPath,
        url,
        size: metadata.size,
        contentType: metadata.contentType,
        createdAt: metadata.timeCreated
      };
    })
  );

  const folders = result.prefixes.map(folderRef => ({
    name: folderRef.name,
    path: folderRef.fullPath
  }));

  return { files, folders };
}

// ==================== React Hook ====================

import { useState, useRef, useCallback } from 'react';

export function useFileUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadURL, setDownloadURL] = useState(null);
  const uploadTaskRef = useRef(null);

  const upload = useCallback((file, path) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    const control = uploadFileWithProgress(file, path, {
      onProgress: (prog) => setProgress(prog),
      onError: (err) => {
        setError(err);
        setUploading(false);
      },
      onComplete: (result) => {
        setDownloadURL(result.url);
        setUploading(false);
      }
    });

    uploadTaskRef.current = control;
  }, []);

  const cancel = useCallback(() => {
    uploadTaskRef.current?.cancel();
    setUploading(false);
  }, []);

  const pause = useCallback(() => {
    uploadTaskRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    uploadTaskRef.current?.resume();
  }, []);

  return {
    upload,
    cancel,
    pause,
    resume,
    progress,
    uploading,
    error,
    downloadURL
  };
}
```

## Firebase Hosting 静态托管

Firebase Hosting 提供快速、安全的静态网站托管服务。

### Hosting 配置

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "redirects": [
      {
        "source": "/old-page",
        "destination": "/new-page",
        "type": 301
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ]
  }
}
```

### 部署命令

```bash
# 构建项目
npm run build

# 预览部署（创建临时 URL）
firebase hosting:channel:deploy preview

# 正式部署
firebase deploy --only hosting

# 查看部署历史
firebase hosting:releases:list

# 回滚到之前的版本
firebase hosting:rollback
```

## Firebase Analytics 数据分析

Firebase Analytics 提供免费、无限制的应用分析功能。

### 基础配置与事件追踪

```javascript
// analytics-service.js
import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { analytics } from './firebase';

// ==================== 用户属性设置 ====================

export function setAnalyticsUser(userId, properties = {}) {
  // 设置用户 ID
  setUserId(analytics, userId);

  // 设置用户属性
  setUserProperties(analytics, {
    user_type: properties.userType || 'free',
    account_created: properties.accountCreated,
    ...properties
  });
}

// ==================== 标准事件 ====================

// 登录事件
export function logLogin(method) {
  logEvent(analytics, 'login', {
    method: method // 'email', 'google', 'github', etc.
  });
}

// 注册事件
export function logSignUp(method) {
  logEvent(analytics, 'sign_up', {
    method: method
  });
}

// 搜索事件
export function logSearch(searchTerm) {
  logEvent(analytics, 'search', {
    search_term: searchTerm
  });
}

// 分享事件
export function logShare(contentType, itemId, method) {
  logEvent(analytics, 'share', {
    content_type: contentType,
    item_id: itemId,
    method: method
  });
}

// 购买事件
export function logPurchase(transactionId, value, currency, items) {
  logEvent(analytics, 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });
}

// ==================== 自定义事件 ====================

// 文章阅读事件
export function logArticleRead(articleId, articleTitle, readTime) {
  logEvent(analytics, 'article_read', {
    article_id: articleId,
    article_title: articleTitle,
    read_time_seconds: readTime
  });
}

// 功能使用事件
export function logFeatureUsed(featureName, details = {}) {
  logEvent(analytics, 'feature_used', {
    feature_name: featureName,
    ...details
  });
}

// 错误事件
export function logError(errorType, errorMessage, errorLocation) {
  logEvent(analytics, 'app_error', {
    error_type: errorType,
    error_message: errorMessage,
    error_location: errorLocation
  });
}

// ==================== 页面浏览追踪 ====================

export function logPageView(pageName, pageLocation) {
  logEvent(analytics, 'page_view', {
    page_title: pageName,
    page_location: pageLocation
  });
}

// React Router 集成
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    logPageView(document.title, location.pathname + location.search);
  }, [location]);
}
```

## Performance Monitoring 性能监控

Firebase Performance Monitoring 帮助你了解应用的性能表现。

### 性能监控配置

```javascript
// performance-service.js
import { getPerformance, trace } from 'firebase/performance';
import { getPerformance } from 'firebase/performance';

const perf = getPerformance();

// ==================== 自定义追踪 ====================

// 创建自定义追踪
export function startTrace(traceName) {
  const customTrace = trace(perf, traceName);
  customTrace.start();

  return {
    // 添加自定义属性
    setAttribute: (name, value) => {
      customTrace.putAttribute(name, value);
    },
    // 添加自定义指标
    incrementMetric: (name, value = 1) => {
      customTrace.incrementMetric(name, value);
    },
    // 停止追踪
    stop: () => {
      customTrace.stop();
    }
  };
}

// 使用示例：追踪数据加载
async function loadDataWithTracking() {
  const tracer = startTrace('load_user_data');
  tracer.setAttribute('data_source', 'firestore');

  try {
    const data = await fetchUserData();
    tracer.incrementMetric('items_loaded', data.length);
    tracer.setAttribute('status', 'success');
    return data;
  } catch (error) {
    tracer.setAttribute('status', 'error');
    tracer.setAttribute('error_type', error.code);
    throw error;
  } finally {
    tracer.stop();
  }
}

// ==================== 网络请求监控 ====================

// 自动监控 fetch 请求
// Performance Monitoring 会自动追踪网络请求

// 手动追踪 API 调用
export async function trackedFetch(url, options = {}) {
  const tracer = startTrace('api_call');
  tracer.setAttribute('url', url);
  tracer.setAttribute('method', options.method || 'GET');

  const startTime = Date.now();

  try {
    const response = await fetch(url, options);
    const endTime = Date.now();

    tracer.setAttribute('status_code', response.status.toString());
    tracer.incrementMetric('response_time_ms', endTime - startTime);

    return response;
  } catch (error) {
    tracer.setAttribute('error', error.message);
    throw error;
  } finally {
    tracer.stop();
  }
}
```

## Security Rules 安全规则

安全规则是保护 Firebase 数据安全的核心机制。

### Firestore 安全规则

```javascript
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ==================== 辅助函数 ====================

    // 检查用户是否已登录
    function isAuthenticated() {
      return request.auth != null;
    }

    // 检查是否是文档所有者
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // 检查用户角色
    function hasRole(role) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // 检查是否是管理员
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }

    // 验证必填字段
    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    // 检查字段是否未被修改
    function isUnmodified(field) {
      return !(field in request.resource.data) ||
             request.resource.data[field] == resource.data[field];
    }

    // 验证字符串长度
    function isValidString(field, minLen, maxLen) {
      return request.resource.data[field] is string &&
             request.resource.data[field].size() >= minLen &&
             request.resource.data[field].size() <= maxLen;
    }

    // ==================== 用户集合 ====================

    match /users/{userId} {
      // 读取：已登录用户可以读取
      allow read: if isAuthenticated();

      // 创建：只能创建自己的文档
      allow create: if isOwner(userId) &&
                       hasRequiredFields(['email', 'displayName']) &&
                       isValidString('displayName', 2, 50);

      // 更新：只能更新自己的文档，且不能修改某些字段
      allow update: if isOwner(userId) &&
                       isUnmodified('email') &&
                       isUnmodified('createdAt') &&
                       isUnmodified('role');

      // 删除：只有管理员可以删除
      allow delete: if isAdmin();

      // 用户私有数据
      match /private/{document=**} {
        allow read, write: if isOwner(userId);
      }
    }

    // ==================== 文章集合 ====================

    match /posts/{postId} {
      // 读取：公开文章所有人可读，草稿只有作者可读
      allow read: if resource.data.status == 'published' ||
                     (isAuthenticated() && resource.data.authorId == request.auth.uid) ||
                     isAdmin();

      // 创建：已登录用户可以创建
      allow create: if isAuthenticated() &&
                       request.resource.data.authorId == request.auth.uid &&
                       hasRequiredFields(['title', 'content', 'authorId']) &&
                       isValidString('title', 5, 200) &&
                       isValidString('content', 100, 50000);

      // 更新：作者或管理员可以更新
      allow update: if (isAuthenticated() &&
                        resource.data.authorId == request.auth.uid &&
                        isUnmodified('authorId')) ||
                       isAdmin();

      // 删除：作者或管理员可以删除
      allow delete: if (isAuthenticated() &&
                        resource.data.authorId == request.auth.uid) ||
                       isAdmin();

      // 评论子集合
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated() &&
                         request.resource.data.userId == request.auth.uid;
        allow update, delete: if isAuthenticated() &&
                                 resource.data.userId == request.auth.uid;
      }
    }

    // ==================== 系统配置（只读） ====================

    match /config/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### Storage 安全规则

```javascript
// storage.rules
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function isValidSize(maxSizeMB) {
      return request.resource.size < maxSizeMB * 1024 * 1024;
    }

    // 用户头像
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) &&
                      isValidImage() &&
                      isValidSize(2);
    }

    // 用户文件
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && isValidSize(10);
    }

    // 公共资源
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## 本地开发与模拟器

Firebase Emulator Suite 让你可以在本地完整测试应用。

### 模拟器配置

```json
// firebase.json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 连接模拟器

```javascript
// firebase.js - 开发环境配置
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = { /* ... */ };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// 开发环境连接模拟器
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);

  console.log('已连接到 Firebase 模拟器');
}

export { app, db, auth, storage, functions };
```

### 启动模拟器

```bash
# 启动所有模拟器
firebase emulators:start

# 启动并导入数据
firebase emulators:start --import=./emulator-data

# 启动并自动导出数据
firebase emulators:start --import=./emulator-data --export-on-exit

# 只启动特定模拟器
firebase emulators:start --only firestore,auth
```

## 最佳实践

### 性能优化

```javascript
// 1. 使用分页减少数据传输
const pageSize = 20;
const q = query(collection(db, 'posts'), limit(pageSize));

// 2. 选择性监听，避免不必要的实时更新
const unsubscribe = onSnapshot(
  doc(db, 'users', userId),
  { includeMetadataChanges: false }, // 忽略元数据变更
  (doc) => { /* ... */ }
);

// 3. 使用复合索引优化查询
// 在 firestore.indexes.json 中定义

// 4. 数据反规范化减少读取
const postWithAuthor = {
  title: 'Post Title',
  authorId: 'user123',
  // 嵌入常用作者信息
  author: {
    displayName: 'John',
    photoURL: 'https://...'
  }
};

// 5. 启用离线持久化
import { enableIndexedDbPersistence } from 'firebase/firestore';
enableIndexedDbPersistence(db);
```

### 安全最佳实践

```
Firebase 安全检查清单：

1. 认证安全
   - 启用邮箱验证
   - 配置密码强度要求
   - 限制登录尝试次数

2. 数据安全规则
   - 默认拒绝所有访问
   - 验证用户身份
   - 验证数据格式
   - 限制查询范围

3. API 密钥管理
   - 限制 API 密钥使用范围
   - 不同环境使用不同密钥
   - 定期轮换密钥

4. Cloud Functions 安全
   - 验证所有输入
   - 使用最小权限原则
   - 记录安全事件
```

### 成本优化

```javascript
// 1. 使用缓存减少读取
const cache = new Map();

async function getCachedUser(userId) {
  if (cache.has(userId)) {
    const cached = cache.get(userId);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
  }

  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();

  cache.set(userId, { data: userData, timestamp: Date.now() });
  return userData;
}

// 2. 使用聚合查询
const count = await getCountFromServer(
  query(collection(db, 'posts'), where('status', '==', 'published'))
);

// 3. 取消不需要的监听
const unsubscribes = [];

function subscribe() {
  unsubscribes.push(onSnapshot(/* ... */));
}

function cleanup() {
  unsubscribes.forEach(unsub => unsub());
}
```

## 总结

Firebase 提供了一整套完整的后端解决方案：

| 服务 | 用途 | 特点 |
|------|------|------|
| Authentication | 用户认证 | 多种登录方式、安全可靠 |
| Cloud Firestore | 文档数据库 | 实时同步、离线支持 |
| Realtime Database | 实时数据库 | 极低延迟、JSON 结构 |
| Cloud Functions | 服务端逻辑 | 无服务器、事件驱动 |
| Cloud Storage | 文件存储 | 安全、可扩展 |
| Hosting | 静态托管 | 全球 CDN、自动 HTTPS |
| Analytics | 数据分析 | 免费、无限制 |
| Performance | 性能监控 | 自动追踪、自定义指标 |

Firebase 特别适合：
- 快速构建 MVP 和原型
- 移动应用后端开发
- 实时协作应用
- 中小型项目全栈开发
- 需要快速迭代的产品

开发时重点关注：
1. 合理设计数据结构（考虑反规范化）
2. 编写严格的安全规则
3. 优化查询和监听控制成本
4. 使用模拟器进行本地开发测试
5. 监控性能和使用情况
