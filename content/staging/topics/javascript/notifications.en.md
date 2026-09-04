---
title: JavaScript Web Notifications API
description: Comprehensive guide to the Web Notifications API for displaying system-level notifications in web applications, covering permissions, lifecycle, best practices, and real-world implementation patterns.
track: javascript
section: browser
difficulty: intermediate
tags:
  - notifications
  - web-api
  - browser
  - dom
  - user-experience
status: imported
origin: old/src/content/docs/javascript/notifications.en.md
divergence: 0.222
issues:
  - title-lang-zh
  - missing-subcategory-en
  - order-mismatch
  - title-language
legacy:
  category: JavaScript
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Explanation

The Web Notifications API is a browser interface that allows web applications to display system-level notifications to users, even when the page is not in focus. These notifications appear outside the browser window, integrated into the operating system's notification center, providing a seamless user experience for receiving alerts, messages, and updates.

### Historical Context

The Notifications API emerged from the need for web applications to compete with native applications in terms of user engagement. Before this API, web developers relied on browser-based alerts and pop-ups, which were limited to the browser window and often intrusive. The W3C standardized the Notifications API to provide a consistent, browser-independent way to display notifications across different platforms.

### Problems It Solves

1. **User Engagement**: Notify users of important events without requiring them to keep the browser window active
2. **Real-time Updates**: Display instant alerts for messages, events, and actions
3. **Background Notifications**: Keep users informed while they work in other applications
4. **System Integration**: Leverage the operating system's native notification system for better UX
5. **Accessibility**: Provide an alternative to visual alerts for time-sensitive information

## Core Principles

### Permission-Based Model

The Notifications API follows a strict permission model:

- **Deny**: User explicitly denies notification permission
- **Default/Prompt**: User hasn't made a decision; browser will prompt when first request is made
- **Grant**: User grants permission for notifications

This security model prevents malicious websites from spamming users with unwanted notifications.

### Asynchronous Permissions

Permission requests are asynchronous operations that may take time to process. The API returns a Promise that resolves with the user's decision.

### Lifecycle Management

Notifications have distinct states:
- **Creation**: Instantiated and displayed
- **Active**: Currently visible to the user
- **Closed**: User dismissed or automatically closed
- **Garbage Collected**: Removed from memory when all references are released

### Same-Origin Policy

Notifications are restricted to secure contexts (HTTPS) and follow the same-origin policy to prevent unauthorized cross-origin notification abuse.

### User-Centric Design

The API prioritizes user control with:
- Explicit permission requests
- Clear notification content
- Ability to dismiss notifications
- Operating system-level notification management

## Key Points

### Permission States

```javascript
// Notification.permission returns one of three values:
// "default" - user hasn't been asked yet
// "granted" - user has granted permission
// "denied" - user has denied permission
const permissionState = Notification.permission;
```

### Browser Compatibility

- **Chrome/Edge**: Full support since v5/12
- **Firefox**: Full support since v4
- **Safari**: Full support since v6
- **Mobile Browsers**: Partial support; varies by platform and browser implementation

### System Notifications Features

- **Title and Body**: Required and optional text content
- **Icon**: Custom image for the notification
- **Badge**: Small icon for notification center display
- **Tag**: Identifier to replace previous notifications with same tag
- **Vibration**: Device vibration pattern on mobile devices
- **Actions**: Custom buttons user can click in notification
- **Sound**: Audio notification alert
- **Timestamp**: Custom notification creation time

### Permission Lifetime

- Permissions persist across browser sessions
- Users can revoke permissions in browser settings
- Different websites maintain separate permission states
- Permission can be checked without triggering a prompt

## Code Examples

### Basic Permission Check and Request

```javascript
// Check current permission status
function checkNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    return 'prompt'; // User hasn't made a decision
  }

  return false; // User explicitly denied
}

// Request permission when user performs an action
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.error('Notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}
```

### Simple Notification

```javascript
// Display a basic notification
function showSimpleNotification() {
  if (Notification.permission === 'granted') {
    const notification = new Notification('Welcome!', {
      body: 'Thank you for visiting our website',
      icon: '/images/notification-icon.png'
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }
}
```

### Advanced Notification with Actions

