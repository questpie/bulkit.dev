/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: '*' }],
  },
  experimental:{
    reactCompiler:true
  },
  logging:{
    fetches:{
      fullUrl:true
    }
  }
}

export default nextConfig
