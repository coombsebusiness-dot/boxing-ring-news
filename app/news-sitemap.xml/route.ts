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
  const cutoff =
    new Date(
      Date.now() -
        2 * 24 * 60 * 60 * 1000,
    ).toISOString();

  const {
    data: stories,
    error,
  } = await supabase
    .from("stories")
    .select(`
      title,
      slug,
      published_at
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
    .gte(
      "published_at",
      cutoff,
    )
    .order(
      "published_at",
      {
        ascending: false,
      },
    );

  if (error) {
    return new NextResponse(
      "Unable to generate news sitemap.",
      {
        status: 500,
      },
    );
  }

  const urls =
    (stories ?? [])
      .map((story) => {
        if (
          !story.slug ||
          !story.title ||
          !story.published_at
        ) {
          return "";
        }

        return `
  <url>
    <loc>${escapeXml(
      `${siteUrl}/${story.slug}`,
    )}</loc>
    <news:news>
      <news:publication>
        <news:name>Boxing Ring News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(
        new Date(
          story.published_at,
        ).toISOString(),
      )}</news:publication_date>
      <news:title>${escapeXml(
        story.title,
      )}</news:title>
    </news:news>
  </url>`;
      })
      .filter(Boolean)
      .join("");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}
</urlset>
`;

  return new NextResponse(
    xml,
    {
      headers: {
        "Content-Type":
          "application/xml; charset=utf-8",
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}
