import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

const PUBLISHER_AUDIO_URL =
  process.env.PUBLISHER_AUDIO_URL ??
  "https://publisheraudio.com";

type RouteContext = {
  params: Promise<{
    storyId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const {
    storyId,
  } = await context.params;

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
    !story ||
    !story.publisher_audio_article_id
  ) {
    return NextResponse.json(
      {
        error:
          "Story audio not found.",
      },
      {
        status: 404,
      },
    );
  }

  if (
    story.publisher_audio_status !==
    "ready"
  ) {
    return NextResponse.json(
      {
        error:
          "Story audio is not ready.",
      },
      {
        status: 409,
      },
    );
  }

  const apiKey =
    process.env.PUBLISHER_AUDIO_API_KEY;

  if (!apiKey) {
    console.error(
      "Missing PUBLISHER_AUDIO_API_KEY.",
    );

    return NextResponse.json(
      {
        error:
          "Audio service unavailable.",
      },
      {
        status: 500,
      },
    );
  }

  const range =
    request.headers.get("range");

  const headers:
    Record<string, string> = {
      Authorization:
        `Bearer ${apiKey}`,
      Accept: "audio/mpeg",
    };

  if (range) {
    headers.Range = range;
  }

  const response =
    await fetch(
      `${PUBLISHER_AUDIO_URL}/api/v1/articles/${encodeURIComponent(
        story.publisher_audio_article_id,
      )}/audio`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );

  if (
    !response.ok ||
    !response.body
  ) {
    console.error(
      "Publisher Audio playback failed:",
      response.status,
    );

    return NextResponse.json(
      {
        error:
          "Audio playback unavailable.",
      },
      {
        status:
          response.status === 404
            ? 404
            : 502,
      },
    );
  }

  const responseHeaders =
    new Headers();

  responseHeaders.set(
    "Content-Type",
    response.headers.get(
      "content-type",
    ) ?? "audio/mpeg",
  );

  const contentLength =
    response.headers.get(
      "content-length",
    );

  if (contentLength) {
    responseHeaders.set(
      "Content-Length",
      contentLength,
    );
  }

  const contentRange =
    response.headers.get(
      "content-range",
    );

  if (contentRange) {
    responseHeaders.set(
      "Content-Range",
      contentRange,
    );
  }

  const acceptRanges =
    response.headers.get(
      "accept-ranges",
    );

  if (acceptRanges) {
    responseHeaders.set(
      "Accept-Ranges",
      acceptRanges,
    );
  }

  responseHeaders.set(
    "Cache-Control",
    "public, max-age=3600",
  );

  const responseStatus =
    range && contentRange
      ? 206
      : response.status;

  return new Response(
    response.body,
    {
      status: responseStatus,
      headers:
        responseHeaders,
    },
  );
}
