import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { validateToolSchema, validateAllTools } from '../src/core/schema-validator.js';
import { diffToolSchemas, computeCanonicalHash } from '../src/core/schema-diff.js';
import { scanAllForSecrets } from '../src/core/secret-scanner.js';
import { generateStatusBadge, generateSchemaBadge } from '../src/edge/badge-generator.js';
import { MockMCPServer, DEFAULT_MOCK_TOOLS } from './mock-mcp-server.js';
import { executeSyntheticCheck } from '../src/core/synthetic-runner.js';
import type { MCPTool } from '../src/core/types.js';

describe('MCP Sentinel Protocol Engine', () => {
  describe('Schema Validation (Ajv)', () => {
    it('should validate a compliant MCP tool schema', () => {
      const validTool: MCPTool = {
        name: 'fetch_stock_price',
        description: 'Gets current stock price for a symbol',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Stock ticker symbol' },
          },
          required: ['symbol'],
        },
      };

      const result = validateToolSchema(validTool);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid tool names or schemas with missing required declarations', () => {
      const invalidTool: MCPTool = {
        name: 'invalid tool name with spaces!',
        description: 'Broken tool',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['missing_field'], // Declared in required but not in properties!
        },
      };

      const result = validateToolSchema(invalidTool);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('contains invalid characters'))).toBe(true);
      expect(result.errors.some(e => e.includes('not declared in properties'))).toBe(true);
    });
  });

  describe('Schema Drift Detection', () => {
    it('should report no drift for identical tool definitions', async () => {
      const toolsA = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      const toolsB = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));

      const diff = await diffToolSchemas(toolsA, toolsB);
      expect(diff.hasDrift).toBe(false);
      expect(diff.isBreaking).toBe(false);
      expect(diff.diffs).toHaveLength(0);
      expect(diff.canonicalHash).toBe(diff.previousHash);
    });

    it('should flag removed tools as BREAKING', async () => {
      const oldTools: MCPTool[] = [...DEFAULT_MOCK_TOOLS];
      const newTools: MCPTool[] = [DEFAULT_MOCK_TOOLS[0]]; // Removed search_database

      const diff = await diffToolSchemas(oldTools, newTools);
      expect(diff.hasDrift).toBe(true);
      expect(diff.isBreaking).toBe(true);
      expect(diff.diffs[0].category).toBe('tool-removed');
      expect(diff.diffs[0].type).toBe('breaking');
      expect(diff.diffs[0].path).toBe('tool.search_database');
    });

    it('should flag removed parameters as BREAKING', async () => {
      const oldTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      const newTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      delete newTools[0]!.inputSchema.properties!.units; // Removed 'units' parameter

      const diff = await diffToolSchemas(oldTools, newTools);
      expect(diff.hasDrift).toBe(true);
      expect(diff.isBreaking).toBe(true);
      expect(diff.diffs.some(d => d.category === 'param-removed')).toBe(true);
    });

    it('should flag new REQUIRED parameters as BREAKING', async () => {
      const oldTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      const newTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      newTools[0]!.inputSchema.properties!.apiKey = { type: 'string' };
      newTools[0]!.inputSchema.required!.push('apiKey'); // Now mandatory!

      const diff = await diffToolSchemas(oldTools, newTools);
      expect(diff.hasDrift).toBe(true);
      expect(diff.isBreaking).toBe(true);
      expect(diff.diffs.some(d => d.category === 'param-added-required')).toBe(true);
    });

    it('should flag new OPTIONAL parameters as NON-BREAKING', async () => {
      const oldTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      const newTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      newTools[0]!.inputSchema.properties!.format = { type: 'string', enum: ['json', 'xml'] };

      const diff = await diffToolSchemas(oldTools, newTools);
      expect(diff.hasDrift).toBe(true);
      expect(diff.isBreaking).toBe(false);
      expect(diff.diffs.some(d => d.category === 'param-added-optional')).toBe(true);
    });

    it('should flag parameter type mutations as BREAKING', async () => {
      const oldTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      const newTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      newTools[1]!.inputSchema.properties!.limit.type = 'string'; // changed number -> string

      const diff = await diffToolSchemas(oldTools, newTools);
      expect(diff.hasDrift).toBe(true);
      expect(diff.isBreaking).toBe(true);
      expect(diff.diffs.some(d => d.category === 'param-type-changed')).toBe(true);
    });
  });

  describe('Secret & Credential Scanner', () => {
    it('should find 0 secrets in clean tools', () => {
      const findings = scanAllForSecrets(DEFAULT_MOCK_TOOLS);
      expect(findings).toHaveLength(0);
    });

    it('should detect an exposed OpenAI API key with redaction', () => {
      const leakedTool: MCPTool = {
        name: 'generate_summary',
        description: 'Summarizes text using sk-proj-abcdef1234567890abcdef1234567890abcdef internal key.',
        inputSchema: { type: 'object' },
      };

      const findings = scanAllForSecrets([leakedTool]);
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('openai-api-key');
      expect(findings[0].severity).toBe('critical');
      expect(findings[0].redactedSnippet).toContain('[REDACTED]');
      expect(findings[0].redactedSnippet).not.toContain('abcdef1234567890abcdef');
    });

    it('should detect an exposed AWS Access Key', () => {
      const leakedTool: MCPTool = {
        name: 'upload_s3',
        description: 'Uploads file using AKIAIOSFODNN7EXAMPLE',
        inputSchema: { type: 'object' },
      };

      const findings = scanAllForSecrets([leakedTool]);
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('aws-access-key');
      expect(findings[0].severity).toBe('critical');
    });

    it('should detect hardcoded database connection credentials', () => {
      const leakedTool: MCPTool = {
        name: 'query_db',
        description: 'Connects to postgres://admin:SuperSecretPassword123@prod-db.internal:5432/main',
        inputSchema: { type: 'object' },
      };

      const findings = scanAllForSecrets([leakedTool]);
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('database-uri');
    });
  });

  describe('Vector Badge Generation', () => {
    it('should generate valid SVG status badges with correct colors', () => {
      const operationalSvg = generateStatusBadge('operational');
      expect(operationalSvg).toContain('<svg');
      expect(operationalSvg).toContain('operational');
      expect(operationalSvg).toContain('#4c1'); // green

      const driftSvg = generateStatusBadge('schema-drift');
      expect(driftSvg).toContain('schema drift');
      expect(driftSvg).toContain('#fe7d37'); // orange

      const offlineSvg = generateStatusBadge('down');
      expect(offlineSvg).toContain('offline');
      expect(offlineSvg).toContain('#e05d44'); // red
    });

    it('should generate schema verification badges', () => {
      const verifiedSvg = generateSchemaBadge(false, false);
      expect(verifiedSvg).toContain('verified');
      expect(verifiedSvg).toContain('#007ec6'); // blue
    });
  });

  describe('End-to-End Synthetic Check Integration', () => {
    let mockServer: MockMCPServer;
    let serverUrl: string;

    beforeAll(async () => {
      mockServer = new MockMCPServer();
      serverUrl = await mockServer.start();
    });

    afterAll(async () => {
      await mockServer.stop();
    });

    it('should successfully execute handshake and discover tools on healthy server', async () => {
      const result = await executeSyntheticCheck(serverUrl);
      expect(result.status).toBe('operational');
      expect(result.httpStatus).toBe(200);
      expect(result.toolsCount).toBe(2);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.serverInfo?.name).toBe('mock-weather-mcp');
      expect(result.schemaHash).toBeTruthy();
      expect(result.secretFindings).toHaveLength(0);
    });

    it('should detect DOWN status when server returns HTTP 500', async () => {
      mockServer.config.simulateHttpError = 500;

      const result = await executeSyntheticCheck(serverUrl);
      expect(result.status).toBe('down');
      expect(result.errorMessage).toContain('500');

      mockServer.config.simulateHttpError = undefined;
    });

    it('should detect SCHEMA-DRIFT when server introduces breaking changes', async () => {
      // First baseline run
      const baseline = await executeSyntheticCheck(serverUrl);
      expect(baseline.status).toBe('operational');

      // Mutate tools on server (remove a parameter)
      const driftedTools: MCPTool[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_TOOLS));
      delete driftedTools[0]!.inputSchema.properties!.city;
      mockServer.config.tools = driftedTools;

      // Second run passing baseline hash & tools
      const drifted = await executeSyntheticCheck(serverUrl, {
        previousHash: baseline.schemaHash,
        previousTools: DEFAULT_MOCK_TOOLS,
      });

      expect(drifted.status).toBe('schema-drift');
      expect(drifted.diffResult?.isBreaking).toBe(true);
      expect(drifted.diffResult?.diffs.some(d => d.category === 'param-removed')).toBe(true);

      // Restore
      mockServer.config.tools = [...DEFAULT_MOCK_TOOLS];
    });

    it('should detect SECRET-LEAK when server leaks an API key', async () => {
      const leakyTools: MCPTool[] = [
        {
          name: 'ai_tool',
          description: 'Uses internal key sk-proj-1234567890123456789012345678901234',
          inputSchema: { type: 'object' },
        },
      ];
      mockServer.config.tools = leakyTools;

      const result = await executeSyntheticCheck(serverUrl);
      expect(result.status).toBe('secret-leak');
      expect(result.secretFindings).toHaveLength(1);
      expect(result.secretFindings[0].type).toBe('openai-api-key');

      // Restore
      mockServer.config.tools = [...DEFAULT_MOCK_TOOLS];
    });
  });
});
