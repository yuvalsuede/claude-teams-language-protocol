# Token Optimization Strategies

Beyond the AgentSpeak protocol, here are strategies to minimize token usage in agent teams. Designed for Claude Code's native [Agent Teams](https://code.claude.com/docs/en/agent-teams) system.

## 1. Protocol-Level Savings

### Use the Compressed Format

| Verbose | AgentSpeak v2 | Token Savings |
|---------|------------|---------------|
| "I've finished fixing the auth bypass vulnerability in content.routes.ts" | `deltaT3 CR +adminOnly` | ~70% |
| "Found a critical bug: the save endpoint doesn't check profile ownership" | `!!epsilonP0 CR !no ownership on save L86` | ~55% |
| "Starting work on the VideoFeed rewrite task" | `alphaT1 +lockVF rewrite` | ~75% |
| "Task 3 is done, which means tasks 5 and 7 can start now" | `deltaT3 >>T5,T7` | ~80% |
| "I can't start yet because I'm waiting for the coder to finish task 1" | `gammaT4 <<T1` | ~85% |

### Define Project-Specific Shortcodes

Longer file paths waste tokens every time they're referenced:

```
# Bad: 47 tokens per reference
backend/src/modules/content/content.routes.ts

# Good: 2 tokens per reference
CR (defined once in spawn prompt)
```

### Use QA Batch Format

Instead of reporting bugs one at a time (10+ messages):

```
# Bad: 10 separate messages with severity context repeated
epsilon P0 CR !auth bypass L140
epsilon P0 ER !no ownership L9
epsilon P1 VF !missing CSS L584
...

# Good: 1 structured batch message
epsilonBATCH 16items:
P0:3 [CR!auth L140, ER!ownership L9, CR!save L86]
P1:5 [VF!css L584, VF!log L260, CF!secret L26, ...]
P2:7 [...]
P3:1 [...]
```

Token savings: **~40% on QA reports** (the most token-heavy message type).

### Use Lead Routing Shorthand

Instead of verbose per-agent assignment messages:

```
# Bad: 3 long English messages (one per agent)
"Hey bugfix, the QA found 4 critical auth issues..."
"Hey coder, there are 3 VF issues from QA..."
"Hey ui-expert, there are some minor styling items..."

# Good: 3 compact @agent messages
@bugfix [P0:CR L140, P0:ER L9, P1:CF L26]
@coder [P1:VF L584, P2:VF L200, P2:VS L33]
@ui-expert [P3:GC L677]
```

### Use Dependency Notation

Eliminates "status check" messages between agents:

```
# Bad: 4 messages for a dependency resolution
ui-expert -> lead: "Is the coder done with VF yet?"
lead -> coder: "What's your status on VF?"
coder -> lead: "Yes, VF is done"
lead -> ui-expert: "VF is done, you can start"

# Good: 1 message with >> signal
coder -> lead: deltaT1 VF >>T4 -lockVF tsc clean.
```

Token savings: **~75% on dependency coordination** (3 round-trip messages eliminated).

## 2. Team Architecture Savings

### Make QA Read-Only

QA agents that can't edit files:
- Produce a single comprehensive `epsilonBATCH` report
- Shut down immediately after (`omega DONE`)
- Don't go back and forth with follow-up messages

**Token cost**: 1 large message vs. 10+ small messages = fewer message overhead tokens.

### Route Through Lead (Hub-and-Spoke)

Direct agent-to-agent messaging feels efficient but creates N^2 communication paths. Hub-and-spoke:
- Lead filters and routes only relevant findings using `@agent [items]`
- Prevents agents from processing irrelevant messages
- Reduces total messages by ~40%

### Shut Down Idle Agents

An idle agent still processes incoming messages. Shut down agents the moment their task is complete:

```
QA delivers epsilonBATCH -> omega DONE -> shutdown QA immediately
Bugfix finishes all fixes -> omega -lockCR,ER. DONE -> shutdown bugfix
Don't keep agents around "just in case"
```

Use the `TeammateIdle` hook to automate this:
```
omega @lead idle DONE  # TeammateIdle hook fires, lead decides to shut down
```

### Use Progress Indicators to Avoid Status Checks

Without progress indicators, the lead polls agents:
```
# Bad: 2 extra messages per agent
lead -> coder: "What's your progress?"
coder -> lead: "About halfway done"

# Good: proactive progress in status updates
beta50 VF ~scroll-snap refactoring
beta75 VF +IntersectionObserver
```

## 3. Prompt Engineering Savings

### Spawn Prompts: Front-Load Context

Give agents everything they need upfront. A good spawn prompt prevents 5+ follow-up messages:

