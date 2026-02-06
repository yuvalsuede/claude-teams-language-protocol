#!/usr/bin/env node

/**
 * AgentSpeak Token Benchmark
 *
 * Compares real AgentSpeak messages vs verbose English equivalents
 * using tiktoken (cl100k_base) for token counting.
 *
 * Data source: Real messages from a 4-agent sprint session (Peekaz project, Feb 2026)
 */

import { readFileSync } from 'fs';
import { get_encoding } from 'tiktoken';

const encoder = get_encoding('cl100k_base');

function countTokens(text) {
  return encoder.encode(text).length;
}

// Load real messages
const data = JSON.parse(readFileSync(new URL('./real-messages.json', import.meta.url), 'utf-8'));

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║        AgentSpeak Protocol — Token Benchmark (Real Data)          ║');
console.log('║  Source: 4-agent sprint on Peekaz (Next.js + Fastify project)     ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log();

// Results storage
const results = [];
let totalAgentSpeak = 0;
let totalVerbose = 0;

// Header
console.log('┌────┬──────────────────────────┬───────────┬───────────┬──────────┬──────────┐');
console.log('│ #  │ Message Type             │ AgentSpk  │ Verbose   │ Savings  │ Ratio    │');
console.log('├────┼──────────────────────────┼───────────┼───────────┼──────────┼──────────┤');

for (const msg of data.messages) {
  const asTokens = countTokens(msg.agentspeak);
  const verboseTokens = countTokens(msg.verbose);
  const savings = ((1 - asTokens / verboseTokens) * 100).toFixed(1);
  const ratio = (verboseTokens / asTokens).toFixed(1);

  totalAgentSpeak += asTokens;
  totalVerbose += verboseTokens;

  results.push({
    id: msg.id,
    type: msg.type,
    agent: msg.agent,
    agentspeakTokens: asTokens,
    verboseTokens: verboseTokens,
    savings: parseFloat(savings),
    ratio: parseFloat(ratio),
  });

  const typeStr = msg.type.padEnd(24).slice(0, 24);
  const asStr = String(asTokens).padStart(7);
  const vbStr = String(verboseTokens).padStart(7);
  const svStr = (savings + '%').padStart(7);
  const rtStr = (ratio + 'x').padStart(7);

  console.log(`│ ${String(msg.id).padStart(2)} │ ${typeStr} │ ${asStr}   │ ${vbStr}   │ ${svStr}  │ ${rtStr}  │`);
}

console.log('├────┼──────────────────────────┼───────────┼───────────┼──────────┼──────────┤');

const totalSavings = ((1 - totalAgentSpeak / totalVerbose) * 100).toFixed(1);
const totalRatio = (totalVerbose / totalAgentSpeak).toFixed(1);

console.log(`│ ΣΣ │ ${'TOTAL (all messages)'.padEnd(24)} │ ${String(totalAgentSpeak).padStart(7)}   │ ${String(totalVerbose).padStart(7)}   │ ${(totalSavings + '%').padStart(7)}  │ ${(totalRatio + 'x').padStart(7)}  │`);
console.log('└────┴──────────────────────────┴───────────┴───────────┴──────────┴──────────┘');

console.log();
console.log('═══ SUMMARY ═══════════════════════════════════════════════════════════');
console.log();
console.log(`  Messages analyzed:     ${data.messages.length} (from real 4-agent session)`);
console.log(`  Total AgentSpeak:      ${totalAgentSpeak} tokens`);
console.log(`  Total Verbose:         ${totalVerbose} tokens`);
console.log(`  Tokens saved:          ${totalVerbose - totalAgentSpeak} tokens (${totalSavings}%)`);
console.log(`  Compression ratio:     ${totalRatio}x`);
console.log();

// Per-type breakdown
const typeGroups = {};
for (const r of results) {
  const group = r.type.replace(/_coder|_ui/, '');
  if (!typeGroups[group]) typeGroups[group] = { as: 0, vb: 0, count: 0 };
  typeGroups[group].as += r.agentspeakTokens;
  typeGroups[group].vb += r.verboseTokens;
  typeGroups[group].count += 1;
}

console.log('═══ BY MESSAGE TYPE ════════════════════════════════════════════════════');
console.log();

for (const [type, data] of Object.entries(typeGroups)) {
  const pct = ((1 - data.as / data.vb) * 100).toFixed(1);
  console.log(`  ${type.padEnd(22)} ${pct}% savings  (${data.as} vs ${data.vb} tokens, ${data.count} msg${data.count > 1 ? 's' : ''})`);
}

console.log();

// Cost estimation — Claude Opus 4.6 pricing (Feb 2026)
// Each agent message is OUTPUT for the sender + INPUT for the receiver
const inputPricePer1M = 5.0;   // $/1M input tokens
const outputPricePer1M = 25.0; // $/1M output tokens

const saved = totalVerbose - totalAgentSpeak;

function costStr(tokens, pricePerM) {
  return (tokens / 1_000_000 * pricePerM).toFixed(4);
}

console.log('═══ COST ESTIMATE (Claude Opus 4.6 pricing) ══════════════════════════');
console.log();
console.log('  Each message = output (sender) + input (receiver)');
console.log();
console.log(`  As INPUT  ($5/MTok):   $${costStr(saved, inputPricePer1M)} saved/session`);
console.log(`  As OUTPUT ($25/MTok):  $${costStr(saved, outputPricePer1M)} saved/session`);
console.log(`  Combined:              $${costStr(saved, inputPricePer1M + outputPricePer1M)} saved/session`);
console.log();
console.log(`  At 100 sessions/day:`);
console.log(`    Input savings:   $${((saved * 100) / 1_000_000 * inputPricePer1M).toFixed(2)}/day`);
console.log(`    Output savings:  $${((saved * 100) / 1_000_000 * outputPricePer1M).toFixed(2)}/day`);
console.log(`    Combined:        $${((saved * 100) / 1_000_000 * (inputPricePer1M + outputPricePer1M)).toFixed(2)}/day`);
console.log();
console.log(`  At 3,000 sessions/mo:`);
console.log(`    Input savings:   $${((saved * 3000) / 1_000_000 * inputPricePer1M).toFixed(2)}/mo`);
console.log(`    Output savings:  $${((saved * 3000) / 1_000_000 * outputPricePer1M).toFixed(2)}/mo`);
console.log(`    Combined:        $${((saved * 3000) / 1_000_000 * (inputPricePer1M + outputPricePer1M)).toFixed(2)}/mo`);
console.log();

// Per-agent breakdown
const agentGroups = {};
for (const r of results) {
  if (!agentGroups[r.agent]) agentGroups[r.agent] = { as: 0, vb: 0, count: 0 };
  agentGroups[r.agent].as += r.agentspeakTokens;
  agentGroups[r.agent].vb += r.verboseTokens;
  agentGroups[r.agent].count += 1;
}

console.log('═══ BY AGENT ══════════════════════════════════════════════════════════');
console.log();

for (const [agent, data] of Object.entries(agentGroups)) {
  const pct = ((1 - data.as / data.vb) * 100).toFixed(1);
  console.log(`  ${agent.padEnd(12)} ${pct}% savings  (${data.as} vs ${data.vb} tokens, ${data.count} msgs)`);
}

console.log();
console.log('══════════════════════════════════════════════════════════════════════');
console.log('  Benchmark complete. Data source: real session transcript.');
console.log('══════════════════════════════════════════════════════════════════════');

encoder.free();
