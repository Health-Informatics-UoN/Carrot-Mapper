/** @type {import('next').NextConfig} */

// Local BACKEND_ORIGIN="127.0.0.1:8000"
// Allows for multiple allowedOrigins in one environment
const allowedOrigins = process.env.BACKEND_ORIGIN?.split(",");
console.log(allowedOrigins);
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: allowedOrigins,
    },
  },
};

module.exports = nextConfig;
