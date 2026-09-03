---
title: Tilemap System Design
description: "Build efficient tilemap systems: Tilemap, auto-tiling, and procedural generation"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - Tilemap
  - 2D
  - level design
  - procedural generation
status: imported
origin: old/src/content/docs/gamedev/tilemap-system.en.md
divergence: 0.329
issues: []
legacy:
  category: GameDev
  subcategory: 2D
  order: 28
  lastUpdated: 2026-01-07
---

Tilemap systems are fundamental to 2D game development, powering everything from classic platformers to sprawling RPGs. By dividing game worlds into discrete tiles, developers can efficiently create, render, and manage large game environments while maintaining consistent collision detection and enabling powerful design tools. This comprehensive guide covers everything you need to build a robust tilemap system, from basic concepts to advanced techniques like auto-tiling and procedural generation.

## Introduction to Tilemaps

### What is a Tilemap?

A tilemap is a technique for creating game worlds by arranging small, reusable graphic tiles on a grid. Instead of creating one massive image for your entire game level, you define a set of tiles (a tileset) and place them on a 2D grid to construct your world.

This approach offers several significant advantages:

1. **Memory Efficiency**: Store one copy of each tile texture and reference it multiple times
2. **Design Flexibility**: Easily modify levels by changing tile placements
3. **Consistent Collision**: Grid-based collision detection is straightforward and performant
4. **Tool Support**: Powerful editors like Tiled make level design accessible
5. **Procedural Generation**: Tilemaps are ideal candidates for algorithmic level creation

### Core Components

A complete tilemap system consists of several interconnected components:

```
+------------------+     +------------------+     +------------------+
|     Tileset      |     |     Tilemap      |     |    Renderer      |
|------------------|     |------------------|     |------------------|
| - Tile Images    |---->| - Grid Data      |---->| - Batch Drawing  |
| - Tile Properties|     | - Multiple Layers|     | - Camera Culling |
| - Animations     |     | - Tile References|     | - Layer Ordering |
+------------------+     +------------------+     +------------------+
         |                        |
         v                        v
+------------------+     +------------------+
|   Collision      |     |   Auto-Tiling    |
|------------------|     |------------------|
| - Collision Masks|     | - Bitmask Rules  |
| - Shape Data     |     | - Terrain Types  |
+------------------+     +------------------+
```

## Tileset Design and Implementation

### Creating an Effective Tileset

A tileset is a collection of tile images organized in a single texture atlas. Good tileset design is crucial for both visual quality and system efficiency.

**Basic Tileset Structure:**

```javascript
class Tileset {
  constructor(config) {
    this.image = null;
    this.tileWidth = config.tileWidth || 16;
    this.tileHeight = config.tileHeight || 16;
    this.columns = 0;
    this.rows = 0;
    this.tiles = new Map();
    this.firstGid = config.firstGid || 1;
  }

  async load(imagePath) {
    return new Promise((resolve, reject) => {
      this.image = new Image();
      this.image.onload = () => {
        this.columns = Math.floor(this.image.width / this.tileWidth);
        this.rows = Math.floor(this.image.height / this.tileHeight);
        this.initializeTiles();
        resolve(this);
      };
      this.image.onerror = reject;
      this.image.src = imagePath;
    });
  }

  initializeTiles() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        const id = this.firstGid + y * this.columns + x;
        this.tiles.set(id, {
          id,
          x: x * this.tileWidth,
          y: y * this.tileHeight,
          width: this.tileWidth,
          height: this.tileHeight,
          properties: {}
        });
      }
    }
  }

  getTile(id) {
    return this.tiles.get(id);
  }

  getTileRegion(id) {
    const tile = this.getTile(id);
    if (!tile) return null;
    return {
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height
    };
  }
}
```

### Tile Properties and Metadata

Each tile can have associated properties that define its behavior:

```javascript
class TileProperties {
  constructor() {
    this.collision = false;
    this.collisionShape = null; // 'full', 'slope-left', 'slope-right', 'half-top', etc.
    this.friction = 1.0;
    this.damage = 0;
    this.animation = null;
    this.customProperties = {};
  }
}

// Extended tileset with property support
class EnhancedTileset extends Tileset {
  setTileProperty(tileId, property, value) {
    const tile = this.tiles.get(tileId);
    if (tile) {
      if (!tile.properties) {
        tile.properties = new TileProperties();
      }
      tile.properties[property] = value;
    }
  }

  getTileProperty(tileId, property) {
    const tile = this.tiles.get(tileId);
    return tile?.properties?.[property];
  }

  // Batch set properties for multiple tiles
  setPropertiesForRange(startId, endId, properties) {
    for (let id = startId; id <= endId; id++) {
      Object.entries(properties).forEach(([key, value]) => {
        this.setTileProperty(id, key, value);
      });
    }
  }
}

// Usage
const tileset = new EnhancedTileset({ tileWidth: 16, tileHeight: 16 });
await tileset.load('tileset.png');

// Mark tiles 1-10 as solid collision
tileset.setPropertiesForRange(1, 10, { collision: true, collisionShape: 'full' });

// Set up a sloped tile
tileset.setTileProperty(11, 'collision', true);
tileset.setTileProperty(11, 'collisionShape', 'slope-left');
```

### Animated Tiles

Many games require animated tiles for water, lava, torches, and other dynamic elements:

```javascript
class AnimatedTile {
  constructor(frames, frameDuration) {
    this.frames = frames; // Array of tile IDs
    this.frameDuration = frameDuration; // Milliseconds per frame
    this.currentFrame = 0;
    this.elapsedTime = 0;
  }

  update(deltaTime) {
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.frameDuration) {
      this.elapsedTime -= this.frameDuration;
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }
  }

  getCurrentTileId() {
    return this.frames[this.currentFrame];
  }
}

class TileAnimationManager {
  constructor() {
    this.animations = new Map();
    this.animatedTiles = new Map(); // Maps base tile ID to animation
  }

  registerAnimation(baseTileId, frames, frameDuration) {
    const animation = new AnimatedTile(frames, frameDuration);
    this.animatedTiles.set(baseTileId, animation);
  }

  update(deltaTime) {
    for (const animation of this.animatedTiles.values()) {
      animation.update(deltaTime);
    }
  }

  getDisplayTileId(tileId) {
    const animation = this.animatedTiles.get(tileId);
    return animation ? animation.getCurrentTileId() : tileId;
  }
}

// Usage
const animationManager = new TileAnimationManager();

// Water animation: cycles through tiles 20, 21, 22, 23
animationManager.registerAnimation(20, [20, 21, 22, 23], 200);

// Torch animation: cycles through tiles 30, 31, 32
animationManager.registerAnimation(30, [30, 31, 32], 150);
```

## Tilemap Data Structures

### Basic Tilemap Implementation

The tilemap stores the actual grid data and provides methods for querying and modifying tiles:

```javascript
class TilemapLayer {
  constructor(width, height, name = 'default') {
    this.width = width;
    this.height = height;
    this.name = name;
    this.visible = true;
    this.opacity = 1.0;
    this.data = new Uint32Array(width * height);
    this.parallaxX = 1.0;
    this.parallaxY = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  getTile(x, y) {
    if (this.isOutOfBounds(x, y)) return 0;
    return this.data[y * this.width + x];
  }

  setTile(x, y, tileId) {
    if (this.isOutOfBounds(x, y)) return;
    this.data[y * this.width + x] = tileId;
  }

  isOutOfBounds(x, y) {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  fill(tileId) {
    this.data.fill(tileId);
  }

  clear() {
    this.fill(0);
  }

  // Get tiles in a rectangular region
  getRegion(startX, startY, endX, endY) {
    const tiles = [];
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        tiles.push({
          x,
          y,
          tileId: this.getTile(x, y)
        });
      }
    }
    return tiles;
  }
}

class Tilemap {
  constructor(width, height, tileWidth, tileHeight) {
    this.width = width;
    this.height = height;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.layers = new Map();
    this.tilesets = [];
    this.properties = {};
  }

  addLayer(name, zIndex = 0) {
    const layer = new TilemapLayer(this.width, this.height, name);
    layer.zIndex = zIndex;
    this.layers.set(name, layer);
    return layer;
  }

  getLayer(name) {
    return this.layers.get(name);
  }

  removeLayer(name) {
    return this.layers.delete(name);
  }

  getSortedLayers() {
    return Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  addTileset(tileset) {
    this.tilesets.push(tileset);
    // Sort by firstGid descending for proper lookup
    this.tilesets.sort((a, b) => b.firstGid - a.firstGid);
  }

  getTilesetForTile(tileId) {
    for (const tileset of this.tilesets) {
      if (tileId >= tileset.firstGid) {
        return tileset;
      }
    }
    return null;
  }

  // Convert world coordinates to tile coordinates
  worldToTile(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.tileWidth),
      y: Math.floor(worldY / this.tileHeight)
    };
  }

  // Convert tile coordinates to world coordinates
  tileToWorld(tileX, tileY) {
    return {
      x: tileX * this.tileWidth,
      y: tileY * this.tileHeight
    };
  }

  // Get pixel dimensions of the map
  getPixelWidth() {
    return this.width * this.tileWidth;
  }

  getPixelHeight() {
    return this.height * this.tileHeight;
  }
}
```

### Chunk-Based Tilemaps for Large Worlds

For very large worlds, loading the entire map into memory is impractical. Chunk-based systems solve this:

