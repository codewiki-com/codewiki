---
title: Image Optimization
description: Learn web image optimization techniques
track: frontend
section: performance
difficulty: intermediate
tags:
  - image optimization
  - performance
  - WebP
  - lazy loading
status: imported
origin: old/src/content/docs/frontend/image-optimization.en.md
divergence: 0.233
issues: []
legacy:
  category: Frontend
  subcategory: Performance
  order: 50
  lastUpdated: 2026-01-07
---

## Introduction

Images typically account for the largest portion of page weight on modern websites, often representing 50% or more of total bytes transferred. Optimizing images is one of the most impactful performance improvements you can make, directly affecting page load times, bandwidth consumption, and Core Web Vitals scores like LCP (Largest Contentful Paint).

Effective image optimization involves choosing the right format, serving appropriately sized images, implementing lazy loading, and leveraging CDNs for efficient delivery. We cover all essential techniques for delivering high-quality images with minimal performance impact.

### Why Image Optimization Matters

1. **Faster Page Loads** - Smaller images download faster, improving user experience
2. **Better Core Web Vitals** - Optimized images directly improve LCP scores
3. **Reduced Bandwidth Costs** - Smaller files mean lower CDN and hosting costs
4. **Improved SEO** - Page speed is a ranking factor for search engines
5. **Better Mobile Experience** - Mobile users benefit most from optimized images

---

## Modern Image Formats

### JPEG and PNG: The Classics

Traditional formats still have their place, but understanding when to use each is crucial.

```html
<!-- JPEG: Best for photographs with many colors -->
<img src="/photos/landscape.jpg" alt="Mountain landscape" />

<!-- PNG: Best for images requiring transparency or sharp edges -->
<img src="/icons/logo.png" alt="Company logo" />
```

**JPEG Characteristics:**
- Lossy compression with adjustable quality
- No transparency support
- Best for photographs and complex images
- Typical quality setting: 75-85% for good balance

**PNG Characteristics:**
- Lossless compression (PNG-24) or indexed color (PNG-8)
- Full alpha transparency support
- Best for logos, icons, and graphics with sharp edges
- Larger file sizes than JPEG for photos

### WebP: The Modern Standard

WebP provides superior compression for both lossy and lossless images, typically 25-35% smaller than equivalent JPEG or PNG files.

```html
<!-- Using WebP with fallback -->
<picture>
  <source srcset="/images/hero.webp" type="image/webp" />
  <source srcset="/images/hero.jpg" type="image/jpeg" />
  <img src="/images/hero.jpg" alt="Hero image" width="1200" height="600" />
</picture>
```

**WebP Advantages:**
- Superior compression (25-35% smaller than JPEG)
- Supports both lossy and lossless compression
- Alpha transparency support (unlike JPEG)
- Animation support (alternative to GIF)
- 97%+ browser support (all modern browsers)

```javascript
// Check WebP support programmatically
function supportsWebP() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// Feature detection with async/await
async function checkWebPSupport() {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}
```

### AVIF: Next-Generation Format

AVIF offers even better compression than WebP, typically 50% smaller than JPEG, making it the best choice for maximum compression.

```html
<!-- AVIF with progressive enhancement -->
<picture>
  <!-- AVIF: Best compression, newest format -->
  <source srcset="/images/product.avif" type="image/avif" />
  <!-- WebP: Good compression, wide support -->
  <source srcset="/images/product.webp" type="image/webp" />
  <!-- JPEG: Universal fallback -->
  <img
    src="/images/product.jpg"
    alt="Product photo"
    width="800"
    height="600"
    loading="lazy"
  />
</picture>
```

**AVIF Characteristics:**
- Best-in-class compression (50% smaller than JPEG)
- Based on AV1 video codec
- Supports HDR and wide color gamut
- Alpha transparency support
- Growing browser support (~92%)
- Slower encoding time than WebP

**Format Comparison:**

