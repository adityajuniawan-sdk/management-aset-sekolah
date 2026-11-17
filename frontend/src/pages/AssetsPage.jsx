
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api";

const emptyForm = {
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

const statusOptions = [
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "BORROWED", label: "Dipinjam" },
  { value: "MAINTENANCE", label: "Perawatan" },
  { value: "DAMAGED", label: "Rusak" },
];

function AssetsPage({ user }) {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const canManage = [
    "SUPER_ADMIN",
    "ADMIN_SEKOLAH",
    "PETUGAS_ASET",
  ].includes(user?.role);

  async function request(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.pesan || "Terjadi kesalahan");
    }

    return result;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [assetResult, categoryResult, locationResult] =
        await Promise.all([
          request("/assets"),
          request("/categories"),
          request("/locations"),
        ]);

      setAssets(assetResult.data || []);
      setCategories(categoryResult.data || []);
      setLocations(locationResult.data || []);
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
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(asset) {
    setForm({
      code: asset.code || "",
      name: asset.name || "",
      description: asset.description || "",
      brand: asset.brand || "",
      serialNumber: asset.serialNumber || "",
      acquisitionDate: asset.acquisitionDate
        ? new Date(asset.acquisitionDate).toISOString().slice(0, 10)
        : "",
      purchasePrice: asset.purchasePrice ?? "",
      condition: asset.condition || "BAIK",
      status: asset.status || "AVAILABLE",
      categoryId: asset.categoryId || "",
      locationId: asset.locationId || "",
    });

    setEditingId(asset.id);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      acquisitionDate: form.acquisitionDate || null,
      purchasePrice:
        form.purchasePrice === ""
          ? null
          : Number(form.purchasePrice),
    };

    try {
      if (editingId) {
        const result = await request(`/assets/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        setSuccess(result.pesan || "Aset berhasil diperbarui");
      } else {
        const result = await request("/assets", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess(result.pesan || "Aset berhasil ditambahkan");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(asset) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus aset "${asset.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const result = await request(`/assets/${asset.id}`, {
        method: "DELETE",
      });

      setSuccess(result.pesan || "Aset berhasil dihapus");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatStatus(status) {
    const found = statusOptions.find(
      (item) => item.value === status
    );

    return found ? found.label : status;
  }

  function formatPrice(price) {
    if (price === null || price === undefined || price === "") {
      return "-";
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(price));
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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Data Aset Sekolah
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Kelola seluruh inventaris aset GUNA CIPTA.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openAddForm}
            className="bg-[#800020] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#650019]"
          >
            + Tambah Aset
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-5 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-5 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode, nama, merek, kategori, atau lokasi..."
          className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#800020]"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Memuat data aset...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Data aset tidak ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">No.</th>
                  <th className="p-4">Kode</th>
                  <th className="p-4">Nama Aset</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Lokasi</th>
                  <th className="p-4">Kondisi</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Harga</th>
                  {canManage && <th className="p-4">Aksi</th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredAssets.map((asset, index) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-medium">{asset.code}</td>

                    <td className="p-4">
                      <p className="font-semibold text-gray-800">
                        {asset.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {asset.brand || "-"}
                      </p>
                    </td>

                    <td className="p-4">
                      {asset.category?.name || "-"}
                    </td>
                    <td className="p-4">
                      {asset.location?.name || "-"}
                    </td>
                    <td className="p-4">
                      {asset.condition || "-"}
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                        {formatStatus(asset.status)}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {formatPrice(asset.purchasePrice)}
                    </td>

                    {canManage && (
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(asset)}
                            className="text-blue-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl my-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Aset" : "Tambah Aset"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Lengkapi informasi aset sekolah.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 text-2xl"
                aria-label="Tutup formulir"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Kode Aset *">
                  <input name="code" value={form.code} onChange={handleChange} required className="form-input" placeholder="Contoh: AST-001" />
                </FormField>

                <FormField label="Nama Aset *">
                  <input name="name" value={form.name} onChange={handleChange} required className="form-input" placeholder="Nama aset" />
                </FormField>

                <FormField label="Kategori *">
                  <select name="categoryId" value={form.categoryId} onChange={handleChange} required className="form-input">
                    <option value="">Pilih kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Lokasi *">
                  <select name="locationId" value={form.locationId} onChange={handleChange} required className="form-input">
                    <option value="">Pilih lokasi</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Merek">
                  <input name="brand" value={form.brand} onChange={handleChange} className="form-input" placeholder="Merek aset" />
                </FormField>

                <FormField label="Nomor Seri">
                  <input name="serialNumber" value={form.serialNumber} onChange={handleChange} className="form-input" placeholder="Nomor seri" />
                </FormField>

                <FormField label="Tanggal Perolehan">
                  <input type="date" name="acquisitionDate" value={form.acquisitionDate} onChange={handleChange} className="form-input" />
                </FormField>

                <FormField label="Harga Pembelian">
                  <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} min="0" className="form-input" placeholder="Contoh: 2500000" />
                </FormField>

                <FormField label="Kondisi">
                  <input name="condition" value={form.condition} onChange={handleChange} required className="form-input" placeholder="Contoh: BAIK" />
                </FormField>

                <FormField label="Status">
                  <select name="status" value={form.status} onChange={handleChange} className="form-input">
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Deskripsi">
                    <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="form-input" placeholder="Keterangan tambahan aset" />
                  </FormField>
                </div>
              </div>

              {(categories.length === 0 || locations.length === 0) && (
                <p className="text-sm text-red-600 mt-4">
                  Pastikan kategori dan lokasi sudah tersedia sebelum menyimpan aset.
                </p>
              )}

              <div className="flex justify-end gap-3 mt-7">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 rounded-lg border border-gray-200 text-gray-600">
                  Batal
                </button>

                <button type="submit" disabled={saving || categories.length === 0 || locations.length === 0} className="px-5 py-3 rounded-lg bg-[#800020] text-white font-semibold hover:bg-[#650019] disabled:opacity-50">
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Aset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </span>
      <div className="[&>input]:w-full [&>input]:border [&>input]:border-gray-200 [&>input]:rounded-lg [&>input]:p-3 [&>input]:outline-none [&>input]:focus:border-[#800020] [&>select]:w-full [&>select]:border [&>select]:border-gray-200 [&>select]:rounded-lg [&>select]:p-3 [&>select]:outline-none [&>select]:focus:border-[#800020] [&>textarea]:w-full [&>textarea]:border [&>textarea]:border-gray-200 [&>textarea]:rounded-lg [&>textarea]:p-3 [&>textarea]:outline-none [&>textarea]:focus:border-[#800020]">
        {children}
      </div>
    </label>
  );
}

export default AssetsPage;