```javascript
// Notification with interactive actions
function showAdvancedNotification() {
  const options = {
    body: 'You have a new message from Alice',
    icon: '/images/app-icon.png',
    badge: '/images/badge-icon.png',
    tag: 'message-notification', // Replace previous notifications with same tag
    requireInteraction: true, // Keep until user interacts
    actions: [
      {
        action: 'reply',
        title: 'Reply',
        icon: '/images/reply-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/close-icon.png'
      }
    ],
    data: {
      messageId: 12345,
      senderId: 'alice',
      conversationId: 'conv-001'
    }
  };

  const notification = new Notification('New Message', options);

  // Handle notification click
  notification.addEventListener('click', (event) => {
    if (event.action === 'reply') {
      handleReplyAction();
    } else if (event.action === 'close') {
      notification.close();
    } else {
      // Default click (notification body clicked)
      handleNotificationClick();
    }
  });

  // Handle notification dismissal
  notification.addEventListener('close', () => {
    console.log('Notification dismissed');
  });

  // Handle notification error
  notification.addEventListener('error', () => {
    console.error('Notification display failed');
  });

  // Handle notification showing
  notification.addEventListener('show', () => {
    console.log('Notification displayed');
  });
}

function handleReplyAction() {
  console.log('User clicked reply');
  // Switch to chat window or open reply UI
  window.focus();
}

function handleNotificationClick() {
  console.log('User clicked notification body');
  // Focus browser window and navigate to relevant page
  window.focus();
  // window.location.href = '/messages';
}
```

### Service Worker Notifications

```javascript
// In Service Worker - handle notification clicks in background
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Extract data from notification
  const messageId = event.notification.data.messageId;
  const action = event.action;

  // Handle different actions
  if (action === 'reply') {
    // Open reply window or focus existing client
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if message window is already open
        for (let client of clientList) {
          if (client.url === `/messages/${messageId}` && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow(`/messages/${messageId}`);
        }
      })
    );
  } else {
    // Default action - focus the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (let client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  // Log analytics or clean up resources
});
```

### Notification Queue System

```javascript
class NotificationQueue {
  constructor(maxConcurrent = 3) {
    this.queue = [];
    this.active = new Set();
    this.maxConcurrent = maxConcurrent;
  }

  async show(title, options = {}) {
    // Wait if queue is full
    while (this.active.size >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const notification = new Notification(title, options);
    this.active.add(notification);

    // Auto-remove from active set when closed
    notification.addEventListener('close', () => {
      this.active.delete(notification);
    });

    return notification;
  }

  async showSequence(notifications, delay = 1000) {
    for (const { title, options } of notifications) {
      await this.show(title, options);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const queue = new NotificationQueue(2);

// Show multiple notifications with spacing
queue.showSequence([
  { title: 'First', options: { body: 'First notification' } },
  { title: 'Second', options: { body: 'Second notification' } },
  { title: 'Third', options: { body: 'Third notification' } }
], 2000);
```

### Permission Management UI

```javascript
class NotificationManager {
  constructor() {
    this.checkSupport();
  }

  checkSupport() {
    if (!('Notification' in window)) {
      document.getElementById('notification-status').textContent =
        'Your browser does not support notifications';
      return false;
    }
    return true;
  }

  updateUI() {
    const status = document.getElementById('notification-status');
    const btn = document.getElementById('notification-btn');

    switch (Notification.permission) {
      case 'granted':
        status.textContent = 'Notifications Enabled';
        status.className = 'status granted';
        btn.textContent = 'Disable Notifications';
        btn.onclick = () => this.showPermissionInfo();
        break;

      case 'denied':
        status.textContent = 'Notifications Disabled';
        status.className = 'status denied';
        btn.textContent = 'Open Browser Settings';
        btn.onclick = () => this.showSettingsInfo();
        break;

      case 'default':
        status.textContent = 'Not Configured';
        status.className = 'status default';
        btn.textContent = 'Enable Notifications';
        btn.onclick = () => this.requestPermission();
        break;
    }
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      this.updateUI();

      if (permission === 'granted') {
        this.showTestNotification();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  }

  showTestNotification() {
    new Notification('Success!', {
      body: 'Notifications are now enabled',
      icon: '/images/success-icon.png'
    });
  }

  showPermissionInfo() {
    alert('To disable notifications, visit your browser settings and revoke permission for this website.');
  }

  showSettingsInfo() {
    alert('Permission was denied. To enable notifications, update the permission in your browser settings.');
  }
}

// Initialize
const manager = new NotificationManager();
manager.updateUI();
```

### Notification with Custom Sounds and Vibration

