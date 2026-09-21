import { redirect } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const allowedStatuses = [
  "draft",
  "review",
  "published",
  "updated",
  "scheduled",
  "archived",
];

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

function statusClasses(
  status: string,
) {
  switch (status) {
    case "published":
    case "updated":
      return "bg-green-100 text-green-800";

    case "review":
      return "bg-amber-100 text-amber-800";

    case "scheduled":
      return "bg-blue-100 text-blue-800";

    case "archived":
      return "bg-neutral-200 text-neutral-600";

    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default async function StoriesPage({
  searchParams,
}: PageProps) {
  const { status } =
    await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data: profile,
  } = await supabase
    .from("newsroom_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) {
    redirect("/");
  }

  let query = supabase
    .from("stories")
    .select(`
      id,
      title,
      slug,
      story_type,
      status,
      is_breaking,
      is_exclusive,
      is_featured,
      published_at,
      updated_at,
      desks (
        name
      )
    `)
    .order("updated_at", {
      ascending: false,
    });

  if (
    status &&
    allowedStatuses.includes(
      status,
    )
  ) {
    query = query.eq(
      "status",
      status,
    );
  }

  const {
    data: stories,
    error,
  } = await query;

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-black/45 hover:text-black"
            >
              ← Newsroom
            </Link>

            <div className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-red-600">
              Editorial Library
            </div>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-black">
              Stories
            </h1>

            <p className="mt-3 text-black/55">
              Manage Informant Wire
              coverage from first draft
              through publication.
            </p>
          </div>

          <Link
            href="/admin/stories/new"
            className="rounded-lg bg-red-600 px-6 py-3 text-center text-sm font-black text-white transition hover:bg-red-700"
          >
            + Write Story
          </Link>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2">
          <Filter
            href="/admin/stories"
            label="All"
            active={!status}
          />

          <Filter
            href="/admin/stories?status=draft"
            label="Drafts"
            active={
              status === "draft"
            }
          />

          <Filter
            href="/admin/stories?status=review"
            label="Review"
            active={
              status === "review"
            }
          />

          <Filter
            href="/admin/stories?status=published"
            label="Published"
            active={
              status ===
              "published"
            }
          />

          <Filter
            href="/admin/stories?status=scheduled"
            label="Scheduled"
            active={
              status ===
              "scheduled"
            }
          />
        </nav>

        <section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
          {!stories?.length ? (
            <div className="p-16 text-center">
              <div className="text-lg font-black text-black">
                No stories here yet.
              </div>

              <p className="mt-2 text-sm text-black/45">
                Stories matching this
                filter will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {stories.map(
                (story) => {
                  const desk =
                    Array.isArray(
                      story.desks,
                    )
                      ? story.desks[0]
                      : story.desks;

                  return (
                    <article
                      key={story.id}
                      className="p-6 transition hover:bg-neutral-50"
                    >
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusClasses(
                                story.status,
                              )}`}
                            >
                              {story.status}
                            </span>

                            {desk?.name ? (
                              <span className="text-xs font-black uppercase tracking-[0.12em] text-red-600">
                                {desk.name}
                              </span>
                            ) : null}

                            <span className="text-xs font-bold capitalize text-black/35">
                              {story.story_type}
                            </span>

                            {story.is_breaking ? (
                              <Badge>
                                Breaking
                              </Badge>
                            ) : null}

                            {story.is_exclusive ? (
                              <Badge>
                                Exclusive
                              </Badge>
                            ) : null}

                            {story.is_featured ? (
                              <Badge>
                                Featured
                              </Badge>
                            ) : null}
                          </div>

                          <h2 className="mt-3 text-xl font-black leading-tight text-black">
                            {story.title}
                          </h2>

                          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-black/40">
                            <span>
                              Updated{" "}
                              {formatDate(
                                story.updated_at,
                              )}
                            </span>

                            {story.published_at ? (
                              <span>
                                Published{" "}
                                {formatDate(
                                  story.published_at,
                                )}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <a
                            href={`/admin/stories/${story.id}/edit`}
                            className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm font-black text-black transition hover:border-black"
                          >
                            Edit
                          </a>

                          {[
                            "published",
                            "updated",
                          ].includes(
                            story.status,
                          ) ? (
                            <a
                              href={`/${story.slug}`}
                              className="rounded-lg bg-black px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-600"
                            >
                              View
                            </a>
                          ) : null}
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

function Filter({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={[
        "rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide transition",
        active
          ? "bg-black text-white"
          : "border border-black/10 bg-white text-black/55 hover:text-black",
      ].join(" ")}
    >
      {label}
    </a>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-700">
      {children}
    </span>
  );
}
