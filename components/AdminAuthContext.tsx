"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "../utils/supabase/client";

interface AdminAuthContextType {
  user: any;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  logout: async () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export function AdminAuthProvider({ children, onUser }: { children: React.ReactNode; onUser?: (user: any) => void }) {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const supabase = createClient();
  const themeColor = "#086351";

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user || null;
        setUser(u);
        onUser?.(u);
      } catch {
        setAuthError("Unable to connect. Please check your internet.");
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message || "Failed to log in.");
    } else if (data?.user) {
      setUser(data.user);
      onUser?.(data.user);
    }
    setAuthLoading(false);
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    onUser?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state
  if (authLoading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh", background: "#f8faf9" }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spinPulse { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}} />
        <div style={{ width: "50px", height: "50px", border: "3px solid #e9ecef", borderTop: `3px solid ${themeColor}`, borderRadius: "50%", animation: "spinPulse 0.8s linear infinite", marginBottom: "1rem" }} />
        <span style={{ color: themeColor, fontWeight: 600, fontSize: "0.9rem", letterSpacing: "0.5px", animation: "fadeInUp 0.4s ease" }}>Loading...</span>
      </div>
    );
  }

  // Login form
  if (!user) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh" }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes loginFadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        `}} />

        {/* Left — Doctor Image */}
        <div
          className="d-none d-lg-flex flex-column justify-content-end position-relative"
          style={{ width: "55%", background: `linear-gradient(135deg, ${themeColor} 0%, #0a8568 50%, #62B6B7 100%)`, overflow: "hidden" }}
        >
          <img
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
            alt="Dental clinic"
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0, opacity: 0.25 }}
          />
          <div className="position-relative p-5" style={{ zIndex: 2 }}>
            <div className="d-flex align-items-center mb-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "52px", height: "52px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
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

        {/* Right — Login Form */}
        <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1" style={{ background: "#f8faf9", padding: "2rem", animation: "loginFadeIn 0.5s ease" }}>
          <div className="d-lg-none text-center mb-4">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "60px", height: "60px", background: `linear-gradient(135deg, ${themeColor}, #62B6B7)` }}>
              <i className="bi bi-heart-pulse-fill text-white fs-3"></i>
            </div>
            <h5 className="fw-bold mb-0" style={{ color: themeColor }}>Alaya Dental Care</h5>
            <small className="text-muted">Admin Portal</small>
          </div>

          <div className="card border-0 shadow-lg" style={{ borderRadius: "24px", width: "100%", maxWidth: "420px", overflow: "hidden" }}>
            <div style={{ height: "4px", background: `linear-gradient(to right, ${themeColor}, #62B6B7, #C9A84C)` }} />
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="d-none d-lg-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: "56px", height: "56px", background: "rgba(8,99,81,0.08)" }}>
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
                    <input type="email" placeholder="admin@clinic.com" className="form-control border-start-0 ps-0" style={{ borderRadius: "0 12px 12px 0", borderColor: "#e0e0e0" }} value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-muted">Password</label>
                  <div className="input-group">
                    <span className="input-group-text border-end-0" style={{ background: "#f8faf9", borderRadius: "12px 0 0 12px", borderColor: "#e0e0e0" }}>
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input type="password" placeholder="••••••••" className="form-control border-start-0 ps-0" style={{ borderRadius: "0 12px 12px 0", borderColor: "#e0e0e0" }} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn w-100 text-white fw-bold py-2" style={{ background: `linear-gradient(135deg, ${themeColor}, #0a8568)`, borderRadius: "12px", border: "none", fontSize: "0.95rem", boxShadow: "0 4px 15px rgba(8,99,81,0.3)" }}>
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

  return (
    <AdminAuthContext.Provider value={{ user, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
