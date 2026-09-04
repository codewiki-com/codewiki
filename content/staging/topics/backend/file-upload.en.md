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
origin: old/src/content/docs/backend/file-upload.en.md
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

## Concept Overview

File upload is one of the most common features in web applications, involving receiving file data from clients and storing it on servers or cloud storage services. A robust file upload system needs to consider multiple factors: security, performance, scalability, and user experience.

### Core Challenges of File Upload

File upload may seem simple, but actual development faces numerous challenges:

- **Security threats**: Malicious file uploads, path traversal attacks, file type spoofing
- **Performance issues**: Large file upload timeouts, memory overflow, bandwidth consumption
- **Reliability**: Resume uploads after network interruption, upload progress tracking
- **Storage management**: Storage capacity planning, file deduplication, lifecycle management

### File Upload Workflow

```
Client                    Server                     Storage Service
  |                         |                          |
  |  1. Select file         |                          |
  |  2. Form validation     |                          |
  |  3. Initiate request ---------> |                          |
  |                         |  4. Receive data         |
  |                         |  5. Validate file        |
  |                         |  6. Virus scan           |
  |                         |  7. Process/transcode    |
  |                         |  8. Upload to storage ---------->|
  |                         |                          |  9. Store file
  |                         |  10. Save metadata <---------|
  |  11. Return result <---------|                          |
  |                         |                          |
```

## Multipart Upload Explained

### What is Multipart/form-data

Multipart/form-data is the encoding type used in the HTTP protocol for file uploads. It divides form data into multiple parts, each part containing data for one field.

```http
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="title"

Document Title
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

(binary file data)
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### Using Multer for File Upload (Node.js)

Multer is the mainstream middleware for handling multipart/form-data in Node.js:

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Configure storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename to prevent overwriting
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
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
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

// Create Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files
  }
});

// Single file upload
app.post('/upload/single', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please select a file to upload' });
  }

  res.json({
    message: 'File uploaded successfully',
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    }
  });
});

// Multiple file upload
app.post('/upload/multiple', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Please select files to upload' });
  }

  const fileInfos = req.files.map(file => ({
    originalName: file.originalname,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype
  }));

  res.json({
    message: `Successfully uploaded ${req.files.length} files`,
    files: fileInfos
  });
});

// Multiple fields upload
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

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds limit' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'File count exceeds limit' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
});
```

### Using FastAPI for File Upload (Python)

```python
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import aiofiles
import hashlib
import os
from datetime import datetime
import magic  # python-magic library for detecting actual file types

app = FastAPI()

# Configuration
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
    """Generate unique filename"""
    ext = os.path.splitext(original_filename)[1].lower()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = hashlib.md5(f"{original_filename}{timestamp}".encode()).hexdigest()[:8]
    return f"{timestamp}_{unique_id}{ext}"

async def validate_file(file: UploadFile) -> None:
    """Validate file"""
    # Check file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file extension: {ext}")

    # Read file header to detect actual type
    content = await file.read(2048)
    await file.seek(0)  # Reset file pointer

    # Use magic library to detect actual MIME type
    mime_type = magic.from_buffer(content, mime=True)
    if mime_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"File type mismatch: {mime_type}")

@app.post("/upload/single")
async def upload_single_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    """Single file upload"""
    # Validate file
    await validate_file(file)

    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds limit")

    # Generate unique filename and save
    filename = generate_unique_filename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, filename)

    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)

    return {
        "message": "File uploaded successfully",
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
    """Multiple file upload"""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files can be uploaded at once")

    results = []
    for file in files:
        try:
            await validate_file(file)
            content = await file.read()

            if len(content) > MAX_FILE_SIZE:
                results.append({
                    "original_name": file.filename,
                    "status": "failed",
                    "error": "File size exceeds limit"
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

## Stream Upload Processing

### Why Stream Processing is Needed

Traditional file upload methods load the entire file into memory, which for large files can cause:

- Out of Memory errors
- Slow server response
- Reduced concurrent capacity

Stream processing can receive and process data simultaneously, maintaining constant memory usage.

### Node.js Stream Upload Implementation

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Busboy = require('busboy');

const app = express();

// Stream upload processing
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

    // Generate unique filename
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(filename)}`;
    const savePath = path.join('uploads', uniqueName);

    // Create write stream
    const writeStream = fs.createWriteStream(savePath);

    let fileSize = 0;
    const hash = crypto.createHash('md5');

    // Stream processing
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
      // File size exceeded, delete the written part
      writeStream.destroy();
      fs.unlinkSync(savePath);
    });

    // Pipe transfer
    fileStream.pipe(writeStream);
  });

  busboy.on('field', (fieldname, value) => {
    // Process regular form fields
    console.log(`Field ${fieldname}: ${value}`);
  });

  busboy.on('finish', () => {
    res.json({
      message: 'Upload complete',
      totalSize,
      files: uploads
    });
  });

  busboy.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  req.pipe(busboy);
});

