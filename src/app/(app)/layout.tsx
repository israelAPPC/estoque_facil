import type { ReactNode } from "react";
import { BarraInferior } from "@/components/barra-inferior";
import { MenuLateral } from "@/components/menu-lateral";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="md:flex">
      <MenuLateral />
      <main className="mx-auto w-full max-w-5xl p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-8">
        {children}
      </main>
      <BarraInferior />
    </div>
  );
}
