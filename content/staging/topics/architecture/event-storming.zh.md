---
title: 事件风暴
description: 学习事件风暴进行领域探索和建模
track: architecture
section: ddd
difficulty: intermediate
tags:
  - 事件风暴
  - DDD
  - 领域建模
  - 工作坊
status: imported
origin: old/src/content/docs/architecture/event-storming.zh.md
divergence: 0.176
issues: []
legacy:
  category: Architecture
  subcategory: DDD
  order: 22
  lastUpdated: 2026-01-07
---

## 概念解释

事件风暴 (Event Storming) 是由 Alberto Brandolini 在 2013 年提出的一种协作式领域建模方法。它通过识别领域中发生的业务事件，帮助团队快速探索和理解复杂的业务流程，并最终形成清晰的领域模型和系统边界。

### 什么是事件风暴？

事件风暴是一种**可视化、协作式的工作坊形式**，参与者使用不同颜色的便签纸在一面长墙上描绘业务流程。整个过程以**领域事件**为核心，从"发生了什么"出发，逐步探索"为什么发生"、"谁触发的"、"影响了什么"等问题。

事件风暴的核心理念：
- **事件优先**：先识别系统中发生的事件，再反推原因和结果
- **协作探索**：业务专家和技术人员共同参与，打破知识壁垒
- **可视化思考**：通过便签墙让隐性知识显性化
- **快速迭代**：允许不断调整和完善模型

### 事件风暴解决什么问题？

1. **知识获取困难**：业务知识分散在不同人脑中，难以系统化提取
2. **沟通效率低下**：业务人员和技术人员使用不同的语言体系
3. **需求理解偏差**：传统需求文档容易产生歧义和遗漏
4. **系统边界模糊**：难以确定微服务或模块的合理边界
5. **团队认知不一致**：不同角色对同一业务流程的理解不同

### 事件风暴的类型

根据目标和深度，事件风暴分为三种类型：

#### 大图事件风暴 (Big Picture Event Storming)

- **目标**：探索整个业务领域，建立全局视图
- **时长**：半天到一天
- **参与者**：跨部门的业务专家、产品经理、架构师
- **产出**：业务流程全景图、关键问题清单、初步的限界上下文

#### 流程建模事件风暴 (Process Modeling Event Storming)

- **目标**：深入分析特定业务流程，优化流程设计
- **时长**：2-4 小时
- **参与者**：相关业务专家、产品经理、开发人员
- **产出**：详细的业务流程图、自动化机会识别、流程优化建议

#### 软件设计事件风暴 (Design Level Event Storming)

- **目标**：为软件实现提供详细的领域模型设计
- **时长**：2-4 小时（可能需要多次）
- **参与者**：开发团队、技术架构师、关键业务专家
- **产出**：聚合设计、命令和事件定义、读模型设计

---

## 便签颜色系统

事件风暴使用不同颜色的便签来表示不同类型的概念。这套颜色系统是事件风暴的核心语言。

### 标准便签颜色

| 颜色 | 代表概念 | 说明 | 命名规则 |
|-----|---------|------|---------|
| **橙色** | 领域事件 (Domain Event) | 系统中发生的业务事件 | 过去时态：订单已创建 |
| **蓝色** | 命令 (Command) | 触发事件的意图或动作 | 祈使句：创建订单 |
| **黄色** | 聚合 (Aggregate) | 处理命令、产生事件的实体 | 名词：订单、用户 |
| **紫色/小黄** | 策略 (Policy) | 事件触发的自动化规则 | When-Then：当...时 |
| **粉色** | 外部系统 (External System) | 第三方系统或服务 | 名词：支付网关 |
| **绿色** | 读模型 (Read Model) | 用户查看的信息视图 | 名词：订单详情页 |
| **大黄色** | 参与者 (Actor) | 触发命令的人或角色 | 角色名：买家、客服 |
| **红色** | 热点 (Hot Spot) | 问题、疑问、冲突 | 问题描述 |

### 便签关系图

```
[参与者]        [外部系统]
    |               |
    v               v
[命令] ---------> [聚合] ---------> [领域事件]
                                        |
                                        v
                                    [策略]
                                        |
                                        v
                                    [命令]（触发新流程）

[读模型] <-------- 查询
```

### 详细说明

#### 领域事件 (Domain Event) - 橙色便签

领域事件是系统中已经发生的业务事实，是事件风暴的核心元素。

```
领域事件命名规则：
- 使用过去时态
- 使用业务语言，避免技术术语
- 具体且有意义

好的例子：
- 订单已创建 (OrderCreated)
- 付款已完成 (PaymentCompleted)
- 库存已扣减 (InventoryDeducted)
- 发票已开具 (InvoiceIssued)

不好的例子：
- 数据已保存 (DataSaved) - 太技术化
- 订单处理 (OrderProcessing) - 不是过去时
- 操作成功 (OperationSucceeded) - 不够具体
```

#### 命令 (Command) - 蓝色便签

