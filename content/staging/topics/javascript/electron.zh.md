---
title: Electron 桌面应用开发指南
description: 掌握Electron框架，使用Web技术构建跨平台桌面应用
track: javascript
section: node
difficulty: intermediate
tags:
  - Electron
  - 桌面应用
  - 跨平台
  - Node.js
status: imported
origin: old/src/content/docs/frontend/electron.zh.md
divergence: 0.2
issues: []
legacy:
  category: Frontend
  subcategory: Desktop
  order: 28
  lastUpdated: 2026-01-07
---

Electron 是由 GitHub 开发的开源框架，它允许开发者使用 Web 技术（HTML、CSS、JavaScript）构建跨平台的桌面应用程序。Visual Studio Code、Slack、Discord、Notion 等知名应用都是使用 Electron 构建的。本文将深入探讨 Electron 的核心概念、开发技巧和最佳实践。

## Electron 架构解析

### 双进程架构

Electron 采用多进程架构，主要由两种类型的进程组成：

```
┌─────────────────────────────────────────────────────────┐
│                    Electron 应用                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              主进程 (Main Process)                │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │  • Node.js 完整 API                      │    │   │
│  │  │  • 操作系统原生 API                       │    │   │
│  │  │  • 窗口管理 (BrowserWindow)              │    │   │
│  │  │  • 应用生命周期管理                       │    │   │
│  │  │  • 系统托盘、菜单、对话框                  │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                     IPC 通信                            │
│                          │                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │           渲染进程 (Renderer Process)            │   │
│  │  ┌───────────────┐  ┌───────────────┐          │   │
│  │  │   窗口 1      │  │   窗口 2      │          │   │
│  │  │  Chromium     │  │  Chromium     │          │   │
│  │  │  HTML/CSS/JS  │  │  HTML/CSS/JS  │          │   │
│  │  └───────────────┘  └───────────────┘          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 主进程（Main Process）

主进程是应用的入口点，负责管理所有窗口和系统级交互：

```javascript
// main.js - 主进程入口
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// 保持窗口对象的全局引用，防止被垃圾回收
let mainWindow = null

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 预加载脚本，在渲染进程加载前执行
      preload: path.join(__dirname, 'preload.js'),
      // 禁用 Node.js 集成（安全考虑）
      nodeIntegration: false,
      // 启用上下文隔离（安全考虑）
      contextIsolation: true,
      // 禁用远程模块（已废弃）
      enableRemoteModule: false
    }
  })

  // 加载应用页面
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
  }

  // 窗口关闭时清理引用
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用就绪时创建窗口
app.whenReady().then(createWindow)

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS 点击 dock 图标时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
```

### 渲染进程（Renderer Process）

每个窗口运行在独立的渲染进程中，本质上是一个 Chromium 网页：

```html
<!-- index.html - 渲染进程页面 -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self'">
  <title>我的 Electron 应用</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>欢迎使用 Electron</h1>
    <button id="openFile">打开文件</button>
    <div id="content"></div>
  </div>
  <script src="renderer.js"></script>
</body>
</html>
```

### 预加载脚本（Preload Script）

预加载脚本是主进程和渲染进程之间的桥梁，在渲染进程加载前执行：

```javascript
// preload.js - 预加载脚本
const { contextBridge, ipcRenderer } = require('electron')

// 使用 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content) => ipcRenderer.invoke('dialog:saveFile', content),

  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // 事件监听
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update:available', (event, info) => callback(info))
  },

  // 移除监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// 暴露版本信息
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})
```

## 项目配置与构建

### 项目初始化

使用 `electron-forge` 快速创建项目：

```bash
# 使用 electron-forge 创建项目
npx create-electron-app my-electron-app --template=webpack-typescript

# 或使用 electron-vite 创建项目（推荐）
npm create electron-vite@latest my-app

# 进入项目目录
cd my-electron-app

# 安装依赖
npm install
```

### 项目结构

```
my-electron-app/
├── package.json
├── electron.vite.config.ts    # Vite 配置
├── tsconfig.json
├── src/
│   ├── main/                  # 主进程代码
│   │   ├── index.ts
│   │   └── ipc/
│   │       ├── fileHandlers.ts
│   │       └── windowHandlers.ts
│   ├── preload/               # 预加载脚本
│   │   └── index.ts
│   └── renderer/              # 渲染进程代码
│       ├── index.html
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── components/
│       └── assets/
├── resources/                  # 应用资源
│   └── icon.png
└── build/                      # 构建配置
    └── entitlements.mac.plist
