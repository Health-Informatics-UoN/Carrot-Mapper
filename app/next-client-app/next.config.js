/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [process.env.BACKEND_URL, "127.0.0.1:8000"],
    },
  },
};

module.exports = nextConfig;
