import { useState, useEffect, useRef } from "react";
import menuData from "../data/menuData";
import FoodCard from "../components/FoodCard";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import confirmedSound from "../assets/confirmed.mp3";
import preparingSound from "../assets/confirmed.mp3";
import readySound from "../assets/ready.mp3";
import cancelledSound from "../assets/cancelled.mp3";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [showTracking, setShowTracking] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const { tableId } = useParams();
  const socketRef = useRef(null);
  // Add to Cart
  const addToCart = (item) => {
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      setCart(cart.map((i) =>
        i.id === item.id ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
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
    activeCategory === "All"
      ? menuData
      : menuData.filter((cat) => cat.category === activeCategory);

  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      let response;

      if (!orderData) {
        response = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: Number(tableId),
            items: cart,
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
  console.error(updatedOrder);
  setToast("Server Error ❌");
  return;
}

setOrderData(updatedOrder);
      setCart([]);
      setToast(orderData ? "Additional Items Sent" : "Order Placed Successfully");

      setTimeout(() => setToast(null), 2500);

    } catch (error) {
      console.log(error);
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
audio.play().catch(() => {});
  };

  useEffect(() => {

  socketRef.current = io(BASE_URL);
  // 🔥 JOIN TABLE ROOM
  socketRef.current.emit("joinTable", Number(tableId));

  socketRef.current.on("orderUpdated", (updated) => {

    setOrderData((prevOrder) => {

      if (!prevOrder) return prevOrder; // 🔥 important

      if (updated._id !== prevOrder._id)
        return prevOrder;

      // 🔥 STATUS CHANGE
      if (updated.status !== prevOrder.status) {

        if (updated.status === "confirmed") {
          setToast("Your Order Has Been Confirmed ✅");
        }

        if (updated.status === "preparing") {
          setToast("Your Order Is Being Prepared 👨‍🍳");
        }

        if (updated.status === "ready") {
          setToast("Your Order Is Ready 🍽");
        }

        if (updated.status === "cancelled") {
          setToast("Your Order Was Cancelled ❌");
        }

        playStatusSound(updated.status);
        setTimeout(() => setToast(null), 3000);
      }

      // 🔥 NEW ITEMS CONFIRM
      if (
        updated.lastAction &&
        updated.lastAction !== prevOrder.lastAction
      ) {
        if (updated.lastAction.startsWith("items_confirmed")) {
          setToast("Kitchen Confirmed Your Items ✅");
          playStatusSound("confirmed");
          setTimeout(() => setToast(null), 3000);
        }
      }

      return updated;
    });

  });

  return () => {
    socketRef.current.disconnect();
  };

}, []);



  // const orderedItems = orderData ? orderData.items : [];
  const orderedItems = orderData?.items || [];
  const newItems = cart;

  const totalQty = [...orderedItems, ...newItems].reduce((t, i) => t + i.qty, 0);
  const totalPrice = [...orderedItems, ...newItems].reduce(
    (t, i) => t + i.qty * i.price,
    0
  );

  return (
    <div className="p-4 pb-32">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-slideIn z-50 transition-all animate-bounce">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 tracking-wide">
        Table No: {tableId}
      </h1>

      {/* CATEGORY BUTTONS */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveCategory("All")}
          className={`px-4 py-2 rounded-full transition-all duration-300 ${activeCategory === "All"
            ? "bg-black text-white scale-105"
            : "bg-gray-200 hover:scale-105"
            }`}
        >
          All
        </button>

        {menuData.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`px-4 py-2 rounded-full transition-all duration-300 ${activeCategory === cat.category
              ? "bg-black text-white scale-105"
              : "bg-gray-200 hover:scale-105"
              }`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      {/* ITEMS */}
      {filteredData.map((category) => (
        <div key={category.category} className="animate-fadeIn">
          <h2 className="text-xl font-bold my-4">
            {category.category}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {category.items.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                addToCart={addToCart}
                cart={cart}
                increaseQty={increaseQty}
                decreaseQty={decreaseQty}
              />
            ))}
          </div>
        </div>
      ))}

      {/* FLOATING ORDER Now */}
      {orderData && cart.length > 0 && (
        <div className="fixed bottom-16 left-0 w-full px-4 z-50 animate-bounce">
          <button
            onClick={placeOrder}
            className="bg-orange-500 text-white w-full py-4 rounded-2xl font-semibold shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Order Now
          </button>
        </div>
      )}

      {/* BOTTOM CART BAR */}
      {(cart.length > 0 || orderData) && (
        <div className="fixed bottom-0 left-0 w-full bg-black text-white px-6 py-4 flex justify-between items-center shadow-2xl z-40 backdrop-blur-md transition-all">

          <div className="font-semibold text-lg">
            {totalQty} Items | ₹{totalPrice}
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
                className="bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold animate-pulse hover:scale-105 transition-all"
              >
                Place Order
              </button>
            )}

            {/* TRACK NOW */}
            {orderData && (
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

            <div className="flex justify-between mb-6">
              <h2 className="font-bold text-xl">Your Cart</h2>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="text-red-500 font-semibold hover:scale-110 transition"
              >
                Close
              </button>
            </div>

            {orderedItems.length > 0 && (
              <>
                <h3 className="text-green-600 font-semibold mb-2">
                  Ordered Items
                </h3>

                {orderedItems.map((item, index) => (
                  <div key={index} className="flex justify-between mb-2 bg-gray-100 p-3 rounded-xl animate-fadeIn">
                    <span>{item.name} x {item.qty}</span>
                    <span>₹{item.price * item.qty}</span>
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
                  <div key={item.id} className="flex justify-between items-center mb-3 bg-yellow-50 p-3 rounded-xl shadow-sm animate-fadeIn">

                    <span>{item.name}</span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        className="px-3 py-1 bg-gray-300 rounded-lg hover:scale-110 transition"
                      >
                        -
                      </button>

                      <span>{item.qty}</span>

                      <button
                        onClick={() => increaseQty(item.id)}
                        className="px-3 py-1 bg-gray-300 rounded-lg hover:scale-110 transition"
                      >
                        +
                      </button>
                    </div>

                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}

                <button
                  onClick={placeOrder}
                  className="w-full bg-black text-white py-4 rounded-2xl mt-6 hover:scale-105 transition-all duration-300"
                >
                  {orderData ? "Order Now" : "Place Order"}
                </button>
              </>
            )}

            <div className="mt-6 font-bold text-right text-lg">
              Total: ₹{totalPrice}
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

            <p className="mb-4 font-semibold">
              {orderData.status}
            </p>

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
  );
}
