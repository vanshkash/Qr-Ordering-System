import { useState, useEffect, useRef } from "react";
import MostOrdered from "../data/MostOrdered";
import FoodCard from "../components/FoodCard";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import confirmedSound from "../assets/confirmed.mp3";
import preparingSound from "../assets/confirmed.mp3";
import readySound from "../assets/ready.mp3";
import cancelledSound from "../assets/cancelled.mp3";
import WelcomeCard from "../components/WelcomeCard";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const getSessionId = () => {
  let id = localStorage.getItem("sessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
  }
  return id;
};
export default function Menu({ search, setMenuItems }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [showTracking, setShowTracking] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const { tableId } = useParams();
  const socketRef = useRef(null);
  const [menu, setMenu] = useState([]);
  const [kitchenClosed, setKitchenClosed] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showBillDrawer, setShowBillDrawer] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [highlightOrderBtn, setHighlightOrderBtn] = useState(false);
  const validItems = orderData?.items.filter(i => !i.rejected) || [];

  const readyCount = validItems.filter(i => i.cookingReady).length;
  const total = validItems.length;
  const lastShownStatusRef = useRef(null);
  const autoShowStatus = () => {
  setShowTracking(true);

  setTimeout(() => {
    setShowTracking(false);
  }, 3000);
};
  const getDisplayStatus = (order) => {
    if (!order) return "";
    const validItems = order.items.filter(i => !i.rejected);

    const total = validItems.length;
    const readyCount = validItems.filter(i => i.cookingReady).length;
    if (readyCount === 0) return order.status;
    if (readyCount === total) return "ready";
    return "partial";
  };
  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    const alreadyShown = sessionStorage.getItem("welcomeShown");

    if (!sessionId) return;

    fetch(`${BASE_URL}/api/orders/by-session/${sessionId}`)
      .then(res => res.json())
      .then(data => {

        if ((!data || data.status === "completed") && !alreadyShown) {
          setShowWelcome(true);

          //  mark as shown for this session
          sessionStorage.setItem("welcomeShown", "true");
        }

      })
      .catch(() => { });
  }, []);
  useEffect(() => {
    fetch(`${BASE_URL}/api/menu`)
      .then(res => res.json())
      .then(data => {
        setMenu(data);
        setMenuItems(data);
      });
  }, []);
  const groupedMenu = menu.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
  // Add to Cart
  const addToCart = (newItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (i) =>
          i.id === newItem.id &&
          i.note === newItem.note
      );

      if (existingItem) {
        return prevCart.map((i) =>
          i.id === newItem.id && i.note === newItem.note
            ? { ...i, qty: i.qty + newItem.qty }
            : i
        );
      } else {
        return [...prevCart, newItem];
      }

    });
    setHighlightOrderBtn(true);

  };

  const increaseQty = (id) => {
    setCart(cart.map((item) =>
      item.id === id ? { ...item, qty: item.qty + 1 } : item
    ));
  };
  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };
  const filteredData =
    search
      ? groupedMenu
      : activeCategory === "All"
        ? groupedMenu
        : { [activeCategory]: groupedMenu[activeCategory] || [] };
  const searchedData = Object.entries(filteredData)
    .map(([category, items]) => ({
      category,
      items: items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    }))
    .filter(category => category.items.length > 0);
  const totalSearchItems = searchedData.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );
  const placeOrder = async () => {
    if (placingOrder) return;
    if (cart.length === 0) return;
    setPlacingOrder(true);
    try {
      let response;
      if (!orderData) {
        response = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: Number(tableId),
            items: cart,
            sessionId: getSessionId()
          }),
        });
      } else {
        response = await fetch(
          `${BASE_URL}/api/orders/${orderData._id}/add-items`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cart }),
          }
        );
      }
      const updatedOrder = await response.json();

      if (!response.ok) {
        if (updatedOrder.message === "Kitchen is offline") {
          setKitchenClosed(true);
          setToast("Kitchen is currently closed 🔴");
          setTimeout(() => setToast(null), 2500);
        } else {
          setToast("Server Error ❌");
        }
        setPlacingOrder(false);
        return;
      }
      setOrderData(updatedOrder);
      setCart([]);
      setToast(orderData ? "Additional Items Sent" : "Order Placed Successfully");
      setPlacingOrder(false);
      setTimeout(() => setToast(null), 2500);
    } catch (error) {
      console.log(error);
      setPlacingOrder(false);
    }
  };
  const playStatusSound = (status) => {
    let sound;
    switch (status) {
      case "confirmed":
        sound = confirmedSound;
        break;
      case "preparing":
        sound = preparingSound;
        break;
      case "ready":
        sound = readySound;
        break;
      case "cancelled":
        sound = cancelledSound;
        break;
      default:
        return;
    }
    const audio = new Audio(sound);
    audio.play().catch(() => { });
    // VIBRATION
  if ("vibrate" in navigator) {
    switch (status) {
      case "confirmed":
        navigator.vibrate(100); // light
        break;

      case "preparing":
        navigator.vibrate([100, 50, 100]); // medium
        break;

      case "ready":
        navigator.vibrate([200, 100, 200]); // strong 
        break;

      case "cancelled":
        navigator.vibrate([300, 100, 300]); // alert
        break;
    }
  }
  };
  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) return;

    fetch(`${BASE_URL}/api/orders/by-session/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data._id) {
          setOrderData(data);
        }
      })
      .catch(() => { });
  }, []);
  useEffect(() => {

    socketRef.current = io(BASE_URL);
    socketRef.current.on("kitchenStatusUpdated", (status) => {
      if (status === "online") {
        setKitchenClosed(false);   
      } else {
        setKitchenClosed(true);    
      }
    });
    //  JOIN TABLE ROOM
    socketRef.current.emit("joinTable", Number(tableId));

    socketRef.current.on("orderUpdated", (updated) => {

  //  AUTO CLOSE CANCEL MODAL
  setConfirmAction(prev => {
    if (!prev) return prev;

    const item = updated.items[prev.index];

    if (!item || item.confirmed || item.rejected) {
      return null;
    }

    return prev;
  });

  setOrderData((prevOrder) => {
    // ONLY FOR FRESH ORDER + LIMITED STATUS
const allowedStatuses = ["pending", "confirmed", "preparing"];

if (prevOrder) {

  // 🔹 STATUS CHANGE (pending, confirmed, preparing)
  if (
    updated.status !== prevOrder.status &&
    ["pending", "confirmed", "preparing"].includes(updated.status) &&
    lastShownStatusRef.current !== updated.status
  ) {
    autoShowStatus();
    playStatusSound(updated.status);

    lastShownStatusRef.current = updated.status;
  }

  //  FIRST ITEM READY (MOST IMPORTANT )
  const oldReady = prevOrder.items.filter(i => i.cookingReady).length;
  const newReady = updated.items.filter(i => i.cookingReady).length;

  if (
    oldReady === 0 &&
    newReady > 0 &&
    lastShownStatusRef.current !== "first-ready"
  ) {
    autoShowStatus();
    playStatusSound("ready");

    lastShownStatusRef.current = "first-ready";
  }
  if (updated._id !== prevOrder._id) {
  lastShownStatusRef.current = null;
}
}

    if (!prevOrder) return updated;

    // 🔥 DETECT REJECTED ITEM (FIXED)
    updated.items.forEach((item, index) => {
      const oldItem = prevOrder.items[index];

      if (!oldItem?.rejected && item.rejected) {
        setToast(`❌ ${item.name} is unavailable`);
        setTimeout(() => setToast(null), 3000);
      }
    });

    // existing logic (same rehne do)
    if (updated._id !== prevOrder._id)
      return prevOrder;

    if (updated.status === "completed") {
      sessionStorage.removeItem("welcomeShown");
      setOrderData(null);
      setCart([]);
      setToast("Payment completed ✅");
      setTimeout(() => setToast(null), 2000);
      return null;
    }
    if (updated.status === "cancelled") {
  setOrderData(null);
  setCart([]);
  setToast("❌ Order Cancelled by Restaurant");

  playStatusSound("cancelled");

  setTimeout(() => setToast(null), 3000);

  return null;
}

    const oldItems = prevOrder.items.map(i => ({
      name: i.name,
      qty: i.qty,
      price: i.price
    }));

    const newItems = updated.items.map(i => ({
      name: i.name,
      qty: i.qty,
      price: i.price
    }));

    if (JSON.stringify(oldItems) !== JSON.stringify(newItems)) {
      setToast("Order updated by restaurant");
      setTimeout(() => setToast(null), 2000);
    }

    return updated;
  });

});
    return () => {
      socketRef.current.disconnect();
    };
  }, []);
  useEffect(() => {
    fetch(`${BASE_URL}/api/orders/kitchen-status`)
      .then(res => res.json())
      .then(data => {
        setKitchenClosed(data.status === "offline");
      });
  }, []);
  const orderedItems = orderData?.items || [];
  const newItems = cart;
  const validOrderedItems = orderedItems.filter(i => !i.rejected);

  const totalQty = [...validOrderedItems, ...newItems]
    .reduce((t, i) => t + i.qty, 0);
  const orderedTotal = orderedItems
    .filter(i => !i.rejected)
    .reduce((t, i) => t + i.qty * i.price, 0);
  const newTotal = newItems.reduce(
    (t, i) => t + i.qty * i.price,
    0
  );
  const cancelItem = async (index) => {

    // 🔥 1. INSTANT UI UPDATE
    setOrderData(prev => {
      if (!prev) return prev;

      const updatedItems = [...prev.items];
      updatedItems.splice(index, 1);

      return { ...prev, items: updatedItems };
    });

    // 2. BACKEND CALL (background)
    await fetch(`${BASE_URL}/api/orders/${orderData._id}/remove-item`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIndex: index })
    });

  };
  

  const totalPrice = orderedTotal + newTotal;
  const gst = totalPrice * 0.05;
  const finalTotal = totalPrice + gst;
  return (
    <>
      {showWelcome && (
        <WelcomeCard
          tableId={tableId}
          onClose={() => setShowWelcome(false)}
        />
      )}
      {kitchenClosed && (
        <div className="bg-red-600 text-white p-3 text-center font-semibold">
          Online ordering is currently unavailable.
        </div>
      )}
      <div className="p-2 pb-24">


        {/* TOAST */}
        {toast && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-slideIn z-50 transition-all animate-bounce">
            {toast}
          </div>
        )}

        <div className="mb-2 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wide">
            Table No: {tableId}
          </h1>

          {orderData && (
            <span className="text-sm font-semibold bg-gray-200 px-3 py-1 rounded-lg">
              Order ID: {orderData.orderId}
            </span>
          )}
        </div>

        {/* CATEGORY BUTTONS */}
        {!search && (
          <div className="flex gap-2 mb-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${activeCategory === "All"
                ? "bg-black text-white scale-105"
                : "bg-gray-200 hover:scale-105"
                }`}
            >
              All
            </button>

            {Object.keys(groupedMenu).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${activeCategory === category
                  ? "bg-black text-white scale-105"
                  : "bg-gray-200 hover:scale-105"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>)}
        {!search && activeCategory === "All" && (
          <MostOrdered addToCart={addToCart} />
        )}
        {search && (
          <p className="text-sm text-gray-500 mb-4">
            Showing results for "{search}"
          </p>
        )}
        {/* ITEMS */}
        {totalSearchItems === 0 ? (

          <div className="text-center mt-20 text-gray-500">
            <i className="fa-solid fa-face-frown text-4xl mb-3"></i>
            <p className="text-lg font-semibold">No items found</p>
          </div>

        ) : (

          searchedData.map((category) => (

            <div key={category.category} className="animate-fadeIn">

              {!search && (
                <h2 className="text-xl font-bold my-4">
                  {category.category}
                </h2>
              )}

              <div className="grid grid-cols-2 gap-4">

                {category.items.map((item) => (
                  <FoodCard
                    key={item._id}
                    item={item}
                    addToCart={addToCart}
                    cart={cart}
                    increaseQty={increaseQty}
                    decreaseQty={decreaseQty}
                  />
                ))}

              </div>

            </div>

          ))

        )}

        {/* BOTTOM CART BAR */}
        {(cart.length > 0 || orderData) && (
          <div className="fixed bottom-0 left-0 w-full bg-black text-white px-2 py-2 flex justify-between items-center shadow-2xl z-40 backdrop-blur-md transition-all">

            <div className="font-semibold text-lg">
              {totalQty} Items | ₹{finalTotal.toFixed(0)}
            </div>

            <div className="flex gap-3">

              {/* VIEW CART WITH BADGE */}
              <button
                onClick={() => setShowCartDrawer(true)}
                className="relative bg-gray-700 px-4 py-2 rounded-xl text-sm hover:scale-105 transition-all"
              >
                View Cart

                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    {cart.reduce((t, i) => t + i.qty, 0)}
                  </span>
                )}
              </button>

              {/* FIRST ORDER BUTTON */}
              {!orderData && cart.length > 0 && (
                <button
                  onClick={placeOrder}
                  disabled={placingOrder || kitchenClosed}
                  className={`bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all
${highlightOrderBtn ? "animate-pulse scale-105 shadow-lg" : ""}
`}
                >
                  {placingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Placing...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </button>
              )}

              {/* SECOND ORDER BUTTON */}
              {orderData && cart.length > 0 && (
                <button
                  onClick={placeOrder}
                  disabled={placingOrder}
                  className={`bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
${highlightOrderBtn ? "animate-pulse scale-105 shadow-lg" : ""}
`}
                >
                  {placingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    "Order Now"
                  )}
                </button>
              )}

              {/* VIEW STATUS */}
              {orderData && cart.length === 0 && (
                <button
                  onClick={() => setShowTracking(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:scale-105 transition-all"
                >
                  View Status
                </button>
              )}


            </div>
          </div>
        )}

        {/* DRAWER */}
        {showCartDrawer && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-end justify-center z-50 transition-all">

            <div className="bg-white w-full h-[70%] rounded-t-3xl p-6 overflow-y-auto animate-slideUp shadow-2xl">

              <div className="flex justify-between items-center mb-6">

                <h2 className="font-bold text-xl">
                  Your Cart
                </h2>

                <div className="flex gap-3">

                  {orderedItems.length > 0 && (
                    <button
                      onClick={() => setShowBillDrawer(true)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      View Bill
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      setShowCartDrawer(false); // drawer close

                    }}
                    className="text-red-500 font-semibold hover:scale-110 transition"
                  >
                    Close
                  </button>

                </div>

              </div>

              {orderedItems.length > 0 && (
                <>
                  <h3 className="text-green-600 font-semibold mb-2">
                    Ordered Items
                  </h3>

                  {orderedItems.map((item, index) => (

                      <div
                        key={index}
                        className="flex justify-between items-center text-sm py-2 border-b"
                      >
                        <div>
                          <p className={`${item.rejected ? "line-through text-gray-400" : "font-medium"}`}>
  {item.name}
</p>
                          <p className="text-gray-400 text-xs">Qty {item.qty}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.rejected && (
                            <p className="text-red-500 text-xs">
                              ❌Sorry Unavailable
                            </p>
                          )}
                          {/*  CONDITION */}
                          <div className="flex items-center gap-2">

                            {(orderData?.status === "pending" || !item.confirmed) && !item.rejected && (
  <button
    onClick={() =>
      setConfirmAction({
        type: "cancel",
        index
      })
    }
    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg transition"
  >
    Cancel
  </button>
)}

                          </div>

                          <span
  className={`font-semibold ${
    item.rejected ? "line-through text-gray-400" : ""
  }`}
>
  ₹{item.price * item.qty}
</span>

                        </div>
                      </div>
                    ))}
                </>
              )}

              {newItems.length > 0 && (
                <>
                  <h3 className="text-orange-600 font-semibold mt-6 mb-2">
                    New Items
                  </h3>

                  {newItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex justify-between items-center text-sm py-2 border-b
  ${item.rejected ? "opacity-50 line-through bg-red-50" : ""}
`}
                    >
                      {/* LEFT SIDE */}
                      <div>
                        <p className="font-medium leading-tight">
                          {item.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Qty {item.qty}
                        </p>
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="flex items-center gap-3">

                        {/* STEPPER */}
                        <div className="flex items-center bg-red-500 text-white rounded-lg overflow-hidden text-sm">

                          <button
                            onClick={() => decreaseQty(item.id)}
                            className="px-2 py-[2px] hover:bg-red-600"
                          >
                            -
                          </button>

                          <span className="px-2">{item.qty}</span>

                          <button
                            onClick={() => increaseQty(item.id)}
                            className="px-2 py-[2px] hover:bg-red-600"
                          >
                            +
                          </button>

                        </div>

                        {/* PRICE */}
                        <p className="font-semibold">
                          ₹{item.price * item.qty}
                        </p>

                      </div>
                    </div>
                  ))}

                  <button
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="w-full bg-black text-white py-4 rounded-2xl mt-6 flex items-center justify-center gap-2"
                  >
                    {placingOrder ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending Order...
                      </>
                    ) : (
                      orderData ? "Order Now" : "Place Order"
                    )}
                  </button>
                </>
              )}

              <div className="mt-6 space-y-1 text-right">

                {orderedTotal > 0 && (
                  <div className="text-gray-500">
                    Ordered Total: ₹{orderedTotal}
                  </div>
                )}

                {newTotal > 0 && (
                  <div className="text-orange-600 font-semibold">
                    New Items: ₹{newTotal}
                  </div>
                )}

                <div className="text-gray-500 text-sm">
                  Subtotal: ₹{totalPrice}
                </div>

                <div className="text-gray-500 text-sm">
                  GST (5%): ₹{gst.toFixed(2)}
                </div>

                <div className="font-bold text-lg">
                  Total: ₹{finalTotal.toFixed(2)}
                </div>

              </div>

            </div>
          </div>
        )}
        {showBillDrawer && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50">

            <div className="bg-white w-full h-[70%] rounded-t-3xl p-6 overflow-y-auto animate-slideUp shadow-2xl">

              {/* HEADER */}
              <div className="flex justify-between items-center mb-4 border-b pb-3">

                <div>
                  <h2 className="text-xl font-bold">
                    Bill Summary
                  </h2>

                  <p className="text-xs text-gray-500">
                    Table {tableId} • Order #{orderData?.orderId}
                  </p>
                </div>

                <button
                  onClick={() => setShowBillDrawer(false)}
                  className="text-red-500 font-semibold"
                >
                  Close
                </button>

              </div>


              {/* ITEMS */}
              <div className="space-y-3">

                {orderedItems
                  .filter(item => !item.rejected)
                  .map((item, index) => (

                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >

                      <div>
                        <p className="font-medium">
                          {item.name}
                        </p>

                        <p className="text-gray-400 text-xs">
                          Qty {item.qty}
                        </p>
                      </div>

                      <p className="font-semibold">
                        ₹{item.price * item.qty}
                      </p>

                    </div>

                  ))}

              </div>


              {/* DIVIDER */}
              <div className="border-dashed border-t my-5"></div>


              {/* CHARGES */}
              <div className="space-y-2 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Item Total
                  </span>

                  <span>
                    ₹{orderedTotal}
                  </span>
                </div>
                {/* GST CALCULATION */}

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    GST (5%)
                  </span>

                  <span>
                    ₹{(orderedTotal * 0.05).toFixed(2)}
                  </span>
                </div>


                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Service Charge
                  </span>

                  <span>
                    ₹0
                  </span>
                </div>

              </div>


              {/* GRAND TOTAL */}
              <div className="border-t mt-5 pt-4 flex justify-between items-center">

                <span className="text-lg font-bold">
                  Grand Total
                </span>

                <span className="text-xl font-bold text-green-600">
                  ₹{(orderedTotal * 1.05).toFixed(2)}
                </span>

              </div>


              {/* PAYMENT NOTE */}
              <div className="mt-6 bg-gray-100 p-4 rounded-xl text-sm text-center">

                <p className="font-semibold">
                  Pay at Counter
                </p>

                <p className="text-gray-500 text-xs mt-1">
                  Show this bill to the cashier for payment
                </p>

              </div>

            </div>

          </div>
        )}

        {/* TRACK MODAL */}
        {showTracking && orderData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50 animate-fadeIn">

            <div className="bg-white w-80 p-6 rounded-2xl shadow-2xl text-center animate-scaleIn">

              <h2 className="text-lg font-bold mb-3">
                Order Status
              </h2>

              <div className="mb-4">

                {/* PROGRESS BAR */}
                <div className="mb-4">

                  {/* STATUS TEXT */}
                  <div className="mb-4">

                    {/*  STATUS TEXT */}
                    <p className="font-semibold mb-2 text-lg">

                      {getDisplayStatus(orderData) === "pending" && "Waiting for Kitchen"}

                      {getDisplayStatus(orderData) === "confirmed" && "Order Accepted ✅"}

                      {getDisplayStatus(orderData) === "preparing" && "Cooking in Progress"}

                      {getDisplayStatus(orderData) === "partial" && "Preparing Your Order"}

                      {getDisplayStatus(orderData) === "ready" && "Your Order is Ready"}

                    </p>

                    {/*  PENDING */}
                    {getDisplayStatus(orderData) === "pending" && (
                      <div className="mt-2 text-red-500 animate-pulse text-sm">
                        Please wait... your order is being reviewed
                      </div>
                    )}

                    {/* CONFIRMED */}
                    {getDisplayStatus(orderData) === "confirmed" && (
                      <div className="mt-2 text-orange-500 text-sm">
                        Kitchen has accepted your order
                      </div>
                    )}

                    {/* PREPARING (spinner) */}
                    {getDisplayStatus(orderData) === "preparing" && (
                      <div className="flex flex-col items-center mt-3">

                        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>

                        <p className="text-xs text-gray-500 mt-2">
                          Your food is being cooked...
                        </p>

                      </div>
                    )}

                    {/*  PARTIAL (already done) */}
                    {getDisplayStatus(orderData) === "partial" && (
                      <div className="w-full">

                        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-green-500 h-full transition-all duration-700"
                            style={{
                              width: `${(readyCount / total) * 100}%`
                            }}
                          ></div>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {readyCount} of {total} items ready
                        </p>

                      </div>
                    )}

                    {/*  READY */}
                    {getDisplayStatus(orderData) === "ready" && (
                      <div className="mt-3">

                        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                          <div className="bg-green-500 h-full w-full animate-pulse"></div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>

              <button
                onClick={() => setShowTracking(false)}
                className="bg-black text-white px-4 py-2 rounded-xl hover:scale-105 transition"
              >
                Close
              </button>

            </div>
          </div>
        )}

      </div>
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-72 text-center shadow-xl">

            <p className="mb-4 font-semibold">
              "Remove this item from order?"
            </p>

            <div className="flex justify-center gap-3">

              {/* NO BUTTON */}
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-1 bg-gray-300 rounded-lg"
              >
                No
              </button>

              {/* YES BUTTON */}
              <button
                onClick={async () => {

                  cancelItem(confirmAction.index);

                  setConfirmAction(null);

                }}
                className="px-4 py-1 bg-red-500 text-white rounded-lg"
              >
                Yes
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}