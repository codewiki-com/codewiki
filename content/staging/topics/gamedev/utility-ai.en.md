---
title: Utility AI System Design
description: "Implement intelligent AI decision systems: utility functions, scoring curves, and dynamic behavior selection"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - utility AI
  - decision systems
  - game AI
  - scoring
status: imported
origin: old/src/content/docs/gamedev/utility-ai.en.md
divergence: 0.293
issues: []
legacy:
  category: GameDev
  subcategory: AI
  order: 19
  lastUpdated: 2026-01-07
---

Utility AI is a powerful decision-making architecture that enables game characters to evaluate and select actions based on contextual scoring. Unlike finite state machines or behavior trees that rely on explicit conditions, Utility AI uses mathematical functions to calculate the desirability of each possible action, then selects the most appropriate one. This approach creates more nuanced, believable, and emergent AI behaviors.

## Understanding Utility AI

### Core Philosophy

Utility AI is built on a simple but powerful concept: every action has a utility score representing how desirable it is in the current context. The AI evaluates all available actions, calculates their utility scores, and selects the one with the highest value.

**Key Principles:**

- **Everything is Quantifiable**: Every factor influencing a decision is converted to a numerical score
- **Context-Driven**: Scores change based on the current game state
- **Emergent Behavior**: Complex behaviors emerge from simple scoring rules
- **Graceful Degradation**: Actions smoothly transition as conditions change

**Comparison with Other AI Systems:**

| Aspect | FSM | Behavior Trees | Utility AI |
|--------|-----|----------------|------------|
| Decision Logic | Explicit transitions | Priority-based | Score-based |
| Flexibility | Low | Medium | High |
| Emergent Behavior | None | Limited | Natural |
| Authoring Complexity | Low | Medium | Medium-High |
| Runtime Overhead | Low | Low | Medium |
| Debugging | Easy | Medium | Harder |

### When to Use Utility AI

**Ideal Use Cases:**

- NPCs with multiple competing needs (survival games, life simulations)
- Combat AI requiring tactical decision-making
- Characters that need to feel "alive" and responsive
- Systems where priorities should shift smoothly
- Games requiring believable opponent AI

**Less Suitable For:**

- Simple linear behavior sequences
- Highly scripted narrative moments
- Situations requiring precise, deterministic outcomes
- Performance-critical systems with thousands of agents

### Basic Architecture

```
+-------------------+
|   World State     |
+-------------------+
         |
         v
+-------------------+
|  Considerations   | (Input sensors)
+-------------------+
         |
         v
+-------------------+
| Response Curves   | (Transform inputs to scores)
+-------------------+
         |
         v
+-------------------+
|     Actions       | (Aggregate consideration scores)
+-------------------+
         |
         v
+-------------------+
| Action Selection  | (Choose highest utility)
+-------------------+
         |
         v
+-------------------+
|    Execution      |
+-------------------+
```

## Utility Function Design

The utility function is the heart of the system. It takes various inputs about the world state and produces a single utility score for an action.

### Basic Utility Calculation

```typescript
interface Consideration {
  name: string;
  getValue(): number;        // Returns 0-1 normalized value
  getWeight(): number;       // Importance multiplier
  getCurve(): ResponseCurve; // Transforms raw value
}

interface Action {
  name: string;
  considerations: Consideration[];
  baseScore: number;
  execute(): void;
}

class UtilityCalculator {
  /**
   * Calculate the final utility score for an action
   * using the compensation formula for combining considerations
   */
  calculateUtility(action: Action): number {
    const considerations = action.considerations;

    if (considerations.length === 0) {
      return action.baseScore;
    }

    let totalScore = 1.0;

    for (const consideration of considerations) {
      const rawValue = consideration.getValue();
      const transformedValue = consideration.getCurve().evaluate(rawValue);
      const weightedValue = this.applyWeight(transformedValue, consideration.getWeight());

      totalScore *= weightedValue;
    }

    // Compensation factor to prevent score collapse with many considerations
    const compensationFactor = 1 - (1 / considerations.length);
    const compensatedScore = totalScore + (1 - totalScore) * compensationFactor * totalScore;

    return compensatedScore * action.baseScore;
  }

  private applyWeight(score: number, weight: number): number {
    // Weight affects how much a low score impacts the final result
    // Higher weight = more influence
    return Math.pow(score, 1 / weight);
  }
}
```

### Scoring Methods

There are several approaches to combining consideration scores:

**Multiplicative Scoring:**
```typescript
// All considerations must be satisfied (AND logic)
function multiplicativeScore(scores: number[]): number {
  return scores.reduce((acc, score) => acc * score, 1.0);
}
```

**Additive Scoring:**
```typescript
// Considerations contribute independently (OR-like logic)
function additiveScore(scores: number[], weights: number[]): number {
  let total = 0;
  let weightSum = 0;

  for (let i = 0; i < scores.length; i++) {
    total += scores[i] * weights[i];
    weightSum += weights[i];
  }

  return total / weightSum;
}
```

**Hybrid Scoring:**
```typescript
// Combine multiplicative base with additive bonuses
function hybridScore(
  mustHave: number[],    // Multiplicative requirements
  niceToHave: number[],  // Additive bonuses
  bonusWeight: number = 0.3
): number {
  const baseScore = multiplicativeScore(mustHave);
  const bonusScore = niceToHave.reduce((a, b) => a + b, 0) / niceToHave.length;

  return baseScore * (1 + bonusScore * bonusWeight);
}
```

### Normalization Strategies

All input values should be normalized to a consistent range (typically 0-1) for proper comparison:

```typescript
class Normalizer {
  /**
   * Linear normalization: maps value from [min, max] to [0, 1]
   */
  static linear(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  /**
   * Inverse normalization: higher input = lower output
   */
  static inverse(value: number, min: number, max: number): number {
    return 1 - this.linear(value, min, max);
  }

  /**
   * Logarithmic normalization: for values with exponential distribution
   */
  static logarithmic(value: number, min: number, max: number): number {
    if (value <= min) return 0;
    if (value >= max) return 1;

    const logMin = Math.log(min + 1);
    const logMax = Math.log(max + 1);
    const logValue = Math.log(value + 1);

    return (logValue - logMin) / (logMax - logMin);
  }

  /**
   * Step normalization: discrete thresholds
   */
  static step(value: number, thresholds: number[]): number {
    let score = 0;
    for (const threshold of thresholds) {
      if (value >= threshold) {
        score += 1 / thresholds.length;
      }
    }
    return score;
  }
}
```

## Response Curves

Response curves transform normalized input values into utility scores. They define how an AI values different levels of a consideration and are crucial for creating nuanced behavior.

### Common Curve Types