```javascript
class TilemapChunk {
  constructor(chunkX, chunkY, size) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.size = size;
    this.layers = new Map();
    this.loaded = false;
    this.dirty = false;
  }

  getLocalCoords(worldTileX, worldTileY) {
    return {
      x: worldTileX - this.chunkX * this.size,
      y: worldTileY - this.chunkY * this.size
    };
  }
}

class ChunkedTilemap {
  constructor(tileWidth, tileHeight, chunkSize = 32) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.chunkSize = chunkSize;
    this.chunks = new Map();
    this.loadedChunks = new Set();
    this.maxLoadedChunks = 25; // 5x5 grid around player
  }

  getChunkKey(chunkX, chunkY) {
    return `${chunkX},${chunkY}`;
  }

  getChunkCoords(tileX, tileY) {
    return {
      chunkX: Math.floor(tileX / this.chunkSize),
      chunkY: Math.floor(tileY / this.chunkSize)
    };
  }

  async loadChunk(chunkX, chunkY) {
    const key = this.getChunkKey(chunkX, chunkY);
    if (this.chunks.has(key)) {
      return this.chunks.get(key);
    }

    const chunk = new TilemapChunk(chunkX, chunkY, this.chunkSize);

    // Load chunk data from storage/generator
    await this.loadChunkData(chunk);

    chunk.loaded = true;
    this.chunks.set(key, chunk);
    this.loadedChunks.add(key);

    // Unload distant chunks if we have too many
    this.pruneChunks(chunkX, chunkY);

    return chunk;
  }

  async loadChunkData(chunk) {
    // Override this method to load from file, database, or generate procedurally
    // For now, initialize empty layers
    chunk.layers.set('ground', {
      data: new Uint32Array(chunk.size * chunk.size)
    });
  }

  pruneChunks(centerChunkX, centerChunkY) {
    if (this.loadedChunks.size <= this.maxLoadedChunks) return;

    const chunksWithDistance = [];
    for (const key of this.loadedChunks) {
      const [x, y] = key.split(',').map(Number);
      const distance = Math.abs(x - centerChunkX) + Math.abs(y - centerChunkY);
      chunksWithDistance.push({ key, distance });
    }

    // Sort by distance descending
    chunksWithDistance.sort((a, b) => b.distance - a.distance);

    // Unload furthest chunks
    while (this.loadedChunks.size > this.maxLoadedChunks) {
      const toRemove = chunksWithDistance.shift();
      const chunk = this.chunks.get(toRemove.key);

      // Save if dirty
      if (chunk?.dirty) {
        this.saveChunk(chunk);
      }

      this.chunks.delete(toRemove.key);
      this.loadedChunks.delete(toRemove.key);
    }
  }

  async saveChunk(chunk) {
    // Override to implement saving
    chunk.dirty = false;
  }

  getTile(layerName, tileX, tileY) {
    const { chunkX, chunkY } = this.getChunkCoords(tileX, tileY);
    const key = this.getChunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(key);

    if (!chunk?.loaded) return 0;

    const layer = chunk.layers.get(layerName);
    if (!layer) return 0;

    const local = chunk.getLocalCoords(tileX, tileY);
    return layer.data[local.y * chunk.size + local.x];
  }

  setTile(layerName, tileX, tileY, tileId) {
    const { chunkX, chunkY } = this.getChunkCoords(tileX, tileY);
    const key = this.getChunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(key);

    if (!chunk?.loaded) return;

    let layer = chunk.layers.get(layerName);
    if (!layer) {
      layer = { data: new Uint32Array(chunk.size * chunk.size) };
      chunk.layers.set(layerName, layer);
    }

    const local = chunk.getLocalCoords(tileX, tileY);
    layer.data[local.y * chunk.size + local.x] = tileId;
    chunk.dirty = true;
  }

  // Update loaded chunks based on camera position
  async updateLoadedChunks(cameraX, cameraY, viewWidth, viewHeight) {
    const startTile = this.worldToTile(cameraX, cameraY);
    const endTile = this.worldToTile(cameraX + viewWidth, cameraY + viewHeight);

    const startChunk = this.getChunkCoords(startTile.x - this.chunkSize, startTile.y - this.chunkSize);
    const endChunk = this.getChunkCoords(endTile.x + this.chunkSize, endTile.y + this.chunkSize);

    const loadPromises = [];
    for (let cy = startChunk.chunkY; cy <= endChunk.chunkY; cy++) {
      for (let cx = startChunk.chunkX; cx <= endChunk.chunkX; cx++) {
        const key = this.getChunkKey(cx, cy);
        if (!this.loadedChunks.has(key)) {
          loadPromises.push(this.loadChunk(cx, cy));
        }
      }
    }

    await Promise.all(loadPromises);
  }

  worldToTile(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.tileWidth),
      y: Math.floor(worldY / this.tileHeight)
    };
  }
}
```

## Auto-Tiling Systems

Auto-tiling automatically selects the correct tile variant based on neighboring tiles, dramatically speeding up level design while ensuring visual consistency.

### Understanding Bitmask Auto-Tiling

The most common approach uses bitmasks to encode neighbor information:

```
Neighbor positions and their bit values:
+---+---+---+
| 1 | 2 | 4 |
+---+---+---+
| 8 | X |16 |
+---+---+---+
|32 |64 |128|
+---+---+---+

The center tile (X) checks each neighbor.
If a neighbor is the same terrain type, its bit is set.
The resulting bitmask (0-255) determines which tile variant to use.
```

### 4-Bit (Blob) Auto-Tiling

A simpler approach using only cardinal directions (16 variants):

```javascript
class AutoTiler4Bit {
  constructor() {
    // Maps 4-bit mask to tile index in tileset
    // Bit order: North(1), East(2), South(4), West(8)
    this.tileMapping = new Map([
      [0,  0],  // No neighbors
      [1,  1],  // North only
      [2,  2],  // East only
      [3,  3],  // North + East
      [4,  4],  // South only
      [5,  5],  // North + South
      [6,  6],  // East + South
      [7,  7],  // North + East + South
      [8,  8],  // West only
      [9,  9],  // North + West
      [10, 10], // East + West
      [11, 11], // North + East + West
      [12, 12], // South + West
      [13, 13], // North + South + West
      [14, 14], // East + South + West
      [15, 15], // All neighbors
    ]);
  }

  calculateBitmask(tilemap, layer, x, y, terrainType) {
    let mask = 0;

    // Check cardinal directions
    if (this.isSameTerrain(tilemap, layer, x, y - 1, terrainType)) mask |= 1; // North
    if (this.isSameTerrain(tilemap, layer, x + 1, y, terrainType)) mask |= 2; // East
    if (this.isSameTerrain(tilemap, layer, x, y + 1, terrainType)) mask |= 4; // South
    if (this.isSameTerrain(tilemap, layer, x - 1, y, terrainType)) mask |= 8; // West

    return mask;
  }

  isSameTerrain(tilemap, layer, x, y, terrainType) {
    const tileId = tilemap.getLayer(layer)?.getTile(x, y) ?? 0;
    return this.getTileTerrainType(tileId) === terrainType;
  }

  getTileTerrainType(tileId) {
    // Override to map tile IDs to terrain types
    // For example: tiles 1-16 are 'grass', 17-32 are 'water'
    if (tileId >= 1 && tileId <= 16) return 'grass';
    if (tileId >= 17 && tileId <= 32) return 'water';
    return null;
  }

  getAutoTile(tilemap, layer, x, y, terrainType, baseTileId) {
    const mask = this.calculateBitmask(tilemap, layer, x, y, terrainType);
    const offset = this.tileMapping.get(mask) ?? 0;
    return baseTileId + offset;
  }
}
```

### 8-Bit (Wang) Auto-Tiling

Full 8-directional auto-tiling for more seamless results (47 unique variants):

```javascript
class AutoTiler8Bit {
  constructor() {
    // The full 256 possibilities map to 47 unique visual tiles
    // This is the standard "blob" tileset mapping
    this.blobMapping = this.createBlobMapping();
  }

  createBlobMapping() {
    // This mapping handles corner cases properly
    // Corners only matter if both adjacent edges are present
    const mapping = new Map();

    // Generate all 256 possibilities
    for (let i = 0; i < 256; i++) {
      mapping.set(i, this.calculateBlobIndex(i));
    }

    return mapping;
  }

  calculateBlobIndex(fullMask) {
    // Extract bits
    const nw = (fullMask & 1) !== 0;
    const n  = (fullMask & 2) !== 0;
    const ne = (fullMask & 4) !== 0;
    const w  = (fullMask & 8) !== 0;
    const e  = (fullMask & 16) !== 0;
    const sw = (fullMask & 32) !== 0;
    const s  = (fullMask & 64) !== 0;
    const se = (fullMask & 128) !== 0;

    // Corners only count if both adjacent edges are present
    let reducedMask = 0;
    if (n) reducedMask |= 2;
    if (w) reducedMask |= 8;
    if (e) reducedMask |= 16;
    if (s) reducedMask |= 64;
    if (nw && n && w) reducedMask |= 1;
    if (ne && n && e) reducedMask |= 4;
    if (sw && s && w) reducedMask |= 32;
    if (se && s && e) reducedMask |= 128;

    return this.reducedMaskToTileIndex(reducedMask);
  }

  reducedMaskToTileIndex(mask) {
    // Maps reduced masks to tile indices (0-46)
    // This is the standard 47-tile blob tileset layout
    const lookupTable = {
      0: 0, 2: 1, 8: 2, 10: 3, 11: 4, 16: 5, 18: 6, 22: 7,
      24: 8, 26: 9, 27: 10, 30: 11, 31: 12, 64: 13, 66: 14,
      72: 15, 74: 16, 75: 17, 80: 18, 82: 19, 86: 20, 88: 21,
      90: 22, 91: 23, 94: 24, 95: 25, 104: 26, 106: 27, 107: 28,
      120: 29, 122: 30, 123: 31, 126: 32, 127: 33, 208: 34,
      210: 35, 214: 36, 216: 37, 218: 38, 219: 39, 222: 40,
      223: 41, 248: 42, 250: 43, 251: 44, 254: 45, 255: 46
    };
    return lookupTable[mask] ?? 0;
  }

  calculateBitmask(tilemap, layer, x, y, matchFn) {
    let mask = 0;

    // Check all 8 directions
    const directions = [
      { dx: -1, dy: -1, bit: 1 },   // Northwest
      { dx: 0,  dy: -1, bit: 2 },   // North
      { dx: 1,  dy: -1, bit: 4 },   // Northeast
      { dx: -1, dy: 0,  bit: 8 },   // West
      { dx: 1,  dy: 0,  bit: 16 },  // East
      { dx: -1, dy: 1,  bit: 32 },  // Southwest
      { dx: 0,  dy: 1,  bit: 64 },  // South
      { dx: 1,  dy: 1,  bit: 128 }, // Southeast
    ];

    for (const { dx, dy, bit } of directions) {
      if (matchFn(tilemap, layer, x + dx, y + dy)) {
        mask |= bit;
      }
    }

    return mask;
  }

  getAutoTile(tilemap, layer, x, y, matchFn, baseTileId) {
    const mask = this.calculateBitmask(tilemap, layer, x, y, matchFn);
    const tileIndex = this.blobMapping.get(mask);
    return baseTileId + tileIndex;
  }
}

// Usage
const autoTiler = new AutoTiler8Bit();

function isGrassTile(tilemap, layer, x, y) {
  const tileId = tilemap.getLayer(layer)?.getTile(x, y) ?? 0;
  return tileId >= 1 && tileId <= 47; // Grass tiles range
}

// When placing a grass tile
function placeGrassTile(tilemap, x, y) {
  const layer = tilemap.getLayer('ground');

  // Set initial tile
  const autoTileId = autoTiler.getAutoTile(tilemap, 'ground', x, y, isGrassTile, 1);
  layer.setTile(x, y, autoTileId);

  // Update neighboring tiles
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (isGrassTile(tilemap, 'ground', nx, ny)) {
        const neighborAutoTile = autoTiler.getAutoTile(tilemap, 'ground', nx, ny, isGrassTile, 1);
        layer.setTile(nx, ny, neighborAutoTile);
      }
    }
  }
}
```

### Terrain-Based Auto-Tiling

For multiple terrain types that transition into each other:

