import type { ReactNode } from "react";

type Tipo = "erro" | "aviso" | "sucesso";

const ESTILO: Record<Tipo, { borda: string; titulo: string }> = {
  erro: { borda: "border-erro", titulo: "Erro" },
  aviso: { borda: "border-aviso", titulo: "Atenção" },
  sucesso: { borda: "border-primaria", titulo: "Pronto" },
};

export function Aviso({ tipo, children }: { tipo: Tipo; children: ReactNode }) {
  const { borda, titulo } = ESTILO[tipo];
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-md border-l-4 border-y border-r bg-fundo p-3 ${borda} border-y-borda border-r-borda`}
    >
      <strong>{titulo}: </strong>
      {children}
    </div>
  );
}
