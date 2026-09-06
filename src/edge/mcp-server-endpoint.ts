import { executeSyntheticCheck } from '../core/synthetic-runner.js';
import { RemoteMCPClient } from '../core/mcp-client.js';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export const MCP_SERVER_INFO = {
  name: 'mcp-sentinel',
  title: 'MCP Sentinel',
  version: '1.0.0',
  description:
    'Autonomous protocol health, schema drift, and security monitor for remote Model Context Protocol (MCP) servers.',
  homepage: 'https://mcp-sentinel.pasihakamaki.workers.dev',
  icon: 'https://mcp-sentinel.pasihakamaki.workers.dev/icon.svg',
};

export const MCP_CAPABILITIES = {
  tools: {},
};

export const MCP_TOOLS = [
  {
    name: 'audit_mcp_server',
    description:
      'Performs an automated synthetic health, protocol compliance, schema validation, and credential security audit on any remote Model Context Protocol (MCP) server. Use this tool when you need to comprehensively verify whether an external MCP server is reachable, measure round-trip latency, validate tool schemas against JSON Schema draft-07/2020-12 specifications, detect broken parameter definitions, and check for exposed API tokens or credentials. Returns a detailed markdown diagnostic report and structured status flags.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        endpointUrl: {
          type: 'string',
          format: 'uri',
          minLength: 1,
          description:
            'The public HTTP or SSE endpoint URL of the target remote MCP server to audit (e.g. "https://api.example.com/mcp" or "https://example.com/sse"). Must include http:// or https:// protocol scheme.',
          examples: [
            'https://mcp-sentinel.pasihakamaki.workers.dev/mcp',
            'https://mcp.deepwiki.com/sse',
          ],
        },
        authHeader: {
          type: 'string',
          description:
            'Optional HTTP Authorization header value (e.g. "Bearer <token>" or custom token) if the remote MCP server requires authentication.',
          examples: ['Bearer sample_token_abc123'],
        },
      },
      required: ['endpointUrl'],
    },
    outputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: {
          type: 'array',
          description: 'Formatted diagnostic audit report and performance findings.',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'MIME type of output content (text/plain).' },
              text: { type: 'string', description: 'Diagnostic audit report with latency, tools count, schema validity, and security status.' },
            },
            required: ['type', 'text'],
          },
        },
        isError: {
          type: 'boolean',
          description: 'True if the remote MCP server experienced downtime, failed the JSON-RPC handshake, or exposed leaked credentials.',
        },
      },
      required: ['content', 'isError'],
    },
    annotations: {
      readOnlyHint: true,
      idempotencyHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'verify_mcp_protocol',
    description:
      'Validates JSON-RPC 2.0 protocol compatibility and version negotiation with a remote MCP server without executing a full synthetic vulnerability scan. Use this tool when you specifically need to test whether a remote server supports modern Stateless Core ("2026-07-28"), structured outputs ("2025-06-18"), icons metadata ("2025-11-25"), or legacy handshakes ("2024-11-05"), benchmark handshake latency, or inspect declared server capabilities and tool counts.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        endpointUrl: {
          type: 'string',
          format: 'uri',
          minLength: 1,
          description:
            'The target remote MCP server endpoint URL to test (Streamable HTTP POST or SSE stream).',
          examples: [
            'https://mcp-sentinel.pasihakamaki.workers.dev/mcp',
            'https://mcp.deepwiki.com/sse',
          ],
        },
        authHeader: {
          type: 'string',
          description:
            'Optional HTTP Authorization header value if the remote server requires authentication.',
          examples: ['Bearer sample_token_abc123'],
        },
      },
      required: ['endpointUrl'],
    },
    outputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: {
          type: 'array',
          description: 'Summary of the protocol handshake result.',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Content MIME type.' },
              text: { type: 'string', description: 'Markdown formatted handshake diagnostic summary.' },
            },
            required: ['type', 'text'],
          },
        },
        protocolVersion: {
          type: 'string',
          description:
            'The exact protocol version negotiated with the server (e.g. "2026-07-28", "2025-11-25", "2025-06-18", or "2024-11-05").',
        },
        latencyMs: {
          type: 'number',
          description: 'Round-trip handshake latency in milliseconds.',
        },
        isError: {
          type: 'boolean',
          description: 'True if the remote server failed to complete the MCP initialization handshake.',
        },
      },
      required: ['content', 'isError'],
    },
    annotations: {
      readOnlyHint: true,
      idempotencyHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'get_monitor_badge',
    description:
      'Generates dynamic SVG status badge links and Markdown embed snippets for an MCP Sentinel uptime monitor. Use this tool when you want to display the real-time operational status, protocol version, and uptime badge of a monitored MCP server directly inside a GitHub repository README, developer documentation, or status page.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        monitorId: {
          type: 'string',
          minLength: 1,
          description:
            'The unique identifier of the monitor (or "sample" / "demo" to preview a demonstration badge).',
          examples: ['demo', 'mon_prod_01', 'sample'],
        },
      },
      required: ['monitorId'],
    },
    outputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: {
          type: 'array',
          description: 'Generated SVG badge URLs and copy-paste markdown embed snippet.',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Content MIME type.' },
              text: { type: 'string', description: 'Badge URL and Markdown snippet.' },
            },
            required: ['type', 'text'],
          },
        },
        isError: {
          type: 'boolean',
          description: 'Whether an error occurred while generating badge snippets.',
        },
      },
      required: ['content', 'isError'],
    },
    annotations: {
      readOnlyHint: true,
      idempotencyHint: true,
      openWorldHint: false,
    },
  },
];

