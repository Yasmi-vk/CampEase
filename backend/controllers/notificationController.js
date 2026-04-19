const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

async function getNotificationsByUser(req, res) {
  try {
    const db = getDB();
    const userId = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const notifications = await db.collection("notifications")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const result = await db.collection("notifications").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRead: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notification",
      error: error.message
    });
  }
}

async function createNotification(req, res) {
  try {
    const db = getDB();
    const { userId, type, title, message, actionText, actionUrl } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        message: "userId, type, title, and message are required"
      });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const newNotification = {
      userId: new ObjectId(userId),
      type,
      title,
      message,
      actionText: actionText || "",
      actionUrl: actionUrl || "",
      isRead: false,
      createdAt: new Date()
    };

    const result = await db.collection("notifications").insertOne(newNotification);

    res.status(201).json({
      message: "Notification created successfully",
      notificationId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create notification",
      error: error.message
    });
  }
}

module.exports = {
  getNotificationsByUser,
  markNotificationAsRead,
  createNotification
};