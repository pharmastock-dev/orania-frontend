interface StatusPillProps {
  ouvert: boolean;
}

export default function StatusPill({ ouvert }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
        ouvert ? "bg-[var(--color-green-100)] text-[var(--color-green-600)]" : "bg-[var(--color-ink-100)] text-[var(--color-ink-500)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ouvert ? "bg-[var(--color-green-500)]" : "bg-[var(--color-ink-300)]"}`} />
      {ouvert ? "Ouvert" : "Fermé"}
    </span>
  );
}
