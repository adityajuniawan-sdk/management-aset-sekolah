
# USE CASE MANAGEMENT ASET SEKOLAH

## 1. Aktor

1. Admin / Petugas Aset
2. Kepala Sekolah
3. Guru / Staff

## 2. Use Case Admin / Petugas Aset

- Login dan logout
- Melihat dashboard
- Mengelola data aset (tambah, lihat, ubah, hapus)
- Mengelola kategori aset
- Mengelola lokasi aset
- Melihat pengajuan peminjaman
- Menyetujui atau menolak peminjaman
- Mencatat pengembalian aset
- Melihat laporan aset dan peminjaman

## 3. Use Case Kepala Sekolah

- Login dan logout
- Melihat dashboard
- Melihat data aset
- Melihat laporan aset
- Melihat laporan peminjaman

## 4. Use Case Guru / Staff

- Login dan logout
- Melihat daftar aset
- Melihat detail aset
- Mengajukan peminjaman
- Melihat status peminjaman
- Melihat riwayat peminjaman

## 5. Alur Utama Sistem

1. Pengguna melakukan login.
2. Sistem memeriksa akun dan role pengguna.
3. Sistem menampilkan dashboard sesuai role.
4. Guru / Staff dapat mengajukan peminjaman aset.
5. Admin memeriksa pengajuan.
6. Admin menyetujui atau menolak pengajuan.
7. Jika disetujui, status aset berubah menjadi dipinjam.
8. Admin mencatat pengembalian aset.
9. Status aset diperbarui menjadi tersedia atau rusak.
10. Kepala Sekolah dapat melihat laporan.

## 6. Batasan Hak Akses

- Admin memiliki akses pengelolaan data dan transaksi.
- Kepala Sekolah hanya memiliki akses pemantauan dan laporan.
- Guru / Staff hanya dapat melihat aset dan mengelola pengajuan peminjamannya sendiri.
