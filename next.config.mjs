// GitHub Pages serves the site from https://<user>.github.io/<repo>/, so the
// deploy workflow sets STATIC_EXPORT and NEXT_PUBLIC_BASE_PATH=/<repo>.
// Locally neither is set, and `npm run dev` / `npm start` work as usual.
const isStaticExport = process.env.STATIC_EXPORT === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  basePath,
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
