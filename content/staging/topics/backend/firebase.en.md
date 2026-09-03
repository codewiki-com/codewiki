---
title: "Firebase: Full-Stack App Development Platform"
description: Build mobile and web application backends with Google Firebase
track: backend
section: deployment
difficulty: beginner
tags:
  - Firebase
  - Google Cloud
  - BaaS
  - NoSQL
status: imported
origin: old/src/content/docs/backend/firebase.en.md
divergence: 0.087
issues: []
legacy:
  category: Backend
  subcategory: BaaS
  order: 24
  lastUpdated: 2026-01-07
---

## What is Firebase?

Firebase is Google's comprehensive Backend-as-a-Service (BaaS) platform that provides developers with a suite of tools and services to build, improve, and grow mobile and web applications. Instead of building and maintaining your own backend infrastructure, Firebase offers ready-to-use services that handle common backend tasks like authentication, databases, file storage, and hosting.

### Why Choose Firebase?

Firebase is designed to accelerate application development by eliminating the complexity of backend infrastructure management. It provides real-time capabilities out of the box and integrates seamlessly with other Google Cloud services.

Key advantages of Firebase include:

- **Rapid Development**: Pre-built backend services reduce development time significantly
- **Real-time Sync**: Built-in real-time data synchronization across all connected clients
- **Scalability**: Automatically scales with your application's growth
- **Cross-Platform Support**: SDKs for iOS, Android, Web, Unity, C++, and more
- **Serverless Architecture**: No server management required for most use cases
- **Google Cloud Integration**: Deep integration with Google Cloud Platform services
- **Generous Free Tier**: Spark plan offers substantial free usage for development and small apps

```
Firebase Core Services:

Development:
1. Authentication - User identity management
2. Cloud Firestore - NoSQL document database
3. Realtime Database - JSON-based real-time database
4. Cloud Storage - File storage for user-generated content
5. Cloud Functions - Serverless backend logic
6. Hosting - Fast and secure web hosting

Quality:
7. Crashlytics - Crash reporting and analysis
8. Performance Monitoring - App performance insights
9. Test Lab - Device testing infrastructure

Growth:
10. Analytics - User behavior tracking
11. Cloud Messaging - Push notifications
12. Remote Config - Dynamic app configuration
```

## Firebase Project Setup

### Creating a Firebase Project

Before using any Firebase services, you need to create a Firebase project in the Firebase Console.

```javascript
// 1. Go to https://console.firebase.google.com
// 2. Click "Create a project"
// 3. Enter your project name and configure settings
// 4. Add your app (Web, iOS, Android)

// Web App Configuration (obtained from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123...",
  measurementId: "G-XXXXXX" // Optional, for Analytics
};
```

### Installing Firebase SDK

```bash
# For web applications using npm
npm install firebase

# For specific Firebase services
npm install firebase@latest

# Firebase Admin SDK (for server-side)
npm install firebase-admin
```

### Initializing Firebase in Your Application

```javascript
// Modern ES6 modular import (recommended)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
```

```javascript
// Server-side initialization with Firebase Admin SDK
import admin from 'firebase-admin';
import serviceAccount from './service-account-key.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project.firebaseio.com",
  storageBucket: "your-project.appspot.com"
});

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminDb, adminAuth };
```

## Firebase Authentication

Firebase Authentication provides backend services, easy-to-use SDKs, and ready-made UI libraries to authenticate users to your app. It supports authentication using passwords, phone numbers, and popular federated identity providers like Google, Facebook, and Twitter.

### Email and Password Authentication

```javascript
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

const auth = getAuth();

// Sign Up - Create a new user
async function signUp(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: displayName,
      photoURL: null
    });

    // Send email verification
    await sendEmailVerification(user);

    console.log('User created:', user.uid);
    return user;
  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('This email is already registered');
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/weak-password':
        throw new Error('Password should be at least 6 characters');
      default:
        throw new Error('Registration failed: ' + error.message);
    }
  }
}

// Sign In - Authenticate existing user
async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        throw new Error('Invalid email or password');
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later');
      default:
        throw new Error('Login failed: ' + error.message);
    }
  }
}

// Sign Out
async function logOut() {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    throw new Error('Sign out failed: ' + error.message);
  }
}

// Password Reset
async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent');
  } catch (error) {
    throw new Error('Password reset failed: ' + error.message);
  }
}

// Auth State Observer
function subscribeToAuthChanges(callback) {
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
```

### Social Authentication (OAuth Providers)

