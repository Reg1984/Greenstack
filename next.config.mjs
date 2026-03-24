/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/protected',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
