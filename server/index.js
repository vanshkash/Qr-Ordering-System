// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const orderRoutes = require("./routes/orderRoutes");
// require("dotenv").config();


// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use("/api/orders", orderRoutes);

// // Test Route
// app.get("/", (req, res) => {
//   res.send("Server is running ");
// });

// const PORT = process.env.PORT || 5000;

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("MongoDB Connected");
//     app.listen(PORT, () =>
//       console.log(`Server running on port ${PORT}`)
//     );
//   })
//   .catch((err) => console.log(err));


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const orderRoutes = require("./routes/orderRoutes");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // 🔥 IMPORTANT

app.use(cors());
app.use(express.json());
app.use("/api/orders", orderRoutes);

// 🔥 SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: "*", // dev ke liye
    methods: ["GET", "POST", "PUT"],
  },
});

// Socket global banana
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client Connected:", socket.id);
  // 🔥 TABLE ROOM JOIN
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
    server.listen(PORT, () => // ⚠ app.listen nahi
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.log(err));