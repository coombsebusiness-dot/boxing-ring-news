"use client";

import Script from "next/script";

declare global {
  interface Window {
    aclib?: {
      runVideoSlider?: (options: {
        zoneId: string;
      }) => void;
    };
  }
}

export default function AdcashVideoSlider() {
  function startVideoSlider() {
    if (
      window.aclib &&
      typeof window.aclib.runVideoSlider === "function"
    ) {
      window.aclib.runVideoSlider({
        zoneId: "12230774",
      });
    }
  }

  return (
    <Script
      id="aclib-video-slider"
      src="https://acscdn.com/script/aclib.js"
      strategy="afterInteractive"
      onLoad={startVideoSlider}
    />
  );
}
