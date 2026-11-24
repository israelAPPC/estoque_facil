export type ItemMenu = { rota: string; rotulo: string };
export type GrupoMenu = { titulo: string; itens: readonly ItemMenu[] };

/** Fonte única do menu: o desktop mostra os dois grupos; o celular deriva daqui. */
export const GRUPOS_MENU: readonly GrupoMenu[] = [
  {
    titulo: "Estoque",
    itens: [
      { rota: "/estoque", rotulo: "Estoque" },
      { rota: "/contagens", rotulo: "Contagens" },
      { rota: "/requisicoes", rotulo: "Requisições" },
      { rota: "/historico", rotulo: "Histórico" },
    ],
  },
  {
    titulo: "Cadastro",
    itens: [
      { rota: "/produtos", rotulo: "Produtos" },
      { rota: "/lojas", rotulo: "Lojas" },
    ],
  },
];

const TITULO_GRUPO_BARRA = "Estoque";
const TITULO_GRUPO_MAIS = "Cadastro";

/** Busca o grupo pelo título; falha alto se não existir. */
export function buscarGrupo(
  grupos: readonly GrupoMenu[],
  titulo: string,
): GrupoMenu {
  const grupo = grupos.find((g) => g.titulo === titulo);
  if (!grupo) throw new Error(`Grupo de menu não encontrado: ${titulo}`);
  return grupo;
}

const GRUPO_BARRA = buscarGrupo(GRUPOS_MENU, TITULO_GRUPO_BARRA);
const GRUPO_MAIS = buscarGrupo(GRUPOS_MENU, TITULO_GRUPO_MAIS);

/** Lista plana na ordem dos grupos. */
export const ITENS_MENU: readonly ItemMenu[] = GRUPOS_MENU.flatMap(
  (g) => g.itens,
);

/** Devolve a rota do item de menu ativo para o caminho atual, ou null. */
export function itemAtivo(caminho: string): string | null {
  if (caminho === "/") return "/estoque";
  const item = ITENS_MENU.find(
    (i) => caminho === i.rota || caminho.startsWith(`${i.rota}/`),
  );
  return item ? item.rota : null;
}

/** Itens fixos da barra inferior no celular (grupo Estoque). */
export const ITENS_BARRA: readonly ItemMenu[] = GRUPO_BARRA.itens;

/** Cabeçalho da lista aberta pelo "Mais" no celular. */
export const TITULO_MAIS: string = GRUPO_MAIS.titulo;

/** Itens que ficam dentro do "Mais" no celular (além de Sair). */
export const ITENS_MAIS: readonly ItemMenu[] = GRUPO_MAIS.itens;

/** O "Mais" fica ativo quando a página atual é um dos seus itens. */
export function maisAtivo(caminho: string): boolean {
  const ativo = itemAtivo(caminho);
  return ativo !== null && ITENS_MAIS.some((i) => i.rota === ativo);
}
