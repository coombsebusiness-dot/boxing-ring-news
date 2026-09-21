type NewsroomStatProps = {
  label: string;
  value: number;
  description: string;
};

export default function NewsroomStat({
  label,
  value,
  description,
}: NewsroomStatProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-black/40">
        {label}
      </div>

      <div className="mt-3 text-4xl font-black tracking-[-0.05em]">
        {value}
      </div>

      <div className="mt-2 text-sm text-black/50">
        {description}
      </div>
    </div>
  );
}
