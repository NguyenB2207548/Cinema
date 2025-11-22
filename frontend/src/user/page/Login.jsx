import React from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import "../../assets/css/Login.css"; // Import file CSS

const Login = () => {
  return (
    <div className="login-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            {" "}
            {/* Độ rộng cột vừa phải giống ảnh */}
            <div className="p-4 login-frame">
              {/* Tiêu đề */}
              <h3 className="auth-title">Đăng nhập</h3>

              <Form>
                {/* Tên đăng nhập */}
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>Tên đăng nhập</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tên đăng nhập"
                    className="custom-input"
                  />
                </Form.Group>

                {/* Mật khẩu */}
                <Form.Group className="mb-2" controlId="formPassword">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Mật khẩu"
                    className="custom-input"
                  />
                </Form.Group>

                {/* Quên mật khẩu */}
                <div className="mb-3">
                  <a href="/forgot-password" class="forgot-password-link">
                    Quên mật khẩu?
                  </a>
                </div>

                {/* Nút Submit */}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 btn-gold"
                >
                  Đăng nhập
                </Button>

                {/* Chuyển hướng Đăng ký */}
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
