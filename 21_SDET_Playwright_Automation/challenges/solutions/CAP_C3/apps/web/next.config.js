/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_INGESTER_URL:
      process.env.NEXT_PUBLIC_INGESTER_URL || "http://localhost:3001",
  },
};

module.exports = nextConfig;
