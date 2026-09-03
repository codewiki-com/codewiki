---
title: CAP Theorem and Distributed Systems
description: Deep dive into CAP theorem for distributed system design
track: architecture
section: distributed
difficulty: advanced
tags:
  - CAP
  - Distributed
  - Consistency
  - Availability
status: imported
origin: old/src/content/docs/architecture/cap-theorem.en.md
divergence: 0.214
issues: []
legacy:
  category: Architecture
  subcategory: Distributed
  order: 12
  lastUpdated: 2026-01-07
---

## Introduction

The CAP theorem, also known as Brewer's theorem, is one of the most fundamental principles in distributed systems design. First proposed by Eric Brewer at the 2000 ACM Symposium on Principles of Distributed Computing, it was formally proven by Seth Gilbert and Nancy Lynch of MIT in 2002. Understanding CAP is essential for architects and developers building systems that span multiple nodes, data centers, or geographic regions.

We'll take a comprehensive look at the CAP theorem, its implications, extensions, and practical applications in modern distributed system design.

## CAP Theorem Explained

### The Three Guarantees

The CAP theorem states that a distributed data store can only provide two of the following three guarantees simultaneously:

```
┌─────────────────────────────────────────────────────────────┐
│                      CAP Theorem                             │
│                                                              │
│                    Consistency (C)                           │
│                         ▲                                    │
│                        / \                                   │
│                       /   \                                  │
│                      /     \                                 │
│               CP    /       \    CA                          │
│            Systems /         \ Systems                       │
│                   /           \                              │
│                  /             \                             │
│                 /      AP       \                            │
│                /    Systems      \                           │
│               ▼─────────────────►▼                           │
│      Availability (A)     Partition Tolerance (P)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**1. Consistency (C)**

Every read receives the most recent write or an error. All nodes see the same data at the same time. This is often referred to as "linearizability" or "strong consistency."

**2. Availability (A)**

Every request receives a (non-error) response, without the guarantee that it contains the most recent write. The system remains operational and responsive.

**3. Partition Tolerance (P)**

The system continues to operate despite arbitrary message loss or failure of part of the system. Network partitions are inevitable in distributed systems.

### Why You Can Only Choose Two

In a distributed system, network partitions are unavoidable. When a partition occurs, the system must make a choice:

```typescript
// Scenario: Network partition occurs between Node A and Node B

// Option 1: Choose Consistency (CP System)
class CPSystem {
  async write(key: string, value: string): Promise<void> {
    try {
      // Try to replicate to all nodes
      await Promise.all([
        this.nodeA.write(key, value),
        this.nodeB.write(key, value)
      ]);
    } catch (error) {
      // If any node is unreachable, reject the write
      throw new Error('Write failed: Cannot guarantee consistency');
    }
  }

  async read(key: string): Promise<string> {
    // Require quorum read to ensure consistency
    const results = await Promise.all([
      this.nodeA.read(key).catch(() => null),
      this.nodeB.read(key).catch(() => null)
    ]);

    const validResults = results.filter(r => r !== null);
    if (validResults.length < this.quorum) {
      throw new Error('Read failed: Cannot guarantee consistency');
    }
    return validResults[0];
  }
}

// Option 2: Choose Availability (AP System)
class APSystem {
  async write(key: string, value: string): Promise<void> {
    // Write to local node immediately
    await this.localNode.write(key, value);

    // Async replication (best effort)
    this.replicateAsync(key, value).catch(err => {
      console.log('Replication pending, will retry later');
      this.pendingReplications.push({ key, value });
    });
  }

  async read(key: string): Promise<string> {
    // Always return local data (may be stale)
    return this.localNode.read(key);
  }
}
```

### Common Misconceptions

**Misconception 1: You must always sacrifice one property**

In reality, you only need to make this trade-off during a network partition. When the network is healthy, a well-designed system can provide all three properties.

**Misconception 2: CA systems exist in practice**

Traditional single-node databases like PostgreSQL are sometimes called "CA systems," but this is misleading. A single-node system doesn't face the distributed systems challenges that CAP addresses. In truly distributed systems, partition tolerance is mandatory because partitions will occur.

**Misconception 3: Consistency in CAP equals ACID consistency**

CAP consistency (linearizability) is different from ACID consistency. ACID consistency refers to data integrity constraints, while CAP consistency refers to all nodes having the same view of data at the same time.

## Consistency Models

Understanding consistency models is crucial for designing distributed systems. Different applications have different requirements.

### Strong Consistency (Linearizability)

The strictest model where operations appear to execute atomically at some point between invocation and response.

```typescript
// Strong Consistency Implementation using Two-Phase Commit
class StrongConsistencyStore {
  private nodes: Node[];
  private coordinator: Coordinator;

  async write(key: string, value: string): Promise<boolean> {
    // Phase 1: Prepare
    const preparePromises = this.nodes.map(node =>
      node.prepare(key, value)
    );

    const prepareResults = await Promise.all(preparePromises);
    const allPrepared = prepareResults.every(result => result.ready);

    if (!allPrepared) {
      // Abort transaction
      await Promise.all(this.nodes.map(node => node.abort(key)));
      return false;
    }

    // Phase 2: Commit
    await Promise.all(this.nodes.map(node => node.commit(key)));
    return true;
  }

