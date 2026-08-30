export function Loading({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-ink-500)]">
      <span className="h-8 w-8 rounded-full border-[3px] border-[var(--color-ink-100)] border-t-[var(--color-orange-500)] animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// Spécifique aux grilles de l'espace client (fond sombre) — Loading
// ci-dessus reste volontairement inchangé, réutilisé aussi par des pages
// encore en thème clair (StorePage, commerçant, livreur, admin).
export function CardSkeleton() {
  return (
    <div className="bg-[var(--color-dark-card)] rounded-2xl overflow-hidden border border-[var(--color-dark-border)] animate-pulse">
      <div className="h-36 bg-[var(--color-dark-surface)]" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-2/3 bg-[var(--color-dark-surface)] rounded" />
        <div className="h-3 w-1/3 bg-[var(--color-dark-surface)] rounded" />
        <div className="h-3 w-1/2 bg-[var(--color-dark-surface)] rounded" />
      </div>
    </div>
  );
}
