
const express = require("express");
const prisma = require("../db");
const authenticateToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");

const router = express.Router();

const assetStatuses = [
  "AVAILABLE",
  "BORROWED",
  "MAINTENANCE",
  "DAMAGED",
];

const managementRoles = [
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
];

const viewingRoles = [
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
  "KEPALA_SEKOLAH",
];

// =========================
// GET - MELIHAT SEMUA ASET
// =========================

router.get(
  "/",
  authenticateToken,
  authorizeRoles(...viewingRoles),
  async (req, res) => {
    try {
      const assets = await prisma.asset.findMany({
        include: {
          schoolUnit: true,
          category: true,
          location: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      res.json({
        pesan: "Data aset berhasil diambil",
        data: assets,
      });
    } catch (error) {
      console.error("ERROR GET ASSET:", error);

      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// =========================
// POST - MENAMBAHKAN ASET
// =========================

router.post(
  "/",
  authenticateToken,
  authorizeRoles(...managementRoles),
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        brand,
        serialNumber,
        acquisitionDate,
        purchasePrice,
        condition,
        status,
        categoryId,
        locationId,
      } = req.body;

      if (
        typeof code !== "string" || !code.trim() ||
        typeof name !== "string" || !name.trim() ||
        typeof categoryId !== "string" || !categoryId.trim() ||
        typeof locationId !== "string" || !locationId.trim()
      ) {
        return res.status(400).json({
          pesan: "Kode, nama, kategori, dan lokasi wajib diisi",
          data: null,
        });
      }

      const optionalTexts = [description, brand, serialNumber];

      if (
        optionalTexts.some(
          value =>
            value !== undefined &&
            value !== null &&
            typeof value !== "string"
        )
      ) {
        return res.status(400).json({
          pesan: "Data deskripsi, merek, dan nomor seri harus berupa teks",
          data: null,
        });
      }

      if (
        condition !== undefined &&
        (typeof condition !== "string" || !condition.trim())
      ) {
        return res.status(400).json({
          pesan: "Kondisi aset tidak valid",
          data: null,
        });
      }

      if (status !== undefined && !assetStatuses.includes(status)) {
        return res.status(400).json({
          pesan: "Status aset tidak valid",
          data: null,
        });
      }

      if (
        purchasePrice !== undefined &&
        purchasePrice !== null &&
        (
          !Number.isFinite(Number(purchasePrice)) ||
          Number(purchasePrice) < 0
        )
      ) {
        return res.status(400).json({
          pesan: "Harga pembelian tidak valid",
          data: null,
        });
      }

      let parsedDate = null;

      if (acquisitionDate) {
        parsedDate = new Date(acquisitionDate);

        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            pesan: "Tanggal perolehan tidak valid",
            data: null,
          });
        }
      }

      const [category, location, schoolUnit] = await Promise.all([
        prisma.category.findUnique({
          where: { id: categoryId },
        }),
        prisma.location.findUnique({
          where: { id: locationId },
        }),
        prisma.schoolUnit.findUnique({
          where: { code: "SMK" },
        }),
      ]);

      if (!category || !location) {
        return res.status(400).json({
          pesan: "Kategori atau lokasi tidak ditemukan",
          data: null,
        });
      }

      if (!schoolUnit) {
        return res.status(500).json({
          pesan: "Data SMK Guna Cipta belum tersedia",
          data: null,
        });
      }

      const asset = await prisma.asset.create({
        data: {
          code: code.trim(),
          name: name.trim(),
          description: description?.trim() || null,
          brand: brand?.trim() || null,
          serialNumber: serialNumber?.trim() || null,
          acquisitionDate: parsedDate,
          purchasePrice:
            purchasePrice !== undefined && purchasePrice !== null
              ? String(purchasePrice)
              : null,
          condition: condition?.trim() || "BAIK",
          status: status || "AVAILABLE",
          schoolUnitId: schoolUnit.id,
          categoryId,
          locationId,
        },
        include: {
          schoolUnit: true,
          category: true,
          location: true,
        },
      });

      res.status(201).json({
        pesan: "Aset berhasil ditambahkan",
        data: asset,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          pesan: "Kode aset sudah digunakan",
          data: null,
        });
      }

      console.error("ERROR CREATE ASSET:", error);

      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// =========================
// PATCH - MENGEDIT ASET
// =========================

router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles(...managementRoles),
  async (req, res) => {
    try {
      const data = {};

      const textFields = [
        "code",
        "name",
        "description",
        "brand",
        "serialNumber",
      ];

      for (const field of textFields) {
        if (req.body[field] !== undefined) {
          const value = req.body[field];

          if (
            typeof value !== "string" ||
            (["code", "name"].includes(field) && !value.trim())
          ) {
            return res.status(400).json({
              pesan: `Data ${field} tidak valid`,
              data: null,
            });
          }

          data[field] = value.trim() || null;
        }
      }

      if (req.body.categoryId !== undefined) {
        if (
          typeof req.body.categoryId !== "string" ||
          !req.body.categoryId.trim()
        ) {
          return res.status(400).json({
            pesan: "Kategori tidak valid",
            data: null,
          });
        }

        data.categoryId = req.body.categoryId;
      }

      if (req.body.locationId !== undefined) {
        if (
          typeof req.body.locationId !== "string" ||
          !req.body.locationId.trim()
        ) {
          return res.status(400).json({
            pesan: "Lokasi tidak valid",
            data: null,
          });
        }

        data.locationId = req.body.locationId;
      }

      if (req.body.condition !== undefined) {
        if (
          typeof req.body.condition !== "string" ||
          !req.body.condition.trim()
        ) {
          return res.status(400).json({
            pesan: "Kondisi tidak valid",
            data: null,
          });
        }

        data.condition = req.body.condition.trim();
      }

      if (req.body.status !== undefined) {
        if (!assetStatuses.includes(req.body.status)) {
          return res.status(400).json({
            pesan: "Status aset tidak valid",
            data: null,
          });
        }

        data.status = req.body.status;
      }

      if (req.body.acquisitionDate !== undefined) {
        if (!req.body.acquisitionDate) {
          data.acquisitionDate = null;
        } else {
          const date = new Date(req.body.acquisitionDate);

          if (Number.isNaN(date.getTime())) {
            return res.status(400).json({
              pesan: "Tanggal perolehan tidak valid",
              data: null,
            });
          }

          data.acquisitionDate = date;
        }
      }

      if (req.body.purchasePrice !== undefined) {
        const price = req.body.purchasePrice;

        if (price === null || price === "") {
          data.purchasePrice = null;
        } else if (
          !Number.isFinite(Number(price)) ||
          Number(price) < 0
        ) {
          return res.status(400).json({
            pesan: "Harga pembelian tidak valid",
            data: null,
          });
        } else {
          data.purchasePrice = String(price);
        }
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          pesan: "Tidak ada data yang diperbarui",
          data: null,
        });
      }

      const asset = await prisma.asset.update({
        where: { id: req.params.id },
        data,
        include: {
          schoolUnit: true,
          category: true,
          location: true,
        },
      });

      res.json({
        pesan: "Aset berhasil diperbarui",
        data: asset,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          pesan: "Aset tidak ditemukan",
          data: null,
        });
      }

      if (error.code === "P2002") {
        return res.status(409).json({
          pesan: "Kode aset sudah digunakan",
          data: null,
        });
      }

      if (error.code === "P2003") {
        return res.status(400).json({
          pesan: "Kategori atau lokasi tidak ditemukan",
          data: null,
        });
      }

      console.error("ERROR UPDATE ASSET:", error);

      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

// =========================
// DELETE - MENGHAPUS ASET
// =========================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(...managementRoles),
  async (req, res) => {
    try {
      await prisma.asset.delete({
        where: { id: req.params.id },
      });

      res.json({
        pesan: "Aset berhasil dihapus",
        data: null,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          pesan: "Aset tidak ditemukan",
          data: null,
        });
      }

      if (error.code === "P2003") {
        return res.status(409).json({
          pesan: "Aset masih memiliki riwayat peminjaman",
          data: null,
        });
      }

      console.error("ERROR DELETE ASSET:", error);

      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);

module.exports = router;
