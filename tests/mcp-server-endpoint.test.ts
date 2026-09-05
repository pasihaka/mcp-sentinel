import { describe, it, expect } from 'vitest';
import { handleMcpHttpRequest, handleJsonRpcMessage } from '../src/edge/mcp-server-endpoint.js';

describe('MCP Server Protocol Endpoint (/mcp & /sse)', () => {
  const originUrl = 'https://mcp-sentinel.pasihakamaki.workers.dev';
  const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

  it('GET /mcp returns service metadata and supported tools in JSON format', async () => {
    const req = new Request(`${originUrl}/mcp`, { method: 'GET' });
    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');

    const data: any = await res.json();
    expect(data.name).toBe('mcp-sentinel');
    expect(data.protocol).toBe('mcp/2026-07-28');
    expect(data.supportedProtocols).toContain('2026-07-28');
    expect(data.supportedProtocols).toContain('2025-11-25');
    expect(data.supportedProtocols).toContain('2025-06-18');
    expect(data.supportedProtocols).toContain('2024-11-05');
    expect(Array.isArray(data.tools)).toBe(true);
    expect(data.tools.length).toBe(3);
    expect(data.tools.some((t: any) => t.name === 'audit_mcp_server')).toBe(true);
    expect(data.tools.some((t: any) => t.name === 'verify_mcp_protocol')).toBe(true);
    expect(data.tools.some((t: any) => t.name === 'get_monitor_badge')).toBe(true);
  });

  it('handles "server/discover" method (2026-07-28 stateless spec)', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 99,
        method: 'server/discover',
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.jsonrpc).toBe('2.0');
    expect(json.id).toBe(99);
    expect(json.result.protocolVersion).toBe('2026-07-28');
    expect(json.result.serverInfo.name).toBe('mcp-sentinel');
  });

  it('GET /sse with Accept text/event-stream returns SSE endpoint event', async () => {
    const req = new Request(`${originUrl}/sse`, {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
    });
    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    const text = await res.text();
    expect(text).toContain('event: endpoint');
    expect(text).toContain(`data: ${originUrl}/mcp`);
  });

  it('handles "initialize" JSON-RPC method', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'Cursor', version: '0.45.0' },
        },
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.jsonrpc).toBe('2.0');
    expect(json.id).toBe(1);
    expect(json.result.serverInfo.name).toBe('mcp-sentinel');
    expect(json.result.protocolVersion).toBe('2024-11-05');
    expect(json.result.capabilities.tools).toBeDefined();
  });

  it('negotiates 2025-11-25 when requested by modern 2025 client', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'Claude Desktop', version: '0.9.0' },
        },
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.jsonrpc).toBe('2.0');
    expect(json.id).toBe(2);
    expect(json.result.protocolVersion).toBe('2025-11-25');
  });

  it('handles "notifications/initialized" with 204 No Content', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    expect(res.status).toBe(204);
  });

  it('handles "ping" method', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'ping-123',
        method: 'ping',
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    const json: any = await res.json();
    expect(json.id).toBe('ping-123');
    expect(json.result).toEqual({});
  });

  it('handles "tools/list" method returning tool definitions', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    const json: any = await res.json();

    expect(json.result.tools).toBeDefined();
    expect(json.result.tools.length).toBeGreaterThanOrEqual(2);

    const auditTool = json.result.tools.find((t: any) => t.name === 'audit_mcp_server');
    expect(auditTool).toBeDefined();
    expect(auditTool.inputSchema.properties.endpointUrl).toBeDefined();
  });

  it('handles "tools/call" for get_monitor_badge', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_monitor_badge',
          arguments: { monitorId: 'srv_test_123' },
        },
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    const json: any = await res.json();

    expect(json.result.isError).toBe(false);
    expect(json.result.content[0].text).toContain('/badge/srv_test_123/status.svg');
  });

  it('handles "tools/call" for audit_mcp_server validation error when endpointUrl is missing', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'audit_mcp_server',
          arguments: {},
        },
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    const json: any = await res.json();

    expect(json.result.isError).toBe(true);
    expect(json.result.content[0].text).toContain('Missing or invalid required argument');
  });

  it('handles "tools/call" for verify_mcp_protocol with missing arguments', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'verify_mcp_protocol',
          arguments: {},
        },
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    const json: any = await res.json();

    expect(json.result.isError).toBe(true);
    expect(json.result.content[0].text).toContain('Missing or invalid required argument');
  });

  it('handles batch JSON-RPC requests', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { jsonrpc: '2.0', id: 10, method: 'ping' },
        { jsonrpc: '2.0', id: 11, method: 'tools/list' },
      ]),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    const json: any = await res.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
    expect(json[0].id).toBe(10);
    expect(json[1].id).toBe(11);
  });

  it('returns JSON-RPC error for unknown methods', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 99,
        method: 'non_existent_method',
      }),
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    const json: any = await res.json();

    expect(json.error).toBeDefined();
    expect(json.error.code).toBe(-32601);
  });

  it('returns 400 for malformed JSON body', async () => {
    const req = new Request(`${originUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not-valid-json }',
    });

    const res = await handleMcpHttpRequest(req, originUrl, corsHeaders);
    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.error.code).toBe(-32700);
  });
});
