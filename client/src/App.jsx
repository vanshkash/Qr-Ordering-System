import Menu from "./pages/Menu";
import { Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import TrackOrder from "./pages/TrackOrder";
function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/menu/1" />} />
      <Route path="/menu/:tableId" element={<Menu />} />
      <Route path="/track/:orderId" element={<TrackOrder />} />
    </Routes>
    </>
  )
}

export default App
