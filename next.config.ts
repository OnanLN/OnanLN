import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: ["node:sqlite"],
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
