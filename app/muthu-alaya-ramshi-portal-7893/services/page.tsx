"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";
import AdminLoadingSpinner from "../../../components/AdminLoadingSpinner";
import AdminLayout from "../../../components/AdminLayout";

interface PriceTier {
  label: string;
  amount: number | string;
}

const CATEGORIES = ["General", "Cosmetic", "Orthodontic", "Surgical", "Preventive", "Restorative"];

export default function ManageServicesPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [servicesList, setServicesList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- Form States ---
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [serviceIcon, setServiceIcon] = useState("bi-tooth");
  const [serviceColor, setServiceColor] = useState("#086351");
  const [servicePosition, setServicePosition] = useState("");
  const [serviceCategory, setServiceCategory] = useState("General");
  const [serviceActive, setServiceActive] = useState(true);
  const [servicePrices, setServicePrices] = useState<PriceTier[]>([{ label: "", amount: "" }]);

  // --- Image Upload States ---
  const [image1File, setImage1File] = useState<File | null>(null);
  const [image2File, setImage2File] = useState<File | null>(null);
  const [image3File, setImage3File] = useState<File | null>(null);
  const [existingImg1, setExistingImg1] = useState("");
  const [existingImg2, setExistingImg2] = useState("");
  const [existingImg3, setExistingImg3] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // --- Modal State ---
  const [showModal, setShowModal] = useState(false);

  // --- Tab State ---
  const [activeTab, setActiveTab] = useState<"website" | "pricing">("website");

  const themeColor = '#086351';
  const supabase = createClient();

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/services');
      const result = await response.json();
      if (response.ok && result.data) setServicesList(result.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) fetchServices();
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [supabase.auth, fetchServices]);

  const uploadImageToServer = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'service-images');
    const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to upload image");
    return result.publicUrl;
  };

  // --- Price Tier Handlers ---
  const addPriceTier = () => {
    setServicePrices((prev) => [...prev, { label: "", amount: "" }]);
  };

  const removePriceTier = (index: number) => {
    setServicePrices((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePriceTier = (index: number, field: "label" | "amount", value: string) => {
    setServicePrices((prev) => {
      const updated = [...prev];
      if (field === "amount") {
        updated[index] = { ...updated[index], amount: value };
      } else {
        updated[index] = { ...updated[index], label: value };
      }
      return updated;
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      let finalImg1 = existingImg1;
      let finalImg2 = existingImg2;
      let finalImg3 = existingImg3;

      if (image1File) finalImg1 = await uploadImageToServer(image1File);
      if (image2File) finalImg2 = await uploadImageToServer(image2File);
      if (image3File) finalImg3 = await uploadImageToServer(image3File);

      const pricesPayload = servicePrices
        .filter((p) => p.label.trim() !== "")
        .map((p) => ({
          label: p.label.trim(),
          amount: parseFloat(String(p.amount)) || 0,
        }));

      const payload = {
        title: serviceTitle,
        description: serviceDesc,
        full_description: fullDesc,
        icon: serviceIcon,
        color: serviceColor,
        slug: serviceSlug,
        position: parseInt(servicePosition) || 0,
        category: serviceCategory,
        is_active: serviceActive,
        prices: pricesPayload,
        image1: finalImg1,
        image2: finalImg2,
        image3: finalImg3,
      };

      if (editingId) {
        const response = await fetch('/api/admin/services', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to update service");
        alert("Service updated successfully!");
      } else {
        const response = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to add service");
        alert("Service added successfully!");
      }

      closeModal();
      fetchServices();
    } catch (error: any) {
      setMessage(`Failed: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setServiceTitle(service.title || "");
    setServiceSlug(service.slug || "");
    setServiceDesc(service.description || "");
    setFullDesc(service.full_description || "");
    setServiceIcon(service.icon || "bi-tooth");
    setServiceColor(service.color || "#086351");
    setServicePosition(service.position?.toString() || "");
    setServiceCategory(service.category || "General");
    setServiceActive(service.is_active !== false);
    const prices = Array.isArray(service.prices) && service.prices.length > 0
      ? service.prices.map((p: PriceTier) => ({ label: p.label || "", amount: p.amount ?? "" }))
      : [{ label: "", amount: "" as string | number }];
    setServicePrices(prices);
    setExistingImg1(service.image1 || "");
    setExistingImg2(service.image2 || "");
    setExistingImg3(service.image3 || "");
    setImage1File(null); setImage2File(null); setImage3File(null);
    setMessage("");
    setActiveTab("website");
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      const response = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Delete failed");
      fetchServices();
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setServiceTitle(""); setServiceSlug(""); setServiceDesc(""); setFullDesc("");
    setServiceIcon("bi-tooth"); setServiceColor("#086351"); setServicePosition("");
    setServiceCategory("General"); setServiceActive(true);
    setServicePrices([{ label: "", amount: "" }]);
    setExistingImg1(""); setExistingImg2(""); setExistingImg3("");
    setImage1File(null); setImage2File(null); setImage3File(null);
    setMessage("");
    setActiveTab("website");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const getStartingPrice = (prices: PriceTier[]) => {
    if (!Array.isArray(prices) || prices.length === 0) return null;
    const amounts = prices.map((p) => Number(p.amount) || 0).filter((a) => a > 0);
    if (amounts.length === 0) return null;
    return Math.min(...amounts);
  };

  const formatPrices = (prices: PriceTier[]) => {
    if (!Array.isArray(prices) || prices.length === 0) return "No pricing set";
    return prices.filter(p => p.label).map((p) => `${p.label}: \u20B9${Number(p.amount).toLocaleString()}`).join(" | ");
  };

  if (authLoading) return <AdminLoadingSpinner />;
  if (!user) return <div className="container py-5 text-center"><h2 className="text-danger">Access Denied</h2><Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-primary">Go to Login</Link></div>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AdminLayout currentPage="services" onLogout={handleLogout}>
      <div className="container-fluid px-3 px-lg-4 py-4">

        {/* Info Banner */}
        <div className="alert border-0 shadow-sm mb-4" style={{ backgroundColor: themeColor + '10', borderRadius: '12px' }}>
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle fs-5 me-2" style={{ color: themeColor }}></i>
            <div>
              <strong style={{ color: themeColor }}>Services = Treatment Catalog</strong>
              <div className="text-muted small">
                Services appear on your public website AND are used as the treatment catalog during consultations. Add price tiers for each service to use them in billing.
              </div>
            </div>
          </div>
        </div>

        {/* Header and Add Button */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-3 mb-sm-0" style={{ color: themeColor }}>
            Services & Treatments
            <span className="badge ms-2" style={{ backgroundColor: themeColor, fontSize: '0.55em', verticalAlign: 'middle' }}>
              {servicesList.length} items
            </span>
          </h4>
          <button onClick={openAddModal} className="btn text-white fw-bold px-4 py-2 shadow-sm w-100 w-sm-auto" style={{ backgroundColor: themeColor, borderRadius: '10px' }}>
            <i className="bi bi-plus-circle-fill me-2"></i> Add Service
          </button>
        </div>

        {/* --- DESKTOP VIEW: Data Table --- */}
        <div className="d-none d-md-block card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Pos</th>
                  <th className="py-3">Icon</th>
                  <th className="py-3">Title</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Pricing</th>
                  <th className="py-3">Slug</th>
                  <th className="py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {servicesList.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4 text-muted">No services found in database.</td></tr>
                ) : (
                  servicesList.map((srv) => (
                    <tr key={srv.id} className={srv.is_active === false ? 'opacity-50' : ''}>
                      <td className="px-4 fw-bold text-muted">{srv.position}</td>
                      <td>
                        <i className={`bi ${srv.icon} fs-4`} style={{ color: srv.color }}></i>
                      </td>
                      <td>
                        <div className="fw-semibold">{srv.title}</div>
                        {srv.is_active === false && <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>Inactive</span>}
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: themeColor + '20', color: themeColor }}>
                          {srv.category || 'General'}
                        </span>
                      </td>
                      <td>
                        {getStartingPrice(srv.prices) ? (
                          <span className="fw-semibold text-success">
                            From &#8377;{getStartingPrice(srv.prices)?.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted small">No pricing</span>
                        )}
                      </td>
                      <td><code>/{srv.slug}</code></td>
                      <td className="text-end px-4">
                        <button onClick={() => handleEdit(srv)} className="btn btn-sm btn-outline-primary me-2"><i className="bi bi-pencil-square"></i> Edit</button>
                        <button onClick={() => handleDelete(srv.id)} className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i> Delete</button>
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
          {servicesList.length === 0 ? (
             <div className="text-center py-4 text-muted bg-white shadow-sm rounded">No services found in database.</div>
          ) : (
            servicesList.map((srv) => (
              <div key={srv.id} className={`card border-0 shadow-sm mb-3 ${srv.is_active === false ? 'opacity-50' : ''}`} style={{ borderRadius: '15px' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <div className="d-flex justify-content-center align-items-center me-3 shadow-sm" style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: srv.color + '20' }}>
                      <i className={`bi ${srv.icon} fs-4`} style={{ color: srv.color }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0">{srv.title}</h6>
                      <div className="d-flex gap-1 align-items-center">
                        <code className="small text-muted">/{srv.slug}</code>
                        <span className="badge" style={{ backgroundColor: themeColor + '20', color: themeColor, fontSize: '0.65rem' }}>
                          {srv.category || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small text-truncate" style={{ maxWidth: '60%' }}>{srv.description}</span>
                    {getStartingPrice(srv.prices) ? (
                      <span className="fw-bold text-success small">From &#8377;{getStartingPrice(srv.prices)?.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted small">No pricing</span>
                    )}
                  </div>
                </div>
                <div className="card-footer bg-white border-top-0 d-flex justify-content-end gap-2 pb-3">
                  <button onClick={() => handleEdit(srv)} className="btn btn-sm btn-outline-primary flex-fill"><i className="bi bi-pencil-square"></i> Edit</button>
                  <button onClick={() => handleDelete(srv.id)} className="btn btn-sm btn-outline-danger flex-fill"><i className="bi bi-trash"></i> Delete</button>
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
                  {editingId ? "Edit Service" : "Add New Service"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>

              <div className="modal-body px-4 py-3">
                {message && <div className="alert alert-danger py-2">{message}</div>}

                {/* Tab Switcher inside modal */}
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("website")}
                    className="btn btn-sm fw-bold px-3"
                    style={{
                      backgroundColor: activeTab === "website" ? themeColor : "#e9ecef",
                      color: activeTab === "website" ? "#fff" : "#333",
                      borderRadius: '20px', border: 'none',
                    }}
                  >
                    <i className="bi bi-globe me-1"></i>Website Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pricing")}
                    className="btn btn-sm fw-bold px-3"
                    style={{
                      backgroundColor: activeTab === "pricing" ? themeColor : "#e9ecef",
                      color: activeTab === "pricing" ? "#fff" : "#333",
                      borderRadius: '20px', border: 'none',
                    }}
                  >
                    <i className="bi bi-currency-rupee me-1"></i>Pricing & Category
                  </button>
                </div>

                <form onSubmit={handleSaveService}>

                  {/* TAB: Website Details */}
                  {activeTab === "website" && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold text-muted small mb-1">Service Title *</label>
                        <input type="text" className="form-control bg-light border-0" value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold text-muted small mb-1">URL Slug *</label>
                        <input type="text" className="form-control bg-light border-0" value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} required />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-bold text-muted small mb-1">Bootstrap Icon</label>
                        <input type="text" className="form-control bg-light border-0" value={serviceIcon} onChange={(e) => setServiceIcon(e.target.value)} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold text-muted small mb-1">Theme Color</label>
                        <input type="color" className="form-control form-control-color w-100 bg-light border-0" value={serviceColor} onChange={(e) => setServiceColor(e.target.value)} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold text-muted small mb-1">Display Position</label>
                        <input type="number" className="form-control bg-light border-0" value={servicePosition} onChange={(e) => setServicePosition(e.target.value)} required />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-muted small mb-1">Short Description (For Card)</label>
                        <textarea className="form-control bg-light border-0" rows={2} value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} required></textarea>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-muted small mb-1">Full Detailed Explanation</label>
                        <textarea className="form-control bg-light border-0" rows={4} placeholder="Write specific details about the treatment here..." value={fullDesc} onChange={(e) => setFullDesc(e.target.value)}></textarea>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-bold text-muted small mb-1">Gallery Image 1</label>
                        <input type="file" accept="image/*" className="form-control form-control-sm bg-light border-0" onChange={(e) => setImage1File(e.target.files?.[0] || null)} />
                        {existingImg1 && !image1File && <small className="text-success d-block mt-1"><i className="bi bi-check-circle-fill"></i> Image saved</small>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold text-muted small mb-1">Gallery Image 2</label>
                        <input type="file" accept="image/*" className="form-control form-control-sm bg-light border-0" onChange={(e) => setImage2File(e.target.files?.[0] || null)} />
                        {existingImg2 && !image2File && <small className="text-success d-block mt-1"><i className="bi bi-check-circle-fill"></i> Image saved</small>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold text-muted small mb-1">Gallery Image 3</label>
                        <input type="file" accept="image/*" className="form-control form-control-sm bg-light border-0" onChange={(e) => setImage3File(e.target.files?.[0] || null)} />
                        {existingImg3 && !image3File && <small className="text-success d-block mt-1"><i className="bi bi-check-circle-fill"></i> Image saved</small>}
                      </div>
                    </div>
                  )}

                  {/* TAB: Pricing & Category */}
                  {activeTab === "pricing" && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold text-muted small mb-1">Category</label>
                        <select
                          className="form-select bg-light border-0"
                          value={serviceCategory}
                          onChange={(e) => setServiceCategory(e.target.value)}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 d-flex align-items-end">
                        <div className="form-check form-switch mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="activeToggle"
                            checked={serviceActive}
                            onChange={(e) => setServiceActive(e.target.checked)}
                            style={{ width: '3em', height: '1.5em' }}
                          />
                          <label className="form-check-label fw-bold text-muted small ms-2" htmlFor="activeToggle">
                            {serviceActive ? "Active (Visible on website)" : "Inactive (Hidden from website)"}
                          </label>
                        </div>
                      </div>

                      {/* Price Tiers */}
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-bold text-muted small mb-0">
                            <i className="bi bi-currency-rupee me-1"></i>Price Tiers
                          </label>
                          <button
                            type="button"
                            className="btn btn-sm text-white fw-bold"
                            style={{ backgroundColor: themeColor, borderRadius: '8px' }}
                            onClick={addPriceTier}
                          >
                            <i className="bi bi-plus-lg me-1"></i> Add Tier
                          </button>
                        </div>

                        <div className="bg-light rounded-3 p-3">
                          {servicePrices.length === 0 ? (
                            <p className="text-muted small mb-0 text-center">No price tiers. Click &quot;Add Tier&quot; to add one.</p>
                          ) : (
                            servicePrices.map((tier, index) => (
                              <div key={index} className="row g-2 mb-2 align-items-center">
                                <div className="col">
                                  <input
                                    type="text"
                                    className="form-control bg-white border-0"
                                    value={tier.label}
                                    onChange={(e) => updatePriceTier(index, "label", e.target.value)}
                                    placeholder="Label (e.g. Standard, Premium)"
                                  />
                                </div>
                                <div className="col">
                                  <div className="input-group">
                                    <span className="input-group-text bg-white border-0">&#8377;</span>
                                    <input
                                      type="number"
                                      className="form-control bg-white border-0"
                                      value={tier.amount}
                                      onChange={(e) => updatePriceTier(index, "amount", e.target.value)}
                                      placeholder="Amount"
                                      min="0"
                                    />
                                  </div>
                                </div>
                                <div className="col-auto">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removePriceTier(index)}
                                  >
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <small className="text-muted d-block mt-1">
                          These prices are used when adding treatments during consultations. The lowest price shows on the website as &quot;Starting from&quot;.
                        </small>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-2">
                    <button type="submit" className="btn btn-lg w-100 text-white fw-bold shadow-sm" style={{ backgroundColor: themeColor, borderRadius: '12px' }} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Saving...</>
                      ) : (
                        editingId ? "Update Service" : "Save New Service"
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
