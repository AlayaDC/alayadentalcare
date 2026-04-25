"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminAuth } from "../../../components/AdminAuthContext";

const themeColor = "#086351";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteContent = Record<string, any>;

// Defined outside component to prevent re-creation on every render (fixes input focus loss)
const InputField = ({ label, section, field, textarea = false, content, updateField }: {
  label: string; section: string; field: string; textarea?: boolean;
  content: SiteContent; updateField: (section: string, field: string, value: unknown) => void;
}) => (
  <div className="mb-3">
    <label className="form-label fw-semibold small text-muted">{label}</label>
    {textarea ? (
      <textarea
        className="form-control bg-light border-0"
        rows={3}
        value={content[section]?.[field] || ""}
        onChange={(e) => updateField(section, field, e.target.value)}
      />
    ) : (
      <input
        type="text"
        className="form-control bg-light border-0"
        value={content[section]?.[field] || ""}
        onChange={(e) => updateField(section, field, e.target.value)}
      />
    )}
  </div>
);

const SectionHeader = ({ sectionKey, label, icon, openSections, toggleSection }: {
  sectionKey: string; label: string; icon: string;
  openSections: Record<string, boolean>; toggleSection: (key: string) => void;
}) => (
  <div
    className="d-flex align-items-center justify-content-between p-3 rounded-3"
    style={{
      background: openSections[sectionKey] ? "rgba(8,99,81,0.08)" : "#f8f9fa",
      cursor: "pointer",
      transition: "all 0.2s",
    }}
    onClick={() => toggleSection(sectionKey)}
  >
    <div className="d-flex align-items-center gap-2">
      <i className={`bi ${icon}`} style={{ color: themeColor, fontSize: "1.1rem" }}></i>
      <span className="fw-bold">{label}</span>
    </div>
    <i className={`bi bi-chevron-${openSections[sectionKey] ? "up" : "down"}`}></i>
  </div>
);

const SECTION_CONFIG = [
  { key: "topbar", label: "Top Bar", icon: "bi-broadcast" },
  { key: "hero", label: "Hero Section", icon: "bi-stars" },
  { key: "about", label: "About Section", icon: "bi-info-circle" },
  { key: "services_header", label: "Services Header", icon: "bi-grid" },
  { key: "doctors_header", label: "Doctors Header", icon: "bi-person-badge" },
  { key: "testimonials", label: "Testimonials", icon: "bi-chat-quote" },
  { key: "cta", label: "Call to Action", icon: "bi-megaphone" },
  { key: "footer", label: "Footer", icon: "bi-layout-text-sidebar-reverse" },
];

