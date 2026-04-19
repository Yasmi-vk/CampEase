const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserById,
  updateUser
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);

module.exports = router;