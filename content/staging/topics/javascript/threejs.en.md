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
origin: old/src/content/docs/frontend/threejs.en.md
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

Three.js is a JavaScript 3D graphics library based on WebGL that greatly simplifies the complexity of creating and displaying 3D content in browsers. Whether for product showcases, data visualization, game development, or virtual reality applications, Three.js is the preferred tool for building immersive Web 3D experiences.

## Concept Explanation: Why Choose Three.js

### The Complexity of WebGL

WebGL is a low-level graphics API, and using it directly requires:

1. **A large amount of boilerplate code**: Setting up shaders, buffers, textures, etc. requires hundreds of lines of code
2. **Deep graphics knowledge**: Understanding matrix transformations, lighting models, projections, and other concepts
3. **Manual state management**: Tracking GPU state, memory management, and other low-level details
4. **Cross-browser compatibility**: Handling differences in WebGL implementations across different browsers

### Advantages of Three.js

Three.js provides high-level abstractions that allow developers to:

- **Get started quickly**: Create complex 3D scenes with a concise API
- **Rich built-in features**: Geometries, materials, lights, loaders - everything you need
- **Active community**: Abundant examples, plugins, and third-party extensions
- **Continuous updates**: Keeps up with the latest developments in WebGL and graphics technology

## Core Concepts Explained

### Three Fundamental Components

The core of Three.js consists of three fundamental components: Scene, Camera, and Renderer.

```javascript
import * as THREE from 'three';

// 1. Create scene - container for all 3D objects
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// 2. Create camera - determines how we view the scene
const camera = new THREE.PerspectiveCamera(
  75,                                    // Field of view (FOV)
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1,                                   // Near clipping plane
  1000                                   // Far clipping plane
);
camera.position.z = 5;

// 3. Create renderer - draws the scene to the canvas
const renderer = new THREE.WebGLRenderer({
  antialias: true,  // Enable antialiasing
  alpha: true       // Support transparent background
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

### Scene Graph Structure

Three.js uses a Scene Graph to organize 3D objects:

```javascript
// Scene graph example: Solar system model
const solarSystem = new THREE.Group();
scene.add(solarSystem);

// Sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
solarSystem.add(sun);

// Earth orbit group
const earthOrbit = new THREE.Group();
solarSystem.add(earthOrbit);

// Earth
const earthGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x2233ff });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.x = 8;
earthOrbit.add(earth);

// Moon orbit group (relative to Earth)
const moonOrbit = new THREE.Group();
moonOrbit.position.x = 8;
earthOrbit.add(moonOrbit);

// Moon
const moonGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const moonMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.x = 1;
moonOrbit.add(moon);

// Animation: Rotate each orbit group
function animate() {
  requestAnimationFrame(animate);

  sun.rotation.y += 0.001;
  earthOrbit.rotation.y += 0.005;  // Earth revolution
  earth.rotation.y += 0.02;        // Earth rotation
  moonOrbit.rotation.y += 0.02;    // Moon revolution

  renderer.render(scene, camera);
}
```

### Camera Types

Three.js provides multiple camera types:

```javascript
// Perspective camera - simulates human eye perspective with near-large far-small effect
const perspectiveCamera = new THREE.PerspectiveCamera(
  75,    // FOV: Field of view angle
  aspect, // Aspect ratio
  0.1,   // Near clipping plane
  1000   // Far clipping plane
);

// Orthographic camera - no perspective distortion, suitable for 2D games or technical drawings
const orthographicCamera = new THREE.OrthographicCamera(
  -width / 2,   // left
  width / 2,    // right
  height / 2,   // top
  -height / 2,  // bottom
  0.1,          // near
  1000          // far
);

// Cube camera - used to create environment maps
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);

// Array camera - used for multi-view rendering (VR, etc.)
const arrayCamera = new THREE.ArrayCamera([camera1, camera2]);
```

## Geometries and Materials

### Built-in Geometries

Three.js provides a rich set of built-in geometries:

```javascript
// Basic geometries
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);           // Box
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);   // Sphere
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2); // Cylinder
const coneGeometry = new THREE.ConeGeometry(1, 2, 32);        // Cone
const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 100); // Torus
const planeGeometry = new THREE.PlaneGeometry(10, 10);        // Plane

// Advanced geometries
const torusKnotGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
const dodecahedronGeometry = new THREE.DodecahedronGeometry(1);
const icosahedronGeometry = new THREE.IcosahedronGeometry(1);

