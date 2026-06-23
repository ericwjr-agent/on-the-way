/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,   // generates book/index.html instead of book.html for GitHub Pages
  // basePath set via env so local dev runs at / and Pages runs at /on-the-way
  basePath:    process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
