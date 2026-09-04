---
title: Architecture Decision Records (ADR)
description: Learn to document architecture decisions with ADR
track: architecture
section: principles
difficulty: beginner
tags:
  - ADR
  - architecture decisions
  - documentation
  - decision records
status: imported
origin: old/src/content/docs/architecture/adr.en.md
divergence: 0.203
issues: []
legacy:
  category: Architecture
  subcategory: Documentation
  order: 23
  lastUpdated: 2026-01-07
---

## What is an ADR?

An **Architecture Decision Record (ADR)** is a document that captures an important architectural decision made along with its context and consequences. ADRs are a lightweight yet powerful way to document the "why" behind architectural choices in software projects.

### Why Do We Need ADRs?

In software development, teams frequently face these challenges:

1. **Lost Knowledge**: Key decisions made months ago are forgotten, and the reasoning behind them is lost
2. **Onboarding Difficulties**: New team members struggle to understand why the system is built a certain way
3. **Repeated Debates**: The same architectural discussions happen repeatedly because previous decisions weren't documented
4. **Context Loss**: When original decision-makers leave, critical context disappears with them
5. **Technical Debt Confusion**: Teams don't remember why certain trade-offs were made

ADRs solve these problems by providing:

- **Historical Context**: A record of what was decided and why
- **Institutional Memory**: Knowledge persists beyond individual team members
- **Decision Transparency**: Everyone can understand the reasoning behind choices
- **Change Tracking**: Evolution of architectural thinking over time
- **Accountability**: Clear ownership of decisions

### The Origin of ADRs

The concept of ADRs was popularized by Michael Nygard in his blog post "Documenting Architecture Decisions" (2011). Since then, ADRs have become a widely adopted practice in software engineering, especially in agile and DevOps environments.

---

## ADR Structure

A well-structured ADR contains several key sections. Let's examine each component in detail.

### Basic ADR Template

```markdown
# ADR-{number}: {Title}

## Status

{Proposed | Accepted | Deprecated | Superseded by ADR-XXX}

## Context

{Describe the situation and the problem that needs to be addressed}

## Decision

{State the decision that was made}

## Consequences

{Describe the resulting context after applying the decision}
```

### Title

The title should be short, descriptive, and action-oriented. It should clearly indicate what decision is being made.

**Good titles:**
- "Use PostgreSQL as Primary Database"
- "Adopt Microservices Architecture"
- "Implement JWT for Authentication"
- "Choose React for Frontend Framework"

**Poor titles:**
- "Database Decision"
- "Architecture Stuff"
- "Frontend"

### Status

The status field tracks the lifecycle of the decision:

| Status | Description |
|--------|-------------|
| **Proposed** | The decision is under discussion and not yet finalized |
| **Accepted** | The decision has been agreed upon and is in effect |
| **Deprecated** | The decision is no longer relevant but kept for historical reference |
| **Superseded** | The decision has been replaced by a newer ADR |

```markdown
## Status

Accepted

Superseded by [ADR-0015](./adr-0015-migrate-to-mongodb.zh.md)
```

### Context

The context section describes the forces at play, including technological, political, social, and project-specific constraints. This is arguably the most important section because it captures the "why" behind the decision.

**What to include:**
- Current situation and pain points
- Business requirements driving the decision
- Technical constraints and limitations
- Team skills and experience
- Time and budget constraints
- Stakeholder concerns

```markdown
## Context

Our e-commerce platform is experiencing significant growth, with traffic
increasing 300% over the past year. Our current monolithic architecture
is showing strain:

- Deployment takes 45 minutes and requires full application restart
- A bug in the payment module recently brought down the entire system
- The development team has grown to 15 engineers, causing frequent
  merge conflicts
- Different parts of the system have vastly different scaling needs
  (product catalog vs. checkout)

We need to decide on an architectural approach that supports:
- Independent deployment of system components
- Fault isolation between critical services
- Team autonomy and parallel development
- Cost-effective scaling of individual components
```

### Decision

The decision section states clearly what has been decided. It should be direct and unambiguous. Include the chosen option and briefly explain why it was selected over alternatives.