// Text geometry (requires font loading)
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
  textGeometry.center(); // Center alignment

  const textMesh = new THREE.Mesh(textGeometry, material);
  scene.add(textMesh);
});
```

### Custom Geometries

```javascript
// Create custom geometry using BufferGeometry
const geometry = new THREE.BufferGeometry();

// Define vertex positions
const vertices = new Float32Array([
  -1.0, -1.0,  1.0,  // Vertex 0
   1.0, -1.0,  1.0,  // Vertex 1
   1.0,  1.0,  1.0,  // Vertex 2
  -1.0,  1.0,  1.0,  // Vertex 3
]);

// Define vertex indices (forming triangles)
const indices = new Uint16Array([
  0, 1, 2,  // First triangle
  0, 2, 3   // Second triangle
]);

// Define UV coordinates (for texture mapping)
const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 1
]);

// Define normals (for lighting calculations)
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

### Material System

```javascript
// Basic material - not affected by lighting
const basicMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: false,
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide
});

// Standard material - Physically Based Rendering (PBR)
const standardMaterial = new THREE.MeshStandardMaterial({
  color: 0x049ef4,
  metalness: 0.7,      // Metalness: 0-1
  roughness: 0.2,      // Roughness: 0-1
  envMapIntensity: 1.0
});

// Physical material - more advanced PBR
const physicalMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0,
  transmission: 1,     // Transmission (glass effect)
  thickness: 0.5,      // Thickness
  ior: 1.5,           // Index of refraction
  clearcoat: 1,       // Clearcoat layer
  clearcoatRoughness: 0
});

// Normal material - displays normal directions (for debugging)
const normalMaterial = new THREE.MeshNormalMaterial();

// Lambert material - diffuse material
const lambertMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

// Phong material - material with specular highlights
const phongMaterial = new THREE.MeshPhongMaterial({
  color: 0x0000ff,
  shininess: 100,
  specular: 0xffffff
});

// Toon material - cartoon rendering style
const toonMaterial = new THREE.MeshToonMaterial({
  color: 0xff00ff,
  gradientMap: gradientTexture
});
```

## Lights and Shadows

### Light Types

```javascript
// Ambient light - uniformly illuminates all objects in the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional light - simulates sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Point light - emits light in all directions from a single point
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Spotlight - cone-shaped light beam
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6;        // Cone angle
spotLight.penumbra = 0.5;             // Edge softness
spotLight.decay = 2;                  // Decay
scene.add(spotLight);

// Hemisphere light - simulates ambient light from sky and ground
const hemisphereLight = new THREE.HemisphereLight(
  0x0000ff,  // Sky color
  0x00ff00,  // Ground color
  1
);
scene.add(hemisphereLight);

// Rectangular area light - simulates light from windows or screens
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

RectAreaLightUniformsLib.init();
const rectAreaLight = new THREE.RectAreaLight(0xffffff, 5, 4, 2);
rectAreaLight.position.set(0, 5, 0);
rectAreaLight.lookAt(0, 0, 0);
scene.add(rectAreaLight);
```

### Shadow Settings

```javascript
// Enable renderer shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows

// Configure directional light shadows
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;   // Shadow map resolution
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.0001;         // Prevent shadow artifacts

// Configure point light shadows
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 25;

// Configure spotlight shadows
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 0.5;
spotLight.shadow.camera.far = 20;
spotLight.shadow.camera.fov = 30;

// Object shadow settings
mesh.castShadow = true;     // Cast shadow
mesh.receiveShadow = true;  // Receive shadow

// Ground receives shadows
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x808080 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
```

## Textures and Material Maps

### Texture Loading

```javascript
const textureLoader = new THREE.TextureLoader();

// Load a single texture
const colorTexture = textureLoader.load(
  '/textures/brick/color.jpg',
  (texture) => console.log('Texture loaded'),
  (progress) => console.log('Loading progress:', progress),
  (error) => console.error('Loading failed:', error)
);

// Texture settings
colorTexture.wrapS = THREE.RepeatWrapping;      // Horizontal repeat
colorTexture.wrapT = THREE.RepeatWrapping;      // Vertical repeat
colorTexture.repeat.set(2, 2);                  // Repeat count
colorTexture.offset.set(0.5, 0.5);              // Offset
colorTexture.rotation = Math.PI / 4;            // Rotation
colorTexture.center.set(0.5, 0.5);              // Rotation center

// Texture filtering
colorTexture.minFilter = THREE.LinearMipmapLinearFilter; // When shrinking
colorTexture.magFilter = THREE.LinearFilter;              // When enlarging
colorTexture.generateMipmaps = true;

// Color space (for color textures)
colorTexture.colorSpace = THREE.SRGBColorSpace;
```

