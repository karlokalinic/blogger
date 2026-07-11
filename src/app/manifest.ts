import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "VEO ZAVOD Development Archive", short_name: "VEO ZAVOD", description: "A living game-development archive and creator studio.", start_url: "/", display: "standalone", background_color: "#0b0d0c", theme_color: "#0b0d0c", orientation: "any" };
}
