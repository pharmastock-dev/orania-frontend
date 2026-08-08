import Logo from "./Logo";
import BackButton from "./BackButton";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <BackButton to="/" />
      <Logo size={40} />
      <div className="flex-1 min-w-0">
        <h1 className="font-display font-bold text-lg text-[var(--color-ink-900)] truncate leading-tight">{title}</h1>
        <p className="text-xs text-[var(--color-ink-500)]">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
