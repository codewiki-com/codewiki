---
title: 文件上传处理
description: 学习安全高效的文件上传实现
track: backend
section: http-apis
difficulty: intermediate
tags:
  - 文件上传
  - S3
  - 流处理
  - 安全
status: imported
origin: old/src/content/docs/backend/file-upload.zh.md
divergence: 0.218
issues:
  - title-lang-en
  - title-language
legacy:
  category: Backend
  subcategory: Features
  order: 34
  lastUpdated: 2026-01-07
---

## 概念解释

文件上传是 Web 应用中最常见的功能之一，涉及从客户端接收文件数据并将其存储到服务器或云存储服务中。一个健壮的文件上传系统需要考虑多方面因素：安全性、性能、可扩展性和用户体验。

### 文件上传的核心挑战

文件上传看似简单，但实际开发中面临诸多挑战：

- **安全威胁**：恶意文件上传、路径遍历攻击、文件类型伪造
- **性能问题**：大文件上传超时、内存溢出、带宽占用
- **可靠性**：网络中断后的断点续传、上传进度跟踪
- **存储管理**：存储容量规划、文件去重、生命周期管理

### 文件上传的工作流程

```
客户端                    服务器                     存储服务
  │                         │                          │
  │  1. 选择文件            │                          │
  │  2. 表单验证            │                          │
  │  3. 发起请求 ─────────> │                          │
  │                         │  4. 接收数据              │
  │                         │  5. 验证文件              │
  │                         │  6. 病毒扫描              │
  │                         │  7. 处理/转码             │
  │                         │  8. 上传存储 ────────────>│
  │                         │                          │  9. 存储文件
  │                         │  10. 保存元数据 <─────────│
  │  11. 返回结果 <─────────│                          │
  │                         │                          │
```

## Multipart 上传详解

### 什么是 Multipart/form-data

Multipart/form-data 是 HTTP 协议中用于上传文件的编码类型。它将表单数据分割成多个部分（parts），每个部分包含一个字段的数据。

```http
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="title"

文档标题
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

(二进制文件数据)
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### 使用 Multer 处理文件上传（Node.js）

Multer 是 Node.js 中处理 multipart/form-data 的主流中间件：

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const app = express();

// 配置存储引擎
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名，防止覆盖
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的 MIME 类型
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

// 创建 Multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多5个文件
  }
});

// 单文件上传
app.post('/upload/single', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的文件' });
  }

  res.json({
    message: '文件上传成功',
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    }
  });
});

// 多文件上传
app.post('/upload/multiple', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '请选择要上传的文件' });
  }

  const fileInfos = req.files.map(file => ({
    originalName: file.originalname,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype
  }));

  res.json({
    message: `成功上传 ${req.files.length} 个文件`,
    files: fileInfos
  });
});

// 多字段上传
const uploadFields = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]);

app.post('/upload/fields', uploadFields, (req, res) => {
  const avatar = req.files['avatar'] ? req.files['avatar'][0] : null;
  const documents = req.files['documents'] || [];

  res.json({
    avatar: avatar ? avatar.filename : null,
    documentsCount: documents.length
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过限制' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: '文件数量超过限制' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
});
```

### 使用 FastAPI 处理文件上传（Python）

```python
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import aiofiles
import hashlib
import os
from datetime import datetime
import magic  # python-magic 库用于检测真实文件类型

app = FastAPI()

# 配置
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'}
ALLOWED_MIMES = {
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

os.makedirs(UPLOAD_DIR, exist_ok=True)

def generate_unique_filename(original_filename: str) -> str:
    """生成唯一文件名"""
    ext = os.path.splitext(original_filename)[1].lower()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = hashlib.md5(f"{original_filename}{timestamp}".encode()).hexdigest()[:8]
    return f"{timestamp}_{unique_id}{ext}"

async def validate_file(file: UploadFile) -> None:
    """验证文件"""
    # 检查文件扩展名
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件扩展名: {ext}")

    # 读取文件头部检测真实类型
    content = await file.read(2048)
    await file.seek(0)  # 重置文件指针

    # 使用 magic 库检测真实 MIME 类型
    mime_type = magic.from_buffer(content, mime=True)
    if mime_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"文件类型不匹配: {mime_type}")

@app.post("/upload/single")
async def upload_single_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    """单文件上传"""
    # 验证文件
    await validate_file(file)

    # 检查文件大小
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过限制")

    # 生成唯一文件名并保存
    filename = generate_unique_filename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, filename)

    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)

    return {
        "message": "文件上传成功",
        "file": {
            "original_name": file.filename,
            "saved_name": filename,
            "size": len(content),
            "content_type": file.content_type,
            "description": description
        }
    }

@app.post("/upload/multiple")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """多文件上传"""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="最多同时上传10个文件")

    results = []
    for file in files:
        try:
            await validate_file(file)
            content = await file.read()

            if len(content) > MAX_FILE_SIZE:
                results.append({
                    "original_name": file.filename,
                    "status": "failed",
                    "error": "文件大小超过限制"
                })
                continue

            filename = generate_unique_filename(file.filename)
            file_path = os.path.join(UPLOAD_DIR, filename)

            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)

            results.append({
                "original_name": file.filename,
                "saved_name": filename,
                "size": len(content),
                "status": "success"
            })
        except HTTPException as e:
            results.append({
                "original_name": file.filename,
                "status": "failed",
                "error": e.detail
            })

    return {"files": results}
```

