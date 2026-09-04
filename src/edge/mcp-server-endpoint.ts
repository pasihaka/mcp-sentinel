import { executeSyntheticCheck } from '../core/synthetic-runner.js';

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

const MCP_SERVER_INFO = {
  name: 'mcp-sentinel',
  version: '1.0.0',
};

const MCP_CAPABILITIES = {
  tools: {},
};

const MCP_TOOLS = [
  {
    name: 'audit_mcp_server',
    description:
      'Performs real-time synthetic uptime verification, JSON-RPC 2.0 handshake check, schema validation, and credential leak scanning on any remote MCP server endpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        endpointUrl: {
          type: 'string',
          description:
            'The remote MCP server HTTP or SSE URL to test (e.g. https://api.example.com/mcp or https://example.com/sse)',
        },
        authHeader: {
          type: 'string',
          description:
            'Optional Authorization header value (e.g. "Bearer sk_..." or custom token) if the remote server requires authentication',
        },
      },
      required: ['endpointUrl'],
    },
  },
  {
    name: 'get_monitor_badge',
    description:
      'Generates the public SVG status badge URL and Markdown embed snippet for an MCP Sentinel monitor.',
    inputSchema: {
      type: 'object',
      properties: {
        monitorId: {
          type: 'string',
          description: 'The monitor ID or identifier',
        },
      },
      required: ['monitorId'],
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
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: MCP_CAPABILITIES,
          serverInfo: MCP_SERVER_INFO,
        },
      };

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
        const markdown = `[![MCP Sentinel Status](${badgeUrl})](${originUrl})`;

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Badge URL: ${badgeUrl}\n\nMarkdown Embed Code:\n\`\`\`markdown\n${markdown}\n\`\`\``,
              },
            ],
            isError: false,
          },
        };
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
          protocol: 'mcp/2024-11-05',
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
