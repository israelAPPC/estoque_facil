import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "EstoqueFácil",
  description: "Controle de estoque de múltiplas lojas",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}
