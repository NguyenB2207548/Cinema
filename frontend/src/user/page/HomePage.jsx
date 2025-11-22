import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { FaCamera, FaSearch } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/HomePage.css";

const HomePage = () => {
  const [movies, setMovies] = useState([]);

  // GỌI API LẤY DANH SÁCH PHIM
  useEffect(() => {
    fetch("http://localhost:3000/api/cinema")
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.data);
      })
      .catch((err) => console.log("Lỗi lấy phim:", err));
  }, []);

  return (
    <div className="homepage-wrapper">
      {/* FILTER BAR */}
      <div className="filter-bar px-5">
        <div className="filter-container d-flex align-items-center">
          <span className="filter-item active">Thể loại</span>
          <span className="filter-item">Diễn viên</span>
          <span className="filter-item">Đạo diễn</span>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <div className="search-section py-5">
        <Container>
          <Row>
            {/* Tìm kiếm bằng ảnh */}
            <Col md={6} className="mb-3 mb-md-0">
              <div className="search-image-box">
                <FaCamera size={40} className="search-image-icon mb-3" />
                <h5 className="fw-bold text-white">Tìm phim bằng ảnh</h5>
                <p className="text-muted small">
                  Drag and drop image to upload
                </p>
                <input type="file" style={{ display: "none" }} />
              </div>
            </Col>

            {/* Tìm kiếm ngữ nghĩa */}
            <Col md={6}>
              <div className="text-white h-100">
                <h5 className="mb-2">Tìm phim bằng ngữ nghĩa</h5>
                <div className="semantic-box position-relative h-75">
                  <Form.Control
                    as="textarea"
                    placeholder="Nhập mô tả nội dung phim bạn muốn tìm..."
                    className="semantic-input"
                  />
                  <FaSearch className="semantic-search-icon" />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* LIST MOVIES */}
      <Container className="py-5">
        <h3 className="movie-title-section">Danh sách phim</h3>

        <Row>
          {movies.map((movie) => (
            <Col xs={6} md={4} lg={3} className="mb-4" key={movie.movie_id}>
              <Card className="movie-card h-100 border-0 shadow-sm">
                <div className="movie-img-wrapper">
                  <Card.Img
                    variant="top"
                    src={movie.image}
                    className="movie-img"
                  />
                </div>

                <Card.Body className="d-flex flex-column p-2">
                  <Card.Title
                    className="fs-6 fw-bold text-truncate movie-name"
                    title={movie.title}
                  >
                    {movie.title}
                  </Card.Title>

                  <Button className="btn-book">Đặt vé</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;
