import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'standalone', // Disabled for now - using npm start
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // מתעלם משגיאות ESLint בזמן build
  },
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
