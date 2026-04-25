"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminAuth } from "../../../components/AdminAuthContext";

export default function ManagePatientsPage() {
  const { logout } = useAdminAuth();
  const [dataLoading, setDataLoading] = useState(true);

  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Form States ---
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // --- Modal State ---
  const [showModal, setShowModal] = useState(false);

  // --- View Patient Modal ---
  const [viewPatient, setViewPatient] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // --- Post-save state: show Book Consultation button ---
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);

  // --- History Modal ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState<any>(null);
  const [historyData, setHistoryData] = useState<{ appointments: any[]; consultations: any[]; invoices: any[] }>({ appointments: [], consultations: [], invoices: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  const themeColor = '#086351';

  // --- Fetch Patients ---
  const fetchPatients = useCallback(async (search = "") => {
    try {
      const url = search
        ? `/api/admin/patients?search=${encodeURIComponent(search)}`
        : `/api/admin/patients`;
      const response = await fetch(url);
      const result = await response.json();
      if (response.ok && result.data) setPatientsList(result.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchPatients();
      setDataLoading(false);
    };
    init();
  }, [fetchPatients]);

  // --- Auto-open view modal if highlight param exists ---
  useEffect(() => {
    if (patientsList.length > 0 && !showViewModal) {
      const params = new URLSearchParams(window.location.search);
      const hId = params.get('highlight');
      if (hId) {
        const patient = patientsList.find((p: any) => p.id === hId);
        if (patient) {
          setViewPatient(patient);
          setShowViewModal(true);
          // Clean URL without reload
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [patientsList]);

  // --- Search with debounce ---
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchPatients]);

  // --- Save Patient (Add / Edit) ---
  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const medicalHistoryArray = medicalHistory
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const payload: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        blood_group: bloodGroup || null,
        address: address.trim() || null,
        medical_history: medicalHistoryArray,
        notes: notes.trim() || null,
      };

      if (editingId) {
        const response = await fetch('/api/admin/patients', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to update patient");
        setSavedPatientId(editingId);
      } else {
        const response = await fetch('/api/admin/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to add patient");
        setSavedPatientId(result.data?.id || null);
      }

      fetchPatients(searchTerm);
    } catch (error: any) {
      setMessage(`Failed: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  // --- Edit Patient ---
  const handleEdit = (patient: any) => {
    setEditingId(patient.id);
    setName(patient.name || "");
    setPhone(patient.phone || "");
    setEmail(patient.email || "");
    setAge(patient.age?.toString() || "");
    setGender(patient.gender || "");
    setBloodGroup(patient.blood_group || "");
    setAddress(patient.address || "");
    setMedicalHistory(
      Array.isArray(patient.medical_history)
        ? patient.medical_history.join(", ")
        : ""
    );
    setNotes(patient.notes || "");
    setMessage("");
    setShowModal(true);
  };

  // --- Delete Patient ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this patient? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/admin/patients?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Delete failed");
      fetchPatients(searchTerm);
    } catch (error) {
      alert("Failed to delete patient.");
    }
  };

  // --- View Patient History ---
  const handleViewHistory = async (patient: any) => {
    setHistoryPatient(patient);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const [apptRes, consultRes, invRes] = await Promise.all([
        fetch('/api/admin/appointments'),
        fetch(`/api/admin/consultations?patient_id=${patient.id}`),
        fetch(`/api/admin/invoices?patient_id=${patient.id}`),
      ]);
      const [apptData, consultData, invData] = await Promise.all([
        apptRes.json(), consultRes.json(), invRes.json(),
      ]);
      // Filter appointments by phone match
      const phone10 = patient.phone?.replace(/\D/g, '').slice(-10);
      const appts = (apptData.data || []).filter((a: any) => a.phone?.replace(/\D/g, '').slice(-10) === phone10);
      setHistoryData({
        appointments: appts,
        consultations: consultData.data || [],
        invoices: invData.data || [],
      });
    } catch {
      setHistoryData({ appointments: [], consultations: [], invoices: [] });
    }
    setHistoryLoading(false);
  };

  // --- Modal Controls ---
  const openAddModal = () => {
    setEditingId(null);
    setName(""); setPhone(""); setEmail(""); setAge("");
    setGender(""); setBloodGroup(""); setAddress("");
    setMedicalHistory(""); setNotes("");
    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setSavedPatientId(null);
    setName(""); setPhone(""); setEmail(""); setAge("");
    setGender(""); setBloodGroup(""); setAddress("");
    setMedicalHistory(""); setNotes("");
    setMessage("");
  };

  // --- View Patient ---
  const handleView = (patient: any) => {
    setViewPatient(patient);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewPatient(null);
  };

  // --- Book Consultation from View Modal ---
  const handleBookConsultation = (patient: any) => {
    closeViewModal();
    const params = new URLSearchParams({ patient_id: patient.id, patient_name: patient.name, patient_phone: patient.phone || '' });
    window.location.href = `/muthu-alaya-ramshi-portal-7893/consultations?${params.toString()}`;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {dataLoading ? (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="spinner-border" style={{ color: themeColor, width: "2.5rem", height: "2.5rem" }}></div>
          <p className="mt-3 text-muted fw-semibold small">Loading patients...</p>
        </div>
      ) : (
      <>
      <div className="container-fluid px-3 px-lg-4 py-4">

        {/* Header, Search, and Add Button */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-3 mb-sm-0" style={{ color: themeColor }}>
            Patients Database
            <span className="badge ms-2" style={{ backgroundColor: themeColor, fontSize: '0.55em', verticalAlign: 'middle' }}>
              {patientsList.length} records
            </span>
          </h4>
          <button onClick={openAddModal} className="btn text-white fw-bold px-4 py-2 shadow-sm w-100 w-sm-auto" style={{ backgroundColor: themeColor, borderRadius: '10px' }}>
            <i className="bi bi-person-plus-fill me-2"></i> Add Patient
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <span className="input-group-text bg-white border-0 ps-3">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 py-2"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            {searchTerm && (
              <button
                className="btn bg-white border-0 pe-3"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x-lg text-muted"></i>
              </button>
            )}
          </div>
        </div>

        {/* --- DESKTOP VIEW: Data Table --- */}
        <div className="d-none d-md-block card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3">Name</th>
                  <th className="py-3">Phone</th>
                  <th className="py-3">Age</th>
                  <th className="py-3">Gender</th>
                  <th className="py-3">Blood Group</th>
                  <th className="py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patientsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      {searchTerm ? "No patients found matching your search." : "No patients found in database."}
                    </td>
                  </tr>
                ) : (
                  patientsList.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-4">
                        <span className="badge bg-light text-dark border fw-bold" style={{ fontSize: '0.8rem' }}>
                          {patient.patient_code || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold">{patient.name}</div>
                        {patient.email && (
                          <small className="text-muted">{patient.email}</small>
                        )}
                      </td>
                      <td>{patient.phone}</td>
                      <td>{patient.age || "-"}</td>
                      <td>{patient.gender || "-"}</td>
                      <td>
                        {patient.blood_group ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger fw-bold px-2 py-1">
                            {patient.blood_group}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-end px-4">
                        <button onClick={() => handleView(patient)} className="btn btn-sm fw-bold text-white" style={{ background: themeColor, borderRadius: '8px' }}>
                          <i className="bi bi-eye me-1"></i> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MOBILE VIEW: Card Layout --- */}
        <div className="d-block d-md-none">
          {patientsList.length === 0 ? (
            <div className="text-center py-4 text-muted bg-white shadow-sm rounded">
              {searchTerm ? "No patients found matching your search." : "No patients found in database."}
            </div>
          ) : (
            patientsList.map((patient) => (
              <div key={patient.id} className="card border-0 shadow-sm mb-3" style={{ borderRadius: '15px' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <div
                      className="d-flex justify-content-center align-items-center me-3 shadow-sm"
                      style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        backgroundColor: themeColor + '20',
                        color: themeColor,
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                      }}
                    >
                      {patient.name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0">{patient.name}</h6>
                      <small className="text-muted">{patient.phone}</small>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {patient.age && (
                      <span className="badge bg-light text-dark border">Age: {patient.age}</span>
                    )}
                    {patient.gender && (
                      <span className="badge bg-light text-dark border">{patient.gender}</span>
                    )}
                    {patient.blood_group && (
                      <span className="badge bg-danger bg-opacity-10 text-danger fw-bold">{patient.blood_group}</span>
                    )}
                    {patient.email && (
                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.75rem' }}>{patient.email}</span>
                    )}
                  </div>
                  {patient.medical_history && patient.medical_history.length > 0 && (
                    <div className="mt-2">
                      {patient.medical_history.map((tag: string, idx: number) => (
                        <span key={idx} className="badge me-1 mb-1" style={{ backgroundColor: themeColor + '15', color: themeColor, fontSize: '0.75rem' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card-footer bg-white border-top-0 d-flex justify-content-end gap-2 pb-3">
                  <button onClick={() => handleView(patient)} className="btn btn-sm fw-bold text-white flex-fill" style={{ background: themeColor, borderRadius: '8px' }}>
                    <i className="bi bi-eye me-1"></i> View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* --- MODAL FOR ADD/EDIT --- */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>

              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>
                  {editingId ? "Edit Patient" : "Add New Patient"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>

              <div className="modal-body px-4 py-3">
                {message && (
                  <div className="alert alert-danger py-2">{message}</div>
                )}

                <form onSubmit={handleSavePatient}>
                  <div className="row g-3">
                    {/* Full Name */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Phone Number</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Email</label>
                      <input
                        type="email"
                        className="form-control form-control-lg bg-light border-0"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Age */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Age</label>
                      <input
                        type="number"
                        className="form-control form-control-lg bg-light border-0"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Enter age"
                        min="0"
                        max="150"
                      />
                    </div>

                    {/* Gender */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Gender</label>
                      <select
                        className="form-select form-select-lg bg-light border-0"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Blood Group */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Blood Group</label>
                      <select
                        className="form-select form-select-lg bg-light border-0"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    {/* Address */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Address</label>
                      <textarea
                        className="form-control bg-light border-0"
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter address"
                      ></textarea>
                    </div>

                    {/* Medical History */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Medical History</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={medicalHistory}
                        onChange={(e) => setMedicalHistory(e.target.value)}
                        placeholder="e.g. Diabetes, Thyroid, BP (comma-separated)"
                      />
                      {medicalHistory && (
                        <div className="mt-2">
                          {medicalHistory
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter((tag) => tag.length > 0)
                            .map((tag, idx) => (
                              <span
                                key={idx}
                                className="badge me-1 mb-1"
                                style={{ backgroundColor: themeColor + '15', color: themeColor, fontSize: '0.8rem' }}
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Notes</label>
                      <textarea
                        className="form-control bg-light border-0"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes about the patient..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 d-flex flex-column gap-2">
                    {!savedPatientId ? (
                      <button
                        type="submit"
                        className="btn btn-lg w-100 text-white fw-bold shadow-sm"
                        style={{ backgroundColor: themeColor, borderRadius: '12px' }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span> Saving...</>
                        ) : (
                          editingId ? "Update Patient Details" : "Save New Patient"
                        )}
                      </button>
                    ) : (
                      <>
                        <div className="alert alert-success py-2 text-center fw-semibold mb-2">
                          <i className="bi bi-check-circle me-2"></i>Patient saved successfully!
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBookConsultation({ id: savedPatientId, name })}
                          className="btn btn-lg w-100 text-white fw-bold shadow-sm"
                          style={{ backgroundColor: themeColor, borderRadius: '12px' }}
                        >
                          <i className="bi bi-clipboard2-pulse me-2"></i> Book Consultation
                        </button>
                        <button
                          type="button"
                          onClick={closeModal}
                          className="btn btn-lg w-100 btn-outline-secondary fw-bold"
                          style={{ borderRadius: '12px' }}
                        >
                          Close
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- VIEW PATIENT MODAL --- */}
      {showViewModal && viewPatient && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>

              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>Patient Details</h5>
                <button type="button" className="btn-close" onClick={closeViewModal}></button>
              </div>

              <div className="modal-body px-4 py-3">
                {/* Patient Avatar & Name */}
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex justify-content-center align-items-center shadow-sm mb-3"
                    style={{
                      width: '70px', height: '70px', borderRadius: '50%',
                      backgroundColor: themeColor + '20', color: themeColor,
                      fontWeight: 'bold', fontSize: '1.6rem',
                    }}
                  >
                    {viewPatient.name?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                  {viewPatient.patient_code && (
                    <span className="badge mb-2" style={{ backgroundColor: themeColor, fontSize: '0.8rem' }}>{viewPatient.patient_code}</span>
                  )}
                  <h5 className="fw-bold mb-1">{viewPatient.name}</h5>
                  <p className="text-muted mb-0">{viewPatient.phone}</p>
                </div>

                {/* Details Grid */}
                <div className="row g-3 mb-3">
                  {viewPatient.email && (
                    <div className="col-6">
                      <small className="text-muted d-block">Email</small>
                      <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{viewPatient.email}</span>
                    </div>
                  )}
                  <div className="col-6">
                    <small className="text-muted d-block">Age</small>
                    <span className="fw-semibold">{viewPatient.age || "—"}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Gender</small>
                    <span className="fw-semibold">{viewPatient.gender || "—"}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Blood Group</small>
                    {viewPatient.blood_group ? (
                      <span className="badge bg-danger bg-opacity-10 text-danger fw-bold">{viewPatient.blood_group}</span>
                    ) : <span className="fw-semibold">—</span>}
                  </div>
                </div>

                {viewPatient.address && (
                  <div className="mb-3">
                    <small className="text-muted d-block">Address</small>
                    <span style={{ fontSize: '0.9rem' }}>{viewPatient.address}</span>
                  </div>
                )}

                {viewPatient.medical_history && viewPatient.medical_history.length > 0 && (
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Medical History</small>
                    <div>
                      {viewPatient.medical_history.map((tag: string, idx: number) => (
                        <span key={idx} className="badge me-1 mb-1" style={{ backgroundColor: themeColor + '15', color: themeColor, fontSize: '0.8rem' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {viewPatient.notes && (
                  <div className="mb-3">
                    <small className="text-muted d-block">Notes</small>
                    <span style={{ fontSize: '0.9rem' }}>{viewPatient.notes}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex flex-column gap-2 mt-4 pt-2 border-top">
                  <button
                    onClick={() => { closeViewModal(); handleEdit(viewPatient); }}
                    className="btn btn-outline-primary fw-bold w-100"
                    style={{ borderRadius: '10px', padding: '0.6rem' }}
                  >
                    <i className="bi bi-pencil-square me-2"></i> Edit Patient
                  </button>
                  <button
                    onClick={() => { closeViewModal(); handleViewHistory(viewPatient); }}
                    className="btn btn-outline-secondary fw-bold w-100"
                    style={{ borderRadius: '10px', padding: '0.6rem' }}
                  >
                    <i className="bi bi-clock-history me-2"></i> History
                  </button>
                  <button
                    onClick={() => handleBookConsultation(viewPatient)}
                    className="btn text-white fw-bold w-100"
                    style={{ background: themeColor, borderRadius: '10px', padding: '0.6rem' }}
                  >
                    <i className="bi bi-clipboard2-pulse me-2"></i> Book Consultation
                  </button>
                  <button
                    onClick={() => { closeViewModal(); handleDelete(viewPatient.id); }}
                    className="btn btn-outline-danger fw-bold w-100"
                    style={{ borderRadius: '10px', padding: '0.6rem' }}
                  >
                    <i className="bi bi-trash me-2"></i> Delete Patient
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY MODAL --- */}
      {showHistoryModal && historyPatient && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>
                  <i className="bi bi-clock-history me-2"></i>
                  History — {historyPatient.name}
                  {historyPatient.patient_code && <span className="badge ms-2" style={{ backgroundColor: themeColor, fontSize: '0.7em' }}>{historyPatient.patient_code}</span>}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowHistoryModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-3">
                {historyLoading ? (
                  <div className="text-center py-5"><div className="spinner-border" style={{ color: themeColor }}></div></div>
                ) : (
                  <>
                    {/* Appointments */}
                    <h6 className="fw-bold mb-2" style={{ color: themeColor }}><i className="bi bi-calendar-check me-2"></i>Appointments ({historyData.appointments.length})</h6>
                    {historyData.appointments.length === 0 ? (
                      <p className="text-muted small mb-4">No appointments found.</p>
                    ) : (
                      <div className="table-responsive mb-4">
                        <table className="table table-sm table-hover mb-0">
                          <thead className="table-light"><tr><th>Date</th><th>Time</th><th>Service</th><th>Location</th><th>Status</th></tr></thead>
                          <tbody>
                            {historyData.appointments.map((a: any) => (
                              <tr key={a.id}>
                                <td>{new Date(a.date).toLocaleDateString()}</td>
                                <td>{a.time}</td>
                                <td style={{ textTransform: 'capitalize' }}>{a.service}</td>
                                <td style={{ textTransform: 'capitalize' }}>{a.location}</td>
                                <td><span className={`badge ${a.status === 'Check-in' ? 'bg-info' : a.status === 'Cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>{a.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Consultations */}
                    <h6 className="fw-bold mb-2" style={{ color: themeColor }}><i className="bi bi-clipboard2-pulse me-2"></i>Consultations ({historyData.consultations.length})</h6>
                    {historyData.consultations.length === 0 ? (
                      <p className="text-muted small mb-4">No consultations found.</p>
                    ) : (
                      <div className="table-responsive mb-4">
                        <table className="table table-sm table-hover mb-0">
                          <thead className="table-light"><tr><th>Date</th><th>Complaint</th><th>Doctor</th><th>Status</th><th></th></tr></thead>
                          <tbody>
                            {historyData.consultations.map((c: any) => (
                              <tr key={c.id}>
                                <td>{new Date(c.date).toLocaleDateString()}</td>
                                <td className="text-truncate" style={{ maxWidth: '200px' }}>{c.chief_complaint || '—'}</td>
                                <td>{c.doctors?.name || '—'}</td>
                                <td><span className={`badge ${c.status === 'Open' ? 'bg-warning text-dark' : 'bg-success'}`}>{c.status}</span></td>
                                <td><Link href={`/muthu-alaya-ramshi-portal-7893/consultation/${c.id}`} className="btn btn-sm btn-outline-primary py-0 px-2"><i className="bi bi-eye"></i></Link></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Invoices */}
                    <h6 className="fw-bold mb-2" style={{ color: themeColor }}><i className="bi bi-receipt me-2"></i>Invoices ({historyData.invoices.length})</h6>
                    {historyData.invoices.length === 0 ? (
                      <p className="text-muted small mb-0">No invoices found.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover mb-0">
                          <thead className="table-light"><tr><th>Invoice #</th><th>Date</th><th>Total</th><th>Paid</th><th>Status</th><th>Notes</th></tr></thead>
                          <tbody>
                            {historyData.invoices.map((inv: any) => (
                              <tr key={inv.id}>
                                <td className="fw-semibold">{inv.invoice_number || '—'}</td>
                                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                                <td>&#8377;{(Number(inv.total) || 0).toLocaleString()}</td>
                                <td>&#8377;{(Number(inv.paid_amount) || 0).toLocaleString()}</td>
                                <td><span className={`badge ${inv.status === 'Paid' ? 'bg-success' : inv.status === 'Partial' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{inv.status}</span></td>
                                <td className="text-muted small">{inv.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      </>
      )}
    </>
  );
}
