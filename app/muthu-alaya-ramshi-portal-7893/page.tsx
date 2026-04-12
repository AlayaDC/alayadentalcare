"use client";

import { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { createClient } from "../../utils/supabase/client";
import AdminLayout from "../../components/AdminLayout";

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
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
      >
        <div
          className="card border-0 shadow-lg p-5"
          style={{ borderRadius: "20px", width: "100%", maxWidth: "400px" }}
        >
          <div className="text-center mb-4">
            <h3 className="fw-bold" style={{ color: themeColor }}>
              Restricted Area
            </h3>
          </div>
          {authError && (
            <div className="alert alert-danger py-2 text-center small">
              {authError}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <input
                type="email"
                placeholder="Email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                placeholder="Password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn w-100 text-white fw-bold"
              style={{ backgroundColor: themeColor }}
            >
              Unlock Portal
            </button>
          </form>
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
                <div className="spinner-border text-success"></div>
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
