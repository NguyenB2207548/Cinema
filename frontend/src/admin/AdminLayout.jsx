import React from "react";
import { Outlet } from "react-router-dom"; // 1. Import Outlet
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import "../assets/css/Admin.css";

// Lưu ý: Không import DashboardHome hay UserManager ở đây nữa

const AdminLayout = () => {
  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <AdminHeader />

      <div className="d-flex flex-grow-1">
        <AdminSidebar />

        <main className="admin-content flex-grow-1">
          {/* 2. Thay DashboardHome bằng Outlet */}
          {/* Outlet là nơi nội dung thay đổi sẽ hiển thị */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
