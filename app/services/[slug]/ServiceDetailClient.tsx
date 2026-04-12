"use client";

import Link from "next/link";
import "bootstrap-icons/font/bootstrap-icons.css";
import PublicNavbar from "../../../components/PublicNavbar";

// ─── Constants ────────────────────────────────────────────────────────────────
const THEME = {
  primary: "#086351",
  accent: "#62B6B7",
  gold: "#C9A84C",
  cream: "#FAF7F2",
  dark: "#0D1F1C",
  charcoal: "#1A2E2A",
} as const;

export default function ServiceDetailClient({ service }: { service: any | null }) {
  if (!service) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center text-center" style={{ background: THEME.dark, color: THEME.cream }}>
        <DetailStyles />
        <div className="service-icon-wrap-large mb-4">
          <i className="bi bi-exclamation-triangle" style={{ color: THEME.gold }}></i>
        </div>
        <h1 className="font-serif fw-bold mb-3" style={{ fontSize: "3rem" }}>Treatment Not Found</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "2rem" }}>We couldn't locate the details for this specific service.</p>
        <Link href="/services" className="btn-luxury-primary">
          <span>Return to Services</span>
        </Link>
      </div>
    );
  }

  return (
    <main className="service-detail-page" style={{ background: THEME.cream, minHeight: "100vh" }}>
      <DetailStyles />
      <PublicNavbar currentPage="services" />

      {/* ── Hero Banner ── */}
      <section className="service-hero">
        <div className="hero-bg-pattern" />
        <div className="container position-relative py-5" style={{ zIndex: 2 }}>
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="service-icon-wrap-large">
                  <i className={`bi ${service.icon || 'bi-stars'}`}></i>
                </div>
                <div className="badge-luxury">Premium Treatment</div>
              </div>
              <h1 className="hero-title">{service.title}</h1>
              <div className="hero-divider"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <section className="py-5">
        <div className="container">
          <div className="row g-5">
            
            {/* Left Column: Content Flow */}
            <div className="col-lg-8">
              
              {/* 1. Short Description */}
              {service.description && (
                <div className="content-card mb-5">
                  <h3 className="font-serif mb-4" style={{ color: THEME.charcoal, fontSize: "1.8rem" }}>About This Treatment</h3>
                  <div className="service-description format-long-text">
                    {service.description}
                  </div>
                </div>
              )}

              {/* 2. Gallery Section */}
              {(service.image1 || service.image2 || service.image3) && (
                <div className="gallery-section mb-5">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <h3 className="font-serif m-0" style={{ color: THEME.charcoal, fontSize: "1.8rem" }}>Treatment Images</h3>
                    <div style={{ height: 1, background: "rgba(8,99,81,0.1)", flexGrow: 1 }} />
                  </div>
                  
                  <div className="row g-4">
                    {[service.image1, service.image2, service.image3].filter(Boolean).map((img, i) => (
                      <div key={i} className="col-md-4 col-sm-6">
                        <div className="gallery-image-wrap">
                          <img src={img} alt={`${service.title} view ${i + 1}`} />
                          <div className="gallery-overlay">
                            <i className="bi bi-zoom-in text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Full Detailed Explanation */}
              {service.full_description && (
                <div className="content-card mb-5">
                  <h3 className="font-serif mb-4" style={{ color: THEME.charcoal, fontSize: "1.8rem" }}>Detailed Explanation</h3>
                  <div className="service-full-description format-long-text">
                    {service.full_description}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Sticky Booking Card */}
            <div className="col-lg-4">
              <div className="sticky-booking-card">
                <div className="card-header text-center">
                  <h4 className="font-serif text-white m-0" style={{ fontSize: "1.3rem" }}>Ready to transform your smile?</h4>
                </div>
                <div className="card-body">

                  {/* Price Tiers */}
                  {Array.isArray(service.prices) && service.prices.filter((p: any) => p.label && Number(p.amount) > 0).length > 0 && (
                    <div className="pricing-section mb-4">
                      <div className="pricing-label">Treatment Pricing</div>
                      {service.prices.filter((p: any) => p.label && Number(p.amount) > 0).map((tier: any, i: number) => (
                        <div key={i} className="price-tier-item">
                          <span className="tier-label">{tier.label}</span>
                          <span className="tier-price">&#8377;{Number(tier.amount).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="quick-facts mb-4">
                    <div className="fact-item">
                      <i className="bi bi-clock text-accent"></i>
                      <div>
                        <div className="fact-label">Est. Duration</div>
                        <div className="fact-value">Consultation Required</div>
                      </div>
                    </div>
                    <div className="fact-item">
                      <i className="bi bi-shield-check text-accent"></i>
                      <div>
                        <div className="fact-label">Safety</div>
                        <div className="fact-value">100% Sterilized</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-center mb-4" style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                    Schedule a consultation with our expert team to discuss if {service.title} is right for you.
                  </p>
                  
                  <Link href="/book" className="btn-luxury-primary w-100 justify-content-center">
                    <span>
                      <i className="bi bi-calendar-check me-2"></i> Book Appointment
                    </span>
                  </Link>

                  <div className="text-center mt-3">
                    <a href="tel:+918848659365" className="text-decoration-none" style={{ fontSize: "0.8rem", color: THEME.gold, fontWeight: 600 }}>
                      <i className="bi bi-telephone-fill me-1"></i> Or call +91 8848659365
                    </a>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const DetailStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    /* Utilities */
    .font-serif { font-family: 'Playfair Display', Georgia, serif; }
    .text-accent { color: ${THEME.accent}; }
    .gradient-text {
      background: linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.accent} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Fix for long unbroken text overflowing the container */
    .format-long-text {
      white-space: pre-wrap;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    /* Animations */
    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 0 rgba(8,99,81,0.35); }
      50%      { box-shadow: 0 0 0 10px rgba(8,99,81,0); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* Hero Section */
    .service-hero {
      background: ${THEME.dark};
      position: relative;
      overflow: hidden;
      padding: 4rem 0 3rem;
      border-bottom: 4px solid ${THEME.gold};
    }
    .hero-bg-pattern {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(98,182,183,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(98,182,183,0.05) 1px, transparent 1px);
      background-size: 40px 40px;
      opacity: 0.5;
    }
    .service-hero::after {
      content: '';
      position: absolute;
      top: -150px; right: -150px;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(98,182,183,0.15) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(60px);
    }
    .service-icon-wrap-large {
      width: 70px;
      height: 70px;
      border-radius: 2px;
      background: rgba(201,168,76,0.1);
      border: 1px solid rgba(201,168,76,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: ${THEME.gold};
    }
    .badge-luxury {
      border: 1px solid ${THEME.accent};
      color: ${THEME.accent};
      padding: 0.35rem 1rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .hero-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 700;
      color: #fff;
      line-height: 1.1;
      margin: 0;
    }
    .hero-divider {
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, ${THEME.gold}, ${THEME.accent});
      margin-top: 1.5rem;
    }

    /* Content Area */
    .content-card {
      background: #fff;
      padding: 3rem;
      border-radius: 4px;
      box-shadow: 0 10px 40px rgba(8,99,81,0.05);
      border: 1px solid rgba(8,99,81,0.05);
    }
    .service-description {
      color: #4A5553;
      font-size: 1.05rem;
      line-height: 1.9;
    }
    /* Drop-cap for the short description */
    .service-description::first-letter {
      color: ${THEME.primary};
      float: left;
      font-family: 'Playfair Display', serif;
      font-size: 3.5rem;
      line-height: 0.8;
      padding-top: 4px;
      padding-right: 8px;
      padding-left: 3px;
    }
    
    .service-full-description {
      color: #4A5553;
      font-size: 1rem;
      line-height: 2;
    }

    /* Gallery */
    .gallery-image-wrap {
      position: relative;
      border-radius: 4px;
      overflow: hidden;
      aspect-ratio: 4/3;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      cursor: pointer;
    }
    .gallery-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
    }
    .gallery-overlay {
      position: absolute;
      inset: 0;
      background: rgba(13,31,28,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .gallery-image-wrap:hover img { transform: scale(1.08); }
    .gallery-image-wrap:hover .gallery-overlay { opacity: 1; }

    /* Sticky Booking Card */
    .sticky-booking-card {
      position: sticky;
      top: 100px;
      background: ${THEME.charcoal};
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(13,31,28,0.15);
      border: 1px solid rgba(201,168,76,0.15);
    }
    .sticky-booking-card .card-header {
      background: ${THEME.dark};
      padding: 1.5rem;
      border-bottom: 2px solid ${THEME.gold};
    }
    .sticky-booking-card .card-body {
      padding: 2rem 1.5rem;
    }
    .quick-facts {
      background: rgba(255,255,255,0.03);
      border-radius: 4px;
      padding: 1.25rem;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .fact-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .fact-item:last-child { margin-bottom: 0; }
    .fact-item i { font-size: 1.5rem; }
    .fact-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); }
    .fact-value { font-size: 0.95rem; font-weight: 600; color: #fff; }

    /* Buttons */
    .btn-luxury-primary {
      background: ${THEME.dark};
      color: ${THEME.cream};
      border: 1.5px solid ${THEME.dark};
      border-radius: 4px;
      padding: 0.9rem 2rem;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: all 0.35s ease;
      position: relative;
      overflow: hidden;
    }
    .btn-luxury-primary::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, ${THEME.primary}, ${THEME.accent});
      opacity: 0;
      transition: opacity 0.35s ease;
    }
    .btn-luxury-primary:hover::before { opacity: 1; }
    .btn-luxury-primary:hover { color: #fff; border-color: transparent; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(8,99,81,0.2); }
    .btn-luxury-primary span, .btn-luxury-primary i { position: relative; z-index: 1; }

    /* Loading state */
    .loading-ring {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 2px solid rgba(8,99,81,0.1);
      border-top-color: ${THEME.primary};
      animation: spin-slow 0.9s linear infinite;
    }

    /* Pricing Section */
    .pricing-section {
      background: rgba(201,168,76,0.08);
      border: 1px solid rgba(201,168,76,0.2);
      border-radius: 4px;
      padding: 1.25rem;
    }
    .pricing-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${THEME.gold};
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    .price-tier-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .price-tier-item:last-child { border-bottom: none; }
    .tier-label {
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
      font-weight: 500;
    }
    .tier-price {
      color: #fff;
      font-size: 1.05rem;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
    }

    /* Responsive adjustments */
    @media (max-width: 991px) {
      .content-card { padding: 2rem 1.5rem; }
      .service-description::first-letter { font-size: 2.8rem; }
      .sticky-booking-card { position: relative; top: 0; margin-top: 2rem; }
    }
  ` }} />
);