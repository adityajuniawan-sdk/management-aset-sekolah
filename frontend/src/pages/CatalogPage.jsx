
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function CatalogPage({ title, endpoint, user }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const role =
    typeof user?.role === "object"
      ? user.role?.name
      : user?.role;

  const canManage = [
    "SUPER_ADMIN",
    "ADMIN_SEKOLAH",
    "PETUGAS_ASET",
  ].includes(role);

  async function request(url, options = {}) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.pesan || "Permintaan gagal");
    }

    return result;
  }

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const result = await request(`/${endpoint}`);
      setItems(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [endpoint]);

  function resetForm() {
    setName("");
    setDescription("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = JSON.stringify({
        name,
        description,
      });

      const url = editingId
        ? `/${endpoint}/${editingId}`
        : `/${endpoint}`;

      await request(url, {
        method: editingId ? "PATCH" : "POST",
        body: payload,
      });

      setSuccess(
        editingId
          ? `${title} berhasil diperbarui`
          : `${title} berhasil ditambahkan`
      );

      resetForm();
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setError("");
    setSuccess("");
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus ${title.toLowerCase()} ini?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await request(`/${endpoint}/${id}`, {
        method: "DELETE",
      });

      setSuccess(`${title} berhasil dihapus`);
      await loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            {editingId ? `Edit ${title}` : `Tambah ${title}`}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Kelola data {title.toLowerCase()} sekolah.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        {canManage ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nama {title}
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Masukkan nama ${title.toLowerCase()}`}
                required
                className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#800020]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Deskripsi
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Masukkan deskripsi (opsional)"
                rows="3"
                className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#800020]"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#800020] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#650019] disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : `Tambah ${title}`}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="border border-gray-300 px-5 py-3 rounded-lg text-gray-600"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            Akun kamu hanya memiliki akses untuk melihat data.
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            Daftar {title}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Total {items.length} data terdaftar.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10">
            Memuat data...
          </p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            Belum ada data {title.toLowerCase()}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-4">No.</th>
                  <th className="p-4">Nama</th>
                  <th className="p-4">Deskripsi</th>
                  <th className="p-4">Jumlah Aset</th>
                  {canManage && (
                    <th className="p-4">Aksi</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100"
                  >
                    <td className="p-4">{index + 1}</td>

                    <td className="p-4 font-semibold text-gray-800">
                      {item.name}
                    </td>

                    <td className="p-4 text-gray-500">
                      {item.description || "-"}
                    </td>

                    <td className="p-4">
                      {item._count?.assets ?? 0} aset
                    </td>

                    {canManage && (
                      <td className="p-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-700 font-semibold"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 font-semibold"
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
      </section>
    </div>
  );
}

export default CatalogPage;

