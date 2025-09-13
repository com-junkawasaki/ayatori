// Next.js Integration - Process Network Node: nextjs_integration
// React Hooks and Next.js specific features

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Observable, Subject } from 'rxjs';
import { GQLClient, GQLOperation, GQLResponse } from '../core/client';
import { MerkleCacheManager } from '../core/cache';

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

export interface UseMutationOptions<T = any, V = any> {
  variables?: V;
  optimisticResponse?: T;
  update?: (cache: MerkleCacheManager, mutationResult: T) => void;
  errorPolicy?: 'none' | 'ignore' | 'all';
}

export interface UseMutationResult<T = any, V = any> {
  mutate: (variables?: V) => Promise<GQLResponse<T>>;
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  called: boolean;
}

export interface UseSubscriptionOptions<T = any, V = any> {
  variables?: V;
  shouldResubscribe?: boolean | ((prevVariables: V, nextVariables: V) => boolean);
}

export interface UseSubscriptionResult<T = any> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Next.js GQL Provider Component
 */
export interface GQLProviderProps {
  client: GQLClient;
  cache?: MerkleCacheManager;
  children: React.ReactNode;
}

export const GQLProvider: React.FC<GQLProviderProps> = ({
  client,
  cache,
  children
}) => {
  // Context provider for GQL client and cache
  const contextValue = {
    client,
    cache: cache || new MerkleCacheManager()
  };

  return (
    <GQLContext.Provider value={contextValue}>
      {children}
    </GQLContext.Provider>
  );
};

/**
 * GQL Context
 */
export interface GQLContextValue {
  client: GQLClient;
  cache: MerkleCacheManager;
}

export const GQLContext = React.createContext<GQLContextValue | null>(null);

/**
 * Hook to access GQL client and cache
 */
export function useGQLContext(): GQLContextValue {
  const context = React.useContext(GQLContext);
  if (!context) {
    throw new Error('useGQLContext must be used within a GQLProvider');
  }
  return context;
}

/**
 * useQuery Hook - Type-safe GQL query execution
 */
export function useQuery<T = any, V = any>(
  query: string,
  options: UseQueryOptions<T, V> = {}
): UseQueryResult<T> {
  const { client, cache } = useGQLContext();
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
          result = cache.get(query) as GQLResponse<T>;
          if (!result) {
            throw new Error('No cached data available');
          }
          break;
        case 'network-only':
          result = await client.query(operation);
          break;
        case 'cache-and-network':
          const cachedResult = cache.get(query) as GQLResponse<T>;
          if (cachedResult) {
            setData(cachedResult.data);
          }
          result = await client.query(operation);
          break;
        default: // cache-first
          result = cache.get(query) as GQLResponse<T> || await client.query(operation);
      }

      setData(result.data);
      setNetworkStatus(NetworkStatus.ready);

      // Cache the result
      cache.set(query, result);

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setNetworkStatus(NetworkStatus.error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client, cache, query, options]);

  const refetch = useCallback(async (variables?: V) => {
    // Clear cache for this query
    cache.invalidateByDependencies([query]);
    return executeQuery(variables);
  }, [cache, query, executeQuery]);

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

/**
 * useMutation Hook - Type-safe GQL mutation execution
 */
export function useMutation<T = any, V = any>(
  mutation: string,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { client, cache } = useGQLContext();
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

/**
 * useSubscription Hook - GQL subscription management
 */
export function useSubscription<T = any, V = any>(
  subscription: string,
  options: UseSubscriptionOptions<T, V> = {}
): UseSubscriptionResult<T> {
  const { client } = useGQLContext();
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

/**
 * Server-side rendering support for Next.js
 */
export async function getServerSideGQLProps<T = any, V = any>(
  query: string,
  variables?: V,
  context?: any
): Promise<{ props: { gqlData: GQLResponse<T> } }> {
  // This would be used in Next.js getServerSideProps
  // Implementation depends on your GQL client setup
  const client = new GQLClient({
    endpoint: process.env.GQL_ENDPOINT || 'http://localhost:4000/graphql'
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