  async read(key: string): Promise<string> {
    // Read from majority to ensure we get latest committed value
    const quorum = Math.floor(this.nodes.length / 2) + 1;
    const results = await Promise.all(
      this.nodes.map(node => node.read(key).catch(() => null))
    );

    const validResults = results.filter(r => r !== null);
    if (validResults.length < quorum) {
      throw new Error('Cannot achieve quorum');
    }

    // Return the value with highest version
    return this.getLatestValue(validResults);
  }
}
```

### Sequential Consistency

All operations appear in some sequential order, and each process's operations appear in program order.

```typescript
// Sequential Consistency - operations appear in order but not real-time
class SequentialConsistencyStore {
  private operationLog: Operation[] = [];
  private localCache: Map<string, VersionedValue> = new Map();

  async write(key: string, value: string): Promise<void> {
    const operation: Operation = {
      type: 'write',
      key,
      value,
      timestamp: this.getLogicalClock(),
      processId: this.processId
    };

    // Append to log and propagate
    this.operationLog.push(operation);
    await this.propagateOperation(operation);

    // Apply locally
    this.localCache.set(key, { value, version: operation.timestamp });
  }

  async read(key: string): Promise<string | null> {
    // Wait for all known operations to be applied
    await this.applyPendingOperations();

    const value = this.localCache.get(key);
    return value?.value ?? null;
  }

  private async applyPendingOperations(): Promise<void> {
    // Sort by logical timestamp and apply in order
    const sortedOps = [...this.pendingOperations].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    for (const op of sortedOps) {
      if (op.type === 'write') {
        this.localCache.set(op.key, {
          value: op.value,
          version: op.timestamp
        });
      }
    }
  }
}
```

### Eventual Consistency

If no new updates are made, all replicas will eventually converge to the same value.

```typescript
// Eventual Consistency with conflict resolution
class EventualConsistencyStore {
  private replicas: Replica[];
  private antiEntropy: AntiEntropyProtocol;

  async write(key: string, value: string): Promise<void> {
    const entry: VersionedEntry = {
      key,
      value,
      vectorClock: this.incrementVectorClock(),
      nodeId: this.nodeId,
      timestamp: Date.now()
    };

    // Write locally
    await this.localStorage.put(entry);

    // Gossip to peers asynchronously
    this.gossipProtocol.propagate(entry);
  }

  async read(key: string): Promise<string | null> {
    // Return local value immediately
    const entry = await this.localStorage.get(key);
    return entry?.value ?? null;
  }

  // Conflict resolution using Last-Write-Wins (LWW)
  resolveConflict(entries: VersionedEntry[]): VersionedEntry {
    return entries.reduce((latest, current) => {
      if (current.timestamp > latest.timestamp) {
        return current;
      }
      if (current.timestamp === latest.timestamp) {
        // Tie-breaker: use node ID
        return current.nodeId > latest.nodeId ? current : latest;
      }
      return latest;
    });
  }

  // Alternative: Merge using CRDTs
  mergeCRDT(local: GCounter, remote: GCounter): GCounter {
    const merged = new GCounter(this.nodeId);
    for (const [nodeId, count] of local.entries()) {
      merged.set(nodeId, Math.max(count, remote.get(nodeId) || 0));
    }
    for (const [nodeId, count] of remote.entries()) {
      if (!merged.has(nodeId)) {
        merged.set(nodeId, count);
      }
    }
    return merged;
  }
}
```

### Causal Consistency

Operations that are causally related are seen by all nodes in the same order.

```typescript
// Causal Consistency using Vector Clocks
interface VectorClock {
  [nodeId: string]: number;
}

class CausalConsistencyStore {
  private vectorClock: VectorClock = {};
  private pendingWrites: Map<string, CausalEntry[]> = new Map();

  incrementClock(): VectorClock {
    this.vectorClock[this.nodeId] = (this.vectorClock[this.nodeId] || 0) + 1;
    return { ...this.vectorClock };
  }

  mergeClock(remote: VectorClock): void {
    for (const [nodeId, timestamp] of Object.entries(remote)) {
      this.vectorClock[nodeId] = Math.max(
        this.vectorClock[nodeId] || 0,
        timestamp
      );
    }
  }

  happensBefore(vc1: VectorClock, vc2: VectorClock): boolean {
    let atLeastOneLess = false;

    for (const nodeId of new Set([...Object.keys(vc1), ...Object.keys(vc2)])) {
      const t1 = vc1[nodeId] || 0;
      const t2 = vc2[nodeId] || 0;

      if (t1 > t2) return false;
      if (t1 < t2) atLeastOneLess = true;
    }

    return atLeastOneLess;
  }

  async write(key: string, value: string, dependencies: VectorClock): Promise<void> {
    const entry: CausalEntry = {
      key,
      value,
      vectorClock: this.incrementClock(),
      dependencies
    };

    await this.localStorage.put(entry);
    this.broadcast(entry);
  }

  async applyRemoteWrite(entry: CausalEntry): Promise<void> {
    // Check if all dependencies are satisfied
    if (this.dependenciesSatisfied(entry.dependencies)) {
      await this.localStorage.put(entry);
      this.mergeClock(entry.vectorClock);
    } else {
      // Buffer until dependencies arrive
      this.addToPending(entry);
    }
  }
}
```

## Availability and Partition Tolerance

### Defining Availability

In CAP terms, availability means every request to a non-failing node must result in a response. This is a strong definition - even a slow response can be considered "unavailable" in practical terms.

```typescript
// Availability-focused system design
class HighAvailabilityService {
  private primaryNode: Node;
  private replicaNodes: Node[];
  private healthChecker: HealthChecker;

  constructor(config: HAConfig) {
    this.primaryNode = config.primary;
    this.replicaNodes = config.replicas;
    this.healthChecker = new HealthChecker(config.healthCheckInterval);

    // Start monitoring
    this.healthChecker.start(this.getAllNodes());
  }

