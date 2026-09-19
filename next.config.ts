import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Redirect /video/slug.html to /video/slug
      {
        source: "/video/:slug.html",
        destination: "/video/:slug",
        permanent: true,
      },
      // Redirect /slug.html to /slug
      {
        source: "/:slug((?!_next|api|assets|v1\\.5\\.11|uncache|font|video).*).html",
        destination: "/:slug",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/index.html" },

      // Video routes
      {
        source: "/video/:slug",
        destination: "/video/:slug.html",
      },
      {
        source: "/video/:slug/",
        destination: "/video/:slug.html",
      },

      // Single-level page routes
      {
        source: "/:slug((?!_next|api|assets|v1\\.5\\.11|uncache|font|video|.*\\..*).*)",
        destination: "/:slug.html",
      },
      {
        source: "/:slug((?!_next|api|assets|v1\\.5\\.11|uncache|font|video|.*\\..*).*)/",
        destination: "/:slug.html",
      },
    ];
  },
};

export default nextConfig;