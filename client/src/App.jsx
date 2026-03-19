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
      <Navbar
        onSearch={setSearch}
        allItems={menuItems}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/menu/1" />} />

        <Route
          path="/menu/:tableId"
          element={
            <Menu
              search={search}
              setMenuItems={setMenuItems}
            />
          }
        />

        <Route path="/track/:orderId" element={<TrackOrder />} />
        <Route path="/about/:tableId" element={<About />} />
      </Routes>
    </>
  );
}

export default App;