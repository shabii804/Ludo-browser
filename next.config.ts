import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a fully static bundle for GitHub Pages:
//   STATIC_EXPORT=1 BASE_PATH=/Ludo-browser bun x next build
// Default (unset) keeps the production standalone server build untouched.
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  output: isStatic ? "export" : "standalone",
  ...(isStatic
    ? {
        basePath: process.env.BASE_PATH || "",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
