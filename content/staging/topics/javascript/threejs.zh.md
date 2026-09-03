---
title: Three.js 3D 图形开发指南
description: 掌握Three.js 3D图形库，创建沉浸式Web 3D体验
track: javascript
section: browser
difficulty: advanced
tags:
  - Three.js
  - 3D
  - WebGL
  - 图形
status: imported
origin: old/src/content/docs/frontend/threejs.zh.md
divergence: 0.198
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: 3D
  order: 27
  lastUpdated: 2026-01-07
---

Three.js 是一个基于 WebGL 的 JavaScript 3D 图形库，它极大地简化了在浏览器中创建和展示 3D 内容的复杂度。无论是产品展示、数据可视化、游戏开发还是虚拟现实应用，Three.js 都是构建沉浸式 Web 3D 体验的首选工具。

## 概念解释：为什么选择 Three.js

### WebGL 的复杂性

WebGL 是一个底层的图形 API，直接使用它需要：

1. **大量的样板代码**：设置着色器、缓冲区、纹理等需要数百行代码
2. **深厚的图形学知识**：理解矩阵变换、光照模型、投影等概念
3. **手动管理状态**：追踪 GPU 状态、内存管理等底层细节
4. **跨浏览器兼容性**：处理不同浏览器的 WebGL 实现差异

### Three.js 的优势

Three.js 提供了高级抽象，让开发者可以：

- **快速上手**：用简洁的 API 创建复杂的 3D 场景
- **丰富的内置功能**：几何体、材质、光源、加载器一应俱全
- **活跃的社区**：大量的示例、插件和第三方扩展
- **持续更新**：紧跟 WebGL 和图形技术的最新发展

## 核心概念详解

### 三大基础组件

Three.js 的核心由三个基础组件构成：场景（Scene）、相机（Camera）和渲染器（Renderer）。

```javascript
import * as THREE from 'three';

// 1. 创建场景 - 容纳所有 3D 对象的容器
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// 2. 创建相机 - 决定我们如何观察场景
const camera = new THREE.PerspectiveCamera(
  75,                                    // 视野角度（FOV）
  window.innerWidth / window.innerHeight, // 宽高比
  0.1,                                   // 近裁剪面
  1000                                   // 远裁剪面
);
camera.position.z = 5;

// 3. 创建渲染器 - 将场景绘制到画布上
const renderer = new THREE.WebGLRenderer({
  antialias: true,  // 启用抗锯齿
  alpha: true       // 支持透明背景
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

### 场景图结构

Three.js 使用场景图（Scene Graph）来组织 3D 对象：

```javascript
// 场景图示例：太阳系模型
const solarSystem = new THREE.Group();
scene.add(solarSystem);

// 太阳
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
solarSystem.add(sun);

// 地球轨道组
const earthOrbit = new THREE.Group();
solarSystem.add(earthOrbit);

// 地球
const earthGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x2233ff });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.x = 8;
earthOrbit.add(earth);

// 月球轨道组（相对于地球）
const moonOrbit = new THREE.Group();
moonOrbit.position.x = 8;
earthOrbit.add(moonOrbit);

// 月球
const moonGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const moonMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.x = 1;
moonOrbit.add(moon);

// 动画：旋转各个轨道组
function animate() {
  requestAnimationFrame(animate);

  sun.rotation.y += 0.001;
  earthOrbit.rotation.y += 0.005;  // 地球公转
  earth.rotation.y += 0.02;        // 地球自转
  moonOrbit.rotation.y += 0.02;    // 月球公转

  renderer.render(scene, camera);
}
```

### 相机类型

Three.js 提供多种相机类型：

```javascript
// 透视相机 - 模拟人眼视角，有近大远小效果
const perspectiveCamera = new THREE.PerspectiveCamera(
  75,    // FOV：视野角度
  aspect, // 宽高比
  0.1,   // 近裁剪面
  1000   // 远裁剪面
);

