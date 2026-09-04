---
title: Electron Desktop App Guide
description: Master Electron for cross-platform desktop applications
track: javascript
section: node
difficulty: intermediate
tags:
  - Electron
  - Desktop
  - Cross-platform
  - Node.js
status: imported
origin: old/src/content/docs/frontend/electron.en.md
divergence: 0.2
issues: []
legacy:
  category: Frontend
  subcategory: Desktop
  order: 28
  lastUpdated: 2026-01-07
---

Electron is an open-source framework developed by GitHub that enables developers to build cross-platform desktop applications using web technologies (HTML, CSS, JavaScript). Popular applications like Visual Studio Code, Slack, Discord, and Notion are all built with Electron. We explore Electron's core concepts, development techniques, and best practices in depth.

## Electron Architecture Overview

### Multi-Process Architecture

Electron employs a multi-process architecture consisting of two primary process types:

```
+-------------------------------------------------------------+
|                    Electron Application                      |
+-------------------------------------------------------------+
|  +-----------------------------------------------------+    |
|  |              Main Process                            |    |
|  |  +---------------------------------------------+     |    |
|  |  |  - Full Node.js API access                  |     |    |
|  |  |  - Native OS API access                     |     |    |
|  |  |  - Window management (BrowserWindow)        |     |    |
|  |  |  - Application lifecycle management         |     |    |
|  |  |  - System tray, menus, dialogs              |     |    |
|  |  +---------------------------------------------+     |    |
|  +-----------------------------------------------------+    |
|                          |                                   |
|                     IPC Communication                        |
|                          |                                   |
|  +-----------------------------------------------------+    |
|  |           Renderer Process(es)                       |    |
|  |  +---------------+  +---------------+                |    |
|  |  |   Window 1    |  |   Window 2    |                |    |
|  |  |   Chromium    |  |   Chromium    |                |    |
|  |  |  HTML/CSS/JS  |  |  HTML/CSS/JS  |                |    |
|  |  +---------------+  +---------------+                |    |
|  +-----------------------------------------------------+    |
+-------------------------------------------------------------+
```

### The Main Process

The main process serves as the application's entry point and manages all windows and system-level interactions:

```javascript
// main.js - Main process entry point
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// Keep a global reference to the window object to prevent garbage collection
let mainWindow = null

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Preload script runs before renderer process loads
      preload: path.join(__dirname, 'preload.js'),
      // Disable Node.js integration (security best practice)
      nodeIntegration: false,
      // Enable context isolation (security best practice)
      contextIsolation: true,
      // Disable remote module (deprecated)
      enableRemoteModule: false
    }
  })

  // Load the application page
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
  }

  // Clean up reference when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Create window when app is ready
app.whenReady().then(createWindow)

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// On macOS, recreate window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
```

### The Renderer Process

Each window runs in its own isolated renderer process, essentially a Chromium web page:

```html
<!-- index.html - Renderer process page -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self'">
  <title>My Electron App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Welcome to Electron</h1>
    <button id="openFile">Open File</button>
    <div id="content"></div>
  </div>
  <script src="renderer.js"></script>
</body>
</html>
```

### The Preload Script

The preload script acts as a bridge between the main and renderer processes, executing before the renderer process loads:

```javascript
// preload.js - Preload script
const { contextBridge, ipcRenderer } = require('electron')

// Safely expose APIs to the renderer process using contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content) => ipcRenderer.invoke('dialog:saveFile', content),

  // System information
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Event listeners
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update:available', (event, info) => callback(info))
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// Expose version information
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})
```

## Project Configuration and Build Setup

### Project Initialization

Use `electron-forge` or `electron-vite` to quickly scaffold a project:

```bash
# Create project using electron-forge
npx create-electron-app my-electron-app --template=webpack-typescript

# Or create project using electron-vite (recommended)
npm create electron-vite@latest my-app

# Navigate to project directory
cd my-electron-app

# Install dependencies
npm install
```

### Project Structure

