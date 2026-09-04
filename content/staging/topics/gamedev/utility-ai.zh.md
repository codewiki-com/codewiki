---
title: 效用AI系统设计
description: 实现智能的AI决策系统：效用函数、评分曲线和动态行为选择
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 效用AI
  - 决策系统
  - 游戏AI
  - 评分
status: imported
origin: old/src/content/docs/gamedev/utility-ai.zh.md
divergence: 0.293
issues: []
legacy:
  category: GameDev
  subcategory: AI
  order: 19
  lastUpdated: 2026-01-07
---

效用AI（Utility AI）是一种基于评分的智能决策系统，它通过计算每个可能行为的"效用值"来选择最优行为。与传统的有限状态机（FSM）或行为树相比，效用AI能够产生更自然、更难以预测的AI行为，特别适合需要复杂决策的游戏场景。

---

## 效用AI概念

### 什么是效用AI？

效用AI的核心思想来源于经济学中的效用理论：每个决策都有一个可量化的"效用值"，AI会选择效用值最高的行为来执行。这种方法让AI能够根据当前环境状态动态调整行为，而不是遵循预定义的固定规则。

**核心组成部分：**

1. **考量因素（Considerations）**：影响决策的各种因素，如生命值、弹药量、敌人距离等
2. **评分曲线（Response Curves）**：将考量因素映射到0-1范围分数的函数
3. **行为（Actions）**：AI可以执行的具体动作
4. **效用函数（Utility Function）**：综合所有考量因素计算最终效用值

```typescript
// 效用AI的基本结构
interface Consideration {
  name: string;
  evaluate(context: AIContext): number;  // 返回0-1的分数
  curve: ResponseCurve;                   // 响应曲线
}

interface Action {
  name: string;
  considerations: Consideration[];
  weight: number;
  execute(context: AIContext): void;
}

interface AIContext {
  health: number;           // 当前生命值
  maxHealth: number;        // 最大生命值
  ammo: number;             // 弹药数量
  enemyDistance: number;    // 敌人距离
  coverDistance: number;    // 掩体距离
  threatLevel: number;      // 威胁等级
  // ... 更多上下文数据
}
```

### 效用AI vs 其他AI架构

| 特性 | 效用AI | 行为树 | 状态机 | GOAP |
|------|--------|--------|--------|------|
| 决策灵活性 | 高 | 中 | 低 | 高 |
| 可预测性 | 低 | 高 | 高 | 中 |
| 实现复杂度 | 中 | 中 | 低 | 高 |
| 调试难度 | 中 | 低 | 低 | 高 |
| 行为自然度 | 高 | 中 | 低 | 高 |
| 性能开销 | 中 | 低 | 低 | 高 |

### 适用场景

效用AI特别适合以下场景：

- **战略游戏AI**：需要权衡多种资源和目标
- **FPS敌人AI**：需要根据战场状态动态调整战术
- **生存游戏NPC**：需要平衡多种生存需求
- **模拟游戏角色**：需要表现出复杂的人格特征

```typescript
// 简单的效用AI示例：僵尸行为
class ZombieAI {
  private context: AIContext;
  private actions: Action[];

  constructor() {
    this.actions = [
      this.createWanderAction(),
      this.createChaseAction(),
      this.createAttackAction(),
      this.createFleeAction()
    ];
  }

  update(): void {
    // 计算每个行为的效用值
    const scoredActions = this.actions.map(action => ({
      action,
      score: this.calculateUtility(action)
    }));

    // 选择效用值最高的行为
    scoredActions.sort((a, b) => b.score - a.score);
    const bestAction = scoredActions[0];

    if (bestAction.score > 0) {
      bestAction.action.execute(this.context);
    }
  }

  private calculateUtility(action: Action): number {
    if (action.considerations.length === 0) return 0;

    // 使用几何平均来组合多个考量因素
    let product = 1;
    for (const consideration of action.considerations) {
      const rawScore = consideration.evaluate(this.context);
      const curvedScore = consideration.curve.evaluate(rawScore);
      product *= curvedScore;
    }

    // 补偿因子：考量因素越多，基础分数越低
    const modificationFactor = 1 - (1 / action.considerations.length);
    const makeUpValue = (1 - product) * modificationFactor;
    const finalScore = product + (makeUpValue * product);

    return finalScore * action.weight;
  }
}
```

---

## 效用函数设计

### 基础效用函数

效用函数是将游戏状态映射到效用值的核心组件。一个好的效用函数应该：

1. **归一化输出**：输出值应在0-1范围内
2. **单调性**：相关性应该明确（正相关或负相关）
3. **可调节**：通过参数调整响应特性

```typescript
// 效用函数接口
interface UtilityFunction {
  evaluate(input: number, min: number, max: number): number;
}

// 线性效用函数
class LinearUtility implements UtilityFunction {
  constructor(
    private slope: number = 1,
    private intercept: number = 0
  ) {}

  evaluate(input: number, min: number, max: number): number {
    // 归一化输入到0-1范围
    const normalized = (input - min) / (max - min);
    // 应用线性变换
    const result = this.slope * normalized + this.intercept;
    // 确保输出在0-1范围内
    return Math.max(0, Math.min(1, result));
  }
}

// 指数效用函数
class ExponentialUtility implements UtilityFunction {
  constructor(private exponent: number = 2) {}

  evaluate(input: number, min: number, max: number): number {
    const normalized = (input - min) / (max - min);
    return Math.pow(normalized, this.exponent);
  }
}

// S型（Sigmoid）效用函数
class SigmoidUtility implements UtilityFunction {
  constructor(
    private steepness: number = 10,
    private midpoint: number = 0.5
  ) {}

  evaluate(input: number, min: number, max: number): number {
    const normalized = (input - min) / (max - min);
    return 1 / (1 + Math.exp(-this.steepness * (normalized - this.midpoint)));
  }
}

// 钟形曲线效用函数（适合表示最优范围）
class BellCurveUtility implements UtilityFunction {
  constructor(
    private peak: number = 0.5,      // 峰值位置
    private width: number = 0.3       // 曲线宽度
  ) {}

  evaluate(input: number, min: number, max: number): number {
    const normalized = (input - min) / (max - min);
    const distance = Math.abs(normalized - this.peak);
    return Math.exp(-(distance * distance) / (2 * this.width * this.width));
  }
}
```

### 组合效用函数

在实际应用中，我们经常需要组合多个效用函数来表达复杂的决策逻辑。

```typescript
// 效用组合器
class UtilityCombiner {
  // 乘法组合（AND语义）：所有因素都重要
  static multiply(scores: number[]): number {
    return scores.reduce((product, score) => product * score, 1);
  }

  // 加权平均（软OR语义）：平衡各因素
  static weightedAverage(scores: number[], weights: number[]): number {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = scores.reduce(
      (sum, score, i) => sum + score * weights[i],
      0
    );
    return weightedSum / totalWeight;
  }

  // 最大值（OR语义）：任一因素满足即可
  static max(scores: number[]): number {
    return Math.max(...scores);
  }

  // 最小值（AND语义）：所有因素必须满足
  static min(scores: number[]): number {
    return Math.min(...scores);
  }

  // 补偿型乘法：解决多因素乘法过度惩罚问题
  static compensatedMultiply(scores: number[]): number {
    if (scores.length === 0) return 0;

    const product = scores.reduce((p, s) => p * s, 1);
    const modificationFactor = 1 - (1 / scores.length);
    const makeUpValue = (1 - product) * modificationFactor;

    return product + (makeUpValue * product);
  }
}

// 考量因素类
class Consideration {
  constructor(
    public name: string,
    private inputGetter: (ctx: AIContext) => number,
    private minValue: number,
    private maxValue: number,
    private utilityFunction: UtilityFunction,
    public weight: number = 1.0
  ) {}

  evaluate(context: AIContext): number {
    const input = this.inputGetter(context);
    return this.utilityFunction.evaluate(input, this.minValue, this.maxValue);
  }
}

// 行为类
class AIAction {
  constructor(
    public name: string,
    private considerations: Consideration[],
    private executor: (ctx: AIContext) => void,
    public baseWeight: number = 1.0
  ) {}

  calculateUtility(context: AIContext): number {
    if (this.considerations.length === 0) return 0;

    const scores = this.considerations.map(c => {
      const score = c.evaluate(context);
      return score * c.weight;
    });

    return UtilityCombiner.compensatedMultiply(scores) * this.baseWeight;
  }

  execute(context: AIContext): void {
    this.executor(context);
  }
}
```

---

## 评分曲线类型

### 常用响应曲线

响应曲线定义了输入值如何映射到效用分数。选择正确的曲线类型对AI行为的表现至关重要。

