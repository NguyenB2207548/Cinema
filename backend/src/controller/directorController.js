const db = require("../config/db.js");

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

  // 1. Validate dữ liệu đầu vào
  if (!id) {
    return res.status(400).json({ message: "Thiếu ID đạo diễn" });
  }
  if (!fullname || fullname.trim() === "") {
    return res
      .status(400)
      .json({ message: "Tên đạo diễn không được để trống" });
  }

  try {
    // 2. Thực hiện lệnh UPDATE
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

    // 3. Kiểm tra kết quả
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
