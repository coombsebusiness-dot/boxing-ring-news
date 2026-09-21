import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://boxingringnews.com";

function escapeXml(
  value: string,
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const {
    data: stories,
    error,
  } = await supabase
    .from("stories")
    .select(`
      title,
      slug,
      excerpt,
      published_at,
      updated_at
    `)
    .in("status", [
      "published",
      "updated",
    ])
    .not(
      "published_at",
      "is",
      null,
    )
    .order(
      "published_at",
      {
        ascending: false,
      },
    )
    .limit(50);

  if (error) {
    return new NextResponse(
      "Unable to generate RSS feed.",
      {
        status: 500,
      },
    );
  }

  const validStories =
    (stories ?? []).filter(
      (story) =>
        story.title &&
        story.slug &&
        story.published_at,
    );

  const items =
    validStories
      .map((story) => {
        const url =
          `${siteUrl}/${story.slug}`;

        const description =
          story.excerpt ?? "";

        return `
    <item>
      <title>${escapeXml(
        story.title,
      )}</title>
      <link>${escapeXml(
        url,
      )}</link>
      <guid isPermaLink="true">${escapeXml(
        url,
      )}</guid>
      <pubDate>${new Date(
        story.published_at,
      ).toUTCString()}</pubDate>
      <description>${escapeXml(
        description,
      )}</description>
    </item>`;
      })
      .join("");

  const latestDate =
    validStories[0]?.updated_at ??
    validStories[0]?.published_at ??
    new Date().toISOString();

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `
<rss version="2.0">
  <channel>
    <title>Boxing Ring News</title>
    <link>${siteUrl}</link>
    <description>Latest boxing news, fights, results, exclusives and breaking stories from Boxing Ring News.</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date(
      latestDate,
    ).toUTCString()}</lastBuildDate>
    <generator>Boxing Ring News</generator>${items}
  </channel>
</rss>
`;

  return new NextResponse(
    xml,
    {
      headers: {
        "Content-Type":
          "application/rss+xml; charset=utf-8",
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}