```
my-electron-app/
├── package.json
├── electron.vite.config.ts    # Vite configuration
├── tsconfig.json
├── src/
│   ├── main/                  # Main process code
│   │   ├── index.ts
│   │   └── ipc/
│   │       ├── fileHandlers.ts
│   │       └── windowHandlers.ts
│   ├── preload/               # Preload scripts
│   │   └── index.ts
│   └── renderer/              # Renderer process code
│       ├── index.html
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── components/
│       └── assets/
├── resources/                  # Application resources
│   └── icon.png
└── build/                      # Build configuration
    └── entitlements.mac.plist
```

### Package.json Configuration

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "An Electron desktop application",
  "main": "out/main/index.js",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-builder",
    "package:mac": "electron-builder --mac",
    "package:win": "electron-builder --win",
    "package:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.example.myapp",
    "productName": "My Electron App",
    "directories": {
      "output": "release"
    },
    "files": [
      "out/**/*",
      "resources/**/*"
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg", "zip"],
      "icon": "resources/icon.icns"
    },
    "win": {
      "target": ["nsis", "portable"],
      "icon": "resources/icon.ico"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "resources/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "electron-vite": "^2.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "electron-updater": "^6.1.0"
  }
}
```

### Vite Configuration for Electron

```typescript
// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src')
      }
    }
  }
})
```

## Window Management

### Creating Multiple Windows

```typescript
// src/main/windowManager.ts
import { BrowserWindow, screen } from 'electron'
import path from 'path'

interface WindowOptions {
  width?: number
  height?: number
  title?: string
  show?: boolean
}

class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map()

  createWindow(id: string, options: WindowOptions = {}): BrowserWindow {
    const { width = 800, height = 600, title = 'Window', show = true } = options

    // Get primary display
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    const win = new BrowserWindow({
      width,
      height,
      x: Math.floor((screenWidth - width) / 2),
      y: Math.floor((screenHeight - height) / 2),
      title,
      show: false, // Hide initially, show after loading
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // Show window after content loads to avoid white flash
    win.once('ready-to-show', () => {
      if (show) {
        win.show()
      }
    })

    // Remove from Map when closed
    win.on('closed', () => {
      this.windows.delete(id)
    })

    this.windows.set(id, win)
    return win
  }

  getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id)
  }

  closeWindow(id: string): void {
    const win = this.windows.get(id)
    if (win && !win.isDestroyed()) {
      win.close()
    }
  }

  closeAllWindows(): void {
    this.windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.close()
      }
    })
  }

  // Create modal window
  createModal(parentId: string, options: WindowOptions = {}): BrowserWindow | null {
    const parent = this.windows.get(parentId)
    if (!parent) return null

    const modal = new BrowserWindow({
      parent,
      modal: true,
      width: options.width || 400,
      height: options.height || 300,
      resizable: false,
      minimizable: false,
      maximizable: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    return modal
  }
}

export const windowManager = new WindowManager()
```

### Frameless Windows and Custom Title Bars

```typescript
// Creating a frameless window
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  frame: false, // Frameless
  titleBarStyle: 'hidden', // macOS: hide title bar but keep traffic lights
  titleBarOverlay: {
    // Windows custom title bar overlay
    color: '#2f3241',
    symbolColor: '#74b1be',
    height: 30
  },
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true
  }
})
```

```tsx
// Custom title bar component in renderer process
// src/renderer/src/components/TitleBar.tsx
import React from 'react'
import './TitleBar.css'

const TitleBar: React.FC = () => {
  const handleMinimize = () => window.electronAPI.minimizeWindow()
  const handleMaximize = () => window.electronAPI.maximizeWindow()
  const handleClose = () => window.electronAPI.closeWindow()

  return (
    <div className="title-bar">
      {/* Draggable region */}
      <div className="drag-region">
        <span className="app-title">My App</span>
      </div>

      {/* Window control buttons */}
      <div className="window-controls">
        <button className="control-btn minimize" onClick={handleMinimize}>
          <span>&#x2013;</span>
        </button>
        <button className="control-btn maximize" onClick={handleMaximize}>
          <span>&#x25A1;</span>
        </button>
        <button className="control-btn close" onClick={handleClose}>
          <span>&#x2715;</span>
        </button>
      </div>
    </div>
  )
}

