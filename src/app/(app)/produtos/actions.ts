"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterUsuario } from "@/modules/autenticacao/sessao";
import { lerFormularioProduto } from "@/modules/produtos/formulario";
import {
  LojasProdutoInvalidasError,
  MENSAGEM_ERRO_GENERICO,
  ProdutoNaoEncontradoError,
  SkuDuplicadoError,
} from "@/modules/produtos/regras";
import { criarRepositorioProdutos } from "@/modules/produtos/repositorio";
import {
  alterarAtivo,
  criarProduto,
  editarProduto,
} from "@/modules/produtos/servico";

export interface EstadoProduto {
  mensagem: string | null;
  erros: Record<string, string>;
}

const MENSAGEM_SESSAO = "Sessão expirada. Entre novamente.";

async function repositorio() {
  return criarRepositorioProdutos(await criarClienteServidor());
}

const esquemaId = z.string().uuid();
const esquemaAtivo = z.enum(["true", "false"]);

export async function salvarProdutoAction(
  _anterior: EstadoProduto,
  dados: FormData,
): Promise<EstadoProduto> {
  if (!(await obterUsuario())) return { mensagem: MENSAGEM_SESSAO, erros: {} };

  const { dados: produto, erros } = lerFormularioProduto(dados);
  if (!produto) return { mensagem: null, erros };

  const lojaIds = dados
    .getAll("lojaIds")
    .filter((v): v is string => typeof v === "string");
  const entrada = { ...produto, categoria: produto.categoria ?? undefined };
  const idBruto = dados.get("id");
  const id = idBruto ? esquemaId.safeParse(idBruto) : null;
  if (id && !id.success) {
    return { mensagem: MENSAGEM_ERRO_GENERICO, erros: {} };
  }

  try {
    const repo = await repositorio();
    if (id?.success) await editarProduto(repo, id.data, entrada, lojaIds);
    else await criarProduto(repo, entrada, lojaIds);
  } catch (e) {
    if (e instanceof LojasProdutoInvalidasError) {
      return { mensagem: null, erros: { lojaIds: e.message } };
    }
    if (e instanceof SkuDuplicadoError) {
      return { mensagem: null, erros: { sku: e.message } };
    }
    if (e instanceof ProdutoNaoEncontradoError) {
      return { mensagem: e.message, erros: {} };
    }
    console.error("[produtos] falha ao salvar");
    return { mensagem: MENSAGEM_ERRO_GENERICO, erros: {} };
  }
  revalidatePath("/produtos");
  redirect("/produtos");
}

export interface EstadoAtivo {
  mensagem: string | null;
}

export async function alterarAtivoAction(
  _anterior: EstadoAtivo,
  dados: FormData,
): Promise<EstadoAtivo> {
  if (!(await obterUsuario())) redirect("/login");
  const id = esquemaId.safeParse(dados.get("id"));
  const ativo = esquemaAtivo.safeParse(dados.get("ativo"));
  if (!id.success || !ativo.success) {
    return { mensagem: MENSAGEM_ERRO_GENERICO };
  }
  try {
    await alterarAtivo(await repositorio(), id.data, ativo.data === "true");
  } catch (e) {
    if (e instanceof ProdutoNaoEncontradoError) {
      return { mensagem: e.message };
    }
    console.error("[produtos] falha ao alterar situação");
    return { mensagem: MENSAGEM_ERRO_GENERICO };
  }
  revalidatePath("/produtos");
  return { mensagem: null };
}
