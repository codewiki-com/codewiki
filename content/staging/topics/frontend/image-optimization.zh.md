---
title: 图片优化
description: 学习Web图片优化技术
track: frontend
section: performance
difficulty: intermediate
tags:
  - 图片优化
  - 性能
  - WebP
  - 懒加载
status: imported
origin: old/src/content/docs/frontend/image-optimization.zh.md
divergence: 0.233
issues: []
legacy:
  category: Frontend
  subcategory: Performance
  order: 50
  lastUpdated: 2026-01-07
---

## 概念解释

图片优化是前端性能优化中最重要的环节之一。在大多数网站中，图片资源占据了总页面大小的 50% 以上。通过合理的图片优化策略，可以显著减少页面加载时间，提升用户体验，同时降低带宽成本。

### 为什么图片优化如此重要？

1. **页面加载速度** - 优化后的图片可将加载时间减少 30-70%
2. **用户体验** - 更快的图片加载意味着更低的跳出率
3. **SEO 影响** - Core Web Vitals 中的 LCP 指标与图片加载密切相关
4. **带宽成本** - 减少图片体积可大幅降低服务器流量费用
5. **移动端友好** - 对网络条件较差的移动用户尤为重要

---

## 现代图片格式

### WebP 格式

WebP 是 Google 开发的现代图片格式，相比传统的 JPEG 和 PNG 格式具有更好的压缩效率。

**优势：**
- 有损压缩比 JPEG 小 25-35%
- 无损压缩比 PNG 小 26%
- 支持透明通道（Alpha 通道）
- 支持动画（替代 GIF）

```html
<!-- 使用 picture 元素实现渐进增强 -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="示例图片" width="800" height="600">
</picture>
```

```javascript
// 检测 WebP 支持
function supportsWebP() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  });
}

// 使用示例
supportsWebP().then((supported) => {
  if (supported) {
    console.log('浏览器支持 WebP');
  } else {
    console.log('浏览器不支持 WebP，使用 JPEG/PNG');
  }
});
```

### AVIF 格式

AVIF（AV1 Image File Format）是基于 AV1 视频编解码器的新一代图片格式，压缩效率比 WebP 更高。

**优势：**
- 比 WebP 压缩率高 20-30%
- 支持 HDR 和宽色域
- 支持透明通道和动画
- 图片质量更高

**劣势：**
- 编码速度较慢
- 浏览器支持度略低于 WebP

```html
<!-- 多格式降级策略 -->
<picture>
  <!-- 最优先：AVIF -->
  <source srcset="image.avif" type="image/avif">
  <!-- 次优先：WebP -->
  <source srcset="image.webp" type="image/webp">
  <!-- 降级：JPEG -->
  <img src="image.jpg" alt="产品图片" loading="lazy">
</picture>
```

### 格式选择指南

| 使用场景 | 推荐格式 | 原因 |
|---------|---------|------|
| 照片/复杂图像 | AVIF > WebP > JPEG | 高压缩率，保持质量 |
| 需要透明背景 | AVIF > WebP > PNG | 支持 Alpha 通道 |
| 简单图标/Logo | SVG | 矢量无损缩放 |
| 简单动画 | WebP > AVIF > GIF | 更小体积，更好质量 |
| 需要极致兼容性 | JPEG/PNG | 所有浏览器支持 |

---

## 响应式图片

响应式图片技术可以根据设备屏幕大小、分辨率和网络条件，提供最合适的图片资源。

### srcset 和 sizes 属性

```html
<!-- 基于宽度的响应式图片 -->
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w,
    image-1600.jpg 1600w
  "
  sizes="
    (max-width: 400px) 100vw,
    (max-width: 800px) 80vw,
    (max-width: 1200px) 60vw,
    800px
  "
  alt="响应式图片示例"
>
```

```html
<!-- 基于像素密度的响应式图片 -->
<img
  src="logo.png"
  srcset="
    logo.png 1x,
    logo@2x.png 2x,
    logo@3x.png 3x
  "
  alt="公司 Logo"
>
```

### 使用 picture 元素进行艺术指导

