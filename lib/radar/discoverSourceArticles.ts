import * as cheerio from "cheerio";

export type DiscoveredSourceArticle = {
  title: string;
  url: string;
  publishedAt: string | null;
};

function cleanText(
  value: string,
) {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function shouldIgnoreUrl(
  url: URL,
) {
  const path =
    url.pathname.toLowerCase();

  const ignored = [
    "/contact",
    "/about",
    "/privacy",
    "/terms",
    "/cookie",
    "/login",
    "/register",
    "/shop",
    "/cart",
    "/account",
    "/search",
    "/tag/",
    "/category/",
    "/author/",
  ];

  return ignored.some(
    (part) =>
      path.includes(part),
  );
}

export async function discoverSourceArticles(
  monitorUrl: string,
): Promise<DiscoveredSourceArticle[]> {
  const sourceUrl =
    new URL(monitorUrl);

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      15000,
    );

  let response: Response;

  try {
    response =
      await fetch(
        sourceUrl.toString(),
        {
          signal:
            controller.signal,

          redirect:
            "follow",

          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; BoxingRingNewsRadar/1.0; +https://boxingringnews.com)",

            Accept:
              "text/html,application/xhtml+xml",
          },

          cache:
            "no-store",
        },
      );
  } finally {
    clearTimeout(
      timeout,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Source monitor returned HTTP ${response.status}.`,
    );
  }

  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  if (
    !contentType.includes(
      "text/html",
    ) &&
    !contentType.includes(
      "application/xhtml+xml",
    )
  ) {
    throw new Error(
      "Source monitor did not return HTML.",
    );
  }

  const html =
    await response.text();

  if (
    html.length >
    5_000_000
  ) {
    throw new Error(
      "Source monitor HTML is unexpectedly large.",
    );
  }

  const $ =
    cheerio.load(html);

  const discovered =
    new Map<
      string,
      DiscoveredSourceArticle
    >();

  $(
    "article a[href], main a[href]",
  ).each(
    (
      _,
      element,
    ) => {
      const href =
        $(element).attr(
          "href",
        );

      if (!href) {
        return;
      }

      let articleUrl: URL;

      try {
        articleUrl =
          new URL(
            href,
            sourceUrl,
          );
      } catch {
        return;
      }

      if (
        articleUrl.protocol !==
          "https:" &&
        articleUrl.protocol !==
          "http:"
      ) {
        return;
      }

      /*
       * Keep discovery on the same
       * official website.
       */
      if (
        articleUrl.hostname !==
        sourceUrl.hostname
      ) {
        return;
      }

      articleUrl.hash = "";

      if (
        shouldIgnoreUrl(
          articleUrl,
        )
      ) {
        return;
      }

      const title =
        cleanText(
          $(element).text(),
        );

      /*
       * Very short anchor text is
       * normally an image, button,
       * date or generic "read more".
       */
      if (
        title.length < 12
      ) {
        return;
      }

      const lowerTitle =
        title.toLowerCase();

      if (
        lowerTitle ===
          "read more" ||
        lowerTitle ===
          "learn more" ||
        lowerTitle ===
          "view more"
      ) {
        return;
      }

      const url =
        articleUrl.toString();

      if (
        !discovered.has(
          url,
        )
      ) {
        /*
         * Look around the article link for
         * a publication date. WBA, for
         * example, places a <time> element
         * in the surrounding story row.
         */
        const container =
          $(element).closest(
            "article, .row, li, tr",
          );

        const timeElement =
          container
            .find("time")
            .first();

        const visibleDate =
          cleanText(
            timeElement.text(),
          ).replace(
            /^posted\s+on\s+/i,
            "",
          );

        const datetime =
          cleanText(
            timeElement.attr(
              "datetime",
            ) ?? "",
          );

        let publishedAt:
          string | null = null;

        /*
         * Prefer a machine-readable datetime
         * only when JavaScript can parse it.
         * Some publishers output malformed
         * datetime attributes, so visible
         * date text is the fallback.
         */
        const isIsoDate =
          /^\d{4}-\d{2}-\d{2}(?:[T\s]|$)/.test(
            datetime,
          );

        if (
          isIsoDate &&
          !Number.isNaN(
            Date.parse(datetime),
          )
        ) {
          publishedAt =
            new Date(
              datetime,
            ).toISOString();
        } else if (
          visibleDate &&
          !Number.isNaN(
            Date.parse(visibleDate),
          )
        ) {
          publishedAt =
            new Date(
              visibleDate,
            ).toISOString();
        }

        discovered.set(
          url,
          {
            title,
            url,
            publishedAt,
          },
        );
      }
    },
  );

  /*
   * A source homepage can contain
   * hundreds of links. Radar only
   * needs the newest visible batch.
   */
  return [
    ...discovered.values(),
  ].slice(
    0,
    30,
  );
}
