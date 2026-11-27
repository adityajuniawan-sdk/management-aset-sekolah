const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db");
const authorizeRoles = require("../middleware/authorize");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

const ALLOWED_ROLES = [
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
  "KEPALA_SEKOLAH",
];

// REGISTER
// Hanya Admin Sekolah yang boleh membuat akun Petugas dan Kepala Sekolah
router.post(
  "/register",
  authenticateToken,
  authorizeRoles("ADMIN_SEKOLAH"),
  async (req, res) => {
    try {
      const { name, email, password, roleName } = req.body;

      const creatableRoles = [
        "PETUGAS_ASET",
        "KEPALA_SEKOLAH",
      ];

      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !password ||
        !roleName
      ) {
        return res.status(400).json({
          pesan: "Semua field wajib diisi",
          data: null,
        });
      }

      if (!creatableRoles.includes(roleName)) {
        return res.status(400).json({
          pesan: "Role tidak diizinkan",
          data: null,
        });
      }

      if (
        password.length < 12 ||
        Buffer.byteLength(password, "utf8") > 72
      ) {
        return res.status(400).json({
          pesan: "Password minimal 12 karakter dan maksimal 72 byte",
          data: null,
        });
      }

      const role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        return res.status(404).json({
          pesan: "Role tidak ditemukan di database",
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
          role: {
            select: { name: true },
          },
        },
      });

      return res.status(201).json({
        pesan: "Registrasi berhasil",
        data: {
          ...user,
          role: user.role.name,
        },
      });
    } catch (error) {
      console.error("ERROR REGISTER:", error);

      if (error.code === "P2002") {
        return res.status(409).json({
          pesan: "Email sudah terdaftar",
          data: null,
        });
      }

      return res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
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

    if (!user || !ALLOWED_ROLES.includes(user.role.name)) {
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

    return res.json({
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

    return res.status(500).json({
      pesan: "Terjadi kesalahan pada server",
      data: null,
    });
  }
});

// GET PROFILE
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

    if (!user || !ALLOWED_ROLES.includes(user.role.name)) {
      return res.status(404).json({
        pesan: "User tidak ditemukan",
        data: null,
      });
    }

    return res.json({
      pesan: "Data user berhasil diambil",
      data: {
        ...user,
        role: user.role.name,
      },
    });
  } catch (error) {
    console.error("ERROR ME:", error);

    return res.status(500).json({
      pesan: "Terjadi kesalahan pada server",
      data: null,
    });
  }
});

// CHANGE PASSWORD
router.patch(
  "/change-password",
  authenticateToken,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string" ||
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          pesan: "Password lama dan baru wajib diisi",
          data: null,
        });
      }

      if (
        newPassword.length < 12 ||
        Buffer.byteLength(newPassword, "utf8") > 72
      ) {
        return res.status(400).json({
          pesan: "Password baru minimal 12 karakter dan maksimal 72 byte",
          data: null,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({
          pesan: "User tidak ditemukan",
          data: null,
        });
      }

      const passwordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordValid) {
        return res.status(401).json({
          pesan: "Password lama salah",
          data: null,
        });
      }

      const samePassword = await bcrypt.compare(
        newPassword,
        user.password
      );

      if (samePassword) {
        return res.status(400).json({
          pesan: "Password baru harus berbeda dari password lama",
          data: null,
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });

      return res.json({
        pesan: "Password berhasil diperbarui",
        data: null,
      });
    } catch (error) {
      console.error("ERROR CHANGE PASSWORD:", error);

      return res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// TEST ADMIN
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