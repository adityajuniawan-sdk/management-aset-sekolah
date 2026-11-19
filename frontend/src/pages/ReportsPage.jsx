
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [assets, setAssets] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reportType, setReportType] = useState("assets");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const [summaryData, assetData, borrowingData] =
        await Promise.all([
          apiRequest("/reports/summary"),
          apiRequest("/reports/assets"),
          apiRequest("/reports/borrowings"),
        ]);

      setSummary(summaryData);
      setAssets(Array.isArray(assetData) ? assetData : []);
      setBorrowings(
        Array.isArray(borrowingData) ? borrowingData : []
      );
    } catch (err) {
      setError(err.message || "Gagal mengambil laporan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function applyFilter() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (status) params.set("status", status);

      const query = params.toString()
        ? `?${params.toString()}`
        : "";

      if (reportType === "assets") {
        const data = await apiRequest(`/reports/assets${query}`);
        setAssets(Array.isArray(data) ? data : []);
      } else {
        const data = await apiRequest(
          `/reports/borrowings${query}`
        );
        setBorrowings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message || "Gagal menerapkan filter");
    } finally {
      setLoading(false);
    }
  }

  function resetFilter() {
    setStartDate("");
    setEndDate("");
    setStatus("");
    loadReports();
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  function statusLabel(value) {
    return String(value || "-").replaceAll("_", " ");
  }

  if (loading && !summary) {
    return (
      <div className="p-6 text-center text-gray-500">
        Memuat laporan...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Laporan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ringkasan dan data laporan aset sekolah
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[#800020] px-4 py-2 text-sm font-semibold text-white hover:bg-[#650019]"
        >
          Cetak Laporan
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Aset"
            value={summary.totalAssets}
          />
          <SummaryCard
            title="Aset Tersedia"
            value={summary.assetStatus?.available}
          />
          <SummaryCard
            title="Aset Dipinjam"
            value={summary.assetStatus?.borrowed}
          />
          <SummaryCard
            title="Menunggu Persetujuan"
            value={summary.pendingBorrowings}
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold">Filter Laporan</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Jenis Laporan
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="assets">Laporan Aset</option>
              <option value="borrowings">Laporan Peminjaman</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="">Semua Status</option>
              {reportType === "assets" ? (
                <>
                  <option value="AVAILABLE">Tersedia</option>
                  <option value="BORROWED">Dipinjam</option>
                  <option value="MAINTENANCE">Perawatan</option>
                  <option value="DAMAGED">Rusak</option>
                </>
              ) : (
                <>
                  <option value="PENDING">Menunggu</option>
                  <option value="APPROVED">Disetujui</option>
                  <option value="BORROWED">Dipinjam</option>
                  <option value="PARTIALLY_RETURNED">
                    Dikembalikan Sebagian
                  </option>
                  <option value="RETURNED">Dikembalikan</option>
                  <option value="REJECTED">Ditolak</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={applyFilter}
            className="rounded-lg bg-[#800020] px-4 py-2 text-sm font-semibold text-white"
          >
            Terapkan Filter
          </button>

          <button
            onClick={resetFilter}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <h2 className="font-bold">
            {reportType === "assets"
              ? "Data Laporan Aset"
              : "Data Laporan Peminjaman"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {reportType === "assets"
              ? `${assets.length} data aset`
              : `${borrowings.length} data peminjaman`}
          </p>
        </div>

        <div className="overflow-x-auto">
          {reportType === "assets" ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">No.</th>
                  <th className="p-4">Kode</th>
                  <th className="p-4">Nama Aset</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Lokasi</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tanggal Perolehan</th>
                  <th className="p-4">Harga</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => (
                  <tr
                    key={asset.id}
                    className="border-t border-gray-100"
                  >
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4">{asset.code || "-"}</td>
                    <td className="p-4 font-medium">
                      {asset.name || "-"}
                    </td>
                    <td className="p-4">
                      {asset.category?.name || "-"}
                    </td>
                    <td className="p-4">
                      {asset.location?.name || "-"}
                    </td>
                    <td className="p-4">
                      {statusLabel(asset.status)}
                    </td>
                    <td className="p-4">
                      {formatDate(asset.acquisitionDate)}
                    </td>
                    <td className="p-4">
                      {formatCurrency(asset.price)}
                    </td>
                  </tr>
                ))}

                {assets.length === 0 && (
                  <EmptyRow colSpan={8} />
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">No.</th>
                  <th className="p-4">Peminjam</th>
                  <th className="p-4">Tanggal Pinjam</th>
                  <th className="p-4">Jatuh Tempo</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Jumlah Aset</th>
                </tr>
              </thead>
              <tbody>
                {borrowings.map((borrowing, index) => (
                  <tr
                    key={borrowing.id}
                    className="border-t border-gray-100"
                  >
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-medium">
                      {borrowing.borrower?.name || "-"}
                    </td>
                    <td className="p-4">
                      {formatDate(borrowing.borrowingDate)}
                    </td>
                    <td className="p-4">
                      {formatDate(borrowing.dueDate)}
                    </td>
                    <td className="p-4">
                      {statusLabel(borrowing.status)}
                    </td>
                    <td className="p-4">
                      {borrowing.items?.length || 0}
                    </td>
                  </tr>
                ))}

                {borrowings.length === 0 && (
                  <EmptyRow colSpan={6} />
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
          }

          button, select, input {
            display: none !important;
          }

          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[#800020]">
        {value ?? 0}
      </p>
    </div>
  );
}

function EmptyRow({ colSpan }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="p-8 text-center text-gray-500"
      >
        Belum ada data laporan.
      </td>
    </tr>
  );
}
