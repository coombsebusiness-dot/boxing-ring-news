"use client";

import Script from "next/script";

declare global {
  interface Window {
    aclib?: {
      runAutoTag?: (options: {
        zoneId: string;
      }) => void;
    };
  }
}

export default function AdcashAutoTag() {
  function startAutoTag() {
    if (
      window.aclib &&
      typeof window.aclib.runAutoTag === "function"
    ) {
      window.aclib.runAutoTag({
        zoneId: "re83nhnncg",
      });
    }
  }

  return (
    <Script
      id="aclib"
      src={"https:" + "//" + "acscdn.com/script/aclib.js"}
      strategy="afterInteractive"
      onLoad={startAutoTag}
    />
  );
}
