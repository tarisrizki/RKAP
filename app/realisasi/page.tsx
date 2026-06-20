'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function RealisasiPage() {
  const [data, setData] = useState<any[]>([]);
  const [akunList, setAkunList] = useState<any[]>([]);
  const [unitList, setUnitList] = useState<any[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [formTahun, setFormTahun] = useState<number>(2025);
  const [formBulan, setFormBulan] = useState<number>(1);
  const [formAkun, setFormAkun] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('');
  const [formJumlah, setFormJumlah] = useState<number>(0);
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    supabase.from('master_akun').select('*').order('kode_akun').then(({ data }) => setAkunList(data || []));
    supabase.from('master_unit_kerja').select('*').order('kode_unit').then(({ data }) => setUnitList(data || []));
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: result } = await supabase
      .from('realisasi')
      .select('*')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .limit(100);
    if (result) setData(result);
    setLoading(false);
  }

  async function handleSimpan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      kode_akun: formAkun,
      kode_unit: formUnit,
      tahun: formTahun,
      bulan: formBulan,
      jumlah_realisasi: formJumlah,
      keterangan: formKeterangan || null
    };

    const { error } = await supabase.from('realisasi').insert(payload);
    if (error) {
      toast.error('Gagal menyimpan: ' + error.message);
    } else {
      toast.success('Data realisasi berhasil disimpan.');
      setShowForm(false);
      fetchData();
    }
    setLoading(false);
  }

  async function hapusBaris(id: string) {
    if (!confirm('Hapus baris data ini?')) return;
    setLoading(true);
    await supabase.from('realisasi').delete().eq('id', id);
    fetchData();
  }

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Realisasi</h1>
          <p className="text-muted-foreground mt-1">Kelola data keuangan historis</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
          {showForm ? 'Batal' : '+ Tambah Data'}
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card>
            <CardHeader>
              <CardTitle>Form Input Realisasi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSimpan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tahun</label>
                  <Input type="number" value={formTahun} onChange={e => setFormTahun(Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bulan</label>
                  <Input type="number" min={1} max={12} value={formBulan} onChange={e => setFormBulan(Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Akun</label>
                  <select className={selectClass} value={formAkun} onChange={e => setFormAkun(e.target.value)} required>
                    <option value="">-- Pilih --</option>
                    {akunList.map(a => <option key={a.kode_akun} value={a.kode_akun}>{a.kode_akun} - {a.nama_akun}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Kerja</label>
                  <select className={selectClass} value={formUnit} onChange={e => setFormUnit(e.target.value)} required>
                    <option value="">-- Pilih --</option>
                    {unitList.map(u => <option key={u.kode_unit} value={u.kode_unit}>{u.kode_unit} - {u.nama_unit}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jumlah (Rp)</label>
                  <Input type="number" value={formJumlah} onChange={e => setFormJumlah(Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keterangan (Opsional)</label>
                  <Input type="text" value={formKeterangan} onChange={e => setFormKeterangan(e.target.value)} />
                </div>
                <div className="md:col-span-2 mt-2">
                  <Button type="submit" disabled={loading} className="w-full">{loading ? 'Loading...' : 'Simpan'}</Button>
                </div>
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
                <TableHead className="text-right">Jumlah Realisasi</TableHead>
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
                  <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.jumlah_realisasi)}</TableCell>
                  <TableCell className="text-muted-foreground">{row.keterangan || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => hapusBaris(row.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">Hapus</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && data.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Belum ada data Realisasi.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