```html
<!-- 不同断点使用不同裁剪/构图的图片 -->
<picture>
  <!-- 移动端：竖版裁剪 -->
  <source
    media="(max-width: 767px)"
    srcset="hero-mobile.webp"
    type="image/webp"
  >
  <source
    media="(max-width: 767px)"
    srcset="hero-mobile.jpg"
  >

  <!-- 平板：方形裁剪 -->
  <source
    media="(max-width: 1023px)"
    srcset="hero-tablet.webp"
    type="image/webp"
  >
  <source
    media="(max-width: 1023px)"
    srcset="hero-tablet.jpg"
  >

  <!-- 桌面端：横版全幅 -->
  <source
    srcset="hero-desktop.webp"
    type="image/webp"
  >
  <img src="hero-desktop.jpg" alt="首页横幅">
</picture>
```

---

## 懒加载技术

懒加载（Lazy Loading）是指延迟加载视口外的图片，只在用户即将看到时才开始加载，从而减少初始页面加载时间。

### 原生懒加载

```html
<!-- HTML 原生懒加载 - 推荐方式 -->
<img
  src="product.jpg"
  alt="产品图片"
  loading="lazy"
  width="400"
  height="300"
>

<!-- 首屏关键图片不使用懒加载 -->
<img
  src="hero.jpg"
  alt="首页横幅"
  loading="eager"
  fetchpriority="high"
>
```

### Intersection Observer 实现

```javascript
// 自定义懒加载实现
class ImageLazyLoader {
  constructor(options = {}) {
    this.options = {
      root: null,
      rootMargin: '50px 0px', // 提前 50px 开始加载
      threshold: 0.01,
      ...options
    };

    this.observer = null;
    this.init();
  }

  init() {
    // 检查浏览器支持
    if (!('IntersectionObserver' in window)) {
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );

    // 观察所有懒加载图片
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.observer.observe(img);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    // 创建临时图片预加载
    const tempImg = new Image();

    tempImg.onload = () => {
      img.src = src;
      if (srcset) img.srcset = srcset;
      img.classList.add('loaded');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    };

    tempImg.onerror = () => {
      img.classList.add('error');
      console.error(`图片加载失败: ${src}`);
    };

    tempImg.src = src;
  }

  loadAllImages() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.loadImage(img);
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// 使用
const lazyLoader = new ImageLazyLoader({
  rootMargin: '100px 0px' // 自定义预加载距离
});
```

```html
<!-- 配合使用的 HTML 结构 -->
<img
  data-src="product.jpg"
  data-srcset="product-400.jpg 400w, product-800.jpg 800w"
  src="placeholder.svg"
  alt="产品图片"
  class="lazy-image"
>

<style>
.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image.loaded {
  opacity: 1;
}
</style>
```

### 占位符策略

```javascript
// 低质量图片占位符 (LQIP)
function generateLQIP(imagePath) {
  return `
    <div class="image-wrapper">
      <img
        src="${imagePath}?w=20&blur=10"
        class="lqip"
        alt=""
        aria-hidden="true"
      >
      <img
        data-src="${imagePath}"
        class="full-image"
        loading="lazy"
        alt="产品图片"
      >
    </div>
  `;
}
```

```css
/* LQIP 样式 */
.image-wrapper {
  position: relative;
  overflow: hidden;
}

.lqip {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(20px);
  transform: scale(1.1);
  transition: opacity 0.3s ease;
}

.full-image {
  position: relative;
  width: 100%;
  height: auto;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.full-image.loaded {
  opacity: 1;
}

.full-image.loaded + .lqip,
.image-wrapper:has(.full-image.loaded) .lqip {
  opacity: 0;
}
```

---

## CDN 图片分发

使用 CDN（内容分发网络）可以将图片缓存到全球各地的边缘节点，让用户从最近的节点获取图片，大幅降低延迟。

### 图片 CDN 服务

```javascript
// Cloudinary URL 构建
function cloudinaryUrl(publicId, options = {}) {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;

  const transformations = [
    width && `w_${width}`,
    height && `h_${height}`,
    `q_${quality}`,
    `f_${format}`,
    crop && `c_${crop}`
  ].filter(Boolean).join(',');

  return `https://res.cloudinary.com/your-cloud/image/upload/${transformations}/${publicId}`;
}

