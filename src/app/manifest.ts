import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fourchette — Pizza campus",
    short_name: "Fourchette",
    description: "Commande ta pizza et récupère-la au camion.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f2e9",
    theme_color: "#e54b2a",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
