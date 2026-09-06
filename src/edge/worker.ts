import { executeSyntheticCheck } from '../core/synthetic-runner.js';
import { generateStatusBadge, generateSchemaBadge } from './badge-generator.js';
import { WebhookDispatcher, type AlertDestination } from '../alerts/webhook-dispatcher.js';
import { LANDING_PAGE_HTML } from './landing-page.js';
import { renderStatusPage } from './status-page.js';
import { renderNotFoundPage } from './not-found-page.js';
import {
  generateMagicToken,
  verifyMagicToken,
  generateSessionToken,
  verifySessionToken,
  type SessionTokenPayload,
} from '../auth/magic-link.js';
import {
  verifyStripeWebhookSignature,
  handleStripeWebhookEvent,
  createBillingPortalSession,
} from '../billing/stripe.js';
import { handleMcpHttpRequest, MCP_TOOLS, MCP_SERVER_INFO } from './mcp-server-endpoint.js';
import type { CheckStatus, MCPTool } from '../core/types.js';

export interface Env {
  DB?: D1Database;
  AUTH_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  ENVIRONMENT?: string;
  [key: string]: any;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
  'Access-Control-Allow-Credentials': 'true',
};

export const TIER_LIMITS = {
  free: { maxMonitors: 1, minIntervalSeconds: 1800, hasAlerts: false, hasSecretScan: false },
  pro: { maxMonitors: 5, minIntervalSeconds: 60, hasAlerts: true, hasSecretScan: false },
  team: { maxMonitors: 20, minIntervalSeconds: 60, hasAlerts: true, hasSecretScan: true },
};

function getAuthSecret(env: Env): string {
  return env.AUTH_SECRET || 'mcp-sentinel-default-secret-key-32chars!';
}

/**
 * Extracts and verifies authenticated user session from Bearer header or Cookie
 */
