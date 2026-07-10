const express = require("express");
const router = express.Router();
const { Likes, Posts } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.post("/", validateToken, async (req, res) => {
  const { PostId } = req.body;
  const UserId = req.user.id;

  if (!PostId) {
    return res.status(400).json({ error: "PostId is required" });
  }

  // verify the post exists
  const post = await Posts.findByPk(PostId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const found = await Likes.findOne({
    where: { PostId: PostId, UserId: UserId },
  });
  if (!found) {
    await Likes.create({ PostId: PostId, UserId: UserId });
    res.json({ liked: true });
  } else {
    await Likes.destroy({
      where: { PostId: PostId, UserId: UserId },
    });
    res.json({ liked: false });
  }
});

module.exports = router;
