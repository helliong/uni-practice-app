import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.scss";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Campus & Code",
  description: "Магазин IT и университетской атрибутики.",
};

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Providers } from "../context/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <Providers>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
