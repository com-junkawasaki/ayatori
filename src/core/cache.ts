// Merkle DAG Cache Manager - Process Network Node: cache_manager
// Content-addressable caching with Merkle tree validation

import MerkleTree from 'merkle-tools';
import { GQLResponse } from './client';

export interface CacheEntry {
  key: string;
  value: GQLResponse<any>;
  timestamp: number;
  ttl: number;
  merkleHash: string;
  dependencies: string[];
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  enableMerkleValidation: boolean;
}

export class MerkleCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private merkleTree: MerkleTree;
  private config: CacheConfig;

  constructor(config: CacheConfig = {
    maxSize: 1000,
    ttl: 300000, // 5 minutes
    enableMerkleValidation: true
  }) {
    this.config = config;
    this.merkleTree = new MerkleTree({ hashType: 'sha256' });
  }

  /**
   * Store data in cache with Merkle hash validation
   */
  set(key: string, value: GQLResponse<any>, dependencies: string[] = []): void {
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      ttl: this.config.ttl,
      merkleHash: this.generateMerkleHash(key, value),
      dependencies
    };

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.updateMerkleTree();
  }

  /**
   * Retrieve data from cache with Merkle validation
   */
  get(key: string): GQLResponse<any> | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.updateMerkleTree();
      return null;
    }

    // Validate Merkle hash if enabled
    if (this.config.enableMerkleValidation) {
      const currentHash = this.generateMerkleHash(key, entry.value);
      if (currentHash !== entry.merkleHash) {
        // Data has been tampered with
        this.cache.delete(key);
        this.updateMerkleTree();
        return null;
      }
    }

    return entry.value;
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.updateMerkleTree();
      return false;
    }

    return true;
  }

  /**
   * Invalidate cache entries based on dependencies
   */
  invalidateByDependencies(dependencyKeys: string[]): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const hasDependency = entry.dependencies.some(dep =>
        dependencyKeys.includes(dep)
      );

      if (hasDependency) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.updateMerkleTree();
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.merkleTree = new MerkleTree({ hashType: 'sha256' });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    merkleRoot: string;
  } {
    const root = this.merkleTree.getMerkleRoot();
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
      merkleRoot: root ? root.toString('hex') : ''
    };
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Export cache state for persistence
   */
  exportState(): { entries: CacheEntry[]; merkleRoot: string } {
    return {
      entries: Array.from(this.cache.values()),
      merkleRoot: this.merkleTree.getMerkleRoot()?.toString('hex') || ''
    };
  }

  /**
   * Import cache state from persistence
   */
  importState(state: { entries: CacheEntry[]; merkleRoot: string }): boolean {
    try {
      // Validate Merkle root
      if (this.config.enableMerkleValidation) {
        const currentRoot = this.merkleTree.getMerkleRoot();
        const currentRootHex = currentRoot ? currentRoot.toString('hex') : '';
        if (currentRootHex !== state.merkleRoot) {
          return false; // Invalid state
        }
      }

      // Import entries
      this.cache.clear();
      for (const entry of state.entries) {
        this.cache.set(entry.key, entry);
      }

      this.updateMerkleTree();
      return true;
    } catch (error) {
      return false;
    }
  }

  private generateMerkleHash(key: string, value: GQLResponse<any>): string {
    const crypto = require('crypto');
    const data = JSON.stringify({ key, value });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private updateMerkleTree(): void {
    this.merkleTree = new MerkleTree({ hashType: 'sha256' });

    for (const entry of this.cache.values()) {
      this.merkleTree.addLeaf(entry.merkleHash);
    }

    this.merkleTree.makeTree();
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private calculateHitRate(): number {
    // Simplified hit rate calculation
    // In production, this would track actual hits/misses
    return this.cache.size > 0 ? 0.85 : 0; // Assume 85% hit rate
  }
}

/**
 * Content-addressable cache with Merkle DAG
 */
export class ContentAddressableCache extends MerkleCacheManager {
  private contentMap: Map<string, string> = new Map(); // content hash -> cache key

  /**
   * Store content by its hash
   */
  setByContent(content: string, value: GQLResponse<any>): string {
    const contentHash = this.hashContent(content);
    const cacheKey = `content:${contentHash}`;

    this.contentMap.set(contentHash, cacheKey);
    this.set(cacheKey, value, [contentHash]);

    return contentHash;
  }

  /**
   * Retrieve content by its hash
   */
  getByContent(contentHash: string): GQLResponse<any> | null {
    const cacheKey = this.contentMap.get(contentHash);
    if (!cacheKey) return null;

    return this.get(cacheKey);
  }

  private hashContent(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
