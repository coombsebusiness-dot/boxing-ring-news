type AudioBadgeProps = {
  variant?: "light" | "dark";
};

export default function AudioBadge({
  variant = "light",
}: AudioBadgeProps) {
  const classes =
    variant === "dark"
      ? "bg-white text-black"
      : "bg-black text-white";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${classes}`}
      aria-label="Audio available"
    >
      <span
        aria-hidden="true"
        className="text-[9px]"
      >
        ▶
      </span>

      Audio
    </span>
  );
}
