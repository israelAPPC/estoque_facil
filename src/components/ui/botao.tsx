import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario";
};

const VARIANTES = {
  primario: "bg-primaria text-fundo border-primaria",
  secundario: "bg-fundo text-texto border-borda hover:bg-borda",
} as const;

export function Botao({
  variante = "primario",
  className = "",
  type = "button",
  ...resto
}: Props) {
  return (
    <button
      type={type}
      className={`min-h-11 rounded-md border px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria disabled:opacity-60 ${VARIANTES[variante]} ${className}`}
      {...resto}
    />
  );
}
