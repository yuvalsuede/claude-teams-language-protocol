# AgentSpeak v2: Token-Efficient Protocol for Claude Code Agent Teams

**Cut inter-agent communication tokens by 60-70%** with a structured, compressed language protocol for [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams).

## The Problem

When Claude Code agents communicate in a team, each message consumes tokens. With 4-5 agents messaging each other, token costs scale fast. Default English messages like:

> "I've finished fixing the VideoFeed component. I removed 12 console.log statements and changed the translateY animation to use CSS scroll-snap instead. TypeScript compiles cleanly."

...cost **~40 tokens**. The same message in AgentSpeak:

> `deltaT1 VF ~translateY->scroll-snap -12log. tsc clean.`

...costs **~15 tokens**. Multiply across hundreds of inter-agent messages per session.

## What's New in v2

AgentSpeak v2 integrates with Claude Code's native [Agent Teams](https://code.claude.com/docs/en/agent-teams) system, bridging the protocol with shared task lists, hooks, and dependency tracking.

| Feature | v1 | v2 |
|---------|----|----|
| Status codes + actions | Yes | Yes |
| File shortcodes | Yes | Yes |
| **Task ID references** (`T#`) | -- | Maps to shared task list |
| **Dependency notation** (`>>` / `<<`) | -- | Unblock/block signals |
| **File locking** (`+lock` / `-lock`) | -- | Runtime ownership claims |
| **Message priority** (`!!` / `..`) | -- | Urgent / normal / FYI |
| **Progress indicator** (`beta75`) | -- | Quantitative % done |
| **Lead routing shorthand** (`@agent []`) | -- | Compact assignment |
| **QA batch format** (`epsilonBATCH`) | -- | Structured severity groups |
| **Error recovery** (`epsilon!retry`) | -- | Retry/fail/reassign |
| **Hook integration** (`HOOK:verify`) | -- | TeammateIdle + TaskCompleted |
| **Protocol versioning** (`PROTO:v2.0`) | -- | Version declaration at spawn |

## Quick Start

> **New to agent teams?** Read the [**Quickstart Guide**](./docs/quickstart.md) for a full step-by-step walkthrough.

**1. Enable agent teams** (experimental, disabled by default):

```json
// ~/.claude/settings.json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

**2. Add the protocol** to your project's `CLAUDE.md`:

```markdown
## Team Communication Protocol
See TEAM_PROTOCOL.md for the AgentSpeak v2 inter-agent messaging format.
All teammate messages MUST use this protocol.
```

**3. Drop in the protocol file** — pick one:

- [`TEAM_PROTOCOL.md`](./TEAM_PROTOCOL.md) — full spec (complete reference)
- [`templates/CLAUDE_TEAM.md`](./templates/CLAUDE_TEAM.md) — minimal template (just the essentials)

**4. Ask Claude to create a team.** Every teammate reads `CLAUDE.md` automatically — no injection needed:

```
Create an agent team with a coder, QA, and bugfix agent.
Use delegate mode so you only coordinate.
```

That's it. See the [Quickstart Guide](./docs/quickstart.md) for display modes, interaction tips, and common patterns.

## Protocol Overview

### Status Codes (Greek Letters)

| Symbol | Meaning | Use When |
|--------|---------|----------|
| `alpha` | Starting | Beginning a task |
| `beta` | In progress | Working, no blockers |
| `gamma` | Blocked | Need help or waiting on another agent |
| `delta` | Done | Task completed |
| `epsilon` | Bug found | Reporting an issue |
| `omega` | Shutdown | Wrapping up |

### Actions

| Symbol | Meaning |
|--------|---------|
| `+` | Added |
| `-` | Removed |
| `~` | Changed |
| `!` | Broken |
| `?` | Need/requesting |
| `->` | Depends on / becomes |
| `>>` | Unblocks (dependents can proceed) |
| `<<` | Blocked by (waiting on task) |
| `@` | Route to / assign to agent |
| `+lock` / `-lock` | Claim / release file ownership |

### File Shortcodes

Define 2-3 letter codes for your project's key files:

```
VF=VideoFeed.tsx  VS=VideoSlide.tsx  AC=api-client.ts
AT=api-types.ts   GC=globals.css     AP=app.ts
PS=schema.prisma  CF=config.ts       EN=.env
```

### Bug Severity

`P0`=critical `P1`=high `P2`=medium `P3`=low

### Message Format

```
[priority?][status][task?][file][action][detail]
```

### Examples

```
# Status with task reference and dependency
alphaT3 BUGFIX starting
deltaT1 VF ~translateY->scroll-snap -12log >>T4,T5
gammaT4 <<T1 ui-polish waits on VF rewrite