## 流式上传处理

### 为什么需要流式处理

传统的文件上传方式会将整个文件加载到内存中，对于大文件会导致：

- 内存溢出（Out of Memory）
- 服务器响应缓慢
- 并发能力下降

流式处理可以边接收边处理数据，保持恒定的内存占用。

### Node.js 流式上传实现

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Busboy = require('busboy');

const app = express();

// 流式上传处理
app.post('/upload/stream', (req, res) => {
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB
    }
  });

  const uploads = [];
  let totalSize = 0;

  busboy.on('file', (fieldname, fileStream, info) => {
    const { filename, encoding, mimeType } = info;

    // 生成唯一文件名
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(filename)}`;
    const savePath = path.join('uploads', uniqueName);

    // 创建写入流
    const writeStream = fs.createWriteStream(savePath);

    let fileSize = 0;
    const hash = crypto.createHash('md5');

    // 流式处理
    fileStream.on('data', (chunk) => {
      fileSize += chunk.length;
      totalSize += chunk.length;
      hash.update(chunk);
    });

    fileStream.on('end', () => {
      uploads.push({
        fieldname,
        originalName: filename,
        savedName: uniqueName,
        size: fileSize,
        mimeType,
        md5: hash.digest('hex')
      });
    });

    fileStream.on('limit', () => {
      // 文件大小超限，删除已写入的部分
      writeStream.destroy();
      fs.unlinkSync(savePath);
    });

    // 管道传输
    fileStream.pipe(writeStream);
  });

  busboy.on('field', (fieldname, value) => {
    // 处理普通表单字段
    console.log(`字段 ${fieldname}: ${value}`);
  });

  busboy.on('finish', () => {
    res.json({
      message: '上传完成',
      totalSize,
      files: uploads
    });
  });

  busboy.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  req.pipe(busboy);
});

// 带进度跟踪的流式上传
app.post('/upload/with-progress', (req, res) => {
  const contentLength = parseInt(req.headers['content-length'], 10);
  let uploadedSize = 0;

  const busboy = Busboy({ headers: req.headers });

  busboy.on('file', (fieldname, fileStream, info) => {
    const { filename } = info;
    const savePath = path.join('uploads', `${Date.now()}-${filename}`);
    const writeStream = fs.createWriteStream(savePath);

    fileStream.on('data', (chunk) => {
      uploadedSize += chunk.length;
      const progress = Math.round((uploadedSize / contentLength) * 100);

      // 可以通过 Server-Sent Events 或 WebSocket 推送进度
      console.log(`上传进度: ${progress}%`);
    });

    fileStream.pipe(writeStream);
  });

  busboy.on('finish', () => {
    res.json({ message: '上传完成' });
  });

  req.pipe(busboy);
});
```

### 分块上传（Chunked Upload）

对于超大文件，分块上传是更可靠的方案：

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// 存储上传状态
const uploadSessions = new Map();

// 初始化上传会话
app.post('/upload/init', (req, res) => {
  const { filename, fileSize, totalChunks, mimeType } = req.body;

  // 生成上传会话 ID
  const uploadId = crypto.randomBytes(16).toString('hex');

  // 创建临时目录
  const tempDir = path.join('uploads', 'temp', uploadId);
  fs.mkdirSync(tempDir, { recursive: true });

  // 保存会话信息
  uploadSessions.set(uploadId, {
    filename,
    fileSize,
    totalChunks,
    mimeType,
    tempDir,
    uploadedChunks: new Set(),
    createdAt: Date.now()
  });

  res.json({
    uploadId,
    message: '上传会话已创建'
  });
});

// 上传单个分块
app.post('/upload/chunk/:uploadId/:chunkIndex', (req, res) => {
  const { uploadId, chunkIndex } = req.params;
  const index = parseInt(chunkIndex, 10);

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ error: '上传会话不存在或已过期' });
  }

  const chunkPath = path.join(session.tempDir, `chunk_${index}`);
  const writeStream = fs.createWriteStream(chunkPath);

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    session.uploadedChunks.add(index);

    res.json({
      chunkIndex: index,
      uploaded: session.uploadedChunks.size,
      total: session.totalChunks,
      progress: Math.round((session.uploadedChunks.size / session.totalChunks) * 100)
    });
  });

  writeStream.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

