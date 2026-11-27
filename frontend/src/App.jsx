
import { useEffect, useState } from "react";
import AssetsPage from "./pages/AssetsPage";
import CatalogPage from "./pages/CatalogPage";
import BorrowingsPage from "./pages/BorrowingsPage";
import ReturnsPage from "./pages/ReturnsPage";
import ReportsPage from "./pages/ReportsPage";
import { apiRequest } from "./services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const menuItems = [
  "Dashboard",
  "Data Aset",
  "Kategori",
  "Lokasi",
  "Peminjaman",
  "Pengembalian",
  "Laporan",
];

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

function formatDate(dateValue) {
  if (!dateValue) return "Tanggal tidak tersedia";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Tanggal tidak tersedia";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBorrowingStatus(status) {
  const statusLabels = {
    PENDING: "Menunggu persetujuan",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    BORROWED: "Sedang dipinjam",
    PARTIALLY_RETURNED: "Dikembalikan sebagian",
    RETURNED: "Sudah dikembalikan",
  };

  return statusLabels[status] || "Status peminjaman diperbarui";
}

function getRecentActivities(assets, borrowings) {
  const assetActivities = assets.map((asset) => ({
    id: `asset-${asset.id}`,
    title: "Aset ditambahkan",
    description: `${asset.name || "Aset"} (${asset.code || "-"})`,
    date: asset.createdAt || asset.acquisitionDate,
    type: "asset",
  }));

  const borrowingActivities = borrowings.map((borrowing) => {
    const borrowerName =
      borrowing.borrower?.name ||
      borrowing.borrowerName ||
      "Pengguna";

    return {
      id: `borrowing-${borrowing.id}`,
      title: getBorrowingStatus(borrowing.status),
      description: `${borrowerName} • ${borrowing.purpose || "Peminjaman aset"}`,
      date: borrowing.createdAt || borrowing.borrowingDate,
      type: "borrowing",
    };
  });

  return [...assetActivities, ...borrowingActivities]
    .filter((activity) => activity.date)
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    )
    .slice(0, 6);
}

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [assets, setAssets] = useState([]);
  const [borrowings, setBorrowings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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
    setMenuOpen(false);
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

  const recentActivities = getRecentActivities(
    assets,
    borrowings
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Memuat SnapAsset...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#800020] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-2xl font-bold">GC</span>
            </div>

            <p className="text-xs font-bold tracking-widest text-[#800020]">
              YAYASAN LEMBAGA GUNA CIPTA
            </p>

            <h1 className="text-xl font-bold text-gray-900 mt-2">
              SMK GUNA CIPTA
            </h1>

            <p className="text-xs text-gray-500 mt-1">
              SCHOOL ASSET MANAGEMENT
            </p>

            <div className="border-t border-gray-100 mt-6 pt-6">
              <h2 className="text-xl font-bold text-gray-900">
                Login SnapAsset
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Sistem Informasi Manajemen Aset Sekolah
              </p>
            </div>
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
            className="w-full bg-[#800020] text-white p-3 rounded-lg font-semibold hover:bg-[#650019] disabled:opacity-50 transition"
          >
            Masuk
          </button>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 Yayasan Lembaga Guna Cipta
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-x-hidden">

      {/* Tombol Hamburger Mobile */}
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        className="md:hidden fixed top-4 left-4 z-[70] bg-[#800020] text-white w-11 h-11 rounded-xl shadow-lg text-xl flex items-center justify-center"
        aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Overlay Mobile */}
      {menuOpen && (
        <button
          onClick={() => setMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-50"
          aria-label="Tutup menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-[min(18rem,85vw)] h-dvh overflow-y-auto bg-[#800020] text-white p-5 md:p-6 flex flex-col transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0 md:h-screen md:w-64 md:shrink-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white text-[#800020] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg font-bold">GC</span>
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-wide">
                YAYASAN LEMBAGA
              </h1>

              <h2 className="text-base font-bold">
                GUNA CIPTA
              </h2>
            </div>
          </div>

          <div className="mt-5 border-t border-white/20 pt-4">
            <p className="text-xs text-red-100">
              SMK GUNA CIPTA
            </p>

            <p className="text-xs text-red-200 mt-1">
              SCHOOL ASSET MANAGEMENT
            </p>
          </div>
        </div>

        <p className="text-xs text-red-200 uppercase mb-4 tracking-wider">
          Menu Utama
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                setActivePage(item);
                setError("");
                setMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`w-full text-left p-3 rounded-lg transition ${
                activePage === item
                  ? "bg-white text-[#800020] font-semibold shadow-sm"
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

          <p className="text-xs text-red-200 mt-1">
            SMK Guna Cipta
          </p>

          <button
            onClick={handleLogout}
            className="w-full mt-5 p-3 text-left rounded-lg border border-white/20 hover:bg-white/10 transition text-sm font-semibold"
          >
            Keluar dari Aplikasi
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden px-4 pb-6 pt-20 sm:px-6 md:p-8 lg:p-10">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-7 md:mb-10">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-[#800020] mb-2">
              SNAPASSET / SMK GUNA CIPTA
            </p>

            <h2 className="text-2xl font-bold text-gray-900">
              {activePage}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Sistem Informasi Manajemen Aset Sekolah
            </p>
          </div>

          <div className="bg-white w-full sm:w-auto px-4 py-3 rounded-xl shadow-sm border border-gray-100">
            <p className="font-semibold text-gray-800">
              {user.name}
            </p>

            <p className="text-xs text-gray-500">
              {user.role}
            </p>

            <button
              onClick={handleLogout}
              className="text-xs text-[#800020] font-semibold mt-2 hover:underline"
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

        {/* Dashboard */}
        {activePage === "Dashboard" && (
          <>
            <section className="bg-[#800020] text-white p-5 sm:p-7 md:p-9 rounded-2xl mb-8 shadow-sm">
              <p className="text-xs tracking-widest text-red-100 font-semibold">
                YAYASAN LEMBAGA GUNA CIPTA
              </p>

              <h3 className="text-2xl md:text-3xl font-bold mt-3">
                Selamat Datang di SnapAsset
              </h3>

              <p className="text-sm text-red-100 mt-2 max-w-xl">
                Sistem Informasi Manajemen Aset Sekolah
                untuk membantu pengelolaan aset SMK Guna Cipta
                secara terstruktur dan efisien.
              </p>

              <div className="mt-6 inline-flex items-center bg-white/10 border border-white/20 rounded-lg px-4 py-2">
                <span className="text-sm font-semibold">
                  SMK GUNA CIPTA
                </span>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Ringkasan Aset
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Informasi kondisi aset sekolah saat ini.
              </p>
            </section>

            <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
              {statistics.map((item) => (
                <div
                  key={item.title}
                  className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0"
                >
                  <p className="text-xs sm:text-sm text-gray-500">
                    {item.title}
                  </p>

                  <p className={`text-2xl sm:text-3xl font-bold mt-3 ${item.color}`}>
                    {item.value}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </section>

            <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Aktivitas Terbaru
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Ringkasan data aset dan peminjaman terbaru.
                  </p>
                </div>

                <span className="text-xs text-gray-400">
                  Maksimal 6 aktivitas
                </span>
              </div>

              {recentActivities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    Belum ada aktivitas.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 sm:gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          activity.type === "asset"
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {activity.type === "asset" ? (
                          <span className="text-lg">+</span>
                        ) : (
                          <span className="text-sm font-bold">P</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800">
                          {activity.title}
                        </p>

                        <p className="text-sm text-gray-500 mt-1 break-words">
                          {activity.description}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Halaman Data Aset */}
        {activePage === "Data Aset" && (
          <AssetsPage user={user} />
        )}

        {/* Halaman Kategori */}
        {activePage === "Kategori" && (
          <CatalogPage
            title="Kategori"
            endpoint="categories"
            user={user}
          />
        )}

        {/* Halaman Lokasi */}
        {activePage === "Lokasi" && (
          <CatalogPage
            title="Lokasi"
            endpoint="locations"
            user={user}
          />
        )}

        {/* Halaman Peminjaman */}
        {activePage === "Peminjaman" && (
          <BorrowingsPage
            user={user}
            onDataChange={loadDashboard}
          />
        )}

        {/* Halaman Pengembalian */}
        {activePage === "Pengembalian" && (
          <ReturnsPage
            user={user}
            onDataChange={loadDashboard}
          />
        )}

        {/* Halaman Laporan */}
        {activePage === "Laporan" && (
          <ReportsPage user={user} />
        )}

        <footer className="text-center text-gray-400 text-xs mt-10 pb-4">
          © 2026 Yayasan Lembaga Guna Cipta • SnapAsset
        </footer>
      </main>
    </div>
  );
}

export default App;
