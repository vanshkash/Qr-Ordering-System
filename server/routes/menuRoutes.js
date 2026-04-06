const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");
const Combo = require("../models/Combo");


// GET ALL MENU
router.get("/", async (req, res) => {
  try {
    const menu = await Menu.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ADD MENU ITEM
router.post("/", async (req, res) => {
  try {

    const newItem = new Menu(req.body);

    const saved = await newItem.save();

    res.json(saved);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// UPDATE MENU ITEM
router.put("/:id", async (req, res) => {
  try {

    const updated = await Menu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// TOGGLE STOCK
router.put("/:id/toggle-stock", async (req, res) => {

  try {

    const item = await Menu.findById(req.params.id);

    item.available = !item.available;

    await item.save();

    res.json(item);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});

// DELETE MENU ITEM (FINAL)
router.delete("/:id", async (req, res) => {
  try {

    const deletedItem = await Menu.findByIdAndDelete(req.params.id);

    if (deletedItem) {
      await Combo.deleteMany({
        "items.menuItemId": deletedItem._id
      });
    }

    res.json({ message: "Item & related combos deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;