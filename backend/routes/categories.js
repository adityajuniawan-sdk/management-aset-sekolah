
const express = require("express");
const prisma = require("../db");
const authenticateToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");

const router = express.Router();

const viewingRoles = [
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
  "KEPALA_SEKOLAH",
];

const managementRoles = [
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
];

// Melihat semua kategori
router.get(
  "/",
  authenticateToken,
  authorizeRoles(...viewingRoles),
  async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: {
              assets: true,
            },
          },
        },
      });

      res.json({
        pesan: "Data kategori berhasil diambil",
        data: categories,
      });
    } catch (error) {
      console.error("ERROR GET CATEGORY:", error);
      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// Menambahkan kategori
router.post(
  "/",
  authenticateToken,
  authorizeRoles(...managementRoles),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          pesan: "Nama kategori wajib diisi",
          data: null,
        });
      }

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        },
      });

      res.status(201).json({
        pesan: "Kategori berhasil ditambahkan",
        data: category,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          pesan: "Nama kategori sudah digunakan",
          data: null,
        });
      }

      console.error("ERROR CREATE CATEGORY:", error);
      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// Mengedit kategori
router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles(...managementRoles),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const data = {};

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          return res.status(400).json({
            pesan: "Nama kategori tidak boleh kosong",
            data: null,
          });
        }

        data.name = name.trim();
      }

      if (description !== undefined) {
        data.description = description?.trim() || null;
      }

      const category = await prisma.category.update({
        where: { id: req.params.id },
        data,
      });

      res.json({
        pesan: "Kategori berhasil diperbarui",
        data: category,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          pesan: "Kategori tidak ditemukan",
          data: null,
        });
      }

      if (error.code === "P2002") {
        return res.status(409).json({
          pesan: "Nama kategori sudah digunakan",
          data: null,
        });
      }

      console.error("ERROR UPDATE CATEGORY:", error);
      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// Menghapus kategori
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(...managementRoles),
  async (req, res) => {
    try {
      await prisma.category.delete({
        where: { id: req.params.id },
      });

      res.json({
        pesan: "Kategori berhasil dihapus",
        data: null,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          pesan: "Kategori tidak ditemukan",
          data: null,
        });
      }

      if (error.code === "P2003") {
        return res.status(409).json({
          pesan: "Kategori masih digunakan oleh aset",
          data: null,
        });
      }

      console.error("ERROR DELETE CATEGORY:", error);
      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

module.exports = router;
