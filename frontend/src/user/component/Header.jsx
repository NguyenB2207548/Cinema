import React, { useState, useEffect } from "react"; // Nhớ import useEffect
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
import { jwtDecode } from "jwt-decode";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Header.css";

const Header = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  // --- GIỮ NGUYÊN CODE CŨ CỦA BẠN (Khởi tạo lần đầu) ---
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return {
          name: decoded.full_name || decoded.username || "Người dùng",
          avatar: "",
        };
      } catch (error) {
        console.error("Token lỗi hoặc hết hạn", error);
        localStorage.removeItem("token");
        return null; // Trả về null thay vì object rỗng để logic UI bên dưới hoạt động đúng
      }
    }
    return null; // Mặc định là null
  });

  // --- THÊM ĐOẠN NÀY: Lắng nghe sự thay đổi URL để cập nhật lại State ---
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Nếu không có token (đã đăng xuất) mà state user vẫn còn dữ liệu -> Set về null
    if (!token) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setUser(null);
    } else {
      // Nếu có token (ví dụ đăng nhập xong chuyển trang), cập nhật lại user
      try {
        const decoded = jwtDecode(token);
        setUser({
          name: decoded.full_name || decoded.username || "Người dùng",
          avatar: "",
        });
      } catch (error) {
        setUser(null);
        console.error(error);
      }
    }
  }, [location.pathname]); // Chạy lại mỗi khi chuyển trang (ví dụ từ Admin -> Login)

  // --- XỬ LÝ ĐĂNG XUẤT ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <Navbar className="header-navbar" expand="lg" variant="dark">
      <Container className="px-4 header-container">
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
            <div className="search-wrapper d-none d-md-block">
              <Form.Control
                type="text"
                placeholder="Tìm kiếm phim..."
                className="search-input"
              />
              <FaSearch className="search-icon" />
            </div>

            {/* Kiểm tra user có tồn tại không */}
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
