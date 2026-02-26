"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";

export default function DynamicServicePage() {
  const params = useParams();
  const slug = params.slug; 

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      const supabase = createClient();
      
      // Using maybeSingle() to gracefully handle incorrect URLs without crashing!
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .maybeSingle(); 

      if (data) setService(data);
      if (error) console.error("Supabase Error:", error.message || "Unknown error");
      
      setLoading(false);
    };

    if (slug) fetchServiceDetails();
  }, [slug]);

  // --- SCREEN 1: Loading State ---
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // --- SCREEN 2: 404 Not Found ---
  if (!service) {
    return (
      <main className="container text-center d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <h1 className="display-1 fw-bold text-danger">404</h1>
        <h2 className="mb-4">Service Not Found</h2>
        <p className="text-muted mb-4">We couldn't find the dental service you're looking for.</p>
        <Link href="/#services" className="btn btn-secondary rounded-pill px-4 py-2">Return to Services</Link>
      </main>
    );
  }

  // Helper to check if any gallery images exist
  const hasGalleryImages = service.image1 || service.image2 || service.image3;

  // --- SCREEN 3: The Dynamic Page ---
  return (
    <main style={{ paddingTop: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh' }} className="pb-5">
      
      {/* Small Navbar */}
      <nav className="navbar navbar-light bg-white shadow-sm fixed-top">
        <div className="container">
          <Link href="/" className="navbar-brand fw-bold d-flex align-items-center gap-2">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${service.color} 0%, #2d3748 100%)` }}>
              <i className="bi bi-heart-pulse-fill text-white fs-5"></i>
            </div>
            Alaya Dental Care
          </Link>
          <Link href="/#services" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
            <i className="bi bi-arrow-left me-1"></i> Back
          </Link>
        </div>
      </nav>

      <div className="container mt-5 pt-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg border-0 p-4 p-md-5" style={{ borderRadius: '30px' }}>
              
              <div className="text-center border-bottom pb-5 mb-5">
                {/* Dynamic Icon & Color */}
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-4 shadow-sm" style={{ width: '100px', height: '100px', backgroundColor: `${service.color}15` }}>
                  <i className={`bi ${service.icon} display-4`} style={{ color: service.color }}></i>
                </div>

                <h1 className="fw-bolder display-4 mb-3" style={{ color: service.color }}>
                  {service.title}
                </h1>
                
                {/* Fallback to short description if full description is empty */}
                <p className="lead text-secondary mt-3 mx-auto" style={{ lineHeight: '1.8', maxWidth: '800px', whiteSpace: 'pre-line' }}>
                  {service.full_description || service.description}
                </p>
              </div>
              
              {/* THE IMAGE GALLERY GRID */}
              {hasGalleryImages && (
                <div className="mb-5">
                  <h4 className="fw-bold mb-4 text-center">Treatment Gallery</h4>
                  <div className="row g-4 justify-content-center">
                    {service.image1 && (
                      <div className="col-md-4">
                        <img src={service.image1} alt={`${service.title} Example 1`} className="img-fluid rounded-4 shadow-sm w-100" style={{ height: '250px', objectFit: 'cover' }} />
                      </div>
                    )}
                    {service.image2 && (
                      <div className="col-md-4">
                        <img src={service.image2} alt={`${service.title} Example 2`} className="img-fluid rounded-4 shadow-sm w-100" style={{ height: '250px', objectFit: 'cover' }} />
                      </div>
                    )}
                    {service.image3 && (
                      <div className="col-md-4">
                        <img src={service.image3} alt={`${service.title} Example 3`} className="img-fluid rounded-4 shadow-sm w-100" style={{ height: '250px', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-4 d-flex flex-wrap justify-content-center gap-3">
                <Link href="/book" className="btn btn-lg text-white rounded-pill px-5 shadow-sm hover-lift" style={{ backgroundColor: service.color, transition: 'all 0.3s' }}>
                  <i className="bi bi-calendar-check me-2"></i> Book Appointment Now
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}