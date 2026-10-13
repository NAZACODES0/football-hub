import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/favorites"] }],
    sitemap: `${SITE_URL.replace(/\/$/, "")}/sitemap.xml`,
  };
}
