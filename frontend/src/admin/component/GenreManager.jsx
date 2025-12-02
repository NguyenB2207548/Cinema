import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Pagination, Modal, Form, Alert } from "react-bootstrap";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTag } from "react-icons/fa";
import "../css/Manager.css";

const GenreManager = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [newGenreName, setNewGenreName] = useState("");
  const [editingGenreId, setEditingGenreId] = useState(null);

  const fetchGenres = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: query,
      });

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

  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      setQuery(searchTerm);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const resetModalState = () => {
    setNewGenreName("");
    setEditingGenreId(null);
    setModalError("");
    setModalSuccess("");
  };

  const handleShowModal = () => {
    resetModalState();
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleEdit = (genre) => {
    setEditingGenreId(genre.genre_id);
    setNewGenreName(genre.name);
    setModalError("");
    setModalSuccess("");
    setShowModal(true);
  };

  const handleSaveGenre = async () => {
    setModalError("");
    setModalSuccess("");

    if (!newGenreName.trim()) {
      setModalError("Tên thể loại không được để trống");
      return;
    }

    const isEdit = !!editingGenreId;
    const url = isEdit
      ? `http://localhost:3000/api/genre/update/${editingGenreId}`
      : "http://localhost:3000/api/genre/add";
    const method = isEdit ? "PUT" : "POST";

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGenreName }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.message || (isEdit ? "Cập nhật thất bại" : "Tạo thất bại")
        );

      setModalSuccess(
        isEdit ? "Cập nhật thể loại thành công!" : "Thêm thể loại thành công!"
      );

      setTimeout(() => {
        handleCloseModal();
        fetchGenres();
      }, 1000);
    } catch (error) {
      setModalError(error.message);
    }
  };

  const handleDeleteGenre = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thể loại này không?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:3000/api/genre/delete/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Xóa thể loại thất bại.");
        }

        alert("Xóa thể loại thành công!");
        fetchGenres();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="manager-container p-3">
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
                  <td className="fw-bold text-muted">
                    {index + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
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
                        onClick={() => handleEdit(genre)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="action-btn"
                        onClick={() => handleDeleteGenre(genre.genre_id)}
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

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {editingGenreId ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}
          </Modal.Title>
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
            onClick={handleSaveGenre}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            {editingGenreId ? "Lưu thay đổi" : "Lưu lại"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GenreManager;
