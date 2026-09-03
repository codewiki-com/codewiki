---
title: 可扩展性模式
description: 学习构建可扩展系统的架构模式
track: architecture
section: system-design
difficulty: advanced
tags:
  - 可扩展性
  - 水平扩展
  - 垂直扩展
  - 分布式
status: imported
origin: old/src/content/docs/architecture/scalability-patterns.zh.md
divergence: 0.453
issues:
  - divergent
legacy:
  category: Architecture
  subcategory: Scalability
  order: 21
  lastUpdated: 2026-01-07
---

## 概念解释

可扩展性（Scalability）是指系统在负载增加时，通过增加资源来保持或提升性能的能力。一个具有良好可扩展性的系统能够优雅地处理用户增长、数据量增加和请求量上升，而不会出现性能瓶颈或服务中断。

### 为什么可扩展性如此重要？

在现代互联网应用中，业务增长往往是不可预测的：

1. **用户爆发式增长**：社交媒体病毒式传播可能在数小时内带来百万级新用户
2. **流量高峰**：电商促销（如双11）、新闻热点可能带来10倍以上的流量峰值
3. **数据量激增**：每天产生的数据量可能超过过去一年的总和
4. **全球化部署**：服务需要在全球多个区域保持一致的响应速度

不具备可扩展性的系统在面对这些挑战时，可能会出现：

- **响应变慢**：用户体验下降，转化率降低
- **服务不可用**：直接的经济损失和声誉损害
- **数据丢失**：严重的业务问题和合规风险
- **运维困难**：团队疲于应对，无法进行创新

---

## 水平扩展 vs 垂直扩展

扩展系统容量有两种基本方法：水平扩展和垂直扩展。

### 垂直扩展（Scale Up）

垂直扩展是指通过增加单台机器的资源（CPU、内存、存储、网络带宽）来提升处理能力。

```
垂直扩展示意图：

    升级前                    升级后
+-------------+          +-------------+
|   Server    |          |   Server    |
|             |          |             |
|  4 CPU      |    ->    |  32 CPU     |
|  8 GB RAM   |          |  128 GB RAM |
|  100 GB SSD |          |  2 TB SSD   |
|             |          |             |
+-------------+          +-------------+
```

**优点**：

- **实现简单**：无需修改应用架构
- **管理方便**：只需维护单台服务器
- **无分布式复杂性**：不需要考虑数据一致性、网络分区等问题
- **事务简单**：所有数据在同一台机器上，ACID 事务容易实现

**缺点**：

- **硬件限制**：单机性能有上限（最强服务器也有极限）
- **成本非线性增长**：高端硬件价格呈指数级增长
- **单点故障**：一旦服务器宕机，整个服务不可用
- **升级需要停机**：更换硬件通常需要停止服务

### 水平扩展（Scale Out）

水平扩展是指通过增加更多的服务器节点来分担负载。

```
水平扩展示意图：

              负载均衡器
                 |
    +------------+------------+
    |            |            |
    v            v            v
+-------+   +-------+   +-------+
|Server1|   |Server2|   |Server3|
| 4 CPU |   | 4 CPU |   | 4 CPU |
| 8 GB  |   | 8 GB  |   | 8 GB  |
+-------+   +-------+   +-------+

                | 扩展

              负载均衡器
                 |
    +------+-----+-----+------+
    |      |     |     |      |
    v      v     v     v      v
+-----+ +-----+ +-----+ +-----+ +-----+
| S1  | | S2  | | S3  | | S4  | | S5  |
+-----+ +-----+ +-----+ +-----+ +-----+
```

**优点**：

- **理论上无上限**：可以不断增加服务器节点
- **成本线性增长**：使用普通服务器，性价比更高
- **高可用性**：单节点故障不影响整体服务
- **灵活性高**：可以根据负载动态增减节点

**缺点**：

- **架构复杂**：需要考虑负载均衡、数据分片、一致性等
- **开发难度增加**：应用需要设计为分布式架构
- **运维挑战**：需要管理多个节点，监控和故障排查更复杂
- **网络延迟**：节点间通信带来额外开销

### 如何选择？

```typescript
// 扩展策略决策树
function chooseScalingStrategy(context: ScalingContext): ScalingStrategy {
  // 1. 如果当前负载较低，可以先垂直扩展
  if (context.currentLoad < 0.5 && context.canUpgradeHardware) {
    return {
      type: 'VERTICAL',
      reason: '负载较低，垂直扩展更简单且成本效益好'
    };
  }

  // 2. 如果应用是无状态的，优先水平扩展
  if (context.isStateless) {
    return {
      type: 'HORIZONTAL',
      reason: '无状态应用易于水平扩展'
    };
  }

  // 3. 如果已接近单机极限，必须水平扩展
  if (context.nearHardwareLimit) {
    return {
      type: 'HORIZONTAL',
      reason: '已接近硬件极限，必须水平扩展'
    };
  }

  // 4. 如果高可用是硬性要求，水平扩展
  if (context.requiresHighAvailability) {
    return {
      type: 'HORIZONTAL',
      reason: '高可用要求需要多节点冗余'
    };
  }

  // 5. 默认推荐混合策略
  return {
    type: 'HYBRID',
    reason: '结合两种策略：先垂直扩展到合理规格，再水平扩展'
  };
}
```

**实际建议**：大多数现代系统采用**混合策略**——先将单机扩展到一个合理的规格（如 8-16 核，32-64GB 内存），然后通过水平扩展来应对更大的负载。

---

## 无状态设计（Stateless Design）

无状态设计是实现水平扩展的关键前提。在无状态架构中，每个请求都包含处理该请求所需的全部信息，服务器不保存任何客户端状态。

### 有状态 vs 无状态

```
有状态设计：
                    Session 存储在服务器内存中
                              |
User A ------> Server 1 [Session: {userId: A, cart: [...]}]
User A ------> Server 2 [无 Session 数据，请求失败！]

无状态设计：
                    每个请求携带认证信息
                              |
User A ------> Server 1 [验证 Token，处理请求]
User A ------> Server 2 [验证 Token，处理请求] OK
User A ------> Server 3 [验证 Token，处理请求] OK
```

### 实现无状态的方法

#### 使用 JWT（JSON Web Token）替代 Session

```typescript
// 有状态方式：Session
app.post('/login', async (req, res) => {
  const user = await authenticate(req.body);
  // 状态存储在服务器内存
  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ success: true });
});

app.get('/profile', (req, res) => {
  // 依赖服务器存储的 session
  const userId = req.session.userId;
  // ...
});
```

```typescript
// 无状态方式：JWT
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = '24h';

// 登录时签发 Token
app.post('/login', async (req, res) => {
  const user = await authenticate(req.body);

  // 用户信息编码在 Token 中
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  res.json({
    success: true,
    token,
    expiresIn: TOKEN_EXPIRY
  });
});

// 验证中间件
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    // 从 Token 中解析用户信息，无需服务器存储
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 使用中间件
app.get('/profile', authMiddleware, (req, res) => {
  // 用户信息来自 Token，不依赖服务器状态
  const userId = req.user.userId;
  // ...
});
```

#### 外部化状态存储

将需要共享的状态存储在外部系统中：