```typescript
// 响应曲线基类
abstract class ResponseCurve {
  abstract evaluate(x: number): number;

  // 可视化曲线（用于调试）
  visualize(steps: number = 20): string {
    let result = '';
    for (let i = 0; i <= steps; i++) {
      const x = i / steps;
      const y = this.evaluate(x);
      const barLength = Math.round(y * 50);
      result += `${x.toFixed(2)}: ${'█'.repeat(barLength)}${' '.repeat(50 - barLength)} ${y.toFixed(3)}\n`;
    }
    return result;
  }
}

// 1. 线性曲线：简单的线性映射
class LinearCurve extends ResponseCurve {
  constructor(
    private m: number = 1,    // 斜率
    private b: number = 0,    // 截距
    private clamp: boolean = true
  ) {
    super();
  }

  evaluate(x: number): number {
    const y = this.m * x + this.b;
    return this.clamp ? Math.max(0, Math.min(1, y)) : y;
  }
}

// 2. 二次曲线：平滑的加速或减速
class QuadraticCurve extends ResponseCurve {
  constructor(
    private exponent: number = 2,
    private flip: boolean = false  // 是否翻转
  ) {
    super();
  }

  evaluate(x: number): number {
    const value = this.flip ? 1 - x : x;
    const result = Math.pow(value, this.exponent);
    return this.flip ? 1 - result : result;
  }
}

// 3. Logistic曲线：S形曲线，适合阈值行为
class LogisticCurve extends ResponseCurve {
  constructor(
    private steepness: number = 10,  // 陡峭程度
    private midpoint: number = 0.5,   // 中点位置
    private minValue: number = 0,
    private maxValue: number = 1
  ) {
    super();
  }

  evaluate(x: number): number {
    const exponent = -this.steepness * (x - this.midpoint);
    const logistic = 1 / (1 + Math.exp(exponent));
    return this.minValue + (this.maxValue - this.minValue) * logistic;
  }
}

// 4. 正弦曲线：周期性或波动行为
class SineCurve extends ResponseCurve {
  constructor(
    private frequency: number = 1,
    private phase: number = 0,
    private amplitude: number = 0.5,
    private verticalShift: number = 0.5
  ) {
    super();
  }

  evaluate(x: number): number {
    const result = this.amplitude * Math.sin(
      this.frequency * Math.PI * x + this.phase
    ) + this.verticalShift;
    return Math.max(0, Math.min(1, result));
  }
}

// 5. 阶跃曲线：离散的阈值行为
class StepCurve extends ResponseCurve {
  constructor(
    private thresholds: { x: number; y: number }[]
  ) {
    super();
    // 按x值排序
    this.thresholds.sort((a, b) => a.x - b.x);
  }

  evaluate(x: number): number {
    for (let i = this.thresholds.length - 1; i >= 0; i--) {
      if (x >= this.thresholds[i].x) {
        return this.thresholds[i].y;
      }
    }
    return 0;
  }
}

// 6. 钟形曲线：最优范围
class GaussianCurve extends ResponseCurve {
  constructor(
    private mean: number = 0.5,      // 峰值位置
    private stdDev: number = 0.2     // 标准差（控制宽度）
  ) {
    super();
  }

  evaluate(x: number): number {
    const exponent = -Math.pow(x - this.mean, 2) / (2 * Math.pow(this.stdDev, 2));
    return Math.exp(exponent);
  }
}

// 7. 分段线性曲线：自定义控制点
class PiecewiseLinearCurve extends ResponseCurve {
  constructor(
    private points: { x: number; y: number }[]
  ) {
    super();
    // 按x值排序并确保有起点和终点
    this.points.sort((a, b) => a.x - b.x);
    if (this.points[0]?.x !== 0) {
      this.points.unshift({ x: 0, y: this.points[0]?.y ?? 0 });
    }
    if (this.points[this.points.length - 1]?.x !== 1) {
      this.points.push({ x: 1, y: this.points[this.points.length - 1]?.y ?? 1 });
    }
  }

  evaluate(x: number): number {
    // 找到x所在的区间
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      if (x >= p1.x && x <= p2.x) {
        // 线性插值
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + t * (p2.y - p1.y);
      }
    }

    return x <= 0 ? this.points[0].y : this.points[this.points.length - 1].y;
  }
}
```

### 曲线选择指南

```typescript
// 曲线选择示例
class CurveExamples {
  // 生命值：低血量时急需治疗
  static healthConsideration(): ResponseCurve {
    // 使用翻转的二次曲线：血量越低，效用越高
    return new QuadraticCurve(2, true);
  }

  // 距离：近距离时威胁更大
  static distanceThreat(): ResponseCurve {
    // 使用翻转的线性曲线
    return new LinearCurve(-1, 1);
  }

  // 弹药：有一定弹药才考虑攻击
  static ammoForAttack(): ResponseCurve {
    // S形曲线：弹药少于一定量时效用骤降
    return new LogisticCurve(15, 0.2, 0, 1);
  }

  // 最佳攻击距离：太近或太远都不好
  static optimalAttackDistance(): ResponseCurve {
    // 钟形曲线：中等距离效用最高
    return new GaussianCurve(0.5, 0.2);
  }

  // 掩体距离：根据威胁等级调整
  static coverSeekingByThreat(): ResponseCurve {
    // 分段曲线：威胁高时更积极寻找掩体
    return new PiecewiseLinearCurve([
      { x: 0.0, y: 0.1 },   // 低威胁：不急需掩体
      { x: 0.3, y: 0.2 },   // 中低威胁
      { x: 0.5, y: 0.5 },   // 中等威胁
      { x: 0.7, y: 0.8 },   // 中高威胁
      { x: 1.0, y: 1.0 }    // 高威胁：急需掩体
    ]);
  }
}
```

---

## 行为选择策略

### 基本选择策略

```typescript
// 行为选择策略接口
interface SelectionStrategy {
  select(scoredActions: ScoredAction[]): AIAction | null;
}

interface ScoredAction {
  action: AIAction;
  score: number;
}

// 1. 最高分策略：始终选择效用最高的行为
class HighestScoreStrategy implements SelectionStrategy {
  constructor(private minimumScore: number = 0.01) {}

  select(scoredActions: ScoredAction[]): AIAction | null {
    if (scoredActions.length === 0) return null;

    const sorted = [...scoredActions].sort((a, b) => b.score - a.score);
    const best = sorted[0];

    return best.score >= this.minimumScore ? best.action : null;
  }
}

// 2. 加权随机策略：基于效用值的概率选择
class WeightedRandomStrategy implements SelectionStrategy {
  constructor(private minimumScore: number = 0.01) {}

  select(scoredActions: ScoredAction[]): AIAction | null {
    // 过滤低分行为
    const validActions = scoredActions.filter(sa => sa.score >= this.minimumScore);
    if (validActions.length === 0) return null;

    // 计算总分
    const totalScore = validActions.reduce((sum, sa) => sum + sa.score, 0);
    if (totalScore === 0) return null;

    // 随机选择
    let random = Math.random() * totalScore;
    for (const sa of validActions) {
      random -= sa.score;
      if (random <= 0) {
        return sa.action;
      }
    }

    return validActions[validActions.length - 1].action;
  }
}

// 3. 前N选择策略：从前N个高分行为中随机选择
class TopNRandomStrategy implements SelectionStrategy {
  constructor(
    private n: number = 3,
    private minimumScore: number = 0.01
  ) {}

  select(scoredActions: ScoredAction[]): AIAction | null {
    const sorted = [...scoredActions]
      .filter(sa => sa.score >= this.minimumScore)
      .sort((a, b) => b.score - a.score);

    if (sorted.length === 0) return null;

    const topN = sorted.slice(0, this.n);
    const randomIndex = Math.floor(Math.random() * topN.length);
    return topN[randomIndex].action;
  }
}

// 4. 双阈值策略：只考虑分数在阈值范围内的行为
class DualThresholdStrategy implements SelectionStrategy {
  constructor(
    private absoluteThreshold: number = 0.1,   // 绝对阈值
    private relativeThreshold: number = 0.8    // 相对阈值（相对于最高分）
  ) {}

  select(scoredActions: ScoredAction[]): AIAction | null {
    if (scoredActions.length === 0) return null;

    const sorted = [...scoredActions].sort((a, b) => b.score - a.score);
    const highestScore = sorted[0].score;

    if (highestScore < this.absoluteThreshold) return null;

    // 只保留相对分数超过阈值的行为
    const threshold = highestScore * this.relativeThreshold;
    const validActions = sorted.filter(sa => sa.score >= threshold);

    // 从有效行为中加权随机选择
    const totalScore = validActions.reduce((sum, sa) => sum + sa.score, 0);
    let random = Math.random() * totalScore;

    for (const sa of validActions) {
      random -= sa.score;
      if (random <= 0) return sa.action;
    }

    return validActions[0].action;
  }
}

// 5. 惯性策略：倾向于保持当前行为
class InertiaStrategy implements SelectionStrategy {
  private currentAction: AIAction | null = null;
  private currentScore: number = 0;

  constructor(
    private inertiaBonus: number = 0.2,        // 当前行为的额外加分
    private switchThreshold: number = 0.1      // 切换阈值
  ) {}

  select(scoredActions: ScoredAction[]): AIAction | null {
    if (scoredActions.length === 0) return null;

    // 为当前行为添加惯性加分
    const adjustedActions = scoredActions.map(sa => ({
      action: sa.action,
      score: sa.action === this.currentAction
        ? sa.score + this.inertiaBonus
        : sa.score
    }));

    const sorted = adjustedActions.sort((a, b) => b.score - a.score);
    const best = sorted[0];

    // 只有当新行为明显更好时才切换
    if (this.currentAction && best.action !== this.currentAction) {
      const currentAdjustedScore = this.currentScore + this.inertiaBonus;
      if (best.score - currentAdjustedScore < this.switchThreshold) {
        return this.currentAction;
      }
    }

    this.currentAction = best.action;
    this.currentScore = best.score - (best.action === this.currentAction ? this.inertiaBonus : 0);

    return best.action;
  }

  reset(): void {
    this.currentAction = null;
    this.currentScore = 0;
  }
}
```