```javascript
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

// Google Sign In
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  // Add custom scopes if needed
  provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

  // Set custom parameters
  provider.setCustomParameters({
    prompt: 'select_account',
    login_hint: 'user@example.com'
  });

  try {
    const result = await signInWithPopup(auth, provider);

    // Get Google OAuth access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    return {
      user: result.user,
      token: token
    };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in cancelled');
    }
    throw new Error('Google sign in failed: ' + error.message);
  }
}

// Facebook Sign In
async function signInWithFacebook() {
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = FacebookAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;

    return {
      user: result.user,
      token: accessToken
    };
  } catch (error) {
    throw new Error('Facebook sign in failed: ' + error.message);
  }
}

// GitHub Sign In
async function signInWithGitHub() {
  const provider = new GithubAuthProvider();
  provider.addScope('repo');
  provider.addScope('user:email');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    return {
      user: result.user,
      token: token
    };
  } catch (error) {
    throw new Error('GitHub sign in failed: ' + error.message);
  }
}

// Handle redirect result (for mobile-friendly sign in)
async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    throw new Error('Redirect sign in failed: ' + error.message);
  }
}
```

### Phone Authentication

```javascript
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider
} from 'firebase/auth';

// Initialize reCAPTCHA verifier
function setupRecaptcha(buttonId) {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: (response) => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    }
  });
}

// Send verification code
async function sendVerificationCode(phoneNumber) {
  const appVerifier = window.recaptchaVerifier;

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber, // Format: +1234567890
      appVerifier
    );

    // Store confirmation result for later verification
    window.confirmationResult = confirmationResult;
    return true;
  } catch (error) {
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format');
    }
    throw new Error('Failed to send code: ' + error.message);
  }
}

// Verify code and sign in
async function verifyCode(code) {
  try {
    const result = await window.confirmationResult.confirm(code);
    return result.user;
  } catch (error) {
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code');
    }
    throw new Error('Verification failed: ' + error.message);
  }
}
```

## Cloud Firestore

Cloud Firestore is Firebase's flexible, scalable NoSQL cloud database for mobile, web, and server development. It keeps your data in sync across client apps through real-time listeners and offers offline support.

### Firestore Data Model

```javascript
/*
Firestore Data Structure:

Collection: users
  Document: user_id_1
    - name: "John Doe"
    - email: "john@example.com"
    - createdAt: Timestamp

    Subcollection: orders
      Document: order_id_1
        - product: "Widget"
        - quantity: 2
        - price: 29.99

Collection: products
  Document: product_id_1
    - name: "Widget"
    - category: "Electronics"
    - price: 29.99
    - stock: 100
*/
```

### Basic CRUD Operations

```javascript
import {
  getFirestore,
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
  arrayRemove
} from 'firebase/firestore';

const db = getFirestore();

// CREATE - Add a new document with auto-generated ID
async function createUser(userData) {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Document written with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    throw new Error('Failed to create user: ' + error.message);
  }
}

// CREATE - Set document with specific ID
async function createUserWithId(userId, userData) {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return userId;
  } catch (error) {
    throw new Error('Failed to create user: ' + error.message);
  }
}

// READ - Get a single document
async function getUser(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    throw new Error('Failed to get user: ' + error.message);
  }
}

// READ - Get all documents in a collection
async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];

    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return users;
  } catch (error) {
    throw new Error('Failed to get users: ' + error.message);
  }
}

// UPDATE - Update specific fields
async function updateUser(userId, updates) {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('User updated');
  } catch (error) {
    throw new Error('Failed to update user: ' + error.message);
  }
}

// UPDATE - Special field operations
async function updateUserSpecialFields(userId) {
  const docRef = doc(db, 'users', userId);

  // Increment a numeric field
  await updateDoc(docRef, {
    loginCount: increment(1)
  });

  // Add to an array field
  await updateDoc(docRef, {
    tags: arrayUnion('premium')
  });

  // Remove from an array field
  await updateDoc(docRef, {
    tags: arrayRemove('trial')
  });
}

// DELETE - Remove a document
async function deleteUser(userId) {
  try {
    await deleteDoc(doc(db, 'users', userId));
    console.log('User deleted');
  } catch (error) {
    throw new Error('Failed to delete user: ' + error.message);
  }
}
```

### Querying Data

```javascript
import {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  or,
  and
} from 'firebase/firestore';

// Simple query with single condition
async function getActiveUsers() {
  const q = query(
    collection(db, 'users'),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Query with multiple conditions
async function getFilteredProducts(category, minPrice, maxPrice) {
  const q = query(
    collection(db, 'products'),
    where('category', '==', category),
    where('price', '>=', minPrice),
    where('price', '<=', maxPrice),
    orderBy('price', 'asc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Query with OR conditions (Firestore v9.10+)
async function getUsersByRole() {
  const q = query(
    collection(db, 'users'),
    or(
      where('role', '==', 'admin'),
      where('role', '==', 'moderator')
    )
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Array contains query
async function getUsersByTag(tag) {
  const q = query(
    collection(db, 'users'),
    where('tags', 'array-contains', tag)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Pagination with cursors
async function getPaginatedUsers(pageSize, lastDoc = null) {
  let q = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return {
    users,
    lastDoc: lastVisible,
    hasMore: snapshot.docs.length === pageSize
  };
}
```

### Real-time Listeners