命令表示用户或系统的意图，是触发领域事件的动作。

```
命令命名规则：
- 使用祈使句
- 明确表达意图
- 一个命令对应一个意图

好的例子：
- 创建订单 (CreateOrder)
- 确认付款 (ConfirmPayment)
- 取消订单 (CancelOrder)
- 申请退款 (RequestRefund)

命令与事件的对应关系：
创建订单 --> 订单已创建
确认付款 --> 付款已确认
取消订单 --> 订单已取消
```

#### 聚合 (Aggregate) - 黄色便签

聚合是处理命令并产生事件的业务实体，代表一个一致性边界。

```
聚合识别技巧：
1. 命令作用于哪个实体？
2. 哪个实体的状态会因此改变？
3. 业务规则由谁来保证？

常见聚合示例：
- 订单 (Order)
- 用户账户 (UserAccount)
- 库存项 (InventoryItem)
- 支付交易 (PaymentTransaction)
```

#### 策略/规则 (Policy) - 紫色便签

策略描述事件发生后的自动化响应规则，是连接不同业务流程的桥梁。

```
策略表达方式：
When [事件] Then [命令]
当 [某事发生] 时 [执行某动作]

示例：
- 当订单已创建时，锁定库存
- 当付款已完成时，扣减库存
- 当库存不足时，通知采购部门
- 当订单已发货时，发送通知短信
```

#### 热点 (Hot Spot) - 红色便签

热点标记需要进一步讨论的问题、冲突或不确定性。

```
热点类型：
- 业务规则不清楚
- 存在多种实现方案
- 技术可行性存疑
- 利益相关者意见冲突
- 边界情况未定义

示例：
- "并发下单如何处理？"
- "超时未付款自动取消的时间是多少？"
- "退款是否需要审批？"
- "库存不足时是否允许下单？"
```

---

## 工作坊流程

### 准备阶段

#### 确定工作坊目标

```
明确要回答的问题：
- 我们要探索哪个业务领域？
- 我们希望达到什么深度？
- 预期产出是什么？

目标示例：
- "理解电商订单从创建到完成的完整流程"
- "识别支付系统与订单系统的边界"
- "找出当前退款流程的痛点"
```

#### 邀请合适的参与者

```
必须参与：
- 领域专家（了解业务规则的人）
- 产品负责人（了解业务需求的人）
- 技术骨干（了解系统实现的人）

建议参与：
- 用户代表
- 运营人员
- 客服人员

最佳人数：6-10 人
最小人数：4 人
最大人数：15 人
```

#### 准备物料

```
必备物料：
- 大量便签纸（各种颜色）
- 马克笔（粗头，便于远距离阅读）
- 白板或长墙面（至少 5 米长）
- 卷纸或白板纸（覆盖墙面）

可选物料：
- 计时器
- 相机（记录结果）
- 投票贴纸
```

#### 场地布置

```
场地要求：
- 足够长的墙面空间（越长越好）
- 站立工作的空间
- 避免传统会议室的桌椅布局
- 良好的照明

布局示例：
┌─────────────────────────────────────────────────────┐
│                    便签墙                            │
│  [时间线开始] ─────────────────────> [时间线结束]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│          开放的站立空间                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 执行阶段

#### 第一阶段：混沌探索 (Chaotic Exploration)

**目标**：尽可能多地识别领域事件
**时长**：20-30 分钟

```
引导语：
"请大家用橙色便签写下这个业务领域中发生的所有事件。
使用过去时态，比如'订单已创建'、'付款已完成'。
不要讨论，不要担心顺序，只管写，越多越好。"

规则：
1. 每人独立思考，同时写便签
2. 写完就贴到墙上，不要等
3. 不要讨论或解释
4. 看到别人的便签可以激发新想法
5. 允许重复（后续会合并）

引导技巧：
- "还有什么事件？"
- "最开始发生什么？最后发生什么？"
- "出错时会发生什么？"
- "有什么特殊情况？"
```

#### 第二阶段：时间线整理 (Timeline Enforcement)

**目标**：按时间顺序排列事件
**时长**：30-45 分钟

```
引导语：
"现在让我们把这些事件按时间顺序排列。
哪个事件先发生？哪个后发生？
事件之间有什么因果关系？"

步骤：
1. 从左到右代表时间流逝
2. 找出"开始"事件和"结束"事件
3. 逐个移动便签到正确位置
4. 允许讨论和争论
5. 识别并行的分支流程

常见模式：
┌─ [正常流程事件1] ─ [正常流程事件2] ─ [正常流程事件3] ─┐
│                                                        │
│         ┌─ [异常流程事件1] ─ [异常流程事件2] ─┐         │
│         │                                     │         │
└─────────┴─────────────────────────────────────┴─────────┘
```

#### 第三阶段：反向追问 (Reverse Narrative)

**目标**：从事件反推命令和聚合
**时长**：30-45 分钟

```
引导语：
"对于每个事件，让我们问：
- 是什么动作导致了这个事件？（命令 - 蓝色便签）
- 这个命令作用于什么？（聚合 - 黄色便签）
- 谁发起了这个命令？（参与者 - 大黄色便签）"

