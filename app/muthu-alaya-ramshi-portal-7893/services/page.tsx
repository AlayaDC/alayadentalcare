"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";

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

  const themeColor = '#086351';
  const supabase = createClient();

  // ─── SAFE VERCEL API FETCH ───
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
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
      if (session?.user) fetchServices(); 
    };
    checkSession();
  }, [supabase.auth, fetchServices]);

  // ─── SAFE VERCEL UPLOAD ───
  const uploadImageToServer = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'service-images'); 

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to upload image");
    return result.publicUrl;
  };

  // ─── SAFE VERCEL CREATE/UPDATE ───
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

      const payload = {
        title: serviceTitle, 
        description: serviceDesc, 
        full_description: fullDesc,
        icon: serviceIcon, 
        color: serviceColor, 
        slug: serviceSlug, 
        position: parseInt(servicePosition) || 0, 
        image1: finalImg1,
        image2: finalImg2,
        image3: finalImg3
      };

      if (editingId) {
        const response = await fetch('/api/admin/services', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to update service");
        alert("✅ Service updated successfully!");
      } else {
        const response = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to add service");
        alert("✅ Service added successfully!");
      }

      closeModal();
      fetchServices();
    } catch (error: any) {
      setMessage(`❌ Failed: ${error.message}`);
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
    setExistingImg1(service.image1 || "");
    setExistingImg2(service.image2 || "");
    setExistingImg3(service.image3 || "");
    setImage1File(null); setImage2File(null); setImage3File(null);
    setMessage("");
    setShowModal(true);
  };

  // ─── SAFE VERCEL DELETE ───
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
    setExistingImg1(""); setExistingImg2(""); setExistingImg3("");
    setImage1File(null); setImage2File(null); setImage3File(null);
    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  if (authLoading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-success"></div></div>;
  if (!user) return <div className="container py-5 text-center"><h2 className="text-danger">Access Denied</h2><Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-primary">Go to Login</Link></div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Navbar */}
      <nav className="navbar navbar-dark shadow-sm py-3" style={{ backgroundColor: themeColor }}>
        <div className="container d-flex justify-content-between align-items-center">
          <span className="navbar-brand fw-bold mb-0 text-truncate" style={{ maxWidth: '60%' }}>Alaya Admin - Services</span>
          <Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-outline-light btn-sm fw-bold">
            <i className="bi bi-arrow-left me-1"></i> <span className="d-none d-sm-inline">Back</span>
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        
        {/* Header and Add Button */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-3 mb-sm-0" style={{ color: themeColor }}>Services Database</h4>
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
                  <th className="py-3">Slug</th>
                  <th className="py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {servicesList.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-muted">No services found in database.</td></tr>
                ) : (
                  servicesList.map((srv) => (
                    <tr key={srv.id}>
                      <td className="px-4 fw-bold text-muted">{srv.position}</td>
                      <td>
                        <i className={`bi ${srv.icon} fs-4`} style={{ color: srv.color }}></i>
                      </td>
                      <td className="fw-semibold">{srv.title}</td>
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
              <div key={srv.id} className="card border-0 shadow-sm mb-3" style={{ borderRadius: '15px' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <div className="d-flex justify-content-center align-items-center me-3 shadow-sm" style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: srv.color + '20' }}>
                      <i className={`bi ${srv.icon} fs-4`} style={{ color: srv.color }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0">{srv.title}</h6>
                      <code className="small text-muted">/{srv.slug}</code>
                    </div>
                    <span className="badge bg-secondary">Pos: {srv.position}</span>
                  </div>
                  <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '100%' }}>{srv.description}</p>
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
                  {editingId ? "✏️ Edit Service" : "➕ Add New Service"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>

              <div className="modal-body px-4 py-3">
                {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} py-2`}>{message}</div>}
                
                <form onSubmit={handleSaveService}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">Service Title</label>
                      <input type="text" className="form-control bg-light border-0" value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small mb-1">URL Slug (No spaces)</label>
                      <input type="text" className="form-control bg-light border-0" value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} required />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-muted small mb-1">Bootstrap Icon Class</label>
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

                    {/* Extended Page Details */}
                    <div className="col-12 mt-4">
                      <hr className="mb-4 mt-0" />
                      <h6 className="fw-bold mb-3" style={{ color: themeColor }}>Extended Page Details</h6>
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

                  <div className="mt-4 pt-2">
                    <button type="submit" className="btn btn-lg w-100 text-white fw-bold shadow-sm" style={{ backgroundColor: themeColor, borderRadius: '12px' }} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Saving...</>
                      ) : (
                        editingId ? "Update Service Details" : "Save New Service"
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}