```javascript
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';

// Listen to a single document
function subscribeToUser(userId, callback) {
  const docRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...docSnap.data()
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to user:', error);
    }
  );

  return unsubscribe; // Call to stop listening
}

// Listen to a collection with query
function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );

  const unsubscribe = onSnapshot(q,
    (snapshot) => {
      const messages = [];

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          console.log('New message:', change.doc.data());
        }
        if (change.type === 'modified') {
          console.log('Modified message:', change.doc.data());
        }
        if (change.type === 'removed') {
          console.log('Removed message:', change.doc.data());
        }
      });

      snapshot.docs.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      callback(messages);
    },
    (error) => {
      console.error('Error listening to messages:', error);
    }
  );

  return unsubscribe;
}

// React Hook example for real-time data
function useFirestoreDocument(collectionName, docId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, collectionName, docId);

    const unsubscribe = onSnapshot(docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() });
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
```

### Batch Operations and Transactions

```javascript
import { writeBatch, runTransaction } from 'firebase/firestore';

// Batch write - multiple operations atomically
async function batchCreateUsers(usersData) {
  const batch = writeBatch(db);

  usersData.forEach((userData) => {
    const docRef = doc(collection(db, 'users'));
    batch.set(docRef, {
      ...userData,
      createdAt: serverTimestamp()
    });
  });

  try {
    await batch.commit();
    console.log('Batch write successful');
  } catch (error) {
    throw new Error('Batch write failed: ' + error.message);
  }
}

// Transaction - read and write atomically
async function transferCredits(fromUserId, toUserId, amount) {
  try {
    await runTransaction(db, async (transaction) => {
      // Read both documents
      const fromDocRef = doc(db, 'users', fromUserId);
      const toDocRef = doc(db, 'users', toUserId);

      const fromDoc = await transaction.get(fromDocRef);
      const toDoc = await transaction.get(toDocRef);

      if (!fromDoc.exists() || !toDoc.exists()) {
        throw new Error('User not found');
      }

      const fromCredits = fromDoc.data().credits;

      if (fromCredits < amount) {
        throw new Error('Insufficient credits');
      }

      // Perform the transfer
      transaction.update(fromDocRef, {
        credits: fromCredits - amount
      });

      transaction.update(toDocRef, {
        credits: toDoc.data().credits + amount
      });
    });

    console.log('Transfer successful');
  } catch (error) {
    throw new Error('Transfer failed: ' + error.message);
  }
}
```

## Realtime Database

Firebase Realtime Database is the original Firebase database. It's a JSON-based cloud database that synchronizes data across all connected clients in real-time. While Firestore is recommended for most new projects, Realtime Database excels in specific use cases like presence detection and low-latency syncing.

### Realtime Database vs Firestore

```
Feature Comparison:

                    Realtime Database    Cloud Firestore
Data Model          JSON tree            Documents/Collections
Queries             Limited, shallow     Rich, compound queries
Offline Support     Mobile only          Mobile and Web
Scaling             Manual sharding      Automatic
Pricing             Bandwidth + Storage  Operations + Storage
Real-time           Excellent            Good
Filtering           Client-side          Server-side
```

### Basic Operations

```javascript
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  push,
  child,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  serverTimestamp as rtdbServerTimestamp
} from 'firebase/database';

const rtdb = getDatabase();

// Write data
async function writeUserData(userId, userData) {
  try {
    await set(ref(rtdb, 'users/' + userId), {
      ...userData,
      createdAt: rtdbServerTimestamp()
    });
    console.log('Data saved successfully');
  } catch (error) {
    throw new Error('Failed to write data: ' + error.message);
  }
}

// Push data (auto-generated key)
async function addMessage(chatId, message) {
  const messagesRef = ref(rtdb, 'chats/' + chatId + '/messages');
  const newMessageRef = push(messagesRef);

  await set(newMessageRef, {
    ...message,
    timestamp: rtdbServerTimestamp()
  });

  return newMessageRef.key;
}

// Read data once
async function getUserData(userId) {
  const snapshot = await get(ref(rtdb, 'users/' + userId));

  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    throw new Error('User not found');
  }
}

// Update specific fields
async function updateUserProfile(userId, updates) {
  const updates_obj = {};
  updates_obj['/users/' + userId + '/profile'] = updates;
  updates_obj['/users/' + userId + '/updatedAt'] = rtdbServerTimestamp();

  await update(ref(rtdb), updates_obj);
}

// Multi-path updates
async function updateUserAndStats(userId, userData) {
  const updates = {};
  updates['/users/' + userId] = userData;
  updates['/userStats/' + userId + '/lastActive'] = rtdbServerTimestamp();

  await update(ref(rtdb), updates);
}

// Delete data
async function deleteUser(userId) {
  await remove(ref(rtdb, 'users/' + userId));
}

// Real-time listener
function subscribeToUser(userId, callback) {
  const userRef = ref(rtdb, 'users/' + userId);

  const unsubscribe = onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error:', error);
  });

  return unsubscribe;
}

// Listen to child events
function subscribeToMessages(chatId, callbacks) {
  const messagesRef = ref(rtdb, 'chats/' + chatId + '/messages');

  const unsubAdded = onChildAdded(messagesRef, (snapshot) => {
    callbacks.onAdded({
      id: snapshot.key,
      ...snapshot.val()
    });
  });

  const unsubChanged = onChildChanged(messagesRef, (snapshot) => {
    callbacks.onChanged({
      id: snapshot.key,
      ...snapshot.val()
    });
  });

  const unsubRemoved = onChildRemoved(messagesRef, (snapshot) => {
    callbacks.onRemoved(snapshot.key);
  });

  return () => {
    unsubAdded();
    unsubChanged();
    unsubRemoved();
  };
}
```