export default TitleBar
```

```css
/* TitleBar.css */
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  background: #2f3241;
  color: #fff;
  -webkit-app-region: drag; /* Make entire title bar draggable */
}

.drag-region {
  flex: 1;
  padding-left: 12px;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag; /* Buttons should not be draggable */
}

.control-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.control-btn.close:hover {
  background: #e81123;
}
```

## IPC (Inter-Process Communication)

### Communication Patterns Overview

Electron provides multiple IPC communication patterns:

| Pattern | Direction | API | Characteristics |
|---------|-----------|-----|-----------------|
| One-way (Renderer to Main) | Renderer -> Main | `ipcRenderer.send` / `ipcMain.on` | Fire and forget |
| Two-way (Renderer <-> Main) | Renderer <-> Main | `ipcRenderer.invoke` / `ipcMain.handle` | Promise-based, recommended |
| One-way (Main to Renderer) | Main -> Renderer | `webContents.send` / `ipcRenderer.on` | Main process pushes updates |

### Two-Way Communication (Recommended)

```typescript
// src/main/ipc/fileHandlers.ts
import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export function setupFileHandlers(): void {
  // Open file dialog
  ipcMain.handle('dialog:openFile', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const content = await fs.readFile(filePath, 'utf-8')

    return {
      path: filePath,
      name: path.basename(filePath),
      content
    }
  })

  // Save file
  ipcMain.handle('dialog:saveFile', async (event, content: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { success: false, error: 'No window found' }

    const result = await dialog.showSaveDialog(win, {
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }

    try {
      await fs.writeFile(result.filePath, content, 'utf-8')
      return { success: true, path: result.filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Read directory
  ipcMain.handle('fs:readDir', async (event, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(dirPath, entry.name)
      }))
    } catch (error) {
      throw new Error(`Failed to read directory: ${(error as Error).message}`)
    }
  })
}
```

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

// Define types for APIs exposed to renderer
export interface FileInfo {
  path: string
  name: string
  content: string
}

export interface SaveResult {
  success: boolean
  path?: string
  error?: string
  canceled?: boolean
}

export interface DirEntry {
  name: string
  isDirectory: boolean
  path: string
}

export interface ElectronAPI {
  openFile: () => Promise<FileInfo | null>
  saveFile: (content: string) => Promise<SaveResult>
  readDir: (dirPath: string) => Promise<DirEntry[]>
}

const electronAPI: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content) => ipcRenderer.invoke('dialog:saveFile', content),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
```

```typescript
// src/renderer/src/App.tsx
import React, { useState } from 'react'

const App: React.FC = () => {
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')

  const handleOpenFile = async () => {
    const result = await window.electronAPI.openFile()
    if (result) {
      setContent(result.content)
      setFileName(result.name)
    }
  }

  const handleSaveFile = async () => {
    const result = await window.electronAPI.saveFile(content)
    if (result.success) {
      alert(`File saved: ${result.path}`)
    } else if (!result.canceled) {
      alert(`Save failed: ${result.error}`)
    }
  }

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={handleOpenFile}>Open File</button>
        <button onClick={handleSaveFile}>Save File</button>
        {fileName && <span>Current file: {fileName}</span>}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter content here..."
      />
    </div>
  )
}

export default App
```

### Main Process Pushing Messages to Renderer

```typescript
// src/main/index.ts
import { BrowserWindow } from 'electron'

// Send message to specific window
function sendToWindow(win: BrowserWindow, channel: string, data: any): void {
  if (!win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

// Broadcast message to all windows
function broadcast(channel: string, data: any): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    sendToWindow(win, channel, data)
  })
}

// Example: periodically send system status to windows
setInterval(() => {
  const memUsage = process.memoryUsage()
  broadcast('system:memory', {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
  })
}, 5000)
```

```typescript
// src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  // ... other APIs

  // Listen for main process messages
  onMemoryUpdate: (callback: (data: { heapUsed: number; heapTotal: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on('system:memory', handler)

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('system:memory', handler)
    }
  }
})
```

