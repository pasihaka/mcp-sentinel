import { RemoteMCPClient, type MCPClientOptions } from './mcp-client.js';
import { validateAllTools } from './schema-validator.js';
import { diffToolSchemas, computeCanonicalHash } from './schema-diff.js';
import { scanAllForSecrets } from './secret-scanner.js';
import type { CheckExecutionResult, CheckStatus, MCPTool } from './types.js';

export interface SyntheticRunOptions extends MCPClientOptions {
  previousHash?: string;
  previousTools?: MCPTool[];
}

/**
 * Orchestrates a complete synthetic audit of a remote MCP server.
 */
export async function executeSyntheticCheck(
  endpointUrl: string,
  options: SyntheticRunOptions = {}
): Promise<CheckExecutionResult> {
  const timestamp = Date.now();
  const client = new RemoteMCPClient(endpointUrl, options);

  try {
    // 1. Run MCP discovery & handshake
    const discovery = await client.runDiscovery();

    // 2. Validate tool input schemas with Ajv
    const validation = validateAllTools(discovery.tools);

    // 3. Detect schema drift against previous baseline
    const diffResult = await diffToolSchemas(
      options.previousTools || [],
      discovery.tools,
      options.previousHash
    );

    // 4. Scan for exposed credentials / secrets
    const secretFindings = scanAllForSecrets(discovery.tools, discovery.resources);

    // Extract flat list of validation errors
    const validationErrors: string[] = [];
    for (const [toolName, errors] of Object.entries(validation.toolErrors)) {
      for (const err of errors) {
        validationErrors.push(`[${toolName}] ${err}`);
      }
    }

    // Determine operational verdict and actionable remediation hint
    let status: CheckStatus = 'operational';
    let remediationHint: string | undefined;

    if (secretFindings.some(f => f.severity === 'critical')) {
      status = 'secret-leak';
      remediationHint = 'Critical credentials or API keys detected in schemas. Redact them immediately.';
    } else if (diffResult.isBreaking) {
      status = 'schema-drift';
      remediationHint = 'Breaking schema changes detected against baseline. Clients may fail on removed tools or required parameters.';
    } else if (!validation.isValid) {
      status = 'degraded';
      remediationHint = `Schema validation failed for ${Object.keys(validation.toolErrors).length} tool(s). Ensure all required fields exist in inputSchema.properties and types are valid JSON Schema.`;
    } else if (discovery.latencyMs > 5000) {
      status = 'degraded';
      remediationHint = 'High latency observed (>5000ms). Consider edge caching or optimizing cold-start initialization.';
    }

    // Calculate schema payload weight and estimated LLM prompt context tokens
    const schemaJson = JSON.stringify(discovery.tools || []);
    const schemaSizeBytes = new TextEncoder().encode(schemaJson).length;
    const approxContextTokens = Math.round(schemaSizeBytes / 4);

    return {
      timestamp,
      status,
      httpStatus: 200,
      latencyMs: discovery.latencyMs,
      initLatencyMs: discovery.initLatencyMs,
      toolsLatencyMs: discovery.toolsLatencyMs,
      protocolVersion: discovery.protocolVersion,
      serverInfo: discovery.serverInfo,
      capabilities: discovery.capabilities,
      tools: discovery.tools,
      toolsCount: discovery.tools.length,
      resourcesCount: discovery.resources.length,
      promptsCount: discovery.prompts.length,
      schemaHash: diffResult.canonicalHash,
      schemaSizeBytes,
      approxContextTokens,
      diffResult,
      secretFindings,
      validationErrors,
      toolValidationErrors: validation.toolErrors,
      protocolPhase: 'complete',
      remediationHint,
      errorMessage: !validation.isValid ? `Schema validation failed (${validationErrors.length} issue(s) detected).` : undefined,
    };
  } catch (err: any) {
    const rpcErrorCode: number | undefined = err.rpcErrorCode;
    const protocolPhase = err.phase || 'transport';
    const httpStatus = err.httpStatus || (err.message && err.message.includes('401') ? 401 : 500);

    let remediationHint = 'Verify that the MCP server is running, reachable over HTTPS, and conforms to the Model Context Protocol.';

    if (rpcErrorCode === -32700) {
      remediationHint = 'JSON parse error: Server returned malformed JSON. Check for debug logging or HTML error pages on stdout.';
    } else if (rpcErrorCode === -32600) {
      remediationHint = 'Invalid JSON-RPC request: Ensure the server complies with JSON-RPC 2.0 specifications.';
    } else if (rpcErrorCode === -32601) {
      remediationHint = 'Method not found: Remote server router did not recognize "initialize" or "tools/list". Verify MCP SDK handler registrations.';
    } else if (rpcErrorCode === -32602) {
      remediationHint = 'Invalid params: Server rejected protocol initialization or discovery parameters.';
    } else if (rpcErrorCode === -32603) {
      remediationHint = 'Internal error: Server crashed handling the request. Check remote server application logs.';
    } else if (httpStatus === 401 || httpStatus === 403) {
      remediationHint = 'Authentication required: Server rejected handshake with 401/403. Provide an Authorization Bearer token.';
    } else if (httpStatus === 404) {
      remediationHint = 'Endpoint not found: URL returned 404. Verify the path (e.g. /mcp or /sse) and server routing.';
    } else if (httpStatus === 405) {
      remediationHint = 'Method Not Allowed: Ensure the server allows POST requests or initiates an SSE stream on GET.';
    } else if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
      remediationHint = 'Upstream gateway error or timeout (>8s). Check server responsiveness and cloud infrastructure.';
    }

    return {
      timestamp,
      status: 'down',
      httpStatus,
      latencyMs: 0,
      toolsCount: 0,
      resourcesCount: 0,
      promptsCount: 0,
      schemaHash: '',
      secretFindings: [],
      validationErrors: [],
      toolValidationErrors: {},
      protocolPhase,
      rpcErrorCode,
      remediationHint,
      errorMessage: err.message || 'Unknown protocol failure during synthetic check.',
    };
  }
}
