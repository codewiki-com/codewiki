---
title: Strangler Fig Pattern
description: A comprehensive guide to the Strangler Fig Pattern for incrementally migrating legacy systems to modern architectures
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - Strangler Fig
  - Migration
  - Legacy Systems
  - Microservices
  - Refactoring
  - Architecture Patterns
status: imported
origin: old/src/content/docs/architecture/strangler-fig.en.md
divergence: 0.221
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Architecture
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-21
---

The Strangler Fig Pattern is a powerful architectural migration strategy that enables organizations to incrementally replace legacy systems with modern implementations. Named after the strangler fig tree that gradually envelops and replaces its host tree, this pattern allows teams to migrate complex systems piece by piece while maintaining continuous operation. This article explores the pattern's origins, implementation strategies, and best practices for successful legacy system modernization.

## Concept Explanation

### What is the Strangler Fig Pattern?

The **Strangler Fig Pattern** is an incremental migration strategy that allows you to gradually replace a legacy system by routing specific functionalities to new implementations while keeping the old system operational. Rather than attempting a risky "big bang" rewrite, you systematically strangle the old system by intercepting calls and redirecting them to new components.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Initial State                             │
│  ┌─────────┐         ┌──────────────────────────────────────┐  │
│  │ Clients │ ──────► │           Legacy System               │  │
│  └─────────┘         │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │  │
│                      │  │ A  │ │ B  │ │ C  │ │ D  │ │ E  │ │  │
│                      │  └────┘ └────┘ └────┘ └────┘ └────┘ │  │
│                      └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Migration in Progress                       │
│  ┌─────────┐         ┌─────────────┐                            │
│  │ Clients │ ──────► │   Facade    │                            │
│  └─────────┘         │  (Router)   │                            │
│                      └──────┬──────┘                            │
│                       ┌─────┴─────┐                             │
│                       ▼           ▼                             │
│              ┌──────────────┐  ┌──────────────────────────┐    │
│              │  New System  │  │      Legacy System       │    │
│              │  ┌────┐      │  │  ┌────┐ ┌────┐ ┌────┐   │    │
│              │  │ A' │      │  │  │ B  │ │ C  │ │ D  │   │    │
│              │  └────┘      │  │  └────┘ └────┘ └────┘   │    │
│              └──────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Final State                              │
│  ┌─────────┐         ┌──────────────────────────────────────┐  │
│  │ Clients │ ──────► │           New System                  │  │
│  └─────────┘         │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │  │
│                      │  │ A' │ │ B' │ │ C' │ │ D' │ │ E' │ │  │
│                      │  └────┘ └────┘ └────┘ └────┘ └────┘ │  │
│                      └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### History and Origin

Martin Fowler coined the term "Strangler Fig Application" in 2004, inspired by the strangler fig trees he observed in Australia:

> "One of the natural wonders of this area are the huge strangler figs. They seed in the upper branches of a tree and gradually work their way down the tree until they root in the soil. Over many years they grow into fantastic and beautiful shapes, meanwhile strangling and killing the tree that was their host."

This biological metaphor perfectly describes the gradual replacement of legacy systems:

| Phase | Strangler Fig Tree | Software Migration |
|-------|-------------------|-------------------|
| Seed | Fig seeds in host tree canopy | New component intercepts first functionality |
| Growth | Roots grow toward ground | More functionality migrated to new system |
| Establishment | Roots reach soil | New system becomes primary |
| Replacement | Host tree dies, fig stands alone | Legacy system decommissioned |

### Why Use the Strangler Fig Pattern?

Traditional "big bang" rewrites carry significant risks:

```
Big Bang Rewrite Risks:
├── Technical Risks
│   ├── Incomplete requirements understanding
│   ├── Unknown edge cases in legacy code
│   ├── Integration failures
│   └── Performance regressions
├── Business Risks
│   ├── Extended downtime
│   ├── Lost revenue during migration
│   ├── Customer dissatisfaction
│   └── Competitive disadvantage
└── Organizational Risks
    ├── Team burnout from prolonged projects
    ├── Knowledge silos
    └── Stakeholder confidence loss
```

The Strangler Fig Pattern mitigates these risks by:

1. **Continuous Delivery**: New functionality is delivered incrementally
2. **Reversibility**: Easy rollback if issues arise
3. **Risk Distribution**: Risk is spread across multiple smaller changes
4. **Learning**: Team learns about the domain through gradual migration
5. **Business Continuity**: System remains operational throughout

### When to Use This Pattern

**Good candidates:**

- Monolithic applications needing modernization
- Systems with clear functional boundaries
- Applications with stable, well-defined interfaces
- Organizations with continuous delivery capabilities

**Poor candidates:**

- Tightly coupled systems with no clear seams
- Systems with severe performance requirements during migration
- Applications with complex, undocumented business logic
- Teams lacking infrastructure automation skills

## Core Principles

### The Strangler Facade

The facade is the key component that enables gradual migration. It intercepts all requests and routes them to either the legacy or new system:

```typescript
// Strangler Facade implementation
interface RoutingDecision {
  target: 'legacy' | 'new';
  reason: string;
}

class StranglerFacade {
  private featureFlags: Map<string, boolean>;
  private routingRules: Map<string, (request: Request) => RoutingDecision>;

  constructor() {
    this.featureFlags = new Map();
    this.routingRules = new Map();
  }

  // Register routing rule for a specific path
  registerRoute(
    path: string,
    rule: (request: Request) => RoutingDecision
  ): void {
    this.routingRules.set(path, rule);
  }

  // Enable/disable feature flags
  setFeatureFlag(feature: string, enabled: boolean): void {
    this.featureFlags.set(feature, enabled);
  }

  // Route incoming request
  async route(request: Request): Promise<Response> {
    const path = this.extractPath(request);
    const rule = this.routingRules.get(path);

    if (!rule) {
      // Default to legacy if no rule exists
      return this.routeToLegacy(request);
    }

    const decision = rule(request);

    // Log routing decision for monitoring
    this.logRoutingDecision(request, decision);

    if (decision.target === 'new') {
      try {
        const response = await this.routeToNew(request);
        return response;
      } catch (error) {
        // Fallback to legacy on error (circuit breaker pattern)
        this.logFallback(request, error);
        return this.routeToLegacy(request);
      }
    }

    return this.routeToLegacy(request);
  }

  private async routeToLegacy(request: Request): Promise<Response> {
    return fetch(`${LEGACY_URL}${request.url}`, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }

  private async routeToNew(request: Request): Promise<Response> {
    return fetch(`${NEW_SYSTEM_URL}${request.url}`, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
}
```

### Asset Capture Pattern

Before strangling, you must "capture" assets - identify and document all functionality that needs migration:

```typescript
// Asset capture - documenting legacy functionality
interface LegacyAsset {
  id: string;
  name: string;
  description: string;
  endpoints: string[];
  dependencies: string[];
  dataStores: string[];
  businessRules: BusinessRule[];
  complexity: 'low' | 'medium' | 'high';
  priority: number;
  migrationStatus: 'not-started' | 'in-progress' | 'completed' | 'verified';
}

interface BusinessRule {
  id: string;
  description: string;
  implementation: string;
  testCases: TestCase[];
}

// Asset inventory for migration planning
class AssetInventory {
  private assets: Map<string, LegacyAsset> = new Map();

  addAsset(asset: LegacyAsset): void {
    this.assets.set(asset.id, asset);
  }

  // Get migration order based on dependencies and priority
  getMigrationOrder(): LegacyAsset[] {
    const sorted: LegacyAsset[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (assetId: string) => {
      if (visited.has(assetId)) return;
      if (visiting.has(assetId)) {
        throw new Error(`Circular dependency detected: ${assetId}`);
      }

      visiting.add(assetId);
      const asset = this.assets.get(assetId)!;

      // Visit dependencies first
      for (const depId of asset.dependencies) {
        if (this.assets.has(depId)) {
          visit(depId);
        }
      }

      visiting.delete(assetId);
      visited.add(assetId);
      sorted.push(asset);
    };

    // Sort by priority, then process dependencies
    const byPriority = [...this.assets.values()]
      .sort((a, b) => a.priority - b.priority);

    for (const asset of byPriority) {
      visit(asset.id);
    }

    return sorted;
  }

  // Calculate migration progress
  getProgress(): MigrationProgress {
    const total = this.assets.size;
    const completed = [...this.assets.values()]
      .filter(a => a.migrationStatus === 'verified').length;
    const inProgress = [...this.assets.values()]
      .filter(a => a.migrationStatus === 'in-progress').length;

    return {
      total,
      completed,
      inProgress,
      percentComplete: (completed / total) * 100
    };
  }
}
```

### Event Interception

For event-driven systems, intercept and duplicate events during migration:

```typescript
// Event interception for gradual migration
interface DomainEvent {
  id: string;
  type: string;
  timestamp: Date;
  payload: unknown;
  metadata: EventMetadata;
}

class EventInterceptor {
  private legacyHandler: EventHandler;
  private newHandler: EventHandler;
  private comparisonMode: boolean = true;

  constructor(
    legacyHandler: EventHandler,
    newHandler: EventHandler
  ) {
    this.legacyHandler = legacyHandler;
    this.newHandler = newHandler;
  }

  async handleEvent(event: DomainEvent): Promise<void> {
    // During migration, send to both systems
    if (this.comparisonMode) {
      const [legacyResult, newResult] = await Promise.allSettled([
        this.legacyHandler.handle(event),
        this.newHandler.handle(event)
      ]);

      // Compare results for verification
      await this.compareResults(event, legacyResult, newResult);

      // Legacy is still authoritative
      if (legacyResult.status === 'rejected') {
        throw legacyResult.reason;
      }
    } else {
      // After migration complete, use new system only
      await this.newHandler.handle(event);
    }
  }

  private async compareResults(
    event: DomainEvent,
    legacyResult: PromiseSettledResult<EventResult>,
    newResult: PromiseSettledResult<EventResult>
  ): Promise<void> {
    const comparison: ResultComparison = {
      eventId: event.id,
      eventType: event.type,
      timestamp: new Date(),
      legacyStatus: legacyResult.status,
      newStatus: newResult.status,
      match: this.resultsMatch(legacyResult, newResult)
    };

    // Log comparison for analysis
    await this.logComparison(comparison);

    if (!comparison.match) {
      // Alert on discrepancy
      await this.alertDiscrepancy(comparison);
    }
  }
}
```

### Data Migration Strategies

Data migration is often the most challenging aspect:

```typescript
// Dual-write pattern for data migration
class DualWriteRepository<T extends Entity> {
  private legacyRepo: Repository<T>;
  private newRepo: Repository<T>;
  private migrationPhase: 'legacy-primary' | 'new-primary' | 'new-only';

  async save(entity: T): Promise<T> {
    switch (this.migrationPhase) {
      case 'legacy-primary':
        // Write to legacy first (authoritative)
        const legacyResult = await this.legacyRepo.save(entity);
        // Async write to new (fire and forget with retry)
        this.writeToNewAsync(entity);
        return legacyResult;

      case 'new-primary':
        // Write to new first (authoritative)
        const newResult = await this.newRepo.save(entity);
        // Async write to legacy for fallback
        this.writeToLegacyAsync(entity);
        return newResult;

      case 'new-only':
        // Legacy completely strangled
        return this.newRepo.save(entity);
    }
  }

  async read(id: string): Promise<T | null> {
    switch (this.migrationPhase) {
      case 'legacy-primary':
        return this.legacyRepo.findById(id);

      case 'new-primary':
        const entity = await this.newRepo.findById(id);
        if (!entity) {
          // Fallback to legacy during transition
          return this.legacyRepo.findById(id);
        }
        return entity;

      case 'new-only':
        return this.newRepo.findById(id);
    }
  }

  private async writeToNewAsync(entity: T): Promise<void> {
    try {
      await this.newRepo.save(entity);
    } catch (error) {
      // Queue for retry
      await this.retryQueue.enqueue({
        operation: 'save',
        entity,
        target: 'new',
        error
      });
    }
  }
}

// Data synchronization for historical data
class DataSynchronizer<T extends Entity> {
  async synchronize(
    source: Repository<T>,
    target: Repository<T>,
    options: SyncOptions
  ): Promise<SyncResult> {
    const result: SyncResult = {
      processed: 0,
      synced: 0,
      failed: 0,
      errors: []
    };

    // Stream data in batches to avoid memory issues
    const stream = source.streamAll({ batchSize: options.batchSize });

    for await (const batch of stream) {
      result.processed += batch.length;

      const transformed = await Promise.all(
        batch.map(entity => this.transform(entity))
      );

      try {
        await target.saveMany(transformed);
        result.synced += batch.length;
      } catch (error) {
        result.failed += batch.length;
        result.errors.push({
          batch: batch.map(e => e.id),
          error: error.message
        });
      }

      // Progress callback
      if (options.onProgress) {
        options.onProgress(result);
      }
    }

    return result;
  }

  private async transform(entity: T): Promise<T> {
    // Apply any necessary transformations for new schema
    return entity;
  }
}
```

## Core Concepts

### Migration Phases

A typical strangler migration progresses through distinct phases:

```
Phase 1: Assessment & Planning
├── Inventory legacy assets
├── Map dependencies
├── Define migration order
├── Set up monitoring
└── Establish rollback procedures

Phase 2: Foundation
├── Deploy strangler facade
├── Set up dual infrastructure
├── Implement feature flags
├── Create comparison testing
└── Establish metrics baseline

Phase 3: Incremental Migration
├── Migrate first component (low risk)
├── Validate with shadow traffic
├── Promote to production traffic
├── Monitor and compare
└── Iterate for remaining components

Phase 4: Completion
├── Migrate final components
├── Remove legacy dependencies
├── Decommission legacy system
├── Archive legacy code/data
└── Document lessons learned
```

### Component Selection Criteria

Choose initial components for migration carefully:

```typescript
interface MigrationCandidate {
  component: string;
  factors: MigrationFactors;
  score: number;
}

interface MigrationFactors {
  // Technical factors
  couplingLevel: number;        // 1-10, lower is better
  testCoverage: number;         // percentage
  documentationQuality: number; // 1-10
  technicalDebt: number;        // 1-10, lower is better

  // Business factors
  businessValue: number;        // 1-10
  userImpact: number;           // 1-10, lower is better for first migration
  changeFrequency: number;      // changes per month

  // Risk factors
  rollbackComplexity: number;   // 1-10, lower is better
  dataComplexity: number;       // 1-10, lower is better
}

function calculateMigrationPriority(
  candidate: MigrationCandidate
): number {
  const { factors } = candidate;

  // Weighted scoring for first migrations
  // Favor: low coupling, high test coverage, low risk
  const score = (
    (10 - factors.couplingLevel) * 2 +
    (factors.testCoverage / 10) * 1.5 +
    (10 - factors.rollbackComplexity) * 2 +
    (10 - factors.dataComplexity) * 1.5 +
    factors.businessValue * 1 +
    (10 - factors.userImpact) * 1.5
  );

  return score;
}

// Example: Prioritize components for migration
const candidates: MigrationCandidate[] = [
  {
    component: 'User Authentication',
    factors: {
      couplingLevel: 3,
      testCoverage: 80,
      documentationQuality: 7,
      technicalDebt: 4,
      businessValue: 9,
      userImpact: 8,
      changeFrequency: 2,
      rollbackComplexity: 5,
      dataComplexity: 6
    },
    score: 0
  },
  {
    component: 'Notification Service',
    factors: {
      couplingLevel: 2,
      testCoverage: 90,
      documentationQuality: 8,
      technicalDebt: 2,
      businessValue: 5,
      userImpact: 3,
      changeFrequency: 1,
      rollbackComplexity: 2,
      dataComplexity: 2
    },
    score: 0
  }
];

// Notification Service scores higher for first migration
// (low coupling, low risk, low user impact)
```

