"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterUsuario } from "@/modules/autenticacao/sessao";
import { criarRepositorioLojas } from "@/modules/lojas/repositorio";
import {
  criarLoja,
  definirAtivoLoja,
  type ErrosLoja,
  editarLoja,
  MENSAGEM_ERRO_GENERICO,
} from "@/modules/lojas/servico";

export interface EstadoLoja {
  erros: ErrosLoja;
}

const esquemaId = z.string().uuid();
const esquemaAtivo = z.boolean();

const ERRO_ENTRADA: EstadoLoja = { erros: { geral: MENSAGEM_ERRO_GENERICO } };

const NAO_AUTENTICADO: EstadoLoja = {
  erros: { geral: "Sessão expirada. Entre novamente." },
};

async function repositorio() {
  if (!(await obterUsuario())) return null;
  return criarRepositorioLojas(await criarClienteServidor());
}

export async function criarLojaAction(
  _anterior: EstadoLoja,
  dados: FormData,
): Promise<EstadoLoja> {
  const repo = await repositorio();
  if (!repo) return NAO_AUTENTICADO;
  const r = await criarLoja(repo, { nome: String(dados.get("nome") ?? "") });
  if (!r.ok) return { erros: r.erros };
  revalidatePath("/lojas");
  redirect("/lojas");
}

export async function editarLojaAction(
  id: string,
  _anterior: EstadoLoja,
  dados: FormData,
): Promise<EstadoLoja> {
  const repo = await repositorio();
  if (!repo) return NAO_AUTENTICADO;
  if (!esquemaId.safeParse(id).success) return ERRO_ENTRADA;
  const r = await editarLoja(repo, id, {
    nome: String(dados.get("nome") ?? ""),
  });
  if (!r.ok) return { erros: r.erros };
  revalidatePath("/lojas");
  redirect("/lojas");
}

export async function definirAtivoAction(
  id: string,
  ativo: boolean,
): Promise<EstadoLoja> {
  const repo = await repositorio();
  if (!repo) redirect("/login");
  if (
    !esquemaId.safeParse(id).success ||
    !esquemaAtivo.safeParse(ativo).success
  ) {
    return ERRO_ENTRADA;
  }
  const r = await definirAtivoLoja(repo, id, ativo);
  if (!r.ok) return { erros: r.erros };
  revalidatePath("/lojas");
  return { erros: {} };
}