/**
 * Dispatches a single JSON-RPC 2.0 MCP request
 */
export async function handleJsonRpcMessage(
  req: JsonRpcRequest,
  originUrl: string
): Promise<JsonRpcResponse | null> {
  const id = req.id !== undefined ? req.id : null;

  // Handle Notifications (no response needed)
  if (req.id === undefined && req.method === 'notifications/initialized') {
    return null;
  }

  switch (req.method) {
    case 'server/discover':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2026-07-28',
          capabilities: MCP_CAPABILITIES,
          serverInfo: MCP_SERVER_INFO,
        },
      };

    case 'initialize': {
      const requestedVersion = req.params?.protocolVersion;
      const SUPPORTED_PROTOCOLS = [
        '2026-07-28',
        '2025-11-25',
        '2025-06-18',
        '2024-11-05',
      ];
      const negotiatedVersion = SUPPORTED_PROTOCOLS.includes(requestedVersion)
        ? requestedVersion
        : '2025-11-25';
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: negotiatedVersion,
          capabilities: MCP_CAPABILITIES,
          serverInfo: MCP_SERVER_INFO,
        },
      };
    }

    case 'notifications/initialized':
    case 'initialized':
      return {
        jsonrpc: '2.0',
        id,
        result: {},
      };

    case 'ping':
      return {
        jsonrpc: '2.0',
        id,
        result: {},
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      };

    case 'resources/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          resources: [],
        },
      };

    case 'prompts/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          prompts: [],
        },
      };

    case 'tools/call': {
      const toolName = req.params?.name;
      const args = req.params?.arguments || {};

      if (toolName === 'audit_mcp_server') {
        if (!args.endpointUrl || typeof args.endpointUrl !== 'string') {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: 'Error: Missing or invalid required argument "endpointUrl".',
                },
              ],
              isError: true,
            },
          };
        }

        const headers: Record<string, string> = {};
        if (args.authHeader && typeof args.authHeader === 'string') {
          headers['Authorization'] = args.authHeader;
        }

        const audit = await executeSyntheticCheck(args.endpointUrl, { headers });

        let summary = '## MCP Sentinel Audit Report\n\n';
        summary += `- **Target Endpoint:** \`${args.endpointUrl}\`\n`;
        summary += `- **Status:** **${audit.status.toUpperCase()}**\n`;
        summary += `- **Latency:** ${audit.latencyMs} ms\n`;
        summary += `- **HTTP Status:** ${audit.httpStatus}\n`;

        if (audit.serverInfo) {
          summary += `- **Server Name:** ${audit.serverInfo.name || 'N/A'}\n`;
          summary += `- **Server Version:** ${audit.serverInfo.version || 'N/A'}\n`;
        }

        summary += `- **Discovered Tools:** ${audit.toolsCount}\n`;
        summary += `- **Discovered Resources:** ${audit.resourcesCount}\n`;
        summary += `- **Discovered Prompts:** ${audit.promptsCount}\n`;

        if (audit.secretFindings && audit.secretFindings.length > 0) {
          summary += `\n⚠️ **Secret Findings (${audit.secretFindings.length}):**\n`;
          for (const f of audit.secretFindings) {
            summary += `  - [${f.severity.toUpperCase()}] ${f.type} in \`${f.location}\` (Preview: \`${f.redactedSnippet}\`)\n`;
          }
        }

        if (audit.errorMessage) {
          summary += `\n❌ **Error Details:** ${audit.errorMessage}\n`;
        }

        summary += `\n### Raw Audit JSON\n\`\`\`json\n${JSON.stringify(audit, null, 2)}\n\`\`\``;

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: summary,
              },
            ],
            isError: audit.status === 'down' || audit.status === 'secret-leak',
          },
        };
      }

      if (toolName === 'get_monitor_badge') {
        const monitorId = args.monitorId || 'sample';
        const badgeUrl = `${originUrl}/badge/${monitorId}/status.svg`;
        const targetUrl = `${originUrl}/status/${monitorId}`;
        const markdown = `[![MCP Sentinel Status](${badgeUrl})](${targetUrl})`;

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Badge URL: ${badgeUrl}\nStatus Page: ${targetUrl}\n\nMarkdown Embed Code:\n\`\`\`markdown\n${markdown}\n\`\`\``,
              },
            ],
            isError: false,
          },
        };
      }

      if (toolName === 'verify_mcp_protocol') {
        if (!args.endpointUrl || typeof args.endpointUrl !== 'string') {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: 'Error: Missing or invalid required argument "endpointUrl". Must be a valid HTTP or SSE URL.',
                },
              ],
              isError: true,
            },
          };
        }

        const headers: Record<string, string> = {};
        if (args.authHeader && typeof args.authHeader === 'string') {
          headers['Authorization'] = args.authHeader;
        }

        const client = new RemoteMCPClient(args.endpointUrl, { headers, timeoutMs: 8000 });
        try {
          const discovery = await client.runDiscovery();
          let text = `## Protocol Handshake Verification: SUCCESS\n\n`;
          text += `- **Endpoint:** \`${args.endpointUrl}\`\n`;
          text += `- **Negotiated Protocol Version:** \`${discovery.protocolVersion}\`\n`;
          text += `- **Round-Trip Handshake Latency:** ${discovery.latencyMs} ms\n`;
          text += `- **Server Name:** ${discovery.serverInfo.name}\n`;
          text += `- **Server Version:** ${discovery.serverInfo.version}\n`;
          text += `- **Discovered Tools Count:** ${discovery.tools.length}\n`;
          text += `- **Discovered Resources Count:** ${discovery.resources.length}\n`;
          text += `- **Discovered Prompts Count:** ${discovery.prompts.length}\n`;

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text }],
              protocolVersion: discovery.protocolVersion,
              latencyMs: discovery.latencyMs,
              isError: false,
            },
          };
        } catch (err: any) {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `## Protocol Handshake Verification: FAILED\n\n- **Endpoint:** \`${args.endpointUrl}\`\n- **Error:** ${err?.message || 'Handshake failed'}\n\nThe target server did not complete standard MCP JSON-RPC 2.0 handshake initialization.`,
                },
              ],
              isError: true,
            },
          };
        }
      }

      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Unknown tool name: ${toolName}`,
        },
      };
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${req.method}`,
        },
      };
  }
}

