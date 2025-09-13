// Global type definitions for ISO GQL Client

// ISO/IEC 39075:2024 GQL Standard types
export type GQLValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: GQLValue }
  | GQLValue[];

export type GQLType =
  | 'String'
  | 'Int'
  | 'Float'
  | 'Boolean'
  | 'ID'
  | string; // Custom types

export interface GQLSchema {
  types: Record<string, GQLTypeDefinition>;
  queryType: string;
  mutationType?: string;
  subscriptionType?: string;
}

export interface GQLTypeDefinition {
  name: string;
  kind: 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT' | 'SCALAR';
  fields?: GQLField[];
  interfaces?: string[];
  possibleTypes?: string[];
  enumValues?: string[];
  inputFields?: GQLInputField[];
}

export interface GQLField {
  name: string;
  type: GQLTypeReference;
  args?: GQLArgument[];
  isDeprecated?: boolean;
  deprecationReason?: string;
}

export interface GQLArgument {
  name: string;
  type: GQLTypeReference;
  defaultValue?: GQLValue;
}

export interface GQLInputField {
  name: string;
  type: GQLTypeReference;
  defaultValue?: GQLValue;
}

export interface GQLTypeReference {
  kind: 'NON_NULL' | 'LIST' | 'NAMED';
  name?: string;
  ofType?: GQLTypeReference;
}

// Merkle DAG types
export interface MerkleNode {
  hash: string;
  data: any;
  children: string[];
  parent?: string;
}

export interface MerkleDAG {
  nodes: Map<string, MerkleNode>;
  root: string;
}

// Process Network types
export interface ProcessNode {
  id: string;
  type: string;
  dependencies: string[];
  outputs: string[];
  implementation: string;
  merkleHash?: string;
}

export interface ProcessEdge {
  from: string;
  to: string;
  dataFlow: string[];
}

export interface ProcessNetwork {
  nodes: Record<string, ProcessNode>;
  edges: ProcessEdge[];
}

// Client configuration types
export interface ClientConfig {
  endpoint: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: CacheConfig;
  merkleValidation?: boolean;
}

// Cache configuration types
export interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'LRU' | 'LFU' | 'TTL';
  enableMerkleValidation: boolean;
}

// Error types
export interface GQLErrorExtension {
  code?: string;
  exception?: {
    stacktrace: string[];
  };
  [key: string]: any;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
