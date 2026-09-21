import { redirect } from "next/navigation";

import AdminHeader from "@/components/admin/AdminHeader";
import RunRadarButton from "@/components/admin/RunRadarButton";
import ScanRadarMatchesButton from "@/components/admin/ScanRadarMatchesButton";
import {
  shortlistRadarItem,
  ignoreRadarItem,
  createClusterFromRadarItem,
  joinSuggestedCluster,
  rejectSuggestedCluster,
  researchAndWriteRadarStory,
  researchRadarSource,
} from "./actions";
import { createClient } from "@/lib/supabase/server";

type RadarItem = {
  id: string;
  cluster_id: string | null;
  suggested_cluster_id: string | null;
  cluster_match_score: number | null;
  cluster_match_reason: string | null;
  headline: string;
  summary: string | null;
  extracted_text: string | null;
  source_url: string | null;
  author_name: string | null;
  published_at: string | null;
  discovered_at: string;
  status: string;
  priority: string;
  relevance_score: number | null;
  freshness_score: number | null;
  authority_score: number | null;
  duplicate_score: number | null;
  sources:
    | {
        name: string;
        authority_tier: number;
      }
    | {
        name: string;
        authority_tier: number;
      }[]
    | null;
  desks:
    | {
        name: string;
        slug: string;
      }
    | {
        name: string;
        slug: string;
      }[]
    | null;
};

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function getSource(
  item: RadarItem,
) {
  if (!item.sources) {
    return null;
  }

  return Array.isArray(
    item.sources,
  )
    ? item.sources[0] ?? null
    : item.sources;
}

function getDesk(
  item: RadarItem,
) {
  if (!item.desks) {
    return null;
  }

  return Array.isArray(
    item.desks,
  )
    ? item.desks[0] ?? null
    : item.desks;
}

