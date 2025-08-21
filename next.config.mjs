/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Add images configuration for Cloudinary
  images: {
    domains: ['res.cloudinary.com'],
    // Alternative for newer Next.js versions (12.3+):
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'res.cloudinary.com',
    //     port: '',
    //     pathname: '/**',
    //   },
    // ],
  },


};

export default nextConfig;
