"use client";

import {
  useState,
} from "react";

export type StorySource = {
  name: string;
  url: string;
};

export default function SourceBuilder({
  initialSources = [],
}: {
  initialSources?: StorySource[];
}) {
  const [sources, setSources] =
    useState<StorySource[]>(
      initialSources,
    );

  function addSource() {
    setSources((current) => [
      ...current,
      {
        name: "",
        url: "",
      },
    ]);
  }

  function updateSource(
    index: number,
    field: keyof StorySource,
    value: string,
  ) {
    setSources((current) =>
      current.map(
        (
          source,
          sourceIndex,
        ) =>
          sourceIndex === index
            ? {
                ...source,
                [field]: value,
              }
            : source,
      ),
    );
  }

  function removeSource(
    index: number,
  ) {
    setSources((current) =>
      current.filter(
        (
          _,
          sourceIndex,
        ) =>
          sourceIndex !== index,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="hidden"
        name="sources"
        value={JSON.stringify(
          sources,
        )}
      />

      {sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 bg-neutral-50 p-6 text-sm text-black/45">
          No reporting sources added yet.
        </div>
      ) : null}

      {sources.map(
        (
          source,
          index,
        ) => (
          <div
            key={index}
            className="rounded-xl border border-black/10 bg-neutral-50 p-5"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-black/45">
                  Source name
                </span>

                <input
                  type="text"
                  value={
                    source.name
                  }
                  onChange={(
                    event,
                  ) =>
                    updateSource(
                      index,
                      "name",
                      event.target
                        .value,
                    )
                  }
                  placeholder="Variety"
                  className="editor-input"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-black/45">
                  Source URL
                </span>

                <input
                  type="url"
                  value={
                    source.url
                  }
                  onChange={(
                    event,
                  ) =>
                    updateSource(
                      index,
                      "url",
                      event.target
                        .value,
                    )
                  }
                  placeholder="https://..."
                  className="editor-input"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  removeSource(
                    index,
                  )
                }
                className="rounded-lg border border-red-600/20 px-4 py-3 text-xs font-black uppercase text-red-600 transition hover:bg-red-600 hover:text-white"
              >
                Remove
              </button>
            </div>
          </div>
        ),
      )}

      <button
        type="button"
        onClick={addSource}
        className="rounded-lg bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-red-600"
      >
        + Add Source
      </button>
    </div>
  );
}