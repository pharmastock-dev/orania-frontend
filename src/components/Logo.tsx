// Logo Orania — pin de localisation + sac de course (couleurs de la marque)
export function LogoOrania({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* pin bleu foncé */}
      <path d="M50 8C32 8 18 22 18 40c0 20 26 46 30 50a3 3 0 0 0 4 0c4-4 30-30 30-50C82 22 68 8 50 8Z" fill="#12355B"/>
      {/* cercle intérieur blanc */}
      <circle cx="50" cy="40" r="22" fill="#FFFFFF"/>
      {/* silhouette bâtiment/minaret orange */}
      <path d="M40 50V34h3v-4h2v4h3v16h-8Z" fill="#FF6B00"/>
      <path d="M48 50V38h12v12H48Z" fill="#FF6B00"/>
      <rect x="51" y="41" width="2.5" height="9" fill="#FFFFFF"/>
      <rect x="55" y="41" width="2.5" height="9" fill="#FFFFFF"/>
      {/* route */}
      <path d="M44 62c2-4 10-4 12 0" stroke="#12355B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* sac de course orange en haut */}
      <path d="M62 16h10a2 2 0 0 1 2 2l1 10a2 2 0 0 1-2 2H61a2 2 0 0 1-2-2l1-10a2 2 0 0 1 2-2Z" fill="#FF6B00"/>
      <path d="M64 16a3 3 0 0 1 6 0" stroke="#12355B" strokeWidth="1.5" fill="none"/>
      {/* lignes de vitesse */}
      <path d="M14 34h8M12 40h6M14 46h8" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}
