const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) return res.json({ error: "User not logged in!" });

  try {
    const validToken = verify(accessToken, "importantsecret");
    req.user = validToken;
    if (validToken) {
      req.authenticated = true;
      return next();
    }
  } catch (err) {
    return res.json({ error: err });
  }
};

module.exports = { validateToken };
