const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db");
const authorizeRoles = require("../middleware/authorize");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        pesan: "Semua field wajib diisi",
        data: null,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        pesan: "Password minimal 8 karakter",
        data: null,
      });
    }

    const role = await prisma.role.findUnique({
      where: { name: "GURU_STAFF" },
    });

    if (!role) {
      return res.status(500).json({
        pesan: "Role default tidak ditemukan",
        data: null,
      });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        roleId: role.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    res.status(201).json({
      pesan: "Registrasi berhasil",
      data: user,
    });
  } catch (error) {
    console.error("ERROR REGISTER:", error);
    if (error.code === "P2002") {
      return res.status(409).json({
        pesan: "Email sudah terdaftar",
        data: null,
      });
    }

    console.error(error);
    res.status(500).json({
      pesan: "Terjadi kesalahan pada server",
      data: null,
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        pesan: "Email dan password wajib diisi",
        data: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        pesan: "Email atau password salah",
        data: null,
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return res.status(401).json({
        pesan: "Email atau password salah",
        data: null,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      pesan: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
        },
      },
    });
  } catch (error) {
    console.error("ERROR LOGIN:", error);

    res.status(500).json({
      pesan: "Terjadi kesalahan pada server",
      data: null,
    });
  }
});


const authenticateToken = require("../middleware/auth");

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        pesan: "User tidak ditemukan",
        data: null,
      });
    }

    res.json({
      pesan: "Data user berhasil diambil",
      data: user,
    });
  } catch (error) {
    console.error("ERROR ME:", error);

    res.status(500).json({
      pesan: "Terjadi kesalahan pada server",
      data: null,
    });
  }
});

router.get(
  "/test-admin",
  authenticateToken,
  authorizeRoles("ADMIN_SEKOLAH"),
  (req, res) => {
    res.json({
      pesan: "Akses admin berhasil",
      data: req.user,
    });
  }
);

module.exports = router;