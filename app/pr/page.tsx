import type {
  Metadata,
} from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

import {
  submitPR,
} from "./actions";

export const metadata: Metadata = {
  title: "PR & Story Submissions",
  description:
    "Send press releases, story pitches, interview opportunities, screeners and entertainment industry news to Informant Wire.",
};

type PRPageProps = {
  searchParams?: Promise<{
    submitted?: string;
    error?: string;
  }>;
};

const submissionTypes = [
  [
    "press_release",
    "Press Release",
  ],
  [
    "news_tip",
    "News Tip",
  ],
  [
    "interview_offer",
    "Interview Offer",
  ],
  [
    "review_request",
    "Review Request",
  ],
  [
    "screening_invite",
    "Screening Invite",
  ],
  [
    "event_invite",
    "Event Invite",
  ],
  [
    "asset_delivery",
    "Asset Delivery",
  ],
  [
    "correction",
    "Correction",
  ],
  [
    "other",
    "Other",
  ],
] as const;

const desks = [
  ["film", "Film"],
  [
    "television",
    "Television",
  ],
  [
    "streaming",
    "Streaming",
  ],
  ["music", "Music"],
  ["gaming", "Gaming"],
  [
    "celebrity",
    "Celebrity",
  ],
  ["awards", "Awards"],
  [
    "industry",
    "Industry",
  ],
  ["culture", "Culture"],
] as const;

export default async function PRPage({
  searchParams,
}: PRPageProps) {
  const params =
    searchParams
      ? await searchParams
      : {};

  const submitted =
    params.submitted === "1";

  const hasError =
    Boolean(params.error);

  return (
    <LegalPage
      eyebrow="PR & Submissions"
      title="Send Us Your Story"
      intro="Informant Wire welcomes press releases, interview opportunities, screening information, announcements and story pitches from across the entertainment industry."
    >
      {submitted ? (
        <div className="rounded-2xl border border-green-600/20 bg-green-50 p-6">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
            Submission received
          </div>

          <h2 className="mt-2 text-2xl font-black text-black">
            Thank you — it is now with our newsroom.
          </h2>

          <p className="mt-3 leading-7 text-black/60">
            Your submission has been added to the Informant Wire editorial inbox for review.
          </p>
        </div>
      ) : null}

      {hasError ? (
        <div className="rounded-2xl border border-red-600/20 bg-red-50 p-6">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-red-600">
            Submission problem
          </div>

          <p className="mt-2 leading-7 text-black/65">
            We could not submit your story. Please check the information below and try again, or email us directly at{" "}
            <a
              href="mailto:editor@informantwire.com"
              className="font-bold text-red-600 hover:underline"
            >
              editor@informantwire.com
            </a>
            .
          </p>
        </div>
      ) : null}

      <LegalSection title="What we cover">
        <p>
          Informant Wire covers film, television, streaming, music,
          gaming, celebrity, awards, industry and entertainment culture.
        </p>

        <p>
          We welcome both major industry announcements and strong
          independent stories with genuine editorial value.
        </p>
      </LegalSection>

      <section>
        <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
          Newsroom intake
        </div>

        <h2 className="mt-2 text-3xl font-black tracking-tight text-black">
          Submit a Story
        </h2>

        <p className="mt-3 max-w-2xl leading-7 text-black/60">
          Send your story directly to the Informant Wire newsroom. The more useful detail you provide, the easier it is for us to assess quickly.
        </p>

        <form
          action={submitPR}
          className="mt-8 space-y-7 rounded-2xl border border-black/10 bg-neutral-50 p-6 sm:p-8"
        >
          <div
            aria-hidden="true"
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          >
            <label>
              Website
              <input
                type="text"
                name="contact_website"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Your name"
              required
            >
              <input
                type="text"
                name="sender_name"
                required
                maxLength={150}
                className="editor-input"
                placeholder="Your name"
              />
            </Field>

            <Field
              label="Email address"
              required
            >
              <input
                type="email"
                name="sender_email"
                required
                maxLength={254}
                className="editor-input"
                placeholder="you@company.com"
              />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Company / organisation">
              <input
                type="text"
                name="company_name"
                className="editor-input"
                placeholder="Studio, agency, label, production company..."
              />
            </Field>

            <Field label="Your role">
              <input
                type="text"
                name="sender_role"
                className="editor-input"
                placeholder="Publicist, producer, filmmaker..."
              />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Submission type"
              required
            >
              <select
                name="submission_type"
                required
                defaultValue="press_release"
                className="editor-input"
              >
                {submissionTypes.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field label="Relevant desk">
              <select
                name="desk"
                defaultValue=""
                className="editor-input"
              >
                <option value="">
                  General / not sure
                </option>

                {desks.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>

          <Field
            label="Story subject"
            required
          >
            <input
              type="text"
              name="subject"
              required
              minLength={5}
              maxLength={250}
              className="editor-input"
              placeholder="Give us a clear headline or subject"
            />
          </Field>

          <Field
            label="Pitch / press release"
            required
          >
            <textarea
              name="message"
              required
              minLength={20}
              maxLength={30000}
              rows={12}
              className="editor-input resize-y"
              placeholder="Paste your press release, pitch or story details here..."
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Official website">
              <input
                type="url"
                name="website_url"
                className="editor-input"
                placeholder="https://..."
              />
            </Field>

            <Field label="Press release / press kit URL">
              <input
                type="url"
                name="press_release_url"
                className="editor-input"
                placeholder="https://..."
              />
            </Field>
          </div>

          <div className="border-t border-black/10 pt-6">
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-black"
            >
              Send to Informant Wire
            </button>

            <p className="mt-4 text-sm leading-6 text-black/45">
              Submissions are reviewed by the newsroom and do not guarantee publication.
            </p>
          </div>
        </form>
      </section>

      <LegalSection title="Prefer email?">
        <p>
          You can also send press releases, pitches, interview requests and editorial enquiries directly to:
        </p>

        <p className="text-xl font-black text-black">
          <a
            href="mailto:editor@informantwire.com"
            className="text-red-600 hover:underline"
          >
            editor@informantwire.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="What helps us review a pitch">
        <p>
          Include relevant names, dates, release information, official links and any supporting press material available.
        </p>

        <p>
          If material is under embargo, make the embargo date and time clear at the beginning of your submission.
        </p>
      </LegalSection>

      <LegalSection title="Independent creators">
        <p>
          Independent filmmakers, producers, musicians, developers and creators are welcome to submit directly. A large publicity campaign is not required.
        </p>
      </LegalSection>

      <LegalSection title="Editorial decisions">
        <p>
          Coverage is selected according to editorial relevance, newsworthiness and the information available to our newsroom.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-black/45">
        {label}
        {required ? (
          <span className="text-red-600">
            {" "}*
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}