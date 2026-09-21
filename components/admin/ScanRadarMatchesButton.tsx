"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  scanExistingRadarForMatches,
} from "@/app/admin/radar/actions";

export default function ScanRadarMatchesButton() {
  const [
    pending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  function runScan() {
    setMessage(null);

    startTransition(
      async () => {
        try {
          const result =
            await scanExistingRadarForMatches();

          setMessage(
            `${result.scanned} scanned · ${result.matched} suggested matches`,
          );
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Match scan failed.",
          );
        }
      },
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={runScan}
        disabled={pending}
        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
      >
        {pending
          ? "Scanning Matches..."
          : "Scan Existing Radar"}
      </button>

      {message ? (
        <div className="text-xs font-bold text-black/45">
          {message}
        </div>
      ) : null}
    </div>
  );
}
