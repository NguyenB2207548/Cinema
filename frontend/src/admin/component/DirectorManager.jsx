import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Pagination,
  Modal,
  Form,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaVideo } from "react-icons/fa";
import "../css/Manager.css";

const DirectorManager = () => {
  // --- STATE DỮ LIỆU ---
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // State form: Bỏ birth_date
  const [newDirector, setNewDirector] = useState({
    fullname: "",
    nationality: "",
  });

  // ==========================================
  // 1. FETCH DATA (GET)
  // ==========================================
  const fetchDirectors = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: query,
      });

      const response = await fetch(
        `http://localhost:3000/api/director?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Lỗi tải dữ liệu");

      const result = await response.json();
      setDirectors(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);
      setTotalItems(result.meta?.total_items || 0);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, query]);

  useEffect(() => {
    fetchDirectors();
  }, [fetchDirectors]);

  // ==========================================
  // 2. HANDLERS
  // ==========================================
  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      setQuery(searchTerm);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  // --- CREATE DIRECTOR ---
  const handleShowModal = () => {
    setNewDirector({ fullname: "", nationality: "" }); // Reset form
    setModalError("");
    setModalSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDirector({ ...newDirector, [name]: value });
  };

  const handleCreateDirector = async () => {
    setModalError("");
    setModalSuccess("");

    if (!newDirector.fullname.trim()) {
      setModalError("Tên đạo diễn không được để trống");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/director/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newDirector),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Tạo thất bại");

      setModalSuccess("Thêm đạo diễn thành công!");
      setTimeout(() => {
        handleCloseModal();
        fetchDirectors();
      }, 1000);
    } catch (error) {
      setModalError(error.message);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="manager-container p-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold m-0">Quản lý đạo diễn</h3>
          <small className="text-muted">Tổng số: {totalItems} đạo diễn</small>
        </div>

        <div className="d-flex gap-2">
          <div className="search-box">
            <FaSearch className="search-icon-inside" />
            <input
              type="text"
              placeholder="Tìm đạo diễn..."
              className="search-input-custom"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchEnter}
            />
          </div>
          <Button
            variant="dark"
            className="btn-add-new"
            onClick={handleShowModal}
          >
            <FaPlus className="me-2" /> Thêm mới
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <Table hover className="align-middle">
          <thead className="bg-light">
            <tr>
              <th style={{ width: "10%" }}>STT</th>
              <th style={{ width: "60%" }}>Họ và tên</th>
              <th style={{ width: "20%" }}>Quốc gia</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : directors.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            ) : (
              directors.map((director, index) => (
                <tr key={director.director_id}>
                  <td className="fw-bold text-muted">{index + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaVideo className="text-secondary me-2" />
                      <span className="fw-bold text-primary">
                        {director.fullname}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted">
                    {director.nationality || "N/A"}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="action-btn"
                      >
                        <FaEdit />
                      </Button>
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

      {/* MODAL */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Thêm đạo diễn mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Họ và tên <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="fullname"
                value={newDirector.fullname}
                onChange={handleInputChange}
                placeholder="Ví dụ: Christopher Nolan"
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quốc tịch</Form.Label>
              <Form.Control
                type="text"
                name="nationality"
                value={newDirector.nationality}
                onChange={handleInputChange}
                placeholder="Ví dụ: Anh"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button
            variant="dark"
            onClick={handleCreateDirector}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            Lưu lại
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DirectorManager;
