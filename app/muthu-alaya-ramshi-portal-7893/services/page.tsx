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
    formData.append('bucket', 'service-images'); // Tells the API which bucket to use!

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
        position: parseInt(servicePosition),
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
        if (!response.ok) throw new Error("Failed to update service");
        setMessage("✅ Service updated successfully!");
      } else {
        const response = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to add service");
        setMessage("✅ Service added successfully!");
      }

      resetForm();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const resetForm = () => {
    setEditingId(null);
    setServiceTitle(""); setServiceSlug(""); setServiceDesc(""); setFullDesc("");
    setServiceIcon("bi-tooth"); setServiceColor("#086351"); setServicePosition("");
    setExistingImg1(""); setExistingImg2(""); setExistingImg3("");
    setImage1File(null); setImage2File(null); setImage3File(null);
  };

  if (authLoading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-success"></div></div>;
  if (!user) return <div className="container py-5 text-center"><h2 className="text-danger">Access Denied</h2><Link href="../" className="btn btn-primary">Go to Login</Link></div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav className="navbar navbar-dark shadow-sm py-3" style={{ backgroundColor: themeColor }}>
        <div className="container">
          <span className="navbar-brand fw-bold">Alaya Admin - Services</span>
          <Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-outline-light btn-sm fw-bold">
            <i className="bi bi-arrow-left me-2"></i>Back to Menu
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-10">
            
            <div className="card border-0 shadow-lg p-5 mb-5" style={{ borderRadius: '20px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0 text-center w-100">{editingId ? "✏️ Edit Service" : "➕ Add a New Service"}</h4>
                {editingId && <button type="button" className="btn btn-outline-secondary btn-sm position-absolute end-0 me-5" onClick={resetForm}>Cancel Edit</button>}
              </div>

              {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} text-center`}>{message}</div>}
              
              <form onSubmit={handleSaveService}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Service Title</label>
                    <input type="text" className="form-control" value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">URL Slug (No spaces)</label>
                    <input type="text" className="form-control" value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} required />
                  </div>

                  {/* Basic Card Details */}
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Bootstrap Icon Class</label>
                    <input type="text" className="form-control" value={serviceIcon} onChange={(e) => setServiceIcon(e.target.value)} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Theme Color</label>
                    <input type="color" className="form-control form-control-color w-100" value={serviceColor} onChange={(e) => setServiceColor(e.target.value)} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Display Position</label>
                    <input type="number" className="form-control" value={servicePosition} onChange={(e) => setServicePosition(e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold">Short Description (For the Home Page Card)</label>
                    <textarea className="form-control" rows={2} value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} required></textarea>
                  </div>

                  {/* The Extended Page Details */}
                  <hr className="my-4" />
                  <h5 className="fw-bold mb-3" style={{ color: themeColor }}>Extended Page Details</h5>
                  
                  <div className="col-12">
                    <label className="form-label fw-bold">Full Detailed Explanation</label>
                    <textarea className="form-control" rows={5} placeholder="Write all the specific details about the treatment here..." value={fullDesc} onChange={(e) => setFullDesc(e.target.value)}></textarea>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Gallery Image 1</label>
                    <input type="file" accept="image/*" className="form-control form-control-sm" onChange={(e) => setImage1File(e.target.files?.[0] || null)} />
                    {existingImg1 && <small className="text-success d-block mt-1">✓ Image saved</small>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Gallery Image 2</label>
                    <input type="file" accept="image/*" className="form-control form-control-sm" onChange={(e) => setImage2File(e.target.files?.[0] || null)} />
                    {existingImg2 && <small className="text-success d-block mt-1">✓ Image saved</small>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Gallery Image 3</label>
                    <input type="file" accept="image/*" className="form-control form-control-sm" onChange={(e) => setImage3File(e.target.files?.[0] || null)} />
                    {existingImg3 && <small className="text-success d-block mt-1">✓ Image saved</small>}
                  </div>

                </div>
                <button type="submit" className="btn btn-lg w-100 text-white fw-bold mt-4" style={{ backgroundColor: themeColor }} disabled={isSubmitting}>
                  {isSubmitting ? "Uploading & Saving..." : (editingId ? "Update Service" : "Save New Service")}
                </button>
              </form>
            </div>

            {/* THE DATA TABLE */}
            <h4 className="fw-bold mb-3" style={{ color: themeColor }}>Current Services Database</h4>
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 px-4">Pos</th>
                      <th className="py-3">Title</th>
                      <th className="py-3">Slug</th>
                      <th className="py-3 text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesList.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-4 text-muted">No services found in database.</td></tr>
                    ) : (
                      servicesList.map((srv) => (
                        <tr key={srv.id}>
                          <td className="px-4 fw-bold text-muted">{srv.position}</td>
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

          </div>
        </div>
      </div>
    </div>
  );
}