const authorizeRoles = require("../middleware/authorize");
const express = require("express");
const prisma = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

const activeStatuses = [
  "PENDING",
  "APPROVED",
  "BORROWED",
  "PARTIALLY_RETURNED",
];

// GET - Melihat daftar peminjaman
router.get("/", authenticateToken, async (req, res) => {
  try {
    const staffRoles = [
      "SUPER_ADMIN",
      "ADMIN_SEKOLAH",
      "PETUGAS_ASET",
      "KEPALA_SEKOLAH",
    ];

    const where = staffRoles.includes(req.user.role)
      ? {}
      : { borrowerId: req.user.id };

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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      pesan: "Data peminjaman berhasil diambil",
      data: borrowings,
    });
  } catch (error) {
    console.error("ERROR GET BORROWING:", error);

    res.status(500).json({
      pesan: "Terjadi kesalahan pada server",
      data: null,
    });
  }
});

// POST - Mengajukan peminjaman
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      purpose,
      borrowingDate,
      dueDate,
      assetIds,
      notes,
    } = req.body;

    if (
      typeof purpose !== "string" ||
      !purpose.trim() ||
      !borrowingDate ||
      !dueDate ||
      !Array.isArray(assetIds) ||
      assetIds.length === 0 ||
      !assetIds.every((id) => typeof id === "string" && id.trim())
    ) {
      return res.status(400).json({
        pesan: "Tujuan, tanggal, dan aset wajib diisi",
        data: null,
      });
    }

    if (new Set(assetIds).size !== assetIds.length) {
      return res.status(400).json({
        pesan: "Aset yang sama tidak boleh dipilih berulang",
        data: null,
      });
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return res.status(400).json({
        pesan: "Catatan harus berupa teks",
        data: null,
      });
    }

    const startDate = new Date(borrowingDate);
    const endDate = new Date(dueDate);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      return res.status(400).json({
        pesan: "Tanggal pengembalian harus setelah tanggal peminjaman",
        data: null,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Periksa apakah aset sedang dalam pengajuan atau peminjaman aktif
      const reservedItems = await tx.borrowingItem.findMany({
        where: {
          assetId: { in: assetIds },
          borrowing: {
            status: { in: activeStatuses },
          },
        },
        select: {
          assetId: true,
        },
      });

      if (reservedItems.length > 0) {
        return { type: "reserved" };
      }

      // Pastikan semua aset tersedia
      const availableAssets = await tx.asset.findMany({
        where: {
          id: { in: assetIds },
          status: "AVAILABLE",
        },
        select: {
          id: true,
        },
      });

      if (availableAssets.length !== assetIds.length) {
        return { type: "unavailable" };
      }

      const borrowing = await tx.borrowing.create({
        data: {
          borrowerId: req.user.id,
          purpose: purpose.trim(),
          borrowingDate: startDate,
          dueDate: endDate,
          notes: notes?.trim() || null,
          status: "PENDING",
          items: {
            create: assetIds.map((assetId) => ({
              assetId,
              conditionOnBorrow: "BAIK",
            })),
          },
        },
        include: {
          items: {
            include: {
              asset: true,
            },
          },
        },
      });

      return {
        type: "created",
        borrowing,
      };
    });

    if (result.type === "reserved") {
      return res.status(409).json({
        pesan: "Salah satu aset sedang dalam pengajuan atau peminjaman aktif",
        data: null,
      });
    }

    if (result.type === "unavailable") {
      return res.status(409).json({
        pesan: "Salah satu aset tidak tersedia",
        data: null,
      });
    }

    res.status(201).json({
      pesan: "Pengajuan peminjaman berhasil dibuat",
      data: result.borrowing,
    });
  } catch (error) {
    console.error("ERROR CREATE BORROWING:", error);

    res.status(500).json({
      pesan: "Terjadi kesalahan pada server",
      data: null,
    });
  }
});


