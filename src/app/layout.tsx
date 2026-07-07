import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compra Inteligente",
  description: "Sistema para simular creditos vehiculares Compra Inteligente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
