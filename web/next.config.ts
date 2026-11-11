import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pin the project root (a stray lockfile higher up the disk otherwise confuses Next)
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // Cloudinary does the resizing/compression (f_auto, q_auto) instead of the Next server.
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.ts',
    // Tuned for phones: fewer, smaller candidate widths = less data on slow networks.
    deviceSizes: [360, 480, 640, 828, 1080, 1280],
    imageSizes: [64, 96, 160, 256, 320],
  },
};

export default nextConfig;
