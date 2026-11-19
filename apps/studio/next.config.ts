import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Internal CRM: never indexed, never framed.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // Production: never framed. Development allows same-origin framing for visual QA tooling only.
          { key: "X-Frame-Options", value: process.env.NODE_ENV === "production" ? "DENY" : "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
