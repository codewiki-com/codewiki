---
title: JavaScript 地理位置 API（Geolocation）
description: 掌握 JavaScript Geolocation API：获取用户位置信息、实现定位功能、处理权限和错误
track: javascript
section: browser
difficulty: intermediate
tags:
  - 地理位置
  - 定位
  - GPS
  - 浏览器API
  - 隐私
  - 位置信息
status: imported
origin: old/src/content/docs/javascript/geolocation.zh.md
divergence: 0.273
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

Geolocation API 是浏览器提供的一个强大功能，允许网页在用户许可的情况下获取用户的地理位置信息。这个 API 可以通过多种方式确定位置，包括 GPS、IP 地址、WiFi 信号强度等。本文将深入讲解 Geolocation API 的原理、使用方法、最佳实践以及在实际应用中的常见问题。

## 概念解释

### 什么是 Geolocation API？

Geolocation API 是 W3C 定义的一个浏览器 API，通过 `navigator.geolocation` 对象提供访问用户地理位置的能力。它提供三个主要方法：

- **getCurrentPosition()**：获取用户当前位置（一次性）
- **watchPosition()**：监听用户位置变化（持续监听）
- **clearWatch()**：停止位置监听

### 位置信息的组成

获取到的位置信息（Position 对象）包含两部分：

**Coordinates 对象（坐标信息）**：
- `latitude`：纬度，范围 -90 到 90
- `longitude`：经度，范围 -180 到 180
- `altitude`：海拔高度（单位：米），可能为 null
- `accuracy`：纬度/经度精度（单位：米）
- `altitudeAccuracy`：海拔精度（单位：米），可能为 null
- `heading`：设备移动方向（0-360 度），可能为 null
- `speed`：设备移动速度（单位：米/秒），可能为 null

**Timestamp**：位置信息获取的时间戳

### 隐私与权限

Geolocation API 涉及用户隐私，因此有以下限制：

- **HTTPS 必需**：仅在 HTTPS 连接上工作（localhost 除外）
- **用户权限**：首次使用需要用户明确同意
- **权限持久化**：浏览器会记住用户的选择（允许或拒绝）
- **权限撤销**：用户可以随时在浏览器设置中更改权限

## 核心原理

### 位置确定的技术

Geolocation API 使用多种技术确定用户位置：

**GPS（全球定位系统）**
- 精度最高，通常 5-10 米
- 需要独立的 GPS 硬件
- 获取时间较长（秒级）
- 耗电量大

**IP 地址定位**
- 基于用户的 IP 地址
- 精度较低，通常在 1 公里以上
- 获取速度快
- 无需额外硬件

**WiFi 定位**
- 基于周围 WiFi 热点信息
- 精度中等，通常 20-100 米
- 获取速度快
- 不依赖 GPS

**蜂窝基站定位**
- 基于移动网络基站信息
- 精度中等，通常 100-1000 米
- 仅在移动设备上可用

浏览器会根据设备能力和用户设置自动选择最合适的技术组合。

### 权限流程

```
用户访问网站
    ↓
网站请求位置权限（调用 getCurrentPosition）
    ↓
浏览器显示权限提示
    ↓
用户选择：允许 / 拒绝 / 忽视
    ↓
如果允许：执行成功回调，返回位置信息
如果拒绝：执行错误回调，返回 PermissionDenied
如果忽视：通常被视为拒绝
```

### 异步处理模式

Geolocation API 完全基于异步回调模式：

```
                ┌─────────────────────┐
                │ getCurrentPosition() │
                └──────────┬──────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
          成功回调              错误回调
       (successCallback)    (errorCallback)
                │                     │
            返回 Position          返回 Error
```

## 核心要点

### 浏览器兼容性

| 浏览器 | 支持情况 | 注意事项 |
|--------|--------|--------|
| Chrome | ✓ 完全支持 | v5+ |
| Firefox | ✓ 完全支持 | v3.5+ |
| Safari | ✓ 完全支持 | v5+ |
| IE | ✓ 支持（IE 9+） | 需要 HTTPS |
| Edge | ✓ 完全支持 | 所有版本 |
| 移动浏览器 | ✓ 普遍支持 | 大多数现代浏览器 |

### 权限状态的三种情况

```javascript
// 1. 权限已授予 - 直接获取位置
// 2. 权限已拒绝 - 显示错误提示
// 3. 权限未确定 - 触发权限提示对话框
```

### 精度选项的权衡

选项 `enableHighAccuracy: true` 会显著影响性能：

| 选项值 | 精度 | 速度 | 耗电 | 适用场景 |
|--------|------|------|------|---------|
| true | 高（GPS） | 慢 | 高 | 地图、导航 |
| false | 中（WiFi/IP） | 快 | 低 | 地理编码、推荐 |