```typescript
// 购物车状态外部化到 Redis
class CartService {
  constructor(private redis: Redis) {}

  async getCart(userId: string): Promise<CartItem[]> {
    const cartData = await this.redis.get(`cart:${userId}`);
    return cartData ? JSON.parse(cartData) : [];
  }

  async addToCart(userId: string, item: CartItem): Promise<void> {
    const cart = await this.getCart(userId);
    const existingIndex = cart.findIndex(i => i.productId === item.productId);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += item.quantity;
    } else {
      cart.push(item);
    }

    // 状态存储在 Redis，任何服务器都可以访问
    await this.redis.set(
      `cart:${userId}`,
      JSON.stringify(cart),
      'EX',
      86400 // 24小时过期
    );
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    const cart = await this.getCart(userId);
    const newCart = cart.filter(i => i.productId !== productId);
    await this.redis.set(`cart:${userId}`, JSON.stringify(newCart), 'EX', 86400);
  }

  async clearCart(userId: string): Promise<void> {
    await this.redis.del(`cart:${userId}`);
  }
}
```

#### 请求携带必要上下文

```typescript
// API 网关为下游服务添加上下文
class ApiGateway {
  async handleRequest(req: Request): Promise<Response> {
    // 验证并解析用户信息
    const user = await this.authenticateRequest(req);

    // 创建请求上下文
    const context: RequestContext = {
      requestId: generateRequestId(),
      userId: user.id,
      tenantId: user.tenantId,
      permissions: user.permissions,
      locale: req.headers['accept-language'] || 'zh-CN',
      timezone: req.headers['x-timezone'] || 'Asia/Shanghai',
      timestamp: Date.now()
    };

    // 将上下文传递给下游服务
    const response = await this.routeToService(req, context);
    return response;
  }

  private async routeToService(
    req: Request,
    context: RequestContext
  ): Promise<Response> {
    // 通过 HTTP Headers 传递上下文
    const headers = {
      'X-Request-ID': context.requestId,
      'X-User-ID': context.userId,
      'X-Tenant-ID': context.tenantId,
      'X-Permissions': JSON.stringify(context.permissions),
      'X-Locale': context.locale,
      'X-Timezone': context.timezone
    };

    return fetch(this.getServiceUrl(req.path), {
      method: req.method,
      headers: { ...req.headers, ...headers },
      body: req.body
    });
  }
}
```

### 无状态设计的最佳实践

```typescript
// 无状态服务设计模式
class StatelessOrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cache: CacheService,
    private readonly eventBus: EventBus
  ) {}

  // 所有状态来自外部存储
  async createOrder(command: CreateOrderCommand): Promise<Order> {
    // 1. 验证命令（无状态）
    this.validateCommand(command);

    // 2. 从数据库获取必要数据
    const customer = await this.orderRepository.findCustomer(command.customerId);
    const products = await this.orderRepository.findProducts(command.productIds);

    // 3. 执行业务逻辑（纯函数，无副作用）
    const order = Order.create({
      customerId: customer.id,
      items: this.buildOrderItems(command.items, products),
      shippingAddress: command.shippingAddress
    });

    // 4. 持久化状态到外部存储
    await this.orderRepository.save(order);

    // 5. 发布事件（异步处理）
    await this.eventBus.publish(new OrderCreatedEvent(order));

    // 6. 更新缓存
    await this.cache.invalidate(`customer:${customer.id}:orders`);

    return order;
  }

  // 幂等性设计：相同请求多次执行结果一致
  async processPayment(
    orderId: string,
    paymentId: string,
    idempotencyKey: string
  ): Promise<PaymentResult> {
    // 检查是否已处理过
    const existingResult = await this.cache.get(`payment:${idempotencyKey}`);
    if (existingResult) {
      return JSON.parse(existingResult);
    }

    // 处理支付
    const order = await this.orderRepository.findById(orderId);
    const result = await this.processPaymentInternal(order, paymentId);

    // 缓存结果，确保幂等
    await this.cache.set(
      `payment:${idempotencyKey}`,
      JSON.stringify(result),
      3600 // 1小时过期
    );

    return result;
  }
}
```

---

## 缓存策略

缓存是提升系统性能和可扩展性的最有效手段之一。合理的缓存策略可以显著减少数据库负载，降低响应延迟。

### 多级缓存架构

```
                          请求流程
                              |
                              v
                    +------------------+
                    |   浏览器缓存      |  <- L1 缓存
                    |  (LocalStorage)  |
                    +--------+---------+
                             | 未命中
                             v
                    +------------------+
                    |    CDN 缓存      |  <- L2 缓存
                    | (边缘节点)        |
                    +--------+---------+
                             | 未命中
                             v
                    +------------------+
                    |   应用本地缓存    |  <- L3 缓存
                    |  (内存缓存)       |
                    +--------+---------+
                             | 未命中
                             v
                    +------------------+
                    |   分布式缓存     |  <- L4 缓存
                    |    (Redis)      |
                    +--------+---------+
                             | 未命中
                             v
                    +------------------+
                    |     数据库       |  <- 数据源
                    |   (PostgreSQL)  |
                    +------------------+
```

### 缓存实现

```typescript
// 多级缓存服务
class MultiLevelCache {
  constructor(
    private readonly localCache: LocalCache,  // 本地内存缓存
    private readonly redis: Redis,            // 分布式缓存
    private readonly metrics: MetricsService  // 监控
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // L1: 本地缓存
    const localResult = this.localCache.get<T>(key);
    if (localResult !== null) {
      this.metrics.increment('cache.hit', { level: 'local' });
      return localResult;
    }

    // L2: Redis 缓存
    const redisResult = await this.redis.get(key);
    if (redisResult !== null) {
      this.metrics.increment('cache.hit', { level: 'redis' });
      const parsed = JSON.parse(redisResult) as T;
      // 回填本地缓存
      this.localCache.set(key, parsed, 60); // 本地缓存1分钟
      return parsed;
    }

    this.metrics.increment('cache.miss');
    return null;
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 3600
  ): Promise<void> {
    // 同时写入两级缓存
    this.localCache.set(key, value, Math.min(ttlSeconds, 300)); // 本地最多5分钟
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async invalidate(key: string): Promise<void> {
    this.localCache.delete(key);
    await this.redis.del(key);

    // 发布失效消息，通知其他节点
    await this.redis.publish('cache:invalidate', key);
  }

  // 监听缓存失效消息
  async startInvalidationListener(): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe('cache:invalidate');

    subscriber.on('message', (channel, key) => {
      if (channel === 'cache:invalidate') {
        this.localCache.delete(key);
      }
    });
  }
}
```

### 缓存策略

#### Cache-Aside（旁路缓存）

最常用的缓存模式，应用程序直接管理缓存。

```typescript
class ProductService {
  constructor(
    private readonly cache: CacheService,
    private readonly db: ProductRepository
  ) {}

  async getProduct(id: string): Promise<Product | null> {
    const cacheKey = `product:${id}`;

    // 1. 先查缓存
    const cached = await this.cache.get<Product>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. 缓存未命中，查数据库
    const product = await this.db.findById(id);
    if (!product) {
      return null;
    }

    // 3. 写入缓存
    await this.cache.set(cacheKey, product, 3600);

    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    // 1. 更新数据库
    const product = await this.db.update(id, updates);

    // 2. 删除缓存（下次读取时重新加载）
    await this.cache.invalidate(`product:${id}`);

    return product;
  }
}
```

#### Read-Through / Write-Through

缓存层自动管理数据库读写。