### Presence System

```javascript
import {
  onDisconnect,
  onValue,
  ref,
  set,
  serverTimestamp
} from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// User presence system
function setupPresence() {
  const auth = getAuth();
  const rtdb = getDatabase();

  onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const userStatusRef = ref(rtdb, 'status/' + user.uid);
    const connectedRef = ref(rtdb, '.info/connected');

    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      // Set up offline status when disconnected
      onDisconnect(userStatusRef).set({
        state: 'offline',
        lastChanged: serverTimestamp()
      }).then(() => {
        // Set online status
        set(userStatusRef, {
          state: 'online',
          lastChanged: serverTimestamp()
        });
      });
    });
  });
}

// Get user online status
function subscribeToUserStatus(userId, callback) {
  const statusRef = ref(rtdb, 'status/' + userId);

  return onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({ state: 'offline' });
    }
  });
}
```

## Cloud Functions

Cloud Functions for Firebase let you automatically run backend code in response to events triggered by Firebase features and HTTPS requests. Your code is stored in Google's cloud and runs in a managed environment.

### Setting Up Cloud Functions

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Cloud Functions in your project
firebase init functions

# Project structure after initialization
# functions/
#   ├── index.js        # Main entry point
#   ├── package.json    # Dependencies
#   └── .eslintrc.js    # ESLint config
```

### HTTP Functions

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Basic HTTP function
exports.helloWorld = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    response.json({ message: 'Hello from Firebase!' });
  });
});

// HTTP function with authentication check
exports.protectedEndpoint = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    // Verify Firebase ID token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Process authenticated request
      res.json({
        message: 'Authenticated successfully',
        userId: userId
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });
});

// Callable function (recommended for client calls)
exports.addUserToGroup = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { groupId } = data;
  const userId = context.auth.uid;

  if (!groupId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Group ID is required'
    );
  }

  try {
    await admin.firestore()
      .collection('groups')
      .doc(groupId)
      .update({
        members: admin.firestore.FieldValue.arrayUnion(userId)
      });

    return { success: true, message: 'Added to group' };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      'Failed to add user to group'
    );
  }
});
```

### Firestore Triggers

```javascript
// Triggered when a document is created
exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snapshot, context) => {
    const userData = snapshot.data();
    const userId = context.params.userId;

    // Send welcome email
    await sendWelcomeEmail(userData.email, userData.displayName);

    // Create initial user stats
    await admin.firestore()
      .collection('userStats')
      .doc(userId)
      .set({
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log('User created:', userId);
  });

// Triggered when a document is updated
exports.onUserUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    // Check if email was changed
    if (before.email !== after.email) {
      await sendEmailChangeNotification(before.email, after.email);
    }

    // Check if profile became verified
    if (!before.isVerified && after.isVerified) {
      await sendVerificationCongrats(after.email);
    }
  });

// Triggered when a document is deleted
exports.onUserDeleted = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snapshot, context) => {
    const userId = context.params.userId;

    // Clean up related data
    const batch = admin.firestore().batch();

    // Delete user stats
    batch.delete(admin.firestore().collection('userStats').doc(userId));

    // Delete user posts
    const postsSnapshot = await admin.firestore()
      .collection('posts')
      .where('authorId', '==', userId)
      .get();

    postsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Delete user files from Storage
    const bucket = admin.storage().bucket();
    await bucket.deleteFiles({
      prefix: `users/${userId}/`
    });

    console.log('User data cleaned up:', userId);
  });
```

### Authentication Triggers

```javascript
// Triggered when a new user is created
exports.onAuthUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  // Create user profile in Firestore
  await admin.firestore().collection('users').doc(uid).set({
    email: email,
    displayName: displayName || email.split('@')[0],
    photoURL: photoURL || null,
    role: 'user',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('New user profile created:', uid);
});

// Triggered when a user is deleted
exports.onAuthUserDeleted = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  // Trigger full cleanup
  await admin.firestore().collection('users').doc(uid).delete();

  console.log('User profile deleted:', uid);
});
```

### Scheduled Functions

```javascript
// Run every day at midnight
exports.dailyCleanup = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old notifications
    const oldNotifications = await admin.firestore()
      .collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo)
      .get();

    const batch = admin.firestore().batch();
    oldNotifications.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${oldNotifications.size} old notifications`);
  });

