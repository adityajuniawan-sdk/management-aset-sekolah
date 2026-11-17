
import { useEffect, useState } from "react";
import AssetsPage from "./pages/AssetsPage";
import CatalogPage from "./pages/CatalogPage";
import { apiRequest } from "./services/api";

const API_URL = "http://localhost:3000/api";

const menuItems = [
  "Dashboard",
  "Data Aset",
  "Kategori",
  "Lokasi",
  "Peminjaman",
  "Pengembalian",
];

// Menyamakan format role dari login dan /auth/me
function normalizeUser(userData) {
  if (!userData) return null;

  const role =
    typeof userData.role === "object"
      ? userData.role?.name
      : userData.role;

  return {
    ...userData,
    role: String(role || "").trim().toUpperCase(),
  };
}

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [assets, setAssets] = useState([]);
  const [borrowings, setBorrowings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    const [assetData, borrowingData] = await Promise.all([
      apiRequest("/assets"),
      apiRequest("/borrowings"),
    ]);

    setAssets(assetData);
    setBorrowings(borrowingData);
  }

  useEffect(() => {
    async function checkLogin() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await apiRequest("/auth/me");

        setUser(normalizeUser(currentUser));
        await loadDashboard();
      } catch (err) {
        localStorage.removeItem("token");
        setError("Silakan login kembali.");
      } finally {
        setLoading(false);
      }
    }

    checkLogin();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.pesan || "Login gagal");
      }

      localStorage.setItem("token", result.data.token);

      setUser(normalizeUser(result.data.user));
      setActivePage("Dashboard");

      await loadDashboard();
    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");

    setUser(null);
    setAssets([]);
    setBorrowings([]);
    setPassword("");
    setError("");
    setActivePage("Dashboard");
  }

  const statistics = [
    {
      title: "Total Aset",
      value: assets.length,
      color: "text-gray-900",
      description: "Seluruh aset sekolah",
    },
    {
      title: "Aset Tersedia",
      value: assets.filter(
        (asset) => asset.status === "AVAILABLE"
      ).length,
      color: "text-green-700",
      description: "Siap digunakan",
    },
    {
      title: "Aset Dipinjam",
      value: assets.filter(
        (asset) => asset.status === "BORROWED"
      ).length,
      color: "text-blue-700",
      description: "Sedang dipinjam",
    },
    {
      title: "Menunggu Persetujuan",
      value: borrowings.filter(
        (item) => item.status === "PENDING"
      ).length,
      color: "text-[#800020]",
      description: "Permintaan peminjaman",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Memuat SnapAsset...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
        <form
          onSubmit={handleLogin}
          className="bg-white w-full max-w-md p-8 rounded-2xl shadow-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#800020]">
              GUNA CIPTA
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              SCHOOL ASSET MANAGEMENT
            </p>

            <h2 className="text-xl font-bold mt-8">
              Login SnapAsset
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Masuk untuk mengelola aset sekolah
            </p>
          </div>

          {error && (
            <p className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </p>
          )}

          <label className="block text-sm font-medium mb-2">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan email"
            required
            className="w-full border border-gray-200 rounded-lg p-3 mb-5 outline-none focus:border-[#800020]"
          />

          <label className="block text-sm font-medium mb-2">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            required
            className="w-full border border-gray-200 rounded-lg p-3 mb-6 outline-none focus:border-[#800020]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800020] text-white p-3 rounded-lg font-semibold hover:bg-[#650019] disabled:opacity-50"
          >
            Masuk
          </button>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 GUNA CIPTA - SnapAsset
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-[#800020] text-white p-6 hidden md:flex md:flex-col">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-wide">
            GUNA CIPTA
          </h1>

          <p className="text-xs text-red-100 mt-1">
            SCHOOL ASSET MANAGEMENT
          </p>
        </div>

        <p className="text-xs text-red-200 uppercase mb-4">
          Menu Utama
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                setActivePage(item);
                setError("");
              }}
              className={`w-full text-left p-3 rounded-lg transition ${
                activePage === item
                  ? "bg-white text-[#800020] font-semibold"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/20 pt-5">
          <p className="text-xs text-red-200">
            APLIKASI
          </p>

          <p className="font-semibold mt-2">
            SnapAsset v1.0
          </p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-5 md:p-10">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activePage}
            </h2>

            <p className="text-gray-500 mt-1">
              Sistem Manajemen Aset GUNA CIPTA
            </p>
          </div>

          <div className="bg-white px-5 py-3 rounded-xl shadow-sm">
            <p className="font-semibold text-gray-800">
              {user.name}
            </p>

            <p className="text-xs text-gray-500">
              {user.role}
            </p>

            <button
              onClick={handleLogout}
              className="text-xs text-[#800020] font-semibold mt-2"
            >
              Keluar
            </button>
          </div>
        </header>

        {error && (
          <p className="bg-red-50 text-red-600 p-4 rounded-xl mb-5">
            {error}
          </p>
        )}

        {activePage === "Dashboard" && (
          <>
            <section className="mb-8">
              <h3 className="text-lg font-bold text-gray-900">
                Ringkasan Aset
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Informasi kondisi aset sekolah saat ini.
              </p>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {statistics.map((item) => (
                <div
                  key={item.title}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                  <p className="text-sm text-gray-500">
                    {item.title}
                  </p>

                  <p className={`text-3xl font-bold mt-3 ${item.color}`}>
                    {item.value}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
              <h3 className="text-lg font-bold text-gray-900">
                Aktivitas Terbaru
              </h3>

              <div className="text-center py-12">
                <p className="text-gray-400">
                  Belum ada aktivitas.
                </p>
              </div>
            </section>
          </>
        )}

        {activePage === "Data Aset" && (
          <AssetsPage user={user} />
        )}

        {activePage === "Kategori" && (
          <CatalogPage
            title="Kategori"
            endpoint="categories"
            user={user}
          />
        )}

        {activePage === "Lokasi" && (
          <CatalogPage
            title="Lokasi"
            endpoint="locations"
            user={user}
          />
        )}

        {activePage === "Peminjaman" && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">
              Peminjaman
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Halaman pengajuan, persetujuan, dan serah terima aset akan dibuat pada tahap berikutnya.
            </p>
          </section>
        )}

        {activePage === "Pengembalian" && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">
              Pengembalian
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Halaman pencatatan pengembalian dan kondisi aset akan dibuat pada tahap berikutnya.
            </p>
          </section>
        )}

        <footer className="text-center text-gray-400 text-xs mt-10">
          © 2026 GUNA CIPTA - SnapAsset
        </footer>
      </main>
    </div>
  );
}

export default App;
