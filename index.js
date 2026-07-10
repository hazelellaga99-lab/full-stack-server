const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

const db = require("./models");

// Routers
const postsRouter = require("./routes/Posts");
app.use("/posts", postsRouter);
const commentsRouter = require("./routes/Comments");
app.use("/comments", commentsRouter);
const usersRouter = require("./routes/Users");
app.use("/auth", usersRouter);
const likesRouter = require("./routes/Likes");
app.use("/likes", likesRouter);

db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