// Run every hour
exports.hourlyStats = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const stats = await calculateHourlyStats();

    await admin.firestore()
      .collection('analytics')
      .add({
        ...stats,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
  });
```

## Cloud Storage

Cloud Storage for Firebase is built for app developers who need to store and serve user-generated content, such as photos, videos, and other files.

### Uploading Files

```javascript
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage';

const storage = getStorage();

// Simple file upload
async function uploadFile(file, path) {
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      path: snapshot.ref.fullPath,
      downloadURL: downloadURL
    };
  } catch (error) {
    throw new Error('Upload failed: ' + error.message);
  }
}

// Upload with progress tracking
function uploadFileWithProgress(file, path, onProgress, onComplete, onError) {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on('state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress, snapshot.state);
    },
    (error) => {
      switch (error.code) {
        case 'storage/unauthorized':
          onError('User does not have permission to upload');
          break;
        case 'storage/canceled':
          onError('Upload was cancelled');
          break;
        case 'storage/unknown':
          onError('Unknown error occurred');
          break;
        default:
          onError(error.message);
      }
    },
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      onComplete({
        path: uploadTask.snapshot.ref.fullPath,
        downloadURL: downloadURL
      });
    }
  );

  // Return pause/resume/cancel controls
  return {
    pause: () => uploadTask.pause(),
    resume: () => uploadTask.resume(),
    cancel: () => uploadTask.cancel()
  };
}

// Upload user profile picture
async function uploadProfilePicture(userId, file) {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload an image.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const extension = file.name.split('.').pop();
  const path = `users/${userId}/profile.${extension}`;

  return uploadFile(file, path);
}

// Download file
async function getFileUrl(path) {
  const storageRef = ref(storage, path);
  try {
    return await getDownloadURL(storageRef);
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      throw new Error('File not found');
    }
    throw error;
  }
}

// Delete file
async function deleteFile(path) {
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
    console.log('File deleted successfully');
  } catch (error) {
    throw new Error('Delete failed: ' + error.message);
  }
}

// List files in a directory
async function listFiles(path) {
  const storageRef = ref(storage, path);

  try {
    const result = await listAll(storageRef);

    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);

        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url: url,
          size: metadata.size,
          contentType: metadata.contentType,
          createdAt: metadata.timeCreated
        };
      })
    );

    return {
      files: files,
      folders: result.prefixes.map((prefix) => prefix.name)
    };
  } catch (error) {
    throw new Error('Failed to list files: ' + error.message);
  }
}

// Update file metadata
async function updateFileMetadata(path, metadata) {
  const storageRef = ref(storage, path);

  const newMetadata = {
    cacheControl: metadata.cacheControl || 'public,max-age=3600',
    contentType: metadata.contentType,
    customMetadata: metadata.customMetadata || {}
  };

  await updateMetadata(storageRef, newMetadata);
}
```

### Storage Security Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function isUnderSizeLimit(maxSizeMB) {
      return request.resource.size < maxSizeMB * 1024 * 1024;
    }

    // User profile pictures
    match /users/{userId}/profile.{extension} {
      allow read: if true;
      allow write: if isAuthenticated()
                   && isOwner(userId)
                   && isValidImage()
                   && isUnderSizeLimit(5);
    }

    // User uploaded files
    match /users/{userId}/uploads/{fileName} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated()
                   && isOwner(userId)
                   && isUnderSizeLimit(10);
      allow delete: if isAuthenticated() && isOwner(userId);
    }

    // Public assets
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Firebase Hosting

Firebase Hosting provides fast and secure hosting for your web app, static and dynamic content, and microservices.

### Deploying to Firebase Hosting

```bash
# Initialize hosting
firebase init hosting

# Build your app (example for React)
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Deploy to preview channel
firebase hosting:channel:deploy preview-channel

