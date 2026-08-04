import type { MetadataRoute } from "next";

/**
 * The web app manifest — what makes "Add to Home Screen" produce something
 * that looks like an app rather than a bookmark.
 *
 * `app/manifest.ts` is the Next.js 16 file convention for this; it is served at
 * /manifest.webmanifest and linked from <head> automatically.
 *
 * The two icons are genuinely different pictures, not two sizes of one. See
 * `scripts/build-icons.ts`: `any` is drawn to its own rounded edges, while
 * `maskable` is full-bleed with the moon pulled into the middle so an Android
 * launcher can crop it to a circle without beheading it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bedtime Tale Generator",
    short_name: "Bedtime Tales",
    description:
      "Pick a tale type, add a hero, and drift off to a custom bedtime story that always ends in sleep.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1026",
    theme_color: "#0b1026",
    categories: ["books", "education", "entertainment"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