```typescript
interface ResponseCurve {
  evaluate(input: number): number;
}

/**
 * Linear curve: output changes proportionally with input
 * Use for: straightforward relationships
 */
class LinearCurve implements ResponseCurve {
  constructor(
    private slope: number = 1,
    private intercept: number = 0
  ) {}

  evaluate(input: number): number {
    return Math.max(0, Math.min(1, this.slope * input + this.intercept));
  }
}

/**
 * Quadratic curve: accelerating or decelerating response
 * Use for: diminishing returns or increasing urgency
 */
class QuadraticCurve implements ResponseCurve {
  constructor(
    private exponent: number = 2,
    private flip: boolean = false
  ) {}

  evaluate(input: number): number {
    const value = Math.pow(input, this.exponent);
    return this.flip ? 1 - value : value;
  }
}

/**
 * Logistic (S-curve): smooth transition between extremes
 * Use for: threshold-based decisions with soft boundaries
 */
class LogisticCurve implements ResponseCurve {
  constructor(
    private steepness: number = 10,
    private midpoint: number = 0.5
  ) {}

  evaluate(input: number): number {
    return 1 / (1 + Math.exp(-this.steepness * (input - this.midpoint)));
  }
}

/**
 * Gaussian (bell curve): peaks at a specific value
 * Use for: optimal ranges (e.g., ideal combat distance)
 */
class GaussianCurve implements ResponseCurve {
  constructor(
    private peak: number = 0.5,
    private width: number = 0.2
  ) {}

  evaluate(input: number): number {
    const distance = input - this.peak;
    return Math.exp(-(distance * distance) / (2 * this.width * this.width));
  }
}

/**
 * Piecewise linear: custom breakpoints
 * Use for: complex, designer-defined relationships
 */
class PiecewiseCurve implements ResponseCurve {
  constructor(
    private points: Array<{ x: number; y: number }>
  ) {
    // Sort points by x value
    this.points.sort((a, b) => a.x - b.x);
  }

  evaluate(input: number): number {
    if (this.points.length === 0) return 0;
    if (input <= this.points[0].x) return this.points[0].y;
    if (input >= this.points[this.points.length - 1].x) {
      return this.points[this.points.length - 1].y;
    }

    // Find surrounding points and interpolate
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      if (input >= p1.x && input <= p2.x) {
        const t = (input - p1.x) / (p2.x - p1.x);
        return p1.y + t * (p2.y - p1.y);
      }
    }

    return 0;
  }
}
```

### Visual Representation

```
Linear (slope=1)          Quadratic (exp=2)         Logistic (S-curve)
      |                         |                         |
    1 +-----*               1 +       *               1 +      ****
      |    *                  |     **                  |    **
      |   *                   |   **                    |   *
      |  *                    |  *                      |  *
      | *                     | *                       | *
    0 +*----+----             0 +----+----             0 +**--+----
      0    1                    0    1                    0    1

Gaussian (peak=0.5)       Inverse Linear            Piecewise Custom
      |                         |                         |
    1 +    *                1 +*                      1 +--*
      |   * *                 | *                       |   \
      |  *   *                |  *                      |    *--*
      | *     *               |   *                     |        \
      |*       *              |    *                    |         *
    0 +----+----             0 +----*----             0 +----+----*
      0    1                    0    1                    0    1
```

### Curve Selection Guide

| Curve Type | Best For | Example Use Case |
|------------|----------|------------------|
| Linear | Proportional relationships | Resource collection priority |
| Quadratic (exp < 1) | Diminishing returns | Healing when already healthy |
| Quadratic (exp > 1) | Increasing urgency | Fleeing when health is critical |
| Logistic | Threshold decisions | Engaging when confident |
| Gaussian | Optimal ranges | Ideal engagement distance |
| Inverse | Avoiding conditions | Distance from danger |
| Piecewise | Custom behaviors | Designer-tuned responses |

### Curve Factory

```typescript
class CurveFactory {
  static create(config: CurveConfig): ResponseCurve {
    switch (config.type) {
      case 'linear':
        return new LinearCurve(config.slope, config.intercept);

      case 'quadratic':
        return new QuadraticCurve(config.exponent, config.flip);

      case 'logistic':
        return new LogisticCurve(config.steepness, config.midpoint);

      case 'gaussian':
        return new GaussianCurve(config.peak, config.width);

      case 'piecewise':
        return new PiecewiseCurve(config.points);

      case 'constant':
        return {
          evaluate: () => config.value
        };

      default:
        return new LinearCurve();
    }
  }
}

interface CurveConfig {
  type: 'linear' | 'quadratic' | 'logistic' | 'gaussian' | 'piecewise' | 'constant';
  slope?: number;
  intercept?: number;
  exponent?: number;
  flip?: boolean;
  steepness?: number;
  midpoint?: number;
  peak?: number;
  width?: number;
  points?: Array<{ x: number; y: number }>;
  value?: number;
}
```

## Action Selection Strategies

Once all actions have utility scores, we need a strategy for selecting which action to execute.

### Selection Methods

```typescript
interface ActionScore {
  action: Action;
  score: number;
}

class ActionSelector {
  /**
   * Highest score wins - deterministic, predictable
   */
  static selectHighest(scores: ActionScore[]): Action | null {
    if (scores.length === 0) return null;

    let best = scores[0];
    for (const candidate of scores) {
      if (candidate.score > best.score) {
        best = candidate;
      }
    }

    return best.action;
  }

  /**
   * Weighted random - introduces variety while respecting scores
   */
  static selectWeightedRandom(scores: ActionScore[]): Action | null {
    if (scores.length === 0) return null;

    const totalWeight = scores.reduce((sum, s) => sum + s.score, 0);
    if (totalWeight === 0) return scores[0].action;

    let random = Math.random() * totalWeight;

    for (const candidate of scores) {
      random -= candidate.score;
      if (random <= 0) {
        return candidate.action;
      }
    }

    return scores[scores.length - 1].action;
  }

  /**
   * Top N random - select randomly from the top performers
   */
  static selectFromTopN(scores: ActionScore[], n: number = 3): Action | null {
    if (scores.length === 0) return null;

    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const topN = sorted.slice(0, Math.min(n, sorted.length));

    return this.selectWeightedRandom(topN);
  }

  /**
   * Threshold selection - only consider actions above a minimum score
   */
  static selectAboveThreshold(
    scores: ActionScore[],
    threshold: number = 0.1
  ): Action | null {
    const validScores = scores.filter(s => s.score >= threshold);

    if (validScores.length === 0) {
      // Fall back to highest if nothing meets threshold
      return this.selectHighest(scores);
    }

    return this.selectHighest(validScores);
  }

  /**
   * Dual utility - combines current utility with momentum/commitment
   */
  static selectWithMomentum(
    scores: ActionScore[],
    currentAction: Action | null,
    momentumBonus: number = 0.2,
    switchThreshold: number = 0.1
  ): Action | null {
    if (scores.length === 0) return null;

    // Apply momentum bonus to current action
    const adjustedScores = scores.map(s => ({
      action: s.action,
      score: s.action === currentAction
        ? s.score + momentumBonus
        : s.score
    }));

    const best = this.selectHighest(adjustedScores);

    // Only switch if new action is significantly better
    if (currentAction && best !== currentAction) {
      const currentScore = adjustedScores.find(s => s.action === currentAction)?.score ?? 0;
      const bestScore = adjustedScores.find(s => s.action === best)?.score ?? 0;

      if (bestScore - currentScore < switchThreshold) {
        return currentAction;
      }
    }

    return best;
  }
}
```

### Action Buckets

Group actions into priority buckets for more structured decision-making:

```typescript
enum ActionPriority {
  Critical = 0,    // Must-do actions (survival)
  High = 1,        // Important actions (combat)
  Medium = 2,      // Normal actions (exploration)
  Low = 3,         // Optional actions (idle behaviors)
}

interface BucketedAction extends Action {
  priority: ActionPriority;
  minimumScore: number;  // Threshold to be considered
}

class BucketedSelector {
  selectAction(actions: BucketedAction[], calculator: UtilityCalculator): Action | null {
    // Group actions by priority
    const buckets = new Map<ActionPriority, ActionScore[]>();

    for (const action of actions) {
      const score = calculator.calculateUtility(action);

      // Skip actions below their minimum threshold
      if (score < action.minimumScore) continue;

      if (!buckets.has(action.priority)) {
        buckets.set(action.priority, []);
      }
      buckets.get(action.priority)!.push({ action, score });
    }

    // Process buckets in priority order
    const priorities = [
      ActionPriority.Critical,
      ActionPriority.High,
      ActionPriority.Medium,
      ActionPriority.Low
    ];

    for (const priority of priorities) {
      const bucket = buckets.get(priority);
      if (bucket && bucket.length > 0) {
        // Select from this bucket
        return ActionSelector.selectHighest(bucket);
      }
    }

    return null;
  }
}
```

### Preventing Decision Oscillation

A common issue is the AI rapidly switching between actions. Strategies to prevent this:

