
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        pesan: "Token akses tidak ditemukan",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        pesan: "Token tidak valid",
        data: null,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      pesan: "Token tidak valid atau sudah kedaluwarsa",
      data: null,
    });
  }
}

module.exports = authenticateToken;
