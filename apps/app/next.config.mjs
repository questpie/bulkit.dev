/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: '*' }],
  },
  logging:{
    fetches:{
      fullUrl:true
    }
  }
}

export default nextConfig
