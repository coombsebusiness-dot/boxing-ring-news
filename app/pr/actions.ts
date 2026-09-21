"use server";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

const allowedTypes = new Set([
  "news_tip",
  "press_release",
  "interview_offer",
  "review_request",
  "screening_invite",
  "event_invite",
  "asset_delivery",
  "correction",
  "other",
]);

const allowedDesks = new Set([
  "film",
  "television",
  "streaming",
  "music",
  "gaming",
  "celebrity",
  "awards",
  "industry",
  "culture",
]);

function text(
  formData: FormData,
  name: string,
) {
  return String(
    formData.get(name) ?? "",
  ).trim();
}

export async function submitPR(
  formData: FormData,
) {
  // Honeypot. Real users never see or fill this.
  if (
    text(
      formData,
      "contact_website",
    )
  ) {
    redirect(
      "/pr?submitted=1",
    );
  }

  const senderName =
    text(
      formData,
      "sender_name",
    );

  const senderEmail =
    text(
      formData,
      "sender_email",
    ).toLowerCase();

  const companyName =
    text(
      formData,
      "company_name",
    );

  const senderRole =
    text(
      formData,
      "sender_role",
    );

  const subject =
    text(
      formData,
      "subject",
    );

  const message =
    text(
      formData,
      "message",
    );

  const websiteUrl =
    text(
      formData,
      "website_url",
    );

  const pressReleaseUrl =
    text(
      formData,
      "press_release_url",
    );

  const submissionType =
    text(
      formData,
      "submission_type",
    );

  const deskSlug =
    text(
      formData,
      "desk",
    );

  if (
    senderName.length < 2 ||
    senderName.length > 150 ||
    senderEmail.length > 254 ||
    !senderEmail.includes("@") ||
    subject.length < 5 ||
    subject.length > 250 ||
    message.length < 20 ||
    message.length > 30000 ||
    !allowedTypes.has(
      submissionType,
    )
  ) {
    redirect(
      "/pr?error=invalid",
    );
  }

  const supabase =
    await createClient();

  let deskId:
    | string
    | null = null;

  if (deskSlug) {
    if (
      !allowedDesks.has(
        deskSlug,
      )
    ) {
      redirect(
        "/pr?error=invalid",
      );
    }

    const {
      data: desk,
      error: deskError,
    } = await supabase
      .from("desks")
      .select("id")
      .eq(
        "slug",
        deskSlug,
      )
      .maybeSingle();

    if (
      deskError ||
      !desk
    ) {
      redirect(
        "/pr?error=invalid",
      );
    }

    deskId = desk.id;
  }

  const {
    error,
  } = await supabase.rpc(
    "submit_pr_submission",
    {
      payload: {
        sender_name:
          senderName,
        sender_email:
          senderEmail,
        company_name:
          companyName ||
          null,
        sender_role:
          senderRole ||
          null,
        subject,
        message,
        website_url:
          websiteUrl ||
          null,
        press_release_url:
          pressReleaseUrl ||
          null,
        submission_type:
          submissionType,
        desk_id:
          deskId,
      },
    },
  );

  if (error) {
    console.error(
      "PR submission failed:",
      error,
    );

    redirect(
      "/pr?error=submission",
    );
  }

  redirect(
    "/pr?submitted=1",
  );
}