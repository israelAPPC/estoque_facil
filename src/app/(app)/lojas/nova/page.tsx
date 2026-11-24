import { criarLojaAction } from "../actions";
import { FormularioLoja } from "../formulario";

export const metadata = { title: "Nova loja | EstoqueFácil" };

export default function NovaLojaPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Nova loja</h1>
      <FormularioLoja acao={criarLojaAction} />
    </div>
  );
}
