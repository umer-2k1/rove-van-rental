import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Cache Components is off on purpose: every van page reads live
   * reservations, and a cached booking page would show stale availability.
   */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
