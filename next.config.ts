import type { NextConfig } from 'next'
import process from 'node:process'

const nextConfig: NextConfig = {
  /* config options here */
  rewrites: () => {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development'
          ? 'http://127.0.0.1:8000/api/:path*'
          : '/api/',
      },
    ]
  },
}

export default nextConfig
