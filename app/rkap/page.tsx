'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function RkapPage() {
  const [data, setData] = useState<any[]>([]);
  const [akunList, setAkunList] = useState<any[]>([]);
  const [unitList, setUnitList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formTahun, setFormTahun] = useState<number>(2025);
  const [formAkun, setFormAkun] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('');
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formNilaiBulan, setFormNilaiBulan] = useState<number[]>(Array(12).fill(0));
  
  const [loadingAi, setLoadingAi] = useState(false);
  const [pesanAi, setPesanAi] = useState('');

  useEffect(() => {
    fetchData();
    supabase.from('master_akun').select('*').order('kode_akun').then(({ data }) => setAkunList(data || []));
    supabase.from('master_unit_kerja').select('*').order('kode_unit').then(({ data }) => setUnitList(data || []));
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: result } = await supabase
      .from('rkap_anggaran')
      .select('*')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .limit(100);
    if (result) setData(result);
    setLoading(false);
  }

  async function handleMintaSaranAi() {
    if (!formAkun || !formUnit) {
      toast.error("Pilih Akun dan Unit terlebih dahulu.");
      return;
    }
    setLoadingAi(true);
    setPesanAi('Mengambil data historis...');

    try {
      const { data: realisasiData } = await supabase
        .from('realisasi')
        .select('tahun, bulan, jumlah_realisasi')
        .eq('kode_akun', formAkun)
        .eq('kode_unit', formUnit)
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false })
        .limit(12);

      if (!realisasiData || realisasiData.length === 0) {
        setPesanAi('Belum ada data historis realisasi untuk diprediksi.');
        setLoadingAi(false);
        return;
      }

      realisasiData.reverse();
      setPesanAi('Meminta saran dari AI...');

      const res = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kode_akun: formAkun, 
          kode_unit: formUnit,
          data_realisasi_12_bulan_terakhir: realisasiData
        })
      });

      const result = await res.json();
      
      if (res.ok && result.prediksi_bulanan && result.prediksi_bulanan.length === 12) {
        setFormNilaiBulan(result.prediksi_bulanan.map((v: number) => Math.round(v)));
        toast.success(`Berhasil! Alasan AI: ${result.alasan || '-'}`);
        setPesanAi(`Selesai diprediksi AI.`);
      } else {
        toast.error(result.error || 'Gagal memproses data dari AI.');
        setPesanAi(result.error || 'Gagal memproses data dari AI.');
      }

    } catch (e) {
      toast.error('Terjadi kesalahan jaringan.');
      setPesanAi('Terjadi kesalahan jaringan.');
    }
    setLoadingAi(false);
  }

  async function handleSimpanForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formAkun || !formUnit) {
      toast.error("Harap lengkapi Akun dan Unit!");
      return;
    }

    setLoading(true);
    
    const barisBaru = formNilaiBulan.map((nilai, index) => ({
      kode_akun: formAkun,
      kode_unit: formUnit,
      tahun: formTahun,
      bulan: index + 1,
      jumlah_rkap: nilai,
      keterangan: formKeterangan || null
    }));

    const { error } = await supabase.from('rkap_anggaran').insert(barisBaru);

    if (error) {
      toast.error('Gagal menyimpan: ' + error.message);
    } else {
      toast.success('Berhasil menyimpan 12 bulan RKAP!');
      setShowForm(false);
      fetchData();
    }
    setLoading(false);
  }

  async function hapusBaris(id: string) {
    if (!confirm('Hapus baris data ini?')) return;
    setLoading(true);
    await supabase.from('rkap_anggaran').delete().eq('id', id);
    fetchData();
  }

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data RKAP</h1>
          <p className="text-muted-foreground mt-1">Kelola Rencana Kerja dan Anggaran Perusahaan</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
          {showForm ? 'Tutup Form' : '+ Tambah RKAP 12 Bulan'}
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Input RKAP Tahunan</CardTitle>
              <CardDescription>Masukkan rincian akun dan angka bulanan, atau minta saran dari AI berdasarkan riwayat data.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSimpanForm} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Tahun</label>
                    <Input type="number" value={formTahun} onChange={e => setFormTahun(Number(e.target.value))} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Keterangan (Opsional)</label>
                    <Input type="text" value={formKeterangan} onChange={e => setFormKeterangan(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Akun</label>
                    <select className={selectClass} value={formAkun} onChange={e => setFormAkun(e.target.value)} required>
                      <option value="">-- Pilih Akun --</option>
                      {akunList.map(a => <option key={a.kode_akun} value={a.kode_akun}>{a.kode_akun} - {a.nama_akun}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Unit Kerja</label>
                    <select className={selectClass} value={formUnit} onChange={e => setFormUnit(e.target.value)} required>
                      <option value="">-- Pilih Unit --</option>
                      {unitList.map(u => <option key={u.kode_unit} value={u.kode_unit}>{u.kode_unit} - {u.nama_unit}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-primary">Prediksi Otomatis AI</h3>
                    <p className="text-sm text-muted-foreground">Minta bantuan AI mengisi nilai draft 12 bulan berdasarkan tren realisasi 12 bulan terakhir.</p>
                    {pesanAi && <p className="text-sm font-medium mt-2 text-purple-600 dark:text-purple-400 italic">{pesanAi}</p>}
                  </div>
                  <Button type="button" onClick={handleMintaSaranAi} disabled={loadingAi} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                    {loadingAi ? 'Memproses...' : '✨ Saran AI'}
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Nilai Bulanan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {formNilaiBulan.map((nilai, index) => (
                      <div key={index} className="space-y-1">
                        <label className="text-xs text-muted-foreground">Bulan {index + 1}</label>
                        <Input 
                          type="number" 
                          value={nilai} 
                          onChange={e => {
                            const newValues = [...formNilaiBulan];
                            newValues[index] = Number(e.target.value);
                            setFormNilaiBulan(newValues);
                          }} 
                          required 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Menyimpan...' : 'Simpan 12 Baris RKAP'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : data.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.tahun}-{row.bulan.toString().padStart(2, '0')}</TableCell>
                  <TableCell>{row.kode_akun}</TableCell>
                  <TableCell>{row.kode_unit}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.jumlah_rkap)}</TableCell>
                  <TableCell className="text-muted-foreground">{row.keterangan || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => hapusBaris(row.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">Hapus</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && data.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Belum ada data RKAP.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