```javascript
class TerrainAutoTiler {
  constructor() {
    this.terrains = new Map();
    this.transitions = new Map();
  }

  registerTerrain(name, config) {
    this.terrains.set(name, {
      name,
      priority: config.priority || 0,
      baseTileId: config.baseTileId,
      tileCount: config.tileCount || 47,
    });
  }

  registerTransition(terrain1, terrain2, transitionTiles) {
    // Transitions between two terrain types
    const key = this.getTransitionKey(terrain1, terrain2);
    this.transitions.set(key, transitionTiles);
  }

  getTransitionKey(terrain1, terrain2) {
    // Normalize key order by priority
    const t1 = this.terrains.get(terrain1);
    const t2 = this.terrains.get(terrain2);
    if (t1.priority > t2.priority) {
      return `${terrain1}->${terrain2}`;
    }
    return `${terrain2}->${terrain1}`;
  }

  getTerrainAt(tilemap, layer, x, y) {
    const tileId = tilemap.getLayer(layer)?.getTile(x, y) ?? 0;
    for (const [name, terrain] of this.terrains) {
      if (tileId >= terrain.baseTileId &&
          tileId < terrain.baseTileId + terrain.tileCount) {
        return name;
      }
    }
    return null;
  }

  calculateTerrainTile(tilemap, layer, x, y, terrainName) {
    const terrain = this.terrains.get(terrainName);
    if (!terrain) return 0;

    // Check neighbors for same terrain or transitions
    const neighbors = this.getNeighborTerrains(tilemap, layer, x, y);

    // If all neighbors are same terrain, use standard auto-tiling
    if (neighbors.every(n => n === terrainName || n === null)) {
      return this.calculateStandardAutoTile(tilemap, layer, x, y, terrainName, terrain.baseTileId);
    }

    // Otherwise, look for transition tiles
    return this.calculateTransitionTile(tilemap, layer, x, y, terrainName, neighbors);
  }

  getNeighborTerrains(tilemap, layer, x, y) {
    const offsets = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],          [1, 0],
      [-1, 1],  [0, 1], [1, 1]
    ];
    return offsets.map(([dx, dy]) => this.getTerrainAt(tilemap, layer, x + dx, y + dy));
  }

  calculateStandardAutoTile(tilemap, layer, x, y, terrainName, baseTileId) {
    // Use 8-bit auto-tiling for same-terrain tiles
    const autoTiler = new AutoTiler8Bit();
    return autoTiler.getAutoTile(
      tilemap,
      layer,
      x,
      y,
      (tm, l, tx, ty) => this.getTerrainAt(tm, l, tx, ty) === terrainName,
      baseTileId
    );
  }

  calculateTransitionTile(tilemap, layer, x, y, terrainName, neighbors) {
    // Find the dominant neighboring terrain for transitions
    const terrainCounts = {};
    for (const neighbor of neighbors) {
      if (neighbor && neighbor !== terrainName) {
        terrainCounts[neighbor] = (terrainCounts[neighbor] || 0) + 1;
      }
    }

    const dominantNeighbor = Object.entries(terrainCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (!dominantNeighbor) {
      return this.terrains.get(terrainName).baseTileId;
    }

    const transitionKey = this.getTransitionKey(terrainName, dominantNeighbor);
    const transitionTiles = this.transitions.get(transitionKey);

    if (transitionTiles) {
      // Calculate which transition tile to use based on neighbor positions
      return this.selectTransitionTile(neighbors, terrainName, dominantNeighbor, transitionTiles);
    }

    return this.terrains.get(terrainName).baseTileId;
  }

  selectTransitionTile(neighbors, terrain1, terrain2, transitionTiles) {
    // Simplified transition selection
    // In practice, you would calculate a mask similar to auto-tiling
    let mask = 0;
    const neighborPositions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

    for (let i = 0; i < 8; i++) {
      if (neighbors[i] === terrain2) {
        mask |= (1 << i);
      }
    }

    return transitionTiles[mask] || transitionTiles[0];
  }
}

// Usage
const terrainTiler = new TerrainAutoTiler();

terrainTiler.registerTerrain('grass', { priority: 0, baseTileId: 1 });
terrainTiler.registerTerrain('dirt', { priority: 1, baseTileId: 48 });
terrainTiler.registerTerrain('water', { priority: 2, baseTileId: 95 });

// Register grass-to-dirt transitions (would need 47 transition tiles)
terrainTiler.registerTransition('grass', 'dirt', generateTransitionTiles());
```

## Collision Systems

### Basic Tile Collision

Simple grid-based collision using tile properties:

```javascript
class TileCollisionSystem {
  constructor(tilemap, tileset) {
    this.tilemap = tilemap;
    this.tileset = tileset;
    this.collisionLayer = 'collision';
  }

  isSolidAt(worldX, worldY) {
    const tilePos = this.tilemap.worldToTile(worldX, worldY);
    return this.isTileSolid(tilePos.x, tilePos.y);
  }

  isTileSolid(tileX, tileY) {
    const layer = this.tilemap.getLayer(this.collisionLayer);
    if (!layer) return false;

    const tileId = layer.getTile(tileX, tileY);
    if (tileId === 0) return false;

    return this.tileset.getTileProperty(tileId, 'collision') === true;
  }

  // Check collision for a rectangular entity
  checkEntityCollision(entity) {
    const { x, y, width, height } = entity;

    // Get all tiles the entity overlaps
    const startTile = this.tilemap.worldToTile(x, y);
    const endTile = this.tilemap.worldToTile(x + width - 1, y + height - 1);

    const collisions = [];

    for (let ty = startTile.y; ty <= endTile.y; ty++) {
      for (let tx = startTile.x; tx <= endTile.x; tx++) {
        if (this.isTileSolid(tx, ty)) {
          collisions.push({
            tileX: tx,
            tileY: ty,
            worldX: tx * this.tilemap.tileWidth,
            worldY: ty * this.tilemap.tileHeight,
            width: this.tilemap.tileWidth,
            height: this.tilemap.tileHeight
          });
        }
      }
    }

    return collisions;
  }

  // Resolve collision by finding valid position
  resolveCollision(entity, velocityX, velocityY) {
    const { x, y, width, height } = entity;
    let newX = x + velocityX;
    let newY = y + velocityY;

    // Check horizontal movement
    if (velocityX !== 0) {
      const testEntity = { x: newX, y, width, height };
      const horizontalCollisions = this.checkEntityCollision(testEntity);

      if (horizontalCollisions.length > 0) {
        if (velocityX > 0) {
          // Moving right - align to left side of tile
          newX = Math.min(...horizontalCollisions.map(c => c.worldX)) - width;
        } else {
          // Moving left - align to right side of tile
          newX = Math.max(...horizontalCollisions.map(c => c.worldX + c.width));
        }
      }
    }

    // Check vertical movement
    if (velocityY !== 0) {
      const testEntity = { x: newX, y: newY, width, height };
      const verticalCollisions = this.checkEntityCollision(testEntity);

      if (verticalCollisions.length > 0) {
        if (velocityY > 0) {
          // Moving down - align to top of tile
          newY = Math.min(...verticalCollisions.map(c => c.worldY)) - height;
        } else {
          // Moving up - align to bottom of tile
          newY = Math.max(...verticalCollisions.map(c => c.worldY + c.height));
        }
      }
    }

    return { x: newX, y: newY };
  }
}
```

### Advanced Collision Shapes

Support for slopes and partial collision tiles:

```javascript
class AdvancedTileCollision {
  constructor(tilemap, tileset) {
    this.tilemap = tilemap;
    this.tileset = tileset;
  }

  getCollisionShape(tileX, tileY) {
    const layer = this.tilemap.getLayer('collision');
    const tileId = layer?.getTile(tileX, tileY) ?? 0;
    if (tileId === 0) return null;

    const shape = this.tileset.getTileProperty(tileId, 'collisionShape');
    const tileWorld = this.tilemap.tileToWorld(tileX, tileY);

    switch (shape) {
      case 'full':
        return this.createFullRect(tileWorld);
      case 'half-top':
        return this.createHalfTop(tileWorld);
      case 'half-bottom':
        return this.createHalfBottom(tileWorld);
      case 'slope-left':
        return this.createSlopeLeft(tileWorld);
      case 'slope-right':
        return this.createSlopeRight(tileWorld);
      case 'platform':
        return this.createPlatform(tileWorld);
      default:
        return null;
    }
  }

  createFullRect(tileWorld) {
    return {
      type: 'rect',
      x: tileWorld.x,
      y: tileWorld.y,
      width: this.tilemap.tileWidth,
      height: this.tilemap.tileHeight
    };
  }

  createHalfTop(tileWorld) {
    return {
      type: 'rect',
      x: tileWorld.x,
      y: tileWorld.y,
      width: this.tilemap.tileWidth,
      height: this.tilemap.tileHeight / 2
    };
  }

  createHalfBottom(tileWorld) {
    return {
      type: 'rect',
      x: tileWorld.x,
      y: tileWorld.y + this.tilemap.tileHeight / 2,
      width: this.tilemap.tileWidth,
      height: this.tilemap.tileHeight / 2
    };
  }

  createSlopeLeft(tileWorld) {
    // Slope from top-left to bottom-right
    return {
      type: 'slope',
      x: tileWorld.x,
      y: tileWorld.y,
      width: this.tilemap.tileWidth,
      height: this.tilemap.tileHeight,
      direction: 'left' // High on left, low on right
    };
  }

  createSlopeRight(tileWorld) {
    // Slope from top-right to bottom-left
    return {
      type: 'slope',
      x: tileWorld.x,
      y: tileWorld.y,
      width: this.tilemap.tileWidth,
      height: this.tilemap.tileHeight,
      direction: 'right' // High on right, low on left
    };
  }

  createPlatform(tileWorld) {
    // One-way platform - only collides from above
    return {
      type: 'platform',
      x: tileWorld.x,
      y: tileWorld.y,
      width: this.tilemap.tileWidth,
      height: 4 // Thin collision line at top
    };
  }

  // Calculate slope Y position at a given X
  getSlopeYAtX(slope, worldX) {
    const relativeX = worldX - slope.x;
    const progress = relativeX / slope.width;

    if (slope.direction === 'left') {
      // High on left (progress 0), low on right (progress 1)
      return slope.y + (progress * slope.height);
    } else {
      // Low on left (progress 0), high on right (progress 1)
      return slope.y + ((1 - progress) * slope.height);
    }
  }

  resolveSlope(entity, slope) {
    const entityCenterX = entity.x + entity.width / 2;
    const slopeY = this.getSlopeYAtX(slope, entityCenterX);
    const targetY = slopeY - entity.height;

    if (entity.y + entity.height > slopeY) {
      return { x: entity.x, y: targetY, onSlope: true };
    }
    return null;
  }

  resolvePlatform(entity, platform, velocityY) {
    // Only collide when falling and was above platform
    if (velocityY <= 0) return null;

    const entityBottom = entity.y + entity.height;
    const platformTop = platform.y;

    // Check if entity is falling through platform
    if (entityBottom > platformTop &&
        entity.y < platformTop &&
        velocityY > 0) {
      return { x: entity.x, y: platformTop - entity.height, onPlatform: true };
    }
    return null;
  }
}
```