// 使用示例
const imageUrl = cloudinaryUrl('products/shoe-001', {
  width: 800,
  height: 600,
  quality: 80,
  format: 'webp'
});
// 输出: https://res.cloudinary.com/your-cloud/image/upload/w_800,h_600,q_80,f_webp,c_fill/products/shoe-001
```

```javascript
// imgix URL 构建
function imgixUrl(imagePath, params = {}) {
  const baseUrl = 'https://your-domain.imgix.net';
  const searchParams = new URLSearchParams({
    auto: 'format,compress',
    ...params
  });

  return `${baseUrl}${imagePath}?${searchParams}`;
}

// 使用示例
const url = imgixUrl('/images/hero.jpg', {
  w: 1200,
  h: 600,
  fit: 'crop',
  q: 75
});
```

### 自建 CDN 配置

```nginx
# Nginx 图片缓存配置
server {
    listen 80;
    server_name images.example.com;

    location ~* \.(jpg|jpeg|png|gif|webp|avif|svg)$ {
        # 缓存配置
        expires 1y;
        add_header Cache-Control "public, immutable";

        # 启用 gzip 压缩（SVG）
        gzip on;
        gzip_types image/svg+xml;

        # 启用 CORS
        add_header Access-Control-Allow-Origin "*";

        # 安全头
        add_header X-Content-Type-Options "nosniff";
    }

    # WebP 自动转换
    location ~* ^(.+)\.(jpg|jpeg|png)$ {
        set $webp_suffix "";
        if ($http_accept ~* "webp") {
            set $webp_suffix ".webp";
        }
        try_files $1$webp_suffix $uri =404;
    }
}
```

---

## Next.js Image 组件

Next.js 提供了内置的 `Image` 组件，自动处理图片优化、响应式、懒加载等功能。

### 基础用法

```jsx
import Image from 'next/image';

// 本地图片（自动获取尺寸）
import heroImage from '@/public/images/hero.jpg';

export default function Hero() {
  return (
    <Image
      src={heroImage}
      alt="首页横幅"
      placeholder="blur" // 自动生成模糊占位符
      priority // 首屏关键图片
    />
  );
}
```

```jsx
// 远程图片
export default function ProductImage({ product }) {
  return (
    <Image
      src={product.imageUrl}
      alt={product.name}
      width={400}
      height={300}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
    />
  );
}
```

### 配置远程图片域名

```javascript
// next.config.js
module.exports = {
  images: {
    // 允许的远程图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
        port: '',
        pathname: '/products/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
    ],

    // 自定义设备尺寸断点
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // 图片尺寸断点
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // 输出格式
    formats: ['image/avif', 'image/webp'],

    // 缓存时间
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 天
  },
};
```

### 自定义加载器

```jsx
// 使用 Cloudinary 作为图片优化服务
const cloudinaryLoader = ({ src, width, quality }) => {
  const params = [
    `w_${width}`,
    `q_${quality || 'auto'}`,
    'f_auto',
    'c_limit'
  ];
  return `https://res.cloudinary.com/your-cloud/image/upload/${params.join(',')}${src}`;
};

