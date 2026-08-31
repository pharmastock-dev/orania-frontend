import { Mail, MessageCircle } from "lucide-react";
import BackButton from "../components/BackButton";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] px-5 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <BackButton to="/" />
          <h1 className="font-display font-bold text-xl text-[var(--color-ink-900)]">Contact</h1>
        </div>

        <p className="text-[var(--color-ink-500)] mt-5">Une question, un problème avec une commande ou votre commerce ? Notre équipe est là pour vous aider.</p>

        <div className="flex flex-col gap-3 mt-6">
          <a href="https://wa.me/213563198390" className="flex items-center gap-3 bg-white rounded-2xl border border-[var(--color-ink-100)] p-4">
            <span className="h-10 w-10 rounded-xl bg-[var(--color-green-100)] text-[var(--color-green-600)] flex items-center justify-center">
              <MessageCircle size={18} />
            </span>
            <div>
              <p className="font-semibold text-[var(--color-ink-900)]">WhatsApp</p>
              <p className="text-sm text-[var(--color-ink-500)]">Assistance rapide</p>
            </div>
          </a>
          <a href="mailto:qreebdz@gmail.com" className="flex items-center gap-3 bg-white rounded-2xl border border-[var(--color-ink-100)] p-4">
            <span className="h-10 w-10 rounded-xl bg-[var(--color-orange-100)] text-[var(--color-orange-600)] flex items-center justify-center">
              <Mail size={18} />
            </span>
            <div>
              <p className="font-semibold text-[var(--color-ink-900)]">Email</p>
              <p className="text-sm text-[var(--color-ink-500)]">qreebdz@gmail.com</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
