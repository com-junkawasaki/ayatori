// Merkle DAG Utilities
// Content-addressable hashing for deterministic builds

import MerkleTree from 'merkle-tools';
import { MerkleNode, MerkleDAG } from '../types';

/**
 * Generate SHA-256 hash for content
 */
export function generateMerkleHash(data: any): string {
  const crypto = require('crypto');
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Create Merkle tree from data array
 */
export function createMerkleTree(data: any[]): MerkleTree {
  const tree = new MerkleTree({ hashType: 'sha256' });

  data.forEach(item => {
    const hash = generateMerkleHash(item);
    tree.addLeaf(hash);
  });

  tree.makeTree();
  return tree;
}

/**
 * Build Merkle DAG from process network
 */
export function buildMerkleDAG(nodes: Record<string, any>): MerkleDAG {
  const merkleNodes = new Map<string, MerkleNode>();
  const processed = new Set<string>();

  // Process nodes in topological order
  const processNode = (nodeId: string, node: any): string => {
    if (processed.has(nodeId)) {
      return merkleNodes.get(nodeId)!.hash;
    }

    const children: string[] = [];

    // Process dependencies first
    if (node.dependencies) {
      for (const depId of node.dependencies) {
        if (nodes[depId]) {
          children.push(processNode(depId, nodes[depId]));
        }
      }
    }

    // Create node data
    const nodeData = {
      id: nodeId,
      type: node.type,
      implementation: node.implementation,
      outputs: node.outputs
    };

    // Generate hash including children
    const hashInput = JSON.stringify({
      ...nodeData,
      children
    });

    const hash = generateMerkleHash(hashInput);

    const merkleNode: MerkleNode = {
      hash,
      data: nodeData,
      children,
      parent: node.parent
    };

    merkleNodes.set(nodeId, merkleNode);
    processed.add(nodeId);

    return hash;
  };

  // Find root nodes (no dependencies)
  const rootNodes = Object.keys(nodes).filter(id =>
    !nodes[id].dependencies || nodes[id].dependencies.length === 0
  );

  // Process all nodes
  let rootHash = '';
  for (const rootId of rootNodes) {
    const hash = processNode(rootId, nodes[rootId]);
    if (!rootHash) rootHash = hash;
  }

  return {
    nodes: merkleNodes,
    root: rootHash
  };
}

/**
 * Validate Merkle DAG integrity
 */
export function validateMerkleDAG(dag: MerkleDAG): boolean {
  try {
    for (const [nodeId, node] of dag.nodes) {
      // Verify node hash
      const expectedHash = generateMerkleHash({
        id: nodeId,
        type: node.data.type,
        implementation: node.data.implementation,
        outputs: node.data.outputs,
        children: node.children
      });

      if (expectedHash !== node.hash) {
        return false;
      }

      // Verify children exist
      for (const childHash of node.children) {
        const childExists = Array.from(dag.nodes.values())
          .some(n => n.hash === childHash);
        if (!childExists) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get dependency chain for a node
 */
export function getDependencyChain(
  dag: MerkleDAG,
  nodeId: string
): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();

  const traverse = (currentId: string): void => {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const node = dag.nodes.get(currentId);
    if (!node) return;

    // Add current node
    chain.push(currentId);

    // Traverse children (dependencies)
    for (const childHash of node.children) {
      const childNode = Array.from(dag.nodes.entries())
        .find(([_, n]) => n.hash === childHash);

      if (childNode) {
        traverse(childNode[0]);
      }
    }
  };

  traverse(nodeId);
  return chain;
}

/**
 * Compute content address for a file
 */
export function computeContentAddress(content: string): string {
  return generateMerkleHash(content);
}

/**
 * Verify content integrity using Merkle hash
 */
export function verifyContentIntegrity(
  content: string,
  expectedHash: string
): boolean {
  const actualHash = computeContentAddress(content);
  return actualHash === expectedHash;
}

/**
 * Generate deterministic build hash
 */
export function generateBuildHash(sources: Record<string, string>): string {
  const sortedSources = Object.keys(sources)
    .sort()
    .map(key => `${key}:${computeContentAddress(sources[key])}`)
    .join('\n');

  return generateMerkleHash(sortedSources);
}