```typescript
class StableDecisionMaker {
  private currentAction: Action | null = null;
  private actionStartTime: number = 0;
  private decisionHistory: Action[] = [];

  constructor(
    private minActionDuration: number = 500,  // ms
    private historySize: number = 5,
    private oscillationPenalty: number = 0.3
  ) {}

  selectAction(scores: ActionScore[]): Action | null {
    const now = Date.now();

    // Enforce minimum action duration
    if (this.currentAction && now - this.actionStartTime < this.minActionDuration) {
      return this.currentAction;
    }

    // Apply oscillation penalty
    const adjustedScores = scores.map(s => ({
      action: s.action,
      score: this.applyOscillationPenalty(s)
    }));

    // Apply momentum to current action
    const finalScores = adjustedScores.map(s => ({
      action: s.action,
      score: s.action === this.currentAction ? s.score * 1.15 : s.score
    }));

    const selected = ActionSelector.selectHighest(finalScores);

    if (selected !== this.currentAction) {
      this.actionStartTime = now;
      this.updateHistory(selected);
    }

    this.currentAction = selected;
    return selected;
  }

  private applyOscillationPenalty(score: ActionScore): number {
    // Count recent occurrences of this action
    const recentCount = this.decisionHistory.filter(
      a => a === score.action
    ).length;

    // Penalize actions that appear frequently in history
    const penalty = (recentCount / this.historySize) * this.oscillationPenalty;
    return score.score * (1 - penalty);
  }

  private updateHistory(action: Action | null): void {
    if (!action) return;

    this.decisionHistory.push(action);
    if (this.decisionHistory.length > this.historySize) {
      this.decisionHistory.shift();
    }
  }
}
```

## Weights and Priorities

Weights allow designers to fine-tune the relative importance of different considerations without modifying the core scoring logic.

### Weight Application Strategies

```typescript
class WeightedConsideration {
  constructor(
    private consideration: Consideration,
    private weight: number = 1.0,
    private required: boolean = false
  ) {}

  /**
   * Multiplicative weight: affects the exponent of the score
   * Lower scores are penalized more heavily
   */
  evaluateMultiplicative(): number {
    const rawScore = this.consideration.getValue();
    const curvedScore = this.consideration.getCurve().evaluate(rawScore);

    // Weight as exponent: score^(1/weight)
    // weight > 1 makes low scores less punishing
    // weight < 1 makes low scores more punishing
    return Math.pow(curvedScore, 1 / this.weight);
  }

  /**
   * Additive weight: simple multiplication
   * Useful for bonus considerations
   */
  evaluateAdditive(): number {
    const rawScore = this.consideration.getValue();
    const curvedScore = this.consideration.getCurve().evaluate(rawScore);
    return curvedScore * this.weight;
  }

  /**
   * Veto weight: can completely eliminate an action
   */
  evaluateWithVeto(vetoThreshold: number = 0.01): number | null {
    const score = this.evaluateMultiplicative();

    if (this.required && score < vetoThreshold) {
      return null; // Veto the action entirely
    }

    return score;
  }
}
```

### Dynamic Weight Adjustment

Weights can change based on context, personality, or game state:

```typescript
interface DynamicWeight {
  baseWeight: number;
  modifiers: WeightModifier[];
}

interface WeightModifier {
  condition: () => boolean;
  multiplier: number;
  description: string;
}

class DynamicWeightSystem {
  private weights: Map<string, DynamicWeight> = new Map();

  registerWeight(
    id: string,
    baseWeight: number,
    modifiers: WeightModifier[] = []
  ): void {
    this.weights.set(id, { baseWeight, modifiers });
  }

  getWeight(id: string): number {
    const weight = this.weights.get(id);
    if (!weight) return 1.0;

    let finalWeight = weight.baseWeight;

    for (const modifier of weight.modifiers) {
      if (modifier.condition()) {
        finalWeight *= modifier.multiplier;
      }
    }

    return finalWeight;
  }
}

// Example usage: Combat AI personality
const weightSystem = new DynamicWeightSystem();

// Aggressive AI weights attacking higher when health is full
weightSystem.registerWeight('attack', 1.0, [
  {
    condition: () => currentHealth > 0.8,
    multiplier: 1.5,
    description: 'Aggressive when healthy'
  },
  {
    condition: () => enemyHealth < 0.3,
    multiplier: 1.3,
    description: 'Finish off weak enemies'
  }
]);

// Defensive AI weights defense higher when hurt
weightSystem.registerWeight('defend', 1.0, [
  {
    condition: () => currentHealth < 0.4,
    multiplier: 2.0,
    description: 'Defensive when hurt'
  },
  {
    condition: () => hasShield,
    multiplier: 1.2,
    description: 'Prefers defense with shield'
  }
]);
```

### Personality Profiles

```typescript
interface PersonalityProfile {
  name: string;
  traits: Map<string, number>;  // consideration -> weight modifier
}

class PersonalitySystem {
  private profiles: Map<string, PersonalityProfile> = new Map();

  registerProfile(profile: PersonalityProfile): void {
    this.profiles.set(profile.name, profile);
  }

  getModifier(profileName: string, consideration: string): number {
    const profile = this.profiles.get(profileName);
    if (!profile) return 1.0;

    return profile.traits.get(consideration) ?? 1.0;
  }
}

// Example personality profiles
const aggressive: PersonalityProfile = {
  name: 'aggressive',
  traits: new Map([
    ['attack', 1.5],
    ['defend', 0.7],
    ['flee', 0.3],
    ['heal', 0.8],
    ['pursue', 1.4],
    ['ambush', 0.6]
  ])
};

const cautious: PersonalityProfile = {
  name: 'cautious',
  traits: new Map([
    ['attack', 0.8],
    ['defend', 1.4],
    ['flee', 1.3],
    ['heal', 1.5],
    ['pursue', 0.6],
    ['ambush', 1.2]
  ])
};

const berserker: PersonalityProfile = {
  name: 'berserker',
  traits: new Map([
    ['attack', 2.0],
    ['defend', 0.3],
    ['flee', 0.1],
    ['heal', 0.5],
    ['pursue', 1.8],
    ['ambush', 0.4]
  ])
};
```

## Complete Implementation Example

A comprehensive example of a combat AI using Utility AI:

### Core Classes