### 超时与清理

重要的生命周期管理原则：

- **设置合理的超时**：避免无限等待
- **及时清理 watchPosition**：避免资源泄漏
- **处理所有错误情况**：不要忽略错误回调

## 代码示例

### 基础用法：获取当前位置

```javascript
// 最简单的用法
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    console.log(`纬度: ${latitude}, 经度: ${longitude}`);
  },
  (error) => {
    console.error('获取位置失败:', error.message);
  }
);
```

### 完整的错误处理

```javascript
function getLocation() {
  if (!navigator.geolocation) {
    console.error('浏览器不支持 Geolocation API');
    return;
  }

  const options = {
    enableHighAccuracy: true,  // 使用高精度（可能消耗更多电量）
    timeout: 10000,            // 10 秒超时
    maximumAge: 0              // 不使用缓存的位置数据
  };

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const {
        latitude,
        longitude,
        accuracy,
        altitude,
        altitudeAccuracy,
        heading,
        speed,
        timestamp
      } = position.coords;

      console.log(`位置信息：
        纬度: ${latitude}
        经度: ${longitude}
        精度: ${accuracy} 米
        海拔: ${altitude} 米
        获取时间: ${new Date(timestamp).toLocaleString()}
      `);
    },
    (error) => {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          console.error('用户拒绝了位置权限请求');
          break;
        case error.POSITION_UNAVAILABLE:
          console.error('位置信息不可用');
          break;
        case error.TIMEOUT:
          console.error('获取位置信息超时');
          break;
        default:
          console.error('未知错误:', error.message);
      }
    },
    options
  );
}

getLocation();
```

### 持续监听位置变化

```javascript
let watchId = null;

function startWatchingLocation() {
  if (!navigator.geolocation) {
    console.error('浏览器不支持 Geolocation API');
    return;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, speed, heading } = position.coords;
      console.log(`当前位置: ${latitude}, ${longitude}`);

      if (speed !== null) {
        console.log(`当前速度: ${(speed * 3.6).toFixed(2)} km/h`);
      }
      if (heading !== null) {
        console.log(`移动方向: ${heading}°`);
      }

      updateMapMarker(latitude, longitude);
    },
    (error) => {
      console.error('位置监听错误:', error.message);
    },
    options
  );
}

function stopWatchingLocation() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    console.log('已停止位置监听');
  }
}

// 使用示例
startWatchingLocation();

// 30 秒后停止监听
setTimeout(() => {
  stopWatchingLocation();
}, 30000);
```

### Promise 包装版本

```javascript
/**
 * 使用 Promise 包装 Geolocation API
 * @param {Object} options - 定位选项
 * @returns {Promise<GeolocationCoordinates>}
 */
function getLocationPromise(options = {}) {
  const defaultOptions = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 5000
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持 Geolocation API'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position.coords);
      },
      (error) => {
        const errorMessages = {
          [error.PERMISSION_DENIED]: '用户拒绝了位置权限请求',
          [error.POSITION_UNAVAILABLE]: '位置信息不可用',
          [error.TIMEOUT]: '获取位置信息超时'
        };
        reject(new Error(errorMessages[error.code] || error.message));
      },
      { ...defaultOptions, ...options }
    );
  });
}

// 使用 async/await
async function getUserLocation() {
  try {
    const coords = await getLocationPromise({
      enableHighAccuracy: true,
      timeout: 15000
    });
    console.log(`您的位置: ${coords.latitude}, ${coords.longitude}`);
    return coords;
  } catch (error) {
    console.error('获取位置失败:', error.message);
    throw error;
  }
}

// 调用
getUserLocation().then(coords => {
  console.log('位置已获取:', coords);
}).catch(error => {
  console.error('错误:', error);
});
```

### 带缓存的位置获取

```javascript
class LocationManager {
  constructor(cacheTime = 5000) {
    this.cacheTime = cacheTime;  // 缓存时间（毫秒）
    this.cachedLocation = null;
    this.cacheTimestamp = null;
  }

  async getCurrentLocation(options = {}) {
    // 检查缓存是否有效
    if (this.isCacheValid()) {
      console.log('使用缓存的位置信息');
      return this.cachedLocation;
    }

    try {
      const coords = await getLocationPromise(options);

      // 更新缓存
      this.cachedLocation = coords;
      this.cacheTimestamp = Date.now();

      return coords;
    } catch (error) {
      // 如果获取失败但有缓存，返回缓存
      if (this.cachedLocation) {
        console.warn('获取新位置失败，使用缓存的位置信息');
        return this.cachedLocation;
      }
      throw error;
    }
  }

  isCacheValid() {
    if (!this.cachedLocation || !this.cacheTimestamp) {
      return false;
    }
    return (Date.now() - this.cacheTimestamp) < this.cacheTime;
  }

  clearCache() {
    this.cachedLocation = null;
    this.cacheTimestamp = null;
  }
}

// 使用示例
const locationManager = new LocationManager(10000);  // 10 秒缓存

locationManager.getCurrentLocation()
  .then(coords => {
    console.log('位置:', coords.latitude, coords.longitude);
  })
  .catch(error => {
    console.error('获取位置失败:', error.message);
  });
```

### 集成地图库的示例（使用 Leaflet）

```javascript
// 与 Leaflet 地图库集成的完整示例
let map = null;
let userMarker = null;
let watchId = null;

function initMap() {
  // 初始化地图（默认中心点）
  map = L.map('map').setView([39.9042, 116.4074], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
}

function startLocationTracking() {
  if (!navigator.geolocation) {
    alert('您的浏览器不支持地理定位功能');
    return;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // 移动地图到用户位置
      map.setView([latitude, longitude], 15);

      // 添加或更新用户标记
      if (userMarker) {
        userMarker.setLatLng([latitude, longitude]);
      } else {
        userMarker = L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#4285F4',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup('您的位置');

        // 添加精度圆圈
        L.circle([latitude, longitude], {
          radius: accuracy,
          color: 'blue',
          fillColor: '#4285F4',
          fillOpacity: 0.1,
          weight: 1
        }).addTo(map);
      }

      console.log(`位置已更新: ${latitude}, ${longitude}, 精度: ${accuracy.toFixed(0)}m`);
    },
    (error) => {
      console.error('位置获取错误:', error.message);
      alert('无法获取您的位置：' + error.message);
    },
    options
  );
}

function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    console.log('已停止位置跟踪');
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  initMap();

  document.getElementById('startBtn').addEventListener('click', startLocationTracking);
  document.getElementById('stopBtn').addEventListener('click', stopLocationTracking);
});
```

## 最佳实践

### 权限处理最佳实践

```javascript
/**
 * 优雅地处理权限流程
 */
async function requestLocationPermissionAndGet() {
  // 1. 检查 API 支持
  if (!navigator.geolocation) {
    showError('您的浏览器不支持地理定位功能，请使用现代浏览器');
    return null;
  }

  // 2. 检查 HTTPS（生产环境）
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    showError('地理定位功能仅在 HTTPS 连接上可用');
    return null;
  }

  // 3. 向用户说明为什么需要位置信息
  const userConsents = await showPermissionExplanation({
    title: '需要访问您的位置',
    message: '我们需要您的位置信息来提供周边推荐服务',
    features: ['周边商家推荐', '实时导航', '到达时间预测']
  });

  if (!userConsents) {
    console.log('用户拒绝了位置权限请求');
    return null;
  }

  // 4. 请求权限
  try {
    const coords = await getLocationPromise({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });

    // 5. 成功后存储或处理位置信息
    storeUserLocation(coords);
    return coords;
  } catch (error) {
    handleLocationError(error);
    return null;
  }
}

function showPermissionExplanation(options) {
  return new Promise((resolve) => {
    const dialog = createPermissionDialog(options);
    dialog.onAllow = () => resolve(true);
    dialog.onDeny = () => resolve(false);
    dialog.show();
  });
}
```

### 性能优化

```javascript
/**
 * 性能优化的位置获取策略
 */
class OptimizedLocationManager {
  constructor() {
    this.highPrecisionTimeout = null;
    this.isHighPrecisionActive = false;
  }

  /**
   * 快速获取粗略位置（低精度）
   */
  async getQuickLocation() {
    return getLocationPromise({
      enableHighAccuracy: false,  // 关键：不使用 GPS
      timeout: 5000,
      maximumAge: 60000           // 允许使用 1 分钟内的缓存
    });
  }

  /**
   * 逐步提升精度
   */
  async getLocationProgressively() {
    try {
      // 第一步：快速获取粗略位置（400ms）
      console.log('第一步：获取粗略位置...');
      const quickLocation = await this.getQuickLocation();
      this.updateUI(quickLocation, 'rough');  // 立即更新 UI

      // 第二步：后台获取高精度位置
      console.log('第二步：获取高精度位置...');
      this.startHighPrecisionUpdate();

      return quickLocation;
    } catch (error) {
      console.error('获取粗略位置失败:', error);
      throw error;
    }
  }

  /**
   * 后台获取高精度位置
   */
  startHighPrecisionUpdate() {
    // 超时保护：最多等待 15 秒
    this.highPrecisionTimeout = setTimeout(() => {
      if (this.isHighPrecisionActive) {
        console.log('高精度位置获取超时，停止等待');
        this.stopHighPrecisionUpdate();
      }
    }, 15000);

    this.isHighPrecisionActive = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = position.coords;
        console.log('高精度位置已获取');
        this.updateUI(coords, 'accurate');
        this.stopHighPrecisionUpdate();
      },
      (error) => {
        console.warn('高精度位置获取失败:', error.message);
        this.stopHighPrecisionUpdate();
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }

  stopHighPrecisionUpdate() {
    this.isHighPrecisionActive = false;
    if (this.highPrecisionTimeout) {
      clearTimeout(this.highPrecisionTimeout);
    }
  }

  updateUI(coords, precision) {
    console.log(`${precision === 'rough' ? '粗略' : '精确'}位置:`, coords);
  }
}
```

### 错误恢复策略

```javascript
/**
 * 健壮的错误恢复
 */
class RobustLocationManager {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 3;
    this.backoffMs = 1000;
  }

  async getLocationWithRetry(options = {}) {
    try {
      return await getLocationPromise(options);
    } catch (error) {
      return this.handleError(error, options);
    }
  }

  async handleError(error, options) {
    // 1. PERMISSION_DENIED - 不重试
    if (error.message.includes('权限')) {
      console.error('用户拒绝了位置权限，不会再次尝试');
      return null;
    }

    // 2. TIMEOUT - 降低精度后重试
    if (error.message.includes('超时')) {
      console.log('位置获取超时，降低精度重试...');
      return getLocationPromise({
        enableHighAccuracy: false,
        timeout: 10000
      });
    }

    // 3. POSITION_UNAVAILABLE - 指数退避重试
    if (error.message.includes('不可用') && this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.backoffMs * Math.pow(2, this.retryCount - 1);

      console.log(`第 ${this.retryCount} 次重试，等待 ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));

      return this.getLocationWithRetry(options);
    }

    // 4. 其他错误或重试次数已尽
    console.error('无法获取位置信息，已尝试', this.retryCount, '次');
    return null;
  }
}
```

### 隐私保护最佳实践

```javascript
/**
 * 隐私友好的位置使用
 */
class PrivacyAwareLocationManager {
  /**
   * 最小化位置精度
   * 降低位置信息被反向追踪的风险
   */
  static obfuscateCoordinates(latitude, longitude, obfuscationRadius = 1000) {
    // 1 度约等于 111 km
    const degreesPerMeter = 1 / 111000;
    const obfuscationDegrees = obfuscationRadius * degreesPerMeter;

    const obfuscatedLat = latitude + (Math.random() - 0.5) * obfuscationDegrees * 2;
    const obfuscatedLon = longitude + (Math.random() - 0.5) * obfuscationDegrees * 2;

    return {
      latitude: parseFloat(obfuscatedLat.toFixed(4)),
      longitude: parseFloat(obfuscatedLon.toFixed(4))
    };
  }

  /**
   * 只在需要时请求位置
   * 避免频繁的权限提示
   */
  static async requestLocationIfNeeded(feature) {
    // 检查用户是否已同意
    if (this.hasLocationPermission(feature)) {
      return getLocationPromise();
    }

    // 仅在用户明确需要功能时请求
    const shouldRequest = await this.askUserConfirmation(
      `${feature} 需要访问您的位置信息，是否继续？`
    );

    if (shouldRequest) {
      return getLocationPromise();
    }

    return null;
  }

  /**
   * 及时清理位置数据
   */
  static cleanupLocationData() {
    // 1. 停止位置监听
    if (window.locationWatchId) {
      navigator.geolocation.clearWatch(window.locationWatchId);
    }

    // 2. 清除本地存储的位置数据
    localStorage.removeItem('userLocation');
    sessionStorage.removeItem('userLocation');

    // 3. 清除内存中的数据
    window.currentLocation = null;
  }

  static hasLocationPermission(feature) {
    // 从本地存储检查是否已获得权限
    const permissions = JSON.parse(localStorage.getItem('locationPermissions') || '{}');
    return permissions[feature] === true;
  }

  static async askUserConfirmation(message) {
    return new Promise((resolve) => {
      const confirmed = confirm(message);
      resolve(confirmed);
    });
  }
}

// 使用示例
PrivacyAwareLocationManager.requestLocationIfNeeded('附近商家推荐')
  .then(coords => {
    if (coords) {
      // 降低精度，保护隐私
      const obfuscated = PrivacyAwareLocationManager.obfuscateCoordinates(
        coords.latitude,
        coords.longitude,
        1000  // 1 km 模糊半径
      );
      console.log('模糊化后的位置:', obfuscated);
    }
  });

