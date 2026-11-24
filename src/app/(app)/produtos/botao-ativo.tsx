"use client";

import { useActionState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Botao } from "@/components/ui/botao";
import { alterarAtivoAction, type EstadoAtivo } from "./actions";

const ESTADO_INICIAL: EstadoAtivo = { mensagem: null };

export function BotaoAtivo({ id, ativo }: { id: string; ativo: boolean }) {
  const [estado, acao, pendente] = useActionState(
    alterarAtivoAction,
    ESTADO_INICIAL,
  );
  return (
    <form
      action={acao}
      className="flex flex-col gap-2"
      onSubmit={(ev) => {
        if (ativo && !window.confirm("Desativar este produto?")) {
          ev.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="ativo" value={String(!ativo)} />
      <Botao type="submit" variante="secundario" disabled={pendente}>
        {ativo ? "Desativar" : "Reativar"}
      </Botao>
      {estado.mensagem ? <Aviso tipo="erro">{estado.mensagem}</Aviso> : null}
    </form>
  );
}
