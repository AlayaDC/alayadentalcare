"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";



// ─── Theme (matches home page exactly) ───────────────────────────────────────
const THEME = {
  primary: "#086351",
  accent: "#62B6B7",
  gold: "#C9A84C",
  cream: "#FAF7F2",
  dark: "#0D1F1C",
  charcoal: "#1A2E2A",
} as const;

// ─── Constants ────────────────────────────────────────────────────────────────
const LOCATIONS = [
  {
    value: "chettiyamkinar",
    label: "Chettiyamkinar Clinic",
    address: "Kozhichena Road, Kuttippala, Kerala 676501",
    icon: "bi-hospital-fill",
  },
  {
    value: "kurukathani",
    label: "Kurukathani Clinic",
    address: "Kurukathani, Perumanna Klari, Kerala 676551",
    icon: "bi-hospital-fill",
  },
];

const SERVICES = [
  { value: "checkup", label: "Checkup & Cleaning", icon: "bi-stars", duration: "45 min" },
  { value: "whitening", label: "Teeth Whitening", icon: "bi-diamond-fill", duration: "60 min" },
  { value: "treatment", label: "Dental Treatment", icon: "bi-shield-fill-check", duration: "60 min" },
  { value: "orthodontics", label: "Orthodontics", icon: "bi-brilliance", duration: "45 min" },
  { value: "implants", label: "Dental Implants", icon: "bi-plus-circle-fill", duration: "90 min" },
  { value: "emergency", label: "Emergency Care", icon: "bi-heart-pulse-fill", duration: "30 min" },
];

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", label: "IN" },
  { code: "+1",  flag: "🇺🇸", label: "US" },
  { code: "+44", flag: "🇬🇧", label: "GB" },
  { code: "+61", flag: "🇦🇺", label: "AU" },
  { code: "+971",flag: "🇦🇪", label: "AE" },
];

// Morning, Afternoon, Evening slot blocks
const TIME_SLOTS = {
  Morning: ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
  Afternoon: ["12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"],
  Evening: ["04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM"],
};

