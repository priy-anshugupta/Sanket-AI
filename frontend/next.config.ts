import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "10.92.126.169",
    "10.92.126.169:3000",
    "localhost:3000",
    "127.0.0.1:3000",
    "*"
  ],
};

export default nextConfig;
