# Quickstart: AgentSpeak v2 with Claude Code Agent Teams

Go from zero to a working agent team with compressed messaging in 5 minutes.

## Prerequisites

- [Claude Code](https://code.claude.com) installed
- A project with a `CLAUDE.md` file (or create one)

## Step 1: Enable Agent Teams

Agent teams are experimental and disabled by default. Add this to your settings:

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or set the environment variable directly:

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

## Step 2: Add the Protocol to Your Project

Copy the template into your project root:

```bash
# Option A: Full protocol spec (complete reference)
cp TEAM_PROTOCOL.md your-project/

# Option B: Minimal template (just the essentials)
cp templates/CLAUDE_TEAM.md your-project/
```

Then add a reference in your project's `CLAUDE.md`:

```markdown
## Team Communication Protocol
See TEAM_PROTOCOL.md for the AgentSpeak v2 inter-agent messaging format.
All teammate messages MUST use this protocol.
```

**Why this works**: Claude Code automatically loads `CLAUDE.md` into every teammate's context at spawn. From the [official docs](https://code.claude.com/docs/en/agent-teams):

> Teammates load the same project context as a regular session: CLAUDE.md, MCP servers, and skills.

So every agent on the team reads the protocol automatically. No special injection needed.

## Step 3: Customize for Your Project

Edit the file shortcodes and ownership in the template. Replace the examples with your actual files:

```markdown
## File Shortcodes
AU = src/auth/auth.service.ts
UR = src/users/users.routes.ts
DB = prisma/schema.prisma
CF = src/config.ts
AP = src/app.ts
MI = src/middleware/

## File Ownership
Coder:  +lockAU,AP
Bugfix: +lockUR,DB,CF
QA:     READ-ONLY (no locks)
```

**Tips for shortcodes**:
- Use 2-3 uppercase letters
- Pick codes that are mnemonically obvious (`AU` for auth, `DB` for database)
- Only define shortcodes for files agents will reference frequently
- You don't need to shortcode every file — only the ones in scope

## Step 4: Ask Claude to Create a Team

Just describe what you need in natural language. Claude handles team creation, task assignment, and coordination:

```
Create an agent team to fix the authentication bugs and add rate limiting.
Spawn a coder for the rate limiter, QA to audit the auth module, and a
bugfix agent for the auth bugs. Use delegate mode.
```

**Key phrases that help**:
- `"Use delegate mode"` — prevents the lead from coding, keeps it focused on coordination
- `"Require plan approval"` — teammates must get their plan approved before implementing
- `"Use Sonnet for each teammate"` — pick cheaper models for teammates to save tokens

## Step 5: Watch the Protocol in Action

Once spawned, agents announce using the protocol and communicate in compressed format:

```
# Agents spawn and announce
coder  -> lead: alpha PROTO:v2.0 @coder ready +lockRL,MI
qa     -> lead: alpha PROTO:v2.0 @qa ready (READ-ONLY)
bugfix -> lead: alpha PROTO:v2.0 @bugfix ready +lockAU,UR,CF

# QA delivers structured batch report
qa -> lead:
  epsilonBATCH 8items:
  P0:1 [AU!session fixation L88]
  P1:3 [AU!weak hash L42, UR!no rate limit L15, CF!secret default L7]
  P2:4 [...]
  omega T2 complete. DONE.

# Lead routes with @agent shorthand
@bugfix [P0:AU L88, P1:AU L42, P1:CF L7]
@coder [P1:UR L15 — integrate with rate limiter]

# Agents complete and release locks
coder  -> lead: deltaT1 RL+MI +rate-limiter -lockRL,MI. tsc clean. omega DONE.
bugfix -> lead: deltaT3 AU+CF 4 bugs fixed. -lockAU,UR,CF. omega DONE.
```

## Display Modes

You can watch your team in two ways:

### In-Process (Default)

All teammates run in your terminal. Navigate with keyboard:
- **Shift+Up/Down** — select a teammate
- **Enter** — view their session
- **Escape** — interrupt their current turn
- **Ctrl+T** — toggle the task list

### Split Panes

Each teammate gets its own terminal pane. Requires tmux or iTerm2:

```bash
# Start Claude in tmux mode
claude --teammate-mode tmux
```

Or set permanently:

```json
// ~/.claude/settings.json
{
  "teammateMode": "tmux"
}
```

## Interacting with the Team

### Message a Teammate Directly

In in-process mode, use Shift+Up/Down to select, then type your message. You can give additional instructions, redirect their approach, or ask questions.

### Check Progress

Agents proactively report progress with `beta%` indicators:

```
beta25 AU ~session handling      # just started
beta75 AU +token rotation        # almost done
```

If they don't, ask the lead: `"What's the status of each teammate?"`

### Handle Blockers

If a teammate is stuck:

```
# Agent signals it's blocked
bugfix -> lead: gammaT3 <<T2 waiting for QA report

# You can tell the lead to reassign or unblock
"Tell bugfix to start on the P2 items while waiting for QA"
```

### Shut Down

When done, tell the lead:

```
Clean up the team
```

This shuts down all teammates and removes team resources. Always shut down teammates first — cleanup fails if any are still running.

## Common Patterns

### Bug Fix Sprint (most common)

```
Create an agent team for a bug fix sprint:
- QA agent: audit the auth and payments modules (read-only)
- Bugfix agent: fix critical bugs from QA
- Coder agent: fix frontend bugs from QA
Use delegate mode. QA should deliver a single batch report.
```

### Code Review

```
Create an agent team to review PR #42:
- Security reviewer: check for vulnerabilities
- Quality reviewer: check correctness and tests
- Performance reviewer: check for bottlenecks
Have them challenge each other's findings.
```

### Parallel Feature Work

```
Create an agent team to build the notifications system:
- Backend agent: implement the notification service and routes
- Frontend agent: build the notification UI components
- QA agent: verify the integration when both are done
Frontend task depends on backend task.
```

## Troubleshooting

### Agents Not Using the Protocol

Make sure your `CLAUDE.md` includes an explicit instruction:

```markdown
All teammate messages MUST use the AgentSpeak v2 protocol defined in TEAM_PROTOCOL.md.
```

The word **MUST** matters — it makes compliance non-optional.

### Too Many Permission Prompts

Pre-approve common operations in your [permission settings](https://code.claude.com/docs/en/permissions) before spawning. Every teammate inherits the lead's permissions.

### Lead Starts Coding Instead of Coordinating

Use delegate mode:

```
Switch to delegate mode — only coordinate, don't implement.
```

Or press **Shift+Tab** to cycle into delegate mode.

### Agents Editing the Same File

This means file ownership wasn't set up properly. Check that:
1. Your template has `+lock` assignments for each agent
2. No two agents have `+lock` on the same file
3. Sequential access uses `<<T` dependencies with lock transfers

### Agent Stops After an Error

Check their output (Shift+Up/Down in in-process mode), then either:
- Give them new instructions directly
- Tell the lead: `"Spawn a replacement for the bugfix agent"`

## Next Steps

- [**Full Protocol Spec**](../TEAM_PROTOCOL.md) — all symbols, formats, and rules
- [**Team Patterns**](./team-patterns.md) — proven team compositions and role definitions
- [**Token Optimization**](./token-optimization.md) — advanced strategies for minimizing cost
- [**Task Decomposition**](./task-decomposition.md) — how to split work for parallel agents
- [**Real-World Example**](./example-session.md) — annotated transcript from a 4-agent sprint
