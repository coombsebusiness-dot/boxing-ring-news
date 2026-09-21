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
    slug: "results",
    phrases: [
      "fight result",
      "fight results",
      "boxing results",
      "full results",
      "wins by knockout",
      "wins by ko",
      "wins by tko",
      "wins by decision",
      "unanimous decision",
      "split decision",
      "majority decision",
      "technical decision",
      "stoppage victory",
      "knockout victory",
      "stops in round",
      "stopped in round",
      "scorecards read",
      "judges scored",
      "retains title",
      "retained title",
      "wins title",
      "won the title",
      "new world champion",
      "after 12 rounds",
    ],
    words: [
      "result",
      "results",
      "knockout",
      "stoppage",
      "scorecard",
      "scorecards",
      "decision",
      "defeated",
      "stopped",
      "knocked",
      "retained",
    ],
  },

  {
    slug: "fights",
    phrases: [
      "fight announced",
      "bout announced",
      "fight confirmed",
      "bout confirmed",
      "fight scheduled",
      "bout scheduled",
      "set to fight",
      "will fight",
      "will face",
      "to face",
      "takes on",
      "take on",
      "faces off",
      "fight card",
      "undercard",
      "main event",
      "co-main event",
      "rematch",
      "weigh-in",
      "weigh in",
      "weigh-in results",
      "makes weight",
      "made weight",
      "misses weight",
      "fight date",
      "fight night",
      "fight week",
      "opponent announced",
      "replacement opponent",
    ],
    words: [
      "bout",
      "fight",
      "rematch",
      "undercard",
      "opponent",
      "weigh-in",
      "weighin",
    ],
  },

  {
    slug: "fighters",
    phrases: [
      "boxing career",
      "professional record",
      "boxing record",
      "former world champion",
      "world champion",
      "unified champion",
      "undisputed champion",
      "retires from boxing",
      "retirement from boxing",
      "returns to boxing",
      "boxing comeback",
      "changes trainer",
      "new trainer",
      "training camp",
      "sparring partner",
      "signs with promoter",
      "signs promotional deal",
      "fighter profile",
      "fighter interview",
    ],
    words: [
      "boxer",
      "fighter",
      "champion",
      "trainer",
      "coach",
      "retirement",
      "comeback",
      "sparring",
    ],
  },

  {
    slug: "news",
    phrases: [
      "wbc orders",
      "wba orders",
      "ibf orders",
      "wbo orders",
      "mandatory challenger",
      "mandatory defence",
      "mandatory defense",
      "world title",
      "title fight",
      "title defence",
      "title defense",
      "vacant title",
      "stripped of title",
      "boxing rankings",
      "ranking update",
      "promotional deal",
      "broadcast deal",
      "broadcast rights",
      "purse bid",
      "failed drug test",
      "positive drug test",
      "anti-doping",
      "boxing board",
      "british boxing board",
      "sanctioning body",
      "press conference",
      "injury withdrawal",
      "withdraws through injury",
    ],
    words: [
      "wbc",
      "wba",
      "ibf",
      "wbo",
      "bbofc",
      "ranking",
      "rankings",
      "mandatory",
      "promoter",
      "promotion",
      "injury",
      "suspended",
      "suspension",
      "purse",
    ],
  },

  {
    slug: "features",
    phrases: [
      "exclusive interview",
      "in-depth interview",
      "in depth interview",
      "career retrospective",
      "boxing history",
      "inside the camp",
      "behind the scenes",
      "rise of",
      "story of",
      "life and career",
      "analysis",
      "deep dive",
      "what next for",
      "where next for",
      "five things",
      "ten things",
    ],
    words: [
      "feature",
      "analysis",
      "profile",
      "retrospective",
      "opinion",
      "column",
    ],
  },

  {
    slug: "exclusives",
    phrases: [
      "boxing ring news exclusive",
      "exclusive to boxing ring news",
      "exclusive interview with",
      "tells boxing ring news",
      "speaks exclusively",
      "exclusive report",
      "exclusive news",
    ],
    words: [
      "exclusive",
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
