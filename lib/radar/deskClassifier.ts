export type DeskDefinition = {
  id: string;
  name: string;
  slug: string;
};

export type DeskClassification = {
  deskId: string | null;
  deskSlug: string | null;
  deskName: string | null;
  score: number;
  reason: string;
};

type Rule = {
  slug: string;
  phrases: string[];
  words: string[];
};

const RULES: Rule[] = [
  {
    slug: "film",
    phrases: [
      "box office",
      "feature film",
      "movie trailer",
      "film festival",
      "film adaptation",
      "movie adaptation",
      "theatrical release",
      "movie theater",
      "movie theatre",
      "motion picture",
    ],
    words: [
      "film",
      "movie",
      "cinema",
      "director",
      "filmmaker",
      "screenplay",
      "screenwriter",
      "theatrical",
      "sequel",
      "horror",
      "thriller",
    ],
  },

  {
    slug: "television",
    phrases: [
      "tv series",
      "television series",
      "limited series",
      "season finale",
      "series finale",
      "season 2",
      "season 3",
      "season 4",
      "season 5",
      "bbc series",
      "hbo series",
    ],
    words: [
      "television",
      "tv",
      "series",
      "episode",
      "season",
      "showrunner",
      "sitcom",
    ],
  },

  {
    slug: "streaming",
    phrases: [
      "streaming service",
      "streaming series",
      "streaming platform",
      "streaming rights",
      "streaming release",
      "streaming debut",
      "streaming charts",
    ],
    words: [
      "netflix",
      "disney+",
      "disneyplus",
      "hulu",
      "paramount+",
      "peacock",
      "streaming",
    ],
  },

  {
    slug: "music",
    phrases: [
      "new album",
      "new single",
      "music video",
      "record label",
      "concert tour",
      "world tour",
      "music festival",
    ],
    words: [
      "album",
      "single",
      "song",
      "singer",
      "rapper",
      "band",
      "concert",
      "tour",
      "billboard",
      "spotify",
      "grammy",
    ],
  },

  {
    slug: "gaming",
    phrases: [
      "video game",
      "game developer",
      "game publisher",
      "release date",
      "playstation 5",
      "xbox series",
      "nintendo switch",
    ],
    words: [
      "gaming",
      "game",
      "playstation",
      "xbox",
      "nintendo",
      "steam",
      "esports",
    ],
  },

  {
    slug: "celebrity",
    phrases: [
      "red carpet",
      "celebrity couple",
      "celebrity news",
      "social media",
    ],
    words: [
      "celebrity",
      "dating",
      "divorce",
      "wedding",
      "instagram",
    ],
  },

  {
    slug: "awards",
    phrases: [
      "academy awards",
      "golden globes",
      "emmy awards",
      "award nominations",
      "awards season",
    ],
    words: [
      "oscars",
      "oscar",
      "emmys",
      "emmy",
      "bafta",
      "nominee",
      "nominated",
      "winner",
      "awards",
    ],
  },

  {
    slug: "industry",
    phrases: [
      "distribution rights",
      "acquisition deal",
      "production company",
      "production studio",
      "film studio",
      "media company",
      "studio chief",
      "chief executive",
      "box office business",
      "film market",
      "tv market",
      "tiff market",
      "long-term production",
    ],
    words: [
      "acquires",
      "acquisition",
      "merger",
      "rights",
      "distribution",
      "distributor",
      "studio",
      "studios",
      "executive",
      "agency",
      "deal",
      "market",
    ],
  },

  {
    slug: "culture",
    phrases: [
      "pop culture",
      "cultural impact",
      "fan convention",
      "stage production",
      "theatre revival",
      "theater revival",
      "musical revival",
      "broadway revival",
      "west end revival",
    ],
    words: [
      "culture",
      "fandom",
      "viral",
      "trend",
      "podcast",
      "broadway",
      "theatre",
      "theater",
      "musical",
      "stage",
      "revival",
    ],
  },
];

function normalise(
  value: string,
) {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyDesk(
  headline: string,
  summary: string | null,
  desks: DeskDefinition[],
): DeskClassification {
  const headlineText =
    normalise(headline);

  const summaryText =
    normalise(summary ?? "");

  const combined =
    `${headlineText} ${summaryText}`;

  const scores =
    new Map<
      string,
      {
        score: number;
        reasons: string[];
      }
    >();

  for (const rule of RULES) {
    let score = 0;
    const reasons: string[] = [];

    for (
      const phrase of
      rule.phrases
    ) {
      if (
        headlineText.includes(
          phrase,
        )
      ) {
        score += 28;
        reasons.push(
          `"${phrase}" in headline`,
        );
      } else if (
        summaryText.includes(
          phrase,
        )
      ) {
        score += 14;
        reasons.push(
          `"${phrase}" in summary`,
        );
      }
    }

    for (
      const word of
      rule.words
    ) {
      const pattern =
        new RegExp(
          `(^|[^a-z0-9])${word.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          )}([^a-z0-9]|$)`,
          "i",
        );

      if (
        pattern.test(
          headlineText,
        )
      ) {
        score += 12;
        reasons.push(
          `"${word}" in headline`,
        );
      } else if (
        pattern.test(
          combined,
        )
      ) {
        score += 5;
        reasons.push(
          `"${word}" in summary`,
        );
      }
    }

    scores.set(
      rule.slug,
      {
        score,
        reasons,
      },
    );
  }

  const ranked =
    [...scores.entries()]
      .sort(
        (a, b) =>
          b[1].score -
          a[1].score,
      );

  const [
    bestSlug,
    bestResult,
  ] =
    ranked[0] ?? [
      null,
      {
        score: 0,
        reasons: [],
      },
    ];

  if (
    !bestSlug ||
    bestResult.score < 12
  ) {
    return {
      deskId: null,
      deskSlug: null,
      deskName: null,
      score:
        bestResult.score,
      reason:
        "No strong desk signals detected.",
    };
  }

  const desk =
    desks.find(
      (candidate) =>
        candidate.slug ===
        bestSlug,
    );

  if (!desk) {
    return {
      deskId: null,
      deskSlug:
        bestSlug,
      deskName: null,
      score:
        bestResult.score,
      reason:
        `Matched ${bestSlug}, but that desk was not available.`,
    };
  }

  return {
    deskId: desk.id,
    deskSlug: desk.slug,
    deskName: desk.name,
    score: Math.min(
      100,
      bestResult.score,
    ),
    reason:
      bestResult.reasons
        .slice(0, 4)
        .join(" · ") ||
      "Desk keyword match.",
  };
}
