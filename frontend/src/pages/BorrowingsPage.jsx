
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const API_URL = "http://localhost:3000/api";

const staffRoles = [
  "SUPER_ADMIN",
  "PETUGAS_ASET",
];

const statusLabels = {
  PENDING: "Menunggu Persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  BORROWED: "Sedang Dipinjam",
  PARTIALLY_RETURNED: "Sebagian Dikembalikan",
  RETURNED: "Selesai",
};

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStatusStyle(status) {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    BORROWED: "bg-purple-100 text-purple-700",
    PARTIALLY_RETURNED: "bg-orange-100 text-orange-700",
    RETURNED: "bg-green-100 text-green-700",
  };

  return styles[status] || "bg-gray-100 text-gray-600";
}

async function sendRequest(endpoint, method, body) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Permintaan gagal");
  }

  return result.data;
}

function BorrowingsPage({ user, onDataChange }) {
  const [borrowings, setBorrowings] = useState([]);
  const [assets, setAssets] = useState([]);

  const [purpose, setPurpose] = useState("");
  const [borrowingDate, setBorrowingDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAssets, setSelectedAssets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canProcess = staffRoles.includes(user?.role);

  async function loadData() {
    setError("");

    try {
      const [borrowingData, assetData] = await Promise.all([
        apiRequest("/borrowings"),
        apiRequest("/assets"),
      ]);

      setBorrowings(borrowingData);
      setAssets(assetData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleAsset(assetId) {
    setSelectedAssets((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (selectedAssets.length === 0) {
      setError("Pilih minimal satu aset yang ingin dipinjam.");
      return;
    }

    if (dueDate <= borrowingDate) {
      setError("Tanggal pengembalian harus setelah tanggal peminjaman.");
      return;
    }

    setSubmitting(true);

    try {
      await sendRequest("/borrowings", "POST", {
        purpose,
        borrowingDate,
        dueDate,
        assetIds: selectedAssets,
        notes,
      });

      setPurpose("");
      setBorrowingDate("");
      setDueDate("");
      setNotes("");
      setSelectedAssets([]);

      setMessage("Pengajuan peminjaman berhasil dibuat.");

      await loadData();

      if (onDataChange) {
        await onDataChange();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecision(id, decision) {
    const confirmation =
      decision === "APPROVED"
        ? "Setujui pengajuan peminjaman ini?"
        : "Tolak pengajuan peminjaman ini?";

    if (!window.confirm(confirmation)) return;

    setError("");
    setMessage("");
    setBusyId(id);

    try {
      await sendRequest(`/borrowings/${id}/decision`, "PATCH", {
        decision,
      });

      setMessage(
        decision === "APPROVED"
          ? "Peminjaman berhasil disetujui."
          : "Peminjaman berhasil ditolak."
      );

      await loadData();

      if (onDataChange) {
        await onDataChange();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleHandover(id) {
    if (!window.confirm("Lakukan serah terima aset ini?")) return;

    setError("");
    setMessage("");
    setBusyId(id);

    try {
      await sendRequest(`/borrowings/${id}/handover`, "PATCH");

      setMessage("Serah terima aset berhasil dicatat.");

      await loadData();

      if (onDataChange) {
        await onDataChange();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const reservedAssetIds = borrowings
    .filter((item) =>
      ["PENDING", "APPROVED", "BORROWED", "PARTIALLY_RETURNED"].includes(
        item.status
      )
    )
    .flatMap((item) =>
      (item.items || [])
        .filter((detail) => !detail.returnedAt)
        .map((detail) => detail.assetId)
    );

  const availableAssets = assets.filter(
    (asset) =>
      asset.status === "AVAILABLE" &&
      !reservedAssetIds.includes(asset.id)
  );

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-gray-500">
        Memuat data peminjaman...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm">
          {message}
        </div>
      )}

      {/* Form Pengajuan */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            Ajukan Peminjaman
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Isi formulir untuk mengajukan peminjaman aset sekolah.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tujuan Peminjaman
            </label>

            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Contoh: Meminjam laptop untuk kegiatan pembelajaran"
              required
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#800020]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tanggal Peminjaman
              </label>

              <input
                type="date"
                value={borrowingDate}
                onChange={(e) => setBorrowingDate(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#800020]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tanggal Pengembalian
              </label>

              <input
                type="date"
                value={dueDate}
                min={borrowingDate || undefined}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#800020]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              Pilih Aset
            </label>

            {availableAssets.length === 0 ? (
              <p className="bg-gray-50 text-gray-500 p-4 rounded-lg text-sm">
                Belum ada aset yang tersedia untuk dipinjam.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableAssets.map((asset) => (
                  <label
                    key={asset.id}
                    className={`flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition ${
                      selectedAssets.includes(asset.id)
                        ? "border-[#800020] bg-red-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => toggleAsset(asset.id)}
                      className="mt-1 accent-[#800020]"
                    />

                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {asset.name}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Kode: {asset.code}
                      </p>

                      <p className="text-xs text-gray-500">
                        {asset.category?.name || "Tanpa kategori"}
                        {" · "}
                        {asset.location?.name || "Tanpa lokasi"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Aset terpilih: {selectedAssets.length}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Catatan (Opsional)
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan"
              rows={2}
              className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#800020]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || availableAssets.length === 0}
            className="bg-[#800020] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#650019] disabled:opacity-50"
          >
            {submitting ? "Mengirim..." : "Ajukan Peminjaman"}
          </button>
        </form>
      </section>

      {/* Daftar Peminjaman */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Daftar Peminjaman
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Riwayat dan status pengajuan peminjaman aset.
          </p>
        </div>

        {borrowings.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow-sm text-center">
            <p className="text-gray-400">
              Belum ada data peminjaman.
            </p>
          </div>
        ) : (
          borrowings.map((borrowing) => {
            const isOwnRequest =
              borrowing.borrowerId === user.id;

            const canDecide =
              canProcess &&
              borrowing.status === "PENDING" &&
              !isOwnRequest;

            const canHandover =
              canProcess &&
              borrowing.status === "APPROVED";

            return (
              <article
                key={borrowing.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {borrowing.purpose}
                    </h4>

                    <p className="text-sm text-gray-500 mt-1">
                      Peminjam: {borrowing.borrower?.name || "-"}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {borrowing.borrower?.email || ""}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-2 rounded-full ${getStatusStyle(
                      borrowing.status
                    )}`}
                  >
                    {statusLabels[borrowing.status] || borrowing.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">
                      Tanggal Peminjaman
                    </p>
                    <p className="font-medium text-gray-700 mt-1">
                      {formatDate(borrowing.borrowingDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">
                      Batas Pengembalian
                    </p>
                    <p className="font-medium text-gray-700 mt-1">
                      {formatDate(borrowing.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 mt-5 pt-5">
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    Aset yang Dipinjam
                  </p>

                  <div className="space-y-2">
                    {(borrowing.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap justify-between gap-2 bg-gray-50 p-3 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {item.asset?.name || "Aset tidak ditemukan"}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            Kode: {item.asset?.code || "-"}
                          </p>
                        </div>

                        <span className="text-xs text-gray-500">
                          {item.returnedAt
                            ? "Sudah dikembalikan"
                            : "Belum dikembalikan"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {borrowing.approver && (
                  <p className="text-xs text-gray-500 mt-4">
                    Diproses oleh: {borrowing.approver.name}
                  </p>
                )}

                {borrowing.notes && (
                  <p className="text-xs text-gray-500 mt-3">
                    Catatan: {borrowing.notes}
                  </p>
                )}

                {(canDecide || canHandover) && (
                  <div className="flex flex-wrap gap-3 border-t border-gray-100 mt-5 pt-5">
                    {canDecide && (
                      <>
                        <button
                          onClick={() =>
                            handleDecision(borrowing.id, "APPROVED")
                          }
                          disabled={busyId === borrowing.id}
                          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                          Setujui
                        </button>

                        <button
                          onClick={() =>
                            handleDecision(borrowing.id, "REJECTED")
                          }
                          disabled={busyId === borrowing.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                          Tolak
                        </button>
                      </>
                    )}

                    {canHandover && (
                      <button
                        onClick={() => handleHandover(borrowing.id)}
                        disabled={busyId === borrowing.id}
                        className="bg-[#800020] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        Serah Terima Aset
                      </button>
                    )}

                    {busyId === borrowing.id && (
                      <span className="text-xs text-gray-500 self-center">
                        Memproses...
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

export default BorrowingsPage;