| Format | Compression | Transparency | Animation | Browser Support |
|--------|-------------|--------------|-----------|-----------------|
| JPEG   | Good        | No           | No        | 100%            |
| PNG    | Moderate    | Yes          | No        | 100%            |
| WebP   | Better      | Yes          | Yes       | 97%+            |
| AVIF   | Best        | Yes          | Yes       | 92%+            |

### SVG for Vector Graphics

SVG is ideal for icons, logos, and illustrations that need to scale without quality loss.

```html
<!-- Inline SVG for styling and animation -->
<svg
  viewBox="0 0 24 24"
  width="24"
  height="24"
  fill="currentColor"
  aria-label="Menu icon"
>
  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
</svg>

<!-- External SVG file -->
<img src="/icons/logo.svg" alt="Logo" width="200" height="50" />
```

```javascript
// SVG optimization with SVGO
// svgo.config.js
module.exports = {
  plugins: [
    'preset-default',
    'removeDimensions',
    {
      name: 'removeAttrs',
      params: { attrs: '(stroke|fill)' }
    },
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [{ 'aria-hidden': 'true' }]
      }
    }
  ]
};
```

---

## Responsive Images

### The srcset Attribute

Use `srcset` to serve different image sizes based on device capabilities.

```html
<!-- Width descriptors (w) -->
<img
  src="/images/hero-800.jpg"
  srcset="
    /images/hero-400.jpg 400w,
    /images/hero-800.jpg 800w,
    /images/hero-1200.jpg 1200w,
    /images/hero-1600.jpg 1600w
  "
  sizes="(max-width: 600px) 100vw,
         (max-width: 1200px) 50vw,
         800px"
  alt="Hero image"
  width="1600"
  height="900"
/>

<!-- Pixel density descriptors (x) -->
<img
  src="/images/logo.png"
  srcset="
    /images/logo.png 1x,
    /images/logo@2x.png 2x,
    /images/logo@3x.png 3x
  "
  alt="Company logo"
  width="200"
  height="50"
/>
```

**Understanding the sizes Attribute:**

```html
<img
  srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"
  sizes="
    (max-width: 400px) 100vw,   /* On small screens, image is 100% viewport width */
    (max-width: 800px) 50vw,    /* On medium screens, image is 50% viewport width */
    33vw                         /* On large screens, image is 33% viewport width */
  "
  src="medium.jpg"
  alt="Responsive image"
/>
```

### The Picture Element

Use `<picture>` for art direction and format fallbacks.

```html
<!-- Art direction: Different crops for different screens -->
<picture>
  <!-- Mobile: Square crop -->
  <source
    media="(max-width: 767px)"
    srcset="/images/hero-mobile.webp 1x, /images/hero-mobile@2x.webp 2x"
    type="image/webp"
  />
  <source
    media="(max-width: 767px)"
    srcset="/images/hero-mobile.jpg 1x, /images/hero-mobile@2x.jpg 2x"
  />

  <!-- Tablet: 4:3 crop -->
  <source
    media="(max-width: 1023px)"
    srcset="/images/hero-tablet.webp 1x, /images/hero-tablet@2x.webp 2x"
    type="image/webp"
  />
  <source
    media="(max-width: 1023px)"
    srcset="/images/hero-tablet.jpg 1x, /images/hero-tablet@2x.jpg 2x"
  />

  <!-- Desktop: Wide banner -->
  <source
    srcset="/images/hero-desktop.webp 1x, /images/hero-desktop@2x.webp 2x"
    type="image/webp"
  />
  <img
    src="/images/hero-desktop.jpg"
    srcset="/images/hero-desktop.jpg 1x, /images/hero-desktop@2x.jpg 2x"
    alt="Hero banner"
    width="1920"
    height="600"
  />
</picture>
```

### CSS Responsive Images

