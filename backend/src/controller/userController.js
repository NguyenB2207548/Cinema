const db = require("../config/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10;

exports.registerUser = async (req, res) => {
  const { username, password, email, full_name, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Tên đăng nhập, email và mật khẩu là bắt buộc.",
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [existingUsers] = await connection.execute(
      "SELECT user_id FROM user WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({
        message: "Tên đăng nhập hoặc email đã tồn tại.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await connection.execute(
      "INSERT INTO user (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, full_name || null, email, role]
    );

    connection.release();

    res.status(201).json({
      message: "Đăng ký người dùng thành công.",
      userId: result.insertId,
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi khi đăng ký người dùng:", error);
    res.status(500).json({
      message: "Lỗi máy chủ nội bộ khi đăng ký.",
    });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    // Kiểm tra username
    return res.status(400).json({
      message: "Tên đăng nhập và mật khẩu là bắt buộc.",
    });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // 2. Tìm người dùng theo username
    const [users] = await connection.execute(
      "SELECT user_id, username, password, role FROM user WHERE username = ?",
      [username] // Thay đổi: Tìm bằng username
    );

    if (users.length === 0) {
      connection.release();
      // Thông báo lỗi chung để tránh tiết lộ liệu username có tồn tại hay không
      return res.status(401).json({
        message: "Tên đăng nhập hoặc mật khẩu không chính xác.",
      });
    }

    const user = users[0];

    // 3. So sánh mật khẩu
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({
        message: "Tên đăng nhập hoặc mật khẩu không chính xác.",
      });
    }

    // 4. Tạo JWT Token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role }, // Payload
      process.env.JWT_SECRET, // Khóa bí mật
      { expiresIn: "1d" } // Token hết hạn sau 1 ngày
    );

    connection.release();

    // 5. Trả về token và thông tin cơ bản
    res.status(200).json({
      message: "Đăng nhập thành công.",
      token: token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({
      message: "Lỗi máy chủ nội bộ khi đăng nhập.",
    });
  }
};
