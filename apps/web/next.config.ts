import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@echo/inference-core"],
  poweredByHeader: false,
};

export default nextConfig;
