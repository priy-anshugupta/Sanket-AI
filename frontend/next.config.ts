import type { NextConfig } from "next";
import os from "os";

// Automatically discover all active network IPv4 addresses on the laptop
const getLocalIps = (): string[] => {
  const ips: string[] = ["localhost", "127.0.0.1", "0.0.0.0"];
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          ips.push(iface.address);
          ips.push(`${iface.address}:3000`);
        }
      }
    }
  } catch {}
  return ips;
};

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    ...getLocalIps(),
    "10.58.177.169",
    "10.58.177.169:3000",
    "10.92.126.169",
    "10.92.126.169:3000",
    "localhost:3000",
    "127.0.0.1:3000",
    "*"
  ],
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/ws/:path*',
        destination: `${backendUrl}/ws/:path*`,
      },
    ];
  },
};

export default nextConfig;
