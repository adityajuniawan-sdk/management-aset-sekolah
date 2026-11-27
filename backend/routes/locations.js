
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

// GET - Melihat semua lokasi
router.get(
  "/",
  authenticateToken,
  authorizeRoles(...viewingRoles),
  async (req, res) => {
    try {
      const locations = await prisma.location.findMany({
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
        pesan: "Data lokasi berhasil diambil",
        data: locations,
      });
    } catch (error) {
      console.error("ERROR GET LOCATION:", error);
      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// POST - Menambahkan lokasi
router.post(
  "/",
  authenticateToken,
  authorizeRoles(...managementRoles),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          pesan: "Nama lokasi wajib diisi",
          data: null,
        });
      }

      const location = await prisma.location.create({
        data: {
          name: name.trim(),
          description:
            typeof description === "string"
              ? description.trim() || null
              : null,
        },
      });

      res.status(201).json({
        pesan: "Lokasi berhasil ditambahkan",
        data: location,
      });
    } catch (error) {
      console.error("ERROR CREATE LOCATION:", error);
      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// PATCH - Mengedit lokasi
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
            pesan: "Nama lokasi tidak boleh kosong",
            data: null,
          });
        }

        data.name = name.trim();
      }

      if (description !== undefined) {
        if (
          description !== null &&
          typeof description !== "string"
        ) {
          return res.status(400).json({
            pesan: "Deskripsi lokasi harus berupa teks",
            data: null,
          });
        }

        data.description = description?.trim() || null;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          pesan: "Tidak ada data yang diperbarui",
          data: null,
        });
      }

      const location = await prisma.location.update({
        where: { id: req.params.id },
        data,
      });

      res.json({
        pesan: "Lokasi berhasil diperbarui",
        data: location,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          pesan: "Lokasi tidak ditemukan",
          data: null,
        });
      }

      console.error("ERROR UPDATE LOCATION:", error);
      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// DELETE - Menghapus lokasi
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(...managementRoles),
  async (req, res) => {
    try {
      await prisma.location.delete({
        where: { id: req.params.id },
      });

      res.json({
        pesan: "Lokasi berhasil dihapus",
        data: null,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          pesan: "Lokasi tidak ditemukan",
          data: null,
        });
      }

      if (error.code === "P2003") {
        return res.status(409).json({
          pesan: "Lokasi masih digunakan oleh aset",
          data: null,
        });
      }

      console.error("ERROR DELETE LOCATION:", error);
      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

module.exports = router;