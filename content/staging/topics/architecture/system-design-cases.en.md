---
title: System Design Case Studies
description: Master large-scale system design methods through classic system design cases
track: architecture
section: system-design
difficulty: advanced
tags:
  - System Design
  - Case Study
  - Architecture
  - Interview
status: imported
origin: old/src/content/docs/architecture/system-design-cases.en.md
divergence: 0.228
issues: []
legacy:
  category: Architecture
  subcategory: System Design
  order: 10
  lastUpdated: 2026-01-07
---

System design is an important criterion for evaluating senior engineers' capabilities. By analyzing classic system design cases, we can master the design principles of large-scale distributed systems, solutions to common problems, and trade-offs in technology selection. We'll analyze multiple classic system design cases to help you develop systematic design thinking.

## System Design Interview Methodology

### The RADIO Framework

In system design interviews, we recommend using the RADIO framework to organize your thoughts and answers:

```
+-------------------------------------------------------------------+
|                        RADIO Framework                             |
+-------------------------------------------------------------------+
|  R - Requirements (Clarification)                                  |
|      |-- Functional Requirements: core features, user scenarios    |
|      +-- Non-functional Requirements: QPS, latency, availability   |
+-------------------------------------------------------------------+
|  A - Architecture (High-Level Design)                              |
|      |-- Core component identification                             |
|      +-- Component interaction relationships                       |
+-------------------------------------------------------------------+
|  D - Data Model (Data Design)                                      |
|      |-- Database selection                                        |
|      +-- Schema design                                             |
+-------------------------------------------------------------------+
|  I - Interface (API Design)                                        |
|      |-- API design                                                |
|      +-- Protocol selection                                        |
+-------------------------------------------------------------------+
|  O - Optimization (Optimization & Scaling)                         |
|      |-- Performance optimization                                  |
|      |-- Scalability                                               |
|      +-- Fault tolerance and high availability                     |
+-------------------------------------------------------------------+
```

### Quantitative Estimation

Before starting the design, you must quantify the system scale:

```typescript
// System scale estimation example
interface SystemEstimation {
  // User scale
  dailyActiveUsers: number;      // Daily Active Users (DAU)
  monthlyActiveUsers: number;    // Monthly Active Users (MAU)

  // Traffic estimation
  readQPS: number;               // Read requests per second
  writeQPS: number;              // Write requests per second
  peakMultiplier: number;        // Peak traffic multiplier

  // Storage estimation
  dataPerRecord: number;         // Data size per record (bytes)
  recordsPerDay: number;         // New records per day
  retentionPeriod: number;       // Data retention period (years)

  // Bandwidth estimation
  inboundBandwidth: number;      // Inbound bandwidth (Mbps)
  outboundBandwidth: number;     // Outbound bandwidth (Mbps)
}

// Calculation example: Social media platform
const estimation: SystemEstimation = {
  dailyActiveUsers: 100_000_000,      // 100M DAU
  monthlyActiveUsers: 500_000_000,    // 500M MAU
  readQPS: 100_000,                   // 100K read QPS
  writeQPS: 10_000,                   // 10K write QPS
  peakMultiplier: 3,                  // Peak is 3x average
  dataPerRecord: 500,                 // 500 bytes/record
  recordsPerDay: 50_000_000,          // 50M new records per day
  retentionPeriod: 5,                 // 5 years retention
  inboundBandwidth: 500,              // 500 Mbps inbound
  outboundBandwidth: 5000,            // 5 Gbps outbound
};

// Storage capacity calculation
const dailyStorage = estimation.dataPerRecord * estimation.recordsPerDay;
// = 500 * 50,000,000 = 25 GB/day
const yearlyStorage = dailyStorage * 365;
// = 25 * 365 = 9.125 TB/year
const totalStorage = yearlyStorage * estimation.retentionPeriod;
// = 9.125 * 5 = 45.625 TB (5-year total storage)
```

### Quick Reference Numbers

The following numbers are very useful when estimating:

| Metric | Value | Description |
|--------|-------|-------------|
| L1 cache access | 0.5 ns | CPU L1 cache |
| L2 cache access | 7 ns | CPU L2 cache |
| Memory access | 100 ns | RAM random access |
| SSD random read | 150 us | Solid state drive |
| HDD random read | 10 ms | Mechanical disk seek |
| Intra-datacenter RTT | 0.5 ms | Within data center |
| Cross-region RTT | 100 ms | Cross-region |
| 1 GB memory sequential read | 250 us | Memory bandwidth ~4 GB/s |
| 1 GB SSD sequential read | 1 ms | SSD bandwidth ~1 GB/s |

## URL Shortener System Design

### Requirements Analysis

**Functional Requirements:**
- Generate short URLs from long URLs
- Redirect to original URL when accessing short URL
- Support custom short URLs (optional)
- Support link expiration settings

**Non-Functional Requirements:**
- High availability: 99.99%
- Low latency: redirect latency < 100ms
- Short URLs should be unpredictable (security)

**Scale Estimation:**
```
- 100 million short URLs generated per day
- Read/Write ratio: 100:1
- Write QPS: 100M / 86400 = 1200
- Read QPS: 1200 * 100 = 120,000
- Peak read QPS: 120,000 * 3 = 360,000
- ~500 bytes per record
- 5-year storage: 500 * 100M * 365 * 5 = 90 TB
```

### High-Level Architecture

```
                        +-------------------+
                        |   DNS + CDN       |
                        +---------+---------+
                                  |
                        +---------v---------+
                        |  Load Balancer    |
                        +---------+---------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
      +-------v-------+   +-------v-------+   +-------v-------+
      |  API Server   |   |  API Server   |   |  API Server   |
      |   (Write)     |   |   (Read)      |   |   (Read)      |
      +-------+-------+   +-------+-------+   +-------+-------+
              |                   |                   |
              |           +-------v-------+           |
              |           |    Redis      |           |
              |           |   (Cache)     |           |
              |           +-------+-------+           |
              |                   |                   |
              +-------------------+-------------------+
                                  |
                         +--------v--------+
                         |   MySQL Cluster |
                         |  (Primary-Replica)|
                         +-----------------+
```

### Core Algorithm: Short URL Generation

**Option 1: Hash Algorithm**

```typescript
import crypto from 'crypto';

class HashBasedShortener {
  private readonly BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  generateShortUrl(longUrl: string): string {
    // Generate hash using MD5
    const hash = crypto.createHash('md5').update(longUrl).digest('hex');

    // Take first 43 bits (~7 Base62 characters)
    const hashInt = BigInt('0x' + hash.substring(0, 11));

    // Convert to Base62
    return this.toBase62(hashInt, 7);
  }

  private toBase62(num: bigint, length: number): string {
    let result = '';
    const base = BigInt(62);

    while (num > 0 && result.length < length) {
      result = this.BASE62[Number(num % base)] + result;
      num = num / base;
    }

    // Pad to required length
    while (result.length < length) {
      result = '0' + result;
    }

    return result;
  }
}
```