  async read(key: string): Promise<Response> {
    const healthyNodes = this.healthChecker.getHealthyNodes();

    if (healthyNodes.length === 0) {
      throw new ServiceUnavailableError('No healthy nodes available');
    }

    // Read from any healthy node
    const selectedNode = this.selectNode(healthyNodes, 'read');

    try {
      const result = await this.withTimeout(
        selectedNode.read(key),
        this.config.readTimeout
      );
      return { success: true, data: result };
    } catch (error) {
      // Failover to next healthy node
      return this.readWithFailover(key, healthyNodes, selectedNode);
    }
  }

  private async readWithFailover(
    key: string,
    nodes: Node[],
    failedNode: Node
  ): Promise<Response> {
    const remainingNodes = nodes.filter(n => n !== failedNode);

    for (const node of remainingNodes) {
      try {
        const result = await this.withTimeout(
          node.read(key),
          this.config.readTimeout
        );
        return { success: true, data: result };
      } catch (error) {
        this.healthChecker.markUnhealthy(node);
        continue;
      }
    }

    throw new ServiceUnavailableError('All nodes failed');
  }

  // Circuit breaker for availability
  private circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenRequests: 3
  });

  async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    if (this.circuitBreaker.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await operation();
      this.circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      throw error;
    }
  }
}
```

### Understanding Partition Tolerance

Network partitions are not just theoretical - they happen regularly in production systems. A partition-tolerant system continues to function despite network failures.

```typescript
// Partition detection and handling
class PartitionAwareSystem {
  private nodes: Map<string, NodeConnection> = new Map();
  private partitionDetector: PartitionDetector;

  constructor() {
    this.partitionDetector = new PartitionDetector({
      heartbeatInterval: 1000,
      failureThreshold: 3,
      suspicionThreshold: 2
    });
  }

  async detectPartition(): Promise<PartitionState> {
    const reachability: Map<string, boolean> = new Map();

    for (const [nodeId, connection] of this.nodes) {
      try {
        await this.withTimeout(connection.ping(), 1000);
        reachability.set(nodeId, true);
      } catch {
        reachability.set(nodeId, false);
      }
    }

    const reachableNodes = [...reachability.entries()]
      .filter(([, reachable]) => reachable)
      .map(([nodeId]) => nodeId);

    const unreachableNodes = [...reachability.entries()]
      .filter(([, reachable]) => !reachable)
      .map(([nodeId]) => nodeId);

    if (unreachableNodes.length > 0) {
      return {
        partitioned: true,
        reachableNodes,
        unreachableNodes,
        inMajorityPartition: reachableNodes.length > this.nodes.size / 2
      };
    }

    return { partitioned: false, reachableNodes, unreachableNodes: [] };
  }

  async handlePartition(state: PartitionState): Promise<void> {
    if (!state.partitioned) return;

    if (state.inMajorityPartition) {
      // Continue operating, but with reduced redundancy
      console.log('Operating in majority partition');
      this.degradeGracefully(state.unreachableNodes);
    } else {
      // Minority partition - become read-only to prevent split-brain
      console.log('In minority partition - switching to read-only mode');
      this.setReadOnlyMode(true);
    }
  }

  private degradeGracefully(unavailableNodes: string[]): void {
    // Reduce quorum requirements
    this.config.writeQuorum = Math.floor(this.nodes.size / 2);
    this.config.readQuorum = 1;

    // Mark nodes as unavailable in load balancer
    for (const nodeId of unavailableNodes) {
      this.loadBalancer.markUnavailable(nodeId);
    }
  }
}
```

## PACELC Extension

The PACELC theorem, proposed by Daniel Abadi in 2010, extends CAP to address system behavior when there is no partition.

### PACELC Explained

```
┌───────────────────────────────────────────────────────────────┐
│                        PACELC                                  │
│                                                                │
│   if Partition:                 else (normal operation):       │
│   ┌─────────────────┐          ┌─────────────────────────┐    │
│   │  Choose:        │          │  Choose:                │    │
│   │  - Availability │          │  - Latency              │    │
│   │    OR           │          │    OR                   │    │
│   │  - Consistency  │          │  - Consistency          │    │
│   └─────────────────┘          └─────────────────────────┘    │
│                                                                │
│   Examples:                                                    │
│   PA/EL: DynamoDB, Cassandra (favor availability/latency)     │
│   PA/EC: MongoDB (availability during partition, consistency  │
│          otherwise)                                            │
│   PC/EC: Traditional RDBMS, Spanner (always consistency)      │
│   PC/EL: PNUTS (consistency during partition, latency         │
│          otherwise)                                            │
└───────────────────────────────────────────────────────────────┘
```

### Practical PACELC Implementations

```typescript
// PA/EL System - Prioritizes availability and low latency
class PAELSystem {
  private replicas: Replica[];

  async write(key: string, value: string): Promise<WriteResult> {
    // Write to local replica immediately (low latency)
    const localResult = await this.localReplica.write(key, value);

    // Asynchronous replication (eventual consistency)
    setImmediate(() => {
      this.replicateAsync(key, value).catch(err => {
        this.retryQueue.add({ key, value, error: err });
      });
    });

    return { success: true, writtenTo: 1, total: this.replicas.length };
  }

  async read(key: string): Promise<string> {
    // Read from local replica (lowest latency)
    return this.localReplica.read(key);
  }
}

// PC/EC System - Always prioritizes consistency
class PCECSystem {
  private replicas: Replica[];
  private quorum: number;

  constructor(replicas: Replica[]) {
    this.replicas = replicas;
    this.quorum = Math.floor(replicas.length / 2) + 1;
  }

