"use client";

import { useState } from "react";
import RichTextEditor from "@/components/admin/stories/RichTextEditor";

export type StorySection = {
  eyebrow: string;
  headline: string;
  body: string;
  image_url?: string;
  image_alt?: string;
  image_credit?: string;
  youtube_url?: string;
};

type InternalSection =
  StorySection & {
    id: string;
  };

function newSection(
  section?: Partial<StorySection>,
): InternalSection {
  return {
    id: crypto.randomUUID(),
    eyebrow: section?.eyebrow ?? "",
    headline: section?.headline ?? "",
    body: section?.body ?? "",
    image_url: section?.image_url ?? "",
    image_alt: section?.image_alt ?? "",
    image_credit: section?.image_credit ?? "",
    youtube_url: section?.youtube_url ?? "",
  };
}

export default function SectionBuilder({
  initialSections = [],
}: {
  initialSections?: StorySection[];
}) {
  const [sections, setSections] =
    useState<InternalSection[]>(() =>
      initialSections.length
        ? initialSections.map(
            (section) =>
              newSection(section),
          )
        : [newSection()],
    );

  function updateSection(
    id: string,
    field:
      | "eyebrow"
      | "headline"
      | "body"
      | "image_url"
      | "image_alt"
      | "image_credit"
      | "youtube_url",
    value: string,
  ) {
    setSections((current) =>
      current.map((section) =>
        section.id === id
          ? {
              ...section,
              [field]: value,
            }
          : section,
      ),
    );
  }

  function addSection() {
    setSections((current) => [
      ...current,
      newSection(),
    ]);
  }

  function removeSection(
    id: string,
  ) {
    setSections((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (section) =>
          section.id !== id,
      );
    });
  }

  function moveSection(
    index: number,
    direction: "up" | "down",
  ) {
    setSections((current) => {
      const next = [...current];

      const destination =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        destination < 0 ||
        destination >= next.length
      ) {
        return current;
      }

      const [section] =
        next.splice(index, 1);

      next.splice(
        destination,
        0,
        section,
      );

      return next;
    });
  }

  return (
    <div>
      <input
        type="hidden"
        name="sections"
        value={JSON.stringify(
          sections.map(
            ({
              eyebrow,
              headline,
              body,
              image_url,
              image_alt,
              image_credit,
              youtube_url,
            }) => ({
              eyebrow,
              headline,
              body,
              image_url,
              image_alt,
              image_credit,
              youtube_url,
            }),
          ),
        )}
      />

      <div className="space-y-6">
        {sections.map(
          (section, index) => (
            <div
              key={section.id}
              className="rounded-xl border border-black/10 bg-neutral-50 p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-black/40">
                  Section {index + 1}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      moveSection(
                        index,
                        "up",
                      )
                    }
                    disabled={
                      index === 0
                    }
                    className="rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-bold text-black disabled:opacity-30"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveSection(
                        index,
                        "down",
                      )
                    }
                    disabled={
                      index ===
                      sections.length -
                        1
                    }
                    className="rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-bold text-black disabled:opacity-30"
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeSection(
                        section.id,
                      )
                    }
                    disabled={
                      sections.length ===
                      1
                    }
                    className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-30"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-black/45">
                    Eyebrow
                  </span>

                  <input
                    value={
                      section.eyebrow
                    }
                    onChange={(event) =>
                      updateSection(
                        section.id,
                        "eyebrow",
                        event.target.value,
                      )
                    }
                    placeholder="Example: Casting Update"
                    className="editor-input"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-black/45">
                    Headline
                  </span>

                  <input
                    value={
                      section.headline
                    }
                    onChange={(event) =>
                      updateSection(
                        section.id,
                        "headline",
                        event.target.value,
                      )
                    }
                    placeholder="Section headline"
                    className="editor-input"
                  />
                </label>

                <div>
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-black/45">
                    Body
                  </span>

                  <RichTextEditor
                    value={
                      section.body
                    }
                    onChange={(value) =>
                      updateSection(
                        section.id,
                        "body",
                        value,
                      )
                    }
                  />
                </div>

                <div className="rounded-lg border border-black/10 bg-white p-5">
                  <div className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-black/45">
                    Section Media
                  </div>

                  {section.image_url ? (
                    <div className="mb-5">
                      <img
                        src={section.image_url}
                        alt={section.image_alt || ""}
                        className="max-h-64 w-full rounded-lg object-cover"
                      />
                    </div>
                  ) : null}

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-black/45">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      name={`section_image_${index}`}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="editor-input"
                    />
                  </label>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-black/45">
                      Image Alt Text
                    </span>
                    <input
                      value={section.image_alt}
                      onChange={(event) =>
                        updateSection(
                          section.id,
                          "image_alt",
                          event.target.value,
                        )
                      }
                      placeholder="Describe the image"
                      className="editor-input"
                    />
                  </label>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-black/45">
                      Image Credit
                    </span>
                    <input
                      value={section.image_credit}
                      onChange={(event) =>
                        updateSection(
                          section.id,
                          "image_credit",
                          event.target.value,
                        )
                      }
                      placeholder="Example: Getty Images / Warner Bros."
                      className="editor-input"
                    />
                  </label>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-black/45">
                      YouTube URL
                    </span>
                    <input
                      type="url"
                      value={section.youtube_url}
                      onChange={(event) =>
                        updateSection(
                          section.id,
                          "youtube_url",
                          event.target.value,
                        )
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="editor-input"
                    />
                    <span className="mt-2 block text-xs text-black/45">
                      Paste a YouTube video URL to embed it beneath this section.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={addSection}
        className="mt-5 rounded-lg border border-black/10 bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-neutral-50"
      >
        + Add Section
      </button>
    </div>
  );
}
