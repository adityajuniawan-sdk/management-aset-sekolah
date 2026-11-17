
const menuItems = [
  "Dashboard",
  "Data Aset",
  "Kategori",
  "Lokasi",
  "Peminjaman",
  "Pengembalian",
]

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-[#800020] text-white p-6 hidden md:block">
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
          {menuItems.map((item, index) => (
            <a
              key={item}
              href="#"
              className={`block p-3 rounded-lg transition ${
                index === 0
                  ? "bg-white text-[#800020] font-semibold"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="mt-16 border-t border-white/20 pt-5">
          <p className="text-xs text-red-200">
            APLIKASI
          </p>
          <p className="font-semibold mt-2">
            SnapAsset v1.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-5 md:p-10">

        {/* Header */}
        <header className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dashboard
            </h2>
            <p className="text-gray-500 mt-1">
              Sistem Manajemen Aset GUNA CIPTA
            </p>
          </div>

          <div className="bg-white px-5 py-3 rounded-xl shadow-sm">
            <p className="font-semibold text-gray-800">
              Administrator
            </p>
            <p className="text-xs text-gray-500">
              Admin Sekolah
            </p>
          </div>
        </header>

        {/* Welcome */}
        <section className="bg-[#800020] text-white p-7 rounded-2xl mb-8">
          <p className="text-red-100 text-sm">
            SELAMAT DATANG
          </p>
          <h3 className="text-2xl font-bold mt-2">
            GUNA CIPTA
          </h3>
          <p className="text-red-100 mt-2 text-sm">
            Kelola aset sekolah dengan lebih mudah dan terstruktur.
          </p>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          {[
            {
              title: "Total Aset",
              value: "0",
              color: "text-gray-900",
            },
            {
              title: "Aset Tersedia",
              value: "0",
              color: "text-green-700",
            },
            {
              title: "Aset Dipinjam",
              value: "0",
              color: "text-blue-700",
            },
            {
              title: "Menunggu Persetujuan",
              value: "0",
              color: "text-[#800020]",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <p className="text-sm text-gray-500">
                {item.title}
              </p>
              <h3 className={`text-3xl font-bold mt-3 ${item.color}`}>
                {item.value}
              </h3>
            </div>
          ))}

        </section>

        {/* Activity */}
        <section className="bg-white p-6 rounded-2xl shadow-sm mt-8 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            Aktivitas Terbaru
          </h3>

          <div className="text-center py-12">
            <p className="text-gray-400">
              Belum ada aktivitas.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-400 text-xs mt-10">
          © 2026 GUNA CIPTA - SnapAsset
        </footer>

      </main>
    </div>
  )
}

export default App
