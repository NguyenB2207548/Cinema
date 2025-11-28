const db = require("../config/db.js");

// --- API 1: Lấy danh sách ghế theo Phòng (Dùng cho Admin xem cấu trúc) ---
exports.getSeatsByRoom = async (req, res) => {
  const { roomId } = req.params;

  try {
    const [seats] = await db.execute(
      "SELECT * FROM seat WHERE room_id = ? ORDER BY row_seat, seat_number",
      [roomId]
    );

    if (seats.length === 0) {
      return res
        .status(404)
        .json({ message: "Phòng này chưa có ghế hoặc không tồn tại." });
    }

    res.status(200).json({
      message: "Lấy danh sách ghế thành công",
      data: seats,
    });
  } catch (error) {
    console.error("Lỗi lấy ghế theo phòng:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// --- API 2: Lấy Sơ đồ ghế theo Suất chiếu (Dùng cho User đặt vé) ---
// API này quan trọng: Nó sẽ join với bảng 'ticket' để biết ghế nào đã được đặt.
exports.getSeatsByShowtime = async (req, res) => {
  const { show_time_id } = req.params;

  try {
    // 1. Lấy thông tin cơ bản của suất chiếu (Phim, Phòng, Giá vé gốc)
    const [showInfo] = await db.execute(
      `
      SELECT 
        st.show_time_id,
        st.price as base_price,
        m.title as movie_title,
        cr.room_name,
        cr.room_id
      FROM show_time st
      JOIN movie m ON st.movie_id = m.movie_id
      JOIN cinema_room cr ON st.room_id = cr.room_id
      WHERE st.show_time_id = ?
    `,
      [show_time_id]
    );

    if (showInfo.length === 0) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại" });
    }

    const currentShow = showInfo[0];

    // 2. Lấy danh sách ghế + Trạng thái đã đặt (is_booked)
    // Logic:
    // - Lấy tất cả ghế thuộc phòng của suất chiếu đó.
    // - LEFT JOIN với bảng 'ticket': Nếu tìm thấy vé khớp (seat_id + show_time_id) -> is_booked = true
    const query = `
      SELECT 
        s.seat_id,
        s.row_seat,
        s.seat_number,
        s.type, -- Standard / VIP
        CASE 
          WHEN t.ticket_id IS NOT NULL THEN 1 
          ELSE 0 
        END AS is_booked
      FROM seat s
      JOIN show_time st ON s.room_id = st.room_id
      LEFT JOIN ticket t ON s.seat_id = t.seat_id AND t.show_time_id = st.show_time_id
      WHERE st.show_time_id = ?
      ORDER BY s.row_seat ASC, s.seat_number ASC
    `;

    const [seats] = await db.execute(query, [show_time_id]);

    // 3. Trả về kết quả
    return res.status(200).json({
      message: "Lấy sơ đồ ghế thành công",
      showInfo: currentShow,
      seats: seats,
    });
  } catch (error) {
    console.error("Lỗi lấy sơ đồ ghế:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};
