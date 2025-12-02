const db = require("../config/db.js");

exports.getAllRooms = async (req, res) => {
  try {
    // Lấy danh sách phòng, sắp xếp theo tên cho dễ tìm
    const [rooms] = await db.execute(
      "SELECT room_id, room_name, capacity, description FROM cinema_room"
    );

    return res.status(200).json({
      message: "Lấy danh sách phòng thành công",
      data: rooms,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

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

exports.updateCinemaRoom = async (req, res) => {
  const { id } = req.params;
  const { room_name, capacity, description } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Thiếu room_id." });
  }

  if (!room_name || !capacity || capacity <= 0) {
    return res.status(400).json({
      message: "Tên phòng và sức chứa hợp lệ là bắt buộc.",
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Kiểm tra phòng có tồn tại không
    const [check] = await connection.execute(
      "SELECT capacity FROM cinema_room WHERE room_id = ?",
      [id]
    );
    if (check.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: "Không tìm thấy phòng để sửa." });
    }

    // Cảnh báo: Nếu sức chứa mới khác sức chứa cũ, đây là thay đổi lớn.
    // Trong môi trường thực tế, nếu capacity thay đổi, bạn cần xóa ghế cũ và generate ghế mới
    // (Đây là một logic phức tạp, trong ví dụ này tôi chỉ cho phép cập nhật metadata và tên)
    if (check[0].capacity !== parseInt(capacity)) {
      // Trường hợp phức tạp: Xử lý thay đổi ghế
      // Để đơn giản, ta sẽ chỉ cho phép sửa nếu capacity không thay đổi.
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message:
          "Không thể thay đổi sức chứa phòng sau khi tạo. Vui lòng tạo phòng mới.",
      });
    }

    // 2. Cập nhật thông tin phòng
    const updateQuery = `
            UPDATE cinema_room 
            SET room_name = ?, 
                capacity = ?, 
                description = ? 
            WHERE room_id = ?
        `;

    await connection.execute(updateQuery, [
      room_name,
      capacity,
      description || null,
      id,
    ]);

    await connection.commit();
    connection.release();

    return res.status(200).json({
      message: "Cập nhật thông tin phòng thành công.",
      roomId: id,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Lỗi khi cập nhật phòng:", error);
    return res.status(500).json({
      message: "Lỗi máy chủ nội bộ khi cập nhật phòng.",
    });
  }
};

exports.deleteCinemaRoom = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Thiếu room_id." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Kiểm tra phòng có tồn tại không
    const [check] = await connection.execute(
      "SELECT room_id FROM cinema_room WHERE room_id = ?",
      [id]
    );
    if (check.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: "Không tìm thấy phòng để xóa." });
    }

    // 2. Xóa các ghế liên quan trước
    // (Giả sử Foreign Key trong bảng `seat` có CASCADE, nếu không có, lệnh DELETE này là cần thiết)
    await connection.execute("DELETE FROM seat WHERE room_id = ?", [id]);

    // 3. Xóa chính phòng chiếu
    const [result] = await connection.execute(
      "DELETE FROM cinema_room WHERE room_id = ?",
      [id]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({
      message: "Xóa phòng và tất cả ghế liên quan thành công.",
      roomId: id,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }

    console.error("Lỗi khi xóa phòng:", error);

    // Xử lý lỗi khóa ngoại (Foreign Key Constraint Violation)
    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(409).json({
        message:
          "Không thể xóa phòng này vì đang có các suất chiếu (showtimes) liên quan. Vui lòng xóa lịch chiếu trước.",
        error_code: error.code,
      });
    }

    return res.status(500).json({
      message: "Lỗi máy chủ nội bộ khi xóa phòng.",
    });
  }
};
