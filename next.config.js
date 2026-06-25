/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' is only needed for Docker self-hosted builds.
  // On Vercel, leave output undefined so Vercel uses its own optimised bundler.
  ...(process.env.BUILD_STANDALONE === '1' && { output: 'standalone' }),
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
