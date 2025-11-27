import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import { FaPlus, FaHome } from "react-icons/fa";
import { LineChart, Line, ResponsiveContainer } from "recharts"; // Thư viện biểu đồ
import "../assets/css/Admin.css";

// Dữ liệu giả lập cho biểu đồ
const dataChart = [
  { name: "2023", uv: 10 },
  { name: "Feb", uv: 15 },
  { name: "Mar", uv: 12 },
  { name: "Apr", uv: 20 },
  { name: "May", uv: 25 },
  { name: "2023", uv: 40 },
];

// Component nút thao tác nhanh (Màu đen)
const QuickAction = ({ title }) => (
  <div className="quick-action-btn h-100">
    <div className="quick-icon">
      <FaPlus />
    </div>
    <div className="small fw-bold">{title}</div>
  </div>
);

// Component thẻ thống kê (Màu trắng + Biểu đồ)
const StatCard = ({ title, value }) => (
  <div className="stats-card">
    <div className="stats-title">{title}</div>
    <div className="stats-value">{value}</div>
    <div style={{ height: "60px", marginTop: "10px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataChart}>
          <Line
            type="monotone"
            dataKey="uv"
            stroke="#4a90e2"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DashboardHome = () => {
  return (
    <div className="p-2">
      <h5 className="mb-3 text-secondary">
        <FaHome className="me-2" />
        Dashboard
      </h5>

      {/* 1. HÀNG NÚT THAO TÁC NHANH */}
      <Row className="g-3 mb-4">
        {[
          "Thêm suất chiếu",
          "Thêm phòng chiếu",
          "Thêm thể loại",
          "Thêm diễn viên",
          "Thêm đạo diễn",
          "Thêm chi nhánh",
        ].map((item, idx) => (
          <Col md={2} sm={4} xs={6} key={idx}>
            <QuickAction title={item} />
          </Col>
        ))}
      </Row>

      {/* 2. HÀNG THỐNG KÊ (BIỂU ĐỒ) */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <StatCard title="Người dùng" value="32" />
        </Col>
        <Col md={4}>
          <StatCard title="Phim chiếu" value="26" />
        </Col>
        <Col md={4}>
          <StatCard title="Phòng chiếu" value="578" />
        </Col>
      </Row>

      {/* 3. DANH SÁCH PHIM (RECOMMENDED) */}
      <h5 className="mb-3 fw-bold">Recommended for you</h5>
      <Row className="g-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Col md={2} xs={6} key={item}>
            <Card className="border-0 h-100 shadow-sm">
              <Card.Img
                variant="top"
                src={`https://via.placeholder.com/150x220?text=Movie+${item}`}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <Card.Body className="p-2">
                <Card.Title className="fs-6 fw-bold text-truncate">
                  Tên Phim {item}
                </Card.Title>
                <Card.Text className="small text-muted">2023/10/26</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DashboardHome;
