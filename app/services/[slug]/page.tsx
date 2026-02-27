"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const THEME = {
  primary: "#086351",
  accent: "#62B6B7",
  gold: "#C9A84C",
  cream: "#FAF7F2",
  dark: "#0D1F1C",
  charcoal: "#1A2E2A",
};

export default function DynamicServicePage() {
  const params = useParams();
  const slug = params.slug;

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await fetch(`/api/services/detail?slug=${slug}`);
        const result = await response.json();
        if (response.ok && result.data) {
          setService(result.data);
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchServiceDetails();
  }, [slug]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: THEME.dark }}>
      <div className="spinner-border" style={{ color: THEME.accent }}></div>
    </div>
  );

  if (!service) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center text-center" style={{ background: THEME.dark, color: THEME.cream }}>
      <h1 className="display-1 fw-bold" style={{ color: THEME.gold }}>404</h1>
      <p className="text-white-50">Service details could not be found.</p>
      <Link href="/" className="book-btn-outline mt-3 text-decoration-none">Return Home</Link>
    </div>
  );

  return (
    <main className="book-page min-vh-100 pb-5" style={{ background: THEME.dark, overflowX: "hidden" }}>
      <DetailStyles />
      
      {/* ── Top Nav ── */}
      <nav className="book-topnav">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <Link href="/" className="d-flex align-items-center gap-3 text-decoration-none">
            <div className="book-logo-wrap">
              <div className="book-logo-glow" />
              <div style={{ position: "relative", zIndex: 1, margin: 3 }}>
                <Image src="/images/adc.png" alt="Alaya" width={44} height={44} style={{ borderRadius: 7, background: "#fff", padding: 2, objectFit: "contain" }} />
              </div>
            </div>
            <div className="d-none d-sm-block">
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem", color: THEME.cream, lineHeight: 1.1 }}>Alaya Dental Care</div>
              <div style={{ fontSize: "0.6rem", letterSpacing: "2px", textTransform: "uppercase", color: THEME.gold }}>Premium Dental Studio</div>
            </div>
          </Link>
          <Link href="/services" className="book-back-btn"><i className="bi bi-arrow-left me-2"></i> All Services</Link>
        </div>
      </nav>

      {/* ── Background ── */}
      <div className="book-grid-bg" />
      <div className="book-glow book-glow-1" />

      <div className="container position-relative py-5" style={{ zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            
            {/* ── Header ── */}
            <div className="text-center mb-5">
              <div className="service-icon-circle mb-4" style={{ backgroundColor: `${service.color || THEME.gold}20` }}>
                 <i className={`bi ${service.icon || 'bi-stars'}`} style={{ color: service.color || THEME.gold }}></i>
              </div>
              <h1 className="detail-title">{service.title}</h1>
              <div className="detail-underline mx-auto"></div>
            </div>

            <div className="detail-card">
              <div className="p-4 p-md-5">
                <p className="detail-text">
                  {service.full_description || service.description}
                </p>

                {/* Gallery */}
                {(service.image1 || service.image2 || service.image3) && (
                  <div className="mt-5">
                    <h4 className="gallery-title mb-4">Treatment Gallery</h4>
                    <div className="row g-4">
                      {[service.image1, service.image2, service.image3].filter(Boolean).map((img, i) => (
                        <div key={i} className="col-md-4">
                          <div className="gallery-img-wrap">
                            <img src={img} alt="Clinical view" className="img-fluid" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center mt-5">
                   <Link href="/book" className="book-btn-primary text-decoration-none">
                     <i className="bi bi-calendar-check me-2"></i> Book This Treatment
                   </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

const DetailStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;600;700&display=swap');
    
    .book-grid-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(98,182,183,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(98,182,183,0.04) 1px, transparent 1px); background-size: 60px 60px; }
    .book-glow-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(8,99,81,0.20) 0%, transparent 70%); position: fixed; top: -150px; left: -150px; filter: blur(90px); }
    .book-topnav { position: sticky; top: 0; z-index: 100; background: rgba(13,31,28,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(201,168,76,0.10); }
    .book-logo-glow { position: absolute; inset: -3px; border-radius: 11px; background: linear-gradient(135deg, #086351, #62B6B7); }
    .book-back-btn { display: inline-flex; align-items: center; font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.5); text-decoration: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0.4rem 1rem; }

    .service-icon-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto; border: 1px solid rgba(255,255,255,0.05); }
    .detail-title { font-family: 'Playfair Display', serif; color: #FAF7F2; font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 700; }
    .detail-underline { width: 80px; height: 4px; background: #C9A84C; border-radius: 2px; }
    
    .detail-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(98,182,183,0.1); border-radius: 30px; backdrop-filter: blur(10px); }
    .detail-text { color: rgba(255,255,255,0.7); font-size: 1.15rem; line-height: 1.9; white-space: pre-line; text-align: center; }

    .gallery-title { font-family: 'Playfair Display', serif; color: #FAF7F2; text-align: center; font-size: 1.5rem; }
    .gallery-img-wrap { border-radius: 15px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); height: 250px; }
    .gallery-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    .gallery-img-wrap:hover img { transform: scale(1.05); }

    .book-btn-primary { background: linear-gradient(135deg, #086351, #62B6B7); color: #fff; border: none; border-radius: 8px; padding: 1rem 2.5rem; font-weight: 700; transition: 0.3s; display: inline-block; }
    .book-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(8,99,81,0.3); color: white; }
    .book-btn-outline { color: #C9A84C; border: 1px solid #C9A84C; padding: 0.5rem 1.5rem; border-radius: 50px; }
  ` }} />
);