### PBR Material Maps

```javascript
// Load complete PBR texture set
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

  // Set color space
  textures.color.colorSpace = THREE.SRGBColorSpace;

  return textures;
};

const brickTextures = loadTextures('/textures/brick');

// Create PBR material
const pbrMaterial = new THREE.MeshStandardMaterial({
  map: brickTextures.color,              // Color map
  normalMap: brickTextures.normal,       // Normal map
  normalScale: new THREE.Vector2(1, 1),  // Normal intensity
  roughnessMap: brickTextures.roughness, // Roughness map
  metalnessMap: brickTextures.metalness, // Metalness map
  aoMap: brickTextures.ao,               // Ambient occlusion map
  aoMapIntensity: 1,
  displacementMap: brickTextures.displacement, // Displacement map
  displacementScale: 0.1,
  displacementBias: 0
});

// Note: Using aoMap requires a second set of UVs
geometry.setAttribute('uv2', geometry.attributes.uv);
```

### Environment Maps

```javascript
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Load HDR environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/textures/environment.hdr', (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  // Set scene environment
  scene.environment = environmentMap;
  scene.background = environmentMap;

  // Or use only for material reflections
  material.envMap = environmentMap;
  material.envMapIntensity = 1;
});

// Using cube texture map
const cubeTextureLoader = new THREE.CubeTextureLoader();
const envMap = cubeTextureLoader.load([
  '/textures/env/px.jpg', // Positive X
  '/textures/env/nx.jpg', // Negative X
  '/textures/env/py.jpg', // Positive Y
  '/textures/env/ny.jpg', // Negative Y
  '/textures/env/pz.jpg', // Positive Z
  '/textures/env/nz.jpg'  // Negative Z
]);
scene.background = envMap;
scene.environment = envMap;
```

## 3D Model Loading

### GLTF/GLB Model Loading

GLTF (GL Transmission Format) is the currently recommended 3D model format:

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Configure Draco decoder (for compressed models)
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

// Create GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Load model
gltfLoader.load(
  '/models/robot.glb',
  (gltf) => {
    // Success callback
    const model = gltf.scene;

    // Traverse model to set properties
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Can replace materials
        if (child.material) {
          child.material.envMap = environmentMap;
          child.material.envMapIntensity = 0.5;
        }
      }
    });

    // Adjust model size and position
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(0, 0, 0);

    scene.add(model);

    // Handle animations
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();

      // Update in render loop
      // mixer.update(deltaTime);
    }
  },
  (progress) => {
    // Loading progress
    const percent = (progress.loaded / progress.total) * 100;
    console.log(`Loading progress: ${percent.toFixed(2)}%`);
  },
  (error) => {
    // Error handling
    console.error('Model loading failed:', error);
  }
);
```

### OBJ Model Loading

```javascript
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

// Load materials first
const mtlLoader = new MTLLoader();
mtlLoader.load('/models/object.mtl', (materials) => {
  materials.preload();

  // Then load model
  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.load('/models/object.obj', (object) => {
    scene.add(object);
  });
});
```

### FBX Model Loading

```javascript
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const fbxLoader = new FBXLoader();
fbxLoader.load('/models/character.fbx', (fbx) => {
  fbx.scale.setScalar(0.01);

  // FBX typically contains skeletal animations
  if (fbx.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(fbx);
    const action = mixer.clipAction(fbx.animations[0]);
    action.play();
  }

  scene.add(fbx);
});
```

## Animation System

### Basic Animation

```javascript
// Use Clock for time management
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  const deltaTime = clock.getDelta();

  // Time-based animation
  mesh.rotation.y = elapsedTime * 0.5;
  mesh.position.y = Math.sin(elapsedTime) * 0.5;

  renderer.render(scene, camera);
}
```

### AnimationMixer System

```javascript
// Create animation mixer
const mixer = new THREE.AnimationMixer(model);

// Add animation clips
const idleAction = mixer.clipAction(animations.find(a => a.name === 'Idle'));
const walkAction = mixer.clipAction(animations.find(a => a.name === 'Walk'));
const runAction = mixer.clipAction(animations.find(a => a.name === 'Run'));

