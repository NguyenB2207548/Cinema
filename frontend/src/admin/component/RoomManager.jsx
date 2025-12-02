import React, { useState, useEffect } from "react";
import { Table, Button, Pagination, Modal, Form, Alert } from "react-bootstrap";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaChair } from "react-icons/fa";
import "../css/Manager.css";

const RoomManager = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);

  const [newRoom, setNewRoom] = useState({
    room_name: "",
    capacity: 100,
    description: "",
  });

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
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

  useEffect(() => {
    const results = rooms.filter((room) =>
      (room.room_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(results);
    setCurrentPage(1);
  }, [searchTerm, rooms]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  const resetModalState = () => {
    setNewRoom({ room_name: "", capacity: 100, description: "" });
    setEditingRoomId(null);
    setModalError("");
    setModalSuccess("");
  };

  const handleShowModal = () => {
    resetModalState();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    resetModalState();
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoom({ ...newRoom, [name]: value });
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room.room_id);
    setNewRoom({
      room_name: room.room_name,
      capacity: room.capacity,
      description: room.description || "",
    });
    setModalError("");
    setModalSuccess("");
    setShowModal(true);
  };

  const handleDeleteRoom = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phòng chiếu này không?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:3000/api/room/delete/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Xóa phòng thất bại. Vui lòng kiểm tra lịch chiếu liên quan."
          );
        }

        alert("Xóa phòng thành công!");
        fetchRooms();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleSaveRoom = async () => {
    setModalError("");
    setModalSuccess("");

    if (!newRoom.room_name || !newRoom.capacity) {
      setModalError("Tên phòng và Sức chứa là bắt buộc.");
      return;
    }

    const url = editingRoomId
      ? `http://localhost:3000/api/room/update/${editingRoomId}`
      : "http://localhost:3000/api/room/add";
    const method = editingRoomId ? "PUT" : "POST";

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRoom),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.message || (editingRoomId ? "Cập nhật thất bại" : "Tạo thất bại")
        );

      const successMessage = editingRoomId
        ? "Cập nhật phòng thành công!"
        : `Thành công! Đã tạo phòng và ${data.seatsCount || 0} ghế.`;

      setModalSuccess(successMessage);

      setTimeout(() => {
        handleCloseModal();
        fetchRooms();
      }, 1500);
    } catch (error) {
      setModalError(error.message);
    }
  };

  return (
    <div className="manager-container p-3">
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

      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <Table hover className="manager-table align-middle">
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
                <tr key={room.room_id || room.id}>
                  <td className="fw-bold text-muted">
                    {indexOfFirstItem + index + 1}
                  </td>
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
                        onClick={() => handleEditRoom(room)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="action-btn"
                        onClick={() => handleDeleteRoom(room.room_id)}
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
            {editingRoomId ? "Chỉnh sửa phòng chiếu" : "Thêm phòng chiếu mới"}
          </Modal.Title>
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
                name="room_name"
                value={newRoom.room_name}
                onChange={handleInputChange}
                placeholder="VD: Phòng 01, Phòng IMAX"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Số lượng ghế (Capacity) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="capacity"
                value={newRoom.capacity}
                onChange={handleInputChange}
                min={1}
                disabled={!!editingRoomId}
              />
              <Form.Text className="text-muted">
                {editingRoomId
                  ? "Lưu ý: Không thể thay đổi sức chứa sau khi tạo."
                  : "Hệ thống sẽ tự động sinh ghế dựa trên số lượng này."}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Miêu tả (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={newRoom.description}
                onChange={handleInputChange}
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
            onClick={handleSaveRoom}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            {editingRoomId ? "Lưu thay đổi" : "Lưu lại"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RoomManager;
