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
    // console.log("BODY RECEIVED:", req.body);

    const { table, items, sessionId } = req.body;

    const orderId = await generateOrderId();

    const newOrder = new Order({
      orderId,
      table,
      items,
      status: "pending",
      sessionId
    });

    const savedOrder = await newOrder.save();

    const io = req.app.get("io");
    io.emit("orderUpdated", savedOrder);

    res.status(201).json(savedOrder);

  } catch (error) {
    // console.log("CREATE ORDER ERROR:", error); // 🔥 MUST print
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
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { lastAction: `items_confirmed_${Date.now()}` },
      { new: true }
    );
    // ✅ ADD HERE
    const io = req.app.get("io");
    io.emit("orderUpdated", updatedOrder);

    res.json(updatedOrder);
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
module.exports = router;
