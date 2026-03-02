const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    table: {
      type: Number,
      required: true,
    },
    items: [
      {
        name: String,
        price: Number,
        qty: Number,
      },
    ],
    status: {
      type: String,
      default: "pending",
    },
    lastAction: {
      type: String,
      default: "",
    },
    sessionId: {
      type: String,
      index: true
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
