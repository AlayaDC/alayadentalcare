"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../../utils/supabase/client";
import AdminLayout from "../../../../components/AdminLayout";

interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
}

interface Treatment {
  id: string;
  consultation_id: string;
  patient_id: string;
  treatment_id: string | null;
  treatment_name: string;
  tooth_numbers: number[];
  status: string;
  amount: number;
  notes: string | null;
}

interface DentalChartEntry {
  id: string;
  patient_id: string;
  tooth_number: number;
  condition: string;
  notes: string | null;
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
  patients: Patient;
  doctors: { id: string; name: string } | null;
  patient_treatments: Treatment[];
}

// FDI tooth numbering - upper and lower jaw layout
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const DENTAL_CONDITIONS = [
  "Caries",
  "Filling",
  "Crown",
  "Bridge",
  "Root Canal",
  "Missing",
  "Implant",
  "Fracture",
  "Mobility",
  "Abscess",
  "Impacted",
  "Periodontitis",
];

const CONDITION_COLORS: Record<string, string> = {
  Caries: "#dc3545",
  Filling: "#0d6efd",
  Crown: "#6f42c1",
  Bridge: "#6610f2",
  "Root Canal": "#fd7e14",
  Missing: "#6c757d",
  Implant: "#20c997",
  Fracture: "#e83e8c",
  Mobility: "#ffc107",
  Abscess: "#dc3545",
  Impacted: "#495057",
  Periodontitis: "#d63384",
};

