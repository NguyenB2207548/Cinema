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
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [genresList, setGenresList] = useState([]);
  const [actorsList, setActorsList] = useState([]);
  const [directorsList, setDirectorsList] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [newMovie, setNewMovie] = useState({
    title: "",
    description: "",
    duration: "",
    release_date: "",
    genre_ids: [],
    actor_ids: [],
    director_ids: [],
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);

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

  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      setQuery(searchTerm);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const resetModalState = () => {
    setEditingId(null);
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
  };

  const handleShowModal = () => {
    resetModalState();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    resetModalState();
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMovie({ ...newMovie, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPosterFile(file);
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

  const handleEdit = (movie) => {
    setEditingId(movie.movie_id);

    // Chuẩn hóa ngày phát hành sang định dạng YYYY-MM-DD
    const movieReleaseDate = movie.release_date.split("T")[0];

    // Tạo mảng tên từ chuỗi tên (VD: "Action, Drama" -> ["Action", "Drama"])
    const genreNames = movie.genres ? movie.genres.split(", ") : [];
    const actorNames = movie.actors ? movie.actors.split(", ") : [];
    const directorNames = movie.directors ? movie.directors.split(", ") : [];

    // Chuyển đổi tên sang ID bằng cách đối chiếu với danh sách phụ trợ
    const currentGenreIds = genresList
      .filter((g) => genreNames.includes(g.name))
      .map((g) => g.genre_id);

    const currentActorIds = actorsList
      .filter((a) => actorNames.includes(a.fullname))
      .map((a) => a.actor_id);

    const currentDirectorIds = directorsList
      .filter((d) => directorNames.includes(d.fullname))
      .map((d) => d.director_id);

    setNewMovie({
      title: movie.title || "",
      description: movie.description || "",
      duration: movie.duration || "",
      release_date: movieReleaseDate || "",
      genre_ids: currentGenreIds,
      actor_ids: currentActorIds,
      director_ids: currentDirectorIds,
    });
    setPosterFile(null);
    setPosterPreview(
      movie.poster_url ? `http://localhost:3000${movie.poster_url}` : null
    );
    setShowModal(true);
  };

  const handleSaveMovie = async () => {
    setModalError("");
    setModalSuccess("");

    if (!newMovie.title || !newMovie.duration || !newMovie.release_date) {
      setModalError("Vui lòng nhập các trường bắt buộc (*)");
      return;
    }

    // Khi cập nhật (editingId tồn tại), không bắt buộc phải tải file mới
    // Khi thêm mới (editingId null), bắt buộc phải có file
    if (!editingId && !posterFile) {
      setModalError("Vui lòng chọn ảnh poster cho phim");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("title", newMovie.title);
      formData.append("description", newMovie.description);
      formData.append("duration", newMovie.duration);
      formData.append("release_date", newMovie.release_date);

      // Backend xử lý các mảng ID được append riêng lẻ
      newMovie.genre_ids.forEach((id) => formData.append("genre_ids", id));
      newMovie.actor_ids.forEach((id) => formData.append("actor_ids", id));
      newMovie.director_ids.forEach((id) =>
        formData.append("director_ids", id)
      );

      // Chỉ append file nếu người dùng chọn file mới (posterFile có giá trị)
      // Nếu là edit và posterFile là null, backend sẽ giữ lại poster cũ (do logic COALESCE)
      if (posterFile) {
        formData.append("poster", posterFile);
      }

      const url = editingId
        ? `http://localhost:3000/api/cinema/update/${editingId}`
        : "http://localhost:3000/api/cinema/add";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // KHÔNG set Content-Type, để trình duyệt tự động thiết lập boundary cho FormData
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (editingId ? "Cập nhật phim thất bại" : "Thêm phim thất bại")
        );
      }

      setModalSuccess(
        editingId
          ? "Cập nhật phim thành công!"
          : "Thêm phim thành công! Hệ thống đang xử lý AI Index..."
      );

      setTimeout(() => {
        handleCloseModal();
        fetchMovies();
      }, 1500);
    } catch (error) {
      setModalError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phim này không?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:3000/api/cinema/delete/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Xóa phim thất bại");
        }

        alert("Xóa phim thành công!");
        fetchMovies();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="manager-container p-3">
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
                  <td className="fw-bold text-muted">
                    {index + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
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
                      <Button
                        variant="outline-dark"
                        size="sm"
                        onClick={() => handleEdit(movie)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(movie.movie_id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

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

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {editingId ? "Chỉnh sửa phim" : "Thêm phim mới"}
          </Modal.Title>
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

              <Col md={4}>
                <Form.Group className="mb-3 text-center">
                  <Form.Label className="d-block fw-bold">
                    Poster Phim <span className="text-danger">*</span>
                  </Form.Label>

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

                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

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
            onClick={handleSaveMovie}
            style={{ backgroundColor: "#1a2236", border: "none" }}
          >
            <FaSave className="me-2" />
            {editingId ? "Lưu thay đổi" : "Lưu phim"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MovieManager;
