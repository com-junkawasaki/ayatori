// Next.js Framework Adapter
// Implements framework adapter for Next.js applications

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Observable, Subject } from 'rxjs';
import { GQLClient, GQLOperation, GQLResponse } from '../../core/client';
import { MerkleCacheManager } from '../../core/cache';
import { BaseFrameworkAdapter, IFrameworkBindings } from '../index';
import { IHookSystem } from '../types';

// Next.js specific types (re-exporting from original implementation)
export interface UseQueryOptions<T = any, V = any> {
  skip?: boolean;
  pollInterval?: number;
  notifyOnNetworkStatusChange?: boolean;
  fetchPolicy?: 'cache-first' | 'cache-only' | 'network-only' | 'cache-and-network';
  errorPolicy?: 'none' | 'ignore' | 'all';
  variables?: V;
}

export interface UseQueryResult<T = any> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: (variables?: any) => Promise<GQLResponse<T>>;
  networkStatus: NetworkStatus;
}

export enum NetworkStatus {
  loading = 1,
  setVariables = 2,
  fetchMore = 3,
  refetch = 4,
  poll = 6,
  ready = 7,
  error = 8,
}

// Next.js Framework Adapter
export class NextJSAdapter extends BaseFrameworkAdapter {
  name = 'nextjs';
  version = '14.0.0';

  protected async setup(): Promise<void> {
    // Next.js specific setup
    console.log('Next.js framework adapter initialized');
  }

  protected async cleanup(): Promise<void> {
    // Next.js specific cleanup
    console.log('Next.js framework adapter cleaned up');
  }
}

// Next.js Hook System
class NextJSHookSystem implements IHookSystem {
  constructor(private client: GQLClient, private cache: MerkleCacheManager) {}

  useQuery<T = any, V = any>(
    query: string,
    options: UseQueryOptions<T, V> = {}
  ): UseQueryResult<T> {
    const [data, setData] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(NetworkStatus.ready);

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const optionsRef = useRef(options);

    // Update options ref when options change
    useEffect(() => {
      optionsRef.current = options;
    }, [options]);

    const executeQuery = useCallback(async (variables?: V) => {
      setLoading(true);
      setNetworkStatus(NetworkStatus.loading);
      setError(undefined);

      try {
        const operation: GQLOperation<T, V> = {
          query,
          variables: variables || options.variables
        };

        let result: GQLResponse<T>;

        // Check fetch policy
        const fetchPolicy = options.fetchPolicy || 'cache-first';

        switch (fetchPolicy) {
          case 'cache-only':
            result = this.cache.get(query) as GQLResponse<T>;
            if (!result) {
              throw new Error('No cached data available');
            }
            break;
          case 'network-only':
            result = await this.client.query(operation);
            break;
          case 'cache-and-network':
            const cachedResult = this.cache.get(query) as GQLResponse<T>;
            if (cachedResult) {
              setData(cachedResult.data);
            }
            result = await this.client.query(operation);
            break;
          default: // cache-first
            result = this.cache.get(query) as GQLResponse<T> || await this.client.query(operation);
        }

        setData(result.data);
        setNetworkStatus(NetworkStatus.ready);

        // Cache the result
        this.cache.set(query, result);

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        setNetworkStatus(NetworkStatus.error);
        throw error;
      } finally {
        setLoading(false);
      }
    }, [this.client, this.cache, query, options]);

    const refetch = useCallback(async (variables?: V) => {
      // Clear cache for this query
      this.cache.invalidateByDependencies([query]);
      return executeQuery(variables);
    }, [this.cache, query, executeQuery]);

    // Initial query execution
    useEffect(() => {
      if (!options.skip) {
        executeQuery();
      }
    }, [executeQuery, options.skip]);

    // Polling
    useEffect(() => {
      if (options.pollInterval && options.pollInterval > 0) {
        pollIntervalRef.current = setInterval(() => {
          executeQuery();
        }, options.pollInterval);
      }

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }, [executeQuery, options.pollInterval]);

    return {
      data,
      loading,
      error,
      refetch,
      networkStatus
    };
  }

  useMutation<T = any, V = any>(
    mutation: string,
    options: any = {}
  ): any {
    const { client, cache } = { client: this.client, cache: this.cache };
    const [data, setData] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const [called, setCalled] = useState<boolean>(false);

    const mutate = useCallback(async (variables?: V) => {
      setLoading(true);
      setError(undefined);
      setCalled(true);

      try {
        const operation: GQLOperation<T, V> = {
          query: mutation,
          variables: variables || options.variables
        };

        const result = await client.mutate(operation);

        setData(result.data);

        // Handle optimistic updates
        if (options.update && result.data) {
          options.update(cache, result.data);
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        if (options.errorPolicy === 'ignore') {
          return { data: undefined, errors: [] } as GQLResponse<T>;
        }

        throw error;
      } finally {
        setLoading(false);
      }
    }, [client, cache, mutation, options]);

    return {
      mutate,
      data,
      loading,
      error,
      called
    };
  }

  useSubscription<T = any, V = any>(
    subscription: string,
    options: any = {}
  ): any {
    const { client } = { client: this.client };
    const [data, setData] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | undefined>(undefined);

    useEffect(() => {
      const operation: GQLOperation<T, V> = {
        query: subscription,
        variables: options.variables
      };

      const subscription$ = client.subscribe(operation);

      const subscriptionHandle = subscription$.subscribe({
        next: (result) => {
          setData(result.data);
          setLoading(false);
          setError(undefined);
        },
        error: (err) => {
          setError(err);
          setLoading(false);
        }
      });

      return () => {
        subscriptionHandle.unsubscribe();
      };
    }, [client, subscription, options.variables]);

    return {
      data,
      loading,
      error
    };
  }
}

// Next.js Components
const NextJSComponents = {
  GQLProvider: ({ client, cache, children }: any) => {
    // Context provider for GQL client and cache
    const contextValue = {
      client,
      cache: cache || new MerkleCacheManager()
    };

    return React.createElement(
      React.createContext(contextValue).Provider,
      { value: contextValue },
      children
    );
  }
};

// Next.js Utilities
const NextJSUtilities = {
  getServerSideGQLProps: async <T = any, V = any>(
    query: string,
    variables?: V,
    context?: any
  ) => {
    // Server-side rendering support for Next.js
    const client = new GQLClient({
      endpoint: process.env.NEXT_PUBLIC_GQL_ENDPOINT || 'http://localhost:4000/graphql'
    });

    try {
      const result = await client.query<T, V>({
        query,
        variables
      });

      return {
        props: {
          gqlData: result
        }
      };
    } catch (error) {
      const err = error as Error;
      return {
        props: {
          gqlData: { errors: [{ message: err.message }] }
        }
      };
    }
  }
};

// Get Next.js bindings
export function getNextJSBindings(): IFrameworkBindings {
  return {
    hooks: new NextJSHookSystem(
      new GQLClient({ endpoint: '' }),
      new MerkleCacheManager()
    ),
    components: NextJSComponents,
    utilities: NextJSUtilities
  };
}

// NextJSAdapter is already exported as class declaration
