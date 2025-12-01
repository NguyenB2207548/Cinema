// middleware/upload.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Đảm bảo thư mục này đã tồn tại
  },
  filename: function (req, file, cb) {
    // Đặt tên file: timestamp-ten-goc
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
