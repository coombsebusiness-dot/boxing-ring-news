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
              Boxing news.
              From ringside to the
              final bell.
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

        <div className="grid min-h-[190px] grid-cols-1 items-center py-5 text-center md:grid-cols-[1fr_auto_1fr] md:gap-2">

          {/* Left boxing glove */}
          <div
            aria-hidden="true"
            className="hidden items-center justify-end md:flex"
          >
            <img
              src="/branding/boxing-glove-left.png"
              alt=""
              className="h-[150px] w-[240px] origin-right scale-[1.35] object-contain object-right lg:h-[180px] lg:w-[290px] lg:scale-[1.4]"
            />
          </div>

          {/* Masthead title */}
          <a
            href="/"
            className="group relative z-10 inline-block px-2"
          >
            <div className="whitespace-nowrap text-[clamp(2.6rem,5vw,5.2rem)] font-black leading-[0.8] tracking-[-0.065em] text-white">
              BOXING RING{" "}
              <span className="text-red-600">
                NEWS
              </span>
            </div>

            <div className="mt-4 text-[10px] font-black uppercase tracking-[0.5em] text-white/75 sm:text-xs">
              FROM THE GYM TO THE RING
            </div>
          </a>

          {/* Right boxing glove */}
          <div
            aria-hidden="true"
            className="hidden items-center justify-start md:flex"
          >
            <img
              src="/branding/boxing-glove-right.png"
              alt=""
              className="h-[150px] w-[240px] origin-left scale-[1.35] object-contain object-left lg:h-[180px] lg:w-[290px] lg:scale-[1.4]"
            />
          </div>

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
