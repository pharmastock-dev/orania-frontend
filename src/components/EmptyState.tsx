import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-14 px-6">
      {icon && <div className="text-[var(--color-dark-text-muted)] mb-1">{icon}</div>}
      <p className="font-semibold text-[var(--color-dark-text)]">{title}</p>
      {description && <p className="text-sm text-[var(--color-dark-text-muted)] max-w-xs">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
