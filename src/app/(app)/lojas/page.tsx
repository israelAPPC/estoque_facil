import Link from "next/link";
import { redirect } from "next/navigation";
import { Aviso } from "@/components/ui/aviso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterUsuario } from "@/modules/autenticacao/sessao";
import { interpretarPagina } from "@/modules/lojas/pagina";
import { criarRepositorioLojas } from "@/modules/lojas/repositorio";
import { listarLojas } from "@/modules/lojas/servico";
import { BotaoAtivo } from "./botao-ativo";

export const metadata = { title: "Lojas | EstoqueFácil" };

const LINK =
  "inline-flex min-h-11 items-center rounded-md border border-borda px-4 font-semibold hover:bg-borda";

export default async function LojasPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string | string[] }>;
}) {
  if (!(await obterUsuario())) redirect("/login");
  const { pagina } = await searchParams;
  let dados: Awaited<ReturnType<typeof listarLojas>> | null = null;
  try {
    const repo = criarRepositorioLojas(await criarClienteServidor());
    dados = await listarLojas(repo, { pagina: interpretarPagina(pagina) });
  } catch {
    dados = null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Lojas</h1>
        <Link
          href="/lojas/nova"
          className="inline-flex min-h-11 items-center rounded-md border border-primaria bg-primaria px-4 font-semibold text-fundo"
        >
          Nova loja
        </Link>
      </div>
      {!dados ? (
        <Aviso tipo="erro">
          Não foi possível carregar as lojas. Tente novamente.
        </Aviso>
      ) : dados.itens.length === 0 ? (
        <p>Nenhuma loja cadastrada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dados.itens.map((loja) => (
            <li
              key={loja.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-borda p-3"
            >
              <div>
                <p className="font-semibold">{loja.nome}</p>
                <p className="text-sm">{loja.ativo ? "Ativa" : "Desativada"}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/lojas/${loja.id}`} className={LINK}>
                  Editar
                </Link>
                <BotaoAtivo id={loja.id} ativo={loja.ativo} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {dados && dados.totalPaginas > 1 ? (
        <nav
          aria-label="Paginação"
          className="flex items-center justify-between gap-3"
        >
          {dados.pagina > 1 ? (
            <Link href={`/lojas?pagina=${dados.pagina - 1}`} className={LINK}>
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span>
            Página {dados.pagina} de {dados.totalPaginas}
          </span>
          {dados.pagina < dados.totalPaginas ? (
            <Link href={`/lojas?pagina=${dados.pagina + 1}`} className={LINK}>
              Próxima
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
