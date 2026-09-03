---
title: Event Storming
description: Learn event storming for domain exploration and modeling
track: architecture
section: ddd
difficulty: intermediate
tags:
  - event storming
  - DDD
  - domain modeling
  - workshop
status: imported
origin: old/src/content/docs/architecture/event-storming.en.md
divergence: 0.176
issues: []
legacy:
  category: Architecture
  subcategory: DDD
  order: 22
  lastUpdated: 2026-01-07
---

## What is Event Storming?

Event Storming is a collaborative workshop technique created by Alberto Brandolini for exploring complex business domains. It brings together domain experts and technical teams in the same room to discover and model business processes through the lens of domain events.

### Core Philosophy

The fundamental premise of Event Storming is that **domain events are the most natural way to understand business processes**. Instead of starting with data models or technical requirements, you begin by asking: "What happens in this business domain?"

### Why Event Storming?

Traditional requirements gathering often fails because:

1. **Domain experts think in processes**: They naturally describe what happens, not what data exists
2. **Technical teams think in structures**: They jump to database schemas and APIs
3. **Documentation gets stale**: Written requirements quickly become outdated
4. **Knowledge silos form**: Critical business knowledge stays locked in individual heads

Event Storming solves these problems by creating a **shared visual model** that evolves in real-time through collaborative discussion.

### Benefits of Event Storming

- **Rapid knowledge transfer**: Hours instead of weeks to understand a domain
- **Identifies gaps early**: Missing requirements surface during the workshop
- **Builds shared understanding**: Everyone sees the same picture
- **Discovers bounded contexts**: Natural boundaries emerge from event clustering
- **Engages domain experts**: Non-technical stakeholders can fully participate
- **Creates living documentation**: The model can be photographed and referenced

---

## Workshop Format

### Preparation

Before running an Event Storming session, ensure you have:

**Physical Materials:**
- Large wall space or multiple whiteboards (at least 6-8 meters of horizontal space)
- Sticky notes in multiple colors:
  - Orange: Domain Events
  - Blue: Commands
  - Yellow: Aggregates
  - Purple/Pink: Policies/Process Managers
  - Red: Hot Spots (problems/questions)
  - Green: External Systems
  - Small yellow: Actors/Users
- Markers (one per participant)
- Painter's tape for timeline

**Participants:**
- Domain experts (essential)
- Developers
- Product owners/managers
- UX designers (optional but valuable)
- Facilitator

**Ideal Group Size:** 6-12 participants

### Room Setup

```
+------------------------------------------------------------------+
|                                                                  |
|  [Timeline Arrow: Past -----> Future]                            |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |                    MODELING SPACE                          |  |
|  |                                                            |  |
|  |   [Sticky]  [Sticky]  [Sticky]  [Sticky]  [Sticky]        |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Participants standing, moving freely                            |
|                                                                  |
+------------------------------------------------------------------+
```

### Session Duration

| Workshop Type | Duration | Purpose |
|--------------|----------|---------|
| Big Picture | 2-4 hours | High-level domain exploration |
| Process Modeling | 4-8 hours | Detailed process understanding |
| Software Design | 1-2 days | Technical implementation design |

---

## The Sticky Notes System

Event Storming uses a color-coded system of sticky notes, each representing a specific concept. Understanding these building blocks is essential for effective workshops.

### Domain Events (Orange)

Domain events are the foundation of Event Storming. They represent **facts that have happened** in the business domain.

**Characteristics:**
- Written in past tense ("Order Placed", "Payment Received")
- Business-meaningful (domain experts recognize them)
- Immutable facts (cannot be undone, only compensated)
- Capture the "what happened", not the "how"

```
+---------------------------+
|                           |
|     Order Placed          |
|                           |
|  (Orange sticky note)     |
+---------------------------+
```

**Good Examples:**
- "Customer Registered"
- "Invoice Sent"
- "Shipment Delivered"
- "Subscription Cancelled"
- "Payment Failed"

**Bad Examples:**
- "Save Order" (command, not event)
- "Order Data" (data, not event)
- "Validating Payment" (ongoing action, not completed event)

### Commands (Blue)

Commands represent **intentions to do something** that trigger domain events. They are requests that may succeed or fail.

**Characteristics:**
- Written in imperative form ("Place Order", "Cancel Subscription")
- Represent user or system intent
- Always trigger at least one event (success or failure)
- May have preconditions

