import React, { useState, useEffect, useCallback } from "react";
import { Container, Form, Button, Alert, Spinner, Card } from "react-bootstrap";
import { FaUserEdit, FaSave, FaLock } from "react-icons/fa";

const Profile = () => {
  const [userData, setUserData] = useState({
    fullname: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setError("Vui lòng đăng nhập để xem thông tin.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Không thể tải hồ sơ.");
      }

      const { fullname, email } = result.data;
      setUserData({ fullname, email });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const validatePasswords = () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      return "Mật khẩu mới và mật khẩu xác nhận không khớp.";
    }
    if (passwordData.new_password && passwordData.new_password.length < 6) {
      return "Mật khẩu mới phải có ít nhất 6 ký tự.";
    }
    if (
      (passwordData.new_password || passwordData.old_password) &&
      (!passwordData.new_password || !passwordData.old_password)
    ) {
      return "Vui lòng nhập đầy đủ Mật khẩu cũ và Mật khẩu mới/xác nhận nếu bạn muốn thay đổi mật khẩu.";
    }
    return null;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const passwordError = validatePasswords();
    if (passwordError) {
      setError(passwordError);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      fullname: userData.fullname,
      email: userData.email,
    };

    if (passwordData.new_password) {
      payload.old_password = passwordData.old_password;
      payload.new_password = passwordData.new_password;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Cập nhật hồ sơ thất bại.");
      }

      alert(result.message);
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status" variant="primary" />
        <p className="mt-2">Đang tải thông tin hồ sơ...</p>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Card className="shadow-lg p-4">
        <Card.Title className="text-center fw-bold mb-4">
          <FaUserEdit className="me-2 text-primary" /> CHỈNH SỬA HỒ SƠ CÁ NHÂN
        </Card.Title>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleUpdateProfile}>
          <h5 className="mb-3 text-secondary">Thông tin cơ bản</h5>

          <Form.Group className="mb-3" controlId="formFullname">
            <Form.Label>
              Họ và tên <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="fullname"
              value={userData.fullname}
              onChange={handleDataChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={userData.email}
              onChange={handleDataChange}
            />
          </Form.Group>

          <hr className="my-4" />

          <h5 className="mb-3 text-secondary">
            <FaLock className="me-2" />
            Thay đổi mật khẩu (Tùy chọn)
          </h5>

          <Form.Group className="mb-3" controlId="formOldPassword">
            <Form.Label>Mật khẩu cũ</Form.Label>
            <Form.Control
              type="password"
              name="old_password"
              value={passwordData.old_password}
              onChange={handlePasswordChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formNewPassword">
            <Form.Label>Mật khẩu mới (ít nhất 6 ký tự)</Form.Label>
            <Form.Control
              type="password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formConfirmPassword">
            <Form.Label>Xác nhận mật khẩu mới</Form.Label>
            <Form.Control
              type="password"
              name="confirm_password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
            />
          </Form.Group>

          <Button
            variant="dark"
            type="submit"
            className="w-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FaSave className="me-2" /> Lưu thay đổi
              </>
            )}
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default Profile;