```typescript
class ReadThroughCache<T> {
  constructor(
    private readonly cache: CacheService,
    private readonly loader: (key: string) => Promise<T | null>,
    private readonly ttl: number = 3600
  ) {}

  async get(key: string): Promise<T | null> {
    // 检查缓存
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 自动从数据源加载
    const data = await this.loader(key);
    if (data !== null) {
      await this.cache.set(key, data, this.ttl);
    }

    return data;
  }
}

class WriteThroughCache<T> {
  constructor(
    private readonly cache: CacheService,
    private readonly writer: (key: string, value: T) => Promise<void>,
    private readonly ttl: number = 3600
  ) {}

  async set(key: string, value: T): Promise<void> {
    // 同时写入缓存和数据库
    await Promise.all([
      this.cache.set(key, value, this.ttl),
      this.writer(key, value)
    ]);
  }
}

// 使用示例
const productCache = new ReadThroughCache<Product>(
  cacheService,
  async (key) => {
    const id = key.replace('product:', '');
    return productRepository.findById(id);
  },
  3600
);
```

#### Write-Behind（异步写回）

先写缓存，异步批量写入数据库，提高写入性能。

```typescript
class WriteBehindCache {
  private writeBuffer: Map<string, { value: any; timestamp: number }> = new Map();
  private flushInterval: NodeJS.Timeout;

  constructor(
    private readonly cache: CacheService,
    private readonly writer: (entries: Array<[string, any]>) => Promise<void>,
    private readonly batchSize: number = 100,
    private readonly flushIntervalMs: number = 1000
  ) {
    // 定期刷新缓冲区
    this.flushInterval = setInterval(() => this.flush(), flushIntervalMs);
  }

  async set(key: string, value: any): Promise<void> {
    // 立即写入缓存
    await this.cache.set(key, value);

    // 添加到写缓冲区
    this.writeBuffer.set(key, { value, timestamp: Date.now() });

    // 如果缓冲区满，立即刷新
    if (this.writeBuffer.size >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.writeBuffer.size === 0) return;

    const entries = Array.from(this.writeBuffer.entries())
      .map(([key, { value }]) => [key, value] as [string, any]);

    this.writeBuffer.clear();

    try {
      await this.writer(entries);
    } catch (error) {
      // 写入失败，重新放入缓冲区
      console.error('Write-behind flush failed:', error);
      entries.forEach(([key, value]) => {
        this.writeBuffer.set(key, { value, timestamp: Date.now() });
      });
    }
  }

  async close(): Promise<void> {
    clearInterval(this.flushInterval);
    await this.flush();
  }
}
```

### 缓存常见问题与解决方案

#### 缓存穿透

查询不存在的数据，缓存无法命中，请求直接打到数据库。

```typescript
class CachePenetrationProtection {
  constructor(
    private readonly cache: CacheService,
    private readonly bloomFilter: BloomFilter
  ) {}

  async get<T>(
    key: string,
    loader: () => Promise<T | null>
  ): Promise<T | null> {
    // 方案1：布隆过滤器预检
    if (!this.bloomFilter.mightContain(key)) {
      return null; // 确定不存在
    }

    // 方案2：缓存空值
    const cached = await this.cache.get<T | 'NULL'>(key);
    if (cached === 'NULL') {
      return null; // 已知不存在
    }
    if (cached !== null) {
      return cached as T;
    }

    // 查询数据库
    const data = await loader();
    if (data === null) {
      // 缓存空值，较短过期时间
      await this.cache.set(key, 'NULL', 300);
    } else {
      await this.cache.set(key, data, 3600);
    }

    return data;
  }
}
```

#### 缓存击穿

热点 key 过期瞬间，大量请求同时查询数据库。

```typescript
class CacheBreakdownProtection {
  private locks: Map<string, Promise<any>> = new Map();

  async get<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 使用互斥锁，只允许一个请求加载数据
    if (this.locks.has(key)) {
      return this.locks.get(key)!;
    }

    const loadPromise = this.loadWithLock(key, loader, ttl);
    this.locks.set(key, loadPromise);

    try {
      return await loadPromise;
    } finally {
      this.locks.delete(key);
    }
  }

  private async loadWithLock<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const data = await loader();
    await this.cache.set(key, data, ttl);
    return data;
  }
}
```

#### 缓存雪崩

大量缓存同时过期，请求全部打到数据库。

```typescript
class CacheAvalancheProtection {
  // 方案1：过期时间加随机值
  async setWithJitter<T>(
    key: string,
    value: T,
    baseTtl: number
  ): Promise<void> {
    // 基础 TTL + 随机偏移（正负10%）
    const jitter = baseTtl * 0.1 * (Math.random() * 2 - 1);
    const actualTtl = Math.floor(baseTtl + jitter);
    await this.cache.set(key, value, actualTtl);
  }

  // 方案2：热点数据永不过期 + 后台更新
  async setWithBackgroundRefresh<T>(
    key: string,
    value: T,
    loader: () => Promise<T>,
    softTtl: number  // 软过期时间
  ): Promise<void> {
    const cacheValue = {
      data: value,
      softExpireAt: Date.now() + softTtl * 1000
    };

    // 永不过期
    await this.cache.set(key, cacheValue);
  }

  async getWithBackgroundRefresh<T>(
    key: string,
    loader: () => Promise<T>,
    softTtl: number
  ): Promise<T | null> {
    const cached = await this.cache.get<{
      data: T;
      softExpireAt: number;
    }>(key);

    if (!cached) {
      const data = await loader();
      await this.setWithBackgroundRefresh(key, data, loader, softTtl);
      return data;
    }

    // 软过期：返回旧数据，后台更新
    if (cached.softExpireAt < Date.now()) {
      // 异步更新，不阻塞当前请求
      this.refreshInBackground(key, loader, softTtl);
    }

    return cached.data;
  }

  private async refreshInBackground<T>(
    key: string,
    loader: () => Promise<T>,
    softTtl: number
  ): Promise<void> {
    try {
      const data = await loader();
      await this.setWithBackgroundRefresh(key, data, loader, softTtl);
    } catch (error) {
      console.error(`Background refresh failed for ${key}:`, error);
    }
  }
}
```

---

## 数据库扩展

数据库通常是系统的瓶颈所在。扩展数据库需要从多个维度考虑。

### 读写分离

```
                    写操作
                      |
                      v
               +-------------+
               |   Master    |
               |  (Primary)  |
               +------+------+
                      | 复制
          +-----------+-----------+
          v           v           v
    +----------+ +----------+ +----------+
    | Replica1 | | Replica2 | | Replica3 |
    +----+-----+ +----+-----+ +----+-----+
         |            |            |
         +------------+------------+
                      |
                  读操作
```

```typescript
class ReadWriteSplitDataSource {
  private masterConnection: Connection;
  private replicaConnections: Connection[];
  private currentReplicaIndex = 0;

  constructor(
    masterConfig: ConnectionConfig,
    replicaConfigs: ConnectionConfig[]
  ) {
    this.masterConnection = createConnection(masterConfig);
    this.replicaConnections = replicaConfigs.map(createConnection);
  }

  // 写操作使用主库
  async write<T>(query: string, params?: any[]): Promise<T> {
    return this.masterConnection.query(query, params);
  }

  // 读操作使用从库（轮询负载均衡）
  async read<T>(query: string, params?: any[]): Promise<T> {
    const replica = this.getNextReplica();
    return replica.query(query, params);
  }

  private getNextReplica(): Connection {
    const replica = this.replicaConnections[this.currentReplicaIndex];
    this.currentReplicaIndex =
      (this.currentReplicaIndex + 1) % this.replicaConnections.length;
    return replica;
  }

  // 强一致性读（从主库读取）
  async readFromMaster<T>(query: string, params?: any[]): Promise<T> {
    return this.masterConnection.query(query, params);
  }
}

// 使用装饰器自动路由
class OrderRepository {
  constructor(private readonly dataSource: ReadWriteSplitDataSource) {}

  @UseReplica() // 读操作走从库
  async findById(id: string): Promise<Order | null> {
    return this.dataSource.read(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
  }

  @UseMaster() // 写操作走主库
  async save(order: Order): Promise<void> {
    await this.dataSource.write(
      'INSERT INTO orders (id, customer_id, status) VALUES ($1, $2, $3)',
      [order.id, order.customerId, order.status]
    );
  }

  @UseMaster() // 刚写入后需要读取，走主库保证一致性
  async saveAndReturn(order: Order): Promise<Order> {
    await this.save(order);
    return this.dataSource.readFromMaster(
      'SELECT * FROM orders WHERE id = $1',
      [order.id]
    );
  }
}
```

