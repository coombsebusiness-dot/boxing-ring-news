import type { Metadata } from "next";


import { notFound } from "next/navigation";

import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import StoryShareButtons from "@/components/stories/StoryShareButtons";
import ArticleSidebarAd from "@/components/ads/ArticleSidebarAd";
import ArticleLeaderboardAd from "@/components/ads/ArticleLeaderboardAd";
import DeskLandingPage from "@/components/desks/DeskLandingPage";
import { supabase } from "@/lib/supabase/public";
import { sanitizeStoryHtml } from "@/lib/security/sanitizeStoryHtml";



const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://boxingringnews.com";

const publisherAudioUrl =
  process.env.PUBLISHER_AUDIO_URL ??
  "https://publisheraudio.com";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type StorySection = {
  eyebrow?: string;
  headline?: string;
  body?: string;
  image_url?: string;
  image_alt?: string;
  image_credit?: string;
  youtube_url?: string;
};

type StorySource = {
  name: string;
  url: string;
};

function getYouTubeEmbedUrl(
  value?: string,
) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    const hostname =
      url.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    let videoId = "";

    if (
      hostname === "youtu.be"
    ) {
      videoId =
        url.pathname
          .split("/")
          .filter(Boolean)[0] ??
        "";
    } else if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      if (
        url.pathname === "/watch"
      ) {
        videoId =
          url.searchParams.get("v") ??
          "";
      } else {
        const parts =
          url.pathname
            .split("/")
            .filter(Boolean);

        if (
          parts[0] === "embed" ||
          parts[0] === "shorts"
        ) {
          videoId =
            parts[1] ?? "";
        }
      }
    }

    if (
      !/^[A-Za-z0-9_-]{6,20}$/.test(
        videoId,
      )
    ) {
      return null;
    }

    return (
      "https://www.youtube-nocookie.com/embed/" +
      encodeURIComponent(videoId)
    );
  } catch {
    return null;
  }
}

