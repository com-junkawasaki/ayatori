// Framework Adapter - Process Network Node: framework_adapter
// Generic framework integration layer for multiple frameworks

import { MerkleCacheManager } from '../core/cache';
import { GQLClient } from '../core/client';

// Framework adapter interface
export interface IFrameworkAdapter {
  name: string;
  version: string;
  initialize(client: GQLClient, cache: MerkleCacheManager): Promise<void>;
  destroy(): Promise<void>;
}

// Generic hook system
export interface IHookSystem {
  useQuery: <T = any, V = any>(query: string, options?: any) => any;
  useMutation: <T = any, V = any>(mutation: string, options?: any) => any;
  useSubscription: <T = any, V = any>(subscription: string, options?: any) => any;
}

// Framework bindings
export interface IFrameworkBindings {
  hooks: IHookSystem;
  components: Record<string, any>;
  utilities: Record<string, any>;
}

// Client bindings
export interface IClientBindings {
  createClient: (config: any) => GQLClient;
  createCache: (config?: any) => MerkleCacheManager;
  utilities: Record<string, any>;
}

// Base framework adapter class
export abstract class BaseFrameworkAdapter implements IFrameworkAdapter {
  abstract name: string;
  abstract version: string;

  protected client: GQLClient | null = null;
  protected cache: MerkleCacheManager | null = null;

  async initialize(client: GQLClient, cache: MerkleCacheManager): Promise<void> {
    this.client = client;
    this.cache = cache;
    await this.setup();
  }

  async destroy(): Promise<void> {
    await this.cleanup();
    this.client = null;
    this.cache = null;
  }

  protected abstract setup(): Promise<void>;
  protected abstract cleanup(): Promise<void>;
}

// Framework registry
class FrameworkRegistry {
  private adapters = new Map<string, IFrameworkAdapter>();

  register(name: string, adapter: IFrameworkAdapter): void {
    this.adapters.set(name, adapter);
  }

  get(name: string): IFrameworkAdapter | undefined {
    return this.adapters.get(name);
  }

  list(): string[] {
    return Array.from(this.adapters.keys());
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }
}

// Global framework registry
export const frameworkRegistry = new FrameworkRegistry();

// Register built-in adapters
frameworkRegistry.register('nextjs', new (require('./nextjs').NextJSAdapter)());
frameworkRegistry.register('react', new (require('./react').ReactAdapter)());
frameworkRegistry.register('vue', new (require('./vue').VueAdapter)());
frameworkRegistry.register('angular', new (require('./angular').AngularAdapter)());
frameworkRegistry.register('nodejs', new (require('./nodejs').NodeJSAdapter)());

// Framework detection utilities
export class FrameworkDetector {
  static detect(): string | null {
    // Browser environment check
    if (typeof window === 'undefined') {
      return 'nodejs';
    }

    // Type-safe window property access
    const w = window as any;

    // Next.js detection
    if (w.next) {
      return 'nextjs';
    }

    // React detection
    if (w.React) {
      return 'react';
    }

    // Vue detection
    if (w.Vue) {
      return 'vue';
    }

    // Angular detection
    if (w.ng) {
      return 'angular';
    }

    return null;
  }

  static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  static isServer(): boolean {
    return typeof window === 'undefined';
  }
}

// Auto-initialization function
export async function initializeFramework(
  client: GQLClient,
  cache: MerkleCacheManager,
  frameworkName?: string
): Promise<{
  bindings: IFrameworkBindings;
  clientBindings: IClientBindings;
}> {
  const detectedFramework = frameworkName || FrameworkDetector.detect();

  if (!detectedFramework) {
    throw new Error('Unable to detect framework. Please specify framework name explicitly.');
  }

  const adapter = frameworkRegistry.get(detectedFramework);

  if (!adapter) {
    throw new Error(`Framework adapter for '${detectedFramework}' not found. Available adapters: ${frameworkRegistry.list().join(', ')}`);
  }

  await adapter.initialize(client, cache);

  // Get framework-specific bindings
  const bindings = await getFrameworkBindings(detectedFramework);
  const clientBindings = getClientBindings();

  return {
    bindings,
    clientBindings
  };
}

// Get framework-specific bindings
async function getFrameworkBindings(frameworkName: string): Promise<IFrameworkBindings> {
  switch (frameworkName) {
    case 'nextjs':
      return await import('./nextjs').then(m => m.getNextJSBindings());
    case 'react':
      return await import('./react').then(m => m.getReactBindings());
    case 'vue':
      return await import('./vue').then(m => m.getVueBindings());
    case 'angular':
      return await import('./angular').then(m => m.getAngularBindings());
    case 'nodejs':
      return await import('./nodejs').then(m => m.getNodeJSBindings());
    default:
      throw new Error(`Unsupported framework: ${frameworkName}`);
  }
}

// Get client bindings (generic across frameworks)
function getClientBindings(): IClientBindings {
  return {
    createClient: (config: any) => new GQLClient(config),
    createCache: (config?: any) => new MerkleCacheManager(config),
    utilities: {
      generateMerkleHash: require('../utils/merkle').generateMerkleHash,
      validateGQLQuery: require('../utils/validation').validateGQLQuery
    }
  };
}

// Framework adapter factory
export function createFrameworkAdapter(frameworkName: string): IFrameworkAdapter | null {
  switch (frameworkName) {
    case 'nextjs':
      return require('./nextjs').NextJSAdapter ? new (require('./nextjs').NextJSAdapter)() : null;
    case 'react':
      return require('./react').ReactAdapter ? new (require('./react').ReactAdapter)() : null;
    case 'vue':
      return require('./vue').VueAdapter ? new (require('./vue').VueAdapter)() : null;
    case 'angular':
      return require('./angular').AngularAdapter ? new (require('./angular').AngularAdapter)() : null;
    case 'nodejs':
      return require('./nodejs').NodeJSAdapter ? new (require('./nodejs').NodeJSAdapter)() : null;
    default:
      return null;
  }
}

// Export types
export type {
  IFrameworkAdapter as FrameworkAdapter,
  IHookSystem as HookSystem,
  IFrameworkBindings as FrameworkBindings,
  IClientBindings as ClientBindings
} from './types';