### 分库分表（Sharding）

#### 垂直分库

按业务拆分不同的数据库。

```
            +------------------------------------+
            |           原单一数据库              |
            |  Users | Orders | Products | Logs  |
            +------------------------------------+
                           |
                           v 垂直拆分
    +-----------+  +-----------+  +-----------+  +-----------+
    |  用户库    |  |  订单库    |  |  商品库    |  |  日志库    |
    |  Users    |  |  Orders   |  | Products  |  |   Logs    |
    +-----------+  +-----------+  +-----------+  +-----------+
```

#### 水平分表

按数据维度拆分同一张表的数据。

```
            +------------------------------------+
            |            Orders 表               |
            |         (1亿条记录)                 |
            +------------------------------------+
                           |
                           v 水平拆分
    +-----------+  +-----------+  +-----------+  +-----------+
    | orders_00 |  | orders_01 |  | orders_02 |  | orders_03 |
    | (2500万)  |  | (2500万)  |  | (2500万)  |  | (2500万)  |
    +-----------+  +-----------+  +-----------+  +-----------+
```

```typescript
// 分片策略
interface ShardingStrategy {
  getShardKey(data: any): string;
  getShardId(shardKey: string): number;
  getTableName(baseTable: string, shardId: number): string;
}

// 基于用户ID的分片
class UserIdShardingStrategy implements ShardingStrategy {
  constructor(private readonly shardCount: number = 4) {}

  getShardKey(data: { userId: string }): string {
    return data.userId;
  }

  getShardId(shardKey: string): number {
    // 使用一致性哈希
    const hash = this.hashCode(shardKey);
    return Math.abs(hash) % this.shardCount;
  }

  getTableName(baseTable: string, shardId: number): string {
    return `${baseTable}_${shardId.toString().padStart(2, '0')}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

// 分片感知的 Repository
class ShardedOrderRepository {
  constructor(
    private readonly connections: Map<number, Connection>,
    private readonly shardingStrategy: ShardingStrategy
  ) {}

  async findById(orderId: string, userId: string): Promise<Order | null> {
    const shardId = this.shardingStrategy.getShardId(userId);
    const tableName = this.shardingStrategy.getTableName('orders', shardId);
    const connection = this.connections.get(shardId)!;

    const result = await connection.query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [orderId]
    );

    return result.rows[0] || null;
  }

  async save(order: Order): Promise<void> {
    const shardId = this.shardingStrategy.getShardId(order.userId);
    const tableName = this.shardingStrategy.getTableName('orders', shardId);
    const connection = this.connections.get(shardId)!;

    await connection.query(
      `INSERT INTO ${tableName} (id, user_id, status, created_at)
       VALUES ($1, $2, $3, $4)`,
      [order.id, order.userId, order.status, order.createdAt]
    );
  }

  // 跨分片查询（需要聚合多个分片结果）
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Order[]> {
    const promises = Array.from(this.connections.entries()).map(
      async ([shardId, connection]) => {
        const tableName = this.shardingStrategy.getTableName('orders', shardId);
        const result = await connection.query(
          `SELECT * FROM ${tableName}
           WHERE created_at BETWEEN $1 AND $2
           ORDER BY created_at DESC`,
          [startDate, endDate]
        );
        return result.rows;
      }
    );

    const results = await Promise.all(promises);

    // 合并并排序
    return results
      .flat()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
```

### 数据库连接池

```typescript
import { Pool, PoolConfig } from 'pg';

class DatabasePool {
  private pool: Pool;
  private metrics: MetricsService;

  constructor(config: PoolConfig, metrics: MetricsService) {
    this.pool = new Pool({
      ...config,
      // 连接池配置
      min: 5,                    // 最小连接数
      max: 20,                   // 最大连接数
      idleTimeoutMillis: 30000,  // 空闲连接超时
      connectionTimeoutMillis: 2000, // 连接超时
    });

    this.metrics = metrics;

    // 监控连接池状态
    this.setupMonitoring();
  }

  private setupMonitoring(): void {
    setInterval(() => {
      this.metrics.gauge('db.pool.total', this.pool.totalCount);
      this.metrics.gauge('db.pool.idle', this.pool.idleCount);
      this.metrics.gauge('db.pool.waiting', this.pool.waitingCount);
    }, 5000);

    this.pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
      this.metrics.increment('db.pool.errors');
    });
  }

  async query<T>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();

    try {
      const result = await this.pool.query(text, params);
      this.metrics.histogram('db.query.duration', Date.now() - start);
      return result.rows;
    } catch (error) {
      this.metrics.increment('db.query.errors');
      throw error;
    }
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
```

---

## 异步处理

异步处理是提升系统吞吐量和响应速度的关键手段。通过将耗时操作异步化，可以快速响应用户请求，同时在后台处理复杂业务。

### 消息队列架构

```
    生产者                消息队列                  消费者
      |                     |                       |
      |    publish          |                       |
      | ---------------->   |                       |
      |                     |     consume           |
      |                     | <----------------     |
      |                     |                       |
      |                     |     process           |
      |                     |                  <----|
      |                     |                       |
      |                     |     ack               |
      |                     | <----------------     |

常用消息队列：
- RabbitMQ：功能丰富，支持多种消息模式
- Apache Kafka：高吞吐量，适合日志和事件流
- Amazon SQS：托管服务，简单易用
- Redis Streams：轻量级，适合简单场景
```

### 消息队列实现

```typescript
// 消息定义
interface Message<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  retryCount: number;
  metadata: {
    correlationId?: string;
    replyTo?: string;
    [key: string]: any;
  };
}

// 消息生产者
class MessageProducer {
  constructor(
    private readonly channel: Channel,
    private readonly exchange: string
  ) {}

  async publish<T>(
    routingKey: string,
    payload: T,
    options?: PublishOptions
  ): Promise<string> {
    const message: Message<T> = {
      id: generateUUID(),
      type: routingKey,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      metadata: options?.metadata || {}
    };

    await this.channel.publish(
      this.exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        messageId: message.id,
        timestamp: message.timestamp,
        headers: message.metadata
      }
    );

    return message.id;
  }
}

// 消息消费者
class MessageConsumer {
  private handlers: Map<string, MessageHandler> = new Map();

  constructor(
    private readonly channel: Channel,
    private readonly queue: string,
    private readonly options: ConsumerOptions = {}
  ) {}

  register<T>(messageType: string, handler: MessageHandler<T>): void {
    this.handlers.set(messageType, handler);
  }

