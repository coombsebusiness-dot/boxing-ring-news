import sanitizeHtml from "sanitize-html";

export type NarrationSection = {
  eyebrow?: string | null;
  headline?: string | null;
  body?: string | null;
};

type StoryForNarration = {
  title: string;
  excerpt?: string | null;
  intro?: string | null;
  sections?: NarrationSection[] | null;
};

function cleanText(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const text = sanitizeHtml(
    value,
    {
      allowedTags: [],
      allowedAttributes: {},
    },
  );

  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildStoryNarration(
  story: StoryForNarration,
) {
  const parts: string[] = [];

  const title = cleanText(
    story.title,
  );

  if (title) {
    parts.push(title);
  }

  /*
   * Prefer the intro for narration.
   * The excerpt is normally a visual
   * standfirst and can duplicate it.
   */
  const intro = cleanText(
    story.intro,
  );

  if (intro) {
    parts.push(intro);
  } else {
    const excerpt = cleanText(
      story.excerpt,
    );

    if (excerpt) {
      parts.push(excerpt);
    }
  }

  for (
    const section of
      story.sections ?? []
  ) {
    /*
     * Eyebrows are deliberately ignored.
     * They work visually but usually sound
     * unnatural when narrated.
     */

    const headline = cleanText(
      section.headline,
    );

    const body = cleanText(
      section.body,
    );

    if (headline) {
      parts.push(headline);
    }

    if (body) {
      parts.push(body);
    }
  }

  return parts
    .filter(Boolean)
    .join("\n\n");
}
