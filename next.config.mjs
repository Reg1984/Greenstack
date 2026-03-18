/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force cache clear
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  turbopack: {
    root: '.',
  },
}

export default nextConfig
