/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [process.env.BACKEND_URL],
    },
  },
};

module.exports = nextConfig;