// Stream upload with progress tracking
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

      // Can push progress via Server-Sent Events or WebSocket
      console.log(`Upload progress: ${progress}%`);
    });

    fileStream.pipe(writeStream);
  });

  busboy.on('finish', () => {
    res.json({ message: 'Upload complete' });
  });

  req.pipe(busboy);
});
```

### Chunked Upload

For very large files, chunked upload is a more reliable solution:

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Store upload states
const uploadSessions = new Map();

// Initialize upload session
app.post('/upload/init', (req, res) => {
  const { filename, fileSize, totalChunks, mimeType } = req.body;

  // Generate upload session ID
  const uploadId = crypto.randomBytes(16).toString('hex');

  // Create temporary directory
  const tempDir = path.join('uploads', 'temp', uploadId);
  fs.mkdirSync(tempDir, { recursive: true });

  // Save session information
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
    message: 'Upload session created'
  });
});

// Upload single chunk
app.post('/upload/chunk/:uploadId/:chunkIndex', (req, res) => {
  const { uploadId, chunkIndex } = req.params;
  const index = parseInt(chunkIndex, 10);

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ error: 'Upload session does not exist or has expired' });
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

// Complete upload, merge chunks
app.post('/upload/complete/:uploadId', async (req, res) => {
  const { uploadId } = req.params;

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ error: 'Upload session does not exist' });
  }

  // Check if all chunks are uploaded
  if (session.uploadedChunks.size !== session.totalChunks) {
    const missing = [];
    for (let i = 0; i < session.totalChunks; i++) {
      if (!session.uploadedChunks.has(i)) {
        missing.push(i);
      }
    }
    return res.status(400).json({
      error: 'Some chunks are not uploaded',
      missingChunks: missing
    });
  }

  try {
    // Generate final filename
    const ext = path.extname(session.filename);
    const finalName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const finalPath = path.join('uploads', finalName);

    // Merge chunks
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

    // Clean up temporary files
    fs.rmSync(session.tempDir, { recursive: true, force: true });
    uploadSessions.delete(uploadId);

    res.json({
      message: 'File upload complete',
      filename: finalName,
      originalName: session.filename,
      size: session.fileSize
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Query upload progress
app.get('/upload/status/:uploadId', (req, res) => {
  const { uploadId } = req.params;

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ error: 'Upload session does not exist' });
  }

  res.json({
    uploadedChunks: Array.from(session.uploadedChunks),
    totalChunks: session.totalChunks,
    progress: Math.round((session.uploadedChunks.size / session.totalChunks) * 100)
  });
});
```

### Client-side Chunked Upload Implementation

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
      // Initialize upload session
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

      // Upload all chunks
      await this.uploadChunks();

      // Complete upload
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
    const concurrency = 3; // Concurrent upload count
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
      throw new Error(`Chunk ${index} upload failed`);
    }

    return response.json();
  }

  async resume() {
    // Query uploaded chunks
    const statusResponse = await fetch(`${this.apiBase}/status/${this.uploadId}`);
    const status = await statusResponse.json();

    this.uploadedChunks = new Set(status.uploadedChunks);

    // Continue uploading remaining chunks
    await this.uploadChunks();
  }
}

