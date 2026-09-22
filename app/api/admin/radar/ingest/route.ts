import { NextResponse } from "next/server";
import Parser from "rss-parser";

import * as cheerio from "cheerio";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findBestClusterMatch } from "@/lib/radar/clusterMatcher";

import { classifyDesk } from "@/lib/radar/deskClassifier";

import { discoverSourceArticles } from "@/lib/radar/discoverSourceArticles";
import { sendRadarNotification } from "@/lib/notifications/sendRadarNotification";

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

function calculatePriority(
  publishedAt: string | null,
  authorityTier: number,
  isPrimarySource: boolean,
) {
  const freshness =
    calculateFreshnessScore(
      publishedAt,
    );

  /*
   * Official primary source:
   * 0-3 hours = urgent
   */
  if (
    isPrimarySource &&
    freshness >= 95
  ) {
    return "urgent";
  }

  /*
   * Official primary source:
   * up to 24 hours = high
   *
   * Tier 1 publication:
   * up to 6 hours = high
   */
  if (
    (isPrimarySource &&
      freshness >= 75) ||
    (authorityTier === 1 &&
      freshness >= 90)
  ) {
    return "high";
  }

  return "normal";
}

async function getExactPublishedAt(
  url: string,
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      10000,
    );

  try {
    const response =
      await fetch(
        url,
        {
          signal:
            controller.signal,

          redirect:
            "follow",

          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; BoxingRingNewsRadar/1.0)",

            Accept:
              "text/html,application/xhtml+xml",
          },

          cache:
            "no-store",
        },
      );

    if (!response.ok) {
      return null;
    }

    const html =
      await response.text();

    const $ =
      cheerio.load(html);

    /*
     * Prefer the precise Open Graph
     * publication timestamp.
     */
    const metaPublishedAt =
      $(
        'meta[property="article:published_time"]',
      )
        .first()
        .attr("content") ??
      $(
        'meta[name="article:published_time"]',
      )
        .first()
        .attr("content");

    if (
      metaPublishedAt &&
      !Number.isNaN(
        Date.parse(
          metaPublishedAt,
        ),
      )
    ) {
      return new Date(
        metaPublishedAt,
      ).toISOString();
    }

    /*
     * Fall back to JSON-LD.
     */
    for (
      const element of
      $('script[type="application/ld+json"]')
        .toArray()
    ) {
      const jsonText =
        $(element).html();

      if (!jsonText) {
        continue;
      }

      const match =
        jsonText.match(
          /"datePublished"\s*:\s*"([^"]+)"/i,
        );

      const candidate =
        match?.[1];

      if (
        candidate &&
        !Number.isNaN(
          Date.parse(candidate),
        )
      ) {
        return new Date(
          candidate,
        ).toISOString();
      }
    }

    /*
     * Last resort: a valid ISO-style
     * <time datetime="..."> value.
     */
    const timeDatetime =
      $("time[datetime]")
        .first()
        .attr("datetime");

    if (
      timeDatetime &&
      /^\d{4}-\d{2}-\d{2}(?:[T\s]|$)/.test(
        timeDatetime,
      ) &&
      !Number.isNaN(
        Date.parse(
          timeDatetime,
        ),
      )
    ) {
      return new Date(
        timeDatetime,
      ).toISOString();
    }

    return null;
  } catch {
    /*
     * Enrichment failure must not stop
     * the whole Radar run.
     */
    return null;
  } finally {
    clearTimeout(
      timeout,
    );
  }
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

export async function POST(
  request: Request,
) {
  /*
   * Radar can be started by either:
   *
   * 1. a logged-in newsroom user, or
   * 2. our scheduled job using CRON_SECRET.
   */
  const cronSecret =
    process.env.CRON_SECRET;

  const authorization =
    request.headers.get(
      "authorization",
    );

  const isCronRequest =
    Boolean(cronSecret) &&
    authorization ===
      `Bearer ${cronSecret}`;

  /*
   * Scheduled Radar runs do not have a
   * Supabase user session, so use the
   * server-only service-role client.
   *
   * Manual newsroom runs continue using
   * the normal authenticated client.
   */
  const supabase =
    isCronRequest
      ? createAdminClient()
      : await createClient();

  if (!isCronRequest) {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

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
      monitor_url,
      ingestion_method,
      source_type,
      authority_tier,
      reliability_score,
      is_primary_source
    `)
    .eq(
      "is_active",
      true,
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

      let feedItems: {
        link?: string;
        title?: string;
        isoDate?: string;
        pubDate?: string;
        contentSnippet?: string;
        content?: string;
        summary?: string;
        creator?: string;
        author?: string;
        guid?: string;
        id?: string;
      }[] = [];

      if (
        source.ingestion_method ===
        "webpage"
      ) {
        if (!source.monitor_url) {
          throw new Error(
            "Webpage source has no monitor URL.",
          );
        }

        const articles =
          await discoverSourceArticles(
            source.monitor_url,
          );

        /*
         * Webpage discovery tells us that
         * the article is visible now, but
         * does not yet know its publication
         * timestamp. Leave publishedAt null
         * rather than inventing a date.
         */
        feedItems =
          articles.map(
            (article) => ({
              link:
                article.url,
              title:
                article.title,
              guid:
                article.url,
              isoDate:
                article.publishedAt ??
                undefined,
            }),
          );
      } else {
        if (!source.rss_url) {
          throw new Error(
            "RSS source has no RSS URL.",
          );
        }

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

        feedItems =
          feed.items.slice(
            0,
            30,
          );
      }

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

        let publishedAt =
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

        /*
         * Only brand-new primary-source
         * webpage stories get an additional
         * article request.
         *
         * Known URLs have already continued
         * above, so repeat Radar runs do not
         * refetch every article.
         */
        if (
          source.is_primary_source &&
          source.ingestion_method ===
            "webpage"
        ) {
          const exactPublishedAt =
            await getExactPublishedAt(
              url,
            );

          if (exactPublishedAt) {
            publishedAt =
              exactPublishedAt;
          }
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

        const priority =
          calculatePriority(
            publishedAt,
            source.authority_tier,
            source.is_primary_source,
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

            priority,

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

        /*
         * Alert the newsroom only for
         * genuinely new high/urgent items.
         *
         * sendRadarNotification handles its
         * own failures, so ntfy can never
         * break Radar ingestion.
         */
        if (
          priority === "high" ||
          priority === "urgent"
        ) {
          await sendRadarNotification({
            headline,
            sourceName:
              source.name,
            sourceUrl:
              url,
            priority,
          });
        }
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


/*
 * Vercel Cron invokes this route with GET.
 *
 * Only requests carrying our CRON_SECRET
 * are allowed through this entry point.
 * Manual newsroom runs continue using POST.
 */
export async function GET(
  request: Request,
) {
  const cronSecret =
    process.env.CRON_SECRET;

  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !cronSecret ||
    authorization !==
      `Bearer ${cronSecret}`
  ) {
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

  return POST(request);
}
