import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaFilm,
  FaCalendarAlt,
  FaBuilding,
  FaTags,
  FaUserTie,
  FaVideo,
  FaHome,
  FaTicketAlt,
} from "react-icons/fa";
// import "./css/Manager.css";

const DashboardHome = () => {
  // Danh sách các mục quản lý
  const menuItems = [
    {
      title: "Quản lý người dùng",
      path: "/admin/users",
      icon: <FaUsers />,
      color: "#3498db", // Xanh dương
      desc: "Xem, sửa, xóa và phân quyền tài khoản",
    },
    {
      title: "Quản lý phim",
      path: "/admin/movies",
      icon: <FaFilm />,
      color: "#e74c3c", // Đỏ
      desc: "Thêm phim mới, cập nhật thông tin phim",
    },
    {
      title: "Lịch chiếu",
      path: "/admin/shows",
      icon: <FaCalendarAlt />,
      color: "#f1c40f", // Vàng
      desc: "Sắp xếp suất chiếu cho các phòng",
    },
    {
      title: "Quản lý vé",
      path: "/admin/booking",
      icon: <FaTicketAlt />,
      color: "#27ae60", // Xanh lá đậm
      desc: "Xem lịch sử đặt vé và doanh thu",
    },
    {
      title: "Phòng chiếu",
      path: "/admin/rooms",
      icon: <FaBuilding />,
      color: "#9b59b6", // Tím
      desc: "Quản lý phòng và sơ đồ ghế",
    },
    {
      title: "Thể loại",
      path: "/admin/genres",
      icon: <FaTags />,
      color: "#2ecc71", // Xanh lá
      desc: "Danh mục thể loại phim",
    },
    {
      title: "Diễn viên",
      path: "/admin/actors",
      icon: <FaUserTie />,
      color: "#34495e", // Xanh đen
      desc: "Thông tin diễn viên",
    },
    {
      title: "Đạo diễn",
      path: "/admin/directors",
      icon: <FaVideo />,
      color: "#e67e22", // Cam
      desc: "Thông tin đạo diễn",
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark">
          <FaHome className="me-2" /> Dashboard
        </h3>
        <p className="text-muted">Chào mừng trở lại! Hãy chọn một mục.</p>
      </div>

      <Row className="g-4">
        {menuItems.map((item, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={3}>
            <Link to={item.path} style={{ textDecoration: "none" }}>
              <Card className="h-100 shadow-sm border-0 dashboard-card">
                <Card.Body className="d-flex flex-column align-items-center text-center p-4">
                  {/* Icon */}
                  <div
                    className="icon-wrapper mb-3 d-flex align-items-center justify-content-center"
                    style={{
                      backgroundColor: `${item.color}20`, // Thêm độ trong suốt 20%
                      color: item.color,
                      width: "70px",
                      height: "70px",
                      borderRadius: "50%",
                      fontSize: "2rem",
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Title */}
                  <Card.Title className="fw-bold text-dark mb-2">
                    {item.title}
                  </Card.Title>

                  {/* Description */}
                  <Card.Text className="text-muted small">
                    {item.desc}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DashboardHome;
