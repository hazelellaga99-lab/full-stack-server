const express = require("express");
const router = express.Router();
const { Comments, Posts } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.get("/:postId", async (req, res) => {
  const postId = req.params.postId;

  const post = await Posts.findByPk(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const comments = await Comments.findAll({
    where: {
      PostId: postId,
    },
  });
  res.json(comments);
});

router.post("/", validateToken, async (req, res) => {
  const comment = req.body;
  const username = req.user.username;

  const { PostId } = comment;
  if (!PostId) {
    return res.status(400).json({ error: "PostId is required" });
  }

  const post = await Posts.findByPk(PostId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  comment.username = username;
  await Comments.create(comment);
  res.json(comment);
});

router.delete("/:commentId", validateToken, async (req, res) => {
  const commentId = req.params.commentId;
  await Comments.destroy({
    where: {
      id: commentId,
    },
  });
  res.json("DELETED SUCCESSFULLY");
});

module.exports = router;