```typescript
// ============================================
// Core Interfaces and Types
// ============================================

interface GameContext {
  agent: Agent;
  target: Agent | null;
  nearbyEnemies: Agent[];
  nearbyAllies: Agent[];
  environment: EnvironmentData;
}

interface Agent {
  health: number;
  maxHealth: number;
  position: Vector2;
  ammo: number;
  maxAmmo: number;
  isInCover: boolean;
  lastDamageTime: number;
  currentWeapon: Weapon;
}

interface EnvironmentData {
  nearestCover: CoverPoint | null;
  nearestHealthPack: Vector2 | null;
  nearestAmmoCache: Vector2 | null;
}

interface Vector2 {
  x: number;
  y: number;
}

interface CoverPoint {
  position: Vector2;
  quality: number;  // 0-1
}

interface Weapon {
  name: string;
  damage: number;
  range: number;
  accuracy: number;
}

// ============================================
// Consideration Implementations
// ============================================

class HealthConsideration implements Consideration {
  name = 'health';
  private curve: ResponseCurve;

  constructor(
    private context: () => GameContext,
    curveConfig?: CurveConfig
  ) {
    // Default: quadratic curve, higher urgency when low health
    this.curve = CurveFactory.create(curveConfig ?? {
      type: 'quadratic',
      exponent: 0.5,  // Square root - diminishing returns at high health
      flip: false
    });
  }

  getValue(): number {
    const ctx = this.context();
    return ctx.agent.health / ctx.agent.maxHealth;
  }

  getWeight(): number {
    return 1.0;
  }

  getCurve(): ResponseCurve {
    return this.curve;
  }
}

class DistanceToTargetConsideration implements Consideration {
  name = 'distanceToTarget';
  private curve: ResponseCurve;

  constructor(
    private context: () => GameContext,
    private optimalDistance: number = 10,
    private maxDistance: number = 50
  ) {
    // Gaussian curve - peaks at optimal distance
    this.curve = new GaussianCurve(
      this.optimalDistance / this.maxDistance,
      0.3
    );
  }

  getValue(): number {
    const ctx = this.context();
    if (!ctx.target) return 0;

    const distance = this.calculateDistance(
      ctx.agent.position,
      ctx.target.position
    );

    return Math.min(distance / this.maxDistance, 1);
  }

  getWeight(): number {
    return 1.0;
  }

  getCurve(): ResponseCurve {
    return this.curve;
  }

  private calculateDistance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

class AmmoConsideration implements Consideration {
  name = 'ammo';
  private curve: ResponseCurve;

  constructor(private context: () => GameContext) {
    // Logistic curve - sharp drop when ammo is low
    this.curve = new LogisticCurve(15, 0.2);
  }

  getValue(): number {
    const ctx = this.context();
    return ctx.agent.ammo / ctx.agent.maxAmmo;
  }

  getWeight(): number {
    return 1.2;
  }

  getCurve(): ResponseCurve {
    return this.curve;
  }
}

class ThreatLevelConsideration implements Consideration {
  name = 'threatLevel';
  private curve: ResponseCurve;

  constructor(private context: () => GameContext) {
    this.curve = new QuadraticCurve(2, true);  // Inverted quadratic
  }

  getValue(): number {
    const ctx = this.context();
    const enemyCount = ctx.nearbyEnemies.length;
    const allyCount = ctx.nearbyAllies.length;

    // Normalize threat based on enemy-ally ratio
    const ratio = enemyCount / (allyCount + 1);
    return Math.min(ratio / 3, 1);  // Cap at 3:1 ratio
  }

  getWeight(): number {
    return 1.5;
  }

  getCurve(): ResponseCurve {
    return this.curve;
  }
}

class InCoverConsideration implements Consideration {
  name = 'inCover';

  constructor(private context: () => GameContext) {}

  getValue(): number {
    return this.context().agent.isInCover ? 1 : 0;
  }

  getWeight(): number {
    return 1.0;
  }

  getCurve(): ResponseCurve {
    return new LinearCurve();
  }
}

class RecentDamageConsideration implements Consideration {
  name = 'recentDamage';
  private curve: ResponseCurve;

  constructor(
    private context: () => GameContext,
    private damageWindow: number = 3000  // ms
  ) {
    this.curve = new QuadraticCurve(2, true);
  }

  getValue(): number {
    const ctx = this.context();
    const timeSinceDamage = Date.now() - ctx.agent.lastDamageTime;
    return Math.max(0, 1 - timeSinceDamage / this.damageWindow);
  }

  getWeight(): number {
    return 1.3;
  }

  getCurve(): ResponseCurve {
    return this.curve;
  }
}

// ============================================
// Action Implementations
// ============================================

class AttackAction implements Action {
  name = 'attack';
  baseScore = 1.0;
  considerations: Consideration[];

  constructor(context: () => GameContext) {
    this.considerations = [
      new HealthConsideration(context),
      new DistanceToTargetConsideration(context, 15, 50),
      new AmmoConsideration(context),
    ];
  }

  execute(): void {
    console.log('Executing: Attack target');
    // Implementation: Fire weapon at target
  }
}

class TakeCoverAction implements Action {
  name = 'takeCover';
  baseScore = 0.9;
  considerations: Consideration[];

  constructor(context: () => GameContext) {
    const getContext = context;

    this.considerations = [
      // Low health makes cover more attractive
      {
        name: 'lowHealth',
        getValue: () => 1 - (getContext().agent.health / getContext().agent.maxHealth),
        getWeight: () => 1.5,
        getCurve: () => new QuadraticCurve(2)
      },
      // Not already in cover
      {
        name: 'notInCover',
        getValue: () => getContext().agent.isInCover ? 0 : 1,
        getWeight: () => 2.0,
        getCurve: () => new LinearCurve()
      },
      // Cover is available nearby
      {
        name: 'coverAvailable',
        getValue: () => getContext().environment.nearestCover ? 1 : 0,
        getWeight: () => 2.0,
        getCurve: () => new LinearCurve()
      },
      new ThreatLevelConsideration(context),
      new RecentDamageConsideration(context),
    ];
  }

  execute(): void {
    console.log('Executing: Move to cover');
    // Implementation: Navigate to nearest cover point
  }
}

class ReloadAction implements Action {
  name = 'reload';
  baseScore = 0.8;
  considerations: Consideration[];

  constructor(context: () => GameContext) {
    const getContext = context;

    this.considerations = [
      // Low ammo is critical
      {
        name: 'needsAmmo',
        getValue: () => 1 - (getContext().agent.ammo / getContext().agent.maxAmmo),
        getWeight: () => 2.0,
        getCurve: () => new QuadraticCurve(2)
      },
      // Safer to reload when in cover
      new InCoverConsideration(context),
      // Threat level - don't reload if under heavy fire
      {
        name: 'safeToreload',
        getValue: () => {
          const threat = new ThreatLevelConsideration(context);
          return 1 - threat.getValue();
        },
        getWeight: () => 1.2,
        getCurve: () => new LinearCurve()
      },
    ];
  }

  execute(): void {
    console.log('Executing: Reload weapon');
    // Implementation: Reload current weapon
  }
}

class HealAction implements Action {
  name = 'heal';
  baseScore = 0.85;
  considerations: Consideration[];

  constructor(context: () => GameContext) {
    const getContext = context;

    this.considerations = [
      // Need healing
      {
        name: 'needsHealing',
        getValue: () => 1 - (getContext().agent.health / getContext().agent.maxHealth),
        getWeight: () => 2.0,
        getCurve: () => new QuadraticCurve(1.5)
      },
      // Health pack available
      {
        name: 'healthAvailable',
        getValue: () => getContext().environment.nearestHealthPack ? 1 : 0,
        getWeight: () => 2.0,
        getCurve: () => new LinearCurve()
      },
      // Safe to heal
      {
        name: 'safeToHeal',
        getValue: () => {
          const ctx = getContext();
          return ctx.agent.isInCover || ctx.nearbyEnemies.length === 0 ? 1 : 0.3;
        },
        getWeight: () => 1.5,
        getCurve: () => new LinearCurve()
      },
    ];
  }

  execute(): void {
    console.log('Executing: Seek health pack');
    // Implementation: Navigate to health pack
  }
}

class FleeAction implements Action {
  name = 'flee';
  baseScore = 0.7;
  considerations: Consideration[];

  constructor(context: () => GameContext) {
    const getContext = context;

    this.considerations = [
      // Critical health
      {
        name: 'criticalHealth',
        getValue: () => {
          const healthPercent = getContext().agent.health / getContext().agent.maxHealth;
          return healthPercent < 0.2 ? 1 : 0;
        },
        getWeight: () => 3.0,
        getCurve: () => new LinearCurve()
      },
      // Overwhelmed by enemies
      {
        name: 'overwhelmed',
        getValue: () => {
          const ctx = getContext();
          const ratio = ctx.nearbyEnemies.length / (ctx.nearbyAllies.length + 1);
          return Math.min(ratio / 4, 1);
        },
        getWeight: () => 2.0,
        getCurve: () => new QuadraticCurve(2)
      },
      // No ammo
      {
        name: 'noAmmo',
        getValue: () => getContext().agent.ammo === 0 ? 1 : 0,
        getWeight: () => 1.5,
        getCurve: () => new LinearCurve()
      },
    ];
  }

  execute(): void {
    console.log('Executing: Flee from combat');
    // Implementation: Run away from enemies
  }
}

class AdvanceAction implements Action {
  name = 'advance';
  baseScore = 0.75;
  considerations: Consideration[];

  constructor(context: () => GameContext) {
    const getContext = context;

    this.considerations = [
      // High health
      new HealthConsideration(context),
      // Good ammo supply
      new AmmoConsideration(context),
      // Not too many enemies
      {
        name: 'manageableThreat',
        getValue: () => {
          const threat = new ThreatLevelConsideration(context);
          return 1 - threat.getValue();
        },
        getWeight: () => 1.3,
        getCurve: () => new LinearCurve()
      },
      // Target exists and is far
      {
        name: 'targetFar',
        getValue: () => {
          const ctx = getContext();
          if (!ctx.target) return 0;

          const dx = ctx.agent.position.x - ctx.target.position.x;
          const dy = ctx.agent.position.y - ctx.target.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Want to advance if target is far
          return Math.min(distance / 30, 1);
        },
        getWeight: () => 1.5,
        getCurve: () => new QuadraticCurve(0.5)  // Square root
      },
    ];
  }

  execute(): void {
    console.log('Executing: Advance toward target');
    // Implementation: Move closer to target
  }
}
```

