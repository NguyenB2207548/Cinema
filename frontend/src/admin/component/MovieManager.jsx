import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Pagination,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaImage,
} from "react-icons/fa";
import "../css/Manager.css";

const MovieManager = () => {
  // --- STATE DỮ LIỆU CHÍNH ---
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- STATE DỮ LIỆU PHỤ TRỢ (Cho Modal) ---
  const [genresList, setGenresList] = useState([]);
  const [actorsList, setActorsList] = useState([]);
  const [directorsList, setDirectorsList] = useState([]);

  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // --- STATE FORM THÊM MỚI ---
  // 1. Dữ liệu text
  const [newMovie, setNewMovie] = useState({
    title: "",
    description: "",
    duration: "",
    release_date: "",
    genre_ids: [],
    actor_ids: [],
    director_ids: [],
  });

  // 2. Dữ liệu File ảnh
  const [posterFile, setPosterFile] = useState(null); // File object để gửi lên server
  const [posterPreview, setPosterPreview] = useState(null); // URL blob để preview ảnh

  // ==========================================
  // 1. LẤY DỮ LIỆU PHỤ TRỢ
  // ==========================================
  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [resGenres, resActors, resDirectors] = await Promise.all([
          fetch("http://localhost:3000/api/genre"),
          fetch("http://localhost:3000/api/actor"),
          fetch("http://localhost:3000/api/director"),
        ]);

        const genres = await resGenres.json();
        const actors = await resActors.json();
        const directors = await resDirectors.json();

        setGenresList(genres.data || (Array.isArray(genres) ? genres : []));
        setActorsList(actors.data || (Array.isArray(actors) ? actors : []));
        setDirectorsList(
          directors.data || (Array.isArray(directors) ? directors : [])
        );
      } catch (err) {
        console.error("Lỗi tải danh sách phụ trợ:", err);
      }
    };

    fetchAuxData();
  }, []);

  // ==========================================
  // 2. HÀM GỌI API LẤY DANH SÁCH PHIM
  // ==========================================
  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: query,
      });

      const response = await fetch(
        `http://localhost:3000/api/cinema?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Lỗi tải dữ liệu");

      const result = await response.json();
      setMovies(result.data);
      setTotalPages(result.meta.total_pages);
      setTotalItems(result.meta.total_items);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, query]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // ==========================================
  // 3. XỬ LÝ SỰ KIỆN TÌM KIẾM
  // ==========================================
  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      setQuery(searchTerm);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  // ==========================================
  // 4. XỬ LÝ FORM & FILE UPLOAD
  // ==========================================
  const handleShowModal = () => {
    // Reset toàn bộ state form
    setNewMovie({
      title: "",
      description: "",
      duration: "",
      release_date: "",
      genre_ids: [],
      actor_ids: [],
      director_ids: [],
    });
    setPosterFile(null);
    setPosterPreview(null);
    setModalError("");
    setModalSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMovie({ ...newMovie, [name]: value });
  };

  // --- XỬ LÝ CHỌN FILE ẢNH ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPosterFile(file);
      // Tạo URL tạm thời để hiển thị preview
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleMultiSelectChange = (e, field, id) => {
    const isChecked = e.target.checked;
    setNewMovie((prev) => {
      const currentList = prev[field];
      if (isChecked) {
        return { ...prev, [field]: [...currentList, id] };
      } else {
        return {
          ...prev,
          [field]: currentList.filter((itemId) => itemId !== id),
        };
      }
    });
  };

  // --- GỬI FORM DATA (MULTIPART) ---
  const handleCreateMovie = async () => {
    setModalError("");
    setModalSuccess("");

    if (!newMovie.title || !newMovie.duration || !newMovie.release_date) {
      setModalError("Vui lòng nhập các trường bắt buộc (*)");
      return;
    }

    if (!posterFile) {
      setModalError("Vui lòng chọn ảnh poster cho phim");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // 1. Tạo FormData thay vì JSON
      const formData = new FormData();
      formData.append("title", newMovie.title);
      formData.append("description", newMovie.description);
      formData.append("duration", newMovie.duration);
      formData.append("release_date", newMovie.release_date);

      // Với mảng, ta cần append từng phần tử hoặc stringify tùy backend xử lý
      // Cách chuẩn thường dùng:
      newMovie.genre_ids.forEach((id) => formData.append("genre_ids", id));
      newMovie.actor_ids.forEach((id) => formData.append("actor_ids", id));
      newMovie.director_ids.forEach((id) =>
        formData.append("director_ids", id)
      );

      // Append File
      formData.append("poster", posterFile);

      // 2. Gửi Request
      // LƯU Ý: KHÔNG set 'Content-Type': 'application/json'
      // Để browser tự động set boundary cho multipart/form-data
      const response = await fetch("http://localhost:3000/api/cinema/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Thêm phim thất bại");
      }

      setModalSuccess("Thêm phim thành công! Hệ thống đang xử lý AI Index...");
      setTimeout(() => {
        handleCloseModal();
        fetchMovies();
      }, 1500);
    } catch (error) {
      setModalError(error.message);
    }
  };

  return (
    <div className="manager-container p-3">
      {/* HEADER & TOOLBAR */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold m-0">Quản lý phim</h3>
          <small className="text-muted">Tổng số: {totalItems} phim</small>
        </div>
        <div className="d-flex gap-2">
          <div className="search-box">
            <FaSearch className="search-icon-inside" />
            <input
              type="text"
              placeholder="Tìm tên phim..."
              className="search-input-custom"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchEnter}
            />
          </div>
          <Button
            variant="dark"
            className="btn-add-new"
            onClick={handleShowModal}
          >
            <FaPlus className="me-2" /> Thêm phim mới
          </Button>
        </div>
      </div>

      {/* TABLE HIỂN THỊ */}
      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <Table hover className="align-middle">
          <thead className="bg-light">
            <tr>
              <th style={{ width: "50px" }}>ID</th>
              <th style={{ width: "80px" }}>Poster</th>
              <th style={{ width: "30%" }}>Tên phim</th>
              <th>Thời lượng</th>
              <th>Thể loại</th>
              <th>Ngày chiếu</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : movies.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Chưa có phim nào.
                </td>
              </tr>
            ) : (
              movies.map((movie, index) => (
                <tr key={movie.movie_id}>
                  <td className="fw-bold text-muted">{index + 1}</td>
                  <td>
                    <img
                      src={`http://localhost:3000${movie.poster_url}`}
                      alt="poster"
                      style={{
                        width: "50px",
                        height: "75px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  </td>
                  <td>
                    <div className="fw-bold text-primary">{movie.title}</div>
                    <div
                      className="small text-muted text-truncate"
                      style={{ maxWidth: "200px" }}
                    >
                      {movie.description}
                    </div>
                  </td>
                  <td>{movie.duration} phút</td>
                  <td>
                    {movie.genres ? (
                      movie.genres.split(", ").map((g, idx) => (
                        <Badge
                          bg="light"
                          text="dark"
                          className="border me-1"
                          key={idx}
                        >
                          {g}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted small">--</span>
                    )}
                  </td>
                  <td>
                    {new Date(movie.release_date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button variant="outline-dark" size="sm">
                        <FaEdit />
                      </Button>
                      <Button variant="outline-danger" size="sm">
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.Prev
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages)].map((_, idx) => (
                <Pagination.Item
                  key={idx + 1}
                  active={idx + 1 === currentPage}
                  onClick={() => handlePageChange(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </div>

      {/* --- MODAL THÊM PHIM MỚI --- */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Thêm phim mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}

          <Form>
            <Row>
              <Col md={8}>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Tên phim <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={newMovie.title}
                        onChange={handleInputChange}
                        placeholder="Nhập tên phim"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Thời lượng (phút) <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="duration"
                        value={newMovie.duration}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Ngày phát hành <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="release_date"
                        value={newMovie.release_date}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>

              {/* CỘT TẢI ẢNH POSTER */}
              <Col md={4}>
                <Form.Group className="mb-3 text-center">
                  <Form.Label className="d-block fw-bold">
                    Poster Phim <span className="text-danger">*</span>
                  </Form.Label>

                  {/* Khu vực preview ảnh */}
                  <div
                    className="poster-preview-box border rounded mb-2 d-flex align-items-center justify-content-center bg-light"
                    style={{
                      height: "200px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {posterPreview ? (
                      <img
                        src={posterPreview}
                        alt="Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div className="text-muted text-center">
                        <FaImage size={40} className="mb-2" />
                        <p className="small m-0">Chưa có ảnh</p>
                      </div>
                    )}
                  </div>

                  {/* Nút upload file */}
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* --- KHU VỰC CHỌN NHIỀU (MULTI-SELECT) --- */}
            <Row>
              <Col md={4}>
                <Form.Label className="fw-bold">Chọn Thể loại</Form.Label>
                <div
                  className="border p-2 rounded bg-white"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {genresList.map((g) => (
                    <Form.Check
                      key={g.genre_id}
                      type="checkbox"
                      label={g.name}
                      checked={newMovie.genre_ids.includes(g.genre_id)}
                      onChange={(e) =>
                        handleMultiSelectChange(e, "genre_ids", g.genre_id)
                      }
                    />
                  ))}
                </div>
              </Col>
              <Col md={4}>
                <Form.Label className="fw-bold">Chọn Đạo diễn</Form.Label>
                <div
                  className="border p-2 rounded bg-white"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {directorsList.map((d) => (
                    <Form.Check
                      key={d.director_id}
                      type="checkbox"
                      label={d.fullname}
                      checked={newMovie.director_ids.includes(d.director_id)}
                      onChange={(e) =>
                        handleMultiSelectChange(
                          e,
                          "director_ids",
                          d.director_id
                        )
                      }
                    />
                  ))}
                </div>
              </Col>
              <Col md={4}>
                <Form.Label className="fw-bold">Chọn Diễn viên</Form.Label>
                <div
                  className="border p-2 rounded bg-white"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {actorsList.map((a) => (
                    <Form.Check
                      key={a.actor_id}
                      type="checkbox"
                      label={a.fullname}
                      checked={newMovie.actor_ids.includes(a.actor_id)}
                      onChange={(e) =>
                        handleMultiSelectChange(e, "actor_ids", a.actor_id)
                      }
                    />
                  ))}
                </div>
              </Col>
            </Row>

            <Form.Group className="mb-3 mt-3">
              <Form.Label>Mô tả nội dung</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newMovie.description}
                onChange={handleInputChange}
                placeholder="Tóm tắt nội dung phim..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button
            variant="dark"
            onClick={handleCreateMovie}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            <FaSave className="me-2" /> Lưu phim
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MovieManager;