### 行为中断处理

```typescript
// 可中断的行为
interface InterruptibleAction extends AIAction {
  isInterruptible: boolean;
  interruptPriority: number;
  canBeInterruptedBy(other: AIAction): boolean;
}

class InterruptibleActionManager {
  private currentAction: InterruptibleAction | null = null;
  private actionStartTime: number = 0;
  private minimumActionDuration: number = 100; // 最小执行时间（毫秒）

  update(
    scoredActions: { action: InterruptibleAction; score: number }[],
    context: AIContext
  ): void {
    const now = Date.now();
    const actionDuration = now - this.actionStartTime;

    // 获取最佳候选行为
    const sorted = [...scoredActions].sort((a, b) => b.score - a.score);
    const bestCandidate = sorted[0];

    if (!this.currentAction) {
      // 没有当前行为，直接执行最佳候选
      this.startAction(bestCandidate.action, context);
      return;
    }

    // 检查是否应该中断当前行为
    if (
      this.currentAction.isInterruptible &&
      actionDuration >= this.minimumActionDuration &&
      bestCandidate.action !== this.currentAction &&
      bestCandidate.score > 0
    ) {
      // 检查优先级
      if (
        bestCandidate.action.interruptPriority > this.currentAction.interruptPriority ||
        this.currentAction.canBeInterruptedBy(bestCandidate.action)
      ) {
        this.interruptCurrentAction();
        this.startAction(bestCandidate.action, context);
      }
    }
  }

  private startAction(action: InterruptibleAction, context: AIContext): void {
    this.currentAction = action;
    this.actionStartTime = Date.now();
    action.execute(context);
  }

  private interruptCurrentAction(): void {
    // 可以在这里添加中断回调
    this.currentAction = null;
  }
}
```

---

## 权重和优先级

### 动态权重系统

```typescript
// 权重修饰器
interface WeightModifier {
  name: string;
  apply(baseWeight: number, context: AIContext): number;
  isActive(context: AIContext): boolean;
}

// 条件权重修饰器
class ConditionalWeightModifier implements WeightModifier {
  constructor(
    public name: string,
    private condition: (ctx: AIContext) => boolean,
    private multiplier: number
  ) {}

  isActive(context: AIContext): boolean {
    return this.condition(context);
  }

  apply(baseWeight: number, context: AIContext): number {
    return this.isActive(context) ? baseWeight * this.multiplier : baseWeight;
  }
}

// 渐变权重修饰器
class GradualWeightModifier implements WeightModifier {
  constructor(
    public name: string,
    private inputGetter: (ctx: AIContext) => number,
    private curve: ResponseCurve,
    private minMultiplier: number,
    private maxMultiplier: number
  ) {}

  isActive(_context: AIContext): boolean {
    return true; // 始终激活
  }

  apply(baseWeight: number, context: AIContext): number {
    const input = this.inputGetter(context);
    const curveValue = this.curve.evaluate(input);
    const multiplier = this.minMultiplier +
      curveValue * (this.maxMultiplier - this.minMultiplier);
    return baseWeight * multiplier;
  }
}

// 带权重修饰的行为
class ModifiableAction {
  private weightModifiers: WeightModifier[] = [];

  constructor(
    public name: string,
    private baseAction: AIAction,
    private baseWeight: number = 1.0
  ) {}

  addModifier(modifier: WeightModifier): this {
    this.weightModifiers.push(modifier);
    return this;
  }

  removeModifier(name: string): this {
    this.weightModifiers = this.weightModifiers.filter(m => m.name !== name);
    return this;
  }

  calculateEffectiveWeight(context: AIContext): number {
    let weight = this.baseWeight;

    for (const modifier of this.weightModifiers) {
      weight = modifier.apply(weight, context);
    }

    return Math.max(0, weight);
  }

  calculateUtility(context: AIContext): number {
    const baseUtility = this.baseAction.calculateUtility(context);
    const effectiveWeight = this.calculateEffectiveWeight(context);
    return baseUtility * effectiveWeight;
  }
}

// 使用示例
function createCombatActions(context: AIContext): ModifiableAction[] {
  // 攻击行为
  const attackAction = new ModifiableAction(
    'Attack',
    new AIAction('Attack', [/* considerations */], (ctx) => { /* execute */ }),
    1.0
  );

  // 添加权重修饰器
  attackAction
    // 有弹药时增加权重
    .addModifier(new ConditionalWeightModifier(
      'HasAmmo',
      (ctx) => ctx.ammo > 0,
      1.5
    ))
    // 生命值高时更积极攻击
    .addModifier(new GradualWeightModifier(
      'HealthAggression',
      (ctx) => ctx.health / ctx.maxHealth,
      new LinearCurve(1, 0),
      0.5,  // 低血量时权重降到0.5倍
      1.5   // 满血时权重升到1.5倍
    ));

  // 撤退行为
  const retreatAction = new ModifiableAction(
    'Retreat',
    new AIAction('Retreat', [/* considerations */], (ctx) => { /* execute */ }),
    0.8
  );

  retreatAction
    // 低血量时大幅增加撤退权重
    .addModifier(new GradualWeightModifier(
      'LowHealthRetreat',
      (ctx) => 1 - ctx.health / ctx.maxHealth,  // 反转：血量越低值越高
      new QuadraticCurve(2, false),
      1.0,
      3.0
    ))
    // 没有弹药时增加撤退权重
    .addModifier(new ConditionalWeightModifier(
      'NoAmmoRetreat',
      (ctx) => ctx.ammo === 0,
      2.0
    ));

  return [attackAction, retreatAction];
}
```

### 优先级系统

```typescript
// 优先级层级
enum ActionPriority {
  CRITICAL = 100,    // 紧急行为（如躲避致命攻击）
  HIGH = 75,         // 高优先级（如治疗低血量）
  NORMAL = 50,       // 普通优先级
  LOW = 25,          // 低优先级
  IDLE = 0           // 空闲行为
}

// 带优先级的行为
class PrioritizedAction {
  constructor(
    public action: AIAction,
    public priority: ActionPriority,
    public cooldown: number = 0      // 冷却时间（毫秒）
  ) {}

  private lastExecutionTime: number = 0;

  isOnCooldown(): boolean {
    return Date.now() - this.lastExecutionTime < this.cooldown;
  }

  execute(context: AIContext): void {
    if (!this.isOnCooldown()) {
      this.action.execute(context);
      this.lastExecutionTime = Date.now();
    }
  }
}

// 优先级感知的AI控制器
class PriorityAwareAIController {
  private actions: PrioritizedAction[] = [];
  private currentAction: PrioritizedAction | null = null;

  addAction(action: PrioritizedAction): void {
    this.actions.push(action);
    // 按优先级排序
    this.actions.sort((a, b) => b.priority - a.priority);
  }

  update(context: AIContext): void {
    // 按优先级组处理
    const priorityGroups = this.groupByPriority();

    for (const [priority, actions] of priorityGroups) {
      // 检查当前优先级是否有可行的行为
      const viableActions = actions.filter(pa => {
        if (pa.isOnCooldown()) return false;
        const score = pa.action.calculateUtility(context);
        return score > 0.1; // 最低可行阈值
      });

      if (viableActions.length > 0) {
        // 在当前优先级组内选择最佳行为
        const scoredActions = viableActions.map(pa => ({
          prioritizedAction: pa,
          score: pa.action.calculateUtility(context)
        }));

        scoredActions.sort((a, b) => b.score - a.score);
        const best = scoredActions[0];

        // 检查是否需要切换行为
        if (this.shouldSwitchTo(best.prioritizedAction, context)) {
          this.currentAction = best.prioritizedAction;
          best.prioritizedAction.execute(context);
        }

        return; // 找到可行行为后退出
      }
    }
  }

  private groupByPriority(): Map<ActionPriority, PrioritizedAction[]> {
    const groups = new Map<ActionPriority, PrioritizedAction[]>();

    for (const action of this.actions) {
      const existing = groups.get(action.priority) || [];
      existing.push(action);
      groups.set(action.priority, existing);
    }

    return groups;
  }

  private shouldSwitchTo(newAction: PrioritizedAction, context: AIContext): boolean {
    if (!this.currentAction) return true;

    // 高优先级行为可以打断低优先级行为
    if (newAction.priority > this.currentAction.priority) {
      return true;
    }

    // 同优先级时，只有显著更好才切换
    if (newAction.priority === this.currentAction.priority) {
      const currentScore = this.currentAction.action.calculateUtility(context);
      const newScore = newAction.action.calculateUtility(context);
      return newScore > currentScore * 1.2; // 20%提升阈值
    }

    return false;
  }
}
```

