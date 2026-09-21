"use client";

import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

export default function RunRadarButton() {
  const router =
    useRouter();

  const [running, setRunning] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(
      null,
    );

  async function runRadar() {
    if (running) {
      return;
    }

    setRunning(true);
    setMessage(null);

    try {
      const response =
        await fetch(
          "/api/admin/radar/ingest",
          {
            method: "POST",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Radar failed",
        );
      }

      setMessage(
        `${data.inserted} new · ${data.duplicates} already known · ${data.failedSources} sources failed`,
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Radar failed",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={runRadar}
        disabled={running}
        className="rounded-lg bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
      >
        {running
          ? "Scanning Sources..."
          : "⚡ Run Radar"}
      </button>

      {message ? (
        <div className="max-w-sm text-right text-xs font-bold text-black/45">
          {message}
        </div>
      ) : null}
    </div>
  );
}
