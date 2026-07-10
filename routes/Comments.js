const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.get("/:postId", async (req, res) => {
  const postId = Number(req.params.postId);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
  });
  res.json(comments);
});

router.post("/", validateToken, async (req, res) => {
  const { PostId, commentBody } = req.body;
  const username = req.user.username;

  if (!PostId) {
    return res.status(400).json({ error: "PostId is required" });
  }

  const post = await prisma.post.findUnique({ where: { id: Number(PostId) } });
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const comment = await prisma.comment.create({
    data: {
      commentBody,
      username,
      postId: Number(PostId),
    },
  });
  res.json(comment);
});

router.delete("/:commentId", validateToken, async (req, res) => {
  const commentId = Number(req.params.commentId);
  await prisma.comment.delete({ where: { id: commentId } });
  res.json("DELETED SUCCESSFULLY");
});

module.exports = router;
