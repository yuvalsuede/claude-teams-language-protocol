# AgentSpeak: A Token-Efficient Protocol for Claude Code Agent Teams

**Cut inter-agent communication tokens by 60-70%** with a structured, compressed language protocol for [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams).

## The Problem

When Claude Code agents communicate in a team, each message consumes tokens. With 4-5 agents messaging each other, token costs scale fast. Default English messages like:

> "I've finished fixing the VideoFeed component. I removed 12 console.log statements and changed the translateY animation to use CSS scroll-snap instead. TypeScript compiles cleanly."

...cost **~40 tokens**. The same message in AgentSpeak:

> `deltaVF ~translateY->scroll-snap -12log. tsc clean.`

...costs **~15 tokens**. Multiply across hundreds of inter-agent messages per session.

## Quick Start

Drop [`TEAM_PROTOCOL.md`](./TEAM_PROTOCOL.md) into your project's `CLAUDE.md` or pass it as part of your team spawn prompt.

```
# In your CLAUDE.md or spawn prompt:
## Team Communication Protocol
See TEAM_PROTOCOL.md for the AgentSpeak inter-agent messaging format.
All teammate messages MUST use this protocol.
```

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

### Actions (Single Characters)

| Symbol | Meaning |
|--------|---------|
| `+` | Added |
| `-` | Removed |
| `~` | Changed |
| `!` | Broken |
| `?` | Need/requesting |
| `->` | Depends on / becomes |

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
[status][file][action][detail]
```

### Examples

```
deltaVF ~translateY->scroll-snap -12log
epsilonP1 VS autoplay fail L142
gamma? coder: VF->done b4 VS fix
betaAT ~8types match backend
deltaAP -pipeline imports
epsilonP0 content.routes !auth bypass L140
```

## Full Playbook

- [**Protocol Specification**](./TEAM_PROTOCOL.md) - Complete protocol reference, drop into any project
- [**Team Patterns**](./docs/team-patterns.md) - How to structure teams, assign roles, avoid conflicts
- [**Token Optimization**](./docs/token-optimization.md) - Strategies beyond the protocol for minimizing cost
- [**Task Decomposition**](./docs/task-decomposition.md) - How to break work so agents don't collide
- [**Real-World Example**](./docs/example-session.md) - Annotated transcript from a real 4-agent sprint
- [**CLAUDE.md Template**](./templates/CLAUDE_TEAM.md) - Ready-to-use template for your project

## Why This Works

1. **Structured format** - Agents parse it faster than prose (less ambiguity = fewer follow-up messages)
2. **Fixed vocabulary** - Greek status codes + single-char actions = predictable, low-token messages
3. **File shortcodes** - Project-specific abbreviations eliminate long paths
4. **No pleasantries** - Agents don't need "Hi team!" or "Great work!" - just signal and data

## Benchmark Results (Real Data)

Measured on 10 real inter-agent messages from a 4-agent sprint (coder, QA, bugfix, UI expert) on a Next.js + Fastify project. Token counts via `tiktoken` (`cl100k_base`).

```
┌────┬──────────────────────────┬───────────┬───────────┬──────────┬──────────┐
│ #  │ Message Type             │ AgentSpk  │ Verbose   │ Savings  │ Ratio    │
├────┼──────────────────────────┼───────────┼───────────┼──────────┼──────────┤
│  1 │ status_start             │      29   │      82   │   64.6%  │    2.8x  │
│  2 │ progress_report          │     325   │     557   │   41.7%  │    1.7x  │
│  3 │ qa_report                │     360   │     986   │   63.5%  │    2.7x  │
│  4 │ lead_routing             │     196   │     503   │   61.0%  │    2.6x  │
│  5 │ task_complete            │     232   │     516   │   55.0%  │    2.2x  │
│  6 │ task_complete_coder      │      59   │     325   │   81.8%  │    5.5x  │
│  7 │ task_complete_ui         │     242   │     784   │   69.1%  │    3.2x  │
│  8 │ lead_routing_coder       │      84   │     393   │   78.6%  │    4.7x  │
│  9 │ shutdown_ack             │      19   │      69   │   72.5%  │    3.6x  │
│ 10 │ cross_agent_coord        │      40   │     100   │   60.0%  │    2.5x  │
├────┼──────────────────────────┼───────────┼───────────┼──────────┼──────────┤
│ ΣΣ │ TOTAL                    │    1586   │    4315   │   63.2%  │    2.7x  │
└────┴──────────────────────────┴───────────┴───────────┴──────────┴──────────┘
```

### By Agent Role

| Agent | Savings | Ratio | Notes |
|-------|---------|-------|-------|
| Coder | **81.8%** | 5.5x | Code status updates compress best |
| Lead | 68.8% | 3.2x | Routing/assignment messages are formulaic |
| UI Expert | 68.1% | 3.2x | Component-level updates |
| QA | 64.1% | 2.8x | Bug reports with line numbers |
| Bugfix | 49.3% | 2.0x | Detailed progress is harder to compress |

### Cost Impact (Claude Opus 4.6 Pricing)

Each agent message is **output** for the sender ($25/MTok) and **input** for the receiver ($5/MTok).

| Scale | Tokens Saved | Input Saved ($5/MTok) | Output Saved ($25/MTok) | Combined |
|-------|-------------|----------------------|------------------------|----------|
| Per session | 2,729 | $0.014 | $0.068 | **$0.082** |
| 100 sessions/day | 272,900 | $1.36/day | $6.82/day | **$8.19/day** |
| 3,000 sessions/mo | 8,187,000 | $40.94/mo | $204.68/mo | **$245.61/mo** |

> Run it yourself: `node benchmarks/run-benchmark.mjs` (requires `npm install`)

## Contributing

PRs welcome. This protocol is intentionally minimal - resist the urge to add complexity. The best protocol is the one agents actually use consistently.

## License

MIT
