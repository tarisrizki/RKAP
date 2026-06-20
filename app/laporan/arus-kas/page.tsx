'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';

export default function ArusKasPage() {
  const [data, setData] = useState<any[]>([]);
  const [filterTahun, setFilterTahun] = useState<number>(2025);
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [unitList, setUnitList] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
    supabase.from('master_unit_kerja').select('*').then(({ data }) => setUnitList(data || []));
  }, [filterTahun, filterUnit]);

  async function fetchData() {
    let query = supabase.from('vw_arus_kas').select('*');
    if (filterTahun) query = query.eq('tahun', filterTahun);
    if (filterUnit !== 'ALL') query = query.eq('unit_kode', filterUnit);

    const { data: result } = await query;
    if (result) setData(result);
  }

  const monthlyData: Record<number, any> = {};
  for (let i = 1; i <= 12; i++) monthlyData[i] = { bulan: i, operasi: 0, investasi: 0, pendanaan: 0, net_cash_flow: 0 };

  data.forEach(row => {
    const m = row.bulan;
    monthlyData[m].operasi += Number(row.kas_operasi);
    monthlyData[m].investasi += Number(row.kas_investasi);
    monthlyData[m].pendanaan += Number(row.kas_pendanaan);
    monthlyData[m].net_cash_flow += Number(row.net_cash_flow);
  });

  const chartData = Object.values(monthlyData);
  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  const chartOptions: any = {
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4, borderRadiusApplication: 'end' } },
    colors: ['#0f172a', '#ef4444', '#64748b'],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: { categories: chartData.map(d => `Bulan ${d.bulan}`), axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (val: number) => (val / 1000000).toFixed(0) + 'M' } },
    grid: { borderColor: 'rgba(226, 232, 240, 0.5)', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: { y: { formatter: (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val) } }
  };

  const chartSeries = [
    { name: 'Kas Operasi', data: chartData.map(d => d.operasi) },
    { name: 'Kas Investasi', data: chartData.map(d => d.investasi) },
    { name: 'Kas Pendanaan', data: chartData.map(d => d.pendanaan) }
  ];

  const container: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item: any = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Laporan Arus Kas</h1>
        <p className="text-muted-foreground mt-1">Ringkasan Aktivitas Operasi, Investasi, dan Pendanaan</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item} className="flex gap-4">
          <div className="w-48">
            <select className={selectClass} value={filterTahun} onChange={e => setFilterTahun(Number(e.target.value))}>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Net Cash Flow per Bulan</CardTitle>
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
                    <TableHead className="text-center border-r">Bulan</TableHead>
                    <TableHead className="text-right">Aktivitas Operasi</TableHead>
                    <TableHead className="text-right">Aktivitas Investasi</TableHead>
                    <TableHead className="text-right">Aktivitas Pendanaan</TableHead>
                    <TableHead className="text-right border-l font-bold">Net Cash Flow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map(row => (
                    <TableRow key={row.bulan}>
                      <TableCell className="text-center border-r font-medium">{row.bulan}</TableCell>
                      <TableCell className={`text-right ${row.operasi < 0 ? 'text-destructive' : ''}`}>{new Intl.NumberFormat('id-ID').format(row.operasi)}</TableCell>
                      <TableCell className={`text-right ${row.investasi < 0 ? 'text-destructive' : ''}`}>{new Intl.NumberFormat('id-ID').format(row.investasi)}</TableCell>
                      <TableCell className={`text-right ${row.pendanaan < 0 ? 'text-destructive' : ''}`}>{new Intl.NumberFormat('id-ID').format(row.pendanaan)}</TableCell>
                      <TableCell className={`text-right border-l font-bold ${row.net_cash_flow < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {new Intl.NumberFormat('id-ID').format(row.net_cash_flow)}
                      </TableCell>
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
