import type { NextConfig } from "next";

// Pictures from the Studio Desk live in the studio's public Supabase bucket. Allow exactly that address (read from the
// configured project URL), and only its public-bucket path, so nothing else can be loaded through the image optimiser.
const catalogueHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: catalogueHost
      ? [
          {
            protocol: catalogueHost.protocol === "http:" ? "http" : "https",
            hostname: catalogueHost.hostname,
            port: catalogueHost.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
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
