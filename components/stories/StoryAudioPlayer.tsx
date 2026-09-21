"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type StoryAudioPlayerProps = {
  src: string;
  title: string;
};

function formatTime(
  seconds: number,
) {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export default function StoryAudioPlayer({
  src,
  title,
}: StoryAudioPlayerProps) {
  const audioRef =
    useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [playbackRate, setPlaybackRate] =
    useState(1);

  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(
        audio.currentTime,
      );
    };

    const handleLoadedMetadata = () => {
      setDuration(
        audio.duration,
      );
    };

    const handleDurationChange = () => {
      if (
        Number.isFinite(
          audio.duration,
        )
      ) {
        setDuration(
          audio.duration,
        );
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate,
    );

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata,
    );

    audio.addEventListener(
      "durationchange",
      handleDurationChange,
    );

    audio.addEventListener(
      "ended",
      handleEnded,
    );

    audio.addEventListener(
      "pause",
      handlePause,
    );

    audio.addEventListener(
      "play",
      handlePlay,
    );

    return () => {
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate,
      );

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata,
      );

      audio.removeEventListener(
        "durationchange",
        handleDurationChange,
      );

      audio.removeEventListener(
        "ended",
        handleEnded,
      );

      audio.removeEventListener(
        "pause",
        handlePause,
      );

      audio.removeEventListener(
        "play",
        handlePlay,
      );
    };
  }, [src]);

  async function togglePlayback() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  }

  function handleSeek(
    value: number,
  ) {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime =
      value;

    setCurrentTime(
      value,
    );
  }

  function cyclePlaybackRate() {
    const rates = [
      1,
      1.25,
      1.5,
      2,
    ];

    const currentIndex =
      rates.indexOf(
        playbackRate,
      );

    const nextRate =
      rates[
        (currentIndex + 1) %
          rates.length
      ];

    const audio =
      audioRef.current;

    if (audio) {
      audio.playbackRate =
        nextRate;
    }

    setPlaybackRate(
      nextRate,
    );
  }

  return (
    <section
      className="mt-6 border-y border-black/10 bg-neutral-50 px-5 py-5 sm:px-6"
      aria-label={`Listen to ${title}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600">
            Listen to this story
          </div>

          <div className="mt-1 text-sm font-bold text-black/50">
            Boxing Ring News Audio
          </div>
        </div>

        <div className="text-xs font-bold tabular-nums text-black/40">
          {formatTime(duration)}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlayback}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:bg-red-600"
          aria-label={
            isPlaying
              ? "Pause story"
              : "Play story"
          }
        >
          <span
            aria-hidden="true"
            className="text-lg"
          >
            {isPlaying
              ? "Ⅱ"
              : "▶"}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min="0"
            max={
              duration || 0
            }
            step="0.1"
            value={
              Math.min(
                currentTime,
                duration || 0,
              )
            }
            onChange={(event) =>
              handleSeek(
                Number(
                  event.target.value,
                ),
              )
            }
            className="w-full accent-red-600"
            aria-label="Story playback position"
          />

          <div className="mt-1 flex items-center justify-between text-xs font-bold tabular-nums text-black/40">
            <span>
              {formatTime(
                currentTime,
              )}
            </span>

            <span>
              {formatTime(
                duration,
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={
            cyclePlaybackRate
          }
          className="shrink-0 rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-black text-black transition hover:border-black/30"
          aria-label="Change playback speed"
        >
          {playbackRate}×
        </button>
      </div>
    </section>
  );
}