### AI Controller

```typescript
class CombatAIController {
  private calculator: UtilityCalculator;
  private decisionMaker: StableDecisionMaker;
  private actions: Action[];
  private context: GameContext;

  constructor(initialContext: GameContext) {
    this.context = initialContext;
    this.calculator = new UtilityCalculator();
    this.decisionMaker = new StableDecisionMaker(300, 5, 0.2);

    const getContext = () => this.context;

    this.actions = [
      new AttackAction(getContext),
      new TakeCoverAction(getContext),
      new ReloadAction(getContext),
      new HealAction(getContext),
      new FleeAction(getContext),
      new AdvanceAction(getContext),
    ];
  }

  updateContext(context: GameContext): void {
    this.context = context;
  }

  think(): Action | null {
    const scores: ActionScore[] = [];

    for (const action of this.actions) {
      const score = this.calculator.calculateUtility(action);
      scores.push({ action, score });

      // Debug output
      console.log(`${action.name}: ${score.toFixed(3)}`);
    }

    console.log('---');

    return this.decisionMaker.selectAction(scores);
  }

  update(): void {
    const selectedAction = this.think();

    if (selectedAction) {
      console.log(`Selected: ${selectedAction.name}`);
      selectedAction.execute();
    }
  }
}

// Usage example
const gameContext: GameContext = {
  agent: {
    health: 45,
    maxHealth: 100,
    position: { x: 10, y: 20 },
    ammo: 8,
    maxAmmo: 30,
    isInCover: false,
    lastDamageTime: Date.now() - 1000,
    currentWeapon: {
      name: 'Rifle',
      damage: 25,
      range: 50,
      accuracy: 0.8
    }
  },
  target: {
    health: 60,
    maxHealth: 100,
    position: { x: 35, y: 25 },
    ammo: 15,
    maxAmmo: 30,
    isInCover: true,
    lastDamageTime: Date.now() - 5000,
    currentWeapon: {
      name: 'Rifle',
      damage: 25,
      range: 50,
      accuracy: 0.8
    }
  },
  nearbyEnemies: [/* enemy agents */],
  nearbyAllies: [/* ally agents */],
  environment: {
    nearestCover: { position: { x: 15, y: 18 }, quality: 0.8 },
    nearestHealthPack: { x: 5, y: 30 },
    nearestAmmoCache: { x: 20, y: 10 }
  }
};

const ai = new CombatAIController(gameContext);
ai.update();
```

## Integration with Behavior Trees

Utility AI and Behavior Trees can complement each other effectively. Use Utility AI for high-level decision-making and Behavior Trees for action execution.

### Hybrid Architecture

```typescript
// ============================================
// Behavior Tree Nodes
// ============================================

enum NodeStatus {
  Success,
  Failure,
  Running
}

interface BehaviorNode {
  tick(): NodeStatus;
  reset(): void;
}

class SequenceNode implements BehaviorNode {
  private currentChild = 0;

  constructor(private children: BehaviorNode[]) {}

  tick(): NodeStatus {
    while (this.currentChild < this.children.length) {
      const status = this.children[this.currentChild].tick();

      if (status === NodeStatus.Running) {
        return NodeStatus.Running;
      }

      if (status === NodeStatus.Failure) {
        this.reset();
        return NodeStatus.Failure;
      }

      this.currentChild++;
    }

    this.reset();
    return NodeStatus.Success;
  }

  reset(): void {
    this.currentChild = 0;
    this.children.forEach(c => c.reset());
  }
}

class SelectorNode implements BehaviorNode {
  private currentChild = 0;

  constructor(private children: BehaviorNode[]) {}

  tick(): NodeStatus {
    while (this.currentChild < this.children.length) {
      const status = this.children[this.currentChild].tick();

      if (status === NodeStatus.Running) {
        return NodeStatus.Running;
      }

      if (status === NodeStatus.Success) {
        this.reset();
        return NodeStatus.Success;
      }

      this.currentChild++;
    }

    this.reset();
    return NodeStatus.Failure;
  }

  reset(): void {
    this.currentChild = 0;
    this.children.forEach(c => c.reset());
  }
}

// ============================================
// Utility-Driven Selector
// ============================================

interface UtilityBehavior {
  node: BehaviorNode;
  utility: () => number;
}

class UtilitySelectorNode implements BehaviorNode {
  private currentBehavior: UtilityBehavior | null = null;
  private evaluationInterval: number;
  private lastEvaluationTime: number = 0;

  constructor(
    private behaviors: UtilityBehavior[],
    evaluationIntervalMs: number = 500
  ) {
    this.evaluationInterval = evaluationIntervalMs;
  }

  tick(): NodeStatus {
    const now = Date.now();

    // Re-evaluate utilities periodically
    if (now - this.lastEvaluationTime > this.evaluationInterval) {
      this.selectBestBehavior();
      this.lastEvaluationTime = now;
    }

    if (!this.currentBehavior) {
      return NodeStatus.Failure;
    }

    const status = this.currentBehavior.node.tick();

    if (status !== NodeStatus.Running) {
      // Behavior completed, force re-evaluation
      this.lastEvaluationTime = 0;
    }

    return status;
  }

  private selectBestBehavior(): void {
    let bestBehavior: UtilityBehavior | null = null;
    let bestUtility = -Infinity;

    for (const behavior of this.behaviors) {
      const utility = behavior.utility();
      if (utility > bestUtility) {
        bestUtility = utility;
        bestBehavior = behavior;
      }
    }

    if (bestBehavior !== this.currentBehavior) {
      this.currentBehavior?.node.reset();
      this.currentBehavior = bestBehavior;
    }
  }

  reset(): void {
    this.currentBehavior?.node.reset();
    this.currentBehavior = null;
    this.lastEvaluationTime = 0;
  }
}

// ============================================
// Example: Combat AI with Hybrid Architecture
// ============================================

// Action leaf nodes
class MoveToPositionNode implements BehaviorNode {
  constructor(
    private getTarget: () => Vector2,
    private getAgent: () => Agent,
    private arrivalThreshold: number = 1
  ) {}

  tick(): NodeStatus {
    const target = this.getTarget();
    const agent = this.getAgent();

    const dx = target.x - agent.position.x;
    const dy = target.y - agent.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.arrivalThreshold) {
      return NodeStatus.Success;
    }

    // Move towards target (implementation would update agent position)
    console.log(`Moving towards (${target.x}, ${target.y})`);
    return NodeStatus.Running;
  }

  reset(): void {}
}

class FireWeaponNode implements BehaviorNode {
  constructor(
    private getAgent: () => Agent,
    private getTarget: () => Agent | null
  ) {}

  tick(): NodeStatus {
    const agent = this.getAgent();
    const target = this.getTarget();

    if (!target) {
      return NodeStatus.Failure;
    }

    if (agent.ammo <= 0) {
      return NodeStatus.Failure;
    }

    console.log('Firing weapon!');
    return NodeStatus.Success;
  }

  reset(): void {}
}

class WaitNode implements BehaviorNode {
  private startTime: number = 0;

  constructor(private duration: number) {}

  tick(): NodeStatus {
    if (this.startTime === 0) {
      this.startTime = Date.now();
    }

    if (Date.now() - this.startTime >= this.duration) {
      return NodeStatus.Success;
    }

    return NodeStatus.Running;
  }

  reset(): void {
    this.startTime = 0;
  }
}

// Build hybrid AI
function createHybridCombatAI(context: () => GameContext): BehaviorNode {
  const getAgent = () => context().agent;
  const getTarget = () => context().target;

  // Attack behavior tree
  const attackBehavior = new SequenceNode([
    new MoveToPositionNode(
      () => context().target?.position ?? { x: 0, y: 0 },
      getAgent,
      15  // Optimal firing distance
    ),
    new FireWeaponNode(getAgent, getTarget),
    new WaitNode(500)  // Cooldown
  ]);

  // Take cover behavior tree
  const coverBehavior = new SequenceNode([
    new MoveToPositionNode(
      () => context().environment.nearestCover?.position ?? { x: 0, y: 0 },
      getAgent
    ),
    new WaitNode(1000)  // Stay in cover briefly
  ]);

  // Heal behavior tree
  const healBehavior = new SequenceNode([
    new MoveToPositionNode(
      () => context().environment.nearestHealthPack ?? { x: 0, y: 0 },
      getAgent
    ),
    new WaitNode(500)  // Pickup animation
  ]);

  // Combine with utility selector
  return new UtilitySelectorNode([
    {
      node: attackBehavior,
      utility: () => {
        const ctx = context();
        if (!ctx.target) return 0;

        const healthScore = ctx.agent.health / ctx.agent.maxHealth;
        const ammoScore = ctx.agent.ammo / ctx.agent.maxAmmo;

        return healthScore * ammoScore * 0.9;
      }
    },
    {
      node: coverBehavior,
      utility: () => {
        const ctx = context();
        if (!ctx.environment.nearestCover) return 0;
        if (ctx.agent.isInCover) return 0;

        const healthRisk = 1 - (ctx.agent.health / ctx.agent.maxHealth);
        const recentDamage = Date.now() - ctx.agent.lastDamageTime < 2000 ? 0.3 : 0;

        return (healthRisk + recentDamage) * 0.85;
      }
    },
    {
      node: healBehavior,
      utility: () => {
        const ctx = context();
        if (!ctx.environment.nearestHealthPack) return 0;

        const healthNeed = 1 - (ctx.agent.health / ctx.agent.maxHealth);
        const safetyBonus = ctx.agent.isInCover ? 0.2 : 0;

        return healthNeed * 0.8 + safetyBonus;
      }
    }
  ]);
}
```

