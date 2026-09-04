import type { MCPTool, MCPResource, SecretLeakFinding } from './types.js';

interface SecretRule {
  type: string;
  severity: 'critical' | 'high' | 'medium';
  pattern: RegExp;
  description: string;
}

const SECRET_RULES: SecretRule[] = [
  {
    type: 'openai-api-key',
    severity: 'critical',
    pattern: /\b(sk-[a-zA-Z0-9_-]{32,}|sk-proj-[a-zA-Z0-9_-]{32,})\b/,
    description: 'OpenAI API key detected.',
  },
  {
    type: 'anthropic-api-key',
    severity: 'critical',
    pattern: /\b(sk-ant-[a-zA-Z0-9_-]{32,})\b/,
    description: 'Anthropic API key detected.',
  },
  {
    type: 'aws-access-key',
    severity: 'critical',
    pattern: /\b(AKIA[0-9A-Z]{16})\b/,
    description: 'AWS Access Key ID detected.',
  },
  {
    type: 'github-token',
    severity: 'critical',
    pattern: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})\b/,
    description: 'GitHub Personal Access Token detected.',
  },
  {
    type: 'google-api-key',
    severity: 'high',
    pattern: /\b(AIza[0-9A-Za-z-_]{35})\b/,
    description: 'Google API key detected.',
  },
  {
    type: 'database-uri',
    severity: 'critical',
    pattern: /\b(postgres|postgresql|mysql|mongodb|redis):\/\/[a-zA-Z0-9_.-]+:[^@\s]+@[a-zA-Z0-9_.-]+/i,
    description: 'Database connection string containing embedded credentials.',
  },
  {
    type: 'private-key',
    severity: 'critical',
    pattern: /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----/,
    description: 'Cryptographic private key header detected.',
  },
  {
    type: 'bearer-token',
    severity: 'high',
    pattern: /Bearer\s+([a-zA-Z0-9_.-]{32,})/i,
    description: 'Hardcoded HTTP Bearer authorization token.',
  },
];

function redactSecret(secret: string): string {
  if (secret.length <= 8) {
    return '***REDACTED***';
  }
  const prefix = secret.slice(0, 4);
  const suffix = secret.slice(-4);
  return `${prefix}...${suffix} [REDACTED]`;
}

function scanText(text: string, location: string): SecretLeakFinding[] {
  const findings: SecretLeakFinding[] = [];
  if (!text || typeof text !== 'string') return findings;

  for (const rule of SECRET_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      const rawSecret = match[1] || match[0];
      findings.push({
        type: rule.type,
        severity: rule.severity,
        location,
        matchedPattern: rule.type,
        redactedSnippet: redactSecret(rawSecret),
        description: rule.description,
      });
    }
  }

  return findings;
}

/**
 * Scans an MCP tool definition and its schemas recursively for leaked credentials
 */
export function scanToolForSecrets(tool: MCPTool): SecretLeakFinding[] {
  const findings: SecretLeakFinding[] = [];

  // 1. Scan tool name and description
  findings.push(...scanText(tool.name, `tool[${tool.name}].name`));
  if (tool.description) {
    findings.push(...scanText(tool.description, `tool[${tool.name}].description`));
  }

  // 2. Scan inputSchema properties descriptions and default values
  const properties = tool.inputSchema?.properties || {};
  for (const [propName, propSchema] of Object.entries(properties)) {
    const p = propSchema as any;
    if (p.description) {
      findings.push(...scanText(p.description, `tool[${tool.name}].parameters.${propName}.description`));
    }
    if (p.default && typeof p.default === 'string') {
      findings.push(...scanText(p.default, `tool[${tool.name}].parameters.${propName}.default`));
    }
    if (Array.isArray(p.enum)) {
      for (const enumVal of p.enum) {
        if (typeof enumVal === 'string') {
          findings.push(...scanText(enumVal, `tool[${tool.name}].parameters.${propName}.enum`));
        }
      }
    }
  }

  return findings;
}

/**
 * Scans an MCP resource definition
 */
export function scanResourceForSecrets(resource: MCPResource): SecretLeakFinding[] {
  const findings: SecretLeakFinding[] = [];
  findings.push(...scanText(resource.uri, `resource[${resource.name}].uri`));
  findings.push(...scanText(resource.name, `resource[${resource.name}].name`));
  if (resource.description) {
    findings.push(...scanText(resource.description, `resource[${resource.name}].description`));
  }
  return findings;
}

/**
 * High-level audit runner over all discovered tools and resources
 */
export function scanAllForSecrets(tools: MCPTool[], resources: MCPResource[] = []): SecretLeakFinding[] {
  const findings: SecretLeakFinding[] = [];

  for (const tool of tools) {
    findings.push(...scanToolForSecrets(tool));
  }

  for (const res of resources) {
    findings.push(...scanResourceForSecrets(res));
  }

  return findings;
}