### Traffic Routing Strategies

Multiple strategies for routing traffic during migration:

```typescript
// Canary routing - gradually increase traffic to new system
class CanaryRouter {
  private canaryPercentage: number = 0;

  setCanaryPercentage(percentage: number): void {
    this.canaryPercentage = Math.min(100, Math.max(0, percentage));
  }

  shouldRouteToNew(request: Request): boolean {
    // Consistent routing for same user (sticky sessions)
    const userId = this.extractUserId(request);
    const hash = this.hashUserId(userId);
    return (hash % 100) < this.canaryPercentage;
  }
}

// Feature-based routing
class FeatureRouter {
  private featureFlags: FeatureFlagService;

  shouldRouteToNew(request: Request, feature: string): boolean {
    const userId = this.extractUserId(request);
    return this.featureFlags.isEnabled(feature, userId);
  }
}

// Header-based routing (for testing)
class HeaderRouter {
  shouldRouteToNew(request: Request): boolean {
    // Allow explicit routing via header
    const routeHeader = request.headers.get('X-Route-To');
    if (routeHeader === 'new') return true;
    if (routeHeader === 'legacy') return false;

    // Default behavior
    return false;
  }
}

// Combined routing strategy
class CompositeRouter {
  private strategies: RoutingStrategy[];

  shouldRouteToNew(request: Request): boolean {
    for (const strategy of this.strategies) {
      const decision = strategy.evaluate(request);
      if (decision !== null) {
        return decision;
      }
    }
    return false; // Default to legacy
  }
}
```

### Verification and Comparison

Verify new implementation matches legacy behavior:

```typescript
// Shadow testing - run both systems, compare results
class ShadowTestRunner {
  async runShadowTest(
    request: Request,
    legacySystem: System,
    newSystem: System
  ): Promise<ShadowTestResult> {
    const startTime = Date.now();

    // Execute both in parallel
    const [legacyResponse, newResponse] = await Promise.allSettled([
      this.executeWithTimeout(legacySystem.handle(request), 5000),
      this.executeWithTimeout(newSystem.handle(request), 5000)
    ]);

    const result: ShadowTestResult = {
      requestId: request.id,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      legacy: this.extractResult(legacyResponse),
      new: this.extractResult(newResponse),
      comparison: null
    };

    // Compare results
    if (legacyResponse.status === 'fulfilled' &&
        newResponse.status === 'fulfilled') {
      result.comparison = this.compareResponses(
        legacyResponse.value,
        newResponse.value
      );
    }

    return result;
  }

  private compareResponses(
    legacy: Response,
    newResp: Response
  ): ComparisonResult {
    return {
      statusMatch: legacy.status === newResp.status,
      bodyMatch: this.compareBody(legacy.body, newResp.body),
      headerDifferences: this.compareHeaders(legacy.headers, newResp.headers),
      performanceDelta: newResp.duration - legacy.duration
    };
  }

  private compareBody(legacy: any, newBody: any): BodyComparison {
    // Deep comparison with configurable tolerance
    const diff = deepDiff(legacy, newBody, {
      ignoreFields: ['timestamp', 'requestId'], // Fields expected to differ
      numericTolerance: 0.001 // For floating point comparisons
    });

    return {
      match: diff.length === 0,
      differences: diff
    };
  }
}

// Continuous verification in production
class ProductionVerifier {
  private sampleRate: number = 0.01; // 1% of traffic

  async verify(request: Request, response: Response): Promise<void> {
    if (Math.random() > this.sampleRate) return;

    // Async verification - don't block response
    setImmediate(async () => {
      try {
        const legacyResponse = await this.callLegacy(request);
        const comparison = this.compare(response, legacyResponse);

        if (!comparison.match) {
          await this.reportDiscrepancy({
            request,
            newResponse: response,
            legacyResponse,
            comparison
          });
        }
      } catch (error) {
        this.logger.warn('Verification failed', { error, requestId: request.id });
      }
    });
  }
}
```

## Code Examples

### Complete Strangler Facade Implementation