export default function CloudinaryImage({ src, alt, ...props }) {
  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      alt={alt}
      {...props}
    />
  );
}
```

### 填充容器模式

```jsx
// fill 模式 - 图片填满父容器
export default function BackgroundImage() {
  return (
    <div className="relative h-96 w-full">
      <Image
        src="/images/background.jpg"
        alt="背景图"
        fill
        style={{ objectFit: 'cover' }}
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-black/50">
        <h1 className="text-white">标题内容</h1>
      </div>
    </div>
  );
}
```

---

## 图片压缩工具

### 构建时压缩

```javascript
// vite.config.js - 使用 vite-plugin-imagemin
import { defineConfig } from 'vite';
import imagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    imagemin({
      gifsicle: {
        optimizationLevel: 3,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 80,
      },
      pngquant: {
        quality: [0.65, 0.9],
        speed: 4,
      },
      webp: {
        quality: 80,
      },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true },
        ],
      },
    }),
  ],
});
```

```javascript
// webpack 配置 - 使用 image-minimizer-webpack-plugin
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.sharpMinify,
          options: {
            encodeOptions: {
              jpeg: { quality: 80 },
              webp: { quality: 80 },
              avif: { quality: 65 },
              png: { quality: 80 },
            },
          },
        },
        generator: [
          {
            // 生成 WebP 版本
            preset: 'webp',
            implementation: ImageMinimizerPlugin.sharpGenerate,
            options: {
              encodeOptions: {
                webp: { quality: 80 },
              },
            },
          },
        ],
      }),
    ],
  },
};
```

### 使用 Sharp 进行服务端压缩

```javascript
// image-processor.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageProcessor {
  constructor(options = {}) {
    this.options = {
      quality: 80,
      outputDir: './optimized',
      ...options
    };
  }

  // 处理单张图片
  async processImage(inputPath) {
    const filename = path.basename(inputPath, path.extname(inputPath));
    const outputDir = this.options.outputDir;

    await fs.mkdir(outputDir, { recursive: true });

    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const results = [];

    // 生成多种尺寸
    const sizes = [400, 800, 1200, 1600];

    for (const width of sizes) {
      if (width > metadata.width) continue;

      // JPEG 版本
      const jpegPath = path.join(outputDir, `${filename}-${width}.jpg`);
      await image
        .clone()
        .resize(width)
        .jpeg({ quality: this.options.quality, mozjpeg: true })
        .toFile(jpegPath);
      results.push(jpegPath);

      // WebP 版本
      const webpPath = path.join(outputDir, `${filename}-${width}.webp`);
      await image
        .clone()
        .resize(width)
        .webp({ quality: this.options.quality })
        .toFile(webpPath);
      results.push(webpPath);

      // AVIF 版本
      const avifPath = path.join(outputDir, `${filename}-${width}.avif`);
      await image
        .clone()
        .resize(width)
        .avif({ quality: Math.round(this.options.quality * 0.8) })
        .toFile(avifPath);
      results.push(avifPath);
    }

    return results;
  }

  // 批量处理
  async processDirectory(inputDir) {
    const files = await fs.readdir(inputDir);
    const imageFiles = files.filter(f =>
      /\.(jpg|jpeg|png|gif)$/i.test(f)
    );

    const results = [];
    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const processed = await this.processImage(inputPath);
      results.push(...processed);
      console.log(`已处理: ${file}`);
    }

    return results;
  }

  // 生成模糊占位符
  async generatePlaceholder(inputPath, width = 20) {
    const buffer = await sharp(inputPath)
      .resize(width)
      .blur(5)
      .toBuffer();

    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }
}

// 使用示例
const processor = new ImageProcessor({ quality: 85 });
processor.processDirectory('./images/products');
```

### CLI 工具推荐

```bash
# 使用 squoosh-cli 压缩图片
npx @squoosh/cli --webp '{"quality":80}' --avif '{"cqLevel":30}' input.jpg

