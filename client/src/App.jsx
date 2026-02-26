import Menu from "./pages/Menu";
import { Routes, Route } from "react-router-dom";
import TrackOrder from "./pages/TrackOrder";
function App() {

  return (
    <>
      <Routes>
      <Route path="/menu/:tableId" element={<Menu />} />
      <Route path="/track/:orderId" element={<TrackOrder />} />
    </Routes>
    </>
  )
}

export default App
