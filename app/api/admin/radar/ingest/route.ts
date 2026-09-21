import { NextResponse } from "next/server";
import Parser from "rss-parser";

import { createClient } from "@/lib/supabase/server";
import { findBestClusterMatch } from "@/lib/radar/clusterMatcher";

import { classifyDesk } from "@/lib/radar/deskClassifier";

const parser = new Parser({
  timeout: 15000,
});

function calculateFreshnessScore(
  publishedAt: string | null,
) {
  if (!publishedAt) {
    return 50;
  }

  const ageMs =
    Date.now() -
    new Date(
      publishedAt,
    ).getTime();

  const ageHours =
    ageMs /
    (1000 * 60 * 60);

  if (ageHours <= 1) {
    return 100;
  }

  if (ageHours <= 3) {
    return 95;
  }

  if (ageHours <= 6) {
    return 90;
  }

  if (ageHours <= 12) {
    return 85;
  }

  if (ageHours <= 24) {
    return 75;
  }

  if (ageHours <= 48) {
    return 60;
  }

  if (ageHours <= 72) {
    return 45;
  }

  return 25;
}

function authorityScore(
  authorityTier: number,
  reliabilityScore: number,
) {
  const tierScore =
    Math.max(
      0,
      100 -
        (authorityTier - 1) *
          12,
    );

  return Math.round(
    tierScore * 0.45 +
      reliabilityScore *
        0.55,
  );
}

function cleanText(
  value:
    | string
    | undefined
    | null,
) {
  if (!value) {
    return null;
  }

  return value
    .replace(
      /<[^>]+>/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

export async function POST() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Unauthorised",
      },
      {
        status: 401,
      },
    );
  }

  const {
    data: newsroomUser,
  } = await supabase
    .from(
      "newsroom_users",
    )
    .select(
      "role",
    )
    .eq(
      "user_id",
      user.id,
    )
    .eq(
      "is_active",
      true,
    )
    .maybeSingle();

  if (!newsroomUser) {
    return NextResponse.json(
      {
        error:
          "Forbidden",
      },
      {
        status: 403,
      },
    );
  }

  const {
    data: sources,
    error: sourceError,
  } = await supabase
    .from("sources")
    .select(`
      id,
      name,
      rss_url,
      authority_tier,
      reliability_score
    `)
    .eq(
      "is_active",
      true,
    )
    .not(
      "rss_url",
      "is",
      null,
    );
  const {
    data: desks,
    error: deskError,
  } = await supabase
    .from("desks")
    .select(`
      id,
      name,
      slug
    `)
    .eq(
      "is_active",
      true,
    );

  if (deskError) {
    return NextResponse.json(
      {
        error:
          deskError.message,
      },
      {
        status: 500,
      },
    );
  }



  const {
    data: openClusters,
    error: clusterError,
  } = await supabase
    .from(
      "story_clusters",
    )
    .select(`
      id,
      title,
      canonical_topic,
      desk_id,
      status,
      first_seen_at,
      last_seen_at
    `)
    .in(
      "status",
      [
        "open",
        "developing",
      ],
    )
    .order(
      "last_seen_at",
      {
        ascending: false,
      },
    )
    .limit(250);

  if (clusterError) {
    return NextResponse.json(
      {
        error:
          clusterError.message,
      },
      {
        status: 500,
      },
    );
  }

  if (sourceError) {
    return NextResponse.json(
      {
        error:
          sourceError.message,
      },
      {
        status: 500,
      },
    );
  }

  let discovered = 0;
  let inserted = 0;
  let duplicates = 0;
  let failedSources = 0;

  const results: {
    source: string;
    status: string;
    items?: number;
    inserted?: number;
    error?: string;
  }[] = [];

  for (
    const source of
    sources ?? []
  ) {
    try {
      if (!source.rss_url) {
        continue;
      }

      await supabase
        .from("sources")
        .update({
          last_checked_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          source.id,
        );

      const response =
        await fetch(
          source.rss_url,
          {
            headers: {
              "User-Agent":
                "BoxingRingNewsRadar/1.0",
              Accept:
                "application/rss+xml, application/xml, text/xml, */*",
            },
            cache:
              "no-store",
          },
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const xml =
        await response.text();

      const feed =
        await parser.parseString(
          xml,
        );

      const feedItems =
        feed.items.slice(
          0,
          30,
        );

      let sourceInserted = 0;

      for (
        const item of
        feedItems
      ) {
        const url =
          item.link?.trim();

        const headline =
          cleanText(
            item.title,
          );

        if (
          !url ||
          !headline
        ) {
          continue;
        }

        discovered += 1;

        const publishedAt =
          item.isoDate ||
          item.pubDate ||
          null;

        const summary =
          cleanText(
            item.contentSnippet ||
              item.content ||
              item.summary,
          );

        const author =
          cleanText(
            item.creator ||
              item.author,
          );

        const {
          data: existing,
          error:
            existingError,
        } = await supabase
          .from(
            "radar_items",
          )
          .select("id")
          .eq(
            "source_url",
            url,
          )
          .maybeSingle();

        if (existingError) {
          throw existingError;
        }

        if (existing) {
          duplicates += 1;
          continue;
        }
        const deskClassification =
          classifyDesk(
            headline,
            summary,
            desks ?? [],
          );

        const assignedDeskId =
          deskClassification.deskId &&
          deskClassification.score >= 20
            ? deskClassification.deskId
            : null;



        const clusterMatch =
          findBestClusterMatch(
            {
              headline,
              summary,
              desk_id:
                assignedDeskId,
              published_at:
                publishedAt,
            },
            openClusters ?? [],
          );

        const {
          error:
            insertError,
        } = await supabase
          .from(
            "radar_items",
          )
          .insert({
            source_id:
              source.id,

            external_id:
              item.guid ||
              item.id ||
              url,

            source_url:
              url,

            headline,

            summary,

            author_name:
              author,

            published_at:
              publishedAt,

            discovered_at:
              new Date().toISOString(),

            status:
              "new",

            priority:
              "normal",

            desk_id:
              assignedDeskId,

            desk_classification_score:
              deskClassification.score,

            desk_classification_reason:
              deskClassification.reason,

            desk_classification_source:
              "rules",

            relevance_score:
              80,

            freshness_score:
              calculateFreshnessScore(
                publishedAt,
              ),

            authority_score:
              authorityScore(
                source.authority_tier,
                source.reliability_score,
              ),

            duplicate_score:
              clusterMatch?.score ??
              0,

            suggested_cluster_id:
              clusterMatch?.clusterId ??
              null,

            cluster_match_score:
              clusterMatch?.score ??
              null,

            cluster_match_reason:
              clusterMatch?.reason ??
              null,
          });

        if (insertError) {
          if (
            insertError.code ===
            "23505"
          ) {
            duplicates += 1;
            continue;
          }

          throw insertError;
        }

        inserted += 1;
        sourceInserted += 1;
      }

      await supabase
        .from("sources")
        .update({
          last_success_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          source.id,
        );

      results.push({
        source:
          source.name,
        status:
          "success",
        items:
          feedItems.length,
        inserted:
          sourceInserted,
      });
    } catch (error) {
      failedSources += 1;

      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      console.error(
        `Radar ingest failed for ${source.name}:`,
        error,
      );

      results.push({
        source:
          source.name,
        status:
          "failed",
        error:
          message,
      });
    }
  }

  return NextResponse.json({
    success: true,
    discovered,
    inserted,
    duplicates,
    failedSources,
    results,
  });
}
