import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'HealthcareComm — ჯანდაცვის პოლიტიკისა და მენეჯმენტის სივრცე',
  description: 'ჯანდაცვის პოლიტიკის, მენეჯმენტისა და კვლევების პროფესიული სივრცე',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" className="dark">
      <body className="min-h-screen bg-[#f1f5f9] text-[#17283e] dark:bg-[#090e17] dark:text-[#f1f5f9] antialiased flex flex-col pb-16 md:pb-0 transition-colors">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