// 正交相机 - 无透视变形，适合 2D 游戏或技术图纸
const orthographicCamera = new THREE.OrthographicCamera(
  -width / 2,   // left
  width / 2,    // right
  height / 2,   // top
  -height / 2,  // bottom
  0.1,          // near
  1000          // far
);

// 立方体相机 - 用于创建环境贴图
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);

// 数组相机 - 用于多视角渲染（VR等）
const arrayCamera = new THREE.ArrayCamera([camera1, camera2]);
```

## 几何体与材质

### 内置几何体

Three.js 提供了丰富的内置几何体：

```javascript
// 基础几何体
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);           // 立方体
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);   // 球体
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2); // 圆柱体
const coneGeometry = new THREE.ConeGeometry(1, 2, 32);        // 圆锥体
const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 100); // 圆环
const planeGeometry = new THREE.PlaneGeometry(10, 10);        // 平面

// 高级几何体
const torusKnotGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
const dodecahedronGeometry = new THREE.DodecahedronGeometry(1);
const icosahedronGeometry = new THREE.IcosahedronGeometry(1);

// 文字几何体（需要加载字体）
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const fontLoader = new FontLoader();
fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
  const textGeometry = new TextGeometry('Hello Three.js', {
    font: font,
    size: 0.5,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5
  });
  textGeometry.center(); // 居中对齐

  const textMesh = new THREE.Mesh(textGeometry, material);
  scene.add(textMesh);
});
```

### 自定义几何体

```javascript
// 使用 BufferGeometry 创建自定义几何体
const geometry = new THREE.BufferGeometry();

// 定义顶点位置
const vertices = new Float32Array([
  -1.0, -1.0,  1.0,  // 顶点 0
   1.0, -1.0,  1.0,  // 顶点 1
   1.0,  1.0,  1.0,  // 顶点 2
  -1.0,  1.0,  1.0,  // 顶点 3
]);

// 定义顶点索引（构成三角形）
const indices = new Uint16Array([
  0, 1, 2,  // 第一个三角形
  0, 2, 3   // 第二个三角形
]);

// 定义 UV 坐标（用于纹理映射）
const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 1
]);

// 定义法线（用于光照计算）
const normals = new Float32Array([
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1
]);

geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
geometry.setIndex(new THREE.BufferAttribute(indices, 1));
```

### 材质系统

```javascript
// 基础材质 - 不受光照影响
const basicMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: false,
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide
});

// 标准材质 - 基于物理的渲染（PBR）
const standardMaterial = new THREE.MeshStandardMaterial({
  color: 0x049ef4,
  metalness: 0.7,      // 金属度：0-1
  roughness: 0.2,      // 粗糙度：0-1
  envMapIntensity: 1.0
});

// 物理材质 - 更高级的 PBR
const physicalMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0,
  transmission: 1,     // 透射率（玻璃效果）
  thickness: 0.5,      // 厚度
  ior: 1.5,           // 折射率
  clearcoat: 1,       // 清漆层
  clearcoatRoughness: 0
});

// 法线材质 - 显示法线方向（调试用）
const normalMaterial = new THREE.MeshNormalMaterial();

// Lambert 材质 - 漫反射材质
const lambertMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

// Phong 材质 - 带高光的材质
const phongMaterial = new THREE.MeshPhongMaterial({
  color: 0x0000ff,
  shininess: 100,
  specular: 0xffffff
});

// 卡通材质 - 卡通渲染风格
const toonMaterial = new THREE.MeshToonMaterial({
  color: 0xff00ff,
  gradientMap: gradientTexture
});
```

## 光源与阴影

### 光源类型

```javascript
// 环境光 - 均匀照亮场景中的所有物体
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 平行光 - 模拟太阳光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 点光源 - 从一个点向所有方向发射光线
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// 聚光灯 - 锥形光束
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6;        // 光锥角度
spotLight.penumbra = 0.5;             // 边缘柔和度
spotLight.decay = 2;                  // 衰减
scene.add(spotLight);

