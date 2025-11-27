import React from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import DashboardHome from "./DashboardHome";
import "../assets/css/Admin.css";

const AdminLayout = () => {
  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      {/* 1. Header cố định ở trên */}
      <AdminHeader />

      {/* 2. Phần thân gồm Sidebar và Content */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar cố định bên trái */}
        <AdminSidebar />

        {/* Nội dung chính bên phải */}
        <main className="admin-content flex-grow-1">
          {/* Ở đây bạn có thể dùng React Router <Outlet/> nếu muốn đổi trang, 
               hiện tại tôi để DashboardHome làm mặc định */}
          <DashboardHome />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
