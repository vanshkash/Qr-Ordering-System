const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      unique: true,
      index: true
    },

    table: {
      type: Number,
      required: true
    },

    items: [
      {
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        qty: {
          type: Number,
          required: true
        },
        // ⭐ NEW FIELD
        cookingReady: {
          type: Boolean,
          default: false
        },

        // ⭐ NEW FIELD
        served: {
          type: Boolean,
          default: false
        },
        confirmed: {
  type: Boolean,
  default: false
},
rejected: {
  type: Boolean,
  default: false
}
      }
    ],

    status: {
      type: String,
      default: "pending"
    },

    paymentStatus: {
      type: String,
      default: "unpaid"
    },

    lastAction: {
      type: String,
      default: ""
    },

    sessionId: {
      type: String,
      index: true
    },

    // confirmedItems: {
    //   type: Number,
    //   default: 0
    // }

  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);