// 用户离开应用时清理数据
window.addEventListener('beforeunload', () => {
  PrivacyAwareLocationManager.cleanupLocationData();
});
```

## 常见陷阱

### 忘记处理 HTTPS 要求

```javascript
// ❌ 错误：在非 HTTPS 环境下无法工作
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(...);
}

// ✓ 正确：检查安全协议
if (navigator.geolocation && location.protocol === 'https:' || location.hostname === 'localhost') {
  navigator.geolocation.getCurrentPosition(...);
}
```

### 忽视位置缓存

```javascript
// ❌ 错误：每次都强制获取新位置，浪费资源
const options = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0  // 禁用缓存
};

// ✓ 正确：允许使用缓存的位置数据
const options = {
  enableHighAccuracy: false,  // 不需要高精度时关闭
  timeout: 10000,
  maximumAge: 30000  // 允许使用 30 秒内的缓存
};
```

### 没有设置超时

```javascript
// ❌ 错误：没有超时，可能永久等待
navigator.geolocation.getCurrentPosition(success, error);

// ✓ 正确：设置合理的超时时间
navigator.geolocation.getCurrentPosition(
  success,
  error,
  { timeout: 10000 }  // 10 秒超时
);
```

### 忘记清理 watchPosition

```javascript
// ❌ 错误：没有清理监听器，造成资源泄漏
function startWatching() {
  navigator.geolocation.watchPosition(callback);
  // 缺少 clearWatch 调用
}

// ✓ 正确：保存 watchId 并在适当时清理
let watchId = null;

function startWatching() {
  watchId = navigator.geolocation.watchPosition(callback);
}

function stopWatching() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
}

// 确保在页面卸载时清理
window.addEventListener('beforeunload', stopWatching);
```

### 不处理所有错误情况

```javascript
// ❌ 错误：错误回调缺失或不完整
navigator.geolocation.getCurrentPosition(
  (position) => { ... }
  // 没有错误处理！
);

// ✓ 正确：完整的错误处理
navigator.geolocation.getCurrentPosition(
  (position) => {
    handleSuccess(position);
  },
  (error) => {
    handleError(error);  // 必须提供错误回调
  },
  { timeout: 10000 }
);

function handleError(error) {
  const messages = {
    [error.PERMISSION_DENIED]: '用户拒绝了位置权限',
    [error.POSITION_UNAVAILABLE]: '位置不可用',
    [error.TIMEOUT]: '获取位置超时'
  };
  console.error(messages[error.code] || error.message);
}
```

### 混淆坐标顺序

```javascript
// ❌ 错误：坐标顺序颠倒（GeoJSON 使用 [经度, 纬度]）
const coords = [position.coords.latitude, position.coords.longitude];
addMarkerToMap(coords);  // 可能显示在错误的位置

// ✓ 正确：确认正确的坐标顺序
// Geolocation API：[纬度, 经度]
const latitude = position.coords.latitude;
const longitude = position.coords.longitude;

// GeoJSON：[经度, 纬度]（如果需要）
const geoJSON = {
  type: 'Point',
  coordinates: [longitude, latitude]
};
```

### 过度使用高精度选项

```javascript
// ❌ 错误：在不需要高精度的场景下仍然启用
const options = {
  enableHighAccuracy: true,  // 不必要的耗电
  timeout: 10000,
  maximumAge: 0
};

// 获取周边商家位置 - 不需要高精度

// ✓ 正确：根据场景选择合适的精度
const options = {
  enableHighAccuracy: false,  // 用于地理编码
  timeout: 5000,
  maximumAge: 60000
};
```

## 性能考量

### 电池消耗

| 场景 | enableHighAccuracy | 耗电量 | 备注 |
|------|------------------|-------|------|
| 普通定位 | false | 低 | 推荐使用 |
| GPS 定位 | true | 高 | 避免持续使用 |
| WiFi 定位 | false | 低 | 最佳平衡 |

```javascript
// 电池友好的位置获取
function getLocationBatteryFriendly() {
  const options = {
    enableHighAccuracy: false,  // 禁用 GPS
    timeout: 5000,
    maximumAge: 300000  // 5 分钟缓存
  };

  return getLocationPromise(options);
}
```

### 网络数据消耗

```javascript
// 最小化数据消耗
class DataEfficientLocation {
  /**
   * 减少发送到服务器的坐标精度
   */
  static compressCoordinates(coords, precision = 4) {
    return {
      lat: parseFloat(coords.latitude.toFixed(precision)),
      lng: parseFloat(coords.longitude.toFixed(precision))
    };
  }

