#!/usr/bin/env node
/**
 * Automated Public MCP Server Auditor for Outbound Developer Growth
 * 
 * Usage:
 *   npx tsx scripts/github-audit.ts https://remote-mcp-server.example.com
 */

import { executeSyntheticCheck } from '../src/core/synthetic-runner.js';
import { generateStatusBadge } from '../src/edge/badge-generator.js';

async function main() {
  const targetUrl = process.argv[2];

  if (!targetUrl) {
    console.error('Usage: npx tsx scripts/github-audit.ts <MCP_ENDPOINT_URL>');
    process.exit(1);
  }

  console.log(`\n🔍 Running synthetic MCP protocol & security audit on: ${targetUrl}...\n`);

  const result = await executeSyntheticCheck(targetUrl);

  console.log('='.repeat(60));
  console.log(`MCP Sentinel Audit Report: ${targetUrl}`);
  console.log('='.repeat(60));
  console.log(`Status:            ${result.status.toUpperCase()}`);
  console.log(`Latency:           ${result.latencyMs}ms`);
  console.log(`Protocol Version:  ${result.protocolVersion || 'N/A'}`);
  console.log(`Server Info:       ${result.serverInfo?.name || 'Unknown'} v${result.serverInfo?.version || '0.0.0'}`);
  console.log(`Tools Discovered:  ${result.toolsCount}`);
  console.log(`Schema Hash:       ${result.schemaHash || 'None'}`);

  if (result.errorMessage) {
    console.log(`\n❌ Error Encountered:\n${result.errorMessage}`);
  }

  if (result.secretFindings.length > 0) {
    console.log('\n🚨 Critical Security Findings:');
    for (const secret of result.secretFindings) {
      console.log(`  - [${secret.severity.toUpperCase()}] ${secret.description} at ${secret.location}`);
      console.log(`    Redacted snippet: ${secret.redactedSnippet}`);
    }
  } else {
    console.log('\n✅ Security Scan: No leaked credentials or private tokens detected.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📬 READY-TO-PASTE GITHUB ISSUE / PR PROPOSAL:');
  console.log('='.repeat(60));
  const serverName = result.serverInfo?.name || 'Remote MCP';
  const badgeUrl = `https://mcp-sentinel.pasihakamaki.workers.dev/badge/demo/status.svg`;
  const reportUrl = `https://mcp-sentinel.pasihakamaki.workers.dev/?url=${encodeURIComponent(targetUrl)}`;

  console.log(`
### Title:
Add live MCP Sentinel protocol health & schema verification badge to README

### Body:
Hi team! 👋

I ran an automated JSON-RPC 2.0 protocol and schema validation audit on your remote MCP endpoint (\`${targetUrl}\`) using **[MCP Sentinel](https://mcp-sentinel.pasihakamaki.workers.dev)**:

| Protocol Audit Metric | Result |
| :--- | :--- |
| **Status** | **${result.status.toUpperCase()}** |
| **Round-Trip Latency** | **${result.latencyMs}ms** |
| **Discovered Tools** | **${result.toolsCount} tools** |
| **Protocol Negotiation** | **${result.protocolVersion || 'Compatible'}** |
| **Credential & Secret Scan** | **${result.secretFindings.length === 0 ? 'Clean (0 Leaks)' : 'Findings Flagged'}** |

To give developers and AI agents connecting to this repository instant visibility into your server's live availability, you can embed this dynamic status badge in your README:

\`\`\`markdown
[![MCP Sentinel Protocol Status](${badgeUrl})](${reportUrl})
\`\`\`

Rendered preview:
[![MCP Sentinel Protocol Status](${badgeUrl})](${reportUrl})

You can inspect the full diagnostic report and test schema drift live here:
👉 **[View Live Audit & Interactive Debugger](${reportUrl})**

Cheers!
`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
