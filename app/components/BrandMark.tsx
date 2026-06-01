"use client";

interface Props {
  brand: string;
  size?: number;
  className?: string;
}

/* ─── individual marks ─────────────────────────────────────────────────────── */

function BMW({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      {/* Outer dark bezel */}
      <circle cx="20" cy="20" r="20" fill="#111"/>
      {/* Quadrants: top-right=white, bottom-right=blue, bottom-left=white, top-left=blue */}
      <path d="M20,20 L20,4 A16,16 0 0,1 36,20 Z" fill="white"/>
      <path d="M20,20 L36,20 A16,16 0 0,1 20,36 Z" fill="#1C69D4"/>
      <path d="M20,20 L20,36 A16,16 0 0,1 4,20 Z" fill="white"/>
      <path d="M20,20 L4,20 A16,16 0 0,1 20,4 Z" fill="#1C69D4"/>
      {/* Hairline dividers */}
      <line x1="20" y1="4" x2="20" y2="36" stroke="#111" strokeWidth="1.2"/>
      <line x1="4" y1="20" x2="36" y2="20" stroke="#111" strokeWidth="1.2"/>
      {/* Inner ring outline */}
      <circle cx="20" cy="20" r="16" fill="none" stroke="#111" strokeWidth="0.8"/>
    </svg>
  );
}

function KiaLogo({ s }: { s: number }) {
  // Modern Kia-style connected wordmark.
  return (
    <svg width={s} height={Math.round(s * 0.56)} viewBox="0 0 72 40" fill="none">
      <rect width="72" height="40" rx="7" fill="#05141F"/>
      <path
        d="M11 27.5V12.5M11 20L25.5 12.5M11 20L25.5 27.5"
        stroke="white"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 27.5V12.5"
        stroke="white"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M44.5 27.5L54.5 12.5L64.5 27.5M49 22.5H60"
        stroke="white"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToyotaLogo({ s }: { s: number }) {
  // Simplified three-oval T mark on red
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#EB0A1E"/>
      {/* Outer horizontal oval */}
      <ellipse cx="20" cy="18" rx="16.5" ry="8.5" stroke="white" strokeWidth="2"/>
      {/* Inner horizontal oval */}
      <ellipse cx="20" cy="18" rx="8.5" ry="5" stroke="white" strokeWidth="2"/>
      {/* Vertical oval — taller, offset down */}
      <ellipse cx="20" cy="25" rx="5" ry="13" stroke="white" strokeWidth="2"/>
    </svg>
  );
}

function HyundaiLogo({ s }: { s: number }) {
  // Stylized slanted H in an oval on navy
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#002c5f"/>
      {/* The Hyundai H — two verticals connected by an angled crossbar */}
      <path
        d="M10,12 L10,28  M30,12 L30,28  M10,20 C14,17 26,17 30,20"
        stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function HondaLogo({ s }: { s: number }) {
  // Clean H on red
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#CC0000"/>
      {/* H: two verticals + horizontal crossbar */}
      <path
        d="M11,11 L11,29  M29,11 L29,29  M11,20 L29,20"
        stroke="white" strokeWidth="3.5" strokeLinecap="round"
      />
    </svg>
  );
}

function ChevroletLogo({ s }: { s: number }) {
  // Chevrolet bowtie with framed metallic shape.
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#111"/>
      <path
        d="M4 15.4H15.6L18.1 12.4H25.1L22.6 15.4H36V24.6H24.4L21.9 27.6H14.9L17.4 24.6H4V15.4Z"
        fill="#141414"
        stroke="#C9A24B"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 17.2H16.4L19 14.2H22.5L19.9 17.2H33.8V22.8H23.6L21 25.8H17.5L20.1 22.8H6.2V17.2Z"
        fill="#D4AF37"
      />
      <path
        d="M6.2 17.2H16.4L19 14.2H22.5L19.9 17.2H33.8"
        stroke="#F2D875"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FordLogo({ s }: { s: number }) {
  // Blue oval with Ford script
  return (
    <svg width={s} height={Math.round(s * 0.7)} viewBox="0 0 56 40" fill="none">
      <ellipse cx="28" cy="20" rx="26" ry="17" fill="#003499"/>
      <ellipse cx="28" cy="20" rx="26" ry="17" stroke="#7ba3d4" strokeWidth="1.5" fill="none"/>
      <text
        x="28" y="26"
        textAnchor="middle"
        fill="white"
        fontSize="17"
        fontStyle="italic"
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="bold"
        letterSpacing="1"
      >Ford</text>
    </svg>
  );
}

function SubaruLogo({ s }: { s: number }) {
  // Blue background with 6-star Pleiades cluster
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#003399"/>
      {/* One larger star (top-right) + 5 smaller stars */}
      {/* Large star center ~(24,10) r=5 */}
      <circle cx="25" cy="10" r="4.5" fill="white"/>
      {/* 5 smaller stars arranged bottom-left cluster */}
      <circle cx="10" cy="18" r="3" fill="white"/>
      <circle cx="17" cy="23" r="2.5" fill="white"/>
      <circle cx="10" cy="27" r="2.5" fill="white"/>
      <circle cx="18" cy="30" r="2" fill="white"/>
      <circle cx="24" cy="22" r="2" fill="white"/>
    </svg>
  );
}

function CDJRLogo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="4" fill="#1a1a2e"/>
      {/* Pentagon/shield hint */}
      <polygon points="20,4 37,13 37,30 20,38 3,30 3,13" fill="none" stroke="#c0a060" strokeWidth="1.2"/>
      <text
        x="20" y="24"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="900"
        fontFamily="Arial Black, Arial, sans-serif"
        letterSpacing="1"
      >CDJR</text>
    </svg>
  );
}

function DefaultMark({ brand, s }: { brand: string; s: number }) {
  const initials = brand.slice(0, 2).toUpperCase();
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#2a2d38"/>
      <text
        x="20" y="25"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="13"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >{initials}</text>
    </svg>
  );
}

/* ─── public component ─────────────────────────────────────────────────────── */

export default function BrandMark({ brand, size = 36, className = "" }: Props) {
  const s = size;
  const wrap = (el: React.ReactNode) =>
    className ? <span className={className}>{el}</span> : <>{el}</>;

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
