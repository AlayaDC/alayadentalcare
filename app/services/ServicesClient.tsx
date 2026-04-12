"use client";

import Link from "next/link";
import Image from "next/image";
import PublicNavbar from "../../components/PublicNavbar";

// Use your local project installations to prevent CSS/CDN import errors
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// ─── Theme (matches home & book page exactly) ─────────────────────────────────
const THEME = {
  primary: "#086351",
  accent: "#62B6B7",
  gold: "#C9A84C",
  cream: "#FAF7F2",
  dark: "#0D1F1C",
  charcoal: "#1A2E2A",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PriceTier {
  label: string;
  amount: number;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  slug: string;
  position: number;
  prices?: PriceTier[];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ServicesClient({ services }: { services: Service[] }) {
  const loading = false;

  return (
    <main
      className="book-page min-vh-100"
      style={{ background: THEME.dark, overflowX: "hidden" }}
    >
      <ServiceStyles />
      <PublicNavbar currentPage="services" />

      {/* ── Grid background ── */}
      <div className="book-grid-bg" />

      {/* ── Glow orbs ── */}
      <div className="book-glow book-glow-1" />
      <div className="book-glow book-glow-2" />

      <div className="container position-relative py-5" style={{ zIndex: 1 }}>

        {/* ── Page Header ── */}
        <div className="text-center mb-5">
          <div className="book-header-badge mb-4">
            <i className="bi bi-shield-heart me-2"></i>Excellence in Care
          </div>
          <h1 className="book-title">
            Our <span className="book-title-accent">Specialized</span> Services
          </h1>
          <p className="book-subtitle">
            Combining advanced technology with artistic precision to give you the smile you deserve.
          </p>
        </div>

        {/* ── Services Grid ── */}
        <div className="row g-4 justify-content-center">
          
          {loading ? (
            // Custom Luxury Loading State
            <div className="col-12 py-5 text-center d-flex flex-column align-items-center">
              <div className="service-loading-ring mb-3"></div>
              <p style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.8rem" }}>
                Loading Services...
              </p>
            </div>
          ) : services.length === 0 ? (
            // Fallback if no services are found
            <div className="col-12 text-center py-5">
              <p style={{ color: "rgba(255,255,255,0.4)" }}>No services found at the moment.</p>
            </div>
          ) : (
            // Dynamic Services Mapping
            services.map((svc, idx) => (
              <div 
                key={svc.id} 
                className="col-12 col-md-6 col-lg-4 d-flex" 
                style={{ animation: `fadeInUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) forwards ${idx * 0.1}s`, opacity: 0 }}
              >
                <Link href={`/services/${svc.slug}`} className="text-decoration-none w-100">
                  <div className="service-card">
                    
                    {/* Decorative Number */}
                    <div className="service-card-number">{String(idx + 1).padStart(2, '0')}</div>

                    <div className="service-icon-box">
                      <i className={`bi ${svc.icon || "bi-stars"}`}></i>
                    </div>
                    
                    <div className="service-content">
                      <h3 className="service-title">{svc.title}</h3>
                      <p className="service-desc">{svc.description}</p>
                      {(() => {
                        const prices = svc.prices;
                        if (!Array.isArray(prices) || prices.length === 0) return null;
                        const amounts = prices.map(p => Number(p.amount) || 0).filter(a => a > 0);
                        if (amounts.length === 0) return null;
                        const min = Math.min(...amounts);
                        return (
                          <div className="service-price-tag">
                            Starting from <span>&#8377;{min.toLocaleString("en-IN")}</span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="service-card-footer">
                      <span className="service-link-text">Explore Treatment</span>
                      <i className="bi bi-arrow-right"></i>
                    </div>
                    
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
        
        {/* ── Bottom CTA ── */}
        {!loading && (
          <div className="text-center mt-5 pt-4" style={{ animation: "fadeInUp 0.6s ease forwards 0.8s", opacity: 0 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1rem", fontSize: "0.95rem" }}>
              Not sure which treatment is right for you?
            </p>
            <Link href="/book" className="book-btn-primary">
              <i className="bi bi-calendar-check me-2"></i>Book a Consultation
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}

// ─── All Styles ───────────────────────────────────────────────────────────────
const ServiceStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --primary: #086351;
      --accent:  #62B6B7;
      --gold:    #C9A84C;
      --cream:   #FAF7F2;
      --dark:    #0D1F1C;
      --charcoal:#1A2E2A;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

    /* ── Keyframes ── */
    @keyframes float {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-22px); }
    }
    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 0 rgba(8,99,81,0.5); }
      50%      { box-shadow: 0 0 0 10px rgba(8,99,81,0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* ── Grid bg & Glows ── */
    .book-grid-bg {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image: linear-gradient(rgba(98,182,183,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(98,182,183,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .book-glow {
      position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0;
    }
    .book-glow-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(8,99,81,0.20) 0%, transparent 70%);
      top: -150px; left: -150px;
      animation: float 10s ease-in-out infinite;
    }
    .book-glow-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(98,182,183,0.12) 0%, transparent 70%);
      bottom: -100px; right: -100px;
      animation: float 8s ease-in-out infinite reverse;
    }

    /* ── Header ── */
    .book-header-badge {
      display: inline-flex; align-items: center;
      border: 1px solid var(--gold); border-radius: 2px;
      padding: 0.35rem 1rem; font-size: 0.72rem; font-weight: 700;
      letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold);
    }
    .book-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2rem, 5vw, 3.2rem);
      font-weight: 700; color: var(--cream); line-height: 1.15;
      margin: 0.75rem 0 0.5rem;
    }
    .book-title-accent { color: var(--accent); font-style: italic; }
    .book-subtitle {
      color: rgba(255,255,255,0.45); font-size: 1rem;
      max-width: 500px; margin: 0 auto 2rem; line-height: 1.7;
    }

    /* ── Loading Spinner ── */
    .service-loading-ring {
      width: 50px; height: 50px;
      border-radius: 50%;
      border: 3px solid rgba(98,182,183,0.1);
      border-top-color: var(--accent);
      animation: spin-slow 1s linear infinite;
    }

    /* ── Service Cards ── */
    .service-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(98,182,183,0.10);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    
    .service-card:hover {
      background: rgba(98,182,183,0.06);
      border-color: rgba(98,182,183,0.3);
      transform: translateY(-8px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.2);
    }

    .service-card-number {
      position: absolute; 
      top: -5px; 
      right: 15px;
      font-family: 'Playfair Display', serif;
      font-size: 5rem; 
      font-weight: 900;
      color: rgba(255,255,255,0.02);
      pointer-events: none;
      transition: all 0.4s ease;
      line-height: 1;
    }
    .service-card:hover .service-card-number { 
      color: rgba(98,182,183,0.06); 
      transform: translateY(10px) scale(1.05); 
    }

    .service-icon-box {
      width: 56px; height: 56px;
      background: rgba(98,182,183,0.1);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: var(--accent); font-size: 1.6rem;
      margin-bottom: 2rem;
      transition: all 0.4s ease;
    }
    .service-card:hover .service-icon-box { 
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #fff;
      transform: scale(1.1);
      box-shadow: 0 8px 20px rgba(8,99,81,0.3);
    }

    .service-content {
      flex-grow: 1;
    }

    .service-title { 
      font-family: 'Playfair Display', serif; 
      color: var(--cream); 
      font-size: 1.4rem; 
      font-weight: 700;
      margin-bottom: 1rem; 
    }
    .service-desc {
      color: rgba(255,255,255,0.5);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .service-price-tag {
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }
    .service-price-tag span {
      color: var(--gold);
      font-family: 'Playfair Display', serif;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .service-card-footer { 
      display: flex; align-items: center; justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 1.25rem;
      color: var(--accent); 
      font-weight: 600; 
      font-size: 0.85rem; 
      text-transform: uppercase; 
      letter-spacing: 1.5px; 
      transition: all 0.3s ease; 
    }
    
    .service-card-footer i {
      font-size: 1.1rem;
      transition: transform 0.3s ease;
    }

    .service-card:hover .service-card-footer { 
      color: var(--gold); 
      border-color: rgba(201,168,76,0.15);
    }
    .service-card:hover .service-card-footer i {
      transform: translateX(5px);
    }

    /* ── Buttons ── */
    .book-btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #fff; border: none; border-radius: 8px;
      padding: 0.85rem 1.75rem; font-size: 0.9rem; font-weight: 700;
      letter-spacing: 0.5px; cursor: pointer; text-decoration: none;
      transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(8,99,81,0.30);
    }
    .book-btn-primary:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 28px rgba(8,99,81,0.40); 
      color: #fff;
    }
  `}} />
);