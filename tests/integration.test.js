const request = require("supertest");
const express = require("express");
const path = require("path");
const { execSync } = require("child_process");

process.env.DATABASE_PROVIDER = "sqlite";
process.env.DATABASE_URL = `file:${path.join(__dirname, "test.db")}`;

const prisma = require("../prismaClient");

describe("Integration tests with sqlite and Prisma", () => {
  let app;
  let testUser;

  beforeAll(async () => {
    execSync("npx prisma db push", {
      cwd: path.join(__dirname, ".."),
      env: process.env,
      stdio: "inherit",
    });

    await prisma.$connect();

    testUser = await prisma.user.create({
      data: { username: "integ", password: "pw" },
    });

    jest.resetModules();
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
    await prisma.$disconnect();
  });

  test("create post and like it via real models", async () => {
    const post = await prisma.post.create({
      data: {
        title: "p",
        postText: "t",
        username: "u",
        userId: testUser.id,
      },
    });

    const res = await request(app).post("/likes").send({ PostId: post.id });
    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
  });

  test("create comment via real models", async () => {
    const post = await prisma.post.create({
      data: {
        title: "p2",
        postText: "t",
        username: "u",
        userId: testUser.id,
      },
    });

    const res = await request(app)
      .post("/comments")
      .send({ PostId: post.id, commentBody: "hey" });
    expect(res.status).toBe(200);
    expect(res.body.commentBody).toBe("hey");
  });
});
