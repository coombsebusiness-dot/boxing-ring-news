"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  extractArticleText,
} from "@/lib/research/extractArticleText";

import {
  extractClaims,
} from "@/lib/research/extractClaims";

import {
  researchStoryWithWebSearch,
} from "@/lib/research/researchStoryWithWebSearch";

import {
  writeBoxingRingNewsArticle,
} from "@/lib/newsroom/BoxingRingNewsArticleWriter";

async function getNewsroomClient() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/admin/login",
    );
  }

  const {
    data: profile,
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

  if (!profile) {
    throw new Error(
      "Newsroom access required.",
    );
  }

  return supabase;
}

export async function shortlistRadarItem(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  const {
    error,
  } = await supabase
    .from(
      "radar_items",
    )
    .update({
      status:
        "shortlisted",
    })
    .eq(
      "id",
      id,
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    "/admin/radar",
  );

  revalidatePath(
    "/admin",
  );
}

export async function ignoreRadarItem(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  const {
    error,
  } = await supabase
    .from(
      "radar_items",
    )
    .update({
      status:
        "ignored",
    })
    .eq(
      "id",
      id,
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    "/admin/radar",
  );

  revalidatePath(
    "/admin",
  );
}

export async function createClusterFromRadarItem(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  const {
    data: item,
    error: itemError,
  } = await supabase
    .from(
      "radar_items",
    )
    .select(`
      id,
      headline,
      summary,
      desk_id,
      source_id,
      source_url,
      published_at,
      discovered_at,
      priority,
      cluster_id
    `)
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (
    itemError ||
    !item
  ) {
    throw new Error(
      itemError?.message ||
        "Radar item not found.",
    );
  }

  if (item.cluster_id) {
    redirect(
      `/admin/clusters/${item.cluster_id}`,
    );
  }

  const firstSeenAt =
    item.published_at ||
    item.discovered_at ||
    new Date().toISOString();

  const {
    data: cluster,
    error: clusterError,
  } = await supabase
    .from(
      "story_clusters",
    )
    .insert({
      title:
        item.headline,

      canonical_topic:
        item.headline,

      desk_id:
        item.desk_id,

      status:
        "open",

      priority:
        item.priority ||
        "normal",

      confidence_score:
        50,

      source_count:
        0,

      first_seen_at:
        firstSeenAt,

      last_seen_at:
        firstSeenAt,
    })
    .select("id")
    .single();

  if (
    clusterError ||
    !cluster
  ) {
    throw new Error(
      clusterError?.message ||
        "Could not create cluster.",
    );
  }

  const {
    error: radarUpdateError,
  } = await supabase
    .from(
      "radar_items",
    )
    .update({
      cluster_id:
        cluster.id,

      status:
        "clustered",
    })
    .eq(
      "id",
      item.id,
    );

  if (radarUpdateError) {
    await supabase
      .from(
        "story_clusters",
      )
      .delete()
      .eq(
        "id",
        cluster.id,
      );

    throw new Error(
      radarUpdateError.message,
    );
  }

  const {
    error: evidenceError,
  } = await supabase
    .from(
      "evidence",
    )
    .insert({
      cluster_id:
        cluster.id,

      radar_item_id:
        item.id,

      source_id:
        item.source_id,

      claim:
        item.headline,

      evidence_type:
        "context",

      verification_status:
        "unverified",

      confidence_score:
        50,

      is_primary_evidence:
        false,

      source_excerpt:
        item.summary,

      source_url:
        item.source_url,

      notes:
        "Created automatically from Radar clustering.",
    });

  if (evidenceError) {
    console.error(
      "Evidence creation failed:",
      evidenceError,
    );
  }

  const {
    error: countError,
  } = await supabase.rpc(
    "refresh_story_cluster_source_count",
    {
      target_cluster_id:
        cluster.id,
    },
  );

  if (countError) {
    console.error(
      "Cluster source count refresh failed:",
      countError,
    );
  }

  revalidatePath(
    "/admin/radar",
  );

  revalidatePath(
    "/admin",
  );

  redirect(
    `/admin/clusters/${cluster.id}`,
  );
}

