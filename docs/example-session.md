# Real-World Example: 4-Agent Sprint on a Next.js + Fastify Project

This is an annotated transcript from a real agent team session fixing and polishing a TikTok-style video platform (Peekaz). Updated with AgentSpeak v2 protocol notation.

## Setup

**Project**: Next.js 16 frontend + Fastify backend + Supabase + Redis
**Problem**: Critical mobile scroll bug, security vulnerabilities, UI inconsistencies
**Team**: Lead + Coder + QA + Bugfix + UI Expert
**Protocol**: AgentSpeak v2.0

## Phase 1: Team Creation and Task Assignment

### Lead creates team, shared task list, and file ownership

```
TeamCreate: peekaz-mvp
TaskCreate T1: Rewrite VideoFeed with CSS scroll-snap (assigned: coder)
TaskCreate T2: QA audit entire codebase (assigned: qa)
TaskCreate T3: Fix console.logs, broken imports, type mismatches (assigned: bugfix)
TaskCreate T4: TikTok UI accuracy audit and polish (assigned: ui-expert) <<T1

File Ownership:
  Coder:     +lockVF,VS,GC
  Bugfix:    +lockCR,ER,CF,AC,AT,EN
  UI Expert: +lockGC(visual),VS(styling) — waits for T1 before claiming VF
  QA:        READ-ONLY
```

> **Note**: T4 (UI polish) has a dependency on T1 (scroll rewrite) using `<<T1`. The UI expert can't polish VF until the coder finishes rewriting it.

### Lead spawns 4 agents with protocol in spawn prompt

Each spawn prompt includes:
1. The AgentSpeak v2 protocol definition
2. Specific task with file list and task ID
3. File ownership boundaries (lock assignments)
4. Instructions to message team with progress

## Phase 2: Parallel Execution

All 4 agents work simultaneously. Here's the message flow:

### Bugfix starts and reports progress

```
bugfix -> lead:
  alpha PROTO:v2.0 @bugfix ready +lockCR,ER,CF,AC,AT,EN
  alphaT3 BUGFIX starting
```

```
bugfix -> lead:
  beta50 T3 progress:
  1. Console.logs: only in VF (coder domain, skipped per +lockVF)
  2. Pipeline imports: CLEAN
  3. EN +SUPABASE_URL +SUPABASE_ANON_KEY +SERVICE_ROLE_KEY
  4. AT: no mismatches
  5. VS: -comment btn, ~share btn +Web Share API check
  Files: EN(~chg), VS(~chg)
  gamma? waiting QA findings for additional bugs.
```

