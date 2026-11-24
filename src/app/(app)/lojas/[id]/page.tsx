import { notFound, redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterUsuario } from "@/modules/autenticacao/sessao";
import { criarRepositorioLojas } from "@/modules/lojas/repositorio";
import { obterLoja } from "@/modules/lojas/servico";
import { editarLojaAction } from "../actions";
import { FormularioLoja } from "../formulario";

export const metadata = { title: "Editar loja | EstoqueFácil" };

export default async function EditarLojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await obterUsuario())) redirect("/login");
  const { id } = await params;
  const loja = await obterLoja(
    criarRepositorioLojas(await criarClienteServidor()),
    id,
  );
  if (!loja) notFound();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Editar loja</h1>
      <FormularioLoja
        acao={editarLojaAction.bind(null, id)}
        nomeInicial={loja.nome}
      />
    </div>
  );
}
