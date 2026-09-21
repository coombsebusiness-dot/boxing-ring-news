"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

const allowedStatuses = new Set([
  "new",
  "reviewing",
  "shortlisted",
  "accepted",
  "converted_to_story",
  "rejected",
  "spam",
  "archived",
]);

const allowedPriorities = new Set([
  "low",
  "normal",
  "high",
  "breaking",
]);

async function requireNewsroomUser() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data: profile,
  } = await supabase
    .from("newsroom_users")
    .select("role")
    .eq(
      "user_id",
      user.id,
    )
    .eq(
      "is_active",
      true,
    )
    .maybeSingle();

  if (!profile) {
    redirect("/");
  }

  return supabase;
}

export async function updatePRSubmission(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  const status =
    String(
      formData.get("status") ?? "",
    ).trim();

  const priority =
    String(
      formData.get("priority") ?? "",
    ).trim();

  const notes =
    String(
      formData.get("notes") ?? "",
    ).trim();

  if (!id) {
    throw new Error(
      "Missing PR submission ID.",
    );
  }

  if (
    !allowedStatuses.has(
      status,
    )
  ) {
    throw new Error(
      "Invalid PR status.",
    );
  }

  if (
    !allowedPriorities.has(
      priority,
    )
  ) {
    throw new Error(
      "Invalid PR priority.",
    );
  }

  if (notes.length > 10000) {
    throw new Error(
      "Internal notes are too long.",
    );
  }

  const supabase =
    await requireNewsroomUser();

  const reviewedAt =
    status === "new"
      ? null
      : new Date().toISOString();

  const {
    error,
  } = await supabase
    .from("pr_submissions")
    .update({
      status,
      priority,
      notes:
        notes || null,
      reviewed_at:
        reviewedAt,
    })
    .eq(
      "id",
      id,
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const inboxStatus =
    status === "new"
      ? "new"
      : status === "reviewing"
        ? "in_progress"
        : status === "shortlisted" ||
            status === "accepted"
          ? "waiting"
          : status ===
              "converted_to_story"
            ? "completed"
            : status === "rejected" ||
                status === "spam" ||
                status === "archived"
              ? "dismissed"
              : "new";

  await supabase
    .from("editorial_inbox")
    .update({
      status:
        inboxStatus,
      priority,
      notes:
        notes || null,
    })
    .eq(
      "pr_submission_id",
      id,
    );

  revalidatePath(
    `/admin/pr/${id}`,
  );

  revalidatePath(
    "/admin/pr",
  );

  redirect(
    `/admin/pr/${id}?saved=1`,
  );
}

function makeStorySlug(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

export async function convertPRToStory(
  formData: FormData,
) {
  const id =
    String(
      formData.get("id") ?? "",
    ).trim();

  if (!id) {
    throw new Error(
      "Missing PR submission ID.",
    );
  }

  const supabase =
    await requireNewsroomUser();

  const {
    data: submission,
    error: submissionError,
  } = await supabase
    .from("pr_submissions")
    .select(`
      id,
      sender_name,
      sender_email,
      company_name,
      subject,
      message,
      website_url,
      press_release_url,
      desk_id,
      linked_story_id
    `)
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (
    submissionError ||
    !submission
  ) {
    throw new Error(
      submissionError?.message ??
        "PR submission not found.",
    );
  }

  if (
    submission.linked_story_id
  ) {
    redirect(
      `/admin/stories/${submission.linked_story_id}/edit`,
    );
  }

  const baseSlug =
    makeStorySlug(
      submission.subject,
    ) || `pr-story-${id.slice(0, 8)}`;

  const {
    data: existingStory,
  } = await supabase
    .from("stories")
    .select("id")
    .eq(
      "slug",
      baseSlug,
    )
    .maybeSingle();

  const slug =
    existingStory
      ? `${baseSlug}-${id.slice(0, 8)}`
      : baseSlug;

  const sources: {
    name: string;
    url: string;
  }[] = [];

  if (
    submission.website_url
  ) {
    sources.push({
      name:
        submission.company_name ||
        "Official website",
      url:
        submission.website_url,
    });
  }

  if (
    submission.press_release_url
  ) {
    sources.push({
      name:
        "Press release / press kit",
      url:
        submission.press_release_url,
    });
  }

  const editorialNotes = [
    `Created from PR submission ${submission.id}.`,
    "",
    `Submitted by: ${submission.sender_name} <${submission.sender_email}>`,
    submission.company_name
      ? `Company: ${submission.company_name}`
      : null,
    "",
    "Original pitch / press release:",
    submission.message,
  ]
    .filter(
      (
        value,
      ): value is string =>
        Boolean(value),
    )
    .join("\n");

  const {
    data: story,
    error: storyError,
  } = await supabase
    .from("stories")
    .insert({
      title:
        submission.subject,
      slug,
      desk_id:
        submission.desk_id ||
        null,
      story_type:
        "news",
      status:
        "draft",
      sections: [],
      sources,
      editorial_notes:
        editorialNotes,
      is_breaking:
        false,
      is_featured:
        false,
      is_exclusive:
        false,
      is_trending:
        false,
      is_hero:
        false,
      human_reviewed:
        false,
      ai_generated:
        false,
      published_at:
        null,
    })
    .select("id")
    .single();

  if (
    storyError ||
    !story
  ) {
    throw new Error(
      storyError?.message ??
        "Could not create story.",
    );
  }

  const now =
    new Date().toISOString();

  const {
    error: updateError,
  } = await supabase
    .from("pr_submissions")
    .update({
      status:
        "converted_to_story",
      linked_story_id:
        story.id,
      reviewed_at:
        now,
    })
    .eq(
      "id",
      id,
    );

  if (updateError) {
    throw new Error(
      updateError.message,
    );
  }

  await supabase
    .from("editorial_inbox")
    .update({
      status:
        "completed",
      story_id:
        story.id,
    })
    .eq(
      "pr_submission_id",
      id,
    );

  revalidatePath(
    "/admin/pr",
  );

  revalidatePath(
    `/admin/pr/${id}`,
  );

  redirect(
    `/admin/stories/${story.id}/edit`,
  );
}
