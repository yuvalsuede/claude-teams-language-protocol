# Team Patterns

Proven patterns for structuring Claude Code agent teams.

## Team Compositions

### The Sprint Team (4 agents)

Best for: Feature implementation, bug fixes, refactoring

```
Lead     — Coordinates, routes messages, manages task list
Coder    — Implements features, writes new code
QA       — Audits code, finds bugs (READ-ONLY, no edits)
Bugfix   — Fixes bugs found by QA and from the backlog
```

**Why it works**: Clear separation. QA finds problems, bugfix solves them, coder builds new things. No file conflicts.

### The Sprint Team + Specialist (5 agents)

Add a domain expert when the task demands it:

```
Lead     — Coordinates
Coder    — Core implementation
QA       — Audit and testing
Bugfix   — Fix issues
UI Expert / Security Expert / Perf Expert — Domain specialist
```

### The Research Team (3 agents)

Best for: Investigation, analysis, competing hypotheses

```
Lead        — Synthesizes findings
Researcher1 — Investigates hypothesis A
Researcher2 — Investigates hypothesis B
```

**Why it works**: Parallel exploration, then convergence. Agents can challenge each other.

### The Review Team (3 agents)

Best for: Code review, PR review, audit

```
Lead     — Summarizes findings
Security — Reviews for vulnerabilities
Quality  — Reviews for correctness, tests, patterns
```

## File Ownership Rules

**The #1 rule**: Two agents must NEVER edit the same file simultaneously.

### Assign Ownership at Spawn

```
Coder owns:     VideoFeed.tsx, VideoSlide.tsx, globals.css (scroll logic)
Bugfix owns:    Backend files, api-client.ts, api-types.ts
UI Expert owns: globals.css (visual only), VideoSlide.tsx (styling only)
QA owns:        Nothing (read-only)
```

### Handle Overlaps

When two agents need the same file (e.g., `globals.css`):

1. **Split by concern**: Coder owns scroll-snap CSS, UI expert owns visual CSS
2. **Sequential**: One finishes first, then the other starts
3. **Coordinate via messages**: Agent A tells Agent B what they changed

### Verify After Parallel Work

Always run `tsc --noEmit` after all agents finish to catch conflicts.

## Role Definitions

### Lead (You)

- Create tasks, assign to agents
- Route QA findings to the right agent
- Verify work (run compiler, check browser)
- Shut down agents when done
- **DO NOT** implement unless using delegate mode

### Coder

- Implements features, refactors code
- Owns the most complex/risky files
- Communicates structural changes to other agents

### QA (Read-Only)

- Reads all files, edits none
- Produces prioritized bug reports
- Sends findings to bugfix and relevant agents
- Shuts down after report is delivered

### Bugfix

- Fixes bugs from QA report and known issues
- Owns backend and cross-cutting concerns
- Waits for QA findings before tackling lower priorities

### Specialist (UI Expert, Security, etc.)

- Focused domain expertise
- Coordinates with coder on shared files
- Makes targeted changes within their domain

## Communication Patterns

### Hub-and-Spoke (Default)

All messages go through the lead. Lead routes to the right agent.

```
QA -> Lead -> Bugfix
QA -> Lead -> Coder
```

**Pros**: Lead has full visibility, no duplicate work
**Cons**: Lead is a bottleneck

### Direct Messaging (Advanced)

Agents message each other directly for coordination.

```
UI Expert -> Coder: "need scroll-snap container class name"
Coder -> UI Expert: "feed-container, using scroll-snap-type: y mandatory"
```

**Pros**: Faster, less lead overhead
**Cons**: Lead loses visibility, risk of conflicting instructions

### Broadcast (Use Sparingly)

Send to all agents simultaneously.

```
Lead -> ALL: "STOP — critical bug in main, don't push"
```

**When to broadcast**: Only for team-wide blockers. Each broadcast costs N messages (one per agent).

## Task Sizing

### Too Small (Don't Create)
- "Remove one console.log" — just do it inline
- "Fix a typo" — not worth coordination overhead

### Right Size
- "Fix all auth bypass vulnerabilities" — clear scope, single owner
- "Rewrite VideoFeed scroll mechanism" — self-contained, clear deliverable
- "Audit all backend routes for security" — bounded, produces a report

### Too Large (Split)
- "Build the entire frontend" — split by feature/page
- "Fix all bugs" — split by severity or module

### Dependencies

Use task blocking when order matters:

```
Task 1: Rewrite VideoFeed (coder)
Task 2: Polish VideoFeed UI (ui-expert) — BLOCKED BY Task 1
Task 3: Fix backend bugs (bugfix) — no dependencies
```

## Shutdown Sequence

1. QA finishes report -> shut down QA
2. Bugfix finishes all fixes -> shut down bugfix
3. Specialist finishes polish -> shut down specialist
4. Coder finishes feature -> shut down coder
5. Lead verifies everything compiles -> clean up team