```markdown
## Decision

We will adopt a microservices architecture for our e-commerce platform,
starting with extracting the following bounded contexts as independent
services:

1. **Product Catalog Service**: Handles product information, categories,
   and search
2. **Order Service**: Manages order lifecycle and fulfillment
3. **Payment Service**: Processes payments and handles refunds
4. **User Service**: Manages user accounts and authentication

We chose microservices over continuing with the monolith because:
- It allows independent scaling of high-traffic services (catalog)
- Teams can deploy their services independently
- Failure in one service won't bring down the entire platform
- Different services can use appropriate technology stacks

We considered but rejected:
- **Modular monolith**: While simpler, it doesn't address our scaling
  and fault isolation needs
- **Serverless**: Our long-running payment processes don't fit the
  serverless model well
```

### Consequences

The consequences section describes the resulting context after applying the decision. Be honest about both positive and negative outcomes.

```markdown
## Consequences

### Positive

- **Independent Deployability**: Teams can deploy their services without
  coordinating with others
- **Technology Flexibility**: Services can use the most appropriate
  technology stack
- **Fault Isolation**: Failures are contained within service boundaries
- **Scalability**: Individual services can be scaled based on demand
- **Team Autonomy**: Clear ownership boundaries reduce conflicts

### Negative

- **Increased Complexity**: Distributed systems are inherently more
  complex to build and operate
- **Network Latency**: Service-to-service communication adds latency
- **Data Consistency**: Maintaining consistency across services requires
  careful design
- **Operational Overhead**: More services mean more deployments,
  monitoring, and infrastructure to manage
- **Testing Complexity**: Integration testing across services is more
  challenging

### Neutral

- We will need to invest in service mesh technology (Istio or Linkerd)
- Team structure will need to align with service boundaries
- We need to establish API versioning and deprecation policies
```

---

## Extended ADR Sections

Many teams extend the basic ADR template with additional sections to capture more context.

### Options Considered

Document the alternatives that were evaluated:

```markdown
## Options Considered

### Option 1: Continue with Monolith (Status Quo)
- **Pros**: No migration effort, team is familiar with codebase
- **Cons**: Doesn't address scaling or fault isolation issues
- **Estimated Effort**: None

### Option 2: Modular Monolith
- **Pros**: Improves code organization, lower complexity than microservices
- **Cons**: Still requires full deployment, limited fault isolation
- **Estimated Effort**: 3 months

### Option 3: Microservices Architecture (Chosen)
- **Pros**: Independent scaling, fault isolation, team autonomy
- **Cons**: Higher operational complexity, distributed system challenges
- **Estimated Effort**: 6-9 months for initial extraction

### Option 4: Serverless Architecture
- **Pros**: No server management, automatic scaling
- **Cons**: Cold starts, vendor lock-in, poor fit for long-running processes
- **Estimated Effort**: 9-12 months
```

### Participants

Record who was involved in making the decision:

```markdown
## Participants

- **Decision Makers**: Jane Smith (CTO), John Doe (Lead Architect)
- **Consulted**: Backend Team, DevOps Team, Product Management
- **Informed**: All Engineering Teams, Executive Leadership
```

### Related Decisions

Link to related ADRs for context:

```markdown
## Related Decisions

- [ADR-0003: Use Kubernetes for Container Orchestration](./adr-0003.md)
- [ADR-0007: Implement API Gateway Pattern](./adr-0007.md)
- [ADR-0012: Adopt Event-Driven Communication](./adr-0012.md)
```

### Notes and References

Include supporting materials:

```markdown
## Notes

- Proof of concept completed in Q2 2024, demonstrating 40% latency
  improvement for catalog service
- Training plan for distributed systems patterns scheduled for Q3

## References

- [Building Microservices by Sam Newman](https://samnewman.io/books/building_microservices/)
- [Internal Performance Analysis Report (Confluence)](https://wiki.example.com/perf-analysis)
- [AWS Microservices Best Practices](https://aws.amazon.com/microservices/)
```

---

## When to Write an ADR

Not every decision needs an ADR. Here are guidelines for when to create one:

### Write an ADR When

1. **The decision is significant**: It affects the system's overall structure or key quality attributes
2. **The decision is costly to change**: Reversing it would require substantial effort
3. **The decision is controversial**: Multiple valid options exist with trade-offs
4. **The decision affects multiple teams**: Other teams need to understand or follow the decision
5. **The decision involves external dependencies**: Choosing vendors, frameworks, or services
6. **You've debated it before**: If the same discussion keeps coming up, document the decision

### Examples of ADR-Worthy Decisions

