"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";
import AdminLayout from "../../../components/AdminLayout";

const THEME = {
  primary: "#086351",
  accent: "#62B6B7",
  gold: "#C9A84C",
  cream: "#FAF7F2",
  dark: "#0D1F1C",
  charcoal: "#1A2E2A",
};

export default function ManageAppointmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  // ─── NEW UI STATES ───
  const [activeTab, setActiveTab] = useState<"active" | "previous">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [pastDateFilter, setPastDateFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [liveAlert, setLiveAlert] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  // ─── NEW APPOINTMENT FORM STATE ───
  const [newApptForm, setNewApptForm] = useState({
    name: "", phone: "", location: "chettiyamkinar", service: "General Consultation", date: "", time: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── PATIENT AUTO-FILL STATE ───
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState<boolean | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientSearchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();
  const seenIdsRef = useRef<Set<any>>(new Set());
  const initialFetchDoneRef = useRef(false);
  const ringerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── CONTINUOUS RINGING AUDIO ───
  const playSingleBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(900, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.4);

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log("Audio blocked");
    }
  };

  const startRinging = () => {
    if (ringerIntervalRef.current) return;
    playSingleBeep(); // Play immediately
    ringerIntervalRef.current = setInterval(playSingleBeep, 1500); // Repeat every 1.5s
  };

  const stopRingingAndAdmit = () => {
    if (ringerIntervalRef.current) {
      clearInterval(ringerIntervalRef.current);
      ringerIntervalRef.current = null;
    }
    setLiveAlert({ show: false, message: "" });
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (ringerIntervalRef.current) clearInterval(ringerIntervalRef.current);
    };
  }, []);

  // ─── PATIENT PHONE SEARCH ───
  const searchPatientByPhone = useCallback(async (phone: string) => {
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      setPatientSearchResults([]);
      setIsExistingPatient(null);
      setShowPatientDropdown(false);
      return;
    }
    setPatientSearchLoading(true);
    try {
      const response = await fetch(`/api/admin/patients?phone=${encodeURIComponent(phone)}`);
      const result = await response.json();
      if (response.ok && result.data && result.data.length > 0) {
        setPatientSearchResults(result.data);
        setIsExistingPatient(true);
        setShowPatientDropdown(true);
      } else {
        setPatientSearchResults([]);
        setIsExistingPatient(false);
        setShowPatientDropdown(false);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
      setPatientSearchResults([]);
      setIsExistingPatient(false);
      setShowPatientDropdown(false);
    } finally {
      setPatientSearchLoading(false);
    }
  }, []);

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setNewApptForm(prev => ({ ...prev, phone: digitsOnly }));
    setIsExistingPatient(null);
    setShowPatientDropdown(false);

    if (patientSearchTimerRef.current) {
      clearTimeout(patientSearchTimerRef.current);
    }

    if (digitsOnly.length === 10) {
      patientSearchTimerRef.current = setTimeout(() => {
        searchPatientByPhone(digitsOnly);
      }, 300);
    } else {
      setPatientSearchResults([]);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setNewApptForm(prev => ({ ...prev, name: patient.name }));
    setShowPatientDropdown(false);
    setIsExistingPatient(true);
  };

  // ─── FETCH LOGIC ───
  const fetchAppointments = useCallback(async (shouldAlert = false) => {
    try {
      const response = await fetch('/api/admin/appointments');
      const result = await response.json();

      if (response.ok && result.data) {
        const newAppointments = result.data;
        setAppointments(newAppointments);

        if (shouldAlert && initialFetchDoneRef.current) {
          const newIds = newAppointments
            .map((app: any) => app.id)
            .filter((id: any) => !seenIdsRef.current.has(id));

          if (newIds.length > 0) {
            const newApps = newAppointments.filter((app: any) => newIds.includes(app.id));
            const names = newApps.map((app: any) => app.name).join(', ');

            // Start continuous ringing
            startRinging();
            setLiveAlert({ show: true, message: `New booking received from: ${names}` });

            newIds.forEach((id: any) => seenIdsRef.current.add(id));
          }
        } else {
          newAppointments.forEach((app: any) => seenIdsRef.current.add(app.id));
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  }, []);

  // ─── INITIALIZATION & POLLING ───
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) {
          await fetchAppointments(false);
          initialFetchDoneRef.current = true;
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [supabase.auth, fetchAppointments]);

  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(() => fetchAppointments(true), 15000);
    return () => clearInterval(intervalId);
  }, [user, fetchAppointments]);

  // ─── ACTION HANDLERS ───
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (response.ok) {
        const result = await response.json();
        // If check-in returned a patient_id, store it on the appointment locally
        if (newStatus === 'Check-in' && result.patient_id) {
          setAppointments(prev => prev.map(app =>
            app.id === id ? { ...app, status: newStatus, patient_id: result.patient_id } : app
          ));
        } else {
          fetchAppointments(false);
        }
      }
    } catch (error) {
      alert("Network error.");
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newApptForm, countryCode: "+91" }), // Defaulting country code for manual entry
      });
      if (response.ok) {
        setShowAddModal(false);
        setNewApptForm({ name: "", phone: "", location: "chettiyamkinar", service: "General Consultation", date: "", time: "" });
        setPatientSearchResults([]);
        setIsExistingPatient(null);
        setShowPatientDropdown(false);
        fetchAppointments(false); // Refresh list
      } else {
        alert("Failed to save appointment.");
      }
    } catch (error) {
      alert("System error saving appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── FILTERING LOGIC ───
  const todayString = new Date().toISOString().split("T")[0];

  const filteredAppointments = useMemo(() => {
    // 1. Apply global text search
    let filtered = appointments.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.phone && app.phone.includes(searchTerm))
    );

    // 2. Split into Active (>= today) vs Previous (< today)
    if (activeTab === "active") {
      filtered = filtered.filter(app => app.date >= todayString);
    } else {
      filtered = filtered.filter(app => app.date < todayString);
      // 3. Apply specific date filter for previous appointments
      if (pastDateFilter) {
        filtered = filtered.filter(app => app.date === pastDateFilter);
      }
    }
    return filtered;
  }, [appointments, activeTab, searchTerm, pastDateFilter, todayString]);

  const getStatusBadge = (status: string) => {
    if (status === 'Confirmed') return <span className="badge bg-success px-3 py-2">Confirmed</span>;
    if (status === 'Check-in') return <span className="badge bg-info text-white px-3 py-2">Check-in</span>;
    if (status === 'Completed') return <span className="badge bg-primary px-3 py-2">Completed</span>;
    if (status === 'Cancelled') return <span className="badge bg-danger px-3 py-2">Cancelled</span>;
    return <span className="badge bg-warning text-dark px-3 py-2">Pending</span>;
  };

  const renderActionButtons = (app: any) => {
    switch (app.status) {
      case 'Pending':
        return (
          <>
            <button onClick={() => handleUpdateStatus(app.id, 'Confirmed')} className="btn btn-sm btn-outline-success me-2 fw-bold">Confirm</button>
            <button onClick={() => handleUpdateStatus(app.id, 'Cancelled')} className="btn btn-sm btn-outline-danger fw-bold">Cancel</button>
          </>
        );
      case 'Confirmed':
        return (
          <>
            <button onClick={() => handleUpdateStatus(app.id, 'Check-in')} className="btn btn-sm btn-outline-info me-2 fw-bold">Check-in</button>
            <button onClick={() => handleUpdateStatus(app.id, 'Cancelled')} className="btn btn-sm btn-outline-danger fw-bold">Cancel</button>
          </>
        );
      case 'Check-in':
        return (
          <>
            <button onClick={() => handleUpdateStatus(app.id, 'Completed')} className="btn btn-sm btn-outline-primary me-2 fw-bold">Complete</button>
            {app.patient_id && (
              <Link href={`/muthu-alaya-ramshi-portal-7893/patients?highlight=${app.patient_id}`} className="btn btn-sm fw-bold text-white" style={{ background: THEME.primary }}>
                <i className="bi bi-person-fill me-1"></i>View Patient
              </Link>
            )}
          </>
        );
      case 'Completed':
        return app.patient_id ? (
          <Link href={`/muthu-alaya-ramshi-portal-7893/patients?highlight=${app.patient_id}`} className="btn btn-sm fw-bold text-white" style={{ background: THEME.primary }}>
            <i className="bi bi-person-fill me-1"></i>View Patient
          </Link>
        ) : null;
      case 'Cancelled':
      default:
        return null;
    }
  };

  // ─── RENDER CONDITIONS ───
  if (authLoading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-success"></div></div>;
  if (!user) return <div className="container py-5 text-center"><h2 className="text-danger">Access Denied</h2><Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-primary">Go to Login</Link></div>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AdminLayout currentPage="appointments" onLogout={handleLogout}>
      <div style={{ minHeight: '100vh', position: 'relative' }}>

      <AdminStyles theme={THEME} />

      {/* ─── CONTINUOUS ALARM TOAST ─── */}
      {liveAlert.show && (
        <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-start pt-5" style={{ zIndex: 1050, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}>
          <div className="toast show border-0 shadow-lg alert-pulse-card" role="alert" style={{ width: '400px', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="toast-header text-white border-0" style={{ backgroundColor: '#dc3545' }}>
              <i className="bi bi-bell-fill me-2 fs-4 text-white" style={{ animation: 'ring 0.5s infinite' }}></i>
              <strong className="me-auto fs-5">Action Required!</strong>
            </div>
            <div className="toast-body fs-6 bg-white text-dark py-4 text-center">
              <p className="mb-4 fw-bold fs-5">{liveAlert.message}</p>
              <button className="btn btn-lg w-100 text-white fw-bold shadow-sm" style={{ backgroundColor: THEME.primary }} onClick={stopRingingAndAdmit}>
                <i className="bi bi-check-circle me-2"></i> ADMIT & STOP ALARM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD APPOINTMENT MODAL ─── */}
      {showAddModal && (
        <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center" style={{ zIndex: 1040, background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white p-4" style={{ borderRadius: '16px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0" style={{ color: THEME.primary }}>Add New Appointment</h4>
              <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); setPatientSearchResults([]); setIsExistingPatient(null); setShowPatientDropdown(false); }}></button>
            </div>
            <form onSubmit={handleManualAdd}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="fw-bold small">Phone (10 digits)</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Enter 10-digit phone"
                      value={newApptForm.phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                    />
                    {patientSearchLoading && (
                      <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                        <div className="spinner-border spinner-border-sm text-muted" role="status">
                          <span className="visually-hidden">Searching...</span>
                        </div>
                      </div>
                    )}
                    {showPatientDropdown && patientSearchResults.length > 0 && (
                      <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" style={{ zIndex: 1060, maxHeight: '150px', overflowY: 'auto' }}>
                        {patientSearchResults.map((patient: any, index: number) => (
                          <button
                            key={patient.id || index}
                            type="button"
                            className="btn btn-light w-100 text-start px-3 py-2 border-0 border-bottom"
                            onClick={() => handleSelectPatient(patient)}
                          >
                            <i className="bi bi-person-fill me-2 text-success"></i>
                            <span className="fw-semibold">{patient.name}</span>
                            {patient.phone && <span className="text-muted ms-2 small">{patient.phone}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {isExistingPatient === true && (
                    <span className="badge bg-success bg-opacity-10 text-success mt-1"><i className="bi bi-check-circle me-1"></i>Existing Patient</span>
                  )}
                  {isExistingPatient === false && newApptForm.phone.length === 10 && (
                    <span className="badge bg-info bg-opacity-10 text-info mt-1"><i className="bi bi-person-plus me-1"></i>New Patient</span>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small">Patient Name</label>
                  <input type="text" className="form-control" required value={newApptForm.name} onChange={e => { setNewApptForm({...newApptForm, name: e.target.value}); if (isExistingPatient === true && !patientSearchResults.some((p: any) => p.name === e.target.value)) { setIsExistingPatient(false); } }} />
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small">Clinic</label>
                  <select className="form-select" value={newApptForm.location} onChange={e => setNewApptForm({...newApptForm, location: e.target.value})}>
                    <option value="chettiyamkinar">Chettiyamkinar</option>
                    <option value="kurukathani">Kurukathani</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small">Service</label>
                  <select className="form-select" value={newApptForm.service} onChange={e => setNewApptForm({...newApptForm, service: e.target.value})}>
                    <option value="General Consultation">General Consultation</option>
                    <option value="checkup">Checkup & Cleaning</option>
                    <option value="whitening">Teeth Whitening</option>
                    <option value="implants">Dental Implants</option>
                    <option value="Root Canal">Root Canal</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small">Date</label>
                  <input type="date" className="form-control" required value={newApptForm.date} onChange={e => setNewApptForm({...newApptForm, date: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small">Time Slot (e.g. 10:30 AM)</label>
                  <input type="text" className="form-control" required placeholder="e.g. 10:30 AM" value={newApptForm.time} onChange={e => setNewApptForm({...newApptForm, time: e.target.value})} />
                </div>
              </div>
              <div className="mt-4 text-end">
                <button type="button" className="btn btn-light me-2" onClick={() => { setShowAddModal(false); setPatientSearchResults([]); setIsExistingPatient(null); setShowPatientDropdown(false); }}>Cancel</button>
                <button type="submit" className="btn text-white fw-bold" style={{ background: THEME.primary }} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MAIN DASHBOARD ─── */}
      <div className="container-fluid px-3 px-lg-4 py-4">

        {/* Controls Header */}
        <div className="row align-items-center mb-4 g-3">
          <div className="col-md-4">
            <button onClick={() => setShowAddModal(true)} className="btn text-white fw-bold shadow-sm" style={{ background: THEME.gold }}>
              <i className="bi bi-plus-lg me-2"></i>New Appointment
            </button>
            <button onClick={() => { startRinging(); setLiveAlert({ show: true, message: "New Appointment Arrived!" }); }} className="btn btn-link text-muted ms-2 btn-sm">
              Test Audio
            </button>
          </div>
          <div className="col-md-8 text-md-end d-flex justify-content-md-end gap-3 align-items-center">
            {/* Show Date Picker ONLY if "Previous" tab is active */}
            {activeTab === 'previous' && (
              <input
                type="date"
                className="form-control border-secondary text-secondary"
                style={{ maxWidth: '180px' }}
                value={pastDateFilter}
                onChange={e => setPastDateFilter(e.target.value)}
              />
            )}
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search patient or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Custom Tabs */}
        <ul className="nav nav-tabs mb-4 border-bottom-0 custom-tabs">
          <li className="nav-item">
            <button className={`nav-link fw-bold ${activeTab === 'active' ? 'active-tab' : 'text-muted'}`} onClick={() => setActiveTab('active')}>
              <i className="bi bi-calendar-event me-2"></i> Upcoming / Today
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link fw-bold ${activeTab === 'previous' ? 'active-tab' : 'text-muted'}`} onClick={() => setActiveTab('previous')}>
              <i className="bi bi-clock-history me-2"></i> Previous Appointments
            </button>
          </li>
        </ul>

        {/* Data Table */}
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
                {filteredAppointments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-5 text-muted">No appointments found matching this view.</td></tr>
                ) : (
                  filteredAppointments.map((app) => (
                    <tr key={app.id} style={{ backgroundColor: app.status === 'Pending' ? '#fffdf5' : app.status === 'Check-in' ? '#f0f9ff' : 'transparent' }}>
                      <td className="px-4">
                        <div className="fw-bold text-dark">{new Date(app.date).toLocaleDateString()}</div>
                        <div className="text-muted small">{app.time}</div>
                      </td>
                      <td className="fw-semibold">{app.name}</td>
                      <td>{app.phone}</td>
                      <td>
                        <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>{app.location === 'chettiyamkinar' ? 'Chettiyamkinar' : 'Kurukathani'}</div>
                        <div className="text-muted small" style={{ textTransform: "capitalize" }}>{app.service}</div>
                      </td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td className="text-end px-4">
                        {renderActionButtons(app)}
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
    </AdminLayout>
  );
}

// ─── COMPONENT STYLES ───
const AdminStyles = ({ theme }: { theme: any }) => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes ring {
      0% { transform: rotate(0); }
      15% { transform: rotate(20deg); }
      30% { transform: rotate(-20deg); }
      45% { transform: rotate(15deg); }
      60% { transform: rotate(-15deg); }
      75% { transform: rotate(10deg); }
      90% { transform: rotate(-10deg); }
      100% { transform: rotate(0); }
    }
    @keyframes pulseCard {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,53,69,0.7); }
      50% { transform: scale(1.02); box-shadow: 0 0 0 15px rgba(220,53,69,0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,53,69,0); }
    }
    .alert-pulse-card {
      animation: pulseCard 1.5s infinite;
      border: 2px solid #dc3545 !important;
    }

    .custom-tabs .nav-link {
      border: none;
      background: transparent;
      padding: 0.8rem 1.5rem;
      border-radius: 50px;
      margin-right: 0.5rem;
      transition: all 0.3s ease;
    }
    .custom-tabs .nav-link:hover {
      background: rgba(8,99,81,0.05);
    }
    .custom-tabs .active-tab {
      background: ${theme.primary} !important;
      color: white !important;
      box-shadow: 0 4px 15px rgba(8,99,81,0.2);
    }
  `}} />
);
