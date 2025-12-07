import type { NextConfig } from 'next'
import process from 'node:process'

const nextConfig: NextConfig = {
  /* config options here */
  rewrites: () => {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL}/:path*`,
      },
    ]
  },
}

export default nextConfig