```tsx
// Using in renderer process
import { useEffect, useState } from 'react'

function SystemStatus() {
  const [memory, setMemory] = useState({ heapUsed: 0, heapTotal: 0 })

  useEffect(() => {
    // Set up listener
    const cleanup = window.electronAPI.onMemoryUpdate(setMemory)

    // Clean up when component unmounts
    return cleanup
  }, [])

  return (
    <div>
      Memory Usage: {memory.heapUsed}MB / {memory.heapTotal}MB
    </div>
  )
}
```

## Native APIs

### Application Menu

```typescript
// src/main/menu.ts
import { Menu, app, shell, BrowserWindow, MenuItemConstructorOptions } from 'electron'

export function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const win = BrowserWindow.getFocusedWindow()
            win?.webContents.send('menu:newFile')
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const win = BrowserWindow.getFocusedWindow()
            win?.webContents.send('menu:openFile')
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const win = BrowserWindow.getFocusedWindow()
            win?.webContents.send('menu:saveFile')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://electronjs.org')
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/your-repo/issues')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
```

### System Tray

```typescript
// src/main/tray.ts
import { Tray, Menu, app, nativeImage, BrowserWindow } from 'electron'
import path from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): Tray {
  // Create tray icon
  const iconPath = path.join(__dirname, '../../resources/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  // On macOS, use template image (auto-adapts to dark/light mode)
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true)
  }

  tray = new Tray(icon)
  tray.setToolTip('My Electron App')

  // Create tray menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Main Window',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    {
      label: 'Hide to Tray',
      click: () => {
        mainWindow.hide()
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Launch at Startup',
          type: 'checkbox',
          checked: app.getLoginItemSettings().openAtLogin,
          click: (menuItem) => {
            app.setLoginItemSettings({
              openAtLogin: menuItem.checked
            })
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // Toggle window visibility on tray icon click
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  return tray
}

// Update tray icon (e.g., show unread message count)
export function updateTrayIcon(count: number): void {
  if (!tray) return

  if (count > 0) {
    // Show badge count (macOS)
    app.dock?.setBadge(count > 99 ? '99+' : String(count))
    tray.setTitle(` ${count}`)
  } else {
    app.dock?.setBadge('')
    tray.setTitle('')
  }
}
```

### System Notifications

```typescript
// src/main/notifications.ts
import { Notification, nativeImage } from 'electron'
import path from 'path'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  silent?: boolean
  onClick?: () => void
}

export function showNotification(options: NotificationOptions): Notification {
  const { title, body, icon, silent = false, onClick } = options

  // Check if system supports notifications
  if (!Notification.isSupported()) {
    console.warn('System does not support notifications')
    return null as any
  }

  const notification = new Notification({
    title,
    body,
    icon: icon ? nativeImage.createFromPath(icon) : undefined,
    silent
  })

  if (onClick) {
    notification.on('click', onClick)
  }

  notification.show()
  return notification
}

// Usage example
export function notifyDownloadComplete(fileName: string, filePath: string): void {
  showNotification({
    title: 'Download Complete',
    body: `File ${fileName} has been downloaded`,
    icon: path.join(__dirname, '../../resources/download-icon.png'),
    onClick: () => {
      // Show file in file manager
      require('electron').shell.showItemInFolder(filePath)
    }
  })
}
```

## File System Access

### Secure File Operations