// 完成上传，合并分块
app.post('/upload/complete/:uploadId', async (req, res) => {
  const { uploadId } = req.params;

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ error: '上传会话不存在' });
  }

  // 检查所有分块是否上传完成
  if (session.uploadedChunks.size !== session.totalChunks) {
    const missing = [];
    for (let i = 0; i < session.totalChunks; i++) {
      if (!session.uploadedChunks.has(i)) {
        missing.push(i);
      }
    }
    return res.status(400).json({
      error: '部分分块未上传',
      missingChunks: missing
    });
  }

  try {
    // 生成最终文件名
    const ext = path.extname(session.filename);
    const finalName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const finalPath = path.join('uploads', finalName);

    // 合并分块
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(session.tempDir, `chunk_${i}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // 清理临时文件
    fs.rmSync(session.tempDir, { recursive: true, force: true });
    uploadSessions.delete(uploadId);

    res.json({
      message: '文件上传完成',
      filename: finalName,
      originalName: session.filename,
      size: session.fileSize
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查询上传进度
app.get('/upload/status/:uploadId', (req, res) => {
  const { uploadId } = req.params;

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ error: '上传会话不存在' });
  }

  res.json({
    uploadedChunks: Array.from(session.uploadedChunks),
    totalChunks: session.totalChunks,
    progress: Math.round((session.uploadedChunks.size / session.totalChunks) * 100)
  });
});
```

### 客户端分块上传实现

```javascript
class ChunkedUploader {
  constructor(options) {
    this.file = options.file;
    this.chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB
    this.apiBase = options.apiBase || '/upload';
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    this.uploadId = null;
    this.totalChunks = Math.ceil(this.file.size / this.chunkSize);
    this.uploadedChunks = new Set();
  }

  async start() {
    try {
      // 初始化上传会话
      const initResponse = await fetch(`${this.apiBase}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: this.file.name,
          fileSize: this.file.size,
          totalChunks: this.totalChunks,
          mimeType: this.file.type
        })
      });

      const initData = await initResponse.json();
      this.uploadId = initData.uploadId;

      // 上传所有分块
      await this.uploadChunks();

      // 完成上传
      const completeResponse = await fetch(`${this.apiBase}/complete/${this.uploadId}`, {
        method: 'POST'
      });

      const result = await completeResponse.json();
      this.onComplete(result);
    } catch (err) {
      this.onError(err);
    }
  }

  async uploadChunks() {
    const concurrency = 3; // 并发上传数
    const queue = [];

    for (let i = 0; i < this.totalChunks; i++) {
      if (this.uploadedChunks.has(i)) continue;

      const promise = this.uploadChunk(i).then(() => {
        this.uploadedChunks.add(i);
        this.onProgress({
          uploaded: this.uploadedChunks.size,
          total: this.totalChunks,
          progress: Math.round((this.uploadedChunks.size / this.totalChunks) * 100)
        });
      });

      queue.push(promise);

      if (queue.length >= concurrency) {
        await Promise.race(queue);
        queue.splice(queue.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(queue);
  }

  async uploadChunk(index) {
    const start = index * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);

    const response = await fetch(
      `${this.apiBase}/chunk/${this.uploadId}/${index}`,
      {
        method: 'POST',
        body: chunk
      }
    );

    if (!response.ok) {
      throw new Error(`分块 ${index} 上传失败`);
    }

    return response.json();
  }

  async resume() {
    // 查询已上传的分块
    const statusResponse = await fetch(`${this.apiBase}/status/${this.uploadId}`);
    const status = await statusResponse.json();

    this.uploadedChunks = new Set(status.uploadedChunks);

    // 继续上传剩余分块
    await this.uploadChunks();
  }
}

// 使用示例
const uploader = new ChunkedUploader({
  file: document.getElementById('fileInput').files[0],
  chunkSize: 5 * 1024 * 1024,
  onProgress: (progress) => {
    console.log(`上传进度: ${progress.progress}%`);
  },
  onComplete: (result) => {
    console.log('上传完成:', result);
  },
  onError: (err) => {
    console.error('上传失败:', err);
  }
});

uploader.start();
```

## 云存储集成（AWS S3）

### S3 基础上传

```javascript
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');

// 配置 S3 客户端
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// 简单上传
async function uploadToS3(filePath, key, contentType) {
  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
    // 设置访问控制
    ACL: 'private',
    // 服务端加密
    ServerSideEncryption: 'AES256',
    // 元数据
    Metadata: {
      'uploaded-by': 'api-server',
      'upload-time': new Date().toISOString()
    }
  });

  try {
    const response = await s3Client.send(command);
    return {
      success: true,
      key,
      etag: response.ETag,
      versionId: response.VersionId
    };
  } catch (err) {
    console.error('S3 上传失败:', err);
    throw err;
  }
}

