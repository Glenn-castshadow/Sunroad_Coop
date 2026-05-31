"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const links = [
  { href: "/associate", label: "Associate View" },
  { href: "/director",  label: "Director View" },
];

export default function NavBar() {
  const path = usePathname();
  // Lazy initializer reads localStorage on client (no SSR — "use client" component)
  const [isLight, setIsLight] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sunroad-theme") === "light";
  });

  // DOM-only effect: keep <html> class in sync with state (no setState calls)
  useEffect(() => {
    document.documentElement.classList.toggle("light", isLight);
  }, [isLight]);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add("light");
      localStorage.setItem("sunroad-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("sunroad-theme", "dark");
    }
  }

  return (
    <header className="bg-[#22242c] border-b border-white/10 text-white px-3 sm:px-4 md:px-6 py-3 flex items-center gap-2 sm:gap-4 md:gap-8">

      {/* Brand */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0 shrink">
        <span className="text-base md:text-lg font-bold tracking-tight text-white shrink-0">Sunroad</span>
        <span className="text-slate-400 text-sm font-medium hidden sm:inline">Co-op Manager</span>
        <span className="hidden sm:inline-flex text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-semibold shrink-0">
          PILOT · KIA
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex gap-1 ml-auto shrink-0">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-2 sm:px-3 md:px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              path.startsWith(href)
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.replace(" View", "")}</span>
          </Link>
        ))}
      </nav>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isLight ? "Switch to dark mode" : "Switch to light mode"}
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/8 transition-colors shrink-0 ml-1"
      >
        {isLight ? (
          /* Moon — click to go dark */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        ) : (
          /* Sun — click to go light */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        )}
      </button>
    </header>
  );
}