# Priority-flagged bug reports
!!epsilonP0 content.routes !auth bypass L140
epsilonP1 VS autoplay fail L142
..epsilonP3 GC ~comment cleanup

# Lead routing
@bugfix [P0:content.routes L140, P0:engagement.routes L9]
@coder [P2:VF L200, P2:VS L33]

# File locking
+lockVF,VS,GC
-lockVF

# Progress indicator
beta75 AT ~types match backend

# Error recovery
epsilon!retry VF scroll-snap attempt:2/3
epsilon!fail VF scroll-snap attempt:3/3 ?lead
```

## Full Playbook

- [**Quickstart Guide**](./docs/quickstart.md) - Step-by-step setup, display modes, interaction tips, common patterns
- [**Protocol Specification**](./TEAM_PROTOCOL.md) - Complete v2 protocol reference, drop into any project
- [**Team Patterns**](./docs/team-patterns.md) - How to structure teams, assign roles, avoid conflicts
- [**Token Optimization**](./docs/token-optimization.md) - Strategies beyond the protocol for minimizing cost
- [**Task Decomposition**](./docs/task-decomposition.md) - How to break work so agents don't collide
- [**Real-World Example**](./docs/example-session.md) - Annotated transcript from a real 4-agent sprint
- [**CLAUDE.md Template**](./templates/CLAUDE_TEAM.md) - Ready-to-use template for your project

## Integration with Claude Code Agent Teams

AgentSpeak v2 is designed to work with Claude Code's native [Agent Teams](https://code.claude.com/docs/en/agent-teams) system:

### Shared Task List

Claude Code agent teams have a shared task list with states (pending, in-progress, completed) and dependencies. AgentSpeak's `T#` references map directly:

```
# Agent claims task from shared list
alphaT3 +lockCR,ER BUGFIX starting

# Agent completes task, signals dependency resolution
deltaT3 >>T5,T7 -lockCR,ER tsc clean.
```

### Hooks

Claude Code provides `TeammateIdle` and `TaskCompleted` hooks. AgentSpeak messages can trigger them:

```
# TaskCompleted hook — lead verifies before marking done
deltaT3 VF +scroll-snap HOOK:verify

# TeammateIdle hook — agent requests next task or signals done
omega @lead idle ?nextT
omega @lead idle DONE
```

### Hub-and-Spoke Routing

The lead filters and routes findings. AgentSpeak's `@agent [items]` syntax makes this compact:

```
# Instead of 3 verbose English messages:
@bugfix [P0:content.routes L140, P0:engagement.routes L9, P1:CF L26]
@coder [P1:VF L584, P2:VF L200]
@ui-expert [P3:GC L677]
```

### Display Modes

AgentSpeak works with both Claude Code display modes:
- **In-process**: teammates in the same terminal, navigate with Shift+Up/Down
- **Split panes**: each teammate in its own tmux/iTerm2 pane

## Why This Works

1. **Structured format** - Agents parse it faster than prose (less ambiguity = fewer follow-up messages)
2. **Fixed vocabulary** - Greek status codes + single-char actions = predictable, low-token messages
3. **File shortcodes** - Project-specific abbreviations eliminate long paths
4. **No pleasantries** - Agents don't need "Hi team!" or "Great work!" - just signal and data
5. **Task integration** - `T#` references eliminate "which task?" clarification messages
6. **Dependency signals** - `>>` / `<<` eliminate status-check round trips
7. **File locks** - Runtime ownership prevents the #1 team failure mode (merge conflicts)

## Benchmark Results (Real Data)

