/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Electron packaging
  output: "standalone",

  // Disable image optimization in Electron (no server to optimize)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