```javascript
function showMultimediaNotification() {
  const options = {
    body: 'Important alert!',
    icon: '/images/alert-icon.png',
    badge: '/images/badge.png',
    tag: 'important-alert',
    requireInteraction: true,
    // Vibration pattern: vibrate 200ms, pause 100ms, vibrate 200ms
    vibrate: [200, 100, 200],
    // Custom timestamp
    timestamp: Date.now(),
    // Notification data
    data: {
      priority: 'high',
      alertId: 'alert-001',
      url: '/alerts/001'
    }
  };

  if (Notification.permission === 'granted') {
    const notification = new Notification('Alert', options);

    notification.onclick = () => {
      window.focus();
      // Navigate to relevant page
      if (notification.data.url) {
        window.location.href = notification.data.url;
      }
      notification.close();
    };
  }
}
```

## Best Practices

### Always Check Permission Before Showing

```javascript
// Always verify permission exists
function safeShowNotification(title, options) {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
  }
}
```

### Request Permission at the Right Time

```javascript
// Request permission after meaningful user interaction
const notificationBtn = document.getElementById('enable-notifications');
notificationBtn.addEventListener('click', async () => {
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Show first notification to confirm
      new Notification('Notifications Enabled!');
    }
  }
});
```

### Use Tags to Replace Notifications

```javascript
// Only show one notification per category by using tags
function updateProgressNotification(progress) {
  new Notification('Download Progress', {
    body: `${progress}% complete`,
    tag: 'download-progress', // Replaces previous notification with same tag
    requireInteraction: false
  });
}

// Each call replaces the previous download notification
updateProgressNotification(25);
updateProgressNotification(50);
updateProgressNotification(100);
```

### Handle Notification Lifecycle Events

```javascript
const notification = new Notification('Event Test', {
  body: 'Testing notification events'
});

notification.addEventListener('show', () => {
  console.log('Notification became visible');
  // Track when notification appears
});

notification.addEventListener('click', () => {
  console.log('User clicked notification');
  window.focus();
});

notification.addEventListener('close', () => {
  console.log('Notification closed');
  // Clean up resources
});

notification.addEventListener('error', (event) => {
  console.error('Notification error:', event);
});
```

### Provide Clear and Concise Content

```javascript
// Good: Clear, actionable notification
new Notification('Message from Sarah', {
  body: 'Are we still meeting at 3pm?',
  tag: 'message-from-sarah',
  requireInteraction: true,
  actions: [
    { action: 'confirm', title: 'Yes' },
    { action: 'decline', title: 'No' }
  ]
});

// Bad: Vague, generic notification
new Notification('Alert', {
  body: 'Something happened'
});
```

### Use Service Workers for Background Notifications

```javascript
// Register Service Worker for persistent notifications
navigator.serviceWorker.register('/sw.js').then(reg => {
  // Use Service Worker to show notifications even when page is closed
  reg.showNotification('Background Notification', {
    body: 'This works even if page is closed',
    tag: 'background-test'
  });
});
```

### Respect User Preferences

```javascript
class UserPreferences {
  constructor() {
    this.storageKey = 'notification-preferences';
    this.loadPreferences();
  }

  loadPreferences() {
    const saved = localStorage.getItem(this.storageKey);
    this.preferences = saved ? JSON.parse(saved) : {
      enabled: true,
      sound: true,
      vibration: true,
      desktop: true
    };
  }

  savePreferences() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
  }

  shouldNotify(type = 'general') {
    return this.preferences.enabled && this.preferences[type] !== false;
  }

  showNotification(title, options = {}) {
    if (!this.shouldNotify(options.type)) {
      return;
    }

    const finalOptions = {
      ...options,
      vibrate: this.preferences.vibration ? options.vibrate : undefined
    };

    if (Notification.permission === 'granted') {
      new Notification(title, finalOptions);
    }
  }
}

// Usage
const prefs = new UserPreferences();
prefs.showNotification('Hello', { body: 'Check this out', type: 'message' });
```

## Common Pitfalls

### Showing Notifications Without Permission

```javascript
// Wrong: Will fail silently
new Notification('Hello'); // Doesn't work if permission is not granted

// Correct: Check permission first
if (Notification.permission === 'granted') {
  new Notification('Hello');
}
```

### Spamming Users with Notifications

```javascript
// Wrong: Creates multiple notifications
for (let i = 0; i < 10; i++) {
  new Notification('Message', { body: `Message ${i}` });
}

// Correct: Use tags to replace, or batch notifications
const messages = ['Message 1', 'Message 2', 'Message 3'];
messages.forEach((msg, index) => {
  new Notification('Messages', {
    body: `${messages.length} new messages: ${msg}, ...`,
    tag: 'message-batch'
  });
});
```

