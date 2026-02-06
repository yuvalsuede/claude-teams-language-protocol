# Token Optimization Strategies

Beyond the AgentSpeak protocol, here are strategies to minimize token usage in agent teams.

## 1. Protocol-Level Savings

### Use the Compressed Format

| Verbose | AgentSpeak | Token Savings |
|---------|------------|---------------|
| "I've finished fixing the auth bypass vulnerability in content.routes.ts" | `delta content.routes +adminOnly` | ~65% |
| "Found a critical bug: the save endpoint doesn't check profile ownership" | `epsilon P0 content.routes !no ownership check on save L86` | ~55% |
| "Starting work on the VideoFeed rewrite task" | `alpha VF rewrite` | ~70% |

### Define Project-Specific Shortcodes

Longer file paths waste tokens every time they're referenced:

```
# Bad: 47 tokens per reference
backend/src/modules/content/content.routes.ts

# Good: 2 tokens per reference
CR (defined once in spawn prompt)
```

## 2. Team Architecture Savings

### Make QA Read-Only

QA agents that can't edit files:
- Produce a single comprehensive report
- Shut down immediately after
- Don't go back and forth with follow-up messages

**Token cost**: 1 large message vs. 10+ small messages = fewer message overhead tokens.

### Route Through Lead (Hub-and-Spoke)

Direct agent-to-agent messaging feels efficient but creates N^2 communication paths. Hub-and-spoke:
- Lead filters and routes only relevant findings to each agent
- Prevents agents from processing irrelevant messages
- Reduces total messages by ~40%

### Shut Down Idle Agents

An idle agent still processes incoming messages. Shut down agents the moment their task is complete:

```
QA delivers report -> shutdown QA immediately
Bugfix finishes all fixes -> shutdown bugfix
Don't keep agents around "just in case"
```

## 3. Prompt Engineering Savings

### Spawn Prompts: Front-Load Context

Give agents everything they need upfront. A good spawn prompt prevents 5+ follow-up messages:

```
# Bad spawn prompt (leads to many clarifying messages):
"Fix the bugs in the backend"

# Good spawn prompt (agent works autonomously):
"Fix these specific bugs in backend/:
1. content.routes.ts L140: add adminOnly middleware
2. config/index.ts L26: remove SIGNING_SECRET default
3. hash.ts L13: migrate from SHA-256 to bcrypt
Don't touch VideoFeed.tsx (coder's domain).
Message team with progress using AgentSpeak protocol."
```

### Use Task Descriptions, Not Chat

Put detailed requirements in TaskCreate descriptions, not in messages. Tasks are stored once; messages are processed by every agent that receives them.

### Avoid Broadcast

Broadcast sends the same message to N agents = N x message tokens. Use targeted messages instead:

```
# Bad: broadcasts to all 4 agents (4x tokens)
broadcast: "QA report is in, check your relevant findings"

# Good: targeted messages (1x tokens each, only to relevant agents)
message bugfix: "QA found 4 auth bypasses, fix these..."
message coder: "QA flagged 3 VF issues for your rewrite..."
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

# Good: bugfix acts on QA's specific findings
"Fix these 11 bugs from QA report: [list]"
```

### Use Subagents for Quick Lookups

For simple, focused tasks (find a file, check a type), use subagents instead of team agents:
- Subagents: lower overhead, results summarized back
- Team agents: higher overhead, full independent context

## 5. Measuring Token Usage

### Track Per-Agent Costs

After a team session, check usage:
- Which agent used the most tokens?
- Was QA's audit worth the token cost?
- Could any agent have been a subagent instead?

### Rule of Thumb

Agent teams are worth it when:
- Agents work on truly independent files
- The task takes 10+ minutes for a single agent
- Parallel exploration produces better results than sequential

Agent teams are NOT worth it when:
- Tasks are sequential (B depends on A)
- All changes are in 1-2 files
- The task is simple enough for one agent + subagents
