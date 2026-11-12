import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nestlog Baby Tracker",
    short_name: "Nestlog",
    description: "Shared baby log for feeds, diapers, sleep, and charts.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ef",
    theme_color: "#e8f2ef",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
