'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';

export default function LabaRugiPage() {
  const [data, setData] = useState<any[]>([]);
  const [unitList, setUnitList] = useState<any[]>([]);
  
  const [filterTahun, setFilterTahun] = useState<number>(2025);
  const [filterUnit, setFilterUnit] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
    supabase.from('master_unit_kerja').select('*').then(({ data }) => setUnitList(data || []));
  }, [filterTahun, filterUnit]);

  async function fetchData() {
    let query = supabase.from('vw_laba_rugi_ringkas').select('*');
    if (filterTahun) query = query.eq('tahun', filterTahun);
    if (filterUnit) query = query.eq('kode_unit', filterUnit);

    const { data: result } = await query;
    if (result) setData(result);
  }

  const monthlyData: Record<number, any> = {};
  for (let i = 1; i <= 12; i++) monthlyData[i] = { bulan: i, rkap_pendapatan: 0, rkap_beban: 0, rkap_laba: 0, real_pendapatan: 0, real_beban: 0, real_laba: 0 };

  data.forEach(row => {
    const m = row.bulan;
    if (row.sumber === 'RKAP') {
      monthlyData[m].rkap_pendapatan += Number(row.total_pendapatan);
      monthlyData[m].rkap_beban += Number(row.total_beban);
      monthlyData[m].rkap_laba += Number(row.laba_bersih);
    } else {
      monthlyData[m].real_pendapatan += Number(row.total_pendapatan);
      monthlyData[m].real_beban += Number(row.total_beban);
      monthlyData[m].real_laba += Number(row.laba_bersih);
    }
  });

  const chartData = Object.values(monthlyData);
  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  const chartOptions: any = {
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4, borderRadiusApplication: 'end' } },
    colors: ['#64748b', '#0f172a'],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: { categories: chartData.map(d => `Bulan ${d.bulan}`), axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (val: number) => (val / 1000000).toFixed(0) + 'M' } },
    grid: { borderColor: 'rgba(226, 232, 240, 0.5)', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: { y: { formatter: (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val) } }
  };

  const chartSeries = [
    { name: 'RKAP Laba', data: chartData.map(d => d.rkap_laba) },
    { name: 'Realisasi Laba', data: chartData.map(d => d.real_laba) }
  ];

  const container: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item: any = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Laporan Laba Rugi</h1>
        <p className="text-muted-foreground mt-1">Perbandingan Pendapatan, Beban, dan Laba Bersih</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item} className="flex gap-4">
          <div className="w-48">
            <select className={selectClass} value={filterTahun} onChange={e => setFilterTahun(Number(e.target.value))}>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div className="w-64">
            <select className={selectClass} value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
              <option value="">Semua Unit (Konsolidasi)</option>
              {unitList.map(u => <option key={u.kode_unit} value={u.kode_unit}>{u.nama_unit}</option>)}
            </select>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Grafik Laba Bersih Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                {mounted && (
                  <ApexChart options={chartOptions} series={chartSeries} type="bar" height={400} width="100%" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-center border-r" rowSpan={2}>Bulan</TableHead>
                    <TableHead className="text-center border-r" colSpan={3}>RKAP</TableHead>
                    <TableHead className="text-center" colSpan={3}>Realisasi</TableHead>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">Pendapatan</TableHead>
                    <TableHead className="text-right">Beban</TableHead>
                    <TableHead className="text-right border-r">Laba Bersih</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                    <TableHead className="text-right">Beban</TableHead>
                    <TableHead className="text-right">Laba Bersih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map(row => (
                    <TableRow key={row.bulan}>
                      <TableCell className="text-center border-r font-medium">{row.bulan}</TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.rkap_pendapatan)}</TableCell>
                      <TableCell className="text-right text-destructive">{new Intl.NumberFormat('id-ID').format(row.rkap_beban)}</TableCell>
                      <TableCell className="text-right font-bold border-r">{new Intl.NumberFormat('id-ID').format(row.rkap_laba)}</TableCell>
                      
                      <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.real_pendapatan)}</TableCell>
                      <TableCell className="text-right text-destructive">{new Intl.NumberFormat('id-ID').format(row.real_beban)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{new Intl.NumberFormat('id-ID').format(row.real_laba)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
