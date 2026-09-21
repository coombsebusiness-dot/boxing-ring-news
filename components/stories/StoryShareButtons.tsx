"use client";

import {
  useState,
} from "react";

type StoryShareButtonsProps = {
  title: string;
  url: string;
};

export default function StoryShareButtons({
  title,
  url,
}: StoryShareButtonsProps) {
  const [copied, setCopied] =
    useState(false);

  const encodedUrl =
    encodeURIComponent(url);

  const encodedTitle =
    encodeURIComponent(title);

  const facebookUrl =
    `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const xUrl =
    `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;

  const linkedInUrl =
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  const whatsappUrl =
    `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;

  const emailUrl =
    `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        url,
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        2000,
      );
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="border-y border-black/10 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-black/40">
          Share this story
        </div>

        <div className="flex flex-wrap gap-2">
          <ShareLink
            href={facebookUrl}
          >
            Facebook
          </ShareLink>

          <ShareLink href={xUrl}>
            X
          </ShareLink>

          <ShareLink
            href={linkedInUrl}
          >
            LinkedIn
          </ShareLink>

          <ShareLink
            href={whatsappUrl}
          >
            WhatsApp
          </ShareLink>

          <a
            href={emailUrl}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-black text-black/60 transition hover:border-black hover:bg-black hover:text-white"
          >
            Email
          </a>

          <button
            type="button"
            onClick={copyLink}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-black text-black/60 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
          >
            {copied
              ? "Copied!"
              : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareLink({
  href,
  children,
}: {
  href: string;
  children:
    React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-black/10 px-4 py-2 text-xs font-black text-black/60 transition hover:border-black hover:bg-black hover:text-white"
    >
      {children}
    </a>
  );
}