---

## 响应曲线

### 高级响应曲线

```typescript
// 自适应响应曲线：根据游戏状态动态调整
class AdaptiveCurve extends ResponseCurve {
  constructor(
    private baseCurve: ResponseCurve,
    private adaptationFunction: (x: number, context: any) => number
  ) {
    super();
  }

  evaluate(x: number): number {
    // 基础实现，不使用上下文
    return this.baseCurve.evaluate(x);
  }

  evaluateWithContext(x: number, context: any): number {
    const baseValue = this.baseCurve.evaluate(x);
    return this.adaptationFunction(baseValue, context);
  }
}

// 噪声曲线：添加随机性使行为更自然
class NoisyCurve extends ResponseCurve {
  constructor(
    private baseCurve: ResponseCurve,
    private noiseAmplitude: number = 0.1,
    private noiseSeed: number = Math.random() * 1000
  ) {
    super();
  }

  // 简单的伪随机噪声
  private noise(x: number): number {
    const value = Math.sin(x * 12.9898 + this.noiseSeed) * 43758.5453;
    return value - Math.floor(value);
  }

  evaluate(x: number): number {
    const baseValue = this.baseCurve.evaluate(x);
    const noiseValue = (this.noise(x) - 0.5) * 2 * this.noiseAmplitude;
    return Math.max(0, Math.min(1, baseValue + noiseValue));
  }
}

// 时间衰减曲线：随时间改变响应
class TimeDecayCurve extends ResponseCurve {
  private startTime: number = Date.now();

  constructor(
    private baseCurve: ResponseCurve,
    private decayRate: number = 0.001,  // 每毫秒衰减率
    private minMultiplier: number = 0.1
  ) {
    super();
  }

  evaluate(x: number): number {
    const elapsed = Date.now() - this.startTime;
    const decayMultiplier = Math.max(
      this.minMultiplier,
      Math.exp(-this.decayRate * elapsed)
    );
    return this.baseCurve.evaluate(x) * decayMultiplier;
  }

  reset(): void {
    this.startTime = Date.now();
  }
}

// 组合曲线：将多条曲线组合
class CompositeCurve extends ResponseCurve {
  constructor(
    private curves: ResponseCurve[],
    private combineMethod: 'multiply' | 'average' | 'max' | 'min' = 'multiply'
  ) {
    super();
  }

  evaluate(x: number): number {
    const values = this.curves.map(c => c.evaluate(x));

    switch (this.combineMethod) {
      case 'multiply':
        return values.reduce((product, v) => product * v, 1);
      case 'average':
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return values[0] ?? 0;
    }
  }
}

// 条件曲线：根据条件选择不同的曲线
class ConditionalCurve extends ResponseCurve {
  constructor(
    private conditions: { condition: (x: number) => boolean; curve: ResponseCurve }[],
    private defaultCurve: ResponseCurve
  ) {
    super();
  }

  evaluate(x: number): number {
    for (const { condition, curve } of this.conditions) {
      if (condition(x)) {
        return curve.evaluate(x);
      }
    }
    return this.defaultCurve.evaluate(x);
  }
}
```

### 曲线编辑器工具

```typescript
// 曲线编辑器数据结构
interface CurveData {
  type: string;
  parameters: Record<string, number>;
  points?: { x: number; y: number }[];
}

// 曲线工厂
class CurveFactory {
  static create(data: CurveData): ResponseCurve {
    switch (data.type) {
      case 'linear':
        return new LinearCurve(
          data.parameters.slope ?? 1,
          data.parameters.intercept ?? 0
        );

      case 'quadratic':
        return new QuadraticCurve(
          data.parameters.exponent ?? 2,
          data.parameters.flip ?? false
        );

      case 'logistic':
        return new LogisticCurve(
          data.parameters.steepness ?? 10,
          data.parameters.midpoint ?? 0.5
        );

      case 'gaussian':
        return new GaussianCurve(
          data.parameters.mean ?? 0.5,
          data.parameters.stdDev ?? 0.2
        );

      case 'piecewise':
        return new PiecewiseLinearCurve(data.points ?? []);

      default:
        throw new Error(`Unknown curve type: ${data.type}`);
    }
  }

  static serialize(curve: ResponseCurve): CurveData {
    if (curve instanceof LinearCurve) {
      return {
        type: 'linear',
        parameters: {
          slope: (curve as any).m,
          intercept: (curve as any).b
        }
      };
    }

    if (curve instanceof QuadraticCurve) {
      return {
        type: 'quadratic',
        parameters: {
          exponent: (curve as any).exponent,
          flip: (curve as any).flip
        }
      };
    }

    // ... 其他曲线类型的序列化

    throw new Error('Unknown curve type for serialization');
  }
}

// 曲线调试器
class CurveDebugger {
  static analyze(curve: ResponseCurve, samples: number = 100): {
    min: number;
    max: number;
    average: number;
    derivative: number[];
  } {
    const values: number[] = [];
    const derivatives: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const x = i / samples;
      values.push(curve.evaluate(x));

      if (i > 0) {
        const prevX = (i - 1) / samples;
        const derivative = (values[i] - values[i - 1]) / (x - prevX);
        derivatives.push(derivative);
      }
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length,
      derivative: derivatives
    };
  }

  static findIntersection(
    curve1: ResponseCurve,
    curve2: ResponseCurve,
    tolerance: number = 0.001
  ): number[] {
    const intersections: number[] = [];

    for (let i = 0; i < 1000; i++) {
      const x = i / 1000;
      const y1 = curve1.evaluate(x);
      const y2 = curve2.evaluate(x);

      if (Math.abs(y1 - y2) < tolerance) {
        // 避免重复添加相邻的交点
        if (intersections.length === 0 ||
            x - intersections[intersections.length - 1] > 0.01) {
          intersections.push(x);
        }
      }
    }

    return intersections;
  }
}
```

---

## 与行为树结合

### 混合架构设计

效用AI和行为树可以结合使用，发挥各自的优势：效用AI用于高层决策，行为树用于执行具体行为序列。

```typescript
// 行为树节点基类
abstract class BTNode {
  abstract tick(context: AIContext): BTStatus;
}

enum BTStatus {
  SUCCESS,
  FAILURE,
  RUNNING
}

// 序列节点
class SequenceNode extends BTNode {
  private currentChild: number = 0;

  constructor(private children: BTNode[]) {
    super();
  }

  tick(context: AIContext): BTStatus {
    while (this.currentChild < this.children.length) {
      const status = this.children[this.currentChild].tick(context);

      if (status === BTStatus.RUNNING) {
        return BTStatus.RUNNING;
      }

      if (status === BTStatus.FAILURE) {
        this.currentChild = 0;
        return BTStatus.FAILURE;
      }

      this.currentChild++;
    }

    this.currentChild = 0;
    return BTStatus.SUCCESS;
  }
}

// 选择节点
class SelectorNode extends BTNode {
  constructor(private children: BTNode[]) {
    super();
  }

  tick(context: AIContext): BTStatus {
    for (const child of this.children) {
      const status = child.tick(context);

      if (status !== BTStatus.FAILURE) {
        return status;
      }
    }

    return BTStatus.FAILURE;
  }
}

// 效用选择节点：使用效用AI选择子节点
class UtilitySelectorNode extends BTNode {
  constructor(
    private children: { node: BTNode; utility: AIAction }[]
  ) {
    super();
  }

  tick(context: AIContext): BTStatus {
    // 计算每个子节点的效用值
    const scoredChildren = this.children.map(child => ({
      node: child.node,
      score: child.utility.calculateUtility(context)
    }));

    // 按效用值排序
    scoredChildren.sort((a, b) => b.score - a.score);

    // 执行效用值最高的子节点
    for (const { node, score } of scoredChildren) {
      if (score > 0) {
        const status = node.tick(context);
        if (status !== BTStatus.FAILURE) {
          return status;
        }
      }
    }

    return BTStatus.FAILURE;
  }
}

// 效用条件节点：基于效用值判断是否执行
class UtilityConditionNode extends BTNode {
  constructor(
    private utility: AIAction,
    private threshold: number = 0.5
  ) {
    super();
  }

  tick(context: AIContext): BTStatus {
    const score = this.utility.calculateUtility(context);
    return score >= this.threshold ? BTStatus.SUCCESS : BTStatus.FAILURE;
  }
}

// 行为树执行的行为
class BehaviorTreeAction extends AIAction {
  private rootNode: BTNode;
  private status: BTStatus = BTStatus.SUCCESS;

  constructor(
    name: string,
    considerations: Consideration[],
    rootNode: BTNode
  ) {
    super(name, considerations, () => {});
    this.rootNode = rootNode;
  }

  execute(context: AIContext): void {
    this.status = this.rootNode.tick(context);
  }

  isComplete(): boolean {
    return this.status !== BTStatus.RUNNING;
  }

  wasSuccessful(): boolean {
    return this.status === BTStatus.SUCCESS;
  }
}
```

