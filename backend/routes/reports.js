const express = require("express");
const prisma = require("../db");
const authenticateToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");

const router = express.Router();

const reportRoles = [
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
  "KEPALA_SEKOLAH",
];

// Membuat filter tanggal
const getDateFilter = (startDate, endDate) => {
  const filter = {};

  if (startDate || endDate) {
    filter.gte = startDate ? new Date(startDate) : undefined;
    filter.lte = endDate
      ? new Date(`${endDate}T23:59:59.999`)
      : undefined;
  }

  return Object.keys(filter).length ? filter : undefined;
};

// GET - Ringkasan laporan
router.get(
  "/summary",
  authenticateToken,
  authorizeRoles(...reportRoles),
  async (req, res) => {
    try {
      const [
        totalAssets,
        available,
        borrowed,
        maintenance,
        damaged,
        totalBorrowings,
        pendingBorrowings,
      ] = await Promise.all([
        prisma.asset.count(),
        prisma.asset.count({ where: { status: "AVAILABLE" } }),
        prisma.asset.count({ where: { status: "BORROWED" } }),
        prisma.asset.count({ where: { status: "MAINTENANCE" } }),
        prisma.asset.count({ where: { status: "DAMAGED" } }),
        prisma.borrowing.count(),
        prisma.borrowing.count({ where: { status: "PENDING" } }),
      ]);

      return res.json({
        pesan: "Ringkasan laporan berhasil diambil",
        data: {
          totalAssets,
          assetStatus: {
            available,
            borrowed,
            maintenance,
            damaged,
          },
          totalBorrowings,
          pendingBorrowings,
        },
      });
    } catch (error) {
      console.error("ERROR REPORT SUMMARY:", error);

      return res.status(500).json({
        pesan: "Gagal mengambil ringkasan laporan",
        data: null,
      });
    }
  }
);

// GET - Laporan aset
router.get(
  "/assets",
  authenticateToken,
  authorizeRoles(...reportRoles),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        categoryId,
        locationId,
        status,
      } = req.query;

      const acquisitionDate = getDateFilter(startDate, endDate);

      const where = {
        ...(categoryId && { categoryId }),
        ...(locationId && { locationId }),
        ...(status && { status }),
        ...(acquisitionDate && { acquisitionDate }),
      };

      const assets = await prisma.asset.findMany({
        where,
        include: {
          category: true,
          location: true,
          schoolUnit: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.json({
        pesan: "Laporan aset berhasil diambil",
        data: assets,
      });
    } catch (error) {
      console.error("ERROR ASSET REPORT:", error);

      return res.status(500).json({
        pesan: "Gagal mengambil laporan aset",
        data: null,
      });
    }
  }
);

// GET - Laporan peminjaman
router.get(
  "/borrowings",
  authenticateToken,
  authorizeRoles(...reportRoles),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        status,
      } = req.query;

      const borrowingDate = getDateFilter(startDate, endDate);

      const where = {
        ...(borrowingDate && { borrowingDate }),
        ...(status && { status }),
      };

      const borrowings = await prisma.borrowing.findMany({
        where,
        include: {
          borrower: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              asset: {
                include: {
                  category: true,
                  location: true,
                  schoolUnit: true,
                },
              },
            },
          },
        },
        orderBy: {
          borrowingDate: "desc",
        },
      });

      return res.json({
        pesan: "Laporan peminjaman berhasil diambil",
        data: borrowings,
      });
    } catch (error) {
      console.error("ERROR BORROWING REPORT:", error);

      return res.status(500).json({
        pesan: "Gagal mengambil laporan peminjaman",
        data: null,
      });
    }
  }
);

module.exports = router;