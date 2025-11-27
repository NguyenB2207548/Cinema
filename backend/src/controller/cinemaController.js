const db = require("../config/db.js");

// GET ALL MOVIE
exports.getAllMovies = async (req, res) => {
  try {
    // 1. Lấy tham số
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || ""; // <--- Lấy từ khóa tìm kiếm
    const offset = (page - 1) * limit;

    // 2. Chuẩn bị điều kiện WHERE động
    // Mặc định luôn phải có is_deleted = FALSE
    let whereClause = "m.is_deleted = FALSE";
    let queryParams = [];

    // Nếu có từ khóa tìm kiếm, nối thêm điều kiện vào chuỗi SQL
    if (search) {
      whereClause += " AND m.title LIKE ?";
      queryParams.push(`%${search}%`);
    }

    // 3. Query lấy danh sách phim (Main Query)
    const sqlData = `
            SELECT 
                m.movie_id, 
                m.title, 
                m.duration, 
                m.release_date, 
                m.poster_url,
                m.description,
                GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') AS genres,
                GROUP_CONCAT(DISTINCT d.fullname SEPARATOR ', ') AS directors
            FROM movie m
            LEFT JOIN movie_genre mg ON m.movie_id = mg.movie_id
            LEFT JOIN genre g ON mg.genre_id = g.genre_id
            LEFT JOIN movie_director md ON m.movie_id = md.movie_id
            LEFT JOIN director d ON md.director_id = d.director_id
            WHERE ${whereClause}  -- <--- Chèn điều kiện động vào đây
            GROUP BY m.movie_id
            ORDER BY m.release_date DESC
            LIMIT ? OFFSET ?
        `;

    // Gộp params tìm kiếm + params phân trang (limit, offset)
    const dataParams = [...queryParams, limit.toString(), offset.toString()];

    const [movies] = await db.execute(sqlData, dataParams);

    // 4. Query đếm tổng số phim (Count Query)
    // Cần đếm dựa trên cùng điều kiện tìm kiếm để phân trang đúng
    const sqlCount = `SELECT COUNT(*) as total FROM movie m WHERE ${whereClause}`;

    // Query count chỉ cần params tìm kiếm, không cần limit/offset
    const [countResult] = await db.execute(sqlCount, queryParams);

    const totalMovies = countResult[0].total;
    const totalPages = Math.ceil(totalMovies / limit);

    // 5. Trả về kết quả
    return res.status(200).json({
      message: "Lấy danh sách phim thành công",
      meta: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalMovies,
        limit: limit,
      },
      data: movies,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách phim:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

// GET DETAIL MOVIE BY ID
exports.getMovieDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
            SELECT 
                m.*,
                GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') AS genres,
                GROUP_CONCAT(DISTINCT a.fullname SEPARATOR ', ') AS actors,
                GROUP_CONCAT(DISTINCT d.fullname SEPARATOR ', ') AS directors
            FROM movie m
            LEFT JOIN movie_genre mg ON m.movie_id = mg.movie_id
            LEFT JOIN genre g ON mg.genre_id = g.genre_id
            LEFT JOIN movie_actor ma ON m.movie_id = ma.movie_id
            LEFT JOIN actor a ON ma.actor_id = a.actor_id
            LEFT JOIN movie_director md ON m.movie_id = md.movie_id
            LEFT JOIN director d ON md.director_id = d.director_id
            WHERE m.movie_id = ? AND m.is_deleted = FALSE
            GROUP BY m.movie_id
        `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    }

    // Lấy thêm các suất chiếu sắp tới của phim này (Optional)
    const showtimeQuery = `
            SELECT show_time_id, start_time, price, room_id 
            FROM show_time 
            WHERE movie_id = ? AND start_time > NOW() 
            ORDER BY start_time ASC
        `;
    const [showtimes] = await db.execute(showtimeQuery, [id]);

    // Gộp dữ liệu lại
    const movieData = rows[0];
    movieData.showtimes = showtimes; // Đính kèm lịch chiếu vào object phim

    return res.status(200).json({
      message: "Lấy chi tiết phim thành công",
      data: movieData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

// ADD MOVIE
exports.createMovie = async (req, res) => {
  // 1. Lấy dữ liệu từ body request
  const {
    title,
    description,
    duration,
    release_date,
    poster_url,
    external_ai_id,
    genre_ids, // Mảng chứa ID thể loại: [1, 2]
    actor_ids, // Mảng chứa ID diễn viên: [1, 2, 3]
    director_ids, // Mảng chứa ID đạo diễn: [1]
  } = req.body;

  // Validate cơ bản
  if (!title) {
    return res.status(400).json({ message: "Tên phim là bắt buộc" });
  }

  // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
  // (Nếu thêm phim thành công mà thêm diễn viên lỗi thì phải hoàn tác tất cả)
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // ---------------------------------------------------------
    // BƯỚC 1: Insert vào bảng movie
    // ---------------------------------------------------------
    const movieQuery = `
            INSERT INTO movie (title, description, duration, release_date, poster_url, external_ai_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

    const [result] = await connection.execute(movieQuery, [
      title,
      description,
      duration,
      release_date,
      poster_url,
      external_ai_id,
    ]);

    const newMovieId = result.insertId; // Lấy ID của phim vừa tạo

    // ---------------------------------------------------------
    // BƯỚC 2: Insert vào các bảng liên kết (Nếu có dữ liệu gửi lên)
    // ---------------------------------------------------------

    // a. Thêm Thể loại (movie_genre)
    if (genre_ids && genre_ids.length > 0) {
      const genreValues = genre_ids.map((genreId) => [newMovieId, genreId]);
      // Cú pháp bulk insert: INSERT INTO ... VALUES (1,1), (1,2)
      await connection.query(
        "INSERT INTO movie_genre (movie_id, genre_id) VALUES ?",
        [genreValues]
      );
    }

    // b. Thêm Diễn viên (movie_actor)
    if (actor_ids && actor_ids.length > 0) {
      const actorValues = actor_ids.map((actorId) => [newMovieId, actorId]);
      await connection.query(
        "INSERT INTO movie_actor (movie_id, actor_id) VALUES ?",
        [actorValues]
      );
    }

    // c. Thêm Đạo diễn (movie_director)
    if (director_ids && director_ids.length > 0) {
      const directorValues = director_ids.map((directorId) => [
        newMovieId,
        directorId,
      ]);
      await connection.query(
        "INSERT INTO movie_director (movie_id, director_id) VALUES ?",
        [directorValues]
      );
    }

    // ---------------------------------------------------------
    // BƯỚC 3: Commit transaction (Lưu chính thức)
    // ---------------------------------------------------------
    await connection.commit();

    return res.status(201).json({
      message: "Thêm phim thành công",
      movie_id: newMovieId,
    });
  } catch (error) {
    // Nếu có lỗi, rollback (hoàn tác) lại mọi thứ
    await connection.rollback();
    console.error("Lỗi thêm phim:", error);
    return res.status(500).json({
      message: "Lỗi Server khi thêm phim",
      error: error.message,
    });
  } finally {
    // Giải phóng connection về pool
    connection.release();
  }
};

// TÌM KIẾM PHIM
exports.filterMovies = async (req, res) => {
  try {
    const { title, genre_id, actor_id, director_id } = req.query;

    let sql = `SELECT DISTINCT m.* FROM movie m`;
    let params = [];
    let whereConditions = [];

    if (genre_id) {
      sql += ` JOIN movie_genre mg ON m.movie_id = mg.movie_id`;
      whereConditions.push(`mg.genre_id = ?`);
      params.push(genre_id);
    }

    // --- Lọc theo Diễn Viên ---
    if (actor_id) {
      sql += ` JOIN movie_actor ma ON m.movie_id = ma.movie_id`;
      whereConditions.push(`ma.actor_id = ?`);
      params.push(actor_id);
    }

    // --- Lọc theo Đạo Diễn ---
    if (director_id) {
      sql += ` JOIN movie_director md ON m.movie_id = md.movie_id`;
      whereConditions.push(`md.director_id = ?`);
      params.push(director_id);
    }

    // --- Tìm kiếm theo Tên Phim ---
    if (title) {
      whereConditions.push(`m.title LIKE ?`);
      params.push(`%${title}%`);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ` + whereConditions.join(" AND ");
    }

    sql += ` ORDER BY m.release_date DESC`;

    const [movies] = await db.execute(sql, params);

    return res.status(200).json({
      message: "Lọc phim thành công",
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    console.error("Lỗi lọc phim:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

// UPDATE MOVIE
exports.updateMovie = async (req, res) => {
  const { id } = req.params; // Lấy movie_id từ URL
  const {
    title,
    description,
    duration,
    release_date,
    poster_url,
    external_ai_id,
    genre_ids, // Mảng ID mới (VD: [1, 3])
    actor_ids, // Mảng ID mới
    director_ids, // Mảng ID mới
  } = req.body;

  // Validate ID
  if (!id) {
    return res.status(400).json({ message: "Thiếu movie_id" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // ---------------------------------------------------------
    // BƯỚC 1: Kiểm tra phim có tồn tại không
    // ---------------------------------------------------------
    const [check] = await connection.execute(
      "SELECT movie_id FROM movie WHERE movie_id = ?",
      [id]
    );
    if (check.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy phim để sửa" });
    }

    // ---------------------------------------------------------
    // BƯỚC 2: Cập nhật thông tin bảng MOVIE
    // ---------------------------------------------------------
    // Chỉ cập nhật các trường có gửi lên. Nếu gửi undefined thì giữ nguyên giá trị cũ
    // Lưu ý: Logic dưới đây giả định Frontend gửi đầy đủ thông tin cần sửa.
    // Nếu muốn update từng phần (PATCH), cần viết query động (Dynamic SQL).

    const updateQuery = `
            UPDATE movie 
            SET 
                title = COALESCE(?, title), 
                description = COALESCE(?, description), 
                duration = COALESCE(?, duration), 
                release_date = COALESCE(?, release_date), 
                poster_url = COALESCE(?, poster_url), 
                external_ai_id = COALESCE(?, external_ai_id)
            WHERE movie_id = ?
        `;

    // COALESCE(A, B): Nếu A không null thì lấy A, nếu A null thì lấy B (giữ nguyên cái cũ)
    await connection.execute(updateQuery, [
      title ?? null,
      description ?? null,
      duration ?? null,
      release_date ?? null,
      poster_url ?? null,
      external_ai_id ?? null,
      id,
    ]);

    // ---------------------------------------------------------
    // BƯỚC 3: Cập nhật THỂ LOẠI (Nếu có gửi mảng genre_ids)
    // ---------------------------------------------------------
    if (Array.isArray(genre_ids)) {
      // a. Xóa hết liên kết cũ
      await connection.execute("DELETE FROM movie_genre WHERE movie_id = ?", [
        id,
      ]);

      // b. Thêm liên kết mới (nếu mảng không rỗng)
      if (genre_ids.length > 0) {
        const genreValues = genre_ids.map((gId) => [id, gId]);
        await connection.query(
          "INSERT INTO movie_genre (movie_id, genre_id) VALUES ?",
          [genreValues]
        );
      }
    }

    // ---------------------------------------------------------
    // BƯỚC 4: Cập nhật DIỄN VIÊN (Nếu có gửi mảng actor_ids)
    // ---------------------------------------------------------
    if (Array.isArray(actor_ids)) {
      await connection.execute("DELETE FROM movie_actor WHERE movie_id = ?", [
        id,
      ]);

      if (actor_ids.length > 0) {
        const actorValues = actor_ids.map((aId) => [id, aId]);
        await connection.query(
          "INSERT INTO movie_actor (movie_id, actor_id) VALUES ?",
          [actorValues]
        );
      }
    }

    // ---------------------------------------------------------
    // BƯỚC 5: Cập nhật ĐẠO DIỄN (Nếu có gửi mảng director_ids)
    // ---------------------------------------------------------
    if (Array.isArray(director_ids)) {
      await connection.execute(
        "DELETE FROM movie_director WHERE movie_id = ?",
        [id]
      );

      if (director_ids.length > 0) {
        const directorValues = director_ids.map((dId) => [id, dId]);
        await connection.query(
          "INSERT INTO movie_director (movie_id, director_id) VALUES ?",
          [directorValues]
        );
      }
    }

    await connection.commit();

    return res.status(200).json({
      message: "Cập nhật phim thành công",
      movie_id: id,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi update phim:", error);
    return res.status(500).json({ message: "Lỗi Server khi cập nhật phim" });
  } finally {
    connection.release();
  }
};

// DELETE MOVIE
exports.deleteMovie = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ message: "Vui lòng cung cấp ID phim cần xóa" });
  }

  const connection = await db.getConnection();

  try {
    // 1. Kiểm tra xem phim có tồn tại và chưa bị xóa không
    const [check] = await connection.execute(
      "SELECT title FROM movie WHERE movie_id = ? AND is_deleted = FALSE",
      [id]
    );

    if (check.length === 0) {
      return res
        .status(404)
        .json({ message: "Phim không tồn tại hoặc đã bị xóa trước đó." });
    }

    // 2. Thực hiện XÓA MỀM (Soft Delete)
    // Chỉ cần cập nhật cờ is_deleted thành TRUE (1)
    const updateQuery = "UPDATE movie SET is_deleted = TRUE WHERE movie_id = ?";

    await connection.execute(updateQuery, [id]);

    // (Tuỳ chọn) Bạn có thể muốn hủy các suất chiếu tương lai của phim này
    // UPDATE show_time SET status = 'Cancelled' WHERE movie_id = ? AND start_time > NOW()

    return res.status(200).json({
      message: `Đã xóa phim '${check[0].title}' thành công.`,
    });
  } catch (error) {
    console.error("Lỗi xóa mềm phim:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  } finally {
    connection.release();
  }
};

exports.restoreMovie = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("UPDATE movie SET is_deleted = FALSE WHERE movie_id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Khôi phục phim thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