### Collision Layers

Multiple collision layers for different interaction types:

```javascript
class CollisionLayerSystem {
  constructor() {
    this.layers = new Map();
    this.layerMasks = new Map();
  }

  createLayer(name, bitmask) {
    this.layers.set(name, {
      name,
      bitmask,
      tiles: new Set()
    });
  }

  setLayerInteraction(layer1, layer2, collides) {
    const l1 = this.layers.get(layer1);
    const l2 = this.layers.get(layer2);

    if (collides) {
      // Set bits so layers interact
      const key1 = `${layer1}->${layer2}`;
      const key2 = `${layer2}->${layer1}`;
      this.layerMasks.set(key1, true);
      this.layerMasks.set(key2, true);
    }
  }

  shouldCollide(layer1, layer2) {
    return this.layerMasks.get(`${layer1}->${layer2}`) === true;
  }

  // Example layer setup
  setupDefaultLayers() {
    this.createLayer('solid', 0b0001);      // Solid ground
    this.createLayer('platform', 0b0010);    // One-way platforms
    this.createLayer('hazard', 0b0100);      // Damage zones
    this.createLayer('trigger', 0b1000);     // Trigger zones

    // Player collides with solid and platform
    this.setLayerInteraction('player', 'solid', true);
    this.setLayerInteraction('player', 'platform', true);
    this.setLayerInteraction('player', 'hazard', true);
    this.setLayerInteraction('player', 'trigger', true);

    // Enemies collide with solid only
    this.setLayerInteraction('enemy', 'solid', true);

    // Projectiles collide with solid
    this.setLayerInteraction('projectile', 'solid', true);
  }
}
```

## Layered Rendering

### Layer Management and Rendering Order

Proper layer management is essential for visual depth and special effects:

```javascript
class TilemapRenderer {
  constructor(ctx, tilemap) {
    this.ctx = ctx;
    this.tilemap = tilemap;
    this.camera = { x: 0, y: 0, width: 800, height: 600 };
    this.animationManager = new TileAnimationManager();
    this.debugMode = false;
  }

  render() {
    const sortedLayers = this.tilemap.getSortedLayers();

    for (const layer of sortedLayers) {
      if (!layer.visible) continue;
      this.renderLayer(layer);
    }

    if (this.debugMode) {
      this.renderDebugGrid();
    }
  }

  renderLayer(layer) {
    const ctx = this.ctx;

    // Calculate visible tile range
    const { startX, startY, endX, endY } = this.getVisibleTileRange(layer);

    // Apply layer opacity
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = layer.opacity;

    // Calculate parallax offset
    const parallaxOffsetX = this.camera.x * (1 - layer.parallaxX);
    const parallaxOffsetY = this.camera.y * (1 - layer.parallaxY);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        let tileId = layer.getTile(x, y);
        if (tileId === 0) continue;

        // Handle animated tiles
        tileId = this.animationManager.getDisplayTileId(tileId);

        // Get tileset and tile region
        const tileset = this.tilemap.getTilesetForTile(tileId);
        if (!tileset) continue;

        const region = tileset.getTileRegion(tileId);
        if (!region) continue;

        // Calculate screen position
        const screenX = x * this.tilemap.tileWidth - this.camera.x + layer.offsetX + parallaxOffsetX;
        const screenY = y * this.tilemap.tileHeight - this.camera.y + layer.offsetY + parallaxOffsetY;

        // Draw tile
        ctx.drawImage(
          tileset.image,
          region.x, region.y, region.width, region.height,
          Math.floor(screenX), Math.floor(screenY),
          this.tilemap.tileWidth, this.tilemap.tileHeight
        );
      }
    }

    ctx.globalAlpha = previousAlpha;
  }

  getVisibleTileRange(layer) {
    const parallaxX = layer.parallaxX;
    const parallaxY = layer.parallaxY;

    const cameraX = this.camera.x * parallaxX;
    const cameraY = this.camera.y * parallaxY;

    const startX = Math.floor(cameraX / this.tilemap.tileWidth) - 1;
    const startY = Math.floor(cameraY / this.tilemap.tileHeight) - 1;
    const endX = Math.ceil((cameraX + this.camera.width) / this.tilemap.tileWidth) + 1;
    const endY = Math.ceil((cameraY + this.camera.height) / this.tilemap.tileHeight) + 1;

    return {
      startX: Math.max(0, startX),
      startY: Math.max(0, startY),
      endX: Math.min(this.tilemap.width - 1, endX),
      endY: Math.min(this.tilemap.height - 1, endY)
    };
  }

  renderDebugGrid() {
    const ctx = this.ctx;
    const { startX, startY, endX, endY } = this.getVisibleTileRange(
      this.tilemap.getLayer('ground') || { parallaxX: 1, parallaxY: 1 }
    );

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const screenX = x * this.tilemap.tileWidth - this.camera.x;
        const screenY = y * this.tilemap.tileHeight - this.camera.y;
        ctx.strokeRect(screenX, screenY, this.tilemap.tileWidth, this.tilemap.tileHeight);
      }
    }
  }

  setCamera(x, y) {
    this.camera.x = x;
    this.camera.y = y;
  }

  update(deltaTime) {
    this.animationManager.update(deltaTime);
  }
}
```

### Parallax Backgrounds

Creating depth with parallax layers:

```javascript
class ParallaxBackground {
  constructor(renderer) {
    this.renderer = renderer;
    this.layers = [];
  }

  addLayer(config) {
    this.layers.push({
      image: config.image,
      scrollSpeedX: config.scrollSpeedX ?? 0.5,
      scrollSpeedY: config.scrollSpeedY ?? 0.5,
      repeatX: config.repeatX ?? true,
      repeatY: config.repeatY ?? false,
      offsetY: config.offsetY ?? 0,
      scale: config.scale ?? 1,
      zIndex: config.zIndex ?? -1
    });

    this.layers.sort((a, b) => a.zIndex - b.zIndex);
  }

  render(camera) {
    const ctx = this.renderer.ctx;

    for (const layer of this.layers) {
      this.renderParallaxLayer(layer, camera);
    }
  }

  renderParallaxLayer(layer, camera) {
    const ctx = this.renderer.ctx;
    const img = layer.image;

    const scaledWidth = img.width * layer.scale;
    const scaledHeight = img.height * layer.scale;

    // Calculate parallax offset
    let offsetX = -(camera.x * layer.scrollSpeedX) % scaledWidth;
    let offsetY = -(camera.y * layer.scrollSpeedY) + layer.offsetY;

    // Ensure offset is negative for proper tiling
    if (offsetX > 0) offsetX -= scaledWidth;

    if (layer.repeatX) {
      // Draw enough images to cover screen width
      const startX = offsetX;
      const endX = camera.width + scaledWidth;

      for (let x = startX; x < endX; x += scaledWidth) {
        ctx.drawImage(img, x, offsetY, scaledWidth, scaledHeight);
      }
    } else {
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    }
  }
}

// Usage
const parallax = new ParallaxBackground(renderer);

// Far background - moves slowly
parallax.addLayer({
  image: skyImage,
  scrollSpeedX: 0.1,
  scrollSpeedY: 0,
  zIndex: -3
});

// Mountains - medium speed
parallax.addLayer({
  image: mountainsImage,
  scrollSpeedX: 0.3,
  offsetY: 200,
  zIndex: -2
});

// Trees - faster, closer to gameplay speed
parallax.addLayer({
  image: treesImage,
  scrollSpeedX: 0.6,
  offsetY: 300,
  zIndex: -1
});
```

### Entity Rendering Between Layers

Rendering entities at the correct depth:

```javascript
class LayeredGameRenderer {
  constructor(ctx, tilemap, entityManager) {
    this.ctx = ctx;
    this.tilemap = tilemap;
    this.entityManager = entityManager;
    this.camera = { x: 0, y: 0, width: 800, height: 600 };
  }

  render() {
    const sortedLayers = this.tilemap.getSortedLayers();

    // Group layers by z-index ranges
    const backgroundLayers = sortedLayers.filter(l => l.zIndex < 0);
    const groundLayers = sortedLayers.filter(l => l.zIndex >= 0 && l.zIndex < 10);
    const foregroundLayers = sortedLayers.filter(l => l.zIndex >= 10);

    // Render backgrounds
    for (const layer of backgroundLayers) {
      this.renderLayer(layer);
    }

    // Render ground layers
    for (const layer of groundLayers) {
      this.renderLayer(layer);
    }

    // Render entities sorted by Y position (for top-down games)
    // or by explicit z-order (for platformers)
    this.renderEntities();

    // Render foreground layers (overlays)
    for (const layer of foregroundLayers) {
      this.renderLayer(layer);
    }
  }

  renderEntities() {
    const entities = this.entityManager.getVisibleEntities(this.camera);

    // Sort by y-position for top-down depth sorting
    entities.sort((a, b) => (a.y + a.height) - (b.y + b.height));

    for (const entity of entities) {
      const screenX = entity.x - this.camera.x;
      const screenY = entity.y - this.camera.y;
      entity.render(this.ctx, screenX, screenY);
    }
  }

  renderLayer(layer) {
    // Same as TilemapRenderer.renderLayer
  }
}
```

## Tiled Editor Integration

### Loading TMX Files

Tiled is the most popular tilemap editor. Here is how to parse its TMX format:

