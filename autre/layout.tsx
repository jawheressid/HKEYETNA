import type { Metadata } from 'next';
import './globals.css';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import ChatbotWidget from '@/components/ChatbotWidget';

export const metadata: Metadata = {
  title: 'HKEYETNA — Explorez la Tunisie',
  description: 'Plateforme de tourisme IA pour découvrir la Tunisie authentique.',
  keywords: 'Tunisie, tourisme, voyage, IA, itinéraire, hôtels, activités',
};

const BACKGROUND_STICKERS = [
  { src: '/branding/sticker-fan.png', alt: 'Eventail', style: { top: '4%', left: '3%', width: 'clamp(56px, 7vw, 108px)', transform: 'rotate(-14deg)' } },
  { src: '/branding/sticker-khamsa.png', alt: 'Khamsa', style: { top: '14%', left: '22%', width: 'clamp(50px, 6vw, 90px)', transform: 'rotate(8deg)' } },
  { src: '/branding/sticker-bag.png', alt: 'Pochette', style: { top: '7%', right: '8%', width: 'clamp(62px, 8vw, 118px)', transform: 'rotate(12deg)' } },
  { src: '/branding/sticker-tea.png', alt: 'The', style: { top: '29%', left: '7%', width: 'clamp(58px, 7vw, 104px)', transform: 'rotate(-6deg)' } },
  { src: '/branding/sticker-tunisia.png', alt: 'Tunisia', style: { top: '36%', left: '28%', width: 'clamp(118px, 18vw, 230px)', transform: 'rotate(-4deg)' } },
  { src: '/branding/sticker-flowers.png', alt: 'Fleurs', style: { top: '24%', right: '6%', width: 'clamp(56px, 8vw, 108px)', transform: 'rotate(6deg)' } },
  { src: '/branding/sticker-door.png', alt: 'Porte', style: { top: '54%', left: '5%', width: 'clamp(62px, 9vw, 120px)', transform: 'rotate(-8deg)' } },
  { src: '/branding/sticker-fish.png', alt: 'Poisson', style: { top: '63%', left: '34%', width: 'clamp(66px, 10vw, 138px)', transform: 'rotate(10deg)' } },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-parchment">
        <div aria-hidden className="site-sticker-background">
          {BACKGROUND_STICKERS.map((sticker, index) => (
            <img key={`${sticker.src}-${index}`} src={sticker.src} alt={sticker.alt} className="site-sticker-item" style={sticker.style} loading="lazy" />
          ))}
        </div>
        <div className="relative z-10">
          <AuthProvider>
            <CurrencyProvider>
              <Navbar />
              <main>{children}</main>
              <ChatbotWidget />
            </CurrencyProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