// Usage example
const uploader = new ChunkedUploader({
  file: document.getElementById('fileInput').files[0],
  chunkSize: 5 * 1024 * 1024,
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress.progress}%`);
  },
  onComplete: (result) => {
    console.log('Upload complete:', result);
  },
  onError: (err) => {
    console.error('Upload failed:', err);
  }
});

uploader.start();
```

## Cloud Storage Integration (AWS S3)

### S3 Basic Upload

```javascript
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Simple upload
async function uploadToS3(filePath, key, contentType) {
  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
    // Set access control
    ACL: 'private',
    // Server-side encryption
    ServerSideEncryption: 'AES256',
    // Metadata
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
    console.error('S3 upload failed:', err);
    throw err;
  }
}

// Multipart upload (large files)
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
    // Part size: 5MB (minimum) to 5GB
    partSize: 10 * 1024 * 1024, // 10MB
    // Concurrent upload count
    queueSize: 4,
    // Retry count on failure
    leavePartsOnError: false
  });

  // Monitor upload progress
  upload.on('httpUploadProgress', (progress) => {
    const percentage = Math.round((progress.loaded / fileSize) * 100);
    console.log(`Upload progress: ${percentage}% (${progress.loaded}/${fileSize})`);
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
    console.error('Multipart upload failed:', err);
    throw err;
  }
}
```

### Presigned URL

Presigned URLs allow clients to upload directly to S3 without going through the server:

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

// Generate upload presigned URL
app.post('/s3/presigned-upload', async (req, res) => {
  const { filename, contentType, fileSize } = req.body;

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(contentType)) {
    return res.status(400).json({ error: 'Unsupported file type' });
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (fileSize > maxSize) {
    return res.status(400).json({ error: 'File size exceeds limit' });
  }

  // Generate unique object key
  const ext = filename.split('.').pop();
  const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
    // Constraints
    Metadata: {
      'original-filename': encodeURIComponent(filename)
    }
  });

  try {
    // Generate presigned URL, valid for 15 minutes
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900
    });

    res.json({
      uploadUrl: presignedUrl,
      key,
      expiresIn: 900
    });
  } catch (err) {
    console.error('Failed to generate presigned URL:', err);
    res.status(500).json({ error: 'Failed to generate upload link' });
  }
});

