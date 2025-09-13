// Node.js Framework Adapter
// Implements framework adapter for Node.js applications

import { BaseFrameworkAdapter, IFrameworkBindings } from '../index';
import { IHookSystem } from '../types';
import { GQLClient } from '../../core/client';
import { MerkleCacheManager } from '../../core/cache';

// Node.js Framework Adapter
export class NodeJSAdapter extends BaseFrameworkAdapter {
  name = 'nodejs';
  version = process.version;

  protected async setup(): Promise<void> {
    console.log('Node.js framework adapter initialized');
  }

  protected async cleanup(): Promise<void> {
    console.log('Node.js framework adapter cleaned up');
  }
}

// Node.js Hook System (simplified - Node.js doesn't have hooks concept)
class NodeJSHookSystem implements IHookSystem {
  constructor(private client: GQLClient, private cache: MerkleCacheManager) {}

  useQuery<T = any, V = any>(query: string, options?: any) {
    // Node.js doesn't have hooks, return a function-based API
    return {
      execute: async (variables?: V) => {
        return await this.client.query<T, V>({ query, variables });
      },
      data: undefined,
      loading: false,
      error: undefined,
      refetch: async (variables?: V) => {
        return await this.client.query<T, V>({ query, variables });
      }
    };
  }

  useMutation<T = any, V = any>(mutation: string, options?: any) {
    return {
      mutate: async (variables?: V) => {
        return await this.client.mutate<T, V>({ query: mutation, variables });
      },
      data: undefined,
      loading: false,
      error: undefined,
      called: false
    };
  }

  useSubscription<T = any, V = any>(subscription: string, options?: any) {
    return {
      subscribe: (callback: (data: T) => void) => {
        const operation = { query: subscription, variables: options?.variables };
        const subscription$ = this.client.subscribe(operation);

        return subscription$.subscribe({
          next: (result) => callback(result.data),
          error: (err) => console.error('Subscription error:', err)
        });
      },
      data: undefined,
      loading: false,
      error: undefined
    };
  }
}

// Get Node.js bindings
export function getNodeJSBindings(): IFrameworkBindings {
  return {
    hooks: new NodeJSHookSystem(
      new GQLClient({ endpoint: '' }),
      new MerkleCacheManager()
    ),
    components: {}, // Node.js doesn't have components
    utilities: {
      // Node.js specific utilities
      createServerClient: (endpoint: string) => new GQLClient({ endpoint }),
      createServerCache: (config?: any) => new MerkleCacheManager(config)
    }
  };
}

// NodeJSAdapter is already exported as class declaration
