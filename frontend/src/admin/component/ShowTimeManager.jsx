import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Pagination,
  Modal,
  Form,
  Row,
  Col,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaCalendarAlt,
} from "react-icons/fa";
import "../css/Manager.css";

const ShowTimeManager = () => {
  // --- STATE DỮ LIỆU CHÍNH ---
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- STATE DỮ LIỆU PHỤ TRỢ (Dropdown) ---
  const [moviesList, setMoviesList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);

  // --- STATE PHÂN TRANG & FILTER ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Filter theo ngày (Mặc định rỗng là lấy tất cả)
  const [filterDate, setFilterDate] = useState("");

  // --- STATE MODAL THÊM SUẤT CHIẾU ---
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const [newShowtime, setNewShowtime] = useState({
    movie_id: "",
    room_id: "",
    start_time: "", // YYYY-MM-DDTHH:mm
    price: 50000, // Giá mặc định
  });

  // ==========================================
  // 1. LẤY DỮ LIỆU PHỤ TRỢ (Movies & Rooms)
  // ==========================================
  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        // Lưu ý: Bạn cần có API lấy danh sách Phòng (ví dụ /api/rooms)
        // Đối với phim, ta dùng tạm API lấy danh sách phim limit lớn để lấy hết
        const [resMovies, resRooms] = await Promise.all([
          fetch("http://localhost:3000/api/cinema?limit=100"),
          fetch("http://localhost:3000/api/room"), // Giả định bạn đã có API này
        ]);

        const moviesData = await resMovies.json();
        const roomsData = await resRooms.json();

        setMoviesList(moviesData.data || []);
        setRoomsList(roomsData.data || roomsData || []); // Tùy cấu trúc trả về của API Room
      } catch (err) {
        console.error("Lỗi tải danh sách phim/phòng:", err);
      }
    };
    fetchAuxData();
  }, []);

  // ==========================================
  // 2. LẤY DANH SÁCH SUẤT CHIẾU (GET)
  // ==========================================
  const fetchShowtimes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Tạo query params
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (filterDate) {
        params.append("date", filterDate);
      }

      const response = await fetch(
        `http://localhost:3000/api/showtime?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Lỗi tải dữ liệu");

      const result = await response.json();

      // Mapping dữ liệu trả về từ backend
      setShowtimes(result.data);
      setTotalPages(result.meta.total_pages);
      setTotalItems(result.meta.total_items);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterDate]);

  useEffect(() => {
    fetchShowtimes();
  }, [fetchShowtimes]);

  // ==========================================
  // 3. XỬ LÝ THÊM SUẤT CHIẾU (POST)
  // ==========================================
  const handleShowModal = () => {
    // Reset form
    setNewShowtime({ movie_id: "", room_id: "", start_time: "", price: 50000 });
    setModalError("");
    setModalSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewShowtime({ ...newShowtime, [name]: value });
  };

  const handleCreateShowtime = async () => {
    setModalError("");
    setModalSuccess("");

    // Validate
    if (
      !newShowtime.movie_id ||
      !newShowtime.room_id ||
      !newShowtime.start_time ||
      !newShowtime.price
    ) {
      setModalError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/showtime/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newShowtime),
      });

      const data = await response.json();

      if (!response.ok) {
        // Hiển thị lỗi conflict hoặc lỗi khác từ backend
        throw new Error(data.message || "Tạo thất bại");
      }

      setModalSuccess("Tạo suất chiếu thành công!");

      setTimeout(() => {
        handleCloseModal();
        fetchShowtimes(); // Reload danh sách
      }, 1000);
    } catch (error) {
      setModalError(error.message);
    }
  };

  // Format tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format ngày giờ hiển thị
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="manager-container p-3">
      {/* HEADER & TOOLBAR */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold m-0">Quản lý lịch chiếu</h3>
          <small className="text-muted">Tổng số: {totalItems} suất chiếu</small>
        </div>

        <div className="d-flex gap-2">
          {/* Filter theo ngày */}
          <div className="search-box">
            <input
              type="date"
              className="form-control"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Nút thêm mới */}
          <Button
            variant="dark"
            className="btn-add-new"
            onClick={handleShowModal}
          >
            <FaPlus className="me-2" /> Tạo lịch chiếu
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <Table hover className="manager-table align-middle">
          <thead className="bg-light">
            <tr>
              <th>STT</th>
              <th style={{ width: "25%" }}>Phim</th>
              <th>Phòng chiếu</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Giá vé</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : showtimes.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Chưa có suất chiếu nào.
                </td>
              </tr>
            ) : (
              showtimes.map((item, index) => (
                <tr key={item.show_time_id}>
                  <td className="fw-bold text-muted">{index + 1}</td>

                  {/* Thông tin phim */}
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        src={item.poster_url || "https://placehold.co/40x60"}
                        alt=""
                        style={{
                          width: "40px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          marginRight: "10px",
                        }}
                      />
                      <div>
                        <div className="fw-bold text-primary">
                          {item.movie_title}
                        </div>
                        <div className="small text-muted">
                          {item.duration} phút
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Phòng */}
                  <td>
                    <Badge bg="info" text="dark">
                      {item.room_name}
                    </Badge>
                  </td>

                  {/* Thời gian */}
                  <td className="fw-bold text-success">
                    {formatDateTime(item.start_time)}
                  </td>
                  <td className="text-muted">
                    {new Date(item.end_time).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Giá vé */}
                  <td className="fw-bold text-danger">
                    {formatCurrency(item.price)}
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
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages)].map((_, idx) => (
                <Pagination.Item
                  key={idx + 1}
                  active={idx + 1 === currentPage}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </div>

      {/* --- MODAL THÊM SUẤT CHIẾU --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Tạo suất chiếu mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}

          <Form>
            {/* Chọn Phim */}
            <Form.Group className="mb-3">
              <Form.Label>
                Chọn Phim <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="movie_id"
                value={newShowtime.movie_id}
                onChange={handleInputChange}
              >
                <option value="">-- Chọn phim --</option>
                {moviesList.map((movie) => (
                  <option key={movie.movie_id} value={movie.movie_id}>
                    {movie.title} ({movie.duration}p)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Chọn Phòng */}
            <Form.Group className="mb-3">
              <Form.Label>
                Chọn Phòng <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="room_id"
                value={newShowtime.room_id}
                onChange={handleInputChange}
              >
                <option value="">-- Chọn phòng chiếu --</option>
                {roomsList.map((room) => (
                  // Giả sử object room có room_id và name
                  <option key={room.room_id} value={room.room_id}>
                    {room.room_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Thời gian bắt đầu */}
            <Form.Group className="mb-3">
              <Form.Label>
                Thời gian bắt đầu <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="datetime-local"
                name="start_time"
                value={newShowtime.start_time}
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                Thời gian kết thúc sẽ được tự động tính dựa trên thời lượng
                phim.
              </Form.Text>
            </Form.Group>

            {/* Giá vé */}
            <Form.Group className="mb-3">
              <Form.Label>
                Giá vé (VNĐ) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={newShowtime.price}
                onChange={handleInputChange}
                min={0}
                step={1000}
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
            onClick={handleCreateShowtime}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            <FaSave className="me-2" /> Lưu lại
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShowTimeManager;
