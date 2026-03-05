/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's7d2.scene7.com',
      },
    ],
  },
};

module.exports = nextConfig;
