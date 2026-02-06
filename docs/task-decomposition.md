# Task Decomposition for Agent Teams

How to break work into tasks that agents can execute in parallel without stepping on each other.

## Core Principle: Independence

Every task assigned to an agent should be completable without waiting for another agent. If Task B requires Task A's output, either:
1. Make them sequential (same agent), or
2. Use task dependencies (Task B blocked by Task A)

## Decomposition Strategies

### By Layer

Split work across the stack:

```
Agent 1 (Backend):  Fix auth routes, update schemas, fix services
Agent 2 (Frontend): Rewrite components, update API client, fix CSS
Agent 3 (Infra):    Update config, fix env vars, deployment scripts
```

**When to use**: Full-stack changes where layers are loosely coupled.

### By Concern

Split by what the code does:

```
Agent 1 (Security):    Fix auth bypasses, add ownership checks, rotate secrets
Agent 2 (Performance): Fix N+1 queries, add caching, optimize algorithms
Agent 3 (UX):          Fix scroll behavior, polish animations, fix layout
```

**When to use**: Cross-cutting improvements across the codebase.

### By Module

Split by code module/directory:

```
Agent 1: backend/src/modules/content/
Agent 2: backend/src/modules/feed/
Agent 3: backend/src/modules/admin/
```

**When to use**: Module-scoped refactoring or feature work.

### By Phase

Split by workflow stage:

```
Agent 1 (QA):     Audit everything, produce bug report (read-only)
Agent 2 (Bugfix): Fix bugs from QA report (after QA finishes)
Agent 3 (Coder):  Build new feature (independent of QA/bugfix)
```

**When to use**: When you need quality assurance before fixes.

## File Ownership Matrix

Before spawning agents, map out who owns what:

```
| File                    | Coder | Bugfix | UI Expert | QA   |
|-------------------------|-------|--------|-----------|------|
| VideoFeed.tsx           | WRITE | --     | --        | READ |
| VideoSlide.tsx          | WRITE | --     | WRITE*    | READ |
| globals.css             | WRITE | --     | WRITE*    | READ |
| api-client.ts           | --    | WRITE  | --        | READ |
| content.routes.ts       | --    | WRITE  | --        | READ |
| config/index.ts         | --    | WRITE  | --        | READ |

* = styling only, coordinate with coder
```

## Conflict Prevention

### Same-File Conflicts

When two agents must touch the same file:

1. **Define boundaries**: "Coder owns scroll CSS in globals.css, UI expert owns visual CSS"
2. **Sequence with dependencies**: UI expert's task is blocked by coder's task
3. **Communicate**: Agent messages what they changed so the other can adapt

### State Conflicts

When two agents modify shared state (database, config, env vars):

1. **One owner per resource**: Only bugfix modifies `.env.example`
2. **Additive only**: Agents can add new env vars but can't modify existing ones
3. **Verify after merge**: Run the full test suite after all agents finish

### Logical Conflicts

When two agents make changes that are individually correct but break together:

```
Agent A: Renames a type from FeedVideo to VideoItem
Agent B: Adds a new function that uses FeedVideo

Result: Type error — Agent B's code references the old name
```

**Prevention**: Put type changes and their consumers in the same task, owned by one agent.

## Task Templates

### Feature Implementation

```
Task 1: [Coder] Implement [feature] in [files]
Task 2: [Bugfix] Update types and API client for [feature]
Task 3: [QA] Verify [feature] works end-to-end (read-only)
```

### Bug Fix Sprint

```
Task 1: [QA] Full codebase audit, produce bug report (read-only)
Task 2: [Bugfix] Fix critical + high bugs from QA report
Task 3: [Coder] Fix complex architectural bugs from QA report
```

### Refactoring

```
Task 1: [Coder] Refactor [module A]
Task 2: [Bugfix] Refactor [module B]
Task 3: [QA] Verify no regressions (read-only)
        Depends on: Task 1, Task 2
```

## Anti-Patterns

### The Shared File Nightmare

```
# BAD: Both agents editing the same component
Agent 1: "Rewrite VideoFeed scroll logic"
Agent 2: "Add like animation to VideoFeed"
Result: One agent's changes overwrite the other's
```

### The Dependency Chain

```
# BAD: Sequential tasks assigned to parallel agents
Agent 1: "Build the API endpoint"
Agent 2: "Build the frontend that calls the API" (needs Agent 1's output)
Agent 3: "Write tests for the frontend" (needs Agent 2's output)
Result: Agents 2 and 3 sit idle waiting
```

### The Overlap

```
# BAD: Both agents doing the same work from different angles
Agent 1: "Fix security issues in routes"
Agent 2: "Fix auth middleware issues"
Result: Both modify the same auth checking code
```
