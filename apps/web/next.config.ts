import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = (process.env.API_SERVER_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
    return [{ source: '/api/v1/:path*', destination: `${apiBase}/:path*` }];
  },
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  poweredByHeader: false, reactStrictMode: true,
  headers: async () => [{ source: '/(.*)', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy', value: `default-src 'self'; img-src 'self' data: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:4000 https://*.supabase.co https://api.razorpay.com${process.env.NODE_ENV === 'development' ? ' ws://localhost:* ws://127.0.0.1:*' : ''}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  ] }],
};
export default nextConfig;