操作流程：
选取一个事件 → 贴上相关的命令 → 识别聚合 → 标注参与者

示例：
[买家] ─> [创建订单] ─> [订单] ─> [订单已创建]
[买家] ─> [支付订单] ─> [支付] ─> [付款已完成]
[卖家] ─> [发货] ─> [发货单] ─> [订单已发货]
```

#### 第四阶段：识别规则和外部系统 (Policy & External Systems)

**目标**：发现自动化规则和外部依赖
**时长**：20-30 分钟

```
引导语：
"当某个事件发生后，有没有什么自动触发的动作？
系统会自动做什么？有没有需要调用的外部服务？"

问题清单：
- "这个事件发生后，系统会自动做什么？"
- "有没有定时任务或后台处理？"
- "需要调用哪些第三方服务？"
- "有没有通知或提醒？"

示例：
[订单已创建] ─> [策略：锁定库存] ─> [锁定库存] ─> [库存已锁定]
[付款已完成] ─> [策略：通知卖家] ─> [发送通知] ─> [卖家已通知]
[付款超时] ─> [策略：自动取消] ─> [取消订单] ─> [订单已取消]
```

#### 第五阶段：标记热点 (Pain Points Exploration)

**目标**：识别问题和不确定性
**时长**：15-20 分钟

```
引导语：
"现在让我们用红色便签标记所有的问题和疑问。
任何不清楚的地方、有争议的点、需要进一步讨论的问题都可以标记。"

常见热点类型：
- 业务规则不明确："超时多久取消订单？"
- 边界情况："库存不足怎么办？"
- 技术挑战："如何保证数据一致性？"
- 利益冲突："退款需要审批吗？"

处理方式：
1. 收集所有热点
2. 投票确定优先级
3. 安排后续专项讨论
```

#### 第六阶段：识别限界上下文 (Bounded Context Discovery)

**目标**：划分系统边界
**时长**：20-30 分钟

```
引导语：
"让我们退后一步，看看这些聚合和事件可以分成哪几个独立的区域。
哪些聚合总是一起出现？哪些区域的语言不太一样？"

识别技巧：
1. 相同聚合出现的区域可能属于同一上下文
2. 语言变化的地方可能是边界
3. 团队归属不同的地方可能是边界
4. 数据一致性要求不同的地方可能是边界

示例：
┌────────────────────┐  ┌────────────────────┐
│    订单上下文       │  │    支付上下文       │
│                    │  │                    │
│ [订单] [订单项]     │  │ [支付] [退款]      │
│                    │  │                    │
│ 订单已创建         │  │ 付款已完成         │
│ 订单已确认         │  │ 退款已处理         │
└────────────────────┘  └────────────────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    v
              [集成事件]
```

---

## 实战案例：电商订单系统

### 场景描述

假设我们要为一个电商平台设计订单系统，需要支持以下核心功能：
- 用户下单
- 在线支付
- 库存管理
- 订单发货
- 退款退货

### 第一阶段产出：领域事件

```
橙色便签（领域事件）：

购物相关：
- 商品已加入购物车
- 购物车已更新
- 购物车已清空

订单相关：
- 订单已创建
- 订单已确认
- 订单已取消
- 订单已超时
- 订单已完成

支付相关：
- 付款已发起
- 付款已完成
- 付款已失败
- 退款已申请
- 退款已完成
- 退款已拒绝

库存相关：
- 库存已锁定
- 库存已扣减
- 库存已释放
- 库存不足

物流相关：
- 发货单已创建
- 订单已发货
- 订单已签收
- 配送失败
```

### 第二阶段产出：时间线

```
正常购买流程：

[商品已加入购物车] -> [订单已创建] -> [库存已锁定] -> [付款已发起]
                                                          |
                                                          v
[付款已完成] -> [库存已扣减] -> [订单已确认] -> [发货单已创建]
                                                          |
                                                          v
                              [订单已发货] -> [订单已签收] -> [订单已完成]


取消流程（付款前）：

[订单已创建] -> [库存已锁定] -> [订单已取消] -> [库存已释放]


超时流程：

[订单已创建] -> [库存已锁定] -> [订单已超时] -> [库存已释放] -> [订单已取消]


退款流程：

[订单已完成] -> [退款已申请] -> [退款已完成] -> [库存已释放]
                     |
                     └-> [退款已拒绝]
