const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const orderRoutes = require("./routes/orderRoutes");
const menuRoutes = require("./routes/menuRoutes");
const comboRoutes = require("./routes/comboRoutes");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/combos", comboRoutes);

// ⭐ Kitchen Status
app.set("kitchenStatus", "online");

// Toggle API
app.post("/api/kitchen-status", (req, res) => {

  const { status } = req.body;

  if (!["online", "offline"].includes(status)) {
    return res.status(400).json({
      message: "Invalid kitchen status"
    });
  }

  req.app.set("kitchenStatus", status);

  res.json({
    message: `Kitchen is now ${status}`
  });

});

// 🔥 SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {

  console.log("Client Connected:", socket.id);

  socket.on("joinTable", (tableId) => {
    const roomName = `table-${tableId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log("Client Disconnected:", socket.id);
  });

});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );

  })
  .catch((err) => console.log(err));