const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");

describe("Integration tests with sqlite in-memory", () => {
  let app, db, sequelize;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: console.log,
    });

    db = {};
    const modelsDir = path.join(__dirname, "..", "models");
    fs.readdirSync(modelsDir)
      .filter((f) => f.endsWith(".js") && f !== "index.js")
      .forEach((file) => {
        const modelFactory = require(path.join(modelsDir, file));
        const model = modelFactory(sequelize, DataTypes);
        db[model.name] = model;
      });

    Object.keys(db).forEach((modelName) => {
      if (db[modelName].associate) db[modelName].associate(db);
    });

    await sequelize.sync({ force: true });

    // create a test user so foreign key constraints pass
    const testUser = await db.Users.create({
      username: "integ",
      password: "pw",
    });

    // expose models to routes by mocking require and set validateToken to this user
    jest.resetModules();
    jest.doMock("../models", () => db);
    jest.doMock("../middlewares/AuthMiddleware", () => ({
      validateToken: (req, res, next) => {
        req.user = { id: testUser.id, username: testUser.username };
        return next();
      },
    }));

    const likesRouter = require("../routes/Likes");
    const commentsRouter = require("../routes/Comments");

    app = express();
    app.use(express.json());
    app.use("/likes", likesRouter);
    app.use("/comments", commentsRouter);
  });

  afterAll(async () => {
    if (sequelize) await sequelize.close();
  });

  test("create post and like it via real models", async () => {
    // create a post directly via model
    let post;
    try {
      post = await db.Posts.create({
        title: "p",
        postText: "t",
        username: "u",
        UserId: 1,
      });
    } catch (err) {
      console.error("Post.create error:", err && err.message);
      throw err;
    }

    const res = await request(app).post("/likes").send({ PostId: post.id });
    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
  });

  test("create comment via real models", async () => {
    let post;
    try {
      post = await db.Posts.create({
        title: "p2",
        postText: "t",
        username: "u",
        UserId: 1,
      });
    } catch (err) {
      console.error("Post.create error:", err && err.message);
      throw err;
    }
    const res = await request(app)
      .post("/comments")
      .send({ PostId: post.id, commentBody: "hey" });
    expect(res.status).toBe(200);
    expect(res.body.commentBody).toBe("hey");
  });
});
