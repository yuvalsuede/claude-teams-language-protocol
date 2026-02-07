# Task Decomposition for Agent Teams

How to break work into tasks that agents can execute in parallel without stepping on each other. Integrates with Claude Code's native [shared task list](https://code.claude.com/docs/en/agent-teams) and AgentSpeak v2 dependency notation.

## Core Principle: Independence

Every task assigned to an agent should be completable without waiting for another agent. If Task B requires Task A's output, either:
1. Make them sequential (same agent), or
2. Use task dependencies: `TaskCreate T2: ... <<T1`

## Decomposition Strategies

### By Layer

Split work across the stack:

```
TaskCreate T1: Fix auth routes, update schemas, fix services (assigned: bugfix)
  +lockCR,ER,CF,AC,AT
TaskCreate T2: Rewrite components, update API client, fix CSS (assigned: coder)
  +lockVF,VS,GC
TaskCreate T3: Update config, fix env vars (assigned: infra)
  +lockEN,DEP
```

**When to use**: Full-stack changes where layers are loosely coupled.

### By Concern

Split by what the code does:

```
TaskCreate T1: Fix auth bypasses, add ownership checks (assigned: bugfix)
  +lockCR,ER,MD
TaskCreate T2: Fix N+1 queries, add caching (assigned: perf-expert)
  +lockSV,feed.mon
TaskCreate T3: Fix scroll behavior, polish animations (assigned: coder)
  +lockVF,VS,GC
```

**When to use**: Cross-cutting improvements across the codebase.

### By Module

Split by code module/directory:

```
TaskCreate T1: Refactor backend/src/modules/content/ (assigned: agent1)
  +lockCR,content.svc
TaskCreate T2: Refactor backend/src/modules/feed/ (assigned: agent2)
  +lockfeed.svc,feed.mon
TaskCreate T3: Refactor backend/src/modules/admin/ (assigned: agent3)
  +lockadmin.svc,admin.routes
```

**When to use**: Module-scoped refactoring or feature work.

### By Phase

Split by workflow stage with explicit dependencies:

```
TaskCreate T1: Full codebase audit, produce epsilonBATCH (assigned: qa) READ-ONLY
TaskCreate T2: Fix critical+high bugs from QA report (assigned: bugfix) <<T1
TaskCreate T3: Build new feature (assigned: coder) — no dependencies
```

**When to use**: When you need quality assurance before fixes. T2 is blocked by T1, but T3 runs in parallel.

## File Ownership Matrix

Before spawning agents, map out who owns what using `+lock`:

```
| File                    | Coder   | Bugfix  | UI Expert | QA   |
|-------------------------|---------|---------|-----------|------|
| VideoFeed.tsx           | +lockVF | --      | --        | READ |
| VideoSlide.tsx          | +lockVS | --      | +lock*    | READ |
| globals.css             | +lockGC | --      | +lock*    | READ |
| api-client.ts           | --      | +lockAC | --        | READ |
| content.routes.ts       | --      | +lockCR | --        | READ |
| config/index.ts         | --      | +lockCF | --        | READ |

* = styling only, coordinate with coder. Sequential: claim after coder -lock.
```

### Dynamic Lock Transfers

When tasks have dependencies, locks transfer between agents:

```
# Phase 1: Coder owns VF for rewrite
coder:     +lockVF (T1 in progress)
ui-expert: gammaT4 <<T1 (waiting)

# Phase 2: Coder completes, releases lock, UI expert claims
coder -> lead:     deltaT1 VF >>T4 -lockVF tsc clean.
ui-expert -> lead: alphaT4 +lockVF starting UI polish
```

## Conflict Prevention

### Same-File Conflicts

When two agents must touch the same file:

1. **Define boundaries**: "Coder +lockGC (scroll CSS), UI expert +lockGC (visual CSS)"
2. **Sequence with dependencies**: `TaskCreate T4: UI polish <<T1` — UI expert's task blocked until coder's done
3. **Communicate locks**: Agent signals `-lockGC` so the other can `+lockGC`

