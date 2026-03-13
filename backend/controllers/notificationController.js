import Notification from "../models/notificationModel.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.getForUser(req.user.userId);
    const unreadCount   = await Notification.getUnreadCount(req.user.userId);
    return res.status(200).json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/notifications/read
export const markAllRead = async (req, res) => {
  try {
    await Notification.markAllRead(req.user.userId);
    return res.status(200).json({ success: true, message: "Notifications marked as read." });
  } catch (err) {
    console.error("markAllRead error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};