import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

import AudioBadge from "@/components/stories/AudioBadge";
import { supabase } from "@/lib/supabase/public";

export const metadata = {
  title: "Exclusives",
  description:
    "Original reporting, exclusive interviews, first-look stories and exclusive entertainment news from Informant Wire.",
  alternates: {
    canonical:
      "https://informantwire.com/exclusives",
  },
};

type Desk = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type Story = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  story_type: string;
  published_at: string | null;
  is_breaking: boolean;
  is_exclusive: boolean;

  audio_url: string | null;
};

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  )
    .format(new Date(value))
    .toUpperCase();
}

function StoryImage({
  story,
  className = "",
}: {
  story: Story;
  className?: string;
}) {
  if (!story.hero_image_url) {
    return (
      <div
        className={`bg-gradient-to-br from-neutral-700 to-black ${className}`}
      />
    );
  }

  return (
    <img
      src={story.hero_image_url}
      alt={
        story.hero_image_alt ||
        story.title
      }
      className={`object-cover ${className}`}
    />
  );
}

export default async function ExclusivesPage() {
  const desk: Desk = {
    id: "exclusives",
    name: "Exclusives",
    slug: "exclusives",
    description:
      "Original reporting, exclusive interviews, first-look stories and reporting from Informant Wire.",
  };

  const {
    data,
    error,
  } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      slug,
      excerpt,
      hero_image_url,
      hero_image_alt,
      story_type,
      published_at,
      is_breaking,
      is_exclusive,
      audio_url
    `)
    .eq(
      "is_exclusive",
      true,
    )
    .in(
      "status",
      [
        "published",
        "updated",
      ],
    )
    .order(
      "published_at",
      {
        ascending: false,
      },
    )
    .limit(30);

  if (error) {
    console.error(
      `Failed to load ${desk.name} stories:`,
      error,
    );
  }

  const stories =
    (data ?? []) as Story[];

  const lead =
    stories[0] ?? null;

  const secondary =
    stories.slice(1, 3);

  const latest =
    stories.slice(3);

  return (
    <>
      <SiteHeader />

      <main className="bg-white text-black">
        <div className="mx-auto max-w-[1500px] px-4">
          <header className="border-b-4 border-black py-8 md:py-10">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-red-600">
              Informant Wire
            </div>

            <h1 className="mt-2 text-5xl font-black uppercase tracking-[-0.05em] md:text-7xl">
              {desk.name}
            </h1>

            {desk.description ? (
              <p className="mt-4 max-w-3xl text-lg leading-7 text-black/55">
                {desk.description}
              </p>
            ) : null}
          </header>

          {!lead ? (
            <section className="py-24 text-center">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
                {desk.name}
              </div>

              <h2 className="mt-3 text-3xl font-black">
                Coverage is coming.
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-black/50">
                New stories published
                to this desk will appear
                here automatically.
              </p>
            </section>
          ) : (
            <>
              <section className="grid gap-2 py-5 lg:grid-cols-[1.8fr_1fr]">
                <a
                  href={`/${lead.slug}`}
                  className="group relative min-h-[500px] overflow-hidden bg-black"
                >
                  <StoryImage
                    story={lead}
                    className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.02]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    {lead.is_breaking ? (
                      <span className="inline-block bg-red-600 px-2 py-1 text-[10px] font-black uppercase text-white">
                        Breaking
                      </span>
                    ) : (
                      <span className="inline-block bg-red-600 px-2 py-1 text-[10px] font-black uppercase text-white">
                        {desk.name}
                      </span>
                    )}

                    {lead.audio_url ? (
                      <div className="mt-3">
                        <AudioBadge variant="dark" />
                      </div>
                    ) : null}

                    <h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
                      {lead.title}
                    </h2>

                    {lead.excerpt ? (
                      <p className="mt-4 max-w-3xl text-lg leading-7 text-white/80">
                        {lead.excerpt}
                      </p>
                    ) : null}

                    <div className="mt-5 text-xs font-bold uppercase tracking-wide text-white/60">
                      {formatDate(
                        lead.published_at,
                      )}
                    </div>
                  </div>
                </a>

                <div className="grid gap-2">
                  {secondary.map(
                    (story) => (
                      <a
                        key={story.id}
                        href={`/${story.slug}`}
                        className="group relative min-h-[245px] overflow-hidden bg-black"
                      >
                        <StoryImage
                          story={story}
                          className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.03]"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        <div className="absolute bottom-0 p-5">
                          <span className="bg-red-600 px-2 py-1 text-[10px] font-black uppercase text-white">
                            {story.is_exclusive
                              ? "Exclusive"
                              : desk.name}
                          </span>

                          {story.audio_url ? (
                            <div className="mt-2">
                              <AudioBadge variant="dark" />
                            </div>
                          ) : null}

                          <h3 className="mt-3 text-2xl font-black leading-tight text-white">
                            {story.title}
                          </h3>

                          <div className="mt-2 text-[10px] font-bold uppercase text-white/55">
                            {formatDate(
                              story.published_at,
                            )}
                          </div>
                        </div>
                      </a>
                    ),
                  )}
                </div>
              </section>

              {latest.length ? (
                <section className="border-t border-black/15 py-8">
                  <div className="mb-6 flex items-end justify-between border-b-2 border-black pb-3">
                    <h2 className="text-3xl font-black uppercase tracking-[-0.03em]">
                      Latest {desk.name}
                    </h2>
                  </div>

                  <div className="grid gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                    {latest.map(
                      (story) => (
                        <a
                          key={story.id}
                          href={`/${story.slug}`}
                          className="group"
                        >
                          <div className="overflow-hidden bg-neutral-200">
                            <StoryImage
                              story={story}
                              className="aspect-[16/9] w-full transition duration-500 group-hover:scale-[1.02]"
                            />
                          </div>

                          <div className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-red-600">
                            {desk.name}
                          </div>

                          {story.audio_url ? (
                            <div className="mt-2">
                              <AudioBadge />
                            </div>
                          ) : null}

                          <h3 className="mt-2 text-2xl font-black leading-[1.05] tracking-[-0.025em]">
                            {story.title}
                          </h3>

                          {story.excerpt ? (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-black/55">
                              {story.excerpt}
                            </p>
                          ) : null}

                          <div className="mt-3 text-[10px] font-bold uppercase text-black/40">
                            {formatDate(
                              story.published_at,
                            )}
                          </div>
                        </a>
                      ),
                    )}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
