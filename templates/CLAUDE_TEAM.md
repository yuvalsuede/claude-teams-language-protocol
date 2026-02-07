# Team Communication Protocol

> Include this in your CLAUDE.md or spawn prompts for agent teams.

## AgentSpeak Protocol v2.0

All inter-agent messages MUST use this compressed format.

### Status Codes
`alpha`=start `beta`=wip `gamma`=blocked `delta`=done `epsilon`=bug `omega`=shutdown

### Actions
`+`=added `-`=removed `~`=changed `!`=broken `?`=need `->`=depends/becomes
`>>`=unblocks `<<`=blocked-by `@`=route-to `+lock`=claim-file `-lock`=release-file

### Bug Severity
`P0`=critical `P1`=high `P2`=medium `P3`=low

### Message Priority
`!!`=urgent (none)=normal `..`=low/FYI

### File Shortcodes
<!-- Define your project's file shortcodes here -->
```
# Example:
VF = VideoFeed.tsx
VS = VideoSlide.tsx
AC = api-client.ts
AT = api-types.ts
GC = globals.css
AP = app.ts
PS = schema.prisma
CF = config.ts
```

### Message Format
```
[priority?][status][task?][file][action][detail]
```

### Examples
```
alpha PROTO:v2.0 @bugfix ready +lockCR,ER,CF
alphaT3 BUGFIX starting
beta50 AT ~8types match backend
deltaT1 VF ~translateY->scroll-snap -12log >>T4 -lockVF. tsc clean.
gammaT4 <<T1 ui-polish waits on VF rewrite
!!epsilonP0 CR !auth bypass L140
@bugfix [P0:CR L140, P0:ER L9, P1:CF L26]
epsilon!retry VF scroll-snap attempt:2/3
omega -lockCR,ER. DONE.
```

### QA Batch Report Format
```
epsilonBATCH [N]items:
P0:[n] [file!issue L#, ...]
P1:[n] [file!issue L#, ...]
P2:[n] [file!issue L#, ...]
P3:[n] [file!issue L#, ...]
```

### Rules
1. No greetings or filler words
2. Status code always first
3. Include line numbers with `L` prefix for bugs
4. Include task IDs with `T` prefix
5. One message per state change
6. Claim files with `+lock` before editing
7. Release files with `-lock` on completion
8. Signal unblocked tasks with `>>`
9. Declare protocol version at spawn: `alpha PROTO:v2.0`

## File Ownership
<!-- Define per-agent file ownership here -->
```
# Example:
Coder:      +lockVF,VS,GC
Bugfix:     +lockCR,ER,AC,AT,CF
Specialist: +lockGC(visual),VS(styling)
QA:         READ-ONLY (no locks)
```

## Task Dependencies
<!-- Define task dependencies here -->
```
# Example:
T1: Rewrite scroll mechanism (coder)
T2: QA audit (qa) — no dependencies
T3: Fix backend bugs (bugfix) — <<T2 (waits for QA report)
T4: UI polish (ui-expert) — <<T1 (waits for scroll rewrite)
```

## Team Rules
- Two agents must NEVER edit the same file simultaneously (use +lock/-lock)
- QA is read-only: audit with epsilonBATCH report, no edits
- Shut down agents immediately when their task is complete (omega DONE)
- Lead routes QA findings using @agent [items] (don't broadcast)
- Release all file locks (-lock) before omega shutdown
- Use >> to signal dependency resolution when completing tasks
- Run `tsc --noEmit` after all agents finish to verify no conflicts
- Use HOOK:verify on TaskCompleted for automated verification