### 混合系统示例

```typescript
// 战斗AI：使用效用系统选择战术，行为树执行具体动作
class CombatAI {
  private utilityBrain: UtilityBrain;
  private behaviorTrees: Map<string, BTNode>;
  private currentTree: BTNode | null = null;

  constructor() {
    this.behaviorTrees = new Map();
    this.setupBehaviorTrees();
    this.setupUtilityBrain();
  }

  private setupBehaviorTrees(): void {
    // 攻击行为树
    const attackTree = new SequenceNode([
      new FindTargetNode(),
      new AimAtTargetNode(),
      new FireWeaponNode()
    ]);

    // 掩护行为树
    const coverTree = new SequenceNode([
      new FindCoverNode(),
      new MoveToCovertNode(),
      new TakeCoverNode()
    ]);

    // 治疗行为树
    const healTree = new SequenceNode([
      new FindHealthPackNode(),
      new MoveToHealthPackNode(),
      new UseHealthPackNode()
    ]);

    // 巡逻行为树
    const patrolTree = new SequenceNode([
      new GetNextPatrolPointNode(),
      new MoveToPatrolPointNode(),
      new WaitAtPatrolPointNode()
    ]);

    this.behaviorTrees.set('attack', attackTree);
    this.behaviorTrees.set('cover', coverTree);
    this.behaviorTrees.set('heal', healTree);
    this.behaviorTrees.set('patrol', patrolTree);
  }

  private setupUtilityBrain(): void {
    this.utilityBrain = new UtilityBrain();

    // 攻击策略
    this.utilityBrain.addAction(new AIAction(
      'attack',
      [
        new Consideration(
          'hasAmmo',
          ctx => ctx.ammo / 100,
          0, 1,
          new LogisticCurve(10, 0.2)
        ),
        new Consideration(
          'enemyVisible',
          ctx => ctx.canSeeEnemy ? 1 : 0,
          0, 1,
          new LinearCurve(1, 0)
        ),
        new Consideration(
          'healthStatus',
          ctx => ctx.health / ctx.maxHealth,
          0, 1,
          new LinearCurve(0.5, 0.5)
        )
      ],
      () => {}
    ));

    // 掩护策略
    this.utilityBrain.addAction(new AIAction(
      'cover',
      [
        new Consideration(
          'threatLevel',
          ctx => ctx.threatLevel,
          0, 1,
          new QuadraticCurve(2, false)
        ),
        new Consideration(
          'notInCover',
          ctx => ctx.isInCover ? 0 : 1,
          0, 1,
          new LinearCurve(1, 0)
        ),
        new Consideration(
          'coverAvailable',
          ctx => ctx.nearestCoverDistance < 20 ? 1 : 0,
          0, 1,
          new LinearCurve(1, 0)
        )
      ],
      () => {}
    ));

    // 治疗策略
    this.utilityBrain.addAction(new AIAction(
      'heal',
      [
        new Consideration(
          'lowHealth',
          ctx => 1 - ctx.health / ctx.maxHealth,
          0, 1,
          new QuadraticCurve(2, false)
        ),
        new Consideration(
          'healthPackAvailable',
          ctx => ctx.nearestHealthPackDistance < 30 ? 1 : 0,
          0, 1,
          new LinearCurve(1, 0)
        )
      ],
      () => {}
    ));

    // 巡逻策略
    this.utilityBrain.addAction(new AIAction(
      'patrol',
      [
        new Consideration(
          'noThreat',
          ctx => 1 - ctx.threatLevel,
          0, 1,
          new LinearCurve(1, 0)
        ),
        new Consideration(
          'idleTime',
          ctx => Math.min(ctx.idleTime / 5000, 1),
          0, 1,
          new LinearCurve(1, 0)
        )
      ],
      () => {}
    ));
  }

  update(context: AIContext): void {
    // 使用效用系统选择策略
    const selectedAction = this.utilityBrain.selectAction(context);

    if (selectedAction) {
      const tree = this.behaviorTrees.get(selectedAction.name);

      if (tree && tree !== this.currentTree) {
        this.currentTree = tree;
      }
    }

    // 执行当前行为树
    if (this.currentTree) {
      const status = this.currentTree.tick(context);

      if (status !== BTStatus.RUNNING) {
        // 行为完成，清空当前树以便下次选择
        this.currentTree = null;
      }
    }
  }
}

// 辅助行为树节点（示例）
class FindTargetNode extends BTNode {
  tick(context: AIContext): BTStatus {
    if (context.nearestEnemy) {
      context.currentTarget = context.nearestEnemy;
      return BTStatus.SUCCESS;
    }
    return BTStatus.FAILURE;
  }
}

class AimAtTargetNode extends BTNode {
  tick(context: AIContext): BTStatus {
    if (!context.currentTarget) return BTStatus.FAILURE;

    // 计算瞄准方向
    const aimProgress = this.calculateAimProgress(context);

    if (aimProgress >= 1.0) {
      return BTStatus.SUCCESS;
    }

    return BTStatus.RUNNING;
  }

  private calculateAimProgress(context: AIContext): number {
    // 模拟瞄准过程
    return Math.min(1.0, (context.aimTime || 0) / 500);
  }
}

class FireWeaponNode extends BTNode {
  tick(context: AIContext): BTStatus {
    if (context.ammo <= 0) return BTStatus.FAILURE;

    // 执行射击
    context.ammo--;
    console.log('Fire!');

    return BTStatus.SUCCESS;
  }
}
```

---

## GOAP对比

### GOAP简介

目标导向行为规划（Goal-Oriented Action Planning, GOAP）是另一种流行的AI架构。让我们比较这两种方法。

```typescript
// GOAP 行为定义
interface GOAPAction {
  name: string;
  preconditions: Map<string, any>;   // 前置条件
  effects: Map<string, any>;          // 执行效果
  cost: number;                        // 行为代价
}

// GOAP 世界状态
type WorldState = Map<string, any>;

// GOAP 目标
interface GOAPGoal {
  name: string;
  conditions: Map<string, any>;       // 目标条件
  priority: number;
}

// 简化的 GOAP 规划器
class GOAPPlanner {
  private actions: GOAPAction[];

  constructor(actions: GOAPAction[]) {
    this.actions = actions;
  }

  plan(currentState: WorldState, goal: GOAPGoal): GOAPAction[] | null {
    // 使用 A* 搜索找到从当前状态到目标状态的路径
    const openSet: PlanNode[] = [{
      state: new Map(currentState),
      actions: [],
      cost: 0,
      heuristic: this.calculateHeuristic(currentState, goal.conditions)
    }];

    const closedSet = new Set<string>();

    while (openSet.length > 0) {
      // 选择 f = cost + heuristic 最小的节点
      openSet.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
      const current = openSet.shift()!;

      // 检查是否达到目标
      if (this.satisfiesGoal(current.state, goal.conditions)) {
        return current.actions;
      }

      const stateKey = this.stateToString(current.state);
      if (closedSet.has(stateKey)) continue;
      closedSet.add(stateKey);

      // 扩展邻居节点
      for (const action of this.actions) {
        if (this.canExecute(action, current.state)) {
          const newState = this.applyAction(action, current.state);
          const newNode: PlanNode = {
            state: newState,
            actions: [...current.actions, action],
            cost: current.cost + action.cost,
            heuristic: this.calculateHeuristic(newState, goal.conditions)
          };
          openSet.push(newNode);
        }
      }
    }

    return null; // 无法找到计划
  }

  private canExecute(action: GOAPAction, state: WorldState): boolean {
    for (const [key, value] of action.preconditions) {
      if (state.get(key) !== value) return false;
    }
    return true;
  }

  private applyAction(action: GOAPAction, state: WorldState): WorldState {
    const newState = new Map(state);
    for (const [key, value] of action.effects) {
      newState.set(key, value);
    }
    return newState;
  }

  private satisfiesGoal(state: WorldState, goalConditions: Map<string, any>): boolean {
    for (const [key, value] of goalConditions) {
      if (state.get(key) !== value) return false;
    }
    return true;
  }

  private calculateHeuristic(state: WorldState, goalConditions: Map<string, any>): number {
    let unsatisfied = 0;
    for (const [key, value] of goalConditions) {
      if (state.get(key) !== value) unsatisfied++;
    }
    return unsatisfied;
  }

  private stateToString(state: WorldState): string {
    return JSON.stringify(Array.from(state.entries()).sort());
  }
}

interface PlanNode {
  state: WorldState;
  actions: GOAPAction[];
  cost: number;
  heuristic: number;
}
```

### 效用AI vs GOAP 对比

