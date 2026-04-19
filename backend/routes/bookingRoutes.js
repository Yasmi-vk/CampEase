const express = require("express");
const router = express.Router();

const {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByUser,
  cancelBooking
} = require("../controllers/bookingController");

router.get("/", getAllBookings);
router.get("/user/:userId", getBookingsByUser);
router.get("/:id", getBookingById);
router.post("/", createBooking);
router.put("/:id/cancel", cancelBooking);

module.exports = router;