**Option 2: Distributed ID Generator (Recommended)**

```typescript
// Distributed ID generation based on Snowflake
class SnowflakeIdGenerator {
  private readonly EPOCH = 1609459200000n; // 2021-01-01 00:00:00
  private readonly WORKER_ID_BITS = 10n;
  private readonly SEQUENCE_BITS = 12n;

  private readonly MAX_WORKER_ID = (1n << this.WORKER_ID_BITS) - 1n;
  private readonly MAX_SEQUENCE = (1n << this.SEQUENCE_BITS) - 1n;

  private readonly WORKER_ID_SHIFT = this.SEQUENCE_BITS;
  private readonly TIMESTAMP_SHIFT = this.SEQUENCE_BITS + this.WORKER_ID_BITS;

  private workerId: bigint;
  private sequence = 0n;
  private lastTimestamp = -1n;

  constructor(workerId: number) {
    if (workerId < 0 || BigInt(workerId) > this.MAX_WORKER_ID) {
      throw new Error(`Worker ID must be between 0 and ${this.MAX_WORKER_ID}`);
    }
    this.workerId = BigInt(workerId);
  }

  nextId(): bigint {
    let timestamp = this.currentTimestamp();

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // Wait for next millisecond
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    return ((timestamp - this.EPOCH) << this.TIMESTAMP_SHIFT) |
           (this.workerId << this.WORKER_ID_SHIFT) |
           this.sequence;
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }
}

// URL Shortener Service Implementation
class UrlShortenerService {
  private readonly BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private idGenerator: SnowflakeIdGenerator;

  constructor(workerId: number) {
    this.idGenerator = new SnowflakeIdGenerator(workerId);
  }

  createShortUrl(longUrl: string): string {
    const id = this.idGenerator.nextId();
    return this.encode(id);
  }

  private encode(id: bigint): string {
    let result = '';
    const base = 62n;

    while (id > 0n) {
      result = this.BASE62[Number(id % base)] + result;
      id = id / base;
    }

    return result || '0';
  }

  decode(shortUrl: string): bigint {
    let result = 0n;
    const base = 62n;

    for (const char of shortUrl) {
      result = result * base + BigInt(this.BASE62.indexOf(char));
    }

    return result;
  }
}
```

### Database Design

```sql
-- URL mapping table
CREATE TABLE url_mappings (
    id BIGINT PRIMARY KEY,              -- Snowflake ID
    short_code VARCHAR(10) NOT NULL,    -- Short code
    long_url VARCHAR(2048) NOT NULL,    -- Original URL
    user_id BIGINT,                     -- Creator user (optional)
    expires_at TIMESTAMP,               -- Expiration time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_short_code (short_code),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Analytics table (optional)
CREATE TABLE url_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    short_code VARCHAR(10) NOT NULL,
    visitor_ip VARCHAR(45),
    user_agent VARCHAR(512),
    referer VARCHAR(2048),
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_short_code_time (short_code, visited_at)
) ENGINE=InnoDB;
```

### Caching Strategy

```typescript
class UrlShortenerWithCache {
  private redis: Redis;
  private db: Database;
  private readonly CACHE_TTL = 86400; // 24 hours

  async getLongUrl(shortCode: string): Promise<string | null> {
    // 1. Check cache first
    const cached = await this.redis.get(`url:${shortCode}`);
    if (cached) {
      return cached;
    }

    // 2. Cache miss, query database
    const result = await this.db.query(
      'SELECT long_url FROM url_mappings WHERE short_code = ? AND (expires_at IS NULL OR expires_at > NOW())',
      [shortCode]
    );

    if (result.length === 0) {
      // Cache null value to prevent cache penetration
      await this.redis.setex(`url:${shortCode}`, 60, 'NULL');
      return null;
    }

    const longUrl = result[0].long_url;

    // 3. Write to cache
    await this.redis.setex(`url:${shortCode}`, this.CACHE_TTL, longUrl);

    return longUrl;
  }

  async createShortUrl(longUrl: string): Promise<string> {
    // 1. Check if already exists (deduplication)
    const existing = await this.redis.get(`reverse:${longUrl}`);
    if (existing) {
      return existing;
    }

    // 2. Generate new short URL
    const shortCode = this.generateShortCode();

    // 3. Write to database
    await this.db.execute(
      'INSERT INTO url_mappings (short_code, long_url) VALUES (?, ?)',
      [shortCode, longUrl]
    );

    // 4. Write to cache
    await Promise.all([
      this.redis.setex(`url:${shortCode}`, this.CACHE_TTL, longUrl),
      this.redis.setex(`reverse:${longUrl}`, this.CACHE_TTL, shortCode),
    ]);

    return shortCode;
  }
}
```

## Instant Messaging System Design

### Requirements Analysis

**Functional Requirements:**
- One-on-one chat
- Group chat (up to 500 members)
- Message status (sent, delivered, read)
- Offline message storage
- Message history
- File/image transfer

**Non-Functional Requirements:**
- Message latency < 200ms
- 99.99% availability
- Support 50 million DAU
- No message loss or duplication

### High-Level Architecture

```
+-----------------------------------------------------------------------------+
|                        Instant Messaging System Architecture                 |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +---------+     +-------------+     +---------------------------------+    |
|  | Client  |---->| API Gateway |---->|         Service Layer           |    |
|  |  App    |     | (Auth/Route)|     |  +---------+   +-------------+  |    |
|  +---------+     +-------------+     |  | User    |   | Group       |  |    |
|       |                              |  | Service |   | Service     |  |    |
|       |                              |  +---------+   +-------------+  |    |
|       |                              |  +---------+   +-------------+  |    |
|       |                              |  | Message |   | Presence    |  |    |
|       |                              |  | Service |   | Service     |  |    |
|       |                              |  +---------+   +-------------+  |    |
|       |                              +---------------------------------+    |
|       |                                            |                        |
|       |          +----------------------------------------------------+    |
|       |          |                                 v                   |    |
|       |     +----v----+  +-------------+  +-------------+              |    |
|       +---->|WebSocket|  |   Kafka     |  |   Redis     |              |    |
|             | Gateway |--|  (Message   |--|  (Session   |              |    |
|             +---------+  |   Queue)    |  |   State)    |              |    |
|                          +-------------+  +-------------+              |    |
|                                  |                                     |    |
|                          +-------v-------+                             |    |
|                          |   MySQL/      |                             |    |
|                          |   Cassandra   |                             |    |
|                          |  (Storage)    |                             |    |
|                          +---------------+                             |    |
+-----------------------------------------------------------------------------+
```

### WebSocket Connection Management

