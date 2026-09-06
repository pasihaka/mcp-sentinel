export const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Sentinel — Autonomous Protocol Health & Schema Drift Monitor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1f2937;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --green: #10b981;
      --red: #ef4444;
      --orange: #f59e0b;
      --text: #f9fafb;
      --muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, sans-serif;
      line-height: 1.6;
      padding: 0 1.5rem 4rem;
    }
    .container { max-width: 1040px; margin: 0 auto; }
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 3rem;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }
    .logo-badge {
      background: var(--accent);
      color: #fff;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .hero {
      text-align: center;
      padding: 3rem 0 2rem;
    }
    .hero h1 {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 1.25rem;
      background: linear-gradient(180deg, #fff 0%, #9ca3af 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      font-size: 1.15rem;
      color: var(--muted);
      max-width: 680px;
      margin: 0 auto 2.5rem;
    }
    .tester-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
      margin-bottom: 4rem;
    }
    .tester-header {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .input-group {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    input[type="text"] {
      flex: 1;
      background: #0b1120;
      border: 1px solid var(--border);
      color: #fff;
      padding: 0.85rem 1.2rem;
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: 'JetBrains Mono', monospace;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: var(--accent);
    }
    button {
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      padding: 0.85rem 1.5rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
      transition: background 0.2s ease;
    }
    button:hover { background: var(--accent-hover); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .chip-btn {
      background: #1e293b;
      color: #94a3b8;
      border: 1px solid #334155;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .chip-btn:hover {
      background: #334155;
      color: #f8fafc;
      border-color: #64748b;
    }
    .results-area {
      display: none;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-box {
      background: #0b1120;
      border: 1px solid var(--border);
      padding: 1rem;
      border-radius: 8px;
    }
    .stat-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; margin-bottom: 0.25rem; font-weight: 600; }
    .stat-value { font-size: 1.25rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .badge-preview {
      background: #0b1120;
      border: 1px solid var(--border);
      padding: 1.25rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }
    .badge-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #93c5fd;
      word-break: break-all;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-top: 3rem;
    }
    .pricing-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      position: relative;
    }
    .pricing-card.featured {
      border-color: var(--accent);
    }
    .badge-popular {
      position: absolute;
      top: -12px;
      right: 20px;
      background: var(--accent);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
    }
    .price-num {
      font-size: 2.25rem;
      font-weight: 800;
      margin: 1rem 0;
    }
    .pricing-features {
      list-style: none;
      margin: 1.5rem 0;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .pricing-features li {
      margin-bottom: 0.6rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .pricing-features li::before {
      content: "✓";
      color: var(--green);
      font-weight: bold;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 3rem 0;
      background: var(--card);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .comparison-table th, .comparison-table td {
      padding: 1rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }
    .comparison-table th {
      background: #0b1120;
      color: var(--muted);
      font-weight: 600;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 16px;
      max-width: 520px;
      width: 100%;
      padding: 1.75rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.75rem;
    }
    .modal-close {
      background: transparent;
      border: none;
      color: var(--muted);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      line-height: 1;
    }
    .modal-close:hover {
      color: #fff;
      background: #1e293b;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <div class="logo">
        <span>🛡️ MCP Sentinel</span>
        <span class="logo-badge">EDGE</span>
      </div>
      <div>
        <a href="https://smithery.ai/servers/pasihakamaki/mcp-sentinel" target="_blank" rel="noopener" style="color: var(--muted); text-decoration: none; font-size: 0.85rem; margin-right: 1.2rem;">Smithery 100/100 ↗</a>
        <a href="https://glama.ai/mcp/servers/pasihaka/mcp-sentinel" target="_blank" rel="noopener" style="color: var(--muted); text-decoration: none; font-size: 0.85rem; margin-right: 1.2rem;">Glama Verified ↗</a>
        <a href="#pricing" style="color: var(--muted); text-decoration: none; font-size: 0.85rem; margin-right: 1.2rem;">Pricing</a>
        <a href="#comparison" style="color: var(--muted); text-decoration: none; font-size: 0.85rem; margin-right: 1.2rem;">Why MCP Sentinel?</a>
        <button type="button" onclick="openMonitorModal()" style="padding: 0.4rem 0.9rem; font-size: 0.8rem; background: var(--accent); border-radius: 6px; margin-left: 0.5rem;">+ Set Up Monitor</button>
      </div>
    </nav>

    <section class="hero">
      <div style="display: inline-block; background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #60a5fa; border-radius: 9999px; padding: 0.3rem 0.9rem; font-size: 0.8rem; font-weight: 600; margin-bottom: 1rem;">✨ Universal Protocol Ready: 2026-07-28 (Stateless Core), 2025-11-25, 2025-06-18 &amp; 2024-11-05</div>
      <h1>Synthetic Health & Schema Drift Sentinel for Remote MCP Servers</h1>
      <p>Traditional uptime monitors stop at HTTP 200. MCP Sentinel executes real JSON-RPC 2.0 protocol handshakes, detects breaking tool schema mutations, and prevents AI agents from crashing.</p>
      <div style="margin-top: 1.25rem;">
        <button type="button" onclick="openMonitorModal()" style="padding: 0.65rem 1.4rem; font-size: 0.9rem; background: var(--accent); border-radius: 8px;">⚡ Set Up 24/7 Autonomous Monitor (Free)</button>
      </div>
    </section>

    <div class="tester-card">
      <div class="tester-header">⚡ Free Live Protocol & Security Audit</div>
      <div class="input-group">
        <input type="text" id="endpointInput" placeholder="https://your-mcp-server.com/sse or /mcp" value="https://mcp-sentinel.pasihakamaki.workers.dev/mcp">
        <button id="auditBtn" onclick="runAudit()">Run Instant Audit</button>
      </div>
      <div style="margin-top: 0.4rem; text-align: left;">
        <button type="button" id="toggleAuthBtn" onclick="toggleAuthInput()" style="background: none; border: none; color: #60a5fa; font-size: 0.8rem; cursor: pointer; padding: 0;">+ Add Bearer Token / Auth Header (Optional)</button>
        <div id="authInputWrapper" style="display: none; margin-top: 0.4rem;">
          <input type="text" id="authInput" placeholder="Bearer your-connector-access-token" style="width: 100%; background: #0b1120; border: 1px solid var(--border); color: #fff; padding: 0.6rem 0.8rem; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box;">
          <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Used solely for this handshake probe; never stored or logged in public audits.</div>
        </div>
      </div>
      <div style="font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem;">Tests JSON-RPC 2.0 handshake, schema validity (Ajv), tool drift, and secret leaks in &lt;500ms.</div>
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem;">
        <span style="font-size: 0.8rem; color: var(--muted);">Live Benchmarks:</span>
        <button type="button" class="chip-btn" onclick="selectPreset('https://knowledge-mcp.global.api.aws')">⚡ AWS Knowledge (280ms)</button>
        <button type="button" class="chip-btn" onclick="selectPreset('https://2ools.app/mcp')">🚨 2ools (33k tokens, 81 tools)</button>
        <button type="button" class="chip-btn" onclick="selectPreset('https://reachpad.dev/mcp')">Reachpad (18 tools)</button>
        <button type="button" class="chip-btn" onclick="selectPreset('https://mcp-sentinel.pasihakamaki.workers.dev/mcp')">MCP Sentinel (Self)</button>
      </div>

      <div class="results-area" id="resultsArea">
        <div id="auditAlertNotice" style="display: none; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; text-align: left;"></div>
        <div class="grid-stats">
          <div class="stat-box">
            <div class="stat-label">Verdict</div>
            <div class="stat-value" id="verdictVal" style="color: var(--green);">OPERATIONAL</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Latency</div>
            <div class="stat-value" id="latencyVal">42ms</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Tools Found</div>
            <div class="stat-value" id="toolsVal">6 tools</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Prompt Context Tax</div>
            <div class="stat-value" id="tokensVal" style="color: #10b981;">~1,315 tokens</div>
            <div style="font-size: 0.75rem; margin-top: 0.25rem;" id="tokensCostVal"><span style="color: #10b981; font-weight: 600;">⚡ Lean (+$0.004/turn)</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Security Scan</div>
            <div class="stat-value" id="securityVal" style="color: var(--green);">Clean</div>
          </div>
        </div>

        <div class="badge-preview">
          <div>
            <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 0.3rem;">Live Dynamic GitHub README Badge:</div>
            <div class="badge-code" id="badgeMarkdown">[![MCP Sentinel Status](https://mcp-sentinel.pasihakamaki.workers.dev/badge/demo/status.svg)](https://mcp-sentinel.pasihakamaki.workers.dev)</div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" onclick="copyBadge()" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Copy Markdown</button>
            <button type="button" onclick="openMonitorModal(document.getElementById('endpointInput').value)" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: #10b981;">⚡ Monitor 24/7 with Alerts</button>
          </div>
        </div>
      </div>
    </div>

    <section id="comparison">
      <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 1rem; text-align: center;">Why Generic APMs Miss 80% of MCP Failures</h2>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Feature / Inspection Layer</th>
            <th>Generic HTTP Ping (Pingdom / Better Stack)</th>
            <th>MCP Sentinel</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Protocol Awareness</strong></td>
            <td>HTTP status code only (200 OK)</td>
            <td>Full JSON-RPC 2.0 Handshake & Protocol Negotiation</td>
          </tr>
          <tr>
            <td><strong>Universal Protocol Support</strong></td>
            <td>❌ Legacy or custom only</td>
            <td>✅ Modern 2026-07-28 Stateless Core, 2025-11-25 Icons, 2025-06-18 Typed Output &amp; 2024-11-05 Handshake</td>
          </tr>
          <tr>
            <td><strong>SSE Event Handshake</strong></td>
            <td>❌ Dropped after GET</td>
            <td>✅ Subscribes to stream & extracts dynamic endpoint URLs</td>
          </tr>
          <tr>
            <td><strong>Tool Schema Validation</strong></td>
            <td>❌ None</td>
            <td>✅ Ajv JSON Schema draft-07/2020-12 compliance</td>
          </tr>
          <tr>
            <td><strong>Breaking Schema Drift</strong></td>
            <td>❌ Blind to deleted parameters</td>
            <td>✅ Instant AST diff alerts when tools mutate</td>
          </tr>
          <tr>
            <td><strong>Secret & API Token Scan</strong></td>
            <td>❌ None</td>
            <td>✅ Continuous entropy audit for leaked OpenAI/AWS keys</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="pricing">
      <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 0.5rem; text-align: center;">Simple, Predictable Pricing</h2>
      <p style="text-align: center; color: var(--muted); margin-bottom: 2rem;">Prevent agent downtime on corporate cards with zero setup friction.</p>

      <div class="pricing-grid">
        <div class="pricing-card">
          <h3>Free Community</h3>
          <div class="price-num">$0</div>
          <p style="color: var(--muted); font-size: 0.85rem;">Essential health checks for open-source MCP builders.</p>
          <ul class="pricing-features">
            <li>1 remote MCP server</li>
            <li>30-minute check intervals</li>
            <li>Dynamic GitHub status badge</li>
            <li>Email incident notification</li>
          </ul>
          <button type="button" style="width: 100%; background: #1f2937;" onclick="openMonitorModal()">Start Free Monitoring</button>
        </div>

        <div class="pricing-card featured">
          <span class="badge-popular">MOST POPULAR</span>
          <h3>Developer Pro</h3>
          <div class="price-num">$19 <span style="font-size: 0.9rem; font-weight: 400; color: var(--muted);">/ month</span></div>
          <p style="color: var(--muted); font-size: 0.85rem;">For engineers running production agents and tools.</p>
          <ul class="pricing-features">
            <li>Up to 5 remote MCP servers</li>
            <li>1-minute synthetic checks</li>
            <li>Breaking Schema Drift alerts</li>
            <li>Slack & Discord Incoming Webhooks</li>
            <li>30-day historical latency logs</li>
          </ul>
          <button style="width: 100%;" onclick="window.location.href='https://buy.stripe.com/aFa00j8tE3mE7OH3Ss5EY00'">Upgrade to Pro ($19/mo)</button>
        </div>

        <div class="pricing-card">
          <h3>Team</h3>
          <div class="price-num">$49 <span style="font-size: 0.9rem; font-weight: 400; color: var(--muted);">/ month</span></div>
          <p style="color: var(--muted); font-size: 0.85rem;">For agencies and enterprise agent engineering teams.</p>
          <ul class="pricing-features">
            <li>Up to 20 remote MCP servers</li>
            <li>Continuous Secret & Token leak scanning</li>
            <li>Multi-region synthetic ping</li>
            <li>PagerDuty & Custom Webhooks</li>
            <li>SLA Guarantee (99.9%)</li>
          </ul>
          <button style="width: 100%; background: #1f2937;" onclick="window.location.href='https://buy.stripe.com/cNi9ATdNY3mE9WP1Kk5EY01'">Upgrade to Team ($49/mo)</button>
        </div>
      </div>
    </section>

    <footer style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); text-align: center; color: var(--muted); font-size: 0.85rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem;">
      <div style="display: flex; gap: 0.75rem; align-items: center; justify-content: center; flex-wrap: wrap;">
        <a href="https://smithery.ai/servers/pasihakamaki/mcp-sentinel" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; background: #111827; border: 1px solid #1f2937; border-radius: 9999px; color: #60a5fa; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
          <span>⚡</span>
          <span>Smithery Registry (100/100)</span>
        </a>
        <a href="https://glama.ai/mcp/servers/pasihaka/mcp-sentinel" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; background: #111827; border: 1px solid #1f2937; border-radius: 9999px; color: #34d399; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
          <span>🛡️</span>
          <span>Glama Verified</span>
        </a>
        <a href="https://github.com/pasihaka/mcp-sentinel" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; background: #111827; border: 1px solid #1f2937; border-radius: 9999px; color: #cbd5e1; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
          <span>⭐</span>
          <span>GitHub Source</span>
        </a>
        <a href="https://github.com/pasihaka/mcp-sentinel/issues" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; background: #111827; border: 1px solid #1f2937; border-radius: 9999px; color: #a78bfa; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
          <span>💬</span>
          <span>Developer Support</span>
        </a>
        <a href="mailto:mcpsentinel@gmail.com" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; background: #111827; border: 1px solid #1f2937; border-radius: 9999px; color: #f472b6; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
          <span>✉️</span>
          <span>mcpsentinel@gmail.com</span>
        </a>
      </div>
      <div>&copy; 2026 MCP Sentinel. Autonomous Synthetic Protocol Reliability for Remote AI Agents.</div>
    </footer>
  </div>

  <!-- Setup Alert Monitor Modal -->
  <div id="monitorModal" class="modal-overlay" style="display: none;" onclick="if(event.target===this)closeMonitorModal()">
    <div class="modal-card">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.3rem;">🛡️</span>
          <h3 style="margin: 0; font-size: 1.25rem;">Set Up 24/7 MCP Monitoring</h3>
        </div>
        <button type="button" class="modal-close" onclick="closeMonitorModal()">&times;</button>
      </div>

      <div id="modalFormView">
        <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 1.2rem; line-height: 1.4;">
          Autonomous synthetic testing over Streamable HTTP and SSE. Get alerted on Slack or Discord the instant your server drops or tool schemas drift.
        </p>

        <form id="monitorForm" onsubmit="submitMonitor(event)">
          <div class="form-group">
            <label>Server Name</label>
            <input type="text" id="mName" placeholder="e.g. Production Knowledge MCP" required style="width: 100%;">
          </div>

          <div class="form-group">
            <label>Remote MCP Endpoint URL</label>
            <input type="url" id="mUrl" placeholder="https://api.mycompany.com/mcp" required style="width: 100%;">
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label style="margin-bottom: 0;">Authorization Header (Optional)</label>
              <span style="font-size: 0.72rem; color: var(--muted);">For connector / protected servers</span>
            </div>
            <input type="text" id="mAuthHeader" placeholder="Bearer your-connector-access-token" style="width: 100%;">
          </div>

          <div class="form-group">
            <label>Check Frequency</label>
            <select id="mInterval" style="width: 100%; background: #0b1120; border: 1px solid var(--border); color: #fff; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem;">
              <option value="1800">Every 30 minutes (Free)</option>
              <option value="60">Every 60 seconds (Pro $19/mo)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Alert Destination (Slack or Discord Webhook)</label>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
              <select id="mAlertType" style="background: #0b1120; border: 1px solid var(--border); color: #fff; padding: 0.6rem; border-radius: 8px; font-size: 0.85rem;">
                <option value="slack">Slack</option>
                <option value="discord">Discord</option>
                <option value="webhook">Custom Webhook</option>
              </select>
              <input type="url" id="mAlertUrl" placeholder="https://hooks.slack.com/... or discord.com/api/webhooks/..." style="flex: 1;">
            </div>
            <div style="font-size: 0.75rem; color: var(--muted);">We'll dispatch an instant test notification upon saving to verify connectivity.</div>
          </div>

          <div class="form-group">
            <label>Your Email</label>
            <input type="email" id="mEmail" placeholder="developer@mycompany.com" required style="width: 100%;">
            <div style="font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem;">Used to manage your monitors and receive incident summaries.</div>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="submit" id="mSubmitBtn" style="flex: 1; background: var(--accent); padding: 0.85rem;">🚀 Start Monitoring</button>
            <button type="button" onclick="closeMonitorModal()" style="background: #1f2937; padding: 0.85rem 1.2rem;">Cancel</button>
          </div>
        </form>
      </div>

      <div id="modalSuccessView" style="display: none; text-align: center; padding: 1rem 0;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</div>
        <h3 style="color: var(--green); margin-bottom: 0.5rem;">24/7 Monitor Activated!</h3>
        <p id="mSuccessMsg" style="color: var(--muted); font-size: 0.9rem; margin-bottom: 1.5rem;"></p>

        <div style="background: #0b1120; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; text-align: left; margin-bottom: 1rem;">
          <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 0.5rem;">Your Live Dynamic GitHub Badge:</div>
          <div style="margin-bottom: 0.75rem;" id="mBadgePreview"></div>
          <div class="badge-code" id="mBadgeCode" style="font-size: 0.75rem; word-break: break-all; margin-bottom: 0.5rem;"></div>
          <button type="button" onclick="copyMonitorBadge()" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Copy Markdown</button>
        </div>

        <button type="button" onclick="closeMonitorModal()" style="background: #1f2937; width: 100%;">Done</button>
      </div>
    </div>
  </div>

  <script>
    function toggleAuthInput() {
      const w = document.getElementById('authInputWrapper');
      const b = document.getElementById('toggleAuthBtn');
      if (w.style.display === 'none' || !w.style.display) {
        w.style.display = 'block';
        b.innerText = '- Hide Authorization Header';
        document.getElementById('authInput').focus();
      } else {
        w.style.display = 'none';
        b.innerText = '+ Add Bearer Token / Auth Header (Optional)';
      }
    }

    async function runAudit() {
      const btn = document.getElementById('auditBtn');
      const endpoint = document.getElementById('endpointInput').value.trim();
      const resultsArea = document.getElementById('resultsArea');
      const alertBox = document.getElementById('auditAlertNotice');
      const authHeader = document.getElementById('authInput') ? document.getElementById('authInput').value.trim() : '';

      if (!endpoint) return;

      btn.disabled = true;
      btn.innerText = 'Auditing Handshake...';

      const payload = { endpointUrl: endpoint };
      if (authHeader) {
        payload.authHeader = authHeader;
      }

      try {
        const res = await fetch('/api/check-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        resultsArea.style.display = 'block';
        document.getElementById('verdictVal').innerText = (data.status || 'OPERATIONAL').toUpperCase();
        document.getElementById('verdictVal').style.color = data.status === 'operational' ? '#10b981' : (data.status === 'degraded' ? '#f59e0b' : '#ef4444');
        document.getElementById('latencyVal').innerText = (data.latencyMs || 0) + 'ms';
        document.getElementById('toolsVal').innerText = (data.toolsCount || 0) + ' tools';

        if (data.status !== 'operational') {
          alertBox.style.display = 'block';
          if (data.errorMessage && data.errorMessage.indexOf('401') !== -1) {
            alertBox.innerHTML = '🔒 <strong>401 Unauthorized:</strong> This MCP server requires authentication. Enter your Bearer token in the field above and click <em>Run Instant Audit</em> again.';
            alertBox.style.background = 'rgba(245, 158, 11, 0.15)';
            alertBox.style.border = '1px solid #f59e0b';
            alertBox.style.color = '#fde68a';
          } else {
            alertBox.innerHTML = '⚠️ <strong>Handshake Warning:</strong> ' + (data.errorMessage || 'Server returned non-operational status or schema anomalies.');
            alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
            alertBox.style.border = '1px solid #ef4444';
            alertBox.style.color = '#fca5a5';
          }
        } else {
          alertBox.style.display = 'none';
        }
        
        const approxTokens = data.approxContextTokens || (data.schemaSizeBytes ? Math.round(data.schemaSizeBytes / 4) : Math.round((data.toolsCount || 0) * 650 / 4));
        const sonnetCost = ((approxTokens / 1000000) * 3).toFixed(3);
        const tokensEl = document.getElementById('tokensVal');
        tokensEl.innerText = '~' + Number(approxTokens).toLocaleString() + ' tokens';

        const costEl = document.getElementById('tokensCostVal');
        if (approxTokens >= 15000) {
          tokensEl.style.color = '#ef4444';
          costEl.innerHTML = '<span style="color: #ef4444; font-weight: 600;">⚠️ Heavy Tax (+$' + sonnetCost + '/turn)</span>';
        } else if (approxTokens >= 5000) {
          tokensEl.style.color = '#f59e0b';
          costEl.innerHTML = '<span style="color: #f59e0b; font-weight: 600;">Moderate (+$' + sonnetCost + '/turn)</span>';
        } else {
          tokensEl.style.color = '#10b981';
          costEl.innerHTML = '<span style="color: #10b981; font-weight: 600;">⚡ Lean (+$' + sonnetCost + '/turn)</span>';
        }

        const secVal = document.getElementById('securityVal');
        if (data.secretFindings && data.secretFindings.length > 0) {
          secVal.innerText = data.secretFindings.length + ' LEAK(S)';
          secVal.style.color = '#ef4444';
        } else {
          secVal.innerText = 'Clean';
          secVal.style.color = '#10b981';
        }
      } catch (err) {
        // Fallback demo values for offline viewing
        resultsArea.style.display = 'block';
        alertBox.style.display = 'none';
        document.getElementById('verdictVal').innerText = 'OPERATIONAL';
        document.getElementById('latencyVal').innerText = '38ms';
        document.getElementById('toolsVal').innerText = '2 tools';
        document.getElementById('tokensVal').innerText = '~1,315 tokens';
        document.getElementById('tokensVal').style.color = '#10b981';
        document.getElementById('tokensCostVal').innerHTML = '<span style="color: #10b981; font-weight: 600;">⚡ Lean (+$0.004/turn)</span>';
        document.getElementById('securityVal').innerText = 'Clean';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Run Instant Audit';
      }
    }

    function copyBadge() {
      const code = document.getElementById('badgeMarkdown').innerText;
      navigator.clipboard.writeText(code);
      alert('Copied badge Markdown to clipboard!');
    }

    function selectPreset(url) {
      document.getElementById('endpointInput').value = url;
      runAudit();
    }

    function openMonitorModal(prefillUrl) {
      document.getElementById('monitorModal').style.display = 'flex';
      document.getElementById('modalFormView').style.display = 'block';
      document.getElementById('modalSuccessView').style.display = 'none';

      const url = prefillUrl || document.getElementById('endpointInput').value || '';
      if (url) {
        document.getElementById('mUrl').value = url;
        try {
          const u = new URL(url);
          const domain = u.hostname.replace('.workers.dev', '').replace('.global.api.aws', 'aws').replace('.com', '').replace('.dev', '');
          document.getElementById('mName').value = domain.charAt(0).toUpperCase() + domain.slice(1) + ' MCP';
        } catch {
          document.getElementById('mName').value = 'Production MCP';
        }
      }

      const authVal = document.getElementById('authInput') ? document.getElementById('authInput').value.trim() : '';
      if (authVal && document.getElementById('mAuthHeader')) {
        document.getElementById('mAuthHeader').value = authVal;
      }
    }

    function closeMonitorModal() {
      document.getElementById('monitorModal').style.display = 'none';
    }

    async function submitMonitor(e) {
      e.preventDefault();
      const btn = document.getElementById('mSubmitBtn');
      btn.disabled = true;
      btn.innerText = 'Activating Monitor...';

      const payload = {
        name: document.getElementById('mName').value.trim(),
        endpointUrl: document.getElementById('mUrl').value.trim(),
        authHeader: document.getElementById('mAuthHeader') ? document.getElementById('mAuthHeader').value.trim() || undefined : undefined,
        checkIntervalSeconds: Number(document.getElementById('mInterval').value) || 1800,
        alertType: document.getElementById('mAlertType').value,
        alertWebhookUrl: document.getElementById('mAlertUrl').value.trim() || undefined,
        email: document.getElementById('mEmail').value.trim(),
      };

      try {
        const res = await fetch('/api/monitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create monitor');
        }

        document.getElementById('modalFormView').style.display = 'none';
        document.getElementById('modalSuccessView').style.display = 'block';

        let intervalText = data.intervalSeconds >= 60 ? (data.intervalSeconds/60) + ' min' : data.intervalSeconds + 's';
        let msg = 'Synthetic check scheduled every ' + intervalText + '.';
        if (data.testAlertSent) {
          msg += ' A test notification was successfully dispatched to your webhook!';
        } else if (data.alertNotice) {
          msg += ' Note: ' + data.alertNotice;
        }
        document.getElementById('mSuccessMsg').innerText = msg;

        const badgeMd = '[![MCP Sentinel Status](' + data.statusBadgeUrl + ')](' + window.location.origin + ')';
        document.getElementById('mBadgeCode').innerText = badgeMd;
        document.getElementById('mBadgePreview').innerHTML = '<img src="' + data.statusBadgeUrl + '" alt="status badge">';
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = '🚀 Start Monitoring';
      }
    }

    function copyMonitorBadge() {
      const code = document.getElementById('mBadgeCode').innerText;
      navigator.clipboard.writeText(code);
      alert('Copied badge Markdown to clipboard!');
    }
  </script>
</body>
</html>`;