// PATCH - Menyetujui atau menolak peminjaman
router.patch(
  "/:id/decision",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN_SEKOLAH", "PETUGAS_ASET"),
  async (req, res) => {
    try {
      const { decision } = req.body;

      if (!["APPROVED", "REJECTED"].includes(decision)) {
        return res.status(400).json({
          pesan: "Keputusan harus APPROVED atau REJECTED",
          data: null,
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const borrowing = await tx.borrowing.findUnique({
          where: {
            id: req.params.id,
          },
          include: {
            items: {
              include: {
                asset: true,
              },
            },
          },
        });

        if (!borrowing) {
          return { type: "not_found" };
        }

        // Pengaju tidak boleh menyetujui pengajuannya sendiri
        if (borrowing.borrowerId === req.user.id) {
          return { type: "self_approval" };
        }

        // Hanya pengajuan PENDING yang bisa diproses
        if (borrowing.status !== "PENDING") {
          return { type: "already_processed" };
        }

        // Pastikan semua aset masih tersedia sebelum disetujui
        if (
          decision === "APPROVED" &&
          borrowing.items.some(
            (item) => item.asset.status !== "AVAILABLE"
          )
        ) {
          return { type: "unavailable" };
        }

        const updated = await tx.borrowing.update({
          where: {
            id: req.params.id,
          },
          data: {
            status: decision,
            approverId: req.user.id,
            approvedAt:
              decision === "APPROVED" ? new Date() : null,
          },
          include: {
            borrower: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                asset: true,
              },
            },
          },
        });

        return {
          type: "success",
          borrowing: updated,
        };
      });

      if (result.type === "not_found") {
        return res.status(404).json({
          pesan: "Pengajuan peminjaman tidak ditemukan",
          data: null,
        });
      }

      if (result.type === "self_approval") {
        return res.status(403).json({
          pesan: "Tidak boleh menyetujui pengajuan sendiri",
          data: null,
        });
      }

      if (result.type === "already_processed") {
        return res.status(409).json({
          pesan: "Pengajuan sudah diproses",
          data: null,
        });
      }

      if (result.type === "unavailable") {
        return res.status(409).json({
          pesan: "Salah satu aset sudah tidak tersedia",
          data: null,
        });
      }

      res.json({
        pesan:
          decision === "APPROVED"
            ? "Peminjaman berhasil disetujui"
            : "Peminjaman berhasil ditolak",
        data: result.borrowing,
      });
    } catch (error) {
      console.error("ERROR BORROWING DECISION:", error);

      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);


// PATCH - Serah terima aset
router.patch(
  "/:id/handover",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN_SEKOLAH", "PETUGAS_ASET"),
  async (req, res) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const borrowing = await tx.borrowing.findUnique({
          where: { id: req.params.id },
          include: {
            items: true,
          },
        });

        if (!borrowing) {
          return { type: "not_found" };
        }

        if (borrowing.status !== "APPROVED") {
          return { type: "invalid_status" };
        }

        if (borrowing.items.length === 0) {
          return { type: "empty" };
        }

        const assetIds = borrowing.items.map(
          (item) => item.assetId
        );

        const updatedAssets = await tx.asset.updateMany({
          where: {
            id: { in: assetIds },
            status: "AVAILABLE",
          },
          data: {
            status: "BORROWED",
          },
        });

        if (updatedAssets.count !== assetIds.length) {
          throw new Error("ASSET_NOT_AVAILABLE");
        }

        const updatedBorrowing = await tx.borrowing.update({
          where: { id: req.params.id },
          data: {
            status: "BORROWED",
          },
          include: {
            borrower: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                asset: true,
              },
            },
          },
        });

        return {
          type: "success",
          borrowing: updatedBorrowing,
        };
      });

      if (result.type === "not_found") {
        return res.status(404).json({
          pesan: "Peminjaman tidak ditemukan",
          data: null,
        });
      }

      if (result.type === "invalid_status") {
        return res.status(400).json({
          pesan: "Peminjaman belum disetujui",
          data: null,
        });
      }

      if (result.type === "empty") {
        return res.status(400).json({
          pesan: "Tidak ada aset dalam peminjaman",
          data: null,
        });
      }

      res.json({
        pesan: "Serah terima aset berhasil",
        data: result.borrowing,
      });
    } catch (error) {
      if (error.message === "ASSET_NOT_AVAILABLE") {
        return res.status(409).json({
          pesan: "Ada aset yang sudah tidak tersedia",
          data: null,
        });
      }

      console.error("ERROR HANDOVER:", error);

      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);


// PATCH - Pengembalian aset
router.patch(
  "/:id/return",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN_SEKOLAH", "PETUGAS_ASET"),
  async (req, res) => {
    try {
      const {
        itemId,
        conditionOnReturn,
        assetStatus,
        notes,
      } = req.body;

      const allowedAssetStatuses = [
        "AVAILABLE",
        "MAINTENANCE",
        "DAMAGED",
      ];

      if (
        typeof itemId !== "string" ||
        !itemId.trim() ||
        typeof conditionOnReturn !== "string" ||
        !conditionOnReturn.trim() ||
        !allowedAssetStatuses.includes(assetStatus)
      ) {
        return res.status(400).json({
          pesan: "Data pengembalian tidak valid",
          data: null,
        });
      }

      if (
        notes !== undefined &&
        notes !== null &&
        typeof notes !== "string"
      ) {
        return res.status(400).json({
          pesan: "Catatan harus berupa teks",
          data: null,
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const borrowing = await tx.borrowing.findUnique({
          where: { id: req.params.id },
        });

        if (!borrowing) {
          return { type: "not_found" };
        }

        if (
          !["BORROWED", "PARTIALLY_RETURNED"].includes(
            borrowing.status
          )
        ) {
          return { type: "invalid_status" };
        }

        const item = await tx.borrowingItem.findFirst({
          where: {
            id: itemId,
            borrowingId: req.params.id,
          },
          include: {
            asset: true,
          },
        });

        if (!item) {
          return { type: "item_not_found" };
        }

        if (item.returnedAt) {
          return { type: "already_returned" };
        }

        if (item.asset.status !== "BORROWED") {
          return { type: "asset_not_borrowed" };
        }

        const itemData = {
          conditionOnReturn: conditionOnReturn.trim(),
          returnedAt: new Date(),
        };

        if (notes !== undefined) {
          itemData.notes = notes?.trim() || null;
        }

        await tx.borrowingItem.update({
          where: { id: item.id },
          data: itemData,
        });

        await tx.asset.update({
          where: { id: item.assetId },
          data: {
            status: assetStatus,
            condition: conditionOnReturn.trim(),
          },
        });

        const remainingItems = await tx.borrowingItem.count({
          where: {
            borrowingId: req.params.id,
            returnedAt: null,
          },
        });

        const updatedBorrowing = await tx.borrowing.update({
          where: { id: req.params.id },
          data: {
            status:
              remainingItems === 0
                ? "RETURNED"
                : "PARTIALLY_RETURNED",
          },
          include: {
            items: {
              include: {
                asset: true,
              },
            },
          },
        });

        return {
          type: "success",
          borrowing: updatedBorrowing,
        };
      });

      if (result.type === "not_found") {
        return res.status(404).json({
          pesan: "Peminjaman tidak ditemukan",
          data: null,
        });
      }

      if (result.type === "invalid_status") {
        return res.status(400).json({
          pesan: "Aset belum diserahkan kepada peminjam",
          data: null,
        });
      }

      if (result.type === "item_not_found") {
        return res.status(404).json({
          pesan: "Item peminjaman tidak ditemukan",
          data: null,
        });
      }

      if (result.type === "already_returned") {
        return res.status(409).json({
          pesan: "Aset sudah dikembalikan",
          data: null,
        });
      }

      if (result.type === "asset_not_borrowed") {
        return res.status(409).json({
          pesan: "Status aset bukan BORROWED",
          data: null,
        });
      }

      res.json({
        pesan: "Pengembalian aset berhasil dicatat",
        data: result.borrowing,
      });
    } catch (error) {
      console.error("ERROR RETURN ASSET:", error);

      res.status(500).json({
        pesan: "Terjadi kesalahan pada server",
        data: null,
      });
    }
  }
);


module.exports = router;
