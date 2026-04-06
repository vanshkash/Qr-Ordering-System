import { useState, useEffect } from "react";
import { useRef } from "react";
export default function MostOrdered({ addToCart }) {

    const [selectedCombo, setSelectedCombo] = useState(null);
    const [qtyMap, setQtyMap] = useState({});
    const [variantMap, setVariantMap] = useState({});
    const [combos, setCombos] = useState([]);
    const scrollRef = useRef(null);
    const BASE_URL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
  const container = scrollRef.current;

  if (!container) return;

  const scroll = () => {
    if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
      container.scrollLeft = 0; // reset (loop)
    } else {
      container.scrollLeft += 1; // speed control
    }
  };

  const interval = setInterval(scroll, 20); // smooth speed

  return () => clearInterval(interval);
}, []);
    useEffect(() => {
        fetch(`${BASE_URL}/api/combos`)
            .then(res => res.json())
            .then(data => setCombos(data));
    }, []);

    // TOTAL PRICE CALCULATION
    const totalPrice = selectedCombo?.items.reduce((sum, item, index) => {

        const qty = qtyMap[index] || 1;

        const variant =
            variantMap[index] ||
            item.menuItemId.variants?.find(v => v.type === "Full") ||
            item.menuItemId.variants?.[0];

        const price =
            variant?.price || item.menuItemId.price;

        return sum + price * qty;

    }, 0);

    const increaseQty = (index) => {
        setQtyMap(prev => ({
            ...prev,
            [index]: (prev[index] || 1) + 1
        }));
    };

    const decreaseQty = (index) => {
        setQtyMap(prev => ({
            ...prev,
            [index]: Math.max(1, (prev[index] || 1) - 1)
        }));
    };

    // ADD COMBO ITEMS TO CART
    const handleAddCombo = () => {

        selectedCombo.items.forEach((item, index) => {

            const qty = qtyMap[index] || 1;

            const variant =
                variantMap[index] ||
                item.menuItemId.variants?.find(v => v.type === "Full") ||
                item.menuItemId.variants?.[0];

            addToCart({

                id: `${item.menuItemId._id}-${variant?.type}-${Date.now()}`,

                name: variant
                    ? `${item.menuItemId.name} (${variant.type})`
                    : item.menuItemId.name,

                price: variant?.price || item.menuItemId.price,

                qty: qty,

                note: "combo"

            });

        });

        setSelectedCombo(null);
        setQtyMap({});
        setVariantMap({});

    };

    return (

        <div className="mt-2 px-1">

            <h2 className="text-xl font-bold mb-1">
                Most ordered together
            </h2>

            <div
  ref={scrollRef}
  className="flex gap-4 overflow-x-auto scrollbar-hide"
>

                {combos.map((combo) => (

                    <div
                        key={combo._id}
                        className="min-w-[230px] bg-white rounded-xl border border-gray-400 shadow-sm p-2"
                    >

                        <div className="flex items-center gap-1">

                            <img
                                src={combo.items[0]?.menuItemId?.image}
                                className="w-24 h-24 object-cover rounded-lg"
                            />

                            <span className="text-xl font-bold">+</span>

                            <img
                                src={combo.items[1]?.menuItemId?.image}
                                className="w-24 h-24 object-cover rounded-lg"
                            />

                        </div>

                        <p className="text-xs text-green-700 mt-1">
                            Ordered by {combo.ordered}
                        </p>

                        <h3 className="font-semibold mt-1">
                            {combo.name}
                        </h3>

                        <div className="flex justify-between items-center mt-2">

                            <span className="font-bold">
                                ₹{combo.price}
                            </span>

                            <button
                                onClick={() => setSelectedCombo(combo)}
                                className="border border-red-500 text-red-500 px-2 py-[2px] text-xs rounded-md"
                            >
                                See items
                            </button>

                        </div>

                    </div>

                ))}

            </div>


            {/* COMBO MODAL */}

            {selectedCombo && (

                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end justify-center z-50">

                    <div className="bg-white w-full max-w-md rounded-t-3xl p-4">

                        {/* CLOSE BUTTON */}

                        <div className="flex justify-center mb-3">
                            <button
                                onClick={() => setSelectedCombo(null)}
                                className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* IMAGE */}

                        <img
                            src={selectedCombo.items[0]?.menuItemId?.image}
                            className="w-full h-48 object-cover rounded-xl"
                        />

                        <h2 className="mt-3 font-semibold text-lg">
                            Ordered together by {selectedCombo.ordered}
                        </h2>


                        {/* ITEMS */}

                        {selectedCombo.items.map((item, index) => {

                            if (!item.menuItemId) return null;


                            const selectedVariant =
                                variantMap[index] ||
                                item.menuItemId.variants?.find(v => v.type === "Full") ||
                                item.menuItemId.variants?.[0];

                            return (

                                <div
                                    key={index}
                                    className="flex justify-between items-center mt-4"
                                >

                                    <div className="flex items-center gap-3">

                                        <img
                                            src={item.menuItemId.image}
                                            className="w-12 h-12 rounded"
                                        />

                                        <div>

                                            <span>{item.menuItemId.name}</span>

                                            {item.menuItemId.variants?.length > 0 && (

                                                <select
                                                    className="border text-sm rounded mt-1"
                                                    value={selectedVariant?.type}
                                                    onChange={(e) => {

                                                        const v = item.menuItemId.variants.find(
                                                            x => x.type === e.target.value
                                                        );

                                                        setVariantMap(prev => ({
                                                            ...prev,
                                                            [index]: v
                                                        }));

                                                    }}
                                                >

                                                    {item.menuItemId.variants.map(v => (

                                                        <option
                                                            key={v.type}
                                                            value={v.type}
                                                        >
                                                            {v.type} ₹{v.price}
                                                        </option>

                                                    ))}

                                                </select>

                                            )}

                                            <p className="text-gray-500 text-sm">
                                                ₹{selectedVariant?.price || item.menuItemId.price}
                                            </p>

                                        </div>

                                    </div>


                                    {/* QUANTITY BUTTON */}

                                    <div className="flex items-center bg-red-500 text-white rounded-lg overflow-hidden">

                                        <button
                                            onClick={() => decreaseQty(index)}
                                            className="px-3 py-1"
                                        >
                                            −
                                        </button>

                                        <span className="px-3">
                                            {qtyMap[index] || 1}
                                        </span>

                                        <button
                                            onClick={() => increaseQty(index)}
                                            className="px-3 py-1"
                                        >
                                            +
                                        </button>

                                    </div>

                                </div>

                            );

                        })}


                        {/* ADD BUTTON */}

                        <button
                            className="mt-6 w-full bg-red-500 text-white py-3 rounded-xl font-semibold"
                            onClick={handleAddCombo}
                        >

                            Add {selectedCombo.items.length} items – ₹{totalPrice}

                        </button>

                    </div>

                </div>

            )}

        </div>

    );

}