/**
 * Handles HTTP requests to /mcp and /sse
 */
export async function handleMcpHttpRequest(
  request: Request,
  originUrl: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // GET /mcp or GET /sse: return metadata or SSE connection
  if (request.method === 'GET') {
    const acceptHeader = request.headers.get('Accept') || '';
    if (acceptHeader.includes('text/event-stream')) {
      const body = `event: endpoint\ndata: ${originUrl}/mcp\n\n`;
      return new Response(body, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return new Response(
      JSON.stringify(
        {
          name: 'mcp-sentinel',
          description:
            'Hosted Model Context Protocol (MCP) server for synthetic monitoring, handshake validation, and schema drift detection.',
          status: 'operational',
          version: '1.0.0',
          protocol: 'mcp/2026-07-28',
          supportedProtocols: ['2026-07-28', '2025-11-25', '2025-06-18', '2024-11-05'],
          transport: 'Streamable HTTP (POST /mcp) or SSE (GET /sse)',
          tools: MCP_TOOLS.map(t => ({ name: t.name, description: t.description })),
          documentation: 'https://github.com/pasihaka/mcp-sentinel',
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  }

  // POST /mcp: Streamable HTTP JSON-RPC 2.0
  if (request.method === 'POST') {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error: invalid JSON' },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (Array.isArray(body)) {
      const responses: JsonRpcResponse[] = [];
      for (const req of body) {
        const res = await handleJsonRpcMessage(req, originUrl);
        if (res) responses.push(res);
      }
      return new Response(JSON.stringify(responses), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await handleJsonRpcMessage(body, originUrl);
    if (!res) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}
