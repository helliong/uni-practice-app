'use client';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from './CartContext';
import { ThemeProvider } from './ThemeContext';
import { FavoritesProvider } from './FavoritesContext';
import CookieBanner from '@/components/layout/CookieBanner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <FavoritesProvider>
          <CartProvider>
            {children}
            <CookieBanner />
          </CartProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