```

### 第三阶段产出：命令和聚合

```
┌─────────┬───────────────┬─────────┬─────────────────┐
│ 参与者   │ 命令          │ 聚合     │ 事件            │
├─────────┼───────────────┼─────────┼─────────────────┤
│ 买家    │ 添加到购物车   │ 购物车   │ 商品已加入购物车 │
│ 买家    │ 提交订单      │ 订单     │ 订单已创建      │
│ 系统    │ 锁定库存      │ 库存     │ 库存已锁定      │
│ 买家    │ 发起支付      │ 支付     │ 付款已发起      │
│ 支付网关│ 确认支付      │ 支付     │ 付款已完成      │
│ 系统    │ 扣减库存      │ 库存     │ 库存已扣减      │
│ 系统    │ 确认订单      │ 订单     │ 订单已确认      │
│ 卖家    │ 创建发货单    │ 发货单   │ 发货单已创建    │
│ 物流    │ 更新物流状态   │ 发货单   │ 订单已发货      │
│ 买家    │ 确认收货      │ 订单     │ 订单已签收      │
│ 买家    │ 取消订单      │ 订单     │ 订单已取消      │
│ 系统    │ 释放库存      │ 库存     │ 库存已释放      │
│ 买家    │ 申请退款      │ 退款     │ 退款已申请      │
│ 客服    │ 审批退款      │ 退款     │ 退款已完成      │
└─────────┴───────────────┴─────────┴─────────────────┘
```

### 第四阶段产出：策略和外部系统

```
策略（紫色便签）：

[订单已创建] ─策略─> [当订单创建时，锁定库存]
[付款已完成] ─策略─> [当付款完成时，扣减库存并确认订单]
[付款30分钟未完成] ─策略─> [当付款超时时，取消订单并释放库存]
[订单已确认] ─策略─> [当订单确认时，通知卖家发货]
[订单已发货] ─策略─> [当发货时，发送物流通知给买家]
[订单已取消] ─策略─> [当订单取消时，释放库存]
[退款已完成] ─策略─> [当退款完成时，释放已扣减的库存]

外部系统（粉色便签）：

- 支付网关（支付宝、微信支付）
- 物流服务商（顺丰、中通等）
- 短信/推送服务
- 发票系统
```

### 第五阶段产出：热点问题

```
红色便签（热点）：

高优先级：
- [?] 并发下单库存超卖如何处理？
- [?] 付款超时的具体时间是多少？15分钟？30分钟？
- [?] 部分退款如何处理？
- [?] 已发货订单取消如何处理？

中优先级：
- [?] 库存不足时是否允许下单预约？
- [?] 退款需要几级审批？
- [?] 发票开具的时机是什么？
- [?] 物流异常的重试策略？

低优先级：
- [?] 是否支持货到付款？
- [?] 是否支持分期付款？
```

### 第六阶段产出：限界上下文

```
识别出的限界上下文：

┌─────────────────────────────────────────────────────────────────┐
│                        电商领域                                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  购物车上下文  │  │  订单上下文   │  │  支付上下文   │          │
│  │              │  │              │  │              │          │
│  │ - 购物车     │  │ - 订单       │  │ - 支付       │          │
│  │ - 购物车项   │  │ - 订单项     │  │ - 退款       │          │
│  │              │  │              │  │              │          │
│  │ 添加商品     │  │ 创建订单     │  │ 发起支付     │          │
│  │ 更新数量     │  │ 确认订单     │  │ 确认支付     │          │
│  │ 清空购物车   │  │ 取消订单     │  │ 申请退款     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  库存上下文   │  │  物流上下文   │  │  通知上下文   │          │
│  │              │  │              │  │              │          │
│  │ - 库存       │  │ - 发货单     │  │ - 通知       │          │
│  │ - 库存锁定   │  │ - 物流跟踪   │  │ - 模板       │          │
│  │              │  │              │  │              │          │
│  │ 锁定库存     │  │ 创建发货单   │  │ 发送通知     │          │
│  │ 扣减库存     │  │ 更新状态     │  │              │          │
│  │ 释放库存     │  │ 签收确认     │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

上下文映射关系：

购物车上下文 ──创建订单──> 订单上下文
订单上下文 ──锁定/释放库存──> 库存上下文
订单上下文 ──发起支付──> 支付上下文
支付上下文 ──支付结果──> 订单上下文
订单上下文 ──创建发货单──> 物流上下文
物流上下文 ──物流状态──> 订单上下文
多个上下文 ──发送通知──> 通知上下文
```

---

## 代码示例：从事件风暴到实现

### 领域事件定义

```typescript
// 领域事件基类
abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public abstract readonly eventType: string;

  constructor() {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}

// 订单已创建事件
class OrderCreatedEvent extends DomainEvent {
  public readonly eventType = 'ORDER_CREATED';

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItemSnapshot[],
    public readonly totalAmount: Money
  ) {
    super();
  }
}

// 付款已完成事件
class PaymentCompletedEvent extends DomainEvent {
  public readonly eventType = 'PAYMENT_COMPLETED';

  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: Money,
    public readonly paidAt: Date
  ) {
    super();
  }
}

// 库存已锁定事件
class InventoryLockedEvent extends DomainEvent {
  public readonly eventType = 'INVENTORY_LOCKED';

