import React, { useState } from "react";
import { Navbar, NavDropdown } from "react-bootstrap";
import { FaFilm, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../assets/css/Admin.css";

const AdminHeader = () => {
  const navigate = useNavigate();

  // Giữ nguyên logic lấy tên user của bạn
  const [adminName] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.full_name || decoded.username || "Admin";
      } catch (error) {
        console.error("Lỗi giải mã token:", error);
        return "Admin";
      }
    }
    return "Admin";
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Navbar className="admin-header px-3" variant="dark">
      <div className="d-flex align-items-center">
        <FaFilm className="text-warning me-2" size={24} />
        <div className="admin-logo">
          Ticket<span>Search</span>{" "}
          <span className="text-muted fw-normal fs-6">Admin</span>
        </div>
      </div>

      <div className="ms-auto">
        <NavDropdown
          title={
            // Bỏ d-inline-flex ở đây, CSS sẽ lo việc căn chỉnh
            <div className="d-flex align-items-center text-white">
              <FaUserCircle className="me-2" size={24} />
              <span className="fw-bold">{adminName}</span>
            </div>
          }
          id="admin-nav"
          align="end"
        >
          <NavDropdown.Item href="/admin">Trang chủ</NavDropdown.Item>
          <NavDropdown.Item href="#">Cài đặt</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={handleLogout} className="text-danger">
            Đăng xuất
          </NavDropdown.Item>
        </NavDropdown>
      </div>
    </Navbar>
  );
};

export default AdminHeader;