### Not Handling Permission Denial

```javascript
// Wrong: Doesn't handle denied permission
Notification.requestPermission().then(() => {
  new Notification('Hello');
});

// Correct: Handle all permission states
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    new Notification('Hello');
  } else if (permission === 'denied') {
    console.log('User denied notification permission');
    // Show alternative UI
  }
});
```

### Ignoring requireInteraction

```javascript
// Wrong: Important notification closes too quickly
new Notification('Critical Alert', {
  body: 'Server is down',
  tag: 'critical'
  // Missing requireInteraction
});

// Correct: Keep important notifications visible
new Notification('Critical Alert', {
  body: 'Server is down',
  tag: 'critical',
  requireInteraction: true // User must dismiss
});
```

### Not Closing Notifications When Appropriate

```javascript
// Wrong: Notification stays visible indefinitely
const notification = new Notification('Loading...', {
  body: 'Processing your request'
});

// Correct: Close when operation completes
const notification = new Notification('Loading...', {
  body: 'Processing your request'
});

someAsyncOperation().then(() => {
  notification.close();
  new Notification('Complete!', {
    body: 'Your request is finished'
  });
});
```

### Using Notifications for Non-Critical Updates

```javascript
// Wrong: Annoying notification for minor info
new Notification('You have a new follower', {
  body: 'John followed you',
  tag: 'follower',
  requireInteraction: true
});

// Correct: Reserve notifications for important events
// Use less intrusive methods for minor updates (badges, etc.)
```

### Not Testing Across Browsers

```javascript
// Wrong: Assumes all browsers support all features
const options = {
  body: 'Test',
  actions: [/* ... */],
  badge: '/badge.png',
  tag: 'test'
};

// Correct: Check browser support and handle gracefully
const options = {
  body: 'Test',
  tag: 'test'
};

// Add advanced features if supported
if ('actions' in new Notification('test', { tag: 'support-check' })) {
  options.actions = [/* ... */];
}
```

## Performance Considerations

### Notification Latency

```javascript
// Measure notification display time
const startTime = performance.now();
const notification = new Notification('Performance Test');

notification.addEventListener('show', () => {
  const displayTime = performance.now() - startTime;
  console.log(`Notification displayed in ${displayTime}ms`);
});
```

### Memory Management

```javascript
// Keep notifications in a map for efficient management
class NotificationManager {
  constructor() {
    this.notifications = new Map();
  }

  show(id, title, options) {
    // Close existing notification with same ID
    if (this.notifications.has(id)) {
      this.notifications.get(id).close();
    }

    const notification = new Notification(title, options);
    this.notifications.set(id, notification);

    // Clean up on close
    notification.addEventListener('close', () => {
      this.notifications.delete(id);
    });

    return notification;
  }

  closeAll() {
    for (const [id, notification] of this.notifications) {
      notification.close();
    }
    this.notifications.clear();
  }
}
```

### Batch Notification Creation

```javascript
// Wrong: Creates notifications one by one (slower)
notifications.forEach(notif => {
  new Notification(notif.title, notif.options);
});

// Better: Batch or queue for better performance
async function showNotificationsWithDelay(notifications, delayMs = 500) {
  for (const { title, options } of notifications) {
    new Notification(title, options);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
```

### Service Worker Optimization

```javascript
// In Service Worker - handle notifications efficiently
self.addEventListener('push', (event) => {
  const data = event.data.json();

  // Only show if app is not focused
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const isAppFocused = clientList.some(client => client.focused);

        if (!isAppFocused) {
          return self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            tag: data.tag,
            data: data.customData
          });
        }
      })
  );
});
```

### Icon Loading Performance

```javascript
// Pre-load notification icons to avoid delays
function preloadNotificationIcons(urls) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

// Use cached icons for faster display
const iconCache = new Map();

function getIconUrl(name) {
  return iconCache.get(name) || '/images/default-icon.png';
}

// Pre-populate cache
iconCache.set('success', '/images/success-icon.png');
iconCache.set('error', '/images/error-icon.png');
iconCache.set('info', '/images/info-icon.png');
```

## Real-world Scenarios

### Chat Application Notifications

