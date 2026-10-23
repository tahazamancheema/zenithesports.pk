import type { NextConfig } from 'next'

/**
 * ZenithHisaab (public/hisaab/admin) is a separate, already-deployed private
 * app. These headers reproduce its existing Vercel deployment exactly
 * (origin/main vercel.json) so moving the website to Next.js changes nothing
 * for it: same CSP, noindex, no-store.
 */
const HISAAB_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://tzxvmmmxxcaiocmeejng.supabase.co https://i.ytimg.com https://images.unsplash.com; connect-src 'self' https://tzxvmmmxxcaiocmeejng.supabase.co wss://tzxvmmmxxcaiocmeejng.supabase.co https://www.googleapis.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:; upgrade-insecure-requests"

const common = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // Never ship source maps that would expose implementation details.
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: {
      // Two evidence screenshots (4 MB each) plus multipart overhead.
      bodySizeLimit: '9mb',
    },
  },
  serverExternalPackages: ['sharp', 'postgres'],
  async redirects() {
    // The old Games index was retired; each game lives under Registrations.
    return [{ source: '/games', destination: '/registrations', permanent: true }]
  },
  async headers() {
    return [
      { source: '/:path*', headers: common },
      {
        source: '/hisaab/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: HISAAB_CSP },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Consoles are never indexed or cached.
        source: '/:surface(admin|registrations/admin|anticheat/admin)/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/hisaab/admin', destination: '/hisaab/admin/index.html' },
        { source: '/hisaab/admin/', destination: '/hisaab/admin/index.html' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig
