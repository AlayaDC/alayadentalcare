"use client";

import { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { createClient } from "../../utils/supabase/client";
import AdminLayout from "../../components/AdminLayout";
import AdminLoadingSpinner from "../../components/AdminLoadingSpinner";

interface DashboardData {
  today: {
    total: number;
    checkedIn: number;
    confirmed: number;
    pending: number;
    revenue: number;
    collected: number;
  };
  totalPatients: number;
  recentAppointments: Array<{
    id: string;
    date: string;
    patient_name: string;
    phone: string;
    service: string;
    status: string;
    location: string;
  }>;
  dailyStats: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(false);

  const themeColor = '#086351';
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    setDashLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthError("Unable to connect to server. Please check your internet connection.");
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [supabase.auth]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message || "Failed to log in.");
    } else if (data?.user) {
      setUser(data.user);
    }

    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDashboardData(null);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("pending")) return "bg-warning text-dark";
    if (s.includes("confirmed")) return "bg-success";
    if (s.includes("check-in") || s.includes("checkin") || s.includes("check in")) return "bg-info";
    if (s.includes("completed")) return "bg-primary";
    if (s.includes("cancelled") || s.includes("canceled")) return "bg-danger";
    return "bg-secondary";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (authLoading) {
    return <AdminLoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh" }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes loginFadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes loginPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}} />

        {/* Left Side — Doctor Image */}
        <div
          className="d-none d-lg-flex flex-column justify-content-end position-relative"
          style={{
            width: "55%",
            background: `linear-gradient(135deg, ${themeColor} 0%, #0a8568 50%, #62B6B7 100%)`,
            overflow: "hidden",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
            alt="Dental clinic"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
              opacity: 0.25,
            }}
          />
          <div className="position-relative p-5" style={{ zIndex: 2 }}>
            <div className="d-flex align-items-center mb-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "52px",
                  height: "52px",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <i className="bi bi-heart-pulse-fill text-white fs-4"></i>
              </div>
              <div>
                <h4 className="text-white fw-bold mb-0">Alaya Dental Care</h4>
                <small className="text-white-50">Admin Portal</small>
              </div>
            </div>
            <p className="text-white-50 mb-0" style={{ maxWidth: "400px", fontSize: "0.9rem" }}>
              Manage appointments, patients, consultations, and invoices — all in one place.
            </p>
          </div>
        </div>

        {/* Right Side — Login Form */}
        <div
          className="d-flex flex-column align-items-center justify-content-center flex-grow-1"
          style={{
            background: "#f8faf9",
            padding: "2rem",
            animation: "loginFadeIn 0.5s ease",
          }}
        >
          {/* Mobile-only logo */}
          <div className="d-lg-none text-center mb-4">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
              style={{
                width: "60px",
                height: "60px",
                background: `linear-gradient(135deg, ${themeColor}, #62B6B7)`,
              }}
            >
              <i className="bi bi-heart-pulse-fill text-white fs-3"></i>
            </div>
            <h5 className="fw-bold mb-0" style={{ color: themeColor }}>Alaya Dental Care</h5>
            <small className="text-muted">Admin Portal</small>
          </div>

          <div
            className="card border-0 shadow-lg"
            style={{
              borderRadius: "24px",
              width: "100%",
              maxWidth: "420px",
              overflow: "hidden",
            }}
          >
            {/* Card top accent bar */}
            <div style={{ height: "4px", background: `linear-gradient(to right, ${themeColor}, #62B6B7, #C9A84C)` }} />

            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div
                  className="d-none d-lg-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{
                    width: "56px",
                    height: "56px",
                    background: `rgba(8, 99, 81, 0.08)`,
                  }}
                >
                  <i className="bi bi-shield-lock" style={{ fontSize: "1.5rem", color: themeColor }}></i>
                </div>
                <h4 className="fw-bold mb-1" style={{ color: "#1a1a2e" }}>Welcome Back</h4>
                <p className="text-muted small mb-0">Sign in to access the admin portal</p>
              </div>

              {authError && (
                <div className="alert alert-danger py-2 text-center small border-0" style={{ borderRadius: "12px", background: "#fff5f5", color: "#c0392b" }}>
                  <i className="bi bi-exclamation-circle me-1"></i>{authError}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text border-end-0" style={{ background: "#f8faf9", borderRadius: "12px 0 0 12px", borderColor: "#e0e0e0" }}>
                      <i className="bi bi-envelope text-muted"></i>
                    </span>
                    <input
                      type="email"
                      placeholder="admin@clinic.com"
                      className="form-control border-start-0 ps-0"
                      style={{ borderRadius: "0 12px 12px 0", borderColor: "#e0e0e0" }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-muted">Password</label>
                  <div className="input-group">
                    <span className="input-group-text border-end-0" style={{ background: "#f8faf9", borderRadius: "12px 0 0 12px", borderColor: "#e0e0e0" }}>
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="form-control border-start-0 ps-0"
                      style={{ borderRadius: "0 12px 12px 0", borderColor: "#e0e0e0" }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn w-100 text-white fw-bold py-2"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor}, #0a8568)`,
                    borderRadius: "12px",
                    border: "none",
                    fontSize: "0.95rem",
                    letterSpacing: "0.3px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 15px rgba(8, 99, 81, 0.3)",
                  }}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
                </button>
              </form>

              <div className="text-center mt-4">
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  <i className="bi bi-shield-check me-1"></i>Protected admin area • Authorized access only
                </small>
              </div>
            </div>
          </div>

          <small className="text-muted mt-3" style={{ fontSize: "0.7rem" }}>
            © {new Date().getFullYear()} Alaya Dental Care
          </small>
        </div>
      </div>
    );
  }

  const todayData = dashboardData?.today;
  const recentAppointments = dashboardData?.recentAppointments?.slice(0, 10) || [];

  return (
    <AdminLayout currentPage="dashboard" onLogout={handleLogout}>
      <div className="container-fluid px-3 px-lg-4 py-4">
        {/* Dashboard Title */}
        <h2 className="fw-bold mb-4" style={{ color: themeColor }}>
          <i className="bi bi-speedometer2 me-2"></i>Dashboard
        </h2>

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "20px" }}
            >
              <div className="card-body d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "rgba(13, 110, 253, 0.1)",
                  }}
                >
                  <i
                    className="bi bi-calendar-check fs-4"
                    style={{ color: "#0d6efd" }}
                  ></i>
                </div>
                <div>
                  <div className="text-muted small">Today&apos;s Appointments</div>
                  <div className="fw-bold fs-4">
                    {dashLoading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      todayData?.total ?? 0
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "20px" }}
            >
              <div className="card-body d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "rgba(25, 135, 84, 0.1)",
                  }}
                >
                  <i
                    className="bi bi-person-check fs-4"
                    style={{ color: "#198754" }}
                  ></i>
                </div>
                <div>
                  <div className="text-muted small">Check-ins</div>
                  <div className="fw-bold fs-4">
                    {dashLoading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      todayData?.checkedIn ?? 0
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "20px" }}
            >
              <div className="card-body d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "rgba(255, 193, 7, 0.1)",
                  }}
                >
                  <i
                    className="bi bi-currency-rupee fs-4"
                    style={{ color: "#ffc107" }}
                  ></i>
                </div>
                <div>
                  <div className="text-muted small">Today&apos;s Revenue</div>
                  <div className="fw-bold fs-4">
                    {dashLoading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <>&#8377;{(todayData?.revenue ?? 0).toLocaleString()}</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "20px" }}
            >
              <div className="card-body d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "rgba(13, 202, 240, 0.1)",
                  }}
                >
                  <i
                    className="bi bi-people fs-4"
                    style={{ color: "#0dcaf0" }}
                  ></i>
                </div>
                <div>
                  <div className="text-muted small">Total Patients</div>
                  <div className="fw-bold fs-4">
                    {dashLoading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      dashboardData?.totalPatients ?? 0
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Appointments Table */}
        <h5 className="fw-bold mb-3" style={{ color: themeColor }}>
          <i className="bi bi-clock-history me-2"></i>Recent Appointments
        </h5>
        <div
          className="card border-0 shadow-sm"
          style={{ borderRadius: "20px" }}
        >
          <div className="card-body p-0">
            {dashLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: "#086351" }}></div>
                <p className="mt-2 text-muted small">Loading appointments...</p>
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-calendar-x display-4 d-block mb-2"></i>
                No recent appointments found.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      <th className="border-0 ps-4 py-3 text-muted small fw-semibold">
                        Date
                      </th>
                      <th className="border-0 py-3 text-muted small fw-semibold">
                        Patient
                      </th>
                      <th className="border-0 py-3 text-muted small fw-semibold">
                        Phone
                      </th>
                      <th className="border-0 py-3 text-muted small fw-semibold">
                        Service
                      </th>
                      <th className="border-0 py-3 text-muted small fw-semibold">
                        Status
                      </th>
                      <th className="border-0 pe-4 py-3 text-muted small fw-semibold">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((appt, idx) => (
                      <tr key={appt.id || idx}>
                        <td className="ps-4 py-3 align-middle">
                          {formatDate(appt.date)}
                        </td>
                        <td className="py-3 align-middle fw-semibold">
                          {appt.patient_name || "-"}
                        </td>
                        <td className="py-3 align-middle">
                          {appt.phone || "-"}
                        </td>
                        <td className="py-3 align-middle">
                          {appt.service || "-"}
                        </td>
                        <td className="py-3 align-middle">
                          <span
                            className={`badge ${getStatusBadge(appt.status)} rounded-pill px-3 py-1`}
                          >
                            {appt.status || "Unknown"}
                          </span>
                        </td>
                        <td className="pe-4 py-3 align-middle">
                          {appt.location || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
