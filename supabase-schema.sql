-- 2a. Tabel master_akun (Chart of Accounts)
CREATE TABLE master_akun (
  kode_akun VARCHAR(10) PRIMARY KEY,
  nama_akun VARCHAR(100) NOT NULL,
  kelompok VARCHAR(20) NOT NULL CHECK (kelompok IN ('Aset','Liabilitas','Ekuitas','Pendapatan','Beban')),
  sub_kelompok VARCHAR(50),
  saldo_normal VARCHAR(6) NOT NULL CHECK (saldo_normal IN ('Debit','Kredit')),
  jenis_aktivitas VARCHAR(20) CHECK (jenis_aktivitas IN ('Operasi','Investasi','Pendanaan')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2b. Tabel master_unit_kerja
CREATE TABLE master_unit_kerja (
  kode_unit VARCHAR(10) PRIMARY KEY,
  nama_unit VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2c. Tabel saldo_awal (titik mulai Neraca)
CREATE TABLE saldo_awal (
  id BIGSERIAL PRIMARY KEY,
  kode_akun VARCHAR(10) NOT NULL REFERENCES master_akun(kode_akun),
  kode_unit VARCHAR(10) NOT NULL REFERENCES master_unit_kerja(kode_unit),
  tahun INT NOT NULL,
  jumlah NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (kode_akun, kode_unit, tahun)
);

-- 2d. Tabel rkap_anggaran (rencana anggaran)
CREATE TABLE rkap_anggaran (
  id BIGSERIAL PRIMARY KEY,
  kode_akun VARCHAR(10) NOT NULL REFERENCES master_akun(kode_akun),
  kode_unit VARCHAR(10) NOT NULL REFERENCES master_unit_kerja(kode_unit),
  tahun INT NOT NULL,
  bulan INT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  jumlah_rkap NUMERIC(18,2) NOT NULL DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (kode_akun, kode_unit, tahun, bulan)
);

-- 2e. Tabel realisasi (data aktual)
CREATE TABLE realisasi (
  id BIGSERIAL PRIMARY KEY,
  kode_akun VARCHAR(10) NOT NULL REFERENCES master_akun(kode_akun),
  kode_unit VARCHAR(10) NOT NULL REFERENCES master_unit_kerja(kode_unit),
  tahun INT NOT NULL,
  bulan INT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  jumlah_realisasi NUMERIC(18,2) NOT NULL DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (kode_akun, kode_unit, tahun, bulan)
);

-- 2f. Matikan Row Level Security untuk prototipe ini
-- Catatan: ini HANYA untuk tahap prototipe internal. Sebelum aplikasi dipakai lebih luas, WAJIB tambahkan auth + RLS yang benar.
ALTER TABLE master_akun DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_unit_kerja DISABLE ROW LEVEL SECURITY;
ALTER TABLE saldo_awal DISABLE ROW LEVEL SECURITY;
ALTER TABLE rkap_anggaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE realisasi DISABLE ROW LEVEL SECURITY;

-- 2g. Seed data master_akun
INSERT INTO master_akun (kode_akun, nama_akun, kelompok, sub_kelompok, saldo_normal, jenis_aktivitas) VALUES
('1101','Kas dan Bank','Aset','Kas dan Setara Kas','Debit',NULL),
('1102','Piutang Usaha','Aset','Aset Lancar','Debit','Operasi'),
('1103','Persediaan','Aset','Aset Lancar','Debit','Operasi'),
('1104','Biaya Dibayar Dimuka','Aset','Aset Lancar','Debit','Operasi'),
('1201','Tanah','Aset','Aset Tetap','Debit','Investasi'),
('1202','Bangunan','Aset','Aset Tetap','Debit','Investasi'),
('1203','Mesin dan Peralatan','Aset','Aset Tetap','Debit','Investasi'),
('2101','Utang Usaha','Liabilitas','Liabilitas Jangka Pendek','Kredit','Operasi'),
('2102','Utang Pajak','Liabilitas','Liabilitas Jangka Pendek','Kredit','Operasi'),
('2103','Biaya Yang Masih Harus Dibayar','Liabilitas','Liabilitas Jangka Pendek','Kredit','Operasi'),
('2201','Utang Bank Jangka Panjang','Liabilitas','Liabilitas Jangka Panjang','Kredit','Pendanaan'),
('3101','Modal Disetor','Ekuitas',NULL,'Kredit','Pendanaan'),
('3102','Laba Ditahan','Ekuitas',NULL,'Kredit',NULL),
('4101','Pendapatan Penjualan/Jasa','Pendapatan','Pendapatan Usaha','Kredit','Operasi'),
('4102','Pendapatan Lain-lain','Pendapatan','Pendapatan Non-Usaha','Kredit','Operasi'),
('5101','Beban Gaji dan Tunjangan','Beban','Beban SDM','Debit','Operasi'),
('5102','Beban Pemasaran','Beban','Beban Operasional','Debit','Operasi'),
('5103','Beban Sewa','Beban','Beban Operasional','Debit','Operasi'),
('5104','Beban Listrik dan Air','Beban','Beban Umum','Debit','Operasi'),
('5105','Beban Administrasi dan Umum','Beban','Beban Umum','Debit','Operasi'),
('5106','Beban Bunga','Beban','Beban Non-Operasional','Debit','Pendanaan');

-- 2h. Seed data master_unit_kerja
INSERT INTO master_unit_kerja (kode_unit, nama_unit) VALUES
('KONS','Konsolidasi Perusahaan'),
('D01','Direksi dan Umum'),
('D02','Pemasaran dan Penjualan'),
('D03','Produksi/Operasional'),
('D04','Keuangan dan Akuntansi'),
('D05','SDM dan Umum');

-- 2i. Seed data saldo_awal
INSERT INTO saldo_awal (kode_akun, kode_unit, tahun, jumlah) VALUES
('1101','KONS',2025,500000000),
('1102','KONS',2025,150000000),
('1103','KONS',2025,100000000),
('1104','KONS',2025,20000000),
('1201','KONS',2025,800000000),
('1202','KONS',2025,600000000),
('1203','KONS',2025,350000000),
('2101','KONS',2025,120000000),
('2102','KONS',2025,30000000),
('2103','KONS',2025,25000000),
('2201','KONS',2025,645000000),
('3101','KONS',2025,1500000000),
('3102','KONS',2025,200000000);

-- 2j. Views untuk laporan otomatis

-- Gabungan RKAP + Realisasi jadi satu sumber data
CREATE OR REPLACE VIEW vw_transaksi_gabungan AS
SELECT kode_akun, kode_unit, tahun, bulan, jumlah_rkap AS jumlah, 'RKAP' AS sumber FROM rkap_anggaran
UNION ALL
SELECT kode_akun, kode_unit, tahun, bulan, jumlah_realisasi AS jumlah, 'Realisasi' AS sumber FROM realisasi;

-- Laba Rugi detail per akun
CREATE OR REPLACE VIEW vw_laba_rugi AS
SELECT t.tahun, t.bulan, t.sumber, t.kode_unit, mu.nama_unit,
  ma.kelompok, ma.sub_kelompok, t.kode_akun, ma.nama_akun, SUM(t.jumlah) AS jumlah
FROM vw_transaksi_gabungan t
JOIN master_akun ma ON ma.kode_akun = t.kode_akun
JOIN master_unit_kerja mu ON mu.kode_unit = t.kode_unit
WHERE ma.kelompok IN ('Pendapatan','Beban')
GROUP BY t.tahun, t.bulan, t.sumber, t.kode_unit, mu.nama_unit, ma.kelompok, ma.sub_kelompok, t.kode_akun, ma.nama_akun;

-- Laba Rugi ringkas (total pendapatan, beban, laba bersih)
CREATE OR REPLACE VIEW vw_laba_rugi_ringkas AS
SELECT tahun, bulan, sumber, kode_unit,
  SUM(CASE WHEN kelompok='Pendapatan' THEN jumlah ELSE 0 END) AS total_pendapatan,
  SUM(CASE WHEN kelompok='Beban' THEN jumlah ELSE 0 END) AS total_beban,
  SUM(CASE WHEN kelompok='Pendapatan' THEN jumlah ELSE -jumlah END) AS laba_bersih
FROM vw_laba_rugi
GROUP BY tahun, bulan, sumber, kode_unit;

-- Neraca: saldo_awal + akumulasi pergerakan
CREATE OR REPLACE VIEW vw_neraca AS
WITH pergerakan AS (
  SELECT t.kode_akun, t.kode_unit, t.tahun, t.bulan, t.sumber, t.jumlah
  FROM vw_transaksi_gabungan t
  JOIN master_akun ma ON ma.kode_akun = t.kode_akun
  WHERE ma.kelompok IN ('Aset','Liabilitas','Ekuitas')
),
kumulatif AS (
  SELECT kode_akun, kode_unit, tahun, bulan, sumber,
    SUM(jumlah) OVER (PARTITION BY kode_akun, kode_unit, tahun, sumber
                       ORDER BY bulan ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS kumulatif_pergerakan
  FROM pergerakan
)
SELECT k.tahun, k.bulan, k.sumber, k.kode_unit, mu.nama_unit,
  ma.kelompok, ma.sub_kelompok, k.kode_akun, ma.nama_akun,
  COALESCE(sa.jumlah,0) + k.kumulatif_pergerakan AS saldo_akhir
FROM kumulatif k
JOIN master_akun ma ON ma.kode_akun = k.kode_akun
JOIN master_unit_kerja mu ON mu.kode_unit = k.kode_unit
LEFT JOIN saldo_awal sa ON sa.kode_akun = k.kode_akun AND sa.kode_unit = k.kode_unit AND sa.tahun = k.tahun;

-- Arus Kas (metode tidak langsung yang disederhanakan)
CREATE OR REPLACE VIEW vw_arus_kas AS
WITH laba AS (
  SELECT tahun, bulan, sumber, kode_unit, laba_bersih AS arus_kas_operasi_dari_laba
  FROM vw_laba_rugi_ringkas
),
pergerakan_non_kas AS (
  SELECT t.tahun, t.bulan, t.sumber, t.kode_unit, ma.jenis_aktivitas, ma.kelompok, t.jumlah
  FROM vw_transaksi_gabungan t
  JOIN master_akun ma ON ma.kode_akun = t.kode_akun
  WHERE ma.kelompok IN ('Aset','Liabilitas','Ekuitas')
    AND ma.sub_kelompok IS DISTINCT FROM 'Kas dan Setara Kas'
),
agregat AS (
  SELECT tahun, bulan, sumber, kode_unit, jenis_aktivitas,
    SUM(CASE WHEN kelompok = 'Aset' THEN -jumlah ELSE jumlah END) AS arus_kas
  FROM pergerakan_non_kas
  WHERE jenis_aktivitas IS NOT NULL
  GROUP BY tahun, bulan, sumber, kode_unit, jenis_aktivitas
)
SELECT
  COALESCE(l.tahun, a.tahun) AS tahun,
  COALESCE(l.bulan, a.bulan) AS bulan,
  COALESCE(l.sumber, a.sumber) AS sumber,
  COALESCE(l.kode_unit, a.kode_unit) AS kode_unit,
  COALESCE(SUM(CASE WHEN a.jenis_aktivitas='Operasi' THEN a.arus_kas END),0) + COALESCE(MAX(l.arus_kas_operasi_dari_laba),0) AS arus_kas_operasi,
  COALESCE(SUM(CASE WHEN a.jenis_aktivitas='Investasi' THEN a.arus_kas END),0) AS arus_kas_investasi,
  COALESCE(SUM(CASE WHEN a.jenis_aktivitas='Pendanaan' THEN a.arus_kas END),0) AS arus_kas_pendanaan
FROM laba l
FULL OUTER JOIN agregat a ON l.tahun=a.tahun AND l.bulan=a.bulan AND l.sumber=a.sumber AND l.kode_unit=a.kode_unit
GROUP BY COALESCE(l.tahun,a.tahun), COALESCE(l.bulan,a.bulan), COALESCE(l.sumber,a.sumber), COALESCE(l.kode_unit,a.kode_unit);

-- RKAP vs Realisasi dengan selisih/variance
CREATE OR REPLACE VIEW vw_variance_rkap_realisasi AS
SELECT
  COALESCE(r.kode_akun, a.kode_akun) AS kode_akun, ma.nama_akun, ma.kelompok,
  COALESCE(r.kode_unit, a.kode_unit) AS kode_unit, mu.nama_unit,
  COALESCE(r.tahun, a.tahun) AS tahun, COALESCE(r.bulan, a.bulan) AS bulan,
  COALESCE(r.jumlah_rkap, 0) AS jumlah_rkap,
  COALESCE(a.jumlah_realisasi, 0) AS jumlah_realisasi,
  COALESCE(a.jumlah_realisasi,0) - COALESCE(r.jumlah_rkap,0) AS selisih,
  CASE WHEN COALESCE(r.jumlah_rkap,0) = 0 THEN NULL
       ELSE ROUND(((COALESCE(a.jumlah_realisasi,0) - COALESCE(r.jumlah_rkap,0)) / r.jumlah_rkap) * 100, 2)
  END AS persen_selisih
FROM rkap_anggaran r
FULL OUTER JOIN realisasi a
  ON r.kode_akun=a.kode_akun AND r.kode_unit=a.kode_unit AND r.tahun=a.tahun AND r.bulan=a.bulan
JOIN master_akun ma ON ma.kode_akun = COALESCE(r.kode_akun, a.kode_akun)
JOIN master_unit_kerja mu ON mu.kode_unit = COALESCE(r.kode_unit, a.kode_unit);