```javascript
class TiledMapLoader {
  constructor() {
    this.tilesets = [];
    this.layers = [];
    this.objectGroups = [];
  }

  async load(tmxPath) {
    const response = await fetch(tmxPath);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    const mapElement = xml.querySelector('map');
    const mapData = {
      width: parseInt(mapElement.getAttribute('width')),
      height: parseInt(mapElement.getAttribute('height')),
      tileWidth: parseInt(mapElement.getAttribute('tilewidth')),
      tileHeight: parseInt(mapElement.getAttribute('tileheight')),
      orientation: mapElement.getAttribute('orientation') || 'orthogonal'
    };

    // Load tilesets
    const tilesetElements = xml.querySelectorAll('tileset');
    const tilesets = await Promise.all(
      Array.from(tilesetElements).map(el => this.parseTileset(el, tmxPath))
    );

    // Load tile layers
    const layerElements = xml.querySelectorAll('layer');
    const layers = Array.from(layerElements).map(el => this.parseLayer(el, mapData));

    // Load object layers
    const objectGroupElements = xml.querySelectorAll('objectgroup');
    const objectGroups = Array.from(objectGroupElements).map(el => this.parseObjectGroup(el));

    // Load custom properties
    const properties = this.parseProperties(mapElement.querySelector('properties'));

    return {
      ...mapData,
      tilesets,
      layers,
      objectGroups,
      properties
    };
  }

  async parseTileset(element, tmxPath) {
    const firstGid = parseInt(element.getAttribute('firstgid'));
    const source = element.getAttribute('source');

    if (source) {
      // External tileset (TSX file)
      return this.loadExternalTileset(source, firstGid, tmxPath);
    }

    // Embedded tileset
    const name = element.getAttribute('name');
    const tileWidth = parseInt(element.getAttribute('tilewidth'));
    const tileHeight = parseInt(element.getAttribute('tileheight'));
    const tileCount = parseInt(element.getAttribute('tilecount') || '0');
    const columns = parseInt(element.getAttribute('columns') || '0');

    const imageElement = element.querySelector('image');
    const imageSource = imageElement?.getAttribute('source');

    // Parse individual tile properties
    const tileElements = element.querySelectorAll('tile');
    const tileProperties = {};

    for (const tileEl of tileElements) {
      const tileId = parseInt(tileEl.getAttribute('id'));
      const props = this.parseProperties(tileEl.querySelector('properties'));
      const collision = this.parseCollision(tileEl.querySelector('objectgroup'));
      const animation = this.parseAnimation(tileEl.querySelector('animation'));

      tileProperties[firstGid + tileId] = { ...props, collision, animation };
    }

    return {
      firstGid,
      name,
      tileWidth,
      tileHeight,
      tileCount,
      columns,
      imageSource,
      tileProperties
    };
  }

  async loadExternalTileset(source, firstGid, tmxPath) {
    // Resolve path relative to TMX file
    const basePath = tmxPath.substring(0, tmxPath.lastIndexOf('/'));
    const tsxPath = `${basePath}/${source}`;

    const response = await fetch(tsxPath);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    const tilesetElement = xml.querySelector('tileset');
    const tileset = await this.parseTileset(tilesetElement, tsxPath);
    tileset.firstGid = firstGid;

    return tileset;
  }

  parseLayer(element, mapData) {
    const name = element.getAttribute('name');
    const width = parseInt(element.getAttribute('width'));
    const height = parseInt(element.getAttribute('height'));
    const visible = element.getAttribute('visible') !== '0';
    const opacity = parseFloat(element.getAttribute('opacity') || '1');

    // Get layer offset
    const offsetX = parseFloat(element.getAttribute('offsetx') || '0');
    const offsetY = parseFloat(element.getAttribute('offsety') || '0');

    // Get parallax factor
    const parallaxX = parseFloat(element.getAttribute('parallaxx') || '1');
    const parallaxY = parseFloat(element.getAttribute('parallaxy') || '1');

    // Parse layer data
    const dataElement = element.querySelector('data');
    const encoding = dataElement.getAttribute('encoding');
    const compression = dataElement.getAttribute('compression');

    let data;
    if (encoding === 'base64') {
      data = this.decodeBase64Layer(dataElement.textContent.trim(), compression, width, height);
    } else if (encoding === 'csv') {
      data = this.decodeCSVLayer(dataElement.textContent.trim());
    } else {
      // XML format
      data = this.decodeXMLLayer(dataElement);
    }

    const properties = this.parseProperties(element.querySelector('properties'));

    return {
      name,
      width,
      height,
      visible,
      opacity,
      offsetX,
      offsetY,
      parallaxX,
      parallaxY,
      data,
      properties
    };
  }

  decodeBase64Layer(base64Data, compression, width, height) {
    // Decode base64
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let decompressed = bytes;

    // Handle compression
    if (compression === 'zlib' || compression === 'gzip') {
      // Use pako or similar library for decompression
      // decompressed = pako.inflate(bytes);
      console.warn('Compression not implemented - use uncompressed or CSV format');
    }

    // Convert to 32-bit integers
    const data = new Uint32Array(width * height);
    for (let i = 0; i < data.length; i++) {
      data[i] = decompressed[i * 4] |
                (decompressed[i * 4 + 1] << 8) |
                (decompressed[i * 4 + 2] << 16) |
                (decompressed[i * 4 + 3] << 24);
    }

    return data;
  }

  decodeCSVLayer(csvData) {
    const values = csvData.split(',').map(v => parseInt(v.trim()));
    return new Uint32Array(values);
  }

  decodeXMLLayer(dataElement) {
    const tiles = dataElement.querySelectorAll('tile');
    const data = new Uint32Array(tiles.length);
    for (let i = 0; i < tiles.length; i++) {
      data[i] = parseInt(tiles[i].getAttribute('gid') || '0');
    }
    return data;
  }

  parseObjectGroup(element) {
    const name = element.getAttribute('name');
    const visible = element.getAttribute('visible') !== '0';
    const opacity = parseFloat(element.getAttribute('opacity') || '1');

    const objects = Array.from(element.querySelectorAll('object')).map(obj => {
      const parsed = {
        id: parseInt(obj.getAttribute('id')),
        name: obj.getAttribute('name') || '',
        type: obj.getAttribute('type') || obj.getAttribute('class') || '',
        x: parseFloat(obj.getAttribute('x')),
        y: parseFloat(obj.getAttribute('y')),
        width: parseFloat(obj.getAttribute('width') || '0'),
        height: parseFloat(obj.getAttribute('height') || '0'),
        rotation: parseFloat(obj.getAttribute('rotation') || '0'),
        visible: obj.getAttribute('visible') !== '0',
        properties: this.parseProperties(obj.querySelector('properties'))
      };

      // Check for shape types
      if (obj.querySelector('ellipse')) {
        parsed.shape = 'ellipse';
      } else if (obj.querySelector('point')) {
        parsed.shape = 'point';
      } else if (obj.querySelector('polygon')) {
        parsed.shape = 'polygon';
        parsed.points = this.parsePoints(obj.querySelector('polygon').getAttribute('points'));
      } else if (obj.querySelector('polyline')) {
        parsed.shape = 'polyline';
        parsed.points = this.parsePoints(obj.querySelector('polyline').getAttribute('points'));
      } else {
        parsed.shape = 'rectangle';
      }

      return parsed;
    });

    return { name, visible, opacity, objects };
  }

  parsePoints(pointsStr) {
    return pointsStr.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
  }

  parseProperties(propertiesElement) {
    if (!propertiesElement) return {};

    const properties = {};
    const propertyElements = propertiesElement.querySelectorAll('property');

    for (const prop of propertyElements) {
      const name = prop.getAttribute('name');
      const type = prop.getAttribute('type') || 'string';
      let value = prop.getAttribute('value');

      // Type conversion
      switch (type) {
        case 'int':
          value = parseInt(value);
          break;
        case 'float':
          value = parseFloat(value);
          break;
        case 'bool':
          value = value === 'true';
          break;
        case 'color':
          // Keep as hex string
          break;
      }

      properties[name] = value;
    }

    return properties;
  }

  parseCollision(objectGroup) {
    if (!objectGroup) return null;

    const shapes = [];
    const objects = objectGroup.querySelectorAll('object');

    for (const obj of objects) {
      shapes.push({
        x: parseFloat(obj.getAttribute('x') || '0'),
        y: parseFloat(obj.getAttribute('y') || '0'),
        width: parseFloat(obj.getAttribute('width') || '0'),
        height: parseFloat(obj.getAttribute('height') || '0')
      });
    }

    return shapes;
  }

  parseAnimation(animationElement) {
    if (!animationElement) return null;

    const frames = animationElement.querySelectorAll('frame');
    return Array.from(frames).map(frame => ({
      tileId: parseInt(frame.getAttribute('tileid')),
      duration: parseInt(frame.getAttribute('duration'))
    }));
  }
}

// Convert loaded data to game tilemap
async function createTilemapFromTiled(tmxPath) {
  const loader = new TiledMapLoader();
  const mapData = await loader.load(tmxPath);

  const tilemap = new Tilemap(
    mapData.width,
    mapData.height,
    mapData.tileWidth,
    mapData.tileHeight
  );

  // Load tilesets
  for (const tilesetData of mapData.tilesets) {
    const tileset = new EnhancedTileset({
      tileWidth: tilesetData.tileWidth,
      tileHeight: tilesetData.tileHeight,
      firstGid: tilesetData.firstGid
    });

    await tileset.load(tilesetData.imageSource);

    // Apply tile properties
    for (const [tileId, props] of Object.entries(tilesetData.tileProperties)) {
      for (const [key, value] of Object.entries(props)) {
        tileset.setTileProperty(parseInt(tileId), key, value);
      }
    }

    tilemap.addTileset(tileset);
  }

  // Create layers
  for (let i = 0; i < mapData.layers.length; i++) {
    const layerData = mapData.layers[i];
    const layer = tilemap.addLayer(layerData.name, i);

    layer.visible = layerData.visible;
    layer.opacity = layerData.opacity;
    layer.offsetX = layerData.offsetX;
    layer.offsetY = layerData.offsetY;
    layer.parallaxX = layerData.parallaxX;
    layer.parallaxY = layerData.parallaxY;

    // Copy tile data
    for (let j = 0; j < layerData.data.length; j++) {
      const x = j % mapData.width;
      const y = Math.floor(j / mapData.width);
      layer.setTile(x, y, layerData.data[j]);
    }
  }

  // Process object layers for spawn points, triggers, etc.
  tilemap.objectGroups = mapData.objectGroups;
  tilemap.properties = mapData.properties;

  return tilemap;
}
```

### Handling Object Layers

Object layers are useful for spawn points, triggers, and other game logic:

```javascript
class TiledObjectHandler {
  constructor(tilemap) {
    this.tilemap = tilemap;
    this.handlers = new Map();
  }

  registerHandler(objectType, handler) {
    this.handlers.set(objectType, handler);
  }

  processObjects(game) {
    for (const group of this.tilemap.objectGroups) {
      for (const obj of group.objects) {
        const handler = this.handlers.get(obj.type);
        if (handler) {
          handler(obj, game);
        }
      }
    }
  }

  getObjectsByType(type) {
    const result = [];
    for (const group of this.tilemap.objectGroups) {
      for (const obj of group.objects) {
        if (obj.type === type) {
          result.push(obj);
        }
      }
    }
    return result;
  }

  getObjectByName(name) {
    for (const group of this.tilemap.objectGroups) {
      for (const obj of group.objects) {
        if (obj.name === name) {
          return obj;
        }
      }
    }
    return null;
  }
}

// Usage
const objectHandler = new TiledObjectHandler(tilemap);

objectHandler.registerHandler('player_spawn', (obj, game) => {
  game.spawnPlayer(obj.x, obj.y);
});

objectHandler.registerHandler('enemy_spawn', (obj, game) => {
  const enemyType = obj.properties.enemyType || 'basic';
  game.spawnEnemy(obj.x, obj.y, enemyType);
});

objectHandler.registerHandler('trigger_zone', (obj, game) => {
  game.addTrigger({
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    action: obj.properties.action,
    oneShot: obj.properties.oneShot || false
  });
});

objectHandler.registerHandler('checkpoint', (obj, game) => {
  game.addCheckpoint({
    x: obj.x,
    y: obj.y,
    id: obj.properties.checkpointId
  });
});

// Process all objects when loading level
objectHandler.processObjects(game);
```

## Procedural Generation

