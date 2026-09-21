import {
  getOpenAIClient,
} from "@/lib/ai/openai";

export type ExtractedClaim = {
  claim: string;
  category:
    | "fight"
    | "fighter"
    | "result"
    | "business"
    | "ranking"
    | "title"
    | "weigh_in"
    | "other";
  sourceExcerpt: string | null;
  confidenceScore: number;
};

type ExtractClaimsInput = {
  sourceName: string;
  sourceUrl: string;
  headline: string;
  articleText: string;
};

function stripCodeFence(
  value: string,
) {
  return value
    .replace(
      /^```(?:json)?\s*/i,
      "",
    )
    .replace(
      /\s*```$/,
      "",
    )
    .trim();
}

function normaliseConfidence(
  value: unknown,
) {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return 60;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(number),
    ),
  );
}

export async function extractClaims(
  input: ExtractClaimsInput,
): Promise<ExtractedClaim[]> {
  const openai =
    getOpenAIClient();

  const response =
    await openai.chat.completions.create(
      {
        model:
          process.env
            .OPENAI_NEWS_MODEL ??
          "gpt-5-mini",

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "system",
            content: `
You are the factual claim extraction desk for Boxing Ring News,
a UK boxing newsroom.

Your job is NOT to write an article.

Your job is to identify the important factual claims explicitly
made in the supplied source article.

STRICT RULES:

- Use ONLY the supplied article text.
- Do not use general knowledge.
- Do not infer missing facts.
- Do not invent names, dates, quotes, figures or context.
- Do not turn opinion, speculation or promotional language into fact.
- Preserve uncertainty when the source itself is uncertain.
- A claim should contain one main checkable factual assertion.
- Prefer material claims relevant to a boxing news report.
- Ignore navigation, adverts, newsletter text and boilerplate.
- Ignore trivial details that would not matter to verification.
- Do not claim that anything has been independently verified.
- Do not say multiple sources support a claim.
- Extract no more than 15 claims.
- If there are fewer meaningful claims, return fewer.
- If there are no meaningful factual claims, return an empty array.

For sourceExcerpt:
- Return a SHORT supporting excerpt from the supplied article.
- It must directly support the claim.
- Keep it concise.
- If no clean supporting excerpt exists, return null.

confidenceScore means confidence that the SOURCE ARTICLE
explicitly makes the claim.

It does NOT mean confidence that the claim is objectively true.

Use:
90-100 = explicit and unambiguous in the source
75-89 = clearly stated but qualified
60-74 = stated with meaningful uncertainty
below 60 = avoid extracting unless editorially important

category must be one of:
fight
fighter
result
business
ranking
title
weigh_in
other

Return ONLY valid JSON:

{
  "claims": [
    {
      "claim": "One concise factual assertion.",
      "category": "fight",
      "sourceExcerpt": "Short supporting source excerpt.",
      "confidenceScore": 95
    }
  ]
}
            `.trim(),
          },

          {
            role: "user",
            content: `
SOURCE PUBLICATION:
${input.sourceName}

SOURCE URL:
${input.sourceUrl}

SOURCE HEADLINE:
${input.headline}

SOURCE ARTICLE:
${input.articleText}
            `.trim(),
          },
        ],
      },
    );

  const content =
    response.choices[0]
      ?.message.content;

  if (!content) {
    throw new Error(
      "Claim extractor returned no content.",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(
      stripCodeFence(content),
    );
  } catch {
    throw new Error(
      "Claim extractor returned invalid JSON.",
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray(
      (
        parsed as {
          claims?: unknown;
        }
      ).claims,
    )
  ) {
    throw new Error(
      "Claim extractor returned an invalid claims payload.",
    );
  }

  const allowedCategories =
    new Set([
      "fight",
      "fighter",
      "result",
      "business",
      "ranking",
      "title",
      "weigh_in",
      "other",
    ]);

  const claims = (
    parsed as {
      claims: Array<{
        claim?: unknown;
        category?: unknown;
        sourceExcerpt?: unknown;
        confidenceScore?: unknown;
      }>;
    }
  ).claims
    .map(
      (
        item,
      ): ExtractedClaim | null => {
        const claim =
          typeof item.claim ===
          "string"
            ? item.claim.trim()
            : "";

        if (!claim) {
          return null;
        }

        const category =
          typeof item.category ===
            "string" &&
          allowedCategories.has(
            item.category,
          )
            ? item.category
            : "other";

        const sourceExcerpt =
          typeof item.sourceExcerpt ===
            "string" &&
          item.sourceExcerpt.trim()
            ? item.sourceExcerpt
                .trim()
                .slice(
                  0,
                  600,
                )
            : null;

        return {
          claim,
          category:
            category as ExtractedClaim["category"],
          sourceExcerpt,
          confidenceScore:
            normaliseConfidence(
              item.confidenceScore,
            ),
        };
      },
    )
    .filter(
      (
        item,
      ): item is ExtractedClaim =>
        item !== null,
    )
    .slice(
      0,
      15,
    );

  /*
   * Remove exact duplicate claims if the model
   * happens to return the same assertion twice.
   */
  const seen =
    new Set<string>();

  return claims.filter(
    (item) => {
      const key =
        item.claim
          .toLowerCase()
          .replace(
            /\s+/g,
            " ",
          )
          .trim();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    },
  );
}
