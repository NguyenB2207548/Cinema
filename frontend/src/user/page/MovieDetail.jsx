import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
import { FaClock } from "react-icons/fa";
import { useParams, Link } from "react-router-dom"; // Lấy ID từ URL
import "../../assets/css/MovieDetail.css";

const MovieDetail = () => {
  const { id } = useParams(); // Lấy ID phim từ URL: /movie/:id
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- GỌI API LẤY CHI TIẾT PHIM ---
  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/cinema/${id}`);
        if (!response.ok) {
          throw new Error("Không tìm thấy phim");
        }
        const result = await response.json();
        // Backend trả về: { message: "...", data: { ... } }
        setMovie(result.data);
      } catch (err) {
        console.error("Lỗi tải chi tiết phim:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [id]);

  if (loading)
    return <div className="text-white text-center mt-5">Đang tải...</div>;
  if (error)
    return (
      <Alert variant="danger" className="m-5">
        {error}
      </Alert>
    );
  if (!movie) return null;

  // --- XỬ LÝ LỊCH CHIẾU (SHOWTIMES) ---
  // Backend trả về mảng showtimes: [{ start_time: '...', ... }]
  // Ta có thể nhóm theo ngày (nếu cần) hoặc hiển thị list đơn giản.
  // Ở đây tôi hiển thị danh sách phẳng, bạn có thể custom thêm logic nhóm ngày.

  return (
    <div className="movie-detail-page pt-4">
      <Container className="custom-container">
        {/* --- PHẦN 1: THÔNG TIN CHI TIẾT --- */}
        <h4 className="mb-4 text-white">Chi tiết phim</h4>

        <Row className="mb-5">
          {/* Cột trái: Poster */}
          <Col md={5} lg={4} className="mb-4 mb-md-0">
            <img
              src={`http://localhost:3000${movie.poster_url}`}
              alt={movie.title}
              className="movie-poster"
            />
          </Col>

          {/* Cột phải: Thông tin */}
          <Col md={7} lg={8}>
            <h1 className="movie-title">{movie.title}</h1>

            <p className="mb-4 text-light" style={{ lineHeight: "1.6" }}>
              <strong className="text-white">Mô tả phim: </strong>
              {movie.description}
            </p>

            <div className="mb-2">
              <span className="info-label">Thời lượng:</span>
              <span>{movie.duration} phút</span>
            </div>

            <div className="mb-2">
              <span className="info-label">Ngày phát hành:</span>
              {/* Format ngày tháng năm */}
              <span>
                {new Date(movie.release_date).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <div className="mb-2">
              <span className="info-label">Thể loại:</span>
              <span>{movie.genres || "Đang cập nhật"}</span>
            </div>

            <div className="mb-2">
              <span className="info-label">Đạo diễn:</span>
              <span>{movie.directors || "Đang cập nhật"}</span>
            </div>

            <div className="mb-2">
              <span className="info-label">Diễn viên:</span>
              <span>{movie.actors || "Đang cập nhật"}</span>
            </div>
          </Col>
        </Row>

        {/* --- PHẦN 2: LỊCH CHIẾU --- */}
        <div className="mt-5">
          <h3 className="fw-bold mb-4 border-bottom border-secondary pb-2 d-inline-block text-white">
            Lịch chiếu
          </h3>

          {movie.showtimes && movie.showtimes.length > 0 ? (
            <Row className="g-3">
              {movie.showtimes.map((show, index) => {
                const startDate = new Date(show.start_time);
                // Format ngày: Thứ Bảy, 29/11
                const dateStr = startDate.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                });
                // Format giờ: 19:00
                const timeStr = startDate.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <Col md={6} key={index}>
                    <div className="schedule-card d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold fs-5 mb-1 text-white text-capitalize">
                          {dateStr}
                        </div>
                        <div className="text-muted small">
                          <FaClock className="me-2" />
                          <span className="text-warning fw-bold fs-6">
                            {timeStr}
                          </span>
                          <span className="ms-2">({show.room_name})</span>
                        </div>
                      </div>

                      <div>
                        <Button
                          as={Link} // 2. Render như một Link
                          to={`/booking/${show.show_time_id}`} // 3. Dùng 'to' thay vì 'href'
                          className="btn-booking"
                        >
                          Đặt vé
                        </Button>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <div className="text-muted fst-italic">
              Hiện chưa có lịch chiếu cho phim này.
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default MovieDetail;
