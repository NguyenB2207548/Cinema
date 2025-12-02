const db = require("../config/db.js");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
// GET ALL MOVIE
exports.getAllMovies = async (req, res) => {
  try {
    // 1. Lấy tham số
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Các tham số lọc
    const search = req.query.search || "";
    const genreId = req.query.genre_id;
    const actorId = req.query.actor_id; // <--- Mới
    const directorId = req.query.director_id; // <--- Mới

    // 2. Khởi tạo câu lệnh SQL
    // Mình đã bổ sung thêm JOIN bảng actor để hiển thị tên diễn viên trong kết quả
    let sqlData = `
            SELECT 
                m.movie_id, 
                m.title, 
                m.duration, 
                m.release_date, 
                m.poster_url,
                m.description,
                GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') AS genres,
                GROUP_CONCAT(DISTINCT d.fullname SEPARATOR ', ') AS directors,
                GROUP_CONCAT(DISTINCT a.fullname SEPARATOR ', ') AS actors
            FROM movie m
            LEFT JOIN movie_genre mg ON m.movie_id = mg.movie_id
            LEFT JOIN genre g ON mg.genre_id = g.genre_id
            LEFT JOIN movie_director md ON m.movie_id = md.movie_id
            LEFT JOIN director d ON md.director_id = d.director_id
            LEFT JOIN movie_actor ma ON m.movie_id = ma.movie_id
            LEFT JOIN actor a ON ma.actor_id = a.actor_id
    `;

    // 3. Xử lý điều kiện lọc (Dynamic WHERE)
    let whereConditions = ["m.is_deleted = FALSE"];
    let queryParams = [];

    // --- Lọc theo Tên phim ---
    if (search) {
      whereConditions.push("m.title LIKE ?");
      queryParams.push(`%${search}%`);
    }

    // --- Lọc theo Thể loại ---
    if (genreId) {
      // Tìm các phim có ID nằm trong danh sách phim thuộc thể loại này
      whereConditions.push(
        "m.movie_id IN (SELECT movie_id FROM movie_genre WHERE genre_id = ?)"
      );
      queryParams.push(genreId);
    }

    // --- Lọc theo Diễn viên (MỚI) ---
    if (actorId) {
      whereConditions.push(
        "m.movie_id IN (SELECT movie_id FROM movie_actor WHERE actor_id = ?)"
      );
      queryParams.push(actorId);
    }

    // --- Lọc theo Đạo diễn (MỚI) ---
    if (directorId) {
      whereConditions.push(
        "m.movie_id IN (SELECT movie_id FROM movie_director WHERE director_id = ?)"
      );
      queryParams.push(directorId);
    }

    // Gộp điều kiện WHERE
    if (whereConditions.length > 0) {
      sqlData += " WHERE " + whereConditions.join(" AND ");
    }

    // Group by & Order & Limit
    sqlData += ` GROUP BY m.movie_id ORDER BY m.release_date DESC LIMIT ? OFFSET ?`;

    // Thêm tham số cho limit và offset
    queryParams.push(limit.toString(), offset.toString());

    // 4. Thực thi query lấy dữ liệu
    const [movies] = await db.execute(sqlData, queryParams);

    // 5. Query đếm tổng (Dùng cho phân trang)
    // Cần copy nguyên logic WHERE để đếm đúng số lượng sau khi lọc
    let sqlCount = "SELECT COUNT(*) as total FROM movie m";

    // Lấy params cho count (bỏ limit và offset ở cuối mảng queryParams ra)
    let countParams = queryParams.slice(0, -2);

    if (whereConditions.length > 0) {
      sqlCount += " WHERE " + whereConditions.join(" AND ");
    }

    const [countResult] = await db.execute(sqlCount, countParams);
    const totalMovies = countResult[0].total;
    const totalPages = Math.ceil(totalMovies / limit);

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
    // 1. Lấy thông tin chi tiết phim (Giữ nguyên)
    const movieQuery = `
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

    const [rows] = await db.execute(movieQuery, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    }

    // 2. Lấy lịch chiếu KÈM THEO TÊN PHÒNG (Updated)
    // Giả sử bảng phòng của bạn tên là 'cinema_room' và cột tên là 'room_name'
    // Nếu bảng tên là 'room' và cột là 'name', hãy sửa lại tương ứng nhé.
    const showtimeQuery = `
            SELECT 
                st.show_time_id, 
                st.start_time, 
                st.price, 
                st.room_id,
                r.room_name  -- <--- Lấy thêm tên phòng
            FROM show_time st
            JOIN cinema_room r ON st.room_id = r.room_id -- <--- JOIN bảng phòng
            WHERE st.movie_id = ? AND st.start_time > NOW() 
            ORDER BY st.start_time ASC
        `;

    const [showtimes] = await db.execute(showtimeQuery, [id]);

    // 3. Gộp dữ liệu lại
    const movieData = rows[0];
    movieData.showtimes = showtimes; // Mảng showtimes bây giờ đã có room_name

    return res.status(200).json({
      message: "Lấy chi tiết phim thành công",
      data: movieData,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết phim:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

// ADD MOVIE
exports.createMovie = async (req, res) => {
  // 1. Kiểm tra file upload
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng upload ảnh poster" });
  }

  // Tạo URL cho poster (Lưu đường dẫn tương đối để frontend dễ gọi)
  // Ví dụ: /uploads/17000000-poster.jpg
  const poster_url = `/uploads/${req.file.filename}`;
  const posterPathForAI = req.file.path; // Đường dẫn tuyệt đối để gửi sang Flask

  // 2. Lấy dữ liệu từ body (FormData biến mọi thứ thành string hoặc array string)
  const {
    title,
    description,
    duration,
    release_date,
    // genre_ids, actor_ids, director_ids sẽ cần xử lý kỹ
  } = req.body;

  // Hàm hỗ trợ parse mảng ID từ FormData (vì có thể là string, mảng hoặc null)
  const parseIdArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data; // Nếu đã là mảng
    return [data]; // Nếu là 1 số lẻ (string) thì đưa vào mảng
  };

  const genre_ids = parseIdArray(req.body.genre_ids);
  const actor_ids = parseIdArray(req.body.actor_ids);
  const director_ids = parseIdArray(req.body.director_ids);

  // Validate cơ bản
  if (!title) {
    return res.status(400).json({ message: "Tên phim là bắt buộc" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // ---------------------------------------------------------
    // BƯỚC 1: Insert vào bảng movie (Bỏ external_ai_id)
    // ---------------------------------------------------------
    const movieQuery = `
      INSERT INTO movie (title, description, duration, release_date, poster_url)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(movieQuery, [
      title,
      description,
      duration,
      release_date,
      poster_url, // Lưu đường dẫn ảnh vào DB
    ]);

    const newMovieId = result.insertId;

    // ---------------------------------------------------------
    // BƯỚC 2: Insert vào các bảng liên kết
    // ---------------------------------------------------------

    // a. Thêm Thể loại
    if (genre_ids.length > 0) {
      const genreValues = genre_ids.map((id) => [newMovieId, id]);
      await connection.query(
        "INSERT INTO movie_genre (movie_id, genre_id) VALUES ?",
        [genreValues]
      );
    }

    // b. Thêm Diễn viên
    if (actor_ids.length > 0) {
      const actorValues = actor_ids.map((id) => [newMovieId, id]);
      await connection.query(
        "INSERT INTO movie_actor (movie_id, actor_id) VALUES ?",
        [actorValues]
      );
    }

    // c. Thêm Đạo diễn
    if (director_ids.length > 0) {
      const directorValues = director_ids.map((id) => [newMovieId, id]);
      await connection.query(
        "INSERT INTO movie_director (movie_id, director_id) VALUES ?",
        [directorValues]
      );
    }

    // ---------------------------------------------------------
    // BƯỚC 3: Commit transaction (Lưu xong MySQL)
    // ---------------------------------------------------------
    await connection.commit();

    // ---------------------------------------------------------
    // BƯỚC 4: GỌI SANG FLASK AI SERVICE (Background)
    // ---------------------------------------------------------
    // Chúng ta không await phần này để user không phải chờ AI train xong
    // Hoặc await nếu muốn đảm bảo đồng bộ. Ở đây mình dùng await để bắt lỗi luôn.

    try {
      const formData = new FormData();
      formData.append("movie_id", newMovieId);
      formData.append("overview", description || "");
      // Đọc file từ ổ cứng để stream sang Flask
      formData.append("poster", fs.createReadStream(posterPathForAI));

      // Gọi API Flask (Giả sử Flask chạy port 5000)
      await axios.post("http://localhost:5000/api/add_movie", formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      console.log(`[AI Service] Đã index phim ID: ${newMovieId}`);
    } catch (aiError) {
      console.error(
        "[AI Service Error] Không thể index phim:",
        aiError.message
      );
      // Lưu ý: Vẫn trả về success cho client vì DB đã lưu thành công,
      // chỉ có AI là lỗi (có thể chạy cronjob fix sau)
    }

    return res.status(201).json({
      message: "Thêm phim thành công",
      movie_id: newMovieId,
      poster_url: poster_url,
    });
  } catch (error) {
    // Nếu có lỗi DB, rollback và xóa ảnh đã upload
    await connection.rollback();

    // Xóa file ảnh rác nếu transaction thất bại
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Lỗi thêm phim:", error);
    return res.status(500).json({
      message: "Lỗi Server khi thêm phim",
      error: error.message,
    });
  } finally {
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
// Đảm bảo rằng bạn đã import thư viện db (kết nối cơ sở dữ liệu) và các thư viện cần thiết.
// const db = require('../config/db');

exports.updateMovie = async (req, res) => {
  const { id } = req.params;

  // 1. Dữ liệu text được Multer trích xuất vào req.body
  const {
    title,
    description,
    duration,
    release_date,
    external_ai_id,
    genre_ids,
    actor_ids,
    director_ids,
  } = req.body;

  // 2. Lấy thông tin file đã upload (do Multer cung cấp)
  const newFile = req.file;
  let new_poster_url = null;

  // Kiểm tra điều kiện bắt buộc
  if (!id) {
    return res.status(400).json({ message: "Thiếu movie_id" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 3. Kiểm tra phim và lấy URL poster cũ (để xóa nếu có file mới)
    const [check] = await connection.execute(
      "SELECT movie_id, poster_url FROM movie WHERE movie_id = ?",
      [id]
    );
    if (check.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy phim để sửa" });
    }

    const current_poster_url = check[0].poster_url;

    // ===============================================
    // 4. XỬ LÝ FILE MỚI (NẾU CÓ)
    // ===============================================
    if (newFile) {
      // LOGIC XỬ LÝ FILE:
      // a. Xử lý lưu trữ file (đổi tên, di chuyển file từ temp sang thư mục cố định)
      // new_poster_url = /uploads/path/to/new_file.jpg (Đường dẫn công khai)

      // Ví dụ đơn giản (thay thế bằng logic Multer thực tế của bạn)
      if (newFile.filename) {
        new_poster_url = `/uploads/${newFile.filename}`;
      }

      // b. Xóa file cũ khỏi server/S3 (nếu current_poster_url tồn tại)
      // Ví dụ: fs.unlinkSync(path.join(__dirname, '..', current_poster_url));
      // Cần cẩn thận khi xóa file.
    }

    // 5. Cập nhật thông tin chính của phim
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

    // Nếu new_poster_url có giá trị, nó sẽ cập nhật.
    // Nếu new_poster_url là NULL (không có file mới), COALESCE sẽ giữ lại poster_url cũ trong DB.
    await connection.execute(updateQuery, [
      title ?? null,
      description ?? null,
      duration ?? null,
      release_date ?? null,
      new_poster_url ?? null, // Giá trị đã được xử lý (new URL hoặc null)
      external_ai_id ?? null,
      id,
    ]);

    // 6. Xử lý cập nhật Thể loại (Genre)
    // Lưu ý: Multer có thể chuyển các trường mảng (như genre_ids) thành một chuỗi JSON hoặc một mảng thực sự.
    // Code này giả định nó là MẢNG ID (dạng string[] nếu là Multer) hoặc đã được Parse:
    let parsed_genre_ids = Array.isArray(genre_ids)
      ? genre_ids
      : typeof genre_ids === "string"
      ? JSON.parse(genre_ids)
      : [];

    if (Array.isArray(parsed_genre_ids)) {
      // Xóa cũ
      await connection.execute("DELETE FROM movie_genre WHERE movie_id = ?", [
        id,
      ]);

      // Thêm mới
      if (parsed_genre_ids.length > 0) {
        const genreValues = parsed_genre_ids.map((gId) => [id, gId]);
        await connection.query(
          "INSERT INTO movie_genre (movie_id, genre_id) VALUES ?",
          [genreValues]
        );
      }
    }

    // 7. Xử lý cập nhật Diễn viên (Actor)
    let parsed_actor_ids = Array.isArray(actor_ids)
      ? actor_ids
      : typeof actor_ids === "string"
      ? JSON.parse(actor_ids)
      : [];

    if (Array.isArray(parsed_actor_ids)) {
      await connection.execute("DELETE FROM movie_actor WHERE movie_id = ?", [
        id,
      ]);

      if (parsed_actor_ids.length > 0) {
        const actorValues = parsed_actor_ids.map((aId) => [id, aId]);
        await connection.query(
          "INSERT INTO movie_actor (movie_id, actor_id) VALUES ?",
          [actorValues]
        );
      }
    }

    let parsed_director_ids = Array.isArray(director_ids)
      ? director_ids
      : typeof director_ids === "string"
      ? JSON.parse(director_ids)
      : [];

    if (Array.isArray(parsed_director_ids)) {
      await connection.execute(
        "DELETE FROM movie_director WHERE movie_id = ?",
        [id]
      );

      if (parsed_director_ids.length > 0) {
        const directorValues = parsed_director_ids.map((dId) => [id, dId]);
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
    return res.status(400).json({ message: "Thiếu ID phim" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [check] = await connection.execute(
      "SELECT movie_id, title FROM movie WHERE movie_id = ?",
      [id]
    );

    if (check.length === 0) {
      connection.release();
      return res.status(404).json({ message: "Phim không tồn tại" });
    }

    await connection.execute("DELETE FROM movie WHERE movie_id = ?", [id]);

    connection.release();

    return res.status(200).json({
      message: `Đã xóa vĩnh viễn phim "${check[0].title}".`,
      movie_id: id,
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi xóa phim:", error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Không thể xóa phim này vì đang có Suất chiếu hoặc Vé đã bán. Hãy xóa các dữ liệu liên quan trước.",
      });
    }

    return res.status(500).json({ message: "Lỗi Server khi xóa phim" });
  }
};

// TÌM KIẾM BẰNG AI
exports.searchByImage = async (req, res) => {
  // 1. Check file upload từ React
  if (!req.file)
    return res.status(400).json({ message: "Vui lòng upload ảnh để tìm kiếm" });

  try {
    // 2. Chuẩn bị form data gửi sang Python Flask
    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path));
    formData.append("top_k", 5);

    // 3. Gọi Flask AI Service
    const aiResponse = await axios.post(
      "http://localhost:5000/api/search_by_image",
      formData,
      {
        headers: { ...formData.getHeaders() },
      }
    );

    const aiResults = aiResponse.data.results;

    if (!aiResults || aiResults.length === 0) {
      // Xóa ảnh tạm nếu không tìm thấy kết quả
      if (req.file && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      return res.json({ data: [] });
    }

    // 4. Lấy danh sách ID phim
    const movieIds = aiResults.map((item) => item.movie_id);

    // 5. Query MySQL
    // --- SỬA LỖI TẠI ĐÂY ---
    // Thay 'connection.query' thành 'db.query'
    const query = `SELECT * FROM movie WHERE movie_id IN (?)`;
    const [movies] = await db.query(query, [movieIds]);
    // -----------------------

    // Sắp xếp lại movies theo đúng thứ tự score từ AI
    const sortedMovies = aiResults
      .map((aiItem) => {
        const foundMovie = movies.find((m) => m.movie_id === aiItem.movie_id);
        // Gán thêm score vào object phim để hiển thị ở Frontend nếu muốn
        return foundMovie ? { ...foundMovie, score: aiItem.score } : undefined;
      })
      .filter((item) => item !== undefined);

    // Xóa ảnh tạm sau khi search xong
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ data: sortedMovies });
  } catch (error) {
    // Xóa ảnh tạm nếu lỗi
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("Search Error:", error.message);
    res.status(500).json({ error: "Lỗi hệ thống tìm kiếm" });
  }
};

exports.searchByText = async (req, res) => {
  const { query } = req.body; // Lấy text người dùng nhập: "phim hoạt hình vui nhộn"

  if (!query)
    return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });

  try {
    // 1. Gọi sang Flask AI Service (Bạn cần đảm bảo bên Flask đã có api /search_by_text như code Python cũ)
    // Nếu Flask chưa có route POST /api/search_by_text nhận JSON, bạn cần update Flask.
    // Tuy nhiên, giả sử Flask đã có hàm search_by_text (dựa trên notebook bạn gửi).

    // Gửi JSON sang Flask
    const aiResponse = await axios.post(
      "http://localhost:5000/api/search_by_text",
      {
        query: query,
        top_k: 3, // Lấy top 8 phim
      }
    );

    const aiResults = aiResponse.data.results;
    // Dạng: [{ movie_id: 1, score: 0.8 }, ...]

    if (!aiResults || aiResults.length === 0) {
      return res.json({ data: [] });
    }

    // 2. Lấy thông tin từ MySQL
    const movieIds = aiResults.map((item) => item.movie_id);
    const [movies] = await db.query(
      `SELECT * FROM movie WHERE movie_id IN (?)`,
      [movieIds]
    );

    // 3. Sắp xếp kết quả theo AI score
    const sortedMovies = aiResults
      .map((aiItem) => {
        const movie = movies.find((m) => m.movie_id === aiItem.movie_id);
        return movie ? { ...movie, score: aiItem.score } : null;
      })
      .filter((item) => item !== null);

    res.json({ data: sortedMovies });
  } catch (error) {
    console.error("Text Search Error:", error.message);
    res.status(500).json({ error: "Lỗi tìm kiếm ngữ nghĩa" });
  }
};
