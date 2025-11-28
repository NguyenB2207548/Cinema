import React, { useState, useEffect } from "react";
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

  // --- 1. STATE CHO Ô TÌM KIẾM ---
  const [keyword, setKeyword] = useState("");

  // --- GIỮ NGUYÊN CODE CŨ CỦA BẠN (User State) ---
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
        return null;
      }
    }
    return null;
  });

  // --- USER EFFECT (Cập nhật User khi đổi trang + Reset Search) ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
    } else {
      try {
        const decoded = jwtDecode(token);
        setUser({
          name: decoded.full_name || decoded.username || "Người dùng",
          avatar: "",
        });
      } catch (error) {
        setUser(null);
        console.log(error);
      }
    }

    // --- RESET Ô TÌM KIẾM ---
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");

    if (searchParam) {
      setKeyword(searchParam);
    } else {
      setKeyword("");
    }
  }, [location.pathname, location.search]);

  // --- BẮT SỰ KIỆN RELOAD (F5) ĐỂ REDIRECT VỀ TRANG CHỦ ---
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Lưu flag vào sessionStorage để biết là đang reload
      sessionStorage.setItem("isReloading", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Kiểm tra xem có phải vừa reload không
    const isReloading = sessionStorage.getItem("isReloading");
    if (isReloading === "true") {
      sessionStorage.removeItem("isReloading");
      // Nếu URL có search param thì redirect về trang chủ
      if (location.search) {
        navigate("/", { replace: true });
      }
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // --- XỬ LÝ ĐĂNG XUẤT ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  // --- 2. XỬ LÝ TÌM KIẾM ---
  const handleSearch = () => {
    if (keyword.trim()) {
      // Chuyển hướng về trang chủ kèm tham số search
      // Ví dụ: /?search=Avengers
      navigate(`/?search=${encodeURIComponent(keyword)}`);
    } else {
      // Nếu rỗng thì về trang chủ mặc định (xóa param search)
      navigate("/");
    }
  };

  // Xử lý khi nhấn Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Ngăn submit form mặc định
      handleSearch();
    }
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
            {/* --- Ô TÌM KIẾM --- */}
            <div className="search-wrapper d-none d-md-block">
              <Form.Control
                type="text"
                placeholder="Tìm kiếm phim..."
                className="search-input"
                // Binding dữ liệu
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <FaSearch
                className="search-icon"
                onClick={handleSearch} // Click icon cũng tìm
                style={{ cursor: "pointer" }}
              />
            </div>

            {/* User Dropdown / Login Buttons (Giữ nguyên) */}
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
                  to="/booking/history"
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
