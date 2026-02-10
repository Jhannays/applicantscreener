/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Increase API route body size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
  // Webpack config to handle pdf-parse
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