```
Architectural Patterns:
- Adopting microservices vs. monolith
- Choosing event-driven vs. request-response communication
- Implementing CQRS or Event Sourcing

Technology Choices:
- Selecting a database (PostgreSQL vs. MongoDB vs. DynamoDB)
- Choosing a frontend framework (React vs. Vue vs. Angular)
- Picking a message broker (Kafka vs. RabbitMQ vs. SQS)

Development Practices:
- API design standards (REST vs. GraphQL vs. gRPC)
- Testing strategy (unit vs. integration vs. contract testing)
- Deployment approach (blue-green vs. canary vs. rolling)

Security Decisions:
- Authentication mechanism (JWT vs. sessions vs. OAuth)
- Data encryption strategy
- Access control model (RBAC vs. ABAC)
```

### Don't Write an ADR When

- The decision is trivial or easily reversible
- It's a team-specific implementation detail
- It's a temporary workaround (use a tech debt ticket instead)
- Standard best practices already apply

---

## ADR Templates

### Minimal Template

For simpler decisions:

```markdown
# ADR-{number}: {Title}

**Date**: {YYYY-MM-DD}
**Status**: {Proposed | Accepted | Deprecated | Superseded}

## Context

{What is the issue that we're seeing that is motivating this decision?}

## Decision

{What is the change that we're proposing and/or doing?}

## Consequences

{What becomes easier or more difficult because of this change?}
```

### Comprehensive Template

For complex decisions requiring more detail:

```markdown
# ADR-{number}: {Title}

**Date**: {YYYY-MM-DD}
**Status**: {Proposed | Accepted | Deprecated | Superseded}
**Deciders**: {List of people involved}
**Technical Story**: {Link to ticket or issue}

## Context and Problem Statement

{Describe the context and problem statement, e.g., in free form using
two to three sentences. You may want to articulate the problem in form
of a question.}

## Decision Drivers

- {driver 1, e.g., a force, facing concern, ...}
- {driver 2, e.g., a force, facing concern, ...}
- ...

## Considered Options

1. {option 1}
2. {option 2}
3. {option 3}
...

## Decision Outcome

**Chosen option**: "{option X}", because {justification}.

### Positive Consequences

- {e.g., improvement of quality attribute satisfaction, follow-up
  decisions required, ...}
- ...

### Negative Consequences

- {e.g., compromising quality attribute, follow-up decisions required,
  ...}
- ...

## Pros and Cons of the Options

### {Option 1}

{example | description | pointer to more information | ...}

- Good, because {argument a}
- Good, because {argument b}
- Bad, because {argument c}
- ...

### {Option 2}

{example | description | pointer to more information | ...}

- Good, because {argument a}
- Good, because {argument b}
- Bad, because {argument c}
- ...

## Links

- {Link type} {Link to ADR}
- ...
```

### Y-Statements Template

A concise format focusing on forces:

```markdown
# ADR-{number}: {Title}

**Date**: {YYYY-MM-DD}

## Decision

In the context of {use case/user story},
facing {concern}
we decided for {option}
and against {other options}
to achieve {quality/goal},
accepting {downside/consequence}.
```

---

## Managing ADRs

### Organizing ADR Files

A common structure for ADR organization:

```
docs/
└── architecture/
    └── decisions/
        ├── README.md           # Index and overview
        ├── adr-0001-record-architecture-decisions.md
        ├── adr-0002-use-postgresql-database.md
        ├── adr-0003-adopt-microservices.md
        ├── adr-0004-implement-event-sourcing.md
        └── templates/
            ├── adr-template-minimal.md
            └── adr-template-comprehensive.md
```

### Numbering Convention

Use sequential numbering with leading zeros:

```
adr-0001-title.md
adr-0002-title.md
...
adr-0042-title.md
```

This ensures proper sorting in file systems and makes it easy to reference specific ADRs.

### Creating an ADR Index

Maintain a README.md as an index:

```markdown
# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the
project.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](./adr-0001-record-architecture-decisions.md) | Record Architecture Decisions | Accepted | 2024-01-01 |
| [0002](./adr-0002-use-postgresql-database.zh.md) | Use PostgreSQL as Primary Database | Accepted | 2024-01-05 |
| [0003](./adr-0003-adopt-microservices.md) | Adopt Microservices Architecture | Accepted | 2024-01-15 |
| [0004](./adr-0004-use-kafka-messaging.md) | Use Kafka for Event Streaming | Proposed | 2024-01-20 |

## Superseded Decisions

| ADR | Title | Superseded By |
|-----|-------|---------------|
| [0002](./adr-0002-use-postgresql-database.zh.md) | Use PostgreSQL | [0015](./adr-0015-migrate-to-mongodb.zh.md) |

## Creating New ADRs

See [TEMPLATE.md](./templates/adr-template.md) for the template.
```

