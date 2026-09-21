import {
  classifyDesk,
} from "./lib/radar/deskClassifier";

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
  "‘One Piece’ Star Taz Skylar Returns For Crime-Thriller ‘Villains’; Double Dutch Selling At TIFF Market",
  "‘House Of The Dragon’ Actress Maddie Evans Leads Brit Horror ‘Pendle 1612’ About Notorious Witch Trials",
  "‘Nightsleeper’ Season 2: Colin Morgan, Madeleine Mantock & Christian Cooke Lead Return Of BBC Thriller Drama",
  "‘Heated Rivalry’ Distributor Sphere Abacus Buys Digital Outfit Rocket Rights",
  "Emily Maitlis To Host Global Podcast Tracing Jeffrey Epstein’s Links To The UK",
];

for (const headline of tests) {
  const result =
    classifyDesk(
      headline,
      null,
      desks,
    );

  console.log("\n--------------------------------");
  console.log(headline);
  console.log("--------------------------------");
  console.log("DESK:", result.deskName ?? "UNCLASSIFIED");
  console.log("SCORE:", result.score);
  console.log("REASON:", result.reason);
}