  async write(key: string, value: string): Promise<WriteResult> {
    const version = this.generateVersion();
    const writePromises = this.replicas.map(replica =>
      this.writeToReplicaWithTimeout(replica, key, value, version)
    );

    const results = await Promise.allSettled(writePromises);
    const successes = results.filter(r => r.status === 'fulfilled').length;

    if (successes < this.quorum) {
      // Rollback successful writes
      await this.rollback(key, version);
      throw new ConsistencyError('Failed to achieve write quorum');
    }

    return { success: true, writtenTo: successes, total: this.replicas.length };
  }

  async read(key: string): Promise<string> {
    // Read from quorum of replicas
    const readPromises = this.replicas.map(replica =>
      this.readFromReplicaWithTimeout(replica, key)
    );

    const results = await Promise.allSettled(readPromises);
    const successfulReads = results
      .filter((r): r is PromiseFulfilledResult<VersionedValue> =>
        r.status === 'fulfilled'
      )
      .map(r => r.value);

    if (successfulReads.length < this.quorum) {
      throw new ConsistencyError('Failed to achieve read quorum');
    }

    // Return value with highest version
    return this.resolveLatestValue(successfulReads);
  }
}
```

## Common System Choices

Different databases and distributed systems make different CAP trade-offs based on their use cases.

### CP Systems (Consistency + Partition Tolerance)

**Examples**: HBase, MongoDB (with write concern majority), Zookeeper, etcd, Consul

```typescript
// Example: Implementing CP behavior similar to Zookeeper
class CPCoordinationService {
  private nodes: Node[];
  private leader: Node | null = null;

  async electLeader(): Promise<Node> {
    // Use Zab or Raft for leader election
    const election = new LeaderElection(this.nodes);
    this.leader = await election.runElection();
    return this.leader;
  }

  async write(key: string, value: string): Promise<boolean> {
    if (!this.leader) {
      throw new Error('No leader available');
    }

    // All writes go through leader
    if (this.nodeId !== this.leader.id) {
      return this.forwardToLeader(key, value);
    }

    // Leader replicates to majority before acknowledging
    const followers = this.nodes.filter(n => n.id !== this.leader!.id);
    const requiredAcks = Math.floor(followers.length / 2) + 1;

    const acks = await this.replicateToFollowers(key, value, followers);

    if (acks >= requiredAcks) {
      await this.commit(key, value);
      return true;
    }

    throw new Error('Failed to achieve consensus');
  }

  async read(key: string): Promise<string> {
    // Consistent read - must go through leader
    if (this.leader && this.nodeId === this.leader.id) {
      return this.localStorage.get(key);
    }

    // Forward to leader for consistent read
    return this.leader!.read(key);
  }
}
```

### AP Systems (Availability + Partition Tolerance)

**Examples**: Cassandra, DynamoDB, CouchDB, Riak

```typescript
// Example: AP system similar to Cassandra
class APDistributedStore {
  private ring: ConsistentHashRing;
  private replicationFactor: number = 3;

  async write(
    key: string,
    value: string,
    consistency: ConsistencyLevel = 'ONE'
  ): Promise<WriteResult> {
    const replicaNodes = this.ring.getReplicaNodes(key, this.replicationFactor);
    const requiredAcks = this.getRequiredAcks(consistency, replicaNodes.length);

    const writePromises = replicaNodes.map(node =>
      this.writeToNode(node, key, value).catch(err => ({
        success: false,
        error: err
      }))
    );

    // Wait for required acknowledgments
    let acks = 0;
    for await (const result of this.racePromises(writePromises)) {
      if (result.success) {
        acks++;
        if (acks >= requiredAcks) {
          // Return success, remaining writes continue in background
          return { success: true, acks };
        }
      }
    }

    // With ONE consistency, we just need local write
    if (consistency === 'ONE') {
      return { success: true, acks: 1 };
    }

    throw new Error('Failed to achieve ' + consistency + ' consistency');
  }

  // Read repair for eventual consistency
  async readWithRepair(key: string): Promise<string> {
    const replicaNodes = this.ring.getReplicaNodes(key, this.replicationFactor);
    const results = await Promise.all(
      replicaNodes.map(node =>
        node.read(key).catch(() => null)
      )
    );

    const validResults = results.filter(r => r !== null) as VersionedValue[];

    if (validResults.length === 0) {
      throw new Error('Key not found');
    }

    // Find most recent value
    const latest = this.findLatestValue(validResults);

    // Async read repair - update stale replicas
    this.repairStaleReplicas(key, latest, validResults, replicaNodes);

    return latest.value;
  }
}
```

### System Comparison Table

| System | CAP Choice | PACELC | Use Case |
|--------|-----------|--------|----------|
| PostgreSQL | CA* | PC/EC | ACID transactions, single node |
| MySQL Cluster | CP | PC/EC | Financial systems |
| MongoDB | CP | PA/EC | Document storage |
| Cassandra | AP | PA/EL | Time-series, high write throughput |
| DynamoDB | AP | PA/EL | Serverless, key-value |
| Redis Cluster | CP | PC/EL | Caching, sessions |
| CockroachDB | CP | PC/EC | Global SQL |
| Spanner | CP | PC/EC | Global transactions |
| etcd | CP | PC/EC | Configuration, coordination |
| Riak | AP | PA/EL | IoT, high availability |

*Note: PostgreSQL as a single-node database doesn't truly face CAP trade-offs.

## Consensus Algorithms

Consensus algorithms are the backbone of CP systems, enabling distributed nodes to agree on a single value.

### Raft Algorithm

Raft is designed to be more understandable than Paxos while providing the same guarantees.

```typescript
// Simplified Raft implementation
enum NodeState {
  FOLLOWER = 'follower',
  CANDIDATE = 'candidate',
  LEADER = 'leader'
}

