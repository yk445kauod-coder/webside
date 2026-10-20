import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WebSide — Your web. Your side.",
    short_name: "WebSide",
    description: "Build your website step by step, right from your phone.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f5ff",
    theme_color: "#6d4cff",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New site", short_name: "New", url: "/dashboard/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My sites", short_name: "Sites", url: "/dashboard" },
    ],
  };
}
