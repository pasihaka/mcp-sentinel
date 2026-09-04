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

    // 5. Determine operational verdict
    let status: CheckStatus = 'operational';

    if (secretFindings.some(f => f.severity === 'critical')) {
      status = 'secret-leak';
    } else if (diffResult.isBreaking) {
      status = 'schema-drift';
    } else if (!validation.isValid || discovery.latencyMs > 5000) {
      status = 'degraded';
    }

    return {
      timestamp,
      status,
      httpStatus: 200,
      latencyMs: discovery.latencyMs,
      protocolVersion: discovery.protocolVersion,
      serverInfo: discovery.serverInfo,
      capabilities: discovery.capabilities,
      toolsCount: discovery.tools.length,
      resourcesCount: discovery.resources.length,
      promptsCount: discovery.prompts.length,
      schemaHash: diffResult.canonicalHash,
      diffResult,
      secretFindings,
    };
  } catch (err: any) {
    return {
      timestamp,
      status: 'down',
      httpStatus: err.httpStatus || 500,
      latencyMs: 0,
      toolsCount: 0,
      resourcesCount: 0,
      promptsCount: 0,
      schemaHash: '',
      secretFindings: [],
      errorMessage: err.message || 'Unknown protocol failure during synthetic check.',
    };
  }
}
