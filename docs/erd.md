
# ERD MANAGEMENT ASET SEKOLAH

## 1. Tabel users
- id (PK)
- name
- email (UNIQUE)
- password
- role (admin, kepala_sekolah, guru)
- created_at
- updated_at

## 2. Tabel categories
- id (PK)
- name
- description

## 3. Tabel locations
- id (PK)
- name
- description

## 4. Tabel assets
- id (PK)
- asset_code (UNIQUE)
- name
- description
- category_id (FK)
- location_id (FK)
- condition (baik, rusak)
- status (tersedia, dipinjam)
- created_at
- updated_at

## 5. Tabel borrowings
- id (PK)
- user_id (FK -> users.id)
- asset_id (FK -> assets.id)
- approved_by (FK -> users.id, nullable)
- borrowing_date
- due_date
- returned_at (nullable)
- return_condition (nullable)
- status (menunggu, disetujui, ditolak, selesai)
- notes
- created_at

## 6. Relasi Antar Tabel

1. users memiliki banyak borrowings.
2. users dapat menjadi petugas yang menyetujui banyak borrowings.
3. categories memiliki banyak assets.
4. locations memiliki banyak assets.
5. assets memiliki banyak borrowings.
6. Setiap borrowing dimiliki oleh satu user dan satu asset.
