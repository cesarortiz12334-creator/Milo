import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://milofund.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas = [
    "",
    "/como-funciona",
    "/faq",
    "/sobre-nosotros",
    "/transparencia",
    "/veterinarias",
    "/exitos",
    "/contacto",
    "/terminos",
    "/privacidad",
    "/cookies",
    "/login",
    "/registro",
  ];
  const ahora = new Date();
  return rutas.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified: ahora,
    changeFrequency: "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
