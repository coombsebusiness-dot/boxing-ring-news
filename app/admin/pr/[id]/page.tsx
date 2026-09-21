import {
  notFound,
  redirect,
} from "next/navigation";

import Link from "next/link";

import AdminHeader from "@/components/admin/AdminHeader";

import {
  convertPRToStory,
  updatePRSubmission,
} from "./actions";
import {
  createClient,
} from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PRAsset = {
  id: string;
  asset_type: string;
  title: string | null;
  asset_url: string;
  credit: string | null;
  rights_note: string | null;
};

const typeLabels:
  Record<string, string> = {
    news_tip: "News Tip",
    press_release:
      "Press Release",
    interview_offer:
      "Interview Offer",
    fight_announcement:
      "Fight Announcement",
    media_day_invite:
      "Media Day Invite",
    event_invite:
      "Event Invite",
    asset_delivery:
      "Asset Delivery",
    correction:
      "Correction",
    other: "Other",
  };

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "long",
      timeStyle: "short",
      timeZone:
        "Europe/London",
    },
  ).format(
    new Date(value),
  );
}

export default async function PRSubmissionPage({
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
    .from("newsroom_users")
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

  const {
    data: submission,
    error,
  } = await supabase
    .from("pr_submissions")
    .select(`
      id,
      sender_name,
      sender_email,
      company_name,
      sender_role,
      subject,
      message,
      website_url,
      press_release_url,
      submission_type,
      desk_id,
      status,
      priority,
      notes,
      linked_story_id,
      submitted_at,
      reviewed_at
    `)
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (
    error ||
    !submission
  ) {
    notFound();
  }

  let deskName:
    | string
    | null = null;

  if (
    submission.desk_id
  ) {
    const {
      data: desk,
    } = await supabase
      .from("desks")
      .select("name")
      .eq(
        "id",
        submission.desk_id,
      )
      .maybeSingle();

    deskName =
      desk?.name ?? null;
  }

  const {
    data: assetData,
  } = await supabase
    .from("pr_assets")
    .select(`
      id,
      asset_type,
      title,
      asset_url,
      credit,
      rights_note
    `)
    .eq(
      "submission_id",
      id,
    )
    .order(
      "created_at",
      {
        ascending: true,
      },
    );

  const assets =
    (assetData ??
      []) as PRAsset[];

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
       <Link
  href="/admin/pr"
  className="text-sm font-bold text-black/45 transition hover:text-black"
>
  ← PR Inbox
</Link>

        <div className="mt-6 flex flex-col gap-6 border-b border-black/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
              PR Submission
            </div>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-black">
              {
                submission.subject
              }
            </h1>

            <p className="mt-3 text-black/50">
              Received{" "}
              {formatDate(
                submission.submitted_at,
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>
              {typeLabels[
                submission.submission_type
              ] ??
                submission.submission_type}
            </Badge>

            <Badge>
              {deskName ??
                "General"}
            </Badge>

            <Badge dark>
              {
                submission.status
              }
            </Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-black/10 bg-white p-7">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                Submission
              </div>

              <h2 className="mt-2 text-2xl font-black text-black">
                Pitch / Press Release
              </h2>

              <div className="mt-6 whitespace-pre-wrap text-[15px] leading-8 text-black/75">
                {
                  submission.message
                }
              </div>
            </section>

            {(submission.website_url ||
              submission.press_release_url) ? (
              <section className="rounded-2xl border border-black/10 bg-white p-7">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                  Supplied Links
                </div>

                <div className="mt-5 space-y-4">
                  {submission.website_url ? (
                    <ExternalLink
                      label="Official website"
                      href={
                        submission.website_url
                      }
                    />
                  ) : null}

                  {submission.press_release_url ? (
                    <ExternalLink
                      label="Press release / press kit"
                      href={
                        submission.press_release_url
                      }
                    />
                  ) : null}
                </div>
              </section>
            ) : null}

            {assets.length > 0 ? (
              <section className="rounded-2xl border border-black/10 bg-white p-7">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                  PR Assets
                </div>

                <h2 className="mt-2 text-2xl font-black text-black">
                  Supplied Material
                </h2>

                <div className="mt-6 space-y-4">
                  {assets.map(
                    (asset) => (
                      <div
                        key={
                          asset.id
                        }
                        className="rounded-xl border border-black/10 bg-neutral-50 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="font-black text-black">
                              {asset.title ??
                                asset.asset_type}
                            </div>

                            <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-black/40">
                              {
                                asset.asset_type
                              }
                            </div>
                          </div>

                          <a
                            href={
                              asset.asset_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-black text-red-600 hover:underline"
                          >
                            Open asset →
                          </a>
                        </div>

                        {asset.credit ? (
                          <p className="mt-4 text-sm text-black/55">
                            Credit:{" "}
                            {
                              asset.credit
                            }
                          </p>
                        ) : null}

                        {asset.rights_note ? (
                          <p className="mt-2 text-sm text-black/55">
                            Rights:{" "}
                            {
                              asset.rights_note
                            }
                          </p>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-black/10 bg-white p-6">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                Contact
              </div>

              <div className="mt-5 space-y-5">
                <Info
                  label="Name"
                  value={
                    submission.sender_name
                  }
                />

                <Info
                  label="Email"
                  value={
                    submission.sender_email
                  }
                  href={`mailto:${submission.sender_email}`}
                />

                <Info
                  label="Company"
                  value={
                    submission.company_name ??
                    "—"
                  }
                />

                <Info
                  label="Role"
                  value={
                    submission.sender_role ??
                    "—"
                  }
                />
              </div>
            </section>

            <section className="rounded-2xl bg-black p-6 text-white">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                  Editorial
                </div>

                <form
                  action={updatePRSubmission}
                  className="mt-5 space-y-5"
                >
                  <input
                    type="hidden"
                    name="id"
                    value={submission.id}
                  />

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-white/35">
                      Status
                    </span>

                    <select
                      name="status"
                      defaultValue={submission.status}
                      className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 font-bold text-white outline-none"
                    >
                      <option value="new">
                        New
                      </option>

                      <option value="reviewing">
                        Reviewing
                      </option>

                      <option value="shortlisted">
                        Shortlisted
                      </option>

                      <option value="accepted">
                        Accepted
                      </option>

                      <option value="rejected">
                        Rejected
                      </option>

                      <option value="spam">
                        Spam
                      </option>

                      <option value="archived">
                        Archived
                      </option>

                      {submission.status ===
                      "converted_to_story" ? (
                        <option value="converted_to_story">
                          Converted to Story
                        </option>
                      ) : null}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-white/35">
                      Priority
                    </span>

                    <select
                      name="priority"
                      defaultValue={submission.priority}
                      className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 font-bold text-white outline-none"
                    >
                      <option value="low">
                        Low
                      </option>

                      <option value="normal">
                        Normal
                      </option>

                      <option value="high">
                        High
                      </option>

                      <option value="breaking">
                        Breaking
                      </option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-white/35">
                      Internal Notes
                    </span>

                    <textarea
                      name="notes"
                      defaultValue={submission.notes ?? ""}
                      rows={7}
                      placeholder="Add newsroom notes..."
                      className="w-full resize-y rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30"
                    />
                  </label>

                  <div className="border-t border-white/10 pt-5">
                    <DarkInfo
                      label="Desk"
                      value={deskName ?? "General"}
                    />

                    <div className="mt-5">
                      <DarkInfo
                        label="Reviewed"
                        value={
                          submission.reviewed_at
                            ? formatDate(
                                submission.reviewed_at,
                              )
                            : "Not yet"
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-red-500"
                  >
                    Save Editorial Changes
                  </button>
                </form>
              </section>

            {submission.notes ? (
              <section className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                  Internal Notes
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-black/65">
                  {
                    submission.notes
                  }
                </p>
              </section>
            ) : null}

            {submission.linked_story_id ? (
             <Link
  href="/admin/pr"
  className="text-sm font-bold text-black/45 transition hover:text-black"
>
  ← PR Inbox
</Link>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}

function Badge({
  children,
  dark = false,
}: {
  children:
    React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={
        dark
          ? "rounded-full bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-white"
          : "rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-black/55"
      }
    >
      {children}
    </span>
  );
}

function Info({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-[0.12em] text-black/35">
        {label}
      </div>

      {href ? (
        <a
          href={href}
          className="mt-1 block break-words font-bold text-red-600 hover:underline"
        >
          {value}
        </a>
      ) : (
        <div className="mt-1 break-words font-bold text-black">
          {value}
        </div>
      )}
    </div>
  );
}

function DarkInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-[0.12em] text-white/35">
        {label}
      </div>

      <div className="mt-1 font-bold capitalize text-white">
        {value.replaceAll(
          "_",
          " ",
        )}
      </div>
    </div>
  );
}

function ExternalLink({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-neutral-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.12em] text-black/40">
        {label}
      </div>

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block break-all font-bold text-red-600 hover:underline"
      >
        {href}
      </a>
    </div>
  );
}