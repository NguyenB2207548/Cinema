const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Không tìm thấy Token. Vui lòng đăng nhập." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token không đúng định dạng." });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_tam_thoi"
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

// KIỂM TRA ADMIN
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Chưa xác thực người dùng." });
  }

  if (req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Bạn không có quyền Admin để thực hiện thao tác này." });
  }
};
