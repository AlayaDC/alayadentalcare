"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../utils/supabase/client";

export default function ManageDoctorsPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- List and Edit States ---
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [position, setPosition] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const themeColor = '#086351';
  const supabase = createClient();

  // ─── SAFE VERCEL API FETCH ───
  const fetchDoctors = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/doctors');
      const result = await response.json();
      if (response.ok && result.data) setDoctorsList(result.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
      if (session?.user) fetchDoctors(); 
    };
    checkSession();
  }, [supabase.auth, fetchDoctors]);

  // ─── SAFE VERCEL UPLOAD ───
  const uploadImageToServer = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to upload image");
    return result.publicUrl;
  };

  // ─── SAFE VERCEL CREATE/UPDATE ───
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      let finalImageUrl = existingImageUrl;

      if (imageFile) {
        finalImageUrl = await uploadImageToServer(imageFile);
      } else if (!existingImageUrl) {
        throw new Error("Please select an image.");
      }

      const doctorData = { 
        name, 
        role, 
        image: finalImageUrl, 
        position: parseInt(position) 
      };

      if (editingId) {
        // UPDATE
        const response = await fetch('/api/admin/doctors', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...doctorData }),
        });
        if (!response.ok) throw new Error("Failed to update doctor");
        setMessage("✅ Doctor updated successfully!");
      } else {
        // CREATE
        const response = await fetch('/api/admin/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doctorData),
        });
        if (!response.ok) throw new Error("Failed to add doctor");
        setMessage("✅ Doctor added successfully!");
      }

      resetForm();
      fetchDoctors();
    } catch (error: any) {
      setMessage(`❌ Failed: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  const handleEdit = (doctor: any) => {
    setEditingId(doctor.id);
    setName(doctor.name);
    setRole(doctor.role);
    setPosition(doctor.position.toString());
    setExistingImageUrl(doctor.image);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── SAFE VERCEL DELETE ───
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this doctor? This cannot be undone.")) return;
    
    try {
      const response = await fetch(`/api/admin/doctors?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Delete failed");
      fetchDoctors();
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); setRole(""); setPosition(""); setImageFile(null); setExistingImageUrl("");
  };

  if (authLoading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-success"></div></div>;

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-danger">Access Denied</h2>
        <p>You must be logged in to view this page.</p>
        <Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-primary">Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav className="navbar navbar-dark shadow-sm py-3" style={{ backgroundColor: themeColor }}>
        <div className="container">
          <span className="navbar-brand fw-bold">Alaya Admin - Doctors</span>
          <Link href="/muthu-alaya-ramshi-portal-7893" className="btn btn-outline-light btn-sm fw-bold">
            <i className="bi bi-arrow-left me-2"></i>Back to Menu
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-10">
            
            {/* THE FORM */}
            <div className="card border-0 shadow-lg p-5 mb-5" style={{ borderRadius: '20px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0 text-center w-100">
                  {editingId ? "✏️ Edit Doctor" : "➕ Add a New Doctor"}
                </h4>
                {editingId && (
                  <button type="button" className="btn btn-outline-secondary btn-sm position-absolute end-0 me-5" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
              </div>

              {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} text-center`}>{message}</div>}
              
              <form onSubmit={handleSaveDoctor}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Name</label>
                    <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Role / Specialty</label>
                    <input type="text" className="form-control" value={role} onChange={(e) => setRole(e.target.value)} required />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-bold">
                      {editingId ? "Update Photo (Leave empty to keep current)" : "Upload Photo"}
                    </label>
                    <input type="file" accept="image/*" className="form-control" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required={!editingId} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Position Number</label>
                    <input type="number" className="form-control" value={position} onChange={(e) => setPosition(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-lg w-100 text-white fw-bold mt-4" style={{ backgroundColor: themeColor }} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (editingId ? "Update Doctor" : "Save New Doctor")}
                </button>
              </form>
            </div>

            {/* THE DATA TABLE */}
            <h4 className="fw-bold mb-3" style={{ color: themeColor }}>Current Doctors Database</h4>
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 px-4">Pos</th>
                      <th className="py-3">Photo</th>
                      <th className="py-3">Name</th>
                      <th className="py-3">Role</th>
                      <th className="py-3 text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorsList.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 text-muted">No doctors found in database.</td></tr>
                    ) : (
                      doctorsList.map((doc) => (
                        <tr key={doc.id}>
                          <td className="px-4 fw-bold text-muted">{doc.position}</td>
                          <td>
                            <img src={doc.image} alt={doc.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                          </td>
                          <td className="fw-semibold">{doc.name}</td>
                          <td>{doc.role}</td>
                          <td className="text-end px-4">
                            <button onClick={() => handleEdit(doc)} className="btn btn-sm btn-outline-primary me-2"><i className="bi bi-pencil-square"></i> Edit</button>
                            <button onClick={() => handleDelete(doc.id)} className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i> Delete</button>
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