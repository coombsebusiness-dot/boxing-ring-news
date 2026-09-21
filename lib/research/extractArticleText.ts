import * as cheerio from "cheerio";

export type ExtractedArticle = {
  url: string;
  title: string | null;
  description: string | null;
  text: string;
  rawHtml: string;
  wordCount: number;
};

function cleanText(
  value: string,
) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeJunk(
  value: string,
) {
  const text =
    value
      .toLowerCase()
      .trim();

  if (!text) {
    return true;
  }

  const junk = [
    "subscribe",
    "sign up",
    "newsletter",
    "cookie",
    "privacy policy",
    "terms of use",
    "advertisement",
    "all rights reserved",
    "follow us",
    "read more",
    "related stories",
    "related articles",
  ];

  return junk.some(
    (item) =>
      text === item ||
      (
        text.length < 120 &&
        text.includes(item)
      ),
  );
}

function extractParagraphs(
  $: cheerio.CheerioAPI,
) {
  const selectors = [
    "article p",
    "[itemprop='articleBody'] p",
    ".article-body p",
    ".article__body p",
    ".entry-content p",
    ".post-content p",
    ".story-body p",
    ".content-body p",
    "main p",
  ];

  for (
    const selector of selectors
  ) {
    const paragraphs: string[] =
      [];

    $(
      selector,
    ).each(
      (
        _,
        element,
      ) => {
        const text =
          cleanText(
            $(
              element,
            ).text(),
          );

        if (
          text.length >= 35 &&
          !looksLikeJunk(
            text,
          )
        ) {
          paragraphs.push(
            text,
          );
        }
      },
    );

    const unique = [
      ...new Set(
        paragraphs,
      ),
    ];

    const combined =
      unique.join(
        "\n\n",
      );

    if (
      combined.length >=
      500
    ) {
      return combined;
    }
  }

  return "";
}

export async function extractArticleText(
  url: string,
): Promise<ExtractedArticle> {
  let parsedUrl: URL;

  try {
    parsedUrl =
      new URL(
        url,
      );
  } catch {
    throw new Error(
      "Invalid source URL.",
    );
  }

  if (
    parsedUrl.protocol !==
      "https:" &&
    parsedUrl.protocol !==
      "http:"
  ) {
    throw new Error(
      "Unsupported source URL protocol.",
    );
  }

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
        parsedUrl.toString(),
        {
          signal:
            controller.signal,

          redirect:
            "follow",

          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; BoxingRingNewsResearch/1.0; +https://boxingringnews.com)",

            Accept:
              "text/html,application/xhtml+xml",
          },

          cache:
            "no-store",
        },
      );
  } catch (
    error
  ) {
    if (
      error instanceof Error &&
      error.name ===
        "AbortError"
    ) {
      throw new Error(
        "Source article request timed out.",
      );
    }

    throw new Error(
      "Could not fetch source article.",
    );
  } finally {
    clearTimeout(
      timeout,
    );
  }

  if (
    !response.ok
  ) {
    throw new Error(
      `Source article returned HTTP ${response.status}.`,
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
      "Source URL did not return an HTML article.",
    );
  }

  const rawHtml =
    await response.text();

  if (
    rawHtml.length >
    5_000_000
  ) {
    throw new Error(
      "Source article HTML is unexpectedly large.",
    );
  }

  const $ =
    cheerio.load(
      rawHtml,
    );

  $(
    [
      "script",
      "style",
      "noscript",
      "svg",
      "iframe",
      "nav",
      "footer",
      "header",
      "form",
      "button",
      "aside",
      "[aria-hidden='true']",
      ".advertisement",
      ".ad",
      ".ads",
      ".newsletter",
      ".related",
      ".recommended",
      ".social-share",
    ].join(
      ",",
    ),
  ).remove();

  const title =
    cleanText(
      $(
        "meta[property='og:title']",
      ).attr(
        "content",
      ) ??
        $(
          "h1",
        )
          .first()
          .text() ??
        $(
          "title",
        )
          .first()
          .text(),
    ) || null;

  const description =
    cleanText(
      $(
        "meta[property='og:description']",
      ).attr(
        "content",
      ) ??
        $(
          "meta[name='description']",
        ).attr(
          "content",
        ) ??
        "",
    ) || null;

  let text =
    extractParagraphs(
      $,
    );

  /*
   * Last-resort fallback for unusual pages.
   * We deliberately require reasonable paragraph
   * length so menus and navigation are less likely
   * to contaminate the article text.
   */
  if (
    text.length < 500
  ) {
    const fallback: string[] =
      [];

    $(
      "p",
    ).each(
      (
        _,
        element,
      ) => {
        const paragraph =
          cleanText(
            $(
              element,
            ).text(),
          );

        if (
          paragraph.length >=
            50 &&
          !looksLikeJunk(
            paragraph,
          )
        ) {
          fallback.push(
            paragraph,
          );
        }
      },
    );

    text = [
      ...new Set(
        fallback,
      ),
    ].join(
      "\n\n",
    );
  }

  text =
    cleanText(
      text,
    );

  if (
    text.length < 250
  ) {
    throw new Error(
      "Could not extract enough readable article text.",
    );
  }

  /*
   * Keep research context manageable.
   * This is far beyond what a normal boxing
   * news article should require while preventing
   * pathological pages from flooding the model.
   */
  if (
    text.length >
    60_000
  ) {
    text =
      text.slice(
        0,
        60_000,
      );
  }

  const wordCount =
    text
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      ).length;

  return {
    url:
      response.url ||
      parsedUrl.toString(),

    title,

    description,

    text,

    rawHtml,

    wordCount,
  };
}