```
+---------------------------+
|                           |
|     Place Order           |
|                           |
|  (Blue sticky note)       |
+---------------------------+
```

**Pattern:**
```
[Actor] -> [Command] -> [Aggregate] -> [Event]

Customer -> Place Order -> Order -> Order Placed
```

### Aggregates (Yellow)

Aggregates are the **domain objects** that receive commands and produce events. They represent consistency boundaries in your domain.

**Characteristics:**
- Named as nouns ("Order", "Customer", "Inventory")
- Own and protect their data
- Enforce business rules
- Produce events when state changes

```
+---------------------------+
|                           |
|        Order              |
|                           |
|  (Yellow sticky note)     |
+---------------------------+
```

**Placement:**
```
                    +--------+
                    | Order  |   <- Aggregate (yellow, placed above)
                    +--------+
                        |
    +-----------+       |       +---------------+
    |Place Order| ----> + ----> |Order Placed   |
    +-----------+               +---------------+
      (command)                    (event)
```

### Actors (Small Yellow)

Actors represent **who or what** initiates commands. They can be users, roles, or external systems.

**Examples:**
- Customer
- Administrator
- Scheduler (time-based trigger)
- External API

```
+--------+     +-----------+
|Customer| --> |Place Order|
+--------+     +-----------+
 (actor)         (command)
```

### Policies (Purple/Pink)

Policies (also called Process Managers or Sagas) represent **automated reactions** to events. They implement business rules that trigger new commands when certain events occur.

**Characteristics:**
- Named with "When... Then..." pattern
- React to events
- Trigger new commands
- Implement cross-aggregate coordination

```
+----------------------------------+
|                                  |
|  When Order Placed,              |
|  Reserve Inventory               |
|                                  |
|  (Purple/Pink sticky note)       |
+----------------------------------+
```

**Pattern:**
```
[Event] -> [Policy] -> [Command]

Order Placed -> "When Order Placed, Reserve Inventory" -> Reserve Items
```

### External Systems (Green)

External systems represent **integrations** with systems outside your domain boundary.

**Examples:**
- Payment Gateway
- Email Service
- Shipping Provider
- Tax Calculator

```
+---------------------------+
|                           |
|    Payment Gateway        |
|                           |
|  (Green sticky note)      |
+---------------------------+
```

### Hot Spots (Red)

Hot spots mark **problems, questions, or areas of uncertainty** that need further discussion or investigation.

**Common Hot Spots:**
- Unclear business rules
- Missing information
- Conflicting requirements
- Technical concerns
- Compliance issues

```
+---------------------------+
|                           |
|  What happens if payment  |
|  times out?               |
|                           |
|  (Red sticky note)        |
+---------------------------+
```

---

## Workshop Phases

### Phase 1: Chaotic Exploration (30-60 minutes)

The first phase is about **getting events on the wall** without worrying about order or completeness.

**Instructions:**
1. Everyone writes domain events on orange sticky notes
2. No discussion during writing - just put notes on the wall
3. Duplicates are fine (they indicate important events)
4. Focus on "what happens", not "what data exists"
5. Include happy paths AND failure scenarios

**Facilitator Tips:**
- Keep energy high: "Write anything that comes to mind"
- Prevent premature debate: "We'll discuss later, just capture now"
- Encourage domain experts: "What happens in your daily work?"
- Prompt for failures: "What can go wrong?"

**Example Events for E-Commerce:**
```
Order Placed          Payment Received       Item Shipped
Order Cancelled       Payment Failed         Delivery Attempted
Cart Created          Refund Issued          Package Returned
Item Added to Cart    Invoice Generated      Customer Complained
Item Removed          Customer Registered    Subscription Started
Checkout Started      Password Reset         Account Deactivated
```

### Phase 2: Timeline Enforcement (30-45 minutes)

Now arrange events in **chronological order** from left to right.

**Instructions:**
1. Move sticky notes to create a timeline
2. Group related events together
3. Identify parallel tracks (events that can happen simultaneously)
4. Mark "pivotal events" that change the flow significantly

**Facilitator Tips:**
- Ask: "What triggers this event? What happens after?"
- Look for branches: "Are there different paths here?"
- Identify loops: "Does this ever repeat?"
- Note temporal patterns: "Does this happen immediately or later?"

**Example Timeline:**
```
Customer        Cart          Checkout        Order         Fulfillment
Journey         Phase         Phase           Phase         Phase
   |              |              |               |              |
   v              v              v               v              v

Customer  ->  Cart     ->  Checkout  ->  Order    ->  Items    ->  Order
Registered    Created      Started      Placed       Reserved      Shipped
                 |            |            |            |            |
              Item     ->  Payment  ->  Payment  ->  Items    ->  Order
              Added        Initiated    Received     Picked       Delivered
```

### Phase 3: Add Commands and Actors (30-45 minutes)

Now identify **what triggers** each event and **who triggers it**.

**Instructions:**
1. Place blue command sticky notes to the left of events they trigger
2. Add small yellow actor notes to show who issues commands
3. Consider both user-initiated and system-initiated commands
4. Identify commands that can trigger multiple events (success/failure)

**Pattern Recognition:**
```
[Actor] -> [Command] -> [Event]

+----------+     +--------------+     +------------------+
| Customer | --> | Place Order  | --> | Order Placed     |
+----------+     +--------------+     +------------------+
                                  |
                                  +--> | Order Rejected   |
                                       +------------------+
```

### Phase 4: Identify Aggregates (30-45 minutes)

Group commands and events around the **aggregates** that own them.

**Instructions:**
1. Place yellow aggregate sticky notes above command/event pairs
2. Look for natural groupings of related events
3. Ask: "What entity owns this data? What enforces these rules?"
4. An aggregate should have a clear identity and lifecycle

**Identification Questions:**
- "What noun does this event describe?"
- "What entity would be responsible for this rule?"
- "If we change this, what else must change together?"

**Example Aggregate Grouping:**
```
              +--------+
              | Order  |
              +--------+
                  |
    +-------------+-------------+
    |             |             |
+-----------+ +----------+ +------------+
|Place Order| |Ship Order| |Cancel Order|
+-----------+ +----------+ +------------+
    |             |             |
    v             v             v
+------------+ +-----------+ +--------------+
|Order Placed| |Order      | |Order         |
+------------+ |Shipped    | |Cancelled     |
               +-----------+ +--------------+
```

### Phase 5: Discover Policies (20-30 minutes)

Identify **automated reactions** that create chains of events.

**Instructions:**
1. Look for events that automatically trigger new commands
2. Express as "When [Event], then [Command]"
3. These often represent business rules or workflow automation
4. Policies can span multiple aggregates

**Example Policies:**
```
When Order Placed, then Reserve Inventory
When Payment Received, then Confirm Order
When Inventory Low, then Notify Purchasing
When Order Shipped, then Send Tracking Email
When Delivery Failed, then Schedule Retry
```

**Visual Representation:**
```
+-------------+     +------------------+     +---------------+
|Order Placed | --> |When Order Placed,| --> |Reserve Items  |
+-------------+     |Reserve Inventory |     +---------------+
                    +------------------+            |
                         (policy)                   v
                                            +---------------+
                                            |Items Reserved |
                                            +---------------+
```

### Phase 6: Mark Hot Spots (Ongoing)

Throughout all phases, capture **problems and questions** with red sticky notes.

**Common Hot Spot Categories:**

1. **Business Rule Uncertainty**
   - "What's the return policy after 30 days?"
   - "Who can approve refunds over $500?"

2. **Technical Concerns**
   - "How do we handle payment gateway timeouts?"
   - "What's the SLA for inventory updates?"

3. **Missing Information**
   - "We need to check with legal about this"
   - "Waiting for pricing team input"

4. **Conflicting Requirements**
   - "Sales wants X but Operations says Y"
   - "This contradicts the current process"

---

## Identifying Bounded Contexts

One of the most valuable outcomes of Event Storming is the **discovery of bounded contexts** - natural boundaries in your domain where different models apply.

### Signs of Context Boundaries

Look for these indicators during the workshop:

1. **Language Changes**: Same word means different things
   - "Customer" in Sales vs. Support
   - "Product" in Catalog vs. Warehouse

2. **Ownership Shifts**: Different teams own different parts
   - Order processing owned by Operations
   - Customer data owned by Marketing

3. **Temporal Boundaries**: Clear lifecycle phases
   - Pre-purchase, Purchase, Post-purchase
   - Onboarding, Active, Churned

