'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';



export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const TAHUN = 2025;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    const { data: result } = await supabase
      .from('vw_laba_rugi_ringkas')
      .select('*')
      .eq('tahun', TAHUN);

    if (result) setData(result);
  }

  let totalPendapatanRkap = 0, totalBebanRkap = 0, labaRkap = 0;
  let totalPendapatanReal = 0, totalBebanReal = 0, labaReal = 0;

  const monthlyData: Record<number, any> = {};
  for (let i = 1; i <= 12; i++) {
    monthlyData[i] = { bulan: i, rkap_laba: 0, real_laba: 0 };
  }

  data.forEach(row => {
    const isRkap = row.sumber === 'RKAP';
    const pendapatan = Number(row.total_pendapatan);
    const beban = Number(row.total_beban);
    const laba = Number(row.laba_bersih);

    if (isRkap) {
      totalPendapatanRkap += pendapatan;
      totalBebanRkap += beban;
      labaRkap += laba;
      monthlyData[row.bulan].rkap_laba += laba;
    } else {
      totalPendapatanReal += pendapatan;
      totalBebanReal += beban;
      labaReal += laba;
      monthlyData[row.bulan].real_laba += laba;
    }
  });

  const chartData = Object.values(monthlyData);

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const chartOptions: any = {
    chart: {
      type: 'area',
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false },
      dropShadow: { enabled: true, color: '#000', top: 18, left: 7, blur: 10, opacity: 0.1 }
    },
    colors: ['#64748b', '#0f172a'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: [2, 3], dashArray: [5, 0] },
    xaxis: {
      categories: chartData.map(d => `Bulan ${d.bulan}`),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (val: number) => (val / 1000000).toFixed(0) + 'M' }
    },
    grid: { borderColor: 'rgba(226, 232, 240, 0.5)', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: {
      y: { formatter: (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val) }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    }
  };

  const chartSeries = [
    { name: 'RKAP', data: chartData.map(d => d.rkap_laba) },
    { name: 'Realisasi', data: chartData.map(d => d.real_laba) }
  ];

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Keuangan {TAHUN}</h1>
        <p className="text-muted-foreground mt-1">Ringkasan kinerja perusahaan tahun berjalan.</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Pendapatan (Real)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPendapatanReal)}</div>
              <p className="text-sm text-muted-foreground mt-2">RKAP: {new Intl.NumberFormat('id-ID').format(totalPendapatanRkap)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Beban (Real)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalBebanReal)}</div>
              <p className="text-sm text-muted-foreground mt-2">RKAP: {new Intl.NumberFormat('id-ID').format(totalBebanRkap)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-primary text-primary-foreground border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80 uppercase">Laba Bersih (Real)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(labaReal)}</div>
              <p className="text-sm text-primary-foreground/80 mt-2">RKAP: {new Intl.NumberFormat('id-ID').format(labaRkap)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={item} initial="hidden" animate="show">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tren Laba Bersih {TAHUN}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {mounted && (
                <ApexChart options={chartOptions} series={chartSeries} type="area" height={400} width="100%" />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