export default function ManageContentPage() {
  const { logout } = useAdminAuth();
  const [content, setContent] = useState<SiteContent>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/site-content");
      if (res.ok) {
        const json = await res.json();
        setContent(json.data || {});
      }
    } catch (err) {
      console.error("Failed to fetch content:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleLogout = async () => {
    await logout();
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = (section: string, field: string, value: unknown) => {
    setContent((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value },
    }));
  };

  const updateArrayItem = (section: string, field: string, index: number, key: string, value: string) => {
    setContent((prev) => {
      const arr = [...((prev[section]?.[field]) || [])];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [section]: { ...(prev[section] || {}), [field]: arr } };
    });
  };

  const addArrayItem = (section: string, field: string, template: Record<string, string>) => {
    setContent((prev) => {
      const arr = [...((prev[section]?.[field]) || []), template];
      return { ...prev, [section]: { ...(prev[section] || {}), [field]: arr } };
    });
  };

  const removeArrayItem = (section: string, field: string, index: number) => {
    setContent((prev) => {
      const arr = [...((prev[section]?.[field]) || [])];
      arr.splice(index, 1);
      return { ...prev, [section]: { ...(prev[section] || {}), [field]: arr } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        alert("Website content saved successfully! Changes will appear within 60 seconds.");
      } else {
        const err = await res.json();
        alert("Error saving: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to save content");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="container-fluid px-3 px-lg-4 py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold" style={{ color: themeColor }}>
            <i className="bi bi-pencil-square me-2"></i>Website Content
          </h2>
          <button
            className="btn text-white fw-bold px-4"
            style={{ backgroundColor: themeColor, borderRadius: "12px" }}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
            ) : (
              <><i className="bi bi-check-circle me-2"></i>Save All Changes</>
            )}
          </button>
        </div>

        <div className="alert alert-info border-0 small mb-4" style={{ borderRadius: "12px" }}>
          <i className="bi bi-info-circle me-2"></i>
          Edit your website text below. Changes will be live within 60 seconds after saving.
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: "#086351" }}></div>
            <p className="mt-2 text-muted small">Loading content...</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {/* ─── Top Bar ─── */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                <SectionHeader openSections={openSections} toggleSection={toggleSection} sectionKey="topbar" label="Top Bar" icon="bi-broadcast" />
                {openSections.topbar && (
                  <div className="p-3">
                    <InputField content={content} updateField={updateField} label="Working Hours" section="topbar" field="working_hours" />
                    <InputField content={content} updateField={updateField} label="Phone Number" section="topbar" field="phone" />
                    <InputField content={content} updateField={updateField} label="WhatsApp Number (911234567890)" section="topbar" field="whatsapp_number" />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Hero Section ─── */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                <SectionHeader openSections={openSections} toggleSection={toggleSection} sectionKey="hero" label="Hero Section" icon="bi-stars" />
                {openSections.hero && (
                  <div className="p-3">
                    <InputField content={content} updateField={updateField} label="Badge Text" section="hero" field="badge_text" />
                    <div className="row">
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Title Line 1" section="hero" field="title_line1" />
                      </div>
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Title Line 2 (italic)" section="hero" field="title_line2" />
                      </div>
                    </div>
                    <InputField content={content} updateField={updateField} label="Description" section="hero" field="description" textarea />
                    <InputField content={content} updateField={updateField} label="Hero Image URL" section="hero" field="hero_image_url" />
                    <div className="row">
                      <div className="col-md-4">
                        <InputField content={content} updateField={updateField} label="Corner Badge Value" section="hero" field="corner_badge_value" />
                      </div>
                      <div className="col-md-4">
                        <InputField content={content} updateField={updateField} label="Corner Badge Label" section="hero" field="corner_badge_label" />
                      </div>
                      <div className="col-md-4">
                        <InputField content={content} updateField={updateField} label="Top Badge Text" section="hero" field="top_badge_text" />
                      </div>
                    </div>

                    <label className="form-label fw-semibold small text-muted mt-2">Statistics</label>
                    {(content.hero?.stats || []).map((stat: { value: string; label: string }, idx: number) => (
                      <div className="d-flex gap-2 mb-2 align-items-center" key={idx}>
                        <input
                          type="text"
                          className="form-control bg-light border-0"
                          placeholder="Value (e.g. 10+)"
                          value={stat.value || ""}
                          onChange={(e) => updateArrayItem("hero", "stats", idx, "value", e.target.value)}
                          style={{ maxWidth: "150px" }}
                        />
                        <input
                          type="text"
                          className="form-control bg-light border-0"
                          placeholder="Label"
                          value={stat.label || ""}
                          onChange={(e) => updateArrayItem("hero", "stats", idx, "label", e.target.value)}
                        />
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeArrayItem("hero", "stats", idx)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => addArrayItem("hero", "stats", { value: "", label: "" })}
                    >
                      <i className="bi bi-plus me-1"></i>Add Stat
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─── About Section ─── */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                <SectionHeader openSections={openSections} toggleSection={toggleSection} sectionKey="about" label="About Section" icon="bi-info-circle" />
                {openSections.about && (
                  <div className="p-3">
                    <InputField content={content} updateField={updateField} label="Section Label" section="about" field="section_label" />
                    <div className="row">
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading" section="about" field="heading" />
                      </div>
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading Accent (colored)" section="about" field="heading_accent" />
                      </div>
                    </div>
                    <InputField content={content} updateField={updateField} label="Description" section="about" field="description" textarea />
                    <div className="row">
                      <div className="col-md-4">
                        <InputField content={content} updateField={updateField} label="Experience Years" section="about" field="experience_years" />
                      </div>
                      <div className="col-md-4">
                        <InputField content={content} updateField={updateField} label="Experience Label" section="about" field="experience_label" />
                      </div>
                      <div className="col-md-4">
                        <InputField content={content} updateField={updateField} label="About Image URL" section="about" field="about_image_url" />
                      </div>
                    </div>

                    <label className="form-label fw-semibold small text-muted mt-2">Features</label>
                    {(content.about?.features || []).map((f: { icon: string; title: string; description: string }, idx: number) => (
                      <div className="card bg-light border-0 mb-2 p-2" key={idx}>
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            type="text"
                            className="form-control bg-white border-0"
                            placeholder="Icon (e.g. bi-heart-pulse-fill)"
                            value={f.icon || ""}
                            onChange={(e) => updateArrayItem("about", "features", idx, "icon", e.target.value)}
                            style={{ maxWidth: "220px" }}
                          />
                          <input
                            type="text"
                            className="form-control bg-white border-0"
                            placeholder="Title"
                            value={f.title || ""}
                            onChange={(e) => updateArrayItem("about", "features", idx, "title", e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-control bg-white border-0"
                            placeholder="Description"
                            value={f.description || ""}
                            onChange={(e) => updateArrayItem("about", "features", idx, "description", e.target.value)}
                          />
                          <button className="btn btn-outline-danger btn-sm" onClick={() => removeArrayItem("about", "features", idx)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => addArrayItem("about", "features", { icon: "bi-star-fill", title: "", description: "" })}
                    >
                      <i className="bi bi-plus me-1"></i>Add Feature
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Services Header ─── */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                <SectionHeader openSections={openSections} toggleSection={toggleSection} sectionKey="services_header" label="Services Header" icon="bi-grid" />
                {openSections.services_header && (
                  <div className="p-3">
                    <InputField content={content} updateField={updateField} label="Section Label" section="services_header" field="section_label" />
                    <div className="row">
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading" section="services_header" field="heading" />
                      </div>
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading Accent (colored)" section="services_header" field="heading_accent" />
                      </div>
                    </div>
                    <InputField content={content} updateField={updateField} label="Subtext" section="services_header" field="subtext" textarea />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Doctors Header ─── */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                <SectionHeader openSections={openSections} toggleSection={toggleSection} sectionKey="doctors_header" label="Doctors Header" icon="bi-person-badge" />
                {openSections.doctors_header && (
                  <div className="p-3">
                    <InputField content={content} updateField={updateField} label="Section Label" section="doctors_header" field="section_label" />
                    <div className="row">
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading" section="doctors_header" field="heading" />
                      </div>
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading Accent (colored)" section="doctors_header" field="heading_accent" />
                      </div>
                    </div>
                    <InputField content={content} updateField={updateField} label="Subtext" section="doctors_header" field="subtext" textarea />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Testimonials ─── */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                <SectionHeader openSections={openSections} toggleSection={toggleSection} sectionKey="testimonials" label="Testimonials" icon="bi-chat-quote" />
                {openSections.testimonials && (
                  <div className="p-3">
                    <InputField content={content} updateField={updateField} label="Section Label" section="testimonials" field="section_label" />
                    <div className="row">
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading" section="testimonials" field="heading" />
                      </div>
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading Accent (colored)" section="testimonials" field="heading_accent" />
                      </div>
                    </div>

                    <label className="form-label fw-semibold small text-muted mt-2">Testimonial Items</label>
                    {(content.testimonials?.items || []).map((t: { text: string; author: string; role: string }, idx: number) => (
                      <div className="card bg-light border-0 mb-2 p-3" key={idx}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-secondary">#{idx + 1}</span>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => removeArrayItem("testimonials", "items", idx)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <textarea
                          className="form-control bg-white border-0 mb-2"
                          placeholder="Testimonial text..."
                          rows={2}
                          value={t.text || ""}
                          onChange={(e) => updateArrayItem("testimonials", "items", idx, "text", e.target.value)}
                        />
                        <div className="d-flex gap-2">
                          <input
                            type="text"
                            className="form-control bg-white border-0"
                            placeholder="Author name"
                            value={t.author || ""}
                            onChange={(e) => updateArrayItem("testimonials", "items", idx, "author", e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-control bg-white border-0"
                            placeholder="Role"
                            value={t.role || ""}
                            onChange={(e) => updateArrayItem("testimonials", "items", idx, "role", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => addArrayItem("testimonials", "items", { text: "", author: "", role: "" })}
                    >
                      <i className="bi bi-plus me-1"></i>Add Testimonial
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─── CTA ─── */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                <SectionHeader openSections={openSections} toggleSection={toggleSection} sectionKey="cta" label="Call to Action" icon="bi-megaphone" />
                {openSections.cta && (
                  <div className="p-3">
                    <div className="row">
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading Line 1" section="cta" field="heading_line1" />
                      </div>
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Heading Line 2" section="cta" field="heading_line2" />
                      </div>
                    </div>
                    <InputField content={content} updateField={updateField} label="Description" section="cta" field="description" textarea />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Footer ─── */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                <SectionHeader openSections={openSections} toggleSection={toggleSection} sectionKey="footer" label="Footer" icon="bi-layout-text-sidebar-reverse" />
                {openSections.footer && (
                  <div className="p-3">
                    <div className="row">
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Brand Name" section="footer" field="brand_name" />
                      </div>
                      <div className="col-md-6">
                        <InputField content={content} updateField={updateField} label="Tagline" section="footer" field="tagline" />
                      </div>
                    </div>
                    <InputField content={content} updateField={updateField} label="Description" section="footer" field="description" textarea />
                    <InputField content={content} updateField={updateField} label="Copyright" section="footer" field="copyright" />

                    <hr className="my-3" />
                    <label className="form-label fw-bold">Clinic Locations</label>
                    {(content.footer?.clinics || []).map((clinic: { title: string; address: string; phone: string; email: string; hours: string }, idx: number) => (
                      <div className="card bg-light border-0 mb-3 p-3" key={idx}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small" style={{ color: themeColor }}>Clinic {idx + 1}</span>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => removeArrayItem("footer", "clinics", idx)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <input
                          type="text"
                          className="form-control bg-white border-0 mb-2"
                          placeholder="Clinic Name"
                          value={clinic.title || ""}
                          onChange={(e) => updateArrayItem("footer", "clinics", idx, "title", e.target.value)}
                        />
                        <textarea
                          className="form-control bg-white border-0 mb-2"
                          placeholder="Address"
                          rows={2}
                          value={clinic.address || ""}
                          onChange={(e) => updateArrayItem("footer", "clinics", idx, "address", e.target.value)}
                        />
                        <div className="row g-2">
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control bg-white border-0"
                              placeholder="Phone"
                              value={clinic.phone || ""}
                              onChange={(e) => updateArrayItem("footer", "clinics", idx, "phone", e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control bg-white border-0"
                              placeholder="Email"
                              value={clinic.email || ""}
                              onChange={(e) => updateArrayItem("footer", "clinics", idx, "email", e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control bg-white border-0"
                              placeholder="Hours"
                              value={clinic.hours || ""}
                              onChange={(e) => updateArrayItem("footer", "clinics", idx, "hours", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => addArrayItem("footer", "clinics", { title: "", address: "", phone: "", email: "", hours: "" })}
                    >
                      <i className="bi bi-plus me-1"></i>Add Clinic Location
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Save button at bottom */}
            <div className="text-center py-4">
              <button
                className="btn text-white fw-bold px-5 py-3"
                style={{ backgroundColor: themeColor, borderRadius: "15px", fontSize: "1.1rem" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                ) : (
                  <><i className="bi bi-check-circle me-2"></i>Save All Changes</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