```typescript
// 相同场景的两种实现对比

// 场景：AI需要决定是否攻击敌人

// === GOAP 实现 ===
const goapActions: GOAPAction[] = [
  {
    name: 'GetAmmo',
    preconditions: new Map([['hasAmmo', false]]),
    effects: new Map([['hasAmmo', true]]),
    cost: 5
  },
  {
    name: 'GetWeapon',
    preconditions: new Map([['hasWeapon', false]]),
    effects: new Map([['hasWeapon', true]]),
    cost: 3
  },
  {
    name: 'AttackEnemy',
    preconditions: new Map([
      ['hasWeapon', true],
      ['hasAmmo', true],
      ['enemyVisible', true]
    ]),
    effects: new Map([['enemyDead', true]]),
    cost: 2
  },
  {
    name: 'FindEnemy',
    preconditions: new Map([['enemyVisible', false]]),
    effects: new Map([['enemyVisible', true]]),
    cost: 4
  }
];

const goapGoal: GOAPGoal = {
  name: 'KillEnemy',
  conditions: new Map([['enemyDead', true]]),
  priority: 1
};

// GOAP 会规划出完整的行为序列
// 例如: GetWeapon -> GetAmmo -> FindEnemy -> AttackEnemy

// === 效用AI 实现 ===
class UtilityAttackAction {
  calculateUtility(context: AIContext): number {
    const hasWeaponScore = context.hasWeapon ? 1 : 0;
    const hasAmmoScore = new LogisticCurve(10, 0.2).evaluate(context.ammo / 100);
    const enemyVisibleScore = context.canSeeEnemy ? 1 : 0;
    const healthScore = context.health / context.maxHealth;

    // 组合所有因素
    return UtilityCombiner.compensatedMultiply([
      hasWeaponScore,
      hasAmmoScore,
      enemyVisibleScore,
      healthScore
    ]);
  }
}

// 效用AI 不会规划序列，而是每帧独立评估最佳行为
```

### 两种方法的优缺点

| 方面 | 效用AI | GOAP |
|------|--------|------|
| **决策方式** | 反应式，每帧独立评估 | 规划式，预先计算行为序列 |
| **适应性** | 高，实时响应变化 | 中，需要重新规划 |
| **可预测性** | 低，行为变化多 | 高，按计划执行 |
| **计算开销** | 每帧固定开销 | 规划时高，执行时低 |
| **调试难度** | 中，需要理解效用值 | 高，需要理解搜索过程 |
| **行为复杂度** | 适合简单反应行为 | 适合复杂多步骤任务 |
| **设计复杂度** | 低，定义考量因素即可 | 高，需要定义前置条件和效果 |

### 混合使用建议

```typescript
// 混合架构：效用AI用于高层决策，GOAP用于任务规划
class HybridAI {
  private utilityBrain: UtilityBrain;
  private goapPlanner: GOAPPlanner;
  private currentPlan: GOAPAction[] = [];
  private currentPlanIndex: number = 0;

  update(context: AIContext): void {
    // 效用AI 决定当前的高层目标
    const selectedGoal = this.selectGoal(context);

    // 如果目标改变或计划执行完毕，重新规划
    if (this.shouldReplan(selectedGoal, context)) {
      this.currentPlan = this.goapPlanner.plan(
        this.contextToWorldState(context),
        selectedGoal
      ) || [];
      this.currentPlanIndex = 0;
    }

    // 执行当前计划中的行为
    if (this.currentPlanIndex < this.currentPlan.length) {
      const currentAction = this.currentPlan[this.currentPlanIndex];
      this.executeAction(currentAction, context);

      // 检查行为是否完成
      if (this.isActionComplete(currentAction, context)) {
        this.currentPlanIndex++;
      }
    }
  }

  private selectGoal(context: AIContext): GOAPGoal {
    // 使用效用AI选择最重要的目标
    const goals = this.getAvailableGoals();
    let bestGoal = goals[0];
    let bestUtility = 0;

    for (const goal of goals) {
      const utility = this.calculateGoalUtility(goal, context);
      if (utility > bestUtility) {
        bestUtility = utility;
        bestGoal = goal;
      }
    }

    return bestGoal;
  }

  private calculateGoalUtility(goal: GOAPGoal, context: AIContext): number {
    // 根据目标类型和当前状态计算效用值
    switch (goal.name) {
      case 'KillEnemy':
        return this.calculateCombatUtility(context);
      case 'StayAlive':
        return this.calculateSurvivalUtility(context);
      case 'Explore':
        return this.calculateExplorationUtility(context);
      default:
        return 0;
    }
  }

  private shouldReplan(newGoal: GOAPGoal, context: AIContext): boolean {
    // 当目标改变、计划完成或环境显著变化时重新规划
    return this.currentPlan.length === 0 ||
           this.currentPlanIndex >= this.currentPlan.length ||
           this.hasEnvironmentChangedSignificantly(context);
  }
}
```

---

## 完整实现示例

### FPS游戏敌人AI

