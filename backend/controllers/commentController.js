import Comment from "../models/commentModel.js";

// GET /api/posts/:postId/comments
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.getByPost(req.params.postId);
    return res.status(200).json({ success: true, data: { comments } });
  } catch (err) {
    console.error("getComments error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/posts/:postId/comments
export const addComment = async (req, res) => {
  try {
    const { comment_text, parent_comment_id } = req.body;

    if (!comment_text?.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required." });
    }

    const commentId = await Comment.create({
      userId:          req.user.userId,
      postId:          Number(req.params.postId),
      commentText:     comment_text.trim(),
      parentCommentId: parent_comment_id || null,
    });

    const comment = await Comment.findById(commentId);
    return res.status(201).json({ success: true, message: "Comment added.", data: { comment } });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/comments/:id
export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });
    if (comment.user_id !== req.user.userId) return res.status(403).json({ success: false, message: "Forbidden." });

    const { comment_text } = req.body;
    if (!comment_text?.trim()) return res.status(400).json({ success: false, message: "Comment text required." });

    await Comment.update(req.params.id, comment_text.trim());
    return res.status(200).json({ success: true, message: "Comment updated." });
  } catch (err) {
    console.error("updateComment error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });
    if (comment.user_id !== req.user.userId) return res.status(403).json({ success: false, message: "Forbidden." });

    await Comment.delete(req.params.id);
    return res.status(200).json({ success: true, message: "Comment deleted." });
  } catch (err) {
    console.error("deleteComment error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};