```typescript
// WebSocket Gateway Service
class WebSocketGateway {
  private connections: Map<string, WebSocket> = new Map();
  private redis: Redis;
  private kafka: KafkaProducer;

  constructor(redis: Redis, kafka: KafkaProducer) {
    this.redis = redis;
    this.kafka = kafka;
  }

  async onConnection(ws: WebSocket, userId: string): Promise<void> {
    // 1. Store connection mapping
    this.connections.set(userId, ws);

    // 2. Register user's gateway node in Redis
    const gatewayId = process.env.GATEWAY_ID;
    await this.redis.hset('user_gateway', userId, gatewayId);

    // 3. Update user online status
    await this.redis.sadd('online_users', userId);

    // 4. Push offline messages
    await this.pushOfflineMessages(userId, ws);

    // 5. Notify friends of online status
    await this.notifyPresenceChange(userId, 'online');

    console.log(`User ${userId} connected to gateway ${gatewayId}`);
  }

  async onDisconnect(userId: string): Promise<void> {
    // 1. Remove connection
    this.connections.delete(userId);

    // 2. Clear Redis mapping
    await this.redis.hdel('user_gateway', userId);
    await this.redis.srem('online_users', userId);

    // 3. Notify friends of offline status
    await this.notifyPresenceChange(userId, 'offline');
  }

  async sendMessage(targetUserId: string, message: Message): Promise<void> {
    // 1. Check if target user is on this gateway
    const localConnection = this.connections.get(targetUserId);
    if (localConnection) {
      localConnection.send(JSON.stringify(message));
      return;
    }

    // 2. Find target user's gateway
    const targetGateway = await this.redis.hget('user_gateway', targetUserId);
    if (targetGateway) {
      // Forward to target gateway via message queue
      await this.kafka.send('gateway_messages', {
        targetGateway,
        targetUserId,
        message,
      });
    } else {
      // User offline, store offline message
      await this.storeOfflineMessage(targetUserId, message);
    }
  }

  private async pushOfflineMessages(userId: string, ws: WebSocket): Promise<void> {
    const messages = await this.redis.lrange(`offline:${userId}`, 0, -1);
    for (const msg of messages) {
      ws.send(msg);
    }
    await this.redis.del(`offline:${userId}`);
  }

  private async storeOfflineMessage(userId: string, message: Message): Promise<void> {
    const key = `offline:${userId}`;
    await this.redis.rpush(key, JSON.stringify(message));
    // Set expiration to prevent unlimited accumulation
    await this.redis.expire(key, 7 * 24 * 60 * 60); // 7 days
  }
}
```

### Message Storage Design

```typescript
// Message data model
interface Message {
  messageId: string;         // Global unique message ID
  conversationId: string;    // Conversation ID
  senderId: string;          // Sender
  receiverId: string;        // Receiver (group ID for group chat)
  messageType: 'text' | 'image' | 'file' | 'voice';
  content: string;           // Message content or resource URL
  timestamp: number;         // Message timestamp
  status: 'sent' | 'delivered' | 'read';
  clientMessageId: string;   // Client message ID (for deduplication)
}

// Cassandra Schema Design (suitable for high-write scenarios)
/*
CREATE KEYSPACE im WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3
};

-- Partition by conversation, sort by time
CREATE TABLE messages (
    conversation_id text,
    message_id timeuuid,
    sender_id text,
    receiver_id text,
    message_type text,
    content text,
    status text,
    created_at timestamp,
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

-- Index by user, for querying user's conversations
CREATE TABLE user_conversations (
    user_id text,
    conversation_id text,
    last_message_id timeuuid,
    last_message_preview text,
    unread_count int,
    updated_at timestamp,
    PRIMARY KEY (user_id, updated_at, conversation_id)
) WITH CLUSTERING ORDER BY (updated_at DESC, conversation_id ASC);
*/

class MessageService {
  private cassandra: CassandraClient;
  private kafka: KafkaProducer;

  async sendMessage(message: Message): Promise<void> {
    // 1. Deduplication check
    const exists = await this.checkDuplicate(message.clientMessageId);
    if (exists) {
      return;
    }

    // 2. Generate server-side message ID
    message.messageId = this.generateMessageId();
    message.timestamp = Date.now();
    message.status = 'sent';

    // 3. Write to message queue (async persistence)
    await this.kafka.send('messages', {
      key: message.conversationId,
      value: message,
    });

    // 4. Push to receiver
    await this.pushToReceiver(message);
  }

  async getConversationHistory(
    conversationId: string,
    beforeMessageId?: string,
    limit: number = 50
  ): Promise<Message[]> {
    let query = `
      SELECT * FROM messages
      WHERE conversation_id = ?
    `;
    const params: any[] = [conversationId];

    if (beforeMessageId) {
      query += ` AND message_id < ?`;
      params.push(beforeMessageId);
    }

    query += ` ORDER BY message_id DESC LIMIT ?`;
    params.push(limit);

    return this.cassandra.execute(query, params);
  }
}
```

### Message Reliability Guarantee

```
Message sending flow (guaranteeing no loss, no duplication):

+--------+   1.Send Message  +--------+   2.Store Message  +--------+
| Client |------------------>| Server |------------------>| Queue  |
+--------+                   +--------+                   +--------+
    |                            |                            |
    |   3.ACK(Message ID)        |                            |
    |<---------------------------|                            |
    |                            |                            |
    |                            |   4.Consume Message        |
    |                            |<---------------------------|
    |                            |                            |
    |                            |   5.Persist to DB          |
    |                            |----------+                 |
    |                            |          |                 |
    |                            |<---------+                 |
    |                            |                            |
    |                            |   6.Push to Receiver       |
    |                            |--------------------------->|
    |                            |                            |
```

**Deduplication Mechanism:**
```typescript
class MessageDeduplication {
  private redis: Redis;
  private readonly DEDUP_TTL = 3600; // 1 hour

  async isDuplicate(clientMessageId: string): Promise<boolean> {
    const key = `dedup:${clientMessageId}`;
    const result = await this.redis.set(key, '1', 'NX', 'EX', this.DEDUP_TTL);
    return result === null; // If set fails, it already exists
  }
}
```

## Feed System Design

### Requirements Analysis

**Functional Requirements:**
- Users post updates
- Follow/unfollow other users
- View feed timeline of followed users
- Like, comment, repost

**Non-Functional Requirements:**
- Support 100 million DAU
- Feed retrieval latency < 500ms
- New content visible within 5 seconds
- Support users following tens of thousands of people

### Push vs Pull Model Comparison

