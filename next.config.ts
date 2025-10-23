import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Exclude backend directory from build
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
  // Exclude backend directory from TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  // Exclude backend directory from build
  experimental: {
    outputFileTracingExcludes: {
      '*': ['./backend/**/*'],
    },
  },
};

export default nextConfig;
