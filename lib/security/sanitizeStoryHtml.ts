import sanitizeHtml from "sanitize-html";

export function sanitizeStoryHtml(
  html: string,
) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
    ],
    allowedAttributes: {
      a: [
        "href",
        "target",
        "rel",
      ],
    },
    allowedSchemes: [
      "http",
      "https",
      "mailto",
    ],
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        {
          rel: "noopener noreferrer",
        },
        true,
      ),
    },
  });
}
