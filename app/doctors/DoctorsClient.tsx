"use client";

import Link from "next/link";
import Image from "next/image";
import PublicNavbar from "../../components/PublicNavbar";

// ─── Theme (Matches Booking Page) ──────────────────────────────────────────
const THEME = {
  primary: "#086351",
  accent: "#62B6B7",
  gold: "#C9A84C",
  cream: "#FAF7F2",
  dark: "#0D1F1C",
  charcoal: "#1A2E2A",
} as const;

export default function DoctorsClient({ doctors }: { doctors: any[] }) {
  const loading = false;

  return (
    <main className="book-page min-vh-100" style={{ background: THEME.dark, overflowX: "hidden" }}>
      <DoctorsStyles />
      <PublicNavbar currentPage="doctors" />

      {/* ── Background Elements ── */}
      <div className="book-grid-bg" />
      <div className="book-glow book-glow-1" />
      <div className="book-glow book-glow-2" />

      <div className="container position-relative py-5" style={{ zIndex: 1 }}>
        
        {/* ── Header ── */}
        <div className="text-center mb-5">
          <div className="book-header-badge mb-4">
            <i className="bi bi-stars me-2"></i>Our Medical Team
          </div>
          <h1 className="book-title">
            Meet Our <span className="book-title-accent">Specialists</span>
          </h1>
          <p className="book-subtitle">
            World-class clinical excellence delivered with personalized care by the finest dental surgeons in the region.
          </p>
        </div>

        {/* ── Doctors Grid ── */}
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-accent" style={{ color: THEME.accent }} role="status"></div>
          </div>
        ) : (
          <div className="row g-4 justify-content-center">
            {doctors.map((doc, index) => (
              <div key={doc.id} className="col-12 col-md-6 col-lg-3" style={{ animation: `slideInUp 0.5s ease forwards ${index * 0.1}s`, opacity: 0 }}>
                <div className="doc-card">
                  <div className="doc-img-container">
                    {doc.image ? (
                      <Image
                        src={doc.image}
                        alt={doc.name}
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #086351 0%, #0a7d66 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontSize: '3.5rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, letterSpacing: 2 }}>
                        {doc.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    )}
                    <div className="doc-overlay">
                       <Link href="/book" className="doc-book-btn">
                         Book Appointment
                       </Link>
                    </div>
                  </div>
                  <div className="doc-info">
                    <div className="doc-role-tag">{doc.role}</div>
                    <h3 className="doc-name">{doc.name}</h3>
                    <div className="doc-status">
                      <span className="doc-pulse"></span> Available Today
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Call to Action ── */}
        {!loading && (
          <div className="text-center mt-5 pt-4">
            <Link href="/book" className="book-btn-primary">
              <i className="bi bi-calendar-plus me-2"></i>Book Your Consultation
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Custom Styles ────────────────────────────────────────────────────────────
const DoctorsStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;600;700&display=swap');
    @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css');

    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    /* ── Reuse Booking Background Styles ── */
    .book-grid-bg {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image: linear-gradient(rgba(98,182,183,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(98,182,183,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .book-glow { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
    .book-glow-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(8,99,81,0.20) 0%, transparent 70%); top: -150px; left: -150px; animation: float 10s infinite; }
    .book-glow-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(98,182,183,0.12) 0%, transparent 70%); bottom: -100px; right: -100px; animation: float 8s infinite reverse; }

    /* ── Header ── */
    .book-header-badge { display: inline-flex; align-items: center; border: 1px solid #C9A84C; border-radius: 2px; padding: 0.35rem 1rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #C9A84C; }
    .book-title { font-family: 'Playfair Display', serif; font-size: clamp(2.5rem, 6vw, 3.5rem); font-weight: 700; color: #FAF7F2; line-height: 1.1; margin-top: 1rem; }
    .book-title-accent { color: #62B6B7; font-style: italic; }
    .book-subtitle { color: rgba(255,255,255,0.45); font-size: 1.1rem; max-width: 600px; margin: 1.5rem auto; line-height: 1.7; }

    /* ── New Doctor Cards ── */
    .doc-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(98,182,183,0.12);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
      height: 100%;
    }
    .doc-card:hover {
      transform: translateY(-12px);
      border-color: #C9A84C;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      background: rgba(255,255,255,0.06);
    }
    .doc-img-container {
      position: relative;
      height: 340px;
      width: 100%;
      overflow: hidden;
      background: #0D1F1C;
    }
    .doc-img-container img { transition: transform 0.6s ease; }
    .doc-card:hover .doc-img-container img { transform: scale(1.08); }
    
    .doc-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(13,31,28,0.9), transparent);
      display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 2rem; opacity: 0; transition: 0.3s;
    }
    .doc-card:hover .doc-overlay { opacity: 1; }
    .doc-book-btn {
      background: #C9A84C; color: #0D1F1C; text-decoration: none;
      padding: 0.6rem 1.2rem; border-radius: 50px; font-weight: 700; font-size: 0.8rem;
      text-transform: uppercase; letter-spacing: 1px;
    }

    .doc-info { padding: 1.5rem; }
    .doc-role-tag {
      font-size: 0.65rem; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: #62B6B7; margin-bottom: 0.5rem;
    }
    .doc-name {
      font-family: 'Playfair Display', serif;
      color: #FAF7F2; font-size: 1.4rem; margin-bottom: 0.75rem;
    }
    .doc-status {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.75rem; color: rgba(255,255,255,0.4);
    }
    .doc-pulse {
      width: 8px; height: 8px; background: #22c55e; border-radius: 50%;
      box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
      animation: pulse-green 2s infinite;
    }
    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }

    .book-btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #086351, #62B6B7);
      color: #fff; border: none; border-radius: 8px;
      padding: 1rem 2rem; font-size: 0.9rem; font-weight: 700;
      letter-spacing: 0.5px; text-decoration: none; transition: all 0.3s ease;
    }
    .book-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(8,99,81,0.4); color: white; }
  `}} />
);