// 半球光 - 模拟天空和地面的环境光
const hemisphereLight = new THREE.HemisphereLight(
  0x0000ff,  // 天空颜色
  0x00ff00,  // 地面颜色
  1
);
scene.add(hemisphereLight);

// 矩形区域光 - 模拟窗户或屏幕发出的光
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

RectAreaLightUniformsLib.init();
const rectAreaLight = new THREE.RectAreaLight(0xffffff, 5, 4, 2);
rectAreaLight.position.set(0, 5, 0);
rectAreaLight.lookAt(0, 0, 0);
scene.add(rectAreaLight);
```

### 阴影设置

```javascript
// 启用渲染器阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 柔和阴影

// 配置平行光阴影
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;   // 阴影贴图分辨率
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.0001;         // 防止阴影瑕疵

// 配置点光源阴影
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 25;

// 配置聚光灯阴影
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 0.5;
spotLight.shadow.camera.far = 20;
spotLight.shadow.camera.fov = 30;

// 物体阴影设置
mesh.castShadow = true;     // 投射阴影
mesh.receiveShadow = true;  // 接收阴影

// 地面接收阴影
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x808080 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
```

## 纹理与材质贴图

### 纹理加载

```javascript
const textureLoader = new THREE.TextureLoader();

// 加载单个纹理
const colorTexture = textureLoader.load(
  '/textures/brick/color.jpg',
  (texture) => console.log('纹理加载完成'),
  (progress) => console.log('加载进度:', progress),
  (error) => console.error('加载失败:', error)
);

// 纹理设置
colorTexture.wrapS = THREE.RepeatWrapping;      // 水平重复
colorTexture.wrapT = THREE.RepeatWrapping;      // 垂直重复
colorTexture.repeat.set(2, 2);                  // 重复次数
colorTexture.offset.set(0.5, 0.5);              // 偏移
colorTexture.rotation = Math.PI / 4;            // 旋转
colorTexture.center.set(0.5, 0.5);              // 旋转中心

// 纹理过滤
colorTexture.minFilter = THREE.LinearMipmapLinearFilter; // 缩小时
colorTexture.magFilter = THREE.LinearFilter;              // 放大时
colorTexture.generateMipmaps = true;

// 色彩空间（用于颜色纹理）
colorTexture.colorSpace = THREE.SRGBColorSpace;
```

### PBR 材质贴图

```javascript
// 加载完整的 PBR 纹理集
const loadTextures = (basePath) => {
  const loader = new THREE.TextureLoader();

  const textures = {
    color: loader.load(`${basePath}/color.jpg`),
    normal: loader.load(`${basePath}/normal.jpg`),
    roughness: loader.load(`${basePath}/roughness.jpg`),
    metalness: loader.load(`${basePath}/metalness.jpg`),
    ao: loader.load(`${basePath}/ao.jpg`),
    displacement: loader.load(`${basePath}/displacement.jpg`)
  };

  // 设置色彩空间
  textures.color.colorSpace = THREE.SRGBColorSpace;

  return textures;
};

const brickTextures = loadTextures('/textures/brick');

// 创建 PBR 材质
const pbrMaterial = new THREE.MeshStandardMaterial({
  map: brickTextures.color,              // 颜色贴图
  normalMap: brickTextures.normal,       // 法线贴图
  normalScale: new THREE.Vector2(1, 1),  // 法线强度
  roughnessMap: brickTextures.roughness, // 粗糙度贴图
  metalnessMap: brickTextures.metalness, // 金属度贴图
  aoMap: brickTextures.ao,               // 环境光遮蔽贴图
  aoMapIntensity: 1,
  displacementMap: brickTextures.displacement, // 位移贴图
  displacementScale: 0.1,
  displacementBias: 0
});

