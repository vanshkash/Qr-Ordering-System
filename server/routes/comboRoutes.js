const express = require("express");
const router = express.Router();
const Combo = require("../models/Combo");


// GET ALL COMBOS
router.get("/", async (req, res) => {
  try {
    const combos = await Combo.find().populate("items.menuItemId");
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;