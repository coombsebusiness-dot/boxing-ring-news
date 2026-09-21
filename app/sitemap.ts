import type { MetadataRoute } from "next";

import { supabase } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://boxingringnews.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    storiesResult,
    desksResult,
  ] = await Promise.all([
    supabase
      .from("stories")
      .select(`
        slug,
        published_at,
        updated_at
      `)
      .in("status", [
        "published",
        "updated",
      ])
      .order(
        "published_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from("desks")
      .select(`
        slug
      `)
      .eq(
        "is_active",
        true,
      )
      .order(
        "sort_order",
      ),
  ]);

  const stories =
    storiesResult.data ?? [];

  const desks =
    desksResult.data ?? [];

  const now =
    new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${siteUrl}/exclusives`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/pr`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/editorial-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/corrections-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const deskPages: MetadataRoute.Sitemap =
    desks.map(
      (desk) => ({
        url:
          `${siteUrl}/${desk.slug}`,
        lastModified:
          now,
        changeFrequency:
          "hourly" as const,
        priority:
          0.9,
      }),
    );

  const storyPages: MetadataRoute.Sitemap =
    stories.map(
      (story) => ({
        url:
          `${siteUrl}/${story.slug}`,

        lastModified:
          story.updated_at ||
          story.published_at ||
          now,

        changeFrequency:
          "weekly" as const,

        priority:
          0.8,
      }),
    );

  return [
    ...staticPages,
    ...deskPages,
    ...storyPages,
  ];
}