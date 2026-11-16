function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        pesan: "Kamu tidak memiliki akses",
        data: null,
      });
    }

    next();
  };
}

module.exports = authorizeRoles;