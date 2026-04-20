import type { Metadata } from 'next';
import './globals.css';
import { CurrencyProvider } from '@/context/CurrencyContext';
import Navbar from '@/components/Navbar';
import ChatbotWidget from '@/components/ChatbotWidget';

export const metadata: Metadata = {
  title: 'HKEYETNA — Explorez la Tunisie',
  description: 'Plateforme de tourisme IA pour découvrir la Tunisie authentique. Générez des voyages personnalisés, explorez des lieux magiques.',
  keywords: 'Tunisie, tourisme, voyage, IA, itinéraire, hôtels, activités',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-parchment">
        <CurrencyProvider>
          <Navbar />
          <main>{children}</main>
          <ChatbotWidget />
        </CurrencyProvider>
      </body>
    </html>
  );
}
