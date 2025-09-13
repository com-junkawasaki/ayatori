// Main exports for ISO GQL Client
// Merkle DAG based architecture with hataori linker

// Core modules
export { GQLParser, type GQLAST, type SelectionNode, type Directive } from './core/parser';
export {
  TypeGenerator,
  type GeneratedTypes,
  type TypeDefinition,
  type FieldDefinition,
  type ArgumentDefinition
} from './core/typegen';
export {
  GQLClient,
  createGQLClient,
  TypedQueryBuilder,
  TypedMutationBuilder,
  type GQLClientConfig,
  type GQLOperation,
  type GQLResponse,
  type GQLError
} from './core/client';
export {
  MerkleCacheManager,
  ContentAddressableCache,
  type CacheEntry,
  type CacheConfig
} from './core/cache';

// Next.js integration
export {
  GQLProvider,
  useGQLContext,
  useQuery,
  useMutation,
  useSubscription,
  getServerSideGQLProps,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
  type UseSubscriptionOptions,
  type UseSubscriptionResult,
  type GQLProviderProps,
  type GQLContextValue,
  NetworkStatus
} from './nextjs';

// Types
export * from './types';

// Utilities
export { validateGQLQuery } from './utils/validation';
export { generateMerkleHash } from './utils/merkle';

// Version info
export const VERSION = '1.0.0';
export const GQL_STANDARD = 'ISO/IEC 39075:2024';