  constructor(
    public readonly orderId: string,
    public readonly items: Array<{
      productId: string;
      quantity: number;
    }>
  ) {
    super();
  }
}

// 订单已发货事件
class OrderShippedEvent extends DomainEvent {
  public readonly eventType = 'ORDER_SHIPPED';

  constructor(
    public readonly orderId: string,
    public readonly trackingNumber: string,
    public readonly carrier: string,
    public readonly shippedAt: Date
  ) {
    super();
  }
}
```

### 命令定义

```typescript
// 命令基类
abstract class Command {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor() {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

// 创建订单命令
class CreateOrderCommand extends Command {
  constructor(
    public readonly customerId: string,
    public readonly items: Array<{
      productId: string;
      quantity: number;
    }>,
    public readonly shippingAddress: Address
  ) {
    super();
  }
}

// 发起支付命令
class InitiatePaymentCommand extends Command {
  constructor(
    public readonly orderId: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly amount: Money
  ) {
    super();
  }
}

// 锁定库存命令
class LockInventoryCommand extends Command {
  constructor(
    public readonly orderId: string,
    public readonly items: Array<{
      productId: string;
      quantity: number;
    }>
  ) {
    super();
  }
}

// 取消订单命令
class CancelOrderCommand extends Command {
  constructor(
    public readonly orderId: string,
    public readonly reason: CancellationReason,
    public readonly cancelledBy: string
  ) {
    super();
  }
}
```

### 聚合实现

```typescript
// 订单聚合根
class Order {
  private readonly id: OrderId;
  private readonly customerId: CustomerId;
  private status: OrderStatus;
  private items: OrderItem[];
  private shippingAddress: Address;
  private totalAmount: Money;
  private readonly events: DomainEvent[] = [];

  private constructor(props: OrderProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.status = props.status;
    this.items = props.items;
    this.shippingAddress = props.shippingAddress;
    this.totalAmount = props.totalAmount;
  }

  // 工厂方法：创建新订单
  static create(
    id: OrderId,
    customerId: CustomerId,
    items: OrderItem[],
    shippingAddress: Address
  ): Order {
    if (items.length === 0) {
      throw new EmptyOrderError('订单必须包含至少一个商品');
    }

    const totalAmount = items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero('CNY')
    );

    const order = new Order({
      id,
      customerId,
      status: OrderStatus.Created,
      items,
      shippingAddress,
      totalAmount
    });

    // 发布订单已创建事件
    order.addEvent(new OrderCreatedEvent(
      id.value,
      customerId.value,
      items.map(item => item.toSnapshot()),
      totalAmount
    ));

    return order;
  }

  // 确认订单（付款成功后调用）
  confirm(): void {
    if (this.status !== OrderStatus.Created) {
      throw new InvalidOrderStateError(
        `无法确认状态为 ${this.status} 的订单`
      );
    }

    this.status = OrderStatus.Confirmed;

    this.addEvent(new OrderConfirmedEvent(
      this.id.value,
      new Date()
    ));
  }

  // 取消订单
  cancel(reason: CancellationReason): void {
    if (!this.canBeCancelled()) {
      throw new InvalidOrderStateError(
        `状态为 ${this.status} 的订单不能取消`
      );
    }

    this.status = OrderStatus.Cancelled;

    this.addEvent(new OrderCancelledEvent(
      this.id.value,
      reason,
      new Date()
    ));
  }

  // 标记为已发货
  ship(trackingNumber: string, carrier: string): void {
    if (this.status !== OrderStatus.Confirmed) {
      throw new InvalidOrderStateError(
        '只有已确认的订单可以发货'
      );
    }

    this.status = OrderStatus.Shipped;

    this.addEvent(new OrderShippedEvent(
      this.id.value,
      trackingNumber,
      carrier,
      new Date()
    ));
  }

  // 完成订单（签收后调用）
  complete(): void {
    if (this.status !== OrderStatus.Shipped) {
      throw new InvalidOrderStateError(
        '只有已发货的订单可以完成'
      );
    }

    this.status = OrderStatus.Completed;

    this.addEvent(new OrderCompletedEvent(
      this.id.value,
      new Date()
    ));
  }

  private canBeCancelled(): boolean {
    return [OrderStatus.Created, OrderStatus.Confirmed].includes(this.status);
  }

  private addEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this.events];
    this.events.length = 0;
    return events;
  }

  // Getters
  get orderId(): OrderId { return this.id; }
  get orderStatus(): OrderStatus { return this.status; }
  get orderItems(): readonly OrderItem[] { return this.items; }
  get total(): Money { return this.totalAmount; }
}
```

### 策略实现

```typescript
// 策略：订单创建后锁定库存
class LockInventoryOnOrderCreatedPolicy {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventBus: EventBus
  ) {}

  @EventHandler(OrderCreatedEvent)
  async handle(event: OrderCreatedEvent): Promise<void> {
    try {
      // 锁定库存
      await this.inventoryService.lockInventory(
        event.orderId,
        event.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      );

      // 发布库存已锁定事件
      await this.eventBus.publish(new InventoryLockedEvent(
        event.orderId,
        event.items
      ));

    } catch (error) {
      if (error instanceof InsufficientInventoryError) {
        // 库存不足，发布库存不足事件
        await this.eventBus.publish(new InventoryInsufficientEvent(
          event.orderId,
          error.productId
        ));
      }
      throw error;
    }
  }
}

