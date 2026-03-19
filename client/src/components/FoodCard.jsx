import { useState, useEffect } from "react";
export default function FoodCard({
  item,
  addToCart,
  cart,
  increaseQty,
  decreaseQty,
}) {

  const [showModal, setShowModal] = useState(false);
  const [qty, setQty] = useState(1);
  const cartItem = cart.find((i) => i.id === item._id);
  const [selectedVariant, setSelectedVariant] = useState(
    item?.variants?.length ? item.variants[0] : null
  );

  useEffect(() => {
    if (showModal) {
      setSelectedVariant(item?.variants?.[0] || null);
    }
  }, [showModal, item]);

  return (
    <>
      <div className={`shadow-lg rounded-xl p-3 relative 
${item.available ? "bg-white" : "bg-gray-200 opacity-70"}`}>
  {!item.available && (
<div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
Out of Stock
</div>
)}
        <img
          src={item.image}
          alt={item.name}
          className="h-32 w-full object-cover rounded-lg"
        />

        <h3 className="font-semibold mt-2">
          {item.name}
        </h3>

        {/* If Item Has Variants */}
        <p className="text-gray-500">
          ₹{item.variants?.length
            ? (selectedVariant?.price || item.variants[0]?.price)
            : item.price}
        </p>

        <button
disabled={!item.available}
onClick={() => item.available && setShowModal(true)}
className={`mt-2 w-full py-1 rounded-lg 
${item.available 
? "bg-black text-white" 
: "bg-gray-400 text-gray-700 cursor-not-allowed"}`}
>
{item.available ? "Add" : "Out of Stock"}
</button>
      </div>

      {/* 🔥 MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end justify-center z-50">

          {/* 🔥 BOTTOM SHEET */}
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-slideUp">

            {/* CLOSE BUTTON */}
            <div className="flex justify-center pt-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setQty(1);
                  setSelectedVariant(item.variants ? item.variants[0] : null);
                }}
                className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center text-xl"
              >
                ✕
              </button>
            </div>

            {/* IMAGE CENTERED */}
            <div className="flex justify-center px-6 mt-3">
              <img
                src={item.image}
                alt={item.name}
                className="h-48 w-full object-cover rounded-2xl"
              />
            </div>

            <div className="p-6">

              <h2 className="text-lg font-bold mb-1">
                {item.name}
              </h2>

              <p className="text-green-600 text-sm mb-4">
                Highly Reordered
              </p>

              {/* SIZE OPTIONS */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">
                  Quantity
                </h3>

                {item.variants?.length > 0 && item.variants.map((variant, index) => (
                  <label
                    key={index}
                    className="flex justify-between items-center border rounded-xl p-4 mb-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`variant-${item._id}`}
                        checked={selectedVariant?.type === variant.type}
                        onChange={() => setSelectedVariant(variant)}
                        className="w-5 h-5 accent-red-500"
                      />
                      <span className="font-medium">
                        {variant.type}
                      </span>
                    </div>

                    <span className="font-semibold">
                      ₹{variant.price}
                    </span>
                  </label>
                ))}
              </div>

            </div>

            {/* 🔥 FIXED BOTTOM BAR */}
            <div className="flex items-center justify-between p-4 border-t bg-white">

              {/* +/- BUTTON */}
              <div className="flex items-center border rounded-xl overflow-hidden">

                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-4 py-2 text-lg"
                >
                  −
                </button>

                <span className="px-4 font-semibold">
                  {qty}
                </span>

                <button
                  onClick={() => setQty(q => q + 1)}
                  className="px-4 py-2 text-lg"
                >
                  +
                </button>
              </div>

              {/* ADD BUTTON */}
              <button
                disabled={item.variants?.length > 0 && !selectedVariant}
                onClick={() => {
                  addToCart({
                    id: item.variants?.length
                      ? `${item._id}-${selectedVariant?.type}`
                      : item._id,

                    name: item.variants?.length
                      ? `${item.name} (${selectedVariant?.type})`
                      : item.name,

                    price: item.variants?.length
                      ? (selectedVariant?.price || 0)
                      : item.price,

                    qty
                  });

                  setShowModal(false);
                  setQty(1);
                  setSelectedVariant(item.variants ? item.variants[0] : null);

                }}
                className="ml-4 flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold disabled:bg-gray-300"
              >
                Add Item ₹
                {item.variants?.length
                  ? (selectedVariant?.price || item.variants[0]?.price || 0) * qty
                  : (item.price || 0) * qty}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}