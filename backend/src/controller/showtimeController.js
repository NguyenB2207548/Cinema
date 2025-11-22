const db = require("../config/db.js");

exports.createShowtime = async (req, res) => {
  try {
    // 1. Lấy dữ liệu đầu vào
    const { movie_id, room_id, booking_time, start_time, price } = req.body;

    // 2. Validate dữ liệu cơ bản
    if (!movie_id || !room_id || !start_time || !price) {
      return res.status(400).json({
        message: "Vui lòng nhập đủ thông tin (Phim, Phòng, Giờ chiếu, Giá)",
      });
    }

    // 3. Lấy thời lượng phim (duration) từ bảng movie để tính end_time
    const [movies] = await db.execute(
      "SELECT duration FROM movie WHERE movie_id = ?",
      [movie_id]
    );

    if (movies.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phim này" });
    }

    const durationMinutes = movies[0].duration;

    // 4. Tính toán thời gian kết thúc (end_time)
    // Chuyển start_time sang đối tượng Date
    const startDate = new Date(start_time);
    // Cộng thêm thời lượng phim (đổi phút sang milliseconds: * 60000)
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    // 5. KIỂM TRA TRÙNG LỊCH (Collision Check) - Bước quan trọng nhất
    // Logic trùng: Một suất chiếu cũ bị coi là trùng nếu:
    // (Giờ bắt đầu cũ < Giờ kết thúc mới) VÀ (Giờ kết thúc cũ > Giờ bắt đầu mới)
    const checkQuery = `
            SELECT show_time_id 
            FROM show_time 
            WHERE room_id = ? 
            AND (start_time < ? AND end_time > ?)
        `;

    const [existingShows] = await db.execute(checkQuery, [
      room_id,
      endDate,
      startDate,
    ]);

    if (existingShows.length > 0) {
      return res.status(409).json({
        message: "Phòng này đang có suất chiếu khác trùng giờ",
        conflict_id: existingShows[0].show_time_id,
      });
    }

    // 6. Nếu không trùng, thực hiện INSERT
    const insertQuery = `
            INSERT INTO show_time (movie_id, room_id, booking_time, start_time, end_time, price)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

    // Lưu ý: booking_time nếu không gửi lên thì mặc định là NOW() hoặc một thời điểm nào đó
    // Ở đây tôi dùng toán tử ?? null như bài trước
    const [result] = await db.execute(insertQuery, [
      movie_id,
      room_id,
      booking_time ?? new Date(), // Mặc định mở bán ngay nếu không nhập
      startDate,
      endDate,
      price,
    ]);

    return res.status(201).json({
      message: "Tạo suất chiếu thành công",
      show_time_id: result.insertId,
      time_details: {
        start: startDate,
        end: endDate,
        duration: durationMinutes,
      },
    });
  } catch (error) {
    console.error("Lỗi tạo suất chiếu:", error);
    return res
      .status(500)
      .json({ message: "Lỗi Server", error: error.message });
  }
};