export default function ConsultationDetailPage() {
  const params = useParams();
  const consultationId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [dentalChart, setDentalChart] = useState<DentalChartEntry[]>([]);
  const [treatmentCatalog, setTreatmentCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Treatment form
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentAmount, setTreatmentAmount] = useState("");
  const [treatmentTeeth, setTreatmentTeeth] = useState<number[]>([]);
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dental chart form
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartTooth, setChartTooth] = useState<number>(0);
  const [chartCondition, setChartCondition] = useState("");
  const [chartNotes, setChartNotes] = useState("");

  // Edit consultation
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editChiefComplaint, setEditChiefComplaint] = useState("");
  const [editExamNotes, setEditExamNotes] = useState("");
  const [editDentalHistory, setEditDentalHistory] = useState("");

  // Invoice generation
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const themeColor = "#086351";
  const supabase = createClient();

  const fetchConsultation = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/consultations?limit=1&patient_id=_`);
      // We need a single consultation fetch, let's use a workaround
      const allRes = await fetch(`/api/admin/consultations?limit=200`);
      const allResult = await allRes.json();
      if (allRes.ok && allResult.data) {
        const found = allResult.data.find((c: any) => c.id === consultationId);
        if (found) setConsultation(found);
      }
    } catch (error) {
      console.error("Error fetching consultation:", error);
    }
  }, [consultationId]);

  const fetchTreatments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/patient-treatments?consultation_id=${consultationId}`);
      const result = await res.json();
      if (res.ok && result.data) setTreatments(result.data);
    } catch (error) {
      console.error("Error fetching treatments:", error);
    }
  }, [consultationId]);

  const fetchDentalChart = useCallback(async (patientId: string) => {
    try {
      const res = await fetch(`/api/admin/dental-chart?patient_id=${patientId}`);
      const result = await res.json();
      if (res.ok && result.data) setDentalChart(result.data);
    } catch (error) {
      console.error("Error fetching dental chart:", error);
    }
  }, []);

  const fetchTreatmentCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/services");
      const result = await res.json();
      if (res.ok && result.data) {
        // Map services to catalog format: use title as name, and extract prices
        const mapped = result.data
          .filter((s: any) => s.is_active !== false)
          .map((s: any) => ({
            id: s.id,
            name: s.title,
            category: s.category || "General",
            prices: Array.isArray(s.prices) ? s.prices : [],
          }));
        setTreatmentCatalog(mapped);
      }
    } catch (error) {
      console.error("Error fetching treatment catalog:", error);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) {
          await Promise.all([fetchConsultation(), fetchTreatments(), fetchTreatmentCatalog()]);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
        setLoading(false);
      }
    };
    checkSession();
  }, [supabase.auth, fetchConsultation, fetchTreatments, fetchTreatmentCatalog]);

  // Fetch dental chart when consultation loads
  useEffect(() => {
    if (consultation?.patient_id) {
      fetchDentalChart(consultation.patient_id);
    }
  }, [consultation?.patient_id, fetchDentalChart]);

  // --- Treatment Actions ---
  const handleAddTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultation) return;
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        consultation_id: consultationId,
        patient_id: consultation.patient_id,
        treatment_name: treatmentName.trim(),
        amount: Number(treatmentAmount) || 0,
        tooth_numbers: treatmentTeeth,
        notes: treatmentNotes.trim() || null,
      };
      if (selectedCatalogId) payload.treatment_id = selectedCatalogId;

      const res = await fetch("/api/admin/patient-treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add treatment");
      setShowTreatmentModal(false);
      setTreatmentName("");
      setTreatmentAmount("");
      setTreatmentTeeth([]);
      setTreatmentNotes("");
      setSelectedCatalogId("");
      fetchTreatments();
    } catch {
      alert("Failed to add treatment.");
    }
    setIsSubmitting(false);
  };

  const handleUpdateTreatmentStatus = async (treatmentId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/patient-treatments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: treatmentId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      fetchTreatments();
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleDeleteTreatment = async (treatmentId: string) => {
    if (!window.confirm("Remove this treatment?")) return;
    try {
      const res = await fetch(`/api/admin/patient-treatments?id=${treatmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      fetchTreatments();
    } catch {
      alert("Failed to delete treatment.");
    }
  };

  // --- Dental Chart Actions ---
  const handleAddChartEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultation) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/dental-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: consultation.patient_id,
          tooth_number: chartTooth,
          condition: chartCondition,
          notes: chartNotes.trim() || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");
      setShowChartModal(false);
      setChartTooth(0);
      setChartCondition("");
      setChartNotes("");
      fetchDentalChart(consultation.patient_id);
    } catch (error: any) {
      alert(error.message || "Failed to add entry.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteChartEntry = async (entryId: string) => {
    if (!consultation) return;
    try {
      const res = await fetch(`/api/admin/dental-chart?id=${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      fetchDentalChart(consultation.patient_id);
    } catch {
      alert("Failed to delete entry.");
    }
  };

  const openChartModalForTooth = (toothNum: number) => {
    setChartTooth(toothNum);
    setChartCondition("");
    setChartNotes("");
    setShowChartModal(true);
  };

  // --- Consultation Notes Update ---
  const handleSaveNotes = async () => {
    if (!consultation) return;
    try {
      const res = await fetch("/api/admin/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: consultationId,
          chief_complaint: editChiefComplaint,
          examination_notes: editExamNotes,
          dental_history: editDentalHistory,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setIsEditingNotes(false);
      fetchConsultation();
    } catch {
      alert("Failed to save notes.");
    }
  };

  const startEditingNotes = () => {
    if (!consultation) return;
    setEditChiefComplaint(consultation.chief_complaint || "");
    setEditExamNotes(consultation.examination_notes || "");
    setEditDentalHistory(consultation.dental_history || "");
    setIsEditingNotes(true);
  };

  // --- Invoice Generation ---
  const handleGenerateInvoice = async () => {
    if (!consultation) return;
    const completedTreatments = treatments.filter((t) => t.status === "Completed");
    if (completedTreatments.length === 0) {
      alert("No completed treatments to invoice.");
      return;
    }
    if (!window.confirm(`Generate invoice for ${completedTreatments.length} completed treatments?`)) return;

    setGeneratingInvoice(true);
    try {
      const items = completedTreatments.map((t) => ({
        description: t.treatment_name + (t.tooth_numbers?.length ? ` (Tooth: ${t.tooth_numbers.join(", ")})` : ""),
        amount: t.amount,
        patient_treatment_id: t.id,
      }));

      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: consultation.patient_id,
          consultation_id: consultationId,
          items,
          discount: 0,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      alert("Invoice generated! Go to Invoices page to view.");
    } catch {
      alert("Failed to generate invoice.");
    }
    setGeneratingInvoice(false);
  };

  // --- Tooth Selection for Treatment ---
  const toggleTreatmentTooth = (tooth: number) => {
    setTreatmentTeeth((prev) =>
      prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]
    );
  };

  // --- Catalog selection ---
  const handleCatalogSelect = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const item = treatmentCatalog.find((t) => t.id === catalogId);
    if (item) {
      setTreatmentName(item.name);
      // Set first price if available
      if (item.prices && item.prices.length > 0) {
        setTreatmentAmount(item.prices[0].amount?.toString() || "");
      }
    }
  };

  // Helper: get conditions for a tooth
  const getToothConditions = (toothNum: number) => {
    return dentalChart.filter((e) => e.tooth_number === toothNum);
  };

  const getToothColor = (toothNum: number) => {
    const conditions = getToothConditions(toothNum);
    if (conditions.length === 0) return "#e9ecef";
    const cond = conditions[0].condition;
    return CONDITION_COLORS[cond] || "#0d6efd";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const treatmentTotal = treatments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  if (authLoading || loading) {
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
        <Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-primary">Go to Login</Link>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-muted">Consultation not found</h2>
        <Link href="/muthu-alaya-ramshi-portal-7893/consultations" className="btn btn-primary mt-3">Back to Consultations</Link>
      </div>
    );
  }

  const renderToothRow = (teeth: number[], label: string) => (
    <div className="d-flex align-items-center gap-1 mb-1">
      <small className="text-muted me-1" style={{ minWidth: "20px", fontSize: "0.65rem" }}>{label}</small>
      {teeth.map((tooth) => {
        const conditions = getToothConditions(tooth);
        const bgColor = getToothColor(tooth);
        const hasCondition = conditions.length > 0;
        return (
          <div
            key={tooth}
            className="d-flex flex-column align-items-center"
            style={{ cursor: "pointer" }}
            onClick={() => openChartModalForTooth(tooth)}
            title={hasCondition ? conditions.map((c) => c.condition).join(", ") : `Tooth ${tooth}`}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: bgColor,
                color: hasCondition ? "#fff" : "#495057",
                fontSize: "0.7rem",
                fontWeight: "bold",
                border: hasCondition ? "none" : "1px solid #dee2e6",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {tooth}
            </div>
          </div>
        );
      })}
    </div>
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AdminLayout currentPage="consultations" onLogout={handleLogout}>
      <div className="container-fluid px-3 px-lg-4 py-4">
        {/* Patient Info + Status Row */}
        <div className="row g-3 mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: themeColor }}>
                      <i className="bi bi-person-circle me-2"></i>
                      {consultation.patients?.name}
                    </h5>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-telephone me-1"></i>{consultation.patients?.phone}
                      </span>
                      {consultation.patients?.age && (
                        <span className="badge bg-light text-dark border">Age: {consultation.patients.age}</span>
                      )}
                      {consultation.patients?.gender && (
                        <span className="badge bg-light text-dark border">{consultation.patients.gender}</span>
                      )}
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-calendar me-1"></i>{formatDate(consultation.date)}
                      </span>
                      {consultation.doctors?.name && (
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-person-badge me-1"></i>Dr. {consultation.doctors.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge rounded-pill px-3 py-2 fs-6 ${consultation.status === "Open" ? "bg-warning text-dark" : "bg-success"}`}>
                    {consultation.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
              <div className="card-body d-flex flex-column justify-content-center align-items-center">
                <div className="text-muted small">Treatment Total</div>
                <div className="fw-bold fs-3" style={{ color: themeColor }}>
                  &#8377;{treatmentTotal.toLocaleString()}
                </div>
                <div className="text-muted small">{treatments.length} treatments</div>
                <button
                  className="btn btn-sm text-white mt-2 px-3"
                  style={{ backgroundColor: themeColor, borderRadius: "8px" }}
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice || treatments.filter((t) => t.status === "Completed").length === 0}
                >
                  {generatingInvoice ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span>Generating...</>
                  ) : (
                    <><i className="bi bi-receipt me-1"></i>Generate Invoice</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Notes Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
          <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3 px-4" style={{ borderRadius: "15px 15px 0 0" }}>
            <h6 className="fw-bold mb-0" style={{ color: themeColor }}>
              <i className="bi bi-clipboard2-pulse me-2"></i>Clinical Notes
            </h6>
            {!isEditingNotes ? (
              <button className="btn btn-sm btn-outline-primary" onClick={startEditingNotes}>
                <i className="bi bi-pencil me-1"></i>Edit
              </button>
            ) : (
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-success" onClick={handleSaveNotes}>
                  <i className="bi bi-check2 me-1"></i>Save
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setIsEditingNotes(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="card-body px-4">
            {isEditingNotes ? (
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-bold text-muted small">Chief Complaint</label>
                  <textarea className="form-control bg-light border-0" rows={2} value={editChiefComplaint} onChange={(e) => setEditChiefComplaint(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold text-muted small">Examination Notes</label>
                  <textarea className="form-control bg-light border-0" rows={3} value={editExamNotes} onChange={(e) => setEditExamNotes(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold text-muted small">Dental History</label>
                  <textarea className="form-control bg-light border-0" rows={2} value={editDentalHistory} onChange={(e) => setEditDentalHistory(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="fw-bold text-muted small mb-1">Chief Complaint</div>
                  <p className="mb-0">{consultation.chief_complaint || <span className="text-muted fst-italic">Not recorded</span>}</p>
                </div>
                <div className="col-md-4">
                  <div className="fw-bold text-muted small mb-1">Examination Notes</div>
                  <p className="mb-0">{consultation.examination_notes || <span className="text-muted fst-italic">Not recorded</span>}</p>
                </div>
                <div className="col-md-4">
                  <div className="fw-bold text-muted small mb-1">Dental History</div>
                  <p className="mb-0">{consultation.dental_history || <span className="text-muted fst-italic">Not recorded</span>}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dental Chart Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
          <div className="card-header bg-white border-0 py-3 px-4" style={{ borderRadius: "15px 15px 0 0" }}>
            <h6 className="fw-bold mb-0" style={{ color: themeColor }}>
              <i className="bi bi-grid-3x3 me-2"></i>Dental Chart
              <small className="text-muted ms-2 fw-normal">(Click a tooth to add condition)</small>
            </h6>
          </div>
          <div className="card-body px-4">
            {/* Upper Jaw */}
            <div className="text-center mb-2">
              <small className="text-muted fw-bold">UPPER JAW</small>
            </div>
            <div className="d-flex justify-content-center gap-2 flex-wrap mb-1">
              <div className="text-end">{renderToothRow(UPPER_RIGHT, "UR")}</div>
              <div className="vr mx-1 d-none d-sm-block" style={{ opacity: 0.3 }}></div>
              <div>{renderToothRow(UPPER_LEFT, "UL")}</div>
            </div>
            <hr className="my-2" style={{ opacity: 0.2 }} />
            {/* Lower Jaw */}
            <div className="d-flex justify-content-center gap-2 flex-wrap mb-1">
              <div className="text-end">{renderToothRow(LOWER_RIGHT, "LR")}</div>
              <div className="vr mx-1 d-none d-sm-block" style={{ opacity: 0.3 }}></div>
              <div>{renderToothRow(LOWER_LEFT, "LL")}</div>
            </div>
            <div className="text-center mt-2">
              <small className="text-muted fw-bold">LOWER JAW</small>
            </div>

            {/* Legend */}
            <div className="mt-3 pt-2 border-top">
              <small className="text-muted fw-bold d-block mb-2">Legend:</small>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(CONDITION_COLORS).map(([condition, color]) => (
                  <span key={condition} className="badge px-2 py-1" style={{ backgroundColor: color, fontSize: "0.7rem" }}>
                    {condition}
                  </span>
                ))}
              </div>
            </div>

            {/* Condition List */}
            {dentalChart.length > 0 && (
              <div className="mt-3 pt-2 border-top">
                <small className="text-muted fw-bold d-block mb-2">Recorded Conditions:</small>
                <div className="d-flex flex-wrap gap-1">
                  {dentalChart.map((entry) => (
                    <span key={entry.id} className="badge bg-light text-dark border d-flex align-items-center gap-1 px-2 py-1" style={{ fontSize: "0.75rem" }}>
                      <span className="rounded-circle d-inline-block" style={{ width: "8px", height: "8px", backgroundColor: CONDITION_COLORS[entry.condition] || "#0d6efd" }}></span>
                      Tooth {entry.tooth_number}: {entry.condition}
                      {entry.notes && <span className="text-muted ms-1">({entry.notes})</span>}
                      <button
                        className="btn-close ms-1"
                        style={{ fontSize: "0.5rem" }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteChartEntry(entry.id); }}
                      ></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Treatment Pipeline */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
          <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3 px-4" style={{ borderRadius: "15px 15px 0 0" }}>
            <h6 className="fw-bold mb-0" style={{ color: themeColor }}>
              <i className="bi bi-list-check me-2"></i>Treatment Plan
            </h6>
            <button
              className="btn btn-sm text-white"
              style={{ backgroundColor: themeColor, borderRadius: "8px" }}
              onClick={() => {
                setTreatmentName("");
                setTreatmentAmount("");
                setTreatmentTeeth([]);
                setTreatmentNotes("");
                setSelectedCatalogId("");
                setShowTreatmentModal(true);
              }}
            >
              <i className="bi bi-plus me-1"></i>Add Treatment
            </button>
          </div>
          <div className="card-body p-0">
            {treatments.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-clipboard-x display-6 d-block mb-2"></i>
                No treatments added yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 px-4">Treatment</th>
                      <th className="py-3">Teeth</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatments.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4">
                          <div className="fw-semibold">{t.treatment_name}</div>
                          {t.notes && <small className="text-muted">{t.notes}</small>}
                        </td>
                        <td>
                          {t.tooth_numbers?.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {t.tooth_numbers.map((tn) => (
                                <span key={tn} className="badge bg-light text-dark border" style={{ fontSize: "0.75rem" }}>{tn}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="fw-semibold">&#8377;{(Number(t.amount) || 0).toLocaleString()}</td>
                        <td>
                          <select
                            className={`form-select form-select-sm border-0 fw-bold ${
                              t.status === "Completed" ? "text-success bg-success bg-opacity-10" :
                              t.status === "In Progress" ? "text-primary bg-primary bg-opacity-10" :
                              "text-warning bg-warning bg-opacity-10"
                            }`}
                            style={{ width: "130px", borderRadius: "8px" }}
                            value={t.status}
                            onChange={(e) => handleUpdateTreatmentStatus(t.id, e.target.value)}
                          >
                            <option value="Available">Available</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="text-end px-4">
                          <button onClick={() => handleDeleteTreatment(t.id)} className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-light">
                      <td colSpan={2} className="px-4 fw-bold text-end">Total:</td>
                      <td className="fw-bold fs-5" style={{ color: themeColor }}>&#8377;{treatmentTotal.toLocaleString()}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Treatment Modal */}
      {showTreatmentModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px" }}>
              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>
                  <i className="bi bi-plus-circle me-2"></i>Add Treatment
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTreatmentModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-3">
                <form onSubmit={handleAddTreatment}>
                  {/* Quick select from catalog */}
                  {treatmentCatalog.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label fw-bold text-muted small mb-1">Select from Catalog</label>
                      <select
                        className="form-select bg-light border-0"
                        value={selectedCatalogId}
                        onChange={(e) => handleCatalogSelect(e.target.value)}
                      >
                        <option value="">-- Custom Treatment --</option>
                        {treatmentCatalog.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label fw-bold text-muted small mb-1">Treatment Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={treatmentName}
                        onChange={(e) => setTreatmentName(e.target.value)}
                        placeholder="e.g. Root Canal Treatment"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-muted small mb-1">Amount (&#8377;)</label>
                      <input
                        type="number"
                        className="form-control form-control-lg bg-light border-0"
                        value={treatmentAmount}
                        onChange={(e) => setTreatmentAmount(e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    {/* Tooth selector */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">
                        Select Teeth <span className="fw-normal">(click to toggle)</span>
                      </label>
                      <div className="bg-light rounded-3 p-3">
                        <div className="d-flex justify-content-center gap-1 flex-wrap mb-2">
                          {[...UPPER_RIGHT, ...UPPER_LEFT].map((tooth) => (
                            <div
                              key={tooth}
                              className="d-flex align-items-center justify-content-center rounded"
                              style={{
                                width: "30px",
                                height: "30px",
                                backgroundColor: treatmentTeeth.includes(tooth) ? themeColor : "#e9ecef",
                                color: treatmentTeeth.includes(tooth) ? "#fff" : "#495057",
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                              onClick={() => toggleTreatmentTooth(tooth)}
                            >
                              {tooth}
                            </div>
                          ))}
                        </div>
                        <hr className="my-1" style={{ opacity: 0.2 }} />
                        <div className="d-flex justify-content-center gap-1 flex-wrap">
                          {[...LOWER_RIGHT, ...LOWER_LEFT].map((tooth) => (
                            <div
                              key={tooth}
                              className="d-flex align-items-center justify-content-center rounded"
                              style={{
                                width: "30px",
                                height: "30px",
                                backgroundColor: treatmentTeeth.includes(tooth) ? themeColor : "#e9ecef",
                                color: treatmentTeeth.includes(tooth) ? "#fff" : "#495057",
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                              onClick={() => toggleTreatmentTooth(tooth)}
                            >
                              {tooth}
                            </div>
                          ))}
                        </div>
                        {treatmentTeeth.length > 0 && (
                          <div className="text-center mt-2">
                            <small className="text-muted">Selected: {treatmentTeeth.sort((a, b) => a - b).join(", ")}</small>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Notes</label>
                      <textarea
                        className="form-control bg-light border-0"
                        rows={2}
                        value={treatmentNotes}
                        onChange={(e) => setTreatmentNotes(e.target.value)}
                        placeholder="Additional notes..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-lg w-100 text-white fw-bold shadow-sm"
                      style={{ backgroundColor: themeColor, borderRadius: "12px" }}
                      disabled={isSubmitting || !treatmentName}
                    >
                      {isSubmitting ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Adding...</>
                      ) : (
                        "Add Treatment"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dental Chart Entry Modal */}
      {showChartModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px" }}>
              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>
                  Tooth #{chartTooth} - Add Condition
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowChartModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-3">
                {/* Show existing conditions */}
                {getToothConditions(chartTooth).length > 0 && (
                  <div className="mb-3">
                    <small className="text-muted fw-bold">Existing conditions:</small>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {getToothConditions(chartTooth).map((entry) => (
                        <span key={entry.id} className="badge px-2 py-1" style={{ backgroundColor: CONDITION_COLORS[entry.condition] || "#0d6efd", fontSize: "0.8rem" }}>
                          {entry.condition}
                          <button
                            className="btn-close btn-close-white ms-1"
                            style={{ fontSize: "0.5rem" }}
                            onClick={() => handleDeleteChartEntry(entry.id)}
                          ></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleAddChartEntry}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small mb-1">Condition *</label>
                    <select
                      className="form-select form-select-lg bg-light border-0"
                      value={chartCondition}
                      onChange={(e) => setChartCondition(e.target.value)}
                      required
                    >
                      <option value="">Select Condition</option>
                      {DENTAL_CONDITIONS.map((cond) => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small mb-1">Notes</label>
                    <input
                      type="text"
                      className="form-control bg-light border-0"
                      value={chartNotes}
                      onChange={(e) => setChartNotes(e.target.value)}
                      placeholder="Optional notes..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-lg w-100 text-white fw-bold"
                    style={{ backgroundColor: themeColor, borderRadius: "12px" }}
                    disabled={isSubmitting || !chartCondition}
                  >
                    {isSubmitting ? "Saving..." : "Add Condition"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