// 注意：使用 aoMap 需要第二套 UV
geometry.setAttribute('uv2', geometry.attributes.uv);
```

### 环境贴图

```javascript
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// 加载 HDR 环境贴图
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/textures/environment.hdr', (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  // 设置场景环境
  scene.environment = environmentMap;
  scene.background = environmentMap;

  // 或者只用于材质反射
  material.envMap = environmentMap;
  material.envMapIntensity = 1;
});

// 使用立方体贴图
const cubeTextureLoader = new THREE.CubeTextureLoader();
const envMap = cubeTextureLoader.load([
  '/textures/env/px.jpg', // 正 X
  '/textures/env/nx.jpg', // 负 X
  '/textures/env/py.jpg', // 正 Y
  '/textures/env/ny.jpg', // 负 Y
  '/textures/env/pz.jpg', // 正 Z
  '/textures/env/nz.jpg'  // 负 Z
]);
scene.background = envMap;
scene.environment = envMap;
```

## 3D 模型加载

### GLTF/GLB 模型加载

GLTF（GL Transmission Format）是目前推荐的 3D 模型格式：

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// 配置 Draco 解压器（用于压缩模型）
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

// 创建 GLTF 加载器
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// 加载模型
gltfLoader.load(
  '/models/robot.glb',
  (gltf) => {
    // 成功回调
    const model = gltf.scene;

    // 遍历模型设置属性
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // 可以替换材质
        if (child.material) {
          child.material.envMap = environmentMap;
          child.material.envMapIntensity = 0.5;
        }
      }
    });

    // 调整模型大小和位置
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(0, 0, 0);

    scene.add(model);

    // 处理动画
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();

      // 在渲染循环中更新
      // mixer.update(deltaTime);
    }
  },
  (progress) => {
    // 加载进度
    const percent = (progress.loaded / progress.total) * 100;
    console.log(`加载进度: ${percent.toFixed(2)}%`);
  },
  (error) => {
    // 错误处理
    console.error('模型加载失败:', error);
  }
);
```

### OBJ 模型加载

```javascript
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

// 先加载材质
const mtlLoader = new MTLLoader();
mtlLoader.load('/models/object.mtl', (materials) => {
  materials.preload();

  // 再加载模型
  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.load('/models/object.obj', (object) => {
    scene.add(object);
  });
});
```

### FBX 模型加载

```javascript
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const fbxLoader = new FBXLoader();
fbxLoader.load('/models/character.fbx', (fbx) => {
  fbx.scale.setScalar(0.01);

  // FBX 通常包含骨骼动画
  if (fbx.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(fbx);
    const action = mixer.clipAction(fbx.animations[0]);
    action.play();
  }

  scene.add(fbx);
});
```

## 动画系统

### 基础动画

```javascript
// 使用 Clock 进行时间管理
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  const deltaTime = clock.getDelta();

  // 基于时间的动画
  mesh.rotation.y = elapsedTime * 0.5;
  mesh.position.y = Math.sin(elapsedTime) * 0.5;

  renderer.render(scene, camera);
}
```

### AnimationMixer 动画系统

```javascript
// 创建动画混合器
const mixer = new THREE.AnimationMixer(model);

// 添加动画剪辑
const idleAction = mixer.clipAction(animations.find(a => a.name === 'Idle'));
const walkAction = mixer.clipAction(animations.find(a => a.name === 'Walk'));
const runAction = mixer.clipAction(animations.find(a => a.name === 'Run'));

// 配置动画
idleAction.play();

// 动画过渡
function fadeToAction(newAction, duration = 0.5) {
  const currentAction = mixer._actions.find(a => a.isRunning());

  if (currentAction) {
    currentAction.fadeOut(duration);
  }

  newAction.reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(duration)
    .play();
}

// 动画事件监听
mixer.addEventListener('finished', (e) => {
  console.log('动画完成:', e.action.getClip().name);
});

mixer.addEventListener('loop', (e) => {
  console.log('动画循环:', e.action.getClip().name);
});

// 渲染循环中更新
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  mixer.update(deltaTime);

  renderer.render(scene, camera);
}
```