interface LogEntry {
  term: number;
  index: number;
  command: string;
}

class RaftNode {
  private state: NodeState = NodeState.FOLLOWER;
  private currentTerm: number = 0;
  private votedFor: string | null = null;
  private log: LogEntry[] = [];
  private commitIndex: number = 0;
  private lastApplied: number = 0;

  // Leader state
  private nextIndex: Map<string, number> = new Map();
  private matchIndex: Map<string, number> = new Map();

  private electionTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    private nodeId: string,
    private peers: string[],
    private transport: RaftTransport
  ) {
    this.resetElectionTimeout();
  }

  private resetElectionTimeout(): void {
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
    }

    // Random timeout between 150-300ms
    const timeout = 150 + Math.random() * 150;
    this.electionTimeout = setTimeout(() => {
      this.startElection();
    }, timeout);
  }

  private async startElection(): Promise<void> {
    this.state = NodeState.CANDIDATE;
    this.currentTerm++;
    this.votedFor = this.nodeId;

    let votesReceived = 1; // Vote for self
    const votesNeeded = Math.floor(this.peers.length / 2) + 1;

    const voteRequests = this.peers.map(async (peerId) => {
      const response = await this.transport.requestVote(peerId, {
        term: this.currentTerm,
        candidateId: this.nodeId,
        lastLogIndex: this.log.length - 1,
        lastLogTerm: this.log.length > 0 ? this.log[this.log.length - 1].term : 0
      });

      return response;
    });

    for await (const response of this.racePromises(voteRequests)) {
      if (response.term > this.currentTerm) {
        this.stepDown(response.term);
        return;
      }

      if (response.voteGranted) {
        votesReceived++;
        if (votesReceived >= votesNeeded) {
          this.becomeLeader();
          return;
        }
      }
    }

    // Election failed, reset timeout and try again
    this.resetElectionTimeout();
  }

  private becomeLeader(): void {
    this.state = NodeState.LEADER;

    // Initialize leader state
    for (const peerId of this.peers) {
      this.nextIndex.set(peerId, this.log.length);
      this.matchIndex.set(peerId, 0);
    }

    // Start sending heartbeats
    this.startHeartbeats();
  }

  private startHeartbeats(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
    }, 50); // Send heartbeats every 50ms
  }

  private async sendHeartbeats(): Promise<void> {
    for (const peerId of this.peers) {
      const nextIdx = this.nextIndex.get(peerId) || this.log.length;
      const prevLogIndex = nextIdx - 1;
      const prevLogTerm = prevLogIndex >= 0 ? this.log[prevLogIndex]?.term || 0 : 0;

      const entries = this.log.slice(nextIdx);

      this.transport.appendEntries(peerId, {
        term: this.currentTerm,
        leaderId: this.nodeId,
        prevLogIndex,
        prevLogTerm,
        entries,
        leaderCommit: this.commitIndex
      }).then(response => {
        if (response.success) {
          this.nextIndex.set(peerId, nextIdx + entries.length);
          this.matchIndex.set(peerId, nextIdx + entries.length - 1);
          this.updateCommitIndex();
        } else if (response.term > this.currentTerm) {
          this.stepDown(response.term);
        } else {
          // Decrement nextIndex and retry
          this.nextIndex.set(peerId, Math.max(0, nextIdx - 1));
        }
      });
    }
  }

  async appendEntry(command: string): Promise<boolean> {
    if (this.state !== NodeState.LEADER) {
      throw new Error('Not the leader');
    }

    const entry: LogEntry = {
      term: this.currentTerm,
      index: this.log.length,
      command
    };

    this.log.push(entry);

    // Replicate to followers
    await this.sendHeartbeats();

    // Wait for majority
    return new Promise((resolve) => {
      const checkCommit = setInterval(() => {
        if (this.commitIndex >= entry.index) {
          clearInterval(checkCommit);
          resolve(true);
        }
      }, 10);
    });
  }

  private stepDown(term: number): void {
    this.state = NodeState.FOLLOWER;
    this.currentTerm = term;
    this.votedFor = null;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.resetElectionTimeout();
  }
}
```

### Paxos Overview

Paxos is the foundational consensus algorithm, though more complex than Raft.

```typescript
// Simplified Multi-Paxos
class PaxosNode {
  private proposalNumber: number = 0;
  private acceptedProposalNumber: number = 0;
  private acceptedValue: string | null = null;
  private promised: number = 0;

  // Proposer phase 1a: Prepare
  async prepare(value: string): Promise<boolean> {
    this.proposalNumber++;
    const n = this.proposalNumber;

    const promises = await Promise.all(
      this.acceptors.map(a => a.receivePrepare(n))
    );

    const majority = Math.floor(this.acceptors.length / 2) + 1;
    const promisesReceived = promises.filter(p => p.promised).length;

    if (promisesReceived >= majority) {
      // Check if any acceptor has already accepted a value
      const acceptedValues = promises
        .filter(p => p.acceptedValue !== null)
        .sort((a, b) => b.acceptedProposalNumber! - a.acceptedProposalNumber!);

      const valueToPropose = acceptedValues.length > 0
        ? acceptedValues[0].acceptedValue
        : value;

      return this.accept(n, valueToPropose!);
    }

    return false;
  }

  // Acceptor: Receive Prepare (Phase 1b)
  receivePrepare(n: number): PrepareResponse {
    if (n > this.promised) {
      this.promised = n;
      return {
        promised: true,
        acceptedProposalNumber: this.acceptedProposalNumber,
        acceptedValue: this.acceptedValue
      };
    }
    return { promised: false };
  }

