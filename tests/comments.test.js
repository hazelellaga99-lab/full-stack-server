const request = require("supertest");
const express = require("express");

describe("Comments route", () => {
  let app;
  let mockModels;

  beforeEach(() => {
    mockModels = {
      Posts: { findByPk: jest.fn() },
      Comments: {
        findAll: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
      },
    };

    jest.resetModules();
    jest.doMock("../models", () => mockModels);
    // Mock auth middleware to bypass cookie/token verification in tests
    jest.doMock("../middlewares/AuthMiddleware", () => ({
      validateToken: (req, res, next) => {
        req.user = { id: 2, username: "tester" };
        return next();
      },
    }));

    const commentsRouter = require("../routes/Comments");
    const cookieParser = require("cookie-parser");
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/comments", commentsRouter);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("GET returns 404 when post not found", async () => {
    mockModels.Posts.findByPk.mockResolvedValue(null);
    const res = await request(app).get("/comments/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test("GET returns comments when post exists", async () => {
    mockModels.Posts.findByPk.mockResolvedValue({ id: 1 });
    mockModels.Comments.findAll.mockResolvedValue([
      { id: 1, commentBody: "hi" },
    ]);
    const res = await request(app).get("/comments/1");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST returns 400 when PostId missing", async () => {
    const res = await request(app).post("/comments").send({ commentBody: "x" });
    expect(res.status).toBe(400);
  });

  test("POST returns 404 when post missing", async () => {
    mockModels.Posts.findByPk.mockResolvedValue(null);
    const res = await request(app)
      .post("/comments")
      .send({ PostId: 5, commentBody: "a" });
    expect(res.status).toBe(404);
  });

  test("POST creates comment when post exists", async () => {
    mockModels.Posts.findByPk.mockResolvedValue({ id: 1 });
    mockModels.Comments.create.mockResolvedValue({ id: 2, commentBody: "a" });
    const res = await request(app)
      .post("/comments")
      .send({ PostId: 1, commentBody: "a" });
    expect(res.status).toBe(200);
    expect(res.body.commentBody).toBe("a");
  });
});