### GSAP 动画集成

```javascript
import gsap from 'gsap';

// 创建时间线动画
const timeline = gsap.timeline({ repeat: -1, yoyo: true });

timeline
  .to(mesh.position, { x: 2, duration: 1, ease: 'power2.inOut' })
  .to(mesh.rotation, { y: Math.PI, duration: 0.5 }, '-=0.5')
  .to(mesh.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.5 });

// 交互动画
mesh.addEventListener('click', () => {
  gsap.to(mesh.position, {
    y: mesh.position.y + 1,
    duration: 0.3,
    ease: 'back.out(2)',
    yoyo: true,
    repeat: 1
  });
});

// 相机动画
function animateCamera(targetPosition, targetLookAt, duration = 2) {
  gsap.to(camera.position, {
    ...targetPosition,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.lookAt(targetLookAt);
    }
  });
}
```

### 变形动画（Morph Targets）

```javascript
// 假设模型有变形目标
const morphMesh = model.getObjectByName('Face');

if (morphMesh.morphTargetInfluences) {
  // 获取变形目标名称
  const morphTargets = morphMesh.morphTargetDictionary;
  console.log('变形目标:', Object.keys(morphTargets));

  // 通过索引控制变形
  gsap.to(morphMesh.morphTargetInfluences, {
    [morphTargets['smile']]: 1,
    duration: 0.5
  });
}
```

## 物理引擎集成

### Cannon.js 物理引擎

```javascript
import * as CANNON from 'cannon-es';

// 创建物理世界
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// 添加材质
const defaultMaterial = new CANNON.Material('default');
const contactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.3,
    restitution: 0.7  // 弹性
  }
);
world.addContactMaterial(contactMaterial);
world.defaultContactMaterial = contactMaterial;

// 创建地面物理体
const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// 创建球体物理体
const sphereBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(0.5),
  position: new CANNON.Vec3(0, 5, 0)
});
world.addBody(sphereBody);

// 同步物理和渲染
const objectsToUpdate = [];

function createSphere(radius, position) {
  // Three.js 网格
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  mesh.position.copy(position);
  mesh.castShadow = true;
  scene.add(mesh);

  // Cannon.js 物理体
  const body = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(radius),
    position: new CANNON.Vec3(position.x, position.y, position.z)
  });
  world.addBody(body);

  objectsToUpdate.push({ mesh, body });
}

// 添加碰撞检测
sphereBody.addEventListener('collide', (event) => {
  const impactStrength = event.contact.getImpactVelocityAlongNormal();
  if (impactStrength > 1.5) {
    // 播放碰撞音效
    playHitSound(impactStrength);
  }
});

// 渲染循环
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // 更新物理世界
  world.step(1 / 60, deltaTime, 3);

  // 同步位置和旋转
  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  }

  renderer.render(scene, camera);
}
```

### Rapier 物理引擎

```javascript
import RAPIER from '@dimforge/rapier3d-compat';

// 初始化 Rapier
await RAPIER.init();

// 创建物理世界
const gravity = { x: 0.0, y: -9.81, z: 0.0 };
const world = new RAPIER.World(gravity);

// 创建地面
const groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0);
world.createCollider(groundColliderDesc);

// 创建动态刚体
const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(0.0, 5.0, 0.0);
const rigidBody = world.createRigidBody(rigidBodyDesc);

// 创建碰撞体
const colliderDesc = RAPIER.ColliderDesc.ball(0.5)
  .setRestitution(0.7);
world.createCollider(colliderDesc, rigidBody);

// 物理更新
function animate() {
  requestAnimationFrame(animate);

  world.step();

  // 同步到 Three.js
  const position = rigidBody.translation();
  const rotation = rigidBody.rotation();

  mesh.position.set(position.x, position.y, position.z);
  mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

  renderer.render(scene, camera);
}
```

