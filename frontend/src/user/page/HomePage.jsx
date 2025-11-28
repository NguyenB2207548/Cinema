import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { FaCamera, FaSearch, FaTimes } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/HomePage.css";

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]); // Thể loại
  const [actors, setActors] = useState([]); // Diễn viên
  const [directors, setDirectors] = useState([]); // Đạo diễn

  // State quản lý Filter UI
  const [activeTab, setActiveTab] = useState("");

  // Object đang được chọn để lọc
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);
  const [selectedDirector, setSelectedDirector] = useState(null);

  // State tìm kiếm (Chỉ dùng để hiển thị kết quả từ Header)
  const [searchTerm, setSearchTerm] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // ==========================================
  // 1. HÀM GỌI API LẤY PHIM
  // ==========================================
  const fetchMovies = (
    genreId = null,
    actorId = null,
    directorId = null,
    keyword = null
  ) => {
    let url = "http://localhost:3000/api/cinema?limit=8";

    if (genreId) url += `&genre_id=${genreId}`;
    if (actorId) url += `&actor_id=${actorId}`;
    if (directorId) url += `&director_id=${directorId}`;
    if (keyword) url += `&search=${encodeURIComponent(keyword)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.data || []);
      })
      .catch((err) => console.log("Lỗi lấy phim:", err));
  };

  // ==========================================
  // 2. KHỞI TẠO DỮ LIỆU BAN ĐẦU
  // ==========================================
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [resGenres, resActors, resDirectors] = await Promise.all([
          fetch("http://localhost:3000/api/genre"),
          fetch("http://localhost:3000/api/actor"),
          fetch("http://localhost:3000/api/director"),
        ]);

        const dataGenres = await resGenres.json();
        const dataActors = await resActors.json();
        const dataDirectors = await resDirectors.json();

        setGenres(
          Array.isArray(dataGenres) ? dataGenres : dataGenres.data || []
        );
        setActors(
          Array.isArray(dataActors) ? dataActors : dataActors.data || []
        );
        setDirectors(
          Array.isArray(dataDirectors)
            ? dataDirectors
            : dataDirectors.data || []
        );
      } catch (err) {
        console.error("Lỗi lấy dữ liệu filter:", err);
      }
    };

    fetchFilters();
    fetchMovies();
  }, []);

  // ==========================================
  // 3. BẮT SỰ KIỆN RELOAD (F5) ĐỂ RESET VỀ TRANG CHỦ
  // ==========================================
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem("isReloadingHomePage", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Kiểm tra xem có phải vừa reload không
    const isReloading = sessionStorage.getItem("isReloadingHomePage");
    if (isReloading === "true") {
      sessionStorage.removeItem("isReloadingHomePage");

      // Reset tất cả state về mặc định
      setSearchTerm("");
      setSelectedGenre(null);
      setSelectedActor(null);
      setSelectedDirector(null);

      // Nếu URL có search param hoặc filter, redirect về trang chủ sạch
      if (location.search) {
        navigate("/", { replace: true });
      } else {
        // Nếu đã ở trang chủ sạch rồi thì chỉ cần load phim mặc định
        fetchMovies();
      }
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // ==========================================
  // 4. LẮNG NGHE URL SEARCH (TỪ HEADER)
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchKeyword = params.get("search");

    if (searchKeyword) {
      setSearchTerm(searchKeyword); // Cập nhật để hiển thị title

      // Reset các filter khác khi tìm kiếm
      setSelectedGenre(null);
      setSelectedActor(null);
      setSelectedDirector(null);

      fetchMovies(null, null, null, searchKeyword);
    } else {
      // Reset searchTerm khi không có param search
      setSearchTerm("");

      // Nếu không có param search, và cũng không có filter nào đang chọn thì load mặc định
      if (!selectedGenre && !selectedActor && !selectedDirector) {
        fetchMovies();
      }
    }
  }, [location.search]);

  // ==========================================
  // 5. XỬ LÝ SỰ KIỆN FILTER
  // ==========================================

  const handleGenreClick = (genre) => {
    setSelectedGenre(genre);
    setSelectedActor(null);
    setSelectedDirector(null);
    setSearchTerm("");
    setActiveTab("");
    fetchMovies(genre.id || genre.genre_id, null, null, null);
  };

  const handleActorClick = (actor) => {
    setSelectedActor(actor);
    setSelectedGenre(null);
    setSelectedDirector(null);
    setSearchTerm("");
    setActiveTab("");
    fetchMovies(null, actor.id || actor.actor_id, null, null);
  };

  const handleDirectorClick = (director) => {
    setSelectedDirector(director);
    setSelectedGenre(null);
    setSelectedActor(null);
    setSearchTerm("");
    setActiveTab("");
    fetchMovies(null, null, director.id || director.director_id, null);
  };

  const handleClearFilter = () => {
    setSelectedGenre(null);
    setSelectedActor(null);
    setSelectedDirector(null);
    setSearchTerm("");
    fetchMovies();
  };

  // Tên hiển thị trên nút lọc
  const currentFilterName = selectedGenre
    ? selectedGenre.name
    : selectedActor
    ? selectedActor.fullname
    : selectedDirector
    ? selectedDirector.fullname
    : "";

  return (
    <div className="homepage-wrapper">
      {/* --- FILTER BAR --- */}
      <div className="filter-bar px-5">
        <div className="filter-container d-flex align-items-center position-relative">
          <span
            className={`filter-item ${activeTab === "genre" ? "active" : ""}`}
            onClick={() => setActiveTab(activeTab === "genre" ? "" : "genre")}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            Thể loại {activeTab === "genre" ? "▲" : "▼"}
          </span>

          <span
            className={`filter-item ${activeTab === "actor" ? "active" : ""}`}
            onClick={() => setActiveTab(activeTab === "actor" ? "" : "actor")}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            Diễn viên {activeTab === "actor" ? "▲" : "▼"}
          </span>

          <span
            className={`filter-item ${
              activeTab === "director" ? "active" : ""
            }`}
            onClick={() =>
              setActiveTab(activeTab === "director" ? "" : "director")
            }
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            Đạo diễn {activeTab === "director" ? "▲" : "▼"}
          </span>

          {/* Tag đang lọc */}
          {(selectedGenre || selectedActor || selectedDirector) && (
            <div className="ms-4 d-flex align-items-center">
              <span className="text-white me-2 small">Đang lọc:</span>
              <Button
                variant="warning"
                size="sm"
                className="rounded-pill px-3 fw-bold"
                onClick={handleClearFilter}
              >
                {currentFilterName} <FaTimes className="ms-1" />
              </Button>
            </div>
          )}

          {/* Dropdown Menus */}
          {activeTab === "genre" && (
            <div className="genre-dropdown">
              <div className="d-flex flex-wrap gap-2">
                {genres.map((g) => (
                  <Button
                    key={g.id || g.genre_id}
                    variant={
                      selectedGenre?.id === (g.id || g.genre_id)
                        ? "warning"
                        : "outline-secondary"
                    }
                    size="sm"
                    className="text-white border-secondary"
                    style={{
                      backgroundColor:
                        selectedGenre?.id === (g.id || g.genre_id)
                          ? "#cca340"
                          : "transparent",
                      borderColor:
                        selectedGenre?.id === (g.id || g.genre_id)
                          ? "#cca340"
                          : "#555",
                    }}
                    onClick={() => handleGenreClick(g)}
                  >
                    {g.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "actor" && (
            <div className="genre-dropdown">
              <div className="d-flex flex-wrap gap-2">
                {actors.map((a) => (
                  <Button
                    key={a.id || a.actor_id}
                    variant={
                      selectedActor?.id === (a.id || a.actor_id)
                        ? "warning"
                        : "outline-secondary"
                    }
                    size="sm"
                    className="text-white border-secondary"
                    style={{
                      backgroundColor:
                        selectedActor?.id === (a.id || a.actor_id)
                          ? "#cca340"
                          : "transparent",
                      borderColor:
                        selectedActor?.id === (a.id || a.actor_id)
                          ? "#cca340"
                          : "#555",
                    }}
                    onClick={() => handleActorClick(a)}
                  >
                    {a.fullname || a.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "director" && (
            <div className="genre-dropdown">
              <div className="d-flex flex-wrap gap-2">
                {directors.map((d) => (
                  <Button
                    key={d.id || d.director_id}
                    variant={
                      selectedDirector?.id === (d.id || d.director_id)
                        ? "warning"
                        : "outline-secondary"
                    }
                    size="sm"
                    className="text-white border-secondary"
                    style={{
                      backgroundColor:
                        selectedDirector?.id === (d.id || d.director_id)
                          ? "#cca340"
                          : "transparent",
                      borderColor:
                        selectedDirector?.id === (d.id || d.director_id)
                          ? "#cca340"
                          : "#555",
                    }}
                    onClick={() => handleDirectorClick(d)}
                  >
                    {d.fullname || d.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- SEARCH SECTION (ĐÃ BỎ LOGIC TÌM KIẾM, DÀNH CHO AI SAU NÀY) --- */}
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

            {/* Tìm kiếm ngữ nghĩa (AI Placeholder) */}
            <Col md={6}>
              <div className="text-white h-100">
                <h5 className="mb-2">Tìm phim bằng ngữ nghĩa</h5>
                <div className="semantic-box position-relative h-75">
                  <Form.Control
                    as="textarea"
                    placeholder="Nhập mô tả nội dung phim bạn muốn tìm..."
                    className="semantic-input"
                    // Đã bỏ value, onChange, onKeyDown để không kích hoạt tìm kiếm thường
                  />
                  <FaSearch
                    className="semantic-search-icon"
                    // Đã bỏ onClick
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* --- LIST MOVIES --- */}
      <Container className="py-5">
        <h3 className="movie-title-section">
          {selectedGenre
            ? `Thể loại: ${selectedGenre.name}`
            : selectedActor
            ? `Diễn viên: ${selectedActor.fullname}`
            : selectedDirector
            ? `Đạo diễn: ${selectedDirector.fullname}`
            : searchTerm
            ? `Kết quả tìm kiếm: "${searchTerm}"`
            : "Danh sách phim mới"}
        </h3>

        <Row>
          {movies.length > 0 ? (
            movies.map((movie) => (
              <Col xs={6} md={4} lg={3} className="mb-4" key={movie.movie_id}>
                <Card className="movie-card h-100 border-0 shadow-sm">
                  <Link
                    to={`/detail/${movie.movie_id}`}
                    className="movie-img-wrapper"
                  >
                    <Card.Img
                      variant="top"
                      src={movie.poster_url || "https://placehold.co/200x300"}
                      className="movie-img"
                      alt={movie.title}
                    />
                  </Link>

                  <Card.Body className="d-flex flex-column p-2">
                    <Card.Title
                      className="fs-6 fw-bold text-truncate movie-name"
                      title={movie.title}
                    >
                      {movie.title}
                    </Card.Title>

                    <div className="small text-muted mb-2">
                      {movie.duration
                        ? `${movie.duration} phút`
                        : "Đang cập nhật"}
                    </div>

                    <div className="mt-auto">
                      <Link
                        to={`/detail/${movie.movie_id}`}
                        className="btn btn-book w-100 btn-sm fw-bold"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <div className="text-center text-secondary py-5 w-100">
              <h5>Không tìm thấy phim nào phù hợp.</h5>
            </div>
          )}
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;
