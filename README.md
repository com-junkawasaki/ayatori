# ISO GQL Client

[![ISO/IEC 39075:2024](https://img.shields.io/badge/ISO/IEC%2039075-2024-blue.svg)](https://www.gqlstandards.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black.svg)](https://nextjs.org/)

型安全でMerkle DAGベースのISO/IEC 39075:2024準拠のGQLクライアントライブラリです。

## 特徴

- ✅ **ISO/IEC 39075:2024準拠**: 最新のGQL標準に完全準拠
- ✅ **完全型安全**: TypeScriptによる完全な型安全性を保証
- ✅ **Merkle DAGキャッシュ**: コンテンツアドレス可能なキャッシュシステム
- ✅ **プロセスネットワーク**: 決定論的ビルドと実行
- ✅ **Next.js統合**: React Hooksによるシームレスな統合
- ✅ **hataoriリンカー**: TypeScript Merkle Lambda Linkerとの統合

## インストール

```bash
npm install iso-gql-client
```

## クイックスタート

### 基本的な使用例

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

### Next.jsアプリケーションの設定

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

## アーキテクチャ

このライブラリはMerkle DAGベースのプロセスネットワークアーキテクチャを採用しています：

```
gql_parser → type_generator → client_runtime → cache_manager → nextjs_integration
```

各ノードは以下の役割を担います：

- **gql_parser**: GQLクエリの解析とAST生成
- **type_generator**: TypeScript型の自動生成
- **client_runtime**: 実行時クライアントの実装
- **cache_manager**: Merkle DAGベースのキャッシュ管理
- **nextjs_integration**: React HooksとNext.js統合

## 高度な機能

### 型安全なクエリビルダー

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

### Merkle DAGキャッシュ

```typescript
import { MerkleCacheManager } from 'iso-gql-client';

const cache = new MerkleCacheManager({
  maxSize: 1000,
  ttl: 300000,
  enableMerkleValidation: true,
});

// キャッシュ統計の取得
const stats = cache.getStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
console.log(`Merkle root: ${stats.merkleRoot}`);
```

### コンテンツアドレス可能ストレージ

```typescript
import { ContentAddressableCache } from 'iso-gql-client';

const caCache = new ContentAddressableCache();

// コンテンツによるキャッシュ
const contentHash = caCache.setByContent('user-query', responseData);

// ハッシュによる取得
const cachedData = caCache.getByContent(contentHash);
```

## 開発

### ビルド

```bash
npm run build
```

### テスト

```bash
npm test
```

### 型チェック

```bash
npm run typegen
```

## 設定

### TypeScript設定

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

### Next.js設定

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

## 例

完全な例は `examples/` ディレクトリを参照してください：

- `examples/nextjs-app/`: Next.jsを使用した完全なアプリケーション例

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 標準準拠

このライブラリは以下の標準に準拠しています：

- [ISO/IEC 39075:2024](https://www.gqlstandards.org/) - Information technology — Database languages — GQL
- [GraphQL Specification](https://spec.graphql.org/)
- [RFC 8949 - HTTP Message Signatures](https://datatracker.ietf.org/doc/rfc8949/)

## 関連プロジェクト

- [hataori](https://www.npmjs.com/package/hataori) - TypeScript Merkle Lambda Linker
- [GraphQL](https://graphql.org/) - Query language for APIs
- [Next.js](https://nextjs.org/) - The React Framework