```typescript
// Full-featured strangler facade with all routing capabilities
import { Request, Response } from 'express';
import { CircuitBreaker } from './circuit-breaker';
import { MetricsCollector } from './metrics';
import { Logger } from './logger';

interface RouteConfig {
  path: string;
  method: string;
  target: 'legacy' | 'new' | 'both';
  canaryPercentage?: number;
  featureFlag?: string;
  fallbackToLegacy?: boolean;
  timeout?: number;
}

interface SystemConfig {
  baseUrl: string;
  timeout: number;
  circuitBreaker: CircuitBreakerConfig;
}

class StranglerFacade {
  private routes: Map<string, RouteConfig> = new Map();
  private legacyCircuitBreaker: CircuitBreaker;
  private newCircuitBreaker: CircuitBreaker;
  private metrics: MetricsCollector;
  private logger: Logger;

  constructor(
    private legacyConfig: SystemConfig,
    private newConfig: SystemConfig,
    private featureFlagService: FeatureFlagService
  ) {
    this.legacyCircuitBreaker = new CircuitBreaker(legacyConfig.circuitBreaker);
    this.newCircuitBreaker = new CircuitBreaker(newConfig.circuitBreaker);
    this.metrics = new MetricsCollector();
    this.logger = new Logger('StranglerFacade');
  }

  registerRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
    this.logger.info('Route registered', { key, target: config.target });
  }

  async handleRequest(req: Request, res: Response): Promise<void> {
    const routeKey = `${req.method}:${req.path}`;
    const config = this.routes.get(routeKey) || this.getDefaultConfig(req);

    const startTime = Date.now();
    let response: Response;
    let target: string;

    try {
      const routingDecision = await this.makeRoutingDecision(req, config);
      target = routingDecision.target;

      this.logger.debug('Routing request', {
        path: req.path,
        target,
        reason: routingDecision.reason
      });

      switch (target) {
        case 'new':
          response = await this.routeToNew(req, config);
          break;
        case 'both':
          response = await this.routeToBoth(req, config);
          break;
        default:
          response = await this.routeToLegacy(req);
      }

      // Record metrics
      this.metrics.recordRequest({
        path: req.path,
        target,
        duration: Date.now() - startTime,
        status: response.status
      });

    } catch (error) {
      this.logger.error('Request failed', { error, path: req.path });

      // Fallback to legacy if configured
      if (config.fallbackToLegacy && target !== 'legacy') {
        this.logger.info('Falling back to legacy', { path: req.path });
        response = await this.routeToLegacy(req);
      } else {
        throw error;
      }
    }

    this.sendResponse(res, response);
  }

  private async makeRoutingDecision(
    req: Request,
    config: RouteConfig
  ): Promise<{ target: string; reason: string }> {
    // Check feature flag first
    if (config.featureFlag) {
      const userId = this.extractUserId(req);
      if (this.featureFlagService.isEnabled(config.featureFlag, userId)) {
        return { target: 'new', reason: 'feature_flag' };
      }
    }

    // Check canary percentage
    if (config.canaryPercentage && config.canaryPercentage > 0) {
      const userId = this.extractUserId(req);
      if (this.isInCanary(userId, config.canaryPercentage)) {
        return { target: 'new', reason: 'canary' };
      }
    }

    // Check header override (for testing)
    const routeHeader = req.headers['x-route-to'];
    if (routeHeader === 'new') {
      return { target: 'new', reason: 'header_override' };
    }

    // Default to configured target
    return { target: config.target, reason: 'default' };
  }

  private async routeToLegacy(req: Request): Promise<ProxyResponse> {
    return this.legacyCircuitBreaker.execute(async () => {
      const response = await fetch(
        `${this.legacyConfig.baseUrl}${req.path}`,
        this.buildFetchOptions(req, this.legacyConfig.timeout)
      );
      return this.parseResponse(response, 'legacy');
    });
  }

  private async routeToNew(req: Request, config: RouteConfig): Promise<ProxyResponse> {
    return this.newCircuitBreaker.execute(async () => {
      const response = await fetch(
        `${this.newConfig.baseUrl}${req.path}`,
        this.buildFetchOptions(req, config.timeout || this.newConfig.timeout)
      );
      return this.parseResponse(response, 'new');
    });
  }

  private async routeToBoth(req: Request, config: RouteConfig): Promise<ProxyResponse> {
    // Send to both systems, return legacy response (authoritative)
    const [legacyResult, newResult] = await Promise.allSettled([
      this.routeToLegacy(req),
      this.routeToNew(req, config)
    ]);

    // Log comparison asynchronously
    setImmediate(() => {
      this.compareAndLog(req, legacyResult, newResult);
    });

    // Return legacy response
    if (legacyResult.status === 'fulfilled') {
      return legacyResult.value;
    }

    // If legacy failed but new succeeded, log but still fail
    if (newResult.status === 'fulfilled') {
      this.logger.warn('Legacy failed but new succeeded', { path: req.path });
    }

    throw legacyResult.reason;
  }

  private compareAndLog(
    req: Request,
    legacyResult: PromiseSettledResult<ProxyResponse>,
    newResult: PromiseSettledResult<ProxyResponse>
  ): void {
    const comparison: ResponseComparison = {
      path: req.path,
      timestamp: new Date(),
      legacyStatus: legacyResult.status,
      newStatus: newResult.status,
      match: false
    };

    if (legacyResult.status === 'fulfilled' && newResult.status === 'fulfilled') {
      comparison.match = this.responsesMatch(
        legacyResult.value,
        newResult.value
      );
      comparison.legacyDuration = legacyResult.value.duration;
      comparison.newDuration = newResult.value.duration;
    }

    this.metrics.recordComparison(comparison);

    if (!comparison.match) {
      this.logger.warn('Response mismatch detected', comparison);
    }
  }

  private isInCanary(userId: string, percentage: number): boolean {
    const hash = this.hashString(userId);
    return (hash % 100) < percentage;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

### Database Migration with Dual-Write

```typescript
// Complete dual-write implementation with synchronization
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

class DualWriteUserRepository {
  private phase: 'legacy-primary' | 'new-primary' | 'new-only' = 'legacy-primary';
  private legacyPool: Pool;  // PostgreSQL
  private newClient: MongoClient;  // MongoDB
  private syncQueue: AsyncQueue;
  private metrics: MetricsCollector;

  constructor(legacyPool: Pool, newClient: MongoClient) {
    this.legacyPool = legacyPool;
    this.newClient = newClient;
    this.syncQueue = new AsyncQueue({ concurrency: 10 });
    this.metrics = new MetricsCollector();
  }

  setPhase(phase: 'legacy-primary' | 'new-primary' | 'new-only'): void {
    this.phase = phase;
    this.metrics.recordPhaseChange(phase);
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };

    switch (this.phase) {
      case 'legacy-primary':
        await this.createInLegacy(newUser);
        this.queueSyncToNew('create', newUser);
        break;

      case 'new-primary':
        await this.createInNew(newUser);
        this.queueSyncToLegacy('create', newUser);
        break;

      case 'new-only':
        await this.createInNew(newUser);
        break;
    }

    return newUser;
  }

  async findById(id: string): Promise<User | null> {
    switch (this.phase) {
      case 'legacy-primary':
        return this.findInLegacy(id);

      case 'new-primary':
        const user = await this.findInNew(id);
        if (user) return user;

        // Fallback to legacy during transition
        const legacyUser = await this.findInLegacy(id);
        if (legacyUser) {
          // Migrate on read
          this.queueSyncToNew('create', legacyUser);
        }
        return legacyUser;

      case 'new-only':
        return this.findInNew(id);
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const updatedData = { ...updates, updatedAt: new Date() };

    switch (this.phase) {
      case 'legacy-primary':
        const legacyResult = await this.updateInLegacy(id, updatedData);
        if (legacyResult) {
          this.queueSyncToNew('update', legacyResult);
        }
        return legacyResult;

      case 'new-primary':
        const newResult = await this.updateInNew(id, updatedData);
        if (newResult) {
          this.queueSyncToLegacy('update', newResult);
        }
        return newResult;

      case 'new-only':
        return this.updateInNew(id, updatedData);
    }
  }

  // Legacy (PostgreSQL) operations
  private async createInLegacy(user: User): Promise<void> {
    const query = `
      INSERT INTO users (id, email, name, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await this.legacyPool.query(query, [
      user.id,
      user.email,
      user.name,
      JSON.stringify(user.metadata),
      user.createdAt,
      user.updatedAt
    ]);
  }

  private async findInLegacy(id: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await this.legacyPool.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private async updateInLegacy(id: string, updates: Partial<User>): Promise<User | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.email) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.name) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.metadata) {
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(updates.metadata));
    }
    setClauses.push(`updated_at = $${paramIndex++}`);
    values.push(updates.updatedAt);
    values.push(id);

    const query = `
      UPDATE users SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.legacyPool.query(query, values);
    return result.rows.length > 0 ? this.mapLegacyRow(result.rows[0]) : null;
  }

  // New (MongoDB) operations
  private async createInNew(user: User): Promise<void> {
    const collection = this.newClient.db().collection('users');
    await collection.insertOne(user);
  }

  private async findInNew(id: string): Promise<User | null> {
    const collection = this.newClient.db().collection('users');
    return collection.findOne({ id }) as Promise<User | null>;
  }

  private async updateInNew(id: string, updates: Partial<User>): Promise<User | null> {
    const collection = this.newClient.db().collection('users');
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result as User | null;
  }

  // Sync queue operations
  private queueSyncToNew(operation: string, user: User): void {
    this.syncQueue.push(async () => {
      try {
        switch (operation) {
          case 'create':
            await this.createInNew(user);
            break;
          case 'update':
            await this.updateInNew(user.id, user);
            break;
        }
        this.metrics.recordSync('toNew', 'success');
      } catch (error) {
        this.metrics.recordSync('toNew', 'failure');
        // Re-queue with exponential backoff
        await this.retrySync('new', operation, user);
      }
    });
  }

  private queueSyncToLegacy(operation: string, user: User): void {
    this.syncQueue.push(async () => {
      try {
        switch (operation) {
          case 'create':
            await this.createInLegacy(user);
            break;
          case 'update':
            await this.updateInLegacy(user.id, user);
            break;
        }
        this.metrics.recordSync('toLegacy', 'success');
      } catch (error) {
        this.metrics.recordSync('toLegacy', 'failure');
        await this.retrySync('legacy', operation, user);
      }
    });
  }
}
```

### API Versioning with Strangler

```typescript
// API versioning strategy during migration
import express, { Router, Request, Response, NextFunction } from 'express';