```

### package.json 配置

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "一个 Electron 桌面应用",
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

### Vite 配置

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

## 窗口管理

### 创建多窗口

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

    // 获取主显示器
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    const win = new BrowserWindow({
      width,
      height,
      x: Math.floor((screenWidth - width) / 2),
      y: Math.floor((screenHeight - height) / 2),
      title,
      show: false, // 先隐藏，等加载完成再显示
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // 加载完成后再显示窗口，避免白屏闪烁
    win.once('ready-to-show', () => {
      if (show) {
        win.show()
      }
    })

    // 窗口关闭时从 Map 中移除
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

  // 创建模态窗口
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

### 无边框窗口与自定义标题栏

```typescript
// 创建无边框窗口
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  frame: false, // 无边框
  titleBarStyle: 'hidden', // macOS 隐藏标题栏但保留交通灯
  titleBarOverlay: {
    // Windows 自定义标题栏覆盖
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
// 渲染进程中的自定义标题栏组件
// src/renderer/src/components/TitleBar.tsx
import React from 'react'
import './TitleBar.css'

const TitleBar: React.FC = () => {
  const handleMinimize = () => window.electronAPI.minimizeWindow()
  const handleMaximize = () => window.electronAPI.maximizeWindow()
  const handleClose = () => window.electronAPI.closeWindow()

  return (
    <div className="title-bar">
      {/* 可拖拽区域 */}
      <div className="drag-region">
        <span className="app-title">My App</span>
      </div>

      {/* 窗口控制按钮 */}
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
  -webkit-app-region: drag; /* 整个标题栏可拖拽 */
}

.drag-region {
  flex: 1;
  padding-left: 12px;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag; /* 按钮区域不可拖拽 */
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

## IPC 进程间通信

### 通信模式概览

Electron 提供了多种 IPC 通信模式：

| 模式 | 方向 | API | 特点 |
|------|------|-----|------|
| 单向（渲染 -> 主）| Renderer -> Main | `ipcRenderer.send` / `ipcMain.on` | 不等待响应 |
| 双向（渲染 <-> 主）| Renderer <-> Main | `ipcRenderer.invoke` / `ipcMain.handle` | Promise 形式，推荐使用 |
| 单向（主 -> 渲染）| Main -> Renderer | `webContents.send` / `ipcRenderer.on` | 主进程主动推送 |

### 双向通信（推荐）

```typescript
// src/main/ipc/fileHandlers.ts
import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export function setupFileHandlers(): void {
  // 打开文件对话框
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

  // 保存文件
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

  // 读取目录
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

// 定义暴露给渲染进程的 API 类型
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
      alert(`文件已保存: ${result.path}`)
    } else if (!result.canceled) {
      alert(`保存失败: ${result.error}`)
    }
  }

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={handleOpenFile}>打开文件</button>
        <button onClick={handleSaveFile}>保存文件</button>
        {fileName && <span>当前文件: {fileName}</span>}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="在此输入内容..."
      />
    </div>
  )
}

export default App
```

### 主进程向渲染进程推送消息

```typescript
// src/main/index.ts
import { BrowserWindow } from 'electron'

// 向特定窗口发送消息
function sendToWindow(win: BrowserWindow, channel: string, data: any): void {
  if (!win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

// 向所有窗口广播消息
function broadcast(channel: string, data: any): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    sendToWindow(win, channel, data)
  })
}

// 示例：定时向窗口发送系统状态
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
  // ... 其他 API

  // 监听主进程消息
  onMemoryUpdate: (callback: (data: { heapUsed: number; heapTotal: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on('system:memory', handler)

    // 返回清理函数
    return () => {
      ipcRenderer.removeListener('system:memory', handler)
    }
  }
})
```

```tsx
// 渲染进程中使用
import { useEffect, useState } from 'react'

function SystemStatus() {
  const [memory, setMemory] = useState({ heapUsed: 0, heapTotal: 0 })

  useEffect(() => {
    // 设置监听器
    const cleanup = window.electronAPI.onMemoryUpdate(setMemory)

    // 组件卸载时清理
    return cleanup
  }, [])

  return (
    <div>
      内存使用: {memory.heapUsed}MB / {memory.heapTotal}MB
    </div>
  )
}
```

## 原生 API

### 应用菜单

```typescript
// src/main/menu.ts
import { Menu, app, shell, BrowserWindow, MenuItemConstructorOptions } from 'electron'

export function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // macOS 应用菜单
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const, label: '关于' },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const, label: '隐藏' },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const, label: '退出' }
            ]
          }
        ]
      : []),

    // 文件菜单
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const win = BrowserWindow.getFocusedWindow()
            win?.webContents.send('menu:newFile')
          }
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const win = BrowserWindow.getFocusedWindow()
            win?.webContents.send('menu:openFile')
          }
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const win = BrowserWindow.getFocusedWindow()
            win?.webContents.send('menu:saveFile')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: '关闭窗口' } : { role: 'quit', label: '退出' }
      ]
    },

    // 编辑菜单
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },

    // 视图菜单
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },

    // 帮助菜单
    {
      label: '帮助',
      submenu: [
        {
          label: '文档',
          click: async () => {
            await shell.openExternal('https://electronjs.org')
          }
        },
        {
          label: '报告问题',
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

### 系统托盘

```typescript
// src/main/tray.ts
import { Tray, Menu, app, nativeImage, BrowserWindow } from 'electron'
import path from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): Tray {
  // 创建托盘图标
  const iconPath = path.join(__dirname, '../../resources/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  // 在 macOS 上使用模板图标（自动适应深色/浅色模式）
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true)
  }

  tray = new Tray(icon)
  tray.setToolTip('My Electron App')

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    {
      label: '隐藏到托盘',
      click: () => {
        mainWindow.hide()
      }
    },
    { type: 'separator' },
    {
      label: '设置',
      submenu: [
        {
          label: '开机启动',
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
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // 点击托盘图标时显示窗口
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

// 更新托盘图标（例如显示未读消息数）
export function updateTrayIcon(count: number): void {
  if (!tray) return

  if (count > 0) {
    // 显示角标数字（macOS）
    app.dock?.setBadge(count > 99 ? '99+' : String(count))
    tray.setTitle(` ${count}`)
  } else {
    app.dock?.setBadge('')
    tray.setTitle('')
  }
}
```

### 系统通知

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

  // 检查系统是否支持通知
  if (!Notification.isSupported()) {
    console.warn('系统不支持通知')
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

// 使用示例
export function notifyDownloadComplete(fileName: string, filePath: string): void {
  showNotification({
    title: '下载完成',
    body: `文件 ${fileName} 已下载完成`,
    icon: path.join(__dirname, '../../resources/download-icon.png'),
    onClick: () => {
      // 在文件管理器中显示文件
      require('electron').shell.showItemInFolder(filePath)
    }
  })
}
```

## 文件系统访问

### 安全的文件操作

```typescript
// src/main/ipc/fileSystem.ts
import { ipcMain, app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

// 定义允许访问的目录
const ALLOWED_PATHS = [
  app.getPath('documents'),
  app.getPath('downloads'),
  app.getPath('temp'),
  app.getPath('userData')
]

// 验证路径是否在允许的目录内
function isPathAllowed(targetPath: string): boolean {
  const normalizedPath = path.normalize(targetPath)
  return ALLOWED_PATHS.some((allowedPath) => normalizedPath.startsWith(allowedPath))
}

export function setupFileSystemHandlers(): void {
  // 读取文件
  ipcMain.handle('fs:read', async (event, filePath: string) => {
    if (!isPathAllowed(filePath)) {
      throw new Error('访问被拒绝：路径不在允许范围内')
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 写入文件
  ipcMain.handle('fs:write', async (event, filePath: string, content: string) => {
    if (!isPathAllowed(filePath)) {
      throw new Error('访问被拒绝：路径不在允许范围内')
    }

    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除文件
  ipcMain.handle('fs:delete', async (event, filePath: string) => {
    if (!isPathAllowed(filePath)) {
      throw new Error('访问被拒绝：路径不在允许范围内')
    }

    try {
      await fs.unlink(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取应用数据路径
  ipcMain.handle('app:getPath', (event, name: string) => {
    const validNames = ['home', 'appData', 'userData', 'temp', 'documents', 'downloads']
    if (!validNames.includes(name)) {
      throw new Error(`无效的路径名: ${name}`)
    }
    return app.getPath(name as any)
  })
}
```

### 文件拖放处理

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 获取拖放文件的路径
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // 处理拖放的文件
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
        <p>拖放文件到此处</p>
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

## 安全最佳实践

### 安全检查清单

```typescript
// 安全配置示例
const secureWindowConfig = {
  webPreferences: {
    // 1. 禁用 Node.js 集成
    nodeIntegration: false,

    // 2. 启用上下文隔离
    contextIsolation: true,

    // 3. 禁用远程模块
    enableRemoteModule: false,

    // 4. 使用预加载脚本
    preload: path.join(__dirname, 'preload.js'),

    // 5. 启用沙盒模式
    sandbox: true,

    // 6. 禁用 webview 标签
    webviewTag: false
  }
}
```

### 内容安全策略（CSP）

```html
<!-- 在 HTML 中设置 CSP -->
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
// 或在主进程中动态设置
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

### 验证 IPC 消息

```typescript
// src/main/ipc/validation.ts
import { ipcMain, BrowserWindow } from 'electron'

// 验证消息来源
function validateSender(event: Electron.IpcMainInvokeEvent): boolean {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return false

  // 验证 URL
  const url = new URL(event.sender.getURL())
  const allowedOrigins = ['http://localhost:3000', 'file://']

  return allowedOrigins.some(
    (origin) => url.origin === origin || url.protocol === 'file:'
  )
}

// 安全的 IPC 处理器
ipcMain.handle('secure:action', async (event, data) => {
  // 验证发送者
  if (!validateSender(event)) {
    throw new Error('非法的消息来源')
  }

  // 验证数据
  if (typeof data !== 'object' || !data) {
    throw new Error('无效的数据格式')
  }

  // 执行操作...
})
```

### 安全地打开外部链接

```typescript
// src/main/index.ts
import { shell, app } from 'electron'

// 安全地处理外部链接
function safeOpenExternal(url: string): void {
  try {
    const parsedUrl = new URL(url)

    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.warn(`阻止打开不安全的协议: ${parsedUrl.protocol}`)
      return
    }

    shell.openExternal(url)
  } catch (error) {
    console.error('无效的 URL:', url)
  }
}

// 拦截所有导航请求
app.on('web-contents-created', (event, contents) => {
  // 拦截新窗口
  contents.setWindowOpenHandler(({ url }) => {
    safeOpenExternal(url)
    return { action: 'deny' } // 阻止创建新窗口
  })

  // 拦截导航
  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    const currentUrl = new URL(contents.getURL())

    // 如果是外部链接，阻止导航并在浏览器中打开
    if (parsedUrl.origin !== currentUrl.origin) {
      event.preventDefault()
      safeOpenExternal(url)
    }
  })
})
```

## 应用打包与分发

### 使用 electron-builder 打包

```bash
# 安装 electron-builder
npm install electron-builder --save-dev

# 打包所有平台
npm run package

# 打包特定平台
npm run package:mac
npm run package:win
npm run package:linux
```

### 高级打包配置

```json
// package.json 中的 build 配置
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

### 代码签名

```typescript
// macOS 代码签名配置
// build/entitlements.mac.plist
`<?xml version="1.0" encoding="UTF-8"?>
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
</plist>`

// 环境变量配置（用于 CI/CD）
// CSC_LINK: base64 编码的 .p12 证书
// CSC_KEY_PASSWORD: 证书密码
// APPLE_ID: Apple ID
// APPLE_APP_SPECIFIC_PASSWORD: 应用专用密码
// APPLE_TEAM_ID: 团队 ID
```

## 自动更新

### 配置 electron-updater

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import log from 'electron-log'

// 配置日志
autoUpdater.logger = log
log.transports.file.level = 'info'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // 禁用自动下载，让用户确认后再下载
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // 检查更新
  autoUpdater.on('checking-for-update', () => {
    log.info('正在检查更新...')
    mainWindow.webContents.send('update:checking')
  })

  // 有可用更新
  autoUpdater.on('update-available', (info) => {
    log.info('发现新版本:', info.version)
    mainWindow.webContents.send('update:available', info)

    // 询问用户是否下载
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: '发现新版本',
        message: `发现新版本 ${info.version}，是否立即下载？`,
        buttons: ['立即下载', '稍后提醒'],
        defaultId: 0
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  // 没有可用更新
  autoUpdater.on('update-not-available', () => {
    log.info('当前已是最新版本')
    mainWindow.webContents.send('update:not-available')
  })

  // 下载进度
  autoUpdater.on('download-progress', (progress) => {
    const message = `下载速度: ${formatBytes(progress.bytesPerSecond)}/s - ${Math.round(progress.percent)}%`
    log.info(message)
    mainWindow.webContents.send('update:progress', progress)
  })

  // 下载完成
  autoUpdater.on('update-downloaded', (info) => {
    log.info('更新已下载完成')
    mainWindow.webContents.send('update:downloaded', info)

    // 询问用户是否立即安装
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: '安装更新',
        message: '更新已下载完成，是否立即安装并重启应用？',
        buttons: ['立即安装', '稍后安装'],
        defaultId: 0
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  // 错误处理
  autoUpdater.on('error', (error) => {
    log.error('更新错误:', error)
    mainWindow.webContents.send('update:error', error.message)
  })
}

// 手动检查更新
export function checkForUpdates(): void {
  autoUpdater.checkForUpdates()
}

// 格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
```

### 发布配置

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

### 渲染进程中显示更新状态

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
      setStatus('正在检查更新...')
    })

    const cleanup2 = window.electronAPI.onUpdateAvailable((info) => {
      setStatus(`发现新版本: ${info.version}`)
    })

    const cleanup3 = window.electronAPI.onUpdateProgress((prog) => {
      setProgress(prog)
      setStatus('正在下载更新...')
    })

    const cleanup4 = window.electronAPI.onUpdateDownloaded(() => {
      setStatus('更新已下载，等待安装')
      setProgress(null)
    })

    const cleanup5 = window.electronAPI.onUpdateError((error) => {
      setStatus(`更新错误: ${error}`)
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

## 面试要点

### 核心概念

**Q1: Electron 的主进程和渲染进程有什么区别？**

```
主进程（Main Process）：
- 每个应用只有一个主进程
- 可以访问完整的 Node.js API
- 负责管理所有窗口和系统级操作
- 可以使用原生 API（菜单、托盘、对话框等）

渲染进程（Renderer Process）：
- 每个窗口运行在独立的渲染进程中
- 本质上是一个 Chromium 网页
- 默认情况下不能直接访问 Node.js API
- 通过 IPC 与主进程通信
```

**Q2: 什么是 contextIsolation，为什么要启用它？**

```javascript
// contextIsolation 将预加载脚本与渲染进程的 JavaScript 环境隔离
// 这样可以防止恶意代码篡改 Electron API

// 不启用 contextIsolation 的风险：
// 渲染进程中加载的任何第三方脚本都可以访问预加载脚本中的变量
window.myAPI = { dangerous: true }  // 可被第三方脚本修改

// 启用 contextIsolation 后：
// 使用 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('myAPI', {
  safeMethod: () => { /* ... */ }
})
// 第三方脚本无法修改 window.myAPI
```

**Q3: IPC 通信有哪些模式？什么时候使用哪种？**

```typescript
// 1. ipcRenderer.send + ipcMain.on（单向，不需要响应）
// 适用于：日志记录、状态通知等不需要返回值的场景
ipcRenderer.send('log', 'message')
ipcMain.on('log', (event, message) => console.log(message))

// 2. ipcRenderer.invoke + ipcMain.handle（双向，推荐）
// 适用于：大多数需要返回值的场景
const result = await ipcRenderer.invoke('getData')
ipcMain.handle('getData', async () => { return data })

// 3. webContents.send + ipcRenderer.on（主进程主动推送）
// 适用于：主进程通知渲染进程的场景
mainWindow.webContents.send('update', data)
ipcRenderer.on('update', (event, data) => { /* ... */ })
```

### 性能优化

**Q4: 如何优化 Electron 应用的启动速度？**

```typescript
// 1. 延迟加载非关键模块
// 不要在启动时加载所有模块
const heavyModule = await import('./heavyModule')

// 2. 使用 ready-to-show 事件避免白屏
mainWindow = new BrowserWindow({ show: false })
mainWindow.once('ready-to-show', () => mainWindow.show())

// 3. 预加载关键资源
// 将常用数据缓存到本地

// 4. 使用更小的打包体积
// 排除不必要的 node_modules

// 5. 考虑使用 V8 快照
// electron-builder 支持 V8 快照加速启动
```

**Q5: 如何减少 Electron 应用的内存占用？**

```typescript
// 1. 合理管理窗口数量
// 关闭不需要的窗口，而不是隐藏

// 2. 使用 webContents.setBackgroundThrottling
mainWindow.webContents.setBackgroundThrottling(true)

// 3. 及时清理事件监听器
// 组件卸载时移除监听器

// 4. 使用虚拟列表渲染大量数据
// 只渲染可见区域的元素

// 5. 避免内存泄漏
// 注意闭包中的引用
// 清理定时器和事件监听器
```

### 安全相关

**Q6: Electron 应用的安全最佳实践有哪些？**

```typescript
// 1. 禁用 nodeIntegration
nodeIntegration: false

// 2. 启用 contextIsolation
contextIsolation: true

// 3. 使用预加载脚本暴露安全的 API
// 不要暴露 Node.js 原生模块

// 4. 设置 Content Security Policy
// 限制可执行的脚本来源

// 5. 验证所有 IPC 消息
// 检查消息来源和数据格式

// 6. 不要使用 shell.openExternal 打开不可信的 URL
// 验证 URL 协议

// 7. 禁用 webSecurity 仅在开发环境
// 生产环境必须启用

// 8. 定期更新 Electron 版本
// 修复已知的安全漏洞
```

### 常见问题

**Q7: 如何处理 Electron 应用的崩溃？**

```typescript
import { app, crashReporter } from 'electron'

// 启用崩溃报告
crashReporter.start({
  productName: 'MyApp',
  companyName: 'MyCompany',
  submitURL: 'https://your-crash-server.com/submit',
  uploadToServer: true
})

// 监听渲染进程崩溃
app.on('render-process-gone', (event, webContents, details) => {
  console.error('渲染进程崩溃:', details.reason)
  // 可以尝试重新创建窗口
})

// 监听 GPU 进程崩溃
app.on('child-process-gone', (event, details) => {
  console.error('子进程崩溃:', details.type, details.reason)
})
```

**Q8: Electron 与 Tauri 的区别？**

| 特性 | Electron | Tauri |
|------|----------|-------|
| 技术栈 | Chromium + Node.js | 系统 WebView + Rust |
| 打包体积 | 较大（~150MB+） | 较小（~10MB） |
| 内存占用 | 较高 | 较低 |
| 生态系统 | 成熟，丰富 | 发展中 |
| 学习曲线 | 较低（Web 技术） | 较高（需要 Rust） |
| 跨平台一致性 | 高（自带 Chromium） | 依赖系统 WebView |

### 实战技巧

**Q9: 如何实现多窗口间的通信？**

```typescript
// 方法 1: 通过主进程中转
// 窗口 A 发送消息
ipcRenderer.send('window:message', { to: 'windowB', data: 'hello' })

// 主进程转发
ipcMain.on('window:message', (event, { to, data }) => {
  const targetWindow = windowManager.getWindow(to)
  if (targetWindow) {
    targetWindow.webContents.send('window:message', data)
  }
})

// 方法 2: 使用 MessagePort
// 主进程创建通道
const { port1, port2 } = new MessageChannelMain()
windowA.webContents.postMessage('port', null, [port1])
windowB.webContents.postMessage('port', null, [port2])

// 渲染进程使用
ipcRenderer.on('port', (event) => {
  const port = event.ports[0]
  port.onmessage = (e) => console.log(e.data)
  port.postMessage('hello')
})
```

**Q10: 如何调试 Electron 应用？**

```typescript
// 1. 渲染进程调试
mainWindow.webContents.openDevTools()

// 2. 主进程调试
// 启动命令添加 --inspect 或 --inspect-brk
// electron --inspect=5858 .
// 然后在 Chrome 中打开 chrome://inspect

// 3. 使用 electron-devtools-installer 安装扩展
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'

app.whenReady().then(async () => {
  if (process.env.NODE_ENV === 'development') {
    await installExtension(REACT_DEVELOPER_TOOLS)
  }
})

// 4. 使用 electron-log 记录日志
import log from 'electron-log'
log.info('应用启动')
log.error('错误信息', error)
```

## 总结

Electron 为 Web 开发者提供了一条快速构建跨平台桌面应用的途径。掌握 Electron 开发需要理解：

1. **双进程架构**：主进程负责系统交互，渲染进程负责 UI 展示
2. **IPC 通信**：使用 `invoke/handle` 模式进行安全的进程间通信
3. **安全实践**：启用 `contextIsolation`，禁用 `nodeIntegration`，验证所有输入
4. **性能优化**：延迟加载、合理管理窗口、避免内存泄漏
5. **打包分发**：使用 `electron-builder` 进行多平台打包和自动更新

虽然 Electron 应用的体积和内存占用较大，但其成熟的生态系统、丰富的原生 API 和一致的跨平台体验，使其成为构建复杂桌面应用的可靠选择。对于追求极致体积和性能的场景，可以考虑 Tauri 等替代方案。
