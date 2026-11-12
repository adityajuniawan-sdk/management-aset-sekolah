# ANALISIS KEBUTUHAN
## MANAGEMENT ASET SEKOLAH

### 1. Deskripsi Sistem
Management Aset Sekolah merupakan aplikasi berbasis web
yang digunakan untuk mengelola seluruh aset milik sekolah,
mulai dari pendataan, peminjaman, pengembalian,
pemindahan, hingga pemeliharaan aset.

### 2. Latar Belakang
Pengelolaan aset secara manual dapat menyebabkan
kesulitan dalam pencatatan, pencarian, dan pemantauan
kondisi barang. Oleh karena itu, dibutuhkan sistem
terkomputerisasi agar pengelolaan aset lebih efektif.

### 3. Tujuan Sistem
- Mempermudah pendataan aset sekolah.
- Mengetahui jumlah dan kondisi aset.
- Mengetahui lokasi penyimpanan aset.
- Mengelola peminjaman dan pengembalian.
- Mencatat riwayat pemeliharaan aset.
- Menyediakan laporan aset sekolah.


## Aktor Sistem

Sistem Management Aset Sekolah memiliki tiga aktor:

1. Admin / Petugas Aset
   - Mengelola data aset.
   - Mengelola kategori dan lokasi.
   - Memproses pengajuan peminjaman.
   - Mencatat pengembalian aset.
   - Melihat laporan.

2. Kepala Sekolah
   - Melihat dashboard.
   - Memantau data aset.
   - Melihat laporan aset dan peminjaman.

3. Guru / Staff
   - Melihat daftar dan detail aset.
   - Mengajukan peminjaman.
   - Melihat status dan riwayat peminjaman.


### 
### 5. Kebutuhan Fungsional

1. Pengguna dapat melakukan login dan logout.
2. Admin dapat mengelola data aset.
3. Admin dapat mengelola kategori aset.
4. Admin dapat mengelola lokasi aset.
5. Pengguna dapat melihat daftar dan detail aset.
6. Guru / Staff dapat mengajukan peminjaman aset.
7. Admin dapat menyetujui atau menolak peminjaman.
8. Admin dapat mencatat pengembalian aset.
9. Pengguna dapat melihat status peminjaman.
10. Sistem dapat menampilkan laporan aset dan peminjaman.



## Kebutuhan Nonfungsional

1. Sistem berbasis web dan dapat diakses melalui browser.
2. Tampilan responsif untuk komputer dan smartphone.
3. Pengguna harus login sebelum mengakses fitur sistem.
4. Sistem menggunakan JWT untuk autentikasi.
5. Hak akses pengguna dibatasi berdasarkan role.
6. Password pengguna disimpan dalam bentuk hash.
7. Database menggunakan PostgreSQL melalui Supabase.
8. Sistem menggunakan Prisma ORM untuk pengelolaan database.
9. Antarmuka dibuat sederhana dan mudah digunakan.


### 7. Teknologi
- React JS
- Express JS
- Supabase PostgreSQL
- Prisma ORM
- JWT Authentication
- Tailwind CSS


### 8. Ruang Lingkup Sistem

Sistem Management Aset Sekolah mencakup:

1. Login dan autentikasi pengguna.
2. Dashboard informasi aset.
3. Manajemen data aset.
4. Manajemen kategori aset.
5. Manajemen lokasi aset.
6. Peminjaman dan persetujuan.
7. Pengembalian aset.
8. Laporan inventaris dan peminjaman.

### 9. Batasan Sistem


## Batasan Sistem

1. Sistem hanya digunakan untuk pengelolaan aset sekolah.
2. Sistem memiliki tiga role: Admin / Petugas Aset, Kepala Sekolah, dan Guru / Staff.
3. Setiap transaksi peminjaman hanya melibatkan satu aset.
4. Persetujuan peminjaman dilakukan oleh Admin / Petugas Aset.
5. Kepala Sekolah hanya dapat melihat informasi dan laporan.
6. Guru / Staff hanya dapat mengajukan dan melihat peminjamannya sendiri.
7. Sistem tidak mencakup pengelolaan keuangan sekolah.
8. Sistem tidak mencakup pengadaan barang secara otomatis.


### 10. Batas Kompleksitas Proyek

Aplikasi dikembangkan sebagai sistem pengelolaan
aset sekolah sederhana dengan tiga role pengguna:

1. Admin / Petugas Aset
2. Kepala Sekolah
3. Guru / Staff

Fitur utama meliputi:
- Dashboard
- Manajemen data aset
- Manajemen kategori dan lokasi
- Peminjaman aset
- Pengembalian aset
- Laporan aset

Sistem menggunakan enam tabel database utama.
Fitur tambahan yang tidak termasuk kebutuhan utama
tidak dikembangkan pada tahap awal.


### 11. Aturan Bisnis

#### A. Pengelolaan Aset
1. Setiap aset memiliki kode unik.
2. Setiap aset memiliki kategori dan lokasi.
3. Aset yang sedang dipinjam tidak dapat dipinjam kembali.
4. Aset rusak tidak dapat dipinjam.

#### B. Peminjaman
1. Guru atau Staff dapat mengajukan peminjaman.
2. Pengajuan harus mencantumkan tanggal pinjam dan tanggal kembali.
3. Pengajuan berstatus menunggu persetujuan.
4. Admin dapat menyetujui atau menolak pengajuan.
5. Aset berubah menjadi dipinjam setelah disetujui.

#### C. Pengembalian
1. Admin mencatat pengembalian aset.
2. Kondisi aset diperiksa saat pengembalian.
3. Aset yang baik kembali tersedia.
4. Aset yang rusak berstatus perlu diperbaiki.
5. Transaksi selesai setelah pengembalian dicatat.
