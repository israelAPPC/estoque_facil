"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sairAction } from "@/app/login/actions";
import { GRUPOS_MENU, itemAtivo } from "@/components/navegacao";

const FOCO =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria";

/** Menu lateral fixo, só no desktop. No celular vale a barra inferior. */
export function MenuLateral() {
  const caminho = usePathname();
  const ativo = itemAtivo(caminho);
  return (
    <nav
      aria-label="Menu principal"
      className="hidden border-r border-borda p-4 md:sticky md:top-0 md:block md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto"
    >
      <p className="mb-4 px-3 text-lg font-semibold">EstoqueFácil</p>
      <div className="flex flex-col gap-4">
        {GRUPOS_MENU.map((grupo) => {
          const idTitulo = `menu-grupo-${grupo.titulo.toLowerCase()}`;
          return (
            <section key={grupo.titulo} aria-labelledby={idTitulo}>
              <h2
                id={idTitulo}
                className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide"
              >
                {grupo.titulo}
              </h2>
              <ul className="flex flex-col gap-1">
                {grupo.itens.map((item) => {
                  const atual = item.rota === ativo;
                  return (
                    <li key={item.rota}>
                      <Link
                        href={item.rota}
                        aria-current={atual ? "page" : undefined}
                        className={`flex min-h-11 items-center rounded-md px-3 ${FOCO} ${
                          atual
                            ? "bg-primaria font-semibold text-fundo"
                            : "hover:bg-borda"
                        }`}
                      >
                        {item.rotulo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <form action={sairAction} className="mt-6 border-t border-borda pt-4">
        <button
          type="submit"
          className={`flex min-h-11 w-full items-center rounded-md px-3 text-left hover:bg-borda ${FOCO}`}
        >
          Sair
        </button>
      </form>
    </nav>
  );
}
