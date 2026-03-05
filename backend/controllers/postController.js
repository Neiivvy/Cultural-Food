import db from "../config/db.js";
import Post from "../models/postModel.js";
import { deleteCloudinaryAsset } from "../config/cloudinary.js";

// GET /api/posts
export const getFeed = async (req, res) => {
  try {
    const limit     = Math.min(Number(req.query.limit)  || 20, 50);
    const offset    = Number(req.query.offset)   || 0;
    const cultureId = req.query.culture_id || null;
    const type      = req.query.type       || null;

    const posts = await Post.getFeed({ limit, offset, cultureId, type });

    // If user is authenticated, flag which posts they have liked
    const userId = req.user?.userId;
    let likedSet = new Set();
    if (userId) {
      const [liked] = await db.execute(
        "SELECT post_id FROM post_likes WHERE user_id = ?",
        [userId]
      );
      likedSet = new Set(liked.map((r) => r.post_id));
    }

    const enriched = posts.map((p) => ({
      ...p,
      liked_by_me: likedSet.has(p.post_id),
    }));

    return res.status(200).json({ success: true, data: { posts: enriched } });
  } catch (err) {
    console.error("getFeed error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/posts/:id
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const [ingredients, steps] = await Promise.all([
      Post.getIngredients(post.post_id),
      Post.getSteps(post.post_id),
    ]);

    const userId    = req.user?.userId;
    const likedByMe = userId ? await Post.isLikedBy(post.post_id, userId) : false;

    return res.status(200).json({
      success: true,
      data: { post: { ...post, ingredients, steps, liked_by_me: likedByMe } },
    });
  } catch (err) {
    console.error("getPost error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/posts   (protected)
export const createPost = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { title, description, culture_id, post_type } = req.body;
    let ingredients = req.body.ingredients || [];
    let steps       = req.body.steps       || [];

    // Accept JSON strings from multipart form
    if (typeof ingredients === "string") {
      try { ingredients = JSON.parse(ingredients); } catch { ingredients = []; }
    }
    if (typeof steps === "string") {
      try { steps = JSON.parse(steps); } catch { steps = []; }
    }

    const mediaUrl = req.file?.path || null;

    const postId = await Post.create(conn, {
      userId:    req.user.userId,
      title,
      description,
      cultureId:  culture_id || null,
      postType:   post_type,
      mediaUrl,
    });

    await Post.setIngredients(conn, postId, ingredients);
    await Post.setSteps(conn, postId, steps);

    await conn.commit();

    const post = await Post.findById(postId);
    const [ing, stp] = await Promise.all([
      Post.getIngredients(postId),
      Post.getSteps(postId),
    ]);

    return res.status(201).json({
      success: true,
      message: "Post created.",
      data: { post: { ...post, ingredients: ing, steps: stp } },
    });
  } catch (err) {
    await conn.rollback();
    console.error("createPost error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    conn.release();
  }
};

// PUT /api/posts/:id  (owner only)
export const updatePost = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const postId = Number(req.params.id);
    const owner  = await Post.getOwner(postId);
    if (!owner) return res.status(404).json({ success: false, message: "Post not found." });
    if (owner !== req.user.userId) return res.status(403).json({ success: false, message: "Forbidden." });

    await conn.beginTransaction();

    const { title, description, culture_id } = req.body;
    let ingredients = req.body.ingredients;
    let steps       = req.body.steps;

    if (typeof ingredients === "string") {
      try { ingredients = JSON.parse(ingredients); } catch { ingredients = undefined; }
    }
    if (typeof steps === "string") {
      try { steps = JSON.parse(steps); } catch { steps = undefined; }
    }

    const fields = {};
    if (title       !== undefined) fields.title       = title;
    if (description !== undefined) fields.description = description;
    if (culture_id  !== undefined) fields.culture_id  = culture_id;

    // New media uploaded?
    if (req.file) {
      const existing = await Post.findById(postId);
      if (existing?.media_url) await deleteCloudinaryAsset(existing.media_url);
      fields.media_url = req.file.path;
    }

    await Post.update(postId, fields);
    if (Array.isArray(ingredients)) await Post.setIngredients(conn, postId, ingredients);
    if (Array.isArray(steps))       await Post.setSteps(conn, postId, steps);

    await conn.commit();

    const post = await Post.findById(postId);
    const [ing, stp] = await Promise.all([Post.getIngredients(postId), Post.getSteps(postId)]);

    return res.status(200).json({ success: true, message: "Post updated.", data: { post: { ...post, ingredients: ing, steps: stp } } });
  } catch (err) {
    await conn.rollback();
    console.error("updatePost error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    conn.release();
  }
};

// DELETE /api/posts/:id  (owner only)
export const deletePost = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const owner  = await Post.getOwner(postId);
    if (!owner) return res.status(404).json({ success: false, message: "Post not found." });
    if (owner !== req.user.userId) return res.status(403).json({ success: false, message: "Forbidden." });

    const post = await Post.findById(postId);
    if (post?.media_url) await deleteCloudinaryAsset(post.media_url);

    await Post.delete(postId);
    return res.status(200).json({ success: true, message: "Post deleted." });
  } catch (err) {
    console.error("deletePost error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/posts/:id/like
export const likePost = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    await Post.like(postId, req.user.userId);
    const count = await Post.getLikesCount(postId);
    return res.status(200).json({ success: true, data: { likes_count: count } });
  } catch (err) {
    console.error("likePost error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/posts/:id/unlike
export const unlikePost = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    await Post.unlike(postId, req.user.userId);
    const count = await Post.getLikesCount(postId);
    return res.status(200).json({ success: true, data: { likes_count: count } });
  } catch (err) {
    console.error("unlikePost error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};