interface VersionConfig {
  version: string;
  deprecated: boolean;
  sunsetDate?: Date;
  redirectTo?: string;
}

class VersionedAPIRouter {
  private routers: Map<string, Router> = new Map();
  private configs: Map<string, VersionConfig> = new Map();

  registerVersion(config: VersionConfig, router: Router): void {
    this.routers.set(config.version, router);
    this.configs.set(config.version, config);
  }

  getMiddleware(): express.RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      // Extract version from header, URL, or query param
      const version = this.extractVersion(req);
      const config = this.configs.get(version);

      if (!config) {
        return res.status(400).json({
          error: 'Invalid API version',
          supportedVersions: [...this.configs.keys()]
        });
      }

      // Add deprecation headers
      if (config.deprecated) {
        res.setHeader('Deprecation', 'true');
        if (config.sunsetDate) {
          res.setHeader('Sunset', config.sunsetDate.toUTCString());
        }
        if (config.redirectTo) {
          res.setHeader('Link', `</api/${config.redirectTo}>; rel="successor-version"`);
        }
      }

      // Route to appropriate version
      const router = this.routers.get(version);
      if (router) {
        return router(req, res, next);
      }

      next();
    };
  }

  private extractVersion(req: Request): string {
    // Check header first
    const headerVersion = req.headers['api-version'];
    if (headerVersion) return headerVersion as string;

    // Check URL path
    const pathMatch = req.path.match(/^\/v(\d+)\//);
    if (pathMatch) return `v${pathMatch[1]}`;

    // Default version
    return 'v1';
  }
}

// Usage example
const versionedAPI = new VersionedAPIRouter();

// Legacy API (v1)
const v1Router = Router();
v1Router.get('/users/:id', async (req, res) => {
  // Legacy implementation
  const user = await legacyUserService.getUser(req.params.id);
  res.json(user);
});

// New API (v2) with different response format
const v2Router = Router();
v2Router.get('/users/:id', async (req, res) => {
  // New implementation
  const user = await newUserService.getUser(req.params.id);
  res.json({
    data: user,
    meta: {
      version: 'v2',
      timestamp: new Date().toISOString()
    }
  });
});

versionedAPI.registerVersion(
  { version: 'v1', deprecated: true, sunsetDate: new Date('2026-06-01'), redirectTo: 'v2' },
  v1Router
);

versionedAPI.registerVersion(
  { version: 'v2', deprecated: false },
  v2Router
);
```

## Best Practices

### 1. Start with the Seams

Identify natural boundaries in your system where you can intercept calls:

```typescript
// Identify seams - natural boundaries for interception
interface Seam {
  name: string;
  type: 'api' | 'event' | 'database' | 'file';
  entryPoints: string[];
  dependencies: string[];
  dataFlows: DataFlow[];
}

function identifySeams(system: SystemArchitecture): Seam[] {
  const seams: Seam[] = [];

  // API endpoints are natural seams
  for (const endpoint of system.endpoints) {
    seams.push({
      name: `API: ${endpoint.path}`,
      type: 'api',
      entryPoints: [endpoint.path],
      dependencies: endpoint.serviceCalls,
      dataFlows: endpoint.dataFlows
    });
  }

  // Event handlers are natural seams
  for (const handler of system.eventHandlers) {
    seams.push({
      name: `Event: ${handler.eventType}`,
      type: 'event',
      entryPoints: [handler.eventType],
      dependencies: handler.dependencies,
      dataFlows: handler.dataFlows
    });
  }

  return seams;
}
```

### 2. Maintain Feature Parity During Migration

```typescript
// Feature parity checklist
interface FeatureParityCheck {
  feature: string;
  legacyBehavior: TestCase[];
  newBehavior: TestCase[];
  status: 'pending' | 'verified' | 'divergent';
  divergences?: Divergence[];
}

class FeatureParityValidator {
  private checks: Map<string, FeatureParityCheck> = new Map();

  async validateParity(feature: string): Promise<ValidationResult> {
    const check = this.checks.get(feature);
    if (!check) throw new Error(`Feature not found: ${feature}`);

    const results: TestResult[] = [];

    for (const testCase of check.legacyBehavior) {
      // Run test against both systems
      const legacyResult = await this.runTest(testCase, 'legacy');
      const newResult = await this.runTest(testCase, 'new');

      results.push({
        testCase: testCase.name,
        match: this.compareResults(legacyResult, newResult),
        legacy: legacyResult,
        new: newResult
      });
    }

    const allMatch = results.every(r => r.match);
    check.status = allMatch ? 'verified' : 'divergent';

    if (!allMatch) {
      check.divergences = results
        .filter(r => !r.match)
        .map(r => ({
          testCase: r.testCase,
          expected: r.legacy,
          actual: r.new
        }));
    }

    return { feature, passed: allMatch, results };
  }
}
```

### 3. Implement Robust Monitoring

```typescript
// Migration-specific metrics
interface MigrationMetrics {
  // Traffic distribution
  legacyRequests: Counter;
  newRequests: Counter;
  bothRequests: Counter;

  // Performance comparison
  legacyLatency: Histogram;
  newLatency: Histogram;

  // Error rates
  legacyErrors: Counter;
  newErrors: Counter;
  fallbacks: Counter;

  // Data consistency
  comparisonRuns: Counter;
  comparisonMatches: Counter;
  comparisonMismatches: Counter;

  // Migration progress
  migratedFeatures: Gauge;
  totalFeatures: Gauge;
}

class MigrationDashboard {
  private metrics: MigrationMetrics;

  getProgress(): MigrationProgress {
    return {
      percentComplete: (this.metrics.migratedFeatures.value /
                       this.metrics.totalFeatures.value) * 100,
      trafficOnNew: this.metrics.newRequests.value /
                    (this.metrics.legacyRequests.value +
                     this.metrics.newRequests.value) * 100,
      errorRateComparison: {
        legacy: this.metrics.legacyErrors.value / this.metrics.legacyRequests.value,
        new: this.metrics.newErrors.value / this.metrics.newRequests.value
      },
      dataConsistency: this.metrics.comparisonMatches.value /
                       this.metrics.comparisonRuns.value * 100
    };
  }

  // Alert on migration issues
  checkAlerts(): Alert[] {
    const alerts: Alert[] = [];

    // New system error rate significantly higher than legacy
    const errorRatio = this.getProgress().errorRateComparison;
    if (errorRatio.new > errorRatio.legacy * 2) {
      alerts.push({
        severity: 'warning',
        message: 'New system error rate elevated',
        metric: 'error_rate',
        threshold: errorRatio.legacy * 2,
        current: errorRatio.new
      });
    }

    // Data consistency dropping
    const consistency = this.getProgress().dataConsistency;
    if (consistency < 99) {
      alerts.push({
        severity: 'critical',
        message: 'Data consistency below threshold',
        metric: 'data_consistency',
        threshold: 99,
        current: consistency
      });
    }

    return alerts;
  }
}
```

### 4. Plan for Rollback

```typescript
// Rollback procedures
class RollbackManager {
  private snapshots: Map<string, MigrationSnapshot> = new Map();

  // Take snapshot before major migration step
  async takeSnapshot(stepId: string): Promise<void> {
    const snapshot: MigrationSnapshot = {
      id: stepId,
      timestamp: new Date(),
      routingConfig: await this.captureRoutingConfig(),
      featureFlags: await this.captureFeatureFlags(),
      dataState: await this.captureDataState()
    };
    this.snapshots.set(stepId, snapshot);
  }

