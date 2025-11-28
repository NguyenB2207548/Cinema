import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaChair,
  FaTicketAlt,
} from "react-icons/fa";
import "../../assets/css/HistoryBooking.css";

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- GỌI API LẤY LỊCH SỬ ---
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");

      // Nếu chưa đăng nhập -> đá về login
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3000/api/booking/history",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Không thể tải lịch sử đặt vé.");
        }

        const result = await response.json();
        setTickets(result.data || []);
      } catch (err) {
        console.error("Lỗi:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  // --- HELPER FORMAT TIỀN & NGÀY ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", {
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- HELPER HIỂN THỊ TRẠNG THÁI (ĐÃ SỬA) ---
  const getStatusBadge = (status) => {
    switch (status) {
      case "Success":
      case "Paid":
        return <Badge bg="success">Đã thanh toán</Badge>;
      case "Pending":
        // SỬA Ở ĐÂY: Thay "Chờ thanh toán" bằng "Đã đặt vé" và dùng màu xanh (success)
        return <Badge bg="success">Đã đặt vé</Badge>;
      case "Cancelled":
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="my-tickets-page d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="warning" />
      </div>
    );
  }

  return (
    <div className="my-tickets-page pt-4">
      <Container>
        <h3 className="fw-bold mb-4 border-bottom border-secondary pb-2 d-inline-block text-white">
          Vé của tôi
        </h3>

        {error && <Alert variant="danger">{error}</Alert>}

        {tickets.length === 0 && !error ? (
          <div className="text-center py-5">
            <FaTicketAlt size={50} className="text-secondary mb-3" />
            <h5 className="text-white">Bạn chưa đặt vé nào cả.</h5>
            <p className="text-muted">
              Hãy tìm một bộ phim hay và ra rạp thưởng thức ngay nhé!
            </p>
            <Button
              as={Link}
              to="/"
              variant="warning"
              className="fw-bold px-4 mt-2"
            >
              Đặt vé ngay
            </Button>
          </div>
        ) : (
          <Row className="g-4">
            {tickets.map((ticket) => (
              <Col lg={10} xl={9} className="mx-auto" key={ticket.booking_id}>
                <Card className="ticket-card border-0">
                  <Row className="g-0">
                    {/* Cột trái: Poster */}
                    <Col md={3} sm={4}>
                      <img
                        src={
                          ticket.poster_url || "https://placehold.co/300x450"
                        }
                        alt={ticket.movie_title}
                        className="ticket-poster"
                      />
                    </Col>

                    {/* Cột phải: Thông tin */}
                    <Col md={9} sm={8}>
                      <div className="ticket-info">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div
                            className="ticket-movie-title text-truncate"
                            title={ticket.movie_title}
                          >
                            {ticket.movie_title}
                          </div>
                          {getStatusBadge(ticket.status)}
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="ticket-detail-row">
                          <FaCalendarAlt />
                          <span>
                            Ngày đặt: {formatDateTime(ticket.booking_time)}
                          </span>
                        </div>

                        <div className="ticket-detail-row">
                          <FaClock />
                          <span className="text-warning fw-bold">
                            Suất chiếu: {formatDateTime(ticket.start_time)}
                          </span>
                        </div>

                        <div className="ticket-detail-row">
                          <FaMapMarkerAlt />
                          <span>Rạp: {ticket.room_name}</span>
                        </div>

                        <div className="ticket-detail-row">
                          <FaChair />
                          <span>
                            Ghế:{" "}
                            <strong className="text-white fs-5 ms-1">
                              {ticket.seats}
                            </strong>
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-end mt-3 border-top border-secondary pt-3">
                          <div className="text-muted small">
                            Mã đơn: #{ticket.booking_id}
                          </div>
                          <div className="text-end">
                            <small className="text-muted d-block">
                              Tổng tiền
                            </small>
                            <span className="ticket-price text-warning">
                              {formatCurrency(ticket.total_price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default MyTickets;
