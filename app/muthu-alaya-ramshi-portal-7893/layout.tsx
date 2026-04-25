"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AdminSidebar from "../../components/AdminSidebar";
import { AdminAuthProvider, useAdminAuth } from "../../components/AdminAuthContext";

function AdminShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAdminAuth();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-layout-main {
          min-height: 100vh;
          background-color: #f8f9fa;
          padding-top: 0;
          margin-left: 0;
        }
        @media (min-width: 992px) {
          .admin-layout-main {
            margin-left: 260px;
          }
        }
      `}} />
      <AdminSidebar currentPage="" onLogout={logout} />
      <div className="admin-layout-main">
        {children}
      </div>
    </>
  );
}

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