### ADR Lifecycle Management

```
                    ┌─────────────┐
                    │  Proposed   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Accepted │ │ Rejected │ │ Deferred │
        └────┬─────┘ └──────────┘ └──────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌──────────┐    ┌──────────────┐
│Deprecated│    │ Superseded   │
└──────────┘    │ by ADR-XXX   │
                └──────────────┘
```

### Updating ADRs

ADRs should generally be **immutable** once accepted. Instead of modifying accepted ADRs:

1. **For minor clarifications**: Add a "Notes" section with dated amendments
2. **For significant changes**: Create a new ADR that supersedes the old one
3. **Update the status**: Mark the old ADR as "Superseded by ADR-XXX"

```markdown
## Status

Superseded by [ADR-0015: Migrate to MongoDB](./adr-0015-migrate-to-mongodb.zh.md)

## Amendment History

- **2024-03-15**: Clarified that read replicas are acceptable for
  reporting queries
- **2024-06-01**: This ADR has been superseded due to changing
  requirements
```

---

## Tools for ADRs

### Command-Line Tools

**adr-tools** (by Nat Pryce):

```bash
# Install (macOS)
brew install adr-tools

# Initialize ADR directory
adr init docs/architecture/decisions

# Create a new ADR
adr new "Use PostgreSQL as Primary Database"

# List all ADRs
adr list

# Generate table of contents
adr generate toc > docs/architecture/decisions/README.md

# Supersede an existing ADR
adr new -s 2 "Migrate to MongoDB"
```

**Log4brains**:

```bash
# Install
npm install -g log4brains

# Initialize
log4brains init

# Create new ADR
log4brains adr new

# Preview ADRs as a website
log4brains preview
```

### IDE Extensions

- **VS Code**: ADR Tools extension
- **IntelliJ**: Architecture Decision Records plugin

### Documentation Platforms

Many documentation platforms support ADRs:

- **Backstage**: Built-in ADR plugin
- **Confluence**: ADR templates available
- **Notion**: Custom ADR databases
- **GitHub/GitLab**: Wiki or docs folder

---

## Complete ADR Example

Here's a fully worked example:

```markdown
# ADR-0007: Use JWT for API Authentication

**Date**: 2024-01-15
**Status**: Accepted
**Deciders**: Alice Chen (Security Lead), Bob Smith (Backend Lead),
Carol Davis (DevOps Lead)
**Technical Story**: PROJ-1234

## Context and Problem Statement

Our API currently uses session-based authentication with server-side
session storage in Redis. As we scale to multiple regions and adopt a
microservices architecture, we're facing challenges:

1. Session store becomes a single point of failure
2. Cross-service authentication requires session sharing
3. Mobile clients struggle with session cookie management
4. Horizontal scaling requires sticky sessions or shared session store

We need an authentication mechanism that:
- Works across multiple services without shared state
- Scales horizontally without coordination
- Supports both web and mobile clients
- Maintains security best practices

## Decision Drivers

- **Scalability**: Must support 10x traffic growth
- **Microservices Compatibility**: Must work across service boundaries
- **Mobile Support**: Must work well with native mobile apps
- **Security**: Must meet SOC 2 compliance requirements
- **Developer Experience**: Should be easy to implement and debug

## Considered Options

1. **Continue with Sessions + Redis Cluster**
2. **JWT (JSON Web Tokens)**
3. **OAuth 2.0 with Opaque Tokens**
4. **API Keys**

## Decision Outcome

**Chosen option**: "JWT (JSON Web Tokens)", because it provides
stateless authentication that works naturally across microservices
while supporting both web and mobile clients.

### Implementation Details

- Use RS256 (asymmetric) signing for better key management
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days and are stored in database
- Include minimal claims: `sub`, `email`, `roles`, `exp`, `iat`
- Implement token refresh endpoint for seamless renewal

### Positive Consequences

- **Stateless Authentication**: No need for shared session store
- **Service Independence**: Each service can validate tokens independently
- **Horizontal Scaling**: No sticky sessions or shared state required
- **Mobile Friendly**: Works naturally with Authorization header
- **Performance**: No database lookup required for token validation

### Negative Consequences

- **Token Revocation Complexity**: Cannot instantly revoke JWTs
  - Mitigation: Short expiry times + refresh token revocation
- **Token Size**: JWTs are larger than session IDs
  - Mitigation: Keep claims minimal
- **Key Management**: Need secure key rotation process
  - Mitigation: Use AWS KMS for key management

## Pros and Cons of the Options

### Option 1: Sessions + Redis Cluster

- Good, because minimal changes to existing code
- Good, because instant session revocation
- Bad, because Redis becomes critical dependency
- Bad, because complexity in multi-region setup
- Bad, because session sharing across services is complex

### Option 2: JWT (Chosen)

- Good, because stateless and scalable
- Good, because works across services without coordination
- Good, because industry standard with excellent library support
- Bad, because cannot instantly revoke tokens
- Bad, because larger payload size

### Option 3: OAuth 2.0 with Opaque Tokens

- Good, because enterprise-grade security
- Good, because supports token revocation
- Bad, because requires token introspection endpoint
- Bad, because higher complexity
- Bad, because additional latency for validation

### Option 4: API Keys

- Good, because simple to implement
- Bad, because poor fit for user authentication
- Bad, because no expiration without custom logic
- Bad, because no user context in the token

## Links

- [RFC 7519 - JSON Web Tokens](https://tools.ietf.org/html/rfc7519)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [ADR-0003: Adopt Microservices Architecture](./adr-0003.md)
- [PROJ-1234: Implement JWT Authentication](https://jira.example.com/PROJ-1234)
```