  async start(): Promise<void> {
    await this.channel.prefetch(this.options.prefetch || 10);

    await this.channel.consume(this.queue, async (msg) => {
      if (!msg) return;

      const message: Message = JSON.parse(msg.content.toString());
      const handler = this.handlers.get(message.type);

      if (!handler) {
        console.warn(`No handler for message type: ${message.type}`);
        this.channel.nack(msg, false, false); // 丢弃
        return;
      }

      try {
        await handler(message);
        this.channel.ack(msg);
      } catch (error) {
        await this.handleError(msg, message, error);
      }
    });
  }

  private async handleError(
    msg: ConsumeMessage,
    message: Message,
    error: Error
  ): Promise<void> {
    console.error(`Error processing message ${message.id}:`, error);

    const maxRetries = this.options.maxRetries || 3;

    if (message.retryCount < maxRetries) {
      // 重试：发送到延迟队列
      message.retryCount++;
      await this.publishToRetryQueue(message);
      this.channel.ack(msg);
    } else {
      // 超过重试次数：发送到死信队列
      await this.publishToDeadLetterQueue(message, error);
      this.channel.ack(msg);
    }
  }

  private async publishToRetryQueue(message: Message): Promise<void> {
    const delay = Math.pow(2, message.retryCount) * 1000; // 指数退避
    await this.channel.publish(
      'retry-exchange',
      message.type,
      Buffer.from(JSON.stringify(message)),
      {
        headers: { 'x-delay': delay }
      }
    );
  }

  private async publishToDeadLetterQueue(
    message: Message,
    error: Error
  ): Promise<void> {
    await this.channel.publish(
      'dlx-exchange',
      'dead-letter',
      Buffer.from(JSON.stringify({
        originalMessage: message,
        error: {
          message: error.message,
          stack: error.stack
        },
        failedAt: new Date().toISOString()
      }))
    );
  }
}
```

### 事件驱动架构

```typescript
// 领域事件定义
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  version: number;
  payload: any;
}

// 事件发布者
class EventPublisher {
  constructor(
    private readonly messageProducer: MessageProducer,
    private readonly eventStore: EventStore
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    // 1. 持久化事件（保证可靠性）
    await this.eventStore.append(event);

    // 2. 发布到消息队列
    await this.messageProducer.publish(
      event.eventType,
      event,
      {
        metadata: {
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType
        }
      }
    );
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    // 批量发布
    await this.eventStore.appendAll(events);
    await Promise.all(events.map(e => this.publish(e)));
  }
}

// 事件处理器
class OrderEventHandler {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService,
    private readonly inventoryService: InventoryService
  ) {}

  @EventHandler('OrderCreated')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // 发送订单确认邮件
    await this.notificationService.sendOrderConfirmation(
      event.payload.customerId,
      event.aggregateId
    );

    // 记录分析数据
    await this.analyticsService.trackEvent('order_created', {
      orderId: event.aggregateId,
      amount: event.payload.totalAmount
    });
  }

  @EventHandler('OrderConfirmed')
  async onOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    // 扣减库存
    for (const item of event.payload.items) {
      await this.inventoryService.deduct(
        item.productId,
        item.quantity
      );
    }
  }

  @EventHandler('OrderCancelled')
  async onOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    // 恢复库存
    for (const item of event.payload.items) {
      await this.inventoryService.restore(
        item.productId,
        item.quantity
      );
    }

    // 发送取消通知
    await this.notificationService.sendOrderCancellation(
      event.payload.customerId,
      event.aggregateId,
      event.payload.reason
    );
  }
}
```

### 任务队列

```typescript
// 后台任务定义
interface BackgroundJob<T = any> {
  id: string;
  type: string;
  payload: T;
  priority: number;
  scheduledAt?: Date;
  maxAttempts: number;
  timeout: number;
}

// 任务队列
class JobQueue {
  constructor(
    private readonly redis: Redis,
    private readonly queueName: string
  ) {}

  async enqueue<T>(
    jobType: string,
    payload: T,
    options: JobOptions = {}
  ): Promise<string> {
    const job: BackgroundJob<T> = {
      id: generateUUID(),
      type: jobType,
      payload,
      priority: options.priority || 0,
      scheduledAt: options.delay
        ? new Date(Date.now() + options.delay)
        : undefined,
      maxAttempts: options.maxAttempts || 3,
      timeout: options.timeout || 30000
    };

    if (job.scheduledAt) {
      // 延迟任务使用 sorted set
      await this.redis.zadd(
        `${this.queueName}:delayed`,
        job.scheduledAt.getTime(),
        JSON.stringify(job)
      );
    } else {
      // 立即执行的任务使用 list
      await this.redis.lpush(
        `${this.queueName}:pending`,
        JSON.stringify(job)
      );
    }

    return job.id;
  }

  async dequeue(): Promise<BackgroundJob | null> {
    // 先检查延迟队列
    await this.moveDelayedJobs();

    // 阻塞获取任务
    const result = await this.redis.brpop(
      `${this.queueName}:pending`,
      5 // 5秒超时
    );

    if (!result) {
      return null;
    }

    return JSON.parse(result[1]);
  }

  private async moveDelayedJobs(): Promise<void> {
    const now = Date.now();
    const jobs = await this.redis.zrangebyscore(
      `${this.queueName}:delayed`,
      0,
      now
    );

    for (const jobStr of jobs) {
      await this.redis.zrem(`${this.queueName}:delayed`, jobStr);
      await this.redis.lpush(`${this.queueName}:pending`, jobStr);
    }
  }
}

// 任务处理器
class JobWorker {
  private handlers: Map<string, JobHandler> = new Map();
  private running = false;

  constructor(
    private readonly queue: JobQueue,
    private readonly concurrency: number = 5
  ) {}

  register(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  async start(): Promise<void> {
    this.running = true;

    const workers = Array(this.concurrency)
      .fill(null)
      .map(() => this.workerLoop());

    await Promise.all(workers);
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  private async workerLoop(): Promise<void> {
    while (this.running) {
      const job = await this.queue.dequeue();

      if (!job) continue;

      const handler = this.handlers.get(job.type);
      if (!handler) {
        console.warn(`No handler for job type: ${job.type}`);
        continue;
      }

      try {
        await this.executeWithTimeout(handler, job);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        // 重试逻辑...
      }
    }
  }

  private async executeWithTimeout(
    handler: JobHandler,
    job: BackgroundJob
  ): Promise<void> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout')), job.timeout);
    });

    await Promise.race([
      handler(job),
      timeoutPromise
    ]);
  }
}

// 使用示例
const queue = new JobQueue(redis, 'background-jobs');
const worker = new JobWorker(queue, 10);

// 注册处理器
worker.register('send-email', async (job) => {
  await emailService.send(job.payload);
});

worker.register('generate-report', async (job) => {
  await reportService.generate(job.payload);
});

worker.register('process-video', async (job) => {
  await videoService.transcode(job.payload);
});

// 启动工作进程
await worker.start();
```

---

## CDN（内容分发网络）

CDN 通过在全球部署边缘节点，将内容缓存到离用户最近的位置，显著降低访问延迟。

### CDN 架构

```
                        用户请求
                           |
                           v
                    +-------------+
                    |   DNS 解析   |
                    +------+------+
                           | 返回最近节点 IP
                           v
    +----------------------------------------------+
    |                  CDN 边缘节点                  |
    |  +---------+  +---------+  +---------+       |
    |  | 北京节点 |  | 上海节点 |  | 广州节点 |  ...  |
    |  +----+----+  +----+----+  +----+----+       |
    +-------+------------+------------+------------+
            |            |            |
            |    缓存未命中时回源      |
            +------------+------------+
                         |
                         v
                   +-------------+
                   |   源站服务器  |
                   +-------------+
