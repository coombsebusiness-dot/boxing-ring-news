import SectionBuilder, {
  type StorySection,
} from "@/components/admin/stories/SectionBuilder";

import SourceBuilder, {
  type StorySource,
} from "@/components/admin/stories/SourceBuilder";

type Desk = {
  id: string;
  name: string;
};

type StoryEditorStory = {
  id?: string;
  title?: string | null;
  slug?: string | null;
  desk_id?: string | null;
  story_type?: string | null;
  status?: string | null;
  excerpt?: string | null;
  intro?: string | null;
  author_name?: string | null;

  sections?: StorySection[] | null;
  sources?: StorySource[] | null;
  hero_image_url?: string | null;
  hero_image_alt?: string | null;
  hero_image_credit?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  is_breaking?: boolean | null;
  is_featured?: boolean | null;
  is_exclusive?: boolean | null;
  is_trending?: boolean | null;
  is_hero?: boolean | null;
};

type StoryEditorProps = {
  desks: Desk[];
  story?: StoryEditorStory;
  action: (
    formData: FormData,
  ) => void | Promise<void>;
  submitLabel?: string;
};

const storyTypes = [
  ["news", "News"],
  ["breaking", "Breaking"],
  ["developing", "Developing"],
  ["exclusive", "Exclusive"],
  ["feature", "Feature"],
  ["interview", "Interview"],
  ["review", "Review"],
  ["analysis", "Analysis"],
  ["opinion", "Opinion"],
];

export default function StoryEditor({
  desks,
  story,
  action,
  submitLabel = "Save Story",
}: StoryEditorProps) {
  return (
    <form
      action={action}
      className="space-y-8"
    >
      <section className="rounded-2xl border border-black/10 bg-white p-7">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
          Story
        </div>

        <h2 className="mt-2 text-2xl font-black text-black">
          Core information
        </h2>

        <div className="mt-7 space-y-6">
          <Field label="Headline">
            <input
              name="title"
              required
              defaultValue={
                story?.title ?? ""
              }
              placeholder="Enter story headline"
              className="editor-input"
            />
          </Field>

          <Field label="Slug">
            <input
              name="slug"
              defaultValue={
                story?.slug ?? ""
              }
              placeholder="Leave blank to generate from headline"
              className="editor-input"
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Desk">
              <select
                name="desk_id"
                className="editor-input"
                defaultValue={
                  story?.desk_id ??
                  ""
                }
              >
                <option value="">
                  Select desk
                </option>

                {desks.map((desk) => (
                  <option
                    key={desk.id}
                    value={desk.id}
                  >
                    {desk.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Story Type">
              <select
                name="story_type"
                className="editor-input"
                defaultValue={
                  story
                    ?.story_type ??
                  "news"
                }
              >
                {storyTypes.map(
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

            <Field label="Status">
              <select
                name="status"
                className="editor-input"
                defaultValue={
                  story?.status ??
                  "draft"
                }
              >
                <option value="draft">
                  Draft
                </option>

                <option value="review">
                  Review
                </option>

                <option value="published">
                  Published
                </option>
              </select>
            </Field>
          </div>

          <Field label="Author">
            <input
              name="author_name"
              defaultValue={
                story?.author_name ??
                "Lee Coombs"
              }
              placeholder="Writer name"
              className="editor-input"
            />
          </Field>

          <Field label="Excerpt">
            <textarea
              name="excerpt"
              rows={3}
              defaultValue={
                story?.excerpt ?? ""
              }
              placeholder="Short homepage and social summary"
              className="editor-input resize-y"
            />
          </Field>

          <Field label="Introduction">
            <textarea
              name="intro"
              rows={7}
              defaultValue={
                story?.intro ?? ""
              }
              placeholder="Opening paragraphs..."
              className="editor-input resize-y"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-7">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
          Article
        </div>

        <h2 className="mt-2 text-2xl font-black text-black">
          Story sections
        </h2>

        <p className="mt-2 text-sm text-black/50">
          Build the article using eyebrow,
          headline and rich body sections.
        </p>

        <div className="mt-7">
          <SectionBuilder
            initialSections={
              story?.sections ?? []
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-7">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
          Research
        </div>

        <h2 className="mt-2 text-2xl font-black text-black">
          Sources
        </h2>

        <p className="mt-2 text-sm text-black/50">
          Add the publications or original sources used to report this story.
        </p>

        <div className="mt-7">
          <SourceBuilder
            initialSources={
              story?.sources ?? []
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-7">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
          Presentation
        </div>

        <h2 className="mt-2 text-2xl font-black text-black">
          Homepage treatment
        </h2>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Flag
            name="is_breaking"
            label="Breaking"
            defaultChecked={
              story?.is_breaking ??
              false
            }
          />

          <Flag
            name="is_featured"
            label="Featured"
            defaultChecked={
              story?.is_featured ??
              false
            }
          />

          <Flag
            name="is_exclusive"
            label="Exclusive"
            defaultChecked={
              story?.is_exclusive ??
              false
            }
          />

          <Flag
            name="is_trending"
            label="Trending"
            defaultChecked={
              story?.is_trending ??
              false
            }
          />

          <Flag
            name="is_hero"
            label="Homepage Hero"
            defaultChecked={
              story?.is_hero ??
              false
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-7">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
          Image
        </div>

        <h2 className="mt-2 text-2xl font-black text-black">
          Hero image
        </h2>

        {story?.hero_image_url ? (
          <div className="mt-7 overflow-hidden rounded-xl border border-black/10 bg-neutral-100">
            <img
              src={
                story.hero_image_url
              }
              alt={
                story.hero_image_alt ??
                ""
              }
              className="max-h-[420px] w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mt-7 space-y-5">
          <Field label="Upload Hero Image">
            <input
              name="hero_image_file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="editor-input cursor-pointer"
            />
          </Field>

          <Field label="Alt Text">
            <input
              name="hero_image_alt"
              defaultValue={
                story
                  ?.hero_image_alt ??
                ""
              }
              className="editor-input"
            />
          </Field>

          <Field label="Image Credit">
            <input
              name="hero_image_credit"
              defaultValue={
                story
                  ?.hero_image_credit ??
                ""
              }
              className="editor-input"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-7">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
          Search
        </div>

        <h2 className="mt-2 text-2xl font-black text-black">
          SEO
        </h2>

        <div className="mt-7 space-y-5">
          <Field label="SEO Title">
            <input
              name="seo_title"
              maxLength={70}
              defaultValue={
                story?.seo_title ??
                ""
              }
              className="editor-input"
            />
          </Field>

          <Field label="Meta Description">
            <textarea
              name="meta_description"
              rows={4}
              maxLength={170}
              defaultValue={
                story
                  ?.meta_description ??
                ""
              }
              className="editor-input resize-y"
            />
          </Field>
        </div>
      </section>

      <div className="sticky bottom-5 flex justify-end rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xl backdrop-blur">
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-black/45">
        {label}
      </span>

      {children}
    </label>
  );
}

function Flag({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={
          defaultChecked
        }
        className="h-4 w-4 accent-red-600"
      />

      <span className="text-sm font-bold text-black">
        {label}
      </span>
    </label>
  );
}
