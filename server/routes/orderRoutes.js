const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// ⭐ ADD THIS FUNCTION HERE
async function generateOrderId() {

  let orderId;
  let exists = true;

  while (exists) {
    orderId = Math.floor(1000 + Math.random() * 9000);
    const order = await Order.findOne({ orderId });

    if (!order) {
      exists = false;
    }
  }

  return orderId;
}

// GET - Order by Session
router.get("/by-session/:sessionId", async (req, res) => {
  try {
    const order = await Order.findOne({
      sessionId: req.params.sessionId,
      status: { $nin: ["completed", "cancelled"] },
    }).sort({ createdAt: -1 });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order by session" });
  }
});
// GET - Single Order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order" });
  }
});
// POST - Create Order
router.post("/", async (req, res) => {
  try {

    const status = req.app.get("kitchenStatus");

    if (status === "offline") {
      return res.status(503).json({
        message: "Kitchen is offline"
      });
    }

    const { table, items, sessionId } = req.body;

    // ⭐ check existing order
    let existingOrder = await Order.findOne({
      sessionId,
      status: { $nin: ["completed", "cancelled"] }
    });

    if (existingOrder) {

      const newItems = items.map(item => ({
  ...item,
  confirmed: false
}));

existingOrder.items.push(...newItems);
      await existingOrder.save();

      const io = req.app.get("io");
      io.emit("orderUpdated", existingOrder);

      return res.json(existingOrder);
    }

    // ⭐ create new order
    const orderId = await generateOrderId();

    const itemsWithConfirm = items.map(item => ({
  ...item,
  confirmed: true
}));

const newOrder = new Order({
  orderId,
  table,
  items: itemsWithConfirm,
  status: "pending",
  sessionId,
  confirmedItems: items.length
});

    const savedOrder = await newOrder.save();

    const io = req.app.get("io");
    io.emit("orderUpdated", savedOrder);

    res.status(201).json(savedOrder);

  } catch (error) {
    res.status(500).json({ message: "Error creating order" });
  }
});



// PUT - Update Order Status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    // ✅ ADD HERE
    const io = req.app.get("io");
    io.emit("orderUpdated", updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
});


// ✅ GET - All Orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// PUT - Add Items To Existing Order
router.put("/:id/add-items", async (req, res) => {
  try {
    const { items } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Append new items
    order.items.push(...items);

    await order.save();
    // ✅ ADD HERE
    const io = req.app.get("io");
    io.emit("orderUpdated", order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error adding items" });
  }
});

// PUT - Confirm New Items (Kitchen)
router.put("/:id/confirm-items", async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ⭐ yaha main logic hai
    order.confirmedItems = order.items.length;

    await order.save();

    const io = req.app.get("io");
    io.emit("orderUpdated", order);

    res.json(order);

  } catch (error) {

    res.status(500).json({ message: "Error confirming items" });

  }

});
// DELETE ORDER
router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔥 Optional: Emit socket update
    const io = req.app.get("io");
    io.emit("orderDeleted", deletedOrder._id);

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/:id/mark-paid", async (req, res) => {

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.paymentStatus = "paid";
  await order.save();

  const io = req.app.get("io");
  io.emit("orderUpdated", order);

  res.json(order);

});
router.put("/:id/item-ready", async (req, res) => {

  const { itemIndex } = req.body;

  const order = await Order.findById(req.params.id);

  order.items[itemIndex].cookingReady = true;

  await order.save();

  res.json(order);

});
router.put("/:id/item-served", async (req, res) => {

  const { itemIndex } = req.body;

  const order = await Order.findById(req.params.id);

  order.items[itemIndex].served = true;

  await order.save();

  const io = req.app.get("io");
  io.emit("orderUpdated", order);

  res.json(order);

});
router.put("/:id/confirm-item", async (req, res) => {

  const { itemIndex } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.items[itemIndex].confirmed = true;

  await order.save();

  const io = req.app.get("io");
  io.emit("orderUpdated", order);

  res.json(order);

});
module.exports = router;