  /**
   * 批量发送位置数据
   */
  static async batchSendLocations(locations) {
    const compressed = locations.map(loc =>
      this.compressCoordinates(loc)
    );

    // 一次发送多个位置，而不是分别发送
    await fetch('/api/locations', {
      method: 'POST',
      body: JSON.stringify({ locations: compressed })
    });
  }
}
```

### UI 响应性

```javascript
// 避免阻塞主线程
function getLocationNonBlocking() {
  return new Promise((resolve, reject) => {
    // 位置获取在后台进行，不阻塞 UI
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// 在获取位置时显示加载状态
async function loadLocationWithUI() {
  showLoadingSpinner();

  try {
    const coords = await getLocationNonBlocking();
    updateMapView(coords);
  } finally {
    hideLoadingSpinner();
  }
}
```

### 并发请求优化

```javascript
class LocationRequestOptimizer {
  constructor() {
    this.pendingRequest = null;
  }

  /**
   * 防止并发多个位置请求
   */
  async getLocation(options) {
    // 如果已有请求在进行，返回该请求的 Promise
    if (this.pendingRequest) {
      console.log('已有位置请求在进行，等待...');
      return this.pendingRequest;
    }

    this.pendingRequest = getLocationPromise(options)
      .finally(() => {
        this.pendingRequest = null;  // 请求完成后清除
      });

    return this.pendingRequest;
  }
}

const optimizer = new LocationRequestOptimizer();

// 多个并发请求会被合并
Promise.all([
  optimizer.getLocation(),
  optimizer.getLocation(),
  optimizer.getLocation()
]);
// 实际只会执行一次请求
```

## 实战场景

### 场景一：地图应用（位置共享）

```javascript
class MapShareApp {
  constructor() {
    this.watchId = null;
    this.updateInterval = 5000;  // 每 5 秒更新一次
    this.lastUpdate = 0;
  }

  startTracking() {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.onLocationChange(position),
      (error) => this.onLocationError(error),
      options
    );
  }

  onLocationChange(position) {
    const now = Date.now();

    // 限制更新频率，避免过度更新
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }

    this.lastUpdate = now;

    const { latitude, longitude, accuracy } = position.coords;

    // 1. 更新地图标记
    this.updateMapMarker(latitude, longitude);

    // 2. 发送到服务器
    this.sendLocationToServer({ latitude, longitude, accuracy });

    // 3. 更新 UI
    this.updateUI({
      coords: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      accuracy: `±${accuracy.toFixed(0)}m`
    });
  }

  onLocationError(error) {
    console.error('位置获取错误:', error.message);
    // 显示降级方案（使用缓存的位置或请求用户输入）
  }

  sendLocationToServer(location) {
    fetch('/api/locations/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location)
    }).catch(err => console.error('发送失败:', err));
  }

  updateMapMarker(lat, lng) {
    // 地图更新逻辑
  }

  updateUI(info) {
    document.getElementById('location').textContent = info.coords;
    document.getElementById('accuracy').textContent = info.accuracy;
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }
}

// 使用
const app = new MapShareApp();
app.startTracking();