```typescript
// src/main/ipc/fileSystem.ts
import { ipcMain, app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

// Define allowed directories for access
const ALLOWED_PATHS = [
  app.getPath('documents'),
  app.getPath('downloads'),
  app.getPath('temp'),
  app.getPath('userData')
]

// Validate if path is within allowed directories
function isPathAllowed(targetPath: string): boolean {
  const normalizedPath = path.normalize(targetPath)
  return ALLOWED_PATHS.some((allowedPath) => normalizedPath.startsWith(allowedPath))
}

export function setupFileSystemHandlers(): void {
  // Read file
  ipcMain.handle('fs:read', async (event, filePath: string) => {
    if (!isPathAllowed(filePath)) {
      throw new Error('Access denied: path not within allowed directories')
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Write file
  ipcMain.handle('fs:write', async (event, filePath: string, content: string) => {
    if (!isPathAllowed(filePath)) {
      throw new Error('Access denied: path not within allowed directories')
    }

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Delete file
  ipcMain.handle('fs:delete', async (event, filePath: string) => {
    if (!isPathAllowed(filePath)) {
      throw new Error('Access denied: path not within allowed directories')
    }

    try {
      await fs.unlink(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Get app data path
  ipcMain.handle('app:getPath', (event, name: string) => {
    const validNames = ['home', 'appData', 'userData', 'temp', 'documents', 'downloads']
    if (!validNames.includes(name)) {
      throw new Error(`Invalid path name: ${name}`)
    }
    return app.getPath(name as any)
  })
}
```

### Drag and Drop File Handling

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Get path for dropped file
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Handle dropped files
  handleDroppedFiles: (files: FileList) => {
    const paths = Array.from(files).map((file) => webUtils.getPathForFile(file))
    return ipcRenderer.invoke('fs:handleDroppedFiles', paths)
  }
})
```

```tsx
// src/renderer/src/components/DropZone.tsx
import React, { useCallback, useState } from 'react'

interface FileInfo {
  name: string
  path: string
  size: number
}

const DropZone: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    const fileInfos: FileInfo[] = []

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i]
      const filePath = window.electronAPI.getPathForFile(file)
      fileInfos.push({
        name: file.name,
        path: filePath,
        size: file.size
      })
    }

    setFiles(fileInfos)
  }, [])

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {files.length === 0 ? (
        <p>Drop files here</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file.path}>
              {file.name} ({Math.round(file.size / 1024)} KB)
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DropZone
```

## Security Best Practices

### Security Checklist

```typescript
// Secure window configuration example
const secureWindowConfig = {
  webPreferences: {
    // 1. Disable Node.js integration
    nodeIntegration: false,

    // 2. Enable context isolation
    contextIsolation: true,

    // 3. Disable remote module
    enableRemoteModule: false,

    // 4. Use preload scripts
    preload: path.join(__dirname, 'preload.js'),

    // 5. Enable sandbox mode
    sandbox: true,

    // 6. Disable webview tag
    webviewTag: false
  }
}
```

### Content Security Policy (CSP)

```html
<!-- Set CSP in HTML -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
">
```

```typescript
// Or set dynamically in main process
import { session } from 'electron'

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        ]
      }
    })
  })
})
```

### Validating IPC Messages

```typescript
// src/main/ipc/validation.ts
import { ipcMain, BrowserWindow } from 'electron'

// Validate message sender
function validateSender(event: Electron.IpcMainInvokeEvent): boolean {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return false

  // Validate URL
  const url = new URL(event.sender.getURL())
  const allowedOrigins = ['http://localhost:3000', 'file://']

  return allowedOrigins.some(
    (origin) => url.origin === origin || url.protocol === 'file:'
  )
}

// Secure IPC handler
ipcMain.handle('secure:action', async (event, data) => {
  // Validate sender
  if (!validateSender(event)) {
    throw new Error('Unauthorized message source')
  }

  // Validate data
  if (typeof data !== 'object' || !data) {
    throw new Error('Invalid data format')
  }

  // Execute operation...
})
```

### Safely Opening External Links

```typescript
// src/main/index.ts
import { shell, app } from 'electron'

// Safely handle external links
function safeOpenExternal(url: string): void {
  try {
    const parsedUrl = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.warn(`Blocked unsafe protocol: ${parsedUrl.protocol}`)
      return
    }

    shell.openExternal(url)
  } catch (error) {
    console.error('Invalid URL:', url)
  }
}

// Intercept all navigation requests
app.on('web-contents-created', (event, contents) => {
  // Intercept new window creation
  contents.setWindowOpenHandler(({ url }) => {
    safeOpenExternal(url)
    return { action: 'deny' } // Prevent creating new window
  })

  // Intercept navigation
  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    const currentUrl = new URL(contents.getURL())

    // If external link, prevent navigation and open in browser
    if (parsedUrl.origin !== currentUrl.origin) {
      event.preventDefault()
      safeOpenExternal(url)
    }
  })
})
```

## Application Packaging and Distribution

### Packaging with electron-builder

```bash
# Install electron-builder
npm install electron-builder --save-dev