## Comparison with GOAP

Goal-Oriented Action Planning (GOAP) is another sophisticated AI architecture. Understanding the differences helps you choose the right approach.

### Conceptual Differences

| Aspect | Utility AI | GOAP |
|--------|------------|------|
| **Decision Basis** | Scores each action independently | Plans sequences to achieve goals |
| **Planning Horizon** | Immediate (one action) | Long-term (action sequences) |
| **Adaptability** | High - re-evaluates constantly | Medium - replanning has cost |
| **Emergent Behavior** | Natural | Limited to planned sequences |
| **Resource Cost** | O(n) per decision | O(n!) worst case for planning |
| **Best For** | Reactive, tactical decisions | Strategic, multi-step goals |

### When to Choose Each

**Choose Utility AI when:**
- Actions are relatively independent
- Context changes rapidly
- You want smooth, reactive behavior
- Many competing concerns exist
- Behaviors should feel organic

**Choose GOAP when:**
- Actions have preconditions and effects
- Multi-step plans are needed
- Goals are clearly defined
- Actions have sequential dependencies
- Strategic thinking is important

### Combining Both Approaches

```typescript
// Use Utility AI to select goals for GOAP
interface Goal {
  name: string;
  priority: number;
  targetState: WorldState;
  isValid: () => boolean;
}

class UtilityGoalSelector {
  private goals: Goal[] = [];
  private considerations: Map<string, Consideration[]> = new Map();
  private calculator = new UtilityCalculator();

  addGoal(goal: Goal, considerations: Consideration[]): void {
    this.goals.push(goal);
    this.considerations.set(goal.name, considerations);
  }

  selectGoal(): Goal | null {
    let bestGoal: Goal | null = null;
    let bestScore = -Infinity;

    for (const goal of this.goals) {
      if (!goal.isValid()) continue;

      const considerations = this.considerations.get(goal.name) ?? [];
      const action: Action = {
        name: goal.name,
        baseScore: goal.priority,
        considerations,
        execute: () => {}
      };

      const score = this.calculator.calculateUtility(action);

      if (score > bestScore) {
        bestScore = score;
        bestGoal = goal;
      }
    }

    return bestGoal;
  }
}

// GOAP planner uses the selected goal
interface WorldState {
  [key: string]: boolean | number;
}

interface GOAPAction {
  name: string;
  cost: number;
  preconditions: Partial<WorldState>;
  effects: Partial<WorldState>;
  execute: () => Promise<void>;
}

class GOAPPlanner {
  plan(
    currentState: WorldState,
    goalState: WorldState,
    availableActions: GOAPAction[]
  ): GOAPAction[] | null {
    // A* search through action space
    // (Simplified - full implementation would be more complex)

    const openSet: Array<{
      state: WorldState;
      actions: GOAPAction[];
      cost: number;
    }> = [{ state: currentState, actions: [], cost: 0 }];

    const closedSet = new Set<string>();

    while (openSet.length > 0) {
      // Get lowest cost node
      openSet.sort((a, b) => a.cost - b.cost);
      const current = openSet.shift()!;

      const stateKey = JSON.stringify(current.state);
      if (closedSet.has(stateKey)) continue;
      closedSet.add(stateKey);

      // Check if goal is satisfied
      if (this.satisfiesGoal(current.state, goalState)) {
        return current.actions;
      }

      // Expand with available actions
      for (const action of availableActions) {
        if (this.canExecute(action, current.state)) {
          const newState = this.applyAction(action, current.state);
          const newCost = current.cost + action.cost;

          openSet.push({
            state: newState,
            actions: [...current.actions, action],
            cost: newCost
          });
        }
      }
    }

    return null; // No plan found
  }

  private satisfiesGoal(state: WorldState, goal: WorldState): boolean {
    for (const [key, value] of Object.entries(goal)) {
      if (state[key] !== value) return false;
    }
    return true;
  }

  private canExecute(action: GOAPAction, state: WorldState): boolean {
    for (const [key, value] of Object.entries(action.preconditions)) {
      if (state[key] !== value) return false;
    }
    return true;
  }

  private applyAction(action: GOAPAction, state: WorldState): WorldState {
    return { ...state, ...action.effects };
  }
}

// Combined system
class HybridGOAPUtilityAI {
  private goalSelector: UtilityGoalSelector;
  private planner: GOAPPlanner;
  private currentPlan: GOAPAction[] = [];
  private currentGoal: Goal | null = null;

  constructor() {
    this.goalSelector = new UtilityGoalSelector();
    this.planner = new GOAPPlanner();
  }

  update(currentState: WorldState, availableActions: GOAPAction[]): void {
    // Use Utility AI to select the best goal
    const newGoal = this.goalSelector.selectGoal();

    // Replan if goal changed or plan is empty
    if (newGoal !== this.currentGoal || this.currentPlan.length === 0) {
      this.currentGoal = newGoal;

      if (this.currentGoal) {
        const plan = this.planner.plan(
          currentState,
          this.currentGoal.targetState,
          availableActions
        );

        this.currentPlan = plan ?? [];
      }
    }

    // Execute next action in plan
    if (this.currentPlan.length > 0) {
      const action = this.currentPlan.shift()!;
      action.execute();
    }
  }
}
```

