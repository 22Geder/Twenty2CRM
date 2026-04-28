import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['pdf-parse', 'googleapis', 'google-auth-library'],
  
  // 🔒 Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ]
  },

  // 🔒 הסתר מידע על מנוע השרת
  poweredByHeader: false,

  // 🚫 חסימת נתיבי אדמין נפוצים - מחזיר 404 (החליף את proxy.ts)
  async redirects() {
    return [
      { source: '/admin', destination: '/404', permanent: false },
      { source: '/admin/:path*', destination: '/404', permanent: false },
      { source: '/administrator', destination: '/404', permanent: false },
      { source: '/administrator/:path*', destination: '/404', permanent: false },
      { source: '/wp-admin', destination: '/404', permanent: false },
      { source: '/wp-admin/:path*', destination: '/404', permanent: false },
      { source: '/wp-login.php', destination: '/404', permanent: false },
      { source: '/phpmyadmin', destination: '/404', permanent: false },
      { source: '/phpmyadmin/:path*', destination: '/404', permanent: false },
    ]
  },
}

export default nextConfig;
