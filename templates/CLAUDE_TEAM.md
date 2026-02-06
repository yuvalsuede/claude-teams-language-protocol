# Team Communication Protocol

> Include this in your CLAUDE.md or spawn prompts for agent teams.

## AgentSpeak Protocol

All inter-agent messages MUST use this compressed format.

### Status Codes
`alpha`=start `beta`=wip `gamma`=blocked `delta`=done `epsilon`=bug `omega`=shutdown

### Actions
`+`=added `-`=removed `~`=changed `!`=broken `?`=need `->`=depends/becomes

### Bug Severity
`P0`=critical `P1`=high `P2`=medium `P3`=low

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
[status][file][action][detail]
```

### Examples
```
delta VF ~translateY->scroll-snap -12log. tsc clean.
epsilon P0 content.routes !auth bypass L140
gamma? coder: VF->done b4 VS fix
beta AT ~8types match backend
```

### Rules
1. No greetings or filler words
2. Status code always first
3. Include line numbers with `L` prefix for bugs
4. One message per state change

## File Ownership
<!-- Define per-agent file ownership here -->
```
# Example:
Coder:     [list files]
Bugfix:    [list files]
Specialist: [list files]
QA:        READ-ONLY (no files)
```

## Team Rules
- Two agents must NEVER edit the same file simultaneously
- QA is read-only: audit and report, no edits
- Shut down agents immediately when their task is complete
- Lead routes QA findings to the right agent (don't broadcast)
- Run `tsc --noEmit` after all agents finish to verify no conflicts