// Generate download presigned URL
app.get('/s3/presigned-download/:key', async (req, res) => {
  const { key } = req.params;
  const { filename } = req.query;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    // Set filename for download
    ResponseContentDisposition: filename
      ? `attachment; filename="${encodeURIComponent(filename)}"`
      : undefined
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600 // Valid for 1 hour
    });

    res.json({
      downloadUrl: presignedUrl,
      expiresIn: 3600
    });
  } catch (err) {
    console.error('Failed to generate download link:', err);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

// Client uploads directly to S3
async function uploadDirectlyToS3(file) {
  // 1. Get presigned URL
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

  // 2. Upload directly to S3
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (uploadResponse.ok) {
    console.log('Upload successful, key:', key);
    return key;
  } else {
    throw new Error('Upload failed');
  }
}
```

### S3 Multipart Upload with Presigning

For large files, you can combine multipart upload with presigned URLs:

```javascript
const {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize multipart upload
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

// Get presigned URL for part upload
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

// Complete multipart upload
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

// Abort multipart upload
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

## File Validation and Security

### File Type Validation

Relying only on file extensions or MIME types is unsafe; you need to detect the actual file content:

```javascript
const fileType = require('file-type');
const fs = require('fs');
const path = require('path');

// Magic Numbers mapping
const MAGIC_NUMBERS = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'application/zip': [0x50, 0x4B, 0x03, 0x04],
  'application/x-rar-compressed': [0x52, 0x61, 0x72, 0x21]
};

// Detect file type using file-type library
async function detectFileType(filePath) {
  const stream = fs.createReadStream(filePath);
  const type = await fileType.fromStream(stream);

  return type ? {
    mime: type.mime,
    ext: type.ext
  } : null;
}

// Manual magic number check
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

// Comprehensive validation function
async function validateFile(filePath, declaredMimeType) {
  const errors = [];

  // 1. Detect actual file type
  const detectedType = await detectFileType(filePath);

  if (!detectedType) {
    errors.push('Cannot identify file type');
    return { valid: false, errors };
  }

  // 2. Verify declared MIME type matches actual type
  if (detectedType.mime !== declaredMimeType) {
    errors.push(`File type mismatch: declared ${declaredMimeType}, actual ${detectedType.mime}`);
  }

  // 3. Check if in allowed types list
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
  ];

  if (!allowedTypes.includes(detectedType.mime)) {
    errors.push(`File type not allowed: ${detectedType.mime}`);
  }

  // 4. Check if file extension matches
  const ext = path.extname(filePath).toLowerCase().slice(1);
  if (ext !== detectedType.ext) {
    errors.push(`Extension mismatch: declared ${ext}, should be ${detectedType.ext}`);
  }

  return {
    valid: errors.length === 0,
    detectedType,
    errors
  };
}

// Additional image validation (check if it can be parsed properly)
const sharp = require('sharp');

async function validateImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();

    // Check image dimensions
    const maxDimension = 10000;
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      return {
        valid: false,
        error: `Image dimensions too large: ${metadata.width}x${metadata.height}`
      };
    }

    // Check for suspicious content in EXIF data
    // Sharp automatically removes EXIF data during processing

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
      error: 'Invalid image file'
    };
  }
}
```

### Virus Scanning Integration

```javascript
const NodeClam = require('clamscan');
const fs = require('fs');

// Initialize ClamAV scanner
async function initClamAV() {
  const clamscan = await new NodeClam().init({
    removeInfected: true, // Automatically delete infected files
    quarantineInfected: './quarantine/', // Quarantine directory
    scanLog: './logs/clamscan.log',
    debugMode: false,
    clamdscan: {
      socket: '/var/run/clamav/clamd.sock', // Unix socket
      // host: '127.0.0.1', // Or use TCP
      // port: 3310,
      timeout: 60000,
      localFallback: true
    }
  });

  return clamscan;
}

let clamScanner = null;

// Scan single file
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
    console.error('Virus scan failed:', err);
    return {
      scanned: false,
      error: err.message
    };
  }
}

// Scan uploaded file stream
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
    console.error('Stream scan failed:', err);
    return {
      scanned: false,
      error: err.message
    };
  }
}

// Middleware: scan uploaded files
const scanMiddleware = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files || [req.file];

  for (const file of files) {
    const result = await scanFile(file.path);

    if (!result.scanned) {
      // Scan failed, can choose to reject or allow (depends on policy)
      console.warn('File scan failed:', file.originalname);
      // return res.status(500).json({ error: 'File security check failed' });
    }

    if (result.isInfected) {
      // Delete infected file
      fs.unlinkSync(file.path);
      return res.status(400).json({
        error: 'Malicious file detected',
        filename: file.originalname,
        viruses: result.viruses
      });
    }
  }

  next();
};

// Online scanning using VirusTotal API
const axios = require('axios');
const FormData = require('form-data');

async function scanWithVirusTotal(filePath) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  // Upload file
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

  // Wait for analysis to complete
  let analysisResult;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

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
    return { error: 'Analysis timed out' };
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

### Secure Storage Paths

```javascript
const path = require('path');
const crypto = require('crypto');

// Safe filename generation
function generateSafeFilename(originalFilename) {
  // Extract extension and convert to lowercase
  const ext = path.extname(originalFilename).toLowerCase();

  // Validate extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
  if (!allowedExtensions.includes(ext)) {
    throw new Error('File extension not allowed');
  }

  // Generate random filename
  const randomName = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();

  return `${timestamp}-${randomName}${ext}`;
}

// Safe storage path generation
function generateStoragePath(filename, userId) {
  // Organize by date
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Organize by user ID hash (prevent too many files in single directory)
  const userHash = crypto
    .createHash('md5')
    .update(String(userId))
    .digest('hex')
    .substring(0, 2);

  // Final path: /uploads/2024/01/15/ab/filename.ext
  return path.join('uploads', String(year), month, day, userHash, filename);
}

// Prevent path traversal attacks
function sanitizePath(userInput) {
  // Remove path traversal characters
  const sanitized = path.normalize(userInput)
    .replace(/^(\.\.(\/|\\|$))+/, '') // Remove leading ../
    .replace(/\.\./g, '')             // Remove all ..
    .replace(/\/\//g, '/')            // Remove double slashes
    .replace(/\\/g, '/');             // Use forward slashes consistently

  // Verify path doesn't contain dangerous characters
  if (/[<>:"|?*\x00-\x1f]/.test(sanitized)) {
    throw new Error('Filename contains illegal characters');
  }

  return sanitized;
}

// Validate file access permissions
function validateFileAccess(requestedPath, baseDir) {
  const resolvedPath = path.resolve(baseDir, requestedPath);
  const resolvedBase = path.resolve(baseDir);

  // Ensure requested path is within allowed directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Access denied: path outside allowed scope');
  }

  return resolvedPath;
}
```

## Large File Handling Strategies

### Memory Optimization

```javascript
const fs = require('fs');
const { Transform } = require('stream');
const crypto = require('crypto');

// Stream-based file hash computation
function computeFileHash(filePath, algorithm = 'sha256') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Stream file processing transformer
class FileProcessorTransform extends Transform {
  constructor(options = {}) {
    super(options);
    this.bytesProcessed = 0;
    this.chunks = [];
    this.maxBufferSize = options.maxBufferSize || 10 * 1024 * 1024; // 10MB
  }

  _transform(chunk, encoding, callback) {
    this.bytesProcessed += chunk.length;

    // Can process data here, for example:
    // - Real-time checksum calculation
    // - Content filtering
    // - Format conversion

    // Pass data through, don't accumulate in memory
    callback(null, chunk);
  }

  _flush(callback) {
    console.log(`Processing complete, total ${this.bytesProcessed} bytes`);
    callback();
  }
}

// Large file copy (stream-based)
async function copyLargeFile(sourcePath, destPath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sourcePath, {
      highWaterMark: 64 * 1024 // 64KB buffer
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

// Large file processing with progress
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

### Background Processing Queue

```javascript
const Bull = require('bull');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Create file processing queue
const fileProcessingQueue = new Bull('file-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Define processing tasks
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

    // Update progress
    job.progress(Math.round((results.length / sizes.length) * 100));
  }

  return results;
});

fileProcessingQueue.process('video-transcode', async (job) => {
  const { filePath, outputFormat, quality } = job.data;
  // Video transcoding logic (using ffmpeg)
  // ...
});

// Add task to queue
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

// Listen to queue events
fileProcessingQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
  // Notify user, update database, etc.
});

fileProcessingQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  // Error handling, notifications, etc.
});

// API endpoint
app.post('/upload/image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please select an image' });
  }

  // Return immediately, process asynchronously
  const job = await queueImageProcessing(req.file.path, req.user.id);

  res.json({
    message: 'File uploaded successfully, processing in progress',
    jobId: job.jobId,
    statusUrl: `/api/jobs/${job.jobId}/status`
  });
});

// Query job status
app.get('/api/jobs/:jobId/status', async (req, res) => {
  const job = await fileProcessingQueue.getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
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

### Resume Upload Implementation

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Store upload sessions
const uploadSessions = new Map();

// Check if upload can be resumed
app.post('/upload/resume/check', async (req, res) => {
  const { fileHash, fileSize, filename } = req.body;

  // Find existing session
  const sessionKey = `${fileHash}-${fileSize}`;
  const session = uploadSessions.get(sessionKey);

  if (session) {
    // Calculate uploaded bytes
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
    // Create new session
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

// Resume upload
app.patch('/upload/resume/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const contentRange = req.headers['content-range'];

  // Parse Content-Range: bytes 0-999/10000
  const rangeMatch = contentRange?.match(/bytes (\d+)-(\d+)\/(\d+)/);
  if (!rangeMatch) {
    return res.status(400).json({ error: 'Invalid Content-Range header' });
  }

  const [, startStr, endStr, totalStr] = rangeMatch;
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);
  const total = parseInt(totalStr, 10);

  // Find session
  let session = null;
  for (const [key, s] of uploadSessions) {
    if (s.id === sessionId) {
      session = s;
      break;
    }
  }

  if (!session) {
    return res.status(404).json({ error: 'Upload session does not exist' });
  }

  // Verify start position
  const currentSize = fs.existsSync(session.tempPath)
    ? fs.statSync(session.tempPath).size
    : 0;

  if (start !== currentSize) {
    return res.status(409).json({
      error: 'Position mismatch',
      expectedStart: currentSize
    });
  }

  // Append write
  const writeStream = fs.createWriteStream(session.tempPath, {
    flags: 'a' // Append mode
  });

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    const newSize = fs.statSync(session.tempPath).size;

    if (newSize === total) {
      // Upload complete, move to final location
      const finalPath = path.join('uploads', session.filename);
      fs.renameSync(session.tempPath, finalPath);

      // Clean up session
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

// Clean up expired sessions (scheduled task)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [key, session] of uploadSessions) {
    if (now - session.createdAt > maxAge) {
      // Delete temporary file
      if (fs.existsSync(session.tempPath)) {
        fs.unlinkSync(session.tempPath);
      }
      uploadSessions.delete(key);
    }
  }
}, 60 * 60 * 1000); // Check every hour
```

## Complete Example: Production-Grade File Upload Service

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

// Configuration
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

// Ensure directories exist
[config.uploadDir, config.tempDir].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Processing queue
const processingQueue = new Bull('file-processing', process.env.REDIS_URL);

// Multer configuration
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

// File validation service
class FileValidator {
  static async validate(filePath, declaredMime) {
    const errors = [];

    // Detect actual file type
    const detected = await fileType.fromFile(filePath);

    if (!detected) {
      errors.push('Cannot identify file type');
      return { valid: false, errors };
    }

    // Validate MIME type
    if (!config.allowedMimeTypes.includes(detected.mime)) {
      errors.push(`Unsupported file type: ${detected.mime}`);
    }

    // Type match check
    if (detected.mime !== declaredMime) {
      errors.push(`File type mismatch: declared ${declaredMime}, actual ${detected.mime}`);
    }

    // Additional image validation
    if (detected.mime.startsWith('image/')) {
      try {
        const metadata = await sharp(filePath).metadata();
        if (metadata.width > config.imageMaxDimension ||
            metadata.height > config.imageMaxDimension) {
          errors.push('Image dimensions exceed limit');
        }
      } catch (err) {
        errors.push('Invalid image file');
      }
    }

    return {
      valid: errors.length === 0,
      detectedType: detected,
      errors
    };
  }
}

// Storage service
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

// Upload handling middleware
const handleUpload = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please select a file' });
  }

  try {
    // 1. Validate file
    const validation = await FileValidator.validate(
      req.file.path,
      req.file.mimetype
    );

    if (!validation.valid) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'File validation failed',
        details: validation.errors
      });
    }

    // 2. Generate storage key
    const userId = req.user?.id || 'anonymous';
    const storageKey = StorageService.generateKey(req.file.originalname, userId);

    // 3. Upload to storage
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

    // 4. Clean up temporary file
    fs.unlinkSync(req.file.path);

    // 5. Add to processing queue (if image)
    let processingJobId = null;
    if (validation.detectedType.mime.startsWith('image/')) {
      const job = await processingQueue.add('generate-thumbnails', {
        key: storageKey,
        mimeType: validation.detectedType.mime
      });
      processingJobId = job.id;
    }

    // 6. Return result
    req.uploadResult = {
      key: storageKey,
      originalName: req.file.originalname,
      mimeType: validation.detectedType.mime,
      size: req.file.size,
      processingJobId
    };

    next();
  } catch (err) {
    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};

// API routes
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

// Get presigned download URL
app.get('/api/files/:key/download-url', async (req, res) => {
  const { key } = req.params;

  // Verify user permissions...

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

// Error handling
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds limit' });
    }
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`File upload service running on port ${PORT}`);
});
```

## Interview Key Points

### Common Interview Questions

**1. How to prevent malicious file uploads?**

- Validate file types (check magic numbers, don't just rely on extension and MIME type)
- Limit file size
- Use virus scanning
- Rename files, use random filenames
- Separate upload directory from application code
- Disable execute permissions on upload directory

**2. How to optimize large file uploads?**

- Use stream processing to avoid loading entire file into memory
- Implement chunked uploads with resume capability
- Use presigned URLs for client direct upload to cloud storage
- Background queue processing for time-consuming operations like file conversion

**3. How to implement resume uploads?**

- Client calculates file hash as unique identifier
- Server records uploaded bytes or chunks
- Use Content-Range header to specify upload position
- Support endpoint for querying upload progress

**4. What are the advantages of presigned URLs?**

- Reduce server bandwidth pressure
- Client connects directly to cloud storage, improving upload speed
- Temporary authorization, automatically expires
- Can limit upload size and type

### Performance Optimization Tips

1. **Use CDN to accelerate file downloads**
2. **Lazy loading and progressive loading for images**
3. **Generate multiple thumbnail sizes**
4. **Use modern image formats like WebP**
5. **Implement file deduplication (based on content hash)**
6. **Set reasonable caching strategies**

## Further Reading

### Official Documentation

- [Multer Documentation](https://github.com/expressjs/multer)
- [AWS S3 JavaScript SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [FastAPI File Upload](https://fastapi.tiangolo.com/tutorial/request-files/)

### Related Technologies

- **tus Protocol**: Open resumable upload protocol
- **MinIO**: S3-compatible open-source object storage
- **ImageMagick/Sharp**: Image processing libraries
- **FFmpeg**: Video processing tool

### Cloud Service Comparison

| Feature | AWS S3 | Google Cloud Storage | Azure Blob |
|------|--------|---------------------|------------|
| Global Coverage | Excellent | Excellent | Excellent |
| Pricing | Medium | Medium | Medium |
| Integration | High | High | High |
| Multipart Upload | Supported | Supported | Supported |
| Lifecycle Management | Supported | Supported | Supported |

---

> File upload is a feature that seems simple but requires consideration of many details in backend development. From security validation to performance optimization, from local storage to cloud service integration, each aspect needs careful design. Choose appropriate solutions based on specific requirements in your projects and keep following security updates and best practices.
