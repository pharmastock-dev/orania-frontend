import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-[slideUp_0.2s_ease]">
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="font-bold text-lg text-[var(--color-ink-900)]">{title}</h3>}
          <button onClick={onClose} className="ml-auto text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
