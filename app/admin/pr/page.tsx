import {
  redirect,
} from "next/navigation";

import AdminHeader from "@/components/admin/AdminHeader";
import {
  createClient,
} from "@/lib/supabase/server";

type PRSubmission = {
  id: string;
  sender_name: string;
  sender_email: string;
  company_name: string | null;
  subject: string;
  submission_type: string;
  status: string;
  priority: string;
  submitted_at: string;
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
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/London",
    },
  ).format(
    new Date(value),
  );
}

function getDesk(
  submission: PRSubmission,
) {
  if (
    Array.isArray(
      submission.desks,
    )
  ) {
    return (
      submission.desks[0] ??
      null
    );
  }

  return submission.desks;
}

export default async function PRInboxPage() {
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
    data: newsroomUser,
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

  if (!newsroomUser) {
    redirect("/");
  }

  const {
    data,
    error,
  } = await supabase
    .from("pr_submissions")
    .select(`
      id,
      sender_name,
      sender_email,
      company_name,
      subject,
      submission_type,
      status,
      priority,
      submitted_at,
      desks (
        name,
        slug
      )
    `)
    .order(
      "submitted_at",
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

  const submissions =
    (data ?? []) as PRSubmission[];

  const newCount =
    submissions.filter(
      (submission) =>
        submission.status ===
        "new",
    ).length;

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-5 border-b border-black/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
              Newsroom Intake
            </div>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-black">
              PR Inbox
            </h1>

            <p className="mt-3 max-w-2xl text-black/55">
              Review press releases,
              fight announcements,
              news tips, interview
              offers, media invitations
              and other submissions sent
              to Boxing Ring News.
            </p>
          </div>

          <div className="rounded-xl bg-black px-5 py-4 text-white">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
              New
            </div>

            <div className="mt-1 text-3xl font-black">
              {newCount}
            </div>
          </div>
        </div>

        {submissions.length ===
        0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center">
            <div className="text-xl font-black text-black">
              No PR submissions yet
            </div>

            <p className="mt-2 text-sm text-black/45">
              New submissions from
              the public PR form will
              appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-black/10 bg-neutral-50 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-black/40 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]">
              <div>Submission</div>

              <div className="hidden md:block">
                Type
              </div>

              <div className="hidden md:block">
                Desk
              </div>

              <div className="hidden md:block">
                Received
              </div>

              <div>Status</div>
            </div>

            {submissions.map(
              (submission) => {
                const desk =
                  getDesk(
                    submission,
                  );

                return (
                  <a
                    key={
                      submission.id
                    }
                    href={`/admin/pr/${submission.id}`}
                    className="grid grid-cols-[1fr_auto] gap-4 border-b border-black/10 px-6 py-5 transition last:border-b-0 hover:bg-neutral-50 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="font-black text-black">
                        {
                          submission.subject
                        }
                      </div>

                      <div className="mt-1 text-sm text-black/45">
                        {
                          submission.sender_name
                        }
                        {submission.company_name
                          ? ` · ${submission.company_name}`
                          : ""}
                      </div>
                    </div>

                    <div className="hidden text-sm font-semibold text-black/60 md:block">
                      {typeLabels[
                        submission
                          .submission_type
                      ] ??
                        submission.submission_type}
                    </div>

                    <div className="hidden text-sm text-black/55 md:block">
                      {desk?.name ??
                        "General"}
                    </div>

                    <div className="hidden text-sm text-black/45 md:block">
                      {formatDate(
                        submission.submitted_at,
                      )}
                    </div>

                    <div>
                      <span
                        className={
                          submission.status ===
                          "new"
                            ? "rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white"
                            : "rounded-full bg-black/5 px-3 py-1 text-xs font-black uppercase text-black/55"
                        }
                      >
                        {
                          submission.status
                        }
                      </span>
                    </div>
                  </a>
                );
              },
            )}
          </div>
        )}
      </main>
    </div>
  );
}
