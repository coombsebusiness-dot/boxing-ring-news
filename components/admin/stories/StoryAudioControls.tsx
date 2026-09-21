"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

type ActionResult = {
  status: string;
};

type Props = {
  hasAudio: boolean;
  hasPublisherArticle: boolean;
  generateAction:
    () => Promise<ActionResult>;
  syncAction:
    () => Promise<ActionResult>;
};

export default function StoryAudioControls({
  hasAudio,
  hasPublisherArticle,
  generateAction,
  syncAction,
}: Props) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    workingAction,
    setWorkingAction,
  ] = useState<
    "generate" | "sync" | null
  >(null);

  function runGenerate() {
    setWorkingAction("generate");

    startTransition(async () => {
      try {
        await generateAction();
        router.refresh();
      } finally {
        setWorkingAction(null);
      }
    });
  }

  function runSync() {
    setWorkingAction("sync");

    startTransition(async () => {
      try {
        await syncAction();
        router.refresh();
      } finally {
        setWorkingAction(null);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={runGenerate}
        disabled={isPending}
        className="rounded-xl bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
      >
        {workingAction === "generate"
          ? "Generating Audio…"
          : hasAudio
            ? "Regenerate Audio"
            : "Generate Audio"}
      </button>

      {hasPublisherArticle &&
      !hasAudio ? (
        <button
          type="button"
          onClick={runSync}
          disabled={isPending}
          className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-black text-black transition hover:border-black disabled:cursor-wait disabled:opacity-60"
        >
          {workingAction === "sync"
            ? "Checking Audio…"
            : "Check Audio Status"}
        </button>
      ) : null}
    </div>
  );
}
