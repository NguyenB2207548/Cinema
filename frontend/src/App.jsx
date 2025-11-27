import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

// --- IMPORT USER COMPONENTS ---
import Header from "./user/component/Header.jsx";
import HomePage from "./user/page/HomePage.jsx";
import Register from "./user/page/Register.jsx";
import Login from "./user/page/Login.jsx";

// --- IMPORT ADMIN COMPONENTS ---
import AdminLayout from "./admin/AdminLayout.jsx";
import DashboardHome from "./admin/DashboardHome.jsx";

// --- TẠO LAYOUT CHO USER (Header + Nội dung) ---
const UserLayout = () => {
  return (
    <>
      <Header /> {/* Header này chỉ hiện ở trang User */}
      <Outlet /> {/* Nơi hiển thị HomePage, Login, Register... */}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardHome />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
