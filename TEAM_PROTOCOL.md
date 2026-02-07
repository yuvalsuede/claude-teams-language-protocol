# AgentSpeak Protocol v2.0 - Complete Specification

> Drop this file into your CLAUDE.md or include it in agent spawn prompts.

## Protocol Rules

1. ALL inter-agent messages MUST use this format
2. No greetings, pleasantries, or filler words
3. Status code is ALWAYS first
4. One message per state change (don't batch unrelated updates)
5. Include file shortcode when referencing specific files
6. Include line numbers with `L` prefix when reporting bugs
7. Include task ID (`T#`) when referencing shared task list items
8. Declare protocol version at agent spawn: `alpha PROTO:v2.0`

## Status Codes

```
alpha   = Starting task
beta    = In progress, no blockers
gamma   = Blocked / need help / waiting
delta   = Done / completed
epsilon = Bug found / error
omega   = Shutting down
```

## Actions

```
+     = Added
-     = Removed / deleted
~     = Changed / modified
!     = Broken / breaking
?     = Need / requesting
->    = Depends on / transforms to / becomes
>>    = Unblocks (task completed, dependents can proceed)
<<    = Blocked by (waiting on another task)
@     = Route to / assign to agent
+lock = Claim file ownership
-lock = Release file ownership
```

## Bug Severity

```
P0 = Critical (security, data loss, crash)
P1 = High (broken feature, bad UX)
P2 = Medium (logic bug, type mismatch)
P3 = Low (code quality, style)
```

## Message Priority

```
!!  = Urgent (requires immediate lead attention, e.g. P0 security bugs)
(none) = Normal (default, routine status updates)
..  = Low / FYI only (informational, no action needed)
```

## Progress Indicator

Append a percentage to `beta` to signal how far along a task is:

```
beta25 VF ~scroll-snap       # 25% done
beta75 AT ~types              # 75% done
beta100 VF ~scroll-snap       # essentially done, wrapping up
```

## Task References

Reference shared task list items with `T` prefix:

```
alphaT3 BUGFIX starting       # starting task #3
deltaT3 VF +scroll-snap       # task #3 completed
gammaT4 <<T2                  # task #4 blocked by task #2
deltaT3 >>T5,T7               # task #3 done, unblocks tasks #5 and #7
```

## File Shortcodes

Define per-project. Format: 2-3 uppercase letters.

```
# Example for a Next.js + Fastify project:
VF = VideoFeed.tsx
VS = VideoSlide.tsx
AC = api-client.ts
AT = api-types.ts
GC = globals.css
AP = app.ts (backend entry)
PS = prisma/schema.prisma
CF = config/index.ts
EN = .env / .env.example
RT = routes file
SV = service file
MD = middleware
```

Agents should define shortcodes for their project in the spawn prompt.

## File Locking

Claim and release file ownership at runtime to prevent conflicts:

```
+lockVF             # "I'm claiming VideoFeed.tsx"
-lockVF             # "I'm releasing VideoFeed.tsx"
!lockVF @coder      # "Conflict: coder also editing VideoFeed.tsx"
+lockVF,VS,GC       # Claim multiple files at once
```

Rules:
- Claim files BEFORE editing them
- Release files AFTER your task completes
- If a lock conflict is detected, the lead resolves it

## Message Format

```
[priority?][status][task?][file][action][detail]
```

### Status Updates

```
alpha PROTO:v2.0 @bugfix ready
alphaT3 BUGFIX starting
beta50 AT ~8types match backend
deltaT1 VF ~translateY->scroll-snap -12log. tsc clean.
gammaT4 <<T2 coder: VF->done b4 VS fix
omega shutting down, all tasks done
```

### Bug Reports

```
!!epsilonP0 content.routes !auth bypass L140-166
epsilonP1 VF !console.log spam L260,262,267
epsilonP2 feed.service !hasMore always true L295
..epsilonP3 GC duplicate comment block L677,L725
```

### Cross-Agent Requests

```
? coder: VF status
! bugfix: AP still imports pipeline
-> qa: check VS after my delta
```

### Lead Routing (Assignment)

Route QA findings to specific agents with `@agent [items]`:

```
@bugfix [P0:content.routes L140, P0:engagement.routes L9, P1:CF L26]
@coder [P1:VF L584, P2:VF L200, P2:VS L33]
@ui-expert [P3:GC L677, P3:VS visual polish]
```

### QA Batch Report

Structured format for comprehensive QA reports:

```
epsilonBATCH 16items:
P0:3 [content.routes!auth L140, engagement.routes!ownership L9, content.routes!save L86]
P1:5 [VF!css L584, VF!log L260, CF!secret L26, seed.ts!passwords L60, hash.ts!weak L13]
P2:7 [VF!snap L200, VS!onTap L33, admin.svc!import L2, feed.mon!keys L315, content.svc!cursor L265, feed.svc!hasMore L295, AC!retry L85]
P3:1 [GC!dupe-comment L677]
```

### Batch Summaries (task completion)

```
deltaT3 BUGFIX all QA bugs fixed:
- P0 content.routes +adminOnly L140-166
- P0 engagement.routes +ownership check L9-19
- P1 CF -insecure .default() L26
- P2 admin.service -unused redis import L2
tsc clean. 11 files changed.
```

### Error Recovery

```
epsilon!retry VF scroll-snap attempt:2/3       # retrying after error
epsilon!fail VF scroll-snap attempt:3/3 ?lead   # giving up, needs lead
@coder T3:reassign (from @bugfix epsilon!fail)  # lead reassigns failed task
```

### Dependency Signals

```
deltaT3 >>T5,T7     # "T3 done, unblocks T5 and T7"
gammaT4 <<T2         # "T4 blocked, waiting on T2"
deltaT1 >>T2,T3,T4   # "T1 done, unblocks 3 tasks"
```

### Hook Integration

Messages that map to Claude Code's TeammateIdle and TaskCompleted hooks:

```
deltaT3 VF +scroll-snap +tests HOOK:verify    # TaskCompleted — run verification
omega @lead idle ?nextT                        # TeammateIdle — request next task
omega @lead idle DONE                          # TeammateIdle — no more work
```

## Anti-Patterns

DON'T:
```
"Hi team! I've finished working on the VideoFeed component.
I removed all the console.log statements (there were 12 of them)
and changed the animation from translateY to scroll-snap.
Everything compiles cleanly now. Let me know if you need anything!"
```

DO:
```
deltaT1 VF ~translateY->scroll-snap -12log. tsc clean.
```

DON'T:
```
"I found a critical security vulnerability in the content routes file.
The admin video CRUD endpoints at lines 140 through 166 only use the
authenticate middleware but they're missing the adminOnly middleware,
which means any authenticated user can create, update, or delete videos."
```

DO:
```
!!epsilonP0 content.routes !auth bypass — admin CRUD L140-166 missing adminOnly. Any auth user can POST/PUT/DELETE videos.
```

DON'T (routing):
```
"Hey bugfix, the QA agent found some bugs for you to work on.
There are 4 critical auth issues in the backend routes..."
```

DO (routing):
```
@bugfix [P0:content.routes L140, P0:engagement.routes L9, P0:content.routes L86, P1:CF L26]
```

DON'T (blocking):
```
"I can't start my task yet because I'm waiting for the coder
to finish the VideoFeed rewrite before I can polish the UI."
```

DO (blocking):
```
gammaT4 <<T1 ui-polish waits on VF rewrite
```

## Customization

### Adding Project-Specific Codes

Add domain codes after the standard protocol:

```
## Project Codes
DB  = Database migration
API = API endpoint
UI  = Frontend component
TST = Test file
DEP = Deployment/infra
```

### Adjusting Severity Definitions

Map P0-P3 to your project's reality:

```
P0 = Blocks release / security / data loss
P1 = Breaks user flow / major regression
P2 = Wrong behavior / confusing output
P3 = Cosmetic / code style / minor optimization
```

### Adding Custom Status Codes

Extend the Greek alphabet for domain-specific states:

```
zeta    = Needs code review
eta     = Waiting for external dependency (API, deploy)
theta   = Testing / running verification
```
