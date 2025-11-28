import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Pagination,
  Badge,
  Form,
  Dropdown,
} from "react-bootstrap";
import {
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaTicketAlt,
} from "react-icons/fa";
import "../css/Manager.css";

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Phân trang & Tìm kiếm
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  const itemsPerPage = 10;

  // --- API GET ---
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: query,
      });

      const response = await fetch(
        `http://localhost:3000/api/booking/all?${params}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setBookings(result.data);
        setTotalPages(result.meta.total_pages);
        setTotalItems(result.meta.total_items);
      }
    } catch (error) {
      console.error("Lỗi tải booking:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, query]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // --- API UPDATE STATUS ---

  // --- HELPER ---
  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      setQuery(searchTerm);
      setCurrentPage(1);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return <Badge bg="success">Đã thanh toán</Badge>;
      case "Pending":
        return (
          <Badge bg="success" text="dark">
            Đặt vé thành công
          </Badge>
        );
      case "Cancelled":
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  return (
    <div className="manager-container p-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold m-0">Quản lý đặt vé</h3>
          <small className="text-muted">Tổng số: {totalItems} đơn hàng</small>
        </div>
        <div className="search-box">
          <FaSearch className="search-icon-inside" />
          <input
            type="text"
            placeholder="Tên khách..."
            className="search-input-custom"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchEnter}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <Table hover className="manager-table align-middle">
          <thead className="bg-light">
            <tr>
              <th>STT</th>
              <th>Khách hàng</th>
              <th>Phim / Suất chiếu</th>
              <th>Ghế</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Đang tải...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Chưa có đơn đặt vé nào.
                </td>
              </tr>
            ) : (
              bookings.map((item, index) => (
                <tr key={item.booking_id}>
                  <td className="fw-bold text-muted">{index + 1}</td>
                  <td>
                    <div className="fw-bold">{item.full_name}</div>
                    <div className="small text-muted">{item.email}</div>
                  </td>
                  <td>
                    <div className="text-primary fw-bold">
                      {item.movie_title}
                    </div>
                    <div className="small text-muted">
                      {new Date(item.start_time).toLocaleString("vi-VN")} -{" "}
                      {item.room_name}
                    </div>
                  </td>
                  <td>
                    <Badge bg="info" text="dark">
                      {item.seats}
                    </Badge>
                  </td>
                  <td className="fw-bold text-danger">
                    {formatCurrency(item.total_price)}
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
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
    </div>
  );
};

export default BookingManager;
