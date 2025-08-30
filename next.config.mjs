/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,

  // Add images configuration for Cloudinary
  images: {
    domains: ["res.cloudinary.com"],
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

// Configure PWA
const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);

export default pwaConfig;
