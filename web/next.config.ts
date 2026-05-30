import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained build (.next/standalone) so the Docker image
  // can run with just Node + the standalone output — no full node_modules.
  output: "standalone",
};

export default nextConfig;
