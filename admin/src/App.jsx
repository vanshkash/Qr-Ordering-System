import { useEffect, useState, useRef } from "react";
import newOrderSound from "./assets/new-order.mp3";
function App() {
  const audioRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const previousOrdersRef = useRef([]);
  const [openStatusId, setOpenStatusId] = useState(null);
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const [menu, setMenu] = useState([]);
  const [showStockManager, setShowStockManager] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [toast, setToast] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [hasVariants, setHasVariants] = useState(false);
  const [, setTick] = useState(0);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [orderToUpdate, setOrderToUpdate] = useState(null);
  const [kitchenStatus, setKitchenStatus] = useState(
    localStorage.getItem("kitchenStatus") || "online"
  );
  const markItemReady = async (orderId, itemIndex) => {

    await fetch(`${BASE_URL}/api/orders/${orderId}/item-ready`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ itemIndex })
    });

    fetchOrders();

  };
  const markItemServed = async (orderId, itemIndex) => {

    await fetch(`${BASE_URL}/api/orders/${orderId}/item-served`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ itemIndex })
    });

    fetchOrders();

  };
  const toggleKitchen = async () => {

    const newStatus = kitchenStatus === "online"
      ? "offline"
      : "online";

    await fetch(`${BASE_URL}/api/kitchen-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: newStatus
      })
    });

    setKitchenStatus(newStatus);
  };

  const [variants, setVariants] = useState([
    { type: "", price: "" }
  ]);

  const categories = [
    "Starters",
    "Fries",
    "Drinks",
    "Main Course",
    "Dessert",
    "Other"
  ];

  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    price: "",
    image: ""
  });
  const [newCategory, setNewCategory] = useState("");

  const fetchOrders = async () => {
    const res = await fetch(`${BASE_URL}/api/orders`);
    const data = await res.json();


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

  const fetchMenu = async () => {

    const res = await fetch(`${BASE_URL}/api/menu`);
    const data = await res.json();

    setMenu(data);

  };
  const toggleStock = async (id) => {

    await fetch(`${BASE_URL}/api/menu/${id}/toggle-stock`, {
      method: "PUT"
    });

    fetchMenu();

  };
  const validateImageUrl = (url) => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);

      img.src = url;
    });
  };

  const addVariantField = () => {
    setVariants([...variants, { type: "", price: "" }]);
  };
  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };
  const addItem = async () => {

    const categoryToSave =
      newItem.category === "Other"
        ? newCategory
        : newItem.category;

    if (!newItem.name || !categoryToSave || !newItem.image) {
      alert("All fields required");
      return;
    }

    if (!hasVariants && !newItem.price) {
      alert("Price required");
      return;
    }

    if (hasVariants) {
      for (let v of variants) {
        if (!v.type || !v.price) {
          alert("Fill all variant fields");
          return;
        }
      }
    }

    try {

      const res = await fetch(`${BASE_URL}/api/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newItem.name,
          category: categoryToSave,
          image: newItem.image,
          price: hasVariants ? undefined : newItem.price,
          variants: hasVariants ? variants : []
        })
      });

      if (!res.ok) {
        throw new Error("Failed to add item");
      }

      // 🔥 MENU RELOAD
      await fetchMenu();

      // 🔥 RESET FORM
      setNewItem({
        name: "",
        category: "",
        price: "",
        image: ""
      });
      setHasVariants(false);
      setVariants([{ type: "", price: "" }]);

      setNewCategory("");
      setImagePreview("");
      setImageError(false);

      // 🔥 CLOSE MODAL
      setShowAddItem(false);

      // 🔥 SUCCESS TOAST
      setToast("Item added successfully ✅");
      setTimeout(() => setToast(null), 2500);

    } catch (error) {
      alert("Error adding item");
    }

  };
  const deleteItem = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };
  const confirmDeleteItem = async () => {

    if (!itemToDelete) return;

    await fetch(`${BASE_URL}/api/menu/${itemToDelete._id}`, {
      method: "DELETE"
    });

    fetchMenu();

    setToast("Item deleted successfully 🗑️");
    setTimeout(() => setToast(null), 2000);

    setShowDeleteModal(false);
    setItemToDelete(null);

  };

  useEffect(() => {

    fetchOrders();

    const interval = setInterval(fetchOrders, 4000);

    return () => clearInterval(interval);

  }, []);

  const updateStatus = async (id, status) => {

    // ⭐ save stage start time
    const stageTimes = JSON.parse(localStorage.getItem("stageTimes") || "{}");

    stageTimes[id] = new Date().toISOString();

    localStorage.setItem("stageTimes", JSON.stringify(stageTimes));

    await fetch(`${BASE_URL}/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    fetchOrders();
  };
 const markPaid = async (id) => {

  try {

    await fetch(`${BASE_URL}/api/orders/${id}/mark-paid`, {
      method: "PUT"
    });

    // ⭐ force ready state
    await fetch(`${BASE_URL}/api/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "ready" })
    });

    fetchOrders();

    setToast("Payment Completed 💳");

    setTimeout(() => setToast(null), 2000);

    // ⭐ AUTO COMPLETE AFTER 4 SEC
    setTimeout(async () => {

      await fetch(`${BASE_URL}/api/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "completed" })
      });

      fetchOrders();

    }, 4000);

  } catch (error) {

    console.error("Payment update failed", error);

  }

};

  const confirmItem = async (orderId, itemIndex) => {

  await fetch(`${BASE_URL}/api/orders/${orderId}/confirm-item`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ itemIndex })
  });

  fetchOrders();

};
  const deleteOrder = async (id) => {
    try {
      await fetch(`${BASE_URL}/api/orders/${id}`, {
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
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const getElapsedTime = (date) => {
    const now = new Date();
    const orderTime = new Date(date);

    const diff = Math.floor((now - orderTime) / 60000); // minutes

    return diff;
  };
  const getStageStartTime = (order) => {

    const stageTimes = JSON.parse(localStorage.getItem("stageTimes") || "{}");

    if (stageTimes[order._id]) {
      return stageTimes[order._id];
    }

    return order.createdAt;
  };
  const getTimerLabel = (status) => {
    switch (status) {
      case "pending":
        return "Waiting";
      case "confirmed":
        return "Accepted";
      case "preparing":
        return "Cooking";
      case "ready":
        return "Ready";
      default:
        return "Time";
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000); // every minute

    return () => clearInterval(interval);
  }, []);

  const confirmStatusUpdate = async () => {
    if (!orderToUpdate || !statusAction) return;

    await updateStatus(orderToUpdate, statusAction);

    setShowStatusModal(false);
    setOrderToUpdate(null);
    setStatusAction(null);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {toast && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-xl z-50 animate-bounce">
          {toast}
        </div>
      )}
      <audio ref={audioRef} src={newOrderSound} preload="auto" />
      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">
          Kitchen Dashboard 🍽
        </h1>

        <div className="flex items-center gap-3">
          <div className="flex flex-wrap gap-3 md:flex-nowrap">

            <span className="font-semibold text-sm">
              {kitchenStatus === "online" ? "Online" : "Offline"}
            </span>

            <div
              onClick={toggleKitchen}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300
      ${kitchenStatus === "online" ? "bg-green-500" : "bg-gray-400"}`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300
        ${kitchenStatus === "online" ? "translate-x-7" : "translate-x-0"}`}
              />
            </div>

          </div>

          <button
            onClick={() => setShowAddItem(true)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Add Item
          </button>

          <button
            onClick={() => {
              setShowStockManager(true);
              fetchMenu();
            }}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Manage Stock
          </button>

        </div>

      </div>
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
            let ordersToRender = ordersList;

            if (status === "preparing") {
              ordersToRender = orders.filter(o =>
                o.status === "preparing" &&
                o.items.some(i => !i.cookingReady)
              );
            }

            if (status === "ready") {
              ordersToRender = orders.filter(o =>
                o.status === "preparing" || o.status === "ready"
              ).filter(o =>
                o.items.some(i => i.cookingReady)
              );
            }

            return (
              <div key={status} className="bg-gray-200 rounded-lg p-4 min-h-[400px]">
                <h2 className="text-lg font-bold mb-4 capitalize text-center">
                  {status} ({ordersToRender.length})
                </h2>

                <div className="space-y-4">

                  {ordersToRender.map((order) => {
                    const allServed = order.items.every(i => i.served);
                    const readyItems = order.items.filter(
                      i => i.cookingReady && !i.served
                    );
                    const itemsToShow =
  status === "preparing"
    ? order.items
        .map((item, index) => ({ item, index }))
        .filter(obj => !obj.item.cookingReady)

    : status === "ready"
    ? order.items
        .map((item, index) => ({ item, index }))
        .filter(obj => obj.item.cookingReady)

    : order.items.map((item, index) => ({ item, index }));

                    return (

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
                        <div className="flex justify-between text-xs mt-1">

                          <span className="text-gray-500">
                            Ordered: {formatTime(order.createdAt)}
                          </span>

                          <span
                            className={`font-semibold ${getElapsedTime(getStageStartTime(order)) > 10
                              ? "text-red-600"
                              : "text-gray-600"
                              }`}
                          >
                            {getTimerLabel(order.status)}: {getElapsedTime(getStageStartTime(order))} min
                          </span>

                        </div>

                        <div className="mt-2">
                          <div className="mt-2">

                            {
                              itemsToShow.map(({ item, index }) => {

                                const isNewItem = !item.confirmed;

                                const isReady = item.cookingReady;

                                return (
                                  <div
                                    key={`${order._id}-${index}`}
                                    className={`flex justify-between items-center text-sm p-1 rounded
      ${isNewItem ? "bg-yellow-200 border border-yellow-500 animate-pulse" : ""}
`}
                                  >

                                    <span className="flex items-center gap-2">

                                      {status === "preparing" && !item.cookingReady && item.confirmed && (
  <button
    onClick={() => markItemReady(order._id, index)}
    className="bg-green-500 text-white text-xs px-2 py-1 rounded"
  >
    Ready
  </button>
)}

                                      <span className="flex items-center gap-1">

                                        {item.name} x {item.qty}
                                      </span>
                                      {status === "ready" && item.cookingReady && (
                                        <button
                                          disabled={item.served}
                                          onClick={() => markItemServed(order._id, index)}
                                          className={`text-xs px-2 py-1 rounded text-white
  ${item.served ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600"}`}
                                        >
                                          Served
                                        </button>
                                      )}
                                    </span>

                                    <div className="flex items-center gap-2">


                                      {isNewItem && (
                                        <button
  onClick={() => confirmItem(order._id, index)}
  className="bg-orange-500 text-white text-[10px] px-2 py-[2px] rounded"
>
  Confirm
</button>
                                      )}
                                      <span className="font-semibold">
                                        ₹{item.price * item.qty}
                                      </span>

                                    </div>

                                  </div>
                                );

                              })}
                          </div>
                        </div>
                        <div className="relative mt-4">
                          <div className="flex justify-between items-center mt-4">

                            <div className="flex gap-2 mt-2">

                              {order.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setOrderToUpdate(order._id);
                                      setStatusAction("confirmed");
                                      setShowStatusModal(true);
                                    }}
                                    className="bg-orange-500 text-white px-2 py-[3px] rounded text-xs flex-1"
                                  >
                                    Confirm
                                  </button>

                                  <button
                                    onClick={() => {
                                      setOrderToUpdate(order._id);
                                      setStatusAction("cancelled");
                                      setShowStatusModal(true);
                                    }}

                                    className="bg-red-500 text-white px-2 py-[3px] rounded text-xs flex-1"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}

                              {order.status === "confirmed" && (
                                <button
                                  onClick={() => updateStatus(order._id, "preparing")}
                                  className="bg-blue-500 text-white px-2 py-[3px] rounded text-xs w-full"
                                >
                                  Preparing
                                </button>
                              )}

                              {/* {order.status === "preparing" && (
                                <button
                                  disabled={readyItems.length === 0}
                                  onClick={() => updateStatus(order._id, "ready")}
                                  className={`px-2 py-[3px] rounded text-xs w-full
 ${readyItems.length === 0
                                      ? "bg-gray-300 cursor-not-allowed"
                                      : "bg-green-500 text-white"
                                    }`}
                                >
                                  Ready
                                </button>
                              )} */}

                              {order.status === "ready" && (
                                <button
                                  onClick={() => updateStatus(order._id, "completed")}
                                  className="bg-purple-600 text-white px-2 py-[3px] rounded text-xs w-full"
                                >
                                  Completed
                                </button>
                              )}

                            </div>

                            <span className="font-bold text-sm bg-gray-100 px-3 py-1 rounded">
                              Total:
                              ₹{order.items.reduce((t, i) => t + i.qty * i.price, 0)}
                            </span>

                          </div>
                          <div className="flex justify-between items-center mt-3">

                            <span className="text-sm font-semibold">
                              Bill:
                              <span
                                className={`ml-2 px-2 py-1 rounded text-xs font-bold ${order.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                  }`}
                              >
                                {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                              </span>
                            </span>

                            {status === "ready" && allServed && order.paymentStatus !== "paid" && (
                              <button
                                onClick={() => markPaid(order._id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                              >
                                Mark Paid
                              </button>
                            )}

                          </div>
                        </div>

                      </div>
                    );
                  })}

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
                        <p className="mt-2 text-sm font-semibold">
                          Payment Status:
                          <span className={
                            order.paymentStatus === "paid"
                              ? "text-green-600 ml-2"
                              : "text-red-600 ml-2"
                          }>
                            {order.paymentStatus}
                          </span>
                        </p>

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
      {showStockManager && (

        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

          <div className="bg-white w-[500px] max-h-[80vh] overflow-y-auto p-6 rounded-xl shadow-xl">

            <div className="flex justify-between mb-4">

              <h2 className="text-lg font-bold">
                Manage Stock
              </h2>

              <button
                onClick={() => setShowStockManager(false)}
                className="text-red-500 font-bold"
              >
                Close
              </button>

            </div>

            {menu.map(item => (

              <div
                key={item._id}
                className="flex justify-between items-center border-b py-3"
              >

                <div className="flex items-center gap-3">

                  <img
                    src={item.image || "https://via.placeholder.com/100"}
                    className="w-12 h-12 rounded object-cover"
                  />

                  <div>

                    <p className="font-semibold">
                      {item.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.variants?.length > 0
                        ? item.variants.map(v => `${v.type} ₹${v.price}`).join(" | ")
                        : `₹${item.price}`}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() => toggleStock(item._id)}
                  className={`px-3 py-1 rounded text-white ${item.available ? "bg-green-500" : "bg-red-500"
                    }`}
                >

                  {item.available ? "In Stock" : "Out Of Stock"}

                </button>
                <button
                  onClick={() => deleteItem(item)}
                  className="ml-2 bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>

              </div>

            ))}

          </div>

        </div>

      )}
      {showAddItem && (

        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

          <div className="bg-white w-[400px] p-6 rounded-xl shadow-xl">

            <h2 className="text-lg font-bold mb-4">
              Add New Item
            </h2>

            <input
              placeholder="Name"
              className="border p-2 w-full mb-3"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              required
            />

            <select
              className="border p-2 w-full mb-3"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              required
            >

              <option value="">Select Category</option>

              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}

            </select>
            {newItem.category === "Other" && (

              <input
                placeholder="Enter new category"
                className="border p-2 w-full mb-3"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
              />

            )}
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={() => setHasVariants(!hasVariants)}
              />
              This item has variants (Half / Full)
            </label>
            {!hasVariants && (
              <input
                placeholder="Price"
                className="border p-2 w-full mb-3"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              />
            )}
            {hasVariants && variants.map((v, i) => (

              <div key={i} className="flex gap-2 mb-2">

                <input
                  placeholder="Type (Half / Full)"
                  className="border p-2 w-1/2"
                  value={v.type}
                  onChange={(e) => updateVariant(i, "type", e.target.value)}
                />

                <input
                  placeholder="Price"
                  className="border p-2 w-1/2"
                  value={v.price}
                  onChange={(e) => updateVariant(i, "price", e.target.value)}
                />

              </div>

            ))}
            {hasVariants && (

              <button
                onClick={addVariantField}
                className="bg-gray-200 px-3 py-1 rounded mb-3"
              >

                + Add Variant

              </button>

            )}

            <input
              placeholder="Image URL"
              className="border p-2 w-full mb-3"
              value={newItem.image}
              onChange={(e) => {
                const url = e.target.value;

                setNewItem({ ...newItem, image: url });

                if (!url) {
                  setImagePreview("");
                  setImageError(false);
                  return;
                }

                const img = new Image();

                img.onload = () => {
                  setImagePreview(url);
                  setImageError(false);
                };

                img.onerror = () => {
                  setImagePreview("");
                  setImageError(true);
                };

                img.src = url;
              }}
              required
            />
            {imagePreview && (
              <img
                src={imagePreview}
                className="w-24 h-24 object-cover rounded mb-3 border"
              />
            )}

            {imageError && (
              <p className="text-red-500 text-sm mb-3">
                Invalid Image URL
              </p>
            )}

            <div className="flex justify-end gap-3">

              <button
                onClick={() => {
                  setShowAddItem(false);
                  setImagePreview("");
                  setImageError(false);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={addItem}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Add Item
              </button>

            </div>

          </div>

        </div>

      )}
      {showDeleteModal && (

        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

          <div className="bg-white w-[350px] p-6 rounded-xl shadow-xl text-center">

            <h2 className="text-lg font-bold mb-3">
              Delete Item
            </h2>

            <p className="mb-4 text-gray-600">
              Are you sure you want to delete
              <span className="font-bold"> {itemToDelete?.name} </span>?
            </p>

            <p className="text-sm text-red-500 mb-6">
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-4">

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>

            </div>

          </div>

        </div>

      )}
      {showStatusModal && (

        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

          <div className="bg-white w-[350px] p-6 rounded-xl shadow-xl text-center">

            <h2 className="text-lg font-bold mb-3">
              Confirm Action
            </h2>

            <p className="mb-4 text-gray-600">
              Are you sure you want to
              <span className="font-bold ml-1">
                {statusAction === "confirmed" ? "confirm this order" : "cancel this order"}?
              </span>
            </p>

            <div className="flex justify-center gap-4">

              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                No
              </button>

              <button
                onClick={confirmStatusUpdate}
                className={`px-4 py-2 text-white rounded ${statusAction === "confirmed" ? "bg-orange-500" : "bg-red-600"
                  }`}
              >
                Yes
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default App;