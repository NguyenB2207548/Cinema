import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Pagination, Modal, Form, Alert } from "react-bootstrap";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTag } from "react-icons/fa";
import "../css/Manager.css";

const GenreManager = () => {
  // --- STATE ---
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  const [searchTerm, setSearchTerm] = useState(""); // Input value
  const [query, setQuery] = useState(""); // API query value

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [newGenreName, setNewGenreName] = useState("");

  // ==========================================
  // 1. FETCH DATA
  // ==========================================
  const fetchGenres = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: query,
      });

      // Giả định endpoint là /api/genres (hoặc /api/data/genres tùy bạn cấu hình)
      // Nhưng để quản lý (có thêm/sửa/xóa) thì nên dùng route riêng /api/genres
      const response = await fetch(
        `http://localhost:3000/api/genre?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Lỗi tải dữ liệu");

      const result = await response.json();

      // Backend trả về { data: [], meta: {...} }
      setGenres(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);
      setTotalItems(result.meta?.total_items || 0);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, query]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

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

  // --- CREATE GENRE ---
  const handleShowModal = () => {
    setNewGenreName("");
    setModalError("");
    setModalSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleCreateGenre = async () => {
    setModalError("");
    setModalSuccess("");

    if (!newGenreName.trim()) {
      setModalError("Tên thể loại không được để trống");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/genre/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGenreName }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Tạo thất bại");

      setModalSuccess("Thêm thể loại thành công!");
      setTimeout(() => {
        handleCloseModal();
        fetchGenres();
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
          <h3 className="fw-bold m-0">Quản lý thể loại</h3>
          <small className="text-muted">Tổng số: {totalItems} thể loại</small>
        </div>

        <div className="d-flex gap-2">
          <div className="search-box">
            <FaSearch className="search-icon-inside" />
            <input
              type="text"
              placeholder="Tìm thể loại..."
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
        <Table hover className="manager-table align-middle">
          <thead className="bg-light">
            <tr>
              <th style={{ width: "10%" }}>STT</th>
              <th style={{ width: "70%" }}>Tên thể loại</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : genres.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            ) : (
              genres.map((genre, index) => (
                <tr key={genre.genre_id}>
                  <td className="fw-bold text-muted">{index + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaTag className="text-secondary me-2" />
                      <span className="fw-bold text-primary">{genre.name}</span>
                    </div>
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
          <Modal.Title className="fw-bold">Thêm thể loại mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}
          <Form.Group>
            <Form.Label>
              Tên thể loại <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              placeholder="Ví dụ: Hành động, Kinh dị..."
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button
            variant="dark"
            onClick={handleCreateGenre}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            Lưu lại
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GenreManager;