```

### CDN 配置策略

```typescript
// CDN 缓存策略配置
interface CDNConfig {
  // 静态资源缓存规则
  staticAssets: {
    pattern: string;
    maxAge: number;        // 缓存时间（秒）
    staleWhileRevalidate?: number;
    immutable?: boolean;   // 不可变资源（带 hash 的文件）
  }[];

  // 动态内容规则
  dynamicContent: {
    pattern: string;
    cache: boolean;
    maxAge?: number;
    varyHeaders?: string[];
  }[];

  // 安全配置
  security: {
    hotlinkProtection: boolean;
    allowedOrigins: string[];
    signedUrls?: boolean;
  };
}

const cdnConfig: CDNConfig = {
  staticAssets: [
    {
      // 带 hash 的 JS/CSS 文件，长期缓存
      pattern: '/_next/static/**/*',
      maxAge: 31536000,  // 1 年
      immutable: true
    },
    {
      // 图片资源
      pattern: '/images/**/*',
      maxAge: 86400,     // 1 天
      staleWhileRevalidate: 3600
    },
    {
      // 字体文件
      pattern: '/fonts/**/*',
      maxAge: 31536000,
      immutable: true
    }
  ],
  dynamicContent: [
    {
      // API 响应不缓存
      pattern: '/api/**/*',
      cache: false
    },
    {
      // 商品列表页，短时间缓存
      pattern: '/products',
      cache: true,
      maxAge: 60,
      varyHeaders: ['Accept-Language', 'Accept-Encoding']
    },
    {
      // 用户个人页面不缓存
      pattern: '/user/**/*',
      cache: false
    }
  ],
  security: {
    hotlinkProtection: true,
    allowedOrigins: ['https://example.com', 'https://www.example.com'],
    signedUrls: true
  }
};
```

### 签名 URL（保护私有内容）

```typescript
import crypto from 'crypto';

class CDNUrlSigner {
  constructor(
    private readonly secretKey: string,
    private readonly cdnDomain: string
  ) {}

  generateSignedUrl(
    path: string,
    expiresIn: number = 3600  // 默认1小时
  ): string {
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const stringToSign = `${path}${expires}${this.secretKey}`;

    const signature = crypto
      .createHash('md5')
      .update(stringToSign)
      .digest('hex');

    return `https://${this.cdnDomain}${path}?expires=${expires}&signature=${signature}`;
  }

  verifySignature(path: string, expires: number, signature: string): boolean {
    // 检查是否过期
    if (expires < Math.floor(Date.now() / 1000)) {
      return false;
    }

    // 验证签名
    const expectedSignature = crypto
      .createHash('md5')
      .update(`${path}${expires}${this.secretKey}`)
      .digest('hex');

    return signature === expectedSignature;
  }
}

// 使用示例
const signer = new CDNUrlSigner(process.env.CDN_SECRET!, 'cdn.example.com');

// 生成私有视频的签名 URL
const videoUrl = signer.generateSignedUrl('/videos/premium-content.mp4', 7200);
// https://cdn.example.com/videos/premium-content.mp4?expires=1699999999&signature=abc123
```

### 边缘计算（Edge Computing）

```typescript
// Cloudflare Worker 示例：边缘 A/B 测试
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 获取或生成用户标识
    const userId = request.headers.get('X-User-ID') ||
                   crypto.randomUUID();

    // 在边缘决定用户分组
    const variant = this.getVariant(userId);

    // 修改请求，添加变体信息
    const modifiedRequest = new Request(request, {
      headers: {
        ...Object.fromEntries(request.headers),
        'X-AB-Variant': variant
      }
    });

    // 转发到对应的源站
    const origin = variant === 'A'
      ? 'https://origin-a.example.com'
      : 'https://origin-b.example.com';

    const response = await fetch(origin + url.pathname, modifiedRequest);

    // 添加响应头，便于分析
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set('X-AB-Variant', variant);
    modifiedResponse.headers.set('X-Served-By', 'edge');

    return modifiedResponse;
  },

  getVariant(userId: string): 'A' | 'B' {
    // 简单哈希决定分组（50/50）
    const hash = this.hashCode(userId);
    return hash % 2 === 0 ? 'A' : 'B';
  },

  hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
};
```

---

## 真实案例分析

### 案例1：电商秒杀系统

秒杀系统需要应对瞬时高并发，是可扩展性设计的典型场景。

```
秒杀系统架构：

                    用户请求
                        |
                        v
                 +-------------+
                 |   CDN/WAF   |  <- 静态页面缓存 + 恶意流量过滤
                 +------+------+
                        |
                        v
                 +-------------+
                 |  API 网关   |  <- 限流 + 熔断 + 鉴权
                 +------+------+
                        |
           +------------+------------+
           v            v            v
     +---------+  +---------+  +---------+
     | 秒杀服务 |  | 秒杀服务 |  | 秒杀服务 |  <- 无状态，水平扩展
     +----+----+  +----+----+  +----+----+
          |            |            |
          +------------+------------+
                       |
                       v
                +-------------+
                |    Redis    |  <- 库存预扣减 + 分布式锁
                |   Cluster   |
                +------+------+
                       |
                       v
                +-------------+
                |  消息队列    |  <- 异步处理订单
                |   (Kafka)   |
                +------+------+
                       |
                       v
                +-------------+
                |  订单服务    |  <- 异步创建订单
                +-------------+
```

```typescript
// 秒杀服务实现
class SeckillService {
  constructor(
    private readonly redis: Redis,
    private readonly kafka: KafkaProducer,
    private readonly rateLimiter: RateLimiter
  ) {}

  async seckill(userId: string, productId: string): Promise<SeckillResult> {
    // 1. 限流检查（令牌桶）
    const allowed = await this.rateLimiter.tryAcquire(userId);
    if (!allowed) {
      return { success: false, reason: 'RATE_LIMITED' };
    }

    // 2. 检查是否已抢购
    const hasPurchased = await this.redis.sismember(
      `seckill:${productId}:users`,
      userId
    );
    if (hasPurchased) {
      return { success: false, reason: 'ALREADY_PURCHASED' };
    }

    // 3. 使用 Lua 脚本原子性扣减库存
    const luaScript = `
      local stock = tonumber(redis.call('GET', KEYS[1]))
      if stock and stock > 0 then
        redis.call('DECR', KEYS[1])
        redis.call('SADD', KEYS[2], ARGV[1])
        return 1
      else
        return 0
      end
    `;

    const result = await this.redis.eval(
      luaScript,
      2,
      `seckill:${productId}:stock`,
      `seckill:${productId}:users`,
      userId
    );

    if (result === 0) {
      return { success: false, reason: 'SOLD_OUT' };
    }

    // 4. 发送消息创建订单（异步）
    const orderId = generateOrderId();
    await this.kafka.send({
      topic: 'seckill-orders',
      messages: [{
        key: orderId,
        value: JSON.stringify({
          orderId,
          userId,
          productId,
          timestamp: Date.now()
        })
      }]
    });

    return {
      success: true,
      orderId,
      message: '抢购成功，订单创建中'
    };
  }

  // 秒杀活动初始化
  async initSeckill(productId: string, stock: number): Promise<void> {
    // 预热库存到 Redis
    await this.redis.set(`seckill:${productId}:stock`, stock);
    await this.redis.del(`seckill:${productId}:users`);
  }
}