## Performance Optimization

Utility AI can become expensive with many agents or considerations. Optimization strategies:

### Evaluation Budgeting

```typescript
class BudgetedUtilityAI {
  private lastFullEvaluation: number = 0;
  private cachedScores: Map<string, number> = new Map();
  private dirtyActions: Set<string> = new Set();

  constructor(
    private actions: Action[],
    private calculator: UtilityCalculator,
    private fullEvaluationInterval: number = 1000,  // ms
    private partialEvaluationCount: number = 3
  ) {}

  evaluate(): ActionScore[] {
    const now = Date.now();

    // Full evaluation periodically
    if (now - this.lastFullEvaluation > this.fullEvaluationInterval) {
      return this.fullEvaluation();
    }

    // Partial evaluation: only re-evaluate dirty or top actions
    return this.partialEvaluation();
  }

  private fullEvaluation(): ActionScore[] {
    this.lastFullEvaluation = Date.now();
    this.dirtyActions.clear();

    const scores: ActionScore[] = [];

    for (const action of this.actions) {
      const score = this.calculator.calculateUtility(action);
      this.cachedScores.set(action.name, score);
      scores.push({ action, score });
    }

    return scores;
  }

  private partialEvaluation(): ActionScore[] {
    // Get cached scores
    const scores: ActionScore[] = this.actions.map(action => ({
      action,
      score: this.cachedScores.get(action.name) ?? 0
    }));

    // Sort by score to get top actions
    scores.sort((a, b) => b.score - a.score);

    // Re-evaluate top N and dirty actions
    const toEvaluate = new Set<string>();

    // Add top actions
    for (let i = 0; i < this.partialEvaluationCount; i++) {
      if (scores[i]) {
        toEvaluate.add(scores[i].action.name);
      }
    }

    // Add dirty actions
    this.dirtyActions.forEach(name => toEvaluate.add(name));
    this.dirtyActions.clear();

    // Re-evaluate selected actions
    for (const score of scores) {
      if (toEvaluate.has(score.action.name)) {
        score.score = this.calculator.calculateUtility(score.action);
        this.cachedScores.set(score.action.name, score.score);
      }
    }

    return scores;
  }

  markDirty(actionName: string): void {
    this.dirtyActions.add(actionName);
  }
}
```

### Hierarchical Evaluation

```typescript
class HierarchicalUtilityAI {
  private categories: Map<string, Action[]> = new Map();
  private categoryScores: Map<string, number> = new Map();

  constructor(private calculator: UtilityCalculator) {}

  addAction(category: string, action: Action): void {
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(action);
  }

  evaluate(): ActionScore[] {
    // First: evaluate category-level utilities
    const categoryResults: Array<{ category: string; score: number }> = [];

    for (const [category, actions] of this.categories) {
      // Use max action score as category score
      let maxScore = 0;
      for (const action of actions) {
        const score = this.quickEvaluate(action);
        maxScore = Math.max(maxScore, score);
      }
      this.categoryScores.set(category, maxScore);
      categoryResults.push({ category, score: maxScore });
    }

    // Sort categories by score
    categoryResults.sort((a, b) => b.score - a.score);

    // Only fully evaluate top categories
    const scores: ActionScore[] = [];
    const topCategories = categoryResults.slice(0, 2);

    for (const { category } of topCategories) {
      const actions = this.categories.get(category)!;
      for (const action of actions) {
        const score = this.calculator.calculateUtility(action);
        scores.push({ action, score });
      }
    }

    return scores;
  }

  private quickEvaluate(action: Action): number {
    // Fast approximation - only evaluate first few considerations
    const quickConsiderations = action.considerations.slice(0, 2);
    let score = action.baseScore;

    for (const consideration of quickConsiderations) {
      const value = consideration.getCurve().evaluate(consideration.getValue());
      score *= value;
    }

    return score;
  }
}
```

### Spatial Partitioning for Context

```typescript
class SpatialUtilityContext {
  private grid: Map<string, Agent[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 50) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  updateAgent(agent: Agent): void {
    const key = this.getCellKey(agent.position.x, agent.position.y);

    // Remove from old cells (simplified - real implementation would track this)
    // Add to new cell
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(agent);
  }

  getNearbyAgents(position: Vector2, radius: number): Agent[] {
    const nearby: Agent[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);

    const centerCellX = Math.floor(position.x / this.cellSize);
    const centerCellY = Math.floor(position.y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const agents = this.grid.get(key) ?? [];

        for (const agent of agents) {
          const dist = this.distance(position, agent.position);
          if (dist <= radius) {
            nearby.push(agent);
          }
        }
      }
    }

    return nearby;
  }

  private distance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
```

## Debugging and Visualization

Effective debugging tools are essential for tuning Utility AI systems.

### Debug Logging System

```typescript
interface UtilityDebugLog {
  timestamp: number;
  agentId: string;
  evaluations: ActionEvaluation[];
  selectedAction: string;
  selectionReason: string;
}

interface ActionEvaluation {
  actionName: string;
  baseScore: number;
  considerations: ConsiderationEvaluation[];
  finalScore: number;
}

interface ConsiderationEvaluation {
  name: string;
  rawValue: number;
  curvedValue: number;
  weight: number;
  contribution: number;
}

class UtilityDebugger {
  private logs: UtilityDebugLog[] = [];
  private maxLogs: number = 1000;
  private enabled: boolean = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  logEvaluation(
    agentId: string,
    actions: Action[],
    calculator: UtilityCalculator,
    selectedAction: Action | null
  ): void {
    if (!this.enabled) return;

    const evaluations: ActionEvaluation[] = [];

    for (const action of actions) {
      const considerations: ConsiderationEvaluation[] = [];

      for (const consideration of action.considerations) {
        const rawValue = consideration.getValue();
        const curvedValue = consideration.getCurve().evaluate(rawValue);
        const weight = consideration.getWeight();

        considerations.push({
          name: consideration.name,
          rawValue,
          curvedValue,
          weight,
          contribution: Math.pow(curvedValue, 1 / weight)
        });
      }

      evaluations.push({
        actionName: action.name,
        baseScore: action.baseScore,
        considerations,
        finalScore: calculator.calculateUtility(action)
      });
    }

    // Sort by final score
    evaluations.sort((a, b) => b.finalScore - a.finalScore);

    const log: UtilityDebugLog = {
      timestamp: Date.now(),
      agentId,
      evaluations,
      selectedAction: selectedAction?.name ?? 'none',
      selectionReason: this.determineReason(evaluations, selectedAction)
    };

    this.logs.push(log);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private determineReason(
    evaluations: ActionEvaluation[],
    selected: Action | null
  ): string {
    if (!selected) return 'No valid actions';

    const selectedEval = evaluations.find(e => e.actionName === selected.name);
    if (!selectedEval) return 'Unknown';

    // Find the most influential consideration
    const sorted = [...selectedEval.considerations].sort(
      (a, b) => b.contribution - a.contribution
    );

    if (sorted.length > 0) {
      return `High ${sorted[0].name} (${sorted[0].contribution.toFixed(2)})`;
    }

    return 'Base score';
  }

  getRecentLogs(count: number = 10): UtilityDebugLog[] {
    return this.logs.slice(-count);
  }

  exportToJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  printSummary(log: UtilityDebugLog): void {
    console.log(`\n=== Utility AI Decision [${log.agentId}] ===`);
    console.log(`Selected: ${log.selectedAction} (${log.selectionReason})`);
    console.log('\nAction Scores:');

    for (const eval of log.evaluations) {
      console.log(`  ${eval.actionName}: ${eval.finalScore.toFixed(3)}`);

      for (const cons of eval.considerations) {
        const bar = this.makeBar(cons.contribution);
        console.log(`    ${cons.name}: ${bar} ${cons.contribution.toFixed(2)}`);
      }
    }
  }

  private makeBar(value: number, width: number = 20): string {
    const filled = Math.round(value * width);
    return '[' + '='.repeat(filled) + ' '.repeat(width - filled) + ']';
  }
}
```

