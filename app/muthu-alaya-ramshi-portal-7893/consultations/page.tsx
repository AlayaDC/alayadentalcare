"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";
import AdminLoadingSpinner from "../../../components/AdminLoadingSpinner";
import AdminLayout from "../../../components/AdminLayout";

interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
}

interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  date: string;
  chief_complaint: string | null;
  examination_notes: string | null;
  dental_history: string | null;
  medical_history: any[];
  status: string;
  created_at: string;
  patients: Patient;
  doctors: { id: string; name: string } | null;
  patient_treatments: Array<{
    id: string;
    treatment_name: string;
    tooth_numbers: number[];
    status: string;
    amount: number;
  }>;
}

export default function ConsultationsPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [consultDate, setConsultDate] = useState(new Date().toISOString().split("T")[0]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [examinationNotes, setExaminationNotes] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const themeColor = "#086351";
  const supabase = createClient();

  const fetchConsultations = useCallback(async (search = "", status = "") => {
    try {
      let url = "/api/admin/consultations?limit=100";
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok && result.data) setConsultations(result.data);
    } catch (error) {
      console.error("Error fetching consultations:", error);
    }
  }, []);

  const fetchPatients = useCallback(async (search = "") => {
    try {
      const url = search
        ? `/api/admin/patients?search=${encodeURIComponent(search)}&limit=10`
        : "/api/admin/patients?limit=10";
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok && result.data) setPatients(result.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/doctors");
      const result = await res.json();
      if (res.ok && result.data) setDoctors(result.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) {
          await Promise.all([fetchConsultations(), fetchDoctors()]);
          setDataLoading(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [supabase.auth, fetchConsultations, fetchDoctors]);

  // Search + filter debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) fetchConsultations(searchTerm, statusFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, user, fetchConsultations]);

  // Patient search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch.length >= 2) {
        fetchPatients(patientSearch);
        setShowPatientDropdown(true);
      } else {
        setShowPatientDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, fetchPatients]);

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setMessage("Please select a patient");
      return;
    }
    setIsSubmitting(true);
    setMessage("");

    try {
      const payload: Record<string, unknown> = {
        patient_id: selectedPatientId,
        date: consultDate,
        chief_complaint: chiefComplaint.trim() || null,
        examination_notes: examinationNotes.trim() || null,
      };
      if (selectedDoctorId) payload.doctor_id = selectedDoctorId;

      const res = await fetch("/api/admin/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create consultation");
      alert("Consultation created successfully!");
      closeModal();
      fetchConsultations(searchTerm, statusFilter);
    } catch (error: any) {
      setMessage(`Failed: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this consultation? This will also delete associated treatments.")) return;
    try {
      const res = await fetch(`/api/admin/consultations?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchConsultations(searchTerm, statusFilter);
    } catch {
      alert("Failed to delete consultation.");
    }
  };


  // --- Auto-open modal if patient_id param exists (from Patients page) ---
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patient_id');
    const pName = params.get('patient_name');
    const pPhone = params.get('patient_phone');
    if (pId && pName) {
      setSelectedPatientId(pId);
      setPatientSearch(pName + (pPhone ? ` (${pPhone})` : ''));
      setSelectedDoctorId("");
      setConsultDate(new Date().toISOString().split("T")[0]);
      setChiefComplaint("");
      setExaminationNotes("");
      setMessage("");
      setShowModal(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  const openAddModal = () => {
    setSelectedPatientId("");
    setSelectedDoctorId("");
    setConsultDate(new Date().toISOString().split("T")[0]);
    setChiefComplaint("");
    setExaminationNotes("");
    setPatientSearch("");
    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setMessage("");
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setPatientSearch(patient.name + " (" + patient.phone + ")");
    setShowPatientDropdown(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getTreatmentTotal = (treatments: Consultation["patient_treatments"]) => {
    return treatments?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
  };

  if (authLoading) {
    return <AdminLoadingSpinner />;
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
    <AdminLayout currentPage="consultations" onLogout={handleLogout}>
      {dataLoading ? (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="spinner-border" style={{ color: themeColor, width: "2.5rem", height: "2.5rem" }}></div>
          <p className="mt-3 text-muted fw-semibold small">Loading consultations...</p>
        </div>
      ) : (
      <>
      <div className="container-fluid px-3 px-lg-4 py-4">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-3 mb-sm-0" style={{ color: themeColor }}>
            <i className="bi bi-journal-medical me-2"></i>
            Consultations
            <span className="badge ms-2" style={{ backgroundColor: themeColor, fontSize: "0.55em", verticalAlign: "middle" }}>
              {consultations.length} records
            </span>
          </h4>
          <button onClick={openAddModal} className="btn text-white fw-bold px-4 py-2 shadow-sm w-100 w-sm-auto" style={{ backgroundColor: themeColor, borderRadius: "10px" }}>
            <i className="bi bi-plus-circle me-2"></i> New Consultation
          </button>
        </div>

        {/* Search & Filter */}
        <div className="row g-2 mb-4">
          <div className="col-md-8">
            <div className="input-group shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>
              <span className="input-group-text bg-white border-0 ps-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 py-2"
                placeholder="Search by patient name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ outline: "none", boxShadow: "none" }}
              />
              {searchTerm && (
                <button className="btn bg-white border-0 pe-3" onClick={() => setSearchTerm("")}>
                  <i className="bi bi-x-lg text-muted"></i>
                </button>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select shadow-sm py-2"
              style={{ borderRadius: "12px", border: "none" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="d-none d-md-block card border-0 shadow-sm" style={{ borderRadius: "15px", overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3">Patient</th>
                  <th className="py-3">Doctor</th>
                  <th className="py-3">Chief Complaint</th>
                  <th className="py-3">Treatments</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      <i className="bi bi-journal-x display-6 d-block mb-2"></i>
                      {searchTerm ? "No consultations matching your search." : "No consultations yet. Create your first one!"}
                    </td>
                  </tr>
                ) : (
                  consultations.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4">{formatDate(c.date)}</td>
                      <td>
                        <div className="fw-semibold">{c.patients?.name || "-"}</div>
                        <small className="text-muted">{c.patients?.phone}</small>
                      </td>
                      <td>{c.doctors?.name || "-"}</td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: "200px" }}>
                          {c.chief_complaint || "-"}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {c.patient_treatments?.length || 0} items
                        </span>
                      </td>
                      <td className="fw-semibold">
                        &#8377;{getTreatmentTotal(c.patient_treatments).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 ${c.status === "Open" ? "bg-warning text-dark" : "bg-success"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="text-end px-4">
                        <div className="d-flex gap-1 justify-content-end">
                          <Link
                            href={`/muthu-alaya-ramshi-portal-7893/consultation/${c.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye"></i> View
                          </Link>
                          <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="d-block d-md-none">
          {consultations.length === 0 ? (
            <div className="text-center py-4 text-muted bg-white shadow-sm rounded">
              <i className="bi bi-journal-x display-6 d-block mb-2"></i>
              {searchTerm ? "No consultations matching your search." : "No consultations yet."}
            </div>
          ) : (
            consultations.map((c) => (
              <div key={c.id} className="card border-0 shadow-sm mb-3" style={{ borderRadius: "15px" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="fw-bold mb-0">{c.patients?.name || "Unknown"}</h6>
                      <small className="text-muted">{c.patients?.phone}</small>
                    </div>
                    <span className={`badge rounded-pill px-3 py-1 ${c.status === "Open" ? "bg-warning text-dark" : "bg-success"}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-calendar me-1"></i>{formatDate(c.date)}
                    </span>
                    {c.doctors?.name && (
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-person-badge me-1"></i>{c.doctors.name}
                      </span>
                    )}
                    <span className="badge bg-light text-dark border">
                      {c.patient_treatments?.length || 0} treatments
                    </span>
                    <span className="badge bg-light text-dark border fw-bold">
                      &#8377;{getTreatmentTotal(c.patient_treatments).toLocaleString()}
                    </span>
                  </div>
                  {c.chief_complaint && (
                    <p className="text-muted small mt-2 mb-0">{c.chief_complaint}</p>
                  )}
                </div>
                <div className="card-footer bg-white border-top-0 d-flex justify-content-end gap-2 pb-3">
                  <Link
                    href={`/muthu-alaya-ramshi-portal-7893/consultation/${c.id}`}
                    className="btn btn-sm btn-outline-primary flex-fill"
                  >
                    <i className="bi bi-eye me-1"></i> View
                  </Link>
                  <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-outline-danger">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Consultation Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px" }}>
              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>
                  <i className="bi bi-journal-plus me-2"></i>New Consultation
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>

              <div className="modal-body px-4 py-3">
                {message && <div className="alert alert-danger py-2">{message}</div>}

                <form onSubmit={handleCreateConsultation}>
                  <div className="row g-3">
                    {/* Patient Search */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Patient *</label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className="form-control form-control-lg bg-light border-0"
                          placeholder="Search patient by name or phone..."
                          value={patientSearch}
                          onChange={(e) => {
                            setPatientSearch(e.target.value);
                            setSelectedPatientId("");
                          }}
                        />
                        {selectedPatientId && (
                          <span className="position-absolute top-50 end-0 translate-middle-y me-3">
                            <i className="bi bi-check-circle-fill text-success"></i>
                          </span>
                        )}
                        {showPatientDropdown && patients.length > 0 && (
                          <div className="position-absolute w-100 bg-white border shadow-sm rounded-3 mt-1" style={{ zIndex: 1060, maxHeight: "200px", overflowY: "auto" }}>
                            {patients.map((p) => (
                              <div
                                key={p.id}
                                className="px-3 py-2 cursor-pointer border-bottom"
                                style={{ cursor: "pointer" }}
                                onClick={() => selectPatient(p)}
                              >
                                <div className="fw-semibold">{p.name}</div>
                                <small className="text-muted">{p.phone} {p.age ? `| Age: ${p.age}` : ""} {p.gender || ""}</small>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Doctor */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Doctor</label>
                      <select
                        className="form-select form-select-lg bg-light border-0"
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                      >
                        <option value="">Select Doctor (optional)</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Date</label>
                      <input
                        type="date"
                        className="form-control form-control-lg bg-light border-0"
                        value={consultDate}
                        onChange={(e) => setConsultDate(e.target.value)}
                      />
                    </div>

                    {/* Chief Complaint */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Chief Complaint</label>
                      <textarea
                        className="form-control bg-light border-0"
                        rows={2}
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Patient's main complaint or reason for visit..."
                      ></textarea>
                    </div>

                    {/* Examination Notes */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Examination Notes</label>
                      <textarea
                        className="form-control bg-light border-0"
                        rows={3}
                        value={examinationNotes}
                        onChange={(e) => setExaminationNotes(e.target.value)}
                        placeholder="Clinical examination findings..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <button
                      type="submit"
                      className="btn btn-lg w-100 text-white fw-bold shadow-sm"
                      style={{ backgroundColor: themeColor, borderRadius: "12px" }}
                      disabled={isSubmitting || !selectedPatientId}
                    >
                      {isSubmitting ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Creating...</>
                      ) : (
                        "Create Consultation"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </AdminLayout>
  );
}