## 性能优化

### 几何体优化

```javascript
// 1. 合并几何体减少 draw calls
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const geometries = [];
for (let i = 0; i < 100; i++) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(
    Math.random() * 20 - 10,
    Math.random() * 20 - 10,
    Math.random() * 20 - 10
  );
  geometries.push(geometry);
}

const mergedGeometry = mergeGeometries(geometries);
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
scene.add(mergedMesh);

// 2. 使用 InstancedMesh 进行实例化渲染
const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000);

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3(1, 1, 1);

for (let i = 0; i < 1000; i++) {
  position.set(
    Math.random() * 20 - 10,
    Math.random() * 20 - 10,
    Math.random() * 20 - 10
  );
  matrix.compose(position, quaternion, scale);
  instancedMesh.setMatrixAt(i, matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);

// 3. LOD（细节层次）
const lod = new THREE.LOD();

// 高细节
const highDetailGeometry = new THREE.SphereGeometry(1, 64, 64);
const highDetailMesh = new THREE.Mesh(highDetailGeometry, material);
lod.addLevel(highDetailMesh, 0);

// 中细节
const mediumDetailGeometry = new THREE.SphereGeometry(1, 32, 32);
const mediumDetailMesh = new THREE.Mesh(mediumDetailGeometry, material);
lod.addLevel(mediumDetailMesh, 10);

// 低细节
const lowDetailGeometry = new THREE.SphereGeometry(1, 8, 8);
const lowDetailMesh = new THREE.Mesh(lowDetailGeometry, material);
lod.addLevel(lowDetailMesh, 20);

scene.add(lod);
```

### 纹理优化

```javascript
// 1. 使用压缩纹理
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('/basis/');
ktx2Loader.detectSupport(renderer);

ktx2Loader.load('/textures/compressed.ktx2', (texture) => {
  material.map = texture;
  material.needsUpdate = true;
});

// 2. 纹理图集
// 将多个小纹理合并到一张大纹理中，减少纹理切换

// 3. Mipmap 设置
texture.generateMipmaps = true;
texture.minFilter = THREE.LinearMipmapLinearFilter;

// 4. 限制纹理尺寸
const maxTextureSize = renderer.capabilities.maxTextureSize;
console.log('最大纹理尺寸:', maxTextureSize);
```

### 渲染优化

```javascript
// 1. 视锥体剔除（自动启用）
mesh.frustumCulled = true;

// 2. 遮挡剔除
// 使用 three-mesh-bvh 库进行高效的遮挡查询

// 3. 限制像素比
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. 使用 WebGLRenderer 提示
const renderer = new THREE.WebGLRenderer({
  powerPreference: 'high-performance', // 或 'low-power'
  antialias: true,
  stencil: false,  // 如果不需要模板缓冲
  depth: true
});

// 5. 监控性能
import Stats from 'three/examples/jsm/libs/stats.module.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();

  // 渲染代码...
  renderer.render(scene, camera);

  stats.end();
  requestAnimationFrame(animate);
}

// 6. 按需渲染
let needsRender = true;

function setNeedsRender() {
  needsRender = true;
}

function animate() {
  requestAnimationFrame(animate);

  if (needsRender) {
    renderer.render(scene, camera);
    needsRender = false;
  }
}

// 在交互或动画时触发渲染
controls.addEventListener('change', setNeedsRender);
```

### 内存管理

