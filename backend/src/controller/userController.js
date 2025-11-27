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
      "SELECT user_id, full_name, username, password, role FROM user WHERE username = ?",
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
      { user_id: user.user_id, full_name: user.full_name, role: user.role }, // Payload
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
        full_name: user.full_name,
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

// GET ALL USER
exports.getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const search = req.query.search || "";

  const offset = (page - 1) * limit;

  let connection;
  try {
    connection = await db.getConnection();

    let sqlCount = "SELECT COUNT(*) as total FROM user";
    let sqlData = `
      SELECT user_id, full_name, username, email, role, created_at 
      FROM user
    `;

    const params = [];

    if (search) {
      const searchCondition = " WHERE full_name LIKE ?";
      sqlCount += searchCondition;
      sqlData += searchCondition;
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
    }

    sqlData += " ORDER BY user_id ASC LIMIT ? OFFSET ?";

    const [countResult] = await connection.execute(
      sqlCount,
      params.slice(0, search ? 3 : 0)
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    const [users] = await connection.execute(sqlData, [
      ...params,
      String(limit),
      String(offset),
    ]);

    connection.release();

    // 5. Trả về kết quả
    res.status(200).json({
      data: users,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi lấy danh sách user:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// ADD ADMIN
exports.createUser = async (req, res) => {
  // Lấy dữ liệu từ body, bao gồm cả ROLE
  const { username, password, email, full_name, role } = req.body;

  // 1. Validate dữ liệu đầu vào
  if (!username || !email || !password || !role) {
    return res.status(400).json({
      message:
        "Vui lòng nhập đầy đủ: Tên đăng nhập, Email, Mật khẩu và Vai trò.",
    });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // 2. Kiểm tra trùng lặp (Username hoặc Email)
    const [existingUsers] = await connection.execute(
      "SELECT user_id FROM user WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({
        message: "Tên đăng nhập hoặc Email đã tồn tại trong hệ thống.",
      });
    }

    // 3. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Insert vào database
    // Lưu ý: role được lấy từ req.body (cho phép tạo admin)
    const [result] = await connection.execute(
      "INSERT INTO user (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, full_name || null, email, role]
    );

    connection.release();

    // 5. Trả về kết quả thành công
    res.status(201).json({
      message: "Tạo người dùng mới thành công.",
      userId: result.insertId,
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi khi tạo user:", error);
    res.status(500).json({
      message: "Lỗi máy chủ nội bộ.",
    });
  }
};

// SEARCH USER BY NAME
exports.searchUsersByName = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Vui lòng nhập tên cần tìm." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const sql = `
      SELECT user_id, full_name, username, email, role, created_at 
      FROM user 
      WHERE full_name LIKE ? OR username LIKE ?
      ORDER BY user_id DESC
    `;

    const searchTerm = `%${name}%`;

    const [users] = await connection.execute(sql, [searchTerm, searchTerm]);

    connection.release();

    res.status(200).json({
      message: "Tìm thấy kết quả.",
      count: users.length,
      data: users,
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi tìm kiếm user:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};
