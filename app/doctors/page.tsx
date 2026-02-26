"use client";

import { useEffect, useState } from "react"; 
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Your Supabase Bridge (Notice the two ../../ because we are deeper in the folders now!)
import { createClient } from "../../utils/supabase/client";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const themeColor = '#086351';
  const accentColor = '#62B6B7';

  useEffect(() => {
    // Start the scroll animations
    AOS.init({ 
      duration: 600, 
      offset: 20,       
      once: true,
      easing: 'ease-out-cubic',
    });

    // Fetch ALL doctors, ordered by position (No limit!)
    const fetchAllDoctors = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('position', { ascending: true });
      
      if (data) {
        setDoctors(data);
      }
      if (error) {
        console.error("Error fetching doctors:", error);
      }
    };
    
    fetchAllDoctors();
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* We reuse your gorgeous CSS so this page matches the home page perfectly */}
      <style dangerouslySetInnerHTML={{__html: `
        .gradient-text {
          background: linear-gradient(135deg, ${themeColor} 0%, ${accentColor} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
        }
        .doctor-card {
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .doctor-card:hover .doctor-img {
          transform: scale(1.08);
        }
        .doctor-img {
          transition: transform 0.5s ease;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(8, 99, 81, 0.1);
        }
      `}} />

      {/* Navigation (Sticky & Glass Effect) */}
      <nav className="navbar navbar-expand-lg sticky-top glass-effect py-3 shadow-sm" style={{ zIndex: 1020 }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" href="/#home">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', background: `linear-gradient(135deg, ${themeColor} 0%, ${accentColor} 100%)` }}>
              <i className="bi bi-heart-pulse-fill text-white fs-5"></i>
            </div>
            <span className="fw-bold fs-4 gradient-text">Alaya Dental Care</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            <Link href="/#doctors" className="text-decoration-none fw-semibold text-muted hover-lift">
              <i className="bi bi-arrow-left me-2"></i>Back Home
            </Link>
            <Link 
              href="/book" 
              className="btn text-white fw-semibold px-4 py-2 border-0 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #086351 0%, #62B6B7 100%)',
                borderRadius: '25px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.transform = 'scale(1)'}
            >
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="container py-5 mt-4 text-center" data-aos="fade-up">
        <span className="badge px-4 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(8, 99, 81, 0.1)', color: themeColor }}>
          Our Complete Team
        </span>
        <h1 className="display-4 fw-bold mb-3">
          Meet Our <span className="gradient-text">Experts</span>
        </h1>
        <p className="lead text-muted mx-auto mb-5" style={{ maxWidth: '600px' }}>
          Get to know the passionate, certified professionals dedicated to giving you the perfect smile. We pride ourselves on having the best team in the industry.
        </p>

        {/* The Grid of ALL Doctors */}
        <div className="row g-4 text-start mb-5 pb-5">
          {doctors.length > 0 ? doctors.map((doctor, idx) => (
            <div className="col-md-6 col-lg-3" key={idx} data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="card border-0 shadow-sm hover-lift doctor-card overflow-hidden h-100" style={{ borderRadius: '20px' }}>
                <div className="position-relative overflow-hidden" style={{ height: '300px' }}>
                  <img 
                    src={doctor.image} 
                    alt={doctor.name} 
                    className="w-100 h-100 doctor-img"
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                  />
                  <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <h5 className="fw-bold text-white mb-1">{doctor.name}</h5>
                    <p className="text-white-50 mb-0 small">{doctor.role}</p>
                  </div>
                </div>
                <div className="card-body text-center p-3">
                  <div className="d-flex justify-content-center gap-2">
                    <a href="#" className="btn btn-sm btn-light rounded-circle" style={{ width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-facebook" style={{ color: themeColor }}></i>
                    </a>
                    <a href="#" className="btn btn-sm btn-light rounded-circle" style={{ width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-linkedin" style={{ color: themeColor }}></i>
                    </a>
                    <a href="#" className="btn btn-sm btn-light rounded-circle" style={{ width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-envelope" style={{ color: themeColor }}></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Loading our expert team...</p>
            </div>
          )}
        </div>
      </div>

      {/* Reusing your Footer so the page feels complete */}
      <footer className="bg-dark text-white py-4 mt-auto">
        <div className="container py-3">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                <i className="bi bi-heart-pulse-fill fs-5" style={{ color: accentColor }}></i>
                <h5 className="fw-bold mb-0">Alaya Dental Care</h5>
              </div>
              <p className="text-white-50 mb-0 small">© 2026 Alaya Dental Care. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div className="d-flex gap-3 justify-content-center justify-content-md-end">
                <a href="#" className="text-white-50 text-decoration-none hover-opacity"><i className="bi bi-facebook fs-5"></i></a>
                <a href="#" className="text-white-50 text-decoration-none hover-opacity"><i className="bi bi-instagram fs-5"></i></a>
                <a href="#" className="text-white-50 text-decoration-none hover-opacity"><i className="bi bi-whatsapp fs-5"></i></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}