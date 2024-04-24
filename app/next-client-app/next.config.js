/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["127.0.0.1:7000"],
    },
  },
};

module.exports = nextConfig;
