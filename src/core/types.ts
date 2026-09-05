/**
 * JSON-RPC 2.0 and Model Context Protocol (MCP) TypeScript definitions
 */

export type JsonRpcId = string | number | null;

export interface JsonRpcRequest<T = any> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: string;
  params?: T;
}

export interface JsonRpcNotification<T = any> {
  jsonrpc: '2.0';
  method: string;
  params?: T;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: T;
  error?: JsonRpcError;
}

// MCP Core Specification Types (2024-11-05 standard)
export interface ClientCapabilities {
  roots?: { listChanged?: boolean };
  sampling?: Record<string, any>;
  experimental?: Record<string, any>;
}

export interface ServerCapabilities {
  logging?: Record<string, any>;
  prompts?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  tools?: { listChanged?: boolean };
  experimental?: Record<string, any>;
}

export interface ImplementationInfo {
  name: string;
  version: string;
}

export interface InitializeParams {
  protocolVersion: string;
  capabilities: ClientCapabilities;
  clientInfo: ImplementationInfo;
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: ImplementationInfo;
  instructions?: string;
}

export interface ToolInputSchema {
  type: 'object';
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: ToolInputSchema;
}

export interface ToolsListResult {
  tools: MCPTool[];
  nextCursor?: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ResourcesListResult {
  resources: MCPResource[];
  nextCursor?: string;
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface PromptsListResult {
  prompts: MCPPrompt[];
  nextCursor?: string;
}

// Schema Diff Engine Types
export type DiffChangeType = 'breaking' | 'non-breaking';

export type DiffCategory =
  | 'tool-removed'
  | 'tool-added'
  | 'param-removed'
  | 'param-added-required'
  | 'param-added-optional'
  | 'param-type-changed'
  | 'description-changed';

export interface SchemaDiffItem {
  type: DiffChangeType;
  category: DiffCategory;
  path: string; // e.g., "tool.weather.parameters.city"
  message: string;
  oldValue?: any;
  newValue?: any;
}

export interface SchemaDiffResult {
  hasDrift: boolean;
  isBreaking: boolean;
  canonicalHash: string;
  previousHash?: string;
  diffs: SchemaDiffItem[];
}

// Secret Scanning Types
export type SecretSeverity = 'critical' | 'high' | 'medium';

export interface SecretLeakFinding {
  type: string; // e.g. "openai-api-key", "aws-access-key", "bearer-token"
  severity: SecretSeverity;
  location: string; // e.g. "tool[search_db].description"
  matchedPattern: string;
  redactedSnippet: string;
  description: string;
}

// Synthetic Execution Verdict
export type CheckStatus =
  | 'operational'
  | 'degraded'
  | 'schema-drift'
  | 'secret-leak'
  | 'down';

export interface CheckExecutionResult {
  monitorId?: string;
  timestamp: number;
  status: CheckStatus;
  httpStatus?: number;
  latencyMs: number;
  protocolVersion?: string;
  serverInfo?: ImplementationInfo;
  capabilities?: ServerCapabilities;
  toolsCount: number;
  resourcesCount: number;
  promptsCount: number;
  schemaHash: string;
  schemaSizeBytes?: number;
  approxContextTokens?: number;
  diffResult?: SchemaDiffResult;
  secretFindings: SecretLeakFinding[];
  errorMessage?: string;
}