```css
/* Responsive background images */
.hero {
  background-image: url('/images/hero-small.jpg');
  background-size: cover;
  background-position: center;
}

@media (min-width: 768px) {
  .hero {
    background-image: url('/images/hero-medium.jpg');
  }
}

@media (min-width: 1200px) {
  .hero {
    background-image: url('/images/hero-large.jpg');
  }
}

/* Using image-set for background images */
.hero-modern {
  background-image: image-set(
    url('/images/hero.avif') type('image/avif'),
    url('/images/hero.webp') type('image/webp'),
    url('/images/hero.jpg') type('image/jpeg')
  );
}

/* Responsive image with aspect ratio */
.image-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

---

## Lazy Loading

### Native Lazy Loading

The simplest way to implement lazy loading using the browser's built-in capability.

```html
<!-- Native lazy loading -->
<img
  src="/images/photo.jpg"
  loading="lazy"
  alt="Photo"
  width="800"
  height="600"
/>

<!-- Eager loading for above-the-fold images -->
<img
  src="/images/hero.jpg"
  loading="eager"
  fetchpriority="high"
  alt="Hero image"
  width="1200"
  height="600"
/>

<!-- Lazy loading iframes -->
<iframe
  src="https://www.youtube.com/embed/video-id"
  loading="lazy"
  width="560"
  height="315"
  title="Video title"
></iframe>
```

**Best Practices for Native Lazy Loading:**
- Always include `width` and `height` attributes to prevent layout shift
- Use `loading="eager"` for above-the-fold images
- Combine with `fetchpriority="high"` for LCP images
- Works in all modern browsers (95%+ support)

### Intersection Observer Implementation

For more control over lazy loading behavior, use the Intersection Observer API.

```javascript
// Custom lazy loading with Intersection Observer
class LazyLoader {
  constructor(options = {}) {
    this.options = {
      root: null,
      rootMargin: '100px 0px', // Start loading 100px before visible
      threshold: 0.01,
      ...options
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
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

    if (srcset) {
      img.srcset = srcset;
    }

    if (src) {
      img.src = src;
    }

    img.classList.add('loaded');
  }

  observe(elements) {
    elements.forEach(el => this.observer.observe(el));
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// Usage
const lazyLoader = new LazyLoader({ rootMargin: '200px 0px' });
const lazyImages = document.querySelectorAll('img[data-src]');
lazyLoader.observe(lazyImages);
```

```html
<!-- HTML for custom lazy loading -->
<img
  data-src="/images/photo.jpg"
  data-srcset="/images/photo-400.jpg 400w, /images/photo-800.jpg 800w"
  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3C/svg%3E"
  alt="Photo"
  class="lazy"
  width="800"
  height="600"
/>
```

### React Lazy Loading Component

```javascript
import { useState, useRef, useEffect } from 'react';

function LazyImage({
  src,
  srcSet,
  alt,
  width,
  height,
  placeholder = null,
  className = '',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {!isLoaded && (
        placeholder || (
          <div
            className="placeholder"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0'
            }}
          />
        )
      )}

      {isInView && (
        <img
          src={src}
          srcSet={srcSet}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          {...props}
        />
      )}
    </div>
  );
}

// CSS for lazy image
const styles = `
  .lazy-image-container {
    position: relative;
    overflow: hidden;
  }

  .lazy-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }

  .lazy-image.loading {
    opacity: 0;
  }

  .lazy-image.loaded {
    opacity: 1;
  }
`;
```

### Progressive Image Loading

Implement blur-up technique for smooth image loading experience.

```javascript
function ProgressiveImage({
  lowResSrc,
  highResSrc,
  alt,
  width,
  height
}) {
  const [currentSrc, setCurrentSrc] = useState(lowResSrc);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = highResSrc;
    img.onload = () => {
      setCurrentSrc(highResSrc);
      setIsHighResLoaded(true);
    };
  }, [highResSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      style={{
        filter: isHighResLoaded ? 'none' : 'blur(10px)',
        transition: 'filter 0.3s ease-out'
      }}
    />
  );
}