### State Conflicts

When two agents modify shared state (database, config, env vars):

1. **One owner per resource**: Only bugfix `+lockEN`
2. **Additive only**: Agents can add new env vars but can't modify existing ones
3. **Verify after merge**: Run the full test suite after all agents finish

### Logical Conflicts

When two agents make changes that are individually correct but break together:

```
Agent A: Renames a type from FeedVideo to VideoItem
Agent B: Adds a new function that uses FeedVideo

Result: Type error — Agent B's code references the old name
```

**Prevention**: Put type changes and their consumers in the same task, owned by one agent with `+lock` on all affected files.

## Task Templates

### Feature Implementation

```
TaskCreate T1: [Coder] Implement [feature] +lock[files]
TaskCreate T2: [Bugfix] Update types and API client +lock[files]
TaskCreate T3: [QA] Verify [feature] end-to-end (READ-ONLY) <<T1,T2
```

### Bug Fix Sprint

```
TaskCreate T1: [QA] Full codebase audit, epsilonBATCH report (READ-ONLY)
TaskCreate T2: [Bugfix] Fix P0+P1 bugs from QA +lock[backend files] <<T1
TaskCreate T3: [Coder] Fix P1+P2 frontend bugs +lock[frontend files] <<T1
```

### Refactoring

```
TaskCreate T1: [Coder] Refactor [module A] +lock[files]
TaskCreate T2: [Bugfix] Refactor [module B] +lock[files]
TaskCreate T3: [QA] Verify no regressions (READ-ONLY) <<T1,T2
```

### Dependency Flow Visualization

```
T1 (coder: VF rewrite) ──>> T4 (ui-expert: VF polish)
                                    │
T2 (qa: audit) ──>> T3 (bugfix: fix P0+P1)
                                    │
                              T5 (qa: verify all) <<T3,T4
```

## Anti-Patterns

### The Shared File Nightmare

```
# BAD: Both agents editing the same component with no locks
TaskCreate T1: "Rewrite VideoFeed scroll logic" (coder)
TaskCreate T2: "Add like animation to VideoFeed" (ui-expert)
Result: One agent's changes overwrite the other's

# GOOD: Sequential with dependency and lock transfer
TaskCreate T1: "Rewrite VideoFeed scroll logic" (coder) +lockVF
TaskCreate T2: "Add like animation to VideoFeed" (ui-expert) <<T1
```

### The Dependency Chain

```
# BAD: Sequential tasks assigned to parallel agents
TaskCreate T1: "Build the API endpoint" (agent1)
TaskCreate T2: "Build the frontend that calls the API" (agent2) <<T1
TaskCreate T3: "Write tests for the frontend" (agent3) <<T2
Result: Agents 2 and 3 sit idle waiting

# GOOD: Maximize parallel work
TaskCreate T1: "Build the API endpoint" (agent1) +lockRT,SV
TaskCreate T2: "Build the frontend with mock API" (agent2) +lockVF,VS
TaskCreate T3: "Write test framework and fixtures" (agent3) +lockTST
TaskCreate T4: "Integration tests" (agent3) <<T1,T2
```

### The Overlap

```
# BAD: Both agents doing the same work from different angles
TaskCreate T1: "Fix security issues in routes" (agent1)
TaskCreate T2: "Fix auth middleware issues" (agent2)
Result: Both modify the same auth checking code

# GOOD: Clearly separated with locks
TaskCreate T1: "Fix auth in content.routes" (agent1) +lockCR
TaskCreate T2: "Fix auth in engagement.routes" (agent2) +lockER
```

### The Missing Lock

```
# BAD: Lock not released, blocks dependent task indefinitely
coder -> lead: deltaT1 VF tsc clean.  # forgot -lockVF!
ui-expert -> lead: gammaT4 <<T1 but VF still locked?

# GOOD: Always release locks on completion
coder -> lead: deltaT1 VF -lockVF >>T4 tsc clean.
```