4. **Swimlane Emergence**: Parallel tracks that rarely interact

### Drawing Context Boundaries

After Phase 5, step back and look for natural groupings:

```
+---------------------------+  +---------------------------+
|   ORDERING CONTEXT        |  |   FULFILLMENT CONTEXT     |
|                           |  |                           |
| Order                     |  | Shipment                  |
| - Order Placed            |  | - Shipment Created        |
| - Order Confirmed         |  | - Items Picked            |
| - Order Cancelled         |  | - Shipment Dispatched     |
|                           |  | - Shipment Delivered      |
| Payment                   |  |                           |
| - Payment Initiated       |  | Inventory                 |
| - Payment Received        |  | - Items Reserved          |
| - Payment Failed          |  | - Items Released          |
|                           |  | - Stock Replenished       |
+---------------------------+  +---------------------------+
            |                              |
            +----------- Policy -----------+
            | When Order Confirmed,        |
            | Create Shipment              |
            +------------------------------+
```

### Context Mapping

Once boundaries are identified, map the relationships:

```
+-------------------+         +-------------------+
|  ORDER CONTEXT    |         | PAYMENT CONTEXT   |
|                   |         |                   |
| Order aggregate   |<------->| Payment aggregate |
|                   | Customer| (External System) |
|                   | Supplier|                   |
+-------------------+         +-------------------+
         |
         | Published
         | Language
         v
+-------------------+
| FULFILLMENT       |
| CONTEXT           |
|                   |
| Subscribes to     |
| Order events      |
+-------------------+
```

---

## Facilitation Tips

### Before the Workshop

1. **Set Clear Goals**
   - What questions do we want to answer?
   - What's the scope (one process or entire domain)?
   - What decisions will this inform?

2. **Invite the Right People**
   - Include people who do the actual work
   - Ensure domain experts outnumber developers
   - Limit observers (they can watch, not write)

3. **Prepare the Space**
   - Test that sticky notes actually stick to the wall
   - Have extra supplies ready
   - Ensure everyone can reach the modeling surface

### During the Workshop

1. **Manage Energy**
   - Start with high energy: "Everyone stand up!"
   - Take breaks every 60-90 minutes
   - Keep snacks and drinks available

2. **Handle Conflicts**
   - Capture disagreements as hot spots
   - "Both views are valuable - let's capture both"
   - Table deep debates for later

3. **Keep Everyone Engaged**
   - Rotate who explains each section
   - Ask quiet participants direct questions
   - Prevent individuals from dominating

4. **Stay Visual**
   - Everything goes on the wall
   - If people are talking, they should be writing
   - Point to sticky notes, not at each other

5. **Embrace Chaos**
   - Initial messiness is expected
   - Order emerges through iteration
   - Don't over-organize too early

### Common Facilitator Phrases

**To Start:**
- "What happens in this business?"
- "Write any event that comes to mind"
- "Don't worry about order yet"

**To Explore:**
- "What happens before this?"
- "What could go wrong here?"
- "Is this always true?"

**To Clarify:**
- "Can you give me an example?"
- "What does [term] mean to you?"
- "Who decides this?"

**To Progress:**
- "Let's move to the next phase"
- "We'll capture that as a hot spot"
- "Good enough for now, we can refine later"

**To Close:**
- "What surprised you today?"
- "What do we still need to figure out?"
- "What's the most important insight?"

---

## From Event Storm to Implementation

### Translating to Code

The Event Storming model maps directly to DDD tactical patterns:

| Event Storm Element | DDD Concept |
|---------------------|-------------|
| Orange (Event) | Domain Event class |
| Blue (Command) | Command class / method |
| Yellow (Aggregate) | Aggregate root entity |
| Purple (Policy) | Event handler / Saga |
| Green (External) | Anti-corruption layer |

### Example Translation

**Event Storm Model:**
```
[Customer] -> [Place Order] -> (Order) -> [Order Placed]
                                             |
                               [When Order Placed, Reserve Inventory]
                                             |
                                    [Reserve Items] -> (Inventory) -> [Items Reserved]
```

**Code Implementation:**

