"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";

export default function ManageAppointmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const themeColor = '#086351';
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
      if (session?.user) fetchAppointments();
    };
    checkSession();
  }, [supabase.auth]);

  const fetchAppointments = async () => {
    // Fetch and order by closest date first
    const { data } = await supabase.from('appointments').select('*').order('date', { ascending: true });
    if (data) setAppointments(data);
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (!error) {
      fetchAppointments();
    } else {
      alert("Failed to update status.");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Confirmed') return <span className="badge bg-success">Confirmed</span>;
    if (status === 'Cancelled') return <span className="badge bg-danger">Cancelled</span>;
    return <span className="badge bg-warning text-dark">Pending</span>;
  };

  if (authLoading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-success"></div></div>;

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-danger">Access Denied</h2>
        <Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-primary">Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav className="navbar navbar-dark shadow-sm py-3" style={{ backgroundColor: themeColor }}>
        <div className="container">
          <span className="navbar-brand fw-bold">Alaya Admin - Appointments</span>
          <Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-outline-light btn-sm fw-bold"><i className="bi bi-arrow-left me-2"></i>Back to Menu</Link>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12">
            
            <h4 className="fw-bold mb-3" style={{ color: themeColor }}>Patient Bookings</h4>
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3">Patient Name</th>
                      <th className="py-3">Phone</th>
                      <th className="py-3">Clinic & Service</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-end px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">No appointments found.</td></tr>
                    ) : (
                      appointments.map((app) => (
                        <tr key={app.id}>
                          <td className="px-4">
                            <div className="fw-bold text-dark">{new Date(app.date).toLocaleDateString()}</div>
                            <div className="text-muted small">{app.time}</div>
                          </td>
                          <td className="fw-semibold">{app.name}</td>
                          <td>{app.country_code} {app.phone}</td>
                          <td>
                            <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>{app.location === 'chettiyamkinar' ? 'Chettiyamkinar' : 'Kurukathani'}</div>
                            <div className="text-muted small" style={{ textTransform: "capitalize" }}>{app.service}</div>
                          </td>
                          <td>{getStatusBadge(app.status)}</td>
                          <td className="text-end px-4">
                            {app.status !== 'Confirmed' && (
                              <button onClick={() => handleUpdateStatus(app.id, 'Confirmed')} className="btn btn-sm btn-outline-success me-2">Confirm</button>
                            )}
                            {app.status !== 'Cancelled' && (
                              <button onClick={() => handleUpdateStatus(app.id, 'Cancelled')} className="btn btn-sm btn-outline-danger">Cancel</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}