"use client";

import { useActionState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { type EstadoLogin, entrarAction } from "./actions";

const ESTADO_INICIAL: EstadoLogin = { mensagem: null };

export function FormularioLogin() {
  const [estado, acao, pendente] = useActionState(entrarAction, ESTADO_INICIAL);
  return (
    <form action={acao} className="flex flex-col gap-4">
      {estado.mensagem ? <Aviso tipo="erro">{estado.mensagem}</Aviso> : null}
      <Campo
        id="email"
        name="email"
        type="email"
        rotulo="E-mail"
        autoComplete="username"
        required
      />
      <Campo
        id="senha"
        name="senha"
        type="password"
        rotulo="Senha"
        autoComplete="current-password"
        required
      />
      <Botao type="submit" disabled={pendente}>
        {pendente ? "Entrando..." : "Entrar"}
      </Botao>
    </form>
  );
}