// Configure animation
idleAction.play();

// Animation transition
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

// Animation event listeners
mixer.addEventListener('finished', (e) => {
  console.log('Animation finished:', e.action.getClip().name);
});

mixer.addEventListener('loop', (e) => {
  console.log('Animation looped:', e.action.getClip().name);
});

// Update in render loop
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  mixer.update(deltaTime);

  renderer.render(scene, camera);
}
```

### GSAP Animation Integration

```javascript
import gsap from 'gsap';

// Create timeline animation
const timeline = gsap.timeline({ repeat: -1, yoyo: true });

timeline
  .to(mesh.position, { x: 2, duration: 1, ease: 'power2.inOut' })
  .to(mesh.rotation, { y: Math.PI, duration: 0.5 }, '-=0.5')
  .to(mesh.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.5 });

// Interactive animation
mesh.addEventListener('click', () => {
  gsap.to(mesh.position, {
    y: mesh.position.y + 1,
    duration: 0.3,
    ease: 'back.out(2)',
    yoyo: true,
    repeat: 1
  });
});

// Camera animation
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

### Morph Animation (Morph Targets)

```javascript
// Assuming model has morph targets
const morphMesh = model.getObjectByName('Face');

if (morphMesh.morphTargetInfluences) {
  // Get morph target names
  const morphTargets = morphMesh.morphTargetDictionary;
  console.log('Morph targets:', Object.keys(morphTargets));

  // Control morphing via index
  gsap.to(morphMesh.morphTargetInfluences, {
    [morphTargets['smile']]: 1,
    duration: 0.5
  });
}
```

## Physics Engine Integration

### Cannon.js Physics Engine

```javascript
import * as CANNON from 'cannon-es';

// Create physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Add materials
const defaultMaterial = new CANNON.Material('default');
const contactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.3,
    restitution: 0.7  // Elasticity
  }
);
world.addContactMaterial(contactMaterial);
world.defaultContactMaterial = contactMaterial;

// Create ground physics body
const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Create sphere physics body
const sphereBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(0.5),
  position: new CANNON.Vec3(0, 5, 0)
});
world.addBody(sphereBody);

// Sync physics and rendering
const objectsToUpdate = [];

function createSphere(radius, position) {
  // Three.js mesh
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  mesh.position.copy(position);
  mesh.castShadow = true;
  scene.add(mesh);

  // Cannon.js physics body
  const body = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(radius),
    position: new CANNON.Vec3(position.x, position.y, position.z)
  });
  world.addBody(body);

  objectsToUpdate.push({ mesh, body });
}

// Add collision detection
sphereBody.addEventListener('collide', (event) => {
  const impactStrength = event.contact.getImpactVelocityAlongNormal();
  if (impactStrength > 1.5) {
    // Play collision sound
    playHitSound(impactStrength);
  }
});

// Render loop
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // Update physics world
  world.step(1 / 60, deltaTime, 3);

  // Sync position and rotation
  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  }

  renderer.render(scene, camera);
}
```

### Rapier Physics Engine

```javascript
import RAPIER from '@dimforge/rapier3d-compat';

// Initialize Rapier
await RAPIER.init();

// Create physics world
const gravity = { x: 0.0, y: -9.81, z: 0.0 };
const world = new RAPIER.World(gravity);

// Create ground
const groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0);
world.createCollider(groundColliderDesc);

// Create dynamic rigid body
const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(0.0, 5.0, 0.0);
const rigidBody = world.createRigidBody(rigidBodyDesc);

// Create collider
const colliderDesc = RAPIER.ColliderDesc.ball(0.5)
  .setRestitution(0.7);
world.createCollider(colliderDesc, rigidBody);

// Physics update
function animate() {
  requestAnimationFrame(animate);

  world.step();

  // Sync to Three.js
  const position = rigidBody.translation();
  const rotation = rigidBody.rotation();

  mesh.position.set(position.x, position.y, position.z);
  mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

  renderer.render(scene, camera);
}
```

## Performance Optimization

### Geometry Optimization