// 策略：付款完成后确认订单
class ConfirmOrderOnPaymentCompletedPolicy {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService
  ) {}

  @EventHandler(PaymentCompletedEvent)
  async handle(event: PaymentCompletedEvent): Promise<void> {
    // 获取订单
    const order = await this.orderRepository.findById(
      new OrderId(event.orderId)
    );

    if (!order) {
      throw new OrderNotFoundError(event.orderId);
    }

    // 扣减库存（将锁定转为实际扣减）
    await this.inventoryService.deductInventory(
      event.orderId,
      order.orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    );

    // 确认订单
    order.confirm();

    // 保存订单
    await this.orderRepository.save(order);
  }
}

// 策略：订单超时自动取消
class CancelOrderOnPaymentTimeoutPolicy {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly scheduler: Scheduler
  ) {}

  @EventHandler(OrderCreatedEvent)
  async handle(event: OrderCreatedEvent): Promise<void> {
    // 安排30分钟后检查支付状态
    await this.scheduler.schedule(
      `order-timeout-${event.orderId}`,
      30 * 60 * 1000, // 30分钟
      async () => {
        const order = await this.orderRepository.findById(
          new OrderId(event.orderId)
        );

        // 如果订单仍在创建状态（未支付），则取消
        if (order && order.orderStatus === OrderStatus.Created) {
          order.cancel(CancellationReason.PaymentTimeout);

          // 释放库存
          await this.inventoryService.releaseInventory(event.orderId);

          await this.orderRepository.save(order);
        }
      }
    );
  }
}

// 策略：订单取消后释放库存
class ReleaseInventoryOnOrderCancelledPolicy {
  constructor(
    private readonly inventoryService: InventoryService
  ) {}

  @EventHandler(OrderCancelledEvent)
  async handle(event: OrderCancelledEvent): Promise<void> {
    await this.inventoryService.releaseInventory(event.orderId);
  }
}

// 策略：订单发货后发送通知
class NotifyCustomerOnOrderShippedPolicy {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly notificationService: NotificationService
  ) {}

  @EventHandler(OrderShippedEvent)
  async handle(event: OrderShippedEvent): Promise<void> {
    const order = await this.orderRepository.findById(
      new OrderId(event.orderId)
    );

    if (!order) return;

    const customer = await this.customerRepository.findById(
      order.customerId
    );

    if (!customer) return;

    await this.notificationService.send({
      to: customer.phone,
      template: 'order-shipped',
      data: {
        orderId: event.orderId,
        trackingNumber: event.trackingNumber,
        carrier: event.carrier
      }
    });
  }
}
```

### 应用服务

```typescript
// 订单应用服务
class OrderApplicationService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly eventBus: EventBus,
    private readonly unitOfWork: UnitOfWork
  ) {}

  // 创建订单用例
  async createOrder(command: CreateOrderCommand): Promise<string> {
    return this.unitOfWork.execute(async () => {
      // 生成订单ID
      const orderId = this.orderRepository.nextId();

      // 构建订单项
      const orderItems: OrderItem[] = [];
      for (const item of command.items) {
        const product = await this.productRepository.findById(
          new ProductId(item.productId)
        );

        if (!product) {
          throw new ProductNotFoundError(item.productId);
        }

        if (!product.isAvailable()) {
          throw new ProductNotAvailableError(item.productId);
        }

        orderItems.push(OrderItem.create(
          product.id,
          product.name,
          item.quantity,
          product.price
        ));
      }

      // 创建订单
      const order = Order.create(
        orderId,
        new CustomerId(command.customerId),
        orderItems,
        command.shippingAddress
      );

      // 保存订单
      await this.orderRepository.save(order);

      // 发布领域事件（触发库存锁定策略）
      for (const event of order.pullEvents()) {
        await this.eventBus.publish(event);
      }

      return orderId.value;
    });
  }

  // 取消订单用例
  async cancelOrder(command: CancelOrderCommand): Promise<void> {
    return this.unitOfWork.execute(async () => {
      const order = await this.orderRepository.findById(
        new OrderId(command.orderId)
      );

      if (!order) {
        throw new OrderNotFoundError(command.orderId);
      }

      order.cancel(command.reason);

      await this.orderRepository.save(order);

      // 发布领域事件（触发库存释放策略）
      for (const event of order.pullEvents()) {
        await this.eventBus.publish(event);
      }
    });
  }
}
```

---

## 引导技巧

### 开场引导

```
"欢迎大家参加今天的事件风暴工作坊。

