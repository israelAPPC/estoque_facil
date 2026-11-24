"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { type EstadoProduto, salvarProdutoAction } from "./actions";

const ESTADO_INICIAL: EstadoProduto = { mensagem: null, erros: {} };

export interface ValoresProduto {
  id?: string;
  nome: string;
  sku: string;
  categoria: string;
  fatorCaixa: number;
  minimoCaixas: number;
  minimoUnidades: number;
}

export function FormularioProduto({ valores }: { valores: ValoresProduto }) {
  const [estado, acao, pendente] = useActionState(
    salvarProdutoAction,
    ESTADO_INICIAL,
  );
  const e = estado.erros;
  return (
    <form action={acao} className="flex max-w-xl flex-col gap-4">
      {estado.mensagem ? <Aviso tipo="erro">{estado.mensagem}</Aviso> : null}
      {valores.id ? <input type="hidden" name="id" value={valores.id} /> : null}
      <Campo
        id="nome"
        name="nome"
        rotulo="Nome"
        defaultValue={valores.nome}
        erro={e.nome}
        required
      />
      <Campo
        id="sku"
        name="sku"
        rotulo="Código (SKU)"
        defaultValue={valores.sku}
        erro={e.sku}
        required
      />
      <Campo
        id="categoria"
        name="categoria"
        rotulo="Categoria (opcional)"
        defaultValue={valores.categoria}
        erro={e.categoria}
      />
      <Campo
        id="fatorCaixa"
        name="fatorCaixa"
        rotulo="Unidades por caixa (use 1 se não vem em caixa)"
        inputMode="numeric"
        defaultValue={valores.fatorCaixa}
        erro={e.fatorCaixa}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">Estoque mínimo</legend>
        <div className="grid grid-cols-2 gap-3">
          <Campo
            id="minimoCaixas"
            name="minimoCaixas"
            rotulo="Caixas"
            inputMode="numeric"
            defaultValue={valores.minimoCaixas}
            erro={e.minimoCaixas}
          />
          <Campo
            id="minimoUnidades"
            name="minimoUnidades"
            rotulo="Unidades"
            inputMode="numeric"
            defaultValue={valores.minimoUnidades}
            erro={e.minimoUnidades ?? e.estoqueMinimo}
          />
        </div>
      </fieldset>
      <div className="flex gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar"}
        </Botao>
        <Link
          href="/produtos"
          className="inline-flex min-h-11 items-center rounded-md border border-borda px-4 font-semibold hover:bg-borda"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
