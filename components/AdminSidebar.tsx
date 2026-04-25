"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface AdminSidebarProps {
  currentPage: string;
  onLogout: () => void;
}

const ADMIN_BASE = "/muthu-alaya-ramshi-portal-7893";

const NAV_ITEMS = [
  { key: "label-dashboard", label: "Dashboard", icon: "", href: "" },
  { key: "dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill", href: ADMIN_BASE },
  { key: "label-treatment", label: "Treatment", icon: "", href: "" },
  { key: "appointments", label: "Appointments", icon: "bi-calendar-check", href: `${ADMIN_BASE}/appointments` },
  { key: "patients", label: "Patients", icon: "bi-people", href: `${ADMIN_BASE}/patients` },
  { key: "consultations", label: "Consultations", icon: "bi-clipboard2-pulse", href: `${ADMIN_BASE}/consultations` },
  { key: "invoices", label: "Invoices", icon: "bi-receipt", href: `${ADMIN_BASE}/invoices` },
  { key: "label-website", label: "Website Content", icon: "", href: "" },
  { key: "doctors", label: "Doctors", icon: "bi-person-badge", href: `${ADMIN_BASE}/doctors` },
  { key: "services", label: "Services", icon: "bi-stars", href: `${ADMIN_BASE}/services` },
  { key: "content", label: "Contents", icon: "bi-pencil-square", href: `${ADMIN_BASE}/content` },
];

export default function AdminSidebar({ currentPage, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (item: typeof NAV_ITEMS[number]) => {
    if (item.key === "dashboard") {
      return pathname === ADMIN_BASE || pathname === ADMIN_BASE + "/";
    }
    if (item.key === "consultations") {
      return pathname === `${ADMIN_BASE}/consultations` || pathname.startsWith(`${ADMIN_BASE}/consultation/`);
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const sidebarContent = (
    <>
      {/* Logo / Branding */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #086351, #0a8b6f)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i className="bi bi-shield-check text-white" style={{ fontSize: "1.2rem" }}></i>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2 }}>
              Alaya Admin
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem", letterSpacing: "0.5px" }}>
              DENTAL CLINIC
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          if (item.key === "divider") {
            return (
              <div
                key="divider"
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.08)",
                  margin: "12px 8px",
                }}
              />
            );
          }

          if (item.key.startsWith("label-")) {
            return (
              <div
                key={item.key}
                style={{
                  padding: "16px 14px 6px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </div>
            );
          }

          const active = isActive(item);

          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                marginBottom: "4px",
                textDecoration: "none",
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                backgroundColor: active ? "rgba(8,99,81,0.5)" : "transparent",
                borderLeft: active ? "3px solid #0a8b6f" : "3px solid transparent",
                transition: "all 0.2s ease",
                fontSize: "0.9rem",
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: "1.1rem", width: "20px", textAlign: "center" }}></i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 14px",
            borderRadius: "10px",
            textDecoration: "none",
            color: "rgba(255,255,255,0.55)",
            fontSize: "0.85rem",
            transition: "all 0.2s ease",
            marginBottom: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}
        >
          <i className="bi bi-box-arrow-up-right" style={{ fontSize: "0.95rem" }}></i>
          <span>View Live Site</span>
        </a>
        <button
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 14px",
            borderRadius: "10px",
            border: "none",
            background: "rgba(220,53,69,0.12)",
            color: "#f87171",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(220,53,69,0.25)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(220,53,69,0.12)";
            e.currentTarget.style.color = "#f87171";
          }}
        >
          <i className="bi bi-box-arrow-left" style={{ fontSize: "0.95rem" }}></i>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-sidebar-desktop {
          display: none;
        }
        .admin-sidebar-mobile-toggle {
          display: flex;
        }
        .admin-sidebar-overlay {
          display: ${mobileOpen ? "block" : "none"};
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1040;
          backdrop-filter: blur(2px);
        }
        .admin-sidebar-mobile {
          position: fixed;
          top: 0;
          left: ${mobileOpen ? "0" : "-280px"};
          width: 270px;
          height: 100vh;
          z-index: 1050;
          transition: left 0.3s ease;
        }
        @media (min-width: 992px) {
          .admin-sidebar-desktop {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            width: 260px;
            height: 100vh;
            z-index: 1030;
          }
          .admin-sidebar-mobile-toggle {
            display: none !important;
          }
          .admin-sidebar-overlay {
            display: none !important;
          }
          .admin-sidebar-mobile {
            display: none !important;
          }
        }
      `}} />

      {/* Desktop Sidebar */}
      <div
        className="admin-sidebar-desktop"
        style={{ backgroundColor: "#0D1F1C" }}
      >
        {sidebarContent}
      </div>

      {/* Mobile Top Bar */}
      <div
        className="admin-sidebar-mobile-toggle"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1035,
          backgroundColor: "#0D1F1C",
          padding: "12px 16px",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "1.4rem",
            padding: "4px 8px",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          <i className={`bi ${mobileOpen ? "bi-x-lg" : "bi-list"}`}></i>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #086351, #0a8b6f)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="bi bi-shield-check text-white" style={{ fontSize: "0.85rem" }}></i>
          </div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Alaya Admin</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div
        className="admin-sidebar-overlay"
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <div
        className="admin-sidebar-mobile"
        style={{
          backgroundColor: "#0D1F1C",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {sidebarContent}
      </div>
    </>
  );
}