function statusClass(
  status: string,
) {
  switch (status) {
    case "shortlisted":
      return "bg-green-100 text-green-800";

    case "clustered":
      return "bg-blue-100 text-blue-800";

    case "ignored":
      return "bg-neutral-200 text-neutral-500";

    case "duplicate":
      return "bg-amber-100 text-amber-800";

    case "failed":
      return "bg-red-100 text-red-800";

    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function priorityClass(
  priority: string,
) {
  switch (priority) {
    case "breaking":
      return "bg-red-600 text-white";

    case "high":
      return "bg-orange-100 text-orange-800";

    case "low":
      return "bg-neutral-100 text-neutral-500";

    default:
      return "bg-black text-white";
  }
}

function Score({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2">
      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-black/35">
        {label}
      </div>

      <div className="mt-1 text-sm font-black text-black">
        {value ?? 0}
      </div>
    </div>
  );
}

export default async function RadarPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    redirect("/");
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "radar_items",
    )
    .select(`
      id,
      cluster_id,
      suggested_cluster_id,
      cluster_match_score,
      cluster_match_reason,
      headline,
      summary,
      extracted_text,
      source_url,
      author_name,
      published_at,
      discovered_at,
      status,
      priority,
      relevance_score,
      freshness_score,
      authority_score,
      duplicate_score,
      sources (
        name,
        authority_tier
      ),
      desks (
        name,
        slug
      )
    `)
    .order(
      "published_at",
      {
        ascending: false,
        nullsFirst: false,
      },
    )
    .order(
      "discovered_at",
      {
        ascending: false,
      },
    )
    .limit(100);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const items =
    (data ?? []) as RadarItem[];

  const clusterIds = [
    ...new Set(
      items
        .map((item) => item.cluster_id)
        .filter(
          (value): value is string =>
            Boolean(value),
        ),
    ),
  ];

  const storyByClusterId =
    new Map<
      string,
      {
        id: string;
        status: string;
        slug: string;
      }
    >();

  if (clusterIds.length > 0) {
    const {
      data: existingStories,
      error: storiesError,
    } = await supabase
      .from("stories")
      .select(`
        id,
        cluster_id,
        status,
        slug
      `)
      .in("cluster_id", clusterIds)
      .neq("status", "archived");

    if (storiesError) {
      throw new Error(
        storiesError.message,
      );
    }

    for (const story of existingStories ?? []) {
      if (story.cluster_id) {
        storyByClusterId.set(
          story.cluster_id,
          {
            id: story.id,
            status: story.status,
            slug: story.slug,
          },
        );
      }
    }
  }

  const newCount =
    items.filter(
      (item) =>
        item.status === "new",
    ).length;

  const shortlistedCount =
    items.filter(
      (item) =>
        item.status ===
        "shortlisted",
    ).length;

  const clusteredCount =
    items.filter(
      (item) =>
        item.status ===
        "clustered",
    ).length;

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end">
          <div>
            <a
              href="/admin"
              className="text-sm font-bold text-black/45 hover:text-black"
            >
              ← Newsroom
            </a>

            <div className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-red-600">
              Intelligence Desk
            </div>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-black">
              News Radar
            </h1>

            <p className="mt-3 max-w-2xl text-black/55">
              Incoming entertainment
              intelligence discovered
              across trusted sources.
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <a
              href="/admin"
              className="rounded-lg border border-black/10 bg-white px-5 py-3 text-sm font-black text-black"
            >
              Dashboard
            </a>

            <a
              href="/admin/stories/new"
              className="rounded-lg bg-black px-5 py-3 text-sm font-black text-white hover:bg-neutral-800"
            >
              + Write Story
            </a>

            <RunRadarButton />
            <ScanRadarMatchesButton />
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="text-xs font-black uppercase tracking-[0.15em] text-black/35">
              New
            </div>

            <div className="mt-2 text-4xl font-black text-black">
              {newCount}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="text-xs font-black uppercase tracking-[0.15em] text-black/35">
              Shortlisted
            </div>

            <div className="mt-2 text-4xl font-black text-black">
              {shortlistedCount}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="text-xs font-black uppercase tracking-[0.15em] text-black/35">
              Clustered
            </div>

            <div className="mt-2 text-4xl font-black text-black">
              {clusteredCount}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                Incoming Feed
              </div>

              <h2 className="mt-1 text-2xl font-black text-black">
                Latest discoveries
              </h2>
            </div>

            <div className="text-sm font-bold text-black/35">
              Showing latest 100
            </div>
          </div>

          {!items.length ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white p-16 text-center">
              <div className="text-xl font-black text-black">
                Radar is quiet.
              </div>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/45">
                Incoming source items
                will appear here once
                the Radar ingestion
                pipeline is connected.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(
                (item) => {
                  const source =
                    getSource(
                      item,
                    );

                  const desk =
                    getDesk(
                      item,
                    );

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-black/10 bg-white p-6"
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass(
                                item.status,
                              )}`}
                            >
                              {
                                item.status
                              }
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${priorityClass(
                                item.priority,
                              )}`}
                            >
                              {
                                item.priority
                              }
                            </span>

                            {desk ? (
                              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-red-600">
                                {
                                  desk.name
                                }
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-4 text-2xl font-black leading-tight tracking-[-0.025em] text-black">
                            {
                              item.headline
                            }
                          </h3>

                          {item.summary ? (
                            <p className="mt-3 max-w-4xl text-sm leading-6 text-black/55">
                              {
                                item.summary
                              }
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/40">
                            {source ? (
                              <span>
                                Source:{" "}
                                <strong className="text-black/65">
                                  {
                                    source.name
                                  }
                                </strong>
                              </span>
                            ) : null}

                            {item.author_name ? (
                              <span>
                                By{" "}
                                {
                                  item.author_name
                                }
                              </span>
                            ) : null}

                            <span>
                              Published{" "}
                              {formatDate(
                                item.published_at,
                              )}
                            </span>

                            <span>
                              Detected{" "}
                              {formatDate(
                                item.discovered_at,
                              )}
                            </span>
                          </div>

                          {item.suggested_cluster_id &&
                          item.cluster_match_score ? (
                            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                                    Suggested Story Match
                                  </div>

                                  <div className="mt-1 text-lg font-black text-black">
                                    {item.cluster_match_score}% match
                                  </div>

                                  {item.cluster_match_reason ? (
                                    <div className="mt-1 text-xs leading-5 text-black/50">
                                      {item.cluster_match_reason}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <a
                                    href={`/admin/clusters/${item.suggested_cluster_id}`}
                                    className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700 transition hover:bg-blue-100"
                                  >
                                    Review →
                                  </a>

                                  <form action={joinSuggestedCluster}>
                                    <input
                                      type="hidden"
                                      name="id"
                                      value={item.id}
                                    />

                                    <button
                                      type="submit"
                                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-700"
                                    >
                                      Join Cluster
                                    </button>
                                  </form>

                                  <form action={rejectSuggestedCluster}>
                                    <input
                                      type="hidden"
                                      name="id"
                                      value={item.id}
                                    />

                                    <button
                                      type="submit"
                                      className="rounded-lg border border-black/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-black/55 transition hover:bg-black/5"
                                    >
                                      Not a Match
                                    </button>
                                  </form>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            {item.source_url ? (
                              <a
                                href={
                                  item.source_url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mr-2 text-xs font-black uppercase tracking-[0.08em] text-red-600 hover:text-red-700"
                              >
                                Open source ↗
                              </a>
                            ) : null}

                            {item.extracted_text?.trim() ? (
                              <span className="rounded-lg bg-green-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-green-800">
                                ✓ Researched ·{" "}
                                {
                                  item.extracted_text
                                    .trim()
                                    .split(/\s+/)
                                    .length
                                }{" "}
                                words
                              </span>
                            ) : (
                              <form
                                action={
                                  researchRadarSource
                                }
                              >
                                <input
                                  type="hidden"
                                  name="id"
                                  value={
                                    item.id
                                  }
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:border-red-500 hover:text-red-400"
                                >
                                  Research Source
                                </button>
                              </form>
                            )}

                            {item.cluster_id &&
                            storyByClusterId.has(
                              item.cluster_id,
                            ) ? (
                              storyByClusterId.get(
                                item.cluster_id,
                              )!.status ===
                              "published" ? (
                                <a
                                  href={`/${storyByClusterId.get(
                                    item.cluster_id,
                                  )!.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-green-700"
                                >
                                  ✓ Published · View Story
                                </a>
                              ) : (
                                <a
                                  href={`/admin/stories/${storyByClusterId.get(
                                    item.cluster_id,
                                  )!.id}/edit`}
                                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-green-700"
                                >
                                  ✓ Draft Created · Open Story
                                </a>
                              )
                            ) : (
                              <form
                                action={
                                  researchAndWriteRadarStory
                                }
                              >
                                <input
                                  type="hidden"
                                  name="id"
                                  value={
                                    item.id
                                  }
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700"
                                >
                                  ✦ Research & Write
                                </button>
                              </form>
                            )}

                            {item.status !==
                            "shortlisted" ? (
                              <form
                                action={
                                  shortlistRadarItem
                                }
                              >
                                <input
                                  type="hidden"
                                  name="id"
                                  value={
                                    item.id
                                  }
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg bg-black px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-green-700"
                                >
                                  Shortlist
                                </button>
                              </form>
                            ) : (
                              <span className="rounded-lg bg-green-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-green-800">
                                ✓ Shortlisted
                              </span>
                            )}

                            {item.status !==
                            "ignored" ? (
                              <form
                                action={
                                  ignoreRadarItem
                                }
                              >
                                <input
                                  type="hidden"
                                  name="id"
                                  value={
                                    item.id
                                  }
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg border border-black/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-black/55 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                >
                                  Ignore
                                </button>
                              </form>
                            ) : (
                              <span className="rounded-lg bg-neutral-200 px-4 py-2 text-xs font-black uppercase tracking-wide text-neutral-500">
                                Ignored
                              </span>
                            )}

                            {item.cluster_id ? (
                              <a
                                href={`/admin/clusters/${item.cluster_id}`}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-700"
                              >
                                Open Cluster
                              </a>
                            ) : (
                              <form
                                action={
                                  createClusterFromRadarItem
                                }
                              >
                                <input
                                  type="hidden"
                                  name="id"
                                  value={
                                    item.id
                                  }
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-700"
                                >
                                  Cluster
                                </button>
                              </form>
                            )}
                          </div>
                        </div>

                        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[360px] lg:grid-cols-2">
                          <Score
                            label="Authority"
                            value={
                              item.authority_score
                            }
                          />

                          <Score
                            label="Freshness"
                            value={
                              item.freshness_score
                            }
                          />

                          <Score
                            label="Relevance"
                            value={
                              item.relevance_score
                            }
                          />

                          <Score
                            label="Duplicate"
                            value={
                              item.duplicate_score
                            }
                          />
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