---

## Best Practices

### Writing Effective ADRs

1. **Be Concise but Complete**: Include enough context without being verbose
2. **Focus on the "Why"**: The reasoning is more important than the decision itself
3. **Be Honest About Trade-offs**: Document both benefits and drawbacks
4. **Use Plain Language**: Avoid unnecessary jargon
5. **Include Examples**: Code snippets or diagrams help clarify decisions
6. **Link to Evidence**: Reference benchmarks, studies, or prototypes

### Team Adoption Tips

1. **Start Small**: Begin with major decisions, not every choice
2. **Make It Easy**: Use templates and tooling
3. **Review ADRs**: Include ADR review in architecture discussions
4. **Lead by Example**: Senior engineers should write ADRs first
5. **Reference ADRs**: Cite relevant ADRs in code reviews and discussions
6. **Celebrate Good ADRs**: Recognize well-written documentation

### Common Pitfalls to Avoid

| Pitfall | Solution |
|---------|----------|
| Writing ADRs after the fact | Create ADRs as part of the decision process |
| Too much detail | Focus on architectural significance, not implementation |
| Not updating status | Review ADR statuses quarterly |
| ADRs in isolation | Link related ADRs together |
| Ignoring consequences | Be honest about negative outcomes |
| No review process | Include ADR review in architecture governance |

---

## Summary

Architecture Decision Records are a simple yet powerful tool for capturing the reasoning behind significant architectural choices. By documenting decisions with their context and consequences, teams can:

- **Preserve institutional knowledge** beyond individual contributors
- **Accelerate onboarding** for new team members
- **Prevent repeated debates** on settled decisions
- **Track architectural evolution** over time
- **Improve decision quality** through structured thinking

Remember the key principles:

1. Focus on **significant, hard-to-reverse** decisions
2. Document the **context and reasoning**, not just the choice
3. Be **honest about trade-offs** and consequences
4. Keep ADRs **immutable** once accepted
5. Make ADRs **discoverable** and well-organized

ADRs work best when they become a natural part of your team's workflow, not an afterthought. Start with a few important decisions, establish templates and conventions, and gradually build a valuable archive of architectural knowledge.

---

## Further Reading

### Books

- **"Documenting Software Architectures: Views and Beyond"** - Paul Clements et al.
- **"Design It!: From Programmer to Software Architect"** - Michael Keeling
- **"Software Architecture for Developers"** - Simon Brown

### Online Resources

- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's Original Blog Post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [MADR - Markdown ADR Templates](https://adr.github.io/madr/)
- [ADR Tools by Nat Pryce](https://github.com/npryce/adr-tools)

### Related Topics

- Software Architecture Documentation
- Technical Decision Making
- Architecture Governance
- Knowledge Management
- Technical Writing
- C4 Model for Architecture Diagrams