```javascript
class ChatNotificationManager {
  constructor() {
    this.activeChats = new Set();
  }

  async handleNewMessage(message) {
    const { senderId, senderName, body, conversationId } = message;

    // Don't notify if chat window is focused
    if (this.activeChats.has(conversationId)) {
      return;
    }

    const permission = await this.ensurePermission();
    if (permission !== 'granted') return;

    new Notification(`Message from ${senderName}`, {
      body: body.substring(0, 100),
      icon: `/avatars/${senderId}.png`,
      badge: '/images/chat-badge.png',
      tag: `chat-${conversationId}`,
      requireInteraction: true,
      actions: [
        { action: 'reply', title: 'Reply' },
        { action: 'read', title: 'Read' }
      ],
      data: {
        conversationId,
        messageId: message.id
      }
    });
  }

  async ensurePermission() {
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  setChatActive(conversationId, active = true) {
    if (active) {
      this.activeChats.add(conversationId);
    } else {
      this.activeChats.delete(conversationId);
    }
  }
}
```

### Email Client Notifications

```javascript
class EmailNotificationManager {
  constructor() {
    this.checkInterval = null;
  }

  async startMonitoring() {
    // Check for new emails every 30 seconds
    this.checkInterval = setInterval(() => this.checkNewEmails(), 30000);
  }

  stopMonitoring() {
    clearInterval(this.checkInterval);
  }

  async checkNewEmails() {
    try {
      const response = await fetch('/api/emails/new');
      const newEmails = await response.json();

      if (newEmails.length > 0) {
        this.notifyNewEmails(newEmails);
      }
    } catch (error) {
      console.error('Error checking emails:', error);
    }
  }

  notifyNewEmails(emails) {
    if (Notification.permission !== 'granted') return;

    if (emails.length === 1) {
      const email = emails[0];
      new Notification(`Email from ${email.from}`, {
        body: email.subject,
        icon: email.avatar,
        tag: `email-${email.id}`,
        data: { emailId: email.id }
      });
    } else {
      new Notification(`${emails.length} New Emails`, {
        body: emails.map(e => e.from).join(', '),
        icon: '/images/email-icon.png',
        tag: 'email-batch'
      });
    }
  }
}
```

### Project Management Tool Notifications

```javascript
class ProjectNotificationManager {
  handleTaskAssignment(task) {
    if (Notification.permission !== 'granted') return;

    new Notification('Task Assigned', {
      body: `${task.title} assigned by ${task.assignedBy}`,
      icon: `/avatars/${task.assignedById}.png`,
      badge: '/images/project-badge.png',
      tag: `task-${task.id}`,
      data: { taskId: task.id, projectId: task.projectId }
    });
  }

  handleProjectUpdate(project, change) {
    if (Notification.permission !== 'granted') return;

    const changeText = `${change.type}: ${change.description}`;
    new Notification(`${project.name} Updated`, {
      body: changeText,
      icon: project.icon,
      tag: `project-${project.id}-${change.type}`,
      data: { projectId: project.id, changeId: change.id }
    });
  }

  handleDeadlineReminder(task, hoursUntil) {
    if (Notification.permission !== 'granted') return;

    new Notification('Deadline Approaching', {
      body: `${task.title} due in ${hoursUntil} hours`,
      icon: '/images/deadline-icon.png',
      tag: `deadline-${task.id}`,
      requireInteraction: hoursUntil < 2,
      data: { taskId: task.id }
    });
  }
}
```

### E-commerce Order Tracking

```javascript
class OrderNotificationManager {
  handleOrderStatusChange(order) {
    if (Notification.permission !== 'granted') return;

    const statusMessages = {
      'confirmed': 'Your order has been confirmed',
      'shipped': 'Your order is on the way!',
      'out_for_delivery': 'Out for delivery today',
      'delivered': 'Your order has been delivered'
    };

    const message = statusMessages[order.status];

    new Notification('Order Update', {
      body: message,
      icon: '/images/order-icon.png',
      tag: `order-${order.id}`,
      data: {
        orderId: order.id,
        trackingUrl: `/orders/${order.id}/track`
      }
    });
  }

  handlePriceAlert(product) {
    if (Notification.permission !== 'granted') return;

    new Notification('Price Drop!', {
      body: `${product.name} is now $${product.currentPrice}`,
      icon: product.thumbnail,
      tag: `price-alert-${product.id}`,
      requireInteraction: true,
      data: { productId: product.id }
    });
  }

  async handleLowStockWarning(product) {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification('Low Stock Alert', {
      body: `${product.name} - Only ${product.stock} left!`,
      icon: product.thumbnail,
      tag: `stock-${product.id}`,
      requireInteraction: true
    });

    notification.onclick = () => {
      window.location.href = `/products/${product.id}`;
    };
  }
}
```

## Interview Points

