const db = require("../config/db.js");

exports.createGenre = async (req, res) => {
  try {
    // 1. Lấy dữ liệu từ body
    const { name } = req.body;

    // 2. Validate dữ liệu
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "Tên thể loại không được để trống" });
    }

    // 3. Thực hiện câu lệnh INSERT
    // Lưu ý: Sử dụng trim() để loại bỏ khoảng trắng thừa ở đầu/cuối
    const query = "INSERT INTO genre (name) VALUES (?)";
    const [result] = await db.execute(query, [name.trim()]);

    // 4. Trả về kết quả thành công
    return res.status(201).json({
      message: "Thêm thể loại thành công",
      genre_id: result.insertId,
      name: name.trim(),
    });
  } catch (error) {
    // 5. Xử lý lỗi trùng lặp (Duplicate Entry)
    // Mã lỗi ER_DUP_ENTRY thường xuất hiện khi vi phạm khóa UNIQUE
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Thể loại này đã tồn tại trong hệ thống",
      });
    }

    console.error("Lỗi thêm thể loại:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

// UPDATE GENRE
exports.updateGenre = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Thiếu ID thể loại" });
  }
  if (!name || name.trim() === "") {
    return res
      .status(400)
      .json({ message: "Tên thể loại không được để trống" });
  }

  try {
    const query = "UPDATE genre SET name = ? WHERE genre_id = ?";

    const [result] = await db.execute(query, [name.trim(), id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thể loại này để sửa" });
    }

    return res.status(200).json({
      message: "Cập nhật thể loại thành công",
      data: {
        genre_id: id,
        name: name.trim(),
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Tên thể loại này đã tồn tại, vui lòng chọn tên khác.",
      });
    }

    console.error("Lỗi cập nhật thể loại:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};
