/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'https://ahn009-oxinto-ai.hf.space';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backend}/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