  // Rollback to previous state
  async rollback(stepId: string): Promise<void> {
    const snapshot = this.snapshots.get(stepId);
    if (!snapshot) throw new Error(`Snapshot not found: ${stepId}`);

    console.log(`Rolling back to snapshot: ${stepId}`);

    // Restore routing configuration
    await this.restoreRoutingConfig(snapshot.routingConfig);

    // Restore feature flags
    await this.restoreFeatureFlags(snapshot.featureFlags);

    // Note: Data rollback may require additional steps
    if (snapshot.dataState) {
      console.warn('Data state captured - manual review required');
    }

    console.log(`Rollback to ${stepId} complete`);
  }

  // Automated rollback on error threshold
  async monitorAndRollback(
    stepId: string,
    errorThreshold: number,
    windowMs: number
  ): Promise<void> {
    const startTime = Date.now();
    let errorCount = 0;

    const checkInterval = setInterval(async () => {
      errorCount = await this.getErrorCount(stepId, windowMs);

      if (errorCount > errorThreshold) {
        console.error(`Error threshold exceeded: ${errorCount} > ${errorThreshold}`);
        clearInterval(checkInterval);
        await this.rollback(stepId);
      }

      // Stop monitoring after window
      if (Date.now() - startTime > windowMs) {
        clearInterval(checkInterval);
        console.log(`Migration step ${stepId} stable`);
      }
    }, 5000);
  }
}
```

## Common Pitfalls

### 1. Attempting Too Much at Once

```typescript
// Anti-pattern: Migrating multiple interdependent components together
async function badMigration() {
  // DON'T: Migrate user service, order service, and payment service together
  await migrateUserService();
  await migrateOrderService();  // Depends on user service
  await migratePaymentService();  // Depends on order service
  // High risk of cascading failures
}

// Better: Migrate one component at a time with validation
async function goodMigration() {
  // Migrate user service first
  await migrateUserService();
  await validateUserService();
  await monitorForStability(Duration.days(7));

  // Only then migrate dependent services
  await migrateOrderService();
  await validateOrderService();
  await monitorForStability(Duration.days(7));

  // Finally migrate payment service
  await migratePaymentService();
  await validatePaymentService();
}
```

### 2. Ignoring Data Synchronization Issues

```typescript
// Problem: Eventual consistency issues during dual-write
class DataSyncPitfalls {
  // Anti-pattern: Not handling sync failures
  async badSave(entity: Entity): Promise<void> {
    await this.legacyRepo.save(entity);
    await this.newRepo.save(entity);  // What if this fails?
  }

  // Better: Handle sync failures with retry and reconciliation
  async goodSave(entity: Entity): Promise<void> {
    // Primary write with transaction
    await this.legacyRepo.save(entity);

    // Secondary write with retry queue
    try {
      await this.newRepo.save(entity);
    } catch (error) {
      // Queue for retry
      await this.syncQueue.enqueue({
        operation: 'save',
        entity,
        retryCount: 0,
        maxRetries: 5,
        backoffMs: 1000
      });
    }
  }

  // Reconciliation job for catching drift
  async reconcile(): Promise<ReconciliationReport> {
    const legacyIds = await this.legacyRepo.getAllIds();
    const newIds = await this.newRepo.getAllIds();

    const missing = legacyIds.filter(id => !newIds.includes(id));
    const extra = newIds.filter(id => !legacyIds.includes(id));

    // Sync missing records
    for (const id of missing) {
      const entity = await this.legacyRepo.findById(id);
      await this.newRepo.save(entity);
    }

    return { missing: missing.length, extra: extra.length, synced: missing.length };
  }
}
```

### 3. Insufficient Testing During Migration

```typescript
// Anti-pattern: Migrating without comprehensive comparison testing
async function badMigrationTest() {
  // Just check if new system responds
  const response = await newSystem.get('/users/1');
  expect(response.status).toBe(200);  // Insufficient!
}

// Better: Comprehensive comparison testing
async function goodMigrationTest() {
  const testCases = await loadProductionSamples(1000);

  for (const testCase of testCases) {
    const [legacyResponse, newResponse] = await Promise.all([
      legacySystem.request(testCase),
      newSystem.request(testCase)
    ]);

    // Compare status codes
    expect(newResponse.status).toBe(legacyResponse.status);

    // Compare response bodies (with tolerance for expected differences)
    const bodyComparison = compareResponses(
      legacyResponse.body,
      newResponse.body,
      {
        ignoreFields: ['timestamp', 'requestId'],
        numericTolerance: 0.001
      }
    );
    expect(bodyComparison.match).toBe(true);

    // Compare performance
    expect(newResponse.duration).toBeLessThan(legacyResponse.duration * 1.5);
  }
}
```

### 4. Not Planning for the Cleanup Phase

```typescript
// Problem: Legacy system lingers indefinitely
interface MigrationCleanupPlan {
  phases: CleanupPhase[];
}

interface CleanupPhase {
  name: string;
  trigger: CleanupTrigger;
  actions: CleanupAction[];
  rollbackPlan: string;
}

const cleanupPlan: MigrationCleanupPlan = {
  phases: [
    {
      name: 'Remove dual-write to legacy',
      trigger: {
        type: 'metric',
        condition: 'new_system_traffic >= 100% for 7 days'
      },
      actions: [
        { type: 'config', action: 'disable_legacy_writes' },
        { type: 'alert', action: 'notify_team' }
      ],
      rollbackPlan: 're-enable dual-write, restore from legacy backup'
    },
    {
      name: 'Remove legacy read fallback',
      trigger: {
        type: 'metric',
        condition: 'legacy_reads == 0 for 14 days'
      },
      actions: [
        { type: 'config', action: 'disable_legacy_reads' },
        { type: 'code', action: 'remove_legacy_fallback_code' }
      ],
      rollbackPlan: 're-enable fallback, redeploy previous version'
    },
    {
      name: 'Decommission legacy infrastructure',
      trigger: {
        type: 'manual',
        approvers: ['platform-team', 'product-owner']
      },
      actions: [
        { type: 'infrastructure', action: 'archive_legacy_data' },
        { type: 'infrastructure', action: 'shutdown_legacy_servers' },
        { type: 'code', action: 'remove_legacy_integration_code' }
      ],
      rollbackPlan: 'restore from archived data, redeploy legacy system'
    }
  ]
};
```

## Performance Considerations

### Latency Impact of the Facade

```typescript
// Measure and minimize facade overhead
class FacadePerformanceMonitor {
  private metrics: MetricsCollector;

  async measureOverhead(request: Request): Promise<OverheadMetrics> {
    const facadeStart = process.hrtime.bigint();

    // Routing decision time
    const routingStart = process.hrtime.bigint();
    const decision = await this.makeRoutingDecision(request);
    const routingTime = Number(process.hrtime.bigint() - routingStart) / 1e6;

    // Backend call time
    const backendStart = process.hrtime.bigint();
    const response = await this.callBackend(decision.target, request);
    const backendTime = Number(process.hrtime.bigint() - backendStart) / 1e6;

    // Total facade time
    const totalTime = Number(process.hrtime.bigint() - facadeStart) / 1e6;

    return {
      routingTimeMs: routingTime,
      backendTimeMs: backendTime,
      totalTimeMs: totalTime,
      overheadMs: totalTime - backendTime
    };
  }
}

// Optimize routing decisions
class OptimizedRouter {
  private routeCache: LRUCache<string, RoutingDecision>;

