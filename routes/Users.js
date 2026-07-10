const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { sign } = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username: username, password: hashedPassword },
  });
  res.json({ username: user.username, id: user.id });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.json({ error: "User Doesn't Exist" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.json({ error: "Wrong Username And Password Combination" });
  }

  const accessToken = sign(
    { username: user.username, id: user.id },
    "importantsecret",
  );
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 24 * 1000,
  });
  res.json({ username: user.username, id: user.id });
});

router.get("/auth", validateToken, (req, res) => {
  res.json(req.user);
});

router.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.json({ message: "Logged out successfully" });
});

router.get("/basicinfo/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
    },
  });
  res.json(user);
});

router.put("/changepassword", validateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({
    where: { username: req.user.username },
  });

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    return res.json({ error: "Wrong Old Password Entered!" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { username: req.user.username },
    data: { password: hashedPassword },
  });

  res.json({ message: "Password Changed Successfully!" });
});

module.exports = router;
