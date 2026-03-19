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


useEffect(() => {
  const alreadyShown = localStorage.getItem("welcomeShown");

  if (!alreadyShown) {
    setShowWelcome(true);
    localStorage.setItem("welcomeShown", "true");
  }
}, []);
  useEffect(() => {
  fetch(`${BASE_URL}/api/menu`)
    .then(res => res.json())
    .then(data => {
      setMenu(data);
      setMenuItems(data);   // ⭐ important
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
            setOrderData(null);
          }
          if (updated.status === "completed") {
            localStorage.removeItem("sessionId");
            setOrderData(null);
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

  const orderedItems = orderData?.items || [];
  const newItems = cart;

  const totalQty = [...orderedItems, ...newItems].reduce((t, i) => t + i.qty, 0);

  const orderedTotal = orderedItems.reduce(
    (t, i) => t + i.qty * i.price,
    0
  );

  const newTotal = newItems.reduce(
    (t, i) => t + i.qty * i.price,
    0
  );

  const totalPrice = orderedTotal + newTotal;

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
      <div className="p-4 pb-32">


        {/* TOAST */}
        {toast && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-slideIn z-50 transition-all animate-bounce">
            {toast}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-wide">
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
        <div className="flex gap-3 mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
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
                  disabled={placingOrder || kitchenClosed}
                  className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:scale-105 transition-all flex items-center gap-2"
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
                  className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:scale-105 transition-all flex items-center gap-2"
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
                    onClick={() => setShowCartDrawer(false)}
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

                <div className="font-bold text-lg">
                  Total: ₹{totalPrice}
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

        {orderedItems.map((item, index) => (

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


        <div className="flex justify-between">
          <span className="text-gray-500">
            GST (5%)
          </span>

          <span>
            ₹{(orderedTotal * 0.05).toFixed(0)}
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
          ₹{(orderedTotal * 1.05).toFixed(0)}
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
    </>
  );
}