```javascript
// 1. Merge geometries to reduce draw calls
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

// 2. Use InstancedMesh for instanced rendering
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

// 3. LOD (Level of Detail)
const lod = new THREE.LOD();

// High detail
const highDetailGeometry = new THREE.SphereGeometry(1, 64, 64);
const highDetailMesh = new THREE.Mesh(highDetailGeometry, material);
lod.addLevel(highDetailMesh, 0);

// Medium detail
const mediumDetailGeometry = new THREE.SphereGeometry(1, 32, 32);
const mediumDetailMesh = new THREE.Mesh(mediumDetailGeometry, material);
lod.addLevel(mediumDetailMesh, 10);

// Low detail
const lowDetailGeometry = new THREE.SphereGeometry(1, 8, 8);
const lowDetailMesh = new THREE.Mesh(lowDetailGeometry, material);
lod.addLevel(lowDetailMesh, 20);

scene.add(lod);
```

### Texture Optimization

```javascript
// 1. Use compressed textures
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('/basis/');
ktx2Loader.detectSupport(renderer);

ktx2Loader.load('/textures/compressed.ktx2', (texture) => {
  material.map = texture;
  material.needsUpdate = true;
});

// 2. Texture atlas
// Combine multiple small textures into one large texture to reduce texture switches

// 3. Mipmap settings
texture.generateMipmaps = true;
texture.minFilter = THREE.LinearMipmapLinearFilter;

// 4. Limit texture size
const maxTextureSize = renderer.capabilities.maxTextureSize;
console.log('Max texture size:', maxTextureSize);
```

### Rendering Optimization

```javascript
// 1. Frustum culling (enabled by default)
mesh.frustumCulled = true;

// 2. Occlusion culling
// Use three-mesh-bvh library for efficient occlusion queries

// 3. Limit pixel ratio
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. Use WebGLRenderer hints
const renderer = new THREE.WebGLRenderer({
  powerPreference: 'high-performance', // or 'low-power'
  antialias: true,
  stencil: false,  // If stencil buffer not needed
  depth: true
});

// 5. Monitor performance
import Stats from 'three/examples/jsm/libs/stats.module.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();

  // Rendering code...
  renderer.render(scene, camera);

  stats.end();
  requestAnimationFrame(animate);
}

// 6. On-demand rendering
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

// Trigger render on interaction or animation
controls.addEventListener('change', setNeedsRender);
```

### Memory Management

```javascript
// Properly dispose resources
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
  // Dispose all textures
  for (const key in material) {
    const value = material[key];
    if (value && value.isTexture) {
      value.dispose();
    }
  }
  material.dispose();
}

// Clear entire scene
function clearScene() {
  scene.traverse((object) => {
    disposeObject(object);
  });

  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  renderer.dispose();
}

// Monitor memory usage
console.log(renderer.info.memory);  // Geometry, texture counts
console.log(renderer.info.render);  // Draw calls, triangle counts
```

## VR/AR Support

### WebXR VR Support

```javascript
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// Enable XR
renderer.xr.enabled = true;

// Add VR button
document.body.appendChild(VRButton.createButton(renderer));

// Set up controllers
const controllerModelFactory = new XRControllerModelFactory();

const controller1 = renderer.xr.getController(0);
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
scene.add(controller1);

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

// Controller ray
const line = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  ]),
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
line.scale.z = 5;
controller1.add(line);

// VR interaction
function onSelectStart(event) {
  const controller = event.target;

  // Ray detection
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const intersects = raycaster.intersectObjects(interactiveObjects);
  if (intersects.length > 0) {
    const object = intersects[0].object;
    controller.attach(object);  // Grab object
    controller.userData.selected = object;
  }
}

function onSelectEnd(event) {
  const controller = event.target;
  if (controller.userData.selected) {
    const object = controller.userData.selected;
    scene.attach(object);  // Release object
    controller.userData.selected = undefined;
  }
}

// XR render loop
renderer.setAnimationLoop(function () {
  renderer.render(scene, camera);
});
```

### WebXR AR Support

```javascript
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

// Enable XR
renderer.xr.enabled = true;

// Add AR button
document.body.appendChild(ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test'],
  optionalFeatures: ['dom-overlay'],
  domOverlay: { root: document.getElementById('ar-overlay') }
}));

// Hit testing (placing objects)
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

      // Show placement indicator
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
    } else {
      reticle.visible = false;
    }
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Click to place object
const controller = renderer.xr.getController(0);
controller.addEventListener('select', () => {
  if (reticle.visible) {
    const mesh = createObject();
    mesh.position.setFromMatrixPosition(reticle.matrix);
    scene.add(mesh);
  }
});
```

## Interview Key Points

### Core Concept Questions

**Q1: What is the Three.js rendering pipeline?**