# Deploy with a custom message
firebase deploy --only hosting -m "Version 1.2.0 release"
```

### Firebase Configuration

```json
// firebase.json
{
  "hosting": {
    "public": "build",
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
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
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
    ],
    "redirects": [
      {
        "source": "/old-page",
        "destination": "/new-page",
        "type": 301
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

### Multi-site Hosting

```json
// firebase.json for multiple sites
{
  "hosting": [
    {
      "target": "app",
      "public": "app/build",
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "admin",
      "public": "admin/build",
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ]
}
```

```bash
# Associate targets with sites
firebase target:apply hosting app my-project-app
firebase target:apply hosting admin my-project-admin

# Deploy specific site
firebase deploy --only hosting:app
```

## Firebase Analytics

Firebase Analytics (also known as Google Analytics for Firebase) provides free, unlimited reporting on up to 500 distinct events.

### Setting Up Analytics

```javascript
import { initializeApp } from 'firebase/app';
import {
  getAnalytics,
  logEvent,
  setUserProperties,
  setUserId,
  setAnalyticsCollectionEnabled
} from 'firebase/analytics';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Enable/disable analytics collection
function setAnalyticsEnabled(enabled) {
  setAnalyticsCollectionEnabled(analytics, enabled);
}

// Set user ID for cross-device tracking
function setAnalyticsUserId(userId) {
  setUserId(analytics, userId);
}

// Set user properties
function setUserProfile(properties) {
  setUserProperties(analytics, {
    user_type: properties.userType,
    subscription_plan: properties.plan,
    account_age_days: properties.accountAge
  });
}

// Log custom events
function logCustomEvent(eventName, params) {
  logEvent(analytics, eventName, params);
}

// Common event examples
function logScreenView(screenName) {
  logEvent(analytics, 'screen_view', {
    screen_name: screenName,
    screen_class: screenName
  });
}

function logPurchase(transactionId, value, currency, items) {
  logEvent(analytics, 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items
  });
}

function logSearch(searchTerm) {
  logEvent(analytics, 'search', {
    search_term: searchTerm
  });
}

function logSignUp(method) {
  logEvent(analytics, 'sign_up', {
    method: method
  });
}

function logLogin(method) {
  logEvent(analytics, 'login', {
    method: method
  });
}

function logShare(contentType, itemId, method) {
  logEvent(analytics, 'share', {
    content_type: contentType,
    item_id: itemId,
    method: method
  });
}

// E-commerce events
function logAddToCart(item) {
  logEvent(analytics, 'add_to_cart', {
    currency: 'USD',
    value: item.price,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: 1
    }]
  });
}

function logBeginCheckout(cart) {
  logEvent(analytics, 'begin_checkout', {
    currency: 'USD',
    value: cart.total,
    items: cart.items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });
}
```

## Performance Monitoring

Firebase Performance Monitoring helps you gain insight into the performance characteristics of your app.

### Setting Up Performance Monitoring

```javascript
import { initializeApp } from 'firebase/app';
import {
  getPerformance,
  trace
} from 'firebase/performance';

const app = initializeApp(firebaseConfig);
const perf = getPerformance(app);

// Custom trace for specific operations
async function measureApiCall(apiName, apiFunction) {
  const customTrace = trace(perf, apiName);

  customTrace.start();

  try {
    const result = await apiFunction();
    customTrace.putAttribute('status', 'success');
    customTrace.putMetric('response_size', JSON.stringify(result).length);
    return result;
  } catch (error) {
    customTrace.putAttribute('status', 'error');
    customTrace.putAttribute('error_message', error.message);
    throw error;
  } finally {
    customTrace.stop();
  }
}

// Usage example
async function fetchUserData(userId) {
  return measureApiCall('fetch_user_data', async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  });
}

// Custom trace with metrics
function measureComplexOperation() {
  const customTrace = trace(perf, 'complex_operation');

  customTrace.start();

  // Add custom attributes
  customTrace.putAttribute('user_type', 'premium');
  customTrace.putAttribute('feature_flag', 'new_algorithm');

  // Perform operation
  let itemsProcessed = 0;
  for (let i = 0; i < 1000; i++) {
    // Process items
    itemsProcessed++;
  }

  // Add custom metrics
  customTrace.putMetric('items_processed', itemsProcessed);
  customTrace.incrementMetric('operations_count', 1);

  customTrace.stop();
}

// React component with performance tracking
function PerformanceTrackedComponent({ children }) {
  const mountTrace = useRef(null);

  useEffect(() => {
    mountTrace.current = trace(perf, 'component_mount');
    mountTrace.current.start();

    return () => {
      if (mountTrace.current) {
        mountTrace.current.stop();
      }
    };
  }, []);

  return children;
}
```

## Security Rules Best Practices

### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isValidUser(userData) {
      return userData.keys().hasAll(['email', 'displayName']) &&
             userData.email is string &&
             userData.displayName is string &&
             userData.displayName.size() >= 2 &&
             userData.displayName.size() <= 50;
    }

    function hasRequiredFields(requiredFields) {
      return request.resource.data.keys().hasAll(requiredFields);
    }

    function isUnchanged(field) {
      return request.resource.data[field] == resource.data[field];
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
                    isOwner(userId) &&
                    isValidUser(request.resource.data);
      allow update: if isAuthenticated() &&
                    isOwner(userId) &&
                    isUnchanged('createdAt') &&
                    isUnchanged('email');
      allow delete: if isAdmin();

      // User's private data subcollection
      match /private/{document} {
        allow read, write: if isOwner(userId);
      }
    }

    // Posts collection
    match /posts/{postId} {
      allow read: if resource.data.isPublished == true ||
                  (isAuthenticated() && resource.data.authorId == request.auth.uid);
      allow create: if isAuthenticated() &&
                    hasRequiredFields(['title', 'content', 'authorId']) &&
                    request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() &&
                    resource.data.authorId == request.auth.uid &&
                    isUnchanged('authorId') &&
                    isUnchanged('createdAt');
      allow delete: if isAuthenticated() &&
                    (resource.data.authorId == request.auth.uid || isAdmin());

      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated() &&
                      request.resource.data.authorId == request.auth.uid;
        allow update, delete: if isAuthenticated() &&
                              resource.data.authorId == request.auth.uid;
      }
    }

    // Admin-only collection
    match /adminData/{document} {
      allow read, write: if isAdmin();
    }

    // Rate limiting example (using a separate collection)
    match /rateLimits/{limitId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
                    request.resource.data.count == 1;
      allow update: if isAuthenticated() &&
                    request.resource.data.count <= 100 &&
                    request.resource.data.count == resource.data.count + 1;
    }
  }
}
```

### Testing Security Rules

```javascript
// firestore.rules.test.js
const firebase = require('@firebase/rules-unit-testing');
const fs = require('fs');

