require("dotenv").config();
const mongoose = require("mongoose");
const Combo = require("./models/Combo");
const Menu = require("./models/Menu");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // find menu items by name to get their IDs for the combos
  const paneer = await Menu.findOne({ name: "Paneer Tikka" });
  const coke = await Menu.findOne({ name: "Coke" });
  const fries = await Menu.findOne({ name: "Peri Peri Fries" });
  const coffee = await Menu.findOne({ name: "Cold Coffee" });
  const gulab = await Menu.findOne({ name: "Gulab Jamun" });
  const rumali = await Menu.findOne({ name: "Rumali Roti" });
  const afgani = await Menu.findOne({ name: "Afgani Chap" });

  // delete existing combos
  await Combo.deleteMany();

  // New combos insert
  await Combo.insertMany([
    {
      name: "Afgani Chap + Rumali Roti",
      price: 253,
      ordered: "90+ customers",
      items: [
        { menuItemId: afgani._id, variant: "Full" },
        { menuItemId: rumali._id }
      ]
    },
    {
      name: "Paneer Tikka + Coke",
      price: 260,
      ordered: "210+ customers",
      items: [
        { menuItemId: paneer._id, variant: "Full" },
        { menuItemId: coke._id }
      ]
    },
    {
      name: "Peri Peri Fries + Cold Coffee",
      price: 150,
      ordered: "150+ customers",
      items: [
        { menuItemId: fries._id },
        { menuItemId: coffee._id }
      ]
    },
  ]);

  console.log("✅ Combos Inserted Successfully");
  process.exit();
}

seed();