### Noise-Based Terrain Generation

Using Perlin or Simplex noise for natural-looking terrain:

```javascript
class NoiseGenerator {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.permutation = this.generatePermutation();
  }

  generatePermutation() {
    const p = [];
    for (let i = 0; i < 256; i++) p[i] = i;

    // Shuffle using seed
    let random = this.seededRandom(this.seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate for overflow handling
    return [...p, ...p];
  }

  seededRandom(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x, y) {
    const p = this.permutation;

    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = p[p[xi] + yi];
    const ab = p[p[xi] + yi + 1];
    const ba = p[p[xi + 1] + yi];
    const bb = p[p[xi + 1] + yi + 1];

    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);

    return this.lerp(x1, x2, v);
  }

  // Multi-octave noise for more natural appearance
  fbm(x, y, octaves = 4, lacunarity = 2, persistence = 0.5) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }
}

class ProceduralTerrainGenerator {
  constructor(config = {}) {
    this.noise = new NoiseGenerator(config.seed);
    this.width = config.width || 100;
    this.height = config.height || 100;
    this.scale = config.scale || 0.1;

    // Terrain thresholds
    this.thresholds = config.thresholds || {
      deepWater: -0.3,
      water: -0.1,
      sand: 0.0,
      grass: 0.3,
      forest: 0.5,
      mountain: 0.7,
      snow: 0.85
    };

    // Tile IDs for each terrain type
    this.terrainTiles = config.terrainTiles || {
      deepWater: 1,
      water: 2,
      sand: 3,
      grass: 4,
      forest: 5,
      mountain: 6,
      snow: 7
    };
  }

  generate() {
    const data = new Uint32Array(this.width * this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const elevation = this.noise.fbm(x * this.scale, y * this.scale, 6);
        const tileId = this.elevationToTile(elevation);
        data[y * this.width + x] = tileId;
      }
    }

    return data;
  }

  elevationToTile(elevation) {
    const { thresholds, terrainTiles } = this;

    if (elevation < thresholds.deepWater) return terrainTiles.deepWater;
    if (elevation < thresholds.water) return terrainTiles.water;
    if (elevation < thresholds.sand) return terrainTiles.sand;
    if (elevation < thresholds.grass) return terrainTiles.grass;
    if (elevation < thresholds.forest) return terrainTiles.forest;
    if (elevation < thresholds.mountain) return terrainTiles.mountain;
    return terrainTiles.snow;
  }

  // Generate with additional features
  generateWithBiomes() {
    const elevation = this.generateElevationMap();
    const moisture = this.generateMoistureMap();
    const temperature = this.generateTemperatureMap();

    const data = new Uint32Array(this.width * this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = y * this.width + x;
        const biome = this.getBiome(elevation[i], moisture[i], temperature[i]);
        data[i] = biome;
      }
    }

    return data;
  }

  generateElevationMap() {
    const map = new Float32Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        map[y * this.width + x] = this.noise.fbm(x * this.scale, y * this.scale, 6);
      }
    }
    return map;
  }

  generateMoistureMap() {
    const moistureNoise = new NoiseGenerator(this.noise.seed + 1000);
    const map = new Float32Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        map[y * this.width + x] = moistureNoise.fbm(x * this.scale * 0.5, y * this.scale * 0.5, 4);
      }
    }
    return map;
  }

  generateTemperatureMap() {
    const map = new Float32Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) {
      // Temperature decreases from bottom to top (simulating latitude)
      const baseTemp = 1 - (y / this.height);
      for (let x = 0; x < this.width; x++) {
        // Add some noise variation
        const variation = this.noise.noise2D(x * 0.02, y * 0.02) * 0.2;
        map[y * this.width + x] = Math.max(0, Math.min(1, baseTemp + variation));
      }
    }
    return map;
  }

  getBiome(elevation, moisture, temperature) {
    // Water
    if (elevation < -0.1) {
      return elevation < -0.3 ? this.terrainTiles.deepWater : this.terrainTiles.water;
    }

    // Beach
    if (elevation < 0.05) {
      return this.terrainTiles.sand;
    }

    // High elevation
    if (elevation > 0.7) {
      return temperature < 0.3 ? this.terrainTiles.snow : this.terrainTiles.mountain;
    }

    // Based on moisture and temperature
    if (temperature < 0.25) {
      return moisture > 0 ? this.terrainTiles.snow : this.terrainTiles.mountain;
    }

    if (moisture > 0.3) {
      return this.terrainTiles.forest;
    }

    if (moisture < -0.2) {
      return this.terrainTiles.sand; // Desert
    }

    return this.terrainTiles.grass;
  }
}
```

### Dungeon Generation with BSP

Binary Space Partitioning for dungeon layouts:

```javascript
class BSPNode {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.left = null;
    this.right = null;
    this.room = null;
  }

  split(minSize, maxRatio = 0.45) {
    // Already split
    if (this.left || this.right) return false;

    // Determine split direction
    let horizontal = Math.random() > 0.5;

    // If one dimension is much larger, split that direction
    if (this.width > this.height * 1.25) {
      horizontal = false;
    } else if (this.height > this.width * 1.25) {
      horizontal = true;
    }

    const max = (horizontal ? this.height : this.width) - minSize;
    if (max <= minSize) return false;

    const splitPos = Math.floor(minSize + Math.random() * (max - minSize));

    if (horizontal) {
      this.left = new BSPNode(this.x, this.y, this.width, splitPos);
      this.right = new BSPNode(this.x, this.y + splitPos, this.width, this.height - splitPos);
    } else {
      this.left = new BSPNode(this.x, this.y, splitPos, this.height);
      this.right = new BSPNode(this.x + splitPos, this.y, this.width - splitPos, this.height);
    }

    return true;
  }

  createRooms(minRoomSize, roomPadding) {
    if (this.left || this.right) {
      // Recurse into children
      if (this.left) this.left.createRooms(minRoomSize, roomPadding);
      if (this.right) this.right.createRooms(minRoomSize, roomPadding);
    } else {
      // Leaf node - create room
      const roomWidth = Math.floor(minRoomSize + Math.random() * (this.width - minRoomSize - roomPadding * 2));
      const roomHeight = Math.floor(minRoomSize + Math.random() * (this.height - minRoomSize - roomPadding * 2));

      const roomX = this.x + roomPadding + Math.floor(Math.random() * (this.width - roomWidth - roomPadding * 2));
      const roomY = this.y + roomPadding + Math.floor(Math.random() * (this.height - roomHeight - roomPadding * 2));

      this.room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
        centerX: Math.floor(roomX + roomWidth / 2),
        centerY: Math.floor(roomY + roomHeight / 2)
      };
    }
  }

  getRoom() {
    if (this.room) return this.room;

    let leftRoom = this.left?.getRoom();
    let rightRoom = this.right?.getRoom();

    if (!leftRoom && !rightRoom) return null;
    if (!leftRoom) return rightRoom;
    if (!rightRoom) return leftRoom;

    return Math.random() > 0.5 ? leftRoom : rightRoom;
  }
}

class BSPDungeonGenerator {
  constructor(config = {}) {
    this.width = config.width || 80;
    this.height = config.height || 60;
    this.minPartitionSize = config.minPartitionSize || 10;
    this.minRoomSize = config.minRoomSize || 5;
    this.roomPadding = config.roomPadding || 1;
    this.maxIterations = config.maxIterations || 5;

    // Tile IDs
    this.tiles = {
      wall: config.wallTile || 1,
      floor: config.floorTile || 2,
      door: config.doorTile || 3,
      corridor: config.corridorTile || 4
    };
  }

  generate() {
    // Initialize with walls
    const data = new Uint32Array(this.width * this.height);
    data.fill(this.tiles.wall);

    // Create BSP tree
    const root = new BSPNode(0, 0, this.width, this.height);
    const nodes = [root];

    // Split nodes
    for (let i = 0; i < this.maxIterations; i++) {
      const newNodes = [];
      for (const node of nodes) {
        if (node.split(this.minPartitionSize)) {
          newNodes.push(node.left, node.right);
        } else {
          newNodes.push(node);
        }
      }
      nodes.length = 0;
      nodes.push(...newNodes);
    }

    // Create rooms in leaf nodes
    root.createRooms(this.minRoomSize, this.roomPadding);

    // Carve rooms
    const rooms = [];
    this.carveRooms(root, data, rooms);

    // Connect rooms with corridors
    this.connectRooms(root, data);

    return {
      data,
      rooms,
      width: this.width,
      height: this.height
    };
  }

  carveRooms(node, data, rooms) {
    if (node.room) {
      const room = node.room;
      rooms.push(room);

      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          data[y * this.width + x] = this.tiles.floor;
        }
      }
    }

    if (node.left) this.carveRooms(node.left, data, rooms);
    if (node.right) this.carveRooms(node.right, data, rooms);
  }

  connectRooms(node, data) {
    if (!node.left || !node.right) return;

    const leftRoom = node.left.getRoom();
    const rightRoom = node.right.getRoom();

    if (leftRoom && rightRoom) {
      this.carveCorridor(data, leftRoom.centerX, leftRoom.centerY, rightRoom.centerX, rightRoom.centerY);
    }

    this.connectRooms(node.left, data);
    this.connectRooms(node.right, data);
  }

  carveCorridor(data, x1, y1, x2, y2) {
    // L-shaped corridor
    const horizontal = Math.random() > 0.5;

    if (horizontal) {
      this.carveHorizontalLine(data, x1, x2, y1);
      this.carveVerticalLine(data, y1, y2, x2);
    } else {
      this.carveVerticalLine(data, y1, y2, x1);
      this.carveHorizontalLine(data, x1, x2, y2);
    }
  }

  carveHorizontalLine(data, x1, x2, y) {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);

    for (let x = start; x <= end; x++) {
      if (this.isValid(x, y)) {
        data[y * this.width + x] = this.tiles.corridor;
      }
    }
  }

  carveVerticalLine(data, y1, y2, x) {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);

    for (let y = start; y <= end; y++) {
      if (this.isValid(x, y)) {
        data[y * this.width + x] = this.tiles.corridor;
      }
    }
  }

  isValid(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  // Post-processing: add doors, decorations, etc.
  addDoors(data, rooms) {
    for (const room of rooms) {
      // Check each wall for corridor connections
      this.checkAndAddDoor(data, room, 'top');
      this.checkAndAddDoor(data, room, 'bottom');
      this.checkAndAddDoor(data, room, 'left');
      this.checkAndAddDoor(data, room, 'right');
    }
  }

  checkAndAddDoor(data, room, side) {
    let doorX, doorY, outsideX, outsideY;

    switch (side) {
      case 'top':
        doorY = room.y - 1;
        for (let x = room.x; x < room.x + room.width; x++) {
          if (this.isValid(x, doorY) && data[doorY * this.width + x] === this.tiles.corridor) {
            data[doorY * this.width + x] = this.tiles.door;
          }
        }
        break;
      case 'bottom':
        doorY = room.y + room.height;
        for (let x = room.x; x < room.x + room.width; x++) {
          if (this.isValid(x, doorY) && data[doorY * this.width + x] === this.tiles.corridor) {
            data[doorY * this.width + x] = this.tiles.door;
          }
        }
        break;
      case 'left':
        doorX = room.x - 1;
        for (let y = room.y; y < room.y + room.height; y++) {
          if (this.isValid(doorX, y) && data[y * this.width + doorX] === this.tiles.corridor) {
            data[y * this.width + doorX] = this.tiles.door;
          }
        }
        break;
      case 'right':
        doorX = room.x + room.width;
        for (let y = room.y; y < room.y + room.height; y++) {
          if (this.isValid(doorX, y) && data[y * this.width + doorX] === this.tiles.corridor) {
            data[y * this.width + doorX] = this.tiles.door;
          }
        }
        break;
    }
  }
}

// Usage
const dungeonGen = new BSPDungeonGenerator({
  width: 80,
  height: 60,
  minPartitionSize: 12,
  minRoomSize: 6,
  maxIterations: 5
});

const dungeon = dungeonGen.generate();

// Apply to tilemap
const layer = tilemap.addLayer('dungeon');
for (let y = 0; y < dungeon.height; y++) {
  for (let x = 0; x < dungeon.width; x++) {
    layer.setTile(x, y, dungeon.data[y * dungeon.width + x]);
  }
}

// Use room data for spawning
for (const room of dungeon.rooms) {
  // Spawn enemies, items, etc. based on room
  if (Math.random() < 0.3) {
    spawnChest(room.centerX, room.centerY);
  }
}
```