Measured on 15 real inter-agent messages from a 4-agent sprint (coder, QA, bugfix, UI expert) on a Next.js + Fastify project. Token counts via `tiktoken` (`cl100k_base`). Messages 11-15 demonstrate v2-specific features.

```
+---------+--------------------------+-----------+-----------+----------+----------+
| #       | Message Type             | AgentSpk  | Verbose   | Savings  | Ratio    |
+---------+--------------------------+-----------+-----------+----------+----------+
|  1      | status_start             |      53   |      82   |   35.4%  |    1.5x  |
|  2      | progress_report          |     325   |     557   |   41.7%  |    1.7x  |
|  3      | qa_report                |     360   |     986   |   63.5%  |    2.7x  |
|  4      | lead_routing             |     196   |     503   |   61.0%  |    2.6x  |
|  5      | task_complete            |     232   |     516   |   55.0%  |    2.2x  |
|  6      | task_complete_coder      |      59   |     325   |   81.8%  |    5.5x  |
|  7      | task_complete_ui         |     242   |     784   |   69.1%  |    3.2x  |
|  8      | lead_routing_coder       |      84   |     393   |   78.6%  |    4.7x  |
|  9      | shutdown_ack             |      19   |      69   |   72.5%  |    3.6x  |
| 10      | cross_agent_coord        |      40   |     100   |   60.0%  |    2.5x  |
| 11      | dependency_signal     *  |      23   |      76   |   69.7%  |    3.3x  |
| 12      | file_lock_claim       *  |      22   |      81   |   72.8%  |    3.7x  |
| 13      | qa_batch_report       *  |     141   |     263   |   46.4%  |    1.9x  |
| 14      | lead_routing_compact  *  |     114   |     215   |   47.0%  |    1.9x  |
| 15      | error_recovery        *  |      32   |      91   |   64.8%  |    2.8x  |
+---------+--------------------------+-----------+-----------+----------+----------+
| TOTAL   |                          |    1942   |    5041   |   61.5%  |    2.6x  |
+---------+--------------------------+-----------+-----------+----------+----------+

* = v2 protocol message types
```

### v1 vs v2 Message Compression

| Message Set | Savings | Ratio | Notes |
|---|---|---|---|
| v1 messages (1-10) | 62.7% | 2.7x | Core protocol compression |
| **v2 messages (11-15)** | **54.3%** | **2.2x** | Coordination messages (dependencies, locks, batch reports) |

v2 features compress coordination overhead — the messages that previously required multi-round-trip English conversations.

### By Agent Role

| Agent | Savings | Ratio | Notes |
|-------|---------|-------|-------|
| Coder | **79.6%** | 4.9x | Code status updates + dependency signals compress best |
| Lead | 64.5% | 2.8x | Routing with `@agent []` shorthand |
| UI Expert | 68.5% | 3.2x | Component updates + lock claims |
| QA | 60.5% | 2.5x | Bug reports + `epsilonBATCH` format |
| Bugfix | 48.5% | 1.9x | Detailed progress + error recovery |

### Cost Impact (Claude Opus 4.6 Pricing)

Each agent message is **output** for the sender ($25/MTok) and **input** for the receiver ($5/MTok).

| Scale | Tokens Saved | Input Saved ($5/MTok) | Output Saved ($25/MTok) | Combined |
|-------|-------------|----------------------|------------------------|----------|
| Per session | 3,099 | $0.015 | $0.077 | **$0.093** |
| 100 sessions/day | 309,900 | $1.55/day | $7.75/day | **$9.30/day** |
| 3,000 sessions/mo | 9,297,000 | $46.49/mo | $232.43/mo | **$278.91/mo** |

> Run it yourself: `node benchmarks/run-benchmark.mjs` (requires `npm install`)

## Contributing

PRs welcome. Design principles for protocol changes:

1. **Minimize tokens** - Every new symbol must save more tokens than it costs to learn
2. **Stay parseable** - Agents (and humans) must be able to read messages at a glance
3. **Integrate with Claude Code** - New features should map to native Agent Teams concepts
4. **Resist complexity** - The best protocol is the one agents actually use consistently

## License

MIT
