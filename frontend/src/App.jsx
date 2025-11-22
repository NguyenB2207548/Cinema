import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./user/component/Header.jsx";
import HomePage from "./user/page/HomePage.jsx";
import Register from "./user/page/Register.jsx";
import Login from "./user/page/Login.jsx";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
