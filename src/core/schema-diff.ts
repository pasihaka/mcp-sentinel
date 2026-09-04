import type { MCPTool, SchemaDiffItem, SchemaDiffResult } from './types.js';

/**
 * Deterministically sorts object keys deeply to generate a stable canonical string representation.
 */
export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item)).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  const pairs = keys.map(key => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes SHA-256 canonical hash using standard Web Crypto API (supported natively in Cloudflare Workers and Node 18+)
 */
export async function computeCanonicalHash(tools: MCPTool[]): Promise<string> {
  const sortedTools = [...tools].sort((a, b) => a.name.localeCompare(b.name));
  const canonicalJson = canonicalStringify(sortedTools);

  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalJson);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compares two snapshots of MCP tools and produces a structured, actionable diff report.
 */
export async function diffToolSchemas(
  oldTools: MCPTool[],
  newTools: MCPTool[],
  previousHash?: string
): Promise<SchemaDiffResult> {
  const newHash = await computeCanonicalHash(newTools);
  const oldHash = previousHash || (await computeCanonicalHash(oldTools));

  if (oldHash === newHash) {
    return {
      hasDrift: false,
      isBreaking: false,
      canonicalHash: newHash,
      previousHash: oldHash,
      diffs: [],
    };
  }

  const diffs: SchemaDiffItem[] = [];
  const oldMap = new Map<string, MCPTool>(oldTools.map(t => [t.name, t]));
  const newMap = new Map<string, MCPTool>(newTools.map(t => [t.name, t]));

  // 1. Check for removed tools (Breaking)
  for (const [name, oldTool] of oldMap) {
    if (!newMap.has(name)) {
      diffs.push({
        type: 'breaking',
        category: 'tool-removed',
        path: `tool.${name}`,
        message: `Tool "${name}" was removed from the server.`,
        oldValue: oldTool,
      });
    }
  }

  // 2. Check for newly added tools (Non-breaking)
  for (const [name, newTool] of newMap) {
    if (!oldMap.has(name)) {
      diffs.push({
        type: 'non-breaking',
        category: 'tool-added',
        path: `tool.${name}`,
        message: `New tool "${name}" was added to the server.`,
        newValue: newTool,
      });
    }
  }

  // 3. Inspect common tools for parameter and schema drift
  for (const [name, newTool] of newMap) {
    const oldTool = oldMap.get(name);
    if (!oldTool) continue;

    // Check description changes
    if (oldTool.description !== newTool.description) {
      diffs.push({
        type: 'non-breaking',
        category: 'description-changed',
        path: `tool.${name}.description`,
        message: `Tool "${name}" description was updated.`,
        oldValue: oldTool.description,
        newValue: newTool.description,
      });
    }

    const oldProps = oldTool.inputSchema?.properties || {};
    const newProps = newTool.inputSchema?.properties || {};
    const oldRequired = new Set(oldTool.inputSchema?.required || []);
    const newRequired = new Set(newTool.inputSchema?.required || []);

    // Check removed parameters (Breaking)
    for (const propName of Object.keys(oldProps)) {
      if (!(propName in newProps)) {
        diffs.push({
          type: 'breaking',
          category: 'param-removed',
          path: `tool.${name}.parameters.${propName}`,
          message: `Parameter "${propName}" was removed from tool "${name}".`,
          oldValue: oldProps[propName],
        });
      }
    }

    // Check added parameters
    for (const [propName, propSchema] of Object.entries(newProps)) {
      if (!(propName in oldProps)) {
        const isRequired = newRequired.has(propName);
        diffs.push({
          type: isRequired ? 'breaking' : 'non-breaking',
          category: isRequired ? 'param-added-required' : 'param-added-optional',
          path: `tool.${name}.parameters.${propName}`,
          message: isRequired
            ? `New REQUIRED parameter "${propName}" added to tool "${name}". Agents without this parameter will fail.`
            : `New optional parameter "${propName}" added to tool "${name}".`,
          newValue: propSchema,
        });
      } else {
        // Parameter existed, check type mutation
        const oldType = (oldProps[propName] as any)?.type;
        const newType = (propSchema as any)?.type;

        if (oldType && newType && oldType !== newType) {
          diffs.push({
            type: 'breaking',
            category: 'param-type-changed',
            path: `tool.${name}.parameters.${propName}.type`,
            message: `Parameter "${propName}" type changed from "${oldType}" to "${newType}".`,
            oldValue: oldType,
            newValue: newType,
          });
        }

        // Check if an existing optional parameter was made required
        if (!oldRequired.has(propName) && newRequired.has(propName)) {
          diffs.push({
            type: 'breaking',
            category: 'param-added-required',
            path: `tool.${name}.parameters.${propName}.required`,
            message: `Existing parameter "${propName}" was made REQUIRED on tool "${name}".`,
            oldValue: false,
            newValue: true,
          });
        }
      }
    }
  }

  const isBreaking = diffs.some(d => d.type === 'breaking');

  return {
    hasDrift: diffs.length > 0,
    isBreaking,
    canonicalHash: newHash,
    previousHash: oldHash,
    diffs,
  };
}
