import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lunch Checker",
    short_name: "Lunch",
    description: "Compare Orange County school lunch menus",
    start_url: "/",
    display: "standalone",
    background_color: "#eaf8ff",
    theme_color: "#1e3a8a",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}