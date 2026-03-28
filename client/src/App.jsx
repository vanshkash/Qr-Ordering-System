import { useState } from "react";
import Menu from "./pages/Menu";
import { Routes, Route, Navigate } from "react-router-dom";
import TrackOrder from "./pages/TrackOrder";
import About from "./pages/About";
import Navbar from "./components/Navbar";

function App() {

  const [search, setSearch] = useState("");
  const [menuItems, setMenuItems] = useState([]);

  return (
    <>

      <Routes>

  <Route path="/" element={<Navigate to="/menu/1" />} />

  <Route
    path="/menu/:tableId"
    element={
      <>
        <Navbar onSearch={setSearch} allItems={menuItems} />
        <Menu search={search} setMenuItems={setMenuItems} />
      </>
    }
  />

  <Route
    path="/about/:tableId"
    element={
      <>
        <Navbar onSearch={setSearch} allItems={menuItems} />
        <About />
      </>
    }
  />

  <Route path="/track/:orderId" element={<TrackOrder />} />

</Routes>
    </>
  );
}

export default App;