```
+-------------------------------------------------------------------------+
|                    Push Model (Fanout-on-Write)                          |
+-------------------------------------------------------------------------+
|                                                                         |
|   User A posts update                                                   |
|        |                                                                |
|        v                                                                |
|   +---------+     +---------------------------------------------+       |
|   | Write DB|---->| Push to all followers' Feed queues          |       |
|   +---------+     |  Follower 1's Feed: [A's post, ...]         |       |
|                   |  Follower 2's Feed: [A's post, ...]         |       |
|                   |  Follower 3's Feed: [A's post, ...]         |       |
|                   |  ...                                         |       |
|                   +---------------------------------------------+       |
|                                                                         |
|   Pros: Fast reads (directly read from user's Feed queue)              |
|   Cons: Slow writes (celebrities need to push to millions of followers)|
|         Storage redundancy                                              |
|                                                                         |
+-------------------------------------------------------------------------+
|                    Pull Model (Fanout-on-Read)                           |
+-------------------------------------------------------------------------+
|                                                                         |
|   User B views Feed                                                     |
|        |                                                                |
|        v                                                                |
|   +-------------+     +---------------------------------------------+   |
|   |Get followings|---->| Pull latest updates from each followed user   |
|   +-------------+     |  and merge/sort                              |   |
|                       |  Following 1's posts: [...]                  |   |
|                       |  Following 2's posts: [...]                  |   |
|                       |  Following 3's posts: [...]                  |   |
|                       |  Merge + Sort = Final Feed                   |   |
|                       +---------------------------------------------+   |
|                                                                         |
|   Pros: Fast writes, no storage redundancy                             |
|   Cons: Slow reads (real-time aggregation from multiple sources)       |
|                                                                         |
+-------------------------------------------------------------------------+
|                    Hybrid (Push + Pull) - Recommended                    |
+-------------------------------------------------------------------------+
|                                                                         |
|   - Regular users (followers < 10000): Use push model                  |
|   - Celebrity users (followers > 10000): Use pull model                |
|   - Active users: Push model preferred                                  |
|   - Inactive users: Pull model (save storage)                          |
|                                                                         |
+-------------------------------------------------------------------------+
```

### System Architecture

```
                           +-----------------+
                           |   API Gateway   |
                           +--------+--------+
                                    |
           +------------------------+------------------------+
           |                        |                        |
    +------v------+          +------v------+          +------v------+
    | Post Service|          | Feed Service|          |Graph Service|
    | (Publish)   |          | (Get Feed)  |          | (Follow)    |
    +------+------+          +------+------+          +------+------+
           |                        |                        |
           |                 +------v------+                 |
           |                 |    Redis    |                 |
           |                 | (Feed Cache)|                 |
           |                 +-------------+                 |
           |                                                 |
    +------v-------------------------------------------------v------+
    |                        Message Queue (Kafka)                   |
    |                   +---------------------+                     |
    |                   | Feed Fanout Worker  |                     |
    |                   | (Async Push Feed)   |                     |
    |                   +---------------------+                     |
    +-------------------------------+-------------------------------+
                                    |
                           +--------v--------+
                           |     Database    |
                           |  Posts/Feeds    |
                           +-----------------+
```

### Core Implementation

```typescript
// Feed Service Core Implementation
class FeedService {
  private redis: Redis;
  private db: Database;
  private graphService: GraphService;

  private readonly FEED_CACHE_SIZE = 1000;
  private readonly BIG_V_THRESHOLD = 10000;

  // Get user Feed
  async getFeed(userId: string, cursor?: string, limit: number = 20): Promise<FeedItem[]> {
    // 1. Get pushed Feed from cache
    const pushedFeed = await this.getPushedFeed(userId, cursor, limit);

    // 2. Get list of celebrity followings
    const bigVFollowings = await this.getBigVFollowings(userId);

    if (bigVFollowings.length === 0) {
      return pushedFeed;
    }

    // 3. Real-time pull celebrity's latest posts
    const pulledFeed = await this.pullBigVPosts(bigVFollowings, cursor, limit);

    // 4. Merge and sort
    return this.mergeFeed(pushedFeed, pulledFeed, limit);
  }

  // Publish post
  async publishPost(userId: string, content: PostContent): Promise<Post> {
    // 1. Create post
    const post: Post = {
      id: this.generatePostId(),
      userId,
      content,
      createdAt: Date.now(),
      likeCount: 0,
      commentCount: 0,
    };

    // 2. Write to database
    await this.db.posts.insert(post);

    // 3. Update user's post list cache
    await this.redis.lpush(`user_posts:${userId}`, JSON.stringify(post));
    await this.redis.ltrim(`user_posts:${userId}`, 0, this.FEED_CACHE_SIZE - 1);

    // 4. Determine if push is needed
    const followerCount = await this.graphService.getFollowerCount(userId);

    if (followerCount < this.BIG_V_THRESHOLD) {
      // Regular user: async push to all followers
      await this.queueFanout(post);
    }
    // Celebrity user: no push, followers pull in real-time

    return post;
  }

  // Async Fanout Worker
  async processFanout(post: Post): Promise<void> {
    const followers = await this.graphService.getFollowers(post.userId);

    // Batch processing to avoid processing too many at once
    const batchSize = 1000;
    for (let i = 0; i < followers.length; i += batchSize) {
      const batch = followers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(followerId => this.pushToUserFeed(followerId, post))
      );
    }
  }

  private async pushToUserFeed(userId: string, post: Post): Promise<void> {
    const key = `feed:${userId}`;
    const feedItem = JSON.stringify({
      postId: post.id,
      userId: post.userId,
      createdAt: post.createdAt,
    });

    await this.redis.zadd(key, post.createdAt, feedItem);
    await this.redis.zremrangebyrank(key, 0, -this.FEED_CACHE_SIZE - 1);
  }

  private async getPushedFeed(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FeedItem[]> {
    const key = `feed:${userId}`;
    const maxScore = cursor ? parseInt(cursor) - 1 : '+inf';

    const items = await this.redis.zrevrangebyscore(
      key, maxScore, '-inf', 'LIMIT', 0, limit
    );

    return items.map(item => JSON.parse(item));
  }

  private async pullBigVPosts(
    bigVIds: string[],
    cursor?: string,
    limit: number = 20
  ): Promise<FeedItem[]> {
    const allPosts: FeedItem[] = [];

    await Promise.all(
      bigVIds.map(async (bigVId) => {
        const posts = await this.redis.lrange(`user_posts:${bigVId}`, 0, limit - 1);
        posts.forEach(post => {
          const parsed = JSON.parse(post);
          if (!cursor || parsed.createdAt < parseInt(cursor)) {
            allPosts.push(parsed);
          }
        });
      })
    );

    return allPosts.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  private mergeFeed(
    pushed: FeedItem[],
    pulled: FeedItem[],
    limit: number
  ): FeedItem[] {
    const merged = [...pushed, ...pulled];

    // Deduplicate
    const seen = new Set<string>();
    const unique = merged.filter(item => {
      if (seen.has(item.postId)) return false;
      seen.add(item.postId);
      return true;
    });

    // Sort by time
    return unique.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
}
```

## Flash Sale System Design

### Requirements Analysis

**Business Characteristics:**
- Instant high concurrency (million-level QPS)
- Limited inventory (hundreds to thousands of items)
- Time-concentrated (completed in seconds)
- High security requirements (anti-bot, prevent overselling)

**Technical Challenges:**
- Read-heavy, write-light, but writes require strong consistency
- Hotspot data concentration (single product)
- Need to prevent malicious requests

### System Architecture

