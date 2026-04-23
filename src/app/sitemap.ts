import type { MetadataRoute } from "next"

const SITE_URL = "https://yapr.giann.dev"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/practice`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/exam`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
