import type {
  InitializeResult,
  JsonRpcRequest,
  JsonRpcResponse,
  MCPTool,
  MCPResource,
  MCPPrompt,
  ToolsListResult,
  ResourcesListResult,
  PromptsListResult,
} from './types.js';

export interface MCPClientOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
  protocolVersion?: string;
}

export interface MCPDiscoveryResult {
  latencyMs: number;
  initLatencyMs?: number;
  toolsLatencyMs?: number;
  protocolVersion: string;
  serverInfo: { name: string; version: string };
  capabilities: any;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}

/**
 * Handles communication with remote MCP servers over HTTP/SSE or direct JSON-RPC POST.
 */
export class RemoteMCPClient {
  private endpointUrl: string;
  private timeoutMs: number;
  private headers: Record<string, string>;
  private protocolVersion: string;

  constructor(endpointUrl: string, options: MCPClientOptions = {}) {
    this.endpointUrl = endpointUrl;
    this.timeoutMs = options.timeoutMs || 8000;
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(options.headers || {}),
    };
    this.protocolVersion = options.protocolVersion || '2024-11-05';
  }

  /**
   * Discovers all capabilities, tools, resources, and prompts from the remote MCP server
   */
  async runDiscovery(): Promise<MCPDiscoveryResult> {
    const startTime = performance.now();

    // 1. Determine transport mode (SSE vs direct JSON-RPC)
    const { postUrl, sseReader } = await this.establishConnection();

    try {
      // 2. Send initialize handshake
      const initStart = performance.now();
      let initResult: InitializeResult;
      try {
        initResult = await this.sendInitialize(postUrl, sseReader);
      } catch (err: any) {
        if (!err.phase) err.phase = 'initialize';
        throw err;
      }
      const initLatencyMs = Math.round(performance.now() - initStart);

      // 3. Send notifications/initialized
      await this.sendNotification(postUrl, 'notifications/initialized');

      // 4. Fetch tools/list
      const toolsStart = performance.now();
      let tools: MCPTool[] = [];
      try {
        tools = await this.fetchTools(postUrl, sseReader);
      } catch (err: any) {
        if (!err.phase) err.phase = 'tools';
        throw err;
      }
      const toolsLatencyMs = Math.round(performance.now() - toolsStart);

      // 5. Fetch resources/list (graceful fallback if unsupported)
      let resources: MCPResource[] = [];
      try {
        resources = await this.fetchResources(postUrl, sseReader);
      } catch {
        // Resources are optional in MCP
      }

      // 6. Fetch prompts/list (graceful fallback if unsupported)
      let prompts: MCPPrompt[] = [];
      try {
        prompts = await this.fetchPrompts(postUrl, sseReader);
      } catch {
        // Prompts are optional in MCP
      }

      const totalLatency = Math.round(performance.now() - startTime);

      return {
        latencyMs: totalLatency,
        initLatencyMs,
        toolsLatencyMs,
        protocolVersion: initResult.protocolVersion || this.protocolVersion,
        serverInfo: initResult.serverInfo || { name: 'Unknown', version: '0.0.0' },
        capabilities: initResult.capabilities || {},
        tools,
        resources,
        prompts,
      };
    } finally {
      if (sseReader) {
        try {
          await sseReader.cancel();
        } catch {}
      }
    }
  }

  /**
   * Inspects endpoint: checks for SSE stream endpoint or falls back to direct JSON-RPC POST
   */
  private async establishConnection(): Promise<{ postUrl: string; sseReader?: ReadableStreamDefaultReader<Uint8Array> }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.endpointUrl, {
        method: 'GET',
        headers: {
          ...this.headers,
          Accept: 'text/event-stream, application/json',
        },
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') || '';

      // If server returns SSE stream (Standard remote MCP SSE transport)
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const postUrl = await this.readEndpointFromSSE(reader);
        clearTimeout(timeout);
        return { postUrl, sseReader: reader };
      }

      // Otherwise assume direct POST endpoint
      clearTimeout(timeout);
      return { postUrl: this.endpointUrl };
    } catch {
      clearTimeout(timeout);
      // If GET fails or is 405 Method Not Allowed, fallback to direct POST
      return { postUrl: this.endpointUrl };
    }
  }

  /**
   * Reads initial SSE events to extract the `endpoint` URL where POST messages must be sent
   */
  private async readEndpointFromSSE(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
    const decoder = new TextDecoder();
    let buffer = '';

    // Wait up to 3 seconds for the endpoint event
    const startTime = Date.now();

    while (Date.now() - startTime < 3000) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.replace('event:', '').trim();
        } else if (line.startsWith('data:') && currentEvent === 'endpoint') {
          const rawPath = line.replace('data:', '').trim();
          // Resolve relative path against base endpoint URL
          return new URL(rawPath, this.endpointUrl).toString();
        }
      }
    }

    // Fallback if no specific endpoint event was broadcast
    return this.endpointUrl;
  }

  private async sendRpcRequest<T>(postUrl: string, method: string, params: any = {}, id: number = 1): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    try {
      const response = await fetch(postUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err: any = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        err.httpStatus = response.status;
        throw err;
      }

      const rawText = await response.text();
      let body: JsonRpcResponse<T>;

      try {
        body = JSON.parse(rawText);
      } catch {
        // Support SSE-framed responses (event: message\ndata: {...})
        const dataMatch = rawText.match(/data:\s*(\{[\s\S]*\})/);
        if (dataMatch && dataMatch[1]) {
          body = JSON.parse(dataMatch[1]);
        } else {
          const err: any = new Error(`Failed to parse JSON-RPC response: ${rawText.slice(0, 120)}`);
          err.rpcErrorCode = -32700; // Parse error
          throw err;
        }
      }

      if (body.error) {
        const err: any = new Error(`JSON-RPC Error [${body.error.code}]: ${body.error.message}`);
        err.rpcErrorCode = body.error.code;
        throw err;
      }

      if (body.result === undefined) {
        throw new Error(`Invalid JSON-RPC response: Missing result field.`);
      }

      return body.result;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async sendNotification(postUrl: string, method: string, params: any = {}): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const payload = {
      jsonrpc: '2.0',
      method,
      params,
    };

    try {
      await fetch(postUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch {
      // Notifications are fire-and-forget in JSON-RPC
    } finally {
      clearTimeout(timeout);
    }
  }

  private async sendInitialize(postUrl: string, _reader?: ReadableStreamDefaultReader<Uint8Array>): Promise<InitializeResult> {
    return this.sendRpcRequest<InitializeResult>(postUrl, 'initialize', {
      protocolVersion: this.protocolVersion,
      capabilities: {},
      clientInfo: {
        name: 'mcp-sentinel',
        version: '1.0.0',
      },
    }, 1);
  }

  private async fetchTools(postUrl: string, _reader?: ReadableStreamDefaultReader<Uint8Array>): Promise<MCPTool[]> {
    const result = await this.sendRpcRequest<ToolsListResult>(postUrl, 'tools/list', {}, 2);
    return result.tools || [];
  }

  private async fetchResources(postUrl: string, _reader?: ReadableStreamDefaultReader<Uint8Array>): Promise<MCPResource[]> {
    const result = await this.sendRpcRequest<ResourcesListResult>(postUrl, 'resources/list', {}, 3);
    return result.resources || [];
  }

  private async fetchPrompts(postUrl: string, _reader?: ReadableStreamDefaultReader<Uint8Array>): Promise<MCPPrompt[]> {
    const result = await this.sendRpcRequest<PromptsListResult>(postUrl, 'prompts/list', {}, 4);
    return result.prompts || [];
  }
}
