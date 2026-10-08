import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { supabase } from "@/lib/supabase/public";

export const revalidate = 60;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://boxingringnews.com";

const youtubeChannel =
  "https://www.youtube.com/@boxing-ring-news";

export const metadata: Metadata = {
  title: "Boxing Videos & YouTube Shorts",
  description:
    "Watch the latest Boxing Ring News videos and YouTube Shorts covering breaking boxing news, fighters, fights and the biggest stories from the sport.",
  alternates: {
    canonical: `${siteUrl}/videos`,
  },
  openGraph: {
    title:
      "Boxing Videos & YouTube Shorts | Boxing Ring News",
    description:
      "Breaking boxing news, reactions and the biggest stories in boxing — in under 60 seconds.",
    url: `${siteUrl}/videos`,
    type: "website",
  },
};

type VideoStory = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  youtube_url: string | null;
  published_at: string | null;
};

function getYouTubeId(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.hostname === "youtu.be" ||
      url.hostname === "www.youtu.be"
    ) {
      return (
        url.pathname
          .split("/")
          .filter(Boolean)[0] ??
        null
      );
    }

    if (
      url.hostname.includes(
        "youtube.com",
      )
    ) {
      if (
        url.pathname.startsWith(
          "/shorts/",
        ) ||
        url.pathname.startsWith(
          "/embed/",
        )
      ) {
        return (
          url.pathname
            .split("/")
            .filter(Boolean)[1] ??
          null
        );
      }

      return (
        url.searchParams.get("v") ??
        null
      );
    }
  } catch {
    return null;
  }

  return null;
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

