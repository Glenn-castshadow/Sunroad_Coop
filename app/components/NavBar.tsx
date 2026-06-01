"use client";
import Link from "next/link";
import Image from "next/image";
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

  function openCalendar() {
    window.dispatchEvent(new CustomEvent("sunroad:open-calendar"));
  }

  function exportCsv() {
    window.dispatchEvent(new CustomEvent("sunroad:export-csv"));
  }

  return (
    <header className="bg-[#22242c] border-b border-white/10 text-white flex items-stretch gap-2 sm:gap-4 md:gap-8">

      {/* Brand — flush top/bottom/left */}
      <div className="flex flex-col items-center justify-center px-4 py-1.5 shrink-0 lg:w-52" style={{ backgroundColor: "#c47c38" }}>
        <Image src="/sunroad-logo.png" alt="Sunroad Auto" height={26} width={104} className="object-contain" style={{ maxHeight: 26, width: "auto" }} />
        <span className="text-white/80 text-lg font-medium hidden sm:block mt-0.5 tracking-wide">Co-op Manager</span>
      </div>

      {/* Rest of header — centred vertically */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-8 flex-1 py-3 pr-3 sm:pr-4 md:pr-6">
        <span className="hidden sm:inline-flex text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-semibold shrink-0">
          PILOT · KIA
        </span>

        {/* App tools */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={openCalendar}
            className="inline-flex items-center gap-1.5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8"/>
              <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.8"/>
            </svg>
            Calendar
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export CSV
          </button>
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
      </div>
    </header>
  );
}