```javascript
// 正确释放资源
function disposeObject(object) {
  if (object.geometry) {
    object.geometry.dispose();
  }

  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => disposeMaterial(material));
    } else {
      disposeMaterial(object.material);
    }
  }
}

function disposeMaterial(material) {
  // 释放所有纹理
  for (const key in material) {
    const value = material[key];
    if (value && value.isTexture) {
      value.dispose();
    }
  }
  material.dispose();
}

// 清空整个场景
function clearScene() {
  scene.traverse((object) => {
    disposeObject(object);
  });

  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  renderer.dispose();
}

// 监控内存使用
console.log(renderer.info.memory);  // 几何体、纹理数量
console.log(renderer.info.render);  // draw calls、三角形数量
```

## VR/AR 支持

### WebXR VR 支持

```javascript
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// 启用 XR
renderer.xr.enabled = true;

// 添加 VR 按钮
document.body.appendChild(VRButton.createButton(renderer));

// 设置控制器
const controllerModelFactory = new XRControllerModelFactory();

const controller1 = renderer.xr.getController(0);
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
scene.add(controller1);

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

// 控制器射线
const line = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  ]),
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
line.scale.z = 5;
controller1.add(line);

// VR 交互
function onSelectStart(event) {
  const controller = event.target;

  // 射线检测
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const intersects = raycaster.intersectObjects(interactiveObjects);
  if (intersects.length > 0) {
    const object = intersects[0].object;
    controller.attach(object);  // 抓取物体
    controller.userData.selected = object;
  }
}

function onSelectEnd(event) {
  const controller = event.target;
  if (controller.userData.selected) {
    const object = controller.userData.selected;
    scene.attach(object);  // 释放物体
    controller.userData.selected = undefined;
  }
}

// XR 渲染循环
renderer.setAnimationLoop(function () {
  renderer.render(scene, camera);
});
```

### WebXR AR 支持

```javascript
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

// 启用 XR
renderer.xr.enabled = true;

// 添加 AR 按钮
document.body.appendChild(ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test'],
  optionalFeatures: ['dom-overlay'],
  domOverlay: { root: document.getElementById('ar-overlay') }
}));

// 命中测试（放置物体）
let hitTestSource = null;
let hitTestSourceRequested = false;

renderer.xr.addEventListener('sessionstart', async () => {
  const session = renderer.xr.getSession();
  const viewerReferenceSpace = await session.requestReferenceSpace('viewer');
  hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });
});

function animate(timestamp, frame) {
  if (frame && hitTestSource) {
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(renderer.xr.getReferenceSpace());

      // 显示放置指示器
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
    } else {
      reticle.visible = false;
    }
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// 点击放置物体
const controller = renderer.xr.getController(0);
controller.addEventListener('select', () => {
  if (reticle.visible) {
    const mesh = createObject();
    mesh.position.setFromMatrixPosition(reticle.matrix);
    scene.add(mesh);
  }
});
```

## 面试要点

### 核心概念题

**Q1: Three.js 的渲染管线是怎样的？**

```
渲染管线流程：
1. JavaScript 设置场景、相机、物体
2. 顶点着色器处理顶点位置
3. 图元组装（三角形）
4. 光栅化（转换为像素）
5. 片元着色器计算每个像素颜色
6. 深度测试和混合
7. 输出到帧缓冲
```

**Q2: 如何理解 Three.js 中的坐标系统？**

```javascript
// Three.js 使用右手坐标系
// X: 指向右方
// Y: 指向上方
// Z: 指向屏幕外（朝向观察者）

// 本地坐标 vs 世界坐标
const worldPosition = new THREE.Vector3();
mesh.getWorldPosition(worldPosition);

const localPosition = mesh.position.clone();

// 坐标变换
const worldMatrix = mesh.matrixWorld;
const localMatrix = mesh.matrix;
```

**Q3: 解释 PBR（基于物理的渲染）原理**

