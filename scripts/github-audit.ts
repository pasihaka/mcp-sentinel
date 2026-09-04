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

  console.log('\n📌 GitHub README Badge Embed:');
  console.log(`[![MCP Status](https://img.mcpsentinel.dev/badge/demo/status.svg)](https://mcpsentinel.dev)`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
