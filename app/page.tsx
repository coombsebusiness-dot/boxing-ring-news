import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import AudioBadge from "@/components/stories/AudioBadge";
import NetworkPromo from "@/components/network/NetworkPromo";
import SiteFooter from "@/components/site/SiteFooter";
import { supabase } from "@/lib/supabase/public";

export const revalidate = 60;

type Desk = {
  name: string;
  slug: string;
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
  updated_at: string | null;
  is_breaking: boolean;
  is_featured: boolean;
  is_exclusive: boolean;
  is_trending: boolean;
  is_hero: boolean;

  audio_url: string | null;
  desks: Desk | Desk[] | null;
};

function getDesk(
  story: Story,
): Desk | null {
  if (!story.desks) {
    return null;
  }

  if (Array.isArray(story.desks)) {
    return story.desks[0] ?? null;
  }

  return story.desks;
}

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
        className={`bg-neutral-800 ${className}`}
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

export default async function HomePage() {
  const [
    storiesResult,
    desksResult,
  ] = await Promise.all([
    supabase
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
        updated_at,
        is_breaking,
        is_featured,
        is_exclusive,
        is_trending,
        is_hero,
        audio_url,
        desks (
          name,
          slug
        )
      `)
      .in("status", [
        "published",
        "updated",
      ])
      .order(
        "published_at",
        {
          ascending: false,
        },
      )
      .limit(30),

    supabase
      .from("desks")
      .select(`
        id,
        name,
        slug,
        description
      `)
      .eq(
        "is_active",
        true,
      )
      .order(
        "sort_order",
      ),
  ]);

  const stories =
    (storiesResult.data ??
      []) as Story[];

  const desks =
    desksResult.data ?? [];

  const hero =
    stories.find(
      (story) =>
        story.is_hero,
    ) ??
    stories[0] ??
    null;

  const heroSide =
    stories
      .filter(
        (story) =>
          story.id !==
          hero?.id,
      )
      .slice(0, 3);

  const trending =
    stories
      .filter(
        (story) =>
          story.is_trending,
      )
      .slice(0, 5);

  const trendingStories =
    trending.length
      ? trending
      : stories.slice(0, 5);

  const featured =
  stories
    .filter(
      (story) =>
        story.is_featured,
    )
    .sort(
      (a, b) =>
        new Date(
          b.updated_at ||
            b.published_at ||
            0,
        ).getTime() -
        new Date(
          a.updated_at ||
            a.published_at ||
            0,
        ).getTime(),
    )
    .slice(0, 3);

  const featuredFallback =
    stories.filter(
      (story) =>
        !featured.some(
          (featuredStory) =>
            featuredStory.id ===
            story.id,
        ),
    );

  const featuredStories = [
    ...featured,
    ...featuredFallback,
  ].slice(0, 3);

  const exclusives =
    stories
      .filter(
        (story) =>
          story.is_exclusive,
      )
      .slice(0, 12);

  const latest =
    stories.slice(0, 9);

  return (
    <>
      <SiteHeader />

      <main className="bg-white text-black">
        <div className="mx-auto max-w-[1500px] px-4">
          {hero ? (
            <section className="grid gap-2 pt-4 lg:grid-cols-[1.9fr_1fr]">
              <a
                href={`/${hero.slug}`}
                className="group relative min-h-[520px] overflow-hidden bg-black"
              >
                <StoryImage
                  story={hero}
                  className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.02]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  {getDesk(
                    hero,
                  ) ? (
                    <span className="inline-block bg-red-600 px-2 py-1 text-xs font-black uppercase text-white">
                      {
                        getDesk(
                          hero,
                        )!.name
                      }
                    </span>
                  ) : null}

                  {hero.audio_url ? (
                  <div className="mb-3">
                    <AudioBadge variant="dark" />
                  </div>
                ) : null}

                <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
                    {hero.title}
                  </h1>

                  {hero.excerpt ? (
                    <p className="mt-4 max-w-4xl text-lg leading-7 text-white/85 md:text-xl">
                      {
                        hero.excerpt
                      }
                    </p>
                  ) : null}

                  <div className="mt-6 flex gap-4 text-xs font-bold uppercase tracking-wide text-white/70">
                    <span>
                      Informant Wire
                    </span>

                    <span>
                      {
                        formatDate(
                          hero.published_at,
                        )
                      }
                    </span>
                  </div>
                </div>
              </a>

              <div className="grid gap-2">
                {heroSide.map(
                  (story) => (
                    <a
                      key={
                        story.id
                      }
                      href={`/${story.slug}`}
                      className="group relative min-h-[170px] overflow-hidden bg-black"
                    >
                      <StoryImage
                        story={
                          story
                        }
                        className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.03]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                      <div className="absolute bottom-0 p-5">
                        {getDesk(
                          story,
                        ) ? (
                          <span className="inline-block bg-red-600 px-2 py-1 text-[10px] font-black uppercase text-white">
                            {
                              getDesk(
                                story,
                              )!.name
                            }
                          </span>
                        ) : null}

                        <h2 className="mt-2 text-xl font-black leading-tight text-white">
                          {
                            story.title
                          }
                        </h2>

                        <div className="mt-2 text-[11px] font-bold uppercase text-white/65">
                          {
                            formatDate(
                              story.published_at,
                            )
                          }
                        </div>
                      </div>
                    </a>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {trendingStories.length ? (
            <section className="mt-4 border border-black/10 bg-white">
              <div className="grid lg:grid-cols-[220px_1fr]">
                <div className="flex items-center gap-3 border-b border-black/10 px-5 py-5 lg:border-b-0 lg:border-r">
                  <div className="text-3xl">
                    🔥
                  </div>

                  <div className="text-xl font-black uppercase leading-none">
                    Trending
                    <br />
                    Now
                  </div>
                </div>

                <div className="grid divide-y divide-black/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
                  {trendingStories.map(
                    (
                      story,
                      index,
                    ) => (
                      <a
                        key={
                          story.id
                        }
                        href={`/${story.slug}`}
                        className="flex gap-3 px-5 py-5 transition hover:bg-neutral-50"
                      >
                        <span className="text-xl font-black text-red-600">
                          {index +
                            1}
                        </span>

                        <span className="text-sm font-medium leading-tight text-black">
                          {
                            story.title
                          }
                        </span>
                      </a>
                    ),
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-5 border-l-4 border-red-600 bg-[#0d1215] px-5 py-4 text-white md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                Informant Wire Audio
              </div>

              <p className="mt-1 text-sm leading-6 text-white/70">
                Selected stories are now available to listen to. Look for the Audio badge across Informant Wire.
              </p>
            </div>

            <div className="mt-3 shrink-0 md:mt-0">
              <AudioBadge variant="dark" />
            </div>
          </section>

          <section className="grid gap-8 py-8 lg:grid-cols-[1fr_1.2fr_0.8fr]">
            <div>
              <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
                <h2 className="text-2xl font-black uppercase">
                  Latest News
                </h2>

                <span className="text-sm font-bold">
                  View all →
                </span>
              </div>

              <div className="divide-y divide-black/10">
                {latest.map(
                  (story) => (
                    <a
                      key={
                        story.id
                      }
                      href={`/${story.slug}`}
                      className="grid grid-cols-[120px_1fr] gap-4 py-4"
                    >
                      <StoryImage
                        story={
                          story
                        }
                        className="h-[90px] w-full"
                      />

                      <div>
                        {getDesk(
                          story,
                        ) ? (
                          <div className="text-[10px] font-black uppercase text-red-600">
                            {
                              getDesk(
                                story,
                              )!.name
                            }
                          </div>
                        ) : null}

                        {story.audio_url ? (
                          <div className="mt-2">
                            <AudioBadge />
                          </div>
                        ) : null}

                        <h3 className="mt-1 text-base font-black leading-tight">
                          {
                            story.title
                          }
                        </h3>

                        <div className="mt-2 text-[10px] font-bold uppercase text-black/40">
                          {
                            formatDate(
                              story.published_at,
                            )
                          }
                        </div>
                      </div>
                    </a>
                  ),
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 border-b-2 border-black pb-3">
                <h2 className="text-2xl font-black uppercase">
                  Featured Stories
                </h2>
              </div>

              <div className="space-y-6">
                {featuredStories.map(
                  (story) => (
                    <a
                      key={
                        story.id
                      }
                      href={`/${story.slug}`}
                      className="block"
                    >
                      <div className="relative overflow-hidden bg-black">
                        <StoryImage
                          story={
                            story
                          }
                          className="h-[300px] w-full"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                        <div className="absolute bottom-0 p-5">
                          {getDesk(
                            story,
                          ) ? (
                            <span className="bg-red-600 px-2 py-1 text-[10px] font-black uppercase text-white">
                              {
                                getDesk(
                                  story,
                                )!.name
                              }
                            </span>
                          ) : null}

                          {story.audio_url ? (
                            <div className="mt-2">
                              <AudioBadge variant="dark" />
                            </div>
                          ) : null}

                          <h3 className="mt-2 text-2xl font-black leading-tight text-white">
                            {
                              story.title
                            }
                          </h3>
                        </div>
                      </div>

                      {story.excerpt ? (
                        <p className="mt-3 text-sm leading-6 text-black/60">
                          {
                            story.excerpt
                          }
                        </p>
                      ) : null}
                    </a>
                  ),
                )}
              </div>
            </div>

            <div>
              <div className="bg-[#0d1215] p-6 text-white">
                <h2 className="text-2xl font-black uppercase leading-tight">
                  Get the latest
                  <br />
                  entertainment news
                </h2>

                <p className="mt-4 text-sm leading-6 text-white/70">
                  Breaking stories,
                  exclusive scoops and
                  entertainment updates,
                  straight to your inbox.
                </p>

                <div className="mt-5 flex">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="min-w-0 flex-1 bg-white px-4 py-3 text-sm text-black outline-none"
                  />

                  <button className="bg-red-600 px-4 py-3 text-xs font-black uppercase">
                    Subscribe
                  </button>
                </div>

                <p className="mt-3 text-[10px] text-white/45">
                  No spam.
                  Unsubscribe anytime.
                </p>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
                  <h2 className="text-2xl font-black uppercase">
                    Exclusives
                  </h2>

                  <Link
                    href="/exclusives"
                    className="text-sm font-bold transition hover:text-red-600"
                  >
                    View all →
                  </Link>
                </div>

                <div className="divide-y divide-black/10">
                  {exclusives.length === 0 ? (
                    <div className="py-8">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-red-600">
                        Original reporting
                      </div>

                      <p className="mt-3 text-sm leading-6 text-black/50">
                        Informant Wire exclusives, interviews and original reporting will appear here.
                      </p>
                    </div>
                  ) : null}

                  {exclusives.map(
                    (story) => (
                      <a
                        key={
                          story.id
                        }
                        href={`/${story.slug}`}
                        className="grid grid-cols-[120px_1fr] gap-4 py-4"
                      >
                        <StoryImage
                          story={
                            story
                          }
                          className="h-[90px] w-full"
                        />

                        <div>
                          {getDesk(
                            story,
                          ) ? (
                            <div className="text-[10px] font-black uppercase text-red-600">
                              {
                                getDesk(
                                  story,
                                )!.name
                              }
                            </div>
                          ) : null}

                          <h3 className="mt-1 text-sm font-black leading-tight">
                            {
                              story.title
                            }
                          </h3>

                          <div className="mt-2 text-[10px] font-bold uppercase text-black/40">
                            {
                              formatDate(
                                story.published_at,
                              )
                            }
                          </div>
                        </div>
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>

          <NetworkPromo />

          <section className="border-t border-black/10 pb-8 pt-5">
            <h2 className="mb-4 text-2xl font-black uppercase">
              Explore by Topic
            </h2>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
              {desks.map(
                (desk) => (
                  <a
                    key={
                      desk.id
                    }
                    href={`/${desk.slug}`}
                    className="relative flex min-h-[120px] items-end overflow-hidden bg-[#11171a] p-4 text-white"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-neutral-800" />

                    <span className="relative text-sm font-black uppercase">
                      {
                        desk.name
                      }
                    </span>
                  </a>
                ),
              )}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
