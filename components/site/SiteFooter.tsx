import Link from "next/link";

const sections = [
  {
    title: "Coverage",
    links: [
      ["Film", "/film"],
      ["Television", "/television"],
      ["Streaming", "/streaming"],
      ["Music", "/music"],
      ["Gaming", "/gaming"],
      ["Celebrity", "/celebrity"],
      ["Awards", "/awards"],
      ["Industry", "/industry"],
      ["Culture", "/culture"],
    ],
  },
  {
    title: "Informant Wire",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      [
        "PR & Submissions",
        "/pr",
      ],
      [
        "Editorial Policy",
        "/editorial-policy",
      ],
      [
        "Corrections Policy",
        "/corrections-policy",
      ],
      [
        "Exclusives",
        "/exclusives",
      ],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/privacy"],
      ["Cookies", "/cookies"],
      ["Terms", "/terms"],
    ],
  },
] as const;

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Link
              href="/"
              className="inline-block"
            >
              <div className="text-3xl font-black tracking-[-0.04em]">
                INFORMANT{" "}
                <span className="text-red-600">
                  WIRE
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-white/50">
              Independent coverage of
              film, television,
              streaming, music,
              gaming and the wider
              entertainment industry.
            </p>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-white/30">
              Entertainment starts here.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {sections.map(
              (section) => (
                <div
                  key={section.title}
                >
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                    {
                      section.title
                    }
                  </div>

                  <nav className="mt-5 flex flex-col gap-3">
                    {section.links.map(
                      ([
                        label,
                        href,
                      ]) => (
                        <Link
                          key={
                            href
                          }
                          href={
                            href
                          }
                          className="text-sm font-semibold text-white/55 transition hover:text-white"
                        >
                          {
                            label
                          }
                        </Link>
                      ),
                    )}
                  </nav>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            ©{" "}
            {new Date().getFullYear()}{" "}
            Informant Wire
          </div>

          <a
            href="mailto:editor@informantwire.com"
            className="transition hover:text-white"
          >
            editor@informantwire.com
          </a>
        </div>
      </div>
    </footer>
  );
}