const PROJECT_ID = 'test-project';

function getFirestore(auth) {
  return firebase.initializeTestApp({
    projectId: PROJECT_ID,
    auth: auth
  }).firestore();
}

function getAdminFirestore() {
  return firebase.initializeAdminApp({
    projectId: PROJECT_ID
  }).firestore();
}

beforeAll(async () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  await firebase.loadFirestoreRules({
    projectId: PROJECT_ID,
    rules: rules
  });
});

afterAll(async () => {
  await firebase.clearFirestoreData({ projectId: PROJECT_ID });
  await Promise.all(firebase.apps().map(app => app.delete()));
});

describe('Users collection', () => {
  test('authenticated users can read any user profile', async () => {
    const db = getFirestore({ uid: 'user1' });
    const docRef = db.collection('users').doc('user2');
    await firebase.assertSucceeds(docRef.get());
  });

  test('users can only update their own profile', async () => {
    const admin = getAdminFirestore();
    await admin.collection('users').doc('user1').set({
      email: 'test@test.com',
      displayName: 'Test User',
      createdAt: new Date()
    });

    const db = getFirestore({ uid: 'user1' });
    const docRef = db.collection('users').doc('user1');
    await firebase.assertSucceeds(docRef.update({ displayName: 'New Name' }));

    const otherDb = getFirestore({ uid: 'user2' });
    const otherDocRef = otherDb.collection('users').doc('user1');
    await firebase.assertFails(otherDocRef.update({ displayName: 'Hacked' }));
  });

  test('users cannot change their email', async () => {
    const admin = getAdminFirestore();
    await admin.collection('users').doc('user1').set({
      email: 'original@test.com',
      displayName: 'Test User',
      createdAt: new Date()
    });

    const db = getFirestore({ uid: 'user1' });
    const docRef = db.collection('users').doc('user1');
    await firebase.assertFails(docRef.update({ email: 'new@test.com' }));
  });
});
```

## Interview Key Points

### Core Concept Questions

**1. What is Firebase and when should you use it?**

```
Firebase is Google's Backend-as-a-Service (BaaS) platform that provides:

Ideal Use Cases:
- Rapid prototyping and MVPs
- Real-time applications (chat, collaboration)
- Mobile-first applications
- Serverless architectures
- Small to medium-scale applications

When NOT to Use Firebase:
- Complex relational data requirements
- Heavy server-side processing needs
- Strict data residency requirements
- Applications requiring complex transactions
- Cost-sensitive high-volume applications
```

**2. Explain the difference between Firestore and Realtime Database**

```
Firestore:
- Document-based NoSQL database
- Rich querying capabilities with compound queries
- Automatic scaling
- Offline support for web and mobile
- Better for complex data structures
- Charged per operation

Realtime Database:
- JSON tree structure
- Limited querying (no compound queries)
- Requires manual sharding for scale
- Excellent for real-time sync
- Better for simple, flat data
- Charged by bandwidth and storage

Choose Firestore for:
- New projects
- Complex queries needed
- Structured data

Choose Realtime Database for:
- Presence systems
- Very low-latency sync
- Simple data structures
```

**3. How do you handle authentication in Firebase?**

```javascript
// Firebase supports multiple authentication methods:

1. Email/Password - Traditional username/password
2. OAuth Providers - Google, Facebook, Twitter, GitHub
3. Phone Authentication - SMS verification
4. Anonymous - Temporary accounts
5. Custom Tokens - Integration with external auth systems

// Best practices:
- Always use auth state observer
- Handle all error cases
- Implement proper session management
- Use security rules to protect data
- Consider multi-factor authentication for sensitive apps
```

### Practical Questions

**4. How would you structure data in Firestore for a social media app?**

```javascript
// Recommended structure:

// Users collection - core user data
/users/{userId}
  - displayName
  - email
  - photoURL
  - bio
  - followersCount (denormalized)
  - followingCount (denormalized)
  - postsCount (denormalized)

// Posts collection - top-level for easy querying
/posts/{postId}
  - authorId
  - authorName (denormalized)
  - authorPhoto (denormalized)
  - content
  - imageUrls[]
  - likesCount
  - commentsCount
  - createdAt
  - hashtags[]

// Following/Followers - separate collections
/following/{userId}/userFollowing/{targetUserId}
/followers/{userId}/userFollowers/{followerId}