// Generate low-res placeholder
// Can be done server-side or build-time
function generatePlaceholder(imagePath) {
  // Return a tiny (20-40px wide) version of the image
  // Often encoded as base64 data URL
  return `data:image/jpeg;base64,/9j/4AAQSkZJRg...`;
}
```

---

## CDN Delivery

### Image CDN Configuration

Image CDNs provide on-the-fly image optimization, resizing, and format conversion.

```javascript
// Cloudinary URL construction
function getCloudinaryUrl(publicId, options = {}) {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto'
  } = options;

  const transformations = [
    width && `w_${width}`,
    height && `h_${height}`,
    `q_${quality}`,
    `f_${format}`,
    crop && `c_${crop}`,
    gravity && `g_${gravity}`
  ].filter(Boolean).join(',');

  return `https://res.cloudinary.com/your-cloud/image/upload/${transformations}/${publicId}`;
}

// Usage
const imageUrl = getCloudinaryUrl('products/shoe.jpg', {
  width: 800,
  height: 600,
  quality: 80,
  format: 'webp'
});
// Result: https://res.cloudinary.com/your-cloud/image/upload/w_800,h_600,q_80,f_webp/products/shoe.jpg
```

```javascript
// Imgix URL construction
function getImgixUrl(path, params = {}) {
  const baseUrl = 'https://your-source.imgix.net';
  const searchParams = new URLSearchParams({
    auto: 'format,compress', // Auto format and compression
    fit: 'crop',
    ...params
  });

  return `${baseUrl}${path}?${searchParams.toString()}`;
}

// Usage
const url = getImgixUrl('/images/hero.jpg', {
  w: 1200,
  h: 600,
  q: 80,
  dpr: 2 // Device pixel ratio
});
```

### Cloudflare Image Optimization

```javascript
// Cloudflare Images with Workers
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Check if this is an image request
  if (!url.pathname.startsWith('/images/')) {
    return fetch(request);
  }

  // Parse transformation parameters
  const width = url.searchParams.get('w');
  const quality = url.searchParams.get('q') || 85;
  const format = url.searchParams.get('f') || 'auto';

  // Use Cloudflare Image Resizing
  return fetch(request, {
    cf: {
      image: {
        width: width ? parseInt(width) : undefined,
        quality: parseInt(quality),
        format: format === 'auto' ? undefined : format,
        fit: 'cover',
        metadata: 'none' // Strip metadata
      }
    }
  });
}
```

### Self-Hosted Image Optimization

```javascript
// Sharp-based image optimization API (Node.js)
const sharp = require('sharp');
const express = require('express');
const path = require('path');

const app = express();

app.get('/images/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { w, h, q = 80, f = 'webp' } = req.query;

    const imagePath = path.join(__dirname, 'uploads', filename);

    let pipeline = sharp(imagePath);

    // Resize if dimensions provided
    if (w || h) {
      pipeline = pipeline.resize(
        w ? parseInt(w) : null,
        h ? parseInt(h) : null,
        { fit: 'cover', withoutEnlargement: true }
      );
    }

    // Convert format
    switch (f) {
      case 'webp':
        pipeline = pipeline.webp({ quality: parseInt(q) });
        res.type('image/webp');
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: parseInt(q) });
        res.type('image/avif');
        break;
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality: parseInt(q), progressive: true });
        res.type('image/jpeg');
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9 });
        res.type('image/png');
        break;
    }

    // Set caching headers
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    // Stream the result
    pipeline.pipe(res);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Next.js Image Optimization

### The next/image Component

Next.js provides built-in image optimization with automatic format conversion, resizing, and lazy loading.

