import "server-only";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  buildStoryNarration,
} from "@/lib/audio/buildStoryNarration";

type StorySection = {
  eyebrow?: string | null;
  headline?: string | null;
  body?: string | null;
};

const PUBLISHER_AUDIO_URL =
  process.env.PUBLISHER_AUDIO_URL ??
  "https://publisheraudio.com";

export async function generateStoryAudio(
  storyId: string,
) {
  const admin =
    createAdminClient();

  const {
    data: story,
    error: storyError,
  } = await admin
    .from("stories")
    .select(`
      id,
      title,
      slug,
      excerpt,
      intro,
      sections
    `)
    .eq("id", storyId)
    .single();

  if (
    storyError ||
    !story
  ) {
    throw new Error(
      "Story not found.",
    );
  }

  const narration =
    buildStoryNarration({
      title: story.title,
      excerpt: story.excerpt,
      intro: story.intro,
      sections:
        (story.sections ??
          []) as StorySection[],
    });

  if (!narration) {
    throw new Error(
      "This story has no narration content.",
    );
  }

  const apiKey =
    process.env.PUBLISHER_AUDIO_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing PUBLISHER_AUDIO_API_KEY.",
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://boxingringnews.com";

  const articleUrl =
    new URL(
      `/${story.slug}`,
      siteUrl,
    ).toString();

  const response =
    await fetch(
      `${PUBLISHER_AUDIO_URL}/api/v1/articles`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        body: JSON.stringify({
          title: story.title,
          articleUrl,
          text: narration,
        }),
        cache: "no-store",
      },
    );

  const body =
    await response.json().catch(
      () => null,
    );

  if (
    !response.ok ||
    !body?.id
  ) {
    throw new Error(
      body?.error ??
        `Publisher Audio returned ${response.status}.`,
    );
  }

  const publisherAudioStatus =
    typeof body.status === "string"
      ? body.status
      : "processing";

  const storyUpdates: {
    publisher_audio_article_id: string;
    publisher_audio_status: string;
    audio_url?: string;
    audio_generated_at?: string;
  } = {
    publisher_audio_article_id:
      body.id,
    publisher_audio_status:
      publisherAudioStatus,
  };

  if (publisherAudioStatus === "ready") {
    storyUpdates.audio_url =
      `/api/story-audio/${story.id}`;
    storyUpdates.audio_generated_at =
      new Date().toISOString();
  }

  const {
    error: updateError,
  } = await admin
    .from("stories")
    .update(storyUpdates)
    .eq("id", story.id);

  if (updateError) {
    throw new Error(
      `Story audio update failed: ${updateError.message}`,
    );
  }

  return {
    articleId:
      body.id as string,
    status:
      publisherAudioStatus,
    characters:
      typeof body.characters ===
      "number"
        ? body.characters
        : narration.length,
  };
}


export async function syncStoryAudioStatus(
  storyId: string,
) {
  const admin =
    createAdminClient();

  const {
    data: story,
    error: storyError,
  } = await admin
    .from("stories")
    .select(`
      id,
      publisher_audio_article_id,
      publisher_audio_status
    `)
    .eq("id", storyId)
    .single();

  if (
    storyError ||
    !story
  ) {
    throw new Error(
      "Story not found.",
    );
  }

  if (
    !story.publisher_audio_article_id
  ) {
    throw new Error(
      "This story does not have a Publisher Audio article yet.",
    );
  }

  const apiKey =
    process.env.PUBLISHER_AUDIO_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing PUBLISHER_AUDIO_API_KEY.",
    );
  }

  const response =
    await fetch(
      `${PUBLISHER_AUDIO_URL}/api/v1/articles/${encodeURIComponent(
        story.publisher_audio_article_id,
      )}`,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          Accept:
            "application/json",
        },
        cache: "no-store",
      },
    );

  const body =
    await response.json().catch(
      () => null,
    );

  if (!response.ok) {
    throw new Error(
      body?.error ??
        `Publisher Audio returned ${response.status}.`,
    );
  }

  const status =
    typeof body?.status === "string"
      ? body.status
      : "processing";

  const updates: {
    publisher_audio_status: string;
    audio_url?: string;
    audio_generated_at?: string;
  } = {
    publisher_audio_status:
      status,
  };

  if (
    status === "ready" &&
    typeof body?.audioUrl ===
      "string" &&
    body.audioUrl
  ) {
    updates.audio_url =
      `/api/story-audio/${story.id}`;

    updates.audio_generated_at =
      new Date().toISOString();
  }

  const {
    error: updateError,
  } = await admin
    .from("stories")
    .update(updates)
    .eq("id", story.id);

  if (updateError) {
    throw new Error(
      `Story audio status update failed: ${updateError.message}`,
    );
  }

  return {
    articleId:
      story.publisher_audio_article_id,
    status,
    audioUrl:
      typeof body?.audioUrl ===
      "string"
        ? body.audioUrl
        : null,
    playerUrl:
      typeof body?.playerUrl ===
      "string"
        ? body.playerUrl
        : null,
  };
}
