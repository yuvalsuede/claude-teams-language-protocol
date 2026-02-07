# Protocol Feedback Guide (theta)

How agents using AgentSpeak v2 can propose improvements to the protocol itself, based on real session experience.

## Overview

The `theta` status code enables agents to contribute protocol improvements back to the repo via GitHub PRs. Agents collect observations during their work, report them at shutdown, and the lead opens a single PR per session.

**Token budget**: ~300-500 tokens when feedback exists. Zero when there's nothing to report.

## When to Record Feedback

### During the Session (Mental Notes)

As you work, notice protocol friction points:
- Did you need a status code that doesn't exist?
- Did you find a shorter way to express something?
- Did another agent misparse your message?
- Did you discover a communication pattern not in the docs?
- Did you need a feature the protocol lacks?

These are mental notes — no tokens spent until `omega`.

### At Shutdown (omega Phase)

Append your theta items to your `omega` message:

```
omega -lockCR,ER. DONE. theta:2 [missing:delta:partial, compress:>>range]
```

Cost: ~15-20 extra tokens per agent. Only include if you have observations.

### Mid-Session (Blocking Issues Only)

If a protocol ambiguity actively blocks communication, flag it inline:

```
theta:bug gamma vs epsilon ambiguous — blocked BY a bug, which code?
```

The lead decides whether to address it now or defer:

```
theta->omega    # "Note it, we'll PR at shutdown"
theta:ack       # "Acknowledged, I'll include it"
```

## Feedback Categories

| Tag | Category | When to Use |
|-----|----------|-------------|
| `theta:shortcode` | New shortcode or status code | You used something 3+ times that isn't in the defaults |
| `theta:compress` | Compression improvement | You found a shorter way to express a common message |
| `theta:pattern` | New communication pattern | You discovered an interaction pattern not documented |
| `theta:bug` | Protocol bug or ambiguity | Two agents parsed a message differently, or a rule is contradictory |
| `theta:missing` | Feature gap | You needed to express something the protocol can't handle |

## Examples

### Good Theta Observations (Keep)

```
theta:compress >>T4-6 shorter than >>T4,T5,T6 for consecutive ranges. Used 3x this session.
theta:missing need delta:partial for "P0 fixed, P1 deferred". Workaround cost 4 extra messages.
theta:pattern handoff: agentA -lockVF @agentB "VF yours, snap done" — not in docs.
theta:bug gamma vs epsilon ambiguous when blocked BY a bug. 2/4 agents parsed differently.
theta:shortcode TST=test-file shortcode used 5x. Consider adding to default set.
```

Why these are good:
- Universal (any project could benefit)
- Evidence-backed (frequency, token cost, multiple agents affected)
- Specific (exact syntax proposed, exact ambiguity described)

### Bad Theta Observations (Drop)

```
theta:shortcode need PZ=prisma-schema for our project          # Project-specific
theta:missing "it would be nice to have colors in messages"     # Vague, no evidence
theta:compress "maybe shorter status codes?"                    # No concrete proposal
theta:pattern "I like using emojis"                             # Not a pattern, personal preference
```

Why these are bad:
- Project-specific file references
- No evidence or frequency data
- Vague suggestions without concrete alternatives
- Personal preferences, not universal improvements

## Lead Collection Flow

The lead agent manages the entire feedback pipeline:

### 1. Collect

As each teammate sends their `omega` message, extract theta items:

```
bugfix -> lead: omega -lockCR,ER,CF. DONE. theta:1 [missing:delta:partial]
qa -> lead:     omega T2 complete. DONE. theta:1 [bug:gamma-vs-epsilon]
coder -> lead:  omega -lockVF. DONE.                          # no theta
ui -> lead:     omega -lockGC,VS. DONE. theta:1 [compress:>>range]
```

### 2. Deduplicate

If multiple agents report the same issue, merge into one item with stronger evidence:

```
# Before: 2 separate items
theta:missing delta:partial (bugfix)
theta:missing delta:partial (coder)

# After: 1 merged item
theta:missing delta:partial — reported by 2/4 agents independently
```

### 3. Filter (Universality Test)

Drop project-specific items. Keep universal improvements.

**Test**: Would this help a completely different project using the protocol?
- Yes = keep (e.g., "no way to express partial completion")
- No = drop (e.g., "needed shortcode for our Prisma schema")

### 4. Open PR (if valid items remain)

Proceed to the PR workflow below.

## PR Workflow

### Prerequisites

The lead needs:
- `gh` CLI installed and authenticated (`gh auth status`)
- Network access to GitHub

If either is missing, report theta items inline to the user instead:

```
omega DONE. theta:2 items (gh unavailable, reporting inline):
  1. theta:missing delta:partial for split-severity fixes
  2. theta:compress >>T4-6 range notation
```

### Step 1: Clone the Protocol Repo

```bash
# Clone to temp directory
gh repo clone yuvalsuede/claude-teams-language-protocol /tmp/agentspeak-theta-XXXXX
cd /tmp/agentspeak-theta-XXXXX
```

If you don't have push access (most likely), fork first:

```bash
gh repo fork yuvalsuede/claude-teams-language-protocol --clone=true -- /tmp/agentspeak-theta-XXXXX
cd /tmp/agentspeak-theta-XXXXX
```

### Step 2: Create a Branch

Branch naming convention: `theta/<date>-<category>-<short-slug>`

```bash
# Single-category PR
git checkout -b theta/2026-02-07-missing-partial-completion

# Multi-category PR
git checkout -b theta/2026-02-07-multi-improvements
```

### Step 3: Make Changes

Edit the relevant files in the cloned repo:

| What Changed | File to Edit |
|-------------|-------------|
| New status code or action symbol | `TEAM_PROTOCOL.md` |
| New message format or shorthand | `TEAM_PROTOCOL.md` |
| New communication pattern | `docs/team-patterns.md` |
| Protocol ambiguity fix | `TEAM_PROTOCOL.md` (clarify the ambiguous section) |
| Template update needed | `templates/CLAUDE_TEAM.md` |

### Step 4: Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
theta: [category] [short description]

Evidence: [how discovered, frequency, token cost of workaround]
Session: [N agents, project type]
Reported by: [which agent roles noticed this]

Co-Authored-By: Claude Agent <noreply@anthropic.com>
EOF
)"
```

### Step 5: Push and Open PR

```bash
git push -u origin theta/2026-02-07-missing-partial-completion

gh pr create \
  --repo yuvalsuede/claude-teams-language-protocol \
  --title "theta: [short description]" \
  --body-file /tmp/agentspeak-theta-XXXXX/PR_BODY.md
```

Use the [PR template](../templates/THETA_PR_TEMPLATE.md) for the body. Write it to a temp file, then reference with `--body-file`.

### Step 6: Report Back

```
omega team cleanup. theta PR opened: github.com/yuvalsuede/claude-teams-language-protocol/pull/N
```

## Token Budget

The entire theta mechanism is designed to be lightweight:

| Component | Token Cost | When |
|-----------|-----------|------|
| theta line in omega message | ~15-20 per agent | Only when agent has observations |
| Lead collection/filtering | ~50-100 | Only when any agent reported theta |
| PR creation (git+gh commands) | ~200-300 | Only when valid items remain after filtering |
| **Total per session** | **~300-500** | **Only when feedback exists** |
| **Zero-feedback sessions** | **0** | **Most sessions** |

Compare: the protocol saves ~3,000 tokens per session. The feedback mechanism costs 10-15% of one session's savings at worst.

## Conflict Prevention

Multiple agent teams running concurrently might notice similar issues:

1. **Branch naming includes date + slug** — different sessions get different branches
2. **PR deduplication is human-side** — the maintainer reviews and merges the best PR
3. **Evidence in PR body** — maintainer can compare which PR has stronger evidence
4. **No auto-merge** — theta PRs always require human review

## Checklist for Agents

Before including a theta observation in your omega message:

- [ ] Is this universal (useful for any project) or project-specific?
- [ ] Do I have concrete evidence (frequency, token cost, multiple agents affected)?
- [ ] Is my proposed change specific (not vague)?
- [ ] Would this save more tokens than it costs to learn?
- [ ] Is it backward compatible with existing v2 messages?

## Example Full Session with Theta

```
# === Normal work session ===

coder -> lead:   alpha PROTO:v2.0 @coder ready +lockVF,VS
qa -> lead:      alpha PROTO:v2.0 @qa ready (READ-ONLY)
bugfix -> lead:  alpha PROTO:v2.0 @bugfix ready +lockCR,ER,CF

# ... work happens ...

qa -> lead:      epsilonBATCH 12items: P0:2 [...] P1:4 [...] P2:5 [...] P3:1 [...]
                 omega T2 complete. DONE. theta:1 [bug:gamma-vs-epsilon ambiguous for bug-blocked]

bugfix -> lead:  deltaT3 all P0+P1 bugs fixed. P2 items deferred.
                 omega -lockCR,ER,CF. DONE. theta:1 [missing:delta:partial for split-severity]

coder -> lead:   deltaT1 VF+VS rewrite done. -lockVF,VS. tsc clean.
                 omega DONE.

# === Lead collects theta ===

# theta items:
#   1. qa: bug — gamma vs epsilon ambiguous for "blocked by a bug"
#   2. bugfix: missing — delta:partial for partial fix
#   3. coder: (none)
#
# Filter: both are universal. Keep both.
# Deduplicate: no overlap. 2 unique items.

# === Lead opens PR ===

# Branch: theta/2026-02-07-multi-improvements
# Edits TEAM_PROTOCOL.md:
#   - Adds clarification to gamma vs epsilon usage
#   - Proposes delta:partial as new status modifier
# Opens PR via gh

lead: omega team cleanup. theta PR: github.com/.../pull/42
```

## Next Steps

- [Full Protocol Spec](../TEAM_PROTOCOL.md) — see the theta section in context
- [PR Template](../templates/THETA_PR_TEMPLATE.md) — structured body for theta PRs
- [Team Patterns](./team-patterns.md) — how theta fits into team workflows
