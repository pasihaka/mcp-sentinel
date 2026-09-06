export function renderNotFoundPage(originUrl: string, monitorId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monitor Not Found — MCP Sentinel</title>
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
      --text: #f9fafb;
      --muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 3rem 2rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1.5rem;
      letter-spacing: 0.05em;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
      letter-spacing: -0.02em;
    }
    p {
      color: var(--muted);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .code {
      font-family: 'JetBrains Mono', monospace;
      color: #e5e7eb;
      background: #0b1120;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .btn {
      display: inline-block;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: var(--accent-hover);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">404 · NOT FOUND</div>
    <h1>Monitor Not Found</h1>
    <p>We couldn't find an active MCP monitor with identifier <span class="code">${escapeHtml(monitorId)}</span>. The monitor may have been renamed or removed.</p>
    <a href="${originUrl}" class="btn">Return to MCP Sentinel</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
