import http from 'http';
import type { MCPTool, MCPResource, InitializeResult, ToolsListResult } from '../src/core/types.js';

export interface MockServerConfig {
  port?: number;
  serverInfo?: { name: string; version: string };
  protocolVersion?: string;
  simulateHttpError?: number;
  simulateRpcError?: { code: number; message: string };
  simulateSlowResponseMs?: number;
  tools?: MCPTool[];
  resources?: MCPResource[];
}

export const DEFAULT_MOCK_TOOLS: MCPTool[] = [
  {
    name: 'get_weather',
    description: 'Retrieves current weather forecast for a specified city.',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'The city name, e.g. San Francisco' },
        units: { type: 'string', enum: ['celsius', 'fahrenheit'], default: 'celsius' },
      },
      required: ['city'],
    },
  },
  {
    name: 'search_database',
    description: 'Executes indexed vector search across internal documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or question' },
        limit: { type: 'number', description: 'Maximum number of results to return' },
      },
      required: ['query'],
    },
  },
];

export class MockMCPServer {
  private server: http.Server | null = null;
  public config: MockServerConfig;
  public url: string = '';

  constructor(config: MockServerConfig = {}) {
    this.config = {
      serverInfo: { name: 'mock-weather-mcp', version: '1.2.0' },
      protocolVersion: '2024-11-05',
      tools: [...DEFAULT_MOCK_TOOLS],
      resources: [],
      ...config,
    };
  }

  start(): Promise<string> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (this.config.simulateSlowResponseMs) {
          await new Promise(r => setTimeout(r, this.config.simulateSlowResponseMs));
        }

        if (this.config.simulateHttpError) {
          res.writeHead(this.config.simulateHttpError, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Simulated HTTP ${this.config.simulateHttpError}` }));
          return;
        }

        // SSE Handshake
        if (req.method === 'GET' && req.headers.accept?.includes('text/event-stream')) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });

          // Send endpoint event
          res.write(`event: endpoint\ndata: ${this.url}/message\n\n`);
          return;
        }

        // Direct POST or /message POST
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              const rpc = JSON.parse(body);

              if (this.config.simulateRpcError) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    jsonrpc: '2.0',
                    id: rpc.id,
                    error: this.config.simulateRpcError,
                  })
                );
                return;
              }

              if (rpc.method === 'initialize') {
                const result: InitializeResult = {
                  protocolVersion: this.config.protocolVersion || '2024-11-05',
                  capabilities: { tools: { listChanged: true }, resources: {} },
                  serverInfo: this.config.serverInfo || { name: 'mock-server', version: '1.0.0' },
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result }));
                return;
              }

              if (rpc.method === 'notifications/initialized') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end();
                return;
              }

              if (rpc.method === 'tools/list') {
                const result: ToolsListResult = {
                  tools: this.config.tools || [],
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result }));
                return;
              }

              if (rpc.method === 'resources/list') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result: { resources: this.config.resources || [] } }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result: {} }));
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        res.writeHead(404);
        res.end();
      });

      this.server.listen(0, '127.0.0.1', () => {
        const address = this.server!.address() as any;
        this.url = `http://127.0.0.1:${address.port}`;
        resolve(this.url);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
