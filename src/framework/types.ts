// Framework adapter types

export interface IFrameworkAdapter {
  name: string;
  version: string;
  initialize(client: any, cache: any): Promise<void>;
  destroy(): Promise<void>;
}

export interface IHookSystem {
  useQuery: <T = any, V = any>(query: string, options?: any) => any;
  useMutation: <T = any, V = any>(mutation: string, options?: any) => any;
  useSubscription: <T = any, V = any>(subscription: string, options?: any) => any;
}

export interface IFrameworkBindings {
  hooks: IHookSystem;
  components: Record<string, any>;
  utilities: Record<string, any>;
}

export interface IClientBindings {
  createClient: (config: any) => any;
  createCache: (config?: any) => any;
  utilities: Record<string, any>;
}

export interface FrameworkConfig {
  name: string;
  version?: string;
  options?: Record<string, any>;
}
