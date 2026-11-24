import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterUsuario } from "@/modules/autenticacao/sessao";
import { descreverEstoqueMinimo } from "@/modules/produtos/formulario";
import { criarRepositorioProdutos } from "@/modules/produtos/repositorio";
import {
  listarProdutos,
  TAMANHO_PAGINA_PADRAO,
} from "@/modules/produtos/servico";
import { BotaoAtivo } from "./botao-ativo";

export const metadata = { title: "Produtos | EstoqueFácil" };

const LINK =
  "inline-flex min-h-11 items-center rounded-md border border-borda px-4 font-semibold hover:bg-borda";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  if (!(await obterUsuario())) redirect("/login");
  const { pagina } = await searchParams;
  const r = await listarProdutos(
    criarRepositorioProdutos(await criarClienteServidor()),
    {
      pagina: Number(pagina ?? 1),
      tamanho: TAMANHO_PAGINA_PADRAO,
    },
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Link
          href="/produtos/novo"
          className="inline-flex min-h-11 items-center rounded-md border border-primaria bg-primaria px-4 font-semibold text-fundo"
        >
          Novo produto
        </Link>
      </div>

      {r.itens.length === 0 ? <p>Nenhum produto cadastrado.</p> : null}

      <ul className="flex flex-col gap-3">
        {r.itens.map((p) => (
          <li
            key={p.id}
            className="flex flex-col gap-2 rounded-md border border-borda p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="break-words font-semibold">
                {p.nome}
                {p.ativo ? null : " (inativo)"}
              </p>
              <p className="break-words text-sm">
                SKU {p.sku}
                {p.categoria ? ` · ${p.categoria}` : ""}
              </p>
              <p className="text-sm">
                {p.fatorCaixa > 1
                  ? `Caixa com ${p.fatorCaixa} un`
                  : "Sem caixa"}
                {" · Mínimo: "}
                {descreverEstoqueMinimo(p.estoqueMinimo, p.fatorCaixa)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/produtos/${p.id}`} className={LINK}>
                Editar
              </Link>
              <BotaoAtivo id={p.id} ativo={p.ativo} />
            </div>
          </li>
        ))}
      </ul>

      {r.totalPaginas > 1 ? (
        <nav
          className="flex items-center justify-between gap-3"
          aria-label="Paginação"
        >
          {r.pagina > 1 ? (
            <Link href={`/produtos?pagina=${r.pagina - 1}`} className={LINK}>
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span>
            Página {r.pagina} de {r.totalPaginas}
          </span>
          {r.pagina < r.totalPaginas ? (
            <Link href={`/produtos?pagina=${r.pagina + 1}`} className={LINK}>
              Próxima
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  );
}
