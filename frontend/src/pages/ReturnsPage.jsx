
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const API_URL = "http://localhost:3000/api";

const staffRoles = [
  "SUPER_ADMIN",
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
];

const statusLabels = {
  BORROWED: "Sedang Dipinjam",
  PARTIALLY_RETURNED: "Dikembalikan Sebagian",
  RETURNED: "Sudah Dikembalikan",
};

function getRole(user) {
  const role =
    typeof user?.role === "object"
      ? user.role?.name
      : user?.role;

  return String(role || "").trim().toUpperCase();
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function sendRequest(endpoint, method, body) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Permintaan gagal diproses");
  }

  return result.data;
}

export default function ReturnsPage({ user, onDataChange }) {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittingId, setSubmittingId] = useState("");

  const [returnForms, setReturnForms] = useState({});

  const userRole = getRole(user);
  const canManage = staffRoles.includes(userRole);

  async function loadData() {
    try {
      setError("");

      const data = await apiRequest("/borrowings");

      setBorrowings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal mengambil data pengembalian");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateForm(itemId, field, value) {
    setReturnForms((previous) => ({
      ...previous,
      [itemId]: {
        conditionOnReturn:
          previous[itemId]?.conditionOnReturn || "BAIK",
        assetStatus:
          previous[itemId]?.assetStatus || "AVAILABLE",
        notes: previous[itemId]?.notes || "",
        ...previous[itemId],
        [field]: value,
      },
    }));
  }

  async function handleReturn(borrowingId, itemId) {
    const form = returnForms[itemId] || {
      conditionOnReturn: "BAIK",
      assetStatus: "AVAILABLE",
      notes: "",
    };

    if (
      !window.confirm(
        "Catat pengembalian aset ini?"
      )
    ) {
      return;
    }

    try {
      setSubmittingId(itemId);
      setError("");
      setSuccess("");

      await sendRequest(
        `/borrowings/${borrowingId}/return`,
        "PATCH",
        {
          itemId: String(itemId),
          conditionOnReturn: form.conditionOnReturn,
          assetStatus: form.assetStatus,
          notes: form.notes,
        }
      );

      setSuccess("Pengembalian aset berhasil dicatat.");

      setReturnForms((previous) => {
        const updated = { ...previous };
        delete updated[itemId];
        return updated;
      });

      await loadData();

      if (onDataChange) {
        await onDataChange();
      }
    } catch (err) {
      setError(err.message || "Gagal mencatat pengembalian");
    } finally {
      setSubmittingId("");
    }
  }

  const activeBorrowings = borrowings.filter((borrowing) =>
    ["BORROWED", "PARTIALLY_RETURNED"].includes(
      borrowing.status
    )
  );

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Memuat data pengembalian...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Pengembalian Aset
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Kelola pengembalian aset yang sedang dipinjam.
        </p>
      </div>

      {/* ALERT */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {!canManage && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Pencatatan pengembalian hanya dapat dilakukan oleh
          Admin Sekolah, Petugas Aset, atau Super Admin.
        </div>
      )}

      {/* DAFTAR PEMINJAMAN AKTIF */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Daftar Aset yang Belum Dikembalikan
            </h3>
            <p className="text-sm text-gray-500">
              Pilih kondisi aset setelah diterima.
            </p>
          </div>

          <button
            onClick={loadData}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Muat Ulang
          </button>
        </div>

        {activeBorrowings.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
            Tidak ada aset yang sedang dipinjam.
          </div>
        ) : (
          <div className="space-y-5">
            {activeBorrowings.map((borrowing) => {
              const unreturnedItems = (
                borrowing.items || []
              ).filter((item) => !item.returnedAt);

              if (unreturnedItems.length === 0) {
                return null;
              }

              return (
                <div
                  key={borrowing.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  {/* INFORMASI PEMINJAMAN */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {borrowing.purpose}
                      </h4>

                      <p className="mt-1 text-sm text-gray-500">
                        Peminjam:{" "}
                        {borrowing.borrower?.name || "-"}
                      </p>

                      <p className="text-sm text-gray-500">
                        Tanggal pinjam:{" "}
                        {formatDate(borrowing.borrowingDate)}
                      </p>

                      <p className="text-sm text-gray-500">
                        Batas pengembalian:{" "}
                        {formatDate(borrowing.dueDate)}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                      {statusLabels[borrowing.status] ||
                        borrowing.status}
                    </span>
                  </div>

                  {/* ITEM ASET */}
                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                    {unreturnedItems.map((item) => {
                      const form = returnForms[item.id] || {
                        conditionOnReturn: "BAIK",
                        assetStatus: "AVAILABLE",
                        notes: "",
                      };

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg bg-gray-50 p-4"
                        >
                          <div className="mb-4">
                            <h5 className="font-semibold text-gray-800">
                              {item.asset?.name || "Aset"}
                            </h5>

                            <p className="text-xs text-gray-500">
                              Kode aset: {item.asset?.code || "-"}
                            </p>

                            <p className="text-xs text-gray-500">
                              Kondisi saat dipinjam:{" "}
                              {item.conditionOnBorrow || "-"}
                            </p>
                          </div>

                          {canManage && (
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Kondisi Saat Dikembalikan
                                </label>

                                <select
                                  value={form.conditionOnReturn}
                                  onChange={(event) =>
                                    updateForm(
                                      item.id,
                                      "conditionOnReturn",
                                      event.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                >
                                  <option value="BAIK">
                                    Baik
                                  </option>
                                  <option value="RUSAK_RINGAN">
                                    Rusak Ringan
                                  </option>
                                  <option value="RUSAK_BERAT">
                                    Rusak Berat
                                  </option>
                                </select>
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Status Aset Setelah Dikembalikan
                                </label>

                                <select
                                  value={form.assetStatus}
                                  onChange={(event) =>
                                    updateForm(
                                      item.id,
                                      "assetStatus",
                                      event.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                >
                                  <option value="AVAILABLE">
                                    Tersedia
                                  </option>
                                  <option value="MAINTENANCE">
                                    Dalam Perawatan
                                  </option>
                                  <option value="DAMAGED">
                                    Rusak
                                  </option>
                                </select>
                              </div>

                              <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Catatan Pengembalian
                                </label>

                                <textarea
                                  value={form.notes}
                                  onChange={(event) =>
                                    updateForm(
                                      item.id,
                                      "notes",
                                      event.target.value
                                    )
                                  }
                                  rows={2}
                                  placeholder="Catatan kondisi aset..."
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <button
                                  onClick={() =>
                                    handleReturn(
                                      borrowing.id,
                                      item.id
                                    )
                                  }
                                  disabled={
                                    submittingId === item.id
                                  }
                                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {submittingId === item.id
                                    ? "Menyimpan..."
                                    : "Konfirmasi Pengembalian"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