function getThumbnail(
  story: VideoStory,
) {
  const youtubeId =
    getYouTubeId(
      story.youtube_url,
    );

  if (youtubeId) {
    return `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
  }

  return story.hero_image_url;
}

export default async function VideosPage() {
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
      youtube_url,
      published_at
    `)
    .in("status", [
      "published",
      "updated",
    ])
    .not(
      "youtube_url",
      "is",
      null,
    )
    .order(
      "published_at",
      {
        ascending: false,
      },
    )
    .limit(24);

  if (error) {
    console.error(
      "Failed to load videos:",
      error,
    );
  }

  const videos =
    (data ?? []).filter(
      (story) =>
        Boolean(
          story.youtube_url?.trim(),
        ),
    ) as VideoStory[];

  const featured =
    videos[0] ?? null;

  const remaining =
    videos.slice(1);

  const collectionSchema = {
    "@context":
      "https://schema.org",
    "@type":
      "CollectionPage",
    "@id":
      `${siteUrl}/videos#webpage`,
    url:
      `${siteUrl}/videos`,
    name:
      "Boxing Videos & YouTube Shorts",
    description:
      "Breaking boxing news, reactions and the biggest stories in boxing from Boxing Ring News.",
    isPartOf: {
      "@id":
        `${siteUrl}/#website`,
    },
    about: {
      "@type": "Thing",
      name: "Boxing",
    },
  };

  const itemListSchema = {
    "@context":
      "https://schema.org",
    "@type":
      "ItemList",
    name:
      "Latest Boxing Ring News Videos",
    itemListElement:
      videos.map(
        (video, index) => ({
          "@type":
            "ListItem",
          position:
            index + 1,
          url:
            `${siteUrl}/${video.slug}`,
          name:
            video.title,
        }),
      ),
  };

  const schemaJson =
    JSON.stringify([
      collectionSchema,
      itemListSchema,
    ]).replace(
      /</g,
      "\\u003c",
    );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            schemaJson,
        }}
      />

      <SiteHeader />

      <main className="min-h-screen bg-white text-black">
        <section className="border-b border-white/10 bg-[#0d1215] text-white">
          <div className="mx-auto max-w-[1500px] px-4 py-12 md:py-16">
            <div className="max-w-4xl">
              <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-red-500">
                Boxing Ring News Video
              </div>

              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] md:text-6xl lg:text-7xl">
                Boxing News.
                <br />
                <span className="text-red-600">
                  In The Ring.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Breaking boxing news,
                reactions and the biggest
                stories from the sport —
                delivered through Boxing
                Ring News videos and
                YouTube Shorts.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={youtubeChannel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700"
                >
                  Watch on YouTube →
                </a>

                <span className="inline-flex items-center border border-white/20 px-5 py-3 text-sm font-bold text-white/70">
                  @boxing-ring-news
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1500px] px-4">
          <section className="py-10 md:py-14">
            <div className="mb-7 flex items-end justify-between gap-5 border-b-2 border-black pb-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                  From The Gym To The Ring
                </div>

                <h2 className="mt-1 text-3xl font-black uppercase tracking-tight">
                  Latest Videos
                </h2>
              </div>

              <a
                href={youtubeChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-sm font-black uppercase transition hover:text-red-600 sm:block"
              >
                YouTube Channel →
              </a>
            </div>

            {featured ? (
              <article className="grid overflow-hidden bg-[#0d1215] text-white lg:grid-cols-[0.72fr_1.28fr]">
                <a
                  href={
                    featured.youtube_url ??
                    youtubeChannel
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative mx-auto block w-full max-w-[500px] overflow-hidden bg-black lg:max-w-none"
                >
                  <div className="aspect-[9/16] max-h-[720px]">
                    {getThumbnail(
                      featured,
                    ) ? (
                      <img
                        src={
                          getThumbnail(
                            featured,
                          )!
                        }
                        alt={
                          featured
                            .hero_image_alt ||
                          featured.title
                        }
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full bg-neutral-900" />
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/25" />

                  <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-3xl shadow-2xl transition group-hover:scale-110">
                    ▶
                  </div>

                  <div className="absolute left-4 top-4 bg-red-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em]">
                    Latest Short
                  </div>
                </a>

                <div className="flex flex-col justify-center p-7 md:p-10 lg:p-14">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                    Boxing Ring News
                  </div>

                  <h2 className="mt-4 max-w-3xl text-3xl font-black leading-[1.02] tracking-[-0.035em] md:text-5xl">
                    {featured.title}
                  </h2>

                  {featured.excerpt ? (
                    <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
                      {featured.excerpt}
                    </p>
                  ) : null}

                  <div className="mt-5 text-xs font-bold uppercase tracking-wide text-white/40">
                    {formatDate(
                      featured.published_at,
                    )}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href={
                        featured.youtube_url ??
                        youtubeChannel
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700"
                    >
                      Watch Short →
                    </a>

                    <a
                      href={`/${featured.slug}`}
                      className="border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:border-white hover:bg-white hover:text-black"
                    >
                      Read Full Story →
                    </a>
                  </div>
                </div>
              </article>
            ) : (
              <div className="border border-black/10 bg-neutral-50 px-6 py-16 text-center md:px-10 md:py-24">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white">
                  ▶
                </div>

                <h3 className="mt-6 text-2xl font-black uppercase">
                  Boxing Ring News Shorts
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/55">
                  Our latest Shorts will
                  appear here automatically
                  when they are connected
                  to Boxing Ring News
                  stories.
                </p>
              </div>
            )}

            {remaining.length > 0 ? (
              <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {remaining.map(
                  (video) => (
                    <article
                      key={video.id}
                      className="group"
                    >
                      <a
                        href={
                          video.youtube_url ??
                          youtubeChannel
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block overflow-hidden bg-black"
                      >
                        <div className="aspect-[9/16]">
                          {getThumbnail(
                            video,
                          ) ? (
                            <img
                              src={
                                getThumbnail(
                                  video,
                                )!
                              }
                              alt={
                                video
                                  .hero_image_alt ||
                                video.title
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="h-full w-full bg-neutral-900" />
                          )}
                        </div>

                        <div className="absolute inset-0 bg-black/5 transition group-hover:bg-black/25" />

                        <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-xl text-white shadow-xl transition group-hover:scale-110">
                          ▶
                        </div>
                      </a>

                      <div className="pt-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-red-600">
                          Boxing Short
                        </div>

                        <h3 className="mt-2 text-xl font-black leading-tight">
                          {video.title}
                        </h3>

                        <div className="mt-3 text-[10px] font-bold uppercase text-black/40">
                          {formatDate(
                            video.published_at,
                          )}
                        </div>

                        <div className="mt-4 flex gap-4 text-xs font-black uppercase">
                          <a
                            href={
                              video.youtube_url ??
                              youtubeChannel
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-black"
                          >
                            Watch →
                          </a>

                          <a
                            href={`/${video.slug}`}
                            className="hover:text-red-600"
                          >
                            Read Story →
                          </a>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : null}
          </section>

          <section className="mb-12 grid gap-3 border-t border-black/10 pt-8 md:grid-cols-3">
            <div className="bg-[#0d1215] p-6 text-white">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-red-500">
                Breaking News
              </div>
              <h3 className="mt-3 text-xl font-black uppercase">
                The biggest stories fast
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Quick video coverage when
                major boxing news breaks.
              </p>
            </div>

            <div className="bg-[#0d1215] p-6 text-white">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-red-500">
                Fight Talk
              </div>
              <h3 className="mt-3 text-xl font-black uppercase">
                Fighters & matchups
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/60">
                The fights, rivalries and
                talking points boxing fans
                are discussing.
              </p>
            </div>

            <div className="bg-[#0d1215] p-6 text-white">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-red-500">
                Full Coverage
              </div>
              <h3 className="mt-3 text-xl font-black uppercase">
                Watch it. Then read it.
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Videos connected directly
                to the full stories on
                Boxing Ring News.
              </p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
