const db = require("../config/db.js");

exports.getAllActors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "1=1";
    let params = [];

    if (search) {
      // Tìm kiếm theo tên hoặc quốc tịch
      whereClause += " AND (fullname LIKE ? OR nationality LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Query Data
    const sqlData = `SELECT * FROM actor WHERE ${whereClause} ORDER BY actor_id DESC LIMIT ? OFFSET ?`;
    const [actors] = await db.execute(sqlData, [
      ...params,
      String(limit),
      String(offset),
    ]);

    // Query Count
    const sqlCount = `SELECT COUNT(*) as total FROM actor WHERE ${whereClause}`;
    const [countResult] = await db.execute(sqlCount, params);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: actors,
      meta: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

exports.createActor = async (req, res) => {
  try {
    const { fullname, nationality } = req.body;

    if (!fullname || fullname.trim() === "") {
      return res.status(400).json({ message: "Tên diễn viên là bắt buộc" });
    }

    const query = "INSERT INTO actor (fullname, nationality) VALUES (?, ?)";

    const [result] = await db.execute(query, [
      fullname.trim(),
      nationality ? nationality.trim() : null,
    ]);

    return res.status(201).json({
      message: "Thêm diễn viên thành công",
      actor_id: result.insertId,
      data: {
        fullname: fullname.trim(),
        nationality: nationality || null,
      },
    });
  } catch (error) {
    console.error("Lỗi thêm diễn viên:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

// UPDATE ACTOR
exports.updateActor = async (req, res) => {
  const { id } = req.params;
  const { fullname, nationality } = req.body;

  // 1. Validate dữ liệu
  if (!id) {
    return res.status(400).json({ message: "Thiếu ID diễn viên" });
  }
  if (!fullname || fullname.trim() === "") {
    return res
      .status(400)
      .json({ message: "Tên diễn viên không được để trống" });
  }

  try {
    // 2. Thực hiện lệnh UPDATE
    const query = `
            UPDATE actor 
            SET fullname = ?, nationality = ? 
            WHERE actor_id = ?
        `;

    const [result] = await db.execute(query, [
      fullname.trim(),
      nationality ? nationality.trim() : null, // Xử lý null
      id,
    ]);

    // 3. Kiểm tra xem có dòng nào được update không
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy diễn viên để sửa" });
    }

    return res.status(200).json({
      message: "Cập nhật thông tin diễn viên thành công",
      data: {
        actor_id: id,
        fullname: fullname.trim(),
        nationality: nationality || null,
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật diễn viên:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

exports.deleteActor = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Thiếu ID diễn viên" });
  }

  try {
    const query = "DELETE FROM actor WHERE actor_id = ?";
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy diễn viên để xóa" });
    }

    return res.status(200).json({
      message: "Xóa diễn viên thành công",
      actor_id: id,
    });
  } catch (error) {
    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(409).json({
        message:
          "Không thể xóa diễn viên này vì họ đang tham gia vào một bộ phim.",
      });
    }

    console.error("Lỗi xóa diễn viên:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};