// 令牌桶限流器
class TokenBucketRateLimiter implements RateLimiter {
  constructor(
    private readonly redis: Redis,
    private readonly rate: number,      // 每秒生成令牌数
    private readonly capacity: number   // 桶容量
  ) {}

  async tryAcquire(key: string): Promise<boolean> {
    const now = Date.now();
    const luaScript = `
      local tokens_key = KEYS[1]
      local timestamp_key = KEYS[2]
      local rate = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local last_tokens = tonumber(redis.call('GET', tokens_key))
      local last_refreshed = tonumber(redis.call('GET', timestamp_key))

      if last_tokens == nil then
        last_tokens = capacity
        last_refreshed = now
      end

      local delta = math.max(0, now - last_refreshed)
      local new_tokens = math.min(capacity, last_tokens + delta * rate / 1000)

      if new_tokens < 1 then
        return 0
      end

      new_tokens = new_tokens - 1
      redis.call('SET', tokens_key, new_tokens)
      redis.call('SET', timestamp_key, now)
      redis.call('EXPIRE', tokens_key, 60)
      redis.call('EXPIRE', timestamp_key, 60)

      return 1
    `;

    const result = await this.redis.eval(
      luaScript,
      2,
      `ratelimit:${key}:tokens`,
      `ratelimit:${key}:timestamp`,
      this.rate,
      this.capacity,
      now
    );

    return result === 1;
  }
}
```

### 案例2：社交网络动态推送

社交网络需要实时推送动态给大量关注者，是典型的读多写少场景。

```
推送系统架构（推模式 vs 拉模式混合）：

发布动态流程：
+---------+      +-------------+      +-------------+
|  用户A  | -->  |  动态服务    | -->  |  消息队列   |
+---------+      +-------------+      +------+------+
                                              |
                       +----------------------+----------------------+
                       |                                              |
                       v                                              v
              +-----------------+                           +-----------------+
              |   粉丝推送服务   |                           |   大V特殊处理   |
              | (扇出到粉丝收件箱)|                           |  (不主动推送)   |
              +--------+--------+                           +-----------------+
                       |
         +-------------+-------------+
         v             v             v
    +---------+   +---------+   +---------+
    | 用户B   |   | 用户C   |   | 用户D   |
    | 收件箱  |   | 收件箱  |   | 收件箱  |
    +---------+   +---------+   +---------+

读取动态流程（混合模式）：
+---------+      +-------------+      +--------------------------------+
|  用户B  | -->  |  Timeline   | -->  | 1. 读取收件箱（推模式的结果）    |
+---------+      |    服务     |      | 2. 拉取关注大V的最新动态        |
                 +-------------+      | 3. 合并排序后返回               |
                                      +--------------------------------+
```

```typescript
// 动态推送服务
class FeedService {
  constructor(
    private readonly redis: Redis,
    private readonly postRepository: PostRepository,
    private readonly followerRepository: FollowerRepository,
    private readonly messageQueue: MessageQueue
  ) {}

  // 发布动态
  async publishPost(userId: string, content: string): Promise<Post> {
    // 1. 保存动态
    const post = await this.postRepository.create({
      userId,
      content,
      createdAt: new Date()
    });

    // 2. 获取粉丝数量
    const followerCount = await this.followerRepository.getFollowerCount(userId);

    if (followerCount > 10000) {
      // 大V：不主动推送，用户拉取时再聚合
      await this.markAsInfluencer(userId, post.id);
    } else {
      // 普通用户：推送到粉丝收件箱
      await this.messageQueue.publish('fan-out', {
        postId: post.id,
        userId,
        timestamp: post.createdAt.getTime()
      });
    }

    return post;
  }

  // 粉丝扇出（消费者）
  async fanOutToFollowers(postId: string, userId: string, timestamp: number): Promise<void> {
    const followers = await this.followerRepository.getFollowers(userId);

    // 批量写入粉丝收件箱
    const pipeline = this.redis.pipeline();
    for (const followerId of followers) {
      pipeline.zadd(
        `inbox:${followerId}`,
        timestamp,
        postId
      );
      // 保持收件箱大小合理
      pipeline.zremrangebyrank(`inbox:${followerId}`, 0, -1001);
    }

    await pipeline.exec();
  }

  // 获取用户 Timeline
  async getTimeline(userId: string, limit: number = 20): Promise<Post[]> {
    // 1. 获取收件箱中的动态ID（推模式）
    const inboxPostIds = await this.redis.zrevrange(
      `inbox:${userId}`,
      0,
      limit - 1
    );

    // 2. 获取关注的大V列表
    const followingInfluencers = await this.getFollowingInfluencers(userId);

    // 3. 拉取大V的最新动态
    const influencerPosts = await this.pullInfluencerPosts(
      followingInfluencers,
      limit
    );

    // 4. 合并两个来源
    const allPostIds = [...new Set([...inboxPostIds, ...influencerPosts])];

    // 5. 批量获取动态详情
    const posts = await this.postRepository.findByIds(allPostIds);

    // 6. 按时间排序
    return posts.sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    ).slice(0, limit);
  }

  private async pullInfluencerPosts(
    influencerIds: string[],
    limit: number
  ): Promise<string[]> {
    if (influencerIds.length === 0) return [];

    const pipeline = this.redis.pipeline();
    for (const influencerId of influencerIds) {
      pipeline.zrevrange(`posts:${influencerId}`, 0, limit - 1);
    }

    const results = await pipeline.exec();
    return results.flatMap(([err, postIds]) => postIds || []);
  }
}
```

### 案例3：实时数据分析平台

处理海量实时数据，需要兼顾吞吐量和延迟。

```
Lambda 架构：

                        数据源
                          |
                          v
                   +-------------+
                   |   Kafka     |
                   | (数据收集)   |
                   +------+------+
                          |
            +-------------+-------------+
            |                           |
            v                           v
    +---------------+           +---------------+
    |   批处理层     |           |   实时处理层   |
    |  (Spark)      |           |   (Flink)     |
    |               |           |               |
    |  T+1 全量计算  |           |  毫秒级延迟   |
    +-------+-------+           +-------+-------+
            |                           |
            v                           v
    +---------------+           +---------------+
    |  批处理视图    |           |  实时视图     |
    | (HDFS/Hive)   |           |   (Redis)    |
    +-------+-------+           +-------+-------+
            |                           |
            +-----------+---------------+
                        |
                        v
                 +-------------+
                 |   查询层    |
                 | (API 服务)  |
                 +-------------+
```

```typescript
// 实时统计服务
class RealTimeAnalytics {
  constructor(
    private readonly redis: Redis,
    private readonly kafka: KafkaConsumer
  ) {}

  // 实时消费事件
  async startProcessing(): Promise<void> {
    await this.kafka.subscribe('user-events');

    for await (const message of this.kafka) {
      const event = JSON.parse(message.value.toString());
      await this.processEvent(event);
    }
  }

  private async processEvent(event: UserEvent): Promise<void> {
    const { eventType, userId, productId, timestamp } = event;
    const dateKey = this.getDateKey(timestamp);
    const hourKey = this.getHourKey(timestamp);

    const pipeline = this.redis.pipeline();

    // 1. 更新实时 PV/UV
    pipeline.incr(`stats:${dateKey}:pv`);
    pipeline.pfadd(`stats:${dateKey}:uv`, userId);

    // 2. 更新小时级统计
    pipeline.incr(`stats:${hourKey}:pv`);
    pipeline.pfadd(`stats:${hourKey}:uv`, userId);

    // 3. 更新商品热度
    if (eventType === 'view') {
      pipeline.zincrby(`hot:products:${dateKey}`, 1, productId);
    }

    // 4. 更新用户行为序列
    pipeline.lpush(`user:${userId}:events`, JSON.stringify(event));
    pipeline.ltrim(`user:${userId}:events`, 0, 99); // 保留最近100条

    // 5. 更新漏斗统计
    pipeline.hincrby(`funnel:${dateKey}`, eventType, 1);

    await pipeline.exec();

    // 6. 实时告警检查
    await this.checkAlerts(event);
  }

