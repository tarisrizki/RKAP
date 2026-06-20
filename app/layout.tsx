import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Toaster } from '@/components/ui/sonner';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RKAP & Laporan Keuangan',
  description: 'Sistem Prototipe Internal RKAP',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${outfit.className} bg-background text-foreground flex h-screen overflow-hidden`}>
        <aside className="w-64 border-r bg-card flex flex-col shadow-sm z-10">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
              <span className="bg-primary text-primary-foreground p-1 rounded-md text-sm leading-none">RK</span>
              RKAP PRO
            </h1>
          </div>
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
            <Link href="/" className="block py-2.5 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
              Dashboard
            </Link>
            
            <div className="pt-6 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider px-4">Input Data</div>
            <Link href="/rkap" className="block py-2.5 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">Data RKAP</Link>
            <Link href="/realisasi" className="block py-2.5 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">Data Realisasi</Link>
            
            <div className="pt-6 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider px-4">Laporan</div>
            <Link href="/laporan/laba-rugi" className="block py-2.5 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">Laba Rugi</Link>
            <Link href="/laporan/neraca" className="block py-2.5 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">Neraca</Link>
            <Link href="/laporan/arus-kas" className="block py-2.5 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">Arus Kas</Link>
            <Link href="/laporan/variance" className="block py-2.5 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">Variance Analysis</Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto bg-muted/20">
          {children}
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