export async function scanExistingRadarForMatches() {
  const supabase =
    await getNewsroomClient();

  const {
    data: clusters,
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
    throw new Error(
      clusterError.message,
    );
  }

  const {
    data: items,
    error: itemError,
  } = await supabase
    .from(
      "radar_items",
    )
    .select(`
      id,
      headline,
      summary,
      desk_id,
      published_at,
      cluster_id,
      suggested_cluster_id,
      rejected_cluster_ids
    `)
    .is(
      "cluster_id",
      null,
    )
    .order(
      "published_at",
      {
        ascending: false,
        nullsFirst: false,
      },
    )
    .limit(100);

  if (itemError) {
    throw new Error(
      itemError.message,
    );
  }

  const {
    findBestClusterMatch,
  } = await import(
    "@/lib/radar/clusterMatcher"
  );

  let scanned = 0;
  let matched = 0;

  for (const item of items ?? []) {
    scanned += 1;

    const match =
      findBestClusterMatch(
        {
          headline:
            item.headline,
          summary:
            item.summary,
          desk_id:
            item.desk_id,
          published_at:
            item.published_at,
        },
        (clusters ?? []).filter(
          (cluster) =>
            !(
              item.rejected_cluster_ids ??
              []
            ).includes(
              cluster.id,
            ),
        ),
      );

    if (!match) {
      if (
        item.suggested_cluster_id
      ) {
        await supabase
          .from(
            "radar_items",
          )
          .update({
            suggested_cluster_id:
              null,
            cluster_match_score:
              null,
            cluster_match_reason:
              null,
            duplicate_score:
              0,
          })
          .eq(
            "id",
            item.id,
          );
      }

      continue;
    }

    const {
      error: updateError,
    } = await supabase
      .from(
        "radar_items",
      )
      .update({
        suggested_cluster_id:
          match.clusterId,
        cluster_match_score:
          match.score,
        cluster_match_reason:
          match.reason,
        duplicate_score:
          match.score,
      })
      .eq(
        "id",
        item.id,
      );

    if (updateError) {
      console.error(
        "Radar match update failed:",
        item.id,
        updateError,
      );

      continue;
    }

    matched += 1;
  }

  revalidatePath(
    "/admin/radar",
  );

  return {
    scanned,
    matched,
  };
}

