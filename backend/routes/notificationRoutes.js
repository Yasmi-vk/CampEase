const express = require("express");
const router = express.Router();

const {
  getNotificationsByUser,
  markNotificationAsRead,
  createNotification
} = require("../controllers/notificationController");

router.get("/user/:userId", getNotificationsByUser);
router.put("/:id/read", markNotificationAsRead);
router.post("/", createNotification);

module.exports = router;