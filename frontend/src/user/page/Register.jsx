import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../assets/css/Register.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // 1. Validation phía Client
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    if (!formData.agreeTerms) {
      setError("Bạn cần đồng ý với điều khoản dịch vụ.");
      return;
    }

    setLoading(true);

    try {
      // 2. Gọi API
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // 3. SỬA BODY ĐỂ KHỚP VỚI BACKEND
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          full_name: formData.fullName, // Backend dùng 'full_name', Front dùng 'fullName' -> Phải map lại
          role: "user", // Gửi mặc định role là 'user' (hoặc 'customer')
        }),
      });

      const data = await response.json();

      // 4. Kiểm tra phản hồi từ Backend (400, 409, 500...)
      if (!response.ok) {
        // Hiển thị message lỗi từ backend trả về (ví dụ: "Tên đăng nhập đã tồn tại")
        throw new Error(data.message || "Đăng ký thất bại.");
      }

      // 5. Thành công (201)
      setSuccess(data.message || "Đăng ký thành công! Đang chuyển hướng...");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.message || "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container d-flex align-items-center py-3">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <div className="p-4 register-frame">
              <h3 className="register-title">Đăng ký tài khoản</h3>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleRegister}>
                {/* Họ và tên */}
                <Form.Group className="mb-2" controlId="formFullName">
                  <Form.Label>Họ và tên</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    placeholder="Họ và tên"
                    className="custom-input"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Tên đăng nhập */}
                <Form.Group className="mb-2" controlId="formUsername">
                  <Form.Label>Tên đăng nhập</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder="Tên đăng nhập"
                    className="custom-input"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Email */}
                <Form.Group className="mb-2" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="custom-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Mật khẩu */}
                <Form.Group className="mb-2" controlId="formPassword">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Mật khẩu"
                    className="custom-input"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Xác nhận mật khẩu */}
                <Form.Group className="mb-2" controlId="formConfirmPassword">
                  <Form.Label>Xác nhận mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    placeholder="Xác nhận mật khẩu"
                    className="custom-input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Checkbox */}
                <Form.Group className="mb-3" controlId="formCheckbox">
                  <Form.Check type="checkbox">
                    <Form.Check.Input
                      type="checkbox"
                      name="agreeTerms"
                      className="custom-checkbox"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                    />
                    <Form.Check.Label style={{ fontSize: "0.9rem" }}>
                      Tôi đồng ý với{" "}
                      <span style={{ color: "#cca340", cursor: "pointer" }}>
                        Điều khoản dịch vụ
                      </span>{" "}
                      và{" "}
                      <span style={{ color: "#cca340", cursor: "pointer" }}>
                        Chính sách bảo mật
                      </span>
                    </Form.Check.Label>
                  </Form.Check>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 btn-gold mb-3"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Đăng ký"}
                </Button>

                <div className="text-center">
                  <span className="text-muted">Đã có tài khoản? </span>
                  <a href="/login" className="login-link">
                    Đăng nhập ngay.
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

export default Register;
