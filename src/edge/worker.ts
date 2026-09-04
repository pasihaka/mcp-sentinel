import { executeSyntheticCheck } from '../core/synthetic-runner.js';
import { generateStatusBadge, generateSchemaBadge } from './badge-generator.js';
import { WebhookDispatcher, type AlertDestination } from '../alerts/webhook-dispatcher.js';
import { LANDING_PAGE_HTML } from './landing-page.js';
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
import { handleMcpHttpRequest } from './mcp-server-endpoint.js';
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
        const userId = session?.userId || 'anonymous-user';
        const userTier = session?.tier || 'free';
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

        const body: any = await request.json();
        if (!body.endpointUrl || !body.name) {
          return new Response(JSON.stringify({ error: 'Missing required "endpointUrl" or "name".' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const requestedInterval = Number(body.checkIntervalSeconds) || 60;
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

        // If webhook alert destination was passed and user tier allows alerts
        if (body.alertWebhookUrl) {
          if (!limits.hasAlerts && userTier === 'free') {
            // Free tier gets notice
          } else {
            const alertId = crypto.randomUUID();
            await env.DB.prepare(
              `INSERT INTO alert_destinations (id, monitor_id, type, url, created_at)
               VALUES (?, ?, ?, ?, ?)`
            )
              .bind(alertId, monitorId, body.alertType || 'slack', body.alertWebhookUrl, now)
              .run();
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            monitorId,
            intervalSeconds,
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

            // Run synthetic check
            const checkResult = await executeSyntheticCheck(monitor.endpoint_url, {
              headers,
              previousHash: latestSnapshot?.schema_hash || monitor.current_schema_hash,
              previousTools,
            });

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