```typescript
// 完整的FPS敌人AI实现
interface FPSContext extends AIContext {
  // 基础属性
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;

  // 位置信息
  position: Vector3;
  velocity: Vector3;

  // 感知信息
  canSeePlayer: boolean;
  playerDistance: number;
  lastKnownPlayerPosition: Vector3 | null;
  timeSincePlayerSeen: number;

  // 战术信息
  isInCover: boolean;
  nearestCoverPoint: Vector3 | null;
  coverDistance: number;
  threatDirection: Vector3 | null;

  // 队友信息
  nearestAlly: FPSEnemy | null;
  allyDistance: number;

  // 环境信息
  nearestHealthPack: Vector3 | null;
  healthPackDistance: number;
  nearestAmmoBox: Vector3 | null;
  ammoBoxDistance: number;
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

class FPSEnemyAI {
  private actions: AIAction[] = [];
  private selectionStrategy: SelectionStrategy;
  private currentAction: AIAction | null = null;
  private debugMode: boolean = false;

  constructor() {
    this.selectionStrategy = new InertiaStrategy(0.15, 0.1);
    this.setupActions();
  }

  private setupActions(): void {
    // 1. 攻击行为
    this.actions.push(new AIAction(
      'Attack',
      [
        // 有弹药时才能攻击
        new Consideration(
          'HasAmmo',
          (ctx: FPSContext) => ctx.ammo / ctx.maxAmmo,
          0, 1,
          new LogisticCurve(15, 0.15),
          1.0
        ),
        // 能看到玩家
        new Consideration(
          'CanSeePlayer',
          (ctx: FPSContext) => ctx.canSeePlayer ? 1 : 0,
          0, 1,
          new LinearCurve(1, 0),
          1.2
        ),
        // 最佳攻击距离
        new Consideration(
          'OptimalDistance',
          (ctx: FPSContext) => Math.min(ctx.playerDistance / 30, 1),
          0, 1,
          new GaussianCurve(0.4, 0.3),  // 10-15米是最佳距离
          0.8
        ),
        // 生命值影响攻击意愿
        new Consideration(
          'HealthForAttack',
          (ctx: FPSContext) => ctx.health / ctx.maxHealth,
          0, 1,
          new LinearCurve(0.7, 0.3),
          0.6
        )
      ],
      this.executeAttack.bind(this),
      1.0
    ));

    // 2. 追击行为
    this.actions.push(new AIAction(
      'Chase',
      [
        // 记得玩家位置
        new Consideration(
          'KnowsPlayerPosition',
          (ctx: FPSContext) => ctx.lastKnownPlayerPosition ? 1 : 0,
          0, 1,
          new LinearCurve(1, 0),
          1.0
        ),
        // 看不到玩家但最近见过
        new Consideration(
          'RecentlySawPlayer',
          (ctx: FPSContext) => Math.max(0, 1 - ctx.timeSincePlayerSeen / 10000),
          0, 1,
          new QuadraticCurve(2, false),
          1.0
        ),
        // 有足够弹药
        new Consideration(
          'HasEnoughAmmo',
          (ctx: FPSContext) => ctx.ammo / ctx.maxAmmo,
          0, 1,
          new LogisticCurve(10, 0.3),
          0.8
        )
      ],
      this.executeChase.bind(this),
      0.9
    ));

    // 3. 寻找掩护
    this.actions.push(new AIAction(
      'SeekCover',
      [
        // 受到威胁
        new Consideration(
          'UnderThreat',
          (ctx: FPSContext) => ctx.canSeePlayer ? 1 : 0,
          0, 1,
          new LinearCurve(1, 0),
          1.0
        ),
        // 不在掩体中
        new Consideration(
          'NotInCover',
          (ctx: FPSContext) => ctx.isInCover ? 0 : 1,
          0, 1,
          new LinearCurve(1, 0),
          1.2
        ),
        // 附近有掩体
        new Consideration(
          'CoverAvailable',
          (ctx: FPSContext) => ctx.nearestCoverPoint ?
            Math.max(0, 1 - ctx.coverDistance / 20) : 0,
          0, 1,
          new QuadraticCurve(0.5, false),
          0.9
        ),
        // 血量低时更需要掩护
        new Consideration(
          'LowHealth',
          (ctx: FPSContext) => 1 - ctx.health / ctx.maxHealth,
          0, 1,
          new QuadraticCurve(2, false),
          1.1
        )
      ],
      this.executeSeekCover.bind(this),
      1.1
    ));

    // 4. 治疗行为
    this.actions.push(new AIAction(
      'Heal',
      [
        // 需要治疗
        new Consideration(
          'NeedsHealing',
          (ctx: FPSContext) => 1 - ctx.health / ctx.maxHealth,
          0, 1,
          new QuadraticCurve(1.5, false),
          1.2
        ),
        // 附近有医疗包
        new Consideration(
          'HealthPackNearby',
          (ctx: FPSContext) => ctx.nearestHealthPack ?
            Math.max(0, 1 - ctx.healthPackDistance / 30) : 0,
          0, 1,
          new LinearCurve(1, 0),
          1.0
        ),
        // 没有直接威胁
        new Consideration(
          'NotInDanger',
          (ctx: FPSContext) => ctx.canSeePlayer && ctx.playerDistance < 15 ? 0.2 : 1,
          0, 1,
          new LinearCurve(1, 0),
          0.8
        )
      ],
      this.executeHeal.bind(this),
      0.95
    ));

    // 5. 补给弹药
    this.actions.push(new AIAction(
      'GetAmmo',
      [
        // 需要弹药
        new Consideration(
          'NeedsAmmo',
          (ctx: FPSContext) => 1 - ctx.ammo / ctx.maxAmmo,
          0, 1,
          new QuadraticCurve(1.5, false),
          1.1
        ),
        // 附近有弹药箱
        new Consideration(
          'AmmoNearby',
          (ctx: FPSContext) => ctx.nearestAmmoBox ?
            Math.max(0, 1 - ctx.ammoBoxDistance / 25) : 0,
          0, 1,
          new LinearCurve(1, 0),
          1.0
        ),
        // 安全性
        new Consideration(
          'IsSafe',
          (ctx: FPSContext) => ctx.canSeePlayer ? 0.3 : 1,
          0, 1,
          new LinearCurve(1, 0),
          0.7
        )
      ],
      this.executeGetAmmo.bind(this),
      0.85
    ));

    // 6. 协同战术
    this.actions.push(new AIAction(
      'SupportAlly',
      [
        // 有队友需要支援
        new Consideration(
          'AllyNearby',
          (ctx: FPSContext) => ctx.nearestAlly ?
            Math.max(0, 1 - ctx.allyDistance / 20) : 0,
          0, 1,
          new GaussianCurve(0.5, 0.3),
          1.0
        ),
        // 自己状态良好
        new Consideration(
          'GoodCondition',
          (ctx: FPSContext) => (ctx.health / ctx.maxHealth + ctx.ammo / ctx.maxAmmo) / 2,
          0, 1,
          new LinearCurve(1, 0),
          0.8
        )
      ],
      this.executeSupportAlly.bind(this),
      0.8
    ));

    // 7. 巡逻行为
    this.actions.push(new AIAction(
      'Patrol',
      [
        // 没有发现敌人
        new Consideration(
          'NoEnemyDetected',
          (ctx: FPSContext) => !ctx.canSeePlayer && ctx.timeSincePlayerSeen > 15000 ? 1 : 0,
          0, 1,
          new LinearCurve(1, 0),
          1.0
        ),
        // 状态良好
        new Consideration(
          'ReadyForPatrol',
          (ctx: FPSContext) => Math.min(ctx.health / ctx.maxHealth, ctx.ammo / ctx.maxAmmo),
          0, 1,
          new LogisticCurve(10, 0.5),
          0.8
        )
      ],
      this.executePatrol.bind(this),
      0.5  // 较低的基础权重
    ));
  }

  update(context: FPSContext): void {
    // 计算所有行为的效用值
    const scoredActions = this.actions.map(action => ({
      action,
      score: action.calculateUtility(context)
    }));

    // 调试输出
    if (this.debugMode) {
      this.logDebugInfo(scoredActions);
    }

    // 选择行为
    const selectedAction = this.selectionStrategy.select(scoredActions);

    // 执行行为
    if (selectedAction && selectedAction !== this.currentAction) {
      this.currentAction = selectedAction;
    }

    if (this.currentAction) {
      this.currentAction.execute(context);
    }
  }

  // 行为执行方法
  private executeAttack(context: FPSContext): void {
    console.log('Executing: Attack');
    // 实现攻击逻辑
  }

  private executeChase(context: FPSContext): void {
    console.log('Executing: Chase');
    // 实现追击逻辑
  }

  private executeSeekCover(context: FPSContext): void {
    console.log('Executing: SeekCover');
    // 实现寻找掩护逻辑
  }

  private executeHeal(context: FPSContext): void {
    console.log('Executing: Heal');
    // 实现治疗逻辑
  }

  private executeGetAmmo(context: FPSContext): void {
    console.log('Executing: GetAmmo');
    // 实现获取弹药逻辑
  }

  private executeSupportAlly(context: FPSContext): void {
    console.log('Executing: SupportAlly');
    // 实现支援队友逻辑
  }

  private executePatrol(context: FPSContext): void {
    console.log('Executing: Patrol');
    // 实现巡逻逻辑
  }

  private logDebugInfo(scoredActions: { action: AIAction; score: number }[]): void {
    console.log('=== Utility AI Debug ===');
    const sorted = [...scoredActions].sort((a, b) => b.score - a.score);
    for (const { action, score } of sorted) {
      const bar = '█'.repeat(Math.round(score * 20));
      console.log(`${action.name.padEnd(15)} ${score.toFixed(3)} ${bar}`);
    }
    console.log('========================');
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

// 使用示例
const enemyAI = new FPSEnemyAI();
enemyAI.setDebugMode(true);

// 模拟游戏循环
function gameLoop(context: FPSContext): void {
  enemyAI.update(context);
  requestAnimationFrame(() => gameLoop(context));
}
```

---

## 性能优化

### 评估优化

```typescript
// 1. 延迟评估：只在需要时计算
class LazyConsideration extends Consideration {
  private cachedValue: number | null = null;
  private lastEvaluationFrame: number = -1;

  evaluate(context: AIContext & { currentFrame: number }): number {
    // 同一帧内使用缓存值
    if (context.currentFrame === this.lastEvaluationFrame && this.cachedValue !== null) {
      return this.cachedValue;
    }

    this.cachedValue = super.evaluate(context);
    this.lastEvaluationFrame = context.currentFrame;
    return this.cachedValue;
  }

  invalidateCache(): void {
    this.cachedValue = null;
  }
}

// 2. 分层评估：先评估关键因素
class TieredUtilityBrain {
  private criticalConsiderations: Consideration[] = [];  // 快速排除用
  private detailedConsiderations: Consideration[] = [];  // 详细评估用

  evaluate(action: AIAction, context: AIContext): number {
    // 第一阶段：快速检查关键条件
    for (const consideration of this.criticalConsiderations) {
      const score = consideration.evaluate(context);
      if (score < 0.1) {
        return 0;  // 快速排除
      }
    }

    // 第二阶段：详细评估
    return this.calculateDetailedUtility(action, context);
  }

  private calculateDetailedUtility(action: AIAction, context: AIContext): number {
    // 完整的效用计算
    const scores = this.detailedConsiderations.map(c => c.evaluate(context));
    return UtilityCombiner.compensatedMultiply(scores);
  }
}

// 3. 增量更新：只重新计算变化的因素
class IncrementalUtilityCalculator {
  private lastContext: AIContext | null = null;
  private cachedScores: Map<string, number> = new Map();
  private contextChanges: Set<string> = new Set();

  update(context: AIContext): void {
    if (this.lastContext) {
      this.detectChanges(context);
    }
    this.lastContext = { ...context };
  }

  private detectChanges(newContext: AIContext): void {
    this.contextChanges.clear();

    for (const [key, value] of Object.entries(newContext)) {
      if (this.lastContext && (this.lastContext as any)[key] !== value) {
        this.contextChanges.add(key);
      }
    }
  }

  shouldRecalculate(consideration: Consideration, dependencies: string[]): boolean {
    // 检查相关数据是否变化
    return dependencies.some(dep => this.contextChanges.has(dep));
  }
}

// 4. 对象池：减少内存分配
class ConsiderationPool {
  private pool: Consideration[] = [];
  private activeCount: number = 0;

  acquire(
    name: string,
    inputGetter: (ctx: AIContext) => number,
    curve: ResponseCurve
  ): Consideration {
    if (this.activeCount < this.pool.length) {
      const consideration = this.pool[this.activeCount];
      // 重新配置现有对象
      (consideration as any).name = name;
      (consideration as any).inputGetter = inputGetter;
      (consideration as any).curve = curve;
      this.activeCount++;
      return consideration;
    }

    // 创建新对象
    const newConsideration = new Consideration(name, inputGetter, 0, 1, curve);
    this.pool.push(newConsideration);
    this.activeCount++;
    return newConsideration;
  }

  releaseAll(): void {
    this.activeCount = 0;
  }
}

// 5. 多线程评估（Web Worker）
class WorkerUtilityEvaluator {
  private worker: Worker;
  private pendingCallbacks: Map<string, (scores: number[]) => void> = new Map();

  constructor() {
    this.worker = new Worker('utility-worker.js');
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  evaluateAsync(
    actionId: string,
    context: AIContext,
    callback: (scores: number[]) => void
  ): void {
    this.pendingCallbacks.set(actionId, callback);
    this.worker.postMessage({
      type: 'evaluate',
      actionId,
      context
    });
  }

  private handleMessage(event: MessageEvent): void {
    const { actionId, scores } = event.data;
    const callback = this.pendingCallbacks.get(actionId);
    if (callback) {
      callback(scores);
      this.pendingCallbacks.delete(actionId);
    }
  }
}

// utility-worker.js 示例
/*
self.onmessage = function(event) {
  const { type, actionId, context } = event.data;

  if (type === 'evaluate') {
    // 在Worker中执行耗时的效用计算
    const scores = calculateUtilityScores(context);
    self.postMessage({ actionId, scores });
  }
};
*/
```

