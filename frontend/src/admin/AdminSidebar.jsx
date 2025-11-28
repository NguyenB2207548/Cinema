import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaFilm,
  FaCalendarAlt,
  FaBuilding,
  FaFolderOpen,
  FaChevronDown,
  FaChevronUp,
  FaTicketAlt,
} from "react-icons/fa";
import "../assets/css/Admin.css";

const AdminSidebar = () => {
  const [isExtraOpen, setIsExtraOpen] = useState(true); // Mặc định mở

  const location = useLocation();
  const path = location.pathname;

  // Hàm kiểm tra active: Nếu đường dẫn trùng khớp thì trả về 'active'
  const getActiveClass = (route) => {
    // So sánh chính xác hoặc so sánh tương đối (nếu cần)
    return path === route ? "sidebar-item active" : "sidebar-item";
  };

  return (
    <div className="admin-sidebar">
      <Link to="/admin" className={getActiveClass("/admin")}>
        <FaHome className="sidebar-icon" /> Dashboard
      </Link>

      <Link to="/admin/users" className={getActiveClass("/admin/users")}>
        <FaUsers className="sidebar-icon" /> Quản lý người dùng
      </Link>

      <Link to="/admin/movies" className={getActiveClass("/admin/movies")}>
        <FaFilm className="sidebar-icon" /> Quản lý phim
      </Link>

      <Link to="/admin/shows" className={getActiveClass("/admin/shows")}>
        <FaCalendarAlt className="sidebar-icon" /> Quản lý lịch chiếu
      </Link>

      <Link to="/admin/booking" className={getActiveClass("/admin/bookings")}>
        <FaTicketAlt className="sidebar-icon" /> Quản lý vé
      </Link>

      <Link to="/admin/rooms" className={getActiveClass("/admin/rooms")}>
        <FaBuilding className="sidebar-icon" /> Quản lý Phòng
      </Link>

      {/* Mục Dropdown */}
      <div
        className="sidebar-item justify-content-between"
        onClick={() => setIsExtraOpen(!isExtraOpen)}
      >
        <div className="d-flex align-items-center">
          <FaFolderOpen className="sidebar-icon" /> Dữ liệu bổ sung
        </div>
        {isExtraOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </div>

      {isExtraOpen && (
        <div className="submenu">
          <Link to="/admin/genres" className={getActiveClass("/admin/genres")}>
            Thể loại
          </Link>
          <Link to="/admin/actors" className={getActiveClass("/admin/genres")}>
            Diễn viên
          </Link>
          <Link
            to="/admin/directors"
            className={getActiveClass("/admin/directors")}
          >
            Đạo diễn
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;
