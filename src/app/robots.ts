import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://milofund.cl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/veterinaria",
        "/campanas/nueva",
        "/mis-campanas",
        "/api/",
        "/dev/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
