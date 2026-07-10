const express = require("express");
const router = express.Router();
const { Posts, Likes } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.get("/", validateToken, async (req, res) => {
  //   res.json("Hello from the Posts route!");
  const listOfPosts = await Posts.findAll({ include: [Likes] });

  const likedPosts = await Likes.findAll({
    where: { UserId: req.user.id },
  });

  res.json({ listOfPosts: listOfPosts, likedPosts: likedPosts });
  //
  // res.json(listOfPosts);
});

router.get("/byId/:id", async (req, res) => {
  const id = req.params.id;
  const post = await Posts.findByPk(id);
  res.json(post);
});

router.get("/byUserId/:userId", async (req, res) => {
  const userId = req.params.userId;
  const posts = await Posts.findAll({
    where: {
      UserId: userId,
    },
    include: [Likes],
  });
  res.json(posts);
});

router.post("/", validateToken, async (req, res) => {
  const post = req.body;
  post.username = req.user.username;
  post.UserId = req.user.id;
  await Posts.create(post);
  // Here you would typically save the post to the database
  res.json(post);
});

router.put("/title", validateToken, async (req, res) => {
  const { newTitle, id } = req.body;
  await Posts.update({ title: newTitle }, { where: { id: id } });
  res.json({ message: "Post title updated successfully" });
});

router.put("/postText", validateToken, async (req, res) => {
  const { newText, id } = req.body;
  await Posts.update({ postText: newText }, { where: { id: id } });
  res.json({ message: "Post text updated successfully" });
});

router.delete("/:postId", validateToken, async (req, res) => {
  const postId = req.params.postId;
  const post = await Posts.findByPk(postId);
  if (post) {
    if (post.username === req.user.username) {
      await Posts.destroy({ where: { id: postId } });
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
