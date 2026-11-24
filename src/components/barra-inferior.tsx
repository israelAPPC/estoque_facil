"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sairAction } from "@/app/login/actions";
import {
  ITENS_BARRA,
  ITENS_MAIS,
  itemAtivo,
  maisAtivo,
  TITULO_MAIS,
} from "@/components/navegacao";

const FOCO =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria";
const ITEM =
  "flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs";

const ICONES: Record<string, string> = {
  "/estoque": "M3 7l9-4 9 4v10l-9 4-9-4V7zm9 4v10M3 7l9 4 9-4",
  "/contagens": "M5 4h14v16H5zM9 9h6M9 13h6M9 17h3",
  "/requisicoes": "M4 12h14m-5-5l5 5-5 5",
  "/historico": "M12 7v5l3 2M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4",
  mais: "M5 12h.01M12 12h.01M19 12h.01",
  sair: "M10 5H5v14h5M14 8l4 4-4 4M18 12H9",
};

function Icone({ nome }: { nome: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONES[nome]} />
    </svg>
  );
}

/** Barra fixa embaixo, só no celular. */
export function BarraInferior() {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const ativo = itemAtivo(caminho);
  const maisAtual = maisAtivo(caminho);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fecha a lista ao navegar
  useEffect(() => {
    setAberto(false);
  }, [caminho]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botao.current?.focus();
      }
    };
    const aoTocarFora = (e: PointerEvent) => {
      if (e.target instanceof Node && !menu.current?.contains(e.target)) {
        setAberto(false);
      }
    };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("pointerdown", aoTocarFora);
    // Ao abrir, o foco vai para o primeiro item do painel.
    painel.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("pointerdown", aoTocarFora);
    };
  }, [aberto]);

  const cor = (atual: boolean) =>
    atual ? "font-semibold text-primaria" : "text-texto";

  return (
    <nav
      ref={menu}
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-borda bg-fundo pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {aberto && (
        <div
          ref={painel}
          id="lista-mais"
          className="absolute right-2 bottom-full mb-2 min-w-44 rounded-md border border-borda bg-fundo p-1"
        >
          <p
            id="titulo-mais"
            className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide"
          >
            {TITULO_MAIS}
          </p>
          <ul aria-labelledby="titulo-mais">
            {ITENS_MAIS.map((item) => (
              <li key={item.rota}>
                <Link
                  href={item.rota}
                  aria-current={item.rota === ativo ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-md px-3 ${FOCO} ${cor(item.rota === ativo)}`}
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
            <li>
              <form action={sairAction}>
                <button
                  type="submit"
                  className={`flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left ${FOCO}`}
                >
                  <Icone nome="sair" />
                  Sair
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
      <ul className="flex">
        {ITENS_BARRA.map((item) => {
          const atual = item.rota === ativo;
          return (
            <li key={item.rota} className="flex flex-1">
              <Link
                href={item.rota}
                aria-current={atual ? "page" : undefined}
                className={`${ITEM} ${FOCO} ${cor(atual)}`}
              >
                <Icone nome={item.rota} />
                {item.rotulo}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button
            ref={botao}
            type="button"
            aria-expanded={aberto}
            aria-controls="lista-mais"
            onClick={() => setAberto((v) => !v)}
            className={`${ITEM} ${FOCO} ${cor(maisAtual)}`}
          >
            <Icone nome="mais" />
            Mais
          </button>
        </li>
      </ul>
    </nav>
  );
}