```typescript
// Command
class PlaceOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItemDto[],
    public readonly shippingAddress: AddressDto
  ) {}
}

// Aggregate
class Order {
  private status: OrderStatus;
  private events: DomainEvent[] = [];

  static create(command: PlaceOrderCommand): Order {
    const order = new Order();
    order.status = OrderStatus.Placed;
    order.events.push(new OrderPlacedEvent({
      orderId: order.id,
      customerId: command.customerId,
      items: command.items,
      occurredAt: new Date()
    }));
    return order;
  }
}

// Domain Event
class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItemSnapshot[],
    public readonly occurredAt: Date
  ) {
    super();
  }
}

// Policy (Event Handler)
class ReserveInventoryOnOrderPlaced {
  constructor(private inventoryService: InventoryService) {}

  @EventHandler(OrderPlacedEvent)
  async handle(event: OrderPlacedEvent): Promise<void> {
    for (const item of event.items) {
      await this.inventoryService.reserve(
        item.productId,
        item.quantity,
        event.orderId
      );
    }
  }
}
```

### Creating Event Catalogs

Document discovered events for team reference:

```typescript
/**
 * Event Catalog: Order Context
 *
 * OrderPlaced
 * - Triggered when: Customer completes checkout
 * - Contains: orderId, customerId, items[], totalAmount, shippingAddress
 * - Subscribers: Inventory (reserve), Notification (confirmation email)
 *
 * OrderConfirmed
 * - Triggered when: Payment received and inventory confirmed
 * - Contains: orderId, confirmedAt
 * - Subscribers: Fulfillment (create shipment)
 *
 * OrderCancelled
 * - Triggered when: Customer cancels or payment fails
 * - Contains: orderId, reason, cancelledAt
 * - Subscribers: Inventory (release), Payment (refund if needed)
 */
```

---

## Advanced Techniques

### Big Picture Event Storming

For exploring an entire organization or large domain:

1. **Start with a "30,000 foot view"**
   - Focus on major business events only
   - One sticky note per major milestone

2. **Identify value streams**
   - What flows through the organization?
   - Where does value get created?

3. **Mark pain points**
   - Where do delays occur?
   - What causes friction?

4. **Spot opportunities**
   - Where can automation help?
   - What processes are redundant?

### Process Modeling Event Storming

For detailed analysis of a specific process:

1. **Narrow the scope**
   - One process or user journey
   - Clear start and end points

2. **Add UI/UX elements**
   - Sketch screens alongside events
   - Note required user interactions

3. **Include read models**
   - What information does each step need?
   - Where does that data come from?

4. **Model error handling**
   - Every command can fail
   - What happens then?

### Software Design Event Storming

For technical implementation planning:

1. **Define API boundaries**
   - Which commands become endpoints?
   - What data formats are needed?

2. **Plan event schemas**
   - What fields does each event contain?
   - How will schemas evolve?

3. **Design read models**
   - What queries will the UI need?
   - How will read models be updated?

4. **Identify technical constraints**
   - Performance requirements
   - Consistency requirements
   - Integration patterns

---

## Common Pitfalls and Solutions

### Pitfall 1: Too Many Events

**Problem:** Hundreds of events make the model unmanageable.

**Solution:**
- Focus on business-significant events
- Merge technical events into business events
- Use hierarchical modeling (zoom in/out)

### Pitfall 2: Premature Structure

**Problem:** Jumping to aggregates before understanding events.

**Solution:**
- Spend more time in chaotic exploration
- Resist the urge to organize too early
- Let patterns emerge naturally

### Pitfall 3: Missing Domain Experts

**Problem:** Only developers in the room.

**Solution:**
- Never run Event Storming without domain experts
- Reschedule if key experts cannot attend
- Their knowledge is the primary input

### Pitfall 4: Analysis Paralysis

**Problem:** Endless debates on every detail.

**Solution:**
- Use hot spots liberally
- "Good enough for now" mindset
- Time-box discussions

### Pitfall 5: Lost Momentum

**Problem:** Energy drops, people disengage.

**Solution:**
- Take regular breaks
- Vary activities (writing, discussing, walking)
- Celebrate discoveries

### Pitfall 6: No Follow-Through

**Problem:** Great workshop, then nothing happens.

**Solution:**
- Photograph everything
- Create action items immediately
- Schedule follow-up sessions
- Connect to actual development work

---

## Interview Key Points

### Q1: What is Event Storming and when would you use it?