# 使用 imagemin-cli
npx imagemin images/* --out-dir=optimized --plugin=mozjpeg --plugin=pngquant

# 使用 sharp-cli 批量转换
npx sharp-cli -i "images/*.jpg" -o optimized -f webp -q 80
```

---

## 性能影响分析

### 优化前后对比

```javascript
// 性能监控工具
class ImagePerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.init();
  }

  init() {
    // 监控图片加载性能
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'img') {
          this.metrics.push({
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize,
            decodedBodySize: entry.decodedBodySize,
            startTime: entry.startTime,
            responseEnd: entry.responseEnd,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  getReport() {
    const totalImages = this.metrics.length;
    const totalSize = this.metrics.reduce((sum, m) => sum + m.transferSize, 0);
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalImages;

    return {
      totalImages,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      avgDuration: `${avgDuration.toFixed(2)} ms`,
      images: this.metrics.sort((a, b) => b.transferSize - a.transferSize),
    };
  }

  logLargeImages(threshold = 100 * 1024) { // 100KB
    const largeImages = this.metrics.filter(m => m.transferSize > threshold);

    if (largeImages.length > 0) {
      console.warn('以下图片体积过大，建议优化:');
      largeImages.forEach(img => {
        console.warn(`- ${img.name}: ${(img.transferSize / 1024).toFixed(2)} KB`);
      });
    }
  }
}

// 使用
const monitor = new ImagePerformanceMonitor();
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log(monitor.getReport());
    monitor.logLargeImages();
  }, 1000);
});
```

### Core Web Vitals 影响

```javascript
// 测量 LCP（最大内容绘制）
function measureLCP() {
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];

    console.log('LCP:', lastEntry.startTime);
    console.log('LCP 元素:', lastEntry.element);

    // 如果 LCP 元素是图片，记录详情
    if (lastEntry.element?.tagName === 'IMG') {
      const img = lastEntry.element;
      console.log('LCP 图片信息:', {
        src: img.src,
        loading: img.loading,
        fetchPriority: img.fetchPriority,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
}

measureLCP();
```

### 优化效果量化

| 优化措施 | 体积减少 | LCP 改善 | 备注 |
|---------|---------|---------|------|
| JPEG -> WebP | 25-35% | 15-25% | 广泛支持 |
| JPEG -> AVIF | 45-55% | 25-35% | 现代浏览器 |
| 响应式图片 | 30-50% | 20-30% | 按设备加载 |
| 懒加载 | - | 40-60% | 减少首屏资源 |
| CDN 分发 | - | 30-50% | 降低网络延迟 |
| 压缩优化 | 20-40% | 10-20% | 无损/有损压缩 |

---

## 最佳实践总结

### 图片优化清单

```markdown
## 格式选择
- [ ] 使用 WebP 作为主要格式
- [ ] 考虑 AVIF 用于现代浏览器
- [ ] 提供 JPEG/PNG 作为降级方案
- [ ] 使用 SVG 处理图标和简单图形

## 响应式处理
- [ ] 使用 srcset 提供多种尺寸
- [ ] 使用 sizes 属性指导浏览器选择
- [ ] 考虑 2x/3x 高分屏适配
- [ ] 使用 picture 元素进行艺术指导

## 加载策略
- [ ] 首屏图片使用 loading="eager"
- [ ] 非首屏图片使用 loading="lazy"
- [ ] 关键图片添加 fetchpriority="high"
- [ ] 使用占位符改善感知性能

## 尺寸与质量
- [ ] 设置明确的 width/height 避免布局偏移
- [ ] 压缩质量控制在 75-85 之间
- [ ] 避免上传超过显示尺寸的图片
- [ ] 定期审计大体积图片

## 交付优化
- [ ] 使用 CDN 加速分发
- [ ] 配置适当的缓存策略
- [ ] 启用 HTTP/2 或 HTTP/3
- [ ] 考虑使用图片优化服务
```

### React 组件示例

```jsx
// OptimizedImage.jsx - 完整的图片优化组件
import { useState, useRef, useEffect } from 'react';

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  className = '',
  onLoad,
  onError,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // 生成 srcset
  const generateSrcSet = (baseSrc) => {
    const widths = [400, 800, 1200, 1600];
    const extension = baseSrc.split('.').pop();
    const basePath = baseSrc.replace(`.${extension}`, '');

    return widths
      .map(w => `${basePath}-${w}.webp ${w}w`)
      .join(', ');
  };

  // 处理加载完成
  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  // 处理加载错误
  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  // 计算宽高比
  const aspectRatio = height && width ? height / width : undefined;

  return (
    <div
      className={`optimized-image-wrapper ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...(aspectRatio && {
          paddingBottom: `${aspectRatio * 100}%`,
        }),
      }}
    >
      {/* 模糊占位符 */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            transition: 'opacity 0.3s ease',
            opacity: isLoaded ? 0 : 1,
          }}
        />
      )}

      {/* 主图片 */}
      <picture>
        <source
          srcSet={generateSrcSet(src).replace(/\.webp/g, '.avif')}
          type="image/avif"
          sizes={sizes}
        />
        <source
          srcSet={generateSrcSet(src)}
          type="image/webp"
          sizes={sizes}
        />
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            position: aspectRatio ? 'absolute' : 'relative',
            inset: aspectRatio ? 0 : undefined,
            width: '100%',
            height: aspectRatio ? '100%' : 'auto',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      </picture>

      {/* 错误状态 */}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
          }}
        >
          <span>图片加载失败</span>
        </div>
      )}
    </div>
  );
}
```

---

## 延伸阅读

- [Web.dev - 优化图片](https://web.dev/fast/#optimize-your-images) - Google 官方图片优化指南
- [Squoosh](https://squoosh.app/) - Google 开源的在线图片压缩工具
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization) - Next.js 图片优化文档
- [Cloudinary 文档](https://cloudinary.com/documentation) - 云端图片优化服务
- [Sharp 文档](https://sharp.pixelplumbing.com/) - Node.js 高性能图片处理库
