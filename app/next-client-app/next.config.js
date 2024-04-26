/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [process.env.BACKEND_ORIGIN],
    },
  },
};

module.exports = nextConfig;