```
+-----------------------------------------------------------------------------+
|                        Flash Sale System Architecture                        |
+-----------------------------------------------------------------------------+
|                                                                             |
|                            +-------------+                                  |
|                            |   CDN Layer |  <- Static resource caching      |
|                            +------+------+                                  |
|                                   |                                         |
|                            +------v------+                                  |
|                            |   WAF Layer |  <- Malicious request filtering  |
|                            +------+------+                                  |
|                                   |                                         |
|                            +------v------+                                  |
|                            |Load Balancer|                                  |
|                            +------+------+                                  |
|                                   |                                         |
|    +-----------------------------+------------------------------+           |
|    |                             |                              |           |
|    v                             v                              v           |
|  +------------+            +------------+            +------------+         |
|  | Access     |            | Access     |            | Access     |         |
|  | Layer      |            | Layer      |            | Layer      |         |
|  |(Rate Limit)|            |(Rate Limit)|            |(Rate Limit)|         |
|  +-----+------+            +-----+------+            +-----+------+         |
|        |                         |                         |                |
|        +--------------------------+-------------------------+               |
|                                  |                                          |
|                           +------v------+                                   |
|                           |   Redis     |  <- Inventory pre-deduction       |
|                           |  (Cluster)  |                                   |
|                           +------+------+                                   |
|                                  |                                          |
|                           +------v------+                                   |
|                           |   Kafka     |  <- Async processing              |
|                           +------+------+                                   |
|                                  |                                          |
|                           +------v------+                                   |
|                           |Order Service|  <- Create orders                 |
|                           +------+------+                                   |
|                                  |                                          |
|                           +------v------+                                   |
|                           |   MySQL     |  <- Persistence                   |
|                           +-------------+                                   |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Multi-Level Rate Limiting Strategy

```typescript
// Rate Limiter Implementation
class RateLimiter {
  private redis: Redis;

  // Token Bucket Algorithm Implementation
  async isAllowed(
    key: string,
    capacity: number,
    refillRate: number
  ): Promise<boolean> {
    const now = Date.now();
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now

      -- Calculate tokens to refill
      local elapsed = (now - lastRefill) / 1000
      local refill = math.floor(elapsed * refillRate)
      tokens = math.min(capacity, tokens + refill)

      if tokens < 1 then
        return 0
      end

      tokens = tokens - 1
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 60)

      return 1
    `;

    const result = await this.redis.runScript(
      script, 1, key, capacity, refillRate, now
    );
    return result === 1;
  }

  // Sliding Window Rate Limiting
  async slidingWindowLimit(
    key: string,
    windowMs: number,
    maxRequests: number
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])

      -- Remove requests outside window
      redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

      -- Get current request count in window
      local count = redis.call('ZCARD', key)

      if count >= maxRequests then
        return 0
      end

      -- Add current request
      redis.call('ZADD', key, now, now .. '-' .. math.random())
      redis.call('EXPIRE', key, math.ceil(windowMs / 1000))

      return 1
    `;

    const result = await this.redis.runScript(
      script, 1, key, now, windowStart, maxRequests
    );
    return result === 1;
  }
}
```

### Core Inventory Deduction Logic

```typescript
class SeckillService {
  private redis: Redis;
  private kafka: KafkaProducer;

  // Pre-deduct inventory (Redis atomic operation)
  async tryDeductStock(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; orderId?: string }> {
    // 1. Check if user already purchased (prevent duplicate purchase)
    const hasBought = await this.redis.sismember(
      `seckill:bought:${productId}`, userId
    );
    if (hasBought) {
      return { success: false };
    }

    // 2. Lua script for atomic inventory deduction
    const script = `
      local stockKey = KEYS[1]
      local boughtKey = KEYS[2]
      local userId = ARGV[1]
      local quantity = tonumber(ARGV[2])

      -- Check inventory
      local stock = tonumber(redis.call('GET', stockKey) or 0)
      if stock < quantity then
        return -1  -- Insufficient inventory
      end

      -- Deduct inventory
      local newStock = redis.call('DECRBY', stockKey, quantity)
      if newStock < 0 then
        -- Restore inventory (protection for concurrent scenarios)
        redis.call('INCRBY', stockKey, quantity)
        return -1
      end

      -- Record user has purchased
      redis.call('SADD', boughtKey, userId)

      return newStock
    `;

    const result = await this.redis.runScript(
      script,
      2,
      `seckill:stock:${productId}`,
      `seckill:bought:${productId}`,
      userId,
      quantity
    );

    if (result === -1) {
      return { success: false };
    }

    // 3. Generate order ID and send to message queue
    const orderId = this.generateOrderId();
    await this.kafka.send('seckill_orders', {
      orderId,
      userId,
      productId,
      quantity,
      timestamp: Date.now(),
    });

    return { success: true, orderId };
  }

  // Async Order Processing Worker
  async processOrder(message: SeckillOrderMessage): Promise<void> {
    const { orderId, userId, productId, quantity } = message;

    try {
      // 1. Create order
      await this.createOrder({
        id: orderId,
        userId,
        productId,
        quantity,
        status: 'pending_payment',
        createdAt: new Date(),
        expiredAt: new Date(Date.now() + 15 * 60 * 1000), // 15-minute payment timeout
      });

      // 2. Deduct database inventory
      await this.deductDbStock(productId, quantity);

      // 3. Send order creation notification
      await this.notifyUser(userId, orderId);

    } catch (error) {
      // Rollback Redis inventory
      await this.redis.incrby(`seckill:stock:${productId}`, quantity);
      await this.redis.srem(`seckill:bought:${productId}`, userId);
      throw error;
    }
  }

  // Inventory warm-up
  async warmupStock(productId: string, stock: number): Promise<void> {
    await this.redis.set(`seckill:stock:${productId}`, stock);
    await this.redis.del(`seckill:bought:${productId}`);
  }
}
```

### Anti-Bot Strategy

```typescript
class AntiCheatService {
  private redis: Redis;

  async validateRequest(req: SeckillRequest): Promise<ValidationResult> {
    const checks = await Promise.all([
      this.checkUserRateLimit(req.userId),
      this.checkIpRateLimit(req.ip),
      this.checkDeviceFingerprint(req.deviceId),
      this.checkRequestPattern(req),
    ]);

    const failed = checks.find(c => !c.passed);
    if (failed) {
      return { valid: false, reason: failed.reason };
    }

    return { valid: true };
  }