// 用户离开页面时停止
window.addEventListener('beforeunload', () => app.stopTracking());
```

### 场景二：周边服务推荐

```javascript
class NearbyServiceFinder {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
    this.cache = new Map();
    this.cacheDuration = 300000;  // 5 分钟缓存
  }

  async findNearbyServices(serviceType, radius = 1000) {
    try {
      // 1. 获取用户位置（不需要高精度）
      const coords = await getLocationPromise({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      });

      // 2. 检查缓存
      const cacheKey = `${serviceType}_${coords.latitude}_${coords.longitude}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        console.log('使用缓存的服务列表');
        return cached.data;
      }

      // 3. 从服务器获取周边服务
      const services = await this.queryServices(coords, serviceType, radius);

      // 4. 缓存结果
      this.cache.set(cacheKey, {
        data: services,
        timestamp: Date.now()
      });

      return services;
    } catch (error) {
      console.error('获取周边服务失败:', error);
      return [];
    }
  }

  async queryServices(coords, serviceType, radius) {
    const response = await fetch(
      `${this.apiBaseUrl}/nearby?` +
      `lat=${coords.latitude}&lng=${coords.longitude}&` +
      `type=${serviceType}&radius=${radius}`
    );

    if (!response.ok) {
      throw new Error(`API 错误: ${response.statusText}`);
    }

    return response.json();
  }

  clearCache() {
    this.cache.clear();
  }
}

// 使用
const finder = new NearbyServiceFinder('https://api.example.com');

async function showNearbyRestaurants() {
  const restaurants = await finder.findNearbyServices('restaurants', 1000);
  console.log('附近餐厅:', restaurants);
  updateRestaurantList(restaurants);
}
```

### 场景三：运动追踪应用

```javascript
class WorkoutTracker {
  constructor() {
    this.locations = [];
    this.startTime = null;
    this.watchId = null;
    this.paused = false;
  }

  start() {
    this.locations = [];
    this.startTime = Date.now();
    this.paused = false;

    const options = {
      enableHighAccuracy: true,  // 精确追踪
      timeout: 10000,
      maximumAge: 0
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.recordLocation(position),
      (error) => console.error('追踪错误:', error)
    );
  }

  recordLocation(position) {
    if (this.paused) return;

    const coords = position.coords;
    this.locations.push({
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: Date.now(),
      speed: coords.speed
    });

    // 实时更新统计信息
    this.updateStats();
  }

  updateStats() {
    const distance = this.calculateDistance();
    const duration = (Date.now() - this.startTime) / 1000;
    const speed = distance / (duration / 3600);  // km/h

    console.log(`
      距离: ${distance.toFixed(2)} km
      用时: ${this.formatDuration(duration)}
      平均速度: ${speed.toFixed(2)} km/h
    `);
  }

  calculateDistance() {
    if (this.locations.length < 2) return 0;

    let distance = 0;
    for (let i = 1; i < this.locations.length; i++) {
      const from = this.locations[i - 1];
      const to = this.locations[i];
      distance += this.haversineDistance(from, to);
    }
    return distance;
  }

  haversineDistance(from, to) {
    const R = 6371;  // 地球半径（km）
    const φ1 = this.toRadians(from.latitude);
    const φ2 = this.toRadians(to.latitude);
    const Δφ = this.toRadians(to.latitude - from.latitude);
    const Δλ = this.toRadians(to.longitude - from.longitude);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    return this.getSummary();
  }

  getSummary() {
    const distance = this.calculateDistance();
    const duration = (Date.now() - this.startTime) / 1000;

    return {
      distance: parseFloat(distance.toFixed(2)),
      duration: parseInt(duration),
      avgSpeed: parseFloat((distance / (duration / 3600)).toFixed(2)),
      path: this.locations
    };
  }
}

// 使用
const tracker = new WorkoutTracker();
tracker.start();

// 用户完成运动
document.getElementById('finishBtn').addEventListener('click', () => {
  const summary = tracker.stop();
  saveBecomeToServer(summary);
  console.log('运动完成:', summary);
});
```

## 面试要点

### 基础题：Geolocation API 的三个方法

**问题**：Geolocation API 提供了哪三个主要方法？

**答案**：
1. `getCurrentPosition()` - 获取当前位置（一次性）
2. `watchPosition()` - 监听位置变化（持续）
3. `clearWatch()` - 停止监听

### 中级题：为什么需要 HTTPS？

**问题**：为什么 Geolocation API 只能在 HTTPS 环境下工作？

**答案**：
- 位置信息涉及用户隐私
- HTTPS 提供加密传输，防止位置数据被窃听
- 防止中间人攻击
- 确保只有真正的应用才能访问位置信息

### 高级题：如何优化位置获取性能？

**问题**：如何在不牺牲用户体验的前提下优化位置获取性能？

**答案**：
```javascript
// 多层策略：
// 1. 使用 maximumAge 缓存位置
// 2. 降低精度（enableHighAccuracy: false）
// 3. 设置合理的超时时间
// 4. 渐进式精度提升
// 5. 限制更新频率

const options = {
  enableHighAccuracy: false,  // 快速响应
  timeout: 5000,
  maximumAge: 60000  // 使用缓存
};

// 后台继续获取高精度位置
setTimeout(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => updateWithHighAccuracy(position),
    null,
    { enableHighAccuracy: true }
  );
}, 0);
```

### 高级题：权限状态检测

**问题**：如何在不触发权限提示的情况下检测用户是否已授予位置权限？

**答案**：
```javascript
// 使用 Permissions API（新标准）
async function checkLocationPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;  // "granted", "denied", "prompt"
  } catch (error) {
    // 不支持 Permissions API
    return 'unknown';
  }
}

// 旧方法：尝试快速获取位置
function checkPermissionLegacy() {
  navigator.geolocation.getCurrentPosition(
    () => console.log('权限已授予'),
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        console.log('权限已拒绝');
      }
    }
  );
}
```

### 高级题：处理 watchPosition 的资源泄漏

**问题**：如果忘记调用 `clearWatch()`，会造成什么后果？

**答案**：
```javascript
// 后果：
// 1. 持续消耗电池
// 2. 持续消耗网络流量
// 3. 持续调用回调函数
// 4. 如果没有清理，即使用户离开页面也会继续监听

// 正确的做法：
class SafeLocationWatcher {
  constructor() {
    this.watchId = null;
  }

  start(callback) {
    this.watchId = navigator.geolocation.watchPosition(callback);
  }

  stop() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // 确保在页面卸载时清理
  setupAutoCleanup() {
    window.addEventListener('beforeunload', () => this.stop());
    window.addEventListener('pagehide', () => this.stop());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start(this.callback);
    });
  }
}
```

### 场景题：如何处理位置获取超时？

**问题**：用户在室内或信号差的地方，GPS 无法获取位置，应该如何处理？

**答案**：
```javascript
async function robustGetLocation() {
  try {
    // 1. 尝试高精度获取（等待 8 秒）
    return await getLocationPromise({
      enableHighAccuracy: true,
      timeout: 8000
    });
  } catch (error) {
    if (error.message.includes('超时')) {
      console.log('高精度模式超时，切换到低精度模式...');

      // 2. 降低精度重试
      return await getLocationPromise({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000
      });
    }

    // 3. 最后的手段：使用 IP 地址定位
    if (error.message.includes('不可用')) {
      console.log('GPS 不可用，使用服务器端 IP 定位...');
      return await fetch('/api/location-by-ip').then(r => r.json());
    }

    throw error;
  }
}
```

## 延伸阅读

### 相关 API 和技术

**Permissions API**
```javascript
// 检查多个权限状态
navigator.permissions.query({ name: 'geolocation' })
  .then(result => console.log(result.state));
```

**Ambient Light Sensor API**
- 检测周围光线，可用于简化定位

**Accelerometer / Gyroscope**
- 配合地理位置提供运动方向

**Web Bluetooth API**
- 连接外部 GPS 设备

### 相关库和框架

| 库名 | 用途 | 优点 |
|------|------|------|
| Leaflet | 地图库 | 轻量级，支持离线 |
| Mapbox GL | 高级地图 | 3D 支持，美观 |
| OpenStreetMap | 地图数据 | 开源，免费 |
| Turf.js | 地理计算 | 强大的分析工具 |
| GPXParser | GPS 数据 | 解析 GPX 文件 |

### 性能监测

```javascript
// 测量位置获取的性能
async function measureLocationPerformance() {
  performance.mark('location-start');

  try {
    const coords = await getLocationPromise();
    performance.mark('location-end');
    performance.measure('location', 'location-start', 'location-end');

    const measure = performance.getEntriesByName('location')[0];
    console.log(`位置获取耗时: ${measure.duration.toFixed(0)}ms`);

    return coords;
  } catch (error) {
    console.error('位置获取失败:', error);
    throw error;
  }
}
```

### 调试技巧

**Chrome DevTools 中模拟位置**：
1. 打开 DevTools（F12）
2. 按 Ctrl+Shift+P，搜索 "Sensors"
3. 在 Location 中输入测试坐标

```javascript
// 本地开发中的位置模拟
function getMockLocation() {
  if (location.hostname === 'localhost') {
    return Promise.resolve({
      coords: {
        latitude: 39.9042,
        longitude: 116.4074,
        accuracy: 50,
        altitude: 50,
        altitudeAccuracy: 10,
        heading: null,
        speed: null
      }
    });
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}
```

### 无障碍考虑

```javascript
// 为视障用户提供位置信息
function announceLocation(coords) {
  const message = `您现在位于北纬 ${coords.latitude.toFixed(2)} 度，
                   东经 ${coords.longitude.toFixed(2)} 度`;

  // 使用 Web Speech API 播报
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'zh-CN';
  speechSynthesis.speak(utterance);
}
```

### 进阶阅读资源

1. **W3C 规范**：https://www.w3.org/TR/geolocation-API/
2. **MDN Web Docs**：https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
3. **WHATWG 标准**：https://html.spec.whatwg.org/multipage/
4. **隐私考虑**：https://www.eff.org/deeplinks/2013/11/who-can-read-your-location-your-isp-and-other-isp-curiosities
5. **性能优化**：https://web.dev/performance/

---

**总结**

Geolocation API 是现代网页应用的重要功能，但也涉及用户隐私。关键要点包括：

1. **始终处理错误**：权限拒绝、超时、位置不可用都很常见
2. **优化性能**：使用缓存、限制更新频率、选择合适的精度
3. **保护隐私**：最小化精度、及时清理数据、获取用户同意
4. **完整的生命周期管理**：启动、监听、清理都很重要
5. **测试和调试**：使用浏览器开发工具模拟不同场景

掌握 Geolocation API 将使您能够构建更多有趣的地理位置感知应用！
