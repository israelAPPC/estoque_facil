"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import type { EstadoLoja } from "./actions";

type Acao = (anterior: EstadoLoja, dados: FormData) => Promise<EstadoLoja>;

export function FormularioLoja({
  acao,
  nomeInicial = "",
}: {
  acao: Acao;
  nomeInicial?: string;
}) {
  const [estado, enviar, pendente] = useActionState(acao, { erros: {} });
  return (
    <form action={enviar} className="flex max-w-md flex-col gap-4">
      {estado.erros.geral ? (
        <Aviso tipo="erro">{estado.erros.geral}</Aviso>
      ) : null}
      <Campo
        id="nome"
        name="nome"
        rotulo="Nome da loja"
        defaultValue={nomeInicial}
        maxLength={80}
        required
        erro={estado.erros.nome}
      />
      <div className="flex gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar"}
        </Botao>
        <Link
          href="/lojas"
          className="inline-flex min-h-11 items-center rounded-md border border-borda px-4 font-semibold hover:bg-borda"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
