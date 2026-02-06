# Real-World Example: 4-Agent Sprint on a Next.js + Fastify Project

This is an annotated transcript from a real agent team session fixing and polishing a TikTok-style video platform (Peekaz).

## Setup

**Project**: Next.js 16 frontend + Fastify backend + Supabase + Redis
**Problem**: Critical mobile scroll bug, security vulnerabilities, UI inconsistencies
**Team**: Lead + Coder + QA + Bugfix + UI Expert

## Phase 1: Team Creation and Task Assignment

### Lead creates team and 4 tasks

```
TeamCreate: peekaz-mvp
TaskCreate #1: Rewrite VideoFeed with CSS scroll-snap (assigned: coder)
TaskCreate #2: QA audit entire codebase (assigned: qa)
TaskCreate #3: Fix console.logs, broken imports, type mismatches (assigned: bugfix)
TaskCreate #4: TikTok UI accuracy audit and polish (assigned: ui-expert)
```

### Lead spawns 4 agents with protocol in spawn prompt

Each spawn prompt includes:
1. The AgentSpeak protocol definition
2. Specific task with file list
3. File ownership boundaries
4. Instructions to message team with progress

## Phase 2: Parallel Execution

All 4 agents work simultaneously. Here's the message flow:

### Bugfix completes first (5 original items)

```
bugfix -> lead:
  alpha BUGFIX starting task #3
```

```
bugfix -> lead:
  beta BUGFIX progress:
  1. Console.logs: only in VF (coder domain, skipped)
  2. Pipeline imports: CLEAN
  3. .env.example +SUPABASE_URL +SUPABASE_ANON_KEY +SERVICE_ROLE_KEY
  4. API types: no mismatches
  5. UI: -comment btn, ~share btn +Web Share API check
  Files: backend/.env.example, web/VideoSlide.tsx
```

> **Note**: Bugfix correctly skipped VideoFeed.tsx (coder's domain) and communicated clearly what was changed.

### QA delivers comprehensive report

```
qa -> lead:
  24 findings prioritized:

  epsilon P0 content.routes !auth bypass L140-166 missing adminOnly
  epsilon P0 engagement.routes !no ownership check L9-19
  epsilon P0 content.routes !save/unsave no ownership L86-111
  epsilon P1 VF !missing CSS classes feed-strip/feed-panel L584
  epsilon P1 CF !insecure SIGNING_SECRET default L26
  epsilon P1 hash.ts !weak SHA-256 PIN hashing L13
  epsilon P2 admin.service !unused redis import L2
  epsilon P2 feed.monitoring !redis.keys O(N) L315
  ...
```

> **Note**: QA produced a single comprehensive report and shut down immediately. No back-and-forth.

### Lead routes findings to the right agents

```
lead -> bugfix: [4 critical + 3 high + 5 medium bugs to fix]
lead -> coder: [5 VF/VS items relevant to scroll-snap rewrite]
lead -> ui-expert: [3 minor styling items]
```

> **Key pattern**: Lead filtered the 24-item report and sent only relevant items to each agent. Bugfix didn't receive VF bugs (coder's domain). Coder didn't receive backend bugs.

### Bugfix handles QA findings

```
bugfix -> lead:
  delta BUGFIX all QA bugs fixed:
  - epsilon0 content.routes +adminOnly L140-166
  - epsilon0 engagement.routes +ownership check L9-19
  - epsilon0 content.routes +ownership check L86-111
  - epsilon1 CF -insecure default L26
  - epsilon1 CF SUPABASE vars now required
  - epsilon1 hash.ts ~SHA256->bcrypt
  - epsilon2 admin.service -unused redis import
  - epsilon2 feed.monitoring ~KEYS->SCAN
  - epsilon2 content.service cursor fix L265
  - epsilon2 feed.service hasMore fix L295
  - epsilon2 api-client.ts +retry counter L85
  tsc clean. 11 files changed.
```

### UI Expert delivers TikTok polish

```
ui-expert -> lead:
  delta GC+VS+VF ~TikTok UI polish complete. tsc clean.
  10 areas: sidebar, action btns, video info, progress bar,
  gradient, animations, desktop layout, typography, volume, play/pause
```

### Coder delivers scroll-snap rewrite

```
coder -> lead:
  delta VF+VS+GC ~translateY->scroll-snap
  -console.log -dragOffset -animateTo -noTransition
  +IntersectionObserver +slideRef +isVisible
  tsc clean.
```

## Phase 3: Shutdown and Verification

### Lead shuts down agents in order

```
1. QA    -> shutdown (report delivered, nothing more to do)
2. Bugfix -> shutdown (all 16 fixes done)
3. UI Expert -> shutdown (polish complete)
4. Coder -> shutdown (rewrite complete)
```

### Lead verifies

```
$ tsc --noEmit (frontend) -> clean
$ tsc --noEmit (backend) -> clean
$ browser test -> scroll works, videos advance correctly
```

### Lead cleans up team

```
TeamDelete: peekaz-mvp
```

## Results

| Metric | Value |
|--------|-------|
| Agents | 4 (+ lead) |
| Tasks completed | 4 |
| Bugs found by QA | 24 |
| Bugs fixed | 16 critical/high/medium |
| Files changed | ~25 |
| Lines changed | +2800 / -3500 |
| Merge conflicts | 0 |
| tsc errors after merge | 0 |
| Total time | ~8 minutes wall clock |

## Key Takeaways

1. **QA as read-only** worked perfectly. Single report, immediate shutdown, zero wasted tokens.
2. **Lead routing** prevented agents from processing irrelevant messages.
3. **File ownership** prevented merge conflicts despite 4 agents editing simultaneously.
4. **AgentSpeak protocol** kept messages concise. Bugfix's 16-item completion report was ~200 tokens instead of ~600.
5. **Debounce important**: The break suggestion bug was only caught by the lead testing in browser — agents don't catch UX bugs they can't see.
