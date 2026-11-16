const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      pesan: "Token tidak ditemukan",
      data: null,
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).json({
        pesan: "Token tidak valid atau kedaluwarsa",
        data: null,
      });
    }

    req.user = decoded;
    next();
  });
}

module.exports = authenticateToken;
