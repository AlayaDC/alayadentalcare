"use client";

import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  currentPage: string;
  children: React.ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ currentPage, children, onLogout }: AdminLayoutProps) {
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
      <AdminSidebar currentPage={currentPage} onLogout={onLogout} />
      <div className="admin-layout-main">
        {children}
      </div>
    </>
  );
}
