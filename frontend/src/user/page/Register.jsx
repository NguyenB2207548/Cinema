import React from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import "../../assets/css/Register.css";

const Register = () => {
  return (
    <div className="register-container d-flex align-items-center py-3">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <div className="p-4 register-frame">
              {/* Tiêu đề */}
              <h3 className="register-title">Đăng ký tài khoản</h3>

              <Form>
                {/* Họ và tên */}
                <Form.Group className="mb-2" controlId="formFullName">
                  <Form.Label>Họ và tên</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Họ và tên"
                    className="custom-input"
                  />
                </Form.Group>

                {/* Tên đăng nhập */}
                <Form.Group className="mb-2" controlId="formUsername">
                  <Form.Label>Tên đăng nhập</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tên đăng nhập"
                    className="custom-input"
                  />
                </Form.Group>

                {/* Email */}
                <Form.Group className="mb-2" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email"
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

                {/* Xác nhận mật khẩu */}
                <Form.Group className="mb-2" controlId="formConfirmPassword">
                  <Form.Label>Xác nhận mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Xác nhận mật khẩu"
                    className="custom-input"
                  />
                </Form.Group>

                {/* Checkbox điều khoản */}
                <Form.Group className="mb-3" controlId="formCheckbox">
                  <Form.Check type="checkbox">
                    <Form.Check.Input
                      type="checkbox"
                      className="custom-checkbox"
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

                {/* Nút Đăng ký */}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 btn-gold mb-3"
                >
                  Đăng ký
                </Button>

                {/* Link chuyển trang đăng nhập */}
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