```javascript
import Image from 'next/image';

// Basic usage
function HeroSection() {
  return (
    <Image
      src="/images/hero.jpg"
      alt="Hero image"
      width={1200}
      height={600}
      priority // Load immediately, skip lazy loading
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    />
  );
}

// Fill container
function BackgroundImage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      <Image
        src="/images/background.jpg"
        alt="Background"
        fill
        style={{ objectFit: 'cover' }}
        sizes="100vw"
      />
    </div>
  );
}

// Responsive images with sizes
function ResponsiveImage() {
  return (
    <Image
      src="/images/product.jpg"
      alt="Product"
      width={800}
      height={600}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{ width: '100%', height: 'auto' }}
    />
  );
}

// Remote images
function RemoteImage() {
  return (
    <Image
      src="https://cdn.example.com/photos/product.jpg"
      alt="Product from CDN"
      width={500}
      height={500}
      unoptimized={false} // Enable optimization for remote images
    />
  );
}
```

### Next.js Image Configuration

```javascript
// next.config.js
module.exports = {
  images: {
    // Remote image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      }
    ],

    // Custom device sizes for srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Custom image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Output format
    formats: ['image/avif', 'image/webp'],

    // Minimum cache TTL
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days

    // Disable static image imports
    disableStaticImages: false,

    // Use sharp for production
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

### Custom Image Loader

```javascript
// Using Cloudinary as image loader
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.js',
  },
};

// lib/cloudinary-loader.js
export default function cloudinaryLoader({ src, width, quality }) {
  const params = [
    'f_auto',
    'c_limit',
    `w_${width}`,
    `q_${quality || 'auto'}`
  ];

  return `https://res.cloudinary.com/your-cloud/image/upload/${params.join(',')}${src}`;
}

// Usage in component
import Image from 'next/image';

function ProductImage({ product }) {
  return (
    <Image
      src={`/products/${product.id}.jpg`} // Path relative to Cloudinary
      alt={product.name}
      width={400}
      height={400}
      quality={85}
    />
  );
}
```

### Blur Placeholder Generation

```javascript
// Generate blur placeholder at build time
import { getPlaiceholder } from 'plaiceholder';
import Image from 'next/image';

// In getStaticProps or getServerSideProps
export async function getStaticProps() {
  const imagePath = '/public/images/hero.jpg';

  const { base64, img } = await getPlaiceholder(imagePath);

  return {
    props: {
      imageProps: {
        ...img,
        blurDataURL: base64,
      },
    },
  };
}

