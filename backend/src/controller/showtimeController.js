const db = require("../config/db.js");

exports.createShowtime = async (req, res) => {
  try {
    const { movie_id, room_id, booking_time, start_time, price } = req.body;

    if (!movie_id || !room_id || !start_time || !price) {
      return res.status(400).json({
        message: "Vui lòng nhập đủ thông tin (Phim, Phòng, Giờ chiếu, Giá)",
      });
    }

    const [movies] = await db.execute(
      "SELECT duration FROM movie WHERE movie_id = ?",
      [movie_id]
    );

    if (movies.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phim này" });
    }

    const durationMinutes = movies[0].duration;
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

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

exports.getAllShowtimes = async (req, res) => {
  try {
    // 1. Lấy tham số từ URL
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Các tham số lọc
    const movieId = req.query.movie_id; // Lọc theo phim
    const filterDate = req.query.date; // Lọc theo ngày (YYYY-MM-DD)

    // 2. Xây dựng câu Query động
    let whereClause = "1=1"; // Kỹ thuật để nối chuỗi AND dễ dàng
    let params = [];

    // Nếu có lọc theo phim
    if (movieId) {
      whereClause += " AND st.movie_id = ?";
      params.push(movieId);
    }

    // Nếu có lọc theo ngày chiếu (So sánh phần DATE của start_time)
    if (filterDate) {
      whereClause += " AND DATE(st.start_time) = ?";
      params.push(filterDate);
    }

    // 3. Query lấy dữ liệu (JOIN bảng movie và room)
    const sqlData = `
      SELECT 
        st.show_time_id,
        st.start_time,
        st.end_time,
        st.price,
        st.booking_time,
        -- Thông tin phim
        m.title AS movie_title,
        m.poster_url,
        m.duration,
        -- Thông tin phòng
        r.room_name AS room_name,
        r.room_id
      FROM show_time st
      JOIN movie m ON st.movie_id = m.movie_id
      JOIN cinema_room r ON st.room_id = r.room_id
      WHERE ${whereClause}
      ORDER BY st.start_time DESC -- Suất chiếu mới nhất lên đầu
      LIMIT ? OFFSET ?
    `;

    // Query đếm tổng số (để phân trang)
    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM show_time st 
      WHERE ${whereClause}
    `;

    // 4. Thực thi
    const [showtimes] = await db.execute(sqlData, [
      ...params,
      String(limit),
      String(offset),
    ]);
    const [countResult] = await db.execute(sqlCount, params);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 5. Trả về kết quả
    return res.status(200).json({
      message: "Lấy danh sách suất chiếu thành công",
      meta: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        limit: limit,
      },
      data: showtimes,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách suất chiếu:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};
