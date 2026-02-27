"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Your Supabase Bridge
import { createClient } from "../../utils/supabase/client";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const themeColor = '#086351';
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };
    checkSession();
  }, [supabase.auth]);

 const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    
    // 1. Grab BOTH the data and the error
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // Show the actual error message so you aren't guessing
      setAuthError(error.message || "Failed to log in.");
    } else if (data?.user) {
      // 2. TELL REACT WE LOGGED IN! This instantly changes the screen.
      setUser(data.user); 
    }
    
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (authLoading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-success"></div></div>;

  // --- THE LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="card border-0 shadow-lg p-5" style={{ borderRadius: '20px', width: '100%', maxWidth: '400px' }}>
          <div className="text-center mb-4">
            <h3 className="fw-bold" style={{ color: themeColor }}>Restricted Area</h3>
          </div>
          {authError && <div className="alert alert-danger py-2 text-center small">{authError}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3"><input type="email" placeholder="Email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="mb-4"><input type="password" placeholder="Password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <button type="submit" className="btn w-100 text-white fw-bold" style={{ backgroundColor: themeColor }}>Unlock Portal</button>
          </form>
        </div>
      </div>
    );
  }

  // --- THE MAIN MENU DASHBOARD ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav className="navbar navbar-dark shadow-sm py-3" style={{ backgroundColor: themeColor }}>
        <div className="container">
          <span className="navbar-brand fw-bold"><i className="bi bi-shield-check me-2"></i> Alaya Admin</span>
          <div className="d-flex gap-3 align-items-center">
            <Link href="/" className="btn btn-outline-light btn-sm fw-bold">Live Site</Link>
            <button onClick={handleLogout} className="btn btn-light btn-sm fw-bold text-danger">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <h2 className="fw-bold text-center mb-5" style={{ color: themeColor }}>Control Panel</h2>
        <div className="row justify-content-center g-4">
          
          {/* Link to Doctors Page */}
          <div className="col-md-5">
            <Link href="/muthu-alaya-ramshi-portal-7893/doctors" className="text-decoration-none">
              <div className="card border-0 shadow-sm h-100 text-center p-5 hover-lift" style={{ borderRadius: '20px', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <i className="bi bi-person-badge display-1 mb-3" style={{ color: themeColor }}></i>
                <h4 className="fw-bold text-dark">Manage Doctors</h4>
                <p className="text-muted mb-0">Add new doctors and upload their photos to the database.</p>
              </div>
            </Link>
          </div>

          {/* Link to Services Page */}
          <div className="col-md-5">
            <Link href="/muthu-alaya-ramshi-portal-7893/services" className="text-decoration-none">
              <div className="card border-0 shadow-sm h-100 text-center p-5 hover-lift" style={{ borderRadius: '20px', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <i className="bi bi-clipboard2-pulse display-1 mb-3" style={{ color: themeColor }}></i>
                <h4 className="fw-bold text-dark">Manage Services</h4>
                <p className="text-muted mb-0">Add new dental services, icons, and descriptions.</p>
              </div>
            </Link>
          </div>
        {/* Link to Appointments Page */}
          <div className="col-md-5">
            <Link href="/muthu-alaya-ramshi-portal-7893/appointments" className="text-decoration-none">
              <div className="card border-0 shadow-sm h-100 text-center p-5 hover-lift" style={{ borderRadius: '20px', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <i className="bi bi-calendar-check display-1 mb-3" style={{ color: themeColor }}></i>
                <h4 className="fw-bold text-dark">Manage Appointments</h4>
                <p className="text-muted mb-0">View bookings, confirm slots, and manage your daily calendar.</p>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}