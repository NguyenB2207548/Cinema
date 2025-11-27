import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

// --- IMPORT USER COMPONENTS ---
import Header from "./user/component/Header.jsx";
import HomePage from "./user/page/HomePage.jsx";
import Register from "./user/page/Register.jsx";
import Login from "./user/page/Login.jsx";

// --- IMPORT ADMIN COMPONENTS ---
import AdminLayout from "./admin/AdminLayout.jsx";
import DashboardHome from "./admin/DashboardHome.jsx";
import UserManager from "./admin/component/UserManager.jsx";
import MovieManager from "./admin/component/MovieManager.jsx";
import ShowTimeManager from "./admin/component/ShowTimeManager.jsx";
import RoomManager from "./admin/component/RoomManager.jsx";
import GenreManager from "./admin/component/GenreManager.jsx";
import ActorManager from "./admin/component/ActorManager.jsx";
import DirectorManager from "./admin/component/DirectorManager.jsx";

const UserLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
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
          <Route path="users" element={<UserManager />} />
          <Route path="movies" element={<MovieManager />} />
          <Route path="shows" element={<ShowTimeManager />} />
          <Route path="rooms" element={<RoomManager />} />
          <Route path="genres" element={<GenreManager />} />
          <Route path="actors" element={<ActorManager />} />
          <Route path="directors" element={<DirectorManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
