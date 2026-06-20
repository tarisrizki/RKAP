import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TAHUN_START = 2025;
const TAHUN_END = 2026;

// Akun kelompok
const akunPendapatan = ['4101', '4102'];
const akunBeban = ['5101', '5102', '5103', '5104', '5105', '5106'];
const akunBalanceSheet = ['1101', '1102', '1103', '1104', '1201', '1202', '1203', '2101', '2102', '2103', '2201', '3101', '3102'];

// Unit kerja
const unitPendapatan = ['D02', 'D03'];
const unitBeban = ['D01', 'D02', 'D03', 'D04', 'D05'];

// Helper to generate random number in range
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Keep track of anomalies created
let anomalyCount = 0;
const MAX_ANOMALIES = 5;

interface RkapData {
  kode_akun: string;
  kode_unit: string;
  tahun: number;
  bulan: number;
  jumlah_rkap: number;
  keterangan: string | null;
}

interface RealisasiData {
  kode_akun: string;
  kode_unit: string;
  tahun: number;
  bulan: number;
  jumlah_realisasi: number;
  keterangan: string | null;
}

async function run() {
  console.log("Mulai generate dummy data...");
  const rkapBuffer: RkapData[] = [];
  const realisasiBuffer: RealisasiData[] = [];

  for (let tahun = TAHUN_START; tahun <= TAHUN_END; tahun++) {
    for (let bulan = 1; bulan <= 12; bulan++) {
      
      let totalPerubahanAset = 0;
      let totalPerubahanLiabilitas = 0;
      let totalPerubahanEkuitas = 0;

      let totalPerubahanAsetRealisasi = 0;
      let totalPerubahanLiabilitasRealisasi = 0;
      let totalPerubahanEkuitasRealisasi = 0;

      // 1. Akun Pendapatan
      for (const akun of akunPendapatan) {
        for (const unit of unitPendapatan) {
          // Base: 200 jt - 500 jt, naik sedikit tiap bulan
          const base = randomRange(200_000_000, 500_000_000);
          const seasonality = 1 + (bulan * 0.02); // naik 2% tiap bulan
          const rkap = Math.round(base * seasonality);
          
          rkapBuffer.push({
            kode_akun: akun, kode_unit: unit, tahun, bulan,
            jumlah_rkap: rkap, keterangan: 'Anggaran pendapatan rutin'
          });

          // Realisasi: -15% to +20%
          let deviasi = randomRange(-0.15, 0.20);
          let ket: string | null = 'Realisasi pendapatan rutin';

          // Anomali check
          if (anomalyCount < MAX_ANOMALIES && Math.random() < 0.02) {
            deviasi = Math.random() > 0.5 ? randomRange(0.5, 0.8) : randomRange(-0.6, -0.4);
            ket = 'ANOMALI-DUMMY: perubahan pendapatan ekstrem tidak wajar untuk testing';
            anomalyCount++;
          }

          const realisasi = Math.round(rkap * (1 + deviasi));
          realisasiBuffer.push({
            kode_akun: akun, kode_unit: unit, tahun, bulan,
            jumlah_realisasi: realisasi, keterangan: ket
          });
        }
      }

      // 2. Akun Beban
      for (const akun of akunBeban) {
        for (const unit of unitBeban) {
          let base = randomRange(20_000_000, 100_000_000);
          // Gaji lebih besar
          if (akun === '5101') base = randomRange(80_000_000, 200_000_000);
          // Pemasaran besar di D02
          if (akun === '5102' && unit === 'D02') base = randomRange(100_000_000, 150_000_000);

          const rkap = Math.round(base);

          rkapBuffer.push({
            kode_akun: akun, kode_unit: unit, tahun, bulan,
            jumlah_rkap: rkap, keterangan: 'Anggaran beban operasional'
          });

          let deviasi = randomRange(-0.10, 0.15); // Beban deviasi lebih kecil
          let ket: string | null = 'Realisasi beban rutin';

          if (anomalyCount < MAX_ANOMALIES && Math.random() < 0.02) {
            deviasi = randomRange(0.6, 1.0); // Tiba-tiba melonjak
            ket = 'ANOMALI-DUMMY: kenaikan biaya tidak wajar untuk testing';
            anomalyCount++;
          }

          const realisasi = Math.round(rkap * (1 + deviasi));
          realisasiBuffer.push({
            kode_akun: akun, kode_unit: unit, tahun, bulan,
            jumlah_realisasi: realisasi, keterangan: ket
          });
        }
      }

      // 3. Akun Neraca (Hanya di unit KONS)
      // Karena ini sistem dummy, pastikan perubahan Aset = perubahan Liabilitas + Ekuitas
      // Aset
      const asetPergerakanRkap: number[] = [];
      const asetPergerakanRealisasi: number[] = [];
      const asetAkun = ['1101', '1102', '1103', '1104', '1201', '1202', '1203'];
      
      for (const akun of asetAkun) {
        const mvRkap = Math.round(randomRange(-50_000_000, 100_000_000));
        asetPergerakanRkap.push(mvRkap);
        totalPerubahanAset += mvRkap;

        const deviasi = randomRange(-0.15, 0.20);
        const mvRealisasi = Math.round(mvRkap * (1 + deviasi));
        asetPergerakanRealisasi.push(mvRealisasi);
        totalPerubahanAsetRealisasi += mvRealisasi;
      }

      // Liabilitas (ambil sedikit bagian dari aset)
      const liabilitasPergerakanRkap: number[] = [];
      const liabilitasPergerakanRealisasi: number[] = [];
      const liabilitasAkun = ['2101', '2102', '2103', '2201'];
      
      for (let i = 0; i < liabilitasAkun.length; i++) {
        const maxLiab = totalPerubahanAset * 0.2; // 20% porsi rata-rata
        const mvRkap = Math.round(randomRange(-20_000_000, Math.max(20_000_000, maxLiab)));
        liabilitasPergerakanRkap.push(mvRkap);
        totalPerubahanLiabilitas += mvRkap;

        const deviasi = randomRange(-0.15, 0.20);
        const mvRealisasi = Math.round(mvRkap * (1 + deviasi));
        liabilitasPergerakanRealisasi.push(mvRealisasi);
        totalPerubahanLiabilitasRealisasi += mvRealisasi;
      }

      // Ekuitas: Sisanya agar Total Aset = Total Liabilitas + Total Ekuitas
      // Kita pakai akun Laba Ditahan ('3102') sebagai penyeimbang
      const sisaRkap = totalPerubahanAset - totalPerubahanLiabilitas;
      const sisaRealisasi = totalPerubahanAsetRealisasi - totalPerubahanLiabilitasRealisasi;
      
      // Modal Disetor (3101) nol saja pergerakannya untuk dummy ini
      const ekuitasAkun = ['3101', '3102'];
      const ekuitasRkap = [0, sisaRkap];
      const ekuitasRealisasi = [0, sisaRealisasi];

      // Push Aset
      for (let i = 0; i < asetAkun.length; i++) {
        rkapBuffer.push({ kode_akun: asetAkun[i], kode_unit: 'KONS', tahun, bulan, jumlah_rkap: asetPergerakanRkap[i], keterangan: 'Pergerakan aset' });
        realisasiBuffer.push({ kode_akun: asetAkun[i], kode_unit: 'KONS', tahun, bulan, jumlah_realisasi: asetPergerakanRealisasi[i], keterangan: 'Realisasi aset' });
      }

      // Push Liabilitas
      for (let i = 0; i < liabilitasAkun.length; i++) {
        rkapBuffer.push({ kode_akun: liabilitasAkun[i], kode_unit: 'KONS', tahun, bulan, jumlah_rkap: liabilitasPergerakanRkap[i], keterangan: 'Pergerakan liabilitas' });
        realisasiBuffer.push({ kode_akun: liabilitasAkun[i], kode_unit: 'KONS', tahun, bulan, jumlah_realisasi: liabilitasPergerakanRealisasi[i], keterangan: 'Realisasi liabilitas' });
      }

      // Push Ekuitas
      for (let i = 0; i < ekuitasAkun.length; i++) {
        rkapBuffer.push({ kode_akun: ekuitasAkun[i], kode_unit: 'KONS', tahun, bulan, jumlah_rkap: ekuitasRkap[i], keterangan: 'Pergerakan ekuitas' });
        realisasiBuffer.push({ kode_akun: ekuitasAkun[i], kode_unit: 'KONS', tahun, bulan, jumlah_realisasi: ekuitasRealisasi[i], keterangan: 'Realisasi ekuitas' });
      }
    }
  }

  // Insert RKAP
  console.log(`Menyisipkan ${rkapBuffer.length} data RKAP...`);
  await insertInBatches('rkap_anggaran', rkapBuffer);

  // Insert Realisasi
  console.log(`Menyisipkan ${realisasiBuffer.length} data Realisasi...`);
  await insertInBatches('realisasi', realisasiBuffer);

  console.log("Selesai insert data!");

  // Verifikasi balance di akhir 2026
  await verifyBalance(2026, 12, 'Realisasi');
}

