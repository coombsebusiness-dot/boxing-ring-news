import {
  getOpenAIClient,
} from "@/lib/ai/openai";

export type WebStoryResearchInput = {
  headline: string;
  summary?: string | null;
  originalSourceUrl?: string | null;
};

export type WebStoryResearchResult = {
  text: string;
};

export async function researchStoryWithWebSearch(
  input: WebStoryResearchInput,
): Promise<WebStoryResearchResult> {
  const openai =
    getOpenAIClient();

  const response =
    await openai.responses.create({
      model:
        process.env
          .OPENAI_RESEARCH_MODEL ??
        "gpt-5-mini",

      tools: [
        {
          type:
            "web_search",
        },
      ],

      input: `
You are the research desk for Boxing Ring News,
an independent UK boxing news publication.

Research the boxing news story below using current
web sources.

HEADLINE:
${input.headline}

RADAR SUMMARY:
${input.summary ?? "No summary supplied."}

ORIGINAL SOURCE:
${input.originalSourceUrl ?? "No URL supplied."}

RESEARCH RULES:

- Search the web for the underlying story.
- Do not simply rewrite the original headline.
- Find reliable corroborating sources where possible.
- Prefer official statements, promoters, broadcasters,
  sanctioning bodies, fighters, trainers and established
  boxing or sports publications.
- Separate confirmed facts from reports, claims,
  negotiations, rumours and speculation.
- Never invent quotations.
- Never invent fighter records.
- Never invent dates, opponents, titles, rankings,
  venues, purses or contractual details.
- Do not claim something is official unless a reliable
  source supports that wording.
- If sources disagree, say so.
- If a fact cannot be verified, omit it.
- Do not write the finished Boxing Ring News article.
- Produce a factual newsroom research brief for another
  writer to use.
- Include the source name and URL beside important
  sourced facts.
- Finish with a SOURCES section listing the useful
  sources consulted.
`,
    });

  const text =
    response.output_text?.trim();

  if (!text) {
    throw new Error(
      "Web research returned no usable text.",
    );
  }

  return {
    text,
  };
}
