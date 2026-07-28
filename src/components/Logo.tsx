// Logo Orania — utilise l'image réelle depuis public/logo-orania.png
export function LogoOrania({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/logo-orania.png"
      alt="Orania"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  )
}