  constructor() {
    this.routeCache = new LRUCache({ max: 10000, ttl: 60000 });
  }

  async route(request: Request): Promise<RoutingDecision> {
    const cacheKey = this.getCacheKey(request);

    // Check cache first
    const cached = this.routeCache.get(cacheKey);
    if (cached) return cached;

    // Compute routing decision
    const decision = await this.computeRouting(request);

    // Cache if cacheable
    if (this.isCacheable(request)) {
      this.routeCache.set(cacheKey, decision);
    }

    return decision;
  }
}
```

### Dual-Write Performance

```typescript
// Optimize dual-write operations
class OptimizedDualWrite {
  // Async secondary writes to avoid latency impact
  async writeWithAsyncSync(entity: Entity): Promise<void> {
    // Primary write (synchronous)
    await this.primaryRepo.save(entity);

    // Secondary write (asynchronous, fire-and-forget with retry)
    setImmediate(async () => {
      try {
        await this.secondaryRepo.save(entity);
      } catch (error) {
        await this.queueForRetry(entity, error);
      }
    });
  }

  // Batch secondary writes for efficiency
  private writeBatch: Entity[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  async writeWithBatching(entity: Entity): Promise<void> {
    await this.primaryRepo.save(entity);

    this.writeBatch.push(entity);

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), 100);
    }

    if (this.writeBatch.length >= 100) {
      await this.flushBatch();
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = [...this.writeBatch];
    this.writeBatch = [];

    try {
      await this.secondaryRepo.saveMany(batch);
    } catch (error) {
      // Queue individual retries
      for (const entity of batch) {
        await this.queueForRetry(entity, error);
      }
    }
  }
}
```

### Shadow Traffic Performance

```typescript
// Manage shadow traffic without impacting production
class ShadowTrafficManager {
  private shadowQueue: AsyncQueue;
  private resourceLimiter: ResourceLimiter;

  constructor() {
    // Limit shadow traffic resources
    this.shadowQueue = new AsyncQueue({
      concurrency: 10,  // Max parallel shadow requests
      timeout: 5000     // Timeout for shadow requests
    });

    this.resourceLimiter = new ResourceLimiter({
      maxCpuPercent: 10,   // Don't use more than 10% CPU for shadow
      maxMemoryMb: 512     // Memory limit for shadow operations
    });
  }

  async sendShadowRequest(request: Request): Promise<void> {
    // Check resource limits before queuing
    if (!this.resourceLimiter.canProceed()) {
      this.metrics.recordShadowDropped('resource_limit');
      return;
    }

    // Queue shadow request (non-blocking)
    this.shadowQueue.push(async () => {
      try {
        const startTime = Date.now();
        const response = await this.newSystem.request(request);

        this.metrics.recordShadowRequest({
          duration: Date.now() - startTime,
          status: response.status
        });
      } catch (error) {
        this.metrics.recordShadowError(error);
      }
    });
  }
}
```

## Real-World Scenarios

### Scenario 1: E-commerce Platform Migration

```typescript
// Migrating a monolithic e-commerce platform to microservices
interface EcommerceMigrationPlan {
  phases: MigrationPhase[];
}

const ecommerceMigration: EcommerceMigrationPlan = {
  phases: [
    {
      name: 'Phase 1: Product Catalog',
      duration: '3 months',
      components: ['product-service', 'category-service', 'search-service'],
      strategy: 'strangler',
      steps: [
        'Deploy product-service with read-only access',
        'Implement strangler facade for /api/products/*',
        'Enable shadow traffic comparison',
        'Gradual traffic shift: 1% -> 10% -> 50% -> 100%',
        'Disable legacy product endpoints'
      ]
    },
    {
      name: 'Phase 2: User Management',
      duration: '2 months',
      components: ['user-service', 'auth-service'],
      strategy: 'strangler',
      steps: [
        'Deploy user-service with legacy DB connection',
        'Implement dual-write for user data',
        'Migrate authentication to auth-service',
        'Gradual traffic shift',
        'Migrate user database to new schema'
      ]
    },
    {
      name: 'Phase 3: Order Processing',
      duration: '4 months',
      components: ['order-service', 'payment-service', 'inventory-service'],
      strategy: 'strangler',
      steps: [
        'Extract order-service with event sourcing',
        'Implement saga pattern for order flow',
        'Parallel run with comparison',
        'Gradual traffic shift with careful monitoring',
        'Decommission legacy order processing'
      ]
    }
  ]
};

// Implementation example: Product catalog migration
class ProductCatalogMigration {
  private facade: StranglerFacade;
  private legacyService: LegacyProductService;
  private newService: ProductMicroservice;

  async execute(): Promise<void> {
    // Step 1: Deploy with shadow traffic
    this.facade.registerRoute({
      path: '/api/products/*',
      method: 'GET',
      target: 'both',  // Send to both, compare results
      fallbackToLegacy: true
    });

    // Monitor for 2 weeks
    await this.monitorShadowTraffic({ duration: Duration.weeks(2) });

    // Step 2: Canary deployment
    this.facade.registerRoute({
      path: '/api/products/*',
      method: 'GET',
      target: 'new',
      canaryPercentage: 1,
      fallbackToLegacy: true
    });

    // Gradually increase canary
    for (const percentage of [1, 5, 10, 25, 50, 75, 100]) {
      this.facade.setCanaryPercentage('/api/products/*', percentage);
      await this.monitorAndValidate({ duration: Duration.days(2) });
    }

    // Step 3: Remove legacy fallback
    this.facade.registerRoute({
      path: '/api/products/*',
      method: 'GET',
      target: 'new',
      fallbackToLegacy: false
    });
  }
}
```

### Scenario 2: Financial System Migration

```typescript
// High-stakes financial system migration with strict requirements
class FinancialSystemMigration {
  private auditLog: AuditLogger;
  private complianceChecker: ComplianceChecker;

  async migrateTransactionProcessing(): Promise<void> {
    // Financial systems require extra caution
    const migrationConfig = {
      // Extended parallel run period
      parallelRunDuration: Duration.months(3),

      // 100% comparison during parallel run
      comparisonRate: 1.0,

      // Zero tolerance for discrepancies
      maxDiscrepancyRate: 0,

      // Require manual approval for each phase
      requireApproval: true,

      // Complete audit trail
      auditLevel: 'comprehensive'
    };

    // Phase 1: Read-only mirror
    await this.setupReadOnlyMirror();
    await this.validateReadConsistency(Duration.weeks(4));

    // Phase 2: Write replication (legacy authoritative)
    await this.setupWriteReplication();
    await this.validateWriteConsistency(Duration.weeks(4));

    // Compliance check
    const complianceResult = await this.complianceChecker.validate({
      dataIntegrity: true,
      auditTrail: true,
      regulatoryRequirements: ['SOX', 'PCI-DSS']
    });

    if (!complianceResult.passed) {
      throw new Error('Compliance validation failed');
    }

    // Phase 3: Controlled cutover with instant rollback capability
    await this.performCutover({
      rollbackTimeoutMs: 100,  // Instant rollback capability
      monitoringInterval: 1000,  // Check every second
      autoRollbackThreshold: {
        errorRate: 0.001,  // 0.1% error rate triggers rollback
        latencyP99: 200    // 200ms p99 latency triggers rollback
      }
    });
  }

