"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";
import AdminLoadingSpinner from "../../../components/AdminLoadingSpinner";
import AdminLayout from "../../../components/AdminLayout";

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  patient_treatment_id: string | null;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
  transaction_id?: string;
  notes?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  consultation_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  patients: { id: string; name: string; phone: string; email: string | null };
  invoice_items: InvoiceItem[];
  payments: Payment[];
}

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank"];

export default function InvoicesPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);

  const themeColor = "#086351";
  const supabase = createClient();

  const fetchInvoices = useCallback(async (search = "", status = "") => {
    try {
      let url = "/api/admin/invoices?limit=100";
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok && result.data) setInvoices(result.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) {
          await fetchInvoices();
          setDataLoading(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [supabase.auth, fetchInvoices]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) fetchInvoices(searchTerm, statusFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, user, fetchInvoices]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          patient_id: selectedInvoice.patient_id,
          amount: Number(paymentAmount),
          method: paymentMethod,
          transaction_id: paymentTransactionId.trim() || null,
          notes: paymentNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed");
      }
      alert("Payment recorded!");
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentMethod("Cash");
      setPaymentTransactionId("");
      setPaymentNotes("");
      fetchInvoices(searchTerm, statusFilter);

      // Refresh detail if open
      if (showDetailModal && selectedInvoice) {
        const freshRes = await fetch(`/api/admin/invoices?limit=200`);
        const freshResult = await freshRes.json();
        if (freshRes.ok && freshResult.data) {
          const fresh = freshResult.data.find((i: Invoice) => i.id === selectedInvoice.id);
          if (fresh) setSelectedInvoice(fresh);
        }
      }
    } catch (error: any) {
      alert(error.message || "Failed to record payment.");
    }
    setIsSubmitting(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm("Remove this payment record?")) return;
    try {
      const res = await fetch(`/api/admin/payments?id=${paymentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      fetchInvoices(searchTerm, statusFilter);

      // Refresh detail if open
      if (showDetailModal && selectedInvoice) {
        const freshRes = await fetch(`/api/admin/invoices?limit=200`);
        const freshResult = await freshRes.json();
        if (freshRes.ok && freshResult.data) {
          const fresh = freshResult.data.find((i: Invoice) => i.id === selectedInvoice.id);
          if (fresh) setSelectedInvoice(fresh);
        }
      }
    } catch {
      alert("Failed to delete payment.");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/invoices?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");
      fetchInvoices(searchTerm, statusFilter);
      if (showDetailModal) setShowDetailModal(false);
    } catch (error: any) {
      alert(error.message || "Failed to delete invoice.");
    }
  };

  const handleMarkSent = async (id: string) => {
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Sent" }),
      });
      if (!res.ok) throw new Error("Failed");
      fetchInvoices(searchTerm, statusFilter);
    } catch {
      alert("Failed to update.");
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const remaining = Math.max(0, Number(invoice.total) - Number(invoice.paid_amount));
    setPaymentAmount(remaining.toString());
    setPaymentMethod("Cash");
    setPaymentTransactionId("");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const openDetailModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft": return "bg-secondary";
      case "Sent": return "bg-info";
      case "Partial": return "bg-warning text-dark";
      case "Paid": return "bg-success";
      default: return "bg-secondary";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Cash": return "bi-cash";
      case "UPI": return "bi-phone";
      case "Card": return "bi-credit-card";
      case "Bank": return "bi-bank";
      default: return "bi-currency-rupee";
    }
  };

  // Summary stats
  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
  const totalPending = totalRevenue - totalCollected;
  const paidCount = invoices.filter((inv) => inv.status === "Paid").length;

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
    <AdminLayout currentPage="invoices" onLogout={handleLogout}>
      {dataLoading ? (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="spinner-border" style={{ color: themeColor, width: "2.5rem", height: "2.5rem" }}></div>
          <p className="mt-3 text-muted fw-semibold small">Loading invoices...</p>
        </div>
      ) : (
      <>
      <div className="container-fluid px-3 px-lg-4 py-4">
        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
              <div className="card-body text-center py-3">
                <div className="text-muted small">Total Invoiced</div>
                <div className="fw-bold fs-4" style={{ color: themeColor }}>&#8377;{totalRevenue.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
              <div className="card-body text-center py-3">
                <div className="text-muted small">Collected</div>
                <div className="fw-bold fs-4 text-success">&#8377;{totalCollected.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
              <div className="card-body text-center py-3">
                <div className="text-muted small">Pending</div>
                <div className="fw-bold fs-4 text-danger">&#8377;{totalPending.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
              <div className="card-body text-center py-3">
                <div className="text-muted small">Fully Paid</div>
                <div className="fw-bold fs-4">{paidCount}/{invoices.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-3 mb-sm-0" style={{ color: themeColor }}>
            <i className="bi bi-receipt me-2"></i>Invoices
            <span className="badge ms-2" style={{ backgroundColor: themeColor, fontSize: "0.55em", verticalAlign: "middle" }}>
              {invoices.length} records
            </span>
          </h4>
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
                placeholder="Search by invoice number or patient name..."
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
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="d-none d-md-block card border-0 shadow-sm" style={{ borderRadius: "15px", overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Patient</th>
                  <th className="py-3">Total</th>
                  <th className="py-3">Paid</th>
                  <th className="py-3">Balance</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      <i className="bi bi-receipt-cutoff display-6 d-block mb-2"></i>
                      {searchTerm ? "No invoices matching your search." : "No invoices yet. Generate from Consultations."}
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const balance = Math.max(0, Number(inv.total) - Number(inv.paid_amount));
                    return (
                      <tr key={inv.id}>
                        <td className="px-4">
                          <span className="fw-bold" style={{ color: themeColor }}>{inv.invoice_number}</span>
                        </td>
                        <td>{formatDate(inv.created_at)}</td>
                        <td>
                          <div className="fw-semibold">{inv.patients?.name || "-"}</div>
                          <small className="text-muted">{inv.patients?.phone}</small>
                        </td>
                        <td className="fw-semibold">&#8377;{Number(inv.total).toLocaleString()}</td>
                        <td className="text-success fw-semibold">&#8377;{Number(inv.paid_amount).toLocaleString()}</td>
                        <td className={`fw-semibold ${balance > 0 ? "text-danger" : "text-success"}`}>
                          &#8377;{balance.toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge rounded-pill px-3 py-1 ${getStatusBadge(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="text-end px-4">
                          <div className="d-flex gap-1 justify-content-end">
                            <button onClick={() => openDetailModal(inv)} className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-eye"></i>
                            </button>
                            {inv.status !== "Paid" && (
                              <button onClick={() => openPaymentModal(inv)} className="btn btn-sm btn-outline-success">
                                <i className="bi bi-currency-rupee"></i> Pay
                              </button>
                            )}
                            {inv.status === "Draft" && (
                              <button onClick={() => handleMarkSent(inv.id)} className="btn btn-sm btn-outline-info">
                                <i className="bi bi-send"></i>
                              </button>
                            )}
                            {inv.status === "Draft" && (
                              <button onClick={() => handleDeleteInvoice(inv.id)} className="btn btn-sm btn-outline-danger">
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="d-block d-md-none">
          {invoices.length === 0 ? (
            <div className="text-center py-4 text-muted bg-white shadow-sm rounded">
              <i className="bi bi-receipt-cutoff display-6 d-block mb-2"></i>
              No invoices yet.
            </div>
          ) : (
            invoices.map((inv) => {
              const balance = Math.max(0, Number(inv.total) - Number(inv.paid_amount));
              return (
                <div key={inv.id} className="card border-0 shadow-sm mb-3" style={{ borderRadius: "15px" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="fw-bold" style={{ color: themeColor }}>{inv.invoice_number}</span>
                        <div className="fw-semibold">{inv.patients?.name}</div>
                        <small className="text-muted">{formatDate(inv.created_at)}</small>
                      </div>
                      <span className={`badge rounded-pill px-3 py-1 ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                      <div>
                        <small className="text-muted d-block">Total</small>
                        <span className="fw-bold">&#8377;{Number(inv.total).toLocaleString()}</span>
                      </div>
                      <div className="text-center">
                        <small className="text-muted d-block">Paid</small>
                        <span className="fw-bold text-success">&#8377;{Number(inv.paid_amount).toLocaleString()}</span>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">Balance</small>
                        <span className={`fw-bold ${balance > 0 ? "text-danger" : "text-success"}`}>
                          &#8377;{balance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-top-0 d-flex justify-content-end gap-2 pb-3">
                    <button onClick={() => openDetailModal(inv)} className="btn btn-sm btn-outline-primary flex-fill">
                      <i className="bi bi-eye me-1"></i>Detail
                    </button>
                    {inv.status !== "Paid" && (
                      <button onClick={() => openPaymentModal(inv)} className="btn btn-sm btn-outline-success flex-fill">
                        <i className="bi bi-currency-rupee me-1"></i>Pay
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px" }}>
              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>
                  <i className="bi bi-receipt me-2"></i>{selectedInvoice.invoice_number}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-3">
                {/* Patient Info */}
                <div className="bg-light rounded-3 p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{selectedInvoice.patients?.name}</div>
                      <small className="text-muted">{selectedInvoice.patients?.phone}</small>
                      {selectedInvoice.patients?.email && (
                        <small className="text-muted d-block">{selectedInvoice.patients.email}</small>
                      )}
                    </div>
                    <span className={`badge rounded-pill px-3 py-2 ${getStatusBadge(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Line Items */}
                <h6 className="fw-bold text-muted small mb-2">Line Items</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Description</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.invoice_items?.map((item) => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td className="text-end fw-semibold">&#8377;{Number(item.amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="fw-bold">Subtotal</td>
                        <td className="text-end fw-bold">&#8377;{Number(selectedInvoice.subtotal).toLocaleString()}</td>
                      </tr>
                      {Number(selectedInvoice.discount) > 0 && (
                        <tr className="text-danger">
                          <td>Discount</td>
                          <td className="text-end">-&#8377;{Number(selectedInvoice.discount).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr style={{ borderTop: "2px solid #dee2e6" }}>
                        <td className="fw-bold fs-5">Total</td>
                        <td className="text-end fw-bold fs-5" style={{ color: themeColor }}>&#8377;{Number(selectedInvoice.total).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Payment History */}
                <h6 className="fw-bold text-muted small mb-2">
                  Payment History
                  <span className="badge bg-success bg-opacity-10 text-success ms-2">
                    &#8377;{Number(selectedInvoice.paid_amount).toLocaleString()} collected
                  </span>
                </h6>
                {selectedInvoice.payments?.length > 0 ? (
                  <div className="mb-3">
                    {selectedInvoice.payments.map((p) => (
                      <div key={p.id} className="d-flex justify-content-between align-items-center bg-light rounded-3 p-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${getPaymentMethodIcon(p.method)} fs-5`} style={{ color: themeColor }}></i>
                          <div>
                            <div className="fw-semibold">&#8377;{Number(p.amount).toLocaleString()}</div>
                            <small className="text-muted">{p.method} | {formatDate(p.date)}</small>
                            {p.transaction_id && <small className="text-muted d-block">Ref: {p.transaction_id}</small>}
                            {p.notes && <small className="text-muted d-block"><i className="bi bi-sticky me-1"></i>{p.notes}</small>}
                          </div>
                        </div>
                        <button onClick={() => handleDeletePayment(p.id)} className="btn btn-sm btn-outline-danger">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted small mb-3">No payments recorded.</div>
                )}

                {/* Balance */}
                {Number(selectedInvoice.total) - Number(selectedInvoice.paid_amount) > 0 && (
                  <div className="bg-danger bg-opacity-10 rounded-3 p-3 text-center">
                    <div className="text-danger small">Outstanding Balance</div>
                    <div className="fw-bold fs-4 text-danger">
                      &#8377;{(Number(selectedInvoice.total) - Number(selectedInvoice.paid_amount)).toLocaleString()}
                    </div>
                    <button
                      className="btn btn-success btn-sm mt-2 px-4"
                      onClick={() => {
                        setShowDetailModal(false);
                        openPaymentModal(selectedInvoice);
                      }}
                    >
                      <i className="bi bi-currency-rupee me-1"></i>Record Payment
                    </button>
                  </div>
                )}

                {selectedInvoice.notes && (
                  <div className="mt-3 pt-2 border-top">
                    <small className="text-muted fw-bold">Notes:</small>
                    <p className="mb-0 small">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px" }}>
              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>
                  <i className="bi bi-currency-rupee me-2"></i>Record Payment
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-3">
                <div className="bg-light rounded-3 p-3 mb-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-bold">{selectedInvoice.invoice_number}</div>
                      <small className="text-muted">{selectedInvoice.patients?.name}</small>
                    </div>
                    <div className="text-end">
                      <div className="small text-muted">Balance Due</div>
                      <div className="fw-bold text-danger fs-5">
                        &#8377;{Math.max(0, Number(selectedInvoice.total) - Number(selectedInvoice.paid_amount)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleRecordPayment}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Amount (&#8377;) *</label>
                      <input
                        type="number"
                        className="form-control form-control-lg bg-light border-0"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter payment amount"
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Payment Method *</label>
                      <div className="d-flex gap-2">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            className={`btn flex-fill ${paymentMethod === method ? "text-white" : "btn-outline-secondary"}`}
                            style={{
                              backgroundColor: paymentMethod === method ? themeColor : undefined,
                              borderRadius: "10px",
                            }}
                            onClick={() => setPaymentMethod(method)}
                          >
                            <i className={`bi ${getPaymentMethodIcon(method)} me-1`}></i>
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(paymentMethod === "UPI" || paymentMethod === "Card" || paymentMethod === "Bank") && (
                      <div className="col-12">
                        <label className="form-label fw-bold text-muted small mb-1">Transaction ID / Reference</label>
                        <input
                          type="text"
                          className="form-control bg-light border-0"
                          value={paymentTransactionId}
                          onChange={(e) => setPaymentTransactionId(e.target.value)}
                          placeholder="Enter transaction reference..."
                        />
                      </div>
                    )}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-1">Notes</label>
                      <input
                        type="text"
                        className="form-control bg-light border-0"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Optional notes..."
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-lg w-100 text-white fw-bold shadow-sm"
                      style={{ backgroundColor: themeColor, borderRadius: "12px" }}
                      disabled={isSubmitting || !paymentAmount}
                    >
                      {isSubmitting ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Recording...</>
                      ) : (
                        <>Record &#8377;{Number(paymentAmount || 0).toLocaleString()} Payment</>
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
