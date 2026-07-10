const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.get("/", validateToken, async (req, res) => {
  const fetchedPosts = await prisma.post.findMany({
    include: { likes: true },
  });

  const listOfPosts = fetchedPosts.map((post) => ({
    ...post,
    UserId: post.userId,
    Likes: post.likes,
  }));

  const likedPosts = await prisma.like.findMany({
    where: { userId: req.user.id },
  });

  res.json({
    listOfPosts,
    likedPosts: likedPosts.map((like) => ({
      PostId: like.postId,
      UserId: like.userId,
      id: like.id,
    })),
  });
});

router.get("/byId/:id", async (req, res) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({
    ...post,
    UserId: post.userId,
  });
});

router.get("/byUserId/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  const posts = await prisma.post.findMany({
    where: { userId },
    include: { likes: true },
  });
  res.json(
    posts.map((post) => ({
      ...post,
      UserId: post.userId,
      Likes: post.likes,
    })),
  );
});

router.post("/", validateToken, async (req, res) => {
  const { title, postText } = req.body;
  const post = await prisma.post.create({
    data: {
      title,
      postText,
      username: req.user.username,
      userId: req.user.id,
    },
  });
  res.json({
    ...post,
    UserId: post.userId,
  });
});

router.put("/title", validateToken, async (req, res) => {
  const { newTitle, id } = req.body;
  await prisma.post.update({
    where: { id: Number(id) },
    data: { title: newTitle },
  });
  res.json({ message: "Post title updated successfully" });
});

router.put("/postText", validateToken, async (req, res) => {
  const { newText, id } = req.body;
  await prisma.post.update({
    where: { id: Number(id) },
    data: { postText: newText },
  });
  res.json({ message: "Post text updated successfully" });
});

router.delete("/:postId", validateToken, async (req, res) => {
  const postId = Number(req.params.postId);
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post) {
    if (post.username === req.user.username) {
      await prisma.post.delete({ where: { id: postId } });
      res.json({ message: "Post deleted successfully" });
    } else {
      res
        .status(403)
        .json({ error: "You are not authorized to delete this post" });
    }
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

module.exports = router;