  private async validateWriteConsistency(duration: Duration): Promise<void> {
    const startTime = Date.now();
    let totalTransactions = 0;
    let discrepancies = 0;

    while (Date.now() - startTime < duration.toMillis()) {
      // Process transaction through both systems
      const transaction = await this.getNextTransaction();

      const [legacyResult, newResult] = await Promise.all([
        this.legacySystem.processTransaction(transaction),
        this.newSystem.processTransaction(transaction)
      ]);

      totalTransactions++;

      // Compare results with financial precision
      const comparison = this.compareFinancialResults(legacyResult, newResult);

      if (!comparison.match) {
        discrepancies++;

        // Log discrepancy with full audit trail
        await this.auditLog.logDiscrepancy({
          transaction,
          legacyResult,
          newResult,
          comparison
        });

        // Immediately halt on any discrepancy for financial systems
        throw new Error(`Financial discrepancy detected: ${comparison.difference}`);
      }
    }

    console.log(`Validated ${totalTransactions} transactions with 0 discrepancies`);
  }
}
```

### Scenario 3: Legacy Mainframe Migration

```typescript
// Migrating COBOL mainframe to modern architecture
class MainframeMigration {
  private transactionBridge: MainframeBridge;
  private dataTransformer: COBOLDataTransformer;

  async migrateMainframeModule(moduleName: string): Promise<void> {
    // Step 1: Create API wrapper around mainframe
    const wrapper = await this.createMainframeWrapper(moduleName);

    // Step 2: Deploy modern service
    const modernService = await this.deployModernService(moduleName);

    // Step 3: Set up strangler facade
    const facade = new StranglerFacade({
      legacy: {
        type: 'mainframe',
        bridge: this.transactionBridge,
        transformer: this.dataTransformer
      },
      new: {
        type: 'rest',
        baseUrl: modernService.url
      }
    });

    // Step 4: Data migration with transformation
    await this.migrateData({
      source: 'mainframe',
      target: 'postgresql',
      transformer: (record) => this.transformCOBOLRecord(record),
      validation: (source, target) => this.validateDataTransformation(source, target)
    });

    // Step 5: Gradual traffic migration
    await this.migrateTraffic(facade, {
      startPercentage: 0,
      endPercentage: 100,
      incrementPercentage: 5,
      stabilizationPeriod: Duration.days(3)
    });
  }

  private transformCOBOLRecord(record: COBOLRecord): ModernRecord {
    // Transform COBOL packed decimal to standard numbers
    // Transform COBOL dates to ISO 8601
    // Transform fixed-length strings to variable length
    return {
      id: this.parsePackedDecimal(record.ID_FIELD),
      name: record.NAME_FIELD.trim(),
      amount: this.parsePackedDecimal(record.AMOUNT_FIELD) / 100,  // 2 decimal places
      date: this.parseCOBOLDate(record.DATE_FIELD),
      // ... other transformations
    };
  }
}
```

## Interview Key Points

### Core Understanding

**Q1: What is the Strangler Fig Pattern and when should you use it?**

The Strangler Fig Pattern is an incremental migration strategy that allows you to gradually replace a legacy system by routing specific functionalities to new implementations while keeping the old system operational. Key use cases:

1. **Large monolith modernization**: Breaking down monoliths into microservices
2. **Technology migration**: Moving from legacy tech stacks to modern ones
3. **Risk mitigation**: When big-bang rewrites are too risky
4. **Continuous delivery requirement**: When you can't afford extended downtime

**Q2: What are the key components of a Strangler Fig implementation?**

1. **Strangler Facade**: Routes requests between legacy and new systems
2. **Feature Flags**: Controls which functionality uses which system
3. **Dual-Write Mechanism**: Keeps data in sync during transition
4. **Comparison Testing**: Validates new implementation matches legacy behavior
5. **Monitoring & Metrics**: Tracks migration progress and system health
6. **Rollback Procedures**: Enables quick recovery if issues arise

### Technical Questions

**Q3: How do you handle data consistency during a strangler migration?**

```typescript
// Three main strategies:
// 1. Dual-write with primary/secondary designation
// 2. Event-driven synchronization
// 3. Change data capture (CDC)

// Example: Dual-write with reconciliation
class DataConsistencyStrategy {
  // Primary write + async secondary
  async write(entity: Entity): Promise<void> {
    await this.primaryRepo.save(entity);
    this.queueSecondaryWrite(entity);
  }

  // Periodic reconciliation
  async reconcile(): Promise<void> {
    const drift = await this.detectDrift();
    await this.resolveDrift(drift);
  }
}
```

**Q4: How do you validate that the new system behaves identically to the legacy system?**

1. **Shadow Traffic**: Send copies of production traffic to new system
2. **Response Comparison**: Compare responses from both systems
3. **Replay Testing**: Replay production logs through new system
4. **Chaos Testing**: Verify behavior under failure conditions

```typescript
// Shadow testing example
async function shadowTest(request: Request): Promise<void> {
  const [legacyResponse, newResponse] = await Promise.allSettled([
    legacySystem.handle(request),
    newSystem.handle(request)
  ]);

  const comparison = compare(legacyResponse, newResponse);
  await logComparison(comparison);
}
```

### Practical Questions

**Q5: What are the common pitfalls in strangler migrations?**

1. **Scope creep**: Trying to migrate too much at once
2. **Insufficient testing**: Not validating behavior parity
3. **Data synchronization issues**: Eventual consistency problems
4. **Performance degradation**: Facade overhead not considered
5. **Indefinite parallel run**: Never completing the migration

**Q6: How do you decide the order of migration?**

Consider these factors when prioritizing components:

1. **Coupling**: Start with loosely coupled components
2. **Risk**: Begin with lower-risk, non-critical features
3. **Business Value**: Balance risk with business impact
4. **Dependencies**: Migrate dependencies before dependents
5. **Team Familiarity**: Start with well-understood components

## Further Reading

### Official Resources

- [Martin Fowler - Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html) - Original pattern description
- [Microsoft - Strangler Fig Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/strangler-fig) - Azure architecture guidance
- [AWS - Strangler Fig Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/strangler-fig.html) - AWS implementation guide

### Books

- "Building Microservices" by Sam Newman - Chapter on migration patterns
- "Monolith to Microservices" by Sam Newman - Detailed migration strategies
- "Working Effectively with Legacy Code" by Michael Feathers - Finding seams in legacy code
- "Refactoring Databases" by Scott Ambler - Data migration strategies

### Technical Articles

- [Strangler Fig Pattern: Best Practices](https://www.nginx.com/blog/strangler-pattern-modernizing-legacy-applications/) - NGINX implementation guide
- [Legacy Application Strangulation](https://paulhammant.com/2013/07/14/legacy-application-strangulation-case-studies/) - Case studies
- [The Strangler Pattern in Practice](https://www.thoughtworks.com/insights/blog/strangler-pattern-practice) - ThoughtWorks experience

### Tools and Frameworks

- [Nginx](https://nginx.org/) - Reverse proxy for facade implementation
- [Envoy Proxy](https://www.envoyproxy.io/) - Service mesh for traffic routing
- [LaunchDarkly](https://launchdarkly.com/) - Feature flag management
- [Debezium](https://debezium.io/) - Change data capture for data sync

### Related Patterns

- [Branch by Abstraction](https://martinfowler.com/bliki/BranchByAbstraction.html) - Code-level migration pattern
- [Parallel Change](https://martinfowler.com/bliki/ParallelChange.html) - Expand-migrate-contract pattern
- [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) - Controlling feature rollout
- [Anti-Corruption Layer](https://docs.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer) - Protecting new systems from legacy

---

The Strangler Fig Pattern provides a safe, incremental approach to modernizing legacy systems. By routing traffic through a facade and gradually migrating functionality, organizations can reduce risk, maintain business continuity, and deliver value throughout the migration process. Success requires careful planning, robust monitoring, and disciplined execution of each migration phase.