// In component
function HeroWithBlur({ imageProps }) {
  return (
    <Image
      {...imageProps}
      alt="Hero image"
      placeholder="blur"
      priority
    />
  );
}
```

---

## Image Compression Tools

### Build-Time Compression

```javascript
// Vite with vite-plugin-imagemin
// vite.config.js
import { defineConfig } from 'vite';
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 80,
        progressive: true,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      webp: {
        quality: 80,
      },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true },
          { name: 'cleanupIds', active: true },
        ],
      },
    }),
  ],
});
```

```javascript
// Webpack with image-minimizer-webpack-plugin
// webpack.config.js
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.sharpMinify,
          options: {
            encodeOptions: {
              jpeg: { quality: 80, progressive: true },
              webp: { quality: 80 },
              avif: { quality: 65 },
              png: { compressionLevel: 9 },
            },
          },
        },
        generator: [
          {
            preset: 'webp',
            implementation: ImageMinimizerPlugin.sharpGenerate,
            options: {
              encodeOptions: { webp: { quality: 80 } },
            },
          },
          {
            preset: 'avif',
            implementation: ImageMinimizerPlugin.sharpGenerate,
            options: {
              encodeOptions: { avif: { quality: 65 } },
            },
          },
        ],
      }),
    ],
  },
};
```

### Sharp for Node.js

```javascript
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function optimizeImage(inputPath, outputDir) {
  const filename = path.parse(inputPath).name;

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Generate multiple sizes
  const sizes = [400, 800, 1200, 1600];

  for (const width of sizes) {
    if (width > metadata.width) continue;

    // WebP version
    await image
      .clone()
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(outputDir, `${filename}-${width}.webp`));

    // AVIF version
    await image
      .clone()
      .resize(width, null, { withoutEnlargement: true })
      .avif({ quality: 65 })
      .toFile(path.join(outputDir, `${filename}-${width}.avif`));

    // JPEG fallback
    await image
      .clone()
      .resize(width, null, { withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toFile(path.join(outputDir, `${filename}-${width}.jpg`));
  }
}

// Batch processing
async function processDirectory(inputDir, outputDir) {
  const files = await fs.readdir(inputDir);
  const imageFiles = files.filter(f =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  );

  await fs.mkdir(outputDir, { recursive: true });

  for (const file of imageFiles) {
    console.log(`Processing: ${file}`);
    await optimizeImage(
      path.join(inputDir, file),
      outputDir
    );
  }
}
```

### Squoosh CLI

```bash
# Install Squoosh CLI
npm install -g @squoosh/cli

# Compress to WebP
squoosh-cli --webp '{"quality":80}' -d output/ input/*.jpg

# Compress to AVIF
squoosh-cli --avif '{"quality":65}' -d output/ input/*.jpg

# Resize and compress
squoosh-cli --resize '{"width":800}' --webp '{"quality":80}' -d output/ input/*.jpg

# Multiple outputs
squoosh-cli \
  --webp '{"quality":80}' \
  --avif '{"quality":65}' \
  --mozjpeg '{"quality":80}' \
  -d output/ \
  input/*.jpg
```

### Online Tools and APIs

```javascript
// TinyPNG/TinyJPG API
const tinify = require('tinify');
tinify.key = 'YOUR_API_KEY';

async function compressWithTinify(inputPath, outputPath) {
  const source = tinify.fromFile(inputPath);

  // Resize and compress
  const resized = source.resize({
    method: 'fit',
    width: 1200,
    height: 800
  });

  await resized.toFile(outputPath);
}

// Convert to WebP
async function convertToWebP(inputPath, outputPath) {
  const source = tinify.fromFile(inputPath);
  const converted = source.convert({ type: 'image/webp' });
  await converted.toFile(outputPath);
}
```

---

## Performance Impact and Measurement

### Measuring Image Performance

```javascript
// Performance Observer for image loading
const imageObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.initiatorType === 'img') {
      console.log({
        name: entry.name,
        duration: entry.duration,
        transferSize: entry.transferSize,
        decodedBodySize: entry.decodedBodySize,
        // Compression ratio
        compressionRatio: entry.transferSize / entry.decodedBodySize
      });
    }
  }
});

imageObserver.observe({ entryTypes: ['resource'] });

// Measure LCP element
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];

  console.log('LCP:', {
    element: lastEntry.element,
    startTime: lastEntry.startTime,
    size: lastEntry.size,
    url: lastEntry.url
  });
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

### Image Performance Budget

```javascript
// lighthouse-budget.json
{
  "resourceSizes": [
    {
      "resourceType": "image",
      "budget": 500 // Max 500KB total images
    }
  ],
  "resourceCounts": [
    {
      "resourceType": "image",
      "budget": 25 // Max 25 images
    }
  ]
}

// Performance budget check script
async function checkImageBudget(page) {
  const imageStats = await page.evaluate(() => {
    const images = performance.getEntriesByType('resource')
      .filter(r => r.initiatorType === 'img');

    return {
      count: images.length,
      totalSize: images.reduce((sum, img) => sum + img.transferSize, 0),
      largest: Math.max(...images.map(img => img.transferSize)),
      slowest: Math.max(...images.map(img => img.duration))
    };
  });

  const budget = {
    maxCount: 25,
    maxTotalSize: 500 * 1024, // 500KB
    maxSingleSize: 100 * 1024, // 100KB per image
    maxLoadTime: 2000 // 2 seconds
  };

  return {
    passed: imageStats.count <= budget.maxCount &&
            imageStats.totalSize <= budget.maxTotalSize &&
            imageStats.largest <= budget.maxSingleSize &&
            imageStats.slowest <= budget.maxLoadTime,
    stats: imageStats,
    budget
  };
}
```

### Lighthouse Image Audits

```javascript
// Key Lighthouse image audits and their solutions

/*
1. "Properly size images"
   - Serve images at the exact size needed
   - Use srcset for responsive images
   - Avoid serving images larger than display size

2. "Defer offscreen images"
   - Use loading="lazy" for below-fold images
   - Implement Intersection Observer for custom lazy loading

3. "Serve images in next-gen formats"
   - Use WebP or AVIF with fallbacks
   - Configure image CDN for automatic format conversion

4. "Efficiently encode images"
   - Compress images with appropriate quality settings
   - Use progressive JPEG for large images
   - Strip unnecessary metadata

5. "Use video formats for animated content"
   - Replace GIF with video (MP4/WebM)
   - Use CSS animations where possible
*/

// GIF to video conversion
// Command line with FFmpeg
// ffmpeg -i animation.gif -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -pix_fmt yuv420p animation.mp4
// ffmpeg -i animation.gif -c:v libvpx-vp9 -b:v 0 -crf 41 animation.webm

// HTML for video instead of GIF
function AnimatedContent() {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      width={400}
      height={300}
    >
      <source src="/animations/demo.webm" type="video/webm" />
      <source src="/animations/demo.mp4" type="video/mp4" />
      {/* GIF fallback for very old browsers */}
      <img src="/animations/demo.gif" alt="Animation" />
    </video>
  );
}
```

---

## Best Practices Summary

### Image Optimization Checklist

```markdown
## Format Selection
- [ ] Use WebP as primary format with JPEG/PNG fallbacks
- [ ] Consider AVIF for maximum compression where supported
- [ ] Use SVG for icons and simple graphics
- [ ] Convert animated GIFs to video (MP4/WebM)

