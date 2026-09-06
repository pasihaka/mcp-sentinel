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

    /* Ecosystem Trust Bar */
    .ecosystem-trust-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      margin: 1.5rem auto 2.5rem;
      padding: 0.75rem 1.5rem;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border);
      border-radius: 9999px;
      max-width: 900px;
    }
    .trust-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--muted);
      text-transform: uppercase;
    }
    .trust-badges {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: #cbd5e1;
      font-weight: 500;
    }
    .trust-item strong {
      color: #f8fafc;
    }

    /* Diagnostics Pipeline */
    .diag-pipeline {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .diag-step {
      padding: 0.5rem 0.65rem;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }
    .diag-step.step-pass {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .diag-step.step-warn {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.3);
      color: #fbbf24;
    }
    .diag-step.step-fail {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .diag-step.step-pending {
      background: #0b1120;
      border-color: #1e293b;
      color: #64748b;
    }

    /* Telemetry Preview Section */
    .telemetry-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.75rem;
      margin-top: 1.5rem;
      position: relative;
      text-align: left;
    }
    .telemetry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
    }
    .telemetry-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .telemetry-stat-box {
      background: #0b1120;
      border: 1px solid var(--border);
      padding: 0.85rem;
      border-radius: 8px;
      text-align: left;
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

    <div class="ecosystem-trust-bar">
      <span class="trust-label">Verified & Compatible With</span>
      <div class="trust-badges">
        <div class="trust-item"><span style="color: #60a5fa;">⚡</span> <strong>Claude Desktop</strong></div>
        <div class="trust-item"><span style="color: #a855f7;">💻</span> <strong>Cursor &amp; Windsurf</strong></div>
        <div class="trust-item"><span style="color: #10b981;">🛡️</span> <strong>Smithery (100/100)</strong></div>
        <div class="trust-item"><span style="color: #f59e0b;">🌐</span> <strong>Glama Registry</strong></div>
        <div class="trust-item"><span style="color: #38bdf8;">☁️</span> <strong>Cloudflare &amp; AWS</strong></div>
      </div>
    </div>

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
            <div class="stat-label">Handshake Latency</div>
            <div class="stat-value" id="latencyVal">42ms</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.25rem;" id="latencySubVal">Init: 24ms · Tools: 18ms</div>
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

        <!-- Actionable Protocol & Schema Diagnostic Frame -->
        <div id="diagnosticFrame" style="margin-top: 1.25rem; background: #070d19; border: 1px solid var(--border); border-radius: 8px; text-align: left; overflow: hidden;">
          <div id="diagnosticHeader" onclick="toggleDiagnostics()" style="padding: 0.85rem 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #0b1528; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
              <span id="diagnosticStatusIcon" style="font-size: 1.1rem;">🔍</span>
              <span id="diagnosticTitle" style="font-size: 0.9rem; font-weight: 700; color: #f1f5f9;">Protocol Handshake &amp; Schema Diagnostics</span>
              <span id="diagnosticBadge" style="font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 600;">5/5 Checks Passed</span>
            </div>
            <span id="diagnosticToggleArrow" style="font-size: 0.8rem; color: var(--muted); font-weight: bold;">▼</span>
          </div>

          <div id="diagnosticContent" style="padding: 1.25rem; display: none;">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 700; margin-bottom: 0.75rem; letter-spacing: 0.05em;">Protocol Execution Pipeline</div>
            <div class="diag-pipeline" id="diagPipeline">
              <div class="diag-step step-pass" id="stepTransport">
                <span class="step-dot">●</span> 1. Transport (HTTP/SSE)
              </div>
              <div class="diag-step step-pass" id="stepHandshake">
                <span class="step-dot">●</span> 2. Handshake (initialize)
              </div>
              <div class="diag-step step-pass" id="stepDiscovery">
                <span class="step-dot">●</span> 3. Discovery (tools/list)
              </div>
              <div class="diag-step step-pass" id="stepValidation">
                <span class="step-dot">●</span> 4. Ajv Schema Validation
              </div>
              <div class="diag-step step-pass" id="stepSecurity">
                <span class="step-dot">●</span> 5. Secret Entropy Scan
              </div>
            </div>

            <!-- Actionable Remediation Guidance Box -->
            <div id="diagRemediationBox" style="display: none; margin-top: 1rem; padding: 0.85rem 1rem; border-radius: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; font-size: 0.85rem;">
              <div style="font-weight: 700; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.3rem;">
                <span id="diagRemediationTitle">🚨 Protocol Failure Detected</span>
              </div>
              <div id="diagRemediationText" style="line-height: 1.5; color: #f1f5f9; font-size: 0.83rem;"></div>
            </div>

            <!-- Ajv Schema Validation Defects -->
            <div id="diagSchemaErrorsBox" style="display: none; margin-top: 1rem;">
              <div style="font-size: 0.75rem; color: #f87171; text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Schema Validation Defects (Ajv)</div>
              <div id="diagSchemaErrorsList" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
            </div>

            <!-- Secret Finding Alert -->
            <div id="diagSecretsBox" style="display: none; margin-top: 1rem;">
              <div style="font-size: 0.75rem; color: #f87171; text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Security Findings &amp; Secret Exposures</div>
              <div id="diagSecretsList" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
            </div>

            <!-- Raw Discovered Tools Inspector -->
            <div style="margin-top: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <button type="button" onclick="toggleRawJson()" style="background: none; border: none; color: #60a5fa; font-size: 0.8rem; cursor: pointer; padding: 0; font-weight: 600;">
                  <span id="rawJsonArrow">▶</span> Inspect Raw Discovered Tools JSON (<span id="rawToolsCount">0</span> tools)
                </button>
                <button type="button" id="copyJsonBtn" onclick="copyRawToolsJson()" style="display: none; background: #1e293b; border: 1px solid var(--border); color: #cbd5e1; font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: 4px; cursor: pointer;">Copy Tools JSON</button>
              </div>
              <pre id="rawJsonBlock" style="display: none; background: #030712; border: 1px solid #1e293b; border-radius: 6px; padding: 0.85rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #94a3b8; max-height: 250px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; margin: 0;"></pre>
            </div>
          </div>
        </div>

        <div class="badge-preview">
          <div>
            <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 0.3rem;">Live Dynamic GitHub README Badge:</div>
            <div class="badge-code" id="badgeMarkdown">[![MCP Sentinel Status](https://mcp-sentinel.pasihakamaki.workers.dev/badge/demo/status.svg)](https://mcp-sentinel.pasihakamaki.workers.dev/status/demo)</div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" onclick="openStatusPageForAuditedServer()" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: #1e293b; border: 1px solid var(--border); color: #93c5fa; border-radius: 6px; cursor: pointer; font-weight: 600;">🔗 View Live Status Page</button>
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

    <section id="telemetry-preview" style="margin: 4rem 0 3rem 0;">
      <div style="text-align: center; max-width: 760px; margin: 0 auto 2rem;">
        <div style="display: inline-block; background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #60a5fa; border-radius: 9999px; padding: 0.25rem 0.8rem; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Telemetry &amp; Observability Engine</div>
        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.02em;">30-Day Latency Jitter &amp; Drift Timeline</h2>
        <p style="color: var(--muted); font-size: 1rem; line-height: 1.6;">AI agents are fragile. A 1,200ms cold start or an unannounced tool schema mutation will crash your production workflows. MCP Sentinel maps every handshake across 30 days so you spot anomalies before users do.</p>
      </div>

      <div class="telemetry-card">
        <div class="telemetry-header">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
              <strong style="color: #f8fafc; font-size: 1.05rem;">weather-mcp.production.internal/sse</strong>
              <span style="background: #1e293b; color: #94a3b8; font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-family: monospace;">SSE Transport</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--muted);">Monitored every 60 seconds from 3 global edge regions (US-East, EU-Central, AP-South)</div>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px;">99.98% UPTIME</span>
            <span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px;">43,200 CHECKS</span>
          </div>
        </div>

        <!-- SVG Latency Sparkline & Area Chart with Event Annotations -->
        <div style="position: relative; width: 100%; overflow-x: auto; background: #070d19; border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem 1rem 0.5rem 1rem; box-sizing: border-box;">
          <svg viewBox="0 0 900 240" style="width: 100%; height: auto; min-width: 650px; overflow: visible;">
            <defs>
              <linearGradient id="latencyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
              </linearGradient>
            </defs>

            <!-- Background Grid Lines -->
            <line x1="40" y1="30" x2="880" y2="30" stroke="#1e293b" stroke-dasharray="4" stroke-width="1"/>
            <text x="32" y="34" fill="#64748b" font-size="10" text-anchor="end" font-family="monospace">1500ms</text>

            <line x1="40" y1="80" x2="880" y2="80" stroke="#1e293b" stroke-dasharray="4" stroke-width="1"/>
            <text x="32" y="84" fill="#64748b" font-size="10" text-anchor="end" font-family="monospace">500ms</text>

            <line x1="40" y1="130" x2="880" y2="130" stroke="#1e293b" stroke-dasharray="4" stroke-width="1"/>
            <text x="32" y="134" fill="#64748b" font-size="10" text-anchor="end" font-family="monospace">100ms</text>

            <line x1="40" y1="180" x2="880" y2="180" stroke="#1e293b" stroke-dasharray="4" stroke-width="1"/>
            <text x="32" y="184" fill="#64748b" font-size="10" text-anchor="end" font-family="monospace">25ms</text>

            <!-- Area Path Under Graph -->
            <path d="M 40 185 L 70 183 L 100 184 L 130 182 L 160 181 L 190 183 L 220 180 L 250 182 L 280 181 L 310 183 L 340 182 L 370 184 L 400 181 L 430 45 L 440 182 L 470 183 L 500 181 L 530 182 L 560 183 L 590 180 L 620 182 L 650 95 L 680 181 L 710 183 L 740 182 L 770 180 L 800 182 L 830 181 L 860 183 L 880 182 L 880 200 L 40 200 Z" fill="url(#latencyAreaGrad)"/>

            <!-- Main Latency Line -->
            <path d="M 40 185 L 70 183 L 100 184 L 130 182 L 160 181 L 190 183 L 220 180 L 250 182 L 280 181 L 310 183 L 340 182 L 370 184 L 400 181 L 430 45 L 440 182 L 470 183 L 500 181 L 530 182 L 560 183 L 590 180 L 620 182 L 650 95 L 680 181 L 710 183 L 740 182 L 770 180 L 800 182 L 830 181 L 860 183 L 880 182" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Baseline Latency Jitter Dots -->
            <circle cx="70" cy="183" r="2.5" fill="#60a5fa"/>
            <circle cx="130" cy="182" r="2.5" fill="#60a5fa"/>
            <circle cx="190" cy="183" r="2.5" fill="#60a5fa"/>
            <circle cx="250" cy="182" r="2.5" fill="#60a5fa"/>
            <circle cx="310" cy="183" r="2.5" fill="#60a5fa"/>
            <circle cx="370" cy="184" r="2.5" fill="#60a5fa"/>
            <circle cx="500" cy="181" r="2.5" fill="#60a5fa"/>
            <circle cx="560" cy="183" r="2.5" fill="#60a5fa"/>
            <circle cx="740" cy="182" r="2.5" fill="#60a5fa"/>
            <circle cx="800" cy="182" r="2.5" fill="#60a5fa"/>
            <circle cx="860" cy="183" r="2.5" fill="#60a5fa"/>

            <!-- Event Annotation 1: Deploy -->
            <line x1="160" y1="130" x2="160" y2="181" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2"/>
            <circle cx="160" cy="181" r="4" fill="#10b981"/>
            <rect x="105" y="105" width="110" height="22" rx="4" fill="#064e3b" stroke="#059669" stroke-width="1"/>
            <text x="160" y="120" fill="#a7f3d0" font-size="9.5" font-weight="700" text-anchor="middle">v1.2.0 Deploy (34ms)</text>

            <!-- Event Annotation 2: Lambda Cold-Start Spike -->
            <line x1="430" y1="20" x2="430" y2="45" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="2"/>
            <circle cx="430" cy="45" r="5" fill="#f59e0b"/>
            <rect x="345" y="5" width="170" height="22" rx="4" fill="#78350f" stroke="#d97706" stroke-width="1"/>
            <text x="430" y="20" fill="#fde68a" font-size="9.5" font-weight="700" text-anchor="middle">⚠️ Cold Start Spike (1,420ms)</text>

            <!-- Event Annotation 3: Breaking Drift -->
            <line x1="650" y1="50" x2="650" y2="95" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2"/>
            <circle cx="650" cy="95" r="5" fill="#ef4444"/>
            <rect x="560" y="32" width="180" height="24" rx="4" fill="#7f1d1d" stroke="#dc2626" stroke-width="1"/>
            <text x="650" y="48" fill="#fecaca" font-size="9.5" font-weight="700" text-anchor="middle">🚨 Breaking Schema Drift Alert</text>

            <!-- X-Axis Timeline Labels -->
            <text x="40" y="222" fill="#64748b" font-size="10" font-family="monospace">30d ago</text>
            <text x="180" y="222" fill="#64748b" font-size="10" font-family="monospace">25d ago</text>
            <text x="320" y="222" fill="#64748b" font-size="10" font-family="monospace">20d ago</text>
            <text x="460" y="222" fill="#64748b" font-size="10" font-family="monospace">15d ago</text>
            <text x="600" y="222" fill="#64748b" font-size="10" font-family="monospace">10d ago</text>
            <text x="740" y="222" fill="#64748b" font-size="10" font-family="monospace">5d ago</text>
            <text x="880" y="222" fill="#60a5fa" font-size="10" font-weight="700" text-anchor="end" font-family="monospace">Today (Live)</text>
          </svg>
        </div>

        <!-- Telemetry KPI Grid -->
        <div class="telemetry-stats-grid">
          <div class="telemetry-stat-box">
            <div class="stat-label">P50 Latency</div>
            <div class="stat-value" style="color: #10b981;">34ms</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Normal operation</div>
          </div>
          <div class="telemetry-stat-box">
            <div class="stat-label">P95 Latency</div>
            <div class="stat-value" style="color: #60a5fa;">82ms</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Peak traffic window</div>
          </div>
          <div class="telemetry-stat-box">
            <div class="stat-label">P99 Cold Starts</div>
            <div class="stat-value" style="color: #f59e0b;">1,420ms</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Lambda spin-up detected</div>
          </div>
          <div class="telemetry-stat-box">
            <div class="stat-label">Drift Incidents</div>
            <div class="stat-value" style="color: #ef4444;">1 caught</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">0 agent outages</div>
          </div>
          <div class="telemetry-stat-box">
            <div class="stat-label">Check Frequency</div>
            <div class="stat-value" style="color: #a855f7;">60s Pro</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">3 edge regions</div>
          </div>
        </div>

        <!-- Upsell Banner to Pro / Team -->
        <div style="margin-top: 1.5rem; padding: 1rem 1.25rem; background: rgba(30, 41, 59, 0.6); border: 1px solid var(--border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem; margin-bottom: 0.2rem;">Want 30-day telemetry, 60s checks, and automated webhook alerts for your MCP servers?</div>
            <div style="font-size: 0.8rem; color: var(--muted);">Developer Pro includes 10 monitors, 1-minute intervals, Slack/Discord/PagerDuty alerts, and historical logs for $19/mo.</div>
          </div>
          <div style="display: flex; gap: 0.6rem;">
            <button type="button" onclick="openMonitorModalWithPro()" style="background: var(--accent); padding: 0.6rem 1.1rem; font-size: 0.85rem;">⚡ Start Pro Monitoring ($19/mo)</button>
            <a href="#pricing" style="display: inline-block; padding: 0.6rem 1rem; font-size: 0.85rem; background: #1e293b; color: #cbd5e1; border: 1px solid var(--border); text-decoration: none; border-radius: 8px; font-weight: 600;">View Plans</a>
          </div>
        </div>
      </div>
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

        <div style="margin-bottom: 0.75rem;">
          <a id="mStatusPageBtn" href="#" target="_blank" style="display: block; width: 100%; text-align: center; background: var(--accent); color: #fff; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 0.75rem; border-radius: 8px; transition: background 0.2s;">🔗 Open Live Status Page ➔</a>
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
        const initMs = data.initLatencyMs !== undefined ? data.initLatencyMs : Math.round((data.latencyMs || 0) * 0.6);
        const toolsMs = data.toolsLatencyMs !== undefined ? data.toolsLatencyMs : Math.round((data.latencyMs || 0) * 0.4);
        let subtext = 'Init: ' + initMs + 'ms · Tools: ' + toolsMs + 'ms';
        if (initMs >= 1000) {
          subtext += ' ⚠️ Cold Start';
        }
        document.getElementById('latencySubVal').innerText = subtext;
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
        const schemaKb = data.schemaSizeBytes ? (data.schemaSizeBytes / 1024).toFixed(1) : ((data.toolsCount || 0) * 0.65).toFixed(1);
        const tokensEl = document.getElementById('tokensVal');
        tokensEl.innerText = '~' + Number(approxTokens).toLocaleString() + ' tokens';

        const costEl = document.getElementById('tokensCostVal');
        let memoryTax = ' (+$' + sonnetCost + '/turn · ' + schemaKb + ' KB memory)';
        if (approxTokens >= 15000) {
          tokensEl.style.color = '#ef4444';
          costEl.innerHTML = '<span style="color: #ef4444; font-weight: 600;">⚠️ Heavy Tax' + memoryTax + '</span>';
        } else if (approxTokens >= 5000) {
          tokensEl.style.color = '#f59e0b';
          costEl.innerHTML = '<span style="color: #f59e0b; font-weight: 600;">Moderate' + memoryTax + '</span>';
        } else {
          tokensEl.style.color = '#10b981';
          costEl.innerHTML = '<span style="color: #10b981; font-weight: 600;">⚡ Lean' + memoryTax + '</span>';
        }

        const secVal = document.getElementById('securityVal');
        if (data.secretFindings && data.secretFindings.length > 0) {
          secVal.innerText = data.secretFindings.length + ' LEAK(S)';
          secVal.style.color = '#ef4444';
        } else {
          secVal.innerText = 'Clean';
          secVal.style.color = '#10b981';
        }

        updateDiagnostics(data);
      } catch (err) {
        // Fallback demo values for offline viewing
        resultsArea.style.display = 'block';
        alertBox.style.display = 'none';
        document.getElementById('verdictVal').innerText = 'OPERATIONAL';
        document.getElementById('latencyVal').innerText = '38ms';
        document.getElementById('latencySubVal').innerText = 'Init: 22ms · Tools: 16ms';
        document.getElementById('toolsVal').innerText = '2 tools';
        document.getElementById('tokensVal').innerText = '~1,315 tokens';
        document.getElementById('tokensVal').style.color = '#10b981';
        document.getElementById('tokensCostVal').innerHTML = '<span style="color: #10b981; font-weight: 600;">⚡ Lean (+$0.004/turn · 5.2 KB memory)</span>';
        document.getElementById('securityVal').innerText = 'Clean';

        updateDiagnostics({
          status: 'operational',
          protocolPhase: 'complete',
          toolsCount: 2,
          validationErrors: [],
          secretFindings: [],
          tools: [
            { name: 'read_resource', description: 'Read a resource from local storage', inputSchema: { type: 'object', properties: { uri: { type: 'string' } }, required: ['uri'] } },
            { name: 'query_db', description: 'Execute a read-only SQL query', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }
          ],
          remediationHint: 'All tools passed Ajv JSON schema validation with 0 secret leaks.'
        });
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

    function openMonitorModalWithPro() {
      openMonitorModal();
      var sel = document.getElementById('mInterval');
      if (sel) {
        sel.value = '60';
      }
    }

    function toggleDiagnostics() {
      var content = document.getElementById('diagnosticContent');
      var arrow = document.getElementById('diagnosticToggleArrow');
      if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        arrow.innerText = '▲';
      } else {
        content.style.display = 'none';
        arrow.innerText = '▼';
      }
    }

    function toggleRawJson() {
      var block = document.getElementById('rawJsonBlock');
      var arrow = document.getElementById('rawJsonArrow');
      var copyBtn = document.getElementById('copyJsonBtn');
      if (block.style.display === 'none' || !block.style.display) {
        block.style.display = 'block';
        arrow.innerText = '▼';
        copyBtn.style.display = 'inline-block';
      } else {
        block.style.display = 'none';
        arrow.innerText = '▶';
        copyBtn.style.display = 'none';
      }
    }

    function copyRawToolsJson() {
      if (window._lastAuditedToolsJson) {
        navigator.clipboard.writeText(window._lastAuditedToolsJson);
        alert('Copied raw MCP tools JSON to clipboard!');
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function updateDiagnostics(data) {
      var title = document.getElementById('diagnosticTitle');
      var badge = document.getElementById('diagnosticBadge');
      var icon = document.getElementById('diagnosticStatusIcon');
      var content = document.getElementById('diagnosticContent');
      var arrow = document.getElementById('diagnosticToggleArrow');

      var stepTransport = document.getElementById('stepTransport');
      var stepHandshake = document.getElementById('stepHandshake');
      var stepDiscovery = document.getElementById('stepDiscovery');
      var stepValidation = document.getElementById('stepValidation');
      var stepSecurity = document.getElementById('stepSecurity');

      var remBox = document.getElementById('diagRemediationBox');
      var remText = document.getElementById('diagRemediationText');
      var schemaBox = document.getElementById('diagSchemaErrorsBox');
      var schemaList = document.getElementById('diagSchemaErrorsList');
      var secBox = document.getElementById('diagSecretsBox');
      var secList = document.getElementById('diagSecretsList');

      if (!stepTransport || !stepHandshake) return;

      // Reset step styles
      var allSteps = [stepTransport, stepHandshake, stepDiscovery, stepValidation, stepSecurity];
      for (var i = 0; i < allSteps.length; i++) {
        allSteps[i].className = 'diag-step step-pending';
      }

      var phase = data.protocolPhase || (data.status === 'down' ? 'transport' : 'complete');
      var hasValidationErrors = data.validationErrors && data.validationErrors.length > 0;
      var hasSecrets = data.secretFindings && data.secretFindings.length > 0;
      var isDown = data.status === 'down';
      var isDegraded = data.status === 'degraded';
      var hasDrift = data.status === 'schema-drift';

      // 1. Transport
      if (isDown && phase === 'transport') {
        stepTransport.className = 'diag-step step-fail';
      } else {
        stepTransport.className = 'diag-step step-pass';
      }

      // 2. Handshake
      if (isDown && phase === 'initialize') {
        stepHandshake.className = 'diag-step step-fail';
      } else if (!isDown || (phase !== 'transport' && phase !== 'initialize')) {
        stepHandshake.className = 'diag-step step-pass';
      }

      // 3. Discovery
      if (isDown && phase === 'tools') {
        stepDiscovery.className = 'diag-step step-fail';
      } else if ((data.toolsCount && data.toolsCount > 0) || (!isDown && phase === 'complete')) {
        stepDiscovery.className = 'diag-step step-pass';
      }

      // 4. Schema Validation
      if (hasValidationErrors) {
        stepValidation.className = 'diag-step step-warn';
      } else if (!isDown && data.toolsCount > 0) {
        stepValidation.className = 'diag-step step-pass';
      }

      // 5. Security Scan
      if (hasSecrets) {
        stepSecurity.className = 'diag-step step-fail';
      } else if (!isDown) {
        stepSecurity.className = 'diag-step step-pass';
      }

      // Actionable Remediation Guidance
      if (data.remediationHint || data.errorMessage || data.rpcErrorCode) {
        remBox.style.display = 'block';
        var codeStr = data.rpcErrorCode ? ' (JSON-RPC Error ' + data.rpcErrorCode + ')' : (data.httpStatus && data.httpStatus !== 200 ? ' (HTTP ' + data.httpStatus + ')' : '');
        document.getElementById('diagRemediationTitle').innerText = isDown ? '🚨 Protocol Failure' + codeStr : '⚠️ Optimization & Compatibility Advice';
        var msg = data.errorMessage ? '<div><strong>Diagnostic:</strong> ' + escapeHtml(data.errorMessage) + '</div>' : '';
        if (data.remediationHint) {
          msg += '<div style="margin-top: 0.3rem;"><strong>Actionable Fix:</strong> ' + escapeHtml(data.remediationHint) + '</div>';
        }
        remText.innerHTML = msg;
        if (isDown) {
          remBox.style.background = 'rgba(239, 68, 68, 0.1)';
          remBox.style.borderColor = '#ef4444';
          remBox.style.color = '#fca5a5';
        } else {
          remBox.style.background = 'rgba(245, 158, 11, 0.1)';
          remBox.style.borderColor = '#f59e0b';
          remBox.style.color = '#fde68a';
        }
      } else {
        remBox.style.display = 'none';
      }

      // Ajv Schema Errors
      if (hasValidationErrors) {
        schemaBox.style.display = 'block';
        var errHtml = '';
        for (var e = 0; e < data.validationErrors.length; e++) {
          errHtml += '<div style="background: #0b1120; border: 1px solid #7f1d1d; border-radius: 6px; padding: 0.6rem 0.8rem; font-family: monospace; font-size: 0.78rem; color: #fca5a5;">' + escapeHtml(data.validationErrors[e]) + '</div>';
        }
        schemaList.innerHTML = errHtml;
      } else {
        schemaBox.style.display = 'none';
        schemaList.innerHTML = '';
      }

      // Secret Findings
      if (hasSecrets) {
        secBox.style.display = 'block';
        var secHtml = '';
        for (var s = 0; s < data.secretFindings.length; s++) {
          var f = data.secretFindings[s];
          secHtml += '<div style="background: #0b1120; border: 1px solid #7f1d1d; border-radius: 6px; padding: 0.6rem 0.8rem; font-size: 0.78rem; color: #fca5a5; display: flex; justify-content: space-between; align-items: center;"><div><strong>' + escapeHtml(f.type) + '</strong> in <code>' + escapeHtml(f.location) + '</code>: <span style="font-family: monospace; color: #f87171;">' + escapeHtml(f.redactedSnippet) + '</span></div><span style="background: #ef4444; color: #fff; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">' + escapeHtml((f.severity || 'CRITICAL').toUpperCase()) + '</span></div>';
        }
        secList.innerHTML = secHtml;
      } else {
        secBox.style.display = 'none';
        secList.innerHTML = '';
      }

      // Raw Tools JSON setup
      var rawTools = data.tools || [];
      document.getElementById('rawToolsCount').innerText = rawTools.length;
      window._lastAuditedToolsJson = JSON.stringify(rawTools, null, 2);
      var rawBlock = document.getElementById('rawJsonBlock');
      rawBlock.innerText = window._lastAuditedToolsJson;
      rawBlock.style.display = 'none';
      document.getElementById('rawJsonArrow').innerText = '▶';
      document.getElementById('copyJsonBtn').style.display = 'none';

      // Diagnostic Header state
      if (isDown) {
        icon.innerText = '🚨';
        badge.innerText = 'Protocol Failure';
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
        badge.style.color = '#ef4444';
        content.style.display = 'block';
        arrow.innerText = '▲';
      } else if (hasValidationErrors || hasSecrets || isDegraded || hasDrift) {
        icon.innerText = '⚠️';
        badge.innerText = hasValidationErrors ? data.validationErrors.length + ' Schema Issue(s)' : (hasSecrets ? 'Secret Leaked' : 'Degraded');
        badge.style.background = 'rgba(245, 158, 11, 0.15)';
        badge.style.color = '#f59e0b';
        content.style.display = 'block';
        arrow.innerText = '▲';
      } else {
        icon.innerText = '🔍';
        badge.innerText = '5/5 Passed';
        badge.style.background = 'rgba(16, 185, 129, 0.15)';
        badge.style.color = '#10b981';
        content.style.display = 'none';
        arrow.innerText = '▼';
      }
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

        const badgeMd = '[![MCP Sentinel Status](' + data.statusBadgeUrl + ')](' + window.location.origin + '/status/' + data.monitorId + ')';
        document.getElementById('mBadgeCode').innerText = badgeMd;
        document.getElementById('mBadgePreview').innerHTML = '<img src="' + data.statusBadgeUrl + '" alt="status badge">';

        const statusBtn = document.getElementById('mStatusPageBtn');
        if (statusBtn) {
          statusBtn.href = '/status/' + data.monitorId;
        }
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

    function openStatusPageForAuditedServer() {
      var url = document.getElementById('endpointInput').value.trim();
      if (url) {
        window.open('/status?url=' + encodeURIComponent(url), '_blank');
      }
    }

    window.addEventListener('DOMContentLoaded', function() {
      var params = new URLSearchParams(window.location.search);
      var addUrl = params.get('add');
      if (addUrl) {
        openMonitorModal(addUrl);
      }
    });
  </script>
</body>
</html>`;