const TRUST_BADGES = [
  { icon: "bi-shield-check", label: "HIPAA Compliant" },
  { icon: "bi-clock-history", label: "Same Day Appointments" },
  { icon: "bi-star-fill", label: "5-Star Rated Care" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  countryCode: string;
  phone: string;
  location: string;
  service: string;
  date: string;
  time: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTodayString = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookAppointment() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    countryCode: "+91",
    phone: "",
    location: "chettiyamkinar",
    service: "checkup",
    date: "",
    time: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: info, Step 2: slot picker
  
  // NEW: State to hold dynamically fetched booked slots
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
 

  // Current step validation
  const step1Valid = formData.name.trim() && formData.phone.trim() && formData.location && formData.service;
  const step2Valid = formData.date && formData.time;

  // NEW: Fetch booked slots from Supabase whenever the date or location changes
 // ─── REMOVE the const supabase = createClient(); line ───

  // NEW: Fetch booked slots from VERCEL API instead of Supabase directly
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!formData.date || !formData.location) return;
      
      try {
        const response = await fetch(`/api/slots?date=${formData.date}&location=${formData.location}`);
        const result = await response.json();

        if (response.ok && result.data) {
          setBookedSlots(result.data.map((app: { time: string }) => app.time));
          
          // If the user had a time selected but someone else just booked it, reset it
          if (result.data.some((app: { time: string }) => app.time === formData.time)) {
            setFormData(prev => ({ ...prev, time: "" }));
          }
        }
      } catch (error) {
        console.error("Error fetching booked slots:", error);
      }
    };

    fetchBookedSlots();
  }, [formData.date, formData.location, formData.time]);

  // NEW: Send the ENTIRE booking to the unified Twilio+Supabase API route
 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Send to Database API
      const dbResponse = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // BULLETPROOF CHECK: Read text first to prevent JSON crash
      const responseText = await dbResponse.text();
      if (!responseText) throw new Error("API returned an empty response.");
      
      const dbResult = JSON.parse(responseText);

      if (dbResponse.ok && dbResult.success) {
        
        // 2. Database successful! Send WhatsApp (Run silently in background)
        fetch("/api/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }).catch(err => console.log("WhatsApp message skipped/failed:", err));

        // 3. Show Success Modal & Reset Form
        setShowModal(true);
        setFormData({
          name: "",
          countryCode: "+91",
          phone: "",
          location: "chettiyamkinar",
          service: "checkup",
          date: "",
          time: "",
        });
        setStep(1);

      } else {
        alert(dbResult.error || "Oops! Something went wrong saving your booking.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("System error. Check the terminal console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedService = SERVICES.find((s) => s.value === formData.service);
  const selectedLocation = LOCATIONS.find((l) => l.value === formData.location);

  return (
    <main
      className="book-page min-vh-100"
      style={{ background: THEME.dark, overflowX: "hidden" }}
    >
      <BookingStyles />

      {/* ── Top Nav Bar ── */}
      <nav className="book-topnav">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <Link href="/" className="d-flex align-items-center gap-3 text-decoration-none">
            <div className="book-logo-wrap">
              <div className="book-logo-glow" />
              <div style={{ position: "relative", zIndex: 1, margin: 3 }}>
                <Image
                  src="/images/adc.png"
                  alt="Alaya Dental Care"
                  width={44}
                  height={44}
                  priority
                  style={{
                    borderRadius: 7,
                    background: "#fff",
                    padding: 2,
                    display: "block",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem", color: THEME.cream, lineHeight: 1.1 }}>
                Alaya Dental Care
              </div>
              <div style={{ fontSize: "0.6rem", letterSpacing: "2px", textTransform: "uppercase", color: THEME.gold }}>
                Premium Dental Studio
              </div>
            </div>
          </Link>
          <Link href="/" className="book-back-btn">
            <i className="bi bi-arrow-left me-2"></i>Back to Home
          </Link>
        </div>
      </nav>

      {/* ── Grid background ── */}
      <div className="book-grid-bg" />

      {/* ── Glow orbs ── */}
      <div className="book-glow book-glow-1" />
      <div className="book-glow book-glow-2" />

      <div className="container position-relative py-5" style={{ zIndex: 1 }}>

        {/* ── Page Header ── */}
        <div className="text-center mb-5">
          <div className="book-header-badge mb-4">
            <i className="bi bi-calendar-heart me-2"></i>Schedule a Visit
          </div>
          <h1 className="book-title">
            Book Your <span className="book-title-accent">Appointment</span>
          </h1>
          <p className="book-subtitle">
            Fill in your details and pick a convenient slot. We'll confirm soon.
          </p>

          {/* Step indicator */}
          <div className="book-steps">
            <div className={`book-step ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`}>
              <div className="book-step-circle">
                {step > 1 ? <i className="bi bi-check-lg"></i> : "1"}
              </div>
              <span>Your Details</span>
            </div>
            <div className="book-step-line" style={{ background: step > 1 ? `linear-gradient(90deg, ${THEME.primary}, ${THEME.accent})` : "rgba(255,255,255,0.1)" }} />
            <div className={`book-step ${step >= 2 ? "active" : ""}`}>
              <div className="book-step-circle">2</div>
              <span>Pick a Slot</span>
            </div>
          </div>
        </div>

        <div className="row justify-content-center g-4">

          {/* ── Main Form Card ── */}
          <div className="col-lg-8">
            <form onSubmit={handleSubmit}>

              {/* ══ STEP 1: Details ══ */}
              {step === 1 && (
                <div className="book-card" style={{ animation: "slideInRight 0.4s ease forwards" }}>
                  <div className="book-card-header">
                    <div className="book-card-icon">
                      <i className="bi bi-person-lines-fill"></i>
                    </div>
                    <div>
                      <h5 className="mb-0" style={{ color: THEME.cream, fontFamily: "'Playfair Display', serif" }}>Personal Information</h5>
                      <p className="mb-0" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Step 1 of 2 — Tell us about yourself</p>
                    </div>
                  </div>

                  <div className="book-card-body">
                    {/* Name */}
                    <div className="book-field mb-4">
                      <label className="book-label">
                        <i className="bi bi-person-fill me-2"></i>Full Name
                      </label>
                      <input
                        type="text"
                        className="book-input"
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="book-field mb-4">
                      <label className="book-label">
                        <i className="bi bi-telephone-fill me-2"></i>Phone Number
                      </label>
                      <div className="book-phone-group">
                        <select
                          className="book-country-select"
                          value={formData.countryCode}
                          onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          className="book-input book-phone-input"
                          placeholder="8848659365"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Location — Card picker */}
                    <div className="book-field mb-4">
                      <label className="book-label">
                        <i className="bi bi-geo-alt-fill me-2"></i>Select Clinic
                      </label>
                      <div className="row g-3">
                        {LOCATIONS.map((loc) => (
                          <div className="col-sm-6" key={loc.value}>
                            <div
                              className={`book-option-card ${formData.location === loc.value ? "selected" : ""}`}
                              onClick={() => setFormData({ ...formData, location: loc.value })}
                            >
                              <div className="book-option-icon">
                                <i className={`bi ${loc.icon}`}></i>
                              </div>
                              <div>
                                <div className="book-option-title">{loc.label}</div>
                                <div className="book-option-sub">{loc.address}</div>
                              </div>
                              {formData.location === loc.value && (
                                <div className="book-option-check">
                                  <i className="bi bi-check-lg"></i>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Service — Card picker */}
                    <div className="book-field">
                      <label className="book-label">
                        <i className="bi bi-heart-pulse-fill me-2"></i>Service Type
                      </label>
                      <div className="row g-2">
                        {SERVICES.map((svc) => (
                          <div className="col-sm-6 col-lg-4" key={svc.value}>
                            <div
                              className={`book-service-card ${formData.service === svc.value ? "selected" : ""}`}
                              onClick={() => setFormData({ ...formData, service: svc.value })}
                            >
                              <i className={`bi ${svc.icon} book-service-icon`}></i>
                              <div className="book-service-label">{svc.label}</div>
                              <div className="book-service-duration">
                                <i className="bi bi-clock me-1"></i>{svc.duration}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Next button */}
                  <div className="book-card-footer">
                    <button
                      type="button"
                      className="book-btn-primary w-100"
                      disabled={!step1Valid}
                      onClick={() => step1Valid && setStep(2)}
                    >
                      Continue to Slot Picker
                      <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* ══ STEP 2: Slot Picker ══ */}
              {step === 2 && (
                <div className="book-card" style={{ animation: "slideInRight 0.4s ease forwards" }}>
                  <div className="book-card-header">
                    <div className="book-card-icon">
                      <i className="bi bi-calendar-week"></i>
                    </div>
                    <div>
                      <h5 className="mb-0" style={{ color: THEME.cream, fontFamily: "'Playfair Display', serif" }}>Choose Your Slot</h5>
                      <p className="mb-0" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Step 2 of 2 — Pick date & time</p>
                    </div>
                  </div>

                  <div className="book-card-body">

                    {/* Date picker */}
                    <div className="book-field mb-5">
                      <label className="book-label">
                        <i className="bi bi-calendar-event me-2"></i>Select Date
                      </label>
                      <input
                        type="date"
                        className="book-input"
                        min={getTodayString()}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value, time: "" })}
                        required
                      />
                    </div>

                    {/* Time slot grid */}
                    {formData.date && (
                      <div className="book-field">
                        <label className="book-label mb-3">
                          <i className="bi bi-clock me-2"></i>Available Time Slots
                        </label>

                        {/* Slot legend */}
                        <div className="d-flex gap-3 mb-4 flex-wrap">
                          <div className="book-legend-item">
                            <div className="book-legend-dot available" />
                            <span>Available</span>
                          </div>
                          <div className="book-legend-item">
                            <div className="book-legend-dot selected-dot" />
                            <span>Selected</span>
                          </div>
                          <div className="book-legend-item">
                            <div className="book-legend-dot booked" />
                            <span>Booked</span>
                          </div>
                        </div>

                        {/* Slot groups */}
                        {Object.entries(TIME_SLOTS).map(([period, slots]) => (
                          <div key={period} className="mb-4">
                            <div className="book-period-label">
                              <i className={`bi ${period === "Morning" ? "bi-sunrise-fill" : period === "Afternoon" ? "bi-sun-fill" : "bi-moon-stars-fill"} me-2`}></i>
                              {period}
                            </div>
                            <div className="book-slot-grid">
                              {slots.map((slot) => {
                                // NEW: Using the dynamic bookedSlots from Supabase
                                const isBooked = bookedSlots.includes(slot);
                                const isSelected = formData.time === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => !isBooked && setFormData({ ...formData, time: slot })}
                                    className={`book-slot ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                                  >
                                    {slot}
                                    {isBooked && <span className="book-slot-tag">Full</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!formData.date && (
                      <div className="book-no-date">
                        <i className="bi bi-calendar-x" style={{ fontSize: "2.5rem", color: "rgba(98,182,183,0.3)", marginBottom: "0.75rem" }}></i>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>Please select a date first to see available slots</p>
                      </div>
                    )}
                  </div>

                  {/* Footer buttons */}
                  <div className="book-card-footer d-flex gap-3">
                    <button type="button" className="book-btn-outline" onClick={() => setStep(1)}>
                      <i className="bi bi-arrow-left me-2"></i>Back
                    </button>
                    <button
                      type="submit"
                      className="book-btn-primary flex-fill"
                      disabled={!step2Valid || isLoading}
                    >
                      {isLoading ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Booking...</>
                      ) : (
                        <><i className="bi bi-calendar-check me-2"></i>Confirm Appointment</>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* ── Summary Sidebar ── */}
          <div className="col-lg-4">
            <div className="book-summary">
              <div className="book-summary-header">
                <i className="bi bi-receipt me-2" style={{ color: THEME.gold }}></i>
                Appointment Summary
              </div>

              <div className="book-summary-body">
                {/* Name */}
                <div className="book-summary-row">
                  <span className="book-summary-key"><i className="bi bi-person-fill me-2"></i>Name</span>
                  <span className="book-summary-val">{formData.name || "—"}</span>
                </div>
                {/* Phone */}
                <div className="book-summary-row">
                  <span className="book-summary-key"><i className="bi bi-telephone-fill me-2"></i>Phone</span>
                  <span className="book-summary-val">
                    {formData.phone ? `${formData.countryCode} ${formData.phone}` : "—"}
                  </span>
                </div>
                {/* Location */}
                <div className="book-summary-row">
                  <span className="book-summary-key"><i className="bi bi-geo-alt-fill me-2"></i>Clinic</span>
                  <span className="book-summary-val">{selectedLocation?.label || "—"}</span>
                </div>
                {/* Service */}
                <div className="book-summary-row">
                  <span className="book-summary-key"><i className="bi bi-heart-pulse-fill me-2"></i>Service</span>
                  <span className="book-summary-val">{selectedService?.label || "—"}</span>
                </div>
                {/* Duration */}
                {selectedService && (
                  <div className="book-summary-row">
                    <span className="book-summary-key"><i className="bi bi-hourglass-split me-2"></i>Duration</span>
                    <span className="book-summary-val">{selectedService.duration}</span>
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(201,168,76,0.15)", margin: "1rem 0" }} />

                {/* Date */}
                <div className="book-summary-row">
                  <span className="book-summary-key"><i className="bi bi-calendar-event me-2"></i>Date</span>
                  <span className="book-summary-val">
                    {formData.date
                      ? new Date(formData.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </span>
                </div>
                {/* Time */}
                <div className="book-summary-row">
                  <span className="book-summary-key"><i className="bi bi-clock-fill me-2"></i>Time</span>
                  <span className="book-summary-val" style={{ color: formData.time ? THEME.gold : undefined }}>
                    {formData.time || "—"}
                  </span>
                </div>
              </div>

              {/* Info notice */}
              <div className="book-notice">
                <i className="bi bi-info-circle-fill me-2" style={{ color: THEME.accent, flexShrink: 0 }}></i>
                <span>We'll call or WhatsApp you within 2 hours to confirm your appointment.</span>
              </div>

              {/* Trust badges */}
              <div className="book-trust-badges">
                {TRUST_BADGES.map((b, i) => (
                  <div key={i} className="book-trust-item">
                    <i className={`bi ${b.icon}`} style={{ color: THEME.gold }}></i>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Success Modal ── */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ zIndex: 1050, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <div className="book-modal" style={{ animation: "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}>
            {/* Confetti-like top bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${THEME.primary}, ${THEME.gold}, ${THEME.accent})`, borderRadius: "16px 16px 0 0" }} />
            <div className="p-5 text-center">
              {/* Animated check */}
              <div className="book-success-icon">
                <i className="bi bi-check-lg"></i>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: THEME.charcoal, fontWeight: 700, marginBottom: "0.75rem" }}>
                Appointment Requested!
              </h3>
              <p style={{ color: "#6B7B78", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                Thank you! We've received your booking request. Our team will reach out shortly to confirm your appointment.
              </p>
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <button
                  className="book-btn-primary"
                  onClick={() => setShowModal(false)}
                  style={{ minWidth: 160 }}
                >
                  <i className="bi bi-check-circle me-2"></i>Got it, Thanks!
                </button>
                <Link href="/" className="book-btn-outline-dark" style={{ minWidth: 130 }}>
                  <i className="bi bi-house me-2"></i>Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── All Styles ───────────────────────────────────────────────────────────────
const BookingStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
    @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
    @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css');

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
    @keyframes pulse { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.12); opacity:0.7; } }
    @keyframes popIn {
      0%   { opacity:0; transform: scale(0.8) translateY(20px); }
      100% { opacity:1; transform: scale(1) translateY(0); }
    }
    @keyframes slideInRight {
      from { opacity:0; transform: translateX(20px); }
      to   { opacity:1; transform: translateX(0); }
    }
    @keyframes successPop {
      0%   { transform: scale(0); opacity:0; }
      60%  { transform: scale(1.2); }
      100% { transform: scale(1); opacity:1; }
    }
    @keyframes logo-shine {
      0%   { left: -80%; }
      100% { left: 130%; }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 0 rgba(8,99,81,0.5); }
      50%      { box-shadow: 0 0 0 10px rgba(8,99,81,0); }
    }

    /* ── Grid bg ── */
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

    /* ── Top Nav ── */
    .book-topnav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(13,31,28,0.92);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(201,168,76,0.10);
    }
    .book-back-btn {
      display: inline-flex; align-items: center;
      font-size: 0.8rem; font-weight: 600; letter-spacing: 0.8px;
      color: rgba(255,255,255,0.5); text-decoration: none;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
      padding: 0.4rem 1rem; transition: all 0.3s ease;
    }
    .book-back-btn:hover { color: var(--accent); border-color: var(--accent); }

    /* ── Logo ── */
    .book-logo-wrap { position: relative; width: 50px; height: 50px; flex-shrink: 0; }
    .book-logo-glow {
      position: absolute; inset: -3px; border-radius: 11px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      z-index: 0; animation: pulse-glow 3s ease-in-out infinite;
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

    /* ── Steps ── */
    .book-steps {
      display: inline-flex; align-items: center; gap: 0;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 50px; padding: 0.5rem 1.5rem;
    }
    .book-step {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.3);
      transition: color 0.3s ease;
    }
    .book-step.active { color: rgba(255,255,255,0.9); }
    .book-step.done { color: var(--accent); }
    .book-step-circle {
      width: 28px; height: 28px; border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
      transition: all 0.3s ease;
    }
    .book-step.active .book-step-circle {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-color: transparent; color: #fff;
    }
    .book-step.done .book-step-circle {
      background: var(--accent); border-color: transparent; color: #fff;
    }
    .book-step-line { width: 40px; height: 1px; margin: 0 0.75rem; transition: background 0.5s ease; }

    /* ── Card ── */
    .book-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(98,182,183,0.10);
      border-radius: 16px; overflow: hidden;
    }
    .book-card-header {
      display: flex; align-items: center; gap: 1rem;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      background: rgba(255,255,255,0.02);
    }
    .book-card-icon {
      width: 46px; height: 46px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.1rem;
    }
    .book-card-body { padding: 2rem; }
    .book-card-footer {
      padding: 1.25rem 2rem;
      border-top: 1px solid rgba(255,255,255,0.05);
      background: rgba(255,255,255,0.02);
    }
    @media (max-width: 575px) {
      .book-card-header { padding: 1.25rem; }
      .book-card-body { padding: 1.25rem; }
      .book-card-footer { padding: 1rem 1.25rem; }
    }

    /* ── Form Fields ── */
    .book-label {
      display: block;
      font-size: 0.78rem; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; color: rgba(255,255,255,0.5);
      margin-bottom: 0.6rem;
    }
    .book-input {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(98,182,183,0.15);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      font-size: 0.95rem; color: var(--cream);
      font-family: 'Inter', sans-serif;
      transition: all 0.3s ease;
      outline: none;
    }
    .book-input:focus {
      border-color: var(--accent);
      background: rgba(98,182,183,0.06);
      box-shadow: 0 0 0 3px rgba(98,182,183,0.12);
      color: #fff;
    }
    .book-input::placeholder { color: rgba(255,255,255,0.2); }
    .book-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }

    /* ── Phone group ── */
    .book-phone-group { display: flex; gap: 0; border-radius: 8px; overflow: hidden; border: 1px solid rgba(98,182,183,0.15); background: rgba(255,255,255,0.05); transition: all 0.3s ease; }
    .book-phone-group:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(98,182,183,0.12); background: rgba(98,182,183,0.06); }
    .book-country-select {
      background: transparent; border: none; outline: none;
      padding: 0.85rem 0.75rem; font-size: 0.9rem; color: var(--cream);
      cursor: pointer; flex-shrink: 0; width: 110px;
      border-right: 1px solid rgba(98,182,183,0.15);
    }
    .book-country-select option { background: var(--charcoal); color: var(--cream); }
    .book-phone-input { border: none !important; box-shadow: none !important; background: transparent !important; border-radius: 0 8px 8px 0 !important; }
    .book-phone-input:focus { background: transparent !important; box-shadow: none !important; }

    /* ── Location option cards ── */
    .book-option-card {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 1rem; border-radius: 10px; cursor: pointer;
      border: 1.5px solid rgba(98,182,183,0.10);
      background: rgba(255,255,255,0.03);
      transition: all 0.3s ease; position: relative;
    }
    .book-option-card:hover { border-color: rgba(98,182,183,0.35); background: rgba(98,182,183,0.05); }
    .book-option-card.selected { border-color: var(--accent); background: rgba(98,182,183,0.08); }
    .book-option-icon {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: rgba(98,182,183,0.12);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent); font-size: 1rem;
    }
    .book-option-card.selected .book-option-icon { background: var(--primary); color: #fff; }
    .book-option-title { font-size: 0.88rem; font-weight: 600; color: var(--cream); margin-bottom: 2px; }
    .book-option-sub { font-size: 0.72rem; color: rgba(255,255,255,0.35); line-height: 1.4; }
    .book-option-check {
      position: absolute; top: 8px; right: 8px;
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--accent); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700;
    }

    /* ── Service cards ── */
    .book-service-card {
      padding: 1rem 0.75rem; border-radius: 10px; cursor: pointer; text-align: center;
      border: 1.5px solid rgba(98,182,183,0.10);
      background: rgba(255,255,255,0.03);
      transition: all 0.3s ease;
    }
    .book-service-card:hover { border-color: rgba(201,168,76,0.35); background: rgba(201,168,76,0.05); transform: translateY(-2px); }
    .book-service-card.selected { border-color: var(--gold); background: rgba(201,168,76,0.08); }
    .book-service-icon { font-size: 1.5rem; color: rgba(255,255,255,0.3); margin-bottom: 0.4rem; display: block; transition: color 0.3s ease; }
    .book-service-card.selected .book-service-icon { color: var(--gold); }
    .book-service-card:hover .book-service-icon { color: var(--gold); }
    .book-service-label { font-size: 0.8rem; font-weight: 600; color: var(--cream); margin-bottom: 3px; }
    .book-service-duration { font-size: 0.68rem; color: rgba(255,255,255,0.35); letter-spacing: 0.3px; }

    /* ── Time slots ── */
    .book-period-label {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; color: var(--gold);
      display: flex; align-items: center; margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(201,168,76,0.12);
    }
    .book-slot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.6rem;
    }
    .book-slot {
      padding: 0.65rem 0.5rem;
      border-radius: 8px; border: 1.5px solid rgba(98,182,183,0.15);
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.7); font-size: 0.82rem; font-weight: 600;
      cursor: pointer; text-align: center;
      transition: all 0.25s ease; position: relative;
      font-family: 'Inter', sans-serif;
    }
    .book-slot:hover:not(.booked) { border-color: var(--accent); background: rgba(98,182,183,0.10); color: #fff; transform: translateY(-2px); }
    .book-slot.selected { border-color: var(--gold); background: linear-gradient(135deg, rgba(8,99,81,0.4), rgba(201,168,76,0.2)); color: var(--gold); box-shadow: 0 4px 16px rgba(201,168,76,0.2); }
    .book-slot.booked { opacity: 0.35; cursor: not-allowed; border-style: dashed; }
    .book-slot-tag {
      position: absolute; top: -8px; right: -6px;
      background: rgba(255,80,80,0.8); color: #fff;
      font-size: 0.55rem; font-weight: 700; letter-spacing: 0.3px;
      padding: 1px 5px; border-radius: 3px; text-transform: uppercase;
    }

    /* Legend */
    .book-legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    .book-legend-dot { width: 10px; height: 10px; border-radius: 3px; }
    .book-legend-dot.available { background: rgba(98,182,183,0.3); border: 1.5px solid rgba(98,182,183,0.4); }
    .book-legend-dot.selected-dot { background: rgba(201,168,76,0.5); border: 1.5px solid var(--gold); }
    .book-legend-dot.booked { background: rgba(255,255,255,0.06); border: 1.5px dashed rgba(255,255,255,0.2); }

    /* No date placeholder */
    .book-no-date { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; }

    /* ── Buttons ── */
    .book-btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #fff; border: none; border-radius: 8px;
      padding: 0.85rem 1.75rem; font-size: 0.85rem; font-weight: 700;
      letter-spacing: 0.5px; cursor: pointer;
      transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(8,99,81,0.30);
    }
    .book-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(8,99,81,0.40); }
    .book-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .book-btn-outline {
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent; color: rgba(255,255,255,0.6);
      border: 1.5px solid rgba(255,255,255,0.15); border-radius: 8px;
      padding: 0.83rem 1.5rem; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.3s ease; text-decoration: none;
    }
    .book-btn-outline:hover { border-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.05); }
    .book-btn-outline-dark {
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent; color: var(--charcoal);
      border: 1.5px solid rgba(13,31,28,0.2); border-radius: 8px;
      padding: 0.83rem 1.5rem; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.3s ease; text-decoration: none;
    }
    .book-btn-outline-dark:hover { border-color: var(--primary); color: var(--primary); }

    /* ── Summary Sidebar ── */
    .book-summary {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(201,168,76,0.12);
      border-radius: 16px; overflow: hidden;
      position: sticky; top: 90px;
    }
    .book-summary-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(201,168,76,0.10);
      background: rgba(201,168,76,0.05);
      font-size: 0.78rem; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: rgba(255,255,255,0.6);
    }
    .book-summary-body { padding: 1.25rem 1.5rem; }
    .book-summary-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.85rem; }
    .book-summary-key { font-size: 0.75rem; color: rgba(255,255,255,0.35); white-space: nowrap; padding-top: 1px; }
    .book-summary-val { font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.75); text-align: right; }
    .book-notice {
      margin: 0 1.5rem 1.25rem;
      display: flex; align-items: flex-start; gap: 0.6rem;
      background: rgba(98,182,183,0.06);
      border: 1px solid rgba(98,182,183,0.12);
      border-radius: 8px; padding: 0.85rem;
      font-size: 0.78rem; color: rgba(255,255,255,0.45); line-height: 1.6;
    }
    .book-trust-badges {
      border-top: 1px solid rgba(255,255,255,0.05);
      padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 0.6rem;
    }
    .book-trust-item {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 0.75rem; color: rgba(255,255,255,0.35); font-weight: 500;
    }

    /* ── Success Modal ── */
    .book-modal {
      background: #fff; border-radius: 16px; max-width: 400px;
      width: 90%; box-shadow: 0 40px 100px rgba(0,0,0,0.4);
      overflow: hidden;
    }
    .book-success-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #086351, #62B6B7);
      display: flex; align-items: center; justify-content: center;
      font-size: 2.2rem; color: #fff; margin: 0 auto 1.5rem;
      box-shadow: 0 12px 36px rgba(8,99,81,0.30);
      animation: successPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.2s both;
    }

    /* ── Responsive ── */
    @media (max-width: 991px) {
      .book-summary { position: static; }
    }
    @media (max-width: 575px) {
      .book-steps { padding: 0.4rem 1rem; gap: 0; }
      .book-step-line { width: 24px; margin: 0 0.4rem; }
      .book-slot-grid { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
    }
  `}} />
);