function getSafeSourceUrl(
  value: string,
) {
  try {
    const url = new URL(value);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

async function getDesk(
  slug: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("desks")
    .select(`
      id,
      name,
      slug,
      description
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getStory(
  slug: string,
) {
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
      intro,
      sections,
      sources,
      story_type,
      status,
      hero_image_url,
      hero_image_alt,
      hero_image_credit,
      author_name,
      published_at,
      updated_at,
      seo_title,
      meta_description,
      is_breaking,
      is_exclusive,
      audio_url,
      audio_duration_seconds,
      audio_generated_at,
      publisher_audio_article_id,
      desks (
        id,
        name,
        slug
      )
    `)
    .eq("slug", slug)
    .in("status", [
      "published",
      "updated",
    ])
    .maybeSingle();

  if (
    error ||
    !data
  ) {
    return null;
  }

  return data;
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } =
    await params;

  const desk =
    await getDesk(slug);

  if (desk) {
    const canonicalUrl =
      `${siteUrl}/${desk.slug}`;

    const metadataTitle =
      `${desk.name} News | Boxing Ring News`;

    const metadataDescription =
      desk.description ||
      `Latest ${desk.name.toLowerCase()} news, stories and updates from Boxing Ring News.`;

    return {
      title:
        metadataTitle,

      description:
        metadataDescription,

      alternates: {
        canonical:
          canonicalUrl,
      },

      openGraph: {
        type:
          "website",

        url:
          canonicalUrl,

        siteName:
          "Boxing Ring News",

        title:
          metadataTitle,

        description:
          metadataDescription,
      },

      twitter: {
        card:
          "summary_large_image",

        title:
          metadataTitle,

        description:
          metadataDescription,
      },
    };
  }

  const story =
    await getStory(slug);

  if (!story) {
    return {};
  }

  const canonicalUrl =
    `${siteUrl}/${story.slug}`;

  const metadataTitle =
    story.seo_title ||
    story.title;

  const metadataDescription =
    story.meta_description ||
    story.excerpt ||
    undefined;

  return {
    title: metadataTitle,

    description:
      metadataDescription,

    alternates: {
      canonical:
        canonicalUrl,
    },

    openGraph: {
      type: "article",

      url:
        canonicalUrl,

      siteName:
        "Boxing Ring News",

      title:
        metadataTitle,

      description:
        metadataDescription,

      publishedTime:
        story.published_at ||
        undefined,

      modifiedTime:
        story.updated_at ||
        story.published_at ||
        undefined,

      images:
        story.hero_image_url
          ? [
              {
                url:
                  story.hero_image_url,

                alt:
                  story.hero_image_alt ||
                  story.title,
              },
            ]
          : [],
    },

    twitter: {
      card:
        "summary_large_image",

      title:
        metadataTitle,

      description:
        metadataDescription,

      images:
        story.hero_image_url
          ? [
              story.hero_image_url,
            ]
          : [],
    },
  };
}

export default async function StoryPage({
  params,
}: PageProps) {
  const { slug } =
    await params;

  const deskPage =
    await getDesk(slug);

  if (deskPage) {
    return (
      <DeskLandingPage
        desk={deskPage}
      />
    );
  }

  const story =
    await getStory(slug);

  if (!story) {
    notFound();
  }

  const desk =
    Array.isArray(
      story.desks,
    )
      ? story.desks[0]
      : story.desks;

  const sections =
    Array.isArray(
      story.sections,
    )
      ? (
          story.sections as StorySection[]
        )
      : [];

  const sources =
    Array.isArray(
      story.sources,
    )
      ? (
          story.sources as StorySource[]
        )
          .map(
            (
              source,
            ) => ({
              name:
                typeof source?.name ===
                "string"
                  ? source.name.trim()
                  : "",

              url:
                typeof source?.url ===
                "string"
                  ? getSafeSourceUrl(
                      source.url.trim(),
                    )
                  : null,
            }),
          )
          .filter(
            (
              source,
            ): source is {
              name: string;
              url: string;
            } =>
              Boolean(
                source.name &&
                  source.url,
              ),
          )
      : [];

  const publishedDate =
    formatDate(
      story.published_at,
    );

  const updatedDate =
    formatDate(
      story.updated_at,
    );

  let relatedStories: {
    id: string;
    title: string;
    slug: string;
    published_at:
      | string
      | null;
  }[] = [];

  if (desk) {
    const {
      data: relatedData,
    } = await supabase
      .from("stories")
      .select(`
        id,
        title,
        slug,
        published_at
      `)
      .eq(
        "desk_id",
        desk.id,
      )
      .in("status", [
        "published",
        "updated",
      ])
      .neq(
        "id",
        story.id,
      )
      .order(
        "published_at",
        {
          ascending: false,
        },
      )
      .limit(4);

    relatedStories =
      relatedData ?? [];
  }

  const storyUrl =
    `${siteUrl}/${story.slug}`;

  const newsArticleSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "NewsArticle",

    headline:
      story.title,

    description:
      story.meta_description ||
      story.excerpt ||
      undefined,

    url:
      storyUrl,

    mainEntityOfPage: {
      "@type":
        "WebPage",

      "@id":
        storyUrl,
    },

    datePublished:
      story.published_at ||
      undefined,

    dateModified:
      story.updated_at ||
      story.published_at ||
      undefined,

    image:
      story.hero_image_url
        ? [
            story.hero_image_url,
          ]
        : undefined,

    articleSection:
      desk?.name ||
      undefined,

    inLanguage:
      "en-GB",

    isAccessibleForFree:
      true,

    author:
      story.author_name
        ? {
            "@type":
              "Person",

            name:
              story.author_name,
          }
        : {
            "@type":
              "Organization",

            name:
              "Boxing Ring News",

            url:
              siteUrl,
          },

    publisher: {
      "@type":
        "NewsMediaOrganization",

      "@id":
        `${siteUrl}/#organization`,

      name:
        "Boxing Ring News",

      url:
        siteUrl,

      logo: {
        "@type":
          "ImageObject",

        url:
          `${siteUrl}/branding/boxing-ring-news-logo.png`,

        width:
          512,

        height:
          512,
      },
    },
  };

  const newsArticleJson =
    JSON.stringify(
      newsArticleSchema,
    ).replace(
      /</g,
      "\\u003c",
    );

  return (
    <>
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            newsArticleJson,
        }}
      />

      <main className="bg-white">
        <article>
          <header className="mx-auto max-w-5xl px-6 pb-10 pt-14 md:pt-20">
            <div className="flex flex-wrap items-center gap-3">
              {story.is_breaking ? (
                <span className="rounded-sm bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                  Breaking
                </span>
              ) : null}

              {story.is_exclusive ? (
                <span className="rounded-sm bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                  Exclusive
                </span>
              ) : null}

              {desk ? (
                <a
                  href={`/${desk.slug}`}
                  className="text-xs font-black uppercase tracking-[0.18em] text-red-600"
                >
                  {desk.name}
                </a>
              ) : null}

              <span className="text-xs font-bold uppercase tracking-[0.14em] text-black/35">
                {story.story_type}
              </span>
            </div>

            <h1 className="mt-6 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-black sm:text-5xl md:text-7xl">
              {story.title}
            </h1>

            {story.excerpt ? (
              <p className="mt-7 max-w-4xl text-xl leading-8 text-black/60 md:text-2xl md:leading-9">
                {story.excerpt}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/10 pt-5 text-sm text-black/45">
              <span className="font-bold text-black">
                By{" "}
                {story.author_name ||
                  "Boxing Ring News"}
              </span>

              {publishedDate ? (
                <span>
                  Published{" "}
                  {publishedDate}
                </span>
              ) : null}

              {updatedDate &&
              updatedDate !==
                publishedDate ? (
                <span>
                  Updated{" "}
                  {updatedDate}
                </span>
              ) : null}
            </div>

            {story.audio_url &&
            story.publisher_audio_article_id ? (
              <iframe
                src={`${publisherAudioUrl}/player/${story.publisher_audio_article_id}`}
                title={`Listen to ${story.title}`}
                loading="lazy"
                allow="autoplay"
                className="w-full border-0"
                style={{
                  height: "220px",
                }}
              />
            ) : null}

            <div className="mt-6">
              <StoryShareButtons
                title={
                  story.title
                }
                url={storyUrl}
              />
            </div>
          </header>

          {story.hero_image_url ? (
            <figure className="mx-auto max-w-7xl px-6">
              <div className="overflow-hidden bg-neutral-100">
                <img
                  src={
                    story.hero_image_url
                  }
                  alt={
                    story.hero_image_alt ||
                    story.title
                  }
                  className="max-h-[760px] w-full object-cover"
                />
              </div>

              {story.hero_image_credit ? (
                <figcaption className="mt-2 text-xs text-black/40">
                  {
                    story.hero_image_credit
                  }
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <div className="mx-auto hidden max-w-7xl px-6 pt-10 lg:block">
            <ArticleLeaderboardAd />
          </div>

          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[minmax(0,760px)_1fr] lg:py-16">
            <div>
              {story.intro ? (
                <div className="story-intro">
                  {story.intro
                    .split(/\n+/)
                    .filter(Boolean)
                    .map(
                      (
                        paragraph:
                          string,
                        index:
                          number,
                      ) => (
                        <p
                          key={
                            index
                          }
                        >
                          {
                            paragraph
                          }
                        </p>
                      ),
                    )}
                </div>
              ) : null}

              <div className="mt-12 space-y-14">
                {sections.map(
                  (
                    section,
                    index,
                  ) => (
                    <section
                      key={index}
                    >
                      {section.eyebrow ? (
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
                          {
                            section.eyebrow
                          }
                        </div>
                      ) : null}

                      {section.headline ? (
                        <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.03em] text-black md:text-4xl">
                          {
                            section.headline
                          }
                        </h2>
                      ) : null}

                      {section.body ? (
                        <div
                          className="story-body mt-6"
                          dangerouslySetInnerHTML={{
                            __html:
                              sanitizeStoryHtml(
                                section.body,
                              ),
                          }}
                        />
                      ) : null}

                      {section.image_url ? (
                        <figure className="mt-8">
                          <img
                            src={
                              section.image_url
                            }
                            alt={
                              section.image_alt ||
                              section.headline ||
                              story.title
                            }
                            loading="lazy"
                            className="h-auto w-full rounded-xl object-cover"
                          />

                          {section.image_credit ? (
                            <figcaption className="mt-2 text-xs text-black/50">
                              {
                                section.image_credit
                              }
                            </figcaption>
                          ) : null}
                        </figure>
                      ) : null}

                      {(() => {
                        const embedUrl =
                          getYouTubeEmbedUrl(
                            section.youtube_url,
                          );

                        if (!embedUrl) {
                          return null;
                        }

                        return (
                          <div className="mt-8 overflow-hidden rounded-xl bg-black">
                            <div className="aspect-video">
                              <iframe
                                src={
                                  embedUrl
                                }
                                title={
                                  section.headline
                                    ? `${section.headline} video`
                                    : `${story.title} video`
                                }
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="h-full w-full border-0"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </section>
                  ),
                )}
              </div>

              {sources.length >
              0 ? (
                <section className="mt-14 border-t border-black/10 pt-8">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                    Sources
                  </div>

                  <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-black">
                    Reporting Sources
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-black/45">
                    Sources used in
                    reporting this
                    story.
                  </p>

                  <div className="mt-5 space-y-3">
                    {sources.map(
                      (
                        source,
                        index,
                      ) => (
                        <a
                          key={`${source.url}-${index}`}
                          href={
                            source.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block rounded-xl border border-black/10 bg-neutral-50 px-5 py-4 transition hover:border-black/25 hover:bg-neutral-100"
                        >
                          <div className="font-black text-black transition group-hover:text-red-600">
                            {
                              source.name
                            }
                          </div>

                          <div className="mt-1 break-all text-sm text-black/40">
                            {
                              source.url
                            }
                          </div>
                        </a>
                      ),
                    )}
                  </div>
                </section>
              ) : null}

              <div className="mt-14">
                <StoryShareButtons
                  title={
                    story.title
                  }
                  url={storyUrl}
                />
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-8 space-y-10">
                <div className="flex justify-center">
                  <ArticleSidebarAd />
                </div>

                {desk &&
                relatedStories.length >
                  0 ? (
                  <section className="border-t-4 border-black pt-5">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                      More from{" "}
                      {desk.name}
                    </div>

                    <div className="mt-5 divide-y divide-black/10">
                      {relatedStories.map(
                        (
                          related,
                        ) => (
                          <a
                            key={
                              related.id
                            }
                            href={`/${related.slug}`}
                            className="block py-5 first:pt-0"
                          >
                            <h3 className="text-lg font-black leading-snug tracking-[-0.02em] text-black transition hover:text-red-600">
                              {
                                related.title
                              }
                            </h3>

                            {related.published_at ? (
                              <div className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-black/35">
                                {formatDate(
                                  related.published_at,
                                )}
                              </div>
                            ) : null}
                          </a>
                        ),
                      )}
                    </div>
                  </section>
                ) : null}

                <section className="border-t-4 border-black pt-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                    Boxing Ring News
                  </div>

                  <h2 className="mt-2 text-2xl font-black leading-tight text-black">
                    Boxing
                    starts here.
                  </h2>

                  <p className="mt-4 text-sm leading-6 text-black/50">
                    Independent
                    coverage of fighters,
                    fights, results,
                    championships,
                    rankings and the
                    wider boxing
                    industry.
                  </p>
                </section>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}