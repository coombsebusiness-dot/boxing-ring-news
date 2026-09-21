import type {
  ReactNode,
} from "react";

import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";

type LegalPageProps = {
  eyebrow?: string;
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
};

export default function LegalPage({
  eyebrow = "Boxing Ring News",
  title,
  intro,
  updated = "14 September 2026",
  children,
}: LegalPageProps) {
  return (
    <>
      <SiteHeader />

      <main className="bg-white text-black">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 lg:py-20">
          <div className="border-b border-black/10 pb-10">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              {eyebrow}
            </div>

            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-black/60">
              {intro}
            </p>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-black/35">
              Last updated {updated}
            </p>
          </div>

          <article className="legal-content mt-12 max-w-3xl space-y-10">
            {children}
          </article>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-black tracking-tight">
        {title}
      </h2>

      <div className="mt-4 space-y-4 text-base leading-7 text-black/65">
        {children}
      </div>
    </section>
  );
}