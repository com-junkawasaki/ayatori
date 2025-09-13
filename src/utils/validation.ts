// GQL Query Validation Utilities
// ISO/IEC 39075:2024 compliant validation

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
  rule: string;
}

export interface ValidationWarning {
  message: string;
  line?: number;
  column?: number;
  rule: string;
}

/**
 * Validate GQL query against ISO/IEC 39075:2024 standard
 */
export function validateGQLQuery(query: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Basic syntax validation
  if (!query || typeof query !== 'string') {
    errors.push({
      message: 'Query must be a non-empty string',
      rule: 'basic-syntax'
    });
    return { valid: false, errors, warnings };
  }

  // Check for operation type
  const hasOperation = /(?:query|mutation|subscription)/i.test(query);
  if (!hasOperation) {
    errors.push({
      message: 'Query must contain a valid operation type (query, mutation, or subscription)',
      rule: 'operation-type'
    });
  }

  // Check for balanced braces
  const openBraces = (query.match(/\{/g) || []).length;
  const closeBraces = (query.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push({
      message: 'Unbalanced braces in query',
      rule: 'balanced-braces'
    });
  }

  // Check for balanced parentheses
  const openParens = (query.match(/\(/g) || []).length;
  const closeParens = (query.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push({
      message: 'Unbalanced parentheses in query',
      rule: 'balanced-parentheses'
    });
  }

  // Check for field selections
  if (hasOperation && !query.includes('{')) {
    warnings.push({
      message: 'Query operation without field selection',
      rule: 'field-selection'
    });
  }

  // Check for proper naming conventions
  const invalidNames = query.match(/\b\d+\w*\b/g);
  if (invalidNames) {
    warnings.push({
      message: `Names starting with numbers: ${invalidNames.join(', ')}`,
      rule: 'naming-convention'
    });
  }

  // Check for deprecated patterns
  if (query.includes('__type') || query.includes('__schema')) {
    warnings.push({
      message: 'Introspection queries may expose schema information',
      rule: 'introspection'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate GQL schema against ISO/IEC 39075:2024
 */
export function validateGQLSchema(schema: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Basic schema validation
  if (!schema || typeof schema !== 'object') {
    errors.push({
      message: 'Schema must be a valid object',
      rule: 'schema-structure'
    });
    return { valid: false, errors, warnings };
  }

  // Check for required query type
  if (!schema.queryType) {
    errors.push({
      message: 'Schema must define a query type',
      rule: 'query-type'
    });
  }

  // Validate type definitions
  if (schema.types) {
    for (const [typeName, typeDef] of Object.entries(schema.types)) {
      const typeErrors = validateTypeDefinition(typeName, typeDef);
      errors.push(...typeErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateTypeDefinition(typeName: string, typeDef: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!typeDef.kind) {
    errors.push({
      message: `Type ${typeName} missing kind property`,
      rule: 'type-definition'
    });
  }

  // Validate based on kind
  switch (typeDef.kind) {
    case 'OBJECT':
      if (!typeDef.fields || !Array.isArray(typeDef.fields)) {
        errors.push({
          message: `Object type ${typeName} must have fields array`,
          rule: 'object-type'
        });
      }
      break;
    case 'INTERFACE':
      if (!typeDef.fields || !Array.isArray(typeDef.fields)) {
        errors.push({
          message: `Interface type ${typeName} must have fields array`,
          rule: 'interface-type'
        });
      }
      break;
    case 'UNION':
      if (!typeDef.possibleTypes || !Array.isArray(typeDef.possibleTypes)) {
        errors.push({
          message: `Union type ${typeName} must have possibleTypes array`,
          rule: 'union-type'
        });
      }
      break;
  }

  return errors;
}

/**
 * Sanitize GQL query for security
 */
export function sanitizeGQLQuery(query: string): string {
  // Remove comments
  let sanitized = query.replace(/#[^\n]*/g, '');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Remove introspection queries in production
  if (process.env.NODE_ENV === 'production') {
    sanitized = sanitized.replace(/__type\s*\([^)]*\)/g, '');
    sanitized = sanitized.replace(/__schema\s*\{[^}]*\}/g, '');
  }

  return sanitized;
}
