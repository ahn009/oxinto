/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