  // User-level rate limiting
  private async checkUserRateLimit(userId: string): Promise<CheckResult> {
    const key = `anticheat:user:${userId}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, 1); // 1-second window
    }

    if (count > 5) { // Max 5 requests per second
      return { passed: false, reason: 'user_rate_limit' };
    }

    return { passed: true };
  }

  // IP-level rate limiting
  private async checkIpRateLimit(ip: string): Promise<CheckResult> {
    const key = `anticheat:ip:${ip}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, 1);
    }

    if (count > 100) { // Max 100 requests per IP per second
      return { passed: false, reason: 'ip_rate_limit' };
    }

    return { passed: true };
  }

  // Device fingerprint check
  private async checkDeviceFingerprint(deviceId: string): Promise<CheckResult> {
    const key = `anticheat:device:${deviceId}`;
    const buyCount = await this.redis.get(key);

    if (parseInt(buyCount || '0') >= 3) { // Max 3 purchases per device
      return { passed: false, reason: 'device_limit' };
    }

    return { passed: true };
  }

  // Request pattern check (bot detection)
  private async checkRequestPattern(req: SeckillRequest): Promise<CheckResult> {
    // Check if request interval is too regular
    const key = `anticheat:pattern:${req.userId}`;
    const timestamps = await this.redis.lrange(key, 0, 9);

    await this.redis.lpush(key, req.timestamp);
    await this.redis.ltrim(key, 0, 9);
    await this.redis.expire(key, 60);

    if (timestamps.length >= 5) {
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(parseInt(timestamps[i-1]) - parseInt(timestamps[i]));
      }

      // Calculate standard deviation, too small indicates bot
      const stdDev = this.calculateStdDev(intervals);
      if (stdDev < 10) { // Interval variance less than 10ms
        return { passed: false, reason: 'bot_detected' };
      }
    }

    return { passed: true };
  }
}
```

## Search Engine Design Key Points

### Core Architecture

```
+-------------------------------------------------------------------------+
|                        Search Engine Architecture                         |
+-------------------------------------------------------------------------+
|                                                                         |
|   +-------------+                          +-------------+              |
|   | Data Source |                          |Search Query |              |
|   | (DB/Files)  |                          |  (Query)    |              |
|   +------+------+                          +------+------+              |
|          |                                        |                     |
|          v                                        v                     |
|   +-------------+                          +-------------+              |
|   |   Crawler/  |                          |Query Parser |              |
|   | Extraction  |                          |             |              |
|   +------+------+                          +------+------+              |
|          |                                        |                     |
|          v                                        v                     |
|   +-------------+                          +-------------+              |
|   |  Document   |                          |Query Rewrite|              |
|   | Processing  |                          |(Synonyms/   |              |
|   |(Tokenize/NER|                          | Spelling)   |              |
|   +------+------+                          +------+------+              |
|          |                                        |                     |
|          v                                        v                     |
|   +-------------+                          +-------------+              |
|   |   Index     |<-------------------------|   Index     |              |
|   |  Building   |                          |  Retrieval  |              |
|   |(Inverted)   |                          |             |              |
|   +------+------+                          +------+------+              |
|          |                                        |                     |
|          v                                        v                     |
|   +----------------------------------------------------------+         |
|   |                    Index Storage                          |         |
|   |   +-----------------------------------------------+      |         |
|   |   |  Shard 1   |  Shard 2  |  Shard 3  |   ...   |      |         |
|   |   |  Replica A |  Replica A |  Replica A |        |      |         |
|   |   |  Replica B |  Replica B |  Replica B |        |      |         |
|   |   +-----------------------------------------------+      |         |
|   +----------------------------------------------------------+         |
|                                  |                                      |
|                                  v                                      |
|                          +-------------+                               |
|                          |  Ranking    |                               |
|                          |  (Scoring)  |                               |
|                          +------+------+                               |
|                                 |                                       |
|                                 v                                       |
|                          +-------------+                               |
|                          |Search Result|                               |
|                          +-------------+                               |
+-------------------------------------------------------------------------+
```

### Inverted Index Principle

```typescript
// Inverted Index Data Structure
interface InvertedIndex {
  // Term -> List of documents containing the term
  [term: string]: PostingList;
}

interface PostingList {
  documentFrequency: number;  // Number of documents containing the term
  postings: Posting[];        // Specific document information
}

interface Posting {
  docId: string;              // Document ID
  termFrequency: number;      // Term frequency in document
  positions: number[];        // Term positions in document (for phrase queries)
}

// Index Building Example
class InvertedIndexBuilder {
  private index: InvertedIndex = {};
  private docCount = 0;

  // Add document to index
  addDocument(docId: string, content: string): void {
    // 1. Tokenize
    const tokens = this.tokenize(content);

    // 2. Count term frequency and positions
    const termPositions: Map<string, number[]> = new Map();
    tokens.forEach((token, position) => {
      const positions = termPositions.get(token) || [];
      positions.push(position);
      termPositions.set(token, positions);
    });

    // 3. Update inverted index
    termPositions.forEach((positions, term) => {
      if (!this.index[term]) {
        this.index[term] = {
          documentFrequency: 0,
          postings: [],
        };
      }

      this.index[term].documentFrequency++;
      this.index[term].postings.push({
        docId,
        termFrequency: positions.length,
        positions,
      });
    });

    this.docCount++;
  }

  // Search
  search(query: string): SearchResult[] {
    const queryTerms = this.tokenize(query);
    const scores: Map<string, number> = new Map();

    // Calculate TF-IDF score
    for (const term of queryTerms) {
      const postingList = this.index[term];
      if (!postingList) continue;

      // IDF: log(N / df)
      const idf = Math.log(this.docCount / postingList.documentFrequency);

      for (const posting of postingList.postings) {
        // TF: term frequency
        const tf = posting.termFrequency;

        // TF-IDF score
        const score = tf * idf;

        const currentScore = scores.get(posting.docId) || 0;
        scores.set(posting.docId, currentScore + score);
      }
    }

    // Sort and return
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([docId, score]) => ({ docId, score }));
  }

  private tokenize(text: string): string[] {
    // Simplified tokenization implementation
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }
}
```

### Relevance Ranking

```typescript
// BM25 Algorithm Implementation (more advanced than TF-IDF)
class BM25Ranker {
  private k1 = 1.2;  // Term frequency saturation parameter
  private b = 0.75;  // Document length normalization parameter
  private avgDocLength: number;

