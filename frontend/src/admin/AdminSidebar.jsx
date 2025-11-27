import React, { useState } from "react";
import {
  FaHome,
  FaUsers,
  FaFilm,
  FaCalendarAlt,
  FaBuilding,
  FaFolderOpen,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "../assets/css/Admin.css";

const AdminSidebar = () => {
  const [isExtraOpen, setIsExtraOpen] = useState(true); // Mặc định mở

  return (
    <div className="admin-sidebar">
      <div className="sidebar-item active">
        <FaHome className="sidebar-icon" /> Dashboard
      </div>
      <div className="sidebar-item">
        <FaUsers className="sidebar-icon" /> Quản lý người dùng
      </div>
      <div className="sidebar-item">
        <FaFilm className="sidebar-icon" /> Quản lý phim
      </div>
      <div className="sidebar-item">
        <FaCalendarAlt className="sidebar-icon" /> Quản lý lịch chiếu
      </div>
      <div className="sidebar-item">
        <FaBuilding className="sidebar-icon" /> Quản lý rạp & Phòng
      </div>

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
          <a href="#" className="submenu-item">
            Thể loại
          </a>
          <a href="#" className="submenu-item">
            Diễn viên
          </a>
          <a href="#" className="submenu-item">
            Đạo diễn
          </a>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;
