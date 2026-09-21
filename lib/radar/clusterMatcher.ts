type ClusterCandidate = {
  id: string;
  title: string;
  canonical_topic: string | null;
  desk_id: string | null;
  status: string;
  first_seen_at: string;
  last_seen_at: string;
};

type RadarItemInput = {
  headline: string;
  summary: string | null;
  desk_id: string | null;
  published_at: string | null;
};

type MatchResult = {
  clusterId: string;
  score: number;
  reason: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "he",
  "her",
  "his",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "she",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "were",
  "will",
  "with",
]);

function normalise(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’‘"`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalise(value)
    .split(" ")
    .filter(
      (word) =>
        word.length >= 3 &&
        !STOP_WORDS.has(word),
    );
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function overlapScore(
  a: string[],
  b: string[],
) {
  if (!a.length || !b.length) {
    return 0;
  }

  const aSet = new Set(a);
  const bSet = new Set(b);

  const intersection =
    [...aSet].filter((word) =>
      bSet.has(word),
    ).length;

  const smaller = Math.min(
    aSet.size,
    bSet.size,
  );

  return smaller
    ? intersection / smaller
    : 0;
}

function jaccardScore(
  a: string[],
  b: string[],
) {
  const aSet = new Set(a);
  const bSet = new Set(b);

  const union = new Set([
    ...aSet,
    ...bSet,
  ]);

  if (!union.size) {
    return 0;
  }

  const intersection =
    [...aSet].filter((word) =>
      bSet.has(word),
    ).length;

  return intersection / union.size;
}

function timeScore(
  publishedAt: string | null,
  clusterLastSeenAt: string,
) {
  if (!publishedAt) {
    return 0.5;
  }

  const articleTime =
    new Date(publishedAt).getTime();

  const clusterTime =
    new Date(
      clusterLastSeenAt,
    ).getTime();

  const hours =
    Math.abs(
      articleTime - clusterTime,
    ) /
    (1000 * 60 * 60);

  if (hours <= 3) {
    return 1;
  }

  if (hours <= 12) {
    return 0.9;
  }

  if (hours <= 24) {
    return 0.75;
  }

  if (hours <= 48) {
    return 0.55;
  }

  if (hours <= 72) {
    return 0.35;
  }

  return 0.1;
}

export function findBestClusterMatch(
  item: RadarItemInput,
  clusters: ClusterCandidate[],
): MatchResult | null {
  const headlineTokens = unique(
    tokens(item.headline),
  );

  const summaryTokens = unique(
    tokens(item.summary ?? ""),
  );

  let best: MatchResult | null = null;

  for (const cluster of clusters) {
    if (
      cluster.status !== "open" &&
      cluster.status !== "developing"
    ) {
      continue;
    }

    if (
      item.desk_id &&
      cluster.desk_id &&
      item.desk_id !==
        cluster.desk_id
    ) {
      continue;
    }

    const clusterText = [
      cluster.title,
      cluster.canonical_topic ?? "",
    ].join(" ");

    const clusterTokens = unique(
      tokens(clusterText),
    );

    const headlineOverlap =
      overlapScore(
        headlineTokens,
        clusterTokens,
      );

    const headlineJaccard =
      jaccardScore(
        headlineTokens,
        clusterTokens,
      );

    const summaryOverlap =
      overlapScore(
        summaryTokens,
        clusterTokens,
      );

    const recency = timeScore(
      item.published_at,
      cluster.last_seen_at,
    );

    const score = Math.round(
      headlineOverlap * 48 +
        headlineJaccard * 22 +
        summaryOverlap * 15 +
        recency * 15,
    );

    if (score < 55) {
      continue;
    }

    const reason = [
      `headline overlap ${Math.round(
        headlineOverlap * 100,
      )}%`,
      `headline similarity ${Math.round(
        headlineJaccard * 100,
      )}%`,
      `summary overlap ${Math.round(
        summaryOverlap * 100,
      )}%`,
      `recency ${Math.round(
        recency * 100,
      )}%`,
    ].join(" · ");

    if (!best || score > best.score) {
      best = {
        clusterId: cluster.id,
        score,
        reason,
      };
    }
  }

  return best;
}