async function insertInBatches(table: string, data: any[], batchSize = 500) {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`Error inserting into ${table} (batch ${i}):`, error);
      process.exit(1);
    }
  }
}

async function verifyBalance(tahun: number, bulan: number, sumber: string) {
  console.log(`\nVerifikasi Neraca (${sumber} - ${tahun}/${bulan})...`);
  const { data, error } = await supabase
    .from('vw_neraca')
    .select('*')
    .eq('tahun', tahun)
    .eq('bulan', bulan)
    .eq('sumber', sumber);

  if (error) {
    console.error("Error fetching neraca:", error);
    return;
  }

  let totalAset = 0;
  let totalLiabilitasEkuitas = 0;

  for (const row of data) {
    if (row.kelompok === 'Aset') {
      totalAset += Number(row.saldo_akhir);
    } else if (row.kelompok === 'Liabilitas' || row.kelompok === 'Ekuitas') {
      totalLiabilitasEkuitas += Number(row.saldo_akhir);
    }
  }

  console.log(`Total Aset:               ${totalAset.toLocaleString('id-ID')}`);
  console.log(`Total Liabilitas+Ekuitas: ${totalLiabilitasEkuitas.toLocaleString('id-ID')}`);
  
  const diff = Math.abs(totalAset - totalLiabilitasEkuitas);
  if (diff < 1) { // Floating point allowance
    console.log("✅ VERIFIKASI BERHASIL: Aset = Liabilitas + Ekuitas (Balance)");
  } else {
    console.error(`❌ VERIFIKASI GAGAL: Selisih sebesar ${diff.toLocaleString('id-ID')}`);
  }
}

run().catch(console.error);
