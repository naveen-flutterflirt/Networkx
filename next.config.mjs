/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return { fallback: [
      { source: '/jobs/:path*', destination: '/jobs' },
      { source: '/blogs/:path*', destination: '/blogs' },
      { source: '/blog/:path*', destination: '/blog' },
      { source: '/course/:path*', destination: '/course' },
      { source: '/q/:path*', destination: '/q' },
      { source: '/cert/:path*', destination: '/cert' },
      { source: '/certq/:path*', destination: '/certq' },
      { source: '/ebooks/:path*', destination: '/ebooks' },
      { source: '/module/:path*', destination: '/module' },
      { source: '/learn/:path*', destination: '/learn' },
      { source: '/quiz/:path*', destination: '/quiz' },
      { source: '/admin/:path*', destination: '/admin' },
      { source: '/career-path/:path*', destination: '/career-path' }
    ]};
  },
};
export default nextConfig;