```
Rendering pipeline flow:
1. JavaScript sets up scene, camera, objects
2. Vertex shader processes vertex positions
3. Primitive assembly (triangles)
4. Rasterization (convert to pixels)
5. Fragment shader calculates each pixel color
6. Depth testing and blending
7. Output to frame buffer
```

**Q2: How do you understand the coordinate system in Three.js?**

```javascript
// Three.js uses right-hand coordinate system
// X: points right
// Y: points up
// Z: points out of screen (toward observer)

// Local coordinates vs World coordinates
const worldPosition = new THREE.Vector3();
mesh.getWorldPosition(worldPosition);

const localPosition = mesh.position.clone();

// Coordinate transformation
const worldMatrix = mesh.matrixWorld;
const localMatrix = mesh.matrix;
```

**Q3: Explain PBR (Physically Based Rendering) principles**

```javascript
// Core PBR parameters:
// - Albedo (base color): Intrinsic color of the object
// - Metalness: Whether it's a metallic material
// - Roughness: Microscopic surface roughness
// - Normal: Surface detail bumps
// - AO (Ambient Occlusion): Shadows in crevices

const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,    // Albedo
  metalness: 0.0,     // 0=dielectric, 1=metal
  roughness: 0.5,     // 0=smooth, 1=rough
  normalMap: normalTexture,
  aoMap: aoTexture
});

// Metal materials: Reflect environment color
// Non-metal materials: Primarily diffuse, with slight specular reflection
```

### Performance Optimization Questions

**Q4: How to optimize rendering of large numbers of objects?**

```javascript
// 1. Use InstancedMesh
// Suitable for rendering many identical geometries
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

// 2. Merge static geometries
const merged = mergeGeometries(geometries);

// 3. Use LOD
const lod = new THREE.LOD();
lod.addLevel(highDetail, 0);
lod.addLevel(lowDetail, 50);

// 4. Frustum culling (enabled by default)
// 5. Occlusion culling (requires additional implementation)
// 6. Spatial partitioning (octree, etc.)
```

**Q5: How to handle memory leaks?**

```javascript
// Proper resource disposal flow
function cleanup() {
  // 1. Remove object from scene
  scene.remove(mesh);

  // 2. Dispose geometry
  mesh.geometry.dispose();

  // 3. Dispose material and its textures
  if (mesh.material.map) mesh.material.map.dispose();
  if (mesh.material.normalMap) mesh.material.normalMap.dispose();
  mesh.material.dispose();

  // 4. Dispose render targets
  if (renderTarget) renderTarget.dispose();

  // 5. Check memory status
  console.log(renderer.info.memory);
}
```

### Practical Application Questions

**Q6: How to implement smooth camera animation?**

```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// Method 1: Using GSAP
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

// Method 2: Using lerp interpolation
function animate() {
  camera.position.lerp(targetPosition, 0.05);
  controls.target.lerp(targetLookAt, 0.05);
  controls.update();
}
```

**Q7: How to implement object selection highlight effect?**

```javascript
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

// Set up post-processing
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

// Raycast to select objects
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

// Use composer for rendering
function animate() {
  composer.render();
}
```

### Common Pitfalls

```javascript
// 1. Forgetting to update matrices
mesh.position.set(1, 2, 3);
mesh.updateMatrixWorld(true);  // Manual update

// 2. Incorrect texture color space
colorTexture.colorSpace = THREE.SRGBColorSpace;  // Color textures
normalTexture.colorSpace = THREE.LinearSRGBColorSpace;  // Data textures

// 3. Not updating on window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 4. Incorrect shadow map range
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
// Use CameraHelper for debugging
scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));

// 5. Forgetting to set second UV set when using aoMap
geometry.setAttribute('uv2', geometry.attributes.uv);
```

## Summary

Three.js is a powerful and continuously evolving 3D graphics library. To master Three.js development, you need:

1. **Solid foundations**: Understand scene graphs, coordinate transformations, rendering pipeline
2. **Materials and lighting**: Master PBR principles, correctly use various texture maps
3. **Performance awareness**: Learn to use instancing, LOD, merging, and other optimization techniques
4. **Animation skills**: Proficiently use AnimationMixer and third-party animation libraries
5. **Interaction development**: Implement raycasting, controllers, and other user interactions
6. **Cutting-edge technology**: Keep up with new technologies like WebXR, WebGPU

Through continuous practice and learning, you will be able to create stunning 3D Web experiences.