// 分段上传（大文件）
async function multipartUploadToS3(filePath, key, contentType) {
  const fileStream = fs.createReadStream(filePath);
  const fileSize = fs.statSync(filePath).size;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: contentType
    },
    // 分段大小：5MB（最小）到 5GB
    partSize: 10 * 1024 * 1024, // 10MB
    // 并发上传数
    queueSize: 4,
    // 失败重试次数
    leavePartsOnError: false
  });

  // 监听上传进度
  upload.on('httpUploadProgress', (progress) => {
    const percentage = Math.round((progress.loaded / fileSize) * 100);
    console.log(`上传进度: ${percentage}% (${progress.loaded}/${fileSize})`);
  });

  try {
    const result = await upload.done();
    return {
      success: true,
      key: result.Key,
      location: result.Location,
      etag: result.ETag
    };
  } catch (err) {
    console.error('分段上传失败:', err);
    throw err;
  }
}
```

### 预签名 URL（Presigned URL）

预签名 URL 允许客户端直接上传到 S3，无需经过服务器中转：

```javascript
const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// 生成上传预签名 URL
app.post('/s3/presigned-upload', async (req, res) => {
  const { filename, contentType, fileSize } = req.body;

  // 验证文件类型和大小
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(contentType)) {
    return res.status(400).json({ error: '不支持的文件类型' });
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (fileSize > maxSize) {
    return res.status(400).json({ error: '文件大小超过限制' });
  }

  // 生成唯一的对象键
  const ext = filename.split('.').pop();
  const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
    // 限制条件
    Metadata: {
      'original-filename': encodeURIComponent(filename)
    }
  });

  try {
    // 生成预签名 URL，有效期 15 分钟
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900
    });

    res.json({
      uploadUrl: presignedUrl,
      key,
      expiresIn: 900
    });
  } catch (err) {
    console.error('生成预签名 URL 失败:', err);
    res.status(500).json({ error: '生成上传链接失败' });
  }
});

// 生成下载预签名 URL
app.get('/s3/presigned-download/:key', async (req, res) => {
  const { key } = req.params;
  const { filename } = req.query;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    // 设置下载时的文件名
    ResponseContentDisposition: filename
      ? `attachment; filename="${encodeURIComponent(filename)}"`
      : undefined
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600 // 1 小时有效
    });

    res.json({
      downloadUrl: presignedUrl,
      expiresIn: 3600
    });
  } catch (err) {
    console.error('生成下载链接失败:', err);
    res.status(500).json({ error: '生成下载链接失败' });
  }
});

