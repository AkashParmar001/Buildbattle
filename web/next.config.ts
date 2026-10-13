import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Old single-purpose routes collapse into the Command Center.
  redirects: async () =>
    ["/feedback", "/insights", "/recommendations", "/pipeline", "/issues"].map(
      (source) => ({ source, destination: "/app", permanent: false }),
    ),
};

export default nextConfig;
