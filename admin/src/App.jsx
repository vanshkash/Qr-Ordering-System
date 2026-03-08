import { useEffect, useState, useRef } from "react";
import newOrderSound from "./assets/new-order.mp3";
function App() {
  const audioRef = useRef(null);
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
          const start = oldOrder.items.length;
          const end = order.items.length;

          if (!newHighlights[order._id]) {
            newHighlights[order._id] = [];
          }

          newHighlights[order._id].push({ start, end });
        }
      });

      setHighlightMap((prev) => {
        const updated = { ...prev };

        Object.keys(newHighlights).forEach((id) => {
          updated[id] = [
            ...(updated[id] || []),
            ...newHighlights[id],
          ];
        });

        return updated;
      });
    }

    // 🔔 Detect brand new orders
    if (previousOrdersRef.current.length > 0) {
      const oldIds = previousOrdersRef.current.map(o => o._id);

      const newPendingOrder = data.find(o =>
        !oldIds.includes(o._id) && o.status === "pending"
      );

      if (newPendingOrder) {
        playNewOrderSound();
      }
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
      [id]: [],
    }));
  };
  const deleteOrder = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${id}`, {
        method: "DELETE",
      });

      // UI instantly update ho jaye
      setOrders((prev) => prev.filter((order) => order._id !== id));

    } catch (error) {
      console.error("Delete failed:", error);
    }
  };
  const playNewOrderSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => { });
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-red-600 text-white";
      case "preparing":
        return "bg-blue-300 text-blue-800";
      case "ready":
        return "bg-green-300 text-green-800";
      case "confirmed":
        return "bg-orange-300 text-orange-800";
      case "completed":
        return "bg-purple-300 text-purple-800";
      case "cancelled":
        return "bg-red-300 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCardStyle = (status) => {
    switch (status) {
      case "pending":
        return "bg-red-50 border-2 border-red-600 shadow-xl scale-[1.02]";
      case "confirmed":
        return "bg-orange-100 border-2 border-orange-500";
      case "preparing":
        return "bg-blue-100 border-2 border-blue-500";
      case "ready":
        return "bg-green-100 border-2 border-green-500";
      case "completed":
        return "bg-purple-100 border-2 border-purple-500 opacity-70";
      case "cancelled":
        return "bg-red-100 border-2 border-red-500 opacity-60";
      default:
        return "bg-white";
    }
  };

  const groupedOrders = {
    pending: orders.filter(o => o.status === "pending"),
    preparing: orders.filter(o => o.status === "preparing"),
    ready: orders.filter(o => o.status === "ready"),
    confirmed: orders.filter(o => o.status === "confirmed"),
    completed: orders.filter(o => o.status === "completed"),
    cancelled: orders.filter(o => o.status === "cancelled"),
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <audio ref={audioRef} src={newOrderSound} preload="auto" />
      <h1 className="text-2xl font-bold mb-6">
        Kitchen Dashboard 🍽
      </h1>
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold mb-2">
            No Orders Yet
          </h2>
          <p className="text-gray-500">
            Waiting for customers to place orders...
          </p>
        </div>
      )}

      {/* 🔥 ACTIVE WORKFLOW COLUMNS */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

          {["pending", "confirmed", "preparing", "ready"].map((status) => {
            const ordersList = groupedOrders[status];

            return (
              <div key={status} className="bg-gray-200 rounded-lg p-4 min-h-[400px]">
                <h2 className="text-lg font-bold mb-4 capitalize text-center">
                  {status} ({ordersList.length})
                </h2>

                <div className="space-y-4">

                  {ordersList.map((order) => (
                    <div
                      key={order._id}
                      className={`p-4 rounded-lg shadow relative transition-all duration-300
${getCardStyle(order.status)}
${openStatusId === order._id ? "z-50" : "z-0"}
`}
                    >

                      {order.status === "pending" && (
                        <div className="absolute -top-3 -left-3 bg-red-700 text-white text-xs px-3 py-1 rounded-full animate-pulse shadow-lg">
                          🚨 NEW
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">
                          Table: {order.table}
                        </h3>

                        <span className="text-sm font-semibold bg-gray-200 px-2 py-1 rounded">
                          Order ID: {order.orderId}
                        </span>
                      </div>

                      <div className="mt-2">
                        {order.items.map((item, index) => {
                          const highlightRanges = highlightMap[order._id] || [];

                          const isNew = highlightRanges.some(
                            (range) => index >= range.start && index < range.end
                          );

                          return (
                            <p
                              key={index}
                              className={`${isNew
                                ? "bg-yellow-200 text-red-700 font-bold px-2 rounded"
                                : ""
                                }`}
                            >
                              {item.name} x {item.qty}
                            </p>
                          );
                        })}
                      </div>

                      {(highlightMap[order._id] || []).length > 0 && (
                        <button
                          onClick={() => confirmOrder(order._id)}
                          className="bg-orange-500 text-white px-3 py-1 rounded mt-3 w-full"
                        >
                          Confirm New Items
                        </button>
                      )}

                      <div className="relative mt-4">
                        <button
                          onClick={() =>
                            setOpenStatusId(
                              openStatusId === order._id ? null : order._id
                            )
                          }
                          className="bg-black text-white px-3 py-1 rounded text-sm"
                        >
                          Change Status
                        </button>

                        {openStatusId === order._id && (
                          <div className="absolute mt-2 bg-white shadow-xl rounded-lg w-40 z-[999] border">
                            {["pending", "confirmed", "preparing", "ready", "completed", "cancelled"].map((s) => (
                              <div
                                key={s}
                                onClick={() => {
                                  updateStatus(order._id, s);
                                  setOpenStatusId(null);
                                }}
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                              >
                                {s}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  ))}

                </div>
              </div>
            );
          })}

        </div>)}

      {/* 🔥 COMPLETED & CANCELLED SECTION BELOW */}
      {orders.length > 0 && (
        <div className="bg-gray-300 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">
            Completed & Cancelled Orders
          </h2>
          <div className="bg-gray-300 rounded-lg p-6">


            {["completed", "cancelled"].map((status) => {
              const ordersList = groupedOrders[status];

              return (
                <div key={status}>
                  <h3 className="font-bold mb-3 capitalize">
                    {status} ({ordersList.length})
                  </h3>

                  <div className="space-y-3">
                    {ordersList.map((order) => (
                      <div
                        key={order._id}
                        className={`p-4 rounded-lg shadow relative ${getCardStyle(order.status)}`}
                      >
                        {/* Status Badge */}
                        <div className={`absolute top-3 right-3 px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </div>

                        <h4 className="font-bold mb-1">
                          Table: {order.table}
                        </h4>

                        <p className="text-sm text-gray-600 mb-2">
                          Order ID: {order.orderId}
                        </p>

                        {/* Items List */}
                        <div className="mt-2 space-y-1">
                          {order.items.map((item, index) => (
                            <p key={index} className="text-sm">
                              {item.name} x {item.qty}
                            </p>
                          ))}
                        </div>

                        {/* Delete Button */}

                        <button
                          onClick={() => deleteOrder(order._id)}

                          className="bg-red-600 text-white px-3 py-1 rounded text-sm w-full mt-4"
                        >
                          Delete Order
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>
        </div>)}

    </div>
  );
}

export default App;