  // 查询实时统计
  async getRealTimeStats(date: string): Promise<Stats> {
    const [pv, uvCount, hotProducts, funnel] = await Promise.all([
      this.redis.get(`stats:${date}:pv`),
      this.redis.pfcount(`stats:${date}:uv`),
      this.redis.zrevrange(`hot:products:${date}`, 0, 9, 'WITHSCORES'),
      this.redis.hgetall(`funnel:${date}`)
    ]);

    return {
      pv: parseInt(pv || '0'),
      uv: uvCount,
      hotProducts: this.parseHotProducts(hotProducts),
      funnel: this.parseFunnel(funnel)
    };
  }

  // 实时告警
  private async checkAlerts(event: UserEvent): Promise<void> {
    // 检查错误率
    if (event.eventType === 'error') {
      const windowKey = `errors:${Math.floor(Date.now() / 60000)}`; // 1分钟窗口
      const errorCount = await this.redis.incr(windowKey);
      await this.redis.expire(windowKey, 120);

      if (errorCount > 100) {
        await this.sendAlert({
          type: 'HIGH_ERROR_RATE',
          message: `Error count exceeded threshold: ${errorCount}/min`,
          timestamp: Date.now()
        });
      }
    }
  }
}

// 滑动窗口计数器
class SlidingWindowCounter {
  constructor(
    private readonly redis: Redis,
    private readonly windowSize: number,  // 窗口大小（毫秒）
    private readonly precision: number    // 精度（毫秒）
  ) {}

  async increment(key: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - this.windowSize;
    const bucket = Math.floor(now / this.precision);

    const pipeline = this.redis.pipeline();

    // 增加当前桶计数
    pipeline.hincrby(key, bucket.toString(), 1);

    // 清理过期桶
    pipeline.hkeys(key);

    const results = await pipeline.exec();
    const allBuckets = results[1][1] as string[];

    // 删除窗口外的桶
    const expiredBuckets = allBuckets.filter(
      b => parseInt(b) * this.precision < windowStart
    );

    if (expiredBuckets.length > 0) {
      await this.redis.hdel(key, ...expiredBuckets);
    }

    // 计算窗口内总计数
    const counts = await this.redis.hgetall(key);
    return Object.entries(counts)
      .filter(([bucket]) => parseInt(bucket) * this.precision >= windowStart)
      .reduce((sum, [, count]) => sum + parseInt(count), 0);
  }
}
```

---

## 面试要点

### 水平扩展和垂直扩展的区别是什么？各有什么优缺点？

**答**：
- **垂直扩展**：增加单机资源（CPU、内存等）。优点是简单、无分布式复杂性；缺点是有硬件上限、成本非线性增长、单点故障。
- **水平扩展**：增加服务器节点数量。优点是理论无上限、成本线性增长、高可用；缺点是架构复杂、需要考虑分布式问题。
- 实际建议采用混合策略：先垂直扩展到合理规格，再水平扩展。

### 什么是无状态设计？为什么它对可扩展性重要？

**答**：无状态设计是指服务器不保存客户端会话状态，每个请求都包含处理该请求所需的全部信息。重要性：
- 请求可以被任意节点处理，便于负载均衡
- 节点可以随时增减，便于弹性扩展
- 单节点故障不影响用户会话

实现方式：使用 JWT 替代 Session、状态外部化到 Redis、请求携带必要上下文。

### 缓存穿透、缓存击穿、缓存雪崩分别是什么？如何解决？

**答**：
- **缓存穿透**：查询不存在的数据。解决：布隆过滤器预检、缓存空值
- **缓存击穿**：热点 key 过期瞬间大量请求。解决：互斥锁、永不过期+后台更新
- **缓存雪崩**：大量缓存同时过期。解决：过期时间加随机偏移、多级缓存、熔断降级

### 数据库如何进行水平扩展？

**答**：
- **读写分离**：主库写、从库读，适合读多写少场景
- **垂直分库**：按业务拆分不同数据库
- **水平分表**：按某个维度（如用户ID）将数据分散到多个表/库
- **使用分布式数据库**：如 TiDB、CockroachDB

分片策略选择：范围分片（时间有序）、哈希分片（均匀分布）、一致性哈希（便于扩容）。

### 消息队列在可扩展系统中的作用是什么？

**答**：
- **削峰填谷**：平滑突发流量
- **异步解耦**：生产者和消费者独立扩展
- **可靠传递**：消息持久化保证不丢失
- **流量控制**：消费者按自己的速度处理

常见场景：订单处理、日志收集、通知推送、数据同步。

### 如何设计一个秒杀系统？

**答**：关键点：
1. **前端**：静态页面 CDN 缓存、按钮防重复点击、答题验证分散流量
2. **网关**：限流（令牌桶）、熔断、恶意请求过滤
3. **服务层**：无状态设计、Redis 预扣库存（Lua 脚本保证原子性）
4. **异步处理**：消息队列异步创建订单、库存实际扣减
5. **兜底策略**：降级、限流、熔断，保护核心服务

### CDN 的作用是什么？哪些内容适合放 CDN？

**答**：CDN 通过边缘节点缓存，降低延迟、减轻源站压力。

适合放 CDN：
- 静态资源：JS、CSS、图片、视频
- 不经常变化的页面
- 可公开的内容

不适合放 CDN：
- 用户个性化内容
- 实时性要求高的数据
- 需要认证的私有资源（除非使用签名 URL）

### 如何保证分布式系统的数据一致性？

**答**：
- **强一致性**：分布式事务（2PC、Saga）、Raft 共识
- **最终一致性**：消息队列+重试、定时任务对账、事件溯源
- **读己之写**：写后读主库、版本号校验
- **会话一致性**：粘性会话（不推荐）、客户端缓存

权衡：CAP 定理决定了无法同时满足一致性、可用性、分区容错性，需根据业务场景取舍。

---

## 总结

可扩展性是现代分布式系统设计的核心考量。通过本文，我们学习了：

1. **扩展方式**：垂直扩展 vs 水平扩展，实际中常采用混合策略
2. **无状态设计**：是水平扩展的基础，通过 JWT、外部化存储等实现
3. **缓存策略**：多级缓存架构，以及穿透、击穿、雪崩的解决方案
4. **数据库扩展**：读写分离、分库分表、连接池优化
5. **异步处理**：消息队列、事件驱动、任务队列
6. **CDN**：静态资源加速、边缘计算

核心原则：

> **设计可扩展系统的关键是识别瓶颈并将其分散化。**

可扩展性不是一蹴而就的，而是随着业务发展逐步演进的。关键是在架构设计之初就考虑扩展性，避免后期的大规模重构。

---

## 参考资源

- 《Designing Data-Intensive Applications》 - Martin Kleppmann
- 《System Design Interview》 - Alex Xu
- 《Web Scalability for Startup Engineers》 - Artur Ejsmont
- 《Release It!》 - Michael Nygard
- 《大型网站技术架构》 - 李智慧