我们的目标是用2-3小时的时间，共同探索和理解[业务领域]的核心流程。

事件风暴不是技术会议，我们需要业务专家的知识。
在这里没有错误的答案，每个人的视角都很重要。

规则很简单：
1. 用便签写下你想到的内容
2. 写完就贴到墙上
3. 如果有问题或不确定的地方，用红色便签标记
4. 允许讨论，但避免陷入细节争论

让我们开始吧！"
```

### 常用提问

```
激发思考的问题：
- "这个业务流程的起点是什么？终点是什么？"
- "在这一步之后，会发生什么？"
- "如果出错了会怎样？"
- "有没有什么特殊情况？"
- "谁会关心这个事件？"
- "这个动作谁可以触发？"
- "系统会自动做什么响应？"

处理冲突的问题：
- "两种说法的区别在哪里？"
- "什么情况下是A？什么情况下是B？"
- "我们能举一个具体的例子吗？"
- "这个问题需要现在决定吗？还是先记下来？"

推进进度的问题：
- "这个区域我们已经探索得差不多了，还有其他流程吗？"
- "让我们看看还有什么遗漏的事件"
- "这些热点问题我们后续再讨论，先继续"
```

### 常见问题处理

#### 问题1：参与者陷入技术细节

```
症状：
- 讨论数据库设计
- 讨论 API 接口
- 讨论技术实现方案

处理方法：
"这些技术细节很重要，但现在让我们专注于业务流程。
技术实现我们可以在后续的设计阶段再讨论。
现在请关注：从业务角度，会发生什么？"
```

#### 问题2：某人主导发言

```
症状：
- 一个人不断发言
- 其他人保持沉默
- 便签都出自同一人

处理方法：
"谢谢你的贡献！让我们也听听其他人的想法。
[对其他人] 你们在实际工作中，有遇到过什么特殊情况吗？"

或者：
"现在请每个人安静地写便签，5分钟后我们再讨论。"
```

#### 问题3：争论不休

```
症状：
- 对某个术语或流程理解不同
- 讨论陷入僵局
- 情绪开始激动

处理方法：
"看来这里有不同的理解，这很正常。
让我们用红色便签标记这个问题，稍后专门讨论。
现在先继续其他流程。"

或者：
"让我们用具体场景来验证。
假设有个客户张三，他会遇到什么情况？"
```

#### 问题4：参与者不知道写什么

```
症状：
- 长时间盯着便签纸
- 只有少数人在写
- 便签数量明显不足

处理方法：
"让我给一些提示：
- 想想你最近处理的一个实际案例
- 从头到尾会经历哪些步骤？
- 有没有遇到过问题或例外情况？"

或者给出示例：
"比如说'订单已创建'、'付款已完成'，
还有哪些类似的事件？"
```

---

## 最佳实践

### 工作坊前的准备

```
提前准备清单：

[ ] 明确工作坊目标和范围
[ ] 确认参与者名单和角色
[ ] 准备充足的物料
[ ] 预订足够大的场地
[ ] 准备一面长墙或白板
[ ] 测试马克笔是否好用
[ ] 准备计时器
[ ] 准备相机记录结果

给参与者的预通知：
- 时间和地点
- 工作坊目标
- 不需要准备PPT
- 穿舒适的鞋子（会站立很久）
```

### 工作坊中的节奏把控

```
时间分配建议（3小时工作坊）：

0:00-0:15  开场介绍、规则说明
0:15-0:45  混沌探索（领域事件）
0:45-1:15  时间线整理
1:15-1:30  休息
1:30-2:00  命令和聚合识别
2:00-2:30  策略和外部系统
2:30-2:45  热点标记
2:45-3:00  限界上下文讨论、总结

节奏控制技巧：
- 每30分钟检查一次进度
- 使用计时器提醒
- 不要在一个问题上停留太久
- 用红色便签"停车"争议话题
```

### 工作坊后的成果整理

```
产出整理清单：

[ ] 拍照记录整面墙
[ ] 整理领域事件清单
[ ] 整理命令清单
[ ] 整理聚合清单
[ ] 整理限界上下文图
[ ] 整理热点问题清单
[ ] 编写工作坊总结文档
[ ] 分享给所有参与者

后续行动：
[ ] 安排热点问题专项讨论
[ ] 将结果转化为领域模型设计
[ ] 更新团队知识库
```

### 避免常见错误

```
应该避免的做法：

1. 不要试图一次解决所有问题
   ✗ 在工作坊中设计数据库
   ✓ 专注于理解业务流程

2. 不要过早进入解决方案
   ✗ "这里可以用消息队列"
   ✓ "这里需要异步处理"

3. 不要让技术人员主导
   ✗ 业务专家只是旁听
   ✓ 业务专家是知识来源

4. 不要追求完美
   ✗ 要把每个细节都搞清楚
   ✓ 先建立全局视图，细节后续迭代

