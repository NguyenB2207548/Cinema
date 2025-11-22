const db = require("../config/db.js");

/**
 * Hàm trợ giúp: Tạo danh sách các giá trị ghế dựa trên sức chứa.
 * Ví dụ: 12 ghế -> A1, A2, ..., A10, B1, B2
 * @param {number} roomId - ID của phòng vừa được tạo
 * @param {number} capacity - Sức chứa của phòng
 * @returns {Array<string>} - Mảng các chuỗi giá trị (room_id, row, seat_number, type)
 */
function generateSeatValues(roomId, capacity) {
  const seatsPerRow = 10;
  const rows = Math.ceil(capacity / seatsPerRow);
  const seatValues = [];

  const charCodeA = "A".charCodeAt(0);

  for (let i = 0; i < rows; i++) {
    const rowChar = String.fromCharCode(charCodeA + i);
    const seatsInCurrentRow = Math.min(seatsPerRow, capacity - i * seatsPerRow);

    for (let j = 1; j <= seatsInCurrentRow; j++) {
      let seatType = "Standard";
      if (rowChar === "A" && j % 2 === 1) {
        seatType = "VIP";
      }
      seatValues.push([roomId, rowChar, j, seatType]);
    }
  }
  return seatValues;
}

// ADD ROOM AND SEAT
exports.addCinemaRoomAndSeats = async (req, res) => {
  const { room_name, capacity, description } = req.body;

  if (!room_name || !capacity || capacity <= 0) {
    return res.status(400).json({
      message: "Tên phòng và sức chứa hợp lệ là bắt buộc.",
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [roomResult] = await connection.execute(
      "INSERT INTO cinema_room (room_name, capacity, description) VALUES (?, ?, ?)",
      [room_name, capacity, description || null]
    );

    const newRoomId = roomResult.insertId;
    const seatValues = generateSeatValues(newRoomId, capacity);

    if (seatValues.length > 0) {
      const insertSeatQuery =
        "INSERT INTO seat (room_id, row_seat, seat_number, type) VALUES ?";
      await connection.query(insertSeatQuery, [seatValues]);
    }

    await connection.commit();

    connection.release();

    res.status(201).json({
      message: "Thêm phòng và ghế thành công.",
      roomId: newRoomId,
      seatsCount: seatValues.length,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Lỗi khi thêm phòng và ghế:", error);
    res.status(500).json({
      message: "Lỗi máy chủ nội bộ khi thêm phòng.",
    });
  }
};
