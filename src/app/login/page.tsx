import { FormularioLogin } from "./formulario";

export const metadata = { title: "Entrar | EstoqueFácil" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold">EstoqueFácil</h1>
      <FormularioLogin />
    </main>
  );
}