  calculateScore(
    term: string,
    docId: string,
    tf: number,           // Term frequency in document
    df: number,           // Document frequency
    docLength: number,    // Document length
    totalDocs: number     // Total number of documents
  ): number {
    // IDF component
    const idf = Math.log(
      (totalDocs - df + 0.5) / (df + 0.5) + 1
    );

    // TF component (with document length normalization)
    const tfNorm = (tf * (this.k1 + 1)) /
      (tf + this.k1 * (1 - this.b + this.b * docLength / this.avgDocLength));

    return idf * tfNorm;
  }
}
```

## Distributed File Storage Design

### Core Architecture

```
+-------------------------------------------------------------------------+
|                    Distributed File Storage Architecture                  |
+-------------------------------------------------------------------------+
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                        Client SDK                                |   |
|   +--------------------------------+--------------------------------+   |
|                                    |                                    |
|              +---------------------+---------------------+              |
|              |                     |                     |              |
|              v                     v                     v              |
|   +-----------------+   +-----------------+   +-----------------+       |
|   |   Name Node     |   |   Name Node     |   |   Name Node     |       |
|   |   (Primary)     |   |   (Standby)     |   |   (Standby)     |       |
|   |                 |   |                 |   |                 |       |
|   | - File metadata |   | - Metadata sync |   | - Metadata sync |       |
|   | - Directory     |   | - Failover      |   | - Failover      |       |
|   | - Block mapping |   |                 |   |                 |       |
|   +--------+--------+   +-----------------+   +-----------------+       |
|            |                                                            |
|            | Metadata operations                                        |
|            |                                                            |
|   +--------v--------------------------------------------------------+   |
|   |                        ZooKeeper Cluster                        |   |
|   |                (Coordination, Leader Election, Config)          |   |
|   +-----------------------------------------------------------------+   |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                        Data Nodes                                |   |
|   |                                                                  |   |
|   |   +----------+   +----------+   +----------+   +----------+     |   |
|   |   | Node 1   |   | Node 2   |   | Node 3   |   | Node N   |     |   |
|   |   |          |   |          |   |          |   |          |     |   |
|   |   | Block A  |   | Block A  |   | Block B  |   | Block C  |     |   |
|   |   | Block D  |   | Block B  |   | Block C  |   | Block A  |     |   |
|   |   | Block E  |   | Block E  |   | Block D  |   | Block E  |     |   |
|   |   +----------+   +----------+   +----------+   +----------+     |   |
|   |                                                                  |   |
|   |   * Each Block is 64MB-128MB by default                         |   |
|   |   * Each Block has 3 replicas distributed on different nodes    |   |
|   +-----------------------------------------------------------------+   |
|                                                                         |
+-------------------------------------------------------------------------+
```

### File Upload Flow

```typescript
// Client File Upload Implementation
class DistributedFileClient {
  private nameNode: NameNodeClient;
  private readonly BLOCK_SIZE = 64 * 1024 * 1024; // 64MB

  async uploadFile(filePath: string, destPath: string): Promise<void> {
    const fileSize = await this.getFileSize(filePath);
    const blockCount = Math.ceil(fileSize / this.BLOCK_SIZE);

    // 1. Request write from NameNode
    const uploadPlan = await this.nameNode.createFile({
      path: destPath,
      fileSize,
      blockSize: this.BLOCK_SIZE,
      replicationFactor: 3,
    });

    // 2. Upload in blocks
    const fileHandle = await fs.open(filePath, 'r');

    for (let i = 0; i < blockCount; i++) {
      const blockInfo = uploadPlan.blocks[i];
      const offset = i * this.BLOCK_SIZE;
      const length = Math.min(this.BLOCK_SIZE, fileSize - offset);

      // Read file block
      const buffer = Buffer.alloc(length);
      await fileHandle.read(buffer, 0, length, offset);

      // Upload to DataNode (pipeline replication)
      await this.uploadBlock(blockInfo, buffer);
    }

    await fileHandle.close();

    // 3. Notify NameNode of upload completion
    await this.nameNode.completeFile(destPath);
  }

  private async uploadBlock(
    blockInfo: BlockInfo,
    data: Buffer
  ): Promise<void> {
    // Pipeline replication: Client -> Node1 -> Node2 -> Node3
    const [primary, ...replicas] = blockInfo.locations;

    // Connect to primary node
    const socket = await this.connectDataNode(primary);

    // Send block info and replica list
    await socket.write(JSON.stringify({
      blockId: blockInfo.blockId,
      replicas: replicas,
      checksum: this.calculateChecksum(data),
    }));

    // Send data
    await socket.write(data);

    // Wait for acknowledgment (returned after all replicas write successfully)
    const ack = await socket.read();
    if (!ack.success) {
      throw new Error(`Block upload failed: ${ack.error}`);
    }
  }
}

// NameNode Metadata Management
class NameNodeService {
  private metadata: FileSystemMetadata;
  private blockMap: Map<string, BlockInfo[]> = new Map();

  async createFile(request: CreateFileRequest): Promise<UploadPlan> {
    // 1. Check if directory exists
    const parentDir = path.dirname(request.path);
    if (!this.metadata.exists(parentDir)) {
      throw new Error('Parent directory does not exist');
    }

    // 2. Check if file already exists
    if (this.metadata.exists(request.path)) {
      throw new Error('File already exists');
    }

    // 3. Calculate number of blocks needed
    const blockCount = Math.ceil(request.fileSize / request.blockSize);
    const blocks: BlockInfo[] = [];

    // 4. Allocate DataNodes for each block
    for (let i = 0; i < blockCount; i++) {
      const blockId = this.generateBlockId();
      const locations = await this.selectDataNodes(
        request.replicationFactor
      );

      blocks.push({
        blockId,
        index: i,
        locations,
      });
    }

    // 5. Create file metadata (status: CREATING)
    await this.metadata.createFile({
      path: request.path,
      status: 'CREATING',
      blocks,
      createdAt: Date.now(),
    });

    return { blocks };
  }

  // Select DataNodes (considering load balancing and rack awareness)
  private async selectDataNodes(count: number): Promise<DataNodeInfo[]> {
    const allNodes = await this.getAvailableDataNodes();

    // Sort by available space and load
    const sortedNodes = allNodes.sort((a, b) => {
      const scoreA = a.availableSpace * 0.6 + (1 - a.load) * 0.4;
      const scoreB = b.availableSpace * 0.6 + (1 - b.load) * 0.4;
      return scoreB - scoreA;
    });

    // Rack awareness: try to select nodes from different racks
    const selected: DataNodeInfo[] = [];
    const racks = new Set<string>();

    for (const node of sortedNodes) {
      if (selected.length >= count) break;

      // First two replicas should be on different racks
      if (selected.length < 2 && racks.has(node.rack)) {
        continue;
      }

      selected.push(node);
      racks.add(node.rack);
    }

    // If not enough nodes, relax rack constraint
    if (selected.length < count) {
      for (const node of sortedNodes) {
        if (selected.length >= count) break;
        if (!selected.includes(node)) {
          selected.push(node);
        }
      }
    }

    return selected;
  }
}
```

### Data Consistency and Fault Tolerance

```typescript
// DataNode Heartbeat and Block Report
class DataNodeHeartbeat {
  private nameNode: NameNodeClient;
  private readonly HEARTBEAT_INTERVAL = 3000; // 3 seconds