**Answer:** Event Storming is a collaborative workshop technique for exploring complex business domains by focusing on domain events. Use it when:
- Starting a new project to understand the domain
- Discovering bounded contexts in a microservices migration
- Aligning business and technical teams on requirements
- Identifying automation opportunities in existing processes

### Q2: What are the key elements in an Event Storm?

**Answer:** The main elements are:
- **Domain Events** (orange): Facts that happened, written in past tense
- **Commands** (blue): Intentions that trigger events
- **Aggregates** (yellow): Domain objects that receive commands and emit events
- **Policies** (purple): Automated reactions that create event chains
- **Hot Spots** (red): Problems or questions needing resolution
- **External Systems** (green): Integrations outside your domain
- **Actors** (small yellow): Users or systems that initiate commands

### Q3: How does Event Storming help identify Bounded Contexts?

**Answer:** Context boundaries emerge naturally during Event Storming through:
- Language changes (same term, different meanings)
- Aggregate clustering (related events group together)
- Ownership patterns (different teams own different areas)
- Temporal phases (clear lifecycle boundaries)
- Swimlanes (parallel tracks that rarely interact)

### Q4: What is the relationship between events, commands, and aggregates?

**Answer:**
- **Actors** issue **commands** (intentions to do something)
- **Commands** are handled by **aggregates** (domain objects)
- **Aggregates** produce **events** (facts about what happened)
- **Policies** react to **events** and may issue new **commands**

Pattern: Actor -> Command -> Aggregate -> Event -> Policy -> Command -> ...

### Q5: How would you facilitate an Event Storming session for a team new to the technique?

**Answer:**
1. **Prepare**: Gather materials, invite domain experts, set clear goals
2. **Explain**: Brief introduction to sticky note colors and their meanings
3. **Chaotic Exploration**: Everyone writes events silently (15-20 min)
4. **Organize**: Arrange events on timeline together
5. **Enrich**: Add commands, actors, and aggregates
6. **Discover**: Identify policies and bounded contexts
7. **Capture**: Mark hot spots, photograph results, create action items

Key facilitation techniques: Keep energy high, embrace initial chaos, use hot spots for parking debates, ensure domain experts are actively participating.

---

## Summary

Event Storming is a powerful technique for domain exploration that creates shared understanding between business and technical teams. Its key strengths are:

1. **Accessibility**: Non-technical stakeholders can fully participate
2. **Speed**: Rapidly discover domain knowledge in hours, not weeks
3. **Visual**: Creates a tangible, shareable model
4. **Collaborative**: Breaks down silos between teams
5. **Actionable**: Maps directly to DDD implementation patterns

To get started with Event Storming:

1. Find a complex domain problem to explore
2. Gather domain experts and developers
3. Get sticky notes and a big wall
4. Start with events and let the model evolve
5. Use hot spots to capture uncertainty
6. Look for bounded context boundaries
7. Translate discoveries into code

Remember: Event Storming is a tool for learning and communication. The conversations that happen during the workshop are as valuable as the model itself. Focus on understanding the domain, and the technical implementation will follow naturally.

---

## Further Reading

### Books

1. **"Introducing EventStorming"** - Alberto Brandolini
   - The definitive guide from the creator of Event Storming

2. **"Domain-Driven Design Distilled"** - Vaughn Vernon
   - Includes practical Event Storming guidance

3. **"Learning Domain-Driven Design"** - Vlad Khononov
   - Modern take on DDD with Event Storming coverage

### Online Resources

- [EventStorming.com](https://www.eventstorming.com/) - Official website
- [Virtual Event Storming Guide](https://www.eventstorming.com/resources/) - Remote workshop techniques
- [Awesome EventStorming](https://github.com/mariuszgil/awesome-eventstorming) - Curated resource list
- [DDD Crew Starter Modelling Process](https://github.com/ddd-crew/ddd-starter-modelling-process) - Process guide including Event Storming

### Tools

- **Miro** - Popular for remote Event Storming
- **MURAL** - Collaborative whiteboarding
- **EventStorming.tools** - Purpose-built digital tool
- **Physical sticky notes** - Still the gold standard for in-person sessions

### Related Topics

- **Domain-Driven Design**: The methodology Event Storming supports
- **CQRS/Event Sourcing**: Architecture patterns aligned with Event Storming
- **Bounded Contexts**: Key discovery output from Event Storming
- **Context Mapping**: Documenting relationships between contexts
