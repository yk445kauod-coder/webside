import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "work-1-axypibjtdhzenufc.prod-runtime.all-hands.dev",
    "work-2-axypibjtdhzenufc.prod-runtime.all-hands.dev",
  ],
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
