import React from "react";
import { Navbar, Container, NavDropdown, Image } from "react-bootstrap";
import { FaUserCircle, FaFilm } from "react-icons/fa";
import "../assets/css/Admin.css";

const AdminHeader = () => {
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
            <div className="d-inline-flex align-items-center text-white">
              <Image
                src="https://via.placeholder.com/30"
                roundedCircle
                className="me-2"
              />
              <span>Admin User</span>
            </div>
          }
          id="admin-nav"
          align="end"
        >
          <NavDropdown.Item href="#">Trang chủ</NavDropdown.Item>
          <NavDropdown.Item href="#">Cài đặt</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#" className="text-danger">
            Đăng xuất
          </NavDropdown.Item>
        </NavDropdown>
      </div>
    </Navbar>
  );
};

export default AdminHeader;