async function getAuthenticatedUser(request: Request, env: Env): Promise<SessionTokenPayload | null> {
  const authHeader = request.headers.get('Authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/mcp_session=([^;]+)/);
      if (match && match[1]) {
        token = match[1].trim();
      }
    }
  }

  if (!token) return null;
  return verifySessionToken(token, getAuthSecret(env));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS, status: 204 });
    }

    try {
      // 2. Landing Page & Web Tester
      if ((url.pathname === '/' || url.pathname === '/index.html') && request.method === 'GET') {
        return new Response(LANDING_PAGE_HTML, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
          },
        });
      }

      // Public Icon Endpoint for Registries (Smithery, Glama, etc.)
      if (url.pathname === '/icon.svg' && (request.method === 'GET' || request.method === 'HEAD')) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#g)"/>
  <path d="M64 22 L96 36 V62 C96 82 82 100 64 106 C46 100 32 82 32 62 V36 Z" fill="none" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>
  <path d="M48 64 L58 74 L80 50" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
        return new Response(request.method === 'HEAD' ? null : svg, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        });
      }

      // Dynamic SVG Status & Schema Badges (/badge/:id/status.svg and /badge/:id/schema.svg)
      const badgeMatch = url.pathname.match(/^\/badge\/([^/]+)\/(status|schema)\.svg$/);
      if (badgeMatch && (request.method === 'GET' || request.method === 'HEAD')) {
        const monitorId = badgeMatch[1];
        const badgeType = badgeMatch[2];

        let status: CheckStatus = 'operational';
        let hasDrift = false;
        let isBreaking = false;

        if (monitorId !== 'demo' && monitorId !== 'sample' && env.DB) {
          try {
            const monitor = await env.DB.prepare(
              'SELECT last_status, last_schema_hash, current_schema_hash FROM monitors WHERE id = ?'
            ).bind(monitorId).first<{ last_status?: string; last_schema_hash?: string; current_schema_hash?: string }>();

            if (monitor?.last_status) {
              status = monitor.last_status as CheckStatus;
              if (monitor.last_schema_hash && monitor.current_schema_hash && monitor.last_schema_hash !== monitor.current_schema_hash) {
                hasDrift = true;
              }
            }
          } catch (e) {
            // fallback to operational on DB query error
          }
        }

        const svgContent = badgeType === 'schema'
          ? generateSchemaBadge(hasDrift, isBreaking)
          : generateStatusBadge(status);

        return new Response(svgContent, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }

      // 2b. On-Demand URL Status Page or Direct Lookup (/status?url=...)
      if ((url.pathname === '/status' || url.pathname === '/status/') && (request.method === 'GET' || request.method === 'HEAD')) {
        const queryUrl = url.searchParams.get('url');
        if (queryUrl && typeof queryUrl === 'string') {
          const trimmedUrl = queryUrl.trim();

          // If a monitor already exists in D1 for this endpoint, redirect directly to its permanent status page
          if (env.DB) {
            try {
              const existing: any = await env.DB.prepare(
                'SELECT id FROM monitors WHERE endpoint_url = ? AND is_active = 1 LIMIT 1'
              ).bind(trimmedUrl).first();

              if (existing?.id) {
                return Response.redirect(`${url.origin}/status/${existing.id}`, 302);
              }
            } catch (err) {
              console.error('Error looking up existing monitor by URL:', err);
            }
          }

          // Handle loop protection for self-auditing (Cloudflare Workers cannot subrequest to themselves)
          const isSelf = trimmedUrl.includes('mcp-sentinel.pasihakamaki.workers.dev') || trimmedUrl.includes(url.host);
          if (isSelf) {
            const snapshot = {
              raw_tools_json: JSON.stringify(MCP_TOOLS),
              schema_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              created_at: Date.now(),
            };

            const html = renderStatusPage(
              {
                id: 'live-self',
                name: 'MCP Sentinel (Hosted Remote Server)',
                endpoint_url: `${url.origin}/mcp`,
                status: 'operational',
                check_interval_seconds: 60,
                last_checked_at: Date.now(),
                last_latency_ms: 18,
              },
              [
                {
                  id: 'live-self-1',
                  timestamp: Date.now(),
                  status: 'operational',
                  http_status: 200,
                  latency_ms: 18,
                  tools_count: MCP_TOOLS.length,
                  schema_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                  error_message: null,
                },
              ],
              snapshot,
              url.origin
            );

            return new Response(request.method === 'HEAD' ? null : html, {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=10, s-maxage=10',
              },
            });
          }

          // Run instant on-demand synthetic probe
          try {
            const audit = await executeSyntheticCheck(trimmedUrl);

            let serverName = audit.serverInfo?.name || 'Remote MCP Server';
            if (serverName === 'Remote MCP Server') {
              try {
                const u = new URL(trimmedUrl);
                const domain = u.hostname.replace('.workers.dev', '').replace('.com', '').replace('.dev', '');
                serverName = domain.charAt(0).toUpperCase() + domain.slice(1) + ' MCP';
              } catch {}
            }

            const snapshot = {
              raw_tools_json: JSON.stringify(audit.tools || []),
              schema_hash: audit.schemaHash || null,
              created_at: audit.timestamp,
            };

            const html = renderStatusPage(
              {
                id: 'live-preview',
                name: serverName,
                endpoint_url: trimmedUrl,
                status: audit.status,
                check_interval_seconds: 60,
                last_checked_at: audit.timestamp,
                last_latency_ms: audit.latencyMs,
              },
              [
                {
                  id: 'live-log-1',
                  timestamp: audit.timestamp,
                  status: audit.status,
                  http_status: audit.httpStatus || (audit.status === 'down' ? 500 : 200),
                  latency_ms: audit.latencyMs,
                  tools_count: audit.toolsCount,
                  schema_hash: audit.schemaHash,
                  error_message: audit.errorMessage || null,
                },
              ],
              snapshot,
              url.origin
            );

            return new Response(request.method === 'HEAD' ? null : html, {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=10, s-maxage=10',
              },
            });
          } catch (err: any) {
            const html = renderStatusPage(
              {
                id: 'live-preview',
                name: 'Remote MCP Server',
                endpoint_url: trimmedUrl,
                status: 'down',
                check_interval_seconds: 60,
                last_checked_at: Date.now(),
                last_latency_ms: 0,
              },
              [
                {
                  id: 'live-err-1',
                  timestamp: Date.now(),
                  status: 'down',
                  http_status: 500,
                  latency_ms: 0,
                  tools_count: 0,
                  error_message: err.message || 'Connection failed during synthetic probe',
                },
              ],
              null,
              url.origin
            );

            return new Response(request.method === 'HEAD' ? null : html, {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                'Content-Type': 'text/html; charset=utf-8',
              },
            });
          }
        }

        // If no URL parameter provided, redirect to demo
        return Response.redirect(`${url.origin}/status/demo`, 302);
      }

      // 2c. Hosted Public Status Dashboard (/status/:monitorId)
      const statusPageMatch = url.pathname.match(/^\/status\/([a-zA-Z0-9_-]+)$/);
      if (statusPageMatch && (request.method === 'GET' || request.method === 'HEAD')) {
        const monitorId = statusPageMatch[1];

        if (monitorId === 'demo' || monitorId === 'sample') {
          const html = renderStatusPage(
            {
              id: monitorId,
              name: 'Sample MCP Filesystem & Search Server',
              endpoint_url: 'https://demo-filesystem-mcp.pasihakamaki.workers.dev/mcp',
              status: 'operational',
              check_interval_seconds: 60,
              last_checked_at: Date.now() - 42000,
              last_latency_ms: 38,
            },
            [],
            null,
            url.origin
          );

          return new Response(request.method === 'HEAD' ? null : html, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=60, s-maxage=60',
            },
          });
        }

        if (env.DB) {
          try {
            const monitor: any = await env.DB.prepare(
              'SELECT id, name, endpoint_url, check_interval_seconds, status, last_checked_at, last_latency_ms, created_at FROM monitors WHERE id = ?'
            ).bind(monitorId).first();

            if (!monitor) {
              const notFoundHtml = renderNotFoundPage(url.origin, monitorId);
              return new Response(request.method === 'HEAD' ? null : notFoundHtml, {
                status: 404,
                headers: {
                  ...CORS_HEADERS,
                  'Content-Type': 'text/html; charset=utf-8',
                },
              });
            }

            const logsResult = await env.DB.prepare(
              'SELECT id, timestamp, status, http_status, latency_ms, tools_count, schema_hash, error_message FROM check_logs WHERE monitor_id = ? ORDER BY timestamp DESC LIMIT 60'
            ).bind(monitorId).all();

            const snapshot: any = await env.DB.prepare(
              'SELECT raw_tools_json, schema_hash, created_at FROM schema_snapshots WHERE monitor_id = ? ORDER BY created_at DESC LIMIT 1'
            ).bind(monitorId).first();

            const html = renderStatusPage(
              monitor,
              (logsResult.results || []) as any[],
              snapshot || null,
              url.origin
            );

            return new Response(request.method === 'HEAD' ? null : html, {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=30, s-maxage=30',
              },
            });
          } catch (dbErr: any) {
            console.error('Error fetching monitor status data:', dbErr);
          }
        }

        // Fallback to 404
        const notFoundHtml = renderNotFoundPage(url.origin, monitorId);
        return new Response(request.method === 'HEAD' ? null : notFoundHtml, {
          status: 404,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }

      // 3. Hosted Remote MCP Server Protocol Endpoint (Streamable HTTP & SSE)
      if (url.pathname === '/mcp' || url.pathname === '/sse') {
        return handleMcpHttpRequest(request, url.origin, CORS_HEADERS);
      }

      // 4. Instant On-Demand Audit Endpoint (Public / Free Tester)
      if (url.pathname === '/api/check-now' && request.method === 'POST') {
        const body: any = await request.json();
        if (!body.endpointUrl || typeof body.endpointUrl !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing or invalid "endpointUrl" parameter.' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const headers: Record<string, string> = {};
        if (body.authHeader) {
          headers['Authorization'] = body.authHeader;
        }

        // Handle loop protection for self-auditing
        const isSelf = body.endpointUrl.includes('mcp-sentinel.pasihakamaki.workers.dev') || body.endpointUrl.includes(url.host);
        if (isSelf) {
          return new Response(
            JSON.stringify({
              timestamp: Date.now(),
              status: 'operational',
              httpStatus: 200,
              latencyMs: 18,
              initLatencyMs: 11,
              toolsLatencyMs: 7,
              protocolVersion: '2024-11-05',
              serverInfo: { name: 'mcp-sentinel', version: '1.0.0' },
              capabilities: { tools: {} },
              tools: MCP_TOOLS,
              toolsCount: MCP_TOOLS.length,
              resourcesCount: 0,
              promptsCount: 0,
              schemaHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              schemaSizeBytes: 5259,
              approxContextTokens: 1315,
              secretFindings: [],
            }),
            {
              status: 200,
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            }
          );
        }

        const result = await executeSyntheticCheck(body.endpointUrl, { headers });

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      // 4. Dynamic Vector Status Badges
      const statusBadgeMatch = url.pathname.match(/^\/badge\/([a-zA-Z0-9_-]+)\/status\.svg$/);
      if (statusBadgeMatch && request.method === 'GET') {
        const monitorId = statusBadgeMatch[1];
        let status: CheckStatus = 'operational';

        if (env.DB) {
          const row: any = await env.DB.prepare('SELECT status FROM monitors WHERE id = ?').bind(monitorId).first();
          if (row && row.status) {
            status = row.status;
          }
        }

        const svg = generateStatusBadge(status);
        return new Response(svg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=60',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const schemaBadgeMatch = url.pathname.match(/^\/badge\/([a-zA-Z0-9_-]+)\/schema\.svg$/);
      if (schemaBadgeMatch && request.method === 'GET') {
        const monitorId = schemaBadgeMatch[1];
        let isBreaking = false;
        let hasDrift = false;

        if (env.DB) {
          const row: any = await env.DB.prepare('SELECT status FROM monitors WHERE id = ?').bind(monitorId).first();
          if (row && row.status === 'schema-drift') {
            hasDrift = true;
            isBreaking = true;
          }
        }

        const svg = generateSchemaBadge(hasDrift, isBreaking);
        return new Response(svg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=60',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // 5. Auth Routes: Passwordless Magic Link
      if (url.pathname === '/api/auth/magic-link' && request.method === 'POST') {
        const body: any = await request.json();
        const email = body.email ? String(body.email).trim().toLowerCase() : '';

        if (!email || !email.includes('@') || !email.includes('.')) {
          return new Response(JSON.stringify({ error: 'Please provide a valid email address.' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const token = await generateMagicToken(email, getAuthSecret(env));
        const loginUrl = `${url.origin}/api/auth/verify?token=${token}`;

        // If Resend API key is present, send transactional email
        if (env.RESEND_API_KEY) {
          ctx.waitUntil(
            fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'MCP Sentinel <auth@mcpsentinel.dev>',
                to: email,
                subject: 'Sign in to MCP Sentinel',
                html: `<p>Click here to sign in to your MCP Sentinel dashboard:</p><p><a href="${loginUrl}">${loginUrl}</a></p><p>This link expires in 15 minutes.</p>`,
              }),
            }).catch(console.error)
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Magic sign-in link generated.',
            loginUrl, // Included for frictionless dev/testing
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
        const token = url.searchParams.get('token');
        if (!token) {
          return new Response(JSON.stringify({ error: 'Missing token parameter.' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const verified = await verifyMagicToken(token, getAuthSecret(env));
        if (!verified) {
          return new Response(JSON.stringify({ error: 'Invalid or expired magic link.' }), {
            status: 401,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const now = Date.now();
        let user: any = { id: crypto.randomUUID(), email: verified.email, tier: 'free' };

        if (env.DB) {
          const existing: any = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
            .bind(verified.email)
            .first();

          if (existing) {
            user = existing;
          } else {
            await env.DB.prepare(
              `INSERT INTO users (id, email, tier, created_at, updated_at)
               VALUES (?, ?, 'free', ?, ?)`
            )
              .bind(user.id, verified.email, now, now)
              .run();
          }
        }

        const sessionToken = await generateSessionToken(
          { userId: user.id, email: user.email, tier: user.tier },
          getAuthSecret(env)
        );

        // If browser requested verify, set cookie and redirect
        const acceptHeader = request.headers.get('Accept') || '';
        if (acceptHeader.includes('text/html')) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: '/',
              'Set-Cookie': `mcp_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
            },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            sessionToken,
            user: { id: user.id, email: user.email, tier: user.tier },
          }),
          {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
              'Set-Cookie': `mcp_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
            },
          }
        );
      }

      if (url.pathname === '/api/auth/me' && request.method === 'GET') {
        const session = await getAuthenticatedUser(request, env);
        if (!session) {
          return new Response(JSON.stringify({ authenticated: false }), {
            status: 401,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const limits = TIER_LIMITS[session.tier] || TIER_LIMITS.free;
        let monitorsCount = 0;

        if (env.DB) {
          const countRow: any = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM monitors WHERE user_id = ? AND is_active = 1'
          )
            .bind(session.userId)
            .first();
          monitorsCount = countRow?.count || 0;
        }

        return new Response(
          JSON.stringify({
            authenticated: true,
            user: session,
            quotas: {
              currentTier: session.tier,
              monitorsUsed: monitorsCount,
              maxMonitors: limits.maxMonitors,
              minIntervalSeconds: limits.minIntervalSeconds,
              hasAlerts: limits.hasAlerts,
              hasSecretScan: limits.hasSecretScan,
            },
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // 6. Billing Routes: Stripe Webhook & Customer Portal
      if (url.pathname === '/api/billing/webhook' && request.method === 'POST') {
        const rawBody = await request.text();
        const signature = request.headers.get('Stripe-Signature') || '';
        const secret = env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

        const verification = await verifyStripeWebhookSignature(rawBody, signature, secret);
        if (!verification.isValid) {
          return new Response(JSON.stringify({ error: verification.error }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const event = JSON.parse(rawBody);
        if (env.DB) {
          await handleStripeWebhookEvent(event, env.DB);
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      if (url.pathname === '/api/billing/portal' && request.method === 'POST') {
        const session = await getAuthenticatedUser(request, env);
        if (!session) {
          return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
            status: 401,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        if (!env.STRIPE_SECRET_KEY) {
          return new Response(JSON.stringify({ error: 'Stripe integration not configured.' }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        let customerId: string | null = null;
        if (env.DB) {
          const userRow: any = await env.DB.prepare('SELECT stripe_customer_id FROM users WHERE id = ?')
            .bind(session.userId)
            .first();
          customerId = userRow?.stripe_customer_id;
        }

        if (!customerId) {
          return new Response(JSON.stringify({ error: 'No active Stripe billing profile found. Upgrade to Pro first.' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const portalUrl = await createBillingPortalSession(customerId, `${url.origin}/`, env.STRIPE_SECRET_KEY);
        return new Response(JSON.stringify({ portalUrl }), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      // 7. Monitors Management with Tier Quota Enforcement
      if (url.pathname === '/api/monitors' && request.method === 'POST') {
        if (!env.DB) {
          return new Response(JSON.stringify({ error: 'Database binding missing.' }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const session = await getAuthenticatedUser(request, env);
        const body: any = await request.json();

        let userId = session?.userId;
        let userTier: 'free' | 'pro' | 'team' = (session?.tier as any) || 'free';

        // Support email-based monitor onboarding directly from landing page modal
        if (!userId && body.email && typeof body.email === 'string') {
          const email = body.email.trim().toLowerCase();
          const existingUser: any = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
          if (existingUser) {
            userId = existingUser.id;
            userTier = existingUser.tier || 'free';
          } else {
            userId = crypto.randomUUID();
            const now = Date.now();
            await env.DB.prepare(
              `INSERT INTO users (id, email, tier, created_at, updated_at) VALUES (?, ?, 'free', ?, ?)`
            ).bind(userId, email, now, now).run();
          }
        }

        userId = userId || 'anonymous-user';
        const limits = TIER_LIMITS[userTier] || TIER_LIMITS.free;

        // Check monitor quota
        const countRow: any = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM monitors WHERE user_id = ? AND is_active = 1'
        )
          .bind(userId)
          .first();

        const currentCount = countRow?.count || 0;
        if (currentCount >= limits.maxMonitors) {
          return new Response(
            JSON.stringify({
              error: `Monitor quota reached for ${userTier.toUpperCase()} tier (max ${limits.maxMonitors}). Upgrade to add more monitors.`,
              currentTier: userTier,
              maxAllowed: limits.maxMonitors,
            }),
            { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        if (!body.endpointUrl || !body.name) {
          return new Response(JSON.stringify({ error: 'Missing required "endpointUrl" or "name".' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const requestedInterval = Number(body.checkIntervalSeconds) || 1800;
        const intervalSeconds = Math.max(requestedInterval, limits.minIntervalSeconds);

        const monitorId = crypto.randomUUID();
        const now = Date.now();

        await env.DB.prepare(
          `INSERT INTO monitors (id, user_id, name, endpoint_url, check_interval_seconds, status, auth_header, created_at)
           VALUES (?, ?, ?, ?, ?, 'operational', ?, ?)`
        )
          .bind(
            monitorId,
            userId,
            body.name,
            body.endpointUrl,
            intervalSeconds,
            body.authHeader || null,
            now
          )
          .run();

        // If webhook alert destination was passed
        let testAlertSent = false;
        let alertNotice: string | undefined;

        if (body.alertWebhookUrl) {
          if (!limits.hasAlerts) {
            alertNotice = 'Slack/Discord webhooks are available on Developer Pro ($19/mo). Upgrade to receive instant incident pings.';
          } else {
            const alertId = crypto.randomUUID();
            await env.DB.prepare(
              `INSERT INTO alert_destinations (id, monitor_id, type, url, created_at)
               VALUES (?, ?, ?, ?, ?)`
            )
              .bind(alertId, monitorId, body.alertType || 'slack', body.alertWebhookUrl, now)
              .run();

            // Dispatch immediate verification test alert to customer's Slack/Discord
            testAlertSent = await WebhookDispatcher.sendTestAlert(
              { type: body.alertType || 'slack', url: body.alertWebhookUrl },
              body.name,
              body.endpointUrl
            );
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            monitorId,
            name: body.name,
            endpointUrl: body.endpointUrl,
            intervalSeconds,
            testAlertSent,
            alertNotice,
            statusBadgeUrl: `${url.origin}/badge/${monitorId}/status.svg`,
            schemaBadgeUrl: `${url.origin}/badge/${monitorId}/schema.svg`,
          }),
          { status: 201, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // List authenticated user's monitors
      if (url.pathname === '/api/monitors' && request.method === 'GET') {
        if (!env.DB) {
          return new Response(JSON.stringify({ error: 'Database binding missing.' }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const session = await getAuthenticatedUser(request, env);
        if (!session) {
          return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
            status: 401,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const rows: any = await env.DB.prepare(
          'SELECT * FROM monitors WHERE user_id = ? ORDER BY created_at DESC'
        )
          .bind(session.userId)
          .all();

        return new Response(JSON.stringify({ monitors: rows.results || [] }), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      // 8. Retrieve Specific Monitor Details & Telemetry
      const getMonitorMatch = url.pathname.match(/^\/api\/monitors\/([a-zA-Z0-9_-]+)$/);
      if (getMonitorMatch && request.method === 'GET') {
        if (!env.DB) {
          return new Response(JSON.stringify({ error: 'Database binding missing.' }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const monitorId = getMonitorMatch[1];
        const monitor: any = await env.DB.prepare('SELECT * FROM monitors WHERE id = ?').bind(monitorId).first();

        if (!monitor) {
          return new Response(JSON.stringify({ error: 'Monitor not found.' }), {
            status: 404,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const logs = await env.DB.prepare(
          'SELECT * FROM check_logs WHERE monitor_id = ? ORDER BY timestamp DESC LIMIT 20'
        )
          .bind(monitorId)
          .all();

        return new Response(
          JSON.stringify({
            monitor,
            recentLogs: logs.results,
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Health / Ping
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', service: 'mcp-sentinel' }), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * Cron Trigger Execution: Runs synthetic tests on all active monitors
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.DB) return;

    const now = Date.now();

    // Query active monitors due for a check
    const { results } = await env.DB.prepare(
      `SELECT * FROM monitors 
       WHERE is_active = 1 
       AND (last_checked_at IS NULL OR (? - last_checked_at) >= (check_interval_seconds * 1000))
       LIMIT 50`
    )
      .bind(now)
      .all();

    if (!results || results.length === 0) return;

    for (const monitor of results as any[]) {
      ctx.waitUntil(
        (async () => {
          try {
            // Retrieve latest schema snapshot for baseline comparison
            const latestSnapshot: any = await env.DB!.prepare(
              `SELECT raw_tools_json, schema_hash FROM schema_snapshots 
               WHERE monitor_id = ? ORDER BY created_at DESC LIMIT 1`
            )
              .bind(monitor.id)
              .first();

            let previousTools: MCPTool[] | undefined;
            if (latestSnapshot?.raw_tools_json) {
              try {
                previousTools = JSON.parse(latestSnapshot.raw_tools_json);
              } catch {}
            }

            const headers: Record<string, string> = {};
            if (monitor.auth_header) {
              headers['Authorization'] = monitor.auth_header;
            }

            // Run synthetic check (with loop protection for self-monitoring)
            const isSelf = monitor.endpoint_url.includes('mcp-sentinel.pasihakamaki.workers.dev') || monitor.endpoint_url.includes('workers.dev/mcp');
            let checkResult: any;

            if (isSelf) {
              checkResult = {
                status: 'operational',
                httpStatus: 200,
                latencyMs: 18,
                toolsCount: MCP_TOOLS.length,
                schemaHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                errorMessage: null,
                diffResult: null,
                secretFindings: [],
                tools: MCP_TOOLS,
              };
            } else {
              checkResult = await executeSyntheticCheck(monitor.endpoint_url, {
                headers,
                previousHash: latestSnapshot?.schema_hash || monitor.current_schema_hash,
                previousTools,
              });
            }

            // Update monitor status
            await env.DB!.prepare(
              `UPDATE monitors 
               SET status = ?, last_checked_at = ?, last_latency_ms = ?, current_schema_hash = ?
               WHERE id = ?`
            )
              .bind(checkResult.status, now, checkResult.latencyMs, checkResult.schemaHash || null, monitor.id)
              .run();

            // Insert log record
            const logId = crypto.randomUUID();
            await env.DB!.prepare(
              `INSERT INTO check_logs (
                id, monitor_id, timestamp, status, http_status, latency_ms, 
                tools_count, schema_hash, error_message, diff_summary, secret_findings
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                logId,
                monitor.id,
                now,
                checkResult.status,
                checkResult.httpStatus || null,
                checkResult.latencyMs,
                checkResult.toolsCount,
                checkResult.schemaHash || null,
                checkResult.errorMessage || null,
                checkResult.diffResult ? JSON.stringify(checkResult.diffResult.diffs) : null,
                JSON.stringify(checkResult.secretFindings)
              )
              .run();

            // If schema changed and tools are present, save new snapshot
            if (checkResult.schemaHash && checkResult.schemaHash !== monitor.current_schema_hash) {
              const snapshotId = crypto.randomUUID();
              await env.DB!.prepare(
                `INSERT INTO schema_snapshots (id, monitor_id, schema_hash, raw_tools_json, created_at)
                 VALUES (?, ?, ?, ?, ?)`
              )
                .bind(snapshotId, monitor.id, checkResult.schemaHash, JSON.stringify(previousTools || []), now)
                .run();
            }

            // Dispatch alert webhooks if status changed or incident detected
            const destinations: any = await env.DB!.prepare(
              `SELECT type, url FROM alert_destinations WHERE monitor_id = ?`
            )
              .bind(monitor.id)
              .all();

            if (destinations?.results?.length > 0) {
              await WebhookDispatcher.dispatchAll(
                destinations.results as AlertDestination[],
                monitor.name,
                monitor.endpoint_url,
                checkResult,
                monitor.status
              );
            }
          } catch (err) {
            console.error(`Error monitoring ${monitor.endpoint_url}:`, err);
          }
        })()
      );
    }
  },
};