### 调度优化

```typescript
// 时间切片评估：分散计算负载
class TimeSlicedEvaluator {
  private actionQueue: AIAction[] = [];
  private evaluationResults: Map<string, number> = new Map();
  private maxTimePerFrame: number = 2; // 毫秒

  queueActions(actions: AIAction[]): void {
    this.actionQueue = [...actions];
    this.evaluationResults.clear();
  }

  processSlice(context: AIContext): boolean {
    const startTime = performance.now();

    while (this.actionQueue.length > 0) {
      if (performance.now() - startTime > this.maxTimePerFrame) {
        return false; // 时间片用完，下帧继续
      }

      const action = this.actionQueue.shift()!;
      const score = action.calculateUtility(context);
      this.evaluationResults.set(action.name, score);
    }

    return true; // 全部完成
  }

  getResults(): Map<string, number> {
    return this.evaluationResults;
  }

  isComplete(): boolean {
    return this.actionQueue.length === 0;
  }
}

// 优先级调度：重要行为优先评估
class PriorityScheduledEvaluator {
  private highPriorityActions: AIAction[] = [];
  private normalPriorityActions: AIAction[] = [];
  private lowPriorityActions: AIAction[] = [];

  private evaluationFrequency = {
    high: 1,     // 每帧
    normal: 3,   // 每3帧
    low: 10      // 每10帧
  };

  private frameCount: number = 0;

  update(context: AIContext): Map<string, number> {
    this.frameCount++;
    const results = new Map<string, number>();

    // 高优先级：每帧评估
    for (const action of this.highPriorityActions) {
      results.set(action.name, action.calculateUtility(context));
    }

    // 普通优先级：每N帧评估
    if (this.frameCount % this.evaluationFrequency.normal === 0) {
      for (const action of this.normalPriorityActions) {
        results.set(action.name, action.calculateUtility(context));
      }
    }

    // 低优先级：每N帧评估
    if (this.frameCount % this.evaluationFrequency.low === 0) {
      for (const action of this.lowPriorityActions) {
        results.set(action.name, action.calculateUtility(context));
      }
    }

    return results;
  }
}

// LOD系统：根据重要性调整评估精度
class LODUtilitySystem {
  evaluateWithLOD(
    action: AIAction,
    context: AIContext,
    lodLevel: 'high' | 'medium' | 'low'
  ): number {
    switch (lodLevel) {
      case 'high':
        // 完整评估
        return action.calculateUtility(context);

      case 'medium':
        // 只评估主要考量因素
        return this.evaluateMainConsiderations(action, context);

      case 'low':
        // 使用上次的缓存值或简化计算
        return this.getApproximateUtility(action, context);

      default:
        return action.calculateUtility(context);
    }
  }

  private evaluateMainConsiderations(action: AIAction, context: AIContext): number {
    // 只评估权重最高的前3个考量因素
    const mainConsiderations = (action as any).considerations
      .sort((a: Consideration, b: Consideration) => b.weight - a.weight)
      .slice(0, 3);

    const scores = mainConsiderations.map((c: Consideration) => c.evaluate(context));
    return UtilityCombiner.compensatedMultiply(scores);
  }

  private getApproximateUtility(action: AIAction, context: AIContext): number {
    // 使用简化的启发式计算
    // 这里可以根据具体游戏逻辑实现
    return 0.5; // 示例返回值
  }
}
```

---

## 面试要点

### 核心概念题

**Q1: 什么是效用AI？它与状态机和行为树有什么区别？**

效用AI是一种基于评分的决策系统，通过计算每个行为的"效用值"来选择最优行为。

主要区别：
- **状态机**：基于固定的状态转换规则，可预测但不灵活
- **行为树**：基于优先级的条件判断，结构化但可能产生重复行为
- **效用AI**：基于动态评分，行为更自然但调试较复杂

```typescript
// 效用AI的核心计算
function calculateUtility(action: Action, context: Context): number {
  const scores = action.considerations.map(c => c.evaluate(context));
  return combineScores(scores) * action.weight;
}
```

**Q2: 解释响应曲线的作用和常用类型**

响应曲线将输入值（如距离、血量）映射到0-1的效用分数：

- **线性曲线**：简单的线性关系
- **二次曲线**：平滑的加速/减速效果
- **S型曲线**：阈值行为，适合开关式决策
- **钟形曲线**：最优范围，如最佳攻击距离
- **阶跃曲线**：离散的等级划分

**Q3: 如何解决多因素组合时的"过度惩罚"问题？**

当使用乘法组合多个考量因素时，低分因素会过度影响结果。解决方案：

```typescript
// 补偿型乘法
function compensatedMultiply(scores: number[]): number {
  const product = scores.reduce((p, s) => p * s, 1);
  const modificationFactor = 1 - (1 / scores.length);
  const makeUpValue = (1 - product) * modificationFactor;
  return product + (makeUpValue * product);
}
```

### 工程实践题

**Q4: 如何调试效用AI系统？**

调试策略：
1. **可视化工具**：显示每个行为的效用值和考量因素分数
2. **日志记录**：记录决策历史和状态变化
3. **曲线编辑器**：实时调整响应曲线并观察效果
4. **断点测试**：在特定条件下暂停并检查计算过程

```typescript
class UtilityDebugger {
  logDecision(context: AIContext, scoredActions: ScoredAction[]): void {
    console.log('=== Decision Debug ===');
    for (const { action, score } of scoredActions.sort((a, b) => b.score - a.score)) {
      console.log(`${action.name}: ${score.toFixed(3)}`);
      for (const c of action.considerations) {
        console.log(`  - ${c.name}: ${c.evaluate(context).toFixed(3)}`);
      }
    }
  }
}
```

**Q5: 如何优化效用AI的性能？**

优化策略：
1. **延迟评估**：缓存结果，避免重复计算
2. **分层评估**：先快速排除不可能的行为
3. **增量更新**：只重新计算变化的因素
4. **时间切片**：将计算分散到多帧
5. **LOD系统**：根据重要性调整评估精度

### 设计题

**Q6: 设计一个RTS游戏单位的效用AI系统**

需要考虑：
- **行为种类**：攻击、防御、采集、建造、撤退等
- **考量因素**：单位生命值、敌人距离、资源距离、威胁等级等
- **优先级处理**：紧急行为（如躲避攻击）应该能打断普通行为
- **群体协调**：考虑与其他单位的配合

**Q7: 效用AI如何与其他AI架构结合？**

混合架构设计：
- **效用AI + 行为树**：效用AI做高层决策，行为树执行具体序列
- **效用AI + GOAP**：效用AI选择目标，GOAP规划行动路径
- **分层效用AI**：战略层、战术层、执行层各自独立评估

---

## 延伸阅读

### 推荐资源

1. **GDC演讲**
   - "Building a Better Centaur: AI at Massive Scale" - Damian Isla
   - "Architecture Tricks: Managing Behaviors in Time, Space, and Depth" - Dave Mark
   - "Improving AI Decision Modeling Through Utility Theory" - Dave Mark & Kevin Dill

2. **书籍**
   - 《Behavioral Mathematics for Game AI》- Dave Mark
   - 《Game AI Pro》系列 - 多位作者

3. **开源项目**
   - [Infinite Axis Utility System](https://github.com/iaus) - Unity实现
   - [BTSK](https://github.com/behavior-tree-starter-kit) - 行为树与效用AI结合

### 进阶主题

- **机器学习集成**：使用神经网络学习效用函数
- **遗传算法优化**：自动调整权重和曲线参数
- **蒙特卡洛树搜索**：结合效用评估和前瞻搜索
- **多智能体协调**：在效用系统中处理团队行为

---

## 总结

效用AI提供了一种强大而灵活的AI决策框架：

- **优势**：行为自然、易于扩展、参数可调
- **挑战**：调试复杂、需要仔细调参、可能出现振荡
- **最佳实践**：结合其他架构使用、建立完善的调试工具、迭代调优

掌握效用AI需要理解其核心原理（效用函数、响应曲线、行为选择），并通过实践积累调参经验。在实际项目中，效用AI往往与行为树、GOAP等其他架构结合使用，发挥各自优势。

关键是要记住：效用AI不是万能的，它是工具箱中的一个工具。选择合适的架构取决于具体的游戏需求和AI行为的复杂度要求。
