import {
  notFound,
  redirect,
} from "next/navigation";

import AdminHeader from "@/components/admin/AdminHeader";
import {
  createClient,
} from "@/lib/supabase/server";

import {
  verifyRadarStory,
} from "@/app/admin/radar/actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
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
  ).format(
    new Date(value),
  );
}

export default async function ClusterPage({
  params,
}: PageProps) {
  const { id } =
    await params;

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
    .select("role")
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

  const [
    clusterResult,
    radarResult,
    evidenceResult,
  ] = await Promise.all([
    supabase
      .from(
        "story_clusters",
      )
      .select(`
        id,
        title,
        canonical_topic,
        status,
        priority,
        confidence_score,
        source_count,
        first_seen_at,
        last_seen_at,
        desks (
          name
        )
      `)
      .eq(
        "id",
        id,
      )
      .maybeSingle(),

    supabase
      .from(
        "radar_items",
      )
      .select(`
        id,
        headline,
        summary,
        extracted_text,
        source_url,
        published_at,
        discovered_at,
        status,
        sources (
          name
        )
      `)
      .eq(
        "cluster_id",
        id,
      )
      .order(
        "published_at",
        {
          ascending: false,
          nullsFirst: false,
        },
      ),

    supabase
      .from(
        "evidence",
      )
      .select(`
        id,
        claim,
        evidence_type,
        verification_status,
        confidence_score,
        source_excerpt,
        source_url,
        created_at
      `)
      .eq(
        "cluster_id",
        id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),
  ]);

  if (
    clusterResult.error ||
    !clusterResult.data
  ) {
    notFound();
  }

  const cluster =
    clusterResult.data;

  const radarItems =
    radarResult.data ?? [];

  const evidence =
    evidenceResult.data ?? [];

  const desk =
    Array.isArray(
      cluster.desks,
    )
      ? cluster.desks[0]
      : cluster.desks;

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <a
          href="/admin/radar"
          className="text-sm font-bold text-black/45 hover:text-black"
        >
          ← News Radar
        </a>

        <header className="mt-6 border-b border-black/10 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-blue-800">
              {cluster.status}
            </span>

            <span className="rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              {cluster.priority}
            </span>

            {desk?.name ? (
              <span className="text-xs font-black uppercase tracking-[0.14em] text-red-600">
                {desk.name}
              </span>
            ) : null}
          </div>

          <div className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-red-600">
            Story Cluster
          </div>

          <h1 className="mt-2 max-w-5xl text-4xl font-black leading-tight tracking-[-0.04em] text-black">
            {cluster.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-black/45">
            <span>
              Sources{" "}
              <strong className="text-black">
                {cluster.source_count}
              </strong>
            </span>

            <span>
              Confidence{" "}
              <strong className="text-black">
                {cluster.confidence_score}
              </strong>
            </span>

            <span>
              First seen{" "}
              <strong className="text-black">
                {formatDate(
                  cluster.first_seen_at,
                )}
              </strong>
            </span>

            <span>
              Last seen{" "}
              <strong className="text-black">
                {formatDate(
                  cluster.last_seen_at,
                )}
              </strong>
            </span>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              Coverage
            </div>

            <h2 className="mt-2 text-2xl font-black text-black">
              Source reports
            </h2>

            <div className="mt-6 divide-y divide-black/10">
              {radarItems.map(
                (item) => {
                  const source =
                    Array.isArray(
                      item.sources,
                    )
                      ? item.sources[0]
                      : item.sources;

                  return (
                    <article
                      key={item.id}
                      className="py-5 first:pt-0"
                    >
                      <div className="text-xs font-black uppercase tracking-wide text-red-600">
                        {source?.name ||
                          "Source"}
                      </div>

                      <h3 className="mt-2 text-xl font-black leading-tight text-black">
                        {item.headline}
                      </h3>

                      {item.summary ? (
                        <p className="mt-3 text-sm leading-6 text-black/55">
                          {item.summary}
                        </p>
                      ) : null}

                      <div className="mt-3 text-xs text-black/40">
                        Published{" "}
                        {formatDate(
                          item.published_at,
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {item.source_url ? (
                          <a
                            href={
                              item.source_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-black uppercase tracking-wide text-red-600"
                          >
                            Open source ↗
                          </a>
                        ) : null}

                        {item.extracted_text?.trim() ? (
                          <>
                            <span className="rounded-full bg-green-100 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-green-800">
                              ✓ Researched
                            </span>

                            <form
                              action={
                                verifyRadarStory
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
                                className="rounded-lg bg-black px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-600"
                              >
                                Verify Story
                              </button>
                            </form>
                          </>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-amber-800">
                            Research required
                          </span>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              Verification
            </div>

            <h2 className="mt-2 text-2xl font-black text-black">
              Evidence
            </h2>

            <div className="mt-6 space-y-4">
              {evidence.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-black/10 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-neutral-200 px-2.5 py-1 text-[9px] font-black uppercase text-black/60">
                        {
                          item.evidence_type
                        }
                      </span>

                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black uppercase text-amber-800">
                        {
                          item.verification_status
                        }
                      </span>
                    </div>

                    <div className="mt-3 text-sm font-bold leading-6 text-black">
                      {item.claim}
                    </div>

                    {item.source_excerpt ? (
                      <p className="mt-2 text-xs leading-5 text-black/45">
                        {
                          item.source_excerpt
                        }
                      </p>
                    ) : null}
                  </div>
                ),
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