// 客户端直接上传到 S3
async function uploadDirectlyToS3(file) {
  // 1. 获取预签名 URL
  const response = await fetch('/s3/presigned-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size
    })
  });

  const { uploadUrl, key } = await response.json();

  // 2. 直接上传到 S3
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (uploadResponse.ok) {
    console.log('上传成功, key:', key);
    return key;
  } else {
    throw new Error('上传失败');
  }
}
```

### S3 分段上传预签名

对于大文件，可以结合分段上传和预签名 URL：

```javascript
const {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// 初始化分段上传
app.post('/s3/multipart/init', async (req, res) => {
  const { filename, contentType } = req.body;

  const ext = filename.split('.').pop();
  const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType
  });

  try {
    const { UploadId } = await s3Client.send(command);
    res.json({ uploadId: UploadId, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取分段上传预签名 URL
app.post('/s3/multipart/presign', async (req, res) => {
  const { key, uploadId, partNumber } = req.body;

  const command = new UploadPartCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600
    });
    res.json({ presignedUrl, partNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 完成分段上传
app.post('/s3/multipart/complete', async (req, res) => {
  const { key, uploadId, parts } = req.body;
  // parts: [{ PartNumber: 1, ETag: "..." }, ...]

  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts }
  });

  try {
    const result = await s3Client.send(command);
    res.json({
      success: true,
      key: result.Key,
      location: result.Location
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 取消分段上传
app.post('/s3/multipart/abort', async (req, res) => {
  const { key, uploadId } = req.body;

  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId
  });

  try {
    await s3Client.send(command);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## 文件验证与安全

### 文件类型验证

仅依赖文件扩展名或 MIME 类型是不安全的，需要检测文件的实际内容：

```javascript
const fileType = require('file-type');
const fs = require('fs');
const path = require('path');

// 文件魔数（Magic Numbers）映射
const MAGIC_NUMBERS = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'application/zip': [0x50, 0x4B, 0x03, 0x04],
  'application/x-rar-compressed': [0x52, 0x61, 0x72, 0x21]
};

// 使用 file-type 库检测文件类型
async function detectFileType(filePath) {
  const stream = fs.createReadStream(filePath);
  const type = await fileType.fromStream(stream);

  return type ? {
    mime: type.mime,
    ext: type.ext
  } : null;
}

// 手动检测魔数
function checkMagicNumber(buffer, expectedMagic) {
  if (buffer.length < expectedMagic.length) {
    return false;
  }

  for (let i = 0; i < expectedMagic.length; i++) {
    if (buffer[i] !== expectedMagic[i]) {
      return false;
    }
  }

  return true;
}

// 综合验证函数
async function validateFile(filePath, declaredMimeType) {
  const errors = [];

  // 1. 检测实际文件类型
  const detectedType = await detectFileType(filePath);

  if (!detectedType) {
    errors.push('无法识别文件类型');
    return { valid: false, errors };
  }

  // 2. 验证声明的 MIME 类型与实际类型是否匹配
  if (detectedType.mime !== declaredMimeType) {
    errors.push(`文件类型不匹配: 声明 ${declaredMimeType}, 实际 ${detectedType.mime}`);
  }

  // 3. 检查是否在允许的类型列表中
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
  ];

  if (!allowedTypes.includes(detectedType.mime)) {
    errors.push(`不允许的文件类型: ${detectedType.mime}`);
  }

  // 4. 检查文件扩展名是否匹配
  const ext = path.extname(filePath).toLowerCase().slice(1);
  if (ext !== detectedType.ext) {
    errors.push(`扩展名不匹配: 声明 ${ext}, 实际应为 ${detectedType.ext}`);
  }

  return {
    valid: errors.length === 0,
    detectedType,
    errors
  };
}

// 图片额外验证（检查是否可以正常解析）
const sharp = require('sharp');

async function validateImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();

    // 检查图片尺寸
    const maxDimension = 10000;
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      return {
        valid: false,
        error: `图片尺寸过大: ${metadata.width}x${metadata.height}`
      };
    }

    // 检查是否包含 EXIF 数据中的可疑内容
    // Sharp 在处理时会自动清除 EXIF 数据

    return {
      valid: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha
      }
    };
  } catch (err) {
    return {
      valid: false,
      error: '无效的图片文件'
    };
  }
}
```

### 病毒扫描集成

```javascript
const NodeClam = require('clamscan');
const fs = require('fs');

// 初始化 ClamAV 扫描器
async function initClamAV() {
  const clamscan = await new NodeClam().init({
    removeInfected: true, // 自动删除感染文件
    quarantineInfected: './quarantine/', // 隔离目录
    scanLog: './logs/clamscan.log',
    debugMode: false,
    clamdscan: {
      socket: '/var/run/clamav/clamd.sock', // Unix socket
      // host: '127.0.0.1', // 或使用 TCP
      // port: 3310,
      timeout: 60000,
      localFallback: true
    }
  });

  return clamscan;
}

let clamScanner = null;

// 扫描单个文件
async function scanFile(filePath) {
  if (!clamScanner) {
    clamScanner = await initClamAV();
  }

  try {
    const { isInfected, file, viruses } = await clamScanner.isInfected(filePath);

    return {
      scanned: true,
      isInfected,
      file,
      viruses: viruses || []
    };
  } catch (err) {
    console.error('病毒扫描失败:', err);
    return {
      scanned: false,
      error: err.message
    };
  }
}

// 扫描上传的文件流
async function scanStream(readableStream) {
  if (!clamScanner) {
    clamScanner = await initClamAV();
  }

  try {
    const { isInfected, viruses } = await clamScanner.scanStream(readableStream);

    return {
      scanned: true,
      isInfected,
      viruses: viruses || []
    };
  } catch (err) {
    console.error('流扫描失败:', err);
    return {
      scanned: false,
      error: err.message
    };
  }
}

// 中间件：扫描上传的文件
const scanMiddleware = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files || [req.file];

  for (const file of files) {
    const result = await scanFile(file.path);

    if (!result.scanned) {
      // 扫描失败，可以选择拒绝或允许（取决于策略）
      console.warn('文件扫描失败:', file.originalname);
      // return res.status(500).json({ error: '文件安全检查失败' });
    }

    if (result.isInfected) {
      // 删除感染的文件
      fs.unlinkSync(file.path);
      return res.status(400).json({
        error: '检测到恶意文件',
        filename: file.originalname,
        viruses: result.viruses
      });
    }
  }

  next();
};

// 使用 VirusTotal API 进行在线扫描
const axios = require('axios');
const FormData = require('form-data');

async function scanWithVirusTotal(filePath) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  // 上传文件
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const uploadResponse = await axios.post(
    'https://www.virustotal.com/api/v3/files',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'x-apikey': apiKey
      }
    }
  );

  const analysisId = uploadResponse.data.data.id;

  // 等待分析完成
  let analysisResult;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // 等待 10 秒

    const resultResponse = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      {
        headers: { 'x-apikey': apiKey }
      }
    );

    if (resultResponse.data.data.attributes.status === 'completed') {
      analysisResult = resultResponse.data.data.attributes;
      break;
    }

    attempts++;
  }

  if (!analysisResult) {
    return { error: '分析超时' };
  }

  const stats = analysisResult.stats;

  return {
    malicious: stats.malicious,
    suspicious: stats.suspicious,
    harmless: stats.harmless,
    undetected: stats.undetected,
    isClean: stats.malicious === 0 && stats.suspicious === 0
  };
}
```

### 安全存储路径

```javascript
const path = require('path');
const crypto = require('crypto');

// 安全的文件名生成
function generateSafeFilename(originalFilename) {
  // 提取扩展名并转小写
  const ext = path.extname(originalFilename).toLowerCase();

  // 验证扩展名
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不允许的文件扩展名');
  }

  // 生成随机文件名
  const randomName = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();

  return `${timestamp}-${randomName}${ext}`;
}

// 安全的存储路径生成
function generateStoragePath(filename, userId) {
  // 按日期分目录
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // 按用户 ID 哈希分目录（防止单目录文件过多）
  const userHash = crypto
    .createHash('md5')
    .update(String(userId))
    .digest('hex')
    .substring(0, 2);

  // 最终路径: /uploads/2024/01/15/ab/filename.ext
  return path.join('uploads', String(year), month, day, userHash, filename);
}

// 防止路径遍历攻击
function sanitizePath(userInput) {
  // 移除路径遍历字符
  const sanitized = path.normalize(userInput)
    .replace(/^(\.\.(\/|\\|$))+/, '') // 移除开头的 ../
    .replace(/\.\./g, '')             // 移除所有 ..
    .replace(/\/\//g, '/')            // 移除双斜杠
    .replace(/\\/g, '/');             // 统一使用正斜杠

  // 验证路径不包含危险字符
  if (/[<>:"|?*\x00-\x1f]/.test(sanitized)) {
    throw new Error('文件名包含非法字符');
  }

  return sanitized;
}

// 验证文件访问权限
function validateFileAccess(requestedPath, baseDir) {
  const resolvedPath = path.resolve(baseDir, requestedPath);
  const resolvedBase = path.resolve(baseDir);

  // 确保请求的路径在允许的目录内
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('拒绝访问：路径超出允许范围');
  }

  return resolvedPath;
}
```

## 大文件处理策略

### 内存优化

```javascript
const fs = require('fs');
const { Transform } = require('stream');
const crypto = require('crypto');

// 流式计算文件哈希
function computeFileHash(filePath, algorithm = 'sha256') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// 流式文件处理转换器
class FileProcessorTransform extends Transform {
  constructor(options = {}) {
    super(options);
    this.bytesProcessed = 0;
    this.chunks = [];
    this.maxBufferSize = options.maxBufferSize || 10 * 1024 * 1024; // 10MB
  }

  _transform(chunk, encoding, callback) {
    this.bytesProcessed += chunk.length;

    // 在这里可以进行数据处理，例如：
    // - 实时计算校验和
    // - 内容过滤
    // - 格式转换

    // 直接传递数据，不在内存中累积
    callback(null, chunk);
  }

  _flush(callback) {
    console.log(`处理完成，总共 ${this.bytesProcessed} 字节`);
    callback();
  }
}

// 大文件复制（流式）
async function copyLargeFile(sourcePath, destPath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sourcePath, {
      highWaterMark: 64 * 1024 // 64KB 缓冲区
    });

    const writeStream = fs.createWriteStream(destPath);
    const processor = new FileProcessorTransform();

    readStream
      .pipe(processor)
      .pipe(writeStream)
      .on('finish', () => {
        resolve({
          bytesWritten: processor.bytesProcessed,
          destination: destPath
        });
      })
      .on('error', reject);
  });
}

// 带进度的大文件处理
function processLargeFileWithProgress(filePath, onProgress) {
  return new Promise((resolve, reject) => {
    const stats = fs.statSync(filePath);
    const totalSize = stats.size;
    let processedSize = 0;

    const readStream = fs.createReadStream(filePath);
    const hash = crypto.createHash('sha256');

    readStream.on('data', (chunk) => {
      processedSize += chunk.length;
      hash.update(chunk);

      const progress = Math.round((processedSize / totalSize) * 100);
      onProgress({ processedSize, totalSize, progress });
    });

    readStream.on('end', () => {
      resolve({
        hash: hash.digest('hex'),
        size: totalSize
      });
    });

    readStream.on('error', reject);
  });
}
```

### 后台处理队列

```javascript
const Bull = require('bull');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// 创建文件处理队列
const fileProcessingQueue = new Bull('file-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// 定义处理任务
fileProcessingQueue.process('image-resize', async (job) => {
  const { filePath, sizes, outputDir } = job.data;
  const results = [];

  for (const size of sizes) {
    const outputPath = path.join(
      outputDir,
      `${path.basename(filePath, path.extname(filePath))}_${size.width}x${size.height}${path.extname(filePath)}`
    );

    await sharp(filePath)
      .resize(size.width, size.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(outputPath);

    results.push({
      size: `${size.width}x${size.height}`,
      path: outputPath
    });

    // 更新进度
    job.progress(Math.round((results.length / sizes.length) * 100));
  }

  return results;
});

fileProcessingQueue.process('video-transcode', async (job) => {
  const { filePath, outputFormat, quality } = job.data;
  // 视频转码逻辑（使用 ffmpeg）
  // ...
});

// 添加任务到队列
async function queueImageProcessing(filePath, userId) {
  const job = await fileProcessingQueue.add('image-resize', {
    filePath,
    userId,
    sizes: [
      { width: 1920, height: 1080 },
      { width: 800, height: 600 },
      { width: 200, height: 200 }
    ],
    outputDir: path.join('processed', String(userId))
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  });

  return {
    jobId: job.id,
    status: 'queued'
  };
}

// 监听队列事件
fileProcessingQueue.on('completed', (job, result) => {
  console.log(`任务 ${job.id} 完成:`, result);
  // 通知用户、更新数据库等
});

fileProcessingQueue.on('failed', (job, err) => {
  console.error(`任务 ${job.id} 失败:`, err);
  // 错误处理、通知等
});

// API 端点
app.post('/upload/image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择图片' });
  }

  // 立即返回，异步处理
  const job = await queueImageProcessing(req.file.path, req.user.id);

  res.json({
    message: '文件上传成功，正在处理中',
    jobId: job.jobId,
    statusUrl: `/api/jobs/${job.jobId}/status`
  });
});

// 查询任务状态
app.get('/api/jobs/:jobId/status', async (req, res) => {
  const job = await fileProcessingQueue.getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const state = await job.getState();
  const progress = job.progress();

  res.json({
    jobId: job.id,
    state,
    progress,
    result: job.returnvalue,
    failedReason: job.failedReason
  });
});
```

### 断点续传实现

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

// 存储上传会话
const uploadSessions = new Map();

// 检查是否可以续传
app.post('/upload/resume/check', async (req, res) => {
  const { fileHash, fileSize, filename } = req.body;

  // 查找现有会话
  const sessionKey = `${fileHash}-${fileSize}`;
  const session = uploadSessions.get(sessionKey);

  if (session) {
    // 计算已上传的字节数
    const tempPath = session.tempPath;
    const uploadedSize = fs.existsSync(tempPath)
      ? fs.statSync(tempPath).size
      : 0;

    res.json({
      canResume: true,
      uploadedSize,
      sessionId: session.id
    });
  } else {
    // 创建新会话
    const sessionId = crypto.randomBytes(16).toString('hex');
    const tempPath = path.join('temp', `${sessionId}.tmp`);

    uploadSessions.set(sessionKey, {
      id: sessionId,
      fileHash,
      fileSize,
      filename,
      tempPath,
      createdAt: Date.now()
    });

    res.json({
      canResume: false,
      uploadedSize: 0,
      sessionId
    });
  }
});

// 断点续传上传
app.patch('/upload/resume/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const contentRange = req.headers['content-range'];

  // 解析 Content-Range: bytes 0-999/10000
  const rangeMatch = contentRange?.match(/bytes (\d+)-(\d+)\/(\d+)/);
  if (!rangeMatch) {
    return res.status(400).json({ error: '无效的 Content-Range 头' });
  }

  const [, startStr, endStr, totalStr] = rangeMatch;
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);
  const total = parseInt(totalStr, 10);

  // 查找会话
  let session = null;
  for (const [key, s] of uploadSessions) {
    if (s.id === sessionId) {
      session = s;
      break;
    }
  }

  if (!session) {
    return res.status(404).json({ error: '上传会话不存在' });
  }

  // 验证起始位置
  const currentSize = fs.existsSync(session.tempPath)
    ? fs.statSync(session.tempPath).size
    : 0;

  if (start !== currentSize) {
    return res.status(409).json({
      error: '位置不匹配',
      expectedStart: currentSize
    });
  }

  // 追加写入
  const writeStream = fs.createWriteStream(session.tempPath, {
    flags: 'a' // 追加模式
  });

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    const newSize = fs.statSync(session.tempPath).size;

    if (newSize === total) {
      // 上传完成，移动到最终位置
      const finalPath = path.join('uploads', session.filename);
      fs.renameSync(session.tempPath, finalPath);

      // 清理会话
      for (const [key, s] of uploadSessions) {
        if (s.id === sessionId) {
          uploadSessions.delete(key);
          break;
        }
      }

      res.json({
        completed: true,
        path: finalPath
      });
    } else {
      res.json({
        completed: false,
        uploadedSize: newSize,
        remaining: total - newSize
      });
    }
  });

  writeStream.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

// 清理过期会话（定时任务）
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 小时

  for (const [key, session] of uploadSessions) {
    if (now - session.createdAt > maxAge) {
      // 删除临时文件
      if (fs.existsSync(session.tempPath)) {
        fs.unlinkSync(session.tempPath);
      }
      uploadSessions.delete(key);
    }
  }
}, 60 * 60 * 1000); // 每小时检查一次
```

## 完整示例：生产级文件上传服务

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fileType = require('file-type');
const sharp = require('sharp');
const Bull = require('bull');

const app = express();
app.use(express.json());

// 配置
const config = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  imageMaxDimension: 4096,
  uploadDir: 'uploads',
  tempDir: 'temp'
};

// 确保目录存在
[config.uploadDir, config.tempDir].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// S3 客户端
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// 处理队列
const processingQueue = new Bull('file-processing', process.env.REDIS_URL);

// Multer 配置
const storage = multer.diskStorage({
  destination: config.tempDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize }
});

// 文件验证服务
class FileValidator {
  static async validate(filePath, declaredMime) {
    const errors = [];

    // 检测实际文件类型
    const detected = await fileType.fromFile(filePath);

    if (!detected) {
      errors.push('无法识别文件类型');
      return { valid: false, errors };
    }

    // 验证 MIME 类型
    if (!config.allowedMimeTypes.includes(detected.mime)) {
      errors.push(`不支持的文件类型: ${detected.mime}`);
    }

    // 类型匹配检查
    if (detected.mime !== declaredMime) {
      errors.push(`文件类型不匹配: 声明 ${declaredMime}, 实际 ${detected.mime}`);
    }

    // 图片额外验证
    if (detected.mime.startsWith('image/')) {
      try {
        const metadata = await sharp(filePath).metadata();
        if (metadata.width > config.imageMaxDimension ||
            metadata.height > config.imageMaxDimension) {
          errors.push('图片尺寸超过限制');
        }
      } catch (err) {
        errors.push('无效的图片文件');
      }
    }

    return {
      valid: errors.length === 0,
      detectedType: detected,
      errors
    };
  }
}

// 存储服务
class StorageService {
  static generateKey(filename, userId) {
    const date = new Date();
    const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(filename);
    return `uploads/${datePrefix}/${userId}/${hash}${ext}`;
  }

  static async uploadToS3(filePath, key, contentType) {
    const fileStream = fs.createReadStream(filePath);

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
      ServerSideEncryption: 'AES256'
    });

    await s3Client.send(command);
    return key;
  }

  static async saveLocally(filePath, key) {
    const destPath = path.join(config.uploadDir, key);
    const destDir = path.dirname(destPath);

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(filePath, destPath);

    return destPath;
  }
}

// 上传处理中间件
const handleUpload = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择文件' });
  }

  try {
    // 1. 验证文件
    const validation = await FileValidator.validate(
      req.file.path,
      req.file.mimetype
    );

    if (!validation.valid) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: '文件验证失败',
        details: validation.errors
      });
    }

    // 2. 生成存储键
    const userId = req.user?.id || 'anonymous';
    const storageKey = StorageService.generateKey(req.file.originalname, userId);

    // 3. 上传到存储
    let storageResult;
    if (process.env.STORAGE_TYPE === 's3') {
      storageResult = await StorageService.uploadToS3(
        req.file.path,
        storageKey,
        validation.detectedType.mime
      );
    } else {
      storageResult = await StorageService.saveLocally(req.file.path, storageKey);
    }

    // 4. 清理临时文件
    fs.unlinkSync(req.file.path);

    // 5. 添加到处理队列（如果是图片）
    let processingJobId = null;
    if (validation.detectedType.mime.startsWith('image/')) {
      const job = await processingQueue.add('generate-thumbnails', {
        key: storageKey,
        mimeType: validation.detectedType.mime
      });
      processingJobId = job.id;
    }

    // 6. 返回结果
    req.uploadResult = {
      key: storageKey,
      originalName: req.file.originalname,
      mimeType: validation.detectedType.mime,
      size: req.file.size,
      processingJobId
    };

    next();
  } catch (err) {
    // 清理临时文件
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};

// API 路由
app.post('/api/upload',
  upload.single('file'),
  handleUpload,
  (req, res) => {
    res.json({
      success: true,
      file: req.uploadResult
    });
  }
);

// 获取预签名下载 URL
app.get('/api/files/:key/download-url', async (req, res) => {
  const { key } = req.params;

  // 验证用户权限...

  const url = await getSignedUrl(
    s3Client,
    {
      Bucket: process.env.S3_BUCKET,
      Key: key
    },
    { expiresIn: 3600 }
  );

  res.json({ url, expiresIn: 3600 });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过限制' });
    }
  }

  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`文件上传服务运行在端口 ${PORT}`);
});
```

## 面试要点

### 常见面试问题

**1. 如何防止恶意文件上传？**

- 验证文件类型（检查魔数，不仅依赖扩展名和 MIME 类型）
- 限制文件大小
- 使用病毒扫描
- 重命名文件，使用随机文件名
- 将上传目录与应用代码分离
- 禁止上传目录的执行权限

**2. 大文件上传如何优化？**

- 使用流式处理，避免一次性加载到内存
- 实现分块上传，支持断点续传
- 使用预签名 URL 让客户端直传云存储
- 后台队列处理文件转换等耗时操作

**3. 如何实现断点续传？**

- 客户端计算文件哈希作为唯一标识
- 服务端记录已上传的字节数或分块
- 使用 Content-Range 头指定上传位置
- 支持查询上传进度的接口

**4. 预签名 URL 的优势是什么？**

- 减少服务器带宽压力
- 客户端直连云存储，提高上传速度
- 临时授权，过期自动失效
- 可限制上传大小和类型

### 性能优化技巧

1. **使用 CDN 加速文件下载**
2. **图片懒加载和渐进式加载**
3. **生成多种尺寸的缩略图**
4. **使用 WebP 等现代图片格式**
5. **实现文件去重（基于内容哈希）**
6. **设置合理的缓存策略**

## 延伸阅读

### 官方文档

- [Multer 文档](https://github.com/expressjs/multer)
- [AWS S3 JavaScript SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [FastAPI 文件上传](https://fastapi.tiangolo.com/tutorial/request-files/)

### 相关技术

- **tus 协议**：开放的断点续传协议
- **MinIO**：兼容 S3 的开源对象存储
- **ImageMagick/Sharp**：图片处理库
- **FFmpeg**：视频处理工具

### 云服务对比

| 特性 | AWS S3 | Google Cloud Storage | Azure Blob |
|------|--------|---------------------|------------|
| 全球覆盖 | 优秀 | 优秀 | 优秀 |
| 价格 | 中等 | 中等 | 中等 |
| 集成度 | 高 | 高 | 高 |
| 分段上传 | 支持 | 支持 | 支持 |
| 生命周期管理 | 支持 | 支持 | 支持 |

---

> 文件上传是后端开发中看似简单但需要考虑众多细节的功能。从安全验证到性能优化，从本地存储到云服务集成，每个环节都需要精心设计。建议在实际项目中根据具体需求选择合适的方案，并持续关注安全更新和最佳实践。
