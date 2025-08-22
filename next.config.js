/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['twitter-api-v2']
  },
  env: {
    // Only expose API keys that need to be accessed by server-side API routes
    // NEVER expose private keys or sensitive secrets to the browser
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    ODDS_API_KEY: process.env.ODDS_API_KEY
    // REMOVED: PRIVATE_KEY, DATABASE_URL, CHILIZ_RPC_URL (server-only secrets)
  }
}

module.exports = nextConfig