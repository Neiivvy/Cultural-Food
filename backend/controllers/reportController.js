import Report from "../models/reportModel.js";
import Notification from "../models/notificationModel.js";
import db from "../config/db.js";

/* ── User: submit a report ── */
export const submitReport = async (req, res) => {
  try {
    const userId     = req.user.userId;
    const { post_id, question_id, reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: "Reason is required." });
    }
    if (!post_id && !question_id) {
      return res.status(400).json({ success: false, message: "post_id or question_id required." });
    }

    // Prevent duplicate pending reports
    const already = await Report.alreadyReported(userId, post_id || null, question_id || null);
    if (already) {
      return res.status(409).json({ success: false, message: "You have already reported this content." });
    }

    const reportId = await Report.create({
      userId,
      postId:     post_id     || null,
      questionId: question_id || null,
      reason:     reason.trim(),
    });

    res.status(201).json({ success: true, message: "Report submitted. Admin will review shortly.", data: { report_id: reportId } });
  } catch (err) {
    console.error("submitReport error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ── Admin: get all reports ── */
export const getReports = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const reports = await Report.getAll(status);
    res.json({ success: true, data: { reports } });
  } catch (err) {
    console.error("getReports error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ── Admin: dismiss a report (mark resolved/ignored without deleting content) ── */
export const dismissReport = async (req, res) => {
  try {
    const { action } = req.body; // 'resolved' | 'ignored'
    if (!["resolved", "ignored"].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be resolved or ignored." });
    }
    await Report.updateStatus(req.params.id, action);
    res.json({ success: true, message: `Report ${action}.` });
  } catch (err) {
    console.error("dismissReport error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ── Admin: delete reported content + notify both reporter and owner ── */
export const deleteReportedContent = async (req, res) => {
  try {
    const adminId  = req.user.userId; // admin acts as actor
    const reportId = req.params.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    // Delete the actual content
    if (report.post_id) {
      await db.execute("DELETE FROM posts WHERE post_id = ?", [report.post_id]);
    } else if (report.question_id) {
      await db.execute("DELETE FROM questions WHERE question_id = ?", [report.question_id]);
    }

    // Mark report resolved
    await Report.updateStatus(reportId, "resolved");

    // Determine owner id
    const contentOwnerId = report.post_owner_id || report.question_owner_id;
    const contentTitle   = report.post_title || report.question_title || "your post";

    // Notify the content OWNER — their content was removed
    if (contentOwnerId && Number(contentOwnerId) !== Number(adminId)) {
      await Notification.create({
        recipientId: contentOwnerId,
        actorId:     adminId,
        type:        "content_removed",
        postId:      report.post_id || null,
        questionId:  report.question_id || null,
        message:     `Your post "${contentTitle}" was removed after review for violating community guidelines.`,
      });
    }

    // Notify the REPORTER — their report was acted upon
    if (report.reporter_id && Number(report.reporter_id) !== Number(adminId)) {
      await Notification.create({
        recipientId: report.reporter_id,
        actorId:     adminId,
        type:        "report_actioned",
        postId:      null,
        questionId:  null,
        message:     `Your report was reviewed and the reported content has been removed. Thank you for keeping the community safe.`,
      });
    }

    res.json({ success: true, message: "Content deleted and both parties notified." });
  } catch (err) {
    console.error("deleteReportedContent error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};