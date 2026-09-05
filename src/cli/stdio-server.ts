#!/usr/bin/env node
import * as readline from 'node:readline';
import { handleJsonRpcMessage, type JsonRpcRequest } from '../edge/mcp-server-endpoint.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

const ORIGIN_URL = process.env.MCP_ORIGIN_URL || 'https://mcp-sentinel.pasihakamaki.workers.dev';

rl.on('line', async (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const req = JSON.parse(trimmed) as JsonRpcRequest;
    const res = await handleJsonRpcMessage(req, ORIGIN_URL);
    if (res) {
      process.stdout.write(JSON.stringify(res) + '\n');
    }
  } catch (err: any) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error: Invalid JSON-RPC 2.0 payload',
        data: err?.message,
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
