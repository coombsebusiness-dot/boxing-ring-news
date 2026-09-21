import { classifyDesk } from "./lib/radar/deskClassifier";

const desks = [
  { id: "film", name: "Film", slug: "film" },
  { id: "television", name: "Television", slug: "television" },
  { id: "streaming", name: "Streaming", slug: "streaming" },
  { id: "music", name: "Music", slug: "music" },
  { id: "gaming", name: "Gaming", slug: "gaming" },
  { id: "celebrity", name: "Celebrity", slug: "celebrity" },
  { id: "awards", name: "Awards", slug: "awards" },
  { id: "industry", name: "Industry", slug: "industry" },
  { id: "culture", name: "Culture", slug: "culture" },
];

const tests = [
  {
    headline:
      "‘Sunday in the Park With George’ Revival Scrapped After Ariana Grande and Jonathan Bailey Exit",
    summary: null,
  },
  {
    headline:
      "‘Club Kid’ Wins Top Prize at Deauville American Film Festival",
    summary: null,
  },
  {
    headline:
      "Good Films Studios Spain Bets on Long-Term Production at Ciudad de la Luz",
    summary: null,
  },
];

for (const test of tests) {
  const result = classifyDesk(
    test.headline,
    test.summary,
    desks,
  );

  console.log("\n--------------------------------");
  console.log(test.headline);
  console.log("--------------------------------");
  console.log("DESK:", result.deskName);
  console.log("SCORE:", result.score);
  console.log("REASON:", result.reason);
}
