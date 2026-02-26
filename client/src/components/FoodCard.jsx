export default function FoodCard({
  item,
  addToCart,
  cart,
  increaseQty,
  decreaseQty,
}) {
  const cartItem = cart.find((i) => i.id === item.id);

  return (
    <div className="bg-white shadow-lg rounded-xl p-3">
      <img
        src={item.image}
        alt={item.name}
        className="h-32 w-full object-cover rounded-lg"
      />

      <h3 className="font-semibold mt-2">
        {item.name}
      </h3>

      <p className="text-gray-500">
        ₹{item.price}
      </p>

      {!cartItem ? (
        <button
          onClick={() => addToCart(item)}
          className="mt-2 w-full bg-black text-white py-1 rounded-lg"
        >
          Add
        </button>
      ) : (
        <div className="flex justify-between items-center mt-2 bg-black text-white rounded-lg px-3 py-1">
          <button onClick={() => decreaseQty(item.id)}>
            −
          </button>
          <span>{cartItem.qty}</span>
          <button onClick={() => increaseQty(item.id)}>
            +
          </button>
        </div>
      )}
    </div>
  );
}