### "What is the Web Notifications API and what are its main use cases?"

**Answer**: The Web Notifications API allows web applications to display system-level notifications that appear outside the browser window. Main use cases include:
- Real-time messaging in chat applications
- Email and notification alerts
- Task reminders and deadlines
- Order and delivery tracking
- Breaking news and urgent updates
- Background synchronization alerts

The API requires user permission and respects the same-origin policy for security.

### "Explain the permission model for notifications."

**Answer**: The Notifications API uses a three-state permission model:
- **"default"**: User hasn't made a decision; `requestPermission()` will prompt
- **"granted"**: User allowed notifications; can show without prompting
- **"denied"**: User explicitly denied; cannot show notifications

Permissions persist across sessions and can be changed in browser settings. Requesting permission at the right time (after user interaction) improves acceptance rates.

### "What's the difference between browser notifications and Service Worker notifications?"

**Answer**:
- **Browser Notifications**: Shown while the page is active or using `Notification` constructor
- **Service Worker Notifications**: Shown via `ServiceWorkerRegistration.showNotification()` and work even when the page is closed, enabling background notifications

Service Workers are preferred for persistent notifications, push events, and background synchronization.

### "How do you prevent notification spam and improve UX?"

**Answer**:
- Use the `tag` option to replace previous notifications instead of stacking
- Use `requireInteraction: true` only for critical notifications
- Respect user preferences and permission state
- Show notifications only when relevant (e.g., don't notify if user is viewing the relevant content)
- Batch related notifications instead of showing many separate ones
- Implement notification queues to avoid overwhelming users
- Provide clear, concise notification content

### "Explain the notification lifecycle and event handling."

**Answer**: Notifications have these events:
- **show**: When the notification is displayed
- **click**: When user clicks the notification or action buttons
- **close**: When notification is dismissed
- **error**: If notification display fails

Example:
```javascript
notification.addEventListener('show', () => { /* track impression */ });
notification.addEventListener('click', (e) => { /* handle action */ });
notification.addEventListener('close', () => { /* clean up */ });
```

### "What are the browser compatibility considerations?"

**Answer**:
- All modern browsers support the Notifications API
- Desktop support is excellent (Chrome, Firefox, Safari, Edge)
- Mobile support varies by platform and browser
- Always check for API availability: `'Notification' in window`
- Test actual notification display in target browsers
- Some features (like actions) may have limited support on mobile
- Require HTTPS/secure context for security

### "How do you handle notification actions and different click targets?"

**Answer**:
```javascript
notification.addEventListener('click', (event) => {
  // event.action is empty string for body click, or the action ID
  if (event.action === 'reply') {
    // Handle reply action
  } else if (event.action === 'close') {
    // Handle close action
  } else {
    // Handle body click
  }
  event.notification.close();
});
```

### "Explain the security model and why permission is needed."

**Answer**: Permission is required because:
- Prevents malicious sites from spamming users with notifications
- Follows same-origin policy (only HTTPS allowed)
- User maintains control over which sites can notify them
- Permission is stored per-origin and can be revoked
- Protects user attention and system resources

This design ensures notifications enhance UX rather than create annoyance.

## Further Reading

### Official Documentation

- [MDN Web Docs - Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [W3C Notifications Standard](https://www.w3.org/TR/notifications/)
- [WHATWG Living Standard - Notifications](https://html.spec.whatwg.org/multipage/system-state.html#notifications)

### Browser Specifications

- [Chrome DevTools Documentation - Notifications](https://developer.chrome.com/docs/devtools/notifications/)
- [Firefox Developer - Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [Safari WebKit - Push Notifications](https://webkit.org/blog/12975/web-push-for-web-apps-on-ios-and-ipados/)

### Related APIs and Technologies

- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

### Tutorials and Guides

- [Using the Notifications API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)
- [Web Notifications - Can I Use](https://caniuse.com/notifications)
- [Service Workers: Background Sync & Push Notifications](https://developers.google.com/web/fundamentals/codelabs/push-notifications)

### Related Topics

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-protocol)
- [User Engagement Metrics](https://web.dev/user-centric-performance-metrics/)
- [Accessibility and Notifications](https://www.w3.org/WAI/WCAG21/quickref/)

### Best Practices Resources

- [Web Performance Working Group](https://www.w3.org/webperf/)
- [OWASP Security Best Practices](https://owasp.org/www-project-web-security-testing-guide/)
- [UX Design Patterns for Notifications](https://www.nngroup.com/articles/notification-pattern/)
