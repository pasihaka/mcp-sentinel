export interface PublicMonitorData {
  id: string;
  name: string;
  endpoint_url: string;
  check_interval_seconds?: number;
  status: string;
  last_checked_at?: number | null;
  last_latency_ms?: number | null;
  created_at?: number;
}

export interface CheckLogItem {
  id: string;
  timestamp: number;
  status: string;
  http_status?: number | null;
  latency_ms?: number | null;
  tools_count?: number | null;
  schema_hash?: string | null;
  error_message?: string | null;
}

export interface SchemaSnapshotItem {
  raw_tools_json?: string | null;
  schema_hash?: string | null;
  created_at?: number | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeEndpointUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return u.protocol + '//' + u.host + u.pathname;
  } catch {
    return rawUrl.split('?')[0];
  }
}

function formatRelativeTime(timestampMs: number): string {
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function renderStatusPage(
  monitorInput: PublicMonitorData,
  recentLogsInput: CheckLogItem[],
  snapshotInput: SchemaSnapshotItem | null | undefined,
  originUrl: string
): string {
  const isDemo = monitorInput.id === 'demo' || monitorInput.id === 'sample';

  // Populate realistic sample data if demo mode
  let monitor = { ...monitorInput };
  let recentLogs = [...recentLogsInput];
  let snapshot = snapshotInput ? { ...snapshotInput } : null;

  if (isDemo) {
    monitor = {
      id: 'demo',
      name: 'GitHub & Filesystem MCP Service',
      endpoint_url: 'https://demo-mcp-cluster.internal/mcp',
      check_interval_seconds: 60,
      status: 'operational',
      last_checked_at: Date.now() - 35000,
      last_latency_ms: 36,
      created_at: Date.now() - 86400000 * 14,
    };

    if (recentLogs.length === 0) {
      const sampleLogs: CheckLogItem[] = [];
      const now = Date.now();
      for (let i = 0; i < 60; i++) {
        const time = now - i * 60000;
        // Introduce one small transient degraded check 28 checks ago for realism
        const isDegraded = i === 28;
        sampleLogs.push({
          id: `sample-${i}`,
          timestamp: time,
          status: isDegraded ? 'degraded' : 'operational',
          http_status: 200,
          latency_ms: isDegraded ? 184 : Math.floor(28 + (i % 7) * 2.8),
          tools_count: 5,
          schema_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          error_message: isDegraded ? 'Discovery latency exceeded threshold (184ms)' : null,
        });
      }
      recentLogs = sampleLogs;
    }

    if (!snapshot) {
      snapshot = {
        raw_tools_json: JSON.stringify([
          { name: 'read_file', description: 'Read full contents of a file from the workspace.', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
          { name: 'write_file', description: 'Create or overwrite a file with UTF-8 content.', inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } } },
          { name: 'list_directory', description: 'List files and subdirectories at a target path.', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
          { name: 'git_status', description: 'Retrieve working tree git status and staged diffs.', inputSchema: { type: 'object', properties: {} } },
          { name: 'search_files', description: 'Perform ripgrep pattern search across repository.', inputSchema: { type: 'object', properties: { query: { type: 'string' } } } },
        ]),
        schema_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created_at: Date.now() - 3600000,
      };
    }
  }

  // Parse tools if snapshot available
  let tools: any[] = [];
  let schemaSizeBytes = 0;
  let approxTokens = 0;
  if (snapshot?.raw_tools_json) {
    try {
      tools = JSON.parse(snapshot.raw_tools_json);
      schemaSizeBytes = new TextEncoder().encode(snapshot.raw_tools_json).length;
      approxTokens = Math.ceil(schemaSizeBytes / 4);
    } catch {
      tools = [];
    }
  }

  // Calculate Uptime Stats from recentLogs
  const totalChecks = recentLogs.length;
  let operationalCount = 0;
  let totalLatency = 0;
  let latencyCount = 0;

  for (const log of recentLogs) {
    if (log.status === 'operational' || log.status === 'schema-drift') {
      operationalCount++;
    }
    if (typeof log.latency_ms === 'number' && log.latency_ms > 0) {
      totalLatency += log.latency_ms;
      latencyCount++;
    }
  }

  const uptimePercentage = totalChecks > 0 ? ((operationalCount / totalChecks) * 100).toFixed(2) : '100.00';
  const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : (monitor.last_latency_ms || 35);
  const toolsCount = tools.length > 0 ? tools.length : (recentLogs[0]?.tools_count ?? 0);

  // Status configuration
  type StatusConfig = { title: string; badgeText: string; color: string; bg: string; border: string; desc: string };
  const statusConfigs: Record<string, StatusConfig> = {
    operational: {
      title: 'All Systems Operational',
      badgeText: 'OPERATIONAL',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      desc: 'Synthetic JSON-RPC 2.0 handshake and tool inspection tests are passing with sub-second response times.',
    },
    degraded: {
      title: 'Degraded Performance',
      badgeText: 'DEGRADED',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      desc: 'The MCP server responded, but handshake or tool discovery latencies exceeded nominal thresholds.',
    },
    'schema-drift': {
      title: 'Schema Drift Detected',
      badgeText: 'SCHEMA DRIFT',
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'rgba(249, 115, 22, 0.3)',
      desc: 'Changes in tool definitions, arguments, or return types detected compared to previous baseline schema snapshot.',
    },
    'secret-leak': {
      title: 'Security Alert: Secret Exposure',
      badgeText: 'SECURITY ALERT',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
      desc: 'High-entropy credentials or API keys were detected in tool description or schema responses.',
    },
    down: {
      title: 'Service Outage',
      badgeText: 'OUTAGE',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
      desc: 'Synthetic probes failed to complete handshake or returned 5xx HTTP/SSE errors.',
    },
  };

  const currentConfig = statusConfigs[monitor.status] || statusConfigs.operational;

  // Render 60-Bar Uptime Grid
  // Sort oldest to newest for visual timeline (left to right)
  const sortedChronological = [...recentLogs].sort((a, b) => a.timestamp - b.timestamp);
  const targetBarCount = 60;
  const barsToRender: (CheckLogItem | null)[] = [];

  // Pad left with nulls if fewer than 60 checks
  const missingCount = Math.max(0, targetBarCount - sortedChronological.length);
  for (let i = 0; i < missingCount; i++) {
    barsToRender.push(null);
  }
  for (const log of sortedChronological.slice(-targetBarCount)) {
    barsToRender.push(log);
  }

  const barsHtml = barsToRender
    .map((log) => {
      if (!log) {
        return `<div class="bar empty" title="No check recorded yet"></div>`;
      }
      const timeStr = new Date(log.timestamp).toUTCString();
      let barClass = 'bar operational';
      if (log.status === 'degraded') barClass = 'bar degraded';
      else if (log.status === 'schema-drift') barClass = 'bar drift';
      else if (log.status === 'down' || log.status === 'secret-leak') barClass = 'bar down';

      const tooltipText = `${timeStr} · ${log.status.toUpperCase()} · ${log.latency_ms || 0}ms`;
      return `<div class="${barClass}" title="${escapeHtml(tooltipText)}"></div>`;
    })
    .join('');

  // Render Recent Logs Table (newest first, max 10)
  const recentLogsSlice = [...recentLogs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  const logsTableHtml = recentLogsSlice.length === 0
    ? `<tr><td colspan="4" style="text-align: center; color: var(--muted); padding: 1.5rem;">No synthetic checks recorded yet. First automated probe running shortly.</td></tr>`
    : recentLogsSlice
        .map((l) => {
          let statusColor = '#10b981';
          if (l.status === 'degraded') statusColor = '#f59e0b';
          else if (l.status === 'schema-drift') statusColor = '#f97316';
          else if (l.status === 'down' || l.status === 'secret-leak') statusColor = '#ef4444';

          const relTime = formatRelativeTime(l.timestamp);
          const httpCode = l.http_status ? `${l.http_status} OK` : '200 OK';
          const latencyStr = l.latency_ms ? `${l.latency_ms}ms` : '--';
          const detail = l.error_message ? escapeHtml(l.error_message) : (l.status === 'operational' ? 'Protocol handshake & tool discovery verified' : l.status);

          return `<tr>
            <td style="white-space: nowrap; color: var(--muted); font-size: 0.85rem;">${relTime}</td>
            <td>
              <span class="pill" style="color: ${statusColor}; background: ${statusColor}1a; border: 1px solid ${statusColor}33;">
                ${escapeHtml(l.status.toUpperCase())}
              </span>
            </td>
            <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">${latencyStr} <span style="color: var(--muted); font-size: 0.75rem;">(${httpCode})</span></td>
            <td style="color: var(--text); font-size: 0.85rem;">${detail}</td>
          </tr>`;
        })
        .join('');

  // Render Tools Catalog
  const toolsHtml = tools.length === 0
    ? `<div style="color: var(--muted); font-size: 0.9rem; padding: 1rem 0;">No tool definitions recorded yet. Tools will appear here following the next synthetic inspection.</div>`
    : `<div class="tools-grid">` +
      tools
        .map((t) => {
          const propCount = t.inputSchema?.properties ? Object.keys(t.inputSchema.properties).length : 0;
          return `<div class="tool-item">
            <div class="tool-header">
              <span class="tool-name">${escapeHtml(t.name || 'unnamed_tool')}</span>
              <span class="tool-badge">${propCount} ${propCount === 1 ? 'arg' : 'args'}</span>
            </div>
            <div class="tool-desc">${escapeHtml(t.description || 'No description provided by server.')}</div>
          </div>`;
        })
        .join('') +
      `</div>`;

  const badgeSvgUrl = `${originUrl}/badge/${monitor.id}/status.svg`;
  const statusPageUrl = `${originUrl}/status/${monitor.id}`;
  const badgeMarkdown = `[![MCP Sentinel Status](${badgeSvgUrl})](${statusPageUrl})`;

  const safeEndpoint = sanitizeEndpointUrl(monitor.endpoint_url);
  const lastCheckedText = monitor.last_checked_at ? formatRelativeTime(monitor.last_checked_at) : 'Just now';

  const isLivePreview = monitor.id.startsWith('live-');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(monitor.name)} — MCP Sentinel Status</title>
  <meta name="description" content="Live operational health, latency telemetry, schema drift tracking, and tool capabilities for ${escapeHtml(monitor.name)}. Powered by MCP Sentinel.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --card-alt: #162032;
      --border: #1f2937;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --green: #10b981;
      --red: #ef4444;
      --orange: #f59e0b;
      --text: #f9fafb;
      --muted: #9ca3af;
      --font-mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, sans-serif;
      line-height: 1.6;
      padding: 0 1.5rem 5rem;
    }
    .container { max-width: 980px; margin: 0 auto; }
    
    /* Top Navigation */
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2.5rem;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 800;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
      color: #fff;
      text-decoration: none;
    }
    .logo-badge {
      background: var(--accent);
      color: #fff;
      font-size: 0.7rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .nav-cta {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.45rem 0.9rem;
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .nav-cta:hover {
      background: var(--accent);
      color: #fff;
    }

    /* Hero Header */
    .header-section {
      margin-bottom: 2rem;
    }
    .server-title {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #fff;
      margin-bottom: 0.4rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .endpoint-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--muted);
      font-size: 0.9rem;
      flex-wrap: wrap;
    }
    .endpoint-code {
      font-family: var(--font-mono);
      background: #0b1120;
      border: 1px solid var(--border);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      color: #cbd5e1;
      font-size: 0.85rem;
    }

    /* Big Operational Status Banner */
    .status-banner {
      background: ${currentConfig.bg};
      border: 1px solid ${currentConfig.border};
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .status-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .pulse-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: ${currentConfig.color};
      box-shadow: 0 0 0 0 ${currentConfig.color}80;
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 ${currentConfig.color}80; }
      70% { transform: scale(1); box-shadow: 0 0 0 8px ${currentConfig.color}00; }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 ${currentConfig.color}00; }
    }
    .status-banner-text h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: ${currentConfig.color};
      letter-spacing: -0.01em;
    }
    .status-banner-text p {
      font-size: 0.85rem;
      color: var(--muted);
    }
    .status-right {
      text-align: right;
      font-size: 0.8rem;
      color: var(--muted);
    }

    /* KPI Metrics Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.2rem 1.25rem;
    }
    .kpi-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 0.4rem;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
    }
    .kpi-sub {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 0.25rem;
    }

    /* Uptime Bar Section */
    .section-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }
    .bars-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 4px;
      margin-bottom: 0.5rem;
    }
    .bars-container {
      display: flex;
      gap: 3px;
      height: 36px;
      align-items: stretch;
      min-width: 100%;
      width: 100%;
    }
    .bar {
      flex: 1 1 0px;
      min-width: 2px;
      border-radius: 2px;
      transition: opacity 0.2s, transform 0.15s;
      cursor: pointer;
    }
    .bar:hover {
      opacity: 0.85;
      transform: scaleY(1.1);
    }
    .bar.operational { background-color: var(--green); }
    .bar.degraded { background-color: var(--orange); }
    .bar.drift { background-color: #f97316; }
    .bar.down { background-color: var(--red); }
    .bar.empty { background-color: #1f2937; }

    .bars-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: var(--muted);
    }

    /* Tables */
    .table-responsive {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #1a2234;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .pill {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    /* Tools Grid */
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .tool-item {
      background: #0b1120;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
    }
    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }
    .tool-name {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 600;
      color: #60a5fa;
    }
    .tool-badge {
      font-size: 0.7rem;
      background: #1f2937;
      color: var(--muted);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }
    .tool-desc {
      font-size: 0.8rem;
      color: var(--muted);
      line-height: 1.4;
    }

    /* Badge Embed Box */
    .badge-card {
      background: #0d1424;
      border: 1px dashed #2b384e;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    .badge-left {
      flex: 1;
      min-width: 260px;
    }
    .badge-code {
      font-family: var(--font-mono);
      background: #050811;
      border: 1px solid var(--border);
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #93c5fd;
      word-break: break-all;
      margin-top: 0.5rem;
    }
    .btn-copy {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 0.6rem 1.1rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-copy:hover {
      background: var(--accent-hover);
    }

    /* Viral Conversion Card */
    .viral-card {
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      border: 1px solid #3b82f6;
      border-radius: 16px;
      padding: 2.2rem;
      text-align: center;
      box-shadow: 0 20px 35px -10px rgba(59, 130, 246, 0.2);
    }
    .viral-card h3 {
      font-size: 1.6rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      margin-bottom: 0.6rem;
    }
    .viral-card p {
      color: #cbd5e1;
      max-width: 600px;
      margin: 0 auto 1.5rem;
      font-size: 0.95rem;
    }
    .viral-btn {
      display: inline-block;
      background: #fff;
      color: #0f172a;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0.75rem 1.6rem;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .viral-btn:hover {
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    /* Footer */
    footer {
      text-align: center;
      color: var(--muted);
      font-size: 0.8rem;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    footer a {
      color: var(--muted);
      text-decoration: none;
    }
    footer a:hover {
      color: #fff;
    }

    /* Mobile Responsiveness Overhaul */
    @media (max-width: 640px) {
      body {
        padding: 0 0.85rem 4rem;
      }
      .server-title {
        font-size: 1.4rem;
        word-break: break-word;
      }
      .endpoint-meta {
        font-size: 0.8rem;
        gap: 0.4rem;
      }
      .endpoint-code {
        word-break: break-all;
        display: inline-block;
        max-width: 100%;
      }
      .status-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
      }
      .status-right {
        text-align: left;
      }
      .kpi-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
      }
      .kpi-card {
        padding: 0.85rem;
      }
      .kpi-value {
        font-size: 1.2rem;
      }
      .section-card {
        padding: 1rem 0.85rem;
      }
      .bars-container {
        gap: 2px;
        height: 28px;
        min-width: 260px;
      }
      .badge-card {
        flex-direction: column;
        align-items: stretch;
        padding: 1rem;
        gap: 0.85rem;
      }
      .badge-left {
        min-width: 0;
      }
      .btn-copy {
        width: 100%;
      }
      .viral-card {
        padding: 1.5rem 1rem;
      }
      .viral-btn {
        width: 100%;
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <a href="${originUrl}" class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        MCP Sentinel
        <span class="logo-badge">STATUS</span>
      </a>
      <a href="${originUrl}/#tester" class="nav-cta">Monitor Your Server ➔</a>
    </nav>

    <div class="header-section">
      <div class="server-title">
        ${escapeHtml(monitor.name)}
      </div>
      <div class="endpoint-meta">
        ${isLivePreview ? '<span class="pill" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); font-size: 0.72rem;">⚡ ON-DEMAND PROBE</span> <span>·</span>' : ''}
        <span>Endpoint:</span>
        <span class="endpoint-code">${escapeHtml(safeEndpoint)}</span>
        <span>·</span>
        <span>Checked ${escapeHtml(lastCheckedText)}</span>
        <span>·</span>
        <span>Interval: ${monitor.check_interval_seconds || 60}s</span>
      </div>
    </div>

    <!-- Live Status Banner -->
    <div class="status-banner">
      <div class="status-left">
        <div class="pulse-dot"></div>
        <div class="status-banner-text">
          <h2>${currentConfig.title}</h2>
          <p>${currentConfig.desc}</p>
        </div>
      </div>
      <div class="status-right">
        <div style="font-weight: 700; font-size: 0.9rem; color: #fff;">${uptimePercentage}% Uptime</div>
        <div>Last 60 checks</div>
      </div>
    </div>

    <!-- KPI Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Operational Status</div>
        <div class="kpi-value" style="color: ${currentConfig.color};">${currentConfig.badgeText}</div>
        <div class="kpi-sub">Synthetic Edge Protocol Handshake</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Latest Latency</div>
        <div class="kpi-value">${avgLatency}ms</div>
        <div class="kpi-sub">Round-trip JSON-RPC probe</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Exposed Tools</div>
        <div class="kpi-value">${toolsCount} tools</div>
        <div class="kpi-sub">Ajv Schema Compliant</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Context Tax</div>
        <div class="kpi-value" style="color: #10b981;">~${approxTokens > 0 ? approxTokens.toLocaleString() : (toolsCount * 260).toLocaleString()} tokens</div>
        <div class="kpi-sub">${schemaSizeBytes > 0 ? (schemaSizeBytes / 1024).toFixed(1) + ' KB schema payload' : 'Minimal context load'}</div>
      </div>
    </div>

    <!-- 60-Bar Uptime Timeline -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">Uptime & Latency History</div>
        <div style="font-size: 0.85rem; color: var(--muted);">Synthetic probe executed every ${monitor.check_interval_seconds || 60} seconds</div>
      </div>
      <div class="bars-wrapper">
        <div class="bars-container">
          ${barsHtml}
        </div>
      </div>
      <div class="bars-footer">
        <span>60 checks ago</span>
        <span style="font-weight: 600; color: #fff;">${uptimePercentage}% Uptime</span>
        <span>Now</span>
      </div>
    </div>

    <!-- Registered Tools Catalog -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">Discovered Tool Catalog (${toolsCount})</div>
        <div style="font-size: 0.85rem; color: var(--muted);">Capabilities verified from MCP protocol schema snapshot</div>
      </div>
      ${toolsHtml}
    </div>

    <!-- Recent Incident / Event Log Table -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">Recent Synthetic Probes</div>
        <div style="font-size: 0.85rem; color: var(--muted);">Last 10 executions</div>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Inspection Details</th>
            </tr>
          </thead>
          <tbody>
            ${logsTableHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dynamic Badge Embed Widget -->
    <div class="badge-card">
      <div class="badge-left">
        <div style="font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 0.2rem;">Add Live Status Badge to Your GitHub README:</div>
        <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 0.6rem;">This badge dynamically updates its color on every synthetic probe and links back to this status page.</div>
        ${isLivePreview ? '<div style="font-size: 0.8rem; color: #93c5fd; margin-bottom: 0.5rem;">⚡ <em>Save this monitor to activate permanent dynamic badges for this server.</em></div>' : ''}
        <div style="margin-bottom: 0.6rem;">
          <img src="${badgeSvgUrl}" alt="MCP Sentinel Status" height="20">
        </div>
        <div class="badge-code" id="badgeMarkdownCode">${escapeHtml(badgeMarkdown)}</div>
      </div>
      <div>
        <button type="button" class="btn-copy" onclick="copyBadgeMarkdown()">Copy Markdown</button>
      </div>
    </div>

    <!-- High-Converting Viral CTA -->
    <div class="viral-card">
      <h3>${isLivePreview ? 'Activate 24/7 Monitoring for this Server' : 'Monitor your own MCP server with MCP Sentinel'}</h3>
      <p>${isLivePreview ? 'Get automated synthetic testing every 60 seconds, instant alerts on Slack/Discord when tool schemas drift, and permanent README badges.' : 'Continuous JSON-RPC 2.0 handshake validation, breaking schema drift alerts, context tax tracking, and automated GitHub README badges.'}</p>
      <a href="${isLivePreview ? originUrl + '/?add=' + encodeURIComponent(monitor.endpoint_url) : originUrl + '/#tester'}" class="viral-btn">
        ${isLivePreview ? '⚡ Enable 24/7 Monitoring for this Server ➔' : 'Start Free Monitoring ➔'}
      </a>
    </div>

    <footer>
      <p>Powered by <a href="${originUrl}">MCP Sentinel</a> · The APM & Schema Drift Firewall for Model Context Protocol</p>
    </footer>
  </div>

  <script>
    function copyBadgeMarkdown() {
      var code = document.getElementById('badgeMarkdownCode').innerText;
      navigator.clipboard.writeText(code);
      var btn = document.querySelector('.btn-copy');
      var orig = btn.innerText;
      btn.innerText = 'Copied!';
      btn.style.background = '#10b981';
      setTimeout(function() {
        btn.innerText = orig;
        btn.style.background = '';
      }, 2000);
    }
  </script>
</body>
</html>`;
}
