const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  type: String,
  price: Number
});

const menuSchema = new mongoose.Schema({
  name: String,
  category: String,
  image: String,

  price: Number,

  variants: [variantSchema],

  available: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("Menu", menuSchema);