```javascript
// PBR 的核心参数：
// - Albedo（基础颜色）：物体固有颜色
// - Metalness（金属度）：是否为金属材质
// - Roughness（粗糙度）：表面微观粗糙程度
// - Normal（法线）：表面细节凹凸
// - AO（环境光遮蔽）：缝隙处的阴影

const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,    // Albedo
  metalness: 0.0,     // 0=电介质，1=金属
  roughness: 0.5,     // 0=光滑，1=粗糙
  normalMap: normalTexture,
  aoMap: aoTexture
});

// 金属材质：反射环境色
// 非金属材质：漫反射为主，少量镜面反射
```

### 性能优化题

**Q4: 如何优化大量物体的渲染？**

```javascript
// 1. 使用 InstancedMesh
// 适用于大量相同几何体的渲染
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

// 2. 合并静态几何体
const merged = mergeGeometries(geometries);

// 3. 使用 LOD
const lod = new THREE.LOD();
lod.addLevel(highDetail, 0);
lod.addLevel(lowDetail, 50);

// 4. 视锥体剔除（默认启用）
// 5. 遮挡剔除（需要额外实现）
// 6. 空间分割（八叉树等）
```

**Q5: 如何处理内存泄漏？**

```javascript
// 正确的资源释放流程
function cleanup() {
  // 1. 从场景移除对象
  scene.remove(mesh);

  // 2. 释放几何体
  mesh.geometry.dispose();

  // 3. 释放材质及其纹理
  if (mesh.material.map) mesh.material.map.dispose();
  if (mesh.material.normalMap) mesh.material.normalMap.dispose();
  mesh.material.dispose();

  // 4. 释放渲染目标
  if (renderTarget) renderTarget.dispose();

  // 5. 检查内存状态
  console.log(renderer.info.memory);
}
```

### 实战应用题

**Q6: 如何实现平滑的相机动画？**

```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// 方法1：使用 GSAP
function animateCameraTo(position, target) {
  gsap.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration: 2,
    ease: 'power2.inOut',
    onUpdate: () => controls.update()
  });

  gsap.to(controls.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: 2,
    ease: 'power2.inOut'
  });
}

// 方法2：使用 lerp 插值
function animate() {
  camera.position.lerp(targetPosition, 0.05);
  controls.target.lerp(targetLookAt, 0.05);
  controls.update();
}
```

**Q7: 如何实现物体选中高亮效果？**

```javascript
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

// 设置后处理
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.visibleEdgeColor.set(0x00ff00);
composer.addPass(outlinePass);

// 射线检测选中物体
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(selectableObjects);

  if (intersects.length > 0) {
    outlinePass.selectedObjects = [intersects[0].object];
  } else {
    outlinePass.selectedObjects = [];
  }
}

// 使用 composer 渲染
function animate() {
  composer.render();
}
```

### 常见陷阱

```javascript
// 1. 忘记更新矩阵
mesh.position.set(1, 2, 3);
mesh.updateMatrixWorld(true);  // 手动更新

// 2. 纹理色彩空间错误
colorTexture.colorSpace = THREE.SRGBColorSpace;  // 颜色纹理
normalTexture.colorSpace = THREE.LinearSRGBColorSpace;  // 数据纹理

// 3. 窗口大小变化时未更新
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 4. 阴影贴图范围不正确
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
// 使用 CameraHelper 调试
scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));

// 5. 使用 aoMap 忘记设置第二套 UV
geometry.setAttribute('uv2', geometry.attributes.uv);
```

## 总结

Three.js 是一个功能强大且持续演进的 3D 图形库。要精通 Three.js 开发，需要：

1. **扎实的基础**：理解场景图、坐标变换、渲染管线
2. **材质与光照**：掌握 PBR 原理，正确使用各种贴图
3. **性能意识**：学会使用实例化、LOD、合并等优化技术
4. **动画技能**：熟练使用 AnimationMixer 和第三方动画库
5. **交互开发**：实现射线检测、控制器等用户交互
6. **前沿技术**：跟进 WebXR、WebGPU 等新技术发展

通过不断实践和学习，你将能够创建出令人惊叹的 3D Web 体验。
