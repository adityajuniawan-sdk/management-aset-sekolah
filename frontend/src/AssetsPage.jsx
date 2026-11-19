
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api";

function getRoleName(role) {
  if (!role) return "";

  if (typeof role === "string") {
    return role.trim().toUpperCase();
  }

  if (typeof role === "object") {
    return String(
      role.name ||
      role.roleName ||
      role.nama ||
      ""
    ).trim().toUpperCase();
  }

  return "";
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatStatus(status) {
  const statuses = {
    AVAILABLE: "Tersedia",
    BORROWED: "Dipinjam",
    MAINTENANCE: "Pemeliharaan",
    DAMAGED: "Rusak",
  };

  return statuses[status] || status || "-";
}

const initialForm = {
  code: "",
  name: "",
  description: "",
  brand: "",
  serialNumber: "",
  acquisitionDate: "",
  purchasePrice: "",
  condition: "BAIK",
  status: "AVAILABLE",
  categoryId: "",
  locationId: "",
};

export default function AssetsPage({ user }) {
  const userRole = getRoleName(user?.role);

  const canManage = [
    "SUPER_ADMIN",
    "ADMIN_SEKOLAH",
    "PETUGAS_ASET",
  ].includes(userRole);

  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem("token");

  async function request(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.pesan || "Terjadi kesalahan");
    }

    return result.data;
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [assetData, categoryData, locationData] =
        await Promise.all([
          request("/assets"),
          request("/categories"),
          request("/locations"),
        ]);

      setAssets(Array.isArray(assetData) ? assetData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setLocations(Array.isArray(locationData) ? locationData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  }

  function openEditForm(asset) {
    setEditingId(asset.id);

    setForm({
      code: asset.code || "",
      name: asset.name || "",
      description: asset.description || "",
      brand: asset.brand || "",
      serialNumber: asset.serialNumber || "",
      acquisitionDate: asset.acquisitionDate
        ? String(asset.acquisitionDate).slice(0, 10)
        : "",
      purchasePrice: asset.purchasePrice ?? "",
      condition: asset.condition || "BAIK",
      status: asset.status || "AVAILABLE",
      categoryId: asset.categoryId || "",
      locationId: asset.locationId || "",
    });

    setShowForm(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canManage) {
      alert("Kamu tidak memiliki akses untuk mengelola aset.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        purchasePrice: form.purchasePrice
          ? Number(form.purchasePrice)
          : null,
        categoryId: form.categoryId,
        locationId: form.locationId,
        acquisitionDate: form.acquisitionDate || null,
      };

      const endpoint = editingId
        ? `/assets/${editingId}`
        : "/assets";

      await request(endpoint, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      alert(
        editingId
          ? "Aset berhasil diperbarui."
          : "Aset berhasil ditambahkan."
      );

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);

      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canManage) return;

    const confirmed = window.confirm(
      "Yakin ingin menghapus aset ini?"
    );

    if (!confirmed) return;

    try {
      await request(`/assets/${id}`, {
        method: "DELETE",
      });

      alert("Aset berhasil dihapus.");
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredAssets = assets.filter((asset) => {
    const keyword = search.toLowerCase();

    return (
      asset.name?.toLowerCase().includes(keyword) ||
      asset.code?.toLowerCase().includes(keyword) ||
      asset.brand?.toLowerCase().includes(keyword) ||
      asset.category?.name?.toLowerCase().includes(keyword) ||
      asset.location?.name?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Data Aset
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola dan pantau seluruh aset sekolah.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-lg bg-[#800020] px-5 py-3 font-semibold text-white transition hover:bg-[#650019]"
        >
          + Tambah Aset
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Daftar Aset
            </h2>
            <p className="text-sm text-gray-500">
              Total {assets.length} aset terdaftar
            </p>
          </div>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari aset..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-[#800020] sm:w-64"
          />
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">
            Memuat data aset...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Aset</th>
                  <th className="px-4 py-3">Merek</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Kondisi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Harga</th>
                  {canManage && (
                    <th className="px-4 py-3">Aksi</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManage ? 9 : 8}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      Tidak ada data aset.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {asset.code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {asset.name}
                      </td>
                      <td className="px-4 py-3">
                        {asset.brand || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {asset.category?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {asset.location?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {asset.condition || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {formatStatus(asset.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {formatRupiah(asset.purchasePrice)}
                      </td>

                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(asset)}
                              className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(asset.id)}
                              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Edit Aset" : "Tambah Aset"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Lengkapi informasi aset sekolah.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kode Aset
                  </label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    placeholder="AST-002"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nama Aset
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Nama aset"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Merek
                  </label>
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="Contoh: Lenovo"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nomor Seri
                  </label>
                  <input
                    name="serialNumber"
                    value={form.serialNumber}
                    onChange={handleChange}
                    placeholder="Nomor seri"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kategori
                  </label>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Lokasi
                  </label>
                  <select
                    name="locationId"
                    value={form.locationId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  >
                    <option value="">Pilih lokasi</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tanggal Perolehan
                  </label>
                  <input
                    type="date"
                    name="acquisitionDate"
                    value={form.acquisitionDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Harga Perolehan
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="purchasePrice"
                    value={form.purchasePrice}
                    onChange={handleChange}
                    placeholder="200000"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kondisi
                  </label>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  >
                    <option value="BAIK">Baik</option>
                    <option value="RUSAK_RINGAN">Rusak Ringan</option>
                    <option value="RUSAK_BERAT">Rusak Berat</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                  >
                    <option value="AVAILABLE">Tersedia</option>
                    <option value="BORROWED">Dipinjam</option>
                    <option value="MAINTENANCE">Pemeliharaan</option>
                    <option value="DAMAGED">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Keterangan tambahan aset..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#800020]"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#800020] px-5 py-2.5 font-semibold text-white hover:bg-[#650019] disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Simpan Aset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
