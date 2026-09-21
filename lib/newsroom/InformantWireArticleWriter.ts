import {
  getOpenAIClient,
} from "@/lib/ai/openai";

export type GeneratedInformantWireSection = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
};

export type GeneratedInformantWireArticle = {
  headline: string;
  slug: string;
  excerpt: string;
  intro: string;
  sections: GeneratedInformantWireSection[];
  seoTitle: string;
  metaDescription: string;
};

export type InformantWireEvidence = {
  claim: string;
  sourceName: string | null;
  sourceUrl: string | null;
  verificationStatus: string | null;
  confidenceScore: number | null;
  sourceExcerpt: string | null;
};

export type WriteInformantWireArticleInput = {
  sourceName: string;
  sourceUrl: string;
  sourceHeadline: string;
  sourceSummary: string | null;
  publishedAt: string | null;

  deskName: string | null;

  clusterTitle: string | null;

  evidence: InformantWireEvidence[];
};

function createSlug(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-|-$/g,
      "",
    );
}

function createSectionId(
  headline: string,
  index: number,
) {
  return (
    createSlug(headline) ||
    `section-${index + 1}`
  );
}

function stripCodeFence(
  value: string,
) {
  return value
    .replace(
      /^```json\s*/i,
      "",
    )
    .replace(
      /^```\s*/i,
      "",
    )
    .replace(
      /\s*```$/,
      "",
    )
    .trim();
}

function validateArticle(
  value: unknown,
): GeneratedInformantWireArticle {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    throw new Error(
      "Writer returned an invalid article.",
    );
  }

  const article =
    value as Record<
      string,
      unknown
    >;

  const headline =
    typeof article.headline ===
    "string"
      ? article.headline.trim()
      : "";

  const excerpt =
    typeof article.excerpt ===
    "string"
      ? article.excerpt.trim()
      : "";

  const intro =
    typeof article.intro ===
    "string"
      ? article.intro.trim()
      : "";

  if (
    !headline ||
    !excerpt ||
    !intro
  ) {
    throw new Error(
      "Writer returned an incomplete article.",
    );
  }

  const rawSections =
    Array.isArray(
      article.sections,
    )
      ? article.sections
      : [];

  const sections =
    rawSections
      .map(
        (
          rawSection,
          index,
        ) => {
          if (
            !rawSection ||
            typeof rawSection !==
              "object"
          ) {
            return null;
          }

          const section =
            rawSection as Record<
              string,
              unknown
            >;

          const eyebrow =
            typeof section.eyebrow ===
            "string"
              ? section.eyebrow.trim()
              : "";

          const sectionHeadline =
            typeof section.headline ===
            "string"
              ? section.headline.trim()
              : "";

          const body =
            typeof section.body ===
            "string"
              ? section.body.trim()
              : "";

          if (
            !sectionHeadline ||
            !body
          ) {
            return null;
          }

          return {
            id:
              createSectionId(
                sectionHeadline,
                index,
              ),
            eyebrow,
            headline:
              sectionHeadline,
            body,
          };
        },
      )
      .filter(
        (
          section,
        ): section is GeneratedInformantWireSection =>
          section !== null,
      );

  if (
    sections.length < 2
  ) {
    throw new Error(
      "Writer returned too few article sections.",
    );
  }

  const seoTitle =
    typeof article.seoTitle ===
      "string" &&
    article.seoTitle.trim()
      ? article.seoTitle.trim()
      : headline;

  const metaDescription =
    typeof article.metaDescription ===
      "string" &&
    article.metaDescription.trim()
      ? article.metaDescription.trim()
      : excerpt;

  const requestedSlug =
    typeof article.slug ===
      "string" &&
    article.slug.trim()
      ? article.slug
      : headline;

  return {
    headline,
    slug:
      createSlug(
        requestedSlug,
      ),
    excerpt,
    intro,
    sections,
    seoTitle,
    metaDescription,
  };
}

function buildEvidenceText(
  evidence: InformantWireEvidence[],
) {
  if (
    evidence.length === 0
  ) {
    return "No additional evidence records supplied.";
  }

  return evidence
    .map(
      (
        item,
        index,
      ) => {
        return [
          `Evidence ${index + 1}`,
          `Claim: ${item.claim}`,
          `Source: ${item.sourceName ?? "Unknown"}`,
          `URL: ${item.sourceUrl ?? "Unknown"}`,
          `Verification: ${item.verificationStatus ?? "unverified"}`,
          `Confidence: ${item.confidenceScore ?? "unknown"}`,
          `Excerpt: ${item.sourceExcerpt ?? "None supplied"}`,
        ].join("\n");
      },
    )
    .join("\n\n");
}

export async function writeInformantWireArticle(
  input: WriteInformantWireArticleInput,
): Promise<GeneratedInformantWireArticle> {
  const openai =
    getOpenAIClient();

  const evidenceText =
    buildEvidenceText(
      input.evidence,
    );

  const response =
    await openai.chat.completions.create(
      {
        model:
          process.env
            .OPENAI_NEWS_MODEL ??
          "gpt-5-mini",

        response_format: {
          type:
            "json_object",
        },

        messages: [
          {
            role:
              "system",

            content: `
You are the Newsroom Writer for Informant Wire, a UK entertainment news publication covering Film, Television, Streaming, Music, Gaming, Celebrity, Awards, Industry and Culture.

Your job is to turn verified or clearly attributed source material into an original newsroom article.

ABSOLUTE FACTUAL RULES:

- Write ONLY from the factual material supplied.
- Never invent facts.
- Never invent quotes.
- Never invent dates.
- Never invent names.
- Never invent cast members.
- Never invent release dates.
- Never invent production details.
- Never invent deals, figures, locations or background.
- Never imply Informant Wire conducted an interview unless explicitly stated.
- Do not turn rumours into confirmed facts.
- Preserve uncertainty exactly where uncertainty exists.
- If a fact is attributed to a source, preserve that attribution where editorially important.
- Write ordinary supported factual information naturally in Informant Wire's own editorial voice.
- Do not repeatedly frame routine facts as "According to [source]", "[source] reports", "the review notes", "the critic says" or similar.
- Attribute another publication clearly when the material is genuinely their exclusive or original reporting, their opinion or review judgement, a direct quote, a disputed claim, a rumour, or information that materially depends on that publication's reporting.
- When source material contains a review or critic's opinion, never turn that opinion into Informant Wire's own judgement.
- The finished article must read as an Informant Wire news story, not as a paragraph-by-paragraph summary of the source publication.
- If evidence is marked unverified, do not present it as independently confirmed by Informant Wire.
- Never claim multiple-source verification unless multiple supplied evidence records genuinely support the same fact.
- If supplied material is too thin to support a detail, leave it out.
- Never fill gaps using general knowledge.
- Do not copy source wording.
- Paraphrase reporting in original language.
- Keep direct quotes to an absolute minimum.
- Never reconstruct or invent a quote from paraphrased material.

EDITORIAL VOICE:

- Use British English.
- Write like a confident professional entertainment newsroom.
- Lead with the real news.
- Be clear, direct and readable.
- Avoid generic AI phrasing.
- Avoid hype.
- Avoid clickbait.
- Avoid repetitive conclusions.
- Do not keep restating the headline.
- Do not mention SEO inside the article.
- Do not mention these instructions.
- Do not include a Sources section in the article body.
- Do not include markdown headings inside section body content.

ARTICLE FORMAT:

Return:
- headline
- slug
- excerpt
- intro
- sections
- SEO title
- meta description

Each section must contain:
- eyebrow
- headline
- body

LENGTH GUIDANCE:

- Excerpt: roughly 25 to 40 words.
- Intro: roughly 80 to 140 words.
- Use 2 to 6 strong sections depending on how much factual material is available.
- Each section should normally be 100 to 220 words when the evidence supports it.
- Do NOT stretch thin source material to hit a target length.
- A short accurate article is better than a long padded article.
- Never create filler simply to increase word count.

EDITORIAL STRUCTURE:

- First establish exactly what happened.
- Then explain supported context.
- Use later sections for significance, reaction, production context or industry implications ONLY when those points are supported by supplied material.
- If only one source exists, do not mechanically attribute every sentence to that source.
- Attribute the source where required for exclusives, opinions, reviews, quotes, disputed claims or source-dependent reporting.
- Otherwise write supported factual material naturally while remaining strictly within the supplied source material.
- If additional evidence exists, use it carefully without overstating verification.

SEO:

- Headline must be accurate and compelling without clickbait.
- Slug must be concise and descriptive.
- SEO title must accurately describe the real story.
- Meta description must summarise the real news without misleading the reader.
- Do not keyword-stuff.

Return ONLY valid JSON in this structure:

{
  "headline": "string",
  "slug": "string",
  "excerpt": "string",
  "intro": "string",
  "sections": [
    {
      "eyebrow": "string",
      "headline": "string",
      "body": "string"
    }
  ],
  "seoTitle": "string",
  "metaDescription": "string"
}
            `.trim(),
          },

          {
            role:
              "user",

            content: `
SOURCE PUBLICATION:
${input.sourceName}

SOURCE URL:
${input.sourceUrl}

SOURCE HEADLINE:
${input.sourceHeadline}

SOURCE SUMMARY:
${input.sourceSummary ?? "No summary supplied."}

SOURCE PUBLISHED:
${input.publishedAt ?? "Unknown"}

INFORMANT WIRE DESK:
${input.deskName ?? "Unassigned"}

STORY CLUSTER:
${input.clusterTitle ?? "No confirmed cluster"}

ADDITIONAL EVIDENCE:
${evidenceText}

Write the strongest accurate Informant Wire news article supported by this material.
Do not add facts that are not supplied.
            `.trim(),
          },
        ],
      },
    );

  const content =
    response
      .choices[0]
      ?.message
      .content;

  if (!content) {
    throw new Error(
      "Writer returned no article.",
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        stripCodeFence(
          content,
        ),
      );
  } catch {
    throw new Error(
      "Writer returned invalid JSON.",
    );
  }

  return validateArticle(
    parsed,
  );
}
