# AgentSpeak Protocol v2 - Complete Specification

> Drop this file into your CLAUDE.md or include it in agent spawn prompts.

## Protocol Rules

1. ALL inter-agent messages MUST use this format
2. No greetings, pleasantries, or filler words
3. Status code is ALWAYS first
4. One message per state change (don't batch unrelated updates)
5. Include file shortcode when referencing specific files
6. Include line numbers with `L` prefix when reporting bugs

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
+    = Added
-    = Removed / deleted
~    = Changed / modified
!    = Broken / breaking
?    = Need / requesting
->   = Depends on / transforms to / becomes
```

## Bug Severity

```
P0 = Critical (security, data loss, crash)
P1 = High (broken feature, bad UX)
P2 = Medium (logic bug, type mismatch)
P3 = Low (code quality, style)
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

## Message Format

```
[status][file][action][detail]
```

### Status Updates

```
alpha BUGFIX starting task #3
beta AT ~8types match backend
delta VF ~translateY->scroll-snap -12log. tsc clean.
gamma? coder: VF->done b4 VS fix
omega shutting down, all tasks done
```

### Bug Reports

```
epsilon P0 content.routes !auth bypass L140-166
epsilon P1 VF !console.log spam L260,262,267
epsilon P2 feed.service !hasMore always true L295
epsilon P3 GC duplicate comment block L677,L725
```

### Cross-Agent Requests

```
? coder: VF status
! bugfix: AP still imports pipeline
-> qa: check VS after my delta
```

### Batch Summaries (task completion)

```
delta BUGFIX all QA bugs fixed:
- epsilon0 content.routes +adminOnly L140-166
- epsilon0 engagement.routes +ownership check L9-19
- epsilon1 CF -insecure .default() L26
- epsilon2 admin.service -unused redis import L2
tsc clean. 11 files changed.
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
delta VF ~translateY->scroll-snap -12log. tsc clean.
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
epsilon P0 content.routes !auth bypass — admin CRUD L140-166 missing adminOnly middleware. Any auth user can POST/PUT/DELETE videos.
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
