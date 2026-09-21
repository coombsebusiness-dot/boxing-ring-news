import { supabase } from "@/lib/supabase/public";

function getToday() {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone:
        "Europe/London",
    },
  )
    .format(new Date())
    .toUpperCase();
}

export default async function SiteHeader() {
  const {
    data: desks,
    error,
  } = await supabase
    .from("desks")
    .select(
      "id, name, slug, sort_order",
    )
    .eq(
      "is_active",
      true,
    )
    .order(
      "sort_order",
      {
        ascending: true,
      },
    );

  if (error) {
    console.error(
      "Failed to load desks:",
      error,
    );
  }

  return (
    <header className="bg-[#080b0d] text-white">
      {/* Utility strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between gap-5 px-6 text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">
          <div className="flex items-center gap-4">
            <span>
              {getToday()}
            </span>

            <span className="hidden h-3 w-px bg-white/25 sm:block" />

            <span className="hidden sm:block">
              Entertainment news.
              Straight from the
              source.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/newsletter"
              className="transition hover:text-white"
            >
              Newsletter
            </a>

            <a
              href="/submit-a-tip"
              className="hidden transition hover:text-white sm:block"
            >
              Submit a Tip
            </a>

            <a
              href="/contact"
              className="hidden transition hover:text-white md:block"
            >
              Contact
            </a>

            <span className="hidden h-3 w-px bg-white/25 md:block" />

            <div className="hidden items-center gap-3 md:flex">
              <span
                className="text-sm"
                aria-label="X"
              >
                𝕏
              </span>

              <span
                className="text-xs font-black"
                aria-label="Facebook"
              >
                f
              </span>

              <span
                className="text-xs font-black"
                aria-label="Instagram"
              >
                ◎
              </span>

              <span
                className="text-xs font-black"
                aria-label="YouTube"
              >
                ▶
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main masthead */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex min-h-[130px] items-center justify-center py-7 text-center">
          <a
            href="/"
            className="group inline-block"
          >
            <div className="text-[clamp(2.6rem,6vw,5.4rem)] font-black leading-[0.8] tracking-[-0.065em] text-white">
              INFORMANT{" "}
              <span className="text-red-600">
                WIRE
              </span>
            </div>

            <div className="mt-4 text-[10px] font-black uppercase tracking-[0.5em] text-white/75 sm:text-xs">
              Entertainment starts
              here.
            </div>
          </a>
        </div>

        {/* Desk navigation */}
        <nav className="flex justify-between gap-4 overflow-x-auto border-t border-white/10 py-4 text-xs font-black uppercase tracking-[0.08em] sm:text-sm">
          {(desks ?? []).map(
            (desk) => (
              <a
                key={desk.id}
                href={`/${desk.slug}`}
                className="whitespace-nowrap text-white/75 transition hover:text-red-500"
              >
                {desk.name}
              </a>
            ),
          )}

          <a
            href="/exclusives"
            className="whitespace-nowrap text-white/75 transition hover:text-red-500"
          >
            Exclusives
          </a>

          <a
            href="/search"
            className="whitespace-nowrap text-lg leading-none text-white/80 transition hover:text-red-500"
            aria-label="Search"
          >
            ⌕
          </a>
        </nav>
      </div>
    </header>
  );
}
