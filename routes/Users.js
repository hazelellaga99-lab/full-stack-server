const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcrypt");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { sign } = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   await Users.create({ username, password: hashedPassword });
  bcrypt.hash(password, 10).then(async (hashedPassword) => {
    await Users.create({ username, password: hashedPassword });
    res.json({ username, password: hashedPassword });
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await Users.findOne({ where: { username: username } });
  if (!user) {
    res.json({ error: "User Doesn't Exist" });
  } else {
    bcrypt.compare(password, user.password).then((match) => {
      if (!match) {
        res.json({ error: "Wrong Username And Password Combination" });
      } else {
        const accessToken = sign(
          { username: user.username, id: user.id },
          "importantsecret",
        );
        res.json({ token: accessToken, username: user.username, id: user.id });
        // res.json(accessToken);
      }
    });
  }
});

router.get("/auth", validateToken, (req, res) => {
  res.json(req.user);
});

router.get("/basicinfo/:id", async (req, res) => {
  const id = req.params.id;
  const user = await Users.findByPk(id, {
    attributes: { exclude: ["password"] },
  });
  res.json(user);
});

router.put("/changepassword", validateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await Users.findOne({ where: { username: req.user.username } });

  bcrypt.compare(oldPassword, user.password).then(async (match) => {
    if (!match) {
      res.json({ error: "Wrong Old Password Entered!" });
    } else {
      bcrypt.hash(newPassword, 10).then(async (hashedPassword) => {
        await Users.update(
          { password: hashedPassword },
          { where: { username: req.user.username } },
        );
        res.json({ message: "Password Changed Successfully!" });
      });
    }
  });
});

module.exports = router;
