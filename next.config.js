/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['twitter-api-v2']
  },
  env: {
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    CHILIZ_RPC_URL: process.env.CHILIZ_RPC_URL,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    ODDS_API_KEY: process.env.ODDS_API_KEY
  }
}

module.exports = nextConfig