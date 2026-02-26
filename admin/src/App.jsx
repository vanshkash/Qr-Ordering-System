import { useEffect, useState, useRef } from "react";

function App() {
  const [toast, setToast] = useState(null);
  const [orders, setOrders] = useState([]);
  const [highlightMap, setHighlightMap] = useState({});
  const previousOrdersRef = useRef([]);
  const [openStatusId, setOpenStatusId] = useState(null);

  const fetchOrders = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders`);
    const data = await res.json();

    if (previousOrdersRef.current.length > 0) {
      const newHighlights = {};

      data.forEach((order) => {
        const oldOrder = previousOrdersRef.current.find(
          (o) => o._id === order._id
        );

        if (oldOrder && order.items.length > oldOrder.items.length) {
          newHighlights[order._id] = oldOrder.items.length; 
          // store index where new items start
        }
      });

      setHighlightMap((prev) => ({ ...prev, ...newHighlights }));
    }

    previousOrdersRef.current = data;
    setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    fetchOrders();
  };

  const confirmOrder = async (id) => {
  await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${id}/confirm-items`, {
    method: "PUT",
  });

  setHighlightMap((prev) => ({
    ...prev,
    [id]: null,
  }));
};

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "preparing":
      return "bg-blue-100 text-blue-800";
    case "ready":
      return "bg-green-100 text-green-800";
    case "confirmed":
      return "bg-purple-100 text-purple-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};



  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {toast && (
  <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-bounce">
    {toast}
  </div>
)}

      <h1 className="text-2xl font-bold mb-6">
        Kitchen Dashboard 🍽
      </h1>

      {orders.map((order) => {
        const newItemStartIndex = highlightMap[order._id];

        return (
          <div
  key={order._id}
  className="bg-white p-4 rounded-lg shadow mb-4 relative"
>

  {/* CURRENT STATUS BADGE */}
  <div
    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}
  >
    {order.status}
  </div>

  <h2 className="font-bold mb-2">
    Table: {order.table}
  </h2>
            

            <div className="mt-2">
              {order.items.map((item, index) => {
                const isNew =
                  newItemStartIndex !== null &&
                  newItemStartIndex !== undefined &&
                  index >= newItemStartIndex;

                return (
                  <p
                    key={index}
                    className={`${
                      isNew
                        ? "bg-yellow-200 text-red-700 font-bold animate-pulse px-2 rounded"
                        : ""
                    }`}
                  >
                    {item.name} x {item.qty}
                  </p>
                );
              })}
            </div>

            {newItemStartIndex !== null &&
              newItemStartIndex !== undefined && (
                <button
                  onClick={() => confirmOrder(order._id)}
                  className="bg-orange-500 text-white px-3 py-1 rounded mt-3"
                >
                  Confirm New Items
                </button>
              )}

            <div className="relative mt-4">

  {/* CHANGE BUTTON */}
  <button
    onClick={() =>
      setOpenStatusId(
        openStatusId === order._id ? null : order._id
      )
    }
    className="ml-3 bg-black text-white px-3 py-1 rounded text-sm"
  >
    Change Status
  </button>

  {/* DROPDOWN */}
  {openStatusId === order._id && (
    <div className="absolute mt-2 bg-white shadow-xl rounded-lg w-40 z-50 border transition-all duration-300">

      {["pending",  "confirmed", "preparing", "ready", "cancelled"].map((status) => (
        <div
          key={status}
          onClick={() => {
            updateStatus(order._id, status);
            setOpenStatusId(null);
          }}
          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${getStatusColor(status)}`}
        >
          {status}
        </div>
      ))}

    </div>
  )}
</div>
          </div>
        );
      })}
    </div>
  );
}

export default App;