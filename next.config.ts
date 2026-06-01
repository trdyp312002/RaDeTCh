import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "garmin-connect", "curl_cffi"],
};

export default nextConfig;
