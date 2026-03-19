const mongoose = require("mongoose");

const comboItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu"
  },
  variant: String
});

const comboSchema = new mongoose.Schema({
  name: String,
  price: Number,
  ordered: String,

  items: [comboItemSchema]
});

module.exports = mongoose.model("Combo", comboSchema);