  // Proposer phase 2a: Accept
  async accept(n: number, value: string): Promise<boolean> {
    const accepts = await Promise.all(
      this.acceptors.map(a => a.receiveAccept(n, value))
    );

    const majority = Math.floor(this.acceptors.length / 2) + 1;
    const acceptsReceived = accepts.filter(a => a).length;

    if (acceptsReceived >= majority) {
      // Value is chosen
      await this.learn(value);
      return true;
    }

    return false;
  }

  // Acceptor: Receive Accept (Phase 2b)
  receiveAccept(n: number, value: string): boolean {
    if (n >= this.promised) {
      this.promised = n;
      this.acceptedProposalNumber = n;
      this.acceptedValue = value;
      return true;
    }
    return false;
  }
}
```

## Distributed Locks

Distributed locks are essential for coordinating access to shared resources across multiple nodes.

### Redlock Algorithm

Redis's Redlock provides a robust distributed locking mechanism.

```typescript
// Redlock implementation
class Redlock {
  private redisNodes: Redis[];
  private quorum: number;
  private clockDriftFactor: number = 0.01;

  constructor(redisNodes: Redis[]) {
    this.redisNodes = redisNodes;
    this.quorum = Math.floor(redisNodes.length / 2) + 1;
  }

  async lock(
    resource: string,
    ttl: number
  ): Promise<Lock | null> {
    const value = this.generateUniqueValue();
    const startTime = Date.now();

    let acquiredLocks = 0;
    const acquiredNodes: Redis[] = [];

    for (const node of this.redisNodes) {
      try {
        const acquired = await this.acquireLockOnNode(
          node, resource, value, ttl
        );
        if (acquired) {
          acquiredLocks++;
          acquiredNodes.push(node);
        }
      } catch (error) {
        // Node unavailable, continue
      }
    }

    const elapsedTime = Date.now() - startTime;
    const drift = Math.floor(ttl * this.clockDriftFactor) + 2;
    const validityTime = ttl - elapsedTime - drift;

    if (acquiredLocks >= this.quorum && validityTime > 0) {
      return {
        resource,
        value,
        validityTime,
        acquiredNodes
      };
    }

    // Failed to acquire lock, release any acquired locks
    await this.releaseLockOnNodes(acquiredNodes, resource, value);
    return null;
  }

  private async acquireLockOnNode(
    node: Redis,
    resource: string,
    value: string,
    ttl: number
  ): Promise<boolean> {
    const result = await node.set(
      resource,
      value,
      'PX', ttl,
      'NX'
    );
    return result === 'OK';
  }

  async unlock(lock: Lock): Promise<void> {
    // Use Lua script to ensure atomic check-and-delete
    const unlockScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await Promise.all(
      lock.acquiredNodes.map(node =>
        node.runScript(unlockScript, [lock.resource], [lock.value])
      )
    );
  }

  async extend(lock: Lock, ttl: number): Promise<Lock | null> {
    const extendScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    let extended = 0;
    for (const node of lock.acquiredNodes) {
      try {
        const result = await node.runScript(
          extendScript, [lock.resource], [lock.value, ttl.toString()]
        );
        if (result === 1) extended++;
      } catch (error) {
        // Node unavailable
      }
    }

    if (extended >= this.quorum) {
      return { ...lock, validityTime: ttl };
    }

    return null;
  }
}

// Usage example
async function processWithLock(resource: string): Promise<void> {
  const redlock = new Redlock(redisNodes);
  const lock = await redlock.lock('locks:' + resource, 10000);

  if (!lock) {
    throw new Error('Could not acquire lock');
  }

  try {
    // Critical section
    await performCriticalOperation(resource);
  } finally {
    await redlock.unlock(lock);
  }
}
```

### ZooKeeper-based Locks

```typescript
// ZooKeeper distributed lock
class ZooKeeperLock {
  private zk: ZooKeeper;
  private lockPath: string;
  private myNode: string | null = null;

  constructor(zk: ZooKeeper, lockPath: string) {
    this.zk = zk;
    this.lockPath = lockPath;
  }

  async lock(): Promise<void> {
    // Create sequential ephemeral node
    this.myNode = await this.zk.create(
      this.lockPath + '/lock-',
      '',
      { sequential: true, ephemeral: true }
    );

    while (true) {
      // Get all children and sort
      const children = await this.zk.getChildren(this.lockPath);
      const sortedChildren = children.sort();

      const mySequence = this.myNode.split('-').pop();
      const myIndex = sortedChildren.findIndex(
        child => child.endsWith(mySequence!)
      );

      if (myIndex === 0) {
        // I have the lock
        return;
      }

      // Watch the node before me
      const nodeToWatch = sortedChildren[myIndex - 1];
      await this.watchNode(this.lockPath + '/' + nodeToWatch);
    }
  }

  private async watchNode(path: string): Promise<void> {
    return new Promise((resolve) => {
      this.zk.exists(path, (event) => {
        if (event.type === 'deleted') {
          resolve();
        }
      });
    });
  }

  async unlock(): Promise<void> {
    if (this.myNode) {
      await this.zk.delete(this.myNode);
      this.myNode = null;
    }
  }
}
```

## Distributed ID Generation

Generating unique identifiers across distributed systems is a common challenge with several solutions.

### Snowflake ID Generator

Twitter's Snowflake generates unique IDs using timestamp, machine ID, and sequence number.

```typescript
// Snowflake ID Generator
class SnowflakeIdGenerator {
  // Bit allocation (64 bits total):
  // 1 bit: sign (always 0)
  // 41 bits: timestamp (milliseconds since epoch)
  // 10 bits: machine ID (datacenter + worker)
  // 12 bits: sequence number

