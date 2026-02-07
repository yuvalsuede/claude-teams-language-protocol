# Team Patterns

Proven patterns for structuring Claude Code agent teams. Integrates with Claude Code's native [Agent Teams](https://code.claude.com/docs/en/agent-teams) system.

## Team Compositions

### The Sprint Team (4 agents)

Best for: Feature implementation, bug fixes, refactoring

```
Lead     — Coordinates, routes messages, manages shared task list
Coder    — Implements features, writes new code
QA       — Audits code, finds bugs (READ-ONLY, no edits)
Bugfix   — Fixes bugs found by QA and from the backlog
```

**Why it works**: Clear separation. QA finds problems, bugfix solves them, coder builds new things. No file conflicts.

**AgentSpeak spawn sequence**:
```
alpha PROTO:v2.0 @lead ready
alpha PROTO:v2.0 @coder ready +lockVF,VS,GC
alpha PROTO:v2.0 @qa ready (READ-ONLY)
alpha PROTO:v2.0 @bugfix ready +lockCR,ER,CF,AC
```

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

**Why it works**: Parallel exploration, then convergence. Agents can challenge each other. Claude Code's docs specifically recommend this pattern for debugging with competing hypotheses.

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

Use `+lock` assertions in spawn messages to make ownership explicit:

```
# In spawn prompts:
Coder:     +lockVF,VS,GC (scroll logic)
Bugfix:    +lockCR,ER,AC,AT,CF
UI Expert: +lockGC (visual only), +lockVS (styling only)
QA:        READ-ONLY (no locks needed)
```

### Runtime Lock Protocol

Agents claim and release files dynamically during the session:

```
# Coder finishes VF, UI expert can now polish it
coder -> lead:    deltaT1 VF -lockVF tsc clean.
lead -> ui-expert: T4 unblocked. +lockVF for UI polish.
ui-expert -> lead: alphaT4 +lockVF starting UI polish
```

### Handle Overlaps

When two agents need the same file (e.g., `globals.css`):

1. **Split by concern**: Coder owns scroll-snap CSS, UI expert owns visual CSS
2. **Sequential with locks**: Coder finishes and releases (`-lockGC`), then UI expert claims (`+lockGC`)
3. **Coordinate via messages**: Agent A tells Agent B what they changed

### Verify After Parallel Work

Always run `tsc --noEmit` after all agents finish to catch conflicts.

## Role Definitions

### Lead (You)

- Create tasks in the shared task list, assign to agents
- Route QA findings using `@agent [items]` shorthand
- Verify work (run compiler, check browser)
- Shut down agents when done
- Resolve `!lock` conflicts between agents
- **DO NOT** implement unless using delegate mode

### Coder

- Implements features, refactors code
- Owns the most complex/risky files
- Claims files with `+lock` before editing
- Communicates structural changes to other agents
- Reports progress with `beta%` indicators

### QA (Read-Only)

- Reads all files, edits none (no `+lock` needed)
- Produces prioritized bug reports using `epsilonBATCH` format
- Sends single comprehensive report to lead
- Shuts down after report is delivered (`omega`)

### Bugfix

- Fixes bugs from QA report and known issues
- Owns backend and cross-cutting concerns
- Waits for QA findings before tackling lower priorities
- Reports error recovery with `epsilon!retry` / `epsilon!fail`

### Specialist (UI Expert, Security, etc.)

- Focused domain expertise
- Coordinates with coder on shared files via lock protocol
- Makes targeted changes within their domain
- Uses `<<` to signal when blocked by another agent's work

## Communication Patterns

### Hub-and-Spoke (Default)

All messages go through the lead. Lead routes to the right agent using `@agent` shorthand.

```
qa -> lead:   epsilonBATCH 16items: P0:3 [...] P1:5 [...] P2:7 [...] P3:1 [...]
lead -> bugfix:    @bugfix [P0:CR L140, P0:ER L9, P1:CF L26, P2:AC L85]
lead -> coder:     @coder [P1:VF L584, P2:VF L200, P2:VS L33]
lead -> ui-expert: @ui-expert [P3:GC L677]
```

**Pros**: Lead has full visibility, no duplicate work, compact routing
**Cons**: Lead is a bottleneck

### Direct Messaging (Advanced)

Agents message each other directly for coordination:

```
ui-expert -> coder: ? VF scroll-snap container class name
coder -> ui-expert: feed-container, scroll-snap-type:y mandatory
```

**Pros**: Faster, less lead overhead
**Cons**: Lead loses visibility, risk of conflicting instructions

### Broadcast (Use Sparingly)

Send to all agents simultaneously:

```
!!lead -> ALL: STOP — P0 bug in main, don't push
```

**When to broadcast**: Only for team-wide blockers. Each broadcast costs N messages (one per agent). Use `!!` priority prefix for urgent broadcasts.

## Task Sizing

### Too Small (Don't Create)
- "Remove one console.log" - just do it inline
- "Fix a typo" - not worth coordination overhead

### Right Size
- "Fix all auth bypass vulnerabilities" - clear scope, single owner
- "Rewrite VideoFeed scroll mechanism" - self-contained, clear deliverable
- "Audit all backend routes for security" - bounded, produces a report

### Too Large (Split)
- "Build the entire frontend" - split by feature/page
- "Fix all bugs" - split by severity or module

### Dependencies (with AgentSpeak notation)

Use task blocking and `>>` / `<<` when order matters:

```
TaskCreate T1: Rewrite VideoFeed (coder)
TaskCreate T2: Polish VideoFeed UI (ui-expert) — <<T1
TaskCreate T3: Fix backend bugs (bugfix) — no dependencies

# When T1 completes:
coder -> lead: deltaT1 VF >>T2 -lockVF tsc clean.
lead -> ui-expert: T2 unblocked. +lockVF for polish.
ui-expert -> lead: alphaT2 +lockVF starting
```

## Shutdown Sequence

1. QA finishes report -> `omega` -> shut down QA
2. Bugfix finishes all fixes -> `omega` -> shut down bugfix
3. Specialist finishes polish -> `omega` -> shut down specialist
4. Coder finishes feature -> `omega` -> shut down coder
5. Lead verifies everything compiles -> clean up team

AgentSpeak shutdown messages:
```
qa -> lead:      omega T2 complete. All findings routed. DONE.
bugfix -> lead:  omega all fixes done. -lockCR,ER,CF,AC. DONE.
ui-expert -> lead: omega polish done. -lockGC,VS. DONE.
coder -> lead:   omega rewrite done. -lockVF,VS,GC. DONE.
```

Note: All agents release their file locks (`-lock`) before shutting down.
