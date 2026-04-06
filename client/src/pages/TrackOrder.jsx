import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function TrackOrder() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => setOrder(data));
  }, [orderId]);

  if (!order) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">
        Order Tracking
      </h1>

      <p className="mb-2">
        <strong>Table:</strong> {order.table}
      </p>

      <p className="mb-4">
        <strong>Status:</strong> {order.status}
      </p>

      <div>
        <h2 className="font-semibold mb-2">Items:</h2>
        {order.items.map((item, index) => (
          <p key={index}>
            {item.name} x {item.qty}
          </p>
        ))}
      </div>
    </div>
  );
}
