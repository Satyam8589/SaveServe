// next.config.js
import withTM from "next-transpile-modules";

// Tell Next.js to transpile CJS packages like leaflet-routing-machine
const withTranspile = withTM([
  "leaflet-routing-machine",
]);

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

  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default withTranspile(nextConfig);