  private readonly EPOCH = 1609459200000n; // 2021-01-01
  private readonly MACHINE_ID_BITS = 10n;
  private readonly SEQUENCE_BITS = 12n;

  private readonly MAX_MACHINE_ID = (1n << this.MACHINE_ID_BITS) - 1n;
  private readonly MAX_SEQUENCE = (1n << this.SEQUENCE_BITS) - 1n;

  private readonly MACHINE_ID_SHIFT = this.SEQUENCE_BITS;
  private readonly TIMESTAMP_SHIFT = this.SEQUENCE_BITS + this.MACHINE_ID_BITS;

  private machineId: bigint;
  private sequence: bigint = 0n;
  private lastTimestamp: bigint = -1n;

  constructor(machineId: number) {
    if (BigInt(machineId) > this.MAX_MACHINE_ID) {
      throw new Error('Machine ID must be <= ' + this.MAX_MACHINE_ID);
    }
    this.machineId = BigInt(machineId);
  }

  nextId(): bigint {
    let timestamp = this.currentTimestamp();

    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards');
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // Sequence exhausted, wait for next millisecond
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    return (
      ((timestamp - this.EPOCH) << this.TIMESTAMP_SHIFT) |
      (this.machineId << this.MACHINE_ID_SHIFT) |
      this.sequence
    );
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

  // Parse a Snowflake ID back into components
  parseId(id: bigint): SnowflakeComponents {
    const sequence = id & this.MAX_SEQUENCE;
    const machineId = (id >> this.MACHINE_ID_SHIFT) & this.MAX_MACHINE_ID;
    const timestamp = (id >> this.TIMESTAMP_SHIFT) + this.EPOCH;

    return {
      timestamp: new Date(Number(timestamp)),
      machineId: Number(machineId),
      sequence: Number(sequence)
    };
  }
}

// Usage
const generator = new SnowflakeIdGenerator(1);
const id = generator.nextId();
console.log(id.toString()); // e.g., "1234567890123456789"
```

### UUID Variants

```typescript
// UUID generation utilities
class UUIDGenerator {
  // UUID v1: Timestamp-based
  static v1(): string {
    const timestamp = Date.now();
    const clockSeq = Math.floor(Math.random() * 16384);
    const node = this.getNodeId();

    // Time-based UUID structure
    const timeLow = (timestamp & 0xffffffff).toString(16).padStart(8, '0');
    const timeMid = ((timestamp >> 32) & 0xffff).toString(16).padStart(4, '0');
    const timeHiAndVersion = (((timestamp >> 48) & 0x0fff) | 0x1000)
      .toString(16).padStart(4, '0');
    const clockSeqHiAndReserved = ((clockSeq >> 8) | 0x80)
      .toString(16).padStart(2, '0');
    const clockSeqLow = (clockSeq & 0xff).toString(16).padStart(2, '0');

    return timeLow + '-' + timeMid + '-' + timeHiAndVersion + '-' + 
           clockSeqHiAndReserved + clockSeqLow + '-' + node;
  }

