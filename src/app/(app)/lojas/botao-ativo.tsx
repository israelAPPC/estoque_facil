"use client";

import { useState, useTransition } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Botao } from "@/components/ui/botao";
import { definirAtivoAction } from "./actions";

const CONFIRMACAO =
  "Desativar esta loja? Ela some das listas de escolha, mas o histórico é mantido.";

export function BotaoAtivo({ id, ativo }: { id: string; ativo: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  function alternar() {
    if (ativo && !window.confirm(CONFIRMACAO)) return;
    setErro(null);
    iniciar(async () => {
      const r = await definirAtivoAction(id, !ativo);
      setErro(r.erros.geral ?? null);
    });
  }
  return (
    <div className="flex flex-col gap-2">
      <Botao variante="secundario" onClick={alternar} disabled={pendente}>
        {ativo ? "Desativar" : "Reativar"}
      </Botao>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
    </div>
  );
}
