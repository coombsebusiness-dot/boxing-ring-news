const adminNav = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "Radar",
    href: "/admin/radar",
  },
  {
    label: "Stories",
    href: "/admin/stories",
  },
  {
    label: "PR Inbox",
    href: "/admin/pr",
  },
  {
    label: "New Story",
    href: "/admin/stories/new",
  },
];

export default function AdminHeader() {
  return (
    <header className="border-b border-white/10 bg-black text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-6">
            <a
              href="/admin"
              className="shrink-0"
            >
              <div className="text-2xl font-black tracking-[-0.04em]">
                BOXING RING{" "}
                <span className="text-red-600">
                  NEWS
                </span>
              </div>

              <div className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                Newsroom
              </div>
            </a>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {adminNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-bold text-white/65 transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="/"
            className="text-sm font-semibold text-white/60 transition hover:text-white"
          >
            View publication →
          </a>
        </div>
      </div>
    </header>
  );
}
