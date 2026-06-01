"use client";

interface Props {
  brand: string;
  size?: number;
  className?: string;
}

function Star({ cx, cy, r, rotate = -90 }: { cx: number; cy: number; r: number; rotate?: number }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = ((rotate + i * 36) * Math.PI) / 180;
    const radius = i % 2 === 0 ? r : r * 0.42;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(" ");

  return <polygon points={points} fill="white" />;
}

function BMW({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="BMW">
      <circle cx="20" cy="20" r="19" fill="#050505" />
      <circle cx="20" cy="20" r="15.2" fill="#f8fafc" />
      <path d="M20 20V4.8A15.2 15.2 0 0 1 35.2 20H20Z" fill="#0066B1" />
      <path d="M20 20H35.2A15.2 15.2 0 0 1 20 35.2V20Z" fill="#f8fafc" />
      <path d="M20 20V35.2A15.2 15.2 0 0 1 4.8 20H20Z" fill="#0066B1" />
      <path d="M20 20H4.8A15.2 15.2 0 0 1 20 4.8V20Z" fill="#f8fafc" />
      <circle cx="20" cy="20" r="15.2" stroke="#050505" strokeWidth="1.1" />
      <line x1="20" y1="4.8" x2="20" y2="35.2" stroke="#050505" strokeWidth="1" />
      <line x1="4.8" y1="20" x2="35.2" y2="20" stroke="#050505" strokeWidth="1" />
    </svg>
  );
}

function KiaLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="Kia">
      <rect x="3" y="8" width="34" height="24" rx="5" fill="#05141F" />
      <path d="M9.5 26V14M9.5 20L18.5 14M9.5 20L18.5 26" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.2 26V14" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M25.2 26L31.1 14L36.5 26M28.1 21.2H33.8" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ToyotaLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="Toyota">
      <rect width="40" height="40" rx="6" fill="#EB0A1E" />
      <ellipse cx="20" cy="20" rx="15.6" ry="9.1" stroke="white" strokeWidth="2" />
      <ellipse cx="20" cy="20" rx="7.6" ry="4.4" stroke="white" strokeWidth="2" />
      <ellipse cx="20" cy="23" rx="4.9" ry="13" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function HyundaiLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="Hyundai">
      <rect width="40" height="40" rx="6" fill="#002C5F" />
      <ellipse cx="20" cy="20" rx="15.2" ry="10.2" stroke="white" strokeWidth="2.2" transform="rotate(-12 20 20)" />
      <path d="M12.3 27L15.8 13.2M27.8 12.8L24.3 26.7M14.7 21.2C18.3 18 22.3 17.4 25.5 18.8" stroke="white" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HondaLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="Honda">
      <rect width="40" height="40" rx="6" fill="#D71920" />
      <rect x="9" y="7.5" width="22" height="25" rx="3.5" stroke="white" strokeWidth="2.2" />
      <path d="M13.7 11.8L15.1 28.2M26.3 11.8L24.9 28.2M15.2 20H24.8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevroletLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="Chevrolet">
      <rect width="40" height="40" rx="6" fill="#0B0B0B" />
      <path d="M4.3 15H15.3L18 11.8H25.3L22.7 15H35.7V25H24.7L22 28.2H14.7L17.3 25H4.3V15Z" fill="#161616" stroke="#C9A24B" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6.6 17H16.2L18.8 13.9H22.2L19.7 17H33.4V23H23.8L21.2 26.1H17.8L20.3 23H6.6V17Z" fill="#D5A72D" />
      <path d="M7.2 17.7H16.8L19.2 15H21.2L18.9 17.7H32.8" stroke="#F3D779" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FordLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="Ford">
      <ellipse cx="20" cy="20" rx="17" ry="10.6" fill="#003478" />
      <ellipse cx="20" cy="20" rx="17" ry="10.6" stroke="#79A8D8" strokeWidth="1.2" />
      <text x="20.3" y="24.1" textAnchor="middle" fill="white" fontSize="10.2" fontStyle="italic" fontFamily="Georgia, Times New Roman, serif" fontWeight="700" letterSpacing="0.1">
        Ford
      </text>
    </svg>
  );
}

function SubaruLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="Subaru">
      <rect width="40" height="40" rx="6" fill="#003399" />
      <ellipse cx="20" cy="20" rx="16" ry="10.5" fill="#0A4EA3" stroke="#C7D7F2" strokeWidth="1.4" />
      <Star cx={25.4} cy={15} r={4.1} />
      <Star cx={12.6} cy={19.5} r={2.3} />
      <Star cx={17.2} cy={23.5} r={2.1} />
      <Star cx={11.7} cy={26.2} r={1.8} />
      <Star cx={22.7} cy={24.7} r={1.7} />
      <Star cx={27.7} cy={22.1} r={1.5} />
    </svg>
  );
}

function CDJRLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label="CDJR">
      <rect width="40" height="40" rx="5" fill="#171923" />
      <path d="M20 5.2L34.5 12.8V28.1L20 35.5L5.5 28.1V12.8L20 5.2Z" fill="#10131D" stroke="#BFA35C" strokeWidth="1.1" />
      <path d="M10 15.3H30M10 25.1H30" stroke="#BFA35C" strokeWidth="0.8" opacity="0.65" />
      <text x="20" y="23.2" textAnchor="middle" fill="white" fontSize="8" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">
        CDJR
      </text>
    </svg>
  );
}

function DefaultMark({ brand, s }: { brand: string; s: number }) {
  const initials = brand.slice(0, 2).toUpperCase();
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-label={brand}>
      <rect width="40" height="40" rx="6" fill="#2A2D38" />
      <text x="20" y="25" textAnchor="middle" fill="#94A3B8" fontSize="13" fontWeight="700" fontFamily="Arial, sans-serif">
        {initials}
      </text>
    </svg>
  );
}

export default function BrandMark({ brand, size = 36, className = "" }: Props) {
  const s = size;
  const wrap = (el: React.ReactNode) =>
    className ? <span className={`inline-flex ${className}`}>{el}</span> : <>{el}</>;

  switch (brand) {
    case "BMW":       return wrap(<BMW s={s} />);
    case "Kia":       return wrap(<KiaLogo s={s} />);
    case "Toyota":    return wrap(<ToyotaLogo s={s} />);
    case "Hyundai":   return wrap(<HyundaiLogo s={s} />);
    case "Honda":     return wrap(<HondaLogo s={s} />);
    case "Chevrolet": return wrap(<ChevroletLogo s={s} />);
    case "Ford":      return wrap(<FordLogo s={s} />);
    case "Subaru":    return wrap(<SubaruLogo s={s} />);
    case "CDJR":      return wrap(<CDJRLogo s={s} />);
    default:          return wrap(<DefaultMark brand={brand} s={s} />);
  }
}
