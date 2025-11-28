import React, { useEffect, useState } from "react";
import { Container, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../../assets/css/Booking.css";

const BookingPage = () => {
  const { id } = useParams(); // id này là show_time_id
  const navigate = useNavigate();

  // --- STATE ---
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showInfo, setShowInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // --- 1. LẤY USER_ID TỪ TOKEN ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.user_id || decoded.id);
      } catch (error) {
        console.error("Token lỗi", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // --- 2. LẤY SƠ ĐỒ GHẾ ---
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/api/seat/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Lỗi tải dữ liệu");

        const data = await res.json();
        setSeats(data.seats);
        setShowInfo(data.showInfo);
      } catch (error) {
        console.error(error);
        alert("Không thể tải sơ đồ ghế.");
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [id]);

  // --- 3. XỬ LÝ CHỌN GHẾ ---
  const handleSelectSeat = (seat) => {
    if (seat.is_booked) return;

    if (selectedSeats.includes(seat.seat_id)) {
      setSelectedSeats((prev) => prev.filter((sid) => sid !== seat.seat_id));
    } else {
      if (selectedSeats.length >= 8) {
        return alert("Bạn chỉ được chọn tối đa 8 ghế.");
      }
      setSelectedSeats((prev) => [...prev, seat.seat_id]);
    }
  };

  // --- 4. XỬ LÝ ĐẶT VÉ (SỬA LẠI ĐIỀU HƯỚNG) ---
  const handleBooking = async () => {
    if (selectedSeats.length === 0) return alert("Vui lòng chọn ghế!");
    if (!userId) return alert("Vui lòng đăng nhập lại.");

    if (!window.confirm(`Xác nhận đặt ${selectedSeats.length} vé?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/booking/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          show_time_id: id,
          seat_ids: selectedSeats,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- THAY ĐỔI Ở ĐÂY ---
        alert(`Đặt vé thành công!`);
        navigate("/"); // Chuyển hướng về Trang chủ
      } else if (response.status === 409) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(data.message || "Đặt vé thất bại");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server");
    }
  };

  // --- RENDER DANH SÁCH GHẾ ---
  const renderSeats = () => {
    const rows = [...new Set(seats.map((s) => s.row_seat))];
    return rows.map((row) => (
      <div
        key={row}
        className="seat-row d-flex justify-content-center gap-2 mb-2"
      >
        <span
          className="text-white d-flex align-items-center fw-bold justify-content-center"
          style={{ width: "25px" }}
        >
          {row}
        </span>
        {seats
          .filter((s) => s.row_seat === row)
          .map((seat) => {
            const isSelected = selectedSeats.includes(seat.seat_id);
            let seatClass = "seat-item";
            if (seat.is_booked) seatClass += " booked";
            else if (isSelected) seatClass += " selected";
            if (seat.type === "VIP") seatClass += " vip";

            return (
              <div
                key={seat.seat_id}
                className={seatClass}
                onClick={() => handleSelectSeat(seat)}
                title={`Ghế ${row}${seat.seat_number}`}
              >
                {seat.is_booked ? "" : seat.seat_number}
              </div>
            );
          })}
      </div>
    ));
  };

  // Tính tổng tiền (Sử dụng fallback để tránh lỗi 0đ)
  const pricePerTicket = showInfo?.base_price || showInfo?.price || 0;
  const totalPrice = selectedSeats.length * Number(pricePerTicket);

  if (loading)
    return (
      <div className="text-white text-center pt-5">Đang tải sơ đồ ghế...</div>
    );

  return (
    <div className="booking-page pt-4">
      <Container>
        {/* INFO */}
        <div className="text-center mb-4">
          <h4 className="text-warning mb-1 fw-bold text-uppercase">
            {showInfo?.movie_title}
          </h4>
          <p className=" mb-0 text-white">{showInfo?.room_name}</p>
        </div>

        {/* SCREEN */}
        <div className="screen-container">
          <div className="screen"></div>
        </div>
        <p className="text-center text-white small mb-5">Màn hình</p>

        {/* SEATS GRID */}
        <div className="seats-grid mb-5">{renderSeats()}</div>

        {/* NOTE */}
        <div className="d-flex justify-content-center gap-4 mb-5 text-white small">
          <div className="d-flex align-items-center">
            <div className="seat-item me-2" style={{ cursor: "default" }}></div>{" "}
            Trống
          </div>
          <div className="d-flex align-items-center">
            <div
              className="seat-item selected me-2"
              style={{ cursor: "default" }}
            ></div>{" "}
            Đang chọn
          </div>
          <div className="d-flex align-items-center">
            <div
              className="seat-item booked me-2"
              style={{ cursor: "default" }}
            ></div>{" "}
            Đã đặt
          </div>
        </div>
      </Container>

      {/* FOOTER BAR */}
      <div className="booking-summary-bar">
        <div>
          <div className="text-white small">Ghế chọn:</div>
          <div className="fw-bold text-warning fs-5">
            {selectedSeats.length > 0
              ? seats
                  .filter((s) => selectedSeats.includes(s.seat_id))
                  .map((s) => `${s.row_seat}${s.seat_number}`)
                  .join(", ")
              : "..."}
          </div>
        </div>

        <div className="d-flex align-items-center gap-4">
          <div className="text-end">
            <div className="text-white small">Tạm tính:</div>
            <div className="fw-bold fs-3 text-white">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(totalPrice)}
            </div>
          </div>
          <Button
            className="btn-booking py-2 px-4 fw-bold"
            size="lg"
            style={{
              backgroundColor: "#cca340",
              border: "none",
              color: "#fff",
            }}
            onClick={handleBooking}
            disabled={selectedSeats.length === 0}
          >
            Đặt vé ngay
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
