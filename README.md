# ISO GQL Client

[![ISO/IEC 39075:2024](https://img.shields.io/badge/ISO/IEC%2039075-2024-blue.svg)](https://www.gqlstandards.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black.svg)](https://nextjs.org/)

A type-safe, Merkle DAG-based GQL client library compliant with ISO/IEC 39075:2024 standards.

## Features

- ✅ **ISO/IEC 39075:2024 Compliant**: Fully compliant with the latest GQL standard
- ✅ **Complete Type Safety**: Ensures complete type safety through TypeScript
- ✅ **Merkle DAG Cache**: Content-addressable caching system
- ✅ **Process Network**: Deterministic build and execution
- ✅ **Next.js Integration**: Seamless integration with React Hooks
- ✅ **hataori Linker**: Integration with TypeScript Merkle Lambda Linker

## Installation

```bash
npm install iso-gql-client
```

## Quick Start

### Basic Usage Example

```typescript
import { createGQLClient, useQuery } from 'iso-gql-client';

const client = createGQLClient({
  endpoint: 'https://api.example.com/graphql'
});

// React Hookでの使用
function MyComponent() {
  const { data, loading, error } = useQuery(`
    query GetUsers {
      users {
        id
        name
        email
      }
    }
  `);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Next.js Application Setup

```typescript
// lib/gql-client.ts
import { createGQLClient, MerkleCacheManager } from 'iso-gql-client';

export const gqlClient = createGQLClient({
  endpoint: process.env.NEXT_PUBLIC_GQL_ENDPOINT!,
  timeout: 10000,
  retries: 3,
});

export const cacheManager = new MerkleCacheManager({
  maxSize: 100,
  ttl: 300000, // 5分
  enableMerkleValidation: true,
});

// app/layout.tsx
import { GQLProvider } from 'iso-gql-client';
import { gqlClient, cacheManager } from '../lib/gql-client';

export default function RootLayout({ children }) {
  return (
    <GQLProvider client={gqlClient} cache={cacheManager}>
      {children}
    </GQLProvider>
  );
}
```

## Architecture

This library adopts a Merkle DAG-based process network architecture:

```
gql_parser → type_generator → client_runtime → cache_manager → nextjs_integration
```

Each node plays the following roles:

- **gql_parser**: Parses GQL queries and generates AST
- **type_generator**: Automatically generates TypeScript types
- **client_runtime**: Implements the runtime client
- **cache_manager**: Manages Merkle DAG-based caching
- **nextjs_integration**: Integrates React Hooks with Next.js

## Advanced Features

### Type-Safe Query Builder

```typescript
import { TypedQueryBuilder } from 'iso-gql-client';

interface User {
  id: string;
  name: string;
  email: string;
}

interface GetUsersResponse {
  users: User[];
}

const queryBuilder = new TypedQueryBuilder<GetUsersResponse>(client);
const result = await queryBuilder.execute(`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`);
```

### Merkle DAG Cache

```typescript
import { MerkleCacheManager } from 'iso-gql-client';

const cache = new MerkleCacheManager({
  maxSize: 1000,
  ttl: 300000,
  enableMerkleValidation: true,
});

// Get cache statistics
const stats = cache.getStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
console.log(`Merkle root: ${stats.merkleRoot}`);
```

### Content-Addressable Storage

```typescript
import { ContentAddressableCache } from 'iso-gql-client';

const caCache = new ContentAddressableCache();

// Cache by content
const contentHash = caCache.setByContent('user-query', responseData);

// Retrieve by hash
const cachedData = caCache.getByContent(contentHash);
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Type Check

```bash
npm run typegen
```

## Configuration

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "hataori",
        "options": {
          "merkleRoot": "./dag.jsonnet"
        }
      }
    ]
  }
}
```

### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new (require('hataori/webpack-plugin'))({
          merkleRoot: './dag.jsonnet'
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
```

## Examples

Complete examples can be found in the `examples/` directory:

- `examples/nextjs-app/`: Complete application example using Next.js

## Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Standards Compliance

This library complies with the following standards:

- [ISO/IEC 39075:2024](https://www.gqlstandards.org/) - Information technology — Database languages — GQL
- [GraphQL Specification](https://spec.graphql.org/)
- [RFC 8949 - HTTP Message Signatures](https://datatracker.ietf.org/doc/rfc8949/)

## Related Projects

- [hataori](https://www.npmjs.com/package/hataori) - TypeScript Merkle Lambda Linker
- [GraphQL](https://graphql.org/) - Query language for APIs
- [Next.js](https://nextjs.org/) - The React Framework
