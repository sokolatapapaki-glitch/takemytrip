import type { NextConfig } from "next";

// Editor app reads/writes files OUTSIDE its own dir (../takemytrip, ../my-nextjs-app),
// so nothing special is needed here; keep config minimal.
const nextConfig: NextConfig = {};

export default nextConfig;
