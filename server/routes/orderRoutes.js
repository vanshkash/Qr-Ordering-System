const express = require("express");
const router = express.Router();
const Order = require("../models/order");
// GET - Order by Session
router.get("/by-session/:sessionId", async (req, res) => {
  try {
    const order = await Order.findOne({
      sessionId: req.params.sessionId,
      status: { $ne: "cancelled" }
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

    const newOrder = new Order({
      table,
      items,
      status: "pending", // 🔥 force add this
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
module.exports = router;
