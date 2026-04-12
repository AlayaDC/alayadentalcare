"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { createClient } from "../../../utils/supabase/client";
import AdminLayout from "../../../components/AdminLayout";

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

  // --- Modal State ---
  const [showModal, setShowModal] = useState(false);

  const themeColor = '#086351';
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) fetchDoctors();
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [supabase.auth]);

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*').order('position', { ascending: true });
    if (data) setDoctorsList(data);
  };

  const uploadImageToSupabase = async (file: File) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > MAX_SIZE) throw new Error('File too large (max 5MB)');
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('doctor-images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('doctor-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      let finalImageUrl = existingImageUrl || null;

      if (imageFile) {
        finalImageUrl = await uploadImageToSupabase(imageFile);
      }

      if (editingId) {
        const { error } = await supabase.from('doctors').update({ name, role, image: finalImageUrl, position: parseInt(position) || 0 }).eq('id', editingId);
        if (error) throw error;
        alert("✅ Doctor updated successfully!");
      } else {
        const { error } = await supabase.from('doctors').insert([{ name, role, image: finalImageUrl, position: parseInt(position) || 0 }]);
        if (error) throw error;
        alert("✅ Doctor added successfully!");
      }

      closeModal();
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
    setMessage("");
    setShowModal(true); // Open Modal
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this doctor? This cannot be undone.")) return;
    
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) {
      alert("Failed to delete.");
    } else {
      fetchDoctors();
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setName(""); setRole(""); setPosition(""); setImageFile(null); setExistingImageUrl("");
    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AdminLayout currentPage="doctors" onLogout={handleLogout}>
      <div className="container-fluid px-3 px-lg-4 py-4">
        
        {/* Header and Add Button */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-3 mb-sm-0" style={{ color: themeColor }}>Doctors Database</h4>
          <button onClick={openAddModal} className="btn text-white fw-bold px-4 py-2 shadow-sm w-100 w-sm-auto" style={{ backgroundColor: themeColor, borderRadius: '10px' }}>
            <i className="bi bi-person-plus-fill me-2"></i> Add Doctors
          </button>
        </div>

        {/* --- DESKTOP VIEW: Data Table --- */}
        <div className="d-none d-md-block card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
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
                        {doc.image ? (
                          <img src={doc.image} alt={doc.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#086351', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                            {doc.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        )}
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

        {/* --- MOBILE VIEW: Card Layout --- */}
        <div className="d-block d-md-none">
          {doctorsList.length === 0 ? (
             <div className="text-center py-4 text-muted bg-white shadow-sm rounded">No doctors found in database.</div>
          ) : (
            doctorsList.map((doc) => (
              <div key={doc.id} className="card border-0 shadow-sm mb-3" style={{ borderRadius: '15px' }}>
                <div className="card-body d-flex align-items-center">
                  {doc.image ? (
                    <img src={doc.image} alt={doc.name} className="me-3" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div className="me-3" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#086351', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                      {doc.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                  )}
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1">{doc.name}</h6>
                    <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{doc.role}</p>
                    <span className="badge bg-secondary">Pos: {doc.position}</span>
                  </div>
                </div>
                <div className="card-footer bg-white border-top-0 d-flex justify-content-end gap-2 pb-3">
                  <button onClick={() => handleEdit(doc)} className="btn btn-sm btn-outline-primary flex-fill"><i className="bi bi-pencil-square"></i> Edit</button>
                  <button onClick={() => handleDelete(doc.id)} className="btn btn-sm btn-outline-danger flex-fill"><i className="bi bi-trash"></i> Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* --- MODAL FOR ADD/EDIT --- */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              
              <div className="modal-header border-bottom-0 pb-0 mt-2 mx-2">
                <h5 className="modal-title fw-bold" style={{ color: themeColor }}>
                  {editingId ? "✏️ Edit Employee" : "➕ Add New Employee"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>

              <div className="modal-body px-4 py-3">
                {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} py-2`}>{message}</div>}
                
                <form onSubmit={handleSaveDoctor}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small mb-1">Full Name</label>
                    <input type="text" className="form-control form-control-lg bg-light border-0" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small mb-1">Role / Specialty</label>
                    <input type="text" className="form-control form-control-lg bg-light border-0" value={role} onChange={(e) => setRole(e.target.value)} required />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small mb-1">
                      {editingId ? "Update Photo (Optional)" : "Upload Photo"}
                    </label>
                    <input type="file" accept="image/*" className="form-control form-control-lg bg-light border-0" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    {editingId && existingImageUrl && !imageFile && (
                      <div className="mt-2 text-center">
                        <small className="text-muted d-block mb-1">Current Photo:</small>
                        <img src={existingImageUrl} alt="Current" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '10px' }} />
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted small mb-1">Position Number (Ordering)</label>
                    <input type="number" className="form-control form-control-lg bg-light border-0" value={position} onChange={(e) => setPosition(e.target.value)} required />
                  </div>

                  <button type="submit" className="btn btn-lg w-100 text-white fw-bold shadow-sm" style={{ backgroundColor: themeColor, borderRadius: '12px' }} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Saving...</>
                    ) : (
                      editingId ? "Update Employee Details" : "Save New Employee"
                    )}
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