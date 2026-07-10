const request = require("supertest");
const express = require("express");

describe("Likes route", () => {
  let app;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      post: { findUnique: jest.fn() },
      like: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    jest.resetModules();
    jest.doMock("../prismaClient", () => mockPrisma);
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
    mockPrisma.post.findUnique.mockResolvedValue(null);
    const res = await request(app).post("/likes").send({ PostId: 123 });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test("creates like when not found and returns liked true", async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.like.findFirst.mockResolvedValue(null);
    mockPrisma.like.create.mockResolvedValue({ postId: 1, userId: 2 });

    const res = await request(app).post("/likes").send({ PostId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
  });

  test("destroys like when found and returns liked false", async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.like.findFirst.mockResolvedValue({ id: 5 });
    mockPrisma.like.delete.mockResolvedValue({ id: 5 });

    const res = await request(app).post("/likes").send({ PostId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(false);
  });
});
