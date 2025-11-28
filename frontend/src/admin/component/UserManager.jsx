import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Pagination, Modal, Form, Alert } from "react-bootstrap";
import { FaSearch, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "../css/Manager.css";

const UserManager = () => {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // --- STATE QUẢN LÝ UI/FILTER ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Khớp với limit bên backend
  const [loading, setLoading] = useState(false);

  // --- STATE QUẢN LÝ MODAL THÊM USER ---
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    role: "user", // Mặc định là user
  });
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // ==========================================
  // 1. HÀM GỌI API LẤY DANH SÁCH USER
  // ==========================================
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Tạo query params: page, limit, search
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      const response = await fetch(
        `http://localhost:3000/api/auth/users?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          alert("Phiên đăng nhập hết hạn");
          window.location.href = "/login";
          return;
        }
        throw new Error("Lỗi tải dữ liệu");
      }

      const result = await response.json();

      // Cập nhật state từ dữ liệu Backend trả về
      setUsers(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]); // Khi trang thay đổi hoặc từ khóa tìm kiếm thay đổi (sau khi Enter) thì gọi lại

  // Gọi API lần đầu và khi currentPage thay đổi
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ==========================================
  // 2. HÀM XỬ LÝ TÌM KIẾM
  // ==========================================
  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1); // Reset về trang 1 khi tìm kiếm mới
      fetchUsers(); // Gọi API ngay lập tức
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // ==========================================
  // 3. HÀM XỬ LÝ THÊM USER MỚI (MODAL)
  // ==========================================
  const handleShowModal = () => {
    setModalError("");
    setModalSuccess("");
    setNewUser({
      username: "",
      password: "",
      email: "",
      fullName: "",
      role: "user",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleCreateUser = async () => {
    setModalError("");
    setModalSuccess("");

    // Validate cơ bản
    if (!newUser.username || !newUser.password || !newUser.email) {
      setModalError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/auth/add-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUser.username,
          password: newUser.password,
          email: newUser.email,
          full_name: newUser.fullName, // Map camelCase -> snake_case cho Backend
          role: newUser.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Tạo thất bại");
      }

      setModalSuccess("Tạo người dùng thành công!");

      // Refresh lại danh sách sau 1s và đóng modal
      setTimeout(() => {
        handleCloseModal();
        fetchUsers();
      }, 1000);
    } catch (error) {
      setModalError(error.message);
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="manager-container">
      {/* HEADER & TOOLBAR */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold m-0">Quản lý người dùng</h3>
          <small className="text-muted">Tổng số: {totalItems} tài khoản</small>
        </div>

        <div className="d-flex gap-2">
          {/* SEARCH BOX */}
          <div className="search-box">
            <FaSearch className="search-icon-inside" />
            <input
              type="text"
              placeholder="Tìm tên..."
              className="search-input-custom"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchEnter}
            />
          </div>

          {/* ADD BUTTON */}
          <Button
            variant="dark"
            className="btn-add-new"
            onClick={handleShowModal}
          >
            <FaPlus className="me-2" />
            Thêm người dùng mới
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <Table hover className="manager-table align-middle">
          <thead className="bg-light">
            <tr>
              <th>STT</th>
              <th>Họ tên / Username</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tham gia</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.user_id}>
                  <td className="fw-bold text-muted">{index + 1}</td>
                  <td>
                    <div className="fw-bold">
                      {user.full_name || user.username}
                    </div>
                    {/* <div className="small text-muted">{user.username}</div> */}
                  </td>
                  <td className="text-muted">{user.email}</td>
                  <td>
                    <span
                      className={`badge ${
                        user.role === "admin"
                          ? "bg-warning text-dark"
                          : "bg-light text-dark border"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="text-muted">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="action-btn"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.Prev
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages)].map((_, idx) => (
                <Pagination.Item
                  key={idx + 1}
                  active={idx + 1 === currentPage}
                  onClick={() => handlePageChange(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </div>

      {/* MODAL THÊM USER */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Thêm người dùng mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Tên đăng nhập <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={newUser.username}
                onChange={handleInputChange}
                placeholder="Ví dụ: admin123"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Mật khẩu <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Email <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Họ và tên</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={newUser.fullName}
                onChange={handleInputChange}
                placeholder="Nguyễn Văn A"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vai trò</Form.Label>
              <Form.Select
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
              >
                <option value="user">User (Người dùng)</option>
                <option value="admin">Admin (Quản trị viên)</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button
            variant="dark"
            onClick={handleCreateUser}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            Tạo tài khoản
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManager;
