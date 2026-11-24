import { redirect } from "next/navigation";
import { obterUsuario } from "@/modules/autenticacao/sessao";
import { FormularioProduto } from "../formulario";

export const metadata = { title: "Novo produto | EstoqueFácil" };

export default async function NovoProdutoPage() {
  if (!(await obterUsuario())) redirect("/login");
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Novo produto</h1>
      <FormularioProduto
        valores={{
          nome: "",
          sku: "",
          categoria: "",
          fatorCaixa: 1,
          minimoCaixas: 0,
          minimoUnidades: 0,
        }}
      />
    </section>
  );
}