### Cellular Automata for Caves

Natural cave generation using cellular automata:

```javascript
class CaveGenerator {
  constructor(config = {}) {
    this.width = config.width || 80;
    this.height = config.height || 60;
    this.initialDensity = config.initialDensity || 0.45;
    this.iterations = config.iterations || 5;
    this.birthLimit = config.birthLimit || 4;
    this.deathLimit = config.deathLimit || 3;

    this.tiles = {
      wall: config.wallTile || 1,
      floor: config.floorTile || 2
    };
  }

  generate() {
    // Initialize with random walls
    let current = this.initializeRandom();
    let next = new Uint8Array(this.width * this.height);

    // Run cellular automata iterations
    for (let i = 0; i < this.iterations; i++) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const neighbors = this.countNeighbors(current, x, y);
          const index = y * this.width + x;

          if (current[index] === 1) {
            // Currently a wall
            next[index] = neighbors >= this.deathLimit ? 1 : 0;
          } else {
            // Currently floor
            next[index] = neighbors > this.birthLimit ? 1 : 0;
          }
        }
      }

      // Swap buffers
      [current, next] = [next, current];
    }

    // Convert to tile IDs
    const data = new Uint32Array(this.width * this.height);
    for (let i = 0; i < current.length; i++) {
      data[i] = current[i] === 1 ? this.tiles.wall : this.tiles.floor;
    }

    // Ensure connectivity
    this.ensureConnectivity(data);

    // Add border walls
    this.addBorder(data);

    return data;
  }

  initializeRandom() {
    const data = new Uint8Array(this.width * this.height);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() < this.initialDensity ? 1 : 0;
    }
    return data;
  }

  countNeighbors(data, x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        // Count out-of-bounds as walls
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
          count++;
        } else if (data[ny * this.width + nx] === 1) {
          count++;
        }
      }
    }
    return count;
  }

  ensureConnectivity(data) {
    // Find all separate floor regions using flood fill
    const visited = new Uint8Array(this.width * this.height);
    const regions = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        if (data[index] === this.tiles.floor && !visited[index]) {
          const region = this.floodFill(data, visited, x, y);
          regions.push(region);
        }
      }
    }

    if (regions.length <= 1) return;

    // Sort by size, keep largest
    regions.sort((a, b) => b.length - a.length);

    // Connect smaller regions to the largest
    const mainRegion = regions[0];

    for (let i = 1; i < regions.length; i++) {
      const region = regions[i];

      // Find closest points between regions
      let minDist = Infinity;
      let point1 = null;
      let point2 = null;

      for (const p1 of mainRegion) {
        for (const p2 of region) {
          const dist = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
          if (dist < minDist) {
            minDist = dist;
            point1 = p1;
            point2 = p2;
          }
        }
      }

      // Carve tunnel between points
      if (point1 && point2) {
        this.carveTunnel(data, point1.x, point1.y, point2.x, point2.y);
        // Add connected region to main region
        mainRegion.push(...region);
      }
    }
  }

  floodFill(data, visited, startX, startY) {
    const region = [];
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      const index = y * this.width + x;

      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
      if (visited[index] || data[index] !== this.tiles.floor) continue;

      visited[index] = 1;
      region.push({ x, y });

      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    return region;
  }

  carveTunnel(data, x1, y1, x2, y2) {
    let x = x1;
    let y = y1;

    while (x !== x2 || y !== y2) {
      data[y * this.width + x] = this.tiles.floor;

      if (x !== x2) {
        x += x2 > x ? 1 : -1;
      } else if (y !== y2) {
        y += y2 > y ? 1 : -1;
      }
    }

    data[y2 * this.width + x2] = this.tiles.floor;
  }

  addBorder(data) {
    // Top and bottom borders
    for (let x = 0; x < this.width; x++) {
      data[x] = this.tiles.wall;
      data[(this.height - 1) * this.width + x] = this.tiles.wall;
    }

    // Left and right borders
    for (let y = 0; y < this.height; y++) {
      data[y * this.width] = this.tiles.wall;
      data[y * this.width + this.width - 1] = this.tiles.wall;
    }
  }
}

// Usage
const caveGen = new CaveGenerator({
  width: 100,
  height: 80,
  initialDensity: 0.45,
  iterations: 5,
  birthLimit: 4,
  deathLimit: 3
});

const caveData = caveGen.generate();
```

## Performance Optimization

### Batched Rendering

Minimize draw calls by batching tiles:

```javascript
class BatchedTilemapRenderer {
  constructor(gl, tilemap, tileset) {
    this.gl = gl;
    this.tilemap = tilemap;
    this.tileset = tileset;

    // Create shared buffers
    this.vertexBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();

    // Pre-allocate arrays for maximum visible tiles
    this.maxTiles = 2000;
    this.vertices = new Float32Array(this.maxTiles * 8);  // 4 vertices * 2 components
    this.uvs = new Float32Array(this.maxTiles * 8);
    this.indices = new Uint16Array(this.maxTiles * 6);     // 2 triangles * 3 indices

    // Pre-fill index buffer (doesn't change)
    for (let i = 0; i < this.maxTiles; i++) {
      const vi = i * 4;
      const ii = i * 6;
      this.indices[ii] = vi;
      this.indices[ii + 1] = vi + 1;
      this.indices[ii + 2] = vi + 2;
      this.indices[ii + 3] = vi;
      this.indices[ii + 4] = vi + 2;
      this.indices[ii + 5] = vi + 3;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    this.tileCount = 0;
  }

  buildBatch(layer, camera) {
    this.tileCount = 0;

    const startX = Math.floor(camera.x / this.tilemap.tileWidth);
    const startY = Math.floor(camera.y / this.tilemap.tileHeight);
    const endX = Math.ceil((camera.x + camera.width) / this.tilemap.tileWidth);
    const endY = Math.ceil((camera.y + camera.height) / this.tilemap.tileHeight);

    const tileW = this.tilemap.tileWidth;
    const tileH = this.tilemap.tileHeight;
    const texW = this.tileset.image.width;
    const texH = this.tileset.image.height;

    for (let y = startY; y <= endY && this.tileCount < this.maxTiles; y++) {
      for (let x = startX; x <= endX && this.tileCount < this.maxTiles; x++) {
        const tileId = layer.getTile(x, y);
        if (tileId === 0) continue;

        const region = this.tileset.getTileRegion(tileId);
        if (!region) continue;

        const vi = this.tileCount * 8;

        // World positions
        const wx = x * tileW - camera.x;
        const wy = y * tileH - camera.y;

        // Vertices (4 corners)
        this.vertices[vi] = wx;
        this.vertices[vi + 1] = wy;
        this.vertices[vi + 2] = wx + tileW;
        this.vertices[vi + 3] = wy;
        this.vertices[vi + 4] = wx + tileW;
        this.vertices[vi + 5] = wy + tileH;
        this.vertices[vi + 6] = wx;
        this.vertices[vi + 7] = wy + tileH;

        // UV coordinates
        const u0 = region.x / texW;
        const v0 = region.y / texH;
        const u1 = (region.x + region.width) / texW;
        const v1 = (region.y + region.height) / texH;

        this.uvs[vi] = u0;
        this.uvs[vi + 1] = v0;
        this.uvs[vi + 2] = u1;
        this.uvs[vi + 3] = v0;
        this.uvs[vi + 4] = u1;
        this.uvs[vi + 5] = v1;
        this.uvs[vi + 6] = u0;
        this.uvs[vi + 7] = v1;

        this.tileCount++;
      }
    }

    // Upload to GPU
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices.subarray(0, this.tileCount * 8), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs.subarray(0, this.tileCount * 8), gl.DYNAMIC_DRAW);
  }

  render(shader) {
    if (this.tileCount === 0) return;

    const gl = this.gl;

    // Bind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(shader.positionAttrib, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(shader.texcoordAttrib, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // Draw all tiles in one call
    gl.drawElements(gl.TRIANGLES, this.tileCount * 6, gl.UNSIGNED_SHORT, 0);
  }
}
```

### Spatial Partitioning for Collision

Optimize collision checks with spatial hashing:

```javascript
class SpatialHashGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  insert(entity) {
    const minX = Math.floor(entity.x / this.cellSize);
    const minY = Math.floor(entity.y / this.cellSize);
    const maxX = Math.floor((entity.x + entity.width) / this.cellSize);
    const maxY = Math.floor((entity.y + entity.height) / this.cellSize);

    entity._spatialCells = [];

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        if (!this.cells.has(key)) {
          this.cells.set(key, new Set());
        }
        this.cells.get(key).add(entity);
        entity._spatialCells.push(key);
      }
    }
  }

  remove(entity) {
    if (entity._spatialCells) {
      for (const key of entity._spatialCells) {
        const cell = this.cells.get(key);
        if (cell) {
          cell.delete(entity);
          if (cell.size === 0) {
            this.cells.delete(key);
          }
        }
      }
      entity._spatialCells = null;
    }
  }

  update(entity) {
    this.remove(entity);
    this.insert(entity);
  }

  query(bounds) {
    const result = new Set();

    const minX = Math.floor(bounds.x / this.cellSize);
    const minY = Math.floor(bounds.y / this.cellSize);
    const maxX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const maxY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const entity of cell) {
            result.add(entity);
          }
        }
      }
    }

    return Array.from(result);
  }

  clear() {
    this.cells.clear();
  }
}

// Usage with tilemap collision
class OptimizedTileCollision {
  constructor(tilemap, tileset) {
    this.tilemap = tilemap;
    this.tileset = tileset;
    this.spatialHash = new SpatialHashGrid(tilemap.tileWidth * 4);
    this.staticColliders = [];

    // Build static collision data once
    this.buildStaticColliders();
  }

  buildStaticColliders() {
    const layer = this.tilemap.getLayer('collision');
    if (!layer) return;

    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const tileId = layer.getTile(x, y);
        if (tileId === 0) continue;

        const isSolid = this.tileset.getTileProperty(tileId, 'collision');
        if (!isSolid) continue;

        const collider = {
          x: x * this.tilemap.tileWidth,
          y: y * this.tilemap.tileHeight,
          width: this.tilemap.tileWidth,
          height: this.tilemap.tileHeight,
          tileX: x,
          tileY: y,
          tileId
        };

        this.staticColliders.push(collider);
        this.spatialHash.insert(collider);
      }
    }
  }

  getNearbyColliders(entity) {
    // Add padding to catch edge cases
    const queryBounds = {
      x: entity.x - this.tilemap.tileWidth,
      y: entity.y - this.tilemap.tileHeight,
      width: entity.width + this.tilemap.tileWidth * 2,
      height: entity.height + this.tilemap.tileHeight * 2
    };

    return this.spatialHash.query(queryBounds);
  }
}
```

### Dirty Rectangle Optimization

Only redraw changed areas:

```javascript
class DirtyRectRenderer {
  constructor(ctx, tilemap, width, height) {
    this.ctx = ctx;
    this.tilemap = tilemap;
    this.width = width;
    this.height = height;

    // Off-screen buffer for the tilemap
    this.buffer = document.createElement('canvas');
    this.buffer.width = width;
    this.buffer.height = height;
    this.bufferCtx = this.buffer.getContext('2d');

    // Track dirty regions
    this.dirtyRegions = [];
    this.fullRedrawNeeded = true;

    // Previous camera position
    this.lastCameraX = 0;
    this.lastCameraY = 0;
  }

  markDirty(x, y, width, height) {
    this.dirtyRegions.push({ x, y, width, height });
  }

  markTileDirty(tileX, tileY) {
    this.markDirty(
      tileX * this.tilemap.tileWidth,
      tileY * this.tilemap.tileHeight,
      this.tilemap.tileWidth,
      this.tilemap.tileHeight
    );
  }

  update(camera) {
    // Check if camera moved
    if (camera.x !== this.lastCameraX || camera.y !== this.lastCameraY) {
      this.fullRedrawNeeded = true;
    }

    this.lastCameraX = camera.x;
    this.lastCameraY = camera.y;
  }

  render(camera, renderCallback) {
    if (this.fullRedrawNeeded) {
      // Full redraw
      this.bufferCtx.clearRect(0, 0, this.width, this.height);
      renderCallback(this.bufferCtx, camera);
      this.fullRedrawNeeded = false;
      this.dirtyRegions = [];
    } else if (this.dirtyRegions.length > 0) {
      // Merge overlapping dirty regions
      const merged = this.mergeDirtyRegions();

      for (const region of merged) {
        // Clip to dirty region
        this.bufferCtx.save();
        this.bufferCtx.beginPath();
        this.bufferCtx.rect(
          region.x - camera.x,
          region.y - camera.y,
          region.width,
          region.height
        );
        this.bufferCtx.clip();

        // Clear and redraw region
        this.bufferCtx.clearRect(
          region.x - camera.x,
          region.y - camera.y,
          region.width,
          region.height
        );
        renderCallback(this.bufferCtx, camera);

        this.bufferCtx.restore();
      }

      this.dirtyRegions = [];
    }

    // Draw buffer to main canvas
    this.ctx.drawImage(this.buffer, 0, 0);
  }

  mergeDirtyRegions() {
    if (this.dirtyRegions.length === 0) return [];
    if (this.dirtyRegions.length === 1) return this.dirtyRegions;

    // Simple merging - combine overlapping rectangles
    const merged = [];
    const remaining = [...this.dirtyRegions];

    while (remaining.length > 0) {
      let current = remaining.pop();
      let merged_any = true;

      while (merged_any) {
        merged_any = false;
        for (let i = remaining.length - 1; i >= 0; i--) {
          if (this.rectsOverlap(current, remaining[i])) {
            current = this.mergeRects(current, remaining[i]);
            remaining.splice(i, 1);
            merged_any = true;
          }
        }
      }

      merged.push(current);
    }

    return merged;
  }

  rectsOverlap(a, b) {
    return !(a.x + a.width < b.x || b.x + b.width < a.x ||
             a.y + a.height < b.y || b.y + b.height < a.y);
  }

  mergeRects(a, b) {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    return {
      x,
      y,
      width: Math.max(a.x + a.width, b.x + b.width) - x,
      height: Math.max(a.y + a.height, b.y + b.height) - y
    };
  }
}
```

## Best Practices and Tips

### Memory Management

1. **Use Typed Arrays**: `Uint32Array` for tile data is more memory-efficient than regular arrays
2. **Pool Objects**: Reuse collision result objects instead of allocating new ones
3. **Lazy Loading**: Only load chunks that are visible or near the player
4. **Dispose Unused Resources**: Unload textures and chunks when no longer needed

```javascript
class TileDataPool {
  constructor(initialSize = 100) {
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createTileData());
    }
  }

  createTileData() {
    return { x: 0, y: 0, tileId: 0, worldX: 0, worldY: 0 };
  }

  acquire() {
    return this.pool.length > 0 ? this.pool.pop() : this.createTileData();
  }

  release(tileData) {
    // Reset values
    tileData.x = 0;
    tileData.y = 0;
    tileData.tileId = 0;
    this.pool.push(tileData);
  }

  releaseAll(array) {
    for (const item of array) {
      this.release(item);
    }
    array.length = 0;
  }
}
```

### Debug Visualization

Helpful debugging tools for tilemap development:

```javascript
class TilemapDebugger {
  constructor(renderer) {
    this.renderer = renderer;
    this.showGrid = false;
    this.showCollision = false;
    this.showChunkBoundaries = false;
    this.showTileInfo = false;
  }

  render(ctx, camera, tilemap) {
    if (this.showGrid) {
      this.renderGrid(ctx, camera, tilemap);
    }

    if (this.showCollision) {
      this.renderCollision(ctx, camera, tilemap);
    }

    if (this.showChunkBoundaries) {
      this.renderChunkBoundaries(ctx, camera, tilemap);
    }

    if (this.showTileInfo) {
      this.renderTileInfo(ctx, camera, tilemap);
    }
  }

  renderGrid(ctx, camera, tilemap) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    const startX = Math.floor(camera.x / tilemap.tileWidth) * tilemap.tileWidth;
    const startY = Math.floor(camera.y / tilemap.tileHeight) * tilemap.tileHeight;

    ctx.beginPath();
    for (let x = startX; x < camera.x + camera.width + tilemap.tileWidth; x += tilemap.tileWidth) {
      ctx.moveTo(x - camera.x, 0);
      ctx.lineTo(x - camera.x, camera.height);
    }
    for (let y = startY; y < camera.y + camera.height + tilemap.tileHeight; y += tilemap.tileHeight) {
      ctx.moveTo(0, y - camera.y);
      ctx.lineTo(camera.width, y - camera.y);
    }
    ctx.stroke();
  }

  renderCollision(ctx, camera, tilemap) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';

    const layer = tilemap.getLayer('collision');
    if (!layer) return;

    const startX = Math.floor(camera.x / tilemap.tileWidth);
    const startY = Math.floor(camera.y / tilemap.tileHeight);
    const endX = Math.ceil((camera.x + camera.width) / tilemap.tileWidth);
    const endY = Math.ceil((camera.y + camera.height) / tilemap.tileHeight);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tileId = layer.getTile(x, y);
        if (tileId > 0) {
          ctx.fillRect(
            x * tilemap.tileWidth - camera.x,
            y * tilemap.tileHeight - camera.y,
            tilemap.tileWidth,
            tilemap.tileHeight
          );
        }
      }
    }
  }

  renderChunkBoundaries(ctx, camera, tilemap) {
    if (!tilemap.chunkSize) return;

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;

    const chunkPixelSize = tilemap.chunkSize * tilemap.tileWidth;
    const startX = Math.floor(camera.x / chunkPixelSize) * chunkPixelSize;
    const startY = Math.floor(camera.y / chunkPixelSize) * chunkPixelSize;

    ctx.beginPath();
    for (let x = startX; x < camera.x + camera.width + chunkPixelSize; x += chunkPixelSize) {
      ctx.moveTo(x - camera.x, 0);
      ctx.lineTo(x - camera.x, camera.height);
    }
    for (let y = startY; y < camera.y + camera.height + chunkPixelSize; y += chunkPixelSize) {
      ctx.moveTo(0, y - camera.y);
      ctx.lineTo(camera.width, y - camera.y);
    }
    ctx.stroke();
  }

  renderTileInfo(ctx, camera, tilemap) {
    const mouseX = this.renderer.mouseX + camera.x;
    const mouseY = this.renderer.mouseY + camera.y;

    const tileX = Math.floor(mouseX / tilemap.tileWidth);
    const tileY = Math.floor(mouseY / tilemap.tileHeight);

    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';

    let y = 20;
    ctx.fillText(`Tile: (${tileX}, ${tileY})`, 10, y);
    y += 15;
    ctx.fillText(`World: (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})`, 10, y);

    for (const [name, layer] of tilemap.layers) {
      y += 15;
      const tileId = layer.getTile(tileX, tileY);
      ctx.fillText(`${name}: ${tileId}`, 10, y);
    }
  }
}
```

## Summary

Building an effective tilemap system requires understanding several interconnected components. Here are the key takeaways:

1. **Tileset Design**: Organize tiles efficiently in texture atlases, define properties for collision and animation, and use appropriate tile sizes for your game scale.

2. **Data Structures**: Choose between flat arrays for small maps and chunk-based systems for large worlds. Use typed arrays for memory efficiency.

3. **Auto-Tiling**: Implement bitmask-based auto-tiling to dramatically speed up level design. The 47-tile blob pattern covers most use cases.

4. **Collision Systems**: Start with simple grid collision and extend to slopes and one-way platforms as needed. Use spatial partitioning for complex scenes.

5. **Layered Rendering**: Separate background, gameplay, and foreground layers. Implement parallax scrolling for visual depth.

6. **Tool Integration**: Support Tiled TMX format for professional-grade level editing capabilities. Parse object layers for game logic placement.

7. **Procedural Generation**: Combine noise-based terrain generation with BSP dungeons and cellular automata caves for varied content.

8. **Performance**: Batch rendering calls, cull off-screen tiles, and consider dirty rectangle optimization for static scenes.

With these techniques, you can build tilemap systems that scale from simple prototypes to complex production games while maintaining good performance and enabling rapid level iteration.
