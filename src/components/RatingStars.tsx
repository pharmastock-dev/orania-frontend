import { Star } from "lucide-react";

interface RatingStarsProps {
  note: number;
  size?: number;
  interactive?: boolean;
  onChange?: (note: number) => void;
}

export default function RatingStars({ note, size = 14, interactive = false, onChange }: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(s)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={size}
            className={s <= Math.round(note) ? "fill-[var(--color-orange-500)] text-[var(--color-orange-500)]" : "text-[var(--color-ink-300)]"}
          />
        </button>
      ))}
    </div>
  );
}
