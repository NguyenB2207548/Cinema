import React, { useState, useEffect } from "react";
import { Table, Button, Pagination, Modal, Form, Alert } from "react-bootstrap";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaChair } from "react-icons/fa";
import "../css/Manager.css";

const RoomManager = () => {
  // --- STATE DỮ LIỆU ---
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- STATE PHÂN TRANG (CLIENT-SIDE) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- STATE TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // CẬP NHẬT: State dùng 'room_name' thay vì 'name' để khớp Backend
  const [newRoom, setNewRoom] = useState({
    room_name: "",
    capacity: 100,
    description: "",
  });

  // ==========================================
  // 1. LẤY DANH SÁCH PHÒNG (GET)
  // ==========================================
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Lưu ý: Bạn cần đảm bảo API GET trả về trường 'room_name' thay vì 'name'
      const response = await fetch("http://localhost:3000/api/room", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Lỗi tải dữ liệu");

      const result = await response.json();

      setRooms(result.data || []);
      setFilteredRooms(result.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ==========================================
  // 2. XỬ LÝ TÌM KIẾM (CLIENT-SIDE)
  // ==========================================
  useEffect(() => {
    const results = rooms.filter((room) =>
      // CẬP NHẬT: Tìm theo room_name
      (room.room_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(results);
    setCurrentPage(1);
  }, [searchTerm, rooms]);

  // ==========================================
  // 3. XỬ LÝ PHÂN TRANG
  // ==========================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  // ==========================================
  // 4. XỬ LÝ THÊM PHÒNG MỚI (POST)
  // ==========================================
  const handleShowModal = () => {
    setNewRoom({ room_name: "", capacity: 100, description: "" });
    setModalError("");
    setModalSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleCreateRoom = async () => {
    setModalError("");
    setModalSuccess("");

    // Validate frontend
    if (!newRoom.room_name || !newRoom.capacity) {
      setModalError("Tên phòng và Sức chứa là bắt buộc.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // CẬP NHẬT: Gửi đúng endpoint và body JSON
      const response = await fetch("http://localhost:3000/api/room/add", {
        // Hoặc /api/cinema-rooms/create tùy route bạn đặt
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Body gửi lên khớp với req.body của backend: { room_name, capacity, description }
        body: JSON.stringify(newRoom),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Tạo thất bại");

      setModalSuccess(
        `Thành công! Đã tạo phòng và ${data.seatsCount || 0} ghế.`
      );

      setTimeout(() => {
        handleCloseModal();
        fetchRooms();
      }, 1500);
    } catch (error) {
      setModalError(error.message);
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="manager-container p-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold m-0">Quản lý phòng chiếu</h3>
          <small className="text-muted">
            Tổng số: {filteredRooms.length} phòng
          </small>
        </div>

        <div className="d-flex gap-2">
          <div className="search-box">
            <FaSearch className="search-icon-inside" />
            <input
              type="text"
              placeholder="Tìm tên phòng..."
              className="search-input-custom"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="dark"
            className="btn-add-new"
            onClick={handleShowModal}
          >
            <FaPlus className="me-2" /> Thêm phòng
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <Table hover className="align-middle">
          <thead className="bg-light">
            <tr>
              <th style={{ width: "10%" }}>STT</th>
              <th style={{ width: "30%" }}>Tên phòng</th>
              <th style={{ width: "20%" }}>Số ghế</th>
              <th style={{ width: "25%" }}>Miêu tả</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : currentRooms.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  Không tìm thấy phòng nào.
                </td>
              </tr>
            ) : (
              currentRooms.map((room, index) => (
                // Lưu ý: Dùng room_id thay vì id nếu backend trả về như vậy
                <tr key={room.room_id || room.id}>
                  <td className="fw-bold text-muted">{index + 1}</td>
                  {/* CẬP NHẬT: Hiển thị room_name */}
                  <td className="fw-bold text-primary">
                    {room.room_name || room.name}
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaChair className="text-secondary me-2" />
                      <span className="fw-bold">{room.capacity}</span>
                    </div>
                  </td>
                  <td className="text-muted small">
                    {room.description || "Không có mô tả"}
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

      {/* --- MODAL THÊM PHÒNG --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Thêm phòng chiếu mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Tên phòng <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                // Bind vào state room_name
                value={newRoom.room_name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, room_name: e.target.value })
                }
                placeholder="VD: Phòng 01, Phòng IMAX"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Số lượng ghế (Capacity) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                value={newRoom.capacity}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, capacity: e.target.value })
                }
                min={1}
              />
              <Form.Text className="text-muted">
                Hệ thống sẽ tự động sinh ghế dựa trên số lượng này.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Miêu tả (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newRoom.description}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, description: e.target.value })
                }
                placeholder="Thông tin thêm về phòng..."
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
            onClick={handleCreateRoom}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            Lưu lại
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RoomManager;