  // UUID v4: Random
  static v4(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) and variant (RFC 4122)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + 
           hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  // UUID v7: Unix timestamp + random (better for databases)
  static v7(): string {
    const timestamp = Date.now();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // First 48 bits: Unix timestamp in milliseconds
    bytes[0] = (timestamp >> 40) & 0xff;
    bytes[1] = (timestamp >> 32) & 0xff;
    bytes[2] = (timestamp >> 24) & 0xff;
    bytes[3] = (timestamp >> 16) & 0xff;
    bytes[4] = (timestamp >> 8) & 0xff;
    bytes[5] = timestamp & 0xff;

    // Set version (7) and variant
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + 
           hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  private static getNodeId(): string {
    // In practice, use MAC address or random value
    return Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Comparison: When to use each
const idStrategies = {
  snowflake: {
    pros: ['Sortable by time', 'Compact (64-bit)', 'No coordination needed'],
    cons: ['Machine ID management', 'Clock sync required'],
    useCase: 'High-throughput systems, time-ordered data'
  },
  uuidV4: {
    pros: ['No coordination', 'Simple implementation'],
    cons: ['Not sortable', 'Larger storage (128-bit)', 'Poor index performance'],
    useCase: 'General purpose, low-volume systems'
  },
  uuidV7: {
    pros: ['Sortable by time', 'No coordination', 'Standard format'],
    cons: ['Larger than Snowflake'],
    useCase: 'Database primary keys, need time ordering'
  }
};
```

## Interview Key Points

### Common Interview Questions and Answers

**Q1: Explain the CAP theorem and why we cannot have all three properties.**

```typescript
/*
Answer Framework:

1. Definition: CAP states that a distributed system can only guarantee
   two of three properties: Consistency, Availability, Partition Tolerance.

2. Why not all three:
   - Network partitions are INEVITABLE in distributed systems
   - When a partition occurs, you must choose:
     * Stop serving requests (lose Availability)
     * Serve potentially stale data (lose Consistency)
   - You cannot "choose" Partition Tolerance - it's a reality

3. Real-world example:
*/

class InterviewExample {
  // Scenario: Two nodes, partition occurs

  // CP Choice: Return error if can't confirm consistency
  async cpRead(key: string): Promise<string> {
    if (!this.canReachMajority()) {
      throw new Error('Cannot guarantee consistency');
    }
    return this.quorumRead(key);
  }

  // AP Choice: Return local data, may be stale
  async apRead(key: string): Promise<string> {
    return this.localStorage.get(key); // Always available
  }
}
```

**Q2: What is the difference between eventual consistency and strong consistency?**

```typescript
/*
Strong Consistency:
- All reads reflect the most recent write
- Linearizable - operations appear atomic
- Higher latency, lower availability

Eventual Consistency:
- Given enough time, all replicas converge
- Reads may return stale data
- Lower latency, higher availability

Trade-off visualization:
*/

const consistencySpectrum = {
  strongest: [
    'Linearizability',      // All ops appear atomic
    'Sequential Consistency', // Per-process order preserved
    'Causal Consistency',   // Causally related ops ordered
  ],
  weaker: [
    'Read Your Writes',     // See your own writes
    'Monotonic Reads',      // Never see older values
    'Eventual Consistency', // Eventually converge
  ]
};
```

**Q3: How would you design a distributed cache with high availability?**

```typescript
class DistributedCacheDesign {
  /*
  Key Design Decisions:

  1. Partition Strategy: Consistent hashing
  2. Replication: Each key stored on N nodes
  3. Consistency: AP with read repair
  4. Failure Handling: Node replacement, data migration
  */

  private ring: ConsistentHashRing;
  private replicationFactor = 3;

  async get(key: string): Promise<string | null> {
    const nodes = this.ring.getNodes(key, this.replicationFactor);

    // Try each replica in order
    for (const node of nodes) {
      try {
        const value = await node.get(key);
        if (value !== null) {
          // Async read repair
          this.repairAsync(key, value, nodes);
          return value;
        }
      } catch {
        continue; // Try next replica
      }
    }

    return null;
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    const nodes = this.ring.getNodes(key, this.replicationFactor);

    // Write to all replicas (best effort)
    const results = await Promise.allSettled(
      nodes.map(node => node.set(key, value, ttl))
    );

    const successes = results.filter(r => r.status === 'fulfilled').length;
    if (successes === 0) {
      throw new Error('Failed to write to any replica');
    }

    // Return success if at least one write succeeded
    // Background process will replicate to failed nodes
  }
}
```

**Q4: Explain the Raft consensus algorithm.**

```
Raft Overview for Interviews:

1. Leader Election:
   - Nodes start as followers
   - If no heartbeat received, become candidate
   - Request votes from peers
   - Majority votes = become leader

2. Log Replication:
   - All writes go through leader
   - Leader appends to log, replicates to followers
   - Entry committed when majority acknowledges
   - Followers apply committed entries

3. Safety Guarantees:
   - Election Safety: One leader per term
   - Leader Append-Only: Never overwrites log
   - Log Matching: Same index+term = same commands
   - Leader Completeness: Committed entries in future leaders

Key Insight: Simpler than Paxos, same guarantees
```

### Quick Reference Table

| Concept | Definition | Example |
|---------|------------|---------|
| Quorum | Minimum nodes for operation | W + R > N for consistency |
| Vector Clock | Track causality | {A:2, B:1} happened-before {A:2, B:2} |
| Split Brain | Multiple leaders | Prevented by majority quorum |
| Hinted Handoff | Store writes for unavailable nodes | Cassandra |
| Read Repair | Fix stale replicas on read | Dynamo-style systems |
| Anti-Entropy | Background synchronization | Merkle trees |
| Gossip Protocol | Peer-to-peer information spread | Membership, failure detection |

## Further Reading

### Books

1. **"Designing Data-Intensive Applications"** by Martin Kleppmann
   - Comprehensive coverage of distributed systems concepts
   - Excellent explanation of consistency models

2. **"Distributed Systems: Principles and Paradigms"** by Tanenbaum & Van Steen
   - Academic foundation for distributed computing

3. **"Database Internals"** by Alex Petrov
   - Deep dive into distributed database implementation

### Papers

1. **"Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services"** (2002)
   - Gilbert & Lynch's formal proof of CAP theorem

2. **"Dynamo: Amazon's Highly Available Key-value Store"** (2007)
   - Foundation of many AP systems

3. **"In Search of an Understandable Consensus Algorithm"** (2014)
   - The Raft paper, essential reading

4. **"Spanner: Google's Globally-Distributed Database"** (2012)
   - How to achieve consistency at global scale

5. **"Time, Clocks, and the Ordering of Events in a Distributed System"** (1978)
   - Lamport's foundational work on logical clocks

### Online Resources

- **Jepsen.io** - Kyle Kingsbury's distributed systems testing
- **Aphyr's Call Me Maybe series** - Analysis of distributed system failures
- **The Morning Paper** - Academic paper summaries
- **Distributed Systems for Fun and Profit** - Free online book

### Practice Platforms

1. **MIT 6.824 Labs** - Implement Raft, distributed key-value store
2. **Fly.io Distributed Systems Challenges** - Hands-on exercises
3. **TigerBeetle Learn** - Financial transaction processing

## Summary

The CAP theorem remains a cornerstone of distributed systems design, though its practical application requires nuanced understanding:

1. **CAP is about trade-offs during partitions** - In normal operation, well-designed systems can provide reasonable consistency and availability.

2. **Choose based on requirements** - Financial systems typically need CP; social media feeds work well with AP.

3. **PACELC provides more guidance** - Consider latency vs. consistency trade-offs during normal operation.

4. **Consensus algorithms are essential** - Understanding Raft or Paxos is crucial for building CP systems.

5. **Distributed coordination is hard** - Use proven implementations (etcd, ZooKeeper) when possible.

6. **Test failure scenarios** - Use tools like Jepsen to verify system behavior under partition.

The key to success in distributed systems is not memorizing these concepts, but understanding how to apply them to solve real-world problems while making informed trade-offs.
