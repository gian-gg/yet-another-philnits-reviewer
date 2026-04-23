import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/practice/session", "/exam/session"],
      },
    ],
    sitemap: "https://yapr.giann.dev/sitemap.xml",
  }
}
