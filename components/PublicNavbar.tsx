"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// ─── Theme (matches homepage exactly) ────────────────────────────────────────
const THEME = {
  primary: "#086351",
  accent: "#62B6B7",
  gold: "#C9A84C",
  cream: "#FAF7F2",
  dark: "#0D1F1C",
  charcoal: "#1A2E2A",
} as const;

const NAV_LINKS = [
  { label: "Home", href: "/", key: "home" },
  { label: "Services", href: "/services", key: "services" },
  { label: "Doctors", href: "/doctors", key: "doctors" },
  { label: "Contact", href: "/#contact", key: "contact" },
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────
interface PublicNavbarProps {
  currentPage?: "home" | "services" | "doctors" | "contact";
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PublicNavbar({ currentPage }: PublicNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Determine active page from prop or pathname
  const activePage =
    currentPage ||
    (() => {
      if (pathname === "/") return "home";
      if (pathname.startsWith("/services")) return "services";
      if (pathname.startsWith("/doctors")) return "doctors";
      return "home";
    })();

  useEffect(() => {
    // Load Bootstrap JS for the mobile toggler
    // @ts-expect-error bootstrap JS bundle has no type declarations
    import("bootstrap/dist/js/bootstrap.bundle.min.js");

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "scale(1.05)";
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  }, []);

  return (
    <>
      <PublicNavbarStyles />

      {/* ── TopBar (desktop only) ── */}
      <div
        className="public-topbar text-white py-2 d-none d-lg-block position-relative overflow-hidden"
        style={{
          background: `linear-gradient(270deg, ${THEME.primary}, ${THEME.charcoal}, ${THEME.primary})`,
          backgroundSize: "300% 100%",
          animation: "pub-gradient-shift 8s ease infinite",
        }}
      >
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-4">
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-clock-fill" style={{ color: THEME.gold, fontSize: "0.75rem" }}></i>
                <small className="fw-semibold" style={{ fontSize: "0.78rem", letterSpacing: "0.3px" }}>
                  Mon – Sat: 10:00 AM – 8:00 PM
                </small>
              </span>
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-telephone-fill" style={{ color: THEME.gold, fontSize: "0.75rem" }}></i>
                <small className="fw-semibold" style={{ fontSize: "0.78rem" }}>+91 8848659365</small>
              </span>
            </div>
            <div className="d-flex gap-3 align-items-center">
              <span style={{ fontSize: "0.7rem", letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.5 }}>
                Follow
              </span>
              {(["facebook", "instagram", "whatsapp"] as const).map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-white text-decoration-none"
                  style={{ opacity: 0.6, fontSize: "0.9rem", transition: "opacity 0.3s" }}
                  aria-label={social}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                >
                  <i className={`bi bi-${social}`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <nav
        className={`navbar navbar-expand-lg pub-navbar-luxury ${isScrolled ? "pub-navbar-scrolled" : ""}`}
      >
        <div className="container">
          {/* Brand */}
          <Link
            className="navbar-brand d-flex align-items-center gap-3 text-decoration-none"
            href="/"
          >
            {/* Logo with glow pulse effect */}
            <div
              style={{
                position: "relative",
                width: 52,
                height: 52,
                flexShrink: 0,
              }}
            >
              {/* Animated glow ring behind logo */}
              <div
                style={{
                  position: "absolute",
                  inset: -1,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.accent})`,
                  animation: "pub-pulse-glow 3s ease-in-out infinite",
                  zIndex: 0,
                }}
              />
              <img
                src="/images/adc.png"
                alt="Alaya Dental Care"
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: 52,
                  height: 52,
                  objectFit: "contain",
                  borderRadius: 8,
                  background: "#fff",
                  padding: 3,
                }}
              />
            </div>

            {/* Brand text */}
            <div>
              <div
                className="pub-gradient-text"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  lineHeight: 1.1,
                }}
              >
                Alaya Dental Care
              </div>
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: THEME.gold,
                  fontWeight: 600,
                }}
              >
                Premium Dental Studio
              </div>
            </div>
          </Link>

          {/* Toggler */}
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#publicNavbarNav"
            aria-controls="publicNavbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ color: THEME.primary }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Links */}
          <div
            className="collapse navbar-collapse justify-content-end"
            id="publicNavbarNav"
          >
            <ul className="navbar-nav align-items-lg-center gap-lg-1 py-3 py-lg-0">
              {NAV_LINKS.map((item) => (
                <li className="nav-item" key={item.key}>
                  <Link
                    className={`pub-nav-link-luxury ${activePage === item.key ? "active" : ""}`}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
                <Link
                  href="/book"
                  className="pub-btn-book-nav"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <i className="bi bi-calendar-check me-2"></i>Book Now
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

// ─── Styles (isolated with pub- prefix to avoid collisions) ──────────────────
const PublicNavbarStyles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    /* ── Keyframes ── */
    @keyframes pub-gradient-shift {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes pub-pulse-glow {
      0%,100% { box-shadow: 0 0 0 0 rgba(8,99,81,0.35); }
      50%      { box-shadow: 0 0 0 10px rgba(8,99,81,0); }
    }

    /* ── Gradient text helper ── */
    .pub-gradient-text {
      background: linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.accent} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Navbar ── */
    .pub-navbar-luxury {
      position: sticky !important;
      top: 0 !important;
      z-index: 1030 !important;
      background: rgba(250,247,242,0.96) !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      transition: all 0.35s ease;
      padding-top: 0.5rem !important;
      padding-bottom: 0.5rem !important;
    }
    .pub-navbar-scrolled {
      background: rgba(255,255,255,0.98) !important;
      box-shadow: 0 4px 30px rgba(8,99,81,0.10);
    }

    /* ── Nav links ── */
    .pub-nav-link-luxury {
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: ${THEME.charcoal} !important;
      padding: 0.5rem 0.85rem !important;
      transition: color 0.3s ease;
      text-decoration: none;
      display: block;
    }
    .pub-nav-link-luxury:hover,
    .pub-nav-link-luxury.active {
      color: ${THEME.primary} !important;
    }

    /* ── Book Now button ── */
    .pub-btn-book-nav {
      background: linear-gradient(135deg, ${THEME.primary}, ${THEME.accent});
      color: #fff !important;
      border: none;
      border-radius: 4px;
      padding: 0.55rem 1.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(8,99,81,0.28);
      display: inline-flex;
      align-items: center;
    }
    .pub-btn-book-nav:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(8,99,81,0.38);
      color: #fff !important;
    }
  `,
    }}
  />
);
