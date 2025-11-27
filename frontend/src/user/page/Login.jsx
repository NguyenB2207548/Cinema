import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
// Không cần import axios nữa
import { jwtDecode } from "jwt-decode";
import "../../assets/css/Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // --- THAY ĐỔI: DÙNG FETCH ---
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Bắt buộc để backend hiểu là JSON
        },
        body: JSON.stringify({
          // Phải chuyển object thành chuỗi JSON
          username: username,
          password: password,
        }),
      });

      // Lấy dữ liệu trả về (dù thành công hay thất bại server thường vẫn trả về JSON)
      const data = await response.json();

      // --- KIỂM TRA LỖI THỦ CÔNG ---
      // fetch không tự throw lỗi 4xx/5xx, ta phải check response.ok
      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại.");
      }

      // --- NẾU THÀNH CÔNG ---
      const { token } = data;

      // 1. Lưu token
      localStorage.setItem("token", token);

      // 2. Giải mã token để lấy Role
      const decoded = jwtDecode(token);
      const userRole = decoded.role; // Đảm bảo key 'role' khớp với backend

      // 3. Điều hướng
      if (userRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }

      // Reload trang để cập nhật Header
      window.location.reload();
    } catch (err) {
      console.error(err);
      // Hiển thị message lỗi
      setError(err.message || "Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <div className="p-4 login-frame">
              <h3 className="auth-title">Đăng nhập</h3>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>Tên đăng nhập</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tên đăng nhập"
                    className="custom-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-2" controlId="formPassword">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Mật khẩu"
                    className="custom-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="mb-3">
                  <a href="/forgot-password" className="forgot-password-link">
                    Quên mật khẩu?
                  </a>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 btn-gold"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </Button>

                <div className="text-center register-redirect">
                  <span>Chưa có tài khoản? </span>
                  <a href="/register" className="register-link">
                    Đăng ký ngay.
                  </a>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