# Package for all platforms
npm run package

# Package for specific platform
npm run package:mac
npm run package:win
npm run package:linux
```

### Advanced Packaging Configuration

```json
// package.json build configuration
{
  "build": {
    "appId": "com.example.myapp",
    "productName": "My App",
    "copyright": "Copyright 2024 Your Company",

    "directories": {
      "output": "release/${version}"
    },

    "files": [
      "out/**/*",
      "resources/**/*",
      "!**/*.map"
    ],

    "extraResources": [
      {
        "from": "assets/",
        "to": "assets/",
        "filter": ["**/*"]
      }
    ],

    "mac": {
      "category": "public.app-category.productivity",
      "target": [
        { "target": "dmg", "arch": ["x64", "arm64"] },
        { "target": "zip", "arch": ["x64", "arm64"] }
      ],
      "icon": "resources/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },

    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64", "ia32"] },
        { "target": "portable", "arch": ["x64"] }
      ],
      "icon": "resources/icon.ico",
      "publisherName": "Your Company"
    },

    "linux": {
      "target": [
        { "target": "AppImage", "arch": ["x64"] },
        { "target": "deb", "arch": ["x64"] },
        { "target": "rpm", "arch": ["x64"] }
      ],
      "icon": "resources/icons",
      "category": "Development"
    },

    "nsis": {
      "oneClick": false,
      "perMachine": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "installerIcon": "resources/installer.ico",
      "uninstallerIcon": "resources/uninstaller.ico"
    },

    "dmg": {
      "contents": [
        { "x": 130, "y": 220 },
        { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
      ],
      "background": "resources/dmg-background.png"
    }
  }
}
```

### Code Signing

```xml
<!-- macOS Code Signing Configuration -->
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.debugger</key>
    <true/>
  </dict>
</plist>
```

Environment variables for CI/CD:
- `CSC_LINK`: Base64-encoded .p12 certificate
- `CSC_KEY_PASSWORD`: Certificate password
- `APPLE_ID`: Apple ID
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Team ID

## Auto Updates

### Configuring electron-updater

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import log from 'electron-log'

// Configure logging
autoUpdater.logger = log
log.transports.file.level = 'info'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // Disable auto-download, let user confirm first
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Checking for updates
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
    mainWindow.webContents.send('update:checking')
  })

  // Update available
  autoUpdater.on('update-available', (info) => {
    log.info('New version found:', info.version)
    mainWindow.webContents.send('update:available', info)

    // Ask user if they want to download
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `Version ${info.version} is available. Download now?`,
        buttons: ['Download Now', 'Remind Me Later'],
        defaultId: 0
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  // No update available
  autoUpdater.on('update-not-available', () => {
    log.info('Already on latest version')
    mainWindow.webContents.send('update:not-available')
  })

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    const message = `Download speed: ${formatBytes(progress.bytesPerSecond)}/s - ${Math.round(progress.percent)}%`
    log.info(message)
    mainWindow.webContents.send('update:progress', progress)
  })

  // Download complete
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded')
    mainWindow.webContents.send('update:downloaded', info)

    // Ask user if they want to install now
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Install Update',
        message: 'Update downloaded. Install and restart now?',
        buttons: ['Install Now', 'Install Later'],
        defaultId: 0
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  // Error handling
  autoUpdater.on('error', (error) => {
    log.error('Update error:', error)
    mainWindow.webContents.send('update:error', error.message)
  })
}

// Manually check for updates
export function checkForUpdates(): void {
  autoUpdater.checkForUpdates()
}

// Format bytes helper
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
```

### Publish Configuration

