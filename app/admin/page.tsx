import { redirect } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import NewsroomStat from "@/components/admin/NewsroomStat";
import { createClient } from "@/lib/supabase/server";

async function getCount(
  table: string,
  filters?: {
    column: string;
    value: string;
  },
) {
  const supabase = await createClient();

  let query = supabase
    .from(table)
    .select("*", {
      count: "exact",
      head: true,
    });

  if (filters) {
    query = query.eq(
      filters.column,
      filters.value,
    );
  }

  const {
    count,
    error,
  } = await query;

  if (error) {
    console.error(
      `Failed to count ${table}:`,
      error,
    );

    return 0;
  }

  return count ?? 0;
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [
    publishedStories,
    draftStories,
    radarItems,
    openClusters,
    prSubmissions,
    inboxItems,
    developingUpdates,
    sources,
  ] = await Promise.all([
    getCount("stories", {
      column: "status",
      value: "published",
    }),

    getCount("stories", {
      column: "status",
      value: "draft",
    }),

    getCount("radar_items"),

    getCount("story_clusters", {
      column: "status",
      value: "open",
    }),

    getCount("pr_submissions"),

    getCount("editorial_inbox", {
      column: "status",
      value: "new",
    }),

    getCount("developing_updates", {
      column: "status",
      value: "pending",
    }),

    getCount("sources"),
  ]);

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
              Editorial Control
            </div>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-black">
              Newsroom Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-black/55">
              Monitor stories, incoming intelligence,
              developing coverage and editorial work
              across Boxing Ring News.
            </p>
          </div>

          <Link
            href="/admin/stories/new"
            className="rounded-lg bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:bg-red-700"
          >
            + Write Story
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NewsroomStat
            label="Published"
            value={publishedStories}
            description="Live Boxing Ring News stories"
          />

          <NewsroomStat
            label="Drafts"
            value={draftStories}
            description="Stories currently in draft"
          />

          <NewsroomStat
            label="Radar"
            value={radarItems}
            description="Items discovered by Radar"
          />

          <NewsroomStat
            label="Story Clusters"
            value={openClusters}
            description="Open developing events"
          />

          <NewsroomStat
            label="PR Inbox"
            value={prSubmissions}
            description="Incoming PR submissions"
          />

          <NewsroomStat
            label="Editorial Inbox"
            value={inboxItems}
            description="New items requiring attention"
          />

          <NewsroomStat
            label="Updates"
            value={developingUpdates}
            description="Pending developing-story updates"
          />

          <NewsroomStat
            label="Sources"
            value={sources}
            description="Newsroom intelligence sources"
          />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-black/10 bg-white p-7">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              Editorial Queue
            </div>

            <h2 className="mt-2 text-2xl font-black text-black">
              Stories requiring attention
            </h2>

            <div className="mt-10 rounded-xl border border-dashed border-black/15 p-10 text-center">
              <div className="font-bold text-black">
                The newsroom is clear.
              </div>

              <div className="mt-2 text-sm text-black/45">
                Radar stories, PR submissions and
                editorial tasks will appear here.
              </div>
            </div>
          </div>

          <aside className="rounded-2xl bg-black p-7 text-white">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
              Boxing Ring News
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Newsroom Pipeline
            </h2>

            <div className="mt-7 space-y-4 text-sm">
              {[
                "01  Watch",
                "02  Detect",
                "03  Cluster",
                "04  Verify",
                "05  Research",
                "06  Write",
                "07  Review",
                "08  Publish",
                "09  Monitor",
              ].map((step) => (
                <div
                  key={step}
                  className="border-b border-white/10 pb-3 text-white/65"
                >
                  {step}
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
