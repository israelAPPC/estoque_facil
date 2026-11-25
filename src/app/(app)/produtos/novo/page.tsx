import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterUsuario } from "@/modules/autenticacao/sessao";
import { criarRepositorioProdutos } from "@/modules/produtos/repositorio";
import { listarLojasAtivas } from "@/modules/produtos/servico";
import { FormularioProduto } from "../formulario";

export const metadata = { title: "Novo produto | EstoqueFácil" };

export default async function NovoProdutoPage() {
  if (!(await obterUsuario())) redirect("/login");
  const lojas = await listarLojasAtivas(
    criarRepositorioProdutos(await criarClienteServidor()),
  );
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Novo produto</h1>
      <FormularioProduto
        lojas={lojas}
        valores={{
          nome: "",
          sku: "",
          categoria: "",
          fatorCaixa: 1,
          minimoCaixas: 0,
          minimoUnidades: 0,
          lojaIdsMarcadas: lojas.map((l) => l.id),
        }}
      />
    </section>
  );
}