```json
// package.json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "your-username",
        "repo": "your-repo",
        "releaseType": "release"
      }
    ]
  }
}
```

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and publish
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          CSC_LINK: ${{ secrets.MAC_CERTS }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTS_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run publish
```

### Displaying Update Status in Renderer

```tsx
// src/renderer/src/components/UpdateStatus.tsx
import React, { useEffect, useState } from 'react'

interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

const UpdateStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('')
  const [progress, setProgress] = useState<UpdateProgress | null>(null)

  useEffect(() => {
    const cleanup1 = window.electronAPI.onUpdateChecking(() => {
      setStatus('Checking for updates...')
    })

    const cleanup2 = window.electronAPI.onUpdateAvailable((info) => {
      setStatus(`New version available: ${info.version}`)
    })

    const cleanup3 = window.electronAPI.onUpdateProgress((prog) => {
      setProgress(prog)
      setStatus('Downloading update...')
    })

    const cleanup4 = window.electronAPI.onUpdateDownloaded(() => {
      setStatus('Update downloaded, ready to install')
      setProgress(null)
    })

    const cleanup5 = window.electronAPI.onUpdateError((error) => {
      setStatus(`Update error: ${error}`)
    })

    return () => {
      cleanup1()
      cleanup2()
      cleanup3()
      cleanup4()
      cleanup5()
    }
  }, [])

  if (!status) return null

  return (
    <div className="update-status">
      <span>{status}</span>
      {progress && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default UpdateStatus
```

## Interview Key Points

### Core Concepts

**Q1: What are the differences between main process and renderer process?**

```
Main Process:
- Only one per application
- Full access to Node.js API
- Manages all windows and system-level operations
- Can use native APIs (menus, tray, dialogs, etc.)

Renderer Process:
- Each window runs in its own renderer process
- Essentially a Chromium web page
- Cannot directly access Node.js API by default
- Communicates with main process via IPC
```

**Q2: What is contextIsolation, and why should it be enabled?**

```javascript
// contextIsolation separates preload script from renderer's JavaScript context
// This prevents malicious code from tampering with Electron APIs

// Risk without contextIsolation:
// Any third-party scripts in renderer can access preload script variables
window.myAPI = { dangerous: true }  // Can be modified by third-party scripts

// With contextIsolation enabled:
// Use contextBridge to safely expose APIs
contextBridge.exposeInMainWorld('myAPI', {
  safeMethod: () => { /* ... */ }
})
// Third-party scripts cannot modify window.myAPI
```

**Q3: What are the IPC communication patterns? When to use which?**

```typescript
// 1. ipcRenderer.send + ipcMain.on (one-way, no response needed)
// Use for: logging, status notifications where no return value needed
ipcRenderer.send('log', 'message')
ipcMain.on('log', (event, message) => console.log(message))

// 2. ipcRenderer.invoke + ipcMain.handle (two-way, recommended)
// Use for: most scenarios requiring return values
const result = await ipcRenderer.invoke('getData')
ipcMain.handle('getData', async () => { return data })

// 3. webContents.send + ipcRenderer.on (main pushes to renderer)
// Use for: main process notifying renderer
mainWindow.webContents.send('update', data)
ipcRenderer.on('update', (event, data) => { /* ... */ })
```

### Performance Optimization

**Q4: How to optimize Electron application startup speed?**

```typescript
// 1. Lazy load non-critical modules
// Don't load all modules at startup
const heavyModule = await import('./heavyModule')

// 2. Use ready-to-show event to avoid white flash
mainWindow = new BrowserWindow({ show: false })
mainWindow.once('ready-to-show', () => mainWindow.show())

// 3. Preload critical resources
// Cache frequently used data locally

// 4. Reduce bundle size
// Exclude unnecessary node_modules

// 5. Consider V8 snapshots
// electron-builder supports V8 snapshots for faster startup
```

**Q5: How to reduce Electron application memory usage?**

```typescript
// 1. Manage window count wisely
// Close unneeded windows, don't just hide them

// 2. Use webContents.setBackgroundThrottling
mainWindow.webContents.setBackgroundThrottling(true)

// 3. Clean up event listeners promptly
// Remove listeners when components unmount

// 4. Use virtual lists for large datasets
// Only render visible elements

// 5. Avoid memory leaks
// Watch for closure references
// Clean up timers and event listeners
```

### Security Related

**Q6: What are Electron security best practices?**

```typescript
// 1. Disable nodeIntegration
nodeIntegration: false

// 2. Enable contextIsolation
contextIsolation: true

// 3. Use preload scripts to expose safe APIs
// Don't expose native Node.js modules

// 4. Set Content Security Policy
// Restrict executable script sources

// 5. Validate all IPC messages
// Check message source and data format

// 6. Don't use shell.openExternal with untrusted URLs
// Validate URL protocol

// 7. Only disable webSecurity in development
// Must be enabled in production

// 8. Regularly update Electron version
// Fix known security vulnerabilities
```

### Common Questions

**Q7: How to handle Electron application crashes?**

```typescript
import { app, crashReporter } from 'electron'

// Enable crash reporting
crashReporter.start({
  productName: 'MyApp',
  companyName: 'MyCompany',
  submitURL: 'https://your-crash-server.com/submit',
  uploadToServer: true
})

// Listen for renderer process crash
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Renderer process crashed:', details.reason)
  // Can attempt to recreate window
})

// Listen for GPU process crash
app.on('child-process-gone', (event, details) => {
  console.error('Child process crashed:', details.type, details.reason)
})
```

**Q8: Differences between Electron and Tauri?**

| Feature | Electron | Tauri |
|---------|----------|-------|
| Tech Stack | Chromium + Node.js | System WebView + Rust |
| Bundle Size | Large (~150MB+) | Small (~10MB) |
| Memory Usage | Higher | Lower |
| Ecosystem | Mature, rich | Growing |
| Learning Curve | Lower (web tech) | Higher (requires Rust) |
| Cross-platform Consistency | High (bundled Chromium) | Depends on system WebView |

### Practical Tips

**Q9: How to implement communication between multiple windows?**

```typescript
// Method 1: Route through main process
// Window A sends message
ipcRenderer.send('window:message', { to: 'windowB', data: 'hello' })

// Main process forwards
ipcMain.on('window:message', (event, { to, data }) => {
  const targetWindow = windowManager.getWindow(to)
  if (targetWindow) {
    targetWindow.webContents.send('window:message', data)
  }
})

// Method 2: Use MessagePort
// Main process creates channel
const { port1, port2 } = new MessageChannelMain()
windowA.webContents.postMessage('port', null, [port1])
windowB.webContents.postMessage('port', null, [port2])

// Renderer process uses port
ipcRenderer.on('port', (event) => {
  const port = event.ports[0]
  port.onmessage = (e) => console.log(e.data)
  port.postMessage('hello')
})
```

**Q10: How to debug Electron applications?**

```typescript
// 1. Renderer process debugging
mainWindow.webContents.openDevTools()

// 2. Main process debugging
// Add --inspect or --inspect-brk to startup command
// electron --inspect=5858 .
// Then open chrome://inspect in Chrome

// 3. Install DevTools extensions using electron-devtools-installer
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'

app.whenReady().then(async () => {
  if (process.env.NODE_ENV === 'development') {
    await installExtension(REACT_DEVELOPER_TOOLS)
  }
})

// 4. Use electron-log for logging
import log from 'electron-log'
log.info('Application started')
log.error('Error message', error)
```

## Summary

Electron provides web developers a fast path to building cross-platform desktop applications. Mastering Electron development requires understanding:

1. **Multi-process architecture**: Main process handles system interactions, renderer process handles UI display
2. **IPC communication**: Use `invoke/handle` pattern for secure inter-process communication
3. **Security practices**: Enable `contextIsolation`, disable `nodeIntegration`, validate all inputs
4. **Performance optimization**: Lazy loading, proper window management, avoid memory leaks
5. **Packaging and distribution**: Use `electron-builder` for multi-platform packaging and auto-updates

While Electron applications have larger bundle sizes and memory footprints, its mature ecosystem, rich native APIs, and consistent cross-platform experience make it a reliable choice for building complex desktop applications. For scenarios requiring minimal size and maximum performance, alternatives like Tauri are worth considering.
