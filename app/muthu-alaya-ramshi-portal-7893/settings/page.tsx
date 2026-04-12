"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";
import AdminLayout from "../../../components/AdminLayout";

interface WorkingHours {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

const DAY_LABELS: { key: keyof WorkingHours; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- Clinic Info States ---
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "",
  });
  const [clinicLoading, setClinicLoading] = useState(false);
  const [clinicSaving, setClinicSaving] = useState(false);

  const themeColor = '#086351';
  const supabase = createClient();

  const fetchClinicInfo = useCallback(async () => {
    setClinicLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      const result = await response.json();
      if (response.ok && result.data) {
        const d = result.data;
        setClinicName(d.clinic_name || "");
        setPhone(d.phone || "");
        setEmail(d.email || "");
        setAddress(d.address || "");
        if (d.working_hours) {
          setWorkingHours({
            mon: d.working_hours.mon || "",
            tue: d.working_hours.tue || "",
            wed: d.working_hours.wed || "",
            thu: d.working_hours.thu || "",
            fri: d.working_hours.fri || "",
            sat: d.working_hours.sat || "",
            sun: d.working_hours.sun || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching clinic info:", error);
    }
    setClinicLoading(false);
  }, []);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setClinicSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_name: clinicName,
          phone,
          email,
          address,
          working_hours: workingHours,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save settings");
      alert("Clinic settings saved successfully!");
    } catch (error: any) {
      alert("Failed to save: " + error.message);
    }
    setClinicSaving(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) fetchClinicInfo();
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [supabase.auth, fetchClinicInfo]);

  const handleHoursChange = (day: keyof WorkingHours, value: string) => {
    setWorkingHours((prev) => ({ ...prev, [day]: value }));
  };

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-danger">Access Denied</h2>
        <p>You must be logged in to view this page.</p>
        <Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-primary">Go to Login</Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AdminLayout currentPage="settings" onLogout={handleLogout}>
      <div className="container-fluid px-3 px-lg-4 py-4">
        <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4" style={{ color: themeColor }}>
              <i className="bi bi-gear-fill me-2"></i>Clinic Information
            </h5>

            {clinicLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success"></div>
                <p className="text-muted mt-2">Loading clinic settings...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveClinic}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small mb-1">Clinic Name</label>
                    <input
                      type="text"
                      className="form-control bg-light border-0"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Enter clinic name"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small mb-1">Phone</label>
                    <input
                      type="text"
                      className="form-control bg-light border-0"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small mb-1">Email</label>
                    <input
                      type="email"
                      className="form-control bg-light border-0"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small mb-1">Address</label>
                    <textarea
                      className="form-control bg-light border-0"
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter clinic address"
                    ></textarea>
                  </div>
                </div>

                {/* Working Hours */}
                <hr className="my-4" />
                <h6 className="fw-bold mb-3" style={{ color: themeColor }}>
                  <i className="bi bi-clock me-2"></i>Working Hours
                </h6>
                <div className="row g-3">
                  {DAY_LABELS.map(({ key, label }) => (
                    <div className="col-md-6 col-lg-4" key={key}>
                      <label className="form-label fw-bold text-muted small mb-1">{label}</label>
                      <input
                        type="text"
                        className="form-control bg-light border-0"
                        value={workingHours[key]}
                        onChange={(e) => handleHoursChange(key, e.target.value)}
                        placeholder='e.g. 10:00 AM - 8:00 PM or Closed'
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-2">
                  <button
                    type="submit"
                    className="btn btn-lg w-100 text-white fw-bold shadow-sm"
                    style={{ backgroundColor: themeColor, borderRadius: '12px' }}
                    disabled={clinicSaving}
                  >
                    {clinicSaving ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Saving...</>
                    ) : (
                      <><i className="bi bi-check-circle me-2"></i>Save Clinic Settings</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Helpful note */}
        <div className="text-center mt-4">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Treatment pricing is now managed under{' '}
            <Link href="/muthu-alaya-ramshi-portal-7893/services" className="fw-bold" style={{ color: themeColor }}>
              Services
            </Link>
            {' '}(Pricing & Category tab).
          </small>
        </div>
      </div>
    </AdminLayout>
  );
}
