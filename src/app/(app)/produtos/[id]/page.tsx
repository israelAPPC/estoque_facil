import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterUsuario } from "@/modules/autenticacao/sessao";
import { criarRepositorioProdutos } from "@/modules/produtos/repositorio";
import {
  listarLojasAtivas,
  obterLojasDoProduto,
  obterProduto,
} from "@/modules/produtos/servico";
import { paraCaixas } from "@/modules/produtos/unidades";
import { FormularioProduto } from "../formulario";

export const metadata = { title: "Editar produto | EstoqueFácil" };

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await obterUsuario())) redirect("/login");
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success) notFound();
  const repo = criarRepositorioProdutos(await criarClienteServidor());
  const p = await obterProduto(repo, id.data);
  if (!p) notFound();
  const [lojas, marcadas] = await Promise.all([
    listarLojasAtivas(repo),
    obterLojasDoProduto(repo, p.id),
  ]);
  const { caixas, unidades } = paraCaixas(p.estoqueMinimo, p.fatorCaixa);
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Editar produto</h1>
      <FormularioProduto
        lojas={lojas}
        valores={{
          id: p.id,
          nome: p.nome,
          sku: p.sku,
          categoria: p.categoria ?? "",
          fatorCaixa: p.fatorCaixa,
          minimoCaixas: caixas,
          minimoUnidades: unidades,
          lojaIdsMarcadas: marcadas,
        }}
      />
    </section>
  );
}