// Likes - subcollection for efficient "did user like" queries
/posts/{postId}/likes/{userId}

// Comments - subcollection for pagination
/posts/{postId}/comments/{commentId}

// Feed - personalized feed per user
/feeds/{userId}/posts/{postId}
  - postRef
  - createdAt

// Key principles:
// 1. Denormalize data for read efficiency
// 2. Use subcollections for 1:many relationships
// 3. Keep documents small (under 1MB limit)
// 4. Design for your query patterns
```

**5. How do you optimize Firestore costs?**

```javascript
// Cost optimization strategies:

1. Reduce Read Operations:
   - Use pagination (limit queries)
   - Cache frequently accessed data client-side
   - Use get() instead of real-time listeners when appropriate
   - Implement field masks to read only needed fields

2. Reduce Write Operations:
   - Batch writes when possible
   - Debounce user input
   - Avoid writing unchanged data

3. Optimize Data Structure:
   - Denormalize to reduce joins (multiple reads)
   - Use appropriate subcollections
   - Keep documents small

4. Use Firestore Bundles:
   // Pre-package common queries
   const bundle = firestore.bundle('latest-stories');
   bundle.add(await firestore
     .collection('stories')
     .orderBy('timestamp', 'desc')
     .limit(10)
     .get()
   );

5. Monitor Usage:
   - Use Firebase Console monitoring
   - Set up billing alerts
   - Analyze query patterns
```

**6. Explain Firebase Security Rules and their importance**

```javascript
// Security Rules are crucial because:

1. Client-side code is not trustworthy
2. They run on Firebase servers
3. They validate every read/write operation

// Common patterns:

// Authentication check
allow read: if request.auth != null;

// Owner-only access
allow write: if request.auth.uid == resource.data.ownerId;

// Data validation
allow create: if request.resource.data.title.size() <= 100
              && request.resource.data.title.size() > 0;

// Role-based access
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid))
         .data.role == 'admin';
}

// Time-based rules
allow update: if request.time < resource.data.expiresAt;

// Rate limiting pattern
allow create: if !exists(/databases/$(database)/documents/rateLimits/$(request.auth.uid))
              || get(...).data.count < 100;
```

### Best Practices Summary

```
1. Project Structure:
   - Separate Firebase config from business logic
   - Use environment variables for config
   - Create reusable Firebase hooks (React) or services

2. Data Modeling:
   - Design for query patterns first
   - Denormalize for read performance
   - Use subcollections appropriately
   - Keep documents under 1MB

3. Security:
   - Never trust client-side validation alone
   - Write comprehensive security rules
   - Test rules with Firebase emulator
   - Use custom claims for role-based access

4. Performance:
   - Use offline persistence
   - Implement pagination
   - Cache data when appropriate
   - Monitor performance metrics

5. Cost Management:
   - Monitor usage in Firebase Console
   - Set billing alerts
   - Optimize query patterns
   - Use Firestore bundles for common queries

6. Development Workflow:
   - Use Firebase Emulator Suite locally
   - Implement proper error handling
   - Test security rules thoroughly
   - Use Firebase Extensions when appropriate
```

## Further Reading

### Official Documentation

- [Firebase Documentation](https://firebase.google.com/docs) - Comprehensive guides for all Firebase services
- [Firebase GitHub](https://github.com/firebase) - SDKs, samples, and tools
- [Firebase Blog](https://firebase.googleblog.com/) - Latest updates and best practices

### Recommended Learning Path

1. **Beginners**: Start with Authentication and Firestore basics
2. **Intermediate**: Learn Cloud Functions, Security Rules, and Hosting
3. **Advanced**: Explore Performance Monitoring, Analytics integration, and cost optimization

### Related Technologies

- **Google Cloud Platform** - For advanced backend needs beyond Firebase
- **Cloud Run** - For containerized backend services
- **BigQuery** - For advanced analytics on Firebase data
- **Cloud Pub/Sub** - For event-driven architectures

### Community Resources

- [Firebase YouTube Channel](https://www.youtube.com/firebase) - Official tutorials and updates
- [Firebase Community Slack](https://firebase.community/) - Community discussions
- [Stack Overflow Firebase Tag](https://stackoverflow.com/questions/tagged/firebase) - Q&A

## Summary

Firebase provides a powerful suite of tools for building modern web and mobile applications without managing traditional backend infrastructure. Its real-time capabilities, seamless authentication, and automatic scaling make it an excellent choice for rapid development and prototyping.

Key takeaways:

1. **Choose the right database**: Firestore for most use cases, Realtime Database for specific real-time scenarios
2. **Security is paramount**: Always implement comprehensive security rules
3. **Design for scale**: Structure data based on query patterns, not just relationships
4. **Monitor costs**: Understand pricing and optimize accordingly
5. **Use the emulator**: Test locally before deploying to production

Firebase continues to evolve with new features and improvements, making it increasingly capable of handling enterprise-scale applications while maintaining its developer-friendly approach.
