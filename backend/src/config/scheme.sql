CREATE DATABASE IF NOT EXISTS movie;

-- Chọn database để sử dụng
USE movie;

-- 1. Bảng user (Người dùng)
CREATE TABLE user (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng actor (Diễn viên)
CREATE TABLE actor (
    actor_id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(255) NOT NULL,
    nationality VARCHAR(100)
);

-- 3. Bảng director (Đạo diễn)
CREATE TABLE director (
    director_id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(255) NOT NULL,
    nationality VARCHAR(100)
);

-- 4. Bảng genre (Thể loại)
CREATE TABLE genre (
    genre_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 5. Bảng movie (Phim)
CREATE TABLE movie (
    movie_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT, -- Thời lượng phim tính bằng phút
    release_date DATE,
    poster_url VARCHAR(255),
    external_ai_id VARCHAR(100) UNIQUE -- Có thể dùng để lưu ID từ nguồn bên ngoài
);

-- 6. Bảng cinema_room (Phòng chiếu)
CREATE TABLE cinema_room (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    room_name VARCHAR(100) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    description VARCHAR(255)
);

-- 7. Bảng show_time (Suất chiếu)
CREATE TABLE show_time (
    show_time_id INT PRIMARY KEY AUTO_INCREMENT,
    movie_id INT NOT NULL,
    room_id INT NOT NULL,
    booking_time DATETIME NOT NULL, -- Thời điểm mở bán vé
    start_time DATETIME NOT NULL, -- Thời gian bắt đầu suất chiếu
    end_time DATETIME NOT NULL,   -- Thời gian kết thúc suất chiếu
    price DECIMAL(10, 2) NOT NULL, -- Giá vé cơ bản
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES cinema_room(room_id) ON DELETE CASCADE,
    -- Ràng buộc: Một phòng không thể chiếu 2 phim cùng một lúc
    CONSTRAINT uc_showtime UNIQUE (room_id, start_time) 
);

-- 8. Bảng seat (Ghế)
CREATE TABLE seat (
    seat_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    row_seat CHAR(2) NOT NULL, -- Hàng ghế (A, B, C,...)
    seat_number INT NOT NULL, -- Số ghế (1, 2, 3,...)
    type VARCHAR(50) DEFAULT 'Standard', -- Loại ghế ('Standard', 'VIP', 'Couple')
    FOREIGN KEY (room_id) REFERENCES cinema_room(room_id) ON DELETE CASCADE,
    -- Ràng buộc: Số ghế phải duy nhất trong một phòng
    CONSTRAINT uc_seat UNIQUE (room_id, row_seat, seat_number)
);

-- 9. Bảng ticket (Vé)
CREATE TABLE ticket (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL, -- người đặt
    show_time_id INT NOT NULL,
    seat_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Booked', -- Trạng thái: 'Booked', 'Paid', 'Cancelled'
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (show_time_id) REFERENCES show_time(show_time_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seat(seat_id) ON DELETE CASCADE,
    -- Ràng buộc: Một ghế trong một suất chiếu chỉ có thể được đặt một lần
    CONSTRAINT uc_unique_ticket UNIQUE (show_time_id, seat_id)
);

-- 10. Bảng movie_actor (Phim - Diễn viên)
CREATE TABLE movie_actor (
    movie_id INT NOT NULL,
    actor_id INT NOT NULL,
    PRIMARY KEY (movie_id, actor_id),
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actor(actor_id) ON DELETE CASCADE
);

-- 11. Bảng movie_director (Phim - Đạo diễn)
CREATE TABLE movie_director (
    movie_id INT NOT NULL,
    director_id INT NOT NULL,
    PRIMARY KEY (movie_id, director_id),
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (director_id) REFERENCES director(director_id) ON DELETE CASCADE
);

-- 12. Bảng movie_genre (Phim - Thể loại)
CREATE TABLE movie_genre (
    movie_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genre(genre_id) ON DELETE CASCADE
);

CREATE TABLE booking (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    show_time_id INT NOT NULL, -- Lưu để tiện query lịch sử đơn hàng
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_price DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Cancelled'
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (show_time_id) REFERENCES show_time(show_time_id) ON DELETE CASCADE
);

-- 1. Thêm cột booking_id
ALTER TABLE ticket ADD COLUMN booking_id INT NOT NULL AFTER ticket_id;

-- 2. Tạo liên kết khóa ngoại tới bảng booking
ALTER TABLE ticket ADD CONSTRAINT fk_ticket_booking 
FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE;

ALTER TABLE movie 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- 3. Thêm cột giá vé tại thời điểm mua (để sau này tăng giá vé không ảnh hưởng vé cũ)
ALTER TABLE ticket ADD COLUMN price DECIMAL(10, 2) NOT NULL AFTER seat_id;

-- 4. Xóa cột user_id (vì user đã gắn với booking)
-- Trước khi xóa, đảm bảo bạn đã clear data cũ hoặc migrate dữ liệu nếu cần
ALTER TABLE ticket DROP FOREIGN KEY ticket_ibfk_1; -- Tên FK này có thể khác tùy máy bạn (check bằng SHOW CREATE TABLE ticket)
ALTER TABLE ticket DROP COLUMN user_id;

-- 5. Xóa cột status (vì status giờ quản lý theo booking)
ALTER TABLE ticket DROP COLUMN status;
