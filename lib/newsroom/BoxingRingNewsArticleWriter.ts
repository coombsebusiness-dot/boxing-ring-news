import {
  getOpenAIClient,
} from "@/lib/ai/openai";

export type GeneratedBoxingRingNewsSection = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
};

export type GeneratedBoxingRingNewsArticle = {
  headline: string;
  slug: string;
  excerpt: string;
  intro: string;
  sections: GeneratedBoxingRingNewsSection[];
  seoTitle: string;
  metaDescription: string;
};

export type BoxingRingNewsEvidence = {
  claim: string;
  sourceName: string | null;
  sourceUrl: string | null;
  verificationStatus: string | null;
  confidenceScore: number | null;
  sourceExcerpt: string | null;
};

export type WriteBoxingRingNewsArticleInput = {
  sourceName: string;
  sourceUrl: string;
  sourceHeadline: string;
  sourceSummary: string | null;
  publishedAt: string | null;

  deskName: string | null;

  clusterTitle: string | null;

  evidence: BoxingRingNewsEvidence[];
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
): GeneratedBoxingRingNewsArticle {
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
        ): section is GeneratedBoxingRingNewsSection =>
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
  evidence: BoxingRingNewsEvidence[],
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

export async function writeBoxingRingNewsArticle(
  input: WriteBoxingRingNewsArticleInput,
): Promise<GeneratedBoxingRingNewsArticle> {
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
You are the Newsroom Writer for Boxing Ring News, an independent UK boxing news publication covering professional boxing, major amateur boxing developments, fighters, fights, results, promoters, trainers, sanctioning bodies, championships, rankings, venues, broadcasters and the business of boxing.

Your job is to turn verified or clearly attributed source material into an original boxing newsroom article.

ABSOLUTE FACTUAL RULES:

- Write ONLY from the factual material supplied.
- Never invent facts.
- Never invent quotes.
- Never invent dates.
- Never invent names.
- Never invent fighter records.
- Never invent wins, losses, draws, knockouts or stoppages.
- Never invent opponents.
- Never invent fight results.
- Never invent scorecards or judges' scores.
- Never invent rounds, knockdowns or method of victory.
- Never invent weight classes, contracted weights or catchweights.
- Never invent titles, belts or championship status.
- Never invent rankings or mandatory positions.
- Never invent sanctioning-body decisions.
- Never invent venues or locations.
- Never invent fight dates.
- Never invent purses, financial figures, broadcast deals or contractual details.
- Never describe a fight as confirmed, signed, agreed or official unless the supplied material supports that wording.
- Never describe a fighter as undefeated, undisputed, unified, world champion, former world champion, mandatory challenger or ranked contender unless supplied evidence supports it.
- Never assume which belts are at stake.
- Never assume a fight is a title fight.
- Never assume a fighter's current record from general knowledge.
- Never assume a fighter's nationality, age, trainer, promoter or management.
- Never imply Boxing Ring News conducted an interview unless explicitly stated.
- Do not turn rumours, negotiations or reported talks into confirmed fights.
- Preserve uncertainty exactly where uncertainty exists.
- Distinguish clearly between an official announcement, reported negotiations, a fighter or promoter statement, and speculation.
- If a fact is attributed to a source, preserve that attribution where editorially important.
- Write ordinary supported factual information naturally in Boxing Ring News's own editorial voice.
- Do not repeatedly frame routine facts as "According to [source]", "[source] reports" or similar.
- Attribute another publication clearly when the material is genuinely its exclusive or original reporting, a direct quote, a disputed claim, a rumour, an opinion, or information that materially depends on that publication's reporting.
- When source material contains an opinion or prediction, never turn that opinion into Boxing Ring News's own judgement.
- The finished article must read as a Boxing Ring News story, not as a paragraph-by-paragraph summary of another publication.
- If evidence is marked unverified, do not present it as independently confirmed by Boxing Ring News.
- Never claim multiple-source verification unless multiple supplied evidence records genuinely support the same fact.
- If supplied material is too thin to support a detail, leave it out.
- Never fill gaps using general knowledge.
- Do not copy source wording.
- Paraphrase reporting in original language.
- Keep direct quotes to an absolute minimum.
- Never reconstruct or invent a quote from paraphrased material.

BOXING REPORTING RULES:

- Treat fighter records as time-sensitive facts and use them only when supplied.
- Treat rankings as time-sensitive and sanctioning-body-specific.
- Identify the sanctioning body when the supplied material identifies it.
- Distinguish world titles, interim titles, regular titles, regional titles and other championships exactly as the evidence describes them.
- Do not simplify different championship designations into "world champion".
- Distinguish official fight results from reported or disputed outcomes.
- When reporting scorecards, reproduce only scores supported by the supplied material.
- When reporting a stoppage, use the supplied round and method only.
- Distinguish a scheduled fight from a completed fight.
- Distinguish negotiations from an announced fight.
- Distinguish a weigh-in result from a contracted fight weight.
- Do not call a bout a grudge match, superfight, blockbuster, shock, robbery or upset unless that characterisation is directly supported and editorially justified by the supplied evidence.
- Avoid promotional language supplied by promoters unless clearly attributed.
- Statements from fighters, trainers, promoters, managers and sanctioning bodies should be attributed when they represent that person's or organisation's position.
- For injuries, withdrawals, failed medicals or replacement opponents, state only what the supplied evidence establishes.
- For allegations, disputes and disciplinary matters, use careful attribution and preserve uncertainty.
- Never infer motive.

EDITORIAL VOICE:

- Use British English.
- Write like a confident professional boxing newsroom.
- Lead with the real news.
- Understand boxing terminology, but keep the writing accessible to ordinary fight fans.
- Be clear, direct and readable.
- Prefer precise boxing language over generic sports clichés.
- Avoid generic AI phrasing.
- Avoid hype.
- Avoid clickbait.
- Avoid repetitive conclusions.
- Do not keep restating the headline.
- Do not manufacture drama where the evidence does not support it.
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
- For fight announcements, establish who is fighting, the status of the announcement, date, venue, weight division and championship implications only where supplied.
- For results, establish the winner, opponent, method, round or scorecards and title implications only where supplied.
- For developing stories, make clear what is confirmed and what remains unresolved.
- Then explain supported context.
- Use later sections for previous results, fighter context, rankings, championship implications, reaction or business implications ONLY when those points are supported by supplied material.
- If only one source exists, do not mechanically attribute every sentence to that source.
- Attribute the source where required for exclusives, quotes, disputed claims, rumours, opinions or source-dependent reporting.
- Otherwise write supported factual material naturally while remaining strictly within the supplied source material.
- If additional evidence exists, use it carefully without overstating verification.

SEO:

- Headline must be accurate and compelling without clickbait.
- Put the most important fighter, fight or development naturally near the front of the headline where appropriate.
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

BOXING RING NEWS DESK:
${input.deskName ?? "Unassigned"}

STORY CLUSTER:
${input.clusterTitle ?? "No confirmed cluster"}

ADDITIONAL EVIDENCE:
${evidenceText}

Write the strongest accurate Boxing Ring News news article supported by this material.
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
