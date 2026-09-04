import Ajv from 'ajv';
import type { MCPTool } from './types.js';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: false,
});

export interface ToolValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates an MCP Tool definition against protocol constraints and JSON Schema rules.
 */
export function validateToolSchema(tool: MCPTool): ToolValidationResult {
  const errors: string[] = [];

  // 1. Tool name validation
  if (!tool.name || typeof tool.name !== 'string') {
    errors.push('Tool name must be a non-empty string.');
  } else if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tool.name)) {
    errors.push(`Tool name "${tool.name}" contains invalid characters or exceeds 64 characters. Must match ^[a-zA-Z0-9_-]{1,64}$`);
  }

  // 2. inputSchema structure validation
  if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
    errors.push(`Tool "${tool.name}" is missing inputSchema object.`);
    return { isValid: false, errors };
  }

  if (tool.inputSchema.type !== 'object') {
    errors.push(`Tool "${tool.name}" inputSchema.type must be "object". Received: "${tool.inputSchema.type}"`);
  }

  // 3. Compile schema with Ajv to ensure it's a valid JSON schema
  try {
    const isSchemaValid = ajv.validateSchema(tool.inputSchema);
    if (!isSchemaValid && ajv.errors) {
      for (const err of ajv.errors) {
        errors.push(`JSON Schema error in "${tool.name}": ${err.instancePath} ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`Schema compilation failed for "${tool.name}": ${err.message}`);
  }

  // 4. Validate required fields consistency
  if (tool.inputSchema.required) {
    if (!Array.isArray(tool.inputSchema.required)) {
      errors.push(`Tool "${tool.name}" required property must be an array of strings.`);
    } else {
      const properties = tool.inputSchema.properties || {};
      for (const reqField of tool.inputSchema.required) {
        if (typeof reqField !== 'string') {
          errors.push(`Tool "${tool.name}" required item must be a string.`);
        } else if (!properties[reqField]) {
          errors.push(`Tool "${tool.name}" required field "${reqField}" is not declared in properties.`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an entire list of tools
 */
export function validateAllTools(tools: MCPTool[]): { isValid: boolean; toolErrors: Record<string, string[]> } {
  const toolErrors: Record<string, string[]> = {};
  let overallValid = true;

  for (const tool of tools) {
    const result = validateToolSchema(tool);
    if (!result.isValid) {
      overallValid = false;
      toolErrors[tool.name || 'unnamed'] = result.errors;
    }
  }

  return {
    isValid: overallValid,
    toolErrors,
  };
}
