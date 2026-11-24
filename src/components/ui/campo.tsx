import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  rotulo: string;
  erro?: string;
};

export function Campo({ id, rotulo, erro, className = "", ...resto }: Props) {
  const idErro = `${id}-erro`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={`min-h-11 rounded-md border bg-fundo px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria ${erro ? "border-erro" : "border-borda"} ${className}`}
        {...resto}
      />
      {erro ? (
        <p id={idErro} className="text-sm text-erro">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
