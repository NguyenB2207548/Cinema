const db = require("../config/db.js");

exports.createBooking = async (req, res) => {
  const { user_id, show_time_id, seat_ids } = req.body;
  // seat_ids là mảng: [10, 11, 12]

  // 1. Validate
  if (
    !user_id ||
    !show_time_id ||
    !seat_ids ||
    !Array.isArray(seat_ids) ||
    seat_ids.length === 0
  ) {
    return res.status(400).json({ message: "Thông tin đặt vé không hợp lệ." });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // ---------------------------------------------------------
    // BƯỚC 1: Lấy giá vé từ ShowTime để tính tổng tiền
    // ---------------------------------------------------------
    const [shows] = await connection.execute(
      "SELECT price FROM show_time WHERE show_time_id = ?",
      [show_time_id]
    );

    if (shows.length === 0) {
      throw new Error("SHOW_NOT_FOUND"); // Ném lỗi để nhảy xuống catch
    }

    const ticketPrice = parseFloat(shows[0].price);
    const totalPrice = ticketPrice * seat_ids.length;

    // ---------------------------------------------------------
    // BƯỚC 2: Tạo Booking (Đơn hàng)
    // ---------------------------------------------------------
    const bookingQuery = `
            INSERT INTO booking (user_id, show_time_id, total_price, status)
            VALUES (?, ?, ?, 'Pending')
        `;

    const [bookingResult] = await connection.execute(bookingQuery, [
      user_id,
      show_time_id,
      totalPrice,
    ]);

    const newBookingId = bookingResult.insertId;

    // ---------------------------------------------------------
    // BƯỚC 3: Tạo chi tiết Ticket (Vé)
    // ---------------------------------------------------------
    // Chuẩn bị mảng 2 chiều: [[booking_id, show_time_id, seat_id, price], ...]
    const ticketValues = seat_ids.map((seatId) => [
      newBookingId,
      show_time_id,
      seatId,
      ticketPrice,
    ]);

    const ticketQuery = `
            INSERT INTO ticket (booking_id, show_time_id, seat_id, price)
            VALUES ?
        `;

    // Insert nhiều dòng cùng lúc
    await connection.query(ticketQuery, [ticketValues]);

    // ---------------------------------------------------------
    // BƯỚC 4: Hoàn tất
    // ---------------------------------------------------------
    await connection.commit();

    return res.status(201).json({
      message: "Đặt vé thành công",
      booking_id: newBookingId,
      total_price: totalPrice,
      seats: seat_ids,
      status: "Pending", // Chờ thanh toán
    });
  } catch (error) {
    await connection.rollback(); // Hủy toàn bộ nếu có lỗi

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "Ghế bạn chọn vừa có người khác đặt mất rồi! Vui lòng chọn lại.",
      });
    }

    if (error.message === "SHOW_NOT_FOUND") {
      return res.status(404).json({ message: "Suất chiếu không tồn tại" });
    }

    console.error("Booking Error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đặt vé" });
  } finally {
    connection.release();
  }
};

// XEM LỊCH SỬ ĐẶT VÉ
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const query = `
            SELECT 
                b.booking_id,
                b.booking_time,
                b.total_price,
                b.status,
                m.title AS movie_title,
                m.poster_url,
                r.room_name,
                st.start_time,
                -- Gộp các ghế lại thành chuỗi. Ví dụ: "A1, A2"
                GROUP_CONCAT(CONCAT(s.row_seat, s.seat_number) SEPARATOR ', ') AS seats
            FROM booking b
            JOIN show_time st ON b.show_time_id = st.show_time_id
            JOIN movie m ON st.movie_id = m.movie_id
            JOIN cinema_room r ON st.room_id = r.room_id
            JOIN ticket t ON b.booking_id = t.booking_id
            JOIN seat s ON t.seat_id = s.seat_id
            WHERE b.user_id = ?
            GROUP BY b.booking_id
            ORDER BY b.booking_time DESC; -- Đơn mới nhất lên đầu
        `;

    const [history] = await db.execute(query, [userId]);

    return res.status(200).json({
      message: "Lấy lịch sử đặt vé thành công",
      data: history,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};
