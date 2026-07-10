const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.post("/", validateToken, async (req, res) => {
  const { PostId } = req.body;
  const UserId = req.user.id;

  if (!PostId) {
    return res.status(400).json({ error: "PostId is required" });
  }

  const post = await prisma.post.findUnique({ where: { id: Number(PostId) } });
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const found = await prisma.like.findFirst({
    where: { postId: Number(PostId), userId: UserId },
  });
  if (!found) {
    await prisma.like.create({
      data: { postId: Number(PostId), userId: UserId },
    });
    res.json({ liked: true });
  } else {
    await prisma.like.delete({ where: { id: found.id } });
    res.json({ liked: false });
  }
});

module.exports = router;
