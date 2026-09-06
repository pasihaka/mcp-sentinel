import { describe, it, expect } from 'vitest';
import { renderStatusPage } from '../src/edge/status-page.js';
import { renderNotFoundPage } from '../src/edge/not-found-page.js';
import { generateSessionToken } from '../src/auth/magic-link.js';
import worker from '../src/edge/worker.js';

describe('Public Hosted Status Page', () => {
  const originUrl = 'https://mcp-sentinel.pasihakamaki.workers.dev';

  it('renders operational demo status page with 60 bars and tools', () => {
    const html = renderStatusPage(
      {
        id: 'demo',
        name: 'GitHub & Filesystem MCP Service',
        endpoint_url: 'https://demo-mcp-cluster.internal/mcp',
        status: 'operational',
      },
      [],
      null,
      originUrl
    );

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('GitHub &amp; Filesystem MCP Service');
    expect(html).toContain('All Systems Operational');
    expect(html).toContain('OPERATIONAL');
    expect(html).toContain('60 checks ago');
    expect(html).toContain('read_file');
    expect(html).toContain('write_file');
    expect(html).toContain('Copy Markdown');
    expect(html).toContain('https://mcp-sentinel.pasihakamaki.workers.dev/status/demo');
    expect(html).toContain('Start Free Monitoring');
  });

  it('renders degraded status page with accurate error context', () => {
    const html = renderStatusPage(
      {
        id: 'srv-degraded',
        name: 'Weather MCP Server',
        endpoint_url: 'https://api.weather-mcp.org/sse',
        status: 'degraded',
        check_interval_seconds: 60,
        last_latency_ms: 1250,
      },
      [
        {
          id: 'log-1',
          timestamp: Date.now() - 10000,
          status: 'degraded',
          http_status: 200,
          latency_ms: 1250,
          tools_count: 3,
          error_message: 'Slow response: Handshake took 1250ms',
        },
      ],
      null,
      originUrl
    );

    expect(html).toContain('Weather MCP Server');
    expect(html).toContain('Degraded Performance');
    expect(html).toContain('DEGRADED');
    expect(html).toContain('Slow response: Handshake took 1250ms');
    expect(html).toContain('1250ms');
  });

  it('renders outage status page when server is down', () => {
    const html = renderStatusPage(
      {
        id: 'srv-down',
        name: 'Database Agent MCP',
        endpoint_url: 'https://db-agent.internal/mcp',
        status: 'down',
        check_interval_seconds: 120,
        last_latency_ms: 0,
      },
      [
        {
          id: 'log-down',
          timestamp: Date.now() - 5000,
          status: 'down',
          http_status: 502,
          latency_ms: 0,
          tools_count: 0,
          error_message: '502 Bad Gateway: Connection refused by upstream MCP host',
        },
      ],
      null,
      originUrl
    );

    expect(html).toContain('Database Agent MCP');
    expect(html).toContain('Service Outage');
    expect(html).toContain('OUTAGE');
    expect(html).toContain('502 Bad Gateway');
  });

  it('sanitizes sensitive query params or tokens in endpoint URL', () => {
    const html = renderStatusPage(
      {
        id: 'srv-secure',
        name: 'Private Analytics MCP',
        endpoint_url: 'https://user:supersecretpass@api.analytics.corp/mcp?apiKey=secret-token-12345#debug',
        status: 'operational',
      },
      [],
      null,
      originUrl
    );

    expect(html).not.toContain('supersecretpass');
    expect(html).not.toContain('secret-token-12345');
    expect(html).toContain('https://api.analytics.corp/mcp');
  });

  it('escapes HTML to prevent XSS in server names or tool descriptions', () => {
    const html = renderStatusPage(
      {
        id: 'srv-xss',
        name: '<script>alert("xss")</script>',
        endpoint_url: 'https://malicious.org/mcp',
        status: 'operational',
      },
      [],
      {
        raw_tools_json: JSON.stringify([
          {
            name: '<img src=x onerror=alert(1)>',
            description: '<b onmouseover=alert("xss")>Dangerous</b>',
          },
        ]),
      },
      originUrl
    );

    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('renders 404 page for nonexistent monitor', () => {
    const html = renderNotFoundPage(originUrl, 'nonexistent-uuid-999');
    expect(html).toContain('404 · NOT FOUND');
    expect(html).toContain('Monitor Not Found');
    expect(html).toContain('nonexistent-uuid-999');
    expect(html).toContain(originUrl);
  });
});

describe('Worker Status Page HTTP Routes', () => {
  const env: any = {};
  const ctx: any = { waitUntil: () => {} };

  it('serves demo status page at GET /status/demo', async () => {
    const req = new Request('https://mcp-sentinel.pasihakamaki.workers.dev/status/demo');
    const res = await worker.fetch(req, env, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const text = await res.text();
    expect(text).toContain('GitHub &amp; Filesystem MCP Service');
    expect(text).toContain('All Systems Operational');
  });

  it('serves 404 for unknown monitor at GET /status/unknown-123', async () => {
    const req = new Request('https://mcp-sentinel.pasihakamaki.workers.dev/status/unknown-123');
    const res = await worker.fetch(req, env, ctx);

    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const text = await res.text();
    expect(text).toContain('Monitor Not Found');
    expect(text).toContain('unknown-123');
  });

  it('serves monitor status page with D1 database binding', async () => {
    const mockMonitor = {
      id: 'mon-prod-001',
      name: 'Production Slack MCP',
      endpoint_url: 'https://slack-mcp.internal/mcp',
      check_interval_seconds: 60,
      status: 'operational',
      last_checked_at: Date.now() - 15000,
      last_latency_ms: 29,
      created_at: Date.now() - 86400000,
    };

    const mockLogs = [
      {
        id: 'log-1',
        monitor_id: 'mon-prod-001',
        timestamp: Date.now() - 15000,
        status: 'operational',
        http_status: 200,
        latency_ms: 29,
        tools_count: 2,
        schema_hash: 'hash-abc',
        error_message: null,
      },
    ];

    const mockSnapshot = {
      raw_tools_json: JSON.stringify([
        { name: 'send_message', description: 'Post message to channel' },
        { name: 'read_channel', description: 'Fetch conversation history' },
      ]),
      schema_hash: 'hash-abc',
      created_at: Date.now() - 3600000,
    };

    const mockEnv: any = {
      DB: {
        prepare: (query: string) => ({
          bind: (...args: any[]) => ({
            first: async () => {
              if (query.includes('FROM monitors')) return mockMonitor;
              if (query.includes('FROM schema_snapshots')) return mockSnapshot;
              return null;
            },
            all: async () => {
              if (query.includes('FROM check_logs')) return { results: mockLogs };
              return { results: [] };
            },
          }),
        }),
      },
    };

    const req = new Request('https://mcp-sentinel.pasihakamaki.workers.dev/status/mon-prod-001');
    const res = await worker.fetch(req, mockEnv, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const text = await res.text();
    expect(text).toContain('Production Slack MCP');
    expect(text).toContain('send_message');
    expect(text).toContain('read_channel');
    expect(text).toContain('https://mcp-sentinel.pasihakamaki.workers.dev/status/mon-prod-001');
  });

  it('redirects to /status/demo if GET /status called without url parameter', async () => {
    const req = new Request('https://mcp-sentinel.pasihakamaki.workers.dev/status');
    const res = await worker.fetch(req, env, ctx);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toContain('/status/demo');
  });

  it('redirects to existing monitor page when URL is already registered in D1', async () => {
    const mockEnv: any = {
      DB: {
        prepare: (query: string) => ({
          bind: (...args: any[]) => ({
            first: async () => {
              if (query.includes('FROM monitors WHERE endpoint_url')) {
                return { id: 'mon-existing-789' };
              }
              return null;
            },
          }),
        }),
      },
    };

    const req = new Request('https://mcp-sentinel.pasihakamaki.workers.dev/status?url=https://slack-mcp.internal/mcp');
    const res = await worker.fetch(req, mockEnv, ctx);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toContain('/status/mon-existing-789');
  });

  it('handles loop protection for self-auditing at GET /status?url=.../mcp', async () => {
    const req = new Request('https://mcp-sentinel.pasihakamaki.workers.dev/status?url=https://mcp-sentinel.pasihakamaki.workers.dev/mcp');
    const res = await worker.fetch(req, env, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const text = await res.text();
    expect(text).toContain('MCP Sentinel (Hosted Remote Server)');
    expect(text).toContain('All Systems Operational');
    expect(text).toContain('audit_mcp_server');
    expect(text).toContain('verify_mcp_protocol');
    expect(text).toContain('get_monitor_badge');
  });
});

describe('Worker Security & Edge Resilience', () => {
  const originUrl = 'https://mcp-sentinel.pasihakamaki.workers.dev';
  const testSecret = 'test-secret-at-least-32-chars-long!';
  const ctx: any = { waitUntil: () => {} };

  const mockMonitors = [
    {
      id: 'mon_sensitive_1',
      name: 'Private Jira MCP',
      user_id: 'u_test_123',
      endpoint_url: 'https://jira.internal/mcp',
      auth_header: 'Bearer secret_jira_api_token_abc999',
      is_active: 1,
    },
  ];

  const mockEnv: any = {
    AUTH_SECRET: testSecret,
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          all: async () => ({ results: mockMonitors }),
          first: async () => mockMonitors[0],
        }),
      }),
    },
  };

  it('serves branded 404 HTML page when browser requests unknown route', async () => {
    const req = new Request(`${originUrl}/some-nonexistent-page`, {
      method: 'GET',
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });
    const res = await worker.fetch(req, {}, ctx);

    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const text = await res.text();
    expect(text).toContain('Page Not Found');
    expect(text).toContain('/some-nonexistent-page');
    expect(text).toContain('Return to MCP Sentinel');
  });

  it('serves JSON 404 when API client requests unknown route', async () => {
    const req = new Request(`${originUrl}/api/nonexistent-endpoint`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const res = await worker.fetch(req, {}, ctx);

    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    const body: any = await res.json();
    expect(body.error).toBe('Not found');
  });

  it('redacts sensitive auth_header credentials on GET /api/monitors and GET /api/monitors/:id', async () => {
    const token = await generateSessionToken(
      { userId: 'u_test_123', email: 'audit@example.com', tier: 'pro' },
      testSecret
    );

    // Test GET /api/monitors
    const listReq = new Request(`${originUrl}/api/monitors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listRes = await worker.fetch(listReq, mockEnv, ctx);
    expect(listRes.status).toBe(200);
    const listBody: any = await listRes.json();
    expect(listBody.monitors[0].auth_header).toBe('••••••••');
    expect(listBody.monitors[0].auth_header).not.toContain('secret_jira_api_token');

    // Test GET /api/monitors/:id
    const detailReq = new Request(`${originUrl}/api/monitors/mon_sensitive_1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const detailRes = await worker.fetch(detailReq, mockEnv, ctx);
    expect(detailRes.status).toBe(200);
    const detailBody: any = await detailRes.json();
    expect(detailBody.monitor.auth_header).toBe('••••••••');
    expect(detailBody.monitor.auth_header).not.toContain('secret_jira_api_token');
  });

  it('safely handles empty or malformed JSON payloads without 500 crashes', async () => {
    // 1. /api/check-now with malformed body
    const checkReq = new Request(`${originUrl}/api/check-now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this-is-not-valid-json{{{',
    });
    const checkRes = await worker.fetch(checkReq, {}, ctx);
    expect(checkRes.status).toBe(400);
    const checkBody: any = await checkRes.json();
    expect(checkBody.error).toBe('Missing or invalid "endpointUrl" parameter.');

    // 2. /api/auth/magic-link with malformed body
    const authReq = new Request(`${originUrl}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    });
    const authRes = await worker.fetch(authReq, {}, ctx);
    expect(authRes.status).toBe(400);
    const authBody: any = await authRes.json();
    expect(authBody.error).toContain('Please provide a valid email address.');

    // 3. /api/monitors with empty/malformed body
    const monReq = new Request(`${originUrl}/api/monitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ broken json',
    });
    const monRes = await worker.fetch(monReq, mockEnv, ctx);
    expect(monRes.status).toBe(400);
    const monBody: any = await monRes.json();
    expect(monBody.error).toContain('Missing required "endpointUrl" or "name".');
  });
});