> **Note**: Bugfix correctly skipped VideoFeed.tsx (coder's `+lock` domain), reported 50% progress, and signaled waiting for QA.

### QA delivers comprehensive report using batch format

```
qa -> lead:
  epsilonBATCH 16items:
  P0:3 [CR!auth bypass L140-166 missing adminOnly,
        ER!no ownership check L9-19,
        CR!no ownership save/unsave L86-111]
  P1:5 [VF!missing CSS feed-strip/feed-panel L584,
        VF!console.log spam L260,262,267,289,293,385,
        CF!insecure SIGNING_SECRET default L26,
        seed.ts!hardcoded passwords L60,73,
        hash.ts!weak SHA-256 no salt L13]
  P2:7 [VF!scroll-snap conflict GC L200-203,
        VS!unused onTap prop L33,
        admin.svc!unused redis import L2,
        feed.mon!redis.keys O(N) L315,
        content.svc!cursor off-by-one L265,
        feed.svc!hasMore always true L295,
        AC!infinite 401 retry L85-89]
  P3:1 [CF!SUPABASE defaults empty L7-8]
  Cross-cutting: no pipeline imports. AT match. Feed endpoints match.
  omega T2 complete. DONE.
```

> **Note**: QA used the `epsilonBATCH` format grouped by severity, making routing trivial for the lead. Immediate `omega` — single report, no back-and-forth.

### Lead routes findings using @agent shorthand

```
lead -> bugfix:
  deltaT3(original items). Now tackle QA findings:
  @bugfix [P0:CR L140 +adminOnly,
           P0:ER L9 +ownership,
           P0:CR L86 +ownership,
           P1:CF L26 rm default,
           P1:CF L7-8 rm empty defaults,
           P1:hash.ts L13 ~bcrypt,
           P2:admin.svc L2 -import,
           P2:feed.mon L315 ~SCAN,
           P2:content.svc L265 fix cursor,
           P2:feed.svc L295 fix hasMore,
           P2:AC L85 +retry counter]
  Don't touch VF — coder +lockVF.
```

```
lead -> coder:
  QA flagged for VF (your +lock domain):
  @coder [P1:VF!css feed-strip/feed-panel L584,
          P2:VF!scroll-snap conflict GC L200,
          P2:VS!onTap unused L33]
```

```
lead -> ui-expert:
  ..@ui-expert [P3:GC visual polish items]
  Reminder: T4 <<T1. Wait for coder deltaT1 before +lockVF.
```

> **Key pattern**: Lead used `@agent [items]` routing shorthand. Bugfix got only backend items. Coder got only VF/VS items. UI expert got low-priority visual items with a dependency reminder.

### Bugfix handles QA findings

```
bugfix -> lead:
  deltaT3 BUGFIX all QA bugs fixed. tsc clean.

  P0(3/3):
  - CR +adminOnly on 4 admin CRUD endpoints L140-166
  - ER +verifyProfileOwnership on like/unlike/getLikes L9-19
  - CR +verifyProfileOwnership on save/unsave/getSaved/checkSaved L86-111

  P1(3/3):
  - CF SIGNING_SECRET -insecure default, now required L26
  - CF SUPABASE vars ~.default('')->.min(1) L7-8
  - hash.ts ~SHA-256->bcrypt (async). Updated auth.svc + pin-gate

  P2(5/5):
  - admin.svc -unused redis import L2
  - feed.mon ~redis.keys->SCAN loop L315
  - content.svc cursor fix saves[limit-1].id L265
  - feed.svc hasMore = feedVideos.length>=limit AND pool>feedVideos L295
  - AC +_retryCount max 1 retry L85

  11 files changed. -lockCR,ER,CF,AC,AT.
  omega DONE.
```

> **Note**: Bugfix released all file locks (`-lock`) on completion and signaled `omega DONE`.

### Coder delivers scroll-snap rewrite

```
coder -> lead:
  deltaT1 VF+VS+GC ~translateY->scroll-snap >>T4
  -console.log -dragOffset -animateTo -noTransition -tapSignal
  +IntersectionObserver +slideRef +isVisible +handleTap +touch-action:pan-y
  tsc clean. -lockVF(releasing for T4 UI polish). -lockVS,GC.
```

> **Note**: Coder used `>>T4` to signal that T4 (UI polish) is now unblocked. Released `lockVF` so the UI expert can claim it.

### UI Expert starts after T1 unblock

```
ui-expert -> lead:
  alphaT4 +lockVF. T1 complete, starting UI polish.
```

### UI Expert coordinates with coder

```
ui-expert -> coder:
  beta75 VS+GC styling changes done. Your scroll-snap in VF unaffected —
  only changed visual props (sizes, colors, shadows, animations).
  No layout/overflow/scroll changes.
```

> **Note**: Direct coordination between agents about non-conflicting changes.

### UI Expert delivers TikTok polish

```
ui-expert -> lead:
  deltaT4 GC+VS+VF ~TikTok UI polish complete. tsc clean.
  10 areas: sidebar, action btns, video info, progress bar,
  gradient, animations, desktop layout, typography, volume, play/pause
  -lockVF,GC,VS. omega DONE.
```

## Phase 3: Shutdown and Verification

### Lead shuts down agents in order

```
1. QA       -> omega (report delivered, shut down immediately after epsilonBATCH)
2. Bugfix   -> omega (all 11/11 fixes done, locks released)
3. Coder    -> omega (rewrite complete, T4 unblocked via >>)
4. UI Expert -> omega (polish complete, all locks released)
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
| Bugs found by QA | 16 (via epsilonBATCH) |
| Bugs fixed | 11 critical/high/medium |
| Files changed | ~25 |
| Lines changed | +2800 / -3500 |
| Merge conflicts | 0 (file locking prevented all) |
| tsc errors after merge | 0 |
| Lock conflicts | 0 |
| Total time | ~8 minutes wall clock |

## Key Takeaways

1. **QA as read-only** worked perfectly. Single `epsilonBATCH` report, immediate `omega`, zero wasted tokens.
2. **Lead routing with `@agent`** prevented agents from processing irrelevant messages. Compact and unambiguous.
3. **File locking (`+lock`/`-lock`)** prevented merge conflicts despite 4 agents editing simultaneously. Zero conflicts.
4. **Task dependencies (`>>` / `<<`)** let T4 (UI polish) automatically unblock when T1 (scroll rewrite) completed. No status-check messages needed.
5. **AgentSpeak v2 protocol** kept messages concise. Bugfix's 11-item completion report was ~200 tokens instead of ~600.
6. **Progress indicators (`beta50`, `beta75`)** gave the lead quantitative status without needing to ask.
7. **Protocol versioning (`PROTO:v2.0`)** at spawn confirmed all agents used the same message format.
8. **Browser testing important**: The lead caught UX bugs agents can't see — agents don't have visual context.