```
# Bad spawn prompt (leads to many clarifying messages):
"Fix the bugs in the backend"

# Good spawn prompt (agent works autonomously):
"Fix these specific bugs in backend/:
1. CR L140: +adminOnly middleware
2. CF L26: rm SIGNING_SECRET default
3. hash.ts L13: ~SHA-256->bcrypt
File ownership: +lockCR,CF,AC,hash.ts
Don't touch VF (coder +lockVF).
Report using AgentSpeak v2 protocol. Task ID: T3."
```

### Use Task Descriptions, Not Chat

Put detailed requirements in TaskCreate descriptions, not in messages. Tasks are stored once; messages are processed by every agent that receives them.

### Avoid Broadcast

Broadcast sends the same message to N agents = N x message tokens. Use targeted `@agent` messages instead:

```
# Bad: broadcasts to all 4 agents (4x tokens)
broadcast: "QA report is in, check your relevant findings"

# Good: targeted @agent messages (1x tokens each, only to relevant agents)
@bugfix [P0:CR L140, P0:ER L9, P1:CF L26]
@coder [P1:VF L584, P2:VF L200]
```

### Use Priority Prefixes to Control Attention

Not all messages need the same urgency:

```
# Urgent: lead processes immediately
!!epsilonP0 CR !auth bypass L140

# Normal: standard processing
betaT3 AT ~8types match backend

# Low/FYI: lead can batch-process later
..deltaT3 GC -duplicate comments
```

## 4. Context Window Management

### Keep Agent Count Minimal

Each agent is a separate Claude instance with its own context window:
- 3 agents = 3x base context cost
- 5 agents = 5x base context cost
- Only spawn agents for genuinely parallel work

### Don't Duplicate Work

If QA already audited a file, don't have bugfix re-read it to "verify":

```
# Bad: bugfix re-reads all files QA already read
"Read all backend files and look for bugs"

# Good: bugfix acts on QA's specific findings from epsilonBATCH
@bugfix [P0:CR L140, P0:ER L9, P1:CF L26, P2:AC L85]
```

### Use Subagents for Quick Lookups

For simple, focused tasks (find a file, check a type), use subagents instead of team agents:
- Subagents: lower overhead, results summarized back
- Team agents: higher overhead, full independent context

Claude Code's docs specifically note: "Use subagents when you need quick, focused workers that report back."

## 5. File Locking Savings

File locks prevent the most expensive token scenario: merge conflict resolution.

```
# Without locks: conflict resolution costs 5-10 messages
coder -> lead: "I changed VF"
ui-expert -> lead: "I also changed VF"
lead -> both: "Conflict! Let me figure out..."
coder -> lead: "Here's what I changed..."
ui-expert -> lead: "Here's what I changed..."
lead -> ui-expert: "Rebase on coder's changes"
ui-expert -> lead: "Done, had to redo 3 things"

# With locks: 0 messages for conflict resolution
+lockVF at spawn -> no conflicts possible
```

## 6. Hook-Based Automation

Use Claude Code's hooks to reduce manual coordination messages:

### TaskCompleted Hook

```
# Instead of: agent -> lead -> agent verification chain
deltaT3 VF +scroll-snap HOOK:verify
# Hook runs tsc --noEmit automatically, reports back
```

### TeammateIdle Hook

```
# Instead of: lead polling idle agents
omega @lead idle ?nextT
# Hook auto-assigns next unblocked task
```

## 7. Measuring Token Usage

### Track Per-Agent Costs

After a team session, check usage:
- Which agent used the most tokens?
- Was QA's audit worth the token cost?
- Could any agent have been a subagent instead?
- How many messages were dependency checks (now eliminated by `>>` / `<<`)?

### v2 Protocol Savings Breakdown

| v2 Feature | Estimated Additional Savings | Mechanism |
|---|---|---|
| Task IDs (`T#`) | ~5% | Eliminates "which task?" clarifications |
| Dependencies (`>>` / `<<`) | ~15% | Eliminates status-check round trips |
| File locking (`+lock` / `-lock`) | ~10% | Prevents conflict resolution messages |
| QA batch format (`epsilonBATCH`) | ~10% | Single report vs. many small messages |
| Lead routing (`@agent []`) | ~8% | Compact assignment vs. verbose paragraphs |
| Progress indicators (`beta%`) | ~5% | Eliminates lead polling agents |
| Priority prefixes (`!!` / `..`) | ~3% | Reduces unnecessary processing |

**Combined estimated improvement over v1**: ~20-30% additional savings on top of the base 63% compression.

### Rule of Thumb

Agent teams are worth it when:
- Agents work on truly independent files
- The task takes 10+ minutes for a single agent
- Parallel exploration produces better results than sequential
- You use file locking and dependencies to avoid coordination overhead

Agent teams are NOT worth it when:
- Tasks are sequential (B depends on A with no parallel work)
- All changes are in 1-2 files
- The task is simple enough for one agent + subagents