  async startHeartbeat(): Promise<void> {
    setInterval(async () => {
      try {
        const response = await this.nameNode.heartbeat({
          nodeId: this.nodeId,
          capacity: this.getTotalCapacity(),
          usedSpace: this.getUsedSpace(),
          blockCount: this.getBlockCount(),
        });

        // Process NameNode commands
        for (const command of response.commands) {
          await this.executeCommand(command);
        }
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  // Periodically send block report
  async sendBlockReport(): Promise<void> {
    const blocks = await this.scanLocalBlocks();

    await this.nameNode.blockReport({
      nodeId: this.nodeId,
      blocks: blocks.map(b => ({
        blockId: b.id,
        size: b.size,
        checksum: b.checksum,
      })),
    });
  }

  private async executeCommand(command: NodeCommand): Promise<void> {
    switch (command.type) {
      case 'REPLICATE':
        // Replicate block to other nodes
        await this.replicateBlock(command.blockId, command.targetNode);
        break;
      case 'DELETE':
        // Delete local block
        await this.deleteBlock(command.blockId);
        break;
      case 'INVALIDATE':
        // Mark block as invalid
        await this.invalidateBlock(command.blockId);
        break;
    }
  }
}
```

## Evaluation and Trade-offs

### Technology Selection Decision Matrix

In system design, we often need to make trade-offs between different solutions. Common decision dimensions:

```
+-------------------------------------------------------------------------+
|                    Technology Selection Decision Matrix                   |
+-----------------+---------------+---------------+-----------------------+
|    Dimension    |   Option A    |   Option B    |      Trade-off        |
+-----------------+---------------+---------------+-----------------------+
|Consistency vs   | Strong        | Eventual      | Finance: A, Social: B |
|Availability     | Consistency   | Consistency   |                       |
+-----------------+---------------+---------------+-----------------------+
|Latency vs       | Low Latency   | High          | Real-time: A,         |
|Throughput       | Priority      | Throughput    | Batch: B              |
+-----------------+---------------+---------------+-----------------------+
|SQL vs NoSQL     | Relational    | Non-relational| Complex queries: A,   |
|                 | Database      |               | High scale: B         |
+-----------------+---------------+---------------+-----------------------+
|Sync vs Async    | Synchronous   | Message Queue | Real-time: A,         |
|                 | Calls         |               | Decoupling: B         |
+-----------------+---------------+---------------+-----------------------+
|Vertical vs      | Vertical      | Horizontal    | Early stage: A,       |
|Horizontal       | Scaling       | Scaling       | At scale: B           |
+-----------------+---------------+---------------+-----------------------+
|Push vs Pull     | Push Model    | Pull Model    | Real-time: A,         |
|                 |               |               | High fanout: B        |
+-----------------+---------------+---------------+-----------------------+
```

### Common System Design Problems and Solutions

| Problem | Common Solutions | Use Cases |
|---------|-----------------|-----------|
| High read concurrency | Cache, CDN, read replicas | E-commerce product pages, news |
| High write concurrency | Message queue, batch writes, sharding | Logging systems, flash sales |
| Hotspot data | Local cache, multi-level cache, data sharding | Celebrity posts, hot products |
| Large file transfer | Chunked upload, resumable upload, P2P | Video upload, large file download |
| Data consistency | Distributed transactions, event sourcing, SAGA | Payment systems, order systems |
| High availability | Primary-replica replication, multi-active deployment, failover | Core business systems |
| Data security | Encryption in transit, access control, audit logs | Financial, healthcare systems |

## Design Document Template

In practice, system design needs to be documented. Here's a recommended design document template:

```markdown
# [System Name] Design Document

## Overview
### Background
[Describe business background and design purpose]

### Terminology
| Term | Definition |
|------|------------|
| XXX | XXX |

## Requirements Analysis
### Functional Requirements
- FR-1: [Functional requirement 1]
- FR-2: [Functional requirement 2]

### Non-Functional Requirements
| Metric | Target | Description |
|--------|--------|-------------|
| QPS | 10,000 | Peak request rate |
| Latency | P99 < 100ms | Response time |
| Availability | 99.99% | SLA |

### Constraints
- Technology stack limitations
- Budget constraints
- Time constraints

## High-Level Architecture
### Architecture Diagram
[ASCII diagram or link]

### Component Description
| Component | Responsibility | Technology |
|-----------|---------------|------------|
| XXX | XXX | XXX |

## Detailed Design
### Data Model
[ER diagram, Schema design]

### API Design
[API definitions]

### Core Flows
[Sequence diagrams, flowcharts]

## Key Design Decisions
### [Decision Point 1]
- Problem description
- Alternative solutions
- Decision result
- Rationale

## Capacity Planning
### Storage Estimation
### Bandwidth Estimation
### Compute Resource Estimation

## Monitoring and Alerting
### Key Metrics
### Alert Strategy

## Risks and Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| XXX | XXX | XXX |

## Milestones
| Phase | Deliverable | Timeline |
|-------|-------------|----------|
| XXX | XXX | XXX |
```

## Interview Key Points

### System Design Interview Evaluation Dimensions

Interviewers typically evaluate candidates on the following dimensions:

1. **Problem Analysis (20%)**
   - Can ask the right clarifying questions
   - Can identify key requirements and constraints
   - Can reasonably estimate system scale

2. **Architecture Design (30%)**
   - Is the high-level architecture reasonable
   - Is the component division clear
   - Has scalability been considered

3. **Deep Dive Design (25%)**
   - Is the data model reasonable
   - Is the API design standardized
   - Are the core algorithms correct

4. **Trade-offs and Decisions (15%)**
   - Can identify multiple solutions
   - Can analyze pros and cons of each
   - Are decisions well-reasoned

5. **Communication (10%)**
   - Is the thinking clear
   - Can effectively use whiteboard/diagrams
   - Can proactively drive discussion

### Common Interview Question List

**Entry Level:**
- Design a URL shortener service
- Design a Pastebin service
- Design a rate limiter

**Intermediate:**
- Design Twitter/Weibo Feed
- Design an instant messaging system
- Design a video streaming service (Netflix)

**Advanced:**
- Design a search engine
- Design a distributed message queue
- Design a distributed task scheduler
- Design a real-time recommendation system

### Interview Tips Summary

1. **Proactive Communication**
   - Don't think silently for too long, think out loud
   - Ask questions when uncertain
   - Periodically summarize what's been discussed

2. **Structured Expression**
   - Use RADIO framework to organize answers
   - Give high-level solution first, then dive into details
   - Use diagrams to aid expression

3. **Show Depth**
   - Demonstrate technical depth where asked
   - Proactively mention potential issues and solutions
   - Share relevant practical experience

4. **Stay Flexible**
   - Accept interviewer's suggestions and constraints
   - Adjust approach based on feedback
   - Show ability to iterate and improve

## Summary

System design is a highly comprehensive skill that requires combining theoretical knowledge with practical experience. By studying classic system design cases, we can:

1. **Master Design Methodology**: RADIO framework provides a systematic design approach
2. **Accumulate Solutions**: Classic cases provide reusable design patterns
3. **Develop Trade-off Thinking**: Understand pros and cons of different approaches and their use cases
4. **Improve Communication**: Learn to express complex technical solutions in a structured way

Remember, there's no standard answer in system design. The key is making reasonable trade-offs and decisions given the constraints. Continuous learning, practice, and reflection are the best ways to improve system design skills.

## References

- System Design Interview by Alex Xu
- Designing Data-Intensive Applications by Martin Kleppmann
- Google SRE Book
- AWS Well-Architected Framework
- Engineering blogs from major companies (Meta Engineering, Netflix Tech Blog, Uber Engineering, etc.)
