'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function VariancePage() {
  const [data, setData] = useState<any[]>([]);
  const [filterTahun, setFilterTahun] = useState<string>('2025');

  useEffect(() => {
    fetchData();
  }, [filterTahun]);

  async function fetchData() {
    let query = supabase.from('vw_variance_rkap_realisasi').select('*');
    if (filterTahun) query = query.eq('tahun', filterTahun);

    const { data: result } = await query;
    if (result) setData(result);
  }

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const container: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item: any = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Variance Analysis</h1>
        <p className="text-muted-foreground mt-1">Perbandingan Detail RKAP vs Realisasi per Akun dan Unit</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item} className="flex gap-4">
          <div className="w-48">
            <select className={selectClass} value={filterTahun} onChange={e => setFilterTahun(e.target.value)}>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Rincian Deviasi Anggaran</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Periode</TableHead>
                    <TableHead>Akun</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">RKAP</TableHead>
                    <TableHead className="text-right">Realisasi</TableHead>
                    <TableHead className="text-right">Selisih Nominal</TableHead>
                    <TableHead className="text-right">Selisih %</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => {
                    const pct = Number(row.persen_selisih || 0);
                    // Peringatan jika selisih absolut > 20%
                    const isWarning = Math.abs(pct) > 20 && Number(row.jumlah_rkap) !== 0;
                    
                    return (
                      <TableRow key={idx}>
                        <TableCell>{row.tahun}-{row.bulan.toString().padStart(2, '0')}</TableCell>
                        <TableCell className="font-medium">{row.kode_akun}</TableCell>
                        <TableCell>{row.kode_unit}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.jumlah_rkap)}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.jumlah_realisasi)}</TableCell>
                        <TableCell className="text-right font-medium">{new Intl.NumberFormat('id-ID').format(row.selisih)}</TableCell>
                        <TableCell className={`text-right font-medium ${isWarning ? 'text-destructive' : ''}`}>
                          {row.jumlah_rkap === 0 ? 'N/A' : `${pct.toFixed(2)}%`}
                        </TableCell>
                        <TableCell className="text-center">
                          {isWarning ? (
                            <Badge variant="destructive">OVER LIMIT</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Aman</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">Tidak ada data untuk tahun ini.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
