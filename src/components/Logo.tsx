export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl shrink-0 bg-white"
      style={{ width: size, height: size, boxShadow: "0 2px 10px rgba(16,31,61,0.12)" }}
    >
      <img src="/logo-orania.png" alt="QREEB" style={{ width: size * 0.68, height: size * 0.68 }} className="object-contain" />
    </div>
  );
}

