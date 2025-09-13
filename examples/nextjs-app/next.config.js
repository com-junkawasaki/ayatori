/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config, { isServer }) => {
    // Add hataori plugin for Merkle DAG processing
    if (!isServer) {
      config.plugins.push(
        new (require('hataori/webpack-plugin'))({
          merkleRoot: '../../dag.jsonnet'
        })
      );
    }
    return config;
  },
}

module.exports = nextConfig