5. 不要忽视热点问题
   ✗ 假装问题不存在
   ✓ 用红色便签记录，安排后续讨论
```

---

## 进阶技巧

### 与其他 DDD 方法结合

```
事件风暴 + 用例分析：
- 用事件风暴识别核心流程
- 用用例图细化参与者交互

事件风暴 + 上下文映射：
- 用事件风暴识别限界上下文
- 用上下文映射定义集成关系

事件风暴 + 聚合设计：
- 用事件风暴识别聚合候选
- 深入分析聚合边界和不变式
```

### 远程事件风暴

```
在线工具选择：
- Miro
- Figma
- MURAL
- Lucidchart

远程工作坊技巧：
1. 提前建好模板
2. 准备好便签颜色图例
3. 使用视频通话保持互动
4. 缩短工作坊时长（2小时为宜）
5. 更频繁的休息
6. 使用投票功能决策

模板设计：
┌──────────────────────────────────────────┐
│                时间线                     │
├──────────────────────────────────────────┤
│ 参与者区 │    便签工作区    │  热点区    │
├──────────────────────────────────────────┤
│              图例说明                     │
└──────────────────────────────────────────┘
```

### 持续事件风暴

```
事件风暴不是一次性活动，可以持续进行：

Sprint 启动：
- 用30分钟事件风暴对齐需求理解

架构评审：
- 用事件风暴展示系统设计

新成员培训：
- 用已有的事件风暴结果介绍系统

需求变更：
- 在已有模型上增量更新
```

---

## 面试要点

### Q1: 什么是事件风暴？它有什么优势？

**答**：事件风暴是一种协作式的领域建模方法，通过识别领域事件来探索业务流程。核心优势包括：
1. **快速建立共识**：2-3小时即可获得业务全貌
2. **促进沟通**：打破业务和技术的语言壁垒
3. **知识外化**：将隐性知识转化为可视化模型
4. **识别边界**：自然地发现限界上下文
5. **发现问题**：通过热点标记暴露业务复杂度

### Q2: 事件风暴中的便签颜色代表什么？

**答**：
- **橙色**：领域事件（已发生的业务事实）
- **蓝色**：命令（触发事件的意图）
- **黄色**：聚合（处理命令的业务实体）
- **紫色**：策略（事件触发的自动化规则）
- **粉色**：外部系统（第三方依赖）
- **绿色**：读模型（查询视图）
- **红色**：热点（问题和不确定性）

### Q3: 如何通过事件风暴识别限界上下文？

**答**：
1. **语言边界**：同一术语在不同区域有不同含义
2. **聚合聚集**：相关聚合自然分组
3. **团队边界**：不同团队负责的区域
4. **数据一致性**：强一致性 vs 最终一致性
5. **变更频率**：高频变更 vs 稳定区域

### Q4: 事件风暴和传统需求分析有什么区别？

**答**：

| 方面 | 传统需求分析 | 事件风暴 |
|-----|-------------|---------|
| 参与者 | 产品经理主导 | 跨职能协作 |
| 产出 | 文档 | 可视化模型 |
| 视角 | 功能清单 | 业务流程 |
| 节奏 | 渐进式 | 快速迭代 |
| 知识流向 | 单向传递 | 双向探索 |

### Q5: 如何处理事件风暴中的争议和冲突？

**答**：
1. **用红色便签"停车"**：记录问题，不在当场解决
2. **用具体场景验证**：举实例而非空泛讨论
3. **承认复杂性**：有些问题本身就存在多种情况
4. **安排后续讨论**：专门会议深入探讨
5. **投票决策**：民主方式快速推进

---

## 延伸阅读

### 经典资源

1. **《Introducing Event Storming》** - Alberto Brandolini
   - 事件风暴创始人的官方书籍

2. **《Domain-Driven Design Distilled》** - Vaughn Vernon
   - DDD 精简版，包含事件风暴介绍

3. **Alberto Brandolini 的博客**
   - https://blog.avanscoperta.it/
   - 事件风暴的最新实践和思考

### 在线资源

- [Event Storming](https://www.eventstorming.com/) - 官方网站
- [EventStorming Glossary & Cheat Sheet](https://github.com/ddd-crew/eventstorming-glossary-cheat-sheet) - DDD Crew 的速查表
- [Awesome Event Storming](https://github.com/mariuszgil/awesome-eventstorming) - 资源汇总

### 相关方法

- **领域驱动设计 (DDD)**：事件风暴是 DDD 的重要建模工具
- **事件溯源 (Event Sourcing)**：事件风暴的事件可以直接映射到事件溯源
- **CQRS**：事件风暴中的命令和读模型对应 CQRS 模式
- **用户故事映射**：可以与事件风暴结合使用

### 实践建议

- 从小规模开始：先在团队内部尝试
- 找一个熟练的引导者：首次工作坊建议有经验者带领
- 准备充足的便签：比预期多准备 50%
- 拍照记录：结果很容易丢失
- 持续迭代：模型会随着理解深入而演进
