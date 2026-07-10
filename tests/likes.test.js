const request = require("supertest");
const express = require("express");

describe("Likes route", () => {
  let app;
  let mockModels;

  beforeEach(() => {
    mockModels = {
      Posts: { findByPk: jest.fn() },
      Likes: {
        findOne: jest.fn(),
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

    const likesRouter = require("../routes/Likes");
    const cookieParser = require("cookie-parser");
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/likes", likesRouter);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("returns 400 when PostId missing", async () => {
    const res = await request(app).post("/likes").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("returns 404 when post does not exist", async () => {
    mockModels.Posts.findByPk.mockResolvedValue(null);
    const res = await request(app).post("/likes").send({ PostId: 123 });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test("creates like when not found and returns liked true", async () => {
    mockModels.Posts.findByPk.mockResolvedValue({ id: 1 });
    mockModels.Likes.findOne.mockResolvedValue(null);
    mockModels.Likes.create.mockResolvedValue({ PostId: 1, UserId: 2 });

    const res = await request(app).post("/likes").send({ PostId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
  });

  test("destroys like when found and returns liked false", async () => {
    mockModels.Posts.findByPk.mockResolvedValue({ id: 1 });
    mockModels.Likes.findOne.mockResolvedValue({ id: 5 });
    mockModels.Likes.destroy.mockResolvedValue(1);

    const res = await request(app).post("/likes").send({ PostId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(false);
  });
});
