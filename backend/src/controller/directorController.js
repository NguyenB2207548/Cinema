const db = require("../config/db.js");

exports.getAllDirectors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "1=1";
    let params = [];

    if (search) {
      whereClause += " AND (fullname LIKE ? OR nationality LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Query Data
    const sqlData = `SELECT * FROM director WHERE ${whereClause} ORDER BY director_id DESC LIMIT ? OFFSET ?`;
    const [directors] = await db.execute(sqlData, [
      ...params,
      String(limit),
      String(offset),
    ]);

    // Query Count
    const sqlCount = `SELECT COUNT(*) as total FROM director WHERE ${whereClause}`;
    const [countResult] = await db.execute(sqlCount, params);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: directors,
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
exports.createDirector = async (req, res) => {
  try {
    const { fullname, nationality } = req.body;

    if (!fullname || fullname.trim() === "") {
      return res.status(400).json({ message: "Tên đạo diễn là bắt buộc" });
    }

    const query = "INSERT INTO director (fullname, nationality) VALUES (?, ?)";

    const [result] = await db.execute(query, [
      fullname.trim(),
      nationality ? nationality.trim() : null,
    ]);

    return res.status(201).json({
      message: "Thêm đạo diễn thành công",
      director_id: result.insertId,
      data: {
        fullname: fullname.trim(),
        nationality: nationality || null,
      },
    });
  } catch (error) {
    console.error("Lỗi thêm đạo diễn:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

// UPDATE DIRECTOR
exports.updateDirector = async (req, res) => {
  const { id } = req.params;
  const { fullname, nationality } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Thiếu ID đạo diễn" });
  }
  if (!fullname || fullname.trim() === "") {
    return res
      .status(400)
      .json({ message: "Tên đạo diễn không được để trống" });
  }

  try {
    const query = `
            UPDATE director 
            SET fullname = ?, nationality = ? 
            WHERE director_id = ?
        `;

    const [result] = await db.execute(query, [
      fullname.trim(),
      nationality ? nationality.trim() : null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy đạo diễn (Hoặc đạo diễn này đã bị xóa)",
      });
    }

    return res.status(200).json({
      message: "Cập nhật thông tin đạo diễn thành công",
      data: {
        director_id: id,
        fullname: fullname.trim(),
        nationality: nationality || null,
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật đạo diễn:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

exports.deleteDirector = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Thiếu ID đạo diễn" });
  }

  try {
    const query = "DELETE FROM director WHERE director_id = ?";
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đạo diễn để xóa" });
    }

    return res.status(200).json({
      message: "Xóa đạo diễn thành công",
      director_id: id,
    });
  } catch (error) {
    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(409).json({
        message:
          "Không thể xóa đạo diễn này vì họ đang tham gia vào một bộ phim.",
      });
    }

    console.error("Lỗi xóa đạo diễn:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};
