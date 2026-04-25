"use client";

export default function AdminLoadingSpinner() {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{ minHeight: "100vh", background: "#f8faf9" }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spinPulse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
      <div
        style={{
          width: "50px",
          height: "50px",
          border: "3px solid #e9ecef",
          borderTop: "3px solid #086351",
          borderRadius: "50%",
          animation: "spinPulse 0.8s linear infinite",
          marginBottom: "1rem",
        }}
      />
      <span
        style={{
          color: "#086351",
          fontWeight: 600,
          fontSize: "0.9rem",
          letterSpacing: "0.5px",
          animation: "fadeInUp 0.4s ease",
        }}
      >
        Loading...
      </span>
    </div>
  );
}
