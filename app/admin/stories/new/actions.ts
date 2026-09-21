"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function makeSlug(
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

function extensionFromFile(
  file: File,
) {
  const fromName =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    fromName &&
    [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
    ].includes(fromName)
  ) {
    return fromName;
  }

  const mimeMap:
    Record<
      string,
      string
    > = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

  return (
    mimeMap[file.type] ??
    "jpg"
  );
}

export async function createStory(
  formData: FormData,
) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/admin/login",
    );
  }

  const {
    data: newsroomUser,
  } = await supabase
    .from("newsroom_users")
    .select(
      "user_id, role",
    )
    .eq(
      "user_id",
      user.id,
    )
    .eq(
      "is_active",
      true,
    )
    .maybeSingle();

  if (!newsroomUser) {
    redirect("/");
  }

  const title = String(
    formData.get(
      "title",
    ) ?? "",
  ).trim();

  if (!title) {
    throw new Error(
      "Story title is required.",
    );
  }

  const suppliedSlug =
    String(
      formData.get(
        "slug",
      ) ?? "",
    ).trim();

  const slug = makeSlug(
    suppliedSlug || title,
  );

  const status = String(
    formData.get(
      "status",
    ) ?? "draft",
  );

  let sections: {
    eyebrow: string;
    headline: string;
    body: string;
    image_url: string;
    image_alt: string;
    image_credit: string;
    youtube_url: string;
  }[] = [];

  const rawSections =
    String(
      formData.get(
        "sections",
      ) ?? "[]",
    );

  try {
    const parsed =
      JSON.parse(
        rawSections,
      );

    if (
      Array.isArray(parsed)
    ) {
      sections =
        parsed
          .map(
            (section) => ({
              eyebrow:
                String(
                  section
                    ?.eyebrow ??
                    "",
                ).trim(),

              headline:
                String(
                  section
                    ?.headline ??
                    "",
                ).trim(),

              body:
                String(
                  section
                    ?.body ??
                    "",
                ).trim(),
              image_url:
                String(
                  section
                    ?.image_url ??
                    "",
                ).trim(),
              image_alt:
                String(
                  section
                    ?.image_alt ??
                    "",
                ).trim(),
              image_credit:
                String(
                  section
                    ?.image_credit ??
                    "",
                ).trim(),
              youtube_url:
                String(
                  section
                    ?.youtube_url ??
                    "",
                ).trim(),
            }),
          )
          .filter(
            (section) =>
              section.eyebrow ||
              section.headline ||
              section.body ||
              section.image_url ||
              section.youtube_url,
          );
    }
  } catch {
    throw new Error(
      "The article sections could not be read.",
    );
  }

  const allowedSectionImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  for (
    let index = 0;
    index < sections.length;
    index += 1
  ) {
    const sectionFile =
      formData.get(
        `section_image_${index}`,
      );

    if (
      !(sectionFile instanceof File) ||
      sectionFile.size === 0
    ) {
      continue;
    }

    if (
      !allowedSectionImageTypes.includes(
        sectionFile.type,
      )
    ) {
      throw new Error(
        `Section ${index + 1} image must be JPG, PNG, WebP or GIF.`,
      );
    }

    if (
      sectionFile.size >
      10 * 1024 * 1024
    ) {
      throw new Error(
        `Section ${index + 1} image must be under 10MB.`,
      );
    }

    const sectionImagePath =
      `${new Date().getFullYear()}/sections/` +
      `${crypto.randomUUID()}.` +
      extensionFromFile(
        sectionFile,
      );

    const {
      error: sectionUploadError,
    } = await supabase.storage
      .from("story-images")
      .upload(
        sectionImagePath,
        sectionFile,
        {
          contentType:
            sectionFile.type,
          upsert: false,
        },
      );

    if (sectionUploadError) {
      throw new Error(
        `Section image upload failed: ${sectionUploadError.message}`,
      );
    }

    const {
      data: sectionPublicImage,
    } = supabase.storage
      .from("story-images")
      .getPublicUrl(
        sectionImagePath,
      );

    sections[index].image_url =
      sectionPublicImage.publicUrl;
  }

  let heroImageUrl:
    | string
    | null = null;

  const heroFile =
    formData.get(
      "hero_image_file",
    );

  if (
    heroFile instanceof
      File &&
    heroFile.size > 0
  ) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (
      !allowedTypes.includes(
        heroFile.type,
      )
    ) {
      throw new Error(
        "Hero image must be JPG, PNG, WebP or GIF.",
      );
    }

    if (
      heroFile.size >
      10 * 1024 * 1024
    ) {
      throw new Error(
        "Hero image must be under 10MB.",
      );
    }

    const extension =
      extensionFromFile(
        heroFile,
      );

    const imagePath =
      `${new Date().getFullYear()}/` +
      `${crypto.randomUUID()}.` +
      extension;

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(
          "story-images",
        )
        .upload(
          imagePath,
          heroFile,
          {
            contentType:
              heroFile.type,
            upsert: false,
          },
        );

    if (uploadError) {
      throw new Error(
        `Image upload failed: ${uploadError.message}`,
      );
    }

    const {
      data:
        publicImage,
    } =
      supabase.storage
        .from(
          "story-images",
        )
        .getPublicUrl(
          imagePath,
        );

    heroImageUrl =
      publicImage.publicUrl;
  }

  const now =
    new Date().toISOString();

  const {
    data,
    error,
  } = await supabase
    .from("stories")
    .insert({
      title,
      slug,

      desk_id:
        formData.get(
          "desk_id",
        ) || null,

      story_type:
        formData.get(
          "story_type",
        ) || "news",

      status,

      excerpt:
        formData.get(
          "excerpt",
        ) || null,

      intro:
        formData.get(
          "intro",
        ) || null,

      author_name:
        String(
          formData.get(
            "author_name",
          ) ?? "",
        ).trim() || null,

      sections,

      seo_title:
        formData.get(
          "seo_title",
        ) || null,

      meta_description:
        formData.get(
          "meta_description",
        ) || null,

      hero_image_url:
        heroImageUrl,

      hero_image_alt:
        formData.get(
          "hero_image_alt",
        ) || null,

      hero_image_credit:
        formData.get(
          "hero_image_credit",
        ) || null,

      is_breaking:
        formData.get(
          "is_breaking",
        ) === "on",

      is_featured:
        formData.get(
          "is_featured",
        ) === "on",

      is_exclusive:
        formData.get(
          "is_exclusive",
        ) === "on",

      is_trending:
        formData.get(
          "is_trending",
        ) === "on",

      is_hero:
        formData.get(
          "is_hero",
        ) === "on",

      human_reviewed:
        true,

      ai_generated:
        false,

      published_at:
        status ===
        "published"
          ? now
          : null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(
      error.message,
    );
  }

  if (
    status === "published"
  ) {
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/news-sitemap.xml");
    revalidatePath(`/${slug}`);

    const deskId =
      String(
        formData.get(
          "desk_id",
        ) ?? "",
      ).trim();

    if (deskId) {
      const {
        data: desk,
      } = await supabase
        .from("desks")
        .select("slug")
        .eq("id", deskId)
        .maybeSingle();

      if (desk?.slug) {
        revalidatePath(
          `/${desk.slug}`,
        );
      }
    }
  }

  redirect(
    `/admin/stories/${data.id}/edit`,
  );
}
