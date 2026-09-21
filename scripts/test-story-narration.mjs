import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sanitizeHtml from "sanitize-html";

const env = fs.readFileSync(".env.local", "utf8");

for (const line of env.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    continue;
  }

  const equals = trimmed.indexOf("=");

  if (equals === -1) {
    continue;
  }

  const key = trimmed.slice(0, equals).trim();
  const value = trimmed.slice(equals + 1).trim();

  process.env[key] = value;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function cleanText(value) {
  if (!value) {
    return "";
  }

  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNarration(story) {
  const parts = [];

  const title = cleanText(story.title);

  if (title) {
    parts.push(title);
  }

  const intro = cleanText(story.intro);

  if (intro) {
    parts.push(intro);
  } else {
    const excerpt =
      cleanText(story.excerpt);

    if (excerpt) {
      parts.push(excerpt);
    }
  }

  for (const section of story.sections ?? []) {
    const headline =
      cleanText(section?.headline);

    const body =
      cleanText(section?.body);

    if (headline) {
      parts.push(headline);
    }

    if (body) {
      parts.push(body);
    }
  }

  return parts.join("\n\n");
}

const { data, error } = await supabase
  .from("stories")
  .select(`
    id,
    title,
    slug,
    excerpt,
    intro,
    sections,
    published_at
  `)
  .in("status", [
    "published",
    "updated",
  ])
  .order(
    "published_at",
    { ascending: false },
  )
  .limit(1)
  .single();

if (error) {
  console.error(error);
  process.exit(1);
}

const narration =
  buildNarration(data);

console.log("\n==============================");
console.log("INFORMANT WIRE NARRATION TEST");
console.log("==============================\n");

console.log("STORY:");
console.log(data.title);

console.log("\nSLUG:");
console.log(data.slug);

console.log("\nCHARACTERS:");
console.log(narration.length);

console.log("\nWORDS:");
console.log(
  narration
    .split(/\s+/)
    .filter(Boolean)
    .length,
);

console.log("\n--- NARRATION START ---\n");
console.log(narration);
console.log("\n--- NARRATION END ---\n");

const apiKey =
  process.env.ELEVENLABS_API_KEY;

const voiceId =
  process.env.ELEVENLABS_VOICE_ID;

if (!apiKey || !voiceId) {
  console.error(
    "Missing ElevenLabs environment variables",
  );
  process.exit(1);
}

console.log(
  "\nGenerating full story audio...",
);

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type":
        "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: narration,
      model_id:
        "eleven_multilingual_v2",
    }),
  },
);

if (!response.ok) {
  const message =
    await response.text();

  console.error(
    `ElevenLabs ${response.status}:`,
    message,
  );

  process.exit(1);
}

const audio = Buffer.from(
  await response.arrayBuffer(),
);

const filename =
  `${data.slug}.mp3`;

fs.writeFileSync(
  filename,
  audio,
);

console.log(
  `SUCCESS — ${audio.length} bytes`,
);

console.log(
  `Saved: ${filename}`,
);