### Visual Debugger

```typescript
// For game engines with rendering capabilities
interface DebugRenderer {
  drawText(x: number, y: number, text: string, color: string): void;
  drawBar(x: number, y: number, width: number, height: number,
          fillPercent: number, fillColor: string, bgColor: string): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, color: string): void;
}

class UtilityVisualDebugger {
  constructor(
    private renderer: DebugRenderer,
    private debugger: UtilityDebugger
  ) {}

  renderAgentDebug(
    agent: Agent,
    screenX: number,
    screenY: number
  ): void {
    const logs = this.debugger.getRecentLogs(1);
    if (logs.length === 0) return;

    const log = logs[0];
    let y = screenY;

    // Agent header
    this.renderer.drawText(screenX, y, `Agent: ${log.agentId}`, '#ffffff');
    y += 20;

    // Selected action
    this.renderer.drawText(
      screenX, y,
      `Action: ${log.selectedAction}`,
      '#00ff00'
    );
    y += 25;

    // Action scores with bars
    for (const evaluation of log.evaluations.slice(0, 5)) {
      const isSelected = evaluation.actionName === log.selectedAction;
      const color = isSelected ? '#00ff00' : '#888888';

      this.renderer.drawText(
        screenX, y,
        `${evaluation.actionName}`,
        color
      );

      this.renderer.drawBar(
        screenX + 100, y - 2,
        100, 12,
        evaluation.finalScore,
        color,
        '#333333'
      );

      this.renderer.drawText(
        screenX + 210, y,
        evaluation.finalScore.toFixed(2),
        color
      );

      y += 18;
    }
  }

  renderConsiderationBreakdown(
    evaluation: ActionEvaluation,
    screenX: number,
    screenY: number
  ): void {
    let y = screenY;

    this.renderer.drawText(
      screenX, y,
      `${evaluation.actionName} Breakdown`,
      '#ffff00'
    );
    y += 20;

    for (const cons of evaluation.considerations) {
      // Raw value
      this.renderer.drawBar(
        screenX, y,
        50, 8,
        cons.rawValue,
        '#0088ff',
        '#333333'
      );

      // Curved value
      this.renderer.drawBar(
        screenX + 60, y,
        50, 8,
        cons.curvedValue,
        '#ff8800',
        '#333333'
      );

      // Contribution
      this.renderer.drawBar(
        screenX + 120, y,
        50, 8,
        cons.contribution,
        '#00ff88',
        '#333333'
      );

      this.renderer.drawText(
        screenX + 180, y,
        cons.name,
        '#ffffff'
      );

      y += 15;
    }
  }
}
```

## Best Practices and Common Pitfalls

### Design Guidelines

**Do:**
- Start with few considerations and add complexity gradually
- Normalize all inputs to 0-1 range
- Use meaningful curve types that match the intended behavior
- Test individual considerations before combining them
- Implement debugging tools early
- Document why each consideration exists

**Don't:**
- Create too many considerations per action (3-5 is usually sufficient)
- Use identical curves for all considerations
- Ignore the compensation factor for multiplicative scoring
- Forget to handle edge cases (null targets, empty lists)
- Over-tune weights without understanding the underlying behavior

### Common Pitfalls

**Score Collapse:**
```typescript
// PROBLEM: Many considerations multiply to near-zero
const badScores = [0.8, 0.7, 0.6, 0.5, 0.4].reduce((a, b) => a * b);
// Result: 0.0672 - almost zero!

// SOLUTION: Use compensation factor
function compensatedMultiply(scores: number[]): number {
  const product = scores.reduce((a, b) => a * b, 1);
  const compensation = 1 - (1 / scores.length);
  return product + (1 - product) * compensation * product;
}
```

**Action Starvation:**
```typescript
// PROBLEM: One action always wins, others never execute
// SOLUTION: Add variety mechanisms

class VarietySystem {
  private executionCounts: Map<string, number> = new Map();

  adjustScore(actionName: string, baseScore: number): number {
    const count = this.executionCounts.get(actionName) ?? 0;
    const totalExecutions = Array.from(this.executionCounts.values())
      .reduce((a, b) => a + b, 0);

    if (totalExecutions === 0) return baseScore;

    const proportion = count / totalExecutions;
    // Penalize over-used actions
    const penalty = proportion > 0.5 ? (proportion - 0.5) * 0.3 : 0;

    return baseScore * (1 - penalty);
  }

  recordExecution(actionName: string): void {
    const count = this.executionCounts.get(actionName) ?? 0;
    this.executionCounts.set(actionName, count + 1);
  }
}
```

**Oscillation:**
```typescript
// PROBLEM: AI rapidly switches between actions
// Already covered in Section 4.3, but adding hysteresis:

class HysteresisSystem {
  private currentAction: string | null = null;
  private switchThreshold: number;

  constructor(threshold: number = 0.15) {
    this.switchThreshold = threshold;
  }

  shouldSwitch(
    currentScore: number,
    newActionName: string,
    newScore: number
  ): boolean {
    if (this.currentAction === newActionName) {
      return false; // Already doing this action
    }

    // Only switch if new action is significantly better
    if (newScore > currentScore + this.switchThreshold) {
      this.currentAction = newActionName;
      return true;
    }

    return false;
  }
}
```

## Summary

Utility AI provides a powerful, flexible framework for creating intelligent game characters that make contextually appropriate decisions. By scoring actions based on multiple weighted considerations, AI agents can exhibit nuanced, believable behavior that responds smoothly to changing conditions.

### Key Concepts Recap

1. **Utility Functions**: Convert game state into action scores through normalization, response curves, and weighted combinations

2. **Response Curves**: Transform input values to express relationships like urgency, diminishing returns, optimal ranges, and thresholds

3. **Action Selection**: Choose actions using highest score, weighted random, or momentum-based selection to balance predictability and variety

4. **Weights and Priorities**: Fine-tune behavior through static weights, dynamic modifiers, and personality profiles

5. **Integration**: Combine with Behavior Trees for hybrid reactive/planned behavior, or use with GOAP for goal-driven planning

6. **Performance**: Optimize through evaluation budgeting, hierarchical evaluation, and spatial partitioning

7. **Debugging**: Build visualization and logging tools to understand and tune AI decisions

### When to Use Utility AI

- Combat AI requiring tactical decision-making
- NPCs with multiple competing needs
- Characters that should feel responsive and "alive"
- Systems where priorities shift based on context
- Games needing believable opponent behavior

Utility AI excels at creating emergent, believable behavior from simple scoring rules. The key to success is starting simple, instrumenting thoroughly, and iterating based on observed behavior. With proper tuning and debugging tools, Utility AI can create some of the most dynamic and engaging AI systems in games.

## Further Reading

### Books and Papers

- **"Behavioral Mathematics for Game AI"** by Dave Mark - The definitive resource on Utility AI
- **"Game AI Pro"** series - Multiple chapters on utility-based decision making
- **"Artificial Intelligence for Games"** by Ian Millington - Comprehensive game AI coverage

### Online Resources

- GDC Vault talks on Utility AI by Dave Mark and Kevin Dill
- AI Game Dev community discussions and implementations
- Open-source Utility AI frameworks for various game engines

### Related Topics

- Behavior Trees for structured action execution
- Goal-Oriented Action Planning for strategic AI
- Hierarchical Task Networks for complex planning
- Monte Carlo Tree Search for adversarial games
- Machine Learning approaches to game AI