## Responsive Images
- [ ] Implement srcset with width descriptors
- [ ] Use sizes attribute to guide browser selection
- [ ] Provide 1x, 2x variants for fixed-size images
- [ ] Use <picture> for art direction scenarios

## Lazy Loading
- [ ] Add loading="lazy" to below-fold images
- [ ] Use loading="eager" for LCP images
- [ ] Set fetchpriority="high" for critical images
- [ ] Always include width and height attributes

## Compression
- [ ] Compress images to 80-85% quality for photos
- [ ] Use progressive JPEG for large images
- [ ] Strip metadata from production images
- [ ] Implement build-time optimization

## CDN and Caching
- [ ] Serve images from CDN
- [ ] Set appropriate Cache-Control headers
- [ ] Use immutable for versioned assets
- [ ] Consider image transformation CDN

## Performance Monitoring
- [ ] Track LCP with Web Vitals
- [ ] Monitor CLS for image-related shifts
- [ ] Set image performance budgets
- [ ] Regular Lighthouse audits
```

### Quick Reference

```javascript
// Optimal image element structure
<picture>
  <source
    srcset="/image.avif 1x, /image@2x.avif 2x"
    type="image/avif"
  />
  <source
    srcset="/image.webp 1x, /image@2x.webp 2x"
    type="image/webp"
  />
  <img
    src="/image.jpg"
    srcset="/image.jpg 1x, /image@2x.jpg 2x"
    alt="Descriptive alt text"
    width="800"
    height="600"
    loading="lazy"
    decoding="async"
  />
</picture>

// Critical above-fold image
<img
  src="/hero.webp"
  alt="Hero image"
  width="1200"
  height="600"
  loading="eager"
  fetchpriority="high"
  decoding="sync"
/>
```

---

## Related Resources

- [web.dev - Optimize Images](https://web.dev/fast/#optimize-your-images)
- [MDN - Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Next.js Image Documentation](https://nextjs.org/docs/app/api-reference/components/image)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Squoosh App](https://squoosh.app/)
- [WebP Converter](https://developers.google.com/speed/webp)
