/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },

  images: {
   unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

module.exports = nextConfig;


