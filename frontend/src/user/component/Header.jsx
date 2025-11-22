import React, { useState } from "react";
import { Navbar, Container, Form, NavDropdown, Image } from "react-bootstrap";
import {
  FaFilm,
  FaSearch,
  FaUserCircle,
  FaTicketAlt,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Header.css";

const Header = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  // --- GIẢ LẬP TRẠNG THÁI ĐĂNG NHẬP ---
  // Trong thực tế, bạn lấy từ Redux hoặc localStorage
  // Ví dụ: const user = JSON.parse(localStorage.getItem('user'));
  const [user, setUser] = useState({
    name: "Nguyễn Văn A",
    avatar: "", // Để trống sẽ hiện icon mặc định màu vàng
  });

  // Giả sử sau khi login xong, có user data (bạn có thể test bằng cách set cứng user = {})
  // const user = { name: "Nguyễn Văn A", avatar: "https://via.placeholder.com/150" };

  const handleLogout = () => {
    // Xử lý đăng xuất
    setUser(null);
    navigate("/login");
  };

  return (
    <Navbar className="header-navbar" expand="lg" variant="dark">
      <Container className="px-4 header-container">
        {/* Logo */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <FaFilm className="logo-icon" />
          <span className="logo-text">
            <span className="logo-ticket">Ticket</span>
            <span className="logo-search">Search</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <div className="ms-auto d-flex align-items-center gap-3 header-right">
            {/* --- Ô tìm kiếm luôn nằm bên trái --- */}
            <div className="search-wrapper d-none d-md-block">
              <Form.Control
                type="text"
                placeholder="Tìm kiếm phim..."
                className="search-input"
              />
              <FaSearch className="search-icon" />
            </div>

            {/* --- BÊN PHẢI Ô TÌM KIẾM LÀ USER/AUTH --- */}
            {user ? (
              <NavDropdown
                title={
                  <div className="d-flex align-items-center user-info">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        roundedCircle
                        className="user-avatar"
                      />
                    ) : (
                      <FaUserCircle className="user-icon-placeholder" />
                    )}
                    <span className="user-name ms-2">{user.name}</span>
                  </div>
                }
                id="user-nav-dropdown"
                align="end"
                className="user-dropdown"
              >
                <NavDropdown.Item
                  as={Link}
                  to="/profile"
                  className="dropdown-item-custom"
                >
                  <FaUser className="me-2" /> Thông tin cá nhân
                </NavDropdown.Item>

                <NavDropdown.Item
                  as={Link}
                  to="/my-tickets"
                  className="dropdown-item-custom"
                >
                  <FaTicketAlt className="me-2" /> Vé của tôi
                </NavDropdown.Item>

                <NavDropdown.Divider
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                />

                <NavDropdown.Item
                  onClick={handleLogout}
                  className="dropdown-item-custom text-danger"
                >
                  <FaSignOutAlt className="me-2" /> Đăng xuất
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Link
                  to="/register"
                  className={
                    path === "/register"
                      ? "btn-auth-filled"
                      : "btn-auth-outline"
                  }
                >
                  Đăng ký
                </Link>
                <Link
                  to="/login"
                  className={
                    path === "/login" ? "btn-auth-filled" : "btn-auth-outline"
                  }
                >
                  Đăng nhập
                </Link>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
