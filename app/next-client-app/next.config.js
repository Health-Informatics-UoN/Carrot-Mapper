/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [process.env.BACKEND_ORIGIN], // Using BACKEND_ORIGIN="127.0.0.1:8000" in .env of NextJS app worked for me locally, to implement PATCH method
    },
  },
};

module.exports = nextConfig;
