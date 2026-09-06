import { describe, it, expect, vi } from 'vitest';
import { executeSyntheticCheck } from '../src/core/synthetic-runner.js';
import { validateToolSchema, validateAllTools } from '../src/core/schema-validator.js';
import type { MCPTool } from '../src/core/types.js';

describe('Schema & Protocol Diagnostics Engine', () => {
  it('validates tool schema and flags missing properties in required[]', () => {
    const invalidTool: MCPTool = {
      name: 'test_broken_tool',
      description: 'A tool with missing required property definition',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' }
        },
        required: ['path', 'missing_param']
      }
    };

    const res = validateToolSchema(invalidTool);
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0]).toContain('required field "missing_param" is not declared in properties');
  });

  it('validates tool schema and flags invalid tool names', () => {
    const invalidTool: MCPTool = {
      name: 'invalid tool name with spaces!',
      description: 'A tool with spaces in its name',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    };

    const res = validateToolSchema(invalidTool);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('contains invalid characters'))).toBe(true);
  });

  it('validates all tools and returns tool-keyed errors', () => {
    const tools: MCPTool[] = [
      {
        name: 'valid_tool',
        description: 'Clean tool',
        inputSchema: { type: 'object', properties: { count: { type: 'number' } } }
      },
      {
        name: 'broken_tool',
        description: 'Tool missing inputSchema.type object',
        inputSchema: { type: 'string' as any }
      }
    ];

    const res = validateAllTools(tools);
    expect(res.isValid).toBe(false);
    expect(res.toolErrors['broken_tool']).toBeDefined();
    expect(res.toolErrors['broken_tool'][0]).toContain('inputSchema.type must be "object"');
  });

  it('synthetic check surfaces schema validation errors and remediation hint', async () => {
    // Mock global fetch to return a tool with schema defect
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      if (body.method === 'initialize') {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'diagnostics-test-server', version: '1.0.0' }
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (body.method === 'tools/list') {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          result: {
            tools: [
              {
                name: 'search_notes',
                description: 'Search personal notes',
                inputSchema: {
                  type: 'object',
                  properties: {},
                  required: ['query'] // query missing from properties!
                }
              }
            ]
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    });

    try {
      const result = await executeSyntheticCheck('https://mock-diagnostics.internal/mcp');
      expect(result.status).toBe('degraded');
      expect(result.protocolPhase).toBe('complete');
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors!.length).toBeGreaterThan(0);
      expect(result.validationErrors![0]).toContain('[search_notes]');
      expect(result.validationErrors![0]).toContain('required field "query" is not declared in properties');
      expect(result.remediationHint).toContain('Schema validation failed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('synthetic check translates JSON-RPC -32601 Method Not Found with remediation hint', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    try {
      const result = await executeSyntheticCheck('https://mock-rpc-error.internal/mcp');
      expect(result.status).toBe('down');
      expect(result.rpcErrorCode).toBe(-32601);
      expect(result.protocolPhase).toBe('initialize');
      expect(result.remediationHint).toContain('Method not found: Remote server router did not recognize');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('synthetic check translates 401 Unauthorized with auth hint', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response('Unauthorized: Bearer token required', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' }
      });
    });

    try {
      const result = await executeSyntheticCheck('https://mock-protected.internal/mcp');
      expect(result.status).toBe('down');
      expect(result.httpStatus).toBe(401);
      expect(result.remediationHint).toContain('Authentication required');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('verifies landing page includes ecosystem trust bar, diagnostic frame, and telemetry chart preview', async () => {
    const { LANDING_PAGE_HTML } = await import('../src/edge/landing-page.js');
    expect(LANDING_PAGE_HTML).toContain('ecosystem-trust-bar');
    expect(LANDING_PAGE_HTML).toContain('Claude Desktop');
    expect(LANDING_PAGE_HTML).toContain('Cursor &amp; Windsurf');
    expect(LANDING_PAGE_HTML).toContain('Smithery (100/100)');
    expect(LANDING_PAGE_HTML).toContain('diagnosticFrame');
    expect(LANDING_PAGE_HTML).toContain('Protocol Execution Pipeline');
    expect(LANDING_PAGE_HTML).toContain('diagRemediationBox');
    expect(LANDING_PAGE_HTML).toContain('diagSchemaErrorsBox');
    expect(LANDING_PAGE_HTML).toContain('telemetry-preview');
    expect(LANDING_PAGE_HTML).toContain('30-Day Latency Jitter &amp; Drift Timeline');
    expect(LANDING_PAGE_HTML).toContain('P50 Latency');
    expect(LANDING_PAGE_HTML).toContain('P99 Cold Starts');
  });
});