export async function joinSuggestedCluster(
  formData: FormData,
) {
  const id = String(
    formData.get("id") ?? "",
  ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  const {
    data: item,
    error: itemError,
  } = await supabase
    .from("radar_items")
    .select(`
      id,
      headline,
      summary,
      source_id,
      source_url,
      published_at,
      discovered_at,
      cluster_id,
      suggested_cluster_id,
      cluster_match_score
    `)
    .eq("id", id)
    .maybeSingle();

  if (
    itemError ||
    !item
  ) {
    throw new Error(
      itemError?.message ||
        "Radar item not found.",
    );
  }

  if (item.cluster_id) {
    redirect(
      `/admin/clusters/${item.cluster_id}`,
    );
  }

  if (
    !item.suggested_cluster_id
  ) {
    throw new Error(
      "This Radar item has no suggested cluster.",
    );
  }

  const {
    data: cluster,
    error: clusterError,
  } = await supabase
    .from("story_clusters")
    .select(`
      id,
      status,
      last_seen_at
    `)
    .eq(
      "id",
      item.suggested_cluster_id,
    )
    .maybeSingle();

  if (
    clusterError ||
    !cluster
  ) {
    throw new Error(
      clusterError?.message ||
        "Suggested cluster no longer exists.",
    );
  }

  if (
    cluster.status !== "open" &&
    cluster.status !== "developing"
  ) {
    throw new Error(
      "Suggested cluster is no longer open.",
    );
  }

  const {
    error: radarUpdateError,
  } = await supabase
    .from("radar_items")
    .update({
      cluster_id:
        cluster.id,
      status:
        "clustered",
      suggested_cluster_id:
        null,
      cluster_match_score:
        null,
      cluster_match_reason:
        null,
    })
    .eq(
      "id",
      item.id,
    );

  if (radarUpdateError) {
    throw new Error(
      radarUpdateError.message,
    );
  }

  const {
    data: existingEvidence,
    error:
      existingEvidenceError,
  } = await supabase
    .from("evidence")
    .select("id")
    .eq(
      "radar_item_id",
      item.id,
    )
    .maybeSingle();

  if (
    existingEvidenceError
  ) {
    console.error(
      "Evidence lookup failed:",
      existingEvidenceError,
    );
  }

  if (!existingEvidence) {
    const {
      error: evidenceError,
    } = await supabase
      .from("evidence")
      .insert({
        cluster_id:
          cluster.id,
        radar_item_id:
          item.id,
        source_id:
          item.source_id,
        claim:
          item.headline,
        evidence_type:
          "context",
        verification_status:
          "unverified",
        confidence_score:
          item.cluster_match_score ??
          50,
        is_primary_evidence:
          false,
        source_excerpt:
          item.summary,
        source_url:
          item.source_url,
        notes:
          "Radar cluster match confirmed by newsroom editor.",
      });

    if (evidenceError) {
      console.error(
        "Evidence creation failed:",
        evidenceError,
      );
    }
  }

  const itemSeenAt =
    item.published_at ||
    item.discovered_at;

  if (
    itemSeenAt &&
    new Date(
      itemSeenAt,
    ).getTime() >
      new Date(
        cluster.last_seen_at,
      ).getTime()
  ) {
    const {
      error: seenError,
    } = await supabase
      .from(
        "story_clusters",
      )
      .update({
        last_seen_at:
          itemSeenAt,
      })
      .eq(
        "id",
        cluster.id,
      );

    if (seenError) {
      console.error(
        "Cluster last seen update failed:",
        seenError,
      );
    }
  }

  const {
    error: countError,
  } = await supabase.rpc(
    "refresh_story_cluster_source_count",
    {
      target_cluster_id:
        cluster.id,
    },
  );

  if (countError) {
    console.error(
      "Cluster source count refresh failed:",
      countError,
    );
  }

  revalidatePath(
    "/admin/radar",
  );

  revalidatePath(
    `/admin/clusters/${cluster.id}`,
  );

  revalidatePath(
    "/admin",
  );

  redirect(
    `/admin/clusters/${cluster.id}`,
  );
}

export async function rejectSuggestedCluster(
  formData: FormData,
) {
  const id = String(
    formData.get("id") ?? "",
  ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  const {
    data: item,
    error: itemError,
  } = await supabase
    .from("radar_items")
    .select(`
      id,
      suggested_cluster_id,
      rejected_cluster_ids
    `)
    .eq("id", id)
    .maybeSingle();

  if (
    itemError ||
    !item
  ) {
    throw new Error(
      itemError?.message ||
        "Radar item not found.",
    );
  }

  if (
    !item.suggested_cluster_id
  ) {
    return;
  }

  const rejected = [
    ...new Set([
      ...(
        item.rejected_cluster_ids ??
        []
      ),
      item.suggested_cluster_id,
    ]),
  ];

  const {
    error: updateError,
  } = await supabase
    .from("radar_items")
    .update({
      suggested_cluster_id:
        null,
      cluster_match_score:
        null,
      cluster_match_reason:
        null,
      duplicate_score:
        0,
      rejected_cluster_ids:
        rejected,
    })
    .eq(
      "id",
      item.id,
    );

  if (updateError) {
    throw new Error(
      updateError.message,
    );
  }

  revalidatePath(
    "/admin/radar",
  );
}


export async function writeStoryFromRadar(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  const {
    data: item,
    error: itemError,
  } = await supabase
    .from("radar_items")
    .select(`
      id,
      headline,
      summary,
      extracted_text,
      source_id,
      source_url,
      published_at,
      discovered_at,
      desk_id,
      cluster_id,
      priority
    `)
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (
    itemError ||
    !item
  ) {
    throw new Error(
      itemError?.message ||
        "Radar item not found.",
    );
  }

  let clusterId =
    item.cluster_id;

  /*
   * Every written Radar story gets a cluster.
   * This gives later reports somewhere to join
   * and prevents developing stories becoming
   * disconnected one-off articles.
   */
  if (!clusterId) {
    const seenAt =
      item.published_at ||
      item.discovered_at ||
      new Date().toISOString();

    const {
      data: cluster,
      error: clusterError,
    } = await supabase
      .from("story_clusters")
      .insert({
        title:
          item.headline,

        canonical_topic:
          item.headline,

        desk_id:
          item.desk_id,

        status:
          "open",

        priority:
          item.priority ??
          "normal",

        confidence_score:
          50,

        source_count:
          0,

        first_seen_at:
          seenAt,

        last_seen_at:
          seenAt,
      })
      .select("id")
      .single();

    if (
      clusterError ||
      !cluster
    ) {
      throw new Error(
        clusterError?.message ||
          "Could not create story cluster.",
      );
    }

    clusterId =
      cluster.id;

    const {
      error: radarClusterError,
    } = await supabase
      .from("radar_items")
      .update({
        cluster_id:
          clusterId,

        status:
          "clustered",

        suggested_cluster_id:
          null,

        cluster_match_score:
          null,

        cluster_match_reason:
          null,
      })
      .eq(
        "id",
        item.id,
      );

    if (radarClusterError) {
      throw new Error(
        radarClusterError.message,
      );
    }

    const {
      error: evidenceError,
    } = await supabase
      .from("evidence")
      .insert({
        cluster_id:
          clusterId,

        radar_item_id:
          item.id,

        source_id:
          item.source_id,

        claim:
          item.headline,

        evidence_type:
          "context",

        verification_status:
          "unverified",

        confidence_score:
          50,

        is_primary_evidence:
          false,

        source_excerpt:
          item.summary,

        source_url:
          item.source_url,

        notes:
          "Initial Radar report used to create newsroom story.",
      });

    if (evidenceError) {
      throw new Error(
        evidenceError.message,
      );
    }

    const {
      error: countError,
    } = await supabase.rpc(
      "refresh_story_cluster_source_count",
      {
        target_cluster_id:
          clusterId,
      },
    );

    if (countError) {
      console.error(
        "Cluster source count refresh failed:",
        countError,
      );
    }
  }

  /*
   * Never generate a second story for the
   * same confirmed cluster.
   */

  const isHero =
  formData.get("is_hero") === "on";

if (isHero) {
  const { error: clearHeroError } =
    await supabase
      .from("stories")
      .update({
        is_hero: false,
      })
      .eq("is_hero", true);

  if (clearHeroError) {
    throw new Error(
      clearHeroError.message,
    );
  }
}
  const {
    data: existingStory,
    error: existingStoryError,
  } = await supabase
    .from("stories")
    .select("id")
    .eq(
      "cluster_id",
      clusterId,
    )
    .neq(
      "status",
      "archived",
    )
    .limit(1)
    .maybeSingle();

  if (existingStoryError) {
    throw new Error(
      existingStoryError.message,
    );
  }

  if (existingStory) {
    redirect(
      `/admin/stories/${existingStory.id}/edit`,
    );
  }

  const [
    sourceResult,
    deskResult,
    clusterResult,
    evidenceResult,
  ] =
    await Promise.all([
      item.source_id
        ? supabase
            .from("sources")
            .select(`
              id,
              name
            `)
            .eq(
              "id",
              item.source_id,
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      item.desk_id
        ? supabase
            .from("desks")
            .select(`
              id,
              name,
              slug
            `)
            .eq(
              "id",
              item.desk_id,
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      supabase
        .from(
          "story_clusters",
        )
        .select(`
          id,
          title
        `)
        .eq(
          "id",
          clusterId,
        )
        .maybeSingle(),

      supabase
        .from("evidence")
        .select(`
          claim,
          source_id,
          source_url,
          verification_status,
          confidence_score,
          source_excerpt
        `)
        .eq(
          "cluster_id",
          clusterId,
        ),
    ]);

  if (sourceResult.error) {
    throw new Error(
      sourceResult.error.message,
    );
  }

  if (deskResult.error) {
    throw new Error(
      deskResult.error.message,
    );
  }

  if (clusterResult.error) {
    throw new Error(
      clusterResult.error.message,
    );
  }

  if (evidenceResult.error) {
    throw new Error(
      evidenceResult.error.message,
    );
  }

  /*
   * Resolve source names for all evidence.
   */
  const evidenceRows =
    evidenceResult.data ?? [];

  const evidenceSourceIds = [
    ...new Set(
      evidenceRows
        .map(
          (row) =>
            row.source_id,
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    ),
  ];

  let evidenceSourceNames =
    new Map<
      string,
      string
    >();

  if (
    evidenceSourceIds.length >
    0
  ) {
    const {
      data: evidenceSources,
      error: evidenceSourcesError,
    } = await supabase
      .from("sources")
      .select(`
        id,
        name
      `)
      .in(
        "id",
        evidenceSourceIds,
      );

    if (
      evidenceSourcesError
    ) {
      throw new Error(
        evidenceSourcesError.message,
      );
    }

    evidenceSourceNames =
      new Map(
        (
          evidenceSources ??
          []
        ).map(
          (source) => [
            source.id,
            source.name,
          ],
        ),
      );
  }

  const sourceName =
    sourceResult.data
      ?.name ??
    "Unknown source";

  const generated =
    await writeBoxingRingNewsArticle(
      {
        sourceName,

        sourceUrl:
          item.source_url ??
          "",

        sourceHeadline:
          item.headline,

        sourceSummary:
        item.extracted_text?.trim()
          ? item.extracted_text
          : item.summary,

        publishedAt:
          item.published_at,

        deskName:
          deskResult.data
            ?.name ??
          null,

        clusterTitle:
          clusterResult.data
            ?.title ??
          item.headline,

        evidence:
          evidenceRows.map(
            (evidence) => ({
              claim:
                evidence.claim,

              sourceName:
                evidence.source_id
                  ? evidenceSourceNames.get(
                      evidence.source_id,
                    ) ??
                    null
                  : null,

              sourceUrl:
                evidence.source_url,

              verificationStatus:
                evidence.verification_status,

              confidenceScore:
                evidence.confidence_score,

              sourceExcerpt:
                evidence.source_excerpt,
            }),
          ),
      },
    );

  /*
   * Make sure the generated slug does not
   * collide with an existing story.
   */
  let finalSlug =
    generated.slug;

  const {
    data: slugMatch,
    error: slugError,
  } = await supabase
    .from("stories")
    .select("id")
    .eq(
      "slug",
      finalSlug,
    )
    .limit(1)
    .maybeSingle();

  if (slugError) {
    throw new Error(
      slugError.message,
    );
  }

  if (slugMatch) {
    finalSlug =
      `${generated.slug}-${Date.now()}`;
  }

  const {
    data: story,
    error: storyError,
  } = await supabase
    .from("stories")
    .insert({
      cluster_id:
        clusterId,

      desk_id:
        item.desk_id,

      title:
        generated.headline,

      slug:
        finalSlug,

      excerpt:
        generated.excerpt,

      intro:
        generated.intro,

      sections:
        generated.sections,

      story_type:
        "news",

      status:
        "review",

      priority:
        item.priority ??
        "normal",

      seo_title:
        generated.seoTitle,

      meta_description:
        generated.metaDescription,

      source_summary:
        `AI draft generated from Radar report by ${sourceName}. Source: ${item.source_url ?? "not supplied"}`,

      editorial_notes:
        `Generated from Radar item ${item.id}. Review all facts, wording and attribution before publication.`,

      ai_generated:
        true,

      human_reviewed:
        false,

      published_at:
        null,

      is_breaking:
        false,

      is_featured:
        false,

      is_exclusive:
        false,

      is_trending:
        false,

      is_hero:
        false,
    })
    .select("id")
    .single();

  if (
    storyError ||
    !story
  ) {
    throw new Error(
      storyError?.message ||
        "Could not create AI story draft.",
    );
  }

  revalidatePath(
    "/admin/radar",
  );

  revalidatePath(
    "/admin/stories",
  );

  revalidatePath(
    "/admin",
  );

  redirect(
    `/admin/stories/${story.id}/edit`,
  );
}


export async function verifyRadarStory(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  /*
   * Load the researched Radar report.
   */
  const {
    data: item,
    error: itemError,
  } = await supabase
    .from("radar_items")
    .select(`
      id,
      headline,
      source_id,
      source_url,
      cluster_id,
      extracted_text
    `)
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (
    itemError ||
    !item
  ) {
    throw new Error(
      itemError?.message ||
        "Radar item not found.",
    );
  }

  if (!item.cluster_id) {
    throw new Error(
      "This Radar report must belong to a story cluster before verification.",
    );
  }

  if (!item.source_url) {
    throw new Error(
      "This Radar report has no source URL.",
    );
  }

  if (
    !item.extracted_text?.trim()
  ) {
    throw new Error(
      "Research this source before running verification.",
    );
  }

  /*
   * Resolve the publication name.
   */
  let sourceName =
    "Unknown source";

  if (item.source_id) {
    const {
      data: source,
      error: sourceError,
    } = await supabase
      .from("sources")
      .select("name")
      .eq(
        "id",
        item.source_id,
      )
      .maybeSingle();

    if (sourceError) {
      throw new Error(
        sourceError.message,
      );
    }

    sourceName =
      source?.name ??
      sourceName;
  }

  /*
   * Extract discrete factual claims from the
   * researched source article.
   *
   * IMPORTANT:
   * This proves only that the SOURCE reports
   * the claim. It is not independent verification.
   */
  const claims =
    await extractClaims({
      sourceName,
      sourceUrl:
        item.source_url,
      headline:
        item.headline,
      articleText:
        item.extracted_text,
    });

  /*
   * Make verification repeatable.
   *
   * Re-running Verify Story replaces only
   * previous AI source-claim rows for this
   * Radar report. The original source_article
   * evidence is preserved.
   */
  const {
    error: deleteError,
  } = await supabase
    .from("evidence")
    .delete()
    .eq(
      "radar_item_id",
      item.id,
    )
    .ilike(
      "notes",
      "AI-extracted source claim.%",
    );

  if (deleteError) {
    throw new Error(
      deleteError.message,
    );
  }

  if (claims.length > 0) {
    const {
      error: insertError,
    } = await supabase
      .from("evidence")
      .insert(
        claims.map(
          (claim) => ({
            cluster_id:
              item.cluster_id,
            radar_item_id:
              item.id,
            source_id:
              item.source_id,
            claim:
              claim.claim,
            evidence_type:
              claim.category === "fight"
                ? "fight_announcement"
                : claim.category === "result"
                  ? "fight_result"
                  : claim.category === "ranking"
                    ? "ranking"
                    : claim.category === "title"
                      ? "title"
                      : claim.category === "weigh_in"
                        ? "weigh_in"
                        : claim.category === "business"
                          ? "business"
                          : "fact",
            verification_status:
              "supported",
            confidence_score:
              claim.confidenceScore,
            is_primary_evidence:
              false,
            source_excerpt:
              claim.sourceExcerpt,
            source_url:
              item.source_url,
            notes:
              `AI-extracted source claim. Category: ${claim.category}. This records what the source reports and is not independent verification.`,
          }),
        ),
      );

    if (insertError) {
      throw new Error(
        insertError.message,
      );
    }
  }

  revalidatePath(
    `/admin/clusters/${item.cluster_id}`,
  );

  revalidatePath(
    "/admin/radar",
  );

  revalidatePath(
    "/admin",
  );

  redirect(
    `/admin/clusters/${item.cluster_id}?verify=success&claims=${claims.length}`,
  );
}


export async function researchAndWriteRadarStory(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  const {
    data: item,
    error: itemError,
  } = await supabase
    .from("radar_items")
    .select(`
      id,
      headline,
      summary,
      source_url,
      extracted_text
    `)
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (
    itemError ||
    !item
  ) {
    throw new Error(
      itemError?.message ||
        "Radar item not found.",
    );
  }

  /*
   * Only research when we do not already have
   * a full extracted source article.
   */
  if (
    !item.extracted_text?.trim()
  ) {
    if (!item.source_url) {
      throw new Error(
        "Radar item has no source URL.",
      );
    }

    let extracted;

    try {
      extracted =
        await extractArticleText(
          item.source_url,
        );
    } catch (error) {
      const extractionMessage =
        error instanceof Error
          ? error.message
          : "Source article could not be extracted.";

      console.warn(
        `Direct source extraction failed for ${item.source_url}: ${extractionMessage}`,
      );

      /*
       * A publisher may legitimately block automated
       * article retrieval with 403/429/etc.
       *
       * Research & Write should not stop there.
       * Fall back to live web research and give the
       * existing newsroom writer that researched brief.
       */
      try {
        const webResearch =
          await researchStoryWithWebSearch({
            headline:
              item.headline,
            summary:
              item.summary,
            originalSourceUrl:
              item.source_url,
          });

        const {
          error: researchUpdateError,
        } = await supabase
          .from("radar_items")
          .update({
            extracted_text:
              webResearch.text,
            processing_error:
              null,
          })
          .eq(
            "id",
            item.id,
          );

        if (researchUpdateError) {
          throw new Error(
            researchUpdateError.message,
          );
        }

        console.info(
          `Radar web research fallback succeeded for ${item.source_url}.`,
        );

        /*
         * Do not return here.
         *
         * writeStoryFromRadar below reloads the Radar
         * item, sees the new extracted_text and sends
         * the research brief to the existing writer.
         */
      } catch (researchError) {
        const researchMessage =
          researchError instanceof Error
            ? researchError.message
            : "Web research fallback failed.";

        const combinedMessage =
          `${extractionMessage} Web research fallback: ${researchMessage}`;

        const {
          error: processingError,
        } = await supabase
          .from("radar_items")
          .update({
            processing_error:
              combinedMessage,
          })
          .eq(
            "id",
            item.id,
          );

        if (processingError) {
          console.error(
            "Failed to save Radar processing error:",
            processingError,
          );
        }

        console.error(
          `Radar web research fallback failed for ${item.source_url}: ${researchMessage}`,
        );

        revalidatePath(
          "/admin/radar",
        );

        return;
      }
    }

    if (extracted) {
      const {
        error: updateError,
      } = await supabase
        .from("radar_items")
        .update({
          raw_content:
            extracted.rawHtml,
          extracted_text:
            extracted.text,
          processing_error:
            null,
        })
        .eq(
          "id",
          item.id,
        );

      if (updateError) {
        throw new Error(
          updateError.message,
        );
      }
    }
  }

  /*
   * Use the existing proven writer.
   *
   * writeStoryFromRadar reads the Radar item again,
   * so it will now receive the researched text.
   */
  return writeStoryFromRadar(
    formData,
  );
}


export async function researchRadarSource(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  if (!id) {
    return;
  }

  const supabase =
    await getNewsroomClient();

  const {
    data: item,
    error: itemError,
  } = await supabase
    .from("radar_items")
    .select(`
      id,
      headline,
      summary,
      source_id,
      source_url,
      cluster_id,
      extracted_text
    `)
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (
    itemError ||
    !item
  ) {
    throw new Error(
      itemError?.message ||
        "Radar item not found.",
    );
  }

  if (!item.source_url) {
    throw new Error(
      "Radar item has no source URL.",
    );
  }

  let extracted;

  try {
    extracted =
      await extractArticleText(
        item.source_url,
      );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Source article could not be extracted.";

    const {
      error: processingError,
    } = await supabase
      .from("radar_items")
      .update({
        processing_error:
          message,
      })
      .eq(
        "id",
        item.id,
      );

    if (processingError) {
      console.error(
        "Failed to save Radar processing error:",
        processingError,
      );
    }

    console.warn(
      `Radar research skipped for ${item.source_url}: ${message}`,
    );

    revalidatePath(
      "/admin/radar",
    );

    return;
  }

  const {
    error: updateError,
  } = await supabase
    .from("radar_items")
    .update({
      raw_content:
        extracted.rawHtml,

      extracted_text:
        extracted.text,

      processing_error:
        null,
    })
    .eq(
      "id",
      item.id,
    );

  if (updateError) {
    throw new Error(
      updateError.message,
    );
  }

  /*
   * If this Radar item is already part of a cluster,
   * store the extracted article as evidence too.
   */
  if (item.cluster_id) {
    const {
      data: existingEvidence,
      error: existingEvidenceError,
    } = await supabase
      .from("evidence")
      .select("id")
      .eq(
        "radar_item_id",
        item.id,
      )
      .limit(1)
      .maybeSingle();

    if (
      existingEvidenceError
    ) {
      throw new Error(
        existingEvidenceError.message,
      );
    }

    const excerpt =
      extracted.text.length >
      3000
        ? `${extracted.text.slice(
            0,
            3000,
          )}…`
        : extracted.text;

    if (existingEvidence) {
      const {
        error: evidenceUpdateError,
      } = await supabase
        .from("evidence")
        .update({
          claim:
            item.headline,

          evidence_type:
            "context",

          verification_status:
            "supported",

          confidence_score:
            70,

          source_excerpt:
            excerpt,

          source_url:
            extracted.url,

          notes:
            `Source article extracted successfully. ${extracted.wordCount} readable words captured.`,
        })
        .eq(
          "id",
          existingEvidence.id,
        );

      if (
        evidenceUpdateError
      ) {
        throw new Error(
          evidenceUpdateError.message,
        );
      }
    } else {
      const {
        error: evidenceInsertError,
      } = await supabase
        .from("evidence")
        .insert({
          cluster_id:
            item.cluster_id,

          radar_item_id:
            item.id,

          source_id:
            item.source_id,

          claim:
            item.headline,

          evidence_type:
            "context",

          verification_status:
            "supported",

          confidence_score:
            70,

          is_primary_evidence:
            false,

          source_excerpt:
            excerpt,

          source_url:
            extracted.url,

          notes:
            `Source article extracted successfully. ${extracted.wordCount} readable words captured.`,
        });

      if (
        evidenceInsertError
      ) {
        throw new Error(
          evidenceInsertError.message,
        );
      }
    }
  }

  revalidatePath(
    "/admin/radar",
  );

  revalidatePath(
    "/admin",
  );

  if (
    item.cluster_id
  ) {
    revalidatePath(
      `/admin/clusters/${item.cluster_id}`,
    );
  }

  redirect(
    `/admin/radar?research=success&words=${extracted.wordCount}`,
  );
}
